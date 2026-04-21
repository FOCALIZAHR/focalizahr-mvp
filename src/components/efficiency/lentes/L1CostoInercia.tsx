// ════════════════════════════════════════════════════════════════════════════
// L1 — COSTO DE NO DECIDIR (refactorizado con LenteLayout 3 actos)
// src/components/efficiency/lentes/L1CostoInercia.tsx
// ════════════════════════════════════════════════════════════════════════════
// Primer lente migrado al molde maestro LenteLayout. Delgado — la
// orquestación de actos, transiciones y estructura visual vive en
// LenteLayout. Este archivo solo aporta:
//
//   · Cálculo del IPI (perfil de impacto IA) por departamento
//   · Narrativa dinámica reactiva basada en % promedio capturado
//   · Fórmula lineal del slider (idéntica a versión previa)
//   · 3 sub-componentes de slot: HallazgoMapa, ExpedienteLateral,
//     QuirofanoSliders
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Zap, Sparkles, Check } from 'lucide-react'
import { LenteLayout } from './LenteLayout'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import type { DecisionItem } from '@/lib/services/efficiency/EfficiencyCalculator'
/** Normaliza strings crudos de BD ("ANALISTA_RRHH", "OPERACIONES")
 *  a display humano ("Analista RRHH", "Operaciones"). Canónico del
 *  SKILL.md — anti-patrón mostrar UPPERCASE o snake_case tal cual.
 *
 *  Reglas:
 *  · Split por `_`, espacios y paréntesis.
 *  · Siglas (palabras de 2-5 caracteres en mayúsculas) se preservan
 *    tal cual ("TI", "RRHH", "CEO", "HRBP", "PYME").
 *  · Resto se lleva a title case.
 *
 *  Ejemplos:
 *    "TI"             → "TI"
 *    "RRHH"           → "RRHH"
 *    "OPERACIONES"    → "Operaciones"
 *    "ANALISTA_RRHH"  → "Analista RRHH"
 *    "Gerencia de TI" → "Gerencia De TI"
 */
