'use client';

// src/app/dashboard/clima/components/planes/ClimaPathChaining.tsx
// ════════════════════════════════════════════════════════════════════════════
// Pantalla de CIERRE de bloque (5D-i) — "Pantalla de Guía" (icono + texto + 1 CTA,
// nunca gauge). Estructura:
//   1. Indicador de etapas: 4 dots minimalistas (clon de ProgressDots), pegados
//      arriba y SIN texto (no le quitan jerarquía al título). done / activo /
//      pendiente. Clickeable (salto directo a cualquier bloque). El detalle
//      nombre+pendientes vive en el tooltip al hover = REPLICA de ProgressDots
//      (:101-160): portal + card slate-950 + línea Tesla + filas Check/Clock. En
//      táctil (sin hover): tap en el dot salta al bloque.
//   2. Cuerpo: check + "Terminaste {bloque}" + "{N} casos revisados."
//   3. UN CTA dominante estilo CTAButton del Lobby (MissionControl:135-180): eyebrow
//      + nombre REAL del bloque + flecha en caja. Continúa al bloque de mayor prioridad
//      con pendientes (Sistémico > Crítico > Lote > Genérico); si no quedan, aprueba.
//   4. "Revisar lo decidido": link de texto plano (sin caja), no compite con el CTA.
//
// La salida al carrusel es el "← Carrusel" de arriba-izquierda del Workspace, NO un
// botón del cuerpo (por eso acá no hay "Volver al carrusel" ni "Caminos que faltan").
// ════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Check, Clock, Minus, ArrowRight, Eye, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLIMA_PLAN_PATHS } from '@/lib/constants/climaPlanPaths';
import type { ClimaPlanBlock } from '@/lib/services/clima/climaPlanRouting';

export interface BlockStatus {
  block: ClimaPlanBlock;
  /** Casos del bloque (0 = bloque sin focos en esta campaña). */
  total: number;
  /** Casos sin decidir. */
  pending: number;
}

interface ClimaPathChainingProps {
  block: ClimaPlanBlock;
  caseCount: number;
  /** Estado de los 4 bloques, en orden de prioridad (Sistémico > Crítico > Lote > Genérico). */
  blockStatuses: BlockStatus[];
  /** true = todas las decisiones del plan están tomadas (gate duro cumplido). */
  canApprove: boolean;
  saving: boolean;
  onApprove: () => void;
  onGoToPath: (block: ClimaPlanBlock) => void;
  /** Abre la vista de auditoría de este bloque (lo ya decidido). */
  onReview: () => void;
}

// ── CTA "Smart Road" — clon del CTAButton del Lobby (MissionControl.tsx:135-180):
//    gradiente cyan + glow, eyebrow + línea bold + ícono en caja, hover lift. ──
function SmartRoadCTA({
  eyebrow,
  main,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  eyebrow: string;
  main: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        'group relative flex items-center rounded-xl transition-all transform gap-4 pl-5 pr-2 py-2',
        'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950',
        'shadow-[0_8px_24px_-6px_rgba(34,211,238,0.35)]',
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5'
      )}
    >
      <div className="text-left">
        <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-70 text-slate-700">
          {eyebrow}
        </span>
        <span className="block text-sm font-bold leading-tight">{main}</span>
      </div>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
        <Icon className="w-4 h-4" />
      </div>
    </motion.button>
  );
}

