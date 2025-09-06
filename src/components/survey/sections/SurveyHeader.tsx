// src/components/survey/sections/SurveyHeader.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SurveyHeaderProps {
  companyName?: string;
  campaignName?: string;
  campaignTypeName?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  estimatedDuration?: number;
  tagline?: string;
}

export const SurveyHeader: React.FC<SurveyHeaderProps> = ({
  companyName = "Empresa",
  campaignName = "Encuesta",
  campaignTypeName,
  progress,
  estimatedDuration,
  tagline = "Evaluación independiente y confidencial"
}) => {
  return (
    <>
      {/* Contenedor único integrado */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="max-w-3xl mx-auto h-full relative">
          {/* Líneas laterales de luz - Elemento único memorable */}
          <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#22D3EE]/20 to-transparent" />
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#A78BFA]/20 to-transparent" />
        </div>
      </div>

      {/* Header integrado al contenido */}
      <div className="relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="px-8 pt-8 pb-6 pointer-events-auto">
            
            {/* Información superior */}
            <div className="flex justify-between items-start mb-6">
              {/* Izquierda: Contexto */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium tracking-wider">
                    FOCALIZAHR
                  </span>
                  {tagline && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-500">
                        {tagline}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-sm text-slate-400 font-light">
                  {campaignName}
                </h1>
                {companyName && (
                  <p className="text-xs text-slate-500">
                    Para: {companyName}
                  </p>
                )}
              </div>

              {/* Derecha: Progreso numérico grande */}
              <div className="text-right">
                <motion.div 
                  className="text-3xl font-extralight text-white tabular-nums"
                  key={progress.current}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {progress.current}
                </motion.div>
                <div className="text-xs text-slate-500 mt-1">
                  de {progress.total}
                </div>
              </div>
            </div>

            {/* Progress bar integrado con diseño único */}
            <div className="relative">
              {/* Línea base */}
              <div className="h-[2px] bg-slate-800/50 rounded-full overflow-hidden">
                {/* Barra de progreso con gradiente */}
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
              
              {/* Punto brillante al final - Elemento memorable */}
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
                  {/* Glow exterior */}
                  <div className="absolute inset-0 w-3 h-3 bg-[#A78BFA] rounded-full blur-md opacity-50" />
                  {/* Punto central */}
                  <div className="relative w-3 h-3 bg-white rounded-full shadow-lg shadow-purple-500/50" />
                </div>
              </motion.div>

              {/* Marcadores de cuartos sutiles */}
              <div className="absolute inset-0 flex justify-between pointer-events-none">
                {[25, 50, 75].map((mark) => (
                  <div 
                    key={mark}
                    className="w-[1px] h-2 bg-slate-700/30 -mt-0.5"
                    style={{ marginLeft: `${mark}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Información adicional sutil */}
            {progress.percentage > 0 && (
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                  {progress.percentage < 25 && 'Comenzando'}
                  {progress.percentage >= 25 && progress.percentage < 50 && 'Avanzando'}
                  {progress.percentage >= 50 && progress.percentage < 75 && 'Progresando'}
                  {progress.percentage >= 75 && progress.percentage < 100 && 'Casi listo'}
                  {progress.percentage === 100 && 'Completado'}
                </span>
                {estimatedDuration && progress.percentage < 100 && (
                  <span className="text-[10px] text-slate-600">
                    ~{Math.ceil(estimatedDuration * (1 - progress.percentage / 100))} min restantes
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};