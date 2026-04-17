'use client'

// ════════════════════════════════════════════════════════════════════════════
// TASK FORENSIC CARD — fila de tarea del Simulador de Cargos IA
// atomos/TaskForensicCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// REDISEÑO según evaluación aprobada (sesión actual):
//
//   ❌ Eliminado: ícono Sparkles/CircleDot/Lock (no aportan info)
//   ❌ Eliminado: badge duplicado "PERSONAS + IA · TECHO 50%" (ya en header)
//   ❌ Eliminado: label "ASISTIDO" en caps (redundante con zona)
//   ❌ Eliminado: texto "0/3h delegadas" (CEO piensa en pesos, no horas)
//   ❌ Eliminado: RightSideCard separado a la derecha
//
//   ✅ Tesla line al borde top del card (no dentro del padding)
//   ✅ Slider full-width con monto + velocímetro INLINE al final
//   ✅ Monto crece visualmente: text-base md:text-xl font-extralight
//   ✅ Velocímetro mini 24×12 px solo cuando hay slider movido
//   ✅ β=0 sin slider, una sola línea inferior con todo el dato
//
// MOBILE 375px:
//   - Slider: flex-1 min-w-0 → toma todo el espacio restante
//   - Monto: text-base (mobile) → text-xl (md+)
//   - Velocímetro mini: 24×12 fijo
//   - Total ancho mínimo zona derecha: ~85px (cabe en 375px - 24px padding)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categorizeTask, type ForensicTask } from '../descriptor-simulator-utils'
import type { AnthropicDimensionData } from '@/app/api/descriptors/[id]/simulator/route'

interface TaskForensicCardProps {
  task: ForensicTask
  costPerHour: number
  onHoursChange: (taskId: string, newHours: number) => void
}

export default memo(function TaskForensicCard({
  task,
  costPerHour,
  onHoursChange,
}: TaskForensicCardProps) {
  const cat = categorizeTask(task)

  if (cat === 'soberania') {
    return <SoberaniaCard task={task} costPerHour={costPerHour} />
  }
  if (cat === 'aumentado') {
    return (
      <AumentadoCard
        task={task}
        costPerHour={costPerHour}
        onHoursChange={onHoursChange}
      />
    )
  }
  return (
    <RescateCard task={task} costPerHour={costPerHour} onHoursChange={onHoursChange} />
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// CARD SHELL — wrapper común con Tesla line al borde superior
// ─────────────────────────────────────────────────────────────────────────────

function CardShell({
  children,
  className,
  teslaColor,
}: {
  children: React.ReactNode
  className?: string
  /** Color de la línea Tesla al borde top. undefined = sin línea. */
  teslaColor?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-xl border backdrop-blur-md px-3.5 py-3',
        'transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg',
        'overflow-hidden',
        className,
      )}
    >
      {/* Tesla line full-width al borde top — pegada al edge, no dentro del padding */}
      {teslaColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
            boxShadow: `0 0 12px ${teslaColor}`,
          }}
        />
      )}
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// β=0 — SOLO PERSONAS · sin slider · línea inferior con horas
// ─────────────────────────────────────────────────────────────────────────────
// Sin Tesla line. Color completamente neutro (slate). El monto NO aparece
// aquí — el footer agrega el cargo total.
// ─────────────────────────────────────────────────────────────────────────────

