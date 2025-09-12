// src/components/survey/renderers/MultipleChoiceRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { fadeIn } from '../constants/animations';
import type { Question, SurveyResponse, ValidationRule } from '@/hooks/useSurveyEngine';

interface MultipleChoiceRendererProps {
  question: Question;
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
  validationRule?: ValidationRule;
}

export const MultipleChoiceRenderer: React.FC<MultipleChoiceRendererProps> = ({ 
  question, 
  response, 
  updateResponse,
  validationRule 
}) => {
  const currentChoices = response?.choiceResponse || [];
  
  const toggleOption = (option: string) => {
    const newChoices = currentChoices.includes(option)
      ? currentChoices.filter(c => c !== option)
      : [...currentChoices, option];
    updateResponse({ choiceResponse: newChoices });
  };

  const exactCount = validationRule?.type === 'exact_count' ? validationRule.params.count : null;

  return (
    <motion.div 
      variants={fadeIn} 
      initial="initial" 
      animate="animate"
      className="space-y-4"
    >
      {exactCount && (
        <div className="text-sm text-[#22D3EE]/80 mb-4">
          Selecciona exactamente {exactCount} opciones 
          <span className="ml-2 text-[#A78BFA]">
            ({currentChoices.length}/{exactCount})
          </span>
        </div>
      )}
      
      <div className="space-y-3">
        {question.choiceOptions?.map((option, index) => {
          const isSelected = currentChoices.includes(option);
          
          return (
            <motion.button
              key={index}
              onClick={() => toggleOption(option)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`
                w-full p-4 pl-6
                relative
                rounded-xl
                border
                transition-all duration-300
                ${isSelected ? 
                  'bg-gradient-to-r from-slate-800/80 to-slate-800/60 border-[#22D3EE]/40 text-white' : 
                  'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }
              `}
              aria-pressed={isSelected}
            >
              {/* Checkbox cuadrado distintivo */}
              <div className={`
                absolute left-5 top-1/2 -translate-y-1/2
                w-4 h-4 rounded
                border-2 transition-all duration-300
                flex items-center justify-center
                ${isSelected ? 
                  'bg-[#22D3EE] border-[#22D3EE]' : 
                  'border-slate-600 bg-transparent'
                }
              `}>
                {isSelected && <Check className="w-3 h-3 text-slate-900" />}
              </div>
              
              {/* Texto de la opción */}
              <span className="ml-8 text-left block">
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};