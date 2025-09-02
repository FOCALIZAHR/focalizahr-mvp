// ====================================================================
// FOCALIZAHR MONITOR PAGE - ARQUITECTURA ORIGINAL + IDs NAVEGACIÓN
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// VERSIÓN CORREGIDA: Props específicas y TopMoversPanel integrado
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';

// 🚀 CockpitHeader bimodal
import { CockpitHeaderBimodal } from '@/components/monitor/CockpitHeaderBimodal';

// ✅ Componentes WOW existentes
import { DepartmentPulsePanel } from '@/components/monitor/DepartmentPulsePanel';
import { TopMoversPanel } from '@/components/monitor/TopMoversPanel'; // ✅ AGREGADO
import { ActionButtons } from '@/components/monitor/ActionButtons';
import { AnomalyDetectorPanel } from '@/components/monitor/AnomalyDetectorPanel';
import { EngagementHeatmapCard } from '@/components/monitor/EngagementHeatmapCard';
import { CrossStudyComparatorCard } from '@/components/monitor/CrossStudyComparatorCard';
import CampaignRhythmPanel from '@/components/monitor/CampaignRhythmPanel';
import LeadershipFingerprintPanel from '@/components/monitor/LeadershipFingerprintPanel';

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

// ✅ CSS FocalizaHR
import '@/styles/focalizahr-design-system.css';

export default function CampaignMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  // ✅ HOOK CENTRAL - Single Source of Truth
  const monitorData = useCampaignMonitor(campaignId);
  const { isLoading, error, lastRefresh } = monitorData;

  // 🔄 LOADING STATE
  if (isLoading) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <Card className="fhr-card border border-white/10">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
            <h3 className="fhr-subtitle text-lg mb-2">
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
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
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
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* 🚀 COCKPIT HEADER - Recibe TODOS los datos del hook incluyendo gráficos */}
        <CockpitHeaderBimodal 
          {...monitorData}
          onScrollToSection={(sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />

        {/* 🎯 PROTAGONISTA - Historia Temporal */}
        <div id="rhythm">
          <CampaignRhythmPanel {...monitorData} />
        </div>

        {/* ⚡ GRID COMPONENTES WOW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pulso Departamental */}
          <div id="pulse">
            <DepartmentPulsePanel {...monitorData} />
          </div>
          
          {/* ✅ TOP MOVERS - CORREGIDO: Era DepartmentPulsePanel duplicado */}
          <div id="topmovers">
            <TopMoversPanel 
              topMovers={monitorData.topMovers}
              lastRefresh={monitorData.lastRefresh}
            />
          </div>
          
          {/* ✅ ANOMALÍAS - CORREGIDO: Props específicas en lugar de spread */}
          <div id="anomalies">
            <AnomalyDetectorPanel 
              departmentAnomalies={monitorData.departmentAnomalies || []}
              positiveAnomalies={monitorData.positiveAnomalies || []}
              negativeAnomalies={monitorData.negativeAnomalies || []}
              meanRate={monitorData.meanRate || 0}
              totalDepartments={monitorData.totalDepartments || 0}
              lastRefresh={monitorData.lastRefresh}
            />
          </div>
          
          {/* Mapa de Calor Engagement */}
          <div>
            <EngagementHeatmapCard {...monitorData} />
          </div>
          
          {/* ✅ CROSS STUDY - CORREGIDO: Prop 'comparison' correcta */}
          <div className="lg:col-span-2" id="cross-study">
            <CrossStudyComparatorCard 
              comparison={monitorData.crossStudyComparison}
              onApplyLearning={() => {
                console.log('Apply learning from historical data');
                // TODO: Implementar lógica de aplicar aprendizajes
              }}
            />
          </div>
        </div>

        {/* 🧠 LEADERSHIP FINGERPRINT - Análisis de Liderazgo Organizacional */}
        <div id="leadership-analysis" className="lg:col-span-2">
          <LeadershipFingerprintPanel 
            leadershipAnalysis={monitorData.leadershipAnalysis} 
          />
        </div>

        {/* 🎛️ PANEL DE ACCIONES */}
        <div id="actions">
          <ActionButtons {...monitorData} />
        </div>
      </div>
    </div>
  );
}