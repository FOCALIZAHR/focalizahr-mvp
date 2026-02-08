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
  Users,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'
import Link from 'next/link'
import RatingRow, { type RatingData } from '@/components/performance/RatingRow'
import DistributionGauge from '@/components/performance/DistributionGauge'
import DistributionModal from '@/components/performance/DistributionModal'
import { SecondaryButton } from '@/components/ui/PremiumButton'

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

  // State - Distribution Modal (Progressive Disclosure)
  const [showDistributionModal, setShowDistributionModal] = useState(false)

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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
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
                Asignar <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Potencial</span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {cycle?.name || 'Cargando...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>

            {/* 9-Box Button - Premium SecondaryButton */}
            <Link href={`/dashboard/performance/nine-box?cycleId=${cycleId}`}>
              <SecondaryButton
                icon={Grid3X3}
                size="md"
                disabled={assignedCount === 0}
              >
                Ver 9-Box
              </SecondaryButton>
            </Link>
          </div>
        </motion.div>

        {/* PROGRESS CARD UNIFICADO - Layout 50/50 Cinema */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 overflow-hidden"
        >
          {/* Tesla line top */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* IZQUIERDA: Progress Ring (50%) */}
            <div className="flex-1 flex flex-col items-center lg:items-start">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ProgressRing percent={progressPercent} size={140} strokeWidth={10} />

                <div className="text-center sm:text-left">
                  <p className="text-sm text-slate-400">
                    <span className="text-white font-semibold">{assignedCount}</span> asignados
                    {' · '}
                    <span className="text-amber-400 font-semibold">{pendingCount}</span> pendientes
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    de {evaluatedCount} evaluados
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-32 bg-slate-700/50" />

            {/* DERECHA: Distribution Gauge Clickable (50%) */}
            <div
              className="flex-1 cursor-pointer group"
              onClick={() => setShowDistributionModal(true)}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Distribución Potencial
                </p>
                <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalle
                </span>
              </div>

              {/* Gauge Preview con hover effect */}
              <div className="p-3 rounded-xl bg-slate-900/50 group-hover:bg-slate-800/50
                              border border-transparent group-hover:border-cyan-500/30 transition-all">
                <DistributionGauge assignedScores={assignedPotentialScores} variant="compact" />
              </div>

              {/* Hint mobile */}
              <p className="text-xs text-slate-500 mt-2 text-center lg:hidden">
                Toca para ver detalle
              </p>
            </div>
          </div>
        </motion.div>

        {/* MODAL DE DISTRIBUCIÓN (Progressive Disclosure) */}
        <DistributionModal
          isOpen={showDistributionModal}
          onClose={() => setShowDistributionModal(false)}
          assignedScores={assignedPotentialScores}
          totalEvaluated={evaluatedCount}
        />


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

        {/* FOOTNOTE - Colaboradores sin evaluar (sutil, no intrusivo) */}
        {notEvaluatedCount > 0 && (
          <p className="text-xs text-slate-500 text-center mt-4">
            {notEvaluatedCount} colaboradores aún sin evaluación de desempeño
          </p>
        )}

      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// Progress Ring - Cinema Apple Style
function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 8
}: {
  percent: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgb(51, 65, 85)"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {percent}%
        </span>
        <span className="text-xs text-slate-500">completado</span>
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
