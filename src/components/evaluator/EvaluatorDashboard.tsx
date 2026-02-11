'use client'

// ════════════════════════════════════════════════════════════════════════════
// EVALUATOR DASHBOARD - Portal Principal del Jefe Evaluador
// src/components/evaluator/EvaluatorDashboard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  ClipboardList,
  PartyPopper,
  AlertTriangle,
  RefreshCw,
  ListFilter
} from 'lucide-react'
import EvaluatorProgressCard from './EvaluatorProgressCard'
import SubordinateEvaluationList from './SubordinateEvaluationList'
import { EvaluationAssignment } from './SubordinateEvaluationCard'

type FilterTab = 'all' | 'pending' | 'completed'

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

interface AvailableCycle {
  id: string
  name: string
  status: string
  endDate: string
}

export default function EvaluatorDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<PerformanceCycle | null>(null)
  const [assignments, setAssignments] = useState<EvaluationAssignment[]>([])
  const [stats, setStats] = useState<EvaluatorStats>({ total: 0, completed: 0, pending: 0 })
  const [employee, setEmployee] = useState<EvaluatorEmployee | null>(null)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  // Ciclos históricos
  const [availableCycles, setAvailableCycles] = useState<AvailableCycle[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)

  // Filtrar assignments según tab activo
  const filteredAssignments = useMemo(() => {
    if (activeTab === 'all') return assignments
    if (activeTab === 'pending') {
      return assignments.filter(a => a.status === 'pending' || a.status === 'in_progress')
    }
    return assignments.filter(a => a.status === 'completed')
  }, [assignments, activeTab])

  // Cargar datos (con cycleId opcional para históricos)
  const loadData = useCallback(async (cycleId?: string | null) => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        router.push('/login?redirect=/dashboard/evaluaciones')
        return
      }

      const url = cycleId
        ? `/api/evaluator/assignments?cycleId=${cycleId}`
        : '/api/evaluator/assignments'

      const response = await fetch(url, {
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

  // Carga inicial: primero ciclos disponibles, luego decidir cuál cargar
  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        router.push('/login?redirect=/dashboard/evaluaciones')
        return
      }

      // 1. Obtener lista de ciclos del evaluador
      let cycles: AvailableCycle[] = []
      try {
        const res = await fetch('/api/evaluator/cycles', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.success) cycles = data.cycles || []
        }
      } catch { /* silencioso */ }
      setAvailableCycles(cycles)

      // 2. Decidir ciclo por defecto: ACTIVE primero, luego el más reciente
      const activeCycle = cycles.find(c => c.status === 'ACTIVE')
      const defaultCycle = activeCycle || cycles[0] || null // cycles ya viene ordenado por endDate desc

      if (defaultCycle) {
        setSelectedCycleId(defaultCycle.id)
        loadData(defaultCycle.id)
      } else {
        // Sin ciclos disponibles
        loadData()
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handler cambio de ciclo
  const handleCycleChange = useCallback((newCycleId: string) => {
    setSelectedCycleId(newCycleId)
    setActiveTab('all')
    loadData(newCycleId)
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
            onClick={() => loadData(selectedCycleId)}
            className="fhr-btn fhr-btn-secondary flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Sin ciclos disponibles
  if (!cycle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="fhr-card p-8 text-center max-w-md">
          <ClipboardList className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-200 mb-2">
            Sin Ciclos Disponibles
          </h2>
          <p className="text-slate-400">
            No hay ciclos de evaluacion de desempeno disponibles en este momento.
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
        <CycleHeader cycle={cycle} availableCycles={availableCycles} selectedCycleId={selectedCycleId} onCycleChange={handleCycleChange} />

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
        <CycleHeader cycle={cycle} availableCycles={availableCycles} selectedCycleId={selectedCycleId} onCycleChange={handleCycleChange} />

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

        {/* Filtros Tab */}
        <FilterTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
        />

        {/* Lista de evaluaciones completadas */}
        <SubordinateEvaluationList
          assignments={filteredAssignments}
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
      <CycleHeader cycle={cycle} availableCycles={availableCycles} selectedCycleId={selectedCycleId} onCycleChange={handleCycleChange} />

      {/* Progress Card */}
      <EvaluatorProgressCard
        completed={stats.completed}
        total={stats.total}
      />

      {/* Filtros Tab */}
      <FilterTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
      />

      {/* Lista de evaluaciones */}
      <SubordinateEvaluationList
        assignments={filteredAssignments}
        onEvaluate={handleEvaluate}
        onViewSummary={handleViewSummary}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: Cycle Header
// ════════════════════════════════════════════════════════════════════════════

function FilterTabs({
  activeTab,
  onTabChange,
  stats
}: {
  activeTab: FilterTab
  onTabChange: (tab: FilterTab) => void
  stats: EvaluatorStats
}) {
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: stats.total },
    { key: 'pending', label: 'Pendientes', count: stats.pending },
    { key: 'completed', label: 'Completadas', count: stats.completed }
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <ListFilter className="w-4 h-4 text-slate-500 ml-2 mr-1" />
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
            ${activeTab === tab.key
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }
          `}
        >
          <span>{tab.label}</span>
          <span className={`
            text-xs px-1.5 py-0.5 rounded-full
            ${activeTab === tab.key
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-slate-700 text-slate-500'
            }
          `}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}

function CycleHeader({ cycle, availableCycles, selectedCycleId, onCycleChange }: {
  cycle: PerformanceCycle
  availableCycles: AvailableCycle[]
  selectedCycleId: string | null
  onCycleChange: (id: string) => void
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const isHistoryMode = cycle.daysRemaining === 0 && selectedCycleId !== null
  const showSelect = availableCycles.length > 1

  return (
    <div className="fhr-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl font-light text-slate-200 mb-1 truncate">
              {cycle.name}
            </h1>
            {cycle.description && (
              <p className="text-sm text-slate-400 truncate">{cycle.description}</p>
            )}
          </div>

          {/* Select de ciclos */}
          {showSelect && (
            <select
              value={selectedCycleId || cycle.id}
              onChange={(e) => onCycleChange(e.target.value)}
              className="ml-2 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs cursor-pointer hover:border-cyan-500/50 transition-colors focus:outline-none focus:border-cyan-500/50"
            >
              {availableCycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.status !== 'ACTIVE' ? ' (cerrado)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
            </span>
          </div>

          {/* Badge: días restantes o "Cerrado" */}
          {isHistoryMode ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
              <span>Cerrado</span>
            </div>
          ) : (
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
                  ? 'Ultimo dia'
                  : cycle.daysRemaining === 1
                    ? '1 dia restante'
                    : `${cycle.daysRemaining} dias restantes`
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
