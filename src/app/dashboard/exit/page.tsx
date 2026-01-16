// ====================================================================
// DASHBOARD EXIT INTELLIGENCE - PÁGINA PRINCIPAL
// src/app/dashboard/exit/page.tsx
// v3.0 - Layout limpio: Gauge + 2 tarjetas
//
// FILOSOFÍA:
// - Página = Orquestador (coordina, no implementa)
// - scope='company' para vista global
// - Tab Resumen: Gauge EIS izquierda + 2 cards derecha
// - Design System FocalizaHR (clases .fhr-*)
//
// TABS:
// 1. RESUMEN - Gauge EIS + 2 tarjetas informativas
// 2. RANKING GERENCIAS - GerenciaExitBimodal
// 3. ALERTAS - AlertasExitRanking
// 4. eNPS EXIT - NPSExitCard
// ====================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Briefcase
} from 'lucide-react';

// ====================================================================
// NAVEGACIÓN Y LAYOUT
// ====================================================================
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ====================================================================
// COMPONENTES EXIT
// ====================================================================
import GerenciaExitBimodal from '@/components/exit/GerenciaExitBimodal';
import AlertasExitRanking from '@/components/exit/AlertasExitRanking';
import NPSExitCard from '@/components/exit/NPSExitCard';
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge';
import ExitTabsToggle from '@/components/exit/ExitTabsToggle';
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

// ====================================================================
// PÁGINA PRINCIPAL
// ====================================================================
export default function ExitDashboardPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  // ════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════
  const [activeTab, setActiveTab] = useState<TabValue>('resumen');

  // ════════════════════════════════════════════════════════
  // HOOKS - Métricas Exit con scope='company'
  // ════════════════════════════════════════════════════════
  const { departments, summary, loading, refetch } = useExitMetrics(undefined, 'company');

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* SIDEBAR */}
      <DashboardNavigation />

      {/* MAIN CONTENT */}
      <main 
        className={`
          flex-1 transition-all duration-300
          ${isCollapsed ? 'ml-20' : 'ml-72'}
        `}
      >
        <div className="relative min-h-screen">

          {/* ══════════════════════════════════════════════════════
              BACKGROUND EFFECTS (Estilo Torre Control)
             ══════════════════════════════════════════════════════ */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
          </div>

          {/* ══════════════════════════════════════════════════════
              CONTENT CONTAINER
             ══════════════════════════════════════════════════════ */}
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto">

            {/* ══════════════════════════════════════════════════════
                HEADER
               ══════════════════════════════════════════════════════ */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl border border-cyan-500/30">
                    <Briefcase className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-light text-white mb-1">
                      Exit Intelligence
                    </h1>
                    <p className="text-sm text-slate-400">
                      Sistema de Aprendizaje Organizacional
                    </p>
                  </div>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => refetch()}
                  disabled={loading}
                  className="
                    flex items-center gap-2 px-4 py-2.5 
                    bg-slate-900/40 border border-slate-800/50 rounded-xl
                    text-sm text-slate-300 font-light
                    hover:bg-slate-800/60 hover:border-slate-700/50
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>
            </div>

          {/* ══════════════════════════════════════════════════════
                TABS TOGGLE
               ══════════════════════════════════════════════════════ */}
            <ExitTabsToggle
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* ══════════════════════════════════════════════════════
                TAB CONTENT: RESUMEN
                Filosofía FocalizaHR: Gauge 45% (protagonista adecuado) + Cards 55%
                Contenedor max-w-[700px] alineado con tabs
               ══════════════════════════════════════════════════════ */}
            {activeTab === 'resumen' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                {/* Contenedor alineado con tabs (700px) */}
                <div
                  className="
                    relative w-full max-w-[700px]
                    bg-slate-900/40 backdrop-blur-xl
                    border border-slate-800/50 rounded-2xl
                    p-6
                  "
                >
                  {/* Línea Tesla superior */}
                  <div className="fhr-top-line" />

                  {/* Grid 45/55: Gauge pequeño + Cards con espacio */}
                  <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 items-center">

                    {/* IZQUIERDA: GAUGE (45%) - Protagonista pero adecuado */}
                    <div className="flex items-center justify-center">
                      <EXOScoreGauge
                        score={summary?.globalAvgEIS ?? 0}
                        label="EIS Score Global"
                        size="md"
                        metricType="eis"
                      />
                    </div>

                    {/* DERECHA: CARDS (55%) - Con respiración */}
                    <div className="flex flex-col gap-4">
                      <ExitBenchmarkCard
                        data={{ summary }}
                        loading={loading}
                      />
                      <EfectividadPredictivaCard
                        viewMode="gerencias"
                        scope="company"
                      />
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB CONTENT: RANKING GERENCIAS
               ══════════════════════════════════════════════════════ */}
            {activeTab === 'ranking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GerenciaExitBimodal
                  departments={departments || []}
                  loading={loading}
                  viewMode="gerencias"
                />
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB CONTENT: ALERTAS
               ══════════════════════════════════════════════════════ */}
            {activeTab === 'alertas' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertasExitRanking 
                  viewMode="gerencias"
                  scope="company"
                />
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB CONTENT: eNPS EXIT
               ══════════════════════════════════════════════════════ */}
            {activeTab === 'enps' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <NPSExitCard 
                  viewMode="gerencias"
                  scope="company"
                />
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                NAVIGATION CTAs
               ══════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-center gap-3 pt-12">
              <button
                onClick={() => router.push('/dashboard/exit/executive')}
                className="
                  group flex items-center gap-2 px-6 py-3 
                  bg-slate-900/30 border border-slate-800/50 rounded-2xl 
                  text-slate-300 text-sm font-light
                  hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 
                  transition-all duration-300
                "
              >
                Vista Ejecutiva
              </button>

              <button
                onClick={() => router.push('/dashboard/exit/records')}
                className="
                  group flex items-center gap-2 px-6 py-3 
                  bg-slate-900/30 border border-slate-800/50 rounded-2xl 
                  text-slate-300 text-sm font-light
                  hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 
                  transition-all duration-300
                "
              >
                Registros de Salidas
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}