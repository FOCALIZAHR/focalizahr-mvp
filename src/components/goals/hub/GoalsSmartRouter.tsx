// src/components/goals/hub/GoalsSmartRouter.tsx
'use client'

import { useState } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoalsHubData } from '@/hooks/useGoalsHubData'
import type { GoalSummary } from '@/hooks/useGoalsHubData'
import { GoalsMissionControl } from './GoalsMissionControl'
import { GoalsRail } from './GoalsRail'
import { GoalSpotlightCard } from './GoalSpotlightCard'
import { GhostButton } from '@/components/ui/PremiumButton'

export default function GoalsSmartRouter() {
  const router = useRouter()
  const {
    teamCoverage,
    myGoals,
    hasConfiguration,
    state,
    ctaText,
    ctaHref,
    message,
    isLoading,
  } = useGoalsHubData()

  const [selectedGoal, setSelectedGoal] = useState<GoalSummary | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="fhr-text-sm text-slate-400 uppercase tracking-widest mb-2">
            Módulo de Metas
          </p>
          <h1 className="fhr-hero-title">
            <span className="fhr-title-gradient">Mis Metas</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestiona tus metas y las de tu equipo
          </p>
        </div>

        {hasConfiguration && (
          <GhostButton
            icon={Settings}
            onClick={() => router.push('/dashboard/metas/configuracion')}
          >
            Configuración
          </GhostButton>
        )}
      </div>

      <div className="fhr-divider" />

      {/* Vista principal o Landing Card */}
      <AnimatePresence mode="wait">
        {selectedGoal ? (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GoalSpotlightCard
              goal={selectedGoal}
              onBack={() => setSelectedGoal(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Mission Control - Gauge + CTA */}
            <GoalsMissionControl
              percentage={teamCoverage.percentage}
              total={teamCoverage.total}
              withGoals={teamCoverage.withGoals}
              message={message}
              ctaText={ctaText}
              ctaHref={ctaHref}
              state={state}
            />

            {/* Rail de Metas */}
            {myGoals.length > 0 && (
              <GoalsRail goals={myGoals} onGoalClick={setSelectedGoal} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
