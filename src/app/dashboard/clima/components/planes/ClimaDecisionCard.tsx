'use client';

// src/app/dashboard/clima/components/planes/ClimaDecisionCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Card atómica de una decisión (Tipo 1/1b/2) — Tab 1 de Planes de Acción (5D-i).
//
// Contrato visual (semilla §5bis + RESOLUCION §2 + anti-patterns Patrón G):
//   - Shell UNIFORME entre cards (sin borde/bg/glow por severidad). La severidad
//     la canta UNA sola cosa: el color del badge de zona (patrón in-módulo de
//     ClimaDimensionesView). Todo lo demás permanece neutro.
//   - Título = dimensión; el reactivo-palanca aparece como tag ghost ("foco: X").
//     selectedReactive=null (Tipo 1b caso 2) → no se nombra ningún reactivo.
//   - Narrativa + micro-steps colapsables.
//   - Línea "doble semáforo": el foco reactivo puede convivir con un fav de depto sano.
//   - Business case CLP si existe (reusa BusinessCaseCard).
//   - Controles CEO: aceptar / modificar / rechazar.
//   - validationMetric NUNCA se renderiza (umbral interno de 5C).
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Loader2, AlertTriangle, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton';
import BusinessCaseCard from '@/components/clima/BusinessCaseCard';
import { zoneColor, ZONE_LABEL } from '@/components/clima/climaZonePalette';
import { dimensionLabel } from '@/lib/constants/climaDimensions';
import { classifyDecisionBlock } from '@/lib/services/clima/climaPlanRouting';
import type { ClimaDecisionItem, CeoDecision } from '@/types/clima-planes';

// Decisiones ofrecidas como botón en las cards individuales (Sistémico/Crítico/Genérico).
// 'pospuesto' NO va acá: es exclusivo del lote (Bloque 3), vía el botón "No ahora".
const INDIVIDUAL_DECISIONS = ['aceptar', 'modificar', 'rechazar'] as const;
const DECISION_LABELS: Record<(typeof INDIVIDUAL_DECISIONS)[number], string> = {
  aceptar: 'Aceptar',
  modificar: 'Modificar',
  rechazar: 'Rechazar',
};

function productLabel(p: ClimaDecisionItem['intervention']['suggestedProduct']): string {
  return typeof p === 'string' ? p : p.label;
}

interface ClimaDecisionCardProps {
  item: ClimaDecisionItem;
  readOnly?: boolean;
  /** Estado de la escritura en curso. 'idle' en listas read-only. */
  phase?: 'idle' | 'saving' | 'saved' | 'error';
  errorMsg?: string | null;
  onRetry?: () => void;
  onDecision: (
    triggerRef: string,
    decision: CeoDecision,
    notes?: string
  ) => void | Promise<void>;
}

