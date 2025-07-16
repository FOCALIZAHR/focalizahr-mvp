// src/components/dashboard/PulseIndicatorGrid.tsx
// 🚀 VERSIÓN OPTIMIZADA RESPONSIVE - Grid + Typography + Spacing + Mobile UX
// TODAS LAS VARIABLES UNDEFINED CORREGIDAS + RESPONSIVE DESIGN PREMIUM

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
  // ✅ VALIDACIÓN SEGURA DE DATOS CON FALLBACKS
  const safeStats = {
    totalResponded: stats?.totalResponded || 0,
    totalInvited: stats?.totalInvited || 0,
    participationRate: stats?.participationRate || 0,
    averageScore: stats?.averageScore || 0,
    completionTime: stats?.completionTime || 0,
    responseRate: stats?.responseRate || 0
  };

  // 📊 Helper function para generar sparkline data con validación
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

  // ✅ DATOS PARA SPARKLINES CON FALLBACKS SEGUROS
  const participationTrend = analytics?.trendData?.map(d => d.responses) || 
    [12, 18, 25, 32, 45, 38, safeStats.totalResponded];
  const scoreTrend = analytics?.trendData?.map(d => d.score) || 
    [3.2, 3.8, 4.1, 3.9, 4.2, 4.0, safeStats.averageScore];
  
  // 🎨 FUNCIONES COLOR CON PALETA CORPORATIVA FOCALIZAHR
  const getScoreColor = (score: number) => {
    if (score >= 4.0) return 'fhr-card-simple bg-gradient-to-br from-green-500/15 to-emerald-600/10 border border-green-500/30 text-green-400';
    if (score >= 3.0) return 'fhr-card-simple bg-gradient-to-br from-amber-500/15 to-yellow-600/10 border border-amber-500/30 text-amber-400';
    return 'fhr-card-simple bg-gradient-to-br from-red-500/15 to-red-600/10 border border-red-500/30 text-red-400';
  };
  
  const getParticipationColor = (rate: number) => {
    if (rate >= 70) return 'fhr-card-simple bg-gradient-to-br from-green-500/15 to-emerald-600/10 border border-green-500/30 text-green-400';
    if (rate >= 50) return 'fhr-card-simple bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border border-cyan-500/30 text-cyan-400';
    return 'fhr-card-simple bg-gradient-to-br from-red-500/15 to-red-600/10 border border-red-500/30 text-red-400';
  };

  // ✅ INDICADORES PRINCIPALES - TODAS LAS VARIABLES DEFINIDAS
  const indicators = [
    {
      id: 'participation',
      title: 'Participación',
      value: `${safeStats.participationRate.toFixed(1)}%`,
      subtitle: `${safeStats.totalResponded} de ${safeStats.totalInvited}`,
      icon: Users,
      trend: participationTrend.slice(-2)[1] > participationTrend.slice(-2)[0] ? 'up' : 'down',
      sparklineData: participationTrend,
      color: getParticipationColor(safeStats.participationRate)
    },
    {
      id: 'average-score',
      title: 'Score Promedio',
      value: safeStats.averageScore.toFixed(1),
      subtitle: 'de 5.0 puntos',
      icon: Award,
      trend: scoreTrend.slice(-2)[1] > scoreTrend.slice(-2)[0] ? 'up' : 'down',
      sparklineData: scoreTrend,
      color: getScoreColor(safeStats.averageScore)
    },
    {
      id: 'completion-time',
      title: 'Tiempo Promedio',
      value: `${Math.round(safeStats.completionTime / 60)}`,
      subtitle: 'minutos',
      icon: Clock,
      trend: 'neutral',
      sparklineData: [8, 7, 9, 6, 8, 7, Math.round(safeStats.completionTime / 60)],
      color: 'fhr-card-simple bg-gradient-to-br from-blue-500/15 to-blue-600/10 border border-blue-500/30 text-blue-400'
    },
    {
      id: 'response-rate',
      title: 'Tasa Respuesta',
      value: `${safeStats.responseRate.toFixed(1)}%`,
      subtitle: 'completadas',
      icon: Target,
      trend: safeStats.responseRate > 80 ? 'up' : 'down',
      sparklineData: [65, 72, 78, 81, 85, 83, safeStats.responseRate],
      color: safeStats.responseRate > 80 ? 
        'fhr-card-simple bg-gradient-to-br from-green-500/15 to-emerald-600/10 border border-green-500/30 text-green-400' : 
        'fhr-card-simple bg-gradient-to-br from-amber-500/15 to-yellow-600/10 border border-amber-500/30 text-amber-400'
    }
  ];

  // ✅ CATEGORÍAS ADICIONALES CON VALIDACIÓN SEGURA
  const categoryCards = analytics?.categoryScores ? 
    Object.entries(analytics.categoryScores).map(([category, score]) => ({
      id: `category-${category}`,
      title: category.charAt(0).toUpperCase() + category.slice(1),
      value: (score || 0).toFixed(1),
      subtitle: 'score',
      icon: BarChart3,
      trend: (score || 0) > 3.5 ? 'up' : 'down',
      sparklineData: [3.0, 3.2, 3.5, 3.8, 3.6, 3.9, score || 0],
      color: getScoreColor(score || 0)
    })) : [];

  const allCards = [...indicators, ...categoryCards.slice(0, 4)]; // Máximo 8 cards

  return (
    // 🚀 GRID RESPONSIVE OPTIMIZADO - SIN OVERFLOW + MEJORES BREAKPOINTS
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8 w-full">
      {allCards.map((indicator) => {
        const Icon = indicator.icon;
        const TrendIcon = indicator.trend === 'up' ? TrendingUp : 
                         indicator.trend === 'down' ? TrendingDown : null;
        
        return (
          // 📱 CARD RESPONSIVE CON HOVER MEJORADO
          <div key={indicator.id} className={`${indicator.color} backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-lg w-full`}>
            <div className="p-4 lg:p-6">
              
              {/* 📊 HEADER CON ICONOS RESPONSIVE */}
              <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
                  <div className="p-1.5 lg:p-2 rounded-lg bg-white/10 backdrop-blur-sm flex-shrink-0">
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="fhr-subtitle text-xs lg:text-sm font-medium opacity-90">
                      {indicator.title}
                    </p>
                  </div>
                </div>
                
                {/* 📈 TREND INDICATOR CON RESPONSIVE */}
                {TrendIcon && (
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <TrendIcon className="h-3 w-3 lg:h-4 lg:w-4 opacity-75" />
                  </div>
                )}
              </div>
              
              {/* 🔢 MÉTRICAS Y SPARKLINE */}
              <div className="space-y-2 lg:space-y-3">
                
                {/* 💯 VALOR PRINCIPAL RESPONSIVE */}
                <div className="flex items-baseline space-x-1 lg:space-x-2">
                  <span className="text-xl lg:text-3xl font-bold leading-none">
                    {indicator.value}
                  </span>
                  <span className="text-xs lg:text-sm opacity-60 truncate">
                    {indicator.subtitle}
                  </span>
                </div>
                
                {/* 📊 SPARKLINE CON VALIDACIÓN SEGURA Y RESPONSIVE */}
                <div className="flex items-center justify-between">
                  <svg width="80" height="20" className="opacity-60 flex-shrink-0">
                    <polyline
                      points={generateSparklineData(indicator.sparklineData || [0], 80, 20)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* ⭕ PUNTO FINAL DESTACADO CON VALIDACIÓN */}
                    {indicator.sparklineData && indicator.sparklineData.length > 0 && (
                      <circle
                        cx={80}
                        cy={20 - ((indicator.sparklineData.slice(-1)[0] - Math.min(...indicator.sparklineData)) / 
                          (Math.max(...indicator.sparklineData) - Math.min(...indicator.sparklineData) || 1)) * 20}
                        r="2"
                        fill="currentColor"
                      />
                    )}
                  </svg>
                  
                  {/* 📅 LABEL TEMPORAL RESPONSIVE */}
                  <span className="text-xs opacity-50 flex-shrink-0 ml-2">
                    7 días
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}