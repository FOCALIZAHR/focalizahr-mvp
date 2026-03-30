import { prisma } from '@/lib/prisma'
import { PositionAdapter, ACOTADO_LABELS } from '@/lib/services/PositionAdapter'

// ════════════════════════════════════════════════════════════════════════════
// ROLE FIT ANALYZER
// Calcula adecuación al cargo basado en Score Actual vs Target
// Usa Capped Average (sobre-calificación no compensa sub-calificación)
// ════════════════════════════════════════════════════════════════════════════

export interface CompetencyGap {
  competencyCode: string
  competencyName: string
  actualScore: number
  targetScore: number
  rawGap: number           // actual - target
  fitPercent: number       // (actual/target)*100, capped at 100
  status: 'MATCH' | 'IMPROVE' | 'CRITICAL' | 'EXCEEDS'
}

export interface RoleFitResult {
  employeeId: string
  employeeName: string
  standardJobLevel: string

  // KPI Principal
  roleFitScore: number     // 0-100%

  // Detalle por competencia
  gaps: CompetencyGap[]

  // Resumen
  summary: {
    totalCompetencies: number
    matching: number       // gap >= 0
    needsImprovement: number  // gap = -1
    critical: number       // gap <= -2
    exceeds: number        // gap >= +2 (riesgo fuga)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS AGREGACIÓN ORGANIZACIONAL
// ════════════════════════════════════════════════════════════════════════════

export interface LayerGerenciaFit {
  avgRoleFit: number
  count: number
  topGaps: Array<{ competency: string; gap: number; affectedCount: number }>
}

export interface RoleFitMatrix {
  overall: number
  byLayer: Record<string, number>
  matrix: Record<string, Record<string, LayerGerenciaFit>>
  worstCell: { layer: string; gerencia: string; score: number; count: number }
  investmentPriorities: Array<{
    layer: string
    layerLabel: string
    gerencia: string
    avgRoleFit: number
    gap: number
    headcount: number
    topGaps: string[]
  }>
}

export class RoleFitAnalyzer {

  /**
   * Calcula el Role Fit de un empleado para un ciclo específico
   */
  static async calculateRoleFit(
    employeeId: string,
    cycleId: string
  ): Promise<RoleFitResult | null> {

    // 1. Obtener empleado con su standardJobLevel
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        accountId: true,
        standardJobLevel: true
      }
    })

    if (!employee || !employee.standardJobLevel) {
      console.warn(`[RoleFit] Employee ${employeeId} sin standardJobLevel asignado`)
      return null
    }

    // 2. Obtener targets para este standardJobLevel
    const targets = await prisma.competencyTarget.findMany({
      where: {
        accountId: employee.accountId,
        standardJobLevel: employee.standardJobLevel,
        targetScore: { not: null }  // Solo competencias que aplican
      }
    })

    if (targets.length === 0) {
      console.warn(`[RoleFit] No hay targets definidos para nivel ${employee.standardJobLevel}`)
      return null
    }

    // 3. Obtener scores actuales del empleado en este ciclo
    const competencyScores = await this.getEmployeeCompetencyScores(employeeId, cycleId)

    // 4. Obtener nombres de competencias desde BD
    const competencyNames = await this.getCompetencyNames(
      employee.accountId,
      targets.map(t => t.competencyCode)
    )

    // 5. Calcular gaps
    const gaps: CompetencyGap[] = []
    let totalFitPercent = 0
    let matching = 0
    let needsImprovement = 0
    let critical = 0
    let exceeds = 0

    for (const target of targets) {
      const actualScore = competencyScores.get(target.competencyCode) || 0
      const targetScore = target.targetScore || 1

      const rawGap = actualScore - targetScore

      // Capped Average: sobre-calificación cuenta como 100%, no más
      let fitPercent = (actualScore / targetScore) * 100
      if (fitPercent > 100) fitPercent = 100

      // Clasificación
      let status: CompetencyGap['status']
      if (rawGap >= 2) {
        status = 'EXCEEDS'
        exceeds++
      } else if (rawGap >= 0) {
        status = 'MATCH'
        matching++
      } else if (rawGap >= -1) {
        status = 'IMPROVE'
        needsImprovement++
      } else {
        status = 'CRITICAL'
        critical++
      }

      totalFitPercent += fitPercent

      gaps.push({
        competencyCode: target.competencyCode,
        competencyName: competencyNames.get(target.competencyCode) || target.competencyCode,
        actualScore,
        targetScore,
        rawGap,
        fitPercent: Math.round(fitPercent),
        status
      })
    }

    // 6. Calcular Role Fit Score (promedio capped)
    const roleFitScore = Math.round(totalFitPercent / targets.length)

