// ════════════════════════════════════════════════════════════════════════════
// useGoalDetail - Hook de detalle de meta individual
// src/hooks/useGoalDetail.ts
// ════════════════════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { useMemo, useCallback } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// FETCHER (con auth token)
// ════════════════════════════════════════════════════════════════════════════

const fetcher = (url: string) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null
  return fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error(`Error ${res.status}`)
    return res.json()
  })
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'
type GoalMetricType = 'PERCENTAGE' | 'CURRENCY' | 'NUMBER' | 'BINARY'

interface ProgressUpdate {
  id: string
  previousValue: number
  newValue: number
  previousProgress: number
  newProgress: number
  comment?: string | null
  createdAt: string
  updatedById: string
}

interface GoalChild {
  id: string
  title: string
  level: GoalLevel
  progress: number
  status: GoalStatus
  owner?: { id: string; fullName: string } | null
}

interface GoalDetailData {
  id: string
  title: string
  description?: string | null
  level: GoalLevel
  status: GoalStatus
  progress: number
  currentValue: number
  targetValue: number
  startValue: number
  unit?: string | null
  metricType: GoalMetricType
  dueDate: string
  startDate: string
  isAligned: boolean
  isOrphan: boolean
  weight: number
  parent?: { id: string; title: string; level?: GoalLevel; progress?: number } | null
  children?: GoalChild[]
  owner?: { id: string; fullName: string; position?: string | null; email?: string | null } | null
  department?: { id: string; displayName: string } | null
  progressUpdates?: ProgressUpdate[]
  linkedDevGoal?: { id: string; title: string; planId?: string | null } | null
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useGoalDetail(id: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    data: GoalDetailData
    success: boolean
  }>(
    id ? `/api/goals/${id}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 15000 }
  )

  const checkIn = useCallback(async (
    currentValue: number,
    comment?: string
  ) => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('focalizahr_token')
      : null

    const res = await fetch(`/api/goals/${id}/check-in`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ currentValue, comment }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error actualizando progreso')
    }

    mutate()
    return res.json()
  }, [id, mutate])

  return useMemo(() => ({
    goal: data?.data ?? null,
    isLoading,
    isError: !!error,
    error,
    checkIn,
    refresh: mutate,
  }), [data?.data, isLoading, error, checkIn, mutate])
}

// Re-export types
export type { GoalDetailData, GoalChild, ProgressUpdate, GoalLevel, GoalStatus, GoalMetricType }
