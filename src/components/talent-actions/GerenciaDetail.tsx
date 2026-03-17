'use client'

// ════════════════════════════════════════════════════════════════════════════
// GERENCIA DETAIL — Metricas + cuadrantes con drill-down
// Usa clases .fhr-* de focalizahr-unified.css
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import QuadrantDrilldown from './QuadrantDrilldown'
import { getQuadrantLabel } from '@/config/tacLabels'
import type { GerenciaMapItem } from '@/lib/services/TalentActionService'

interface GerenciaDetailProps {
  gerencia: GerenciaMapItem
}

const QUADRANT_CONFIG = [
  { key: 'FUGA_CEREBROS',    color: 'var(--fhr-warning)' },
  { key: 'BURNOUT_RISK',     color: 'var(--fhr-error)' },
  { key: 'BAJO_RENDIMIENTO', color: 'var(--fhr-text-muted)' },
  { key: 'MOTOR_EQUIPO',     color: 'var(--fhr-success)' },
]

export default function GerenciaDetail({ gerencia }: GerenciaDetailProps) {
  return (
    <div className="space-y-6">

      {/* Resumen rapido — fhr-card-metric */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricMini
          label={getQuadrantLabel('FUGA_CEREBROS')}
          value={gerencia.riskDistribution.FUGA_CEREBROS}
          total={gerencia.totalPersonas}
          color="var(--fhr-warning)"
        />
        <MetricMini
          label={getQuadrantLabel('BURNOUT_RISK')}
          value={gerencia.riskDistribution.BURNOUT_RISK}
          total={gerencia.totalPersonas}
          color="var(--fhr-error)"
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
          color="var(--fhr-success)"
        />
      </div>

      {/* Cuadrantes — acordeones */}
      <div className="fhr-card-static">
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
// METRIC MINI — fhr-card-metric pattern
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
    <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 rounded-[16px] p-3 text-center">
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="text-[10px] text-slate-500">{percent}%</div>
      {suffix && <div className="text-[10px] text-slate-400 mt-0.5">{suffix}</div>}
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
  const indiceColor = indice === null ? 'var(--fhr-text-muted)'
    : indice < 1.0 ? 'var(--fhr-error)'
    : indice <= 2.0 ? 'var(--fhr-warning)'
    : 'var(--fhr-success)'

  return (
    <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 rounded-[16px] p-3 text-center" title="Sucesores activos por posicion critica">
      {indiceStr ? (
        <div className="text-lg font-bold" style={{ color: indiceColor }}>{indiceStr}</div>
      ) : (
        <div className="text-lg font-bold text-cyan-400">{sucesores}</div>
      )}
      <div className="text-[10px] text-slate-400">Cobertura</div>
      <div className="text-[10px] text-slate-500">
        {posiciones > 0
          ? `${posiciones} pos · ${sucesores} suc`
          : `${sucesores} sucesores`
        }
      </div>
      {enPlan > 0 && <div className="text-[10px] text-slate-400 mt-0.5">{enPlan} con plan</div>}
    </div>
  )
}
