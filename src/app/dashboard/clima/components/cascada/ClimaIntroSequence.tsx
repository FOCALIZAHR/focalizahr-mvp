'use client'

// ════════════════════════════════════════════════════════════════════════════
// CLIMA INTRO SEQUENCE — La Cascada Ejecutiva que PRECEDE al Lobby (Gate 4.5a).
// Máquina de 3 sub-estados: Portada → Acto Ancla → Cascada (Actos + Síntesis).
// Al terminar (o saltar) llama onDone → el hook descarta la intro y muestra el
// Lobby. El resultado narrativo se deriva read-time con ClimaSynthesisEngine
// (función pura sobre la ClimaResultsResponse ya cargada — sin API nueva).
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ClimaResultsResponse } from '@/types/clima'
import { ClimaSynthesisEngine } from '@/lib/services/clima/ClimaSynthesisEngine'
import { buildClimaAnclaComponents } from '@/lib/utils/buildClimaAnclaComponents'
import AnclaInteligente from '@/components/executive/AnclaInteligente'
import ClimaPortada from './ClimaPortada'
import ClimaCascada from './ClimaCascada'

type IntroStep = 'portada' | 'ancla' | 'cascada'

interface ClimaIntroSequenceProps {
  results: ClimaResultsResponse
  /** Descarta la intro y entra al Lobby. */
  onDone: () => void
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

export default memo(function ClimaIntroSequence({ results, onDone }: ClimaIntroSequenceProps) {
  const [step, setStep] = useState<IntroStep>('portada')
  const result = useMemo(() => ClimaSynthesisEngine.generate(results), [results])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-10">
      {/* Saltar la intro → Lobby directo */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onDone}
          className="text-xs font-light text-slate-500 hover:text-slate-400 transition-colors"
        >
          Saltar al detalle
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 'portada' && (
          <motion.div key="portada" {...fade}>
            <ClimaPortada
              hook={result.portada.hook}
              ctaLabel={result.portada.ctaLabel}
              favorability={results.orgFavorability}
              onContinue={() => setStep('ancla')}
            />
          </motion.div>
        )}

        {step === 'ancla' && (
          <motion.div key="ancla" {...fade}>
            <AnclaInteligente
              score={result.ancla.score ?? 0}
              scoreLabel={result.ancla.scoreLabel}
              components={buildClimaAnclaComponents(result.ancla.nodes)}
              onContinue={() => setStep('cascada')}
              onBack={() => setStep('portada')}
              ctaLabel="Ver diagnóstico completo"
            />
          </motion.div>
        )}

        {step === 'cascada' && (
          <motion.div key="cascada" {...fade}>
            <ClimaCascada
              acts={result.acts}
              synthesis={result.synthesis}
              onDone={onDone}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
