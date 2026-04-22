// ════════════════════════════════════════════════════════════════════════════
// L9 — COSTO DE ESPERAR (migrado a LenteLayout — 4 actos)
// src/components/efficiency/lentes/L9PasivoLaboral.tsx
// ════════════════════════════════════════════════════════════════════════════
// Pasivo laboral que crece por escalones con cada aniversario. Lente
// PERSONA-POR-PERSONA con 3 timings simulables (hoy / +3m / +6m).
//
// Patrón UI: Cinema Mode dentro del Acto Quirófano (clonado de L2):
//   Banner alertas proximidad (si hay)
//   + Rail (240px) de top-15 por costoEspera
//   + Spotlight ficha rica con sub-actos lectura → decisión.
//
// Acto Hallazgo: Talent Arbitrage Map en variante reducida (descubrimiento
// macro: tu pasivo no es uniforme, hay 4 perfiles).
//
// Matemática del carrito (a diferencia de L2: TODOS los timings generan
// ahorro/finiquito/FTE — solo cambia cuándo):
//   · Actuar hoy → finiquito = finiquitoHoy
//   · En 3 meses → finiquito = +3m (calculado fresh)
//   · En 6 meses → finiquito = +6m (calculado fresh)
//   ahorroMes = salary (recurrente post-decisión) y fteEquivalente = 1
//
// Anti-jerga canónica (P12): "Pasivo sin retorno" en vez de "Talent Trap",
// labels con tilde, formatDisplayName/formatLabel desde el inicio.
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Hourglass,
  AlertTriangle,
  Circle,
  CheckCircle2,
  Check,
} from 'lucide-react'
import { LenteLayout } from './LenteLayout'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import {
  calculateFiniquitoConTopeCustomUF,
  calculateMonthsUntilNextYear,
  UF_VALUE_CLP,
} from '@/lib/utils/TalentFinancialFormulas'
import { formatDisplayName, getInitials } from '@/lib/utils/formatName'
import {
  TalentArbitrageMap,
  ZONA_LABEL,
  ZONA_COLOR,
} from './L9TalentArbitrageMap'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE FORMATO
// ════════════════════════════════════════════════════════════════════════════

/** Normaliza strings de BD ("ANALISTA_RRHH") a display humano ("Analista RRHH"). */
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
// TIPOS (coinciden con EfficiencyDataResolver case 'l9_pasivo')
// ════════════════════════════════════════════════════════════════════════════

export type ZonaL9 =
  | 'agilidad_total'
  | 'cimientos_oro'
  | 'ventana_decision'
  | 'talent_trap'

export interface PersonL9 {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  salary: number
  tenureMonths: number
  mesesFiniquito: number
  finiquitoHoy: number
  finiquitoQ2: number
  finiquitoQ4: number
  costoEspera: number
  retentionScore: number | null
  exposureIA: number | null
  vpp: number | null
  zona: ZonaL9 | null
  focalizaScore: number | null
}

interface AlertaProximidad {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  retentionScore: number
  daysToAnniversary: number
  salarioAdicional: number
}

interface L9Detalle {
  persons: PersonL9[]
  totalHoy: number
  totalQ2: number
  totalQ4: number
  costoEsperaTotal: number
  ahorroMensual: number
  paybackMeses: number | null
  totalElegibles: number
  scatter: PersonL9[]
  alertasProximidad: AlertaProximidad[]
}

type Timing = 'hoy' | 'q1' | 'q2'

interface TimingMeta {
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  hint: string
}

const TIMING_META: Record<Timing, TimingMeta> = {
  hoy: {
    label: 'Actuar hoy',
    description: 'Costo cierto. Sin saltos pendientes.',
    color: '#22D3EE',
    icon: Calendar,
    hint: 'Inmediato',
  },
  q1: {
    label: 'En 3 meses',
    description: 'Mantener en nómina ese período.',
    color: '#F59E0B',
    icon: Clock,
    hint: 'Postergar 3m',
  },
  q2: {
    label: 'En 6 meses',
    description: 'Riesgo de aniversario antes de la salida.',
    color: '#EF4444',
    icon: Hourglass,
    hint: 'Postergar 6m',
  },
}

const TIMING_MESES: Record<Timing, number> = { hoy: 0, q1: 3, q2: 6 }

