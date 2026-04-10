'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE DIAGNOSTICO FLOW — Sub-flujo del card "Diagnostico"
// Secuencia: PORTADA → ANCLA → CASCADA (scroll continuo)
// Reutiliza componentes existentes:
//  - PanelPortada (executive-hub)
//  - AnclaInteligente (executive)
//  - WorkforceCascada (local)
// src/app/dashboard/workforce/components/cascada/WorkforceDiagnosticoFlow.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PanelPortada from '@/app/dashboard/executive-hub/components/PanelPortada'
import AnclaInteligente from '@/components/executive/AnclaInteligente'
import WorkforceCascada from './WorkforceCascada'
import { getPortadaNarrative, buildAnclaComponents } from '../../utils/workforce.utils'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { WorkforceCardType } from '../WorkforceRailCard'

type DiagnosticoStep = 'portada' | 'ancla' | 'cascada'

interface WorkforceDiagnosticoFlowProps {
  data: WorkforceDiagnosticData
  onBack: () => void
  onNavigateTab?: (card: WorkforceCardType) => void
}

export default function WorkforceDiagnosticoFlow({
  data,
  onBack,
  onNavigateTab,
}: WorkforceDiagnosticoFlowProps) {
  const [step, setStep] = useState<DiagnosticoStep>('portada')

  const portadaNarrative = useMemo(() => getPortadaNarrative(data), [data])
  const anclaComponents = useMemo(() => buildAnclaComponents(data), [data])
  const exposureScore = Math.round(data.exposure.avgExposure * 100)

  return (
    <AnimatePresence mode="wait">
      {step === 'portada' && (
        <motion.div
          key="portada"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-3xl mx-auto"
        >
          <PanelPortada
            narrative={{
              prefix: portadaNarrative.prefix,
              highlight: portadaNarrative.highlight,
              suffix: portadaNarrative.suffix,
            }}
            statusBadge={portadaNarrative.statusBadge}
            ctaLabel="Ver evidencia"
            ctaVariant={portadaNarrative.ctaVariant}
            onCtaClick={() => setStep('ancla')}
            coachingTip={portadaNarrative.coachingTip}
          />
        </motion.div>
      )}

      {step === 'ancla' && (
        <motion.div
          key="ancla"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-4xl mx-auto"
        >
          <AnclaInteligente
            score={exposureScore}
            scoreLabel="Exposicion Organizacional"
            components={anclaComponents}
            onContinue={() => setStep('cascada')}
            onBack={() => setStep('portada')}
            ctaLabel="Ver diagnostico completo"
          />
        </motion.div>
      )}

      {step === 'cascada' && (
        <motion.div
          key="cascada"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full"
        >
          <WorkforceCascada data={data} onBackToLobby={onBack} onNavigateTab={onNavigateTab} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
