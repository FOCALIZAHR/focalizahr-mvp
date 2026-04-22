// ════════════════════════════════════════════════════════════════════════════
// L2 — TALENTO ESTANCADO (migrado a LenteLayout — 4 actos)
// src/components/efficiency/lentes/L2TalentoZombie.tsx
// ════════════════════════════════════════════════════════════════════════════
// Personas que rinden excelente hoy pero no podrán adaptarse al cambio
// tecnológico. Lente PERSONA-POR-PERSONA con 3 escenarios simulables por
// individuo (Congelar / Reubicar / Transición).
//
// Patrón UI: Cinema Mode compacto dentro del Acto Quirófano:
//   Rail (240px desktop / tabs horizontales mobile) con lista de personas
//   + Spotlight (ficha rica con 6 secciones + decisión con consecuencia).
//
// Anti-jerga canónica (P12):
//   · "Dominio del cargo"  (no "RoleFit")
//   · "Exposición IA"      (no "Exposición" a secas)
//   · "Talento estancado"  (no "zombie" visible al CEO)
//   · Adaptabilidad narrativa (Baja/Media/Alta, no "2/3" crudo)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Snowflake, ArrowRightLeft, Calendar, Check } from 'lucide-react'
import { LenteLayout } from './LenteLayout'
import { LenteCard } from './LenteCard'
import type { LenteComponentProps } from './_LentePlaceholder'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { formatDisplayName, getInitials } from '@/lib/utils/formatName'
import { getNineBoxLabel } from '@/config/nineBoxLabels'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
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

