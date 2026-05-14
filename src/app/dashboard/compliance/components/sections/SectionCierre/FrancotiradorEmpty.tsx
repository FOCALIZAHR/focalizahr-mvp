'use client';

// ════════════════════════════════════════════════════════════════════════════
// SECTION CIERRE (C4 — Plan Global) — Empty state Francotirador
// FrancotiradorEmpty.tsx
// ════════════════════════════════════════════════════════════════════════════
// Se renderiza cuando NO hay CompliancePlanAction registradas en el ciclo.
// Patrón francotirador (skill focalizahr-narrativas / patron-persuasion paso 6):
// 4 líneas lapidarias McKinsey+Apple. CTA navega al simulador para dar al CEO
// la última oportunidad de registrar acciones antes del cierre.

import { SecondaryButton } from '@/components/ui/PremiumButton';
import { FRANCOTIRADOR_COPY } from './_shared/constants';

interface FrancotiradorEmptyProps {
  onNavigateToSimulador: () => void;
}

export default function FrancotiradorEmpty({
  onNavigateToSimulador,
}: FrancotiradorEmptyProps) {
  return (
    <div className="relative overflow-hidden p-6 md:p-8 bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-2xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 text-center">
        {FRANCOTIRADOR_COPY.eyebrow}
      </p>

      <div className="max-w-xl mx-auto space-y-2 text-center">
        {FRANCOTIRADOR_COPY.body.map((line, i) => (
          <p
            key={i}
            className="text-slate-300 font-light text-base md:text-lg leading-relaxed"
          >
            {line}
          </p>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <SecondaryButton onClick={onNavigateToSimulador}>
          {FRANCOTIRADOR_COPY.cta} →
        </SecondaryButton>
      </div>
    </div>
  );
}
