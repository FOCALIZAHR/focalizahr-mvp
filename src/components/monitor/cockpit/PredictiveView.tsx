// ====================================================================
// PREDICTIVE VIEW - VISTA PREDICTIVA CON REFINAMIENTOS
// src/components/monitor/cockpit/PredictiveView.tsx
// RESPONSABILIDAD: Vista futura con gauge integrado y animaciones CountUp
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, ArrowRight } from 'lucide-react';
import { PredictiveGauge } from './PredictiveGauge';
import { useDeviceType, getDeviceAnimationConfig } from './ResponsiveEnhancements';
import { CockpitIntelligence } from '@/lib/utils/cockpit-intelligence';
import CountUp from 'react-countup';

// 🎯 INTERFACE PROPS - DATOS PRE-CALCULADOS
interface PredictiveViewProps {
  participationRate: number;
  daysRemaining: number;
  intelligence: CockpitIntelligence;
  isTransitioning?: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  onNavigate?: (sectionId: string) => void;
}

// 🎯 COMPONENTE PRINCIPAL
export function PredictiveView({ 
  participationRate, 
  daysRemaining, 
  intelligence, 
  isTransitioning,
  deviceType,
  onNavigate 
}: PredictiveViewProps) {
  
  // ✅ deviceType ya viene como prop - no llamar hook aquí

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 🎯 TARJETA 1: PUNTO DE PARTIDA CON COUNTUP */}
        <motion.div
          className={`fhr-card fhr-card-metric gradient-momentum cursor-pointer group ${deviceType === 'mobile' ? 'hover-disabled' : ''}`}
          variants={getDeviceAnimationConfig(deviceType)?.card || {}}
          onClick={() => onNavigate?.('current')}
          whileHover={deviceType !== 'mobile' ? { scale: 1.02, y: -4 } : {}}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <h3 className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Punto de Partida
                </h3>
              </div>
              <TrendingUp className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-white mb-1 countup-number">
                <CountUp 
                  end={participationRate} 
                  duration={2}
                  suffix="%"
                  preserveValue
                />
              </div>
              <div className="text-xs text-white/60">
                {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Campaña finalizada'}
              </div>
            </div>
            
            <div className="text-xs text-white/60">
              Base actual para proyecciones
            </div>
          </div>
        </motion.div>

        {/* 🎯 TARJETA 2: VECTOR MOMENTUM CON COUNTUP */}
        <motion.div
          className={`fhr-card fhr-card-metric gradient-momentum cursor-pointer group ${deviceType === 'mobile' ? 'hover-disabled' : ''}`}
          variants={getDeviceAnimationConfig(deviceType)?.card || {}}
          onClick={() => onNavigate?.('momentum')}
          whileHover={deviceType !== 'mobile' ? { scale: 1.02, y: -4 } : {}}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h3 className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Vector Momentum
                </h3>
              </div>
              <Zap className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            
            <div className="mb-4">
              <div className="text-2xl font-bold text-white mb-1 countup-number">
                <CountUp 
                  end={parseFloat(intelligence.vectorMomentum.match(/([+-]?\d+\.?\d*)/)?.[1] || '0')} 
                  duration={2.5}
                  decimals={1}
                  suffix={intelligence.vectorMomentum.includes('%') ? '%' : ''}
                  preserveValue
                />
                <span className="text-lg ml-1">
                  {intelligence.vectorMomentum.split(/[+-]?\d+\.?\d*%?/)[1]?.trim() || 'momentum'}
                </span>
              </div>
              <div className="text-xs text-white/60">
                Vector de cambio detectado
              </div>
            </div>
            
            <div className="text-xs text-white/60">
              Velocidad organizacional actual
            </div>
          </div>
        </motion.div>

        {/* 🎯 TARJETA 3: NÚCLEO PREDICTIVO - VISUALMENTE DOMINANTE */}
        <motion.div
          className={`fhr-card fhr-card-metric gradient-projection cursor-pointer group neural-glow fhr-tooltip ${deviceType === 'mobile' ? 'hover-disabled' : ''}`}
          variants={getDeviceAnimationConfig(deviceType)?.card || {}}
          onClick={() => onNavigate?.('analytics')}
          whileHover={deviceType !== 'mobile' ? { scale: 1.02, y: -4 } : {}}
          whileTap={{ scale: 0.98 }}
          data-tooltip={`Metodología: ${intelligence.projection.methodology}`}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse neural-pulse"></div>
                <h3 className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Proyección Final
                </h3>
              </div>
              <Target className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            
            <div className="mb-4">
              <div className="text-4xl font-bold text-white mb-1 neural-glow countup-number">
                <CountUp 
                  end={intelligence.projection.finalProjection} 
                  duration={2.5}
                  suffix="%"
                  preserveValue
                />
              </div>
              <div className="text-xs text-white/60">
                <CountUp 
                  end={intelligence.projection.confidence} 
                  duration={2}
                  suffix="% confianza"
                  preserveValue
                />
              </div>
            </div>
            
            {/* GAUGE INTEGRADO */}
            <div className="w-full h-24">
              <PredictiveGauge 
                currentValue={participationRate}
                targetValue={intelligence.projection.finalProjection}
                confidence={intelligence.projection.confidence}
              />
            </div>
          </div>
        </motion.div>

        {/* 🎯 TARJETA 4: ACCIÓN RECOMENDADA */}
        <motion.div
          className={`fhr-card fhr-card-metric ${intelligence.action.urgency === 'crítica' ? 'gradient-risk-enhanced' : 
                     intelligence.action.urgency === 'alta' ? 'gradient-action-enhanced' : 
                     'gradient-action'} cursor-pointer group ${deviceType === 'mobile' ? 'hover-disabled' : ''}`}
          variants={getDeviceAnimationConfig(deviceType)?.card || {}}
          onClick={() => onNavigate?.('actions')}
          whileHover={deviceType !== 'mobile' ? { scale: 1.02, y: -4 } : {}}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${intelligence.action.urgencyColor || 'bg-green-400'}`}></div>
                <h3 className="text-sm text-white/80 group-hover:text-white transition-colors">
                  Acción Recomendada
                </h3>
              </div>
              <ArrowRight className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
            </div>
            
            <div className="mb-4">
              <div className="text-lg font-bold text-white mb-2 leading-tight">
                {intelligence.action.primary}
              </div>
              <div className="text-xs text-white/70 leading-relaxed">
                {intelligence.action.reasoning}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className={`text-xs px-2 py-1 rounded-full ${
                intelligence.action.urgency === 'crítica' ? 'bg-red-500/20 text-red-300' :
                intelligence.action.urgency === 'alta' ? 'bg-yellow-500/20 text-yellow-300' :
                intelligence.action.urgency === 'media' ? 'bg-blue-500/20 text-blue-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {intelligence.action.urgency} prioridad
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}