'use client'

// ════════════════════════════════════════════════════════════════════════════
// SCIENTIFIC BACKING TOOLTIP
// src/components/shared/ScientificBackingTooltip.tsx
//
// Versión: 1.0
//
// PROPÓSITO:
// Muestra el respaldo científico de una narrativa FocalizaHR.
// Usa TooltipContext existente — no crea dependencias nuevas.
//
// USO:
// import { ScientificBackingTooltip } from '@/components/shared/ScientificBackingTooltip'
// import { SCIENTIFIC_BACKING } from '@/config/narratives/ScientificBackingDictionary'
//
// <ScientificBackingTooltip backing={SCIENTIFIC_BACKING.leadership_impact} />
//
// PILOTO: Modal de liderazgo en P&L Talent (LeadershipRiskDictionary)
// PRÓXIMOS: TalentMapNarratives, TalentNarrativeService, ADN Organizacional
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { FlaskConical } from 'lucide-react'
import { TooltipContext } from '@/components/ui/TooltipContext'
import type { ScientificBacking } from '@/config/narratives/ScientificBackingDictionary'

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

interface ScientificBackingTooltipProps {
  backing: ScientificBacking
  // Texto del trigger — por defecto "¿De dónde viene este dato?"
  triggerLabel?: string
  // Posición del tooltip
  position?: 'top' | 'bottom' | 'left' | 'right'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function ScientificBackingTooltip({
  backing,
  triggerLabel = '¿De dónde viene este dato?',
  position = 'top',
}: ScientificBackingTooltipProps) {

  // Construir details[] para TooltipContext
  // Una entrada por cita: "stat — source"
  const details = backing.citations.map(citation =>
    `"${citation.stat}" — ${citation.source}`
  )

  return (
    <TooltipContext
      variant={backing.variant}
      position={position}
      title="Respaldo Científico"
      explanation={backing.citations[0]?.claim ?? ''}
      details={details}
      actionable={backing.bridge}
    >
      <button className="
        inline-flex items-center gap-1.5
        text-xs text-slate-400
        hover:text-cyan-400
        transition-colors duration-200
        cursor-pointer
        group
      ">
        <FlaskConical
          size={12}
          className="opacity-60 group-hover:opacity-100 transition-opacity"
        />
        <span className="underline underline-offset-2 decoration-dotted">
          {triggerLabel}
        </span>
      </button>
    </TooltipContext>
  )
})
