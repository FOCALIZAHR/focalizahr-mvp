/**
 * HOOK: useOnboardingBenchmark
 * 
 * Consume API de benchmark onboarding para un departamento
 * 
 * Uso:
 * const { data, loading, error, refetch } = useOnboardingBenchmark(departmentId, 'CL')
 */

import { useState, useEffect, useCallback } from 'react';
import { BenchmarkResponse } from '@/lib/services/OnboardingBenchmarkService';

interface UseOnboardingBenchmarkReturn {
  data: BenchmarkResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOnboardingBenchmark(
  departmentId: string | null,
  country: string = 'CL'
): UseOnboardingBenchmarkReturn {
  
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchBenchmark = useCallback(async () => {
    if (!departmentId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `/api/onboarding/benchmark?departmentId=${departmentId}&country=${country}`;
      const response = await fetch(url);
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener benchmark');
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Respuesta inválida del servidor');
      }
      
      setData(result.data);
      
    } catch (err: any) {
      console.error('[useOnboardingBenchmark] Error:', err);
      setError(err.message || 'Error desconocido');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [departmentId, country]);
  
  useEffect(() => {
    fetchBenchmark();
  }, [fetchBenchmark]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchBenchmark
  };
}