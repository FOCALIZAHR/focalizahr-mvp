/**
 * EXIT AGGREGATION SERVICE
 * 
 * PROPÓSITO:
 * - LENTE 1: DepartmentExitInsight (histórico mensual por departamento)
 * - LENTE 2: Department.accumulated* (Gold Cache rolling 12 meses)
 * - Insights transversales para HR
 * 
 * ARQUITECTURA:
 * - Análogo a OnboardingAggregationService
 * - Ejecutado por CRON mensual (día 1)
 * - Calcula métricas agregadas por departamento
 * 
 * FÓRMULAS:
 * - Conservation Index: (avgEIS / avgOnboardingEXO) * 100
 * - Alert Prediction Rate: (exitsWithIgnoredAlerts / exitsWithOnboarding) * 100
 * 
 * @version 1.0
 * @date December 2025
 * @author FocalizaHR Team
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  FactorPriority, 
  ExitInsight,
  EIS_CLASSIFICATIONS 
} from '@/types/exit';
import { ExitAlertService } from './ExitAlertService';
// Al inicio del archivo agregar:
import type { 
  DepartmentExitMetrics, 
  ExitMetricsSummary 
} from '@/types/exit';


// ═══════════════════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════

interface ENPSResult {
  enps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
}

interface ExitRecordForAggregation {
  id: string;
  exitFactors: string[];
  exitFactorsDetail: any;
  eis: number | null;
  hadOnboarding: boolean;
  onboardingAlertsCount: number;
  onboardingIgnoredAlerts: number;
  onboardingManagedAlerts: number;
  onboardingEXOScore: number | null;
  participant: {
    id: string;
    responses: Array<{
      question: { questionOrder: number };
      rating: number | null;
    }>;
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Recomendaciones por factor de salida
 */
const FACTOR_RECOMMENDATIONS: Record<string, string> = {
  'Liderazgo de Apoyo': 'Programa de desarrollo de liderazgo. Evaluación 360° de jefaturas. Mentoring para líderes con equipos de alta rotación.',
  'Oportunidades de Crecimiento': 'Revisar planes de carrera. Crear programa de movilidad interna. Establecer conversaciones de desarrollo periódicas.',
  'Flexibilidad y Equilibrio': 'Evaluar políticas de trabajo remoto/híbrido. Revisar cargas de trabajo. Benchmarkear prácticas de flexibilidad vs competencia.',
  'Autonomía y Confianza': 'Capacitar líderes en delegación efectiva. Reducir micromanagement. Empoderar equipos en toma de decisiones.',
  'Reconocimiento y Valoración': 'Implementar programa de reconocimiento. Capacitar en feedback positivo. Crear rituales de celebración de logros.',
  'Compensación y Beneficios': 'Realizar estudio de competitividad salarial. Evaluar estructura de beneficios. Benchmark con industria.',
  'Relación con Compañeros': 'Fomentar actividades de integración. Revisar dinámicas de equipo. Identificar conflictos interpersonales.',
  'Carga de Trabajo': 'Auditar distribución de tareas. Revisar procesos para eficiencia. Evaluar necesidad de contrataciones.',
  'Claridad de Rol': 'Actualizar descripciones de cargo. Comunicar expectativas claramente. Alinear objetivos con roles.',
  'Herramientas y Recursos': 'Evaluar tecnología disponible. Invertir en herramientas necesarias. Capacitar en uso de recursos.',
  'Cultura Organizacional': 'Revisar valores y comportamientos. Alinear cultura con estrategia. Comunicar propósito organizacional.',
  'Seguridad Laboral': 'Reforzar protocolos Ley Karin. Crear canales de denuncia seguros. Capacitar en ambiente respetuoso.',
  'Ubicación/Traslado': 'Evaluar políticas de ubicación. Considerar opciones de trabajo remoto. Revisar casos de traslado.'
};


// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export class ExitAggregationService {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODO PRINCIPAL: AGREGACIÓN MENSUAL
  // ═══════════════════════════════════════════════════════════════════════════
  
