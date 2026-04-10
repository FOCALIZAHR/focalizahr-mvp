'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — PROBLEMA — "El Talento Atrapado por Segmento" (v3.1)
//
// Unidad de analisis: SEGMENTO → Persona
// Fuente: zombies.persons (con metasCompliance desde Fase 1)
// Narrativa LITERAL del documento CASCADA_WORKFORCE_v3_1.md
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
  onOpenZombies: () => void
}

export default memo(function CascadeActo2Problema({
  data,
  onOpenZombies,
}: CascadeActo2ProblemaProps) {
  const segments = useMemo(() => {
    const classified = data.zombies.persons.filter(z => z.acotadoGroup && z.standardCategory)
    if (classified.length === 0) return []

    const grouped = groupBySegment(classified)

    return Array.from(grouped.entries())
      .map(([key, members]) => {
        const cumpleMetas = members.filter(
          m => m.metasCompliance !== null && m.metasCompliance >= 80
        ).length
        const noCumpleMetas = members.filter(
          m => m.metasCompliance !== null && m.metasCompliance < 80
        ).length
        return {
          key,
          zombies: members.length,
          cumpleMetas,
          noCumpleMetas,
          members,
        }
      })
      .sort((a, b) => b.zombies - a.zombies)
  }, [data.zombies.persons])

  if (data.zombies.count === 0 || segments.length === 0) return null

  const top2 = segments.slice(0, 2)

  return (
    <>
      <ActSeparator label="Problema" color="amber" />

      <div>
        {/* Ancla — total de zombies */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-amber-400">
            {data.zombies.count}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            personas con dominio del cargo &gt; 70%
          </p>
        </motion.div>

        {/* Narrativa — del script v3.1 (literal) */}
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
                  <span className="font-medium text-purple-400">{seg.zombies}</span> con dominio &gt;70%
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

          {/* Coaching tip — del script literal */}
          <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              El patrón no está en las personas. Está en el segmento.
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
