// ====================================================================
// FOCALIZAHR COCKPIT HEADER - ARQUITECTURA CORRECTA + DISEÑO PRESERVADO
// src/components/monitor/CockpitHeader.tsx
// REFACTORIZADO: Componente tonto + datos pre-calculados + diseño 100% igual
// ====================================================================

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useCockpitView } from '@/hooks/useCockpitView';
import { PredictiveView } from './cockpit/PredictiveView';
import { DynamicView } from './cockpit/DynamicView';
import { useDeviceType, getDeviceAnimationConfig, TouchOptimization } from './cockpit/ResponsiveEnhancements';
import { scrollToSection } from '@/lib/utils/scrollToSection';
import { processCockpitIntelligence } from '@/lib/utils/cockpit-intelligence';
import { Brain, Zap, Loader2, AlertTriangle } from 'lucide-react';
import '@/styles/focalizahr-design-system.css';

// 🎯 INTERFACE - DATOS PRE-CALCULADOS DEL HOOK ÚNICAMENTE
export interface CockpitHeaderProps {
  // ✅ DATOS PRINCIPALES YA CALCULADOS
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  lastActivity: string;
  
  // ✅ INTELIGENCIA YA PROCESADA EN HOOK (no recalcular)
  topMovers?: Array<{
    name: string;
    momentum: number;
    trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  }>;
  negativeAnomalies?: Array<{
    department: string;
    rate: number;
    severity: 'high' | 'medium';
    zScore: number;
  }>;
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
  insights?: string[];
  recommendations?: string[];
  
  // ✅ HANDLERS
  onScrollToSection?: (sectionId: string) => void;
  
  // ✅ ESTADOS
  isLoading?: boolean;
  error?: string | null;
  lastRefresh: Date;
}

// 🎯 COMPONENTE TOGGLE - DISEÑO PRESERVADO 100%
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
        relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[140px]
        ${active 
          ? 'text-white bg-transparent' 
          : 'text-white/60 bg-transparent hover:text-white/80'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-xs text-white/50">{subtitle}</span>
      </div>
    </motion.button>
  );
}

// 🎯 COMPONENTE SKELETON - DISEÑO PRESERVADO
function CockpitSkeleton() {
  return (
    <div className="w-full mb-8">
      <motion.div 
        className="fhr-card neural-glow border border-white/10 backdrop-blur-xl bg-black/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >
        <div className="flex justify-center mb-6 p-2">
          <div className="relative bg-black/30 rounded-full p-1 border border-white/20 backdrop-blur-sm">
            <div className="relative flex">
              <div className="px-8 py-3 rounded-full min-w-[140px] bg-white/5 animate-pulse" />
              <div className="px-8 py-3 rounded-full min-w-[140px] bg-white/5 animate-pulse ml-1" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2" />
              <div className="h-8 bg-white/10 rounded mb-1" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 COMPONENTE ERROR - DISEÑO PRESERVADO
function CockpitError({ error }: { error: string }) {
  return (
    <div className="w-full mb-8">
      <motion.div 
        className="border border-red-500/30 backdrop-blur-xl bg-red-500/10 rounded-xl p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error en Cockpit</h3>
          <p className="text-white/70">{error}</p>
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 COMPONENTE PRINCIPAL - ARQUITECTURA CORRECTA + DISEÑO PRESERVADO
export function CockpitHeader(props: CockpitHeaderProps) {
  // ✅ SOLO USAR DATOS YA CALCULADOS - NO RECALCULAR
  const intelligence = processCockpitIntelligence(props);
  
  // ✅ HOOKS UI - DISEÑO PRESERVADO
  const { 
    activeView, 
    handleToggle, 
    isTransitioning,
    canSwitch 
  } = useCockpitView();

  const deviceType = useDeviceType();

  // 🧭 NAVEGACIÓN UNIVERSAL - FUNCIONALIDAD PRESERVADA
  const handleNavigation = (section: string) => {
    const sectionMap: Record<string, string> = {
      'momentum': 'topmovers',
      'projection': 'rhythm',
      'action': 'actions', 
      'risk': 'anomalies',
      'champion': 'pulse',
      'pattern': 'cross-study'
    };
    
    const targetSection = sectionMap[section] || section;
    
    if (props.onScrollToSection) {
      props.onScrollToSection(targetSection);
    } else {
      scrollToSection(targetSection as any);
    }
  };

  // 🔄 SKELETON PREMIUM - DISEÑO PRESERVADO
  if (props.isLoading) {
    return <CockpitSkeleton />;
  }

  // ⚠️ ERROR STATE ELEGANTE - DISEÑO PRESERVADO
  if (props.error) {
    return <CockpitError error={props.error} />;
  }

  return (
    <div className="w-full mb-8">
      {/* 🎯 CONTENEDOR GLASS COCKPIT PREMIUM - DISEÑO PRESERVADO 100% */}
      <motion.div 
        className="fhr-card neural-glow border border-white/10 backdrop-blur-xl bg-black/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >
        {/* 🔮 TOGGLE MÁGICO NIVEL TESLA - DISEÑO PRESERVADO 100% */}
        <div className="flex justify-center mb-6 p-2">
          <div className="relative bg-black/30 rounded-full p-1 border border-white/20 backdrop-blur-sm">
            {/* Background animado del toggle - DISEÑO PRESERVADO */}
            <motion.div
              className="absolute top-1 w-1/2 h-[calc(100%-8px)] bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full backdrop-blur-sm border border-white/10"
              animate={{
                x: activeView === 'predictive' ? 0 : '100%'
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 0.8
              }}
            />
            
            {/* Botones del toggle - DISEÑO PRESERVADO */}
            <div className="relative flex">
              <ToggleButton
                active={activeView === 'predictive'}
                onClick={() => canSwitch && handleToggle('predictive')}
                icon={Brain}
                label="Predictiva"
                subtitle="¿Llegaremos?"
                disabled={isTransitioning}
              />
              <ToggleButton
                active={activeView === 'dynamic'}
                onClick={() => canSwitch && handleToggle('dynamic')}
                icon={Zap}
                label="Dinámica"
                subtitle="¿Dónde actuar?"
                disabled={isTransitioning}
              />
            </div>
          </div>
        </div>

        {/* 🎬 VISTAS BIMODALES - ANIMACIONES PRESERVADAS */}
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait" initial={false}>
            {activeView === 'predictive' ? (
              <motion.div
                key="predictive"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <PredictiveView 
                  // ✅ PASAR DATOS YA CALCULADOS + INTELIGENCIA
                  {...props}
                  intelligence={intelligence}
                  isTransitioning={isTransitioning}
                  onNavigate={handleNavigation}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dynamic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <DynamicView 
                  // ✅ PASAR DATOS YA CALCULADOS + INTELIGENCIA
                  {...props}
                  intelligence={intelligence}
                  isTransitioning={isTransitioning}
                  onNavigate={handleNavigation}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 🔄 OPTIMIZACIÓN TOUCH MÓVIL - FUNCIONALIDAD PRESERVADA */}
        <TouchOptimization 
          deviceType={deviceType}
          onSwipeLeft={() => canSwitch && handleToggle('dynamic')}
          onSwipeRight={() => canSwitch && handleToggle('predictive')}
        />
      </motion.div>
    </div>
  );
}