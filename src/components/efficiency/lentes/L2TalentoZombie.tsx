// ════════════════════════════════════════════════════════════════════════════
// L2 — TALENTO ZOMBIE (personas con alto rendimiento en cargos que la IA absorbe)
// src/components/efficiency/lentes/L2TalentoZombie.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G:
//  · Portada   → N personas + badge destructive "Pasivo Tóxico"
//  · Evidencia → ficha rica por persona (rol, exposición, metas, gap mensual)
//  · Interacción → 3 opciones por persona:
//     [Congelar cargo] [Reubicar] [Transición acordada]
//
// Nivel análisis  → cargo (la exposición es del cargo, no de la persona)
// Nivel acción    → persona (la decisión impacta al individuo)
// Nunca mezclar. La UI lo deja explícito.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo, useState, useEffect } from 'react'
import { Snowflake, ArrowRightLeft, Calendar, AlertTriangle } from 'lucide-react'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface PersonAlert {
  // Base PersonAlert
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  observedExposure: number      // legacy Anthropic
  roleFitScore: number
  salary: number
  financialImpact: number
  acotadoGroup: string | null
  standardCategory: string | null
  metasCompliance: number | null

  // Cross-lookup enriched (opción 3 — propagados desde EnrichedEmployee)
  focalizaScore: number | null     // Eloundou canónico (primario)
  tenureMonths: number
  riskQuadrant: string | null       // FUGA_CEREBROS | MOTOR_EQUIPO | BURNOUT_RISK | BAJO_RENDIMIENTO
  mobilityQuadrant: string | null   // SUCESOR_NATURAL | EXPERTO_ANCLA | AMBICIOSO_PREMATURO | EN_DESARROLLO
  nineBoxPosition: string | null
  finiquitoToday: number | null
}

interface L2Detalle {
  count: number
  persons: PersonAlert[]
  totalInertiaCost: number
  avgExposure: number
}

// ════════════════════════════════════════════════════════════════════════════
// LABELS DE CUADRANTES (narrativa ejecutiva, no técnica)
// ════════════════════════════════════════════════════════════════════════════

const RISK_LABEL: Record<string, string> = {
  FUGA_CEREBROS: 'Fuga potencial',
  MOTOR_EQUIPO: 'Motor del equipo',
  BURNOUT_RISK: 'Riesgo de burnout',
  BAJO_RENDIMIENTO: 'Bajo rendimiento',
}

const MOBILITY_LABEL: Record<string, string> = {
  SUCESOR_NATURAL: 'Sucesor natural',
  EXPERTO_ANCLA: 'Experto ancla',
  AMBICIOSO_PREMATURO: 'Ambicioso prematuro',
  EN_DESARROLLO: 'En desarrollo',
}

/** Exposición efectiva — Eloundou primario, legacy Anthropic fallback */
function effExposure(p: PersonAlert): number {
  return p.focalizaScore ?? p.observedExposure ?? 0
}

function formatTenure(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0) return `${y}y`
  return `${y}y ${m}m`
}

type DecisionType = 'congelar' | 'reubicar' | 'transicion'

const DECISION_META: Record<
  DecisionType,
  {
    label: string
    description: string
    color: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  }
