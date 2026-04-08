'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE CINEMA MODE — Orchestrator
// Patron clonado de ExecutiveCinemaOrchestrator.tsx
// LOBBY (gauge + narrative) → CASCADA (7 actos) → TABS (apoyo)
// src/app/dashboard/workforce/components/WorkforceCinemaOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, Cpu, ArrowLeft, ShieldCheck, Users, TrendingUp, Sliders } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useWorkforceData } from '../hooks/useWorkforceData'
import type { WorkforceView } from '../types/workforce.types'
import WorkforceMissionControl from './WorkforceMissionControl'
import WorkforceCascadeOrchestrator from './cascada/WorkforceCascadeOrchestrator'
import TabEstructura from './tabs/TabEstructura'
import TabBenchmarks from './tabs/TabBenchmarks'
import TabSimulador from './tabs/TabSimulador'

// ═══════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════

function Skeleton() {
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-[220px] h-[220px] rounded-full bg-slate-800/50 animate-pulse" />
        <div className="w-56 h-5 bg-slate-800/50 rounded animate-pulse" />
        <div className="w-72 h-4 bg-slate-800/30 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ERROR
// ═══════════════════════════════════════════════════════════════════════

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex items-center justify-center">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-sm text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-200 mb-2">Error al cargar</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// EMPTY STATE (no data at all)
// ═══════════════════════════════════════════════════════════════════════

function EmptyState() {
  const router = useRouter()
  return (
    <div className="h-screen w-full bg-[#0A0F1A] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto p-8"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
          <Cpu className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">
          Sin datos de fuerza de trabajo
        </h2>
        <p className="text-slate-400 mb-6">
          Carga participantes y clasifica cargos para activar el modulo de Planificacion de Fuerza de Trabajo.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// DATA CONFIDENCE INDICATOR
// ═══════════════════════════════════════════════════════════════════════

function DataConfidenceIndicator({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const pct = confidence === 'high' ? 90 : confidence === 'medium' ? 60 : 30

  const color = confidence === 'high'
    ? 'bg-emerald-500'
    : confidence === 'medium'
    ? 'bg-amber-500'
    : 'bg-red-500'

  const textColor = confidence === 'high'
    ? 'text-emerald-400'
    : confidence === 'medium'
    ? 'text-amber-400'
    : 'text-red-400'

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
      <ShieldCheck className={cn('w-3.5 h-3.5', textColor)} />
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        Confianza: <span className={textColor}>{pct}%</span>
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// NAV PILL — tab selector for support views
// ═══════════════════════════════════════════════════════════════════════

const TAB_OPTIONS: { key: WorkforceView; label: string; icon: typeof Users }[] = [
  { key: 'estructura', label: 'Estructura', icon: Users },
  { key: 'benchmarks', label: 'Benchmarks', icon: TrendingUp },
  { key: 'simulador', label: 'Simulador', icon: Sliders },
]

function NavPill({ active, onSelect }: { active: WorkforceView; onSelect: (v: WorkforceView) => void }) {
  return (
    <div className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-full p-1">
      {TAB_OPTIONS.map(tab => {
        const Icon = tab.icon
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all',
              isActive
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════

export default function WorkforceCinemaOrchestrator() {
  const {
    data,
    isLoading,
    error,
    view,
    setView,
    reload,
  } = useWorkforceData()

  // ── Loading / Error / Empty ─────────────────────────────────────────
  if (isLoading) return <Skeleton />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data || data.totalEmployees === 0) return <EmptyState />

  // ── Handlers ────────────────────────────────────────────────────────
  const handleStartCascade = () => setView('cascada')
  const handleBackToLobby = () => setView('lobby')

  return (
    <div className="min-h-screen w-full bg-[#0A0F1A] text-white flex flex-col font-sans">

      {/* Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-8">

        {/* Data Confidence — top right */}
        <DataConfidenceIndicator confidence={data.confidence} />

        {/* Back button when in cascada/tabs */}
        {view !== 'lobby' && (
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={handleBackToLobby}
              className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Volver
              </span>
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* LOBBY — gauge + narrative + CTA */}
          {view === 'lobby' && (
            <WorkforceMissionControl
              key="lobby"
              data={data}
              onStartCascade={handleStartCascade}
            />
          )}

          {/* CASCADA — 7 actos lineales */}
          {view === 'cascada' && (
            <WorkforceCascadeOrchestrator
              key="cascada"
              data={data}
              onBack={handleBackToLobby}
              onNavigateTab={setView}
            />
          )}

          {/* TABS — support views */}
          {(view === 'estructura' || view === 'benchmarks' || view === 'simulador') && (
            <motion.div
              key={`tab-${view}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center gap-6 pt-12"
            >
              {/* NavPill */}
              <NavPill active={view} onSelect={setView} />

              {/* Tab content */}
              {view === 'estructura' && <TabEstructura data={data} />}
              {view === 'benchmarks' && <TabBenchmarks />}
              {view === 'simulador' && <TabSimulador />}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
