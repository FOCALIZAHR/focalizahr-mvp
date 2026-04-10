'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 6 — PUNTO CIEGO — "La Contradiccion que Nadie Te Va a Mostrar" (v3.2)
//
// Cierre de la cascada. SIN modal.
// Unidad: SEGMENTO con mayor contradiccion (alta exposicion + alta intocables%)
// Calculo simplificado V1: cruza segmentos de exposicion con segmentos de
// retencion (intocables/total). El segmento con max suma es el "punto ciego":
// el mercado lo va a tomar pero la org lo cataloga como intocable.
//
// v3.2 — Conector del Rio + variante datos escasos
// Narrativa del documento CASCADA_WORKFORCE_v3_2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo6Sintesis.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { groupBySegment } from '@/lib/workforce/segmentUtils'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

interface CascadeActo6SintesisProps {
  data: WorkforceDiagnosticData
  exposurePct: number
}

interface ContradictionResult {
  key: string
  avgExposurePct: number
  intocables: number
  intocablesPct: number
  contradictionScore: number
}

export default memo(function CascadeActo6Sintesis({
  data,
  exposurePct,
}: CascadeActo6SintesisProps) {
  // ── Calcular el segmento con mayor contradiccion ────────────────────
  // FUENTE UNICA: retentionPriority.ranking — agrupar por segmento, computar
  // avgExposure + intocablePct, encontrar segmento con max contradictionScore.
  const contradiction = useMemo<ContradictionResult | null>(() => {
    const classified = data.retentionPriority.ranking.filter(
      r => r.observedExposure > 0 && r.acotadoGroup && r.standardCategory
    )
    if (classified.length === 0) return null

    const grouped = groupBySegment(classified)

    const matches = Array.from(grouped.entries())
      .map(([key, members]) => {
        const total = members.length
        const intocables = members.filter(m => m.tier === 'intocable').length
        const avgExposurePct =
          (members.reduce((s, m) => s + m.observedExposure, 0) / total) * 100
        const intocablesPct = (intocables / total) * 100

        // Contradiccion = ambas metricas altas
        // (alta exposicion = mercado los toma, alta intocables% = org los protege)
        const contradictionScore = avgExposurePct + intocablesPct

        return {
          key,
          avgExposurePct,
          intocables,
          intocablesPct,
          contradictionScore,
        }
      })
      .filter(m => m.intocables > 0)
      .sort((a, b) => b.contradictionScore - a.contradictionScore)

    return matches[0] ?? null
  }, [data.retentionPriority.ranking])

  // ── v3.2 Variante datos escasos ─────────────────────────────────────
  if (!contradiction) {
    return (
      <>
        <ActSeparator label="Punto ciego" color="cyan" />
        <div>
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            <p className="text-base font-light text-slate-400 text-center leading-relaxed">
              Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
              no revela contradicciones evidentes.
            </p>
            <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
              La exposición y la clasificación de talento están alineadas.
              Los segmentos con alta exposición no tienen exceso de
              &ldquo;intocables&rdquo;.
            </p>
            <p className="text-base font-light text-slate-300 text-center leading-relaxed pt-2">
              Esto es coherencia organizacional.
              Lo que ves es lo que hay.
            </p>
            <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                El punto ciego no es una acusación. Es una invitación.
              </p>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <ActSeparator label="Punto ciego" color="cyan" />

      <div>
        {/* v3.2 Conector del Rio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-8">
          <p className="text-base font-light text-slate-400 text-center leading-relaxed">
            Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
            revela una contradicción.
          </p>
        </motion.div>

        {/* Hero — el segmento del punto ciego (en cyan, es entidad/nombre) */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
            El punto ciego
          </p>
          <p className="text-4xl md:text-5xl font-extralight text-cyan-400 tracking-tight">
            {contradiction.key}
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            El punto ciego que nadie más te va a mostrar.
          </p>

          {/* Los dos numeros que generan la contradiccion */}
          <div className="space-y-2 pt-2 text-center">
            <p className="text-base font-light text-slate-300">
              En <span className="font-medium text-cyan-400">{contradiction.key}</span>:
            </p>
            <p className="text-base font-light text-slate-400">
              <span className="font-medium text-purple-400">{Math.round(contradiction.avgExposurePct)}%</span>{' '}
              de exposición a IA.
            </p>
            <p className="text-base font-light text-slate-400">
              <span className="font-medium text-purple-400">{contradiction.intocables}</span>{' '}
              {contradiction.intocables === 1 ? 'persona clasificada' : 'personas clasificadas'} como{' '}
              {contradiction.intocables === 1 ? 'intocable' : 'intocables'}.
            </p>
          </div>

          {/* Las tres hipotesis con "O" McKinsey — del script literal */}
          <div className="space-y-2 pt-4 text-center">
            <p className="text-base font-light text-slate-300">
              O el mercado sabe algo que la organización no ve.
            </p>
            <p className="text-base font-light text-slate-300">
              O la clasificación de &ldquo;intocable&rdquo; ignora la transformación tecnológica.
            </p>
            <p className="text-base font-light text-slate-300">
              O ambas cosas.
            </p>
          </div>

          <p className="text-base font-light text-slate-300 text-center leading-relaxed pt-4">
            Este diagnóstico no prescribe qué hacer.
            Ilumina dónde está la discrepancia más costosa.
          </p>
          <p className="text-base font-light text-slate-300 text-center leading-relaxed">
            La decisión es tuya.
          </p>

          {/* Coaching tip v3.2 */}
          <div className="border-l-2 border-cyan-500/30 pl-4 mt-8">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El punto ciego no es una acusación. Es una invitación.
              Si la contradicción te incomoda, es porque estás listo para verla.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
})
