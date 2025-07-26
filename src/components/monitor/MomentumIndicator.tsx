// ARCHIVO: /src/components/monitor/MomentumIndicator.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap 
} from 'lucide-react';
import type { DailyResponse } from '@/lib/utils/monitor-utils';

interface MomentumIndicatorProps {
  dailyResponses: DailyResponse[];
}

interface MomentumAnalysis {
  trend: 'accelerating' | 'decelerating' | 'stable';
  trendPercentage: number;
  momentum: 'high' | 'medium' | 'low';
  prediction: string;
  insight: string;
  color: string;
  icon: JSX.Element;
}

// Función para calcular el momentum basado en trendData
function calculateMomentum(dailyResponses: DailyResponse[]): MomentumAnalysis {
  if (dailyResponses.length < 3) {
    return {
      trend: 'stable',
      trendPercentage: 0,
      momentum: 'low',
      prediction: 'Datos insuficientes',
      insight: 'Se requieren al menos 3 días de datos para análisis',
      color: 'text-gray-400',
      icon: <Activity className="h-4 w-4" />
    };
  }

  // Obtener los últimos 3 días de datos
  const recentData = dailyResponses.slice(-3);
  const responses = recentData.map(day => day.responses);
  
  // Calcular tendencia usando regresión lineal simple
  const n = responses.length;
  const x = Array.from({length: n}, (_, i) => i + 1);
  const y = responses;
  
  // Calcular pendiente (slope)
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Calcular el momentum en base a últimas 48 horas (últimos 2 días)
  const last48h = responses.slice(-2);
  const trendPercentage = last48h.length === 2 && last48h[0] > 0 
    ? ((last48h[1] - last48h[0]) / last48h[0]) * 100 
    : 0;

  // Determinar el estado del momentum
  let trend: 'accelerating' | 'decelerating' | 'stable';
  let momentum: 'high' | 'medium' | 'low';
  let color: string;
  let icon: JSX.Element;
  let prediction: string;
  let insight: string;

  if (Math.abs(trendPercentage) < 10) {
    trend = 'stable';
    momentum = 'medium';
    color = 'text-blue-400';
    icon = <Activity className="h-4 w-4" />;
    prediction = 'Participación estable';
    insight = 'Ritmo de respuestas consistente. Buen momento para recordatorios específicos.';
  } else if (trendPercentage > 10) {
    trend = 'accelerating';
    momentum = trendPercentage > 25 ? 'high' : 'medium';
    color = 'text-green-400';
    icon = <TrendingUp className="h-4 w-4" />;
    prediction = `Aceleración +${Math.round(trendPercentage)}%`;
    insight = momentum === 'high' 
      ? '🚀 Momentum excelente! La campaña tiene gran engagement. Considera extender alcance.'
      : '📈 Buena tracción. Mantén la comunicación activa para aprovechar el momentum.';
  } else {
    trend = 'decelerating';
    momentum = trendPercentage < -25 ? 'low' : 'medium';
    color = 'text-orange-400';
    icon = <TrendingDown className="h-4 w-4" />;
    prediction = `Desaceleración ${Math.round(trendPercentage)}%`;
    insight = momentum === 'low'
      ? '⚠️ Momentum bajo. Acción requerida: recordatorios urgentes y extensión de campaña.'
      : '📉 Perdiendo velocidad. Recomiendo recordatorios dirigidos a departamentos específicos.';
  }

  return {
    trend,
    trendPercentage,
    momentum,
    prediction,
    insight,
    color,
    icon
  };
}

export function MomentumIndicator({ dailyResponses }: MomentumIndicatorProps) {
  const analysis = calculateMomentum(dailyResponses);

  const getBadgeColor = (momentum: string) => {
    switch (momentum) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getMomentumGradient = (trend: string) => {
    switch (trend) {
      case 'accelerating': return 'from-green-500 to-emerald-500';
      case 'decelerating': return 'from-orange-500 to-red-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  return (
    <Card className="glass-card neural-glow border-l-4 border-l-cyan-400">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          Momentum Inteligente
        </CardTitle>
        <Badge 
          variant="outline" 
          className={`text-xs ${getBadgeColor(analysis.momentum)}`}
        >
          {analysis.momentum.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <div className={`${analysis.color}`}>
            {analysis.icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {analysis.prediction}
            </div>
            <p className="text-xs text-white/60">
              Últimas 48 horas
            </p>
          </div>
        </div>
        
        {/* Barra de momentum visual */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Intensidad</span>
            <span>{Math.abs(analysis.trendPercentage).toFixed(1)}%</span>
          </div>
          <div className="progress-container bg-white/10">
            <div 
              className={`progress-fill bg-gradient-to-r ${getMomentumGradient(analysis.trend)}`}
              style={{ 
                width: `${Math.min(Math.abs(analysis.trendPercentage) * 2, 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Insight inteligente */}
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-white/90 leading-relaxed">
            {analysis.insight}
          </p>
        </div>

        {/* Indicador visual del trend */}
        <div className="flex items-center justify-center mt-3 pt-2 border-t border-white/10">
          <div className={`flex items-center gap-1 text-xs ${analysis.color}`}>
            {analysis.icon}
            <span className="font-medium">
              {analysis.trend === 'accelerating' ? 'Acelerando' : 
               analysis.trend === 'decelerating' ? 'Desacelerando' : 'Estable'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}