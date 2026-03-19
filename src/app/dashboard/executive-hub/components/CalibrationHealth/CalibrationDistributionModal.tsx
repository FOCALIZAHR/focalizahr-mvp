'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, Check, AlertTriangle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DistBucket, GerenciaHeatmapRow } from './CalibrationHealth.types'
import { BellCurveChart } from './shared/BellCurveChart'
import { bucketsToChartData } from './CalibrationHealth.utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CalibrationDistributionModalProps {
  isOpen: boolean
  onClose: () => void
  orgDistribution: { total: number; buckets: DistBucket[] }
  gerencias?: GerenciaHeatmapRow[]
  selectedGerencia: string | null
  onSelectGerencia: (gerencia: string | null) => void
}

// Target distribution (curva normal ideal McKinsey 10-20-40-20-10)
const TARGET_DISTRIBUTION = [
  { level: 'Bajo', target: 10 },
  { level: 'Desarrollo', target: 20 },
  { level: 'Sólido', target: 40 },
  { level: 'Alto', target: 20 },
  { level: 'Excepcional', target: 10 },
]

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVE GENERATOR (adaptado de DistributionModal)
// ════════════════════════════════════════════════════════════════════════════

function generateInsight(distribution: number[]): { text: string; type: 'success' | 'warning' | 'info' } {
  if (!distribution || distribution.length !== 5) {
    return { text: 'Sin datos de distribución disponibles.', type: 'info' }
  }

  const total = distribution.reduce((a, b) => a + b, 0)
  if (total === 0) {
    return { text: 'Aún no hay evaluaciones completadas.', type: 'info' }
  }

  // Detectar desviaciones significativas (>15%)
  const deviations: string[] = []
  TARGET_DISTRIBUTION.forEach((target, i) => {
    const diff = distribution[i] - target.target
    if (diff > 15) {
      deviations.push(`+${diff}% en ${target.level}`)
    } else if (diff < -15) {
      deviations.push(`${diff}% en ${target.level}`)
    }
  })

  if (deviations.length === 0) {
    return {
      text: 'Distribución balanceada. Los datos son confiables para decisiones de promoción y desarrollo.',
      type: 'success'
    }
  }

  // Detectar sesgo hacia arriba o abajo
  const highEnd = distribution[3] + distribution[4] // Alto + Excepcional
  const lowEnd = distribution[0] + distribution[1] // Bajo + Desarrollo

  if (highEnd > 50) {
    return {
      text: `Sesgo hacia arriba detectado (${highEnd}% en Alto/Excepcional). No diferencia el talento superior del promedio. Revisar antes de calibrar.`,
      type: 'warning'
    }
  }

  if (lowEnd > 50) {
    return {
      text: `Evaluaciones muy estrictas (${lowEnd}% en Bajo/Desarrollo). ¿Los estándares son realistas? Revisar con el área.`,
      type: 'warning'
    }
  }

  return {
    text: `Desviaciones detectadas: ${deviations.join(', ')}. Revisar distribución antes de confirmar.`,
    type: 'warning'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers: convertir DistBucket[] a number[] de porcentajes
// ════════════════════════════════════════════════════════════════════════════

function bucketsToPercents(buckets: DistBucket[]): number[] {
  return buckets.map(b => Math.round(b.actualPercent))
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const CalibrationDistributionModal = memo(function CalibrationDistributionModal({
  isOpen,
  onClose,
  orgDistribution,
  gerencias,
  selectedGerencia,
  onSelectGerencia
}: CalibrationDistributionModalProps) {

  // Distribución activa (siempre org por ahora — per-gerencia es fallback a org)
  const activeDistribution = useMemo(() => {
    return bucketsToPercents(orgDistribution.buckets)
  }, [orgDistribution])

  const chartData = useMemo(() => {
    return bucketsToChartData(orgDistribution.buckets)
  }, [orgDistribution])

  const insight = useMemo(() => generateInsight(activeDistribution), [activeDistribution])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative z-10 flex flex-col overflow-hidden",
              "bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl",
              "w-full max-w-[700px] max-h-[90vh]"
            )}
          >
            {/* Tesla line */}
            <div className="fhr-top-line absolute inset-x-0 top-0 z-10" />

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-700/50">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Distribución de{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Evaluaciones
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedGerencia || 'Empresa Total'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Selector de Gerencia */}
              {gerencias && gerencias.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onSelectGerencia(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      !selectedGerencia
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-slate-600"
                    )}
                  >
                    <Building2 className="w-4 h-4 inline mr-1.5" />
                    Empresa Total
                  </button>
                  {gerencias.map(g => (
                    <button
                      key={g.gerencia}
                      onClick={() => onSelectGerencia(g.gerencia)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        selectedGerencia === g.gerencia
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-slate-600"
                      )}
                    >
                      {g.gerencia}
                    </button>
                  ))}
                </div>
              )}

              {/* Curva Bell — mismo gráfico que el Tab */}
              <BellCurveChart data={chartData} height={180} />

              {/* Insight/Narrativa */}
              <div className={cn(
                "rounded-xl p-4 flex gap-3",
                insight.type === 'success' && "bg-emerald-500/10 border border-emerald-500/20",
                insight.type === 'warning' && "bg-amber-500/10 border border-amber-500/20",
                insight.type === 'info' && "bg-slate-800/50 border border-slate-700/30"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  insight.type === 'success' && "bg-emerald-500/20",
                  insight.type === 'warning' && "bg-amber-500/20",
                  insight.type === 'info' && "bg-slate-700/50"
                )}>
                  {insight.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
                  {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {insight.type === 'info' && <Lightbulb className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-medium mb-1",
                    insight.type === 'success' && "text-emerald-300",
                    insight.type === 'warning' && "text-amber-300",
                    insight.type === 'info' && "text-slate-300"
                  )}>
                    {insight.type === 'success' ? 'Distribución Saludable' :
                     insight.type === 'warning' ? 'Atención Requerida' : 'Sin Datos'}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {insight.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-5 border-t border-slate-700/50">
              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

export default CalibrationDistributionModal
