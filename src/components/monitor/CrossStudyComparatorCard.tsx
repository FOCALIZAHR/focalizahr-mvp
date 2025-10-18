import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { CrossStudyComparison } from '@/types';

interface CrossStudyComparatorCardProps {
  comparison?: CrossStudyComparison;
  onApplyLearning?: (rec: string) => void;
}

export function CrossStudyComparatorCard({ 
  comparison, 
  onApplyLearning 
}: CrossStudyComparatorCardProps) {
  // 🔍 DEBUG TEMPORAL - BORRAR DESPUÉS
  console.log('🔍 [COMPONENTE] comparison:', comparison);
  console.log('🔍 [COMPONENTE] tipo:', typeof comparison);
  console.log('🔍 [COMPONENTE] keys:', comparison ? Object.keys(comparison) : 'undefined');
  
  const [expandedInsights, setExpandedInsights] = useState(false);

  if (!comparison) {
    return (
      <div data-component="CrossStudyComparatorCard" className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-8 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl"></div>
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <h3 className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-lg font-semibold">Comparación Cross-Study</h3>
        </div>
        <div className="text-center py-12 text-white/70">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30 text-cyan-400" />
          <p className="text-lg text-white/80 font-medium">Datos históricos insuficientes</p>
          <p className="text-sm text-white/70 font-medium uppercase tracking-wider mt-2">Complete más campañas para análisis comparativo</p>
        </div>
      </div>
    );
  }

  const { lastCampaign, comparison: comp, insights, recommendations } = comparison;
  
  // Determinar color y iconos basado en tendencia
  const getTrendColor = (trend: 'faster' | 'slower' | 'similar'): string => {
    switch (trend) {
      case 'faster': return 'text-green-400';
      case 'slower': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getTrendIcon = (trend: 'faster' | 'slower' | 'similar'): React.ReactElement => {
    switch (trend) {
      case 'faster': return <TrendingUp className="w-5 h-5" />;
      case 'slower': return <TrendingDown className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high'): React.ReactElement => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'medium': return <Target className="w-5 h-5 text-yellow-400" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Target className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high'): string => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 border-green-400/30 text-green-300';
      case 'medium': return 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300';
      case 'high': return 'bg-red-500/10 border-red-400/30 text-red-300';
      default: return 'bg-gray-500/10 border-gray-400/30 text-gray-300';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-xl"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-lg font-semibold">Comparación Cross-Study</h3>
        </div>
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
          vs {lastCampaign?.name || 'Campaña anterior'}
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Velocidad */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-lg"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs text-white/70 font-medium uppercase tracking-wider">Velocidad</span>
            <div className={`flex items-center gap-2 ${getTrendColor(comp?.velocityTrend || 'similar')}`}>
              {getTrendIcon(comp?.velocityTrend || 'similar')}
              <span className="text-xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {comp?.velocityDifference !== undefined && comp.velocityDifference > 0 ? '+' : ''}{comp?.velocityDifference ?? 0}%
              </span>
            </div>
          </div>
          <div className="text-xs text-white/60 font-medium">
            vs {lastCampaign?.velocityMetrics.averageResponsesPerDay.toFixed(1) ?? '0.0'} resp/día histórico
          </div>
        </div>

        {/* Similaridad Patrón */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-lg"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs text-white/70 font-medium uppercase tracking-wider">Patrón</span>
            <span className="text-3xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {comp?.patternSimilarity ?? 0}%
            </span>
          </div>
          <div className="bg-white/10 rounded-full h-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-sm"></div>
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-lg transition-all duration-300 relative z-10"
              style={{ width: `${comp?.patternSimilarity ?? 0}%` }}
            />
          </div>
        </div>

        {/* Proyección Final */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-lg"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs text-white/70 font-medium uppercase tracking-wider">Proyección</span>
            <span className="text-3xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {comp?.projectedOutcome.finalRate ?? 0}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {getRiskIcon(comp?.projectedOutcome.riskLevel || 'medium')}
            <span className="text-white/70 font-medium">
              Confianza: <span className="text-white font-bold">{comp?.projectedOutcome.confidence ?? 0}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Campaña de Referencia */}
      {lastCampaign && (
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 mb-6 border border-blue-400/30 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h4 className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-lg font-semibold">Campaña de Referencia</h4>
          <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40 text-blue-300 text-xs px-3 py-1 rounded-lg backdrop-blur-sm">
            {lastCampaign.type}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-base font-semibold text-blue-300 mb-1">{lastCampaign.name}</div>
            <div className="text-xs text-blue-400 font-medium">
              Participación: <span className="text-white font-bold">{lastCampaign.participationRate}%</span>
            </div>
          </div>
          <div>
            <div className="text-base font-semibold text-blue-300 mb-1">
              {lastCampaign.velocityMetrics.averageResponsesPerDay.toFixed(1)} resp/día
            </div>
            <div className="text-xs text-blue-400 font-medium">
              Velocity: <span className="text-white font-bold">{lastCampaign.velocityMetrics.completionVelocity}%</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Insights Expandibles */}
      {insights && insights.length > 0 && (
      <div className="space-y-3 mb-6">
        <button
          onClick={() => setExpandedInsights(!expandedInsights)}
          className="w-full flex items-center justify-between text-left p-3 bg-slate-700/30 rounded-xl hover:bg-slate-600/40 transition-all duration-300 group border border-white/10 hover:scale-[1.02]"
        >
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-lg font-semibold">Insights del Análisis</span>
          <span className={`transform transition-transform duration-300 text-cyan-400 text-lg ${expandedInsights ? 'rotate-180' : ''} group-hover:scale-110`}>
            ↓
          </span>
        </button>
        
        {expandedInsights && (
          <div className="space-y-3">
            {insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-slate-800/60 to-slate-700/40 rounded-xl border border-white/10 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mt-2 flex-shrink-0 shadow-lg" />
                <span className="text-sm text-white/80 font-medium leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Recomendaciones Accionables */}
      <div className="mb-6">
        <h4 className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-lg font-semibold mb-3">Recomendaciones</h4>
        <div className="space-y-2">
          {recommendations?.map((rec: string, index: number) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl border backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${getRiskColor(comp?.projectedOutcome.riskLevel || 'medium')}`}
            >
              <span className="text-sm font-medium">{rec}</span>
              {onApplyLearning && (
                <button
                  onClick={() => onApplyLearning(rec)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border border-white/20 text-white font-medium"
                >
                  Aplicar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer con Timestamp */}
      <div className="pt-6 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs text-white/60 font-medium">
          <span>Análisis basado en {lastCampaign?.type || 'campaña anterior'} más reciente</span>
          <span className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-1 rounded-lg">Actualizado ahora</span>
        </div>
      </div>
    </div>
  );
}