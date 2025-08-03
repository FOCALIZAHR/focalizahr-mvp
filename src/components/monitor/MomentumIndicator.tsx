// ====================================================================
// MOMENTUM INDICATOR CORREGIDO - SIN CÁLCULOS INTERNOS
// /src/components/monitor/MomentumIndicator.tsx
// CORRIGE BUG +183% - Usa datos del hook vs calcular internamente
// ====================================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react';
import type { ParticipationPredictionData } from '@/types';

// ====================================================================
// PROPS SIMPLIFICADAS - SOLO DATOS DEL HOOK
// ====================================================================

interface MomentumIndicatorProps {
  // ✅ USAR DATOS PRE-CALCULADOS DEL HOOK
  participationPrediction: ParticipationPredictionData | null;
  participationRate: number;
  daysRemaining: number;
  lastRefresh: Date;
  onActionTrigger?: (action: string) => void;
}

// ====================================================================
// COMPONENTE SIMPLIFICADO - SOLO PRESENTACIÓN
// ====================================================================

export function MomentumIndicator({
  participationPrediction,
  participationRate,
  daysRemaining,
  lastRefresh,
  onActionTrigger
}: MomentumIndicatorProps) {

  // ✅ CASO SIN DATOS - MENSAJE CLARO
  if (!participationPrediction) {
    return (
      <Card className="glass-card neural-glow border-slate-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
        <CardHeader className="pb-3">
          <CardTitle className="fhr-title-gradient flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            Momentum Intelligence
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center py-8">
          <div className="text-white/50 text-sm">
            Datos insuficientes para análisis momentum
          </div>
          <div className="text-xs text-white/30 mt-2">
            Se requieren al menos 2 días de actividad
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ USAR DATOS DEL HOOK DIRECTAMENTE
  const { finalProjection, velocity, riskLevel, confidence } = participationPrediction;
  
  // ✅ CONFIGURACIÓN VISUAL SIMPLE
  const getRiskConfig = (risk: string) => {
    const configs = {
      low: {
        color: 'text-green-400',
        bgColor: 'from-green-500/10 to-emerald-500/5',
        borderColor: 'border-green-500/30',
        icon: Target,
        label: 'Bajo Riesgo',
        emoji: '🎯'
      },
      medium: {
        color: 'text-yellow-400',
        bgColor: 'from-yellow-500/10 to-orange-500/5',
        borderColor: 'border-yellow-500/30',
        icon: TrendingUp,
        label: 'Riesgo Medio',
        emoji: '⚡'
      },
      high: {
        color: 'text-red-400',
        bgColor: 'from-red-500/10 to-pink-500/5',
        borderColor: 'border-red-500/30',
        icon: AlertTriangle,
        label: 'Alto Riesgo',
        emoji: '🚨'
      }
    };
    return configs[risk as keyof typeof configs] || configs.low;
  };

  const config = getRiskConfig(riskLevel);
  const IconComponent = config.icon;
  
  // ✅ MOMENTUM SIMPLE VS ACTUAL
  const momentumDirection = finalProjection > participationRate ? 'up' : 
                           finalProjection < participationRate ? 'down' : 'stable';
  const momentumChange = Math.abs(finalProjection - participationRate);

  return (
    <Card className={`glass-card neural-glow border ${config.borderColor} bg-gradient-to-br ${config.bgColor} backdrop-blur-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="fhr-title-gradient flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${config.color}`} />
            Momentum Intelligence
          </CardTitle>
          <div className="text-xs text-white/60">
            {lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* INDICADOR PRINCIPAL */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-3"
          >
            <span className="text-3xl">{config.emoji}</span>
            <div>
              <div className={`text-2xl font-bold ${config.color}`}>
                {finalProjection}%
              </div>
              <div className="text-xs text-white/70">
                Proyección Final
              </div>
            </div>
          </motion.div>

          {/* MOMENTUM CHANGE VS ACTUAL */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {momentumDirection === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
            {momentumDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
            {momentumDirection === 'stable' && <Target className="h-4 w-4 text-blue-400" />}
            
            <span className="text-white/80 text-sm">
              {momentumDirection === 'up' ? '+' : momentumDirection === 'down' ? '-' : '±'}
              {momentumChange.toFixed(1)}% vs actual ({participationRate}%)
            </span>
          </div>
        </div>

        {/* MÉTRICAS GRID */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
            <Activity className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">
              {velocity}
            </div>
            <div className="text-xs text-white/60">
              Velocidad/día
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
            <Target className="h-4 w-4 text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">
              {confidence}%
            </div>
            <div className="text-xs text-white/60">
              Confianza
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
            <BarChart3 className="h-4 w-4 text-green-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-white">
              {daysRemaining}
            </div>
            <div className="text-xs text-white/60">
              Días restantes
            </div>
          </div>
        </div>

        {/* STATUS Y ACCIÓN */}
        <div className={`rounded-lg p-3 border ${config.borderColor} bg-gradient-to-r ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${config.color}`}>
                {config.label}
              </div>
              <div className="text-xs text-white/70 mt-1">
                Proyección: {finalProjection}% (Confianza: {confidence}%)
              </div>
            </div>
            
            {onActionTrigger && riskLevel === 'high' && (
              <button
                onClick={() => onActionTrigger('send_reminder')}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg transition-colors"
              >
                Actuar Ya
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}