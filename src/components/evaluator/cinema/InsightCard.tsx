'use client'

// ════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD v2 - Redesign FocalizaHR Cinema Mode
// src/components/evaluator/cinema/InsightCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Renderiza diferente según insight.type:
//   tenure       → Número HERO + barra progreso + detalle
//   evaluationType → Ícono dinámico + label humanizado
//   dueDate      → Número HERO días restantes + barra urgencia + fecha
//   completedAt  → Círculo check + fecha + tiempo relativo
//   default      → Layout genérico (fallback)
// ════════════════════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils'
import {
  User, UserCheck, Users, ArrowUp,
  Calendar, CheckCircle, ClipboardList, Clock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Insight } from '@/lib/utils/calculateInsights'

interface InsightCardProps {
  insight: Insight
  /** Raw ISO date for completedAt relative time calculation */
  rawDate?: string
}

// ════════════════════════════════════════════════════════════════════════════
// EVALUATION TYPE CONFIG
// ════════════════════════════════════════════════════════════════════════════

const EVALUATION_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  'SELF':                 { label: 'Autoevaluación',        icon: User },
  'MANAGER_TO_EMPLOYEE':  { label: 'Evaluación del Jefe',   icon: UserCheck },
  'MANAGER':              { label: 'Evaluación del Jefe',   icon: UserCheck },
  'PEER':                 { label: 'Entre Pares',           icon: Users },
  'EMPLOYEE_TO_MANAGER':  { label: 'Evaluación Ascendente', icon: ArrowUp },
  'UPWARD':               { label: 'Evaluación Ascendente', icon: ArrowUp }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function parseTenure(value: string): { years: number; detail: string } {
  const yearMatch = value.match(/(\d+)\s*año/)
  const monthMatch = value.match(/(\d+)\s*mes/)
  const years = yearMatch ? parseInt(yearMatch[1]) : 0
  const months = monthMatch ? parseInt(monthMatch[1]) : 0
  const detail = years > 0 || months > 0
    ? `${years > 0 ? `${years} año${years !== 1 ? 's' : ''}` : ''}${years > 0 && months > 0 ? ' ' : ''}${months > 0 ? `${months} mes${months !== 1 ? 'es' : ''}` : ''}`
    : value
  return { years, detail }
}

function getRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'hoy'
    if (diffDays === 1) return 'ayer'
    if (diffDays < 7) return `hace ${diffDays} dias`
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
    return `hace ${Math.floor(diffDays / 30)} meses`
  } catch {
    return ''
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CARD: ANTIGÜEDAD
// ════════════════════════════════════════════════════════════════════════════

function TenureCard({ value }: { value: string }) {
  const { years, detail } = parseTenure(value)

  return (
    <div className="p-4 rounded-xl border bg-slate-800/40 border-slate-700/30">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <Calendar className="w-3 h-3" />
        Antiguedad
      </div>

      <div className="text-center mb-2">
        <div className="text-2xl font-light text-white tabular-nums">
          {years}
        </div>
        <div className="text-xs text-slate-400">
          {years === 1 ? 'año' : 'años'}
        </div>
      </div>

      {/* 10 dots: cada uno = 1 año */}
      <div className="flex gap-1 justify-center mb-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              i < years ? 'bg-purple-500' : 'bg-slate-700/50'
            )}
          />
        ))}
      </div>

      <div className="text-[10px] text-slate-500 text-center">
        {detail}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARD: TIPO EVALUACIÓN
// ════════════════════════════════════════════════════════════════════════════

function EvaluationTypeCard({ value }: { value: string }) {
  const config = EVALUATION_TYPE_CONFIG[value] || { label: value, icon: ClipboardList }
  const TypeIcon = config.icon

  return (
    <div className="p-4 rounded-xl border bg-slate-800/40 border-slate-700/30">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <ClipboardList className="w-3 h-3" />
        Tipo
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-slate-700/50 flex items-center justify-center">
          <TypeIcon className="w-4.5 h-4.5 text-cyan-400" />
        </div>
        <div className="text-sm font-medium text-white text-center leading-tight">
          {config.label}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARD: FECHA LIMITE
// ════════════════════════════════════════════════════════════════════════════

function parseDaysRemaining(dateStr: string): number {
  try {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  } catch {
    return 0
  }
}

function getUrgencyConfig(days: number): { color: string; barColor: string; bgColor: string; borderColor: string } {
  if (days <= 3) return { color: 'text-red-400', barColor: 'bg-red-500', bgColor: 'bg-red-950/10', borderColor: 'border-red-500/20' }
  if (days <= 7) return { color: 'text-amber-400', barColor: 'bg-amber-500', bgColor: 'bg-amber-950/10', borderColor: 'border-amber-500/20' }
  return { color: 'text-cyan-400', barColor: 'bg-cyan-500', bgColor: 'bg-slate-800/40', borderColor: 'border-slate-700/30' }
}

function DueDateCard({ value, rawDate }: { value: string; rawDate?: string }) {
  const days = rawDate ? parseDaysRemaining(rawDate) : 0
  const urgency = getUrgencyConfig(days)
  // Bar: 30 days = 0%, 0 days = 100%
  const barPercent = Math.min(Math.max(((30 - days) / 30) * 100, 0), 100)

  return (
    <div className={cn('p-4 rounded-xl border', urgency.bgColor, urgency.borderColor)}>
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <Clock className="w-3 h-3" />
        Fecha Limite
      </div>

      <div className="text-center mb-2">
        <div className={cn('text-2xl font-light tabular-nums', urgency.color)}>
          {days}
        </div>
        <div className="text-xs text-slate-400">
          {days === 1 ? 'día restante' : 'días restantes'}
        </div>
      </div>

      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-1.5">
        <div
          className={cn('h-full rounded-full transition-all duration-500', urgency.barColor)}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <div className="text-[10px] text-slate-500 text-center">
        {value}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CARD: COMPLETADA
// ════════════════════════════════════════════════════════════════════════════

function CompletedCard({ value, rawDate }: { value: string; rawDate?: string }) {
  const relative = rawDate ? getRelativeTime(rawDate) : ''

  return (
    <div className="p-4 rounded-xl border bg-emerald-950/10 border-emerald-500/20">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        Completada
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-white text-center">
            {value}
          </div>
          {relative && (
            <div className="text-[10px] text-slate-500 text-center mt-0.5">
              {relative}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DEFAULT FALLBACK
// ════════════════════════════════════════════════════════════════════════════

function DefaultCard({ insight }: { insight: Insight }) {
  const Icon = insight.icon
  const variantStyles = {
    default: 'bg-slate-800/40 border-slate-700/50',
    warning: 'bg-amber-950/10 border-amber-500/20',
    success: 'bg-emerald-950/10 border-emerald-500/20'
  }
  const isFullWidth = insight.type === 'gap'

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      variantStyles[insight.variant],
      isFullWidth && 'col-span-2'
    )}>
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        <Icon className="w-3 h-3" />
        {insight.label}
      </div>
      <div className="text-xl text-white font-mono font-medium">
        {insight.value}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function InsightCard({ insight, rawDate }: InsightCardProps) {
  switch (insight.type) {
    case 'tenure':
      return <TenureCard value={insight.value} />
    case 'evaluationType':
      return <EvaluationTypeCard value={insight.value} />
    case 'dueDate':
      return <DueDateCard value={insight.value} rawDate={rawDate} />
    case 'completedAt':
      return <CompletedCard value={insight.value} rawDate={rawDate} />
    default:
      return <DefaultCard insight={insight} />
  }
}
