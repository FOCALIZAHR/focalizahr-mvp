// ════════════════════════════════════════════════════════════════════════════
// GOALS HUB - Página principal del módulo de Metas Enterprise
// src/app/dashboard/metas/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Target,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
  Users,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import GoalCard from '@/components/goals/GoalCard'
import useSWR from 'swr'
import { useGoals, useAlignmentReport } from '@/hooks/useGoals'
import type { GoalLevel } from '@/hooks/useGoals'

// ════════════════════════════════════════════════════════════════════════════
// ROLES Y PERMISOS
// ════════════════════════════════════════════════════════════════════════════

const GLOBAL_ACCESS_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'CEO'
] as const

const APPROVE_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'CEO',
  'AREA_MANAGER'
] as const

// Fetcher para pending-closure
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

type TabKey = 'ALL' | 'COMPANY' | 'AREA' | 'INDIVIDUAL'
type HybridView = 'team' | 'strategy'

interface Tab {
  key: TabKey
  label: string
  level?: GoalLevel
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════

const ALL_TABS: Tab[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'COMPANY', label: 'Corporativas', level: 'COMPANY' },
  { key: 'AREA', label: 'De Área', level: 'AREA' },
  { key: 'INDIVIDUAL', label: 'Individuales', level: 'INDIVIDUAL' },
]

// Tabs filtradas según rol (se calculan en el componente)

// ════════════════════════════════════════════════════════════════════════════
// HOOK: useUserRole - Obtener rol del usuario actual
// ════════════════════════════════════════════════════════════════════════════

