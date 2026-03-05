'use client'

// ════════════════════════════════════════════════════════════════════════════
// TAB 1: DISTRIBUCIÓN
// Curva Bell + Card SESGO full-width con modal drill-down
// ════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalibrationData } from '../CalibrationHealth.types'
import {
  bucketsToChartData,
  getCalibrationAlert
} from '../CalibrationHealth.utils'
import { BellCurveChart } from '../shared/BellCurveChart'
import { IntegrityTooltip } from '../shared/IntegrityTooltip'
import { CalibrationDistributionModal } from '../CalibrationDistributionModal'
import { BiasDetailModal } from '../BiasDetailModal'

interface DistributionTabProps {
  data: CalibrationData
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function DistributionTab({ data }: DistributionTabProps) {
  const [showDistributionModal, setShowDistributionModal] = useState(false)
  const [selectedGerencia, setSelectedGerencia] = useState<string | null>(null)
  const [showBiasModal, setShowBiasModal] = useState(false)

  const dist = data.orgDistribution

  const chartData = useMemo(() => {
    if (!dist) return []
    return bucketsToChartData(dist.buckets)
  }, [dist])

  const alert = useMemo(() => {
    return getCalibrationAlert(data.byGerencia || [])
  }, [data.byGerencia])

  if (!dist || dist.total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Sin datos de distribución disponibles
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="space-y-3"
    >
      {/* Curva Bell — clickeable */}
      <div
        onClick={() => setShowDistributionModal(true)}
        className="cursor-pointer hover:opacity-90 transition-opacity"
        title="Clic para ver detalle por gerencia"
      >
        <BellCurveChart data={chartData} />
      </div>

      {/* Card SESGO full-width */}
      <div
        onClick={() => setShowBiasModal(true)}
        className="relative rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-5 cursor-pointer group"
      >
        {/* Tesla line top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
              {alert.priority <= 2 ? 'Diagnóstico Focaliza\u00AE' : 'Estado de Calibración'}
            </span>
          </div>
          <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Ver detalle <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">
          {/* Status principal */}
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              alert.biasType === null && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
              alert.biasType === 'CENTRAL' && "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]",
              alert.biasType === 'SEVERA' && "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]",
              alert.biasType === 'INDULGENTE' && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            )} />
            <span className={cn(
              "text-sm font-semibold leading-tight",
              alert.biasType === null && "text-emerald-400",
              alert.biasType === 'CENTRAL' && "text-cyan-400",
              alert.biasType === 'SEVERA' && "text-red-400",
              alert.biasType === 'INDULGENTE' && "text-amber-400"
            )}>
              {alert.narrative.short}
            </span>
          </div>

          {/* Descripción */}
          <p className="text-sm text-slate-300 mb-4">
            {alert.narrative.body}
          </p>

          {/* Barra de integridad */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center">
                <span className="text-slate-500 uppercase tracking-wider">Integridad</span>
                {data.integrityScore && (
                  <IntegrityTooltip
                    baseScore={data.integrityScore.baseScore}
                    penalties={data.integrityScore.penalties}
                    finalScore={data.integrityScore.score}
                  />
                )}
              </div>
              <span className="text-white font-mono font-medium">{data.integrityScore?.score ?? data.overallConfidence}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  (data.integrityScore?.score ?? data.overallConfidence) >= 75
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500"
                    : (data.integrityScore?.score ?? data.overallConfidence) >= 50
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
                )}
                style={{ width: `${data.integrityScore?.score ?? data.overallConfidence}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal distribución por gerencia */}
      <CalibrationDistributionModal
        isOpen={showDistributionModal}
        onClose={() => setShowDistributionModal(false)}
        orgDistribution={dist}
        gerencias={data.gerenciaHeatmap}
        selectedGerencia={selectedGerencia}
        onSelectGerencia={setSelectedGerencia}
      />

      {/* Modal sesgo por gerencia */}
      <BiasDetailModal
        isOpen={showBiasModal}
        onClose={() => setShowBiasModal(false)}
        byGerencia={data.byGerencia || []}
        integrityScore={data.integrityScore || { score: data.overallConfidence, baseScore: data.overallConfidence, penalties: { bias: null, variance: null }, level: 'MEDIUM', narrative: '' }}
      />
    </motion.div>
  )
}
