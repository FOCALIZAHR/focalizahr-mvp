'use client'

// ════════════════════════════════════════════════════════════════════════════
// PDI GUIDED ORCHESTRATOR - 3-Level State Machine
// src/components/pdi/guided/PDIGuidedOrchestrator.tsx
// ════════════════════════════════════════════════════════════════════════════
// Replaces PDIWizardOrchestrator with Cinema Mode layout
// Flow: Hub → Cover → Content (PDIWizardCard)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRoleFitClassification } from '@/config/performanceClassification'
import { useDebounce } from '@/hooks/useDebounce'

// Existing PDI components (reused)
import PDIManualGoalCard from '../PDIManualGoalCard'
import PDISummaryCard from '../PDISummaryCard'
import PDINoGapsCard from '../PDINoGapsCard'
import PDISelectionList from '../PDISelectionList'

// Guided experience components
import PDILeftColumn from './PDILeftColumn'
import PDIHub from './PDIHub'
import PDICategoryCover from './PDICategoryCover'
import PDICategoryContent from './PDICategoryContent'

// Types
import type { WizardGap, WizardSuggestion, EditedGoal } from '../PDIWizardCard'
import type { Category, EnrichedGap, RoleFitResult } from './types'

// ════════════════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ════════════════════════════════════════════════════════════════════════════

type ViewLevel =
  | 'loading'
  | 'hub'
  | 'cover'
  | 'content'
  | 'manual'
  | 'summary'
  | 'no-gaps'
  | 'selection'

