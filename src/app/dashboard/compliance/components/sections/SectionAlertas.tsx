'use client';

// src/app/dashboard/compliance/components/sections/SectionAlertas.tsx
// El riesgo — única sección con lenguaje legal. Tesla Line: amber #F59E0B.
// Misma mecánica de elección que Simulador (triggerType 'alert').

import { AlertTriangle, Clock } from 'lucide-react';
import SectionShell from './_shared/SectionShell';
import RecommendationCard from './_shared/RecommendationCard';
import {
  ALERTA_LABELS,
} from '@/app/dashboard/compliance/lib/labels';
import {
  formatDateShort,
  formatSLACountdown,
} from '@/app/dashboard/compliance/lib/format';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionAlertas({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const alerts = report.data.alerts.filter(
    (a) => a.status !== 'resolved' && a.status !== 'dismissed'
  );

  const narrativas = report.narratives.artefacto4_alertas;
  const narrativaByType = new Map(narrativas.map((n) => [n.alertType, n]));

  // Recomendaciones cuyo trigger es 'alert'
  const alertRecs = hook.interventionPlan.recommendations.filter((r) => {
    if (r.type === 'consolidated') {
      const triggers = r.resolvesTriggers ?? [];
      return triggers.some((t) => t.type === 'alert');
    }
    return r.trigger?.type === 'alert';
  });

  return (
    <SectionShell sectionId="alertas" onNext={hook.navigateNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-2">
          Alertas activas
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          Situaciones que requieren respuesta antes del cierre del ciclo.
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 leading-relaxed">
          Prevenir formalización bajo Ley Karin 21.643. Documentar actuación,
          plazo y evidencia.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="relative overflow-hidden p-8 bg-[#0F172A]/60 border border-slate-800 rounded-[20px] text-center">
          <p className="text-slate-400 font-light text-sm leading-relaxed">
            Sin alertas activas este ciclo.
          </p>
          <p className="text-[11px] text-slate-600 font-light mt-3 italic">
            Ausencia de alertas no implica ausencia de riesgo. Continúa el monitoreo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {alerts.map((a) => {
            const narrativa = narrativaByType.get(a.alertType);
            const sla = formatSLACountdown(a.dueDate);
            const isOverdue = sla === 'Vencido';
            return (
              <div
                key={a.id}
                className="relative overflow-hidden p-5 bg-amber-950/10 border border-amber-500/20 rounded-[20px]"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <span className="text-[10px] uppercase tracking-widest text-amber-400">
                        {ALERTA_LABELS[a.alertType] ?? a.alertType}
                      </span>
                      {sla && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-light ${isOverdue ? 'text-red-400' : 'text-amber-300'}`}
                        >
                          <Clock className="w-3 h-3" />
                          {sla}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-light text-base mt-1 leading-snug">
                      {a.title}
                    </h3>
                    {a.departmentName && (
                      <p className="text-slate-500 text-[11px] font-light mt-0.5">
                        {a.departmentName}
                      </p>
                    )}
                    <p className="text-slate-300 text-sm font-light mt-3 leading-relaxed">
                      {a.description}
                    </p>
                    {a.dueDate && (
                      <p className="text-slate-600 text-[11px] font-light mt-2">
                        Fecha objetivo: {formatDateShort(a.dueDate)}
                      </p>
                    )}

                    {narrativa && (
                      <div className="mt-4 pt-4 border-t border-amber-500/10 space-y-2">
                        <p className="text-slate-400 text-[13px] font-light leading-relaxed">
                          {narrativa.contexto}
                        </p>
                        {narrativa.consecuencia && (
                          <p className="text-slate-400 text-[13px] font-light leading-relaxed">
                            {narrativa.consecuencia}
                          </p>
                        )}
                        {narrativa.intervencion && (
                          <p className="text-slate-300 text-[13px] font-light leading-relaxed italic border-l-2 border-amber-500/30 pl-3 mt-2">
                            {narrativa.intervencion}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recomendaciones por alerta (mecánica Simulador) */}
      {alertRecs.length > 0 && (
        <div className="mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
            Intervenciones recomendadas
          </p>
          <div className="space-y-4">
            {alertRecs.map((r, i) => (
              <RecommendationCard
                key={`a-${i}`}
                recommendation={r}
                planActions={hook.planActions}
                onRegister={hook.registerPlanAction}
                onClear={hook.clearPlanAction}
                isSaving={hook.isSavingPlanAction}
                accent="amber"
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-slate-500 text-sm font-light italic text-center mt-10">
        El costo de postergar siempre supera el costo de actuar. Siempre.
      </p>
    </SectionShell>
  );
}
