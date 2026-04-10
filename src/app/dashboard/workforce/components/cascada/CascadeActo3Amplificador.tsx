'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — AMPLIFICADOR — "Los Cruces que Multiplican el Riesgo" (v3.1)
//
// Unidad de analisis: MIXTA (segmento + area + cargo)
// Fuentes: flightRisk[] (segmento), adoptionRisk[] (area), seniorityCompression[]
// Narrativa LITERAL del documento CASCADA_WORKFORCE_v3_1.md
// src/app/dashboard/workforce/components/cascada/CascadeActo3Amplificador.tsx
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

interface CascadeActo3AmplificadorProps {
  data: WorkforceDiagnosticData
  onOpenCross: () => void
}

export default memo(function CascadeActo3Amplificador({
  data,
  onOpenCross,
}: CascadeActo3AmplificadorProps) {
  // Top segmento de fuga (con metas para narrativa)
  const topFlight = useMemo(() => {
    const classified = data.flightRisk.persons.filter(p => p.acotadoGroup && p.standardCategory)
    if (classified.length === 0) return null
    const grouped = groupBySegment(classified)
    const sorted = Array.from(grouped.entries())
      .map(([key, members]) => ({
        key,
        enRiesgo: members.length,
        cumpleMetas: members.filter(m => m.metasCompliance !== null && m.metasCompliance >= 80).length,
      }))
      .sort((a, b) => b.enRiesgo - a.enRiesgo)
    return sorted[0]
  }, [data.flightRisk.persons])

  // Top 2 areas con peor clima (compromiso bajo)
  const topAdoption = useMemo(() => {
    return [...data.adoptionRisk.departments]
      .sort((a, b) => a.avgEngagement - b.avgEngagement)
      .slice(0, 2)
  }, [data.adoptionRisk.departments])

  // Top 1 oportunidad de compresion
  const topCompression = useMemo(() => {
    return [...data.seniorityCompression.opportunities]
      .sort((a, b) => b.annualSavings - a.annualSavings)[0] ?? null
  }, [data.seniorityCompression.opportunities])

  const totalSenales =
    data.flightRisk.count +
    data.adoptionRisk.departments.length +
    data.seniorityCompression.opportunities.length

  // Acto condicional: si las 3 fuentes estan vacias, no renderizar
  if (totalSenales === 0) return null

  // Cuantas de las 3 categorias tienen al menos un item
  const senalesActivas = [
    data.flightRisk.count > 0,
    data.adoptionRisk.departments.length > 0,
    data.seniorityCompression.opportunities.length > 0,
  ].filter(Boolean).length

  return (
    <>
      <ActSeparator label="Amplificador" color="amber" />

      <div>
        {/* Ancla — cantidad de señales activas */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-amber-400">
            {senalesActivas}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            señales que se amplifican
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
          <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
            Tres señales que se amplifican.
          </p>

          {/* FUGA POR SEGMENTO */}
          {topFlight && (
            <div className="text-center space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Fuga por segmento</p>
              <p className="text-base font-light text-slate-300">
                <span className="font-medium text-cyan-400">{topFlight.key}</span>:{' '}
                <span className="font-medium text-purple-400">{topFlight.enRiesgo}</span> en riesgo
                {topFlight.cumpleMetas > 0 && (
                  <>
                    {' '}
                    →{' '}
                    <span className="font-medium text-purple-400">{topFlight.cumpleMetas}</span> cumplen metas
                  </>
                )}
              </p>
              <p className="text-xs italic font-light text-slate-500">
                El mercado caza perfiles, no nombres.
              </p>
            </div>
          )}

          {/* NO-ADOPCIÓN POR ÁREA */}
          {topAdoption.length > 0 && (
            <div className="text-center space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">No-adopción por área</p>
              {topAdoption.map(area => (
                <p key={area.departmentId} className="text-base font-light text-slate-300">
                  <span className="font-medium text-cyan-400">{area.departmentName}</span>:{' '}
                  compromiso{' '}
                  <span className="font-medium text-purple-400">{area.avgEngagement.toFixed(1)}</span>/5
                </p>
              ))}
              <p className="text-xs italic font-light text-slate-500">
                El líder define el clima. La tecnología amplifica el liderazgo, no lo reemplaza.
              </p>
            </div>
          )}

          {/* COMPRESIÓN POR SEGMENTO */}
          {topCompression && (
            <div className="text-center space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Compresión de seniority</p>
              <p className="text-base font-light text-slate-300">
                <span className="font-medium text-cyan-400">{topCompression.position}</span>: Juniors rinden como seniors con IA.
              </p>
              <p className="text-xs italic font-light text-slate-500">
                ¿Conviene eso a tu estructura salarial?
              </p>
            </div>
          )}

          {/* Coaching tip global */}
          <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Cada señal por sí sola es manejable. Las tres juntas, en el mismo segmento,
              son una sentencia.
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto mt-10 flex justify-center">
          <SubtleLink onClick={onOpenCross}>
            Ver los cruces detallados
          </SubtleLink>
        </motion.div>
      </div>
    </>
  )
})
