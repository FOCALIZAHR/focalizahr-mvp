// ════════════════════════════════════════════════════════════════════════════
// STEP 1: LA EVIDENCIA (The Evidence)
// src/components/calibration/closing/StepEvidence.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3 } from 'lucide-react'
import CalibrationComparisonChart from './CalibrationComparisonChart'

interface StepEvidenceProps {
  originalDistribution: number[]
  calibratedDistribution: number[]
  totalEmployees: number
  onNext: () => void
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

function calculateDeviationCorrection(
  original: number[],
  calibrated: number[]
): number {
  const stdOriginal = calculateStdDev(original)
  const stdCalibrated = calculateStdDev(calibrated)

  if (stdOriginal === 0) return 0

  const improvement = ((stdOriginal - stdCalibrated) / stdOriginal) * 100
  return Math.max(0, Math.round(improvement))
}

export default memo(function StepEvidence({
  originalDistribution,
  calibratedDistribution,
  totalEmployees,
  onNext
}: StepEvidenceProps) {

  const deviationCorrection = useMemo(
    () => calculateDeviationCorrection(originalDistribution, calibratedDistribution),
    [originalDistribution, calibratedDistribution]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <BarChart3 size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Paso 1: La Evidencia
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Corrección de Sesgos
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Compara la distribución original con la calibrada para visualizar
          el impacto de los ajustes realizados.
        </p>
      </div>

      {/* Chart */}
      <CalibrationComparisonChart
        originalDistribution={originalDistribution}
        calibratedDistribution={calibratedDistribution}
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Empleados Evaluados
          </p>
          <p className="text-3xl font-bold text-white">{totalEmployees}</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            Corrección de Desviación
          </p>
          <p className="text-3xl font-bold text-cyan-400">{deviationCorrection}%</p>
        </div>
      </div>

      {/* Next */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl transition-all"
        >
          Continuar al Impacto Financiero
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  )
})
