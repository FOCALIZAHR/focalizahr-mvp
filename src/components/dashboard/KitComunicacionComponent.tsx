'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Copy, 
  Edit, 
  Save, 
  X, 
  MessageSquare, 
  Target, 
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

// Interfaces para el Kit Comunicación
interface CommunicationTemplate {
  id: string;
  type: 'fortaleza' | 'oportunidad' | 'benchmark_superior' | 'benchmark_inferior' | 'participacion_alta' | 'participacion_media' | 'excelencia_general';
  category: string;
  text: string;
  priority: number;
  variables?: { [key: string]: any };
}

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
  // ✅ NUEVOS DATOS INTELIGENTES DISPONIBLES
  campaign_type?: string;
  industry?: string;
  confidence_level?: 'high' | 'medium' | 'low';
  segmentationData?: Array<{
    segment: string;
    count: number;
    avgScore: number;
    percentage: number;
  }>;
  trendData?: Array<{
    date: string;
    responses: number;
    cumulativeParticipation: number;
  }>;
  created_date?: string;
  completion_time?: number;
  response_rate?: number;
}

interface KitComunicacionProps {
  campaignId: string;
  campaignResults: CampaignResults;
  onTemplateUsed?: (templateId: string, finalText: string) => void;
}

const KitComunicacionComponent: React.FC<KitComunicacionProps> = ({
  campaignId,
  campaignResults,
  onTemplateUsed
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState<CommunicationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para reemplazar variables en templates - INTELIGENCIA EXPANDIDA
  const replaceVariables = (text: string, variables: any, campaignResults: CampaignResults) => {
    return text
      .replace(/{company_name}/g, campaignResults.company_name || 'su empresa')
      .replace(/{participation}/g, Math.round(campaignResults.participation_rate).toString())
      .replace(/{total_responses}/g, campaignResults.total_responses.toString())
      .replace(/{total_invited}/g, campaignResults.total_invited.toString())
      // Variables adicionales básicas:
      .replace(/{date}/g, new Date().toLocaleDateString('es-CL'))
      .replace(/{overall_score}/g, campaignResults.overall_score.toFixed(1))
      .replace(/{benchmark}/g, campaignResults.industry_benchmark.toFixed(1))
      // Variables del template específico:
      .replace(/{category}/g, variables?.category || '')
      .replace(/{score}/g, variables?.score?.toFixed(1) || '')
      .replace(/{difference}/g, variables?.difference?.toFixed(1) || '')
      // ✅ NUEVAS VARIABLES INTELIGENTES:
      .replace(/{campaign_type}/g, campaignResults.campaign_type || '')
      .replace(/{industry}/g, campaignResults.industry || '')
      .replace(/{confidence_level}/g, campaignResults.confidence_level || 'medium')
      .replace(/{completion_time}/g, campaignResults.completion_time?.toFixed(1) || '')
      .replace(/{created_date}/g, campaignResults.created_date || '')
      // Variables calculadas dinámicamente:
      .replace(/{percentile_text}/g, variables?.percentileText || '')
      .replace(/{urgency_text}/g, variables?.urgencyText || '')
      .replace(/{champion_dept}/g, variables?.champion_dept || '')
      .replace(/{opportunity_dept}/g, variables?.opportunity_dept || '')
      .replace(/{momentum_increase}/g, variables?.momentum_increase || '')
      .replace(/{sample_size}/g, variables?.sample_size?.toString() || '');
  };

  // ✅ FUNCIONES INTELIGENCIA AVANZADA
  const generateCampaignTypeInsights = (results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    
    if (results.campaign_type) {
      switch (results.campaign_type.toLowerCase()) {
        case 'pulso express':
          if (results.overall_score >= 4.0) {
            templates.push({
              id: 'pulso-positivo',
              type: 'excelencia_general',
              category: 'campaign-specific',
              text: `🚀 Pulso organizacional positivo: Score ${results.overall_score.toFixed(1)}/5.0 indica ambiente saludable y productivo`,
              priority: 8,
              variables: { campaign_type: results.campaign_type }
            });
          } else if (results.overall_score < 3.0) {
            templates.push({
              id: 'pulso-alerta',
              type: 'oportunidad',
              category: 'campaign-specific',
              text: `⚠️ Pulso requiere atención: Score ${results.overall_score.toFixed(1)}/5.0 sugiere implementar plan de mejora inmediato`,
              priority: 9,
              variables: { campaign_type: results.campaign_type }
            });
          }
          break;
          
        case 'experiencia colaborador':
          const topCategory = Object.entries(results.category_scores)
            .sort(([,a], [,b]) => b - a)[0];
          if (topCategory && topCategory[1] >= 4.0) {
            templates.push({
              id: 'experiencia-destacada',
              type: 'fortaleza',
              category: 'campaign-specific',
              text: `✨ Experiencia colaborador destacada: ${topCategory[0]} sobresale (${topCategory[1].toFixed(1)}/5.0) como pilar de la experiencia`,
              priority: 8,
              variables: { strongestCategory: topCategory[0] }
            });
          }
          break;
          
        case 'retención predictiva':
          // Análisis específico para retención
          const avgRetention = results.overall_score;
          if (avgRetention >= 4.0) {
            templates.push({
              id: 'retencion-solida',
              type: 'excelencia_general',
              category: 'campaign-specific',
              text: `🛡️ Indicadores de retención sólidos: Score ${avgRetention.toFixed(1)}/5.0 sugiere baja probabilidad de rotación voluntaria`,
              priority: 9,
              variables: { retention_score: avgRetention }
            });
          } else if (avgRetention < 3.0) {
            templates.push({
              id: 'riesgo-retencion',
              type: 'oportunidad',
              category: 'campaign-specific',
              text: `🚨 Riesgo de retención detectado: Score ${avgRetention.toFixed(1)}/5.0 requiere estrategia de retención inmediata`,
              priority: 11,
              variables: { retention_score: avgRetention }
            });
          }
          break;
      }
    }
    
    return templates;
  };

  const generateSegmentationInsights = (results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    
    if (results.segmentationData && results.segmentationData.length > 1) {
      // Encontrar el departamento con mejor y peor score
      const bestDept = results.segmentationData.reduce((prev, current) => 
        (prev.avgScore > current.avgScore) ? prev : current
      );
      const worstDept = results.segmentationData.reduce((prev, current) => 
        (prev.avgScore < current.avgScore) ? prev : current
      );
      
      // Insight del mejor departamento
      if (bestDept.avgScore >= 4.0 && bestDept.percentage >= 15) {
        templates.push({
          id: 'dept-champion',
          type: 'fortaleza',
          category: 'segmentation',
          text: `🏆 ${bestDept.segment} lidera en satisfacción (${bestDept.avgScore.toFixed(1)}/5.0) - Modelo a replicar en organización`,
          priority: 7,
          variables: { champion_dept: bestDept.segment, champion_score: bestDept.avgScore }
        });
      }
      
      // Insight del departamento con oportunidad
      if (worstDept.avgScore < 3.5 && worstDept.percentage >= 10) {
        templates.push({
          id: 'dept-opportunity',
          type: 'oportunidad',
          category: 'segmentation',
          text: `🎯 ${worstDept.segment} presenta oportunidad de mejora (${worstDept.avgScore.toFixed(1)}/5.0) - Priorizar en plan de acción`,
          priority: 8,
          variables: { opportunity_dept: worstDept.segment, opportunity_score: worstDept.avgScore }
        });
      }
      
      // Análisis de dispersión entre departamentos
      const scoreDifference = bestDept.avgScore - worstDept.avgScore;
      if (scoreDifference > 1.0) {
        templates.push({
          id: 'dept-dispersion',
          type: 'oportunidad',
          category: 'segmentation',
          text: `📊 Variabilidad significativa entre departamentos (${scoreDifference.toFixed(1)} puntos) - Oportunidad de estandarización`,
          priority: 6,
          variables: { score_difference: scoreDifference }
        });
      }
    }
    
    return templates;
  };

  const generateTrendInsights = (results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    
    if (results.trendData && results.trendData.length >= 5) {
      const recentDays = results.trendData.slice(-3);
      const initialDays = results.trendData.slice(0, 3);
      
      const recentAvg = recentDays.reduce((sum, day) => sum + day.responses, 0) / recentDays.length;
      const initialAvg = initialDays.reduce((sum, day) => sum + day.responses, 0) / initialDays.length;
      
      // Análisis de momentum de participación
      if (recentAvg > initialAvg * 1.5) {
        templates.push({
          id: 'momentum-creciente',
          type: 'participacion_alta',
          category: 'trend',
          text: `📈 Momentum creciente: Participación se acelera (+${((recentAvg/initialAvg - 1) * 100).toFixed(0)}% últimos días)`,
          priority: 6,
          variables: { momentum_increase: ((recentAvg/initialAvg - 1) * 100).toFixed(0) }
        });
      } else if (recentAvg < initialAvg * 0.7) {
        templates.push({
          id: 'momentum-decreciente',
          type: 'oportunidad',
          category: 'trend',
          text: `⚠️ Momentum disminuye: Considerar estrategia de re-engagement para mantener participación`,
          priority: 7,
          variables: { momentum_decrease: ((1 - recentAvg/initialAvg) * 100).toFixed(0) }
        });
      }
      
      // Análisis de consistencia
      const lastDay = results.trendData[results.trendData.length - 1];
      if (lastDay.cumulativeParticipation >= results.total_invited * 0.8) {
        templates.push({
          id: 'participacion-sostenida',
          type: 'participacion_alta',
          category: 'trend',
          text: `⭐ Participación sostenida exitosa: ${Math.round((lastDay.cumulativeParticipation / results.total_invited) * 100)}% alcanzado`,
          priority: 5,
          variables: { sustained_participation: Math.round((lastDay.cumulativeParticipation / results.total_invited) * 100) }
        });
      }
    }
    
    return templates;
  };

  const generateConfidenceInsights = (results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    
    // Calcular nivel de confianza basado en participación y tamaño muestra
    let confidenceLevel = 'medium';
    let confidenceText = '';
    
    if (results.participation_rate >= 75 && results.total_responses >= 30) {
      confidenceLevel = 'high';
      confidenceText = 'Alta confiabilidad estadística - Resultados altamente representativos';
    } else if (results.participation_rate >= 60 && results.total_responses >= 20) {
      confidenceLevel = 'medium';
      confidenceText = 'Confiabilidad estadística buena - Resultados representativos';
    } else if (results.total_responses >= 10) {
      confidenceLevel = 'low';
      confidenceText = 'Confiabilidad limitada - Considerar aumentar participación para mayor precisión';
    } else {
      confidenceLevel = 'very_low';
      confidenceText = 'Muestra insuficiente - Resultados orientativos únicamente';
    }
    
    // Agregar insight de confianza
    templates.push({
      id: 'confianza-estadistica',
      type: confidenceLevel === 'high' ? 'participacion_alta' : 'participacion_media',
      category: 'statistical',
      text: `📊 ${confidenceText} (${results.total_responses} respuestas, ${Math.round(results.participation_rate)}% participación)`,
      priority: confidenceLevel === 'high' ? 4 : confidenceLevel === 'medium' ? 5 : 6,
      variables: { confidence_level: confidenceLevel, sample_size: results.total_responses }
    });
    
    return templates;
  };

  // Función para seleccionar templates automáticamente - INTELIGENCIA MEJORADA
  const selectCommunicationTemplates = (results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    const benchmark = results.industry_benchmark || 3.2;
    
    // ✅ ANÁLISIS INTELIGENTE TIPO CAMPAÑA
    const campaignTypeInsights = generateCampaignTypeInsights(results);
    templates.push(...campaignTypeInsights);
    
    // ✅ ANÁLISIS SEGMENTACIÓN INTELIGENTE
    const segmentationInsights = generateSegmentationInsights(results);
    templates.push(...segmentationInsights);
    
    // ✅ ANÁLISIS TENDENCIA TEMPORAL
    const trendInsights = generateTrendInsights(results);
    templates.push(...trendInsights);
    
    // ✅ ANÁLISIS CONFIDENCE LEVEL
    const confidenceInsights = generateConfidenceInsights(results);
    templates.push(...confidenceInsights);
    
    // 1. FORTALEZAS (score >= 4.0) - INTELIGENCIA MEJORADA
    Object.entries(results.category_scores).forEach(([category, score]) => {
      if (score >= 4.0) {
        const percentileText = score >= 4.5 ? " (percentil 90+)" : score >= 4.2 ? " (percentil 75+)" : "";
        const benchmarkDiff = score - benchmark;
        const competitiveText = benchmarkDiff > 0.5 ? " - Ventaja competitiva significativa" : 
                               benchmarkDiff > 0.2 ? " - Por encima del promedio sectorial" : "";
        
        const templateText = `💪 Fortaleza sobresaliente: Su equipo destaca en ${category} con ${score.toFixed(1)}/5.0${percentileText}${competitiveText}`;
        templates.push({
          id: `fortaleza-${category}`,
          type: 'fortaleza',
          category: category,
          text: templateText,
          priority: score >= 4.5 ? 12 : 10,
          variables: { category, score, benchmarkDiff, percentileText }
        });
      }
    });
    
    // 2. OPORTUNIDADES (score < 3.0) - INTELIGENCIA MEJORADA
    Object.entries(results.category_scores).forEach(([category, score]) => {
      if (score < 3.0) {
        const urgencyText = score < 2.5 ? "CRÍTICA" : score < 2.8 ? "ALTA" : "MEDIA";
        const gapSize = benchmark - score;
        const impactText = gapSize > 1.0 ? " - Gap significativo vs industria" : 
                          gapSize > 0.5 ? " - Oportunidad vs benchmark sectorial" : "";
        
        const templateText = `🎯 Oportunidad ${urgencyText}: ${category} requiere atención prioritaria (${score.toFixed(1)}/5.0)${impactText}`;
        templates.push({
          id: `oportunidad-${category}`,
          type: 'oportunidad',
          category: category,
          text: templateText,
          priority: score < 2.5 ? 12 : 10,
          variables: { category, score, urgencyText, gapSize }
        });
      }
    });
    
    // 3. PARTICIPACIÓN INTELIGENTE CON CONTEXTO
    if (results.participation_rate >= 85) {
      const templateText = `📊 Participación excepcional: ${Math.round(results.participation_rate)}% del equipo completó el análisis - Máxima confiabilidad estadística garantizada`;
      templates.push({
        id: 'participacion-excepcional',
        type: 'participacion_alta',
        category: 'general',
        text: templateText,
        priority: 8,
        variables: { participation: results.participation_rate }
      });
    } else if (results.participation_rate >= 75) {
      const templateText = `✅ Excelente participación: ${Math.round(results.participation_rate)}% de respuesta permite análisis estadísticamente robusto`;
      templates.push({
        id: 'participacion-alta',
        type: 'participacion_alta',
        category: 'general',
        text: templateText,
        priority: 6,
        variables: { participation: results.participation_rate }
      });
    } else if (results.participation_rate >= 60) {
      const templateText = `📈 Participación satisfactoria: ${Math.round(results.participation_rate)}% de respuesta - Resultados representativos con validez estadística`;
      templates.push({
        id: 'participacion-media',
        type: 'participacion_media',
        category: 'general',
        text: templateText,
        priority: 5,
        variables: { participation: results.participation_rate }
      });
    } else if (results.participation_rate >= 40) {
      const templateText = `⚠️ Participación moderada: ${Math.round(results.participation_rate)}% - Considerar estrategias para incrementar engagement futuro`;
      templates.push({
        id: 'participacion-baja',
        type: 'participacion_media',
        category: 'general',
        text: templateText,
        priority: 7,
        variables: { participation: results.participation_rate }
      });
    }
    
    // 4. BENCHMARK COMPARISONS INTELIGENTES
    Object.entries(results.category_scores).forEach(([category, score]) => {
      const difference = score - benchmark;
      if (difference > 0.5) {
        const templateText = `🏆 Ventaja competitiva significativa: ${results.company_name} supera el benchmark sectorial en ${category} por +${difference.toFixed(1)} puntos (${((difference/benchmark)*100).toFixed(0)}% superior)`;
        templates.push({
          id: `benchmark-superior-${category}`,
          type: 'benchmark_superior',
          category: category,
          text: templateText,
          priority: 9,
          variables: { category, difference, percentageAdvantage: ((difference/benchmark)*100).toFixed(0) }
        });
      } else if (difference > 0.2) {
        const templateText = `📈 Por encima del promedio: ${category} supera benchmark sectorial por +${difference.toFixed(1)} puntos`;
        templates.push({
          id: `benchmark-superior-${category}`,
          type: 'benchmark_superior',
          category: category,
          text: templateText,
          priority: 7,
          variables: { category, difference }
        });
      } else if (difference < -0.5) {
        const templateText = `🎯 Oportunidad sectorial: ${category} puede elevarse +${Math.abs(difference).toFixed(1)} puntos para alcanzar liderazgo industrial`;
        templates.push({
          id: `benchmark-inferior-${category}`,
          type: 'benchmark_inferior',
          category: category,
          text: templateText,
          priority: 8,
          variables: { category, difference: Math.abs(difference) }
        });
      } else if (difference < -0.2) {
        const templateText = `📊 Gap vs industria: ${category} tiene potencial de mejora de +${Math.abs(difference).toFixed(1)} puntos hacia estándar sectorial`;
        templates.push({
          id: `benchmark-inferior-${category}`,
          type: 'benchmark_inferior',
          category: category,
          text: templateText,
          priority: 6,
          variables: { category, difference: Math.abs(difference) }
        });
      }
    });
    
    // 5. EXCELENCIA GENERAL CONTEXTUALIZADA
    if (results.overall_score >= 4.3) {
      const templateText = `🌟 Organización de elite: ${results.company_name} logra ${results.overall_score.toFixed(1)}/5.0 puntos - Percentil 95+ del mercado laboral`;
      templates.push({
        id: 'excelencia-elite',
        type: 'excelencia_general',
        category: 'general',
        text: templateText,
        priority: 11,
        variables: { overall_score: results.overall_score }
      });
    } else if (results.overall_score >= 4.0) {
      const templateText = `🏅 Nivel de excelencia: ${results.company_name} logra ${results.overall_score.toFixed(1)}/5.0 puntos - Organización de alto rendimiento confirmada`;
      templates.push({
        id: 'excelencia-general',
        type: 'excelencia_general',
        category: 'general',
        text: templateText,
        priority: 9,
        variables: { overall_score: results.overall_score }
      });
    } else if (results.overall_score >= 3.7) {
      const templateText = `📈 Rendimiento sólido: ${results.company_name} alcanza ${results.overall_score.toFixed(1)}/5.0 puntos - Base sólida para crecimiento sostenido`;
      templates.push({
        id: 'rendimiento-solido',
        type: 'excelencia_general',
        category: 'general',
        text: templateText,
        priority: 6,
        variables: { overall_score: results.overall_score }
      });
    }
    
    // Ordenar por prioridad y retornar top 6 (aumentado para más insights)
    return templates
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);
  };

  // Cargar templates al montar el componente
  useEffect(() => {
    setIsLoading(true);
    try {
      const templates = selectCommunicationTemplates(campaignResults);
      setSelectedTemplates(templates);
    } catch (error) {
      console.error('Error selecting templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [campaignResults]);

  // Obtener icono por tipo de template - ICONOS INTELIGENTES EXPANDIDOS
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'fortaleza':
        return <Award className="h-4 w-4 text-emerald-400" />; // Verde FocalizaHR
      case 'oportunidad':
        return <Target className="h-4 w-4 text-amber-400" />; // Naranja FocalizaHR
      case 'benchmark_superior':
        return <TrendingUp className="h-4 w-4 text-blue-400" />; // Azul corporativo
      case 'benchmark_inferior':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />; // Amarillo advertencia
      case 'participacion_alta':
      case 'participacion_media':
        return <Users className="h-4 w-4 text-violet-400" />; // Púrpura engagement
      case 'excelencia_general':
        return <Award className="h-4 w-4 text-cyan-400" />; // Cyan excelencia
      default:
        return <Lightbulb className="h-4 w-4 text-slate-400" />;
    }
  };

  // Obtener color del badge por tipo - COLORES INTELIGENTES
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'fortaleza':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'; // Verde FocalizaHR
      case 'oportunidad':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50'; // Naranja FocalizaHR
      case 'benchmark_superior':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50'; // Azul corporativo
      case 'benchmark_inferior':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'; // Amarillo advertencia
      case 'participacion_alta':
      case 'participacion_media':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/50'; // Púrpura engagement
      case 'excelencia_general':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'; // Cyan excelencia
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  // ✅ FUNCIÓN PARA OBTENER LABEL INTELIGENTE DEL TIPO
  const getTypeLabel = (type: string, category: string) => {
    if (category === 'campaign-specific') return 'CAMPAÑA ESPECÍFICA';
    if (category === 'segmentation') return 'ANÁLISIS SEGMENTACIÓN';
    if (category === 'trend') return 'TENDENCIA TEMPORAL';
    if (category === 'statistical') return 'CONFIANZA ESTADÍSTICA';
    
    switch (type) {
      case 'fortaleza':
        return 'FORTALEZA';
      case 'oportunidad':
        return 'OPORTUNIDAD';
      case 'benchmark_superior':
        return 'VENTAJA COMPETITIVA';
      case 'benchmark_inferior':
        return 'GAP SECTORIAL';
      case 'participacion_alta':
        return 'PARTICIPACIÓN ALTA';
      case 'participacion_media':
        return 'PARTICIPACIÓN MEDIA';
      case 'excelencia_general':
        return 'EXCELENCIA';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  // Copiar template al clipboard
  const handleCopyTemplate = async (template: CommunicationTemplate) => {
    const textToCopy = editingTemplate === template.id ? editedText : template.text;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 3000);
      
      // Callback para tracking
      if (onTemplateUsed) {
        onTemplateUsed(template.id, textToCopy);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Iniciar edición de template
  const startEditing = (template: CommunicationTemplate) => {
    setEditingTemplate(template.id);
    setEditedText(template.text);
  };

  // Guardar edición
  const saveEdit = () => {
    setSelectedTemplates(prev => 
      prev.map(template => 
        template.id === editingTemplate 
          ? { ...template, text: editedText }
          : template
      )
    );
    setEditingTemplate(null);
    setEditedText('');
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingTemplate(null);
    setEditedText('');
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            Cómo comunicar estos resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-400">Generando templates personalizados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          Cómo comunicar estos resultados
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Frases personalizadas basadas en sus datos - Listas para usar en presentaciones, emails o reportes
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {selectedTemplates.length === 0 ? (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                No se pudieron generar templates automáticos con los datos disponibles.
              </AlertDescription>
            </Alert>
          ) : (
            selectedTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-slate-600 rounded-lg p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {getTemplateIcon(template.type)}
                    <Badge className={`text-xs ${getBadgeColor(template.type)}`}>
                      {getTypeLabel(template.type, template.category)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Prioridad: {template.priority}
                    </span>
                    {/* ✅ NUEVO: Indicador de inteligencia */}
                    {(template.category === 'campaign-specific' || 
                      template.category === 'segmentation' || 
                      template.category === 'trend' || 
                      template.category === 'statistical') && (
                      <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
                        INTELIGENTE
                      </Badge>
                    )}
                  </div>
                </div>

                {editingTemplate === template.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="min-h-[80px] bg-slate-700 border-slate-600 text-white resize-none"
                      placeholder="Edita el mensaje..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-white text-sm leading-relaxed">
                      {template.text}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyTemplate(template)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {copiedTemplate === template.id ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />
                            ¡Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(template)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Personalizar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {/* Footer informativo - ACTUALIZADO CON NUEVAS CAPACIDADES */}
        <Alert className="border-cyan-500/50 bg-cyan-500/10 mt-6">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-200">
            <strong>Kit Comunicación FocalizaHR v2.0 - Inteligencia Avanzada:</strong> Templates generados con análisis 
            multi-dimensional basados en scores por categoría, segmentación departamental, tendencias temporales, 
            comparación benchmark sectorial, y análisis específico por tipo de campaña. 
            <br /><br />
            ✨ <strong>Nuevas capacidades:</strong> Análisis de momentum, insights por segmentación, 
            evaluación de confianza estadística, y recomendaciones contextuales por industria.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default KitComunicacionComponent;