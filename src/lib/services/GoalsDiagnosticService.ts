// ════════════════════════════════════════════════════════════════════════════
// GOALS DIAGNOSTIC SERVICE — Motor de Correlación Metas × Performance
// src/lib/services/GoalsDiagnosticService.ts
// ════════════════════════════════════════════════════════════════════════════
// Servicio puro: recibe ratings, retorna diagnósticos con $$$
// Reutilizable desde: Executive Hub, Cinema Mode Metas (futuro), PDF (futuro)
//
// 5 Narrativas de valor:
//   1. Fuga Productiva — rinde en metas + riesgo de fuga = pérdida costosa
//   2. Bonos Sin Respaldo — 360° alto + metas bajo = bono injustificado
//   3. Talento Invisible — metas alto + 360° bajo = persona subvalorada
//   4. Ejecutores Desconectados — metas alto + engagement bajo = fuga silenciosa
//   5. No Sabe vs No Quiere — metas bajo, split por roleFit
//
// 4 Cuadrantes de correlación:
//   CONSISTENT, PERCEPTION_BIAS, HIDDEN_PERFORMER, DOUBLE_RISK
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import type { EvaluationStatus } from '@/lib/utils/evaluatorStatsEngine'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'
import {
  getPerformanceClassification,
  getRoleFitClassification,
  getGoalsClassification,
  getEngagementClassification,
  RISK_QUADRANT_CONFIG,
  RiskQuadrant,
  type GoalsLevelConfig,
  FOCALIZAHR_GOALS_DEFAULT_CONFIG,
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS — Umbrales exportados (no hardcoded)
// ════════════════════════════════════════════════════════════════════════════

export const GOALS_THRESHOLDS = {
  /** Diferencia score360 vs goals normalizado para considerar "desconexión" */
  DISCONNECTION_SCORE_GAP: 1.5,
  /** % metas para considerar "alto cumplimiento" */
  HIGH_GOALS: 80,
  /** % metas para considerar "bajo cumplimiento" */
  LOW_GOALS: 40,
  /** Score 360° para considerar "alto" */
  HIGH_SCORE: 4.0,
  /** Score 360° para considerar "bajo" */
  LOW_SCORE: 3.0,
  /** RoleFit para considerar "domina su cargo" */
  HIGH_ROLEFIT: 75,
  /** RoleFit para considerar "no sabe" */
  LOW_ROLEFIT: 60,
  /** % mínimo de empleados con metas para que el dot del Rail se active */
  MIN_COVERAGE_FOR_DOT: 50,
  /** % desconexión para warning (purple dot) */
  DISCONNECTION_WARNING: 15,
  /** % desconexión para critical (red dot) */
  DISCONNECTION_CRITICAL: 25,
  /** Mínimo de empleados con metas para mostrar scatter plot */
  MIN_FOR_SCATTER: 10,
  /** Score 360° para línea guía del scatter */
  SCATTER_SCORE_LINE: 3.0,
  /** % metas para línea guía del scatter */
  SCATTER_GOALS_LINE: 50,
} as const

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type CorrelationQuadrant =
  | 'CONSISTENT'        // score360 >= 3.0 AND goals >= 50: Todo alineado
  | 'PERCEPTION_BIAS'   // score360 >= 3.0 AND goals < 50: Bonos sin respaldo
  | 'HIDDEN_PERFORMER'  // score360 < 3.0 AND goals >= 50: Talento invisible
  | 'DOUBLE_RISK'       // score360 < 3.0 AND goals < 50: Doble riesgo
  | 'NO_GOALS'          // Sin metas asignadas

export interface GoalsSummary {
  coverage: number              // % empleados con metas
  avgProgress: number           // Promedio progreso metas
  disconnectionRate: number     // % con desconexión score vs metas
  totalWithGoals: number
  totalEmployees: number
  urgentCases: number           // Conteo total de las 5 narrativas
  topNarrativeType: string | null
  estimatedRisk: number         // CLP total en riesgo
}

/** Resolved badge — label + color classes ready for frontend rendering */
export interface ResolvedBadge {
  label: string
  labelShort: string
  textClass: string
  bgClass: string
  borderClass: string
  color: string
}

/** Badge pair per narrative type — the two classifications that form the anomaly */
export interface NarrativeBadges {
  goals: ResolvedBadge | null
  score360: ResolvedBadge | null
  roleFit: ResolvedBadge | null
  engagement: ResolvedBadge | null
  risk: ResolvedBadge | null
  evaluatorStatus: ResolvedBadge | null
}

export interface NarrativeEmployee {
  id: string
  name: string
  department: string
  gerencia: string
  goalsPercent: number | null
  score360: number
  roleFitScore: number | null
  engagement: number | null
  mobilityQuadrant: string | null
  riskQuadrant: string | null
  turnoverCost?: number
  acotadoGroup: string | null
  managerId: string | null
  /** Resolved classification badges — ready for rendering */
  badges: NarrativeBadges
}

export interface CorrelationPoint {
  employeeId: string
  employeeName: string
  departmentName: string
  gerenciaName: string
  score360: number
  goalsPercent: number | null
  roleFitScore: number | null
  quadrant: CorrelationQuadrant
}

export interface GerenciaGoalsStats {
  gerenciaName: string
  coverage: number
  avgProgress: number
  avgScore360: number
  disconnectionRate: number
  employeeCount: number
  evaluatorClassification: string | null
  confidenceLevel: 'green' | 'amber' | 'red'
}

// Internal type for query results
interface RatingRow {
  calculatedScore: number
  goalsRawPercent: number | null
  goalsCount: number | null
  potentialEngagement: number | null
  roleFitScore: number | null
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  calibrated: boolean
  adjustmentType: string | null
  employee: {
    id: string
    fullName: string
    acotadoGroup: string | null
    managerId: string | null
    department: {
      displayName: string
      parent: { displayName: string } | null
    } | null
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class GoalsDiagnosticService {

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY — Para /api/executive-hub/summary (lightweight)
  // ══════════════════════════════════════════════════════════════════════════

  static async getSummary(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<GoalsSummary> {

    const where: any = {
      cycleId,
      accountId,
      employee: { status: 'ACTIVE', isActive: true },
    }
    if (departmentIds?.length) {
      where.employee.departmentId = { in: departmentIds }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        calculatedScore: true,
        goalsRawPercent: true,
        goalsCount: true,
        riskQuadrant: true,
        potentialEngagement: true,
        roleFitScore: true,
      },
    })

    const totalEmployees = ratings.length
    if (totalEmployees === 0) {
      return {
        coverage: 0, avgProgress: 0, disconnectionRate: 0,
        totalWithGoals: 0, totalEmployees: 0, urgentCases: 0,
        topNarrativeType: null, estimatedRisk: 0,
      }
    }

    const withGoals = ratings.filter(r => r.goalsRawPercent !== null && r.goalsCount !== null && r.goalsCount > 0)
    const coverage = Math.round((withGoals.length / totalEmployees) * 100)
    const avgProgress = withGoals.length > 0
      ? Math.round(withGoals.reduce((s, r) => s + (r.goalsRawPercent ?? 0), 0) / withGoals.length)
      : 0

    // Disconnection: |score360_normalized - goalsPercent_normalized| > threshold
    let disconnected = 0
    for (const r of withGoals) {
      const score360Normalized = (r.calculatedScore / 5) * 100
      const diff = Math.abs(score360Normalized - (r.goalsRawPercent ?? 0))
      if (diff > GOALS_THRESHOLDS.DISCONNECTION_SCORE_GAP * 20) disconnected++
    }
    const disconnectionRate = withGoals.length > 0
      ? Math.round((disconnected / withGoals.length) * 100)
      : 0

    // Quick count of urgent narratives (sin costos, para summary)
    const fugaCount = ratings.filter(r =>
      r.riskQuadrant === 'FUGA_CEREBROS' && (r.goalsRawPercent ?? 0) > GOALS_THRESHOLDS.HIGH_GOALS
    ).length

    const bonosCount = ratings.filter(r =>
      r.calculatedScore > GOALS_THRESHOLDS.HIGH_SCORE && (r.goalsRawPercent ?? 0) < GOALS_THRESHOLDS.LOW_GOALS && r.goalsRawPercent !== null
    ).length

    const invisibleCount = ratings.filter(r =>
      r.calculatedScore < GOALS_THRESHOLDS.LOW_SCORE && (r.goalsRawPercent ?? 0) > GOALS_THRESHOLDS.HIGH_GOALS
    ).length

    const desconectadosCount = ratings.filter(r =>
      (r.goalsRawPercent ?? 0) > GOALS_THRESHOLDS.HIGH_GOALS && r.potentialEngagement === 1
    ).length

    const noSabeCount = ratings.filter(r =>
      (r.goalsRawPercent ?? 0) < GOALS_THRESHOLDS.LOW_GOALS && r.goalsRawPercent !== null &&
      (r.roleFitScore ?? 100) < GOALS_THRESHOLDS.LOW_ROLEFIT
    ).length

    const noQuiereCount = ratings.filter(r =>
      (r.goalsRawPercent ?? 0) < GOALS_THRESHOLDS.LOW_GOALS && r.goalsRawPercent !== null &&
      (r.roleFitScore ?? 0) > GOALS_THRESHOLDS.HIGH_ROLEFIT
    ).length

    const urgentCases = fugaCount + bonosCount + invisibleCount + desconectadosCount + noSabeCount + noQuiereCount

    // Determine top narrative
    const narrativeCounts = [
      { type: 'FUGA_PRODUCTIVA', count: fugaCount },
      { type: 'BONOS_SIN_RESPALDO', count: bonosCount },
      { type: 'TALENTO_INVISIBLE', count: invisibleCount },
      { type: 'EJECUTORES_DESCONECTADOS', count: desconectadosCount },
      { type: 'NO_SABE_NO_QUIERE', count: noSabeCount + noQuiereCount },
    ].sort((a, b) => b.count - a.count)

    const topNarrativeType = narrativeCounts[0].count > 0 ? narrativeCounts[0].type : null

    return {
      coverage,
      avgProgress,
      disconnectionRate,
      totalWithGoals: withGoals.length,
      totalEmployees,
      urgentCases,
      topNarrativeType,
      estimatedRisk: 0, // Calculated in full detail only (requires SalaryConfigService)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLASSIFY QUADRANT — Lógica pura (sin DB)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Classify into quadrant using RoleFit × Metas (both objective measures).
   * Score360 is NOT an axis — it's the color (perception validator).
   */
  static classifyQuadrant(roleFitScore: number | null, goalsPercent: number | null): CorrelationQuadrant {
    if (goalsPercent === null || roleFitScore === null) return 'NO_GOALS'

    const ROLEFIT_CUT = GOALS_THRESHOLDS.HIGH_ROLEFIT // 75
    const GOALS_CUT = GOALS_THRESHOLDS.SCATTER_GOALS_LINE // 50
    if (roleFitScore >= ROLEFIT_CUT && goalsPercent >= GOALS_CUT) return 'CONSISTENT'
    if (roleFitScore >= ROLEFIT_CUT && goalsPercent < GOALS_CUT) return 'PERCEPTION_BIAS'
    if (roleFitScore < ROLEFIT_CUT && goalsPercent >= GOALS_CUT) return 'HIDDEN_PERFORMER'
    return 'DOUBLE_RISK'
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /** Resolve a classification config into a ResolvedBadge */
  private static toBadge(config: { label: string; labelShort: string; textClass: string; bgClass: string; borderClass: string; color: string }): ResolvedBadge {
    return {
      label: config.label,
      labelShort: config.labelShort,
      textClass: config.textClass,
      bgClass: config.bgClass,
      borderClass: config.borderClass,
      color: config.color,
    }
  }

  /** Map EvaluationStatus to a ResolvedBadge */
  private static evaluatorStatusToBadge(status: EvaluationStatus): ResolvedBadge {
    const configs: Record<EvaluationStatus, ResolvedBadge> = {
      INDULGENTE: { label: 'Indulgente', labelShort: 'Indul', textClass: 'text-red-400', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/30', color: '#EF4444' },
      SEVERA: { label: 'Severa', labelShort: 'Sever', textClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30', color: '#F59E0B' },
      CENTRAL: { label: 'Central', labelShort: 'Centr', textClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/30', color: '#22D3EE' },
      OPTIMA: { label: 'Óptima', labelShort: 'Óptim', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30', color: '#10B981' },
    }
    return configs[status]
  }

  /** Enrich ratings with salary/turnover costs + resolved classification badges */
  private static async enrichWithCosts(
    ratings: RatingRow[],
    accountId: string
  ): Promise<NarrativeEmployee[]> {
    // Build salary cache by acotadoGroup (O(groups) queries, not O(employees))
    const groups = new Set<string>()
    for (const r of ratings) {
      if (r.employee.acotadoGroup) groups.add(r.employee.acotadoGroup)
    }

    const salaryCache = new Map<string, number>()
    for (const group of groups) {
      const result = await SalaryConfigService.getSalaryForAccount(accountId, group)
      salaryCache.set(group, result.monthlySalary)
    }
    // Default salary for employees without acotadoGroup
    const defaultSalary = await SalaryConfigService.getSalaryForAccount(accountId)
    salaryCache.set('__default__', defaultSalary.monthlySalary)

    // Load goals classification config (parametrizable per account)
    const ratingConfig = await prisma.performanceRatingConfig.findUnique({
      where: { accountId },
      select: { goalsClassificationLevels: true },
    })
    const rawGoalsLevels = ratingConfig?.goalsClassificationLevels
    const goalsConfig: GoalsLevelConfig[] = (
      rawGoalsLevels &&
      Array.isArray(rawGoalsLevels) &&
      (rawGoalsLevels as unknown as GoalsLevelConfig[]).length > 0
    )
      ? rawGoalsLevels as unknown as GoalsLevelConfig[]
      : FOCALIZAHR_GOALS_DEFAULT_CONFIG

    return ratings.map(r => {
      const salary = salaryCache.get(r.employee.acotadoGroup ?? '__default__') ?? salaryCache.get('__default__')!
      const turnoverResult = SalaryConfigService.calculateTurnoverCost(
        salary,
        r.employee.acotadoGroup as any
      )

      // Resolve classification badges
      const score360Badge = this.toBadge(getPerformanceClassification(r.calculatedScore))
      const goalsBadge = r.goalsRawPercent !== null
        ? this.toBadge(getGoalsClassification(r.goalsRawPercent, goalsConfig))
        : null
      const roleFitBadge = r.roleFitScore !== null
        ? this.toBadge(getRoleFitClassification(r.roleFitScore))
        : null
      const engagementConfig = getEngagementClassification(r.potentialEngagement)
      const engagementBadge = engagementConfig ? this.toBadge(engagementConfig) : null
      const riskConfig = r.riskQuadrant
        ? RISK_QUADRANT_CONFIG[r.riskQuadrant as RiskQuadrant]
        : null
      const riskBadge = riskConfig ? this.toBadge(riskConfig) : null

      return {
        id: r.employee.id,
        name: r.employee.fullName,
        department: r.employee.department?.displayName ?? 'Sin departamento',
        gerencia: r.employee.department?.parent?.displayName ?? r.employee.department?.displayName ?? 'Sin gerencia',
        goalsPercent: r.goalsRawPercent,
        score360: r.calculatedScore,
        roleFitScore: r.roleFitScore,
        engagement: r.potentialEngagement,
        mobilityQuadrant: r.mobilityQuadrant,
        riskQuadrant: r.riskQuadrant,
        turnoverCost: turnoverResult.turnoverCost,
        acotadoGroup: r.employee.acotadoGroup,
        managerId: r.employee.managerId ?? null,
        badges: {
          goals: goalsBadge,
          score360: score360Badge,
          roleFit: roleFitBadge,
          engagement: engagementBadge,
          risk: riskBadge,
          evaluatorStatus: null, // Resolved by orchestrator after manager classification lookup
        },
      }
    })
  }

  /** Build scatter plot points */
  private static buildCorrelationPoints(ratings: RatingRow[]): CorrelationPoint[] {
    return ratings.map(r => ({
      employeeId: r.employee.id,
      employeeName: r.employee.fullName,
      departmentName: r.employee.department?.displayName ?? 'Sin departamento',
      gerenciaName: r.employee.department?.parent?.displayName ?? r.employee.department?.displayName ?? 'Sin gerencia',
      score360: r.calculatedScore,
      goalsPercent: r.goalsRawPercent,
      roleFitScore: r.roleFitScore,
      quadrant: this.classifyQuadrant(r.roleFitScore, r.goalsRawPercent),
    }))
  }

  /** Aggregate stats by gerencia */
  private static aggregateByGerencia(ratings: RatingRow[]): GerenciaGoalsStats[] {
    const gerenciaMap = new Map<string, RatingRow[]>()

    for (const r of ratings) {
      const gerencia = r.employee.department?.parent?.displayName
        ?? r.employee.department?.displayName
        ?? 'Sin gerencia'
      if (!gerenciaMap.has(gerencia)) gerenciaMap.set(gerencia, [])
      gerenciaMap.get(gerencia)!.push(r)
    }

    const result: GerenciaGoalsStats[] = []

    for (const [name, rows] of gerenciaMap) {
      const withGoals = rows.filter(r => r.goalsRawPercent !== null && r.goalsCount !== null && r.goalsCount > 0)
      const coverage = rows.length > 0 ? Math.round((withGoals.length / rows.length) * 100) : 0
      const avgProgress = withGoals.length > 0
        ? Math.round(withGoals.reduce((s, r) => s + (r.goalsRawPercent ?? 0), 0) / withGoals.length)
        : 0
      const avgScore360 = rows.length > 0
        ? Math.round((rows.reduce((s, r) => s + r.calculatedScore, 0) / rows.length) * 10) / 10
        : 0

      // Disconnection for this gerencia
      let disconnected = 0
      for (const r of withGoals) {
        const score360Normalized = (r.calculatedScore / 5) * 100
        const diff = Math.abs(score360Normalized - (r.goalsRawPercent ?? 0))
        if (diff > GOALS_THRESHOLDS.DISCONNECTION_SCORE_GAP * 20) disconnected++
      }
      const disconnectionRate = withGoals.length > 0
        ? Math.round((disconnected / withGoals.length) * 100)
        : 0

      // Evaluator classification: based on calibration adjustments in this gerencia
      const calibrated = rows.filter(r => r.calibrated)
      let evaluatorClassification: string | null = null
      if (calibrated.length > 0) {
        const adjustmentTypes = calibrated.map(r => r.adjustmentType).filter(Boolean)
        const typeCounts = new Map<string, number>()
        for (const t of adjustmentTypes) {
          typeCounts.set(t!, (typeCounts.get(t!) ?? 0) + 1)
        }
        // Most common adjustment type indicates evaluator tendency
        let maxCount = 0
        for (const [type, count] of typeCounts) {
          if (count > maxCount) {
            maxCount = count
            evaluatorClassification = type
          }
        }
      }

      // Confidence level: cross calibration × goals
      let confidenceLevel: 'green' | 'amber' | 'red' = 'green'
      if (evaluatorClassification === 'INDULGENTE' && avgProgress < 40) {
        confidenceLevel = 'red' // Doble inflación
      } else if (evaluatorClassification === 'SEVERA' && avgProgress > 80) {
        confidenceLevel = 'red' // Sesgo contra resultados
      } else if (evaluatorClassification === 'CENTRAL') {
        confidenceLevel = 'amber'
      }

      result.push({
        gerenciaName: name,
        coverage,
        avgProgress,
        avgScore360,
        disconnectionRate,
        employeeCount: rows.length,
        evaluatorClassification,
        confidenceLevel,
      })
    }

    // Sort by disconnection rate desc
    return result.sort((a, b) => b.disconnectionRate - a.disconnectionRate)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // V2 DETECTION — CEO-first: 2 segmentos + vista organizacional
  // ══════════════════════════════════════════════════════════════════════════

  /** Pearson correlation coefficient. Returns null if < 5 valid pairs. */
  static calculatePearsonR(pairs: { x: number; y: number }[]): number | null {
    const valid = pairs.filter(p => p.x != null && p.y != null)
    const n = valid.length
    if (n < 5) return null

    const sumX = valid.reduce((s, p) => s + p.x, 0)
    const sumY = valid.reduce((s, p) => s + p.y, 0)
    const sumXY = valid.reduce((s, p) => s + p.x * p.y, 0)
    const sumX2 = valid.reduce((s, p) => s + p.x * p.x, 0)
    const sumY2 = valid.reduce((s, p) => s + p.y * p.y, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    )

    return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100
  }

  /**
   * Detect V2 sub-findings organized by CEO question.
   * Pure logic — no DB calls.
   */
  static detectSubFindings(
    employees: NarrativeEmployee[],
    managerClassifications: Map<string, EvaluationStatus>,
    managerNames: Map<string, string> = new Map()
  ): SubFinding[] {
    const T = GOALS_THRESHOLDS
    const ROLEFIT_THRESHOLD = 75 // Consistent with TalentFinancialFormulas
    const findings: SubFinding[] = []

    // ── SEGMENT 1: ENTREGARON (goals > 80%) ──────────────────────────────

    const entregaron = employees.filter(e => (e.goalsPercent ?? 0) > T.HIGH_GOALS)

    // 1B — ¿Los estamos perdiendo?
    const fugaProductiva = entregaron.filter(e => e.riskQuadrant === 'FUGA_CEREBROS')
    if (fugaProductiva.length > 0) {
      findings.push({
        key: '1B_fugaProductiva',
        segmentId: '1_ENTREGARON',
        employees: fugaProductiva,
        count: fugaProductiva.length,
        financialImpact: fugaProductiva.reduce((s, e) => s + (e.turnoverCost ?? 0), 0),
      })
    }

    // 1D — ¿Es sostenible?
    const sostenibilidad = entregaron.filter(e =>
      (e.roleFitScore ?? 100) < ROLEFIT_THRESHOLD
    )
    if (sostenibilidad.length > 0) {
      // Burnout risk: if they leave, replacement cost applies
      const burnoutRisk = sostenibilidad.reduce((s, e) => s + (e.turnoverCost ?? 0), 0)
      findings.push({
        key: '1D_sostenibilidad',
        segmentId: '1_ENTREGARON',
        employees: sostenibilidad,
        count: sostenibilidad.length,
        financialImpact: Math.round(burnoutRisk * 0.3), // 30% probability weight
      })
    }

    // ── SEGMENT 2: NO ENTREGARON (goals < 40%) ──────────────────────────

    const noEntregaron = employees.filter(e =>
      e.goalsPercent !== null && (e.goalsPercent ?? 0) < T.LOW_GOALS
    )

    // 2B — ¿Los vamos a premiar igual?
    const bonosInjustificados = noEntregaron.filter(e => e.score360 > T.HIGH_SCORE)
    if (bonosInjustificados.length > 0) {
      // Estimate: bonus risk ≈ 1 month salary per person (conservative)
      // Uses turnoverCost as salary proxy (turnoverCost ≈ 3-6x monthly salary)
      const bonusRisk = bonosInjustificados.reduce((s, e) => {
        const monthlySalaryEstimate = (e.turnoverCost ?? 0) / 4 // Conservative: turnover ≈ 4 months
        return s + monthlySalaryEstimate
      }, 0)
      findings.push({
        key: '2B_bonosInjustificados',
        segmentId: '2_NO_ENTREGARON',
        employees: bonosInjustificados,
        count: bonosInjustificados.length,
        financialImpact: Math.round(bonusRisk),
      })
    }

    // 2C — ¿El evaluador los protege?
    const evaluadorProtege = noEntregaron.filter(e => {
      if (!e.managerId) return false
      const mgrStatus = managerClassifications.get(e.managerId)
      return mgrStatus === 'INDULGENTE'
    })
    if (evaluadorProtege.length > 0) {
      // Group by manager for narrative
      const byManager = new Map<string, NarrativeEmployee[]>()
      for (const e of evaluadorProtege) {
        const mId = e.managerId!
        if (!byManager.has(mId)) byManager.set(mId, [])
        byManager.get(mId)!.push(e)
      }
      findings.push({
        key: '2C_evaluadorProtege',
        segmentId: '2_NO_ENTREGARON',
        employees: evaluadorProtege,
        count: evaluadorProtege.length,
        financialImpact: 0,
        meta: {
          byManager: Array.from(byManager.entries()).map(([mId, emps]) => ({
            managerId: mId,
            managerName: managerNames.get(mId) ?? 'Evaluador sin nombre',
            count: emps.length,
          })),
        },
      })
    }

    // 2A — ¿No pueden o no quieren?
    const noSabe = noEntregaron.filter(e => (e.roleFitScore ?? 100) < T.LOW_ROLEFIT)
    const noQuiere = noEntregaron.filter(e => (e.roleFitScore ?? 0) > T.HIGH_ROLEFIT)
    if (noSabe.length > 0 || noQuiere.length > 0) {
      findings.push({
        key: '2A_noPuedeVsNoQuiere',
        segmentId: '2_NO_ENTREGARON',
        employees: [...noSabe, ...noQuiere],
        count: noSabe.length + noQuiere.length,
        financialImpact: 0,
        meta: {
          noSabe: noSabe.map(e => e.id),
          noQuiere: noQuiere.map(e => e.id),
          noSabeCount: noSabe.length,
          noQuiereCount: noQuiere.length,
        },
      })
    }

    return findings
  }

  /** Group sub-findings into 3 CEO segments */
  static buildSegments(
    subFindings: SubFinding[],
    employees: NarrativeEmployee[]
  ): GoalsSegment[] {
    const T = GOALS_THRESHOLDS
    const entregaron = employees.filter(e => (e.goalsPercent ?? 0) > T.HIGH_GOALS)
    const noEntregaron = employees.filter(e =>
      e.goalsPercent !== null && (e.goalsPercent ?? 0) < T.LOW_GOALS
    )

    return [
      {
        id: '1_ENTREGARON',
        label: 'Entregaron Resultados',
        threshold: `Metas > ${T.HIGH_GOALS}%`,
        subFindings: subFindings.filter(f => f.segmentId === '1_ENTREGARON'),
        totalEmployees: entregaron.length,
      },
      {
        id: '2_NO_ENTREGARON',
        label: 'No Entregaron',
        threshold: `Metas < ${T.LOW_GOALS}%`,
        subFindings: subFindings.filter(f => f.segmentId === '2_NO_ENTREGARON'),
        totalEmployees: noEntregaron.length,
      },
      {
        id: '3_ORGANIZACIONAL',
        label: 'Vista Organizacional',
        threshold: 'Por gerencia',
        subFindings: subFindings.filter(f => f.segmentId === '3_ORGANIZACIONAL'),
        totalEmployees: employees.length,
      },
    ]
  }

  /** Rank sub-findings by financial impact, return top N */
  static rankTopAlerts(subFindings: SubFinding[], limit: number = 3): SubFinding[] {
    return [...subFindings]
      .sort((a, b) => b.financialImpact - a.financialImpact || b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Detect organizational-level sub-findings (3B, 3A, 3D).
   * Analyzes gerencia stats to find systemic patterns.
   * Returns SubFindings for the ORGANIZACIONAL segment.
   */
  static detectOrganizationalFindings(
    gerenciaStats: GerenciaGoalsStatsV2[],
    employees: NarrativeEmployee[]
  ): SubFinding[] {
    const findings: SubFinding[] = []

    // Helper: get employees in a gerencia
    const employeesInGerencia = (gerenciaName: string) =>
      employees.filter(e => e.gerencia === gerenciaName)

    // 3B — Sesgo sistemático: gerencias con confidenceLevel='red'
    const sesgadas = gerenciaStats.filter(g => g.confidenceLevel === 'red')
    if (sesgadas.length > 0) {
      const affectedEmployees = sesgadas.flatMap(g => employeesInGerencia(g.gerenciaName))
      findings.push({
        key: '3B_sesgoSistematico',
        segmentId: '3_ORGANIZACIONAL',
        employees: affectedEmployees,
        count: sesgadas.length, // count = gerencias, not employees
        financialImpact: 0,
        meta: {
          type: 'gerencia',
          gerencias: sesgadas.map(g => ({
            name: g.gerenciaName,
            avgProgress: g.avgProgress,
            evaluatorClassification: g.evaluatorClassification,
            employeeCount: g.employeeCount,
          })),
          totalAffectedEmployees: affectedEmployees.length,
        },
      })
    }

    // 3A — Pearson bajo: gerencias donde competencias no predicen resultados (r < 0.3)
    const lowPearson = gerenciaStats.filter(g =>
      g.pearsonRoleFitGoals !== null && g.pearsonRoleFitGoals < 0.3
    )
    if (lowPearson.length > 0) {
      const affectedEmployees = lowPearson.flatMap(g => employeesInGerencia(g.gerenciaName))
      findings.push({
        key: '3A_pearsonBajo',
        segmentId: '3_ORGANIZACIONAL',
        employees: affectedEmployees,
        count: lowPearson.length,
        financialImpact: 0,
        meta: {
          type: 'gerencia',
          gerencias: lowPearson.map(g => ({
            name: g.gerenciaName,
            pearsonR: g.pearsonRoleFitGoals,
            employeeCount: g.employeeCount,
          })),
          totalAffectedEmployees: affectedEmployees.length,
        },
      })
    }

    // 3D — Calibración injusta: gerencias con inflación o sesgo
    const calibrationIssues = gerenciaStats.filter(g => {
      if (!g.calibrationCross) return false
      const upInflation = g.calibrationCross.adjustedUpCount > 0 &&
        g.calibrationCross.avgGoalsAdjustedUp !== null &&
        g.calibrationCross.avgGoalsAdjustedUp < 40
      const downBias = g.calibrationCross.adjustedDownCount > 0 &&
        g.calibrationCross.avgGoalsAdjustedDown !== null &&
        g.calibrationCross.avgGoalsAdjustedDown > 80
      return upInflation || downBias
    })
    if (calibrationIssues.length > 0) {
      const affectedEmployees = calibrationIssues.flatMap(g => employeesInGerencia(g.gerenciaName))
      findings.push({
        key: '3D_calibracionInjusta',
        segmentId: '3_ORGANIZACIONAL',
        employees: affectedEmployees,
        count: calibrationIssues.length,
        financialImpact: 0,
        meta: {
          type: 'gerencia',
          gerencias: calibrationIssues.map(g => ({
            name: g.gerenciaName,
            adjustedUpCount: g.calibrationCross!.adjustedUpCount,
            adjustedDownCount: g.calibrationCross!.adjustedDownCount,
            avgGoalsUp: g.calibrationCross!.avgGoalsAdjustedUp,
            avgGoalsDown: g.calibrationCross!.avgGoalsAdjustedDown,
          })),
          totalAffectedEmployees: affectedEmployees.length,
        },
      })
    }

    return findings
  }

  /** V2 gerencia aggregation — adds Pearson (3A) + calibration cross (3D) */
  static aggregateByGerenciaV2(ratings: RatingRow[]): GerenciaGoalsStatsV2[] {
    // Get V1 base stats
    const v1Stats = this.aggregateByGerencia(ratings)

    // Build gerencia → ratings map for V2 calculations
    const gerenciaMap = new Map<string, RatingRow[]>()
    for (const r of ratings) {
      const gerencia = r.employee.department?.parent?.displayName
        ?? r.employee.department?.displayName
        ?? 'Sin gerencia'
      if (!gerenciaMap.has(gerencia)) gerenciaMap.set(gerencia, [])
      gerenciaMap.get(gerencia)!.push(r)
    }

    return v1Stats.map(g => {
      const rows = gerenciaMap.get(g.gerenciaName) ?? []

      // 3A: Pearson roleFitScore × goalsRawPercent
      const pairsForPearson = rows
        .filter(r => r.roleFitScore !== null && r.goalsRawPercent !== null)
        .map(r => ({ x: r.roleFitScore!, y: r.goalsRawPercent! }))
      const pearsonRoleFitGoals = this.calculatePearsonR(pairsForPearson)

      // 3D: Calibration cross — adjustmentType vs goalsRawPercent
      let calibrationCross: CalibrationCross | null = null
      const calibrated = rows.filter(r => r.calibrated && r.adjustmentType)
      if (calibrated.length > 0) {
        const upgraded = calibrated.filter(r => r.adjustmentType === 'upgrade')
        const downgraded = calibrated.filter(r => r.adjustmentType === 'downgrade')

        const avgGoals = (arr: RatingRow[]) => {
          const withGoals = arr.filter(r => r.goalsRawPercent !== null)
          if (withGoals.length === 0) return null
          return Math.round(withGoals.reduce((s, r) => s + r.goalsRawPercent!, 0) / withGoals.length)
        }

        calibrationCross = {
          adjustedUpCount: upgraded.length,
          adjustedDownCount: downgraded.length,
          avgGoalsAdjustedUp: avgGoals(upgraded),
          avgGoalsAdjustedDown: avgGoals(downgraded),
        }
      }

      return {
        ...g,
        pearsonRoleFitGoals,
        calibrationCross,
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // V2 ORCHESTRATOR — CEO-first entry point
  // ══════════════════════════════════════════════════════════════════════════

  static async getCorrelationDetailV2(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<GoalsCorrelationDataV2> {

    const where: any = {
      cycleId,
      accountId,
      employee: { status: 'ACTIVE', isActive: true },
    }
    if (departmentIds?.length) {
      where.employee.departmentId = { in: departmentIds }
    }

    // Single query — same as V1 but with managerId
    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        calculatedScore: true,
        goalsRawPercent: true,
        goalsCount: true,
        potentialEngagement: true,
        roleFitScore: true,
        riskQuadrant: true,
        mobilityQuadrant: true,
        calibrated: true,
        adjustmentType: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            acotadoGroup: true,
            managerId: true,
            department: {
              select: {
                displayName: true,
                parent: { select: { displayName: true } },
              },
            },
          },
        },
      },
    }) as RatingRow[]

    // Cycle config
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, accountId },
      select: { includeGoals: true, competenciesWeight: true, goalsWeight: true },
    })

    // Enrich with costs + resolved badges
    const enriched = await this.enrichWithCosts(ratings, accountId)

    // Manager classifications (for 2C evaluadorProtege + badge)
    const calibration = await PerformanceRatingService.getCalibrationStatsByDepartment(
      cycleId, accountId, departmentIds
    )
    const managerClassifications = new Map<string, EvaluationStatus>()
    const managerNames = new Map<string, string>()
    for (const dept of calibration.byDepartment) {
      managerClassifications.set(dept.managerId, dept.status)
      managerNames.set(dept.managerId, dept.managerName)
    }

    // Resolve evaluatorStatus badge on each employee
    for (const emp of enriched) {
      if (emp.managerId) {
        const mgrStatus = managerClassifications.get(emp.managerId)
        if (mgrStatus) {
          emp.badges.evaluatorStatus = this.evaluatorStatusToBadge(mgrStatus)
        }
      }
    }

    // Detect V2 sub-findings (person-level: segments 1 + 2)
    const personFindings = this.detectSubFindings(enriched, managerClassifications, managerNames)

    // Gerencia V2 (with Pearson + calibration cross)
    const byGerencia = this.aggregateByGerenciaV2(ratings)

    // Detect organizational findings (gerencia-level: segment 3)
    const orgFindings = this.detectOrganizationalFindings(byGerencia, enriched)

    // Combine all findings
    const allFindings = [...personFindings, ...orgFindings]

    // Build segments
    const segments = this.buildSegments(allFindings, enriched)

    // Top 3 alerts for portada
    const topAlerts = this.rankTopAlerts(allFindings, 3)

    // Scatter + quadrants (reuse V1 logic)
    const correlation = this.buildCorrelationPoints(ratings)
    const quadrantCounts = {
      consistent: correlation.filter(c => c.quadrant === 'CONSISTENT').length,
      perceptionBias: correlation.filter(c => c.quadrant === 'PERCEPTION_BIAS').length,
      hiddenPerformer: correlation.filter(c => c.quadrant === 'HIDDEN_PERFORMER').length,
      doubleRisk: correlation.filter(c => c.quadrant === 'DOUBLE_RISK').length,
      noGoals: correlation.filter(c => c.quadrant === 'NO_GOALS').length,
    }

    // Totals for portada headline
    const T = GOALS_THRESHOLDS
    const totalEntregaron = enriched.filter(e => (e.goalsPercent ?? 0) > T.HIGH_GOALS).length
    const totalNoEntregaron = enriched.filter(e =>
      e.goalsPercent !== null && (e.goalsPercent ?? 0) < T.LOW_GOALS
    ).length
    const totalAnomalias = allFindings.reduce((s, f) => s + f.count, 0)
    const totalFinancialRisk = allFindings.reduce((s, f) => s + f.financialImpact, 0)

    return {
      segments,
      topAlerts,
      correlation,
      quadrantCounts,
      byGerencia,
      cycleConfig: {
        includeGoals: cycle?.includeGoals ?? true,
        competenciesWeight: cycle?.competenciesWeight ?? 70,
        goalsWeight: cycle?.goalsWeight ?? 30,
      },
      totals: {
        totalEvaluados: enriched.length,
        totalEntregaron,
        totalNoEntregaron,
        totalAnomalias,
        totalFinancialRisk,
      },
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// V2 TYPES — CEO-First: 2 segmentos + vista organizacional
// ════════════════════════════════════════════════════════════════════════════

export type SegmentId = '1_ENTREGARON' | '2_NO_ENTREGARON' | '3_ORGANIZACIONAL'

/** Individual sub-finding within a segment */
export interface SubFinding {
  /** Unique key e.g. '1B_fugaProductiva' */
  key: string
  /** Parent segment */
  segmentId: SegmentId
  /** Affected employees with resolved badges */
  employees: NarrativeEmployee[]
  /** Count of affected employees */
  count: number
  /** CLP total in risk — used for ranking top alerts */
  financialImpact: number
  /** Extra data per finding (e.g. noSabe/noQuiere split, managerName) */
  meta?: Record<string, unknown>
}

/** A segment groups related sub-findings */
export interface GoalsSegment {
  id: SegmentId
  label: string
  /** Human-readable threshold description */
  threshold: string
  subFindings: SubFinding[]
  /** Total employees in this segment (not sum of sub-findings — one person can appear in multiple) */
  totalEmployees: number
}

/** Calibration cross-analysis per gerencia (3D) */
export interface CalibrationCross {
  /** Count calibrated UP (upgrade) */
  adjustedUpCount: number
  /** Count calibrated DOWN (downgrade) */
  adjustedDownCount: number
  /** Average goalsRawPercent of those calibrated UP */
  avgGoalsAdjustedUp: number | null
  /** Average goalsRawPercent of those calibrated DOWN */
  avgGoalsAdjustedDown: number | null
}

/** V2 gerencia stats — extends V1 with Pearson + calibration */
export interface GerenciaGoalsStatsV2 extends GerenciaGoalsStats {
  /** 3A: Pearson correlation RoleFit × Metas (null if < 5 data points) */
  pearsonRoleFitGoals: number | null
  /** 3D: Calibration cross-analysis */
  calibrationCross: CalibrationCross | null
}

/** V2 response — CEO-first segmented structure */
export interface GoalsCorrelationDataV2 {
  /** 2 employee segments + 1 organizational */
  segments: GoalsSegment[]
  /** Top 3 alerts ranked by financial impact (portada) */
  topAlerts: SubFinding[]
  /** Scatter plot data (reuses V1) */
  correlation: CorrelationPoint[]
  /** Quadrant counts (reuses V1) */
  quadrantCounts: {
    consistent: number
    perceptionBias: number
    hiddenPerformer: number
    doubleRisk: number
    noGoals: number
  }
  /** Per-gerencia stats with Pearson + calibration */
  byGerencia: GerenciaGoalsStatsV2[]
  /** Cycle config */
  cycleConfig: {
    includeGoals: boolean
    competenciesWeight: number
    goalsWeight: number
  }
  /** Global counts for portada headline */
  totals: {
    totalEvaluados: number
    totalEntregaron: number
    totalNoEntregaron: number
    totalAnomalias: number
    totalFinancialRisk: number
  }
}
