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
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="space-y-3">
                <div className="w-3 h-3 bg-cyan-500/30 rounded-full"></div>
                <div className="h-4 bg-white/10 rounded fhr-skeleton"></div>
                <div className="h-8 bg-white/10 rounded fhr-skeleton"></div>
                <div className="h-3 bg-white/10 rounded w-3/4 fhr-skeleton"></div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Panel inferior skeleton */}
        <motion.div 
          className="mt-8 bg-black/40 rounded-lg p-4 border border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-3 bg-white/10 rounded w-2/3 mx-auto fhr-skeleton"></div>
                <div className="h-5 bg-white/10 rounded w-1/2 mx-auto fhr-skeleton"></div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// 🎯 ERROR STATE ENHANCED
function CockpitError({ error }: { error: string }) {
  return (
    <div className="w-full mb-8 flex justify-center">
      <motion.div 
        className="glass-enhanced border border-red-500/30 backdrop-blur-xl bg-red-500/5 rounded-xl p-8 max-w-md text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon de error */}
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"
          animate={{ 
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.3)',
              '0 0 0 10px rgba(239, 68, 68, 0.1)',
              '0 0 0 0 rgba(239, 68, 68, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-red-400 mb-2">
          Error en Cockpit Intelligence
        </h3>
        
        <p className="text-white/70 mb-6 text-sm leading-relaxed">
          Error: {error}
        </p>
        
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

  // 🎯 PROPS PARA LAS VISTAS - ARQUITECTURA CORRECTA
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
    
    // Cockpit Intelligence PRE-CALCULADA
    cockpitIntelligence: intelligence,
    
    // Handlers
    onNavigate: handleNavigation,
    
    // Estados
    isLoading: props.isLoading || false,
    lastRefresh: props.lastRefresh
  };

  // Mostrar error si existe
  if (props.error) {
    return <CockpitError error={props.error} />;
  }

  return (
    <TouchOptimization deviceType={deviceType}>
      <motion.div 
        className="w-full mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* 🔥 CONTENEDOR PRINCIPAL TESLA-GRADE */}
        <div className="border border-white/10 backdrop-blur-xl bg-black/20 rounded-xl p-8 glass-enhanced">
          
          {/* 🎛️ TOGGLE BIMODAL - ESTRUCTURA EXACTA GUÍA */}
          <div className="flex justify-center mb-6 p-2">
            <motion.div 
              className="relative bg-black/30 rounded-full p-1 border border-white/20 backdrop-blur-sm"
              layout
            >
              {/* Background animado del toggle - EXACTO GUÍA */}
              <motion.div
                className="absolute top-1 w-1/2 h-[calc(100%-8px)] bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full backdrop-blur-sm border border-white/10"
                animate={{
                  x: activeView === 'predictive' ? 0 : '100%'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              {/* Botones del toggle - TEXTO EXACTO GUÍA */}
              <div className="relative flex">
                <ToggleButton
                  active={activeView === 'predictive'}
                  onClick={() => handleToggle('predictive')}
                  icon={Brain}
                  label="Predictiva"
                  subtitle="¿Llegaremos?"
                  disabled={!canSwitch || isTransitioning}
                />
                <ToggleButton
                  active={activeView === 'dynamic'}
                  onClick={() => handleToggle('dynamic')}
                  icon={Zap}
                  label="Dinámica"
                  subtitle="¿Dónde actuar?"
                  disabled={!canSwitch || isTransitioning}
                />
              </div>
            </motion.div>
          </div>

          {/* 🎯 SISTEMA VISTAS BIMODALES */}
          <AnimatePresence mode="wait" key={activeView}>
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: activeView === 'predictive' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeView === 'predictive' ? 20 : -20 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut",
                opacity: { duration: 0.2 }
              }}
            >
              {activeView === 'predictive' ? (
                <PredictiveView {...viewProps} />
              ) : (
                <DynamicView {...viewProps} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 📊 PANEL CONTEXTO INFERIOR - ESTRUCTURA EXACTA GUÍA */}
          <motion.div 
            className="mt-8 bg-black/40 backdrop-blur-lg rounded-lg p-4 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-white/60">Análisis Temporal</div>
                <div className="text-lg font-semibold text-cyan-400">
                  Velocidad actual: 0.3 resp/día
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60">Momentum Org.</div>
                <div className="text-lg font-semibold text-purple-400">
                  Promedio: +100 (Desacelerando)
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60">Siguiente Acción</div>
                <div className="text-lg font-semibold text-green-400">
                  Intervención requerida
                </div>
              </div>
            </div>
            
            {/* Footer - EXACTO GUÍA */}
            <div className="text-center mt-4 text-xs text-white/40">
              Última actualización: {props.lastRefresh?.toLocaleTimeString() || '8:59:07 p. m.'} • Algoritmo predictivo v4.0
            </div>
          </motion.div>
        </div>
      </motion.div>
    </TouchOptimization>
  );
}