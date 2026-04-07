'use client'

// ════════════════════════════════════════════════════════════════════════════
// ACTO PORTADA — Pantalla narrativa de contexto antes de cada acción
// Patrón Cascada Ejecutiva: portada → acción. Zero formulario en portada.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { ArrowRight } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton'

interface ActoPortadaProps {
  actNumber: number
  title: string
  subtitle: string
  narrative: string
  coachingTip: string
  cta: string
  ctaSecondary?: string
  onAction: () => void
  onSkip?: () => void
}

export default memo(function ActoPortada({
  actNumber,
  title,
  subtitle,
  narrative,
  coachingTip,
  cta,
  ctaSecondary,
  onAction,
  onSkip,
}: ActoPortadaProps) {
  return (
    <div className="fhr-card-glass relative overflow-hidden p-8 md:p-12">
      {/* Watermark */}
      <div className="absolute bottom-[-24px] right-[-6px] text-[180px] font-black text-white opacity-[0.06] pointer-events-none select-none leading-none">
        {actNumber}
      </div>

      {/* Content — centered, narrative-driven */}
      <div className="flex flex-col items-center text-center min-h-[50vh] justify-center">
        {/* Title split — first line bold, subtitle gradient */}
        <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-3xl font-bold fhr-title-gradient mt-0.5">{subtitle}</p>

        {/* Narrative */}
        <p className="text-base text-slate-400 font-light leading-relaxed max-w-lg mt-8">
          {narrative}
        </p>

        {/* Coaching tip */}
        <p className="text-xs text-slate-500 font-light mt-6">
          ● {coachingTip}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 mt-10">
          {ctaSecondary && onSkip && (
            <SecondaryButton onClick={onSkip}>
              {ctaSecondary}
            </SecondaryButton>
          )}
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onAction}>
            {cta}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})
