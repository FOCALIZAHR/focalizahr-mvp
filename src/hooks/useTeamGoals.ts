// ════════════════════════════════════════════════════════════════════════════
// useTeamGoals - Hook para dashboard de metas del equipo
// src/hooks/useTeamGoals.ts
// ════════════════════════════════════════════════════════════════════════════

import useSWR from 'swr'
import { useMemo, useCallback, useState } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// FETCHER
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

export interface TeamMember {
  id: string
  fullName: string
  position: string
  departmentId: string
  goalsCount: number
  avgProgress: number
  hasGoalsConfigured: boolean
}

export interface TeamStats {
  total: number
  withGoals: number
  withoutGoals: number
  noGoalsRequired: number
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useTeamGoals() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, error, isLoading, mutate } = useSWR<{
    data: TeamMember[]
    stats: TeamStats
    success: boolean
  }>(
    '/api/goals/team',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectAll = useCallback(() => {
    if (data?.data) {
      const selectableIds = data.data
        .filter((m: TeamMember) => m.hasGoalsConfigured)
        .map((m: TeamMember) => m.id)
      setSelectedIds(new Set(selectableIds))
    }
  }, [data])

  return useMemo(() => ({
    team: (data?.data ?? []) as TeamMember[],
    stats: (data?.stats ?? { total: 0, withGoals: 0, withoutGoals: 0, noGoalsRequired: 0 }) as TeamStats,
    isLoading,
    isError: !!error,
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelection,
    clearSelection,
    selectAll,
    refresh: mutate,
  }), [data, isLoading, error, selectedIds, toggleSelection, clearSelection, selectAll, mutate])
}