const L9_ACCENT = '#F59E0B' // costo_esperar (amber/warning)

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE CÁLCULO
// ════════════════════════════════════════════════════════════════════════════

function calcularFiniquitoTiming(p: PersonL9, meses: number): number {
  if (meses === 0) return p.finiquitoHoy
  return calculateFiniquitoConTopeCustomUF(
    p.salary,
    p.tenureMonths + meses,
    UF_VALUE_CLP
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS
// ════════════════════════════════════════════════════════════════════════════

/** Narrativa por zona del scatter — lo que la zona significa para esta persona. */
function narrativaZona(zona: ZonaL9 | null, first: string): string {
  switch (zona) {
    case 'talent_trap':
      return `${first} sigue en nómina pero el aporte ya no justifica el cargo. El finiquito acumulado lo vuelve caro de mover. Cada mes que pasa, el costo de salida sube — y la productividad sigue ausente.`
    case 'ventana_decision':
      return `${first} aún no acumula gran pasivo. Decidir hoy es decidir barato. Si pasa el próximo aniversario, el costo de salida sube un sueldo entero.`
    case 'cimientos_oro':
      return `Pasivo alto, justificado por el valor que entrega. La decisión aquí es preservar — no liberar. El costo de perderlo supera al pasivo acumulado.`
    case 'agilidad_total':
      return `Bajo costo de salida y alto valor. La pregunta no es cuándo dejarlo ir — es cómo retenerlo. Aquí el costo está en perderlo, no en esperarlo.`
    default:
      return `${first} es elegible a indemnización. El reloj de aniversario corre — cada año cumplido suma un sueldo al finiquito.`
  }
}

/** Narrativa por timing — interpolada con el primer nombre. */
function narrativaTiming(timing: Timing, first: string): string {
  switch (timing) {
    case 'hoy':
      return `Actuar hoy fija el costo. No hay saltos pendientes — el finiquito es el que ves ahora.`
    case 'q1':
      return `Mantener a ${first} 3 meses más. Si pasa un aniversario en ese período, el finiquito sube un sueldo entero.`
    case 'q2':
      return `Postergar 6 meses. La persona sigue en nómina ese período. El finiquito crece y un aniversario en el camino lo dispara.`
  }
}

/** Consecuencia (números secundarios) por timing. */
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

/** Narrativa dinámica macro — para el acto quirófano, reactiva al avance. */
function narrativaDinamica(total: number, tomadas: number): string {
  if (tomadas === 0)
    return 'Cada persona tiene una ventana antes del próximo aniversario. La decisión es tuya.'
  if (tomadas < Math.ceil(total / 2))
    return `${tomadas} de ${total} decididas. El reloj de aniversario es distinto en cada persona.`
  if (tomadas < total)
    return 'Más de la mitad del expediente cerrado. Los pendientes esperan tu criterio.'
  return `${total} decisiones tomadas. Lo siguiente es ejecutar antes del próximo salto.`
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L9PasivoLaboral({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
  onNextLente,
  proximoLenteTitulo,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as L9Detalle | null

  const [personaActivaId, setPersonaActivaId] = useState<string | null>(null)
  const [timingByPerson, setTimingByPerson] = useState<
    Record<string, Timing | null>
  >({})

  // Hidrata desde el carrito (convención sufijo · timing)
  useEffect(() => {
    const inicial: Record<string, Timing | null> = {}
    for (const d of decisionesActuales) {
      const match = d.nombre.match(/· (hoy|q1|q2)$/)
      if (match) inicial[d.id] = match[1] as Timing
    }
    setTimingByPerson(prev =>
      Object.keys(prev).length === 0 ? inicial : prev
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Decidibles: TODAS las personas elegibles (no solo top-15) cuya zona
  // requiere decisión de timing. El backend entrega `scatter` con todos
  // los elegibles que tienen zona — el filtro saca cimientos_oro y
  // agilidad_total (contexto estratégico, no decidibles).
  //
  // Sort por costoEspera DESC para que el Rail muestre primero las que
  // más urgen. NO se limita a 15 — puede haber más o menos según el
  // tamaño de la organización.
  const personsDecidibles = useMemo(() => {
    if (!detalle?.scatter) return []
    return [...detalle.scatter]
      .filter(p => p.zona === 'ventana_decision' || p.zona === 'talent_trap')
      .sort((a, b) => b.costoEspera - a.costoEspera)
  }, [detalle])

  // Persona activa default = primera decidible. Si la activa actual ya
  // no está en el set decidible (cambio de filtro o data), reasignar.
  useEffect(() => {
    if (personsDecidibles.length === 0) {
      if (personaActivaId !== null) setPersonaActivaId(null)
      return
    }
    const stillValid = personsDecidibles.some(
      p => p.employeeId === personaActivaId
    )
    if (!stillValid) {
      setPersonaActivaId(personsDecidibles[0].employeeId)
    }
  }, [personsDecidibles, personaActivaId])

  // Map de alertas por employeeId para lookup O(1) en cada ficha
  const alertaPorEmployee = useMemo(() => {
    const m = new Map<string, AlertaProximidad>()
    for (const a of detalle?.alertasProximidad ?? []) m.set(a.employeeId, a)
    return m
  }, [detalle])

  if (!lente.hayData || !detalle || detalle.persons.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
  }

  const handleTiming = (p: PersonL9, timing: Timing) => {
    const current = timingByPerson[p.employeeId]
    const isToggleOff = current === timing

    setTimingByPerson(prev => ({
      ...prev,
      [p.employeeId]: isToggleOff ? null : timing,
    }))

    if (isToggleOff) {
      onRemove(decisionKey({ tipo: 'persona', id: p.employeeId }))
      return
    }

    const meses = TIMING_MESES[timing]
    const finiquitoTiming = calcularFiniquitoTiming(p, meses)

    // Matemática L9: TODOS los timings generan ahorro/finiquito/FTE.
    // Solo cambia el monto del finiquito (cierto vs futuro). El ahorroMes
    // es recurrente post-decisión sin importar cuándo se ejecute.
    const item: DecisionItem = {
      id: p.employeeId,
      lenteId: 'l9_pasivo',
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
  }

  // ─── Derivados reactivos ────────────────────────────────────────────────
  const tomadas = Object.values(timingByPerson).filter(v => v !== null).length
  const hasInteraction = tomadas > 0

  const inversionTotal = personsDecidibles.reduce((s, p) => {
    const t = timingByPerson[p.employeeId]
    if (!t) return s
    return s + calcularFiniquitoTiming(p, TIMING_MESES[t])
  }, 0)

  const ahorroMensualTotal = personsDecidibles.reduce((s, p) => {
    const t = timingByPerson[p.employeeId]
    if (!t) return s
    return s + p.salary
  }, 0)

  const paybackMeses =
    ahorroMensualTotal > 0
      ? Math.ceil(inversionTotal / ahorroMensualTotal)
      : null

  const checkpointSummary = hasInteraction
    ? {
        items: personsDecidibles
          .filter(p => timingByPerson[p.employeeId] !== null)
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
    ? personsDecidibles.find(p => p.employeeId === personaActivaId) ?? null
    : null

  return (
    <LenteLayout
      familiaAccent={L9_ACCENT}
      heroValue={formatCLP(detalle.costoEsperaTotal)}
      heroUnit={`${personsDecidibles.length} ${personsDecidibles.length === 1 ? 'persona requiere' : 'personas requieren'} decisión de timing · ${detalle.totalElegibles} en nómina elegible`}
      narrativaPuente="El pasivo laboral no es estático — crece por escalones con cada aniversario. Cada persona tiene su propio reloj. Ver caso por caso permite anticipar los saltos antes de que se conviertan en costo."
      ctaSimularLabel="Ver casos"
      ctaQuirofanoEyebrow="EXPEDIENTE DE TIMING"
      hasInteraction={hasInteraction}
      checkpointSummary={checkpointSummary}
      onNextLente={onNextLente}
      proximoLenteTitulo={proximoLenteTitulo}
      onActChange={onActChange}
      totalizador={{
        metricas: [
          {
            label: 'Personas decididas',
            value: `${tomadas} / ${personsDecidibles.length}`,
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
        <HallazgoZonas
          scatter={detalle.scatter}
          alertasProximidad={detalle.alertasProximidad}
        />
      )}
      renderExpediente={() => <ExpedienteLateral detalle={detalle} />}
      renderQuirofano={() => {
        // Edge case: top-15 está todo en zonas estratégicas (Cimientos /
        // Agilidad). No hay decisiones de salida que tomar — caso "blindaje".
        if (personsDecidibles.length === 0) {
          return (
            <div className="rounded-[20px] border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-2xl p-6 md:p-8 max-w-2xl">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-medium mb-2">
                BLINDAJE
              </p>
              <p className="text-sm md:text-base font-light text-emerald-100 leading-relaxed">
                Las personas más costosas de tu nómina están en zonas
                estratégicas — Cimientos de oro o Agilidad total. Ninguna
                requiere decisión de salida hoy. El pasivo es saludable.
              </p>
            </div>
          )
        }
        return (
          <>
            {detalle.alertasProximidad.length > 0 && (
              <AlertasProximidadBanner alertas={detalle.alertasProximidad} />
            )}
            <NarrativaContextoArriba
              mensaje={narrativaDinamica(personsDecidibles.length, tomadas)}
            />
            <QuirofanoSplit
              rows={personsDecidibles}
              personaActiva={personaActiva}
              onSelectPersona={setPersonaActivaId}
              timings={timingByPerson}
              onTiming={handleTiming}
              alertaPorEmployee={alertaPorEmployee}
            />
          </>
        )
      }}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — HALLAZGO: 4 zonas como cards 2×2 + scatter como evidencia
// ════════════════════════════════════════════════════════════════════════════

interface ZonaAggregada {
  count: number
  pasivo: number
}

interface ZonaCardConfig {
  zona: ZonaL9
  tono: 'estrategico' | 'requiere_decision'
  descripcion: string
}

// Orden visual del grid (2 superiores estratégicas / 2 inferiores urgentes)
const ZONA_CARDS_ORDER: ZonaCardConfig[] = [
  {
    zona: 'cimientos_oro',
    tono: 'estrategico',
    descripcion:
      'Pasivo alto, justificado por el valor que entregan. Preservar — el costo de perderlas supera al pasivo.',
  },
  {
    zona: 'agilidad_total',
    tono: 'estrategico',
    descripcion:
      'Bajo costo de salida, alto valor. La pregunta es cómo retenerlas — el costo está en perderlas.',
  },
  {
    zona: 'talent_trap',
    tono: 'requiere_decision',
    descripcion:
      'Aporte ya no justifica el cargo. El finiquito acumulado vuelve cara la salida — cada mes suma.',
  },
  {
    zona: 'ventana_decision',
    tono: 'requiere_decision',
    descripcion:
      'Aún no acumulan gran pasivo. Decidir hoy es decidir barato — antes del próximo aniversario.',
  },
]

function HallazgoZonas({
  scatter,
  alertasProximidad,
}: {
  scatter: PersonL9[]
  alertasProximidad: AlertaProximidad[]
}) {
  const [verScatter, setVerScatter] = useState(false)

  // Agregaciones por zona — count + pasivo acumulado (suma de finiquitoHoy)
  const byZona = useMemo(() => {
    const groups: Record<ZonaL9, ZonaAggregada> = {
      agilidad_total: { count: 0, pasivo: 0 },
      cimientos_oro: { count: 0, pasivo: 0 },
      ventana_decision: { count: 0, pasivo: 0 },
      talent_trap: { count: 0, pasivo: 0 },
    }
    for (const p of scatter) {
      if (p.zona) {
        groups[p.zona].count++
        groups[p.zona].pasivo += p.finiquitoHoy
      }
    }
    return groups
  }, [scatter])

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-amber-400 font-medium mb-2">
        EL MAPA
      </p>
      <h3 className="text-xl md:text-2xl font-extralight text-white mb-4 leading-tight">
        Tu pasivo,{' '}
        <span className="fhr-title-gradient">en cuatro perfiles</span>
      </h3>
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl mb-6">
        No todas las personas pesan igual en el pasivo. Algunas cuestan poco
        hoy y dan futuro. Otras requieren decisión de timing antes del
        próximo aniversario.
      </p>

      {/* Grid 2×2 — superiores estratégicas / inferiores requieren decisión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
        {ZONA_CARDS_ORDER.map(cfg => (
          <ZonaCard
            key={cfg.zona}
            config={cfg}
            data={byZona[cfg.zona]}
          />
        ))}
      </div>

      {/* Progressive disclosure — scatter como evidencia de soporte.
          Escalable a 1000-5000 empleados sin que protagonice el acto. */}
      <button
        onClick={() => setVerScatter(v => !v)}
        className="text-xs font-light text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
      >
        {verScatter ? '−' : '+'} {verScatter ? 'Ocultar' : 'Ver'} distribución
        detallada
      </button>

      <AnimatePresence initial={false}>
        {verScatter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-5">
              <TalentArbitrageMap
                scatter={scatter}
                alertasProximidad={alertasProximidad}
                variant="reduced"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ZonaCard({
  config,
  data,
}: {
  config: ZonaCardConfig
  data: ZonaAggregada
}) {
  const color = ZONA_COLOR[config.zona]
  const label = ZONA_LABEL[config.zona]
  const isUrgente = config.tono === 'requiere_decision'

  return (
    <div
      className="rounded-[20px] border bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6"
      style={{
        borderColor: isUrgente ? `${color}50` : 'rgb(30 41 59)',
        boxShadow: isUrgente ? `inset 3px 0 0 ${color}` : undefined,
      }}
    >
      {/* Header: dot + label + tag estratégico/decisión */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span
            className="text-xs font-medium truncate"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        <span
          className={`text-[10px] uppercase tracking-widest font-medium flex-shrink-0 ${
            isUrgente ? 'text-amber-400/90' : 'text-emerald-400/80'
          }`}
        >
          {isUrgente ? 'Requiere decisión' : 'Estratégico'}
        </span>
      </div>

      {/* Métricas: count protagonista + pasivo acumulado debajo */}
      <div className="flex items-baseline gap-3 mb-3">
        <p className="text-3xl font-extralight text-white tabular-nums leading-none">
          {data.count}
        </p>
        <p className="text-xs text-slate-500 font-light">
          {data.count === 1 ? 'persona' : 'personas'}
        </p>
      </div>

      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium mb-1">
        Pasivo acumulado
      </p>
      <p className="text-sm font-light text-slate-200 tabular-nums mb-4">
        {formatCLP(data.pasivo)}
      </p>

      <p className="text-xs text-slate-400 font-light leading-relaxed">
        {config.descripcion}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — EXPEDIENTE LATERAL (4 stats canónicos)
// ════════════════════════════════════════════════════════════════════════════

function ExpedienteLateral({ detalle }: { detalle: L9Detalle }) {
  const hasAlertas = detalle.alertasProximidad.length > 0
  return (
    <aside className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6 space-y-5">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        EN CIFRAS
      </p>

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {detalle.totalElegibles}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Personas elegibles
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {formatCLP(detalle.totalHoy)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Pasivo hoy
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-amber-300/90 tabular-nums leading-tight">
          {formatCLP(detalle.costoEsperaTotal)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Costo de esperar 12m
        </p>
      </div>

      {hasAlertas && (
        <>
          <div className="h-px bg-slate-800/40" aria-hidden />
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <p className="text-xs font-light text-amber-200 leading-snug">
              {detalle.alertasProximidad.length}{' '}
              {detalle.alertasProximidad.length === 1
                ? 'aniversario próximo'
                : 'aniversarios próximos'}
            </p>
          </div>
        </>
      )}
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// QUIRÓFANO — Banner global de alertas (tokens canónicos)
// ════════════════════════════════════════════════════════════════════════════

function AlertasProximidadBanner({
  alertas,
}: {
  alertas: AlertaProximidad[]
}) {
  return (
    <div className="mb-6 rounded-[20px] border border-amber-500/40 bg-amber-500/10 backdrop-blur-2xl p-5 md:p-6">
      <p className="text-[10px] uppercase tracking-widest text-amber-300 font-medium mb-3 inline-flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3" />
        Aniversarios en menos de 45 días
      </p>
      <div className="space-y-2.5">
        {alertas.map(a => (
          <div
            key={a.employeeId}
            className="flex items-baseline justify-between gap-3 flex-wrap"
          >
            <p className="text-sm text-amber-100 font-light leading-snug min-w-0">
              <span className="font-medium">
                {formatDisplayName(a.employeeName)}
              </span>
              <span className="text-amber-300/70">
                {' · '}
                {formatLabel(a.position)}
              </span>
            </p>
            <p className="text-xs text-amber-200/90 font-light tabular-nums">
              <span className="font-medium">{a.daysToAnniversary}d</span>{' '}
              <span className="text-amber-300/70">·</span> cada aniversario =
              +{formatCLP(a.salarioAdicional)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA ARRIBA — contexto antes del split
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
// QUIRÓFANO SPLIT — Rail + Spotlight (clonado de L2)
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoSplitProps {
  rows: PersonL9[]
  personaActiva: PersonL9 | null
  onSelectPersona: (id: string) => void
  timings: Record<string, Timing | null>
  onTiming: (p: PersonL9, t: Timing) => void
  alertaPorEmployee: Map<string, AlertaProximidad>
}

function QuirofanoSplit({
  rows,
  personaActiva,
  onSelectPersona,
  timings,
  onTiming,
  alertaPorEmployee,
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
          alerta={alertaPorEmployee.get(personaActiva.employeeId) ?? null}
          onChoose={t => onTiming(personaActiva, t)}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RAIL DE PERSONAS — top-15 con dot timing y dot zona secundaria
// ════════════════════════════════════════════════════════════════════════════

interface RailPersonasProps {
  rows: PersonL9[]
  activeId: string | null
  onSelect: (id: string) => void
  timings: Record<string, Timing | null>
}

function RailPersonas({
  rows,
  activeId,
  onSelect,
  timings,
}: RailPersonasProps) {
  return (
    <nav
      aria-label="Lista de personas"
      className="flex md:block overflow-x-auto md:overflow-x-visible md:max-h-[640px] md:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0"
    >
      {rows.map(p => {
        const isActive = p.employeeId === activeId
        const timing = timings[p.employeeId]
        const zonaColor = p.zona ? ZONA_COLOR[p.zona] : null
        return (
          <button
            key={p.employeeId}
            onClick={() => onSelect(p.employeeId)}
            className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors text-left min-w-[200px] md:min-w-0 ${
              isActive
                ? 'bg-slate-800/50'
                : 'bg-transparent hover:bg-slate-800/30'
            }`}
            style={
              isActive
                ? {
                    borderColor: `${L9_ACCENT}80`,
                    boxShadow: `inset 3px 0 0 ${L9_ACCENT}`,
                  }
                : { borderColor: 'rgba(51, 65, 85, 0.4)' }
            }
          >
            <Avatar name={p.employeeName} size={28} accent={L9_ACCENT} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {formatDisplayName(p.employeeName)}
              </p>
              <p className="text-[10px] font-light text-slate-500 truncate">
                {formatLabel(p.position)}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Dot timing — primario, color del timing elegido */}
              {timing && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: TIMING_META[timing].color }}
                  aria-label={`Timing: ${TIMING_META[timing].label}`}
                />
              )}
              {/* Dot zona — secundario, sólo si no hay timing aún */}
              {zonaColor && !timing && (
                <span
                  className="w-1.5 h-1.5 rounded-full opacity-50"
                  style={{ backgroundColor: zonaColor }}
                  aria-label={`Zona: ${ZONA_LABEL[p.zona!]}`}
                />
              )}
            </div>
          </button>
        )
      })}
    </nav>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FICHA RICA — sub-actos lectura → decisión (patrón L2)
// ════════════════════════════════════════════════════════════════════════════

interface FichaRicaProps {
  persona: PersonL9
  timing: Timing | null
  alerta: AlertaProximidad | null
  onChoose: (t: Timing) => void
}

function FichaRica({ persona, timing, alerta, onChoose }: FichaRicaProps) {
  const [vista, setVista] = useState<'lectura' | 'decision'>('lectura')

  // Cada persona arranca en lectura — predictibilidad sobre todo
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
            alerta={alerta}
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
  alerta,
  onSimular,
}: {
  persona: PersonL9
  timing: Timing | null
  alerta: AlertaProximidad | null
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
      <SeccionPosicionMapa persona={persona} />
      <SeccionNarrativa persona={persona} first={first} />
      <SeccionRelojAniversario persona={persona} alerta={alerta} />
      <SeccionRelojFinanciero persona={persona} />

      {/* CTA puente — separa "entender" de "actuar" */}
      <div className="pt-2">
        {yaDecidido && meta ? (
          <button
            onClick={onSimular}
            className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 rounded-[20px] border border-solid border-amber-400/40 bg-amber-500/5 hover:bg-amber-500/10 backdrop-blur-2xl transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-0.5">
                  Tu decisión actual
                </p>
                <p className="text-sm font-light text-amber-200">
                  {meta.label}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              Cambiar →
            </span>
          </button>
        ) : (
          <button
            onClick={onSimular}
            className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 rounded-[20px] border border-dashed border-slate-700 bg-[#0F172A]/90 backdrop-blur-2xl hover:border-amber-400/60 hover:bg-amber-500/5 transition-colors text-left cursor-pointer"
          >
            <span className="text-sm font-light text-slate-200">
              Decidir timing para {first}
            </span>
            <span className="text-amber-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
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
  persona: PersonL9
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
        <Avatar name={persona.employeeName} size={44} accent={L9_ACCENT} />
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-light text-white leading-tight truncate">
            {displayName}
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5 truncate">
            {formatLabel(persona.position)} ·{' '}
            {formatLabel(persona.departmentName)}
          </p>
        </div>
      </div>

      <SeccionDecisionTiming
        persona={persona}
        timing={timing}
        onChoose={onChoose}
      />
    </motion.div>
  )
}

// ── Sección 1: Identidad ────────────────────────────────────────────────────

function SeccionIdentidad({ persona }: { persona: PersonL9 }) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <Avatar name={persona.employeeName} size={56} accent={L9_ACCENT} />
        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl font-light text-white leading-tight">
            {formatDisplayName(persona.employeeName)}
          </h3>
          <p className="text-sm text-slate-400 font-light mt-0.5">
            {formatLabel(persona.position)} ·{' '}
            {formatLabel(persona.departmentName)}
          </p>
          <p className="text-xs text-slate-500 font-light mt-1">
            Antigüedad: {formatTenure(persona.tenureMonths)}
            {persona.retentionScore !== null && (
              <>
                {' · '}
                Score retención {Math.round(persona.retentionScore)}
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Sección 2: Posición en el mapa (chip de zona) ──────────────────────────

function SeccionPosicionMapa({ persona }: { persona: PersonL9 }) {
  if (!persona.zona) return null
  const color = ZONA_COLOR[persona.zona]
  const label = ZONA_LABEL[persona.zona]
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        EN EL MAPA
      </p>
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          background: `${color}15`,
          border: `1px solid ${color}40`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>
    </section>
  )
}

// ── Sección 3: Narrativa "EL CASO" ─────────────────────────────────────────

function SeccionNarrativa({
  persona,
  first,
}: {
  persona: PersonL9
  first: string
}) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        EL CASO
      </p>
      <p className="text-sm md:text-[15px] font-light text-slate-300 leading-relaxed max-w-3xl">
        {narrativaZona(persona.zona, first)}
      </p>
    </section>
  )
}

// ── Sección 4: Reloj aniversario ───────────────────────────────────────────

function SeccionRelojAniversario({
  persona,
  alerta,
}: {
  persona: PersonL9
  alerta: AlertaProximidad | null
}) {
  const meses = calculateMonthsUntilNextYear(persona.tenureMonths)
  if (meses === null && !alerta) return null

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        RELOJ DE ANIVERSARIO
      </p>
      {alerta ? (
        <div className="rounded-[20px] border border-amber-500/40 bg-amber-500/10 backdrop-blur-2xl p-5 md:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-100 leading-snug">
                Aniversario en {alerta.daysToAnniversary} días
              </p>
              <p className="text-xs text-amber-200/80 font-light leading-snug mt-1.5">
                Cada año cumplido suma un sueldo entero al finiquito. Actuar
                antes evita aprox.{' '}
                <span className="font-medium tabular-nums">
                  {formatCLP(alerta.salarioAdicional)}
                </span>{' '}
                de indemnización adicional.
              </p>
            </div>
          </div>
        </div>
      ) : meses !== null ? (
        <p className="text-sm font-light text-slate-400 leading-relaxed">
          Próximo aniversario en{' '}
          <span className="text-slate-200 tabular-nums">
            {meses} {meses === 1 ? 'mes' : 'meses'}
          </span>
          . Cada año cumplido = +1 sueldo de indemnización.
        </p>
      ) : null}
    </section>
  )
}

// ── Sección 5: Reloj financiero (Hoy / +6m / +12m) ─────────────────────────

function SeccionRelojFinanciero({ persona }: { persona: PersonL9 }) {
  const hoy = persona.finiquitoHoy
  const delta6 = persona.finiquitoQ2 - hoy
  const delta12 = persona.finiquitoQ4 - hoy

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        RELOJ FINANCIERO
      </p>
      <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl divide-y divide-slate-800/60 overflow-hidden">
        <FilaReloj label="Hoy" valor={formatCLP(hoy)} delta={null} />
        <FilaReloj
          label="+6 meses"
          valor={formatCLP(persona.finiquitoQ2)}
          delta={delta6 > 0 ? `+${formatCLP(delta6)}` : null}
        />
        <FilaReloj
          label="+12 meses"
          valor={formatCLP(persona.finiquitoQ4)}
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
        <span className="text-sm text-white font-light tabular-nums">
          {valor}
        </span>
        {delta && (
          <span className="text-[11px] text-amber-300/80 font-light tabular-nums">
            {delta}
          </span>
        )}
      </span>
    </div>
  )
}

// ── Sección 6: Decisión Timing — 3 opciones ToggleGroup canónico ───────────

function SeccionDecisionTiming({
  persona,
  timing,
  onChoose,
}: {
  persona: PersonL9
  timing: Timing | null
  onChoose: (t: Timing) => void
}) {
  const someoneSelected = timing !== null
  const displayName = formatDisplayName(persona.employeeName)
  const first = displayName.split(' ')[0] || displayName

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-4">
        ELIGE UN TIMING
      </p>

      <div
        role="radiogroup"
        aria-label="Timing de decisión"
        className="space-y-3"
      >
        {(['hoy', 'q1', 'q2'] as Timing[]).map(t => {
          const meta = TIMING_META[t]
          const Icon = meta.icon
          const isThisSelected = timing === t
          const isDimmed = someoneSelected && !isThisSelected
          const finiquito = calcularFiniquitoTiming(persona, TIMING_MESES[t])
          const narrativa = narrativaTiming(t, first)
          const consecuencia = consecuenciaTiming(
            t,
            persona.salary,
            finiquito,
            persona.finiquitoHoy
          )

          // Tokens canónicos SKILL (amber = accent F3 costo_esperar):
          //   · default   → dashed border-slate-700, glassmorphism
          //   · hover     → border-slate-600
          //   · selected  → solid border-amber-400, bg-amber-500/10
          //   · dimmed    → dashed border-slate-800 + opacity-50
          const cardBase =
            'w-full text-left p-5 md:p-6 rounded-[20px] backdrop-blur-2xl cursor-pointer transition-all duration-200'
          const cardClass = isThisSelected
            ? `${cardBase} border border-solid border-amber-400 bg-amber-500/10`
            : isDimmed
            ? `${cardBase} border border-dashed border-slate-800 bg-[#0F172A]/90 opacity-50 hover:opacity-90 hover:border-slate-600`
            : `${cardBase} border border-dashed border-slate-700 bg-[#0F172A]/90 hover:border-slate-600`

          return (
            <button
              key={t}
              role="radio"
              aria-checked={isThisSelected}
              onClick={() => onChoose(t)}
              className={cardClass}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                {isThisSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                )}
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: meta.color }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: isThisSelected ? '#F59E0B' : '#cbd5e1' }}
                >
                  {meta.label}
                </span>
              </div>

              <p className="text-sm font-light text-slate-300 leading-relaxed mb-4 max-w-2xl">
                {narrativa}
              </p>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
                  Consecuencia
                </p>
                <p className="text-xs text-slate-400 font-light tabular-nums leading-snug">
                  {consecuencia}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {someoneSelected && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-light text-emerald-400/90">
          <Check className="w-3 h-3" />
          Registrada en tu plan
        </p>
      )}
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ÁTOMOS UI
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
