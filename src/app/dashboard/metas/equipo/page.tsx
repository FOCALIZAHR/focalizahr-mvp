// ════════════════════════════════════════════════════════════════════════════
// TEAM GOALS PAGE - Dashboard de metas del equipo
// src/app/dashboard/metas/equipo/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Plus, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import useSWR from 'swr'
import { useTeamGoals } from '@/hooks/useTeamGoals'
import { TeamCoverageGauge } from '@/components/goals/team/TeamCoverageGauge'
import { EmployeeGoalCard } from '@/components/goals/team/EmployeeGoalCard'
import { SelectionBar } from '@/components/goals/team/SelectionBar'
import BulkAssignWizard from '@/components/goals/team/BulkAssignWizard'
import { EmployeeGoalsModal } from '@/components/goals/team/EmployeeGoalsModal'
import type { TeamMember } from '@/hooks/useTeamGoals'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'

// ════════════════════════════════════════════════════════════════════════════
// FETCHER PARA PENDING CLOSURE
// ════════════════════════════════════════════════════════════════════════════

const pendingFetcher = (url: string) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null
  return fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
  }).then(res => res.ok ? res.json() : null)
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type FilterType = 'all' | 'withGoals' | 'withoutGoals' | 'noGoalsRequired'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: DynamicCTA
// ════════════════════════════════════════════════════════════════════════════

interface DynamicCTAProps {
  stats: {
    total: number
    withGoals: number
    withoutGoals: number
    noGoalsRequired: number
  }
  pendingCount: number
  onAssignClick: () => void
  onApprovalsClick: () => void
}

const DynamicCTA = memo(function DynamicCTA({
  stats,
  pendingCount,
  onAssignClick,
  onApprovalsClick,
}: DynamicCTAProps) {
  const router = useRouter()

  // Determinar qué CTA mostrar
  const hasWithoutGoals = stats.withoutGoals > 0
  const hasPending = pendingCount > 0
  const allCovered = stats.withoutGoals === 0 && (stats.total - stats.noGoalsRequired) > 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* CTA Principal según estado */}
      {hasWithoutGoals ? (
        <PrimaryButton icon={Plus} onClick={onAssignClick}>
          Asignar Metas ({stats.withoutGoals})
        </PrimaryButton>
      ) : allCovered ? (
        <SecondaryButton
          icon={CheckCircle2}
          onClick={() => router.push('/dashboard/metas')}
        >
          Ver Progreso
        </SecondaryButton>
      ) : null}

      {/* CTA Aprobaciones si hay pendientes */}
      {hasPending && (
        <button
          onClick={onApprovalsClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
        >
          <Clock className="w-4 h-4" />
          Aprobar Cierres
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/30 text-xs">
            {pendingCount}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
})

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'withGoals', label: 'Con metas' },
  { value: 'withoutGoals', label: 'Sin metas' },
  { value: 'noGoalsRequired', label: 'Cargo sin metas' },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function TeamGoalsPage() {
  const router = useRouter()

  // Fetch aprobaciones pendientes
  const { data: pendingData } = useSWR(
    '/api/goals/pending-closure',
    pendingFetcher,
    { revalidateOnFocus: false }
  )
  const pendingCount = pendingData?.stats?.total || 0
  const {
    team, stats, isLoading, selectedIds, selectedCount,
    toggleSelection, clearSelection, refresh,
  } = useTeamGoals()

  const [filter, setFilter] = useState<FilterType>('all')
  const [showBulkWizard, setShowBulkWizard] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  // Filter team
  const filteredTeam = useMemo(() => {
    return team.filter((member: TeamMember) => {
      switch (filter) {
        case 'withGoals':
          return member.goalsCount > 0
        case 'withoutGoals':
          return member.hasGoalsConfigured && member.goalsCount === 0
        case 'noGoalsRequired':
          return !member.hasGoalsConfigured
        default:
          return true
      }
    })
  }, [team, filter])

  const handleEmployeeClick = useCallback((id: string) => {
    setSelectedEmployeeId(id)
  }, [])

  const handleBulkAssign = useCallback(() => {
    setShowBulkWizard(true)
  }, [])

  const handleBulkComplete = useCallback(() => {
    setShowBulkWizard(false)
    clearSelection()
    refresh()
  }, [clearSelection, refresh])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleCloseWizard = useCallback(() => {
    setShowBulkWizard(false)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedEmployeeId(null)
  }, [])

  const handleAssignFromCTA = useCallback(() => {
    // Seleccionar todos los empleados sin metas
    const withoutGoals = team.filter(e => e.hasGoalsConfigured && e.goalsCount === 0)
    withoutGoals.forEach(e => {
      if (!selectedIds.has(e.id)) {
        toggleSelection(e.id)
      }
    })
    // Abrir wizard si hay seleccionados
    if (withoutGoals.length > 0) {
      setShowBulkWizard(true)
    }
  }, [team, selectedIds, toggleSelection])

  const handleApprovalsClick = useCallback(() => {
    router.push('/dashboard/metas/aprobaciones')
  }, [router])

  const selectedEmployees = useMemo(() => {
    return team.filter((m: TeamMember) => selectedIds.has(m.id))
  }, [team, selectedIds])

  return (
    <div className="fhr-bg-main min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Metas</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="fhr-hero-title text-2xl md:text-3xl">
                  Metas de tu{' '}
                  <span className="fhr-title-gradient">Equipo</span>
                </h1>
                <p className="text-slate-400 text-sm">
                  Gestiona las metas de tus colaboradores
                </p>
              </div>
            </div>

            {/* CTA Dinámico */}
            {!isLoading && (
              <DynamicCTA
                stats={stats}
                pendingCount={pendingCount}
                onAssignClick={handleAssignFromCTA}
                onApprovalsClick={handleApprovalsClick}
              />
            )}
          </div>
        </div>

        {/* Gauge */}
        <div className="mb-6">
          <TeamCoverageGauge stats={stats} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Employee grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="fhr-skeleton h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="fhr-card p-8 text-center">
            <p className="text-slate-400">No hay colaboradores en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredTeam.map((employee: TeamMember) => (
              <EmployeeGoalCard
                key={employee.id}
                employee={employee}
                isSelected={selectedIds.has(employee.id)}
                onToggleSelect={toggleSelection}
                onClick={handleEmployeeClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selection bar */}
      <SelectionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onAssign={handleBulkAssign}
      />

      {/* Bulk wizard */}
      {showBulkWizard && (
        <BulkAssignWizard
          employees={selectedEmployees}
          onClose={handleCloseWizard}
          onComplete={handleBulkComplete}
        />
      )}

      {/* Individual modal */}
      {selectedEmployeeId && (
        <EmployeeGoalsModal
          employeeId={selectedEmployeeId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
