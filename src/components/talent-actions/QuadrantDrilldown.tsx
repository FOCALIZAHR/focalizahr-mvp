'use client'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT DRILLDOWN — Acordeon por cuadrante, segmentado por tenure
// Usa clases .fhr-* de focalizahr-unified.css
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Shield, ChevronRight } from 'lucide-react'
import TenureSegmentBadge from './TenureSegmentBadge'
import { getTalentMapNarrative } from '@/config/TalentMapNarratives'
import { formatDisplayName } from '@/lib/utils/formatName'
import type { QuadrantPerson, TenureSegment } from '@/lib/services/TalentActionService'

interface QuadrantDrilldownProps {
  quadrant: string
  quadrantLabel: string
  quadrantColor: string
  gerenciaId: string
  count: number
  defaultExpanded?: boolean
}

export default function QuadrantDrilldown({
  quadrant,
  quadrantLabel,
  quadrantColor,
  gerenciaId,
  count,
  defaultExpanded
}: QuadrantDrilldownProps) {
  const [persons, setPersons] = useState<QuadrantPerson[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const [hasMore, setHasMore] = useState(false)

  // Sincronizar con cambios externos (click en MetricMini)
  useEffect(() => {
    setExpanded(defaultExpanded ?? false)
  }, [defaultExpanded])

  const fetchPersons = useCallback(async (skip = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        departmentId: gerenciaId,
        skip: String(skip),
        take: '20'
      })
      const res = await fetch(`/api/talent-actions/quadrant/${quadrant}?${params}`)
      if (!res.ok) return

      const result = await res.json()
      if (!result.success) return

      if (skip === 0) {
        setPersons(result.data.persons)
      } else {
        setPersons(prev => [...prev, ...result.data.persons])
      }
      setTotal(result.data.total)
      setHasMore(result.data.pagination.hasMore)
    } catch (err) {
      console.error('[QuadrantDrilldown] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [quadrant, gerenciaId])

  useEffect(() => {
    if (expanded && persons.length === 0) {
      fetchPersons()
    }
  }, [expanded, persons.length, fetchPersons])

  if (count === 0) return null

  const grouped: Record<TenureSegment, QuadrantPerson[]> = {
    onboarding: [],
    real: [],
    cronico: []
  }
  for (const p of persons) {
    grouped[p.tenureSegment].push(p)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--fhr-border-default)' }} className="last:border-b-0">
      {/* Header colapsable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center justify-between text-left transition-colors min-h-[44px]"
        style={{ color: 'var(--fhr-text-secondary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: quadrantColor }} />
          <span className="text-sm font-medium" style={{ color: 'var(--fhr-text-secondary)' }}>
            {quadrantLabel}
          </span>
          <span className="text-xs" style={{ color: 'var(--fhr-text-muted)' }}>
            {count} personas
          </span>
        </div>
        <ChevronRight
          className="w-4 h-4 transition-transform duration-200"
          style={{ color: 'var(--fhr-text-muted)', transform: expanded ? 'rotate(90deg)' : 'none' }}
        />
      </button>

      {/* Contenido expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">
              {loading && persons.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--fhr-cyan)' }} />
                </div>
              ) : (
                <div className="space-y-4">
                  {(['onboarding', 'real', 'cronico'] as TenureSegment[]).map(segment => {
                    const segPersons = grouped[segment]
                    if (segPersons.length === 0) return null

                    return (
                      <div key={segment}>
                        <div className="mb-2">
                          <TenureSegmentBadge segment={segment} />
                          <span className="text-[10px] ml-2" style={{ color: 'var(--fhr-text-muted)' }}>
                            {segPersons.length} {segPersons.length === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {segPersons.map(person => (
                            <PersonRow key={person.employeeId} person={person} />
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {hasMore && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => fetchPersons(persons.length)}
                        disabled={loading}
                        className="text-xs transition-colors"
                        style={{ color: 'var(--fhr-cyan)' }}
                      >
                        {loading ? 'Cargando...' : `Ver mas (${total - persons.length} restantes)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW
// ════════════════════════════════════════════════════════════════════════════

function PersonRow({ person }: { person: QuadrantPerson }) {
  const narrative = getTalentMapNarrative(person.riskQuadrant, person.tenureSegment)

  return (
    <div
      className="py-2 px-2 rounded-lg transition-colors"
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm truncate" style={{ color: 'var(--fhr-text-primary)' }}>
              {formatDisplayName(person.fullName, 'full')}
            </span>
            {person.isSuccessor && (
              <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--fhr-cyan)' }} />
            )}
          </div>
          <div className="text-[10px] truncate" style={{ color: 'var(--fhr-text-muted)' }}>
            {person.position
              ? person.position.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
              : 'Sin cargo'} · {person.departmentName}
          </div>
        </div>

        <TenureSegmentBadge segment={person.tenureSegment} months={person.tenureMonths} />

        {person.roleFitScore !== null && (
          <span className="text-[10px] tabular-nums w-10 text-right" style={{ color: 'var(--fhr-text-muted)' }}>
            {Math.round(person.roleFitScore)}%
          </span>
        )}
      </div>

      {/* Coaching Tip */}
      <div
        className="mt-1.5 px-2 py-1 rounded"
        style={{
          background: 'var(--fhr-bg-subtle)',
          borderLeft: '2px solid var(--fhr-border-default)'
        }}
      >
        <span className="text-[10px] leading-relaxed" style={{ color: 'var(--fhr-text-tertiary)' }}>
          {narrative.coachingTip}
        </span>
      </div>
    </div>
  )
}
