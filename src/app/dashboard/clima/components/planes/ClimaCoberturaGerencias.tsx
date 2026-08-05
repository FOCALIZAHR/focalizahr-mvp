'use client';

// src/app/dashboard/clima/components/planes/ClimaCoberturaGerencias.tsx
// ════════════════════════════════════════════════════════════════════════════
// Cobertura de registro por gerencia (H2a) — Cápsula 3, Estado A.
// Responde "quién dejó registro y quién no", con drill-down gerencia → depto.
//
// ── ESTRUCTURA: card por gerencia con anillo, no lista plana ─────────────────
// Cada unidad de primer nivel es una CARD con su anillo de progreso; al expandir,
// sus departamentos aparecen como filas compactas. La jerarquía visual sigue a la
// jerarquía real: la gerencia es la unidad de decisión, el departamento es su
// detalle.
//
// MOLDES, uno por pieza:
//   · anillo   → `ClimaProgressRing` (clon de `evaluator/cinema/SegmentedRing.tsx`,
//                sin su color-por-valor, que era un semáforo).
//   · card     → chrome del propio módulo: `rounded-xl border-slate-800/40
//                bg-slate-900/40`, hover como en el Rail (`ClimaSubproductoRailCard`).
//   · fila hija→ `UnitRow` de `ClimaDimensionesView.tsx:322`: rank en mono, nombre
//                truncado, métrica en `font-mono tabular-nums`, chevron que rota.
//   · desglose → `mt-2 pl-2.5 border-l border-slate-800/40 space-y-0.5` (íd.).
//
// ── COLOR ────────────────────────────────────────────────────────────────────
// UN color fijo: `#10B981`, la identidad de la Cápsula 3 — el mismo de su tarjeta
// en el hub y del ícono del panel izquierdo. Idéntico para 0% y para 100%.
// La cobertura NO es severidad: un 0% significa que nadie escribió todavía, no que
// algo esté mal, y el plan maestro §6 lo dice literal ("si el jefe no escribe, eso
// es un dato, no un error"). Pintarlo por valor sería el semáforo prohibido y, peor,
// un juicio sobre el jefe que §2.6 prohíbe. La prioridad la comunica el ORDEN:
// peor cobertura primero, resuelto en el servidor.
//
// Descartado a propósito el degradado propuesto para el relleno: el gradiente
// cyan→violeta es la firma de marca (Tesla line) y usarlo como relleno de dato lo
// convierte en semántica. Ver `ClimaPlanesHub` — misma decisión, misma razón.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClimaProgressRing from '@/components/clima/ClimaProgressRing';
import {
  COBERTURA_TAG_SIN_REGISTRO,
  coberturaRowCount,
  coberturaDetalle,
  coberturaDesglose,
  coberturaUnidadesLabel,
} from '@/lib/constants/climaHubContent';
import type { ClimaCoberturaUnidadDTO } from '@/types/clima-hub';

const ACCENT = '#10B981';

/** Fila compacta de departamento — el detalle dentro de la card de su gerencia. */
function DeptRow({ unit, index }: { unit: ClimaCoberturaUnidadDTO; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const children = unit.children ?? [];
  const showChildren =
    children.length > 0 &&
    !(children.length === 1 && children[0].departmentId === unit.departmentId);

  return (
    <div className="relative">
      <button
        onClick={() => showChildren && setExpanded((v) => !v)}
        className={cn(
          'w-full text-left py-2 px-1.5 rounded-lg transition-colors',
          showChildren && 'hover:bg-slate-800/20',
          expanded && 'bg-slate-800/20',
          !showChildren && 'cursor-default'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 w-4 text-right flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-[13px] font-light text-slate-300 truncate flex-1">
            {unit.departmentName}
          </span>
          <span className="text-[10px] font-light text-slate-600 tabular-nums flex-shrink-0">
            {coberturaRowCount(unit.withAction, unit.total)}
          </span>
          <span className="text-[11px] font-mono tabular-nums text-slate-300 w-8 text-right flex-shrink-0">
            {unit.pct}%
          </span>
          {showChildren ? (
            <ChevronDown
              className={cn(
                'w-3 h-3 text-slate-700 transition-transform flex-shrink-0',
                expanded && 'rotate-180'
              )}
            />
          ) : (
            <span className="w-3 flex-shrink-0" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && showChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-6 pl-2.5 border-l border-slate-800/40 space-y-0.5 pb-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-700 font-medium mb-1">
                {coberturaDesglose(children.length)}
              </p>
              {children.map((c, i) => (
                <DeptRow key={c.departmentId} unit={c} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Card de gerencia: anillo + identidad + desglose expandible. */
function GerenciaCard({ unit, index }: { unit: ClimaCoberturaUnidadDTO; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const children = unit.children ?? [];
  const showChildren =
    children.length > 0 &&
    !(children.length === 1 && children[0].departmentId === unit.departmentId);
  const sinRegistro = unit.withAction === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border border-slate-800/40 bg-slate-900/40 overflow-hidden"
    >
      <button
        onClick={() => showChildren && setExpanded((v) => !v)}
        className={cn(
          'w-full text-left p-3 md:p-4 flex items-center gap-4 transition-colors',
          showChildren && 'hover:bg-slate-800/30',
          !showChildren && 'cursor-default'
        )}
      >
        <ClimaProgressRing value={unit.pct} size={56} strokeWidth={5} color={ACCENT} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-light text-slate-200 truncate">{unit.departmentName}</p>
          <p className="text-[11px] font-light text-slate-500 mt-0.5 tabular-nums">
            {coberturaRowCount(unit.withAction, unit.total)}
          </p>
          {sinRegistro && (
            <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light">
              {COBERTURA_TAG_SIN_REGISTRO}
            </span>
          )}
        </div>

        {showChildren && (
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-700 transition-transform flex-shrink-0',
              expanded && 'rotate-180'
            )}
          />
        )}
      </button>

      <AnimatePresence>
        {expanded && showChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 md:px-4 pb-3 pt-1 border-t border-slate-800/40">
              <p className="text-[9px] uppercase tracking-wider text-slate-700 font-medium mb-1 mt-2">
                {coberturaDesglose(children.length)}
              </p>
              <div className="space-y-0.5">
                {children.map((c, i) => (
                  <DeptRow key={c.departmentId} unit={c} index={i} />
                ))}
              </div>
              <p className="text-[10px] font-light text-slate-600 mt-2">
                {coberturaDetalle(unit.withAction, unit.total)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ClimaCoberturaGerencias({
  units,
}: {
  units: ClimaCoberturaUnidadDTO[];
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[1.5px] text-slate-700 font-medium mb-2">
        {coberturaUnidadesLabel(units.length)}
      </p>
      <div className="space-y-2">
        {units.map((u, i) => (
          <GerenciaCard key={u.departmentId} unit={u} index={i} />
        ))}
      </div>
    </div>
  );
}
