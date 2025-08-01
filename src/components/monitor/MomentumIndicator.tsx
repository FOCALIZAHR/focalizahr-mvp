// ====================================================================
// MOMENTUM INTELLIGENCE PANEL - EVOLUCIÓN WOW COMPLETA
// /src/components/monitor/MomentumIntelligencePanel.tsx
// Transformación: Simple indicador → Inteligencia predictiva avanzada
// ====================================================================

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Zap,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';
import type { DailyResponse } from '@/types';

// ====================================================================
// INTERFACES - INTELIGENCIA AVANZADA
// ====================================================================

interface MomentumIndicatorProps {
  dailyResponses: DailyResponse[];
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  lastRefresh: Date;
  onActionTrigger?: (action: string) => void;
}

interface MomentumAnalysis {
  // Análisis multi-periodo
  momentum48h: {
    changePercent: number;
    direction: 'accelerating' | 'decelerating' | 'stable';
    velocity: number; // respuestas por día
  };
  momentum7d: {
    changePercent: number;
    trend: 'growing' | 'declining' | 'steady';
    avgDaily: number;
  };
  
  // Predicción inteligente
  prediction: {
    projectedResponses3d: number;
    projectedFinalRate: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Alertas contextuales
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info';
    message: string;
    action?: string;
  }>;
  
