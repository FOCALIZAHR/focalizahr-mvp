/**
 * ONBOARDING AGGREGATION SERVICE
 * 
 * ARQUITECTURA "PERIOD-CENTRIC":
 * - Agrega por período temporal (periodStart/periodEnd)
 * - Compara períodos (no campañas individuales)
 * - Reutiliza lógica jerárquica de AggregationService
 * 
 * RESPONSABILIDADES:
 * - Calcular métricas departamentales por período
 * - Identificar patrones y top issues
 * - Generar recomendaciones automáticas
 * - Guardar insights en DepartmentOnboardingInsight
 */

import { prisma } from '@/lib/prisma';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface PeriodMetrics {
  period: string;          // YYYY-MM (display)
  periodStart: Date;       // ✅ AGREGADO
  periodEnd: Date;         // ✅ AGREGADO
  totalJourneys: number;
  completedJourneys: number;
  activeJourneys: number;
  atRiskJourneys: number;
  avgEXOScore: number | null;
  avgScores: {
    compliance: number | null;
    clarification: number | null;
    culture: number | null;
    connection: number | null;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
  };
  topIssues: Array<{
    issue: string;
    count: number;
  }>;
}

interface ComparisonResult {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  delta: {
    totalJourneys: number;
    avgEXOScore: number | null;
    atRiskJourneys: number;
  };
}

export class OnboardingAggregationService {
  
  /**
   * ✅ CALCULAR MÉTRICAS POR DEPARTAMENTO Y PERÍODO
   */
  static async calculateDepartmentMetrics(
    accountId: string,
    departmentId: string,
    date: Date = new Date()
  ): Promise<PeriodMetrics> {
    const period = format(date, 'yyyy-MM');
    const periodStart = startOfMonth(date);
    const periodEnd = endOfMonth(date);
    
    // Obtener journeys del período
    const journeys = await prisma.journeyOrchestration.findMany({
      where: {
        accountId,
        departmentId,  // ✅ CORREGIDO (era: department)
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        alerts: {  // ✅ AGREGADO (faltaba include)
          where: {
            status: { in: ['open', 'acknowledged'] }
          }
        }
      }
    });
    
    // Calcular métricas básicas
    const totalJourneys = journeys.length;
    const completedJourneys = journeys.filter(j => j.status === 'completed').length;
    const activeJourneys = journeys.filter(j => j.status === 'active').length;
    const atRiskJourneys = journeys.filter(j => 
      j.retentionRisk === 'high' || j.retentionRisk === 'critical'
    ).length;
    
    // Calcular promedios de scores
    const journeysWithScores = journeys.filter(j => j.exoScore !== null);
    const avgEXOScore = journeysWithScores.length > 0
      ? journeysWithScores.reduce((sum, j) => sum + j.exoScore!, 0) / journeysWithScores.length
      : null;
    
    const avgScores = {
      compliance: this.calculateAverage(journeys.map(j => j.complianceScore)),
      clarification: this.calculateAverage(journeys.map(j => j.clarificationScore)),
      culture: this.calculateAverage(journeys.map(j => j.cultureScore)),
      connection: this.calculateAverage(journeys.map(j => j.connectionScore))
    };
    
    // Contar alertas por severidad
    const allAlerts = journeys.flatMap(j => j.alerts);  // ✅ AHORA FUNCIONA (alerts incluido)
    const alerts = {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length
    };
    
    // Identificar top issues
    const topIssues = this.identifyTopIssues(allAlerts);
    
    return {
      period,
      periodStart,  // ✅ AGREGADO
      periodEnd,    // ✅ AGREGADO
      totalJourneys,
      completedJourneys,
      activeJourneys,
      atRiskJourneys,
      avgEXOScore,
      avgScores,
      alerts,
      topIssues
    };
  }
  
