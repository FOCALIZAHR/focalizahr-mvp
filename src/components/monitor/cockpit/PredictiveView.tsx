// ====================================================================
// PREDICTIVE VIEW - MISSION CONTROL FUTURISTA
// src/components/monitor/cockpit/PredictiveView.tsx
// RESPONSABILIDAD: Vista futura 100% TONTA - Solo presentación, NO cálculos
// ✅ ARQUITECTURA CORREGIDA: Usa exclusivamente datos pre-calculados
// 🎯 DISEÑO: Panel de Mando Bimodal Asimétrico - Foco único central
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, ArrowRight } from 'lucide-react';
import { PieChart, Pie, ResponsiveContainer, Cell } from 'recharts';

// 🎯 INTERFACE PROPS - DATOS PRE-CALCULADOS DESDE COCKPITHEADER
interface PredictiveViewProps {
  // Datos base
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  // Arrays de inteligencia
  topMovers: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>;
  
  // Objetos complejos
  participationPrediction?: {
    finalProjection: number;
    confidence: number;
    velocity: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  crossStudyComparison?: {
    percentileRanking: number;
    patternSimilarity: number;
    velocityTrend: 'faster' | 'slower' | 'similar';
  };
  insights: string[];
  recommendations: string[];
  
  // Cockpit Intelligence PRE-CALCULADA
  cockpitIntelligence?: {
    vectorMomentum: string;
    projection: {
      finalProjection: number;
      confidence: number;
      methodology: string;
      confidenceText: string;
    };
    action: {
      primary: string;
      reasoning: string;
      urgency: 'baja' | 'media' | 'alta' | 'crítica';
      nextSteps: string[];
      urgencyColor: string;
    };
    pattern: {
      dominantPattern: string;
      description: string;
      insights: string[];
      patternColor: string;
    };
  };
  
  // Handlers
  onNavigate?: (sectionId: string) => void;
  
  // Estados
  isLoading: boolean;
  lastRefresh: Date;
}

// 🎯 COMPONENTE PRINCIPAL
export default function PredictiveView(props: PredictiveViewProps) {
  // ✅ DESTRUCTURAR PROPS SEGÚN ARQUITECTURA MAESTRA
  const {
    participationRate,
    daysRemaining,
    totalInvited,
    totalResponded,
    topMovers,
    negativeAnomalies,
    participationPrediction,
    crossStudyComparison,
    insights,
    recommendations,
    cockpitIntelligence,
    onNavigate,
    isLoading,
    lastRefresh
  } = props;

  // ✅ NO HOOKS - COMPONENTE 100% TONTO POST-TRASPLANTE
  // Solo presenta datos - NO calcula, NO transforma, NO procesa

  // ✅ ARQUITECTURA POST-TRASPLANTE: SOLO DATOS PRE-CALCULADOS
  // NO recalcular nada - usar exclusivamente datos del hook central
  const velocidadActual = participationPrediction?.velocity || 0;
  const proyeccionFinal = cockpitIntelligence?.projection?.finalProjection || 
    participationPrediction?.finalProjection || 
    participationRate; // Fallback simple sin cálculos
  
  const confianza = cockpitIntelligence?.projection?.confidence || 
    participationPrediction?.confidence || 
    0; // Fallback simple sin algoritmos

  // ✅ FUNCIÓN AUXILIAR: DIAGNÓSTICO COMPRENSIBLE
  const getRealDiagnostic = (vectorMomentum: string): string => {
    if (vectorMomentum?.includes('⚠️') || vectorMomentum?.includes('Crisis')) return 'Ritmo Crítico Detectado';
    if (vectorMomentum?.includes('⚡') || vectorMomentum?.includes('Acelerando')) return 'Momentum Positivo Confirmado';
    if (vectorMomentum?.includes('🚀') || vectorMomentum?.includes('Estable')) return 'Trayectoria Estable';
    if (vectorMomentum?.includes('Objetivo')) return 'En Camino al Objetivo';
    return 'Análisis Predictivo Activo';
  };

  // 🎯 LAYOUT MISSION CONTROL FUTURISTA: FOCO ÚNICO + HUD PERIFÉRICO
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* ✅ HEADER DINÁMICO CON DIAGNÓSTICO */}
      <div className="mb-6">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-white mb-2">
            {getRealDiagnostic(cockpitIntelligence?.vectorMomentum || '')}
          </h2>
          <p className="text-white/60 text-sm">
            Proyección inteligente basada en {totalResponded} respuestas · Confianza {Math.round(confianza)}%
          </p>
        </motion.div>
      </div>

      {/* 🎯 NUEVO LAYOUT: ÁREA CENTRAL DOMINANTE + HUD PERIFÉRICO */}
      <div className="relative min-h-[400px] flex flex-col lg:flex-row gap-8">
        
