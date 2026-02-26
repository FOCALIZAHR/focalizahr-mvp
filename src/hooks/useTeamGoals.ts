// ════════════════════════════════════════════════════════════════════════════
// useTeamGoals - Hook para dashboard de metas del equipo
// src/hooks/useTeamGoals.ts
// 
// ACTUALIZADO: Nuevos campos de teamStats del backend (averageWeight, etc.)
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

export type AssignmentStatusType = 'EMPTY' | 'INCOMPLETE' | 'READY' | 'EXCEEDED'

export interface AssignmentStatus {
  totalWeight: number
  goalCount: number
  maxGoals: number
  status: AssignmentStatusType
  isComplete: boolean
}

export interface TeamMember {
  id: string
  fullName: string
  position: string
  departmentId: string | null
  goalsCount: number
  avgProgress: number
  hasGoalsConfigured: boolean
  hasDirectReports: boolean
  assignmentStatus: AssignmentStatus
}

// ACTUALIZADO: Nuevos campos del backend
export interface TeamStats {
  // Campos originales (compatibilidad)
  total: number
  withGoals: number
  withoutGoals: number
  noGoalsRequired: number
  
  // NUEVOS: Del backend actualizado
  totalEmployees: number
  averageWeight: number      // Promedio asignación (0-100+)
  completedCount: number     // Cuántos en 100%
  incompleteCount: number    // Cuántos en 1-99%
  emptyCount: number         // Cuántos en 0%
  exceededCount: number      // Cuántos exceden 100%
  completionRate: number     // % del equipo completo
}

export interface StatusCounts {
  all: number
  empty: number
  incomplete: number
  ready: number
  exceeded: number
  noGoalsRequired: number
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useTeamGoals() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, error, isLoading, mutate } = useSWR<{
    data: TeamMember[]
    stats: { total: number; withGoals: number; withoutGoals: number; noGoalsRequired: number }
    teamStats: { totalEmployees: number; averageWeight: number; completedCount: number; incompleteCount: number; emptyCount: number; exceededCount: number; completionRate: number }
    success: boolean
  }>(
    '/api/goals/team',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  // ══════════════════════════════════════════════════════════════════════════
  // SELECTION HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const team = useMemo(() => data?.data ?? [], [data])
  
  // Stats: combina stats + teamStats del backend
  const stats = useMemo((): TeamStats => {
    return {
      total: 0, withGoals: 0, withoutGoals: 0, noGoalsRequired: 0,
      totalEmployees: 0, averageWeight: 0, completedCount: 0,
      incompleteCount: 0, emptyCount: 0, exceededCount: 0, completionRate: 0,
      ...data?.stats,
      ...data?.teamStats,
    }
  }, [data])

  // Siguiente empleado para CTA (prioridad: vacíos, luego incompletos)
  const nextEmployee = useMemo(() => {
    const empty = team.find(m => 
      m.hasGoalsConfigured && m.assignmentStatus?.status === 'EMPTY'
    )
    if (empty) return { id: empty.id, name: empty.fullName }
    
    const incomplete = team.find(m => 
      m.hasGoalsConfigured && m.assignmentStatus?.status === 'INCOMPLETE'
    )
    if (incomplete) return { id: incomplete.id, name: incomplete.fullName }
    
    return null
  }, [team])

  // Contadores por status para tabs del Rail
  const statusCounts = useMemo((): StatusCounts => {
    return {
      all: team.filter(m => m.hasGoalsConfigured).length,
      empty: team.filter(m => m.hasGoalsConfigured && m.assignmentStatus?.status === 'EMPTY').length,
      incomplete: team.filter(m => m.assignmentStatus?.status === 'INCOMPLETE').length,
      ready: team.filter(m => m.assignmentStatus?.status === 'READY').length,
      exceeded: team.filter(m => m.assignmentStatus?.status === 'EXCEEDED').length,
      noGoalsRequired: team.filter(m => !m.hasGoalsConfigured).length,
    }
  }, [team])

  // Empleados que necesitan asignación (para BulkAssignWizard)
  const employeesNeedingAssignment = useMemo(() => {
    return team.filter(m => 
      m.hasGoalsConfigured && 
      (m.assignmentStatus?.status === 'EMPTY' || m.assignmentStatus?.status === 'INCOMPLETE')
    )
  }, [team])

  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════

  return useMemo(() => ({
    // Data
    team,
    stats,
    isLoading,
    isError: !!error,
    
    // Selection
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelection,
    clearSelection,
    selectAll,
    
    // Cinema Mode helpers
    nextEmployee,
    statusCounts,
    employeesNeedingAssignment,
    
    // Actions
    refresh: mutate,
  }), [
    team, 
    stats, 
    isLoading, 
    error, 
    selectedIds, 
    toggleSelection, 
    clearSelection, 
    selectAll, 
    nextEmployee,
    statusCounts,
    employeesNeedingAssignment,
    mutate
  ])
}