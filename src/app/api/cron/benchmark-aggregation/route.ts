// src/app/api/cron/benchmark-aggregation/route.ts
// ============================================================================
// CRON JOB: Benchmark Aggregation
// ============================================================================
//
// Ejecuta: Día 1 de cada mes a las 00:10 UTC
// Trigger: Vercel Cron (automático en producción)
// Seguridad: Requiere CRON_SECRET en Authorization header
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { BenchmarkAggregationService } from '@/lib/services/BenchmarkAggregationService';

export async function POST(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════
    // PASO 1: Verificar Authorization Token
    // ═══════════════════════════════════════════════════════════
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron Benchmark] ❌ Unauthorized attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Cron Benchmark] 🚀 Iniciando agregación mensual...');
    const startTime = Date.now();
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2: Ejecutar Agregación
    // ═══════════════════════════════════════════════════════════
    await BenchmarkAggregationService.runMonthlyAggregation();
    
    const duration = Date.now() - startTime;
    
    console.log(`[Cron Benchmark] ✅ Completado exitosamente en ${duration}ms`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 3: Retornar Success
    // ═══════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Cron Benchmark] ❌ Error fatal:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// CONFIGURACIÓN VERCEL CRON
// ============================================================================
//
// Agregar a vercel.json en la raíz del proyecto:
//
// {
//   "crons": [
//     {
//       "path": "/api/cron/onboarding-aggregation",
//       "schedule": "5 0 1 * *"
//     },
//     {
//       "path": "/api/cron/benchmark-aggregation",
//       "schedule": "10 0 1 * *"
//     }
//   ]
// }
//
// Schedule explicado: "10 0 1 * *"
//   Minuto:  10 (00:10 UTC)
//   Hora:    0  (medianoche UTC)
//   Día:     1  (primer día del mes)
//   Mes:     *  (todos los meses)
//   Weekday: *  (cualquier día de la semana)
//
// Resultado: Ejecuta día 1 de cada mes a las 00:10 UTC
//            (5 minutos después del cron de onboarding Tarea B)
//
// ============================================================================
// VARIABLES DE ENTORNO REQUERIDAS
// ============================================================================
//
// Agregar a .env y Vercel Dashboard:
//   CRON_SECRET=tu_secret_aleatorio_256_bits_aqui
//
// Generar secret:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// ============================================================================
// TESTING MANUAL (Desarrollo)
// ============================================================================
//
// curl -X POST http://localhost:3000/api/cron/benchmark-aggregation \
//   -H "Authorization: Bearer tu_secret_aqui"
//
// ============================================================================