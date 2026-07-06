// ════════════════════════════════════════════════════════════════════════════
// GOALS SERVICE - Motor de Metas Empresariales (SOBERANO)
// src/lib/services/GoalsService.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import {
  Goal,
  GoalLevel,
  GoalOriginType,
  GoalType,
  GoalMetricType,
  GoalStatus,
  Prisma
} from '@prisma/client'
import { GoalCycleClosedError, GoalCycleValidationError, GoalCycleService } from './GoalCycleService'

// ────────────────────────────────────────────────────────────────────────────
// CIERRE DE CICLO — decisiones sobre metas incompletas (Gate D.5, Decisión #8)
// ────────────────────────────────────────────────────────────────────────────
export type CycleClosureDecisionType = 'CLOSE_WITH_SCORE' | 'MARK_REVIEW' | 'LEAVE_AS_IS'

export interface CycleClosureDecision {
  goalId: string
  decision: CycleClosureDecisionType
}

export interface CycleClosureSummary {
  closedWithScore: number
  markedReview: number
  leftAsIs: number
}

// ────────────────────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────────────────────

interface CreateGoalInput {
  accountId: string
  title: string
  description?: string
  type?: GoalType
  level: GoalLevel
  originType: GoalOriginType

  // Propiedad
  employeeId?: string
  departmentId?: string
  createdById: string

  // Tiempo
  startDate: Date
  dueDate: Date
  periodYear: number
  periodQuarter?: number

  // Medición
  metricType?: GoalMetricType
  startValue?: number
  targetValue: number
  unit?: string

  // Peso para performance
  weight?: number

  // Cascada
  parentId?: string

  // PDI link
  linkedDevGoalId?: string

  // Meta líder
  isLeaderGoal?: boolean
}

interface UpdateProgressInput {
  goalId: string
  newValue: number
  comment?: string
  evidence?: string
  updatedById: string
}

interface GoalWithRelations extends Goal {
  parent?: Goal | null
  children?: Goal[]
  owner?: { id: string; fullName: string } | null
  department?: { id: string; displayName: string } | null
}

interface EmployeeGoalsScore {
  score: number           // 0-100 promedio ponderado
  goalsCount: number
  completedCount: number
  totalWeight: number
  details: Array<{
    goalId: string
    title: string
    progress: number
    weight: number
    weightedScore: number
  }>
}

interface AlignmentReport {
  totalGoals: number
  alignedGoals: number
  orphanGoals: number
  alignmentRate: number   // 0-100%
  byLevel: {
    company: number
    area: number
    individual: number
  }
  recommendations: string[]
}

// ────────────────────────────────────────────────────────────────────────────
// SERVICIO PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────

export class GoalsService {

  // ══════════════════════════════════════════════════════════════════════════
  // CREACIÓN DE METAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Crear meta corporativa (Nivel 0)
   * Siempre isAligned: true, isOrphan: false
   */
  static async createCorporateGoal(input: Omit<CreateGoalInput, 'level' | 'originType' | 'parentId'>): Promise<Goal> {
    // Validar duplicado corporativo
    await this.validateCompanyAreaDuplicate(input.accountId, input.title, 'COMPANY', input.periodYear)

    const data = this.prepareGoalData(input)
    data.level = 'COMPANY'
    data.originType = 'STRATEGIC_CASCADE'
    data.isAligned = true
    data.isOrphan = false
    data.goalCycleId = await this.resolveInheritedCycleId(input.accountId)
    return prisma.goal.create({ data })
  }

