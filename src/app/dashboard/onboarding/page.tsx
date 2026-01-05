'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CyanButton, PurpleButton, NeutralButton, ButtonGroup } from '@/components/ui/MinimalistButton';




// ═══════════════════════════════════════════════════════════════
// 🆕 NAVEGACIÓN - AGREGAR ESTOS 2 IMPORTS
// ═══════════════════════════════════════════════════════════════
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// Componentes específicos de onboarding
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import OnboardingTimeline from '@/components/onboarding/OnboardingTimeline';
import { TopBottomDepartmentsSimple } from '@/components/onboarding/TopBottomDepartmentsSimple';
import { InsightsSimplePanel } from '@/components/onboarding/InsightsSimplePanel';
import { DemographicIntelligencePanel } from '@/components/onboarding/DemographicIntelligencePanel';
import OnboardingTabsToggle from '@/components/onboarding/OnboardingTabsToggle';
// 🆕 NUEVOS COMPONENTES PARA TABS REORGANIZADOS
import GerenciaOnboardingBimodal from '@/components/onboarding/GerenciaOnboardingBimodal';
import AlertasGerenciaRanking from '@/components/onboarding/AlertasGerenciaRanking';
import NPSOnboardingCard from '@/components/onboarding/NPSOnboardingCard';

// 🌟 NUEVOS COMPONENTES CORRECTOS
import OnboardingScoreClassificationCard from '@/components/onboarding/OnboardingScoreClassificationCard';
import BalanceDepartmentalCard from '@/components/onboarding/BalanceDepartmentalCard';
import EvolutionTrendCard from '@/components/onboarding/EvolutionTrendCard';
import ComplianceBanner from '@/components/onboarding/ComplianceBanner';

// Hook actualizado
// Hook actualizado
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';
import type { OnboardingDashboardData } from '@/types/onboarding';


