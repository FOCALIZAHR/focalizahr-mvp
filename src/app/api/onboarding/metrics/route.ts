export const dynamic = 'force-dynamic';
/**
 * ============================================
 * API GET /api/onboarding/metrics
 * FASE 6A - Onboarding Journey Intelligence
 * ============================================
 * 
 * PROPÓSITO:
 * Endpoint de consulta (READ-ONLY) para métricas de onboarding
 * ya calculadas por OnboardingAggregationService en FASE 4.
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware:
 * - x-account-id (obligatorio) - Multi-tenant isolation
 * - x-user-role (opcional) - Para RBAC futuro
 * 
 * QUERY PARAMS:
 * - departmentId (opcional): Filtrar por departamento específico
 * - period (opcional): Período YYYY-MM (default: mes actual)
 * 
 * RESPONSE:
 * {
 *   data: DepartmentOnboardingInsight | OnboardingDashboardData,
 *   success: boolean,
 *   message?: string
 * }
 * 
 * CASOS DE USO:
 * 1. Dashboard Torre Control: GET /metrics (agregaciones globales)
 * 2. Vista Departamental: GET /metrics?departmentId=xxx (específico)
 * 
 * ARQUITECTURA:
 * - NO calcula métricas (las lee de BD)
 * - Ordenadas por updatedAt DESC (más recientes primero)
 * - Incluye relación department (displayName, standardCategory)
 * - Multi-tenant isolation por accountId
 * 
 * @version 3.2.5
 * @date November 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OnboardingAggregationService } from '@/lib/services/OnboardingAggregationService';

/**
 * GET /api/onboarding/metrics
 * 
 * Lee métricas de onboarding desde DepartmentOnboardingInsight
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[API GET /onboarding/metrics] Request iniciada');
    
    // ========================================================================
    // 1. AUTENTICACIÓN (Middleware valida, nosotros extraemos)
    // ========================================================================
    const accountId = request.headers.get('x-account-id');
    
    if (!accountId) {
      console.error('[API GET /onboarding/metrics] Header x-account-id faltante');
      return NextResponse.json(
        { 
          error: 'No autorizado - Sesión inválida',
          success: false 
        },
        { status: 401 }
      );
    }
    
    console.log(`[API GET /onboarding/metrics] AccountId: ${accountId}`);
    
    // ========================================================================
    // 2. EXTRAER QUERY PARAMS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const period = searchParams.get('period');
    
    console.log('[API GET /onboarding/metrics] Params:', {
      departmentId: departmentId || 'ALL',
      period: period || 'CURRENT'
    });
    
    // ========================================================================
    // 3. SI ES DEPARTAMENTO ESPECÍFICO: FLUJO ORIGINAL (SIN CAMBIOS)
    // ========================================================================
    if (departmentId) {
      const whereClause: any = {
        accountId,
        departmentId
      };
      
      const metrics = await prisma.departmentOnboardingInsight.findMany({
        where: whereClause,
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          department: {
            select: {
              id: true,
              displayName: true,
              standardCategory: true
            }
          }
        },
        take: 1
      });
      
      if (metrics.length === 0) {
        return NextResponse.json(
          {
            data: null,
            message: 'No hay métricas disponibles para este departamento',
            success: true
          },
          { status: 200 }
        );
      }
      
      const duration = Date.now() - startTime;
      console.log(`[API GET /onboarding/metrics] ✅ Success - ${duration}ms (departamento específico)`);
      
      return NextResponse.json({
        data: metrics[0],
        success: true
      });
    }
    
    // ========================================================================
    // 4. CONSULTA GLOBAL: USAR AGREGACIONES DEL SERVICE
    // ========================================================================
    console.log('[API GET /onboarding/metrics] Generando agregaciones globales...');
    
    // Llamar a los 5 métodos del service en paralelo
    const [
      globalMetrics,
      topDepartments,
      bottomDepartments,
      insights,
      demographics,
      departments
    ] = await Promise.all([
      OnboardingAggregationService.getGlobalMetrics(accountId, period || undefined),
      OnboardingAggregationService.getTopDepartments(accountId, period || undefined),
      OnboardingAggregationService.getBottomDepartments(accountId, period || undefined),
      OnboardingAggregationService.getGlobalInsights(accountId, period || undefined),
      OnboardingAggregationService.getGlobalDemographics(accountId, period || undefined),
      // Mantener array original para backward compatibility
      prisma.departmentOnboardingInsight.findMany({
        where: { accountId },
        orderBy: { updatedAt: 'desc' },
        include: {
          department: {
            select: {
              id: true,
              displayName: true,
              standardCategory: true
            }
          }
        },
        take: 20
      })
    ]);
    
    // ========================================================================
    // 5. VALIDAR DATOS ENCONTRADOS
    // ========================================================================
    if (departments.length === 0) {
      console.log('[API GET /onboarding/metrics] Sin métricas disponibles');
      
      return NextResponse.json(
        {
          data: null,
          message: 'No hay métricas de onboarding calculadas aún',
          success: true
        },
        { status: 200 }
      );
    }
    
    // ========================================================================
    // 6. FORMATEAR RESPUESTA AGREGADA
    // ========================================================================
    const data = {
      global: globalMetrics,
      topDepartments,
      bottomDepartments,
      insights,
      demographics,
      departments // Array original para drill-down futuro
    };
    
    const duration = Date.now() - startTime;
    
    console.log(`[API GET /onboarding/metrics] ✅ Success - ${duration}ms`, {
      globalMetrics: !!globalMetrics.avgEXOScore,
      topDepartments: topDepartments.length,
      bottomDepartments: bottomDepartments.length,
      insights: insights.topIssues.length,
      demographics: {
        generations: demographics.byGeneration.length,
        genders: demographics.byGender.length,
        seniority: demographics.bySeniority.length
      },
      departmentsArray: departments.length
    });
    
    return NextResponse.json({
      data,
      success: true
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[API GET /onboarding/metrics] ❌ Error:', error);
    
    return NextResponse.json(
      {
        error: 'Error al obtener métricas de onboarding',
        details: error instanceof Error ? error.message : 'Error desconocido',
        success: false
      },
      { status: 500 }
    );
  }
}