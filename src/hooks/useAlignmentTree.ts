// ════════════════════════════════════════════════════════════════════════════
// useAlignmentTree - Hook para el Árbol de Alineación Estratégica
// src/hooks/useAlignmentTree.ts
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

export interface TreeGoal {
  id: string
  title: string
  level: 'COMPANY' | 'AREA' | 'INDIVIDUAL'
  progress: number
  status: string
  isAligned: boolean
  children?: TreeGoal[]
  owner?: { id: string; fullName: string } | null
  department?: { id: string; displayName: string } | null
}

interface AlignmentReport {
  totalGoals: number
  alignedGoals: number
  orphanGoals: number
  alignmentRate: number
  byLevel: { company: number; area: number; individual: number }
  recommendations: string[]
}

interface OrphanGoal {
  id: string
  title: string
  level: string
  progress: number
  status: string
  owner?: { id: string; fullName: string } | null
  department?: { id: string; displayName: string } | null
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useAlignmentTree(periodYear: number = new Date().getFullYear()) {
  const { data: treeData, error: treeError, isLoading: treeLoading, mutate } = useSWR<{
    data: TreeGoal[]
    success: boolean
  }>(
    `/api/goals/alignment-tree?periodYear=${periodYear}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const { data: orphanData, error: orphanError, isLoading: orphanLoading } = useSWR<{
    data: OrphanGoal[]
    count: number
    success: boolean
  }>(
    '/api/goals/orphans',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const { data: reportData } = useSWR<{
    data: AlignmentReport
    success: boolean
  }>(
    '/api/goals/alignment-report',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  return useMemo(() => ({
    tree: treeData?.data ?? [],
    orphans: orphanData?.data ?? [],
    report: reportData?.data ?? null,
    isLoading: treeLoading || orphanLoading,
    isError: !!treeError || !!orphanError,
    refresh: mutate,
  }), [treeData, orphanData, reportData, treeLoading, orphanLoading, treeError, orphanError, mutate])
}
