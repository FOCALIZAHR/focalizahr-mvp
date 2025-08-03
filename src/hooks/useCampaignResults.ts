// src/hooks/useCampaignResults.ts
// NORMALIZADOR CENTRAL v3.0 - ÚNICA FUENTE VALIDACIÓN Y NORMALIZACIÓN

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ✅ INTERFACE NORMALIZADA - DATOS LIMPIOS Y CONSISTENTES
export interface CampaignResultsData {
  campaign: any;
  analytics: {
    // Métricas principales normalizadas
    totalInvited: number;
    totalResponded: number;
    totalResponses: number; // Alias para compatibilidad
    participationRate: number;
    averageScore: number;
    completionTime: number;
    responseRate: number;
    
    // Datos estructurados normalizados
    categoryScores: Record<string, number>;
    departmentScores: Record<string, number>;
    departmentScoresDisplay?: Record<string, number>; // ← AGREGADO FASE 3B
    departmentMapping?: Record<string, string>; // ← AGREGADO FASE 3A
    trendData: Array<{
      date: string;
      responses: number;
      score: number;
    }>;
    responsesByDay: Record<string, number>;
    segmentationData: any[];
    demographicBreakdown: any[];
    lastUpdated: string;
  };
}

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('focalizahr_token') || '';
  }
  return '';
};

// ✅ FUNCIÓN NORMALIZADORA CENTRAL - TODA LA LÓGICA AQUÍ
function normalizeAnalyticsData(rawAnalyticsData: any): CampaignResultsData {
  const rawMetrics = rawAnalyticsData.metrics || {};
  const rawCampaign = rawAnalyticsData.campaign || {};
  
  // 🔧 FASE 1 FIX: MAPEO CORRECTO CAMPAIGN.CAMPAIGNTYPE DESDE META
  const campaignData = {
    ...rawCampaign,
    // ✅ CORRECCIÓN CRÍTICA: Mapear campaignType desde meta si no existe
    campaignType: rawCampaign.campaignType || rawAnalyticsData.meta?.campaignType || null,
    name: rawCampaign.name || rawAnalyticsData.meta?.campaignName || 'Campaña',
    company: rawCampaign.company || { name: 'Empresa' }
  };
  
  // ✅ NORMALIZACIÓN MÉTRICAS PRINCIPALES CON VALIDACIÓN ESTRICTA
  const totalInvited = Number(rawMetrics.totalInvited) || 
                      Number(rawCampaign.participants?.length) || 0;
  const totalResponded = Number(rawMetrics.totalResponded) || 0;
  const participationRate = Number(rawMetrics.participationRate) || 0;
  const averageScore = Number(rawMetrics.averageScore) || 0;
  const completionTime = Number(rawMetrics.completionTime) || 480; // 8 min default
  const responseRate = Number(rawMetrics.responseRate) || participationRate;

  // ✅ NORMALIZACIÓN SCORES CATEGORÍAS - SOLO NÚMEROS VÁLIDOS
  const categoryScores: Record<string, number> = {};
  if (rawMetrics.categoryScores && typeof rawMetrics.categoryScores === 'object') {
    Object.entries(rawMetrics.categoryScores).forEach(([category, score]) => {
      const normalizedScore = Number(score);
      if (!isNaN(normalizedScore) && isFinite(normalizedScore)) {
        categoryScores[category] = normalizedScore;
      }
    });
  }

  // ✅ NORMALIZACIÓN DEPARTMENT SCORES - SOLO NÚMEROS VÁLIDOS
  const departmentScores: Record<string, number> = {};
  if (rawMetrics.departmentScores && typeof rawMetrics.departmentScores === 'object') {
    Object.entries(rawMetrics.departmentScores).forEach(([dept, score]) => {
      const normalizedScore = Number(score);
      if (!isNaN(normalizedScore) && isFinite(normalizedScore)) {
        departmentScores[dept] = normalizedScore;
      }
    });
  }

  // ✅ NORMALIZACIÓN DEPARTMENT SCORES DISPLAY - NOMENCLATURA CLIENTE
  const departmentScoresDisplay: Record<string, number> = {};
  if (rawMetrics.departmentScoresDisplay && typeof rawMetrics.departmentScoresDisplay === 'object') {
    Object.entries(rawMetrics.departmentScoresDisplay).forEach(([dept, score]) => {
      const normalizedScore = Number(score);
      if (!isNaN(normalizedScore) && isFinite(normalizedScore)) {
        departmentScoresDisplay[dept] = normalizedScore;
      }
    });
  }

  // ✅ NORMALIZACIÓN TREND DATA - VALIDACIÓN ARRAYS
  const trendData = Array.isArray(rawMetrics.trendData) 
    ? rawMetrics.trendData.map((item: any) => ({
        date: String(item?.date || ''),
        responses: Number(item?.responses) || 0,
        score: Number(item?.score) || 0
      }))
    : [];

  // ✅ NORMALIZACIÓN TREND DATA BY DEPARTMENT - CAUSA RAÍZ SOLUCIONADA
  const trendDataByDepartment = rawMetrics.trendDataByDepartment || {};

  // ✅ NORMALIZACIÓN RESPONSES BY DAY
  const responsesByDay: Record<string, number> = {};
  if (rawMetrics.responsesByDay && typeof rawMetrics.responsesByDay === 'object') {
    Object.entries(rawMetrics.responsesByDay).forEach(([day, count]) => {
      const normalizedCount = Number(count);
      if (!isNaN(normalizedCount)) {
        responsesByDay[day] = normalizedCount;
      }
    });
  }

  // ✅ CONSTRUCCIÓN OBJETO NORMALIZADO
  return {
    campaign: campaignData, // ← CAMPAÑA CON MAPEO CORRECTO
    analytics: {
      // Métricas principales validadas
      totalInvited,
      totalResponded,
      totalResponses: totalResponded, // Alias para compatibilidad
      participationRate,
      averageScore,
      completionTime,
      responseRate,
      
      // Datos estructurados validados
      categoryScores,
      departmentScores,
      departmentScoresDisplay, // ← AGREGADO FASE 3B
      departmentMapping: rawMetrics.departmentMapping || {}, // ← AGREGADO FASE 3A
      trendData,
      trendDataByDepartment, // ← AGREGADO CAUSA RAÍZ SOLUCIONADA
      responsesByDay,
      segmentationData: Array.isArray(rawMetrics.segmentationData) ? rawMetrics.segmentationData : [],
      demographicBreakdown: Array.isArray(rawMetrics.demographicBreakdown) ? rawMetrics.demographicBreakdown : [],
      lastUpdated: rawMetrics.lastUpdated || new Date().toISOString()
    }
  };
}

export function useCampaignResults(campaignId: string) {
  const [data, setData] = useState<CampaignResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!campaignId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const analyticsRes = await fetch(`/api/campaigns/${campaignId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!analyticsRes.ok) {
        if (analyticsRes.status === 401) router.push('/login');
        const errorData = await analyticsRes.json();
        throw new Error(errorData.error || 'No se pudieron cargar las estadísticas de la campaña.');
      }

      const rawAnalyticsData = await analyticsRes.json();

      // ✅ NORMALIZACIÓN CENTRAL - ÚNICA RESPONSABILIDAD DEL HOOK
      const normalizedData = normalizeAnalyticsData(rawAnalyticsData);
      
      setData(normalizedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refreshData: fetchData };
}