// ════════════════════════════════════════════════════════════════════════════
// CLOSING CEREMONY MODAL - Wizard Orchestrator
// src/components/calibration/closing/ClosingCeremonyModal.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import StepEvidence from './StepEvidence'
import StepCost from './StepCost'
import StepVerdict from './StepVerdict'

interface ClosingCeremonyModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  originalDistribution: number[]
  calibratedDistribution: number[]
  originalBonusFactor: number
  calibratedBonusFactor: number
  totalEmployees: number
  totalAdjustments: number
}

export default function ClosingCeremonyModal({
  isOpen,
  onClose,
  sessionId,
  originalDistribution,
  calibratedDistribution,
  originalBonusFactor,
  calibratedBonusFactor,
  totalEmployees,
  totalAdjustments
}: ClosingCeremonyModalProps) {

  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [financialAuthorized, setFinancialAuthorized] = useState(false)

  async function handleConfirm() {
    const response = await fetch(
      `/api/calibration/sessions/${sessionId}/close`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Error al cerrar sesión')
    }

    // Redirect to session page (now closed) and refresh
    router.push(`/dashboard/performance/calibration/sessions/${sessionId}`)
    router.refresh()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-[#0B1120] rounded-2xl border border-slate-800 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Cerrar Sesión de Calibración</h2>
            <p className="text-sm text-slate-400 mt-1">
              Paso {currentStep} de 3
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-900 shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StepEvidence
                key="step-evidence"
                originalDistribution={originalDistribution}
                calibratedDistribution={calibratedDistribution}
                totalEmployees={totalEmployees}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 2 && (
              <StepCost
                key="step-cost"
                originalBonusFactor={originalBonusFactor}
                calibratedBonusFactor={calibratedBonusFactor}
                affectedEmployees={totalEmployees}
                isAuthorized={financialAuthorized}
                onAuthorize={setFinancialAuthorized}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <StepVerdict
                key="step-verdict"
                totalAdjustments={totalAdjustments}
                sessionId={sessionId}
                onConfirm={handleConfirm}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
