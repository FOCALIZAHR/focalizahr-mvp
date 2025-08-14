// ====================================================================
// PREDICTIVE VIEW - VISTA PREDICTIVA POST-TRASPLANTE ARQUITECTÓNICO
// src/components/monitor/cockpit/PredictiveView.tsx
// RESPONSABILIDAD: Vista futura 100% TONTA - Solo presentación, NO cálculos
// ✅ ARQUITECTURA CORREGIDA: Usa exclusivamente datos pre-calculados
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, ArrowRight } from 'lucide-react';

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
export function PredictiveView(props: PredictiveViewProps) {
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

  // 🎯 DATOS PARA CARDS - SOLO DESDE INTELLIGENCE PRE-CALCULADA
  const vectorMomentum = cockpitIntelligence?.vectorMomentum || 'Sin datos';
  const estadoMomentum = cockpitIntelligence?.pattern?.dominantPattern || 'Analizando...';
  
  const accionPrincipal = cockpitIntelligence?.action?.primary || 
    (recommendations.length > 0 ? recommendations[0] : 'Sin recomendación disponible');
  
  const razonamiento = cockpitIntelligence?.action?.reasoning || 
    'Esperando análisis de inteligencia artificial';
  
  const colorUrgencia = cockpitIntelligence?.action?.urgencyColor || '#6B7280';
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* 🔮 VISTA PREDICTIVA - ESTRUCTURA EXACTA GUÍA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8" style={{ minHeight: '280px' }}>
        
        {/* 🎯 CARD 1: PUNTO DE PARTIDA - ESTRUCTURA GUÍA */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('current')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-400 mb-3"></div>
          <h3 className="text-sm text-cyan-400 mb-4 group-hover:text-cyan-300 transition-colors">
            Punto de Partida
          </h3>
          <div className="text-4xl font-bold text-white mb-2">
            {participationRate}%
          </div>
          <div className="text-sm text-cyan-300 mb-1">
            {totalResponded}/{totalInvited} respuestas
          </div>
          <div className="text-xs text-white/60">
            Velocidad: {velocidadActual.toFixed(1)}/día
          </div>
        </motion.div>

        {/* 🎯 CARD 2: VECTOR MOMENTUM CON GRADIENTE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('momentum')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Gradiente de fondo animado */}
          <motion.div
            className="absolute inset-0 opacity-20 rounded-lg"
            animate={{
              background: [
                'linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)',
                'linear-gradient(45deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                'linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-purple-400 mb-3"></div>
            <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
              Vector Momentum
            </h3>
            <div className="text-4xl font-bold text-purple-300 mb-2">
              {vectorMomentum}
            </div>
            <div className="text-sm text-purple-200 mb-1">
              {estadoMomentum}
            </div>
            <div className="text-xs text-white/60">
              {topMovers.length} dept. activos
            </div>
          </div>
        </motion.div>

        {/* 🎯 CARD 3: PROYECCIÓN FINAL - COLOR EXACTO GUÍA */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300 relative"
          style={{
            background: 'rgba(22, 78, 99, 0.8)',
            border: '1px solid rgba(34, 211, 238, 0.4)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(34, 211, 238, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('analytics')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Neural pulse effect - DOCUMENTADO GUÍA */}
          <motion.div
            className="absolute inset-0 rounded-lg border border-cyan-400/30"
            animate={{
              boxShadow: [
                '0 0 20px rgba(34, 211, 238, 0.3)',
                '0 0 30px rgba(34, 211, 238, 0.5)',
                '0 0 20px rgba(34, 211, 238, 0.3)'
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-cyan-400 mb-3"></div>
            <h3 className="text-sm text-cyan-400 mb-4 group-hover:text-cyan-300 transition-colors">
              Proyección Final
            </h3>
            <div className="text-4xl font-bold text-cyan-300 mb-2">
              {proyeccionFinal}%
            </div>
            <div className="text-sm text-cyan-400/80 mb-1">
              Confianza IA: {confianza}%
            </div>
            <div className="text-xs text-white/60">
              {daysRemaining} días restantes
            </div>
          </div>
        </motion.div>

        {/* 🎯 CARD 4: ACCIÓN RECOMENDADA - LÍNEA ROJA PROMINENTE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('actions')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-green-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Acción Recomendada
          </h3>
          <div className="text-lg font-semibold text-green-400 mb-3">
            {accionPrincipal}
          </div>
          <div className="text-xs text-white/70 mb-3">
            {razonamiento}
          </div>
          
          {/* Línea de urgencia dinámica - MÁS PROMINENTE SEGÚN IMAGEN */}
          <motion.div 
            className="w-8 h-1.5 rounded-full mb-4"
            style={{ background: colorUrgencia }}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 32 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          />

          {/* Botón de acción */}
          <motion.button
            className="w-full px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm text-green-400 transition-all duration-200 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Ejecutar</span>
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}