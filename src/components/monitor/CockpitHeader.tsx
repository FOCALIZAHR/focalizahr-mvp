// ====================================================================
// COCKPIT HEADER BIMODAL - TESLA STYLE DASHBOARD  
// src/components/monitor/CockpitHeader.tsx
// FASE 2.1: Corrección Quirúrgica - Solo navegación + algoritmos
// ====================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Loader2 } from 'lucide-react';
import { TooltipProvider, MomentumTooltip, ProjectionTooltip, ActionTooltip, PatternTooltip } from '../ui/TooltipContext';
import { processCockpitIntelligence } from './cockpit/CockpitAlgorithms';

// 🎯 INTERFACES PRESERVADAS
interface CockpitHeaderProps {
  participationRate: number;
  totalInvited: number; 
  totalResponded: number;
  daysRemaining: number;
  velocity: number;
  participationPrediction: {
    finalProjection: number;
    confidence: number;
  };
  topMovers: Array<{
    name: string;
    momentum: number;
    trend: 'acelerando' | 'estable' | 'desacelerado';
  }>;
  departmentAnomalies: Array<{
    name: string;
    type: 'positive' | 'negative';
    severity: 'low' | 'medium' | 'high';
    value: number;
    zScore?: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'success' | 'warning' | 'error';
    message: string;
  }>;
  onScrollToSection: (sectionId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  lastRefresh: Date;
}

// Hook simple para vista activa
function useCockpitView() {
  const [activeView, setActiveView] = useState<'predictive' | 'dynamic'>('predictive');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggle = (view: 'predictive' | 'dynamic') => {
    if (isTransitioning || activeView === view) return;
    
    setIsTransitioning(true);
    setActiveView(view);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const getViewInsight = () => {
    return activeView === 'predictive' 
      ? "🔮 Predicción inteligente basada en patrones de comportamiento"
      : "⚡ Análisis dinámico para decisiones inmediatas";
  };

  return {
    activeView,
    handleToggle,
    isTransitioning,
    getViewInsight,
    canSwitch: !isTransitioning
  };
}

// Hook simple para device type
function useDeviceType() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

// NUEVO: Hook navegación universal
function useScrollToSection() {
  const scrollToSection = (sectionId: string) => {
    const sectionMap: Record<string, string> = {
      'momentum': 'topmovers',
      'projection': 'rhythm', 
      'action': 'actions',
      'risk': 'anomalies',
      'champion': 'pulse',
      'pattern': 'cross-study'
    };
    
    const targetId = sectionMap[sectionId] || sectionId;
    const element = document.getElementById(targetId);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('scroll-highlight');
      setTimeout(() => element.classList.remove('scroll-highlight'), 2000);
    }
  };
  return { scrollToSection };
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
  const { scrollToSection } = useScrollToSection();
  const intelligence = processCockpitIntelligence(props);

  // 🔄 SKELETON PREMIUM para estado loading
  if (props.isLoading) {
    return <CockpitSkeleton />;
  }

  // ⚠️ ERROR STATE elegante
  if (props.error) {
    return <CockpitError error={props.error} />;
  }

  return (
    <TooltipProvider>
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              {/* Botones del toggle */}
              <div className="relative z-10 flex">
                {(['predictive', 'dynamic'] as const).map((view) => (
                  <motion.button
                    key={view}
                    onClick={() => canSwitch && handleToggle(view)}
                    disabled={!canSwitch}
                    className={`
                      px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 min-w-[140px]
                      ${activeView === view 
                        ? 'text-white bg-transparent' 
                        : 'text-white/60 bg-transparent hover:text-white/80'
                      }
                      ${!canSwitch ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    whileHover={canSwitch ? { scale: 1.05 } : undefined}
                    whileTap={canSwitch ? { scale: 0.95 } : undefined}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {view === 'predictive' ? (
                        <>
                          <Brain className="h-4 w-4" />
                          Predictiva
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Dinámica  
                        </>
                      )}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* 💡 INSIGHTS FLOTANTE */}
          <motion.div 
            className="text-center mb-6 px-6"
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-white/80 text-sm leading-relaxed">
              {getViewInsight()}
            </p>
          </motion.div>

          {/* 🔄 CONTENIDO BIMODAL */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeView === 'predictive' ? (
                <PredictiveView 
                  key="predictive"
                  intelligence={intelligence}
                  onNavigate={scrollToSection}
                  deviceType={deviceType}
                  {...props} 
                />
              ) : (
                <DynamicView 
                  key="dynamic"
                  intelligence={intelligence}
                  onNavigate={scrollToSection}
                  deviceType={deviceType}
                  {...props} 
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}

// 🔮 VISTA PREDICTIVA - AWS STYLE
interface PredictiveViewProps extends CockpitHeaderProps {
  intelligence: any;
  onNavigate: (sectionId: string) => void;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

function PredictiveView({ intelligence, onNavigate, deviceType, ...props }: PredictiveViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Cards con navegación y tooltips */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card Participación con tooltip */}
        <MomentumTooltip momentum={intelligence.momentum.value} trend={intelligence.momentum.trend}>
          <motion.div 
            className="bg-black/20 rounded-lg p-4 border border-cyan-500/30 cursor-pointer hover:bg-black/30 transition-colors"
            onClick={() => onNavigate('momentum')}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-cyan-400 text-sm font-medium mb-2">Participación</h3>
            <p className="text-2xl font-bold text-white">{props.participationRate}%</p>
            <p className="text-xs text-cyan-300 mt-1">Punto de partida</p>
          </motion.div>
        </MomentumTooltip>

        {/* Card Momentum */}
        <motion.div 
          className="bg-black/20 rounded-lg p-4 border border-white/20 cursor-pointer hover:bg-black/30 transition-colors"
          onClick={() => onNavigate('momentum')}
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-white text-sm font-medium mb-2">Momentum</h3>
          <p className="text-2xl font-bold text-white">{intelligence.momentum.value}</p>
          <p className="text-xs text-white/60 mt-1">{intelligence.momentum.trend}</p>
        </motion.div>

        {/* Card Proyección */}
        <ProjectionTooltip projection={intelligence.projection.value} confidence={intelligence.projection.confidence}>
          <motion.div 
            className="bg-black/20 rounded-lg p-4 border border-purple-500/30 cursor-pointer hover:bg-black/30 transition-colors"
            onClick={() => onNavigate('projection')}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-purple-400 text-sm font-medium mb-2">Proyección</h3>
            <p className="text-2xl font-bold text-white">{intelligence.projection.value}%</p>
            <p className="text-xs text-purple-300 mt-1">{intelligence.projection.confidence}% confianza</p>
          </motion.div>
        </ProjectionTooltip>

        {/* Card Acción */}
        <ActionTooltip action={intelligence.action.type} urgency={intelligence.action.urgency}>
          <motion.div 
            className="bg-black/20 rounded-lg p-4 border border-yellow-500/30 cursor-pointer hover:bg-black/30 transition-colors"
            onClick={() => onNavigate('action')}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Acción Recomendada</h3>
            <p className="text-sm font-bold text-white">{intelligence.action.message}</p>
          </motion.div>
        </ActionTooltip>
      </div>

      {/* Panel inferior */}
      <motion.div 
        className="bg-black/10 rounded-lg p-4 border border-white/10 cursor-pointer hover:bg-black/20 transition-colors"
        onClick={() => onNavigate('pattern')}
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-white/80 text-sm font-medium mb-2">Análisis Temporal</h3>
        <p className="text-white">{props.velocity} respuestas/día promedio</p>
        <p className="text-white/60 text-xs mt-2">Siguiente Acción: {intelligence.nextAction}</p>
      </motion.div>
    </motion.div>
  );
}

// ⚡ VISTA DINÁMICA - GLASS COCKPIT STYLE
interface DynamicViewProps extends CockpitHeaderProps {
  intelligence: any;
  onNavigate: (sectionId: string) => void;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

function DynamicView({ intelligence, onNavigate, deviceType, topMovers, departmentAnomalies, ...props }: DynamicViewProps) {
  const champion = topMovers?.[0];
  const riskDepartment = departmentAnomalies?.find(dept => dept.severity === 'high');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Panel principal con 3 secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Campeón del Momentum */}
        <motion.div 
          className="bg-black/20 rounded-lg p-6 border border-green-500/30 cursor-pointer hover:bg-black/30 transition-colors"
          onClick={() => onNavigate('champion')}
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-green-400 text-sm font-medium mb-3">🏆 Campeón del Momentum</h3>
          {champion ? (
            <div>
              <p className="text-xl font-bold text-white mb-1">{champion.name}</p>
              <p className="text-green-300 text-sm">+{champion.momentum} momentum</p>
              <p className="text-xs text-white/60 mt-2">Mantener y replicar</p>
            </div>
          ) : (
            <p className="text-white/60 text-sm">Calculando campeón...</p>
          )}
        </motion.div>

        {/* Foco de Riesgo */}
        <motion.div 
          className="bg-black/20 rounded-lg p-6 border border-red-500/30 cursor-pointer hover:bg-black/30 transition-colors"
          onClick={() => onNavigate('risk')}
          whileHover={{ scale: 1.02 }}
        >
          <h3 className="text-red-400 text-sm font-medium mb-3">⚠️ Foco de Riesgo</h3>
          {riskDepartment ? (
            <div>
              <p className="text-xl font-bold text-white mb-1">{riskDepartment.name}</p>
              <p className="text-red-300 text-sm">{riskDepartment.value}% participación</p>
              {riskDepartment.zScore && (
                <p className="text-xs text-white/60 mt-2">Z-Score: {riskDepartment.zScore}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-white mb-1">Todo bajo control</p>
              <p className="text-green-300 text-sm">Sin riesgos detectados</p>
            </div>
          )}
        </motion.div>

        {/* Patrón Dominante */}
        <PatternTooltip pattern={intelligence.pattern.dominantPattern}>
          <motion.div 
            className="bg-black/20 rounded-lg p-6 border border-blue-500/30 cursor-pointer hover:bg-black/30 transition-colors"
            onClick={() => onNavigate('pattern')}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-blue-400 text-sm font-medium mb-3">📊 Patrón Dominante</h3>
            <p className="text-xl font-bold text-white mb-1">Tendencia Organizacional</p>
            <p className="text-blue-300 text-sm">{intelligence.pattern.dominantPattern}</p>
          </motion.div>
        </PatternTooltip>
      </div>

      {/* Footer informativo */}
      <div className="bg-black/10 rounded-lg p-4 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
          <div>
            <h4 className="text-white font-medium mb-2">Recomendaciones Tácticas</h4>
            <p>Generando recomendaciones basadas en análisis departamental...</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Próximas Acciones</h4>
            <ul className="space-y-1">
              <li>• Mantener estrategia exitosa en {champion?.name || 'top performers'}</li>
              <li>• Monitoreo preventivo continuo</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
          <span className="text-xs text-white/60">
            Análisis táctico actualizado: {props.lastRefresh.toLocaleTimeString()} • Vista dinámica v4.0 • {topMovers?.length || 0} departamentos monitoreados
          </span>
        </div>
      </div>
    </motion.div>
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