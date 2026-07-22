'use client';

// src/app/dashboard/clima/components/planes/ClimaPathChaining.tsx
// ════════════════════════════════════════════════════════════════════════════
// Pantalla de ENCADENADO al terminar un camino individual (5D-i): confirma el
// cierre y ofrece saltar directo a los caminos individuales que falten (con
// pendientes) o volver al carrusel.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Eye } from 'lucide-react';
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton';
import { CLIMA_PLAN_PATHS } from '@/lib/constants/climaPlanPaths';
import type { ClimaPlanBlock } from '@/lib/services/clima/climaPlanRouting';

export interface RemainingPath {
  block: ClimaPlanBlock;
  pending: number;
}

interface ClimaPathChainingProps {
  block: ClimaPlanBlock;
  caseCount: number;
  remaining: RemainingPath[];
  /** true = todas las decisiones del plan están tomadas (gate duro cumplido). */
  canApprove: boolean;
  saving: boolean;
  onApprove: () => void;
  onGoToPath: (block: ClimaPlanBlock) => void;
  onBackToCarousel: () => void;
  /** Abre la vista de auditoría de este bloque (lo ya decidido). */
  onReview: () => void;
}

export default function ClimaPathChaining({
  block,
  caseCount,
  remaining,
  canApprove,
  saving,
  onApprove,
  onGoToPath,
  onBackToCarousel,
  onReview,
}: ClimaPathChainingProps) {
  const def = CLIMA_PLAN_PATHS[block];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-8"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${def.color}15` }}
      >
        <CheckCircle2 className="w-6 h-6" style={{ color: def.color }} />
      </div>

      <h3 className="text-lg font-light text-white">
        Terminaste{' '}
        <span style={{ color: def.color }}>{def.label.toLowerCase()}</span>
      </h3>
      <p className="text-sm font-light text-slate-500 mt-1">
        {caseCount} caso{caseCount !== 1 ? 's' : ''} revisado{caseCount !== 1 ? 's' : ''}.
      </p>

      {caseCount > 0 && (
        // Auditar lo recien decidido es una accion de primer nivel en esta pantalla:
        // boton real (Opcion A), no un micro-link gris que se pierde.
        <div className="mt-5">
          <SecondaryButton size="sm" icon={Eye} onClick={onReview}>
            Revisar lo decidido
          </SecondaryButton>
        </div>
      )}

      {remaining.length > 0 && (
        <div className="w-full max-w-sm mt-8 space-y-2">
          <p className="text-[10px] uppercase tracking-[1.5px] text-slate-600 font-medium">
            Caminos que faltan
          </p>
          {remaining.map((r) => {
            const rdef = CLIMA_PLAN_PATHS[r.block];
            return (
              <button
                key={r.block}
                onClick={() => onGoToPath(r.block)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-800/50 hover:border-slate-700 bg-slate-900/40 transition-colors text-left"
              >
                <span className="text-sm font-light text-slate-200">
                  Seguir con {rdef.label.toLowerCase()}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-mono" style={{ color: rdef.color }}>
                    {r.pending} pendiente{r.pending !== 1 ? 's' : ''}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {canApprove && (
        <p className="text-sm font-light text-slate-400 mt-6 max-w-sm">
          Todas las decisiones están tomadas. El plan queda inmutable al aprobarlo.
        </p>
      )}

      <div className="mt-8">
        {canApprove ? (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <PrimaryButton size="sm" icon={CheckCircle2} disabled={saving} onClick={onApprove}>
              Aprobar plan
            </PrimaryButton>
            <GhostButton size="sm" onClick={onBackToCarousel}>
              Volver al carrusel
            </GhostButton>
          </div>
        ) : remaining.length > 0 ? (
          <SecondaryButton size="sm" onClick={onBackToCarousel}>
            Volver al carrusel
          </SecondaryButton>
        ) : (
          <PrimaryButton size="sm" onClick={onBackToCarousel}>
            Volver al carrusel
          </PrimaryButton>
        )}
      </div>
    </motion.div>
  );
}
