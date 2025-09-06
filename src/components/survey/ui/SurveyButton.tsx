// src/components/survey/ui/SurveyButton.tsx
'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/constants/survey-design-constants';

interface SurveyButtonProps extends Omit<HTMLMotionProps<"button">, 'type'> {
  variant?: 'primary' | 'secondary' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export const SurveyButton: React.FC<SurveyButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  className,
  ...props
}) => {
  // Tamaños
  const sizeClasses = {
    sm: 'px-6 py-2 text-xs',
    md: 'px-10 py-3 text-sm',
    lg: 'px-12 py-4 text-base',
  };

  // Variantes
  const variantClasses = {
    primary: `
      bg-transparent border border-[#22D3EE]/50
      text-[#22D3EE]
      hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]
    `,
    secondary: `
      bg-transparent border border-slate-600/50
      text-slate-300
      hover:border-slate-500 hover:text-slate-200
    `,
    solid: `
      bg-[#22D3EE] text-[#0F172A] border border-[#22D3EE]
      hover:bg-[#A78BFA] hover:border-[#A78BFA] hover:shadow-lg
    `,
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={cn(
        // Base
        'font-medium tracking-wide rounded-full transition-all duration-300',
        'inline-flex items-center justify-center gap-2',
        
        // Tamaño
        sizeClasses[size],
        
        // Variante
        variantClasses[variant],
        
        // Estado disabled
        isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
        
        // Clase personalizada
        className
      )}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
};