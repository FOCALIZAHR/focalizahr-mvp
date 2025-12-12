// src/lib/services/OnboardingEffectivenessAnalyzer.ts
// ============================================================================
// ONBOARDING EFFECTIVENESS ANALYZER - FASE 1 (SIMPLE)
// ============================================================================
/**
 * Servicio análisis efectividad sistema alertas onboarding
 * Ejecutado mensualmente por cron job
 * 
 * FASE 1 (AHORA):
 * - Correlación simple: Gestionadas vs Ignoradas
 * - Métricas: Retención + Score Improvement
 * - ROI demostrado básico
 * - NO analiza contenido resolutionNotes
 * 
 * FASE 2 (FUTURO - 6-12 meses):
 * - NLP categorización automática notas
 * - Efectividad por tipo estrategia
 * - ML recomendaciones predictivas
 */

import { prisma } from '@/lib/prisma';
import { calculateTurnoverCostSHRM2024 } from '@/lib/financialCalculations';

// ============================================================================
// INTERFACES
// ============================================================================

interface AlertOutcome {
  alertId: string;
  employeeRetained: boolean;
  scoreImproved: boolean;
  scoreChange: number;
}

interface EffectivenessMetrics {
  retained: number;
  scoreImproved: number;
  totalScoreChange: number;
  avgScoreChange: number;
}

interface AnalysisResult {
  period: string;
  accountId: string;
  totalAlerts: number;
  managed: {
    count: number;
    retained: number;
    retentionRate: number;
    avgScoreChange: number;
  };
  ignored: {
    count: number;
    retained: number;
    retentionRate: number;
    avgScoreChange: number;
  };
  delta: {
    retentionDelta: number;    // +55 puntos porcentuales
    estimatedROI: number;       // $86.4M CLP
  };
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

export class OnboardingEffectivenessAnalyzer {
  
  /**
   * MÉTODO PRINCIPAL - Ejecutado por cron mensual
   * Analiza efectividad alertas mes anterior
   */
  static async analyzeMonthlyEffectiveness(
    accountId: string,
    period?: string // "2025-11" opcional, default: mes anterior
  ): Promise<AnalysisResult> {
    
    // Determinar período a analizar (mes anterior por defecto)
    const analyzePeriod = period || this.getLastMonth();
    const [year, month] = analyzePeriod.split('-').map(Number);
    
    // Fechas del período
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);
    
    console.log(`[OnboardingAnalyzer] Analizando período: ${analyzePeriod}`);
    console.log(`  Rango: ${periodStart.toISOString()} → ${periodEnd.toISOString()}`);
    
    // 1. Obtener alertas del período
    const alerts = await prisma.journeyAlert.findMany({
      where: {
        accountId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        journey: {
          select: {
            id: true,
            status: true,
            exoScore: true,
            retentionRisk: true
          }
        }
      }
    });
    
    console.log(`[OnboardingAnalyzer] Total alertas encontradas: ${alerts.length}`);
    
    if (alerts.length === 0) {
      console.log(`[OnboardingAnalyzer] Sin alertas para analizar en período ${analyzePeriod}`);
      return this.createEmptyResult(accountId, analyzePeriod);
    }
    
    // 2. Clasificar alertas por gestión
    const managed = alerts.filter(a =>
      a.status === 'acknowledged' || a.status === 'resolved'
    );
    const ignored = alerts.filter(a => a.status === 'pending')
    
    console.log(`  Gestionadas: ${managed.length}`);
    console.log(`  Ignoradas: ${ignored.length}`);
    
