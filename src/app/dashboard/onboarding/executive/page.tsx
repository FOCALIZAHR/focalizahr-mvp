// src/app/dashboard/onboarding/executive/page.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  RefreshCw, TrendingUp, AlertTriangle, Users, Activity 
} from 'lucide-react'
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics'
import { isGlobalDashboard } from '@/types/onboarding'  // ← AGREGAR ESTA LÍNEA

// ✅ Componentes del Sistema
import ComplianceEfficiencyMatrix from '@/components/onboarding/ComplianceEfficiencyMatrix' 
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge'

export default function OnboardingExecutiveView() {
  const { data, loading, error, refetch } = useOnboardingMetrics()

  // Datos seguros
  // Type Guard para garantizar tipo correcto
  const isDashboard = isGlobalDashboard(data)

  const globalMetrics = isDashboard ? data.global : { avgEXOScore: 0, totalActiveJourneys: 0, criticalAlerts: 0, period: '', exoScoreTrend: 0 }
  const complianceData = isDashboard ? (data.complianceEfficiency || []) : []
  const topDepts = isDashboard ? data.topDepartments : []
  const bottomDepts = isDashboard ? data.bottomDepartments : []
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-red-400">
        <div className="text-center space-y-4">
          <p>Error cargando datos: {error}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-slate-800 rounded text-white hover:bg-slate-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-[1920px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* =================================================================================
            HERO SECTION CENTRADO (PATRÓN REAL ONBOARDING)
           ================================================================================= */}
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
              Vista Ejecutiva Onboarding
            </h1>
            <p className="text-xl text-slate-400 font-light">
              Monitoreo integral de eficiencia · Sistema 4C Bauer
            </p>
          </div>

          {/* Botón actualizar centrado */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-cyan-400 text-sm font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* =================================================================================
            LAYOUT PRINCIPAL
           ================================================================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA (70%): Matriz de Eficiencia */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">Matriz de Eficiencia</h2>
                <p className="text-xs text-slate-500">Semáforo de cumplimiento por departamento</p>
              </div>
            </div>
            
            {/* Componente Matriz CON WRAPPER PREMIUM */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-sm p-6 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <ComplianceEfficiencyMatrix 
                departments={complianceData}
                loading={loading}
              />
            </div>
          </motion.div>

          {/* COLUMNA DERECHA (30%): Panel de Inteligencia */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-4 space-y-6"
          >
            
            {/* 1. TARJETA HÉROE: EL GAUGE (Limpio y Sobrio) */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-xl shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-50" />
              
              <div className="text-center relative z-10">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-6">
                  EXO Score Global
                </h3>
                <div className="scale-100 transform">
                  <EXOScoreGauge 
                    score={globalMetrics.avgEXOScore} 
                    label="" 
                    size="lg" 
                  />
                </div>
                
                {/* KPIs Secundarios */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-3xl font-light text-white tracking-tight">
                      {globalMetrics.totalActiveJourneys}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                      <Users className="w-3 h-3" /> Activos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-light tracking-tight ${globalMetrics.criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {globalMetrics.criticalAlerts}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Alertas
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TARJETA IMPACTO: TOP & BOTTOM */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 space-y-6 shadow-[0_0_20px_rgba(167,139,250,0.08)]">
              
              {/* Top Performers */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Top Drivers
                </h4>
                <div className="space-y-3">
                  {topDepts.length > 0 ? topDepts.map((dept, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10 hover:bg-emerald-500/[0.06] transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <span className="text-sm text-slate-200 font-light">{dept.name}</span>
                      <span className="text-sm font-bold text-emerald-400">{dept.avgEXOScore}</span>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-500 italic px-2">Sin datos suficientes</div>
                  )}
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />

              {/* Bottom Performers */}
              <div>
                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Foco de Atención
                </h4>
                <div className="space-y-3">
                  {bottomDepts.length > 0 ? bottomDepts.map((dept, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-red-500/[0.03] border border-red-500/10 hover:bg-red-500/[0.06] transition-colors shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                      <span className="text-sm text-slate-200 font-light">{dept.name}</span>
                      <span className="text-sm font-bold text-red-400">{dept.avgEXOScore}</span>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-500 italic px-2">Todo en orden, sin riesgos críticos</div>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        </div>
      </div>
    </div>
  )
}