/** Adaptabilidad narrativa — nunca "2/3" crudo al CEO (P12). */
function labelAdaptabilidad(potentialAbility: number | null): string {
  if (potentialAbility === null) return 'Sin señal'
  if (potentialAbility === 1) return 'Baja'
  if (potentialAbility === 2) return 'Media'
  return 'Alta'
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface PersonAlert {
  employeeId: string
  employeeName: string
  position: string
  departmentName: string
  observedExposure: number
  roleFitScore: number
  salary: number
  financialImpact: number
  acotadoGroup: string | null
  standardCategory: string | null
  metasCompliance: number | null
  // Enriquecidos en el resolver
  focalizaScore: number | null
  tenureMonths: number
  riskQuadrant: string | null
  mobilityQuadrant: string | null
  nineBoxPosition: string | null
  finiquitoToday: number | null
  // v3.2 — ficha rica
  potentialAbility: number | null
  finiquitoIn6m: number
  finiquitoIn12m: number
}

interface L2Detalle {
  count: number
  persons: PersonAlert[]
  totalInertiaCost: number
  avgExposure: number
}

type DecisionType = 'congelar' | 'reubicar' | 'transicion'

interface DecisionMeta {
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  /** Timing de la consecuencia (para mostrar antes de elegir). */
  timing: string
}

const DECISION_META: Record<DecisionType, DecisionMeta> = {
  congelar: {
    label: 'Congelar cargo',
    description: 'Cuando la persona salga, el cargo no se reemplaza.',
    color: '#22D3EE',
    icon: Snowflake,
    timing: 'Salida natural (12-18m)',
  },
  reubicar: {
    label: 'Reubicar',
    description:
      'Este camino busca rescatar al talento que ya conoces y moverlo donde la IA y automatización no compita. Pero solo funciona si la persona tiene la adaptabilidad para aprender nuevos roles. Es una apuesta de riesgo.',
    color: '#A78BFA',
    icon: ArrowRightLeft,
    timing: 'Inmediato · cargo liberado',
  },
  transicion: {
    label: 'Transición acordada',
    description: 'Salida con timing y costo cierto.',
    color: '#F59E0B',
    icon: Calendar,
    timing: 'Inmediato · costo cierto',
  },
}

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

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const L2_ACCENT = '#A78BFA' // ruta_ejecucion purple

/** Exposición efectiva — Eloundou primario, legacy Anthropic fallback */
function effExposure(p: PersonAlert): number {
  return p.focalizaScore ?? p.observedExposure ?? 0
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA MACRO — para el acto quirófano
// ════════════════════════════════════════════════════════════════════════════

function narrativaDinamica(total: number, tomadas: number): string {
  if (tomadas === 0)
    return 'Estas personas hoy rinden, pero sus posiciones son frágiles frente a la automatización IA. El instinto es proteger la trayectoria, pero el finiquito va creciendo y los competidores ya están incorporando la IA. Cada caso espera una definición para detener el impacto operacional y financiero.'
  if (tomadas < Math.ceil(total / 2))
    return `${tomadas} de ${total} decididas. Cada persona es un caso distinto — no hay plantilla.`
  if (tomadas < total)
    return 'Más de la mitad del expediente cerrado. Los pendientes esperan tu criterio.'
  return 'Cada persona tiene una ruta. Lo siguiente es ejecutar.'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L2TalentoZombie({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
  onNextLente,
  proximoLenteTitulo,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as L2Detalle | null

  const [personaActivaId, setPersonaActivaId] = useState<string | null>(null)
  const [decisiones, setDecisiones] = useState<Record<string, DecisionType | null>>({})

  // Hidrata desde el carrito (mismo patrón que hoy — convención sufijo · tipo)
  useEffect(() => {
    const inicial: Record<string, DecisionType | null> = {}
    for (const d of decisionesActuales) {
      const match = d.nombre.match(/· (congelar|reubicar|transicion)$/)
      if (match) inicial[d.id] = match[1] as DecisionType
    }
    setDecisiones(prev => (Object.keys(prev).length === 0 ? inicial : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const personsSorted = useMemo(() => {
    if (!detalle?.persons) return []
    return [...detalle.persons].sort((a, b) => b.salary - a.salary)
  }, [detalle])

  // Persona activa default = primera de la lista
  useEffect(() => {
    if (personaActivaId === null && personsSorted.length > 0) {
      setPersonaActivaId(personsSorted[0].employeeId)
    }
  }, [personsSorted, personaActivaId])

  if (!lente.hayData || !detalle || personsSorted.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
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

    // FIX: ahorroMes = salary mensual real (antes era salary × 12 anual).
    // El CarritoBar y PanelAcumuladores derivan ahorroAnual × 12
    // automáticamente desde calcularResumenCarrito.
    const ahorroMes = tipo === 'reubicar' ? 0 : person.salary
    const finiquito = tipo === 'transicion' ? person.finiquitoToday ?? 0 : 0

    const item: DecisionItem = {
      id: person.employeeId,
      lenteId: 'l2_zombie',
      tipo: 'persona',
      nombre: `${person.employeeName} · ${tipo}`,
      gerencia: person.departmentName,
      ahorroMes,
      finiquito,
      fteEquivalente: tipo === 'transicion' ? 1 : 0,
      narrativa: `${lente.narrativa}\n\n${DECISION_META[tipo].label}: ${DECISION_META[tipo].description}`,
      aprobado: false,
    }
    onUpsert(item)
  }

  // ─── Derivados reactivos ────────────────────────────────────────────────
  const tomadas = Object.values(decisiones).filter(v => v !== null).length
  const hasInteraction = tomadas > 0

  const ahorroMensualTotal = personsSorted.reduce((s, p) => {
    const d = decisiones[p.employeeId]
    if (!d) return s
    return s + (d === 'reubicar' ? 0 : p.salary)
  }, 0)

  const inversionTotal = personsSorted.reduce((s, p) => {
    const d = decisiones[p.employeeId]
    if (d === 'transicion') return s + (p.finiquitoToday ?? 0)
    return s
  }, 0)

  const gapTotal = personsSorted.reduce((s, p) => s + p.salary, 0)
  // Pasivo laboral hoy = Σ finiquitoToday de todas las personas.
  // Con el fix raíz del enricher (commit simultáneo), finiquitoToday
  // llega como number real para todos los zombies (antes era null por
  // el gate roleFitScore < 75).
  const pasivoLaboralHoy = personsSorted.reduce(
    (s, p) => s + (p.finiquitoToday ?? 0),
    0
  )

  const checkpointSummary = hasInteraction
    ? {
        items: personsSorted
          .filter(p => decisiones[p.employeeId] !== null)
          .map(p => {
            const tipo = decisiones[p.employeeId]!
            return {
              label: `${formatDisplayName(p.employeeName)} · ${formatLabel(p.position)}`,
              detail: DECISION_META[tipo].label,
              value:
                tipo === 'reubicar' ? '$0/mes' : `${formatCLP(p.salary)}/mes`,
            }
          }),
        totalLabel: `${tomadas} ${tomadas === 1 ? 'decisión' : 'decisiones'} en tu plan`,
        totalValue: `${formatCLP(ahorroMensualTotal)}/mes`,
      }
    : undefined

  const personaActiva = personaActivaId
    ? personsSorted.find(p => p.employeeId === personaActivaId) ?? null
    : null

  return (
    <LenteLayout
      familiaAccent={L2_ACCENT}
      heroValue={String(detalle.count)}
      heroUnit={`personas rinden hoy y no podrán adaptarse · ${Math.round(detalle.avgExposure * 100)}% exposición IA promedio`}
      narrativaPuente="Cada persona en esta lista tiene seguramente una historia de éxito y compromiso con la organización. Pero el análisis es frío: sus cargos están desapareciendo. Entrar en cada caso permite ver qué cuesta más: si actuar hoy o esperar a que el problema crezca."
      ctaSimularLabel="Abrir expedientes"
      ctaQuirofanoEyebrow="EXPEDIENTE DE TALENTO"
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
            label: 'Ahorro mensual',
            value: `${formatCLP(ahorroMensualTotal)}/mes`,
            tint: 'emerald',
          },
          {
            label: 'Inversión (finiquitos)',
            value: formatCLP(inversionTotal),
            tint: 'warning',
          },
        ],
      }}
      renderHallazgo={() => <HallazgoResumen rows={personsSorted} />}
      renderExpediente={() => (
        <ExpedienteLateral
          personsCount={personsSorted.length}
          gapTotal={gapTotal}
          pasivoLaboralHoy={pasivoLaboralHoy}
        />
      )}
      renderQuirofano={() => (
        <>
          {/* Narrativa dinámica ARRIBA del split — el contexto emocional
              prepara la decisión, no la comenta después. Renderizado aquí
              en vez del slot del LenteLayout para controlar la posición. */}
          <NarrativaContextoArriba
            mensaje={narrativaDinamica(personsSorted.length, tomadas)}
          />
          <QuirofanoSplit
            rows={personsSorted}
            personaActiva={personaActiva}
            onSelectPersona={setPersonaActivaId}
            decisiones={decisiones}
            onDecision={handleToggleDecision}
          />
        </>
      )}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — HALLAZGO (lista preview + contexto)
// ════════════════════════════════════════════════════════════════════════════

function HallazgoResumen({ rows }: { rows: PersonAlert[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-purple-400 font-medium mb-2">
        EL EXPEDIENTE
      </p>
      <h3 className="text-xl md:text-2xl font-light text-white mb-4 leading-tight">
        Talento en zona crítica
      </h3>

      {/* Narrativa de 3 patas: rinde bien + cargo expuesto + no adaptable.
          Sin mencionar algoritmos (P12 — plato, no receta). */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl mb-6">
        Talento que rinde excelente hoy en cargos que la IA transforma. La
        evidencia de competencias dice que la reconversión no es viable. Sus
        mejores ejecutores de hoy son su mayor pasivo mañana.
      </p>

      <div className="space-y-2">
        {rows.map(p => (
          <div
            key={p.employeeId}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-700/20"
          >
            <Avatar name={p.employeeName} size={32} accent={L2_ACCENT} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {formatDisplayName(p.employeeName)}
              </p>
              <p className="text-xs text-slate-400 font-light truncate">
                {formatLabel(p.position)} · {formatLabel(p.departmentName)}
              </p>
            </div>
            {p.riskQuadrant && (
              <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-slate-400 font-light flex-shrink-0">
                {RISK_LABEL[p.riskQuadrant] ?? p.riskQuadrant}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — EXPEDIENTE LATERAL (3 stats del caso)
// ════════════════════════════════════════════════════════════════════════════

interface ExpedienteLateralProps {
  personsCount: number
  gapTotal: number
  pasivoLaboralHoy: number
}

function ExpedienteLateral({
  personsCount,
  gapTotal,
  pasivoLaboralHoy,
}: ExpedienteLateralProps) {
  return (
    <aside className="rounded-lg border border-slate-800/40 bg-slate-900/30 p-5 space-y-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">
        EN CIFRAS
      </p>

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {personsCount}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Personas en zona
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-white tabular-nums leading-tight">
          {formatCLP(gapTotal)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Costo pagado / mes
        </p>
      </div>

      <div className="h-px bg-slate-800/40" aria-hidden />

      <div>
        <p className="text-xl font-extralight text-amber-300/90 tabular-nums leading-tight">
          {formatCLP(pasivoLaboralHoy)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
          Pasivo laboral hoy
        </p>
      </div>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA ARRIBA — contexto emocional antes de las decisiones
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
// ACTO 3 — QUIRÓFANO SPLIT (Rail + Spotlight)
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoSplitProps {
  rows: PersonAlert[]
  personaActiva: PersonAlert | null
  onSelectPersona: (id: string) => void
  decisiones: Record<string, DecisionType | null>
  onDecision: (p: PersonAlert, t: DecisionType) => void
}

function QuirofanoSplit({
  rows,
  personaActiva,
  onSelectPersona,
  decisiones,
  onDecision,
}: QuirofanoSplitProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8">
      <RailPersonas
        rows={rows}
        activeId={personaActiva?.employeeId ?? null}
        onSelect={onSelectPersona}
        decisiones={decisiones}
      />
      {personaActiva && (
        <FichaRica
          persona={personaActiva}
          decision={decisiones[personaActiva.employeeId] ?? null}
          onChoose={tipo => onDecision(personaActiva, tipo)}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RAIL DE PERSONAS — desktop vertical · mobile horizontal scroll (swipe)
// ════════════════════════════════════════════════════════════════════════════

interface RailPersonasProps {
  rows: PersonAlert[]
  activeId: string | null
  onSelect: (id: string) => void
  decisiones: Record<string, DecisionType | null>
}

function RailPersonas({ rows, activeId, onSelect, decisiones }: RailPersonasProps) {
  return (
    <nav
      aria-label="Lista de personas"
      className="flex md:block overflow-x-auto md:overflow-x-visible md:max-h-[640px] md:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0"
    >
      {rows.map(p => {
        const isActive = p.employeeId === activeId
        const decision = decisiones[p.employeeId]
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
                    borderColor: `${L2_ACCENT}80`,
                    boxShadow: `inset 3px 0 0 ${L2_ACCENT}`,
                  }
                : { borderColor: 'rgba(51, 65, 85, 0.4)' }
            }
          >
            <Avatar name={p.employeeName} size={28} accent={L2_ACCENT} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {formatDisplayName(p.employeeName)}
              </p>
              <p className="text-[10px] font-light text-slate-500 truncate">
                {formatLabel(p.position)}
              </p>
            </div>
            {decision && (
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: DECISION_META[decision].color }}
                aria-label={`Decidido: ${DECISION_META[decision].label}`}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FICHA RICA — 5 secciones de contexto + sección decisión
// ════════════════════════════════════════════════════════════════════════════

interface FichaRicaProps {
  persona: PersonAlert
  decision: DecisionType | null
  onChoose: (tipo: DecisionType) => void
}

function FichaRica({ persona, decision, onChoose }: FichaRicaProps) {
  return (
    <motion.div
      key={persona.employeeId}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 min-w-0"
    >
      <SeccionIdentidad persona={persona} />
      <SeccionNarrativa persona={persona} />
      <SeccionRadiografia persona={persona} />
      <SeccionContexto persona={persona} />
      <SeccionRelojFinanciero persona={persona} />
      <SeccionDecision persona={persona} decision={decision} onChoose={onChoose} />
    </motion.div>
  )
}

// ── Sección 1: Identidad ────────────────────────────────────────────────────

function SeccionIdentidad({ persona }: { persona: PersonAlert }) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <Avatar name={persona.employeeName} size={56} accent={L2_ACCENT} />
        <div>
          <h3 className="text-xl md:text-2xl font-light text-white leading-tight">
            {formatDisplayName(persona.employeeName)}
          </h3>
          <p className="text-sm text-slate-400 font-light mt-0.5">
            {formatLabel(persona.position)} · {formatLabel(persona.departmentName)}
          </p>
          <p className="text-xs text-slate-500 font-light mt-1">
            Antigüedad: {formatTenure(persona.tenureMonths)}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Sección NARRATIVA — caso individual con datos interpolados ─────────────

function SeccionNarrativa({ persona }: { persona: PersonAlert }) {
  const nombre = formatDisplayName(persona.employeeName)
  const exposurePct = Math.round(effExposure(persona) * 100)
  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium mb-3">
        EL CASO
      </p>
      <p className="text-sm md:text-[15px] font-light text-slate-300 leading-relaxed max-w-3xl">
        {nombre} rinde excelente hoy y su valor no está en duda, pero la IA
        ya es capaz de absorber el {exposurePct}% de sus funciones actuales.
        El instinto natural es reubicar a este talento, pero el diagnóstico
        reciente de su líder directo advierte una baja adaptabilidad al cambio.
        Esto indica que es mucho menos probable que logre transferir su
        rendimiento a un rol distinto si lo comparamos con otros perfiles.
        No actuar hoy expone qué tan caro es postergar lo inevitable.
      </p>
    </section>
  )
}

// ── Sección 2: Radiografía ──────────────────────────────────────────────────

function SeccionRadiografia({ persona }: { persona: PersonAlert }) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium mb-3">
        RADIOGRAFÍA
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Dominio del cargo"
          value={`${Math.round(persona.roleFitScore)}%`}
        />
        <Stat
          label="Exposición IA"
          value={`${Math.round(effExposure(persona) * 100)}%`}
        />
        <Stat
          label="Adaptabilidad"
          value={labelAdaptabilidad(persona.potentialAbility)}
        />
      </div>
    </section>
  )
}

// ── Sección 3: Contexto (cuadrantes + metas + ADN) ──────────────────────────

function SeccionContexto({ persona }: { persona: PersonAlert }) {
  const hasChips =
    persona.riskQuadrant || persona.mobilityQuadrant || persona.nineBoxPosition
  if (!hasChips && persona.metasCompliance === null) return null

  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium mb-3">
        CONTEXTO
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {persona.riskQuadrant && (
          <Chip label={RISK_LABEL[persona.riskQuadrant] ?? persona.riskQuadrant} />
        )}
        {persona.mobilityQuadrant && (
          <Chip
            label={MOBILITY_LABEL[persona.mobilityQuadrant] ?? persona.mobilityQuadrant}
          />
        )}
        {persona.metasCompliance !== null && (
          <Chip label={`Metas ${Math.round(persona.metasCompliance)}%`} />
        )}
        {persona.nineBoxPosition && (
          <Chip label={getNineBoxLabel(persona.nineBoxPosition)} />
        )}
      </div>
    </section>
  )
}

// ── Sección 4: Reloj financiero ─────────────────────────────────────────────

function SeccionRelojFinanciero({ persona }: { persona: PersonAlert }) {
  const hoy = persona.finiquitoToday ?? 0
  const delta6 = persona.finiquitoIn6m - hoy
  const delta12 = persona.finiquitoIn12m - hoy

  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium mb-3">
        RELOJ FINANCIERO
      </p>
      <div className="rounded-lg border border-slate-800/40 bg-slate-900/30 divide-y divide-slate-800/40">
        <FilaReloj label="Hoy" valor={formatCLP(hoy)} delta={null} />
        <FilaReloj
          label="+6 meses"
          valor={formatCLP(persona.finiquitoIn6m)}
          delta={delta6 > 0 ? `+${formatCLP(delta6)}` : null}
        />
        <FilaReloj
          label="+12 meses"
          valor={formatCLP(persona.finiquitoIn12m)}
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
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
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

// ── Sección 5: Decisión — 3 escenarios como ToggleGroup mutuamente excluyente

function SeccionDecision({
  persona,
  decision,
  onChoose,
}: {
  persona: PersonAlert
  decision: DecisionType | null
  onChoose: (tipo: DecisionType) => void
}) {
  const someoneSelected = decision !== null

  return (
    <section>
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium mb-3">
        DECISIÓN
      </p>
      <div
        role="radiogroup"
        aria-label="Escenario de decisión"
        className="grid grid-cols-1 md:grid-cols-3 gap-2"
      >
        {(['congelar', 'reubicar', 'transicion'] as DecisionType[]).map(tipo => {
          const meta = DECISION_META[tipo]
          const Icon = meta.icon
          const isThisSelected = decision === tipo
          // Otras 2 cards atenuadas cuando hay una seleccionada (foco visual).
          const isDimmed = someoneSelected && !isThisSelected
          const ahorro = tipo === 'reubicar' ? 0 : persona.salary
          const finiquito = tipo === 'transicion' ? persona.finiquitoToday ?? 0 : 0

          // Estados explícitos del ToggleGroup (purple = accent F2 ruta_ejecucion):
          //   · default → border-slate-800
          //   · hover   → border-purple-400/50, cursor-pointer
          //   · selected→ border-purple-400, bg-purple-500/10, scale-[1.02]
          //   · dimmed  → opacity-50 (las otras 2 cuando hay una seleccionada)
          const cardClass = isThisSelected
            ? 'flex flex-col gap-2 p-3 rounded-lg text-left cursor-pointer transition-all border border-purple-400 bg-purple-500/10 scale-[1.02]'
            : isDimmed
            ? 'flex flex-col gap-2 p-3 rounded-lg text-left cursor-pointer transition-all border border-slate-800 bg-slate-900/40 opacity-50 hover:opacity-80 hover:border-purple-400/50'
            : 'flex flex-col gap-2 p-3 rounded-lg text-left cursor-pointer transition-all border border-slate-800 bg-slate-900/40 hover:border-purple-400/50'

          return (
            <button
              key={tipo}
              role="radio"
              aria-checked={isThisSelected}
              onClick={() => onChoose(tipo)}
              className={cardClass}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: meta.color }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: isThisSelected ? '#A78BFA' : '#e2e8f0' }}
                >
                  {meta.label}
                </span>
              </div>
              <div className="space-y-0.5 text-[11px] font-light tabular-nums">
                <p className="text-slate-400">
                  Ahorro:{' '}
                  <span className={ahorro > 0 ? 'text-emerald-300' : 'text-slate-300'}>
                    {`${formatCLP(ahorro)}/mes`}
                  </span>
                </p>
                <p className="text-slate-400">
                  Finiquito:{' '}
                  <span className={finiquito > 0 ? 'text-amber-300' : 'text-slate-300'}>
                    {formatCLP(finiquito)}
                  </span>
                </p>
                <p className="text-slate-500 leading-snug pt-1 normal-nums">
                  {meta.timing}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Feedback de registro — solo visible cuando hay decisión activa */}
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
  // Primero normalizar el nombre ("CARRASCO NUÑEZ MARTA" → "Marta Carrasco")
  // y después extraer iniciales ("MC"). Coherente con el resto del UI.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
        {label}
      </p>
      <p className="text-base font-light text-white tabular-nums">{value}</p>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-slate-700/50 bg-slate-800/40 text-slate-300 font-light">
      {label}
    </span>
  )
}
