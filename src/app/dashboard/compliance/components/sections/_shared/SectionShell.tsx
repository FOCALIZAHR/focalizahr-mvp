'use client';

// src/app/dashboard/compliance/components/sections/_shared/SectionShell.tsx
// Shell común de una sección: card premium + Tesla Line por sección + CTA
// "Siguiente" al pie (si corresponde). Centraliza el token canónico:
//   relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl
//   border border-slate-800 rounded-[20px]

import { ArrowRight } from 'lucide-react';
import TeslaLine from '../../shared/TeslaLine';
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
    <div className="relative overflow-hidden bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px] p-6 md:p-10 w-full">
      {teslaColor && <TeslaLine color={teslaColor} />}

      <div>{children}</div>

      {onNext && nextMeta && (
        <div className="flex justify-end pt-6 border-t border-slate-800/50 mt-8">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all text-sm font-light"
          >
            Siguiente: {nextMeta.railLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
