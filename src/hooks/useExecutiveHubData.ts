// ════════════════════════════════════════════════════════════════════════════
// useExecutiveHubData - Hook para Executive Hub Cinema Mode
// src/hooks/useExecutiveHubData.ts
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type InsightType = 'alertas' | 'talento' | 'calibracion' | 'capacidades' | 'sucesion' | 'pl-talento' | 'metas'

export interface ExecutiveNarrative {
  headline: string
  subheadline: string
  level: string | null
  cta: { label: string; destination: string }
  severity: 'ok' | 'warning' | 'critical'
}

export interface SummaryData {
  mission: ExecutiveNarrative
  companyName: string
  alertas: { total: number; critical: number; high: number }
  talento: { starsPercent: number; totalEmployees: number }
  calibracion: { confidence: number; biasType: string | null; biasLabel: string | null; integrityLevel: string; worstStatus: string | null; worstStatusLabel: string | null }
  capacidades: { roleFit: number; worstLayer: string; worstGerencia: string; worstCellCount: number; worstCellScore: number }
  sucesion: { coverage: number; uncoveredCount: number }
  plTalento: { totalGapMonthly: number; underperformerCount: number; totalLiability: number }
  metas: { coverage: number; avgProgress: number; disconnectionRate: number; totalWithGoals: number; totalEmployees: number; urgentCases: number; topNarrativeType: string | null; estimatedRisk: number }
}

export interface ExecutiveHubState {
  // Data
  summary: SummaryData | null
  spotlightData: any | null
  activeInsight: InsightType | null

  // Cycle
  cycleId: string | null
  cycleName: string | null
  cycles: Array<{ id: string; name: string }>

  // User
  userRole: string | null

  // Drill-down
  drillGerencia: string | null

  // UI State
  isLoading: boolean
  isSpotlightLoading: boolean
  error: string | null

