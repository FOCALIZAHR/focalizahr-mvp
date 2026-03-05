'use client'

// ════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD - Narrativa + Indicator Dots (filosofía FocalizaHR)
// Sin números grandes. Narrativa textual + dot de estado.
// src/app/dashboard/executive-hub/components/InsightCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TALENT_INTELLIGENCE_THRESHOLDS } from '@/config/performanceClassification'

const ROLE_FIT_HIGH = TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH
import { AlertTriangle, Users, BarChart3, Zap, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InsightType, SummaryData } from '@/hooks/useExecutiveHubData'

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const INSIGHT_ICONS: Record<InsightType, typeof AlertTriangle> = {
  alertas: AlertTriangle,
  talento: Users,
  calibracion: BarChart3,
  capacidades: Zap,
  sucesion: Target
}

const INSIGHT_LABELS: Record<InsightType, string> = {
  alertas: 'Alertas',
  talento: 'Talento',
  calibracion: 'Calibracion',
  capacidades: 'Capacidades',
  sucesion: 'Sucesion'
}

// ════════════════════════════════════════════════════════════════════════════
// DOT STATUS: none | cyan | purple | red
// ════════════════════════════════════════════════════════════════════════════

type DotStatus = 'none' | 'cyan' | 'purple' | 'red'

function getDotStatus(type: InsightType, summary: SummaryData): DotStatus {
  switch (type) {
    case 'alertas':
      if (summary.alertas.critical > 0) return 'red'
      if (summary.alertas.total > 0) return 'cyan'
      return 'none'
    case 'talento':
      if (summary.talento.starsPercent < 8) return 'purple'
      return 'none'
    case 'calibracion':
      if (summary.calibracion.confidence < 60) return 'purple'
      if (summary.calibracion.confidence < 80) return 'cyan'
      return 'none'
    case 'capacidades':
      if (summary.capacidades.roleFit < 60) return 'red'
      if (summary.capacidades.roleFit < ROLE_FIT_HIGH) return 'purple'
      return 'none'
    case 'sucesion':
      if (summary.sucesion.coverage < 50) return 'red'
      if (summary.sucesion.uncoveredCount > 0) return 'cyan'
      return 'none'
  }
}

const DOT_COLORS: Record<DotStatus, string> = {
  none: '',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  red: 'bg-red-500'
}

const DOT_PING_COLORS: Record<DotStatus, string> = {
  none: '',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  red: 'bg-red-400'
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE TEXT — Textual instead of big numbers
// ════════════════════════════════════════════════════════════════════════════

function getInsightNarrative(type: InsightType, summary: SummaryData): { text: string; tooltip: string } {
  switch (type) {
    case 'alertas': {
      const { total, critical } = summary.alertas
      if (total === 0) return {
        text: 'Sin novedades',
        tooltip: 'No hay alertas activas en este momento'
      }
      return {
        text: `${total} situaciones requieren atencion`,
        tooltip: `${critical} criticas, ${total - critical} de seguimiento`
      }
    }
    case 'talento': {
      const { starsPercent } = summary.talento
      if (starsPercent >= 15) return {
        text: 'Pipeline saludable',
        tooltip: `${starsPercent}% de empleados clasificados como estrellas`
      }
      if (starsPercent >= 8) return {
        text: 'Pipeline estable',
        tooltip: `${starsPercent}% estrellas — monitorear crecimiento`
      }
      return {
        text: 'Concentracion de riesgo',
        tooltip: `Solo ${starsPercent}% estrellas — revisar desarrollo de talento`
      }
    }
    case 'calibracion': {
      const { confidence } = summary.calibracion
      if (confidence >= 80) return {
        text: 'Datos confiables',
        tooltip: `${confidence}% confianza en calibracion`
      }
      if (confidence >= 60) return {
        text: 'En progreso',
        tooltip: `${confidence}% confianza — calibracion en curso`
      }
      return {
        text: 'Pendiente validar',
        tooltip: `${confidence}% confianza — requiere sesion de calibracion`
      }
    }
    case 'capacidades': {
      const { roleFit, worstLayer } = summary.capacidades
      if (roleFit >= ROLE_FIT_HIGH) return {
        text: 'Equipo preparado',
        tooltip: `${roleFit}% role fit organizacional`
      }
      if (roleFit >= 60) return {
        text: 'Oportunidad de mejora',
        tooltip: `${roleFit}% role fit — revisar gaps en ${worstLayer}`
      }
      return {
        text: `Gaps en ${worstLayer}`,
        tooltip: `${roleFit}% role fit — atencion prioritaria en ${worstLayer}`
      }
    }
    case 'sucesion': {
      const { coverage, uncoveredCount } = summary.sucesion
      if (coverage >= 80) return {
        text: 'Roles cubiertos',
        tooltip: `${coverage}% cobertura de sucesion`
      }
      if (coverage > 0) return {
        text: `${uncoveredCount} roles sin sucesor`,
        tooltip: `${coverage}% cobertura — planificar sucesion`
      }
      return {
        text: 'Disponible proximamente',
        tooltip: 'Modulo de sucesion en preparacion'
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INDICATOR DOT
// ════════════════════════════════════════════════════════════════════════════

function IndicatorDot({ status }: { status: DotStatus }) {
  if (status === 'none') return null

  return (
    <span className="relative flex h-2 w-2">
      {status === 'red' && (
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', DOT_PING_COLORS[status])} />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', DOT_COLORS[status])} />
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

function CardTooltip({ text, visible }: { text: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg bg-slate-900/95 border border-white/10 shadow-xl whitespace-nowrap"
        >
          <span className="text-[10px] text-slate-300">{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface InsightCardProps {
  type: InsightType
  summary: SummaryData
  isActive: boolean
  onClick: () => void
}

export const InsightCard = memo(function InsightCard({
  type,
  summary,
  isActive,
  onClick
}: InsightCardProps) {
  const Icon = INSIGHT_ICONS[type]
  const label = INSIGHT_LABELS[type]
  const dotStatus = getDotStatus(type, summary)
  const { text, tooltip } = getInsightNarrative(type, summary)

  const [showTooltip, setShowTooltip] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowTooltip(true), 200)
  }

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setShowTooltip(false)
  }

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-[200px] h-[150px] flex-shrink-0 rounded-2xl',
        'bg-slate-800/40 backdrop-blur-sm border transition-all duration-300',
        isActive
          ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
          : dotStatus === 'red'
            ? 'border-red-500/20 hover:border-red-500/40'
            : 'border-white/5 hover:border-slate-600/50'
      )}
    >
      {/* Tooltip */}
      <CardTooltip text={tooltip} visible={showTooltip} />

      {/* Top row: icon + dot */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
        <IndicatorDot status={dotStatus} />
      </div>

      {/* Narrative text — protagonist */}
      <span className={cn(
        'text-[13px] font-medium leading-snug text-center px-3',
        dotStatus === 'red' ? 'text-red-400' : 'text-slate-200'
      )}>
        {text}
      </span>

      {/* Type label */}
      <span className={cn(
        'text-[9px] uppercase tracking-[0.15em] font-bold mt-3',
        isActive ? 'text-cyan-400' : 'text-slate-500'
      )}>
        {label}
      </span>
    </motion.button>
  )
})
