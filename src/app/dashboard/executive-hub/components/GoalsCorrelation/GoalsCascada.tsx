'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CASCADA — Orquestador de Actos
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsCascada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Dossier Ejecutivo — 6 actos condicionales + modales.
// Cada acto vive en cascada/Acto*.tsx. Este archivo orquesta.
// Patrón clonado de PLTalentExecutiveBriefing.tsx.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'

import type { GoalsCorrelationDataV2, SubFinding } from './GoalsCorrelation.types'
import { COMP_QUADRANT_MAP, SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import type { CompensacionNarrativeEntry } from '@/config/narratives/CompensacionNarrativeDictionary'

import GoalsFindingModal from './GoalsFindingModal'
import GoalsStarsModal from './GoalsStarsModal'
import CompensacionModal from './CompensacionModal'

import ActoPanorama from './cascada/ActoPanorama'
import ActoAnomalias from './cascada/ActoAnomalias'
import ActoEstrellas from './cascada/ActoEstrellas'
import ActoCargosCriticos from './cascada/ActoCargosCriticos'
import ActoOrganizacion from './cascada/ActoOrganizacion'
import ActoSintesis from './cascada/ActoSintesis'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface GoalsCascadaProps {
  data: GoalsCorrelationDataV2
  onOpenScatter: () => void
  onOpenAnomalias: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT — Orchestrator
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalsCascada({ data, onOpenScatter, onOpenAnomalias }: GoalsCascadaProps) {
  // ── Modal state ──
  const [modalFinding, setModalFinding] = useState<SubFinding | null>(null)
  const [showStarsModal, setShowStarsModal] = useState(false)
  const [showCriticalModal, setShowCriticalModal] = useState(false)
  const [compModal, setCompModal] = useState<{ entry: CompensacionNarrativeEntry; headline: string; color: string } | null>(null)

  // ── Derived data ──
  const { topAlerts, totals, segments, byGerencia, stars, criticalPositions } = data
  const criticalPositionIds = new Set(criticalPositions.positions.map(p => p.employee.id))
  const allFindings = segments.flatMap(s => s.subFindings)
  const orgFindings = segments.find(s => s.id === '3_ORGANIZACIONAL')?.subFindings ?? []

  // ── Callbacks ──
  const openCompModal = (findingKey: string) => {
    const quadrantKey = COMP_QUADRANT_MAP[findingKey]
    if (!quadrantKey) return
    const entry = getCompensacionNarrative(quadrantKey)
    if (!entry) return
    const narrativeKey = SUBFINDING_TO_NARRATIVE[findingKey]
    const dictNarr = narrativeKey ? getNarrative(narrativeKey) : null
    setCompModal({
      entry,
      headline: dictNarr?.headline ?? '',
      color: dictNarr?.teslaColor ?? '#22D3EE',
    })
  }

  return (
    <>
      <div className="space-y-24 pb-12">
        <ActoPanorama
          totalEvaluados={totals.totalEvaluados}
          perceptionBiasCount={data.quadrantCounts.perceptionBias}
          hiddenPerformerCount={data.quadrantCounts.hiddenPerformer}
        />

        <ActoAnomalias
          topAlerts={topAlerts}
          totalEvaluados={totals.totalEvaluados}
          totalFinancialRisk={totals.totalFinancialRisk}
          perceptionBiasCount={data.quadrantCounts.perceptionBias}
          hiddenPerformerCount={data.quadrantCounts.hiddenPerformer}
          doubleRiskCount={data.quadrantCounts.doubleRisk}
          allFindingsCount={allFindings.length}
          onOpenAnomalias={onOpenAnomalias}
          onViewPersons={setModalFinding}
          onViewCompensacion={openCompModal}
        />

        <ActoEstrellas
          total={stars.total}
          withHighGoals={stars.withHighGoals}
          percentage={stars.percentage}
          onViewDetail={() => setShowStarsModal(true)}
        />

        <ActoCargosCriticos
          total={criticalPositions.total}
          withHighGoals={criticalPositions.withHighGoals}
          percentage={criticalPositions.percentage}
          onViewDetail={() => setShowCriticalModal(true)}
        />

        <ActoOrganizacion
          byGerencia={byGerencia}
          orgFindings={orgFindings}
          onViewPersons={setModalFinding}
        />

        <ActoSintesis
          data={data}
          onOpenScatter={onOpenScatter}
        />
      </div>

      {/* ═══ MODALS ═══ */}
      {modalFinding && (
        <GoalsFindingModal
          finding={modalFinding}
          onClose={() => setModalFinding(null)}
        />
      )}

      {showStarsModal && (
        <GoalsStarsModal
          title="Estrellas del 9-Box"
          subtitle={`${stars.total} estrella${stars.total !== 1 ? 's' : ''} · ${stars.percentage}% cumplen metas`}
          type="stars"
          percentage={stars.percentage}
          teslaColor="#F59E0B"
          persons={stars.employees.map(e => ({ employee: e }))}
          criticalPositionIds={criticalPositionIds}
          onClose={() => setShowStarsModal(false)}
        />
      )}

      {compModal && (
        <CompensacionModal
          entry={compModal.entry}
          findingHeadline={compModal.headline}
          teslaColor={compModal.color}
          onClose={() => setCompModal(null)}
        />
      )}

      {showCriticalModal && (
        <GoalsStarsModal
          title="Cargos Críticos"
          subtitle={`${criticalPositions.total} posicion${criticalPositions.total !== 1 ? 'es' : ''} · ${criticalPositions.percentage}% cumplen metas`}
          type="critical"
          percentage={criticalPositions.percentage}
          teslaColor="#A78BFA"
          persons={criticalPositions.positions.map(p => ({
            employee: p.employee,
            positionTitle: p.positionTitle,
            benchStrength: p.benchStrength,
          }))}
          onClose={() => setShowCriticalModal(false)}
        />
      )}
    </>
  )
})
