'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OrgMapResult, GerenciaMapItem } from '@/lib/services/TalentActionService'

interface UseTalentActionsReturn {
  orgMap: OrgMapResult | null
  selectedGerencia: GerenciaMapItem | null
  flaggedGerencias: Set<string>
  userRole: string | null
  loading: boolean
  error: string | null
  selectGerencia: (id: string) => void
  clearSelection: () => void
  refetch: () => Promise<void>
}

export function useTalentActions(): UseTalentActionsReturn {
  const [orgMap, setOrgMap] = useState<OrgMapResult | null>(null)
  const [selectedGerencia, setSelectedGerencia] = useState<GerenciaMapItem | null>(null)
  const [flaggedGerencias, setFlaggedGerencias] = useState<Set<string>>(new Set())
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [orgRes, flagsRes] = await Promise.all([
        fetch('/api/talent-actions/org-map'),
        fetch('/api/talent-actions/checkout')
      ])

      if (!orgRes.ok) {
        if (orgRes.status === 401) throw new Error('Sesion expirada')
        if (orgRes.status === 403) throw new Error('Sin permisos')
        throw new Error(`Error ${orgRes.status}`)
      }

      const orgResult = await orgRes.json()
      if (!orgResult.success) throw new Error(orgResult.error || 'Error desconocido')

      setOrgMap(orgResult.data)
      setUserRole(orgResult.userRole || null)

      // Flags (no critico si falla)
      if (flagsRes.ok) {
        const flagsResult = await flagsRes.json()
        if (flagsResult.success && flagsResult.data?.flaggedGerencias) {
          setFlaggedGerencias(new Set(flagsResult.data.flaggedGerencias))
        }
      }
    } catch (err: any) {
      console.error('[useTalentActions] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectGerencia = useCallback((id: string) => {
    if (!orgMap) return
    const found = orgMap.gerencias.find(g => g.gerenciaId === id) || null
    setSelectedGerencia(found)
  }, [orgMap])

  const clearSelection = useCallback(() => {
    setSelectedGerencia(null)
  }, [])

  return {
    orgMap,
    selectedGerencia,
    flaggedGerencias,
    userRole,
    loading,
    error,
    selectGerencia,
    clearSelection,
    refetch: fetchData
  }
}