function useUserRole() {
  const { data, isLoading } = useSWR('/api/auth/me', pendingFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  const role = data?.user?.role || data?.role || null
  const hasGlobalAccess = role ? GLOBAL_ACCESS_ROLES.includes(role as any) : false
  const canApprove = role ? APPROVE_ROLES.includes(role as any) : false

  // Detectar si tiene subordinados (viene de /api/auth/me)
  const hasDirectReports = data?.user?.hasDirectReports || data?.hasDirectReports || false

  // Usuario híbrido: tiene acceso global Y tiene subordinados
  const isHybridUser = hasGlobalAccess && hasDirectReports

  return {
    role,
    isLoading,
    hasGlobalAccess,
    canApprove,
    hasDirectReports,
    isHybridUser,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: MetricCard
// ════════════════════════════════════════════════════════════════════════════

const MetricCard = memo(function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Target
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div className="fhr-card-metric">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-5 h-5', accent)} />
        <span className="fhr-text-sm text-slate-400">{label}</span>
      </div>
      <p className={cn('text-3xl font-extralight tabular-nums', accent)}>
        {value}
      </p>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: PendingApprovalsBanner
// ════════════════════════════════════════════════════════════════════════════

const PendingApprovalsBanner = memo(function PendingApprovalsBanner({
  canApprove,
}: {
  canApprove: boolean
}) {
  const router = useRouter()

  // Solo fetch si puede aprobar
  const { data } = useSWR(
    canApprove ? '/api/goals/pending-closure' : null,
    pendingFetcher,
    { revalidateOnFocus: false }
  )

  const pendingCount = data?.stats?.total || 0
  const urgentCount = data?.stats?.urgent || 0

  if (!canApprove || pendingCount === 0) return null

  return (
    <div
      onClick={() => router.push('/dashboard/metas/aprobaciones')}
      className="fhr-card cursor-pointer mb-6 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-white font-medium">
              Tienes {pendingCount} meta{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de aprobación
            </p>
            {urgentCount > 0 && (
              <p className="text-xs text-amber-400">
                {urgentCount} urgente{urgentCount > 1 ? 's' : ''} (más de 3 días esperando)
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-amber-400">
          <span className="text-sm font-medium">Revisar</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: HybridViewSwitcher
// ════════════════════════════════════════════════════════════════════════════

const HybridViewSwitcher = memo(function HybridViewSwitcher({
  currentView,
  onChange,
}: {
  currentView: HybridView
  onChange: (view: HybridView) => void
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-6">
      <button
        onClick={() => onChange('team')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          currentView === 'team'
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <Users className="w-4 h-4" />
        Mi Equipo
      </button>
      <button
        onClick={() => onChange('strategy')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          currentView === 'strategy'
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <BarChart3 className="w-4 h-4" />
        Estrategia
      </button>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalsHubPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [showCompleted, setShowCompleted] = useState(false)
  const [hybridView, setHybridView] = useState<HybridView>('team')

  // Obtener rol del usuario
  const { role, hasGlobalAccess, canApprove, isHybridUser, isLoading: roleLoading } = useUserRole()

  // Tabs disponibles según rol y vista híbrida
  const availableTabs = useMemo(() => {
    // Usuario híbrido en vista "Mi Equipo"
    if (isHybridUser && hybridView === 'team') {
      return [
        { key: 'ALL' as TabKey, label: 'Mi Equipo' },
        { key: 'INDIVIDUAL' as TabKey, label: 'Individuales', level: 'INDIVIDUAL' as GoalLevel },
      ]
    }

    // Usuario híbrido en vista "Estrategia" o global sin subordinados
    if (hasGlobalAccess) {
      return ALL_TABS
    }

    if (role === 'AREA_MANAGER') {
      return ALL_TABS.filter(t => t.key !== 'COMPANY')
    }

    if (role === 'EVALUATOR') {
      return [
        { key: 'ALL' as TabKey, label: 'Mis Subordinados' },
        { key: 'INDIVIDUAL' as TabKey, label: 'Individuales', level: 'INDIVIDUAL' as GoalLevel },
      ]
    }

    return ALL_TABS
  }, [hasGlobalAccess, role, isHybridUser, hybridView])

  // Determinar filtros
  const currentLevel = useMemo(
    () => availableTabs.find(t => t.key === activeTab)?.level,
    [activeTab, availableTabs]
  )

  const { goals, count, isLoading, error, mutate } = useGoals({
    level: currentLevel,
    includeCompleted: showCompleted,
  })

  const { report, isLoading: reportLoading } = useAlignmentReport()

  // Handlers
  const handleTabChange = useCallback((key: TabKey) => {
    setActiveTab(key)
  }, [])

  const handleCreateGoal = useCallback(() => {
    router.push('/dashboard/metas/crear')
  }, [router])

  const handleRetry = useCallback(() => {
    mutate()
  }, [mutate])

  const handleHybridViewChange = useCallback((view: HybridView) => {
    setHybridView(view)
    setActiveTab('ALL') // Reset tab al cambiar vista
  }, [])

  // ════════════════════════════════════════════════════════════════════════
  // RENDER: Error
  // ════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="fhr-bg-main min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="fhr-card text-center py-12">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <p className="fhr-text text-slate-300 mb-4">
              No pudimos cargar tus metas. Revisa tu conexión y reintenta.
            </p>
            <GhostButton icon={RefreshCw} size="md" onClick={handleRetry}>
              Reintentar
            </GhostButton>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* ── Hero ── */}
        <div className="fhr-hero mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="fhr-text-sm text-slate-400 uppercase tracking-widest mb-2">
                Módulo de Metas
              </p>
              <h1 className="fhr-hero-title">
                {isHybridUser && hybridView === 'team' ? (
                  <>
                    <span className="fhr-title-gradient">Mi Equipo</span>
                  </>
                ) : (
                  <>
                    <span className="fhr-title-gradient">Metas</span> Enterprise
                  </>
                )}
              </h1>
              <p className="fhr-text text-slate-400 mt-2 max-w-lg">
                {isHybridUser && hybridView === 'team'
                  ? 'Gestiona las metas de tu equipo directo'
                  : 'Define, cascadea y monitorea tus metas estratégicas con trazabilidad completa.'
                }
              </p>
            </div>

            {role !== 'EVALUATOR' && (
              <PrimaryButton icon={Plus} size="lg" onClick={handleCreateGoal}>
                Nueva Meta
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fhr-divider mb-8" />

        {/* ── Switcher Vista Híbrida ── */}
        {isHybridUser && (
          <HybridViewSwitcher
            currentView={hybridView}
            onChange={handleHybridViewChange}
          />
        )}

        {/* ── Banner Aprobaciones Pendientes ── */}
        <PendingApprovalsBanner canApprove={canApprove} />

        {/* ── Métricas Resumen (solo en vista estrategia o no híbrido) ── */}
        {(!isHybridUser || hybridView === 'strategy') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {reportLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="fhr-skeleton h-24 rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <MetricCard
                icon={Target}
                label="Total Metas"
                value={report?.totalGoals ?? count}
                accent="text-cyan-400"
              />
              <MetricCard
                icon={Link2}
                label="Alineadas"
                value={report?.alignedGoals ?? 0}
                accent="text-emerald-400"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Huérfanas"
                value={report?.orphanGoals ?? 0}
                accent="text-amber-400"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Tasa Alineación"
                value={report ? `${report.alignmentRate}%` : '—'}
                accent="text-purple-400"
              />
            </>
          )}
        </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {tab.label}
            </button>
          ))}

          {/* Toggle completadas */}
          <button
            onClick={() => setShowCompleted(prev => !prev)}
            className={cn(
              'ml-auto px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200',
              showCompleted
                ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                : 'text-slate-500 border border-transparent hover:text-slate-300'
            )}
          >
            <Filter className="w-3 h-3" />
            Completadas
          </button>
        </div>

        {/* ── Lista de Metas ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="fhr-skeleton h-44 rounded-2xl" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="fhr-card text-center py-16">
            <Target className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <h3 className="fhr-title-card text-slate-300 mb-2">
              {activeTab === 'ALL'
                ? role === 'EVALUATOR'
                  ? 'Tus subordinados aún no tienen metas'
                  : 'Aún no tienes metas definidas'
                : `Sin metas ${availableTabs.find(t => t.key === activeTab)?.label.toLowerCase()}`}
            </h3>
            <p className="fhr-text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Crea tu primera meta para comenzar a monitorear el progreso de tu equipo.
            </p>
            <PrimaryButton icon={Plus} size="md" onClick={handleCreateGoal}>
              Crear Primera Meta
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                showOwner={activeTab !== 'INDIVIDUAL'}
              />
            ))}
          </div>
        )}

        {/* ── Recomendaciones (solo en vista estrategia) ── */}
        {(!isHybridUser || hybridView === 'strategy') && report && report.recommendations.length > 0 && (
          <div className="fhr-card mt-8">
            <h3 className="fhr-title-card mb-4">
              <span className="fhr-title-gradient">Recomendaciones</span>
            </h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <li key={idx} className="fhr-text-sm text-slate-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
})
