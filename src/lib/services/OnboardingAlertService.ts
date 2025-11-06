/**
 * ONBOARDING ALERT SERVICE
 * 
 * RESPONSABILIDADES:
 * - Detectar situaciones de riesgo automáticamente
 * - Crear alertas con SLA (Service Level Agreement)
 * - Actualizar estado SLA (on_time/at_risk/breached)
 * - Gestionar ciclo de vida alertas (open/acknowledged/resolved)
 * 
 * TIPOS DE ALERTAS:
 * 1. low_score: Score bajo en alguna dimensión 4C
 * 2. stage_incomplete: Stage no completado después de 7+ días
 * 3. risk_escalation: Riesgo aumentó entre journeys
 * 
 * SLA CONFIG:
 * - critical: 4 horas
 * - high: 24 horas
 * - medium: 72 horas (3 días)
 * - low: 168 horas (7 días)
 */

import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';

export class OnboardingAlertService {
  
  // Configuración SLA por severidad
  private static SLA_CONFIG: Record<string, number> = {
    critical: 4,   // 4 horas
    high: 24,      // 24 horas
    medium: 72,    // 3 días
    low: 168       // 7 días
  };
  
  /**
   * ✅ DETECTAR Y CREAR ALERTAS AUTOMÁTICAS
   * Método principal que orquesta todas las detecciones
   */
  static async detectAndCreateAlerts(journeyId: string) {
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId },
      include: {
        alerts: {
          where: { status: 'open' }
        }
      }
    });
    
    if (!journey) return;
    
    // 1. Alertas por score bajo
    await this.checkLowScores(journey);
    
    // 2. Alertas por stage incompleto
    await this.checkIncompleteStages(journey);
    
    // 3. Alertas por escalación de riesgo
    await this.checkRiskEscalation(journey);
  }
  
  /**
   * ✅ ALERTAS POR SCORES BAJOS
   * Detecta cuando un score 4C está por debajo del umbral crítico
   */
  private static async checkLowScores(journey: any) {
    const scores = [
      { name: 'compliance', score: journey.complianceScore, stage: 1, threshold: 3.0 },
      { name: 'clarification', score: journey.clarificationScore, stage: 2, threshold: 3.5 },
      { name: 'culture', score: journey.cultureScore, stage: 3, threshold: 3.5 },
      { name: 'connection', score: journey.connectionScore, stage: 4, threshold: 4.0 }
    ];
    
    for (const { name, score, stage, threshold } of scores) {
      if (score !== null && score < threshold) {
        // Verificar si ya existe alerta similar abierta
        const existingAlert = journey.alerts.find((a: any) =>
          a.alertType === 'low_score' &&
          a.dimension === name &&
          a.status === 'open'
        );
        
        if (!existingAlert) {
          const severity = score < 2.0 ? 'critical' : score < 3.0 ? 'high' : 'medium';
          
          await this.createAlert({
            journeyId: journey.id,
            accountId: journey.accountId,
            alertType: 'low_score',
            severity,
            title: `Score ${name.toUpperCase()} Bajo: ${score.toFixed(1)}/5.0`,
            description: `El colaborador ${journey.fullName} obtuvo un score de ${score.toFixed(1)} en la dimensión ${name} (Stage ${stage}), por debajo del umbral crítico de ${threshold}.`,
            dimension: name,
            stage,
            score,
            slaHours: this.SLA_CONFIG[severity]
          });
        }
      }
    }
  }
  
  /**
   * ✅ ALERTAS POR STAGES INCOMPLETOS
   * Detecta cuando han pasado más de 7 días desde la fecha del stage sin responder
   */
  private static async checkIncompleteStages(journey: any) {
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
      
      // Si pasaron más de 7 días desde la fecha del stage y no ha respondido
      if (daysSince > 7 && num > journey.currentStage) {
        const participant = await prisma.participant.findUnique({
          where: { id: participantId },
          select: { hasResponded: true }
        });
        
        if (participant && !participant.hasResponded) {
          // Verificar si ya existe alerta
          const existingAlert = journey.alerts.find((a: any) =>
            a.alertType === 'stage_incomplete' &&
            a.stage === num &&
            a.status === 'open'
          );
          
          if (!existingAlert) {
            const severity = daysSince > 14 ? 'high' : 'medium';
            
            await this.createAlert({
              journeyId: journey.id,
              accountId: journey.accountId,
              alertType: 'stage_incomplete',
              severity,
              title: `Stage ${num} Incompleto (${daysSince} días)`,
              description: `El colaborador ${journey.fullName} no ha completado el Stage ${num} después de ${daysSince} días desde la fecha programada.`,
              stage: num,
              slaHours: this.SLA_CONFIG[severity]
            });
          }
        }
      }
    }
  }
  
  /**
   * ✅ ALERTAS POR ESCALACIÓN DE RIESGO
   * Detecta cuando el riesgo aumentó comparado con journeys previos
   */
  private static async checkRiskEscalation(journey: any) {
    if (!journey.exoScore || !journey.retentionRisk) return;
    
    // Buscar journey histórico para comparar
    const previousJourneys = await prisma.journeyOrchestration.findMany({
      where: {
        accountId: journey.accountId,
        nationalId: journey.nationalId,
        id: { not: journey.id }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (previousJourneys.length > 0) {
      const previous = previousJourneys[0];
      
      // Si riesgo escaló
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      const currentLevel = riskLevels.indexOf(journey.retentionRisk);
      const previousLevel = riskLevels.indexOf(previous.retentionRisk || 'low');
      
      if (currentLevel > previousLevel) {
        await this.createAlert({
          journeyId: journey.id,
          accountId: journey.accountId,
          alertType: 'risk_escalation',
          severity: 'high',
          title: `Escalación de Riesgo: ${previous.retentionRisk} → ${journey.retentionRisk}`,
          description: `El nivel de riesgo de retención para ${journey.fullName} escaló de ${previous.retentionRisk} a ${journey.retentionRisk}. EXO Score: ${journey.exoScore}.`,
          score: journey.exoScore,
          slaHours: this.SLA_CONFIG.high
        });
      }
    }
  }
  
  /**
   * ✅ CREAR ALERTA
   * Método privado para crear alertas con SLA calculado
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
    slaHours: number;
  }) {
    const dueDate = addHours(new Date(), data.slaHours);
    
    await prisma.journeyAlert.create({
      data: {
        ...data,
        status: 'open',
        slaStatus: 'on_time',
        dueDate
      }
    });
    
    console.log(`[Alert Created] ${data.title} - Journey: ${data.journeyId}`);
  }
  
  /**
   * ✅ ACTUALIZAR ESTADO SLA (ejecutar en cron)
   * Recalcula slaStatus basado en tiempo restante
   */
  static async updateSLAStatus() {
    const now = new Date();
    
    const openAlerts = await prisma.journeyAlert.findMany({
      where: { status: 'open' }
    });
    
    for (const alert of openAlerts) {
      const hoursRemaining = (alert.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let newStatus: string = alert.slaStatus;
      
      if (hoursRemaining <= 0) {
        newStatus = 'breached';
      } else if (hoursRemaining <= alert.slaHours * 0.25) {
        newStatus = 'at_risk';
      } else {
        newStatus = 'on_time';
      }
      
      if (newStatus !== alert.slaStatus) {
        await prisma.journeyAlert.update({
          where: { id: alert.id },
          data: { slaStatus: newStatus }
        });
      }
    }
  }
  
  /**
   * ✅ ACKNOWLEDGE ALERTA
   * Marca alerta como reconocida por usuario
   */
  static async acknowledgeAlert(alertId: string, userId: string) {
    await prisma.journeyAlert.update({
      where: { id: alertId },
      data: {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      }
    });
  }
  
  /**
   * ✅ RESOLVER ALERTA
   * Marca alerta como resuelta con resolución
   */
  static async resolveAlert(alertId: string, userId: string, resolutionNotes: string) {
    await prisma.journeyAlert.update({
      where: { id: alertId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes
      }
    });
  }
  
  /**
   * ✅ DESCARTAR ALERTA
   * Marca alerta como descartada sin acción
   */
  static async dismissAlert(alertId: string, userId: string, reason?: string) {
    await prisma.journeyAlert.update({
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
   * ✅ OBTENER ALERTAS POR CUENTA
   * Lista alertas con filtros opcionales
   */
  static async getAlertsByAccount(accountId: string, filters?: {
    status?: string;
    severity?: string;
    slaStatus?: string;
  }) {
    return await prisma.journeyAlert.findMany({
      where: {
        accountId,
        ...filters
      },
      include: {
        journey: {
          select: {
            fullName: true,
            department: true,
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
   * ✅ OBTENER ALERTAS POR JOURNEY
   * Lista alertas de un journey específico
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
   * ✅ OBTENER ESTADÍSTICAS DE ALERTAS
   * Métricas agregadas por cuenta
   */
  static async getAlertStatistics(accountId: string) {
    const alerts = await prisma.journeyAlert.findMany({
      where: { accountId },
      select: {
        status: true,
        severity: true,
        slaStatus: true
      }
    });
    
    return {
      total: alerts.length,
      open: alerts.filter(a => a.status === 'open').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      breached: alerts.filter(a => a.slaStatus === 'breached').length,
      atRisk: alerts.filter(a => a.slaStatus === 'at_risk').length,
      onTime: alerts.filter(a => a.slaStatus === 'on_time').length
    };
  }
}