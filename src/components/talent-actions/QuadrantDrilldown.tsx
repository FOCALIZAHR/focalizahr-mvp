'use client'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT DRILLDOWN — Lista personas por cuadrante, segmentada por tenure
// Badge sucesor si aplica
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Shield, ChevronDown } from 'lucide-react'
import TenureSegmentBadge from './TenureSegmentBadge'
import { getTalentMapNarrative } from '@/config/TalentMapNarratives'
import type { QuadrantPerson, TenureSegment } from '@/lib/services/TalentActionService'

interface QuadrantDrilldownProps {
  quadrant: string
  quadrantLabel: string
  quadrantColor: string
  gerenciaId: string
  count: number
}

const ALERT_BADGE_COLORS: Record<string, string> = {
  RED: 'bg-red-500/20 text-red-400',
  ORANGE: 'bg-orange-500/20 text-orange-400',
  YELLOW: 'bg-yellow-500/20 text-yellow-400',
  GREEN: 'bg-emerald-500/20 text-emerald-400'
}

export default function QuadrantDrilldown({
  quadrant,
  quadrantLabel,
  quadrantColor,
  gerenciaId,
  count
}: QuadrantDrilldownProps) {
  const [persons, setPersons] = useState<QuadrantPerson[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hasMore, setHasMore] = useState(false)

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

  // Fetch on expand
  useEffect(() => {
    if (expanded && persons.length === 0) {
      fetchPersons()
    }
  }, [expanded, persons.length, fetchPersons])

  if (count === 0) return null

  // Agrupar por tenure
  const grouped: Record<TenureSegment, QuadrantPerson[]> = {
    onboarding: [],
    real: [],
    cronico: []
  }
  for (const p of persons) {
    grouped[p.tenureSegment].push(p)
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${quadrantColor}`}>{quadrantLabel}</span>
          <span className="text-xs text-slate-500">{count} personas</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="border-t border-slate-800"
        >
          {loading && persons.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {/* Render por segmento de tenure */}
              {(['onboarding', 'real', 'cronico'] as TenureSegment[]).map(segment => {
                const segPersons = grouped[segment]
                if (segPersons.length === 0) return null

                return (
                  <div key={segment} className="p-3">
                    <div className="mb-2">
                      <TenureSegmentBadge segment={segment} />
                      <span className="text-[10px] text-slate-600 ml-2">
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

              {/* Load more */}
              {hasMore && (
                <div className="p-3 text-center">
                  <button
                    onClick={() => fetchPersons(persons.length)}
                    disabled={loading}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {loading ? 'Cargando...' : `Ver mas (${total - persons.length} restantes)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW — Fila compacta por persona + badge narrativo + coaching tip
// Usa talentMapNarratives.ts como fuente unica de verdad
// ════════════════════════════════════════════════════════════════════════════

function PersonRow({ person }: { person: QuadrantPerson }) {
  const narrative = getTalentMapNarrative(person.riskQuadrant, person.tenureSegment)
  const badgeColor = ALERT_BADGE_COLORS[narrative.alertLevel] || ''

  return (
    <div className="py-2 px-2 rounded-lg hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Nombre + cargo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white truncate">{person.fullName}</span>
            {person.isSuccessor && (
              <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {person.position || 'Sin cargo'} · {person.departmentName}
          </div>
        </div>

        {/* Tenure */}
        <TenureSegmentBadge segment={person.tenureSegment} months={person.tenureMonths} />

        {/* Badge narrativo */}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`}>
          {narrative.badge}
        </span>

        {/* RoleFit */}
        {person.roleFitScore !== null && (
          <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
            {Math.round(person.roleFitScore)}%
          </span>
        )}
      </div>

      {/* Coaching Tip */}
      <div className="mt-1.5 ml-0 px-2 py-1 rounded bg-slate-800/50 border-l-2 border-amber-500/40">
        <span className="text-[10px] text-slate-400 leading-relaxed">
          {narrative.coachingTip}
        </span>
      </div>
    </div>
  )
}
