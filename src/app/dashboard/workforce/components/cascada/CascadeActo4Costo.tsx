'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 4 — COSTO — "El Precio de la Inercia" (v3.2)
//
// Unidad de analisis: TOTAL → SEGMENTO/AREA
// Fuentes: productivityGap (NUEVO Fase 1), inertiaCost, severanceLiability
//
// v3.2 — Conector del Rio + variante datos escasos
// Narrativa del documento CASCADA_WORKFORCE_v3_2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo4Costo.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
  SubtleLink,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { formatCurrency } from '../../utils/format'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

interface CascadeActo4CostoProps {
  data: WorkforceDiagnosticData
  exposurePct: number
  onOpenInertia: () => void
}

export default memo(function CascadeActo4Costo({
  data,
  exposurePct,
  onOpenInertia,
}: CascadeActo4CostoProps) {
  const productivityTotal = data.productivityGap?.total ?? 0
  const inertiaTotal = data.inertiaCost.totalMonthly
  const severanceTotal = data.severanceLiability.totalSeverance

  const top2ProductivitySegments = useMemo(() => {
    return (data.productivityGap?.bySegment ?? []).slice(0, 2)
  }, [data.productivityGap])

  const top2InertiaAreas = useMemo(() => {
    return [...data.inertiaCost.byDepartment]
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
      .slice(0, 2)
  }, [data.inertiaCost.byDepartment])

  // ── v3.2 Variante datos escasos ─────────────────────────────────────
  if (productivityTotal === 0 && inertiaTotal === 0 && severanceTotal === 0) {
    return (
      <>
        <ActSeparator label="Costo" color="purple" />
        <div>
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            <p className="text-base font-light text-slate-400 text-center leading-relaxed">
              El costo de ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
              aún no es significativo.
            </p>
            <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
              No hay urgencia financiera inmediata. Pero la exposición sigue ahí
              — el costo es de oportunidad, no de gasto.
            </p>
            <div className="border-l-2 border-purple-500/30 pl-4 mt-6">
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                El costo de inercia es lo que pagas HOY. El costo de oportunidad
                es lo que dejas de ganar MAÑANA. Ambos son reales. Uno aparece
                en el P&amp;L, el otro no.
              </p>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <ActSeparator label="Costo" color="purple" />

      <div>
        {/* v3.2 Conector del Rio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-8">
          <p className="text-base font-light text-slate-400 text-center leading-relaxed">
            Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
            tiene un precio.
          </p>
        </motion.div>

        {/* Ancla — productivity gap (golpe emocional inicial) */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-violet-400">
            {formatCurrency(productivityTotal)}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            por mes en rendimiento no entregado
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            El costo de no decidir — cuantificado.
          </p>

          {/* Bloque 1 — Productividad */}
          {productivityTotal > 0 && (
            <div className="text-center space-y-1.5">
              <p className="text-base font-light text-slate-300">
                <span className="font-medium text-purple-400">{formatCurrency(productivityTotal)}</span> CLP/mes
                en salarios pagados por rendimiento no entregado.
              </p>
              {top2ProductivitySegments.map(seg => (
                <p key={seg.key} className="text-sm font-light text-slate-400">
                  → <span className="font-medium text-purple-400">{formatCurrency(seg.total)}</span>{' '}
                  en <span className="font-medium text-cyan-400">{seg.key}</span>
                </p>
              ))}
              <p className="text-xs italic font-light text-slate-500 pt-1">
                Esto ya lo estás pagando. Antes de cualquier IA.
              </p>
            </div>
          )}

          {/* Bloque 2 — Inercia */}
          {inertiaTotal > 0 && (
            <div className="text-center space-y-1.5">
              <p className="text-base font-light text-slate-300">
                <span className="font-medium text-purple-400">{formatCurrency(inertiaTotal)}</span> CLP/mes
                en tareas automatizables que siguen siendo manuales.
              </p>
              {top2InertiaAreas.map(area => (
                <p key={area.departmentId} className="text-sm font-light text-slate-400">
                  → <span className="font-medium text-purple-400">{formatCurrency(area.monthlyCost)}</span>{' '}
                  en <span className="font-medium text-cyan-400">{area.departmentName}</span>
                </p>
              ))}
              <p className="text-xs italic font-light text-slate-500 pt-1">
                Esto es lo que la IA puede liberar.
              </p>
            </div>
          )}

          {/* Bloque 3 — Severance */}
          {severanceTotal > 0 && (
            <div className="text-center space-y-1.5">
              <p className="text-base font-light text-slate-300">
                <span className="font-medium text-purple-400">{formatCurrency(severanceTotal)}</span> CLP
                en finiquitos si la transformación se posterga.
              </p>
              <p className="text-xs italic font-light text-slate-500">
                La diferencia entre transformar y reestructurar es quién decide el timing.
              </p>
            </div>
          )}

          <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-2">
            La inercia es una decisión. Solo que no se documenta.
          </p>

          {/* Coaching tip v3.2 */}
          <div className="border-l-2 border-purple-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El costo de inercia es lo que pagas HOY. El costo de oportunidad
              es lo que dejas de ganar MAÑANA. Ambos son reales. Uno aparece
              en el P&amp;L, el otro no.
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenInertia}>
            Ver el desglose por segmento y área
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
