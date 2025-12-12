// src/app/dashboard/onboarding/executive/page.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  RefreshCw, TrendingUp, AlertTriangle, Users, Activity 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOnboardingMetrics } from '@/hooks/useOnboardingMetrics'
import { isGlobalDashboard } from '@/types/onboarding'

// Componentes del Sistema
import ComplianceEfficiencyMatrix from '@/components/onboarding/ComplianceEfficiencyMatrix'
import EXOScoreGauge from '@/components/onboarding/EXOScoreGauge'

export default function OnboardingExecutiveView() {
  const router = useRouter()
  const { data, loading, error, refetch } = useOnboardingMetrics()

  // ========================================
  // LOADING STATE
  // ========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  // ========================================
  // ERROR STATE
  // ========================================
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-red-400">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto" />
          <p className="text-lg font-medium">Error cargando datos</p>
          <p className="text-sm text-slate-500">{error}</p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ========================================
  // TYPE VALIDATION
  // ========================================
  if (!isGlobalDashboard(data)) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 max-w-md text-center space-y-3">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
          <p className="text-slate-300 text-lg font-medium">Tipo de datos incorrecto</p>
          <p className="text-sm text-slate-500">
            Se esperaba OnboardingDashboardData pero se recibió otro tipo.
          </p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ========================================
  // ✅ DATA VÁLIDA - EXTRAER MÉTRICAS
  // ========================================
  const { global, topDepartments, bottomDepartments, accumulated, complianceEfficiency } = data

  // 🌟 DOBLE LENTE CORRECTAMENTE APLICADO
  const scoreForGauge = 
    accumulated?.globalExoScore ?? 
    global.avgEXOScore ?? 
    null

  const totalJourneys = 
    accumulated?.totalJourneys ?? 
    global.totalActiveJourneys ?? 
    0

  const scoreSource = accumulated?.globalExoScore 
    ? 'accumulated' 
    : global.avgEXOScore 
      ? 'monthly' 
      : 'none'

  // 🔧 FIX: Si top/bottom están vacíos, usar accumulated.departments
  let topDepts = topDepartments || []
  let bottomDepts = bottomDepartments || []

  if (topDepts.length === 0 && accumulated?.departments && accumulated.departments.length > 0) {
    // Ordenar por score descendente y tomar top 3
    topDepts = accumulated.departments
      .filter(d => d.accumulatedExoScore > 0)
      .sort((a, b) => b.accumulatedExoScore - a.accumulatedExoScore)
      .slice(0, 3)
      .map(d => ({
        name: d.displayName,
        avgEXOScore: d.accumulatedExoScore,
        activeJourneys: d.accumulatedExoJourneys || 0
      }))
  }

  if (bottomDepts.length === 0 && accumulated?.departments && accumulated.departments.length > 0) {
    // Ordenar por score ascendente y tomar bottom 3
    bottomDepts = accumulated.departments
      .filter(d => d.accumulatedExoScore > 0)
      .sort((a, b) => a.accumulatedExoScore - b.accumulatedExoScore)
      .slice(0, 3)
      .map(d => ({
        name: d.displayName,
        avgEXOScore: d.accumulatedExoScore,
        atRiskCount: 0 // accumulated no tiene este dato
      }))
  }

  // ========================================
  // EMPTY STATE - SIN DATOS DISPONIBLES
  // ========================================
  if (scoreForGauge === null) {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <div className="max-w-[1920px] mx-auto p-6 lg:p-10 space-y-10">
          
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
                Vista Ejecutiva Onboarding
              </h1>
              <p className="text-xl text-slate-400 font-light">
                Monitoreo integral de eficiencia · Sistema 4C Bauer
              </p>
            </div>
          </div>

          {/* EMPTY STATE CARD */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <Activity className="h-10 w-10 text-slate-600" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-light text-slate-300">
                  Sin Datos Disponibles
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                  El EXO Score se calcula cuando los colaboradores completan las 4 etapas del proceso de onboarding (Día 1 → 7 → 30 → 90).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => router.push('/dashboard/hub-de-carga')}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Inscribir Primer Colaborador
                </button>
                
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Actualizar Datos
                </button>
              </div>

              {/* INFO ADICIONAL */}
              <div className="pt-6 border-t border-slate-800/50">
                <p className="text-xs text-slate-600">
                  💡 Tip: Las métricas aparecerán automáticamente después de que al menos un colaborador complete su primer mes de onboarding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========================================
  // DASHBOARD CON DATOS
  // ========================================
  const complianceData = complianceEfficiency || []

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-[1920px] mx-auto p-6 lg:p-10 space-y-10">
        
        {/* ================================================================
            HERO SECTION CENTRADO
           ================================================================ */}
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
              Actualizar Datos
            </button>
          </div>
        </div>

        {/* ================================================================
            GRID PRINCIPAL: GAUGE + CARDS
           ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          
          {/* ============================================================
              IZQUIERDA: GAUGE PROTAGONISTA CON INDICADOR DE FUENTE
             ============================================================ */}
          <div className="flex flex-col items-center justify-center lg:justify-end space-y-4">
            
            {/* Gauge */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-xl shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-50" />
              
              <div className="text-center relative z-10">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-6">
                  EXO Score Global
                </h3>
                <div className="scale-100 transform">
                  <EXOScoreGauge 
                    score={scoreForGauge} 
                    label="" 
                    size="lg" 
                  />
                </div>
                
                {/* KPIs Secundarios */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-3xl font-light text-white tracking-tight">
                      {totalJourneys}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                      <Users className="w-3 h-3" /> 
                      {scoreSource === 'accumulated' ? 'Total 12 meses' : 'Activos'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-light tracking-tight ${global.criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {global.criticalAlerts}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Alertas
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🌟 INDICADOR DE FUENTE DE DATOS */}
            <div className="px-4 py-2 bg-slate-900/30 border border-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {scoreSource === 'accumulated' ? (
                  <>
                    <span className="text-cyan-400">📊</span>
                    <span>
                      Promedio 12 meses 
                      {accumulated?.periodCount && (
                        <span className="text-slate-600"> ({accumulated.periodCount} períodos)</span>
                      )}
                    </span>
                  </>
                ) : scoreSource === 'monthly' ? (
                  <>
                    <span className="text-purple-400">📅</span>
                    <span>
                      Mes actual 
                      {global.period && (
                        <span className="text-slate-600"> ({global.period})</span>
                      )}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* ============================================================
              DERECHA: TARJETA IMPACTO TOP & BOTTOM
             ============================================================ */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 space-y-6 shadow-[0_0_20px_rgba(167,139,250,0.08)]">
            
            {/* Top Performers */}
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Top Drivers
              </h4>
              <div className="space-y-3">
                {topDepts.length > 0 ? (
                  topDepts.slice(0, 3).map((dept, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <span className="text-sm text-slate-300">{dept.name}</span>
                      <span className="text-sm font-medium text-emerald-400">
                        {Math.round(dept.avgEXOScore)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Sin datos disponibles</p>
                )}
              </div>
            </div>

            {/* Bottom Impact */}
            <div>
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Requieren Atención
              </h4>
              <div className="space-y-3">
                {bottomDepts.length > 0 ? (
                  bottomDepts.slice(0, 3).map((dept, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <span className="text-sm text-slate-300">{dept.name}</span>
                      <span className="text-sm font-medium text-amber-400">
                        {Math.round(dept.avgEXOScore)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Sin datos disponibles</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            MATRIZ DE EFECTIVIDAD (SI HAY DATOS)
           ================================================================ */}
        {complianceData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* 🔧 FIX: Cambiar prop de "data" a "departments" */}
            <ComplianceEfficiencyMatrix departments={complianceData} />
          </motion.div>
        )}

        {/* CTAs NAVEGACIÓN */}
        <div className="flex items-center justify-center gap-3 pt-12">
          <button
            onClick={() => router.push('/dashboard/onboarding/pipeline')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/30 border border-slate-800/50 rounded-lg text-slate-300 text-sm font-light hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
          >
            Ver Pipeline Completo
          </button>

          <button
            onClick={() => router.push('/dashboard/onboarding/alerts')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900/30 border border-slate-800/50 rounded-lg text-slate-300 text-sm font-light hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-400 transition-all"
          >
            Centro de Alertas
          </button>
        </div>
      </div>
    </div>
  )
}