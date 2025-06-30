// DASHBOARD WIDGET - MATRIZ DE INTELIGENCIA 5 CLAVES
// FocalizaHR Retención Predictiva - Análisis "Oro Puro"
// Archivo: src/components/dashboard/DashboardWidget_ExitInsights.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Copy, 
  Eye,
  Info,
  CheckCircle2,
  DollarSign,
  Users,
  Zap,
  Brain,
  ArrowRight
} from 'lucide-react';

// Interface para la Matriz de Inteligencia (5 claves)
interface IntelligenceMatrix {
  nombre_insight: string;
  diagnostico: string;
  implicacion_estrategica: string;
  recomendacion_accionable: string;
}

// Interface para el insight completo con variables pobladas
interface ExitInsight {
  id: string;
  template_type: string;
  category: string;
  condition_rule: string;
  intelligence_matrix: IntelligenceMatrix;
  variables_used: { [key: string]: string | number };
  confidence_score: number;
  priority: number;
  generated_at: string;
}

// Props del widget
interface DashboardWidget_ExitInsightsProps {
  campaignId?: string;
  insights?: ExitInsight[];
  isLoading?: boolean;
  className?: string;
  onInsightAction?: (insightId: string, action: string) => void;
}

const DashboardWidget_ExitInsights: React.FC<DashboardWidget_ExitInsightsProps> = ({
  campaignId,
  insights = [],
  isLoading = false,
  className = '',
  onInsightAction
}) => {
  const [copiedInsight, setCopiedInsight] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Mock data para desarrollo - Estructura completa Matriz de Inteligencia
  const mockInsights: ExitInsight[] = [
    {
      id: 'insight_001',
      template_type: 'alerta_fuga_estancamiento',
      category: 'desarrollo_evp',
      condition_rule: 'score_question_5 < 2.5 AND keyword_match > 30%',
      intelligence_matrix: {
        nombre_insight: "Alerta Crítica: Fuga de Talento por Estancamiento Profesional",
        diagnostico: "Hemos detectado un patrón crítico en el equipo de **Tecnología**. La percepción sobre 'Oportunidades de Crecimiento' es extremadamente baja, con un score promedio de solo **2.1** sobre 5. Esto se confirma con el análisis de texto, donde el **67%** de los colaboradores que se van mencionan esto como su razón principal.",
        implicacion_estrategica: "Esto representa una hemorragia de talento crítico. Nuestra data muestra que el **85%** de la rotación en este equipo es 'Lamentada' (alto rendimiento), con un costo estimado de **$45,000** solo en este trimestre.",
        recomendacion_accionable: "Se requiere una **intervención urgente** con la gerencia de **Tecnología**. Se recomienda: 1) Realizar 'entrevistas de permanencia' con el talento de alto rendimiento restante. 2) Diseñar y comunicar un mapa de carrera técnico claro para los roles de **Desarrollador Senior**."
      },
      variables_used: {
        department_name: "Tecnología",
        score_question_5: 2.1,
        keyword_percentage: 67,
        tasa_rotacion_lamentada: 85,
        costo_rotacion_estimado: 45000,
        role_name: "Desarrollador Senior"
      },
      confidence_score: 0.92,
      priority: 10,
      generated_at: new Date().toISOString()
    },
    {
      id: 'insight_002',
      template_type: 'alerta_liderazgo_toxico',
      category: 'liderazgo',
      condition_rule: 'score_question_4 < 2.0 AND keyword_match > 25%',
      intelligence_matrix: {
        nombre_insight: "Alerta Crítica: Toxicidad en Liderazgo Detectada",
        diagnostico: "Se ha identificado un patrón preocupante en **Ventas** donde el liderazgo directo obtiene una calificación crítica de **1.8** sobre 5. El **43%** de las renuncias mencionan explícitamente problemas con la supervisión directa.",
        implicacion_estrategica: "El liderazgo tóxico genera un efecto dominó: **78%** de rotación no deseada, clima laboral deteriorado y potencial exposición legal. El costo directo estimado supera **$32,000** solo en este trimestre.",
        recomendacion_accionable: "**Acción inmediata requerida**: 1) Evaluación 360° del liderazgo en **Ventas**. 2) Coaching ejecutivo intensivo o reubicación del supervisor. 3) Entrevistas de retención con colaboradores clave restantes antes de 30 días."
      },
      variables_used: {
        department_name: "Ventas",
        score_question_4: 1.8,
        keyword_percentage: 43,
        tasa_rotacion_lamentada: 78,
        costo_rotacion_estimado: 32000
      },
      confidence_score: 0.88,
      priority: 10,
      generated_at: new Date().toISOString()
    }
  ];

  // Usar insights reales o mock data
  const displayInsights = insights.length > 0 ? insights : mockInsights;

  // Función para copiar insight completo al clipboard
  const handleCopyInsight = async (insight: ExitInsight) => {
    const matrix = insight.intelligence_matrix;
    const textToCopy = `
${matrix.nombre_insight}

DIAGNÓSTICO:
${matrix.diagnostico}

IMPLICACIÓN ESTRATÉGICA:
${matrix.implicacion_estrategica}

RECOMENDACIÓN ACCIONABLE:
${matrix.recomendacion_accionable}

---
Generado por FocalizaHR Retención Predictiva
Confianza: ${Math.round(insight.confidence_score * 100)}%
    `.trim();
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedInsight(insight.id);
      setTimeout(() => setCopiedInsight(null), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Determinar el ícono apropiado por template_type
  const getInsightIcon = (templateType: string) => {
    switch (templateType) {
      case 'alerta_fuga_estancamiento':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      case 'alerta_liderazgo_toxico':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'gap_reconocimiento_critico':
        return <Target className="h-5 w-5 text-yellow-400" />;
      default:
        return <Brain className="h-5 w-5 text-blue-400" />;
    }
  };

  // Determinar el color del badge por prioridad
  const getPriorityColor = (priority: number) => {
    if (priority >= 10) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (priority >= 7) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  };

  // Formatear variables para display
  const formatVariable = (key: string, value: string | number) => {
    if (key.includes('score') && typeof value === 'number') {
      return `${value}/5.0`;
    }
    if (key.includes('percentage') && typeof value === 'number') {
      return `${value}%`;
    }
    if (key.includes('costo') && typeof value === 'number') {
      return `$${value.toLocaleString()}`;
    }
    return value.toString();
  };

  // Estado de loading
  if (isLoading) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-slate-600 rounded animate-pulse" />
            <div className="h-6 w-48 bg-slate-600 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border border-slate-600 rounded-lg space-y-3">
                <div className="h-5 w-3/4 bg-slate-600 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-600 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-600 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado vacío
  if (displayInsights.length === 0) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Brain className="h-6 w-6 text-gray-400" />
            Matriz de Inteligencia - Retención Predictiva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-gray-600 bg-gray-800/50">
            <Info className="h-4 w-4 text-gray-400" />
            <AlertDescription className="text-gray-300">
              Los insights de inteligencia aparecerán aquí una vez que se complete al menos una encuesta 
              del tipo "FocalizaHR Retención Predictiva" y se evalúen las condiciones de los templates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-3">
            <Brain className="h-6 w-6 text-cyan-400" />
            Matriz de Inteligencia - Retención Predictiva
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
              {displayInsights.length} insight{displayInsights.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              Análisis "Oro Puro"
            </Badge>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          Análisis predictivo avanzado basado en metodología científica de exit interviews
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {displayInsights.map((insight) => {
          const matrix = insight.intelligence_matrix;
          const isExpanded = expandedInsight === insight.id;
          
          return (
            <div 
              key={insight.id}
              className="p-6 rounded-lg border border-slate-600 bg-slate-900/30 hover:bg-slate-900/50 transition-all"
            >
              {/* Header del Insight */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getInsightIcon(insight.template_type)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg leading-tight mb-2">
                      {matrix.nombre_insight}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getPriorityColor(insight.priority)}>
                        Prioridad: {insight.priority}/10
                      </Badge>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                        Confianza: {Math.round(insight.confidence_score * 100)}%
                      </Badge>
                      <Badge variant="outline" className="border-gray-500/50 text-gray-400">
                        {insight.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. DIAGNÓSTICO */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-yellow-400" />
                  <h4 className="font-medium text-yellow-400">DIAGNÓSTICO</h4>
                </div>
                <div 
                  className="text-sm text-gray-300 leading-relaxed p-3 bg-slate-800/50 rounded border-l-4 border-yellow-400"
                  dangerouslySetInnerHTML={{ 
                    __html: matrix.diagnostico.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>') 
                  }}
                />
              </div>

              {/* 2. IMPLICACIÓN ESTRATÉGICA */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-red-400" />
                  <h4 className="font-medium text-red-400">IMPLICACIÓN ESTRATÉGICA</h4>
                </div>
                <div 
                  className="text-sm text-gray-300 leading-relaxed p-3 bg-slate-800/50 rounded border-l-4 border-red-400"
                  dangerouslySetInnerHTML={{ 
                    __html: matrix.implicacion_estrategica.replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-300">$1</strong>') 
                  }}
                />
              </div>

              {/* 3. RECOMENDACIÓN ACCIONABLE */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-green-400" />
                  <h4 className="font-medium text-green-400">RECOMENDACIÓN ACCIONABLE</h4>
                </div>
                <div 
                  className="text-sm text-gray-300 leading-relaxed p-3 bg-slate-800/50 rounded border-l-4 border-green-400"
                  dangerouslySetInnerHTML={{ 
                    __html: matrix.recomendacion_accionable.replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-300">$1</strong>') 
                  }}
                />
              </div>

              {/* Variables Dinámicas (Expandible) */}
              {isExpanded && (
                <div className="mb-4">
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-blue-400" />
                    <h4 className="font-medium text-blue-400">VARIABLES UTILIZADAS</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(insight.variables_used).map(([key, value]) => (
                      <div key={key} className="text-xs p-2 bg-slate-800 rounded border border-slate-600">
                        <div className="text-gray-400">{key}</div>
                        <div className="text-white font-medium">{formatVariable(key, value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-600">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {isExpanded ? 'Ocultar detalles' : 'Ver variables'}
                  <ArrowRight className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </Button>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCopyInsight(insight)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {copiedInsight === insight.id ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar análisis
                      </>
                    )}
                  </Button>
                  
                  {onInsightAction && (
                    <Button 
                      size="sm" 
                      onClick={() => onInsightAction(insight.id, 'create_action_plan')}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Plan de acción
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer informativo */}
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Brain className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            <strong>Inteligencia Predictiva:</strong> Estos análisis se generan automáticamente evaluando 
            las condiciones definidas en los templates y poblando variables dinámicas con datos contextuales 
            de su organización. Confianza promedio: {Math.round(displayInsights.reduce((acc, i) => acc + i.confidence_score, 0) / displayInsights.length * 100)}%
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DashboardWidget_ExitInsights;