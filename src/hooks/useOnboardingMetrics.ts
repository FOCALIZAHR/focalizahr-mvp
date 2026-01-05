// src/hooks/useOnboardingMetrics.ts - v3.2.7 CENTRALIZADO
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
 * - Si global: data es OnboardingDashboardData (agregaciones globales)
 * - Si sin datos: data es null
 * 
 * @version 3.2.7 - Types centralizados en @/types/onboarding
 * @date November 2025
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ============================================================================
// IMPORTS - Types centralizados (Fuente Única de Verdad)
// ============================================================================
import { 
  OnboardingMetrics, 
  OnboardingDashboardData,
  UseOnboardingMetricsReturn,
  TimelineStage
} from '@/types/onboarding'

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook para obtener métricas de onboarding
 * 
 * @param departmentId - Opcional. Si se proporciona, filtra por departamento específico
 * @returns { data, loading, error, refetch, timelineStages }
 * 
 * @example
 * ```tsx
 * // Todas las métricas (agregadas)
 * const { data, loading, timelineStages } = useOnboardingMetrics()
 * // data es OnboardingDashboardData
 * 
 * // Departamento específico
 * const { data } = useOnboardingMetrics('dept_123')
 * // data es OnboardingMetrics
 * ```
 */
export function useOnboardingMetrics(
  departmentId?: string,
  scope: 'company' | 'filtered' = 'filtered'
): UseOnboardingMetricsReturn {
  
  // ========================================================================
  // ESTADOS
  // ========================================================================
  const [data, setData] = useState<OnboardingMetrics | OnboardingDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ========================================================================
  // FETCH FUNCTION (useCallback para estabilidad)
  // ========================================================================
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
     // 1. Construir URL con query params
      const params = new URLSearchParams();
      if (departmentId) params.set('departmentId', departmentId);
      if (scope) params.set('scope', scope);
      
      const queryString = params.toString();
      const url = `/api/onboarding/metrics${queryString ? `?${queryString}` : ''}`;
      
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
        isDashboard: result.data?.global !== undefined,
        count: Array.isArray(result.data) ? result.data.length : 1
      })
      
      // 6. Actualizar estado
      setData(result.data || result)
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
  }, [departmentId, scope])  // Re-fetch si cambia departmentId o scope
  
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
  // CALCULATE TIMELINE STAGES (4C Bauer)
  // ========================================================================
  const timelineStages = useMemo((): TimelineStage[] => {
    // Si no hay data, retornar stages vacíos
    if (!data) {
      return [
        { day: 1, label: 'Compliance', score: null, alerts: 0, color: '#475569' },
        { day: 7, label: 'Clarificación', score: null, alerts: 0, color: '#475569' },
        { day: 30, label: 'Cultura', score: null, alerts: 0, color: '#475569' },
        { day: 90, label: 'Conexión', score: null, alerts: 0, color: '#475569' }
      ];
    }

    // Verificar si es OnboardingDashboardData (tiene global e insights)
    const dashboardData = data as OnboardingDashboardData;
    if (!dashboardData.global || !dashboardData.insights) {
      return [
        { day: 1, label: 'Compliance', score: null, alerts: 0, color: '#475569' },
        { day: 7, label: 'Clarificación', score: null, alerts: 0, color: '#475569' },
        { day: 30, label: 'Cultura', score: null, alerts: 0, color: '#475569' },
        { day: 90, label: 'Conexión', score: null, alerts: 0, color: '#475569' }
      ];
    }

    // Helper: Color según score
    const getStageColor = (score: number | null): string => {
      if (!score) return '#475569'; // slate-600
      if (score >= 80) return '#22D3EE'; // cyan-400
      if (score >= 60) return '#F59E0B'; // amber-400
      return '#EF4444'; // red-400
    };

    // Helper: Conteo alertas por tipo
    const getAlertCount = (issueType: string): number => {
      const issue = dashboardData.insights.topIssues.find(i => i.issue === issueType);
      return issue?.count || 0;
    };

    // Tomar primer departamento para scores individuales
    const dept = dashboardData.departments?.[0];
    
    // Convertir scores de 0-5 a 0-100
    const complianceScore = dept?.avgComplianceScore 
      ? Math.round((dept.avgComplianceScore / 5) * 100) 
      : null;
    
    const clarificationScore = dept?.avgClarificationScore 
      ? Math.round((dept.avgClarificationScore / 5) * 100) 
      : null;
    
    const cultureScore = dept?.avgCultureScore 
      ? Math.round((dept.avgCultureScore / 5) * 100) 
      : null;
    
    const connectionScore = dept?.avgConnectionScore 
      ? Math.round((dept.avgConnectionScore / 5) * 100) 
      : null;

    return [
      { 
        day: 1, 
        label: 'Compliance',
        score: complianceScore,
        alerts: getAlertCount('low_compliance_score'),
        color: getStageColor(complianceScore)
      },
      { 
        day: 7, 
        label: 'Clarificación',
        score: clarificationScore,
        alerts: getAlertCount('low_clarification_score'),
        color: getStageColor(clarificationScore)
      },
      { 
        day: 30, 
        label: 'Cultura',
        score: cultureScore,
        alerts: getAlertCount('missed_culture_survey'),
        color: getStageColor(cultureScore)
      },
      { 
        day: 90, 
        label: 'Conexión',
        score: connectionScore,
        alerts: getAlertCount('connection_score_declining'),
        color: getStageColor(connectionScore)
      }
    ];
  }, [data]);
  
  // ========================================================================
  // RETURN
  // ========================================================================
  return {
    data,
    loading,
    error,
    refetch,
    timelineStages
  }
}