  // Actions
  selectInsight: (type: InsightType) => void
  closeSpotlight: () => void
  changeCycle: (cycleId: string) => void
  selectGerencia: (gerencia: string) => void
  clearGerencia: () => void
  reload: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useExecutiveHubData(): ExecutiveHubState {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [spotlightData, setSpotlightData] = useState<any | null>(null)
  const [activeInsight, setActiveInsight] = useState<InsightType | null>(null)
  const [cycleId, setCycleId] = useState<string | null>(null)
  const [cycleName, setCycleName] = useState<string | null>(null)
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [drillGerencia, setDrillGerencia] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSpotlightLoading, setIsSpotlightLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null
    if (token) return { 'Authorization': `Bearer ${token}` }
    return {}
  }, [])

  // Build query params with optional gerencia filter
  const buildParams = useCallback((cId: string, gerencia?: string | null, endpoint?: string) => {
    const params = new URLSearchParams({ cycleId: cId })
    if (gerencia) {
      // capabilities uses 'gerenciaFilter' because 'gerencia' is for cell drill-down
      const key = endpoint === 'capabilities' ? 'gerenciaFilter' : 'gerencia'
      params.set(key, gerencia)
    }
    return params.toString()
  }, [])

  // Load cycles on mount
  useEffect(() => {
    async function loadCycles() {
      try {
        const res = await fetch('/api/admin/performance-cycles', {
          headers: getAuthHeaders()
        })
        if (!res.ok) throw new Error('Error cargando ciclos')
        const json = await res.json()
        const cycleList = (json.data || json.cycles || []).map((c: any) => ({
          id: c.id,
          name: c.name
        }))
        setCycles(cycleList)

        // Auto-select first cycle
        if (cycleList.length > 0) {
          setCycleId(cycleList[0].id)
          setCycleName(cycleList[0].name)
        } else {
          setIsLoading(false)
        }
      } catch (err: any) {
        setError(err.message)
        setIsLoading(false)
      }
    }
    loadCycles()
  }, [getAuthHeaders])

  // Load summary when cycleId or drillGerencia changes
  const loadSummary = useCallback(async (cId: string, gerencia?: string | null) => {
    setIsLoading(true)
    setError(null)
    try {
      const qs = buildParams(cId, gerencia)
      const res = await fetch(`/api/executive-hub/summary?${qs}`, {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Error cargando datos ejecutivos')
      const json = await res.json()
      if (json.success) {
        setSummary(json.data)
        if (json.data.userRole) setUserRole(json.data.userRole)
      } else {
        throw new Error(json.error || 'Error desconocido')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders, buildParams])

  useEffect(() => {
    if (cycleId) loadSummary(cycleId, drillGerencia)
  }, [cycleId, drillGerencia, loadSummary])

  // Load spotlight detail
  const selectInsight = useCallback(async (type: InsightType) => {
    if (!cycleId) return
    setActiveInsight(type)
    setIsSpotlightLoading(true)
    setSpotlightData(null)

    const endpointMap: Record<InsightType, string> = {
      alertas: 'alerts',
      talento: 'talent',
      calibracion: 'calibration',
      capacidades: 'capabilities',
      sucesion: 'succession',
      'pl-talento': 'pl-talent',
      'metas': 'goals-correlation'
    }

    try {
      const endpoint = endpointMap[type]
      const qs = buildParams(cycleId, drillGerencia, endpoint)

      if (type === 'pl-talento') {
        // Fetch pl-talent + risk-profiles en paralelo
        const [plRes, rpRes] = await Promise.all([
          fetch(`/api/executive-hub/pl-talent?${qs}`, { headers: getAuthHeaders() }),
          fetch(`/api/executive-hub/pl-talent/risk-profiles?${qs}`, { headers: getAuthHeaders() })
            .catch((err) => {
              console.error('[risk-profiles] fetch failed:', err)
              return null
            }),
        ])
        if (!plRes.ok) throw new Error('Error cargando detalle')
        const plJson = await plRes.json()
        let riskData = null
        if (!rpRes?.ok) {
          console.error('[risk-profiles] response not ok:', rpRes?.status, rpRes?.statusText)
        }
        if (rpRes?.ok) {
          const rpJson = await rpRes.json()
          if (rpJson.success) riskData = rpJson.data
        }
        if (plJson.success) {
          setSpotlightData({ ...plJson.data, riskProfiles: riskData })
        }
      } else {
        const res = await fetch(`/api/executive-hub/${endpoint}?${qs}`, {
          headers: getAuthHeaders()
        })
        if (!res.ok) throw new Error('Error cargando detalle')
        const json = await res.json()
        if (json.success) {
          setSpotlightData(json.data)
        }
      }
    } catch (err) {
      console.error(`[ExecutiveHub] Error loading ${type}:`, err)
    } finally {
      setIsSpotlightLoading(false)
    }
  }, [cycleId, drillGerencia, getAuthHeaders, buildParams])

  const closeSpotlight = useCallback(() => {
    setActiveInsight(null)
    setSpotlightData(null)
  }, [])

  const changeCycle = useCallback((newCycleId: string) => {
    const found = cycles.find(c => c.id === newCycleId)
    if (found) {
      setCycleId(found.id)
      setCycleName(found.name)
      setActiveInsight(null)
      setSpotlightData(null)
      setDrillGerencia(null)
    }
  }, [cycles])

  const selectGerencia = useCallback((gerencia: string) => {
    setDrillGerencia(gerencia)
    setActiveInsight(null)
    setSpotlightData(null)
  }, [])

  const clearGerencia = useCallback(() => {
    setDrillGerencia(null)
    setActiveInsight(null)
    setSpotlightData(null)
  }, [])

  const reload = useCallback(() => {
    if (cycleId) loadSummary(cycleId, drillGerencia)
  }, [cycleId, drillGerencia, loadSummary])

  return {
    summary,
    spotlightData,
    activeInsight,
    cycleId,
    cycleName,
    cycles,
    userRole,
    drillGerencia,
    isLoading,
    isSpotlightLoading,
    error,
    selectInsight,
    closeSpotlight,
    changeCycle,
    selectGerencia,
    clearGerencia,
    reload
  }
}
