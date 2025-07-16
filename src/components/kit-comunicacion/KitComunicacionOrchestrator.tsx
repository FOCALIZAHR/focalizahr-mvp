// src/components/kit-comunicacion/KitComunicacionOrchestrator.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { useTemplateSelection, useTemplateTracking } from '@/hooks/useTemplateSelection';
import TemplateCard from './components/TemplateCard';     // ✅ SIN llaves
import LoadingState from './components/LoadingState';     // ✅ SIN llaves



// ✅ INTERFACES SIMPLIFICADAS
interface CampaignResults {
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
  // ✅ NUEVO: DEPARTAMENTOS API POTENCIADA
  department_scores?: {
    [dept: string]: number;
  };
  campaign_type?: string;
  industry?: string;
}

interface Props {
  campaignId: string;
  campaignResults: CampaignResults;
  onTemplateUsed?: (templateId: string, finalText: string) => void;
}

// 🎭 COMPONENTE DIRECTOR ORQUESTA
const KitComunicacionOrchestrator: React.FC<Props> = ({
  campaignId,
  campaignResults,
  onTemplateUsed
}) => {
  // 🧠 DELEGACIÓN A HOOKS ESPECIALIZADOS
  const { 
    templates, 
    isLoading, 
    error, 
    analytics,
    departmentInsights,
    refreshTemplates 
  } = useTemplateSelection(campaignResults);
  
  const { trackUsage } = useTemplateTracking(campaignId);

  // 🎯 HANDLER UNIFICADO
  const handleTemplateUsed = async (templateId: string, finalText: string) => {
    await trackUsage(templateId, finalText, 'copied');
    onTemplateUsed?.(templateId, finalText);
  };

  // 🚦 ESTADOS UI
  if (isLoading) return <LoadingState />;
  
  if (error) {
    return (
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-200">
          Error cargando templates: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // 🎨 RENDER DELEGADO
  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          Kit Comunicación FocalizaHR
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Templates inteligentes basados en análisis multi-dimensional
          {analytics?.departmentScores && Object.keys(analytics.departmentScores).length > 0 && (
            <span className="text-purple-300"> • Incluye análisis departamental</span>
          )}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {templates.length === 0 ? (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                No se pudieron generar templates con los datos disponibles.
              </AlertDescription>
            </Alert>
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onTemplateUsed={handleTemplateUsed}
                campaignType={campaignResults.campaign_type}
              />
            ))
          )}
        </div>

        {/* Footer informativo con nueva capacidad departamental */}
        <Alert className="border-cyan-500/50 bg-cyan-500/10 mt-6">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-200">
            <strong>Kit Comunicación v2.0 - Arquitectura Limpia:</strong> Templates desde BD con 
            lógica configurable, variables dinámicas y análisis departamental automatizado.
            {analytics && (
              <>
                <br />
                📊 <strong>Analytics:</strong> {templates.length} templates generados, 
                confianza {analytics.confidenceLevel}, participación {analytics.participationLevel}
                {Object.keys(analytics.departmentScores).length > 0 && (
                  <>, análisis {Object.keys(analytics.departmentScores).length} departamentos</>
                )}
              </>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default KitComunicacionOrchestrator;