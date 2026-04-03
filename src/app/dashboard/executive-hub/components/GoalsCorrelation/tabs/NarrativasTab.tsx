'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Segment Tab (V2)
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/NarrativasTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// Renders sub-findings for a single segment (Entregaron / No Entregaron)
// Reusable: receives GoalsSegment, renders each SubFinding as expandable card
// Badge pair = the visual anomaly (two classifications that shouldn't be together)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalsSegment, NarrativeEmployee, ResolvedBadge, SubFinding } from '../GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from '../GoalsCorrelation.constants'
import { formatCurrency, getConcentrationText } from '../GoalsCorrelation.utils'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

interface SegmentTabProps {
  segment: GoalsSegment
}

// ════════════════════════════════════════════════════════════════════════════
// BADGE PAIR CONFIG — qué par de clasificaciones muestra cada sub-finding
// ════════════════════════════════════════════════════════════════════════════

type BadgePairKey = 'goals' | 'score360' | 'roleFit' | 'engagement' | 'risk' | 'evaluatorStatus'

interface BadgePairConfig {
  left: BadgePairKey
  leftLabel: string
  right: BadgePairKey
  rightLabel: string
}

const BADGE_PAIRS: Record<string, BadgePairConfig> = {
  '1B_fugaProductiva': {
    left: 'risk', leftLabel: 'Riesgo',
    right: 'goals', rightLabel: 'Metas',
  },
  '1D_sostenibilidad': {
    left: 'roleFit', leftLabel: 'RoleFit',
    right: 'goals', rightLabel: 'Metas',
  },
  '2B_bonosInjustificados': {
    left: 'score360', leftLabel: '360°',
    right: 'goals', rightLabel: 'Metas',
  },
  '2C_evaluadorProtege': {
    left: 'evaluatorStatus', leftLabel: 'Evaluador',
    right: 'goals', rightLabel: 'Metas',
  },
  '2A_noPuedeVsNoQuiere': {
    left: 'roleFit', leftLabel: 'RoleFit',
    right: 'goals', rightLabel: 'Metas',
  },
  '2E_sucesionRota': {
    left: 'roleFit', leftLabel: 'RoleFit',
    right: 'goals', rightLabel: 'Metas',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function SegmentTab({ segment }: SegmentTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }

  if (segment.subFindings.length === 0) {
    const healthyMessages: Record<string, { title: string; detail: string }> = {
      '1_ENTREGARON': {
        title: 'Quienes entregaron están correctamente gestionados.',
        detail: `${segment.totalEmployees} personas cumplieron metas sobre 80%. No se detectaron brechas de reconocimiento, riesgo de fuga ni sostenibilidad comprometida.`,
      },
      '2_NO_ENTREGARON': {
        title: 'Sin anomalías en quienes no entregaron.',
        detail: `${segment.totalEmployees} personas con metas bajo 40%. No se detectaron evaluaciones infladas, evaluadores indulgentes ni brechas de competencia significativas.`,
      },
      '3_ORGANIZACIONAL': {
        title: 'Vista organizacional sin alertas sistémicas.',
        detail: 'Las evaluaciones están alineadas con resultados a nivel de gerencia. Sin sesgo sistemático detectado.',
      },
    }
    const msg = healthyMessages[segment.id] ?? { title: 'Sin anomalías detectadas.', detail: '' }

    return (
      <div className="fhr-card relative overflow-hidden p-6">
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)', boxShadow: '0 0 12px #22D3EE' }}
        />
        <p className="text-sm font-light text-cyan-400">{msg.title}</p>
        <p className="text-[11px] font-light text-slate-500 mt-2 leading-relaxed">{msg.detail}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Segment header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          {segment.label} — {segment.threshold}
        </p>
        <span className="text-xs font-mono text-slate-400">
          {segment.totalEmployees} personas
        </span>
      </div>

      {segment.subFindings.map((finding, idx) => {
        const cardConfig = SUBFINDING_CARDS[finding.key]
        if (!cardConfig) return null

        const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
        const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null
        const badgePair = BADGE_PAIRS[finding.key]
        const isExpanded = expanded === finding.key
        const concentration = getConcentrationText(finding.employees)
        const isNoPuedeNoQuiere = finding.key === '2A_noPuedeVsNoQuiere'

        return (
          <motion.div
            key={finding.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.04 }}
            className={cn(
              'rounded-xl border overflow-hidden relative',
              'bg-slate-800/30 backdrop-blur-xl',
              cardConfig.borderColor
            )}
          >
            {/* Tesla line — color by severity */}
            {dictNarrative && (
              <div
                className="absolute top-0 left-0 right-0 h-[2px] z-10"
                style={{
                  background: `linear-gradient(90deg, transparent, ${dictNarrative.teslaColor}, transparent)`,
                  boxShadow: `0 0 15px ${dictNarrative.teslaColor}`,
                }}
              />
            )}

            {/* Header — clickable */}
            <button
              onClick={() => toggle(finding.key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cardConfig.dotColor)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-light text-slate-200">{cardConfig.title}</p>
                    <span className={cn('text-xs font-mono font-medium', cardConfig.textColor)}>
                      {finding.count}
                    </span>
                  </div>
                  {/* Headline from dictionary */}
                  {dictNarrative && (
                    <p className="text-[11px] font-light text-slate-400 mt-0.5">
                      {dictNarrative.headline}
                    </p>
                  )}
                  {cardConfig.showCost && finding.financialImpact > 0 && (
                    <p className={cn('text-xs font-mono mt-0.5', cardConfig.textColor)}>
                      {formatCurrency(finding.financialImpact)} en riesgo
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-slate-600 transition-transform flex-shrink-0',
                isExpanded && 'rotate-180'
              )} />
            </button>

            {/* Expandible — lista de personas con badge pairs */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    {/* Narrative description from dictionary */}
                    <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                      {dictNarrative?.description ?? ''}
                    </p>

                    {/* Coaching tip */}
                    {dictNarrative?.coachingTip && (
                      <div className="flex gap-2 items-start rounded-lg bg-slate-900/50 px-3 py-2 border border-slate-800/30">
                        <span className="text-[10px] text-cyan-500 font-medium flex-shrink-0 mt-px">TIP</span>
                        <p className="text-[10px] font-light text-slate-500 leading-relaxed">
                          {dictNarrative.coachingTip}
                        </p>
                      </div>
                    )}

                    {/* No Puede vs No Quiere — split view */}
                    {isNoPuedeNoQuiere ? (
                      <NoPuedeNoQuiereSplit finding={finding} badgePair={badgePair} />
                    ) : (
                      <PersonList employees={finding.employees} badgePair={badgePair} showCost={cardConfig.showCost} />
                    )}

                    {/* Manager grouping for 2C */}
                    {finding.key === '2C_evaluadorProtege' && Array.isArray(finding.meta?.byManager) && (
                      <div className="pt-2 border-t border-slate-800/30">
                        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Por evaluador</p>
                        {(finding.meta!.byManager as { managerId: string; managerName: string; count: number }[]).map((mg) => (
                          <p key={mg.managerId} className="text-[10px] font-light text-amber-400/80">
                            {mg.count} de {finding.count} reportan a <span className="text-slate-300 font-medium">{mg.managerName}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Concentración por gerencia */}
                    {concentration && (
                      <p className="text-[10px] text-slate-500 italic pt-2 border-t border-slate-800/30">
                        Concentración: {concentration}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// NO PUEDE VS NO QUIERE — Split view using meta
// ════════════════════════════════════════════════════════════════════════════

function NoPuedeNoQuiereSplit({ finding, badgePair }: { finding: SubFinding; badgePair?: BadgePairConfig }) {
  const noSabeIds = new Set((finding.meta?.noSabe as string[]) ?? [])
  const noQuiereIds = new Set((finding.meta?.noQuiere as string[]) ?? [])
  const noSabe = finding.employees.filter(e => noSabeIds.has(e.id))
  const noQuiere = finding.employees.filter(e => noQuiereIds.has(e.id))

  return (
    <div className="space-y-4">
      {noSabe.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            No puede — brecha de competencias ({noSabe.length})
          </p>
          <PersonList employees={noSabe} badgePair={badgePair} showCost={false} />
        </div>
      )}
      {noQuiere.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            No quiere — problema motivacional ({noQuiere.length})
          </p>
          <PersonList employees={noQuiere} badgePair={badgePair} showCost={false} />
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BADGE — Mini classification pill
// ════════════════════════════════════════════════════════════════════════════

function Badge({ badge, label }: { badge: ResolvedBadge; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border',
        badge.bgClass,
        badge.textClass,
        badge.borderClass
      )}
    >
      <span className="text-[8px] text-slate-500 font-normal">{label}</span>
      {badge.labelShort}
    </span>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PERSON LIST — Badge pairs make the anomaly obvious
// ════════════════════════════════════════════════════════════════════════════

function PersonList({
  employees,
  badgePair,
  showCost = false,
}: {
  employees: NarrativeEmployee[]
  badgePair?: BadgePairConfig
  showCost?: boolean
}) {
  return (
    <div className="space-y-1">
      {employees.map(emp => {
        const leftBadge = badgePair ? emp.badges[badgePair.left] : null
        const rightBadge = badgePair ? emp.badges[badgePair.right] : null

        return (
          <div key={emp.id} className="flex items-center justify-between py-2 border-b border-slate-800/20 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-light text-slate-200 truncate">{emp.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{emp.department}</p>
            </div>

            {/* Badge pair — the visual anomaly */}
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
              {leftBadge && <Badge badge={leftBadge} label={badgePair!.leftLabel} />}
              {rightBadge && <Badge badge={rightBadge} label={badgePair!.rightLabel} />}
              {showCost && emp.turnoverCost && emp.turnoverCost > 0 && (
                <span className="text-[10px] font-mono text-purple-400 ml-1">
                  {formatCurrency(emp.turnoverCost)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
