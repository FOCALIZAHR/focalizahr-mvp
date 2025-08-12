// ====================================================================
// DYNAMIC VIEW - VISTA TIEMPO REAL CON MOMENTUM GAUGE
// src/components/monitor/cockpit/DynamicView.tsx
// RESPONSABILIDAD: Vista presente con gauge momentum integrado
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Eye, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

// 🎯 INTERFACE PROPS - DATOS PRE-CALCULADOS DESDE COCKPITHEADER
interface DynamicViewProps {
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

// Remove DynamicCard interface and component since we're implementing inline

// 🎯 COMPONENTE PRINCIPAL
export function DynamicView(props: DynamicViewProps) {
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

  // ✅ NO HOOKS - COMPONENTE 100% TONTO
  // deviceType debe venir desde useCampaignMonitor → CockpitHeader → viewProps
  
  // ✅ USAR SOLO DATOS PRE-CALCULADOS - NO RECALCULAR
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 ? negativeAnomalies[0] : null;
  
  // 🎯 DATOS PARA CARDS DESDE INTELLIGENCE O FALLBACK
  const patronDominante = cockpitIntelligence?.pattern?.dominantPattern || 
    (focoRiesgo ? 'Desaceleración crítica' : 'Estable');
  
  const descripcionPatron = cockpitIntelligence?.pattern?.description || 
    'Patrón organizacional detectado';

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* ⚡ VISTA DINÁMICA - TIEMPO REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6" style={{ minHeight: '280px' }}>
        
        {/* 🏆 CARD CAMPEÓN DEL MOMENTO */}
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
          onClick={() => onNavigate?.('topmovers')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-green-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Campeón del Momento
          </h3>
          <div className="text-2xl font-bold text-green-300 mb-2">
            {campeón?.name || 'IT Department'}
          </div>
          <div className="text-sm text-green-200 mb-1">
            {campeón?.momentum || 95}% participación
          </div>
          <div className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${
            campeón?.trend === 'completado' ? 'bg-green-500/20 text-green-300' :
            campeón?.trend === 'acelerando' ? 'bg-cyan-500/20 text-cyan-300' :
            campeón?.trend === 'desacelerando' ? 'bg-red-500/20 text-red-300' : 
            'bg-gray-500/20 text-gray-300'
          }`}>
            {campeón?.trend === 'completado' ? 'Completado' :
             campeón?.trend === 'acelerando' ? 'Acelerando' :
             campeón?.trend === 'desacelerando' ? 'Desacelerando' : 'Estable'}
          </div>
          <div className="text-xs text-white/60">
            Mejor performance organizacional
          </div>
        </motion.div>

        {/* ⚠️ CARD FOCO DE RIESGO */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('anomalies')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-red-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Foco de Riesgo
          </h3>
          <div className="text-2xl font-bold text-red-300 mb-2">
            {focoRiesgo?.department || 'Marketing'}
          </div>
          <div className="text-sm text-red-200 mb-1">
            {focoRiesgo?.rate || 45}% - Atención requerida
          </div>
          <div className={`inline-block px-2 py-1 text-xs rounded-full mb-3 ${
            focoRiesgo?.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {focoRiesgo?.severity === 'high' ? 'Crítico' : 'Moderado'}
          </div>
          <div className="text-xs text-white/60">
            Departamento requiere intervención
          </div>
        </motion.div>

        {/* 📊 CARD PARTICIPACIÓN ACTUAL CON GAUGE SIMPLE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(22, 78, 99, 0.6)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('live')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-400 mb-3"></div>
          <h3 className="text-sm text-cyan-400 mb-4 group-hover:text-cyan-300 transition-colors">
            Participación Actual
          </h3>
          <div className="text-4xl font-bold text-cyan-300 mb-2">
            {participationRate}%
          </div>
          <div className="text-sm text-cyan-200 mb-3">
            Tiempo real
          </div>
          
          {/* Gauge visual simple */}
          <div className="mt-4">
            <div className="w-20 h-20 mx-auto relative">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(34, 211, 238, 0.8)"
                  strokeWidth="8"
                  strokeDasharray={`${participationRate * 2.51} 251`}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* 🎯 CARD PATRÓN DOMINANTE */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('patterns')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-3 h-3 rounded-full bg-purple-400 mb-3"></div>
          <h3 className="text-sm text-white/80 mb-4 group-hover:text-white transition-colors">
            Patrón Dominante
          </h3>
          <div className="text-2xl font-bold text-purple-300 mb-2">
            {patronDominante}
          </div>
          <div className="text-sm text-purple-200 mb-3">
            Análisis comportamental
          </div>
          <div className="text-xs text-white/60 leading-relaxed">
            {descripcionPatron}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}