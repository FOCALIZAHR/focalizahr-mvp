'use client'

// ════════════════════════════════════════════════════════════════════════════
// WORKFORCE CASCADE ORCHESTRATOR
// Navega linealmente: Portada → Ancla → 4 Actos → Sintesis
// AnimatePresence mode="wait" para transiciones suaves entre pasos
// src/app/dashboard/workforce/components/cascada/WorkforceCascadeOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════

import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useWorkforceCascade } from '../../hooks/useWorkforceCascade'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

import CascadePortada from './CascadePortada'
import CascadeActoAncla from './CascadeActoAncla'
import CascadeActo1Exposicion from './CascadeActo1Exposicion'
import CascadeActo2Inercia from './CascadeActo2Inercia'
import CascadeActo3Hallazgos from './CascadeActo3Hallazgos'
import CascadeActo4Proyeccion from './CascadeActo4Proyeccion'
import CascadeSintesis from './CascadeSintesis'

// ═══════════════════════════════════════════════════════════════════════
// STEP INDICATOR — dots showing progress
// ═══════════════════════════════════════════════════════════════════════

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-all duration-300',
            i === current
              ? 'bg-cyan-400 w-4'
              : i < current
              ? 'bg-cyan-400/40'
              : 'bg-slate-700'
          )}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════

interface WorkforceCascadeOrchestratorProps {
  data: WorkforceDiagnosticData
  onBack: () => void
}

export default function WorkforceCascadeOrchestrator({
  data,
  onBack,
}: WorkforceCascadeOrchestratorProps) {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    computed,
    next,
    back,
  } = useWorkforceCascade(data)

  const exposureScore = Math.round(data.exposure.avgExposure * 100)

  return (
    <div className="w-full flex flex-col items-center min-h-[70vh]">

      {/* Content area — scrollable for long actos */}
      <div className="flex-1 w-full overflow-y-auto py-4 md:py-8">
        <AnimatePresence mode="wait">

          {currentStep === 'portada' && (
            <CascadePortada
              key="portada"
              exposureScore={exposureScore}
              cantidadHallazgos={computed.cantidadHallazgos}
              onContinue={next}
            />
          )}

          {currentStep === 'ancla' && (
            <CascadeActoAncla
              key="ancla"
              data={data}
              computed={computed}
              onContinue={next}
              onBack={back}
            />
          )}

          {currentStep === 'acto1' && (
            <CascadeActo1Exposicion
              key="acto1"
              data={data}
              computed={computed}
              onContinue={next}
              onBack={back}
            />
          )}

          {currentStep === 'acto2' && (
            <CascadeActo2Inercia
              key="acto2"
              data={data}
              onContinue={next}
              onBack={back}
            />
          )}

          {currentStep === 'acto3' && (
            <CascadeActo3Hallazgos
              key="acto3"
              data={data}
              computed={computed}
              onContinue={next}
              onBack={back}
            />
          )}

          {currentStep === 'acto4' && (
            <CascadeActo4Proyeccion
              key="acto4"
              data={data}
              computed={computed}
              onContinue={next}
              onBack={back}
            />
          )}

          {currentStep === 'sintesis' && (
            <CascadeSintesis
              key="sintesis"
              data={data}
              computed={computed}
              onBackToLobby={onBack}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Step indicator — fixed bottom */}
      <div className="py-4">
        <StepIndicator current={stepIndex} total={totalSteps} />
      </div>
    </div>
  )
}
