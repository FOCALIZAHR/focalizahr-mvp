'use client'

// ════════════════════════════════════════════════════════════════════════════
// TRIPLE BLOCK TESLA — 3 segmentos H / A / R
// src/app/dashboard/workforce/components/instruments/descriptor-simulator/atomos/TripleBlock.tsx
// ════════════════════════════════════════════════════════════════════════════
// Reemplaza la barra de porcentaje con un indicador discreto de 3 estados.
// Se ilumina UNO solo según focalizaScore (betaEloundou):
//   - 0 / null → Humano (slate-500)
//   - 0.5      → Aumentado (purple #A78BFA)
//   - 1.0      → Rescate (cyan #22D3EE)
// Los segmentos no iluminados: bg-white/10 (casi invisible).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { categorizeTask, BLOCK_META, type ForensicTask } from '../descriptor-simulator-utils'

interface TripleBlockProps {
  task: ForensicTask
}

export default memo(function TripleBlock({ task }: TripleBlockProps) {
  const cat = categorizeTask(task)

  const soberaniaOn = cat === 'soberania'
  const aumentadoOn = cat === 'aumentado'
  const rescateOn = cat === 'rescate'

  return (
    <div
      className="inline-flex items-stretch gap-[2px] h-[18px]"
      role="img"
      aria-label={`Categoría: ${BLOCK_META[cat].title}`}
    >
      <Segment
        label="H"
        active={soberaniaOn}
        activeColor="#64748B"
      />
      <Segment
        label="A"
        active={aumentadoOn}
        activeColor="#A78BFA"
      />
      <Segment
        label="R"
        active={rescateOn}
        activeColor="#22D3EE"
      />
    </div>
  )
})

function Segment({
  label,
  active,
  activeColor,
}: {
  label: string
  active: boolean
  activeColor: string
}) {
  return (
    <div
      className={cn(
        'w-5 flex items-center justify-center text-[9px] font-mono font-bold uppercase tracking-tight rounded-sm transition-all',
      )}
      style={
        active
          ? {
              backgroundColor: `${activeColor}26`, // ~15% opacity
              color: activeColor,
              border: `1px solid ${activeColor}66`, // ~40% opacity
            }
          : {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: 'rgba(148, 163, 184, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }
      }
    >
      {label}
    </div>
  )
}
