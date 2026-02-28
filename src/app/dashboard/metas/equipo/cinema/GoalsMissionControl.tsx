// ════════════════════════════════════════════════════════════════════════════
// GOALS MISSION CONTROL - Gauge + CTA dinámico
// src/app/dashboard/metas/equipo/cinema/GoalsMissionControl.tsx
// 
// BASADO EN: src/components/evaluator/cinema/MissionControl.tsx
// CORREGIDO: Lógica de CTA y gauge
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Target, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface StatusCounts {
  all: number
  empty: number
  incomplete: number
  ready: number
  exceeded: number
  noGoalsRequired: number
}

interface GoalsMissionControlProps {
  stats: {
    totalEmployees: number
    averageWeight: number
    completedCount: number
    incompleteCount: number
    emptyCount: number
    exceededCount: number
    completionRate: number
    total: number
    noGoalsRequired: number
  }
  pendingCount: number
  statusCounts: StatusCounts
  onBulkAssignClick: () => void
  onApprovalsClick: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CTA LOGIC (basado en averageWeight del backend)
// ════════════════════════════════════════════════════════════════════════════

interface CTAConfig {
  label: string
  sublabel: string
  action: 'assign' | 'complete' | 'progress' | 'approvals'
  gradient: string
  textColor: string
}

function getCTAConfig(stats: GoalsMissionControlProps['stats'], pendingCount: number): CTAConfig {
  // Prioridad 1: Aprobaciones pendientes
  if (pendingCount > 0) {
    return {
      label: 'Aprobar Cierres',
      sublabel: `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`,
      action: 'approvals',
      gradient: 'from-amber-500 to-amber-600',
      textColor: 'text-slate-950'
    }
  }

  // Prioridad 2: Basado en averageWeight
  if (stats.averageWeight === 0) {
    return {
      label: 'Asignar Metas',
      sublabel: `${stats.emptyCount} sin metas`,
      action: 'assign',
      gradient: 'from-cyan-400 to-cyan-500',
      textColor: 'text-slate-950'
    }
  }
  
  if (stats.averageWeight < 100) {
    return {
      label: 'Completar Asignación',
      sublabel: `${Math.round(stats.averageWeight)}% promedio`,
      action: 'complete',
      gradient: 'from-purple-500 to-purple-600',
      textColor: 'text-white'
    }
  }
  
  if (stats.completionRate === 100) {
    return {
      label: 'Ver Progreso',
      sublabel: 'Equipo al 100%',
      action: 'progress',
      gradient: 'from-emerald-500 to-emerald-600',
      textColor: 'text-white'
    }
  }

  // Algunos completos, algunos no
  return {
    label: 'Revisar Equipo',
    sublabel: `${stats.incompleteCount} pendientes`,
    action: 'complete',
    gradient: 'from-purple-500 to-purple-600',
    textColor: 'text-white'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SEGMENTED RING (Igual que evaluaciones)
// ════════════════════════════════════════════════════════════════════════════

interface SegmentedRingProps {
  total: number
  completed: number
}

const SegmentedRing = memo(function SegmentedRing({ total, completed }: SegmentedRingProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Determinar fase según porcentaje
  const getPhaseInfo = () => {
    if (percentage === 0) return { label: 'INICIO', color: 'text-amber-400' }
    if (percentage < 50) return { label: 'EN PROGRESO', color: 'text-cyan-400' }
    if (percentage < 100) return { label: 'RECTA FINAL', color: 'text-emerald-400' }
    return { label: 'COMPLETADO', color: 'text-emerald-400' }
  }

  const phase = getPhaseInfo()

  return (
    <div className="relative w-[220px] h-[220px] flex items-center justify-center">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="rgba(51, 65, 85, 0.3)"
          strokeWidth="8"
        />
        {/* Progress - Gradiente cyan brillante como evaluaciones */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#goalGaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))'
          }}
        />
        <defs>
          <linearGradient id="goalGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-5xl font-bold text-white tracking-tight"
        >
          {percentage}%
        </motion.div>
        <p className={cn("text-xs font-bold uppercase tracking-wider mt-1", phase.color)}>
          {phase.label}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {completed}/{total} · {total - completed} pendientes
        </p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CTA BUTTON (usa getCTAConfig + PremiumButton)
// ════════════════════════════════════════════════════════════════════════════

interface CTAButtonProps {
  stats: GoalsMissionControlProps['stats']
  pendingCount: number
  onBulkAssignClick: () => void
  onApprovalsClick: () => void
}

const CTAButton = memo(function CTAButton({
  stats,
  pendingCount,
  onBulkAssignClick,
  onApprovalsClick,
}: CTAButtonProps) {
  const config = getCTAConfig(stats, pendingCount)

  const handleClick = () => {
    if (config.action === 'approvals') {
      onApprovalsClick()
    } else {
      onBulkAssignClick()
    }
  }

  const icon = config.action === 'approvals' ? Clock : Target

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {config.sublabel}
      </p>
      <PrimaryButton
        icon={icon}
        iconPosition="right"
        size="lg"
        onClick={handleClick}
      >
        {config.label}
      </PrimaryButton>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD INDICATORS (Sin iconos, estilo evaluaciones)
// ════════════════════════════════════════════════════════════════════════════

interface IndicatorProps {
  label: string
  status: 'ok' | 'warning' | 'alert'
  count: number
}

const StatusIndicator = memo(function StatusIndicator({ label, status, count }: IndicatorProps) {
  const colors = {
    ok: 'text-emerald-400',
    warning: 'text-purple-400', 
    alert: 'text-amber-400'
  }

  const dots = {
    ok: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    warning: 'bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]',
    alert: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
  }

  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
      <div className={cn("w-2 h-2 rounded-full", dots[status])} />
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={cn("text-sm font-bold", colors[status])}>{count}</p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export const GoalsMissionControl = memo(function GoalsMissionControl({
  stats,
  pendingCount,
  statusCounts,
  onBulkAssignClick,
  onApprovalsClick,
}: GoalsMissionControlProps) {
  
  // Calcular totales para el gauge
  const relevantTotal = stats.totalEmployees - stats.noGoalsRequired
  const completados = stats.completedCount

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Título */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Metas de tu Equipo
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {new Date().getFullYear()}
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - Responsive */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">

        {/* Indicators - Solo DESKTOP (izquierda) */}
        <div className="hidden md:flex flex-col gap-2">
          <StatusIndicator 
            label="Sin metas" 
            status="alert" 
            count={statusCounts.empty} 
          />
          <StatusIndicator 
            label="Incompletas" 
            status="warning" 
            count={statusCounts.incomplete} 
          />
          {statusCounts.exceeded > 0 && (
            <StatusIndicator 
              label="Excedidas" 
              status="warning" 
              count={statusCounts.exceeded} 
            />
          )}
        </div>

        {/* GAUGE - Siempre centrado */}
        <SegmentedRing total={relevantTotal} completed={completados} />

        {/* CTA - Solo DESKTOP (derecha) */}
        <div className="hidden md:block">
          <CTAButton
            stats={stats}
            pendingCount={pendingCount}
            onBulkAssignClick={onBulkAssignClick}
            onApprovalsClick={onApprovalsClick}
          />
        </div>
      </div>

      {/* Indicators - Solo MOBILE (debajo, horizontal) */}
      <div className="md:hidden flex flex-wrap justify-center gap-2">
        <StatusIndicator label="Sin metas" status="alert" count={statusCounts.empty} />
        <StatusIndicator label="Incompletas" status="warning" count={statusCounts.incomplete} />
      </div>

      {/* CTA - Solo MOBILE (debajo) */}
      <div className="md:hidden">
        <CTAButton
          stats={stats}
          pendingCount={pendingCount}
          onBulkAssignClick={onBulkAssignClick}
          onApprovalsClick={onApprovalsClick}
        />
      </div>
    </motion.div>
  )
})

export default GoalsMissionControl