/**
 * API GET /api/exit/metrics
 * 
 * PROPÓSITO:
 * Obtener métricas Exit Intelligence para dashboard
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio)
 * - x-user-role (para RBAC)
 * - x-department-id (para filtrado jerárquico)
 * 
 * QUERY PARAMS:
 * - departmentId: string (opcional) - Filtrar por departamento específico
 * - period: string (opcional) - Período formato "YYYY-MM" (default: mes actual)
 * - scope: string (opcional) - 'company' | 'filtered' (default: 'filtered')
 *   · 'company': Rankings comparativos (AREA_MANAGER ve todas las gerencias)
 *   · 'filtered': Vista filtrada (AREA_MANAGER ve solo su área + hijos)
 * 
 * RESPONSE:
 * Si departmentId + period:
 *   → Retorna DepartmentExitInsight (LENTE 1)
 * Si solo departmentId:
 *   → Retorna Gold Cache del departamento (LENTE 2)
 * Si ninguno:
 *   → Retorna vista general con meta RBAC + todos los departamentos + alertas
 * 
 * SEGURIDAD:
 * - Rankings (scope='company'): Números agregados visibles para comparación
 * - Detalle específico: Solo departamentos dentro de jerarquía (ambos scopes)
 * - meta.canDrillDown: IDs donde usuario puede hacer drill-down
 * 
 * @version 2.0 - RBAC Scope Implementation
 * @date January 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  buildParticipantAccessFilter,
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';
import { ExitAggregationService } from '@/lib/services/ExitAggregationService';


// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📊 [Exit Metrics] Request iniciada');
    
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
    const departmentId = searchParams.get('departmentId');
    const period = searchParams.get('period'); // "2025-12"
    const scope = searchParams.get('scope') || 'filtered'; // 'company' | 'filtered'
    
    console.log('[Exit Metrics] Params:', { departmentId, period, scope, userRole: userContext.role });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: FILTRADO JERÁRQUICO CON SCOPE
    // ════════════════════════════════════════════════════════════════════════
    
    let accessibleDepartmentIds: string[] | null = null;
    let canDrillDown: string[] = []; // IDs donde usuario puede hacer drill-down
    
    // Si el usuario es AREA_MANAGER, aplicar filtrado según scope
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      
      // Calcular jerarquía SIEMPRE (para validaciones y canDrillDown)
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      canDrillDown = [userContext.departmentId, ...childIds];
      
      // 🆕 SCOPE CHECK: Determinar si aplicar filtro en queries masivas
      if (scope === 'company') {
        console.log('[Exit Metrics] 🌐 Scope "company": Rankings sin filtro (ve todas las gerencias)');
        // accessibleDepartmentIds = null → queries masivas ven todo
      } else {
        // Scope 'filtered': aplicar filtro jerárquico
        accessibleDepartmentIds = canDrillDown;
        console.log('[Exit Metrics] 🔐 Filtrado jerárquico aplicado:', {
          role: 'AREA_MANAGER',
          baseDepartment: userContext.departmentId,
          allowedCount: accessibleDepartmentIds.length
        });
      }
      
      // 🔒 VALIDACIÓN ACCESO ESPECÍFICO (aplica en AMBOS scopes para seguridad)
      // Rankings públicos SÍ, pero detalle de departamento específico solo si está en su jerarquía
      if (departmentId && !canDrillDown.includes(departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Acceso denegado a este departamento' },
          { status: 403 }
        );
      }
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // CASO 1: departmentId + period → LENTE 1 específico
    // ════════════════════════════════════════════════════════════════════════
    
    if (departmentId && period) {
      const insight = await prisma.departmentExitInsight.findFirst({
        where: {
          accountId: userContext.accountId,
          departmentId,
          period,
          periodType: 'monthly'
        },
        include: {
          department: {
            select: {
              id: true,
              displayName: true,
              standardCategory: true
            }
          }
        }
      });
      
      if (!insight) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No hay datos para este período'
        });
      }
      
      return NextResponse.json({
        success: true,
        data: insight,
        source: 'LENTE_1',
        responseTime: Date.now() - startTime
      });
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // CASO 2: solo departmentId → LENTE 2 (Gold Cache)
    // ════════════════════════════════════════════════════════════════════════
    
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          accountId: userContext.accountId
        },
        select: {
          id: true,
          displayName: true,
          standardCategory: true,
          accumulatedEISScore: true,
          accumulatedExitCount: true,
          accumulatedExitPeriodCount: true,
          accumulatedExitLastUpdated: true,
          accumulatedConservationIndex: true,
          accumulatedExitTopFactors: true,
          accumulatedExitENPS: true,
          accumulatedExitVoluntaryRate: true
        }
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, error: 'Departamento no encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: department,
        source: 'LENTE_2',
        responseTime: Date.now() - startTime
      });
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // CASO 3: Vista general
    // ════════════════════════════════════════════════════════════════════════

    const options = accessibleDepartmentIds 
      ? { allowedDepartmentIds: accessibleDepartmentIds }
      : undefined;

    const [departments, summary] = await Promise.all([
      ExitAggregationService.getDepartmentRanking(userContext.accountId, options),
      ExitAggregationService.getGlobalMetrics(userContext.accountId, options)
    ]);

    return NextResponse.json({
      success: true,
      data: { 
        departments, 
        summary,
        source: 'GLOBAL',
        responseTime: Date.now() - startTime
      }
    });
    
  } catch (error: any) {
    console.error('[Exit Metrics] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}