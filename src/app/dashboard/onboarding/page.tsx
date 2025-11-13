'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Componentes específicos de onboarding
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import OnboardingTimeline from '@/components/onboarding/OnboardingTimeline';
import { TopBottomDepartmentsSimple } from '@/components/onboarding/TopBottomDepartmentsSimple';
import { InsightsSimplePanel } from '@/components/onboarding/InsightsSimplePanel';
import { DemographicIntelligencePanel } from '@/components/onboarding/DemographicIntelligencePanel';

// Hook actualizado
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';
import type { OnboardingDashboardData } from '@/hooks/useOnboardingMetrics';

export default function OnboardingDashboard() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const { data, loading, error, refetch } = useOnboardingMetrics(
    selectedDepartment === 'all' ? undefined : selectedDepartment
  );

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
  if (!data || !data.global) {
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
  // PREPARAR DATOS
  // ========================================
  const { global, topDepartments, bottomDepartments, insights, demographics } = data;

  // Timeline stages para 4C Bauer
  const timelineStages = [
    { day: 1, label: 'Compliance', completed: 0, total: global.totalActiveJourneys, avgScore: null },
    { day: 7, label: 'Clarificación', completed: 0, total: global.totalActiveJourneys, avgScore: null },
    { day: 30, label: 'Cultura', completed: 0, total: global.totalActiveJourneys, avgScore: null },
    { day: 90, label: 'Conexión', completed: 0, total: global.totalActiveJourneys, avgScore: null }
  ];

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* HERO - CON LOGO (CAMBIO #1) */}
        <div className="text-center space-y-8">
          {/* Logo FocalizaHR */}
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

        {/* CONTROLES (CAMBIO #2 - SELECT SIN EMOJIS) */}
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

        {/* KPI CARDS - NÚMEROS GIGANTES MINIMALISTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Journeys Activos */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Journeys Activos
            </p>
            <p className="text-6xl font-extralight text-white tabular-nums">
              {global.totalActiveJourneys}
            </p>
            <p className="text-sm text-slate-400">
              En monitoreo continuo
            </p>
          </div>

          {/* Card 2: EXO Score Promedio */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              EXO Score Promedio
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-6xl font-extralight text-white tabular-nums">
                {Math.round(global.avgEXOScore || 0)}
              </p>
              <span className="text-2xl text-cyan-400 font-light">pts</span>
            </div>
            <p className="text-sm text-slate-400">
              Predicción retención
            </p>
          </div>

          {/* Card 3: Alertas Críticas */}
          <div className={`bg-slate-900/30 border rounded-lg p-6 space-y-3 ${
            global.criticalAlerts > 0 
              ? 'border-red-500/50 border-l-4 border-l-red-500' 
              : 'border-slate-800/50'
          }`}>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Alertas Críticas
            </p>
            <p className={`text-6xl font-extralight tabular-nums ${
              global.criticalAlerts > 0 ? 'text-red-400' : 'text-white'
            }`}>
              {global.criticalAlerts}
            </p>
            <Badge 
              variant={global.criticalAlerts > 0 ? "destructive" : "secondary"}
              className="text-xs font-normal"
            >
              {global.criticalAlerts === 0 ? 'Sin alertas' : 'Requiere atención'}
            </Badge>
          </div>

          {/* Card 4: Período Actual (CAMBIO #4 - MÁS PEQUEÑA) */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
              Período Actual
            </p>
            <p className="text-4xl font-extralight text-white tabular-nums">
              {global.period}
            </p>
            <p className="text-sm text-slate-400">
              Mes en curso
            </p>
          </div>
        </div>

        {/* GAUGE + TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {/* CAMBIO #3: Gauge con barSize más delgado (se hace en EXOScoreGauge.tsx) */}
            {/* CAMBIO #5: Trend con flechita (se hace en EXOScoreGauge.tsx) */}
            <EXOScoreGauge 
              score={global.avgEXOScore || 0} 
              label="EXO Score Global"
              trend={global.exoScoreTrend || null}
              size="lg"
            />
          </div>

          <div className="lg:col-span-2">
            <OnboardingTimeline 
              stages={timelineStages}
              totalJourneys={global.totalActiveJourneys}
            />
          </div>
        </div>

        {/* TOP/BOTTOM DEPARTAMENTOS + INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopBottomDepartmentsSimple 
            topDepartments={topDepartments}
            bottomDepartments={bottomDepartments}
          />

          <InsightsSimplePanel insights={insights} />
        </div>

        {/* INTELIGENCIA DEMOGRÁFICA */}
        <DemographicIntelligencePanel 
          demographics={demographics}
          globalScore={global.avgEXOScore || 0}
        />

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