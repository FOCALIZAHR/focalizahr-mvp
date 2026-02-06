// ════════════════════════════════════════════════════════════════════════════
// RATINGS PAGE - Lista de ratings con asignacion de potencial
// src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// ARQUITECTURA: BACKEND CALCULA, FRONTEND MUESTRA
// Server-side filtering + stats + paginación real
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, RefreshCw, Grid3X3, Search,
  Users, Sparkles, CheckCircle2, AlertTriangle, ArrowRight,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'
import Link from 'next/link'
import RatingRow, { type RatingData } from '@/components/performance/RatingRow'
import DistributionGauge from '@/components/performance/DistributionGauge'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CycleInfo {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
}

interface ApiStats {
  totalRatings: number
  evaluatedCount: number
  notEvaluatedCount: number
  potentialAssignedCount: number
  potentialPendingCount: number
  evaluationProgress: number
  potentialProgress: number
}

interface ApiPagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface PageProps {
  params: { cycleId: string }
}

// ════════════════════════════════════════════════════════════════════════════
// DEBOUNCE HOOK
// ════════════════════════════════════════════════════════════════════════════

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function CycleRatingsPage({ params }: PageProps) {
  const { cycleId } = params

  // State - Data from backend
  const [cycle, setCycle] = useState<CycleInfo | null>(null)
  const [ratings, setRatings] = useState<RatingData[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [pagination, setPagination] = useState<ApiPagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // State - Filters (trigger re-fetch, NOT client-side filtering)
  const [searchInput, setSearchInput] = useState('')
  const [filterTab, setFilterTab] = useState<'evaluated' | 'all' | 'pending' | 'assigned'>('evaluated')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Debounced search - waits 300ms before triggering fetch
  const debouncedSearch = useDebounce(searchInput, 300)

  // ══════════════════════════════════════════════════════════════════════════
  // BUILD API URL with server-side filters
  // ══════════════════════════════════════════════════════════════════════════

  const buildRatingsUrl = useCallback(() => {
    const params = new URLSearchParams({
      cycleId,
      page: String(currentPage),
      limit: '20',
      sortBy: 'name',
      sortOrder: 'asc'
    })

    // Map filterTab to API params
    if (filterTab === 'evaluated') {
      params.set('evaluationStatus', 'evaluated')
    } else if (filterTab === 'pending') {
      params.set('potentialStatus', 'pending')
    } else if (filterTab === 'assigned') {
      params.set('potentialStatus', 'assigned')
    }
    // 'all' doesn't set any filter

    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim())
    }

    return `/api/admin/performance-ratings?${params.toString()}`
  }, [cycleId, currentPage, filterTab, debouncedSearch])

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH DATA - Backend does all filtering and stats
  // ══════════════════════════════════════════════════════════════════════════

  const fetchRatings = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = buildRatingsUrl()
      const res = await fetch(url)
      const json = await res.json()

      if (json.success) {
        // Transform API response to RatingData format
        const transformedRatings: RatingData[] = (json.data || []).map((r: {
          id: string
          employeeId: string
          employee?: { fullName?: string; position?: string | null; department?: { displayName?: string } | null } | null
          calculatedScore: number | null
          finalScore?: number | null
          potentialScore?: number | null
          potentialLevel?: string | null
          nineBoxPosition?: string | null
          potentialNotes?: string | null
        }) => ({
          id: r.id,
          employeeId: r.employeeId,
          employeeName: r.employee?.fullName || 'Sin nombre',
          employeePosition: r.employee?.position || null,
          departmentName: r.employee?.department?.displayName || null,
          calculatedScore: r.calculatedScore ?? 0,
          finalScore: r.finalScore,
          potentialScore: r.potentialScore,
          potentialLevel: r.potentialLevel,
          nineBoxPosition: r.nineBoxPosition,
          potentialNotes: r.potentialNotes || null
        }))

        setRatings(transformedRatings)
        setStats(json.stats)  // Stats from backend
        setPagination(json.pagination)
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [buildRatingsUrl])

  const fetchCycle = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/performance-cycles/${cycleId}`)
      const json = await res.json()
      if (json.success) {
        setCycle(json.data)
      }
    } catch (error) {
      console.error('Error fetching cycle:', error)
    }
  }, [cycleId])

  // Initial fetch
  useEffect(() => {
    fetchCycle()
  }, [fetchCycle])

  // Re-fetch when filters change
  useEffect(() => {
    fetchRatings()
  }, [fetchRatings])

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterTab, debouncedSearch])

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handlePotentialAssigned = (ratingId: string, newPotential: number) => {
    // Optimistic update
    setRatings(prev => prev.map(r =>
      r.id === ratingId
        ? { ...r, potentialScore: newPotential }
        : r
    ))
    // Update stats optimistically
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        potentialAssignedCount: prev.potentialAssignedCount + 1,
        potentialPendingCount: prev.potentialPendingCount - 1,
        potentialProgress: prev.evaluatedCount > 0
          ? Math.round(((prev.potentialAssignedCount + 1) / prev.evaluatedCount) * 100)
          : 0
      } : prev)
    }
  }

  const handleRefresh = () => {
    fetchRatings()
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DERIVED VALUES from backend stats
  // ══════════════════════════════════════════════════════════════════════════

  const progressPercent = stats?.potentialProgress ?? 0
  const evaluatedCount = stats?.evaluatedCount ?? 0
  const assignedCount = stats?.potentialAssignedCount ?? 0
  const pendingCount = stats?.potentialPendingCount ?? 0
  const notEvaluatedCount = stats?.notEvaluatedCount ?? 0

  // For Gauss distribution - extract from current ratings
  const assignedPotentialScores = ratings
    .filter(r => r.potentialScore != null)
    .map(r => r.potentialScore as number)

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {/* Back + Title */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/performance/cycles"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-light text-white">
                Asignar <span className="font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Potencial</span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {cycle?.name || 'Cargando...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
            </div>

            {/* 9-Box Button */}
            <Link
              href={`/dashboard/performance/nine-box?cycleId=${cycleId}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                assignedCount > 0
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed pointer-events-none'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              Ver 9-Box
            </Link>
          </div>
        </motion.div>

        {/* PROGRESS CARD - Stats from backend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-5 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 overflow-hidden"
        >
          {/* Linea Tesla de progreso */}
          <div
            className="absolute top-0 left-0 h-[2px] transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #22D3EE, #A78BFA)'
            }}
          />

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Izquierda: Stats del backend */}
            <div className="flex items-center justify-between lg:justify-start gap-6 flex-1">
              <div className="flex items-center gap-6">
                <StatMini icon={<Users />} label="Evaluados" value={evaluatedCount} color="cyan" />
                <StatMini icon={<CheckCircle2 />} label="Asignados" value={assignedCount} color="emerald" />
                <StatMini icon={<Sparkles />} label="Pendientes" value={pendingCount} color="amber" />
              </div>

              <div className="text-right lg:ml-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {progressPercent}%
                </div>
                <div className="text-xs text-slate-500">completado</div>
              </div>
            </div>

            {/* Derecha: Curva Gauss en vivo */}
            <div className="w-full lg:w-[280px] lg:border-l lg:border-slate-700/30 lg:pl-4 mt-4 lg:mt-0">
              <DistributionGauge assignedScores={assignedPotentialScores} />
            </div>
          </div>
        </motion.div>

        {/* BANNER PENDIENTES - ABOVE THE FOLD (Cinema Focus) */}
        {notEvaluatedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="relative overflow-hidden rounded-xl border border-amber-500/30
                       bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent
                       p-4 backdrop-blur-sm"
          >
            {/* Tesla line amber */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg
                                bg-amber-500/20 border border-amber-400/30">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-200">
                    {notEvaluatedCount} colaboradores pendientes de evaluación
                  </p>
                  <p className="text-xs text-amber-300/60">
                    Completa las evaluaciones para habilitar la Matriz 9-Box
                  </p>
                </div>
              </div>

              {/* Mini progress */}
              <div className="text-right hidden sm:block">
                <span className="text-2xl font-light text-amber-300">
                  {stats?.totalRatings && stats.totalRatings > 0
                    ? Math.round((evaluatedCount / stats.totalRatings) * 100)
                    : 0}%
                </span>
                <p className="text-[10px] text-amber-400/50 uppercase tracking-wider">
                  evaluados
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* FILTERS - Trigger server-side fetch */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search with debounce */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                'bg-slate-800/50 border border-slate-700/50',
                'text-slate-200 placeholder-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
              )}
            />
          </div>

          {/* Filter buttons - Trigger API call */}
          <div className="flex items-center gap-2">
            <FilterButton
              active={filterTab === 'evaluated'}
              onClick={() => setFilterTab('evaluated')}
              count={evaluatedCount}
            >
              Evaluados
            </FilterButton>
            <FilterButton
              active={filterTab === 'all'}
              onClick={() => setFilterTab('all')}
              color="slate"
              count={stats?.totalRatings}
            >
              Todos
            </FilterButton>
            <FilterButton
              active={filterTab === 'pending'}
              onClick={() => setFilterTab('pending')}
              color="amber"
              count={pendingCount}
            >
              Pendientes
            </FilterButton>
            <FilterButton
              active={filterTab === 'assigned'}
              onClick={() => setFilterTab('assigned')}
              color="emerald"
              count={assignedCount}
            >
              Asignados
            </FilterButton>
          </div>
        </motion.div>

        {/* RATINGS LIST - Data already filtered by backend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {isLoading ? (
            <LoadingState />
          ) : ratings.length === 0 ? (
            <EmptyState
              hasFilters={searchInput !== '' || filterTab !== 'evaluated'}
              onClearFilters={() => {
                setSearchInput('')
                setFilterTab('evaluated')
              }}
            />
          ) : (
            ratings.map((rating, index) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <RatingRow
                  rating={rating}
                  isExpanded={expandedId === rating.id}
                  onToggleExpand={() => setExpandedId(
                    expandedId === rating.id ? null : rating.id
                  )}
                  onPotentialAssigned={handlePotentialAssigned}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* PAGINATION - Real pagination, not limit=500 */}
        {pagination && pagination.pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-slate-400 px-4">
              Página {currentPage} de {pagination.pages}
              <span className="text-slate-600 ml-2">({pagination.total} total)</span>
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}

      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function StatMini({
  icon,
  label,
  value,
  color = 'slate'
}: {
  icon: React.ReactNode
  label: string
  value: number
  color?: string
}) {
  const colors: Record<string, string> = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-4 h-4', colors[color])}>{icon}</span>
      <div>
        <div className={cn('text-lg font-semibold', colors[color])}>{value}</div>
        <div className="text-[10px] text-slate-500">{label}</div>
      </div>
    </div>
  )
}

function FilterButton({
  children,
  active,
  onClick,
  color = 'cyan',
  count
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  color?: string
  count?: number
}) {
  const activeColors: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5',
        active
          ? activeColors[color]
          : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:text-slate-300'
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded',
          active ? 'bg-white/10' : 'bg-slate-700/50'
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

function LoadingState() {
  return (
    <div className="py-12 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-600 mb-3" />
      <p className="text-sm text-slate-500">Cargando ratings...</p>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onClearFilters
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
        <Users className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-slate-400 mb-2">
        {hasFilters ? 'No se encontraron resultados' : 'No hay ratings evaluados en este ciclo'}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
