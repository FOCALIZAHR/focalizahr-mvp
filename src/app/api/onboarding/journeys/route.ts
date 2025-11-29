// src/app/api/onboarding/journeys/route.ts
// ============================================================================
// API GET /api/onboarding/journeys
// PIPELINE KANBAN PROACTIVO - Onboarding Journey Intelligence
// ============================================================================
//
// IMPLEMENTACIÓN SEGÚN: GUIA_MAESTRA_DESARROLLO_PAGINAS_FILTRADAS_JERARQUICAS.md v3.0
//
// SEGURIDAD:
// ✅ Multi-tenant SIEMPRE (accountId en whereClause)
// ✅ Filtrado jerárquico para AREA_MANAGER (CTE recursivo)
// ✅ Plan B: dataType='results' (datos sensibles de retención)
// ✅ Zero Trust: Validar cada request
//
// RESPONSE:
// ✅ Estructura { success, data, pagination, filters, meta }
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔐 IMPORTAR SERVICIOS DE SEGURIDAD (GUÍA Sección 2.2)
import { 
  extractUserContext, 
  buildParticipantAccessFilter 
} from '@/lib/services/AuthorizationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/onboarding/journeys
 * 
 * Lista journeys de onboarding con:
 * ✅ Seguridad multi-tenant automática
 * ✅ Filtrado jerárquico por rol (AREA_MANAGER ve su gerencia + hijos)
 * ✅ Paginación enterprise (limit=100 para Kanban completo)
 * ✅ Agrupación por currentStage para vista Kanban
 * 
 * Query Params:
 * - page: Página actual (default: 1)
 * - limit: Items por página (default: 100, max: 100)
 * - status: 'active' | 'completed' | 'abandoned'
 * - riskLevel: 'critical' | 'high' | 'medium' | 'low'
 * - departmentId: Filtro por departamento específico
 * - sortBy: Campo para ordenar (default: 'hireDate')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * @see GUIA_MAESTRA_DESARROLLO_PAGINAS_FILTRADAS_JERARQUICAS.md
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [API /onboarding/journeys] Request iniciada');
    
    // ========================================================================
    // 🔐 PASO 1: EXTRAER CONTEXTO DE SEGURIDAD
    // (GUÍA Sección 2.2 - extractUserContext)
    // ========================================================================
    const userContext = extractUserContext(request);
    
    // Validación crítica - NUNCA proceder sin accountId
    if (!userContext.accountId) {
      console.log('❌ [API /onboarding/journeys] Contexto de seguridad faltante');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado - contexto de seguridad faltante',
          meta: { 
            timestamp: new Date().toISOString() 
          }
        },
        { status: 401 }
      );
    }
    
    console.log(`🔐 [API /onboarding/journeys] Contexto extraído:`, {
      accountId: userContext.accountId,
      role: userContext.role || 'N/A',
      departmentId: userContext.departmentId || 'N/A'
    });
    
    // ========================================================================
    // 🔐 PASO 2: CONSTRUIR FILTROS DE SEGURIDAD MULTI-NIVEL
    // (GUÍA Sección 2.2 - buildParticipantAccessFilter)
    // ========================================================================
    
    // 🎯 IMPORTANTE: Journeys son RESULTADOS (datos sensibles de predicción de retención)
    // Por lo tanto usamos dataType: 'results' para activar filtrado jerárquico
    // Plan B de la guía: "Resultados = privados, Participación = transparente"
    const accessFilter = await buildParticipantAccessFilter(
      userContext,
      { dataType: 'results' }  // ← GUÍA Plan B: Resultados son datos sensibles
    );
    
    console.log(`🔐 [API /onboarding/journeys] Filtros de seguridad construidos:`, {
      hasAccountFilter: !!accessFilter.campaign?.accountId || !!accessFilter.accountId,
      hasDepartmentFilter: !!accessFilter.departmentId,
      departmentScope: accessFilter.departmentId?.in?.length || 'global'
    });
    
    // ========================================================================
    // 📊 PASO 3: PARSEAR QUERY PARAMS
    // ========================================================================
    const { searchParams } = new URL(request.url);
    
    // Paginación - limit=100 por defecto para Kanban (ver todas las columnas)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '100')));
    const skip = (page - 1) * limit;
    
    // Filtros opcionales
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const departmentIdFilter = searchParams.get('departmentId');
    const stage = searchParams.get('stage'); // Filtrar por etapa específica
    
    // Ordenamiento
    const sortBy = searchParams.get('sortBy') || 'hireDate';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    console.log(`📊 [API /onboarding/journeys] Query params:`, {
      page, limit, status, riskLevel, departmentIdFilter, stage, sortBy, sortOrder
    });
    
    // ========================================================================
    // 🛡️ PASO 4: CONSTRUIR WHERE CLAUSE CON SEGURIDAD
    // (GUÍA Sección 5.2 - Aplicar filtros de seguridad en TODAS las queries)
    // ========================================================================
    
    // NIVEL 1: Multi-tenant - SIEMPRE APLICADO (GUÍA dice NUNCA omitir)
    const whereClause: any = {
      accountId: userContext.accountId  // ← CRÍTICO: Aislamiento entre empresas
    };
    
    // NIVEL 2: Filtro jerárquico (si AREA_MANAGER y dataType=results)
    // El accessFilter puede contener departmentId con estructura { in: [...] }
    if (accessFilter.departmentId) {
      whereClause.departmentId = accessFilter.departmentId;
      console.log(`🏢 [API /onboarding/journeys] Filtro jerárquico aplicado:`, {
        type: accessFilter.departmentId.in ? 'array' : 'single',
        count: accessFilter.departmentId.in?.length || 1
      });
    }
    
    // Filtros opcionales de query params
    if (status && ['active', 'completed', 'abandoned'].includes(status)) {
      whereClause.status = status;
    }
    
    if (riskLevel && ['critical', 'high', 'medium', 'low'].includes(riskLevel)) {
      whereClause.retentionRisk = riskLevel;
    }
    
    if (stage !== null && stage !== undefined && !isNaN(parseInt(stage))) {
      whereClause.currentStage = parseInt(stage);
    }
    
    // Filtro por departamento específico (adicional al jerárquico)
    if (departmentIdFilter) {
      // Si ya hay filtro jerárquico, verificar que el depto solicitado esté permitido
      if (whereClause.departmentId?.in) {
        if (whereClause.departmentId.in.includes(departmentIdFilter)) {
          // OK - el departamento está dentro de su scope permitido
          whereClause.departmentId = departmentIdFilter;
        }
        // Si no está permitido, mantener filtro original (seguridad)
      } else if (!whereClause.departmentId) {
        // No hay filtro jerárquico, aplicar el solicitado
        whereClause.departmentId = departmentIdFilter;
      }
    }
    
    console.log(`🔍 [API /onboarding/journeys] WHERE clause final:`, 
      JSON.stringify(whereClause, null, 2)
    );
    
    // ========================================================================
    // 📊 PASO 5: QUERY PRISMA CON SEGURIDAD
    // ========================================================================
    
    // Construir orderBy dinámico
    const orderByClause: any[] = [
      { currentStage: 'asc' }  // Primero por etapa (para Kanban)
    ];
    
    // Agregar ordenamiento secundario
    if (sortBy === 'hireDate') {
      orderByClause.push({ hireDate: sortOrder });
    } else if (sortBy === 'exoScore') {
      orderByClause.push({ exoScore: sortOrder });
    } else if (sortBy === 'createdAt') {
      orderByClause.push({ createdAt: sortOrder });
    } else {
      orderByClause.push({ hireDate: 'desc' }); // Default
    }
    
    const [journeys, total] = await Promise.all([
      prisma.journeyOrchestration.findMany({
        where: whereClause,
        include: {
          // Departamento con Gold Cache
          department: {
            select: {
              id: true,
              displayName: true,
              standardCategory: true,
              accumulatedExoScore: true  // 🆕 Gold Cache para contexto benchmark
            }
          },
          // Alertas activas (top 3 por severidad)
          alerts: {
            where: {
              status: { in: ['open', 'acknowledged'] }
            },
            orderBy: { severity: 'desc' },
            take: 3,
            select: {
              id: true,
              alertType: true,
              severity: true,
              description: true,
              status: true,
              createdAt: true
            }
          },
          // Relaciones a Participants para verificar estado de respuestas
          stage1Participant: {
            select: {
              id: true,
              hasResponded: true,
              responseDate: true
            }
          },
          stage2Participant: {
            select: {
              id: true,
              hasResponded: true,
              responseDate: true
            }
          },
          stage3Participant: {
            select: {
              id: true,
              hasResponded: true,
              responseDate: true
            }
          },
          stage4Participant: {
            select: {
              id: true,
              hasResponded: true,
              responseDate: true
            }
          }
        },
        orderBy: orderByClause,
        skip,
        take: limit
      }),
      
      // Count total para paginación
      prisma.journeyOrchestration.count({ where: whereClause })
    ]);
    
    const duration = Date.now() - startTime;
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ [API /onboarding/journeys] Query exitosa en ${duration}ms`);
    console.log(`📊 [API /onboarding/journeys] Resultados: ${journeys.length}/${total} total`);
    
    // ========================================================================
    // 📈 PASO 6: CALCULAR ESTADÍSTICAS POR STAGE (Para Kanban)
    // ========================================================================
    const stageStats = {
      stage0: journeys.filter(j => j.currentStage === 0).length,
      stage1: journeys.filter(j => j.currentStage === 1).length,
      stage2: journeys.filter(j => j.currentStage === 2).length,
      stage3: journeys.filter(j => j.currentStage === 3).length,
      stage4: journeys.filter(j => j.currentStage === 4).length
    };
    
    const riskStats = {
      critical: journeys.filter(j => j.retentionRisk === 'critical').length,
      high: journeys.filter(j => j.retentionRisk === 'high').length,
      medium: journeys.filter(j => j.retentionRisk === 'medium').length,
      low: journeys.filter(j => j.retentionRisk === 'low').length,
      pending: journeys.filter(j => !j.retentionRisk || j.retentionRisk === 'pending').length
    };
    
    // ========================================================================
    // ✅ PASO 7: RESPONSE ESTRUCTURADO
    // (GUÍA Sección 5.2 - Response { success, data, meta })
    // ========================================================================
    return NextResponse.json({
      success: true,
      
      // Data principal - Journeys con relaciones
      data: journeys,
      
      // Estadísticas para Kanban
      stats: {
        byStage: stageStats,
        byRisk: riskStats,
        totalActive: journeys.filter(j => j.status === 'active').length,
        totalCompleted: journeys.filter(j => j.status === 'completed').length,
        totalAbandoned: journeys.filter(j => j.status === 'abandoned').length
      },
      
      // Paginación
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      
      // Filtros aplicados (para UI)
      filters: {
        status: status || null,
        riskLevel: riskLevel || null,
        departmentId: departmentIdFilter || null,
        stage: stage ? parseInt(stage) : null
      },
      
      // 🆕 Meta (GUÍA requiere esto para debugging y auditoría)
      meta: {
        accountId: userContext.accountId,
        userRole: userContext.role,
        hierarchyFiltered: !!accessFilter.departmentId,
        accessibleDepartments: accessFilter.departmentId?.in?.length || 'all',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        version: 'v1.0.0'
      }
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [API /onboarding/journeys] Error después de ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error obteniendo journeys de onboarding',
        meta: {
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`
        }
      },
      { status: 500 }
    );
  }
}