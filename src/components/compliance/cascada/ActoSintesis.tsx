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
import { ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { ActSeparator, fadeIn } from './shared';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { Amplificador } from '@/types/ambiente-cascada';

interface ActoSintesisProps {
  data: ComplianceReportResponse;
  onIrAlPlan: () => void;
}

/** Mapa de etiquetas humanas de los amplificadores (para el chip de evidencia). */
const AMPLIFIER_LABEL: Record<Amplificador['tipo'], string> = {
  TEATRO_EN_DEPTO: 'Teatro detectado',
  CONVERGENCIA_EXIT: 'Exit confirma',
  CONVERGENCIA_ONBOARDING: 'Onboarding confirma',
  CONVERGENCIA_AMBOS: 'Exit + Onboarding confirman',
  SEXTA_ALERTA: 'Silencio con voz externa',
  OTRO_MUNDO: 'No invitados con rastro externo',
};

export default memo(function ActoSintesis({ data, onIrAlPlan }: ActoSintesisProps) {
  const synth = data.data.synthesis;

  // Guard: sin synthesis o sin classification (Gate 2.5 sin copy aún) → oculto.
  if (!synth || synth.classification.trim().length === 0) return null;

  return (
    <>
      <ActSeparator label="La Decisión" color="cyan" />
      <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-6 text-center">
        <p className="text-xl md:text-2xl font-extralight text-white leading-relaxed">
          {synth.classification}
        </p>
        {synth.implication.length > 0 && (
          <p className="text-base font-light italic text-slate-300 leading-relaxed">
            {synth.implication}
          </p>
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
