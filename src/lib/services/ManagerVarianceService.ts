// ════════════════════════════════════════════════════════════════════════════
// MANAGER VARIANCE SERVICE - Varianza entre evaluadores por gerencia
// src/lib/services/ManagerVarianceService.ts
// ════════════════════════════════════════════════════════════════════════════
// Calcula qué tan diferente evalúan los jefes dentro de la misma gerencia.
// Si la varianza es ALTA, hay sesgo: un jefe da 5 a todos, otro da 2.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type VarianceLevel = 'BAJA' | 'MEDIA' | 'ALTA'

export interface GerenciaVariance {
  gerencia: string
  evaluatorCount: number
  avgVariance: number
  level: VarianceLevel
  evaluators: Array<{
    managerId: string
    managerName: string
    avgScore: number
    ratingsCount: number
  }>
}

export interface VarianceSummary {
  overall: VarianceLevel
  overallVariance: number
  byGerencia: GerenciaVariance[]
}

// ═══════════════════════════════════════════════════════════════════════
// THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════

function classifyVariance(variance: number): VarianceLevel {
  if (variance < 0.5) return 'BAJA'
  if (variance < 1.0) return 'MEDIA'
  return 'ALTA'
}

// ═══════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════

export class ManagerVarianceService {
  /**
   * Calcula la varianza entre evaluadores (jefes) por gerencia.
   * Agrupa empleados por su managerId, calcula el promedio que cada jefe da,
   * luego mide la dispersión entre jefes dentro de la misma gerencia.
   */
  static async getVarianceByGerencia(
    cycleId: string,
    accountId: string,
    departmentIds?: string[]
  ): Promise<VarianceSummary> {
    // Query: ratings con managerScore, agrupados por manager y gerencia
    const where: any = {
      cycleId,
      accountId,
      managerScore: { not: null },
      employee: {
        status: 'ACTIVE',
        managerId: { not: null }
      }
    }

    if (departmentIds?.length) {
      where.employee.departmentId = { in: departmentIds }
    }

    const ratings = await prisma.performanceRating.findMany({
      where,
      select: {
        managerScore: true,
        employee: {
          select: {
            managerId: true,
            manager: {
              select: {
                id: true,
                fullName: true
              }
            },
            department: {
              select: {
                displayName: true,
                parent: {
                  select: { displayName: true }
                }
              }
            }
          }
        }
      }
    })

    // Agrupar por gerencia → manager
    const gerenciaMap = new Map<string, Map<string, {
      managerName: string
      scores: number[]
    }>>()

    for (const r of ratings) {
      if (!r.managerScore || !r.employee.managerId) continue

      const gerencia = r.employee.department?.parent?.displayName
        || r.employee.department?.displayName
        || 'Sin Gerencia'
      const managerId = r.employee.managerId
      const managerName = r.employee.manager?.fullName || 'Desconocido'

      if (!gerenciaMap.has(gerencia)) {
        gerenciaMap.set(gerencia, new Map())
      }
      const managerMap = gerenciaMap.get(gerencia)!
      if (!managerMap.has(managerId)) {
        managerMap.set(managerId, { managerName, scores: [] })
      }
      managerMap.get(managerId)!.scores.push(r.managerScore)
    }

    // Calcular varianza por gerencia
    const byGerencia: GerenciaVariance[] = []
    const allManagerAvgs: number[] = []

    for (const [gerencia, managerMap] of gerenciaMap) {
      if (managerMap.size < 2) continue // Necesitamos al menos 2 jefes para varianza

      const evaluators: GerenciaVariance['evaluators'] = []
      const avgs: number[] = []

      for (const [managerId, data] of managerMap) {
        const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        avgs.push(avg)
        allManagerAvgs.push(avg)
        evaluators.push({
          managerId,
          managerName: data.managerName,
          avgScore: Math.round(avg * 100) / 100,
          ratingsCount: data.scores.length
        })
      }

      // Varianza entre promedios de jefes en esta gerencia
      const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length
      const variance = avgs.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / avgs.length
      const stdDev = Math.sqrt(variance)

      byGerencia.push({
        gerencia,
        evaluatorCount: managerMap.size,
        avgVariance: Math.round(stdDev * 100) / 100,
        level: classifyVariance(stdDev),
        evaluators: evaluators.sort((a, b) => b.avgScore - a.avgScore)
      })
    }

    // Varianza global
    let overallVariance = 0
    if (allManagerAvgs.length >= 2) {
      const mean = allManagerAvgs.reduce((a, b) => a + b, 0) / allManagerAvgs.length
      const variance = allManagerAvgs.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / allManagerAvgs.length
      overallVariance = Math.round(Math.sqrt(variance) * 100) / 100
    }

    return {
      overall: classifyVariance(overallVariance),
      overallVariance,
      byGerencia: byGerencia.sort((a, b) => b.avgVariance - a.avgVariance)
    }
  }
}
