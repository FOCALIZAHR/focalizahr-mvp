// ====================================================================
// FOCALIZAHR CAMPAIGN MONITOR - HOOK ORQUESTADOR REPARADO
// src/hooks/useCampaignMonitor.ts
// Chat 2: Foundation Schema + Services - REPARACIÓN QUIRÚRGICA COMPLETA
// ====================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCampaignResults } from './useCampaignResults';
import { useCampaignParticipants } from './useCampaignParticipants';
import { useCampaignHistory } from './useCampaignHistory';
import { 
  calculateRecentActivity,
  getLastActivityDate,
  calculateDaysRemaining,
  formatLocalDate,
  formatLocalDateTime,
  getParticipationColor,
  processDailyResponses,
  processEngagementHeatmap,
  calculateParticipationPrediction,
  calculateDepartmentAnomalies,
  calculateCrossStudyComparison,
} from '@/lib/utils/monitor-utils';
import type { 
  DepartmentMonitorData, 
  DailyResponse, 
  ActivityItem, 
  AlertItem,
  EngagementHeatmapData,
  ParticipationPredictionData,
  DepartmentAnomalyData,
  CrossStudyComparisonData,
} from '@/types'

// ✅ INTERFACE PRINCIPAL DEL MONITOR - EXTENDIDA
export interface CampaignMonitorData {
  isLoading: boolean;
  id: string;
  name: string;
  type: string;
  status: string;
  participationRate: number;
  totalInvited: number;
  totalResponded: number;
  daysRemaining: number;
  lastActivity: string;
  startDate: string;
  endDate: string;
  byDepartment: Record<string, DepartmentMonitorData>;
  dailyResponses: DailyResponse[];
  alerts: AlertItem[];
  recentActivity: ActivityItem[];
  lastRefresh: Date;
  // 🔥 COMPONENTES WOW - DATOS CALCULADOS COMPLETOS
  engagementHeatmap?: EngagementHeatmapData;
  participationPrediction?: ParticipationPredictionData;
  departmentAnomalies: DepartmentAnomalyData[];
  positiveAnomalies: DepartmentAnomalyData[];
  negativeAnomalies: DepartmentAnomalyData[];
  meanRate: number;
  totalDepartments: number;
  crossStudyComparison?: CrossStudyComparisonData;
}

