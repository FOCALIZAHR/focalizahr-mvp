'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOALS CORRELATION — Tab Narrativas
// src/app/dashboard/executive-hub/components/GoalsCorrelation/tabs/NarrativasTab.tsx
// ════════════════════════════════════════════════════════════════════════════
// 5 cards expandibles con $$$ — el valor central del Insight #7
// Cada card: header con count + costo → expandible con personas + concentración
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalsNarratives, NarrativeEmployee } from '../GoalsCorrelation.types'
import { NARRATIVE_CARDS } from '../GoalsCorrelation.constants'
import { formatCurrency, getConcentrationText } from '../GoalsCorrelation.utils'

interface NarrativasTabProps {
  narratives: GoalsNarratives
}

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

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.04 }}
            className={cn(
              'rounded-xl border overflow-hidden',
              'bg-slate-800/30 backdrop-blur-xl',
              card.borderColor
            )}
          >
            {/* Header — clickable */}
            <button
              onClick={() => toggle(card.key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', card.dotColor)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-200">{card.title}</p>
                    <span className={cn('text-xs font-mono font-medium', card.textColor)}>
                      {count}
                    </span>
                  </div>
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

            {/* Expandible — lista de personas */}
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
                    {/* Descripción */}
                    <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                      {card.description}
                    </p>

                    {/* No Sabe vs No Quiere — split view */}
                    {isNoSabeNoQuiere ? (
                      <div className="space-y-4">
                        {narratives.noSabeVsNoQuiere.noSabe.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                              No sabe — brecha de competencias ({narratives.noSabeVsNoQuiere.noSabe.length})
                            </p>
                            <PersonList employees={narratives.noSabeVsNoQuiere.noSabe} showRoleFit />
                          </div>
                        )}
                        {narratives.noSabeVsNoQuiere.noQuiere.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                              No quiere — problema motivacional ({narratives.noSabeVsNoQuiere.noQuiere.length})
                            </p>
                            <PersonList employees={narratives.noSabeVsNoQuiere.noQuiere} showRoleFit />
                          </div>
                        )}
                      </div>
                    ) : (
                      <PersonList employees={employees} showCost={card.showCost} />
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
// PERSON LIST — Reutilizable dentro de cada card
// ════════════════════════════════════════════════════════════════════════════

function PersonList({
  employees,
  showCost = false,
  showRoleFit = false,
}: {
  employees: NarrativeEmployee[]
  showCost?: boolean
  showRoleFit?: boolean
}) {
  return (
    <div className="space-y-1">
      {employees.map(emp => (
        <div key={emp.id} className="flex items-center justify-between py-2 border-b border-slate-800/20 last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-light text-slate-200 truncate">{emp.name}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {emp.department} · Metas {emp.goalsPercent !== null ? `${Math.round(emp.goalsPercent)}%` : '—'}
              {showRoleFit && emp.roleFitScore !== null ? ` · RoleFit ${Math.round(emp.roleFitScore)}%` : ''}
            </p>
          </div>
          {showCost && emp.turnoverCost && (
            <p className="text-xs font-mono text-purple-400 flex-shrink-0 ml-3">
              {formatCurrency(emp.turnoverCost)}
            </p>
          )}
          {!showCost && (
            <p className="text-xs font-mono text-slate-500 flex-shrink-0 ml-3">
              360°: {emp.score360.toFixed(1)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