  /**
   * Cascadear meta desde un padre
   * Hereda alineación del padre
   */
  static async cascadeGoal(
    parentId: string,
    input: Omit<CreateGoalInput, 'originType' | 'parentId'>
  ): Promise<Goal> {
    // Verificar que el padre existe
    const parent = await prisma.goal.findUnique({
      where: { id: parentId }
    })

    if (!parent) {
      throw new Error(`Goal padre no encontrado: ${parentId}`)
    }

    // Validaciones si es meta individual (tiene employeeId)
    if (input.employeeId) {
      await this.validateGoalLimit(input.accountId, input.employeeId)
      await this.validateTotalWeight(input.accountId, input.employeeId, input.weight || 0)
      await this.validateDuplicate(input.accountId, parentId, input.employeeId)
    }

    // Validación para metas AREA (sin employeeId)
    if (input.level === 'AREA') {
      await this.validateCompanyAreaDuplicate(input.accountId, input.title, 'AREA', input.periodYear)
    }

    const data = this.prepareGoalData(input)
    data.parentId = parentId
    data.originType = 'STRATEGIC_CASCADE'
    data.isAligned = parent.isAligned
    data.isOrphan = false
    data.goalCycleId = await this.resolveInheritedCycleId(input.accountId)
    return prisma.goal.create({ data })
  }

