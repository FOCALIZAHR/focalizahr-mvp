// src/components/survey/renderers/TextOpenRenderer.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '../constants/animations';
import type { SurveyResponse } from '@/hooks/useSurveyEngine';

interface TextOpenRendererProps {
  response: SurveyResponse;
  updateResponse: (update: Partial<SurveyResponse>) => void;
}

export const TextOpenRenderer: React.FC<TextOpenRendererProps> = ({ 
  response, 
  updateResponse 
}) => {
  const characterCount = (response?.textResponse || '').length;
  const minCharacters = 10;

  return (
    <motion.div 
      variants={fadeIn} 
      initial="initial" 
      animate="animate" 
      className="space-y-4"
    >
      <textarea
        value={response?.textResponse || ''}
        onChange={(e) => updateResponse({ textResponse: e.target.value })}
        placeholder="Comparte tu experiencia..."
        className="w-full min-h-[150px] p-4 
                   bg-slate-800/30 
                   border-2 border-slate-700 
                   rounded-xl
                   text-white placeholder-slate-500
                   focus:border-survey-cyan/50 focus:bg-slate-800/50
                   focus:outline-none focus:ring-2 focus:ring-survey-cyan/20
                   transition-all duration-200
                   resize-none"
        aria-label="Campo de respuesta de texto"
      />
      
      <div className="flex justify-between text-sm">
        <span className={`transition-colors duration-200 ${
          characterCount < minCharacters 
            ? 'text-slate-500' 
            : 'text-survey-cyan'
        }`}>
          Mín. {minCharacters} caracteres
        </span>
        <span className={`transition-colors duration-200 ${
          characterCount === 0
            ? 'text-slate-600'
            : characterCount < 500 
            ? 'text-slate-400' 
            : 'text-survey-purple'
        }`}>
          {characterCount}/500
        </span>
      </div>
    </motion.div>
  );
};