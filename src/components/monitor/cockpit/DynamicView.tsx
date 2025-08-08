// ====================================================================
// FOCALIZAHR DYNAMIC VIEW - COMPONENTE TONTO + DISEÑO PRESERVADO
// src/components/monitor/cockpit/DynamicView.tsx
// REFACTORIZADO: Solo UI + datos pre-calculados + diseño 100% igual
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, Target, TrendingUp, Zap, Users, Eye } from 'lucide-react';
import type { CockpitHeaderProps } from '@/components/monitor/CockpitHeader';
import type { CockpitIntelligence } from '@/lib/utils/cockpit-intelligence';
import '@/styles/focalizahr-design-system.css';

// 🎯 INTERFACE - DATOS + INTELIGENCIA PRE-CALCULADOS
export interface DynamicViewProps extends CockpitHeaderProps {
  intelligence: CockpitIntelligence;
  isTransitioning: boolean;
  onNavigate: (section: string) => void;
}

// 🎨 COMPONENTE TACTICAL CARD - DISEÑO PRESERVADO 100%
interface TacticalCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string;
  subtitle: string;
  description?: string;
  color: string;
  borderColor: string;
  glowColor: string;
  onClick?: () => void;
  badge?: {
    text: string;
    color: string;
  };
}

function TacticalCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  description,
  color, 
  borderColor, 
  glowColor,
  onClick,
  badge
}: TacticalCardProps) {
  return (
    <motion.div
      className={`
        relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 cursor-pointer
        bg-black/20 ${borderColor} hover:bg-black/30 hover:scale-105 hover:shadow-xl
      `}
      style={{
        boxShadow: `0 0 20px ${glowColor}`
      }}
      onClick={onClick}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: `0 0 40px ${glowColor}` 
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header con icono */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {badge && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.text}
          </div>
        )}
      </div>
      
      {/* Título */}
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      
      {/* Valor principal destacado */}
      <div className={`text-3xl font-bold mb-2 ${
        color.includes('cyan') ? 'text-cyan-300' : 
        color.includes('purple') ? 'text-purple-300' :
        color.includes('amber') ? 'text-amber-300' :
        color.includes('green') ? 'text-green-300' :
        color.includes('red') ? 'text-red-300' : 'text-white'
      }`}>
        {value}
      </div>
      
      {/* Subtitle */}
      <p className="text-white/80 font-medium mb-2">{subtitle}</p>
      
      {/* Description opcional */}
      {description && (
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      )}
      
      {/* Efecto de navegación hover */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="w-4 h-4 text-white/40" />
      </div>
    </motion.div>
  );
}

