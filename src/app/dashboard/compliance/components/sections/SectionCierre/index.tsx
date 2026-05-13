'use client';

// ════════════════════════════════════════════════════════════════════════════
// SECTION CIERRE (C4 — Plan Global)
// SectionCierre/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// Plan consolidado del ciclo. Lee las CompliancePlanAction registradas desde
// C1 (Dimensiones), C2 (Patrones), C3 (Convergencia) y Alertas; las agrupa
// por origen y las muestra como cierre del recorrido ejecutivo. Si no hay
// acciones registradas, renderiza el empty state francotirador con CTA al
// simulador. Cards cruzadas (Exit/Onboarding) se mantienen al final cuando
// el cliente no tiene esos productos activos.
//
// SIN Tesla Line por design — el cierre es pausa narrativa.

import { Download } from 'lucide-react';
import SectionShell from '../_shared/SectionShell';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { groupPlanActionsByOrigin } from './_shared/helpers';
import { PLAN_GLOBAL_COPY } from './_shared/constants';
import PlanOriginBlock from './PlanOriginBlock';
import FrancotiradorEmpty from './FrancotiradorEmpty';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionCierre({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const mensaje = report.narratives.cierre.mensaje;
  const planActions = hook.planActions;
  const activeSources = new Set(report.data.convergencia.activeSources);

  const buckets = groupPlanActionsByOrigin(planActions);
  const totalRegistered = buckets.reduce((sum, b) => sum + b.actions.length, 0);

  return (
    <SectionShell sectionId="cierre">
      {/* Narrativa de cierre — preservada del diseño previo */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Cierre del ciclo
        </p>
        <p className="text-slate-200 font-light text-lg md:text-xl leading-relaxed">
          {mensaje}
        </p>
      </div>

      {/* Plan Global — consolidado por origen */}
      <div className="mt-10">
        {totalRegistered > 0 ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                {PLAN_GLOBAL_COPY.eyebrow}
              </p>
              <h3 className="text-xl md:text-2xl font-extralight text-white leading-snug">
                {PLAN_GLOBAL_COPY.subtitle(totalRegistered)}
              </h3>
            </div>

            <div className="space-y-6">
              {buckets.map((bucket) => (
                <PlanOriginBlock
                  key={bucket.origin}
                  origin={bucket.origin}
                  actions={bucket.actions}
                />
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <PrimaryButton
                icon={Download}
                disabled
                title={PLAN_GLOBAL_COPY.exportTooltip}
              >
                {PLAN_GLOBAL_COPY.exportLabel}
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <FrancotiradorEmpty
            onNavigateToSimulador={() => hook.selectSection('simulador')}
          />
        )}
      </div>

      {/* Cards cruzadas — solo si el cliente NO tiene ese producto activo */}
      <div className="mt-10 space-y-4">
        {!activeSources.has('exit') && (
          <div className="relative overflow-hidden p-5 bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Qué falta leer
            </p>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Este análisis no cubre lo que salió por la puerta. Exit Intelligence
              registra las señales de quienes se fueron — incluyendo el ambiente
              que encontraron.
            </p>
          </div>
        )}
        {!activeSources.has('onboarding') && (
          <div className="relative overflow-hidden p-5 bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Qué falta leer
            </p>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Las señales más tempranas aparecen en los primeros 90 días.
              Onboarding Journey Intelligence detecta el deterioro antes de que
              se normalice.
            </p>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
