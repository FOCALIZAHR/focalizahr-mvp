// ====================================================================
// FOCALIZAHR CAMPAIGN MONITOR PAGE - REPARACIÓN QUIRÚRGICA
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// Chat Transición: Agregar COMPONENTES WOW al layout
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';
import { CampaignMonitorHeader } from '@/components/monitor/CampaignMonitorHeader';
import { CampaignMetricsGrid } from '@/components/monitor/CampaignMetricsGrid';
import { DepartmentPulsePanel } from '@/components/monitor/DepartmentPulsePanel';
import { ActivityFeed } from '@/components/monitor/ActivityFeed';
import { DailyChart } from '@/components/monitor/DailyChart';
import { AlertsPanel } from '@/components/monitor/AlertsPanel';
import { ActionButtons } from '@/components/monitor/ActionButtons';

// ✅ COMPONENTES WOW - IMPORTS AGREGADOS
import { AnomalyDetectorPanel } from '@/components/monitor/AnomalyDetectorPanel';
import { EngagementHeatmapCard } from '@/components/monitor/EngagementHeatmapCard';
import { ParticipationPredictorCard } from '@/components/monitor/ParticipationPredictorCard';
import { CrossStudyComparatorCard } from '@/components/monitor/CrossStudyComparatorCard';
import CampaignRhythmPanel from '@/components/monitor/CampaignRhythmPanel';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // ✅ EXTRAER DATOS WOW DEL HOOK - COMPLETOS
  const monitorData = useCampaignMonitor(campaignId);
  const { 
    departmentAnomalies,
    positiveAnomalies,
    negativeAnomalies, 
    meanRate,
    totalDepartments,
    engagementHeatmap, 
    participationPrediction,
    crossStudyComparison,
    isLoading 
  } = monitorData;

  // GUARDIÁN DE CARGA: Previene el error TypeError
  if (isLoading) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8 text-center text-white">
          Cargando Torre de Control...
        </div>
      </div>
    );
  }

  // MANEJO DE ERRORES
  if (monitorData.error) {
    return (
      <div className="neural-dashboard main-layout min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-white">
              Error cargando datos: {monitorData.error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="neural-dashboard main-layout min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        
        {/* ✅ COMPONENTES EXISTENTES PRESERVADOS */}
        <CampaignMonitorHeader {...monitorData} router={router} />
        <CampaignMetricsGrid {...monitorData} />
        
        {/* 🔥 NUEVO COMPONENTE WOW: PANEL DE RITMO Y PROYECCIÓN */}
        <CampaignRhythmPanel 
          dailyResponses={monitorData.dailyResponses}
          participationRate={monitorData.participationRate}
          participationPrediction={monitorData.participationPrediction}
          daysRemaining={monitorData.daysRemaining}
          totalInvited={monitorData.totalInvited}
          targetRate={70}
        />
        
        {/* 🔥 COMPONENTES WOW - SECCIÓN EXISTENTE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✅ COMPONENTE WOW #1: ENGAGEMENT HEATMAP */}
          <EngagementHeatmapCard 
            engagementHeatmap={engagementHeatmap}
            lastRefresh={monitorData.lastRefresh}
          />
          
          {/* ✅ COMPONENTE WOW #2: PARTICIPATION PREDICTOR */}
          <ParticipationPredictorCard 
            participationPrediction={participationPrediction}
            currentRate={monitorData.participationRate}
            daysLeft={monitorData.daysRemaining}
            lastRefresh={monitorData.lastRefresh}
          />
        </div>

        {/* 🔥 COMPONENTE WOW #3: CROSS-STUDY COMPARATOR */}
        <div className="w-full">
          {crossStudyComparison && (
            <CrossStudyComparatorCard comparison={crossStudyComparison} />
          )}
        </div>
        
        {/* ✅ LAYOUT GRID PARA COMPONENTES PRINCIPALES */}
        <div className="grid grid-cols-1 gap-6">
          {/* 🔥 NUEVO COMPONENTE WOW: DEPARTMENT PULSE PANEL */}
          <DepartmentPulsePanel 
            byDepartment={monitorData.byDepartment}
            handleSendDepartmentReminder={monitorData.handleSendDepartmentReminder}
            lastRefresh={monitorData.lastRefresh}
          />
          
          {/* ✅ COMPONENTE WOW #4: ANOMALY DETECTOR PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <AnomalyDetectorPanel 
              departmentAnomalies={departmentAnomalies}
              positiveAnomalies={positiveAnomalies}
              negativeAnomalies={negativeAnomalies}
              meanRate={meanRate}
              totalDepartments={totalDepartments}
              lastRefresh={monitorData.lastRefresh}
            />
          </div>
        </div>
        
        {/* ✅ COMPONENTES RESTANTES */}
        <ActivityFeed {...monitorData} />
        <DailyChart {...monitorData} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsPanel {...monitorData} />
          <ActionButtons {...monitorData} />
        </div>
        
        <div className="text-center text-sm text-white/40">
          Última actualización: {monitorData.lastRefresh.toLocaleTimeString()} • 
          <span className="text-white/50">
            Se actualiza automáticamente cada 10 minutos
          </span>
        </div>
      </div>
    </div>
  );
}