    return {
      employeeId,
      employeeName: employee.fullName,
      standardJobLevel: employee.standardJobLevel,
      roleFitScore,
      gaps: gaps.sort((a, b) => a.rawGap - b.rawGap), // Peores primero
      summary: {
        totalCompetencies: targets.length,
        matching,
        needsImprovement,
        critical,
        exceeds
      }
    }
  }

  /**
   * Obtiene los scores de competencias del empleado en el ciclo
   * Prioriza managerScore (más apropiado para Role Fit)
   */
  private static async getEmployeeCompetencyScores(
    employeeId: string,
    cycleId: string
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>()

    const { PerformanceResultsService } = await import('./PerformanceResultsService')

    try {
      const results = await PerformanceResultsService.getEvaluateeResults(cycleId, employeeId)

      if (results?.competencyScores) {
        for (const comp of results.competencyScores) {
          // Priorizar overallAvgScore (promedio ponderado de todos los evaluadores)
          // Usar ?? para no descartar scores legítimos de 0
          const score = comp.overallAvgScore ?? comp.managerScore ?? 0
          if (score > 0) {
            scores.set(comp.competencyCode, score)
          }
        }
      }
    } catch (err) {
      console.error('[RoleFit] Error obteniendo scores:', err)
    }

    return scores
  }

  /**
   * Batch: obtiene nombres de competencias desde BD
   */
  private static async getCompetencyNames(
    accountId: string,
    codes: string[]
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>()

    const competencies = await prisma.competency.findMany({
      where: {
        accountId,
        code: { in: codes },
        isActive: true
      },
      select: { code: true, name: true }
    })

    for (const c of competencies) {
      names.set(c.code, c.name)
    }

    return names
  }

  /**
   * Verifica si el cliente ha ratificado sus targets
   */
  static async hasRatifiedTargets(accountId: string): Promise<boolean> {
    const ratified = await prisma.competencyTarget.findFirst({
      where: {
        accountId,
        ratifiedAt: { not: null }
      }
    })
    return !!ratified
  }

  /**
   * Ratifica todos los targets de un cliente
   */
  static async ratifyTargets(accountId: string, userId: string): Promise<void> {
    await prisma.competencyTarget.updateMany({
      where: { accountId },
      data: {
        ratifiedAt: new Date(),
        ratifiedBy: userId
      }
    })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AGREGACIÓN ORGANIZACIONAL: Role Fit por Capa × Gerencia
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Role Fit agregado por Capa organizacional × Gerencia
   * Lee roleFitScore persistido en PerformanceRating (1 query, sin N+1)
   */
  static async getOrgRoleFitMatrix(
    accountId: string,
    cycleId: string,
    departmentIds?: string[]
  ): Promise<RoleFitMatrix> {

    // 1. Single query: ratings con roleFit persistido + employee data
    const ratingWhere: any = {
      cycleId,
      employee: { accountId, status: 'ACTIVE', standardJobLevel: { not: null } },
      roleFitScore: { not: null }
    }

    if (departmentIds?.length) {
      ratingWhere.employee.departmentId = { in: departmentIds }
    }

    const ratings = await prisma.performanceRating.findMany({
      where: ratingWhere,
      select: {
        roleFitScore: true,
        employee: {
          select: {
            standardJobLevel: true,
            department: {
              select: {
                displayName: true,
                parent: { select: { displayName: true } }
              }
            }
          }
        }
      }
    })

    // 2. Agregar por Capa × Gerencia in-memory
    const matrix: Record<string, Record<string, { sum: number; count: number }>> = {}

    for (const r of ratings) {
      const layer = PositionAdapter.getAcotadoGroup(r.employee.standardJobLevel || '') || 'sin_clasificar'
      const gerencia = r.employee.department?.parent?.displayName
        || r.employee.department?.displayName
        || 'Sin Asignar'

      if (!matrix[layer]) matrix[layer] = {}
      if (!matrix[layer][gerencia]) matrix[layer][gerencia] = { sum: 0, count: 0 }

      matrix[layer][gerencia].sum += r.roleFitScore!
      matrix[layer][gerencia].count++
    }

    // 3. Calcular promedios y encontrar peor celda
    let worstScore = 100
    let worstCell = { layer: '', gerencia: '', score: 100, count: 0 }
    let overallSum = 0
    let overallCount = 0
    const byLayer: Record<string, number> = {}
    const finalMatrix: Record<string, Record<string, LayerGerenciaFit>> = {}
    const priorities: RoleFitMatrix['investmentPriorities'] = []

    for (const [layer, gerencias] of Object.entries(matrix)) {
      finalMatrix[layer] = {}
      let layerSum = 0
      let layerCount = 0

      for (const [gerencia, data] of Object.entries(gerencias)) {
        const avg = Math.round(data.sum / data.count)

        finalMatrix[layer][gerencia] = {
          avgRoleFit: avg,
          count: data.count,
          topGaps: []  // Gaps detallados disponibles via drill-down individual
        }

        if (avg < worstScore) {
          worstScore = avg
          worstCell = { layer, gerencia, score: avg, count: data.count }
        }

        if (avg < 75) {
          priorities.push({
            layer,
            layerLabel: ACOTADO_LABELS[layer] || layer,
            gerencia,
            avgRoleFit: avg,
            gap: avg - 80,
            headcount: data.count,
            topGaps: []
          })
        }

        layerSum += avg * data.count
        layerCount += data.count
        overallSum += avg * data.count
        overallCount += data.count
      }

      if (layerCount > 0) {
        byLayer[layer] = Math.round(layerSum / layerCount)
      }
    }

    priorities.sort((a, b) => a.avgRoleFit - b.avgRoleFit)

    return {
      overall: overallCount > 0 ? Math.round(overallSum / overallCount) : 0,
      byLayer,
      matrix: finalMatrix,
      worstCell,
      investmentPriorities: priorities.slice(0, 10)
    }
  }
}
