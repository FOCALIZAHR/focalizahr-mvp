// ════════════════════════════════════════════════════════════════════════════
// STEP 2: EL COSTO (The Cost)
// src/components/calibration/closing/StepCost.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, DollarSign, AlertTriangle } from 'lucide-react'
import FinancialImpactTicker from './FinancialImpactTicker'

interface StepCostProps {
  originalBonusFactor: number
  calibratedBonusFactor: number
  affectedEmployees: number
  isAuthorized: boolean
  onAuthorize: (authorized: boolean) => void
  onNext: () => void
  onBack: () => void
}

export default memo(function StepCost({
  originalBonusFactor,
  calibratedBonusFactor,
  affectedEmployees,
  isAuthorized,
  onAuthorize,
  onNext,
  onBack
}: StepCostProps) {

  const delta = calibratedBonusFactor - originalBonusFactor
  const deltaPct = originalBonusFactor > 0
    ? (delta / originalBonusFactor) * 100
    : 0
  const requiresCFOApproval = Math.abs(deltaPct) > 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <DollarSign size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Paso 2: Impacto Financiero
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Impacto en Compensaciones
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Revisa el cambio en el factor de bono promedio antes de confirmar.
        </p>
      </div>

      {/* Ticker */}
      <FinancialImpactTicker
        originalFactor={originalBonusFactor}
        calibratedFactor={calibratedBonusFactor}
        affectedEmployees={affectedEmployees}
      />

      {/* CFO Warning */}
      {requiresCFOApproval && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              Variación significativa detectada
            </p>
            <p className="text-xs text-amber-400/80 mt-1">
              El cambio de {Math.abs(deltaPct).toFixed(1)}% en el factor de bono
              puede requerir aprobación del CFO o Dirección Financiera.
            </p>
          </div>
        </div>
      )}

      {/* Authorization Checkbox */}
      <div
        onClick={() => onAuthorize(!isAuthorized)}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
          isAuthorized
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
        )}
      >
        <div className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
          isAuthorized
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-600'
        )}>
          {isAuthorized && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            Autorizo el impacto presupuestario
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmo que he revisado las implicaciones financieras de esta calibración.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-white text-sm font-medium transition-all"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <button
          onClick={onNext}
          disabled={!isAuthorized}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all',
            isAuthorized
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          Continuar a Confirmación
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  )
})
