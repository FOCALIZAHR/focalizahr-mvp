'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION PROFILE HEADER - 3 Columnas
// src/components/performance/EvaluationProfileHeader.tsx
// ════════════════════════════════════════════════════════════════════════════
// COL 1: Distribución (σ + histograma + coach message)
// COL 2: ADN Equipo (top/low competencia)
// COL 3: Smart Feedback narrativo
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { BarChart3, Zap, Lightbulb, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type EvaluationStatus,
  STATUS_CONFIG,
  getCoachMessage,
  generateTeamInsight,
  getSemanticColorClass
} from '@/lib/utils/evaluatorStatsEngine'

interface EvaluationProfileHeaderProps {
  desempeno: {
    status: EvaluationStatus
    avg: number
    stdDev: number
    count: number
    distribution: number[]
  }
  teamDna: {
    top: { code: string; name: string; avgScore: number }
    low: { code: string; name: string; avgScore: number }
  } | null
  onOpenDiagnostic?: () => void
}

export function EvaluationProfileHeader({
  desempeno,
  teamDna,
  onOpenDiagnostic
}: EvaluationProfileHeaderProps) {
  const config = STATUS_CONFIG[desempeno.status]
  const colorClass = getSemanticColorClass(config.semanticType)

  const topPercent = teamDna ? Math.round((teamDna.top.avgScore / 5) * 100) : 0
  const lowPercent = teamDna ? Math.round((teamDna.low.avgScore / 5) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      onClick={onOpenDiagnostic}
      className={cn(
        'relative rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 overflow-hidden',
        'transition-all duration-300 ease-out',
        onOpenDiagnostic && 'group cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:border-cyan-500/20 active:scale-[0.99]'
      )}
    >
      {/* Tesla line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

      {/* Click affordance - appears on hover */}
      {onOpenDiagnostic && (
        <div className="absolute bottom-4 right-6 z-10
          flex items-center gap-1.5
          opacity-0 group-hover:opacity-100
          transition-all duration-300
          translate-x-2 group-hover:translate-x-0"
        >
          <span className="text-[10px] font-medium text-cyan-400/70 tracking-wide">
            Ver diagn&oacute;stico completo
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-cyan-400/70" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COL 1: DISTRIBUCIÓN DE DATOS                                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="p-6 lg:border-r border-b lg:border-b-0 border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
              Distribución de Datos
            </span>
          </div>

          {/* Histogram + σ */}
          <div className="flex items-end gap-5 mb-5">
            {/* Mini Histogram */}
            <div className="flex items-end gap-1 h-10">
              {desempeno.distribution.map((percent, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(percent, 8)}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={cn('w-2 rounded-t-sm', colorClass.bgBar)}
                />
              ))}
            </div>

            {/* σ Display */}
            <div>
              <div className={cn('text-xl font-black font-mono tracking-tighter', colorClass.text)}>
                σ {desempeno.stdDev}
              </div>
              <div className="text-[9px] uppercase text-white/30 tracking-widest">
                Desviación
              </div>
            </div>
          </div>

          {/* Coach Message */}
          <p className="text-[11px] text-white/50 leading-relaxed italic
            border-l-2 border-white/10 pl-3">
            &ldquo;{getCoachMessage(desempeno.status)}&rdquo;
          </p>

          {/* Small Stats */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-white/5">
            <div>
              <span className="text-[9px] text-white/30 uppercase">Promedio</span>
              <div className="text-sm font-mono font-bold text-white/70">{desempeno.avg}</div>
            </div>
            <div>
              <span className="text-[9px] text-white/30 uppercase">Evaluados</span>
              <div className="text-sm font-mono font-bold text-white/70">{desempeno.count}</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COL 2: ADN DEL EQUIPO                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="p-6 lg:border-r border-b lg:border-b-0 border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={14} className="text-purple-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
              ADN del Equipo
            </span>
          </div>

          {teamDna ? (
            <div className="space-y-5">
              {/* Fortaleza */}
              <div>
                <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-cyan-400">Fortaleza</span>
                  <span className="text-white/50 normal-case font-medium">{teamDna.top.name}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  />
                </div>
                <div className="text-[9px] text-white/30 mt-1 text-right">
                  {teamDna.top.avgScore.toFixed(1)} / 5.0
                </div>
              </div>

              {/* Área de Desarrollo */}
              <div>
                <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-purple-400">Área de Desarrollo</span>
                  <span className="text-white/50 normal-case font-medium">{teamDna.low.name}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lowPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                  />
                </div>
                <div className="text-[9px] text-white/30 mt-1 text-right">
                  {teamDna.low.avgScore.toFixed(1)} / 5.0
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-28 text-white/20 text-xs">
              Sin datos de competencias
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* COL 3: SMART FEEDBACK                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="p-6 flex flex-col justify-center">
          <div className="p-5 rounded-xl bg-black/30 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={13} className="text-cyan-400" />
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">
                Smart Feedback
              </span>
            </div>
            <p className="text-[12px] text-white/70 leading-relaxed font-medium italic">
              &ldquo;{generateTeamInsight(
                desempeno.status,
                teamDna?.top.name || null,
                teamDna?.low.name || null
              )}&rdquo;
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  )
}
