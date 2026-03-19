'use client'

// ════════════════════════════════════════════════════════════════════════════
// MASS ACTION BAR — Acciones masivas sobre seleccion (Pilar 2)
// src/components/talent-actions/MassActionBar.tsx
//
// Manifiesto UX:
// LEY 1: El clic ejecuta accion real (IntelligenceInsight bulk + email a gerente)
// LEY 2: Micro-copy estrategico (valor futuro, contextual por acción)
// LEY 3: Colapso visual post-accion + modal FocalizaIntelligenceModal
// LEY 4: Sin seguimiento operativo
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ShieldCheck, X } from 'lucide-react'
import FocalizaIntelligenceModal from '@/components/ui/FocalizaIntelligenceModal'
import { getQuadrantLabel } from '@/config/tacLabels'

interface MassActionBarProps {
  selectedCount: number
  quadrant: string
  onAction: (actionCode: string) => Promise<string | undefined>
  onClearSelection: () => void
}

const MASS_ACTIONS: Record<string, { label: string; actionCode: string; tooltip: string }> = {
  FUGA_CEREBROS: {
    label: 'Registrar ronda de retencion',
    actionCode: 'RETENTION_ROUND',
    tooltip: 'Se enviará un email al gerente del área pidiendo una conversación de escucha con cada persona seleccionada.'
  },
  BURNOUT_RISK: {
    label: 'Solicitar revision de cargas',
    actionCode: 'WORKLOAD_REVIEW',
    tooltip: 'Se enviará un email al gerente del área pidiendo revisar la carga real y la adecuación al rol de cada persona.'
  },
  BAJO_RENDIMIENTO: {
    label: 'Revisar caso',
    actionCode: 'DIRECT_EVALUATION',
    tooltip: 'Se enviará un email al gerente del área pidiendo una conversación de contexto antes de cualquier otra acción.'
  },
  MOTOR_EQUIPO: {
    label: 'Reconocer al equipo',
    actionCode: 'TEAM_RECOGNITION',
    tooltip: 'Se enviará un email al gerente del área pidiendo reconocer explícitamente y dar visibilidad de crecimiento a cada persona.'
  },
}

export default function MassActionBar({
  selectedCount, quadrant, onAction, onClearSelection
}: MassActionBarProps) {
  const [executing, setExecuting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<string | null>(null)
  const [showActionTooltip, setShowActionTooltip] = useState(false)

  const config = MASS_ACTIONS[quadrant]
  if (!config) return null

  const handleAction = async () => {
    setExecuting(true)
    setError(null)
    try {
      const contextMessage = await onAction(config.actionCode)
      setCompleted(true)
      setConfirmModal(contextMessage || 'Acción registrada. FocalizaHR medirá el impacto en el próximo ciclo.')
    } catch (err: any) {
      setError(err.message || 'Error al registrar accion')
    } finally {
      setExecuting(false)
    }
  }

  // LEY 3: Post-accion → badge "En gestion"
  if (completed) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-emerald-400">En gestión</span>
          </div>
        </motion.div>

        <FocalizaIntelligenceModal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          entityName={getQuadrantLabel(quadrant)}
          entityType="equipo"
          customMessage={{
            before: 'registró una intervención sobre',
            after: confirmModal || ''
          }}
          cta={{
            label: 'Entendido',
            onClick: () => {}
          }}
          source="Talent Action Center"
        />
      </>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="sticky bottom-0 mt-4 p-4 bg-slate-900/95 backdrop-blur border border-cyan-500/20 rounded-xl shadow-[0_0_30px_-10px_rgba(34,211,238,0.15)]"
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

          <div className="relative">
            <button
              onClick={handleAction}
              disabled={executing}
              onMouseEnter={() => setShowActionTooltip(true)}
              onMouseLeave={() => setShowActionTooltip(false)}
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

            {/* Tooltip — qué hace esta acción */}
            {showActionTooltip && !executing && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-left pointer-events-none z-50 w-[260px] shadow-xl">
                <p className="text-xs text-slate-300 leading-relaxed">{config.tooltip}</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-amber-400 mt-2">{error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
