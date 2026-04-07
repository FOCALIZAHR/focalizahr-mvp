'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO FALLBACK — Selección manual de ocupación cuando no hay match exacto
// 3 cards clickeables con candidatos + opción "continuar sin base"
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ListChecks, ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import { formatDisplayName } from '@/lib/utils/formatName'

interface Candidate {
  socCode: string
  score: number
  occupationTitle: string | null
  taskCount: number
}

interface ActoFallbackProps {
  jobTitle: string
  candidates: Candidate[]
  onSelect: (socCode: string) => void
  onSkip: () => void
  loading: boolean
}

export default memo(function ActoFallback({
  jobTitle,
  candidates,
  onSelect,
  onSkip,
  loading,
}: ActoFallbackProps) {
  const [selected, setSelected] = useState<string | null>(null)

  // Normalize score to percentage (max possible ~ 20-30 for strong matches)
  const maxScore = Math.max(...candidates.map(c => c.score), 1)

  return (
    <div className="fhr-card-glass relative overflow-hidden p-8 md:p-12">
      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        ?
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
          <Search className="w-5 h-5 text-amber-400/70" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white tracking-tight">
          No encontramos un match exacto
        </h2>
        <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg mt-4">
          El cargo <span className="text-white font-medium">{formatDisplayName(jobTitle, 'full')}</span> no coincide directamente
          con ninguna ocupación en nuestra base.
          {candidates.length > 0
            ? ' Estos son los perfiles más cercanos — elige uno como base.'
            : ' Puedes escribir el propósito y las responsabilidades manualmente.'}
        </p>
      </div>

      {/* Candidate cards */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-1 gap-3 mt-8 max-w-lg mx-auto">
          {candidates.map((c, idx) => {
            const isSelected = selected === c.socCode
            const matchPercent = Math.round((c.score / maxScore) * 100)

            return (
              <motion.button
                key={c.socCode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelected(c.socCode)}
                className={`w-full text-left rounded-xl border p-5 transition-all ${
                  isSelected
                    ? 'border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.06)]'
                    : 'border-slate-800/40 bg-slate-900/30 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors ${
                      isSelected ? 'text-cyan-300' : 'text-white'
                    }`}>
                      {c.occupationTitle ?? c.socCode}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-light">
                        <ListChecks className="w-3 h-3" />
                        {c.taskCount} tareas
                      </span>
                    </div>
                  </div>

                  {/* Match indicator */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="w-10 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${matchPercent}%`,
                          backgroundColor: isSelected ? '#22D3EE' : '#64748B',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-600 mt-1 tabular-nums">
                      {matchPercent}%
                    </span>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 pt-3 border-t border-cyan-500/10"
                  >
                    <p className="text-[11px] text-cyan-400/60 font-light">
                      Se usarán las {c.taskCount} tareas de este perfil como base editable.
                    </p>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Coaching tip */}
      <p className="text-xs text-slate-500 font-light text-center mt-8">
        ● {candidates.length > 0
          ? 'Elige un perfil como punto de partida. Podrás editar todo después.'
          : 'Puedes agregar responsabilidades manualmente en los siguientes pasos.'}
      </p>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={onSkip}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors px-4 py-2"
        >
          Continuar sin base
        </button>
        {selected && (
          <PrimaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => onSelect(selected)}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Usar este perfil'}
          </PrimaryButton>
        )}
      </div>
    </div>
  )
})
