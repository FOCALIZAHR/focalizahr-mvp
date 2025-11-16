'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

// Componentes hijos
import { OnboardingKPIsGrid } from '@/components/onboarding/OnboardingKPIsGrid';
import { TopBottomDepartmentsPanel } from '@/components/onboarding/TopBottomDepartmentsPanel';
import { EXOScoreGaugeWithTrend } from '@/components/onboarding/EXOScoreGaugeWithTrend';
import { InsightsActionablesPanel } from '@/components/onboarding/InsightsActionablesPanel';

export default function OnboardingDashboard() {
  const router = useRouter();
  
  // ✅ CONSUMO CORRECTO DEL HOOK EXISTENTE
  // Hook retorna: { data, loading, error, refetch }
  // data puede ser array o objeto único según si hay departmentId
  const { data, loading, error, refetch } = useOnboardingMetrics();

  // ========================================
  // LOADING STATE MINIMALISTA
  // ========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-4"
        >
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-cyan-400" />
          <p className="text-slate-400 text-sm font-light">
            Cargando inteligencia de onboarding...
          </p>
        </motion.div>
      </div>
    );
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="fhr-card border-red-500/30">
            <p className="text-red-400 mb-4 text-sm">
              {error || 'Error cargando métricas de onboarding'}
            </p>
            <Button 
              onClick={() => refetch()}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========================================
  // PROCESAR DATA
  // ========================================
  const metrics = Array.isArray(data) ? data[0] : data;

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <p className="text-slate-400 text-sm">
            No hay datos de onboarding disponibles aún.
          </p>
          <Button 
            onClick={() => router.push('/dashboard/hub-de-carga')}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0"
          >
            Inscribir Primer Colaborador
          </Button>
        </motion.div>
      </div>
    );
  }

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* HEADER MINIMALISTA APPLE/TESLA STYLE */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-extralight text-white mb-2 tracking-tight"
          >
            Onboarding Journey Intelligence
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-sm font-light"
          >
            Sistema predictivo de retención · Monitoreo continuo 4C Bauer
          </motion.p>
        </div>

        {/* GRID KPIs - 4 CARDS MÉTRICAS */}
        <OnboardingKPIsGrid globalMetrics={metrics} />

        {/* GRID 2 COLUMNAS: TOP/BOTTOM + GAUGE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopBottomDepartmentsPanel 
            topDepartments={metrics.topDepartments || []}
            bottomDepartments={metrics.bottomDepartments || []}
          />
          
          <EXOScoreGaugeWithTrend 
            currentScore={metrics.avgEXOScore || 0}
            trend={metrics.exoScoreTrend || null} 
            period={metrics.period || ''}
          />
        </div>

        {/* INSIGHTS ACCIONABLES */}
        <InsightsActionablesPanel 
          insights={metrics.insights || { topIssues: [], recommendations: [] }} 
        />

        {/* CTAS NAVEGACIÓN */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Button 
            variant="default"
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 h-12"
            onClick={() => router.push('/dashboard/onboarding/pipeline')}
          >
            Ver Pipeline Completo
          </Button>
          <Button 
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12"
            onClick={() => router.push('/dashboard/onboarding/alerts')}
          >
            Centro de Alertas
          </Button>
          <Button 
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12"
            onClick={() => router.push('/dashboard/hub-de-carga')}
          >
            Inscribir Colaborador
          </Button>
        </motion.div>

        {/* FOOTER SUTIL CON REFRESH */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-8"
        >
          <button
            onClick={() => refetch()}
            className="text-slate-500 hover:text-cyan-400 transition-colors text-xs font-light inline-flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Actualizar datos
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}