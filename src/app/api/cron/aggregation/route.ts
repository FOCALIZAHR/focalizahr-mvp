export const dynamic = 'force-dynamic';
/**
 * CRON JOB: ONBOARDING AGGREGATION
 * 
 * Ejecuta agregación mensual de métricas de onboarding
 * por departamento para todas las cuentas activas.
 * 
 * Schedule: 1er día de cada mes a las 02:00 AM
 * Authentication: CRON_SECRET (Vercel)
 * 
 * @version 3.2.5
 * @date December 2025
 * @changelog v3.2.5: Agregado NPSAggregationService para cálculo NPS Onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OnboardingAggregationService } from '@/lib/services/OnboardingAggregationService';
import { NPSAggregationService } from '@/lib/services/NPSAggregationService'; // ✅ NUEVO

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ========================================================================
    // 1. AUTENTICACIÓN CRON_SECRET
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    const vercelCronBypass = request.headers.get('x-vercel-cron-bypass');
    const cronSecret = process.env.CRON_SECRET;
    
    // Permitir ejecución automática de Vercel Cron
    if (!vercelCronBypass) {
      if (!cronSecret) {
        console.error('[Cron Aggregation] CRON_SECRET not configured');
        return NextResponse.json(
          { success: false, error: 'Server misconfiguration' },
          { status: 500 }
        );
      }
      
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[Cron Aggregation] Unauthorized access attempt');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    console.log('[Cron Aggregation] ✅ Authenticated - Starting job...');
    
    // ========================================================================
    // 2. OBTENER CUENTAS ACTIVAS
    // ========================================================================
    const accounts = await prisma.account.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        companyName: true
      }
    });
    
    console.log(`[Cron Aggregation] Processing ${accounts.length} accounts...`);
    
    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active accounts to process',
        stats: {
          accountsProcessed: 0,
          departmentsProcessed: 0,
          duration: Date.now() - startTime
        }
      });
    }
    
    // ========================================================================
    // 3. PROCESAR CADA CUENTA
    // ========================================================================
    const results = [];
    let totalDepartmentsProcessed = 0;
    let accountsWithErrors = 0;
    
    for (const account of accounts) {
      try {
        console.log(`[Cron Aggregation] → Processing: ${account.companyName}...`);
        
        const result = await OnboardingAggregationService.aggregateAllDepartments(
          account.id
          // periodStart y periodEnd = mes actual (default)
        );
        
        totalDepartmentsProcessed += result.departmentsProcessed;
        // ✅ AGREGAR ESTAS 2 LÍNEAS AQUÍ
        await OnboardingAggregationService.updateAccumulatedExoScores(account.id);
        console.log(`[Cron] ✅ Accumulated scores updated for: ${account.companyName}`);
        
        // =====================================================================
        // ✅ NUEVO: AGREGACIÓN NPS ONBOARDING
        // =====================================================================
        const now = new Date();
        const periodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const period = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;
        const periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
        const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);
        
        try {
          await NPSAggregationService.aggregateOnboardingNPS(
            account.id,
            period,
            periodStart,
            periodEnd
          );
          console.log(`[Cron] ✅ NPS Onboarding aggregated for: ${account.companyName}`);
        } catch (npsError) {
          console.error(`[Cron] ⚠️ Error aggregating NPS for ${account.companyName}:`, npsError);
        }
        // =====================================================================
        
        if (result.success) {
          console.log(
            `[Cron Aggregation] ✅ ${account.companyName}: ` +
            `${result.departmentsProcessed} departments processed`
          );
        } else {
          console.error(
            `[Cron Aggregation] ⚠️ ${account.companyName}: ` +
            `${result.errors.length} errors encountered`
          );
          accountsWithErrors++;
        }
        
        results.push({
          accountId: account.id,
          companyName: account.companyName,
          success: result.success,
          departmentsProcessed: result.departmentsProcessed,
          errors: result.errors
        });
        
      } catch (error) {
        console.error(
          `[Cron Aggregation] ❌ Fatal error processing ${account.companyName}:`,
          error
        );
        accountsWithErrors++;
        
        results.push({
          accountId: account.id,
          companyName: account.companyName,
          success: false,
          departmentsProcessed: 0,
          errors: [String(error)]
        });
      }
    }
    
    // ========================================================================
    // 4. LOGGING FINAL Y RESPUESTA
    // ========================================================================
    const duration = Date.now() - startTime;
    const successRate = ((accounts.length - accountsWithErrors) / accounts.length * 100).toFixed(1);
    
    console.log(`[Cron Aggregation] ============================================`);
    console.log(`[Cron Aggregation] JOB COMPLETED`);
    console.log(`[Cron Aggregation] Accounts processed: ${accounts.length}`);
    console.log(`[Cron Aggregation] Departments processed: ${totalDepartmentsProcessed}`);
    console.log(`[Cron Aggregation] Success rate: ${successRate}%`);
    console.log(`[Cron Aggregation] Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`[Cron Aggregation] ============================================`);
    
    return NextResponse.json({
      success: accountsWithErrors === 0,
      message: `Aggregation completed for ${accounts.length} accounts`,
      stats: {
        accountsProcessed: accounts.length,
        accountsWithErrors,
        successRate: `${successRate}%`,
        departmentsProcessed: totalDepartmentsProcessed,
        duration: `${(duration / 1000).toFixed(2)}s`
      },
      results
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron Aggregation] ❌ FATAL ERROR:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fatal error during aggregation',
        message: String(error),
        stats: {
          duration: `${(duration / 1000).toFixed(2)}s`
        }
      },
      { status: 500 }
    );
  }
}