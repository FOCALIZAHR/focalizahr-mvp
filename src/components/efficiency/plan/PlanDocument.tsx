// ════════════════════════════════════════════════════════════════════════════
// PLAN DOCUMENT — Documento ejecutivo final ensamblado
// src/components/efficiency/plan/PlanDocument.tsx
// ════════════════════════════════════════════════════════════════════════════
// El Plan NO es una tabla de datos — es la JUSTIFICACIÓN al directorio.
// Cada acto (decisión) trae su narrativa editable. El CEO revisa, ajusta,
// aprueba, y al final obtiene un Business Case listo para presentar.
//
// Ensamblaje:
//   1. Header — título editable + meta (N decisiones · fecha · estado)
//   2. MetricasResumen — 4 cards hero (FTE, Ahorro, Inversión, Payback)
//   3. ProyeccionBars — barras 3/6/12/24/36 meses
//   4. Narrativa ejecutiva — párrafo global auto-generado + editable
//   5. Actos — un ActoNarrativo por decisión, agrupados por familia
//   6. Selector tesis — [Eficiencia] [Crecimiento] [Evolución]
//   7. CTAs — [Guardar borrador] · [Generar Business Case →]
//      Business Case habilitado solo si TODAS las decisiones están aprobadas.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  FileText,
  Sparkles,
  Target,
  TrendingUp as TrendingUpIcon,
  Compass,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { MetricasResumen } from './MetricasResumen'
