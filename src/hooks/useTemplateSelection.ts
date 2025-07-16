// src/hooks/useTemplateSelection.ts
import { useState, useEffect } from 'react';
import { TemplateService, CommunicationTemplate, CampaignAnalytics } from '@/services/TemplateService';
import { AnalyticsService } from '@/services/AnalyticsService';

export interface CampaignResults {
  overall_score: number;
  participation_rate: number;
  total_responses: number;
  total_invited: number;
  company_name: string;
  industry_benchmark: number;
  category_scores: {
    liderazgo: number;
    ambiente: number;
    desarrollo: number;
    bienestar: number;
  };
  // ✅ NUEVO: DEPARTAMENTOS DESDE API POTENCIADA
  department_scores?: {
    [dept: string]: number;
  };
  campaign_type?: string;
  industry?: string;
  confidence_level?: 'high' | 'medium' | 'low';
  created_date?: string;
  completion_time?: number;
}

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

export const useTemplateSelection = (campaignResults: CampaignResults): UseTemplateSelectionResult => {
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

      // 📊 PASO 1: ANÁLISIS MULTI-DIMENSIONAL
      const campaignAnalytics = AnalyticsService.analyzeCampaignResults(campaignResults);
      setAnalytics(campaignAnalytics);

      // 🗄️ PASO 2: CONSULTAR TEMPLATES BD
      const dbTemplates = await TemplateService.getActiveTemplates();
      
      if (dbTemplates.length === 0) {
        console.warn('No templates found in BD, using fallback');
        setTemplates(getFallbackTemplates(campaignResults));
        return;
      }

      // 🎯 PASO 3: SELECCIÓN BASADA REGLAS BD
      const selectedTemplates = TemplateService.selectTemplatesByRules(
        dbTemplates, 
        campaignAnalytics
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
      setError(err instanceof Error ? err.message : 'Error desconocido en selección templates');
      
      // 🔄 FALLBACK: Templates básicos si BD falla
      setTemplates(getFallbackTemplates(campaignResults));
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 REFRESH FUNCTION
  const refreshTemplates = async () => {
    await selectTemplates();
  };

  // ⚡ EFFECT: EJECUTAR AL CAMBIAR CAMPAIGN RESULTS
  useEffect(() => {
    if (campaignResults && campaignResults.overall_score !== undefined) {
      selectTemplates();
    }
  }, [
    campaignResults.overall_score,
    campaignResults.participation_rate,
    campaignResults.company_name,
    // ✅ NUEVO: REACT A CAMBIOS DEPARTAMENTOS
    JSON.stringify(campaignResults.department_scores),
    campaignResults.campaign_type
  ]);

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

// 🔄 FALLBACK TEMPLATES (SI BD NO DISPONIBLE)
function getFallbackTemplates(results: CampaignResults): CommunicationTemplate[] {
  const templates: CommunicationTemplate[] = [];
  const benchmark = results.industry_benchmark || 3.2;

  // Template score general
  if (results.overall_score >= 4.0) {
    templates.push({
      id: 'fallback-overall-positive',
      type: 'fortaleza_general',
      category: 'general',
      text: `💪 Excelente desempeño: ${results.company_name} logra ${results.overall_score.toFixed(1)}/5.0 puntos - Organización de alto rendimiento`,
      priority: 8
    });
  } else if (results.overall_score < 3.0) {
    templates.push({
      id: 'fallback-overall-opportunity',
      type: 'oportunidad_general',
      category: 'general',
      text: `🎯 Oportunidad mejora: Score ${results.overall_score.toFixed(1)}/5.0 requiere plan acción prioritario`,
      priority: 9
    });
  }

  // Template participación
  if (results.participation_rate >= 75) {
    templates.push({
      id: 'fallback-participation-high',
      type: 'participacion_alta',
      category: 'participacion',
      text: `📊 Excelente participación: ${Math.round(results.participation_rate)}% respuesta garantiza alta confiabilidad`,
      priority: 6
    });
  }

  // ✅ TEMPLATES DEPARTAMENTOS (NUEVO)
  if (results.department_scores && Object.keys(results.department_scores).length > 1) {
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
}

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

// 🔍 HOOK PARA ANALYTICS TEMPLATES
export const useTemplateAnalytics = (campaignId?: string) => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await TemplateService.getTemplateAnalytics(campaignId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching template analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId]);

  return {
    analytics,
    isLoading,
    refresh: fetchAnalytics
  };
};