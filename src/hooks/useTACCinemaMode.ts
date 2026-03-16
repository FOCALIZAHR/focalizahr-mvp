// src/hooks/useTACCinemaMode.ts
// Central state + logic for TAC Cinema Mode
// Clonado de useEvaluatorCinemaMode.ts — misma estructura

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTalentActions } from './useTalentActions'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'
import type {
  GerenciaCardData,
  SelectedGerencia,
  TACCinemaStats,
  TACRailPill
} from '@/types/tac-cinema'

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const REQUIRES_ACTION = new Set(['FRAGIL', 'QUEMADA', 'ESTANCADA', 'RIESGO_OCULTO'])

function toCardData(g: GerenciaMapItem): GerenciaCardData {
  const plTotal = g.financialImpact
    ? g.financialImpact.fugaCerebrosCostCLP + g.financialImpact.iccRiskCLP
    : 0
  return {
    id: g.gerenciaId,
    displayName: g.gerenciaName,
    pattern: g.pattern,
    totalPersonas: g.totalPersonas,
    clasificadas: g.clasificadas,
    icc: g.icc,
    fugaCount: g.riskDistribution.FUGA_CEREBROS,
    burnoutCount: g.riskDistribution.BURNOUT_RISK,
    motorCount: g.riskDistribution.MOTOR_EQUIPO,
    bajoRendimientoCount: g.riskDistribution.BAJO_RENDIMIENTO,
    plTotal,
    requiresAction: g.pattern ? REQUIRES_ACTION.has(g.pattern) : false,
    dataInsufficient: g.dataInsufficient,
    sucesoresTotal: g.sucesores.total,
    sucesoresEnPlan: g.sucesores.enPlanFormal
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export function useTACCinemaMode() {
  const {
    orgMap, selectedGerencia: _, flaggedGerencias, userRole,
    loading: isLoading, error, selectGerencia, clearSelection, refetch
  } = useTalentActions()

  // UI state (mismo patron que evaluator)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isRailExpanded, setRailExpanded] = useState(true)
  const [activePill, setActivePill] = useState<TACRailPill>('gerencias')
  const [showDetailModal, setShowDetailModal] = useState(false)
  // Cover → Spotlight flow (patron GuidedSummaryOrchestrator)
  const [viewPhase, setViewPhase] = useState<'cover' | 'spotlight'>('cover')

  // Transform gerencias to card data (equivalente a employees mapping)
  const gerencias = useMemo<GerenciaCardData[]>(() => {
    if (!orgMap) return []
    return orgMap.gerencias.map(toCardData).sort((a, b) => {
      if (a.requiresAction && !b.requiresAction) return -1
      if (!a.requiresAction && b.requiresAction) return 1
      return b.fugaCount - a.fugaCount
    })
  }, [orgMap])

  // Stats (equivalente a CinemaStats)
  const stats = useMemo<TACCinemaStats>(() => {
    if (!orgMap) return {
      totalGerencias: 0, totalPersonas: 0, totalClasificadas: 0,
      iccOrganizacional: null, gerenciasEnRiesgo: 0, personasEnFuga: 0,
      plTotal: 0, patronDominante: null
    }
    let plTotal = 0
    let fugaTotal = 0
    let enRiesgo = 0
    for (const g of gerencias) {
      plTotal += g.plTotal
      fugaTotal += g.fugaCount
      if (g.requiresAction) enRiesgo++
    }
    return {
      totalGerencias: orgMap.orgStats.totalGerencias,
      totalPersonas: orgMap.orgStats.totalPersonas,
      totalClasificadas: orgMap.orgStats.totalClasificadas,
      iccOrganizacional: orgMap.orgStats.iccOrganizacional,
      gerenciasEnRiesgo: enRiesgo,
      personasEnFuga: fugaTotal,
      plTotal,
      patronDominante: orgMap.orgStats.patronDominante
    }
  }, [orgMap, gerencias])

  // Selected gerencia with full data (equivalente a selectedEmployee)
  const selectedGerencia = useMemo<SelectedGerencia | null>(() => {
    if (!selectedId || !orgMap) return null
    const card = gerencias.find(g => g.id === selectedId)
    const full = orgMap.gerencias.find(g => g.gerenciaId === selectedId)
    if (!card || !full) return null
    return { ...card, full }
  }, [selectedId, gerencias, orgMap])

  // Next gerencia (equivalente a nextEmployee — priority: mas critica primero)
  const nextGerencia = useMemo(() => {
    const critical = gerencias.find(g => g.requiresAction && !g.dataInsufficient)
    if (critical) return { id: critical.id, displayName: critical.displayName }
    const first = gerencias.find(g => !g.dataInsufficient)
    return first ? { id: first.id, displayName: first.displayName } : null
  }, [gerencias])

  // AREA_MANAGER auto-select (equivalente al flujo de evaluator)
  const isAreaManager = userRole === 'AREA_MANAGER'
  useEffect(() => {
    if (isAreaManager && !selectedId && gerencias.length > 0) {
      setSelectedId(gerencias[0].id)
      setRailExpanded(false)
    }
  }, [isAreaManager, selectedId, gerencias])

  // Handlers
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    selectGerencia(id)
    setViewPhase('cover')
    setRailExpanded(false)
  }, [selectGerencia])

  const handleEnterSpotlight = useCallback(() => {
    setViewPhase('spotlight')
  }, [])

  const handleBack = useCallback(() => {
    if (viewPhase === 'spotlight') {
      setViewPhase('cover')
      return
    }
    // En cover → volver a lobby
    if (isAreaManager) return
    setSelectedId(null)
    clearSelection()
    setViewPhase('cover')
    setRailExpanded(true)
  }, [viewPhase, clearSelection, isAreaManager])

  const handleToggleRail = useCallback(() => {
    setRailExpanded(prev => !prev)
  }, [])

  const handleOpenDetail = useCallback(() => {
    setShowDetailModal(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setShowDetailModal(false)
  }, [])

  return {
    // Data
    gerencias,
    selectedGerencia,
    nextGerencia,
    stats,
    flaggedGerencias,
    userRole,

    // UI State
    selectedId,
    viewPhase,
    isRailExpanded,
    activePill,
    showDetailModal,
    isLoading,
    error,
    isAreaManager,

    // Actions
    handleSelect,
    handleEnterSpotlight,
    handleBack,
    handleToggleRail,
    setActivePill,
    handleOpenDetail,
    handleCloseDetail,
    reload: refetch
  }
}
