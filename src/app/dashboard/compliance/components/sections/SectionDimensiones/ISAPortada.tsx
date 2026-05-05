'use client';

// ════════════════════════════════════════════════════════════════════════════
// SECTION DIMENSIONES — Pantalla 1: ISA Portada
// ISAPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Vive dentro de SectionShell — content-only fluido. La Tesla line con color
// del nivel ISA la pinta SectionShell vía `teslaColorOverride`.
//
// Hero pattern alineado con SectionSintesis:51-62:
//   - Section label: text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500
//   - Hero number:   text-[96px] md:text-[120px] font-extralight tabular-nums text-white
//   - Sub-label:     text-slate-500 text-sm uppercase tracking-widest
//   - Body:          text-slate-200 font-light text-lg md:text-xl leading-relaxed
//
// El número es WHITE — la severidad la canta el badge fhr-badge-* + Tesla line.
// ════════════════════════════════════════════════════════════════════════════

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { PrimaryButton } from '@/components/ui/PremiumButton';

import {
  FLOW_COPY,
  ISA_NARRATIVES,
  classifyIsa,
  type IsaNarrative,
} from './_shared/constants';

// ────────────────────────────────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────────────────────────────────

export interface ISAPortadaProps {
  /** ISA en escala 0-100. El state machine padre garantiza non-null. */
  isaScore: number;
  /** Click en CTA → avanzar al Hub. */
  onContinue: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// MOTION
// ────────────────────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export const ISAPortada = memo(function ISAPortada({
  isaScore,
  onContinue,
}: ISAPortadaProps) {
  const level = classifyIsa(isaScore);
  const narrative: IsaNarrative = ISA_NARRATIVES[level];

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-6 pb-8 text-center">
      {/* 1) Section label canónico */}
      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
        className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {FLOW_COPY.isaPortada.contextTag}
      </motion.p>

      {/* 2) Hero number — patrón SectionSintesis */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="flex items-center justify-center leading-none"
      >
        <span
          className="text-[80px] md:text-[112px] font-extralight tabular-nums text-white leading-none"
          aria-label={`Safety Score ${isaScore} sobre 100`}
        >
          {isaScore}
        </span>
      </motion.div>

      {/* 3) Sub-hero label */}
      <p className="text-slate-500 text-sm uppercase tracking-widest">
        {FLOW_COPY.isaPortada.scoreLabel}
      </p>

      {/* 4) Badge nivel — canta la severidad */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.18, ease: EASE }}
      >
        <span className={`fhr-badge ${narrative.badgeClass}`}>
          {narrative.badge}
        </span>
      </motion.div>

      {/* 5) Narrativa interpretativa */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
        className="text-slate-200 font-light text-base md:text-lg leading-relaxed max-w-2xl"
      >
        {narrative.narrative}
      </motion.p>

      {/* 6) CTA primary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
      >
        <PrimaryButton
          icon={ArrowRight}
          iconPosition="right"
          onClick={onContinue}
        >
          {FLOW_COPY.isaPortada.cta}
        </PrimaryButton>
      </motion.div>
    </div>
  );
});
