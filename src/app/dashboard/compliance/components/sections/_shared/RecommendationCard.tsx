'use client';

// src/app/dashboard/compliance/components/sections/_shared/RecommendationCard.tsx
// Card de una recomendación del InterventionEngine — consolidated o individual.
// Usada por SectionSimulador y SectionAlertas con distinto accent color.

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, Zap, RotateCcw, Loader2 } from 'lucide-react';
import type {
  Recommendation,
  CompliancePlanAction,
  Intervention,
} from '@/types/compliance';

interface RecommendationCardProps {
  recommendation: Recommendation;
  planActions: CompliancePlanAction[];
  onRegister: (input: {
    triggerType: 'dimension_low' | 'patron' | 'alert';
    triggerRef: string;
    triggerLabel: string;
    chosenOption: number;
    interventionId: string;
  }) => Promise<void>;
  onClear: (triggerRef: string) => Promise<void>;
  isSaving: boolean;
  /** Accent color — cyan para Simulador, amber para Alertas. */
  accent?: 'cyan' | 'amber';
}

export default function RecommendationCard({
  recommendation: rec,
  planActions,
  onRegister,
  onClear,
  isSaving,
  accent = 'cyan',
}: RecommendationCardProps) {
  // Triggers que este card cubre
  const triggersCovered = useMemo(
    () =>
      rec.type === 'consolidated'
        ? rec.resolvesTriggers ?? []
        : rec.trigger
          ? [rec.trigger]
          : [],
    [rec]
  );

  // Acciones ya registradas para estos triggers
  const existingActions = useMemo(() => {
    const refs = new Set(triggersCovered.map((t) => t.ref));
    return planActions.filter((a) => refs.has(a.triggerRef));
  }, [planActions, triggersCovered]);

  const borderAccent =
    accent === 'amber' ? 'border-amber-500/30' : 'border-cyan-500/30';
  const textAccent = accent === 'amber' ? 'text-amber-300' : 'text-cyan-300';
  const chipBg = accent === 'amber' ? 'bg-amber-500/10' : 'bg-cyan-500/10';

  // Consolidated layout
  if (rec.type === 'consolidated' && rec.intervention) {
    const chosen = existingActions[0];
    return (
      <div
        className={cn(
          'relative overflow-hidden p-6 bg-[#0F172A]/90 backdrop-blur-2xl border rounded-[20px]',
          chosen ? borderAccent : 'border-slate-800'
        )}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background:
              accent === 'amber'
                ? 'linear-gradient(90deg, transparent, #F59E0B, transparent)'
                : 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            opacity: 0.7,
          }}
        />

        <div className="flex items-center gap-2 mb-3">
          <Zap className={cn('w-4 h-4', textAccent)} />
          <span
            className={cn(
              'text-[10px] uppercase tracking-widest font-medium',
              textAccent
            )}
          >
            Recomendación consolidada — alto apalancamiento
          </span>
        </div>

        <p className="text-white font-light text-lg leading-snug">
          {rec.intervention.titulo}
        </p>

        <p className="text-slate-400 text-sm font-light mt-3 leading-relaxed">
          {rec.justificacion}
        </p>

        {rec.intervention.mecanismo && (
          <p className="text-slate-500 text-[13px] font-light mt-3 leading-relaxed">
            {rec.intervention.mecanismo}
          </p>
        )}

        <InterventionMeta intervention={rec.intervention} />

        {/* Triggers que resuelve */}
        {triggersCovered.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {triggersCovered.map((t) => (
              <span
                key={t.ref}
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-light border',
                  chipBg,
                  borderAccent,
                  textAccent
                )}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}

        {/* Registrar / mostrar elegida */}
        <div className="mt-5">
          {chosen ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs text-slate-300 font-light">
                <Check className={cn('w-4 h-4', textAccent)} />
                Registrada el{' '}
                {new Date(chosen.registeredAt).toLocaleDateString('es-CL')}
              </span>
              <button
                disabled={isSaving}
                onClick={() => onClear(chosen.triggerRef)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                Deshacer
              </button>
            </div>
          ) : (
            <button
              disabled={isSaving}
              onClick={() => {
                // Registramos una acción por cada trigger cubierto
                triggersCovered.forEach((t) => {
                  onRegister({
                    triggerType: t.type,
                    triggerRef: t.ref,
                    triggerLabel: t.label,
                    chosenOption: 0,
                    interventionId: rec.intervention!.id,
                  });
                });
              }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-light',
                borderAccent,
                textAccent,
                chipBg,
                'hover:opacity-90 disabled:opacity-60'
              )}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Registrar acción consolidada
            </button>
          )}
        </div>
      </div>
    );
  }

  // Individual layout
  if (rec.type === 'individual' && rec.options && rec.trigger) {
    const chosen = existingActions[0];
    return (
      <div className="relative overflow-hidden p-6 bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[20px]">
        <div
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background:
              accent === 'amber'
                ? 'linear-gradient(90deg, transparent, #F59E0B, transparent)'
                : 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            opacity: 0.5,
          }}
        />

        <div className="flex items-baseline gap-2 mb-2">
          <span
            className={cn(
              'text-[10px] uppercase tracking-widest font-medium',
              textAccent
            )}
          >
            {rec.trigger.label}
          </span>
        </div>

        <p className="text-slate-400 text-sm font-light leading-relaxed">
          {rec.justificacion}
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {rec.options.map((opcion, idx) => {
            const isChosen = chosen?.chosenOption === idx;
            return (
              <button
                key={opcion.id}
                disabled={isSaving || !!chosen}
                onClick={() => {
                  if (!rec.trigger) return;
                  onRegister({
                    triggerType: rec.trigger.type,
                    triggerRef: rec.trigger.ref,
                    triggerLabel: rec.trigger.label,
                    chosenOption: idx,
                    interventionId: opcion.id,
                  });
                }}
                className={cn(
                  'text-left p-4 rounded-xl border transition-all relative',
                  isChosen
                    ? cn(borderAccent, 'bg-cyan-500/5 shadow-[0_0_12px_-4px]')
                    : idx === 0
                      ? 'border-cyan-800/40 bg-slate-800/40 hover:border-cyan-600/40'
                      : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600/50',
                  'disabled:cursor-not-allowed'
                )}
              >
                {isChosen && (
                  <Check
                    className={cn('absolute top-3 right-3 w-4 h-4', textAccent)}
                  />
                )}
                {idx === 0 && !chosen && (
                  <span
                    className={cn(
                      'text-[9px] uppercase tracking-wide block mb-1',
                      textAccent
                    )}
                  >
                    Recomendada
                  </span>
                )}
                <p className="text-white text-sm font-light">{opcion.titulo}</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {opcion.mecanismo}
                </p>
                <div className="flex gap-2 mt-3 text-slate-600 text-[10px] flex-wrap">
                  <span>{opcion.evidencia}</span>
                  <span>·</span>
                  <span>{opcion.plazo}</span>
                </div>
              </button>
            );
          })}
        </div>

        {chosen && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-light">
              Registrada el{' '}
              {new Date(chosen.registeredAt).toLocaleDateString('es-CL')}
            </span>
            <button
              disabled={isSaving}
              onClick={() => onClear(chosen.triggerRef)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RotateCcw className="w-3 h-3" />
              )}
              Deshacer
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// Meta de intervención — evidencia · plazo · métrica
// ═══════════════════════════════════════════════════════════════════

function InterventionMeta({ intervention }: { intervention: Intervention }) {
  return (
    <div className="flex gap-3 mt-3 text-slate-600 text-xs flex-wrap font-light">
      <span>{intervention.evidencia}</span>
      <span>·</span>
      <span>{intervention.plazo}</span>
      <span>·</span>
      <span className="text-cyan-500/70">{intervention.metrica}</span>
    </div>
  );
}
