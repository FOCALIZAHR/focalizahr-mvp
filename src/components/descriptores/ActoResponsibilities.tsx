'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — RESPONSABILIDADES DEL CARGO
// Wrapper de DescriptorTaskList con narrativa guiada.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import DescriptorTaskList from './DescriptorTaskList'
import type { ProposedTask } from '@/lib/services/JobDescriptorService'

interface ActoResponsibilitiesProps {
  tasks: ProposedTask[]
  onToggle: (taskId: string) => void
  onNext: () => void
}

export default memo(function ActoResponsibilities({
  tasks,
  onToggle,
  onNext,
}: ActoResponsibilitiesProps) {
  const activeTasks = useMemo(() => tasks.filter(t => t.isActive).length, [tasks])
  const inactiveTasks = tasks.length - activeTasks

  return (
    <div className="relative space-y-8 min-h-[60vh] flex flex-col">
      {/* Title split */}
      <div>
        <h2 className="text-2xl font-extralight text-white tracking-tight">Responsabilidades</h2>
        <p className="text-xl font-light fhr-title-gradient mt-0.5">del Cargo</p>
      </div>

      {/* Narrative guide */}
      <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg">
        Desmarca las tareas que esta persona <span className="text-white font-medium">no hace</span> en tu empresa. Es más fácil quitar lo que sobra que escribir desde cero.
      </p>

      {/* Counter */}
      <p className="text-xs text-slate-500 font-light">
        {activeTasks} de {tasks.length} activas
      </p>

      {/* Task list (neutral — no betaScore, no exposure) */}
      <DescriptorTaskList tasks={tasks} onToggle={onToggle} />

      {/* Dynamic narrative */}
      <p className="text-xs text-slate-500 font-light">
        {inactiveTasks === 0
          ? '● Todas las tareas aplican. Puedes continuar.'
          : inactiveTasks <= 3
          ? `● Has ajustado ${inactiveTasks} tarea${inactiveTasks !== 1 ? 's' : ''}.`
          : `● Has ajustado ${inactiveTasks} tareas. Eso mejora la precisión del análisis.`}
      </p>

      {/* CTA — always enabled */}
      <div className="flex-1 flex items-end pt-4">
        <PrimaryButton onClick={onNext}>
          Siguiente →
        </PrimaryButton>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        2
      </div>
    </div>
  )
})
