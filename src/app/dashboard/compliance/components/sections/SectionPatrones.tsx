'use client';

// src/app/dashboard/compliance/components/sections/SectionPatrones.tsx
// Stub de Sesión 4 — contenido real en Sesión 7.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionPatrones({ hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="patrones" onNext={hook.navigateNext}>
      <h2 className="text-2xl font-light text-white">Patrones IA</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Lista de patrones + fragmentos anonimizados — próxima entrega.
      </p>
    </SectionShell>
  );
}
