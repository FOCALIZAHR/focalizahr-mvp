// src/hooks/useEvaluatorCinemaMode.ts
// Central state + logic for Cinema Mode v5

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDisplayName, formatDisplayNameFull } from '@/lib/utils/formatName'
import { calculateInsights } from '@/lib/utils/calculateInsights'
import type {
  EvaluatorAssignment,
  CinemaCycle,
  CinemaStats,
  EmployeeCardData,
  EmployeeCardStatus,
  SelectedEmployee,
  CarouselTab
} from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function mapStatus(apiStatus: string): EmployeeCardStatus {
  switch (apiStatus) {
    case 'completed': return 'completed'
    case 'in_progress': return 'in_progress'
    case 'pending': return 'ready'
    default: return 'ready'
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export function useEvaluatorCinemaMode() {
  const router = useRouter()

  // API data
  const [rawAssignments, setRawAssignments] = useState<EvaluatorAssignment[]>([])
  const [cycle, setCycle] = useState<CinemaCycle | null>(null)
  const [rawStats, setRawStats] = useState<Omit<CinemaStats, 'pendingPotential'>>({ total: 0, completed: 0, pending: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Evaluator info
  const [evaluatorName, setEvaluatorName] = useState<string | null>(null)

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isRailExpanded, setRailExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<CarouselTab>('sinED')

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('focalizahr_token')
        if (!token) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        const res = await fetch('/api/evaluator/assignments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.status === 401) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        if (!res.ok) throw new Error(`Error ${res.status}`)

        const json = await res.json()

        if (json.success) {
          setCycle(json.cycle)
          setRawAssignments(json.assignments || [])
          setRawStats(json.stats || { total: 0, completed: 0, pending: 0 })
          setEvaluatorName(json.employee?.fullName || null)
        } else {
          throw new Error(json.error || 'Error cargando datos')
        }
      } catch (err) {
        console.error('Error loading evaluator data:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [router])

  // Transform assignments to card data with formatted names
  const employees = useMemo<EmployeeCardData[]>(() => {
    return rawAssignments.map(a => ({
      id: a.evaluatee.id,
      assignmentId: a.id,
      fullName: a.evaluatee.fullName,
      displayName: formatDisplayName(a.evaluatee.fullName),
      displayNameFull: formatDisplayNameFull(a.evaluatee.fullName),
      position: a.evaluatee.position || 'Sin cargo',
      departmentName: a.evaluatee.departmentName || 'Sin departamento',
      tenure: a.evaluatee.tenure || 'Sin datos',
      status: mapStatus(a.status),
      participantToken: a.participantToken,
      evaluationType: a.evaluationType || 'Evaluacion',
      dueDate: a.dueDate,
      completedAt: a.completedAt,
      avgScore: a.avgScore ?? null,
      // Campos de potencial
      ratingId: a.ratingId ?? null,
      potentialScore: a.potentialScore ?? null,
      potentialLevel: a.potentialLevel ?? null,
      nineBoxPosition: a.nineBoxPosition ?? null,
      cycleId: a.cycleId,
      hasPDI: a.hasPDI ?? false
    }))
  }, [rawAssignments])

  // Count employees needing potential evaluation (completed desempeno but no potential)
  const pendingPotential = useMemo(() => {
    return employees.filter(e => e.status === 'completed' && e.potentialScore === null).length
  }, [employees])

  // Selected employee with insights
  const selectedEmployee = useMemo<SelectedEmployee | null>(() => {
    if (!selectedId) return null
    const emp = employees.find(e => e.id === selectedId)
    if (!emp) return null
    return {
      ...emp,
      insights: calculateInsights(emp)
    }
  }, [selectedId, employees])

  // Next employee (priority: Sin ED → Sin PT → Sin PDI → all done)
  const nextEmployee = useMemo(() => {
    // 1. Sin ED (mas urgente): in_progress o ready/waiting
    const sinED = employees.find(e => e.status === 'in_progress')
      || employees.find(e => e.status === 'ready')
      || employees.find(e => e.status === 'waiting')
    if (sinED) return { id: sinED.id, displayName: sinED.displayName }

    // 2. Sin PT: ED completado pero sin potencial
    const sinPT = employees.find(e =>
      e.status === 'completed' && e.potentialScore === null
    )
    if (sinPT) return { id: sinPT.id, displayName: sinPT.displayName }

    // 3. Sin PDI: ED+PT listos, falta plan de desarrollo
    const sinPDI = employees.find(e =>
      e.status === 'completed' &&
      e.potentialScore !== null &&
      !e.hasPDI
    )
    if (sinPDI) return { id: sinPDI.id, displayName: sinPDI.displayName }

    // 4. Todos completos - retorna el primero para poder ver resumen
    const first = employees[0]
    return first ? { id: first.id, displayName: first.displayName } : null
  }, [employees])

  // Handlers
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setRailExpanded(false)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedId(null)
    setRailExpanded(true)
  }, [])

  const handleEvaluate = useCallback((token: string) => {
    router.push(`/encuesta/${token}`)
  }, [router])

  const handleViewSummary = useCallback((assignmentId: string) => {
    router.push(`/dashboard/evaluaciones/${assignmentId}/summary`)
  }, [router])

  const handleToggleRail = useCallback(() => {
    setRailExpanded(prev => !prev)
  }, [])

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) return

      const res = await fetch('/api/evaluator/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const json = await res.json()
      if (json.success) {
        setCycle(json.cycle)
        setRawAssignments(json.assignments || [])
        setRawStats(json.stats || { total: 0, completed: 0, pending: 0 })
        setEvaluatorName(json.employee?.fullName || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // Data
    employees,
    selectedEmployee,
    nextEmployee,
    stats: { ...rawStats, pendingPotential },
    cycle,
    evaluatorName,

    // UI State
    selectedId,
    isRailExpanded,
    activeTab,
    isLoading,
    error,

    // Actions
    handleSelect,
    handleBack,
    handleEvaluate,
    handleViewSummary,
    handleToggleRail,
    setActiveTab,
    reload
  }
}
