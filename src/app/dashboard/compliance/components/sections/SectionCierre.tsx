'use client';

// src/app/dashboard/compliance/components/sections/SectionCierre.tsx
// El francotirador — mensaje de cierre + plan consolidado + cards cruzadas.
// SIN Tesla Line (es pausa narrativa). Sin CTA "Siguiente" — última sección.

import { Check, Download } from 'lucide-react';
import SectionShell from './_shared/SectionShell';
import { PrimaryButton, SecondaryButton } from '@/components/ui/PremiumButton';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionCierre({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const mensaje = report.narratives.cierre.mensaje;
  const planActions = hook.planActions;
  const activeSources = new Set(report.data.convergencia.activeSources);

  return (
    <SectionShell sectionId="cierre">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Cierre del ciclo
        </p>
        <p className="text-slate-200 font-light text-lg md:text-xl leading-relaxed">
          {mensaje}
        </p>
      </div>

      {/* Plan consolidado del ciclo */}
      <div className="mt-10">
        {planActions.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-extralight text-white text-center">
              Plan de{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                este ciclo
              </span>
            </h3>
            <div className="relative overflow-hidden p-5 bg-[#0F172A]/60 border border-slate-800 rounded-[20px] divide-y divide-slate-800/40">
              {planActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <Check className="w-4 h-4 text-cyan-400/70 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm font-light">
                      {action.optionLabel}
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-light">
                      {action.triggerLabel}
                      {action.plazo ? ` · ${action.plazo}` : ''}
                    </p>
                    {action.evidencia && (
                      <p className="text-slate-600 text-[11px] mt-1 font-light italic">
                        Evidencia: {action.evidencia}
                      </p>
                    )}
                  </div>
                  <span className="text-slate-700 text-[10px] font-mono">
                    {new Date(action.registeredAt).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center pt-2">
              <PrimaryButton
                icon={Download}
                disabled
                title="Exportación disponible en Fase 6"
              >
                Exportar plan del ciclo
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-500 text-sm font-light">
              Aún no hay acciones registradas en este ciclo.
            </p>
            <div className="flex justify-center mt-4">
              <SecondaryButton onClick={() => hook.selectSection('simulador')}>
                Registrar intervenciones →
              </SecondaryButton>
            </div>
          </div>
        )}
      </div>

      {/* Cards cruzadas — sólo si el cliente NO tiene ese producto activo */}
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
