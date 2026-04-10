'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE CASCADA — Scroll continuo de actos (v3.2)
// Patron clonado de GoalsCascada.tsx
// SIN AnimatePresence interno — los actos se revelan con whileInView
// space-y-24 entre actos (breathing mandatory de cascada-ejecutiva.md)
//
// v3.2 — Regla del Rio: avgExposure es el % narrativo que conecta toda la
// cascada. Se calcula UNA vez aqui y se pasa como exposurePct a cada acto,
// que lo usa en su conector de apertura.
//
// Orden v3.2: Concentracion → Talento atrapado → Senales cruzadas → Costo
//          → Horizonte → Punto ciego
// Patron de persuasion: dolor → diagnostico → cruces → dinero → futuro → cierre
// src/app/dashboard/workforce/components/cascada/WorkforceCascada.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { WorkforceCardType } from '../WorkforceRailCard'

// v3.1 — actos
import CascadeActo1Gancho from './CascadeActo1Gancho'
import CascadeActo2Problema from './CascadeActo2Problema'
import CascadeActo3Amplificador from './CascadeActo3Amplificador'
import CascadeActo4Costo from './CascadeActo4Costo'
import CascadeActo5Riesgo from './CascadeActo5Riesgo'
import CascadeActo6Sintesis from './CascadeActo6Sintesis'

// v3.1 — modales
import TopSegmentosModal from './modals/TopSegmentosModal'
import ZombiesBySegmentModal from './modals/ZombiesBySegmentModal'
import CrossIntelligenceModal from './modals/CrossIntelligenceModal'
import InertiaCostModal from './modals/InertiaCostModal'
import RetentionBySegmentModal from './modals/RetentionBySegmentModal'

interface WorkforceCascadaProps {
  data: WorkforceDiagnosticData
  onBackToLobby: () => void
  onNavigateTab?: (card: WorkforceCardType) => void
}

export default function WorkforceCascada({
  data,
  onBackToLobby: _onBackToLobby,
  onNavigateTab: _onNavigateTab,
}: WorkforceCascadaProps) {
  // ── Modales del orquestador ─────────────────────────────────────────
  // Cada acto pide su detalle a traves de un callback que aqui setea el state.
  // Los modales usan createPortal a document.body — viven fuera del flujo.
  const [modalTopSegmentos, setModalTopSegmentos] = useState(false)         // Acto 1 Concentracion
  const [modalZombies, setModalZombies] = useState(false)                   // Acto 2 Talento atrapado
  const [modalCross, setModalCross] = useState(false)                       // Acto 3 Senales cruzadas
  const [modalInertia, setModalInertia] = useState(false)                   // Acto 4 Costo
  const [modalRetention, setModalRetention] = useState(false)               // Acto 5 Horizonte

  // ── v3.2 Regla del Rio ─────────────────────────────────────────────
  // El % de exposicion es el rio narrativo. Se calcula una vez y se pasa
  // a cada acto, que lo referencia en su conector de apertura.
  const exposurePct = Math.round(data.exposure.avgExposure * 100)

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-24 pb-12">
        <CascadeActo1Gancho
          data={data}
          exposurePct={exposurePct}
          onOpenTopSegmentos={() => setModalTopSegmentos(true)}
        />
        <CascadeActo2Problema
          data={data}
          exposurePct={exposurePct}
          onOpenZombies={() => setModalZombies(true)}
        />
        <CascadeActo3Amplificador
          data={data}
          exposurePct={exposurePct}
          onOpenCross={() => setModalCross(true)}
        />
        <CascadeActo4Costo
          data={data}
          exposurePct={exposurePct}
          onOpenInertia={() => setModalInertia(true)}
        />
        <CascadeActo5Riesgo
          data={data}
          exposurePct={exposurePct}
          onOpenRetention={() => setModalRetention(true)}
        />
        <CascadeActo6Sintesis
          data={data}
          exposurePct={exposurePct}
        />
      </div>

      {/* ═══ MODALES ═══ */}
      {modalTopSegmentos && (
        <TopSegmentosModal data={data} onClose={() => setModalTopSegmentos(false)} />
      )}
      {modalZombies && (
        <ZombiesBySegmentModal data={data} onClose={() => setModalZombies(false)} />
      )}
      {modalCross && (
        <CrossIntelligenceModal data={data} onClose={() => setModalCross(false)} />
      )}
      {modalInertia && (
        <InertiaCostModal data={data} onClose={() => setModalInertia(false)} />
      )}
      {modalRetention && (
        <RetentionBySegmentModal data={data} onClose={() => setModalRetention(false)} />
      )}
    </>
  )
}
