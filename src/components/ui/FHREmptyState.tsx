'use client';

// src/components/ui/FHREmptyState.tsx
// Empty state canónico de FocalizaHR (skill focalizahr-design → empty-states.md).
// MANDAMIENTO: `return null` no existe. La ausencia también es dato — un estado
// con significado dice "analizamos, y esto es lo que encontramos".
//
// 4 tipos: pending (sin ciclo) · insufficient (n<umbral) · clear (análisis sin
// señales) · requires (dato cruzado pendiente).

import Link from 'next/link';
import { Clock, BarChart2, ShieldCheck, Link2, type LucideIcon } from 'lucide-react';

export type EmptyStateType = 'pending' | 'insufficient' | 'clear' | 'requires';

export interface FHREmptyStateProps {
  type: EmptyStateType;
  title: string;
  description: string;
  /** Frase interpretativa adicional (típico en 'clear' e 'insufficient'). */
  insight?: string;
  /** Dato técnico secundario (ej: "n mínimo = 5"). */
  meta?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const TYPE_CONFIG: Record<EmptyStateType, { icon: LucideIcon; color: string; border: string }> = {
  pending: { icon: Clock, color: 'text-slate-400', border: 'border-slate-700/50' },
  insufficient: { icon: BarChart2, color: 'text-amber-400', border: 'border-amber-500/20' },
  clear: { icon: ShieldCheck, color: 'text-emerald-400', border: 'border-emerald-500/20' },
  requires: { icon: Link2, color: 'text-cyan-400', border: 'border-cyan-500/20' },
};

export function FHREmptyState({ type, title, description, insight, meta, cta }: FHREmptyStateProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-xl border ${config.border} bg-slate-900/40 backdrop-blur-sm px-6 py-8 text-center flex flex-col items-center gap-3`}
    >
      <div className={`${config.color} opacity-60`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>

      <h3 className="text-slate-200 font-light text-base">{title}</h3>

      <p className="text-slate-400 font-light text-sm max-w-sm leading-relaxed">{description}</p>

      {insight && (
        <p className="text-slate-500 font-light text-xs italic max-w-xs">{insight}</p>
      )}

      {meta && (
        <span className="text-[10px] uppercase tracking-widest text-slate-600">{meta}</span>
      )}

      {cta && (
        <div className="mt-2">
          {cta.href ? (
            <Link href={cta.href} className="fhr-btn-secondary text-sm px-4 py-2">
              {cta.label}
            </Link>
          ) : (
            <button onClick={cta.onClick} className="fhr-btn-secondary text-sm px-4 py-2">
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FHREmptyState;
