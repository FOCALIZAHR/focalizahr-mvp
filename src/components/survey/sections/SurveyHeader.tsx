// src/components/survey/sections/SurveyHeader.tsx
import React from 'react';

interface SurveyHeaderProps {
  companyName: string;
  campaignName: string;
  progress: {
    percentage: number;
    current: number;
    total: number;
  };
  tagline?: string; // Personalizable, default: "Evaluación independiente y confidencial"
}

export const SurveyHeader: React.FC<SurveyHeaderProps> = ({
  companyName,
  campaignName,
  progress,
  tagline = "Evaluación independiente y confidencial"
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800/50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Tarjeta contenedora */}
        <div className="bg-slate-800/30 rounded-xl px-4 py-3 space-y-2">
          
          {/* Línea 1: Logo + Empresa + Tagline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold">
                <span className="text-white">Focaliza</span>
                <span className="text-survey-cyan">HR</span>
              </div>
              <div className="w-px h-4 bg-slate-700" /> {/* Separador */}
              <span className="text-sm text-slate-400">{companyName}</span>
            </div>
            <span className="text-xs text-slate-500 italic hidden sm:block">
              {tagline}
            </span>
          </div>
          
          {/* Línea 2: Nombre campaña + indicador progreso */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              {campaignName}
            </h2>
            <span className="text-xs text-survey-cyan">
              {progress.current}/{progress.total}
            </span>
          </div>
          
          {/* Línea 3: Barra de progreso integrada */}
          <div className="relative h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-survey-cyan to-survey-purple
                         transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            >
              {/* Efecto shimmer opcional */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                            -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};