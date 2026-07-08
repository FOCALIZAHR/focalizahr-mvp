// src/components/goals/cycles/CloseActDecisions.tsx
// ════════════════════════════════════════════════════════════════════════════
// Acto 2 (Decisiones) del modal de cierre — Gate D.5-UI SP2.
// Presentacional puro: lista de metas accionables con selector de balde por fila
// (segmented, no dropdown) + control "aplicar a todas" (bulk-first, 182 metas en
// piloto) + sección read-only "Ya en revisión". El estado (Map) y el payload viven
// en el orquestador (CloseCycleModal) — acá solo se renderiza y se emiten eventos.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'
import {
  ClosureGoal,
  CycleClosureDecisionType,
  DECISION_OPTIONS,
} from './cycleClosure'

// Segmented de 3 baldes. `value` undefined en el bulk (acción, no selección).
function Segmented({
  value,
  onChange,
}: {
  value?: CycleClosureDecisionType
  onChange: (v: CycleClosureDecisionType) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {DECISION_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2 py-1.5 rounded-md border text-[11px] leading-tight text-center transition-all',
            value === opt.value
              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
              : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface CloseActDecisionsProps {
  actionable: ClosureGoal[]
  inReview: ClosureGoal[]
  decisions: Map<string, CycleClosureDecisionType>
  onSetDecision: (goalId: string, decision: CycleClosureDecisionType) => void
  onApplyToAll: (decision: CycleClosureDecisionType) => void
  onContinue: () => void
  onCancel: () => void
}

export default function CloseActDecisions({
  actionable,
  inReview,
  decisions,
  onSetDecision,
  onApplyToAll,
  onContinue,
  onCancel,
}: CloseActDecisionsProps) {
  const [reviewOpen, setReviewOpen] = useState(false)

  return (
    <div className="space-y-5">
      {/* Narrativa + aplicar a todas */}
      <div>
        <p className="text-base font-light text-slate-300 leading-relaxed">
          Decidí qué hacer con las{' '}
          <span className="text-white">{actionable.length}</span> metas sin completar.
          Por defecto se dejan como están.
        </p>
        <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Aplicar a todas
          </p>
          <Segmented onChange={onApplyToAll} />
        </div>
      </div>

      {/* Lista de accionables */}
      <div className="max-h-[42vh] overflow-y-auto divide-y divide-slate-800/40 rounded-lg border border-slate-800/40">
        {actionable.map((g) => (
          <div key={g.id} className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-light text-white truncate">{g.title}</p>
                <p className="text-xs font-light text-slate-500 truncate">
                  {g.owner?.fullName ?? 'Sin responsable'}
                  {g.department?.displayName ? ` · ${g.department.displayName}` : ''}
                </p>
              </div>
              <span className="text-xs font-light text-slate-400 tabular-nums shrink-0">
                {Math.round(g.progress ?? 0)}%
              </span>
            </div>
            <Segmented
              value={decisions.get(g.id)}
              onChange={(d) => onSetDecision(g.id, d)}
            />
          </div>
        ))}
      </div>

      {/* Sección read-only "Ya en revisión" */}
      {inReview.length > 0 && (
        <div className="rounded-lg border border-slate-800/40">
          <button
            type="button"
            onClick={() => setReviewOpen((v) => !v)}
            className="w-full flex items-center gap-2 p-3 text-left text-sm font-light text-slate-400 hover:text-white transition-colors"
          >
            {reviewOpen ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
            {inReview.length}{' '}
            {inReview.length === 1 ? 'meta ya en revisión' : 'metas ya en revisión'}
            <span className="text-[10px] text-slate-600">(en bandeja de aprobación)</span>
          </button>
          {reviewOpen && (
            <div className="divide-y divide-slate-800/40 border-t border-slate-800/40">
              {inReview.map((g) => (
                <div key={g.id} className="p-3">
                  <p className="text-sm font-light text-slate-300 truncate">{g.title}</p>
                  <p className="text-xs font-light text-slate-500 truncate">
                    {g.owner?.fullName ?? 'Sin responsable'}
                    {g.department?.displayName ? ` · ${g.department.displayName}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <GhostButton onClick={onCancel} fullWidth>
          Cerrar más tarde
        </GhostButton>
        <PrimaryButton onClick={onContinue} fullWidth>
          Continuar
        </PrimaryButton>
      </div>
    </div>
  )
}
