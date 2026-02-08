// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION LANDING PAGE - Cinema Mode
// src/app/dashboard/performance/calibration/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Resuelve ERROR 404 post-wizard redirect
// Muestra sesiones activas (carrusel) + cerradas (lista compacta)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Plus,
  Users,
  GitCompare,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Loader2,
  Calendar,
  Lock,
  Play,
  FileText,
  Settings
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface SessionData {
  id: string
  name: string
  description: string | null
  status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED'
  cycleId: string
  departmentIds: string[]
  filterMode: string
  facilitatorId: string | null
  createdAt: string
  closedAt: string | null
  scheduledAt: string | null
  enableForcedDistribution: boolean
  auditPdfUrl: string | null
  cycle: {
    id: string
    name: string
    status: string
  }
  participants: Array<{
    id: string
    participantName: string
    role: string
  }>
  _count: {
    adjustments: number
    participants: number
  }
  metadata: {
    employeeCount: number
    adjustmentsCount: number
    participantsCount: number
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS CONFIG
// ════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  pulse: boolean
  icon: typeof Play
}> = {
  DRAFT: {
    label: 'Borrador',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    pulse: false,
    icon: Settings
  },
  IN_PROGRESS: {
    label: 'En Progreso',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    pulse: true,
    icon: Play
  },
  CLOSED: {
    label: 'Cerrada',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    pulse: false,
    icon: Lock
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    pulse: false,
    icon: Lock
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function CalibrationLandingPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      const res = await fetch('/api/calibration/sessions')
      const json = await res.json()

      if (!json.success) {
        setError(json.error || 'Error cargando sesiones')
        return
      }

      setSessions(json.data || [])
      setCanManage(json.permissions?.canManage ?? false)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Separar activas vs cerradas
  const activeSessions = sessions.filter(s => s.status === 'DRAFT' || s.status === 'IN_PROGRESS')
  const closedSessions = sessions.filter(s => s.status === 'CLOSED').slice(0, 5)

  // Carrusel: mostrar 3 a la vez en desktop
  const visibleActive = activeSessions.slice(carouselIndex, carouselIndex + 3)
  const canScrollLeft = carouselIndex > 0
  const canScrollRight = carouselIndex + 3 < activeSessions.length

  // ══════════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm text-slate-400">Cargando sesiones...</span>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // ERROR
  // ══════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchSessions() }}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Calibración de Desempeño
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sesiones de calibración para asegurar equidad en las evaluaciones.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => router.push('/dashboard/performance/calibration/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus size={16} />
            Nueva Sesión
          </button>
        )}
      </div>

      {/* ═══ SESIONES ACTIVAS (CARRUSEL) ═══ */}
      {activeSessions.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutGrid size={18} className="text-cyan-400" />
              Sesiones Activas
              <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {activeSessions.length}
              </span>
            </h2>

            {/* Carousel navigation */}
            {activeSessions.length > 3 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                  disabled={!canScrollLeft}
                  className={cn(
                    'w-8 h-8 rounded-lg border flex items-center justify-center transition-all',
                    canScrollLeft
                      ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      : 'border-slate-800 text-slate-700 cursor-not-allowed'
                  )}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCarouselIndex(carouselIndex + 1)}
                  disabled={!canScrollRight}
                  className={cn(
                    'w-8 h-8 rounded-lg border flex items-center justify-center transition-all',
                    canScrollRight
                      ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                      : 'border-slate-800 text-slate-700 cursor-not-allowed'
                  )}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleActive.map((session, i) => (
              <SessionCard key={session.id} session={session} index={i} />
            ))}
          </div>
        </section>
      ) : (
        /* ═══ EMPTY STATE ═══ */
        <EmptyState canCreate={canManage} onCreateClick={() => router.push('/dashboard/performance/calibration/new')} />
      )}

      {/* ═══ SESIONES CERRADAS ═══ */}
      {closedSessions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Lock size={16} className="text-amber-400" />
            Sesiones Cerradas
          </h2>
          <div className="space-y-2">
            {closedSessions.map(session => (
              <ClosedSessionRow key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SESSION CARD - Cinema Style
// ════════════════════════════════════════════════════════════════════════════

function SessionCard({ session, index }: { session: SessionData; index: number }) {
  const router = useRouter()
  const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.DRAFT
  const StatusIcon = status.icon

  function handleClick() {
    if (session.status === 'DRAFT') {
      // DRAFT → go to cinema room (facilitator can start from there)
      router.push(`/dashboard/performance/calibration/sessions/${session.id}`)
    } else if (session.status === 'IN_PROGRESS') {
      router.push(`/dashboard/performance/calibration/sessions/${session.id}`)
    } else {
      router.push(`/dashboard/performance/calibration/sessions/${session.id}`)
    }
  }

  const ctaLabel = session.status === 'DRAFT'
    ? 'Configurar'
    : session.status === 'IN_PROGRESS'
      ? 'Abrir Sesión'
      : 'Ver Reporte'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={handleClick}
      className="relative cursor-pointer group"
    >
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 h-full flex flex-col">
        {/* Tesla line */}
        <div className={cn(
          'absolute top-0 left-4 right-4 h-[1px] rounded-full transition-all duration-300',
          session.status === 'IN_PROGRESS'
            ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80'
            : session.status === 'DRAFT'
              ? 'bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-40'
              : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-40'
        )} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {session.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {session.cycle?.name}
            </p>
          </div>

          {/* Status Badge */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ml-3',
            status.bgColor, status.borderColor, status.color,
            'border'
          )}>
            {status.pulse && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {status.label}
          </div>
        </div>

        {/* Description */}
        {session.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4">
            {session.description}
          </p>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <Users size={14} className="text-slate-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">
              {session.metadata.employeeCount}
            </p>
            <p className="text-[10px] text-slate-600">Empleados</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <GitCompare size={14} className="text-cyan-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-cyan-400">
              {session.metadata.adjustmentsCount}
            </p>
            <p className="text-[10px] text-slate-600">Ajustes</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <Users size={14} className="text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-400">
              {session.metadata.participantsCount}
            </p>
            <p className="text-[10px] text-slate-600">Panelistas</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Calendar size={12} />
            {new Date(session.createdAt).toLocaleDateString('es-CL', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </div>

          <div className={cn(
            'flex items-center gap-1.5 text-xs font-bold transition-all',
            session.status === 'IN_PROGRESS'
              ? 'text-emerald-400 group-hover:text-emerald-300'
              : 'text-cyan-400 group-hover:text-cyan-300'
          )}>
            {ctaLabel}
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CLOSED SESSION ROW
// ════════════════════════════════════════════════════════════════════════════

function ClosedSessionRow({ session }: { session: SessionData }) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/dashboard/performance/calibration/sessions/${session.id}`)}
      className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Lock size={14} className="text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.name}</p>
          <p className="text-[10px] text-slate-600">
            Cerrada {session.closedAt
              ? new Date(session.closedAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''}
            {' '} &middot; {session.metadata.adjustmentsCount} ajustes aplicados
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {session.auditPdfUrl && (
          <a
            href={session.auditPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-all"
          >
            <FileText size={12} />
            PDF
          </a>
        )}
        <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════════════════════════════

function EmptyState({ canCreate, onCreateClick }: { canCreate: boolean; onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-6">
        <Users size={32} className="text-slate-600" />
      </div>

      <h3 className="text-lg font-bold text-white mb-2">
        Sin sesiones de calibración
      </h3>
      <p className="text-sm text-slate-400 text-center max-w-md mb-8">
        {canCreate
          ? 'Crea tu primera sesión de calibración para asegurar equidad y consistencia en las evaluaciones de desempeño.'
          : 'No hay sesiones de calibración disponibles en este momento. Contacta a tu administrador de RRHH para iniciar una.'
        }
      </p>

      {canCreate && (
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus size={16} />
          Crear Primera Sesión
        </button>
      )}
    </div>
  )
}
