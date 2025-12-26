// src/hooks/useExitMetrics.ts

import { useState, useEffect, useCallback } from 'react';
import { EISClassification } from '@/types/exit';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface FactorPriority {
  factor: string;
  mentions: number;
  mentionRate: number;
  avgSeverity: number;
  priority: number;
}

/**
 * Métricas de un departamento
 */
export interface DepartmentExitMetrics {
  departmentId: string;
  departmentName: string;
  standardCategory: string | null;
  
  // Período
  period: string;
  periodStart: string;
  periodEnd: string;
  
  // Básicas
  totalExits: number;
  voluntaryExits: number;
  involuntaryExits: number;
  surveysCompleted: number;
  completionRate: number;
  
  // EIS
  avgEIS: number | null;
  eisClassification: EISClassification | null;
  eisTrend: number | null;
  
  // eNPS
  enps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  
  // Top Factores
  topFactors: FactorPriority[];
  
  // Correlación Onboarding
  exitsWithOnboarding: number;
  exitsWithOnboardingAlerts: number;
  exitsWithIgnoredAlerts: number;
  conservationIndex: number | null;
  alertPredictionRate: number | null;
  
  // Alertas activas
  pendingAlerts: number;
  criticalAlerts: number;
}

/**
 * Resumen global de métricas
 */
export interface ExitMetricsSummary {
  totalDepartments: number;
  totalExits: number;
  globalAvgEIS: number | null;
  globalEISClassification: EISClassification | null;
  globalENPS: number | null;
  surveysCompleted: number;
  completionRate: number;
  alerts: {
    pending: number;
    critical: number;
    leyKarin: number;
  };
  topFactorsGlobal: FactorPriority[];
}

interface UseExitMetricsOptions {
  departmentId?: string;
  period?: string; // YYYY-MM formato
}

interface UseExitMetricsReturn {
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
 * Fetching de métricas Exit agregadas por departamento.
 * 
 * @param options - Opciones de filtrado (departmentId, period)
 * @returns { departments, summary, loading, error, refetch }
 * 
 * @example
 * ```tsx
 * // Métricas globales
 * const { departments, summary, loading } = useExitMetrics();
 * 
 * // Métricas de un departamento específico
 * const { departments, summary } = useExitMetrics({ departmentId: 'dept_123' });
 * 
 * // Métricas de un período específico
 * const { departments, summary } = useExitMetrics({ period: '2024-12' });
 * ```
 */
export function useExitMetrics(options?: UseExitMetricsOptions): UseExitMetricsReturn {
  const { departmentId, period } = options || {};
  
  const [departments, setDepartments] = useState<DepartmentExitMetrics[]>([]);
  const [summary, setSummary] = useState<ExitMetricsSummary | null>(null);
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
      
      const queryString = params.toString();
      const url = `/api/exit/metrics${queryString ? `?${queryString}` : ''}`;
      
      console.log('[useExitMetrics] Fetching:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error fetching exit metrics');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      console.log('[useExitMetrics] Received:', {
        departmentsCount: result.data?.departments?.length || 0,
        hasSummary: !!result.data?.summary,
        source: result.source
      });
      
      setDepartments(result.data?.departments || []);
      setSummary(result.data?.summary || null);
      
    } catch (err: any) {
      console.error('[useExitMetrics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [departmentId, period]);
  
  /**
   * ════════════════════════════════════════════════════════════════════════
   * EFFECT: Fetch on mount and when options change
   * ════════════════════════════════════════════════════════════════════════
   */
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);
  
  return {
    departments,
    summary,
    loading,
    error,
    refetch: fetchMetrics
  };
}