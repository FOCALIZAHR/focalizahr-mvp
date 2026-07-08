'use client'

// ════════════════════════════════════════════════════════════════════════════
// CLIMA SÍNTESIS — Cierre ejecutivo de la cascada (bloque McKinsey del tipo
// dominante). Clon de ActoSintesis.tsx. Guard self-hiding: si classification
// viene vacío (copy incompleta), no renderiza nada en vez de romper.
// El motor ya seleccionó el dominante e interpoló los 4 slots.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import type { ClimaSynthesis } from '@/types/clima-cascada'
import { ActSeparator, fadeIn } from './shared'

interface ClimaSintesisProps {
  synthesis: ClimaSynthesis
  onContinue: () => void
}

export default memo(function ClimaSintesis({ synthesis, onContinue }: ClimaSintesisProps) {
  // Self-hiding — nunca renderiza un bloque roto mientras la copy se completa.
  if (!synthesis.classification) return null

  return (
    <>
      <ActSeparator label="Síntesis" color="cyan" />

      <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
        {/* Classification */}
        <p className="text-lg font-light text-slate-200 text-center leading-relaxed">
          {synthesis.classification}
        </p>

        {/* Implication */}
        {synthesis.implication && (
          <p className="text-base italic font-light text-slate-300 leading-relaxed text-center">
            {synthesis.implication}
          </p>
        )}

        {/* Path */}
        {synthesis.path && (
          <div className="border-l-2 border-cyan-500/30 pl-4">
            <p className="text-base font-light text-slate-400 leading-relaxed">
              {synthesis.path}
            </p>
          </div>
        )}

        {/* Accountability */}
        {synthesis.accountability && (
          <p className="text-sm italic font-light text-slate-500 text-center">
            {synthesis.accountability}
          </p>
        )}

        {/* Cierre → Lobby (Torre de Control de clima) */}
        <div className="text-center pt-4">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
            Ver el detalle
          </PrimaryButton>
        </div>
      </motion.div>
    </>
  )
})
