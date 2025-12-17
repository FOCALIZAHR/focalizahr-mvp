// src/lib/services/OnboardingAlertService.ts
// ✅ COMPLETO Y FINAL: 6 alertas específicas + todos los métodos públicos restaurados
// 🔧 CAMBIOS APLICADOS: Eliminados checkLowScores() y checkRiskEscalation()
// 🆕 V2.0: Agregado trend + history 12 meses en getAlertStatistics
// 🏗️ V2.1: Tipos explícitos enterprise (AlertStatistics interface)
// 🔧 V2.2: normalizedScore con fallback robusto (backward compatibility)

import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { JourneyAlert } from '@prisma/client';
import { AlertStatistics, TrendDirection } from '@/types/onboarding';
import { calculateNormalizedScore } from '@/lib/utils/responseNormalizer';

export class OnboardingAlertService {
  
  private static SLA_CONFIG: Record<string, number> = {
    critical: 4,
    high: 24,
    medium: 72,
    low: 168
  };

  // ════════════════════════════════════════════════════════════
// TODAS LAS 6 ALERTAS - VERSIÓN FINAL CORRECTA
// ════════════════════════════════════════════════════════════

private static ALERT_DEFINITIONS = [
  // 1. ABANDONO_DIA_1
  {
    type: 'ABANDONO_DIA_1',
    stage: 1,
    questionOrder: 2,
    campaignTypeSlug: 'onboarding-day-1',
    condition: (response: any) => {
      // ✅ USA normalizedScore (no texto)
      return response.normalizedScore !== null && response.normalizedScore <= 1.0;
    },
    severity: 'critical' as const,
    slaHours: 24,
    titleTemplate: (name: string) => `🚨 ABANDONO DÍA 1: ${name}`,
    descriptionTemplate: (name: string) => 
      `${name} reporta que nadie le recibió personalmente en su primer día.`
  },
  
  // 2. BIENVENIDA_FALLIDA
  {
    type: 'BIENVENIDA_FALLIDA',
    stage: 1,
    questionOrder: 1,
    campaignTypeSlug: 'onboarding-day-1',
    condition: (response: any) => {
      // ✅ USA normalizedScore (no rating)
      return response.normalizedScore !== null && response.normalizedScore <= 2.0;
    },
    severity: 'critical' as const,
    slaHours: 48,
    titleTemplate: (name: string) => `🚨 BIENVENIDA FALLIDA: ${name}`,
    descriptionTemplate: (name: string, score?: number) => 
      `${name} calificó la preparación logística con ${score}/5.`
  },
  
  // 3. CONFUSION_ROL
  {
    type: 'CONFUSION_ROL',
    stage: 2,
    questionOrder: 1,
    campaignTypeSlug: 'onboarding-day-7',
    condition: (response: any) => {
      // ✅ USA normalizedScore (no rating)
      return response.normalizedScore !== null && response.normalizedScore <= 2.0;
    },
    severity: 'high' as const,
    slaHours: 72,
    titleTemplate: (name: string) => `⚠️ CONFUSIÓN DE ROL: ${name}`,
    descriptionTemplate: (name: string, score?: number) => 
      `${name} reporta baja claridad sobre expectativas del rol (${score}/5).`
  },
  
  // 4. DESAJUSTE_ROL
  {
    type: 'DESAJUSTE_ROL',
    stage: 2,
    questionOrder: 4,
    campaignTypeSlug: 'onboarding-day-7',
    condition: (response: any) => {
      // ✅ USA normalizedScore (no texto)
      return response.normalizedScore !== null && response.normalizedScore <= 2.0;
    },
    severity: 'critical' as const,
    slaHours: 48,
    titleTemplate: (name: string) => `🚨 DESAJUSTE DE ROL: ${name}`,
    descriptionTemplate: (name: string) => 
      `${name} indica que las tareas no coinciden con la descripción del puesto.`
  },
  
  // 5. RIESGO_FUGA
  {
    type: 'RIESGO_FUGA',
    stage: 3,
    questionOrder: 1,
    campaignTypeSlug: 'onboarding-day-30',
    condition: (response: any) => {
      // ✅ USA normalizedScore (no texto)
      return response.normalizedScore !== null && response.normalizedScore <= 2.0;
    },
    severity: 'critical' as const,
    slaHours: 24,
    titleTemplate: (name: string) => `🔴 RIESGO DE FUGA: ${name}`,
    descriptionTemplate: (name: string) => 
      `${name} declaró que no se ve trabajando en la empresa en un año.`
  },
  
  // 6. DETRACTOR_CULTURAL
  {
    type: 'DETRACTOR_CULTURAL',
    stage: 4,
    questionOrder: 1,
    campaignTypeSlug: 'onboarding-day-90',
    condition: (response: any) => {
      // ✅ USA normalizedScore (no rating)
      // NPS 0-10 → normalizedScore 0-5 (dividido por 2)
      // Detractor: rating <= 6 → normalizedScore <= 3.0
      return response.normalizedScore !== null && response.normalizedScore <= 3.0;
    },
    severity: 'high' as const,
    slaHours: 72,
    titleTemplate: (name: string) => `⚠️ DETRACTOR CULTURAL: ${name}`,
    descriptionTemplate: (name: string, score?: number) => 
      `${name} es detractor (eNPS: ${score ? Math.round(score * 2) : 0}/10).`
  }
]
  // ============================================================================
  // MÉTODO PRINCIPAL: DETECTAR Y CREAR ALERTAS
  // ============================================================================
  
