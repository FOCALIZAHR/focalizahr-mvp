// ARCHIVO: /src/components/monitor/MomentumIndicator.tsx
// PROPÓSITO: Indicador de momentum/tendencia últimas 48h
// INTEGRACIÓN: Se agrega a CampaignMetricsGrid sin modificar estructura

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Importar utilidades necesarias para integración
import type { DailyResponse } from '@/lib/utils/monitor-utils';

interface MomentumIndicatorProps {
  dailyResponses: DailyResponse[];
  lastRefresh: Date;
}

export function MomentumIndicator({ dailyResponses, lastRefresh }: MomentumIndicatorProps) {
  // Calcular tendencia últimas 48h
  const calculateMomentum = () => {
    if (dailyResponses.length < 2) {
      return {
        trend: 'stable' as const,
        percentage: 0,
        direction: 'neutral' as const,
        last24h: 0,
        previous24h: 0
      };
    }

    // Obtener últimos 2 días de datos
    const sortedData = [...dailyResponses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const last24h = sortedData[sortedData.length - 1]?.responses || 0;
    const previous24h = sortedData[sortedData.length - 2]?.responses || 0;

    if (previous24h === 0) {
      return {
        trend: 'stable' as const,
        percentage: 0,
        direction: 'neutral' as const,
        last24h,
        previous24h
      };
    }

    const percentageChange = ((last24h - previous24h) / previous24h) * 100;
    
    let trend: 'accelerating' | 'decelerating' | 'stable';
    let direction: 'up' | 'down' | 'neutral';

    if (percentageChange > 15) {
      trend = 'accelerating';
      direction = 'up';
    } else if (percentageChange < -15) {
      trend = 'decelerating';
      direction = 'down';
    } else {
      trend = 'stable';
      direction = 'neutral';
    }

    return {
      trend,
      percentage: Math.abs(percentageChange),
      direction,
      last24h,
      previous24h
    };
  };

  const momentum = calculateMomentum();

  // Configuración visual basada en tendencia
  const getVisualConfig = () => {
    switch (momentum.direction) {
      case 'up':
        return {
          icon: TrendingUp,
          iconColor: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-300',
          label: 'Acelerando',
          emoji: '📈'
        };
      case 'down':
        return {
          icon: TrendingDown,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-300',
          label: 'Desacelerando',
          emoji: '📉'
        };
      default:
        return {
          icon: Minus,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-300',
          label: 'Estable',
          emoji: '📊'
        };
    }
  };

  const visual = getVisualConfig();
  const TrendIcon = visual.icon;

  return (
    <Card className={`glass-card neural-glow ${visual.borderColor}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">
          {visual.emoji} Momentum 48h
        </CardTitle>
        <div className={`w-10 h-10 rounded-lg ${visual.bgColor} layout-center`}>
          <TrendIcon className={`h-4 w-4 ${visual.iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Indicador principal */}
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${visual.textColor}`}>
              {momentum.percentage.toFixed(1)}%
            </div>
            <div className={`text-sm ${visual.textColor}`}>
              {visual.label}
            </div>
          </div>

          {/* Comparación 24h */}
          <div className="text-xs text-white/60 space-y-1">
            <div>Últimas 24h: {momentum.last24h} respuestas</div>
            <div>Previas 24h: {momentum.previous24h} respuestas</div>
          </div>

          {/* Mini sparkline visual */}
          <div className="flex items-end gap-1 h-8">
            {dailyResponses.slice(-7).map((day, index) => {
              const maxResponses = Math.max(...dailyResponses.slice(-7).map(d => d.responses));
              const height = maxResponses > 0 ? (day.responses / maxResponses) * 100 : 0;
              
              return (
                <div
                  key={index}
                  className={`flex-1 ${visual.bgColor} rounded-sm transition-all duration-300`}
                  style={{ height: `${Math.max(height, 8)}%` }}
                  title={`${day.date}: ${day.responses} respuestas`}
                />
              );
            })}
          </div>

          {/* Timestamp actualización */}
          <div className="text-xs text-white/40">
            Actualizado: {lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}