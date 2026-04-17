// ════════════════════════════════════════════════════════════════════════════
// L7+L8 — MAPA DE TALENTO (fusión: 3 zonas de la misma radiografía)
// src/components/efficiency/lentes/L7L8MapaTalento.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tres zonas sobre el mismo espectro de personas:
//
//  · ZONA PROTECCIÓN (amber/cyan) — los que no se pueden perder
//    Talento aumentado con IA. Tono protector. Narrativa McKinsey.
//    Selector de blindaje con ROI inmediato.
//
//  · ZONA DECISIÓN (neutral → rojo) — ranking de prescindibles
//    Justificación por persona visible sin click. Confirmar / excepción.
//
//  · ZONA CRÍTICA (destacada) — alerta operacional
//    Cargos críticos con alta exposición IA sin sucesor. Informativa.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Shield, Check, AlertTriangle, Crown } from 'lucide-react'
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

interface PersonAlertAug {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  observedExposure: number
  roleFitScore: number
  salary: number
  financialImpact: number
  replacementCost: number
  acotadoGroup: string | null
  standardCategory: string | null
  metasCompliance: number | null
}

interface L7Detalle {
  count: number
  persons: PersonAlertAug[]
  totalReplacementCost: number
}

interface RetentionEntryMin {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  tier: string
  isCriticalPosition: boolean
  salary: number
  observedExposure: number
  focalizaScore: number | null
  roleFitScore: number
  metasCompliance: number | null
  mobilityQuadrant: string | null
  riskQuadrant: string | null
  potentialAbility: number | null
}

interface L8Detalle {
  ranking: RetentionEntryMin[]
  tiers: {
    intocable: number
    valioso: number
    neutro: number
    prescindible: number
  }
  intocablesCount: number
  prescindiblesCount: number
}

type TipoBlindaje = 'compensacion' | 'desarrollo' | 'rol'

const BLINDAJE_META: Record<
  TipoBlindaje,
  { label: string; descripcion: string; factorSalario: number }
