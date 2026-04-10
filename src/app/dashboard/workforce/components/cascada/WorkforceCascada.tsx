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
import type { WorkforceCardType } from '../WorkforceRailCard'
import { computeCascadeValues } from '../../utils/workforce.utils'

import CascadeActo1Exposicion from './CascadeActo1Exposicion'
import CascadeActo2Inercia from './CascadeActo2Inercia'
import CascadeActo3Hallazgos from './CascadeActo3Hallazgos'
import CascadeActo4Proyeccion from './CascadeActo4Proyeccion'
import CascadeSintesis from './CascadeSintesis'

import HeatmapModal from './modals/HeatmapModal'
import InerciaDesgloseModal from './modals/InerciaDesgloseModal'
import HallazgosModal from './modals/HallazgosModal'
import ProyeccionModal from './modals/ProyeccionModal'

interface WorkforceCascadaProps {
  data: WorkforceDiagnosticData
  onBackToLobby: () => void
  onNavigateTab?: (card: WorkforceCardType) => void
}

export default function WorkforceCascada({
  data,
  onBackToLobby,
  onNavigateTab,
}: WorkforceCascadaProps) {
  const computed = useMemo(() => computeCascadeValues(data), [data])

  // ── Modales del orquestador ───────────────────────────────────────────
  // Cada acto pide su detalle a traves de un callback que aqui setea el state.
  // Los modales son fixed inset-0 z-50 — viven fuera del flujo de la cascada.
  const [modalHeatmap, setModalHeatmap] = useState(false)
  const [modalInerciaDesglose, setModalInerciaDesglose] = useState(false)
  const [modalHallazgos, setModalHallazgos] = useState(false)
  const [modalProyeccion, setModalProyeccion] = useState(false)

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-24 pb-12">
        <CascadeActo1Exposicion
          data={data}
          computed={computed}
          onOpenHeatmap={() => setModalHeatmap(true)}
        />
        <CascadeActo2Inercia
          data={data}
          onOpenDesglose={() => setModalInerciaDesglose(true)}
        />
        <CascadeActo3Hallazgos
          data={data}
          computed={computed}
          onOpenHallazgos={() => setModalHallazgos(true)}
        />
        <CascadeActo4Proyeccion
          data={data}
          computed={computed}
          onOpenProyeccion={() => setModalProyeccion(true)}
        />
        <CascadeSintesis
          data={data}
          computed={computed}
          onBackToLobby={onBackToLobby}
          onNavigateTab={onNavigateTab}
        />
      </div>

      {/* ═══ MODALES ═══ */}
      {modalHeatmap && (
        <HeatmapModal data={data} onClose={() => setModalHeatmap(false)} />
      )}
      {modalInerciaDesglose && (
        <InerciaDesgloseModal data={data} onClose={() => setModalInerciaDesglose(false)} />
      )}
      {modalHallazgos && (
        <HallazgosModal
          data={data}
          cantidadHallazgos={computed.cantidadHallazgos}
          onClose={() => setModalHallazgos(false)}
        />
      )}
      {modalProyeccion && (
        <ProyeccionModal
          data={data}
          costoNoActuar12M={computed.costoNoActuar12M}
          onClose={() => setModalProyeccion(false)}
        />
      )}
    </>
  )
}
