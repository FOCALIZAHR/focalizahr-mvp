// src/hooks/useGoalsHubData.ts
'use client'

import { useMemo } from 'react'
import useSWR from 'swr'

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

interface TeamCoverage {
  total: number
  withGoals: number
  percentage: number
}

export interface GoalSummary {
  id: string
  title: string
  level: string
  progress: number
  status: string
  dueDate: string
  isLeaderGoal: boolean
  currentValue?: number
  targetValue?: number
  unit?: string | null
}

export function useGoalsHubData() {
  const { data: configData } = useSWR('/api/config/goal-eligibility', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })
  const { data: goalsData } = useSWR('/api/goals', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })
  const { data: teamData } = useSWR('/api/goals/team/coverage', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  return useMemo(() => {
    const hasConfiguration = (configData?.data || [])
      .some((c: { hasGoals: boolean }) => c.hasGoals)

    const myGoals: GoalSummary[] = goalsData?.data || []

    const teamCoverage: TeamCoverage = teamData?.data || {
      total: 0,
      withGoals: 0,
      percentage: 0
    }

    const hasDirectReports = teamCoverage.total > 0

    // Determinar estado y CTA
    let state: 'no-config' | 'no-goals' | 'incomplete-team' | 'complete'
    let ctaText: string
    let ctaHref: string
    let message: string

    if (!hasConfiguration) {
      state = 'no-config'
      ctaText = 'Ir a Configuración'
      ctaHref = '/dashboard/metas/configuracion'
      message = 'Configura el sistema de metas para tu organización'
    } else if (myGoals.length === 0) {
      state = 'no-goals'
      ctaText = 'Crear Meta'
      ctaHref = '/dashboard/metas/crear'
      message = 'Crea tu primera meta para empezar'
    } else if (hasDirectReports && teamCoverage.percentage < 100) {
      state = 'incomplete-team'
      ctaText = 'Gestionar Equipo'
      ctaHref = '/dashboard/metas/equipo'
      message = `${teamCoverage.total - teamCoverage.withGoals} colaboradores sin metas asignadas`
    } else {
      state = 'complete'
      ctaText = 'Ver Progreso del Equipo'
      ctaHref = '/dashboard/metas/equipo'
      message = 'Tu equipo está completamente cubierto'
    }

    return {
      teamCoverage,
      myGoals,
      hasConfiguration,
      hasDirectReports,
      state,
      ctaText,
      ctaHref,
      message,
      isLoading: !configData || !goalsData
    }
  }, [configData, goalsData, teamData])
}