    // 3. Medir outcomes 60 días después (solo si han pasado esos 60 días)
    const daysPassedSinceEnd = Math.floor(
      (Date.now() - periodEnd.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysPassedSinceEnd < 60) {
      console.log(`[OnboardingAnalyzer] Solo han pasado ${daysPassedSinceEnd} días. Esperando 60 días para análisis completo.`);
      return this.createPartialResult(accountId, analyzePeriod, managed.length, ignored.length);
    }
    
    const managedOutcomes = await this.measureOutcomes(managed);
    const ignoredOutcomes = await this.measureOutcomes(ignored);
    
    // 4. Calcular métricas
    const managedRetentionRate = managed.length > 0 
      ? managedOutcomes.retained / managed.length 
      : 0;
    
    const ignoredRetentionRate = ignored.length > 0 
      ? ignoredOutcomes.retained / ignored.length 
      : 0;
    
    const retentionDelta = managedRetentionRate - ignoredRetentionRate;
    
    // 5. Calcular ROI estimado
    const avgTurnoverCost = calculateTurnoverCostSHRM2024(900000); // $900K anual promedio
    const employeesSaved = Math.round(managed.length * retentionDelta);
    const estimatedROI = employeesSaved * avgTurnoverCost;
    
    console.log(`[OnboardingAnalyzer] Resultados:`);
    console.log(`  Retención gestionadas: ${(managedRetentionRate * 100).toFixed(1)}%`);
    console.log(`  Retención ignoradas: ${(ignoredRetentionRate * 100).toFixed(1)}%`);
    console.log(`  Delta: +${(retentionDelta * 100).toFixed(1)} puntos porcentuales`);
    console.log(`  ROI estimado: $${(estimatedROI / 1000000).toFixed(1)}M CLP`);
    
    // 6. Guardar insights en BD
    const result: AnalysisResult = {
      period: analyzePeriod,
      accountId,
      totalAlerts: alerts.length,
      managed: {
        count: managed.length,
        retained: managedOutcomes.retained,
        retentionRate: managedRetentionRate,
        avgScoreChange: managedOutcomes.avgScoreChange
      },
      ignored: {
        count: ignored.length,
        retained: ignoredOutcomes.retained,
        retentionRate: ignoredRetentionRate,
        avgScoreChange: ignoredOutcomes.avgScoreChange
      },
      delta: {
        retentionDelta,
        estimatedROI
      }
    };
    
    await this.saveInsight(result);
    
    return result;
  }
  
  // ============================================================================
  // HELPER: MEDIR OUTCOMES
  // ============================================================================
  
  /**
   * Mide outcomes de un set de alertas 60 días después
   */
  private static async measureOutcomes(
    alerts: any[]
  ): Promise<EffectivenessMetrics> {
    
    let retained = 0;
    let scoreImproved = 0;
    let totalScoreChange = 0;
    
    for (const alert of alerts) {
      const journey = alert.journey;
      
      if (!journey) continue;
      
      // 1. Empleado sigue activo?
      if (journey.status === 'active' || journey.status === 'completed') {
        retained++;
      }
      
      // 2. Score mejoró vs baseline?
      const baselineScore = alert.score || 0;
      const currentScore = journey.exoScore || 0;
      const scoreChange = currentScore - baselineScore;
      
      totalScoreChange += scoreChange;
      
      if (scoreChange > 10) {
        scoreImproved++;
      }
    }
    
    const avgScoreChange = alerts.length > 0 
      ? totalScoreChange / alerts.length 
      : 0;
    
    return {
      retained,
      scoreImproved,
      totalScoreChange,
      avgScoreChange
    };
  }
  
  // ============================================================================
  // HELPER: GUARDAR INSIGHTS
  // ============================================================================
  
