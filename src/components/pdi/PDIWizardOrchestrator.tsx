'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PDIWizardCard from './PDIWizardCard'
import PDIManualGoalCard from './PDIManualGoalCard'
import PDISummaryCard from './PDISummaryCard'
import PDINoGapsCard from './PDINoGapsCard'
import PDISelectionList from './PDISelectionList'
import { useDebounce } from '@/hooks/useDebounce'
import type { WizardGap, WizardSuggestion, EditedGoal } from './PDIWizardCard'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface RoleFitResult {
  roleFitScore: number
  gaps: Array<{
    competencyCode: string
    competencyName: string
    actualScore: number
    targetScore: number
    rawGap: number
    status: 'CRITICAL' | 'IMPROVE' | 'MATCH' | 'EXCEEDS'
  }>
  summary: {
    totalCompetencies: number
    matching: number
    exceeds: number
    needsImprovement: number
    critical: number
  }
}

interface EnrichedSuggestion {
  competencyCode: string
  coachingTip: string
  estimatedWeeks: number
  action: string
}

interface PDIWizardOrchestratorProps {
  employeeId: string
  cycleId: string
  employeeName: string
  onComplete?: (pdiId: string) => void
}

type WizardPhase = 'loading' | 'selection' | 'gaps' | 'manual' | 'summary' | 'no-gaps'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS PARA SMART ROUTING
// ════════════════════════════════════════════════════════════════════════════

type ItemCategory = 'URGENTE' | 'IMPACTO' | 'QUICK_WIN' | 'POTENCIAR'

interface EnrichedGap extends WizardGap {
  category: ItemCategory
  categoryLabel: string
  categoryColor: string
  narrative: string
  coachingTip: string
}

