'use client';

// src/app/dashboard/compliance/components/sections/SectionAncla.tsx
// Stub de Sesión 4 — contenido real en Sesión 6.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionAncla({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="ancla" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Por departamento</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Pills de departamento, gauge y composición — próxima entrega.
      </p>
    </SectionShell>
  );
}
