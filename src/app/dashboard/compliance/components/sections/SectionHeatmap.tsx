'use client';

// src/app/dashboard/compliance/components/sections/SectionHeatmap.tsx
// Stub de Sesión 4 — contenido real en Sesión 6.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionHeatmap({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="heatmap" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Vista global</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Grid deptos × dimensiones con cellColor — próxima entrega.
      </p>
    </SectionShell>
  );
}
