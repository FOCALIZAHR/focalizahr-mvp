export const dynamic = 'force-dynamic';
export const maxDuration = 300;
/**
 * CRON JOB: GOALS AGGREGATION (mensual, día 1, 04:00 UTC)
 *
 * LENTE 1: EmployeeGoalsInsight (histórico mensual por persona)
 * LENTE 2: Employee.accumulatedGoals* (Gold Cache rolling 12 meses)
 *
 * Llama GoalsAggregationService.runMonthlyAggregation (sellado Gate A) por cada
 * cuenta ACTIVE. NO reimplementa lógica de cálculo.
 *
 * ⚠️ Método GET — Vercel Cron despacha por GET. Todos los crons vivos son GET;
 *    los POST (benchmark-aggregation, exit-aggregation) están muertos. No cambiar.
 *
 * Schedule: "0 4 1 * *" (día 1 de cada mes, 04:00 UTC) — registrado en vercel.json
 * Authentication: CRON_SECRET (Vercel)
 * Testing: ?period=YYYY-MM fuerza un período específico (default: mes anterior)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalsAggregationService } from '@/lib/services/GoalsAggregationService';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. AUTENTICACIÓN CRON_SECRET (calca aggregation/route.ts:28-49)
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    const vercelCronBypass = request.headers.get('x-vercel-cron-bypass');
    const cronSecret = process.env.CRON_SECRET;

    if (!vercelCronBypass) {
      if (!cronSecret) {
        console.error('[Cron Goals Aggregation] CRON_SECRET not configured');
        return NextResponse.json(
          { success: false, error: 'Server misconfiguration' },
          { status: 500 }
        );
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[Cron Goals Aggregation] Unauthorized access attempt');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron Goals Aggregation] ✅ Authenticated - Starting job...');

    // ========================================================================
    // 1.5 PERÍODO: override ?period=YYYY-MM o mes anterior
    //     (calca patrón de aggregation/route.ts:55-66 + :118-120, local-time)
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period');
    let period: string;
    if (periodParam && /^\d{4}-\d{2}$/.test(periodParam)) {
      period = periodParam;
      console.log(`[Cron Goals Aggregation] 📅 Período especificado: ${period}`);
    } else {
      const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    }

    // ========================================================================
    // 2. OBTENER CUENTAS ACTIVAS (calca :70-76)
    // ========================================================================
    const accounts = await prisma.account.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, companyName: true },
    });

    console.log(`[Cron Goals Aggregation] Processing ${accounts.length} accounts for period ${period}...`);

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active accounts to process',
        stats: {
          period,
          accountsProcessed: 0,
          employeesProcessed: 0,
          insightsUpserted: 0,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        },
      });
    }

    // ========================================================================
    // 3. PROCESAR CADA CUENTA (try/catch por cuenta, calca :99-171)
    // ========================================================================
    const results = [];
    let totalEmployees = 0;
    let totalInsights = 0;
    let accountsWithErrors = 0;

    for (const account of accounts) {
      try {
        console.log(`[Cron Goals Aggregation] → Processing: ${account.companyName}...`);
        const result = await GoalsAggregationService.runMonthlyAggregation(account.id, period);
        totalEmployees += result.employeesProcessed;
        totalInsights += result.insightsUpserted;
        results.push({
          accountId: account.id,
          companyName: account.companyName,
          success: true,
          employeesProcessed: result.employeesProcessed,
          insightsUpserted: result.insightsUpserted,
        });
      } catch (error) {
        console.error(`[Cron Goals Aggregation] ❌ Error processing ${account.companyName}:`, error);
        accountsWithErrors++;
        results.push({
          accountId: account.id,
          companyName: account.companyName,
          success: false,
          employeesProcessed: 0,
          insightsUpserted: 0,
          errors: [String(error)],
        });
      }
    }

    // ========================================================================
    // 4. LOGGING FINAL Y RESPUESTA (calca shape :187-198)
    // ========================================================================
    const duration = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    console.log(`[Cron Goals Aggregation] ============================================`);
    console.log(`[Cron Goals Aggregation] JOB COMPLETED — period ${period}`);
    console.log(`[Cron Goals Aggregation] Accounts: ${accounts.length} (errors: ${accountsWithErrors})`);
    console.log(`[Cron Goals Aggregation] Employees: ${totalEmployees} | Insights: ${totalInsights}`);
    console.log(`[Cron Goals Aggregation] Duration: ${duration}`);
    console.log(`[Cron Goals Aggregation] ============================================`);

    return NextResponse.json({
      success: accountsWithErrors === 0,
      message: `Goals aggregation completed for period ${period} (${accounts.length} accounts)`,
      stats: {
        period,
        accountsProcessed: accounts.length,
        accountsWithErrors,
        employeesProcessed: totalEmployees,
        insightsUpserted: totalInsights,
        duration,
      },
      results,
    });

  } catch (error) {
    const duration = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
    console.error('[Cron Goals Aggregation] ❌ FATAL ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fatal error during goals aggregation',
        message: String(error),
        stats: { duration },
      },
      { status: 500 }
    );
  }
}