// 🎯 COMPONENTE PRINCIPAL - DISEÑO PRESERVADO + ARQUITECTURA CORRECTA
export function DynamicView({ 
  topMovers = [],
  negativeAnomalies = [],
  participationRate,
  intelligence,
  isTransitioning,
  onNavigate
}: DynamicViewProps) {

  // ✅ USAR SOLO DATOS YA CALCULADOS - NO RECALCULAR
  const { pattern, action } = intelligence;
  
  // 🎯 ANÁLISIS INTELIGENTE DE DATOS REALES - SOLO FORMATEO
  const campeón = topMovers.length > 0 ? topMovers[0] : null;
  const focoRiesgo = negativeAnomalies.length > 0 ? negativeAnomalies[0] : null;
  
  // Formatear momentum del campeón
  const campeónMomentum = campeón ? `${campeón.momentum} momentum` : 'Sin datos';
  const campeónTrend = campeón?.trend || 'estable';
  
  // Formatear foco de riesgo
  const riesgoInfo = focoRiesgo 
    ? `${focoRiesgo.department} (${focoRiesgo.rate}%)`
    : 'Sin anomalías críticas';
  
  // Determinar badge del campeón
  const campeónBadge = campeón ? {
    text: campeónTrend === 'completado' ? 'Completado' :
          campeónTrend === 'acelerando' ? 'Acelerando' :
          campeónTrend === 'desacelerando' ? 'Desacelerando' : 'Estable',
    color: campeónTrend === 'completado' ? 'bg-green-500/20 text-green-300' :
           campeónTrend === 'acelerando' ? 'bg-cyan-500/20 text-cyan-300' :
           campeónTrend === 'desacelerando' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
  } : undefined;
  
  // Determinar badge de riesgo
  const riesgoBadge = focoRiesgo ? {
    text: focoRiesgo.severity === 'high' ? 'Crítico' : 'Moderado',
    color: focoRiesgo.severity === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
  } : {
    text: 'Bajo Control',
    color: 'bg-green-500/20 text-green-300'
  };

  return (
    <div className="w-full">
      {/* 🎯 TÍTULO DINÁMICO CON INSIGHTS */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-white mb-2">Vista Táctica Organizacional</h2>
        <p className="text-white/70">Análisis en tiempo real para decisiones inmediatas</p>
      </motion.div>

      {/* 📊 GRID TÁCTICO - DISEÑO PRESERVADO 100% */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: CAMPEÓN MOMENTUM - DATOS YA CALCULADOS */}
        <TacticalCard
          icon={Trophy}
          title="Campeón Momentum"
          value={campeón?.name || 'Sin líder'}
          subtitle={campeónMomentum}
          description={campeón 
            ? `Departamento con mejor performance y tendencia ${campeónTrend}`
            : 'No hay datos suficientes para identificar líder departamental'
          }
          color="from-cyan-600 to-cyan-400"
          borderColor="border-cyan-500/30"
          glowColor="rgba(34, 211, 238, 0.3)"
          badge={campeónBadge}
          onClick={() => onNavigate('champion')}
        />

        {/* CARD 2: FOCO RIESGO - DATOS YA CALCULADOS */}
        <TacticalCard
          icon={AlertTriangle}
          title="Foco de Riesgo"
          value={riesgoInfo}
          subtitle={focoRiesgo 
            ? `Z-Score: ${focoRiesgo.zScore?.toFixed(1) || 'N/A'}`
            : 'Todos los departamentos dentro de parámetros normales'
          }
          description={focoRiesgo
            ? 'Departamento que requiere atención inmediata por baja participación'
            : 'No se detectaron departamentos con anomalías significativas'
          }
          color={focoRiesgo ? "from-red-600 to-red-400" : "from-green-600 to-green-400"}
          borderColor={focoRiesgo ? "border-red-500/30" : "border-green-500/30"}
          glowColor={focoRiesgo ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}
          badge={riesgoBadge}
          onClick={() => onNavigate('risk')}
        />

        {/* CARD 3: PATRÓN DOMINANTE - DATOS YA CALCULADOS */}
        <TacticalCard
          icon={TrendingUp}
          title="Patrón Dominante"
          value={pattern.dominantPattern}
          subtitle={pattern.description}
          description={pattern.insights[0] || 'Análisis de comportamiento organizacional'}
          color="from-purple-600 to-purple-400"
          borderColor="border-purple-500/30"
          glowColor="rgba(168, 85, 247, 0.3)"
          badge={{
            text: `${topMovers.length} Depts`,
            color: 'bg-purple-500/20 text-purple-300'
          }}
          onClick={() => onNavigate('pattern')}
        />

        {/* CARD 4: RECOMENDACIONES TÁCTICAS - DATOS YA CALCULADOS */}
        <TacticalCard
          icon={action.urgency === 'crítica' ? AlertTriangle : 
                action.urgency === 'alta' ? Zap :
                action.urgency === 'media' ? Target : Users}
          title="Recomendación Táctica"
          value={action.primary}
          subtitle={action.reasoning}
          description={action.nextSteps[0] || 'Estrategia definida basada en análisis actual'}
          color={action.urgency === 'crítica' ? "from-red-600 to-red-400" :
                 action.urgency === 'alta' ? "from-orange-600 to-orange-400" :
                 action.urgency === 'media' ? "from-amber-600 to-amber-400" : "from-green-600 to-green-400"}
          borderColor={action.urgency === 'crítica' ? "border-red-500/30" :
                       action.urgency === 'alta' ? "border-orange-500/30" :
                       action.urgency === 'media' ? "border-amber-500/30" : "border-green-500/30"}
          glowColor={action.urgency === 'crítica' ? "rgba(239, 68, 68, 0.3)" :
                     action.urgency === 'alta' ? "rgba(249, 115, 22, 0.3)" :
                     action.urgency === 'media' ? "rgba(251, 191, 36, 0.3)" : "rgba(34, 197, 94, 0.3)"}
          badge={{
            text: action.urgency.toUpperCase(),
            color: action.urgencyColor.replace('text-', 'bg-').replace('-400', '-500/20 ') + action.urgencyColor.replace('-400', '-300')
          }}
          onClick={() => onNavigate('action')}
        />
      </div>

      {/* 📊 PANEL DE INSIGHTS DETALLADOS - DISEÑO PRESERVADO */}
      {pattern.insights && pattern.insights.length > 1 && (
        <motion.div
          className="mt-8 p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400">
              <Eye className="w-5 h-5 text-white" />
            </div>
            Insights Organizacionales Avanzados
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pattern.insights.slice(0, 4).map((insight, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <span className="text-white/80 text-sm leading-relaxed">{insight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}