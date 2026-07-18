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
  GoalAlertType,
  GoalFamily,
  GoalKpiSource,
  Prisma
} from '@prisma/client'
import { GoalCycleClosedError, GoalCycleValidationError, GoalCycleService } from './GoalCycleService'
import { getChildDepartmentIds, GLOBAL_ACCESS_ROLES } from './AuthorizationService'
import { GOAL_FAMILY_LABELS, isValidSubfamily } from '@/lib/constants/goalCategories'
// Constante COMPARTIDA con Clima A PROPÓSITO — ver src/lib/services/clima/climaThresholds.ts.
// Ese archivo es un módulo de constantes PURO (cero imports): es hoja del grafo de
// dependencias, así que importarlo desde acá no puede generar ningún ciclo.
// NO duplicar este número en Metas: una sola fuente de verdad para el objetivo de clima.
import { CLIMA_TARGET_FAVORABILITY } from './clima/climaThresholds'

// ────────────────────────────────────────────────────────────────────────────
// ERRORES DE DOMINIO (Gate A) — goalsErrorResponse los mapea a HTTP.
// Espejo del patrón de GoalCycleService: clase + `code` estable + `name`.
// Antes eran `new Error(...)` pelados y las rutas los aplanaban a un 500
// opaco: el usuario veía "Error creando meta" en vez de "excede 100%".
// ────────────────────────────────────────────────────────────────────────────
export class GoalNoActiveCycleError extends Error {
  readonly code = 'GOAL_NO_ACTIVE_CYCLE'
  constructor() {
    super('No hay ciclo activo; no se puede validar el presupuesto de metas')
    this.name = 'GoalNoActiveCycleError'
  }
}
export class GoalWeightExceededError extends Error {
  readonly code = 'GOAL_WEIGHT_EXCEEDED'
  constructor(public readonly current: number, public readonly attempted: number) {
    super(
      `Peso total excede 100%. Asignado: ${current}%, nuevo: ${attempted}%, total: ${current + attempted}%`
    )
    this.name = 'GoalWeightExceededError'
  }
}
export class GoalLimitReachedError extends Error {
  readonly code = 'GOAL_LIMIT_REACHED'
  constructor(public readonly current: number, public readonly max: number) {
    super(`Límite de metas alcanzado (${current}/${max})`)
    this.name = 'GoalLimitReachedError'
  }
}
export class GoalDuplicateError extends Error {
  readonly code = 'GOAL_DUPLICATE'
  constructor(message: string) {
    super(message)
    this.name = 'GoalDuplicateError'
  }
}
export class GoalKpiRangeError extends Error {
  readonly code = 'GOAL_KPI_RANGE'
  constructor(public readonly startValue: number, public readonly targetValue: number) {
    super(`El objetivo (${targetValue}) debe ser distinto del valor inicial (${startValue})`)
    this.name = 'GoalKpiRangeError'
  }
}
export class GoalDescriptionRequiredError extends Error {
  readonly code = 'GOAL_DESCRIPTION_REQUIRED'
  constructor() {
    super('Explica cómo se mide el éxito de esta meta antes de crearla')
    this.name = 'GoalDescriptionRequiredError'
  }
}
export class GoalCategoryError extends Error {
  readonly code = 'GOAL_CATEGORY_INVALID'
  constructor(message: string) {
    super(message)
    this.name = 'GoalCategoryError'
  }
}
export class GoalOwnerLevelMismatchError extends Error {
  readonly code = 'GOAL_OWNER_LEVEL_MISMATCH'
  constructor(public readonly level: string) {
    super('Las metas de nivel Área o Corporativa no pueden tener employeeId — deben crearse sin dueño')
    this.name = 'GoalOwnerLevelMismatchError'
  }
}

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
// CIERRE DE METAS (request/approve/reject) — actor + error tipado + includes
// ────────────────────────────────────────────────────────────────────────────

/** Contexto del actor para las acciones de cierre. La RUTA lo arma (resuelve
 *  currentEmployee por email); el servicio decide scope y el nombre a registrar. */
