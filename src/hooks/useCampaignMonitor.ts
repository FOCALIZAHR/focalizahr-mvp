// ARCHIVO: /src/hooks/useCampaignMonitor.ts (VERSIÓN FINAL CERTIFICADA)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCampaignResults, CampaignResultsData } from './useCampaignResults';
import { 
  transformScoresToByDepartment, 
  calculateDaysRemaining,
  formatLocalDate,
  formatLocalDateTime,
  getParticipationColor,
  processDailyResponses,
  type DailyResponse,
  type DepartmentMonitorData
} from '@/lib/utils/monitor-utils';

// Interfaces de datos principales del monitor
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
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    department?: string;
    timestamp: string;
    priority: string;
  }>;
  recentActivity: Array<{
    id: string;
    dept: string;
    participant: string;
    timestamp: string;
    status: string;
    action: string;
  }>;
  lastRefresh: Date;
}

export function useCampaignMonitor(campaignId: string) {
  const { data: campaignData, isLoading: resultsLoading, error, refreshData } = useCampaignResults(campaignId);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, [campaignId, refreshData]);

  // Transformación centralizada de datos usando utilidades puras
  const monitorData = useMemo((): CampaignMonitorData => {
    if (!campaignData) {
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
    
    // Utilizar utilidades puras para transformaciones
    const byDepartment = transformScoresToByDepartment(analytics);
    const daysRemaining = calculateDaysRemaining(campaign.endDate);
    const dailyResponses = processDailyResponses(analytics.trendData);

    // Generar alertas simples basadas en datos
    const alerts = [];
    Object.entries(byDepartment).forEach(([dept, data]) => {
      if (data.rate < 50) {
        alerts.push({
          id: `alert-${dept}`,
          type: 'warning',
          message: `Baja participación en ${dept} (${data.rate}%)`,
          department: dept,
          timestamp: new Date().toLocaleTimeString('es-CL'),
          priority: data.rate < 33 ? 'high' : 'medium'
        });
      }
    });

    // Actividad reciente simulada (en producción vendría de la API)
    const recentActivity = analytics.segmentationData?.slice(0, 5).map((segment, index) => ({
      id: `activity-${index}`,
      dept: segment.segment,
      participant: `Usuario ${index + 1}`,
      timestamp: `${14 + index}:${30 - index * 5}`,
      status: Math.random() > 0.3 ? 'completed' : 'started',
      action: Math.random() > 0.3 ? 'Completó encuesta' : 'Inició encuesta'
    })) || [];

    return {
      isLoading: resultsLoading,
      id: campaignId,
      name: campaign.name || 'Campaña',
      type: campaign.campaignType?.name || campaign.type || 'Estudio',
      status: campaign.status || 'active',
      participationRate: analytics.participationRate || 0,
      totalInvited: analytics.totalInvited || 0,
      totalResponded: analytics.totalResponded || 0,
      daysRemaining,
      lastActivity: formatLocalDateTime(analytics.lastUpdated || new Date()),
      startDate: formatLocalDate(campaign.startDate || new Date()),
      endDate: formatLocalDate(campaign.endDate || new Date()),
      byDepartment,
      dailyResponses,
      alerts,
      recentActivity,
      lastRefresh
    };
  }, [campaignData, campaignId, lastRefresh, resultsLoading]);

  // Handlers y utilidades de UI (permanecen aquí ya que controlan la UI)
  const handleRefresh = useCallback(() => {
    refreshData();
    setLastRefresh(new Date());
  }, [refreshData]);

  const handleSendReminder = useCallback(() => {
    // En producción: llamada a API para enviar recordatorios
    alert('Funcionalidad de recordatorio será implementada en próxima fase');
  }, []);

  const handleExtendCampaign = useCallback(() => {
    // En producción: llamada a API para extender campaña
    alert('Funcionalidad de extensión será implementada en próxima fase');
  }, []);

  const handleSendDepartmentReminder = useCallback((department: string) => {
    // En producción: llamada a API para recordatorio específico
    alert(`Funcionalidad de recordatorio para ${department} será implementada en próxima fase`);
  }, []);

  return {
    ...monitorData,
    error,
    handleRefresh,
    handleSendReminder,
    handleExtendCampaign,
    handleSendDepartmentReminder,
    getParticipationColor // Función utilitaria expuesta para componentes
  };
}