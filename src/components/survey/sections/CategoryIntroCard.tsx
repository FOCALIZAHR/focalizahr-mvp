// src/components/survey/sections/CategoryIntroCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface CategoryIntroCardProps {
  category: {
    name: string;
    displayName: string;
    description?: string;
    icon?: string;
    questionCount?: number;
  };
  onContinue: () => void;
}

export const CategoryIntroCard: React.FC<CategoryIntroCardProps> = ({ 
  category, 
  onContinue 
}) => {
  const estimatedTime = Math.ceil((category.questionCount || 5) * 0.5);

  return (
    <div className="survey-category-intro">
      <div className="survey-category-icon">
        <div className="w-10 h-10 border-2 border-survey-cyan rounded-lg rotate-45" />
      </div>
      
      <h2 className="survey-category-title">
        {category.displayName}
      </h2>
      
      <p className="text-slate-400 max-w-md mx-auto mb-8">
        {category.description || 'Tu opinión es importante para nosotros'}
      </p>
      
      <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-8">
        <span>{category.questionCount} preguntas</span>
        <span>•</span>
        <span>~{estimatedTime} minutos</span>
      </div>
      
      <motion.button
        onClick={onContinue}
        className="survey-nav-button survey-nav-next mx-auto"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Comenzar sección
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};