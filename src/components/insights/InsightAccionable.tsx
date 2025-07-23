// src/components/insights/InsightAccionable.tsx
// 🎯 FOCALIZAHR - CHAT 6B: INSIGHT ACCIONABLE UI COMPONENT
// Interfaz executive-grade para casos negocio automáticos

'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Target,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react';
import { BusinessCase, BusinessCaseSeverity } from '@/types/BusinessCase';

interface InsightAccionableProps {
  businessCase: BusinessCase;
  companyName?: string;
  onActionClick?: (action: string) => void;
  className?: string;
}

/**
 * InsightAccionable - Componente UI enterprise para casos negocio ejecutivos
 * Diferenciación competitiva: casos negocio vs templates básicos
 * Arquitectura V3.0: Capa 3 inteligencia + display financiero transparente
 */
export const InsightAccionable: React.FC<InsightAccionableProps> = ({
  businessCase,
  companyName = '',
  onActionClick,
  className = ''
}) => {
  // 🎨 THEME MAPPING CORPORATIVO
  const severityConfig = {
    crítica: {
      bgClass: 'bg-gradient-to-br from-red-900/40 to-red-800/40',
      borderClass: 'border-red-500/50',
      badgeClass: 'bg-red-500 hover:bg-red-600',
      iconColor: 'text-red-400',
      icon: XCircle
    },
    alta: {
      bgClass: 'bg-gradient-to-br from-orange-900/40 to-orange-800/40', 
      borderClass: 'border-orange-500/50',
      badgeClass: 'bg-orange-500 hover:bg-orange-600',
      iconColor: 'text-orange-400',
      icon: AlertTriangle
    },
    media: {
      bgClass: 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/40',
      borderClass: 'border-yellow-500/50',
      badgeClass: 'bg-yellow-500 hover:bg-yellow-600',
      iconColor: 'text-yellow-400',
      icon: Clock
    },
    baja: {
      bgClass: 'bg-gradient-to-br from-blue-900/40 to-blue-800/40',
      borderClass: 'border-blue-500/50',
      badgeClass: 'bg-blue-500 hover:bg-blue-600',
      iconColor: 'text-blue-400',
      icon: CheckCircle
    }
  };

  const config = severityConfig[businessCase.severity];
  const SeverityIcon = config.icon;

  // 🎯 URGENCY DISPLAY MAPPING
  const getUrgencyDisplay = (timeline: string) => {
    if (timeline.toLowerCase().includes('inmediata') || timeline.toLowerCase().includes('72')) {
      return { text: 'ACCIÓN INMEDIATA', color: 'text-red-400', pulse: true };
    }
    if (timeline.toLowerCase().includes('semana')) {
      return { text: 'ESTA SEMANA', color: 'text-orange-400', pulse: true };
    }
    if (timeline.toLowerCase().includes('30')) {
      return { text: '30 DÍAS', color: 'text-yellow-400', pulse: false };
    }
    return { text: 'PROGRAMAR', color: 'text-blue-400', pulse: false };
  };

  const urgencyDisplay = getUrgencyDisplay(businessCase.suggestedTimeline);

  // 💰 FINANCIAL FORMATTING
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatROI = (roi: number) => {
    return `${roi > 0 ? '+' : ''}${roi}%`;
  };

  return (
    <Card className={`relative overflow-hidden ${config.bgClass} ${config.borderClass} border-2 ${className}`}>
      {/* 🚨 HEADER EXECUTIVO */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-black/30 ${config.iconColor}`}>
              <SeverityIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${config.badgeClass} text-white font-semibold px-3 py-1`}>
                  {businessCase.severity.toUpperCase()}
                </Badge>
                <div className={`text-sm font-semibold ${urgencyDisplay.color} ${urgencyDisplay.pulse ? 'animate-pulse' : ''}`}>
                  ⏱️ {urgencyDisplay.text}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {businessCase.title}
              </h3>
              <div className="flex items-center text-sm text-white/70 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(businessCase.createdAt).toLocaleDateString('es-CL')}
                <span className="mx-2">•</span>
                <BarChart3 className="h-4 w-4 mr-1" />
                Confianza: {businessCase.confidenceLevel}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 📊 PROBLEMA Y EVIDENCIA */}
        <Alert className="border-white/20 bg-black/20">
          <Users className="h-4 w-4" />
          <AlertDescription className="text-white/90">
            <strong className="text-white">Problema Detectado:</strong> {businessCase.problemDescription}
          </AlertDescription>
        </Alert>

        {/* 💰 IMPACTO FINANCIERO TRANSPARENTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-white font-semibold flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-red-400" />
              Impacto Financiero
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Costo Actual Anual:</span>
                <span className="text-white font-medium">
                  {formatCurrency(businessCase.financials.currentAnnualCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Pérdida Potencial:</span>
                <span className="text-red-400 font-bold">
                  {formatCurrency(businessCase.financials.potentialAnnualLoss)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Inversión Requerida:</span>
                <span className="text-cyan-400 font-medium">
                  {formatCurrency(businessCase.financials.recommendedInvestment)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
              Retorno Esperado
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">ROI Estimado:</span>
                <span className="text-green-400 font-bold text-lg">
                  {formatROI(businessCase.financials.estimatedROI)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Período Retorno:</span>
                <span className="text-white font-medium">
                  {businessCase.financials.paybackPeriod} meses
                </span>
              </div>
              <div className="text-xs text-white/60">
                <Target className="h-3 w-3 inline mr-1" />
                {businessCase.evidenceData.participantsAffected} colaboradores afectados
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 ACCIONES RECOMENDADAS */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-cyan-400" />
            Plan de Acción Recomendado
          </h4>
          <div className="space-y-2">
            {businessCase.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-black/20 border border-white/10">
                <div className="flex-shrink-0 w-6 h-6 bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  {index + 1}
                </div>
                <p className="text-white/90 text-sm flex-1">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ⏱️ TIMELINE Y MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h5 className="text-white/80 font-medium text-sm">Timeline Sugerido</h5>
            <p className="text-cyan-400 font-semibold">{businessCase.suggestedTimeline}</p>
          </div>
          <div className="space-y-2">
            <h5 className="text-white/80 font-medium text-sm">Métricas de Éxito</h5>
            <div className="space-y-1">
              {businessCase.successMetrics.slice(0, 2).map((metric, index) => (
                <p key={index} className="text-white/70 text-xs">• {metric}</p>
              ))}
            </div>
          </div>
        </div>

        {/* 🔬 TRANSPARENCIA METODOLÓGICA */}
        <details className="group">
          <summary className="cursor-pointer text-white/80 text-sm font-medium hover:text-white transition-colors">
            <FileText className="h-4 w-4 inline mr-2" />
            Ver Metodología y Fuentes
            <span className="group-open:rotate-180 inline-block transition-transform ml-2">▼</span>
          </summary>
          <div className="mt-3 space-y-2 text-xs text-white/60">
            <div>
              <strong className="text-white/80">Fuentes Metodológicas:</strong>
              <ul className="mt-1 space-y-1 ml-4">
                {businessCase.financials.methodologySources.map((source, index) => (
                  <li key={index}>• {source}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong className="text-white/80">Supuestos Clave:</strong>
              <ul className="mt-1 space-y-1 ml-4">
                {businessCase.financials.keyAssumptions.map((assumption, index) => (
                  <li key={index}>• {assumption}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>

        {/* 🚀 BOTONES ACCIÓN EXECUTIVO */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
          <Button 
            onClick={() => onActionClick?.('schedule_meeting')}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Programar Reunión Ejecutiva
          </Button>
          <Button 
            onClick={() => onActionClick?.('generate_report')}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte Detallado
          </Button>
        </div>
      </CardContent>

      {/* 🌟 ACCENT BORDER GLOW */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
    </Card>
  );
};