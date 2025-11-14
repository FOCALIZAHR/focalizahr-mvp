'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Componentes específicos de onboarding
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import OnboardingTimeline from '@/components/onboarding/OnboardingTimeline';
import { TopBottomDepartmentsSimple } from '@/components/onboarding/TopBottomDepartmentsSimple';
import { InsightsSimplePanel } from '@/components/onboarding/InsightsSimplePanel';
import { DemographicIntelligencePanel } from '@/components/onboarding/DemographicIntelligencePanel';
import OnboardingTabsToggle from '@/components/onboarding/OnboardingTabsToggle';

// Hook actualizado
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';
import type { OnboardingDashboardData } from '@/types/onboarding';

export default function OnboardingDashboard() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'resumen' | 'gps' | 'diagnostic' | 'demographic'>('resumen');
  
  const { data, loading, error, refetch, timelineStages } = useOnboardingMetrics(
    selectedDepartment === 'all' ? undefined : selectedDepartment
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
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
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
      </div>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================
  if (!data || (isGlobalDashboard(data) && !data.global)) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
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
      </div>
    );
  }

  // ========================================
  // VALIDAR TIPO
  // ========================================
  if (!isGlobalDashboard(data)) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-3">
          <p className="text-slate-300 text-lg font-medium">Tipo de datos incorrecto</p>
          <p className="text-sm text-slate-500">Se esperaba OnboardingDashboardData.</p>
        </div>
      </div>
    );
  }

  // ========================================
  // PREPARAR DATOS
  // ========================================
  const { global, topDepartments, bottomDepartments, insights, demographics } = data;

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="min-h-screen bg-[#0F172A]">
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
                  score={global.avgEXOScore || 0}
                  label="EXO Score Global"
                  trend={global.exoScoreTrend || null}
                  size="xl"
                />
              </div>

              {/* DERECHA: 3 CARDS APILADAS - COMPACTAS */}
              <div className="space-y-3">
                
                {/* CARD 1: Ritmo y Momentum */}
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <p className="text-[10px] uppercase tracking-wider font-medium">
                      Ritmo y Momentum
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-extralight text-white tabular-nums">
                      {global.totalActiveJourneys}
                    </p>
                    <span className="text-xs text-slate-500">journeys · {global.period}</span>
                  </div>
                  {global.exoScoreTrend !== null && global.exoScoreTrend !== undefined && (
                    <div className="flex items-center gap-1.5">
                      {global.exoScoreTrend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : global.exoScoreTrend < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      ) : null}
                      <span className={`text-xs font-medium ${
                        global.exoScoreTrend > 0 ? 'text-green-400' : 
                        global.exoScoreTrend < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {global.exoScoreTrend > 0 ? '+' : ''}{global.exoScoreTrend} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* CARD 2: Acción Prioritaria */}
                <div className={`bg-slate-900/30 border rounded-lg p-4 space-y-2 ${
                  global.criticalAlerts > 0 
                    ? 'border-red-500/50 border-l-4 border-l-red-500' 
                    : 'border-slate-800/50'
                }`}>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Target className="h-3.5 w-3.5" />
                    <p className="text-[10px] uppercase tracking-wider font-medium">
                      Acción Prioritaria
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-extralight tabular-nums ${
                      global.criticalAlerts > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {global.criticalAlerts}
                    </p>
                    <span className="text-xs text-slate-500">alertas críticas</span>
                  </div>
                  <Badge 
                    variant={global.criticalAlerts > 0 ? "destructive" : "secondary"}
                    className="text-[10px] font-normal px-2 py-0.5"
                  >
                    {global.criticalAlerts === 0 ? 'Sin alertas' : 'Requiere intervención'}
                  </Badge>
                </div>

                {/* CARD 3: Panorama y Proyección */}
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <p className="text-[10px] uppercase tracking-wider font-medium">
                      Panorama y Proyección
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-extralight text-white tabular-nums">
                      {Math.round(global.avgEXOScore || 0)}
                    </p>
                    <span className="text-xs text-slate-500">pts promedio</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: GPS TÁCTICO */}
        {activeTab === 'gps' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopBottomDepartmentsSimple 
                topDepartments={topDepartments}
                bottomDepartments={bottomDepartments}
              />
              <InsightsSimplePanel insights={insights} />
            </div>
          </div>
        )}

        {/* TAB CONTENT: DIAGNÓSTICO 4C */}
        {activeTab === 'diagnostic' && (
          <OnboardingTimeline 
            stages={timelineStages}
            avgScore={global.avgEXOScore || 0}
            totalJourneys={global.totalActiveJourneys}
          />
        )}

        {/* TAB CONTENT: DEMOGRAFÍA */}
        {activeTab === 'demographic' && (
          <DemographicIntelligencePanel 
            demographics={demographics}
            globalScore={global.avgEXOScore || 0}
          />
        )}

        {/* CTAs NAVEGACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/onboarding/pipeline')}
            className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Ver Pipeline Completo
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => router.push('/dashboard/onboarding/alerts')}
            className="h-12 px-6 border border-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-900/50 hover:border-cyan-500/50 transition-colors"
          >
            Centro de Alertas
          </button>

          <button
            onClick={() => router.push('/dashboard/hub-de-carga')}
            className="h-12 px-6 border border-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-900/50 hover:border-cyan-500/50 transition-colors"
          >
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
    </div>
  );
}