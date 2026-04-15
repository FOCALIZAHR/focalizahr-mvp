'use client'

// ════════════════════════════════════════════════════════════════════════════
// PANEL NARRATIVA — zona B del Panel de Control (centro, scroll interno)
// paneles/PanelNarrativa.tsx
// ════════════════════════════════════════════════════════════════════════════
// La Observación + La Decisión de Valor + Coaching Tip.
// Tono McKinsey: directo, sin jerga RRHH, habla de negocio.
//
// flex-1 + overflow-y-auto → scroll INTERNO si es largo, pero la zona A
// (Acumuladores) y zona C (Acción) siguen siempre visibles.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { Lightbulb } from 'lucide-react'
import type { PortadaMetrics } from '../descriptor-simulator-utils'

interface PanelNarrativaProps {
  metrics: PortadaMetrics
  cohortSize: number
  matchedCount: number  // tareas con focalizaScore >= 0.5 (accionables)
}

export default memo(function PanelNarrativa({
  metrics,
  cohortSize,
  matchedCount,
}: PanelNarrativaProps) {
  const { variant, gapPp, isBenchmarkMissing } = metrics

  // La Observación — qué está pasando en este cargo
  const observacion = isBenchmarkMissing
    ? `Este cargo no tiene benchmark Eloundou disponible. Trabaja sobre las tareas específicas identificadas en Zona de Rescate.`
    : variant === 'negative'
      ? `Tu cargo supera el mercado en ${Math.abs(Math.round(gapPp))} puntos de exposición. La estructura paga horas humanas en tareas que la IA ya domina.`
      : variant === 'positive'
        ? `Tu cargo está ${Math.abs(Math.round(gapPp))} puntos debajo del mercado. Hay tareas protegidas del diseño tradicional que otros ya automatizaron.`
        : `Tu cargo está alineado con el mercado. La oportunidad es granular — en las tareas específicas de Zona de Rescate.`

  // La Decisión — preguntas que el CEO debe hacerse
  const decision = matchedCount > 0
    ? `De las ${cohortSize} tareas de este cargo, ${matchedCount} son total o parcialmente automatizables. ¿Cuántas horas tiene sentido rescatar? ¿Empezar con las de mayor impacto CLP o las de menor riesgo operacional?`
    : `Todas las tareas de este cargo están en zona humana. La oportunidad de eficiencia IA en este rol es mínima.`

  // Coaching tip — acción con urgencia
  const coachingTip = matchedCount > 0
    ? `Ajusta los sliders de las tareas en Zona de Rescate. Cada hora movida genera rescate de EBITDA inmediato.`
    : `Considera validar con RRHH si este cargo debería tener más tareas expuestas — o mantener la soberanía humana como decisión estratégica.`

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
      {/* La Observación */}
      <div>
        <p className="text-[11px] text-slate-400 font-light mb-1.5">
          — La observación
        </p>
        <p className="text-slate-300 font-light leading-relaxed text-sm">
          {observacion}
        </p>
      </div>

      {/* La Decisión de Valor */}
      <div
        className="pl-3 py-0.5"
        style={{
          borderLeft: '2px solid transparent',
          borderImage: 'linear-gradient(to bottom, #22D3EE, #A78BFA) 1',
        }}
      >
        <p className="text-[11px] text-slate-400 font-light mb-1.5">
          — La decisión de valor
        </p>
        <p className="text-slate-300 font-light leading-relaxed text-sm">
          {decision}
        </p>
      </div>

      {/* Coaching Tip */}
      <div className="flex items-start gap-2 pt-1">
        <Lightbulb className="w-3 h-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-500 font-light italic leading-relaxed">
          {coachingTip}
        </p>
      </div>
    </div>
  )
})
