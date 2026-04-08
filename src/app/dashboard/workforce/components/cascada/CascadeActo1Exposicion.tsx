'use client'

// ════════════════════════════════════════════════════════════════════════════
// CASCADE ACTO 1 — "Que Significa" — Mapa de calor por gerencia
// Narrativas exactas del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo1Exposicion.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton } from '@/components/ui/PremiumButton'
import { ExposureHeatmap } from '@/components/charts'
import type { HeatmapCell } from '@/components/charts'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActo1Props {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  onContinue: () => void
  onBack: () => void
}

export default function CascadeActo1Exposicion({
  data,
  computed,
  onContinue,
}: CascadeActo1Props) {
  const expGerenciaMas = Math.round(computed.gerenciaMas.avgExposure * 100)
  const expGerenciaMenos = Math.round(computed.gerenciaMenos.avgExposure * 100)

  // Transformar byCategory → HeatmapCell[]
  const heatmapData: HeatmapCell[] = Object.entries(data.exposure.byCategory)
    .filter(([, val]) => val.headcount > 0)
    .sort(([, a], [, b]) => b.avgExposure - a.avgExposure)
    .map(([name, val]) => ({
      rowId: name,
      rowLabel: name.charAt(0).toUpperCase() + name.slice(1),
      colId: 'exposure',
      colLabel: 'Exposicion IA',
      value: Math.round(val.avgExposure * 100),
      displayValue: `${Math.round(val.avgExposure * 100)}%`,
      meta: {
        'Headcount': val.headcount,
      },
    }))

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto px-4"
    >
      {/* Hero */}
      <div className="text-center mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Acto 1</p>
        <p className="text-4xl md:text-5xl font-extralight text-white">
          {computed.cantidadGerencias} <span className="text-2xl md:text-3xl text-slate-400">gerencias</span>
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">
          con exposicion desigual
        </p>
      </div>

      {/* Narrativa — del script */}
      <p className="text-sm text-slate-400 font-light leading-relaxed max-w-lg mx-auto text-center mb-8">
        La exposicion a la IA no se distribuye uniformemente. <span className="text-cyan-400">{computed.gerenciaMas.name}</span> concentra <span className="text-purple-400">{expGerenciaMas}%</span> mientras <span className="text-cyan-400">{computed.gerenciaMenos.name}</span> opera con solo <span className="text-purple-400">{expGerenciaMenos}%</span>.
      </p>

      {/* Heatmap */}
      <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-xl p-4 md:p-6 mb-6">
        <ExposureHeatmap
          data={heatmapData}
          variant="full"
          colorScale="danger"
          showColLabels={false}
          title="Exposicion por gerencia"
        />
      </div>

      {/* Coaching tip — del script */}
      <p className="text-xs text-slate-500 font-light text-center mb-6">
        ● La exposicion desigual no es un problema a resolver — es informacion sobre donde estan las oportunidades y donde estan los riesgos.
      </p>

      {/* Transicion — del script */}
      <div className="text-center mb-6">
        <p className="text-sm text-slate-300 font-light italic">
          Eso fue el mapa. Ahora veamos cuanto te cuesta cada mes mantener esa distribucion sin actuar.
        </p>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onContinue}>
          Continuar
        </PrimaryButton>
      </div>
    </motion.div>
  )
}
