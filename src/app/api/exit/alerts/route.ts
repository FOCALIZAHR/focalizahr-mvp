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
 * - scope: string (opcional) - 'company' | 'filtered' (default: 'filtered')
 *   · 'company': Rankings comparativos (AREA_MANAGER ve todas las alertas)
 *   · 'filtered': Vista filtrada (AREA_MANAGER ve solo su área + hijos)
 * 
 * RESPONSE:
 * {
 *   success: boolean;
 *   data: ExitAlert[];
 *   meta: {
 *     canDrillDown: string[];
 *     scope: string;
 *     userRole: string;
 *     userDepartmentId: string | null;
 *   };
 *   metrics: {
 *     total: number;
 *     pending: number;
 *     critical: number;
 *     byType: Record<string, number>;
 *   };
 * }
 * 
 * @version 2.0 - RBAC Scope Implementation
 * @date January 2026
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
    const scope = searchParams.get('scope') || 'filtered'; // 'company' | 'filtered'
    
    console.log('[Exit Alerts] Filters:', { status, severity, alertType, departmentId, scope, userRole: userContext.role });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: FILTRADO JERÁRQUICO CON SCOPE
    // ════════════════════════════════════════════════════════════════════════
    
    let accessibleDepartmentIds: string[] | undefined = undefined;
    let canDrillDown: string[] = []; // IDs donde usuario puede hacer drill-down
    
    // Si el usuario es AREA_MANAGER, aplicar filtrado según scope
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      
      // Calcular jerarquía SIEMPRE (para validaciones y canDrillDown)
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      canDrillDown = [userContext.departmentId, ...childIds];
      
      // 🆕 SCOPE CHECK: Determinar si aplicar filtro en queries masivas
      if (scope === 'company') {
        console.log('[Exit Alerts] 🌐 Scope "company": Rankings sin filtro (ve todas las alertas)');
        // accessibleDepartmentIds = undefined → queries masivas ven todo
      } else {
        // Scope 'filtered': aplicar filtro jerárquico
        accessibleDepartmentIds = canDrillDown;
        console.log('[Exit Alerts] 🔐 Filtrado jerárquico aplicado:', {
          role: 'AREA_MANAGER',
          baseDepartment: userContext.departmentId,
          allowedCount: accessibleDepartmentIds.length
        });
      }
      
      // 🔒 VALIDACIÓN ACCESO ESPECÍFICO (aplica en AMBOS scopes para seguridad)
      // Rankings públicos SÍ, pero gestión de alerta específica solo si está en su jerarquía
      if (departmentId && !canDrillDown.includes(departmentId)) {
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
      critical: statistics.bySeverity.critical,
      scope
    });
    
    return NextResponse.json({
      success: true,
      data: alerts,
      // 🆕 META: Permisos de navegación RBAC
      meta: {
        canDrillDown,
        scope,
        userRole: userContext.role,
        userDepartmentId: userContext.departmentId
      },
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