'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE CASCADA — Scroll continuo de actos
// Patron clonado de GoalsCascada.tsx
// SIN AnimatePresence interno — los actos se revelan con whileInView
// space-y-24 entre actos (breathing mandatory de cascada-ejecutiva.md)
// src/app/dashboard/workforce/components/cascada/WorkforceCascada.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import { computeCascadeValues } from '../../utils/workforce.utils'

import CascadeActo1Exposicion from './CascadeActo1Exposicion'
import CascadeActo2Inercia from './CascadeActo2Inercia'
import CascadeActo3Hallazgos from './CascadeActo3Hallazgos'
import CascadeActo4Proyeccion from './CascadeActo4Proyeccion'
import CascadeSintesis from './CascadeSintesis'

interface WorkforceCascadaProps {
  data: WorkforceDiagnosticData
  onBackToLobby: () => void
}

const noop = () => {}

export default function WorkforceCascada({ data, onBackToLobby }: WorkforceCascadaProps) {
  const computed = useMemo(() => computeCascadeValues(data), [data])

  // NOTA: Los actos actuales tienen onContinue/onBack propios que ya no aplican
  // (porque ahora es scroll continuo). Se pasan no-op aqui hasta que se reescriban
  // acto-por-acto en pasos siguientes con ActSeparator + fadeIn + narrativa del script v2.

  return (
    <div className="w-full max-w-4xl mx-auto space-y-24 pb-12">
      <CascadeActo1Exposicion data={data} computed={computed} onContinue={noop} onBack={noop} />
      <CascadeActo2Inercia data={data} onContinue={noop} onBack={noop} />
      <CascadeActo3Hallazgos data={data} computed={computed} onContinue={noop} onBack={noop} />
      <CascadeActo4Proyeccion data={data} computed={computed} onContinue={noop} onBack={noop} />
      <CascadeSintesis data={data} computed={computed} onBackToLobby={onBackToLobby} />
    </div>
  )
}
