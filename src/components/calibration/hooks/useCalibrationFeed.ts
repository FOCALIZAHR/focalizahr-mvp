// ════════════════════════════════════════════════════════════════════════════
// HOOK: useCalibrationFeed - Transforma adjustments en narrativa humana
// src/components/calibration/hooks/useCalibrationFeed.ts
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo, useRef, useEffect, useState } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type FeedDirection = 'upgrade' | 'downgrade' | 'lateral'
export type ActorRole = 'FACILITATOR' | 'REVIEWER' | 'OBSERVER'

export interface FeedItem {
  id: string
  actorEmail: string
  actorName: string
  actorRole: ActorRole
  employeeName: string
  employeePosition: string

  // Movimiento
  fromQuadrant: string
  toQuadrant: string
  direction: FeedDirection

  // Metadata
  justification?: string
  timestamp: Date
  isNew: boolean
}

export interface UseCalibrationFeedProps {
  adjustments: any[]
  participants: any[]
}

export interface UseCalibrationFeedReturn {
  feedItems: FeedItem[]
  totalChanges: number
  hasNewItems: boolean
  markAllAsSeen: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const QUADRANT_NAMES: Record<string, string> = {
  // UPPER_CASE (enum values)
  'STAR': 'Estrella',
  'GROWTH_POTENTIAL': 'Alto Potencial',
  'POTENTIAL_GEM': 'Diamante',
  'HIGH_PERFORMER': 'Alto Desempeño',
  'CORE_PLAYER': 'Core',
  'INCONSISTENT': 'Inconsistente',
  'TRUSTED_PROFESSIONAL': 'Experto',
  'AVERAGE_PERFORMER': 'Efectivo',
  'UNDERPERFORMER': 'Riesgo',
  // snake_case (API format)
  'star': 'Estrella',
  'growth_potential': 'Alto Potencial',
  'potential_gem': 'Diamante',
  'high_performer': 'Alto Desempeño',
  'core_player': 'Core',
  'inconsistent': 'Inconsistente',
  'trusted_professional': 'Experto',
  'average_performer': 'Efectivo',
  'underperformer': 'Riesgo',
}

const QUADRANT_VALUE: Record<string, number> = {
  // UPPER_CASE
  'UNDERPERFORMER': 1,
  'AVERAGE_PERFORMER': 2,
  'INCONSISTENT': 2,
  'TRUSTED_PROFESSIONAL': 3,
  'CORE_PLAYER': 4,
  'HIGH_PERFORMER': 5,
  'POTENTIAL_GEM': 5,
  'GROWTH_POTENTIAL': 6,
  'STAR': 7,
  // snake_case
  'underperformer': 1,
  'average_performer': 2,
  'inconsistent': 2,
  'trusted_professional': 3,
  'core_player': 4,
  'high_performer': 5,
  'potential_gem': 5,
  'growth_potential': 6,
  'star': 7,
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getDirection(from: string | null, to: string | null): FeedDirection {
  if (!from || !to) return 'lateral'

  const fromValue = QUADRANT_VALUE[from] ?? 4
  const toValue = QUADRANT_VALUE[to] ?? 4

  if (toValue > fromValue) return 'upgrade'
  if (toValue < fromValue) return 'downgrade'
  return 'lateral'
}

function getQuadrantName(nineBox: string | null): string {
  if (!nineBox) return '\u2014'
  return QUADRANT_NAMES[nineBox] ?? nineBox
}

function extractActorName(email: string): string {
  const localPart = email.split('@')[0] || ''
  return localPart
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function cleanJustification(raw: string | null): string | undefined {
  if (!raw) return undefined
  // Strip technical prefixes like "[EXCEPCIÓN: AAE_PROFILE_MISMATCH] "
  return raw.replace(/^\[EXCEPCIÓN:\s*[^\]]*\]\s*/i, '').trim() || undefined
}

function getActorRole(email: string, participants: any[]): ActorRole {
  const participant = participants.find((p: any) => p.participantEmail === email)
  return participant?.role || 'OBSERVER'
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export function useCalibrationFeed({
  adjustments,
  participants
}: UseCalibrationFeedProps): UseCalibrationFeedReturn {

  const seenIdsRef = useRef<Set<string>>(new Set())
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  const feedItems = useMemo(() => {
    if (!adjustments?.length) return []

    // Deduplicar por ratingId: solo el más reciente por empleado
    const latestByRating = new Map<string, any>()
    adjustments
      .filter((adj: any) => adj.status === 'PENDING' || adj.status === 'APPLIED')
      .forEach((adj: any) => {
        const existing = latestByRating.get(adj.ratingId)
        if (!existing || new Date(adj.adjustedAt) > new Date(existing.adjustedAt)) {
          latestByRating.set(adj.ratingId, adj)
        }
      })

    return Array.from(latestByRating.values())
      .map((adj: any): FeedItem => {
        const employee = adj.rating?.employee
        const previousNineBox = adj.rating?.nineBoxPosition

        return {
          id: adj.id,
          actorEmail: adj.adjustedBy,
          actorName: extractActorName(adj.adjustedBy),
          actorRole: getActorRole(adj.adjustedBy, participants),
          employeeName: employee?.fullName || 'Empleado',
          employeePosition: employee?.position || '',
          fromQuadrant: getQuadrantName(previousNineBox),
          toQuadrant: getQuadrantName(adj.newNineBox),
          direction: getDirection(previousNineBox, adj.newNineBox),
          justification: cleanJustification(adj.justification),
          timestamp: new Date(adj.adjustedAt),
          isNew: newIds.has(adj.id),
        }
      })
      .sort((a: FeedItem, b: FeedItem) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [adjustments, participants, newIds])

  // Detectar nuevos ajustes
  useEffect(() => {
    if (!adjustments?.length) return

    const currentIds = new Set(adjustments.map((a: any) => a.id as string))
    const brandNewIds = new Set<string>()

    currentIds.forEach(id => {
      if (!seenIdsRef.current.has(id)) {
        brandNewIds.add(id)
      }
    })

    if (brandNewIds.size > 0) {
      setNewIds(brandNewIds)

      setTimeout(() => {
        brandNewIds.forEach(id => seenIdsRef.current.add(id))
        setNewIds(new Set())
      }, 3000)
    }
  }, [adjustments])

  const markAllAsSeen = () => {
    adjustments?.forEach((a: any) => seenIdsRef.current.add(a.id))
    setNewIds(new Set())
  }

  return {
    feedItems,
    totalChanges: feedItems.length,
    hasNewItems: newIds.size > 0,
    markAllAsSeen,
  }
}
