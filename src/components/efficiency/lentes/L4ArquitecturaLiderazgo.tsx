// ════════════════════════════════════════════════════════════════════════════
// L4 — ARQUITECTURA DE LIDERAZGO (migrado a LenteLayout — 4 actos)
// src/components/efficiency/lentes/L4ArquitecturaLiderazgo.tsx
// ════════════════════════════════════════════════════════════════════════════
// Reemplaza el antiguo L4 "Cargos sin impacto" (Jaccard, baja frecuencia).
// Ahora analiza la arquitectura gerencial cruzando:
//   · Span de control vs arquetipo McKinsey (7 niveles granulares)
//   · Densidad gerencial organizacional
//   · Costo por FTE gestionado
//
// Patrón UI: Cinema Mode dentro del Acto Quirófano (clonado de L2/L9):
//   + Rail (240px) de managers fuera de rango (ROJA + AMARILLA)
//   + Spotlight ficha rica con sub-actos lectura → decisión
//
// Modo Estructural (sin cycleId): span + arquetipo + costo.
// Modo Completo (futuro): agrega perfilEvaluativo + metasEquipoPct.
//
// Matemática del carrito:
//   · Consolidar   → ahorroMes = salary, fte = 1 (elimina capa)
//   · Ampliar      → ahorroMes = 0 (no ahorra, reconfigura)
//   · Redistribuir → ahorroMes = 0
//   · Mantener     → ahorroMes = 0
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserMinus,
  UserPlus,
  ArrowRightLeft,
  Check,
  Circle,
  CheckCircle2,
} from 'lucide-react'
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
import { formatDisplayName, getInitials } from '@/lib/utils/formatName'
import type {
  OrgSpanIntelligence,
  SpanManagerProfile,
  SpanNarrativaZona,
} from '@/types/span'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
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
// ACCIONES DEL CARRITO
// ════════════════════════════════════════════════════════════════════════════

type AccionL4 = 'consolidar' | 'ampliar' | 'redistribuir' | 'mantener'

interface AccionMeta {
  label: string
  description: string
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  /** Si genera ahorro, cuál es el factor: 1 = salary completo, 0 = sin impacto */
  ahorroFactor: 0 | 1
}