import { ProyeccionBars } from './ProyeccionBars'
import { ActoNarrativo } from './ActoNarrativo'
import {
  calcularResumenCarrito,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import {
  LENTES_META,
  formatCLP,
  type FamiliaId,
  type LenteId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export type Tesis = 'eficiencia' | 'crecimiento' | 'evolucion'

const TESIS_META: Record<
  Tesis,
  {
    label: string
    descripcion: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    color: string
  }
> = {
  eficiencia: {
    label: 'Eficiencia',
    descripcion: 'Reducir costo y capturar capacidad liberada',
    icon: Target,
    color: '#22D3EE',
  },
  crecimiento: {
    label: 'Crecimiento',
    descripcion: 'Reinvertir el ahorro en expandir el negocio',
    icon: TrendingUpIcon,
    color: '#A78BFA',
  },
  evolucion: {
    label: 'Evolución',
    descripcion: 'Rediseñar la organización para el próximo ciclo',
    icon: Compass,
    color: '#F59E0B',
  },
}

const FAMILIA_META: Record<FamiliaId, { label: string; accent: string }> = {
  choque_tecnologico: { label: 'Diagnóstico · Choque Tecnológico', accent: '#22D3EE' },
  grasa_organizacional: { label: 'Oportunidad · Grasa Organizacional', accent: '#A78BFA' },
  riesgo_financiero: { label: 'Protección · Riesgo Financiero', accent: '#F59E0B' },
}

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

export interface PlanDocumentProps {
  /** Decisiones del plan (ya con aprobado flag) */
  decisiones: DecisionItem[]
  /** Narrativas editadas por el CEO — key = `${tipo}:${id}` */
  narrativasEditadas: Record<string, string>
  /** Narrativa ejecutiva global editada (override del auto-generado) */
  narrativaEjecutivaEditada: string | null
  /** Tesis del plan */
  tesis: Tesis
  /** Nombre editable del plan */
  planNombre: string

  onNarrativaChange: (key: string, texto: string) => void
  onNarrativaEjecutivaChange: (texto: string) => void
  onApprove: (key: string) => void
  onRevoke: (key: string) => void
  onRemove: (key: string) => void
  onTesisChange: (tesis: Tesis) => void
  onPlanNombreChange: (nombre: string) => void
  onGuardarBorrador: () => void
  onGenerarBusinessCase: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function PlanDocument({
  decisiones,
  narrativasEditadas,
  narrativaEjecutivaEditada,
  tesis,
  planNombre,
  onNarrativaChange,
  onNarrativaEjecutivaChange,
  onApprove,
  onRevoke,
  onRemove,
  onTesisChange,
  onPlanNombreChange,
  onGuardarBorrador,
  onGenerarBusinessCase,
}: PlanDocumentProps) {
  // Resumen métricas
  const resumen = useMemo(
    () => calcularResumenCarrito(decisiones),
    [decisiones]
  )

  // Agrupar decisiones por familia (orden canónico)
  const decisionesPorFamilia = useMemo(() => {
    const order: FamiliaId[] = [
      'choque_tecnologico',
      'grasa_organizacional',
      'riesgo_financiero',
    ]
    const grouped = new Map<FamiliaId, DecisionItem[]>()
    for (const fam of order) grouped.set(fam, [])
    for (const d of decisiones) {
      const fam = LENTES_META[d.lenteId]?.familia
      if (!fam) continue
      grouped.get(fam)!.push(d)
    }
    return order
      .map(fam => ({ familia: fam, items: grouped.get(fam) ?? [] }))
      .filter(g => g.items.length > 0)
  }, [decisiones])

  // Narrativa ejecutiva auto-generada (o override editado)
  const narrativaAutoGenerada = useMemo(
    () => generarNarrativaEjecutiva(decisiones, decisionesPorFamilia, resumen, tesis),
    [decisiones, decisionesPorFamilia, resumen, tesis]
  )
  const narrativaEjecutiva =
    narrativaEjecutivaEditada ?? narrativaAutoGenerada

  // Estado edición narrativa ejecutiva con autosave
  const [narrativaLocal, setNarrativaLocal] = useState(narrativaEjecutiva)
  const [narrativaSaving, setNarrativaSaving] = useState<
    'idle' | 'pending' | 'saved'
  >('idle')
  const narrativaTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Si la narrativa auto cambia (porque cambiaron las decisiones) y no hay
  // override del usuario, refrescar el textarea.
  useEffect(() => {
    if (narrativaEjecutivaEditada === null) {
      setNarrativaLocal(narrativaAutoGenerada)
    }
  }, [narrativaAutoGenerada, narrativaEjecutivaEditada])

  // Autosave narrativa ejecutiva (1.5s)
  useEffect(() => {
    if (narrativaLocal === narrativaEjecutiva) {
      setNarrativaSaving('idle')
      return
    }
    setNarrativaSaving('pending')
    if (narrativaTimer.current) clearTimeout(narrativaTimer.current)
    narrativaTimer.current = setTimeout(() => {
      onNarrativaEjecutivaChange(narrativaLocal)
      setNarrativaSaving('saved')
      setTimeout(() => setNarrativaSaving('idle'), 1200)
    }, 1500)
    return () => {
      if (narrativaTimer.current) clearTimeout(narrativaTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrativaLocal])

  // Business Case habilitado solo si TODAS las decisiones están aprobadas
  const totalDecisiones = decisiones.length
  const aprobadas = decisiones.filter(d => d.aprobado).length
  const todasAprobadas = totalDecisiones > 0 && aprobadas === totalDecisiones

  // Fecha de hoy formateada
  const hoy = useMemo(
    () =>
      new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    []
  )

  // ── Vista empty ────────────────────────────────────────────────
  if (decisiones.length === 0) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center px-6">
        <div className="fhr-card p-8 max-w-md text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-light text-white mb-2">
            El plan está vacío
          </h2>
          <p className="text-sm text-slate-400 font-light mb-5">
            Vuelve al Efficiency Hub y agrega decisiones desde los lentes
            para construir tu plan.
          </p>
          <Link
            href="/dashboard/efficiency"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Hub
          </Link>
        </div>
      </div>
    )
  }

  // ── Plan ejecutivo ────────────────────────────────────────────
  return (
    <div className="fhr-bg-main min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Back link */}
        <Link
          href="/dashboard/efficiency"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-300 transition-colors mb-6 font-light"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al Efficiency Hub
        </Link>

        {/* HEADER */}
        <header className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400 font-medium">
            Plan de Eficiencia Organizacional
          </p>
          <div className="mt-2 relative group">
            <input
              value={planNombre === 'Plan sin nombre' ? '' : planNombre}
              onChange={e => onPlanNombreChange(e.target.value || 'Plan sin nombre')}
              placeholder="Ponle un nombre a este plan — ej. Q2 Automatización & Talento"
              className="w-full bg-transparent text-2xl md:text-3xl font-extralight text-white leading-tight border-0 focus:outline-none placeholder:text-slate-500/70 pb-1 border-b border-dashed border-slate-700/60 hover:border-cyan-500/40 focus:border-cyan-500 transition-colors pr-9"
              style={{ letterSpacing: '-0.01em' }}
              aria-label="Nombre del plan"
            />
            <Pencil
              className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-focus-within:text-cyan-400 pointer-events-none transition-colors"
              aria-hidden
            />
          </div>
          <p className="text-[10px] text-slate-500 font-light mt-1">
            Click para editar · el nombre aparece en el Business Case del directorio.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-light flex-wrap">
            <span>
              <span className="text-slate-300 font-medium">{totalDecisiones}</span>{' '}
              {totalDecisiones === 1 ? 'decisión' : 'decisiones'}
            </span>
            <span>·</span>
            <span>{hoy}</span>
            <span>·</span>
            <StatusBadge todasAprobadas={todasAprobadas} aprobadas={aprobadas} total={totalDecisiones} />
          </div>
        </header>

        {/* MÉTRICAS */}
        <section className="mb-10">
          <MetricasResumen resumen={resumen} />
        </section>

        {/* PROYECCIÓN */}
        <section className="mb-10 fhr-card p-5 md:p-6">
          <ProyeccionBars resumen={resumen} />
        </section>

        {/* NARRATIVA EJECUTIVA DEL PLAN */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">
              Narrativa ejecutiva
            </p>
            <AutoSaveLabel state={narrativaSaving} />
          </div>
          <textarea
            value={narrativaLocal}
            onChange={e => setNarrativaLocal(e.target.value)}
            rows={Math.max(4, Math.min(12, narrativaLocal.split('\n').length + 1))}
            className="w-full text-base text-slate-200 font-light leading-relaxed bg-slate-900/50 backdrop-blur-xl border border-slate-800/70 rounded-xl p-5 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors resize-none"
            placeholder="Párrafo de apertura para el directorio — generado automáticamente, edítalo si quieres."
          />
        </section>

        {/* ACTOS AGRUPADOS POR FAMILIA */}
        {decisionesPorFamilia.map(({ familia, items }) => (
          <section key={familia} className="mb-10">
            <div className="flex items-baseline gap-3 mb-4">
              <div
                className="h-px flex-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${FAMILIA_META[familia].accent}60, transparent)`,
                }}
                aria-hidden
              />
              <p
                className="text-[10px] uppercase tracking-[0.22em] font-medium whitespace-nowrap"
                style={{ color: FAMILIA_META[familia].accent }}
              >
                {FAMILIA_META[familia].label}
              </p>
              <div
                className="h-px flex-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${FAMILIA_META[familia].accent}60, transparent)`,
                }}
                aria-hidden
              />
            </div>

            <div className="space-y-4">
              {items.map(d => {
                const key = `${d.tipo}:${d.id}`
                return (
                  <ActoNarrativo
                    key={key}
                    decision={d}
                    narrativaEditada={narrativasEditadas[key]}
                    onNarrativaChange={onNarrativaChange}
                    onApprove={() => onApprove(key)}
                    onRevoke={() => onRevoke(key)}
                    onRemove={() => onRemove(key)}
                  />
                )
              })}
            </div>
          </section>
        ))}

        {/* SELECTOR TESIS */}
        <section className="mb-8 fhr-card p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium mb-4">
            Tesis del plan
          </p>
          <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed">
            ¿Qué propósito tiene este plan frente al directorio? La tesis
            enmarca cómo se presentan las cifras.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(TESIS_META) as Tesis[]).map(id => {
              const meta = TESIS_META[id]
              const Icon = meta.icon
              const selected = tesis === id
              return (
                <button
                  key={id}
                  onClick={() => onTesisChange(id)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selected
                      ? 'bg-slate-800/80 border-transparent text-white'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:border-slate-700'
                  }`}
                  style={
                    selected
                      ? {
                          borderColor: meta.color,
                          boxShadow: `0 0 14px ${meta.color}30`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    <span className="text-sm font-medium">{meta.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-light leading-snug">
                    {meta.descripcion}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* CTAs */}
        <section className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <button
            onClick={onGuardarBorrador}
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar borrador
          </button>

          <button
            onClick={onGenerarBusinessCase}
            disabled={!todasAprobadas}
            className={`inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-lg border transition-all ${
              todasAprobadas
                ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-500/25 to-purple-500/25 text-white hover:border-cyan-300 hover:from-cyan-500/35 hover:to-purple-500/35'
                : 'border-slate-700 bg-slate-800/40 text-slate-500 cursor-not-allowed'
            }`}
            style={
              todasAprobadas
                ? { boxShadow: '0 0 18px rgba(34, 211, 238, 0.3)' }
                : undefined
            }
            title={
              todasAprobadas
                ? 'Todas las decisiones aprobadas — listo para el directorio'
                : `Faltan ${totalDecisiones - aprobadas} de ${totalDecisiones} decisiones por aprobar`
            }
          >
            <Sparkles className="w-4 h-4" />
            Generar Business Case
          </button>
        </section>

        {!todasAprobadas && (
          <p className="text-[11px] text-slate-500 font-light mt-3 text-right">
            El Business Case se habilita cuando todas las decisiones están
            aprobadas.
          </p>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA EJECUTIVA AUTO-GENERADA
// ════════════════════════════════════════════════════════════════════════════

function generarNarrativaEjecutiva(
  decisiones: DecisionItem[],
  porFamilia: Array<{ familia: FamiliaId; items: DecisionItem[] }>,
  resumen: ReturnType<typeof calcularResumenCarrito>,
  tesis: Tesis
): string {
  if (decisiones.length === 0) return ''

  const lentesUnicos = new Set(decisiones.map(d => d.lenteId))
  const N = decisiones.length
  const M = lentesUnicos.size

  const partes: string[] = []

  // Apertura
  partes.push(
    `Este Plan de Eficiencia consolida ${N} decisión${N === 1 ? '' : 'es'} ejecutable${N === 1 ? '' : 's'} sobre ${M} señal${M === 1 ? '' : 'es'} independiente${M === 1 ? '' : 's'} del diagnóstico organizacional.`
  )

  // Por familia
  for (const { familia, items } of porFamilia) {
    const frase = fraseFamilia(familia, items)
    if (frase) partes.push(frase)
  }

  // Cifras
  const payback =
    resumen.paybackMeses === null
      ? 'sin punto de equilibrio definido en el horizonte actual'
      : `con payback en ${resumen.paybackMeses} mes${resumen.paybackMeses === 1 ? '' : 'es'}`
  partes.push(
    `La inversión total es ${formatCLP(resumen.inversion)} contra un ahorro recurrente de ${formatCLP(resumen.ahorroMensual)} mensuales (${formatCLP(resumen.ahorroAnual)} anuales), ${payback}.`
  )

  // Tesis
  partes.push(fraseTesis(tesis))

  return partes.join('\n\n')
}

function fraseFamilia(familia: FamiliaId, items: DecisionItem[]): string {
  const lentes = Array.from(new Set(items.map(i => LENTES_META[i.lenteId]?.titulo))).filter(
    Boolean
  )
  const lista = lentes.join(' y ')
  const n = items.length

  switch (familia) {
    case 'choque_tecnologico':
      return `En el frente tecnológico, el plan interviene en ${lista.toLowerCase()} para capturar capacidad liberable y contener exposición a automatización.`
    case 'grasa_organizacional':
      return `En el frente estructural, actúa sobre ${lista.toLowerCase()} — ${n} ajuste${n === 1 ? '' : 's'} que eliminan duplicación y brecha de rendimiento.`
    case 'riesgo_financiero':
      return `En el frente de talento, blinda lo que no se puede perder y formaliza la transición del ${lista.toLowerCase()} — con costos auditables según legislación laboral.`
    default:
      return ''
  }
}

function fraseTesis(tesis: Tesis): string {
  switch (tesis) {
    case 'eficiencia':
      return 'La tesis es de eficiencia: cada decisión prioriza reducir costo y recuperar capacidad. El retorno financiero es la medida de éxito.'
    case 'crecimiento':
      return 'La tesis es de crecimiento: el ahorro liberado se reinvierte en expandir el negocio. El directorio debe leer la inversión como capital de aceleración, no como recorte.'
    case 'evolucion':
      return 'La tesis es de evolución: el plan rediseña la organización para el próximo ciclo — el ahorro es un efecto secundario, no el objetivo principal.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS BADGE + AUTO SAVE LABEL
// ════════════════════════════════════════════════════════════════════════════

function StatusBadge({
  todasAprobadas,
  aprobadas,
  total,
}: {
  todasAprobadas: boolean
  aprobadas: number
  total: number
}) {
  if (todasAprobadas) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        Plan aprobado · listo para directorio
      </span>
    )
  }
  return (
    <span className="text-slate-400">
      Borrador · {aprobadas}/{total} aprobadas
    </span>
  )
}

function AutoSaveLabel({
  state,
}: {
  state: 'idle' | 'pending' | 'saved'
}) {
  if (state === 'idle') return null
  return (
    <span
      className={`text-[10px] font-light transition-colors ${
        state === 'pending' ? 'text-slate-500' : 'text-emerald-400'
      }`}
    >
      {state === 'pending' ? 'guardando…' : '✓ guardado'}
    </span>
  )
}
