'use client';

// src/app/dashboard/compliance/components/sections/SectionCascada.tsx
// Sección Diagnóstico — adapta el hook a CascadaCompliance. Sin SectionShell:
// la cascada se renderiza bare (Acto Ancla + 5 actos en scroll, molde GoalsCascada).

import CascadaCompliance from '@/components/compliance/cascada/CascadaCompliance';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionCascada({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  if (!report.narratives.cascada) {
    return (
      <div className="text-center py-16 border border-dashed border-slate-800/40 rounded-2xl">
        <p className="text-slate-500 text-sm font-light">
          El diagnóstico ejecutivo no está disponible para esta campaña.
        </p>
      </div>
    );
  }

  return <CascadaCompliance data={report} onNavigate={hook.selectSection} />;
}
