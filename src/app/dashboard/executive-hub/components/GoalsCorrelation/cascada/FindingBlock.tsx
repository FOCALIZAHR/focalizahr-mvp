// ════════════════════════════════════════════════════════════════════════════
// FINDING BLOCK — Hallazgo narrativo completo
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/FindingBlock.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import type { SubFinding } from '../GoalsCorrelation.types'
import { SUBFINDING_CARDS, SUBFINDING_TO_NARRATIVE } from '../GoalsCorrelation.constants'
import { formatCurrency } from '../GoalsCorrelation.utils'
import { getNarrative } from '@/config/narratives/GoalsNarrativeDictionary'
import { SubtleLink } from './shared'

// ════════════════════════════════════════════════════════════════════════════

interface FindingBlockProps {
  finding: SubFinding
  index: number
  onViewPersons: () => void
  onViewCompensacion?: () => void
  isOrgLevel?: boolean
}

export const FindingBlock = memo(function FindingBlock({
  finding,
  index,
  onViewPersons,
  onViewCompensacion,
  isOrgLevel = false,
}: FindingBlockProps) {
  const cardConfig = SUBFINDING_CARDS[finding.key]
  const narrativeKey = SUBFINDING_TO_NARRATIVE[finding.key]
  const dictNarrative = narrativeKey ? getNarrative(narrativeKey) : null

  if (!cardConfig || !dictNarrative) return null

  const gerencias = isOrgLevel
    ? (finding.meta?.gerencias as { name: string; employeeCount?: number }[]) ?? []
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Tesla line accent */}
      <div
        className="w-12 h-[2px] mb-6"
        style={{
          background: dictNarrative.teslaColor,
          boxShadow: `0 0 12px ${dictNarrative.teslaColor}40`,
        }}
      />

      {/* Headline */}
      <p className="text-xl font-light text-slate-200 mb-4">
        {dictNarrative.headline}
      </p>

      {/* Description */}
      <p className="text-base font-light text-slate-400 leading-relaxed mb-4">
        {dictNarrative.description}
      </p>

      {/* Count + financial */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-mono font-medium text-slate-200">
          {finding.count} {isOrgLevel ? 'gerencia' : 'persona'}{finding.count !== 1 ? 's' : ''}
        </span>
        {finding.financialImpact > 0 && (
          <>
            <span className="text-slate-700">·</span>
            <span className="text-sm font-mono font-medium text-purple-400">
              {formatCurrency(finding.financialImpact)}
            </span>
          </>
        )}
      </div>

      {/* Org-level: gerencias affected */}
      {gerencias.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {gerencias.map(g => (
            <span
              key={g.name}
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full border',
                cardConfig.borderColor, cardConfig.textColor,
                'bg-slate-900/50'
              )}
            >
              {g.name}
            </span>
          ))}
        </div>
      )}

      {/* Coaching tip as blockquote */}
      <div className="border-l-2 border-cyan-500/30 pl-4 mb-4">
        <p className="text-sm italic font-light text-slate-300 leading-relaxed">
          {dictNarrative.coachingTip}
        </p>
      </div>

      {/* Links — primario cyan, secundario discreto */}
      <div className="space-y-1.5">
        <SubtleLink onClick={onViewPersons}>
          Ver {isOrgLevel ? 'detalle' : `${finding.employees.length} persona${finding.employees.length !== 1 ? 's' : ''}`}
        </SubtleLink>

        {onViewCompensacion && (
          <div>
            <button
              onClick={onViewCompensacion}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Perspectiva de compensaciones
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
})
