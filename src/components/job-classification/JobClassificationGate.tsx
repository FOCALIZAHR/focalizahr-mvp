'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import ClassificationSummary from './ClassificationSummary'
import UnmappedPositionsDrawer from './UnmappedPositionsDrawer'

// ============================================================================
// TYPES
// ============================================================================

interface JobClassificationGateProps {
  mode: 'client' | 'admin'
  accountId?: string
  onComplete: () => void
  onCancel?: () => void
  className?: string
}

interface UnclassifiedPosition {
  position: string
  employeeCount: number
  employeeIds: string[]
  suggestedLevel: string | null
  suggestedAcotado: string | null
  suggestedTrack: string
}

interface ReviewData {
  summary: {
    totalEmployees: number
    classified: number
    unclassified: number
    withAnomalies: number
    classificationRate: number
  }
  byTrack: {
    ejecutivo: number
    manager: number
    colaborador: number
  }
  unclassifiedPositions: UnclassifiedPosition[]
}

// ============================================================================
// SKELETON
// ============================================================================

function ClassificationSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-800/40 border border-white/5 p-8 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-40 h-40 rounded-full bg-slate-700/50" />
        <div className="h-4 w-48 rounded bg-slate-700/50" />
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          <div className="h-24 rounded-xl bg-slate-700/50" />
          <div className="h-24 rounded-xl bg-slate-700/50" />
          <div className="h-24 rounded-xl bg-slate-700/50" />
        </div>
        <div className="h-14 w-full rounded-xl bg-slate-700/50 mt-4" />
      </div>
    </div>
  )
}

// ============================================================================
// CELEBRATION
// ============================================================================

function fireCelebration() {
  const colors = ['#22D3EE', '#A78BFA', '#3B82F6']

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors
  })

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors
    })
  }, 300)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * @deprecated Use JobClassificationCinema instead.
 *
 * This component persists to Employee immediately on each "save" click,
 * causing orphaned data if the user cancels the wizard.
 * JobClassificationCinema uses a draft state pattern with batch persistence.
 *
 * Will be removed in v3.0.0
 */
export default function JobClassificationGate({
  mode,
  accountId,
  onComplete,
  onCancel,
  className
}: JobClassificationGateProps) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      '[DEPRECATED] JobClassificationGate is deprecated. Use JobClassificationCinema instead.'
    )
  }
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDrawer, setShowDrawer] = useState(false)
  const [hasCelebrated, setHasCelebrated] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = mode === 'admin' && accountId
        ? `?accountId=${accountId}`
        : ''
      const res = await fetch(`/api/job-classification/review${params}`)
      const json = await res.json()

      if (json.success) {
        setData({
          summary: json.summary,
          byTrack: json.byTrack,
          unclassifiedPositions: json.data.unclassified
        })

        // Celebration at 100%
        if (json.summary.classificationRate === 100 && !hasCelebrated) {
          setHasCelebrated(true)
          fireCelebration()
        }
      }
    } catch (error) {
      console.error('[JobClassificationGate] Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [mode, accountId, hasCelebrated])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAssignComplete = () => {
    fetchData()
  }

  if (loading) {
    return <ClassificationSkeleton />
  }

  return (
    <div className={className}>
      <ClassificationSummary
        summary={data?.summary ?? null}
        byTrack={data?.byTrack ?? null}
        onResolveClick={() => setShowDrawer(true)}
        onContinue={data?.summary.unclassified === 0 ? onComplete : undefined}
        onCancel={onCancel}
      />

      <AnimatePresence>
        {showDrawer && (
          <UnmappedPositionsDrawer
            positions={data?.unclassifiedPositions ?? []}
            accountId={accountId}
            onClose={() => setShowDrawer(false)}
            onAssignComplete={handleAssignComplete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
