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
        <div className="text-sm text-survey-cyan">
          Selecciona exactamente {exactCount} opciones 
          ({currentChoices.length}/{exactCount})
        </div>
      )}
      
      <div className="space-y-3">
        {question.choiceOptions?.map((option, index) => {
          const isSelected = currentChoices.includes(option);
          
          return (
            <button
              key={index}
              onClick={() => toggleOption(option)}
              className={`survey-option-button ${isSelected ? 'selected' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="survey-option-checkbox">
                {isSelected && <Check className="w-4 h-4 text-slate-900" />}
              </div>
              <span className="flex-1 text-left">{option}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};