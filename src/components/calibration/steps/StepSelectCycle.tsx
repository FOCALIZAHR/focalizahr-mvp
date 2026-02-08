// ════════════════════════════════════════════════════════════════════════════
// STEP 1: Seleccionar Ciclo de Evaluación
// src/components/calibration/steps/StepSelectCycle.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle, Users, AlertCircle } from 'lucide-react'

interface Cycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  _count?: {
    assignments: number
  }
}

interface StepSelectCycleProps {
  selectedCycleId: string | null
  onSelect: (cycleId: string, cycle: Cycle) => void
}

export default memo(function StepSelectCycle({
  selectedCycleId,
  onSelect
}: StepSelectCycleProps) {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/performance-cycles')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCycles(json.data || [])
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const completedCycles = cycles.filter(c => c.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Selecciona el ciclo que calibrarás
        </h2>
        <p className="text-sm text-slate-400">
          Solo puedes calibrar ciclos completados. Elige el que quieras revisar.
        </p>
      </div>

      {/* Cycles Grid */}
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="fhr-spinner mx-auto" />
          <p className="text-sm text-slate-400 mt-3">Cargando ciclos...</p>
        </div>
      ) : completedCycles.length === 0 ? (
        <div className="fhr-empty-state">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <p className="text-slate-400">No hay ciclos completados disponibles</p>
          <p className="text-sm text-slate-500 mt-1">
            Completa un ciclo de evaluación primero para calibrar resultados.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {completedCycles.map((cycle, index) => {
            const isSelected = selectedCycleId === cycle.id
            const assignmentsCount = cycle._count?.assignments || 0

            return (
              <motion.button
                key={cycle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                onClick={() => onSelect(cycle.id, cycle)}
                className={cn(
                  'fhr-card w-full p-4 text-left transition-all duration-200',
                  'border-2 group cursor-pointer',
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700/30 hover:border-slate-600/50 hover:scale-[1.01] hover:shadow-xl'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Check indicator */}
                    <div className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-slate-600 group-hover:border-slate-500'
                    )}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>

                    {/* Cycle info */}
                    <div>
                      <div className="font-medium text-white">{cycle.name}</div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(cycle.endDate).toLocaleDateString('es-CL')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {assignmentsCount} evaluaciones
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="fhr-badge fhr-badge-success">
                    Completado
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
})
