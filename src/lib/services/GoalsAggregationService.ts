// src/lib/services/GoalsAggregationService.ts
// ════════════════════════════════════════════════════════════════════════════
// GOALS AGGREGATION SERVICE
// PROPÓSITO:
//   - LENTE 1: EmployeeGoalsInsight (histórico mensual por persona)
//   - LENTE 2: Employee.accumulatedGoals* (Gold Cache rolling 12 meses)
// ARQUITECTURA:
//   - Análogo a ExitAggregationService / OnboardingAggregationService
//   - Ejecutado por CRON mensual (día 1) — el cron es Gate B, fuera de este archivo
//   - NO recalcula cumplimiento: consume GoalsService.getEmployeeGoalsScore (Time Travel)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { GoalsService } from './GoalsService'

interface GoalsAggregationResult {
  employeesProcessed: number
  insightsUpserted: number
}

export class GoalsAggregationService {

  // CHUNK_SIZE=10: seguro bajo el pool pgbouncer (~15); calca el precedente vivo
  // PerformanceRatingService.ts:434. Es el control real de concurrencia.
  private static readonly CHUNK_SIZE = 10

  // ══════════════════════════════════════════════════════════════════════════
  // ORQUESTADOR PRINCIPAL (calca runMonthlyAggregation de Exit)
  // ══════════════════════════════════════════════════════════════════════════
  static async runMonthlyAggregation(
    accountId: string,
    period: string
  ): Promise<GoalsAggregationResult> {
    const { periodStart, periodEnd } = this.parsePeriod(period)

    let employeesProcessed = 0
    let insightsUpserted = 0

    // ── UNIVERSO (Opción A): empleados con ≥1 meta weight>0 vigente en período
    // Vigente = startDate <= periodEnd AND dueDate >= periodStart
    // F3: isActive:true junto a status:'ACTIVE' (convención Employee del proyecto)
    const employees = await prisma.employee.findMany({
      where: {
        accountId,
        status: 'ACTIVE',
        isActive: true,
        goals: {
          some: {
            weight: { gt: 0 },
            status: { notIn: ['CANCELLED'] },
            startDate: { lte: periodEnd },
            dueDate: { gte: periodStart },
          }
        }
      },
      select: { id: true, fullName: true }
    })

    console.log(`[GoalsAggregation] Account ${accountId}: ${employees.length} employees with active goals`)

    // ── Resolver ciclo activo del período (si GoalCycle existe) - NUEVO
    const activeCycleId = await this.resolveActiveCycle(accountId, periodStart, periodEnd)

    // ── Chunks paralelos (calca PerformanceRatingService.ts:433-456)
    // Promise.allSettled aísla fallos por empleado (no aborta el chunk).
    // Cada empleado toca SOLO su fila (upsert unique + update by PK) → sin race.
    for (let i = 0; i < employees.length; i += this.CHUNK_SIZE) {
      const chunk = employees.slice(i, i + this.CHUNK_SIZE)
      const settled = await Promise.allSettled(
        chunk.map(emp =>
          this.processEmployee(accountId, emp.id, period, periodStart, periodEnd, activeCycleId)
        )
      )

      for (let j = 0; j < settled.length; j++) {
        if (settled[j].status === 'fulfilled') {
          employeesProcessed++
          insightsUpserted++
        } else {
          const reason = (settled[j] as PromiseRejectedResult).reason
          console.error(
            `[GoalsAggregation] Error emp ${chunk[j].fullName}:`,
            reason instanceof Error ? reason.message : 'Error desconocido'
          )
        }
      }
    }

    return { employeesProcessed, insightsUpserted }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UNIDAD DE TRABAJO PARALELA: LENTE 1 → LENTE 2 (en orden — LENTE 2 lee lo que
  // LENTE 1 acaba de escribir para este empleado). Independiente entre empleados
  // (filas distintas), por eso es seguro correr N en paralelo dentro del chunk.
  // ══════════════════════════════════════════════════════════════════════════
  private static async processEmployee(
    accountId: string,
    employeeId: string,
    period: string,
    periodStart: Date,
    periodEnd: Date,
    goalCycleId: string | null
  ): Promise<void> {
    await this.calculateEmployeeInsight(accountId, employeeId, period, periodStart, periodEnd, goalCycleId)
    await this.updateGoldCache(employeeId)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LENTE 1: EMPLOYEE GOALS INSIGHT (calca calculateDepartmentInsight)
  // ══════════════════════════════════════════════════════════════════════════
  private static async calculateEmployeeInsight(
    accountId: string,
    employeeId: string,
    period: string,
    periodStart: Date,
    periodEnd: Date,
    goalCycleId: string | null
  ): Promise<void> {

    // ── REUTILIZA cálculo existente (Time Travel a fin de mes)
    const scoreData = await GoalsService.getEmployeeGoalsScore(employeeId, periodEnd)

    // ── Trend vs período anterior (patrón eisTrend)
    const previousInsight = await prisma.employeeGoalsInsight.findFirst({
      where: {
        employeeId,
        period: this.getPreviousPeriod(period),
        periodType: 'monthly'
      }
    })

    const scoreTrend = scoreData.score !== null && previousInsight?.weightedScore != null
      ? Math.round((scoreData.score - previousInsight.weightedScore) * 10) / 10
      : null

    // ── Upsert idempotente sobre @@unique(accountId,employeeId,period,periodType)
    await prisma.employeeGoalsInsight.upsert({
      where: {
        accountId_employeeId_period_periodType: {
          accountId,
          employeeId,
          period,
          periodType: 'monthly'
        }
      },
      update: {
        goalCycleId,
        weightedScore: scoreData.score,
        goalsCount: scoreData.goalsCount,
        completedCount: scoreData.completedCount,
        totalWeight: scoreData.totalWeight,
        scoreTrend,
        goalsDetail: scoreData.details as unknown as Prisma.InputJsonValue,
        calculatedAt: new Date(),
      },
      create: {
        accountId,
        employeeId,
        period,
        periodType: 'monthly',
        periodStart,
        periodEnd,
        goalCycleId,
        weightedScore: scoreData.score,
        goalsCount: scoreData.goalsCount,
        completedCount: scoreData.completedCount,
        totalWeight: scoreData.totalWeight,
        scoreTrend,
        goalsDetail: scoreData.details as unknown as Prisma.InputJsonValue,
      }
    })

    console.log(`[GoalsAggregation] ✅ LENTE 1 emp ${employeeId} period ${period}: score=${scoreData.score}`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LENTE 2: GOLD CACHE (calca updateGoldCache de Exit, rolling 12 meses)
  // ══════════════════════════════════════════════════════════════════════════
  private static async updateGoldCache(employeeId: string): Promise<void> {
    const insights = await prisma.employeeGoalsInsight.findMany({
      where: { employeeId, periodType: 'monthly' },
      orderBy: { periodStart: 'desc' },
      take: 12
    })

    if (insights.length === 0) return

    // Promedio de los scores válidos de los últimos 12 meses
    const validScores = insights
      .map(i => i.weightedScore)
      .filter((s): s is number => s !== null)

    const accumulatedScore = validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : null

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        accumulatedGoalsScore: accumulatedScore,
        accumulatedGoalsPeriods: insights.length,
        accumulatedGoalsLastUpdated: new Date(),
      }
    })

    console.log(`[GoalsAggregation] ✅ LENTE 2 emp ${employeeId}: accumScore=${accumulatedScore} periods=${insights.length}`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS (calcados de Exit)
  // ══════════════════════════════════════════════════════════════════════════

  private static parsePeriod(period: string): { periodStart: Date; periodEnd: Date } {
    // "2026-01" → start=2026-01-01, end=2026-01-31
    const [year, month] = period.split('-').map(Number)
    const periodStart = new Date(Date.UTC(year, month - 1, 1))
    const periodEnd = new Date(Date.UTC(year, month, 0)) // día 0 del mes siguiente = último día
    return { periodStart, periodEnd }
  }

  private static getPreviousPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number)
    const prev = new Date(Date.UTC(year, month - 2, 1))
    return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NUEVO: resolver ciclo activo (si GoalCycle existe en el schema)
  // GoalCycle aún NO existe → este método retorna null y el insight se guarda
  // sin ciclo (goalCycleId nullable). Cast justificado (F4): el modelo no está
  // en el Prisma Client todavía.
  // ══════════════════════════════════════════════════════════════════════════
  private static async resolveActiveCycle(
    accountId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<string | null> {
    try {
      const cycle = await (prisma as any).goalCycle?.findFirst({
        where: {
          accountId,
          status: { in: ['ACTIVE', 'CLOSING'] },
          assignmentWindow: { lte: periodEnd },
          closureWindow: { gte: periodStart },
        },
        select: { id: true }
      })
      return cycle?.id ?? null
    } catch {
      return null // GoalCycle no existe todavía
    }
  }
}
