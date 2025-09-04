// src/components/survey/renderers/RatingScaleRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../constants/animations';
import type { SurveyResponse } from '@/hooks/useSurveyEngine';

interface RatingScaleRendererProps {
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}

export const RatingScaleRenderer: React.FC<RatingScaleRendererProps> = ({ 
  response, 
  updateResponse 
}) => {
  const scaleLabels = [
    'Muy en desacuerdo',
    'En desacuerdo',
    'Neutral',
    'De acuerdo',
    'Muy de acuerdo'
  ];

  return (
    <motion.div 
      variants={scaleIn} 
      initial="initial" 
      animate="animate" 
      className="space-y-6"
    >
      {/* Botones de escala */}
      <div className="flex flex-wrap gap-4 justify-center">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => updateResponse({ rating: value })}
            className={`survey-scale-button ${
              response?.rating === value ? 'selected' : ''
            }`}
            aria-label={`${value} - ${scaleLabels[value - 1]}`}
          >
            <span className="survey-scale-button-number">{value}</span>
            {response?.rating === value && (
              <span className="survey-scale-ripple" />
            )}
          </button>
        ))}
      </div>

      {/* Labels de los extremos */}
      <div className="flex justify-between text-sm text-slate-500 px-4 max-w-lg mx-auto">
        <span>{scaleLabels[0]}</span>
        <span>{scaleLabels[4]}</span>
      </div>
    </motion.div>
  );
};