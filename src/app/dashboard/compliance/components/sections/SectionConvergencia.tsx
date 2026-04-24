'use client';

// src/app/dashboard/compliance/components/sections/SectionConvergencia.tsx
// Stub de Sesión 4 — contenido real en Sesión 7.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionConvergencia({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="convergencia" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Señales cruzadas</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Flex rows por depto × fuente activa — próxima entrega.
      </p>
    </SectionShell>
  );
}
