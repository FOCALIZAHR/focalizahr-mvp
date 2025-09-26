// ====================================================================
// FOCALIZAHR MONITOR PAGE - ARQUITECTURA ORIGINAL + IDs NAVEGACIÓN
// src/app/dashboard/campaigns/[id]/monitor/page.tsx
// VERSIÓN INTEGRADA: GerenciaPulseBimodal agregado como Nivel 2
// ====================================================================

'use client';

import { useCampaignMonitor } from '@/hooks/useCampaignMonitor';
import { useRouter, useParams } from 'next/navigation';

// 🚀 CockpitHeader bimodal
import { CockpitHeaderBimodal } from '@/components/monitor/CockpitHeaderBimodal';

// ⭐ NUEVO - Componente Gerencias WOW
import { GerenciaPulseBimodal } from '@/components/monitor/GerenciaPulseBimodal';

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
        
        {/* 🚀 NIVEL 1: COCKPIT HEADER - Recibe TODOS los datos del hook incluyendo gráficos */}
        <CockpitHeaderBimodal 
          {...monitorData}
          onScrollToSection={(sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />

        {/* ⭐ NIVEL 2: GERENCIA PULSE BIMODAL (NUEVO) - Vista Ejecutiva de Gerencias */}
        {/* DEBUG: Verificar qué datos están llegando */}
        {console.log('🔍 DEBUG monitorData:', {
          hasHierarchy: monitorData.hasHierarchy,
          gerenciaData: monitorData.gerenciaData,
          hierarchicalData: (monitorData as any).hierarchicalData,
          fullMonitorData: monitorData
        })}
        
        {/* Temporalmente mostrar el componente siempre para debug */}
        <div className="border-2 border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-400 mb-2">DEBUG - Estado del Componente:</p>
          <p className="text-white">hasHierarchy: {String(monitorData.hasHierarchy)}</p>
          <p className="text-white">gerenciaData existe: {monitorData.gerenciaData ? 'SÍ' : 'NO'}</p>
          <p className="text-white">gerenciaData length: {monitorData.gerenciaData?.length || 0}</p>
          
          {/* Intenta renderizar el componente con datos fallback */}
          <GerenciaPulseBimodal 
            gerenciaData={monitorData.gerenciaData || []}
            hasHierarchy={monitorData.hasHierarchy || false}
          />
        </div>
        
        {/* SEPARADOR VISUAL - Mantenerlo visible para debug */}
        <div className="my-10 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gradient-to-r from-cyan-600/20 via-purple-600/20 to-cyan-600/20"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-[#0a0e1a] px-8 py-4 rounded-full backdrop-blur-xl border border-white/10">
              <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-3xl">📊</span>
                ANÁLISIS INTELIGENTE DETALLADO - DEPARTAMENTOS
              </h2>
            </div>
          </div>
        </div>

        {/* 🎯 NIVEL 3: PROTAGONISTA - Historia Temporal */}
        <div id="rhythm">
          <CampaignRhythmPanel {...monitorData} />
        </div>

        {/* ⚡ NIVEL 4: GRID COMPONENTES WOW - Análisis Detallado Departamentos */}
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