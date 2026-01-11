// ====================================================================
// VISTA EJECUTIVA - EXIT INTELLIGENCE BY DEPARTAMENTOS
// src/app/dashboard/exit/executive/page.tsx
// v3.0 - Con RootCausesStepper (Narrativa 3 Actos)
// ====================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  LayoutDashboard,
  Trophy,
  BarChart3,
  Building2,
  ChevronDown
} from 'lucide-react';

// ====================================================================
// NAVEGACION Y LAYOUT
// ====================================================================
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ====================================================================
// COMPONENTES EXIT
// ====================================================================
import VerticalTabsNav, { TabItem } from '@/components/ui/VerticalTabsNav';
import GerenciaExitBimodal from '@/components/exit/GerenciaExitBimodal';
import AlertasExitRanking from '@/components/exit/AlertasExitRanking';
import NPSExitCard from '@/components/exit/NPSExitCard';

// 🆕 COMPONENTES TAB RESUMEN (replicado de página principal)
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import ExitBenchmarkCard from '@/components/exit/ExitBenchmarkCard';
import { EfectividadPredictivaCard } from '@/components/exit/EfectividadPredictivaCard';

// ====================================================================
// HOOKS
// ====================================================================
import { useExitMetrics } from '@/hooks/useExitMetrics';

// ====================================================================
// TYPES
// ====================================================================
type TabValue = 'resumen' | 'ranking' | 'alertas' | 'enps';

const TABS_CONFIG: TabItem<TabValue>[] = [
  { value: 'resumen', label: 'Resumen', icon: LayoutDashboard, color: 'cyan' },
  { value: 'ranking', label: 'Ranking', icon: Trophy, color: 'cyan' },
  { value: 'alertas', label: 'Alertas', icon: AlertTriangle, color: 'amber' },
  { value: 'enps', label: 'eNPS', icon: BarChart3, color: 'purple' }
];

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function ExitExecutivePage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabValue>('resumen');
  const [selectedGerenciaId, setSelectedGerenciaId] = useState<string | null>(null);

  // Hook Exit con scope filtered
  const { departments, summary, loading, error, refetch } = useExitMetrics(undefined, 'filtered');

  // ══════════════════════════════════════════════════════════════════
  // ESTADOS: LOADING
  // ══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" strokeWidth={1.5} />
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ESTADOS: ERROR
  // ══════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen px-4">
            <div className="fhr-card p-8 text-center space-y-4 max-w-md">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" strokeWidth={1.5} />
              <p className="text-slate-300">Error cargando datos</p>
              <button
                onClick={() => refetch()}
                className="fhr-btn fhr-btn-secondary"
              >
                Reintentar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // EXTRAER GERENCIAS (nivel 2) para selector
  // ══════════════════════════════════════════════════════════════════
  const gerencias = (departments || [])
    .filter(d => d.level === 2)
    .sort((a, b) => a.departmentName.localeCompare(b.departmentName));

  // Gerencia efectiva
  const effectiveGerenciaId = selectedGerenciaId;

  // Nombre de la gerencia seleccionada
  const selectedGerenciaName = effectiveGerenciaId
    ? gerencias.find(g => g.departmentId === effectiveGerenciaId)?.departmentName || ''
    : '';

  // Filtrar departamentos segun gerencia seleccionada
  const filteredDepartments = effectiveGerenciaId
    ? (departments || []).filter(d =>
        d.departmentId === effectiveGerenciaId ||
        d.parentId === effectiveGerenciaId
      )
    : departments || [];

  // Alertas criticas
  const criticalAlerts = summary?.alerts?.critical ?? 0;

  // ══════════════════════════════════════════════════════════════════
  // TABS CON BADGE DE ALERTAS
  // ══════════════════════════════════════════════════════════════════
  const tabsWithBadges = TABS_CONFIG.map(tab =>
    tab.value === 'alertas' && criticalAlerts > 0
      ? { ...tab, badge: criticalAlerts }
      : tab
  );

  // ══════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen fhr-bg-main flex relative">

      {/* FONDOS BLUR */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <DashboardNavigation />

      <main className={`
        flex-1 relative z-10
        transition-all duration-300
        ${isCollapsed ? 'ml-20' : 'ml-72'}
      `}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="mb-8">
            {/* Navegacion superior */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/dashboard/exit')}
                className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <button
                onClick={() => refetch()}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              </button>
            </div>

            {/* Titulo con gradiente */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white tracking-tight mb-3">
                Vista{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  Ejecutiva Exit
                </span>
              </h1>

              {/* Linea Tesla */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
              </div>

              <p className="text-sm sm:text-base text-slate-500 font-light">
                Analisis de salidas por departamentos
              </p>
            </div>
          </div>

          {/* SELECTOR DE GERENCIA */}
          {gerencias.length > 1 && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                </div>

                <select
                  value={selectedGerenciaId || ''}
                  onChange={(e) => setSelectedGerenciaId(e.target.value || null)}
                  className="
                    appearance-none
                    bg-slate-800/50 backdrop-blur-sm
                    border border-slate-700/50 hover:border-cyan-500/30
                    rounded-xl pl-10 pr-10 py-3
                    text-white text-sm font-medium
                    cursor-pointer
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50
                    min-w-[260px]
                  "
                >
                  <option value="" className="bg-slate-900">
                    Todas las Gerencias
                  </option>
                  {gerencias.map((g) => (
                    <option key={g.departmentId} value={g.departmentId} className="bg-slate-900">
                      {g.departmentName}
                    </option>
                  ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {/* LAYOUT: TABS + CONTENIDO */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

            {/* TABS VERTICALES */}
            <VerticalTabsNav
              tabs={tabsWithBadges}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* CONTENIDO */}
            <div className="flex-1 min-w-0">

              {/* ══════════════════════════════════════════════════════════
                  TAB: RESUMEN - Layout replicado de página principal
                  Gauge EIS (izq) + 2 cards (der)
                 ══════════════════════════════════════════════════════════ */}
              {activeTab === 'resumen' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* IZQUIERDA: EIS GAUGE */}
                    <div className="flex items-center justify-center">
                      <EXOScoreGauge
                        score={summary?.globalAvgEIS ?? 0}
                        label="EIS Score"
                        size="xl"
                      />
                    </div>

                    {/* DERECHA: 2 Cards (Benchmark + Efectividad) */}
                    <div className="flex flex-col gap-4">
                      <ExitBenchmarkCard
                        data={{ summary }}
                        loading={loading}
                      />
                      <EfectividadPredictivaCard
                        viewMode="departamentos"
                        scope="filtered"
                        parentDepartmentId={effectiveGerenciaId || undefined}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: RANKING */}
              {activeTab === 'ranking' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GerenciaExitBimodal
                    departments={filteredDepartments}
                    loading={loading}
                    viewMode="departamentos"
                    parentDepartmentId={effectiveGerenciaId || undefined}
                  />
                </motion.div>
              )}

              {/* TAB: ALERTAS */}
              {activeTab === 'alertas' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertasExitRanking
                    viewMode="departamentos"
                    scope="filtered"
                    parentDepartmentId={effectiveGerenciaId || undefined}
                  />
                </motion.div>
              )}

              {/* TAB: eNPS */}
              {activeTab === 'enps' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NPSExitCard
                    viewMode="departamentos"
                    scope="filtered"
                    parentDepartmentId={effectiveGerenciaId || undefined}
                  />
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}