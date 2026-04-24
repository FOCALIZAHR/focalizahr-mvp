'use client';

// src/app/dashboard/compliance/components/sections/SectionSimulador.tsx
// La intervención — consolidated primero + recomendaciones individuales.
// Tesla Line: cyan. Alertas de trigger 'alert' NO aparecen aquí (van a
// SectionAlertas).

import SectionShell from './_shared/SectionShell';
import RecommendationCard from './_shared/RecommendationCard';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionSimulador({ hook }: { hook: UseComplianceDataReturn }) {
  const plan = hook.interventionPlan;

  // Filtrar: aquí muestran sólo las recomendaciones que NO son de trigger 'alert'.
  const recsThisSection = plan.recommendations.filter((r) => {
    if (r.type === 'consolidated') {
      const triggers = r.resolvesTriggers ?? [];
      return triggers.some((t) => t.type !== 'alert');
    }
    return r.trigger?.type !== 'alert';
  });

  // Consolidated primero, individual después
  const consolidated = recsThisSection.filter((r) => r.type === 'consolidated');
  const individual = recsThisSection.filter((r) => r.type === 'individual');

  return (
    <SectionShell sectionId="simulador" onNext={hook.navigateNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
          Plan de acción
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          De las señales leídas a decisiones registradas este ciclo.
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 leading-relaxed">
          Cada intervención queda registrada con fecha y responsable.
        </p>
      </div>

      {recsThisSection.length === 0 ? (
        <div className="relative overflow-hidden p-8 bg-[#0F172A]/60 border border-slate-800 rounded-[20px] text-center">
          <p className="text-slate-400 font-light text-sm leading-relaxed">
            El análisis no requiere intervenciones estructurales para este ciclo.
          </p>
          <p className="text-[11px] text-slate-600 font-light mt-3 italic">
            Las alertas activas se gestionan en la siguiente sección.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {consolidated.map((r, i) => (
            <RecommendationCard
              key={`c-${i}`}
              recommendation={r}
              planActions={hook.planActions}
              onRegister={hook.registerPlanAction}
              onClear={hook.clearPlanAction}
              isSaving={hook.isSavingPlanAction}
              accent="cyan"
            />
          ))}
          {individual.map((r, i) => (
            <RecommendationCard
              key={`i-${i}`}
              recommendation={r}
              planActions={hook.planActions}
              onRegister={hook.registerPlanAction}
              onClear={hook.clearPlanAction}
              isSaving={hook.isSavingPlanAction}
              accent="cyan"
            />
          ))}
        </div>
      )}
    </SectionShell>
  );
}
