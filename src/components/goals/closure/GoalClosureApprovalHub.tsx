// src/components/goals/closure/GoalClosureApprovalHub.tsx
'use client'

import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { ClosureApprovalCard } from './ClosureApprovalCard'

const fetcher = (url: string) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  }).then((r) => r.json())
}

interface PendingGoal {
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
  progressUpdates: Array<{
    id: string
    previousValue: number
    newValue: number
    previousProgress: number
    newProgress: number
    comment: string | null
    createdAt: string
    updatedById: string
  }>
}

export default function GoalClosureApprovalHub() {
  const { data, mutate, isLoading } = useSWR('/api/goals/pending-closure', fetcher)
  const [selectedGoal, setSelectedGoal] = useState<PendingGoal | null>(null)

  const pendingGoals: PendingGoal[] = data?.data || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="fhr-text-sm text-slate-400 uppercase tracking-widest mb-2">
          Módulo de Metas
        </p>
        <h1 className="fhr-hero-title">
          <span className="fhr-title-gradient">Aprobación de Metas</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Revisa y aprueba las metas que solicitan cierre
        </p>
      </div>

      <div className="fhr-divider" />

      {/* Mission Control */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        className="fhr-card p-6"
      >
        <div className="flex items-center gap-6">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center ${
              pendingGoals.length > 0
                ? 'bg-amber-500/20 border-2 border-amber-500/50'
                : 'bg-emerald-500/20 border-2 border-emerald-500/50'
            }`}
          >
            {pendingGoals.length > 0 ? (
              <span className="text-3xl font-light text-amber-400">
                {pendingGoals.length}
              </span>
            ) : (
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg text-white font-medium">
              {pendingGoals.length > 0
                ? `${pendingGoals.length} meta${pendingGoals.length > 1 ? 's' : ''} pendiente${pendingGoals.length > 1 ? 's' : ''} de aprobación`
                : 'Sin metas pendientes'}
            </h2>
            <p className="text-slate-400 text-sm">
              {pendingGoals.length > 0
                ? 'Revisa cada solicitud y aprueba o rechaza'
                : 'No hay solicitudes de cierre pendientes'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Lista o Card de detalle */}
      <AnimatePresence mode="wait">
        {selectedGoal ? (
          <ClosureApprovalCard
            goal={selectedGoal}
            onBack={() => setSelectedGoal(null)}
            onAction={() => {
              mutate()
              setSelectedGoal(null)
            }}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {pendingGoals.map((goal, idx) => (
              <motion.button
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className="w-full fhr-card p-4 text-left hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{goal.title}</h3>
                    <p className="text-sm text-slate-400">
                      {goal.owner?.fullName || 'Desconocido'}{' '}
                      {goal.closureRequestedAt && (
                        <>
                          · Solicitado{' '}
                          {new Date(goal.closureRequestedAt).toLocaleDateString('es-CL')}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-2xl font-light text-white">
                        {Math.round(goal.progress)}%
                      </span>
                    </div>
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </motion.button>
            ))}

            {pendingGoals.length === 0 && (
              <div className="fhr-card p-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-white text-lg mb-2">Todo al día</h3>
                <p className="text-slate-400">
                  No hay solicitudes de cierre pendientes de aprobación.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
