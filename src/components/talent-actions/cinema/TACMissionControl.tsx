'use client'

// Clonado de src/components/evaluator/cinema/MissionControl.tsx
// Misma estructura layout responsive. Adaptado: SegmentedRing → ICC gauge, DashboardIndicators → omitido

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

        {/* Stats izquierda - Solo DESKTOP */}
        <div className="hidden md:flex flex-col gap-3 text-right">
          <StatLine label="Personas" value={String(stats.totalPersonas)} />
          <StatLine label="Clasificadas" value={`${stats.totalClasificadas}`} />
          {stats.plTotal > 0 && (
            <StatLine label="En riesgo" value={formatCurrencyCLP(stats.plTotal)} highlight />
          )}
        </div>

        {/* GAUGE ICC — misma estructura visual que SegmentedRing (size 280, strokeWidth 10, glow) */}
        <ICCGauge icc={icc} />

        {/* CTA - Solo DESKTOP (derecha) — clonado EXACTO de CTAButton */}
        {nextGerencia && (
          <div className="hidden md:block">
            <CTAButton
              nextGerencia={nextGerencia}
              onStart={onStart}
            />
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
          <CTAButton
            nextGerencia={nextGerencia}
            onStart={onStart}
          />
        </div>
      )}
    </motion.div>
  )
}

// StatLine - mini helper
function StatLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-[9px] text-slate-600 uppercase tracking-wider block">{label}</span>
      <span className={cn("text-sm font-bold", highlight ? "text-amber-400" : "text-slate-300")}>
        {value}
      </span>
    </div>
  )
}

// CTAButton - clonado EXACTO del patron evaluator, siempre cyan (no phase2)
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

// ICCGauge — clonado de SegmentedRing.tsx (size 280, strokeWidth 10, glow, motion.circle)
// Adaptado: muestra ICC Organizacional en vez de completados/pendientes
function ICCGauge({ icc }: { icc: number }) {
  const size = 280
  const strokeWidth = 10
  const radius = (size / 2) - strokeWidth
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(100, Math.max(0, icc))
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // ICC: menor es mejor. Rojo >25, ambar 10-25, verde <10
  const color = icc > 25 ? '#EF4444' : icc > 10 ? '#F59E0B' : icc > 0 ? '#22D3EE' : '#475569'
  const label = icc === 0 ? 'Sin datos aun' : icc > 25 ? 'Concentracion Critica' : icc > 10 ? 'Monitorear' : 'Estable'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow sutil — copia exacta SegmentedRing */}
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
        {/* Background track — copia exacta */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc — copia exacta motion */}
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

      {/* Center content — copia exacta layout */}
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
    </div>
  )
}
