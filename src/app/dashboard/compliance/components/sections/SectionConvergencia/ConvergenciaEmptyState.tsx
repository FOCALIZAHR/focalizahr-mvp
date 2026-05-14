'use client';

// Empty state con 3 variantes (sin_ciclo, sin_convergencia, solo_motor_a).
// Plan sec "Componente 4 — ConvergenciaEmptyState".
// Tokens canónicos FocalizaHR (post-Gate 5d Sub-2C):
// rounded-2xl + bg-slate-900/60 + backdrop-blur-sm + border-slate-800/40.

import { EMPTY_STATE_COPY } from './_shared/EMPTY_STATE_COPY';
import type { EmptyStateVariant } from './_shared/helpers';

interface Props {
  variant: EmptyStateVariant;
}

export default function ConvergenciaEmptyState({ variant }: Props) {
  const copy = EMPTY_STATE_COPY[variant];
  const Icon = copy.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/40">
      {/* Tesla slate sutil — sin glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, #334155 40%, #475569 60%, transparent)',
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center text-center px-7 py-16 md:py-20 gap-4">
        <Icon
          className="w-10 h-10 text-slate-600"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p
          className="text-base font-light leading-[1.6] max-w-md"
          style={{ color: '#cbd5e1' }}
        >
          {copy.titulo}
        </p>
        {copy.subtitulo ? (
          <p
            className="text-sm font-light leading-[1.7] max-w-md"
            style={{ color: '#94a3b8' }}
          >
            {copy.subtitulo}
          </p>
        ) : null}
      </div>
    </div>
  );
}
