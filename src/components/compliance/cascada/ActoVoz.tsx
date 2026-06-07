'use client';

// src/components/compliance/cascada/ActoVoz.tsx
// Beat 4 de la Cascada — "La Voz".
//
// Gate 7 (2026-06-07) — REESCRITURA COMPLETA. Borra el contenido legacy del
// archivo (patrones LLM con parrafoGancho elaborado). El nuevo contenido es:
//   - Citas literales (fragmentos ≤8 palabras de respuestas abiertas P1).
//   - Cláusula de género (alertasGenero) si hay alerta con cita.
//
// La voz NO se interpreta acá. Las citas hablan por sí mismas. CERO menciones
// de "marcador", "texto libre", "LLM", "patrón" — esa jerga vivía en el legacy.
// El análisis de patrones ya alimenta Beat 2 (ranking del Triage); Beat 4 es
// la lectura cruda de lo que la gente dijo.
//
// Privacy: las citas vienen pre-anonimizadas del orchestrator de cierre
// (max 8 palabras, sin identificadores). No se exponen identidades.

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import { formatDepartmentName } from '@/lib/utils/formatName';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { GenderAlertDetail } from '@/lib/services/compliance/ComplianceNarrativeEngine';

const MAX_CITAS = 6;

interface ActoVozProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoVoz({ data }: ActoVozProps) {
  // Citas literales — agregadas de los fragmentos de cada depto. Dedup + tope.
  const citas = useMemo<string[]>(() => {
    const departments = data.data.departments ?? [];
    const all: string[] = [];
    for (const dept of departments) {
      const frags = dept.patrones?.patron_dominante?.fragmentos ?? [];
      for (const f of frags) {
        const clean = f.trim();
        if (clean.length > 0) all.push(clean);
      }
    }
    // Dedup case-insensitive + máximo MAX_CITAS para no saturar el render.
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const c of all) {
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(c);
      if (uniq.length >= MAX_CITAS) break;
    }
    return uniq;
  }, [data]);

  // Cláusula género — solo alertas con cita literal no vacía.
  const generos = useMemo<GenderAlertDetail[]>(() => {
    const raw = (data.narratives.alertasGenero ?? []) as GenderAlertDetail[];
    return raw.filter(
      (g) => typeof g.evidenciaGenero === 'string' && g.evidenciaGenero.trim().length > 0,
    );
  }, [data]);

  // Guard: si no hay nada que mostrar, el beat se omite (anti-default-as-meaning).
  if (citas.length === 0 && generos.length === 0) return null;

  const heroNumber = citas.length;
  const heroLabel =
    citas.length === 0
      ? 'sin voces recogidas este ciclo'
      : citas.length === 1
      ? 'voz recogida'
      : 'voces recogidas';

  return (
    <>
      <ActSeparator label="La Voz" color="cyan" />
      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-white">
            {heroNumber}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {heroLabel}
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6">
          {/* Lista de citas — la gente hablando, sin interpretar. */}
          {citas.length > 0 && (
            <div className="space-y-3">
              {citas.map((cita, i) => (
                <div
                  key={`cita-${i}`}
                  className="border-l-2 border-slate-700/40 pl-4"
                >
                  <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                    &ldquo;{cita}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Cláusula género — si hay alertas con cita literal. */}
          {generos.length > 0 && (
            <div className="border-t border-slate-800/40 pt-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                {generos.length === 1
                  ? 'Voz con sesgo de género'
                  : 'Voces con sesgo de género'}
              </p>
              <div className="space-y-3">
                {generos.map((g, i) => (
                  <div
                    key={`genero-${g.departmentName}-${i}`}
                    className="border-l-2 border-amber-500/30 pl-4"
                  >
                    <p className="text-xs text-slate-500">
                      {formatDepartmentName(g.departmentName)}
                    </p>
                    <p className="text-sm italic font-light text-slate-300 leading-relaxed mt-1">
                      &ldquo;{g.evidenciaGenero}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
});