export default function ClimaDecisionCard({
  item,
  readOnly = false,
  phase = 'idle',
  errorMsg = null,
  onRetry,
  onDecision,
}: ClimaDecisionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const zone = item.intervention.level;
  const accent = zoneColor(zone);
  // Bloque 1 (sistémico): el diccionario YA trae plan completo (narrativa + steps +
  // suggestedProduct) → se muestra el diagnóstico entero. Los controles son los MISMOS
  // 3 que el resto: el plan aplica a una DIMENSIÓN COMPLETA de la empresa, así que
  // tiene que poder ajustarse ("Modificar") o descartarse si no aplica ("Rechazar").
  // (Hubo una versión con 1 solo CTA "Marcar como en curso" — revertida 2026-07-20:
  //  error de criterio; dejaba a los sistémicos sin forma de rechazarse y trababa el
  //  gate de aprobación, que exige decididas === total.)
  const isSystemic = item.isSystemic;
  // Bloque 4 (A tu criterio): señal amarilla sin variante Capa 2 escrita → NO hay
  // receta probada, solo una sugerencia general. Se marca con un tag neutro aditivo
  // (el badge de zona NO se toca: la severidad la sigue cantando solo el badge).
  const isGeneric = classifyDecisionBlock(item) === 'generico';
  const productText = productLabel(item.intervention.suggestedProduct);
  // Durante guardado/confirmación los botones se bloquean. En 'error' NO: hay que
  // poder reintentar o elegir otra decisión.
  const busy = phase === 'saving' || phase === 'saved';

  // "Modificar" no decide de un clic: abre un editor de ceoNotes y recién al
  // confirmar dispara el guardado. Aceptar/Rechazar siguen siendo 1 clic.
  // null = editor cerrado · string = editor abierto con ese contenido.
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const isComposing = draftNote !== null;

  const handleClick = (d: CeoDecision) => {
    if (d === 'modificar') {
      setDraftNote(item.ceoNotes ?? '');
      return;
    }
    onDecision(item.triggerRef, d);
  };

  const confirmModificar = () => {
    const notes = (draftNote ?? '').trim();
    if (!notes) return; // sin texto no se confirma → ceoNotes deja de viajar vacío
    setDraftNote(null);
    onDecision(item.triggerRef, 'modificar', notes);
  };

  return (
    <div className="rounded-xl border border-slate-800/30 bg-slate-900/30 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />

      {/* Header — badge de zona (única señal de color) + dimensión + reactivo ghost */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0"
              style={{ color: accent, background: `${accent}1a` }}
            >
              {ZONE_LABEL[zone]}
            </span>
            <h4 className="text-sm font-light text-white tracking-tight truncate">
              {dimensionLabel(item.category)}
            </h4>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] font-light text-slate-500">
              {item.departmentName ?? 'Departamento'}
            </span>
            {item.selectedReactive && (
              <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
                foco: {item.selectedReactive}
              </span>
            )}
            {item.isSystemic && (
              <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
                patrón sistémico
              </span>
            )}
            {isGeneric && (
              <span className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
                sugerencia general · sin receta probada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Narrativa (PROVISIONAL desde el diccionario) */}
      <p className="text-[13px] text-slate-400 font-light leading-[1.7] mt-3">
        {item.intervention.narrative}
      </p>

      {/* Línea aclaratoria — sistémico explica camino vs. badge; puntual = doble semáforo */}
      <p className="text-[11px] text-slate-600 font-light leading-relaxed mt-2">
        {item.isSystemic
          ? 'Este foco entra acá porque es parte de un problema extendido del área. El color marca, además, qué tan grave es este punto en particular.'
          : 'Foco puntual detectado a nivel de reactivo. Puede convivir con una salud general del departamento estable.'}
      </p>

      {/* Micro-steps colapsables */}
      {item.intervention.steps.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-light text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Ocultar pasos' : `Ver pasos (${item.intervention.steps.length})`}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2 space-y-1.5 pl-4"
              >
                {item.intervention.steps.map((step, i) => (
                  <li key={i} className="text-[12px] text-slate-500 font-light leading-relaxed list-disc">
                    {step}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Business case CLP (si PulseEngine lo disparó) */}
      {item.intervention.businessCase && (
        <div className="mt-3">
          <BusinessCaseCard businessCase={item.intervention.businessCase} />
        </div>
      )}

      {/* Footer — responsable/plazo (referencia) + acción sugerida ghost + controles CEO */}
      {/* Programa sugerido — en sistémico se lee como texto, NO como CTA: su
          suggestedProduct lleva target:'SIN_CTA' a propósito (clima-planes.ts) porque
          todavía no existe el mecanismo de activación. */}
      {isSystemic && (
        <p className="text-[12px] font-light text-slate-400 mt-3">
          Programa sugerido: <span className="text-slate-300">{productText}</span>
        </p>
      )}

      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/30 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-light text-slate-600">
            {item.responsible} · {item.deadline}
          </span>
          {!isSystemic && (
            <span
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full border font-light',
                // B4: producto atenuado (es genérico, no una receta probada).
                isGeneric
                  ? 'text-slate-500/50 border-slate-700/20'
                  : 'text-slate-400/60 border-slate-700/30'
              )}
            >
              {productText}
            </span>
          )}
        </div>

        <div className={cn('flex items-center gap-2', isComposing && 'hidden')}>
          {phase === 'saving' && (
            <span className="flex items-center gap-1.5 text-[11px] font-light text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Guardando…
            </span>
          )}
          {phase === 'saved' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400"
            >
              <Check className="w-3.5 h-3.5" /> Guardado
            </motion.span>
          )}
          {INDIVIDUAL_DECISIONS.map((d) => {
            const active = item.ceoDecision === d;
            return (
              <button
                key={d}
                disabled={readOnly || busy}
                onClick={() => handleClick(d)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-light border transition-all',
                  (readOnly || busy) && 'opacity-50 cursor-not-allowed',
                  active
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    : 'border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                )}
              >
                {DECISION_LABELS[d]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor de ceoNotes — inline (la skill prohíbe modales anidados) y además un
          modal taparía el diagnóstico que el usuario necesita leer para decidir qué
          ajustar. Solo aparece con "Modificar". */}
      {isComposing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden mt-3"
        >
          <label className="flex items-center gap-1.5 text-[11px] font-light text-slate-400 mb-2">
            <Pencil className="w-3 h-3" /> ¿Qué vas a ajustar?
          </label>
          <textarea
            autoFocus
            rows={3}
            value={draftNote ?? ''}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Ej.: el plan aplica, pero la capacitación la coordina RRHH y no el jefe directo."
            className="w-full rounded-xl border border-slate-700/40 bg-slate-900/60 px-3 py-2.5 text-[13px] font-light text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <GhostButton size="sm" onClick={() => setDraftNote(null)}>
              Cancelar
            </GhostButton>
            <PrimaryButton
              size="sm"
              disabled={!(draftNote ?? '').trim()}
              onClick={confirmModificar}
            >
              Confirmar ajuste
            </PrimaryButton>
          </div>
        </motion.div>
      )}

      {/* La nota guardada deja de ser un campo invisible. */}
      {!isComposing && item.ceoNotes && (
        <p className="text-[12px] font-light text-slate-400 mt-3 pl-3 border-l border-slate-700/40">
          <span className="text-slate-500">Ajuste: </span>
          {item.ceoNotes}
        </p>
      )}

      {/* Error de guardado — inline, donde ocurrió la acción. Sin badge gritando. */}
      {phase === 'error' && errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 flex-wrap"
        >
          <p className="flex items-center gap-2 text-[12px] font-light text-red-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg} Tu decisión no quedó guardada.
          </p>
          {onRetry && (
            <SecondaryButton size="sm" onClick={onRetry}>
              Reintentar
            </SecondaryButton>
          )}
        </motion.div>
      )}
    </div>
  );
}
