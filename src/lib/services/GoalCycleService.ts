// src/lib/services/GoalCycleService.ts
// ════════════════════════════════════════════════════════════════════════════
// GOAL CYCLE SERVICE — ciclo de metas (contenedor temporal). Gate B.
// El candado de singleton "1 ACTIVE por cuenta" vive en activate() (advisory lock).
// Estados: PLANNING → ASSIGNING → ACTIVE → CLOSING → CLOSED
//   activate()      : (PLANNING|ASSIGNING) → ACTIVE   [candado]
//   closeCycle()    : ACTIVE → CLOSING
//   finalizeCycle() : CLOSING → CLOSED (activa lockAfterClosure)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { GoalCycle, GoalPeriodType } from '@prisma/client'
import { GoalsService, CycleClosureDecision, CycleClosureSummary } from './GoalsService'

// ── Errores de dominio (Gate C los mapea a HTTP) ─────────────────────────────
export class GoalCycleActiveError extends Error {
  readonly code = 'GOAL_CYCLE_ALREADY_ACTIVE'
  constructor(public readonly existingCycleId: string) {
    super('La cuenta ya tiene un ciclo de metas activo')
    this.name = 'GoalCycleActiveError'
  }
}
export class GoalCycleClosedError extends Error {
  readonly code = 'GOAL_CYCLE_CLOSED'
  constructor(public readonly cycleId: string) {
    super('El ciclo de metas está cerrado; la meta no admite cambios')
    this.name = 'GoalCycleClosedError'
  }
}
export class GoalCycleValidationError extends Error {
  readonly code = 'GOAL_CYCLE_VALIDATION'
  constructor(message: string) {
    super(message)
    this.name = 'GoalCycleValidationError'
  }
}

interface CreateCycleInput {
  accountId: string
  name: string
  periodType: GoalPeriodType
  year: number
  quarter?: number
  semester?: number
  assignmentWindow: Date
  trackingWindow: Date
  closureWindow: Date
  requiresClosure?: boolean
  lockAfterClosure?: boolean
  linkedPerformanceCycleId?: string
  createdBy?: string
}

export class GoalCycleService {

  // Valida quarter/semester según periodType y los normaliza.
  private static normalizePeriodFields(
    periodType: GoalPeriodType,
    quarter?: number,
    semester?: number
  ): { quarter: number; semester: number } {
    const q = quarter ?? 0
    const s = semester ?? 0
    if (periodType === 'QUARTERLY') {
      if (q < 1 || q > 4) throw new GoalCycleValidationError('QUARTERLY requiere quarter 1-4')
      if (s !== 0) throw new GoalCycleValidationError('QUARTERLY requiere semester 0')
      return { quarter: q, semester: 0 }
    }
    if (periodType === 'SEMESTER') {
      if (s < 1 || s > 2) throw new GoalCycleValidationError('SEMESTER requiere semester 1-2')
      if (q !== 0) throw new GoalCycleValidationError('SEMESTER requiere quarter 0')
      return { quarter: 0, semester: s }
    }
    // ANNUAL
    if (q !== 0 || s !== 0) throw new GoalCycleValidationError('ANNUAL requiere quarter 0 y semester 0')
    return { quarter: 0, semester: 0 }
  }

  // validateWindowOrder: AUTORIDAD server de las ventanas. Valida cota de año
  // (assignment dentro del año, closure ≤ fin del año siguiente) + orden
  // (closure > assignment, tracking inclusive entre ambas). Compartido por
  // createCycle Y updateCycleWindows → misma regla en las dos rutas de escritura.
  // El guard client (CreateCycleModal/CycleWindowsFields, D.3) queda como feedback
  // inmediato, ya no como única barrera.
  private static validateWindowOrder(
    year: number,
    assignment: Date,
    tracking: Date,
    closure: Date
  ): void {
    const yearStart = new Date(`${year}-01-01T00:00:00Z`)
    const yearEnd = new Date(`${year}-12-31T23:59:59Z`)
    const nextYearEnd = new Date(`${year + 1}-12-31T23:59:59Z`)

    if (assignment < yearStart || assignment > yearEnd)
      throw new GoalCycleValidationError(`assignmentWindow debe caer dentro del año ${year}`)
    if (closure > nextYearEnd)
      throw new GoalCycleValidationError(`closureWindow no puede exceder el 31 de diciembre de ${year + 1}`)
    if (closure <= assignment)
      throw new GoalCycleValidationError('closureWindow debe ser posterior a assignmentWindow')
    if (tracking < assignment || tracking > closure)
      throw new GoalCycleValidationError('trackingWindow debe quedar entre assignmentWindow y closureWindow')
  }

