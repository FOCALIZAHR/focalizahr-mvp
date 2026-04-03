'use client'

// ════════════════════════════════════════════════════════════════════════════
// ANOMALÍAS VIEW — Treemap visual proporcional
// src/app/dashboard/executive-hub/components/GoalsCorrelation/AnomalíasView.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón: TalentTreemap — mosaico proporcional al count.
// "El tamaño comunica proporción, la narrativa comunica urgencia."
// Design: cyan protagonista, sin colores semáforo. Hover glow cyan.
// Bloques <5% se agrupan en "otros".
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { GoalsCorrelationDataV2, SubFinding } from './GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'
import CompensacionModal from './CompensacionModal'

// ════════════════════════════════════════════════════════════════════════════
// SEVERITY ORDER + COMPENSATION MAP
// ════════════════════════════════════════════════════════════════════════════

const SEVERITY_ORDER = [
  '1B_fugaProductiva', '2B_bonosInjustificados', '1D_sostenibilidad',
  '2C_evaluadorProtege', '2A_noPuedeVsNoQuiere', '2E_sucesionRota',
  '3B_sesgoSistematico', '3A_pearsonBajo', '3D_calibracionInjusta', '4_blastRadius',
]

const COMP_QUADRANT_MAP: Record<string, string> = {
  '1D_sostenibilidad': 'HIDDEN_PERFORMER',
  '2B_bonosInjustificados': 'PERCEPTION_BIAS',
  '2A_noPuedeVsNoQuiere': 'DOUBLE_RISK',
}