> = {
  congelar: {
    label: 'Congelar cargo',
    description: 'Decisión de cargo: no reemplazar si la persona sale',
    color: '#22D3EE',
    icon: Snowflake,
  },
  reubicar: {
    label: 'Reubicar',
    description: 'Mover a un cargo donde sus competencias siguen siendo relevantes',
    color: '#A78BFA',
    icon: ArrowRightLeft,
  },
  transicion: {
    label: 'Transición acordada',
    description: 'Salida con timing definido — costo del finiquito se conoce',
    color: '#F59E0B',
    icon: Calendar,
  },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function L2TalentoZombie({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
}: LenteComponentProps) {
  const detalle = lente.detalle as L2Detalle | null

  // Estado local: decisión tomada por persona
  const [decisiones, setDecisiones] = useState<Record<string, DecisionType | null>>({})

  // Hidrata desde carrito existente (best-effort: si el nombre incluye marker, lo identifica)
  useEffect(() => {
    const inicial: Record<string, DecisionType | null> = {}
    for (const d of decisionesActuales) {
      // Tipo de decisión se guarda en la narrativa metadata — reconstruir del nombre:
      // convención: "{nombre} · {decisionType}"
      const match = d.nombre.match(/· (congelar|reubicar|transicion)$/)
      if (match) inicial[d.id] = match[1] as DecisionType
    }
    setDecisiones(prev => (Object.keys(prev).length === 0 ? inicial : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const personsSorted = useMemo(() => {
    if (!detalle?.persons) return []
    // Ordenar por financialImpact descendente (mayor gap primero)
    return [...detalle.persons].sort((a, b) => b.financialImpact - a.financialImpact)
  }, [detalle])

  if (!lente.hayData || !detalle || personsSorted.length === 0) {
    return <LenteCard lente={lente} estado="vacio">{null}</LenteCard>
  }

  const handleToggleDecision = (person: PersonAlert, tipo: DecisionType) => {
    const current = decisiones[person.employeeId]
    const isToggleOff = current === tipo

    setDecisiones(prev => ({
      ...prev,
      [person.employeeId]: isToggleOff ? null : tipo,
    }))

    if (isToggleOff) {
      onRemove(decisionKey({ tipo: 'persona', id: person.employeeId }))
      return
    }

    // Transición: la inversión es el finiquito real.
    // Congelar / Reubicar: no hay inversión one-time.
    const finiquito =
      tipo === 'transicion' ? person.finiquitoToday ?? 0 : 0

    const item: DecisionItem = {
      id: person.employeeId,
      lenteId: 'l2_zombie',
      tipo: 'persona',
      // Convención interna: sufijo · tipo para re-hidratar al volver
      nombre: `${person.employeeName} · ${tipo}`,
      gerencia: person.departmentName,
      ahorroMes: person.financialImpact,
      finiquito,
      fteEquivalente: tipo === 'transicion' ? 1 : 0,
      narrativa: `${lente.narrativa}\n\nDecisión: ${DECISION_META[tipo].label}. ${DECISION_META[tipo].description}.`,
      aprobado: false,
    }
    onUpsert(item)
  }

  return (
    <LenteCard lente={lente}>
      {/* ── Portada ─────────────────────────────────────────────── */}
      <LenteCard.Portada
        metricaProtagonista={String(detalle.count)}
        metricaLabel={`personas · ${Math.round(detalle.avgExposure * 100)}% exposición promedio`}
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-red-500/40 bg-red-500/15 text-red-300">
            <AlertTriangle className="w-3 h-3" />
            Pasivo Tóxico
          </span>
        }
      >
        {lente.narrativa}
      </LenteCard.Portada>

      {/* ── Evidencia + Interacción combinadas por persona ────── */}
      <LenteCard.Evidencia titulo="Quiénes son, cuánto cuestan">
        <div className="space-y-4">
          {personsSorted.map(p => {
            const decision = decisiones[p.employeeId] ?? null
            const metasPct = p.metasCompliance
            return (
              <div
                key={p.employeeId}
                className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/60"
              >
                {/* Header persona */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p.employeeName}
                    </p>
                    <p className="text-xs text-slate-400 font-light mt-0.5">
                      {p.position} · {p.departmentName}
                      <span className="text-slate-500"> · {formatTenure(p.tenureMonths)}</span>
                    </p>
                  </div>
                  {decision && (
                    <span
                      className="flex-shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-medium"
                      style={{
                        color: DECISION_META[decision].color,
                        borderColor: `${DECISION_META[decision].color}60`,
                        backgroundColor: `${DECISION_META[decision].color}15`,
                      }}
                    >
                      {DECISION_META[decision].label}
                    </span>
                  )}
                </div>

                {/* Cuadrantes + nineBox (narrativa de contexto) */}
                {(p.riskQuadrant || p.mobilityQuadrant || p.nineBoxPosition) && (
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {p.riskQuadrant && (
                      <QuadrantChip
                        label={RISK_LABEL[p.riskQuadrant] ?? p.riskQuadrant}
                        tone={
                          p.riskQuadrant === 'MOTOR_EQUIPO'
                            ? 'good'
                            : p.riskQuadrant === 'FUGA_CEREBROS' || p.riskQuadrant === 'BURNOUT_RISK'
                            ? 'bad'
                            : 'neutral'
                        }
                      />
                    )}
                    {p.mobilityQuadrant && (
                      <QuadrantChip
                        label={MOBILITY_LABEL[p.mobilityQuadrant] ?? p.mobilityQuadrant}
                        tone={
                          p.mobilityQuadrant === 'SUCESOR_NATURAL'
                            ? 'good'
                            : p.mobilityQuadrant === 'EN_DESARROLLO'
                            ? 'neutral'
                            : 'neutral'
                        }
                      />
                    )}
                    {p.nineBoxPosition && (
                      <QuadrantChip
                        label={`9-Box: ${p.nineBoxPosition.replace(/_/g, ' ').toLowerCase()}`}
                        tone="neutral"
                      />
                    )}
                  </div>
                )}

                {/* Stats: roleFit + exposición canónica + metas + gap */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <Stat
                    label="Role Fit"
                    value={`${Math.round(p.roleFitScore)}%`}
                    tone={p.roleFitScore >= 75 ? 'good' : p.roleFitScore >= 50 ? 'neutral' : 'bad'}
                  />
                  <Stat
                    label="Exposición IA"
                    value={`${Math.round(effExposure(p) * 100)}%`}
                    tone={effExposure(p) >= 0.5 ? 'bad' : 'neutral'}
                  />
                  <Stat
                    label="Metas"
                    value={metasPct !== null ? `${Math.round(metasPct)}%` : '—'}
                    tone={
                      metasPct === null
                        ? 'neutral'
                        : metasPct >= 80
                        ? 'good'
                        : metasPct >= 60
                        ? 'neutral'
                        : 'bad'
                    }
                  />
                  <Stat
                    label="Gap / mes"
                    value={formatCLP(p.financialImpact)}
                    tone="bad"
                  />
                </div>

                {/* Reloj de finiquito (si hay datos de tenure) */}
                {p.finiquitoToday !== null && p.finiquitoToday > 0 && (
                  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-slate-900/80 border border-slate-800/80 mb-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      Finiquito hoy
                    </span>
                    <span className="text-sm font-medium text-emerald-300">
                      {formatCLP(p.finiquitoToday)}
                    </span>
                  </div>
                )}

                {/* 3 Opciones de decisión */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 border-t border-slate-800/60">
                  {(['congelar', 'reubicar', 'transicion'] as DecisionType[]).map(
                    tipo => {
                      const meta = DECISION_META[tipo]
                      const Icon = meta.icon
                      const selected = decision === tipo
                      return (
                        <button
                          key={tipo}
                          onClick={() => handleToggleDecision(p, tipo)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors text-left ${
                            selected
                              ? 'border-transparent text-white'
                              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                          style={
                            selected
                              ? {
                                  backgroundColor: `${meta.color}20`,
                                  borderColor: `${meta.color}70`,
                                  boxShadow: `0 0 12px ${meta.color}30`,
                                }
                              : undefined
                          }
                          title={meta.description}
                        >
                          <Icon
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: selected ? meta.color : undefined }}
                          />
                          <span className="truncate">{meta.label}</span>
                        </button>
                      )
                    }
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </LenteCard.Evidencia>
    </LenteCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAT CHIP
// ════════════════════════════════════════════════════════════════════════════

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'good' | 'neutral' | 'bad'
}) {
  const color =
    tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-red-300' : 'text-slate-200'
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-light">
        {label}
      </p>
      <p className={`text-sm font-light mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// QUADRANT CHIP — etiqueta narrativa con tono
// ════════════════════════════════════════════════════════════════════════════

function QuadrantChip({
  label,
  tone,
}: {
  label: string
  tone: 'good' | 'neutral' | 'bad'
}) {
  const styles =
    tone === 'good'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      : tone === 'bad'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : 'border-slate-700 bg-slate-800/60 text-slate-300'
  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-light ${styles}`}
    >
      {label}
    </span>
  )
}
