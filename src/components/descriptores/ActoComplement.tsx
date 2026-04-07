'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — COMPLEMENTAR EL DESCRIPTOR
// Búsqueda de tareas de otra área + competencias (read-only). 100% opcional.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { CheckCircle } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'
import DescriptorTaskSearch from './DescriptorTaskSearch'
import type { ProposedTask, ProposedCompetency } from '@/lib/services/JobDescriptorService'

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
    <div className="relative space-y-8 min-h-[60vh] flex flex-col">
      {/* Title split */}
      <div>
        <h2 className="text-2xl font-extralight text-white tracking-tight">Complementar</h2>
        <p className="text-xl font-light fhr-title-gradient mt-0.5">el Descriptor</p>
      </div>

      {/* Narrative guide */}
      <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg">
        ¿Hay algo que esta persona hace en tu empresa que no apareció en las tareas anteriores?
        Tú conoces tu operación mejor que nadie.
      </p>

      {/* Search section */}
      <div>
        <DescriptorTaskSearch
          excludeSocCode={excludeSocCode}
          onAdd={onAddTask}
          onClose={() => {}}
        />
        <p className="text-xs text-slate-600 font-light mt-2">
          En Chile, muchos cargos incluyen tareas de otras áreas.
          Un Jefe de Finanzas que también hace RRHH no es raro.
        </p>
      </div>

      {/* Competencies section */}
      {competencies.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
            Competencias esperadas
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {competencies.map(c => (
              <div key={c.code} className="fhr-card p-3 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-cyan-400/40 flex-shrink-0" />
                <span className="text-xs font-light text-slate-300">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Coaching tip */}
      <p className="text-xs text-slate-500 font-light">
        ● Este paso es opcional. Puedes continuar sin agregar nada.
      </p>

      {/* CTAs */}
      <div className="flex-1 flex items-end gap-3 pt-4">
        <SecondaryButton onClick={onNext}>
          Continuar sin agregar
        </SecondaryButton>
        <PrimaryButton onClick={onNext}>
          Siguiente →
        </PrimaryButton>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        3
      </div>
    </div>
  )
})
