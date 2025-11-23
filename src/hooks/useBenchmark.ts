// src/hooks/useBenchmark.ts
// ============================================================================
// HOOK: useBenchmark
// Hook React para consultar benchmarks de mercado
// ============================================================================

import { useState, useEffect } from 'react';
import type { 
  BenchmarkResponse, 
  UseBenchmarkReturn 
} from '@/types/onboarding';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================
interface UseBenchmarkOptions {
  dimension?: string;
  segment?: string;
  country?: string;
  industry?: string;
  companySizeRange?: string;
  enabled?: boolean;  // Mantener enabled para condicionales
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook para consultar benchmarks de mercado
 * 
 * @param metricType - Tipo de métrica: "onboarding_exo", "exit_retention_risk", etc.
 * @param standardCategory - Categoría organizacional: "personas", "tecnologia", etc.
 * @param departmentId - ID departamento para comparación (opcional)
 * @param country - País específico para filtrar (opcional, usa el del account por defecto)
 * @param options - Opciones adicionales (enabled, etc.)
 * 
 * @returns { data, loading, error, refetch }
 * 
 * @example
 * // Benchmark general (sin comparación)
 * const { data, loading } = useBenchmark('onboarding_exo', 'personas');
 * 
 * @example
 * // Benchmark con comparación departamental
 * const { data, loading } = useBenchmark('onboarding_exo', 'personas', 'dept_123');
 * 
 * @example
 * // Benchmark país específico
 * const { data, loading } = useBenchmark('onboarding_exo', 'personas', undefined, 'MX');
 * 
 * @example
 * // Condicional (solo fetch cuando enabled=true)
 * const { data, loading } = useBenchmark('onboarding_exo', 'personas', undefined, undefined, { enabled: !!category });
 */
export function useBenchmark(
  metricType: string,
  standardCategory: string,
  departmentId?: string,
  country?: string,
  options?: UseBenchmarkOptions
): UseBenchmarkReturn {  // ✅ Con tipo de retorno
  // ═══════════════════════════════════════════════════════════
  // Estado del hook
  // ═══════════════════════════════════════════════════════════
  const [data, setData] = useState<BenchmarkResponse | null>(null);  // ✅
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const enabled = options?.enabled !== false;
  
  // ═══════════════════════════════════════════════════════════
  // Función de fetch (memoizada para refetch)
  // ═══════════════════════════════════════════════════════════
  const fetchBenchmark = async () => {
    console.log('🔥 [useBenchmark] Iniciando fetch...');
    console.log('🔥 [useBenchmark] Params:', { metricType, standardCategory, departmentId, country });
    // Early return si no está enabled
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    // Validación básica
    if (!metricType || !standardCategory) {
      setError('metricType y standardCategory son requeridos');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams({
        metricType,
        standardCategory,
        dimension: 'GLOBAL' // Fase 1: Solo GLOBAL
      });
      
      if (departmentId) {
        params.append('departmentId', departmentId);
      }
      
      if (country) {
        params.append('country', country);
      }
      
      // Fetch API
      const response = await fetch(`/api/benchmarks?${params}`);
      console.log('🔥 [useBenchmark] URL:', `/api/benchmarks?${params}`);  // ← AGREGAR
      console.log('🔥 [useBenchmark] Response status:', response.status);  // ← AGREGAR
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      console.log('🔥 [useBenchmark] Response JSON:', json);  // ← AGREGAR
      // Manejar caso sin benchmark disponible
      if (!json.success) {
        console.log('🔥 [useBenchmark] ❌ API retornó success=false:', json.message);  // ← AGREGAR
        setError(json.message || 'Benchmark no disponible');
        setData(null);
        return;
      }
      
      // Success: Guardar data
      console.log('🔥 [useBenchmark] ✅ Datos guardados:', json.data);  // ← AGREGAR
      setData(json.data);
      
    } catch (err: any) {
      console.error('[useBenchmark] Error:', err);
      setError(err.message || 'Error cargando benchmark');
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // ═══════════════════════════════════════════════════════════
  // Effect: Fetch cuando cambian las dependencias
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    fetchBenchmark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType, standardCategory, departmentId, country, enabled]);
  
  // ═══════════════════════════════════════════════════════════
  // Retorno del hook
  // ═══════════════════════════════════════════════════════════
  return {
    data,
    loading,
    error,
    refetch: fetchBenchmark // Útil para refrescar manualmente
  };
}

// ============================================================================
// HOOK ALTERNATIVO: useBenchmarkComparison
// ============================================================================

/**
 * Hook específico para comparación departamental
 * Simplifica el uso cuando siempre necesitas comparación
 * 
 * @example
 * const { comparison, loading } = useBenchmarkComparison(
 *   'onboarding_exo',
 *   'personas',
 *   'dept_123'
 * );
 * 
 * if (comparison) {
 *   console.log(`${comparison.percentageGap}% vs mercado`);
 * }
 */
export function useBenchmarkComparison(
  metricType: string,
  standardCategory: string,
  departmentId: string,
  country?: string
) {
  const { data, loading, error, refetch } = useBenchmark(
    metricType,
    standardCategory,
    departmentId,
    country
  );
  
  return {
    comparison: data?.comparison || null,
    benchmark: data?.benchmark || null,
    loading,
    error,
    refetch
  };
}

// ============================================================================
// HELPER: useBenchmarkStatus
// ============================================================================

/**
 * Hook helper para obtener solo el status de comparación
 * Útil para badges, iconos, colores condicionales
 * 
 * @example
 * const { status, percentileRank, loading } = useBenchmarkStatus(
 *   'onboarding_exo',
 *   'personas',
 *   'dept_123'
 * );
 * 
 * <Badge className={status === 'above' ? 'bg-green-500' : 'bg-red-500'}>
 *   Percentil {percentileRank}
 * </Badge>
 */
export function useBenchmarkStatus(
  metricType: string,
  standardCategory: string,
  departmentId: string,
  country?: string
) {
  const { data, loading, error } = useBenchmark(
    metricType,
    standardCategory,
    departmentId,
    country
  );
  
  return {
    status: data?.comparison?.status || null,
    percentileRank: data?.comparison?.percentileRank || null,
    percentageGap: data?.comparison?.percentageGap || null,
    loading,
    error
  };
}

// ============================================================================
// TIPOS EXPORT (para uso en componentes)
// ============================================================================

