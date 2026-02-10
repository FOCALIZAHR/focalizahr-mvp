'use client'

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD INDICATORS - Testigos LED minimalistas tipo BMW/Tesla
// src/components/performance/DashboardIndicators.tsx
// ════════════════════════════════════════════════════════════════════════════
// Muestran el estado de calibración de la evaluación en vivo
// Clic → navega a /ratings para detalle completo
// ════════════════════════════════════════════════════════════════════════════

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  type EvaluationStatus,
  STATUS_CONFIG,
  requiresAttention,
  getSemanticColorClass
} from '@/lib/utils/evaluatorStatsEngine'

interface DashboardIndicatorsProps {
  edStatus: EvaluationStatus | null
  ptStatus: EvaluationStatus | null
  cycleId: string
}

export function DashboardIndicators({
  edStatus,
  ptStatus,
  cycleId
}: DashboardIndicatorsProps) {
  const router = useRouter()

  if (!edStatus) return null

  const handleClick = () => {
    router.push(`/dashboard/performance/cycles/${cycleId}/ratings`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-center gap-8 py-3 cursor-pointer
        hover:opacity-80 transition-opacity select-none"
      role="button"
      aria-label="Ver detalles de evaluación"
    >
      <StatusIndicator label="ED" status={edStatus} />

      <div className="w-px h-4 bg-white/10" />

      {ptStatus ? (
        <StatusIndicator label="PT" status={ptStatus} />
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">PT</span>
            <span className="text-[10px] font-mono text-slate-600 tracking-wider">—</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS INDICATOR - LED individual
// ════════════════════════════════════════════════════════════════════════════

function StatusIndicator({ label, status }: { label: string; status: EvaluationStatus }) {
  const config = STATUS_CONFIG[status]
  const needsAttention = requiresAttention(status)
  const colorClass = getSemanticColorClass(config.semanticType)

  return (
    <div className="group flex items-center gap-3 relative">
      {/* LED */}
      <div className="relative flex h-2 w-2">
        {needsAttention && (
          <span className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            colorClass.bgPing
          )} />
        )}
        <span className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          colorClass.led
        )} />
      </div>

      {/* Label */}
      <div className="flex flex-col">
        <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase">
          {label}
        </span>
        <span className={cn('text-[10px] font-mono font-medium tracking-wider', colorClass.text)}>
          {config.label}
        </span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-3
        bg-slate-950 border border-slate-800 rounded-xl shadow-2xl
        opacity-0 group-hover:opacity-100 transition-all duration-200
        pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">
        <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1">
          <span className="text-[10px] font-bold text-slate-300 uppercase">
            {config.fullTerm}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {config.tooltip}
        </p>
        <div className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-slate-950" />
      </div>
    </div>
  )
}
