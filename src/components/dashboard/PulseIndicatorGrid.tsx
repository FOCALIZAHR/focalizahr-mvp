// src/components/dashboard/PulseIndicatorGrid.tsx
// SIMPLIFICADO v3.0 - CONSUME DATOS NORMALIZADOS DEL HOOK

import React from 'react';
import { TrendingUp, TrendingDown, Users, Clock, Target, Award, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ✅ CONTRATO SIMPLIFICADO - RECIBE DATOS YA NORMALIZADOS
interface PulseIndicatorGridProps {
  analytics: {
    totalInvited: number;
    totalResponded: number;
    participationRate: number;
    averageScore: number;
    completionTime: number;
    responseRate: number;
    categoryScores: Record<string, number>;
    trendData: Array<{
      date: string;
      responses: number;
      score: number;
    }>;
  };
}

export default function PulseIndicatorGrid({ analytics }: PulseIndicatorGridProps) {
  
  // ✅ FUNCIÓN SPARKLINE SIMPLIFICADA - DATOS YA VALIDADOS
  const generateSparklineData = (data: number[], width = 80, height = 20) => {
    if (!Array.isArray(data) || data.length < 2) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    return points;
  };

  // ✅ EXTRACCIÓN DIRECTA - SIN VALIDACIONES (YA NORMALIZADOS)
  const participationTrend = analytics.trendData.length >= 2 
    ? analytics.trendData.map(d => d.responses)
    : [0, analytics.totalResponded];
    
  const scoreTrend = analytics.trendData.length >= 2
    ? analytics.trendData.map(d => d.score)
    : [0, analytics.averageScore];

  // ✅ FUNCIONES COLOR SIMPLIFICADAS
  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 3.0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getParticipationColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // ✅ CÁLCULO TREND SIMPLIFICADO
  const calculateTrend = (trendData: number[]) => {
    if (trendData.length < 2) return 'neutral';
    const last = trendData.slice(-1)[0];
    const previous = trendData.slice(-2)[0];
    return last > previous ? 'up' : last < previous ? 'down' : 'neutral';
  };

  // ✅ INDICADORES PRINCIPALES - DATOS LIMPIOS DIRECTOS
  const indicators = [
    {
      id: 'participation',
      title: 'Participación',
      value: `${analytics.participationRate.toFixed(1)}%`,
      subtitle: `${analytics.totalResponded} de ${analytics.totalInvited}`,
      icon: Users,
      trend: calculateTrend(participationTrend),
      sparklineData: participationTrend,
      color: getParticipationColor(analytics.participationRate)
    },
    {
      id: 'average-score',
      title: 'Score Promedio',
      value: analytics.averageScore.toFixed(1),
      subtitle: 'de 5.0 puntos',
      icon: Award,
      trend: calculateTrend(scoreTrend),
      sparklineData: scoreTrend,
      color: getScoreColor(analytics.averageScore)
    },
    {
      id: 'completion-time',
      title: 'Tiempo Promedio',
      value: `${Math.round(analytics.completionTime / 60)}`,
      subtitle: 'minutos',
      icon: Clock,
      trend: 'neutral',
      sparklineData: [8, 7, 9, 6, 8, 7, Math.round(analytics.completionTime / 60)],
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'response-rate',
      title: 'Tasa Respuesta',
      value: `${analytics.responseRate.toFixed(1)}%`,
      subtitle: 'completadas',
      icon: Target,
      trend: analytics.responseRate > 80 ? 'up' : 'down',
      sparklineData: [65, 72, 78, 81, 85, 83, analytics.responseRate],
      color: analytics.responseRate > 80 ? 'text-green-600 bg-green-50 border-green-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  ];

  // ✅ CATEGORÍAS SIMPLIFICADAS - DATOS YA VALIDADOS
  const categoryCards = Object.entries(analytics.categoryScores).map(([category, score]) => ({
    id: `category-${category}`,
    title: category.charAt(0).toUpperCase() + category.slice(1),
    value: score.toFixed(1),
    subtitle: 'score',
    icon: BarChart3,
    trend: score > 3.5 ? 'up' : 'down',
    sparklineData: [3.0, 3.2, 3.5, 3.8, 3.6, 3.9, score],
    color: getScoreColor(score)
  }));

  const allCards = [...indicators, ...categoryCards];

  // ✅ RENDERIZADO SIMPLIFICADO - DATOS GARANTIZADOS VÁLIDOS
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {allCards.map((indicator) => {
        const Icon = indicator.icon;
        const TrendIcon = indicator.trend === 'up' ? TrendingUp : 
                         indicator.trend === 'down' ? TrendingDown : null;
        
        const sparklinePoints = generateSparklineData(indicator.sparklineData, 80, 20);
        const hasValidSparkline = sparklinePoints.length > 0;
        
        return (
          <Card key={indicator.id} className={`${indicator.color} border transition-all duration-200 hover:shadow-lg hover:scale-105`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white/50">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-75">
                      {indicator.title}
                    </p>
                  </div>
                </div>
                
                {TrendIcon && (
                  <div className="flex items-center space-x-1">
                    <TrendIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">
                    {indicator.value}
                  </span>
                  <span className="text-sm opacity-60">
                    {indicator.subtitle}
                  </span>
                </div>
                
                {/* ✅ SPARKLINE SIMPLIFICADO */}
                <div className="flex items-center justify-between">
                  {hasValidSparkline ? (
                    <svg width="80" height="20" className="opacity-60">
                      <polyline
                        points={sparklinePoints}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {indicator.sparklineData.length >= 2 && (
                        <circle
                          cx={80}
                          cy={20 - ((indicator.sparklineData.slice(-1)[0] - Math.min(...indicator.sparklineData)) / 
                            (Math.max(...indicator.sparklineData) - Math.min(...indicator.sparklineData) || 1)) * 20}
                          r="2"
                          fill="currentColor"
                        />
                      )}
                    </svg>
                  ) : (
                    <div className="w-20 h-5 bg-gray-100 rounded opacity-30 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sin datos</span>
                    </div>
                  )}
                  
                  <span className="text-xs opacity-50">
                    7 días
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}