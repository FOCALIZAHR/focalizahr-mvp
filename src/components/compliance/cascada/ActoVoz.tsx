'use client';

// src/components/compliance/cascada/ActoVoz.tsx
// Beat 4 de la Cascada — "La Voz" · GATE 4.
//
// El acto del material crudo: las citas tal como llegaron. Toda la lógica +
// copy viven en `buildLaVoz` (pure, testeado); el componente solo pinta.
// Composición tipográfica — sin cards, sin bullets, sin barras laterales.
// Las citas hablan por sí mismas; este acto presenta y lee el alcance.
//
// Purple EXCLUSIVO del kicker de IA (voz con sesgo de género). Privacy: las
// citas vienen pre-anonimizadas (≤8 palabras) y el género se señala a nivel
// GERENCIA (anonimato en áreas chicas).

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import { formatDepartmentName } from '@/lib/utils/formatName';
import { buildLaVoz } from '@/lib/services/compliance/buildLaVoz';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoVozProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoVoz({ data }: ActoVozProps) {
  const acto = useMemo(() => buildLaVoz(data), [data]);
  if (!acto) return null;

  const heroLabel = acto.n === 1 ? 'voz recogida' : 'voces recogidas';

  return (
    <>
      <ActSeparator label="La Voz" color="cyan" />
      <div>
        {/* Hero — cantidad de voces. */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-cyan-400 tabular-nums">
            {acto.n}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {heroLabel}
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto">
          {/* Narrativa (selector silencio / neutra) — destacado peso 400 blanco. */}
          <p className="text-base md:text-lg font-light text-slate-400 leading-relaxed text-center mb-8">
            {acto.narrativa.pre}
            {acto.narrativa.destacado && (
              <span className="font-normal text-white">{acto.narrativa.destacado}</span>
            )}
            {acto.narrativa.post}
          </p>

          {/* Citas — composición centrada, cursiva fina, comillas tipográficas,
              separadas por middot. NO lista, NO bullets, NO barras. */}
          {acto.citas.length > 0 && (
            <p className="text-sm italic font-light text-slate-400 leading-loose text-center">
              {acto.citas.map((cita, i) => (
                <span key={`cita-${i}`}>
                  {i > 0 && <span className="not-italic text-slate-600"> · </span>}
                  &ldquo;{cita}&rdquo;
                </span>
              ))}
            </p>
          )}

          {/* Voz con sesgo de género — sección condicional, kicker IA purple. */}
          {acto.generos.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800/40">
              <p className="text-[10px] uppercase tracking-widest text-purple-400 text-center mb-6">
                {acto.generos.length === 1 ? 'Voz' : 'Voces'} con sesgo de género · análisis IA
              </p>
              <div className="space-y-5">
                {acto.generos.map((g, i) => (
                  <div key={`genero-${i}`} className="text-center">
                    <p className="text-xs font-light text-slate-500">
                      {formatDepartmentName(g.gerencia)}
                    </p>
                    <p className="text-base md:text-lg italic font-light text-slate-200 leading-relaxed mt-1">
                      &ldquo;{g.cita}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
              {/* Lectura de alcance — verbatim, una vez. */}
              <p className="text-sm font-light text-slate-400 leading-relaxed text-center mt-6 max-w-xl mx-auto">
                {acto.lecturaAlcance}
              </p>
            </div>
          )}

          {/* Cierre cursiva. */}
          <p className="text-sm italic font-light text-slate-400 leading-relaxed text-center mt-10">
            {acto.cierre}
          </p>
        </motion.div>
      </div>
    </>
  );
});
