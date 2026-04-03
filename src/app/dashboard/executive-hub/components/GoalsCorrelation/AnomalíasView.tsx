'use client'

// ════════════════════════════════════════════════════════════════════════════
// ANOMALÍAS VIEW — Vista completa de todas las anomalías detectadas
// src/app/dashboard/executive-hub/components/GoalsCorrelation/AnomalíasView.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cards colapsables por severity order. Glassmorphism + Tesla left border.
// Patrón: Progressive Disclosure (collapsed by default, expand on click)
// Design: FocalizaHR — cyan + amber + purple + slate
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { GoalsCorrelationDataV2, SubFinding } from './GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'
import { getCompensacionNarrative } from '@/config/narratives/CompensacionNarrativeDictionary'

// ════════════════════════════════════════════════════════════════════════════
// SEVERITY ORDER — fixed, most severe first
// ════════════════════════════════════════════════════════════════════════════

const SEVERITY_ORDER = [
  '1B_fugaProductiva',
  '2B_bonosInjustificados',
  '1D_sostenibilidad',
  '2C_evaluadorProtege',
  '2A_noPuedeVsNoQuiere',
  '2E_sucesionRota',
  '3B_sesgoSistematico',
  '3A_pearsonBajo',
  '3D_calibracionInjusta',
  '4_blastRadius',
]

const COMP_QUADRANT_MAP: Record<string, string> = {
  '1D_sostenibilidad': 'HIDDEN_PERFORMER',
  '2B_bonosInjustificados': 'PERCEPTION_BIAS',
  '2A_noPuedeVsNoQuiere': 'DOUBLE_RISK',
}

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
  const [expanded, setExpanded] = useState<string | null>(null)

  // All findings from all segments, sorted by severity
  const allFindings = data.segments.flatMap(s => s.subFindings)
  const sorted = [...allFindings].sort((a, b) => {
    const aIdx = SEVERITY_ORDER.indexOf(a.key)
    const bIdx = SEVERITY_ORDER.indexOf(b.key)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })

  const totalAnomalias = sorted.reduce((s, f) => s + f.count, 0)
  const totalRiesgo =
    data.quadrantCounts.perceptionBias +
    data.quadrantCounts.hiddenPerformer +
    data.quadrantCounts.doubleRisk

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }

  return (
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
            {totalAnomalias} casos · {totalRiesgo} personas en cuadrantes de riesgo
          </p>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Cards */}
      <div className="space-y-2">
        {sorted.map((finding, idx) => (
          <AnomalíaCard
            key={finding.key}
            finding={finding}
            index={idx}
            totalAnomalias={totalAnomalias}
            isExpanded={expanded === finding.key}
            onToggle={() => toggle(finding.key)}
            onViewPersons={() => onOpenFinding(finding)}
          />
        ))}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm font-light text-slate-500">
            Sin anomalías detectadas en este ciclo.
          </p>
        </div>
      )}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ANOMALÍA CARD — Collapsible with Tesla left border
// ════════════════════════════════════════════════════════════════════════════

const AnomalíaCard = memo(function AnomalíaCard({
  finding,
  index,
  totalAnomalias,
  isExpanded,
  onToggle,
  onViewPersons,
}: {
  finding: SubFinding
  index: number
  totalAnomalias: number
  isExpanded: boolean
  onToggle: () => void
  onViewPersons: () => void
}) {
  const [compExpanded, setCompExpanded] = useState(false)

  const cardConfig = SUBFINDING_CARDS[finding.key]
  const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null
  const compEntry = COMP_QUADRANT_MAP[finding.key]
    ? getCompensacionNarrative(COMP_QUADRANT_MAP[finding.key])
    : null

  if (!cardConfig || !dictNarrative) return null

  const pct = totalAnomalias > 0
    ? Math.round((finding.count / totalAnomalias) * 100)
    : 0

  const isOrgLevel = finding.segmentId === '3_ORGANIZACIONAL'
  const gerencias = isOrgLevel
    ? (finding.meta?.gerencias as { name: string; employeeCount?: number }[]) ?? []
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="relative rounded-xl overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-slate-800/30"
    >
      {/* Tesla left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: dictNarrative.teslaColor }}
      />

      {/* Header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/20 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-base font-light text-slate-200">
            {dictNarrative.headline}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-light">
            {finding.count} persona{finding.count !== 1 ? 's' : ''} · {pct}% de las anomalías
          </p>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-slate-600 transition-transform flex-shrink-0 ml-4',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {/* Expandible content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Description */}
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                {dictNarrative.description}
              </p>

              {/* Org-level: gerencias affected */}
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
                  className="group inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Ver {isOrgLevel ? 'detalle' : `${finding.employees.length} persona${finding.employees.length !== 1 ? 's' : ''}`}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {compEntry && (
                  <button
                    onClick={() => setCompExpanded(!compExpanded)}
                    className="group inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Ver perspectiva de compensaciones
                    <ArrowRight className={cn(
                      'w-3 h-3 transition-transform',
                      compExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'
                    )} />
                  </button>
                )}
              </div>

              {/* Compensaciones inline expand */}
              <AnimatePresence>
                {compExpanded && compEntry && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-800/30 pt-3 space-y-4">
                      <div className="border-l-2 border-cyan-500/30 pl-3">
                        <p className="text-[10px] font-medium text-white/80 uppercase tracking-widest mb-1.5">
                          La Observación
                        </p>
                        <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                          {compEntry.observacion}
                        </p>
                      </div>
                      <div className="border-l-2 border-purple-500/30 pl-3">
                        <p className="text-[10px] font-medium text-white/80 uppercase tracking-widest mb-1.5">
                          La Decisión de Valor
                        </p>
                        <p className="text-[11px] font-light text-slate-300 leading-relaxed">
                          {compEntry.decisionValor}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})
