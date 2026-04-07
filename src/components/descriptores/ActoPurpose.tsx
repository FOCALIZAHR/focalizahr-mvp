'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 1 — PROPÓSITO DEL CARGO
// Texto editable con aprobación explícita. Narrativa guiada por confianza.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'

interface ActoPurposeProps {
  purpose: string
  onPurposeChange: (value: string) => void
  approved: boolean
  onApprove: () => void
  matchConfidence: string | null
  employeeCount: number
  onNext: () => void
}

export default memo(function ActoPurpose({
  purpose,
  onPurposeChange,
  approved,
  onApprove,
  matchConfidence,
  employeeCount,
  onNext,
}: ActoPurposeProps) {
  const [editing, setEditing] = useState(false)
  const isHighConfidence = matchConfidence === 'HIGH'
  const hasPurpose = purpose.trim().length > 0

  function handleApprove() {
    onApprove()
    setEditing(false)
  }

  function handleEdit() {
    setEditing(true)
  }

  function handleDoneEditing() {
    if (purpose.trim()) {
      setEditing(false)
      onApprove()
    }
  }

  return (
    <div className="relative space-y-8 min-h-[60vh] flex flex-col">
      {/* Title split */}
      <div>
        <h2 className="text-2xl font-extralight text-white tracking-tight">Propósito</h2>
        <p className="text-xl font-light fhr-title-gradient mt-0.5">del Cargo</p>
      </div>

      {/* Narrative guide */}
      <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg">
        {isHighConfidence
          ? 'Hemos identificado este cargo con alta coincidencia en bases de datos internacionales. Este propósito refleja lo que típicamente hace alguien en esta posición.'
          : hasPurpose
          ? 'Este cargo tiene un nombre único en tu empresa. Te sugerimos un propósito base que puedes editar completamente.'
          : 'No encontramos un propósito predefinido para este cargo. Escríbelo a continuación.'}
      </p>

      {/* Purpose card */}
      <div className="fhr-card p-5 space-y-3">
        {hasPurpose && !editing && (
          <span className="text-[9px] text-cyan-400/60 border border-cyan-500/20 rounded-full px-2 py-0.5">
            Sugerido por FocalizaHR
          </span>
        )}

        {editing || !hasPurpose ? (
          <div className="space-y-3">
            <textarea
              value={purpose}
              onChange={e => onPurposeChange(e.target.value)}
              rows={3}
              placeholder="Describe el propósito principal de este cargo..."
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 font-light leading-relaxed resize-none focus:border-cyan-500/30 focus:outline-none"
            />
            <button
              onClick={handleDoneEditing}
              disabled={!purpose.trim()}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors disabled:text-slate-600"
            >
              Listo
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-light text-slate-300 leading-relaxed">
              {purpose}
            </p>
            <div className="flex items-center gap-4 pt-1">
              {!approved ? (
                <>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-cyan-400/60">
                  <Check className="w-3.5 h-3.5" />
                  Aprobado
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Coaching tip */}
      <p className="text-xs text-slate-500 font-light">
        ● {employeeCount} persona{employeeCount !== 1 ? 's' : ''} comparten este cargo.
        Lo que definas aquí aplica a toda{employeeCount !== 1 ? 's' : ''}.
      </p>

      {/* CTA */}
      <div className="flex-1 flex items-end pt-4">
        <PrimaryButton
          onClick={onNext}
          disabled={!approved && !(!hasPurpose && purpose.trim().length === 0)}
        >
          {approved ? 'Siguiente →' : 'Aprueba el propósito para continuar'}
        </PrimaryButton>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        1
      </div>
    </div>
  )
})
