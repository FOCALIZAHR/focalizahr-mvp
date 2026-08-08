'use client';

// src/app/dashboard/clima/components/planes/ClimaEfectividadHallazgos.tsx
// ════════════════════════════════════════════════════════════════════════════
// PANTALLA 3 de la Cápsula 3 — LOS HALLAZGOS (qué dice lo que se registró).
//
// Pantalla propia, no una sección debajo de la cobertura: el CEO navega hasta
// acá. Son dos preguntas distintas —quién registró vs. qué dice lo que
// registró— y cada una manda en su pantalla.
//
// ── ESTRUCTURA (mockup `.claude/tasks/PANTALLA2_SEG_PLANES_CLIMA.JPG`) ───────
//
//   IZQUIERDA · identidad, centrada        DERECHA · el análisis
//     ícono púrpura grande                   ◈ IA · ANALISIS DE… ⓘ  ← rótulo
//     8            ← número hero             headline de Sonnet
//     registros analizados                   soporte de Sonnet
//     ──────       ← divisor corto                              (v)
//     Solo 1 registro presenta…
//
// ⚠️ EL RÓTULO ES UN LABEL DE PANEL, NO UN TÍTULO DE PANTALLA. Vive DENTRO de
// la columna derecha como su primer elemento, en 10px uppercase — el mismo lugar
// y peso que "ADECUACIÓN AL CARGO" en `RoleFitDisplayCard.tsx:273`, de donde se
// clonan sus tokens exactos (`text-[10px] font-bold uppercase tracking-[0.15em]`
// + ícono `w-4 h-4` al lado).
//
// 🕐 Este bloque se reestructuró tres veces. Primero con un layout propio, después
// clonando el `SpotlightCard` (que es el patrón de PERSONA, no de panel), después
// con el título como header arriba del split. Las tres veces el error fue el
// mismo: acomodar lo anterior en vez de abrir el molde correcto. El molde es el
// rótulo de panel, y el mockup lo muestra sin ambigüedad.
//
// El mockup viene en tema claro; acá se traduce al dark del sistema conservando
// estructura, tamaños relativos y centrado.
//
// SISTEMA ELÁSTICO (v3 §3), decidido por el ENDPOINT y no acá:
//   0 registros → Radar · 1 a 14 → Modo Táctico · 15+ → Modo Macro (sin diseñar)
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import ClimaRadarEjecucion from './ClimaRadarEjecucion';
import ClimaHallazgoCard from './ClimaHallazgoCard';
import {
  HUB_EFECTIVIDAD_PENDIENTE,
  hallazgoSoporte,
} from '@/lib/constants/climaHubContent';
import type { ClimaFindingsDTO, ClimaNarrativeDTO } from '@/types/clima-hub';

/** Color de la inteligencia (v3 §7): purple para todo lo que sale del motor. */
const ACCENT_IA = '#A78BFA';

interface ClimaEfectividadHallazgosProps {
  findings: ClimaFindingsDTO | null;
  /** Narrativa de Sonnet, ya persistida por el cron. `null` = template. */
  narrative?: ClimaNarrativeDTO | null;
}

export default function ClimaEfectividadHallazgos({
  findings,
  narrative,
}: ClimaEfectividadHallazgosProps) {
  const hayRegistros = !!findings && findings.entriesAnalyzed > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm"
    >
      {/* Tesla line — firma de marca, no cambia con el contenido. */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="flex flex-col md:flex-row">
        {/* ═══ IZQUIERDA · IDENTIDAD ═══
            Centrada y sola: el ícono, el número, su bajada y —tras un divisor
            corto— la frase de soporte. Nada más. El párrafo de Sonnet NO va acá:
            pertenece al análisis, y el análisis vive a la derecha. */}
        <div className="w-full md:w-[240px] md:flex-shrink-0 p-6 md:p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800/40">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: `${ACCENT_IA}18` }}
          >
            <BrainCircuit className="w-8 h-8" style={{ color: ACCENT_IA }} />
          </div>

          {hayRegistros && (
            <>
              <p className="text-[44px] font-extralight text-white leading-[0.9] tabular-nums">
                {findings!.entriesAnalyzed}
              </p>
              <p className="text-[11px] font-light text-slate-500 mt-2">
                {findings!.entriesAnalyzed === 1 ? 'registro analizado' : 'registros analizados'}
              </p>

              {/* Divisor corto — separa "qué se midió" de "qué salió". */}
              <div className="w-10 h-px bg-slate-700/50 my-4" />

              <p className="text-[11px] font-light text-slate-400 leading-relaxed">
                {hallazgoSoporte(findings!.executionCount)}
              </p>
            </>
          )}
        </div>

        {/* ═══ DERECHA · EL ANÁLISIS ═══
            El rótulo, el headline, el soporte y el chevron viven todos adentro de
            `ClimaHallazgoCard`: es una sola unidad de lectura y partirla entre dos
            archivos obligaría a sincronizar su orden desde afuera. */}
        <div className="flex-1 min-w-0 p-6 md:p-8">
          {!hayRegistros ? (
            <ClimaRadarEjecucion data={findings ?? undefined} />
          ) : findings!.mode === 'tactico' ? (
            <ClimaHallazgoCard data={findings!} narrative={narrative} />
          ) : (
            // Modo Macro: los agregados se diseñan con datos reales cuando se
            // crucen las 15 entradas (v3 §9). Hasta entonces, el estado honesto es
            // el genérico — no un dashboard vacío.
            <FHREmptyState
              type="pending"
              title={HUB_EFECTIVIDAD_PENDIENTE.title}
              description={HUB_EFECTIVIDAD_PENDIENTE.description}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
