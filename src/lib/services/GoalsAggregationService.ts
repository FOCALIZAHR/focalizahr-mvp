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

  // Vercel Hobby maxDuration 300s → lotes acotados
  private static readonly BATCH_SIZE = 50

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

    // ── Procesar por lotes (Vercel Hobby maxDuration 300s)
    for (let i = 0; i < employees.length; i += this.BATCH_SIZE) {
      const batch = employees.slice(i, i + this.BATCH_SIZE)

      for (const emp of batch) {
        try {
          // LENTE 1: EmployeeGoalsInsight
          await this.calculateEmployeeInsight(
            accountId, emp.id, period, periodStart, periodEnd, activeCycleId
          )

          // LENTE 2: Gold Cache rolling 12 meses
          await this.updateGoldCache(emp.id)

          insightsUpserted++
          employeesProcessed++
        } catch (error: any) {
          console.error(`[GoalsAggregation] Error emp ${emp.fullName}:`, error.message)
        }
      }
    }

    return { employeesProcessed, insightsUpserted }
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
