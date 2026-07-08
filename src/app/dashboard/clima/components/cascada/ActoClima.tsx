'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO CLIMA — Renderer genérico de un Acto de la cascada. Los 5 elementos
// obligatorios (cascada-ejecutiva.md): ActSeparator · ancla numérica ·
// narrativa protagonista + hipótesis "O" · coaching blockquote · SubtleLink.
// Todo el texto viene YA interpolado y con cross-signal insertado por el motor.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ClimaAct } from '@/types/clima-cascada'
import { ActSeparator, SubtleLink, HERO_COLOR, fadeIn, fadeInDelay } from './shared'

interface ActoClimaProps {
  act: ClimaAct
  onCTA?: () => void
}

/** Borde del coaching blockquote por color del acto. */
const COACHING_BORDER: Record<ClimaAct['heroColor'], string> = {
  amber: 'border-amber-500/30',
  purple: 'border-purple-500/30',
  cyan: 'border-cyan-500/30',
  red: 'border-amber-500/30',
}

export default memo(function ActoClima({ act, onCTA }: ActoClimaProps) {
  const [protagonist, ...rest] = act.narrative

  return (
    <>
      <ActSeparator label={act.actSeparator.label} color={act.actSeparator.color} />

      <div>
        {/* Ancla numérica del acto */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p
            className={cn(
              'text-5xl md:text-6xl font-extralight tracking-tight leading-[0.95]',
              HERO_COLOR[act.heroColor],
            )}
          >
            {act.anchor.value}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {act.anchor.caption}
          </p>
        </motion.div>

        {/* Narrativa + hipótesis "O" + coaching */}
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          {protagonist && (
            <p className="text-xl font-light text-slate-300 text-center leading-relaxed">
              {protagonist}
            </p>
          )}

          {rest.map((para, i) => (
            <p
              key={i}
              className="text-base font-light text-slate-400 leading-relaxed text-center"
            >
              {para}
            </p>
          ))}

          {act.hypotheses && (
            <p className="text-base font-light text-slate-400 leading-relaxed text-center">
              {act.hypotheses}
            </p>
          )}

          {/* Coaching tip */}
          <div className={cn('border-l-2 pl-4 mt-6', COACHING_BORDER[act.heroColor])}>
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              {act.coachingTip}
            </p>
          </div>

          {/* CTA */}
          <div className="text-center pt-2">
            <SubtleLink onClick={onCTA}>{act.ctaLabel.replace(/\s*→\s*$/, '')}</SubtleLink>
          </div>
        </motion.div>
      </div>
    </>
  )
})
