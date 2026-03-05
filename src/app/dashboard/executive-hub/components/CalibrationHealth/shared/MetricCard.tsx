'use client'

// ════════════════════════════════════════════════════════════════════════════
// METRIC CARD - Card de métrica σ con mini histogram
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { BarChart3, AlertTriangle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STATUS_COLORS } from '../CalibrationHealth.constants'
import type { CalibrationData, ChartDataPoint } from '../CalibrationHealth.types'

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION σ CARD
// ════════════════════════════════════════════════════════════════════════════

interface DistributionCardProps {
  stdDev: number
  chartData: ChartDataPoint[]
  description: string
}

export function DistributionCard({ stdDev, chartData, description }: DistributionCardProps) {
  return (
    <div className="rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={12} className="text-cyan-400" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
          Distribución
        </span>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex items-end gap-0.5 h-6">
          {chartData.map((d, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(d.real * 2, 4)}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="w-1.5 rounded-t-sm bg-purple-400/60"
            />
          ))}
        </div>

        <div>
          <div className="text-xl font-black font-mono tracking-tighter text-cyan-400">
            σ {stdDev}
          </div>
          <div className="text-[9px] uppercase text-slate-600 tracking-widest">
            Desviación
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 mt-2 leading-snug italic border-l-2 border-slate-700 pl-2">
        {description}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BIAS CARD
// ════════════════════════════════════════════════════════════════════════════

interface BiasCardProps {
  dominantStatus: string
  biasMessage: string | null
  confidence: number
}

export function BiasCard({ dominantStatus, biasMessage, confidence }: BiasCardProps) {
  return (
    <div className={cn(
      'rounded-xl backdrop-blur-xl border p-3',
      STATUS_COLORS[dominantStatus]?.bg || 'bg-slate-800/30',
      'border-slate-700/30'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={12} className="text-purple-400" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold">
          Sesgo
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-2 h-2 rounded-full', STATUS_COLORS[dominantStatus]?.led)} />
        <span className={cn('text-sm font-bold uppercase tracking-wide', STATUS_COLORS[dominantStatus]?.text)}>
          {dominantStatus === 'OPTIMA' ? 'Sin Sesgo' : dominantStatus}
        </span>
      </div>

      <p className="text-[10px] text-slate-400 leading-snug">
        {biasMessage || 'Distribución equilibrada sin sesgos significativos.'}
      </p>

      {/* Barra de confianza */}
      <div className="mt-2 pt-2 border-t border-slate-700/30">
        <div className="flex justify-between text-[9px] mb-1">
          <span className="text-slate-500 uppercase tracking-wider">Confianza</span>
          <span className={cn(
            'font-mono font-bold',
            confidence >= 80 ? 'text-emerald-400' :
            confidence >= 60 ? 'text-amber-400' : 'text-red-400'
          )}>
            {confidence}%
          </span>
        </div>
        <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              confidence >= 80 ? 'bg-emerald-400' :
              confidence >= 60 ? 'bg-amber-400' : 'bg-red-400'
            )}
          />
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SMART FEEDBACK CARD
// ════════════════════════════════════════════════════════════════════════════

interface SmartFeedbackCardProps {
  feedback: string
}

export function SmartFeedbackCard({ feedback }: SmartFeedbackCardProps) {
  return (
    <div className="rounded-xl bg-slate-900/50 backdrop-blur-xl border border-slate-700/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={12} className="text-cyan-400" />
        <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">
          Smart Feedback
        </span>
      </div>

      <p className="text-[11px] text-slate-300 leading-snug font-medium italic">
        &ldquo;{feedback}&rdquo;
      </p>
    </div>
  )
}
