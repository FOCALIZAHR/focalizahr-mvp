'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATOR DASHBOARD - Portal Principal del Jefe Evaluador
// src/components/evaluator/EvaluatorDashboard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  ClipboardList,
  PartyPopper,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import EvaluatorProgressCard from './EvaluatorProgressCard'
import SubordinateEvaluationList from './SubordinateEvaluationList'
import { EvaluationAssignment } from './SubordinateEvaluationCard'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PerformanceCycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  daysRemaining: number
}

interface EvaluatorStats {
  total: number
  completed: number
  pending: number
}

interface EvaluatorEmployee {
  id: string
  fullName: string
  position: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EvaluatorDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<PerformanceCycle | null>(null)
  const [assignments, setAssignments] = useState<EvaluationAssignment[]>([])
  const [stats, setStats] = useState<EvaluatorStats>({ total: 0, completed: 0, pending: 0 })
  const [employee, setEmployee] = useState<EvaluatorEmployee | null>(null)

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        router.push('/login?redirect=/dashboard/evaluaciones')
        return
      }

      const response = await fetch('/api/evaluator/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        router.push('/login?redirect=/dashboard/evaluaciones')
        return
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCycle(data.cycle)
        setAssignments(data.assignments || [])
        setStats(data.stats || { total: 0, completed: 0, pending: 0 })
        setEmployee(data.employee)
      } else {
        throw new Error(data.error || 'Error cargando datos')
      }
    } catch (err: any) {
      console.error('Error loading evaluator data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleEvaluate = (assignmentId: string, token: string | null) => {
    if (token) {
      // Ir directo a la encuesta si hay token
      router.push(`/encuesta/${token}`)
    } else {
      // Ir a la página de welcome/pre-encuesta
      router.push(`/dashboard/evaluaciones/${assignmentId}`)
    }
  }

  const handleViewSummary = (assignmentId: string) => {
    router.push(`/dashboard/evaluaciones/${assignmentId}?view=summary`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando evaluaciones...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="fhr-card p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">
            Error al cargar
          </h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="fhr-btn fhr-btn-secondary flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // No cycle active
  if (!cycle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="fhr-card p-8 text-center max-w-md">
          <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">
            Sin Ciclo Activo
          </h2>
          <p className="text-slate-400">
            No hay ciclos de evaluación de desempeño activos en este momento.
            Te notificaremos cuando haya evaluaciones pendientes.
          </p>
        </div>
      </div>
    )
  }

  // No assignments
  if (assignments.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header del ciclo */}
        <CycleHeader cycle={cycle} />

        <div className="fhr-card p-8 text-center">
          <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">
            No tienes evaluaciones asignadas
          </h2>
          <p className="text-slate-400">
            Actualmente no tienes colaboradores asignados para evaluar en este ciclo.
          </p>
        </div>
      </div>
    )
  }

  // 100% Completado - Success state
  if (stats.completed === stats.total && stats.total > 0) {
    return (
      <div className="space-y-6">
        {/* Header del ciclo */}
        <CycleHeader cycle={cycle} />

        {/* Progress Card */}
        <EvaluatorProgressCard
          completed={stats.completed}
          total={stats.total}
        />

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fhr-card p-8 text-center bg-green-500/5 border-green-500/30"
        >
          <PartyPopper className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-green-400 mb-2">
            ¡Felicitaciones!
          </h2>
          <p className="text-lg text-slate-300 mb-2">
            Completaste todas las evaluaciones
          </p>
          <p className="text-slate-400">
            Tu feedback es valioso para el desarrollo de tu equipo.
          </p>
        </motion.div>

        {/* Lista de evaluaciones completadas */}
        <SubordinateEvaluationList
          assignments={assignments}
          onEvaluate={handleEvaluate}
          onViewSummary={handleViewSummary}
        />
      </div>
    )
  }

  // Normal state - con evaluaciones pendientes
  return (
    <div className="space-y-6">
      {/* Header del ciclo */}
      <CycleHeader cycle={cycle} />

      {/* Progress Card */}
      <EvaluatorProgressCard
        completed={stats.completed}
        total={stats.total}
      />

      {/* Lista de evaluaciones */}
      <SubordinateEvaluationList
        assignments={assignments}
        onEvaluate={handleEvaluate}
        onViewSummary={handleViewSummary}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: Cycle Header
// ════════════════════════════════════════════════════════════════════════════

function CycleHeader({ cycle }: { cycle: PerformanceCycle }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="fhr-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-slate-200 mb-1">
            {cycle.name}
          </h1>
          {cycle.description && (
            <p className="text-sm text-slate-400">{cycle.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
            </span>
          </div>

          {/* Días restantes */}
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            ${cycle.daysRemaining <= 3
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : cycle.daysRemaining <= 7
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }
          `}>
            <Clock className="w-4 h-4" />
            <span>
              {cycle.daysRemaining === 0
                ? 'Último día'
                : cycle.daysRemaining === 1
                  ? '1 día restante'
                  : `${cycle.daysRemaining} días restantes`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
