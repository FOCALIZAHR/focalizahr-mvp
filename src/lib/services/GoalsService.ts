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
    const data = this.prepareGoalData(input)
    data.level = 'COMPANY'
    data.originType = 'STRATEGIC_CASCADE'
    data.isAligned = true
    data.isOrphan = false
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

    const data = this.prepareGoalData(input)
    data.parentId = parentId
    data.originType = 'STRATEGIC_CASCADE'
    data.isAligned = parent.isAligned
    data.isOrphan = false
    return prisma.goal.create({ data })
  }

  /**
   * Crear meta de jefe (sin padre, válida pero no alineada)
   */
  static async createManagerGoal(input: Omit<CreateGoalInput, 'originType' | 'parentId'>): Promise<Goal> {
    const data = this.prepareGoalData(input)
    data.originType = 'MANAGER_CREATED'
    data.isAligned = false
    data.isOrphan = true
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
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

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
    // BINARY: 0 o 100
    if (metricType === 'BINARY') {
      return currentValue >= 1 ? 100 : 0
    }

    // Evitar división por cero
    const range = targetValue - startValue
    if (range === 0) return currentValue >= targetValue ? 100 : 0

    // Cálculo estándar: (current - start) / (target - start) * 100
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
