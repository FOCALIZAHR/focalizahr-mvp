// src/components/kit-comunicacion/components/TemplateCard.tsx
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Copy, 
  Edit, 
  Save, 
  X, 
  Award,
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  Lightbulb,
  Building
} from 'lucide-react';

interface CommunicationTemplate {
  id: string;
  type: string;
  category: string;
  text: string;
  priority: number;
  variables?: { [key: string]: any };
}

interface TemplateCardProps {
  template: CommunicationTemplate;
  onTemplateUsed: (templateId: string, finalText: string) => void;
  campaignType?: string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onTemplateUsed,
  campaignType
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(template.text);
  const [isCopied, setIsCopied] = useState(false);

  // 🎨 ICONOS POR TIPO TEMPLATE
  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'fortaleza':
      case 'fortaleza_general':
        return <Award className="h-4 w-4 text-emerald-400" />;
      case 'oportunidad':
      case 'oportunidad_general':
        return <Target className="h-4 w-4 text-amber-400" />;
      case 'benchmark_superior':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'benchmark_inferior':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'participacion_alta':
      case 'participacion_media':
        return <Users className="h-4 w-4 text-violet-400" />;
      case 'excelencia_general':
        return <Award className="h-4 w-4 text-cyan-400" />;
      // ✅ NUEVOS ICONOS DEPARTAMENTOS
      case 'departamento_campeon':
      case 'departamento_campeón':
        return <Building className="h-4 w-4 text-green-400" />;
      case 'departamento_oportunidad':
        return <Building className="h-4 w-4 text-orange-400" />;
      case 'variabilidad_departamental':
        return <Building className="h-4 w-4 text-blue-400" />;
      default:
        return <Lightbulb className="h-4 w-4 text-slate-400" />;
    }
  };

  // 🎨 COLORES BADGE POR TIPO
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'fortaleza':
      case 'fortaleza_general':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'oportunidad':
      case 'oportunidad_general':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      case 'benchmark_superior':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'benchmark_inferior':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'participacion_alta':
      case 'participacion_media':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/50';
      case 'excelencia_general':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      // ✅ NUEVOS COLORES DEPARTAMENTOS
      case 'departamento_campeon':
      case 'departamento_campeón':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'departamento_oportunidad':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'variabilidad_departamental':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  // 🏷️ LABELS INTELIGENTES POR TIPO
  const getTypeLabel = (type: string, category: string) => {
    // Contextos especiales
    if (category === 'departamentos') return 'ANÁLISIS DEPARTAMENTAL';
    if (category === 'participacion') return 'PARTICIPACIÓN';
    if (category === 'benchmark') return 'BENCHMARK SECTORIAL';
    
    // Labels por tipo
    const labels: { [key: string]: string } = {
      'fortaleza': 'FORTALEZA',
      'fortaleza_general': 'FORTALEZA GENERAL',
      'oportunidad': 'OPORTUNIDAD',
      'oportunidad_general': 'OPORTUNIDAD GENERAL',
      'benchmark_superior': 'VENTAJA COMPETITIVA',
      'benchmark_inferior': 'GAP SECTORIAL',
      'participacion_alta': 'ALTA PARTICIPACIÓN',
      'participacion_media': 'PARTICIPACIÓN MEDIA',
      'excelencia_general': 'EXCELENCIA',
      'departamento_campeon': 'DEPARTAMENTO LÍDER',
      'departamento_campeón': 'DEPARTAMENTO LÍDER',
      'departamento_oportunidad': 'OPORTUNIDAD DEPARTAMENTAL',
      'variabilidad_departamental': 'VARIABILIDAD DEPARTAMENTAL'
    };
    
    return labels[type] || type.replace('_', ' ').toUpperCase();
  };

  // 📋 COPIAR TEMPLATE
  const handleCopy = async () => {
    const textToCopy = isEditing ? editedText : template.text;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
      
      // Tracking
      onTemplateUsed(template.id, textToCopy);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // ✏️ EDICIÓN TEMPLATES
  const startEditing = () => {
    setIsEditing(true);
    setEditedText(template.text);
  };

  const saveEdit = () => {
    // Actualizar template local
    template.text = editedText;
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditedText(template.text);
    setIsEditing(false);
  };

  // 🎯 DETECTAR SI ES TEMPLATE INTELIGENTE
  const isIntelligentTemplate = () => {
    return (
      template.category === 'departamentos' ||
      template.type.includes('departamento') ||
      template.type.includes('variabilidad') ||
      (campaignType && template.text.includes(campaignType))
    );
  };

  return (
    <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors">
      {/* Header con badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {getTemplateIcon(template.type)}
          <Badge className={`text-xs ${getBadgeColor(template.type)}`}>
            {getTypeLabel(template.type, template.category)}
          </Badge>
          <span className="text-xs text-gray-500">
            Prioridad: {template.priority}
          </span>
          
          {/* ✅ BADGE INTELIGENCIA */}
          {isIntelligentTemplate() && (
            <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
              INTELIGENTE
            </Badge>
          )}
          
          {/* ✅ BADGE DEPARTAMENTOS */}
          {template.category === 'departamentos' && (
            <Badge className="text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
              DEPARTAMENTAL
            </Badge>
          )}
        </div>
      </div>

      {/* Contenido editable */}
      {isEditing ? (
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
          {/* Texto del template */}
          <p className="text-white text-sm leading-relaxed">
            {template.text}
          </p>
          
          {/* Acciones */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isCopied ? (
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
              onClick={startEditing}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Edit className="h-3 w-3 mr-1" />
              Personalizar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateCard;