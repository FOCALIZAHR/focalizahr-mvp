'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION HUB — Capa 1: Portada con 3 caminos
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G: Guided Intelligence — Hub de entrada
// El CEO ve el número, entiende la magnitud, elige perspectiva.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

import type { CorrelationPoint } from '../GoalsCorrelation.types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type CompensationPath = 'merito' | 'bonos' | 'senales'

interface CompensationHubProps {
  correlation: CorrelationPoint[]
  onSelectPath: (path: CompensationPath) => void
}

// ════════════════════════════════════════════════════════════════════════════
// PATH CONFIG
// ════════════════════════════════════════════════════════════════════════════

const PATHS: { key: CompensationPath; label: string; description: string }[] = [
  {
    key: 'merito',
    label: 'Mérito',
    description: 'Evaluación 360° determina incremento salarial',
  },
  {
    key: 'bonos',
    label: 'Bonos',
    description: 'Metas cumplidas determinan bono variable',
  },
  {
    key: 'senales',
    label: 'Señales',
    description: 'Qué mensaje recibe el empleado',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function CompensationHub({ correlation, onSelectPath }: CompensationHubProps) {
  const stats = useMemo(() => {
    const withGoals = correlation.filter(c => c.quadrant !== 'NO_GOALS' && c.goalsPercent !== null)
    const discrepancy = withGoals.filter(c => c.quadrant !== 'CONSISTENT')
    // Mérito: personas con evaluación alta que no cumplen metas
    const merito = withGoals.filter(c =>
      c.score360 >= 4.0 && (c.goalsPercent ?? 0) < 80
    )
    // Bonos: personas con metas altas pero evaluación baja
    const bonos = withGoals.filter(c =>
      (c.goalsPercent ?? 0) >= 80 && c.score360 < 4.0
    )
    // Señales: cualquier combinatoria contradictoria
    const senales = withGoals.filter(c => c.quadrant !== 'CONSISTENT')
    return {
      total: discrepancy.length,
      merito: merito.length,
      bonos: bonos.length,
      senales: senales.length,
    }
  }, [correlation])

  const pathCounts: Record<CompensationPath, number> = {
    merito: stats.merito,
    bonos: stats.bonos,
    senales: stats.senales,
  }

  return (
    <div>
      {/* Header split */}
      <div className="flex items-end justify-between gap-5 mb-1">
        <div>
          <span className="text-2xl font-extralight text-white tracking-tight block leading-tight">
            Checkpoint
          </span>
          <span className="text-2xl font-light tracking-tight block leading-tight fhr-title-gradient">
            pre-compensación
          </span>
        </div>
        <p className="text-[13px] text-slate-600 font-light text-right max-w-[280px] hidden sm:block">
          Revisa antes de aprobar
        </p>
      </div>

      {/* Hero number */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-[44px] font-extralight text-cyan-400 leading-none mt-5 mb-1"
      >
        {stats.total}
      </motion.p>
      <p className="text-sm font-light text-slate-400 leading-relaxed max-w-[460px] mb-7">
        personas reciben compensación donde <span className="text-slate-300 font-normal">evaluación y resultados no coinciden</span>.
        Cruzamos tres motores de inteligencia para mostrarte por qué.
      </p>

      {/* 3 Path cards */}
      <div className="flex flex-col sm:flex-row gap-3">
        {PATHS.map((path, idx) => (
          <motion.button
            key={path.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + idx * 0.06, duration: 0.25 }}
            onClick={() => onSelectPath(path.key)}
            className="flex-1 text-left px-5 py-5 rounded-2xl border border-slate-800/30 bg-transparent relative overflow-hidden transition-all duration-300 group hover:border-slate-700/50 hover:bg-slate-900/20"
          >
            {/* Hover Tesla line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-transparent transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-cyan-500/20 group-hover:to-transparent" />

            {/* Count */}
            <span className="text-lg font-extralight text-slate-700 block mb-1.5 transition-colors group-hover:text-slate-500">
              {pathCounts[path.key]}
            </span>

            {/* Label */}
            <span className="text-[13px] font-normal text-slate-300 block mb-1">
              {path.label}
            </span>

            {/* Description */}
            <span className="text-[11px] font-light text-slate-600 leading-snug block">
              {path.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
})