  // createCycle: status PLANNING, SIN restricción de singleton (el candado es activate()).
  static async createCycle(input: CreateCycleInput): Promise<GoalCycle> {
    const { quarter, semester } = this.normalizePeriodFields(
      input.periodType,
      input.quarter,
      input.semester
    )
    this.validateWindowOrder(
      input.year,
      input.assignmentWindow,
      input.trackingWindow,
      input.closureWindow
    )
    // Colisión de período (dos del mismo año/tipo) → P2002 unique_goal_cycle_period (se propaga).
    return prisma.goalCycle.create({
      data: {
        accountId: input.accountId,
        name: input.name,
        periodType: input.periodType,
        year: input.year,
        quarter,
        semester,
        assignmentWindow: input.assignmentWindow,
        trackingWindow: input.trackingWindow,
        closureWindow: input.closureWindow,
        status: 'PLANNING',
        requiresClosure: input.requiresClosure ?? true,
        lockAfterClosure: input.lockAfterClosure ?? true,
        linkedPerformanceCycleId: input.linkedPerformanceCycleId ?? null,
        createdBy: input.createdBy ?? null,
      },
    })
  }

  // activate: EL CANDADO. advisory lock por cuenta + check singleton + update ACTIVE.
  static async activate(cycleId: string): Promise<GoalCycle> {
    const cycle = await prisma.goalCycle.findUnique({
      where: { id: cycleId },
      select: { id: true, accountId: true, status: true },
    })
    if (!cycle) throw new GoalCycleValidationError(`GoalCycle no encontrado: ${cycleId}`)
    if (cycle.status !== 'PLANNING' && cycle.status !== 'ASSIGNING') {
      throw new GoalCycleValidationError(
        `Solo se activa desde PLANNING/ASSIGNING (actual: ${cycle.status})`
      )
    }

    return prisma.$transaction(async (tx) => {
      // Serializa activaciones concurrentes de la misma cuenta (mata el doble clic).
      // $executeRaw (no $queryRaw): pg_advisory_xact_lock retorna void y $queryRaw
      // no puede deserializar esa columna. $executeRaw solo ejecuta.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${cycle.accountId}))`

      // ¿La cuenta ya tiene un ciclo ACTIVE o CLOSING? (excluye el propio)
      const existing = await tx.goalCycle.findFirst({
        where: {
          accountId: cycle.accountId,
          status: { in: ['ACTIVE', 'CLOSING'] },
          id: { not: cycleId },
        },
        select: { id: true },
      })
      if (existing) throw new GoalCycleActiveError(existing.id)

      return tx.goalCycle.update({
        where: { id: cycleId },
        data: { status: 'ACTIVE' },
      })
    })
  }

  // closeCycle: status → CLOSING (transición; NUNCA directo a CLOSED).
  static async closeCycle(cycleId: string): Promise<GoalCycle> {
    const cycle = await prisma.goalCycle.findUnique({
      where: { id: cycleId },
      select: { status: true },
    })
    if (!cycle) throw new GoalCycleValidationError(`GoalCycle no encontrado: ${cycleId}`)
    if (cycle.status !== 'ACTIVE') {
      throw new GoalCycleValidationError(`Solo se cierra un ciclo ACTIVE (actual: ${cycle.status})`)
    }
    return prisma.goalCycle.update({
      where: { id: cycleId },
      data: { status: 'CLOSING' },
    })
  }

  // finalizeCycle: CLOSING → CLOSED. Activa el lockAfterClosure y sella la auditoría.
  static async finalizeCycle(cycleId: string, closedBy?: string): Promise<GoalCycle> {
    const cycle = await prisma.goalCycle.findUnique({
      where: { id: cycleId },
      select: { status: true },
    })
    if (!cycle) throw new GoalCycleValidationError(`GoalCycle no encontrado: ${cycleId}`)
    if (cycle.status !== 'CLOSING') {
      throw new GoalCycleValidationError(`Solo se finaliza un ciclo CLOSING (actual: ${cycle.status})`)
    }
    return prisma.goalCycle.update({
      where: { id: cycleId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: closedBy ?? null,
      },
    })
  }

