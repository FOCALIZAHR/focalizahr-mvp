import { prisma } from '@/lib/prisma'

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
}
