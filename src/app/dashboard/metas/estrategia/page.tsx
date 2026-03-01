// ════════════════════════════════════════════════════════════════════════════
// GOALS STRATEGY - Torre de Control Estratégico (CEO/HR) - Vista Premium
// src/app/dashboard/metas/estrategia/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Users,
  Map,
  Bell,
  ChevronRight,
  ChevronDown,
  Clock,
  ArrowRight,
  Settings2,
  Plus,
  X,
  HelpCircle,
} from 'lucide-react'
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton'
import { AlignmentTreePremium } from '@/components/goals/tree/AlignmentTreePremium'
import { useAlignmentTree } from '@/hooks/useAlignmentTree'
import type { TreeGoal } from '@/hooks/useAlignmentTree'
import useSWR from 'swr'
import { getCurrentUser } from '@/lib/auth'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const CONFIG_ROLES = ['CEO', 'HR_MANAGER', 'HR_ADMIN', 'ACCOUNT_OWNER', 'FOCALIZAHR_ADMIN']

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
// NARRATIVAS EJECUTIVAS (Lenguaje DO)
// ════════════════════════════════════════════════════════════════════════════

const getExecutiveNarrative = (rate: number, orphanCount: number) => {
  if (rate === 100) {
    return {
      title: 'Alineamiento completo',
      subtitle: 'Tu organización opera con claridad estratégica. Cada meta conecta con el propósito.',
      showAlert: false,
    }
  }
  if (rate >= 80) {
    return {
      title: `${rate}% de alineamiento`,
      subtitle: 'Buen nivel de conexión estratégica. Algunas metas requieren vinculación.',
      showAlert: orphanCount > 0,
    }
  }
  if (rate >= 50) {
    return {
      title: `${rate}% de alineamiento`,
      subtitle: 'Tu organización avanza, pero se debe fortalecer la conexión entre metas y estrategia.',
      showAlert: orphanCount > 0,
    }
  }
  return {
    title: 'Alineamiento por fortalecer',
    subtitle: 'La conexión estratégica requiere atención. Considera revisar el cascadeo con tus gerentes.',
    showAlert: true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: PendingApprovalsBanner
// ════════════════════════════════════════════════════════════════════════════

const PendingApprovalsBanner = memo(function PendingApprovalsBanner() {
  const router = useRouter()

  const { data } = useSWR(
    '/api/goals/pending-closure',
    pendingFetcher,
    { revalidateOnFocus: false }
  )

  const pendingCount = data?.stats?.total || 0
  const urgentCount = data?.stats?.urgent || 0

  if (pendingCount === 0) return null

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
          <span className="text-sm font-medium hidden sm:inline">Revisar</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ExecutiveHero
// ════════════════════════════════════════════════════════════════════════════

const ExecutiveHero = memo(function ExecutiveHero({
  report,
  orphanCount,
  onViewTeam,
  onViewMap,
  onSendAlert,
}: {
  report: { alignmentRate: number; alignedGoals: number; totalGoals: number } | null
  orphanCount: number
  onViewTeam: () => void
  onViewMap: () => void
  onSendAlert: () => void
}) {
  if (!report) return null

  const { alignmentRate, alignedGoals, totalGoals } = report
  const narrative = getExecutiveNarrative(alignmentRate, orphanCount)

  // Gauge SVG
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (alignmentRate / 100) * circumference

  return (
    <div className="fhr-card p-6 sm:p-8 relative overflow-hidden">
      {/* Línea Tesla superior */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
          boxShadow: '0 0 20px #22D3EE',
        }}
      />

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Gauge */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <svg className="w-44 h-44 -rotate-90" viewBox="0 0 176 176">
            <circle
              cx="88" cy="88" r={radius}
              fill="none" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="8"
            />
            <circle
              cx="88" cy="88" r={radius}
              fill="none" stroke="url(#executiveGaugeGradient)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
            />
            <defs>
              <linearGradient id="executiveGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-light text-white">{alignmentRate}%</span>
            <span className="text-sm text-slate-400 mt-1">{alignedGoals} de {totalGoals}</span>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-2xl font-light text-white mb-2">
            {narrative.title}
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg">
            {narrative.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <PrimaryButton icon={Users} onClick={onViewTeam}>
              Ver Mi Equipo
            </PrimaryButton>
            <SecondaryButton icon={Map} onClick={onViewMap}>
              Mapa de Metas
            </SecondaryButton>
          </div>

          {/* Alerta huérfanas (condicional) */}
          {narrative.showAlert && orphanCount > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="text-cyan-400 font-medium">{orphanCount} meta{orphanCount > 1 ? 's' : ''}</span> sin conectar a la estrategia.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Considera solicitar a tus reportes una revisión del cascadeo.
                  </p>
                </div>
                <GhostButton size="sm" icon={Bell} onClick={onSendAlert}>
                  Notificar
                </GhostButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: CorporateGoalCard
// ════════════════════════════════════════════════════════════════════════════

const CorporateGoalCard = memo(function CorporateGoalCard({
  goal,
  onClick,
}: {
  goal: { id: string; title: string; progress: number; childrenCount: number }
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 w-48 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50
                 hover:border-cyan-500/30 transition-all text-left group"
    >
      <p className="text-white text-sm font-medium truncate mb-2 group-hover:text-cyan-400 transition-colors">
        {goal.title}
      </p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-light text-white">{goal.progress}%</span>
        {goal.childrenCount > 0 && (
          <span className="text-xs text-slate-500">{goal.childrenCount} hijas</span>
        )}
      </div>

      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(goal.progress, 100)}%`,
            background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
          }}
        />
      </div>
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: CorporateGoalsRail
// ════════════════════════════════════════════════════════════════════════════

const CorporateGoalsRail = memo(function CorporateGoalsRail({
  goals,
  onGoalClick,
}: {
  goals: Array<{ id: string; title: string; progress: number; childrenCount: number }>
  onGoalClick: (goalId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (goals.length === 0) return null

  return (
    <div className="fhr-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg text-white font-medium">Metas Corporativas</h3>
          <span className="text-sm text-slate-500">({goals.length})</span>
        </div>
        <GhostButton
          size="sm"
          icon={isExpanded ? ChevronDown : ChevronRight}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Colapsar' : 'Expandir'}
        </GhostButton>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {goals.map(goal => (
          <CorporateGoalCard
            key={goal.id}
            goal={goal}
            onClick={() => onGoalClick(goal.id)}
          />
        ))}
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: MapModal
// ════════════════════════════════════════════════════════════════════════════

const MapModal = memo(function MapModal({
  isOpen,
  onClose,
  tree,
  onGoalClick,
}: {
  isOpen: boolean
  onClose: () => void
  tree: TreeGoal[]
  onGoalClick: (goalId: string) => void
}) {
  const [phase, setPhase] = useState<'cover' | 'map'>('cover')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-lg text-white font-medium">Mapa de Metas</h2>
          <button
            onClick={() => { onClose(); setPhase('cover') }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {phase === 'cover' ? (
              <motion.div
                key="cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <span className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-4">
                  EXPLORADOR
                </span>
                <h3 className="text-2xl font-light text-white mb-4">
                  Mapa Organizacional de Metas
                </h3>
                <p className="text-slate-400 mb-6 max-w-md">
                  Visualiza cómo las metas corporativas se conectan con cada área y persona de tu organización.
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-8">
                  <HelpCircle className="w-4 h-4" />
                  <span className="italic">Las metas sin hijos pueden indicar falta de cascadeo.</span>
                </div>
                <PrimaryButton onClick={() => setPhase('map')}>
                  Ver Mapa
                </PrimaryButton>
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlignmentTreePremium goals={tree} onGoalClick={onGoalClick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalsStrategyPage() {
  const router = useRouter()
  const { tree, orphans, report, isLoading } = useAlignmentTree()
  const [showMapModal, setShowMapModal] = useState(false)

  const user = getCurrentUser()
  const userRole = (user as any)?.userRole || user?.role || ''
  const canConfigure = CONFIG_ROLES.includes(userRole)

  // Extraer metas corporativas para el rail
  const corporateGoals = useMemo(() => {
    return tree.map(g => ({
      id: g.id,
      title: g.title,
      progress: g.progress || 0,
      childrenCount: g.children?.length ?? 0,
    }))
  }, [tree])

  const handleViewTeam = useCallback(() => {
    router.push('/dashboard/metas/equipo')
  }, [router])

  const handleViewMap = useCallback(() => {
    setShowMapModal(true)
  }, [])

  const handleSendAlert = useCallback(() => {
    // TODO: Implementar envío de notificación a gerentes
    router.push('/dashboard/metas/equipo')
  }, [router])

  const handleGoalClick = useCallback((goalId: string) => {
    router.push(`/dashboard/metas/${goalId}`)
  }, [router])

  const handleCreateGoal = useCallback(() => {
    router.push('/dashboard/metas/crear')
  }, [router])

  // ════════════════════════════════════════════════════════════════════════
  // RENDER: Loading
  // ════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="fhr-bg-main min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="fhr-skeleton h-48 rounded-xl" />
          <div className="fhr-skeleton h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="fhr-hero-title text-2xl md:text-3xl">
              Torre de{' '}
              <span className="fhr-title-gradient">Control Estratégico</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visualiza cómo las metas se conectan con la estrategia
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canConfigure && (
              <SecondaryButton
                icon={Settings2}
                onClick={() => router.push('/dashboard/metas/configuracion/wizard')}
              >
                Configurar Sistema
              </SecondaryButton>
            )}
            <PrimaryButton icon={Plus} onClick={handleCreateGoal}>
              Nueva Meta
            </PrimaryButton>
          </div>
        </div>

        {/* Banner Aprobaciones Pendientes */}
        <PendingApprovalsBanner />

        {/* HERO: Gauge + Narrativa + CTAs + Alerta */}
        <ExecutiveHero
          report={report}
          orphanCount={orphans.length}
          onViewTeam={handleViewTeam}
          onViewMap={handleViewMap}
          onSendAlert={handleSendAlert}
        />

        {/* RAIL: Metas Corporativas */}
        <div className="mt-6">
          <CorporateGoalsRail
            goals={corporateGoals}
            onGoalClick={handleGoalClick}
          />
        </div>

      </div>

      {/* Modal Mapa de Metas */}
      <MapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        tree={tree}
        onGoalClick={handleGoalClick}
      />
    </div>
  )
})
