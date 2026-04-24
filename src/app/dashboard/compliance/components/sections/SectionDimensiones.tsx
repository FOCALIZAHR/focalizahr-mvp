'use client';

// src/app/dashboard/compliance/components/sections/SectionDimensiones.tsx
// Stub de Sesión 4 — contenido real en Sesión 6.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionDimensiones({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="dimensiones" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Dimensiones</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Grid 6 dimensiones + Teatro amber — próxima entrega.
      </p>
    </SectionShell>
  );
}
