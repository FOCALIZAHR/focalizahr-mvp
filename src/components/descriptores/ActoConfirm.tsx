'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 4 — CONFIRMAR DESCRIPTOR (Checkout Ejecutivo)
// Resumen colapsado + CTA confirmar + pantalla de éxito post-confirm.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import type { ProposedTask, ProposedCompetency } from '@/lib/services/JobDescriptorService'

interface ActoConfirmProps {
  jobTitle: string
  purpose: string
  tasks: ProposedTask[]
  competencies: ProposedCompetency[]
  employeeCount: number
  departmentName: string | null
  saving: boolean
  confirmed: boolean
  onConfirm: () => void
  onGoToAct: (act: number) => void
  onNextJob: () => void
  onHome: () => void
}

export default memo(function ActoConfirm({
  jobTitle,
  purpose,
  tasks,
  competencies,
  employeeCount,
  departmentName,
  saving,
  confirmed,
  onConfirm,
  onGoToAct,
  onNextJob,
  onHome,
}: ActoConfirmProps) {
  const activeTasks = tasks.filter(t => t.isActive)
  const inactiveTasks = tasks.length - activeTasks.length
  const addedTasks = tasks.filter(t => !t.isFromOnet || (t.isFromOnet && !tasks.slice(0, tasks.length).some((orig, idx) => orig.taskId === t.taskId && idx < tasks.length)))

  // Post-confirmation success screen
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <CheckCircle className="w-16 h-16 text-cyan-400 mb-6" />
        <h2 className="text-2xl font-extralight text-white mb-2">
          Descriptor confirmado
        </h2>
        <p className="text-sm font-light text-slate-400 max-w-md mb-2">
          Este descriptor ahora es el estándar contra el que se evaluará a las{' '}
          <span className="text-white">{employeeCount} personas</span> con este cargo.
        </p>
        <p className="text-xs text-slate-600 mb-10">
          Ahorro estimado: 2.5 horas de consultoría.
        </p>
        <div className="flex items-center gap-4">
          <PrimaryButton onClick={onNextJob}>
            Siguiente cargo →
          </PrimaryButton>
          <SecondaryButton onClick={onHome}>
            Volver al catálogo
          </SecondaryButton>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative space-y-8 min-h-[60vh] flex flex-col">
      {/* Title split */}
      <div>
        <h2 className="text-2xl font-extralight text-white tracking-tight">Confirmar</h2>
        <p className="text-xl font-light fhr-title-gradient mt-0.5">Descriptor</p>
      </div>

      {/* Narrative guide */}
      <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg">
        Revisa el resumen antes de confirmar. Este descriptor será el estándar contra el que se evalúe a las{' '}
        <span className="text-white font-medium">{employeeCount} personas</span> con este cargo.
      </p>

      {/* Summary card */}
      <div className="fhr-card divide-y divide-slate-800/50 overflow-hidden">
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
      <p className="text-xs text-slate-500 font-light">
        ● Este descriptor aplica a {employeeCount} persona{employeeCount !== 1 ? 's' : ''}
        {departmentName ? ` de ${departmentName}` : ''}.
        Una vez confirmado, alimenta evaluaciones y análisis.
      </p>

      {/* CTA */}
      <div className="flex-1 flex items-end pt-4">
        <PrimaryButton onClick={onConfirm} disabled={saving}>
          {saving ? 'Confirmando...' : 'Confirmar Descriptor ✓'}
        </PrimaryButton>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        4
      </div>
    </div>
  )
})
