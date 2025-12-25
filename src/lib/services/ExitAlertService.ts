/**
 * EXIT ALERT SERVICE
 * 
 * PROPÓSITO:
 * - Gestión de alertas Exit (acknowledge, resolve, dismiss)
 * - Alertas departamentales (liderazgo, NPS) - ejecutadas por CRON
 * - Actualización SLA
 * 
 * ARQUITECTURA:
 * - Análogo a OnboardingAlertService pero para Exit Intelligence
 * - Alertas departamentales son agregadas (no individuales)
 * - SLA es trackeable pero sin presión urgente como Onboarding
 * 
 * TIPOS DE ALERTAS:
 * - ley_karin: P6 < 2.5 (generada en ExitIntelligenceService al completar encuesta)
 * - liderazgo_concentracion: ≥30% menciones "Liderazgo de Apoyo" + avgSeverity ≤ 2.0
 * - nps_critico: eNPS < -30 en departamento
 * 
 * @version 1.0
 * @date December 2025
 * @author FocalizaHR Team
 */

import { prisma } from '@/lib/prisma';
import { addHours } from 'date-fns';
import { 
  ExitAlertData, 
  FactorPriority,
  EXIT_ALERT_TYPES,
  EXIT_ALERT_SEVERITIES,
  EXIT_ALERT_STATUSES,
  SLA_STATUSES
} from '@/types/exit';


// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SLA por tipo de alerta (horas)
 * - ley_karin: 24h (urgente, compliance legal)
 * - liderazgo_concentracion: 72h (patrón departamental)
 * - nps_critico: 168h/1 semana (tendencia)
 */
const SLA_HOURS = {
  [EXIT_ALERT_TYPES.LEY_KARIN]: 24,
  [EXIT_ALERT_TYPES.LIDERAZGO_CONCENTRACION]: 72,
  [EXIT_ALERT_TYPES.NPS_CRITICO]: 168,
  [EXIT_ALERT_TYPES.TOXIC_EXIT_DETECTED]: 48,
  [EXIT_ALERT_TYPES.DEPARTMENT_EXIT_PATTERN]: 72,
  [EXIT_ALERT_TYPES.ONBOARDING_EXIT_CORRELATION]: 120
} as const;

/**
 * Umbral mínimo de exits para generar alertas departamentales
 */
const MIN_EXITS_FOR_DEPARTMENT_ALERT = 3;

/**
 * Configuración alertas departamentales
 */
