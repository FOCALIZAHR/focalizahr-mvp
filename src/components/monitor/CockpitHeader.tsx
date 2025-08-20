// ====================================================================
// COCKPIT HEADER - ORQUESTADOR BIMODAL NEURAL MORPHING
// src/components/monitor/CockpitHeader.tsx
// RESPONSABILIDAD: Coordinar vistas + Neural morphing Tesla-style
// ✅ ARQUITECTURA CORRECTA: Usa datos pre-calculados del hook
// ====================================================================

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Activity, Target } from 'lucide-react';
import { useState, useCallback } from 'react';

// Importar las vistas implementadas
import { PredictiveView } from './cockpit/PredictiveView';
import { DynamicView } from './cockpit/DynamicView';

// 🎯 INTERFACE PROPS - DATOS PRE-CALCULADOS DESDE HOOK
interface CockpitHeaderProps {
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
  
  // Datos adicionales para visualización
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
  isLoading: boolean;
  error?: string | null;
  lastRefresh: Date;
}

// 🎯 TIPOS PARA EL TOGGLE
type CockpitViewType = 'predictive' | 'dynamic';

// 🎯 COMPONENTE TOGGLE BUTTON
interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  subtitle: string;
  disabled?: boolean;
}

function ToggleButton({ active, onClick, icon: Icon, label, subtitle, disabled }: ToggleButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[160px]
        relative z-10 flex flex-col items-center justify-center gap-1
        ${active 
          ? 'text-white' 
          : 'text-white/60 hover:text-white/80'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{label}</span>
      </div>
      <span className="text-xs opacity-80">{subtitle}</span>
    </motion.button>
  );
}

// 🎯 COMPONENTE PRINCIPAL
export function CockpitHeader(props: CockpitHeaderProps) {
  // ✅ ESTADO BIMODAL LOCAL
  const [activeView, setActiveView] = useState<CockpitViewType>('predictive');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ✅ HANDLER TOGGLE CON NEURAL MORPHING
  const handleToggle = useCallback((newView: CockpitViewType) => {
    if (isTransitioning || activeView === newView) return;

    setIsTransitioning(true);
    setActiveView(newView);

    // Reset transitioning después de la animación
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200); // Duración total neural morphing
  }, [activeView, isTransitioning]);

  // ✅ NAVIGATION HANDLER
  const handleNavigation = useCallback((section: string) => {
    if (props.onNavigate) {
      props.onNavigate(section);
    } else {
      // Fallback: scroll to section
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [props.onNavigate]);

  // ✅ PROPS PARA LAS VISTAS - ARQUITECTURA CORRECTA
  const viewProps = {
    // Datos base
    participationRate: props.participationRate,
    daysRemaining: props.daysRemaining,
    totalInvited: props.totalInvited,
    totalResponded: props.totalResponded,
    
    // Arrays de inteligencia (con defaults)
    topMovers: props.topMovers || [],
    negativeAnomalies: props.negativeAnomalies || [],
    
    // Objetos complejos (opcionales)
    participationPrediction: props.participationPrediction,
    crossStudyComparison: props.crossStudyComparison,
    insights: props.insights || [],
    recommendations: props.recommendations || [],
    
    // Datos gráficos para DynamicView
    riskTrendData: props.riskTrendData || [],
    departmentSizes: props.departmentSizes || {},
    momentumGaugeData: props.momentumGaugeData || [],
    byDepartment: props.byDepartment || {},
    
    // Cockpit Intelligence PRE-CALCULADA
    cockpitIntelligence: props.cockpitIntelligence,
    
    // Handlers
    onNavigate: handleNavigation,
    
    // Estados
    isLoading: props.isLoading || false,
    lastRefresh: props.lastRefresh
  };

  // ✅ ERROR STATE
  if (props.error) {
    return (
      <motion.div 
        className="fhr-bimodal-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">⚠️ Error en datos</div>
          <div className="text-white/60 text-sm">{props.error}</div>
        </div>
      </motion.div>
    );
  }

  // ✅ LOADING STATE
  if (props.isLoading) {
    return (
      <motion.div 
        className="fhr-bimodal-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center py-8">
          <div className="text-cyan-400 mb-2">🔄 Cargando inteligencia...</div>
          <div className="text-white/60 text-sm">Procesando datos en tiempo real</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 🔥 CONTENEDOR PRINCIPAL BIMODAL */}
      <div className="fhr-bimodal-container">
        
        {/* 🎛️ TOGGLE TESLA-STYLE - NEURAL MORPHING */}
        <div className="flex justify-center mb-8">
          <motion.div 
            className="fhr-bimodal-toggle"
            data-mode={activeView}
            layout
          >
            {/* Background Animado Neural */}
            <motion.div
              className="fhr-bimodal-toggle-indicator"
              animate={{
                x: activeView === 'predictive' ? 0 : '100%'
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.8 
              }}
            />
            
            {/* Botones Toggle */}
            <div className="relative flex">
              <ToggleButton
                active={activeView === 'predictive'}
                onClick={() => handleToggle('predictive')}
                icon={Brain}
                label="Predictiva"
                subtitle="¿Llegaremos?"
                disabled={isTransitioning}
              />
              <ToggleButton
                active={activeView === 'dynamic'}
                onClick={() => handleToggle('dynamic')}
                icon={Zap}
                label="Dinámica"
                subtitle="¿Dónde actuar?"
                disabled={isTransitioning}
              />
            </div>
          </motion.div>
        </div>

        {/* 🧠 VISTAS BIMODALES CON NEURAL MORPHING */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ 
              opacity: 0, 
              x: activeView === 'predictive' ? -50 : 50,
              scale: 0.95 
            }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              x: activeView === 'predictive' ? 50 : -50,
              scale: 0.95 
            }}
            transition={{ 
              duration: 0.6, 
              ease: "easeInOut",
              scale: { duration: 0.4 },
              opacity: { duration: 0.3 }
            }}
          >
            {activeView === 'predictive' ? (
              <PredictiveView {...viewProps} />
            ) : (
              <DynamicView {...viewProps} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 🎯 STATUS INDICATOR */}
        <motion.div 
          className="flex justify-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2 text-xs text-white/60">
            <div className={`w-2 h-2 rounded-full ${
              activeView === 'predictive' ? 'bg-cyan-400' : 'bg-purple-400'
            }`}></div>
            <span>
              {activeView === 'predictive' 
                ? 'Vista Estratégica - Análisis Predictivo' 
                : 'Vista Táctica - Tiempo Real'
              }
            </span>
            {isTransitioning && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}