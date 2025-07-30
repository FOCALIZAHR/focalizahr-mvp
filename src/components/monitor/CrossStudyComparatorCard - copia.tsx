// ====================================================================
// FOCALIZAHR CROSS-STUDY COMPARATOR COMPONENT - WOW COMPONENT #4
// src/components/monitor/CrossStudyComparatorCard.tsx
// Chat 4B: Cross-Study Comparator + Final Integration
// ====================================================================

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CrossStudyComparisonData } from '@/types';

interface CrossStudyComparatorCardProps {
  comparison: CrossStudyComparisonData | null;
  onApplyLearning?: (recommendation: string) => void;
}

export function CrossStudyComparatorCard({ comparison, onApplyLearning }: CrossStudyComparatorCardProps) {
  const [expandedInsights, setExpandedInsights] = useState(false);

  if (!comparison) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-fhr-orange" />
          <h3 className="text-lg font-semibold text-gray-900">Comparación Cross-Study</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Datos históricos insuficientes</p>
          <p className="text-sm mt-1">Complete más campañas para análisis comparativo</p>
        </div>
      </div>
    );
  }

  const { lastCampaign, comparison: comp, insights, recommendations } = comparison;
  
  // Determinar color y iconos basado en tendencia
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'faster': return 'text-green-600';
      case 'slower': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'faster': return <TrendingUp className="w-4 h-4" />;
      case 'slower': return <TrendingDown className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-50 border-green-200 text-green-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="glass-card p-6 neural-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-fhr-orange" />
          <h3 className="text-lg font-semibold text-gray-900">Comparación Cross-Study</h3>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          vs {lastCampaign.name}
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Velocidad */}
        <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Velocidad</span>
            <div className={`flex items-center gap-1 ${getTrendColor(comp.velocityTrend)}`}>
              {getTrendIcon(comp.velocityTrend)}
              <span className="text-sm font-semibold">
                {comp.velocityDifference > 0 ? '+' : ''}{comp.velocityDifference}%
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            vs {lastCampaign.velocityMetrics.averageResponsesPerDay.toFixed(1)} resp/día histórico
          </div>
        </div>

        {/* Similaridad Patrón */}
        <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Patrón</span>
            <span className="text-lg font-bold text-gray-900">
              {comp.patternSimilarity}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-fhr-orange to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${comp.patternSimilarity}%` }}
            />
          </div>
        </div>

        {/* Proyección Final */}
        <div className="bg-white/50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Proyección</span>
            <span className="text-lg font-bold text-gray-900">
              {comp.projectedOutcome.finalRate}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {getRiskIcon(comp.projectedOutcome.riskLevel)}
            <span className="text-gray-600">
              Confianza: {comp.projectedOutcome.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Campaña de Referencia */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-900">Campaña de Referencia</h4>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {lastCampaign.type}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-blue-700 font-medium">{lastCampaign.name}</div>
            <div className="text-xs text-blue-600">
              Participación: {lastCampaign.participationRate}%
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-700 font-medium">
              {lastCampaign.velocityMetrics.averageResponsesPerDay.toFixed(1)} resp/día
            </div>
            <div className="text-xs text-blue-600">
              Velocity: {lastCampaign.velocityMetrics.completionVelocity}%
            </div>
          </div>
        </div>
      </div>

      {/* Insights Expandibles */}
      <div className="space-y-3">
        <button
          onClick={() => setExpandedInsights(!expandedInsights)}
          className="w-full flex items-center justify-between text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-900">Insights del Análisis</span>
          <span className={`transform transition-transform ${expandedInsights ? 'rotate-180' : ''}`}>
            ↓
          </span>
        </button>
        
        {expandedInsights && (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="w-2 h-2 bg-fhr-orange rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recomendaciones Accionables */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-900 mb-3">Recomendaciones</h4>
        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${getRiskColor(comp.projectedOutcome.riskLevel)}`}
            >
              <span className="text-sm font-medium">{rec}</span>
              {onApplyLearning && (
                <button
                  onClick={() => onApplyLearning(rec)}
                  className="text-xs bg-white/80 hover:bg-white px-3 py-1 rounded transition-colors"
                >
                  Aplicar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer con Timestamp */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Análisis basado en {lastCampaign.type} más reciente</span>
          <span>Actualizado ahora</span>
        </div>
      </div>
    </div>
  );
}