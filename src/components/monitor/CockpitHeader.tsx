// ====================================================================
// NEURAL COMMAND CENTER - PREMIUM ENTERPRISE DESIGN
// src/components/monitor/CockpitHeader.tsx
// 🎯 TESLA/SPACEX LEVEL VISUAL IDENTITY - FOCALIZAHR PREMIUM
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
  onScrollToSection?: (sectionId: string) => void;
  
  // ✅ ESTADOS
  isLoading?: boolean;
  error?: string | null;
  lastRefresh: Date;
}

// 🎯 TIPOS VISTA BIMODAL
type ViewMode = 'predictive' | 'dynamic';

// 🎯 COMPONENTE TOGGLE PREMIUM
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
        relative px-8 py-4 rounded-xl text-sm font-medium transition-all duration-500 min-w-[180px] group
        ${active 
          ? 'text-white' 
          : 'text-white/60 hover:text-white/90'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Premium glow effect for active state */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(167, 139, 250, 0.3) 100%)',
            filter: 'blur(8px)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      {/* Neural connection lines */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {active && (
          <>
            <motion.div 
              className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            />
          </>
        )}
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ 
              rotateY: active ? 360 : 0,
              scale: active ? 1.1 : 1 
            }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-white/60'}`} />
          </motion.div>
          <span className="font-bold tracking-wide">{label}</span>
        </div>
        <motion.div 
          className={`text-xs font-medium ${active ? 'text-cyan-300' : 'text-white/50'}`}
          animate={{ 
            opacity: active ? 1 : 0.7,
            y: active ? 0 : 2 
          }}
          transition={{ duration: 0.3 }}
        >
          {subtitle}
        </motion.div>
      </div>
      
      {/* Subtle hover effect */}
      {!active && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)'
          }}
        />
      )}
    </motion.button>
  );
}

