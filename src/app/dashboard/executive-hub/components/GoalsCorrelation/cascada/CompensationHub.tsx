'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION HUB v2 — Executive Dashboard de acción rápida
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// 3 perspectivas como cuadros de mando. Mérito + Bonos = filtros específicos
// (vectores con acento de color). Señales = vista global (ghost card).
// Header limpio: Checkpoint pre-compensación + instrucción + Home.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Home, Target, TrendingUp, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { CorrelationPoint } from '../GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type CompensationPath = 'merito' | 'bonos' | 'senales'

interface CompensationHubProps {
  correlation: CorrelationPoint[]
  onSelectPath: (path: CompensationPath) => void
  onHome: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// PATH CONFIG — 2 vectores específicos + 1 vista global
// ════════════════════════════════════════════════════════════════════════════

type PathVariant = 'vector' | 'global'

interface PathConfig {
  key: CompensationPath
  label: string
  description: string
  icon: LucideIcon
  variant: PathVariant
  accent: 'cyan' | 'purple'
}

const PATHS: PathConfig[] = [
  {
    key: 'merito',
    label: 'Mérito',
    description: 'Evaluación 360° determina incremento salarial',
    icon: Target,
    variant: 'vector',
    accent: 'cyan',
  },
  {
    key: 'bonos',
    label: 'Bonos',
    description: 'Metas cumplidas determinan bono variable',
    icon: TrendingUp,
    variant: 'vector',
    accent: 'cyan',
  },
  {
    key: 'senales',
    label: 'Señales',
    description: 'Qué mensaje recibe la organización',
    icon: Zap,
    variant: 'global',
    accent: 'purple',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompensationHub({
  correlation,
  onSelectPath,
  onHome,
}: CompensationHubProps) {
  const pathCounts = useMemo<Record<CompensationPath, number>>(() => {
    const withGoals = correlation.filter(
      c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null
    )
    return {
      merito: withGoals.filter(c => c.score360 >= 4.0 && (c.goalsPercent ?? 0) < 80).length,
      bonos: withGoals.filter(c => (c.goalsPercent ?? 0) >= 80 && c.score360 < 4.0).length,
      senales: withGoals.filter(c => c.quadrant !== 'CONSISTENT').length,
    }
  }, [correlation])

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-10 md:px-10 md:py-14">
        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between gap-4 mb-10 md:mb-14">
          <div>
            <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
              Checkpoint
            </h2>
            <p className="text-2xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
              pre-compensación
            </p>
            <p className="text-sm font-light text-slate-400 mt-4 max-w-md">
              Tres perspectivas para revisar antes de aprobar.
            </p>
          </div>

          <button
            onClick={onHome}
            className="flex-shrink-0 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs group"
            aria-label="Volver a portada"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portada</span>
          </button>
        </div>

        {/* ─── PATH CARDS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PATHS.map((path, idx) => (
            <PathCard
              key={path.key}
              path={path}
              count={pathCounts[path.key]}
              delay={0.1 + idx * 0.06}
              onClick={() => onSelectPath(path.key)}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PATH CARD — cuadro de mando con marca de agua y hover premium
// ════════════════════════════════════════════════════════════════════════════

const ACCENT_STYLES: Record<'cyan' | 'purple', {
  hoverBorder: string
  hoverGlow: string
  hoverCount: string
  watermark: string
}> = {
  cyan: {
    hoverBorder: 'group-hover:border-cyan-500/40',
    hoverGlow: 'group-hover:shadow-[0_0_15px_rgba(34,211,238,0.08)]',
    hoverCount: 'group-hover:text-cyan-400',
    watermark: 'text-cyan-400',
  },
  purple: {
    hoverBorder: 'group-hover:border-purple-500/40',
    hoverGlow: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]',
    hoverCount: 'group-hover:text-purple-400',
    watermark: 'text-purple-400',
  },
}

function PathCard({
  path,
  count,
  delay,
  onClick,
}: {
  path: PathConfig
  count: number
  delay: number
  onClick: () => void
}) {
  const Icon = path.icon
  const accent = ACCENT_STYLES[path.accent]
  const isGlobal = path.variant === 'global'

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'group relative text-left rounded-2xl border overflow-hidden transition-all duration-300',
        'px-6 py-7 md:px-7 md:py-8',
        'hover:-translate-y-1',
        isGlobal
          ? 'bg-slate-950/40 border-slate-800/60'
          : 'bg-slate-900/60 border-slate-800/50',
        accent.hoverBorder,
        accent.hoverGlow,
      )}
    >
      {/* Marca de agua — icono gigante cortado en esquina inferior derecha */}
      <Icon
        className={cn(
          'absolute -bottom-6 -right-6 w-40 h-40 pointer-events-none transition-opacity duration-300',
          accent.watermark,
          'opacity-[0.04] group-hover:opacity-[0.15]',
        )}
        strokeWidth={1}
      />

      {/* Contenido — relative para quedar sobre la marca de agua */}
      <div className="relative">
        {/* Número protagonista */}
        <span
          className={cn(
            'text-5xl md:text-6xl font-extralight font-mono tabular-nums text-white transition-colors duration-300 block leading-none',
            accent.hoverCount,
          )}
        >
          {count}
        </span>

        {/* Divisor sutil */}
        <div className="h-px bg-slate-800/60 my-5" />

        {/* Label + descripción */}
        <h3 className="text-base font-light text-slate-200 tracking-tight">
          {path.label}
        </h3>
        <p className="text-xs font-light text-slate-500 leading-relaxed mt-1 max-w-[220px]">
          {path.description}
        </p>
      </div>
    </motion.button>
  )
}
