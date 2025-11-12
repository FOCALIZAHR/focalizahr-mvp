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
 * @version 3.2.4
 * @date November 2025
 */

import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
      periodEnd,
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
        periodEnd: previousPeriodEnd
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
}