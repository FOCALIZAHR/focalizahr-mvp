'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA DETAIL — Vista Content: personas por cuadrante con drill-down
// Cada cuadrante es colapsable con segmentacion por tenure
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { Users, Shield, AlertTriangle } from 'lucide-react'
import QuadrantDrilldown from './QuadrantDrilldown'
import { getQuadrantLabel } from '@/config/tacLabels'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface GerenciaDetailProps {
  gerencia: GerenciaMapItem
}

const QUADRANT_CONFIG = [
  { key: 'FUGA_CEREBROS',    color: 'text-amber-400' },
  { key: 'BURNOUT_RISK',     color: 'text-orange-400' },
  { key: 'BAJO_RENDIMIENTO', color: 'text-slate-400' },
  { key: 'MOTOR_EQUIPO',     color: 'text-emerald-400' },
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
          label={getQuadrantLabel('FUGA_CEREBROS')}
          value={gerencia.riskDistribution.FUGA_CEREBROS}
          total={gerencia.totalPersonas}
          color="text-amber-400"
        />
        <MetricMini
          label={getQuadrantLabel('BURNOUT_RISK')}
          value={gerencia.riskDistribution.BURNOUT_RISK}
          total={gerencia.totalPersonas}
          color="text-orange-400"
        />
        <MetricMiniSuccession
          sucesores={gerencia.sucesores.total}
          posiciones={gerencia.sucesores.posicionesCriticas}
          enPlan={gerencia.sucesores.enPlanFormal}
        />
        <MetricMini
          label={getQuadrantLabel('MOTOR_EQUIPO')}
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
                quadrantLabel={getQuadrantLabel(q.key)}
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

function MetricMiniSuccession({
  sucesores,
  posiciones,
  enPlan
}: {
  sucesores: number
  posiciones: number
  enPlan: number
}) {
  const indice = posiciones > 0 ? (sucesores / posiciones) : null
  const indiceStr = indice !== null ? `${indice.toFixed(1)}x` : null
  const indiceColor = indice === null ? 'text-slate-500'
    : indice < 1.0 ? 'text-red-400'
    : indice <= 2.0 ? 'text-amber-400'
    : 'text-emerald-400'

  return (
    <div
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-center"
      title="Sucesores activos por posicion critica"
    >
      {indiceStr ? (
        <div className={`text-lg font-bold ${indiceColor}`}>{indiceStr}</div>
      ) : (
        <div className="text-lg font-bold text-cyan-400">{sucesores}</div>
      )}
      <div className="text-[10px] text-slate-500">Cobertura</div>
      <div className="text-[10px] text-slate-600">
        {posiciones > 0
          ? `${posiciones} pos · ${sucesores} suc`
          : `${sucesores} sucesores`
        }
      </div>
      {enPlan > 0 && <div className="text-[10px] text-slate-500 mt-0.5">{enPlan} con plan</div>}
    </div>
  )
}
