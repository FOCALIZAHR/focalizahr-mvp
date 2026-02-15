// ════════════════════════════════════════════════════════════════════════════
// HOOK: useCalibrationRoom
// src/components/calibration/hooks/useCalibrationRoom.ts
// ════════════════════════════════════════════════════════════════════════════
// Fetch sesión + ratings + ajustes con SWR (polling 5s)
// Merge estado transitorio (adjustment ?? rating)
// 9-Box → Score mapping + Bonus Factor
// ════════════════════════════════════════════════════════════════════════════

'use client'

import useSWR from 'swr'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { calculateAverageBonusFactor, formatBonusFactor } from '@/config/calibrationBonusFactors'
import { NineBoxPosition, NINE_BOX_THRESHOLDS } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface CinemaEmployee {
  id: string
  name: string
  role: string
  avatar: string

  // Original (inmutable)
  calculatedScore: number
  calculatedLevel: string
  calculatedNineBox: string | null

  // Effective (con adjustment si existe)
  effectiveScore: number
  effectivePotentialScore: number | null
  effectiveLevel: string
  effectiveNineBox: string

  // Metadata
  quadrant: string
  status: string
  hasChanged: boolean
  adjustmentId?: string
  justification?: string

  // Datos originales
  ratingId: string
  performance: number
  potential: number

  // Flag: jefe no asignó potencial y no hay adjustment de potencial
  isPendingPotential: boolean

  // AAE Factors (Aspiración, Ability, Engagement)
  aspiration: 1 | 2 | 3 | null
  ability: 1 | 2 | 3 | null
  engagement: 1 | 2 | 3 | null
}

export interface CalibrationStats {
  total: number
  assignedScores: number[]
  avgBonusFactor: number
  bonusFactorDisplay: string
  adjustedCount: number
  pendingPotentialCount: number
}

interface UseCalibrationRoomProps {
  sessionId: string
}

// ════════════════════════════════════════════════════════════════════════════
// FETCHER
// ════════════════════════════════════════════════════════════════════════════

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Fetch error')
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API error')
  return json
}

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT ↔ NINEBOX MAPPING
// ════════════════════════════════════════════════════════════════════════════

// Quadrant IDs (q1-q9) → NineBoxPosition enum values
const QUADRANT_TO_NINEBOX: Record<string, string> = {
  q1: NineBoxPosition.UNDERPERFORMER,         // low/low
  q2: NineBoxPosition.AVERAGE_PERFORMER,      // med/low
  q3: NineBoxPosition.TRUSTED_PROFESSIONAL,   // high/low
  q4: NineBoxPosition.INCONSISTENT,           // low/med
  q5: NineBoxPosition.CORE_PLAYER,            // med/med
  q6: NineBoxPosition.HIGH_PERFORMER,         // high/med
  q7: NineBoxPosition.POTENTIAL_GEM,          // low/high
  q8: NineBoxPosition.GROWTH_POTENTIAL,       // med/high
  q9: NineBoxPosition.STAR,                   // high/high
}

const NINEBOX_TO_QUADRANT: Record<string, string> = Object.fromEntries(
  Object.entries(QUADRANT_TO_NINEBOX).map(([q, nb]) => [nb, q])
)

// Quadrant → representative scores for API submission
const QUADRANT_SCORES: Record<string, { performance: number; potential: number }> = {
  q1: { performance: 2.0, potential: 2.0 },
  q2: { performance: 3.5, potential: 2.0 },
  q3: { performance: 4.5, potential: 2.0 },
  q4: { performance: 2.0, potential: 3.5 },
  q5: { performance: 3.5, potential: 3.5 },
  q6: { performance: 4.5, potential: 3.5 },
  q7: { performance: 2.0, potential: 4.5 },
  q8: { performance: 3.5, potential: 4.5 },
  q9: { performance: 4.5, potential: 4.5 },
}

