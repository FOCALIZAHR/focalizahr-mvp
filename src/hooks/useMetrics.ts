import { useState, useEffect, useCallback } from 'react';

// Tipos para métricas
interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  cancelledCampaigns: number;
  globalParticipationRate: number;
  totalResponses: number;
  totalParticipants: number;
  averageCompletionTime: number;
  topPerformingCampaignType: string | null;
}

interface UseMetricsParams {
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

interface UseMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  isStale: boolean; // Indica si los datos pueden estar desactualizados
}

export function useMetrics(params: UseMetricsParams = {}): UseMetricsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 60000 // 1 minuto por defecto
  } = params;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      // Resetear estado de stale al comenzar fetch
      setIsStale(false);
      
      const response = await fetch('/api/campaigns/metrics', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: DashboardMetrics = await response.json();
      
      setMetrics(data);
      setError(null);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar métricas');
      
      // Si ya teníamos datos, marcarlos como stale en lugar de limpiarlos
      if (metrics) {
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  // Función para refetch manual
  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchMetrics();
  }, [fetchMetrics]);

  // Efecto para fetch inicial
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Solo auto-refresh si no estamos en estado de loading
      if (!loading) {
        fetchMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, fetchMetrics]);

  // Efecto para detectar datos stale basado en tiempo
  useEffect(() => {
    if (!lastUpdated) return;

    const staleTimeout = setTimeout(() => {
      setIsStale(true);
    }, refreshInterval * 2); // Marcar como stale después de 2x el intervalo

    return () => clearTimeout(staleTimeout);
  }, [lastUpdated, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refetch,
    isStale
  };
  
}

// Al final del archivo, después de la función useMetrics:
export type { UseMetricsParams, UseMetricsReturn };