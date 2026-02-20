'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import SegmentedRing from './SegmentedRing'
import { DashboardIndicators } from '@/components/performance/DashboardIndicators'
import type { MissionControlProps } from '@/types/evaluator-cinema'
import type { EvaluationStatus } from '@/lib/utils/evaluatorStatsEngine'

interface EvalStatsData {
  desempeno: { status: EvaluationStatus; avg: number; stdDev: number; count: number; distribution: number[] }
  potencial: { status: EvaluationStatus; avg: number; stdDev: number; count: number; distribution: number[] } | null
  teamDna: { top: { code: string; name: string; avgScore: number }; low: { code: string; name: string; avgScore: number } } | null
}

export default function MissionControl({
  stats,
  cycle,
  nextEmployee,
  onStart
}: MissionControlProps) {
  // Phase 2: all desempeno done, potential pending
  const isPhase2 = stats.pending === 0 && stats.pendingPotential > 0

  // Ring progress: in Phase 2, show potential progress
  const ringTotal = stats.total
  const ringCompleted = isPhase2
    ? (stats.total - stats.pendingPotential)
    : stats.completed

  // Fetch evaluator calibration stats for LED indicators
  const [evalStats, setEvalStats] = useState<EvalStatsData | null>(null)
  useEffect(() => {
    if (!cycle.id) return
    const token = localStorage.getItem('focalizahr_token')
    fetch(`/api/evaluator/stats?cycleId=${cycle.id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setEvalStats(json.data)
      })
      .catch(() => { /* silent */ })
  }, [cycle.id, stats.completed, stats.pendingPotential])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Cycle name + Phase indicator */}
      <div className="text-center">
        {isPhase2 && (
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-2">
            Fase 2 · Evaluacion de Potencial
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          {cycle.name}
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {cycle.daysRemaining} dias restantes
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - Responsive */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">

        {/* ED/PT - Solo visible en DESKTOP (izquierda) */}
        {evalStats && (
          <div className="hidden md:block">
            <DashboardIndicators
              edStatus={evalStats.desempeno?.status || null}
              ptStatus={evalStats.potencial?.status || null}
              cycleId={cycle.id}
              layout="vertical"
            />
          </div>
        )}

        {/* GAUGE - Siempre centrado */}
        <SegmentedRing total={ringTotal} completed={ringCompleted} />

        {/* CTA - Solo visible en DESKTOP (derecha) */}
        {nextEmployee && (
          <div className="hidden md:block">
            <CTAButton
              nextEmployee={nextEmployee}
              isPhase2={isPhase2}
              onStart={onStart}
            />
          </div>
        )}
      </div>

      {/* ED/PT - Solo visible en MOBILE (debajo, centrado) */}
      {evalStats && (
        <div className="md:hidden">
          <DashboardIndicators
            edStatus={evalStats.desempeno?.status || null}
            ptStatus={evalStats.potencial?.status || null}
            cycleId={cycle.id}
            layout="horizontal"
          />
        </div>
      )}

      {/* Phase 2 info */}
      {isPhase2 && (
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Evaluaciones completadas. Asigna potencial a {stats.pendingPotential} colaborador{stats.pendingPotential !== 1 ? 'es' : ''}.
        </p>
      )}

      {/* CTA - Solo visible en MOBILE (abajo) */}
      {nextEmployee && (
        <div className="md:hidden">
          <CTAButton
            nextEmployee={nextEmployee}
            isPhase2={isPhase2}
            onStart={onStart}
          />
        </div>
      )}
    </motion.div>
  )
}

// Extraer CTA como componente interno para no duplicar código
function CTAButton({
  nextEmployee,
  isPhase2,
  onStart
}: {
  nextEmployee: { id: string; displayName: string }
  isPhase2: boolean
  onStart: (id: string) => void
}) {
  return (
    <motion.button
      onClick={() => onStart(nextEmployee.id)}
      className={cn(
        "group relative flex items-center rounded-xl transition-all transform hover:-translate-y-0.5",
        "gap-4 pl-5 pr-2 py-2",
        isPhase2
          ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white shadow-[0_8px_24px_-6px_rgba(168,85,247,0.35)]"
          : "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-left">
        <span className={cn(
          "block text-[9px] uppercase tracking-wider font-semibold opacity-70",
          isPhase2 ? "text-purple-100" : "text-slate-700"
        )}>
          {isPhase2 ? 'Evaluar Potencial' : 'Siguiente'}
        </span>
        <span className="block text-sm font-bold leading-tight">
          {nextEmployee.displayName}
        </span>
      </div>
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center",
        isPhase2 ? "bg-white/20" : "bg-slate-950/10"
      )}>
        {isPhase2 ? (
          <Star className="w-4 h-4" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
      </div>
    </motion.button>
  )
}