  // finalizeCycleWithDecisions: CLOSING → CLOSED aplicando ANTES las decisiones del
  // modal de cierre (Gate D.5, Decisión #8) sobre las metas incompletas, TODO en
  // una sola $transaction atómica (decisiones + transición). Si cualquier decisión
  // falla (id fuera del set accionable, carrera), se aborta entera y el ciclo sigue
  // CLOSING (reanudable). Devuelve el ciclo actualizado + resumen para el toast.
  static async finalizeCycleWithDecisions(
    cycleId: string,
    accountId: string,
    decisions: CycleClosureDecision[],
    actor: { id: string; name: string }
  ): Promise<{ cycle: GoalCycle; summary: CycleClosureSummary }> {
    // Pre-check de estado fuera de la tx (error limpio si no está CLOSING).
    const cycle = await prisma.goalCycle.findFirst({
      where: { id: cycleId, accountId },
      select: { id: true, status: true, name: true },
    })
    if (!cycle) throw new GoalCycleValidationError(`GoalCycle no encontrado: ${cycleId}`)
    if (cycle.status !== 'CLOSING') {
      throw new GoalCycleValidationError(`Solo se finaliza un ciclo CLOSING (actual: ${cycle.status})`)
    }

    const now = new Date() // timestamp único para todos los writes de la transacción

    return prisma.$transaction(async (tx) => {
      const summary = await GoalsService.applyCycleClosureDecisions(tx, {
        accountId,
        goalCycleId: cycleId,
        decisions,
        actorId: actor.id,
        actorName: actor.name,
        cycleName: cycle.name,
        now,
      })

      // Defensa: re-verificar CLOSING DENTRO de la tx antes de sellar.
      const fresh = await tx.goalCycle.findUnique({
        where: { id: cycleId },
        select: { status: true },
      })
      if (fresh?.status !== 'CLOSING') {
        throw new GoalCycleValidationError(`El ciclo dejó de estar CLOSING (actual: ${fresh?.status})`)
      }

      const updated = await tx.goalCycle.update({
        where: { id: cycleId },
        data: { status: 'CLOSED', closedAt: now, closedBy: actor.id },
      })
      return { cycle: updated, summary }
    })
  }

  // getActiveCycle: el ciclo ACTIVE de la cuenta, o null.
  static async getActiveCycle(accountId: string): Promise<GoalCycle | null> {
    return prisma.goalCycle.findFirst({
      where: { accountId, status: 'ACTIVE' },
    })
  }

  // updateCycleWindows: edita 1, 2 o las 3 ventanas del ciclo con auditoría.
  // (Ampliación Decisión #7, Gate D.8 — reemplaza el viejo updateClosureWindow.)
  // - Guard CLOSED: un ciclo CLOSED no admite cambios (mismo criterio que
  //   lockAfterClosure; CLOSING sí se permite — el estratega aún ajusta).
  // - Merge: cada ventana final = provista ?? actual; se re-valida el trío con
  //   validateWindowOrder usando el year FIJO del ciclo (year no es editable).
  // - Auditoría: closureWindowUpdatedAt/By se sella ante cualquier cambio de las
  //   3 (reusa esos 2 campos, no se agregan nuevos).
  static async updateCycleWindows(
    cycleId: string,
    windows: { assignmentWindow?: Date; trackingWindow?: Date; closureWindow?: Date },
    updatedBy: string
  ): Promise<GoalCycle> {
    const current = await prisma.goalCycle.findUnique({
      where: { id: cycleId },
      select: {
        status: true,
        year: true,
        assignmentWindow: true,
        trackingWindow: true,
        closureWindow: true,
      },
    })
    if (!current) throw new GoalCycleValidationError(`GoalCycle no encontrado: ${cycleId}`)
    if (current.status === 'CLOSED') throw new GoalCycleClosedError(cycleId)

    const assignment = windows.assignmentWindow ?? current.assignmentWindow
    const tracking = windows.trackingWindow ?? current.trackingWindow
    const closure = windows.closureWindow ?? current.closureWindow

    this.validateWindowOrder(current.year, assignment, tracking, closure)

    return prisma.goalCycle.update({
      where: { id: cycleId },
      data: {
        ...(windows.assignmentWindow ? { assignmentWindow: windows.assignmentWindow } : {}),
        ...(windows.trackingWindow ? { trackingWindow: windows.trackingWindow } : {}),
        ...(windows.closureWindow ? { closureWindow: windows.closureWindow } : {}),
        closureWindowUpdatedAt: new Date(),
        closureWindowUpdatedBy: updatedBy,
      },
    })
  }
}
