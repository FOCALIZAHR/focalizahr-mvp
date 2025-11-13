'use client';

import { memo } from 'react';

// ============================================
// TYPES
// ============================================
interface TimelineStage {
  day: number;
  label: string;
  completed: number;
  total: number;
  avgScore: number | null;
}

interface OnboardingTimelineProps {
  stages: TimelineStage[];
  totalJourneys: number;
}

// ============================================
// COMPONENT - MINIMALISTA PURO
// ============================================
const OnboardingTimeline = memo(function OnboardingTimeline({ 
  stages,
  totalJourneys
}: OnboardingTimelineProps) {
  
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
      
      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-base font-medium text-slate-200">Metodología 4C Bauer</h3>
        <p className="text-xs text-slate-500 mt-1">Completitud por etapa</p>
      </div>

      {/* STAGES */}
      <div className="space-y-5">
        {stages.map((stage, index) => {
          const completionRate = stage.total > 0 ? (stage.completed / stage.total) * 100 : 0;

          return (
            <div key={stage.day} className="space-y-2">
              
              {/* STAGE HEADER */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono">
                    Día {stage.day}
                  </span>
                  <span className="text-slate-300 font-light">
                    {stage.label}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {stage.completed}/{stage.total}
                </span>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-800/30 rounded-full h-1.5">
                <div 
                  className="h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              {/* AVG SCORE */}
              {stage.avgScore !== null && (
                <div className="flex items-baseline gap-2 justify-end">
                  <span className={`text-lg font-extralight tabular-nums ${
                    stage.avgScore >= 80 ? 'text-green-400' :
                    stage.avgScore >= 60 ? 'text-cyan-400' :
                    stage.avgScore >= 40 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    {stage.avgScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-600">/ 100</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-6 pt-6 border-t border-slate-800/50">
        <p className="text-xs text-slate-500 text-center">
          Basado en {totalJourneys} journey{totalJourneys !== 1 ? 's' : ''} activo{totalJourneys !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
});

OnboardingTimeline.displayName = 'OnboardingTimeline';

export default OnboardingTimeline;