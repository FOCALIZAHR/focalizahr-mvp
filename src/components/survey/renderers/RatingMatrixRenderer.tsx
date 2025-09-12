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
      className="space-y-4"
    >
      {selectedAspects.map((aspect, index) => (
        <motion.div 
          key={aspect}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-3 p-3 bg-slate-800/20 rounded-xl border border-slate-800/50"
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
                  className={`
                    relative group
                    w-10 h-10 
                    rounded-full 
                    border-2 
                    transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    
                    ${isSelected 
                      ? 'bg-[#A78BFA] border-transparent text-white scale-110 shadow-[0_4px_12px_rgba(167,139,250,0.3)]' 
                      : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-[#22D3EE] hover:border-transparent hover:text-[#0F172A] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(34,211,238,0.3)]'
                    }
                  `}
                  aria-label={`${aspect} - Calificación ${value}`}
                >
                  <span className="text-sm font-medium">
                    {value}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};