        {/* HUD SUPERIOR: INFORMACIÓN SECUNDARIA */}
        <div className="absolute top-0 left-0 z-10 flex gap-6">
          <div className="text-xs text-white/40 font-mono">
            <span className="text-cyan-400">DÍAS RESTANTES:</span> {daysRemaining}
          </div>
          <div className="text-xs text-white/40 font-mono">
            <span className="text-cyan-400">META:</span> {totalInvited} empleados
          </div>
        </div>

        {/* HUD DERECHO: VELOCIDAD */}
        <div className="absolute top-0 right-0 z-10 text-right">
          <div className="text-xs text-white/40 font-mono">
            <span className="text-purple-400">VELOCIDAD:</span> {cockpitIntelligence?.vectorMomentum?.includes('+') ? 'ACELERANDO' : 'ESTABLE'}
          </div>
        </div>

        {/* ÁREA CENTRAL: VELOCÍMETRO PREDICTIVO GRANDE */}
        <div className="flex-1 flex items-center justify-center relative">
          <motion.div
            className="relative w-80 h-80 lg:w-96 lg:h-96"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {/* VELOCÍMETRO PRINCIPAL CON RECHARTS */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="velocimeterGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" />
                        <stop offset="100%" stopColor="#A78BFA" />
                      </linearGradient>
                    </defs>
                    {/* ARCO PRINCIPAL: PARTICIPACIÓN ACTUAL */}
                    <Pie
                      data={[
                        { value: participationRate, fill: 'url(#velocimeterGradient)' },
                        { value: 100 - participationRate, fill: 'rgba(255,255,255,0.1)' }
                      ]}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={120}
                      outerRadius={140}
                      paddingAngle={2}
                      dataKey="value"
                    />
                    {/* ARCO OBJETIVO: PROYECCIÓN FINAL */}
                    <Pie
                      data={[
                        { value: proyeccionFinal, fill: '#10B981' },
                        { value: 100 - proyeccionFinal, fill: 'rgba(255,255,255,0.05)' }
                      ]}
                      cx="50%"
                      cy="50%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={100}
                      outerRadius={115}
                      paddingAngle={1}
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* NÚMERO CENTRAL: PROYECCIÓN ESTRELLA */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      className="text-6xl font-bold text-white mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1, type: "spring", stiffness: 200 }}
                    >
                      {Math.round(proyeccionFinal)}%
                    </motion.div>
                    <div className="text-sm text-cyan-400 font-medium">PROYECCIÓN FINAL</div>
                    <div className="text-xs text-white/60 mt-1">
                      🎯 Objetivo en {daysRemaining} días
                    </div>
                  </div>
                </div>

                {/* MARCADOR DE DESTINO */}
                <motion.div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2"
                  animate={{ y: [-8, -12, -8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target className="w-6 h-6 text-green-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* PANEL INFORMACIÓN COMPLEMENTARIA */}
      <motion.div
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {/* MÉTRICAS ACTUALES */}
        <div className="text-center p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-sm text-white/60 mb-1">Participación Actual</div>
          <div className="text-2xl font-bold text-cyan-400">{participationRate}%</div>
          <div className="text-xs text-white/40">{totalResponded} de {totalInvited}</div>
        </div>

        {/* VELOCIDAD */}
        <div className="text-center p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-sm text-white/60 mb-1">Velocidad Actual</div>
          <div className="text-2xl font-bold text-purple-400">
            {velocidadActual > 0 ? '+' : ''}{velocidadActual.toFixed(1)}%/día
          </div>
          <div className="text-xs text-white/40">
            {velocidadActual > 1 ? 'Acelerando' : velocidadActual > 0 ? 'Estable' : 'Desacelerando'}
          </div>
        </div>

        {/* ACCIÓN RECOMENDADA */}
        <div className="text-center p-4 bg-black/20 border border-white/10 rounded-lg backdrop-blur-sm">
          <div className="text-sm text-white/60 mb-1">Estrategia</div>
          <div className="text-sm font-medium text-green-400">
            {cockpitIntelligence?.action?.primary || 'Mantener ritmo actual'}
          </div>
          <div className="text-xs text-white/40 mt-1">
            Confianza: {Math.round(confianza)}%
          </div>
        </div>
      </motion.div>

      {/* INFORMACIÓN DE ESTADO */}
      <motion.div
        className="text-center text-xs text-white/40 pt-4 border-t border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Algoritmo predictivo v4.0 · Última actualización: {lastRefresh?.toLocaleTimeString() || 'En tiempo real'}
      </motion.div>
    </motion.div>
  );
}