/**
 * ============================================
 * CUSTOM HOOK: useOnboardingMetrics
 * FASE 6A - Onboarding Journey Intelligence
 * ============================================
 * 
 * PROPÓSITO:
 * Hook React para consumir métricas de onboarding desde API
 * /api/onboarding/metrics con gestión completa de estados.
 * 
 * PATRÓN:
 * Sigue estructura estándar del proyecto (useCampaigns, useMetrics)
 * - Estados: data, loading, error
 * - Auto-fetch en mount
 * - Función refetch expuesta
 * - Token desde localStorage
 * 
 * USO:
 * ```tsx
 * // Métricas globales (todos los departamentos)
 * const { data, loading, error, refetch } = useOnboardingMetrics()
 * 
 * // Métricas de departamento específico
 * const { data, loading, error } = useOnboardingMetrics('dept_123')
 * ```
 * 
 * RESPONSE DATA:
 * - Si departmentId: data es objeto único (OnboardingMetrics)
 * - Si global: data es array (OnboardingMetrics[])
 * - Si sin datos: data es null
 * 
 * @version 3.2.4
 * @date November 2025
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES - Copia exacta de DepartmentOnboardingInsight
// ============================================================================

/**
 * Interfaz completa de métricas de onboarding
 * Refleja modelo Prisma DepartmentOnboardingInsight
 */
export interface OnboardingMetrics {
  // IDs y período
  id: string
  accountId: string
  departmentId: string
  periodStart: string  // ISO date string
  periodEnd: string    // ISO date string
  
  // ========================================
  // MÉTRICAS BASE (5)
  // ========================================
  totalJourneys: number
  activeJourneys: number
  completedJourneys: number
  atRiskJourneys: number
  abandonedJourneys: number
  
  // ========================================
  // SCORES 4C (5)
  // ========================================
  avgComplianceScore: number | null      // Día 1 - Compliance
  avgClarificationScore: number | null   // Día 7 - Clarification
  avgCultureScore: number | null         // Día 30 - Culture
  avgConnectionScore: number | null      // Día 90 - Connection
  avgEXOScore: number | null             // Score global experiencia
  exoScoreTrend: number | null           // Tendencia vs período anterior  ⬅️ AGREGAR ESTA LÍNEA
  
  // ========================================
  // ALERTAS (3)
  // ========================================
  criticalAlerts: number
  highAlerts: number
  mediumAlerts: number
  
  // ========================================
  // DEMOGRAFÍA (3)
  // ========================================
  avgAge: number | null
  avgSeniority: number | null
  genderDistribution: Record<string, number> | null
  
  // ========================================
  // INSIGHTS (2)
  // ========================================
  topIssues: Array<{
    issue: string
    count: number
  }> | null
  recommendations: string[] | null
  
  // ========================================
  // TIMESTAMPS (2)
  // ========================================
  createdAt: string  // ISO timestamp
  updatedAt: string  // ISO timestamp
  
  // ========================================
  // RELACIÓN DEPARTMENT (Incluida por API)
  // ========================================
  department?: {
    id: string
    displayName: string
    standardCategory: string
  }
}

/**
 * Return type del hook
 */
interface UseOnboardingMetricsReturn {
  data: OnboardingMetrics | OnboardingMetrics[] | null
  loading: boolean
  error: string | null
  refetch: () => void
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook para obtener métricas de onboarding
 * 
 * @param departmentId - Opcional. Si se proporciona, filtra por departamento específico
 * @returns { data, loading, error, refetch }
 * 
 * @example
 * ```tsx
 * // Todas las métricas
 * const { data, loading } = useOnboardingMetrics()
 * 
 * // Departamento específico
 * const { data } = useOnboardingMetrics('dept_123')
 * ```
 */
export function useOnboardingMetrics(
  departmentId?: string
): UseOnboardingMetricsReturn {
  
  // ========================================================================
  // ESTADOS
  // ========================================================================
  const [data, setData] = useState<OnboardingMetrics | OnboardingMetrics[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ========================================================================
  // FETCH FUNCTION (useCallback para estabilidad)
  // ========================================================================
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Construir URL con query param opcional
      const url = departmentId 
        ? `/api/onboarding/metrics?departmentId=${departmentId}`
        : `/api/onboarding/metrics`
      
      console.log(`[useOnboardingMetrics] 🔄 Fetching: ${url}`)
      
      // 2. Obtener token de localStorage (patrón estándar proyecto)
      const token = localStorage.getItem('focalizahr_token')
      
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión.')
      }
      
      // 3. Fetch con autenticación
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      // 4. Validar respuesta HTTP
      if (!response.ok) {
        // Casos especiales
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para ver estas métricas.')
        }
        
        // Error genérico
        const errorData = await response.json().catch(() => ({ 
          error: 'Error desconocido' 
        }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }
      
      // 5. Parse JSON
      const result = await response.json()
      
      console.log('[useOnboardingMetrics] ✅ Data received:', {
        hasData: !!result.data,
        isArray: Array.isArray(result.data),
        count: Array.isArray(result.data) ? result.data.length : 1
      })
      
      // 6. Actualizar estado
      setData(result.data)
      setError(null)
      
    } catch (err) {
      // Error handling
      console.error('[useOnboardingMetrics] ❌ Error:', err)
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error desconocido al cargar métricas de onboarding'
      
      setError(errorMessage)
      setData(null)
      
    } finally {
      setLoading(false)
    }
  }, [departmentId])  // Re-fetch si cambia departmentId
  
  // ========================================================================
  // AUTO-FETCH ON MOUNT + DEPENDENCY CHANGE
  // ========================================================================
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])
  
  // ========================================================================
  // REFETCH FUNCTION (expuesta al consumidor)
  // ========================================================================
  const refetch = useCallback(() => {
    setLoading(true)
    fetchMetrics()
  }, [fetchMetrics])
  
  // ========================================================================
  // RETURN
  // ========================================================================
  return {
    data,
    loading,
    error,
    refetch
  }
}