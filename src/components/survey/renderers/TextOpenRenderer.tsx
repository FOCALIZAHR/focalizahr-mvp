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
  const maxCharacters = 500;

  return (
    <motion.div 
      variants={fadeIn} 
      initial="initial" 
      animate="animate"
      transition={{ duration: 0.3, ease: "easeOut" }}  // ← AGREGAR
      className="space-y-4"
    >
      <textarea
        value={response?.textResponse || ''}
        onChange={(e) => {
          if (e.target.value.length <= maxCharacters) {
            updateResponse({ textResponse: e.target.value });
          }
        }}
        placeholder="Comparte tu experiencia..."
        className="w-full min-h-[140px] p-4
                   bg-slate-900/40
                   border border-slate-700/50
                   rounded-xl
                   text-white placeholder-slate-500
                   focus:border-[#22D3EE]/50 
                   focus:outline-none focus:ring-1 focus:ring-[#22D3EE]/20
                   transition-all duration-200
                   resize-none"
        maxLength={maxCharacters}
      />
      
      <div className="flex justify-between text-sm">
        <span className={`${
          characterCount < minCharacters 
            ? 'text-[#22D3EE]/70' 
            : 'text-transparent'
        }`}>
          {characterCount < minCharacters && `Mín. ${minCharacters} caracteres`}
        </span>
        <span className="text-slate-500">
          {characterCount}/{maxCharacters}
        </span>
      </div>
    </motion.div>
  );
};