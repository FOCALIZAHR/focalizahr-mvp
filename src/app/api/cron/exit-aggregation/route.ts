/**
 * API POST /api/cron/exit-aggregation
 * 
 * PROPÓSITO:
 * Ejecutar agregación mensual de Exit Intelligence
 * - LENTE 1: DepartmentExitInsight (histórico mensual)
 * - LENTE 2: Department.accumulated* (Gold Cache 12 meses)
 * - NPS Exit: Agregación a tabla nps_insights
 * - Verificar alertas departamentales
 * - Actualizar SLA de alertas abiertas
 * 
 * AUTENTICACIÓN:
 * Header: Authorization: Bearer {CRON_SECRET}
 * 
 * EJECUCIÓN:
 * - Día 1 de cada mes
 * - Procesa el mes anterior
 * - Recomendado: 00:30 UTC (después de cron onboarding)
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   message: string;
 *   stats: {
 *     accountsProcessed: number;
 *     departmentsProcessed: number;
 *     alertsCreated: number;
 *     npsProcessed: number;
 *     slaUpdated: number;
 *   };
 * }
 * 
 * @version 1.1
 * @date January 2026
 * @changelog v1.1: Agregado NPSAggregationService para NPS Exit
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExitAggregationService } from '@/lib/services/ExitAggregationService';
import { ExitAlertService } from '@/lib/services/ExitAlertService';
import { NPSAggregationService } from '@/lib/services/NPSAggregationService';


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER POST
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('⏰ [CRON Exit Aggregation] Starting...');
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: VERIFICAR AUTORIZACIÓN CRON
    // ════════════════════════════════════════════════════════════════════════
    
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Si CRON_SECRET está configurado, verificar autorización
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.log('[CRON Exit Aggregation] ⛔ Unauthorized request');
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 401 }
        );
      }
    } else {
      // Warning si no hay CRON_SECRET configurado (solo en dev)
      console.warn('[CRON Exit Aggregation] ⚠️ CRON_SECRET not configured - running without auth');
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1.5: LEER PERÍODO OPCIONAL (para testing)
    // ════════════════════════════════════════════════════════════════════════

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // "2025-12" o null

    if (period) {
      console.log(`[CRON Exit Aggregation] 📅 Período especificado: ${period}`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: EJECUTAR AGREGACIÓN MENSUAL
    // ════════════════════════════════════════════════════════════════════════
    
    console.log('[CRON Exit Aggregation] Phase 1: Monthly aggregation...');
    
    const aggregationResult = await ExitAggregationService.runMonthlyAggregation(period || undefined);
    
    console.log('[CRON Exit Aggregation] Phase 1 completed:', {
      accountsProcessed: aggregationResult.accountsProcessed,
      departmentsProcessed: aggregationResult.departmentsProcessed,
      alertsCreated: aggregationResult.alertsCreated,
      errors: aggregationResult.errors.length
    });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2.5: AGREGACIÓN NPS EXIT
    // ════════════════════════════════════════════════════════════════════════
    
    console.log('[CRON Exit Aggregation] Phase 1.5: NPS Exit aggregation...');
    
    let npsProcessed = 0;
    
    // Calcular fechas del período
    let periodStart: Date;
    let periodEnd: Date;
    
    if (period && /^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-').map(Number);
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    }
    
    const npsPeriod = period || `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    
    // Obtener cuentas activas y procesar NPS
    const accounts = await prisma.account.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, companyName: true }
    });
    
    for (const account of accounts) {
      try {
        await NPSAggregationService.aggregateExitNPS(
          account.id,
          npsPeriod,
          periodStart,
          periodEnd
        );
        npsProcessed++;
        console.log(`[CRON Exit Aggregation] ✅ NPS Exit aggregated for: ${account.companyName}`);
      } catch (npsError) {
        console.error(`[CRON Exit Aggregation] ⚠️ Error NPS for ${account.companyName}:`, npsError);
      }
    }
    
    console.log('[CRON Exit Aggregation] Phase 1.5 completed:', { npsProcessed });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: ACTUALIZAR SLA DE ALERTAS ABIERTAS
    // ════════════════════════════════════════════════════════════════════════
    
    console.log('[CRON Exit Aggregation] Phase 2: Updating SLA status...');
    
    const slaResult = await ExitAlertService.updateSLAStatus();
    
    console.log('[CRON Exit Aggregation] Phase 2 completed:', {
      slaUpdated: slaResult.updated
    });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: RESPUESTA
    // ════════════════════════════════════════════════════════════════════════
    
    const totalTime = Date.now() - startTime;
    
    console.log(`[CRON Exit Aggregation] ✅ Completed in ${totalTime}ms`);
    
    // Si hubo errores, reportarlos pero no fallar
    if (aggregationResult.errors.length > 0) {
      console.warn('[CRON Exit Aggregation] ⚠️ Completed with errors:', 
        aggregationResult.errors.slice(0, 5) // Primeros 5 errores
      );
    }
    
    return NextResponse.json({
      success: aggregationResult.success,
      message: aggregationResult.success
        ? 'Agregación Exit completada exitosamente'
        : 'Agregación Exit completada con errores',
      period: period || 'default (mes anterior)',
      stats: {
        accountsProcessed: aggregationResult.accountsProcessed,
        departmentsProcessed: aggregationResult.departmentsProcessed,
        alertsCreated: aggregationResult.alertsCreated,
        npsProcessed,
        slaUpdated: slaResult.updated,
        errors: aggregationResult.errors.length
      },
      errorsSample: aggregationResult.errors.slice(0, 5),
      executionTime: `${totalTime}ms`
    });
    
  } catch (error: any) {
    console.error('[CRON Exit Aggregation] ❌ Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error interno',
        executionTime: `${Date.now() - startTime}ms`
      },
      { status: 500 }
    );
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET (para health check)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/exit-aggregation',
    method: 'POST',
    description: 'CRON mensual para agregación Exit Intelligence',
    schedule: 'Día 1 de cada mes, 00:30 UTC',
    authorization: 'Bearer {CRON_SECRET}',
    tasks: [
      'LENTE 1: DepartmentExitInsight (histórico mensual)',
      'LENTE 2: Department.accumulated* (Gold Cache 12 meses)',
      'NPS Exit: Agregación a nps_insights (productType: exit)',
      'Verificar alertas departamentales',
      'Actualizar SLA alertas abiertas'
    ]
  });
}