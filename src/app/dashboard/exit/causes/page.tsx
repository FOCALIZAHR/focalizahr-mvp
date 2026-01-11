// ====================================================================
// EXIT CAUSES - PÁGINA INMERSIVA ROOT CAUSES
// src/app/dashboard/exit/causes/page.tsx
// v1.0 - Full viewport, mobile-first, storytelling experience
// ====================================================================
// 
// PROPÓSITO:
// Esta página responde "¿POR QUÉ se van?" con una experiencia 
// narrativa inmersiva en 3 actos (Veredicto → Consenso → Matriz).
// 
// JOURNEY:
// Hub Seguimiento → Exit Overview ($360M) → ESTA PÁGINA → Executive View
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

// ====================================================================
// NAVEGACION Y LAYOUT
// ====================================================================
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';

// ====================================================================
// COMPONENTE PRINCIPAL - STEPPER NARRATIVO
// ====================================================================
import RootCausesStepper from '@/components/exit/RootCausesStepper';

// ====================================================================
// HOOKS Y CÁLCULOS
// ====================================================================
import { useExitMetrics } from '@/hooks/useExitMetrics';
import { FinancialCalculator } from '@/config/impactAssumptions';
import { FinancialCalculationsService } from '@/lib/financialCalculations';

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function ExitCausesPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  // Hook Exit 
  const { summary, loading, error, refetch } = useExitMetrics();

  // ══════════════════════════════════════════════════════════════════
  // DATOS PARA STEPPER NARRATIVO
  // ══════════════════════════════════════════════════════════════════
  const stepperData = useMemo(() => {
    const avgSalary = FinancialCalculationsService.getAverageSalaryCLP();
    const turnoverCost = FinancialCalculator.calculateTurnoverCost(avgSalary * 12).cost_clp;
    
    const factors = (summary?.topFactorsGlobal || []).map(f => ({
      factor: f.factor,
      mentions: f.mentions,
      mentionRate: f.mentionRate,
      avgSeverity: f.avgSeverity ?? 3.0,
      estimatedCost: Math.round(
        f.mentionRate * (summary?.totalExits || 0) * turnoverCost
      )
    }));

    const topFactor = factors.length > 0 ? factors[0] : null;

    return { factors, topFactor, avgSalary };
  }, [summary]);

  // ══════════════════════════════════════════════════════════════════
  // ESTADOS: LOADING
  // ══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen fhr-bg-main flex">
        <DashboardNavigation />
        <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto" strokeWidth={1.5} />
              <p className="text-slate-400 text-sm">Analizando causas raíz...</p>
            </div>
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
              <p className="text-slate-300">Error cargando análisis</p>
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
  // RENDER PRINCIPAL - INMERSIVO FULL VIEWPORT
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
        flex flex-col
      `}>
        
        {/* ════════════════════════════════════════════════════════════
            HEADER MINIMALISTA
           ════════════════════════════════════════════════════════════ */}
        <header className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Navegación atrás */}
              <button
                onClick={() => router.push('/dashboard/exit/overview')}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  text-slate-400 hover:text-white
                  bg-slate-800/30 hover:bg-slate-800/50
                  border border-slate-700/30 hover:border-slate-600/50
                  transition-all duration-200
                  text-sm
                "
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </button>

              {/* Título central - Solo mobile */}
              <h1 className="sm:hidden text-base font-light text-white">
                Causas Raíz
              </h1>

              {/* Acción siguiente */}
              <button
                onClick={() => router.push('/dashboard/exit/executive')}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  text-cyan-400 hover:text-white
                  bg-cyan-500/10 hover:bg-cyan-500/20
                  border border-cyan-500/30 hover:border-cyan-500/50
                  transition-all duration-200
                  text-sm
                "
              >
                <span className="hidden sm:inline">Ver por Gerencia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Título desktop */}
            <div className="hidden sm:block text-center mt-4 mb-2">
              <h1 className="text-xl sm:text-2xl font-extralight text-white tracking-tight">
                ¿Por qué se van?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-light mt-1">
                Análisis de causas raíz • {summary?.totalExits || 0} salidas analizadas
              </p>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════
            CONTENIDO PRINCIPAL - STEPPER FULL VIEWPORT
           ════════════════════════════════════════════════════════════ */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl mx-auto h-full"
          >
            <RootCausesStepper
              topFactor={stepperData.topFactor}
              factors={stepperData.factors}
              totalExits={summary?.totalExits || 0}
              periodLabel="Global"
              avgSalaryCLP={stepperData.avgSalary}
              onInvestigate={() => router.push('/dashboard/exit/executive')}
              onFactorClick={(factor, quadrant) => {
                console.log('Factor clicked:', factor, quadrant);
              }}
              isLoading={loading}
              className="h-full"
            />
          </motion.div>
        </div>

      </main>
    </div>
  );
}