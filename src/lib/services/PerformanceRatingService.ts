// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RATING SERVICE
// src/lib/services/PerformanceRatingService.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { PerformanceResultsService } from './PerformanceResultsService'
import {
  FOCALIZAHR_DEFAULT_CONFIG,
  getPerformanceClassification,
  getPerformanceLevel,
  calculate9BoxPosition,
  scoreToNineBoxLevel,
  calculateAdjustmentType,
  resolveEvaluatorWeights,
  calculateWeightedScore,
  type PerformanceRatingConfigData,
  type PerformanceLevelConfig,
  type EvaluatorWeights,
  AdjustmentType
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface GenerateRatingResult {
  rating: {
    id: string
    calculatedScore: number
    calculatedLevel: string
    selfScore: number | null
    managerScore: number | null
    peerAvgScore: number | null
    upwardAvgScore: number | null
    evaluationCompleteness: number | null
  }
  classification: PerformanceLevelConfig
}

export interface CalibrateRatingInput {
  ratingId: string
  finalScore: number
  adjustmentReason: string
  calibratedBy: string
  sessionId?: string
}

export interface RatePotentialInput {
  ratingId: string
  potentialScore: number
  notes?: string
  ratedBy: string
}

export interface BulkGenerateResult {
  success: number
  failed: number
  errors: Array<{ employeeId: string; error: string }>
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class PerformanceRatingService {

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene config del cliente o default de FocalizaHR
   */
  static async getConfig(accountId: string): Promise<PerformanceRatingConfigData> {
    const customConfig = await prisma.performanceRatingConfig.findUnique({
      where: { accountId }
    })

    if (customConfig?.levels && Array.isArray(customConfig.levels) && (customConfig.levels as any[]).length > 0) {
      return {
        scaleType: customConfig.scaleType as 'three_level' | 'five_level' | 'custom',
        levels: customConfig.levels as unknown as PerformanceLevelConfig[]
      }
    }

    return FOCALIZAHR_DEFAULT_CONFIG
  }

  /**
   * Obtiene pesos de evaluadores resueltos (cycle.override ?? account.config ?? default)
   * Patrón Enterprise: Workday, SuccessFactors, Lattice
   */
  static async getResolvedWeights(
    accountId: string,
    cycleId?: string
  ): Promise<EvaluatorWeights> {
    // Nivel 2: Override de ciclo
    let cycleWeights: EvaluatorWeights | null = null
    if (cycleId) {
      const cycle = await prisma.performanceCycle.findUnique({
        where: { id: cycleId },
        select: { evaluatorWeightsOverride: true }
      })
      if (cycle?.evaluatorWeightsOverride) {
        cycleWeights = cycle.evaluatorWeightsOverride as unknown as EvaluatorWeights
      }
    }

    // Nivel 1: Config de cuenta
    let accountWeights: EvaluatorWeights | null = null
    const accountConfig = await prisma.performanceRatingConfig.findUnique({
      where: { accountId },
      select: { evaluatorWeights: true }
    })
    if (accountConfig?.evaluatorWeights) {
      accountWeights = accountConfig.evaluatorWeights as unknown as EvaluatorWeights
    }

    // Resolver usando jerarquía: cycle ?? account ?? default
    return resolveEvaluatorWeights(cycleWeights, accountWeights)
  }

  /**
   * Guarda config personalizada para un cliente
   */
  static async saveConfig(
    accountId: string,
    config: PerformanceRatingConfigData
  ) {
    return prisma.performanceRatingConfig.upsert({
      where: { accountId },
      create: {
        accountId,
        scaleType: config.scaleType,
        levels: config.levels as any
      },
      update: {
        scaleType: config.scaleType,
        levels: config.levels as any,
        updatedAt: new Date()
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE RATINGS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Genera rating para un empleado en un ciclo
   * IMPORTANTE: Usa ponderación configurable (cycle ?? account ?? default)
   */
  static async generateRating(
    cycleId: string,
    employeeId: string,
    accountId: string
  ): Promise<GenerateRatingResult> {
    // 1. Obtener resultados calculados (scores por tipo evaluador)
    const results = await PerformanceResultsService.getEvaluateeResults(cycleId, employeeId)

    // 2. Obtener config del cliente (escalas de clasificación)
    const config = await this.getConfig(accountId)

    // 3. Obtener pesos resueltos (cycle.override ?? account.config ?? default)
    const weights = await this.getResolvedWeights(accountId, cycleId)

    // 4. Calcular score ponderado (NO promedio simple)
    const weightedScore = calculateWeightedScore(
      {
        self: results.selfScore,
        manager: results.managerScore,
        peer: results.peerAvgScore,
        upward: results.upwardAvgScore
      },
      weights
    )

    // 5. Clasificar según config
    const classification = getPerformanceClassification(weightedScore, config)

    // 6. Upsert rating en DB
    const rating = await prisma.performanceRating.upsert({
      where: {
        cycleId_employeeId: { cycleId, employeeId }
      },
      create: {
        accountId,
        cycleId,
        employeeId,
        calculatedScore: weightedScore,
        calculatedLevel: classification.level,
        selfScore: results.selfScore,
        managerScore: results.managerScore,
        peerAvgScore: results.peerAvgScore,
        upwardAvgScore: results.upwardAvgScore,
        evaluationCompleteness: results.evaluationCompleteness,
        totalEvaluations: results.totalEvaluations,
        completedEvaluations: results.completedEvaluations
      },
      update: {
        calculatedScore: weightedScore,
        calculatedLevel: classification.level,
        selfScore: results.selfScore,
        managerScore: results.managerScore,
        peerAvgScore: results.peerAvgScore,
        upwardAvgScore: results.upwardAvgScore,
        evaluationCompleteness: results.evaluationCompleteness,
        totalEvaluations: results.totalEvaluations,
        completedEvaluations: results.completedEvaluations,
        updatedAt: new Date()
      }
    })

    return {
      rating: {
        id: rating.id,
        calculatedScore: rating.calculatedScore,
        calculatedLevel: rating.calculatedLevel,
        selfScore: rating.selfScore,
        managerScore: rating.managerScore,
        peerAvgScore: rating.peerAvgScore,
        upwardAvgScore: rating.upwardAvgScore,
        evaluationCompleteness: rating.evaluationCompleteness
      },
      classification
    }
  }

  /**
   * Genera ratings para todos los empleados de un ciclo
   */
  static async generateRatingsForCycle(
    cycleId: string,
    accountId: string
  ): Promise<BulkGenerateResult> {
    const evaluatees = await PerformanceResultsService.listEvaluateesInCycle(cycleId)

    const result: BulkGenerateResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const evaluatee of evaluatees) {
      try {
        await this.generateRating(cycleId, evaluatee.evaluateeId, accountId)
        result.success++
      } catch (error) {
        result.failed++
        result.errors.push({
          employeeId: evaluatee.evaluateeId,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return result
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALIBRACIÓN
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Calibra un rating (ajuste manual)
   */
  static async calibrateRating(input: CalibrateRatingInput) {
    const { ratingId, finalScore, adjustmentReason, calibratedBy, sessionId } = input

    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId }
    })

    if (!rating) {
      throw new Error('Rating no encontrado')
    }

    const config = await this.getConfig(rating.accountId)
    const finalClassification = getPerformanceClassification(finalScore, config)
    const adjustmentType = calculateAdjustmentType(rating.calculatedScore, finalScore)

    return prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        finalScore,
        finalLevel: finalClassification.level,
        calibrated: true,
        calibratedAt: new Date(),
        calibratedBy,
        calibrationSessionId: sessionId || null,
        adjustmentReason,
        adjustmentType,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Revierte calibración
   */
  static async revertCalibration(ratingId: string, revertedBy: string) {
    return prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        finalScore: null,
        finalLevel: null,
        calibrated: false,
        calibratedAt: null,
        calibratedBy: null,
        calibrationSessionId: null,
        adjustmentReason: `Revertido por ${revertedBy}`,
        adjustmentType: null,
        updatedAt: new Date()
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 9-BOX: POTENTIAL RATING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Agrega rating de potencial (para 9-Box)
   */
  static async ratePotential(input: RatePotentialInput) {
    const { ratingId, potentialScore, notes, ratedBy } = input

    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId }
    })

    if (!rating) {
      throw new Error('Rating no encontrado')
    }

    const potentialLevel = scoreToNineBoxLevel(potentialScore)
    const performanceScore = rating.finalScore ?? rating.calculatedScore
    const performanceLevel = scoreToNineBoxLevel(performanceScore)
    const nineBoxPosition = calculate9BoxPosition(performanceLevel, potentialLevel)

    return prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        potentialScore,
        potentialLevel,
        potentialRatedBy: ratedBy,
        potentialRatedAt: new Date(),
        potentialNotes: notes || null,
        nineBoxPosition,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Recalcula posición 9-Box
   */
  static async recalculate9BoxPosition(ratingId: string) {
    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId }
    })

    if (!rating || !rating.potentialScore) {
      return null
    }

    const potentialLevel = scoreToNineBoxLevel(rating.potentialScore)
    const performanceScore = rating.finalScore ?? rating.calculatedScore
    const performanceLevel = scoreToNineBoxLevel(performanceScore)
    const nineBoxPosition = calculate9BoxPosition(performanceLevel, potentialLevel)

    return prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        nineBoxPosition,
        updatedAt: new Date()
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene rating por ID con clasificación
   */
  static async getRatingById(ratingId: string) {
    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true
          }
        },
        cycle: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!rating) return null

    const config = await this.getConfig(rating.accountId)
    const effectiveScore = rating.finalScore ?? rating.calculatedScore
    const classification = getPerformanceClassification(effectiveScore, config)

    return {
      ...rating,
      effectiveScore,
      classification
    }
  }

  /**
   * Lista ratings de un ciclo con clasificaciones
   */
  static async listRatingsForCycle(
    cycleId: string,
    options?: {
      page?: number
      limit?: number
      sortBy?: 'name' | 'score' | 'level'
      sortOrder?: 'asc' | 'desc'
      filterLevel?: string
      filterNineBox?: string
      filterCalibrated?: boolean
    }
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      filterLevel,
      filterNineBox,
      filterCalibrated
    } = options || {}

    const where: any = { cycleId }

    if (filterLevel) {
      where.OR = [
        { finalLevel: filterLevel },
        { calculatedLevel: filterLevel, finalLevel: null }
      ]
    }

    if (filterNineBox) {
      where.nineBoxPosition = filterNineBox
    }

    if (filterCalibrated !== undefined) {
      where.calibrated = filterCalibrated
    }

    const total = await prisma.performanceRating.count({ where })

    const ratings = await prisma.performanceRating.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true,
            department: {
              select: {
                displayName: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy === 'name'
        ? { employee: { fullName: sortOrder } }
        : sortBy === 'score'
          ? { calculatedScore: sortOrder }
          : { calculatedLevel: sortOrder }
    })

    if (ratings.length === 0) {
      return {
        data: [],
        pagination: { page, limit, total, pages: 0 }
      }
    }

    const config = await this.getConfig(ratings[0].accountId)

    const ratingsWithClassification = ratings.map(rating => {
      const effectiveScore = rating.finalScore ?? rating.calculatedScore
      const classification = getPerformanceClassification(effectiveScore, config)

      return {
        ...rating,
        effectiveScore,
        effectiveLevel: rating.finalLevel ?? rating.calculatedLevel,
        classification
      }
    })

    return {
      data: ratingsWithClassification,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Obtiene distribución de ratings de un ciclo
   */
  static async getRatingDistribution(cycleId: string) {
    const ratings = await prisma.performanceRating.findMany({
      where: { cycleId },
      select: {
        calculatedLevel: true,
        finalLevel: true,
        calibrated: true
      }
    })

    const distribution: Record<string, { calculated: number; final: number }> = {}

    for (const rating of ratings) {
      if (!distribution[rating.calculatedLevel]) {
        distribution[rating.calculatedLevel] = { calculated: 0, final: 0 }
      }
      distribution[rating.calculatedLevel].calculated++

      const effectiveLevel = rating.finalLevel ?? rating.calculatedLevel
      if (!distribution[effectiveLevel]) {
        distribution[effectiveLevel] = { calculated: 0, final: 0 }
      }
      distribution[effectiveLevel].final++
    }

    const total = ratings.length
    const calibratedCount = ratings.filter(r => r.calibrated).length

    return {
      total,
      calibratedCount,
      calibrationProgress: total > 0 ? Math.round((calibratedCount / total) * 100) : 0,
      distribution: Object.entries(distribution).map(([level, counts]) => ({
        level,
        calculatedCount: counts.calculated,
        calculatedPercent: total > 0 ? Math.round((counts.calculated / total) * 100) : 0,
        finalCount: counts.final,
        finalPercent: total > 0 ? Math.round((counts.final / total) * 100) : 0
      }))
    }
  }

  /**
   * Obtiene datos para 9-Box Grid
   */
  static async get9BoxData(cycleId: string) {
    const ratings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        nineBoxPosition: { not: null }
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: {
              select: {
                displayName: true
              }
            }
          }
        }
      }
    })

    const grid: Record<string, typeof ratings> = {}

    for (const rating of ratings) {
      const position = rating.nineBoxPosition!
      if (!grid[position]) {
        grid[position] = []
      }
      grid[position].push(rating)
    }

    return {
      total: ratings.length,
      grid,
      summary: Object.entries(grid).map(([position, employees]) => ({
        position,
        count: employees.length,
        percent: ratings.length > 0 ? Math.round((employees.length / ratings.length) * 100) : 0
      }))
    }
  }
}

export default PerformanceRatingService
