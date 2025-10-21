// src/components/survey/renderers/SingleChoiceRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../constants/animations';
import type { Question, SurveyResponse } from '@/hooks/useSurveyEngine';

interface SingleChoiceRendererProps {
  question: Question;
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}

export const SingleChoiceRenderer: React.FC<SingleChoiceRendererProps> = ({ 
  question, 
  response, 
  updateResponse 
}) => {
  const currentChoice = response?.choiceResponse?.[0];

  return (
    <motion.div 
      variants={fadeIn} 
      initial="initial" 
      animate="animate"
      transition={{ duration: 0.3, ease: "easeOut" }}  // ← AGREGAR ESTO
      className="space-y-3"
    >
      {question.choiceOptions?.map((option, index) => {
        const isSelected = currentChoice === option;
        
        return (
          <motion.button
            key={index}
            onClick={() => updateResponse({ choiceResponse: [option] })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            className={`
              w-full p-4 pl-6
              relative
              rounded-xl
              border
              transition-all duration-300
              ${isSelected ? 
                'bg-gradient-to-r from-slate-800/80 to-slate-800/60 border-[#A78BFA]/40 text-white' : 
                'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }
            `}
            aria-pressed={isSelected}
          >
            {/* Indicador lateral distintivo */}
            <div className={`
              absolute left-0 top-1/2 -translate-y-1/2
              w-1 h-8
              rounded-r-full
              transition-all duration-300
              ${isSelected ? 
                'bg-gradient-to-b from-[#22D3EE] to-[#A78BFA]' : 
                'bg-slate-700'
              }
            `} />

            {/* Número de opción */}
            <span className={`
              absolute left-5 top-1/2 -translate-y-1/2
              text-xs font-bold
              transition-all duration-300
              ${isSelected ? 'text-[#A78BFA]' : 'text-slate-600'}
            `}>
              {String.fromCharCode(65 + index)}
            </span>

            {/* Texto de la opción */}
            <span className="ml-6 text-left block">
              {option}
            </span>

            {/* Indicador de selección elegante */}
            {isSelected && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#22D3EE]/30 to-transparent"
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};