  /**
   * Crear meta de jefe (sin padre, válida pero no alineada)
   */
  static async createManagerGoal(input: Omit<CreateGoalInput, 'originType' | 'parentId'>): Promise<Goal> {
    // Validaciones si es meta individual (tiene employeeId)
    if (input.employeeId) {
      await this.validateGoalLimit(input.accountId, input.employeeId)
      await this.validateTotalWeight(input.accountId, input.employeeId, input.weight || 0)
    }

    const data = this.prepareGoalData(input)
    data.originType = 'MANAGER_CREATED'
    data.isAligned = false
    data.isOrphan = true
    data.goalCycleId = await this.resolveInheritedCycleId(input.accountId)
    return prisma.goal.create({ data })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTUALIZACIÓN DE PROGRESO
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Actualizar progreso con auditoría completa (transacción atómica)
   */
  static async updateProgress(input: UpdateProgressInput): Promise<Goal> {
    const { goalId, newValue, comment, evidence, updatedById } = input

    return prisma.$transaction(async (tx) => {
      // 1. Obtener estado actual
      const goal = await tx.goal.findUnique({
        where: { id: goalId }
      })

      if (!goal) {
        throw new Error(`Goal no encontrado: ${goalId}`)
      }

      // LOCK POST-CIERRE (Gate B): si la meta pertenece a un GoalCycle con
      // lockAfterClosure y el ciclo está CLOSED, no se admite editar progreso.
      // Atado a GoalCycle.status === 'CLOSED', NUNCA a CLOSING (el cierre escribe
      // metas mientras el ciclo está CLOSING) ni a Goal.status.
      if (goal.goalCycleId) {
        const cycle = await tx.goalCycle.findUnique({
          where: { id: goal.goalCycleId },
          select: { status: true, lockAfterClosure: true },
        })
        if (cycle?.lockAfterClosure && cycle.status === 'CLOSED') {
          throw new GoalCycleClosedError(goal.goalCycleId)
        }
      }

      // 2. Calcular nuevo progreso
      const newProgress = GoalsService.calculateProgress(
        goal.metricType,
        goal.startValue,
        goal.targetValue,
        newValue
      )

      // 3. Determinar nuevo status
      const newStatus = GoalsService.determineStatus(newProgress, goal.dueDate)

      // 4. Guardar snapshot en historial (Time Travel)
      await tx.goalProgressUpdate.create({
        data: {
          goalId,
          accountId: goal.accountId,
          previousValue: goal.currentValue,
          newValue,
          previousProgress: goal.progress,
          newProgress,
          comment,
          evidence,
          updatedById,
        }
      })

      // 5. Actualizar meta
      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          currentValue: newValue,
          progress: newProgress,
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : null,
        }
      })

      return updated
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TIME TRAVEL - LA JOYA DE LA CORONA
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener score de metas de un empleado en una fecha específica
   * Performance llama esto al cierre de ciclo
   *
   * @param employeeId - ID del empleado
   * @param asOfDate - Fecha para reconstruir estado (ej: fecha cierre ciclo)
   * @returns Score 0-100 promedio ponderado
   */
  static async getEmployeeGoalsScore(
    employeeId: string,
    asOfDate: Date
  ): Promise<EmployeeGoalsScore> {

    // 1. Buscar metas activas del empleado en esa fecha
    const goals = await prisma.goal.findMany({
      where: {
        employeeId,
        startDate: { lte: asOfDate },
        dueDate: { gte: asOfDate },
        status: { notIn: ['CANCELLED'] },
        weight: { gt: 0 }, // Solo metas con peso
      },
      include: {
        progressUpdates: {
          where: {
            createdAt: { lte: asOfDate }
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // Último update antes de la fecha
        }
      }
    })

    if (goals.length === 0) {
      return {
        score: 0,
        goalsCount: 0,
        completedCount: 0,
        totalWeight: 0,
        details: []
      }
    }

    // 2. Reconstruir progreso histórico para cada meta
    const details = goals.map(goal => {
      // Si hay update antes de la fecha, usar ese valor
      // Si no hay updates, usar startValue (meta aún no iniciada en esa fecha)
      let historicalProgress: number

      if (goal.progressUpdates.length > 0) {
        historicalProgress = goal.progressUpdates[0].newProgress
      } else {
        // No había actualizaciones aún en esa fecha
        historicalProgress = 0
      }

      const weightedScore = (historicalProgress * goal.weight) / 100

      return {
        goalId: goal.id,
        title: goal.title,
        progress: historicalProgress,
        weight: goal.weight,
        weightedScore
      }
    })

    // 3. Calcular promedio ponderado
    const totalWeight = details.reduce((sum, d) => sum + d.weight, 0)
    const weightedSum = details.reduce((sum, d) => sum + d.weightedScore, 0)

    // Normalizar: si los pesos no suman 100, ajustar
    const score = totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100)
      : 0

    const completedCount = details.filter(d => d.progress >= 100).length

    return {
      score: Math.min(100, Math.max(0, score)), // Clamp 0-100
      goalsCount: goals.length,
      completedCount,
      totalWeight,
      details
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTELIGENCIA Y ANÁLISIS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Detectar metas huérfanas (sin alineación estratégica)
   */
  static async detectOrphans(accountId: string): Promise<Goal[]> {
    return prisma.goal.findMany({
      where: {
        accountId,
        isOrphan: true,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        owner: { select: { id: true, fullName: true } },
        department: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Reporte de alineación estratégica
   */
  static async getAlignmentReport(accountId: string): Promise<AlignmentReport> {
    const goals = await prisma.goal.findMany({
      where: {
        accountId,
        status: { notIn: ['CANCELLED'] },
      },
      select: {
        id: true,
        level: true,
        isAligned: true,
        isOrphan: true,
      }
    })

    const totalGoals = goals.length
    const alignedGoals = goals.filter(g => g.isAligned).length
    const orphanGoals = goals.filter(g => g.isOrphan).length

    const byLevel = {
      company: goals.filter(g => g.level === 'COMPANY').length,
      area: goals.filter(g => g.level === 'AREA').length,
      individual: goals.filter(g => g.level === 'INDIVIDUAL').length,
    }

    const alignmentRate = totalGoals > 0
      ? Math.round((alignedGoals / totalGoals) * 100)
      : 0

    // Generar recomendaciones
    const recommendations: string[] = []

    if (byLevel.company === 0) {
      recommendations.push('No hay metas corporativas definidas. Define al menos 3-5 metas de empresa.')
    }

    if (orphanGoals > totalGoals * 0.3) {
      recommendations.push(`${orphanGoals} metas (${Math.round(orphanGoals/totalGoals*100)}%) no están alineadas. Considera vincularlas a metas de área.`)
    }

    if (alignmentRate < 70) {
      recommendations.push('La tasa de alineación es baja. Revisa el cascadeo de metas corporativas a áreas e individuos.')
    }

    return {
      totalGoals,
      alignedGoals,
      orphanGoals,
      alignmentRate,
      byLevel,
      recommendations
    }
  }

  /**
   * Obtener árbol de metas (Alignment Tree)
   */
  static async getAlignmentTree(accountId: string, periodYear: number): Promise<GoalWithRelations[]> {
    // Obtener solo metas de nivel COMPANY (raíces)
    const roots = await prisma.goal.findMany({
      where: {
        accountId,
        periodYear,
        level: 'COMPANY',
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                owner: { select: { id: true, fullName: true } },
              }
            },
            department: { select: { id: true, displayName: true } },
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return roots
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONSULTAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener metas de un empleado
   */
  static async getEmployeeGoals(
    employeeId: string,
    options?: {
      periodYear?: number
      status?: GoalStatus[]
      includeCompleted?: boolean
    }
  ): Promise<GoalWithRelations[]> {
    const where: Prisma.GoalWhereInput = {
      employeeId,
    }

    if (options?.periodYear) {
      where.periodYear = options.periodYear
    }

    if (options?.status && options.status.length > 0) {
      where.status = { in: options.status }
    } else if (!options?.includeCompleted) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] }
    }

    return prisma.goal.findMany({
      where,
      include: {
        parent: true,
        department: { select: { id: true, displayName: true } },
      },
      orderBy: [
        { weight: 'desc' },
        { dueDate: 'asc' },
      ]
    })
  }

  /**
   * Obtener metas de un departamento
   */
  static async getDepartmentGoals(
    departmentId: string,
    periodYear: number
  ): Promise<GoalWithRelations[]> {
    return prisma.goal.findMany({
      where: {
        departmentId,
        periodYear,
        level: 'AREA',
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        parent: true,
        children: {
          include: {
            owner: { select: { id: true, fullName: true } },
          }
        },
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTEGRACIÓN PDI → METAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica si el empleado puede tener más metas individuales
   */
  static async checkGoalLimit(
    accountId: string,
    employeeId: string
  ): Promise<{ canCreate: boolean; current: number; max: number }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { maxIndividualGoals: true }
    })

    const max = account?.maxIndividualGoals ?? 10

    const current = await prisma.goal.count({
      where: {
        accountId,
        employeeId,
        level: 'INDIVIDUAL',
        status: { in: ['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND'] }
      }
    })

    return { canCreate: current < max, current, max }
  }

  private static async validateGoalLimit(
    accountId: string,
    employeeId: string
  ): Promise<void> {
    const check = await this.checkGoalLimit(accountId, employeeId)
    if (!check.canCreate) {
      throw new Error(`Límite de metas alcanzado (${check.current}/${check.max})`)
    }
  }

  private static async validateTotalWeight(
    accountId: string,
    employeeId: string,
    newWeight: number
  ): Promise<void> {
    const currentGoals = await prisma.goal.findMany({
      where: {
        accountId,
        employeeId,
        level: 'INDIVIDUAL',
        status: { in: ['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND'] }
      },
      select: { weight: true }
    })

    const currentTotalWeight = currentGoals.reduce((sum, g) => sum + (g.weight || 0), 0)

    if (currentTotalWeight + newWeight > 100) {
      throw new Error(
        `Peso total excede 100%. Actual: ${currentTotalWeight}%, Nuevo: ${newWeight}%, Total: ${currentTotalWeight + newWeight}%`
      )
    }
  }

  private static async validateDuplicate(
    accountId: string,
    parentId: string,
    employeeId: string
  ): Promise<void> {
    const existing = await prisma.goal.findFirst({
      where: {
        accountId,
        employeeId,
        parentId,
        status: { notIn: ['CANCELLED'] }
      }
    })

    if (existing) {
      throw new Error('Este empleado ya tiene asignada esta meta')
    }
  }

  private static async validateCompanyAreaDuplicate(
    accountId: string,
    title: string,
    level: GoalLevel,
    periodYear: number
  ): Promise<void> {
    if (level !== 'COMPANY' && level !== 'AREA') return

    const existing = await prisma.goal.findFirst({
      where: {
        accountId,
        title,
        level,
        periodYear,
        status: { notIn: ['CANCELLED'] }
      }
    })

    if (existing) {
      const levelLabel = level === 'COMPANY' ? 'corporativa' : 'de área'
      throw new Error(`Ya existe una meta ${levelLabel} "${title}" para el período ${periodYear}`)
    }
  }

  /**
   * Crea una Meta de negocio desde un DevelopmentGoal del PDI
   */
  static async createFromDevelopmentGoal(
    accountId: string,
    employeeId: string,
    createdById: string,
    input: {
      devGoalId: string
      title: string
      description?: string
      targetValue: number
      unit?: string
      dueDate: string
      weight?: number
    }
  ): Promise<Goal> {
    // 1. Verificar límite
    const limitCheck = await this.checkGoalLimit(accountId, employeeId)
    if (!limitCheck.canCreate) {
      throw new Error(`Límite de metas alcanzado (${limitCheck.current}/${limitCheck.max})`)
    }

    // 1b. Verificar peso total
    await this.validateTotalWeight(accountId, employeeId, input.weight || 0)

    // 2. Verificar que el DevelopmentGoal existe y pertenece al empleado
    const devGoal = await prisma.developmentGoal.findFirst({
      where: {
        id: input.devGoalId,
        plan: { employeeId, accountId }
      },
      include: { linkedBusinessGoal: true }
    })

    if (!devGoal) {
      throw new Error('Objetivo de desarrollo no encontrado')
    }

    // 3. Verificar que no tenga ya una meta vinculada activa
    if (devGoal.linkedBusinessGoal && devGoal.linkedBusinessGoal.status !== 'CANCELLED') {
      throw new Error('Este objetivo ya tiene una meta vinculada')
    }

    // 4. Crear la meta con la conexión
    return prisma.goal.create({
      data: {
        accountId,
        employeeId,
        createdById,
        title: input.title,
        description: input.description || `Meta derivada de PDI: ${devGoal.title}`,
        level: 'INDIVIDUAL',
        type: 'KPI',
        originType: 'MANAGER_CREATED',
        metricType: 'PERCENTAGE',
        startValue: 0,
        currentValue: 0,
        targetValue: input.targetValue,
        unit: input.unit || '%',
        startDate: new Date(),
        dueDate: new Date(input.dueDate),
        periodYear: new Date().getFullYear(),
        weight: input.weight || 0,
        status: 'NOT_STARTED',
        linkedDevGoalId: input.devGoalId,
        goalCycleId: await this.resolveInheritedCycleId(accountId),
      }
    })
  }

  /**
   * Vincula una meta EXISTENTE a un DevelopmentGoal del PDI
   */
  static async linkExistingGoal(
    accountId: string,
    goalId: string,
    devGoalId: string
  ): Promise<Goal> {
    // 1. Verificar que la meta existe y pertenece a la cuenta
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId, level: 'INDIVIDUAL' }
    })

    if (!goal) {
      throw new Error('Meta no encontrada')
    }

    if (goal.linkedDevGoalId) {
      throw new Error('Esta meta ya está vinculada a otro objetivo de desarrollo')
    }

    // 2. Verificar que el DevelopmentGoal existe y no tiene meta activa
    const devGoal = await prisma.developmentGoal.findFirst({
      where: {
        id: devGoalId,
        plan: { accountId }
      },
      include: { linkedBusinessGoal: true }
    })

    if (!devGoal) {
      throw new Error('Objetivo de desarrollo no encontrado')
    }

    if (devGoal.linkedBusinessGoal && devGoal.linkedBusinessGoal.status !== 'CANCELLED') {
      throw new Error('Este objetivo de desarrollo ya tiene una meta vinculada')
    }

    // 3. Actualizar la meta con el link
    return prisma.goal.update({
      where: { id: goalId },
      data: { linkedDevGoalId: devGoalId }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CIERRE DE METAS (Flujo de aprobación CEO)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Solicitar cierre de meta (Gerente)
   */
  static async requestClosure(
    goalId: string,
    accountId: string,
    requestedBy: string
  ): Promise<Goal> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId }
    })

    if (!goal) throw new Error('Meta no encontrada')
    if (goal.status === 'COMPLETED') throw new Error('Meta ya está cerrada')
    if (goal.status === 'PENDING_CLOSURE') throw new Error('Ya hay una solicitud de cierre pendiente')

    return prisma.goal.update({
      where: { id: goalId },
      data: {
        status: 'PENDING_CLOSURE',
        closureRequestedAt: new Date(),
        closureRequestedBy: requestedBy,
      },
    })
  }

  /**
   * Aprobar cierre de meta (CEO)
   */
  static async approveClosure(
    goalId: string,
    accountId: string,
    approvedBy: string,
    notes?: string
  ): Promise<Goal> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId, status: 'PENDING_CLOSURE' }
    })