function formatLabel(raw: string): string {
  if (!raw) return ''

  const cleaned = raw
    .trim()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(word => {
      // Sigla: 2-5 caracteres, solo letras mayúsculas (con acentos/ñ)
      const isSigla = /^[A-ZÁÉÍÓÚÜÑ]{2,5}$/.test(word)
      if (isSigla) return word
      const lower = word.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DEL DETALLE (según EfficiencyDataResolver → L1)
// ════════════════════════════════════════════════════════════════════════════

interface PositionInDepartmentCost {
  position: string
  monthlyCost: number
  headcount: number
  avgExposure: number
  avgRoleFit: number | null
}

interface DepartmentCost {
  departmentName: string
  departmentId: string
  monthlyCost: number
  annualCost: number
  headcount: number
  avgExposure: number
  byPosition: PositionInDepartmentCost[]
}

interface PositionInDepartmentFTE {
  position: string
  socCode: string
  liberatedFTEs: number
  headcount: number
  avgRoleFit: number | null
  monthlySavings: number
}

interface DepartmentFTE {
  departmentName: string
  departmentId: string
  liberatedFTEs: number
  monthlySavings: number
  headcount: number
  byPosition: PositionInDepartmentFTE[]
}

interface L1Detalle {
  totalFTEs: number
  totalMonthly: number
  totalAnnual: number
  byDepartment: DepartmentCost[]
  ftesByDepartment: DepartmentFTE[]
}

/** Combinación de los dos byPosition (cost + FTE) para un depto,
 *  unificada por `position` como clave. */
interface PositionBreakdown {
  position: string
  headcount: number          // de cost (consistente con headcount del cargo)
  avgRoleFit: number | null
  monthlyCost: number        // de cost
  liberatedFTEs: number      // de FTE (0 si no hay socCode)
}

type Row = DepartmentCost & {
  liberatedFTEs: number
  ipi: IPI
  breakdown: PositionBreakdown[]
}

// ════════════════════════════════════════════════════════════════════════════
// IPI — Perfil de Impacto IA (heurística por avgExposure)
// ════════════════════════════════════════════════════════════════════════════

type IPI = 'delegacion' | 'asistencia' | 'aprendizaje'

interface IPIMeta {
  id: IPI
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}

const IPI_META: Record<IPI, IPIMeta> = {
  delegacion: {
    id: 'delegacion',
    label: 'Delegación Activa',
    description:
      'La IA ejecuta de principio a fin. Requiere decidir cuándo activarla.',
    color: '#22D3EE',
    icon: Bot,
  },
  asistencia: {
    id: 'asistencia',
    label: 'Asistencia Productiva',
    description:
      'La IA copilotea. Liberar esta capacidad es cambiar procesos, no eliminar cargos.',
    color: '#A78BFA',
    icon: Zap,
  },
  aprendizaje: {
    id: 'aprendizaje',
    label: 'Aprendizaje Acelerado',
    description:
      'La IA mejora con los datos de la empresa. Cada mes de espera es conocimiento que no se acumula.',
    color: '#F59E0B',
    icon: Sparkles,
  },
}

function inferIPI(avgExposure: number): IPI {
  if (avgExposure >= 0.5) return 'delegacion'
  if (avgExposure >= 0.3) return 'asistencia'
  return 'aprendizaje'
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA MACRO — promedio general de captura (todos los sliders)
// ════════════════════════════════════════════════════════════════════════════

function narrativaDinamica(avgPct: number): string {
  if (avgPct === 0) return 'Sin captura. El capital sigue atrapado.'
  if (avgPct <= 20) return 'Captura conservadora. Mínima fricción, menor retorno.'
  if (avgPct <= 50)
    return 'Adopción balanceada. Progreso visible con riesgo moderado.'
  if (avgPct <= 80)
    return 'Captura decidida. Impacto financiero significativo.'
  return 'Migración agresiva hacia IA. Máxima eficiencia, máximo impacto organizacional.'
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA MICRO — por slider, contextualizada al IPI del área
// Tono McKinsey: directo, consecuencia no instrucción (P12).
// ════════════════════════════════════════════════════════════════════════════

function narrativaIPIporSlider(ipi: IPI, pct: number): string {
  if (pct === 0) return ''

  if (ipi === 'delegacion') {
    if (pct <= 30)
      return 'La IA ya ejecuta estas tareas. A este nivel solo activás una parte de lo que ya está disponible.'
    if (pct <= 70)
      return 'Activación directa: la IA ejecuta autónomamente. Decisión de cuándo, no de cómo.'
    return 'Captura máxima en tareas donde la IA ya opera sola. Sin fricción humana — la capacidad está allí esperando ser liberada.'
  }

  if (ipi === 'asistencia') {
    if (pct <= 30)
      return 'La IA copilotea. A este nivel, pocos flujos cambian — adopción voluntaria basta.'
    if (pct <= 70)
      return 'Las personas del área necesitan operar con IA. Capacitación es prerequisito, no opcional.'
    return 'Captura alta en modo asistencia: el cambio es cultural y de procesos. Capacitación es el cuello de botella real, no la tecnología.'
  }

  // aprendizaje
  if (pct <= 30)
    return 'Exposición baja. La IA acompaña tareas, todavía no las ejecuta sola.'
  if (pct <= 70)
    return 'Exposición baja. Capturar más depende de madurez tecnológica futura, no de activación hoy.'
  return 'Exposición baja con captura forzada. Los datos no sustentan este nivel — revisar si el supuesto es realista.'
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const L1_ACCENT = '#22D3EE' // capital_en_riesgo

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L1CostoInercia({
  lente,
  onUpsert,
  onRemove,
  onNextLente,
  proximoLenteTitulo,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as L1Detalle | null
  const [captureByDept, setCaptureByDept] = useState<Record<string, number>>({})

  // Cross-merge byDepartment + ftesByDepartment + inferencia IPI +
  // breakdown por cargo (unifica byPosition de cost con byPosition de FTE).
  const rows: Row[] = useMemo(() => {
    if (!detalle) return []
    const fteMap = new Map(
      detalle.ftesByDepartment.map(f => [f.departmentId, f])
    )

    return detalle.byDepartment
      .map(d => {
        const fte = fteMap.get(d.departmentId)
        // FTE por position dentro de este depto, indexado por nombre
        const ftePositionMap = new Map(
          (fte?.byPosition ?? []).map(p => [p.position, p])
        )
        // Merge: iteramos sobre byPosition de cost (fuente canónica de
        // monthlyCost y headcount); el FTE se suma si hay match por name.
        const breakdown: PositionBreakdown[] = d.byPosition
          .map(p => ({
            position: p.position,
            headcount: p.headcount,
            avgRoleFit: p.avgRoleFit,
            monthlyCost: p.monthlyCost,
            liberatedFTEs: ftePositionMap.get(p.position)?.liberatedFTEs ?? 0,
          }))
          .sort((a, b) => b.monthlyCost - a.monthlyCost)

        return {
          ...d,
          liberatedFTEs: fte?.liberatedFTEs ?? 0,
          ipi: inferIPI(d.avgExposure),
          breakdown,
        }
      })
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
  }, [detalle])

  // Empty state: sin data, usa LenteCard legacy para estado vacío consistente
  if (!lente.hayData || !detalle || rows.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
  }

  // Handler del slider — fórmula lineal pura (sin cambios)
  const handleSliderChange = (dept: Row, pct: number) => {
    const pctClamped = Math.max(0, Math.min(100, pct))
    setCaptureByDept(prev => ({ ...prev, [dept.departmentId]: pctClamped }))

    if (pctClamped === 0) {
      onRemove(`area:${dept.departmentId}`)
      return
    }
    const factor = pctClamped / 100
    const item: DecisionItem = {
      id: dept.departmentId,
      lenteId: 'l1_inercia',
      tipo: 'area',
      nombre: dept.departmentName,
      gerencia: dept.departmentName,
      ahorroMes: Math.round(dept.monthlyCost * factor),
      finiquito: 0,
      fteEquivalente: Math.round(dept.liberatedFTEs * factor * 10) / 10,
      narrativa: lente.narrativa,
      aprobado: false,
    }
    onUpsert(item)
  }

  // ─── Derivados reactivos para el LenteLayout ────────────────────────────
  const hasInteraction = Object.values(captureByDept).some(v => v > 0)
  const avgPct =
    rows.length > 0
      ? rows.reduce((s, r) => s + (captureByDept[r.departmentId] ?? 0), 0) /
        rows.length
      : 0
  const capitalRecuperado = rows.reduce(
    (s, r) =>
      s + r.monthlyCost * ((captureByDept[r.departmentId] ?? 0) / 100),
    0
  )
  const ftesLiberados = rows.reduce(
    (s, r) =>
      s + r.liberatedFTEs * ((captureByDept[r.departmentId] ?? 0) / 100),
    0
  )

  // Resumen del checkpoint — áreas activas (pct > 0) con su % y ahorro proyectado
  const checkpointSummary = hasInteraction
    ? {
        items: rows
          .filter(r => (captureByDept[r.departmentId] ?? 0) > 0)
          .map(r => {
            const pct = captureByDept[r.departmentId]
            const ahorro = Math.round(r.monthlyCost * (pct / 100))
            return {
              label: formatLabel(r.departmentName),
              detail: `${pct}%`,
              value: `${formatCLP(ahorro)}/mes`,
            }
          }),
        totalLabel: (() => {
          const n = Object.values(captureByDept).filter(v => v > 0).length
          return `${n} ${n === 1 ? 'área' : 'áreas'} en tu plan`
        })(),
        totalValue: `${formatCLP(Math.round(capitalRecuperado))}/mes`,
      }
    : undefined

  return (
    <LenteLayout
      familiaAccent={L1_ACCENT}
      heroValue={formatCLP(detalle.totalMonthly)}
      heroUnit={`atrapados / mes · ${detalle.totalFTEs.toFixed(1)} FTE equivalentes`}
      narrativaPuente="Cada mes que este capital sigue atrapado, la organización financia trabajo que la IA ya resuelve. El simulador modela cuánta capacidad puedes liberar este trimestre."
      ctaQuirofanoEyebrow="SIMULACIÓN DE CAPTURA"
      narrativaDinamica={narrativaDinamica(avgPct)}
      hasInteraction={hasInteraction}
      checkpointSummary={checkpointSummary}
      onNextLente={onNextLente}
      proximoLenteTitulo={proximoLenteTitulo}
      onActChange={onActChange}
      totalizador={{
        metricas: [
          {
            label: 'Capital recuperado',
            value: `${formatCLP(capitalRecuperado)}/mes`,
            tint: 'emerald',
          },
          {
            label: 'FTEs liberados',
            value: ftesLiberados.toFixed(1),
            tint: 'accent',
          },
        ],
      }}
      renderHallazgo={() => <HallazgoMapa rows={rows} />}
      renderExpediente={() => <ExpedienteLateral detalle={detalle} />}
      renderQuirofano={() => (
        <QuirofanoSliders
          rows={rows}
          captureByDept={captureByDept}
          onChange={handleSliderChange}
        />
      )}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HALLAZGO — mapa por área con perfil IA protagónico (no badge secundario)
// ════════════════════════════════════════════════════════════════════════════

// Narrativa extendida por IPI — descubrimiento, no descripción técnica.
// La `IPI_META.description` se mantiene para el Acto Quirófano/tooltips
// donde el espacio es limitado.
const IPI_NARRATIVA_HALLAZGO: Record<IPI, string> = {
  delegacion:
    'La IA ejecuta estas tareas de principio a fin. Tu única decisión es cuándo activarla — binaria: sí o no. Cero reentrenamiento humano.',
  asistencia:
    'La IA copilotea, no reemplaza. Las personas del área deben aprender a operar con IA. El límite de captura es la capacitación, no la tecnología.',
  aprendizaje:
    'La IA todavía no ejecuta estas tareas sola — las acompaña. Cada mes de uso la entrena con los datos de tu empresa. Activación temprana acumula ventaja.',
}

function HallazgoMapa({ rows }: { rows: Row[] }) {
  const patronesUnicos = new Set(rows.map(r => r.ipi)).size
  const countLabel =
    patronesUnicos === 1
      ? 'un patrón claro'
      : patronesUnicos === 2
      ? 'dos patrones distintos'
      : `${patronesUnicos} patrones distintos`

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-400 font-medium mb-2">
        EL MAPA
      </p>
      <h3 className="text-xl md:text-2xl font-light text-white mb-4 leading-tight">
        Por área, cómo actúa la IA
      </h3>

      {/* Narrativa contextual estilo Apple: el plato, no la receta. */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl mb-8">
        Cruzamos cada cargo de tu nómina con la capacidad real de la IA hoy.
        Encontramos {countLabel} en tu organización.
      </p>

      {/* Cards como descubrimientos protagonistas — más espacio, jerarquía
          interna clara, narrativa específica por IPI. */}
      <div className="space-y-4">
        {rows.map(r => {
          const ipi = IPI_META[r.ipi]
          const Icon = ipi.icon
          const narrativa = IPI_NARRATIVA_HALLAZGO[r.ipi]
          return (
            <div
              key={r.departmentId}
              className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30 transition-colors hover:border-slate-600/50"
              style={{
                // Halo accent sutil del IPI — da identidad al card sin border pesado
                boxShadow: `inset 3px 0 0 ${ipi.color}`,
              }}
            >
              {/* Header: badge IPI grande (protagonista del descubrimiento) */}
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    color: ipi.color,
                    backgroundColor: `${ipi.color}15`,
                    border: `1px solid ${ipi.color}40`,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.18em] font-semibold leading-tight"
                    style={{ color: ipi.color }}
                  >
                    {ipi.label}
                  </p>
                  <p className="text-lg font-light text-white leading-tight mt-0.5">
                    {formatLabel(r.departmentName)}
                  </p>
                </div>
              </div>

              {/* Narrativa del descubrimiento — más robusta que antes */}
              <p className="text-sm text-slate-300 font-light leading-relaxed max-w-xl mb-4">
                {narrativa}
              </p>

              {/* Métricas inline — contexto secundario */}
              <div className="flex items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-light flex-wrap">
                <span>
                  Costo atrapado{' '}
                  <span className="text-white font-medium tabular-nums">
                    {formatCLP(r.monthlyCost)}
                  </span>
                  /mes
                </span>
                <span>
                  FTEs liberables{' '}
                  <span className="text-cyan-300 font-medium tabular-nums">
                    {r.liberatedFTEs.toFixed(1)}
                  </span>
                </span>
                <span className="text-slate-500">
                  Exposición{' '}
                  <span className="text-slate-300 tabular-nums">
                    {Math.round(r.avgExposure * 100)}%
                  </span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPEDIENTE LATERAL — stats del lente (columna 30%)
// ════════════════════════════════════════════════════════════════════════════

function ExpedienteLateral({ detalle }: { detalle: L1Detalle }) {
  return (
    <aside className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-5 space-y-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">
        EL EXPEDIENTE
      </p>

      {/* Operacional primero — lo que el CEO puede accionar */}
      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {detalle.totalFTEs.toFixed(1)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          FTE liberables
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {detalle.byDepartment.length}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Áreas con señal
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      {/* Dato de referencia — el CEO ya vio esta cifra varias veces.
          Baja tipografía (text-base text-slate-400) para que no compita
          con el CarritoBar que ya lleva la contabilidad financiera. */}
      <div>
        <p className="text-base font-light text-slate-400 tabular-nums leading-tight">
          {formatCLP(detalle.totalAnnual)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Costo si no actúas · al año
        </p>
      </div>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// QUIRÓFANO — grid de sliders por área
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoSlidersProps {
  rows: Row[]
  captureByDept: Record<string, number>
  onChange: (row: Row, pct: number) => void
}

function QuirofanoSliders({ rows, captureByDept, onChange }: QuirofanoSlidersProps) {
  return (
    <>
      <p className="text-xs md:text-sm text-slate-400 font-light mb-6 leading-relaxed max-w-2xl">
        Mueve el slider para proyectar cuánta capacidad liberable vas a
        capturar este trimestre. El totalizador y la narrativa se actualizan
        en vivo con cada movimiento.
      </p>

      <div className="space-y-6">
        {rows.map(r => {
          const pct = captureByDept[r.departmentId] ?? 0
          const ipi = IPI_META[r.ipi]
          const ahorroProyectado = Math.round(r.monthlyCost * (pct / 100))
          const narrativaMicro = narrativaIPIporSlider(r.ipi, pct)

          return (
            <div key={r.departmentId}>
              <div className="flex items-baseline justify-between mb-2 gap-2 flex-wrap">
                <span className="text-sm text-slate-200 font-light">
                  {formatLabel(r.departmentName)}
                </span>
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{ color: ipi.color }}
                >
                  {pct}%{' '}
                  <span className="text-slate-600">·</span>{' '}
                  <span className="text-emerald-300">
                    {formatCLP(ahorroProyectado)}/mes
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={pct}
                onChange={e => onChange(r, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800"
                style={{
                  background: `linear-gradient(to right, ${ipi.color} 0%, ${ipi.color} ${pct}%, rgb(30 41 59) ${pct}%, rgb(30 41 59) 100%)`,
                }}
                aria-label={`Captura en ${r.departmentName}`}
              />

              {/* Narrativa micro contextualizada al IPI — capa inferior
                  al promedio global. Fade on change cuando cambia el rango. */}
              <AnimatePresence mode="wait">
                {narrativaMicro && (
                  <motion.p
                    key={narrativaMicro}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] font-light text-slate-500 italic leading-snug mt-2 max-w-xl"
                  >
                    {narrativaMicro}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Progressive disclosure — desglose por cargo cuando pct > 0.
                  Convierte FTEs abstractos en personas reales con roleFit
                  conocido. El CEO decide sobre gente que rinde bien en
                  cargos que la IA transforma (P7 del manifiesto). */}
              <AnimatePresence>
                {pct > 0 && r.breakdown.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-slate-800/40 space-y-1.5">
                      {/* Feedback inline — confirma registro en el plan
                          sin esperar al checkpoint. Sutil, slate-500. */}
                      <div className="flex items-center gap-1.5 text-[10px] font-light text-slate-500 mb-2">
                        <Check className="w-3 h-3 text-emerald-500/70" />
                        <span>Decisión registrada en tu plan</span>
                      </div>
                      {r.breakdown.map(pos => {
                        const ftesProj = pos.liberatedFTEs * (pct / 100)
                        const ahorroProj = pos.monthlyCost * (pct / 100)
                        return (
                          <div
                            key={pos.position}
                            className="flex items-baseline justify-between gap-3 text-[11px] font-light text-slate-400 flex-wrap"
                          >
                            <span className="text-slate-300 truncate max-w-[40%]">
                              {formatLabel(pos.position)}
                            </span>
                            <span className="flex items-baseline gap-3 tabular-nums text-[11px]">
                              <span>
                                {pos.headcount}{' '}
                                <span className="text-slate-600">
                                  {pos.headcount === 1 ? 'pers' : 'pers'}
                                </span>
                              </span>
                              {pos.avgRoleFit !== null && (
                                <span>
                                  RoleFit{' '}
                                  <span className="text-slate-300">
                                    {Math.round(pos.avgRoleFit)}%
                                  </span>
                                </span>
                              )}
                              <span>
                                <span className="text-cyan-300">
                                  {ftesProj.toFixed(1)}
                                </span>{' '}
                                <span className="text-slate-600">FTE</span>
                              </span>
                              <span className="text-emerald-300">
                                {formatCLP(Math.round(ahorroProj))}
                              </span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </>
  )
}
