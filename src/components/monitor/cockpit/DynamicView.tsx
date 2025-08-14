
// ====================================================================
// DYNAMIC VIEW - VISTA TIEMPO REAL CON MOMENTUM GAUGE ESPECTACULAR
// src/components/monitor/cockpit/DynamicView.tsx
// RESPONSABILIDAD: Vista presente con visuales impecables + Card 3 y 4 nuevas
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Eye, AlertTriangle, TrendingUp, Activity, Target } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

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
  
  // Cockpit Intelligence PRE-CALCULADA (NUEVA ESTRUCTURA)
  intelligence?: {
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
    // ✅ NUEVOS DATOS PARA CARD 3 Y 4
    departmentMomentum: {
      departments: Array<{
        name: string;
        rate: number;
        trend: string;
        velocity: number;
        status: 'positive' | 'warning' | 'critical';
      }>;
      summary: {
        accelerating: number;
        stable: number;
        critical: number;
        total: number;
      };
      insights: string[];
      sparklineData: Array<{ name: string; value: number; velocity: number }>;
    };
    tacticalAction: {
      primary: string;
      reasoning: string;
      urgency: 'baja' | 'media' | 'alta' | 'crítica';
      action: 'tactical';
      urgencyColor: string;
    };
  };
  
  // Handlers
  onNavigate?: (sectionId: string) => void;
  
  // Estados
  isLoading: boolean;
  lastRefresh: Date;
}

