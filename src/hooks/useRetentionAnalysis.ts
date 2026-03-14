// src/hooks/useRetentionAnalysis.ts
// 🧠 FASE 2: AISLAR LA LÓGICA DE NEGOCIO - HOOK DEDICADO ARQUITECTURA V3.0
// SEPARACIÓN LÓGICA Y PRESENTACIÓN (Anexo A)

import { useState, useEffect } from 'react';
import { RetentionEngine } from '@/engines/RetentionEngine';
import type { CampaignResultsData } from '@/types';
import { RetentionAnalysisResult } from '@/types/BusinessCase';

/**
 * Hook dedicado para análisis de retención
 * PRINCIPIO: Separación estricta lógica/presentación
 * EVOLUCIÓN: Lógica inline → Hook reutilizable
 */
export function useRetentionAnalysis(data: CampaignResultsData | null): RetentionAnalysisResult | null {
  const [analysisResult, setAnalysisResult] = useState<RetentionAnalysisResult | null>(null);

  useEffect(() => {
    // ✅ VALIDACIÓN DATOS Y TIPO CAMPAÑA
    if (!data || !data.campaign || !data.analytics) {
      console.log('🔍 useRetentionAnalysis: No hay datos válidos');
      setAnalysisResult(null);
      return;
    }

    // ✅ VERIFICACIÓN DE TIPO DE CAMPAÑA ROBUSTA
    let campaignTypeIdentifier = '';
    const campaignType = data.campaign.campaignType;

    // campaignType SIEMPRE es un objeto CampaignType (relación Prisma), nunca string
    if (campaignType && typeof campaignType === 'object' &&
      ('name' in campaignType || 'slug' in campaignType)) {
      const typeObj = campaignType as { name?: string; slug?: string };
      campaignTypeIdentifier = (typeObj.name || typeObj.slug || '').toLowerCase();
    }

    const isRetentionCampaign = campaignTypeIdentifier.includes('retencion') || campaignTypeIdentifier.includes('retención');

    console.log('🔍 useRetentionAnalysis: Verificación tipo campaña:', {
      campaignType,
      campaignTypeIdentifier,
      isRetentionCampaign
    });

    if (!isRetentionCampaign) {
      console.log('🔍 useRetentionAnalysis: No es campaña de retención, saltando análisis');
      setAnalysisResult(null);
      return;
    }

    // ✅ CONSTRUCCIÓN OBJETO PARA RETENTIONENGINE
    const engineInput = {
      overall_score: data.analytics.averageScore,
      participation_rate: data.analytics.participationRate,
      total_responses: data.analytics.totalResponded,
      total_invited: data.analytics.totalInvited,
      company_name: data.campaign.company?.name || 'Empresa',
      industry_benchmark: 3.2, // TODO: Obtener de configuración en el futuro
      category_scores: data.analytics.categoryScores || {
        liderazgo: 0,
        ambiente: 0,
        desarrollo: 0,
        bienestar: 0,
        reconocimiento: 0,
        seguridad_psicologica: 0,
        autonomia: 0
      }
    };

    console.log('🔍 useRetentionAnalysis: Llamando RetentionEngine.analyze con:', engineInput);

    // ✅ EJECUTAR ANÁLISIS CON RETENTIONENGINE (ahora async)
    let cancelled = false;

    RetentionEngine.analyze(engineInput)
      .then(result => {
        if (cancelled) return;
        console.log('✅ useRetentionAnalysis: Análisis completado:', {
          businessCasesCount: result.businessCases?.length || 0,
          globalRisk: result.globalRetentionRisk,
          urgency: result.interventionUrgency
        });
        setAnalysisResult(result);
      })
      .catch(error => {
        if (cancelled) return;
        console.error('❌ useRetentionAnalysis: Error en análisis:', error);
        setAnalysisResult(null);
      });

    return () => { cancelled = true; };
  }, [data]);

  return analysisResult;
}