const ACCION_META: Record<AccionL4, AccionMeta> = {
  consolidar: {
    label: 'Consolidar',
    description: 'Eliminar esta capa y reasignar su equipo al nivel superior.',
    color: '#22D3EE',
    icon: UserMinus,
    ahorroFactor: 1,
  },
  ampliar: {
    label: 'Ampliar equipo',
    description: 'Mantener la capa y sumarle responsabilidades del peer.',
    color: '#A78BFA',
    icon: UserPlus,
    ahorroFactor: 0,
  },
  redistribuir: {
    label: 'Redistribuir',
    description: 'Dividir el equipo entre jefaturas pares.',
    color: '#F59E0B',
    icon: ArrowRightLeft,
    ahorroFactor: 0,
  },
  mantener: {
    label: 'Mantener',
    description: 'Estructura saludable — sin acción inmediata.',
    color: '#10B981',
    icon: Check,
    ahorroFactor: 0,
  },
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const L4_ACCENT = '#22D3EE' // capital_en_riesgo (familia F1)

const ZONA_COLOR: Record<SpanNarrativaZona, string> = {
  VERDE: '#10B981',
  AMARILLA: '#F59E0B',
  ROJA: '#EF4444',
}

const ZONA_LABEL: Record<SpanNarrativaZona, string> = {
  VERDE: 'Estructura saludable',
  AMARILLA: 'Revisable',
  ROJA: 'Fuera de rango',
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA MACRO
// ════════════════════════════════════════════════════════════════════════════

function narrativaDinamica(total: number, tomadas: number): string {
  if (tomadas === 0)
    return 'Cada jefatura tiene un arquetipo y un rango. Cuando el span se aleja del arquetipo, el costo se descoloca. La decisión es tuya.'
  if (tomadas < Math.ceil(total / 2))
    return `${tomadas} de ${total} decididas. Cada capa es un caso distinto — no hay consolidación genérica.`
  if (tomadas < total)
    return 'Más de la mitad del expediente cerrado. Los pendientes esperan tu criterio.'
  return `${total} decisiones tomadas. Lo siguiente es conversar con cada jefatura antes de ejecutar.`
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function L4ArquitecturaLiderazgo({
  lente,
  decisionesActuales,
  onUpsert,
  onRemove,
  onNextLente,
  proximoLenteTitulo,
  onActChange,
}: LenteComponentProps) {
  const detalle = lente.detalle as OrgSpanIntelligence | null
  const toast = useToast()

  const [managerActivoId, setManagerActivoId] = useState<string | null>(null)
  const [accionesByManager, setAccionesByManager] = useState<
    Record<string, AccionL4 | null>
  >({})

  // Hidrata desde carrito (convención sufijo · acción)
  useEffect(() => {
    const inicial: Record<string, AccionL4 | null> = {}
    for (const d of decisionesActuales) {
      const match = d.nombre.match(/· (consolidar|ampliar|redistribuir|mantener)$/)
      if (match) inicial[d.id] = match[1] as AccionL4
    }
    setAccionesByManager(prev =>
      Object.keys(prev).length === 0 ? inicial : prev
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Managers decidibles = ROJA + AMARILLA (VERDE no requiere acción)
  const managersDecidibles = useMemo(() => {
    if (!detalle?.managers) return []
    return detalle.managers.filter(
      m => m.narrativa.zona === 'ROJA' || m.narrativa.zona === 'AMARILLA'
    )
  }, [detalle])

  // Manager activo default = primero decidible
  useEffect(() => {
    if (managersDecidibles.length === 0) {
      if (managerActivoId !== null) setManagerActivoId(null)
      return
    }
    const stillValid = managersDecidibles.some(
      m => m.managerId === managerActivoId
    )
    if (!stillValid) {
      setManagerActivoId(managersDecidibles[0].managerId)
    }
  }, [managersDecidibles, managerActivoId])

  if (!lente.hayData || !detalle || detalle.managers.length === 0) {
    return (
      <LenteCard lente={lente} estado="vacio">
        {null}
      </LenteCard>
    )
  }

  const handleAccion = (m: SpanManagerProfile, accion: AccionL4) => {
    const current = accionesByManager[m.managerId]
    const isToggleOff = current === accion
    const displayName = formatDisplayName(m.managerName)

    setAccionesByManager(prev => ({
      ...prev,
      [m.managerId]: isToggleOff ? null : accion,
    }))

    if (isToggleOff) {
      onRemove(decisionKey({ tipo: 'cargo', id: m.managerId }))
      toast.info(`${displayName} salió del plan`, 'Decisión removida')
      return
    }

    const meta = ACCION_META[accion]
    const ahorroMes = meta.ahorroFactor === 1 ? m.salarioManager : 0

    const item: DecisionItem = {
      id: m.managerId,
      lenteId: 'l4_fantasma',
      tipo: 'cargo',
      nombre: `${m.managerName} · ${accion}`,
      gerencia: m.gerenciaNombre,
      ahorroMes,
      finiquito: 0,
      fteEquivalente: meta.ahorroFactor,
      narrativa: `${lente.narrativa}\n\nAcción: ${meta.label} sobre ${m.managerName}. ${meta.description}`,
      aprobado: false,
    }
    onUpsert(item)
    toast.success(
      `${displayName} → ${meta.label}${ahorroMes > 0 ? ` · Ahorro ${formatCLP(ahorroMes)}/mes` : ''}`,
      'Decisión registrada'
    )
  }

  // ─── Derivados reactivos ────────────────────────────────────────────────
  const tomadas = Object.values(accionesByManager).filter(v => v !== null).length
  const hasInteraction = tomadas > 0

  const ahorroMensualTotal = managersDecidibles.reduce((s, m) => {
    const a = accionesByManager[m.managerId]
    if (!a) return s
    const factor = ACCION_META[a].ahorroFactor
    return s + m.salarioManager * factor
  }, 0)

  const capasEliminadas = managersDecidibles.reduce((n, m) => {
    return accionesByManager[m.managerId] === 'consolidar' ? n + 1 : n
  }, 0)

  const checkpointSummary = hasInteraction
    ? {
        items: managersDecidibles
          .filter(m => {
            const a = accionesByManager[m.managerId]
            return (
              a === 'consolidar' ||
              a === 'ampliar' ||
              a === 'redistribuir' ||
              a === 'mantener'
            )
          })
          .map(m => {
            const accion = accionesByManager[m.managerId]!
            const meta = ACCION_META[accion]
            const ahorro = meta.ahorroFactor === 1 ? m.salarioManager : 0
            return {
              label: `${formatDisplayName(m.managerName)} · ${formatLabel(m.cargo)}`,
              detail: meta.label,
              value: ahorro > 0 ? `${formatCLP(ahorro)}/mes` : '—',
            }
          }),
        totalLabel: `${tomadas} ${tomadas === 1 ? 'decisión' : 'decisiones'} en tu plan`,
        totalValue: `Ahorro ${formatCLP(ahorroMensualTotal)}/mes`,
      }
    : undefined

  const managerActivo = managerActivoId
    ? managersDecidibles.find(m => m.managerId === managerActivoId) ?? null
    : null

  return (
    <LenteLayout
      familiaAccent={L4_ACCENT}
      heroValue={detalle.org.heroValue}
      heroUnit={detalle.org.heroUnit}
      narrativaPuente="La estructura no es un organigrama — es la forma en que el costo de gestión se distribuye en tu empresa. Ver caso por caso permite separar las capas que valen lo que cuestan de las que no."
      ctaSimularLabel="Ver managers fuera de rango"
      ctaQuirofanoEyebrow="EXPEDIENTE DE LIDERAZGO"
      hasInteraction={hasInteraction}
      checkpointSummary={checkpointSummary}
      onNextLente={onNextLente}
      proximoLenteTitulo={proximoLenteTitulo}
      onActChange={onActChange}
      totalizador={{
        metricas: [
          {
            label: 'Jefaturas decididas',
            value: `${tomadas} / ${managersDecidibles.length}`,
            tint: 'accent',
          },
          {
            label: 'Ahorro mensual',
            value: `${formatCLP(ahorroMensualTotal)}/mes`,
            tint: 'emerald',
          },
          {
            label: 'Capas eliminadas',
            value: `${capasEliminadas}`,
            tint: 'accent',
          },
          {
            label: 'Densidad futura',
            value: (() => {
              const d =
                detalle.org.totalFTE > 0
                  ? (detalle.org.totalManagers - capasEliminadas) /
                    detalle.org.totalFTE
                  : 0
              return `${(d * 100).toFixed(0)}%`
            })(),
          },
        ],
      }}
      renderHallazgo={() => <HallazgoZonas data={detalle} />}
      // renderExpediente intencionalmente omitido — L4 mete las cifras
      // dentro del HallazgoZonas como fila horizontal superior. Esto
      // libera el aside del 30% para que las 3 cards de zonas usen
      // el ancho completo del lente (su grid 3-cols se ahogaba en 33%).
      renderQuirofano={() => {
        if (managersDecidibles.length === 0) {
          return (
            <div className="rounded-[20px] border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-2xl p-6 md:p-8 max-w-2xl">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-medium mb-2">
                ESTRUCTURA SALUDABLE
              </p>
              <p className="text-sm md:text-base font-light text-emerald-100 leading-relaxed">
                Todas tus jefaturas operan dentro del rango óptimo de su
                arquetipo. No hay capas que requieran decisión estructural hoy.
              </p>
            </div>
          )
        }
        return (
          <>
            <NarrativaContextoArriba
              mensaje={narrativaDinamica(managersDecidibles.length, tomadas)}
            />
            <QuirofanoSplit
              rows={managersDecidibles}
              managerActivo={managerActivo}
              onSelectManager={setManagerActivoId}
              acciones={accionesByManager}
              onAccion={handleAccion}
            />
          </>
        )
      }}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — HALLAZGO: 4 cards de distribución + densidad
// ════════════════════════════════════════════════════════════════════════════

function HallazgoZonas({ data }: { data: OrgSpanIntelligence }) {
  const total = data.managers.length
  const tieneCapasSuboptimas = data.org.costoCapasSuboptimas > 0

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium mb-2">
        EL MAPA
      </p>
      <h3 className="text-xl md:text-2xl font-extralight text-white mb-4 leading-tight">
        Tu pirámide,{' '}
        <span className="fhr-title-gradient">por calidad estructural</span>
      </h3>
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-2xl mb-6">
        No todas las jefaturas pesan igual. Unas operan en su rango óptimo
        y producen; otras están fuera de arquetipo y acumulan costo sin
        gestión real.
      </p>

      {/* CIFRAS — fila horizontal arriba (antes vivían en ExpedienteLateral
          aside). Pasaron acá para liberar el ancho del 30% del aside,
          que ahogaba las 3 ZonaCards a 33% del ancho del lente. */}
      <div
        className={`grid grid-cols-2 ${tieneCapasSuboptimas ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 md:gap-4 mb-6`}
      >
        <CifraCard
          value={String(data.org.totalManagers)}
          label="Jefaturas activas"
        />
        <CifraCard
          value={`${(data.org.densidadGerencial * 100).toFixed(0)}%`}
          label="Densidad gerencial"
        />
        <CifraCard
          value={formatCLP(data.org.costoFTEpromedio)}
          label="Costo por FTE gestionado (prom.)"
        />
        {tieneCapasSuboptimas && (
          <CifraCard
            value={formatCLP(data.org.costoCapasSuboptimas)}
            label="Capas subóptimas / mes"
            tone="amber"
          />
        )}
      </div>

      {/* 3 ZonaCards — ahora a todo el ancho del lente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <ZonaCard
          zona="ROJA"
          count={data.org.managersEnRojo}
          total={total}
          descripcion="Capas fuera del rango estructural o con equipo mínimo. Requieren decisión."
        />
        <ZonaCard
          zona="AMARILLA"
          count={data.org.managersEnAmarillo}
          total={total}
          descripcion="Span revisable. La decisión depende de contexto — consolidar, ampliar o redistribuir."
        />
        <ZonaCard
          zona="VERDE"
          count={data.org.managersEnVerde}
          total={total}
          descripcion="Operan en su rango óptimo. Estructura saludable, no requieren intervención hoy."
        />
      </div>

      {/* Narrativa densidad */}
      {data.org.densidadNarrativa && (
        <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">
            DENSIDAD GERENCIAL
          </p>
          <p className="text-sm md:text-[15px] font-light text-slate-300 leading-relaxed">
            {data.org.densidadNarrativa}
          </p>
        </div>
      )}
    </div>
  )
}

/** Card compacta de cifra para la fila horizontal del Hallazgo. */
function CifraCard({
  value,
  label,
  tone = 'default',
}: {
  value: string
  label: string
  tone?: 'default' | 'amber'
}) {
  const valueClass =
    tone === 'amber' ? 'text-amber-300/90' : 'text-white'
  return (
    <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6">
      <p
        className={`text-2xl md:text-3xl font-extralight ${valueClass} tabular-nums leading-tight`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1.5">
        {label}
      </p>
    </div>
  )
}

function ZonaCard({
  zona,
  count,
  total,
  descripcion,
}: {
  zona: SpanNarrativaZona
  count: number
  total: number
  descripcion: string
}) {
  const color = ZONA_COLOR[zona]
  const label = ZONA_LABEL[zona]
  const isUrgente = zona === 'ROJA'

  return (
    <div
      className="rounded-[20px] border bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6"
      style={{
        borderColor: isUrgente ? `${color}50` : 'rgb(30 41 59)',
        boxShadow: isUrgente ? `inset 3px 0 0 ${color}` : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium truncate" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-3">
        <p className="text-3xl font-extralight text-white tabular-nums leading-none">
          {count}
        </p>
        <p className="text-xs text-slate-500 font-light">
          de {total} {total === 1 ? 'manager' : 'managers'}
        </p>
      </div>

      <p className="text-xs text-slate-400 font-light leading-relaxed">
        {descripcion}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA ARRIBA
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
// QUIRÓFANO SPLIT — Rail + Spotlight (patrón L2/L9)
// ════════════════════════════════════════════════════════════════════════════

interface QuirofanoSplitProps {
  rows: SpanManagerProfile[]
  managerActivo: SpanManagerProfile | null
  onSelectManager: (id: string) => void
  acciones: Record<string, AccionL4 | null>
  onAccion: (m: SpanManagerProfile, a: AccionL4) => void
}

function QuirofanoSplit({
  rows,
  managerActivo,
  onSelectManager,
  acciones,
  onAccion,
}: QuirofanoSplitProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8">
      <RailManagers
        rows={rows}
        activeId={managerActivo?.managerId ?? null}
        onSelect={onSelectManager}
        acciones={acciones}
      />
      {managerActivo && (
        <FichaRica
          manager={managerActivo}
          accion={acciones[managerActivo.managerId] ?? null}
          onChoose={a => onAccion(managerActivo, a)}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// RAIL DE MANAGERS
// ════════════════════════════════════════════════════════════════════════════

interface RailManagersProps {
  rows: SpanManagerProfile[]
  activeId: string | null
  onSelect: (id: string) => void
  acciones: Record<string, AccionL4 | null>
}

function RailManagers({ rows, activeId, onSelect, acciones }: RailManagersProps) {
  return (
    <nav
      aria-label="Lista de jefaturas"
      className="flex md:block overflow-x-auto md:overflow-x-visible md:max-h-[640px] md:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0"
    >
      {rows.map(m => {
        const isActive = m.managerId === activeId
        const accion = acciones[m.managerId]
        return (
          <button
            key={m.managerId}
            onClick={() => onSelect(m.managerId)}
            className={`flex-shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors text-left min-w-[200px] md:min-w-0 ${
              isActive
                ? 'bg-slate-800/50'
                : 'bg-transparent hover:bg-slate-800/30'
            }`}
            style={
              isActive
                ? {
                    borderColor: `${L4_ACCENT}80`,
                    boxShadow: `inset 3px 0 0 ${L4_ACCENT}`,
                  }
                : { borderColor: 'rgba(51, 65, 85, 0.4)' }
            }
          >
            <Avatar name={m.managerName} size={28} accent={L4_ACCENT} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {formatDisplayName(m.managerName)}
              </p>
              <p className="text-[10px] font-light text-slate-500 truncate">
                {formatLabel(m.cargo)} · {m.spanActual}{' '}
                {m.spanActual === 1 ? 'directo' : 'directos'}
              </p>
            </div>
            {accion && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: L4_ACCENT }}
                aria-label={`Decidido: ${ACCION_META[accion].label}`}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FICHA RICA — sub-actos lectura → decisión
// ════════════════════════════════════════════════════════════════════════════

interface FichaRicaProps {
  manager: SpanManagerProfile
  accion: AccionL4 | null
  onChoose: (a: AccionL4) => void
}

function FichaRica({ manager, accion, onChoose }: FichaRicaProps) {
  const [vista, setVista] = useState<'lectura' | 'decision'>('lectura')

  useEffect(() => {
    setVista('lectura')
  }, [manager.managerId])

  return (
    <div className="min-w-0">
      <AnimatePresence mode="wait">
        {vista === 'lectura' ? (
          <FichaLectura
            key={`lectura-${manager.managerId}`}
            manager={manager}
            accion={accion}
            onDecidir={() => setVista('decision')}
          />
        ) : (
          <FichaDecision
            key={`decision-${manager.managerId}`}
            manager={manager}
            accion={accion}
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
  manager,
  accion,
  onDecidir,
}: {
  manager: SpanManagerProfile
  accion: AccionL4 | null
  onDecidir: () => void
}) {
  const first =
    formatDisplayName(manager.managerName).split(' ')[0] ||
    formatDisplayName(manager.managerName)
  const yaDecidido = accion !== null
  const meta = accion ? ACCION_META[accion] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 md:space-y-10"
    >
      <SeccionIdentidad manager={manager} />
      <SeccionRadiografiaSpan manager={manager} />
      <SeccionPerfilEvaluativo manager={manager} />
      <SeccionNarrativaCaso manager={manager} />
      <SeccionCosto manager={manager} />

      <div className="pt-2">
        {yaDecidido && meta ? (
          <button
            onClick={onDecidir}
            className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 rounded-[20px] border border-solid border-cyan-400/40 bg-cyan-500/5 hover:bg-cyan-500/10 backdrop-blur-2xl transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-0.5">
                  Tu decisión actual
                </p>
                <p className="text-sm font-light text-cyan-300">{meta.label}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-cyan-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
              Cambiar →
            </span>
          </button>
        ) : (
          <button
            onClick={onDecidir}
            className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 rounded-[20px] border border-dashed border-slate-700 bg-[#0F172A]/90 backdrop-blur-2xl hover:border-cyan-400/60 hover:bg-cyan-500/5 transition-colors text-left cursor-pointer"
          >
            <span className="text-sm font-light text-slate-200">
              Decidir sobre la capa de {first}
            </span>
            <span className="text-cyan-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
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
  manager,
  accion,
  onChoose,
  onVolver,
}: {
  manager: SpanManagerProfile
  accion: AccionL4 | null
  onChoose: (a: AccionL4) => void
  onVolver: () => void
}) {
  const displayName = formatDisplayName(manager.managerName)

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
        <Avatar name={manager.managerName} size={44} accent={L4_ACCENT} />
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-light text-white leading-tight truncate">
            {displayName}
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5 truncate">
            {formatLabel(manager.cargo)} ·{' '}
            {formatLabel(manager.gerenciaNombre)} · {manager.spanActual}{' '}
            {manager.spanActual === 1 ? 'directo' : 'directos'}
          </p>
        </div>
      </div>

      <SeccionDecision manager={manager} accion={accion} onChoose={onChoose} />
    </motion.div>
  )
}

// ── Sección 1: Identidad ───────────────────────────────────────────────────

function SeccionIdentidad({ manager }: { manager: SpanManagerProfile }) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <Avatar name={manager.managerName} size={56} accent={L4_ACCENT} />
        <div className="min-w-0">
          <h3 className="text-xl md:text-2xl font-light text-white leading-tight">
            {formatDisplayName(manager.managerName)}
          </h3>
          <p className="text-sm text-slate-400 font-light mt-0.5">
            {formatLabel(manager.cargo)} ·{' '}
            {formatLabel(manager.gerenciaNombre)}
          </p>
          <p className="text-xs text-slate-500 font-light mt-1">
            Antigüedad en rol: {formatTenure(manager.tenureMeses)}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Sección 2: Radiografía de span ─────────────────────────────────────────

function SeccionRadiografiaSpan({ manager }: { manager: SpanManagerProfile }) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        RADIOGRAFÍA DE SPAN
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Span actual" value={String(manager.spanActual)} />
        <Stat
          label="Rango óptimo"
          value={`${manager.rangoOptimo.min}-${manager.rangoOptimo.max}`}
        />
        <TooltipContext
          variant="pattern"
          position="top"
          usePortal
          title="Arquetipo McKinsey"
          explanation="Naturaleza del trabajo gerencial según la familia de cargos del equipo."
          details={[
            'Player/Coach: gerentes estratégicos, equipo diverso (span 3-6)',
            'Coach: subgerentes, balance individual+equipo (span 4-8)',
            'Supervisor: jefes, responsabilidad individual (span 5-10)',
            'Facilitator: supervisores, trabajo estandarizado (span 8-14)',
            'Coordinator: operativos, tareas repetitivas (span 10-20)',
          ]}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">
              Arquetipo
            </p>
            <p className="text-base font-light text-white">
              {manager.rangoOptimo.arquetipo}
            </p>
          </div>
        </TooltipContext>
      </div>
    </section>
  )
}

// ── Sección 3: Narrativa "EL CASO" ─────────────────────────────────────────

function SeccionNarrativaCaso({ manager }: { manager: SpanManagerProfile }) {
  const color = ZONA_COLOR[manager.narrativa.zona]
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        EL CASO
      </p>
      <div
        className="rounded-[20px] border bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6"
        style={{
          borderColor: `${color}40`,
          boxShadow:
            manager.narrativa.zona === 'ROJA'
              ? `inset 3px 0 0 ${color}`
              : undefined,
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-wider mb-2"
          style={{ color }}
        >
          {manager.narrativa.titulo}
        </p>
        <p className="text-sm md:text-[15px] font-light text-slate-300 leading-relaxed max-w-3xl">
          {manager.narrativa.narrativa}
        </p>
        {manager.narrativa.consecuencia && (
          <p className="text-xs text-slate-400 font-light tabular-nums leading-snug mt-3">
            {manager.narrativa.consecuencia}
          </p>
        )}
      </div>
    </section>
  )
}

// ── Sección 4: Perfil evaluativo + resultados del equipo (Modo Completo) ──

function SeccionPerfilEvaluativo({
  manager,
}: {
  manager: SpanManagerProfile
}) {
  // En Modo Estructural (sin cycleId): todos los campos son null,
  // la sección no se renderiza — el lente funciona sin prerequisitos.
  const tieneAlgo =
    manager.perfilEvaluativo !== null ||
    manager.metasEquipoPct !== null ||
    manager.roleFitPromedio !== null
  if (!tieneAlgo) return null

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        PERFIL EVALUATIVO Y RESULTADOS DEL EQUIPO
      </p>
      <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl p-5 md:p-6 space-y-5">
        {manager.perfilEvaluativo !== null && (
          <div>
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <TooltipContext
                variant="pattern"
                position="top"
                usePortal
                title="Perfil evaluativo"
                explanation="Cómo evalúa el manager a su equipo según la distribución de scores."
                details={[
                  'ÓPTIMA: distribución equilibrada, criterio calibrado.',
                  'CENTRAL: agrupa a todos en puntajes medios — falta diferenciación.',
                  'SEVERA: promedio bajo, estándares exigentes.',
                  'INDULGENTE: promedio alto, poca diferenciación por arriba.',
                ]}
              >
                <span className="text-sm font-medium text-white tracking-wide">
                  {formatPerfilLabel(manager.perfilEvaluativo)}
                </span>
              </TooltipContext>
              {manager.avgScore !== null && (
                <span className="text-xs text-slate-400 font-light tabular-nums">
                  Promedio evaluaciones:{' '}
                  <span className="text-slate-200">
                    {manager.avgScore.toFixed(2)}
                  </span>{' '}
                  / 5
                </span>
              )}
            </div>
          </div>
        )}

        {(manager.metasEquipoPct !== null || manager.roleFitPromedio !== null) && (
          <div className="grid grid-cols-2 gap-4">
            {manager.metasEquipoPct !== null && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
                  Cumplimiento de metas
                </p>
                <p className="text-lg font-extralight text-white tabular-nums">
                  {Math.round(manager.metasEquipoPct)}%
                </p>
              </div>
            )}
            {manager.roleFitPromedio !== null && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
                  Dominio del cargo (prom.)
                </p>
                <p className="text-lg font-extralight text-white tabular-nums">
                  {Math.round(manager.roleFitPromedio)}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function formatPerfilLabel(perfil: NonNullable<SpanManagerProfile['perfilEvaluativo']>): string {
  switch (perfil) {
    case 'OPTIMA': return 'Óptima'
    case 'CENTRAL': return 'Central'
    case 'SEVERA': return 'Severa'
    case 'INDULGENTE': return 'Indulgente'
  }
}

// ── Sección 5: Costo de la capa ────────────────────────────────────────────

function SeccionCosto({ manager }: { manager: SpanManagerProfile }) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3">
        COSTO DE LA CAPA
      </p>
      <div className="rounded-[20px] border border-slate-800 bg-[#0F172A]/90 backdrop-blur-2xl divide-y divide-slate-800/60 overflow-hidden">
        <FilaCosto
          label="Salario estimado"
          valor={`${formatCLP(manager.salarioManager)}/mes`}
        />
        <FilaCosto
          label="Costo por FTE gestionado"
          valor={`${formatCLP(manager.costoFTEgestionado)}/mes`}
        />
        <FilaCosto
          label="Costo anual de esta capa"
          valor={formatCLP(manager.salarioManager * 12)}
        />
      </div>
      <p className="text-[11px] text-slate-500 font-light leading-snug mt-2 italic">
        Salario estimado por arquetipo, no por persona. Comparativa entre
        managers del mismo nivel.
      </p>
    </section>
  )
}

function FilaCosto({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 md:px-6 py-3">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
        {label}
      </span>
      <span className="text-sm text-white font-light tabular-nums">{valor}</span>
    </div>
  )
}

// ── Sección 5: Decisión — 4 acciones ToggleGroup ───────────────────────────

function SeccionDecision({
  manager,
  accion,
  onChoose,
}: {
  manager: SpanManagerProfile
  accion: AccionL4 | null
  onChoose: (a: AccionL4) => void
}) {
  const someoneSelected = accion !== null
  const first =
    formatDisplayName(manager.managerName).split(' ')[0] ||
    formatDisplayName(manager.managerName)
  const accionSugeridaNormalizada = manager.narrativa.accionSugerida
    .toLowerCase()
    .includes('consolidar')
    ? 'consolidar'
    : manager.narrativa.accionSugerida.toLowerCase().includes('ampliar')
      ? 'ampliar'
      : manager.narrativa.accionSugerida.toLowerCase().includes('redistribuir')
        ? 'redistribuir'
        : 'mantener'

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-4">
        ELIGE UNA RUTA
      </p>

      <div
        role="radiogroup"
        aria-label="Acción sobre la capa"
        className="space-y-3"
      >
        {(['consolidar', 'ampliar', 'redistribuir', 'mantener'] as AccionL4[]).map(
          a => {
            const meta = ACCION_META[a]
            const Icon = meta.icon
            const isThisSelected = accion === a
            const isDimmed = someoneSelected && !isThisSelected
            const isSugerida = a === accionSugeridaNormalizada
            const ahorro = meta.ahorroFactor === 1 ? manager.salarioManager : 0

            const cardBase =
              'w-full text-left p-5 md:p-6 rounded-[20px] backdrop-blur-2xl cursor-pointer transition-all duration-200'
            const cardClass = isThisSelected
              ? `${cardBase} border border-solid border-cyan-400 bg-cyan-500/10`
              : isDimmed
                ? `${cardBase} border border-dashed border-slate-800 bg-[#0F172A]/90 opacity-50 hover:opacity-90 hover:border-slate-600`
                : `${cardBase} border border-dashed border-slate-700 bg-[#0F172A]/90 hover:border-slate-600`

            return (
              <button
                key={a}
                role="radio"
                aria-checked={isThisSelected}
                onClick={() => onChoose(a)}
                className={cardClass}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  {isThisSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isThisSelected ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium uppercase tracking-wider ${
                      isThisSelected ? 'text-cyan-400' : 'text-slate-300'
                    }`}
                  >
                    {meta.label}
                  </span>
                  {isSugerida && !isThisSelected && (
                    <span className="text-[10px] uppercase tracking-widest text-cyan-400/70 font-medium ml-auto">
                      sugerida
                    </span>
                  )}
                </div>

                <p className="text-sm font-light text-slate-300 leading-relaxed mb-4 max-w-2xl">
                  {a === 'consolidar' &&
                    `Eliminar esta capa y reasignar a los ${manager.spanActual} directos de ${first} al nivel superior.`}
                  {a === 'ampliar' &&
                    `Mantener a ${first} en su rol y sumarle responsabilidades equivalentes de un peer con span sub-óptimo.`}
                  {a === 'redistribuir' &&
                    `Dividir el equipo de ${first} entre jefaturas pares con capacidad disponible.`}
                  {a === 'mantener' &&
                    `Preservar la capa como está. La estructura funciona a pesar de estar fuera del rango óptimo.`}
                </p>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
                    Consecuencia
                  </p>
                  <p className="text-xs text-slate-400 font-light tabular-nums leading-snug">
                    {ahorro > 0
                      ? `Ahorro ${formatCLP(ahorro)}/mes · 1 capa eliminada`
                      : 'Sin ahorro directo · reconfiguración estructural'}
                  </p>
                </div>
              </button>
            )
          }
        )}
      </div>
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
