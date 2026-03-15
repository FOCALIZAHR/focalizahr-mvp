'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA DETAIL — Vista Content: personas por cuadrante con drill-down
// Cada cuadrante es colapsable con segmentacion por tenure
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { Users, Shield, AlertTriangle } from 'lucide-react'
import QuadrantDrilldown from './QuadrantDrilldown'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface GerenciaDetailProps {
  gerencia: GerenciaMapItem
}

const QUADRANT_CONFIG = [
  { key: 'FUGA_CEREBROS',    label: 'Fuga de Cerebros',  color: 'text-amber-400',   desc: 'Alto ajuste, alta aspiracion, bajo engagement' },
  { key: 'BURNOUT_RISK',     label: 'Riesgo Burnout',    color: 'text-orange-400',  desc: 'Alto ajuste, alto engagement, baja aspiracion' },
  { key: 'BAJO_RENDIMIENTO', label: 'Bajo Rendimiento',  color: 'text-slate-400',   desc: 'Bajo ajuste, bajo engagement' },
  { key: 'MOTOR_EQUIPO',     label: 'Motor del Equipo',  color: 'text-emerald-400', desc: 'Alto ajuste, alto engagement, alta aspiracion' },
]

export default function GerenciaDetail({ gerencia }: GerenciaDetailProps) {

  const fugaCount = gerencia.riskDistribution.FUGA_CEREBROS
  const totalWithData = gerencia.clasificadas

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h3 className="text-lg font-light text-white">
          Distribucion de talento — <span className="text-cyan-400">{gerencia.gerenciaName}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {gerencia.clasificadas} de {gerencia.totalPersonas} personas con matrices calculadas
        </p>
      </div>

      {/* Resumen rapido — above the fold */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricMini
          label="En fuga"
          value={gerencia.riskDistribution.FUGA_CEREBROS}
          total={gerencia.totalPersonas}
          color="text-amber-400"
        />
        <MetricMini
          label="Burnout"
          value={gerencia.riskDistribution.BURNOUT_RISK}
          total={gerencia.totalPersonas}
          color="text-orange-400"
        />
        <MetricMini
          label="Sucesores"
          value={gerencia.sucesores.total}
          total={gerencia.totalPersonas}
          color="text-cyan-400"
          suffix={gerencia.sucesores.enPlanFormal > 0 ? `${gerencia.sucesores.enPlanFormal} con plan` : undefined}
        />
        <MetricMini
          label="Motor"
          value={gerencia.riskDistribution.MOTOR_EQUIPO}
          total={gerencia.totalPersonas}
          color="text-emerald-400"
        />
      </div>

      {/* Cuadrantes con drill-down */}
      <div className="space-y-2">
        {QUADRANT_CONFIG.map((q, i) => {
          const count = gerencia.riskDistribution[q.key as keyof typeof gerencia.riskDistribution] || 0

          return (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <QuadrantDrilldown
                quadrant={q.key}
                quadrantLabel={q.label}
                quadrantColor={q.color}
                gerenciaId={gerencia.gerenciaId}
                count={count}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// METRIC MINI — Metrica compacta above the fold
// ════════════════════════════════════════════════════════════════════════════

function MetricMini({
  label,
  value,
  total,
  color,
  suffix
}: {
  label: string
  value: number
  total: number
  color: string
  suffix?: string
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-[10px] text-slate-600">{percent}%</div>
      {suffix && <div className="text-[10px] text-slate-500 mt-0.5">{suffix}</div>}
    </div>
  )
}
