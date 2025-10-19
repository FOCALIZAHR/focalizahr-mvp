// src/hooks/useTemplateSelection.ts
import { useState, useEffect } from 'react';
import { TemplateService, CommunicationTemplate, CampaignAnalytics } from '@/services/TemplateService';
import { AnalyticsService } from '@/services/AnalyticsService';
import type { CampaignResultsData } from '@/types'; // ← IMPORTACIÓN FUENTE DE VERDAD ÚNICA

export interface UseTemplateSelectionResult {
  templates: CommunicationTemplate[];
  isLoading: boolean;
  error: string | null;
  analytics: CampaignAnalytics | null;
  refreshTemplates: () => Promise<void>;
  campaignInsights: any[];
  departmentInsights: any[];
  actionableRecommendations: any[];
}

export const useTemplateSelection = (campaignData: CampaignResultsData | null): UseTemplateSelectionResult => {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [campaignInsights, setCampaignInsights] = useState<any[]>([]);
  const [departmentInsights, setDepartmentInsights] = useState<any[]>([]);
  const [actionableRecommendations, setActionableRecommendations] = useState<any[]>([]);

  // 🧠 FUNCIÓN PRINCIPAL SELECCIÓN TEMPLATES
  const selectTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar datos disponibles
      if (!campaignData?.analytics) {
        setError('Datos de campaña no disponibles');
        return;
      }

      // Construir campaignResults para compatibilidad con AnalyticsService
      const campaignResults = {
        overall_score: campaignData.analytics.averageScore,
        participation_rate: campaignData.analytics.participationRate,
        total_responses: campaignData.analytics.totalResponses,
        total_invited: campaignData.analytics.totalInvited,
        company_name: campaignData.campaign?.company?.name || 'Empresa',
        industry_benchmark: 3.5, // Default benchmark
        category_scores: campaignData.analytics.categoryScores,
        department_scores: campaignData.analytics.departmentScores,
        campaign_type: campaignData.campaign?.campaignType?.slug,
        industry: campaignData.campaign?.industry,
        created_date: campaignData.analytics.lastUpdated,
        completion_time: campaignData.analytics.completionTime
      };

      // 📊 PASO 1: ANÁLISIS MULTI-DIMENSIONAL
      const campaignAnalytics = AnalyticsService.analyzeCampaignResults(campaignResults);
      
      // ✅ FASE 3A: AGREGAR DEPARTMENT MAPPING AL CONTEXTO (ARQUITECTURA CORRECTA)
      if (campaignData?.analytics.departmentMapping) {
        campaignAnalytics.departmentMapping = campaignData.analytics.departmentMapping;
      }
      
      setAnalytics(campaignAnalytics);

      // ⚡ PASO 1.5: INTELIGENCIA AVANZADA CON DATOS REALES
      // ✅ FIXED: Usar datos reales en lugar de mock data
      let advancedIntelligence = null;
      
      // La API ya provee trendData y segmentationData reales
      if (campaignAnalytics.trendData && campaignAnalytics.segmentationData) {
        advancedIntelligence = AnalyticsService.calculateAdvancedIntelligence(
          campaignAnalytics
        );
        
        // Agregar variables avanzadas al contexto
        campaignAnalytics.advancedVariables = {
          energia_level: advancedIntelligence?.organizationalEnergy?.energia_actual || 0,
          momentum_increase: advancedIntelligence?.momentumAnalysis?.momentum_increase || 0,
          percentile_text: advancedIntelligence?.percentileAnalysis?.text || '',
          champion_dept: advancedIntelligence?.championAnalysis?.name || '',
          champion_score: advancedIntelligence?.championAnalysis?.score || 0,
          confidence_level: advancedIntelligence?.confidenceAnalysis?.level || 'medium'
        };
      }

      // 🗄️ PASO 2: CONSULTAR TEMPLATES BD ESPECÍFICOS
      const dbTemplates = await TemplateService.getTemplatesForCampaignType(campaignResults.campaign_type);
      
      if (dbTemplates.length === 0) {
        console.warn('No templates found in BD, using fallback');
        setTemplates(getFallbackTemplates(campaignResults));
        return;
      }

      // 🎯 PASO 3: SELECCIÓN BASADA REGLAS BD
      const selectedTemplates = TemplateService.selectTemplatesByRules(
        dbTemplates, 
        { ...campaignAnalytics, ...campaignAnalytics.advancedVariables }
      );

      // 🔄 PASO 4: PROCESAR VARIABLES
      const processedTemplates = selectedTemplates.map(template => 
        TemplateService.processVariables(template, campaignResults, campaignAnalytics)
      );

      // ✅ PASO 5: ANÁLISIS ADICIONALES
      const typeInsights = AnalyticsService.analyzeByCampaignType(campaignResults);
      const deptInsights = AnalyticsService.getDepartmentInsights(campaignResults);
      const recommendations = AnalyticsService.generateActionableRecommendations(campaignResults);

      // 📊 ACTUALIZAR ESTADOS
      setTemplates(processedTemplates);
      setCampaignInsights(typeInsights);
      setDepartmentInsights(deptInsights);
      setActionableRecommendations(recommendations);

    } catch (err) {
      console.error('Error in template selection:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Fallback en caso de error
      setTemplates(getFallbackTemplates(campaignResults));
    } finally {
      setIsLoading(false);
    }
  };

  // ♻️ FUNCIÓN REFRESH
  const refreshTemplates = async () => {
    await selectTemplates();
  };

  // 🚀 EJECUTAR AL MONTAR
  useEffect(() => {
    if (campaignData) {
      selectTemplates();
    }
  }, [campaignData]);

  return {
    templates,
    isLoading,
    error,
    analytics,
    refreshTemplates,
    campaignInsights,
    departmentInsights,
    actionableRecommendations
  };
};

