'use client'

// ════════════════════════════════════════════════════════════════════════════
// CLIMA CASCADA — Orquestador de los Actos DINÁMICOS + Síntesis (space-y-24).
// El motor ya decidió cuántos y cuáles Actos (1-5) y su orden; acá solo se
// mapean. Clon estructural de PLTalentExecutiveBriefing / GoalsCascada.
// Los CTA de cada acto y el cierre de la síntesis llevan al Lobby (onDone); el
// deep-link a la evidencia específica llega en 4.5b (Cards).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import type { ClimaAct, ClimaSynthesis } from '@/types/clima-cascada'
import ActoClima from './ActoClima'
import ClimaSintesis from './ClimaSintesis'

interface ClimaCascadaProps {
  acts: ClimaAct[]
  synthesis: ClimaSynthesis
  onDone: () => void
}

export default memo(function ClimaCascada({ acts, synthesis, onDone }: ClimaCascadaProps) {
  return (
    <div className="space-y-24 pb-12">
      {acts.map((act) => (
        <ActoClima key={act.type} act={act} onCTA={onDone} />
      ))}
      <ClimaSintesis synthesis={synthesis} onContinue={onDone} />
    </div>
  )
})
