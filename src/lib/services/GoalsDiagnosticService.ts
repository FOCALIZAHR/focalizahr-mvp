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
import { SalaryConfigService } from '@/lib/services/SalaryConfigService'

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
}

export interface GoalsNarratives {
  fugaProductiva: {
    employees: NarrativeEmployee[]
    totalCost: number
    count: number
  }
  bonosSinRespaldo: {
    employees: NarrativeEmployee[]
    estimatedBonusRisk: number
    count: number
  }
  talentoInvisible: {
    employees: NarrativeEmployee[]
    count: number
  }
  ejecutoresDesconectados: {
    employees: NarrativeEmployee[]
    count: number
  }
  noSabeVsNoQuiere: {
    noSabe: NarrativeEmployee[]
    noQuiere: NarrativeEmployee[]
  }
}

export interface CorrelationPoint {
  employeeId: string
  employeeName: string
  departmentName: string
  gerenciaName: string
  score360: number
  goalsPercent: number | null
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

export interface GoalsCorrelationData {
  narratives: GoalsNarratives
  correlation: CorrelationPoint[]
  quadrantCounts: {
    consistent: number
    perceptionBias: number
    hiddenPerformer: number
    doubleRisk: number
    noGoals: number
  }
  byGerencia: GerenciaGoalsStats[]
  cycleConfig: {
    includeGoals: boolean
    competenciesWeight: number
    goalsWeight: number
  }
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
  // CORRELATION DETAIL — Para /api/executive-hub/goals-correlation (full)
  // ══════════════════════════════════════════════════════════════════════════

  static async getCorrelationDetail(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<GoalsCorrelationData> {

    const where: any = {
      cycleId,
      accountId,
      employee: { status: 'ACTIVE', isActive: true },
    }
    if (departmentIds?.length) {
      where.employee.departmentId = { in: departmentIds }
    }

    // Single query with all needed data
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

    // Get cycle config for includeGoals/weights
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, accountId },
      select: { includeGoals: true, competenciesWeight: true, goalsWeight: true },
    })

    // Build enriched employees for narratives
    const enriched = await this.enrichWithCosts(ratings, accountId)

    // Detect narratives
    const narratives = this.detectNarratives(enriched)

    // Build correlation points
    const correlation = this.buildCorrelationPoints(ratings)

    // Count quadrants
    const quadrantCounts = {
      consistent: correlation.filter(c => c.quadrant === 'CONSISTENT').length,
      perceptionBias: correlation.filter(c => c.quadrant === 'PERCEPTION_BIAS').length,
      hiddenPerformer: correlation.filter(c => c.quadrant === 'HIDDEN_PERFORMER').length,
      doubleRisk: correlation.filter(c => c.quadrant === 'DOUBLE_RISK').length,
      noGoals: correlation.filter(c => c.quadrant === 'NO_GOALS').length,
    }

    // Group by gerencia
    const byGerencia = this.aggregateByGerencia(ratings)

    return {
      narratives,
      correlation,
      quadrantCounts,
      byGerencia,
      cycleConfig: {
        includeGoals: cycle?.includeGoals ?? true,
        competenciesWeight: cycle?.competenciesWeight ?? 70,
        goalsWeight: cycle?.goalsWeight ?? 30,
      },
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLASSIFY QUADRANT — Lógica pura (sin DB)
  // ══════════════════════════════════════════════════════════════════════════

  static classifyQuadrant(score360: number, goalsPercent: number | null): CorrelationQuadrant {
    if (goalsPercent === null) return 'NO_GOALS'

    const T = GOALS_THRESHOLDS
    if (score360 >= T.LOW_SCORE && goalsPercent >= T.SCATTER_GOALS_LINE) return 'CONSISTENT'
    if (score360 >= T.LOW_SCORE && goalsPercent < T.SCATTER_GOALS_LINE) return 'PERCEPTION_BIAS'
    if (score360 < T.LOW_SCORE && goalsPercent >= T.SCATTER_GOALS_LINE) return 'HIDDEN_PERFORMER'
    return 'DOUBLE_RISK'
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETECT NARRATIVES — Lógica pura (sin DB)
  // ══════════════════════════════════════════════════════════════════════════

  static detectNarratives(employees: NarrativeEmployee[]): GoalsNarratives {
    const T = GOALS_THRESHOLDS

    // 1. Fuga Productiva: rinde en metas + riesgo de fuga
    const fugaProductiva = employees.filter(e =>
      e.riskQuadrant === 'FUGA_CEREBROS' && (e.goalsPercent ?? 0) > T.HIGH_GOALS
    )

    // 2. Bonos Sin Respaldo: 360° alto + metas bajo
    const bonosSinRespaldo = employees.filter(e =>
      e.score360 > T.HIGH_SCORE && (e.goalsPercent ?? 0) < T.LOW_GOALS && e.goalsPercent !== null
    )

    // 3. Talento Invisible: metas alto + 360° bajo
    const talentoInvisible = employees.filter(e =>
      e.score360 < T.LOW_SCORE && (e.goalsPercent ?? 0) > T.HIGH_GOALS
    )

    // 4. Ejecutores Desconectados: metas alto + engagement bajo
    const ejecutoresDesconectados = employees.filter(e =>
      (e.goalsPercent ?? 0) > T.HIGH_GOALS && e.engagement === 1
    )

    // 5. No Sabe vs No Quiere: metas bajo, split por roleFit
    const lowGoals = employees.filter(e =>
      (e.goalsPercent ?? 0) < T.LOW_GOALS && e.goalsPercent !== null
    )
    const noSabe = lowGoals.filter(e => (e.roleFitScore ?? 100) < T.LOW_ROLEFIT)
    const noQuiere = lowGoals.filter(e => (e.roleFitScore ?? 0) > T.HIGH_ROLEFIT)

    return {
      fugaProductiva: {
        employees: fugaProductiva,
        totalCost: fugaProductiva.reduce((s, e) => s + (e.turnoverCost ?? 0), 0),
        count: fugaProductiva.length,
      },
      bonosSinRespaldo: {
        employees: bonosSinRespaldo,
        estimatedBonusRisk: 0, // Bonus calculation requires separate config
        count: bonosSinRespaldo.length,
      },
      talentoInvisible: {
        employees: talentoInvisible,
        count: talentoInvisible.length,
      },
      ejecutoresDesconectados: {
        employees: ejecutoresDesconectados,
        count: ejecutoresDesconectados.length,
      },
      noSabeVsNoQuiere: {
        noSabe,
        noQuiere,
      },
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /** Enrich ratings with salary/turnover costs */
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

    return ratings.map(r => {
      const salary = salaryCache.get(r.employee.acotadoGroup ?? '__default__') ?? salaryCache.get('__default__')!
      const turnoverResult = SalaryConfigService.calculateTurnoverCost(
        salary,
        r.employee.acotadoGroup as any
      )

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
      quadrant: this.classifyQuadrant(r.calculatedScore, r.goalsRawPercent),
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
}