  /**
   * ✅ DETECTAR Y CREAR ALERTAS AUTOMÁTICAS
   */
  static async detectAndCreateAlerts(journeyId: string): Promise<JourneyAlert[]> {
    const createdAlerts: JourneyAlert[] = [];
    
    console.log('[OnboardingAlertService] detectAndCreateAlerts - journeyId:', journeyId);
    
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId },
      include: {
        alerts: {
          where: { status: 'pending' }
        }
      }
    });
    
    if (!journey) {
      console.log('[OnboardingAlertService] Journey no encontrado');
      return createdAlerts;
    }

    // ============================================================================
    // 🆕 PRIORIDAD 1: ALERTAS ESPECÍFICAS POR PREGUNTAS (LAS 6 CRÍTICAS)
    // ============================================================================
    console.log('[OnboardingAlertService] Checking specific alerts...');
    const specificAlerts = await this.checkSpecificAlerts(journey);
    createdAlerts.push(...specificAlerts);
    console.log(`[OnboardingAlertService] Specific alerts created: ${specificAlerts.length}`);
    
    // ============================================================================
    // PRIORIDAD 2: ALERTAS POR STAGES INCOMPLETOS
    // ============================================================================
    console.log('[OnboardingAlertService] Checking incomplete stages...');
    const incompleteAlerts = await this.checkIncompleteStages(journey);
    createdAlerts.push(...incompleteAlerts);
    console.log(`[OnboardingAlertService] Incomplete stage alerts created: ${incompleteAlerts.length}`);
    
    console.log(`[OnboardingAlertService] Total alerts created: ${createdAlerts.length}`);
    return createdAlerts;
  }

  // ============================================================================
  // 🆕 MÉTODO NUEVO: CHECK SPECIFIC ALERTS
  // ============================================================================
  
  /**
   * ✅ ALERTAS ESPECÍFICAS POR PREGUNTAS INDIVIDUALES
   * 
   * Este método detecta las 6 alertas críticas basadas en respuestas específicas
   * de preguntas concretas en cada stage.
   */
  private static async checkSpecificAlerts(journey: any): Promise<JourneyAlert[]> {
    const createdAlerts: JourneyAlert[] = [];
    
    try {
      // Obtener el participantId del stage actual
      const stageParticipantMap: Record<number, string | null> = {
        1: journey.stage1ParticipantId,
        2: journey.stage2ParticipantId,
        3: journey.stage3ParticipantId,
        4: journey.stage4ParticipantId
      };

      // Procesar cada definición de alerta
      for (const definition of this.ALERT_DEFINITIONS) {
        console.log(`[checkSpecificAlerts] Checking ${definition.type} for stage ${definition.stage}`);
        
        const participantId = stageParticipantMap[definition.stage];
        
        if (!participantId) {
          console.log(`[checkSpecificAlerts] No participant for stage ${definition.stage}`);
          continue;
        }

        // Verificar si ya existe una alerta de este tipo pendiente
        const existingAlert = journey.alerts.find((a: any) =>
          a.alertType === definition.type &&
          a.status === 'pending'
        );
        
        if (existingAlert) {
          console.log(`[checkSpecificAlerts] Alert ${definition.type} already exists - skipping`);
          continue;
        }

        // Buscar la pregunta específica por campaignTypeSlug y questionOrder
        const question = await prisma.question.findFirst({
          where: {
            campaignType: {
              slug: definition.campaignTypeSlug
            },
            questionOrder: definition.questionOrder
          },
          select: {
            id: true,
            text: true,
            responseType: true,
            responseValueMapping: true,
            choiceOptions: true,
            minValue: true,
            maxValue: true
          }
        });

        if (!question) {
          console.log(`[checkSpecificAlerts] Question not found for ${definition.type}`);
          continue;
        }

        console.log(`[checkSpecificAlerts] Found question: ${question.text.substring(0, 50)}...`);

        // 🔧 CAMBIO 2: Buscar la respuesta CON normalizedScore + question metadata
        const response = await prisma.response.findFirst({
          where: {
            participantId: participantId,
            questionId: question.id
          },
          select: {
            id: true,
            rating: true,
            textResponse: true,
            choiceResponse: true,
            normalizedScore: true
          }
        });

        if (!response) {
          console.log(`[checkSpecificAlerts] No response found for ${definition.type}`);
          continue;
        }

        console.log(`[checkSpecificAlerts] Response found:`, {
          rating: response.rating,
          choiceResponse: response.choiceResponse,
          normalizedScore: response.normalizedScore,
          hasText: !!response.textResponse
        });

        // 🔧 CAMBIO 3: Calcular normalizedScore si es null (backward compatibility)
        let normalizedScore = response.normalizedScore;
        
        if (normalizedScore === null || normalizedScore === undefined) {
          // Fallback: calcular on-the-fly usando la función importada
          normalizedScore = calculateNormalizedScore(
            {
              rating: response.rating,
              choiceResponse: response.choiceResponse,
              textResponse: response.textResponse
            },
            {
              responseType: question.responseType,
              responseValueMapping: question.responseValueMapping,
              choiceOptions: question.choiceOptions,
              minValue: question.minValue,
              maxValue: question.maxValue
            }
          );
          
          console.warn(`[checkSpecificAlerts] normalizedScore NULL - calculado on-the-fly: ${normalizedScore}`);
        }

        // Crear objeto con normalizedScore garantizado para la condición
        const responseWithScore = {
          ...response,
          normalizedScore
        };

        // Evaluar la condición
        const shouldTrigger = definition.condition(responseWithScore);
        
        console.log(`[checkSpecificAlerts] Condition result for ${definition.type}: ${shouldTrigger} (normalizedScore: ${normalizedScore})`);

        if (shouldTrigger) {
          // 🚨 ALERTA DISPARADA - Crear en base de datos
          console.log(`[checkSpecificAlerts] 🚨 CREATING ALERT: ${definition.type}`);
          
          const alert = await this.createAlert({
            journeyId: journey.id,
            accountId: journey.accountId,
            alertType: definition.type,
            severity: definition.severity,
            title: definition.titleTemplate(journey.fullName),
            description: definition.descriptionTemplate(
              journey.fullName, 
              normalizedScore || undefined
            ),
            stage: definition.stage,
            questionId: question.id,
            responseValue: normalizedScore,
            slaHours: definition.slaHours
          });
          
          createdAlerts.push(alert);
          console.log(`[checkSpecificAlerts] ✅ Alert created: ${alert.id}`);
        }
      }

      console.log(`[checkSpecificAlerts] Total specific alerts created: ${createdAlerts.length}`);
      return createdAlerts;
      
    } catch (error) {
      console.error('[checkSpecificAlerts] Error:', error);
      return createdAlerts;
    }
  }
  
  // ============================================================================
  // MÉTODO EXISTENTE: CHECK INCOMPLETE STAGES
  // ============================================================================
  
  /**
   * ✅ ALERTAS POR STAGES INCOMPLETOS
   */
  private static async checkIncompleteStages(journey: any): Promise<JourneyAlert[]> {
    const createdAlerts: JourneyAlert[] = [];
    const now = new Date();
    
    const stages = [
      { num: 1, date: journey.stage1Date, participantId: journey.stage1ParticipantId },
      { num: 2, date: journey.stage2Date, participantId: journey.stage2ParticipantId },
      { num: 3, date: journey.stage3Date, participantId: journey.stage3ParticipantId },
      { num: 4, date: journey.stage4Date, participantId: journey.stage4ParticipantId }
    ];
    
    for (const { num, date, participantId } of stages) {
      if (!date || !participantId) continue;
      
      const daysSince = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince > 7 && num > journey.currentStage) {
        const participant = await prisma.participant.findUnique({
          where: { id: participantId },
          select: { hasResponded: true }
        });
        
        if (participant && !participant.hasResponded) {
          const existingAlert = journey.alerts.find((a: any) =>
            a.alertType === 'stage_incomplete' &&
            a.stage === num &&
            a.status === 'pending'
          );
          
          if (!existingAlert) {
            const severity = daysSince > 14 ? 'critical' : daysSince > 10 ? 'high' : 'medium';
            
            const alert = await this.createAlert({
              journeyId: journey.id,
              accountId: journey.accountId,
              alertType: 'stage_incomplete',
              severity,
              title: `Stage ${num} Incompleto (${daysSince} días)`,
              description: `El colaborador ${journey.fullName} no ha completado el Stage ${num} después de ${daysSince} días desde la fecha programada.`,
              stage: num,
              slaHours: this.SLA_CONFIG[severity]
            });
            
            createdAlerts.push(alert);
          }
        }
      }
    }
    
    return createdAlerts;
  }
  
  // ============================================================================
  // HELPER: CREATE ALERT
  // ============================================================================
  
  /**
   * ✅ CREAR ALERTA EN BASE DE DATOS
   */
  private static async createAlert(data: {
    journeyId: string;
    accountId: string;
    alertType: string;
    severity: string;
    title: string;
    description: string;
    dimension?: string;
    stage?: number;
    score?: number;
    questionId?: string;
    responseValue?: number | null;
    threshold?: number;
    slaHours: number;
  }): Promise<JourneyAlert> {
    const dueDate = addHours(new Date(), data.slaHours);
    
    const alert = await prisma.journeyAlert.create({
      data: {
        journeyId: data.journeyId,
        accountId: data.accountId,
        alertType: data.alertType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        dimension: data.dimension || null,
        stage: data.stage || null,
        score: data.score || null,
        questionId: data.questionId || null,
        responseValue: data.responseValue || null,
        threshold: data.threshold || null,
        slaHours: data.slaHours,
        dueDate: dueDate,
        slaStatus: 'on_time',
        status: 'pending'
      }
    });
    
    console.log(`[OnboardingAlertService] Alert created:`, {
      id: alert.id,
      type: alert.alertType,
      severity: alert.severity,
      journey: data.journeyId
    });
    
    return alert;
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS PARA GESTIÓN DE ALERTAS
  // ============================================================================
  
  /**
   * ✅ Obtener alertas por cuenta con filtros
   */
  static async getAlertsByAccount(
    accountId: string,
    filters?: {
      status?: string;
      severity?: string;
      slaStatus?: string;
      alertType?: string;
    }
  ) {
    const where: any = { accountId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.slaStatus) where.slaStatus = filters.slaStatus;
    if (filters?.alertType) where.alertType = filters.alertType;
    
    return await prisma.journeyAlert.findMany({
      where,
      include: {
        journey: {
          select: {
            fullName: true,
            currentStage: true,
            exoScore: true,
            retentionRisk: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * ✅ Obtener alertas por journey específico
   */
  static async getAlertsByJourney(journeyId: string) {
    return await prisma.journeyAlert.findMany({
      where: { journeyId },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * ✅ Acknowledge (reconocer) una alerta
   */
  static async acknowledgeAlert(alertId: string, userId: string, notes?: string) {
    return await prisma.journeyAlert.update({
      where: { id: alertId },
      data: {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        ...(notes && { resolutionNotes: notes })
      }
    });
  }

  /**
   * ✅ Resolver una alerta
   */
  static async resolveAlert(
    alertId: string, 
    userId: string, 
    notes?: string
  ) {
    return await prisma.journeyAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: notes || null
      }
    });
  }

  /**
   * ✅ Descartar una alerta
   */
  static async dismissAlert(alertId: string, userId: string, reason?: string) {
    return await prisma.journeyAlert.update({
      where: { id: alertId },
      data: {
        status: 'dismissed',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: reason || 'Alerta descartada sin acción'
      }
    });
  }

  /**
   * ✅ Obtener estadísticas de alertas + TREND + HISTORY 12 MESES
   * 
   * 🆕 V2.0: Ahora incluye:
   * - trend: Comparación mes actual vs anterior (%, dirección, contexto)
   * - history: Serie temporal últimos 12 meses (para sparklines)
   * 
   * @returns Promise<AlertStatistics> - Tipos explícitos enterprise
   */
  static async getAlertStatistics(accountId: string): Promise<AlertStatistics> {
    const alerts = await prisma.journeyAlert.findMany({
      where: { accountId },
      select: {
        status: true,
        severity: true,
        slaStatus: true
      }
    });
    
    // ============================================================================
    // 🆕 HISTORIA 12 MESES + TREND CALCULATION
    // ============================================================================
    
    // Buscar últimos 12 registros históricos de OnboardingEffectivenessInsight
    const history = await prisma.onboardingEffectivenessInsight.findMany({
      where: { accountId },
      orderBy: { period: 'desc' },  // Más reciente primero
      take: 12,
      select: {
        period: true,              // "2025-11"
        totalAlerts: true,         // 45
        managedCount: true,        // 30 (gestionadas)
        ignoredCount: true,        // 15 (ignoradas)
        managedRetentionRate: true,// 0.75 (efectividad gestión)
        retentionDelta: true       // +55 puntos (impacto)
      }
    });
    
    // Calcular trend (mes actual vs anterior)
    let trend = null;
    if (history.length >= 2) {
      const current = history[0];   // Mes más reciente
      const previous = history[1];  // Mes anterior
      
      if (previous.totalAlerts > 0) {
        const change = current.totalAlerts - previous.totalAlerts;
        const percentageChange = Math.round((change / previous.totalAlerts) * 100);
        
        // ✅ TIPO EXPLÍCITO: TrendDirection (enterprise pattern)
        const direction: TrendDirection = percentageChange > 0 ? 'up' : 
                                          percentageChange < 0 ? 'down' : 
                                          'stable';
        
        trend = {
          value: percentageChange,                    // +12 o -8
          direction,                                  // "up" | "down" | "stable" ✅ Tipo seguro
          absolute: change,                           // +5 alertas
          current: current.totalAlerts,               // 45
          previous: previous.totalAlerts,             // 40
          comparison: `${Math.abs(percentageChange)}% ${percentageChange > 0 ? 'más' : 'menos'} que ${previous.period}` // "12% más que 2025-10"
        };
      }
    }
    
    return {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      breached: alerts.filter(a => a.slaStatus === 'breached').length,
      atRisk: alerts.filter(a => a.slaStatus === 'at_risk').length,
      onTime: alerts.filter(a => a.slaStatus === 'on_time').length,
      // 🆕 NUEVOS CAMPOS V2.0
      trend,                       // Tendencia mes actual vs anterior
      history: history.reverse()   // Serie temporal [más antiguo → más reciente]
    };
  }

  /**
   * ✅ Actualizar estado SLA de alertas vencidas
   */
  static async updateSLAStatus() {
    const now = new Date();
    
    // Alertas que pasaron su dueDate y siguen pending
    await prisma.journeyAlert.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: now },
        slaStatus: { not: 'breached' }
      },
      data: {
        slaStatus: 'breached'
      }
    });
    
    // Alertas que están cerca de vencer (últimas 2 horas antes del dueDate)
    const twoHoursFromNow = addHours(now, 2);
    await prisma.journeyAlert.updateMany({
      where: {
        status: 'pending',
        dueDate: { lte: twoHoursFromNow, gt: now },
        slaStatus: 'on_time'
      },
      data: {
        slaStatus: 'at_risk'
      }
    });
  }
}