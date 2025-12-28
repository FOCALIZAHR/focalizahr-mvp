// src/components/exit/OpportunityTimeline.tsx
// 🎯 Timeline de Oportunidad - INDICIOS → Denuncia → Tutela → ESCÁNDALO

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface OpportunityTimelineProps {
  /** Índice del stage actual (0-based) */
  currentStage: number;
  /** Array de nombres de stages */
  stages: string[];
  /** Mensaje principal de oportunidad */
  message: string;
  /** Call to action */
  callToAction?: string;
}

export default memo(function OpportunityTimeline({
  currentStage,
  stages,
  message,
  callToAction
}: OpportunityTimelineProps) {
  
  return (
    <div className="space-y-6">
      
      {/* Mensaje principal */}
      <p className="text-slate-300 text-center leading-relaxed">
        {message}
      </p>

      {/* Timeline visual */}
      <div className="relative">
        {/* Línea de fondo */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700/50 -translate-y-1/2" />
        
        {/* Stages */}
        <div className="relative flex items-center justify-between gap-2 overflow-x-auto py-4 px-2">
          {stages.map((stage, index) => {
            const isCurrent = index === currentStage;
            const isPast = index < currentStage;
            const isFuture = index > currentStage;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative flex-shrink-0 px-4 py-2.5 rounded-xl text-xs md:text-sm text-center 
                  transition-all duration-300 min-w-[90px]
                  ${isCurrent 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                    : isPast
                      ? 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20'
                      : 'bg-slate-800/50 text-slate-500 border border-slate-700/30'
                  }
                `}
              >
                {/* Indicador de posición actual */}
                {isCurrent && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                {/* Icono de peligro para el último stage */}
                {index === stages.length - 1 && (
                  <span className="mr-1">⚠️</span>
                )}
                
                {stage}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Indicador "Ustedes están AQUÍ" */}
      <motion.p 
        className="text-center text-cyan-400 text-sm font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ↑ Ustedes están AQUÍ
      </motion.p>

      {/* Call to Action */}
      {callToAction && (
        <div className="pt-4 border-t border-slate-700/30">
          <p className="text-slate-400 text-sm text-center italic">
            {callToAction}
          </p>
        </div>
      )}
    </div>
  );
});