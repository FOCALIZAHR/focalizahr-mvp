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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import GoalCard from '@/components/goals/GoalCard'
import { useGoals, useAlignmentReport } from '@/hooks/useGoals'
import type { GoalLevel } from '@/hooks/useGoals'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type TabKey = 'ALL' | 'COMPANY' | 'AREA' | 'INDIVIDUAL'

interface Tab {
  key: TabKey
  label: string
  level?: GoalLevel
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════════════════════════

const TABS: Tab[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'COMPANY', label: 'Corporativas', level: 'COMPANY' },
  { key: 'AREA', label: 'De Área', level: 'AREA' },
  { key: 'INDIVIDUAL', label: 'Individuales', level: 'INDIVIDUAL' },
]

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
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalsHubPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [showCompleted, setShowCompleted] = useState(false)

  // Determinar filtros
  const currentLevel = useMemo(
    () => TABS.find(t => t.key === activeTab)?.level,
    [activeTab]
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
                <span className="fhr-title-gradient">Metas</span> Enterprise
              </h1>
              <p className="fhr-text text-slate-400 mt-2 max-w-lg">
                Define, cascadea y monitorea tus metas estratégicas con trazabilidad completa.
              </p>
            </div>

            <PrimaryButton icon={Plus} size="lg" onClick={handleCreateGoal}>
              Nueva Meta
            </PrimaryButton>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fhr-divider mb-8" />

        {/* ── Métricas Resumen ── */}
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

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
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
                ? 'Aún no tienes metas definidas'
                : `Sin metas ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}`}
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

        {/* ── Recomendaciones ── */}
        {report && report.recommendations.length > 0 && (
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