export default function ClimaPathChaining({
  block,
  caseCount,
  blockStatuses,
  canApprove,
  saving,
  onApprove,
  onGoToPath,
  onReview,
}: ClimaPathChainingProps) {
  const def = CLIMA_PLAN_PATHS[block];
  // Siguiente por prioridad: primer bloque con pendientes (blockStatuses ya viene ordenado).
  const nextPending = blockStatuses.find((b) => b.pending > 0) ?? null;

  // Tooltip del indicador — MISMO patrón que ProgressDots (portal + posición al mouse).
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const handleEnter = () => {
    if (dotsRef.current) {
      const r = dotsRef.current.getBoundingClientRect();
      setTooltipPos({ x: r.left + r.width / 2, y: r.top - 8 });
    }
    setShowTooltip(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center pt-2 pb-8"
    >
      {/* 1 · Indicador de etapas — dots minimalistas pegados arriba, SIN texto (no
             compiten con el título). Tooltip replicado de ProgressDots al hover. */}
      <div
        ref={dotsRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center justify-center gap-2 mb-10"
      >
        {blockStatuses.map((b) => {
          const isActive = b.block === block;
          const empty = b.total === 0;
          const done = !empty && b.pending === 0;
          return (
            <button
              key={b.block}
              type="button"
              disabled={empty}
              onClick={() => !empty && onGoToPath(b.block)}
              aria-label={CLIMA_PLAN_PATHS[b.block].label}
              className={cn('p-1', empty ? 'cursor-default' : 'cursor-pointer')}
            >
              <span
                className={cn(
                  'block w-2 h-2 rounded-full transition-all duration-300',
                  done && 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
                  !done && !empty && 'bg-slate-700',
                  empty && 'bg-slate-800',
                  isActive && 'ring-2 ring-cyan-300/50 ring-offset-2 ring-offset-[#0F172A]'
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Cuerpo — icono + título + subtítulo (Pantalla de Guía: icono + texto + CTA) */}
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

      {/* 3 · Un solo CTA dominante (Smart Road). Con pendientes: continuar al de mayor
             prioridad (nombre REAL). Sin pendientes: aprobar el plan. */}
      <div className="mt-8">
        {nextPending ? (
          <SmartRoadCTA
            eyebrow="Continuar"
            main={`${CLIMA_PLAN_PATHS[nextPending.block].label} · ${nextPending.pending} pendiente${
              nextPending.pending !== 1 ? 's' : ''
            }`}
            icon={ArrowRight}
            onClick={() => onGoToPath(nextPending.block)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-light text-slate-400 max-w-sm">
              Todas las decisiones están tomadas. El plan queda inmutable al aprobarlo.
            </p>
            <SmartRoadCTA
              eyebrow="Aprobar"
              main="Plan de acción"
              icon={Check}
              onClick={onApprove}
              disabled={saving || !canApprove}
            />
          </div>
        )}
      </div>

      {/* 4 · "Revisar lo decidido" — link de texto plano (sin caja), no compite con el CTA. */}
      {caseCount > 0 && (
        <button
          type="button"
          onClick={onReview}
          className="mt-6 flex items-center gap-1.5 text-[11px] font-light text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Eye className="w-3 h-3" /> Revisar lo decidido
        </button>
      )}

      {/* Tooltip del indicador — REPLICA de ProgressDots.tsx:101-160 (portal a body,
          card compacta slate-950 + línea Tesla + filas Check/Clock por bloque). */}
      {mounted &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 99999,
              pointerEvents: 'none',
              opacity: showTooltip ? 1 : 0,
              transition: 'opacity 0.2s ease-out',
            }}
          >
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl w-56">
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
              <div className="flex items-center gap-2 mb-1 border-b border-slate-800 pb-1">
                <span className="text-[10px] font-bold text-slate-300 uppercase">
                  Progreso del plan
                </span>
              </div>
              <div className="space-y-2 mt-2">
                {blockStatuses.map((b) => {
                  const empty = b.total === 0;
                  const done = !empty && b.pending === 0;
                  return (
                    <div key={b.block} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {done ? (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        ) : empty ? (
                          <Minus className="w-3.5 h-3.5 text-slate-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span
                          className={cn('text-[10px] text-slate-400', done && 'text-slate-300')}
                        >
                          {CLIMA_PLAN_PATHS[b.block].label}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          done ? 'text-cyan-400' : 'text-slate-600'
                        )}
                      >
                        {empty
                          ? 'sin casos'
                          : done
                            ? 'completo'
                            : `${b.pending} pendiente${b.pending !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
            </div>
          </div>,
          document.body
        )}
    </motion.div>
  );
}
