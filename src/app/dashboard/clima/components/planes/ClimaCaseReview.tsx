'use client';

// src/app/dashboard/clima/components/planes/ClimaCaseReview.tsx
// ════════════════════════════════════════════════════════════════════════════
// Revisión UNO A UNO de un camino individual (Sistémico/Crítico/Genérico) — 5D-i.
//
// AVANCE CONFIRMADO (no optimista): cada decisión bloquea los botones, espera la
// confirmación del servidor, muestra "Guardado ✓" y RECIÉN AHÍ avanza al siguiente
// caso. Si el servidor rechaza, NO avanza: muestra el error y ofrece reintentar.
//
// Por qué existe `frozenRef`: `persist` actualiza el estado local de forma optimista,
// así que al decidir un caso `pending` se achica y la card se reemplazaría al instante
// —sin que el usuario vea nada—. Congelar el caso mostrado durante guardado+confirmación
// es lo que hace visible el feedback. Sin esto, el usuario desconfía y hace doble clic
// (bug real reportado: el 2º clic caía sobre el caso siguiente).
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { ClimaDecisionItem, CeoDecision } from '@/types/clima-planes';
import type { PersistResult } from './ClimaPlanDeptTab';
import ClimaDecisionCard from './ClimaDecisionCard';

export type SavePhase = 'idle' | 'saving' | 'saved' | 'error';

/** Ventana en que se ve "Guardado ✓" antes de avanzar. */
const SAVED_FEEDBACK_MS = 900;

interface ClimaCaseReviewProps {
  items: ClimaDecisionItem[];
  readOnly?: boolean;
  /**
   * Modo auditoría: renderiza TODOS los casos (decididos + pendientes) como lista,
   * en vez del flujo lineal uno-a-uno. Editable si !readOnly (borrador). No dispara
   * onAllDone (no es un flujo de cierre, es consulta de lo ya decidido).
   */
  reviewMode?: boolean;
  onDecision: (
    triggerRef: string,
    decision: CeoDecision,
    notes?: string
  ) => Promise<PersistResult>;
  onAllDone: () => void;
}

export default function ClimaCaseReview({
  items,
  readOnly = false,
  reviewMode = false,
  onDecision,
  onAllDone,
}: ClimaCaseReviewProps) {
  const [phase, setPhase] = useState<SavePhase>('idle');
  const [frozenRef, setFrozenRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{
    triggerRef: string;
    decision: CeoDecision;
    notes?: string;
  } | null>(null);

  const pending = items.filter((i) => !i.ceoDecision);

  // Solo cierra el camino cuando no queda nada pendiente Y no hay una escritura en
  // curso — si no, el cierre se dispararía en medio del "Guardado ✓".
  useEffect(() => {
    if (!readOnly && !reviewMode && pending.length === 0 && phase === 'idle') onAllDone();
  }, [pending.length, readOnly, reviewMode, onAllDone, phase]);

  const attempt = async (triggerRef: string, decision: CeoDecision, notes?: string) => {
    if (phase === 'saving' || phase === 'saved') return; // blinda el doble clic
    setLastAttempt({ triggerRef, decision, notes });
    setFrozenRef(triggerRef);
    setPhase('saving');
    setErrorMsg(null);

    const res = await onDecision(triggerRef, decision, notes);

    if (!res.ok) {
      setPhase('error');
      setErrorMsg(res.error);
      return; // NO avanza
    }

    setPhase('saved');
    setTimeout(() => {
      setFrozenRef(null);
      setPhase('idle');
      setLastAttempt(null);
    }, SAVED_FEEDBACK_MS);
  };

  const retry = () => {
    if (lastAttempt) attempt(lastAttempt.triggerRef, lastAttempt.decision, lastAttempt.notes);
  };

  // Lista completa: plan aprobado (readOnly) o modo auditoría en borrador (reviewMode,
  // editable). Muestra la decisión tomada (botón activo) + narrativa/steps/business case.
  if (readOnly || reviewMode) {
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <ClimaDecisionCard
            key={i.triggerRef}
            item={i}
            readOnly={readOnly}
            onDecision={
              readOnly
                ? async () => {}
                : (ref, dec, notes) => {
                    void onDecision(ref, dec, notes);
                  }
            }
          />
        ))}
      </div>
    );
  }

  // Mientras hay un caso congelado se sigue mostrando ése, aunque ya tenga decisión.
  const current = frozenRef
    ? (items.find((i) => i.triggerRef === frozenRef) ?? pending[0])
    : pending[0];

  if (!current) return null; // onAllDone se dispara en el efecto

  const decidedCount = items.length - pending.length;
  const displayIndex = frozenRef ? items.findIndex((i) => i.triggerRef === frozenRef) : decidedCount;

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-mono text-slate-500">
          Caso {displayIndex + 1} de {items.length}
        </p>
        <div className="flex-1 flex gap-1">
          {items.map((it, idx) => (
            <span
              key={it.triggerRef}
              className={`h-1 flex-1 rounded-full ${
                it.ceoDecision
                  ? 'bg-cyan-500/50'
                  : idx === displayIndex
                    ? 'bg-slate-500'
                    : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={current.triggerRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <ClimaDecisionCard
          item={current}
          phase={phase}
          errorMsg={errorMsg}
          onRetry={retry}
          onDecision={attempt}
        />
      </motion.div>
    </div>
  );
}
