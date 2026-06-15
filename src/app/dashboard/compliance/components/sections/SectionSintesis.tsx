'use client';

// src/app/dashboard/compliance/components/sections/SectionSintesis.tsx
// El gancho (Síntesis del ciclo). Rediseño Portada: StatusBadge + narrativa +
// CTA único. Sin hero gigante repetido (ese número es del Acto Ancla), sin chips
// de conteo (viven en SectionAlertas / SectionConvergencia), sin 2º CTA.
//
// Selector = synthesis.diagnosticType del AmbienteSynthesisEngine (el MISMO motor
// que alimenta La Decisión). El gancho NO clasifica; solo dentro de los tipos
// sanos parte por coverageGap (matriz 2 ejes). Copy verbatim en ganchoVariants.

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionShell from './_shared/SectionShell';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { pickLowestISA } from '@/app/dashboard/compliance/lib/format';
import {
  selectGanchoVariant,
  interpolateGancho,
  GANCHO_VARIANTS,
  type GanchoVariantKey,
} from '@/app/dashboard/compliance/lib/ganchoVariants';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionSintesis({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const orgISA = report.data.orgISA;
  const synthesis = report.data.synthesis;
  // Umbral pleno/de-pocos = classifyD4 (fuente única). NO re-derivar.
  const coverageGapPct = report.data.beat1Seed?.classifyD4Trace.coverageGapPct ?? 0;

  // Dev preview (visto): ?ganchoVariant=<key>[&ganchoISA=<n>] fuerza variante +
  // número para revisión visual. Param ausente = comportamiento real de producción.
  const sp =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const previewKey = sp?.get('ganchoVariant');
  const previewISA = sp?.get('ganchoISA');
  const isPreview = !!previewKey && previewKey in GANCHO_VARIANTS;

  const variantKey: GanchoVariantKey = isPreview
    ? (previewKey as GanchoVariantKey)
    : synthesis
      ? selectGanchoVariant(synthesis.diagnosticType, coverageGapPct, orgISA)
      : 'generic';
  const variant = GANCHO_VARIANTS[variantKey];
  const isGeneric = variantKey === 'generic';

  const displayISA =
    isPreview && previewISA !== null && previewISA !== '' ? Number(previewISA) : orgISA;

  // CTA único "Ver evidencia" → Acto Ancla (AnclaISA = 1er beat de la cascada).
  // Fallback a la vista por departamento cuando no hay cascada (AREA_MANAGER /
  // campaña sin ISA). El Acto Ancla como pantalla aparte es otro gate.
  const deptMenorISA = pickLowestISA(report.data.departments);
  const goEvidence = () => {
    if (report.narratives.cascada) {
      hook.selectSection('cascada');
    } else if (deptMenorISA) {
      hook.selectDepartment(deptMenorISA.departmentId);
      hook.selectSection('ancla');
    } else {
      hook.selectSection('cascada');
    }
  };

  return (
    <SectionShell sectionId="sintesis" teslaColorOverride={variant.tone}>
      <div className="flex flex-col items-center text-center">
        {/* StatusBadge — la severidad la canta una sola cosa: el tono. */}
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border"
          style={{
            backgroundColor: `${variant.tone}15`,
            borderColor: `${variant.tone}40`,
            color: variant.tone,
          }}
        >
          {variant.badgeLabel}
        </span>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl md:text-2xl font-extralight text-white leading-relaxed max-w-3xl mt-10"
        >
          {interpolateGancho(variant.titular, displayISA)}
        </motion.p>
        {variant.insight && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base font-light italic text-slate-400 leading-relaxed max-w-xl mt-5"
          >
            {variant.insight}
          </motion.p>
        )}

        {/* CTA único — suprimido en GENERIC (Mundo A: cascada no disponible). */}
        {!isGeneric && (
          <div className="mt-12">
            <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={goEvidence}>
              Ver evidencia
            </PrimaryButton>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