  // Estados visuales
  visual: {
    primaryColor: string;
    secondaryColor: string;
    icon: React.ComponentType<any>;
    status: string;
    emoji: string;
  };
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

export function MomentumIndicator({
  dailyResponses,
  participationRate,
  daysRemaining,
  totalInvited,
  lastRefresh,
  onActionTrigger
}: MomentumIndicatorProps) {

  // 🧠 ANÁLISIS INTELIGENCIA MULTI-PERIODO
  const momentumAnalysis = useMemo((): MomentumAnalysis => {
    if (dailyResponses.length < 2) {
      return {
        momentum48h: { changePercent: 0, direction: 'stable', velocity: 0 },
        momentum7d: { changePercent: 0, trend: 'steady', avgDaily: 0 },
        prediction: { projectedResponses3d: 0, projectedFinalRate: participationRate, confidence: 0, riskLevel: 'low' },
        alerts: [{ type: 'info', message: 'Datos insuficientes para análisis de momentum' }],
        visual: { primaryColor: 'text-gray-400', secondaryColor: 'bg-gray-500/20', icon: BarChart3, status: 'Sin datos', emoji: '📊' }
      };
    }

    const sortedData = [...dailyResponses].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // ANÁLISIS 48H (últimas 2 respuestas)
    const last24h = sortedData[sortedData.length - 1]?.responses || 0;
    const prev24h = sortedData[sortedData.length - 2]?.responses || 0;
    
    const change48h = prev24h > 0 ? ((last24h - prev24h) / prev24h) * 100 : 0;
    const direction48h = change48h > 20 ? 'accelerating' : change48h < -20 ? 'decelerating' : 'stable';
    const velocity48h = (last24h + prev24h) / 2;

    // ANÁLISIS 7D (tendencia semanal)
    const recent7d = sortedData.slice(-7);
    const older7d = sortedData.slice(-14, -7);
    
    const avg7dRecent = recent7d.reduce((sum, d) => sum + d.responses, 0) / Math.max(recent7d.length, 1);
    const avg7dOlder = older7d.reduce((sum, d) => sum + d.responses, 0) / Math.max(older7d.length, 1);
    
    const change7d = avg7dOlder > 0 ? ((avg7dRecent - avg7dOlder) / avg7dOlder) * 100 : 0;
    const trend7d = change7d > 10 ? 'growing' : change7d < -10 ? 'declining' : 'steady';

    // PREDICCIÓN INTELIGENTE (3 días futuros)
    const avgVelocity = avg7dRecent;
    const projectedResponses3d = Math.round(avgVelocity * Math.min(daysRemaining, 3));
    const currentResponses = Math.round((participationRate / 100) * totalInvited);
    const projectedTotal = currentResponses + (avgVelocity * daysRemaining);
    const projectedFinalRate = Math.min(100, (projectedTotal / totalInvited) * 100);
    
    // CONFIANZA BASADA EN CONSISTENCIA
    const variance = recent7d.reduce((sum, d) => sum + Math.pow(d.responses - avg7dRecent, 2), 0) / recent7d.length;
    const consistency = Math.max(0, 100 - (variance / avg7dRecent) * 50);
    const confidence = Math.round(consistency);

    // NIVEL DE RIESGO
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (direction48h === 'decelerating' && change48h < -40) riskLevel = 'critical';
    else if (direction48h === 'decelerating' && change48h < -20) riskLevel = 'high';
    else if (direction48h === 'stable' && projectedFinalRate < 70) riskLevel = 'medium';
    else riskLevel = 'low';

    // ALERTAS CONTEXTUALES INTELIGENTES
    const alerts: MomentumAnalysis['alerts'] = [];
    
    if (riskLevel === 'critical') {
      alerts.push({
        type: 'urgent',
        message: `Momentum crítico: -${Math.abs(change48h).toFixed(0)}% en 24h`,
        action: 'Intervenir inmediatamente'
      });
    } else if (riskLevel === 'high') {
      alerts.push({
        type: 'warning',
        message: `Desaceleración detectada: -${Math.abs(change48h).toFixed(0)}%`,
        action: 'Enviar recordatorios'
      });
    } else if (direction48h === 'accelerating') {
      alerts.push({
        type: 'info',
        message: `Aceleración positiva: +${change48h.toFixed(0)}%`,
        action: 'Mantener estrategia'
      });
    }

    if (daysRemaining <= 2 && projectedFinalRate < 70) {
      alerts.push({
        type: 'urgent',
        message: 'Ventana crítica: <48h para alcanzar objetivo',
        action: 'Acción intensiva necesaria'
      });
    }

    // CONFIGURACIÓN VISUAL
    let visual: MomentumAnalysis['visual'];
    if (riskLevel === 'critical') {
      visual = {
        primaryColor: 'text-red-400',
        secondaryColor: 'bg-red-500/20',
        icon: AlertTriangle,
        status: 'Crítico',
        emoji: '🚨'
      };
    } else if (riskLevel === 'high') {
      visual = {
        primaryColor: 'text-orange-400',
        secondaryColor: 'bg-orange-500/20',
        icon: TrendingDown,
        status: 'Riesgo Alto',
        emoji: '⚠️'
      };
    } else if (direction48h === 'accelerating') {
      visual = {
        primaryColor: 'text-green-400',
        secondaryColor: 'bg-green-500/20',
        icon: TrendingUp,
        status: 'Acelerando',
        emoji: '🚀'
      };
    } else {
      visual = {
        primaryColor: 'text-cyan-400',
        secondaryColor: 'bg-cyan-500/20',
        icon: Target,
        status: 'Estable',
        emoji: '🎯'
      };
    }

    return {
      momentum48h: {
        changePercent: Math.abs(change48h),
        direction: direction48h,
        velocity: velocity48h
      },
      momentum7d: {
        changePercent: Math.abs(change7d),
        trend: trend7d,
        avgDaily: avg7dRecent
      },
      prediction: {
        projectedResponses3d,
        projectedFinalRate,
        confidence,
        riskLevel
      },
      alerts,
      visual
    };
  }, [dailyResponses, participationRate, daysRemaining, totalInvited]);

  const StatusIcon = momentumAnalysis.visual.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${momentumAnalysis.visual.secondaryColor}`}>
                <StatusIcon className={`h-5 w-5 ${momentumAnalysis.visual.primaryColor}`} />
              </div>
              <div>
                <span className="text-white font-semibold">
                  {momentumAnalysis.visual.emoji} Momentum Intelligence
                </span>
                <div className={`text-sm ${momentumAnalysis.visual.primaryColor} font-medium`}>
                  {momentumAnalysis.visual.status}
                </div>
              </div>
            </CardTitle>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${momentumAnalysis.visual.primaryColor}`}>
                {momentumAnalysis.momentum48h.changePercent.toFixed(0)}%
              </div>
              <div className="text-xs text-white/60">
                vs. 48h previas
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* SECCIÓN PRINCIPAL - COMPACTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${momentumAnalysis.visual.secondaryColor}`}>
                <StatusIcon className={`h-5 w-5 ${momentumAnalysis.visual.primaryColor}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${momentumAnalysis.visual.primaryColor}`}>
                  {momentumAnalysis.momentum48h.changePercent.toFixed(0)}%
                </div>
                <div className="text-sm text-white/60">
                  vs. 48h previas
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-white font-medium">
                {momentumAnalysis.visual.status}
              </div>
              <div className="text-xs text-white/60">
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* MÉTRICAS COMPACTAS - GRID 3 COLUMNAS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
              <Activity className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {momentumAnalysis.momentum48h.velocity.toFixed(1)}
              </div>
              <div className="text-xs text-white/60">
                Velocidad/día
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
              <BarChart3 className="h-4 w-4 text-purple-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {momentumAnalysis.momentum7d.avgDaily.toFixed(1)}
              </div>
              <div className="text-xs text-white/60">
                Tendencia 7d
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
              <Target className="h-4 w-4 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">
                {momentumAnalysis.prediction.confidence}%
              </div>
              <div className="text-xs text-white/60">
                Confianza
              </div>
            </div>
          </div>

          {/* PREDICCIÓN - COMPACTA */}
          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg p-3 border border-purple-400/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-white font-medium text-sm">Predicción 3d</span>
              </div>
              <div className={`text-xl font-bold ${momentumAnalysis.visual.primaryColor}`}>
                {momentumAnalysis.prediction.projectedFinalRate.toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-white/60 mt-1">
              +{momentumAnalysis.prediction.projectedResponses3d} respuestas esperadas
            </div>
          </div>

          {/* TIMELINE MINI */}
          <div className="space-y-2">
            <div className="text-center text-xs text-white/60">
              Últimos 7 días
            </div>
            
            <div className="flex items-end justify-center gap-1 h-8">
              {dailyResponses.slice(-7).map((day, index) => {
                const maxResponses = Math.max(...dailyResponses.slice(-7).map(d => d.responses));
                const height = maxResponses > 0 ? (day.responses / maxResponses) * 100 : 0;
                const isRecent = index >= dailyResponses.slice(-7).length - 2;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 10)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`
                      w-3 rounded-sm transition-all duration-300
                      ${isRecent 
                        ? momentumAnalysis.visual.secondaryColor
                        : 'bg-white/10'
                      }
                    `}
                    title={`${day.date}: ${day.responses} respuestas`}
                  />
                );
              })}
            </div>
          </div>

          {/* ALERTAS - SOLO SI EXISTEN */}
          {momentumAnalysis.alerts.length > 0 && (
            <div className="space-y-2">
              {momentumAnalysis.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`
                    px-3 py-2 rounded-lg text-xs border flex items-center justify-between
                    ${alert.type === 'urgent' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      'bg-blue-500/10 border-blue-500/30 text-blue-400'}
                  `}
                >
                  <span>{alert.message}</span>
                  {alert.action && onActionTrigger && (
                    <button
                      onClick={() => onActionTrigger(alert.action!)}
                      className="ml-2 hover:underline font-medium"
                    >
                      {alert.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MomentumIndicator;