// src/hooks/useExitMetrics.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  DepartmentExitMetrics, 
  ExitMetricsSummary
} from '@/types/exit';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface UseExitMetricsOptions {
  departmentId?: string;
  period?: string; // YYYY-MM formato
}

/**
 * Data estructura retornada por el hook
 */
export interface ExitMetricsData {
  departments: DepartmentExitMetrics[];
  summary: ExitMetricsSummary | null;
}

interface UseExitMetricsReturn {
  data: ExitMetricsData | null;
  departments: DepartmentExitMetrics[];
  summary: ExitMetricsSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK: useExitMetrics
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Hook para obtener métricas Exit Intelligence con soporte RBAC bimodal.
 * Sigue el patrón arquitectónico SUPERIOR del proyecto (useOnboardingAlerts).
 * 
 * SEGURIDAD:
 * - Usa cookies HttpOnly automáticas (NO localStorage)
 * - Protección XSS nativa del navegador
 * - Token no accesible desde JavaScript
 * - Middleware valida JWT y agrega headers
 * - Backend aplica RBAC con extractUserContext()
 * 
 * @param options - Opciones de filtrado (departmentId, period)
 * @param scope - 'company' (todas gerencias) | 'filtered' (mi área)
 * @returns { data, departments, summary, loading, error, refetch }
 * 
 * @example
 * ```tsx
 * // Vista principal - Todas las gerencias
 * const { departments, summary, loading } = useExitMetrics(undefined, 'company');
 * 
 * // Vista executive - Mi área
 * const { departments, summary } = useExitMetrics(undefined, 'filtered');
 * 
 * // Departamento específico con período
 * const { data } = useExitMetrics({ 
 *   departmentId: 'dept_123', 
 *   period: '2024-12' 
 * }, 'filtered');
 * ```
 */
export function useExitMetrics(
  options?: UseExitMetricsOptions,
  scope: 'company' | 'filtered' = 'filtered'
): UseExitMetricsReturn {
  const { departmentId, period } = options || {};
  
  const [data, setData] = useState<ExitMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * FETCH METRICS
   * ════════════════════════════════════════════════════════════════════════
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (period) params.append('period', period);
      if (scope) params.append('scope', scope);
      
      const queryString = params.toString();
      const url = `/api/exit/metrics${queryString ? `?${queryString}` : ''}`;
      
      console.log(`[useExitMetrics] 🔄 Fetching: ${url}`);
      
      // ✅ PATRÓN SUPERIOR: Cookie HttpOnly automática
      // El navegador envía automáticamente la cookie focalizahr_token
      // NO es necesario ni recomendado agregar Authorization header
      // Esto previene ataques XSS ya que el token no es accesible desde JS
      const response = await fetch(url);
      
      // Validar respuesta HTTP
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para ver estas métricas.');
        }
        
        const errorData = await response.json().catch(() => ({ 
          error: 'Error desconocido' 
        }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useExitMetrics] ✅ Data received:', {
        departmentsCount: result.data?.departments?.length || 0,
        hasSummary: !!result.data?.summary,
        source: result.source
      });
      
      setData(result.data);
      setError(null);
      
    } catch (err) {
      console.error('[useExitMetrics] ❌ Error:', err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error desconocido al cargar métricas Exit';
      
      setError(errorMessage);
      setData(null);
      
    } finally {
      setLoading(false);
    }
  }, [departmentId, period, scope]);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * EFFECT: Fetch on mount and when options change
   * ════════════════════════════════════════════════════════════════════════
   */
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);
  
  return {
    data,
    departments: data?.departments || [],
    summary: data?.summary || null,
    loading,
    error,
    refetch: fetchMetrics
  };
}