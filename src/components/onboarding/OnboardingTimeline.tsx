'use client';

import { memo } from 'react';

interface TimelineStage {
  day: number;
  label: string;
  score: number | null;
  alerts: number;
  color: string;
}

interface OnboardingTimelineProps {
  stages: TimelineStage[];
  avgScore: number;
  totalJourneys?: number;
}

function OnboardingTimeline({ 
  stages, 
  avgScore,
  totalJourneys 
}: OnboardingTimelineProps) {
  
  const validStages = stages.filter(
    (stage): stage is TimelineStage & { score: number } => stage.score !== null
  );
  
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-8 space-y-8">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-light text-white">
          Metodología 4C Bauer
        </h3>
        <p className="text-sm text-slate-500 font-light">
          Diagnóstico visual de salud por etapa crítica
        </p>
      </div>
      
      {/* TIMELINE - SOLO BARRAS HORIZONTALES */}
      {validStages.length > 0 ? (
        <div className="space-y-4">
          {validStages.map((stage) => (
            <div 
              key={stage.day} 
              className="flex items-center gap-6 p-4 rounded-lg hover:bg-slate-800/30 transition-colors group"
            >
              
              {/* LABEL ETAPA */}
              <div className="flex items-center gap-3 w-56">
                <span className="text-xs text-slate-500 font-medium px-2.5 py-1 bg-slate-800/50 rounded">
                  Día {stage.day}
                </span>
                <span className="text-sm text-slate-300 font-light">
                  {stage.label}
                </span>
              </div>
              
              {/* SCORE NÚMERO */}
              <span 
                className="text-3xl font-extralight tabular-nums w-20 text-right"
                style={{ color: stage.color }}
              >
                {stage.score}
              </span>
              
              {/* BARRA HORIZONTAL */}
              <div className="flex-1 bg-slate-800/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-3 rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${stage.score}%`,
                    backgroundColor: stage.color
                  }}
                />
              </div>
              
              {/* ALERTAS */}
              {stage.alerts > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full">
                  <span className="text-xs text-purple-400">⚠</span>
                  <span className="text-xs text-purple-400 font-medium tabular-nums">
                    {stage.alerts}
                  </span>
                </div>
              )}
              
              {/* BADGE ESTADO */}
              <span 
                className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full font-medium w-24 text-center"
                style={{ 
                  backgroundColor: `${stage.color}20`,
                  color: stage.color 
                }}
              >
                {stage.score >= 80 ? 'Excelente' : stage.score >= 60 ? 'Atención' : 'Crítico'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">No hay datos de etapas disponibles aún</p>
        </div>
      )}
      
      {/* LEGEND */}
      <div className="pt-6 border-t border-slate-800/50 flex items-center justify-center gap-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span>≥80 Excelente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span>60-79 Atención</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span>&lt;60 Crítico</span>
        </div>
      </div>
      
      {/* FOOTER */}
      {totalJourneys !== undefined && (
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Basado en {totalJourneys} journey{totalJourneys !== 1 ? 's' : ''} activo{totalJourneys !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

OnboardingTimeline.displayName = 'OnboardingTimeline';

export default memo(OnboardingTimeline);
