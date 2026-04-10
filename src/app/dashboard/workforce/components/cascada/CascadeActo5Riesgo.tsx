'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 5 — HORIZONTE — "Lo que pasa en 12 meses" (v3.2)
//
// Unidad de analisis: SEGMENTO → Persona
// Fuente: retentionPriority.ranking (con segment fields desde Fase 1)
//
// v3.2 — Conector del Rio + variante datos escasos
// Narrativa del documento CASCADA_WORKFORCE_v3_2.md
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
  exposurePct: number
  onOpenRetention: () => void
}

export default memo(function CascadeActo5Riesgo({
  data,
  exposurePct,
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

  // ── v3.2 Variante datos escasos ─────────────────────────────────────
  if (segments.length === 0) {
    return (
      <>
        <ActSeparator label="Horizonte" color="purple" />
        <div>
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            <p className="text-base font-light text-slate-400 text-center leading-relaxed">
              Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
              no muestra riesgo de retención crítico.
            </p>
            <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
              No hay segmentos con 100% de personas en evaluación.
              Tu talento clave está identificado y protegido.
            </p>
            <div className="border-l-2 border-purple-500/30 pl-4 mt-6">
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                &ldquo;Intocable&rdquo; no significa &ldquo;no se puede tocar&rdquo;.
                Significa &ldquo;no puedes permitirte perderlo sin plan de sucesión&rdquo;.
              </p>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  const top2 = segments.slice(0, 2)

  return (
    <>
      <ActSeparator label="Horizonte" color="purple" />

      <div>
        {/* v3.2 Conector del Rio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-8">
          <p className="text-base font-light text-slate-400 text-center leading-relaxed">
            Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
            y su costo se acumulan.
          </p>
        </motion.div>

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

          <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-2">
            El patrón importa más que los nombres. Si un segmento tiene 0 intocables
            y muchos en evaluación, el problema no son las personas. Es el segmento.
          </p>
          <p className="text-base font-light text-slate-300 text-center leading-relaxed">
            El mercado no espera.
          </p>

          {/* Coaching tip v3.2 */}
          <div className="border-l-2 border-purple-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              &ldquo;Intocable&rdquo; no significa &ldquo;no se puede tocar&rdquo;.
              Significa &ldquo;no puedes permitirte perderlo sin plan de sucesión&rdquo;.
              La clasificación es una señal de inversión, no de inmovilidad.
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
