'use client'

import { memo } from 'react'

interface Stage {
  day: number
  label: string
  completed: number
  total: number
  avgScore: number | null
}

interface OnboardingTimelineProps {
  stages: Stage[]
  totalJourneys: number
}

export default memo(function OnboardingTimeline({ 
  stages, 
  totalJourneys 
}: OnboardingTimelineProps) {

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800/50">
        <h3 className="text-base font-medium text-slate-200">Progreso por Etapa</h3>
        <p className="text-sm text-slate-500 mt-1">Seguimiento longitudinal modelo 4C Bauer</p>
      </div>

      <div className="p-8">
        {/* Timeline */}
        <div className="flex items-start justify-between gap-3">
          {stages.map((stage, index) => {
            const completionRate = totalJourneys > 0 ? (stage.completed / totalJourneys) * 100 : 0
            const isComplete = completionRate === 100
            const isActive = completionRate > 0 && completionRate < 100

            return (
              <div key={stage.day} className="flex flex-col items-center flex-1 relative">
                {/* Línea conectora */}
                {index < stages.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-px bg-slate-800 z-0">
                    {completionRate > 0 && (
                      <div 
                        className="h-full bg-cyan-500 transition-all duration-700"
                        style={{ width: `${completionRate}%` }}
                      />
                    )}
                  </div>
                )}

                {/* Nodo */}
                <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 transition-colors ${
                  isComplete ? 'bg-cyan-500 border-cyan-500' :
                  isActive ? 'bg-slate-900 border-cyan-500' :
                  'bg-slate-900 border-slate-700'
                }`}>
                  <span className={`text-xs font-medium ${
                    isComplete ? 'text-white' :
                    isActive ? 'text-cyan-400' :
                    'text-slate-600'
                  }`}>
                    {stage.day}
                  </span>
                </div>

                {/* Info */}
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm font-light text-slate-300">{stage.label}</p>
                  
                  <p className="text-xl font-extralight text-white tabular-nums">
                    {stage.completed}/{totalJourneys}
                  </p>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">{completionRate.toFixed(0)}% completado</p>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div 
                        className="h-1 bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Score */}
                  {stage.avgScore !== null ? (
                    <div className={`text-base font-medium tabular-nums ${
                      stage.avgScore >= 80 ? 'text-green-400' :
                      stage.avgScore >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {stage.avgScore.toFixed(0)}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">—</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            <span className="text-cyan-400">Modelo 4C:</span> Compliance → Clarification → Culture → Connection
          </p>
        </div>
      </div>
    </div>
  )
})