  private static async saveInsight(result: AnalysisResult): Promise<void> {
    await prisma.onboardingEffectivenessInsight.upsert({
      where: {
        accountId_period: {
          accountId: result.accountId,
          period: result.period
        }
      },
      create: {
        accountId: result.accountId,
        period: result.period,
        totalAlerts: result.totalAlerts,
        
        managedCount: result.managed.count,
        managedRetained: result.managed.retained,
        managedRetentionRate: result.managed.retentionRate,
        managedAvgScoreChange: result.managed.avgScoreChange,
        
        ignoredCount: result.ignored.count,
        ignoredRetained: result.ignored.retained,
        ignoredRetentionRate: result.ignored.retentionRate,
        ignoredAvgScoreChange: result.ignored.avgScoreChange,
        
        retentionDelta: result.delta.retentionDelta,
        estimatedROI: result.delta.estimatedROI
      },
      update: {
        totalAlerts: result.totalAlerts,
        
        managedCount: result.managed.count,
        managedRetained: result.managed.retained,
        managedRetentionRate: result.managed.retentionRate,
        managedAvgScoreChange: result.managed.avgScoreChange,
        
        ignoredCount: result.ignored.count,
        ignoredRetained: result.ignored.retained,
        ignoredRetentionRate: result.ignored.retentionRate,
        ignoredAvgScoreChange: result.ignored.avgScoreChange,
        
        retentionDelta: result.delta.retentionDelta,
        estimatedROI: result.delta.estimatedROI,
        
        updatedAt: new Date()
      }
    });
    
    console.log(`[OnboardingAnalyzer] Insight guardado para período ${result.period}`);
  }
  
  // ============================================================================
  // HELPER: RESULTADOS VACÍOS/PARCIALES
  // ============================================================================
  
  private static createEmptyResult(
    accountId: string, 
    period: string
  ): AnalysisResult {
    return {
      period,
      accountId,
      totalAlerts: 0,
      managed: {
        count: 0,
        retained: 0,
        retentionRate: 0,
        avgScoreChange: 0
      },
      ignored: {
        count: 0,
        retained: 0,
        retentionRate: 0,
        avgScoreChange: 0
      },
      delta: {
        retentionDelta: 0,
        estimatedROI: 0
      }
    };
  }
  
  private static createPartialResult(
    accountId: string,
    period: string,
    managedCount: number,
    ignoredCount: number
  ): AnalysisResult {
    return {
      period,
      accountId,
      totalAlerts: managedCount + ignoredCount,
      managed: {
        count: managedCount,
        retained: 0,
        retentionRate: 0,
        avgScoreChange: 0
      },
      ignored: {
        count: ignoredCount,
        retained: 0,
        retentionRate: 0,
        avgScoreChange: 0
      },
      delta: {
        retentionDelta: 0,
        estimatedROI: 0
      }
    };
  }
  
  // ============================================================================
  // HELPER: PERÍODO
  // ============================================================================
  
  private static getLastMonth(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = String(lastMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  
  // ============================================================================
  // API PÚBLICA - Obtener insights guardados
  // ============================================================================
  
  /**
   * Obtener insights efectividad de un período
   */
  static async getInsightsForPeriod(
    accountId: string,
    period: string
  ) {
    return await prisma.onboardingEffectivenessInsight.findUnique({
      where: {
        accountId_period: {
          accountId,
          period
        }
      }
    });
  }
  
  /**
   * Obtener últimos N insights de una cuenta
   */
  static async getLatestInsights(
    accountId: string,
    limit: number = 6
  ) {
    return await prisma.onboardingEffectivenessInsight.findMany({
      where: { accountId },
      orderBy: { period: 'desc' },
      take: limit
    });
  }
  
  /**
   * Ejecutar análisis para todas las cuentas (cron global)
   */
  static async analyzeAllAccounts(period?: string): Promise<void> {
    console.log('[OnboardingAnalyzer] Iniciando análisis global...');
    
    const accounts = await prisma.account.findMany({
      where: { 
        role: {
          not: 'FOCALIZAHR_ADMIN' // No analizar cuenta admin
        }
      },
      select: { id: true, companyName: true }
    });
    
    console.log(`[OnboardingAnalyzer] Analizando ${accounts.length} cuentas...`);
    
    for (const account of accounts) {
      try {
        console.log(`\n[OnboardingAnalyzer] Procesando: ${account.companyName}`);
        await this.analyzeMonthlyEffectiveness(account.id, period);
      } catch (error) {
        console.error(`[OnboardingAnalyzer] Error en cuenta ${account.id}:`, error);
        // Continuar con siguiente cuenta
      }
    }
    
    console.log('\n[OnboardingAnalyzer] Análisis global completado');
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default OnboardingEffectivenessAnalyzer;