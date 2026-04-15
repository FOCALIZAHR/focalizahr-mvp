'use client'

// ════════════════════════════════════════════════════════════════════════════
// NINE BOX PORTADA — Estado 1 del Patrón G (vFINAL — hallazgo, no descripción)
// src/app/dashboard/workforce/components/instruments/nine-box/NineBoxPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Filosofía: la portada NO describe el componente. Muestra EL HALLAZGO que
// el cruce 9-Box × Exposición IA expone — el dato que duele.
//
// 3 casos según composición de estrellas + riesgo IA:
//   A) Estrellas en riesgo → "X de Y estrellas en alta exposición" (amber, urgencia)
//   B) Estrellas protegidas → "Tus N estrellas están protegidas" (cyan, validación)
//   C) Sin estrellas → "N personas sin talento crítico identificado" (slate, gap)
//
// CTA dinámico: "Ver quiénes" (con personas reales) | "Ver matriz" (sin foco)
// ════════════════════════════════════════════════════════════════════════════

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { RetentionEntry } from '@/lib/services/WorkforceIntelligenceService'
import { normalizePosition } from './nine-box-utils'

/** Umbral "alta exposición" — alineado con foco del producto en β=0.5+. */
const HIGH_EXPOSURE_THRESHOLD = 0.6

interface NineBoxPortadaProps {
  people: RetentionEntry[]
  onContinue: () => void
}

type Variant = 'estrellas_riesgo' | 'estrellas_protegidas' | 'sin_estrellas'

interface PortadaContent {
  variant: Variant
  bigNumber: string          // "1 de 6" | "6" | "39"
  narrative: React.ReactNode // mensaje principal (1-2 líneas)
  consequence: string        // subtítulo McKinsey (consecuencia, no acción)
  ctaLabel: string
  accent: 'amber' | 'cyan' | 'slate'
}

export default memo(function NineBoxPortada({
  people,
  onContinue,
}: NineBoxPortadaProps) {
  const content = useMemo<PortadaContent>(() => {
    const estrellas = people.filter(
      p => normalizePosition(p.nineBoxPosition ?? '') === 'star',
    )
    const estrellasEnRiesgo = estrellas.filter(
      p => (p.focalizaScore ?? 0) > HIGH_EXPOSURE_THRESHOLD,
    )

    // CASO A — Hay estrellas en riesgo
    if (estrellasEnRiesgo.length > 0) {
      return {
        variant: 'estrellas_riesgo',
        bigNumber: `${estrellasEnRiesgo.length} de ${estrellas.length}`,
        narrative: (
          <>
            de tus{' '}
            <span className="text-cyan-400 font-medium">estrellas</span>{' '}
            {estrellasEnRiesgo.length === 1 ? 'está' : 'están'} en{' '}
            {estrellasEnRiesgo.length === 1 ? 'un cargo' : 'cargos'} con{' '}
            <span className="text-purple-400 font-medium">alta exposición a IA</span>
            .
          </>
        ),
        consequence:
          'Si no actúas, perderás el talento o el cargo lo hará irrelevante.',
        ctaLabel: 'Ver quiénes',
        accent: 'amber',
      }
    }

    // CASO B — Hay estrellas pero ninguna en riesgo
    if (estrellas.length > 0) {
      return {
        variant: 'estrellas_protegidas',
        bigNumber: `${estrellas.length}`,
        narrative: (
          <>
            de tus{' '}
            <span className="text-cyan-400 font-medium">
              {estrellas.length === 1 ? 'estrella está' : 'estrellas están'}
            </span>{' '}
            en cargos protegidos de la IA.
          </>
        ),
        consequence:
          'El talento crítico no está expuesto. Revisa el resto de la organización.',
        ctaLabel: 'Ver matriz',
        accent: 'cyan',
      }
    }

    // CASO C — No hay estrellas clasificadas
    return {
      variant: 'sin_estrellas',
      bigNumber: `${people.length}`,
      narrative: (
        <>
          personas sin{' '}
          <span className="text-cyan-400 font-medium">talento crítico</span>{' '}
          identificado.
        </>
      ),
      consequence:
        'Revisa la clasificación de potencial de tu equipo.',
      ctaLabel: 'Ver matriz',
      accent: 'slate',
    }
  }, [people])

  const numberColor =
    content.accent === 'amber'
      ? 'text-amber-400'
      : content.accent === 'cyan'
        ? 'text-white'
        : 'text-slate-300'

  const numberShadow =
    content.accent === 'amber'
      ? '0 0 40px rgba(245, 158, 11, 0.25)'
      : content.accent === 'cyan'
        ? '0 0 40px rgba(34, 211, 238, 0.20)'
        : undefined

  return (
    <div className="w-full min-h-[500px] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-slate-800/60 shadow-2xl shadow-black/30 relative overflow-hidden">
        {/* Línea Tesla superior */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            boxShadow: '0 0 20px #22D3EE',
          }}
        />

        <div className="px-6 md:px-12 py-14 md:py-20 flex flex-col items-center text-center">
          {/* Número protagonista — el que duele */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-[56px] md:text-[80px] font-extralight leading-none tabular-nums mb-5 ${numberColor}`}
            style={{ textShadow: numberShadow }}
          >
            {content.bigNumber}
          </motion.p>

          {/* Narrativa principal */}
          <p className="text-lg md:text-xl font-light text-slate-200 leading-relaxed max-w-xl mb-8">
            {content.narrative}
          </p>

          {/* Consecuencia — McKinsey style, separada como cita */}
          <p className="text-sm md:text-base font-light italic text-slate-400 leading-relaxed max-w-md mb-12">
            “{content.consequence}”
          </p>

          {/* CTA único */}
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium px-8 py-3 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30"
          >
            {content.ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
})