export interface GoalClosureActor {
  accountId: string
  role: string | null
  departmentId: string | null
  userId: string | null
  employeeId: string | null    // currentEmployee?.id ?? null
  employeeName: string | null  // currentEmployee?.fullName ?? null
  userName: string | null      // nombre del User logueado (sin fila Employee) — extractUserContext
  userEmail: string | null     // último recurso de atribución (header x-user-email)
}

export type GoalClosureErrorCode =
  | 'NOT_FOUND'         // 404
  | 'INVALID_STATE'     // 400
  | 'MIN_PROGRESS'      // 400
  | 'REASON_REQUIRED'   // 400
  | 'FORBIDDEN_SCOPE'   // 403

/** Error de negocio de cierre. La ruta mapea `code` → HTTP status y reenvía
 *  `message` textual (idéntico al que hoy devuelven las rutas). */
export class GoalClosureError extends Error {
  constructor(public code: GoalClosureErrorCode, message: string) {
    super(message)
    this.name = 'GoalClosureError'
  }
}

// Include LEAN devuelto al frontend — IDÉNTICO al de las rutas de hoy
// (owner {id, fullName} + department {id, displayName}). Contrato JSON: no crece.
const GOAL_CLOSURE_RESPONSE_INCLUDE = {
  owner: { select: { id: true, fullName: true } },
  department: { select: { id: true, displayName: true } },
} satisfies Prisma.GoalInclude

// Include RICO — SOLO para el scope (interno). NUNCA se retorna al frontend.
const GOAL_CLOSURE_SCOPE_INCLUDE = {
  owner: { select: { id: true, fullName: true, departmentId: true, managerId: true } },
  department: { select: { id: true, displayName: true } },
} satisfies Prisma.GoalInclude

export type GoalWithClosureRelations =
  Prisma.GoalGetPayload<{ include: typeof GOAL_CLOSURE_RESPONSE_INCLUDE }>
