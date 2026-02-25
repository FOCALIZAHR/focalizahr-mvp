// src/app/dashboard/metas/aprobaciones/page.tsx
'use client'

import { memo, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Target,
  RefreshCw,
  Building2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SecondaryButton, GhostButton } from '@/components/ui/PremiumButton'
import GoalLevelBadge from '@/components/goals/GoalLevelBadge'
import GoalProgressBar from '@/components/goals/GoalProgressBar'
import { useToast } from '@/components/ui/toast-system'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalLevel = 'COMPANY' | 'AREA' | 'INDIVIDUAL'

interface PendingGoal {
  id: string
  title: string
  level: GoalLevel
  progress: number
  closureRequestedAt: string
  closureRequestedBy: string
  waitingDays: number
  isUrgent: boolean
  owner?: { id: string; fullName: string; position?: string | null } | null
  department?: { id: string; displayName: string } | null
}

interface PendingStats {
  total: number
  byLevel: { company: number; area: number; individual: number }
  urgent: number
}

interface PendingResponse {
  data: PendingGoal[]
  stats: PendingStats
  success: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// FETCHER
// ════════════════════════════════════════════════════════════════════════════

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Error ${res.status}`)
  }

  return res.json()
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: StatCard
// ════════════════════════════════════════════════════════════════════════════

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Target
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="fhr-card-metric">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-5 h-5', accent)} />
        <span className="fhr-text-sm text-slate-400">{label}</span>
      </div>
      <p className={cn('text-3xl font-extralight tabular-nums', accent)}>
        {value}
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: RejectModal
// ════════════════════════════════════════════════════════════════════════════

const RejectModal = memo(function RejectModal({
  isOpen,
  goalTitle,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean
  goalTitle: string
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')

  const handleConfirm = useCallback(() => {
    if (reason.trim().length >= 10) {
      onConfirm(reason.trim())
    }
  }, [reason, onConfirm])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">
          Rechazar Solicitud de Cierre
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Meta: <span className="text-slate-300">{goalTitle}</span>
        </p>

        <label className="block text-sm text-slate-400 mb-2">
          Motivo del rechazo <span className="text-red-400">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explica por qué rechazas esta solicitud (mínimo 10 caracteres)..."
          className="w-full h-24 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          {reason.length}/10 caracteres mínimo
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <GhostButton onClick={onClose} disabled={isLoading}>
            Cancelar
          </GhostButton>
          <button
            onClick={handleConfirm}
            disabled={reason.trim().length < 10 || isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Rechazando...' : 'Confirmar Rechazo'}
          </button>
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: PendingGoalCard
// ════════════════════════════════════════════════════════════════════════════

const PendingGoalCard = memo(function PendingGoalCard({
  goal,
  onApprove,
  onReject,
  isProcessing,
}: {
  goal: PendingGoal
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isProcessing: boolean
}) {
  const router = useRouter()

  const requestDate = useMemo(() => {
    return new Date(goal.closureRequestedAt).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [goal.closureRequestedAt])

  const handleViewDetail = useCallback(() => {
    router.push(`/dashboard/metas/${goal.id}`)
  }, [router, goal.id])

  return (
    <div className="fhr-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <GoalLevelBadge level={goal.level} />
          {goal.isUrgent && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              Urgente
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          {goal.waitingDays === 0 ? 'Hoy' : `Hace ${goal.waitingDays} día${goal.waitingDays > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Título */}
      <h3
        onClick={handleViewDetail}
        className="text-white font-medium mb-2 cursor-pointer hover:text-cyan-400 transition-colors line-clamp-2"
      >
        {goal.title}
      </h3>

      {/* Owner / Department */}
      <p className="text-sm text-slate-400 mb-3">
        {goal.owner?.fullName || goal.department?.displayName || '—'}
        {goal.owner?.position && (
          <span className="text-slate-500"> · {goal.owner.position}</span>
        )}
      </p>

      {/* Progress */}
      <GoalProgressBar
        progress={goal.progress}
        status="PENDING_CLOSURE"
        size="sm"
        className="mb-3"
      />

