// ====================================================================
// PREDICTIVE HEADER - VERSIÓN OPTIMIZADA
// src/components/monitor/cockpit/PredictiveHeader.tsx
// 🎯 LIMPIADO: Eliminado código no usado + funcionalidad esencial
// ====================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, ArrowRight, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';

// CSS esencial para efectos vivos
const styles = `
  @keyframes organizational-heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.008); }
  }

  @keyframes intelligence-flow {
    0% { transform: translateX(-100%); opacity: 0; }
    50% { opacity: 0.15; }
    100% { transform: translateX(100%); opacity: 0; }
  }

  .organizational-heartbeat {
    animation: organizational-heartbeat 4s ease-in-out infinite;
  }

  .intelligence-flow::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(45deg, transparent 0%, rgba(34, 211, 238, 0.03) 50%, transparent 100%);
    animation: intelligence-flow 12s linear infinite;
    pointer-events: none;
  }

  .sheen-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%);
    animation: intelligence-flow 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 10;
  }
`;

// Interface de Props - CORREGIDA ESTRUCTURA dailyResponses
interface PredictiveHeaderProps {
  campaignName: string;
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  dailyResponses: Array<{ date: string; count: number; cumulative: number }>;
  participationPrediction?: {
    finalProjection: number;
    confidence: number;
    velocity: number;
  };
  cockpitIntelligence?: {
    vectorMomentum: string;
    projection: {
      finalProjection: number;
      confidence: number;
    };
    action: {
      primary: string;
      reasoning: string;
      timeline: string;
      urgency: 'baja' | 'media' | 'alta' | 'crítica';
    };
  };
  isActive: boolean;
  onNavigate?: (sectionId: string) => void;
}