// 🎯 COMPONENTE SKELETON NEURAL
function NeuralSkeleton() {
  return (
    <div className="w-full mb-12">
      <motion.div 
        className="border border-white/10 backdrop-blur-xl bg-black/20 rounded-2xl p-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Neural loading pattern */}
        <div className="flex justify-center mb-10">
          <div className="flex space-x-4">
            <div className="h-20 w-44 bg-white/10 rounded-xl animate-pulse"></div>
            <div className="h-20 w-44 bg-white/10 rounded-xl animate-pulse"></div>
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
              <div className="space-y-4">
                <div className="w-4 h-4 bg-cyan-500/30 rounded-full animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-16 bg-white/10 rounded animate-pulse"></div>
                <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 ERROR STATE PREMIUM
function NeuralError({ error }: { error: string }) {
  return (
    <div className="w-full mb-12 flex justify-center">
      <motion.div 
        className="border border-red-500/30 backdrop-blur-xl bg-red-500/5 rounded-2xl p-10 max-w-md text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.3)',
              '0 0 0 10px rgba(239, 68, 68, 0.1)',
              '0 0 0 0 rgba(239, 68, 68, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-8 h-8 text-red-400" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-red-400 mb-3">
          Error en Neural Command
        </h3>
        
        <p className="text-white/70 mb-6 text-sm leading-relaxed">
          {error}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 text-sm bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 COMPONENTE PRINCIPAL - NEURAL COMMAND CENTER
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
    onScrollToSection,
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
    onNavigate: onScrollToSection,
    isLoading,
    lastRefresh
  };

  // ✅ MOSTRAR SKELETON MIENTRAS CARGA
  if (isLoading) {
    return <NeuralSkeleton />;
  }

  // ✅ MOSTRAR ERROR SI EXISTE
  if (error) {
    return <NeuralError error={error} />;
  }

  // 🎯 RENDER PRINCIPAL: NEURAL COMMAND CENTER
  return (
    <div className="w-full mb-12">
      <motion.div 
        className="neural-command-center border border-white/10 backdrop-blur-xl rounded-2xl p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.90) 50%, rgba(15, 23, 42, 0.85) 100%)',
          boxShadow: `
            0 0 60px rgba(34, 211, 238, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 0 20px rgba(0, 0, 0, 0.2)
          `
        }}
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Neural network background pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="1" fill="rgba(34, 211, 238, 0.3)"/>
                <circle cx="0" cy="0" r="1" fill="rgba(167, 139, 250, 0.2)"/>
                <circle cx="100" cy="0" r="1" fill="rgba(167, 139, 250, 0.2)"/>
                <circle cx="0" cy="100" r="1" fill="rgba(34, 211, 238, 0.2)"/>
                <circle cx="100" cy="100" r="1" fill="rgba(34, 211, 238, 0.2)"/>
                <line x1="50" y1="50" x2="0" y2="0" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="0.5"/>
                <line x1="50" y1="50" x2="100" y2="0" stroke="rgba(167, 139, 250, 0.1)" strokeWidth="0.5"/>
                <line x1="50" y1="50" x2="0" y2="100" stroke="rgba(167, 139, 250, 0.1)" strokeWidth="0.5"/>
                <line x1="50" y1="50" x2="100" y2="100" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid)"/>
          </svg>
        </div>

        {/* Command center header */}
        <motion.div 
          className="text-center mb-8 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="inline-flex items-center space-x-3 mb-4">
            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h1 className="text-lg font-bold text-white/90 tracking-wide">NEURAL COMMAND CENTER</h1>
            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-cyan-500"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
          <p className="text-sm text-white/60 font-medium">
            Sistema de Inteligencia Organizacional • Análisis Predictivo en Tiempo Real
          </p>
        </motion.div>

        {/* 🎛️ NEURAL COMMAND TOGGLE - TESLA CYBERTRUCK STYLE */}
        <div className="flex justify-center mb-10 relative">
          {/* Glow ambient background */}
          <div className="absolute inset-0 flex justify-center">
            <div className="w-80 h-20 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent blur-3xl"></div>
          </div>
          
          <div className="relative neural-toggle-container backdrop-blur-xl border border-white/10 rounded-2xl p-2"
               style={{
                 background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.9) 100%)',
                 boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(34, 211, 238, 0.1)'
               }}>
            
            {/* Neural glow indicator */}
            <motion.div
              className="absolute top-2 h-[calc(100%-16px)] rounded-xl border border-cyan-400/30"
              style={{
                width: 'calc(50% - 4px)',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                boxShadow: '0 0 30px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
              animate={{
                x: activeView === 'predictive' ? 4 : '100%'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
            
            {/* Neural network pattern overlay */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="absolute top-1/3 left-3/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            {/* Command buttons */}
            <div className="relative z-20 flex">
              <ToggleButton
                active={activeView === 'predictive'}
                onClick={() => handleViewChange('predictive')}
                icon={TrendingUp}
                label="Neural Forecast"
                subtitle="Proyección IA"
                disabled={isTransitioning}
              />
              <ToggleButton
                active={activeView === 'dynamic'}
                onClick={() => handleViewChange('dynamic')}
                icon={Activity}
                label="Live Intelligence"
                subtitle="Tiempo Real"
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

        {/* ✨ NEURAL COMMAND FOOTER */}
        <motion.div
          className="mt-10 pt-6 border-t border-gradient-to-r from-transparent via-white/10 to-transparent relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {/* Status indicators */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center space-x-6 text-white/50">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                  animate={{ 
                    boxShadow: [
                      '0 0 5px rgba(34, 197, 94, 0.5)',
                      '0 0 15px rgba(34, 197, 94, 0.8)',
                      '0 0 5px rgba(34, 197, 94, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="font-medium">Sistema Neural Operativo</span>
              </div>
              <span className="text-white/30">•</span>
              <span>Campaña: <span className="text-cyan-400 font-mono">{campaignId}</span></span>
              <span className="text-white/30">•</span>
              <span>Vista: <span className="text-purple-400 font-medium">
                {activeView === 'predictive' ? 'Proyección Futura' : 'Análisis Tiempo Real'}
              </span></span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* AI processing indicator */}
              <div className="flex items-center space-x-2">
                <motion.div
                  className="flex space-x-1"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                </motion.div>
                <span className="text-white/60 text-xs font-medium">IA Procesando</span>
              </div>
              
              {/* Performance badge */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                <span className="text-green-400 text-xs font-medium">Enterprise Ready</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}