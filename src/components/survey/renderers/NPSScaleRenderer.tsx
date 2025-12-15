// src/components/survey/renderers/NPSScaleRenderer.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../constants/animations';
import type { SurveyResponse } from '@/hooks/useSurveyEngine';

interface NPSScaleRendererProps {
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}

/**
 * NPSScaleRenderer - Net Promoter Score (0-10)
 * 
 * Implementa la metodología oficial NPS/eNPS:
 * - Detractores: 0-6 (Rojo)
 * - Pasivos: 7-8 (Amarillo)
 * - Promotores: 9-10 (Verde)
 * 
 * Uso típico: eNPS, Customer NPS, Product NPS
 */
export const NPSScaleRenderer: React.FC<NPSScaleRendererProps> = ({ 
  response, 
  updateResponse 
}) => {
  // Escala NPS: 0 a 10 (11 valores)
  const npsValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Labels contextuales para valores clave (eNPS específico)
  const contextualLabels: { [key: number]: string } = {
    0: 'Definitivamente no',
    5: 'Probablemente no',
    7: 'Neutral',
    9: 'Probablemente sí',
    10: 'Definitivamente sí'
  };

  // Clasificación NPS según metodología oficial
  const getNPSClassification = useMemo(() => {
    if (response?.rating === undefined || response?.rating === null) {
      return null;
    }

    const rating = response.rating;

    if (rating <= 6) {
      return {
        label: 'Detractor',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        description: 'Poco probable que recomiende',
        emoji: '😟'
      };
    } else if (rating <= 8) {
      return {
        label: 'Pasivo',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        description: 'Neutral, podría recomendar',
        emoji: '😐'
      };
    } else {
      return {
        label: 'Promotor',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        description: 'Muy probable que recomiende',
        emoji: '😊'
      };
    }
  }, [response?.rating]);

  return (
    <motion.div 
      variants={scaleIn} 
      initial="initial" 
      animate="animate" 
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Escala NPS 0-10 */}
      <div className="space-y-4">
        {/* Grid responsive para 11 botones */}
        <div className="grid grid-cols-11 gap-1.5 md:gap-2 max-w-5xl mx-auto">
          {npsValues.map((value) => {
            const isSelected = response?.rating === value;
            
            // Determinar color según rango NPS
            let selectedColorClass = '';
            if (isSelected) {
              if (value <= 6) {
                selectedColorClass = 'bg-red-500 border-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.4)]';
              } else if (value <= 8) {
                selectedColorClass = 'bg-yellow-500 border-yellow-500 text-slate-900 shadow-[0_4px_16px_rgba(245,158,11,0.4)]';
              } else {
                selectedColorClass = 'bg-green-500 border-green-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)]';
              }
            }

            return (
              <button
                key={value}
                onClick={() => updateResponse({ rating: value })}
                className={`survey-scale-button ${
                  isSelected 
                    ? `selected ${selectedColorClass} scale-110` 
                    : ''
                }`}
                style={{
                  aspectRatio: '1 / 1',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                aria-label={`NPS Score ${value}${contextualLabels[value] ? ` - ${contextualLabels[value]}` : ''}`}
                aria-pressed={isSelected}
              >
                <span className="survey-scale-button-number text-sm md:text-base">
                  {value}
                </span>
                
                {/* Ripple effect cuando está seleccionado */}
                {isSelected && (
                  <span className="survey-scale-ripple" />
                )}
              </button>
            );
          })}
        </div>

        {/* Labels contextuales en posiciones clave */}
        <div className="relative max-w-5xl mx-auto px-1">
          <div className="flex justify-between text-[10px] md:text-xs text-slate-500 font-medium">
            <span className="flex-1 text-left">Definitivamente no</span>
            <span className="flex-1 text-center -ml-8">Probablemente no</span>
            <span className="flex-1 text-center -ml-4">Neutral</span>
            <span className="flex-1 text-center ml-2">Probablemente sí</span>
            <span className="flex-1 text-right">Definitivamente sí</span>
          </div>
          
          {/* Indicadores de posición (opcional - visual guide) */}
          <div className="flex justify-between mt-1 opacity-30">
            <span className="text-[9px] text-slate-600">0</span>
            <span className="text-[9px] text-slate-600">5</span>
            <span className="text-[9px] text-slate-600">7</span>
            <span className="text-[9px] text-slate-600">9</span>
            <span className="text-[9px] text-slate-600">10</span>
          </div>
        </div>
      </div>

      {/* Label del valor seleccionado (dinámico) */}
      {response?.rating !== undefined && response?.rating !== null && (
        <div className="text-center">
          <span className="text-sm text-cyan-400 font-medium">
            {contextualLabels[response.rating] || `Valor: ${response.rating}`}
          </span>
        </div>
      )}

      {/* Clasificación NPS con feedback visual */}
      {getNPSClassification && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`
            p-4 rounded-xl border text-center
            ${getNPSClassification.bgColor}
            ${getNPSClassification.borderColor}
          `}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl" role="img" aria-label={getNPSClassification.label}>
              {getNPSClassification.emoji}
            </span>
            <span className={`text-lg md:text-xl font-bold ${getNPSClassification.color}`}>
              {getNPSClassification.label}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            {getNPSClassification.description}
          </p>
        </motion.div>
      )}

      {/* Hint cuando no hay selección */}
      {!getNPSClassification && (
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Selecciona un valor de <strong>0 (Definitivamente no)</strong> a <strong>10 (Definitivamente sí)</strong>
          </p>
        </div>
      )}
    </motion.div>
  );
};