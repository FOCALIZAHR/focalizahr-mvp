// ====================================================================
// EXIT INTELLIGENCE - THE HOOK (OVERVIEW)
// src/app/dashboard/exit/overview/page.tsx
// v2.0 - Diseño Tesla/Apple - Impacto en 3 segundos
//
// FILOSOFÍA:
// - UN número gigante (datos reales)
// - UNA card de inteligencia FocalizaHR
// - UN CTA premium
// - SIN ruido operacional
// - El silencio comunica
// ====================================================================

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Loader2 } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { useSidebar } from '@/hooks/useSidebar';
import { useExitMetrics } from '@/hooks/useExitMetrics';
import { FinancialCalculator } from '@/config/impactAssumptions';
import { FinancialCalculationsService } from '@/lib/financialCalculations';
import { PrimaryButton } from '@/components/ui/PremiumButton';

// ====================================================================
// HELPERS
// ====================================================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

// ====================================================================
// PÁGINA THE HOOK
// ====================================================================

export default function ExitOverviewPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const { summary, departments, loading } = useExitMetrics();

  // ════════════════════════════════════════════════════════════════
  // CÁLCULO FINANCIERO - Costo Total Rotación (DATOS REALES)
  // ════════════════════════════════════════════════════════════════
  const { totalCost, turnoverCalc } = useMemo(() => {
    const avgSalary = FinancialCalculationsService.getAverageSalaryCLP();
    const calc = FinancialCalculator.calculateTurnoverCost(avgSalary * 12);
    const cost = (summary?.totalExits || 0) * calc.cost_clp;
    return { totalCost: cost, turnoverCalc: calc };
  }, [summary]);

  // ════════════════════════════════════════════════════════════════
  // TOP FACTOR - Causa Principal (agregado desde departments[].topFactors)
  // ════════════════════════════════════════════════════════════════
  const topFactor = useMemo(() => {
    if (!departments?.length || !summary?.totalExits) return null;

    // Agregar todos los topFactors de todos los departamentos
    const factorAggregation: Record<string, { mentions: number; totalSeverity: number; count: number }> = {};

    departments.forEach(dept => {
      const factors = (dept as any).topFactors as Array<{ factor: string; mentions: number; mentionRate: number; avgSeverity: number }> | undefined;
      factors?.forEach(f => {
        if (!factorAggregation[f.factor]) {
          factorAggregation[f.factor] = { mentions: 0, totalSeverity: 0, count: 0 };
        }
        factorAggregation[f.factor].mentions += f.mentions || 0;
        factorAggregation[f.factor].totalSeverity += f.avgSeverity || 0;
        factorAggregation[f.factor].count += 1;
      });
    });

    // Si no hay factores, retornar null
    const entries = Object.entries(factorAggregation);
    if (entries.length === 0) return null;

    // Ordenar por menciones y tomar el #1
    const sorted = entries
      .map(([factor, data]) => ({
        factor,
        mentions: data.mentions,
        rate: Math.round((data.mentions / summary.totalExits) * 100)
      }))
      .sort((a, b) => b.mentions - a.mentions);

    const top = sorted[0];

    return {
      factor: top.factor,
      rate: top.rate,
      cost: totalCost * (top.rate / 100)
    };
  }, [departments, summary, totalCost]);

  // ════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <>
        <DashboardNavigation />
        <main className={`fhr-bg-main fhr-bg-pattern min-h-screen transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-slate-400 text-sm">Cargando Exit Intelligence...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER - THE HOOK
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      <DashboardNavigation />
      <main className={`fhr-bg-main fhr-bg-pattern min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        {/* Blur effects sutiles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Contenido centrado */}
        <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16">

          <div className="max-w-2xl w-full text-center space-y-16">

            {/* ════════════════════════════════════════════════════
                HEADER SUTIL
               ════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <h1 className="text-3xl md:text-4xl font-extralight text-white tracking-tight">
                Exit Intelligence
              </h1>
              <p className="text-slate-500 font-light text-lg">
                Sistema de Aprendizaje Organizacional
              </p>
            </motion.div>

            {/* ════════════════════════════════════════════════════
                NÚMERO GIGANTE - PROTAGONISTA (DATOS REALES)
               ════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6"
            >
              <span className="block text-8xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
                {formatCurrency(totalCost)}
              </span>
              <p className="text-xl md:text-2xl text-slate-300 font-light">
                Costo Total Rotación
              </p>
              {(summary?.totalExits || 0) > 0 && (
                <p className="text-sm text-slate-500">
                  {summary?.totalExits} salidas registradas
                </p>
              )}
            </motion.div>

            {/* ════════════════════════════════════════════════════
                LÍNEA DECORATIVA FOCALIZAHR
               ════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 px-16"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </motion.div>

            {/* ════════════════════════════════════════════════════
                INTELIGENCIA FOCALIZAHR - TEXTO FLOTANTE
               ════════════════════════════════════════════════════ */}
            {topFactor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <BrainCircuit className="w-5 h-5" />
                  <span className="text-sm font-medium tracking-wide">FocalizaHR Intelligence</span>
                </div>

                <p className="text-xl text-slate-300 font-light">
                  El algoritmo propietario detectó que{' '}
                  <span className="text-white font-medium">{topFactor.factor}</span>
                  {' '}es el factor #1 de salida
                </p>

                <p className="text-slate-400">
                  <span className="text-cyan-400">{topFactor.rate}%</span> menciones
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-amber-400">{formatCurrency(topFactor.cost)}</span> en impacto
                </p>
              </motion.div>
            )}

            {!topFactor && !loading && (
              <p className="text-center text-slate-500">Sin datos de factores disponibles</p>
            )}

            {/* ════════════════════════════════════════════════════
                CTA PREMIUM
               ════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PrimaryButton
                icon={ArrowRight}
                iconPosition="right"
                size="lg"
                glow={true}
                onClick={() => router.push('/dashboard/exit')}
              >
                Analizar en Detalle
              </PrimaryButton>
            </motion.div>

          </div>
        </div>
      </main>
    </>
  );
}
