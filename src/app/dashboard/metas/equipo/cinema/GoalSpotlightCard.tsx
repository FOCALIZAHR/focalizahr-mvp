// ════════════════════════════════════════════════════════════════════════════
// GOAL SPOTLIGHT CARD - Panel detalle de empleado (Split 35/65)
// src/app/dashboard/metas/equipo/cinema/GoalSpotlightCard.tsx
// 
// BASADO EN: src/components/evaluator/cinema/SpotlightCard.tsx
// SIN emojis, SIN iconos prohibidos
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoals } from '@/hooks/useGoals'
import type { TeamMember } from '@/hooks/useTeamGoals'
import { formatDisplayName } from '@/lib/utils/formatName'
import { GoalsPanelCard } from './GoalsPanelCard'

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface GoalSpotlightCardProps {
  employee: TeamMember
  onBack: () => void
  onCheckIn: (goalId: string) => void
  onAddGoal: () => void
  onCascadeGoal: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS BADGE (igual que evaluaciones)
// ════════════════════════════════════════════════════════════════════════════

interface StatusBadgeProps {
  status: string
  totalWeight: number
}

const StatusBadge = memo(function StatusBadge({ status, totalWeight }: StatusBadgeProps) {
  const config = {
    EMPTY: { label: 'Sin metas', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    INCOMPLETE: { label: `${totalWeight}%`, bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    READY: { label: 'Completo', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    EXCEEDED: { label: `${totalWeight}%`, bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  }[status] || { label: '—', bg: 'bg-slate-700', text: 'text-slate-400', border: 'border-slate-600' }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
      config.bg, config.text, config.border
    )}>
      {config.label}
    </span>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export const GoalSpotlightCard = memo(function GoalSpotlightCard({
  employee,
  onBack,
  onCheckIn,
  onAddGoal,
  onCascadeGoal,
}: GoalSpotlightCardProps) {
  // Fetch metas del empleado
  const { goals } = useGoals({ employeeId: employee.id })

  const { assignmentStatus } = employee
  const status = assignmentStatus?.status || 'EMPTY'
  const totalWeight = assignmentStatus?.totalWeight || 0

  const goalCount = assignmentStatus?.goalCount || 0

  // Calcular progreso ponderado
  const weightedProgress = useMemo(() => {
    if (goals.length === 0) return 0
    const total = goals.reduce((sum, g) => sum + (g.weight || 0), 0)
    if (total === 0) return 0
    const weighted = goals.reduce((sum, g) => sum + (g.progress * (g.weight || 0)), 0)
    return Math.round(weighted / total)
  }, [goals])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden">

        {/* LÍNEA TESLA */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE'
          }}
        />

        {/* Botón Volver */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" />
          Equipo
        </button>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLUMNA IZQUIERDA: Identidad (35%) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[30%] bg-slate-900/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">

          {/* Avatar */}
          <div className="relative mb-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-700 shadow-2xl">
              {getInitials(employee.fullName)}
            </div>

            {/* Badge de estado */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <StatusBadge status={status} totalWeight={totalWeight} />
            </div>
          </div>

          {/* Info */}
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
              {employee.fullName}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {employee.position}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-[200px]">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-white">{goalCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Metas</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-2xl font-bold text-white">{weightedProgress}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Progreso</div>
            </div>
          </div>

          {/* Progress ring mini */}
          <div className="mt-6 w-full max-w-[200px]">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500">Peso asignado</span>
              <span className={cn(
                'font-bold',
                status === 'READY' ? 'text-cyan-400' :
                status === 'EXCEEDED' ? 'text-red-400' :
                'text-slate-300'
              )}>{totalWeight}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  status === 'READY' ? 'bg-cyan-500' :
                  status === 'EXCEEDED' ? 'bg-red-500' :
                  'bg-cyan-500'
                )}
                style={{ width: `${Math.min(100, totalWeight)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* COLUMNA DERECHA: Metas (65%) */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[70%] p-6 flex flex-col bg-gradient-to-br from-[#0F172A] to-[#162032]">
          <GoalsPanelCard
            goals={goals}
            totalWeight={assignmentStatus?.totalWeight || 0}
            isComplete={assignmentStatus?.status === 'READY'}
            employeeName={formatDisplayName(employee.fullName, 'short').split(' ')[0]}
            onAddGoal={onAddGoal}
            onCascadeGoal={onCascadeGoal}
            onGoalClick={onCheckIn}
          />
        </div>
      </div>
    </motion.div>
  )
})

export default GoalSpotlightCard