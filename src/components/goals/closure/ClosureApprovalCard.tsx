// src/components/goals/closure/ClosureApprovalCard.tsx
'use client'

import { memo, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { SuccessButton, DangerButton } from '@/components/ui/PremiumButton'

interface ProgressUpdate {
  id: string
  previousValue: number
  newValue: number
  previousProgress: number
  newProgress: number
  comment: string | null
  createdAt: string
  updatedById: string
}

interface ClosureGoal {
  id: string
  title: string
  level: string
  progress: number
  status: string
  currentValue: number
  targetValue: number
  startValue: number
  unit: string | null
  dueDate: string
  closureRequestedAt: string | null
  closureRequestedBy: string | null
  owner: {
    id: string
    fullName: string
    email: string | null
    standardJobLevel: string | null
  } | null
  progressUpdates: ProgressUpdate[]
}

interface ClosureApprovalCardProps {
  goal: ClosureGoal
  onBack: () => void
  onAction: () => void
}

export const ClosureApprovalCard = memo(function ClosureApprovalCard({
  goal,
  onBack,
  onAction,
}: ClosureApprovalCardProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const handleAction = useCallback(
    async (action: 'approve' | 'reject') => {
      const msg =
        action === 'approve'
          ? '¿Aprobar el cierre de esta meta?'
          : '¿Rechazar la solicitud de cierre? La meta volverá a estado activo.'
      if (!confirm(msg)) return

      setLoading(action)
      try {
        const token = localStorage.getItem('focalizahr_token')
        const res = await fetch(`/api/goals/${goal.id}/approve-closure`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action, notes }),
        })

        if (res.ok) {
          onAction()
        } else {
          const json = await res.json()
          alert(json.error || 'Error procesando solicitud')
        }
      } finally {
        setLoading(null)
      }
    },
    [goal.id, notes, onAction]
  )

  const levelLabel =
    goal.level === 'COMPANY'
      ? 'Corporativa'
      : goal.level === 'AREA'
        ? 'de Área'
        : 'Individual'

  return (
    <motion.div
      key="approval"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="fhr-card p-6 space-y-6 relative overflow-hidden">
        {/* Tesla line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE',
          }}
        />

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Target className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl text-white font-medium">{goal.title}</h2>
            <span className="text-sm text-slate-400">Meta {levelLabel}</span>
          </div>
        </div>

        {/* Solicitante */}
        <div className="p-4 bg-slate-800/50 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              Solicitado por: {goal.owner?.fullName || 'Desconocido'}
            </p>
            <p className="text-xs text-slate-400">
              {goal.closureRequestedAt
                ? new Date(goal.closureRequestedAt).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Fecha no disponible'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(goal.progress, 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white font-medium">
              {Math.round(goal.progress)}% completado
            </span>
            <span className="text-slate-400">
              {goal.currentValue} / {goal.targetValue} {goal.unit || ''}
            </span>
          </div>
        </div>

        {/* Historial de avances */}
        {goal.progressUpdates.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Historial de Avances
            </h3>
            <div className="space-y-2 max-h-40 overflow-auto">
              {goal.progressUpdates.map((update) => (
                <div
                  key={update.id}
                  className="p-3 bg-slate-800/30 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm text-white">
                      {Math.round(update.previousProgress)}% → {Math.round(update.newProgress)}%
                    </span>
                    {update.comment && (
                      <p className="text-xs text-slate-400 mt-0.5">{update.comment}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(update.createdAt).toLocaleDateString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="text-sm text-slate-300 block mb-2">Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comentarios sobre la aprobación o rechazo..."
            className="fhr-input w-full h-24 resize-none"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <DangerButton
            icon={loading === 'reject' ? Loader2 : XCircle}
            onClick={() => handleAction('reject')}
            disabled={loading !== null}
            isLoading={loading === 'reject'}
          >
            Rechazar
          </DangerButton>

          <SuccessButton
            icon={loading === 'approve' ? Loader2 : CheckCircle}
            onClick={() => handleAction('approve')}
            disabled={loading !== null}
            isLoading={loading === 'approve'}
          >
            Aprobar Cierre
          </SuccessButton>
        </div>
      </div>
    </motion.div>
  )
})
