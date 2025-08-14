// ====================================================================
// FOCALIZAHR CAMPAIGN HISTORY HOOK - PROTOCOLO "TONTO"
// src/hooks/useCampaignHistory.ts
// Chat 4B: Cross-Study Comparator - Hook sin lógica, solo fetch API
// ====================================================================

import { useState, useEffect, useCallback } from 'react';
import type { CrossStudyComparisonData } from '@/types';

// ✅ INTERFACES DATOS HISTÓRICOS (RECIBIDOS DE API CEREBRO)
export interface HistoricalCampaignData {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  durationDays: number;
  velocityMetrics: {
    averageResponsesPerDay: number;
    peakResponseDay: number;
    completionVelocity: number;
    firstWeekRate: number;
  };
  engagementPattern: {
    dayTwoRate: number;
    dayThreeRate: number;
    finalWeekSurge: number;
    consistencyScore: number;
    peakEngagementDay: number;
  };
}

export interface HistoricalDataResponse {
  campaigns: HistoricalCampaignData[];
  total: number;
  lastUpdated: string;
  currentComparison?: any; // Cross-study comparison if current campaign provided
  crossStudyComparison?: CrossStudyComparisonData; // ← AGREGAR ESTA LÍNEA

}

interface UseCampaignHistoryOptions {
  limit?: number;
  campaignType?: string;
  currentCampaignId?: string; // ← NUEVA OPCIÓN
}

// 🎯 HOOK "TONTO" - PROTOCOLO: SOLO FETCH, SIN LÓGICA
export function useCampaignHistory(options: UseCampaignHistoryOptions = {}) {
  const [data, setData] = useState<HistoricalDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { limit = 5, campaignType, currentCampaignId } = options;

  // ✅ FUNCIÓN FETCH SIMPLE - SIN LÓGICA DE CÁLCULO
  const fetchHistoricalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Construir parámetros query
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (campaignType) params.append('type', campaignType);
      if (currentCampaignId) params.append('current', currentCampaignId);

      console.log('[useCampaignHistory] Fetching datos de API cerebro...');
      
      // ✅ OBTENER TOKEN FOCALIZAHR
      const token = localStorage.getItem('focalizahr_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // SOLO FETCH - API CEREBRO YA PROCESÓ TODO
      const response = await fetch(`/api/historical?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado - sesión expirada');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('[useCampaignHistory] Datos recibidos del cerebro:', {
        campaigns: result.campaigns?.length || 0,
        total: result.total
      });
      
      // EXPONER DATOS YA PROCESADOS - SIN TRANSFORMACIONES
      setData(result);
      
    } catch (err) {
      console.error('[useCampaignHistory] Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [limit, campaignType, currentCampaignId]);

  // ✅ EFECTO SIMPLE - SOLO FETCH AL MOUNT
  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // ✅ RETURN SIMPLE - DATOS + ESTADOS
  return {
    data,
    isLoading,
    error,
    refreshData: fetchHistoricalData,
    // Helpers para validar datos
    hasHistoricalData: data && data.campaigns.length > 0,
    totalCampaigns: data?.total || 0,
    // ✅ NUEVO: Comparación cross-study pre-calculada
    crossStudyComparison: data?.currentComparison || null
  };
}