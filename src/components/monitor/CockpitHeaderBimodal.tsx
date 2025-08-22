// ====================================================================
// PANEL BIMODAL ASIMÉTRICO - ARQUITECTURA REAL CLASE MUNDIAL
// src/components/monitor/CockpitHeaderBimodal.tsx
// ✅ IMPLEMENTA: Documentación "Panel de Mando Bimodal Asimétrico"
// ✅ NEURAL MORPHING: layoutId velocímetro masivo → gauge compacto
// ====================================================================

"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, TrendingUp, ToggleLeft, ToggleRight, Gauge, Activity } from 'lucide-react';
import { PredictiveHeader } from './cockpit/PredictiveHeader';
import { DynamicHeader } from './cockpit/DynamicHeader';

// 🎯 INTERFACE PROPS - ARQUITECTURA NEURAL DOCUMENTADA
interface CockpitHeaderBimodalProps {
  // Datos base
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  // Arrays de inteligencia PRE-CALCULADOS del hook
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
  
  // Objetos complejos PRE-CALCULADOS
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
  
  // Cockpit Intelligence PRE-CALCULADA (CRÍTICO)
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
    tacticalAction?: {
      primary: string;
      reasoning: string;
      urgency: string;
      urgencyColor: string;
      timeline?: string;
    };
  };
  
  // Datos adicionales para vista dinámica
  riskTrendData?: Array<{date: string, rate: number}>;
  departmentSizes?: Record<string, number>;
  momentumGaugeData?: Array<{value: number, fill: string}>;
  byDepartment?: Record<string, {
    invited: number;
    responded: number;
    rate: number;
  }>;
  
  // Handlers
  onNavigate?: (section: string) => void;
  
  // Estados
  isLoading?: boolean;
  lastRefresh?: Date;
}