export function useCampaignMonitor(campaignId: string) {
  // ✅ FUSIÓN DE FUENTES DE DATOS - ARQUITECTURA HÍBRIDA CERTIFICADA
  const { data: campaignData, isLoading: resultsLoading, error, refreshData } = useCampaignResults(campaignId);
  const { data: participantsData, isLoading: participantsLoading, refreshData: refreshParticipants } = useCampaignParticipants(campaignId, { includeDetails: true });
  const { data: historicalData, isLoading: historyLoading } = useCampaignHistory({ limit: 5 });
  
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ✅ AUTO-REFRESH SINCRONIZADO
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
      refreshParticipants();
      setLastRefresh(new Date());
    }, 300000);
    return () => clearInterval(interval);
  }, [campaignId, refreshData, refreshParticipants]);

  // ✅ TRANSFORMACIÓN CENTRALIZADA CON DATOS REALES - REPARACIÓN QUIRÚRGICA
  const monitorData = useMemo((): CampaignMonitorData => {
    // ==========================================================
    // INICIO DEL CÓDIGO DE DIAGNÓSTICO
    // ==========================================================
    console.log('[DIAGNÓSTICO ARQUITECTO] Datos recibidos en useCampaignMonitor:', {
        campaignDataExists: !!campaignData,
        participantsDataExists: !!participantsData,
        participantsArray: participantsData?.participants,
        participantCount: participantsData?.participants?.length || 0,
        firstParticipant: participantsData?.participants?.[0]
    });
    // ==========================================================
    // FIN DEL CÓDIGO DE DIAGNÓSTICO
    // ==========================================================
    
    if (!campaignData || !participantsData) {
      return {
        isLoading: true,
        id: campaignId,
        name: 'Cargando...',
        type: '',
        status: 'loading',
        participationRate: 0,
        totalInvited: 0,
        totalResponded: 0,
        daysRemaining: 0,
        lastActivity: '',
        startDate: '',
        endDate: '',
        byDepartment: {},
        dailyResponses: [],
        alerts: [],
        recentActivity: [],
        lastRefresh,
        // 🔥 COMPONENTES WOW - VALORES LOADING
        departmentAnomalies: [],
        positiveAnomalies: [],
        negativeAnomalies: [],
        meanRate: 0,
        totalDepartments: 0,
      };
    }

    const { campaign, analytics } = campaignData;
    const { participants, summary } = participantsData;
    
    // --- REPARACIÓN QUIRÚRGICA: FUSIÓN CORRECTA DE DATOS ---

    // 1. ✅ PARTICIPACIÓN POR DEPARTAMENTO: LÓGICA CORREGIDA Y CERTIFICADA
    const byDepartment: Record<string, DepartmentMonitorData> = {};
    const departmentMapping = analytics.departmentMapping || {};
    const sourceSummary = participantsData.summary?.byDepartment || {};

    // La fuente de verdad para los nombres de display son los datos de analytics
    const departmentsToShow = analytics.segmentationData?.map(s => s.segment) || Object.keys(sourceSummary);

    departmentsToShow.forEach(standardCategory => {
        // Usar el mapping para obtener el nombre que ve el cliente
        const displayName = departmentMapping[standardCategory.toLowerCase()] || standardCategory;

        // Usar el summary de /participants como la ÚNICA fuente de verdad para los conteos
        const stats = sourceSummary[standardCategory];
        
        if (stats) {
            // Lógica de cálculo CORRECTA
            byDepartment[displayName] = {
                invited: stats.total,
                responded: stats.responded,
                rate: stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0,
            };
        }
    });

    // 2. ✅ ACTIVIDAD RECIENTE: USAR FUNCIÓN DE UTILIDAD calculateRecentActivity
    const recentActivity: ActivityItem[] = [];
    if (participants && participants.length > 0) {
      // Usar función de utilidad específica mencionada en la directriz
      const calculatedActivity = calculateRecentActivity(participants, departmentMapping);
      recentActivity.push(...calculatedActivity);
    }
    
    // Fallback: generar actividad basada en departamentos si no hay detalles
    if (recentActivity.length === 0 && analytics.segmentationData) {
      analytics.segmentationData
        .filter(segment => segment.percentage > 0)
        .slice(0, 5)
        .forEach((segment, index) => {
          const displayName = departmentMapping[segment.segment.toLowerCase()] || segment.segment;
          recentActivity.push({
            id: `activity-${index}`,
            dept: displayName,
            participant: `${Math.round((segment.count * segment.percentage) / 100)} respuesta(s)`,
            timestamp: new Date(Date.now() - index * 3600000).toLocaleTimeString('es-CL'),
            status: 'completed',
            action: `Actividad departamental (${Math.round(segment.percentage)}%)`
          });
        });
    }

    // 3. ✅ ÚLTIMA ACTIVIDAD: USAR FUNCIÓN DE UTILIDAD getLastActivityDate
    let lastActivity = 'Sin actividad registrada';
    
    if (participants && participants.length > 0) {
      // Usar función de utilidad específica mencionada en la directriz
      const lastActivityDate = getLastActivityDate(participants);
      if (lastActivityDate) {
        lastActivity = `Última actividad: ${lastActivityDate.toLocaleString('es-CL')}`;
      }
    }
    
    // Fallback: usar datos de summary si no hay participantes detallados
    if (lastActivity === 'Sin actividad registrada') {
      if (summary && summary.responded > 0) {
        const participationRate = summary.participationRate || 
          (summary.total > 0 ? Math.round((summary.responded / summary.total) * 100) : 0);
        lastActivity = `Última actualización: ${participationRate}% participación (${summary.responded}/${summary.total} respuestas)`;
      } else if (analytics.totalResponded > 0) {
        const rate = analytics.participationRate || 
          (analytics.totalInvited > 0 ? Math.round((analytics.totalResponded / analytics.totalInvited) * 100) : 0);
        lastActivity = `Analytics: ${rate}% participación (${analytics.totalResponded}/${analytics.totalInvited} respuestas)`;
      }
    }

    // 4. ✅ ALERTAS REALES: BASADAS EN DATOS FUSIONADOS CON MAPEO DEPARTAMENTAL
    const alerts: AlertItem[] = [];
    Object.entries(byDepartment).forEach(([displayName, data]) => {
      if (data.rate < 50 && data.invited > 2) {
        alerts.push({ 
          id: `alert-${displayName.replace(/\s+/g, '-').toLowerCase()}`, 
          type: 'warning', 
          message: `Baja participación en ${displayName} (${data.rate}% - ${data.responded}/${data.invited})`,
          department: displayName,
          timestamp: new Date().toLocaleTimeString('es-CL'),
          priority: data.rate < 33 ? 'high' : 'medium'
        });
      }
    });

    // ✅ UTILIZAR UTILIDADES PURAS PARA RESTO DE TRANSFORMACIONES
    const daysRemaining = calculateDaysRemaining(campaign.endDate);
    const dailyResponses = processDailyResponses(analytics.trendData);

    // 🔥 COMPONENTES WOW - CÁLCULOS COMPLETOS EN HOOK
    const anomalyData = calculateDepartmentAnomalies(byDepartment);
    
    // ✅ DATOS HISTÓRICOS REALES DE API (reemplaza mock)
    const historicalCampaigns = historicalData?.campaigns || [];

    return {
      isLoading: false,
      id: campaignId,
      name: campaign.name || 'Campaña',
      type: campaign.campaignType?.name || campaign.type || 'Estudio',
      status: campaign.status || 'active',
      participationRate: summary?.participationRate || analytics.participationRate || 0,
      totalInvited: summary?.total || analytics.totalInvited || 0,
      totalResponded: summary?.responded || analytics.totalResponded || 0,
      daysRemaining,
      lastActivity,
      startDate: formatLocalDate(campaign.startDate || new Date()),
      endDate: formatLocalDate(campaign.endDate || new Date()),
      byDepartment,
      dailyResponses,
      alerts,
      recentActivity,
      lastRefresh,
      // 🔥 COMPONENTES WOW - CÁLCULOS EN HOOK COMPLETADOS
      engagementHeatmap: recentActivity.length > 0 ? 
        processEngagementHeatmap(recentActivity, byDepartment) : undefined,
      participationPrediction: dailyResponses.length > 0 && daysRemaining > 0 ?
        calculateParticipationPrediction(dailyResponses, analytics.participationRate || 0, daysRemaining) : undefined,
      // 🔥 NUEVOS CÁLCULOS AGREGADOS
      departmentAnomalies: anomalyData.departmentAnomalies,
      positiveAnomalies: anomalyData.positiveAnomalies,
      negativeAnomalies: anomalyData.negativeAnomalies,
      meanRate: anomalyData.meanRate,
      totalDepartments: anomalyData.totalDepartments,
      crossStudyComparison: calculateCrossStudyComparison(campaign, historicalCampaigns),
      // 🔍 DEBUGGING - AGREGAR ESTAS 6 LÍNEAS:
      __debug1: console.log('🔍 DEBUGGING CROSS-STUDY:'),
      __debug2: console.log('- campaign object:', {
          type: campaign.type,
          campaignType: campaign.campaignType,
          name: campaign.name,
          allProps: Object.keys(campaign)
        }),
      __debug3: console.log('- historical campaigns:', historicalCampaigns.map(h => ({name: h.name, type: h.type}))),
      __debug4: console.log('- historicalCampaigns.length:', historicalCampaigns.length),
      __debug5: console.log('- same type filter:', historicalCampaigns.filter(h => h.type === (campaign.campaignType?.slug || campaign.type))),
      __debug6: console.log('- function result:', calculateCrossStudyComparison(campaign, historicalCampaigns)),
    };
  
  }, [campaignData, participantsData, historicalData, campaignId, lastRefresh]);

  // ✅ HANDLERS Y UTILIDADES DE UI
  const handleRefresh = useCallback(() => {
    refreshData();
    refreshParticipants();
    setLastRefresh(new Date());
  }, [refreshData, refreshParticipants]);

  // ✅ CONECTAR BOTONES A APIS REALES - PRÓXIMA FASE
  const handleSendReminder = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/reminders`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'general' })
      });
      
      if (response.ok) {
        console.log('✅ Reminder sent successfully');
        handleRefresh(); // Refresh data after action
      } else {
        console.error('❌ Error sending reminder');
        alert('Error enviando recordatorio. Inténtelo nuevamente.');
      }
    } catch (error) {
      console.error('❌ Network error sending reminder:', error);
      alert('Funcionalidad de recordatorio será implementada en próxima fase');
    }
  }, [campaignId, handleRefresh]);

  const handleExtendCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/extend`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      });
      
      if (response.ok) {
        console.log('✅ Campaign extended successfully');
        handleRefresh(); // Refresh data after action
      } else {
        console.error('❌ Error extending campaign');
        alert('Error extendiendo campaña. Inténtelo nuevamente.');
      }
    } catch (error) {
      console.error('❌ Network error extending campaign:', error);
      alert('Funcionalidad de extensión será implementada en próxima fase');
    }
  }, [campaignId, handleRefresh]);

  const handleSendDepartmentReminder = useCallback(async (department: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/reminders`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'department', department })
      });
      
      if (response.ok) {
        console.log(`✅ Department reminder sent to ${department}`);
        handleRefresh(); // Refresh data after action
      } else {
        console.error(`❌ Error sending reminder to ${department}`);
        alert(`Error enviando recordatorio a ${department}. Inténtelo nuevamente.`);
      }
    } catch (error) {
      console.error(`❌ Network error sending reminder to ${department}:`, error);
      alert(`Funcionalidad de recordatorio para ${department} será implementada en próxima fase`);
    }
  }, [campaignId, handleRefresh]);

  return {
    ...monitorData,
    error: error || (participantsData && participantsData.error) || null,
    isLoading: resultsLoading || participantsLoading || historyLoading,
    handleRefresh,
    handleSendReminder,
    handleExtendCampaign,
    handleSendDepartmentReminder,
    getParticipationColor // Función utilitaria expuesta para componentes
  };
}