'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 1 — CONCENTRACION — "Donde se Concentra el Riesgo" (v3.2)
//
// Unidad de analisis: SEGMENTO (acotadoGroup × standardCategory)
//
// FUENTE CORRECTA: retentionPriority.ranking — la unica lista en el diagnostic
// que contiene TODOS los empleados con SOC code mapeado + observedExposure +
// segment fields. zombies/flightRisk son subsets demasiado restrictivos y
// frecuentemente vienen vacios.
//
// Filtro: observedExposure > 0 (cualquier persona con exposicion no-cero)
// Patron narrativo PURO: ActSeparator + ancla + narrativa literal + SubtleLink
// El detalle vive en TopSegmentosModal
//
// v3.2 — Conector del Rio: "Ese [exposurePct]% no se distribuye igual."
// v3.2 — Variante datos escasos: NO return null. Render "patron saludable".
// Narrativa exacta del documento CASCADA_WORKFORCE_v3_2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo1Gancho.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ActSeparator,
  fadeIn,
  fadeInDelay,
  SubtleLink,
} from '@/app/dashboard/executive-hub/components/GoalsCorrelation/cascada/shared'
import { calculateSegmentMetrics } from '@/lib/workforce/segmentUtils'
import type { WorkforceDiagnosticData } from '../../types/workforce.types'

interface CascadeActo1GanchoProps {
  data: WorkforceDiagnosticData
  exposurePct: number
  onOpenTopSegmentos: () => void
}

export default memo(function CascadeActo1Gancho({
  data,
  exposurePct,
  onOpenTopSegmentos,
}: CascadeActo1GanchoProps) {
  const segmentData = useMemo(() => {
    // FUENTE: retentionPriority.ranking (todos los empleados con SOC mapeado)
    // Filtro: observedExposure > 0 + segment fields presentes
    const exposed = data.retentionPriority.ranking.filter(
      r => r.observedExposure > 0 && r.acotadoGroup && r.standardCategory
    )

    if (exposed.length === 0) {
      return { allSegments: [], top3: [], concentration: 0, totalExposed: 0 }
    }

    // Metricas por segmento (impactScore = headcount × avgExposure)
    const allSegments = calculateSegmentMetrics(exposed, p => p.observedExposure)
    const top3 = allSegments.slice(0, 3)

    // Concentracion = % del impactScore total que vive en el top 3
    const totalImpact = allSegments.reduce((s, m) => s + m.impactScore, 0)
    const top3Impact = top3.reduce((s, m) => s + m.impactScore, 0)
    const concentration = totalImpact > 0 ? Math.round((top3Impact / totalImpact) * 100) : 0

    return {
      allSegments,
      top3,
      concentration,
      totalExposed: exposed.length,
    }
  }, [data.retentionPriority.ranking])

  // ── v3.2 Variante datos escasos: NO return null ─────────────────────
  if (segmentData.allSegments.length === 0) {
    return (
      <>
        <ActSeparator label="Concentración" color="cyan" />
        <div>
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest text-center">
              Conector
            </p>
            <p className="text-lg font-light text-slate-400 text-center leading-relaxed">
              Ese <span className="font-medium text-cyan-400">{exposurePct}%</span> se distribuye uniformemente.
            </p>
            <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
              No hay concentración de riesgo en segmentos específicos.
              La exposición es transversal a tu organización.
            </p>
            <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                Esto no significa que no hay oportunidad. Significa que la oportunidad
                está en toda la empresa, no en un área específica.
              </p>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <ActSeparator label="Concentración" color="cyan" />

      <div>
        {/* v3.2 Conector del Rio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-8">
          <p className="text-base font-light text-slate-400 text-center leading-relaxed">
            Ese <span className="font-medium text-cyan-400">{exposurePct}%</span> no se distribuye igual.
          </p>
        </motion.div>

        {/* Ancla — cantidad de segmentos */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-cyan-400">
            {segmentData.allSegments.length}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            segmentos con exposición a IA
          </p>
        </motion.div>

        {/* Narrativa — del script v3.2 (literal) */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            <span className="font-medium text-cyan-400">{segmentData.top3.length}</span>{' '}
            segmentos concentran{' '}
            <span className="font-medium text-purple-400">{segmentData.concentration}%</span>{' '}
            de tu exposición total.
          </p>

          {/* Lista top 3 — narrativa visual del script */}
          <div className="space-y-2 pt-2">
            {segmentData.top3.map(seg => {
              const expPct = Math.round(seg.avgExposure * 100)
              return (
                <p
                  key={seg.key}
                  className="text-base font-light text-slate-400 leading-relaxed text-center"
                >
                  <span className="font-medium text-cyan-400">{seg.key}</span>:{' '}
                  <span className="font-medium text-purple-400">{seg.headcount}</span>{' '}
                  personas ×{' '}
                  <span className="font-medium text-purple-400">{expPct}%</span>{' '}
                  exposición
                </p>
              )
            })}
          </div>

          <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
            El impacto no está en el porcentaje.
            Está en cuántas personas de cada nivel y área
            ejecutan lo que la IA ya domina.
          </p>

          {/* Coaching tip v3.2 */}
          <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Concentración no es malo. Significa que sabes dónde enfocar.
              Un segmento con 30% de la exposición total es un punto de apalancamiento.
            </p>
          </div>
        </motion.div>

        {/* SubtleLink al modal con la lista completa de segmentos */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenTopSegmentos}>
            Ver los {segmentData.allSegments.length} segmentos
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
