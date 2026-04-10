'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE SPOTLIGHT CARD — Cinema Mode pattern (split 30/70)
// Patron clonado de InsightSpotlightCard.tsx (Executive Hub)
// LEFT (30%): icon + title + description + QuickStats
// RIGHT (70%): contenido especifico de la card seleccionada
// Mobile-first: flex-col md:flex-row (stack vertical en mobile)
// src/app/dashboard/workforce/components/WorkforceSpotlightCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, Users, TrendingUp, Sliders, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkforceDiagnosticData } from '../types/workforce.types'
import type { WorkforceCardType } from './WorkforceRailCard'
import { computeHallazgosCount } from '../utils/workforce.utils'
import { formatCurrency } from '../utils/format'

// ════════════════════════════════════════════════════════════════════════════
// META POR CARD
// ════════════════════════════════════════════════════════════════════════════

const CARD_META: Record<WorkforceCardType, {
  icon: LucideIcon
  title: string
  description: string
  color: string
}> = {
  diagnostico: {
    icon: Brain,
    title: 'Diagnostico Workforce',
    description: 'Cascada ejecutiva: portada → ancla → 5 actos',
    color: 'text-cyan-400',
  },
  estructura: {
    icon: Users,
    title: 'Estructura por Persona',
    description: 'Drill-down individual con tier de retencion',
    color: 'text-cyan-400',
  },
  benchmarks: {
    icon: TrendingUp,
    title: 'Benchmarks Industria',
    description: 'Comparacion contra mercado y tamaño',
    color: 'text-purple-400',
  },
  simulador: {
    icon: Sliders,
    title: 'Simulador de Escenarios',
    description: '3 tesis con sliders interactivos',
    color: 'text-purple-400',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// QUICK STATS — left panel summary numbers
// ════════════════════════════════════════════════════════════════════════════

function StatRow({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div className="group relative flex items-center justify-between">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={cn('text-sm font-medium font-mono', color || 'text-white')}>{value}</span>

      {tooltip && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
          <p className="text-[10px] text-slate-400 leading-relaxed">{tooltip}</p>
        </div>
      )}
    </div>
  )
}

function QuickStats({ card, data }: { card: WorkforceCardType; data: WorkforceDiagnosticData }) {
  switch (card) {
    case 'diagnostico': {
      const hallazgos = computeHallazgosCount(data)
      const exposurePct = Math.round(data.exposure.avgExposure * 100)
      return (
        <div className="space-y-3 w-full">
          <StatRow
            label="Exposicion"
            value={`${exposurePct}%`}
            color={exposurePct > 60 ? 'text-red-400' : exposurePct > 40 ? 'text-amber-400' : 'text-cyan-400'}
            tooltip="Promedio de exposicion a la automatizacion segun Anthropic Economic Index."
          />
          <StatRow
            label="Hallazgos"
            value={`${hallazgos}`}
            color={hallazgos > 5 ? 'text-red-400' : hallazgos > 0 ? 'text-amber-400' : 'text-slate-400'}
            tooltip="Situaciones criticas detectadas cruzando exposicion IA con performance, compromiso y estructura."
          />
          <StatRow
            label="FTE liberables"
            value={data.liberatedFTEs.totalFTEs.toFixed(1)}
            color="text-purple-400"
            tooltip="Capacidad humana equivalente que la IA puede absorber hoy."
          />
          <StatRow
            label="Costo inercia/mes"
            value={formatCurrency(data.inertiaCost.totalMonthly)}
            color="text-purple-400"
            tooltip="Costo mensual de cargos con mas de 50% de exposicion a IA."
          />
        </div>
      )
    }
    case 'estructura': {
      const { intocablesCount, prescindiblesCount } = data.retentionPriority
      return (
        <div className="space-y-3 w-full">
          <StatRow
            label="Total"
            value={`${data.totalEmployees}`}
            tooltip="Personas activas evaluadas en este ciclo."
          />
          <StatRow
            label="Intocables"
            value={`${intocablesCount}`}
            color="text-emerald-400"
            tooltip="Talento critico — prioridad de retencion maxima."
          />
          <StatRow
            label="Prescindibles"
            value={`${prescindiblesCount}`}
            color="text-red-400"
            tooltip="Bajo retorno y baja prioridad de retencion."
          />
        </div>
      )
    }
    case 'benchmarks':
      return (
        <div className="space-y-3 w-full">
          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            Pendiente metrica exposure_ia en benchmark system
          </p>
        </div>
      )
    case 'simulador':
      return (
        <div className="space-y-3 w-full">
          <p className="text-[10px] text-slate-600 text-center leading-relaxed">
            3 tesis: Eficiencia · Crecimiento · Evolucion
          </p>
        </div>
      )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface WorkforceSpotlightCardProps {
  card: WorkforceCardType
  data: WorkforceDiagnosticData
  onBack: () => void
  children: React.ReactNode
}

export const WorkforceSpotlightCard = memo(function WorkforceSpotlightCard({
  card,
  data,
  onBack,
  children,
}: WorkforceSpotlightCardProps) {
  const meta = CARD_META[card]
  const Icon = meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800/50 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden">

        {/* Tesla line */}
        <div className="fhr-top-line absolute top-0 left-0 right-0 z-20" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-5 left-5 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Lobby
        </button>

        {/* LEFT COLUMN: Summary (30%) — Apple breathing room */}
        <div className="w-full md:w-[260px] md:flex-shrink-0 bg-slate-900/30 p-8 pt-14 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-800/40">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', 'bg-slate-800/50 backdrop-blur-sm')}>
            <Icon className={cn('w-7 h-7', meta.color)} />
          </div>

          <h2 className="text-lg font-light text-white text-center mb-1 tracking-tight">{meta.title}</h2>
          <p className="text-xs text-slate-500 text-center mb-6">{meta.description}</p>

          {/* Quick stats */}
          <QuickStats card={card} data={data} />
        </div>

        {/* RIGHT COLUMN: Detail (70%) — generous padding + scroll */}
        <div className="flex-1 p-6 md:p-8 pt-14 md:pt-8 overflow-y-auto max-h-[80vh] md:max-h-[85vh]">
          {children}
        </div>
      </div>
    </motion.div>
  )
})

export default WorkforceSpotlightCard
