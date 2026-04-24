'use client';

// src/app/dashboard/compliance/components/sections/SectionSimulador.tsx
// Stub de Sesión 4 — contenido real en Sesión 8.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionSimulador({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="simulador" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Plan de acción</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Consolidated + recomendaciones individuales — próxima entrega.
      </p>
    </SectionShell>
  );
}
