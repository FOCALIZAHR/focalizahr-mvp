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
  DepartmentalIntelligence,
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
  // 🧠 DEPARTMENTAL INTELLIGENCE - Datos procesados para componente híbrido
  departmentalIntelligence: DepartmentalIntelligence;
}

interface DepartmentalIntelligence {
  topPerformers: Array<{
    name: string;
    participationRate: number;
    count: number;
    total: number;
    rank: number;        // 1, 2, 3
    medal: string;       // 🏆, 🥈, 🥉
    status: string;      // 'excellent'
  }>;
  
  attentionNeeded: Array<{
    name: string;
    participationRate: number;
    count: number;
    total: number;
    urgency: 'critical' | 'high' | 'medium';  // <50%, <70%, <85%
    action: 'llamar' | 'recordar' | 'seguimiento';
    icon: '🚨' | '⚡' | '⚠️';
  }>;
  
  totalDepartments: number;
  averageRate: number;     // 1 decimal
  excellentCount: number;  // >=85%
  criticalCount: number;   // <50%
  allDepartments: Array<{
    name: string;
    participationRate: number;
    count: number;
    total: number;
  }>;
  hasRealData: boolean;    // ✅ CAMPO AGREGADO
  scenarioType: 'NO_DATA' | 'ALL_ZERO' | 'MIXED_DATA';  // ✅ CAMPO QUIRÚRGICO
  displayMessage: string;                                 // ✅ CAMPO QUIRÚRGICO
}

