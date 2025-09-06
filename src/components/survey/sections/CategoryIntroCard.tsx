// src/components/survey/sections/CategoryIntroCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CategoryIntroCardProps {
  category: {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    questionCount?: number;
  };
  onContinue: () => void;
  currentSection?: number;
  totalSections?: number;
}

export const CategoryIntroCard: React.FC<CategoryIntroCardProps> = ({ 
  category, 
  onContinue,
  currentSection,
  totalSections
}) => {
  return (
   <div className="min-h-[60vh] flex items-center justify-center px-6">
      <motion.div 
        className="text-center max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        
        {/* Indicador de sección mejorado */}
        {currentSection && totalSections && (
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500 tracking-wider uppercase">
              Sección {currentSection} de {totalSections}
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
        )}
        
        {/* Línea decorativa minimalista */}
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-auto mb-10" />
        
        {/* Título de la dimensión con gradiente */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-8 leading-tight">
          <span 
            style={{
              background: 'linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            className="font-light"
          >
            {category.displayName}
          </span>
        </h2>
        
        {/* Descripción contextual */}
        {category.description && (
          <p className="text-base md:text-lg text-slate-400 mb-12 leading-relaxed max-w-xl mx-auto">
            {category.description}
          </p>
        )}
        
        {/* Botón unificado con el sistema */}
        <motion.button
          onClick={onContinue}
          className="px-12 py-3 
                   bg-transparent border border-slate-600/50
                   text-slate-300 text-sm font-medium tracking-wide
                   rounded-full transition-all duration-300
                   hover:border-[#22D3EE] hover:text-[#22D3EE]
                   hover:bg-[#22D3EE]/5
                   active:scale-[0.98]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continuar
        </motion.button>
        
      </motion.div>
    </div>
  );
};