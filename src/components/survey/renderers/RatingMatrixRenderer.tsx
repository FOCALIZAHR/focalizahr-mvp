// src/components/survey/renderers/RatingMatrixRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../constants/animations';
import type { Question, SurveyResponse } from '@/hooks/useSurveyEngine';

interface RatingMatrixRendererProps {
  question: Question;
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
  selectedAspects: string[];
}

export const RatingMatrixRenderer: React.FC<RatingMatrixRendererProps> = ({ 
  question, 
  response, 
  updateResponse,
  selectedAspects 
}) => {
  const matrixResponses = response?.matrixResponses || {};

  const updateMatrixValue = (aspect: string, value: number) => {
    const newMatrix = {
      ...matrixResponses,
      [aspect]: value
    };
    updateResponse({ matrixResponses: newMatrix });
  };

  if (selectedAspects.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        No hay aspectos seleccionados para evaluar
      </div>
    );
  }

  return (
    <motion.div 
      variants={fadeIn} 
      initial="initial" 
      animate="animate"
      className="space-y-6"
    >
      {selectedAspects.map((aspect, index) => (
        <motion.div 
          key={aspect}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-3 p-4 bg-slate-800/20 rounded-xl border border-slate-800/50"
        >
          <h4 className="text-sm font-medium text-slate-300">
            {aspect}
          </h4>
          
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((value) => {
              const isSelected = matrixResponses[aspect] === value;
              
              return (
                <button
                  key={value}
                  onClick={() => updateMatrixValue(aspect, value)}
                  className={`survey-scale-button ${isSelected ? 'selected' : ''}`}
                  style={{ minWidth: '50px', minHeight: '50px' }}
                  aria-label={`${aspect} - Calificación ${value}`}
                >
                  <span className="text-lg font-semibold">
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
      
      <div className="text-center text-sm text-slate-500 mt-4">
        Evalúa cada aspecto del 1 (Muy malo) al 5 (Excelente)
      </div>
    </motion.div>
  );
};