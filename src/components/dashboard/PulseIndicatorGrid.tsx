// src/components/dashboard/PulseIndicatorGrid.tsx
// PASO 3.2: Indicadores de Pulso con Sparklines y Colores Condicionales

import React from 'react';
import { TrendingUp, TrendingDown, Users, Clock, Target, Award, MessageSquare, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PulseIndicatorGridProps {
  stats: {
    totalResponded: number;
    totalInvited: number;
    participationRate: number;
    averageScore: number;
    completionTime: number;
    responseRate: number;
  };
  analytics: {
    categoryScores?: Record<string, number>;
    responsesByDay?: Record<string, number>;
    trendData?: Array<{
      date: string;
      responses: number;
      score: number;
    }>;
  };
}

export default function PulseIndicatorGrid({ stats, analytics }: PulseIndicatorGridProps) {
  // Helper function para generar sparkline data
  const generateSparklineData = (data: number[], width = 80, height = 20) => {
    if (!data || data.length === 0) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return points;
  };

  // Datos para sparklines (últimos 7 días simulados)
  const participationTrend = analytics.trendData?.map(d => d.responses) || [12, 18, 25, 32, 45, 38, stats.totalResponded];
  const scoreTrend = analytics.trendData?.map(d => d.score) || [3.2, 3.8, 4.1, 3.9, 4.2, 4.0, stats.averageScore];
  
  // Helper function para determinar color basado en valor
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

  const indicators = [
    {
      id: 'participation',
      title: 'Participación',
      value: `${(stats.participationRate || 0).toFixed(1)}%`,
      subtitle: `${stats.totalResponded} de ${stats.totalInvited}`,
      icon: Users,
      trend: participationTrend.slice(-2)[1] > participationTrend.slice(-2)[0] ? 'up' : 'down',
      sparklineData: participationTrend,
      color: getParticipationColor(stats.participationRate || 0)
    },
    {
      id: 'average-score',
      title: 'Score Promedio',
      value: (stats.averageScore || 0).toFixed(1),
      subtitle: 'de 5.0 puntos',
      icon: Award,
      trend: scoreTrend.slice(-2)[1] > scoreTrend.slice(-2)[0] ? 'up' : 'down',
      sparklineData: scoreTrend,
      color: getScoreColor(stats.averageScore || 0)
    },
    {
      id: 'completion-time',
      title: 'Tiempo Promedio',
      value: `${Math.round((stats.completionTime || 0) / 60)}`,
      subtitle: 'minutos',
      icon: Clock,
      trend: 'neutral',
      sparklineData: [8, 7, 9, 6, 8, 7, Math.round((stats.completionTime || 0) / 60)],
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'response-rate',
      title: 'Tasa Respuesta',
      value: `${(stats.responseRate || 0).toFixed(1)}%`,
      subtitle: 'completadas',
      icon: Target,
      trend: (stats.responseRate || 0) > 80 ? 'up' : 'down',
      sparklineData: [65, 72, 78, 81, 85, 83, stats.responseRate || 0],
      color: (stats.responseRate || 0) > 80 ? 'text-green-600 bg-green-50 border-green-200' : 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  ];

  // Categorías adicionales si están disponibles
  const categoryCards = analytics.categoryScores ? Object.entries(analytics.categoryScores).map(([category, score]) => ({
    id: `category-${category}`,
    title: category.charAt(0).toUpperCase() + category.slice(1),
    value: score.toFixed(1),
    subtitle: 'score',
    icon: BarChart3,
    trend: score > 3.5 ? 'up' : 'down',
    sparklineData: [3.0, 3.2, 3.5, 3.8, 3.6, 3.9, score],
    color: getScoreColor(score)
  })) : [];

  const allCards = [...indicators, ...categoryCards.slice(0, 4)]; // Máximo 8 cards

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {allCards.map((indicator) => {
        const Icon = indicator.icon;
        const TrendIcon = indicator.trend === 'up' ? TrendingUp : indicator.trend === 'down' ? TrendingDown : null;
        
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
                
                {/* Sparkline */}
                <div className="flex items-center justify-between">
                  <svg width="80" height="20" className="opacity-60">
                    <polyline
                      points={generateSparklineData(indicator.sparklineData, 80, 20)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Punto final destacado */}
                    <circle
                      cx={80}
                      cy={20 - ((indicator.sparklineData.slice(-1)[0] - Math.min(...indicator.sparklineData)) / 
                        (Math.max(...indicator.sparklineData) - Math.min(...indicator.sparklineData) || 1)) * 20}
                      r="2"
                      fill="currentColor"
                    />
                  </svg>
                  
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