interface PDIGuidedOrchestratorProps {
  employeeId: string
  cycleId: string
  employeeName: string
  onComplete?: (pdiId: string) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function PDIGuidedOrchestrator({
  employeeId,
  cycleId,
  employeeName,
  onComplete
}: PDIGuidedOrchestratorProps) {

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const [viewLevel, setViewLevel] = useState<ViewLevel>('loading')
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  const [roleFit, setRoleFit] = useState<RoleFitResult | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [enrichedGaps, setEnrichedGaps] = useState<EnrichedGap[]>([])
  const [gaps, setGaps] = useState<WizardGap[]>([])
  const [suggestions, setSuggestions] = useState<WizardSuggestion[]>([])
  const [editedGoals, setEditedGoals] = useState<EditedGoal[]>([])
  const [manualGoals, setManualGoals] = useState<Array<{ title: string; targetOutcome: string }>>([])
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [pdiId, setPdiId] = useState<string | null>(null)
  const [pdiGoals, setPdiGoals] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const generatingRef = useRef(false)

  // Elapsed timer
  useEffect(() => {
    if (viewLevel !== 'loading') return
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [viewLevel])

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART ROUTER (from PDIWizardOrchestrator)
  // ═══════════════════════════════════════════════════════════════════════════

  function enrichGapWithLibrary(
    gap: WizardGap,
    index: number,
    _totalCritical: number,
    performanceTrack: 'EJECUTIVO' | 'MANAGER' | 'COLABORADOR' = 'COLABORADOR'
  ): EnrichedGap {
    const { PDI_COMPETENCY_LIBRARY, GENERIC_COMPETENCY_TEMPLATE } = require('@/lib/data/pdi-competency-library')

    const template = PDI_COMPETENCY_LIBRARY[gap.competencyCode] ||
      Object.values(PDI_COMPETENCY_LIBRARY).find(
        (t: any) => t.keywords?.some((k: string) =>
          gap.competencyName.toLowerCase().includes(k)
        )
      ) ||
      GENERIC_COMPETENCY_TEMPLATE

    const gapType = gap.status === 'EXCEEDS'
      ? 'strength'
      : gap.rawGap <= -1.5
        ? 'blindSpot'
        : 'development'

    const strategies = template.strategies[performanceTrack] || template.strategies.COLABORADOR
    const strategyList = strategies[gapType] || strategies.development || []
    const strategy = strategyList[0] || {}

    const tips = template.coachingTips || {}
    const tipList = tips[gapType] || tips.development || []
    const coachingTip = tipList[Math.floor(Math.random() * tipList.length)] || ''

    let category: Category
    let categoryLabel: string
    let categoryColor: string

    if (gap.status === 'EXCEEDS') {
      category = 'POTENCIAR'
      categoryLabel = 'Fortaleza a potenciar'
      categoryColor = '#10B981'
    } else if (gap.status === 'CRITICAL') {
      if (index === 0) {
        category = 'URGENTE'
        categoryLabel = 'Brecha m\u00E1s cr\u00EDtica'
        categoryColor = '#EF4444'
      } else {
        category = 'IMPACTO'
        categoryLabel = 'Alto impacto'
        categoryColor = '#F59E0B'
      }
    } else {
      category = 'QUICK_WIN'
      categoryLabel = 'Quick Win'
      categoryColor = '#A78BFA'
    }

    return {
      ...gap,
      category,
      categoryLabel,
      categoryColor,
      narrative: strategy.description || 'Esta competencia requiere atenci\u00F3n para alcanzar el nivel esperado del cargo.',
      coachingTip: coachingTip || 'Explora con preguntas abiertas c\u00F3mo percibe esta competencia.'
    }
  }

  function smartRouteItems(
    gapsInput: WizardGap[],
    performanceTrack: 'EJECUTIVO' | 'MANAGER' | 'COLABORADOR' = 'COLABORADOR'
  ) {
    const critical = gapsInput.filter(g => g.status === 'CRITICAL')
      .sort((a, b) => a.rawGap - b.rawGap)
    const improve = gapsInput.filter(g => g.status === 'IMPROVE')
      .sort((a, b) => b.rawGap - a.rawGap)
    const exceeds = gapsInput.filter(g => g.status === 'EXCEEDS')
      .sort((a, b) => b.rawGap - a.rawGap)
      .slice(0, 2)

    const allGaps = [...critical, ...improve, ...exceeds]
    const totalCritical = critical.length
    const enriched = allGaps.map((gap, index) =>
      enrichGapWithLibrary(gap, index, totalCritical, performanceTrack)
    )

    if (enriched.length <= 4) {
      return { selectedItems: enriched, allItems: enriched, skipSelectionList: true }
    }

    const selected: EnrichedGap[] = []
    const urgente = enriched.find(g => g.category === 'URGENTE')
    if (urgente) selected.push(urgente)
    const impacto = enriched.find(g => g.category === 'IMPACTO' && !selected.includes(g))
    if (impacto && selected.length < 4) selected.push(impacto)
    const quickWin = enriched.find(g => g.category === 'QUICK_WIN' && !selected.includes(g))
    if (quickWin && selected.length < 4) selected.push(quickWin)
    const potenciar = enriched.find(g => g.category === 'POTENCIAR' && !selected.includes(g))
    if (potenciar && selected.length < 4) selected.push(potenciar)

    const remaining = enriched.filter(g => !selected.includes(g))
    while (selected.length < 4 && remaining.length > 0) {
      selected.push(remaining.shift()!)
    }

    return { selectedItems: selected, allItems: enriched, skipSelectionList: false }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  async function processExistingGoals(
    goalsFromDB: any[],
    employeeIdParam: string,
    cycleIdParam: string
  ) {
    if (!goalsFromDB || goalsFromDB.length === 0) {
      setViewLevel('no-gaps')
      return
    }

    let roleFitGapsMap = new Map<string, any>()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const roleFitRes = await fetch(
        `/api/performance/role-fit?employeeId=${employeeIdParam}&cycleId=${cycleIdParam}`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)
      if (roleFitRes.ok) {
        const roleFitData = await roleFitRes.json()
        if (roleFitData.success && roleFitData.data?.gaps) {
          setRoleFit(roleFitData.data)
          for (const gap of roleFitData.data.gaps) {
            roleFitGapsMap.set(gap.competencyCode, gap)
          }
        }
      }
    } catch {
      console.log('[PDI Guided] RoleFit API unavailable')
    }

    const gapsWithScores: WizardGap[] = goalsFromDB.map((goal: any) => {
      const roleFitGap = roleFitGapsMap.get(goal.competencyCode)
      if (roleFitGap) {
        return {
          competencyCode: goal.competencyCode,
          competencyName: goal.competencyName,
          actualScore: roleFitGap.actualScore,
          targetScore: roleFitGap.targetScore,
          rawGap: roleFitGap.rawGap,
          status: roleFitGap.status
        }
      }
      const gap = goal.originalGap || 0
      const targetScore = 3.0
      const actualScore = Math.max(0, targetScore + gap)
      let status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS' = 'IMPROVE'
      if (gap <= -1.5) status = 'CRITICAL'
      else if (gap < -0.5) status = 'IMPROVE'
      else if (gap > 0.5) status = 'EXCEEDS'
      else status = 'MATCH'
      return {
        competencyCode: goal.competencyCode,
        competencyName: goal.competencyName,
        actualScore: Number(actualScore.toFixed(1)),
        targetScore,
        rawGap: gap,
        status
      }
    })

    const routerResult = smartRouteItems(gapsWithScores, 'COLABORADOR')
    setEnrichedGaps(routerResult.allItems)

    const wizardSuggestions = routerResult.allItems.map((g: EnrichedGap) => {
      const goalData = goalsFromDB.find((goal: any) => goal.competencyCode === g.competencyCode)
      return {
        title: goalData?.title || `Desarrollar ${g.competencyName}`,
        description: goalData?.description || '',
        targetOutcome: goalData?.targetOutcome || '',
        suggestedResources: goalData?.suggestedResources || [],
        coachingTip: g.coachingTip,
        action: '',
        estimatedWeeks: 8,
        narrative: g.narrative,
        category: g.category,
        categoryLabel: g.categoryLabel,
        categoryColor: g.categoryColor
      }
    })

    setGaps(routerResult.allItems)
    setSuggestions(wizardSuggestions)
    setViewLevel('hub')
  }

  function processGeneratedData(postData: any) {
    const roleFitData = postData.meta?.roleFit
    const enriched = postData.meta?.enrichedSuggestions || []

    if (roleFitData) setRoleFit(roleFitData)
    if (postData.data.employee?.overallScore) setOverallScore(postData.data.employee.overallScore)

    const allGaps = (roleFitData?.gaps || []).filter((g: any) => g.status !== 'MATCH')
    if (allGaps.length === 0) {
      setViewLevel('no-gaps')
      return
    }

    const wizardGapsRaw: WizardGap[] = allGaps.map((g: any) => ({
      competencyCode: g.competencyCode,
      competencyName: g.competencyName,
      actualScore: g.actualScore,
      targetScore: g.targetScore,
      rawGap: g.rawGap,
      status: g.status
    }))

    const track = roleFitData?.performanceTrack || 'COLABORADOR'
    const routerResult = smartRouteItems(wizardGapsRaw, track)
    setEnrichedGaps(routerResult.allItems)

    const wizardSuggestions = routerResult.allItems.map((g: EnrichedGap) => {
      const pdiGoal = (postData.data.goals || []).find(
        (goal: any) => goal.competencyCode === g.competencyCode
      )
      const enrichedData = enriched.find(
        (e: any) => e.competencyCode === g.competencyCode
      )
      return {
        title: pdiGoal?.title || `Desarrollar ${g.competencyName}`,
        description: pdiGoal?.description || '',
        targetOutcome: pdiGoal?.targetOutcome || '',
        suggestedResources: pdiGoal?.suggestedResources || [],
        coachingTip: g.coachingTip || enrichedData?.coachingTip || '',
        action: enrichedData?.action || '',
        estimatedWeeks: enrichedData?.estimatedWeeks || 8,
        narrative: g.narrative,
        category: g.category,
        categoryLabel: g.categoryLabel,
        categoryColor: g.categoryColor
      }
    })

    setGaps(routerResult.allItems)
    setSuggestions(wizardSuggestions)
    setSelectedCodes(routerResult.selectedItems.map(g => g.competencyCode))

    if (routerResult.skipSelectionList) {
      setViewLevel('hub')
    } else {
      setViewLevel('selection')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (generatingRef.current) return
    generatingRef.current = true

    async function loadPDI() {
      try {
        setError(null)

        // Step 1: Try loading existing PDI
        console.log('[PDI Guided] Checking for existing PDI...')
        const getRes = await fetch(
          `/api/pdi/by-employee?employeeId=${employeeId}&cycleId=${cycleId}`
        )
        const getData = await getRes.json()

        if (getData.success && getData.exists) {
          const existingPDI = getData.data
          if (existingPDI.status !== 'DRAFT') {
            onComplete?.(existingPDI.id)
            return
          }
          console.log('[PDI Guided] Loading existing DRAFT PDI')
          setPdiId(existingPDI.id)
          setPdiGoals(existingPDI.goals || [])
          await processExistingGoals(existingPDI.goals || [], employeeId, cycleId)
          return
        }

        // Step 2: Generate new PDI
        console.log('[PDI Guided] No existing PDI, generating new...')
        const postRes = await fetch('/api/pdi/generate-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, cycleId })
        })
        const postData = await postRes.json()

        if (!postData.success) {
          if (postRes.status === 409 && postData.existingId) {
            onComplete?.(postData.existingId)
            return
          }
          throw new Error(postData.error || 'Error generando PDI')
        }

        setPdiId(postData.data.id)
        setPdiGoals(postData.data.goals || [])
        processGeneratedData(postData)

      } catch (err) {
        console.error('[PDI Guided] Load error:', err)
        setError(err instanceof Error ? err.message : 'Error cargando PDI')
      }
    }

    loadPDI()
  }, [employeeId, cycleId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const saveGoalToBackend = useCallback(async (
    goalId: string,
    updates: { title?: string; targetOutcome?: string }
  ) => {
    if (!goalId || goalId.startsWith('gap-')) return
    setIsSaving(true)
    try {
      await fetch(`/api/pdi/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error('[PDI Guided] Auto-save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const debouncedSave = useDebounce(saveGoalToBackend, 1500)

  const updateGoalInState = useCallback((
    goalId: string,
    updates: { title?: string; targetOutcome?: string }
  ) => {
    setPdiGoals(prev => prev.map((g: any) =>
      g.id === goalId ? { ...g, ...updates } : g
    ))
    const goal = pdiGoals.find((g: any) => g.id === goalId)
    if (goal) {
      const gapIdx = gaps.findIndex(g => g.competencyCode === goal.competencyCode)
      if (gapIdx !== -1) {
        setSuggestions(prev => prev.map((s, i) =>
          i === gapIdx ? { ...s, ...updates } : s
        ))
      }
    }
    debouncedSave(goalId, updates)
  }, [pdiGoals, gaps, debouncedSave])

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectCategory = useCallback((category: Category) => {
    setActiveCategory(category)
    setViewLevel('cover')
  }, [])

  const handleEnterContent = useCallback(() => {
    setViewLevel('content')
  }, [])

  const handleBack = useCallback(() => {
    if (viewLevel === 'content') {
      setViewLevel('cover')
    } else if (viewLevel === 'cover') {
      setViewLevel('hub')
      setActiveCategory(null)
    }
  }, [viewLevel])

  const handleBackToHub = useCallback(() => {
    setViewLevel('hub')
    setActiveCategory(null)
  }, [])

  const handleAddGoal = useCallback((edited: EditedGoal) => {
    setEditedGoals(prev => [...prev.filter(g => g.goalId !== edited.goalId), edited])
  }, [])

  const handleCategoryComplete = useCallback(() => {
    setViewLevel('hub')
    setActiveCategory(null)
  }, [])

  const handleCreatePlan = useCallback(() => {
    setViewLevel('manual')
  }, [])

  const handleAddManualGoal = useCallback((goal: { title: string; targetOutcome: string }) => {
    setManualGoals(prev => [...prev, goal])
    setViewLevel('summary')
  }, [])

  const handleSkipManual = useCallback(() => {
    setViewLevel('summary')
  }, [])

  const handleManualPrevious = useCallback(() => {
    setViewLevel('hub')
  }, [])

  const handleSelectionConfirm = useCallback((codes: string[]) => {
    setSelectedCodes(codes)
    const selectedGaps = enrichedGaps.filter(g => codes.includes(g.competencyCode))
    const selectedSuggestions = suggestions.filter((_, idx) =>
      codes.includes(enrichedGaps[idx]?.competencyCode)
    )
    setGaps(selectedGaps)
    setSuggestions(selectedSuggestions.length > 0 ? selectedSuggestions : suggestions.slice(0, codes.length))
    setEnrichedGaps(selectedGaps)
    setViewLevel('hub')
  }, [enrichedGaps, suggestions])

  const handleNoGapsAddManual = useCallback(() => {
    setViewLevel('manual')
  }, [])

  const handleNoGapsFinish = useCallback(() => {
    setViewLevel('summary')
  }, [])

  // Save and navigate
  const handleViewPlan = useCallback(async () => {
    if (!pdiId) return
    setIsSaving(true)
    try {
      const includedGoalIds = new Set(
        editedGoals.filter(g => g.included).map(g => g.goalId)
      )
      const goalsPayload = pdiGoals.map((g: any) => {
        const edited = editedGoals.find(e => e.goalId === g.id)
        if (edited && edited.included) {
          return { id: g.id, title: edited.title, targetOutcome: edited.targetOutcome }
        }
        if (edited && !edited.included) {
          return { id: g.id, _delete: true }
        }
        if (includedGoalIds.size > 0 && !includedGoalIds.has(g.id)) {
          const wasSkipped = gaps.some(
            gap => gap.competencyCode === g.competencyCode &&
              !editedGoals.some(e => e.competencyCode === gap.competencyCode)
          )
          if (wasSkipped) return { id: g.id, _delete: true }
        }
        return { id: g.id }
      })

      const manualGoalsPayload = manualGoals.map(mg => ({
        title: mg.title,
        targetOutcome: mg.targetOutcome,
        aiGenerated: false,
        priority: 99
      }))

      await fetch(`/api/pdi/${pdiId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: [...goalsPayload, ...manualGoalsPayload] })
      })

      await fetch(`/api/pdi/${pdiId}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT_FOR_REVIEW' })
      })

      onComplete?.(pdiId)
    } catch (err) {
      console.error('[PDI Guided] Error saving:', err)
    } finally {
      setIsSaving(false)
    }
  }, [pdiId, pdiGoals, editedGoals, manualGoals, gaps, onComplete])

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════

  const categoryGaps = useMemo(() => {
    if (!activeCategory) return []
    return enrichedGaps.filter(g => g.category === activeCategory)
  }, [enrichedGaps, activeCategory])

  const categorySuggestions = useMemo(() => {
    if (!activeCategory) return []
    return enrichedGaps
      .map((g, idx) => ({ gap: g, suggestion: suggestions[idx] }))
      .filter(item => item.gap.category === activeCategory)
      .map(item => item.suggestion)
      .filter(Boolean)
  }, [enrichedGaps, suggestions, activeCategory])

  const activeCategories = useMemo(() => {
    const cats = new Set(enrichedGaps.map(g => g.category))
    return (['URGENTE', 'IMPACTO', 'QUICK_WIN', 'POTENCIAR'] as Category[]).filter(c => cats.has(c))
  }, [enrichedGaps])

  const roleFitConfig = useMemo(() => {
    if (!roleFit) return null
    return getRoleFitClassification(roleFit.roleFitScore)
  }, [roleFit])

  const summaryGoals = useMemo(() => [
    ...editedGoals
      .filter(g => g.included)
      .map(g => ({
        competencyCode: g.competencyCode,
        title: g.title,
        isManual: false
      })),
    ...manualGoals.map(g => ({
      competencyCode: 'MANUAL',
      title: g.title,
      isManual: true
    }))
  ], [editedGoals, manualGoals])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewLevel === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full mb-4"
          />
          <p className="text-slate-400 mb-2">
            Analizando brechas de <span className="text-cyan-400 font-medium">{employeeName.split(' ')[0]}</span>...
          </p>
          <p className="text-slate-600 text-xs">
            {elapsed < 5
              ? 'Obteniendo resultados 360\u00B0...'
              : elapsed < 15
                ? 'Calculando Role Fit y brechas...'
                : elapsed < 30
                  ? 'Generando objetivos de desarrollo...'
                  : 'Esto puede tomar unos segundos m\u00E1s...'}
          </p>
          {elapsed > 3 && (
            <p className="text-slate-700 text-[10px] mt-2">{elapsed}s</p>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: ERROR
  // ═══════════════════════════════════════════════════════════════════════════

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: NO GAPS
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewLevel === 'no-gaps') {
    return (
      <PDINoGapsCard
        employeeName={employeeName}
        roleFit={roleFit ? {
          roleFitScore: roleFit.roleFitScore,
          summary: {
            totalCompetencies: roleFit.summary.totalCompetencies,
            matching: roleFit.summary.matching,
            exceeds: roleFit.summary.exceeds
          }
        } : null}
        onAddManual={handleNoGapsAddManual}
        onFinish={handleNoGapsFinish}
      />
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: SELECTION LIST (>4 items)
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewLevel === 'selection') {
    return (
      <PDISelectionList
        items={enrichedGaps}
        preSelected={selectedCodes}
        maxSelection={6}
        employeeName={employeeName}
        onConfirm={handleSelectionConfirm}
      />
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: MANUAL GOAL
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewLevel === 'manual') {
    return (
      <PDIManualGoalCard
        onAdd={handleAddManualGoal}
        onSkip={handleSkipManual}
        onPrevious={handleManualPrevious}
      />
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  if (viewLevel === 'summary') {
    return (
      <PDISummaryCard
        employeeName={employeeName}
        roleFitScore={roleFit?.roleFitScore ?? null}
        overallScore={overallScore}
        goals={summaryGoals}
        manualGoalsCount={manualGoals.length}
        onViewPlan={handleViewPlan}
      />
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: CINEMA MODE (Hub / Cover / Content)
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-6">
      <motion.div className="max-w-6xl mx-auto">
        <div className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden">

          {/* Tesla Line */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-20"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE'
            }}
          />

          {/* Left Column (25%) */}
          <PDILeftColumn
            employeeName={employeeName}
            roleFitScore={roleFit?.roleFitScore}
            roleFitConfig={roleFitConfig}
          />

          {/* Right Column (75%) */}
          <div className="w-full md:w-[75%] min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">

              {viewLevel === 'hub' && (
                <PDIHub
                  key="hub"
                  employeeName={employeeName}
                  roleFitScore={roleFit?.roleFitScore ?? null}
                  enrichedGaps={enrichedGaps}
                  onSelectCategory={handleSelectCategory}
                  onCreatePlan={handleCreatePlan}
                />
              )}

              {viewLevel === 'cover' && activeCategory && (
                <PDICategoryCover
                  key={`cover-${activeCategory}`}
                  category={activeCategory}
                  gaps={categoryGaps}
                  employeeName={employeeName}
                  allCategories={activeCategories}
                  onBack={handleBack}
                  onEnter={handleEnterContent}
                />
              )}

              {viewLevel === 'content' && activeCategory && (
                <PDICategoryContent
                  key={`content-${activeCategory}`}
                  category={activeCategory}
                  gaps={categoryGaps}
                  suggestions={categorySuggestions}
                  pdiGoals={pdiGoals}
                  onBack={handleBack}
                  onBackToHub={handleBackToHub}
                  onAddGoal={handleAddGoal}
                  onUpdateGoal={updateGoalInState}
                  onCategoryComplete={handleCategoryComplete}
                />
              )}

            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
