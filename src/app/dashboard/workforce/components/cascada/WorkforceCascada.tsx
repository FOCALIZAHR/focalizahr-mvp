'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE CASCADA — Scroll continuo de actos
// Patron clonado de GoalsCascada.tsx
// SIN AnimatePresence interno — los actos se revelan con whileInView
// space-y-24 entre actos (breathing mandatory de cascada-ejecutiva.md)
// src/app/dashboard/workforce/components/cascada/WorkforceCascada.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import { computeCascadeValues } from '../../utils/workforce.utils'

import CascadeActo1Exposicion from './CascadeActo1Exposicion'
import CascadeActo2Inercia from './CascadeActo2Inercia'
import CascadeActo3Hallazgos from './CascadeActo3Hallazgos'
import CascadeActo4Proyeccion from './CascadeActo4Proyeccion'
import CascadeSintesis from './CascadeSintesis'

import HeatmapModal from './modals/HeatmapModal'

interface WorkforceCascadaProps {
  data: WorkforceDiagnosticData
  onBackToLobby: () => void
}

const noop = () => {}

export default function WorkforceCascada({ data, onBackToLobby }: WorkforceCascadaProps) {
  const computed = useMemo(() => computeCascadeValues(data), [data])

  // ── Modales del orquestador ───────────────────────────────────────────
  // Cada acto pide su detalle a traves de un callback que aqui setea el state.
  // Los modales son fixed inset-0 z-50 — viven fuera del flujo de la cascada.
  const [modalHeatmap, setModalHeatmap] = useState(false)
  // futuras: modalHallazgos, modalInerciaDesglose, modalProyeccion (sesiones siguientes)

  // NOTA: Los actos 2-4 + sintesis aun tienen onContinue/onBack legacy.
  // Se reescriben acto-por-acto en pasos siguientes (2.2, 2.3, 2.4, 2.5).

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-24 pb-12">
        <CascadeActo1Exposicion
          data={data}
          computed={computed}
          onOpenHeatmap={() => setModalHeatmap(true)}
        />
        <CascadeActo2Inercia data={data} onContinue={noop} onBack={noop} />
        <CascadeActo3Hallazgos data={data} computed={computed} onContinue={noop} onBack={noop} />
        <CascadeActo4Proyeccion data={data} computed={computed} onContinue={noop} onBack={noop} />
        <CascadeSintesis data={data} computed={computed} onBackToLobby={onBackToLobby} />
      </div>

      {/* ═══ MODALES ═══ */}
      {modalHeatmap && (
        <HeatmapModal data={data} onClose={() => setModalHeatmap(false)} />
      )}
    </>
  )
}