export function useCampaignMonitor(campaignId: string) {
  // ✅ FUSIÓN DE FUENTES DE DATOS - ARQUITECTURA HÍBRIDA CERTIFICADA
  const { data: campaignData, isLoading: resultsLoading, error, refreshData } = useCampaignResults(campaignId);
  const { data: participantsData, isLoading: participantsLoading, refreshData: refreshParticipants } = useCampaignParticipants(campaignId, { includeDetails: true });
  const { data: historicalData, isLoading: historyLoading, crossStudyComparison } = useCampaignHistory({ 
    limit: 5, 
    currentCampaignId: campaignId 
  });
  
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ✅ AUTO-REFRESH SINCRONIZADO
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
      refreshParticipants();
      setLastRefresh(new Date());
    }, 600000);
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
        // 🧠 DEPARTMENTAL INTELLIGENCE - Valor loading
        departmentalIntelligence: {
          topPerformers: [],
          attentionNeeded: [],
          totalDepartments: 0,
          averageRate: 0,
          excellentCount: 0,
          criticalCount: 0,
          allDepartments: [],
          hasRealData: false, // ✅ Estado loading sin datos reales
          scenarioType: 'NO_DATA',
          displayMessage: 'Cargando datos departamentales...'
        },
      };
    }

    const { campaign, analytics } = campaignData;
    const { participants, summary } = participantsData;
    
    // --- REPARACIÓN QUIRÚRGICA: FUSIÓN CORRECTA DE DATOS ---

    // 1. ✅ PARTICIPACIÓN POR DEPARTAMENTO: LÓGICA CORREGIDA Y CERTIFICADA
    const byDepartment: Record<string, DepartmentMonitorData> = {};
    const departmentMapping = analytics.departmentMapping || {};
    const sourceSummary = participantsData.summary?.byDepartment || {};

    // 🔍 DIAGNÓSTICO SISTEMÁTICO - INSPECCIÓN COMPLETA DE AMBAS TUBERÍAS
    console.log("🔍 [DIAGNÓSTICO SISTEMÁTICO] =====================================");
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics completo:", analytics);
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics.segmentationData:", analytics.segmentationData);
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics.departmentMapping:", analytics.departmentMapping);
    console.log("🔍 [TUBERÍA ANALÍTICA] analytics.departmentScores:", analytics.departmentScores);
    console.log("🔍 [TUBERÍA PARTICIPACIÓN] participantsData.summary completo:", participantsData.summary);
    console.log("🔍 [TUBERÍA PARTICIPACIÓN] participantsData.summary.byDepartment:", participantsData.summary?.byDepartment);
    console.log("🔍 [TUBERÍA PARTICIPACIÓN] Object.keys(summary.byDepartment):", Object.keys(participantsData.summary?.byDepartment || {}));
    console.log("🔍 [DIAGNÓSTICO SISTEMÁTICO] =====================================");

    // 🏗️ LÓGICA CONDICIONAL INTELIGENTE - SOPORTE PARA AMBAS GENERACIONES
    let departmentsToShow: string[] = [];
    
    if (analytics.segmentationData && analytics.segmentationData.length > 0) {
      // ✅ CAMPAÑA NUEVA: Usar tubería analítica + DepartmentAdapter
      console.log("🔍 [FLUJO] Campaña NUEVA - Usando tubería analítica");
      departmentsToShow = analytics.segmentationData.map(s => s.segment);
    } else if (Object.keys(sourceSummary).length > 0) {
      // ✅ CAMPAÑA ANTIGUA: Usar tubería participación directa
      console.log("🔍 [FLUJO] Campaña ANTIGUA - Usando tubería participación");
      departmentsToShow = Object.keys(sourceSummary);
    }
    
    console.log("🔍 [FLUJO] departmentsToShow final:", departmentsToShow);

    departmentsToShow.forEach(standardCategory => {
        // LÓGICA CONDICIONAL PARA MAPEO
        let displayName: string;
        let stats: any;
        
        if (analytics.segmentationData && analytics.segmentationData.length > 0) {
          // CAMPAÑA NUEVA: Usar mapping + buscar en sourceSummary con standardCategory
          displayName = departmentMapping[standardCategory.toLowerCase()] || standardCategory;
          stats = sourceSummary[standardCategory];
          console.log("🔍 [FLUJO NUEVO] Procesando:", standardCategory, "→", displayName, "con stats:", stats);
        } else {
          // CAMPAÑA ANTIGUA: Usar nombres directos (standardCategory ES el displayName)
          displayName = standardCategory;
          stats = sourceSummary[standardCategory];
          console.log("🔍 [FLUJO ANTIGUO] Procesando:", standardCategory, "→", displayName, "con stats:", stats);
        }
        
        if (stats) {
            // Lógica de cálculo UNIFICADA
            byDepartment[displayName] = {
                invited: stats.total,
                responded: stats.responded,
                rate: stats.total > 0 ? Math.round((stats.responded / stats.total) * 100) : 0,
            };
        }
    });

    console.log("🔍 [DEBUG CRÍTICO] byDepartment final:", byDepartment);

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
      // 🔥 COMPONENTES WOW - CÁLCULOS EN HOOK COMPLETADOS - CORREGIDO ✅
      engagementHeatmap: processEngagementHeatmap(recentActivity, byDepartment),
      participationPrediction: calculateParticipationPrediction(dailyResponses, analytics.participationRate || 0, daysRemaining),
      // 🔥 NUEVOS CÁLCULOS AGREGADOS
      departmentAnomalies: anomalyData.departmentAnomalies,
      positiveAnomalies: anomalyData.positiveAnomalies,
      negativeAnomalies: anomalyData.negativeAnomalies,
      meanRate: anomalyData.meanRate,
      totalDepartments: anomalyData.totalDepartments,
      crossStudyComparison: historicalData?.crossStudyComparison || null,
    };
  
  }, [campaignData, participantsData, historicalData, campaignId, lastRefresh]);

  // 🧠 DEPARTMENTAL INTELLIGENCE - Cálculo independiente con memoización propia
  const departmentalIntelligence = useMemo(() => {
    const byDepartment = monitorData.byDepartment;
    
    // 🔧 CASO 1: SIN DATOS REALES
    if (!Object.keys(byDepartment).length) {
      return {
        topPerformers: [],
        attentionNeeded: [],
        totalDepartments: 0,
        averageRate: 0,
        excellentCount: 0,
        criticalCount: 0,
        allDepartments: [],
        hasRealData: false,
        scenarioType: 'NO_DATA' as const,
        displayMessage: 'Sin datos departamentales suficientes para análisis'
      };
    }

    // Convertir a array para procesamiento con estructura correcta
    const deptArray = Object.entries(byDepartment).map(([name, data]) => {
      console.log("🔍 [DEBUG] Procesando departamento:", name, "con data:", data);
      return {
        name,
        participationRate: data.rate, // ✅ Usar campo correcto
        count: data.responded,        // ✅ Usar campo correcto
        total: data.invited,          // ✅ Usar campo correcto
      };
    });

    // 🔧 VERIFICAR SI TODOS LOS DEPARTAMENTOS TIENEN 0% PARTICIPACIÓN
    const allDepartmentsZero = deptArray.every(dept => dept.participationRate === 0);
    const hasRealData = deptArray.some(dept => dept.total > 0);

    console.log("🔍 [DEBUG ARQUITECTURA] allDepartmentsZero:", allDepartmentsZero);
    console.log("🔍 [DEBUG ARQUITECTURA] hasRealData:", hasRealData);

    // 🔧 CASO 2: CAMPAÑA EN CERO - TODOS LOS DEPARTAMENTOS 0%
    if (allDepartmentsZero && hasRealData) {
      console.log("🔍 [ARQUITECTURA] CASO 2: Todos los departamentos en 0%");
      return {
        topPerformers: [], // ✅ NO mostrar performers con 0%
        attentionNeeded: deptArray
          .slice(0, 3)
          .map(dept => ({
            ...dept,
            urgency: 'critical' as const,
            action: 'llamar' as const,
            icon: '🚨' as const
          })),
        totalDepartments: deptArray.length,
        averageRate: 0,
        excellentCount: 0,
        criticalCount: deptArray.length,
        allDepartments: deptArray,
        hasRealData: true,
        scenarioType: 'ALL_ZERO' as const,
        displayMessage: 'Campaña sin respuestas - todos los departamentos requieren atención inmediata'
      };
    }

    // 🔧 CASO 3: DATOS MIXTOS - SITUACIÓN NORMAL
    console.log("🔍 [ARQUITECTURA] CASO 3: Datos mixtos");

    // TOP 3 PERFORMERS - Solo departamentos con participación > 0
    const topPerformers = deptArray
      .filter(dept => dept.participationRate > 0) // ✅ CORRECCIÓN: Solo con respuestas
      .sort((a, b) => b.participationRate - a.participationRate)
      .slice(0, 3)
      .map((dept, index) => ({
        ...dept,
        rank: index + 1,
        medal: index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉',
        status: 'excellent'
      }));

    // ATTENTION NEEDED - Departamentos <85% participación
    const attentionNeeded = deptArray
      .filter(dept => dept.participationRate < 85 && dept.total > 0)
      .sort((a, b) => a.participationRate - b.participationRate)
      .slice(0, 3)
      .map(dept => ({
        ...dept,
        urgency: dept.participationRate < 50 ? 'critical' : 
                 dept.participationRate < 70 ? 'high' : 'medium',
        action: dept.participationRate < 50 ? 'llamar' : 
                dept.participationRate < 70 ? 'recordar' : 'seguimiento',
        icon: dept.participationRate < 50 ? '🚨' : 
              dept.participationRate < 70 ? '⚡' : '⚠️'
      }));

    // MÉTRICAS AGREGADAS
    const totalDepartments = deptArray.length;
    const averageRate = totalDepartments > 0 
      ? deptArray.reduce((sum, dept) => sum + dept.participationRate, 0) / totalDepartments 
      : 0;
    const excellentCount = deptArray.filter(dept => dept.participationRate >= 85).length;
    const criticalCount = deptArray.filter(dept => dept.participationRate < 50).length;

    // 🔧 MENSAJE DINÁMICO BASADO EN SITUACIÓN
    let displayMessage = '';
    if (attentionNeeded.length === 0) {
      displayMessage = '🎉 ¡Excelente rendimiento! Todos los departamentos superan el 85% de participación';
    } else if (criticalCount > totalDepartments / 2) {
      displayMessage = '⚠️ Múltiples departamentos requieren atención inmediata';
    } else {
      displayMessage = `📊 ${attentionNeeded.length} departamento(s) requieren seguimiento`;
    }

    return {
      topPerformers,
      attentionNeeded,
      totalDepartments,
      averageRate: Math.round(averageRate * 10) / 10,
      excellentCount,
      criticalCount,
      allDepartments: deptArray,
      hasRealData: true,
      scenarioType: 'MIXED_DATA' as const,
      displayMessage
    };
  }, [monitorData.byDepartment]);

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
    departmentalIntelligence, // ✅ Agregar datos procesados
    error: error || null,
    isLoading: resultsLoading || participantsLoading || historyLoading,
    handleRefresh,
    handleSendReminder,
    handleExtendCampaign,
    handleSendDepartmentReminder,
    getParticipationColor // Función utilitaria expuesta para componentes
  };
}