// NineBox → visual status for colors/bonus
function getQuadrantStatus(nineBox: string): string {
  switch (nineBox) {
    case NineBoxPosition.STAR:
      return 'STARS'
    case NineBoxPosition.HIGH_PERFORMER:
    case NineBoxPosition.GROWTH_POTENTIAL:
    case NineBoxPosition.POTENTIAL_GEM:
      return 'HIGH'
    case NineBoxPosition.CORE_PLAYER:
    case NineBoxPosition.TRUSTED_PROFESSIONAL:
      return 'CORE'
    case NineBoxPosition.UNDERPERFORMER:
      return 'RISK'
    default:
      return 'NEUTRAL'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Score → nineBox level (mirrors performanceClassification.ts)
function scoreToLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= NINE_BOX_THRESHOLDS.HIGH) return 'high'
  if (score >= NINE_BOX_THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

// Derive quadrant from performance + potential scores
function deriveQuadrant(performanceScore: number, potentialScore: number): string {
  const perfLevel = scoreToLevel(performanceScore)
  const potLevel = scoreToLevel(potentialScore)

  const mapping: Record<string, string> = {
    'low-low': 'q1',
    'medium-low': 'q2',
    'high-low': 'q3',
    'low-medium': 'q4',
    'medium-medium': 'q5',
    'high-medium': 'q6',
    'low-high': 'q7',
    'medium-high': 'q8',
    'high-high': 'q9',
  }

  return mapping[`${perfLevel}-${potLevel}`] || 'q5'
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useCalibrationRoom({ sessionId }: UseCalibrationRoomProps) {
  // ══════════════════════════════════════════════════════════════
  // 1. DATA FETCHING (con polling cada 5s)
  // ══════════════════════════════════════════════════════════════

  const { data: sessionData, mutate: mutateSession } = useSWR(
    `/api/calibration/sessions/${sessionId}`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const { data: ratingsData, mutate: mutateRatings } = useSWR(
    sessionData ? `/api/calibration/sessions/${sessionId}/ratings` : null,
    fetcher
  )

  const { data: adjustmentsData, mutate: mutateAdjustments } = useSWR(
    sessionData ? `/api/calibration/sessions/${sessionId}/adjustments` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const session = sessionData?.data
  const ratings: any[] = ratingsData?.data || []
  const adjustments: any[] = adjustmentsData?.data || []

  // ══════════════════════════════════════════════════════════════
  // 2. ESTADO TRANSITORIO - MERGE + QUADRANT MAPPING
  // ══════════════════════════════════════════════════════════════

  const employeeList: CinemaEmployee[] = useMemo(() => {
    if (!ratings.length) return []

    // Only consider PENDING adjustments
    const pendingAdjustments = adjustments.filter(
      (a: any) => a.status === 'PENDING'
    )

    return ratings.map((rating: any) => {
      // Find latest PENDING adjustment for this rating
      const adjustment = pendingAdjustments.find(
        (a: any) => a.ratingId === rating.id
      )

      // Detectar si falta potencial del jefe (ANTES de ver adjustment)
      const originalPotentialMissing = rating.potentialScore == null

      // Effective values: adjustment overrides rating
      const effectiveScore = adjustment?.newFinalScore ?? rating.finalScore ?? rating.calculatedScore
      const effectivePotentialScore = adjustment?.newPotentialScore ?? rating.potentialScore
      const effectiveLevel = adjustment?.newFinalLevel ?? rating.finalLevel ?? rating.calculatedLevel
      const effectiveNineBox = adjustment?.newNineBox ?? rating.nineBoxPosition ?? NineBoxPosition.CORE_PLAYER

      // Derive quadrant from nineBox or from scores
      const quadrant = NINEBOX_TO_QUADRANT[effectiveNineBox]
        || (effectivePotentialScore != null
          ? deriveQuadrant(effectiveScore, effectivePotentialScore)
          : 'q5')

      return {
        id: rating.employeeId,
        name: rating.employee.fullName,
        role: rating.employee.position || '',
        avatar: getInitials(rating.employee.fullName),

        // Original (inmutable)
        calculatedScore: rating.calculatedScore,
        calculatedLevel: rating.calculatedLevel,
        calculatedNineBox: rating.nineBoxPosition,

        // Effective
        effectiveScore,
        effectivePotentialScore: effectivePotentialScore ?? null,
        effectiveLevel,
        effectiveNineBox,

        // Metadata
        quadrant,
        status: getQuadrantStatus(effectiveNineBox),
        hasChanged: !!adjustment,
        adjustmentId: adjustment?.id,
        justification: adjustment?.justification,

        // Datos originales
        ratingId: rating.id,
        performance: rating.calculatedScore,
        potential: rating.potentialScore ?? 0,

        // Flag: jefe no asignó potencial y tampoco hay adjustment
        isPendingPotential: originalPotentialMissing && effectivePotentialScore == null,

        // AAE Factors
        aspiration: (rating.potentialAspiration as 1 | 2 | 3) ?? null,
        ability: (rating.potentialAbility as 1 | 2 | 3) ?? null,
        engagement: (rating.potentialEngagement as 1 | 2 | 3) ?? null,
      }
    })
  }, [ratings, adjustments])

  // ══════════════════════════════════════════════════════════════
  // 3. STATS + BONUS FACTOR + ASSIGNED SCORES
  // ══════════════════════════════════════════════════════════════

  const stats: CalibrationStats = useMemo(() => {
    const assignedScores = employeeList
      .filter(emp => emp.effectivePotentialScore != null)
      .map(emp => emp.effectivePotentialScore as number)

    const avgBonusFactor = calculateAverageBonusFactor(employeeList)

    const pendingPotentialCount = employeeList.filter(emp => emp.isPendingPotential).length

    return {
      total: employeeList.length,
      assignedScores,
      avgBonusFactor,
      bonusFactorDisplay: formatBonusFactor(avgBonusFactor),
      adjustedCount: employeeList.filter(e => e.hasChanged).length,
      pendingPotentialCount,
    }
  }, [employeeList])

  // ══════════════════════════════════════════════════════════════
  // 4. RBAC - PERMISSIONS
  // ══════════════════════════════════════════════════════════════

  const userRole = session?.participants?.find(
    (p: any) => p.participantEmail === session.currentUserEmail
  )?.role || 'OBSERVER'

  const canEdit = userRole === 'FACILITATOR' || userRole === 'REVIEWER'
  const isReadOnly = session?.status === 'CLOSED' || !canEdit

  // ══════════════════════════════════════════════════════════════
  // 5. ACTIONS
  // ══════════════════════════════════════════════════════════════

  async function moveEmployee(
    employeeId: string,
    newQuadrant: string,
    justification: string
  ) {
    if (isReadOnly) {
      toast.error('Sesión en solo lectura')
      return
    }

    const employee = employeeList.find(e => e.id === employeeId)
    if (!employee) return

    // Calculate new scores from target quadrant
    const targetScores = QUADRANT_SCORES[newQuadrant]
    if (!targetScores) return

    // Determine minimal score adjustments:
    // Only change the score if it doesn't already fall in the target level range
    const currentPerfLevel = scoreToLevel(employee.effectiveScore)
    const targetPerfLevel = scoreToLevel(targetScores.performance)
    const currentPotLevel = employee.effectivePotentialScore != null
      ? scoreToLevel(employee.effectivePotentialScore)
      : 'medium'
    const targetPotLevel = scoreToLevel(targetScores.potential)

    const newFinalScore = currentPerfLevel !== targetPerfLevel
      ? targetScores.performance
      : undefined
    const newPotentialScore = currentPotLevel !== targetPotLevel
      ? targetScores.potential
      : (employee.effectivePotentialScore ?? targetScores.potential)

    try {
      const response = await fetch(
        `/api/calibration/sessions/${sessionId}/adjustments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ratingId: employee.ratingId,
            newFinalScore,
            newPotentialScore,
            justification
          })
        }
      )

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Error al guardar ajuste')
      }

      // Revalidar datos
      await mutateAdjustments()

      toast.success('Ajuste guardado')
    } catch (error: any) {
      console.error('Error moveEmployee:', error)
      toast.error(error.message || 'Error al guardar ajuste')
    }
  }

  async function closeSession() {
    try {
      const response = await fetch(
        `/api/calibration/sessions/${sessionId}/close`,
        { method: 'POST' }
      )

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Error al cerrar sesión')
      }

      toast.success(json.message)
      mutateSession()
      mutateAdjustments()
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar sesión')
    }
  }

  async function startSession() {
    try {
      const response = await fetch(
        `/api/calibration/sessions/${sessionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'IN_PROGRESS' })
        }
      )

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Error al iniciar sesión')
      }

      toast.success('Sesión iniciada')
      mutateSession()
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
    }
  }

  return {
    // Data
    session,
    employeeList,
    stats,

    // Para LiveFeed
    adjustments,
    participants: (session?.participants || []) as any[],

    // State
    isLoading: !sessionData || !ratingsData || !adjustmentsData,
    isReadOnly,
    canEdit,
    userRole,

    // Actions
    moveEmployee,
    closeSession,
    startSession,
    mutate: () => {
      mutateSession()
      mutateRatings()
      mutateAdjustments()
    }
  }
}
