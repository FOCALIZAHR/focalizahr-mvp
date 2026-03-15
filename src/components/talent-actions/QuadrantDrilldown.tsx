'use client'

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT DRILLDOWN — Lista personas por cuadrante, segmentada por tenure
// Badge sucesor si aplica
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Shield, ChevronDown } from 'lucide-react'
import TenureSegmentBadge from './TenureSegmentBadge'
import type { QuadrantPerson, TenureSegment } from '@/lib/services/TalentActionService'

interface QuadrantDrilldownProps {
  quadrant: string
  quadrantLabel: string
  quadrantColor: string
  gerenciaId: string
  count: number
}

const ALERT_COLORS: Record<string, string> = {
  RED: 'bg-amber-500/20 text-amber-400',
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
// COACHING TIP — Micro-copy ejecutivo por cuadrante + tenure
// ════════════════════════════════════════════════════════════════════════════

function getCoachingTip(person: QuadrantPerson): string | null {
  const { riskQuadrant, tenureMonths } = person

  switch (riskQuadrant) {
    case 'FUGA_CEREBROS':
      if (tenureMonths >= 36) return 'Riesgo de perdida inminente. Agendar conversacion de retencion esta semana.'
      if (tenureMonths >= 12) return 'Talento valioso en ventana de fuga. Validar expectativas de crecimiento.'
      return 'Alto potencial temprano insatisfecho. Revisar promesa de valor del onboarding.'

    case 'BURNOUT_RISK':
      if (tenureMonths < 6) return 'Onboarding fallido. Revisar asignacion de carga inmediata.'
      if (tenureMonths >= 36) return 'Desgaste cronico. Evaluar rotacion lateral o reduccion de scope urgente.'
      return 'Sobrecarga sostenida. Redistribuir carga y agendar check-in de bienestar.'

    case 'BAJO_RENDIMIENTO':
      if (tenureMonths < 6) return 'Desajuste temprano. Validar fit de rol antes de invertir en desarrollo.'
      if (tenureMonths >= 24) return 'Bajo rendimiento cronico. Requiere plan de mejora formal con plazo definido.'
      return 'Rendimiento bajo expectativa. Diagnosticar causa raiz: competencia, motivacion o contexto.'

    case 'MOTOR_EQUIPO':
      if (tenureMonths >= 36) return 'Pilar del equipo. Proteger de sobrecarga y preparar como mentor formal.'
      return 'Motor productivo. Monitorear carga para prevenir transicion a burnout.'

    default:
      return null
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PERSON ROW — Fila compacta por persona + coaching tip ejecutivo
// ════════════════════════════════════════════════════════════════════════════

function PersonRow({ person }: { person: QuadrantPerson }) {
  const alertClass = person.riskAlertLevel
    ? ALERT_COLORS[person.riskAlertLevel] || ''
    : ''

  const coachingTip = getCoachingTip(person)

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

        {/* Alert level */}
        {person.riskAlertLevel && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${alertClass}`}>
            {person.riskAlertLevel}
          </span>
        )}

        {/* RoleFit */}
        {person.roleFitScore !== null && (
          <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
            {Math.round(person.roleFitScore)}%
          </span>
        )}
      </div>

      {/* Coaching Tip */}
      {coachingTip && (
        <div className="mt-1.5 ml-0 px-2 py-1 rounded bg-slate-800/50 border-l-2 border-amber-500/40">
          <span className="text-[10px] text-slate-400 leading-relaxed">
            Accion sugerida: {coachingTip}
          </span>
        </div>
      )}
    </div>
  )
}