// 🆘 FALLBACK TEMPLATES (SISTEMA RESILIENTE)
const getFallbackTemplates = (results: any): CommunicationTemplate[] => {
  const templates: CommunicationTemplate[] = [];
  const benchmark = results.industry_benchmark || 3.5;

  // Template score general
  if (results.overall_score < 3.0) {
    templates.push({
      id: 'fallback-score-bajo',
      type: 'score_bajo',
      category: 'general',
      text: `🎯 Oportunidad mejora: Score ${results.overall_score.toFixed(1)}/5.0 requiere plan acción prioritario`,
      priority: 10
    });
  } else if (results.overall_score >= 4.0) {
    templates.push({
      id: 'fallback-score-alto',
      type: 'score_alto', 
      category: 'general',
      text: `🌟 Excelente resultado: Score ${results.overall_score.toFixed(1)}/5.0 refleja cultura organizacional sólida`,
      priority: 5
    });
  }

  // Template participación
  if (results.participation_rate >= 70) {
    templates.push({
      id: 'fallback-participacion',
      type: 'participacion_alta',
      category: 'participacion',
      text: `📊 Excelente participación: ${results.participation_rate.toFixed(0)}% respuesta garantiza alta confiabilidad`,
      priority: 6
    });
  }

  // Templates departamentales (si disponibles)
  if (results.department_scores && Object.keys(results.department_scores).length > 0) {
    const deptEntries = Object.entries(results.department_scores);
    const strongest = deptEntries.reduce((prev, current) => 
      prev[1] > current[1] ? prev : current
    );
    const weakest = deptEntries.reduce((prev, current) => 
      prev[1] < current[1] ? prev : current
    );

    if (strongest[1] >= 4.0) {
      templates.push({
        id: 'fallback-dept-champion',
        type: 'departamento_campeon',
        category: 'departamentos',
        text: `🏆 Departamento líder: ${strongest[0]} destaca con ${strongest[1].toFixed(1)}/5.0 - Modelo organizacional`,
        priority: 7
      });
    }

    if (weakest[1] < 3.5) {
      templates.push({
        id: 'fallback-dept-opportunity',
        type: 'departamento_oportunidad', 
        category: 'departamentos',
        text: `🎯 Oportunidad departamental: ${weakest[0]} requiere atención (${weakest[1].toFixed(1)}/5.0)`,
        priority: 8
      });
    }
  }

  // Template benchmark
  const benchmarkDiff = results.overall_score - benchmark;
  if (benchmarkDiff > 0.5) {
    templates.push({
      id: 'fallback-benchmark-superior',
      type: 'benchmark_superior',
      category: 'benchmark',
      text: `🏆 Ventaja competitiva: ${results.company_name} supera benchmark sectorial por +${benchmarkDiff.toFixed(1)} puntos`,
      priority: 7
    });
  }

  return templates.slice(0, 5); // Máximo 5 fallback templates
};

// 🎯 HOOK ESPECIALIZADO PARA TRACKING
export const useTemplateTracking = (campaignId: string) => {
  const trackUsage = async (templateId: string, finalText: string, action: 'copied' | 'edited' | 'viewed' = 'copied') => {
    try {
      await TemplateService.trackTemplateUsage({
        templateId,
        campaignId,
        finalText,
        timestamp: new Date(),
        action
      });
    } catch (error) {
      console.error('Error tracking template usage:', error);
      // No throw - tracking no debe interrumpir UX
    }
  };

  return { trackUsage };
};