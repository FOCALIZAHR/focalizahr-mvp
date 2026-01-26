'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATOR PROGRESS CARD - Gauge de Progreso Estilo Torre de Control
// src/components/evaluator/EvaluatorProgressCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Timer } from 'lucide-react'

interface EvaluatorProgressCardProps {
  completed: number
  total: number
  estimatedMinutesPerEvaluation?: number
}

export default function EvaluatorProgressCard({
  completed,
  total,
  estimatedMinutesPerEvaluation = 10
}: EvaluatorProgressCardProps) {
  const pending = total - completed
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const estimatedTimeRemaining = pending * estimatedMinutesPerEvaluation

  // Color según progreso
  const getProgressColor = () => {
    if (percentage === 100) return '#10B981' // Verde completo
    if (percentage >= 60) return '#22D3EE'   // Cyan buen progreso
    if (percentage >= 30) return '#F59E0B'   // Amber en progreso
    return '#64748B'                          // Gris sin empezar
  }

  const progressColor = getProgressColor()

  // Datos para el gauge semicircular
  const gaugeData = [
    { name: 'completed', value: percentage, color: progressColor },
    { name: 'remaining', value: 100 - percentage, color: 'rgba(255, 255, 255, 0.1)' }
  ]

  // Formatear tiempo
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="fhr-card p-6">
      <div className="flex flex-col items-center">
        {/* Gauge Semicircular */}
        <div className="relative" style={{ width: 200, height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="90%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centro del Gauge */}
          <div className="absolute inset-0 flex items-end justify-center pb-3">
            <motion.div
              className="text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
            >
              <div className="flex items-baseline justify-center gap-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: progressColor }}
                >
                  {completed}
                </span>
                <span className="text-xl text-slate-400">/</span>
                <span className="text-xl text-slate-400">{total}</span>
              </div>
              <div
                className="text-sm font-medium mt-1"
                style={{ color: progressColor }}
              >
                {percentage}%
              </div>
            </motion.div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 w-full mt-6">
          {/* Completadas */}
          <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-xl font-bold text-green-400">{completed}</div>
            <div className="text-xs text-slate-400">Completadas</div>
          </div>

          {/* Pendientes */}
          <div className="text-center p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <Clock className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
            <div className="text-xl font-bold text-cyan-400">{pending}</div>
            <div className="text-xs text-slate-400">Pendientes</div>
          </div>

          {/* Tiempo Estimado */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <Timer className="w-5 h-5 mx-auto mb-1 text-slate-400" />
            <div className="text-xl font-bold text-slate-300">
              {pending > 0 ? formatTime(estimatedTimeRemaining) : '-'}
            </div>
            <div className="text-xs text-slate-400">Tiempo est.</div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {percentage === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full"
          >
            <span className="text-green-400 text-sm font-medium">
              Todas las evaluaciones completadas
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