  /**
   * ✅ GUARDAR INSIGHTS EN BD
   */
  static async saveDepartmentInsights(
    accountId: string,
    departmentId: string,
    metrics: PeriodMetrics
  ) {
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(metrics);
    
    await prisma.departmentOnboardingInsight.upsert({
      where: {
        departmentId_periodStart_periodEnd: {  // ✅ CORREGIDO (era: departmentId_period)
          departmentId,
          periodStart: metrics.periodStart,
          periodEnd: metrics.periodEnd
        }
      },
      update: {
        totalJourneys: metrics.totalJourneys,
        completedJourneys: metrics.completedJourneys,
        activeJourneys: metrics.activeJourneys,
        atRiskJourneys: metrics.atRiskJourneys,
        avgEXOScore: metrics.avgEXOScore,
        avgComplianceScore: metrics.avgScores.compliance,
        avgClarificationScore: metrics.avgScores.clarification,
        avgCultureScore: metrics.avgScores.culture,
        avgConnectionScore: metrics.avgScores.connection,
        criticalAlerts: metrics.alerts.critical,
        highAlerts: metrics.alerts.high,
        mediumAlerts: metrics.alerts.medium,
        topIssues: metrics.topIssues as any,
        recommendations: recommendations as any,
        updatedAt: new Date()
      },
      create: {
        accountId,
        departmentId,
        periodStart: metrics.periodStart,  // ✅ CORREGIDO (era: period)
        periodEnd: metrics.periodEnd,      // ✅ AGREGADO
        totalJourneys: metrics.totalJourneys,
        completedJourneys: metrics.completedJourneys,
        activeJourneys: metrics.activeJourneys,
        atRiskJourneys: metrics.atRiskJourneys,
        avgEXOScore: metrics.avgEXOScore,
        avgComplianceScore: metrics.avgScores.compliance,
        avgClarificationScore: metrics.avgScores.clarification,
        avgCultureScore: metrics.avgScores.culture,
        avgConnectionScore: metrics.avgScores.connection,
        criticalAlerts: metrics.alerts.critical,
        highAlerts: metrics.alerts.high,
        mediumAlerts: metrics.alerts.medium,
        topIssues: metrics.topIssues as any,
        recommendations: recommendations as any
      }
    });
  }
  
  /**
   * ✅ COMPARAR DOS PERÍODOS
   */
  static async comparePeriods(
    accountId: string,
    departmentId: string,
    currentDate: Date,
    previousDate: Date
  ): Promise<ComparisonResult> {
    const [current, previous] = await Promise.all([
      this.calculateDepartmentMetrics(accountId, departmentId, currentDate),
      this.calculateDepartmentMetrics(accountId, departmentId, previousDate)
    ]);
    
    return {
      current,
      previous,
      delta: {
        totalJourneys: current.totalJourneys - previous.totalJourneys,
        avgEXOScore: current.avgEXOScore && previous.avgEXOScore
          ? current.avgEXOScore - previous.avgEXOScore
          : null,
        atRiskJourneys: current.atRiskJourneys - previous.atRiskJourneys
      }
    };
  }
  
  /**
   * ✅ AGREGAR TODAS LAS DEPARTAMENTOS DE UNA CUENTA
   */
  static async aggregateAllDepartments(accountId: string, date: Date = new Date()) {
    // Obtener todos los departamentos con journeys
    const departments = await prisma.department.findMany({
      where: {
        accountId,
        journeys: {
          some: {}
        }
      },
      select: {
        id: true,
        displayName: true
      }
    });
    
    const results = [];
    
    for (const dept of departments) {
      const metrics = await this.calculateDepartmentMetrics(accountId, dept.id, date);
      await this.saveDepartmentInsights(accountId, dept.id, metrics);
      
      results.push({
        departmentId: dept.id,
        departmentName: dept.displayName,
        metrics
      });
    }
    
    return results;
  }
  
  /**
   * ✅ OBTENER INSIGHTS GUARDADOS
   */
  static async getDepartmentInsights(
    departmentId: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    const where: any = { departmentId };
    
    if (periodStart && periodEnd) {
      where.periodStart = periodStart;
      where.periodEnd = periodEnd;
    }
    
    return await prisma.departmentOnboardingInsight.findMany({
      where,
      orderBy: { periodStart: 'desc' },  // ✅ CORREGIDO (era: period)
      take: (periodStart && periodEnd) ? 1 : 12  // Último año si no se especifica período
    });
  }
  