// ✅ EXPORT NAMED PARA COMPATIBILIDAD EXISTENTE
export function PredictiveHeader({
  campaignName,
  participationRate,
  daysRemaining,
  totalInvited,
  totalResponded,
  dailyResponses,
  participationPrediction,
  cockpitIntelligence,
  isActive,
  onNavigate
}: PredictiveHeaderProps) {

  // Estados para contador desde cero
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!isActive) return null;

  const projectionHero = cockpitIntelligence?.projection?.finalProjection ?? participationPrediction?.finalProjection ?? participationRate;
  const confidenceHero = cockpitIntelligence?.projection?.confidence ?? 0;

  // Contador desde 0 hasta valor real cada 12 segundos
  useEffect(() => {
    const startCounting = () => {
      setIsAnimating(true);
      setDisplayValue(0);
      
      const duration = 2500; // 2.5 segundos para llegar al valor
      const startTime = Date.now();
      const targetValue = projectionHero;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Curva suave
        const easeOut = 1 - Math.pow(1 - progress, 2);
        const currentValue = Math.round(targetValue * easeOut);
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      animate();
    };

    // Iniciar inmediatamente
    startCounting();
    
    // Repetir cada 12 segundos
    const interval = setInterval(startCounting, 12000);
    
    return () => clearInterval(interval);
  }, [projectionHero]);

  // LÓGICA CORREGIDA PARA EL GAUGE
  const gaugeData = [
    // Segmento 1: La participación actual (se pintará de Cian)
    { name: 'Actual', value: participationRate },
    
    // Segmento 2: La diferencia entre la proyección y lo actual (se pintará de Púrpura)
    { name: 'Proyección', value: Math.max(0, projectionHero - participationRate) },
    
    // Segmento 3: Lo que falta para llegar al 100% (se pintará de Gris)
    { name: 'Pendiente', value: Math.max(0, 100 - projectionHero) },
  ];
 
  const COLORS = [
    'var(--focalizahr-cyan)',    // Color para el segmento 'Actual'
    'var(--focalizahr-purple)',  // Color para el segmento 'Proyección'
    '#1e2b3a'                    // Color para el segmento 'Pendiente' (gris sutil)
  ];

  const actionToDisplay = cockpitIntelligence?.action ?? {
    primary: 'Mantener Monitoreo',
    reasoning: 'El sistema no ha detectado anomalías que requieran una acción inmediata.',
    timeline: 'Revisión continua',
    urgency: 'baja'
  };

  // Clasificación inteligente de cards según contexto
  const getCardIntelligenceType = (cardType: string, urgency: string) => {
    if (cardType === 'action') {
      switch (urgency) {
        case 'crítica': return 'fhr-card-attention';
        case 'alta': return 'fhr-card-attention';
        case 'media': return 'fhr-card-analysis';
        default: return 'fhr-card-intelligence';
      }
    }
    if (cardType === 'momentum') return 'fhr-card-analysis';
    if (cardType === 'projection') return 'fhr-card-intelligence';
    return 'fhr-card-analysis';
  };

  const getTrendStatus = (vector?: string) => {
    if (!vector) return { text: 'Estable', colorVar: 'var(--focalizahr-info)' };
    if (vector.toLowerCase().includes('aceleración') || vector.toLowerCase().includes('óptimo')) return { text: 'Creciendo', colorVar: 'var(--focalizahr-success)' };
    if (vector.toLowerCase().includes('desacelerando') || vector.toLowerCase().includes('variable')) return { text: 'Variable', colorVar: 'var(--focalizahr-warning)' };
    if (vector.toLowerCase().includes('crítico')) return { text: 'Crítico', colorVar: 'var(--focalizahr-error)' };
    return { text: 'Estable', colorVar: 'var(--focalizahr-info)' };
  };
  const trend = getTrendStatus(cockpitIntelligence?.vectorMomentum);

  return (
    <div className="bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-700/50 relative overflow-hidden intelligence-flow">
      <style>{styles}</style>
      
      {/* Indicador Sistema Neural Activo */}
      <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
        <div className="neural-active-indicator w-2 h-2 bg-cyan-400 rounded-full"></div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center text-xs text-cyan-400 data-breathing"
        >
          <Activity className="w-3 h-3 mr-2" />
          Sistema activo
        </motion.div>
      </div>

      <h1 className="fhr-title-gradient text-xl lg:text-2xl font-bold mb-6 text-center lg:text-left data-breathing">
        {campaignName}
      </h1>
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 h-full">

        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative w-full max-w-xs sm:max-w-sm h-64 sm:h-72 organizational-heartbeat"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={gaugeData} 
                  cx="50%" 
                  cy="50%" 
                  startAngle={90} 
                  endAngle={450} 
                  innerRadius="80%" 
                  outerRadius="88%" 
                  dataKey="value" 
                  stroke="none"
                  animationBegin={0}
                  animationDuration={2500}
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 rounded-full overflow-hidden sheen-overlay" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.h2 
                className="fhr-title-gradient text-5xl sm:text-6xl font-bold text-center leading-none"
                animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {displayValue}%
              </motion.h2>
              <p className="text-base sm:text-lg text-slate-400 mt-2 data-breathing">
                {isAnimating ? 'Procesando...' : 'Proyección IA'}
              </p>
              <p className="fhr-text-accent text-xs font-mono mt-1 data-breathing">{confidenceHero}% confianza</p>
            </div>
          </motion.div>
          
          <div className="text-center mt-4 space-y-1">
            <p className="text-lg text-slate-300">
              Actual: <span className="font-semibold text-white">{participationRate.toFixed(1)}%</span> ({totalResponded}/{totalInvited})
            </p>
            <p className="text-base text-slate-400">
              {daysRemaining} días restantes
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 lg:max-w-sm space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <HudCard 
              icon={TrendingUp} 
              title="Ritmo y Momentum"
              className="data-breathing"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-white">
                    <span className="font-mono data-breathing">{participationPrediction?.velocity?.toFixed(1) ?? 'N/A'}</span> 
                    <span className="text-sm text-slate-400">resp/día</span>
                  </p>
                  <p className="text-sm font-semibold data-breathing" style={{ color: trend.colorVar }}>
                    {trend.text}
                  </p>
                </div>
                <div className="w-24 h-10">
                  <ResponsiveContainer>
                    <LineChart data={dailyResponses.map(d => ({ pv: d.count }))}>
                      <Line type="monotone" dataKey="pv" stroke={trend.colorVar} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </HudCard>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <HudCard 
              icon={ArrowRight} 
              title="Acción Prioritaria" 
              isActionable={true} 
              onClick={() => onNavigate?.('actions')}
              urgency={actionToDisplay.urgency}
              className="data-breathing"
            >
              <p className="text-lg font-semibold text-white mb-1 data-breathing">{actionToDisplay.primary}</p>
              <p className="text-sm text-slate-400">{actionToDisplay.reasoning}</p>
            </HudCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <HudCard 
              icon={Target} 
              title="Panorama y Proyección"
              className="data-breathing"
            >
              <p className="text-lg text-slate-300">
                Proyección final: <span className="font-semibold text-white data-breathing">{projectionHero.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-slate-400">
                Confianza estadística del {confidenceHero}%.
              </p>
            </HudCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
const HudCard = ({ icon: Icon, title, isActionable = false, urgency = 'baja', onClick, children }: any) => {
    const urgencyColor = {
        'crítica': 'var(--focalizahr-error)',
        'alta': 'var(--focalizahr-warning)',
        'media': 'var(--focalizahr-info)',
        'baja': 'var(--focalizahr-cyan)'
    }[urgency];
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onClick}
            className={`p-5 rounded-xl border transition-all duration-300 ${
              isActionable ? 'cursor-pointer hover:border-slate-600 hover:bg-slate-800/60' : ''
            }`}
            style={{ 
              background: 'rgba(30, 41, 59, 0.5)',
              borderColor: 'rgba(51, 65, 85, 0.8)'
            }}
            whileHover={isActionable ? { y: -2 } : {}}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-300 flex items-center">
                  <Icon className="w-4 h-4 mr-2 text-slate-500" />
                  {title}
                </span>
                {urgency !== 'baja' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: urgencyColor }}></div>
                )}
            </div>
            <div
              className="pl-1"
              style={{ borderLeft: `3px solid ${urgencyColor}`, paddingLeft: '1rem' }}
            >
              {children}
            </div>
        </motion.div>
    );
};

// ✅ EXPORTS COMPATIBLES
export { PredictiveHeader as default };