      {/* Solicitado por */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Clock className="w-3 h-3" />
        <span>
          Solicitado por {goal.closureRequestedBy} el {requestDate}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
        <button
          onClick={() => onApprove(goal.id)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          Aprobar
        </button>
        <button
          onClick={() => onReject(goal.id)}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Rechazar
        </button>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function AprobacionesPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; goalId: string; goalTitle: string }>({
    isOpen: false,
    goalId: '',
    goalTitle: '',
  })

  // Fetch datos
  const { data, error, isLoading, mutate } = useSWR<PendingResponse>(
    '/api/goals/pending-closure',
    fetcher,
    { revalidateOnFocus: false }
  )

  const goals = data?.data || []
  const stats = data?.stats || { total: 0, byLevel: { company: 0, area: 0, individual: 0 }, urgent: 0 }

  // Handlers
  const handleBack = useCallback(() => {
    router.push('/dashboard/metas')
  }, [router])

  const handleApprove = useCallback(async (goalId: string) => {
    setProcessingId(goalId)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/goals/${goalId}/approve-closure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      })

      const result = await res.json()

      if (result.success) {
        addToast({ type: 'success', message: 'Meta aprobada y completada correctamente' })
        mutate() // Recargar lista
      } else {
        addToast({ type: 'error', message: result.error || 'Error al aprobar' })
      }
    } catch {
      addToast({ type: 'error', message: 'Error de conexión' })
    } finally {
      setProcessingId(null)
    }
  }, [addToast, mutate])

  const handleOpenRejectModal = useCallback((goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (goal) {
      setRejectModal({ isOpen: true, goalId, goalTitle: goal.title })
    }
  }, [goals])

  const handleCloseRejectModal = useCallback(() => {
    setRejectModal({ isOpen: false, goalId: '', goalTitle: '' })
  }, [])

  const handleConfirmReject = useCallback(async (reason: string) => {
    const goalId = rejectModal.goalId
    setProcessingId(goalId)
    try {
      const token = localStorage.getItem('focalizahr_token')
      const res = await fetch(`/api/goals/${goalId}/approve-closure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reject', reason }),
      })

      const result = await res.json()

      if (result.success) {
        addToast({ type: 'success', message: 'Solicitud rechazada correctamente' })
        handleCloseRejectModal()
        mutate() // Recargar lista
      } else {
        addToast({ type: 'error', message: result.error || 'Error al rechazar' })
      }
    } catch {
      addToast({ type: 'error', message: 'Error de conexión' })
    } finally {
      setProcessingId(null)
    }
  }, [rejectModal.goalId, addToast, mutate, handleCloseRejectModal])

  // ════════════════════════════════════════════════════════════════════════
  // RENDER: Error
  // ════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="fhr-bg-main min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="fhr-card text-center py-12">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <p className="fhr-text text-slate-300 mb-4">
              No pudimos cargar las aprobaciones pendientes.
            </p>
            <GhostButton icon={RefreshCw} onClick={() => mutate()}>
              Reintentar
            </GhostButton>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Metas</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="fhr-hero-title text-2xl md:text-3xl">
                Aprobaciones{' '}
                <span className="fhr-title-gradient">Pendientes</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Revisa y gestiona las solicitudes de cierre de metas
              </p>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fhr-divider mb-8" />

        {/* ── Stats ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="fhr-skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard
              icon={Target}
              label="Total Pendientes"
              value={stats.total}
              accent="text-amber-400"
            />
            <StatCard
              icon={Building2}
              label="Corporativas"
              value={stats.byLevel.company}
              accent="text-cyan-400"
            />
            <StatCard
              icon={Users}
              label="De Área"
              value={stats.byLevel.area}
              accent="text-purple-400"
            />
            <StatCard
              icon={AlertTriangle}
              label="Urgentes"
              value={stats.urgent}
              accent="text-red-400"
            />
          </div>
        )}

        {/* ── Lista ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="fhr-skeleton h-56 rounded-2xl" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="fhr-card text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="fhr-title-card text-slate-300 mb-2">
              ¡Todo al día!
            </h3>
            <p className="fhr-text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              No hay solicitudes de cierre pendientes de aprobación.
            </p>
            <SecondaryButton icon={ArrowLeft} onClick={handleBack}>
              Volver a Metas
            </SecondaryButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <PendingGoalCard
                key={goal.id}
                goal={goal}
                onApprove={handleApprove}
                onReject={handleOpenRejectModal}
                isProcessing={processingId === goal.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Rechazo ── */}
      <RejectModal
        isOpen={rejectModal.isOpen}
        goalTitle={rejectModal.goalTitle}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmReject}
        isLoading={!!processingId}
      />
    </div>
  )
})
