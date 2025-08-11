// ====================================================================
// FOCALIZAHR MONITOR PAGE - ARQUITECTURA ORIGINAL + IDs NAVEGACIÓN
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// SIMPLE: Patrón original que funciona + IDs para scroll
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';

// 🚀 CockpitHeader bimodal
import { CockpitHeader } from '@/components/monitor/CockpitHeader';

// ✅ Componentes WOW existentes
import { DepartmentPulsePanel } from '@/components/monitor/DepartmentPulsePanel';
import { ActionButtons } from '@/components/monitor/ActionButtons';
import { AnomalyDetectorPanel } from '@/components/monitor/AnomalyDetectorPanel';
import { EngagementHeatmapCard } from '@/components/monitor/EngagementHeatmapCard';
import { CrossStudyComparatorCard } from '@/components/monitor/CrossStudyComparatorCard';
import CampaignRhythmPanel from '@/components/monitor/CampaignRhythmPanel';

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
        
        {/* 🚀 COCKPIT HEADER - Simple: recibe monitorData como todos los demás */}
        <CockpitHeader 
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
          
          <div id="pulse">
            <DepartmentPulsePanel {...monitorData} />
          </div>
          
          <div id="topmovers">
            <DepartmentPulsePanel {...monitorData} />
          </div>
          
          <div id="anomalies">
            <AnomalyDetectorPanel {...monitorData} />
          </div>
          
          <div>
            <EngagementHeatmapCard {...monitorData} />
          </div>
          
          <div className="lg:col-span-2" id="cross-study">
            <CrossStudyComparatorCard {...monitorData} />
          </div>
        </div>

        {/* 🎛️ PANEL DE ACCIONES */}
        <div id="actions">
          <ActionButtons {...monitorData} />
        </div>
      </div>
    </div>
  );
}