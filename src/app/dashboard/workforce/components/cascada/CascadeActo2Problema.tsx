'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — TALENTO ATRAPADO — "Quienes ejecutan lo que deberian pensar" (v3.2)
//
// Unidad de analisis: SEGMENTO → Persona
//
// FUENTE CORRECTA: retentionPriority.ranking filtrado por:
//   - roleFitScore > 75 (dominan su cargo)
//   - observedExposure > 0.5 (cargo expuesto a IA)
// Espiritu del Acto: "talento ejecutando lo que deberia estar pensando"
// = personas que dominan su cargo PERO ese cargo va a ser absorbido por IA
//
// La deteccion estricta zombies[] (rolefit > 85 + ability ≤ 2 + engagement ≤ 2)
// frecuentemente viene vacia. Esta version captura la espiritu del Acto.
//
// v3.2 — Conector del Rio + variante datos escasos
// Narrativa del documento CASCADA_WORKFORCE_v3_2.md
// src/app/dashboard/workforce/components/cascada/CascadeActo2Problema.tsx
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

interface CascadeActo2ProblemaProps {
  data: WorkforceDiagnosticData
  exposurePct: number
  onOpenZombies: () => void
}

export default memo(function CascadeActo2Problema({
  data,
  exposurePct,
  onOpenZombies,
}: CascadeActo2ProblemaProps) {
  const computed = useMemo(() => {
    // FUENTE: retentionPriority.ranking
    // Filtro: dominio alto + cargo expuesto + segmento clasificado
    const trapped = data.retentionPriority.ranking.filter(
      r =>
        r.roleFitScore > 75 &&
        (r.focalizaScore ?? r.observedExposure) > 0.5 &&
        r.acotadoGroup &&
        r.standardCategory
    )

    if (trapped.length === 0) return { totalTrapped: 0, segments: [] }

    const grouped = groupBySegment(trapped)
    const segments = Array.from(grouped.entries())
      .map(([key, members]) => {
        const cumpleMetas = members.filter(
          m => m.metasCompliance !== null && m.metasCompliance >= 80
        ).length
        const noCumpleMetas = members.filter(
          m => m.metasCompliance !== null && m.metasCompliance < 80
        ).length
        return {
          key,
          trapped: members.length,
          cumpleMetas,
          noCumpleMetas,
          members,
        }
      })
      .sort((a, b) => b.trapped - a.trapped)

    return { totalTrapped: trapped.length, segments }
  }, [data.retentionPriority.ranking])

  // ── v3.2 Variante datos escasos ─────────────────────────────────────
  if (computed.totalTrapped === 0) {
    return (
      <>
        <ActSeparator label="Talento atrapado" color="amber" />
        <div>
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            <p className="text-base font-light text-slate-400 text-center leading-relaxed">
              En ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
              no hay personas con dominio &gt;75% de tareas automatizables.
            </p>
            <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
              No hay talento atrapado en el sentido tradicional.
              La oportunidad está en potenciar, no en reasignar.
            </p>
            <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                La conversación no es &ldquo;qué eliminar&rdquo; — es &ldquo;qué liberar&rdquo;.
              </p>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  const top2 = computed.segments.slice(0, 2)

  return (
    <>
      <ActSeparator label="Talento atrapado" color="amber" />

      <div>
        {/* v3.2 Conector del Rio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-8">
          <p className="text-base font-light text-slate-400 text-center leading-relaxed">
            En ese <span className="font-medium text-cyan-400">{exposurePct}%</span>,
            hay personas con dominio alto de tareas automatizables.
          </p>
        </motion.div>

        {/* Ancla — total de personas atrapadas */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-amber-400">
            {computed.totalTrapped}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            personas que dominan un cargo expuesto a IA
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            Talento ejecutando lo que debería estar pensando.
          </p>

          {/* Top 2 segmentos con detalle metas */}
          <div className="space-y-4 pt-2">
            {top2.map(seg => (
              <div key={seg.key} className="text-center space-y-1">
                <p className="text-base font-light text-slate-300">
                  <span className="font-medium text-cyan-400">{seg.key}</span>:{' '}
                  <span className="font-medium text-purple-400">{seg.trapped}</span> con dominio &gt;75%
                </p>
                {seg.cumpleMetas > 0 && (
                  <p className="text-sm font-light text-slate-400">
                    → <span className="font-medium text-purple-400">{seg.cumpleMetas}</span> cumplen metas. Capacidad mal asignada.
                  </p>
                )}
                {seg.noCumpleMetas > 0 && (
                  <p className="text-sm font-light text-slate-400">
                    → <span className="font-medium text-purple-400">{seg.noCumpleMetas}</span> no cumplen. Ya no están rindiendo.
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-2">
            El patrón no está en las personas. Está en el segmento.
          </p>

          {/* Coaching tip v3.2 */}
          <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              La conversación no es &ldquo;qué eliminar&rdquo; — es &ldquo;qué liberar&rdquo;.
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenZombies}>
            Ver el desglose por segmento
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
