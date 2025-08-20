// ====================================================================
// COCKPIT HEADER - ORQUESTADOR 100% TONTO (SIN ROMPER INTERFACE)
// src/components/monitor/CockpitHeader.tsx
// RESPONSABILIDAD: SOLO orquestar vistas - MANTIENE INTERFACE ORIGINAL
// ====================================================================

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';
import { useState, useCallback } from 'react';
import { PredictiveView } from './cockpit/PredictiveView';
import { DynamicView } from './cockpit/DynamicView';

// 🎯 INTERFACE ORIGINAL - SIN ESTADOS TOGGLE EXTERNOS
interface CockpitHeaderProps {
  // Datos base (como siempre)
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  // Arrays de inteligencia (como siempre)
  topMovers: Array<{
    name: string;
    momentum: number;
    trend: string;
  }>;
  negativeAnomalies: Array<{
    department: string;
    rate: number;
    severity: string;
    zScore?: number;
  }>;
  
  // Objetos complejos (como siempre)
  participationPrediction?: any;
  crossStudyComparison?: any;
  insights: string[];
  recommendations: string[];
  cockpitIntelligence?: any;
  
  // Handlers y estados (como siempre)
  onNavigate?: (section: string) => void;
  isLoading: boolean;
  error?: string | null;
  lastRefresh: Date;
}

// 🎯 ORQUESTADOR 100% TONTO - CON ESTADO TOGGLE INTERNO
export function CockpitHeader({
  // Todos los datos (como siempre llegaban)
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
  onNavigate,
  isLoading,
  error,
  lastRefresh
}: CockpitHeaderProps) {

  // ✅ ESTADO TOGGLE INTERNO (COMO ANTES)
  const [activeView, setActiveView] = useState<'predictive' | 'dynamic'>('predictive');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ✅ HANDLER TOGGLE INTERNO (COMO ANTES)
  const handleToggle = useCallback((newView: 'predictive' | 'dynamic') => {
    if (isTransitioning || activeView === newView) return;

    setIsTransitioning(true);
    setActiveView(newView);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200);
  }, [activeView, isTransitioning]);

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="fhr-card text-center py-8">
        <div className="text-red-400 mb-2">⚠️ Error en datos</div>
        <div className="text-white/60 text-sm">{error}</div>
      </div>
    );
  }

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className="fhr-card text-center py-8">
        <div className="text-cyan-400 mb-2">🔄 Cargando inteligencia...</div>
        <div className="text-white/60 text-sm">Procesando datos en tiempo real</div>
      </div>
    );
  }

  // ✅ PREPARAR PROPS PARA VISTAS (SIN CALCULAR - SOLO AGRUPAR)
  const sharedProps = {
    participationRate,
    daysRemaining,
    totalInvited,
    totalResponded,
    topMovers,
    negativeAnomalies,
    cockpitIntelligence,
    onNavigate,
    isLoading: false
  };

  const predictiveProps = {
    ...sharedProps,
    participationPrediction,
    crossStudyComparison,
    insights,
    recommendations
  };

  const dynamicProps = {
    ...sharedProps
  };

  return (
    <div className="w-full mb-8">
      
      {/* 🎛️ TOGGLE SIMPLE */}
      <div className="flex justify-center mb-8">
        <div className="fhr-bimodal-toggle">
          
          {/* Background animado */}
          <motion.div
            className="fhr-bimodal-toggle-indicator"
            animate={{ x: activeView === 'predictive' ? 0 : '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          {/* Botones */}
          <div className="relative flex">
            <button
              onClick={() => handleToggle('predictive')}
              disabled={isTransitioning}
              className={`fhr-btn-toggle ${activeView === 'predictive' ? 'active' : ''}`}
            >
              <Brain className="w-4 h-4" />
              <div>
                <div className="font-semibold">Predictiva</div>
                <div className="text-xs opacity-80">¿Llegaremos?</div>
              </div>
            </button>
            
            <button
              onClick={() => handleToggle('dynamic')}
              disabled={isTransitioning}
              className={`fhr-btn-toggle ${activeView === 'dynamic' ? 'active' : ''}`}
            >
              <Zap className="w-4 h-4" />
              <div>
                <div className="font-semibold">Dinámica</div>
                <div className="text-xs opacity-80">¿Dónde actuar?</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 🧠 VISTAS - ORQUESTACIÓN CON PROPS ORIGINALES */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          className="fhr-view-transition"
          initial={{ opacity: 0, x: activeView === 'predictive' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeView === 'predictive' ? 20 : -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'predictive' ? (
            <PredictiveView {...predictiveProps} />
          ) : (
            <DynamicView {...dynamicProps} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 🎯 STATUS SIMPLE */}
      <div className="flex justify-center mt-6">
        <div className="fhr-status-indicator">
          <div className={`fhr-status-dot ${activeView}`}></div>
          <span>
            {activeView === 'predictive' 
              ? 'Vista Estratégica - Análisis Predictivo' 
              : 'Vista Táctica - Tiempo Real'
            }
          </span>
          {isTransitioning && (
            <div className="fhr-loading-dots">
              <div></div><div></div><div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}