// ====================================================================
// COCKPIT HEADER BIMODAL - ORQUESTADOR MAESTRO
// src/components/monitor/CockpitHeader.tsx
// RESPONSABILIDAD: Toggle bimodal + routing datos + coordinación vistas
// ✅ ARQUITECTURA: 100% coordinador, componentes vistas son TONTOS
// 🎯 DISEÑO: Panel de Mando Bimodal Asimétrico - Toggle Tesla + Vistas especializadas
// ====================================================================

"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, Eye, Zap } from 'lucide-react';

// ✅ IMPORTAR VISTAS ESPECIALIZADAS
import PredictiveView from './cockpit/PredictiveView';
import DynamicView from './cockpit/DynamicView';

// 🎯 INTERFACE PROPS COMPLETA DEL ORQUESTADOR
interface CockpitHeaderProps {
  // ✅ DATOS BASE CAMPAÑA
  campaignId: string;
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  // ✅ ARRAYS INTELIGENCIA
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
  
  // ✅ OBJETOS COMPLEJOS PRE-CALCULADOS
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
  
  // ✅ COCKPIT INTELLIGENCE CENTRAL (PRE-CALCULADA EN HOOK)
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
      nextSteps?: string[];
    };
  };
  
  // ✅ DATOS ADICIONALES VISUALIZACIÓN
  riskTrendData?: Array<{date: string, rate: number}>;
  departmentSizes?: Record<string, number>;
  momentumGaugeData?: Array<{value: number, fill: string}>;
  byDepartment?: Record<string, {
    invited: number;
    responded: number;
    rate: number;
  }>;
  
  // ✅ HANDLERS DE NAVEGACIÓN
  onNavigate?: (sectionId: string) => void;
  
  // ✅ ESTADOS
  isLoading?: boolean;
  error?: string | null;
  lastRefresh: Date;
}

// 🎯 TIPOS VISTA BIMODAL
type ViewMode = 'predictive' | 'dynamic';

// 🎯 COMPONENTE TOGGLE ENHANCED
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
        relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[160px]
        ${active 
          ? 'text-white bg-transparent' 
          : 'text-white/60 bg-transparent hover:text-white/80'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex flex-col items-center justify-center space-y-1">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4" />
          <span className="font-semibold">{label}</span>
        </div>
        <div className="text-xs text-white/60">{subtitle}</div>
      </div>
      
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-500/50"
          style={{
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// 🎯 COMPONENTE SKELETON MEJORADO
function CockpitSkeleton() {
  return (
    <div className="w-full mb-8">
      <motion.div 
        className="border border-white/10 backdrop-blur-xl bg-black/20 rounded-xl p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Toggle skeleton */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            <div className="h-16 w-40 bg-white/10 rounded-full animate-pulse"></div>
            <div className="h-16 w-40 bg-white/10 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="border border-white/10 rounded-xl p-6 bg-white/5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="space-y-3">
                <div className="w-3 h-3 bg-cyan-500/30 rounded-full"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-8 bg-white/10 rounded animate-pulse"></div>
                <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 COMPONENTE PRINCIPAL ORQUESTADOR
export default function CockpitHeader(props: CockpitHeaderProps) {
  // ✅ DESTRUCTURAR PROPS
  const {
    campaignId,
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
    error,
    lastRefresh
  } = props;

  // ✅ ESTADO LOCAL DEL TOGGLE
  const [activeView, setActiveView] = useState<ViewMode>('predictive');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ✅ HANDLER CAMBIO DE VISTA CON ANIMACIÓN
  const handleViewChange = useCallback((newView: ViewMode) => {
    if (isTransitioning || activeView === newView) return;
    
    setIsTransitioning(true);
    setActiveView(newView);
    
    // Reset transitioning after animation
    setTimeout(() => setIsTransitioning(false), 300);
  }, [activeView, isTransitioning]);

  // ✅ PROPS CONSOLIDADAS PARA VISTAS
  const viewProps = {
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
    isLoading,
    lastRefresh
  };

  // ✅ MOSTRAR SKELETON MIENTRAS CARGA
  if (isLoading) {
    return <CockpitSkeleton />;
  }

  // ✅ MOSTRAR ERROR SI EXISTE
  if (error) {
    return (
      <div className="w-full mb-8">
        <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-6 text-center">
          <div className="text-red-400 mb-2">Error en Cockpit Header</div>
          <div className="text-sm text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  // 🎯 RENDER PRINCIPAL: PANEL DE MANDO BIMODAL ASIMÉTRICO
  return (
    <div className="w-full mb-8">
      <motion.div 
        className="border border-white/10 backdrop-blur-xl bg-black/20 rounded-xl p-8"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(34, 211, 238, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.1)'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* 🎛️ TOGGLE BIMODAL TESLA STYLE */}
        <div className="flex justify-center mb-8">
          <div className="relative bg-black/30 rounded-full p-1 border border-white/20 backdrop-blur-sm">
            {/* Background animado del toggle */}
            <motion.div
              className="absolute top-1 w-1/2 h-[calc(100%-8px)] rounded-full backdrop-blur-sm border border-white/10"
              style={{
                background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)'
              }}
              animate={{
                x: activeView === 'predictive' ? 0 : '100%'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            {/* Botones del toggle */}
            <div className="relative z-10 flex">
              <ToggleButton
                active={activeView === 'predictive'}
                onClick={() => handleViewChange('predictive')}
                icon={TrendingUp}
                label="Predictiva"
                subtitle="¿Llegaremos?"
                disabled={isTransitioning}
              />
              <ToggleButton
                active={activeView === 'dynamic'}
                onClick={() => handleViewChange('dynamic')}
                icon={Activity}
                label="Dinámica"
                subtitle="¿Dónde actuar?"
                disabled={isTransitioning}
              />
            </div>
          </div>
        </div>

        {/* 🎯 CONTENIDO BIMODAL CON ANIMACIONES */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeView === 'predictive' ? (
              <PredictiveView key="predictive" {...viewProps} />
            ) : (
              <DynamicView key="dynamic" {...viewProps} />
            )}
          </AnimatePresence>
        </div>

        {/* ✅ FOOTER CON INFORMACIÓN CONTEXTUAL */}
        <motion.div
          className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-xs text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <span>Campaña: {campaignId}</span>
            <span>•</span>
            <span>Vista: {activeView === 'predictive' ? 'Proyección Futura' : 'Tiempo Real'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>Sistema operativo</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}