'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

// ============================================================================
// TYPES
// ============================================================================

interface SummaryData {
  totalEmployees: number
  classified: number
  unclassified: number
  withAnomalies: number
  classificationRate: number
}

interface ByTrack {
  ejecutivo: number
  manager: number
  colaborador: number
}

interface ClassificationSummaryProps {
  summary: SummaryData | null
  byTrack: ByTrack | null
  onResolveClick: () => void
  onContinue?: () => void
  onCancel?: () => void
}

// ============================================================================
// GAUGE COMPONENT
// ============================================================================

function CircularGauge({ percentage }: { percentage: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        {/* Background circle */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="rgba(51,65,85,0.4)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-white tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          Clasificados
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// TRACK CARD
// ============================================================================

const TRACK_CONFIG = {
  ejecutivo: {
    label: 'Ejecutivo',
    sublabel: 'C-Level / Directores',
    icon: Shield,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/10'
  },
  manager: {
    label: 'Manager',
    sublabel: 'Jefes / Supervisores',
    icon: Users,
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/10'
  },
  colaborador: {
    label: 'Colaborador',
    sublabel: 'Analistas / Operativos',
    icon: Users,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10'
  }
} as const

function TrackCard({ track, count }: { track: keyof typeof TRACK_CONFIG; count: number }) {
  const config = TRACK_CONFIG[track]
  const Icon = config.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className={`
        rounded-xl p-4 border backdrop-blur-sm shadow-lg
        ${config.bg} ${config.border} ${config.glow}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${config.text}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {config.label}
        </span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${config.text}`}>
        {count}
      </p>
      <p className="text-[10px] text-slate-500 mt-0.5">
        {config.sublabel}
      </p>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default memo(function ClassificationSummary({
  summary,
  byTrack,
  onResolveClick,
  onContinue,
  onCancel
}: ClassificationSummaryProps) {
  const rate = summary?.classificationRate ?? 0
  const pending = summary?.unclassified ?? 0
  const anomalies = summary?.withAnomalies ?? 0
  const canProceed = pending === 0 && anomalies === 0

  const statusMessage = useMemo(() => {
    if (canProceed) return 'Todos los cargos estan clasificados'
    const parts: string[] = []
    if (pending > 0) parts.push(`${pending} cargos sin clasificar`)
    if (anomalies > 0) parts.push(`${anomalies} con anomalias`)
    return parts.join(' y ')
  }, [canProceed, pending, anomalies])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-white/5 shadow-xl overflow-hidden"
    >
      {/* Tesla Line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, #22D3EE 30%, #3B82F6 50%, #A78BFA 70%, transparent 90%)',
          boxShadow: '0 0 12px rgba(34,211,238,0.3)'
        }}
      />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-white mb-1">
            Clasificacion Inteligente
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-600" />
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-600" />
          </div>
        </div>

        {/* Gauge */}
        <CircularGauge percentage={rate} />

        <p className="text-center text-xs text-slate-400 mt-3 mb-6">
          {summary?.classified ?? 0} de {summary?.totalEmployees ?? 0} empleados clasificados
        </p>

        {/* Tesla divider */}
        <div className="h-px mb-6 rounded-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* Track cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <TrackCard track="ejecutivo" count={byTrack?.ejecutivo ?? 0} />
          <TrackCard track="manager" count={byTrack?.manager ?? 0} />
          <TrackCard track="colaborador" count={byTrack?.colaborador ?? 0} />
        </div>

        {/* Status banner */}
        {!canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl p-4 border border-amber-500/30 bg-amber-500/5 mb-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-200 font-medium">{statusMessage}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Resuelve los pendientes para continuar con el ciclo
                </p>
              </div>
              <PrimaryButton
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={onResolveClick}
              >
                Resolver
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5 mb-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300 font-medium">{statusMessage}</p>
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        <div className="flex gap-3">
          {onCancel && (
            <GhostButton size="md" onClick={onCancel} className="flex-1">
              Cancelar
            </GhostButton>
          )}
          <PrimaryButton
            size="md"
            onClick={onContinue}
            disabled={!canProceed}
            className="flex-1"
            icon={ArrowRight}
            iconPosition="right"
          >
            Continuar
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  )
})
