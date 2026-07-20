'use client';

// src/app/dashboard/clima/components/planes/ClimaPathWorkspace.tsx
// ════════════════════════════════════════════════════════════════════════════
// SPLIT DE CONTEXTO DE CATEGORÍA — NO es el Spotlight de persona.
//
// Clon estructural de `src/components/evaluator/cinema/SpotlightCard.tsx`, con
// una diferencia deliberada y aprobada (Gate 0 focalizahr-design, opción A):
//   · El Spotlight de Cinema Mode confirma la IDENTIDAD DE UNA PERSONA antes de
//     actuar sobre ella (avatar, cargo, departamento).
//   · Acá la columna izquierda NO es una persona: es el CONTEXTO PERSISTENTE DEL
//     CAMINO (categoría + conteo + progreso), que debe seguir visible mientras la
//     columna derecha cicla caso por caso.
//
// Por eso se documenta como "Split de Contexto de Categoría" y NO debe copiarse
// como patrón de identidad de persona. El checklist del Gate 3 dice "no usar split
// 35/65 si no hay identidad de persona": la excepción está justificada AQUÍ por el
// contexto persistente de un flujo lineal de N casos — no es una licencia general.
//
// Flujo LINEAL, sin tabs ni selector: intro → caso por caso → cierre.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { CLIMA_PLAN_PATHS } from '@/lib/constants/climaPlanPaths';
import type { ClimaPlanBlock } from '@/lib/services/clima/climaPlanRouting';
import type { ClimaDecisionItem, CeoDecision } from '@/types/clima-planes';
import type { PersistResult } from './ClimaPlanDeptTab';
import ClimaCaseReview from './ClimaCaseReview';
import ClimaPathChaining, { type RemainingPath } from './ClimaPathChaining';
import ClimaLoteView from './ClimaLoteView';

type IndividualSub = 'intro' | 'review' | 'done';

/** Escapa metacaracteres para armar el regex de resaltado. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renderiza la misión resaltando las frases de `highlights` en negrita + el color de
 * IDENTIDAD del camino (el mismo del ícono/label/Tesla line) — no hay semántica nueva
 * por color. Las frases se ordenan por longitud desc para que una más larga gane sobre
 * otra que la contenga (ej. "no se aprueba con un solo clic" vs "un solo clic").
 */
function MissionText({
  text,
  highlights,
  color,
}: {
  text: string;
  highlights: readonly string[];
  color: string;
}) {
  if (highlights.length === 0) return <>{text}</>;
  const ordered = [...highlights].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${ordered.map(escapeRegExp).join('|')})`, 'g');
  return (
    <>
      {text.split(re).map((part, i) =>
        ordered.includes(part) ? (
          <span key={i} className="font-medium" style={{ color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface ClimaPathWorkspaceProps {
  block: ClimaPlanBlock;
  items: ClimaDecisionItem[];
  readOnly?: boolean;
  onDecision: (triggerRef: string, decision: CeoDecision) => Promise<PersistResult>;
  onAcceptBatch: (triggerRefs: string[]) => void;
  /** Error de la última aprobación en lote (se muestra en la vista de lote). */
  batchError?: string | null;
  onBackToCarousel: () => void;
  remaining: RemainingPath[];
  onGoToPath: (block: ClimaPlanBlock) => void;
  /** Gate duro del plan (decididas === total) — habilita el cierre del flujo. */
  canApprove: boolean;
  saving: boolean;
  onApprove: () => void;
}

export default function ClimaPathWorkspace({
  block,
  items,
  readOnly = false,
  onDecision,
  onAcceptBatch,
  batchError = null,
  onBackToCarousel,
  remaining,
  onGoToPath,
  canApprove,
  saving,
  onApprove,
}: ClimaPathWorkspaceProps) {
  const def = CLIMA_PLAN_PATHS[block];
  const Icon = def.icon;
  const isLote = block === 'gestion_corriente';
  const [sub, setSub] = useState<IndividualSub>(readOnly ? 'review' : 'intro');

  const decided = items.filter((i) => i.ceoDecision).length;
  const ctaLabel = items.length === 1 ? 'Resolver el foco' : `Resolver los ${items.length} focos`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden">
        {/* Línea Tesla — color de identidad del camino (dinámica, patrón portadas) */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${def.color}, transparent)`,
            boxShadow: `0 0 15px ${def.color}`,
          }}
        />

        {/* Volver — molde SpotlightCard */}
        <button
          onClick={onBackToCarousel}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Carrusel
        </button>

        {/* IZQUIERDA (250px) — CONTEXTO DE CATEGORÍA (donde el molde pone el avatar) */}
        <div className="w-full md:w-[250px] md:flex-shrink-0 bg-slate-900/50 p-8 pt-20 md:pt-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: `${def.color}15` }}
          >
            <Icon className="w-8 h-8" style={{ color: def.color }} />
          </div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: def.color }}
          >
            {def.label}
          </p>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-[56px] font-extralight tabular-nums text-white leading-none">
              {items.length}
            </span>
            <span className="text-xs text-slate-500">foco{items.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-[13px] font-light text-slate-400 leading-relaxed">{def.lines[0]}</p>
          <p className="text-[11px] font-light text-slate-600 leading-relaxed mt-1">{def.lines[1]}</p>
          {!isLote && (
            <span className="mt-5 text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
              {decided} de {items.length} resueltos
            </span>
          )}
        </div>

        {/* DERECHA — flujo lineal (donde el molde pone StorytellingGuide) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-[420px] p-6 md:p-8 pt-6 md:pt-14 bg-gradient-to-br from-[#0F172A] to-[#162032]">
          {isLote ? (
            <>
              <h3 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight mb-4">
                {def.label}
              </h3>
              <p className="text-base font-light text-slate-300 leading-relaxed mb-6">
                <MissionText text={def.mission} highlights={def.highlights} color={def.color} />
              </p>
              <ClimaLoteView
                items={items}
                readOnly={readOnly}
                errorMsg={batchError}
                onAcceptBatch={onAcceptBatch}
              />
            </>
          ) : sub === 'intro' ? (
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight mb-4">
                {def.label}
              </h3>
              <p className="text-lg md:text-xl font-light text-slate-300 leading-relaxed mb-8">
                <MissionText text={def.mission} highlights={def.highlights} color={def.color} />
              </p>
              <div>
                <PrimaryButton
                  size="md"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => setSub('review')}
                >
                  {ctaLabel}
                </PrimaryButton>
              </div>
            </div>
          ) : sub === 'review' ? (
            <ClimaCaseReview
              items={items}
              readOnly={readOnly}
              onDecision={onDecision}
              onAllDone={() => setSub('done')}
            />
          ) : (
            <ClimaPathChaining
              block={block}
              caseCount={items.length}
              remaining={remaining}
              canApprove={canApprove}
              saving={saving}
              onApprove={onApprove}
              onGoToPath={onGoToPath}
              onBackToCarousel={onBackToCarousel}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
