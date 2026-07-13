// ════════════════════════════════════════════════════════════════════════════
// GoalAlertsPopover - Panel flotante de la campana de avisos de metas
// src/components/goals/alerts/GoalAlertsPopover.tsx
// ════════════════════════════════════════════════════════════════════════════
// Presentacional: recibe todo por props. Tokens clonados de MisPlanesBtn (popover
// flotante) + PlanRow (filas). Contenido self-contained (title/body/context).
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, Target, XCircle } from 'lucide-react'
import { FHREmptyState } from '@/components/ui/FHREmptyState'
import type { GoalAlert, GoalAlertType } from '@/hooks/useGoalAlerts'

interface GoalAlertsPopoverProps {
  alerts: GoalAlert[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  onClose: () => void
}

const TYPE_ICON: Record<GoalAlertType, typeof Target> = {
  GOAL_ASSIGNED: Target,
  CLOSURE_APPROVED: CheckCircle2,
  CLOSURE_REJECTED: XCircle,
}

export function GoalAlertsPopover({
  alerts,
  unreadCount,
  isLoading,
  isError,
  markAsRead,
  markAllAsRead,
  onClose,
}: GoalAlertsPopoverProps) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50"
      style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
    >
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)' }}
        aria-hidden
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            Avisos
          </p>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-medium text-cyan-300 hover:text-white transition-colors"
            >
              Marcar todas leídas
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map(i => (
              <div key={i} className="p-3 rounded-md bg-slate-900/60 border border-slate-800/60">
                <div className="h-3 w-3/4 rounded bg-slate-800 animate-pulse mb-2" />
                <div className="h-2 w-1/3 rounded bg-slate-800/70 animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-4 text-center">
            <p className="text-xs text-red-300 font-light">No se pudieron cargar los avisos.</p>
          </div>
        ) : alerts.length === 0 ? (
          <FHREmptyState
            type="clear"
            title="Sin avisos nuevos"
            description="Cuando te asignen una meta o se resuelva un cierre, aparecerá acá."
          />
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {alerts.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onMarkRead={markAsRead}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ALERT ROW
// ════════════════════════════════════════════════════════════════════════════

function AlertRow({
  alert,
  onMarkRead,
  onClose,
}: {
  alert: GoalAlert
  onMarkRead: (id: string) => void
  onClose: () => void
}) {
  const router = useRouter()
  const unread = alert.readAt === null
  const Icon = TYPE_ICON[alert.type]

  const fecha = new Date(alert.createdAt).toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleClick = () => {
    onMarkRead(alert.id) // optimista, sin await
    onClose()
    router.push(`/dashboard/metas/${alert.goalId}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-3 rounded-md bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-colors ${
        unread ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Dot no-leído / icono de tipo */}
        <div className="flex-shrink-0 mt-0.5">
          {unread ? (
            <span className="block h-2 w-2 rounded-full bg-cyan-500" aria-label="No leído" />
          ) : (
            <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-light text-slate-200 leading-snug">
            <AlertLine alert={alert} />
          </p>
          {alert.type === 'CLOSURE_REJECTED' && alert.context?.reason && (
            <p className="text-[11px] text-slate-500 font-light mt-1 leading-snug">
              Motivo: {alert.context.reason}
            </p>
          )}
          <p className="text-[10px] text-slate-600 font-light mt-1">{fecha}</p>
        </div>
      </div>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ALERT LINE — narrativa self-contained, color semántico Cinema Mode
// (cyan = persona/actor · purple = entidad/meta · slate = conectores)
// ════════════════════════════════════════════════════════════════════════════

function AlertLine({ alert }: { alert: GoalAlert }) {
  const meta = <span className="text-purple-400 font-medium">{alert.body ?? 'tu meta'}</span>
  const actor = (
    <span className="text-cyan-400 font-medium">{alert.context?.actorName ?? 'Un revisor'}</span>
  )

  switch (alert.type) {
    case 'GOAL_ASSIGNED':
      return <>Se te asignó una nueva meta: {meta}</>
    case 'CLOSURE_APPROVED':
      return <>{actor} aprobó el cierre de {meta}</>
    case 'CLOSURE_REJECTED':
      return <>{actor} rechazó el cierre de {meta}</>
    default:
      return <>{alert.title}</>
  }
}
