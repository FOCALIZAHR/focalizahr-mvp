// ====================================================================
// FOCALIZAHR COCKPIT HEADER - ORQUESTADOR PREMIUM BIMODAL
// src/components/monitor/CockpitHeader.tsx
// Chat 1-3: Fundación + Vista Predictiva + Vista Dinámica - VERSIÓN FINAL
// ====================================================================

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useCockpitView } from '@/hooks/useCockpitView';
import { PredictiveView } from './cockpit/PredictiveView';
import { DynamicView } from './cockpit/DynamicView';
import { useDeviceType, getDeviceAnimationConfig, TouchOptimization } from './cockpit/ResponsiveEnhancements';
import { scrollToSection } from '@/lib/utils/scrollToSection';
import { Brain, Zap, Loader2 } from 'lucide-react';

// 🎯 INTERFACE DATOS REALES - Desde useCampaignMonitor
export interface CockpitHeaderProps {
  // Datos principales
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  lastActivity: string;
  
  // Datos inteligencia departamental
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
  insights?: string[];
  recommendations?: string[];
  participationPrediction?: any;
  
  // Navegación
  onScrollToSection?: (sectionId: string) => void;
  
  // Estados
  isLoading?: boolean;
  error?: string | null;
  lastRefresh: Date;
}

export function CockpitHeader(props: CockpitHeaderProps) {
  const { 
    activeView, 
    handleToggle, 
    isTransitioning,
    getViewInsight,
    canSwitch 
  } = useCockpitView();

  const deviceType = useDeviceType();

  // 🧭 NAVEGACIÓN UNIVERSAL - Click-to-scroll
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
    
    // Usar prop function si está disponible, sino fallback a scrollToSection
    if (props.onScrollToSection) {
      props.onScrollToSection(targetSection);
    } else {
      scrollToSection(targetSection as any);
    }
  };

  // 🔄 SKELETON PREMIUM para estado loading
  if (props.isLoading) {
    return <CockpitSkeleton />;
  }

  // ⚠️ ERROR STATE elegante
  if (props.error) {
    return <CockpitError error={props.error} />;
  }

  return (
    <div className="w-full mb-8">
      {/* 🎯 CONTENEDOR GLASS COCKPIT PREMIUM */}
      <motion.div 
        className="fhr-card neural-glow border border-white/10 backdrop-blur-xl bg-black/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
      >
        {/* 🔮 TOGGLE MÁGICO NIVEL TESLA */}
        <div className="flex justify-center mb-6 p-2">
          <div className="relative bg-black/30 rounded-full p-1 border border-white/20 backdrop-blur-sm">
            {/* Background animado del toggle */}
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
            
            {/* Botones del toggle */}
            <div className="relative flex">
              <ToggleButton
                active={activeView === 'predictive'}
                onClick={() => canSwitch && handleToggle('predictive')}
                icon={Brain}
                label="Predictiva"
                subtitle="¿Llegaremos?"
                disabled={isTransitioning}
                deviceType={deviceType}
              />
              <ToggleButton
                active={activeView === 'dynamic'}
                onClick={() => canSwitch && handleToggle('dynamic')}
                icon={Zap}
                label="Dinámica"
                subtitle="¿Dónde actuar?"
                disabled={isTransitioning}
                deviceType={deviceType}
              />
            </div>
          </div>
        </div>

        {/* 💫 INSIGHT CONTEXTUAL FLOTANTE */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-cyan-400 font-medium">
            {getViewInsight()}
          </p>
        </motion.div>

        {/* 🎭 ÁREA DE VISTAS INTERCAMBIABLES RESPONSIVE */}
        <div className={`relative ${
          deviceType === 'mobile' ? 'min-h-[240px] p-4' : 'min-h-[280px] p-6'
        }`}>
          <AnimatePresence mode="wait">
            {activeView === 'predictive' ? (
              <PredictiveView 
                key="predictive" 
                {...props}
                onNavigate={handleNavigation}
                isTransitioning={isTransitioning}
              />
            ) : (
              <DynamicView 
                key="dynamic" 
                {...props}
                onNavigate={handleNavigation}
                isTransitioning={isTransitioning}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// 🎨 COMPONENTE TOGGLE BUTTON PREMIUM RESPONSIVE
interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  subtitle: string;
  disabled: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

function ToggleButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  subtitle, 
  disabled,
  deviceType
}: ToggleButtonProps) {
  const isMobile = deviceType === 'mobile';
  
  return (
    <motion.button
      className={`
        relative rounded-full transition-all duration-300 
        ${isMobile ? 'px-4 py-2 min-w-[100px]' : 'px-6 py-3 min-w-[140px]'}
        ${active 
          ? 'text-white' 
          : 'text-white/60 hover:text-white/80'
        }
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled && !isMobile ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex flex-col items-center gap-1">
        <Icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${
          active ? 'text-cyan-400' : 'text-white/60'
        }`} />
        <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>
          {label}
        </span>
        {!isMobile && (
          <span className="text-xs opacity-60">{subtitle}</span>
        )}
      </div>
      
      {/* Efecto de activación */}
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full bg-white/5 border border-white/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
}

// 🔄 SKELETON PREMIUM
function CockpitSkeleton() {
  return (
    <div className="w-full mb-8">
      <div className="fhr-card bg-black/20 border border-white/10 animate-pulse">
        {/* Toggle skeleton */}
        <div className="flex justify-center mb-6 p-2">
          <div className="bg-white/5 rounded-full h-16 w-80"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/5 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="bg-white/5 rounded-lg h-12 mt-6"></div>
        </div>
      </div>
    </div>
  );
}

// ⚠️ ERROR STATE ELEGANTE
interface CockpitErrorProps {
  error: string;
}

function CockpitError({ error }: CockpitErrorProps) {
  return (
    <div className="w-full mb-8">
      <motion.div 
        className="fhr-card bg-red-500/10 border border-red-500/30"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 text-center">
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Zap className="h-6 w-6 text-red-400" />
          </motion.div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Error en Torre de Control
          </h3>
          <p className="text-sm text-white/80 mb-4">
            {error}
          </p>
          <motion.button
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}