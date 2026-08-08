'use client';

// src/app/dashboard/clima/components/planes/ClimaRadarEjecucion.tsx
// ════════════════════════════════════════════════════════════════════════════
// ESTADO 1 de la cascada de hallazgos (H3b) — "Radar de Ejecución".
// Diseño: `DISENO_CASCADA_HALLAZGOS_CAPSULA3.md` §1.
//
// Es lo que se ve mientras ninguna gerencia cruza el umbral de 30 registros: la
// pantalla comunica que el motor está trabajando, sin mostrar ni un hallazgo.
//
// ⛔ CERO INTERNOS DEL CLASIFICADOR. Nada de scores, nada de "señal nula", ningún
// nombre de jefe, ninguna densidad, ningún verbo. La prohibición es del diseño §1
// y se cumple en dos capas: acá no se pintan, y el endpoint tampoco los envía
// (`api/clima/action-log/findings/route.ts`). Si solo se ocultaran en el cliente,
// abrir la pestaña de red bastaría para leerlos.
//
// MOLDE: el diseño pide "evolución de FHREmptyState, no el genérico". Se replica
// su chrome —`rounded-xl border bg-slate-900/40`, ícono arriba, título, bajada
// centrada, todo en columna— y se le cambia el ícono por el anillo de progreso.
// No se reusa `FHREmptyState` tal cual porque su firma no admite un nodo en lugar
// del ícono, y ampliarla tocaría un componente que usa medio proyecto.
//
// El anillo es `ClimaProgressRing` (construido en H2a), con el color de identidad
// de la Cápsula 3 y FIJO: no cambia según cuánto falte. El progreso no es
// severidad.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import ClimaProgressRing from '@/components/clima/ClimaProgressRing';
import { CLIMA_MODO_MACRO_MIN_ENTRIES } from '@/types/clima-text-analysis';
import {
  RADAR_TITLE,
  RADAR_SUBTITLE,
  RADAR_CLOSING,
  radarCaptured,
  radarPorUnidad,
} from '@/lib/constants/climaHubContent';
import type { ClimaFindingsDTO } from '@/types/clima-hub';

/** Identidad de la Cápsula 3 — el mismo verde de su tarjeta en el hub. */
const ACCENT = '#10B981';

export default function ClimaRadarEjecucion({ data }: { data?: ClimaFindingsDTO }) {
  // El umbral es GLOBAL (v2 §1), así que el anillo global es exacto y no una
  // aproximación. `data` puede faltar si el endpoint no respondió: el Radar es
  // legible igual, con el anillo en cero y el umbral que conoce el cliente.
  const analyzed = data?.entriesAnalyzed ?? 0;
  const threshold = data?.threshold ?? CLIMA_MODO_MACRO_MIN_ENTRIES;
  const pct = threshold > 0 ? (analyzed / threshold) * 100 : 0;
  const units = data?.units ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-slate-800/40 bg-slate-900/40 backdrop-blur-sm px-6 py-8 flex flex-col items-center text-center"
    >
      <ClimaProgressRing
        value={pct}
        size={88}
        strokeWidth={6}
        color={ACCENT}
        labelClassName="text-[18px]"
      />

      <p className="text-[11px] font-light text-slate-500 tabular-nums mt-3">
        {radarCaptured(analyzed, threshold)}
      </p>

      {/* ─── TÍTULO (word-split, como toda la Cápsula 3) ─── */}
      <div className="mt-5">
        <h3 className="text-xl font-extralight text-white tracking-tight leading-tight">
          {RADAR_TITLE.first}
        </h3>
        <p className="text-base font-light tracking-tight leading-tight fhr-title-gradient mt-0.5">
          {RADAR_TITLE.second}
        </p>
      </div>

      <p className="text-[13px] font-light text-slate-400 leading-relaxed mt-3 max-w-md">
        {RADAR_SUBTITLE}
      </p>

      {/* Avance por gerencia. Con el umbral global el anillo ya es exacto, así que
          esta línea dejó de ser una corrección y pasó a ser contexto: dice de
          dónde salen los registros. Solo nombres de UNIDADES, nunca de personas.
          En el estado de 0 registros no hay nada que listar y no se renderiza. */}
      {units.length > 0 && (
        <p className="text-[10px] font-mono text-slate-600 tabular-nums mt-4">
          {radarPorUnidad(units)}
        </p>
      )}

      <p className="text-[11px] font-light text-slate-600 leading-relaxed mt-5 max-w-sm">
        {RADAR_CLOSING}
      </p>
    </motion.div>
  );
}
