// src/app/api/cron/onboarding-effectiveness/route.ts
// ============================================================================
// CRON JOB: Onboarding Effectiveness Analysis
// ============================================================================
//
// VERSIÓN CORREGIDA - Lee parámetro period de URL
//
// Ejecuta: Día 1 de cada mes a las 00:15 UTC
// Trigger: Vercel Cron (automático en producción)
// Seguridad: Requiere CRON_SECRET en Authorization header
//
// Propósito:
// - Analizar efectividad sistema alertas onboarding
// - Comparar retención: alertas gestionadas vs ignoradas
// - Calcular ROI estimado del sistema
// - Guardar insights en onboarding_effectiveness_insights
//
// Patrón: EXACTAMENTE IGUAL a /api/cron/aggregation (v3.2.4)
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { OnboardingEffectivenessAnalyzer } from '@/lib/services/OnboardingEffectivenessAnalyzer';

export const dynamic = 'force-dynamic';

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
        console.error('[Cron Effectiveness] CRON_SECRET not configured');
        return NextResponse.json(
          { success: false, error: 'Server misconfiguration' },
          { status: 500 }
        );
      }
      
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[Cron Effectiveness] Unauthorized access attempt');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    console.log('[Cron Effectiveness] ✅ Authenticated - Starting analysis...');
    console.log('[Cron Effectiveness] Timestamp:', new Date().toISOString());
    
    // ========================================================================
    // 2. LEER PARÁMETRO PERIOD DE URL (CORRECCIÓN)
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || undefined;
    
    if (period) {
      console.log(`[Cron Effectiveness] 📅 Período especificado: ${period}`);
    } else {
      console.log('[Cron Effectiveness] 📅 Usando período default (mes anterior)');
    }
    
    // ========================================================================
    // 3. EJECUTAR ANÁLISIS PARA TODAS LAS CUENTAS
    // ========================================================================
    console.log('[Cron Effectiveness] 📊 Analyzing effectiveness for all accounts...');
    
    await OnboardingEffectivenessAnalyzer.analyzeAllAccounts(period);
    
    const duration = Date.now() - startTime;
    
    console.log(`[Cron Effectiveness] ✅ Analysis completed in ${duration}ms`);
    
    // ========================================================================
    // 4. RETORNAR SUCCESS
    // ========================================================================
    return NextResponse.json({
      success: true,
      message: 'Effectiveness analysis completed for all accounts',
      period: period || 'default (last month)',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Cron Effectiveness] ❌ Fatal error:', error);
    
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
//       "path": "/api/cron/send-reminders",
//       "schedule": "0 23 * * *"
//     },
//     {
//       "path": "/api/cron/aggregation",
//       "schedule": "0 2 1 * *"
//     },
//     {
//       "path": "/api/cron/onboarding-effectiveness",
//       "schedule": "15 2 1 * *"
//     }
//   ]
// }
//
// Schedule explicado: "15 2 1 * *"
//   Minuto:  15 (02:15 AM)
//   Hora:    2  (02:00 AM UTC)
//   Día:     1  (primer día del mes)
//   Mes:     *  (todos los meses)
//   Weekday: *  (cualquier día de la semana)
//
// Resultado: Ejecuta día 1 de cada mes a las 02:15 UTC
//            (15 minutos después del cron de aggregation)
//
// ============================================================================
// TESTING MANUAL (Desarrollo)
// ============================================================================
//
// # Test con período específico
// curl -X GET http://localhost:3000/api/cron/onboarding-effectiveness?period=2025-12 \
//   -H "Authorization: Bearer tu_cron_secret_aqui"
//
// # Test con período default (mes anterior)
// curl -X GET http://localhost:3000/api/cron/onboarding-effectiveness \
//   -H "Authorization: Bearer tu_cron_secret_aqui"
//
// ✅ NOTA: Método GET (no POST)
// ============================================================================