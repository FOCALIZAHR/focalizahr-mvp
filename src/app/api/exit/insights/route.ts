/**
 * API GET /api/exit/insights
 * 
 * PROPÓSITO:
 * Obtener insights transversales de Exit Intelligence
 * Análisis a nivel empresa de patrones de salida
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   data: ExitInsight[];
 * }
 * 
 * INSIGHTS GENERADOS:
 * - factor_frecuente: Factor mencionado por ≥40% de salidas
 * - correlacion_onboarding: Conservation Index bajo o alertas ignoradas
 * - tendencia: Cambio significativo en EIS
 * 
 * @version 1.0
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractUserContext } from '@/lib/services/AuthorizationService';
import { ExitAggregationService } from '@/lib/services/ExitAggregationService';


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('💡 [Exit Insights] Request iniciada');
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: AUTENTICACIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: GENERAR INSIGHTS
    // ════════════════════════════════════════════════════════════════════════
    
    const insights = await ExitAggregationService.generateInsights(
      userContext.accountId
    );
    
    console.log('[Exit Insights] ✅ Generated:', {
      total: insights.length,
      bySeverity: {
        critical: insights.filter(i => i.severity === 'critical').length,
        warning: insights.filter(i => i.severity === 'warning').length,
        info: insights.filter(i => i.severity === 'info').length
      }
    });
    
    return NextResponse.json({
      success: true,
      data: insights,
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisWindow: '6 months'
      },
      responseTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Exit Insights] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}