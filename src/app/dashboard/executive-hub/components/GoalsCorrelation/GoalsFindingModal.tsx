'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS FINDING MODAL — Drill-down a personas de un sub-finding
// src/app/dashboard/executive-hub/components/GoalsCorrelation/GoalsFindingModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portal a document.body (patrón PLTalent modals)
// Badge pairs + concentración + coaching tip
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { SubFinding, NarrativeEmployee, ResolvedBadge } from './GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from './GoalsCorrelation.constants'
import { formatCurrency, getConcentrationText } from './GoalsCorrelation.utils'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

// Badge pair config (same as NarrativasTab)
type BadgePairKey = 'goals' | 'score360' | 'roleFit' | 'engagement' | 'risk' | 'evaluatorStatus'

const BADGE_PAIRS: Record<string, { left: BadgePairKey; leftLabel: string; right: BadgePairKey; rightLabel: string }> = {
  '1B_fugaProductiva': { left: 'risk', leftLabel: 'Riesgo', right: 'goals', rightLabel: 'Metas' },
  '1D_sostenibilidad': { left: 'roleFit', leftLabel: 'RoleFit', right: 'goals', rightLabel: 'Metas' },
  '2B_bonosInjustificados': { left: 'score360', leftLabel: '360°', right: 'goals', rightLabel: 'Metas' },
  '2C_evaluadorProtege': { left: 'evaluatorStatus', leftLabel: 'Evaluador', right: 'goals', rightLabel: 'Metas' },
  '2A_noPuedeVsNoQuiere': { left: 'roleFit', leftLabel: 'RoleFit', right: 'goals', rightLabel: 'Metas' },
  '2E_sucesionRota': { left: 'roleFit', leftLabel: 'RoleFit', right: 'goals', rightLabel: 'Metas' },
}

interface GoalsFindingModalProps {
  finding: SubFinding
  onClose: () => void
}

export default memo(function GoalsFindingModal({ finding, onClose }: GoalsFindingModalProps) {
  const cardConfig = SUBFINDING_CARDS[finding.key]
  const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null
  const badgePair = BADGE_PAIRS[finding.key]
  const concentration = getConcentrationText(finding.employees)
  const isNoPuedeNoQuiere = finding.key === '2A_noPuedeVsNoQuiere'

  // Manager grouping for 2C
  const byManager = finding.key === '2C_evaluadorProtege' && Array.isArray(finding.meta?.byManager)
    ? (finding.meta!.byManager as { managerId: string; managerName: string; count: number }[])
    : null

  // No sabe / no quiere split
  const noSabeIds = isNoPuedeNoQuiere ? new Set((finding.meta?.noSabe as string[]) ?? []) : null
  const noQuiereIds = isNoPuedeNoQuiere ? new Set((finding.meta?.noQuiere as string[]) ?? []) : null

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!cardConfig) return null

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Tesla line */}
        {dictNarrative && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(90deg, transparent, ${dictNarrative.teslaColor}, transparent)`,
              boxShadow: `0 0 20px ${dictNarrative.teslaColor}`,
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <p className="text-lg font-light text-slate-200">
              {dictNarrative?.headline ?? cardConfig.title}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {finding.count} persona{finding.count !== 1 ? 's' : ''}
              {finding.financialImpact > 0 && (
                <> · <span className={cn('font-mono', cardConfig.textColor)}>{formatCurrency(finding.financialImpact)}</span></>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">

          {/* Manager grouping for 2C */}
          {byManager && byManager.length > 0 && (
            <div className="mb-4 pb-4 border-b border-slate-800/30">
              {byManager.map(mg => (
                <p key={mg.managerId} className="text-[11px] font-light text-red-400/80">
                  {mg.count} de {finding.count} reportan a <span className="font-medium text-slate-300">{mg.managerName}</span>
                </p>
              ))}
            </div>
          )}

          {/* No Puede / No Quiere split */}
          {isNoPuedeNoQuiere && noSabeIds && noQuiereIds ? (
            <div className="space-y-6">
              {noSabeIds.size > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                    No puede — brecha de competencias ({noSabeIds.size})
                  </p>
                  <PersonList
                    employees={finding.employees.filter(e => noSabeIds.has(e.id))}
                    badgePair={badgePair}
                  />
                </div>
              )}
              {noQuiereIds.size > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                    No quiere — problema motivacional ({noQuiereIds.size})
                  </p>
                  <PersonList
                    employees={finding.employees.filter(e => noQuiereIds.has(e.id))}
                    badgePair={badgePair}
                  />
                </div>
              )}
            </div>
          ) : (
            <PersonList
              employees={finding.employees}
              badgePair={badgePair}
              showCost={cardConfig.showCost}
            />
          )}

          {/* Concentración */}
          {concentration && (
            <p className="text-[10px] text-slate-500 italic mt-4 pt-4 border-t border-slate-800/30">
              Concentración: {concentration}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )

  return createPortal(content, document.body)
})

// ════════════════════════════════════════════════════════════════════════════
// BADGE + PERSON LIST (from NarrativasTab, adapted for modal)
// ════════════════════════════════════════════════════════════════════════════

function Badge({ badge, label }: { badge: ResolvedBadge; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border',
      badge.bgClass, badge.textClass, badge.borderClass
    )}>
      <span className="text-[8px] text-slate-500 font-normal">{label}</span>
      {badge.labelShort}
    </span>
  )
}

function PersonList({
  employees,
  badgePair,
  showCost = false,
}: {
  employees: NarrativeEmployee[]
  badgePair?: { left: BadgePairKey; leftLabel: string; right: BadgePairKey; rightLabel: string }
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
