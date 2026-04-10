'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 5 — RIESGO FUTURO — "El Horizonte por Segmento" (v3.1)
//
// Unidad de analisis: SEGMENTO → Persona
// Fuente: retentionPriority.ranking (con segment fields desde Fase 1)
// Narrativa LITERAL del documento CASCADA_WORKFORCE_v3_1.md
// src/app/dashboard/workforce/components/cascada/CascadeActo5Riesgo.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
  SubtleLink,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { groupBySegment } from '@/lib/workforce/segmentUtils'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

interface CascadeActo5RiesgoProps {
  data: WorkforceDiagnosticData
  onOpenRetention: () => void
}

export default memo(function CascadeActo5Riesgo({
  data,
  onOpenRetention,
}: CascadeActo5RiesgoProps) {
  const segments = useMemo(() => {
    const classified = data.retentionPriority.ranking.filter(
      r => r.acotadoGroup && r.standardCategory
    )
    if (classified.length === 0) return []

    const grouped = groupBySegment(classified)

    return Array.from(grouped.entries())
      .map(([key, members]) => {
        const intocables = members.filter(m => m.tier === 'intocable').length
        const enEvaluacion = members.length - intocables
        return {
          key,
          total: members.length,
          intocables,
          enEvaluacion,
          members,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [data.retentionPriority.ranking])

  if (segments.length === 0) return null

  const top2 = segments.slice(0, 2)

  return (
    <>
      <ActSeparator label="Riesgo futuro" color="purple" />

      <div>
        {/* Ancla — total de intocables */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-violet-400">
            {data.retentionPriority.intocablesCount}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            personas intocables a proteger
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            Lo que pasa si no actúas en 12 meses — por segmento.
          </p>

          {/* Top 2 segmentos con desglose intocables / en evaluacion */}
          <div className="space-y-4 pt-2">
            {top2.map(seg => (
              <div key={seg.key} className="text-center space-y-1">
                <p className="text-base font-light text-slate-300">
                  <span className="font-medium text-cyan-400">{seg.key}</span>:
                </p>
                <p className="text-sm font-light text-slate-400">
                  → <span className="font-medium text-purple-400">{seg.intocables}</span> intocables
                </p>
                <p className="text-sm font-light text-slate-400">
                  → <span className="font-medium text-purple-400">{seg.enEvaluacion}</span> en evaluación
                </p>
              </div>
            ))}
          </div>

          {/* Coaching tips — del script literal */}
          <div className="border-l-2 border-purple-500/30 pl-4 mt-6 space-y-2">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El patrón importa más que los nombres. Si un segmento tiene 0 intocables y muchos
              en evaluación, el problema no son las personas. Es el segmento.
            </p>
            <p className="text-sm italic font-light text-slate-400 leading-relaxed">
              El mercado no espera.
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenRetention}>
            Ver todos los segmentos
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
