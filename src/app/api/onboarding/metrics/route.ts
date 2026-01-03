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
 * - x-user-role (opcional) - Para RBAC
 * - x-department-id (opcional) - Para filtrado jerárquico
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
 * - 🔐 RBAC: Filtrado jerárquico en ORIGEN (servicio)
 * 
 * @version 3.3.0 - RBAC LIMPIO: Filtrado en OnboardingAggregationService
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OnboardingAggregationService } from '@/lib/services/OnboardingAggregationService';
import { serializeBigInt } from '@/lib/utils/bigint-serializer';
import { 
  extractUserContext,
  getChildDepartmentIds
} from '@/lib/services/AuthorizationService';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🆕 LENTE 3: MÉTRICAS EN VIVO (ESTADO ACTUAL - TIEMPO REAL)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Calcula el ESTADO ACTUAL de TODOS los journeys de onboarding.
 * No filtra por fecha de creación - muestra snapshot del momento presente.
 * Aplica filtrado jerárquico según rol del usuario.
 * 
 * DIFERENCIA vs LENTE 1 (Monthly):
 * - LENTE 1: Datos históricos de un mes cerrado (calculados por CRON)
 * - LENTE 3: Estado actual en tiempo real de journeys en curso
 * 
 * @param userContext - Contexto del usuario autenticado
 * @param allowedDepartmentIds - IDs permitidos para AREA_MANAGER (null = todos)
 * @returns Métricas actuales con flag isPartial: true
 */
