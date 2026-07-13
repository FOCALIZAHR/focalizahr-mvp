// ════════════════════════════════════════════════════════════════════════════
// useGoalAlerts - Bandeja personal de avisos de metas (campana)
// src/hooks/useGoalAlerts.ts
// ════════════════════════════════════════════════════════════════════════════
// Consume GET /api/goals/alerts (self-contained: title/body/context, sin join).
// Marca leído vía PATCH /api/goals/alerts/[id] con mutación optimista.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useToast } from '@/components/ui/toast-system'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS (self-contained — el texto se arma sin el join a Goal)
// ════════════════════════════════════════════════════════════════════════════

export type GoalAlertType = 'GOAL_ASSIGNED' | 'CLOSURE_APPROVED' | 'CLOSURE_REJECTED'

export interface GoalAlertContext {
  actorName?: string | null
  reason?: string | null
  notes?: string | null
}

export interface GoalAlert {
  id: string
  type: GoalAlertType
  title: string
  body: string | null
  context: GoalAlertContext | null
  readAt: string | null
  createdAt: string
  goalId: string
}

interface GoalAlertsResponse {
  success: boolean
  data: GoalAlert[]
  unreadCount: number
  pagination: { page: number; limit: number; total: number; pages: number }
}

// ════════════════════════════════════════════════════════════════════════════
// FETCH (patrón del dominio: Bearer desde localStorage + cookie HttpOnly)
// ════════════════════════════════════════════════════════════════════════════

const fetcher = (url: string): Promise<GoalAlertsResponse> => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  }).then(res => {
    if (!res.ok) throw new Error(`Error ${res.status}`)
    return res.json()
  })
}

function patchRead(id: string): Promise<Response> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null
  return fetch(`/api/goals/alerts/${id}`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  })
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useGoalAlerts() {
  const toast = useToast()
  const { data, error, isLoading, mutate } = useSWR<GoalAlertsResponse>(
    '/api/goals/alerts',
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: true, dedupingInterval: 30000 }
  )

  const markAsRead = useCallback(async (id: string) => {
    const target = data?.data.find(a => a.id === id)
    if (!target || target.readAt) return // ya leída o inexistente

    const now = new Date().toISOString()
    // Optimista: marca la fila leída y baja el contador al instante
    mutate(prev => prev && {
      ...prev,
      data: prev.data.map(a => (a.id === id ? { ...a, readAt: now } : a)),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }, { revalidate: false })

    try {
      const res = await patchRead(id)
      if (!res.ok) throw new Error(`Error ${res.status}`)
    } catch {
      toast.error('No se pudo marcar el aviso como leído')
      mutate() // revalida contra el servidor (revierte)
    }
  }, [data, mutate, toast])

  const markAllAsRead = useCallback(async () => {
    const unread = (data?.data ?? []).filter(a => !a.readAt)
    if (unread.length === 0) return

    const now = new Date().toISOString()
    mutate(prev => prev && {
      ...prev,
      data: prev.data.map(a => (a.readAt ? a : { ...a, readAt: now })),
      unreadCount: 0,
    }, { revalidate: false })

    try {
      await Promise.all(unread.map(async a => {
        const res = await patchRead(a.id)
        if (!res.ok) throw new Error(`Error ${res.status}`)
      }))
    } catch {
      toast.error('No se pudieron marcar todos los avisos')
      mutate()
    }
  }, [data, mutate, toast])

  return useMemo(() => ({
    alerts: data?.data ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    isError: !!error,
    error,
    markAsRead,
    markAllAsRead,
    refresh: mutate,
  }), [data, isLoading, error, markAsRead, markAllAsRead, mutate])
}
