// ════════════════════════════════════════════════════════════════════════════
// useGoals - Hook de datos para módulo de Metas
// src/hooks/useGoals.ts
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import useSWR from 'swr'

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

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type GoalStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'CANCELLED'

interface GoalData {
  id: string
  title: string
  description?: string | null
  level: GoalLevel
  status: GoalStatus
  progress: number
  dueDate: string
  startDate: string
  isAligned: boolean
  isOrphan: boolean
  targetValue: number
  currentValue: number
  weight: number
  owner?: { id: string; fullName: string; position?: string | null } | null
  department?: { id: string; displayName: string } | null
  parent?: { id: string; title: string; level?: GoalLevel } | null
  _count?: { children: number }
}

interface AlignmentReport {
  totalGoals: number
  alignedGoals: number
  orphanGoals: number
  alignmentRate: number
  byLevel: { company: number; area: number; individual: number }
  recommendations: string[]
}

interface GoalsFilters {
  level?: GoalLevel
  status?: GoalStatus
  employeeId?: string
  departmentId?: string
  periodYear?: number
  includeCompleted?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function useGoals(filters: GoalsFilters = {}) {
  // Construir query string
  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.level) params.set('level', filters.level)
    if (filters.status) params.set('status', filters.status)
    if (filters.employeeId) params.set('employeeId', filters.employeeId)
    if (filters.departmentId) params.set('departmentId', filters.departmentId)
    if (filters.periodYear) params.set('periodYear', String(filters.periodYear))
    if (filters.includeCompleted) params.set('includeCompleted', 'true')
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }, [filters.level, filters.status, filters.employeeId, filters.departmentId, filters.periodYear, filters.includeCompleted])

  const { data, error, isLoading, mutate } = useSWR<{
    data: GoalData[]
    count: number
    success: boolean
  }>(
    `/api/goals${queryString}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  return useMemo(() => ({
    goals: data?.data ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
    mutate,
  }), [data?.data, data?.count, isLoading, error, mutate])
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK REPORTE ALINEACIÓN
// ════════════════════════════════════════════════════════════════════════════

export function useAlignmentReport() {
  const { data, error, isLoading } = useSWR<{
    data: AlignmentReport
    success: boolean
  }>(
    '/api/goals/alignment-report',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  return useMemo(() => ({
    report: data?.data ?? null,
    isLoading,
    error,
  }), [data?.data, isLoading, error])
}

// Re-export types para consumidores
export type { GoalData, AlignmentReport, GoalsFilters, GoalLevel, GoalStatus }