interface SmartRouterResult {
  selectedItems: EnrichedGap[]
  allItems: EnrichedGap[]
  skipSelectionList: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function PDIWizardOrchestrator({
  employeeId,
  cycleId,
  employeeName,
  onComplete
}: PDIWizardOrchestratorProps) {
  // State
  const [phase, setPhase] = useState<WizardPhase>('loading')
  const [currentGapIndex, setCurrentGapIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [gaps, setGaps] = useState<WizardGap[]>([])
  const [suggestions, setSuggestions] = useState<WizardSuggestion[]>([])
  const [editedGoals, setEditedGoals] = useState<EditedGoal[]>([])
  const [manualGoals, setManualGoals] = useState<Array<{ title: string; targetOutcome: string }>>([])
  const [roleFit, setRoleFit] = useState<RoleFitResult | null>(null)
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [pdiId, setPdiId] = useState<string | null>(null)
  const [pdiGoals, setPdiGoals] = useState<any[]>([])
  const [enrichedGaps, setEnrichedGaps] = useState<EnrichedGap[]>([])
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Guard against double-fire
  const generatingRef = useRef(false)

  // Elapsed timer during loading
  useEffect(() => {
    if (phase !== 'loading') return
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ═══════════════════════════════════════════════════════════════════════════
  // ENRIQUECER GAPS CON DATOS DE LIBRARY
  // ═══════════════════════════════════════════════════════════════════════════

  function enrichGapWithLibrary(
    gap: WizardGap,
    index: number,
    totalCritical: number,
    performanceTrack: 'EJECUTIVO' | 'MANAGER' | 'COLABORADOR' = 'COLABORADOR'
  ): EnrichedGap {
    const { PDI_COMPETENCY_LIBRARY, GENERIC_COMPETENCY_TEMPLATE } = require('@/lib/data/pdi-competency-library')

    // Buscar template de competencia
    const template = PDI_COMPETENCY_LIBRARY[gap.competencyCode] ||
                     Object.values(PDI_COMPETENCY_LIBRARY).find(
                       (t: any) => t.keywords?.some((k: string) =>
                         gap.competencyName.toLowerCase().includes(k)
                       )
                     ) ||
                     GENERIC_COMPETENCY_TEMPLATE

    // Determinar tipo de gap
    const gapType = gap.status === 'EXCEEDS'
      ? 'strength'
      : gap.rawGap <= -1.5
        ? 'blindSpot'
        : 'development'

    // Obtener estrategia según track
    const strategies = template.strategies[performanceTrack] || template.strategies.COLABORADOR
    const strategyList = strategies[gapType] || strategies.development || []
    const strategy = strategyList[0] || {}

    // Obtener coaching tip
    const tips = template.coachingTips || {}
    const tipList = tips[gapType] || tips.development || []
    const coachingTip = tipList[Math.floor(Math.random() * tipList.length)] || ''

    // Determinar categoría visual
    let category: ItemCategory
    let categoryLabel: string
    let categoryColor: string

    if (gap.status === 'EXCEEDS') {
      category = 'POTENCIAR'
      categoryLabel = 'Fortaleza a potenciar'
      categoryColor = '#10B981'
    } else if (gap.status === 'CRITICAL') {
      if (index === 0) {
        category = 'URGENTE'
        categoryLabel = 'Brecha más crítica'
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
      narrative: strategy.description || 'Esta competencia requiere atención para alcanzar el nivel esperado del cargo.',
      coachingTip: coachingTip || 'Explora con preguntas abiertas cómo percibe esta competencia.'
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART ROUTER: Pre-selección inteligente de 4 items
  // ═══════════════════════════════════════════════════════════════════════════

  function smartRouteItems(
    gapsInput: WizardGap[],
    performanceTrack: 'EJECUTIVO' | 'MANAGER' | 'COLABORADOR' = 'COLABORADOR'
  ): SmartRouterResult {
    // Separar por tipo
    const critical = gapsInput.filter(g => g.status === 'CRITICAL')
      .sort((a, b) => a.rawGap - b.rawGap)

    const improve = gapsInput.filter(g => g.status === 'IMPROVE')
      .sort((a, b) => b.rawGap - a.rawGap)

    const exceeds = gapsInput.filter(g => g.status === 'EXCEEDS')
      .sort((a, b) => b.rawGap - a.rawGap)
      .slice(0, 2)

    // Combinar todos
    const allGaps = [...critical, ...improve, ...exceeds]

    // Enriquecer con datos de library
    const totalCritical = critical.length
    const enriched = allGaps.map((gap, index) =>
      enrichGapWithLibrary(gap, index, totalCritical, performanceTrack)
    )

    // Si ≤4 items, todos seleccionados, skip lista
    if (enriched.length <= 4) {
      return {
        selectedItems: enriched,
        allItems: enriched,
        skipSelectionList: true
      }
    }

    // Si >4 items, pre-seleccionar los 4 más importantes
    const selected: EnrichedGap[] = []

    // 1º: Brecha más crítica
    const urgente = enriched.find(g => g.category === 'URGENTE')
    if (urgente) selected.push(urgente)

    // 2º: Segunda crítica o alto impacto
    const impacto = enriched.find(g => g.category === 'IMPACTO' && !selected.includes(g))
    if (impacto && selected.length < 4) selected.push(impacto)

    // 3º: Quick Win (improve más fácil)
    const quickWin = enriched.find(g => g.category === 'QUICK_WIN' && !selected.includes(g))
    if (quickWin && selected.length < 4) selected.push(quickWin)

    // 4º: Fortaleza a potenciar
    const potenciar = enriched.find(g => g.category === 'POTENCIAR' && !selected.includes(g))
    if (potenciar && selected.length < 4) selected.push(potenciar)

    // Si aún faltan, completar con más critical/improve
    const remaining = enriched.filter(g => !selected.includes(g))
    while (selected.length < 4 && remaining.length > 0) {
      selected.push(remaining.shift()!)
    }

    return {
      selectedItems: selected,
      allItems: enriched,
      skipSelectionList: false
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers para procesar datos
  // ═══════════════════════════════════════════════════════════════════════════

  async function processExistingGoals(goalsFromDB: any[], employeeIdParam: string, cycleIdParam: string) {
    // Si no hay goals guardados → ir a no-gaps
    if (!goalsFromDB || goalsFromDB.length === 0) {
      setPhase('no-gaps')
      return
    }

    console.log(`[PDI] Processing ${goalsFromDB.length} existing goals`)

    // Los goals YA están en BD, mostrarlos tal cual
    // Intentar enriquecer con RoleFit para scores actualizados, pero NO filtrar

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
          // Crear mapa para lookup rápido
          for (const gap of roleFitData.data.gaps) {
            roleFitGapsMap.set(gap.competencyCode, gap)
          }
        }
      }
    } catch (err) {
      console.log('[PDI] RoleFit API unavailable, using stored data')
    }

    // Convertir TODOS los goals guardados a WizardGap
    // Usar datos de RoleFit si disponibles, sino usar datos del goal
    const gapsWithScores: WizardGap[] = goalsFromDB.map(goal => {
      const roleFitGap = roleFitGapsMap.get(goal.competencyCode)

      if (roleFitGap) {
        // Usar datos frescos de RoleFit
        return {
          competencyCode: goal.competencyCode,
          competencyName: goal.competencyName,
          actualScore: roleFitGap.actualScore,
          targetScore: roleFitGap.targetScore,
          rawGap: roleFitGap.rawGap,
          status: roleFitGap.status
        }
      } else {
        // Fallback: reconstruir desde originalGap
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
          targetScore: targetScore,
          rawGap: gap,
          status
        }
      }
    })

    // Obtener track del empleado
    const track = 'COLABORADOR' as const

    // Aplicar Smart Router para enriquecer con categorías y narrativas
    const routerResult = smartRouteItems(gapsWithScores, track)

    setEnrichedGaps(routerResult.allItems)

    // Para PDI existente, mostrar TODOS los goals (ya fueron seleccionados antes)
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
    setPhase('gaps')
  }

  function processGeneratedData(postData: any) {
    const roleFitData = postData.meta?.roleFit
    const enriched = postData.meta?.enrichedSuggestions || []

    if (roleFitData) {
      setRoleFit(roleFitData)
    }

    if (postData.data.employee?.overallScore) {
      setOverallScore(postData.data.employee.overallScore)
    }

    // Incluir CRITICAL + IMPROVE + EXCEEDS (top 2)
    const allGaps = (roleFitData?.gaps || [])
      .filter((g: any) => g.status !== 'MATCH')

    if (allGaps.length === 0) {
      setPhase('no-gaps')
      return
    }

    // Convertir a WizardGap
    const wizardGapsRaw: WizardGap[] = allGaps.map((g: any) => ({
      competencyCode: g.competencyCode,
      competencyName: g.competencyName,
      actualScore: g.actualScore,
      targetScore: g.targetScore,
      rawGap: g.rawGap,
      status: g.status
    }))

    // Obtener track
    const track = roleFitData?.performanceTrack || 'COLABORADOR'

    // Aplicar Smart Router
    const routerResult = smartRouteItems(wizardGapsRaw, track)

    setEnrichedGaps(routerResult.allItems)

    // Mapear suggestions con datos enriquecidos
    const wizardSuggestions = routerResult.selectedItems.map((g: EnrichedGap) => {
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

    setGaps(routerResult.selectedItems)
    setSuggestions(wizardSuggestions)

    // Decidir flujo
    if (routerResult.skipSelectionList) {
      // ≤4 items: directo al carrusel
      setSelectedCodes(routerResult.selectedItems.map(g => g.competencyCode))
      setPhase('gaps')
    } else {
      // >4 items: mostrar lista de selección
      setSelectedCodes(routerResult.selectedItems.map(g => g.competencyCode))
      setPhase('selection')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Cargar datos al montar (GET primero, POST solo si no existe)
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (generatingRef.current) return
    generatingRef.current = true

    async function loadPDI() {
      try {
        setError(null)

        // ─────────────────────────────────────────────────────────────────────
        // PASO 1: Intentar cargar PDI existente
        // ─────────────────────────────────────────────────────────────────────
        console.log('[PDI Orchestrator] Checking for existing PDI...')

        const getRes = await fetch(
          `/api/pdi/by-employee?employeeId=${employeeId}&cycleId=${cycleId}`
        )
        const getData = await getRes.json()

        if (getData.success && getData.exists) {
          const existingPDI = getData.data

          // Si existe pero NO es DRAFT → redirigir a DetailView
          if (existingPDI.status !== 'DRAFT') {
            console.log(`[PDI Orchestrator] PDI exists in ${existingPDI.status}, redirecting`)
            onComplete?.(existingPDI.id)
            return
          }

          // Es DRAFT → cargar goals existentes
          console.log('[PDI Orchestrator] Loading existing DRAFT PDI')
          setPdiId(existingPDI.id)
          setPdiGoals(existingPDI.goals || [])

          await processExistingGoals(existingPDI.goals || [], employeeId, cycleId)
          return
        }

        // ─────────────────────────────────────────────────────────────────────
        // PASO 2: No existe → generar nuevo
        // ─────────────────────────────────────────────────────────────────────
        console.log('[PDI Orchestrator] No existing PDI, generating new...')

        const postRes = await fetch('/api/pdi/generate-suggestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, cycleId })
        })
        const postData = await postRes.json()

        if (!postData.success) {
          if (postRes.status === 409 && postData.existingId) {
            console.log('[PDI Orchestrator] PDI already exists, redirecting')
            onComplete?.(postData.existingId)
            return
          }
          throw new Error(postData.error || 'Error generando PDI')
        }

        setPdiId(postData.data.id)
        setPdiGoals(postData.data.goals || [])

        processGeneratedData(postData)

      } catch (err) {
        console.error('[PDI Orchestrator] Load error:', err)
        setError(err instanceof Error ? err.message : 'Error cargando PDI')
      }
    }

    loadPDI()
  }, [employeeId, cycleId, onComplete])

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAddGoal = useCallback((edited: EditedGoal) => {
    setEditedGoals(prev => [...prev.filter(g => g.goalId !== edited.goalId), edited])
    setDirection(1)

    if (currentGapIndex < gaps.length - 1) {
      setCurrentGapIndex(prev => prev + 1)
    } else {
      setPhase('manual')
    }
  }, [currentGapIndex, gaps.length])

  const handlePreviousGap = useCallback(() => {
    if (currentGapIndex > 0) {
      setDirection(-1)
      setCurrentGapIndex(prev => prev - 1)
    }
  }, [currentGapIndex])

  const handleAddManualGoal = useCallback((goal: { title: string; targetOutcome: string }) => {
    setManualGoals(prev => [...prev, goal])
    setPhase('summary')
  }, [])

  const handleSkipManual = useCallback(() => {
    setPhase('summary')
  }, [])

  const handleManualPrevious = useCallback(() => {
    if (gaps.length > 0) {
      setDirection(-1)
      setCurrentGapIndex(gaps.length - 1)
      setPhase('gaps')
    }
  }, [gaps.length])

  // ── Auto-save desde Orchestrator ──
  const saveGoalToBackend = useCallback(async (
    goalId: string,
    updates: { title?: string; targetOutcome?: string }
  ) => {
    if (!goalId || goalId.startsWith('gap-')) {
      console.log('[PDI] Skipping auto-save for temporary goalId')
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch(`/api/pdi/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!res.ok) throw new Error('Error guardando')

      setLastSaved(new Date())
      console.log('[PDI] Auto-saved:', goalId)
    } catch (err) {
      console.error('[PDI] Auto-save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const debouncedSave = useDebounce(saveGoalToBackend, 1500)

  const updateGoalInState = useCallback((
    goalId: string,
    updates: { title?: string; targetOutcome?: string }
  ) => {
    // 1. Actualizar pdiGoals (fuente de verdad de BD)
    setPdiGoals(prev => prev.map((g: any) =>
      g.id === goalId ? { ...g, ...updates } : g
    ))

    // 2. Actualizar suggestions (lo que ve la WizardCard)
    const goal = pdiGoals.find((g: any) => g.id === goalId)
    if (goal) {
      const gapIdx = gaps.findIndex(g => g.competencyCode === goal.competencyCode)
      if (gapIdx !== -1) {
        setSuggestions(prev => prev.map((s, i) =>
          i === gapIdx ? { ...s, ...updates } : s
        ))
      }
    }

    // 3. Debounce PATCH a BD
    debouncedSave(goalId, updates)
  }, [pdiGoals, gaps, debouncedSave])

  // Selection list confirm
  const handleSelectionConfirm = useCallback((codes: string[]) => {
    setSelectedCodes(codes)

    // Filtrar gaps y suggestions para mostrar solo los seleccionados
    const selectedGaps = enrichedGaps.filter(g => codes.includes(g.competencyCode))
    const selectedSuggestions = suggestions.filter((_, idx) =>
      codes.includes(enrichedGaps[idx]?.competencyCode)
    )

    setGaps(selectedGaps)
    setSuggestions(selectedSuggestions.length > 0 ? selectedSuggestions : suggestions.slice(0, codes.length))
    setCurrentGapIndex(0)
    setPhase('gaps')
  }, [enrichedGaps, suggestions])

  // NoGaps handlers
  const handleNoGapsAddManual = useCallback(() => {
    setPhase('manual')
  }, [])

  const handleNoGapsFinish = useCallback(() => {
    setPhase('summary')
  }, [])

  // Save and navigate to plan
  const handleViewPlan = useCallback(async () => {
    if (!pdiId) return
    setIsSaving(true)

    try {
      // Build goals payload: keep included, mark excluded for deletion
      const includedGoalIds = new Set(
        editedGoals.filter(g => g.included).map(g => g.goalId)
      )

      // If user edited goals, update them via PATCH
      const goalsPayload = pdiGoals.map((g: any) => {
        const edited = editedGoals.find(e => e.goalId === g.id)
        if (edited && edited.included) {
          return {
            id: g.id,
            title: edited.title,
            targetOutcome: edited.targetOutcome
          }
        }
        if (edited && !edited.included) {
          return { id: g.id, _delete: true }
        }
        // Goal not touched in wizard (not in editedGoals) — keep if no explicit skip
        if (includedGoalIds.size > 0 && !includedGoalIds.has(g.id)) {
          // Check if this goal's competency was skipped
          const wasSkipped = gaps.some(
            gap => gap.competencyCode === g.competencyCode &&
            !editedGoals.some(e => e.competencyCode === gap.competencyCode)
          )
          if (wasSkipped) {
            return { id: g.id, _delete: true }
          }
        }
        return { id: g.id }
      })

      // Add manual goals
      const manualGoalsPayload = manualGoals.map(mg => ({
        title: mg.title,
        targetOutcome: mg.targetOutcome,
        aiGenerated: false,
        priority: 99
      }))

      await fetch(`/api/pdi/${pdiId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: [...goalsPayload, ...manualGoalsPayload]
        })
      })

      // Cambiar estado: DRAFT → PENDING_REVIEW
      await fetch(`/api/pdi/${pdiId}/change-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBMIT_FOR_REVIEW' })
      })

      onComplete?.(pdiId)
    } catch (err) {
      console.error('[PDI Orchestrator] Error saving:', err)
    } finally {
      setIsSaving(false)
    }
  }, [pdiId, pdiGoals, editedGoals, manualGoals, gaps, onComplete])

  // ═══════════════════════════════════════════════════════════════════════════
  // Build summary goals list
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryGoals = [
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
  ]

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // Loading
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
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
            ? 'Obteniendo resultados 360°...'
            : elapsed < 15
            ? 'Calculando Role Fit y brechas...'
            : elapsed < 30
            ? 'Generando objetivos de desarrollo...'
            : 'Esto puede tomar unos segundos más...'}
        </p>
        {elapsed > 3 && (
          <p className="text-slate-700 text-[10px] mt-2">{elapsed}s</p>
        )}
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-slate-800/50 backdrop-blur border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              generatingRef.current = false
              setError(null)
              setPhase('loading')
              setElapsed(0)
              // Re-trigger
              const run = async () => {
                try {
                  const res = await fetch('/api/pdi/generate-suggestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId, cycleId })
                  })
                  const data = await res.json()
                  if (data.success) {
                    setPdiId(data.data.id)
                    setPdiGoals(data.data.goals || [])
                    // Re-process would require duplicating logic, so reload
                    window.location.reload()
                  } else {
                    setError(data.error || 'Error generando sugerencias')
                  }
                } catch {
                  setError('Error de conexión al generar sugerencias')
                }
              }
              run()
            }}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // NoGaps
  if (phase === 'no-gaps') {
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

  // Selection list (>4 items)
  if (phase === 'selection') {
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

  // Gap cards
  if (phase === 'gaps' && currentGapIndex < gaps.length) {
    const currentGap = gaps[currentGapIndex]
    const currentSuggestion = suggestions[currentGapIndex]
    const goalId = pdiGoals.find(
      (g: any) => g.competencyCode === currentGap.competencyCode
    )?.id || `gap-${currentGapIndex}`

    return (
      <AnimatePresence mode="wait" custom={direction}>
        <PDIWizardCard
          key={`gap-${currentGapIndex}`}
          gap={currentGap}
          suggestion={currentSuggestion}
          goalId={goalId}
          currentIndex={currentGapIndex}
          totalCount={gaps.length}
          direction={direction}
          onNext={handleAddGoal}
          onPrevious={handlePreviousGap}
          onUpdateGoal={(updates) => updateGoalInState(goalId, updates)}
        />
      </AnimatePresence>
    )
  }

  // Manual goal
  if (phase === 'manual') {
    return (
      <PDIManualGoalCard
        onAdd={handleAddManualGoal}
        onSkip={handleSkipManual}
        onPrevious={handleManualPrevious}
      />
    )
  }

  // Summary
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
