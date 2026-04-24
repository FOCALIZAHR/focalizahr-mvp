'use client';

// src/app/dashboard/compliance/components/sections/SectionSintesis.tsx
// Stub de Sesión 4 — contenido real en Sesión 5.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionSintesis({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="sintesis" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Síntesis</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Contenido completo en la próxima entrega.
      </p>
    </SectionShell>
  );
}
