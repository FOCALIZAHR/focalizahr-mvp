// ====================================================================
// FOCALIZAHR COCKPIT HEADER - OBRA MAESTRA UX COMPLETADA
// src/components/monitor/CockpitHeader.tsx
// RESPONSABILIDAD: Orquestador bimodal con experiencia premium
// ====================================================================

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useCockpitView } from '@/hooks/useCockpitView';
import { PredictiveView } from './cockpit/PredictiveView';
import { DynamicView } from './cockpit/DynamicView';
import { useDeviceType, getDeviceAnimationConfig, TouchOptimization } from './cockpit/ResponsiveEnhancements';
import { scrollToSection } from '@/lib/utils/scrollToSection';
import { Brain, Zap, Loader2, AlertTriangle } from 'lucide-react';
import '@/styles/focalizahr-design-system.css';
import '@/styles/cockpit-polish.css';

// 🎯 INTERFACE PROPS - DATOS PRE-CALCULADOS DEL HOOK
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
  
  // 🧠 COCKPIT INTELLIGENCE - DATOS PRE-CALCULADOS
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
  
  // ✅ HANDLERS
  onScrollToSection?: (sectionId: string) => void;
  
  // ✅ ESTADOS
  isLoading?: boolean;
  error?: string | null;
  lastRefresh: Date;
}

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
        relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[140px]
        toggle-button-enhanced ${active ? 'active' : ''}
        ${active 
          ? 'text-white bg-transparent' 
          : 'text-white/60 bg-transparent hover:text-white/80'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-center space-x-2">
        <Icon className="w-4 h-4" />
        <div className="text-left">
          <div className="font-semibold">{label}</div>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>
      </div>
      
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-500/50 neural-glow-subtle"
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
        className="border border-white/10 backdrop-blur-xl bg-black/20 rounded-xl p-8 glass-enhanced"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Toggle skeleton */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            <div className="h-12 w-36 bg-white/10 rounded-full fhr-skeleton"></div>
            <div className="h-12 w-36 bg-white/10 rounded-full fhr-skeleton"></div>
          </div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="loading-card border border-white/10 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-20 bg-white/10 rounded fhr-skeleton"></div>
                <div className="h-4 w-4 bg-white/10 rounded fhr-skeleton"></div>
              </div>
              <div className="h-8 w-16 bg-white/10 rounded mb-2 fhr-skeleton"></div>
              <div className="h-3 w-3/4 bg-white/10 rounded fhr-skeleton"></div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 COMPONENTE ERROR MEJORADO
function CockpitError({ error }: { error: string }) {
  return (
    <div className="w-full mb-8">
      <motion.div 
        className="border border-red-500/30 backdrop-blur-xl bg-red-500/10 rounded-xl p-8 glass-enhanced"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="text-center">
          <motion.div 
            className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-3">Error en Torre de Control</h3>
          <p className="text-white/80 mb-6 max-w-md mx-auto leading-relaxed">{error}</p>
          
          {/* Acciones sugeridas */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="fhr-btn-primary px-6 py-2 text-sm"
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => console.log('Reporting error:', error)}
              className="fhr-btn-secondary px-6 py-2 text-sm"
            >
              📝 Reportar Problema
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 🎯 COMPONENTE PRINCIPAL - EXPERIENCIA PREMIUM COMPLETADA
export function CockpitHeader(props: CockpitHeaderProps) {
  // ✅ RECIBIR DATOS PRE-CALCULADOS - NO RECALCULAR
  const intelligence = props.cockpitIntelligence;

  // Si la inteligencia no ha llegado, muestra loading
  if (!intelligence) {
    return <CockpitSkeleton />;
  }
  
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
      'analytics': 'insights',
      'actions': 'actions',
      'current': 'overview',
      'live': 'live-data',
      'patterns': 'patterns',
      'anomalies': 'anomalies',
      'topmovers': 'topmovers'
    };
    
    const targetSection = sectionMap[section] || section;
    props.onScrollToSection?.(targetSection);
  };

  // 🎯 ESTADOS ESPECIALES
  if (props.isLoading) {
    return <CockpitSkeleton />;
  }

  if (props.error) {
    return <CockpitError error={props.error} />;
  }

  return (
    <div className="w-full mb-8">
      <motion.div 
        className="border border-white/10 backdrop-blur-xl bg-black/20 rounded-xl p-8 glass-enhanced"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        
        {/* 🎛️ TOGGLE BIMODAL PREMIUM */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4 p-2 bg-black/20 rounded-full backdrop-blur-sm border border-white/10">
            <ToggleButton
              active={activeView === 'predictive'}
              onClick={() => handleToggle('predictive')}
              icon={Brain}
              label="Predictiva"
              subtitle="Futuro"
              disabled={isTransitioning}
            />
            <ToggleButton
              active={activeView === 'dynamic'}
              onClick={() => handleToggle('dynamic')}
              icon={Zap}
              label="Dinámica"
              subtitle="Presente"
              disabled={isTransitioning}
            />
          </div>
        </div>

        {/* 🎯 VISTAS BIMODALES CON TRANSICIONES PERFECTAS */}
        <TouchOptimization isActive={deviceType === 'mobile'}>
          <AnimatePresence mode="wait" initial={false}>
            {activeView === 'predictive' ? (
              <motion.div
                key="predictive"
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.25, 0.1, 0.25, 1],
                  layout: { duration: 0.2 }
                }}
              >
                <PredictiveView
                  participationRate={props.participationRate}
                  daysRemaining={props.daysRemaining}
                  intelligence={intelligence}
                  isTransitioning={isTransitioning}
                  onNavigate={handleNavigation}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dynamic"
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.25, 0.1, 0.25, 1],
                  layout: { duration: 0.2 }
                }}
              >
                <DynamicView
                  topMovers={props.topMovers}
                  negativeAnomalies={props.negativeAnomalies}
                  participationRate={props.participationRate}
                  intelligence={intelligence}
                  isTransitioning={isTransitioning}
                  onNavigate={handleNavigation}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </TouchOptimization>

        {/* 📊 METADATA Y ÚLTIMA ACTUALIZACIÓN */}
        <motion.div
          className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div>
            Torre de Control FocalizaHR • Inteligencia Predictiva
          </div>
          <div>
            Última actualización: {props.lastRefresh.toLocaleTimeString('es-CL')}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}