type GoalClosureScopeGoal =
  Prisma.GoalGetPayload<{ include: typeof GOAL_CLOSURE_SCOPE_INCLUDE }>

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

  // Autoría del KPI (Punto 2). REQUERIDO sin default: fuerza a cada creador a
  // declarar si el KPI es propio (OWN → exige description) o heredado (INHERITED).
  // Mismo patrón de "campo required que los creadores auto-conscientes inyectan"
  // que originType. cascadeGoal es el ÚNICO ambiguo → lo exige en su input.
  kpiSource: GoalKpiSource

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

  // Categoría de contenido (Gate B) — de QUÉ trata la meta.
  // El par (family, subfamily) lo valida validateCategory en prepareGoalData.
  family?: GoalFamily
  subfamily?: string
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
  static async createCorporateGoal(input: Omit<CreateGoalInput, 'level' | 'originType' | 'parentId' | 'kpiSource'>): Promise<Goal> {
    // Validar duplicado corporativo
    await this.validateCompanyAreaDuplicate(input.accountId, input.title, 'COMPANY', input.periodYear)

    // El Estratega ESCRIBE su propio KPI corporativo → OWN (exige "¿Cómo se mide?").
    const data = this.prepareGoalData({ ...input, kpiSource: 'OWN' })
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
    const created = await prisma.goal.create({ data })
    await this.emitGoalAssignedAlert(created)
    return created
  }

  /**
   * Crear meta de jefe (sin padre, válida pero no alineada)
   */
  static async createManagerGoal(input: Omit<CreateGoalInput, 'originType' | 'parentId' | 'kpiSource'>): Promise<Goal> {
    // Validaciones si es meta individual (tiene employeeId)
    if (input.employeeId) {
      await this.validateGoalLimit(input.accountId, input.employeeId)
      await this.validateTotalWeight(input.accountId, input.employeeId, input.weight || 0)
    }

    // El jefe ESCRIBE su propio KPI (Camino D sin padre) → OWN.
    const data = this.prepareGoalData({ ...input, kpiSource: 'OWN' })
    data.originType = 'MANAGER_CREATED'
    data.isAligned = false
    data.isOrphan = true
    data.goalCycleId = await this.resolveInheritedCycleId(input.accountId)
    const created = await prisma.goal.create({ data })
    await this.emitGoalAssignedAlert(created)
    return created
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
      throw new GoalLimitReachedError(check.current, check.max)
    }
  }

  /**
   * Gate A — el presupuesto de 100% es POR CICLO, no acumulado histórico.
   *
   * Consecuencia de la decisión de rollover: una meta de un ciclo ya cerrado es
   * registro histórico congelado; no puede seguir gastando presupuesto del ciclo
   * vigente. Solo cuentan las metas vivas ANCLADAS AL CICLO ACTIVO.
   *
   * FALLA CERRADO sin ciclo activo: Gate E (el 409 de "no hay ciclo") vive solo
   * en las rutas, y al servicio se entra directo desde scripts (el seed lo hace).
   * Una validación que solo existe en la ruta es una validación que un script
   * futuro se saltea sin que nadie lo note.
   *
   * @param excludeGoalId  PATCH: la meta que se está editando no cuenta contra sí misma.
   */
  private static async validateTotalWeight(
    accountId: string,
    employeeId: string,
    newWeight: number,
    excludeGoalId?: string
  ): Promise<void> {
    const activeCycle = await GoalCycleService.getActiveCycle(accountId)
    if (!activeCycle) {
      throw new GoalNoActiveCycleError()
    }

    const currentGoals = await prisma.goal.findMany({
      where: {
        accountId,
        employeeId,
        level: 'INDIVIDUAL',
        status: { in: ['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND'] },
        goalCycleId: activeCycle.id,
        ...(excludeGoalId ? { id: { not: excludeGoalId } } : {}),
      },
      select: { weight: true }
    })

    const currentTotalWeight = currentGoals.reduce((sum, g) => sum + (g.weight || 0), 0)

    if (currentTotalWeight + newWeight > 100) {
      throw new GoalWeightExceededError(currentTotalWeight, newWeight)
    }
  }

  /**
   * Gate A — puerta pública para el PATCH de edición (BUG 1: hoy no revalidaba).
   * El validador de fondo es privado; esto lo expone SOLO para el caso de update,
   * donde hay que excluir a la propia meta de la suma.
   */
  static async validateWeightForUpdate(
    accountId: string,
    employeeId: string,
    newWeight: number,
    goalId: string
  ): Promise<void> {
    await this.validateTotalWeight(accountId, employeeId, newWeight, goalId)
  }

  /**
   * Gate A (BUG 4) — el objetivo no puede ser igual al valor inicial.
   *
   * Sin esta regla, calculateProgress devuelve 100% cuando range === 0 (ver su
   * guarda de división por cero): una meta con start = target = 0 nace "cumplida"
   * con el primer check-in de valor 0, y arrastra su peso COMPLETO al hybridScore
   * de la persona sin que haya hecho ningún trabajo real.
   *
   * BINARY queda fuera a propósito: se mide 0/1, no por rango.
   */
  private static validateKpiRange(
    metricType: GoalMetricType | undefined,
    startValue: number | undefined,
    targetValue: number
  ): void {
    if ((metricType ?? 'PERCENTAGE') === 'BINARY') return
    const start = startValue ?? 0
    if (targetValue === start) {
      throw new GoalKpiRangeError(start, targetValue)
    }
  }

  /**
   * Gate B — la subfamilia debe pertenecer a su familia.
   *
   * `subfamily` es String en la base (decisión consciente: las listas de 3 de las 4
   * familias siguen sin confirmar, y un enum costaría un db push contra producción
   * por cada confirmación de copy). El precio es que la base no impone integridad:
   * esta función es la contraparte, y NINGÚN creador escribe categoría sin pasar por acá.
   *
   * Sin categoría es válido: las metas anteriores a Gate B (y las que nadie quiera
   * etiquetar) viven perfectamente con family/subfamily en null.
   */
  private static validateCategory(family?: GoalFamily, subfamily?: string): void {
    if (!family && !subfamily) return // sin categoría: válido

    if (subfamily && !family) {
      throw new GoalCategoryError('No se puede definir una subfamilia sin familia')
    }
    if (family && subfamily && !isValidSubfamily(family, subfamily)) {
      throw new GoalCategoryError(
        `"${subfamily}" no es una subfamilia válida de ${GOAL_FAMILY_LABELS[family]}`
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
      throw new GoalDuplicateError('Este empleado ya tiene asignada esta meta')
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
      throw new GoalDuplicateError(
        `Ya existe una meta ${levelLabel} "${title}" para el período ${periodYear}`
      )
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
    // 0. Gate A (BUG 4): este creador NO pasa por prepareGoalData (arma su propio
    //    create abajo), así que la regla de KPI se aplica explícitamente acá.
    //    startValue es fijo 0 y metricType fijo PERCENTAGE en este camino.
    this.validateKpiRange('PERCENTAGE', 0, input.targetValue)

    // 1. Verificar límite
    const limitCheck = await this.checkGoalLimit(accountId, employeeId)
    if (!limitCheck.canCreate) {
      throw new GoalLimitReachedError(limitCheck.current, limitCheck.max)
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

    // 4. Crear la meta con la conexión.
    // Punto 2: este creador NO pasa por prepareGoalData, así que replica el check.
    // El KPI lo escribe la persona (deriva de su PDI) → OWN. La description RESUELTA
    // (input o el default derivado del PDI) debe ser no vacía.
    const resolvedDescription = input.description?.trim() || `Meta derivada de PDI: ${devGoal.title}`
    this.validateDescriptionForKpi('OWN', resolvedDescription)

    const created = await prisma.goal.create({
      data: {
        accountId,
        employeeId,
        createdById,
        title: input.title,
        description: resolvedDescription,
        kpiSource: 'OWN',
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
    await this.emitGoalAssignedAlert(created)
    return created
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

  // ── Helpers de scope (parametrizados por acción) ────────────────────────────
  // Reproducen EXACTAMENTE el scope que hoy vive inline en las rutas y devuelven
  // el nombre a registrar (mismos fallbacks), o lanzan FORBIDDEN_SCOPE con el
  // mensaje idéntico al de la ruta.
  //   - request: 4 ramas (global / AREA_MANAGER / EVALUATOR / dueño)
  //   - approve+reject: 2 ramas (global / AREA_MANAGER, no COMPANY)

  private static async resolveRequestClosureAuth(
    goal: GoalClosureScopeGoal,
    actor: GoalClosureActor
  ): Promise<string> {
    const hasGlobalAccess = (GLOBAL_ACCESS_ROLES as readonly string[]).includes(actor.role || '')
    let canRequestClosure = false
    // Nombre real del actor: Employee.fullName → nombre del User logueado → email.
    // Sin literales genéricos (el usuario ejecutivo sin fila Employee ya no cae a 'Administrador').
    const requestedByName = actor.employeeName || actor.userName || actor.userEmail || ''

    if (hasGlobalAccess) {
      canRequestClosure = true
    } else if (actor.role === 'AREA_MANAGER' && actor.departmentId) {
      const childIds = await getChildDepartmentIds(actor.departmentId)
      const allowedDepts = [actor.departmentId, ...childIds]
      if (goal.level === 'COMPANY') {
        canRequestClosure = false
      } else if (goal.level === 'AREA' && goal.departmentId) {
        canRequestClosure = allowedDepts.includes(goal.departmentId)
      } else if (goal.level === 'INDIVIDUAL' && goal.owner?.departmentId) {
        canRequestClosure = allowedDepts.includes(goal.owner.departmentId)
      }
    } else if (actor.role === 'EVALUATOR' && actor.employeeId) {
      if (goal.level === 'INDIVIDUAL' && goal.owner?.managerId === actor.employeeId) {
        canRequestClosure = true
      }
    } else if (actor.employeeId) {
      // Usuario regular: solo sus propias metas INDIVIDUAL
      if (goal.level === 'INDIVIDUAL' && goal.employeeId === actor.employeeId) {
        canRequestClosure = true
      }
    }

    if (!canRequestClosure) {
      throw new GoalClosureError('FORBIDDEN_SCOPE', 'No tiene permisos para solicitar cierre de esta meta')
    }
    return requestedByName
  }

  private static async resolveApproveClosureAuth(
    goal: GoalClosureScopeGoal,
    actor: GoalClosureActor
  ): Promise<string> {
    const hasGlobalAccess = (GLOBAL_ACCESS_ROLES as readonly string[]).includes(actor.role || '')
    let canApprove = false
    // Nombre real: Employee.fullName → nombre del User logueado → email (sin literal genérico)
    const approverName = actor.employeeName || actor.userName || actor.userEmail || ''

    if (hasGlobalAccess) {
      canApprove = true
    } else if (actor.role === 'AREA_MANAGER' && actor.departmentId) {
      const childIds = await getChildDepartmentIds(actor.departmentId)
      const allowedDepts = [actor.departmentId, ...childIds]
      if (goal.level === 'COMPANY') {
        canApprove = false
      } else if (goal.level === 'AREA' && goal.departmentId) {
        canApprove = allowedDepts.includes(goal.departmentId)
      } else if (goal.level === 'INDIVIDUAL' && goal.owner?.departmentId) {
        canApprove = allowedDepts.includes(goal.owner.departmentId)
      }
    }

    if (!canApprove) {
      throw new GoalClosureError('FORBIDDEN_SCOPE', 'No tiene permisos para aprobar esta meta')
    }
    return approverName
  }

  // ──────────────────────────────────────────────────────────────────────────
  // AVISOS PERSONALES (GoalAlert) — bandeja slim / read receipt
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Emite un GoalAlert. Acepta el cliente de transacción (para emisión atómica
   * dentro de un $transaction) o el prisma base. Si no hay destinatario
   * direccionable → no emite (fail-open silencioso, edge documentado).
   */
  private static async emitGoalAlert(
    client: Prisma.TransactionClient,
    params: {
      accountId: string
      goalId: string
      recipientEmployeeId: string | null | undefined
      type: GoalAlertType
      title: string
      body?: string
      context?: Prisma.InputJsonValue
    }
  ): Promise<void> {
    if (!params.recipientEmployeeId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⏭️ GoalAlert ${params.type} sin destinatario para goal ${params.goalId} — skip`)
      }
      return
    }
    await client.goalAlert.create({
      data: {
        accountId: params.accountId,
        goalId: params.goalId,
        recipientEmployeeId: params.recipientEmployeeId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        context: params.context ?? Prisma.JsonNull,
      },
    })
  }

  /**
   * Aviso GOAL_ASSIGNED (best-effort, fuera de transacción). Solo si el goal
   * tiene dueño (employeeId). Un fallo del aviso NO rompe la creación de la meta.
   */
  private static async emitGoalAssignedAlert(goal: Goal): Promise<void> {
    if (!goal.employeeId) return
    try {
      await this.emitGoalAlert(prisma, {
        accountId: goal.accountId,
        goalId: goal.id,
        recipientEmployeeId: goal.employeeId,
        type: 'GOAL_ASSIGNED',
        title: 'Nueva meta asignada',
        body: goal.title,
      })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ No se pudo emitir GoalAlert GOAL_ASSIGNED para goal ${goal.id}:`, err)
      }
    }
  }

  /**
   * Solicitar cierre de meta.
   * Único lugar con la lógica (antes inline en request-closure/route.ts).
   * @param opts.enforceMinProgress gate ≥80% — default TRUE (flujo interactivo).
   *   Un caller administrativo/forzado puede pasar false (p.ej. cierre de ciclo).
   */
  static async requestClosure(
    goalId: string,
    actor: GoalClosureActor,
    opts?: { enforceMinProgress?: boolean }
  ): Promise<GoalWithClosureRelations> {
    const enforceMinProgress = opts?.enforceMinProgress ?? true

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId: actor.accountId },
      include: GOAL_CLOSURE_SCOPE_INCLUDE,
    })
    if (!goal) throw new GoalClosureError('NOT_FOUND', 'Meta no encontrada')

    // Guards de estado (mismo orden que la ruta: la primera que aplica gana)
    if (goal.status === 'COMPLETED') {
      throw new GoalClosureError('INVALID_STATE', 'La meta ya está completada')
    }
    if (goal.status === 'CANCELLED') {
      throw new GoalClosureError('INVALID_STATE', 'No se puede cerrar una meta cancelada')
    }
    if (goal.status === 'PENDING_CLOSURE') {
      throw new GoalClosureError('INVALID_STATE', 'La meta ya tiene una solicitud de cierre pendiente')
    }

    if (enforceMinProgress && goal.progress < 80) {
      throw new GoalClosureError(
        'MIN_PROGRESS',
        `La meta debe tener al menos 80% de progreso para solicitar cierre. Progreso actual: ${goal.progress}%`
      )
    }

    const requestedByName = await this.resolveRequestClosureAuth(goal, actor)
    const updatedById = actor.employeeId || actor.userId || actor.accountId

    return prisma.$transaction(async (tx) => {
      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          status: 'PENDING_CLOSURE',
          closureRequestedAt: new Date(),
          closureRequestedBy: requestedByName,
          closureRequestedById: actor.employeeId ?? null,
        },
        include: GOAL_CLOSURE_RESPONSE_INCLUDE,
      })
      await tx.goalProgressUpdate.create({
        data: {
          goalId,
          accountId: actor.accountId,
          previousValue: goal.currentValue,
          newValue: goal.currentValue,
          previousProgress: goal.progress,
          newProgress: goal.progress,
          comment: `Solicitud de cierre enviada por ${requestedByName}`,
          updatedById,
        },
      })
      return updated
    })
  }

  /**
   * Aprobar cierre de meta. Único lugar con la lógica (antes inline en la ruta).
   */
  static async approveClosure(
    goalId: string,
    actor: GoalClosureActor,
    opts?: { notes?: string }
  ): Promise<GoalWithClosureRelations> {
    const notes = opts?.notes

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId: actor.accountId },
      include: GOAL_CLOSURE_SCOPE_INCLUDE,
    })
    if (!goal) throw new GoalClosureError('NOT_FOUND', 'Meta no encontrada')
    if (goal.status !== 'PENDING_CLOSURE') {
      throw new GoalClosureError('INVALID_STATE', 'La meta no está pendiente de aprobación')
    }

    const approverName = await this.resolveApproveClosureAuth(goal, actor)
    const updatedById = actor.employeeId || actor.userId || actor.accountId
    const now = new Date()

    return prisma.$transaction(async (tx) => {
      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          status: 'COMPLETED',
          closedAt: now,
          closedBy: approverName,
          closureApprovedBy: approverName,
          closureNotes: notes || null,
          completedAt: now,
        },
        include: GOAL_CLOSURE_RESPONSE_INCLUDE,
      })
      await tx.goalProgressUpdate.create({
        data: {
          goalId,
          accountId: actor.accountId,
          previousValue: goal.currentValue,
          newValue: goal.currentValue,
          previousProgress: goal.progress,
          newProgress: goal.progress,
          comment: `Meta aprobada y completada por ${approverName}${notes ? `. Notas: ${notes}` : ''}`,
          updatedById,
        },
      })
      // Aviso al solicitante (recipient = quien pidió el cierre)
      await this.emitGoalAlert(tx, {
        accountId: actor.accountId,
        goalId,
        recipientEmployeeId: goal.closureRequestedById,
        type: 'CLOSURE_APPROVED',
        title: 'Cierre de meta aprobado',
        body: goal.title,
        context: { actorName: approverName, notes: notes ?? null },
      })
      return updated
    })
  }

  /**
   * Rechazar cierre de meta. Único lugar con la lógica (antes inline en la ruta).
   * closureNotes = motivo CRUDO (el "quién rechazó" vive en la auditoría).
   */
  static async rejectClosure(
    goalId: string,
    actor: GoalClosureActor,
    opts: { reason: string }
  ): Promise<GoalWithClosureRelations> {
    const { reason } = opts
    if (!reason) {
      throw new GoalClosureError('REASON_REQUIRED', 'Debe proporcionar un motivo para rechazar')
    }

    const goal = await prisma.goal.findFirst({
      where: { id: goalId, accountId: actor.accountId },
      include: GOAL_CLOSURE_SCOPE_INCLUDE,
    })
    if (!goal) throw new GoalClosureError('NOT_FOUND', 'Meta no encontrada')
    if (goal.status !== 'PENDING_CLOSURE') {
      throw new GoalClosureError('INVALID_STATE', 'La meta no está pendiente de aprobación')
    }

    const approverName = await this.resolveApproveClosureAuth(goal, actor)
    const updatedById = actor.employeeId || actor.userId || actor.accountId

    // Reversión de estado según progreso — 4 categorías (comportamiento de la ruta)
    const previousStatus: GoalStatus =
      goal.progress >= 90 ? 'ON_TRACK'
        : goal.progress >= 70 ? 'AT_RISK'
        : goal.progress > 0 ? 'BEHIND'
        : 'NOT_STARTED'

    return prisma.$transaction(async (tx) => {
      const updated = await tx.goal.update({
        where: { id: goalId },
        data: {
          status: previousStatus,
          closureRequestedAt: null,
          closureRequestedBy: null,
          closureRequestedById: null,
          closureNotes: reason || null,
        },
        include: GOAL_CLOSURE_RESPONSE_INCLUDE,
      })
      await tx.goalProgressUpdate.create({
        data: {
          goalId,
          accountId: actor.accountId,
          previousValue: goal.currentValue,
          newValue: goal.currentValue,
          previousProgress: goal.progress,
          newProgress: goal.progress,
          comment: `Solicitud de cierre rechazada por ${approverName}. Motivo: ${reason}`,
          updatedById,
        },
      })
      // Aviso al solicitante (recipient = quien pidió el cierre, capturado antes de limpiar)
      await this.emitGoalAlert(tx, {
        accountId: actor.accountId,
        goalId,
        recipientEmployeeId: goal.closureRequestedById,
        type: 'CLOSURE_REJECTED',
        title: 'Solicitud de cierre rechazada',
        body: goal.title,
        context: { actorName: approverName, reason },
      })
      return updated
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

  // ══════════════════════════════════════════════════════════════════════════
  // GATE B — PUENTE CON OTROS MÓDULOS (hoy: Clima)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * La meta corporativa VIVA de una categoría, en el ciclo ACTIVO.
   *
   * La consume Clima para saber si existe "la meta corporativa de Clima" SIN ningún
   * mecanismo de asociación manual: es una búsqueda directa por etiqueta.
   *
   * "ACTIVA" = decisión (a) de Victor: EXIGE GoalCycle.status === 'ACTIVE'. No alcanza
   * con que la meta no esté en estado terminal — una corporativa de un ciclo cerrado es
   * histórico congelado, no una meta vigente a la que colgarse.
   *
   * ⚠️ NO CONFUNDIR LOS DOS ESCENARIOS (son distintos y se resuelven distinto):
   *
   *   · Devuelve null ACÁ  → HAY ciclo activo, pero nadie definió la corporativa de esa
   *                          categoría. El llamador crea su meta individual IGUAL, con
   *                          family/subfamily y SIN parentId (fallback acordado).
   *
   *   · NO hay ciclo activo → NO se crea NINGUNA meta, con padre o sin padre. Lo corta
   *                          Gate E antes (409 en POST /api/goals) y validateTotalWeight
   *                          falla cerrado en el servicio. Nunca llega hasta acá.
   */
  static async findActiveStrategicGoal(
    accountId: string,
    family: GoalFamily,
    subfamily: string
  ): Promise<Goal | null> {
    return prisma.goal.findFirst({
      where: {
        accountId, // multi-tenant, siempre
        level: 'COMPANY',
        family,
        subfamily,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        goalCycle: { status: 'ACTIVE' }, // ← decisión (a)
      },
      orderBy: { createdAt: 'desc' }, // si hubiera más de una, la más reciente
    })
  }

  /**
   * Línea base de clima de un departamento, para sugerir el objetivo de una meta de
   * subfamilia "Clima".
   *
   * Decisión de Victor — se muestra el DATO REAL, por viejo que sea:
   *
   *   · Con medición histórica (accumulatedClimaFavorability != null):
   *       devuelve ese valor TAL CUAL + su antigüedad en meses. NO se combina, NO se
   *       promedia, NO se topea contra el objetivo de mercado. El usuario ve su número
   *       real y decide con la antigüedad a la vista.
   *
   *   · Sin ninguna medición (null):
   *       recién ahí devuelve CLIMA_TARGET_FAVORABILITY (75), marcado como
   *       isFallback=true → es una REFERENCIA DE MERCADO, no un resultado propio.
   *       Quien lo muestre debe decirlo explícito.
   *
   * El contrato distingue los 2 casos a propósito: devolver un solo número los volvería
   * indistinguibles, y "75 porque no tengo datos" no es lo mismo que "75 medido".
   */
  static async getClimaBaseline(
    accountId: string,
    departmentId: string
  ): Promise<{ value: number; isFallback: boolean; monthsAgo?: number }> {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, accountId }, // multi-tenant
      select: {
        accumulatedClimaFavorability: true,
        accumulatedClimaLastUpdated: true,
      },
    })

    // Sin departamento o sin ninguna medición → referencia de mercado.
    if (!dept || dept.accumulatedClimaFavorability == null) {
      return { value: CLIMA_TARGET_FAVORABILITY, isFallback: true }
    }

    const lastUpdated = dept.accumulatedClimaLastUpdated
    const monthsAgo = lastUpdated
      ? Math.max(
          0,
          Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
        )
      : undefined

    return {
      value: dept.accumulatedClimaFavorability,
      isFallback: false,
      ...(monthsAgo !== undefined ? { monthsAgo } : {}),
    }
  }

  private static prepareGoalData(input: Partial<CreateGoalInput> & Pick<CreateGoalInput, 'accountId' | 'title' | 'createdById' | 'startDate' | 'dueDate' | 'periodYear' | 'targetValue'>): Prisma.GoalUncheckedCreateInput {
    // Gate A (BUG 4): puerta única de los 3 creadores que pasan por acá
    // (createCorporateGoal, cascadeGoal, createManagerGoal). El 4to
    // (createFromDevelopmentGoal) la llama por su cuenta.
    this.validateKpiRange(input.metricType, input.startValue, input.targetValue)

    // Punto 2: "¿Cómo se mide?" obligatorio SOLO cuando el KPI es autoría propia
    // (OWN). No exige mínimo de longitud — cualquier texto no vacío pasa; los
    // ejemplos por Familia×metricType ya guían la calidad. INHERITED y null (metas
    // sin provenance) no exigen: leen el KPI del padre.
    this.validateDescriptionForKpi(input.kpiSource, input.description)

    // Gate B: `subfamily` es String en la base (no enum) → ESTA es la única puerta
    // que impide que entren valores sueltos o variantes de tipeo.
    this.validateCategory(input.family, input.subfamily)

    // Integridad de propiedad: una meta AREA/COMPANY es un MOLDE — nunca tiene dueño
    // individual. El peso-contra-persona vive SOLO en metas INDIVIDUAL (checkGoalLimit
    // y validateTotalWeight filtran level:'INDIVIDUAL'); una AREA/COMPANY con employeeId
    // quedaría colgada de una persona sin que ninguna de esas dos la cuente. Para asignar
    // una meta de área a alguien existe el banco (Camino B/C): genera una COPIA INDIVIDUAL.
    // employeeId TRUTHY (un '' no dispara: es "sin dueño", igual que undefined).
    if ((input.level === 'AREA' || input.level === 'COMPANY') && input.employeeId) {
      throw new GoalOwnerLevelMismatchError(input.level)
    }

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

      // Categoría de contenido (Gate B). Nullable: una meta sin categorizar es
      // legítima (todas las anteriores a este gate lo están).
      family: input.family,
      subfamily: input.subfamily,

      // Autoría del KPI (Punto 2). Persistido para auditoría posterior.
      kpiSource: input.kpiSource ?? null,
    }
  }

  /**
   * Punto 2 — "¿Cómo se mide?" (description) obligatorio SOLO para KPI de autoría
   * propia (OWN). Obligatorio = no vacío; SIN piso de longitud. INHERITED y
   * undefined (provenance desconocida) no exigen.
   */
  private static validateDescriptionForKpi(kpiSource: GoalKpiSource | undefined, description?: string): void {
    if (kpiSource === 'OWN' && !description?.trim()) {
      throw new GoalDescriptionRequiredError()
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
