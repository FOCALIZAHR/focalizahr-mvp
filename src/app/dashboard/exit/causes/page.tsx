// ====================================================================
// EXIT CAUSES - ANÁLISIS PROFUNDO DE CAUSAS
// src/app/dashboard/exit/causes/page.tsx
// v4.0 - Inteligencia con Revelación
// ====================================================================
//
// PRINCIPIO: "EMOCIÓN → Contexto → Dato → Acción"
//
// ESTRUCTURA:
// - ABOVE THE FOLD: RevelationCard (dicen vs duele) + KPIs clickeables
// - BELOW THE FOLD: Tabs para drill-down
//
// ====================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

// ====================================================================
// UI COMPONENTS
// ====================================================================
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ====================================================================
// PAGE COMPONENTS
// ====================================================================
import RevelationCard from './components/RevelationCard';
import KPIStrip from './components/KPIStrip';
import FactorsTab from './components/FactorsTab';
import DepartmentsTab from './components/DepartmentsTab';
import TalentTab from './components/TalentTab';
import PredictionTab from './components/PredictionTab';
import ROITab from './components/ROITab';

// ====================================================================
// HOOKS
// ====================================================================
import { useExitCauses } from '@/hooks/useExitCauses';

// ====================================================================
// TYPES
// ====================================================================
type TabValue = 'factors' | 'departments' | 'talent' | 'prediction' | 'roi';

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function ExitCausesPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabValue>('factors');

  // ════════════════════════════════════════════════════════════════════════
  // HOOK - Todas las secciones de análisis de causas
  // ════════════════════════════════════════════════════════════════════════
  const {
    truth,
    painmap,
    drain,
    predictability,
    roi,
    hrHypothesis,
    loading,
    error,
    refetch
  } = useExitCauses({ section: 'all' });

  // Handler para cambio de tab desde KPIStrip
  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    // Scroll suave al contenedor de tabs
    setTimeout(() => {
      document.getElementById('tabs-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen fhr-bg-main flex relative">

      {/* FONDOS BLUR SUTILES */}
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

        {/* ════════════════════════════════════════════════════════════
            CONTENT CONTAINER
           ════════════════════════════════════════════════════════════ */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">

          {/* ════════════════════════════════════════════════════════════
              HEADER
             ════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Back Button */}
                <button
                  onClick={() => router.push('/dashboard/exit')}
                  className="
                    p-2.5 bg-slate-900/40 border border-slate-800/50 rounded-xl
                    text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30
                    transition-all duration-200
                  "
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h1 className="fhr-hero-title text-2xl sm:text-3xl text-white mb-1">
                    Análisis de <span className="fhr-title-gradient">Causas</span>
                  </h1>
                  {/* Divider FocalizaHR */}
                  <div className="fhr-divider mt-2">
                    <div className="fhr-divider-line" />
                    <div className="fhr-divider-dot" />
                    <div className="fhr-divider-line" />
                  </div>
                  <p className="fhr-subtitle text-sm mt-2">
                    Inteligencia profunda sobre por qué se van
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
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
                  <span className="hidden sm:inline">Actualizar</span>
                </button>

                {/* Executive View Button */}
                <button
                  onClick={() => router.push('/dashboard/exit/executive')}
                  className="
                    flex items-center gap-2 px-4 py-2.5
                    bg-cyan-500/10 border border-cyan-500/30 rounded-xl
                    text-sm text-cyan-400 font-light
                    hover:bg-cyan-500/20 hover:border-cyan-500/50
                    transition-all duration-200
                  "
                >
                  <span className="hidden sm:inline">Vista Ejecutiva</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              ERROR STATE
             ════════════════════════════════════════════════════════════ */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-300">{error}</span>
            </motion.div>
          )}

          {/* ════════════════════════════════════════════════════════════
              LOADING STATE
             ════════════════════════════════════════════════════════════ */}
          {loading && !error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Analizando causas de salida...</p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              CONTENT
             ════════════════════════════════════════════════════════════ */}
          {!loading && !error && (
            <div className="space-y-8">

              {/* ══════════════════════════════════════════════════════
                  ABOVE THE FOLD: Revelation Card
                 ══════════════════════════════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <RevelationCard
                  hrHypothesis={hrHypothesis}
                  surveyReality={truth}
                  predictability={predictability}
                />
              </motion.div>

              {/* KPIs Clickeables */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <KPIStrip
                  truth={truth}
                  painmap={painmap}
                  drain={drain}
                  predictability={predictability}
                  roi={roi}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </motion.div>

              {/* ══════════════════════════════════════════════════════
                  BELOW THE FOLD: Tabs para drill-down
                 ══════════════════════════════════════════════════════ */}
              <motion.div
                id="tabs-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
                  {/* Tab List */}
                  <TabsList className="
                    w-full flex flex-wrap gap-1 p-1.5
                    bg-slate-900/50 border border-slate-800/50 rounded-xl
                    mb-6
                  ">
                    <TabsTrigger
                      value="factors"
                      className="
                        flex-1 min-w-[100px] px-4 py-2.5 rounded-lg
                        text-sm font-light text-slate-400
                        data-[state=active]:bg-cyan-500/20
                        data-[state=active]:text-cyan-400
                        data-[state=active]:border-cyan-500/30
                        hover:text-slate-300
                        transition-all
                      "
                    >
                      Factores
                    </TabsTrigger>
                    <TabsTrigger
                      value="departments"
                      className="
                        flex-1 min-w-[100px] px-4 py-2.5 rounded-lg
                        text-sm font-light text-slate-400
                        data-[state=active]:bg-cyan-500/20
                        data-[state=active]:text-cyan-400
                        data-[state=active]:border-cyan-500/30
                        hover:text-slate-300
                        transition-all
                      "
                    >
                      Deptos
                    </TabsTrigger>
                    <TabsTrigger
                      value="talent"
                      className="
                        flex-1 min-w-[100px] px-4 py-2.5 rounded-lg
                        text-sm font-light text-slate-400
                        data-[state=active]:bg-cyan-500/20
                        data-[state=active]:text-cyan-400
                        data-[state=active]:border-cyan-500/30
                        hover:text-slate-300
                        transition-all
                      "
                    >
                      Talento
                    </TabsTrigger>
                    <TabsTrigger
                      value="prediction"
                      className="
                        flex-1 min-w-[100px] px-4 py-2.5 rounded-lg
                        text-sm font-light text-slate-400
                        data-[state=active]:bg-cyan-500/20
                        data-[state=active]:text-cyan-400
                        data-[state=active]:border-cyan-500/30
                        hover:text-slate-300
                        transition-all
                      "
                    >
                      Predicción
                    </TabsTrigger>
                    <TabsTrigger
                      value="roi"
                      className="
                        flex-1 min-w-[100px] px-4 py-2.5 rounded-lg
                        text-sm font-light text-slate-400
                        data-[state=active]:bg-cyan-500/20
                        data-[state=active]:text-cyan-400
                        data-[state=active]:border-cyan-500/30
                        hover:text-slate-300
                        transition-all
                      "
                    >
                      ROI
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Contents */}
                  <TabsContent value="factors">
                    <FactorsTab data={truth} />
                  </TabsContent>

                  <TabsContent value="departments">
                    <DepartmentsTab data={painmap} />
                  </TabsContent>

                  <TabsContent value="talent">
                    <TalentTab data={drain} />
                  </TabsContent>

                  <TabsContent value="prediction">
                    <PredictionTab data={predictability} />
                  </TabsContent>

                  <TabsContent value="roi">
                    <ROITab data={roi} />
                  </TabsContent>
                </Tabs>
              </motion.div>

            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              NAVIGATION CTA
             ════════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-center gap-3 pt-12">
            <button
              onClick={() => router.push('/dashboard/exit')}
              className="
                group flex items-center gap-2 px-6 py-3
                bg-slate-900/30 border border-slate-800/50 rounded-2xl
                text-slate-300 text-sm font-light
                hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400
                transition-all duration-300
              "
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Exit Intelligence
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
