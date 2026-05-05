'use client';

// ════════════════════════════════════════════════════════════════════════════
// SECTION DIMENSIONES — State Machine (Patrón G canon)
// SectionDimensiones/index.tsx
// ════════════════════════════════════════════════════════════════════════════
// Container Patrón G canónico (guided-intelligence.md §1):
//   bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]
//   h-[700px] overflow-hidden
//
// Motor de 2 estados (guided-intelligence.md §2):
//   'isa'     → ISAPortada      (impact hook con número WHITE protagonista)
//   'console' → DecisionConsole (workspace 30/70 — selector + detalle)
//
// Tesla line:
//   - 'isa'     → state machine la pinta con color del nivel ISA.
//   - 'console' → DecisionConsole pinta su propia (color por dim activa).
//
// Decisión 12: Stage desmonta esto al cambiar Rail key — useState se resetea
// naturalmente al re-montar.
//
// Mobile (<768px): layout real. Sidebar colapsa a pills horizontales con
// snap-x scroll + auto-center del activo (DecisionConsole maneja ese render).
// El CEO debe poder usar la consola desde su celular.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

import TeslaLine from '../../shared/TeslaLine';
import { DecisionConsole } from './DecisionConsole';
import { ISAPortada } from './ISAPortada';
import { ISA_NARRATIVES, classifyIsa } from './_shared/constants';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

type ViewState = 'isa' | 'console';

interface SectionDimensionesProps {
  hook: UseComplianceDataReturn;
}

// ────────────────────────────────────────────────────────────────────────────
// MOTION (guided-intelligence.md §8)
// ────────────────────────────────────────────────────────────────────────────

const VIEW_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export default function SectionDimensiones({ hook }: SectionDimensionesProps) {
  const report = hook.report;
  const orgISA = report?.data.orgISA ?? null;

  // Si no hay ISA score, saltamos la portada y entramos directo al console.
  const initialView: ViewState = orgISA !== null ? 'isa' : 'console';
  const [view, setView] = useState<ViewState>(initialView);

  if (!report) return null;

  // Tesla color SOLO para vista 'isa'. En 'console' el DecisionConsole pinta
  // su propia con color por dim activa.
  const isaTeslaColor =
    orgISA !== null ? ISA_NARRATIVES[classifyIsa(orgISA)].teslaColor : '#22D3EE';

  return (
    <div
      className="
        relative overflow-hidden
        bg-[#0F172A]/90 backdrop-blur-2xl
        border border-slate-800
        rounded-[20px]
        h-[calc(100vh-110px)] md:h-[calc(100vh-150px)]
      "
    >
      {/* Tesla line solo cuando ISA portada está activa */}
      {view === 'isa' ? <TeslaLine color={isaTeslaColor} /> : null}

      <AnimatePresence mode="wait">
        {view === 'isa' && orgISA !== null && (
          <motion.div key="isa" {...VIEW_TRANSITION} className="h-full">
            <ISAPortada
              isaScore={orgISA}
              onContinue={() => setView('console')}
            />
          </motion.div>
        )}

        {view === 'console' && (
          <motion.div key="console" {...VIEW_TRANSITION} className="h-full">
            <DecisionConsole
              report={report}
              decisiones={hook.decisiones}
              narrativasEdit={hook.narrativasEdit}
              upsertDecision={hook.upsertDecision}
              updateNarrativaEdit={hook.updateNarrativaEdit}
              isPersistingPlan={hook.isPersistingPlan}
              canEditPlan={hook.canEditPlan}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
