'use client'

// ════════════════════════════════════════════════════════════════════════════
// useWorkforceData — Hook para Workforce Planning Cinema Mode
// Patron clonado de useExecutiveHubData.ts (simplificado: sin ciclos, sin spotlight)
// Fetch unico a /api/workforce/diagnostic → todo para la cascada
// src/app/dashboard/workforce/hooks/useWorkforceData.ts
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import type { WorkforceDiagnosticData, WorkforceView } from '../types/workforce.types'

// ════════════════════════════════════════════════════════════════════════════
// STATE INTERFACE
// ════════════════════════════════════════════════════════════════════════════

export interface WorkforceDataState {
  data: WorkforceDiagnosticData | null
  isLoading: boolean
  error: string | null
  view: WorkforceView
  setView: (view: WorkforceView) => void
  reload: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useWorkforceData(): WorkforceDataState {
  const [data, setData] = useState<WorkforceDiagnosticData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<WorkforceView>('lobby')

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
    if (token) return { 'Authorization': `Bearer ${token}` }
    return {}
  }, [])

  const loadDiagnostic = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workforce/diagnostic', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Error ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        throw new Error(json.error || 'Error desconocido')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error cargando datos'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders])

  // Load on mount
  useEffect(() => {
    loadDiagnostic()
  }, [loadDiagnostic])

  const reload = useCallback(() => {
    loadDiagnostic()
  }, [loadDiagnostic])

  return {
    data,
    isLoading,
    error,
    view,
    setView,
    reload,
  }
}
