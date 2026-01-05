/**
 * ONBOARDING AGGREGATION SERVICE - PERIOD-CENTRIC
 * 
 * ARQUITECTURA:
 * - Agrega por PERÍODO TEMPORAL (no por campaignId individual)
 * - Calcula métricas departamentales consolidadas
 * - Compara períodos (no campañas)
 * - Incluye métricas demográficas completas (edad, antigüedad, género)
 * 
 * PILAR 3: Sistema separado de AggregationService legado
 * PILAR 4: NO duplica lógica, usa utilities compartidas
 * 
 * @version 3.2.5
 * @date November 2025
 */

import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// ============================================================================
// CONSTANTES ONBOARDING DEADLINES
// ============================================================================

/**
 * Deadlines por etapa de onboarding (días desde hireDate)
 * Etapa 1 (Día 1) debe responderse antes del día 7
 * Etapa 2 (Día 7) debe responderse antes del día 30
 * etc.
 */
const STAGE_DEADLINES: Record<number, number> = {
  1: 8,    // D1 enviado día 1 + 7 = deadline día 8
  2: 14,   // D7 enviado día 7 + 7 = deadline día 14
  3: 37,   // D30 enviado día 30 + 7 = deadline día 37
  4: 97    // D90 enviado día 90 + 7 = deadline día 97
};

// ============================================================================
// 🔐 RBAC OPTIONS - Filtrado Jerárquico (v3.3.0)
// ============================================================================

/**
 * Opciones para filtrado jerárquico RBAC
 * Si allowedDepartmentIds es null/undefined = sin filtro (acceso global)
 * Si tiene valores = filtrar solo esos departamentos
 */
export interface AggregationFilterOptions {
  allowedDepartmentIds?: string[] | null;
}


// ============================================================================
// TYPES
// ============================================================================

interface PeriodMetrics {
  // Período
  period: string;          // Formato: 'yyyy-MM' (ej: '2025-11')
  periodStart: Date;
  periodEnd: Date;
  
  // Contadores (5)
  totalJourneys: number;
  activeJourneys: number;
  completedJourneys: number;
  atRiskJourneys: number;
  abandonedJourneys: number;
  
  // Scores 4C (5)
  avgComplianceScore: number | null;
  avgClarificationScore: number | null;
  avgCultureScore: number | null;
  avgConnectionScore: number | null;
  avgEXOScore: number | null;
  exoScoreTrend: number | null;  // Tendencia vs período anterior
  
  // Alertas (3)
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  
  // Demografía (3 - v3.2.4)
  avgAge: number | null;
  avgSeniority: number | null;
  genderDistribution: Record<string, number> | null;
  
  // Análisis (2)
  topIssues: Array<{ issue: string; count: number }> | null;
  recommendations: string[] | null;
}

// ============================================================================
// SERVICE
// ============================================================================

export class OnboardingAggregationService {
  