function SoberaniaCard({ task }: { task: ForensicTask; costPerHour: number }) {
  return (
    <CardShell className="border-slate-800/40 bg-slate-900/40 opacity-60 hover:opacity-80">
      <TaskHeader task={task} textClass="text-sm font-light text-slate-300 leading-snug" />

      {task.classificationPhrase && (
        <ClassificationPhrase text={task.classificationPhrase} />
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-light text-slate-500">
          Trabajo humano · {task.hoursPerMonth} h/mes
        </p>
        <IpiSemaforoBadge
          ipi={task.ipi}
          level={task.ipiSemaforo}
          perfil={task.perfilLabel}
          anthropicData={task.anthropicData}
        />
      </div>
    </CardShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// β=0.5 — PERSONAS + IA · slider techo 50% · monto + gauge inline
// ─────────────────────────────────────────────────────────────────────────────

function AumentadoCard({
  task,
  onHoursChange,
}: {
  task: ForensicTask
  costPerHour: number
  onHoursChange: (id: string, hours: number) => void
}) {
  const maxDelegated = Math.floor(task.originalHours * 0.5)
  const delegatedHours = task.originalHours - task.hoursPerMonth

  const handleSlider = (newDelegated: number) => {
    const clamped = Math.max(0, Math.min(maxDelegated, newDelegated))
    onHoursChange(task.taskId, task.originalHours - clamped)
  }

  return (
    <CardShell
      className="border-slate-800/40 bg-slate-900/40 hover:border-slate-700/60"
      teslaColor="#A78BFA"
    >
      <TaskHeader task={task} textClass="text-sm font-light text-slate-100 leading-snug" />

      {task.classificationPhrase && (
        <ClassificationPhrase text={task.classificationPhrase} />
      )}

      <div className="mt-4">
        <SliderRow
          delegated={delegatedHours}
          max={maxDelegated}
          ipi={task.ipi}
          semaforo={task.ipiSemaforo}
          perfil={task.perfilLabel}
          anthropicData={task.anthropicData}
          accent="purple"
          onChange={handleSlider}
        />
      </div>
    </CardShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// β=1.0 — DELEGABLE A IA · slider techo 100% · monto + gauge inline
// ─────────────────────────────────────────────────────────────────────────────

function RescateCard({
  task,
  onHoursChange,
}: {
  task: ForensicTask
  costPerHour: number
  onHoursChange: (id: string, hours: number) => void
}) {
  const maxDelegated = task.originalHours
  const delegatedHours = task.originalHours - task.hoursPerMonth

  const handleSlider = (newDelegated: number) => {
    const clamped = Math.max(0, Math.min(maxDelegated, newDelegated))
    onHoursChange(task.taskId, task.originalHours - clamped)
  }

  return (
    <CardShell
      className="border-slate-800/40 bg-slate-900/40 hover:border-slate-700/60"
      teslaColor="#22D3EE"
    >
      <TaskHeader task={task} textClass="text-sm font-light text-white leading-snug" />

      {task.classificationPhrase && (
        <ClassificationPhrase text={task.classificationPhrase} />
      )}

      <div className="mt-4">
        <SliderRow
          delegated={delegatedHours}
          max={maxDelegated}
          ipi={task.ipi}
          semaforo={task.ipiSemaforo}
          perfil={task.perfilLabel}
          anthropicData={task.anthropicData}
          accent="cyan"
          onChange={handleSlider}
        />
      </div>
    </CardShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK HEADER — descripción + badge "verificado Anthropic" (Brain púrpura)
// ─────────────────────────────────────────────────────────────────────────────
// El Brain aparece cuando `showVerifiedBadge === true` (hay dims Anthropic con
// señal fuerte). Sello de "dato validado por el Economic Index" — independiente
// de que exista o no frase narrativa.
// ─────────────────────────────────────────────────────────────────────────────

function TaskHeader({
  task,
  textClass,
}: {
  task: ForensicTask
  textClass: string
}) {
  // Un solo Brain por card: si hay phrase, vive con la phrase.
  // Si solo hay sello (raro: combinación sin phrase), fallback aquí.
  const showSoloBadge =
    task.showVerifiedBadge && !task.classificationPhrase

  return (
    <div className="flex items-start justify-between gap-2">
      <p className={textClass}>{task.description}</p>
      {showSoloBadge && (
        <Brain
          className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5"
          style={{ filter: 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.45))' }}
          aria-label="Verificado Anthropic Economic Index"
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSIFICATION PHRASE — hallazgo ejecutivo del cruce βEloundou × dim dominante
// ─────────────────────────────────────────────────────────────────────────────
// Traducción ejecutiva del patrón IA en la tarea. Jerarquía paralela a la
// descripción (mismo text-sm) — el protagonismo viene del ESPACIO arriba y
// del hecho de ser el único lugar con ícono en la card. Disciplina de color.
//
// El único acento: el Brain púrpura chico. Nada más.
// ─────────────────────────────────────────────────────────────────────────────

function ClassificationPhrase({ text }: { text: string }) {
  return (
    <p className="mt-4 text-sm font-light text-slate-200 leading-relaxed flex items-start gap-2">
      <Brain
        className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5"
        aria-label="Verificado Anthropic Economic Index"
      />
      <span>{text}</span>
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDER ROW — slider de horas + label "X / Y h" + Semáforo IPI + MiniGauge
// ─────────────────────────────────────────────────────────────────────────────
// CEO opera en HORAS, no en pesos. El monto agregado vive en el footer.
// Dos indicadores COMPLEMENTARIOS (miden cosas distintas):
//
//   - Semáforo IPI:  presión de IA sobre la tarea — dato ESTÁTICO del mundo.
//                    (alta presión → candidata a delegar)
//   - MiniGauge:     % del techo del slider ya usado — dato DINÁMICO del CEO.
//                    (warning ≥80% → sobre-delegación)
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_COLOR = {
  cyan: '#22D3EE',
  purple: '#A78BFA',
} as const

const WARNING_THRESHOLD = 80

function SliderRow({
  delegated,
  max,
  ipi,
  semaforo,
  perfil,
  anthropicData,
  accent,
  onChange,
}: {
  delegated: number
  max: number
  ipi: number
  semaforo: ForensicTask['ipiSemaforo']
  perfil: ForensicTask['perfilLabel']
  anthropicData: AnthropicDimensionData | null
  accent: 'cyan' | 'purple'
  onChange: (n: number) => void
}) {
  const color = ACCENT_COLOR[accent]
  const pct = max > 0 ? Math.round((delegated / max) * 100) : 0
  const isWarning = pct >= WARNING_THRESHOLD
  const accentClass =
    accent === 'cyan' ? 'accent-cyan-400' : 'accent-purple-400'

  return (
    <div className="mt-3 flex items-center gap-2 md:gap-3">
      {/* Zona del slider — acción del CEO + su feedback visual */}
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={delegated}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className={cn(
          'flex-1 min-w-0 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer',
          accentClass,
        )}
        aria-label="Horas a delegar"
      />

      <span
        className="text-xs font-mono tabular-nums whitespace-nowrap flex-shrink-0"
        style={{
          color: delegated > 0 ? color : '#64748B',
        }}
      >
        {delegated} / {max} h
      </span>

      <MiniGauge pct={pct} isWarning={isWarning} />

      {/* Separador visual — el IPI es un dato del mundo, no del slider */}
      <div
        className="w-px h-5 bg-slate-700/60 flex-shrink-0 mx-0.5"
        aria-hidden
      />

      <IpiSemaforoBadge
        ipi={ipi}
        level={semaforo}
        perfil={perfil}
        anthropicData={anthropicData}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI GAUGE — arco semicircular 40×20 con % del techo del slider
// ─────────────────────────────────────────────────────────────────────────────
// Feedback del SLIDER (no del IPI). Warning púrpura + glow al ≥80%.
// ─────────────────────────────────────────────────────────────────────────────

const GAUGE_W = 40
const GAUGE_H = 20
const GAUGE_R = 16
const GAUGE_STROKE = 1.75

function MiniGauge({
  pct,
  isWarning,
}: {
  pct: number
  isWarning: boolean
}) {
  const cx = GAUGE_W / 2
  const cy = GAUGE_H
  const startAngle = Math.PI
  const fillAngle = startAngle - Math.PI * (pct / 100)

  const bgPath = `M ${cx - GAUGE_R} ${cy} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${cx + GAUGE_R} ${cy}`
  const fillX = cx + GAUGE_R * Math.cos(fillAngle)
  const fillY = cy - GAUGE_R * Math.sin(fillAngle)
  const largeArc = (startAngle - fillAngle) > Math.PI ? 1 : 0
  const fillPath =
    pct > 0
      ? `M ${cx - GAUGE_R} ${cy} A ${GAUGE_R} ${GAUGE_R} 0 ${largeArc} 1 ${fillX} ${fillY}`
      : ''

  const strokeColor = isWarning ? '#A78BFA' : '#64748B'
  const textColor = isWarning ? 'text-purple-400' : 'text-slate-400'

  return (
    <div
      className="relative w-10 h-5 flex-shrink-0 transition-all"
      style={{
        filter: isWarning
          ? 'drop-shadow(0 0 12px rgba(167, 139, 250, 0.55))'
          : undefined,
      }}
      title={`${pct}% del techo del slider`}
      aria-label={`${pct}% del techo`}
    >
      <svg
        width={GAUGE_W}
        height={GAUGE_H}
        viewBox={`0 0 ${GAUGE_W} ${GAUGE_H}`}
        className="block"
      >
        <path
          d={bgPath}
          fill="none"
          stroke="#1e293b"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
        />
        {fillPath && (
          <motion.path
            d={fillPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={GAUGE_STROKE}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </svg>
      <span
        className={cn(
          'absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-light tabular-nums leading-none pointer-events-none',
          textColor,
        )}
      >
        {pct}%
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IPI SEMÁFORO BADGE — presión de IA sobre la tarea (IPI · 4 niveles)
// ─────────────────────────────────────────────────────────────────────────────
// 4 barritas verticales + valor IPI. Alineado con la cascada del simulador:
//   alta     → cyan   (zona de rescate — IA ejecuta sola)
//   media    → purple (aumentado — copiloto)
//   baja     → slate  (residual — asistencia puntual)
//   sin_señal→ slate muted (sin patrón / sin dims)
//
// Tooltip premium (portal · glassmorphism · motion) al hover con contexto
// ejecutivo: nivel, perfil legible, dim dominante y recomendación.
// ─────────────────────────────────────────────────────────────────────────────

const SEMAFORO_CONFIG: Record<
  ForensicTask['ipiSemaforo'],
  {
    active: number
    color: string
    label: string
    glow: boolean
    explanation: string
  }
> = {
  alta: {
    active: 4,
    color: '#22D3EE',
    label: 'Alta',
    glow: true,
    explanation:
      'La IA puede ejecutar esta tarea sin intervención humana. Es trabajo que ya no requiere personas.',
  },
  media: {
    active: 3,
    color: '#A78BFA',
    label: 'Media',
    glow: false,
    explanation:
      'La IA ejecuta, pero con intervención humana. Rediseñar cómo se hace importa más que reemplazar quién la hace.',
  },
  baja: {
    active: 2,
    color: '#64748B',
    label: 'Baja',
    glow: false,
    explanation:
      'La IA asiste puntualmente. El trabajo sigue siendo humano.',
  },
  sin_señal: {
    active: 0,
    color: '#475569',
    label: 'Sin señal',
    glow: false,
    explanation:
      'Sin dato verificado sobre cómo la IA interviene aquí. La decisión se apoya solo en si la tarea es automatizable.',
  },
}

const PERFIL_LABEL: Record<ForensicTask['perfilLabel'], string> = {
  DELEGACION_ACTIVA: 'Delegación activa',
  AMPLIFICACION_ACTIVA: 'Amplificación activa',
  DELEGACION_PARCIAL: 'Delegación parcial',
  ASISTENCIA_PRODUCTIVA: 'Asistencia productiva',
  RESISTENTE: 'Tarea resistente',
  CONSULTA_PUNTUAL: 'Consulta puntual',
  SIN_PATRON: 'Sin patrón claro',
}

const PERFIL_ACTIONABLE: Record<ForensicTask['perfilLabel'], string> = {
  DELEGACION_ACTIVA:
    'Automatizable con herramientas disponibles hoy. Mantenerla manual es pagar horas que la IA ya ejecuta sola.',
  AMPLIFICACION_ACTIVA:
    'La IA multiplica el volumen, no el criterio. Quien no supervisa pierde el control del resultado.',
  DELEGACION_PARCIAL:
    'Delegable con el software adecuado. Lo que la separa del reemplazo total no es la IA — es la integración técnica.',
  ASISTENCIA_PRODUCTIVA:
    'La IA ejecuta parte, la persona dirige. Automatizarla completa pierde lo que hace valioso al humano en el cargo.',
  RESISTENTE:
    'Alguien está delegando a la IA lo que la evidencia dice que no funciona. La pregunta no es qué hace — es quién lo impulsa y por qué.',
  CONSULTA_PUNTUAL:
    'La IA prepara el terreno, no decide. Confundir acelerar con sustituir es el error más caro en tareas como esta.',
  SIN_PATRON:
    'Sin patrón verificado sobre cómo la IA interviene aquí. La decisión se guía por si la tarea es automatizable, no por cómo se delega.',
}

const DIM_LABEL: Record<keyof AnthropicDimensionData, string> = {
  directive: 'Directive (reemplazo)',
  feedbackLoop: 'Feedback Loop (adaptación)',
  taskIteration: 'Task Iteration (iteración)',
  validation: 'Validation (verificación)',
  learning: 'Learning (aprendizaje)',
}

function getDominantDimLabel(data: AnthropicDimensionData | null): string | null {
  if (!data) return null
  const entries = Object.entries(data) as Array<
    [keyof AnthropicDimensionData, number]
  >
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  if (top[1] <= 0.15) return null
  return DIM_LABEL[top[0]]
}

function IpiSemaforoBadge({
  ipi,
  level,
  perfil,
  anthropicData,
}: {
  ipi: number
  level: ForensicTask['ipiSemaforo']
  perfil: ForensicTask['perfilLabel']
  anthropicData: AnthropicDimensionData | null
}) {
  const cfg = SEMAFORO_CONFIG[level]
  const triggerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    placement: 'top' | 'bottom'
  } | null>(null)

  const dominantDimLabel = getDominantDimLabel(anthropicData)
  const perfilLegible = PERFIL_LABEL[perfil]
  const actionable = PERFIL_ACTIONABLE[perfil]

  const updatePosition = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const MARGIN = 16
    // Tooltip width: cap 288px, pero en mobile cabe en viewport menos márgenes.
    const tooltipW = Math.min(288, vw - MARGIN * 2)
    const tooltipHEstimate = 260 // aprox — alcanza para decidir arriba/abajo

    // Horizontal: centrar en trigger, clampear al viewport
    const triggerCenterX = rect.left + rect.width / 2
    let left = triggerCenterX - tooltipW / 2
    left = Math.max(MARGIN, Math.min(left, vw - tooltipW - MARGIN))

    // Vertical: arriba por default, abajo si no cabe
    const spaceAbove = rect.top
    const placeBelow = spaceAbove < tooltipHEstimate + MARGIN
    const top = placeBelow
      ? rect.bottom + window.scrollY + 10
      : rect.top + window.scrollY - 10

    setCoords({
      top,
      left: left + window.scrollX,
      placement: placeBelow ? 'bottom' : 'top',
    })
  }

  const handleEnter = () => {
    updatePosition()
    setIsOpen(true)
  }
  const handleLeave = () => setIsOpen(false)

  useLayoutEffect(() => {
    if (!isOpen) return
    const onScroll = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [isOpen])

  return (
    <>
      <div
        ref={triggerRef}
        className="flex flex-col items-center gap-0.5 flex-shrink-0 transition-all cursor-help"
        style={{
          filter: cfg.glow
            ? 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.55))'
            : undefined,
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        tabIndex={0}
        role="button"
        aria-label={`Presión IA ${cfg.label}, índice ${ipi.toFixed(2)}`}
      >
        <div className="flex items-end gap-[2px] h-2.5">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-1 rounded-sm"
              style={{
                height: `${40 + i * 20}%`,
                backgroundColor: i < cfg.active ? cfg.color : '#1e293b',
              }}
            />
          ))}
        </div>
        <span className="text-[9px] font-mono tabular-nums leading-none text-slate-400">
          {ipi.toFixed(2)}
        </span>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && coords && (
              <motion.div
                initial={{ opacity: 0, y: coords.placement === 'top' ? 6 : -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords.placement === 'top' ? 6 : -6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: coords.top,
                  left: coords.left,
                  transform: coords.placement === 'top' ? 'translateY(-100%)' : 'translateY(0)',
                  pointerEvents: 'none',
                  width: 'min(18rem, calc(100vw - 2rem))',
                }}
                className="relative z-[100] overflow-hidden rounded-xl p-4 shadow-2xl backdrop-blur-xl border border-slate-700/60 bg-slate-900/95"
              >
                {/* Línea Tesla superior — único acento de color (patrón CardShell) */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
                    boxShadow: `0 0 12px ${cfg.color}`,
                  }}
                />

                {/* Header — narrativa primero. Tipografía sobria, sin color invasivo. */}
                <div className="mb-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Presión IA · {cfg.label}
                  </div>
                  <p className="text-sm font-light text-white mt-1 leading-snug">
                    {perfilLegible}
                  </p>
                </div>

                {/* Narrativa — protagonista del tooltip */}
                <p className="text-xs font-light text-slate-300 leading-relaxed">
                  {cfg.explanation}
                </p>

                {/* Datos técnicos — mini definitions list, slate muted */}
                <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      Índice
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-white">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                        aria-hidden
                      />
                      {ipi.toFixed(2)}
                    </span>
                  </div>
                  {dominantDimLabel && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">
                        Dimensión
                      </span>
                      <span className="text-xs font-light text-slate-300 text-right">
                        {dominantDimLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actionable — voz del asesor. El Zap lleva el color del nivel
                    como único acento puntual (coherente con la Tesla line). */}
                <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-start gap-2">
                  <Zap
                    className="w-3 h-3 flex-shrink-0 mt-0.5"
                    style={{ color: cfg.color }}
                  />
                  <p className="text-[11px] font-light leading-snug text-slate-200 italic">
                    {actionable}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
