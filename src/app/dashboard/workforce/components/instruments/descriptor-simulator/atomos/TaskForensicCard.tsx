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

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categorizeTask, type ForensicTask } from '../descriptor-simulator-utils'

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
      <p className="text-sm font-light text-slate-300 leading-snug">
        {task.description}
      </p>

      {task.classificationPhrase && (
        <p className="mt-1.5 text-xs font-light text-purple-300 leading-relaxed flex items-start gap-1.5">
          <Brain className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
          <span>{task.classificationPhrase}</span>
        </p>
      )}

      <p className="mt-2.5 text-[11px] font-light text-slate-500">
        Trabajo humano · {task.hoursPerMonth} h/mes
      </p>
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
  // Único % — uso del techo del slider (0-100% siempre)
  const pct = maxDelegated > 0
    ? Math.round((delegatedHours / maxDelegated) * 100)
    : 0

  const handleSlider = (newDelegated: number) => {
    const clamped = Math.max(0, Math.min(maxDelegated, newDelegated))
    onHoursChange(task.taskId, task.originalHours - clamped)
  }

  return (
    <CardShell
      className="border-slate-800/40 bg-slate-900/40 hover:border-slate-700/60"
      teslaColor="#A78BFA"
    >
      <p className="text-sm font-light text-slate-100 leading-snug">
        {task.description}
      </p>

      {task.classificationPhrase && (
        <p className="mt-1.5 text-xs font-light text-purple-300 leading-relaxed flex items-start gap-1.5">
          <Brain className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
          <span>{task.classificationPhrase}</span>
        </p>
      )}

      <SliderRow
        delegated={delegatedHours}
        max={maxDelegated}
        pct={pct}
        accent="purple"
        onChange={handleSlider}
      />
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
  const pct = maxDelegated > 0
    ? Math.round((delegatedHours / maxDelegated) * 100)
    : 0

  const handleSlider = (newDelegated: number) => {
    const clamped = Math.max(0, Math.min(maxDelegated, newDelegated))
    onHoursChange(task.taskId, task.originalHours - clamped)
  }

  return (
    <CardShell
      className="border-slate-800/40 bg-slate-900/40 hover:border-slate-700/60"
      teslaColor="#22D3EE"
    >
      <p className="text-sm font-light text-white leading-snug">
        {task.description}
      </p>

      {task.classificationPhrase && (
        <p className="mt-1.5 text-xs font-light text-purple-300 leading-relaxed flex items-start gap-1.5">
          <Brain className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
          <span>{task.classificationPhrase}</span>
        </p>
      )}

      <SliderRow
        delegated={delegatedHours}
        max={maxDelegated}
        pct={pct}
        accent="cyan"
        onChange={handleSlider}
      />
    </CardShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDER ROW — slider de horas + label "X / Y h" + % del cargo
// ─────────────────────────────────────────────────────────────────────────────
// CEO opera en HORAS, no en pesos. El monto agregado vive en el footer.
//
// Dos métricas distintas:
//   - displayPct: lo que se MUESTRA al CEO. % del cargo total.
//                 β=0.5: máx 50%. β=1.0: máx 100%.
//   - usagePct:   uso del slider respecto a su techo. Decide warning ≥80%.
//                 β=0.5: 0–100% (independiente). β=1.0: igual a displayPct.
//
// Slider físicamente clampado a `max` (techo absoluto).
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_COLOR = {
  cyan: '#22D3EE',
  purple: '#A78BFA',
} as const

const WARNING_THRESHOLD = 80

function SliderRow({
  delegated,
  max,
  pct,
  accent,
  onChange,
}: {
  delegated: number
  max: number
  /** Único % — uso del techo (0-100). Mostrado dentro del velocímetro. */
  pct: number
  accent: 'cyan' | 'purple'
  onChange: (n: number) => void
}) {
  const color = ACCENT_COLOR[accent]
  const isWarning = pct >= WARNING_THRESHOLD
  const accentClass =
    accent === 'cyan' ? 'accent-cyan-400' : 'accent-purple-400'

  return (
    <div className="mt-3 flex items-center gap-2 md:gap-3">
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI GAUGE — arco semicircular 40×20 con % DENTRO (centrado debajo del arco)
// ─────────────────────────────────────────────────────────────────────────────
// Único % visible — vive dentro del componente, no fuera.
// Color reactivo a `isWarning`: slate normal / púrpura + glow al ≥80%.
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
      title={`${pct}% del techo`}
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