// 🚀 COMPONENTE VISUAL ESPECTACULAR - MOMENTUM SPARKLINES
function MomentumSparklines({ data }: { 
  data: {
    sparklineData: Array<{ name: string; value: number; velocity: number }>;
    departments: Array<{ name: string; velocity: number; status: string }>;
  }
}) {
  return (
    <div className="w-full h-16 relative">
      {/* Sparkline principal con gradiente espectacular */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.sparklineData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id="momentumGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="momentumGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="url(#momentumGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: '#22D3EE',
              stroke: '#FFFFFF',
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.6))'
            }}
          />
          {/* Área de glow para efecto premium */}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="url(#momentumGlow)"
            strokeWidth={8}
            dot={false}
            opacity={0.3}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Indicadores de velocidad con animación */}
      <div className="absolute top-0 right-0 flex gap-1">
        {data.departments.slice(0, 3).map((dept, i) => (
          <motion.div
            key={dept.name}
            className={`w-2 h-2 rounded-full ${
              dept.velocity > 0 ? 'bg-green-400' :
              dept.velocity < -0.5 ? 'bg-red-400' : 'bg-amber-400'
            }`}
            title={`${dept.name}: ${dept.velocity > 0 ? '+' : ''}${dept.velocity.toFixed(1)}/día`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
    intelligence, // ✅ CAMBIADO DE cockpitIntelligence
    onNavigate,
    isLoading,
    lastRefresh
  } = props;

  // ✅ NO HOOKS - COMPONENTE 100% TONTO
  // deviceType debe venir desde useCampaignMonitor → CockpitHeader → viewProps
  
  // ✅ USAR SOLO DATOS PRE-CALCULADOS - NO RECALCULAR
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 ? negativeAnomalies[0] : null;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* ⚡ VISTA DINÁMICA - 4 CARDS HORIZONTALES TESLA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '280px' }}>
        
        {/* 🏆 CARD 1: CAMPEÓN DEL MOMENTO (PRESERVADO) */}
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

        {/* ⚠️ CARD 2: FOCO DE RIESGO (PRESERVADO) */}
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

        {/* 🚀 CARD 3: MOMENTUM DEPARTAMENTAL ESPECTACULAR (NUEVA) */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 20px rgba(251, 191, 36, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('department-momentum')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Neural glow effect */}
          <motion.div 
            className="absolute inset-0 rounded-xl opacity-20"
            animate={{ 
              background: [
                "linear-gradient(45deg, rgba(251, 191, 36, 0.1), rgba(168, 85, 247, 0.1))",
                "linear-gradient(225deg, rgba(168, 85, 247, 0.1), rgba(34, 211, 238, 0.1))",
                "linear-gradient(45deg, rgba(251, 191, 36, 0.1), rgba(168, 85, 247, 0.1))"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Header con icono y título */}
          <div className="relative flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-amber-400 bg-opacity-20">
              <Activity className="w-5 h-5 text-amber-300" />
            </div>
            <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
              Momentum Departamental
            </h3>
          </div>

          {/* Valor principal con contexto */}
          <div className="relative mb-3">
            <div className="text-xl font-bold text-amber-300 mb-1">
              {intelligence?.departmentMomentum?.summary.accelerating || 3} acelerando
            </div>
            <p className="text-white/70 text-sm">
              {intelligence?.departmentMomentum?.summary.critical || 1} críticos, {intelligence?.departmentMomentum?.summary.stable || 2} estables
            </p>
          </div>

          {/* Visualización espectacular con Recharts */}
          <div className="relative">
            {intelligence?.departmentMomentum ? (
              <MomentumSparklines data={intelligence.departmentMomentum} />
            ) : (
              // Fallback visual si no hay datos
              <div className="w-full h-16 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* Insight principal */}
          <div className="relative mt-2 text-xs text-amber-200">
            {intelligence?.departmentMomentum?.insights?.[0] || "IT completará 100% en 2 días"}
          </div>
        </motion.div>

        {/* 🎯 CARD 4: RECOMENDACIÓN TÁCTICA ESPECTACULAR (NUEVA) */}
        <motion.div
          className="fhr-card cursor-pointer group hover:scale-[1.02] hover:translate-y-[-2px] transition-all duration-300"
          style={{
            background: intelligence?.tacticalAction?.urgency === 'crítica' ? 'rgba(239, 68, 68, 0.1)' :
                       intelligence?.tacticalAction?.urgency === 'alta' ? 'rgba(168, 85, 247, 0.1)' :
                       'rgba(34, 197, 94, 0.1)',
            border: intelligence?.tacticalAction?.urgency === 'crítica' ? '1px solid rgba(239, 68, 68, 0.3)' :
                   intelligence?.tacticalAction?.urgency === 'alta' ? '1px solid rgba(168, 85, 247, 0.3)' :
                   '1px solid rgba(34, 197, 94, 0.3)',
            backdropFilter: 'blur(20px)',
            boxShadow: intelligence?.tacticalAction?.urgency === 'crítica' ? '0 4px 20px rgba(239, 68, 68, 0.15)' :
                      intelligence?.tacticalAction?.urgency === 'alta' ? '0 4px 20px rgba(168, 85, 247, 0.15)' :
                      '0 4px 20px rgba(34, 197, 94, 0.15)',
            borderRadius: '12px',
            padding: '24px'
          }}
          onClick={() => onNavigate?.('tactical-actions')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Efecto de urgencia pulsante */}
          {intelligence?.tacticalAction?.urgency === 'crítica' && (
            <motion.div 
              className="absolute inset-0 rounded-xl border border-red-400/50"
              animate={{ 
                boxShadow: [
                  '0 0 10px rgba(239, 68, 68, 0.3)',
                  '0 0 20px rgba(239, 68, 68, 0.6)',
                  '0 0 10px rgba(239, 68, 68, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Header con icono dinámico */}
          <div className="relative flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              intelligence?.tacticalAction?.urgency === 'crítica' ? 'bg-gradient-to-br from-red-600 to-red-400' :
              intelligence?.tacticalAction?.urgency === 'alta' ? 'bg-gradient-to-br from-purple-600 to-purple-400' :
              'bg-gradient-to-br from-green-600 to-green-400'
            } bg-opacity-20`}>
              <Target className={`w-5 h-5 ${
                intelligence?.tacticalAction?.urgency === 'crítica' ? 'text-red-300' :
                intelligence?.tacticalAction?.urgency === 'alta' ? 'text-purple-300' :
                'text-green-300'
              }`} />
            </div>
            <h3 className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
              Recomendación Táctica
            </h3>
          </div>

          {/* Valor principal */}
          <div className="relative mb-3">
            <div className={`text-lg font-bold mb-1 ${
              intelligence?.tacticalAction?.urgency === 'crítica' ? 'text-red-300' :
              intelligence?.tacticalAction?.urgency === 'alta' ? 'text-purple-300' :
              'text-green-300'
            }`}>
              {intelligence?.tacticalAction?.primary || "Replicar éxito de IT en Marketing"}
            </div>
            <p className="text-white/70 text-sm">
              {intelligence?.tacticalAction?.reasoning || "IT tiene momentum superior vs Marketing"}
            </p>
          </div>

          {/* Badge de urgencia */}
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
            intelligence?.tacticalAction?.urgency === 'crítica' ? 'bg-red-500/20 text-red-300' :
            intelligence?.tacticalAction?.urgency === 'alta' ? 'bg-purple-500/20 text-purple-300' :
            intelligence?.tacticalAction?.urgency === 'media' ? 'bg-amber-500/20 text-amber-300' :
            'bg-green-500/20 text-green-300'
          }`}>
            {intelligence?.tacticalAction?.urgency === 'crítica' ? 'CRÍTICA' :
             intelligence?.tacticalAction?.urgency === 'alta' ? 'ALTA' :
             intelligence?.tacticalAction?.urgency === 'media' ? 'MEDIA' : 'BAJA'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}