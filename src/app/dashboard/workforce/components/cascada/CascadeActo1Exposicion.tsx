'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 1 — "Que Significa" — La exposicion no se distribuye uniformemente
// Patron: ActSeparator + ancla + narrativa + heatmap + coaching tip
// Narrativa exacta del script CASCADA_WORKFORCE_PLANNING_SCRIPT_v2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo1Exposicion.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { ActSeparator, fadeIn, fadeInDelay } from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { ExposureHeatmap, type HeatmapCell } from '@/components/charts'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'
import type { ComputedCascadeValues } from '../../hooks/useWorkforceCascade'

interface CascadeActo1Props {
  data: WorkforceDiagnosticData
  computed: ComputedCascadeValues
  // Props legacy — ya no se usan en scroll continuo, mantenidos por compatibilidad
  onContinue?: () => void
  onBack?: () => void
}

export default memo(function CascadeActo1Exposicion({ data, computed }: CascadeActo1Props) {
  const expGerenciaMas = Math.round(computed.gerenciaMas.avgExposure * 100)
  const expGerenciaMenos = Math.round(computed.gerenciaMenos.avgExposure * 100)
  const cantidadGerencias = computed.cantidadGerencias

  // Transformar exposure.byCategory → HeatmapCell[]
  const heatmapData: HeatmapCell[] = Object.entries(data.exposure.byCategory)
    .filter(([, val]) => val.headcount > 0)
    .sort(([, a], [, b]) => b.avgExposure - a.avgExposure)
    .map(([name, val]) => {
      const pct = Math.round(val.avgExposure * 100)
      return {
        rowId: name,
        rowLabel: name.charAt(0).toUpperCase() + name.slice(1),
        colId: 'exposure',
        colLabel: 'Exposicion IA',
        value: pct,
        displayValue: `${pct}%`,
        meta: {
          'Headcount': val.headcount,
        },
      }
    })

  return (
    <>
      <ActSeparator label="Distribucion" color="cyan" />

      <div>
        {/* Ancla — cantidad de gerencias con exposicion desigual */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-cyan-400">
            {cantidadGerencias}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            gerencias con exposicion desigual
          </p>
        </motion.div>

        {/* Narrativa — del script v2 */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            La exposicion a la IA no se distribuye uniformemente.{' '}
            <span className="font-medium text-cyan-400">{computed.gerenciaMas.name}</span>{' '}
            concentra <span className="font-medium text-purple-400">{expGerenciaMas}%</span>{' '}
            mientras{' '}
            <span className="font-medium text-cyan-400">{computed.gerenciaMenos.name}</span>{' '}
            opera con solo <span className="font-medium text-purple-400">{expGerenciaMenos}%</span>.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            Esa diferencia no es casualidad. Es el reflejo de que tipo de trabajo hace cada area
            — y cuanto de ese trabajo es transaccional versus estrategico.
          </p>

          <p className="text-base font-light text-slate-400 leading-relaxed text-center">
            Las gerencias con mayor exposicion tienen dos caminos: capturar esa eficiencia antes
            que nadie, o convertirse en el cuello de botella cuando la competencia lo haga primero.
          </p>
        </motion.div>

        {/* Heatmap — evidencia visual */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-12">
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/40 rounded-2xl p-6 md:p-8">
            <ExposureHeatmap
              data={heatmapData}
              variant="full"
              colorScale="danger"
              showColLabels={false}
              title="Exposicion por gerencia"
            />
          </div>
        </motion.div>

        {/* Coaching tip */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-8">
          <div className="border-l-2 border-cyan-500/30 pl-4">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              La exposicion desigual no es un problema a resolver — es informacion sobre donde
              estan las oportunidades y donde estan los riesgos. Lo que hagas con esa informacion
              define el resultado.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
})
