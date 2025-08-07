// ====================================================================
// FOCALIZAHR DYNAMIC VIEW - VISTA TÁCTICA GLASS COCKPIT
// src/components/monitor/cockpit/DynamicView.tsx
// Chat 3: Vista dinámica completa con navegación click-to-scroll - CORREGIDA
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, Target, TrendingUp, Zap } from 'lucide-react';
import { useScrollToSection } from '@/lib/utils/scrollToSection';

// 🎯 INTERFACE DATOS REALES - Desde useCampaignMonitor
export interface DynamicViewProps {
  // Datos inteligencia departamental
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies?: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>;
  
  // Análisis patrones automáticos
  insights?: string[];
  recommendations?: string[];
  
  // Estados UI
  isLoading?: boolean;
  isTransitioning?: boolean;
  lastRefresh: Date;
}

export function DynamicView(props: DynamicViewProps) {
  const {
    topMovers = [],
    negativeAnomalies = [],
    insights = [],
    recommendations = [],
    isTransitioning = false
  } = props;

  // 🧭 NAVEGACIÓN INTELIGENTE
  const { navigateToSection } = useScrollToSection();

  // 🎯 ANÁLISIS INTELIGENTE DE DATOS REALES
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 
    ? negativeAnomalies.sort((a, b) => b.zScore - a.zScore)[0]
    : null;
  
  // 📊 ANÁLISIS DE PATRONES ORGANIZACIONALES
  const patrones = {
    completado: topMovers.filter(m => m.trend === 'completado').length,
    acelerando: topMovers.filter(m => m.trend === 'acelerando').length,
    estable: topMovers.filter(m => m.trend === 'estable').length,
    desacelerando: topMovers.filter(m => m.trend === 'desacelerando').length
  };
  
  const totalDepts = Object.values(patrones).reduce((sum, count) => sum + count, 0);
  const dominante = Object.entries(patrones)
    .filter(([_, count]) => count > 0)
    .sort(([,a], [,b]) => b - a)[0];

  // 🎨 FUNCIONES HELPER PARA ESTILOS
  const getTrendIcon = (trend: string) => {
    const iconMap = {
      completado: '✅',
      acelerando: '🚀', 
      estable: '📊',
      desacelerando: '⚠️'
    };
    return iconMap[trend] || '📊';
  };

  const getSeverityColor = (severity: string, zScore: number) => {
    if (severity === 'high' || Math.abs(zScore) > 2) {
      return {
        border: 'border-red-500/50',
        bg: 'bg-red-500/15',
        text: 'text-red-400'
      };
    }
    return {
      border: 'border-orange-500/40',
      bg: 'bg-orange-500/10', 
      text: 'text-orange-400'
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut",
        delay: isTransitioning ? 0.1 : 0 
      }}
      className="w-full"
    >
      {/* 🚁 VISTA DINÁMICA - "¿DÓNDE ESTÁ LA ACCIÓN AHORA?" */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.15, delayChildren: 0.1 }}
      >
        
        {/* PANEL 1: CAMPEÓN DEL MOMENTUM */}
        <motion.div 
          className="fhr-card-metric bg-green-500/10 border-2 border-green-500/40 rounded-lg p-6 cursor-pointer group"
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateToSection('champion-momentum')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500/25 border border-green-400/30">
              <Trophy className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-400">
                Campeón del Momentum
              </h3>
              <p className="text-xs text-white/60">
                Líder departamental actual
              </p>
            </div>
          </div>

          {campeón ? (
            <div className="space-y-3">
              <div className="text-xl font-bold text-white">
                {getTrendIcon(campeón.trend)} {campeón.name}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    +{campeón.momentum}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <span className="text-sm text-white/80 capitalize">
                  {campeón.trend}
                </span>
              </div>
              <div className="bg-green-500/20 rounded-lg p-2 border border-green-500/30">
                <div className="text-xs text-green-300 font-medium">
                  🎯 Estrategia: Mantener y replicar
                </div>
              </div>
            </div>
          ) : (
            <div className="text-lg text-white/60">
              Analizando departamentos...
            </div>
          )}
        </motion.div>

        {/* PANEL 2: FOCO DE RIESGO */}
        <motion.div 
          className={`fhr-card-metric cursor-pointer group ${
            focoRiesgo ? getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).bg : 'bg-gray-500/10'
          } border-2 ${
            focoRiesgo ? getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).border : 'border-gray-500/30'
          } rounded-lg p-6 relative`}
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateToSection('risk-focus')}
        >
          {/* Borde pulsante para alertas críticas */}
          {focoRiesgo && focoRiesgo.severity === 'high' && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-red-500/60"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${
              focoRiesgo ? 'bg-red-500/25 border border-red-400/30' : 'bg-gray-500/20 border border-gray-400/30'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                focoRiesgo ? getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).text : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${
                focoRiesgo ? getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).text : 'text-gray-400'
              }`}>
                Foco de Riesgo
              </h3>
              <p className="text-xs text-white/60">
                {focoRiesgo ? 'Requiere atención inmediata' : 'Sin alertas críticas'}
              </p>
            </div>
          </div>

          {focoRiesgo ? (
            <div className="space-y-3">
              <div className="text-xl font-bold text-white">
                ⚠️ {focoRiesgo.department}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).text}`} />
                  <span className={`text-sm font-semibold ${getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).text}`}>
                    {focoRiesgo.rate}% participación
                  </span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <span className="text-sm text-white/80">
                  Z-Score: {focoRiesgo.zScore.toFixed(1)}
                </span>
              </div>
              <div className={`${getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).bg} rounded-lg p-2 border ${getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).border}`}>
                <div className={`text-xs font-medium ${getSeverityColor(focoRiesgo.severity, focoRiesgo.zScore).text}`}>
                  🚨 Acción: {focoRiesgo.severity === 'high' ? 'Intervención inmediata' : 'Seguimiento reforzado'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-lg text-green-400">✅ Todo bajo control</div>
              <div className="text-sm text-white/60">No hay departamentos en riesgo crítico</div>
            </div>
          )}
        </motion.div>

        {/* PANEL 3: PATRÓN DOMINANTE */}
        <motion.div 
          className="fhr-card-metric bg-blue-500/10 border-2 border-blue-500/40 rounded-lg p-6 cursor-pointer group"
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 }
          }}
          whileHover={{ scale: 1.03, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigateToSection('pattern-analysis')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500/25 border border-blue-400/30">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-400">
                Patrón Dominante
              </h3>
              <p className="text-xs text-white/60">
                Tendencia organizacional
              </p>
            </div>
          </div>

          {dominante && totalDepts > 0 ? (
            <div className="space-y-3">
              <div className="text-xl font-bold text-white capitalize flex items-center gap-2">
                {getTrendIcon(dominante[0])} {dominante[0]}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-semibold text-blue-400">
                    {dominante[1]} de {totalDepts} departamentos
                  </span>
                </div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-2 border border-blue-500/30">
                <div className="text-xs text-blue-300 font-medium">
                  {insights.length > 0 
                    ? `💡 ${insights[0]?.substring(0, 50)}...`
                    : '🔍 Analizando patrones organizacionales...'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-lg text-white/60">
              Calculando patrones...
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* 📊 PANEL DE RECOMENDACIONES TÁCTICAS */}
      <motion.div 
        className="mt-8 p-6 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendaciones Tácticas
            </h4>
            <div className="space-y-2">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-sm text-white/80 flex items-start gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    {rec}
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/60">
                  Generando recomendaciones basadas en análisis departamental...
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Próximas Acciones
            </h4>
            <div className="space-y-2">
              <div className="text-sm text-white/80 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                {campeón ? `Mantener estrategia exitosa en ${campeón.name}` : 'Identificar departamento líder'}
              </div>
              <div className="text-sm text-white/80 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                {focoRiesgo ? `Intervenir en ${focoRiesgo.department} (${focoRiesgo.severity} prioridad)` : 'Monitoreo preventivo continuo'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            Análisis táctico actualizado: {new Date(props.lastRefresh).toLocaleTimeString('es-CL')} • 
            Vista dinámica v4.0 • {totalDepts} departamentos monitoreados
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}