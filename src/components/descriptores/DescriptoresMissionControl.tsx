'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTORES MISSION CONTROL — Clonado de MissionControl.tsx
// LOBBY: SegmentedRing + CTA único + indicadores pendiente/confirmado
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Map, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { DescriptorSummary, PositionWithStatus } from '@/lib/services/JobDescriptorService'

// ── Segmented Ring (reuse from cinema, adapted inline) ──

function DescriptorRing({ total, completed }: { total: number; completed: number }) {
  const size = 280
  const strokeWidth = 10
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const pending = total - completed

  const color = percentage >= 100 ? '#10B981' : percentage >= 60 ? '#22D3EE' : percentage >= 30 ? '#A78BFA' : '#22D3EE'
  const insight = percentage === 0 ? 'Sin iniciar' : percentage < 50 ? 'En progreso' : percentage < 100 ? 'Recta final' : 'Misión cumplida'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full blur-[60px]"
        style={{ width: size * 0.6, height: size * 0.6, backgroundColor: color, opacity: 0.08 }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(71,85,105,0.3)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          style={{ strokeDasharray: circumference, filter: `drop-shadow(0 0 6px ${color})` }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-7xl font-black text-white tracking-tighter font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-xs font-bold tracking-[0.2em] uppercase mt-2" style={{ color }}>
          {insight}
        </span>
        <span className="text-xs text-slate-500 font-mono mt-1">
          {completed}/{total} · {pending} pendiente{pending !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

// ── Dashboard Indicators (LED style — clonado de DashboardIndicators) ──

function DescriptorLED({
  label, value, color, ping,
}: {
  label: string; value: number; color: string; ping: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      {/* LED dot */}
      <div className="relative flex h-2 w-2">
        {ping && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ backgroundColor: color }}
        />
      </div>
      {/* Label */}
      <div className="flex flex-col">
        <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
          {label}
        </span>
        <span className="text-[10px] font-mono font-medium tracking-wider" style={{ color }}>
          {value} cargo{value !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

function DescriptorIndicators({ summary, layout }: { summary: DescriptorSummary; layout: 'vertical' | 'horizontal' }) {
  return (
    <div className={cn(
      'flex items-center justify-center py-3',
      layout === 'vertical' ? 'flex-col gap-4' : 'gap-8'
    )}>
      <DescriptorLED
        label="Pendientes"
        value={summary.pending}
        color="#F59E0B"
        ping={summary.pending > 0}
      />

      <div className={cn(
        'bg-white/10',
        layout === 'vertical' ? 'h-px w-8' : 'w-px h-4'
      )} />

      <DescriptorLED
        label="Confirmados"
        value={summary.confirmed}
        color="#10B981"
        ping={false}
      />
    </div>
  )
}

// ── CTA Button ──

function CTAButton({
  nextJob,
  allDone,
  onStart,
}: {
  nextJob: PositionWithStatus | null
  allDone: boolean
  onStart: (jobTitle: string) => void
}) {
  if (allDone) {
    return (
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        <div>
          <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-300 opacity-70">
            Completado
          </span>
          <span className="block text-sm font-bold text-white leading-tight">
            Todos los cargos validados
          </span>
        </div>
      </div>
    )
  }

  if (!nextJob) return null

  return (
    <motion.button
      onClick={() => onStart(nextJob.jobTitle)}
      className={cn(
        'group relative flex items-center rounded-xl transition-all transform hover:-translate-y-0.5',
        'gap-4 pl-5 pr-2 py-2',
        'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
        'text-slate-950 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-left">
        <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-700 opacity-70">
          Siguiente
        </span>
        <span className="block text-sm font-bold leading-tight">
          {formatDisplayName(nextJob.jobTitle, 'full')}
        </span>
        <span className="block text-[9px] text-slate-700/60 mt-0.5">
          {nextJob.employeeCount} persona{nextJob.employeeCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
        <ArrowRight className="w-4 h-4" />
      </div>
    </motion.button>
  )
}

// ── Explorar Button ──

function ExplorarButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push('/dashboard/descriptores/explorar')}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all text-xs font-medium"
    >
      <Map className="w-3.5 h-3.5" />
      Explorar organización
    </button>
  )
}

// ── Configurar Button (Pre-mapeo, solo HR) ──

function ConfigurarButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push('/dashboard/descriptores/configuracion')}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white hover:border-purple-500/30 transition-all text-xs font-medium"
    >
      <Settings2 className="w-3.5 h-3.5" />
      Pre-mapeo
    </button>
  )
}

// ── Main Component ──

interface DescriptoresMissionControlProps {
  summary: DescriptorSummary
  positions: PositionWithStatus[]
  onStart: (jobTitle: string) => void
}

export default function DescriptoresMissionControl({
  summary,
  positions,
  onStart,
}: DescriptoresMissionControlProps) {
  const pending = positions
    .filter(p => p.descriptorStatus === 'NONE')
    .sort((a, b) => b.employeeCount - a.employeeCount)

  const nextJob = pending[0] ?? null
  const allDone = summary.totalPositions > 0 && summary.pending === 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Descriptores <span className="fhr-title-gradient">Inteligentes</span>
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {summary.totalEmployees} personas · {summary.totalPositions} cargos
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL — Responsive */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">

        {/* Indicators — solo desktop (izquierda) */}
        <div className="hidden md:block">
          <DescriptorIndicators summary={summary} layout="vertical" />
        </div>

        {/* GAUGE — siempre centrado */}
        <DescriptorRing total={summary.totalPositions} completed={summary.confirmed} />

        {/* CTA — solo desktop (derecha) */}
        <div className="hidden md:block">
          <CTAButton nextJob={nextJob} allDone={allDone} onStart={onStart} />
        </div>
      </div>

      {/* Indicators — solo mobile */}
      <div className="md:hidden">
        <DescriptorIndicators summary={summary} layout="horizontal" />
      </div>

      {/* CTA — solo mobile */}
      <div className="md:hidden">
        <CTAButton nextJob={nextJob} allDone={allDone} onStart={onStart} />
      </div>

      {/* Acciones secundarias */}
      <div className="flex items-center gap-3">
        {summary.confirmed > 0 && <ExplorarButton />}
        <ConfigurarButton />
      </div>
    </motion.div>
  )
}