> = {
  compensacion: {
    label: 'Revisión de compensación',
    descripcion: 'Ajuste salarial + bono retención. Acción directa.',
    factorSalario: 0.15,
  },
  desarrollo: {
    label: 'Plan de desarrollo acelerado',
    descripcion: 'Inversión en competencias + visibilidad interna.',
    factorSalario: 0.08,
  },
  rol: {
    label: 'Expansión de rol',
    descripcion: 'Ampliar alcance o liderazgo del cargo.',
    factorSalario: 0.05,
  },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function L7L8MapaTalento({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
  allLentes,
}: LenteComponentProps) {
  const l7 = (allLentes?.l7_fuga?.detalle as L7Detalle | null) ?? null
  const l8 = (allLentes?.l8_retencion?.detalle as L8Detalle | null) ?? null

  // Estado zona protección: blindaje elegido por persona
  const [blindajeByPerson, setBlindajeByPerson] = useState<
    Record<string, TipoBlindaje | null>
  >({})

  // Estado zona decisión: personas confirmadas en la lista
  const [confirmados, setConfirmados] = useState<Set<string>>(new Set())
  const [excepciones, setExcepciones] = useState<Record<string, string>>({})

  useEffect(() => {
    const blindInit: Record<string, TipoBlindaje | null> = {}
    const confirmInit = new Set<string>()
    for (const d of decisionesActuales) {
      const matchB = d.nombre.match(/· blindaje-(compensacion|desarrollo|rol)$/)
      if (matchB) blindInit[d.id] = matchB[1] as TipoBlindaje
      const matchC = d.nombre.match(/· confirmado$/)
      if (matchC) confirmInit.add(d.id)
    }
    setBlindajeByPerson(prev =>
      Object.keys(prev).length === 0 ? blindInit : prev
    )
    setConfirmados(prev => (prev.size === 0 ? confirmInit : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Clasificación de zonas ────────────────────────────────────
  const proteccion = useMemo(() => l7?.persons ?? [], [l7])

  const decision = useMemo(() => {
    if (!l8) return []
    return l8.ranking
      .filter(r => r.tier === 'prescindible')
      .sort((a, b) => a.retentionScore - b.retentionScore)
  }, [l8])

  const critica = useMemo(() => {
    if (!l8) return []
    return l8.ranking.filter(
      r =>
        r.isCriticalPosition &&
        ((r.focalizaScore ?? r.observedExposure) > 0.5)
    )
  }, [l8])

  // ── Handlers ──────────────────────────────────────────────────
  const handleBlindar = (p: PersonAlertAug, tipo: TipoBlindaje) => {
    const current = blindajeByPerson[p.employeeId]
    const isToggleOff = current === tipo
    const meta = BLINDAJE_META[tipo]
    const inversion = Math.round(p.salary * 12 * meta.factorSalario)

    setBlindajeByPerson(prev => ({
      ...prev,
      [p.employeeId]: isToggleOff ? null : tipo,
    }))

    if (isToggleOff) {
      onRemove(decisionKey({ tipo: 'persona', id: p.employeeId }))
      return
    }

    const item: DecisionItem = {
      id: p.employeeId,
      lenteId: 'l7_fuga',
      tipo: 'persona',
      nombre: `${p.employeeName} · blindaje-${tipo}`,
      gerencia: p.departmentName,
      ahorroMes: 0, // blindaje no genera ahorro — evita reemplazo
      finiquito: inversion, // inversión one-time
      fteEquivalente: 0,
      narrativa: `${lente.narrativa}\n\nBlindaje ${meta.label.toLowerCase()}: inversión ${formatCLP(inversion)} · evita ${formatCLP(p.replacementCost)} en costo de reemplazo. ROI ${(p.replacementCost / inversion).toFixed(1)}x.`,
      aprobado: false,
    }
    onUpsert(item)
  }

  const handleConfirmar = (r: RetentionEntryMin) => {
    const isConfirmed = confirmados.has(r.employeeId)
    setConfirmados(prev => {
      const next = new Set(prev)
      if (isConfirmed) next.delete(r.employeeId)
      else next.add(r.employeeId)
      return next
    })

    if (isConfirmed) {
      onRemove(decisionKey({ tipo: 'persona', id: r.employeeId }))
      // también limpiar excepción si había
      setExcepciones(prev => {
        const copy = { ...prev }
        delete copy[r.employeeId]
        return copy
      })
      return
    }

    const item: DecisionItem = {
      id: r.employeeId,
      lenteId: 'l8_retencion',
      tipo: 'persona',
      nombre: `${r.employeeName} · confirmado`,
      gerencia: r.departmentName,
      ahorroMes: r.salary,
      finiquito: 0, // L9 calcula finiquitos con detalle
      fteEquivalente: 1,
      narrativa: `${lente.narrativa}\n\nConfirmado en la lista de transición — retentionScore ${Math.round(r.retentionScore)}.`,
      aprobado: false,
    }
    onUpsert(item)
  }

  const handleExcepcion = (r: RetentionEntryMin, razon: string) => {
    setExcepciones(prev => ({ ...prev, [r.employeeId]: razon }))
  }

  // ── Render ────────────────────────────────────────────────────
  const totalAnalizados = (l7?.persons.length ?? 0) + (l8?.ranking.length ?? 0)

  if (!l7 && !l8) {
    return <LenteCard lente={lente} estado="vacio">{null}</LenteCard>
  }

  return (
    <LenteCard
      lente={lente}
      tituloOverride="Mapa de Talento"
    >
      <LenteCard.Portada
        metricaProtagonista={String(totalAnalizados)}
        metricaLabel={`personas analizadas · ${l8?.intocablesCount ?? 0} intocables · ${decision.length} candidatos a transición`}
      >
        Este lente fusiona dos miradas sobre el mismo espectro humano: a quiénes
        blindar y a quiénes soltar. El ADN es el mismo — solo cambia el extremo.
      </LenteCard.Portada>

      {/* ═══ ZONA PROTECCIÓN ═══ */}
      <LenteCard.Evidencia titulo="Zona Protección — talento que no se puede perder">
        {proteccion.length === 0 ? (
          <p className="text-xs text-slate-500 font-light">
            El sistema no identificó talento aumentado en riesgo de fuga con
            los criterios actuales.
          </p>
        ) : (
          <>
            <div
              className="p-4 rounded-lg border mb-4"
              style={{
                background: 'rgba(34, 211, 238, 0.06)',
                borderColor: 'rgba(34, 211, 238, 0.30)',
              }}
            >
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Dos señales apuntan en la misma dirección: dominan su cargo y
                lo que hacen se vuelve más valioso con IA — no más reemplazable.{' '}
                <span className="text-cyan-300">El mercado ya identifica estos perfiles</span>.
                Si la compensación no refleja ese nuevo valor, el reconocimiento
                se convierte en un subsidio a la competencia.
              </p>
            </div>

            <div className="space-y-3">
              {proteccion.map(p => {
                const blind = blindajeByPerson[p.employeeId] ?? null
                return (
                  <div
                    key={p.employeeId}
                    className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/60"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          <p className="text-sm font-medium text-white">
                            {p.employeeName}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 font-light mt-0.5">
                          {p.position} · {p.departmentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">
                          Costo de reemplazo
                        </p>
                        <p className="text-sm font-medium text-amber-300">
                          {formatCLP(p.replacementCost)}
                        </p>
                      </div>
                    </div>

                    {/* Selector blindaje */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {(['compensacion', 'desarrollo', 'rol'] as TipoBlindaje[]).map(
                        tipo => {
                          const meta = BLINDAJE_META[tipo]
                          const inv = Math.round(p.salary * 12 * meta.factorSalario)
                          const roi = (p.replacementCost / inv).toFixed(1)
                          const selected = blind === tipo
                          return (
                            <button
                              key={tipo}
                              onClick={() => handleBlindar(p, tipo)}
                              className={`text-left p-3 rounded-md border text-xs transition-colors ${
                                selected
                                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                                  : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600'
                              }`}
                              title={meta.descripcion}
                            >
                              <p className="font-medium leading-tight">
                                {meta.label}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {formatCLP(inv)} · ROI {roi}x
                              </p>
                            </button>
                          )
                        }
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </LenteCard.Evidencia>

      {/* ═══ ZONA DECISIÓN ═══ */}
      <LenteCard.Evidencia titulo="Zona Decisión — ranking validable de prescindibles">
        {decision.length === 0 ? (
          <p className="text-xs text-slate-500 font-light">
            Sin candidatos en la lista de transición. El motor ya excluyó
            cargos críticos y sucesores naturales.
          </p>
        ) : (
          <div className="space-y-2">
            {decision.map(r => {
              const confirmed = confirmados.has(r.employeeId)
              const justificacion = buildJustificacion(r)
              return (
                <div
                  key={r.employeeId}
                  className={`p-3 rounded-md border transition-colors ${
                    confirmed
                      ? 'bg-red-500/5 border-red-500/40'
                      : 'bg-slate-900/60 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {r.employeeName}
                        <span className="ml-2 text-xs text-slate-500 font-light">
                          · {r.position}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-light mt-1 leading-snug">
                        {justificacion}
                      </p>
                      {excepciones[r.employeeId] && (
                        <p className="text-[11px] text-amber-300 font-light mt-1 italic">
                          Excepción: {excepciones[r.employeeId]}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          const razon = prompt('Razón de la excepción:')
                          if (razon) handleExcepcion(r, razon)
                        }}
                        className="text-[10px] text-slate-500 hover:text-amber-300 transition-colors px-2 py-1 rounded border border-slate-700 hover:border-amber-500/50"
                      >
                        Excepción
                      </button>
                      <button
                        onClick={() => handleConfirmar(r)}
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-3 py-1 rounded border transition-colors ${
                          confirmed
                            ? 'border-red-400 bg-red-500/20 text-red-200'
                            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        {confirmed ? 'Confirmada' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </LenteCard.Evidencia>

      {/* ═══ ZONA CRÍTICA ═══ */}
      {critica.length > 0 && (
        <LenteCard.Interaccion titulo="Zona Crítica — alerta operacional (no captura decisión)">
          <div
            className="p-4 rounded-lg border space-y-3"
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                {critica.length} cargo{critica.length === 1 ? '' : 's'} crítico{critica.length === 1 ? '' : 's'} con alta
                exposición IA y sin sucesor identificado. Si la persona sale antes
                de que el cargo se transforme, el riesgo no es financiero — es operacional.
              </p>
            </div>
            <div className="space-y-1.5">
              {critica.map(r => (
                <div
                  key={r.employeeId}
                  className="flex items-center gap-2 text-[11px] text-slate-300 font-light"
                >
                  <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="font-medium text-white">{r.position}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{r.departmentName}</span>
                  <span className="text-slate-500 ml-auto">
                    Exposición{' '}
                    <span className="text-red-300">
                      {Math.round((r.focalizaScore ?? r.observedExposure) * 100)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </LenteCard.Interaccion>
      )}
    </LenteCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function buildJustificacion(r: RetentionEntryMin): string {
  const partes: string[] = []
  partes.push(`score ${Math.round(r.retentionScore)}`)
  if (r.metasCompliance !== null) {
    partes.push(`metas ${Math.round(r.metasCompliance)}%`)
  }
  partes.push(`role fit ${Math.round(r.roleFitScore)}%`)
  const exposicion = r.focalizaScore ?? r.observedExposure
  partes.push(`exposición ${Math.round(exposicion * 100)}%`)
  return partes.join(' · ')
}
