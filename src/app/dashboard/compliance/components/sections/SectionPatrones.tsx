'use client';

// src/app/dashboard/compliance/components/sections/SectionPatrones.tsx
// El amplificador — patrones IA. Tesla Line purple (#A78BFA).
// Datos: report.narratives.artefacto2_patrones (PatronNarrative[]).

import SectionShell from './_shared/SectionShell';
import { formatIntensityPercent } from '@/app/dashboard/compliance/lib/format';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionPatrones({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const patrones = report.narratives.artefacto2_patrones;
  const alertasGenero = report.narratives.alertasGenero;

  return (
    <SectionShell sectionId="patrones" onNext={hook.navigateNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
          Patrones detectados
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          Lo que el equipo dice — y cómo lo dice — deja rastros.
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 leading-relaxed">
          Inteligencia sobre lenguaje libre, fragmentos anonimizados.
        </p>
      </div>

      {patrones.length === 0 ? (
        <div className="relative overflow-hidden p-8 bg-[#0F172A]/60 border border-slate-800 rounded-[20px] text-center">
          <p className="text-slate-400 font-light text-sm leading-relaxed">
            El análisis de lenguaje libre no detectó señales relevantes este ciclo.
          </p>
          <p className="text-[11px] text-slate-600 font-light mt-3 italic">
            La brevedad del texto puede ser en sí misma una señal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patrones.map((p) => {
            const pct = formatIntensityPercent(p.intensidad);
            return (
              <div
                key={p.nombre}
                className="relative overflow-hidden p-5 bg-[#0F172A]/60 border border-slate-800 rounded-[20px]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-slate-200 font-light text-base">
                    {p.nombreLegible}
                  </p>
                  <span className="text-purple-300 tabular-nums text-sm font-light">
                    {pct}
                  </span>
                </div>

                {/* Barra intensidad purple */}
                <div className="mt-2 h-1 bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400/70 rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, p.intensidad * 100))}%`,
                    }}
                  />
                </div>

                {/* Narrativa del engine */}
                <p className="text-sm text-slate-400 font-light leading-relaxed mt-4">
                  {p.descripcion}
                </p>

                {/* Fragmentos anonimizados */}
                {p.fragmentos && p.fragmentos.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {p.fragmentos.slice(0, 3).map((frag, i) => (
                      <p
                        key={i}
                        className="text-[12px] text-slate-500 italic font-light leading-relaxed pl-3 border-l-2 border-purple-500/20"
                      >
                        &ldquo;{frag}&rdquo;
                      </p>
                    ))}
                  </div>
                )}

                {/* Departamentos donde apareció */}
                {p.departments && p.departments.length > 0 && (
                  <p className="text-[10px] text-slate-600 font-light mt-4">
                    Observado en: {p.departments.join(' · ')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Card separada de alertas género (purple sutil) */}
      {alertasGenero.length > 0 && (
        <div className="relative overflow-hidden mt-6 p-5 bg-purple-950/20 border border-purple-500/20 rounded-[20px]">
          <p className="text-[10px] uppercase tracking-widest text-purple-300 mb-2">
            Señales por brecha de género
          </p>
          <ul className="space-y-2 mt-3">
            {alertasGenero.map((a) => (
              <li
                key={a.departmentName}
                className="text-sm text-slate-300 font-light leading-relaxed"
              >
                <span className="text-slate-400">{a.departmentName}:</span>{' '}
                {a.contextoGenero}
              </li>
            ))}
          </ul>
        </div>
      )}

      {patrones.length > 0 && (
        <p className="text-[11px] text-slate-700 font-light mt-6 italic">
          Fragmentos agregados desde múltiples respuestas. Identidades no
          reconocibles.
        </p>
      )}
    </SectionShell>
  );
}
