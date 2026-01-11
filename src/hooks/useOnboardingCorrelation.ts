// src/hooks/useOnboardingCorrelation.ts
// Hook para obtener correlación Onboarding-Exit

'use client';

import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CorrelationCase {
  departmentId: string;
  departmentName: string;
  gerenciaId: string | null;
  gerenciaName: string | null;
  exitsCount: number;
  exitsWithIgnoredAlertsCount: number; // 🆕 Personas con alertas ignoradas
  ignoredAlertsCount: number;
  cost: number;
}

export interface OnboardingCorrelationData {
  conservationIndex: number | null;
  alertPredictionRate: number;
  exitsThisMonth: number;
  withOnboarding: number;
  exitsWithIgnoredAlerts: number; // 🆕 Personas con alertas ignoradas
  totalIgnoredAlerts: number;
  totalManagedAlerts: number;
  correlationRate: number;
  avoidableCost: number;
  cases: CorrelationCase[];
}

interface UseOnboardingCorrelationParams {
  scope?: 'company' | 'filtered';
  departmentId?: string;
  period?: string;
}

interface UseOnboardingCorrelationReturn {
  data: OnboardingCorrelationData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useOnboardingCorrelation(
  params?: UseOnboardingCorrelationParams
): UseOnboardingCorrelationReturn {
  const { scope = 'filtered', departmentId, period } = params || {};

  const [data, setData] = useState<OnboardingCorrelationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir query params
      const queryParams = new URLSearchParams();
      if (scope) queryParams.append('scope', scope);
      if (departmentId) queryParams.append('departmentId', departmentId);
      if (period) queryParams.append('period', period);

      const queryString = queryParams.toString();
      const url = `/api/exit/insights/onboarding-correlation${queryString ? `?${queryString}` : ''}`;

      console.log(`[useOnboardingCorrelation] 🔄 Fetching: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada');
        }
        if (response.status === 403) {
          throw new Error('Sin permisos');
        }
        throw new Error(`Error ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      console.log('[useOnboardingCorrelation] ✅ Data received:', {
        exitsThisMonth: result.data?.exitsThisMonth,
        correlationRate: result.data?.correlationRate
      });

      setData(result.data);

    } catch (err) {
      console.error('[useOnboardingCorrelation] ❌ Error:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [scope, departmentId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}
