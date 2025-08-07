// ====================================================================
// FOCALIZAHR PREDICTIVE VIEW - VISTA ESTRATÉGICA AWS-STYLE
// src/components/monitor/cockpit/PredictiveView.tsx
// Chat 2: Vista predictiva completa con datos reales + animaciones premium
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { CountUpAnimation } from './CountUpAnimation';

// 🎯 INTERFACE DATOS REALES - Desde useCampaignMonitor
export interface PredictiveViewProps {
  // Datos principales para vista predictiva
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  lastActivity: string;
  
  // Datos inteligencia (opcionales para Chat 1)
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  insights?: string[];
  recommendations?: string[];
  participationPrediction?: any;
  
  // Estados UI
  isLoading?: boolean;
  isTransitioning?: boolean;
  lastRefresh: Date;
}

export function PredictiveView(props: PredictiveViewProps) {
  const {
    participationRate,
    daysRemaining,
    totalInvited,
    totalResponded,
    lastActivity,
    topMovers = [],
    insights = [],
    recommendations = [],
    participationPrediction,
    isTransitioning = false
  } = props;

  // 🧮 CÁLCULOS INTELIGENTES PARA VISTA PREDICTIVA
  const velocidadActual = totalResponded / (Math.max(1, 14 - daysRemaining)); // respuestas por día
  const momentumPromedio = topMovers.length > 0 
    ? Math.round(topMovers.reduce((acc, m) => acc + m.momentum, 0) / topMovers.length)
    : 0;
  
  // 📊 PROYECCIÓN MATEMÁTICA (usando datos reales o cálculo simple)
  const proyeccionFinal = participationPrediction?.finalProjection || 
    Math.min(95, Math.round(participationRate + (velocidadActual * daysRemaining * 2.1)));
  const confianza = participationPrediction?.confidence || 
    Math.max(65, Math.min(90, 85 - Math.abs(participationRate - 70)));

  // 🎯 ESTADO MOMENTUM GENERAL
  const estadoMomentum = momentumPromedio > 200 ? 'Acelerando' :
                        momentumPromedio > 100 ? 'Estable' : 'Desacelerando';
  
  // 🚦 RECOMENDACIÓN INTELIGENTE
  const recomendacionPrincipal = recommendations.length > 0 
    ? recommendations[0] 
    : proyeccionFinal >= 75 
      ? 'Mantener estrategia actual'
      : 'Intensificar comunicación';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        delay: isTransitioning ? 0.1 : 0 
      }}
      className="w-full"
    >
      {/* 🔮 VISTA PREDICTIVA - "¿LLEGAREMOS A LA META?" */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* MÓDULO 1: PUNTO DE PARTIDA */}
        <motion.div 
          className="fhr-card-metric bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              <h3 className="text-sm font-medium text-white/60">
                Punto de Partida
              </h3>
            </div>
            
            <CountUpAnimation
              value={participationRate}
              duration={1.2}
              className="text-3xl font-bold text-white"
              suffix="%"
              delay={0.3}
            />
            
            <div className="text-sm text-cyan-400 mb-1">
              {totalResponded}/{totalInvited} respuestas
            </div>
            
            <div className="text-xs text-white/50">
              Velocidad: {velocidadActual.toFixed(1)}/día
            </div>
          </div>
        </motion.div>

        {/* MÓDULO 2: VECTOR DE MOMENTUM */}
        <motion.div 
          className="fhr-card-metric bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg p-6 relative overflow-hidden hover:border-purple-500/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2 }}
        >
          {/* Gradiente animado de fondo */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10"
            animate={{
              background: [
                "linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)",
                "linear-gradient(90deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                "linear-gradient(90deg, rgba(168, 85, 247, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          <div className="relative text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full mr-2"></div>
              <h3 className="text-sm font-medium text-white/60">
                Vector Momentum
              </h3>
            </div>
            
            <CountUpAnimation
              value={momentumPromedio}
              duration={1.5}
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
              suffix=""
              delay={0.4}
            />
            
            <div className="text-sm text-cyan-400 mb-1">
              {estadoMomentum}
            </div>
            
            <div className="text-xs text-white/50">
              {topMovers.length} dept. activos
            </div>
          </div>
        </motion.div>

        {/* MÓDULO 3: NÚCLEO PREDICTIVO (HERO) */}
        <motion.div 
          className="fhr-card-metric bg-cyan-500/20 border-2 border-cyan-500/40 rounded-lg p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          {/* Neural glow effect mejorado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5"
            animate={{ 
              boxShadow: [
                "inset 0 0 20px rgba(34, 211, 238, 0.2), 0 0 30px rgba(34, 211, 238, 0.1)",
                "inset 0 0 30px rgba(34, 211, 238, 0.3), 0 0 40px rgba(34, 211, 238, 0.2)",
                "inset 0 0 20px rgba(34, 211, 238, 0.2), 0 0 30px rgba(34, 211, 238, 0.1)"
              ]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          
          {/* Partículas animadas */}
          <motion.div
            className="absolute top-2 right-2 w-1 h-1 bg-cyan-400 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="absolute bottom-3 left-3 w-1 h-1 bg-cyan-300 rounded-full"
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
          />
          
          <div className="relative text-center">
            <div className="flex items-center justify-center mb-3">
              <motion.div 
                className="w-3 h-3 bg-cyan-400 rounded-full mr-2"
                animate={{ 
                  boxShadow: [
                    "0 0 5px rgba(34, 211, 238, 0.5)",
                    "0 0 15px rgba(34, 211, 238, 0.8)",
                    "0 0 5px rgba(34, 211, 238, 0.5)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <h3 className="text-sm font-medium text-cyan-400">
                Proyección Final
              </h3>
            </div>
            
            <CountUpAnimation
              value={proyeccionFinal}
              duration={2}
              className="text-4xl font-bold text-cyan-400"
              suffix="%"
              delay={0.6}
            />
            
            <div className="text-sm text-cyan-300 mb-1">
              Confianza IA: {confianza}%
            </div>
            
            <motion.div 
              className="w-full bg-cyan-900/30 rounded-full h-1.5 mb-2"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.div
                className="bg-gradient-to-r from-cyan-400 to-cyan-300 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${confianza}%` }}
                transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
              />
            </motion.div>
            
            <div className="text-xs text-white/50">
              {daysRemaining} días restantes
            </div>
          </div>
        </motion.div>

        {/* MÓDULO 4: PANEL DE ACCIÓN INTELIGENTE */}
        <motion.div 
          className="fhr-card-metric bg-green-500/10 border border-green-500/30 rounded-lg p-6 hover:border-green-500/50 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <h3 className="text-sm font-medium text-white/60">
                Acción Recomendada
              </h3>
            </div>
            
            <motion.div 
              className="text-lg font-semibold text-green-400 mb-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {proyeccionFinal >= 75 ? 'Mantener Momentum' : 'Acelerar Acción'}
            </motion.div>
            
            <div className="text-xs text-white/70 leading-relaxed">
              {recomendacionPrincipal.length > 40 
                ? recomendacionPrincipal.substring(0, 40) + '...'
                : recomendacionPrincipal
              }
            </div>
            
            {/* Indicador de urgencia */}
            <motion.div 
              className="mt-3 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className={`w-6 h-1 rounded-full ${
                proyeccionFinal >= 80 ? 'bg-green-400' :
                proyeccionFinal >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* 📊 INSIGHTS CONTEXTUAL AMPLIADO */}
      <motion.div 
        className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-cyan-400 font-medium">Análisis Temporal</div>
            <div className="text-xs text-white/60 mt-1">
              Velocidad actual: {velocidadActual.toFixed(1)} resp/día
            </div>
          </div>
          <div>
            <div className="text-sm text-purple-400 font-medium">Momentum Org.</div>
            <div className="text-xs text-white/60 mt-1">
              Promedio: +{momentumPromedio} ({estadoMomentum})
            </div>
          </div>
          <div>
            <div className="text-sm text-green-400 font-medium">Siguiente Acción</div>
            <div className="text-xs text-white/60 mt-1">
              {proyeccionFinal >= 75 ? 'Monitoreo continuo' : 'Intervención requerida'}
            </div>
          </div>
        </div>
        
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-white/40">
            Última actualización: {new Date(props.lastRefresh).toLocaleTimeString('es-CL')} • 
            Algoritmo predictivo v4.0
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}