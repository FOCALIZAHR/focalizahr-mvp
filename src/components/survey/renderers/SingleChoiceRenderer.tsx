// src/components/survey/renderers/SingleChoiceRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
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
      className="space-y-3"
    >
      {question.choiceOptions?.map((option, index) => {
        const isSelected = currentChoice === option;
        
        return (
          <button
            key={index}
            onClick={() => updateResponse({ choiceResponse: [option] })}
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
    </motion.div>
  );
};