    if (!goal) throw new Error('Meta no encontrada o no está pendiente de cierre')

    return prisma.goal.update({
      where: { id: goalId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        closedAt: new Date(),
        closedBy: approvedBy,
        closureApprovedBy: approvedBy,
        closureNotes: notes,
      },
    })
  }

  /**
   * Rechazar cierre de meta (CEO)
   */
  static async rejectClosure(
    goalId: string,
    accountId: string,
    rejectedBy: string,
    notes?: string
  ): Promise<Goal> {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId, status: 'PENDING_CLOSURE' }
    })

    if (!goal) throw new Error('Meta no encontrada o no está pendiente de cierre')

    // Determinar status basado en progreso
    const newStatus: GoalStatus =
      goal.progress >= 90 ? 'ON_TRACK' : goal.progress >= 70 ? 'AT_RISK' : 'BEHIND'

    return prisma.goal.update({
      where: { id: goalId },
      data: {
        status: newStatus,
        closureRequestedAt: null,
        closureRequestedBy: null,
        closureNotes: `Rechazado por ${rejectedBy}: ${notes || 'Sin comentarios'}`,
      },
    })
  }

  /**
   * Obtener metas pendientes de cierre
   */
  static async getPendingClosures(accountId: string) {
    return prisma.goal.findMany({
      where: {
        accountId,
        status: 'PENDING_CLOSURE',
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, standardJobLevel: true },
        },
        progressUpdates: {
          orderBy: { createdAt: 'desc' as const },
          take: 5,
        },
      },
      orderBy: { closureRequestedAt: 'asc' },
    })
  }

  /**
   * Aplica las decisiones del modal de cierre de ciclo (Gate D.5, Decisión #8)
   * sobre las metas INCOMPLETAS de un ciclo, en BULK (updateMany/createMany).
   *
   * tx-aware: corre DENTRO de la $transaction de finalizeCycleWithDecisions, para
   * que decisiones + transición CLOSING→CLOSED sean atómicas.
   *
   * Escala: N metas se resuelven en ~4 statements (no un loop per-meta) — con 182
   * metas reales de la cuenta piloto, una sola transacción aguanta cómoda.
   *
   * Semántica (confirmada Gate D.5a):
   *   CLOSE_WITH_SCORE → COMPLETED con score congelado (escritura directa; NO
   *     approveClosure, que exige PENDING_CLOSURE). closureApprovedBy=null +
   *     nota explícita de cierre forzado (no "se aprobó a sí mismo").
   *   MARK_REVIEW → PENDING_CLOSURE (mismo end-state que requestClosure, sin
   *     campo nuevo; cae en la bandeja de aprobación existente).
   *   LEAVE_AS_IS → no-op.
   *
   * Validación TODO-O-NADA: cada goalId de decisions[] DEBE pertenecer al set
   * accionable real (cuenta+ciclo, status notIn COMPLETED/CANCELLED/PENDING_CLOSURE).
   * Un id fuera de lugar → GoalCycleValidationError, se rechaza TODA la operación
   * (no filtrado en silencio). Duplicados también se rechazan.
   */
  static async applyCycleClosureDecisions(
    tx: Prisma.TransactionClient,
    params: {
      accountId: string
      goalCycleId: string
      decisions: CycleClosureDecision[]
      actorId: string
      actorName: string
      cycleName: string
      now: Date
    }
  ): Promise<CycleClosureSummary> {
    const { accountId, goalCycleId, decisions, actorId, actorName, cycleName, now } = params

    // Status accionables (los únicos que el modal puede decidir).
    const ACTIONABLE = { notIn: ['COMPLETED', 'CANCELLED', 'PENDING_CLOSURE'] as GoalStatus[] }

    // ── 1. Set accionable REAL server-side (fuente de verdad, no el cliente) ──
    const actionable = await tx.goal.findMany({
      where: { accountId, goalCycleId, status: ACTIONABLE },
      select: { id: true, currentValue: true, progress: true },
    })
    const actionableMap = new Map(actionable.map((g) => [g.id, g]))

    // ── 2. Validación TODO-O-NADA (antes de cualquier write) ──
    const seen = new Set<string>()
    const offending: string[] = []
    for (const d of decisions) {
      if (seen.has(d.goalId)) {
        throw new GoalCycleValidationError(`goalId duplicado en decisions: ${d.goalId}`)
      }
      seen.add(d.goalId)
      if (!actionableMap.has(d.goalId)) offending.push(d.goalId)
    }
    if (offending.length > 0) {
      // Puede ser bug de front O una meta que salió del set accionable con el
      // modal abierto (alguien la completó). La UI (Acto 3) distingue el mensaje.
      throw new GoalCycleValidationError(
        `Metas fuera del set accionable del ciclo (cambiaron de estado o no pertenecen): ${offending.join(', ')}`
      )
    }

    // ── 3. Agrupar en baldes ──
    const closeIds = decisions.filter((d) => d.decision === 'CLOSE_WITH_SCORE').map((d) => d.goalId)
    const reviewIds = decisions.filter((d) => d.decision === 'MARK_REVIEW').map((d) => d.goalId)
    const leaveIds = decisions.filter((d) => d.decision === 'LEAVE_AS_IS').map((d) => d.goalId)

    const forcedNote =
      `Cierre forzado al finalizar el ciclo "${cycleName}". Score congelado al valor vigente. ` +
      `Ejecutado por ${actorName}. No pasó por flujo de aprobación estándar.`

    // ── 4. updateMany por balde — SIEMPRE con accountId + goalCycleId en el where
    //       (defensa en profundidad) + assert de conteo (protección de carrera) ──
    if (closeIds.length > 0) {
      const res = await tx.goal.updateMany({
        where: { id: { in: closeIds }, accountId, goalCycleId, status: ACTIONABLE },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          closedAt: now,
          closedBy: actorName,
          closureApprovedBy: null,
          closureNotes: forcedNote,
        },
      })
      if (res.count !== closeIds.length) {
        throw new GoalCycleValidationError(
          `Condición de carrera al cerrar metas: esperadas ${closeIds.length}, afectadas ${res.count}`
        )
      }
    }

    if (reviewIds.length > 0) {
      const res = await tx.goal.updateMany({
        where: { id: { in: reviewIds }, accountId, goalCycleId, status: ACTIONABLE },
        data: {
          status: 'PENDING_CLOSURE',
          closureRequestedAt: now,
          closureRequestedBy: actorName,
        },
      })
      if (res.count !== reviewIds.length) {
        throw new GoalCycleValidationError(
          `Condición de carrera al enviar a revisión: esperadas ${reviewIds.length}, afectadas ${res.count}`
        )
      }
    }

    // ── 5. Auditoría createMany (CLOSE_WITH_SCORE ∪ MARK_REVIEW; LEAVE_AS_IS no) ──
    //       accountId poblado en cada fila (regla enterprise #1, toda escritura).
    const auditRows: Prisma.GoalProgressUpdateCreateManyInput[] = []
    for (const id of closeIds) {
      const g = actionableMap.get(id)!
      auditRows.push({
        goalId: id,
        accountId,
        previousValue: g.currentValue,
        newValue: g.currentValue,
        previousProgress: g.progress,
        newProgress: g.progress,
        comment: `Cierre forzado al finalizar el ciclo "${cycleName}" (score congelado al ${g.progress}%).`,
        updatedById: actorId,
      })
    }
    for (const id of reviewIds) {
      const g = actionableMap.get(id)!
      auditRows.push({
        goalId: id,
        accountId,
        previousValue: g.currentValue,
        newValue: g.currentValue,
        previousProgress: g.progress,
        newProgress: g.progress,
        comment: `Enviada a revisión al finalizar el ciclo "${cycleName}" (progreso ${g.progress}%).`,
        updatedById: actorId,
      })
    }
    if (auditRows.length > 0) {
      await tx.goalProgressUpdate.createMany({ data: auditRows })
    }

    return {
      closedWithScore: closeIds.length,
      markedReview: reviewIds.length,
      leftAsIs: leaveIds.length,
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Herencia automática de ciclo (Decisión de Negocio #4): toda meta nueva nace
   * asociada al ciclo ACTIVE de la cuenta (o null si no hay ninguno activo).
   * Se llama en los 4 puntos de creación de Goal (createCorporateGoal,
   * cascadeGoal, createManagerGoal, createFromDevelopmentGoal).
   */
  private static async resolveInheritedCycleId(accountId: string): Promise<string | null> {
    return (await GoalCycleService.getActiveCycle(accountId))?.id ?? null
  }

  private static prepareGoalData(input: Partial<CreateGoalInput> & Pick<CreateGoalInput, 'accountId' | 'title' | 'createdById' | 'startDate' | 'dueDate' | 'periodYear' | 'targetValue'>): Prisma.GoalUncheckedCreateInput {
    return {
      accountId: input.accountId,
      title: input.title,
      description: input.description,
      type: input.type || 'KPI',
      level: input.level || 'INDIVIDUAL',
      originType: input.originType || 'MANAGER_CREATED',

      // Propiedad
      employeeId: input.employeeId,
      departmentId: input.departmentId,
      createdById: input.createdById,

      // Tiempo
      startDate: input.startDate,
      dueDate: input.dueDate,
      periodYear: input.periodYear,
      periodQuarter: input.periodQuarter,

      // Medición
      metricType: input.metricType || 'PERCENTAGE',
      startValue: input.startValue || 0,
      targetValue: input.targetValue,
      currentValue: input.startValue || 0,
      unit: input.unit,

      // Performance
      weight: input.weight || 0,

      // PDI
      linkedDevGoalId: input.linkedDevGoalId,

      // Meta líder
      isLeaderGoal: input.isLeaderGoal || false,
    }
  }

  /**
   * Calcular progreso basado en tipo de métrica
   */
  static calculateProgress(
    metricType: GoalMetricType,
    startValue: number,
    targetValue: number,
    currentValue: number
  ): number {
    // BINARY: Solo 0% o 100% (estricto)
    if (metricType === 'BINARY') {
      return currentValue === 1 ? 100 : 0
    }

    // Evitar división por cero
    const range = targetValue - startValue
    if (range === 0) return currentValue >= targetValue ? 100 : 0

    // PERCENTAGE, CURRENCY, NUMBER: Cálculo proporcional
    const progress = ((currentValue - startValue) / range) * 100

    // Clamp entre 0 y 150 (permitir sobre-cumplimiento hasta 150%)
    return Math.min(150, Math.max(0, Math.round(progress)))
  }

  /**
   * Determinar status basado en progreso y fecha límite
   */
  private static determineStatus(progress: number, dueDate: Date): GoalStatus {
    if (progress >= 100) return 'COMPLETED'

    const now = new Date()
    const daysToDeadline = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Calcular progreso esperado (lineal)
    const totalDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + daysToDeadline
    const expectedProgress = totalDays > 0 ? ((totalDays - daysToDeadline) / totalDays) * 100 : 100

    if (progress === 0) return 'NOT_STARTED'

    if (progress >= expectedProgress * 0.9) return 'ON_TRACK'
    if (progress >= expectedProgress * 0.7) return 'AT_RISK'

    return 'BEHIND'
  }
}

export default GoalsService
