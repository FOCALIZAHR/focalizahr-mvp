'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
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
      className="flex flex-col items-center gap-8"
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

      {/* Segmented Ring */}
      <SegmentedRing total={ringTotal} completed={ringCompleted} />

      {/* Phase 2 info */}
      {isPhase2 && (
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Evaluaciones completadas. Asigna potencial a {stats.pendingPotential} colaborador{stats.pendingPotential !== 1 ? 'es' : ''}.
        </p>
      )}

      {/* LED Calibration Indicators */}
      {evalStats && (
        <DashboardIndicators
          edStatus={evalStats.desempeno?.status || null}
          ptStatus={evalStats.potencial?.status || null}
          cycleId={cycle.id}
        />
      )}

      {/* CTA Principal */}
      {nextEmployee && (
        <motion.button
          onClick={() => onStart(nextEmployee.id)}
          className={`group relative ${
            isPhase2
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:to-purple-400 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.25)] hover:shadow-[0_10px_40px_-5px_rgba(168,85,247,0.4)]'
              : 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:to-cyan-300 shadow-[0_10px_40px_-10px_rgba(34,211,238,0.25)] hover:shadow-[0_10px_40px_-5px_rgba(34,211,238,0.4)]'
          } text-${isPhase2 ? 'white' : 'slate-950'} pl-8 pr-2 py-3 rounded-xl flex items-center gap-6 transition-all transform hover:-translate-y-1`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-left">
            <span className={`block text-[10px] ${isPhase2 ? 'text-purple-200' : 'text-slate-800'} uppercase tracking-wider font-bold opacity-70`}>
              {isPhase2 ? 'Evaluar Potencial' : 'Siguiente Evaluacion'}
            </span>
            <span className="block text-lg font-bold leading-none">
              {nextEmployee.displayName}
            </span>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            {isPhase2 ? <Star className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
          </div>
        </motion.button>
      )}
    </motion.div>
  )
}
