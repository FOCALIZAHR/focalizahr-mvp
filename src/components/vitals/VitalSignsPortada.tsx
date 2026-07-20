// src/components/vitals/VitalSignsPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portada universal de Signos Vitales (Gate B).
//
// Patrón: PORTADA (skill focalizahr-design, Gate 1) — mensaje + 1 hallazgo +
// 1 CTA. Sin sidebar, sin tabs, sin split, sin identidad de persona.
// Tokens clonados de CompensationPortada.tsx:36-86 (referencia canónica).
//
// Anti-semáforo (anti-patterns.md:387-444): número hero en BLANCO, nunca
// coloreado por severidad. Cero bordes/fondos/glow por zona. La banda se
// nombra en texto con el contrato "N · Label".
//
// Presentacional puro: recibe la narrativa ya construida, no decide nada.
// ════════════════════════════════════════════════════════════════════════════

import { FHREmptyState } from '@/components/ui/FHREmptyState';
import type { VitalsNarrative } from '@/lib/narratives/vitalsNarratives';
import VitalsCTA from './VitalsCTA';

interface VitalSignsPortadaProps {
  narrative: VitalsNarrative;
  companyName: string | null;
  /** Slot bajo el fold: top 3 + cobertura. */
  children?: React.ReactNode;
}

export default function VitalSignsPortada({
  narrative,
  companyName,
  children,
}: VitalSignsPortadaProps) {
  const { title, hero, finding, emptyState, cta } = narrative;

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
        <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          {/* Línea Tesla */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
              boxShadow: '0 0 20px #22D3EE',
              opacity: 0.7,
            }}
          />

          <div className="px-6 py-14 md:px-10 md:py-20 flex flex-col items-center text-center">
            {/* Micro-label de contexto. Sin fecha cuando no hay lectura. */}
            {companyName && (
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-6">
                {companyName}
              </span>
            )}

            {/* Título word-split */}
            <div className="mb-10 md:mb-12">
              <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
                {title.first}
              </h1>
              <p className="text-lg md:text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
                {title.second}
              </p>
            </div>

            {/* HERO — número blanco o frase, nunca ambos */}
            {hero.kind === 'number' ? (
              <div className="flex flex-col items-center">
                <span className="text-[56px] md:text-[72px] font-extralight text-white leading-[0.9] tabular-nums">
                  {hero.value}
                </span>
                <span className="text-sm font-light text-slate-400 mt-2">{hero.caption}</span>
                {hero.detail && (
                  <span className="text-xs font-light text-slate-500 mt-1">{hero.detail}</span>
                )}
              </div>
            ) : (
              <p className="text-xl md:text-2xl font-extralight text-white leading-snug max-w-lg">
                {hero.text}
              </p>
            )}

            {/* HALLAZGO */}
            <div className="max-w-xl mt-10 md:mt-12">
              {finding.headline && (
                <>
                  <span className="text-[11px] text-slate-400 font-light">El hallazgo</span>
                  <p className="text-base md:text-lg font-light text-white leading-snug mt-1 mb-4">
                    {finding.headline}
                  </p>
                </>
              )}
              {finding.body.map((paragraph, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'text-base font-light text-slate-400 leading-relaxed'
                      : 'text-sm font-light text-slate-500 leading-relaxed mt-3'
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Estado degradado explícito */}
            {emptyState && (
              <div className="w-full max-w-md mt-10">
                <FHREmptyState
                  type={emptyState.type}
                  title={emptyState.title}
                  description={emptyState.description}
                  insight={emptyState.insight}
                />
              </div>
            )}

            {/* CTA único */}
            {cta && (
              <div className="mt-12 md:mt-14">
                <VitalsCTA label={cta.label} href={cta.href} />
              </div>
            )}
          </div>
        </div>

        {/* Bajo el fold */}
        {children}
      </div>
    </div>
  );
}
