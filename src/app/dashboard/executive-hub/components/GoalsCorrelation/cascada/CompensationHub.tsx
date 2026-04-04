'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPENSATION HUB — Capa 1: Portada con 3 caminos
// src/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/CompensationHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// Patrón G: Guided Intelligence — Hub de entrada
// El CEO ve el número, entiende la magnitud, elige perspectiva.
// FIX 1: Card contenedor + Tesla line
// FIX 2: "Revisa antes de aprobar" solo 1 vez (lado derecho)
// FIX 3: Path cards premium con números visibles + hover Tesla
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

import type { CorrelationPoint } from '../GoalsCorrelation.types'
import { HUB_NARRATIVE } from '@/config/narratives/CompensationActsDictionary'

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
    const merito = withGoals.filter(c => c.score360 >= 4.0 && (c.goalsPercent ?? 0) < 80)
    const bonos = withGoals.filter(c => (c.goalsPercent ?? 0) >= 80 && c.score360 < 4.0)
    const senales = withGoals.filter(c => c.quadrant !== 'CONSISTENT')
    return { total: discrepancy.length, merito: merito.length, bonos: bonos.length, senales: senales.length }
  }, [correlation])

  const pathCounts: Record<CompensationPath, number> = {
    merito: stats.merito,
    bonos: stats.bonos,
    senales: stats.senales,
  }

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

      <div className="p-7">
        {/* Header split — FIX 2: "Revisa antes de aprobar" solo aquí */}
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
        <p
          className="text-sm font-light text-slate-400 leading-relaxed max-w-[460px] mb-7 [&>b]:text-slate-300 [&>b]:font-normal"
          dangerouslySetInnerHTML={{ __html: HUB_NARRATIVE.body }}
        />

        {/* 3 Path cards — FIX 3: números visibles + hover premium */}
        <div className="flex flex-col sm:flex-row gap-3">
          {PATHS.map((path, idx) => (
            <motion.button
              key={path.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.25 }}
              onClick={() => onSelectPath(path.key)}
              className="group relative flex-1 text-left p-5 rounded-xl border border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/30 cursor-pointer transition-all duration-300 overflow-hidden"
            >
              {/* Tesla line hover */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/0 group-hover:via-cyan-400/30 to-transparent transition-all duration-300" />

              {/* Count — FIX 3: más grande y visible */}
              <span className="text-2xl font-extralight text-slate-500 group-hover:text-slate-300 transition-colors duration-300 block mb-2">
                {pathCounts[path.key]}
              </span>

              {/* Label */}
              <span className="text-sm font-normal text-slate-300 block mb-1">
                {path.label}
              </span>

              {/* Description */}
              <span className="text-xs text-slate-500 font-light leading-relaxed block">
                {path.description}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
})
