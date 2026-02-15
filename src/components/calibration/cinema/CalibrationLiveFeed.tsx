// ════════════════════════════════════════════════════════════════════════════
// COMPONENT: CalibrationLiveFeed - Chat en vivo de calibración
// src/components/calibration/cinema/CalibrationLiveFeed.tsx
// ════════════════════════════════════════════════════════════════════════════
// Estilo: YouTube Live Chat / Linear Activity Feed
// Filosofía: Enterprise premium, no gamer
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useCalibrationFeed,
  type FeedItem,
  type ActorRole,
  type FeedDirection
} from '../hooks/useCalibrationFeed'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CalibrationLiveFeedProps {
  adjustments: any[]
  participants: any[]
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Colores por Rol (Enterprise, no Gamer)
// ════════════════════════════════════════════════════════════════════════════

const ROLE_COLORS: Record<ActorRole, { dot: string; text: string }> = {
  FACILITATOR: { dot: 'bg-cyan-500', text: 'text-cyan-400' },
  REVIEWER: { dot: 'bg-purple-500', text: 'text-purple-400' },
  OBSERVER: { dot: 'bg-slate-500', text: 'text-slate-400' },
}

const DIRECTION_CONFIG: Record<FeedDirection, {
  icon: typeof ArrowUpRight
  color: string
  label: string
}> = {
  upgrade: {
    icon: ArrowUpRight,
    color: 'text-emerald-400',
    label: 'Promovido'
  },
  downgrade: {
    icon: ArrowDownRight,
    color: 'text-rose-400',
    label: 'Ajustado'
  },
  lateral: {
    icon: ArrowRight,
    color: 'text-slate-400',
    label: 'Movido'
  },
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Tiempo relativo
// ════════════════════════════════════════════════════════════════════════════

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins}m`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `hace ${diffHours}h`

  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: FeedItemCard
// ════════════════════════════════════════════════════════════════════════════

const FeedItemCard = memo(function FeedItemCard({
  item,
  isNew
}: {
  item: FeedItem
  isNew: boolean
}) {
  const roleColor = ROLE_COLORS[item.actorRole]
  const directionConfig = DIRECTION_CONFIG[item.direction]
  const DirectionIcon = directionConfig.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'px-3 py-2.5 rounded-lg transition-all duration-300',
        'bg-[#111827]/60 border border-transparent',
        isNew && 'border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
      )}
    >
      {/* Línea 1: Actor + Acción */}
      <div className="flex items-start gap-2">
        {/* Avatar/Dot del actor */}
        <div className={cn(
          'w-2 h-2 rounded-full mt-1.5 shrink-0',
          roleColor.dot
        )} />

        <div className="flex-1 min-w-0">
          {/* Actor + Empleado */}
          <p className="text-sm text-slate-200 leading-tight">
            <span className={cn('font-medium', roleColor.text)}>
              {item.actorName}
            </span>
            <span className="text-slate-500 mx-1">{'\u2192'}</span>
            <span className="font-medium text-white">
              {item.employeeName}
            </span>
          </p>

          {/* Movimiento: From → To + Flecha */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-slate-500">
              {item.fromQuadrant}
            </span>
            <DirectionIcon
              size={12}
              className={directionConfig.color}
            />
            <span className={cn('text-xs font-medium', directionConfig.color)}>
              {item.toQuadrant}
            </span>
            <span className="text-[10px] text-slate-600 ml-auto">
              {getRelativeTime(item.timestamp)}
            </span>
          </div>

          {/* Justificación (si existe) */}
          {item.justification && (
            <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">
              &ldquo;{item.justification}&rdquo;
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CalibrationLiveFeed({
  adjustments,
  participants,
  className
}: CalibrationLiveFeedProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { feedItems, totalChanges, hasNewItems } = useCalibrationFeed({
    adjustments,
    participants
  })

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    if (scrollRef.current && hasNewItems) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [feedItems, hasNewItems])

  // No mostrar si no hay cambios
  if (totalChanges === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-40',
        'w-80 max-h-[400px]',
        'bg-[#0B1120]/95 backdrop-blur-xl',
        'border border-slate-800 rounded-xl',
        'shadow-2xl shadow-black/50',
        'flex flex-col',
        'transition-all duration-300 ease-out',
        !isExpanded && 'max-h-12',
        className
      )}
    >
      {/* ════ HEADER ════ */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-between',
          'px-4 py-3 w-full',
          'border-b border-slate-800/50',
          'hover:bg-slate-800/30 transition-colors',
          !isExpanded && 'border-b-0'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Indicador "En Vivo" */}
          <div className="relative">
            <Radio size={14} className="text-cyan-400" />
            {hasNewItems && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            )}
          </div>

          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
            En Vivo
          </span>

          <span className="text-xs text-slate-500">
            {'\u2022'} {totalChanges} {totalChanges === 1 ? 'cambio' : 'cambios'}
          </span>
        </div>

        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-500" />
        ) : (
          <ChevronUp size={16} className="text-slate-500" />
        )}
      </button>

      {/* ════ FEED CONTENT ════ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              className={cn(
                'flex flex-col gap-2 p-3',
                'max-h-80 overflow-y-auto',
                'scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent'
              )}
            >
              <AnimatePresence mode="popLayout">
                {feedItems.slice(0, 20).map((item) => (
                  <FeedItemCard
                    key={item.id}
                    item={item}
                    isNew={item.isNew}
                  />
                ))}
              </AnimatePresence>

              {feedItems.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Los cambios aparecerán aquí
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