async function calculateLiveMetrics(
  userContext: {
    accountId: string;
    role: string | null;
    departmentId: string | null;
  },
  allowedDepartmentIds: string[] | null
): Promise<{
  period: string;
  avgEXOScore: number | null;
  totalJourneys: number;
  activeJourneys: number;
  completedJourneys: number;
  atRiskJourneys: number;
  criticalAlerts: number;
  daysElapsed: number;
  daysInMonth: number;
  isPartial: true;
}> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Rango: Día 1 del mes actual → HOY
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // Último día del mes
  
  console.log(`[calculateLiveMetrics] Calculando estado actual de journeys (período referencia: ${year}-${String(month + 1).padStart(2, '0')})`);
  
  // ✅ CRÍTICO: Construir filtros para JourneyOrchestration (tiene accountId directo)
  const whereClause: any = {
    accountId: userContext.accountId  // Multi-tenant SIEMPRE
  };
  
  // Roles globales (ven toda la empresa)
  const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR', 'CEO'];
  
  // 🔐 RBAC: Usar allowedDepartmentIds pre-calculado
  if (allowedDepartmentIds) {
    whereClause.departmentId = { in: allowedDepartmentIds };
    
    console.log('[calculateLiveMetrics] Filtrado jerárquico aplicado:', {
      role: userContext.role,
      totalDepartments: allowedDepartmentIds.length
    });
  } else {
    console.log('[calculateLiveMetrics] Acceso global:', {
      role: userContext.role,
      accountId: userContext.accountId
    });
  }
  
  // Query TODOS los journeys actuales (sin filtro de fecha ni status)
  // LÓGICA: El lente "LIVE" muestra el ESTADO ACTUAL de TODOS los onboardings
  const journeys = await prisma.journeyOrchestration.findMany({
    where: whereClause,  // Solo filtros de seguridad (accountId + departmentId)
    select: {
      id: true,
      exoScore: true,
      retentionRisk: true,
      status: true,
      currentStage: true
    }
  });
  
  // Query alertas críticas activas de TODOS los journeys actuales
  const alertsWhereClause: any = {
    journey: {
      accountId: userContext.accountId  // Multi-tenant
    },
    status: { in: ['pending', 'acknowledged'] },
    severity: 'critical'
  };
  
  // 🔐 RBAC: Filtro jerárquico en alertas
  if (allowedDepartmentIds) {
    alertsWhereClause.journey.departmentId = { in: allowedDepartmentIds };
  }
  
  const alerts = await prisma.journeyAlert.findMany({
    where: alertsWhereClause,
    select: { id: true }
  });
  
  // Cálculos
  const validScores = journeys.filter(j => j.exoScore !== null);
  const avgEXOScore = validScores.length > 0
    ? parseFloat(
        (validScores.reduce((sum, j) => sum + j.exoScore!, 0) / validScores.length)
        .toFixed(1)
      )
    : null;
  
  const period = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  const result = {
    period,
    avgEXOScore,
    totalJourneys: journeys.length,
    activeJourneys: journeys.filter(j => j.status === 'active').length,
    completedJourneys: journeys.filter(j => j.status === 'completed').length,
    atRiskJourneys: journeys.filter(j => 
      j.retentionRisk === 'high' || j.retentionRisk === 'critical'
    ).length,
    criticalAlerts: alerts.length,
    daysElapsed: now.getDate(),
    daysInMonth: monthEnd.getDate(),
    isPartial: true as const  // ← Flag explícito: dato incompleto
  };
  
  console.log('[calculateLiveMetrics] Resultado:', result);
  
  return result;
}

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
    // 🆕 1B. EXTRAER CONTEXTO DE USUARIO (PARA FILTRADO JERÁRQUICO)
    // ========================================================================
    const userContext = extractUserContext(request);
    
    console.log('[API GET /onboarding/metrics] Contexto usuario:', {
      accountId: userContext.accountId,
      role: userContext.role,
      departmentId: userContext.departmentId
    });
    
    // ========================================================================
    // 🔐 1C. CALCULAR DEPARTAMENTOS PERMITIDOS (UNA VEZ)
    // Según GUÍA MAESTRA RBAC Sección 3.2 - Matriz de Acceso por Rol
    // ========================================================================
    let allowedDepartmentIds: string[] | null = null;
    
    // Roles con acceso global (ven toda la empresa)
    const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO'];
    
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      // AREA_MANAGER: Solo ve su departamento + hijos (CTE recursivo)
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      allowedDepartmentIds = [userContext.departmentId, ...childIds];
      
      console.log('[API GET /onboarding/metrics] 🔐 Filtrado jerárquico calculado:', {
        role: 'AREA_MANAGER',
        baseDepartment: userContext.departmentId,
        childDepartments: childIds.length,
        totalAllowed: allowedDepartmentIds.length
      });
    } else if (globalRoles.includes(userContext.role || '')) {
      // Roles globales: null significa "todos los departamentos"
      console.log('[API GET /onboarding/metrics] ✅ Acceso global:', {
        role: userContext.role
      });
    } else {
      // Rol desconocido: log warning pero continuar (backward compatible)
      console.warn('[API GET /onboarding/metrics] ⚠️ Rol sin definición explícita:', {
        role: userContext.role,
        departmentId: userContext.departmentId
      });
    }
    
    // 🔐 Preparar options para el servicio (LIMPIO - sin workaround)
    const filterOptions = { allowedDepartmentIds };
    
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
    // 3. SI ES DEPARTAMENTO ESPECÍFICO: FLUJO ORIGINAL (CON VALIDACIÓN RBAC)
    // ========================================================================
    if (departmentId) {
      // 🔐 Validar que AREA_MANAGER puede ver este departamento
      if (allowedDepartmentIds && !allowedDepartmentIds.includes(departmentId)) {
        console.warn('[API GET /onboarding/metrics] 🚫 Acceso denegado:', {
          role: userContext.role,
          requestedDepartment: departmentId,
          allowedCount: allowedDepartmentIds.length
        });
        return NextResponse.json(
          { 
            error: 'Acceso denegado - No tiene permisos para este departamento', 
            success: false 
          },
          { status: 403 }
        );
      }
      
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
              standardCategory: true,
              level: true,
              parentId: true,
              unitType: true,
              parent: {
                select: {
                  id: true,
                  displayName: true,
                  level: true
                }
              }
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
      
      return NextResponse.json(
        serializeBigInt({
          data: metrics[0],
          success: true
        })
      );
    }
    
    // ========================================================================
    // 4. 🚀 CONSULTA GLOBAL OPTIMIZADA: TODAS LAS QUERIES EN PARALELO
    // ========================================================================
    console.log('[API GET /onboarding/metrics] Generando agregaciones globales...');
    
    // 🚀 OPTIMIZACIÓN: Todas las queries en un solo Promise.all
    // 🔐 LIMPIO: Servicio filtra directamente con filterOptions
    const [
      globalMetrics,
      topDepartments,
      bottomDepartments,
      insights,
      demographics,
      departments,
      complianceEfficiency,
      liveMetrics,
      accumulatedDepartments
    ] = await Promise.all([
      // 🔐 LIMPIO: Pasar filterOptions al servicio
      OnboardingAggregationService.getGlobalMetrics(accountId, period || undefined, filterOptions),
      OnboardingAggregationService.getTopDepartments(accountId, period || undefined, filterOptions),
      OnboardingAggregationService.getBottomDepartments(accountId, period || undefined, filterOptions),
      OnboardingAggregationService.getGlobalInsights(accountId, period || undefined, filterOptions),
      OnboardingAggregationService.getGlobalDemographics(accountId, period || undefined, filterOptions),
      // Query directa con filtro RBAC
      prisma.departmentOnboardingInsight.findMany({
        where: { 
          accountId,
          ...(allowedDepartmentIds && { departmentId: { in: allowedDepartmentIds } })
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          department: {
            select: {
              id: true,
              displayName: true,
              standardCategory: true,
              level: true,
              parentId: true,
              unitType: true,
              parent: {
                select: {
                  id: true,
                  displayName: true,
                  level: true
                }
              }
            }
          }
        },
        take: 20
      }),
      OnboardingAggregationService.getComplianceEfficiency(accountId, undefined, filterOptions),
      calculateLiveMetrics(userContext, allowedDepartmentIds),
      // Query acumulado con filtro RBAC
      prisma.department.findMany({
        where: { 
          accountId,
          accumulatedExoScore: { not: null },
          ...(allowedDepartmentIds && { id: { in: allowedDepartmentIds } })
        },
        select: {
          id: true,
          displayName: true,
          standardCategory: true,
          accumulatedExoScore: true,
          accumulatedExoJourneys: true,
          accumulatedPeriodCount: true,
          accumulatedLastUpdated: true,
          level: true,
          parentId: true,
          unitType: true
        },
        orderBy: {
          accumulatedExoScore: 'desc'
        }
      })
    ]);
    
    // ========================================================================
    // 4B. CALCULAR MÉTRICAS ACUMULADAS (en memoria - rápido)
    // ========================================================================
    
    // Calcular EXO global ponderado
    const totalWeightedScore = accumulatedDepartments.reduce(
      (sum, dept) => sum + (dept.accumulatedExoScore! * dept.accumulatedExoJourneys!),
      0
    );
    const totalJourneys = accumulatedDepartments.reduce(
      (sum, dept) => sum + dept.accumulatedExoJourneys!,
      0
    );
    const globalAccumulatedExoScore = totalJourneys > 0
      ? parseFloat((totalWeightedScore / totalJourneys).toFixed(1))
      : null;
    
    // Máximo de períodos disponibles
    const maxPeriodCount = accumulatedDepartments.reduce(
      (max, d) => Math.max(max, d.accumulatedPeriodCount || 0),
      0
    );
    
    console.log('[API GET /onboarding/metrics] Acumulado calculado:', {
      globalScore: globalAccumulatedExoScore,
      totalJourneys,
      maxPeriods: maxPeriodCount,
      departmentsWithData: accumulatedDepartments.length
    });

    // ========================================================================
    // 4C. CALCULAR BALANCE DEPARTAMENTAL (Quién impulsa / Quién frena)
    // ========================================================================
    let departmentImpact = null;

    if (accumulatedDepartments.length > 0 && globalAccumulatedExoScore !== null && totalJourneys > 0) {
      // Calcular contribución de cada departamento al promedio global
      const departmentsWithContribution = accumulatedDepartments.map(dept => {
        const deptScore = dept.accumulatedExoScore || 0;
        const deptJourneys = dept.accumulatedExoJourneys || 0;
        
        // Fórmula: (score_dept - score_global) × (journeys_dept / total_journeys)
        const contribution = (deptScore - globalAccumulatedExoScore) * (deptJourneys / totalJourneys);
        
        return {
          departmentId: dept.id,
          departmentName: dept.displayName,
          score: deptScore,
          journeys: deptJourneys,
          contribution: parseFloat(contribution.toFixed(2))
        };
      });
      
      // Ordenar por contribución (mayor a menor)
      departmentsWithContribution.sort((a, b) => b.contribution - a.contribution);
      
      // Top influencer (mayor impulso positivo)
      const topInfluencer = departmentsWithContribution[0];
      
      // Bottom impact (mayor arrastre negativo)
      const bottomImpact = departmentsWithContribution[departmentsWithContribution.length - 1];
      
      departmentImpact = {
        topInfluencer: {
          departmentId: topInfluencer.departmentId,
          departmentName: topInfluencer.departmentName,
          score: topInfluencer.score,
          journeys: topInfluencer.journeys,
          contribution: topInfluencer.contribution
        },
        bottomImpact: {
          departmentId: bottomImpact.departmentId,
          departmentName: bottomImpact.departmentName,
          score: bottomImpact.score,
          journeys: bottomImpact.journeys,
          contribution: bottomImpact.contribution
        }
      };
      
      console.log('[API GET /onboarding/metrics] Balance departamental calculado:', {
        topInfluencer: topInfluencer.departmentName,
        topContribution: topInfluencer.contribution,
        bottomImpact: bottomImpact.departmentName,
        bottomContribution: bottomImpact.contribution
      });
    }

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
    // 6. FORMATEAR RESPUESTA CON 3 LENTES
    // ========================================================================
    const data = {
      // LENTE 1: PULSO MENSUAL (ya filtrado por servicio)
      global: globalMetrics,
      topDepartments,      // ✅ LIMPIO: Ya viene filtrado del servicio
      bottomDepartments,   // ✅ LIMPIO: Ya viene filtrado del servicio
      insights,
      demographics,
      departments,
      
      // LENTE 2: ACUMULADO ESTRATÉGICO 12 MESES
      accumulated: {
        globalExoScore: globalAccumulatedExoScore,
        totalJourneys: totalJourneys,
        periodCount: maxPeriodCount,
        lastUpdated: accumulatedDepartments[0]?.accumulatedLastUpdated || null,
        departments: accumulatedDepartments,
        departmentImpact: departmentImpact
      },
      
      // LENTE 3: EN VIVO
      live: liveMetrics,
      
      complianceEfficiency
    };
    
    const duration = Date.now() - startTime;
    
    console.log(`[API GET /onboarding/metrics] ✅ Success - ${duration}ms`, {
      rbac: {
        role: userContext.role,
        filteredByDepartment: !!allowedDepartmentIds,
        allowedDepartments: allowedDepartmentIds?.length || 'ALL'
      },
      globalMetrics: !!globalMetrics.avgEXOScore,
      topDepartments: topDepartments.length,
      bottomDepartments: bottomDepartments.length,
      insights: insights.topIssues.length,
      demographics: {
        generations: demographics.byGeneration.length,
        genders: demographics.byGender.length,
        seniority: demographics.bySeniority.length
      },
      departmentsArray: departments.length,
      accumulated: {
        globalScore: globalAccumulatedExoScore,
        departmentsWithData: accumulatedDepartments.length,
        hasImpactData: !!departmentImpact
      },
      live: {
        period: liveMetrics.period,
        avgEXOScore: liveMetrics.avgEXOScore,
        totalJourneys: liveMetrics.totalJourneys,
        daysElapsed: liveMetrics.daysElapsed,
        isPartial: liveMetrics.isPartial
      }
    });
    
    return NextResponse.json(
      serializeBigInt({
        data,
        success: true
      })
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[API GET /onboarding/metrics] ❌ Error:', error);

    return NextResponse.json(
      serializeBigInt({
        error: 'Error al obtener métricas de onboarding',
        details: error instanceof Error ? error.message : 'Error desconocido',
        success: false
      }),
      { status: 500 }
    );
  }
}