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
 * 
 * RESPONSE:
 * Si departmentId + period:
 *   → Retorna DepartmentExitInsight (LENTE 1)
 * Si solo departmentId:
 *   → Retorna Gold Cache del departamento (LENTE 2)
 * Si ninguno:
 *   → Retorna vista general con todos los departamentos + alertas
 * 
 * @version 1.0
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  buildParticipantAccessFilter,
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';


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
    
    console.log('[Exit Metrics] Params:', { departmentId, period, userRole: userContext.role });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: FILTRADO JERÁRQUICO
    // ════════════════════════════════════════════════════════════════════════
    
    let accessibleDepartmentIds: string[] | null = null;
    
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
          accumulatedConservationIndex: true
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
    // CASO 3: Vista general → Todos los departamentos + alertas
    // ════════════════════════════════════════════════════════════════════════
    
    const departmentWhere: any = {
      accountId: userContext.accountId,
      isActive: true,
      accumulatedEISScore: { not: null }
    };
    
    // Aplicar filtrado jerárquico si corresponde
    if (accessibleDepartmentIds) {
      departmentWhere.id = { in: accessibleDepartmentIds };
    }
    
    const [departments, pendingAlerts, criticalAlerts, totalExits] = await Promise.all([
      // Departamentos con Gold Cache
      prisma.department.findMany({
        where: departmentWhere,
        select: {
          id: true,
          displayName: true,
          standardCategory: true,
          accumulatedEISScore: true,
          accumulatedExitCount: true,
          accumulatedConservationIndex: true
        },
        orderBy: { accumulatedEISScore: 'asc' } // Peores primero
      }),
      
      // Alertas pendientes
      prisma.exitAlert.count({
        where: {
          accountId: userContext.accountId,
          status: 'pending',
          ...(accessibleDepartmentIds ? { departmentId: { in: accessibleDepartmentIds } } : {})
        }
      }),
      
      // Alertas críticas
      prisma.exitAlert.count({
        where: {
          accountId: userContext.accountId,
          status: 'pending',
          severity: 'critical',
          ...(accessibleDepartmentIds ? { departmentId: { in: accessibleDepartmentIds } } : {})
        }
      }),
      
      // Total exits últimos 12 meses
      prisma.exitRecord.count({
        where: {
          accountId: userContext.accountId,
          exitDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          },
          ...(accessibleDepartmentIds ? { departmentId: { in: accessibleDepartmentIds } } : {})
        }
      })
    ]);
    
    // Calcular métricas globales
    const departmentsWithData = departments.filter(d => d.accumulatedEISScore !== null);
    const globalAvgEIS = departmentsWithData.length > 0
      ? departmentsWithData.reduce((a, d) => a + (d.accumulatedEISScore || 0), 0) / departmentsWithData.length
      : null;
    
    return NextResponse.json({
      success: true,
      data: {
        departments,
        summary: {
          totalDepartments: departments.length,
          totalExits,
          globalAvgEIS: globalAvgEIS !== null ? Math.round(globalAvgEIS * 10) / 10 : null,
          alerts: {
            pending: pendingAlerts,
            critical: criticalAlerts
          }
        }
      },
      source: 'GLOBAL',
      responseTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Exit Metrics] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}