  /**
   * MÉTODO PRINCIPAL: Calcular métricas por departamento y período
   * 
   * @param accountId - ID de la cuenta
   * @param departmentId - ID del departamento
   * @param periodStart - Inicio del período
   * @param periodEnd - Fin del período
   */
  static async calculateDepartmentMetrics(
    accountId: string,
    departmentId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PeriodMetrics> {
    
    // ========================================================================
    // 1. OBTENER JOURNEYS DEL PERÍODO (con filtro isPermanent)
    // ========================================================================
    const journeys = await prisma.journeyOrchestration.findMany({
      where: {
        accountId,
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        // ✅ CORRECCIÓN PILAR 3 (v3.2.4): Filtrar en BD, NO en memoria
        stage1Participant: {
          campaign: {
            campaignType: {
              isPermanent: true
            }
          }
        }
      },
      include: {
        // Alertas activas
        alerts: {
          where: {
            status: { in: ['pending', 'acknowledged'] }
          }
        },
        // Participant para demografía (stage1 es el principal)
        stage1Participant: {
          select: {
            gender: true,
            dateOfBirth: true,
            hireDate: true
            // ✅ CORRECCIÓN: include limpio, campaign ya filtrado en WHERE
          }
        }
      }
    });
    
    // ========================================================================
    // 2. CALCULAR CONTADORES (5 métricas)
    // ========================================================================
    const totalJourneys = journeys.length;
    const activeJourneys = journeys.filter(j => j.status === 'active').length;
    const completedJourneys = journeys.filter(j => j.status === 'completed').length;
    const atRiskJourneys = journeys.filter(j => 
      j.retentionRisk === 'high' || j.retentionRisk === 'critical'
    ).length;
    const abandonedJourneys = journeys.filter(j => j.status === 'abandoned').length;
    
    // ========================================================================
    // 3. CALCULAR SCORES PROMEDIO (5 métricas)
    // ========================================================================
    const avgComplianceScore = this.calculateAverage(
      journeys.map(j => j.complianceScore)
    );
    const avgClarificationScore = this.calculateAverage(
      journeys.map(j => j.clarificationScore)
    );
    const avgCultureScore = this.calculateAverage(
      journeys.map(j => j.cultureScore)
    );
    const avgConnectionScore = this.calculateAverage(
      journeys.map(j => j.connectionScore)
    );
    const avgEXOScore = this.calculateAverage(
      journeys.map(j => j.exoScore)
    );
    
    // ========================================================================
    // 4. CALCULAR ALERTAS POR SEVERIDAD (3 métricas)
    // ========================================================================
    const allAlerts = journeys.flatMap(j => j.alerts);
    const criticalAlerts = allAlerts.filter(a => a.severity === 'critical').length;
    const highAlerts = allAlerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = allAlerts.filter(a => a.severity === 'medium').length;
    
    // ========================================================================
    // 5. CALCULAR DEMOGRAFÍA (3 métricas - v3.2.4)
    // ========================================================================
    const participants = journeys
      .map(j => j.stage1Participant)
      .filter((p): p is NonNullable<typeof p> => p !== null);
    
    const avgAge = this.calculateAverageAge(
      participants
        .map(p => p.dateOfBirth)
        .filter((d): d is Date => d !== null)
    );
    
    const avgSeniority = this.calculateAverageSeniority(
      participants
        .map(p => p.hireDate)
        .filter((d): d is Date => d !== null)
    );
    
    const genderDistribution = this.calculateGenderDistribution(
      participants.map(p => p.gender)
    );
    
    // ========================================================================
    // 6. IDENTIFICAR TOP ISSUES (análisis)
    // ========================================================================
    const topIssues = this.identifyTopIssues(allAlerts);
    
    // ========================================================================
    // 7. GENERAR RECOMENDACIONES (análisis)
    // ========================================================================
    const recommendations = this.generateRecommendations({
      totalJourneys,
      atRiskJourneys,
      avgEXOScore,
      criticalAlerts
    });
    
    // ========================================================================
    // 8. RETORNAR MÉTRICAS CONSOLIDADAS
    // ========================================================================
    const period = format(periodStart, 'yyyy-MM');
    
    return {
      period,
      periodStart,
      periodEnd: periodStart,  // ← Normalizado: mismo valor que periodStart
      totalJourneys,
      activeJourneys,
      completedJourneys,
      atRiskJourneys,
      abandonedJourneys,
      avgComplianceScore,
      avgClarificationScore,
      avgCultureScore,
      avgConnectionScore,
      avgEXOScore,
      exoScoreTrend: null,  // Se calcula en saveDepartmentInsights
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      avgAge,
      avgSeniority,
      genderDistribution,
      topIssues,
      recommendations
    };
  }
  
  /**
   * GUARDAR INSIGHTS EN BD (upsert)
   */
  static async saveDepartmentInsights(
    accountId: string,
    departmentId: string,
    metrics: PeriodMetrics
  ): Promise<void> {
    
    // ========================================================================
    // CALCULAR TENDENCIA VS PERÍODO ANTERIOR
    // ========================================================================
    const period = format(metrics.periodStart, 'yyyy-MM');
    const previousPeriod = this.getPreviousPeriod(period);
    
    // Calcular fechas del período anterior
    const previousPeriodStart = new Date(`${previousPeriod}-01`);
    const previousPeriodEnd = endOfMonth(previousPeriodStart);
    
    // Buscar insight del período anterior
    const previousInsight = await prisma.departmentOnboardingInsight.findFirst({
      where: { 
        accountId,
        departmentId,
        periodStart: previousPeriodStart,
        periodEnd: previousPeriodStart  // ← Normalizado
      },
      select: { avgEXOScore: true }
    });
    
    // Calcular tendencia (diferencia vs período anterior)
    const exoScoreTrend = previousInsight && 
                          metrics.avgEXOScore !== null && 
                          previousInsight.avgEXOScore !== null
      ? parseFloat((metrics.avgEXOScore - previousInsight.avgEXOScore).toFixed(1))
      : null;
    
    // ========================================================================
    // GUARDAR EN BD
    // ========================================================================
    await prisma.departmentOnboardingInsight.upsert({
      where: {
        // ✅ CORRECCIÓN v3.2.4: Constraint auto-generado por Prisma
        // @@unique([departmentId, periodStart, periodEnd]) genera este nombre
        departmentId_periodStart_periodEnd: {
          departmentId,
          periodStart: metrics.periodStart,
          periodEnd: metrics.periodEnd
        }
      },
      update: {
        // Actualizar métricas si período ya existe
        totalJourneys: metrics.totalJourneys,
        activeJourneys: metrics.activeJourneys,
        completedJourneys: metrics.completedJourneys,
        atRiskJourneys: metrics.atRiskJourneys,
        abandonedJourneys: metrics.abandonedJourneys,
        avgComplianceScore: metrics.avgComplianceScore,
        avgClarificationScore: metrics.avgClarificationScore,
        avgCultureScore: metrics.avgCultureScore,
        avgConnectionScore: metrics.avgConnectionScore,
        avgEXOScore: metrics.avgEXOScore,
        exoScoreTrend: exoScoreTrend,
        criticalAlerts: metrics.criticalAlerts,
        highAlerts: metrics.highAlerts,
        mediumAlerts: metrics.mediumAlerts,
        avgAge: metrics.avgAge,
        avgSeniority: metrics.avgSeniority,
        genderDistribution: metrics.genderDistribution as any,
        topIssues: metrics.topIssues as any,
        recommendations: metrics.recommendations as any,
        updatedAt: new Date()
      },
      create: {
        // Crear nuevo registro
        accountId,
        departmentId,
        periodStart: metrics.periodStart,
        periodEnd: metrics.periodEnd,
        totalJourneys: metrics.totalJourneys,
        activeJourneys: metrics.activeJourneys,
        completedJourneys: metrics.completedJourneys,
        atRiskJourneys: metrics.atRiskJourneys,
        abandonedJourneys: metrics.abandonedJourneys,
        avgComplianceScore: metrics.avgComplianceScore,
        avgClarificationScore: metrics.avgClarificationScore,
        avgCultureScore: metrics.avgCultureScore,
        avgConnectionScore: metrics.avgConnectionScore,
        avgEXOScore: metrics.avgEXOScore,
        exoScoreTrend: exoScoreTrend,
        criticalAlerts: metrics.criticalAlerts,
        highAlerts: metrics.highAlerts,
        mediumAlerts: metrics.mediumAlerts,
        avgAge: metrics.avgAge,
        avgSeniority: metrics.avgSeniority,
        genderDistribution: metrics.genderDistribution as any,
        topIssues: metrics.topIssues as any,
        recommendations: metrics.recommendations as any
      }
    });
  }
  
  /**
   * AGREGAR TODOS LOS DEPARTAMENTOS DE UNA CUENTA
   * (método para ejecutar en cron)
   */
  static async aggregateAllDepartments(
    accountId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<{ success: boolean; departmentsProcessed: number; errors: string[] }> {
    
    // Si no se especifica período, usar mes actual
    const start = periodStart || startOfMonth(new Date());
    const end = periodEnd || endOfMonth(new Date());
    
    const errors: string[] = [];
    let processed = 0;
    
    try {
      // Obtener departamentos con journeys onboarding
      const departments = await prisma.department.findMany({
        where: {
          accountId,
          journeys: {
            some: {
              createdAt: {
                gte: start,
                lte: end
              },
              // ✅ CORRECCIÓN PILAR 3 (v3.2.4): Filtrar en BD
              stage1Participant: {
                campaign: {
                  campaignType: {
                    isPermanent: true
                  }
                }
              }
            }
          }
        },
        select: {
          id: true,
          displayName: true
        }
      });
      
      console.log(`[OnboardingAggregation] Processing ${departments.length} departments...`);
      
      // Procesar cada departamento
      for (const dept of departments) {
        try {
          const metrics = await this.calculateDepartmentMetrics(
            accountId,
            dept.id,
            start,
            end
          );
          
          await this.saveDepartmentInsights(accountId, dept.id, metrics);
          
          console.log(`[OnboardingAggregation] ✅ ${dept.displayName}: ${metrics.totalJourneys} journeys`);
          processed++;
          
        } catch (error) {
          const errorMsg = `Error processing ${dept.displayName}: ${error}`;
          console.error(`[OnboardingAggregation] ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        departmentsProcessed: processed,
        errors
      };
      
    } catch (error) {
      console.error('[OnboardingAggregation] Fatal error:', error);
      return {
        success: false,
        departmentsProcessed: processed,
        errors: [`Fatal error: ${error}`]
      };
    }
  }
  
  // ============================================================================
  // NUEVOS MÉTODOS: AGREGACIONES GLOBALES PARA DASHBOARD v3.2.5
  // ============================================================================
  
  /**
   * Obtener métricas globales agregadas con jerarquía
   * 
   * @param accountId - ID de la cuenta
   * @param period - Período YYYY-MM (opcional, default: mes actual)
   * @returns Métricas globales con respeto a jerarquía
   */
  static async getGlobalMetrics(
    accountId: string,
    period?: string,
    options?: AggregationFilterOptions
  ): Promise<{
    avgEXOScore: number | null;
    totalActiveJourneys: number;
    criticalAlerts: number;
    period: string;
    exoScoreTrend: number | null;
  }> {
    
    const targetPeriod = period || format(new Date(), 'yyyy-MM');
    const [year, month] = targetPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = periodStart;  // ← Normalizado: mismo valor
    
    // Verificar si hay jerarquía
    const hasHierarchy = await prisma.department.count({
      where: {
        accountId,
        parentId: { not: null },
        isActive: true
      }
    }) > 0;
    
    let avgEXOScore: number | null = null;
    let totalActiveJourneys = 0;
    let criticalAlerts = 0;
    
    if (hasHierarchy) {
      // CON JERARQUÍA: Usar CTE recursivo para agregación ponderada
      const results = await prisma.$queryRaw<Array<{
        avgEXOScore: number | null;
        totalActiveJourneys: number;
        criticalAlerts: number;
      }>>`
  WITH base_scores AS (
    SELECT 
      oi.avg_exo_score,
      oi.total_journeys,        -- ✅ CAMBIO 1: Cambiar de active_journeys a total_journeys
      oi.active_journeys,       -- ✅ Mantener para el contador total_active
      oi.critical_alerts
    FROM department_onboarding_insights oi
    INNER JOIN departments d ON oi.department_id = d.id
    WHERE d.account_id = ${accountId}
      AND d.is_active = true
      AND oi.period_start = ${periodStart}::date
      AND oi.period_end = ${periodEnd}::date
  ),
  aggregated_scores AS (
  SELECT 
    COALESCE(
      SUM(CASE WHEN bs.avg_exo_score IS NOT NULL THEN bs.avg_exo_score * bs.total_journeys END) 
      / NULLIF(SUM(CASE WHEN bs.avg_exo_score IS NOT NULL THEN bs.total_journeys END), 0),
      NULL
    ) as weighted_avg_exo_score,
    COALESCE(SUM(bs.active_journeys), 0) as total_active,
    COALESCE(SUM(bs.critical_alerts), 0) as total_critical
  FROM base_scores bs
  -- ✅ SIN WHERE: permite contar todos los active_journeys
)
  SELECT 
    weighted_avg_exo_score as "avgEXOScore",
    total_active as "totalActiveJourneys",
    total_critical as "criticalAlerts"
  FROM aggregated_scores
`;
      
      if (results.length > 0) {
        avgEXOScore = results[0].avgEXOScore;
        totalActiveJourneys = results[0].totalActiveJourneys;
        criticalAlerts = results[0].criticalAlerts;
      }
      
    } else {
      // SIN JERARQUÍA: Agregación simple
      const insights = await prisma.departmentOnboardingInsight.findMany({
        where: {
          accountId,
          periodStart: periodStart,  // ← Búsqueda exacta
          periodEnd: periodEnd,        // ← Búsqueda exacta
          // 🔐 RBAC: Filtro jerárquico opcional
          ...(options?.allowedDepartmentIds && { 
            departmentId: { in: options.allowedDepartmentIds } 
          })
        }
      });
      
      if (insights.length > 0) {
        avgEXOScore = this.calculateAverage(insights.map(i => i.avgEXOScore));
        totalActiveJourneys = insights.reduce((sum, i) => sum + i.activeJourneys, 0);
        criticalAlerts = insights.reduce((sum, i) => sum + i.criticalAlerts, 0);
      }
    }
    
    // Calcular tendencia vs período anterior
    const previousPeriod = this.getPreviousPeriod(targetPeriod);
    const previousInsights = await prisma.departmentOnboardingInsight.findMany({
      where: {
        accountId,
        periodStart: { gte: new Date(previousPeriod + '-01') }
      }
    });
    
    const previousAvgEXOScore = previousInsights.length > 0
      ? this.calculateAverage(previousInsights.map(i => i.avgEXOScore))
      : null;
    
    const exoScoreTrend = avgEXOScore && previousAvgEXOScore
      ? Number((avgEXOScore - previousAvgEXOScore).toFixed(1))
      : null;
    
    return {
      avgEXOScore: avgEXOScore ? Number(avgEXOScore.toFixed(1)) : null,
      totalActiveJourneys,
      criticalAlerts,
      period: targetPeriod,
      exoScoreTrend
    };
  }
  
  /**
   * Obtener Top 3 departamentos por EXO Score
   */
  static async getTopDepartments(
    accountId: string,
    period?: string,
    options?: AggregationFilterOptions
  ): Promise<Array<{
    departmentId: string;
    name: string;
    avgEXOScore: number;
    activeJourneys: number;
  }>> {
    
    const targetPeriod = period || format(new Date(), 'yyyy-MM');
    const [year, month] = targetPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = periodStart;  // ← Normalizado: mismo valor
    
    const insights = await prisma.departmentOnboardingInsight.findMany({
      where: {
        accountId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        avgEXOScore: { not: null },
        // 🔐 RBAC: Filtro jerárquico opcional
        ...(options?.allowedDepartmentIds && { 
          departmentId: { in: options.allowedDepartmentIds } 
        })
      },
      include: {
        department: {
          select: { 
            id: true,
            displayName: true 
          }
        }
      },
      orderBy: { avgEXOScore: 'desc' },
      take: 3
    });
    
    return insights.map(i => ({
      departmentId: i.department.id,
      name: i.department.displayName,
      avgEXOScore: Number(i.avgEXOScore!.toFixed(1)),
      activeJourneys: i.activeJourneys
    }));
  }
  
  /**
   * Obtener Bottom 3 departamentos por EXO Score
   */
  static async getBottomDepartments(
    accountId: string,
    period?: string,
    options?: AggregationFilterOptions
  ): Promise<Array<{
    departmentId: string;
    name: string;
    avgEXOScore: number;
    atRiskCount: number;
  }>> {
    
    const targetPeriod = period || format(new Date(), 'yyyy-MM');
    const [year, month] = targetPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = periodStart;  // ← Normalizado: mismo valor
    
    const insights = await prisma.departmentOnboardingInsight.findMany({
      where: {
        accountId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        avgEXOScore: { not: null },
        // 🔐 RBAC: Filtro jerárquico opcional
        ...(options?.allowedDepartmentIds && { 
          departmentId: { in: options.allowedDepartmentIds } 
        })
      },
      include: {
        department: {
          select: { 
            id: true,
            displayName: true 
          }
        }
      },
      orderBy: { avgEXOScore: 'asc' },
      take: 3
    });
    
    return insights.map(i => ({
      departmentId: i.department.id,
      name: i.department.displayName,
      avgEXOScore: Number(i.avgEXOScore!.toFixed(1)),
      atRiskCount: i.atRiskJourneys
    }));
  }
  
  /**
   * Obtener insights globales agregados
   */
  static async getGlobalInsights(
    accountId: string,
    period?: string,
    options?: AggregationFilterOptions
  ): Promise<{
    topIssues: Array<{ issue: string; count: number }>;
    recommendations: string[];
  }> {
    
    const targetPeriod = period || format(new Date(), 'yyyy-MM');
    const [year, month] = targetPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = periodStart;  // ← Normalizado: mismo valor
    
    const insights = await prisma.departmentOnboardingInsight.findMany({
      where: {
        accountId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        // 🔐 RBAC: Filtro jerárquico opcional
        ...(options?.allowedDepartmentIds && { 
          departmentId: { in: options.allowedDepartmentIds } 
        })
      },
      include: {
        department: {
          select: { displayName: true }
        }
      }
    });
    
    // Agregar topIssues
    const issuesMap = new Map<string, number>();
    
    insights.forEach(insight => {
      if (insight.topIssues) {
        const issues = insight.topIssues as Array<{ issue: string; count: number }>;
        issues.forEach(({ issue, count }) => {
          const currentCount = issuesMap.get(issue) || 0;
          issuesMap.set(issue, currentCount + count);
        });
      }
    });
    
    const topIssues = Array.from(issuesMap.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Generar recomendaciones
    const recommendations: string[] = [];
    
    const lowScoreDepts = insights
      .filter(i => i.avgEXOScore !== null && i.avgEXOScore < 60)
      .map(i => i.department.displayName);
    
    if (lowScoreDepts.length > 0) {
      recommendations.push(
        `Prioridad Alta: Revisar proceso onboarding en ${lowScoreDepts.slice(0, 2).join(', ')}`
      );
    }
    
    const highAlertDepts = insights
      .filter(i => i.criticalAlerts > 2)
      .map(i => i.department.displayName);
    
    if (highAlertDepts.length > 0) {
      recommendations.push(
        `Prioridad Media: Atender alertas críticas en ${highAlertDepts.slice(0, 2).join(', ')}`
      );
    }
    
    const highAbandonDepts = insights
      .filter(i => i.abandonedJourneys > 0)
      .map(i => i.department.displayName);
    
    if (highAbandonDepts.length > 0) {
      recommendations.push(
        `Revisar causas de abandono en ${highAbandonDepts.slice(0, 2).join(', ')}`
      );
    }
    
    return {
      topIssues,
      recommendations
    };
  }
  
  /**
   * Obtener segmentación demográfica global
   */
  static async getGlobalDemographics(
    accountId: string,
    period?: string,
    options?: AggregationFilterOptions
  ): Promise<{
    byGeneration: Array<{ generation: string; count: number; avgEXOScore: number; atRiskRate: number }>;
    byGender: Array<{ gender: string; count: number; avgEXOScore: number }>;
    bySeniority: Array<{ range: string; count: number; avgEXOScore: number }>;
  }> {
    
    const targetPeriod = period || format(new Date(), 'yyyy-MM');
    const [year, month] = targetPeriod.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = periodStart;  // ← Normalizado: mismo valor
    
    // Obtener todos los journeys del período con demographics
    const journeys = await prisma.journeyOrchestration.findMany({
      where: {
        accountId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        // 🔐 RBAC: Filtro jerárquico opcional
        ...(options?.allowedDepartmentIds && { 
          departmentId: { in: options.allowedDepartmentIds } 
        })
      },
      select: {
        exoScore: true,
        retentionRisk: true,
        hireDate: true,
        // ✅ FIX: Traer demographics desde stage1Participant
        stage1Participant: {
          select: {
            dateOfBirth: true,
            gender: true
          }
        }
      }
    });
    
    if (journeys.length === 0) {
      return {
        byGeneration: [],
        byGender: [],
        bySeniority: []
      };
    }
    
    // ✅ FIX: Acceder a demographics correctamente
    const genZ = journeys.filter(j => 
      j.stage1Participant?.dateOfBirth && 
      this.calculateAge(j.stage1Participant.dateOfBirth) < 27
    );
    const millennial = journeys.filter(j => 
      j.stage1Participant?.dateOfBirth && 
      this.calculateAge(j.stage1Participant.dateOfBirth) >= 27 && 
      this.calculateAge(j.stage1Participant.dateOfBirth) <= 42
    );
    const genX = journeys.filter(j => 
      j.stage1Participant?.dateOfBirth && 
      this.calculateAge(j.stage1Participant.dateOfBirth) > 42 && 
      this.calculateAge(j.stage1Participant.dateOfBirth) <= 58
    );
    
    const byGeneration = [
      {
        generation: 'Gen Z (<27)',
        count: genZ.length,
        avgEXOScore: Number(this.calculateAverage(genZ.map(j => j.exoScore))?.toFixed(1) || 0),
        atRiskRate: genZ.filter(j => j.retentionRisk === 'high' || j.retentionRisk === 'critical').length / (genZ.length || 1)
      },
      {
        generation: 'Millennial (27-42)',
        count: millennial.length,
        avgEXOScore: Number(this.calculateAverage(millennial.map(j => j.exoScore))?.toFixed(1) || 0),
        atRiskRate: millennial.filter(j => j.retentionRisk === 'high' || j.retentionRisk === 'critical').length / (millennial.length || 1)
      },
      {
        generation: 'Gen X (43-58)',
        count: genX.length,
        avgEXOScore: Number(this.calculateAverage(genX.map(j => j.exoScore))?.toFixed(1) || 0),
        atRiskRate: genX.filter(j => j.retentionRisk === 'high' || j.retentionRisk === 'critical').length / (genX.length || 1)
      }
    ].filter(g => g.count > 0);
    
    // ✅ FIX: Segmentación por género desde stage1Participant
    const genderGroups = new Map<string, typeof journeys>();
    journeys.forEach(j => {
      if (j.stage1Participant?.gender) {
        const group = genderGroups.get(j.stage1Participant.gender) || [];
        group.push(j);
        genderGroups.set(j.stage1Participant.gender, group);
      }
    });
    
    const byGender = Array.from(genderGroups.entries()).map(([gender, group]) => ({
      gender,
      count: group.length,
      avgEXOScore: Number(this.calculateAverage(group.map(j => j.exoScore))?.toFixed(1) || 0)
    }));
    
    // Segmentación por antigüedad
    const nuevo = journeys.filter(j => j.hireDate && this.calculateSeniority(j.hireDate) < 0.5);
    const junior = journeys.filter(j => j.hireDate && this.calculateSeniority(j.hireDate) >= 0.5 && this.calculateSeniority(j.hireDate) < 2);
    const senior = journeys.filter(j => j.hireDate && this.calculateSeniority(j.hireDate) >= 2);
    
    const bySeniority = [
      {
        range: 'Nuevo (0-6 meses)',
        count: nuevo.length,
        avgEXOScore: Number(this.calculateAverage(nuevo.map(j => j.exoScore))?.toFixed(1) || 0)
      },
      {
        range: 'Junior (6-24 meses)',
        count: junior.length,
        avgEXOScore: Number(this.calculateAverage(junior.map(j => j.exoScore))?.toFixed(1) || 0)
      },
      {
        range: 'Senior (24+ meses)',
        count: senior.length,
        avgEXOScore: Number(this.calculateAverage(senior.map(j => j.exoScore))?.toFixed(1) || 0)
      }
    ].filter(s => s.count > 0);
    
    return {
      byGeneration,
      byGender,
      bySeniority
    };
  }
  
  // ==========================================================================
  // HELPERS PRIVADOS
  // ==========================================================================
  
  /**
   * Calcular promedio de array (ignorando nulls)
   */
  private static calculateAverage(values: (number | null)[]): number | null {
    const validValues = values.filter((v): v is number => v !== null);
    if (validValues.length === 0) return null;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }
  
  /**
   * Calcular edad promedio desde fechas de nacimiento
   */
  private static calculateAverageAge(dates: Date[]): number | null {
    if (dates.length === 0) return null;
    
    const today = new Date();
    const ages = dates.map(birthDate => {
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    });
    
    return ages.reduce((sum, age) => sum + age, 0) / ages.length;
  }
  
  /**
   * Calcular antigüedad promedio desde fechas de contratación
   */
  private static calculateAverageSeniority(dates: Date[]): number | null {
    if (dates.length === 0) return null;
    
    const today = new Date();
    const seniorities = dates.map(hireDate => {
      const years = today.getFullYear() - hireDate.getFullYear();
      const monthDiff = today.getMonth() - hireDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
        return years - 1;
      }
      return years;
    });
    
    return seniorities.reduce((sum, years) => sum + years, 0) / seniorities.length;
  }
  
  /**
   * Calcular edad desde fecha de nacimiento (helper para demographics)
   */
  private static calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }
  
  /**
   * Calcular antigüedad en años desde fecha de contratación (helper para demographics)
   */
  private static calculateSeniority(hireDate: Date): number {
    const today = new Date();
    let years = today.getFullYear() - hireDate.getFullYear();
    const monthDiff = today.getMonth() - hireDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
      years--;
    }
    return years + (monthDiff / 12);
  }
  
  /**
   * Calcular período anterior (formato YYYY-MM)
   * Ejemplo: "2025-11" → "2025-10" | "2025-01" → "2024-12"
   */
  private static getPreviousPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    
    if (month === 1) {
      return `${year - 1}-12`;
    }
    
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  }
  
  /**
   * Calcular distribución de género (v3.2.4)
   */
  private static calculateGenderDistribution(
    genders: (string | null)[]
  ): Record<string, number> | null {
    if (genders.length === 0) return null;
    
    const distribution: Record<string, number> = {
      MALE: 0,
      FEMALE: 0,
      NON_BINARY: 0,
      PREFER_NOT_TO_SAY: 0,
      UNKNOWN: 0
    };
    
    for (const gender of genders) {
      const key = gender || 'UNKNOWN';
      if (key in distribution) {
        distribution[key]++;
      } else {
        distribution['UNKNOWN']++;
      }
    }
    
    return distribution;
  }
  
  /**
   * Identificar top 5 issues más frecuentes
   */
  private static identifyTopIssues(alerts: any[]): Array<{ issue: string; count: number }> | null {
    if (alerts.length === 0) return null;
    
    const issueCount: Record<string, number> = {};
    
    alerts.forEach(alert => {
      const key = alert.alertType || 'unknown';
      issueCount[key] = (issueCount[key] || 0) + 1;
    });
    
    return Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  /**
   * Generar recomendaciones automáticas
   */
  private static generateRecommendations(data: {
    totalJourneys: number;
    atRiskJourneys: number;
    avgEXOScore: number | null;
    criticalAlerts: number;
  }): string[] | null {
    const recs: string[] = [];
    
    // Recomendación por proporción de riesgo
    if (data.totalJourneys > 0) {
      const riskRate = data.atRiskJourneys / data.totalJourneys;
      if (riskRate > 0.3) {
        recs.push('🚨 Alta proporción de journeys en riesgo (>30%). Revisar proceso de onboarding.');
      }
    }
    
    // Recomendación por EXO Score bajo
    if (data.avgEXOScore && data.avgEXOScore < 70) {
      recs.push('⚠️ EXO Score departamental bajo (<70). Reforzar seguimiento y soporte.');
    }
    
    // Recomendación por alertas críticas
    if (data.criticalAlerts > 0) {
      recs.push(`🔴 ${data.criticalAlerts} alerta(s) crítica(s) pendiente(s). Atención inmediata requerida.`);
    }
    
    return recs.length > 0 ? recs : null;
  }
  /**
 * ✅ FUNCIÓN CONSOLIDADA - Mejor de Claude + Gemini + Tu idea
 */
static async updateAccumulatedExoScores(accountId: string): Promise<void> {
  try {
    console.log(`[Onboarding] 🔄 Calculating accumulated EXO Scores for account: ${accountId}`);
    
    const departments = await prisma.department.findMany({
      where: { accountId, isActive: true },
      select: { id: true, displayName: true }
    });
    
    console.log(`[Onboarding] Found ${departments.length} active departments`);
    
    for (const dept of departments) {
      // 1. Obtener últimos 12 meses de insights
      const insights = await prisma.departmentOnboardingInsight.findMany({
        where: {
          departmentId: dept.id,
          avgEXOScore: { not: null }
        },
        select: {
          avgEXOScore: true,
          totalJourneys: true,
          periodStart: true  // 🌟 PARA METADATOS
        },
        orderBy: { periodStart: 'desc' },
        take: 12
      });
      
      // 2. Si no hay datos
      if (insights.length === 0) {
        await prisma.department.update({
          where: { id: dept.id },
          data: { 
            accumulatedExoScore: null,
            accumulatedExoJourneys: null,
            accumulatedPeriodCount: null,      // 🌟 TU IDEA
            accumulatedLastUpdated: null       // 🌟 TU IDEA
          }
        });
        console.log(`[Onboarding]   - ${dept.displayName}: No data`);
        continue;
      }
      
      // 3. Calcular promedio ponderado (CLAUDE + GEMINI)
      let totalWeightedScore = 0;
      let totalJourneys = 0;
      
      for (const insight of insights) {
        if (insight.avgEXOScore !== null && insight.totalJourneys > 0) {
          totalWeightedScore += insight.avgEXOScore * insight.totalJourneys;
          totalJourneys += insight.totalJourneys;
        }
      }
      
      const accumulatedScore = totalJourneys > 0
        ? parseFloat((totalWeightedScore / totalJourneys).toFixed(1))
        : null;
      
      // 4. Guardar con metadatos (🌟 TU MEJORA)
      await prisma.department.update({
        where: { id: dept.id },
        data: {
          accumulatedExoScore: accumulatedScore,
          accumulatedExoJourneys: totalJourneys,
          accumulatedPeriodCount: insights.length,        // 🌟 NUEVO
          accumulatedLastUpdated: new Date()              // 🌟 NUEVO
        }
      });

      console.log(
        `[Onboarding]   ✅ ${dept.displayName}: ${accumulatedScore} ` +
        `(${insights.length} periods, ${totalJourneys} journeys)`  // 🌟 MEJORADO
      );
    }

    // =========================================================================
    // PASO 2: PROPAGAR SCORES DE DEPARTAMENTOS (level 3) → GERENCIAS (level 2)
    // =========================================================================
    console.log(`[Onboarding] 🔼 Propagating scores to parent gerencias...`);

    const gerencias = await prisma.department.findMany({
      where: {
        accountId,
        isActive: true,
        level: 2  // Solo gerencias
      },
      select: {
        id: true,
        displayName: true,
        accumulatedExoScore: true,
        accumulatedExoJourneys: true
      }
    });

    for (const gerencia of gerencias) {
      // Obtener departamentos hijos con scores calculados
      const hijos = await prisma.department.findMany({
        where: {
          parentId: gerencia.id,
          accumulatedExoScore: { not: null }
        },
        select: {
          displayName: true,
          accumulatedExoScore: true,
          accumulatedExoJourneys: true
        }
      });

      if (hijos.length === 0 && gerencia.accumulatedExoScore === null) {
        // Sin hijos con data y sin score propio = skip
        continue;
      }

      // Calcular promedio ponderado combinando:
      // - Score propio de la gerencia (si tiene journeys directos)
      // - Scores de todos sus hijos
      let totalWeightedScore = 0;
      let totalJourneys = 0;

      // Incluir score propio de la gerencia si existe
      if (gerencia.accumulatedExoScore !== null && gerencia.accumulatedExoJourneys) {
        totalWeightedScore += gerencia.accumulatedExoScore * gerencia.accumulatedExoJourneys;
        totalJourneys += gerencia.accumulatedExoJourneys;
      }

      // Sumar scores de hijos
      for (const hijo of hijos) {
        if (hijo.accumulatedExoScore !== null && hijo.accumulatedExoJourneys) {
          totalWeightedScore += hijo.accumulatedExoScore * hijo.accumulatedExoJourneys;
          totalJourneys += hijo.accumulatedExoJourneys;
        }
      }

      const finalScore = totalJourneys > 0
        ? parseFloat((totalWeightedScore / totalJourneys).toFixed(1))
        : null;

      // Actualizar gerencia con score combinado
      await prisma.department.update({
        where: { id: gerencia.id },
        data: {
          accumulatedExoScore: finalScore,
          accumulatedExoJourneys: totalJourneys,
          accumulatedLastUpdated: new Date()
        }
      });

      console.log(
        `[Onboarding]   🔼 ${gerencia.displayName}: ${finalScore} ` +
        `(${hijos.length} children, ${totalJourneys} total journeys)`
      );
    }
    console.log(`[Onboarding] ✅ Accumulated scores updated successfully`);
    
    
  } catch (error) {
    console.error('[Onboarding] ❌ Error updating accumulated scores:', error);
    throw error;
  }
}
// ============================================================================
// MÉTODO: getComplianceEfficiency V2.0 (AUDITORÍA COMPLETA + MÉTRICAS EXTENDIDAS)
// Ubicación: src/lib/services/OnboardingAggregationService.ts
// ============================================================================

/**
 * ✅ COMPLIANCE EFFICIENCY V2.0 - AUDITORÍA COMPLETA + MÉTRICAS EXTENDIDAS
 * 
 * CAMBIOS V2 vs código existente:
 * - department select incluye: level, parentId, unitType (antes solo displayName)
 * - Promise.all paralelo con DepartmentOnboardingInsight + NPSInsight
 * - Retorna campos nuevos: level, parentId, unitType, participation, efficiency, scores 4C, npsScore
 * - employeeDetail incluye array stages[] para timeline visual
 * 
 * @param accountId - ID cuenta
 * @param departmentId - ID departamento específico (opcional)
 * @param options - Opciones de filtrado RBAC (opcional)
 * @returns Array de departamentos con compliance V2
 */
static async getComplianceEfficiency(
  accountId: string,
  departmentId?: string,
  options?: AggregationFilterOptions
): Promise<Array<{
  // Campos originales (backward compatible)
  departmentId: string;
  departmentName: string;
  compliance: number;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';
  responded: number;
  overdue: number;
  pending: number;
  employeeDetail: Array<{
    id: string;
    fullName: string;
    currentStage: number;
    daysSinceHire: number;
    complianceStatus: 'completed' | 'overdue' | 'pending';
    daysOverdue?: number;
    stages?: Array<{
      stage: 1 | 2 | 3 | 4;
      label: 'D1' | 'D7' | 'D30' | 'D90';
      status: 'responded' | 'overdue' | 'not_sent';
    }>;
  }>;
  // Campos nuevos V2 (todos opcionales para backward compatibility)
  level?: number;
  parentId?: string | null;
  unitType?: 'gerencia' | 'departamento';
  participation?: number;
  efficiency?: number;
  avgComplianceScore?: number | null;
  avgClarificationScore?: number | null;
  avgCultureScore?: number | null;
  avgConnectionScore?: number | null;
  avgEXOScore?: number | null;
  npsScore?: number | null;
  totalJourneys?: number;
  atRiskJourneys?: number;
  alertsPercentage?: number;
}>> {
  const today = new Date();
  
  // ════════════════════════════════════════════════════════════════════════
  // 1. QUERY PRINCIPAL - MISMA ESTRUCTURA QUE CÓDIGO EXISTENTE
  //    Solo extendido: department select incluye level, parentId, unitType
  // ════════════════════════════════════════════════════════════════════════
  const whereClause: any = {
    accountId,
    status: 'active'
  };
  
  // 🔐 RBAC: Aplicar filtros de departamento
  if (departmentId && options?.allowedDepartmentIds) {
    // Si hay ambos: usar departmentId solo si está en los permitidos
    whereClause.departmentId = options.allowedDepartmentIds.includes(departmentId) 
      ? departmentId 
      : { in: [] }; // No mostrar nada si no tiene acceso
  } else if (options?.allowedDepartmentIds) {
    // Solo RBAC: filtrar por departamentos permitidos
    whereClause.departmentId = { in: options.allowedDepartmentIds };
  } else if (departmentId) {
    // Solo departmentId específico
    whereClause.departmentId = departmentId;
  }
  
  // Obtener todos los journeys activos con sus participants
  const journeys = await prisma.journeyOrchestration.findMany({
    where: whereClause,
    include: {
      stage1Participant: {
        select: {
          hasResponded: true,
          campaign: { select: { endDate: true } }
        }
      },
      stage2Participant: {
        select: {
          hasResponded: true,
          campaign: { select: { endDate: true } }
        }
      },
      stage3Participant: {
        select: {
          hasResponded: true,
          campaign: { select: { endDate: true } }
        }
      },
      stage4Participant: {
        select: {
          hasResponded: true,
          campaign: { select: { endDate: true } }
        }
      },
      department: {
        select: { 
          displayName: true,
          level: true,      // ✅ NUEVO V2
          parentId: true,   // ✅ NUEVO V2
          unitType: true    // ✅ NUEVO V2
        }
      }
    }
  });
  
  // ════════════════════════════════════════════════════════════════════════
  // 2. ✅ NUEVO V2: QUERIES PARALELAS - Insights 4C + NPS
  // ════════════════════════════════════════════════════════════════════════
  const departmentIds = [...new Set(journeys.map(j => j.departmentId).filter(Boolean))] as string[];
  
  const [insightsData, npsData] = await Promise.all([
    // DepartmentOnboardingInsight para scores 4C
    prisma.departmentOnboardingInsight.findMany({
      where: {
        accountId,
        departmentId: { in: departmentIds }
      },
      orderBy: { periodStart: 'desc' },
      distinct: ['departmentId'],
      select: {
        departmentId: true,
        avgComplianceScore: true,
        avgClarificationScore: true,
        avgCultureScore: true,
        avgConnectionScore: true,
        avgEXOScore: true,
        totalJourneys: true,
        atRiskJourneys: true
      }
    }),
    
    // NPSInsight para npsScore (producto onboarding)
    prisma.nPSInsight.findMany({
      where: {
        accountId,
        departmentId: { in: departmentIds },
        productType: 'onboarding'
      },
      orderBy: { period: 'desc' },
      distinct: ['departmentId'],
      select: {
        departmentId: true,
        npsScore: true
      }
    })
  ]);
  
  // Crear mapas para lookup O(1)
  const insightMap = new Map(insightsData.map(i => [i.departmentId, i]));
  const npsMap = new Map(npsData.map(n => [n.departmentId, n.npsScore]));

  // ════════════════════════════════════════════════════════════════════════
  // 3. CONSTANTES PARA STAGES
  // ════════════════════════════════════════════════════════════════════════
  const STAGE_DEADLINES: Record<number, number> = { 1: 1, 2: 7, 3: 30, 4: 90 };
  const STAGE_LABELS: Record<number, 'D1' | 'D7' | 'D30' | 'D90'> = {
    1: 'D1', 2: 'D7', 3: 'D30', 4: 'D90'
  };
  
  // ════════════════════════════════════════════════════════════════════════
  // 4. AGRUPAR POR DEPARTAMENTO - EXTENDIDO CON MÉTRICAS V2
  // ════════════════════════════════════════════════════════════════════════
  const deptMap = new Map<string, {
    departmentId: string;
    departmentName: string;
    level: number;
    parentId: string | null;
    unitType: string;
    responded: number;
    overdue: number;
    pending: number;
    journeys: typeof journeys;
    // Para calcular participation/efficiency
    totalEnviadas: number;
    totalRespondidas: number;
    respondidasATiempo: number;
  }>();
  
  for (const journey of journeys) {
    const deptId = journey.departmentId;
    
    if (!deptMap.has(deptId)) {
      deptMap.set(deptId, {
        departmentId: deptId,
        departmentName: journey.department.displayName,
        level: journey.department.level ?? 3,
        parentId: journey.department.parentId ?? null,
        unitType: journey.department.unitType ?? 'departamento',
        responded: 0,
        overdue: 0,
        pending: 0,
        journeys: [],
        totalEnviadas: 0,
        totalRespondidas: 0,
        respondidasATiempo: 0
      });
    }
    
    const dept = deptMap.get(deptId)!;
    dept.journeys.push(journey);
    
    // Calcular daysSinceHire para determinar qué stages deberían estar enviadas
    const daysSinceHire = Math.floor(
      (today.getTime() - journey.hireDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // ✅ FIX v2: Contar por PERSONA (no por stage)
    const participants = [
      journey.stage1Participant,
      journey.stage2Participant,
      journey.stage3Participant,
      journey.stage4Participant
    ].filter(p => p); // Solo los que existen

    // Verificar si la persona ha respondido TODAS sus encuestas
    const hasRespondedAll = participants.length > 0 &&
      participants.every(p => p!.hasResponded);

    // Verificar si está vencida según su etapa ACTUAL (usando STAGE_DEADLINES)
    const currentDeadline = STAGE_DEADLINES[journey.currentStage] || 7;
    const isOverdue = !hasRespondedAll && daysSinceHire > currentDeadline;

    // Contar UNA vez por persona
    if (hasRespondedAll) {
      dept.responded++;  // Persona al día (completó todo)
    } else if (isOverdue) {
      dept.overdue++;    // Persona con atraso
    } else {
      dept.pending++;    // Persona en plazo
    }
    
    // Calcular métricas de participation/efficiency por stage (para V2)
    const stageParticipants = [
      { p: journey.stage1Participant, stage: 1 },
      { p: journey.stage2Participant, stage: 2 },
      { p: journey.stage3Participant, stage: 3 },
      { p: journey.stage4Participant, stage: 4 }
    ];
    
    for (const { p, stage } of stageParticipants) {
      if (!p) continue;
      
      const deadline = STAGE_DEADLINES[stage];
      const shouldBeSent = daysSinceHire >= deadline;
      
      if (shouldBeSent) {
        dept.totalEnviadas++;
        
        if (p.hasResponded) {
          dept.totalRespondidas++;
          // ✅ Efficiency: respondió antes de que cerrara la campaña
          if (p.campaign.endDate >= today) {
            dept.respondidasATiempo++;
          }
        }
      }
    }
  }
  
  // ════════════════════════════════════════════════════════════════════════
  // 5. CALCULAR COMPLIANCE Y GENERAR RESULTADOS
  // ════════════════════════════════════════════════════════════════════════
  const results = Array.from(deptMap.values()).map(dept => {
    const total = dept.responded + dept.overdue;
    const compliance = total > 0 
      ? Math.round((dept.responded / total) * 100) 
      : 0;
    
    // Determinar status (misma lógica que código existente)
    let status: 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';
    if (total === 0) status = 'neutral';
    else if (compliance >= 90) status = 'excellent';
    else if (compliance >= 75) status = 'good';
    else if (compliance >= 60) status = 'warning';
    else status = 'critical';
    
    // ✅ NUEVAS MÉTRICAS DE PROCESO V2
    const participation = dept.totalEnviadas > 0
      ? Math.round((dept.totalRespondidas / dept.totalEnviadas) * 100)
      : 0;
    
    const efficiency = dept.totalRespondidas > 0
      ? Math.round((dept.respondidasATiempo / dept.totalRespondidas) * 100)
      : 0;
    
    // ✅ SCORES 4C + EXO desde Insight
    const insight = insightMap.get(dept.departmentId);
    
    // ✅ NPS desde NPSInsight
    const npsScore = npsMap.get(dept.departmentId) ?? null;
    
    // ✅ ALERTAS
    const totalJourneys = insight?.totalJourneys ?? dept.journeys.length;
    const atRiskJourneys = insight?.atRiskJourneys ?? 0;
    const alertsPercentage = totalJourneys > 0
      ? Math.round((atRiskJourneys / totalJourneys) * 100)
      : 0;
    
    // ════════════════════════════════════════════════════════════════════
    // EMPLOYEE DETAIL - EXTENDIDO CON STAGES TIMELINE
    // ════════════════════════════════════════════════════════════════════
    const employeeDetail = dept.journeys.map(j => {
      const participants = [
        j.stage1Participant,
        j.stage2Participant,
        j.stage3Participant,
        j.stage4Participant
      ];
      
      const daysSinceHire = Math.floor(
        (today.getTime() - j.hireDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Determinar estado global del empleado
      const allResponded = participants.filter(p => p).every(p => p!.hasResponded);
      
      // ✅ FIX: Verificar overdue usando STAGE_DEADLINES, no campaign.endDate
      const currentDeadline = STAGE_DEADLINES[j.currentStage] || 7;
      const hasOverdue = !allResponded && daysSinceHire > currentDeadline;
      
      let complianceStatus: 'completed' | 'overdue' | 'pending';
      let daysOverdue: number | undefined;
      
      if (allResponded) {
        complianceStatus = 'completed';
      } else if (hasOverdue) {
        complianceStatus = 'overdue';
        // ✅ FIX: Calcular días de atraso desde el deadline de la etapa actual
        daysOverdue = daysSinceHire - currentDeadline;
      } else {
        complianceStatus = 'pending';
      }
      
      // ✅ NUEVO V2: Timeline de stages
      const stages = participants.map((p, idx) => {
        const stage = (idx + 1) as 1 | 2 | 3 | 4;
        const deadline = STAGE_DEADLINES[stage];
        const shouldBeSent = daysSinceHire >= deadline;
        
        let stageStatus: 'responded' | 'overdue' | 'not_sent';
        if (!shouldBeSent || !p) {
          stageStatus = 'not_sent';
        } else if (p.hasResponded) {
          stageStatus = 'responded';
        } else if (p.campaign.endDate < today) {
          stageStatus = 'overdue';
        } else {
          stageStatus = 'not_sent'; // Enviada pero aún en plazo
        }
        
        return {
          stage,
          label: STAGE_LABELS[stage],
          status: stageStatus
        };
      });
      
      return {
        id: j.id,
        fullName: j.fullName,
        currentStage: j.currentStage,
        daysSinceHire,
        complianceStatus,
        daysOverdue,
        stages  // ✅ NUEVO V2
      };
    });
    
    return {
      // Campos originales (backward compatible)
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      compliance,
      status,
      responded: dept.responded,
      overdue: dept.overdue,
      pending: dept.pending,
      employeeDetail,
      
      // ✅ CAMPOS NUEVOS V2
      level: dept.level,
      parentId: dept.parentId,
      unitType: dept.unitType as 'gerencia' | 'departamento',
      participation,
      efficiency,
      avgComplianceScore: insight?.avgComplianceScore ?? null,
      avgClarificationScore: insight?.avgClarificationScore ?? null,
      avgCultureScore: insight?.avgCultureScore ?? null,
      avgConnectionScore: insight?.avgConnectionScore ?? null,
      avgEXOScore: insight?.avgEXOScore ?? null,
      npsScore,
      totalJourneys,
      atRiskJourneys,
      alertsPercentage
    };
  });
  
  // Ordenar por compliance ascendente (críticos primero)
  return results.sort((a, b) => a.compliance - b.compliance);
}
}