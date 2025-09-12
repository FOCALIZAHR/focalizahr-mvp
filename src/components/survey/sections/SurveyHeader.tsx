// src/components/survey/sections/SurveyHeader.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SurveyHeaderProps {
  companyName?: string;
  companyLogo?: string;
  campaignName?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export const SurveyHeader: React.FC<SurveyHeaderProps> = ({
  companyName = "Empresa",
  companyLogo,
  campaignName = "Encuesta",
  progress
}) => {
  return (
    <>
      {/* Líneas laterales de luz */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="max-w-3xl mx-auto h-full relative">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#22D3EE]/20 to-transparent" />
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#A78BFA]/20 to-transparent" />
        </div>
      </div>

      {/* Header minimalista CORREGIDO */}
      <div className="relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="px-8 pt-6 pb-4 pointer-events-auto">
            
            {/* Línea 1: Logo/Empresa + Badge */}
            <div className="flex justify-between items-center mb-2">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName}
                  className="h-5 w-auto opacity-70"
                />
              ) : (
                <span className="text-xs text-slate-500">
                  {companyName}
                </span>
              )}

              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                <span className="text-xs text-[#22D3EE]">Confidencial</span>
              </div>
            </div>

            {/* Línea 2: Nombre campaña + Progreso numérico */}
            <div className="flex justify-between items-baseline mb-3">
              <h1 className="text-sm text-slate-300 font-light">
                {campaignName}
              </h1>
              <div className="flex items-baseline gap-1">
               <span className="text-lg font-semibold text-[#A78BFA] tabular-nums">
                {progress.current}
              </span>
               <span className="text-xs text-slate-600">
                / {progress.total}
              </span>
            </div>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div className="h-[2px] bg-slate-800/50 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#22D3EE] to-[#A78BFA]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                />
              </div>
              
              {/* Punto brillante */}
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                initial={{ left: 0 }}
                animate={{ left: `${progress.percentage}%` }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 w-3 h-3 bg-[#A78BFA] rounded-full blur-md opacity-50" />
                  <div className="relative w-3 h-3 bg-white rounded-full shadow-lg shadow-purple-500/50" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};