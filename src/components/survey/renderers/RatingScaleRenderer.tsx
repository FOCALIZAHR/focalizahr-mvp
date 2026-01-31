// src/components/survey/renderers/RatingScaleRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '../constants/animations';
import type { SurveyResponse } from '@/hooks/useSurveyEngine';

export interface RatingScaleLabels {
  min: string;
  max: string;
  scale: string[];
}

interface RatingScaleRendererProps {
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
  labels?: RatingScaleLabels;
}

const DEFAULT_SCALE_LABELS: RatingScaleLabels = {
  min: 'Muy en desacuerdo',
  max: 'Muy de acuerdo',
  scale: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']
};

export const RatingScaleRenderer: React.FC<RatingScaleRendererProps> = ({
  response,
  updateResponse,
  labels = DEFAULT_SCALE_LABELS
}) => {
  const scaleLabels = labels.scale || DEFAULT_SCALE_LABELS.scale;

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Botones de escala */}
      <div className="flex justify-center gap-3">
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

      {/* Labels de extremos */}
      <div className="flex justify-between max-w-md mx-auto px-2">
        <span className="text-xs text-slate-500">{labels.min}</span>
        <span className="text-xs text-slate-500">{labels.max}</span>
      </div>

      {/* Mostrar label del valor seleccionado */}
      {response?.rating && (
        <div className="text-center">
          <span className="text-sm text-cyan-400 font-medium">
            {scaleLabels[response.rating - 1]}
          </span>
        </div>
      )}
    </motion.div>
  );
};
