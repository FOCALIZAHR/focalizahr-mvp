'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 4 — CONFIRMAR DESCRIPTOR (Checkout Ejecutivo)
// Resumen colapsado de los 3 actos previos + CTA confirmar.
// Post-confirmación se maneja en DescriptorVictory (confeti).
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ChevronRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import type { ProposedTask, ProposedCompetency } from '@/lib/services/JobDescriptorService'

interface ActoConfirmProps {
  jobTitle: string
  purpose: string
  tasks: ProposedTask[]
  initialTaskCount: number
  competencies: ProposedCompetency[]
  employeeCount: number
  departmentName: string | null
  saving: boolean
  onConfirm: () => void
  onGoToAct: (act: number) => void
}

export default memo(function ActoConfirm({
  purpose,
  tasks,
  initialTaskCount,
  competencies,
  employeeCount,
  departmentName,
  saving,
  onConfirm,
  onGoToAct,
}: ActoConfirmProps) {
  const activeTasks = tasks.filter(t => t.isActive)
  const inactiveTasks = tasks.length - activeTasks.length
  const addedCount = Math.max(0, tasks.length - initialTaskCount)

  return (
    <div className="fhr-card-glass relative overflow-hidden p-8 md:p-12">
      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        4
      </div>

      {/* Title split */}
      <h2 className="text-2xl font-extralight text-white tracking-tight">Confirmar</h2>
      <p className="text-xl font-light fhr-title-gradient mt-0.5">Descriptor</p>

      {/* Summary sections */}
      <div className="mt-8 rounded-xl border border-slate-800/50 divide-y divide-slate-800/50 overflow-hidden">
        {/* Purpose */}
        <button
          onClick={() => onGoToAct(1)}
          className="w-full text-left p-4 flex items-center gap-4 group hover:bg-slate-800/20 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
              Propósito
            </p>
            <p className="text-sm font-light text-slate-300 truncate">
              {purpose || 'Sin propósito definido'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
        </button>

        {/* Responsibilities */}
        <button
          onClick={() => onGoToAct(2)}
          className="w-full text-left p-4 flex items-center gap-4 group hover:bg-slate-800/20 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
              Responsabilidades
            </p>
            <p className="text-sm font-light text-slate-300">
              {activeTasks.length} tareas confirmadas
              {inactiveTasks > 0 && ` (${inactiveTasks} desmarcadas)`}
              {addedCount > 0 && ` + ${addedCount} agregada${addedCount !== 1 ? 's' : ''} manualmente`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
        </button>

        {/* Competencies */}
        <button
          onClick={() => onGoToAct(3)}
          className="w-full text-left p-4 flex items-center gap-4 group hover:bg-slate-800/20 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
              Competencias
            </p>
            <p className="text-sm font-light text-slate-300">
              {competencies.length} competencia{competencies.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
        </button>
      </div>

      {/* Coaching tip */}
      <p className="text-xs text-slate-500 font-light mt-8">
        ● Este descriptor aplica a {employeeCount} persona{employeeCount !== 1 ? 's' : ''}
        {departmentName ? ` de ${departmentName}` : ''}.
        Una vez confirmado, alimenta evaluaciones y análisis.
      </p>

      {/* CTA */}
      <div className="mt-6">
        <PrimaryButton onClick={onConfirm} disabled={saving}>
          {saving ? 'Confirmando...' : 'Confirmar Descriptor ✓'}
        </PrimaryButton>
      </div>
    </div>
  )
})
