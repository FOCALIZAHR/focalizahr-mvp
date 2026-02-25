// src/components/goals/hub/GoalSpotlightCard.tsx
'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Target, Calendar, TrendingUp, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import type { GoalSummary } from '@/hooks/useGoalsHubData'

interface GoalSpotlightCardProps {
  goal: GoalSummary
  onBack: () => void
}

export const GoalSpotlightCard = memo(function GoalSpotlightCard({
  goal,
  onBack,
}: GoalSpotlightCardProps) {
  const router = useRouter()

  // Calcular días restantes
  const daysLeft = Math.ceil(
    (new Date(goal.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  // Mensaje de coaching según estado
  const getCoachingMessage = () => {
    if (goal.progress >= 100) {
      return 'Has alcanzado tu meta. Considera solicitar el cierre.'
    }
    if (daysLeft < 7 && goal.progress < 80) {
      return 'Quedan pocos días y el progreso está bajo. Registra un avance ahora.'
    }
    if (goal.progress >= 80) {
      return 'Estás muy cerca de lograrlo. Un último esfuerzo.'
    }
    return 'Mantén tu ritmo y registra avances semanalmente.'
  }

  const levelLabel =
    goal.level === 'COMPANY'
      ? 'Corporativa'
      : goal.level === 'AREA'
        ? 'de Área'
        : 'Individual'

  const levelColor =
    goal.level === 'COMPANY'
      ? 'text-amber-400'
      : goal.level === 'AREA'
        ? 'text-purple-400'
        : 'text-cyan-400'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
    >
      <div className="fhr-card p-6 space-y-6 relative overflow-hidden">
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE',
          }}
        />

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Target className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl text-white font-medium">{goal.title}</h2>
            <span className={`text-sm ${levelColor}`}>Meta {levelLabel}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(goal.progress, 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white font-medium">
              {Math.round(goal.progress)}% completado
            </span>
            {goal.currentValue !== undefined && goal.targetValue !== undefined && (
              <span className="text-slate-400">
                {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Vencimiento
            </div>
            <p className="text-white">
              {new Date(goal.dueDate).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Tiempo restante
            </div>
            <p
              className={`font-medium ${
                daysLeft < 7
                  ? 'text-red-400'
                  : daysLeft < 30
                    ? 'text-amber-400'
                    : 'text-white'
              }`}
            >
              {daysLeft > 0 ? `${daysLeft} días` : 'Vencida'}
            </p>
          </div>
        </div>

        {/* Coaching message */}
        <div className="p-4 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-lg">
          <p className="text-sm text-slate-300">
            <span className="text-cyan-400 font-medium">Sugerencia:</span>{' '}
            {getCoachingMessage()}
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <PrimaryButton
            icon={TrendingUp}
            onClick={() => router.push(`/dashboard/metas/${goal.id}`)}
          >
            Registrar Avance
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  )
})