const ALERT_CONFIG = {
  LEADERSHIP: {
    FACTOR: 'Liderazgo de Apoyo',
    MIN_MENTION_RATE: 0.30,    // ≥30% menciones
    MAX_SEVERITY: 2.0          // Severidad promedio ≤ 2.0
  },
  NPS: {
    MIN_ENPS: -30              // eNPS < -30
  }
} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export class ExitAlertService {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN DE ALERTAS DEPARTAMENTALES (CRON)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Verificar y generar alertas departamentales
   * Ejecutado por CRON mensual
   * 
   * @param accountId - ID de la cuenta
   * @param departmentId - ID del departamento
   * @param periodStart - Inicio del período
   * @param periodEnd - Fin del período
   * @returns Número de alertas creadas
   */
  static async checkDepartmentAlerts(
    accountId: string,
    departmentId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    let alertsCreated = 0;
    
    console.log('[ExitAlertService] Checking department alerts:', {
      departmentId,
      period: `${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]}`
    });
    
    // Obtener ExitRecords del período con encuesta completada
    const exitRecords = await prisma.exitRecord.findMany({
      where: {
        accountId,
        departmentId,
        exitDate: { 
          gte: periodStart, 
          lte: periodEnd 
        },
        eis: { not: null } // Solo los que tienen encuesta completada
      },
      select: {
        id: true,
        exitFactors: true,
        exitFactorsDetail: true,
        participantId: true
      }
    });
    
    const totalExits = exitRecords.length;
    
    // Mínimo 3 exits para generar alertas departamentales
    if (totalExits < MIN_EXITS_FOR_DEPARTMENT_ALERT) {
      console.log(`[ExitAlertService] Skipping department ${departmentId}: only ${totalExits} exits (min: ${MIN_EXITS_FOR_DEPARTMENT_ALERT})`);
      return 0;
    }
    
    // 1. Verificar alerta LIDERAZGO_CONCENTRACION
    const leadershipAlert = await this.checkLeadershipConcentration(
      accountId, 
      departmentId, 
      exitRecords, 
      totalExits, 
      periodStart, 
      periodEnd
    );
    if (leadershipAlert) alertsCreated++;
    
    // 2. Verificar alerta NPS_CRITICO
    const npsAlert = await this.checkCriticalNPS(
      accountId, 
      departmentId, 
      exitRecords,
      periodStart, 
      periodEnd
    );
    if (npsAlert) alertsCreated++;
    
    console.log(`[ExitAlertService] Department ${departmentId}: ${alertsCreated} alerts created`);
    
    return alertsCreated;
  }
  
  /**
   * Verificar alerta Liderazgo Concentración
   * Gatillo: ≥30% menciones "Liderazgo de Apoyo" + avgSeverity ≤ 2.0
   */
  private static async checkLeadershipConcentration(
    accountId: string,
    departmentId: string,
    exitRecords: Array<{ 
      id: string;
      exitFactors: string[]; 
      exitFactorsDetail: any 
    }>,
    totalExits: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<boolean> {
    const { FACTOR, MIN_MENTION_RATE, MAX_SEVERITY } = ALERT_CONFIG.LEADERSHIP;
    
    // Contar menciones y severidades
    let mentions = 0;
    const severities: number[] = [];
    
    for (const record of exitRecords) {
      if (record.exitFactors.includes(FACTOR)) {
        mentions++;
        const detail = record.exitFactorsDetail as Record<string, number> | null;
        if (detail && detail[FACTOR]) {
          severities.push(detail[FACTOR]);
        }
      }
    }
    
    const mentionRate = mentions / totalExits;
    const avgSeverity = severities.length > 0
      ? severities.reduce((a, b) => a + b, 0) / severities.length
      : 3.0; // Default neutral si no hay detalle
    
    console.log('[ExitAlertService] Leadership check:', {
      departmentId,
      mentions,
      totalExits,
      mentionRate: `${(mentionRate * 100).toFixed(1)}%`,
      avgSeverity: avgSeverity.toFixed(2),
      thresholds: { minRate: MIN_MENTION_RATE, maxSeverity: MAX_SEVERITY }
    });
    
    // ¿Cumple condiciones?
    if (mentionRate < MIN_MENTION_RATE || avgSeverity > MAX_SEVERITY) {
      return false;
    }
    
    // Verificar que no existe alerta activa para este período
    const existingAlert = await prisma.exitAlert.findFirst({
      where: {
        accountId,
        departmentId,
        alertType: EXIT_ALERT_TYPES.LIDERAZGO_CONCENTRACION,
        periodStart,
        periodEnd,
        status: { in: [EXIT_ALERT_STATUSES.PENDING, EXIT_ALERT_STATUSES.ACKNOWLEDGED] }
      }
    });
    
    if (existingAlert) {
      console.log('[ExitAlertService] Leadership alert already exists:', existingAlert.id);
      return false;
    }
    
    // Obtener nombre departamento
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { displayName: true }
    });
    
    // Crear alerta
    const slaHours = SLA_HOURS[EXIT_ALERT_TYPES.LIDERAZGO_CONCENTRACION];
    const dueDate = addHours(new Date(), slaHours);
    
    await prisma.exitAlert.create({
      data: {
        accountId,
        departmentId,
        alertType: EXIT_ALERT_TYPES.LIDERAZGO_CONCENTRACION,
        severity: EXIT_ALERT_SEVERITIES.HIGH,
        title: `🔴 Patrón liderazgo crítico en ${department?.displayName || 'Departamento'}`,
        description: `El ${Math.round(mentionRate * 100)}% de las salidas (${mentions} de ${totalExits}) mencionaron problemas de liderazgo con severidad promedio ${avgSeverity.toFixed(1)}/5. Este patrón indica un problema sistémico que requiere intervención.`,
        exitCount: totalExits,
        triggerFactor: FACTOR,
        avgScore: Math.round(avgSeverity * 10) / 10,
        periodStart,
        periodEnd,
        slaHours,
        dueDate,
        slaStatus: SLA_STATUSES.ON_TRACK
      }
    });
    
    console.log('[ExitAlertService] ✅ Leadership alert created:', {
      departmentId,
      mentionRate: `${(mentionRate * 100).toFixed(1)}%`,
      avgSeverity: avgSeverity.toFixed(2)
    });
    
    return true;
  }
  
  /**
   * Verificar alerta NPS Crítico
   * Gatillo: eNPS < -30
   */
  private static async checkCriticalNPS(
    accountId: string,
    departmentId: string,
    exitRecords: Array<{ 
      id: string;
      participantId: string 
    }>,
    periodStart: Date,
    periodEnd: Date
  ): Promise<boolean> {
    const { MIN_ENPS } = ALERT_CONFIG.NPS;
    
    if (exitRecords.length < MIN_EXITS_FOR_DEPARTMENT_ALERT) {
      return false;
    }
    
    // Obtener NPS desde Response (P8 = questionOrder 8)
    const npsScores: number[] = [];
    
    for (const record of exitRecords) {
      const npsResponse = await prisma.response.findFirst({
        where: {
          participantId: record.participantId,
          question: { questionOrder: 8 }
        },
        select: { rating: true }
      });
      
      if (npsResponse?.rating !== null && npsResponse?.rating !== undefined) {
        npsScores.push(npsResponse.rating);
      }
    }
    
    if (npsScores.length < MIN_EXITS_FOR_DEPARTMENT_ALERT) {
      return false;
    }
    
    // Calcular eNPS
    const promoters = npsScores.filter(s => s >= 9).length;
    const detractors = npsScores.filter(s => s <= 6).length;
    const enps = ((promoters - detractors) / npsScores.length) * 100;
    
    console.log('[ExitAlertService] NPS check:', {
      departmentId,
      npsScores: npsScores.length,
      promoters,
      detractors,
      enps: Math.round(enps),
      threshold: MIN_ENPS
    });
    
    if (enps >= MIN_ENPS) {
      return false;
    }
    
    // Verificar que no existe alerta activa
    const existingAlert = await prisma.exitAlert.findFirst({
      where: {
        accountId,
        departmentId,
        alertType: EXIT_ALERT_TYPES.NPS_CRITICO,
        periodStart,
        periodEnd,
        status: { in: [EXIT_ALERT_STATUSES.PENDING, EXIT_ALERT_STATUSES.ACKNOWLEDGED] }
      }
    });
    
    if (existingAlert) {
      console.log('[ExitAlertService] NPS alert already exists:', existingAlert.id);
      return false;
    }
    
    // Obtener nombre departamento
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { displayName: true }
    });
    
    // Crear alerta
    const slaHours = SLA_HOURS[EXIT_ALERT_TYPES.NPS_CRITICO];
    const dueDate = addHours(new Date(), slaHours);
    
    await prisma.exitAlert.create({
      data: {
        accountId,
        departmentId,
        alertType: EXIT_ALERT_TYPES.NPS_CRITICO,
        severity: EXIT_ALERT_SEVERITIES.HIGH,
        title: `📉 eNPS crítico en ${department?.displayName || 'Departamento'}`,
        description: `El eNPS de colaboradores que dejaron el departamento es ${Math.round(enps)} (n=${npsScores.length}). Esto indica que las personas que se van no recomendarían trabajar aquí, lo cual puede afectar la atracción de talento.`,
        exitCount: npsScores.length,
        enpsValue: Math.round(enps * 10) / 10,
        periodStart,
        periodEnd,
        slaHours,
        dueDate,
        slaStatus: SLA_STATUSES.ON_TRACK
      }
    });
    
    console.log('[ExitAlertService] ✅ NPS alert created:', {
      departmentId,
      enps: Math.round(enps)
    });
    
    return true;
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE ALERTAS (ACKNOWLEDGE, RESOLVE, DISMISS)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Acknowledge (reconocer) una alerta
   * Indica que alguien está trabajando en ella
   */
  static async acknowledgeAlert(
    alertId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    console.log('[ExitAlertService] Acknowledging alert:', alertId);
    
    await prisma.exitAlert.update({
      where: { id: alertId },
      data: {
        status: EXIT_ALERT_STATUSES.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
        resolutionNotes: notes || null
      }
    });
    
    console.log('[ExitAlertService] ✅ Alert acknowledged:', alertId);
  }
  
  /**
   * Resolver una alerta
   * Requiere notas de resolución
   */
  static async resolveAlert(
    alertId: string,
    userId: string,
    notes: string
  ): Promise<void> {
    console.log('[ExitAlertService] Resolving alert:', alertId);
    
    await prisma.exitAlert.update({
      where: { id: alertId },
      data: {
        status: EXIT_ALERT_STATUSES.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: notes
      }
    });
    
    console.log('[ExitAlertService] ✅ Alert resolved:', alertId);
  }
  
  /**
   * Descartar una alerta
   * Usado cuando la alerta no es relevante
   */
  static async dismissAlert(
    alertId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    console.log('[ExitAlertService] Dismissing alert:', alertId);
    
    await prisma.exitAlert.update({
      where: { id: alertId },
      data: {
        status: EXIT_ALERT_STATUSES.DISMISSED,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: reason || 'Alerta descartada'
      }
    });
    
    console.log('[ExitAlertService] ✅ Alert dismissed:', alertId);
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACTUALIZACIÓN SLA (CRON)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Actualizar estado SLA de todas las alertas abiertas
   * Ejecutado por CRON
   */
  static async updateSLAStatus(): Promise<{ updated: number }> {
    const now = new Date();
    let updated = 0;
    
    console.log('[ExitAlertService] Updating SLA status for open alerts...');
    
    const openAlerts = await prisma.exitAlert.findMany({
      where: {
        status: { 
          in: [EXIT_ALERT_STATUSES.PENDING, EXIT_ALERT_STATUSES.ACKNOWLEDGED] 
        },
        dueDate: { not: null },
        slaHours: { not: null }
      },
      select: {
        id: true,
        dueDate: true,
        slaHours: true,
        slaStatus: true
      }
    });
    
    for (const alert of openAlerts) {
      if (!alert.dueDate || !alert.slaHours) continue;
      
      const hoursRemaining = (alert.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let newStatus: string;
      if (hoursRemaining <= 0) {
        newStatus = SLA_STATUSES.BREACHED;
      } else if (hoursRemaining <= alert.slaHours * 0.25) {
        newStatus = SLA_STATUSES.AT_RISK;  // <25% tiempo restante
      } else {
        newStatus = SLA_STATUSES.ON_TRACK;
      }
      
      if (newStatus !== alert.slaStatus) {
        await prisma.exitAlert.update({
          where: { id: alert.id },
          data: { slaStatus: newStatus }
        });
        updated++;
        
        console.log(`[ExitAlertService] Alert ${alert.id}: ${alert.slaStatus} → ${newStatus}`);
      }
    }
    
    console.log(`[ExitAlertService] ✅ SLA status updated: ${updated} alerts`);
    
    return { updated };
  }
  
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Obtener alertas por cuenta con filtros
   */
  static async getAlertsByAccount(
    accountId: string,
    filters?: {
      status?: string;
      severity?: string;
      alertType?: string;
      departmentId?: string;
      departmentIds?: string[]; // Para filtrado jerárquico
    }
  ) {
    // ← AGREGAR ESTE LOG
    console.log('[ExitAlertService] getAlertsByAccount called with:', {
      accountId,
      filters
    });
    const where: any = { accountId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.alertType) where.alertType = filters.alertType;
    
    // Soporte para filtrado jerárquico
    if (filters?.departmentIds && filters.departmentIds.length > 0) {
      where.departmentId = { in: filters.departmentIds };
    } else if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    
    return await prisma.exitAlert.findMany({
      where,
      include: {
        department: {
          select: { 
            id: true, 
            displayName: true,
            standardCategory: true
          }
        },
        exitRecord: {
          select: {
            id: true,
            nationalId: true,
            exitDate: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },  // critical > high > medium > low
        { createdAt: 'desc' }
      ]
    });
  }
  
  /**
   * Obtener estadísticas de alertas
   */
  static async getAlertStatistics(
    accountId: string,
    departmentIds?: string[]
  ) {
    const where: any = { accountId };
    
    if (departmentIds && departmentIds.length > 0) {
      where.departmentId = { in: departmentIds };
    }
    
    const alerts = await prisma.exitAlert.findMany({
      where,
      select: {
        status: true,
        severity: true,
        alertType: true,
        slaStatus: true
      }
    });
    
    return {
      total: alerts.length,
      byStatus: {
        pending: alerts.filter(a => a.status === EXIT_ALERT_STATUSES.PENDING).length,
        acknowledged: alerts.filter(a => a.status === EXIT_ALERT_STATUSES.ACKNOWLEDGED).length,
        resolved: alerts.filter(a => a.status === EXIT_ALERT_STATUSES.RESOLVED).length,
        dismissed: alerts.filter(a => a.status === EXIT_ALERT_STATUSES.DISMISSED).length
      },
      bySeverity: {
        critical: alerts.filter(a => a.severity === EXIT_ALERT_SEVERITIES.CRITICAL).length,
        high: alerts.filter(a => a.severity === EXIT_ALERT_SEVERITIES.HIGH).length,
        medium: alerts.filter(a => a.severity === EXIT_ALERT_SEVERITIES.MEDIUM).length,
        low: alerts.filter(a => a.severity === EXIT_ALERT_SEVERITIES.LOW).length
      },
      byType: {
        ley_karin: alerts.filter(a => a.alertType === EXIT_ALERT_TYPES.LEY_KARIN).length,
        liderazgo_concentracion: alerts.filter(a => a.alertType === EXIT_ALERT_TYPES.LIDERAZGO_CONCENTRACION).length,
        nps_critico: alerts.filter(a => a.alertType === EXIT_ALERT_TYPES.NPS_CRITICO).length,
        toxic_exit: alerts.filter(a => a.alertType === EXIT_ALERT_TYPES.TOXIC_EXIT_DETECTED).length,
        department_pattern: alerts.filter(a => a.alertType === EXIT_ALERT_TYPES.DEPARTMENT_EXIT_PATTERN).length,
        onboarding_correlation: alerts.filter(a => a.alertType === EXIT_ALERT_TYPES.ONBOARDING_EXIT_CORRELATION).length
      },
      bySLA: {
        on_track: alerts.filter(a => a.slaStatus === SLA_STATUSES.ON_TRACK).length,
        at_risk: alerts.filter(a => a.slaStatus === SLA_STATUSES.AT_RISK).length,
        breached: alerts.filter(a => a.slaStatus === SLA_STATUSES.BREACHED).length
      }
    };
  }
}