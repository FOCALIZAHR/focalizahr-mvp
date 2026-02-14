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
    const [config, weights] = await Promise.all([
      this.getConfig(accountId),
      this.getResolvedWeights(accountId, cycleId)
    ])

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
          this.generateRatingWithContext(cycleId, ev.evaluateeId, accountId, config, weights)
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
    weights: EvaluatorWeights
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

    const classification = getPerformanceClassification(weightedScore, config)

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
      evaluationStatus,
      potentialStatus,
      search
    } = options || {}

    // ════════════════════════════════════════════════════════════════════════════
    // BASE WHERE para stats (solo cycleId + accountId + departmentIds)
    // ════════════════════════════════════════════════════════════════════════════
    const baseWhere: any = { cycleId, accountId }
    if (departmentIds?.length) {
      baseWhere.employee = { departmentId: { in: departmentIds } }
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
}

export default PerformanceRatingService