// 🎯 ORQUESTADOR PRINCIPAL - PANEL BIMODAL ASIMÉTRICO
function CockpitHeaderBimodal(props: CockpitHeaderBimodalProps) {
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
    riskTrendData,
    departmentSizes,
    momentumGaugeData,
    byDepartment,
    onNavigate,
    isLoading = false,
    lastRefresh = new Date()
  } = props;

  // ✅ CONSTANTES CONFIGURACIÓN CENTRALIZADAS
  const CONFIG = {
    ANIMATION_DURATION: 300,
    TOGGLE_WIDTH: 160,
    TOGGLE_HEIGHT: 44,
    NEURAL_PULSE_DURATION: 2,
    TRANSITION_EASE: [0.4, 0, 0.2, 1] as const
  };

  // ✅ ESTADO BIMODAL + PERFORMANCE OPTIMIZADO
  const [modo, setModo] = useState<'predictivo' | 'dinamico'>('predictivo');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ✅ PERFORMANCE: Evitar re-renders innecesarios
  const isPredictivoMode = modo === 'predictivo';
  const isDinamicoMode = modo === 'dinamico';

  // ✅ TOGGLE TESLA OPTIMIZADO CON PERFORMANCE
  const handleToggleMode = useCallback(async () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Secuencia temporal optimizada
    await new Promise(resolve => setTimeout(resolve, CONFIG.ANIMATION_DURATION / 3));
    setModo(current => current === 'predictivo' ? 'dinamico' : 'predictivo');
    await new Promise(resolve => setTimeout(resolve, CONFIG.ANIMATION_DURATION * 2));
    setIsTransitioning(false);
  }, [isTransitioning]);

  // ✅ NAVEGACIÓN INTELIGENTE
  const handleNavigation = useCallback((section: string) => {
    if (onNavigate) {
      onNavigate(section);
      return;
    }
    
    // Scroll suave + highlight temporal
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.5)';
      setTimeout(() => { element.style.boxShadow = ''; }, 2000);
    }
  }, [onNavigate]);

  // ✅ LOADING STATE SKELETON
  if (isLoading || !cockpitIntelligence) {
    return (
      <div className="panel-bimodal-container">
        <div className="neural-card" style={{ minHeight: '420px', padding: '2rem' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-64 bg-slate-700/50 animate-pulse rounded-lg"></div>
            <div className="h-10 w-40 bg-slate-700/50 animate-pulse rounded-full"></div>
          </div>
          
          {/* Skeleton Velocímetro Masivo */}
          <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
            <div className="w-[300px] h-[300px] bg-slate-700/30 animate-pulse rounded-full border-4 border-slate-600/30"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="panel-bimodal-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{ 
        background: 'var(--glass-bg, rgba(15, 23, 42, 0.6))',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '2rem',
        minHeight: '420px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 🌟 GLASSMORPHISM OVERLAY SIGNATURE */}
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.03) 0%, transparent 50%, rgba(139, 92, 246, 0.02) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* 🎛️ HEADER CON TOGGLE TESLA-STYLE */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        
        {/* TÍTULO NEURAL OPTIMIZADO + PERFORMANCE */}
        <motion.div
          key={modo}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: CONFIG.ANIMATION_DURATION / 1000 }}
          className="flex items-center gap-3"
        >
          {isPredictivoMode ? (
            <>
              <Gauge className="w-7 h-7" style={{ color: '#00d9ff' }} />
              <h1 
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #00d9ff 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(0, 217, 255, 0.3)'
                }}
              >
                Mission Control Predictivo
              </h1>
            </>
          ) : (
            <>
              <Activity className="w-7 h-7" style={{ color: '#8b5cf6' }} />
              <h1 
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ef4444 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                }}
              >
                War Room Ejecutivo
              </h1>
            </>
          )}
        </motion.div>

        {/* TOGGLE TESLA PREMIUM OPTIMIZADO */}
        <motion.button
          onClick={handleToggleMode}
          disabled={isTransitioning}
          className="tesla-toggle"
          style={{
            width: `${CONFIG.TOGGLE_WIDTH}px`,
            height: `${CONFIG.TOGGLE_HEIGHT}px`,
            background: isPredictivoMode 
              ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(59, 130, 246, 0.15))'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(239, 68, 68, 0.15))',
            border: `1px solid ${isPredictivoMode ? 'rgba(0, 217, 255, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
            borderRadius: `${CONFIG.TOGGLE_HEIGHT / 2}px`,
            position: 'relative',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            transition: `all ${CONFIG.ANIMATION_DURATION}ms cubic-bezier(${CONFIG.TRANSITION_EASE.join(',')})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            backdropFilter: 'blur(10px)',
            opacity: isTransitioning ? 0.7 : 1
          }}
          whileHover={{ scale: isTransitioning ? 1 : 1.02 }}
          whileTap={{ scale: isTransitioning ? 1 : 0.98 }}
        >
          {/* NEURAL PULSE OPTIMIZADO */}
          <motion.div
            className="toggle-thumb"
            animate={{ 
              x: isPredictivoMode ? 0 : 76,
              backgroundColor: isPredictivoMode ? '#00d9ff' : '#8b5cf6'
            }}
            transition={{ 
              type: "spring", 
              stiffness: 700, 
              damping: 30,
              duration: CONFIG.ANIMATION_DURATION / 1000
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '18px',
              background: '#00d9ff',
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px ${isPredictivoMode ? 'rgba(0, 217, 255, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPredictivoMode ? (
              <TrendingUp className="w-4 h-4 text-slate-900" />
            ) : (
              <Eye className="w-4 h-4 text-white" />
            )}
          </motion.div>

          {/* LABELS OPTIMIZADOS */}
          <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium pointer-events-none">
            <span className={`transition-colors duration-300 ${isPredictivoMode ? 'text-white/90' : 'text-white/50'}`}>
              Predictivo
            </span>
            <span className={`transition-colors duration-300 ${isDinamicoMode ? 'text-white/90' : 'text-white/50'}`}>
              Dinámico
            </span>
          </div>
        </motion.button>
      </div>

      {/* 🧠 PANEL BIMODAL OPTIMIZADO CON PERFORMANCE */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {isPredictivoMode ? (
            <motion.div
              key="mission-control"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: CONFIG.ANIMATION_DURATION / 1000, ease: CONFIG.TRANSITION_EASE }}
            >
              <PredictiveHeader
                participationRate={participationRate}
                daysRemaining={daysRemaining}
                totalInvited={totalInvited}
                totalResponded={totalResponded}
                topMovers={topMovers}
                negativeAnomalies={negativeAnomalies}
                participationPrediction={participationPrediction}
                crossStudyComparison={crossStudyComparison}
                insights={insights}
                recommendations={recommendations}
                cockpitIntelligence={cockpitIntelligence}
                onNavigate={handleNavigation}
                isLoading={false}
                lastRefresh={lastRefresh}
              />
            </motion.div>
          ) : (
            <motion.div
              key="war-room"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: CONFIG.ANIMATION_DURATION / 1000, ease: CONFIG.TRANSITION_EASE }}
            >
              <DynamicHeader
                participationRate={participationRate}
                daysRemaining={daysRemaining}
                totalInvited={totalInvited}
                totalResponded={totalResponded}
                topMovers={topMovers}
                negativeAnomalies={negativeAnomalies}
                riskTrendData={riskTrendData}
                departmentSizes={departmentSizes}
                momentumGaugeData={momentumGaugeData}
                byDepartment={byDepartment}
                cockpitIntelligence={cockpitIntelligence}
                onNavigate={handleNavigation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🌟 NEURAL PULSE OPTIMIZADO */}
      <motion.div
        className="absolute top-4 right-4 w-3 h-3 rounded-full z-20"
        style={{ 
          backgroundColor: isPredictivoMode ? '#00d9ff' : '#8b5cf6',
          boxShadow: `0 0 10px ${isPredictivoMode ? 'rgba(0, 217, 255, 0.6)' : 'rgba(139, 92, 246, 0.6)'}`
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: CONFIG.NEURAL_PULSE_DURATION,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

// 🎯 EXPORT PRINCIPAL
export { CockpitHeaderBimodal };