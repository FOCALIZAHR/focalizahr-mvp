// ====================================================================
// FOCALIZAHR PREDICTIVE VIEW - COMPONENTE TONTO + DISEÑO PRESERVADO
// src/components/monitor/cockpit/PredictiveView.tsx
// REFACTORIZADO: Solo UI + datos pre-calculados + diseño 100% igual
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Target, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { PredictiveGauge } from './PredictiveGauge';
import type { CockpitHeaderProps } from '@/components/monitor/CockpitHeader';
import type { CockpitIntelligence } from '@/lib/utils/cockpit-intelligence';
import '@/styles/focalizahr-design-system.css';

// 🎯 INTERFACE - DATOS + INTELIGENCIA PRE-CALCULADOS
export interface PredictiveViewProps extends CockpitHeaderProps {
  intelligence: CockpitIntelligence;
  isTransitioning: boolean;
  onNavigate: (section: string) => void;
}

// 🎨 COMPONENTE CARD - DISEÑO PRESERVADO 100%
interface PredictiveCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  borderColor: string;
  glowColor: string;
  onClick?: () => void;
  confidence?: number;
  urgency?: string;
}

function PredictiveCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color, 
  borderColor, 
  glowColor,
  onClick,
  confidence,
  urgency
}: PredictiveCardProps) {
  return (
    <motion.div
      className={`
        relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 cursor-pointer
        bg-black/20 ${borderColor} hover:bg-black/30 hover:scale-105 hover:shadow-lg
      `}
      style={{
        boxShadow: `0 0 20px ${glowColor}`
      }}
      onClick={onClick}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: `0 0 30px ${glowColor}` 
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Icono con efecto glow */}
      <div className={`flex items-center gap-3 mb-3`}>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      
      {/* Valor principal */}
      <div className={`text-2xl font-bold ${color.includes('cyan') ? 'text-cyan-300' : 
                       color.includes('purple') ? 'text-purple-300' :
                       color.includes('amber') ? 'text-amber-300' : 'text-green-300'} mb-1`}>
        {value}
      </div>
      
      {/* Subtitle con contexto */}
      <p className="text-white/70 text-sm">{subtitle}</p>
      
      {/* Indicador de confianza si aplica */}
      {confidence && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-full h-1.5">
            <div 
              className={`h-full rounded-full ${
                confidence >= 85 ? 'bg-green-400' :
                confidence >= 70 ? 'bg-cyan-400' :
                confidence >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs text-white/60">{confidence}%</span>
        </div>
      )}
      
      {/* Indicador de urgencia si aplica */}
      {urgency && (
        <div className={`mt-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          urgency === 'crítica' ? 'bg-red-500/20 text-red-300' :
          urgency === 'alta' ? 'bg-orange-500/20 text-orange-300' :
          urgency === 'media' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
        }`}>
          {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
        </div>
      )}
    </motion.div>
  );
}

// 🎯 COMPONENTE PRINCIPAL - DISEÑO PRESERVADO + ARQUITECTURA CORRECTA
export function PredictiveView({ 
  participationRate,
  daysRemaining,
  intelligence,
  isTransitioning,
  onNavigate
}: PredictiveViewProps) {

  // ✅ USAR SOLO DATOS YA CALCULADOS - NO RECALCULAR
  const { vectorMomentum, projection, action } = intelligence;
  
  // 🎨 PREPARAR DATOS PARA UI - SOLO FORMATEO
  const gaugeValue = participationRate;
  const gaugeConfidence = projection.confidence;
  
  // Determinar color del gauge basado en participación
  const gaugeColor = participationRate >= 90 ? 'success' :
                    participationRate >= 70 ? 'warning' :
                    participationRate >= 50 ? 'info' : 'danger';

  return (
    <div className="w-full">
      {/* 🔮 JOYA CORONA - VELOCÍMETRO TESLA STYLE */}
      <div className="flex justify-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <PredictiveGauge 
            value={gaugeValue}
            confidence={gaugeConfidence}
            size={200}
            color={gaugeColor}
            label="Participación Actual"
            showConfidence={true}
            animated={!isTransitioning}
          />
        </motion.div>
      </div>

      {/* 📊 GRID DE CARDS INTELIGENTES - DISEÑO PRESERVADO 100% */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: PUNTO DE PARTIDA */}
        <PredictiveCard
          icon={MapPin}
          title="Punto de Partida"
          value={`${participationRate}%`}
          subtitle={`${daysRemaining} días restantes`}
          color="from-cyan-600 to-cyan-400"
          borderColor="border-cyan-500/30"
          glowColor="rgba(34, 211, 238, 0.2)"
          onClick={() => onNavigate('momentum')}
        />

        {/* CARD 2: VECTOR MOMENTUM - DATOS YA CALCULADOS */}
        <PredictiveCard
          icon={TrendingUp}
          title="Vector Momentum"
          value={vectorMomentum}
          subtitle={projection.methodology}
          color="from-purple-600 to-purple-400"
          borderColor="border-purple-500/30"
          glowColor="rgba(168, 85, 247, 0.2)"
          onClick={() => onNavigate('projection')}
        />

        {/* CARD 3: PROYECCIÓN FINAL - DATOS YA CALCULADOS */}
        <PredictiveCard
          icon={Target}
          title="Proyección Final"
          value={`${projection.finalProjection}%`}
          subtitle={`Confianza: ${projection.confidenceText}`}
          color="from-amber-600 to-amber-400"
          borderColor="border-amber-500/30"
          glowColor="rgba(251, 191, 36, 0.2)"
          confidence={projection.confidence}
          onClick={() => onNavigate('projection')}
        />

        {/* CARD 4: ACCIÓN RECOMENDADA - DATOS YA CALCULADOS */}
        <PredictiveCard
          icon={action.urgency === 'crítica' ? AlertTriangle : 
                action.urgency === 'alta' ? Zap :
                action.urgency === 'baja' ? CheckCircle : Target}
          title="Acción Recomendada"
          value={action.primary}
          subtitle={action.reasoning}
          color={action.urgency === 'crítica' ? "from-red-600 to-red-400" :
                 action.urgency === 'alta' ? "from-orange-600 to-orange-400" :
                 action.urgency === 'media' ? "from-amber-600 to-amber-400" : "from-green-600 to-green-400"}
          borderColor={action.urgency === 'crítica' ? "border-red-500/30" :
                       action.urgency === 'alta' ? "border-orange-500/30" :
                       action.urgency === 'media' ? "border-amber-500/30" : "border-green-500/30"}
          glowColor={action.urgency === 'crítica' ? "rgba(239, 68, 68, 0.2)" :
                     action.urgency === 'alta' ? "rgba(249, 115, 22, 0.2)" :
                     action.urgency === 'media' ? "rgba(251, 191, 36, 0.2)" : "rgba(34, 197, 94, 0.2)"}
          urgency={action.urgency}
          onClick={() => onNavigate('action')}
        />
      </div>

      {/* 📝 INSIGHTS CONTEXTUAL - DISEÑO PRESERVADO */}
      {action.nextSteps && action.nextSteps.length > 0 && (
        <motion.div
          className="mt-6 p-4 rounded-lg bg-black/20 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Próximos Pasos Recomendados
          </h4>
          <div className="space-y-2">
            {action.nextSteps.slice(0, 3).map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span className="text-white/80 text-sm">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}