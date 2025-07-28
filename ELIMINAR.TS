// ====================================================================
// FOCALIZAHR CAMPAIGN MONITOR - HOOK ORQUESTADOR REPARADO
// src/hooks/useCampaignMonitor.ts
// Chat 2: Foundation Schema + Services - REPARACIÓN QUIRÚRGICA COMPLETA
// ====================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCampaignResults } from './useCampaignResults';
import { useCampaignParticipants } from './useCampaignParticipants';
import { 
  calculateRecentActivity,
  getLastActivityDate,
  calculateDaysRemaining,
  formatLocalDate,
  formatLocalDateTime,
  getParticipationColor,
  processDailyResponses,
} from '@/lib/utils/monitor-utils';
import type { 
  DepartmentMonitorData, 
  DailyResponse, 
  ActivityItem, 
  AlertItem 
} from '@/types';

// ✅ INTERFACE PRINCIPAL DEL MONITOR
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
}

export function useCampaignMonitor(campaignId: string) {
  // ✅ FUSIÓN DE FUENTES DE DATOS - ARQUITECTURA HÍBRIDA CERTIFICADA
  const { data: campaignData, isLoading: resultsLoading, error, refreshData } = useCampaignResults(campaignId);
  const { data: participantsData, isLoading: participantsLoading, refreshData: refreshParticipants } = useCampaignParticipants(campaignId, { includeDetails: true });
  
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

  // REEMPLAZAR EL BLOQUE useMemo COMPLETO CON ESTA VERSIÓN FINAL Y SIMPLIFICADA
  const monitorData = useMemo((): CampaignMonitorData => {
    // Estado de carga unificado
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
        lastRefresh
      };
    }

    const { campaign, analytics } = campaignData;
    const { participants, summary } = participantsData;
    
    // --- LÓGICA ÚNICA Y CERTIFICADA ---

    // 1. PARTICIPACIÓN Y ALERTAS: Siempre desde el 'summary', la fuente de verdad para conteos.
    const byDepartment: Record<string, DepartmentMonitorData> = {};
    const departmentMapping = analytics.departmentMapping || {};
    const sourceSummary = summary?.byDepartment || {};

    Object.keys(sourceSummary).forEach(standardCategory => {
        const displayName = departmentMapping[standardCategory.toLowerCase()] || standardCategory;
        const stats = sourceSummary[standardCategory];
        if (stats) {
            byDepartment[displayName] = {
                invited: stats.total,
                responded: stats.responded,
                rate: stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0,
            };
        }
    });

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

    // 2. DATOS DE TIEMPO: Siempre desde el array 'participants', la fuente de verdad para timestamps.
    // No hay fallback. Si no hay datos, no se muestra nada. Jamás se inventan.
    const recentActivity = (participants && participants.length > 0)
      ? calculateRecentActivity(participants, departmentMapping)
      : [];
      
    const lastActivityDate = (participants && participants.length > 0)
      ? getLastActivityDate(participants)
      : null;

    const lastActivity = lastActivityDate 
      ? `Última respuesta: ${formatLocalDateTime(lastActivityDate)}`
      : 'Aún no hay respuestas';
    
    // --- FIN DE LA LÓGICA ---

    const daysRemaining = calculateDaysRemaining(campaign.endDate);
    const dailyResponses = processDailyResponses(analytics.trendData);

    return {
      isLoading: false,
      id: campaignId,
      name: campaign.name || 'Campaña',
      type: campaign.campaignType?.name || campaign.type || 'Estudio',
      status: campaign.status || 'active',
      participationRate: summary?.participationRate || 0,
      totalInvited: summary?.total || 0,
      totalResponded: summary?.responded || 0,
      daysRemaining,
      lastActivity,
      startDate: formatLocalDate(campaign.startDate || new Date()),
      endDate: formatLocalDate(campaign.endDate || new Date()),
      byDepartment,
      dailyResponses,
      alerts,
      recentActivity,
      lastRefresh
    };
  }, [campaignData, participantsData, campaignId, lastRefresh]);

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
    isLoading: resultsLoading || participantsLoading,
    handleRefresh,
    handleSendReminder,
    handleExtendCampaign,
    handleSendDepartmentReminder,
    getParticipationColor // Función utilitaria expuesta para componentes
  };
}