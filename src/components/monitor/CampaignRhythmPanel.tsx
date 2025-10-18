// ====================================================================
// CAMPAIGN RHYTHM PANEL - COMPONENTE WOW DEFINITIVO
// /src/components/monitor/CampaignRhythmPanel.tsx
// Materialización de la visión: Timeline visual del futuro + Elegancia
// ====================================================================

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine 
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, Activity, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DailyResponse, ParticipationPredictionData } from '@/types';

// ====================================================================
// INTERFACES - COMPONENTE "TONTO" SEGÚN ARQUITECTURA
// ====================================================================

interface CampaignRhythmPanelProps {
  // Datos desde useCampaignMonitor - NO cálculos internos
  dailyResponses: DailyResponse[];
  participationRate: number;
  participationPrediction?: ParticipationPredictionData;
  daysRemaining: number;
  totalInvited: number;
  targetRate?: number;
}

interface ChartDataPoint {
  day: string;
  date: string;
  responses?: number;  // Opcional para puntos futuros
  cumulativeRate?: number;  // Opcional para puntos futuros
  projectedRate?: number;  // Opcional para puntos históricos
  isPrediction: boolean;
}

// ====================================================================
// CONFIGURACIÓN VISUAL - GLASSMORPHISM + PALETA FOCALIZAHR
// ====================================================================

const COLORS = {
  fhrCyan: '#22D3EE',
  fhrPurple: '#A78BFA', 
  fhrBlue: '#3B82F6',
  gradient: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
} as const;

const CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  barRadius: [4, 4, 0, 0],
  strokeWidth: 3,
  dotSize: 6,
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

