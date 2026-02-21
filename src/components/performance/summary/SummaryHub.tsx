'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUMMARY HUB - Las 3 Puertas (Diagnóstico, Conversación, Desarrollo)
// src/components/performance/summary/SummaryHub.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Activity, MessageCircle, Target } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'

export type Moment = 'diagnostico' | 'conversacion' | 'desarrollo'

export interface MomentData {
  label: string
  tagline: string
  metric: string | null
  metricLabel: string
  available: boolean
  fallback?: string | null
}

interface SummaryHubProps {
  momentData: Record<Moment, MomentData>
  evaluateeName: string
  insightText?: string | null
  onSelectMoment: (moment: Moment) => void
}

const MOMENT_CONFIG: Record<Moment, {
  icon: typeof Activity
  color: string
}> = {
  diagnostico: {
    icon: Activity,
    color: '#22D3EE'
  },
  conversacion: {
    icon: MessageCircle,
    color: '#A78BFA'
  },
  desarrollo: {
    icon: Target,
    color: '#10B981'
  }
}

export default memo(function SummaryHub({
  momentData,
  evaluateeName,
  insightText,
  onSelectMoment
}: SummaryHubProps) {

  const firstName = formatDisplayName(evaluateeName, 'short').split(' ')[0]
  const diagData = momentData.diagnostico

  return (
    <div className="flex flex-col h-full justify-center">

      {/* Mensaje principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-2xl md:text-3xl font-light text-white leading-relaxed">
          <span className="text-cyan-400 font-medium">{firstName}</span>
          {' '}obtuvo {diagData.metric ?? '-'} {diagData.metricLabel}
        </h1>
      </motion.div>

      {/* 3 Puertas - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
      >
        {(Object.keys(momentData) as Moment[]).map((moment, idx) => {
          const data = momentData[moment]
          const config = MOMENT_CONFIG[moment]
          const Icon = config.icon

          return (
            <motion.button
              key={moment}
              onClick={() => data.available && onSelectMoment(moment)}
              disabled={!data.available}
              className={`
                relative p-6 rounded-2xl border transition-all text-left
                bg-[#0F172A]/60 backdrop-blur-md
                ${data.available
                  ? 'border-slate-800 hover:border-slate-700 cursor-pointer'
                  : 'border-slate-800/30 cursor-not-allowed opacity-50'
                }
              `}
              whileHover={data.available ? { scale: 1.02, y: -4 } : {}}
              whileTap={data.available ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.1 }}
            >
              {/* Línea Tesla superior */}
              <div
                className="absolute top-0 left-4 right-4 h-[2px] rounded-t-2xl"
                style={{
                  background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`
                }}
              />

              {/* Icono */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${config.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
              </div>

              {/* Label */}
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: config.color }}
              >
                {data.label}
              </p>

              {/* Tagline */}
              <p className="text-sm text-slate-300 font-medium mb-3">
                {data.tagline}
              </p>

              {/* Metric or Fallback */}
              {data.metric ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">
                    {data.metric}
                  </span>
                  {data.metricLabel && (
                    <span className="text-xs text-slate-500">
                      {data.metricLabel}
                    </span>
                  )}
                </div>
              ) : data.fallback ? (
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  {data.fallback}
                </p>
              ) : null}

            </motion.button>
          )
        })}
      </motion.div>

      {/* Insight destacado */}
      {insightText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-slate-400">
            <span className="text-slate-300">{insightText}</span>
          </p>
        </motion.div>
      )}

    </div>
  )
})
