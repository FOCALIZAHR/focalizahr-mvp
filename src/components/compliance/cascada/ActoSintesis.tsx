'use client';

// src/components/compliance/cascada/ActoSintesis.tsx
// Beat 6 de la Cascada — "La Decisión / El Francotirador".
//
// Gate 8 (2026-06-07) — migración a `payload.synthesis` del AmbienteSynthesisEngine.
// Borrado el fallback al legacy `narratives.cascada.sintesis` (también eliminado
// en Gate 8 del Engine). Una sola fuente de síntesis: el motor diferencial
// (detect → score → priority → diferencial) del Gate 2.
//
// Comportamiento mientras Gate 2.5 (copy verbatim Victor) no esté completo:
//   - Engine emite `classification === ''` para tipos sin entrada en el
//     Dictionary.
//   - Este componente oculta el beat (return null) cuando classification vacía
//     — anti-rec #3 del plan: 'Mientras synthesis emita "", Beat 6 se oculta,
//     no renderiza roto.'

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { ActSeparator, fadeIn, Tooltip } from './shared';
import { buildFuegoBadge } from '@/lib/services/compliance/AmbienteSynthesisDictionary';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { Amplificador } from '@/types/ambiente-cascada';

interface ActoSintesisProps {
  data: ComplianceReportResponse;
  onIrAlPlan: () => void;
}

/** Mapa de etiquetas humanas de los amplificadores (para el chip de evidencia). */
const AMPLIFIER_LABEL: Record<Amplificador['tipo'], string> = {
  TEATRO_EN_DEPTO: 'Medición sana, comentarios no',
  CONVERGENCIA_EXIT: 'Exit confirma',
  CONVERGENCIA_ONBOARDING: 'Onboarding confirma',
  CONVERGENCIA_AMBOS: 'Exit + Onboarding confirman',
  SEXTA_ALERTA: 'No respondió, pero hay señales afuera',
  OTRO_MUNDO: 'Fuera del estudio, con señales',
};

export default memo(function ActoSintesis({ data, onIrAlPlan }: ActoSintesisProps) {
  const synth = data.data.synthesis;

  // Guard: sin synthesis o sin classification (Gate 2.5 sin copy aún) → oculto.
  if (!synth || synth.classification.trim().length === 0) return null;

  // Badge FUEGO_LEGAL — neutro, gateado por tipo, org-level. Count autoritativo
  // de synth (backend); fallback a Σ denuncias_12m≥1 desde riskScores (patrón
  // ActoAmbiente). El tooltip es org-level — no resuelve departamento.
  const fuegoBadge =
    synth.diagnosticType === 'FUEGO_LEGAL'
      ? (() => {
          const count =
            synth.issueCount ??
            (data.data.riskScores ?? [])
              .filter((rs) => (rs.inputs.denuncias_12m ?? 0) >= 1)
              .reduce((s, rs) => s + (rs.inputs.denuncias_12m ?? 0), 0);
          return count > 0 ? buildFuegoBadge(count) : null;
        })()
      : null;

  return (
    <>
      <ActSeparator label="La Decisión" color="cyan" />
      <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6 text-center">
        {fuegoBadge && (
          <div className="flex justify-center">
            <Tooltip content={fuegoBadge.tooltip}>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/40 px-2.5 py-0.5 text-[10px] font-light text-slate-400">
                {fuegoBadge.label}
                <HelpCircle className="h-2.5 w-2.5" strokeWidth={1.5} />
              </span>
            </Tooltip>
          </div>
        )}
        <p className="text-xl md:text-2xl font-extralight text-white leading-relaxed">
          {synth.classification}
        </p>
        {synth.implication.length > 0 && (
          <p className="text-base font-light italic text-slate-300 leading-relaxed">
            {synth.implication}
          </p>
        )}

        {/* Hipótesis "O" McKinsey — FUEGO_LEGAL / CONCENTRACION_MANDO emiten
            `risks` (causas/consecuencias posibles, sin juicio). Lista neutra. */}
        {synth.risks && synth.risks.length > 0 && (
          <ul className="text-left max-w-xl mx-auto space-y-2">
            {synth.risks.map((r) => (
              <li
                key={r.label}
                className="flex gap-2 text-sm font-light text-slate-400 leading-relaxed"
              >
                <span className="select-none text-slate-600">·</span>
                <span>{r.narrative}</span>
              </li>
            ))}
          </ul>
        )}

        {synth.path.length > 0 && (
          <div className="border-l-2 border-cyan-500/30 pl-4 text-left max-w-xl mx-auto">
            <p className="text-base font-light text-slate-400 leading-relaxed">
              {synth.path}
            </p>
          </div>
        )}
        {synth.accountability.length > 0 && (
          <p className="text-sm font-light italic text-slate-500 leading-relaxed">
            {synth.accountability}
          </p>
        )}

        {/* Amplificadores activos — chips neutros para audit visual.
            La narrativa los nombra dentro de `implication`; este chip muestra el
            tipo de evidencia que respalda el diagnóstico. */}
        {synth.amplificadoresActivos.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {synth.amplificadoresActivos.map((a) => (
              <span
                key={a.tipo}
                className="text-[10px] uppercase tracking-widest text-slate-500 border border-slate-700/40 rounded-full px-2 py-0.5"
              >
                {AMPLIFIER_LABEL[a.tipo]}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-4">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onIrAlPlan}>
            Ir al plan
          </PrimaryButton>
        </div>
      </motion.div>
    </>
  );
});
