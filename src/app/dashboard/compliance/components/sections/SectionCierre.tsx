'use client';

// src/app/dashboard/compliance/components/sections/SectionCierre.tsx
// Stub de Sesión 4 — contenido real en Sesión 8.
// Nota: Cierre NO tiene Tesla Line ni CTA "Siguiente" — es pausa narrativa.

import SectionShell from './_shared/SectionShell';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionCierre({ hook: _hook }: { hook: UseComplianceDataReturn }) {
  return (
    <SectionShell sectionId="cierre">
      <h2 className="text-2xl font-light text-white">Cierre del ciclo</h2>
      <p className="text-sm text-slate-500 font-light mt-3 italic">
        Plan consolidado + export + cards cruzados — próxima entrega.
      </p>
    </SectionShell>
  );
}
