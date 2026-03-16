'use client'

// ════════════════════════════════════════════════════════════════════════════
// MASS ACTION BAR — Acciones masivas sobre seleccion (Pilar 2)
// src/components/talent-actions/MassActionBar.tsx
//
// Manifiesto UX:
// LEY 1: El clic ejecuta accion real (IntelligenceInsight bulk)
// LEY 2: Micro-copy estrategico (valor futuro)
// LEY 3: Colapso visual post-accion
// LEY 4: Sin seguimiento operativo
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShieldCheck, X } from 'lucide-react'

interface MassActionBarProps {
  selectedCount: number
  quadrant: string
  onAction: (actionCode: string) => Promise<void>
  onClearSelection: () => void
}

const MASS_ACTIONS: Record<string, { label: string; actionCode: string }> = {
  FUGA_CEREBROS: { label: 'Registrar ronda de retencion', actionCode: 'RETENTION_ROUND' },
  BURNOUT_RISK: { label: 'Solicitar revision de cargas', actionCode: 'WORKLOAD_REVIEW' },
  BAJO_RENDIMIENTO: { label: 'Programar evaluaciones directas', actionCode: 'DIRECT_EVALUATION' },
  MOTOR_EQUIPO: { label: 'Reconocer al equipo', actionCode: 'TEAM_RECOGNITION' },
}

export default function MassActionBar({
  selectedCount, quadrant, onAction, onClearSelection
}: MassActionBarProps) {
  const [executing, setExecuting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = MASS_ACTIONS[quadrant]
  if (!config) return null

  const handleAction = async () => {
    setExecuting(true)
    setError(null)
    try {
      await onAction(config.actionCode)
      setCompleted(true)
    } catch (err: any) {
      setError(err.message || 'Error al registrar accion')
    } finally {
      setExecuting(false)
    }
  }

  // LEY 3: Post-accion → badge "En gestion"
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-emerald-400">En gestion</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              FocalizaHR medira el impacto en el proximo ciclo. No tienes que hacer nada mas.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="sticky bottom-0 mt-4 p-4 bg-slate-900/95 backdrop-blur border border-slate-700/50 rounded-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white font-medium">
              {selectedCount} persona{selectedCount !== 1 ? 's' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          </div>

          <button
            onClick={handleAction}
            disabled={executing}
            className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all
              bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900
              shadow-[0_0_20px_rgba(34,211,238,0.3)]
              hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]
              disabled:opacity-50"
          >
            {executing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              config.label
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-amber-400 mt-2">{error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
