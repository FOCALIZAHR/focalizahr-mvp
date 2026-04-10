'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 1 — GANCHO — "Los Segmentos que Concentran el Riesgo" (v3.1)
//
// Unidad de analisis: SEGMENTO (acotadoGroup × standardCategory)
// Fuente de datos: zombies[] + flightRisk[] (union por employeeId)
// Patron narrativo PURO: ActSeparator + ancla + narrativa literal + SubtleLink
// El detalle (lista completa de segmentos) vive en TopSegmentosModal
// Narrativa exacta del documento CASCADA_WORKFORCE_v3_1.md
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
import type { WorkforceDiagnosticData, PersonAlert } from '../../types/workforce.types'

interface CascadeActo1GanchoProps {
  data: WorkforceDiagnosticData
  onOpenTopSegmentos: () => void
}

export default memo(function CascadeActo1Gancho({
  data,
  onOpenTopSegmentos,
}: CascadeActo1GanchoProps) {
  // ── Computar segmentos desde la union zombies + flightRisk ──────────
  const segmentData = useMemo(() => {
    // Union por employeeId (un mismo empleado puede estar en ambas listas)
    const riskMap = new Map<string, PersonAlert>()
    for (const z of data.zombies.persons) {
      riskMap.set(z.employeeId, z)
    }
    for (const f of data.flightRisk.persons) {
      if (!riskMap.has(f.employeeId)) {
        riskMap.set(f.employeeId, f)
      }
    }
    const allRisk = Array.from(riskMap.values())

    // Filtrar a solo segmentos clasificados (acotadoGroup + standardCategory presentes)
    const classified = allRisk.filter(p => p.acotadoGroup && p.standardCategory)

    if (classified.length === 0) {
      return { allSegments: [], top3: [], concentration: 0, totalRisk: 0 }
    }

    // Calcular metricas por segmento (impactScore = headcount × avgExposure)
    const allSegments = calculateSegmentMetrics(classified, p => p.observedExposure)
    const top3 = allSegments.slice(0, 3)

    // Concentracion = % del impactScore total que vive en el top 3
    const totalImpact = allSegments.reduce((s, m) => s + m.impactScore, 0)
    const top3Impact = top3.reduce((s, m) => s + m.impactScore, 0)
    const concentration = totalImpact > 0 ? Math.round((top3Impact / totalImpact) * 100) : 0

    return {
      allSegments,
      top3,
      concentration,
      totalRisk: classified.length,
    }
  }, [data.zombies.persons, data.flightRisk.persons])

  // Acto condicional: si no hay segmentos clasificados, no renderizar
  if (segmentData.allSegments.length === 0) return null

  return (
    <>
      <ActSeparator label="Gancho" color="cyan" />

      <div>
        {/* Ancla — cantidad de segmentos */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-cyan-400">
            {segmentData.allSegments.length}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            segmentos con riesgo concentrado
          </p>
        </motion.div>

        {/* Narrativa apertura — del script v3.1 (literal) */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            <span className="font-medium text-cyan-400">{segmentData.top3.length}</span>{' '}
            segmentos concentran{' '}
            <span className="font-medium text-purple-400">{segmentData.concentration}%</span>{' '}
            de tu exposición.
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

          {/* Coaching tip — del script literal */}
          <div className="border-l-2 border-cyan-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El impacto no está en el porcentaje. Está en cuántas personas de cada nivel
              y área ejecutan lo que la IA ya domina.
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
