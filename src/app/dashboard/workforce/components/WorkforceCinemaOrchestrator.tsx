'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE CINEMA MODE — Orchestrator
// Patron clonado de ExecutiveCinemaOrchestrator.tsx
// LOBBY (gauge + narrative) → CASCADA (7 actos) → TABS (apoyo)
// src/app/dashboard/workforce/components/WorkforceCinemaOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════

import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, AlertTriangle, Cpu, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useWorkforceData } from '../hooks/useWorkforceData'
import WorkforceMissionControl from './WorkforceMissionControl'

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

          {/* CASCADA — Sesion 3 implementara WorkforceCascadeOrchestrator */}
          {view === 'cascada' && (
            <motion.div
              key="cascada"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
            >
              <div className="text-center">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-4">
                  Cascada de diagnostico
                </p>
                <p className="text-6xl font-extralight text-white">
                  {Math.round(data.exposure.avgExposure * 100)}%
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">
                  de exposicion a la automatizacion
                </p>
                <p className="text-sm text-slate-400 mt-6 max-w-md mx-auto">
                  La cascada completa se implementa en Sesion 3. Los datos estan disponibles: {data.zombies.count} zombies, {data.flightRisk.count} en riesgo de fuga, {data.redundancy.pairs.length} redundancias detectadas.
                </p>
                <button
                  onClick={handleBackToLobby}
                  className="mt-8 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                >
                  ← Volver al lobby
                </button>
              </div>
            </motion.div>
          )}

          {/* TABS — Sesion 4 */}
          {(view === 'estructura' || view === 'benchmarks' || view === 'simulador') && (
            <motion.div
              key={`tab-${view}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <p className="text-slate-500 text-sm">
                Tab {view} — Sesion 4
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
