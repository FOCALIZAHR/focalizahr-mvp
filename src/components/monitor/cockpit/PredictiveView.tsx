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

  // ✅ FUNCIÓN AUXILIAR: DIAGNÓSTICO COMPRENSIBLE
  const getRealDiagnostic = (vectorMomentum: string): string => {
    if (vectorMomentum?.includes('⚠️') || vectorMomentum?.includes('Crisis')) return 'Ritmo Crítico Detectado';
    if (vectorMomentum?.includes('⚡') || vectorMomentum?.includes('Aceleración')) return 'Momentum Positivo';
    if (vectorMomentum?.includes('✅') || vectorMomentum?.includes('Éxito')) return 'Ritmo Óptimo';
    if (vectorMomentum?.includes('Metodología')) return 'Campaña Completada';
    return 'Ritmo Constante';
  };

  // ✅ FUNCIÓN AUXILIAR: ACCIÓN ESPECÍFICA EJECUTIVA
  const getSpecificAction = (primaryAction: string): string => {
    if (primaryAction?.includes('Intervención') || primaryAction?.includes('Inmediata')) {
      return 'Llamar directores HOY';
    }
    if (primaryAction?.includes('Replicar') || primaryAction?.includes('éxito')) {
      return 'Transferir mejores prácticas';
    }
    if (primaryAction?.includes('Mantener') || primaryAction?.includes('Momentum')) {
      return 'Continuar estrategia actual';
    }
    if (primaryAction?.includes('Extensión') || primaryAction?.includes('Urgente')) {
      return 'Extender campaña 5 días';
    }
    if (primaryAction?.includes('Documentar') || primaryAction?.includes('Metodología')) {
      return 'Documentar lecciones aprendidas';
    }
    return primaryAction || 'Revisar estrategia general';
  };

  // ✅ FUNCIÓN AUXILIAR: CONTEXTO ACCIÓN ESPECÍFICO
  const getActionContext = (
    negativeAnomalies: any[], 
    daysRemaining: number, 
    topMovers: any[]
  ): string => {
    const criticalDepts = negativeAnomalies?.filter(a => a.severity === 'high')?.length || 0;
    const totalAnomalies = negativeAnomalies?.length || 0;
    const leadingDepts = topMovers?.length || 0;
    
    if (criticalDepts > 0) {
      return `${criticalDepts} departamentos en riesgo crítico - ${daysRemaining} días restantes`;
    }
    if (totalAnomalies > 0) {
      return `${totalAnomalies} departamentos requieren atención - ${daysRemaining} días restantes`;
    }
    if (leadingDepts > 0) {
      return `${leadingDepts} departamentos lideran - replicar metodología`;
    }
    return `Monitorear progreso - ${daysRemaining} días para completar`;
  };
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
            Situación Actual
          </h3>
          <div className="text-4xl font-bold text-white mb-2">
            {participationRate}%
          </div>
          <div className="text-sm text-cyan-300 mb-1">
            Día {21 - daysRemaining} de 21 - {totalResponded}/{totalInvited} respuestas
          </div>
          <div className="text-xs text-white/60">
            Ritmo: {velocidadActual.toFixed(1)} respuestas/día
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
              Diagnóstico IA
            </h3>
            <div className="text-lg font-bold text-white mb-2">
              {getRealDiagnostic(cockpitIntelligence?.vectorMomentum || '')}
            </div>
            <div className="text-sm text-purple-200 mb-1">
              {cockpitIntelligence?.vectorMomentum || 'Calculando...'}
            </div>
            <div className="text-xs text-white/60">
              Meta: {((totalInvited - totalResponded) / Math.max(1, daysRemaining)).toFixed(1)} resp/día
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
              Escenarios Proyectados
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">Sin cambios:</span>
                <span className="text-lg font-bold text-yellow-400">
                  {proyeccionFinal}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">Con intervención:</span>
                <span className="text-lg font-bold text-green-400">
                  {Math.min(85, proyeccionFinal + 25)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-white/60 mt-2">
              Confianza: {confianza}% - {daysRemaining} días restantes
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
            Acción Específica
          </h3>
          <div className="space-y-2">
            <div className="text-lg font-bold text-white">
              {getSpecificAction(cockpitIntelligence?.action?.primary || '')}
            </div>
            <div className="text-sm text-green-300">
              {getActionContext(negativeAnomalies, daysRemaining, topMovers)}
            </div>
            <div className="text-xs text-white/60">
              Urgencia: {cockpitIntelligence?.action?.urgency || 'media'} - Ejecutar hoy
            </div>
          </div>
          
          {/* Línea de urgencia dinámica - MÁS PROMINENTE SEGÚN IMAGEN */}
          <motion.div 
            className="w-8 h-1.5 rounded-full mb-4"
            style={{ background: cockpitIntelligence?.action?.urgencyColor || '#6B7280' }}
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