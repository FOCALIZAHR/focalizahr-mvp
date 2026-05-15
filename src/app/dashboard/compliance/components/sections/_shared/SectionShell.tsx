'use client';

// src/app/dashboard/compliance/components/sections/_shared/SectionShell.tsx
// Shell común de una sección: card premium + Tesla Line por sección + CTA
// "Siguiente" al pie (si corresponde). Tokens canónicos FocalizaHR
// (post-Gate 5d Sub-2D — identidad rescatada):
//   relative overflow-hidden bg-slate-900/60 backdrop-blur-sm
//   border border-slate-800/40 rounded-2xl
// Padding canónico: px-6 py-14 md:px-10 md:py-20.
// CTA "Siguiente" usa SecondaryButton de PremiumButton (no botón custom).

import { ArrowRight } from 'lucide-react';
import TeslaLine from '../../shared/TeslaLine';
import { SecondaryButton } from '@/components/ui/PremiumButton';
import {
  COMPLIANCE_SECTIONS,
  SECTION_INDEX,
  TESLA_BY_SECTION,
} from '@/app/dashboard/compliance/lib/labels';
import type { ComplianceSectionId } from '@/types/compliance';

interface SectionShellProps {
  sectionId: ComplianceSectionId;
  /** Override del color Tesla (ej. Síntesis dinámico según ISA). */
  teslaColorOverride?: string | null;
  /** Handler del CTA "Siguiente". Si no se provee, no se renderiza. */
  onNext?: () => void;
  children: React.ReactNode;
}

export default function SectionShell({
  sectionId,
  teslaColorOverride,
  onNext,
  children,
}: SectionShellProps) {
  const idx = SECTION_INDEX[sectionId];
  const nextMeta = COMPLIANCE_SECTIONS[idx + 1] ?? null;
  const teslaColor =
    teslaColorOverride !== undefined ? teslaColorOverride : TESLA_BY_SECTION[sectionId];

  return (
    <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-slate-800/40 rounded-2xl px-6 py-14 md:px-10 md:py-20 w-full">
      {teslaColor && <TeslaLine color={teslaColor} />}

      <div>{children}</div>

      {onNext && nextMeta && (
        <div className="flex justify-end pt-6 border-t border-slate-800/40 mt-8">
          <SecondaryButton
            icon={ArrowRight}
            iconPosition="right"
            onClick={onNext}
          >
            Siguiente: {nextMeta.railLabel}
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
