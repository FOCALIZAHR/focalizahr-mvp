'use client';

import { memo } from 'react';
import { AlertTriangle, Users, Briefcase } from 'lucide-react';

interface Demographics {
  byGeneration: Array<{
    generation: string;
    count: number;
    avgEXOScore: number;
    atRiskRate: number;
  }>;
  byGender: Array<{
    gender: string;
    count: number;
    avgEXOScore: number;
  }>;
  bySeniority: Array<{
    range: string;
    count: number;
    avgEXOScore: number;
  }>;
}

interface DemographicIntelligencePanelProps {
  demographics: Demographics;
  globalScore: number;
}

export const DemographicIntelligencePanel = memo(function DemographicIntelligencePanel({
  demographics,
  globalScore
}: DemographicIntelligencePanelProps) {
  
  const isCritical = globalScore < 40;
  const isWarning = globalScore >= 40 && globalScore < 60;

  return (
    <div className="space-y-6">
      
      <div className="text-center">
        <h2 className="text-3xl font-extralight text-white">
          Inteligencia Demográfica
        </h2>
        <p className="text-slate-400 font-light mt-2">
          Patrones de integración por segmento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm text-slate-500 uppercase tracking-widest font-medium">
              Por Generación
            </h3>
          </div>
          
          {demographics.byGeneration.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-4">Sin datos generacionales</p>
          ) : (
            <div className="space-y-4">
              {demographics.byGeneration.map((gen, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-light text-sm">{gen.generation}</span>
                    <span className="text-slate-500 text-xs">{gen.count} persona{gen.count !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-800/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-700 ${
                          gen.avgEXOScore >= 60 ? 'bg-green-400' :
                          gen.avgEXOScore >= 40 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${gen.avgEXOScore}%` }}
                      />
                    </div>
                    <span className="text-2xl font-extralight text-white tabular-nums w-12 text-right">
                      {Math.round(gen.avgEXOScore)}
                    </span>
                  </div>
                  
                  {gen.atRiskRate > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {(gen.atRiskRate * 100).toFixed(0)}% en riesgo
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm text-slate-500 uppercase tracking-widest font-medium">
              Por Antigüedad
            </h3>
          </div>
          
          {demographics.bySeniority.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-4">Sin datos de antigüedad</p>
          ) : (
            <div className="space-y-4">
              {demographics.bySeniority.map((sen, index) => (
                <div key={index}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-slate-300 font-light text-sm flex-1">{sen.range}</span>
                    <span className="text-slate-500 text-xs">{sen.count} persona{sen.count !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-800/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-700 ${
                          sen.avgEXOScore >= 60 ? 'bg-green-400' :
                          sen.avgEXOScore >= 40 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${sen.avgEXOScore}%` }}
                      />
                    </div>
                    <span className="text-2xl font-extralight text-white tabular-nums w-12 text-right">
                      {Math.round(sen.avgEXOScore)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(isCritical || isWarning) && (
        <div className={`bg-gradient-to-r ${
          isCritical ? 'from-red-500/10' : 'from-amber-500/10'
        } to-transparent border-l-4 ${
          isCritical ? 'border-l-red-500' : 'border-l-amber-500'
        } rounded-lg p-6`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 ${
              isCritical ? 'bg-red-500/10' : 'bg-amber-500/10'
            } rounded-lg flex-shrink-0`}>
              <AlertTriangle className={`h-6 w-6 ${
                isCritical ? 'text-red-400' : 'text-amber-400'
              }`} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-white mb-2">
                {isCritical ? 'Score Crítico Detectado' : 'Atención Requerida'}
              </h4>
              <p className="text-slate-300 leading-relaxed mb-4">
                {isCritical 
                  ? `El promedio de ${globalScore.toFixed(1)}/100 indica fallos graves en el proceso de onboarding. Este score está por debajo del umbral de retención saludable (60 pts).`
                  : `El score de ${globalScore.toFixed(1)}/100 está por debajo del estándar esperado. Se recomienda revisar el proceso de integración.`
                }
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">→</span>
                  <p className="text-sm text-slate-400">
                    Revisar metodología 4C Bauer completa
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">→</span>
                  <p className="text-sm text-slate-400">
                    Programar sesiones 1:1 con nuevos ingresos
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400">→</span>
                  <p className="text-sm text-slate-400">
                    Auditar contenido y claridad de expectativas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});

DemographicIntelligencePanel.displayName = 'DemographicIntelligencePanel';