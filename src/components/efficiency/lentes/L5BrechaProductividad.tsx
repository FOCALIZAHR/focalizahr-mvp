// ════════════════════════════════════════════════════════════════════════════
// L5 — BRECHA DE PRODUCTIVIDAD (migrado a LenteLayout — 4 actos)
// src/components/efficiency/lentes/L5BrechaProductividad.tsx
// ════════════════════════════════════════════════════════════════════════════
// Lente PERSONA-POR-PERSONA para definir el destino de quienes están bajo
// umbral de retención (score<40). El término "prescindible" NO se expone al
// CEO — estas personas están en una situación que requiere definición
// (Manifiesto P7).
//
// Patrón UI: Cinema Mode dentro del Acto Quirófano (clonado de L9):
//   + Rail (240px) de top-15 por retentionScore asc (peor primero)
//   + Spotlight con ficha rica + sub-actos lectura → decisión.
//
// Acto Hallazgo: cards de concentración del gap por familia (bySegment),
// NO scatter — el mensaje es "el gap se concentra aquí", no distribución.
//
// Radiografía PROTAGONISTA: 3 ScoreBars grandes (Metas ×0.4, Dominio del
// cargo ×0.3, Adaptabilidad ×0.3) para que el CEO vea POR QUÉ el score es
// bajo — si metas es 95% pero dominio 20%, la decisión cambia.
//
// Alerta de contexto condicional: cruza evaluatorStatus (pre-calculado en
// el resolver via getCalibrationStatsByDepartment) × metasCompliance para
// detectar "asfixia de talento" (SEVERA+metas>80) o "señales convergen"
// (SEVERA+metas<50) o "score real podría ser peor" (INDULGENTE+metas<50).
//
// Matemática carrito (idéntica a L9):
//   ahorroMes = salary (recurrente post-decisión)
//   finiquito = calculado según timing elegido
//   fteEquivalente = 1
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Hourglass, Circle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { LenteLayout } from './LenteLayout'
import { LenteCard } from './LenteCard'
import { TooltipContext } from '@/components/ui/TooltipContext'
import { useToast } from '@/components/ui/toast-system'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import {
  calculateFiniquitoConTopeCustomUF,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'
import { formatDisplayName, getInitials } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE FORMATO
// ════════════════════════════════════════════════════════════════════════════

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
      const isSigla = /^[A-ZÁÉÍÓÚÜÑ]{2,5}$/.test(word)
      if (isSigla) return word
      const lower = word.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function formatTenure(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0) return `${y}y`
  return `${y}y ${m}m`
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS (coinciden con EfficiencyDataResolver case 'l5_brecha')
// ════════════════════════════════════════════════════════════════════════════

type EvaluatorStatus = 'OPTIMA' | 'SEVERA' | 'CENTRAL' | 'INDULGENTE'

interface TalentNarrativeBrief {
  headline: string
  context: string
}

interface PersonL5 {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  roleFitScore: number
  metasCompliance: number | null
  potentialAbility: number | null
  salary: number
  tenureMonths: number
  finiquitoToday: number | null
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  managerId: string | null
  acotadoGroup: string | null
  standardCategory: string | null
  // Enriquecimiento L5 (pre-calculado en el resolver)
  evaluatorStatus: EvaluatorStatus | null
  talentNarrative: TalentNarrativeBrief | null
}

interface SegmentGap {
  key: string
  acotadoGroup: string | null
  standardCategory: string | null
  total: number
  count: number
}

interface L5Detalle {
  persons: PersonL5[]
  affectedCount: number
  total: number
  gapOriginal?: number
  bySegment?: SegmentGap[]
}

type Timing = 'hoy' | 'q1' | 'q2'

interface TimingMeta {
  label: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const TIMING_META: Record<Timing, TimingMeta> = {
  hoy: { label: 'Actuar hoy',   description: 'Costo cierto, sin saltos pendientes.', icon: Calendar },
  q1:  { label: 'En 3 meses',   description: 'Mantener en nómina ese período.',      icon: Clock },
  q2:  { label: 'En 6 meses',   description: 'Postergar medio año la definición.',   icon: Hourglass },
}

const TIMING_MESES: Record<Timing, number> = { hoy: 0, q1: 3, q2: 6 }

/** Accent F2 Ruta de Ejecución — purple del sistema. */
const L5_ACCENT = '#A78BFA'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE CÁLCULO
// ════════════════════════════════════════════════════════════════════════════

function calcularFiniquitoTiming(p: PersonL5, meses: number): number {
  if (meses === 0) {
    return (
      p.finiquitoToday ??
      calculateFiniquitoConTopeCustomUF(p.salary, p.tenureMonths, UF_VALUE_CLP)
    )
  }
  return calculateFiniquitoConTopeCustomUF(
    p.salary,
    p.tenureMonths + meses,
    UF_VALUE_CLP
  )
}

/** Adaptabilidad: potentialAbility 1-3 → 33 / 66 / 99 (pct base 100). */
function adaptabilidadPct(p: PersonL5): number {
  if (p.potentialAbility === null) return 0
  return Math.round(p.potentialAbility * 33.33)
}

function adaptabilidadLabel(p: PersonL5): string {
  if (p.potentialAbility === null) return 'Sin dato'
  if (p.potentialAbility <= 1) return 'Baja'
  if (p.potentialAbility >= 3) return 'Alta'
  return 'Media'
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS
// ════════════════════════════════════════════════════════════════════════════

function narrativaTiming(timing: Timing, first: string): string {
  switch (timing) {
    case 'hoy':
      return `Actuar hoy fija el costo. Lo que ves es lo que pagas.`
    case 'q1':
      return `Mantener a ${first} 3 meses más. El finiquito puede crecer si cruza un aniversario en ese lapso.`
    case 'q2':
      return `Postergar 6 meses. ${first} sigue en nómina ese período y el finiquito sube con la antigüedad.`
  }
}

function consecuenciaTiming(
  timing: Timing,
  salary: number,
  finiquito: number,
  finiquitoHoy: number
): string {
  const delta = finiquito - finiquitoHoy
  switch (timing) {
    case 'hoy':
      return `Finiquito ${formatCLP(finiquito)} · Ahorro ${formatCLP(salary)}/mes inmediato`
    case 'q1':
      return `Finiquito en 3m: ${formatCLP(finiquito)}${delta > 0 ? ` (+${formatCLP(delta)})` : ''} · Sigue en nómina ese período`
    case 'q2':
      return `Finiquito en 6m: ${formatCLP(finiquito)}${delta > 0 ? ` (+${formatCLP(delta)})` : ''} · Sigue en nómina ese período`
  }
}

function narrativaDinamica(total: number, tomadas: number): string {
  if (tomadas === 0)
    return `${total} ${total === 1 ? 'persona bajo umbral' : 'personas bajo umbral'}, cada una pide una definición distinta.`
  if (tomadas < total)
    return `${tomadas} de ${total} decisiones tomadas. Las pendientes esperan tu criterio.`
  return `${total} decisiones tomadas. Lo siguiente es ejecutar con RRHH.`
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L5BrechaProductividad({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
  onNextLente,
  proximoLenteTitulo,
  gerenciasExcluidas,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as L5Detalle | null
  const toast = useToast()

  const [personaActivaId, setPersonaActivaId] = useState<string | null>(null)
  const [timingByPerson, setTimingByPerson] = useState<Record<string, Timing | null>>({})

  // Hidrata desde el carrito (convención sufijo · timing)
  useEffect(() => {
    const inicial: Record<string, Timing | null> = {}
    for (const d of decisionesActuales) {
      const match = d.nombre.match(/· (hoy|q1|q2)$/)
      if (match) inicial[d.id] = match[1] as Timing
    }
    setTimingByPerson(prev => (Object.keys(prev).length === 0 ? inicial : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Personas a mostrar en el Quirófano: ordenadas por retentionScore asc
  // (peor primero). Top-15 — organizaciones con más casos verán los más
  // urgentes; el Acto Expediente ya muestra la concentración total por
  // familia, no hay pérdida de información.
  const personsSorted = useMemo(() => {
    if (!detalle?.persons) return []
    return [...detalle.persons]
      .filter(p => !gerenciasExcluidas.has(p.departmentName))
      .sort((a, b) => a.retentionScore - b.retentionScore)
      .slice(0, 15)
  }, [detalle, gerenciasExcluidas])

  // Persona activa default = primera de la lista. Reasignar si ya no existe.
  useEffect(() => {
    if (personsSorted.length === 0) {
      if (personaActivaId !== null) setPersonaActivaId(null)
      return
    }
    const stillValid = personsSorted.some(p => p.employeeId === personaActivaId)
    if (!stillValid) setPersonaActivaId(personsSorted[0].employeeId)
  }, [personsSorted, personaActivaId])

  // Edge: sin data o sin personas → vacío (si no hay bajo umbral, no hay lente)
  if (!lente.hayData || !detalle || personsSorted.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
  }

  const handleTiming = (p: PersonL5, timing: Timing) => {
    const current = timingByPerson[p.employeeId]
    const isToggleOff = current === timing
    const displayName = formatDisplayName(p.employeeName)

    setTimingByPerson(prev => ({
      ...prev,
      [p.employeeId]: isToggleOff ? null : timing,
    }))

    if (isToggleOff) {
      onRemove(decisionKey({ tipo: 'persona', id: p.employeeId }))
      toast.info(`${displayName} salió del plan`, 'Decisión removida')
      return
    }

    const meses = TIMING_MESES[timing]
    const finiquitoTiming = calcularFiniquitoTiming(p, meses)

    // Matemática L5 (idéntica a L9): TODOS los timings generan ahorro +
    // finiquito + FTE. Solo cambia el monto. ahorroMes es recurrente.
    const item: DecisionItem = {
      id: p.employeeId,
      lenteId: 'l5_brecha',
      tipo: 'persona',
      nombre: `${p.employeeName} · ${timing}`,
      gerencia: p.departmentName,
      ahorroMes: p.salary,
      finiquito: finiquitoTiming,
      fteEquivalente: 1,
      narrativa: `${lente.narrativa}\n\nTiming: ${TIMING_META[timing].label}. Finiquito ${formatCLP(finiquitoTiming)}.`,
      aprobado: false,
    }
    onUpsert(item)
    toast.success(
      `${displayName} → ${TIMING_META[timing].label} · Finiquito ${formatCLP(finiquitoTiming)}`,
      'Decisión registrada'
    )
  }

  // ─── Derivados reactivos ────────────────────────────────────────────────
  const tomadas = Object.values(timingByPerson).filter(v => v !== null).length
  const hasInteraction = tomadas > 0

  const inversionTotal = personsSorted.reduce((s, p) => {
    const t = timingByPerson[p.employeeId]
    if (!t) return s
    return s + calcularFiniquitoTiming(p, TIMING_MESES[t])
  }, 0)

  const ahorroMensualTotal = personsSorted.reduce((s, p) => {
    const t = timingByPerson[p.employeeId]
    return t ? s + p.salary : s
  }, 0)

  const paybackMeses =
    ahorroMensualTotal > 0 ? Math.ceil(inversionTotal / ahorroMensualTotal) : null

  const checkpointSummary = hasInteraction
    ? {
        items: personsSorted
          .filter((p): p is PersonL5 => {
            const t = timingByPerson[p.employeeId]
            return t === 'hoy' || t === 'q1' || t === 'q2'
          })
          .map(p => {
            const t = timingByPerson[p.employeeId]!
            const finiq = calcularFiniquitoTiming(p, TIMING_MESES[t])
            return {
              label: `${formatDisplayName(p.employeeName)} · ${formatLabel(p.position)}`,
              detail: TIMING_META[t].label,
              value: formatCLP(finiq),
            }
          }),
        totalLabel: `${tomadas} ${tomadas === 1 ? 'decisión' : 'decisiones'} en tu plan`,
        totalValue: `Inversión ${formatCLP(inversionTotal)}`,
      }
    : undefined

  const personaActiva = personaActivaId
    ? personsSorted.find(p => p.employeeId === personaActivaId) ?? null
    : null

  const N = detalle.affectedCount
  const heroUnit = `salario mensual sin rendimiento equivalente · ${N} ${N === 1 ? 'persona bajo umbral' : 'personas bajo umbral'}`

  return (
    <LenteLayout
      familiaAccent={L5_ACCENT}
      heroValue={formatCLP(detalle.total)}
      heroUnit={heroUnit}
      narrativaPuente="Cada persona bajo umbral tiene su propia historia. El score agregado no distingue entre quien no cumple metas, quien no encaja con su cargo, y quien está siendo evaluado con dureza. Ver caso por caso permite separar la decisión de fondo de la apariencia del dato."
      ctaSimularLabel="Ver casos"
      ctaQuirofanoEyebrow="EXPEDIENTE DE DEFINICIÓN"
      hasInteraction={hasInteraction}
      checkpointSummary={checkpointSummary}
      onNextLente={onNextLente}
      proximoLenteTitulo={proximoLenteTitulo}
      onActChange={onActChange}
      totalizador={{
        metricas: [
          {
            label: 'Personas decididas',
            value: `${tomadas} / ${personsSorted.length}`,
            tint: 'accent',
          },
          {
            label: 'Inversión finiquitos',
            value: formatCLP(inversionTotal),
            tint: 'warning',
          },
          {
            label: 'Ahorro mensual',
            value: `${formatCLP(ahorroMensualTotal)}/mes`,
            tint: 'emerald',
          },
          {
            label: 'Payback',
            value: paybackMeses !== null ? `${paybackMeses}m` : '—',
          },
        ],
      }}
      renderHallazgo={() => (
        <HallazgoFamilias bySegment={detalle.bySegment ?? []} total={detalle.total} />
      )}
      renderExpediente={() => <ExpedienteLateral detalle={detalle} />}
      renderQuirofano={() => (
        <>
          <NarrativaContextoArriba
            mensaje={narrativaDinamica(personsSorted.length, tomadas)}
          />
          <QuirofanoSplit
            rows={personsSorted}
            personaActiva={personaActiva}
            onSelectPersona={setPersonaActivaId}
            timings={timingByPerson}
            onTiming={handleTiming}
          />
        </>
      )}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA CONTEXTO ARRIBA — reactiva al avance del quirófano
// ════════════════════════════════════════════════════════════════════════════

function NarrativaContextoArriba({ mensaje }: { mensaje: string }) {
  return (
    <div className="mb-6 pb-6 border-b border-slate-800/40">
      <AnimatePresence mode="wait">
        <motion.p
          key={mensaje}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-sm md:text-base font-light text-slate-300 italic leading-relaxed max-w-3xl"
        >
          {mensaje}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — HALLAZGO: concentración del gap por familia (top-4 bySegment)
// ════════════════════════════════════════════════════════════════════════════

function HallazgoFamilias({
  bySegment,
  total,
}: {
  bySegment: SegmentGap[]
  total: number
}) {
  const topFamilias = useMemo(() => {
    return [...bySegment]
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
  }, [bySegment])

  if (topFamilias.length === 0) {
    return (
      <div className="rounded-[20px] border border-slate-800/40 bg-[#0F172A]/90 backdrop-blur-2xl p-6">
        <p className="text-sm font-light text-slate-300 leading-relaxed">
          El gap se distribuye de forma uniforme en la organización. No hay
          familia de cargos concentrando el problema.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] font-medium mb-4" style={{ color: L5_ACCENT }}>
        DÓNDE SE CONCENTRA EL GAP
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {topFamilias.map(fam => {
          const pct = total > 0 ? Math.round((fam.total / total) * 100) : 0
          return (
            <div
              key={fam.key}
              className="rounded-[20px] border border-slate-800/40 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6"
            >
              <p className="text-xs text-slate-400 font-light leading-snug">
                {fam.key}
              </p>
              <div className="flex items-baseline gap-3 mt-3">
                <p className="text-2xl md:text-3xl font-extralight text-white tabular-nums leading-none">
                  {formatCLP(fam.total)}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  /mes
                </p>
              </div>
              <p className="text-xs text-slate-500 font-light mt-2 tabular-nums">
                {fam.count} {fam.count === 1 ? 'persona' : 'personas'} · {pct}% del gap
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPEDIENTE LATERAL — 4 stats canónicos
// ════════════════════════════════════════════════════════════════════════════

function ExpedienteLateral({ detalle }: { detalle: L5Detalle }) {
  const anual = detalle.total * 12
  const gapOrig = detalle.gapOriginal ?? 0
  const segmentos = detalle.bySegment?.length ?? 0

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
          EXPEDIENTE
        </p>
      </div>
      <StatRow label="Personas bajo umbral" value={String(detalle.affectedCount)} />
      <StatRow label="Mensual" value={formatCLP(detalle.total)} />
      <StatRow label="Anualizado" value={formatCLP(anual)} tint="warning" />
      <StatRow
        label="Familias afectadas"
        value={String(segmentos)}
        hint={gapOrig > 0 ? `Gap ajustado por rendimiento: ${formatCLP(gapOrig)}/mes` : undefined}
      />
    </div>
  )
}

function StatRow({
  label,
  value,
  tint,
  hint,
}: {
  label: string
  value: string
  tint?: 'warning'
  hint?: string
}) {
  const valueClass =
    tint === 'warning'
      ? 'text-amber-300 font-extralight tabular-nums'
      : 'text-white font-extralight tabular-nums'
  return (
    <div className="pb-3 border-b border-slate-800/40 last:border-b-0">
      <p className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`text-xl md:text-2xl ${valueClass} leading-tight mt-1`}>
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-slate-500 font-light mt-1 leading-snug">
          {hint}
        </p>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// QUIROFANO SPLIT — Rail + Spotlight (patrón L9)
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoSplitProps {
  rows: PersonL5[]
  personaActiva: PersonL5 | null
  onSelectPersona: (id: string) => void
  timings: Record<string, Timing | null>
  onTiming: (p: PersonL5, t: Timing) => void
}

function QuirofanoSplit({
  rows,
  personaActiva,
  onSelectPersona,
  timings,
  onTiming,
}: QuirofanoSplitProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8">
      <RailPersonas
        rows={rows}
        activeId={personaActiva?.employeeId ?? null}
        onSelect={onSelectPersona}
        timings={timings}
      />
      {personaActiva && (
        <FichaRica
          persona={personaActiva}
          timing={timings[personaActiva.employeeId] ?? null}
          onChoose={t => onTiming(personaActiva, t)}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RAIL — top-15 por retentionScore asc (peor primero)
// ════════════════════════════════════════════════════════════════════════════

interface RailPersonasProps {
  rows: PersonL5[]
  activeId: string | null
  onSelect: (id: string) => void
  timings: Record<string, Timing | null>
}

function RailPersonas({ rows, activeId, onSelect, timings }: RailPersonasProps) {
  return (
    <nav
      aria-label="Lista de personas"
      className="flex md:block overflow-x-auto md:overflow-x-visible md:max-h-[640px] md:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0"
    >
      {rows.map(p => {
        const isActive = p.employeeId === activeId
        const timing = timings[p.employeeId]
        return (
          <button
            key={p.employeeId}
            onClick={() => onSelect(p.employeeId)}
            className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors text-left min-w-[200px] md:min-w-0 ${
              isActive ? 'bg-slate-800/50' : 'bg-transparent hover:bg-slate-800/30'
            }`}
            style={
              isActive
                ? {
                    borderColor: `${L5_ACCENT}80`,
                    boxShadow: `inset 3px 0 0 ${L5_ACCENT}`,
                  }
                : { borderColor: 'rgba(51, 65, 85, 0.4)' }
            }
          >
            <Avatar name={p.employeeName} size={28} accent={L5_ACCENT} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {formatDisplayName(p.employeeName)}
              </p>
              <p className="text-[10px] font-light text-slate-500 truncate">
                {formatLabel(p.position)}
              </p>
            </div>
            {timing && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: L5_ACCENT }}
                aria-label={`Timing: ${TIMING_META[timing].label}`}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FICHA RICA — sub-actos lectura → decisión (patrón L9)
// ════════════════════════════════════════════════════════════════════════════

interface FichaRicaProps {
  persona: PersonL5
  timing: Timing | null
  onChoose: (t: Timing) => void
}

function FichaRica({ persona, timing, onChoose }: FichaRicaProps) {
  const [vista, setVista] = useState<'lectura' | 'decision'>('lectura')

  useEffect(() => {
    setVista('lectura')
  }, [persona.employeeId])

  return (
    <div className="min-w-0">
      <AnimatePresence mode="wait">
        {vista === 'lectura' ? (
          <FichaLectura
            key={`lectura-${persona.employeeId}`}
            persona={persona}
            timing={timing}
            onSimular={() => setVista('decision')}
          />
        ) : (
          <FichaDecision
            key={`decision-${persona.employeeId}`}
            persona={persona}
            timing={timing}
            onChoose={onChoose}
            onVolver={() => setVista('lectura')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── MOMENTO 1 — LECTURA ─────────────────────────────────────────────────────

function FichaLectura({
  persona,
  timing,
  onSimular,
}: {
  persona: PersonL5
  timing: Timing | null
  onSimular: () => void
}) {
  const first =
    formatDisplayName(persona.employeeName).split(' ')[0] ||
    formatDisplayName(persona.employeeName)
  const yaDecidido = timing !== null
  const meta = timing ? TIMING_META[timing] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 md:space-y-10"
    >
      <SeccionIdentidad persona={persona} />
      <SeccionRadiografia persona={persona} />
      <AlertaContexto
        evaluatorStatus={persona.evaluatorStatus}
        metasCompliance={persona.metasCompliance}
        firstName={first}
      />
      <SeccionCuadrante persona={persona} />
      <SeccionRelojFinanciero persona={persona} />

      {/* CTA puente */}
      <div className="pt-2">
        {yaDecidido && meta ? (
          <button
            onClick={onSimular}
            className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 rounded-[20px] border border-solid backdrop-blur-2xl transition-colors text-left cursor-pointer"
            style={{
              borderColor: `${L5_ACCENT}66`,
              backgroundColor: `${L5_ACCENT}0D`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: L5_ACCENT }} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-0.5">
                  Tu decisión actual
                </p>
                <p className="text-sm font-light" style={{ color: L5_ACCENT }}>
                  {meta.label}
                </p>
              </div>
            </div>
            <span
              className="text-xs font-medium flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
              style={{ color: L5_ACCENT }}
            >
              Cambiar →
            </span>
          </button>
        ) : (
          <button
            onClick={onSimular}
            className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 rounded-[20px] border border-dashed border-slate-700 bg-[#0F172A]/90 backdrop-blur-2xl hover:bg-slate-800/30 transition-colors text-left cursor-pointer"
            style={{
              // Hover accent se maneja con onMouseEnter en global, pero
              // mantenemos el color base. Tokens canónicos SKILL.
            }}
          >
            <span className="text-sm font-light text-slate-200">
              Decidir timing para {first}
            </span>
            <span
              className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
              style={{ color: L5_ACCENT }}
            >
              →
            </span>
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── MOMENTO 2 — DECISIÓN ────────────────────────────────────────────────────

function FichaDecision({
  persona,
  timing,
  onChoose,
  onVolver,
}: {
  persona: PersonL5
  timing: Timing | null
  onChoose: (t: Timing) => void
  onVolver: () => void
}) {
  const displayName = formatDisplayName(persona.employeeName)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <button
        onClick={onVolver}
        className="text-xs font-light text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
      >
        ← Volver al expediente
      </button>

      <div className="flex items-center gap-3 pb-5 border-b border-slate-800/40">
        <Avatar name={persona.employeeName} size={44} accent={L5_ACCENT} />
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-light text-white leading-tight truncate">
            {displayName}
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5 truncate">
            {formatLabel(persona.position)} · {formatLabel(persona.departmentName)}
          </p>
        </div>
      </div>

      <SeccionDecisionTiming persona={persona} timing={timing} onChoose={onChoose} />
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SECCIONES DE LA FICHA
// ════════════════════════════════════════════════════════════════════════════

// ── Sección 1: Identidad ────────────────────────────────────────────────────

function SeccionIdentidad({ persona }: { persona: PersonL5 }) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <Avatar name={persona.employeeName} size={56} accent={L5_ACCENT} />
        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl font-light text-white leading-tight">
            {formatDisplayName(persona.employeeName)}
          </h3>
          <p className="text-sm text-slate-400 font-light mt-0.5">
            {formatLabel(persona.position)} · {formatLabel(persona.departmentName)}
          </p>
          <p className="text-xs text-slate-500 font-light mt-1">
            Antigüedad: {formatTenure(persona.tenureMonths)}
            {' · '}
            <TooltipContext
              variant="pattern"
              position="top"
              usePortal
              showIcon
              title="Score retención"
              explanation="Mide cuánto valor entrega esta persona y cuánto justifica retenerla, en escala 0 a 150+."
              details={[
                'Combina cumplimiento de metas (40%), dominio del cargo (30%) y adaptabilidad (30%).',
                'Sube si la persona ocupa un cargo crítico o es sucesora natural.',
                'Se amplifica por la exposición a IA del cargo — a mayor exposición + score alto, más valioso retener.',
                'Bajo 40 indica una situación que requiere definición organizacional.',
              ]}
            >
              <span>Score retención {Math.round(persona.retentionScore)}</span>
            </TooltipContext>
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Sección 2: Radiografía (PROTAGONISTA) ───────────────────────────────────

function SeccionRadiografia({ persona }: { persona: PersonL5 }) {
  const metas = persona.metasCompliance ?? 0
  const dominio = persona.roleFitScore ?? 0
  const adapt = adaptabilidadPct(persona)

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-4">
        RADIOGRAFÍA DEL SCORE
      </p>
      <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6 space-y-5">
        <ScoreBar
          label="Metas"
          weightLabel="40%"
          value={metas}
          displayValue={`${Math.round(metas)}%`}
          color="#22D3EE"
        />
        <ScoreBar
          label="Dominio del cargo"
          weightLabel="30%"
          value={dominio}
          displayValue={`${Math.round(dominio)}%`}
          color={L5_ACCENT}
        />
        <ScoreBar
          label="Adaptabilidad"
          weightLabel="30%"
          value={adapt}
          displayValue={adaptabilidadLabel(persona)}
          color="#F59E0B"
        />
      </div>
    </section>
  )
}

function ScoreBar({
  label,
  weightLabel,
  value,
  displayValue,
  color,
}: {
  label: string
  weightLabel: string
  value: number
  displayValue: string
  color: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-light text-slate-200">{label}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            × {weightLabel}
          </span>
        </div>
        <span className="text-sm font-medium tabular-nums" style={{ color }}>
          {displayValue}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

// ── Sección 3: Alerta de contexto (condicional) ─────────────────────────────
// Cruza evaluatorStatus × metasCompliance. Silencio por diseño para
// OPTIMA/CENTRAL y para SEVERA+metas 50-80.

function AlertaContexto({
  evaluatorStatus,
  metasCompliance,
  firstName,
}: {
  evaluatorStatus: EvaluatorStatus | null
  metasCompliance: number | null
  firstName: string
}) {
  if (!evaluatorStatus) return null
  const metas = metasCompliance ?? 0
  const metasPct = Math.round(metas)

  let variant: 'amber' | 'slate' | 'cyan' | null = null
  let icon: React.ReactNode = null
  let text: React.ReactNode = null

  if (evaluatorStatus === 'SEVERA' && metas > 80) {
    variant = 'amber'
    icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
    text = (
      <>
        {firstName} cumple el <span className="tabular-nums font-medium">{metasPct}%</span>{' '}
        de sus metas pero su evaluador está clasificado como severo — califica bajo el
        promedio de la empresa. El score bajo puede reflejar asfixia de talento, no bajo
        rendimiento.
      </>
    )
  } else if (evaluatorStatus === 'SEVERA' && metas < 50) {
    variant = 'slate'
    text = (
      <>
        {firstName} tiene score bajo y su evaluador es severo. Ambas señales convergen
        — el dato es consistente.
      </>
    )
  } else if (evaluatorStatus === 'INDULGENTE' && metas < 50) {
    variant = 'cyan'
    icon = <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
    text = (
      <>
        {firstName} no cumple metas y su evaluador califica sobre el promedio. El score
        real podría ser peor.
      </>
    )
  }

  if (variant === null) return null

  const base = 'p-4 rounded-r-lg border-l-4 flex items-start gap-3'
  const style =
    variant === 'amber'
      ? 'border-amber-500 bg-amber-500/5'
      : variant === 'cyan'
      ? 'border-cyan-500 bg-cyan-500/5'
      : 'border-slate-600 bg-slate-800/20'
  const textColor =
    variant === 'amber'
      ? 'text-amber-100'
      : variant === 'cyan'
      ? 'text-cyan-100'
      : 'text-slate-300'

  return (
    <section>
      <div className={`${base} ${style}`}>
        {icon}
        <p className={`text-sm font-light leading-relaxed ${textColor}`}>{text}</p>
      </div>
    </section>
  )
}

// ── Sección 4: Cuadrante (narrativa pre-calculada en resolver) ──────────────

function SeccionCuadrante({ persona }: { persona: PersonL5 }) {
  if (!persona.talentNarrative) return null
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        EL CASO
      </p>
      <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6">
        <p className="text-sm md:text-[15px] font-light text-white leading-tight mb-2">
          {persona.talentNarrative.headline}
        </p>
        <p className="text-sm font-light text-slate-300 leading-relaxed">
          {persona.talentNarrative.context}
        </p>
      </div>
    </section>
  )
}

// ── Sección 5: Reloj financiero (Hoy / +3m / +6m / +12m) ───────────────────

function SeccionRelojFinanciero({ persona }: { persona: PersonL5 }) {
  const hoy =
    persona.finiquitoToday ??
    calculateFiniquitoConTopeCustomUF(persona.salary, persona.tenureMonths, UF_VALUE_CLP)
  const q1 = calculateFiniquitoConTopeCustomUF(persona.salary, persona.tenureMonths + 3, UF_VALUE_CLP)
  const q2 = calculateFiniquitoConTopeCustomUF(persona.salary, persona.tenureMonths + 6, UF_VALUE_CLP)
  const q4 = calculateFiniquitoConTopeCustomUF(persona.salary, persona.tenureMonths + 12, UF_VALUE_CLP)

  const delta3 = q1 - hoy
  const delta6 = q2 - hoy
  const delta12 = q4 - hoy

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        RELOJ FINANCIERO
      </p>
      <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl divide-y divide-slate-800/60 overflow-hidden">
        <FilaReloj label="Hoy" valor={formatCLP(hoy)} delta={null} />
        <FilaReloj
          label="+3 meses"
          valor={formatCLP(q1)}
          delta={delta3 > 0 ? `+${formatCLP(delta3)}` : null}
        />
        <FilaReloj
          label="+6 meses"
          valor={formatCLP(q2)}
          delta={delta6 > 0 ? `+${formatCLP(delta6)}` : null}
        />
        <FilaReloj
          label="+12 meses"
          valor={formatCLP(q4)}
          delta={delta12 > 0 ? `+${formatCLP(delta12)}` : null}
        />
      </div>
    </section>
  )
}

function FilaReloj({
  label,
  valor,
  delta,
}: {
  label: string
  valor: string
  delta: string | null
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 md:px-6 py-3">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        <span className="text-sm text-white font-light tabular-nums">{valor}</span>
        {delta && (
          <span className="text-[11px] text-amber-300/80 font-light tabular-nums">
            {delta}
          </span>
        )}
      </span>
    </div>
  )
}

// ── Sección 6: Decisión Timing — 3 opciones radiogroup ─────────────────────

function SeccionDecisionTiming({
  persona,
  timing,
  onChoose,
}: {
  persona: PersonL5
  timing: Timing | null
  onChoose: (t: Timing) => void
}) {
  const someoneSelected = timing !== null
  const displayName = formatDisplayName(persona.employeeName)
  const first = displayName.split(' ')[0] || displayName
  const finiquitoHoy =
    persona.finiquitoToday ??
    calculateFiniquitoConTopeCustomUF(persona.salary, persona.tenureMonths, UF_VALUE_CLP)

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-4">
        ELIGE UN TIMING
      </p>

      <div role="radiogroup" aria-label="Timing de decisión" className="space-y-3">
        {(['hoy', 'q1', 'q2'] as Timing[]).map(t => {
          const meta = TIMING_META[t]
          const Icon = meta.icon
          const isThisSelected = timing === t
          const isDimmed = someoneSelected && !isThisSelected
          const finiquito = calcularFiniquitoTiming(persona, TIMING_MESES[t])
          const narrativa = narrativaTiming(t, first)
          const consecuencia = consecuenciaTiming(t, persona.salary, finiquito, finiquitoHoy)

          const cardBase =
            'w-full text-left p-5 md:p-6 rounded-[20px] backdrop-blur-2xl cursor-pointer transition-all duration-200'
          const cardClass = isThisSelected
            ? `${cardBase} border border-solid bg-[#0F172A]/90`
            : isDimmed
            ? `${cardBase} border border-dashed border-slate-800 bg-[#0F172A]/90 opacity-50 hover:opacity-90 hover:border-slate-600`
            : `${cardBase} border border-dashed border-slate-700 bg-[#0F172A]/90 hover:border-slate-600`
          const selectedStyle = isThisSelected
            ? { borderColor: L5_ACCENT, backgroundColor: `${L5_ACCENT}14` }
            : undefined

          return (
            <button
              key={t}
              role="radio"
              aria-checked={isThisSelected}
              onClick={() => onChoose(t)}
              className={cardClass}
              style={selectedStyle}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                {isThisSelected ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: L5_ACCENT }} />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                )}
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isThisSelected ? L5_ACCENT : '#94a3b8' }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: isThisSelected ? L5_ACCENT : '#cbd5e1' }}
                >
                  {meta.label}
                </span>
              </div>

              <p className="text-sm font-light text-slate-300 leading-relaxed mb-4 max-w-2xl">
                {narrativa}
              </p>

              <p className="text-[11px] font-light text-slate-500 tabular-nums leading-snug">
                {consecuencia}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// AVATAR
// ════════════════════════════════════════════════════════════════════════════

function Avatar({
  name,
  size,
  accent,
}: {
  name: string
  size: number
  accent: string
}) {
  const display = formatDisplayName(name)
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center font-medium tabular-nums"
      style={{
        width: size,
        height: size,
        backgroundColor: `${accent}15`,
        border: `1px solid ${accent}40`,
        color: accent,
        fontSize: size * 0.38,
      }}
    >
      {getInitials(display)}
    </div>
  )
}