const CampaignRhythmPanel: React.FC<CampaignRhythmPanelProps> = ({
  dailyResponses,
  participationRate,
  participationPrediction,
  daysRemaining,
  totalInvited,
  targetRate = 70
}) => {
  
  // 🧠 PREPARACIÓN DE DATOS PARA CHART (Solo transformación, no cálculos de negocio)
  const chartData = useMemo((): ChartDataPoint[] => {
    // Datos históricos con todas las métricas
    const historical: ChartDataPoint[] = dailyResponses.map((day, index) => {
      // Calcular tasa acumulativa hasta este día
      const responsesUpToDay = dailyResponses
        .slice(0, index + 1)
        .reduce((sum, d) => sum + d.responses, 0);
      const cumulativeRate = totalInvited > 0 ? (responsesUpToDay / totalInvited) * 100 : 0;
      
      return {
        day: day.day,
        date: day.date,
        responses: day.responses,
        cumulativeRate: Math.round(cumulativeRate * 10) / 10,
       
        isPrediction: false
      };
    });

    // Agregar puntos de proyección futura (máximo 7 días)
    const projectionData: ChartDataPoint[] = [];
    if (participationPrediction && daysRemaining > 0 && historical.length > 0) {
      const lastDay = historical[historical.length - 1];
      const currentRate = lastDay?.cumulativeRate || participationRate;
      
      // Limitar proyección a 7 días máximo
      const projectionDays = Math.min(7, daysRemaining);
      const dailyIncrement = (participationPrediction.finalProjection - currentRate) / projectionDays;
      
      // PUNTO PUENTE: Conectar histórico con proyección
      // Este punto especial tiene AMBOS valores para crear continuidad visual
    historical[historical.length - 1] = {
  ...lastDay,
  projectedRate: currentRate
} as ChartDataPoint;  // ← Agregar type assertion
      
      // Generar puntos de proyección futura
      for (let i = 1; i <= projectionDays; i++) {
        const projectedValue = currentRate + (dailyIncrement * i);
        
        projectionData.push({
          day: i === projectionDays && daysRemaining <= 7 ? 'Fin' : `+${i}d`,
          date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          // NO incluir responses ni cumulativeRate en puntos futuros
          projectedRate: Math.round(projectedValue * 10) / 10,
          isPrediction: true
        });
      }
    }

    return [...historical, ...projectionData];
  }, [dailyResponses, participationRate, participationPrediction, daysRemaining, totalInvited]);

  // 🎯 TOOLTIP PERSONALIZADO
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl"
        >
          <p className="text-white/90 font-medium">{data.day}</p>
          {data.responses !== undefined && (
            <p className="text-cyan-400 text-sm">
              Respuestas: {data.responses}
            </p>
          )}
          {data.cumulativeRate !== undefined && (
            <p className="text-cyan-400 text-sm">
              Acumulado: {data.cumulativeRate}%
            </p>
          )}
          {data.projectedRate !== undefined && data.isPrediction && (
            <p className="text-purple-400 text-sm">
              Proyección: {data.projectedRate}%
            </p>
          )}
        </motion.div>
      );
    }
    return null;
  };

  // Calcular insight único no visible en header
  const uniqueInsight = useMemo(() => {
    if (!participationPrediction) return null;
    
    const daysToTarget = participationPrediction.finalProjection >= targetRate
      ? Math.ceil((targetRate - participationRate) / participationPrediction.velocity)
      : null;
    
    const momentum = participationPrediction.velocity > 0 ? 'acelerando' : 
                    participationPrediction.velocity < 0 ? 'desacelerando' : 'estable';
    
    return {
      daysToTarget,
      momentum,
      needsBoost: participationPrediction.finalProjection < targetRate * 0.9
    };
  }, [participationPrediction, participationRate, targetRate]);

  return (
    <motion.div
      data-component="CampaignRhythmPanel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* GRÁFICO PRINCIPAL COMO ÚNICO ELEMENTO */}
      <Card className="fhr-card glass-card backdrop-blur-xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Ritmo y Proyección Temporal
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Análisis predictivo con machine learning</p>
              </div>
            </div>
            {uniqueInsight && uniqueInsight.momentum && (
              <Badge 
                variant={uniqueInsight.momentum === 'acelerando' ? 'default' : 'secondary'}
                className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30"
              >
                <Activity className="h-3 w-3 mr-1" />
                {uniqueInsight.momentum}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-2">
          {/* CHART RESPONSIVO */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={CHART_CONFIG.margin}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.1)" 
                />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* LÍNEA DE OBJETIVO HORIZONTAL */}
                <ReferenceLine 
                  y={targetRate} 
                  stroke="#22D3EE"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{ value: `Objetivo ${targetRate}%`, position: "right", fill: '#22D3EE', fontSize: 11 }}
                />

                {/* BARRAS DE RITMO (SOLO DATOS HISTÓRICOS) */}
                <Bar
                  dataKey="responses"
                  fill={`url(#barGradient)`}
                  radius={[...CHART_CONFIG.barRadius] as [number, number, number, number]}
                  animationDuration={1000}
                  animationBegin={200}
                />

                {/* LÍNEA DE PROGRESO ACUMULADO (SOLO DATOS HISTÓRICOS) */}
                <Line
                  type="monotone"
                  dataKey="cumulativeRate"
                  stroke={COLORS.fhrCyan}
                  strokeWidth={CHART_CONFIG.strokeWidth}
                  dot={{ fill: COLORS.fhrCyan, strokeWidth: 2, r: CHART_CONFIG.dotSize }}
                  activeDot={{ r: 8, fill: COLORS.fhrCyan }}
                  animationDuration={1500}
                  animationBegin={800}
                  connectNulls={false}  // No conectar valores undefined
                />

                {/* LÍNEA DE PROYECCIÓN FUTURA */}
                <Line
                  type="monotone"
                  dataKey="projectedRate"
                  stroke={COLORS.fhrPurple}
                  strokeWidth={CHART_CONFIG.strokeWidth}
                  strokeDasharray="8 4"
                  dot={{ fill: COLORS.fhrPurple, strokeWidth: 2, r: CHART_CONFIG.dotSize }}
                  activeDot={{ r: 8, fill: COLORS.fhrPurple }}
                  animationDuration={1500}
                  animationBegin={1200}
                  connectNulls={true}  // Conectar el punto puente con la proyección
                />

                {/* GRADIENTES PARA BARRAS */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.fhrPurple} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={COLORS.fhrPurple} stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* LEYENDA VISUAL MINIMALISTA */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/50">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2.5 bg-gradient-to-b from-purple-500/80 to-purple-500/30 rounded"></div>
                <span className="text-gray-400">Respuestas diarias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-cyan-400 rounded"></div>
                <span className="text-gray-400">Acumulado real</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t border-dashed border-purple-400"></div>
                <span className="text-gray-400">Proyección ML</span>
              </div>
            </div>
            
            {/* Solo mostrar si hay dato único no redundante */}
            {uniqueInsight && uniqueInsight.daysToTarget && (
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3 w-3 text-yellow-400" />
                <span className="text-gray-400">
                  Alcanzará objetivo en ~{uniqueInsight.daysToTarget} días
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Solo mostrar insight si necesita intervención */}
      {uniqueInsight && uniqueInsight.needsBoost && participationPrediction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-orange-950/20 to-red-950/20 backdrop-blur-sm border border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-600/20 to-red-600/20">
                  <Activity className="h-4 w-4 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-100">
                    Intervención Recomendada
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Proyección {participationPrediction.finalProjection}% está {(targetRate - participationPrediction.finalProjection).toFixed(1)}% bajo el objetivo. 
                    Considerar acciones de impulso.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CampaignRhythmPanel;