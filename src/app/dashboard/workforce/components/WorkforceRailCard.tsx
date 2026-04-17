'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE RAIL CARD — Card individual del Rail
// Patron clonado de InsightCard.tsx (Executive Hub)
// Narrativa textual + indicator dot + label uppercase
// src/app/dashboard/workforce/components/WorkforceRailCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Users, TrendingUp, Sliders, Grid3x3, Layers, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkforceDiagnosticData } from '../types/workforce.types'
import { computeHallazgosCount } from '../utils/workforce.utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type WorkforceCardType =
  | 'diagnostico'
  | 'nine-box-live'
  | 'descriptor-simulator'
  | 'estructura'
  | 'benchmarks'
  | 'simulador'
  | 'presupuesto'

const CARD_ICONS: Record<WorkforceCardType, typeof Brain> = {
  diagnostico: Brain,
  'nine-box-live': Grid3x3,
  'descriptor-simulator': Layers,
  estructura: Users,
  benchmarks: TrendingUp,
  simulador: Sliders,
  presupuesto: Wallet,
}

const CARD_LABELS: Record<WorkforceCardType, string> = {
  diagnostico: 'Diagnostico',
  'nine-box-live': '9-Box × IA',
  'descriptor-simulator': 'Rediseño cargos',
  estructura: 'Estructura',
  benchmarks: 'Benchmarks',
  simulador: 'Simulador',
  presupuesto: 'Presupuesto',
}

// ════════════════════════════════════════════════════════════════════════════
// DOT STATUS
// ════════════════════════════════════════════════════════════════════════════

type DotStatus = 'none' | 'cyan' | 'purple' | 'red'

function getDotStatus(card: WorkforceCardType, data: WorkforceDiagnosticData): DotStatus {
  switch (card) {
    case 'diagnostico': {
      const hallazgos = computeHallazgosCount(data)
      if (hallazgos > 5) return 'red'
      if (hallazgos > 0) return 'purple'
      if (data.exposure.avgExposure > 0.5) return 'cyan'
      return 'none'
    }
    case 'nine-box-live': {
      const classified = data.retentionPriority.ranking.filter(
        r => r.nineBoxPosition !== null && r.nineBoxPosition !== undefined,
      ).length
      return classified > 0 ? 'cyan' : 'none'
    }
    case 'descriptor-simulator':
      // Status cyan siempre — el dropdown decidirá si hay descriptors
      return 'cyan'
    case 'estructura':
      return data.totalEmployees > 0 ? 'cyan' : 'none'
    case 'benchmarks':
      return 'none'
    case 'simulador':
      return 'none'
    case 'presupuesto':
      return 'cyan'
  }
}

const DOT_COLORS: Record<DotStatus, string> = {
  none: '',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  red: 'bg-red-500',
}

const DOT_PING_COLORS: Record<DotStatus, string> = {
  none: '',
  cyan: 'bg-cyan-400',
  purple: 'bg-purple-400',
  red: 'bg-red-400',
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE TEXT
// ════════════════════════════════════════════════════════════════════════════

function getCardNarrative(card: WorkforceCardType, data: WorkforceDiagnosticData): { text: string; tooltip: string } {
  switch (card) {
    case 'diagnostico': {
      const hallazgos = computeHallazgosCount(data)
      const pct = Math.round(data.exposure.avgExposure * 100)
      if (hallazgos === 0) {
        return {
          text: 'Sin hallazgos criticos',
          tooltip: `${pct}% de exposicion organizacional, sin situaciones criticas detectadas`,
        }
      }
      return {
        text: `${hallazgos} situaciones requieren decision`,
        tooltip: `${pct}% exposicion organizacional · ${data.zombies.count} zombies, ${data.flightRisk.count} en riesgo de fuga`,
      }
    }
    case 'nine-box-live': {
      const classified = data.retentionPriority.ranking.filter(
        r => r.nineBoxPosition !== null && r.nineBoxPosition !== undefined,
      ).length
      if (classified === 0) {
        return {
          text: 'Sin clasificacion 9-box',
          tooltip: 'Activa Performance para desbloquear el triaje',
        }
      }
      return {
        text: `${classified} ${classified === 1 ? 'persona' : 'personas'} en triaje`,
        tooltip: 'Matriz 3x3 con lasso libre · color = exposicion IA · tamano = salario',
      }
    }
    case 'descriptor-simulator':
      return {
        text: 'Simula el rediseno por cargo',
        tooltip:
          'Edita las tareas de un descriptor y ve en vivo cuanto rescatas, cuantas horas liberas y como cae la exposicion a IA',
      }
    case 'estructura': {
      if (data.totalEmployees === 0) {
        return { text: 'Sin datos', tooltip: 'No hay empleados clasificados' }
      }
      return {
        text: `${data.totalEmployees} personas evaluadas`,
        tooltip: `Drill-down por persona con tier de retencion (intocable, valioso, neutro, prescindible)`,
      }
    }
    case 'benchmarks':
      return {
        text: 'Proximamente',
        tooltip: 'Comparacion contra industria — pendiente metrica exposure_ia',
      }
    case 'simulador':
      return {
        text: 'Proximamente',
        tooltip: '3 tesis (Eficiencia, Crecimiento, Evolucion) con sliders interactivos',
      }
    case 'presupuesto':
      return {
        text: 'Presupuesto anual en 5 pasos',
        tooltip: 'Wizard que proyecta costo, finiquitos y timing de decisiones para directorio',
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

interface WorkforceRailCardProps {
  type: WorkforceCardType
  data: WorkforceDiagnosticData
  isActive: boolean
  onClick: () => void
}

export const WorkforceRailCard = memo(function WorkforceRailCard({
  type,
  data,
  isActive,
  onClick,
}: WorkforceRailCardProps) {
  const Icon = CARD_ICONS[type]
  const label = CARD_LABELS[type]
  const dotStatus = getDotStatus(type, data)
  const { text, tooltip } = getCardNarrative(type, data)

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
      <CardTooltip text={tooltip} visible={showTooltip} />

      {/* Top row: icon + dot */}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
        <IndicatorDot status={dotStatus} />
      </div>

      {/* Narrative text — protagonist */}
      <span
        className={cn(
          'text-[13px] font-medium leading-snug text-center px-3',
          dotStatus === 'red' ? 'text-red-400' : 'text-slate-200'
        )}
      >
        {text}
      </span>

      {/* Type label */}
      <span
        className={cn(
          'text-[9px] uppercase tracking-[0.15em] font-bold mt-3',
          isActive ? 'text-cyan-400' : 'text-slate-500'
        )}
      >
        {label}
      </span>
    </motion.button>
  )
})

export default WorkforceRailCard
