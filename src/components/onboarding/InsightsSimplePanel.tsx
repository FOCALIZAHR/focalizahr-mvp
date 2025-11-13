'use client';

import { memo } from 'react';

// ============================================
// TYPES
// ============================================
interface TopIssue {
  issue: string;
  count: number;
}

interface Insights {
  topIssues: TopIssue[];
  recommendations: string[];
}

interface InsightsSimplePanelProps {
  insights: Insights;
}

// ============================================
// COMPONENT - MINIMALISTA PURO
// ============================================
export const InsightsSimplePanel = memo(function InsightsSimplePanel({ 
  insights 
}: InsightsSimplePanelProps) {
  
  const { topIssues = [], recommendations = [] } = insights;

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-800/50">
        <h3 className="text-base font-medium text-slate-200">Insights Accionables</h3>
        <p className="text-xs text-slate-500 mt-1">Problemas detectados · Recomendaciones</p>
      </div>

      <div className="p-6 space-y-6">
        
        {/* PROBLEMAS DETECTADOS */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            Problemas Detectados {topIssues.length > 0 && `(${topIssues.length})`}
          </p>

          {topIssues.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-2">
              No hay problemas críticos detectados
            </p>
          ) : (
            <div className="space-y-2">
              {topIssues.map((issue, index) => {
                // Detectar severidad
                const isCritical = issue.issue.includes('critical') || issue.issue.includes('critico');
                const borderColor = isCritical ? 'border-l-red-500/50' : 'border-l-amber-500/50';
                const textColor = isCritical ? 'text-red-400' : 'text-amber-400';

                return (
                  <div
                    key={index}
                    className={`py-2 border-b border-slate-800/30 last:border-0 border-l-2 ${borderColor} pl-3`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-slate-300 font-light leading-relaxed">
                        {issue.issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {issue.count > 0 && (
                        <span className={`text-xs ${textColor} flex-shrink-0`}>
                          {issue.count} caso{issue.count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900/30 px-3 text-xs text-slate-600">
              Acciones sugeridas
            </span>
          </div>
        </div>

        {/* RECOMENDACIONES */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            Recomendaciones {recommendations.length > 0 && `(${recommendations.length})`}
          </p>

          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-2">
              Sistema analizando patrones...
            </p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                // Detectar prioridad
                const isHighPriority = rec.toLowerCase().includes('prioridad alta') || rec.toLowerCase().includes('crítico');
                const dotColor = isHighPriority ? 'bg-red-400' : 'bg-cyan-400';

                return (
                  <div
                    key={index}
                    className="py-2 border-b border-slate-800/30 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0 mt-2`}></div>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
});

InsightsSimplePanel.displayName = 'InsightsSimplePanel';