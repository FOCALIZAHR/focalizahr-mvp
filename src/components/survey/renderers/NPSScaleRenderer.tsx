// src/components/survey/renderers/NPSScaleRenderer.tsx
'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { scaleIn } from '../constants/animations';
import type { SurveyResponse } from '@/hooks/useSurveyEngine';

interface NPSScaleRendererProps {
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}

/**
 * NPSScaleRenderer v3.0 - Net Promoter Score Premium
 * 
 * FILOSOFÍA ALINEADA AL SURVEY:
 * - Minimalismo extremo
 * - Slate (gris) para neutral/pasivo
 * - Cyan-Purple SOLO para promotor (colores corporativos)
 * - Font-light, espacios generosos
 * - Sin saturación de colores
 * 
 * Clasificación NPS:
 * - Detractores: 0-6 (Rojo desaturado)
 * - Pasivos: 7-8 (Slate - neutral)
 * - Promotores: 9-10 (Cyan-Purple gradient)
 */
export const NPSScaleRenderer: React.FC<NPSScaleRendererProps> = ({ 
  response, 
  updateResponse 
}) => {
  // Clasificación NPS - ALINEADA A FILOSOFÍA SURVEY
  const getNPSClassification = useMemo(() => {
    if (response?.rating === undefined || response?.rating === null) {
      return null;
    }

    const rating = response.rating;

    if (rating <= 6) {
      // Detractor - Rojo muy desaturado (minimalista)
      return {
        label: 'Poco Probable',
        range: '0-6',
        trackColor: '#EF4444',
        trackGradient: 'linear-gradient(90deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.3))',
        glowColor: 'rgba(239, 68, 68, 0.15)',
        gradient: 'from-red-400 to-red-500',
        icon: TrendingDown,
        description: 'Necesitamos mejorar tu experiencia'
      };
    } else if (rating <= 8) {
      // Pasivo - SLATE (neutral, sin color) ← FILOSOFÍA SURVEY
      return {
        label: 'Neutral',
        range: '7-8',
        trackColor: '#64748B',
        trackGradient: 'linear-gradient(90deg, rgba(100, 116, 139, 0.4), rgba(71, 85, 105, 0.3))',
        glowColor: 'rgba(100, 116, 139, 0.15)',
        gradient: 'from-slate-400 to-slate-500',
        icon: Minus,
        description: 'Tu opinión nos ayuda a seguir mejorando'
      };
    } else {
      // Promotor - CYAN → PURPLE (colores corporativos) ← FILOSOFÍA SURVEY
      return {
        label: 'Muy Probable',
        range: '9-10',
        trackColor: '#22D3EE',
        trackGradient: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
        glowColor: 'rgba(34, 211, 238, 0.2)',
        gradient: 'from-cyan-400 to-purple-400',
        icon: TrendingUp,
        description: '¡Gracias! Tu recomendación nos motiva'
      };
    }
  }, [response?.rating]);

  return (
    <motion.div 
      variants={scaleIn} 
      initial="initial" 
      animate="animate" 
      className="space-y-6"
    >
      {/* Feedback inline ARRIBA - Sutil pero visible */}
      <AnimatePresence>
        {getNPSClassification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm border"
              style={{
                background: `${getNPSClassification.trackColor}08`,
                borderColor: `${getNPSClassification.trackColor}20`
              }}
            >
              <getNPSClassification.icon 
                className="w-4 h-4"
                style={{ color: getNPSClassification.trackColor }}
              />
              <span 
                className="text-sm font-light"
                style={{ color: getNPSClassification.trackColor }}
              >
                {getNPSClassification.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slider NPS - Compacto y funcional */}
      <div className="space-y-3">
        <div className="relative max-w-3xl mx-auto px-6">
          
          {/* Números - TODOS visibles con jerarquía clara */}
          <div className="flex justify-between mb-4 px-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isSelected = response?.rating === num;
              
              return (
                <span 
                  key={num}
                  className={`
                    transition-all duration-300 tabular-nums
                    ${isSelected 
                      ? 'text-2xl font-medium text-[#A78BFA]' 
                      : 'text-sm font-light text-slate-500'
                    }
                  `}
                >
                  {num}
                </span>
              );
            })}
          </div>

          {/* Container barra con glassmorphism sutil */}
          <div className="relative rounded-xl bg-slate-900/20 backdrop-blur-sm border border-white/5 p-4">
            
            {/* Slider refinado */}
            <Slider
              min={0}
              max={10}
              step={1}
              value={response?.rating ?? 0}
              onChange={(value) => updateResponse({ rating: value as number })}
              railStyle={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(51, 65, 85, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
              trackStyle={{
                height: 6,
                borderRadius: 3,
                background: getNPSClassification 
                  ? getNPSClassification.trackGradient
                  : 'linear-gradient(90deg, #22D3EE, #A78BFA)',
                boxShadow: getNPSClassification
                  ? `0 0 12px ${getNPSClassification.glowColor}`
                  : '0 0 12px rgba(34, 211, 238, 0.2)',
                transition: 'all 0.4s ease'
              }}
              handleStyle={{
                width: 20,
                height: 20,
                marginTop: -7,
                background: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(167, 139, 250, 0.15)',
                opacity: 1,
                cursor: 'pointer'
              }}
              dotStyle={{
                display: 'none'
              }}
            />
          </div>

          {/* Labels PEGADOS a la barra */}
          <div className="flex justify-between text-[10px] text-slate-600 font-light mt-2 px-2 uppercase tracking-wider">
            <span>Definitivamente no</span>
            <span className="opacity-60">Neutral</span>
            <span>Definitivamente sí</span>
          </div>
        </div>
      </div>

      {/* Hint inicial - Diseño minimalista */}
      {!getNPSClassification && (
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-sm bg-white/[0.02] border border-white/5">
            <div className="relative">
              <div className="absolute inset-0 w-2 h-2 bg-[#22D3EE] rounded-full blur-sm animate-pulse" />
              <div className="relative w-2 h-2 bg-[#22D3EE] rounded-full" />
            </div>
            <span className="text-xs text-slate-400 font-light">
              Desliza o toca para seleccionar un valor de 0 a 10
            </span>
          </div>
          
          {/* Línea decorativa */}
          <div className="flex items-center justify-center gap-2 opacity-30">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/20" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          
          <p className="text-[10px] text-slate-600 font-light uppercase tracking-wider">
            Tu respuesta es completamente confidencial
          </p>
        </div>
      )}
    </motion.div>
  );
};