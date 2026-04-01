'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Narrativas
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/NarrativasTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// 5 cards expandibles — el valor central del Insight #7
// Cada card: Tesla line + headline → expandible con badge pairs + concentración
// Badge pair = la anomalía visual (dos clasificaciones que no deberían estar juntas)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalsNarratives, NarrativeEmployee, ResolvedBadge } from '../GoalsCorrelation.types'
import { NARRATIVE_CARDS } from '../GoalsCorrelation.constants'
import { formatCurrency, getConcentrationText } from '../GoalsCorrelation.utils'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'

interface NarrativasTabProps {
  narratives: GoalsNarratives
}

// ════════════════════════════════════════════════════════════════════════════
// BADGE PAIR CONFIG — qué par de clasificaciones muestra cada narrativa
// ════════════════════════════════════════════════════════════════════════════

type BadgePairKey = 'goals' | 'score360' | 'roleFit' | 'engagement' | 'risk'

interface BadgePairConfig {
  left: BadgePairKey
  leftLabel: string
  right: BadgePairKey
  rightLabel: string
}

const BADGE_PAIRS: Record<string, BadgePairConfig> = {
  fugaProductiva: {
    left: 'risk', leftLabel: 'Riesgo',
    right: 'goals', rightLabel: 'Metas',
  },
  bonosSinRespaldo: {
    left: 'score360', leftLabel: '360°',
    right: 'goals', rightLabel: 'Metas',
  },
  talentoInvisible: {
    left: 'score360', leftLabel: '360°',
    right: 'goals', rightLabel: 'Metas',
  },
  ejecutoresDesconectados: {
    left: 'engagement', leftLabel: 'Engagement',
    right: 'goals', rightLabel: 'Metas',
  },
  noSabeVsNoQuiere: {
    left: 'roleFit', leftLabel: 'RoleFit',
    right: 'goals', rightLabel: 'Metas',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function NarrativasTab({ narratives }: NarrativasTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (key: string) => {
    setExpanded(expanded === key ? null : key)
  }

  // Get count and employees for each narrative
  const getCardData = (key: string): { count: number; employees: NarrativeEmployee[]; cost?: number } => {
    switch (key) {
      case 'fugaProductiva':
        return { count: narratives.fugaProductiva.count, employees: narratives.fugaProductiva.employees, cost: narratives.fugaProductiva.totalCost }
      case 'bonosSinRespaldo':
        return { count: narratives.bonosSinRespaldo.count, employees: narratives.bonosSinRespaldo.employees, cost: narratives.bonosSinRespaldo.estimatedBonusRisk }
      case 'talentoInvisible':
        return { count: narratives.talentoInvisible.count, employees: narratives.talentoInvisible.employees }
      case 'ejecutoresDesconectados':
        return { count: narratives.ejecutoresDesconectados.count, employees: narratives.ejecutoresDesconectados.employees }
      case 'noSabeVsNoQuiere':
        return {
          count: narratives.noSabeVsNoQuiere.noSabe.length + narratives.noSabeVsNoQuiere.noQuiere.length,
          employees: [...narratives.noSabeVsNoQuiere.noSabe, ...narratives.noSabeVsNoQuiere.noQuiere],
        }
      default:
        return { count: 0, employees: [] }
    }
  }

  const hasAnyData = NARRATIVE_CARDS.some(card => getCardData(card.key).count > 0)

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm font-light">Sin desconexiones detectadas.</p>
        <p className="text-xs text-slate-600 mt-1">Las evaluaciones 360° están alineadas con el cumplimiento de metas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {NARRATIVE_CARDS.map((card, idx) => {
        const { count, employees, cost } = getCardData(card.key)
        if (count === 0) return null

        const isExpanded = expanded === card.key
        const concentration = getConcentrationText(employees)
        const isNoSabeNoQuiere = card.key === 'noSabeVsNoQuiere'
        const dictNarrative = getNarrative(card.key)
        const badgePair = BADGE_PAIRS[card.key]

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.04 }}
            className={cn(
              'rounded-xl border overflow-hidden relative',
              'bg-slate-800/30 backdrop-blur-xl',
              card.borderColor
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
              onClick={() => toggle(card.key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', card.dotColor)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-light text-slate-200">{card.title}</p>
                    <span className={cn('text-xs font-mono font-medium', card.textColor)}>
                      {count}
                    </span>
                  </div>
                  {/* Headline from dictionary */}
                  {dictNarrative && (
                    <p className="text-[11px] font-light text-slate-400 mt-0.5">
                      {dictNarrative.headline}
                    </p>
                  )}
                  {card.showCost && cost && cost > 0 && (
                    <p className={cn('text-xs font-mono mt-0.5', card.textColor)}>
                      {formatCurrency(cost)} en riesgo
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
                      {dictNarrative?.description ?? card.description}
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

                    {/* No Sabe vs No Quiere — split view */}
                    {isNoSabeNoQuiere ? (
                      <div className="space-y-4">
                        {narratives.noSabeVsNoQuiere.noSabe.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                              No sabe — brecha de competencias ({narratives.noSabeVsNoQuiere.noSabe.length})
                            </p>
                            <PersonList employees={narratives.noSabeVsNoQuiere.noSabe} badgePair={badgePair} showCost={false} />
                          </div>
                        )}
                        {narratives.noSabeVsNoQuiere.noQuiere.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                              No quiere — problema motivacional ({narratives.noSabeVsNoQuiere.noQuiere.length})
                            </p>
                            <PersonList employees={narratives.noSabeVsNoQuiere.noQuiere} badgePair={badgePair} showCost={false} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <PersonList employees={employees} badgePair={badgePair} showCost={card.showCost} />
                    )}

                    {/* Concentración */}
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