  /**
   * ✅ OBTENER TENDENCIAS (últimos 6 meses)
   */
  static async getTrends(accountId: string, departmentId: string) {
    const currentDate = new Date();
    const trends = [];
    
    for (let i = 0; i < 6; i++) {
      const date = subMonths(currentDate, i);
      const periodStart = startOfMonth(date);
      const periodEnd = endOfMonth(date);
      
      const insight = await prisma.departmentOnboardingInsight.findUnique({
        where: {
          departmentId_periodStart_periodEnd: {  // ✅ CORREGIDO (era: departmentId_period)
            departmentId,
            periodStart,
            periodEnd
          }
        }
      });
      
      if (insight) {
        trends.unshift({
          period: format(date, 'yyyy-MM'),
          avgEXOScore: insight.avgEXOScore,
          atRiskJourneys: insight.atRiskJourneys,
          totalJourneys: insight.totalJourneys
        });
      }
    }
    
    return trends;
  }
  
  /**
   * HELPERS PRIVADOS
   */
  private static calculateAverage(values: (number | null)[]): number | null {
    const validValues = values.filter(v => v !== null) as number[];
    if (validValues.length === 0) return null;
    return validValues.reduce((a, b) => a + b, 0) / validValues.length;
  }
  
  private static identifyTopIssues(alerts: any[]): Array<{ issue: string; count: number }> {
    const issueCount: Record<string, number> = {};
    
    alerts.forEach(alert => {
      const key = alert.dimension || alert.alertType;
      issueCount[key] = (issueCount[key] || 0) + 1;
    });
    
    return Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  private static generateRecommendations(metrics: PeriodMetrics): string[] {
    const recommendations: string[] = [];
    
    // Recomendación por proporción de riesgo
    if (metrics.totalJourneys > 0 && metrics.atRiskJourneys > metrics.totalJourneys * 0.3) {
      recommendations.push('🚨 Alta proporción de journeys en riesgo (>30%). Revisar proceso de onboarding');
    }
    
    // Recomendación por EXO Score bajo
    if (metrics.avgEXOScore && metrics.avgEXOScore < 70) {
      recommendations.push('⚠️ EXO Score departamental bajo (<70). Evaluar causas estructurales');
    }
    
    // Recomendación por top issue
    if (metrics.topIssues.length > 0) {
      const topIssue = metrics.topIssues[0];
      recommendations.push(`📊 Issue más frecuente: ${topIssue.issue} (${topIssue.count} casos)`);
    }
    
    // Recomendación por alertas críticas
    if (metrics.alerts.critical > 0) {
      recommendations.push(`🔥 ${metrics.alerts.critical} alertas críticas requieren atención inmediata`);
    }
    
    // Recomendación por tasa de completación
    if (metrics.totalJourneys > 0) {
      const completionRate = (metrics.completedJourneys / metrics.totalJourneys) * 100;
      
      if (completionRate < 50) {
        recommendations.push('📉 Baja tasa de completación (<50%). Revisar engagement y comunicación');
      }
    }
    
    // Recomendación por dimensión más débil
    const weakestDimension = this.identifyWeakestDimension(metrics.avgScores);
    if (weakestDimension) {
      recommendations.push(`🎯 Dimensión más débil: ${weakestDimension.name} (score: ${weakestDimension.score.toFixed(1)})`);
    }
    
    return recommendations;
  }
  
  private static identifyWeakestDimension(avgScores: PeriodMetrics['avgScores']): { name: string; score: number } | null {
    const dimensions = [
      { name: 'compliance', score: avgScores.compliance },
      { name: 'clarification', score: avgScores.clarification },
      { name: 'culture', score: avgScores.culture },
      { name: 'connection', score: avgScores.connection }
    ].filter(d => d.score !== null) as { name: string; score: number }[];
    
    if (dimensions.length === 0) return null;
    
    return dimensions.reduce((min, d) => 
      d.score < min.score ? d : min
    );
  }
}