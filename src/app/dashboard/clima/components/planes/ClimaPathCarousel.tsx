'use client';

// src/app/dashboard/clima/components/planes/ClimaPathCarousel.tsx
// ════════════════════════════════════════════════════════════════════════════
// Carrusel de los 4 caminos (comparación) — Tab 1 (5D-i). Clon del molde de
// SummaryHub.tsx (array-driven), generalizado a 4 cards. "Sin datos suficientes"
// NO es card: es un link de texto chico expandible, sin controles de decisión.
// Header de plan (progreso + Aprobar) arriba.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import { CLIMA_PLAN_PATHS, CLIMA_PLAN_PATH_ORDER } from '@/lib/constants/climaPlanPaths';
import type { ClimaPlanBlock } from '@/lib/services/clima/climaPlanRouting';
import type { ClimaDecisionItem } from '@/types/clima-planes';

interface DeptSinDatos {
  departmentId: string;
  departmentName: string;
}

interface ClimaPathCarouselProps {
  groups: Record<ClimaPlanBlock, ClimaDecisionItem[]>;
  sinDatos: DeptSinDatos[];
  total: number;
  decided: number;
  saving: boolean;
  readOnly: boolean;
  canApprove: boolean;
  onSelectPath: (block: ClimaPlanBlock) => void;
  onApprove: () => void;
}

export default function ClimaPathCarousel({
  groups,
  sinDatos,
  total,
  decided,
  saving,
  readOnly,
  canApprove,
  onSelectPath,
  onApprove,
}: ClimaPathCarouselProps) {
  const [showSinDatos, setShowSinDatos] = useState(false);

  return (
    <div className="space-y-6">
      {/* Título del carrusel — mismo tratamiento que el título del Workspace */}
      <h3 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
        El sistema ya priorizó por ti.
      </h3>

      {/* Header de plan */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] font-light text-slate-500">
          {total} decisión{total !== 1 ? 'es' : ''} · {decided} resuelta{decided !== 1 ? 's' : ''}
          {saving && <span className="text-slate-600"> · guardando…</span>}
        </p>
        {readOnly ? (
          <span className="flex items-center gap-1.5 text-[11px] font-light text-cyan-300/80">
            <CheckCircle2 className="w-3.5 h-3.5" /> Plan aprobado
          </span>
        ) : decided > 0 ? (
          // Solo aparece con avance real: en la entrada (0 decididas) la ÚNICA acción
          // del carrusel son las 4 cards (Mandamiento 3 — un solo CTA por vista).
          <div className="flex items-center gap-2">
            {!canApprove && (
              <span className="text-[11px] font-light text-slate-600">
                Faltan {total - decided} por decidir
              </span>
            )}
            <PrimaryButton size="sm" icon={CheckCircle2} disabled={!canApprove || saving} onClick={onApprove}>
              Aprobar plan
            </PrimaryButton>
          </div>
        ) : null}
      </div>

      {/* 4 caminos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {CLIMA_PLAN_PATH_ORDER.map((block, idx) => {
          const def = CLIMA_PLAN_PATHS[block];
          const count = groups[block].length;
          const available = count > 0;
          const Icon = def.icon;

          return (
            <motion.button
              key={block}
              onClick={() => available && onSelectPath(block)}
              disabled={!available}
              className={cn(
                'relative p-6 rounded-2xl border transition-all text-left bg-[#0F172A]/60 backdrop-blur-md',
                available
                  ? 'border-slate-800 hover:border-slate-700 cursor-pointer'
                  : 'border-slate-800/30 cursor-not-allowed opacity-50'
              )}
              whileHover={available ? { scale: 1.02, y: -4 } : {}}
              whileTap={available ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.08 }}
            >
              {/* Línea Tesla */}
              <div
                className="absolute top-0 left-4 right-4 h-[2px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, transparent, ${def.color}, transparent)` }}
              />
              {/* Ícono */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${def.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: def.color }} />
              </div>
              {/* Label */}
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: def.color }}>
                {def.label}
              </p>
              {/* Tagline */}
              <p className="text-sm text-slate-300 font-medium mb-3">{def.tagline}</p>
              {/* Número de casos */}
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">{count}</span>
                <span className="text-xs text-slate-500">
                  caso{count !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Sin datos suficientes — link chico expandible, sin controles */}
      {sinDatos.length > 0 && (
        <div>
          <button
            onClick={() => setShowSinDatos((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-light text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ChevronDown className={cn('w-3 h-3 transition-transform', showSinDatos && 'rotate-180')} />
            Sin datos suficientes ({sinDatos.length})
          </button>
          {showSinDatos && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sinDatos.map((d) => (
                <span
                  key={d.departmentId}
                  className="text-[10px] px-2 py-0.5 rounded-full text-slate-500 border border-slate-800/40 font-light"
                >
                  {d.departmentName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
