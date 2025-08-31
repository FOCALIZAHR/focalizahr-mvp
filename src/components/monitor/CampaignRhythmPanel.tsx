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
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Clock, Zap } from 'lucide-react';
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
} as const;

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
    const historical = dailyResponses.map((day, index) => {
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
        projectedRate: undefined,  // No hay proyección en datos históricos
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
        projectedRate: currentRate  // Agregar punto inicial de proyección
      };
      
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

  // 🎨 MÉTRICAS DESTACADAS
  const metrics = useMemo(() => {
    const velocity = participationPrediction?.velocity || 0;
    const projection = participationPrediction?.finalProjection || participationRate;
    const riskLevel = participationPrediction?.riskLevel || 'low';
    
    return {
      velocity: `+${velocity.toFixed(1)}/día`,
      projection: `${projection}%`,
      daysLeft: `${daysRemaining} días`,
      riskColor: riskLevel === 'high' ? 'text-red-400' : 
                 riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400',
      projectionColor: projection >= targetRate ? 'text-green-400' : 
                      projection >= targetRate * 0.9 ? 'text-yellow-400' : 'text-red-400'
    };
  }, [participationPrediction, participationRate, targetRate, daysRemaining]);

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
            <p className="text-fhr-cyan text-sm">
              Respuestas: {data.responses}
            </p>
          )}
          {data.cumulativeRate !== undefined && (
            <p className="text-fhr-cyan text-sm">
              Acumulado: {data.cumulativeRate}%
            </p>
          )}
          {data.projectedRate !== undefined && data.isPrediction && (
            <p className="text-fhr-purple text-sm">
              Proyección: {data.projectedRate}%
            </p>
          )}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
    data-component="CampaignRhythmPanel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* HEADER CON MÉTRICAS DESTACADAS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-fhr-cyan" />
              <span className="text-white/70 text-sm font-medium">Velocidad Actual</span>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.velocity}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-fhr-purple" />
              <span className="text-white/70 text-sm font-medium">Proyección Final</span>
            </div>
            <div className={`text-2xl font-bold ${metrics.projectionColor}`}>
              {metrics.projection}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-fhr-blue" />
              <span className="text-white/70 text-sm font-medium">Días Restantes</span>
            </div>
            <div className="text-2xl font-bold text-white">{metrics.daysLeft}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* GRÁFICO PRINCIPAL COMBINADO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 glass-card neural-glow backdrop-blur-md border-fhr-cyan/20 hover:border-white/20 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-fhr-cyan" />
                <h3 className="fhr-title-gradient text-white font-semibold text-lg">
                  Panel de Ritmo y Proyección
                </h3>
              </div>
              <div className="text-white/60 text-sm">
                Pasado → Presente → Futuro
              </div>
            </div>

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
                    radius={CHART_CONFIG.barRadius}
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

            {/* LEYENDA VISUAL */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-gradient-to-b from-fhr-purple/80 to-fhr-purple/30 rounded"></div>
                <span className="text-white/70">Ritmo Diario</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-fhr-cyan rounded"></div>
                <span className="text-white/70">Progreso Acumulado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-fhr-purple" style={{ borderTop: '2px dashed #A78BFA' }}></div>
                <span className="text-white/70">Proyección Futura</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* INSIGHTS CONTEXTUALES */}
      {participationPrediction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 backdrop-blur-md border border-cyan-400/30">
            <CardContent className="p-4">
              <h4 className="text-white font-medium mb-2">Estado de Momentum</h4>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${metrics.riskColor.replace('text-', 'bg-')}`}></div>
                <span className="text-white/80 text-sm capitalize">
                  {participationPrediction.riskLevel === 'high' ? 'Riesgo Alto' :
                   participationPrediction.riskLevel === 'medium' ? 'Riesgo Medio' : 'En Objetivo'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/15 backdrop-blur-md border border-cyan-400/30">
            <CardContent className="p-4">
              <h4 className="text-white font-medium mb-2">Confianza Matemática</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-fhr-cyan to-fhr-purple rounded-full transition-all duration-1000"
                    style={{ width: `${participationPrediction.confidence || 75}%` }}
                  ></div>
                </div>
                <span className="text-white/80 text-sm">
                  {participationPrediction.confidence || 75}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CampaignRhythmPanel;