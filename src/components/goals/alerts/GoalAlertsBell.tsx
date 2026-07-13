// ════════════════════════════════════════════════════════════════════════════
// GoalAlertsBell - Campana de avisos de metas en el topbar del dashboard
// src/components/goals/alerts/GoalAlertsBell.tsx
// ════════════════════════════════════════════════════════════════════════════
// Contenedor: estado open + click-outside + hook useGoalAlerts. Trigger mimetizado
// con el header (ghost). Badge numérico cyan. Popover en GoalAlertsPopover.
// Estructura clonada de MisPlanesBtn (open/click-outside) y badge de AdminNavigation.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useGoalAlerts } from '@/hooks/useGoalAlerts'
import { GoalAlertsPopover } from './GoalAlertsPopover'

export function GoalAlertsBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { alerts, unreadCount, isLoading, isError, markAsRead, markAllAsRead } = useGoalAlerts()

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={unreadCount > 0 ? `Avisos (${unreadCount} sin leer)` : 'Avisos'}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-[10px] font-semibold text-slate-950 flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <GoalAlertsPopover
          alerts={alerts}
          unreadCount={unreadCount}
          isLoading={isLoading}
          isError={isError}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
