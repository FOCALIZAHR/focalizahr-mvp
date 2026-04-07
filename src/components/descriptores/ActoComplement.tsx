'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — COMPLEMENTAR EL DESCRIPTOR
// Búsqueda de tareas de otra área + competencias expandibles. 100% opcional.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import DescriptorTaskSearch from './DescriptorTaskSearch'
import type { ProposedTask, ProposedCompetency } from '@/lib/services/JobDescriptorService'

// ── Category labels ──
const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  LEADERSHIP: 'Liderazgo',
  STRATEGIC: 'Estratégica',
  TECHNICAL: 'Técnica',
}

// ── Expandable competency card ──
function CompetencyCard({ competency }: { competency: ProposedCompetency }) {
  const [expanded, setExpanded] = useState(false)
  const hasBehaviors = competency.behaviors && competency.behaviors.length > 0
  const hasDetail = hasBehaviors || competency.description

  return (
    <div className="rounded-lg border border-slate-800/50 bg-slate-900/40 overflow-hidden transition-colors hover:border-slate-700/60">
      <button
        onClick={() => hasDetail && setExpanded(!expanded)}
        className="w-full text-left p-3 flex items-center gap-3"
        disabled={!hasDetail}
      >
        <CheckCircle className="w-4 h-4 text-cyan-400/40 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-light text-slate-300">{competency.name}</span>
          {competency.category && (
            <span className="ml-2 text-[9px] text-slate-600 font-light">
              {CATEGORY_LABELS[competency.category] ?? competency.category}
            </span>
          )}
        </div>
        {hasDetail && (
          expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && hasDetail && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-800/30">
          {competency.description && (
            <p className="text-[11px] text-slate-400 font-light leading-relaxed mt-2">
              {competency.description}
            </p>
          )}
          {hasBehaviors && (
            <div className="mt-2 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-slate-600 font-medium">
                Conductas observables
              </p>
              <ul className="space-y-1">
                {competency.behaviors.map((b, i) => (
                  <li key={i} className="text-[11px] text-slate-400 font-light flex items-start gap-2">
                    <span className="text-cyan-500/40 mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ──

interface ActoComplementProps {
  excludeSocCode?: string
  onAddTask: (task: ProposedTask) => void
  competencies: ProposedCompetency[]
  onNext: () => void
}

export default memo(function ActoComplement({
  excludeSocCode,
  onAddTask,
  competencies,
  onNext,
}: ActoComplementProps) {
  return (
    <div className="fhr-card-glass relative overflow-hidden p-8 md:p-12">
      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        3
      </div>

      {/* Title split */}
      <h2 className="text-2xl font-extralight text-white tracking-tight">Complementar</h2>
      <p className="text-xl font-light fhr-title-gradient mt-0.5">el Descriptor</p>

      {/* Search section */}
      <div className="mt-8">
        <DescriptorTaskSearch
          excludeSocCode={excludeSocCode}
          onAdd={onAddTask}
          onClose={() => {}}
          showClose={false}
        />
      </div>

      {/* Competencies section — expandable cards */}
      {competencies.length > 0 && (
        <section className="mt-8">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
            Competencias esperadas
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {competencies.map(c => (
              <CompetencyCard key={c.code} competency={c} />
            ))}
          </div>
        </section>
      )}

      {/* Coaching tip */}
      <p className="text-xs text-slate-500 font-light mt-8">
        ● Este paso es opcional. Puedes continuar sin agregar nada.
      </p>

      {/* CTA */}
      <div className="mt-6">
        <PrimaryButton onClick={onNext}>
          Siguiente →
        </PrimaryButton>
      </div>
    </div>
  )
})