/**
   * Ejecutar agregación mensual completa
   * Llamado por CRON el día 1 de cada mes
   * 
   * @param periodOverride - Período "YYYY-MM" opcional (para testing)
   */
  static async runMonthlyAggregation(periodOverride?: string): Promise<{
    success: boolean;
    accountsProcessed: number;
    departmentsProcessed: number;
    alertsCreated: number;
    errors: string[];
  }> {
    let periodStart: Date;
    let periodEnd: Date;
    let period: string;
    
    if (periodOverride && /^\d{4}-\d{2}$/.test(periodOverride)) {
      // Usar período especificado (para testing)
      const [year, month] = periodOverride.split('-').map(Number);
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0);
      period = periodOverride;
    } else {
      // Default: mes anterior
      const now = new Date();
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
      period = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}`;
    }
    
    console.log(`[ExitAggregation] 🚀 Starting monthly aggregation for ${period}`);
    console.log(`[ExitAggregation] 📅 Period: ${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]}`);
    
    const errors: string[] = [];
    let accountsProcessed = 0;
    let departmentsProcessed = 0;
    let alertsCreated = 0;
    
    try {
      // Obtener todas las cuentas activas
      const accounts = await prisma.account.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, companyName: true }
      });
      
      console.log(`[ExitAggregation] Processing ${accounts.length} accounts...`);
      
      for (const account of accounts) {
        try {
          const result = await this.aggregateAccount(
            account.id, 
            period, 
            periodStart, 
            periodEnd
          );
          
          departmentsProcessed += result.departmentsProcessed;
          alertsCreated += result.alertsCreated;
          accountsProcessed++;
          
          console.log(`[ExitAggregation] ✅ Account ${account.companyName}: ${result.departmentsProcessed} depts, ${result.alertsCreated} alerts`);
          
        } catch (error: any) {
          const errorMsg = `Account ${account.id}: ${error.message}`;
          console.error(`[ExitAggregation] ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
      
      console.log(`[ExitAggregation] ✅ Monthly aggregation completed:`, {
        accountsProcessed,
        departmentsProcessed,
        alertsCreated,
        errors: errors.length
      });
      
      return {
        success: errors.length === 0,
        accountsProcessed,
        departmentsProcessed,
        alertsCreated,
        errors
      };
      
    } catch (error: any) {
      console.error(`[ExitAggregation] ❌ Fatal error:`, error);
      return {
        success: false,
        accountsProcessed,
        departmentsProcessed,
        alertsCreated,
        errors: [`Fatal error: ${error.message}`]
      };
    }
  }
  
  /**
   * Agregar datos de una cuenta específica
   */
  private static async aggregateAccount(
    accountId: string,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ departmentsProcessed: number; alertsCreated: number }> {
    let departmentsProcessed = 0;
    let alertsCreated = 0;
    
    // Obtener departamentos activos con exits en el período
    const departments = await prisma.department.findMany({
      where: { 
        accountId, 
        isActive: true,
        exitRecords: {
          some: {
            exitDate: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        }
      },
      select: { id: true, displayName: true }
    });
    
    console.log(`[ExitAggregation] Account ${accountId}: ${departments.length} departments with exits`);
    
    for (const dept of departments) {
      try {
        // LENTE 1: Calcular DepartmentExitInsight
        await this.calculateDepartmentInsight(
          accountId, 
          dept.id, 
          period, 
          periodStart, 
          periodEnd
        );
        
        // LENTE 2: Actualizar Gold Cache
        await this.updateGoldCache(accountId, dept.id);
        
        // Verificar alertas departamentales
        const alerts = await ExitAlertService.checkDepartmentAlerts(
          accountId, 
          dept.id, 
          periodStart, 
          periodEnd
        );
        
        alertsCreated += alerts;
        departmentsProcessed++;
        
      } catch (error: any) {
        console.error(`[ExitAggregation] Error processing dept ${dept.displayName}:`, error.message);
      }
    }
    
    return { departmentsProcessed, alertsCreated };
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LENTE 1: DEPARTMENT EXIT INSIGHT (HISTÓRICO MENSUAL)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Calcular y guardar DepartmentExitInsight para un período
   */
  private static async calculateDepartmentInsight(
    accountId: string,
    departmentId: string,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    console.log(`[ExitAggregation] LENTE 1: Calculating insight for dept ${departmentId}, period ${period}`);
    
    // Obtener ExitRecords del período con datos completos
    const exitRecords = await prisma.exitRecord.findMany({
      where: {
        accountId,
        departmentId,
        exitDate: { 
          gte: periodStart, 
          lte: periodEnd 
        }
      },
      include: {
        participant: {
          include: {
            responses: {
              include: { question: true }
            }
          }
        }
      }
    }) as ExitRecordForAggregation[];
    
    const totalExits = exitRecords.length;
    
    if (totalExits === 0) {
      console.log(`[ExitAggregation] No exits for dept ${departmentId} in period ${period}`);
      return;
    }
    
    const completedExits = exitRecords.filter(r => r.eis !== null);
    const surveysCompleted = completedExits.length;
    
    // Calcular métricas básicas
    const voluntaryExits = exitRecords.filter(r => 
      (r as any).exitReason === 'voluntary'
    ).length;
    const involuntaryExits = exitRecords.filter(r => 
      (r as any).exitReason === 'termination'
    ).length;
    
    // Calcular promedio EIS
    const eisScores = completedExits.map(r => r.eis!).filter(Boolean);
    const avgEIS = eisScores.length > 0
      ? eisScores.reduce((a, b) => a + b, 0) / eisScores.length
      : null;
    
    // Top factores
    const topFactors = this.calculateTopFactors(completedExits);
    
    // Correlación onboarding
    const withOnboarding = completedExits.filter(r => r.hadOnboarding);
    const withOnboardingAlerts = withOnboarding.filter(r => r.onboardingAlertsCount > 0);
    const withIgnoredAlerts = withOnboarding.filter(r => r.onboardingIgnoredAlerts > 0);
    
    const avgOnboardingEXO = withOnboarding.length > 0
      ? withOnboarding
          .map(r => r.onboardingEXOScore)
          .filter((s): s is number => s !== null)
          .reduce((a, b, _, arr) => a + b / arr.length, 0) || null
      : null;
    
    // Conservation Index: qué % del score onboarding se conserva al salir
    const conservationIndex = avgEIS !== null && avgOnboardingEXO !== null && avgOnboardingEXO > 0
      ? (avgEIS / avgOnboardingEXO) * 100
      : null;
    
    // Alert Prediction Rate: qué % de exits tenían alertas ignoradas
    const alertPredictionRate = withOnboarding.length > 0
      ? (withIgnoredAlerts.length / withOnboarding.length) * 100
      : null;
    
    // eNPS desde responses
    const npsScores = await this.getNPSScores(completedExits);
    const enpsResult = this.calculateENPS(npsScores);
    
    // Obtener insight anterior para calcular trend
    const previousInsight = await prisma.departmentExitInsight.findFirst({
      where: {
        departmentId,
        period: this.getPreviousPeriod(period)
      }
    });

    const eisTrend = avgEIS !== null && previousInsight && previousInsight.avgEIS !== null
      ? Math.round((avgEIS - previousInsight.avgEIS) * 10) / 10
      : null;

    // Upsert insight
    await prisma.departmentExitInsight.upsert({
      where: {
        departmentId_period_periodType: {
          departmentId,
          period,
          periodType: 'monthly'
        }
      },
      update: {
        totalExits,
        voluntaryExits,
        involuntaryExits,
        surveysCompleted,
        avgEIS: avgEIS !== null ? Math.round(avgEIS * 10) / 10 : null,
        eisTrend,
        topExitFactors: topFactors as any,
        enps: enpsResult.enps,
        promoters: enpsResult.promoters,
        passives: enpsResult.passives,
        detractors: enpsResult.detractors,
        exitsWithOnboarding: withOnboarding.length,
        exitsWithOnboardingAlerts: withOnboardingAlerts.length,
        exitsWithIgnoredAlerts: withIgnoredAlerts.length,
        avgOnboardingEXOOfExits: avgOnboardingEXO !== null 
          ? Math.round(avgOnboardingEXO * 10) / 10 
          : null,
        conservationIndex: conservationIndex !== null 
          ? Math.round(conservationIndex * 10) / 10 
          : null,
        alertPredictionRate: alertPredictionRate !== null 
          ? Math.round(alertPredictionRate * 10) / 10 
          : null,
        calculatedAt: new Date()
      },
      create: {
        accountId,
        departmentId,
        period,
        periodType: 'monthly',
        periodStart,
        periodEnd,
        totalExits,
        voluntaryExits,
        involuntaryExits,
        surveysCompleted,
        avgEIS: avgEIS !== null ? Math.round(avgEIS * 10) / 10 : null,
        eisTrend,
        topExitFactors: topFactors as any,
        enps: enpsResult.enps,
        promoters: enpsResult.promoters,
        passives: enpsResult.passives,
        detractors: enpsResult.detractors,
        exitsWithOnboarding: withOnboarding.length,
        exitsWithOnboardingAlerts: withOnboardingAlerts.length,
        exitsWithIgnoredAlerts: withIgnoredAlerts.length,
        avgOnboardingEXOOfExits: avgOnboardingEXO !== null 
          ? Math.round(avgOnboardingEXO * 10) / 10 
          : null,
        conservationIndex: conservationIndex !== null 
          ? Math.round(conservationIndex * 10) / 10 
          : null,
        alertPredictionRate: alertPredictionRate !== null 
          ? Math.round(alertPredictionRate * 10) / 10 
          : null
      }
    });
    
    console.log(`[ExitAggregation] ✅ LENTE 1 saved for dept ${departmentId}:`, {
      period,
      totalExits,
      surveysCompleted,
      avgEIS,
      eisTrend
    });
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LENTE 2: GOLD CACHE (ROLLING 12 MESES)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Actualizar Gold Cache en Department (rolling 12 meses)
   */
  private static async updateGoldCache(
    accountId: string,
    departmentId: string
  ): Promise<void> {
    console.log(`[ExitAggregation] LENTE 2: Updating Gold Cache for dept ${departmentId}`);

    // Obtener últimos 12 meses de insights
    const insights = await prisma.departmentExitInsight.findMany({
      where: {
        departmentId,
        periodType: 'monthly'
      },
      orderBy: { periodStart: 'desc' },
      take: 12
    });

    if (insights.length === 0) {
      console.log(`[ExitAggregation] No insights for dept ${departmentId}, skipping Gold Cache`);
      return;
    }

    // Calcular promedios ponderados por surveysCompleted
    let totalWeight = 0;
    let weightedEIS = 0;
    let weightedENPS = 0;
    let enpsWeight = 0;
    let totalExits = 0;
    let totalVoluntaryExits = 0;
    let totalConservation = 0;
    let conservationCount = 0;

    // Agregar topFactors de todos los períodos
    const factorStats: Map<string, { mentions: number; severities: number[] }> = new Map();

    for (const insight of insights) {
      const weight = insight.surveysCompleted;
      totalWeight += weight;
      totalExits += insight.totalExits;
      totalVoluntaryExits += insight.voluntaryExits;

      if (insight.avgEIS !== null) {
        weightedEIS += insight.avgEIS * weight;
      }

      // eNPS ponderado por surveysCompleted
      if (insight.enps !== null && weight > 0) {
        weightedENPS += insight.enps * weight;
        enpsWeight += weight;
      }

      if (insight.conservationIndex !== null) {
        totalConservation += insight.conservationIndex;
        conservationCount++;
      }

      // Agregar factores de este período
      const factors = insight.topExitFactors as FactorPriority[] | null;
      if (factors) {
        for (const factor of factors) {
          const stats = factorStats.get(factor.factor) || { mentions: 0, severities: [] };
          stats.mentions += factor.mentions;
          stats.severities.push(factor.avgSeverity);
          factorStats.set(factor.factor, stats);
        }
      }
    }

    const accumulatedEIS = totalWeight > 0
      ? Math.round((weightedEIS / totalWeight) * 10) / 10
      : null;

    const accumulatedENPS = enpsWeight > 0
      ? Math.round((weightedENPS / enpsWeight) * 10) / 10
      : null;

    const accumulatedVoluntaryRate = totalExits > 0
      ? Math.round((totalVoluntaryExits / totalExits) * 1000) / 10
      : null;

    const accumulatedConservation = conservationCount > 0
      ? Math.round((totalConservation / conservationCount) * 10) / 10
      : null;

    // Calcular topFactors agregados (rolling 12 meses)
    const accumulatedTopFactors: FactorPriority[] = [];
    for (const [factor, stats] of factorStats) {
      const avgSeverity = stats.severities.length > 0
        ? stats.severities.reduce((a, b) => a + b, 0) / stats.severities.length
        : 3.0;

      const mentionRate = totalExits > 0 ? stats.mentions / totalExits : 0;
      const severityWeight = (5 - avgSeverity) / 4;
      const priority = Math.round(mentionRate * severityWeight * 100);

      accumulatedTopFactors.push({
        factor,
        mentions: stats.mentions,
        mentionRate: Math.round(mentionRate * 100) / 100,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        priority
      });
    }

    // Ordenar por prioridad y tomar top 5
    const topFactors = accumulatedTopFactors
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    // Actualizar Department
    await prisma.department.update({
      where: { id: departmentId },
      data: {
        accumulatedEISScore: accumulatedEIS,
        accumulatedExitCount: totalExits,
        accumulatedExitPeriodCount: insights.length,
        accumulatedExitLastUpdated: new Date(),
        accumulatedConservationIndex: accumulatedConservation,
        accumulatedExitTopFactors: topFactors.length > 0
          ? (topFactors as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
        accumulatedExitENPS: accumulatedENPS,
        accumulatedExitVoluntaryRate: accumulatedVoluntaryRate
      }
    });

    console.log(`[ExitAggregation] ✅ LENTE 2 updated for dept ${departmentId}:`, {
      accumulatedEIS,
      accumulatedENPS,
      accumulatedVoluntaryRate,
      totalExits,
      periods: insights.length,
      accumulatedConservation,
      topFactorsCount: topFactors.length
    });
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS TRANSVERSALES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Generar insights transversales para HR
   * Analiza patrones a nivel empresa
   */
  static async generateInsights(accountId: string): Promise<ExitInsight[]> {
    const insights: ExitInsight[] = [];
    
    // Obtener datos agregados últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const deptInsights = await prisma.departmentExitInsight.findMany({
      where: {
        accountId,
        periodStart: { gte: sixMonthsAgo }
      }
    });
    
    if (deptInsights.length === 0) {
      return [];
    }
    
    // Agregar datos a nivel empresa
    const companyFactors: Map<string, { mentions: number; severities: number[] }> = new Map();
    let totalExits = 0;
    let totalConservation = 0;
    let conservationCount = 0;
    let totalAlertPrediction = 0;
    let alertPredictionCount = 0;
    
    for (const insight of deptInsights) {
      totalExits += insight.totalExits;
      
      if (insight.conservationIndex !== null) {
        totalConservation += insight.conservationIndex;
        conservationCount++;
      }
      
      if (insight.alertPredictionRate !== null) {
        totalAlertPrediction += insight.alertPredictionRate;
        alertPredictionCount++;
      }
      
      const factors = insight.topExitFactors as FactorPriority[] | null;
      if (factors) {
        for (const factor of factors) {
          const stats = companyFactors.get(factor.factor) || { mentions: 0, severities: [] };
          stats.mentions += factor.mentions;
          stats.severities.push(factor.avgSeverity);
          companyFactors.set(factor.factor, stats);
        }
      }
    }
    
    // Insight 1: Factor frecuente (≥40%)
    for (const [factor, stats] of companyFactors) {
      const mentionRate = totalExits > 0 ? stats.mentions / totalExits : 0;
      if (mentionRate >= 0.4) {
        const avgSeverity = stats.severities.reduce((a, b) => a + b, 0) / stats.severities.length;
        
        insights.push({
          type: 'factor_frecuente',
          severity: avgSeverity <= 2.0 ? 'critical' : 'warning',
          title: `${Math.round(mentionRate * 100)}% menciona "${factor}"`,
          description: `El ${Math.round(mentionRate * 100)}% de las salidas en los últimos 6 meses mencionan "${factor}" como factor de su decisión, con severidad promedio ${avgSeverity.toFixed(1)}/5.`,
          data: { 
            factor, 
            mentionRate: Math.round(mentionRate * 100), 
            avgSeverity: Math.round(avgSeverity * 10) / 10, 
            mentions: stats.mentions 
          },
          recommendation: FACTOR_RECOMMENDATIONS[factor] || 'Analizar causas raíz y diseñar plan de mejora específico.'
        });
      }
    }
    
    // Insight 2: Conservation Index bajo
    if (conservationCount > 0) {
      const avgConservation = totalConservation / conservationCount;
      if (avgConservation < 60) {
        insights.push({
          type: 'correlacion_onboarding',
          severity: 'critical',
          title: `Conservation Index: ${Math.round(avgConservation)}%`,
          description: `La organización pierde ${100 - Math.round(avgConservation)} puntos de satisfacción entre onboarding y salida. Los colaboradores entran ilusionados y salen frustrados.`,
          data: { conservationIndex: Math.round(avgConservation) },
          recommendation: 'Investigar qué ocurre entre el onboarding y la salida. Mapear momentos críticos de deterioro de la experiencia. Revisar feedback de pulsos intermedios.'
        });
      }
    }
    
    // Insight 3: Alert Prediction Rate alto
    if (alertPredictionCount > 0) {
      const avgPrediction = totalAlertPrediction / alertPredictionCount;
      if (avgPrediction > 60) {
        insights.push({
          type: 'correlacion_onboarding',
          severity: 'warning',
          title: `${Math.round(avgPrediction)}% de salidas tenían alertas ignoradas`,
          description: `El ${Math.round(avgPrediction)}% de las personas que dejaron la empresa tuvieron alertas de onboarding que fueron ignoradas. Gestionar alertas a tiempo podría prevenir parte de esta rotación.`,
          data: { alertPredictionRate: Math.round(avgPrediction) },
          recommendation: 'Reforzar seguimiento de alertas onboarding. Crear protocolo de intervención temprana. Medir ROI de alertas gestionadas vs ignoradas.'
        });
      }
    }
    
    // Insight 4: Tendencia EIS
    const recentInsights = deptInsights
      .filter(i => i.avgEIS !== null)
      .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
    
    if (recentInsights.length >= 3) {
      const recent = recentInsights.slice(0, 3);
      const older = recentInsights.slice(3, 6);
      
      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + (b.avgEIS || 0), 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + (b.avgEIS || 0), 0) / older.length;
        const trend = recentAvg - olderAvg;
        
        if (Math.abs(trend) > 5) {
          insights.push({
            type: 'tendencia',
            severity: trend < 0 ? 'warning' : 'info',
            title: `Tendencia EIS: ${trend > 0 ? '↑' : '↓'} ${Math.abs(Math.round(trend))} puntos`,
            description: trend < 0
              ? `El EIS promedio ha bajado ${Math.abs(Math.round(trend))} puntos en los últimos 3 meses. Las salidas recientes son más problemáticas.`
              : `El EIS promedio ha subido ${Math.round(trend)} puntos en los últimos 3 meses. Las condiciones de salida están mejorando.`,
            data: { 
              trend: Math.round(trend * 10) / 10, 
              recentAvg: Math.round(recentAvg), 
              olderAvg: Math.round(olderAvg) 
            },
            recommendation: trend < 0
              ? 'Identificar qué cambió en los últimos 3 meses. Revisar si hay eventos organizacionales correlacionados.'
              : 'Documentar las mejoras implementadas para replicar en otras áreas.'
          });
        }
      }
    }
    
    // Ordenar por severidad
    return insights.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Calcular top factores con prioridad
   */
  private static calculateTopFactors(
    exitRecords: Array<{ exitFactors: string[]; exitFactorsDetail: any }>
  ): FactorPriority[] {
    const totalExits = exitRecords.length;
    if (totalExits === 0) return [];
    
    const factorStats: Map<string, { mentions: number; severities: number[] }> = new Map();
    
    for (const record of exitRecords) {
      const detail = record.exitFactorsDetail as Record<string, number> | null;
      
      for (const factor of record.exitFactors) {
        const stats = factorStats.get(factor) || { mentions: 0, severities: [] };
        stats.mentions++;
        
        if (detail && detail[factor]) {
          stats.severities.push(detail[factor]);
        }
        
        factorStats.set(factor, stats);
      }
    }
    
    const priorities: FactorPriority[] = [];
    
    for (const [factor, stats] of factorStats) {
      const avgSeverity = stats.severities.length > 0
        ? stats.severities.reduce((a, b) => a + b, 0) / stats.severities.length
        : 3.0;
      
      const mentionRate = stats.mentions / totalExits;
      
      // Prioridad = menciones * (5 - severidad) / 4
      // Mayor cuando más menciones Y peor severidad (más bajo)
      const severityWeight = (5 - avgSeverity) / 4;
      const priority = Math.round(mentionRate * severityWeight * 100);
      
      priorities.push({
        factor,
        mentions: stats.mentions,
        mentionRate: Math.round(mentionRate * 100) / 100,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        priority
      });
    }
    
    return priorities.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Obtener scores NPS desde Response
   */
  private static async getNPSScores(
    exitRecords: ExitRecordForAggregation[]
  ): Promise<number[]> {
    const scores: number[] = [];
    
    for (const record of exitRecords) {
      const npsResponse = record.participant.responses.find(
        r => r.question.questionOrder === 8
      );
      
      if (npsResponse?.rating !== null && npsResponse?.rating !== undefined) {
        scores.push(npsResponse.rating);
      }
    }
    
    return scores;
  }
  
  /**
   * Calcular eNPS
   */
  private static calculateENPS(scores: number[]): ENPSResult {
    if (scores.length === 0) {
      return { enps: null, promoters: 0, passives: 0, detractors: 0 };
    }
    
    const promoters = scores.filter(s => s >= 9).length;
    const passives = scores.filter(s => s >= 7 && s <= 8).length;
    const detractors = scores.filter(s => s <= 6).length;
    const enps = ((promoters - detractors) / scores.length) * 100;
    
    return {
      enps: Math.round(enps * 10) / 10,
      promoters,
      passives,
      detractors
    };
  }
  
  /**
   * Obtener período anterior (formato YYYY-MM)
   */
  private static getPreviousPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month - 2 porque month es 1-based
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  }
  

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS DE CONSULTA (Dashboard)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ranking departamentos con métricas completas para componentes
   */
  static async getDepartmentRanking(
    accountId: string,
    options?: { allowedDepartmentIds?: string[] }
  ): Promise<DepartmentExitMetrics[]> {
    const whereClause: any = {
      accountId,
      isActive: true,
      accumulatedEISScore: { not: null }
    };

    if (options?.allowedDepartmentIds) {
      whereClause.id = { in: options.allowedDepartmentIds };
    }

    // Query departamentos con alertas
    const departments = await prisma.department.findMany({
      where: whereClause,
      select: {
        id: true,
        displayName: true,
        standardCategory: true,
        level: true,
        parentId: true,
        accumulatedEISScore: true,
        accumulatedExitCount: true,
        accumulatedConservationIndex: true,
        accumulatedExitTopFactors: true,
        accumulatedExitENPS: true,
        accumulatedExitVoluntaryRate: true,
        _count: {
          select: {
            exitAlerts: {
              where: { status: 'pending' }
            }
          }
        }
      },
      orderBy: { accumulatedEISScore: 'asc' }
    });

    // Contar alertas críticas por departamento
    const criticalAlertsByDept = await prisma.exitAlert.groupBy({
      by: ['departmentId'],
      where: {
        accountId,
        status: 'pending',
        severity: 'critical',
        departmentId: { in: departments.map(d => d.id) }
      },
      _count: true
    });

    const criticalMap = new Map(
      criticalAlertsByDept.map(a => [a.departmentId, a._count])
    );

    return departments.map(d => ({
      departmentId: d.id,
      departmentName: d.displayName,
      standardCategory: d.standardCategory,
      level: d.level,
      parentId: d.parentId,
      totalExits: d.accumulatedExitCount || 0,
      avgEIS: d.accumulatedEISScore,
      conservationIndex: d.accumulatedConservationIndex,
      topFactors: d.accumulatedExitTopFactors as FactorPriority[] | null,
      enps: d.accumulatedExitENPS,
      voluntaryRate: d.accumulatedExitVoluntaryRate,
      pendingAlerts: d._count.exitAlerts,
      criticalAlerts: criticalMap.get(d.id) || 0
    }));
  }

  /**
   * Métricas globales Exit completas
   */
  static async getGlobalMetrics(
    accountId: string,
    options?: { allowedDepartmentIds?: string[] }
  ): Promise<ExitMetricsSummary> {
    const deptWhere: any = {
      accountId,
      isActive: true,
      accumulatedEISScore: { not: null }
    };

    const alertWhere: any = { accountId, status: 'pending' };
    const exitWhere: any = {
      accountId,
      exitDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
    };

    if (options?.allowedDepartmentIds) {
      deptWhere.id = { in: options.allowedDepartmentIds };
      alertWhere.departmentId = { in: options.allowedDepartmentIds };
      exitWhere.departmentId = { in: options.allowedDepartmentIds };
    }

    const [depts, pending, critical, leyKarin, total] = await Promise.all([
      prisma.department.findMany({
        where: deptWhere,
        select: {
          accumulatedEISScore: true,
          accumulatedExitCount: true,
          accumulatedExitTopFactors: true
        }
      }),
      prisma.exitAlert.count({ where: alertWhere }),
      prisma.exitAlert.count({ where: { ...alertWhere, severity: 'critical' } }),
      prisma.exitAlert.count({ where: { ...alertWhere, alertType: 'ley_karin' } }),
      prisma.exitRecord.count({ where: exitWhere })
    ]);

    const withData = depts.filter(d => d.accumulatedEISScore);
    const avg = withData.length > 0
      ? withData.reduce((a, d) => a + (d.accumulatedEISScore || 0), 0) / withData.length
      : null;

    // Calcular topFactorsGlobal agregando factores de todos los departamentos
    const globalFactorStats: Map<string, { mentions: number; severities: number[] }> = new Map();
    let globalTotalExits = 0;

    for (const dept of depts) {
      globalTotalExits += dept.accumulatedExitCount || 0;
      const factors = dept.accumulatedExitTopFactors as FactorPriority[] | null;
      if (factors) {
        for (const factor of factors) {
          const stats = globalFactorStats.get(factor.factor) || { mentions: 0, severities: [] };
          stats.mentions += factor.mentions;
          stats.severities.push(factor.avgSeverity);
          globalFactorStats.set(factor.factor, stats);
        }
      }
    }

    const topFactorsGlobal: FactorPriority[] = [];
    for (const [factor, stats] of globalFactorStats) {
      const avgSeverity = stats.severities.length > 0
        ? stats.severities.reduce((a, b) => a + b, 0) / stats.severities.length
        : 3.0;

      const mentionRate = globalTotalExits > 0 ? stats.mentions / globalTotalExits : 0;
      const severityWeight = (5 - avgSeverity) / 4;
      const priority = Math.round(mentionRate * severityWeight * 100);

      topFactorsGlobal.push({
        factor,
        mentions: stats.mentions,
        mentionRate: Math.round(mentionRate * 100) / 100,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        priority
      });
    }

    // Ordenar por prioridad y tomar top 5
    const sortedTopFactors = topFactorsGlobal
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    return {
      totalDepartments: depts.length,
      totalExits: total,
      globalAvgEIS: avg ? Math.round(avg * 10) / 10 : null,
      topFactorsGlobal: sortedTopFactors.length > 0 ? sortedTopFactors : null,
      alerts: {
        pending,
        critical,
        leyKarin
      }
    };
  }
}