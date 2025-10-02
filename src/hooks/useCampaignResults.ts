// src/hooks/useCampaignResults.ts
// HOOK CORREGIDO - FUNCIÓN normalizeAnalyticsData COMPLETA

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { CampaignResultsData } from '@/types';


const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('focalizahr_token') || '';
  }
  return '';
};

// ✅ FUNCIÓN NORMALIZADORA CENTRAL COMPLETA - CAUSA RAÍZ SOLUCIONADA
function normalizeAnalyticsData(rawAnalyticsData: any): CampaignResultsData {
  console.log('🔍 Iniciando normalización de datos:', rawAnalyticsData);
  
  const rawMetrics = rawAnalyticsData.metrics || {};
  const rawCampaign = rawAnalyticsData.campaign || {};
  
  // 🔧 MAPEO CORRECTO CAMPAIGN.CAMPAIGNTYPE DESDE META
  const campaignData = {
    ...rawCampaign,
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

  // ✅ NORMALIZACIÓN TREND DATA COMPLETA - FIX PRINCIPAL
  const trendData = Array.isArray(rawMetrics.trendData) 
    ? rawMetrics.trendData.map((item: any) => ({
        date: String(item?.date || ''),
        responses: Number(item?.responses) || 0,
        score: Number(item?.score) || 0
      }))
    : [];

  // ✅ NORMALIZACIÓN TREND DATA BY DEPARTMENT
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

  // ✅ CONSTRUCCIÓN OBJETO NORMALIZADO FINAL
  const normalizedData = {
    campaign: campaignData,
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
      departmentScoresDisplay,
      departmentMapping: rawMetrics.departmentMapping || {},
      trendData,
      trendDataByDepartment,
      responsesByDay,
      segmentationData: Array.isArray(rawMetrics.segmentationData) ? rawMetrics.segmentationData : [],
      demographicBreakdown: Array.isArray(rawMetrics.demographicBreakdown) ? rawMetrics.demographicBreakdown : [],
       // 🆕 CAMPOS JERÁRQUICOS CRÍTICOS:
      hierarchicalData: rawMetrics.hierarchicalData || null,
      hasHierarchy: rawMetrics.hasHierarchy || false,

      lastUpdated: rawMetrics.lastUpdated || new Date().toISOString()
    }
  };

  console.log('✅ Datos normalizados exitosamente:', normalizedData);
  return normalizedData;
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
      console.log('🔄 Iniciando fetch de analytics para campaignId:', campaignId);
      
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No token found, redirecting to login');
        router.push('/login');
        return;
      }

      const analyticsRes = await fetch(`/api/campaigns/${campaignId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📡 Response status:', analyticsRes.status);

      if (!analyticsRes.ok) {
        if (analyticsRes.status === 401) {
          console.error('❌ 401 Unauthorized, redirecting to login');
          router.push('/login');
          return;
        }
        const errorData = await analyticsRes.json();
        throw new Error(errorData.error || 'No se pudieron cargar las estadísticas de la campaña.');
      }

      const rawAnalyticsData = await analyticsRes.json();
      console.log('📊 Raw analytics data received:', rawAnalyticsData);
      // 🆕 AGREGA ESTOS 3 LOGS:
      console.log('🔍 Tiene hierarchicalData?', !!rawAnalyticsData?.metrics?.hierarchicalData);
      console.log('🔍 hasHierarchy value:', rawAnalyticsData?.metrics?.hasHierarchy);
      console.log('🔍 hierarchicalData length:', rawAnalyticsData?.metrics?.hierarchicalData?.length);

      // ✅ NORMALIZACIÓN CENTRAL - ÚNICA RESPONSABILIDAD DEL HOOK
      const normalizedData = normalizeAnalyticsData(rawAnalyticsData);
      
      console.log('🎯 Setting normalized data to state');
      setData(normalizedData);

    } catch (err) {
      console.error('❌ Error in useCampaignResults:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ LOGGING DE ESTADO PARA DEBUGGING
  useEffect(() => {
    console.log('📊 useCampaignResults state update:', {
      hasData: !!data,
      isLoading,
      error,
      campaignId
    });
  }, [data, isLoading, error, campaignId]);

  return { data, isLoading, error, refreshData: fetchData };
}