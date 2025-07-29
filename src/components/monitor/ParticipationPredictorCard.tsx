// ====================================================================
// FOCALIZAHR PARTICIPATION PREDICTOR CARD - WOW Foundation Intelligence
// src/components/monitor/ParticipationPredictorCard.tsx
// Chat 4A: Foundation Intelligence Component 2/3
// ====================================================================

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { ParticipationPredictionData } from '@/types';

interface ParticipationPredictorCardProps {
  participationPrediction: ParticipationPredictionData | null;
  currentRate: number;
  daysLeft: number;
  lastRefresh: Date;
}

export function ParticipationPredictorCard({ 
  participationPrediction, 
  currentRate,
  daysLeft,
  lastRefresh 
}: ParticipationPredictorCardProps) {
  
  // Manejar caso sin datos
  if (!participationPrediction) {
    return (
      <Card className="glass-card neural-glow border-slate-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
        <CardHeader className="pb-3">
          <CardTitle className="fhr-title-gradient flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-400" />
            Predictor de Participación
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center py-8">
          <div className="text-white/50 text-sm">
            Insuficientes datos para predicción matemática
          </div>
          <div className="text-xs text-white/30 mt-2">
            Se requieren al menos 2 días de actividad
          </div>
        </CardContent>
      </Card>
    );
  }

  const { finalProjection, velocity, riskLevel, daysLeft: predictionDays } = participationPrediction;
  
  // Configuración visual por nivel de riesgo
  const riskConfig = {
    low: {
      color: 'text-green-400',
      bgColor: 'from-green-500/10 to-emerald-500/5',
      borderColor: 'border-green-500/30',
      icon: CheckCircle,
      label: 'Bajo Riesgo',
      message: 'Proyección en objetivo'
    },
    medium: {
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/10 to-orange-500/5',
      borderColor: 'border-yellow-500/30',
      icon: Clock,
      label: 'Riesgo Medio',
      message: 'Requiere seguimiento'
    },
    high: {
      color: 'text-red-400',
      bgColor: 'from-red-500/10 to-pink-500/5',
      borderColor: 'border-red-500/30',
      icon: AlertTriangle,
      label: 'Alto Riesgo',
      message: 'Acción inmediata requerida'
    }
  };

  const config = riskConfig[riskLevel];
  const IconComponent = config.icon;
  
  // Calcular progreso visual
  const progressWidth = Math.min(100, Math.max(0, finalProjection));
  const currentProgressWidth = Math.min(100, Math.max(0, currentRate));
  
  // Determinar si estamos mejorando o empeorando
  const trend = finalProjection > currentRate ? 'up' : 'down';
  const changeAmount = Math.abs(finalProjection - currentRate);

  return (
    <Card className="glass-card neural-glow border-fhr-purple/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="fhr-title-gradient flex items-center gap-2">
            <Target className="h-5 w-5 text-fhr-purple" />
            Predictor de Participación
          </CardTitle>
          <div className="text-xs text-white/60">
            Actualizado: {lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* PROYECCIÓN PRINCIPAL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/80">Proyección Final</div>
            <div className={`flex items-center gap-1 ${config.color}`}>
              <IconComponent className="h-4 w-4" />
              <span className="text-xs font-medium">{config.label}</span>
            </div>
          </div>
          
          {/* BARRA DE PROGRESO COMPARATIVA */}
          <div className="space-y-2">
            {/* Proyección final */}
            <div className="relative">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Proyección</span>
                <span className={`font-bold ${config.color}`}>{finalProjection}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${config.bgColor} ${config.borderColor} border-r-2 transition-all duration-700`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
            
            {/* Estado actual */}
            <div className="relative">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Actual</span>
                <span className="text-fhr-cyan font-bold">{currentRate}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-fhr-cyan/60 to-cyan-400/60 transition-all duration-500"
                  style={{ width: `${currentProgressWidth}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DETALLADAS */}
        <div className="grid grid-cols-3 gap-3">
          {/* Velocidad */}
          <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-transparent 
                          rounded-lg border border-blue-500/20">
            <div className="text-lg font-bold text-blue-400">
              {velocity.toFixed(1)}
            </div>
            <div className="text-xs text-white/60">Resp/día</div>
          </div>
          
          {/* Cambio proyectado */}
          <div className={`text-center p-3 bg-gradient-to-br ${config.bgColor} to-transparent 
                          rounded-lg border ${config.borderColor}`}>
            <div className={`text-lg font-bold ${config.color} flex items-center justify-center gap-1`}>
              {trend === 'up' ? '+' : ''}{(finalProjection - currentRate).toFixed(1)}%
              <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
            </div>
            <div className="text-xs text-white/60">Cambio</div>
          </div>
          
          {/* Días restantes */}
          <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-transparent 
                          rounded-lg border border-purple-500/20">
            <div className="text-lg font-bold text-purple-400">
              {predictionDays}
            </div>
            <div className="text-xs text-white/60">Días rest.</div>
          </div>
        </div>

        {/* ANÁLISIS INTELIGENTE */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-white/80">Análisis Predictivo</div>
          
          <div className={`p-3 rounded-lg bg-gradient-to-r ${config.bgColor} border ${config.borderColor}`}>
            <div className={`flex items-start gap-2 ${config.color}`}>
              <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">{config.message}</div>
                <div className="text-xs text-white/70">
                  {riskLevel === 'high' && (
                    `Con velocidad actual (${velocity.toFixed(1)} resp/día), existe riesgo de no alcanzar objetivos.`
                  )}
                  {riskLevel === 'medium' && (
                    `Tendencia moderada. Monitorear próximos ${Math.ceil(predictionDays/2)} días para ajustar estrategia.`
                  )}
                  {riskLevel === 'low' && (
                    `Proyección estable. Mantener estrategia actual para alcanzar ${finalProjection}%.`
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ALGORITMO */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <div className="text-xs text-white/40">
            Regresión lineal - {velocity > 0 ? 'Trending' : 'Stable'}
          </div>
          <div className="text-xs text-fhr-purple/80">
            🎯 Prediction Engine
          </div>
        </div>
      </CardContent>
    </Card>
  );
}