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

  // Función para seleccionar templates automáticamente
  const selectCommunicationTemplates = (results: CampaignResults): CommunicationTemplate[] => {
    const templates: CommunicationTemplate[] = [];
    const benchmark = results.industry_benchmark || 3.2;
    
    // 1. FORTALEZAS (score >= 4.0)
    Object.entries(results.category_scores).forEach(([category, score]) => {
      if (score >= 4.0) {
        templates.push({
          id: `fortaleza-${category}`,
          type: 'fortaleza',
          category: category,
          text: `Su equipo destaca en ${category} (${score.toFixed(1)}/5.0)`,
          priority: 10,
          variables: { category, score }
        });
      }
    });
    
    // 2. OPORTUNIDADES (score < 3.0)
    Object.entries(results.category_scores).forEach(([category, score]) => {
      if (score < 3.0) {
        templates.push({
          id: `oportunidad-${category}`,
          type: 'oportunidad',
          category: category,
          text: `Oportunidad inmediata en ${category} (${score.toFixed(1)}/5.0)`,
          priority: 10,
          variables: { category, score }
        });
      }
    });
    
    // 3. PARTICIPACIÓN ALTA
    if (results.participation_rate >= 75) {
      templates.push({
        id: 'participacion-alta',
        type: 'participacion_alta',
        category: 'general',
        text: `Excelente participación (${Math.round(results.participation_rate)}%) indica engagement alto del equipo`,
        priority: 6,
        variables: { participation: results.participation_rate }
      });
    } else if (results.participation_rate >= 50) {
      templates.push({
        id: 'participacion-media',
        type: 'participacion_media',
        category: 'general',
        text: `Buena participación (${Math.round(results.participation_rate)}%) permite análisis confiable`,
        priority: 5,
        variables: { participation: results.participation_rate }
      });
    }
    
    // 4. BENCHMARK COMPARISONS
    Object.entries(results.category_scores).forEach(([category, score]) => {
      const difference = score - benchmark;
      if (difference > 0.3) {
        templates.push({
          id: `benchmark-superior-${category}`,
          type: 'benchmark_superior',
          category: category,
          text: `Su empresa supera benchmark sectorial en ${category} por +${difference.toFixed(1)} puntos`,
          priority: 7,
          variables: { category, difference }
        });
      } else if (difference < -0.3) {
        templates.push({
          id: `benchmark-inferior-${category}`,
          type: 'benchmark_inferior',
          category: category,
          text: `Área de mejora vs benchmark sectorial: ${category} (-${Math.abs(difference).toFixed(1)} puntos)`,
          priority: 7,
          variables: { category, difference: Math.abs(difference) }
        });
      }
    });
    
    // 5. EXCELENCIA GENERAL
    if (results.overall_score >= 4.0) {
      templates.push({
        id: 'excelencia-general',
        type: 'excelencia_general',
        category: 'general',
        text: `Su organización alcanza nivel de excelencia (${results.overall_score.toFixed(1)}/5.0)`,
        priority: 9,
        variables: { overall_score: results.overall_score }
      });
    }
    
    // Ordenar por prioridad y retornar top 5
    return templates
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
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

  // Obtener icono por tipo de template
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'fortaleza':
        return <Award className="h-4 w-4 text-green-400" />;
      case 'oportunidad':
        return <Target className="h-4 w-4 text-orange-400" />;
      case 'benchmark_superior':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'benchmark_inferior':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'participacion_alta':
      case 'participacion_media':
        return <Users className="h-4 w-4 text-purple-400" />;
      case 'excelencia_general':
        return <Award className="h-4 w-4 text-cyan-400" />;
      default:
        return <Lightbulb className="h-4 w-4 text-gray-400" />;
    }
  };

  // Obtener color del badge por tipo
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'fortaleza':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'oportunidad':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'benchmark_superior':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'benchmark_inferior':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'participacion_alta':
      case 'participacion_media':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'excelencia_general':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
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
                      {template.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Prioridad: {template.priority}
                    </span>
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
        {/* Footer informativo */}
        <Alert className="border-cyan-500/50 bg-cyan-500/10 mt-6">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-cyan-200">
            <strong>Kit Comunicación FocalizaHR:</strong> Templates generados automáticamente 
            basados en sus scores por categoría, participación y comparación con benchmark sectorial. 
            Personalice el mensaje y cópielo para usar en sus comunicaciones.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default KitComunicacionComponent;