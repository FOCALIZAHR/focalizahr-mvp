// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION MODAL - Detalle de Distribución de Potencial
// src/components/performance/DistributionModal.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA CINEMA: "Progressive Disclosure - Gauge click → Modal detalle"
// INSPIRACIÓN: Apple Health insight cards + Tesla energy breakdown
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, TrendingUp, TrendingDown, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import DistributionGauge from './DistributionGauge'
import { PrimaryButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface DistributionModalProps {
  isOpen: boolean
  onClose: () => void
  assignedScores: number[]
  totalEvaluated: number
}

// Target distribution (curva normal ideal McKinsey 10-20-40-20-10)
const TARGET_DISTRIBUTION = [
  { level: 'Bajo', target: 10, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { level: 'Desarrollo', target: 20, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { level: 'Sólido', target: 40, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { level: 'Alto', target: 20, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { level: 'Excepcional', target: 10, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
]

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function calculateDistribution(scores: number[]) {
  const distribution = [0, 0, 0, 0, 0] // Bajo, Desarrollo, Sólido, Alto, Excepcional

  scores.forEach(score => {
    if (score === 1) distribution[0]++
    else if (score === 2) distribution[1]++
    else if (score === 3) distribution[2]++
    else if (score === 4) distribution[3]++
    else if (score === 5) distribution[4]++
  })

  return distribution
}

function generateInsight(realDistribution: number[], total: number): { text: string; type: 'success' | 'warning' | 'info' } {
  if (total === 0) {
    return { text: 'Aún no hay asignaciones de potencial.', type: 'info' }
  }

  const realPercents = realDistribution.map(count => Math.round((count / total) * 100))

  // Detectar desviaciones significativas (>15%)
  const deviations: string[] = []

  TARGET_DISTRIBUTION.forEach((target, i) => {
    const diff = realPercents[i] - target.target
    if (diff > 15) {
      deviations.push(`+${diff}% en ${target.level}`)
    } else if (diff < -15) {
      deviations.push(`${diff}% en ${target.level}`)
    }
  })

  if (deviations.length === 0) {
    return {
      text: 'La distribución está balanceada según la curva ideal. Buen trabajo.',
      type: 'success'
    }
  }

  // Detectar sesgo hacia arriba o abajo
  const highEnd = realPercents[3] + realPercents[4] // Alto + Excepcional
  const lowEnd = realPercents[0] + realPercents[1] // Bajo + Desarrollo

  if (highEnd > 50) {
    return {
      text: `Tendencia hacia valoraciones altas (${highEnd}% en Alto/Excepcional). Considera ser más crítico para que la Matriz 9-Box sea útil.`,
      type: 'warning'
    }
  }

  if (lowEnd > 50) {
    return {
      text: `Tendencia hacia valoraciones bajas (${lowEnd}% en Bajo/Desarrollo). ¿Estás siendo demasiado estricto?`,
      type: 'warning'
    }
  }

  return {
    text: `Desviaciones detectadas: ${deviations.join(', ')}. Revisa antes de ir a 9-Box.`,
    type: 'warning'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function DistributionModal({
  isOpen,
  onClose,
  assignedScores,
  totalEvaluated
}: DistributionModalProps) {
  const realDistribution = calculateDistribution(assignedScores)
  const totalAssigned = assignedScores.length
  const insight = generateInsight(realDistribution, totalAssigned)

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

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
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            className={cn(
              "relative z-10 flex flex-col overflow-hidden",
              "bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl",
              "w-full max-w-[600px] max-h-[90vh]"
            )}
          >
            {/* Tesla line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Header - flex-shrink-0 para que no se comprima */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-700/50">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Distribución de{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Potencial
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {totalAssigned} de {totalEvaluated} asignados
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - flex-1 con scroll interno */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Gauge Grande */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <DistributionGauge assignedScores={assignedScores} variant="large" />
                <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-0.5 border-t-2 border-dashed border-cyan-500/60" />
                    Target ideal
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-purple-400 rounded" />
                    Real
                  </span>
                </div>
              </div>

              {/* Tabla de distribución */}
              <div className="grid grid-cols-5 gap-2">
                {TARGET_DISTRIBUTION.map((item, i) => {
                  const realCount = realDistribution[i]
                  const realPercent = totalAssigned > 0 ? Math.round((realCount / totalAssigned) * 100) : 0
                  const diff = realPercent - item.target
                  const isOver = diff > 10
                  const isUnder = diff < -10
                  const isOk = !isOver && !isUnder

                  return (
                    <div
                      key={item.level}
                      className={cn(
                        "p-2.5 rounded-lg text-center border transition-colors",
                        "bg-slate-800/30",
                        isOver && "border-amber-500/50",
                        isUnder && "border-blue-500/50",
                        isOk && "border-transparent"
                      )}
                    >
                      <p className={cn("text-[10px] font-medium truncate", item.color)}>
                        {item.level}
                      </p>
                      <p className="text-lg font-bold text-white mt-0.5">
                        {realCount}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {realPercent}%
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        Target: {item.target}%
                      </p>
                      <div className="mt-1.5 h-4 flex items-center justify-center">
                        {isOk && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        {isOver && (
                          <div className="flex items-center gap-0.5 text-amber-400">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-[9px]">+{diff}%</span>
                          </div>
                        )}
                        {isUnder && (
                          <div className="flex items-center gap-0.5 text-blue-400">
                            <TrendingDown className="w-3 h-3" />
                            <span className="text-[9px]">{diff}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Insight */}
              <div
                className="p-4 rounded-xl border bg-slate-800/30 border-slate-700/30"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      insight.type === 'success' && "bg-emerald-500/20",
                      insight.type === 'warning' && "bg-amber-500/20",
                      insight.type === 'info' && "bg-slate-500/20"
                    )}
                  >
                    {insight.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
                    {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {insight.type === 'info' && <Lightbulb className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        insight.type === 'success' && "text-emerald-300",
                        insight.type === 'warning' && "text-amber-300",
                        insight.type === 'info' && "text-slate-300"
                      )}
                    >
                      Insight
                    </p>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - flex-shrink-0 para que no se comprima */}
            <div className="flex-shrink-0 p-5 border-t border-slate-700/50">
              <PrimaryButton fullWidth onClick={onClose}>
                Entendido
              </PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
