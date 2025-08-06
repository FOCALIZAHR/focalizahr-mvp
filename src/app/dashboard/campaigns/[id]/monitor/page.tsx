// ====================================================================
// FOCALIZAHR MONITOR PAGE - INTEGRACIÓN COCKPIT HEADER
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// Chat 1: Integración del nuevo CockpitHeader reemplazando CampaignMonitorHeader
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';

// 🚀 NUEVO: Import del CockpitHeader bimodal
import { CockpitHeader } from '@/components/monitor/CockpitHeader';

// ✅ MANTENER: Componentes WOW existentes funcionando
import { DepartmentPulsePanel } from '@/components/monitor/DepartmentPulsePanel';
import { ActionButtons } from '@/components/monitor/ActionButtons';
import { AnomalyDetectorPanel } from '@/components/monitor/AnomalyDetectorPanel';
import { EngagementHeatmapCard } from '@/components/monitor/EngagementHeatmapCard';
import { CrossStudyComparatorCard } from '@/components/monitor/CrossStudyComparatorCard';
import CampaignRhythmPanel from '@/components/monitor/CampaignRhythmPanel';

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // ✅ HOOK CENTRAL - Single Source of Truth
  const monitorData = useCampaignMonitor(campaignId);
  const { 
    isLoading,
    error,
    
    // Datos para CockpitHeader
    participationRate,
    daysRemaining,
    totalInvited,
    totalResponded,
    lastActivity,
    topMovers,
    negativeAnomalies,
    insights,
    recommendations,
    lastRefresh,
    
    // Datos para otros componentes WOW
    departmentAnomalies,
    positiveAnomalies,
    meanRate,
    totalDepartments,
    engagementHeatmap,
    crossStudyComparison,
    departmentalIntelligence
  } = monitorData;

  // 🔄 LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="glass-card border border-white/10">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Cargando Torre de Control
            </h3>
            <p className="text-white/60">
              Procesando datos de campaña...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ⚠️ ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Alert className="max-w-md bg-red-500/10 border-red-500/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 🚀 NUEVO COCKPIT HEADER BIMODAL - Reemplaza CampaignMonitorHeader */}
        <CockpitHeader
          // Datos principales
          participationRate={participationRate}
          daysRemaining={daysRemaining}
          totalInvited={totalInvited}
          totalResponded={totalResponded}
          lastActivity={lastActivity}
          
          // Inteligencia departamental
          topMovers={topMovers}
          negativeAnomalies={negativeAnomalies}
          insights={insights}
          recommendations={recommendations}
          
          // Estados
          isLoading={false}
          lastRefresh={lastRefresh}
        />

        {/* ⚡ GRID DE COMPONENTES WOW - Mantener existentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Fila 1: Ritmo + Pulso Departamental */}
          <CampaignRhythmPanel {...monitorData} />
          <DepartmentPulsePanel {...monitorData} />
          
          {/* Fila 2: Anomalías + Engagement */}
          <AnomalyDetectorPanel 
            departmentAnomalies={departmentAnomalies}
            positiveAnomalies={positiveAnomalies}
            negativeAnomalies={negativeAnomalies}
            meanRate={meanRate}
            totalDepartments={totalDepartments}
            lastRefresh={lastRefresh}
          />
          <EngagementHeatmapCard 
            engagementHeatmap={engagementHeatmap}
            lastRefresh={lastRefresh}
          />
          
          {/* Fila 3: Comparativo Histórico (span completo) */}
          <div className="lg:col-span-2">
            <CrossStudyComparatorCard 
              crossStudyComparison={crossStudyComparison}
              lastRefresh={lastRefresh}
            />
          </div>
        </div>

        {/* 🎛️ PANEL DE ACCIONES - Mantener existente */}
        <ActionButtons {...monitorData} />
      </div>
    </div>
  );
}