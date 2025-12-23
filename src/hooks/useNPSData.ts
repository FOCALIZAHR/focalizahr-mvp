// ====================================================================
// FOCALIZAHR NPS HOOK
// src/hooks/useNPSData.ts
// Sistema NPS v1.0 - Hook para consumir API /api/analytics/nps
// ====================================================================

/**
 * CUSTOM HOOK: useNPSData
 * 
 * PROPÓSITO:
 * Hook React para consumir métricas NPS desde API
 * /api/analytics/nps con gestión completa de estados.
 * 
 * PATRÓN:
 * Sigue estructura estándar del proyecto (useOnboardingMetrics, useCampaignHistory)
 * - Estados: data, loading, error
 * - Auto-fetch en mount
 * - Función refetch expuesta
 * - Token desde localStorage
 * - useMemo para estabilizar return (evitar bucles infinitos)
 * 
 * USO:
 * ```tsx
 * // NPS global de onboarding
 * const { data, loading, error, refetch } = useNPSData({
 *   product: 'onboarding',
 *   period: 'latest'
 * })
 * 
 * // Ranking por gerencia
 * const { data } = useNPSData({
 *   product: 'onboarding',
 *   groupBy: 'gerencia'
 * })
 * 
 * // Histórico para trend
 * const { data } = useNPSData({
 *   product: 'onboarding',
 *   history: true
 * })
 * 
 * // Journey NPS (comparativo cross-producto)
 * const { data } = useNPSData({
 *   groupBy: 'product',
 *   period: '2025-12'
 * })
 * ```
 * 
 * API CONSUMIDA:
 * GET /api/analytics/nps
 *   ?product=onboarding|exit|pulso|experiencia|all
 *   &period=2025-12|latest
 *   &groupBy=gerencia|department|product
 *   &history=true|false
 * 
 * @version 1.0.0
 * @date Diciembre 2025
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ============================================================================
// IMPORTS - Types centralizados (Fuente Única de Verdad)
// ============================================================================
import type { 
  NPSInsightWithDepartment,
  NPSProductType,
  NPSPeriodType
} from '@/types/nps'

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Parámetros de consulta para la API NPS
 */
export interface UseNPSDataParams {
  /** Tipo de producto: onboarding | exit | pulso | experiencia | all */
  product?: NPSProductType | 'all'
  /** Período: YYYY-MM o 'latest' */
  period?: string
  /** Agrupación: gerencia | department | product */
  groupBy?: 'gerencia' | 'department' | 'product'
  /** Incluir histórico para trend */
  history?: boolean
}

/**
 * Respuesta de la API NPS
 */
export interface NPSDataResponse {
  data: NPSInsightWithDepartment[]
  meta: {
    total: number
    period: string
    product: string
    groupBy?: string
  }
  success: boolean
  error?: string
}

/**
 * Return type del hook
 */
export interface UseNPSDataReturn {
  /** Datos NPS obtenidos */
  data: NPSDataResponse | null
  /** Estado de carga */
  loading: boolean
  /** Error si ocurrió */
  error: string | null
  /** Función para refetch manual */
  refetch: () => Promise<void>
  /** Helpers para validar datos */
  hasData: boolean
  /** Total de registros */
  totalRecords: number
  /** Insight global (departmentId === null) */
  globalInsight: NPSInsightWithDepartment | null
  /** Lista de insights por gerencia (level === 2) */
  gerenciaInsights: NPSInsightWithDepartment[]
}

// ============================================================================
// HELPER: Obtener token de autenticación
// ============================================================================
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('focalizahr_token')
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook para obtener métricas NPS
 * 
 * @param params - Parámetros de consulta opcionales
 * @returns { data, loading, error, refetch, hasData, totalRecords, globalInsight, gerenciaInsights }
 * 
 * @example
 * ```tsx
 * // NPS Onboarding global
 * const { globalInsight, loading } = useNPSData({ product: 'onboarding' })
 * 
 * // Ranking por gerencia
 * const { gerenciaInsights } = useNPSData({ product: 'onboarding', groupBy: 'gerencia' })
 * 
 * // Trend histórico
 * const { data } = useNPSData({ product: 'onboarding', history: true })
 * ```
 */
export function useNPSData(params: UseNPSDataParams = {}): UseNPSDataReturn {
  // ============================================================================
  // ESTADOS
  // ============================================================================
  const [data, setData] = useState<NPSDataResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // FETCH FUNCTION
  // ============================================================================
  const fetchNPSData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('[useNPSData] Iniciando fetch con params:', params)

      const token = getAuthToken()
      if (!token) {
        console.error('[useNPSData] No token found')
        setError('No autenticado')
        setLoading(false)
        return
      }

      // Construir query string
      const queryParams = new URLSearchParams()
      
      if (params.product) {
        queryParams.set('product', params.product)
      }
      
      if (params.period) {
        queryParams.set('period', params.period)
      }
      
      if (params.groupBy) {
        queryParams.set('groupBy', params.groupBy)
      }
      
      if (params.history) {
        queryParams.set('history', 'true')
      }

      const queryString = queryParams.toString()
      const url = `/api/analytics/nps${queryString ? `?${queryString}` : ''}`

      console.log('[useNPSData] Fetching URL:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('[useNPSData] Response status:', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[useNPSData] 401 Unauthorized')
          setError('Sesión expirada. Por favor inicie sesión nuevamente.')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: NPSDataResponse = await response.json()

      console.log('[useNPSData] Response received:', {
        success: result.success,
        totalRecords: result.data?.length || 0,
        meta: result.meta
      })

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al obtener datos NPS')
      }

      setData(result)

    } catch (err) {
      console.error('[useNPSData] Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [params.product, params.period, params.groupBy, params.history])

  // ============================================================================
  // EFFECT: Auto-fetch on mount and when params change
  // ============================================================================
  useEffect(() => {
    fetchNPSData()
  }, [fetchNPSData])

  // ============================================================================
  // COMPUTED VALUES (memoized)
  // ============================================================================
  
  /** Insight global (departmentId === null) */
  const globalInsight = useMemo(() => {
    if (!data?.data) return null
    return data.data.find(d => d.departmentId === null) || null
  }, [data])

  /** Insights de gerencias (level === 2) */
  const gerenciaInsights = useMemo(() => {
    if (!data?.data) return []
    return data.data.filter(d => d.department?.level === 2)
  }, [data])

  // ============================================================================
  // RETURN ESTABILIZADO (evitar bucles infinitos)
  // ============================================================================
  const stableReturn = useMemo<UseNPSDataReturn>(() => ({
    data,
    loading,
    error,
    refetch: fetchNPSData,
    // Helpers
    hasData: !!data && data.data.length > 0,
    totalRecords: data?.data?.length || 0,
    globalInsight,
    gerenciaInsights
  }), [data, loading, error, fetchNPSData, globalInsight, gerenciaInsights])

  return stableReturn
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default useNPSData