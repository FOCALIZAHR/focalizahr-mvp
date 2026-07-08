// src/components/goals/cycles/useCycleClosure.ts
// ════════════════════════════════════════════════════════════════════════════
// Hook del modal de cierre (Gate D.5-UI): trae las metas del ciclo y las separa
// en accionables (a decidir) e inReview (PENDING_CLOSURE, contexto read-only).
//
// GET /api/goals?goalCycleId={id} (default: status notIn COMPLETED/CANCELLED →
// devuelve accionables ∪ inReview, con filtrado jerárquico RBAC). El split final
// lo hace splitClosureGoals (cycleClosure.ts, fuente única con el server).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useCallback, useEffect, useState } from 'react'
import { ClosureGoal, splitClosureGoals } from './cycleClosure'

interface UseCycleClosureResult {
  actionable: ClosureGoal[]
  inReview: ClosureGoal[]
  loading: boolean
  error: boolean
  refetch: () => Promise<void>
}

export function useCycleClosure(cycleId: string | null): UseCycleClosureResult {
  const [actionable, setActionable] = useState<ClosureGoal[]>([])
  const [inReview, setInReview] = useState<ClosureGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const refetch = useCallback(async () => {
    if (!cycleId) return
    setLoading(true)
    setError(false)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('focalizahr_token')
          : null

      const res = await fetch(`/api/goals?goalCycleId=${cycleId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)

      const json = await res.json()
      const goals: ClosureGoal[] = json.data ?? []
      const split = splitClosureGoals(goals)
      setActionable(split.actionable)
      setInReview(split.inReview)
    } catch {
      setError(true)
      setActionable([])
      setInReview([])
    } finally {
      setLoading(false)
    }
  }, [cycleId])

  useEffect(() => {
    if (cycleId) refetch()
  }, [cycleId, refetch])

  return { actionable, inReview, loading, error, refetch }
}
