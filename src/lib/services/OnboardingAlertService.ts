// src/lib/services/OnboardingAlertService.ts

import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { JourneyAlert } from '@prisma/client';

export class OnboardingAlertService {
  
  private static SLA_CONFIG: Record<string, number> = {
    critical: 4,
    high: 24,
    medium: 72,
    low: 168
  };
  
  /**
   * ✅ DETECTAR Y CREAR ALERTAS AUTOMÁTICAS
   */
  static async detectAndCreateAlerts(journeyId: string): Promise<JourneyAlert[]> {
    const createdAlerts: JourneyAlert[] = [];
    
    const journey = await prisma.journeyOrchestration.findUnique({
      where: { id: journeyId },
      include: {
        alerts: {
          where: { status: 'open' }
        }
      }
    });
    
    if (!journey) return createdAlerts;
    
    const lowScoreAlerts = await this.checkLowScores(journey);
    createdAlerts.push(...lowScoreAlerts);
    
    const incompleteAlerts = await this.checkIncompleteStages(journey);
    createdAlerts.push(...incompleteAlerts);
    
    const escalationAlerts = await this.checkRiskEscalation(journey);
    createdAlerts.push(...escalationAlerts);
    
    return createdAlerts;
  }
  
  /**
   * ✅ ALERTAS POR SCORES BAJOS
   */
  private static async checkLowScores(journey: any): Promise<JourneyAlert[]> {
    const createdAlerts: JourneyAlert[] = [];
    
    const scores = [
      { name: 'compliance', score: journey.complianceScore, stage: 1, threshold: 3.0 },
      { name: 'clarification', score: journey.clarificationScore, stage: 2, threshold: 3.5 },
      { name: 'culture', score: journey.cultureScore, stage: 3, threshold: 3.5 },
      { name: 'connection', score: journey.connectionScore, stage: 4, threshold: 4.0 }
    ];
    
    for (const { name, score, stage, threshold } of scores) {
      if (score !== null && score < threshold) {
        const existingAlert = journey.alerts.find((a: any) =>
          a.alertType === 'low_score' &&
          a.dimension === name &&
          a.status === 'open'
        );
        
        if (!existingAlert) {
          const severity = score < 2.0 ? 'critical' : score < 3.0 ? 'high' : 'medium';
          
          const alert = await this.createAlert({
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
          
          createdAlerts.push(alert);
        }
      }
    }
    
    return createdAlerts;
  }
  
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
            a.status === 'open'
          );
          
          if (!existingAlert) {
            const severity = daysSince > 14 ? 'high' : 'medium';
            
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
  
  /**
   * ✅ ALERTAS POR ESCALACIÓN DE RIESGO
   */
  private static async checkRiskEscalation(journey: any): Promise<JourneyAlert[]> {
    const createdAlerts: JourneyAlert[] = [];
    
    if (!journey.exoScore || !journey.retentionRisk) return createdAlerts;
    
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
      
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      const currentLevel = riskLevels.indexOf(journey.retentionRisk);
      const previousLevel = riskLevels.indexOf(previous.retentionRisk || 'low');
      
      if (currentLevel > previousLevel) {
        const alert = await this.createAlert({
          journeyId: journey.id,
          accountId: journey.accountId,
          alertType: 'risk_escalation',
          severity: 'high',
          title: `Escalación de Riesgo: ${previous.retentionRisk} → ${journey.retentionRisk}`,
          description: `El nivel de riesgo de retención para ${journey.fullName} escaló de ${previous.retentionRisk} a ${journey.retentionRisk}. EXO Score: ${journey.exoScore}.`,
          score: journey.exoScore,
          slaHours: this.SLA_CONFIG.high
        });
        
        createdAlerts.push(alert);
      }
    }
    
    return createdAlerts;
  }
  
  /**
   * ✅ CREAR ALERTA
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
  }): Promise<JourneyAlert> {
    const dueDate = addHours(new Date(), data.slaHours);
    
    const alert = await prisma.journeyAlert.create({
      data: {
        ...data,
        status: 'open',
        slaStatus: 'on_time',
        dueDate
      }
    });
    
    console.log(`[Alert Created] ${data.title} - Journey: ${data.journeyId}`);
    
    return alert;
  }
  
  /**
   * ✅ ACTUALIZAR ESTADO SLA (ejecutar en cron)
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
            departmentId: true,
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