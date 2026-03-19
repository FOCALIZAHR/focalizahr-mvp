'use client'

// Clonado de src/components/evaluator/cinema/MissionControl.tsx
// Misma estructura layout responsive. ICC gauge + StatLines con tooltips

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrencyCLP } from '@/lib/financialCalculations'
import type { TACMissionControlProps } from '@/types/tac-cinema'

export default function TACMissionControl({
  stats,
  nextGerencia,
  onStart
}: TACMissionControlProps) {

  const icc = stats.iccOrganizacional ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-6 w-full max-w-4xl px-4"
    >
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">
          Talent Action Center
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          {stats.gerenciasEnRiesgo > 0
            ? `${stats.gerenciasEnRiesgo} gerencia${stats.gerenciasEnRiesgo !== 1 ? 's' : ''} requieren atencion`
            : 'Organizacion estable'
          }
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - Responsive (mismo patron evaluator) */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">

        {/* Stats izquierda - Solo DESKTOP — tipografía alineada a DashboardIndicators */}
        <div className="hidden md:flex flex-col gap-4 text-right">
          <StatIndicator
            label="Personas"
            value={String(stats.totalPersonas)}
            tooltip="Total de personas con matrices de talento calculadas en la organización."
          />
          <StatIndicator
            label="Clasificadas"
            value={String(stats.totalClasificadas)}
            tooltip="Personas que cruzan en al menos un cuadrante de riesgo o talento."
          />
          {stats.personasEnFuga > 0 && (
            <StatIndicator
              label="En fuga"
              value={String(stats.personasEnFuga)}
              highlight
              tooltip="Personas con alto dominio y compromiso crítico. El talento que más domina es el que más fácil se va."
            />
          )}
          {stats.plTotal > 0 && (
            <StatIndicator
              label="En riesgo"
              value={formatCurrencyCLP(stats.plTotal)}
              highlight
              tooltip="Costo estimado si el talento en riesgo sale. Incluye costo de reemplazo × factor de riesgo (SHRM 2024)."
            />
          )}
        </div>

        {/* GAUGE ICC */}
        <ICCGauge icc={icc} />

        {/* CTA - Solo DESKTOP (derecha) */}
        {nextGerencia && (
          <div className="hidden md:block">
            <CTAButton nextGerencia={nextGerencia} onStart={onStart} />
          </div>
        )}
      </div>

      {/* Stats - Solo MOBILE (debajo) */}
      <div className="md:hidden flex gap-4 text-sm text-slate-500">
        <span>{stats.totalPersonas} personas</span>
        <span className="text-slate-700">·</span>
        <span>{stats.totalClasificadas} clasificadas</span>
        {stats.plTotal > 0 && (
          <>
            <span className="text-slate-700">·</span>
            <span>{formatCurrencyCLP(stats.plTotal)}</span>
          </>
        )}
      </div>

      {/* CTA - Solo MOBILE (abajo) */}
      {nextGerencia && (
        <div className="md:hidden">
          <CTAButton nextGerencia={nextGerencia} onStart={onStart} />
        </div>
      )}
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// StatIndicator — Patrón DashboardIndicators (font-mono, tracking, tooltip)
// ════════════════════════════════════════════════════════════════════════════

function StatIndicator({
  label,
  value,
  highlight,
  tooltip
}: {
  label: string
  value: string
  highlight?: boolean
  tooltip: string
}) {
  return (
    <div className="group relative text-right">
      <span className="text-[9px] font-mono tracking-[0.2em] text-white/40 uppercase block">
        {label}
      </span>
      <span className={cn(
        'text-[13px] font-mono font-medium tracking-wider',
        highlight ? 'text-amber-400' : 'text-slate-300'
      )}>
        {value}
      </span>

      {/* Tooltip — patrón DashboardIndicators */}
      <div className="absolute bottom-full mb-3 right-0 w-56 p-3
        bg-slate-950 border border-slate-800 rounded-xl shadow-2xl
        opacity-0 group-hover:opacity-100 transition-all duration-200
        pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">
        <p className="text-[10px] text-slate-400 leading-relaxed text-left">
          {tooltip}
        </p>
        <div className="absolute top-full right-4
          border-4 border-transparent border-t-slate-950" />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CTAButton — clonado EXACTO del patron evaluator
// ════════════════════════════════════════════════════════════════════════════

function CTAButton({
  nextGerencia,
  onStart
}: {
  nextGerencia: { id: string; displayName: string }
  onStart: (id: string) => void
}) {
  return (
    <motion.button
      onClick={() => onStart(nextGerencia.id)}
      className={cn(
        "group relative flex items-center rounded-xl transition-all transform hover:-translate-y-0.5",
        "gap-4 pl-5 pr-2 py-2",
        "bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="text-left">
        <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-70 text-slate-700">
          Revisar
        </span>
        <span className="block text-sm font-bold leading-tight">
          {nextGerencia.displayName}
        </span>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
        <ArrowRight className="w-4 h-4" />
      </div>
    </motion.button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ICCGauge — clonado de SegmentedRing.tsx
// ICC Organizacional: promedio ponderado de ICC por gerencia
// Si null → muestra estado "Sin datos" sin alarmar
// ════════════════════════════════════════════════════════════════════════════

function ICCGauge({ icc }: { icc: number }) {
  const size = 280
  const strokeWidth = 10
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(100, Math.max(0, icc))
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // ICC: menor es mejor. Rojo >25, ambar 10-25, cyan <10, 0 = sin riesgo
  const color = icc > 25 ? '#EF4444' : icc > 10 ? '#F59E0B' : '#22D3EE'
  const label = icc === 0 ? 'Sin riesgo critico' : icc > 25 ? 'Concentracion Critica' : icc > 10 ? 'Monitorear' : 'Estable'

  return (
    <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
      {/* Glow sutil */}
      <div
        className="absolute rounded-full blur-[60px]"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          backgroundColor: color,
          opacity: 0.08
        }}
      />

      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        {icc > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 6px ${color})`
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-7xl font-black text-white tracking-tighter font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {icc}%
        </motion.span>
        <span className="text-xs font-bold tracking-[0.2em] uppercase mt-2" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-slate-500 font-mono mt-1">
          ICC Organizacional
        </span>
      </div>

      {/* Tooltip ICC — a la derecha del gauge */}
      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-64 p-4
        bg-slate-950 border border-slate-800 rounded-xl shadow-2xl
        opacity-0 group-hover:opacity-100 transition-all duration-200
        pointer-events-none z-50 -translate-x-2 group-hover:translate-x-0">
        <p className="text-[11px] font-semibold text-slate-300 mb-2">
          Conocimiento en riesgo de perderse
        </p>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
          {icc === 0
            ? 'Tus personas clave están comprometidas. Si alguna se fuera hoy, el conocimiento crítico no se iría con ella.'
            : icc <= 10
              ? 'Una proporción baja de tu conocimiento crítico está en manos de personas con señal de alerta. Estás a tiempo de actuar.'
              : icc <= 25
                ? 'Una parte significativa de tu conocimiento crítico depende de personas que podrían irse. Conviene revisar qué las retiene.'
                : 'Más de 1 de cada 4 personas que concentran conocimiento clave tiene señal de riesgo. Si se van, se llevan lo que saben.'
          }
        </p>
        <p className="text-[9px] text-slate-600 leading-relaxed">
          Cruza quiénes concentran conocimiento institucional con quiénes muestran señales de desconexión. Menor es mejor.
        </p>
        <div className="absolute right-full top-1/2 -translate-y-1/2
          border-4 border-transparent border-r-slate-950" />
      </div>
    </div>
  )
}
