'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Save } from 'lucide-react'

interface GoalEntry {
  id: string
  title: string
  competencyName: string
  progressPercent: number
  status: string
}

interface PDICheckInModalProps {
  pdiId: string
  goals: GoalEntry[]
  onClose: () => void
  onSuccess: () => void
}

export default function PDICheckInModal({ pdiId, goals, onClose, onSuccess }: PDICheckInModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [managerNotes, setManagerNotes] = useState('')
  const [goalProgress, setGoalProgress] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const g of goals) {
      initial[g.id] = g.progressPercent
    }
    return initial
  })

  const updateGoalProgress = useCallback((goalId: string, value: number) => {
    setGoalProgress(prev => ({ ...prev, [goalId]: value }))
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSaving(true)
    try {
      const progressEntries = goals.map(g => ({
        goalId: g.id,
        previousPercent: g.progressPercent,
        newPercent: goalProgress[g.id] ?? g.progressPercent
      }))

      const res = await fetch(`/api/pdi/${pdiId}/check-ins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: new Date().toISOString(),
          completedDate: new Date().toISOString(),
          managerNotes: managerNotes || undefined,
          goalProgress: progressEntries
        })
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error creating check-in:', err)
    } finally {
      setIsSaving(false)
    }
  }, [pdiId, goals, goalProgress, managerNotes, onSuccess])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 220, damping: 30 }}
          className="relative w-full max-w-lg bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-800 rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tesla line */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
              boxShadow: '0 0 15px #22D3EE'
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Registrar Check-in</h3>
              <p className="text-xs text-slate-500 mt-0.5">Actualiza el progreso de cada objetivo</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Goals Progress */}
          <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
            {goals.filter(g => g.status !== 'COMPLETED' && g.status !== 'CANCELLED').map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{goal.title}</p>
                    <p className="text-[10px] text-slate-500">{goal.competencyName}</p>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">
                    {goalProgress[goal.id]}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={goalProgress[goal.id] ?? 0}
                  onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-cyan-500 cursor-pointer"
                />
              </div>
            ))}

            {/* Notas del manager */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Notas del manager
                </label>
              </div>
              <textarea
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Observaciones sobre el progreso..."
                rows={3}
                className="w-full rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Check-in'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
