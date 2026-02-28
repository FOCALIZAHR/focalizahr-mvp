// ════════════════════════════════════════════════════════════════════════════
// GOALS CINEMA ORCHESTRATOR - Orquestador principal Cinema Mode
// src/app/dashboard/metas/equipo/cinema/GoalsCinemaOrchestrator.tsx
// 
// CORREGIDO: Tab inicial 'todos', import GoalsRailTab corregido
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import useSWR from 'swr'
import { cn } from '@/lib/utils'
import { useTeamGoals } from '@/hooks/useTeamGoals'
import { GoalsMissionControl } from './GoalsMissionControl'
import { GoalsRail, type GoalsRailTab } from './GoalsRail'
import { GoalSpotlightCard } from './GoalSpotlightCard'
import BulkAssignWizard from '@/components/goals/team/BulkAssignWizard'

// ════════════════════════════════════════════════════════════════════════════
// FETCHER
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
// SKELETON
// ════════════════════════════════════════════════════════════════════════════

function CinemaModeSkeleton() {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-[200px] h-[200px] rounded-full bg-slate-800/50 animate-pulse" />
        <div className="w-48 h-4 bg-slate-800/50 rounded animate-pulse" />
        <div className="w-64 h-12 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ════════════════════════════════════════════════════════════════════════════

function CinemaModeError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Error cargando datos</h2>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════════════════════════════

function EmptyState() {
  const router = useRouter()
  
  return (
    <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <div className="w-3 h-3 rounded-full bg-slate-500" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">Sin equipo asignado</h2>
        <p className="text-sm text-slate-400 mb-4">
          No tienes colaboradores directos para gestionar metas.
        </p>
        <button
          onClick={() => router.push('/dashboard/metas')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Metas
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════════════════════════════════

function CinemaHeader() {
  const router = useRouter()
  
  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <button
        onClick={() => router.push('/dashboard/metas')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Volver a Metas</span>
      </button>
      
      <h1 className="text-sm font-medium text-slate-300">
        Gestión de Equipo
      </h1>
      
      <div className="w-20" />
    </header>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default function GoalsCinemaOrchestrator() {
  const router = useRouter()
  
  // Data
  const {
    team,
    stats,
    isLoading,
    isError,
    selectedIds,
    toggleSelection,
    clearSelection,
    nextEmployee,
    statusCounts,
    refresh,
  } = useTeamGoals()

  // Pending closures count
  const { data: pendingData } = useSWR(
    '/api/goals/pending-closure',
    pendingFetcher,
    { revalidateOnFocus: false }
  )
  const pendingCount = pendingData?.data?.length ?? 0

  // Tab inicial: primer tab con contenido
  const initialTab: GoalsRailTab = statusCounts.empty > 0 ? 'sinMetas'
    : statusCounts.incomplete > 0 ? 'incompletas'
    : 'completas'

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isRailExpanded, setIsRailExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<GoalsRailTab>(initialTab)
  
  // Modals
  const [showBulkWizard, setShowBulkWizard] = useState(false)

  // Selected employee object
  const selectedEmployee = useMemo(() => {
    if (!selectedId) return null
    return team.find(e => e.id === selectedId) || null
  }, [team, selectedId])

  // Selected employees for bulk assign
  const selectedEmployees = useMemo(() => {
    return team.filter(m => selectedIds.has(m.id))
  }, [team, selectedIds])

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setIsRailExpanded(false)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleToggleRail = useCallback(() => {
    setIsRailExpanded(prev => !prev)
  }, [])

  const handleTabChange = useCallback((tab: GoalsRailTab) => {
    setActiveTab(tab)
  }, [])

  // CTA Handler - abre BulkAssignWizard con personas que necesitan metas
  const handleBulkAssignClick = useCallback(() => {
    // Seleccionar automáticamente los que necesitan metas
    const needsGoals = team.filter(e => 
      e.hasGoalsConfigured && 
      (e.assignmentStatus?.status === 'EMPTY' || e.assignmentStatus?.status === 'INCOMPLETE')
    )
    needsGoals.forEach(e => {
      if (!selectedIds.has(e.id)) {
        toggleSelection(e.id)
      }
    })
    setShowBulkWizard(true)
  }, [team, selectedIds, toggleSelection])

  const handleApprovalsClick = useCallback(() => {
    router.push('/dashboard/metas/aprobaciones')
  }, [router])

  const handleBulkComplete = useCallback(() => {
    setShowBulkWizard(false)
    clearSelection()
    refresh()
  }, [clearSelection, refresh])

  const handleCloseWizard = useCallback(() => {
    setShowBulkWizard(false)
  }, [])

  // Spotlight handlers
  const handleCheckIn = useCallback((goalId: string) => {
    router.push(`/dashboard/metas/${goalId}`)
  }, [router])

  const handleAddGoal = useCallback(() => {
    if (selectedId) {
      router.push(`/dashboard/metas/crear?employeeId=${selectedId}`)
    }
  }, [router, selectedId])

  const handleCascadeGoal = useCallback(() => {
    if (selectedId) {
      toggleSelection(selectedId)
      setShowBulkWizard(true)
    }
  }, [selectedId, toggleSelection])

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER CONDITIONS
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) return <CinemaModeSkeleton />
  if (isError) return <CinemaModeError error="No se pudieron cargar los datos" onRetry={refresh} />
  if (team.length === 0) return <EmptyState />

  const isSpotlight = selectedId !== null && selectedEmployee !== null

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen w-full bg-[#0F172A] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <CinemaHeader />

      {/* Stage */}
      <div className={cn(
        'flex-1 relative flex items-center justify-center p-4 md:p-8',
        'transition-all duration-500 ease-in-out',
        isRailExpanded ? 'mb-[320px]' : 'mb-[56px]'
      )}>
        <AnimatePresence mode="wait">

          {/* LOBBY: MissionControl */}
          {!isSpotlight && (
            <GoalsMissionControl
              key="lobby"
              stats={stats}
              pendingCount={pendingCount}
              statusCounts={statusCounts}
              onBulkAssignClick={handleBulkAssignClick}
              onApprovalsClick={handleApprovalsClick}
            />
          )}

          {/* SPOTLIGHT: SpotlightCard */}
          {isSpotlight && selectedEmployee && (
            <GoalSpotlightCard
              key={`spotlight-${selectedId}`}
              employee={selectedEmployee}
              onBack={handleBack}
              onCheckIn={handleCheckIn}
              onAddGoal={handleAddGoal}
              onCascadeGoal={handleCascadeGoal}
            />
          )}

        </AnimatePresence>
      </div>

      {/* Backdrop blur when rail expanded */}
      <AnimatePresence>
        {isRailExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleToggleRail}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-20"
          />
        )}
      </AnimatePresence>

      {/* Rail */}
      <GoalsRail
        employees={team}
        selectedId={selectedId}
        isExpanded={isRailExpanded}
        activeTab={activeTab}
        statusCounts={statusCounts}
        onToggle={handleToggleRail}
        onSelect={handleSelect}
        onTabChange={handleTabChange}
        onBulkAssign={handleBulkAssignClick}
      />

      {/* BulkAssignWizard Modal (z-50, sobre todo) */}
      {showBulkWizard && (
        <BulkAssignWizard
          employees={selectedEmployees.length > 0 ? selectedEmployees : team.filter(e => e.hasGoalsConfigured)}
          onComplete={handleBulkComplete}
          onClose={handleCloseWizard}
        />
      )}
    </div>
  )
}