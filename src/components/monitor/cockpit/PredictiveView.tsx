// ====================================================================
// PREDICTIVE VIEW - COMPONENTE 100% TONTO FINAL
// src/components/monitor/cockpit/PredictiveView.tsx
// RESPONSABILIDAD: Solo presentación de datos pre-calculados del hook
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, ArrowRight } from 'lucide-react';

interface PredictiveViewProps {
  participationRate: number;
  daysRemaining: number;
  totalInvited: number;
  totalResponded: number;
  
  cockpitIntelligence?: {
    vectorMomentum: string;
    projection: {
      finalProjection: number;
      confidence: number;
      methodology: string;
    };
    action: {
      primary: string;
      reasoning: string;
      urgency: string;
      urgencyColor: string;
    };
  };
  
  participationPrediction?: {
    velocity: number;
    finalProjection: number;
    confidence: number;
  };
  
  onNavigate?: (section: string) => void;
  isLoading: boolean;
}

export function PredictiveView({ 
  participationRate, 
  daysRemaining, 
  totalInvited, 
  totalResponded,
  cockpitIntelligence,
  participationPrediction,
  onNavigate,
  isLoading 
}: PredictiveViewProps) {
  
  if (isLoading) {
    return <div className="w-full animate-pulse fhr-card h-32"></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: SITUACIÓN ACTUAL */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Situación Actual</h3>
            <Target className="h-5 w-5 text-fhr-cyan" />
          </div>
          <div className="fhr-title-gradient text-3xl font-bold mb-2">
            {participationRate.toFixed(0)}%
          </div>
          <div className="text-sm text-white/70 mb-1">
            {totalResponded}/{totalInvited} respuestas
          </div>
          <div className="text-sm text-white/60">
            Ritmo: {participationPrediction?.velocity?.toFixed(1) || '0.0'} resp/día
          </div>
        </div>

        {/* CARD 2: DIAGNÓSTICO IA */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Diagnóstico IA</h3>
            <Zap className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mb-2">
            {cockpitIntelligence?.action?.primary || 'Analizando...'}
          </div>
          <div className="text-sm text-white/70 mb-1">
            {cockpitIntelligence?.vectorMomentum || 'Calculando momentum...'}
          </div>
          <div className="text-sm text-white/60">
            {cockpitIntelligence?.projection?.methodology || 'Datos insuficientes'}
          </div>
        </div>

        {/* CARD 3: PROYECCIÓN */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Proyección</h3>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {cockpitIntelligence?.projection?.finalProjection?.toFixed(0) || 
             participationPrediction?.finalProjection?.toFixed(0) || 
             participationRate.toFixed(0)}%
          </div>
          <div className="text-sm text-white/70 mb-1">
            Confianza: {cockpitIntelligence?.projection?.confidence?.toFixed(0) || 
                       participationPrediction?.confidence?.toFixed(0) || '0'}%
          </div>
          <div className="text-sm text-white/60">
            {daysRemaining} días restantes
          </div>
        </div>

        {/* CARD 4: ACCIÓN */}
        <div className="fhr-card-metric p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="fhr-subtitle">Acción Recomendada</h3>
            <ArrowRight className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-lg font-bold text-white mb-2">
            {cockpitIntelligence?.action?.primary || 'Mantener monitoreo'}
          </div>
          <div className="text-sm text-white/70 mb-1">
            {cockpitIntelligence?.action?.reasoning || 'Continuar seguimiento regular'}
          </div>
          <div className={`text-sm ${cockpitIntelligence?.action?.urgencyColor || 'text-cyan-400'}`}>
            Urgencia: {cockpitIntelligence?.action?.urgency || 'media'}
          </div>
          
          {onNavigate && (
            <button
              onClick={() => onNavigate('department-participation')}
              className="fhr-btn-secondary w-full mt-3 text-sm"
            >
              Ver Detalles
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}