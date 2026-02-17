'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle2, Plus } from 'lucide-react'
import PDIGoalCard from './PDIGoalCard'
import PDICheckInModal from './PDICheckInModal'
import PDIStatusBadge from './PDIStatusBadge'

interface PDIDetailViewProps {
  pdiId: string
}

export default function PDIDetailView({ pdiId }: PDIDetailViewProps) {
  const [pdi, setPdi] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCheckInModal, setShowCheckInModal] = useState(false)

  const fetchPDI = useCallback(async () => {
    try {
      const res = await fetch(`/api/pdi/${pdiId}`)
      const data = await res.json()
      if (data.success) setPdi(data.data)
    } catch (err) {
      console.error('Error fetching PDI:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pdiId])

  useEffect(() => {
    fetchPDI()
  }, [fetchPDI])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    )
  }

  if (!pdi) {
    return (
      <div className="text-center py-20 text-slate-400">
        No se encontró el plan de desarrollo
      </div>
    )
  }

  const totalGoals = pdi.goals?.length ?? 0
  const completedGoals = pdi.goals?.filter((g: any) => g.status === 'COMPLETED').length ?? 0
  // Progreso real: promedio de progressPercent de cada goal (más granular que solo contar COMPLETED)
  const progressPercent = totalGoals > 0
    ? Math.round(
        (pdi.goals as any[]).reduce((sum: number, g: any) => sum + (g.progressPercent ?? 0), 0) / totalGoals
      )
    : 0

  const teslaColor = progressPercent >= 70 ? '#10B981' : progressPercent >= 40 ? '#F59E0B' : '#22D3EE'

  return (
    <div className="space-y-6">
      {/* Header Cinema Split */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        className="relative bg-[#0F172A]/90 backdrop-blur-2xl rounded-[24px] border border-slate-800 overflow-hidden"
      >
        {/* Línea Tesla dinámica */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
            boxShadow: `0 0 15px ${teslaColor}`
          }}
        />

        <div className="flex p-6 gap-6">
          {/* Info (35%) */}
          <div className="flex-[35] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <PDIStatusBadge status={pdi.status} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Plan de Desarrollo
            </h2>
            <p className="text-sm text-slate-400">
              {pdi.employee?.fullName} · {pdi.cycle?.name}
            </p>
          </div>

          {/* Progress Ring (65%) */}
          <div className="flex-[65] flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48" cy="48" r="40"
                  className="stroke-slate-700"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="48" cy="48" r="40"
                  stroke={teslaColor}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * progressPercent / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeDasharray="251.2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{progressPercent}%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-400">{completedGoals} de {totalGoals} objetivos</p>
              {pdi.checkIns?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Último check-in: {new Date(pdi.checkIns[0].completedDate).toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'short'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Objetivos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Objetivos de Desarrollo
          </h3>
          {['AGREED', 'IN_PROGRESS'].includes(pdi.status) && (
            <button
              onClick={() => setShowCheckInModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Check-in
            </button>
          )}
        </div>

        <div className="space-y-3">
          {pdi.goals?.map((goal: any, index: number) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 220, damping: 30 }}
            >
              <PDIGoalCard goal={goal} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Historial de Check-ins */}
      {pdi.checkIns?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Historial de Seguimiento
          </h3>
          <div className="space-y-2">
            {pdi.checkIns.map((checkIn: any) => (
              <div
                key={checkIn.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-300">Check-in completado</p>
                  <p className="text-xs text-slate-500">
                    {new Date(checkIn.completedDate).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {checkIn.managerNotes && (
                  <p className="text-xs text-slate-500 max-w-[200px] truncate">{checkIn.managerNotes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Check-in */}
      {showCheckInModal && pdi.goals && (
        <PDICheckInModal
          pdiId={pdi.id}
          goals={pdi.goals}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => {
            setShowCheckInModal(false)
            fetchPDI()
          }}
        />
      )}
    </div>
  )
}
