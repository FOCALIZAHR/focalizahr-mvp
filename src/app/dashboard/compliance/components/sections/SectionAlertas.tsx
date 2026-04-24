'use client';

// src/app/dashboard/compliance/components/sections/SectionAlertas.tsx
// Stub de Sesión 4 — contenido real en Sesión 8.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionAlertas({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="alertas" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Alertas</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        SLA + intervención recomendada — próxima entrega.
      </p>
    </SectionShell>
  );
}
