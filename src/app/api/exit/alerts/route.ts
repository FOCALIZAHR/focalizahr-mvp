/**
 * API GET /api/exit/alerts
 * 
 * PROPÓSITO:
 * Listar alertas Exit Intelligence con filtros y métricas
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-role (para RBAC)
 * - x-department-id (para filtrado jerárquico)
 * 
 * QUERY PARAMS:
 * - status: string (pending|acknowledged|resolved|dismissed)
 * - severity: string (critical|high|medium|low)
 * - alertType: string (ley_karin|liderazgo_concentracion|nps_critico|...)
 * - departmentId: string
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   data: ExitAlert[];
 *   metrics: {
 *     total: number;
 *     pending: number;
 *     critical: number;
 *     byType: Record<string, number>;
 *   };
 * }
 * 
 * @version 1.0
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  extractUserContext, 
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';
import { ExitAlertService } from '@/lib/services/ExitAlertService';


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚨 [Exit Alerts] Request iniciada');
    
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
    // PASO 2: PARSE QUERY PARAMS
    // ════════════════════════════════════════════════════════════════════════
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const alertType = searchParams.get('alertType') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    
    console.log('[Exit Alerts] Filters:', { status, severity, alertType, departmentId });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: FILTRADO JERÁRQUICO
    // ════════════════════════════════════════════════════════════════════════
    
    let accessibleDepartmentIds: string[] | undefined = undefined;
    
    // Si el usuario es AREA_MANAGER, filtrar por jerarquía
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      accessibleDepartmentIds = [userContext.departmentId, ...childIds];
      
      // Si se pide un departmentId específico, verificar acceso
      if (departmentId && !accessibleDepartmentIds.includes(departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado a este departamento' },
          { status: 403 }
        );
      }
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: OBTENER ALERTAS
    // ════════════════════════════════════════════════════════════════════════
    
    const alerts = await ExitAlertService.getAlertsByAccount(
      userContext.accountId,
      {
        status,
        severity,
        alertType,
        departmentId,
        departmentIds: accessibleDepartmentIds
      }
    );
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: CALCULAR MÉTRICAS
    // ════════════════════════════════════════════════════════════════════════
    
    const statistics = await ExitAlertService.getAlertStatistics(
      userContext.accountId,
      accessibleDepartmentIds
    );
    
    console.log('[Exit Alerts] ✅ Returning:', {
      alertsCount: alerts.length,
      pending: statistics.byStatus.pending,
      critical: statistics.bySeverity.critical
    });
    
    return NextResponse.json({
      success: true,
      data: alerts,
      metrics: {
        total: statistics.total,
        pending: statistics.byStatus.pending,
        acknowledged: statistics.byStatus.acknowledged,
        resolved: statistics.byStatus.resolved,
        critical: statistics.bySeverity.critical,
        high: statistics.bySeverity.high,
        byType: statistics.byType,
        bySLA: statistics.bySLA
      },
      responseTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Exit Alerts] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}