export default function OnboardingDashboard() {
  const router = useRouter();
  
  // ═══════════════════════════════════════════════════════════════
  // 🆕 NAVEGACIÓN - AGREGAR ESTA LÍNEA
  // ═══════════════════════════════════════════════════════════════
  const { isCollapsed } = useSidebar();
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'resumen' | 'ranking' | 'alertas' | 'enps'>('resumen');
  const { data, loading, error, refetch, timelineStages } = useOnboardingMetrics(
    selectedDepartment === 'all' ? undefined : selectedDepartment,
    'company'  // 🆕 AREA_MANAGER ve todas las gerencias para compararse
  );

  // ========================================
  // TYPE GUARD
  // ========================================
  function isGlobalDashboard(data: unknown): data is OnboardingDashboardData {
    return (
      data !== null &&
      typeof data === 'object' &&
      'global' in data &&
      'topDepartments' in data
    );
  }

  // ========================================
  // LOADING STATE
  // ========================================
  if (loading) {
    return (
      <>
        <DashboardNavigation />
        <main className={`min-h-screen bg-[#0F172A] flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Cargando métricas...</p>
          </div>
        </main>
      </>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (error) {
    return (
      <>
        <DashboardNavigation />
        <main className={`min-h-screen bg-[#0F172A] flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-4">
            <p className="text-red-400 text-lg font-medium">Error al cargar datos</p>
            <p className="text-sm text-slate-500">{error}</p>
            <button 
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Reintentar
            </button>
          </div>
        </main>
      </>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================
  if (!data || (isGlobalDashboard(data) && !data.global)) {
    return (
      <>
        <DashboardNavigation />
        <main className={`min-h-screen bg-[#0F172A] flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-3">
            <p className="text-slate-300 text-lg font-medium">Sin journeys activos</p>
            <p className="text-sm text-slate-500">No hay procesos de onboarding en curso.</p>
            <button
              onClick={() => router.push('/dashboard/hub-de-carga')}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Inscribir Primer Colaborador
            </button>
          </div>
        </main>
      </>
    );
  }

  // ========================================
  // VALIDAR TIPO
  // ========================================
  if (!isGlobalDashboard(data)) {
    return (
      <>
        <DashboardNavigation />
        <main className={`min-h-screen bg-[#0F172A] flex items-center justify-center p-6 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-3">
            <p className="text-slate-300 text-lg font-medium">Tipo de datos incorrecto</p>
            <p className="text-sm text-slate-500">Se esperaba OnboardingDashboardData.</p>
          </div>
        </main>
      </>
    );
  }

  // ========================================
  // PREPARAR DATOS
  // ========================================
  const { global, topDepartments, bottomDepartments, insights, demographics, accumulated } = data;

  // 🌟 EXTRAER DATOS PARA LAS 3 CARDS
  const accumulatedData = accumulated || null;
  const departmentImpact = accumulatedData?.departmentImpact || null;
  
  // CARD 1: Classification data
  const scoreForClassification = accumulatedData?.globalExoScore || global.avgEXOScore || 0;
  const periodCountForCard = accumulatedData?.periodCount || 0;
  const totalJourneysForCard = accumulatedData?.totalJourneys || global.totalActiveJourneys || 0;
  
  // CARD 2: Balance data
  const topInfluencer = departmentImpact?.topInfluencer || null;
  const bottomImpact = departmentImpact?.bottomImpact || null;
  
  // CARD 3: Evolution data
  const currentScore = accumulatedData?.globalExoScore || global.avgEXOScore || 0;
  const trendValue = global.exoScoreTrend;

  // ════════════════════════════════════════════════════════════════════
  // 🆕 RENDER PRINCIPAL - CON NAVEGACIÓN INTEGRADA
  // ════════════════════════════════════════════════════════════════════
  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen bg-[#0F172A] transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
          
          {/* HERO */}
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/images/focalizahr-logo_palabra.svg" 
                alt="FocalizaHR" 
                className="h-8 opacity-80"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl font-extralight text-white tracking-tight">
                Onboarding Journey Intelligence
              </h1>
              <p className="text-xl text-slate-400 font-light">
                Sistema predictivo de retención · Monitoreo continuo 4C Bauer
              </p>
            </div>
          </div>

          {/* CONTROLES */}
          <div className="flex items-center justify-center gap-3">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-80 h-12 bg-slate-900/50 border-slate-800 text-slate-300 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">
                  <span className="font-light">Todos los departamentos</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => refetch()}
              className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* TABS TOGGLE - ESTILO BIMODAL TESLA/APPLE              */}
          {/* ══════════════════════════════════════════════════════ */}
          <OnboardingTabsToggle 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* ════════════════════════════════════════════════════ */}
          {/* TAB CONTENT: RESUMEN (Cockpit Estilo Torre Control) */}
          {/* ════════════════════════════════════════════════════ */}
          {activeTab === 'resumen' && (
            <div className="space-y-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* IZQUIERDA: GAUGE PROTAGONISTA */}
                <div className="flex items-center justify-center lg:justify-end">
                  <EXOScoreGauge 
                    score={accumulated?.globalExoScore || global.avgEXOScore || 0}
                    label="EXO Score Global"
                    trend={global.exoScoreTrend || null}
                    size="xl"
                    standardCategory="ALL"  // 🆕 AGREGAR
                    country="CL"            // 🆕 AGREGAR
                  />
                </div>

                {/* ════════════════════════════════════════════════════ */}
                {/* DERECHA: 3 CARDS APILADAS - VERSIÓN CORRECTA ✅     */}
                {/* ════════════════════════════════════════════════════ */}
                <div className="space-y-3">
                  
                  {/* 🌟 CARD 1: CLASIFICACIÓN + BENCHMARK INLINE */}
                  <OnboardingScoreClassificationCard 
                    score={scoreForClassification}
                    periodCount={periodCountForCard}
                    totalJourneys={totalJourneysForCard}
                    companyName="tu empresa"
                  />

                  {/* 🌟 CARD 2: BALANCE DEPARTAMENTAL */}
                  <BalanceDepartmentalCard 
                    topInfluencer={topInfluencer}
                    bottomImpact={bottomImpact}
                  />
                </div>
              </div>

              {/* ✅ NUEVO: Banner Compliance */}
              {data?.complianceEfficiency && (
                <ComplianceBanner
                  departments={data.complianceEfficiency}
                  loading={loading}
                />
              )}
            </div>
          )}

          {/* TAB CONTENT: RANKING GERENCIAS */}
          {activeTab === 'ranking' && (
            <GerenciaOnboardingBimodal 
              data={data}
              loading={loading}
            />
          )}

          {/* TAB CONTENT: eNPS ONBOARDING */}
           {activeTab === 'enps' && (
            <NPSOnboardingCard viewMode="gerencias" scope="company" />
          )}

           {/* TAB CONTENT: ALERTAS POR GERENCIA */}
          {activeTab === 'alertas' && (
            <AlertasGerenciaRanking viewMode="gerencias" scope="company" />
          )}

          {/* CTAs NAVEGACIÓN */}
          <div className="flex items-center justify-center gap-3 pt-12">
            <button
              onClick={() => router.push('/dashboard/onboarding/pipeline')}
              className="group flex items-center gap-2 px-6 py-3 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-slate-300 text-sm font-light hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
            >
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              Ver Pipeline Completo
            </button>

            <button
              onClick={() => router.push('/dashboard/onboarding/alerts')}
              className="group flex items-center gap-2 px-6 py-3 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-slate-300 text-sm font-light hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-400 transition-all"
            >
              <Target className="h-4 w-4" />
              Centro de Alertas
            </button>

            <button
              onClick={() => router.push('/dashboard/hub-de-carga')}
              className="group flex items-center gap-2 px-6 py-3 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-slate-300 text-sm font-light hover:bg-slate-800/50 hover:border-slate-700/50 transition-all"
            >
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              Inscribir Colaborador
            </button>
          </div>

          {/* FOOTER */}
          <div className="pt-8 border-t border-slate-800/50 text-center space-y-2">
            <button
              onClick={() => refetch()}
              className="text-slate-500 hover:text-cyan-400 transition-colors text-xs font-light inline-flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Actualizar datos
            </button>
            <p className="text-xs text-slate-600">
              Última actualización: {new Date().toLocaleString('es-CL')}
            </p>
          </div>

        </div>
      </main>
    </>
  );
}