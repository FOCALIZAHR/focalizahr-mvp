'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO 3 — SENALES CRUZADAS — "Los Cruces que Amplifican el Riesgo" (v3.2)
//
// Unidad de analisis: MIXTA (segmento + area + cargo)
//
// FUENTES (correctas):
//   - Fuga: retentionPriority.ranking filtrado por (intocable+valioso) × exposicion alta
//           — el espiritu es "talento que el mercado va a cazar", no zombies estrictos
//   - Clima: adoptionRisk.departments (as-is, depto-level)
//   - Compresion: seniorityCompression.opportunities (as-is, cargo-level)
//
// v3.2 — Conector del Rio + variante datos escasos
// Narrativa del documento CASCADA_WORKFORCE_v3_2.md
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
  exposurePct: number
  onOpenCross: () => void
}

export default memo(function CascadeActo3Amplificador({
  data,
  exposurePct,
  onOpenCross,
}: CascadeActo3AmplificadorProps) {
  // ── Top segmento de fuga (derivado de retentionPriority) ──────────────
  // Espiritu: "talento que el mercado va a cazar" = personas valiosas o
  // intocables que ademas estan en cargos altamente expuestos a IA.
  const topFlight = useMemo(() => {
    const fugaRisk = data.retentionPriority.ranking.filter(
      r =>
        (r.tier === 'intocable' || r.tier === 'valioso') &&
        r.observedExposure > 0.5 &&
        r.acotadoGroup &&
        r.standardCategory
    )
    if (fugaRisk.length === 0) return null

    const grouped = groupBySegment(fugaRisk)
    const sorted = Array.from(grouped.entries())
      .map(([key, members]) => ({
        key,
        enRiesgo: members.length,
        cumpleMetas: members.filter(
          m => m.metasCompliance !== null && m.metasCompliance >= 80
        ).length,
      }))
      .sort((a, b) => b.enRiesgo - a.enRiesgo)
    return sorted[0]
  }, [data.retentionPriority.ranking])

  // ── Top 2 areas con peor clima (engagement bajo) ──────────────────────
  const topAdoption = useMemo(() => {
    return [...data.adoptionRisk.departments]
      .sort((a, b) => a.avgEngagement - b.avgEngagement)
      .slice(0, 2)
  }, [data.adoptionRisk.departments])

  // ── Top 1 oportunidad de compresion ───────────────────────────────────
  const topCompression = useMemo(() => {
    return (
      [...data.seniorityCompression.opportunities].sort(
        (a, b) => b.annualSavings - a.annualSavings
      )[0] ?? null
    )
  }, [data.seniorityCompression.opportunities])

  // Cuantas señales tienen al menos un item
  const senalesActivas = [
    topFlight !== null,
    topAdoption.length > 0,
    topCompression !== null,
  ].filter(Boolean).length

  // ── v3.2 Variante datos escasos ─────────────────────────────────────
  if (senalesActivas === 0) {
    return (
      <>
        <ActSeparator label="Señales cruzadas" color="amber" />
        <div>
          <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
            <p className="text-base font-light text-slate-400 text-center leading-relaxed">
              Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
              no muestra cruces de riesgo significativos.
            </p>
            <p className="text-base font-light text-slate-400 text-center leading-relaxed pt-4">
              No hay concentración de fuga + exposición. No hay áreas con baja
              adopción + alta exposición. No hay compresión salarial por nivel.
            </p>
            <p className="text-base font-light text-slate-300 text-center leading-relaxed pt-2">
              Esto es un patrón saludable.
            </p>
            <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                Los cruces revelan dónde actuar primero. Que no aparezcan
                significa que la exposición existe pero no está amplificada
                por otros factores.
              </p>
            </div>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <ActSeparator label="Señales cruzadas" color="amber" />

      <div>
        {/* v3.2 Conector del Rio */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto mb-8">
          <p className="text-base font-light text-slate-400 text-center leading-relaxed">
            Ese <span className="font-medium text-cyan-400">{exposurePct}%</span>{' '}
            se cruza con otros riesgos.
          </p>
        </motion.div>

        {/* Ancla — cantidad de señales activas */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-amber-400">
            {senalesActivas}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {senalesActivas === 1 ? 'señal que se amplifica' : 'señales que se amplifican'}
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

          {/* Coaching tip v3.2 */}
          <div className="border-l-2 border-amber-500/30 pl-4 mt-6">
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              Los cruces revelan dónde actuar primero. Alta exposición + alta fuga
              = urgencia. Alta exposición + buen clima = oportunidad de pilotos.
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
