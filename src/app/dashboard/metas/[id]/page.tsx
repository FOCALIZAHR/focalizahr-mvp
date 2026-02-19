// ════════════════════════════════════════════════════════════════════════════
// GOAL DETAIL PAGE - Detalle de meta individual
// src/app/dashboard/metas/[id]/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { GhostButton } from '@/components/ui/PremiumButton'
import { useGoalDetail } from '@/hooks/useGoalDetail'
import GoalDetailHeader from '@/components/goals/GoalDetailHeader'
import GoalProgressTimeline from '@/components/goals/GoalProgressTimeline'
import GoalCheckInModal from '@/components/goals/GoalCheckInModal'
import GoalChildrenList from '@/components/goals/GoalChildrenList'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function GoalDetailPage() {
  const params = useParams()
  const goalId = params.id as string

  const { goal, isLoading, isError, checkIn, refresh } = useGoalDetail(goalId)
  const [showCheckIn, setShowCheckIn] = useState(false)

  const handleCheckIn = useCallback(
    async (value: number, comment?: string) => {
      await checkIn(value, comment)
    },
    [checkIn]
  )

  const handleOpenCheckIn = useCallback(() => {
    setShowCheckIn(true)
  }, [])

  const handleCloseCheckIn = useCallback(() => {
    setShowCheckIn(false)
  }, [])

  // ══════════════════════════════════════════════════════════════════════════
  // Loading
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="fhr-bg-main min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="fhr-skeleton h-8 w-32 rounded-lg" />
          <div className="fhr-card space-y-4">
            <div className="fhr-skeleton h-6 w-24 rounded-lg" />
            <div className="fhr-skeleton h-10 w-3/4 rounded-lg" />
            <div className="fhr-skeleton h-4 w-full rounded-lg" />
            <div className="fhr-skeleton h-16 w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="fhr-card">
              <div className="fhr-skeleton h-6 w-40 mb-4 rounded-lg" />
              <div className="space-y-3">
                <div className="fhr-skeleton h-16 w-full rounded-lg" />
                <div className="fhr-skeleton h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Error
  // ══════════════════════════════════════════════════════════════════════════

  if (isError || !goal) {
    return (
      <div className="fhr-bg-main min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="fhr-card text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="fhr-title-card text-white mb-2">Meta no encontrada</h2>
            <p className="fhr-text text-slate-400 mb-6">
              No pudimos cargar los detalles de esta meta. Revisa tu conexión y reintenta.
            </p>
            <GhostButton icon={RefreshCw} onClick={() => refresh()}>
              Reintentar
            </GhostButton>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <GoalDetailHeader goal={goal} onCheckIn={handleOpenCheckIn} />

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <GoalProgressTimeline
            updates={goal.progressUpdates || []}
            unit={goal.unit}
          />

          {/* Metas hijas */}
          {goal.children && goal.children.length > 0 && (
            <GoalChildrenList children={goal.children} />
          )}
        </div>

        {/* Modal Check-in */}
        <GoalCheckInModal
          isOpen={showCheckIn}
          onClose={handleCloseCheckIn}
          onSubmit={handleCheckIn}
          goal={goal}
        />
      </div>
    </div>
  )
}
