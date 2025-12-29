// src/components/exit/OpportunityTimeline.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 OPPORTUNITY TIMELINE - ORQUESTADOR
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Arquitectura limpia:
// - OpportunityToggle: Cambia entre modos
// - OpportunityAlertPanel: Modo "Tu Alerta" (datos del motor)
// - OpportunityAutopsia: Modo "Autopsia Real" (emblamaticCases.ts)
//
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import type { EmblamaticCase } from '@/types/ExitBusinessCase';

// Componentes separados
import OpportunityToggle, { type OpportunityMode } from './OpportunityToggle';
import OpportunityAlertPanel from './OpportunityAlertPanel';
import OpportunityAutopsia from './OpportunityAutopsia';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface OpportunityTimelineProps {
  companyName: string;
  currentStage: number;
  stages: string[];
  message: string;
  callToAction?: string;
  autopsiaCase?: EmblamaticCase;
  statistic?: {
    value: string;
    description: string;
    source: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ESTADÍSTICA
// ═══════════════════════════════════════════════════════════════════════════════

const Statistic = memo(function Statistic({
  statistic,
  mode
}: {
  statistic: { value: string; description: string; source: string };
  mode: OpportunityMode;
}) {
  const accentColor = mode === 'alerta' ? '#22D3EE' : '#A78BFA';
  
  return (
    <div className="mt-6 text-center">
      {/* Divider */}
      <div 
        className="h-px w-24 mx-auto mb-4"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` 
        }}
      />
      
      {/* Número */}
      <motion.p 
        className="text-5xl font-light mb-2"
        style={{ color: accentColor }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {statistic.value}
      </motion.p>
      
      {/* Descripción */}
      <p className="text-sm text-slate-300 mb-1">
        {statistic.description}
      </p>
      
      {/* Fuente */}
      <p className="text-xs text-slate-500">
        — {statistic.source}
      </p>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function OpportunityTimeline({
  companyName,
  currentStage,
  stages,
  message,
  callToAction,
  autopsiaCase,
  statistic
}: OpportunityTimelineProps) {
  
  const [mode, setMode] = useState<OpportunityMode>('alerta');
  
  // Estadística por defecto si no viene del motor
  const displayStatistic = statistic || {
    value: '60%',
    description: 'de empresas en crisis de reputación NUNCA se recuperan',
    source: 'Deloitte 2023'
  };
  
  // Si no hay caso de autopsia, deshabilitar el toggle
  const hasAutopsia = !!autopsiaCase?.autopsia;
  
  return (
    <div className="space-y-2">
      {/* Toggle */}
      <OpportunityToggle
        mode={mode}
        onModeChange={setMode}
        disabled={!hasAutopsia && mode === 'alerta'}
      />
      
      {/* Contenido según modo */}
      <AnimatePresence mode="wait">
        {mode === 'alerta' ? (
          <motion.div
            key="alerta"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <OpportunityAlertPanel
              currentStage={currentStage}
              message={message}
              callToAction={callToAction}
            />
          </motion.div>
        ) : autopsiaCase ? (
          <motion.div
            key="autopsia"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <OpportunityAutopsia
              autopsiaCase={autopsiaCase}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      {/* Estadística */}
      <Statistic 
        statistic={displayStatistic} 
        mode={mode} 
      />
    </div>
  );
});