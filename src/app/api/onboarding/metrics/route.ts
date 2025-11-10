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
 * 
 * RESPONSE:
 * {
 *   data: DepartmentOnboardingInsight | DepartmentOnboardingInsight[],
 *   success: boolean,
 *   message?: string
 * }
 * 
 * CASOS DE USO:
 * 1. Dashboard Torre Control: GET /metrics (todos los departamentos)
 * 2. Vista Departamental: GET /metrics?departmentId=xxx (específico)
 * 
 * ARQUITECTURA:
 * - NO calcula métricas (las lee de BD)
 * - Ordenadas por updatedAt DESC (más recientes primero)
 * - Incluye relación department (displayName, standardCategory)
 * - Multi-tenant isolation por accountId
 * 
 * @version 3.2.4
 * @date November 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    
    console.log('[API GET /onboarding/metrics] Params:', {
      departmentId: departmentId || 'ALL'
    });
    
    // ========================================================================
    // 3. CONSTRUIR WHERE CLAUSE (Multi-tenant + Filtro opcional)
    // ========================================================================
    const whereClause: any = {
      accountId  // CRÍTICO: Multi-tenant isolation
    };
    
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    // ========================================================================
    // 4. CONSULTAR MÉTRICAS EN BD
    // ========================================================================
    // Obtener las métricas más recientes por departamento
    // Si departmentId específico: 1 resultado
    // Si general: Top 10 departamentos más recientes
    const metrics = await prisma.departmentOnboardingInsight.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc'  // Más recientes primero
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
      take: departmentId ? 1 : 20  // 1 si específico, 20 si general
    });
    
    console.log(`[API GET /onboarding/metrics] Encontrados ${metrics.length} registros`);
    
    // ========================================================================
    // 5. VALIDAR DATOS ENCONTRADOS
    // ========================================================================
    if (metrics.length === 0) {
      console.log('[API GET /onboarding/metrics] Sin métricas disponibles');
      
      return NextResponse.json(
        {
          data: null,
          message: departmentId 
            ? 'No hay métricas disponibles para este departamento'
            : 'No hay métricas de onboarding calculadas aún',
          success: true
        },
        { status: 200 }
      );
    }
    
    // ========================================================================
    // 6. FORMATEAR RESPUESTA
    // ========================================================================
    // Si es departamento específico, retornar objeto único
    // Si es consulta general, retornar array
    const data = departmentId ? metrics[0] : metrics;
    
    const duration = Date.now() - startTime;
    
    console.log(`[API GET /onboarding/metrics] ✅ Success - ${duration}ms`, {
      recordsReturned: metrics.length,
      isSingleDepartment: !!departmentId
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