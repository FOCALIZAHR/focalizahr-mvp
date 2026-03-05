// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RATING SERVICE
// src/lib/services/PerformanceRatingService.ts
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { PerformanceResultsService } from './PerformanceResultsService'
import { calculatePotentialScore } from '@/lib/potential-assessment'
import {
  FOCALIZAHR_DEFAULT_CONFIG,
  getPerformanceClassification,
  getPerformanceLevel,
  calculate9BoxPosition,
  scoreToNineBoxLevel,
  calculateAdjustmentType,
  resolveEvaluatorWeights,
  calculateWeightedScore,
  getRoleFitLevel,
  type PerformanceRatingConfigData,
  type PerformanceLevelConfig,
  type EvaluatorWeights,
  AdjustmentType
} from '@/config/performanceClassification'
import { TalentIntelligenceService } from './TalentIntelligenceService'
import { getEvaluationClassification, STATUS_CONFIG, type EvaluationStatus } from '@/lib/utils/evaluatorStatsEngine'
import { RoleFitAnalyzer } from './RoleFitAnalyzer'
import { GoalsService } from './GoalsService'

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
  potentialScore?: number         // Opcional si se envían factores AAE
  aspiration?: 1 | 2 | 3          // Factor Aspiración
  ability?: 1 | 2 | 3             // Factor Capacidad
  engagement?: 1 | 2 | 3          // Factor Compromiso
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
  // HYBRID SCORE: Competencias + Metas
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula el score híbrido: Competencias (ponderado) + Metas (normalizado 1-5)
   * Si no hay metas o el ciclo no las incluye, retorna solo competencias.
   */
  static async calculateHybridScore(
    employeeId: string,
    competenciesScore: number,
    cycleEndDate: Date,
    cycleConfig: { competenciesWeight: number; goalsWeight: number; includeGoals: boolean }
  ): Promise<{
    competenciesScore: number
    competenciesWeight: number
    goalsScore: number | null
    goalsRawPercent: number | null
    goalsWeight: number
    goalsCount: number
    hybridScore: number
    includesGoals: boolean
  }> {
    const { competenciesWeight, goalsWeight, includeGoals } = cycleConfig

    // Si el ciclo no incluye metas, retornar solo competencias
    if (!includeGoals) {
      return {
        competenciesScore,
        competenciesWeight: 100,
        goalsScore: null,
        goalsRawPercent: null,
        goalsWeight: 0,
        goalsCount: 0,
        hybridScore: competenciesScore,
        includesGoals: false
      }
    }

    // Obtener score de metas con Time Travel (a la fecha del ciclo)
    let goalsData: { score: number; goalsCount: number } | null = null
    try {
      goalsData = await GoalsService.getEmployeeGoalsScore(employeeId, cycleEndDate)
    } catch (err) {
      console.warn(`[calculateHybridScore] Error obteniendo metas para ${employeeId}:`, err)
    }

    // Si no hay metas, usar solo competencias
    if (!goalsData || goalsData.goalsCount === 0) {
      return {
        competenciesScore,
        competenciesWeight: 100,
        goalsScore: null,
        goalsRawPercent: null,
        goalsWeight: 0,
        goalsCount: 0,
        hybridScore: competenciesScore,
        includesGoals: false
      }
    }

    // Normalizar porcentaje de metas a escala 1-5
    // 0% = 1.0, 50% = 3.0, 100% = 5.0
    const goalsPercent = goalsData.score
    const goalsNormalized = 1 + (goalsPercent / 100) * 4

    // Calcular score híbrido ponderado
    const compContribution = competenciesScore * (competenciesWeight / 100)
    const goalsContribution = goalsNormalized * (goalsWeight / 100)
    const hybridScore = compContribution + goalsContribution

    return {
      competenciesScore,
      competenciesWeight,
      goalsScore: Math.round(goalsNormalized * 100) / 100,
      goalsRawPercent: Math.round(goalsPercent * 100) / 100,
      goalsWeight,
      goalsCount: goalsData.goalsCount,
      hybridScore: Math.round(hybridScore * 100) / 100,
      includesGoals: true
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE RATINGS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Genera rating para un empleado en un ciclo
   * IMPORTANTE: Usa ponderación configurable (cycle ?? account ?? default)
   * Integra Goals Score cuando el ciclo tiene includeGoals=true
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

    // 5. Obtener config del ciclo para hybrid score
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      select: { endDate: true, competenciesWeight: true, goalsWeight: true, includeGoals: true }
    })

    // 5b. Calcular hybrid score (Competencias + Metas)
    const hybridResult = await this.calculateHybridScore(
      employeeId,
      weightedScore,
      cycle?.endDate ?? new Date(),
      {
        competenciesWeight: cycle?.competenciesWeight ?? 70,
        goalsWeight: cycle?.goalsWeight ?? 30,
        includeGoals: cycle?.includeGoals ?? true
      }
    )

    // 6. Clasificar según hybridScore si incluye metas, sino por weightedScore
    const effectiveScoreForClassification = hybridResult.includesGoals
      ? hybridResult.hybridScore
      : weightedScore
    const classification = getPerformanceClassification(effectiveScoreForClassification, config)

    // ════════════════════════════════════════════════════════════════════════
    // CALCULAR ROLE FIT (Trigger 1: Post-360)
    // ════════════════════════════════════════════════════════════════════════
    let roleFitScore: number | null = null
    let roleFitLevel: string | null = null

    try {
      const roleFitResult = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)
      if (roleFitResult) {
        roleFitScore = roleFitResult.roleFitScore
        roleFitLevel = getRoleFitLevel(roleFitResult.roleFitScore)
      }
    } catch (err) {
      console.warn(`[generateRating] Error calculando Role Fit para ${employeeId}:`, err)
      // Continuar sin Role Fit - no es bloqueante
    }

    // 7. Upsert rating en DB
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
        completedEvaluations: results.completedEvaluations,
        roleFitScore,
        roleFitLevel,
        roleFitCalculatedAt: roleFitScore !== null ? new Date() : null,
        goalsScore: hybridResult.goalsScore,
        goalsRawPercent: hybridResult.goalsRawPercent,
        goalsCount: hybridResult.goalsCount,
        hybridScore: hybridResult.includesGoals ? hybridResult.hybridScore : null,
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
        roleFitScore,
        roleFitLevel,
        roleFitCalculatedAt: roleFitScore !== null ? new Date() : null,
        goalsScore: hybridResult.goalsScore,
        goalsRawPercent: hybridResult.goalsRawPercent,
        goalsCount: hybridResult.goalsCount,
        hybridScore: hybridResult.includesGoals ? hybridResult.hybridScore : null,
        updatedAt: new Date()
      }
    })

    // 7. Si ya tiene potentialScore, recalcular nineBoxPosition con el nuevo score
    if (rating.potentialScore != null) {
      await this.recalculate9BoxPosition(rating.id)
    }

    // 8. Audit log
    await prisma.auditLog.create({
      data: {
        action: 'PERFORMANCE_RATING_GENERATED',
        accountId,
        entityType: 'performance_rating',
        entityId: rating.id,
        newValues: {
          cycleId,
          employeeId,
          calculatedScore: weightedScore,
          trigger: 'bulk_generate',
          hadPreviousPotential: rating.potentialScore !== null
        }
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
   * OPTIMIZADO: Pre-carga config/weights + chunks paralelos de 10
   */
  static async generateRatingsForCycle(
    cycleId: string,
    accountId: string
  ): Promise<BulkGenerateResult> {
    const evaluatees = await PerformanceResultsService.listEvaluateesInCycle(cycleId)

    // Pre-cargar datos comunes (1 vez en lugar de N)
    const [config, weights, cycleRecord] = await Promise.all([
      this.getConfig(accountId),
      this.getResolvedWeights(accountId, cycleId),
      prisma.performanceCycle.findUnique({
        where: { id: cycleId },
        select: { endDate: true, competenciesWeight: true, goalsWeight: true, includeGoals: true }
      })
    ])

    const cycleHybridConfig = cycleRecord
      ? {
          endDate: cycleRecord.endDate,
          competenciesWeight: cycleRecord.competenciesWeight,
          goalsWeight: cycleRecord.goalsWeight,
          includeGoals: cycleRecord.includeGoals
        }
      : undefined

    const result: BulkGenerateResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    // Procesar en chunks paralelos de 10
    const CHUNK_SIZE = 10
    for (let i = 0; i < evaluatees.length; i += CHUNK_SIZE) {
      const chunk = evaluatees.slice(i, i + CHUNK_SIZE)
      const settled = await Promise.allSettled(
        chunk.map(ev =>
          this.generateRatingWithContext(cycleId, ev.evaluateeId, accountId, config, weights, cycleHybridConfig)
        )
      )

      for (let j = 0; j < settled.length; j++) {
        if (settled[j].status === 'fulfilled') {
          result.success++
        } else {
          result.failed++
          result.errors.push({
            employeeId: chunk[j].evaluateeId,
            error: (settled[j] as PromiseRejectedResult).reason instanceof Error
              ? ((settled[j] as PromiseRejectedResult).reason as Error).message
              : 'Error desconocido'
          })
        }
      }
    }

    return result
  }

  /**
   * Internal: genera rating con config/weights pre-cargados
   * Misma lógica que generateRating pero sin queries redundantes
   */
  private static async generateRatingWithContext(
    cycleId: string,
    employeeId: string,
    accountId: string,
    config: PerformanceRatingConfigData,
    weights: EvaluatorWeights,
    cycleHybridConfig?: { endDate: Date; competenciesWeight: number; goalsWeight: number; includeGoals: boolean }
  ): Promise<GenerateRatingResult> {
    const results = await PerformanceResultsService.getEvaluateeResults(cycleId, employeeId)

    const weightedScore = calculateWeightedScore(
      {
        self: results.selfScore,
        manager: results.managerScore,
        peer: results.peerAvgScore,
        upward: results.upwardAvgScore
      },
      weights
    )

    // Calcular hybrid score si hay config de ciclo
    const hybridResult = cycleHybridConfig
      ? await this.calculateHybridScore(
          employeeId,
          weightedScore,
          cycleHybridConfig.endDate,
          {
            competenciesWeight: cycleHybridConfig.competenciesWeight,
            goalsWeight: cycleHybridConfig.goalsWeight,
            includeGoals: cycleHybridConfig.includeGoals
          }
        )
      : null

    const effectiveScoreForClassification = hybridResult?.includesGoals
      ? hybridResult.hybridScore
      : weightedScore
    const classification = getPerformanceClassification(effectiveScoreForClassification, config)

    // Calcular Role Fit (mismo bloque que generateRating individual)
    let roleFitScore: number | null = null
    let roleFitLevel: string | null = null

    try {
      const roleFitResult = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)
      if (roleFitResult) {
        roleFitScore = roleFitResult.roleFitScore
        roleFitLevel = getRoleFitLevel(roleFitResult.roleFitScore)
      }
    } catch (err) {
      console.warn(`[generateRatingWithContext] Error Role Fit para ${employeeId}:`, err)
    }

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
        completedEvaluations: results.completedEvaluations,
        roleFitScore,
        roleFitLevel,
        roleFitCalculatedAt: roleFitScore !== null ? new Date() : null,
        goalsScore: hybridResult?.goalsScore ?? null,
        goalsRawPercent: hybridResult?.goalsRawPercent ?? null,
        goalsCount: hybridResult?.goalsCount ?? null,
        hybridScore: hybridResult?.includesGoals ? hybridResult.hybridScore : null,
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
        roleFitScore,
        roleFitLevel,
        roleFitCalculatedAt: roleFitScore !== null ? new Date() : null,
        goalsScore: hybridResult?.goalsScore ?? null,
        goalsRawPercent: hybridResult?.goalsRawPercent ?? null,
        goalsCount: hybridResult?.goalsCount ?? null,
        hybridScore: hybridResult?.includesGoals ? hybridResult.hybridScore : null,
        updatedAt: new Date()
      }
    })

    if (rating.potentialScore != null) {
      await this.recalculate9BoxPosition(rating.id)
    }

    await prisma.auditLog.create({
      data: {
        action: 'PERFORMANCE_RATING_GENERATED',
        accountId,
        entityType: 'performance_rating',
        entityId: rating.id,
        newValues: {
          cycleId,
          employeeId,
          calculatedScore: weightedScore,
          hybridScore: hybridResult?.hybridScore ?? null,
          trigger: 'bulk_generate',
          hadPreviousPotential: rating.potentialScore !== null
        }
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
   * Acepta score directo O factores AAE (aspiration, ability, engagement)
   */
  static async ratePotential(input: RatePotentialInput) {
    const {
      ratingId,
      potentialScore: directScore,
      aspiration,
      ability,
      engagement,
      notes,
      ratedBy
    } = input

    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId }
    })

    if (!rating) {
      throw new Error('Rating no encontrado')
    }

    // Calcular score desde factores AAE o usar score directo
    const hasAllFactors = aspiration !== undefined && ability !== undefined && engagement !== undefined
    let finalScore: number

    if (hasAllFactors) {
      finalScore = calculatePotentialScore({ aspiration, ability, engagement })
    } else if (directScore !== undefined) {
      finalScore = directScore
    } else {
      throw new Error('Se requiere potentialScore o los 3 factores (aspiration, ability, engagement)')
    }

    const potentialLevel = scoreToNineBoxLevel(finalScore)
    const performanceScore = rating.finalScore ?? rating.calculatedScore
    const performanceLevel = scoreToNineBoxLevel(performanceScore)
    const nineBoxPosition = calculate9BoxPosition(performanceLevel, potentialLevel)

    // ════════════════════════════════════════════════════════════════════════
    // CALCULAR MATRICES DE TALENTO (Trigger 2: Post-AAE)
    // ════════════════════════════════════════════════════════════════════════
    let mobilityQuadrant: string | null = null
    let riskQuadrant: string | null = null
    let riskAlertLevel: string | null = null

    // Solo calcular si tenemos Role Fit persistido
    if (rating.roleFitScore !== null) {
      const talentResult = TalentIntelligenceService.analyze({
        roleFitScore: rating.roleFitScore,
        aspiration: (hasAllFactors ? aspiration : null) as 1 | 2 | 3 | null,
        engagement: (hasAllFactors ? engagement : null) as 1 | 2 | 3 | null
      })

      mobilityQuadrant = talentResult.mobility.quadrant
      riskQuadrant = talentResult.risk.quadrant
      riskAlertLevel = talentResult.risk.alertLevel

      // Log para alertas críticas
      if (TalentIntelligenceService.isCriticalAlert(talentResult.risk.quadrant)) {
        console.warn(
          `[ratePotential] ALERTA CRITICA: ${ratingId} ` +
          `clasificado como ${riskQuadrant} (${riskAlertLevel})`
        )
      }
    } else {
      console.warn(`[ratePotential] Role Fit no disponible para ${ratingId}, matrices no calculadas`)
    }

    return prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        potentialScore: finalScore,
        potentialLevel,
        potentialRatedBy: ratedBy,
        potentialRatedAt: new Date(),
        potentialNotes: notes || null,
        nineBoxPosition,
        // Factores AAE separados (null si se usó score directo)
        potentialAspiration: hasAllFactors ? aspiration : null,
        potentialAbility: hasAllFactors ? ability : null,
        potentialEngagement: hasAllFactors ? engagement : null,
        // Matrices de Talento
        mobilityQuadrant,
        riskQuadrant,
        riskAlertLevel,
        talentAnalyzedAt: mobilityQuadrant || riskQuadrant ? new Date() : null,
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
   * SECURITY FIX: Agregado accountId obligatorio + departmentIds para AREA_MANAGER
   * SERVER-SIDE FILTERING: evaluationStatus, potentialStatus, search + stats backend
   */
  static async listRatingsForCycle(
    cycleId: string,
    accountId: string,  // SECURITY: Obligatorio para defense-in-depth
    options?: {
      page?: number
      limit?: number
      sortBy?: 'name' | 'score' | 'level'
      sortOrder?: 'asc' | 'desc'
      filterLevel?: string
      filterNineBox?: string
      filterCalibrated?: boolean
      departmentIds?: string[]  // SECURITY: Para AREA_MANAGER (filtro jerárquico)
      managerFilterId?: string  // SECURITY: Para EVALUATOR (solo subordinados directos)
      // ═══ NUEVOS FILTROS SERVER-SIDE ═══
      evaluationStatus?: 'all' | 'evaluated' | 'not_evaluated'
      potentialStatus?: 'all' | 'assigned' | 'pending'
      search?: string  // búsqueda por nombre empleado
    }
  ) {
    // ════════════════════════════════════════════════════════════════════════════
    // HYBRID DISPATCH: Ciclo ACTIVE usa modelo híbrido (EvaluationAssignment)
    // Ciclo IN_REVIEW/COMPLETED usa modelo tradicional (PerformanceRating)
    // ════════════════════════════════════════════════════════════════════════════
    const cycleRecord = await prisma.performanceCycle.findUnique({
      where: { id: cycleId },
      select: { status: true }
    })
    if (cycleRecord?.status === 'ACTIVE') {
      return this.listRatingsHybrid(cycleId, accountId, options)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TRADITIONAL PATH: IN_REVIEW / COMPLETED (solo PerformanceRating)
    // ══════════════════════════════════════════════════════════════════════════
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      filterLevel,
      filterNineBox,
      filterCalibrated,
      departmentIds,
      managerFilterId,
      evaluationStatus,
      potentialStatus,
      search
    } = options || {}

    // ════════════════════════════════════════════════════════════════════════════
    // BASE WHERE para stats (solo cycleId + accountId + filtro jerárquico)
    // ════════════════════════════════════════════════════════════════════════════
    const baseWhere: any = { cycleId, accountId }
    if (departmentIds?.length) {
      baseWhere.employee = { departmentId: { in: departmentIds } }
    }
    if (managerFilterId) {
      baseWhere.employee = { ...baseWhere.employee, managerId: managerFilterId }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STATS con COUNT queries — eficientes, sin traer data
    // Se calculan sobre el scope COMPLETO (no filtrado por evaluationStatus/potentialStatus)
    // ════════════════════════════════════════════════════════════════════════════
    const [totalRatings, evaluatedCount, potentialAssignedCount] = await Promise.all([
      prisma.performanceRating.count({ where: baseWhere }),
      prisma.performanceRating.count({
        where: { ...baseWhere, calculatedScore: { gt: 0 } }
      }),
      prisma.performanceRating.count({
        where: { ...baseWhere, potentialScore: { not: null }, calculatedScore: { gt: 0 } }
      })
    ])

    const notEvaluatedCount = totalRatings - evaluatedCount
    const potentialPendingCount = evaluatedCount - potentialAssignedCount

    // ════════════════════════════════════════════════════════════════════════════
    // QUERY WHERE con todos los filtros (para paginación)
    // ════════════════════════════════════════════════════════════════════════════
    const where: any = { cycleId, accountId }

    // SECURITY: Filtro departamental para AREA_MANAGER
    if (departmentIds?.length) {
      where.employee = { departmentId: { in: departmentIds } }
    }
    // SECURITY: Filtro por managerId para EVALUATOR
    if (managerFilterId) {
      where.employee = { ...where.employee, managerId: managerFilterId }
    }

    // Filtro evaluación (reemplaza lógica client-side)
    if (evaluationStatus === 'evaluated') {
      where.calculatedScore = { gt: 0 }
    } else if (evaluationStatus === 'not_evaluated') {
      where.calculatedScore = 0
    }

    // Filtro potencial
    if (potentialStatus === 'assigned') {
      where.potentialScore = { not: null }
      where.calculatedScore = { gt: 0 }  // solo evaluados con potencial
    } else if (potentialStatus === 'pending') {
      where.potentialScore = null
      where.calculatedScore = { gt: 0 }  // evaluados SIN potencial
    }

    // Búsqueda por nombre (server-side)
    if (search?.trim()) {
      where.employee = {
        ...where.employee,  // preservar filtro departamental si existe
        fullName: {
          contains: search.trim(),
          mode: 'insensitive'
        }
      }
    }

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
            managerId: true,  // Para canAssignPotential (jefe directo)
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
        pagination: { page, limit, total, pages: 0 },
        stats: {
          totalRatings,
          evaluatedCount,
          notEvaluatedCount,
          potentialAssignedCount,
          potentialPendingCount,
          evaluationProgress: totalRatings > 0
            ? Math.round((evaluatedCount / totalRatings) * 100)
            : 0,
          potentialProgress: evaluatedCount > 0
            ? Math.round((potentialAssignedCount / evaluatedCount) * 100)
            : 0
        }
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
      },
      stats: {
        totalRatings,
        evaluatedCount,
        notEvaluatedCount,
        potentialAssignedCount,
        potentialPendingCount,
        evaluationProgress: totalRatings > 0
          ? Math.round((evaluatedCount / totalRatings) * 100)
          : 0,
        potentialProgress: evaluatedCount > 0
          ? Math.round((potentialAssignedCount / evaluatedCount) * 100)
          : 0
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HYBRID MODEL: EvaluationAssignment (Mundo 1) + PerformanceRating (Mundo 2)
  // Se usa durante ciclo ACTIVE para mostrar todos los evaluados,
  // incluso los que aún no tienen PerformanceRating generado.
  // ══════════════════════════════════════════════════════════════════════════

  private static async listRatingsHybrid(
    cycleId: string,
    accountId: string,
    options?: {
      page?: number
      limit?: number
      sortBy?: 'name' | 'score' | 'level'
      sortOrder?: 'asc' | 'desc'
      departmentIds?: string[]
      managerFilterId?: string
      evaluationStatus?: 'all' | 'evaluated' | 'not_evaluated'
      potentialStatus?: 'all' | 'assigned' | 'pending'
      search?: string
      [key: string]: any  // Accept extra options from traditional path
    }
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
      departmentIds,
      managerFilterId,
      evaluationStatus,
      potentialStatus,
      search
    } = options || {}

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 1: WHERE para Mundo 1 (EvaluationAssignment)
    // ════════════════════════════════════════════════════════════════════════════
    const baseWhere: any = {
      cycleId,
      accountId,
      status: 'COMPLETED'
    }

    // RBAC: Filtro jerárquico para AREA_MANAGER
    if (departmentIds?.length) {
      baseWhere.evaluatee = {
        departmentId: { in: departmentIds }
      }
    }
    // RBAC: Filtro por managerId para EVALUATOR
    if (managerFilterId) {
      baseWhere.evaluatee = {
        ...baseWhere.evaluatee,
        managerId: managerFilterId
      }
    }

    // Search: Filtrar por nombre
    if (search?.trim()) {
      baseWhere.evaluateeName = {
        contains: search.trim(),
        mode: 'insensitive'
      }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 2: Evaluados únicos (Mundo 1) con paginación
    // ════════════════════════════════════════════════════════════════════════════
    const allEvaluatees = await prisma.evaluationAssignment.findMany({
      where: baseWhere,
      distinct: ['evaluateeId'],
      select: {
        evaluateeId: true,
        evaluateeName: true,
        evaluateePosition: true,
        evaluatee: {
          select: {
            id: true,
            departmentId: true,
            managerId: true,
            department: {
              select: { displayName: true }
            }
          }
        }
      },
      orderBy: sortBy === 'name'
        ? { evaluateeName: sortOrder }
        : undefined
    })

    const totalEvaluatees = allEvaluatees.length
    const skip = (page - 1) * limit
    const paginatedEvaluatees = allEvaluatees.slice(skip, skip + limit)
    const evaluateeIds = paginatedEvaluatees.map(e => e.evaluateeId)

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 3: Ratings existentes (Mundo 2) solo para esta página
    // ════════════════════════════════════════════════════════════════════════════
    const existingRatings = await prisma.performanceRating.findMany({
      where: {
        cycleId,
        employeeId: { in: evaluateeIds }
      },
      select: {
        id: true,
        employeeId: true,
        calculatedScore: true,
        calculatedLevel: true,
        finalScore: true,
        finalLevel: true,
        potentialScore: true,
        potentialLevel: true,
        nineBoxPosition: true,
        potentialNotes: true
      }
    })

    const ratingsMap = new Map(
      existingRatings.map(r => [r.employeeId, r])
    )

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 4: Combinar Mundo 1 + Mundo 2 con scores en tiempo real
    // ════════════════════════════════════════════════════════════════════════════
    const config = await this.getConfig(accountId)

    const combinedData = await Promise.all(
      paginatedEvaluatees.map(async (ev) => {
        const rating = ratingsMap.get(ev.evaluateeId)

        // Calcular score en tiempo real si no hay rating persistido
        let calculatedScore = rating?.calculatedScore ?? 0
        if (!rating || rating.calculatedScore === 0) {
          try {
            const results = await PerformanceResultsService.getEvaluateeResults(
              cycleId,
              ev.evaluateeId
            )
            const scores = [
              results.selfScore,
              results.managerScore,
              results.peerAvgScore,
              results.upwardAvgScore
            ].filter((s): s is number => s !== null)

            if (scores.length > 0) {
              calculatedScore = scores.reduce((a, b) => a + b, 0) / scores.length
            }
          } catch {
            calculatedScore = 0
          }
        }

        calculatedScore = Math.round(calculatedScore * 100) / 100
        const effectiveScore = rating?.finalScore ?? calculatedScore
        const calcLevel = getPerformanceLevel(calculatedScore)
        const classification = getPerformanceClassification(effectiveScore, config)

        // Retornar shape compatible con el path tradicional
        return {
          id: rating?.id || `pending_${ev.evaluateeId}`,
          accountId,
          cycleId,
          employeeId: ev.evaluateeId,
          employee: {
            id: ev.evaluatee.id,
            fullName: ev.evaluateeName,
            position: ev.evaluateePosition || null,
            departmentId: ev.evaluatee.departmentId,
            managerId: ev.evaluatee.managerId || null,
            department: ev.evaluatee.department
          },
          calculatedScore,
          calculatedLevel: calcLevel,
          finalScore: rating?.finalScore ?? null,
          finalLevel: rating?.finalLevel ?? null,
          potentialScore: rating?.potentialScore ?? null,
          potentialLevel: rating?.potentialLevel ?? null,
          nineBoxPosition: rating?.nineBoxPosition ?? null,
          potentialNotes: rating?.potentialNotes ?? null,
          calibrated: false,
          effectiveScore,
          effectiveLevel: rating?.finalLevel ?? calcLevel,
          classification
        }
      })
    )

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 5: Filtros post-combinación
    // ════════════════════════════════════════════════════════════════════════════
    let filteredData = combinedData

    if (evaluationStatus === 'evaluated') {
      filteredData = filteredData.filter(d => d.calculatedScore > 0)
    } else if (evaluationStatus === 'not_evaluated') {
      filteredData = filteredData.filter(d => d.calculatedScore === 0)
    }

    if (potentialStatus === 'assigned') {
      filteredData = filteredData.filter(d => d.potentialScore !== null)
    } else if (potentialStatus === 'pending') {
      filteredData = filteredData.filter(d => d.potentialScore === null)
    }

    if (sortBy === 'score') {
      filteredData.sort((a, b) =>
        sortOrder === 'asc'
          ? a.calculatedScore - b.calculatedScore
          : b.calculatedScore - a.calculatedScore
      )
    }

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 6: Stats (queries paralelos)
    // ════════════════════════════════════════════════════════════════════════════
    const [totalWithRating, totalWithPotential] = await Promise.all([
      prisma.performanceRating.count({
        where: { cycleId, calculatedScore: { gt: 0 } }
      }),
      prisma.performanceRating.count({
        where: { cycleId, potentialScore: { not: null } }
      })
    ])

    const stats = {
      totalRatings: totalEvaluatees,
      evaluatedCount: totalWithRating,
      notEvaluatedCount: totalEvaluatees - totalWithRating,
      potentialAssignedCount: totalWithPotential,
      potentialPendingCount: totalEvaluatees - totalWithPotential,
      evaluationProgress: totalEvaluatees > 0
        ? Math.round((totalWithRating / totalEvaluatees) * 100)
        : 0,
      potentialProgress: totalEvaluatees > 0
        ? Math.round((totalWithPotential / totalEvaluatees) * 100)
        : 0
    }

    // ════════════════════════════════════════════════════════════════════════════
    // PASO 7: Retornar resultado compatible con UI
    // ════════════════════════════════════════════════════════════════════════════
    return {
      data: filteredData,
      pagination: {
        page,
        limit,
        total: totalEvaluatees,
        pages: Math.ceil(totalEvaluatees / limit)
      },
      stats
    }
  }

  /**
   * Obtiene distribución de ratings de un ciclo
   * SECURITY FIX: Agregado accountId + departmentIds para RBAC
   */
  static async getRatingDistribution(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ) {
    const where: any = {
      cycleId,
      accountId,
    }

    if (departmentIds?.length) {
      where.employee = { departmentId: { in: departmentIds } }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
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
   * SECURITY FIX: Agregado accountId + departmentIds
   */
  static async get9BoxData(
    cycleId: string,
    accountId: string,  // SECURITY: Obligatorio
    departmentIds?: string[]  // SECURITY: Para AREA_MANAGER
  ) {
    const where: any = {
      cycleId,
      accountId,  // SECURITY: Defense-in-depth
      nineBoxPosition: { not: null }
    }

    // SECURITY: Filtro departamental para AREA_MANAGER
    if (departmentIds?.length) {
      where.employee = {
        departmentId: { in: departmentIds }
      }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
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

  // ══════════════════════════════════════════════════════════════════════════
  // TALENT INTELLIGENCE - Recálculo manual
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Recalcula Role Fit para un rating existente
   * Útil para migraciones o correcciones
   */
  static async recalculateRoleFit(
    ratingId: string,
    cycleId: string,
    employeeId: string
  ): Promise<{ roleFitScore: number | null; roleFitLevel: string | null }> {

    let roleFitScore: number | null = null
    let roleFitLevel: string | null = null

    try {
      const roleFitResult = await RoleFitAnalyzer.calculateRoleFit(employeeId, cycleId)
      if (roleFitResult) {
        roleFitScore = roleFitResult.roleFitScore
        roleFitLevel = getRoleFitLevel(roleFitResult.roleFitScore)
      }
    } catch (err) {
      console.error(`[recalculateRoleFit] Error para ${employeeId}:`, err)
    }

    await prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        roleFitScore,
        roleFitLevel,
        roleFitCalculatedAt: roleFitScore !== null ? new Date() : null
      }
    })

    return { roleFitScore, roleFitLevel }
  }

  /**
   * Recalcula matrices de talento para un rating existente
   * Requiere que AAE ya esté asignado
   */
  static async recalculateTalentMatrices(ratingId: string): Promise<{
    mobilityQuadrant: string | null
    riskQuadrant: string | null
    riskAlertLevel: string | null
  }> {

    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId },
      select: {
        roleFitScore: true,
        potentialAspiration: true,
        potentialEngagement: true
      }
    })

    if (!rating) {
      throw new Error(`Rating ${ratingId} no encontrado`)
    }

    const talentResult = TalentIntelligenceService.analyze({
      roleFitScore: rating.roleFitScore,
      aspiration: rating.potentialAspiration as 1 | 2 | 3 | null,
      engagement: rating.potentialEngagement as 1 | 2 | 3 | null
    })

    await prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        mobilityQuadrant: talentResult.mobility.quadrant,
        riskQuadrant: talentResult.risk.quadrant,
        riskAlertLevel: talentResult.risk.alertLevel,
        talentAnalyzedAt: new Date()
      }
    })

    return {
      mobilityQuadrant: talentResult.mobility.quadrant,
      riskQuadrant: talentResult.risk.quadrant,
      riskAlertLevel: talentResult.risk.alertLevel
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE HUB - Calibration Stats by Department
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Estadísticas de calibración agrupadas por departamento del manager
   * Usa evaluatorStatsEngine para clasificación OPTIMA/CENTRAL/SEVERA/INDULGENTE
   */
  static async getCalibrationStatsByDepartment(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<CalibrationSummary> {

    // 1. Obtener ratings agrupados por departamento del evaluador
    const whereClause: any = {
      cycleId,
      accountId,
    }

    if (departmentIds?.length) {
      whereClause.employee = { departmentId: { in: departmentIds } }
    }

    const ratings = await prisma.performanceRating.findMany({
      where: whereClause,
      select: {
        calculatedScore: true,
        employee: {
          select: {
            managerId: true,
            manager: {
              select: {
                fullName: true,
                position: true,
                departmentId: true,
                department: { select: { displayName: true } }
              }
            }
          }
        }
      }
    })

    // 2. Agrupar por MANAGER INDIVIDUAL (no por departamento)
    //    Cada manager se clasifica independientemente → heatmap muestra
    //    cuántos evaluadores de cada gerencia son OPTIMA/CENTRAL/SEVERA/INDULGENTE
    const byManager: Record<string, { deptId: string; deptName: string; managerName: string; scores: number[] }> = {}

    for (const r of ratings) {
      if (!r.calculatedScore || !r.employee.managerId || !r.employee.manager) continue

      const managerId = r.employee.managerId
      if (!byManager[managerId]) {
        const deptId = r.employee.manager.departmentId || 'sin_asignar'
        const deptName = r.employee.manager.department?.displayName || 'Sin Asignar'
        const managerName = r.employee.manager.fullName || 'Sin Nombre'
        byManager[managerId] = { deptId, deptName, managerName, scores: [] }
      }
      byManager[managerId].scores.push(r.calculatedScore)
    }

    // 3. Clasificar cada evaluador individualmente
    const results: DepartmentCalibration[] = []
    const statusCounts: Record<EvaluationStatus, number> = {
      'OPTIMA': 0, 'CENTRAL': 0, 'SEVERA': 0, 'INDULGENTE': 0
    }

    for (const [managerId, data] of Object.entries(byManager)) {
      if (data.scores.length < 3) continue // Mínimo para clasificar

      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      const variance = data.scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / data.scores.length
      const stdDev = Math.sqrt(variance)

      // Distribución 1-5
      const distribution = [0, 0, 0, 0, 0]
      data.scores.forEach(s => {
        const bucket = Math.min(Math.floor(s), 4) // 0-4 index
        distribution[bucket]++
      })

      // Clasificar usando evaluatorStatsEngine
      const status = getEvaluationClassification(avg, stdDev, data.scores.length)
      statusCounts[status]++

      results.push({
        managerId,
        managerName: data.managerName,
        departmentId: data.deptId,
        departmentName: data.deptName,
        status,
        statusLabel: STATUS_CONFIG[status].label,
        avgScore: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        evaluatorCount: data.scores.length,
        distribution
      })
    }

    // 4. Calcular confianza global
    const totalDepts = results.length
    const optimalDepts = statusCounts['OPTIMA']
    const overallConfidence = totalDepts > 0
      ? Math.round((optimalDepts / totalDepts) * 100)
      : 0

    // 5. Encontrar peor departamento
    const worst = results
      .filter(r => r.status === 'SEVERA' || r.status === 'INDULGENTE')
      .sort((a, b) => Math.abs(b.avgScore - 3) - Math.abs(a.avgScore - 3))
      [0] || null

    return {
      overallConfidence,
      byStatus: statusCounts,
      byDepartment: results.sort((a, b) => a.departmentName.localeCompare(b.departmentName)),
      worstDepartment: worst
        ? { name: worst.departmentName, status: worst.status, statusLabel: STATUS_CONFIG[worst.status].label }
        : null
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE HUB - Calibration Stats AGGREGATED by GERENCIA (level 2)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Estadísticas de calibración agregadas por GERENCIA (departamento level 2).
   * Agrupa los stats de evaluadores individuales (de getCalibrationStatsByDepartment)
   * por su gerencia padre en la jerarquía organizacional.
   */
  static async getCalibrationStatsByGerencia(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<GerenciaCalibrationStats[]> {

    // 1. Obtener stats por evaluador individual (función existente)
    const calibration = await this.getCalibrationStatsByDepartment(cycleId, accountId, departmentIds)
    const byDepartment = calibration.byDepartment

    // 2. Obtener mapa de departamentos → gerencia padre (level 2)
    const departments = await prisma.department.findMany({
      where: { accountId, isActive: true },
      select: {
        id: true,
        displayName: true,
        level: true,
        parentId: true,
      }
    })

    // Index rápido por id
    const deptById = new Map(departments.map(d => [d.id, d]))

    // 3. Resolver departmentId → gerencia (level 2) subiendo por la jerarquía
    const deptToGerencia = new Map<string, { id: string; name: string }>()

    for (const dept of departments) {
      if (dept.level === 2) {
        deptToGerencia.set(dept.id, { id: dept.id, name: dept.displayName })
      } else if (dept.level === 1) {
        // Holding: no se agrupa bajo ninguna gerencia
        continue
      } else {
        // level >= 3: subir hasta encontrar ancestro level 2
        let current = dept
        let maxIterations = 10 // Prevenir loops infinitos
        while (current.parentId && current.level > 2 && maxIterations-- > 0) {
          const parent = deptById.get(current.parentId)
          if (!parent) break
          if (parent.level === 2) {
            deptToGerencia.set(dept.id, { id: parent.id, name: parent.displayName })
            break
          }
          current = parent
        }
      }
    }

    // 4. Pre-seed accumulator con TODAS las gerencias (level 2)
    const gerenciaAcc: Record<string, {
      id: string
      name: string
      scores: number[]
      counts: { OPTIMA: number; CENTRAL: number; SEVERA: number; INDULGENTE: number }
      evaluatorCount: number
      distributions: number[][]
      deptAcc: Record<string, {
        id: string; name: string; scores: number[]
        statuses: string[]; evaluatorCount: number
        evaluatorDetails: EvaluatorDetail[]
      }>
    }> = {}

    for (const dept of departments) {
      if (dept.level === 2) {
        gerenciaAcc[dept.id] = {
          id: dept.id,
          name: dept.displayName,
          scores: [],
          counts: { OPTIMA: 0, CENTRAL: 0, SEVERA: 0, INDULGENTE: 0 },
          evaluatorCount: 0,
          distributions: [],
          deptAcc: {}
        }
      }
    }

    // Pre-seed department accumulators (child departments under each gerencia)
    for (const dept of departments) {
      const gerencia = deptToGerencia.get(dept.id)
      if (!gerencia || !gerenciaAcc[gerencia.id]) continue
      // Include level 2 itself + all children
      gerenciaAcc[gerencia.id].deptAcc[dept.id] = {
        id: dept.id,
        name: dept.displayName,
        scores: [],
        statuses: [],
        evaluatorCount: 0,
        evaluatorDetails: []
      }
    }

    // 5. Llenar con datos reales de evaluadores
    for (const evaluator of byDepartment) {
      const gerencia = deptToGerencia.get(evaluator.departmentId)
      if (!gerencia || !gerenciaAcc[gerencia.id]) continue

      const acc = gerenciaAcc[gerencia.id]
      acc.scores.push(evaluator.avgScore)
      const status = evaluator.status as keyof typeof acc.counts
      if (status in acc.counts) acc.counts[status]++
      acc.evaluatorCount++

      if (evaluator.distribution) {
        acc.distributions.push(evaluator.distribution)
      }

      // Acumular por departamento
      const deptData = acc.deptAcc[evaluator.departmentId]
      if (deptData) {
        deptData.scores.push(evaluator.avgScore)
        deptData.statuses.push(evaluator.status)
        deptData.evaluatorCount++
        deptData.evaluatorDetails.push({
          managerId: evaluator.managerId,
          managerName: evaluator.managerName,
          avg: evaluator.avgScore,
          stdDev: evaluator.stdDev,
          status: evaluator.status,
          ratingsCount: evaluator.evaluatorCount
        })
      }
    }

    // 6. Calcular métricas finales por gerencia (incluye las sin datos)
    const result: GerenciaCalibrationStats[] = []

    for (const acc of Object.values(gerenciaAcc)) {
      const { scores } = acc
      const count = scores.length

      // Calcular stats de departamentos anidados
      const deptStats: GerenciaDepartmentStats[] = []
      let hasDepartmentWithBias = false

      for (const da of Object.values(acc.deptAcc)) {
        if (da.evaluatorCount === 0) {
          deptStats.push({
            departmentId: da.id,
            departmentName: da.name,
            avg: null,
            stdDev: null,
            status: null,
            evaluatorCount: 0,
            evaluators: []
          })
          continue
        }
        const dAvg = da.scores.reduce((a, b) => a + b, 0) / da.scores.length
        const dVar = da.scores.reduce((a, b) => a + Math.pow(b - dAvg, 2), 0) / da.scores.length
        const dStdDev = Math.sqrt(dVar)

        // Status: regla de contaminación (severidad gana sobre cantidad)
        const dStatus: EvaluationStatus =
          da.statuses.includes('SEVERA') ? 'SEVERA' :
          da.statuses.includes('INDULGENTE') ? 'INDULGENTE' :
          da.statuses.includes('CENTRAL') ? 'CENTRAL' :
          'OPTIMA'

        if (dStatus !== 'OPTIMA') hasDepartmentWithBias = true

        deptStats.push({
          departmentId: da.id,
          departmentName: da.name,
          avg: Number(dAvg.toFixed(2)),
          stdDev: Number(dStdDev.toFixed(2)),
          status: dStatus,
          evaluatorCount: da.evaluatorCount,
          evaluators: da.evaluatorDetails.sort((a, b) => a.managerName.localeCompare(b.managerName))
        })
      }

      deptStats.sort((a, b) => a.departmentName.localeCompare(b.departmentName))

      // Gerencia sin evaluadores → emitir con null
      if (count === 0) {
        result.push({
          gerenciaId: acc.id,
          gerenciaName: acc.name,
          avg: null,
          stdDev: null,
          status: null,
          confidenceScore: null,
          counts: acc.counts,
          evaluatorCount: 0,
          distribution: [0, 0, 0, 0, 0],
          departments: deptStats,
          hasDepartmentWithBias
        })
        continue
      }

      const avg = scores.reduce((a, b) => a + b, 0) / count
      const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / count
      const stdDev = Math.sqrt(variance)

      // Status: regla de contaminación (severidad gana sobre cantidad)
      const dominantStatus: EvaluationStatus =
        acc.counts.SEVERA > 0 ? 'SEVERA' :
        acc.counts.INDULGENTE > 0 ? 'INDULGENTE' :
        acc.counts.CENTRAL > 0 ? 'CENTRAL' :
        'OPTIMA'

      // Confianza = % de evaluadores OPTIMA
      const confidenceScore = Math.round((acc.counts.OPTIMA / count) * 100)

      // Distribución agregada (promedio de distribuciones individuales)
      const aggregatedDistribution = [0, 0, 0, 0, 0]
      if (acc.distributions.length > 0) {
        for (let i = 0; i < 5; i++) {
          const sum = acc.distributions.reduce((a, d) => a + (d[i] || 0), 0)
          aggregatedDistribution[i] = Math.round(sum / acc.distributions.length)
        }
      }

      result.push({
        gerenciaId: acc.id,
        gerenciaName: acc.name,
        avg: Number(avg.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        status: dominantStatus,
        confidenceScore,
        counts: acc.counts,
        evaluatorCount: acc.evaluatorCount,
        distribution: aggregatedDistribution,
        departments: deptStats,
        hasDepartmentWithBias
      })
    }

    result.sort((a, b) => a.gerenciaName.localeCompare(b.gerenciaName))
    return result
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS EXECUTIVE HUB
// ════════════════════════════════════════════════════════════════════════════

export interface DepartmentCalibration {
  managerId: string
  managerName: string
  departmentId: string
  departmentName: string
  status: EvaluationStatus
  statusLabel: string
  avgScore: number
  stdDev: number
  evaluatorCount: number
  distribution: number[]
}

export interface CalibrationSummary {
  overallConfidence: number
  byStatus: Record<EvaluationStatus, number>
  byDepartment: DepartmentCalibration[]
  worstDepartment: { name: string; status: EvaluationStatus; statusLabel: string } | null
}

export interface EvaluatorDetail {
  managerId: string
  managerName: string
  avg: number
  stdDev: number
  status: EvaluationStatus
  ratingsCount: number
}

export interface GerenciaDepartmentStats {
  departmentId: string
  departmentName: string
  avg: number | null
  stdDev: number | null
  status: EvaluationStatus | null
  evaluatorCount: number
  evaluators: EvaluatorDetail[]
}

export interface GerenciaCalibrationStats {
  gerenciaId: string
  gerenciaName: string
  avg: number | null
  stdDev: number | null
  status: EvaluationStatus | null
  confidenceScore: number | null
  counts: {
    OPTIMA: number
    CENTRAL: number
    SEVERA: number
    INDULGENTE: number
  }
  evaluatorCount: number
  distribution: number[]
  departments: GerenciaDepartmentStats[]
  hasDepartmentWithBias: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// FÓRMULA DE INTEGRIDAD FOCALIZA v1.1
// Confianza ajustada por sesgos y varianza
// ════════════════════════════════════════════════════════════════════════════

export interface IntegrityScore {
  score: number
  baseScore: number
  penalties: {
    bias: { type: string; points: number; reason: string } | null
    variance: { level: string; points: number; reason: string } | null
  }
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  narrative: string
}

const BIAS_PENALTIES: Record<string, { points: number; reason: string }> = {
  'SEVERITY': {
    points: 20,
    reason: 'Estándar de Hierro: Riesgo de fuga de talento estrella y frustración generalizada'
  },
  'LENIENCY': {
    points: 15,
    reason: 'Mano Blanda: Dilución del presupuesto de bonos y falta de meritocracia'
  },
  'CENTRAL_TENDENCY': {
    points: 10,
    reason: 'Zona Gris: Invisibilidad del talento, nadie brilla ni falla'
  }
}

const BIAS_NAMES: Record<string, string> = {
  'SEVERITY': 'un Estándar de Hierro',
  'LENIENCY': 'una Mano Blanda generalizada',
  'CENTRAL_TENDENCY': 'una Zona Gris de no-diferenciación'
}

export function calculateIntegrityScore(params: {
  optimaCount: number
  totalDepartments: number
  biasType: string | null
  avgVariance: number
}): IntegrityScore {
  const { optimaCount, totalDepartments, biasType, avgVariance } = params

  // Base: % de evaluadores con distribución saludable
  const baseScore = totalDepartments > 0
    ? Math.round((optimaCount / totalDepartments) * 100)
    : 0

  // Penalización por sesgo
  const biasPenalty = biasType && BIAS_PENALTIES[biasType]
    ? BIAS_PENALTIES[biasType]
    : { points: 0, reason: '' }

  // Penalización por varianza
  let variancePenalty: { level: string; points: number; reason: string }
  if (avgVariance >= 1.0) {
    variancePenalty = { level: 'ALTA', points: 10, reason: 'Efecto Lotería: La evaluación depende del criterio individual de cada jefe' }
  } else if (avgVariance >= 0.5) {
    variancePenalty = { level: 'MEDIA', points: 5, reason: 'Criterios en proceso de desalineación entre evaluadores' }
  } else {
    variancePenalty = { level: 'BAJA', points: 0, reason: '' }
  }

  // Score final
  const score = Math.max(0, baseScore - biasPenalty.points - variancePenalty.points)

  const level: 'HIGH' | 'MEDIUM' | 'LOW' =
    score >= 75 ? 'HIGH' :
    score >= 50 ? 'MEDIUM' : 'LOW'

  // Narrativa ejecutiva
  let narrative: string
  if (level === 'HIGH') {
    narrative = 'Datos con alta integridad. Puedes tomar decisiones de talento con confianza.'
  } else if (level === 'MEDIUM') {
    narrative = 'Datos con ruido moderado. Revisa los sesgos detectados antes de ejecutar presupuesto.'
  } else {
    narrative = 'Datos con ruido crítico. Calibra los criterios de evaluación antes de tomar decisiones.'
  }

  if (biasType && BIAS_NAMES[biasType]) {
    narrative += ` Detectamos ${BIAS_NAMES[biasType]} que distorsiona tu visión de talento.`
  }

  return {
    score,
    baseScore,
    penalties: {
      bias: biasType && biasPenalty.points > 0
        ? { type: biasType, points: biasPenalty.points, reason: biasPenalty.reason }
        : null,
      variance: variancePenalty.points > 0
        ? { level: variancePenalty.level, points: variancePenalty.points, reason: variancePenalty.reason }
        : null
    },
    level,
    narrative
  }
}

export default PerformanceRatingService
