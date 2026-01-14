// src/hooks/useExitCauses.ts

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface TruthDataPoint {
  factor: string;
  frequency: number;
  avgSeverity: number;
  classification: 'wound' | 'noise' | 'mixed';
}

export interface PainMapNode {
  departmentId: string;
  departmentName: string;
  gerenciaId: string | null;
  gerenciaName: string | null;
  exitCount: number;
  avgSeverity: number;
  maxSeverity: number;
  classification: 'safe' | 'warning' | 'toxic';
}

export interface TalentDrainData {
  classification: string;
  count: number;
  percentage: number;
  label: string;
}

export interface PredictabilityData {
  totalWithOnboarding: number;
  withIgnoredAlerts: number;
  predictabilityRate: number;
  avgIgnoredAlerts: number;
  avgManagedAlerts: number;
}

export interface ROIData {
  keyTalentLosses: number;
  estimatedCostCLP: number;
  benchmarkSeverity: number | null;
  companySeverity: number;
  benchmarkComparison: 'better' | 'same' | 'worse';
  actionableInsight: string;
}

export interface HRHypothesisReason {
  reason: string;
  label: string;
  count: number;
  percentage: number;
}

export interface HRHypothesisData {
  reasons: HRHypothesisReason[];
  totalRecords: number;
}

export interface ExitCausesData {
  truth?: TruthDataPoint[];
  painmap?: PainMapNode[];
  drain?: TalentDrainData[];
  predictability?: PredictabilityData;
  roi?: ROIData;
  hrHypothesis?: HRHypothesisData;
  meta: {
    section: string;
    departmentId: string | null;
    userRole: string;
    filteredByHierarchy: boolean;
  };
}

interface UseExitCausesOptions {
  section?: 'truth' | 'painmap' | 'drain' | 'predictability' | 'roi' | 'all';
  departmentId?: string;
}

interface UseExitCausesReturn {
  data: ExitCausesData | null;
  truth: TruthDataPoint[];
  painmap: PainMapNode[];
  drain: TalentDrainData[];
  predictability: PredictabilityData | null;
  roi: ROIData | null;
  hrHypothesis: HRHypothesisData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HOOK: useExitCauses
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook para obtener análisis profundo de causas de salida (5 actos).
 * Sigue el patrón arquitectónico SUPERIOR del proyecto.
 *
 * SEGURIDAD:
 * - Usa cookies HttpOnly automáticas (NO localStorage)
 * - Protección XSS nativa del navegador
 * - Token no accesible desde JavaScript
 * - Middleware valida JWT y agrega headers
 * - Backend aplica RBAC con extractUserContext()
 *
 * @param options - Opciones de filtrado (section, departmentId)
 * @returns { data, truth, painmap, drain, predictability, roi, loading, error, refetch }
 *
 * @example
 * ```tsx
 * // Todas las secciones
 * const { truth, painmap, drain, loading } = useExitCauses();
 *
 * // Sección específica
 * const { truth } = useExitCauses({ section: 'truth' });
 *
 * // Filtrar por departamento
 * const { data } = useExitCauses({ departmentId: 'dept_123' });
 * ```
 */
export function useExitCauses(options?: UseExitCausesOptions): UseExitCausesReturn {
  const { section = 'all', departmentId } = options || {};

  const [data, setData] = useState<ExitCausesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * ════════════════════════════════════════════════════════════════════════
   * FETCH CAUSES DATA
   * ════════════════════════════════════════════════════════════════════════
   */
  const fetchCauses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir query params
      const params = new URLSearchParams();
      if (section) params.append('section', section);
      if (departmentId) params.append('departmentId', departmentId);

      const queryString = params.toString();
      const url = `/api/exit/causes${queryString ? `?${queryString}` : ''}`;

      console.log(`[useExitCauses] 🔄 Fetching: ${url}`);

      // Cookie HttpOnly automática
      const response = await fetch(url);

      // Validar respuesta HTTP
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para ver este análisis.');
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

      console.log('[useExitCauses] ✅ Data received:', {
        truthCount: result.truth?.length || 0,
        painmapCount: result.painmap?.length || 0,
        drainCount: result.drain?.length || 0,
        hasPredictability: !!result.predictability,
        hasROI: !!result.roi
      });

      setData(result);
      setError(null);

    } catch (err) {
      console.error('[useExitCauses] ❌ Error:', err);

      const errorMessage = err instanceof Error
        ? err.message
        : 'Error desconocido al cargar análisis de causas';

      setError(errorMessage);
      setData(null);

    } finally {
      setLoading(false);
    }
  }, [section, departmentId]);

  /**
   * ════════════════════════════════════════════════════════════════════════
   * EFFECT: Fetch on mount and when options change
   * ════════════════════════════════════════════════════════════════════════
   */
  useEffect(() => {
    fetchCauses();
  }, [fetchCauses]);

  return {
    data,
    truth: data?.truth || [],
    painmap: data?.painmap || [],
    drain: data?.drain || [],
    predictability: data?.predictability || null,
    roi: data?.roi || null,
    hrHypothesis: data?.hrHypothesis || null,
    loading,
    error,
    refetch: fetchCauses
  };
}