const MIN_PCT_FOR_BLOCK = 5 // Below this → grouped in "otros"

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface AnomalíasViewProps {
  data: GoalsCorrelationDataV2
  onBack: () => void
  onOpenFinding: (finding: SubFinding) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function AnomalíasView({
  data,
  onBack,
  onOpenFinding,
}: AnomalíasViewProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [compModal, setCompModal] = useState<{ entry: { observacion: string; decisionValor: string }; headline: string; color: string } | null>(null)

  // All findings sorted by severity, count > 0
  const allFindings = data.segments.flatMap(s => s.subFindings)
  const sorted = [...allFindings]
    .sort((a, b) => {
      const aIdx = SEVERITY_ORDER.indexOf(a.key)
      const bIdx = SEVERITY_ORDER.indexOf(b.key)
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
    })
    .filter(f => f.count > 0)

  const totalCount = sorted.reduce((s, f) => s + f.count, 0)

  // Split: visible blocks (≥5%) vs grouped "otros"
  const visible = sorted.filter(f => totalCount > 0 && (f.count / totalCount) * 100 >= MIN_PCT_FOR_BLOCK)
  const otros = sorted.filter(f => totalCount > 0 && (f.count / totalCount) * 100 < MIN_PCT_FOR_BLOCK)
  const otrosCount = otros.reduce((s, f) => s + f.count, 0)

  // Layout: row 1 = top 2 by count, row 2 = rest
  const bySize = [...visible].sort((a, b) => b.count - a.count)
  const row1 = bySize.slice(0, 2)
  const row2 = bySize.slice(2)

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al análisis
          </button>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-extralight text-white tracking-tight">
              Anomalías{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                detectadas
              </span>
            </h2>
            <p className="text-sm font-light text-slate-500 mt-1.5">
              {totalCount} casos en {sorted.length} tipos de anomalía
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Treemap */}
        <AnimatePresence mode="wait">
          {expandedKey === '__otros__' ? (
            /* EXPANDED: otros (findings menores) */
            <motion.div
              key="exp-otros"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative rounded-xl overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-slate-800/30"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-500/40" />
              <div className="pl-6 pr-5 py-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-light text-slate-200">Hallazgos menores</p>
                    <p className="text-xs text-slate-500 font-light mt-1">
                      {otrosCount} persona{otrosCount !== 1 ? 's' : ''} en {otros.length} tipo{otros.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedKey(null)}
                    className="text-slate-600 hover:text-slate-400 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {otros.map(f => {
                    const nKey = SUBFINDING_TO_NARRATIVE[f.key]
                    const narr = nKey ? getNarrative(nKey) : null
                    if (!narr) return null
                    return (
                      <button
                        key={f.key}
                        onClick={() => setExpandedKey(f.key)}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-left hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-light text-slate-300 truncate">{narr.headline}</p>
                        </div>
                        <span className="text-xs font-mono text-cyan-400/70 flex-shrink-0 ml-3">
                          {f.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : expandedKey ? (
            <ExpandedBlock
              key={`exp-${expandedKey}`}
              finding={sorted.find(f => f.key === expandedKey)!}
              totalCount={totalCount}
              onClose={() => setExpandedKey(null)}
              onViewPersons={() => {
                const f = sorted.find(f => f.key === expandedKey)
                if (f) onOpenFinding(f)
              }}
              onViewCompensacion={COMP_QUADRANT_MAP[expandedKey] ? () => openCompModal(expandedKey) : undefined}
            />
          ) : (
            <motion.div
              key="mosaic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {/* Row 1: top 2 by count */}
              {row1.length > 0 && (
                <div className="flex gap-2 items-stretch">
                  {row1.map((f, i) => (
                    <motion.div
                      key={f.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{ flex: Math.max(f.count, 1) }}
                      className="min-w-0"
                    >
                      <MosaicBlock
                        finding={f}
                        totalCount={totalCount}
                        onClick={() => setExpandedKey(f.key)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Row 2: rest + otros */}
              {(row2.length > 0 || otrosCount > 0) && (
                <div className="flex gap-2 items-stretch">
                  {row2.map((f, i) => (
                    <motion.div
                      key={f.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (row1.length + i) * 0.06 }}
                      style={{ flex: Math.max(f.count, 1) }}
                      className="min-w-0"
                    >
                      <MosaicBlock
                        finding={f}
                        totalCount={totalCount}
                        onClick={() => setExpandedKey(f.key)}
                      />
                    </motion.div>
                  ))}

                  {/* "Otros" grouped block — clickeable, expande lista */}
                  {otrosCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (row1.length + row2.length) * 0.06 }}
                      style={{ flex: Math.max(otrosCount, 1) }}
                      className="min-w-0"
                    >
                      <button
                        onClick={() => setExpandedKey('__otros__')}
                        className={cn(
                          'w-full h-full rounded-xl p-3 flex flex-col justify-center text-left transition-all group',
                          'bg-slate-900/40 border border-slate-800/20',
                          'hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]',
                        )}
                      >
                        <p className="text-lg font-extralight text-slate-500">{otrosCount}</p>
                        <p className="text-[9px] text-slate-600 font-light mt-0.5">
                          {otros.length} tipo{otros.length !== 1 ? 's' : ''} menores
                        </p>
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty */}
        {sorted.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-light text-slate-500">Sin anomalías detectadas.</p>
          </div>
        )}
      </div>

      {/* Compensacion modal */}
      {compModal && (
        <CompensacionModal
          entry={compModal.entry}
          findingHeadline={compModal.headline}
          teslaColor={compModal.color}
          onClose={() => setCompModal(null)}
        />
      )}
    </>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MOSAIC BLOCK — Collapsed proportional tile
// ════════════════════════════════════════════════════════════════════════════
// Design: ALL blocks use cyan left border (no semáforo).
// Hover: cyan glow border. Click: expand.
// ════════════════════════════════════════════════════════════════════════════

function MosaicBlock({
  finding,
  totalCount,
  onClick,
}: {
  finding: SubFinding
  totalCount: number
  onClick: () => void
}) {
  const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null

  if (!dictNarrative) return null

  const pct = totalCount > 0 ? Math.round((finding.count / totalCount) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-full text-left rounded-xl relative overflow-hidden transition-all cursor-pointer group',
        'bg-slate-900/60 backdrop-blur-sm',
        'border border-slate-800/30',
        'hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]',
      )}
    >
      {/* Left border — CYAN only */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-500/40" />

      <div className="pl-5 pr-4 py-4">
        {/* Count — número grande, el dato principal */}
        <p className="text-3xl md:text-4xl font-extralight text-cyan-400 tracking-tight">
          {finding.count}
        </p>
        <p className="text-[10px] text-slate-600 font-light mt-0.5">
          persona{finding.count !== 1 ? 's' : ''}
        </p>

        {/* Headline — always show, truncate if needed */}
        <p className="text-sm font-light text-slate-300 mt-2 leading-snug line-clamp-2">
          {dictNarrative.headline}
        </p>

        {/* Proportion bar — thin, cyan, sin % visible */}
        <div className="mt-3">
          <div className="h-[2px] bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Tooltip on hover — % + coaching tip preview */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-56 text-left">
        <p className="text-[10px] text-slate-300 leading-relaxed">
          {dictNarrative.headline}
        </p>
        <p className="text-[9px] text-slate-500 mt-1">
          {finding.count} persona{finding.count !== 1 ? 's' : ''} · {pct}% de las anomalías
        </p>
        <p className="text-[9px] text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
          {dictNarrative.coachingTip}
        </p>
      </div>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPANDED BLOCK — Full width detail with narrative + links
// ════════════════════════════════════════════════════════════════════════════

function ExpandedBlock({
  finding,
  totalCount,
  onClose,
  onViewPersons,
  onViewCompensacion,
}: {
  finding: SubFinding
  totalCount: number
  onClose: () => void
  onViewPersons: () => void
  onViewCompensacion?: () => void
}) {
  const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null

  if (!dictNarrative) return null

  const pct = totalCount > 0 ? Math.round((finding.count / totalCount) * 100) : 0
  const isOrgLevel = finding.segmentId === '3_ORGANIZACIONAL'
  const gerencias = isOrgLevel
    ? (finding.meta?.gerencias as { name: string; employeeCount?: number }[]) ?? []
    : []

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-xl overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-cyan-500/20"
    >
      {/* Left border — cyan */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400" />

      <div className="pl-6 pr-5 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl md:text-4xl font-extralight text-cyan-400 tracking-tight">
              {finding.count}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-light">
              {pct}% de las anomalías · {finding.count} persona{finding.count !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Headline */}
        <p className="text-lg font-light text-slate-200">
          {dictNarrative.headline}
        </p>

        {/* Description */}
        <p className="text-sm italic font-light text-slate-300 leading-relaxed">
          {dictNarrative.description}
        </p>

        {/* Org-level gerencias */}
        {gerencias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {gerencias.map(g => (
              <span
                key={g.name}
                className="text-[9px] px-2 py-0.5 rounded-full border border-slate-700/30 text-slate-400 bg-slate-900/50"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* Coaching tip */}
        <div className="border-l-2 border-cyan-500/30 pl-4">
          <p className="text-sm font-light text-slate-400 leading-relaxed">
            {dictNarrative.coachingTip}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <button
            onClick={onViewPersons}
            className="group inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Ver {isOrgLevel ? 'detalle' : `${finding.employees.length} persona${finding.employees.length !== 1 ? 's' : ''}`}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {onViewCompensacion && (
            <button
              onClick={onViewCompensacion}
              className="group inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver perspectiva de compensaciones
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
