'use client';

// src/app/dashboard/clima/components/planes/ClimaLoteBar.tsx
// ════════════════════════════════════════════════════════════════════════════
// Fila de UN sub-batch del lote (Gestión Corriente), scopeada a UN reactivo
// (Gate 5D-i). Cada reactivo tiene su propio botón/confirmación independiente —
// decisión Victor: preserva trazabilidad para la matriz de efectividad ("feedback
// en lote" ≠ "herramientas en lote"). Consumido por ClimaLoteView.
//
// Confirmación LIVIANA (RESOLUCION §3): lista simple de los N departamentos +
// un botón; sin repaso caso-por-caso → marca todos 'aceptar' en un autosave atómico.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton';
import type { ClimaDecisionItem } from '@/types/clima-planes';

interface ClimaLoteBarProps {
  items: ClimaDecisionItem[];
  /** Reactivo común del sub-batch (título/trazabilidad). null = sin reactivo nombrado. */
  reactive?: string | null;
  readOnly?: boolean;
  onBatchDecision: (triggerRefs: string[], decision: 'aceptar' | 'pospuesto') => void;
}

export default function ClimaLoteBar({
  items,
  reactive,
  readOnly = false,
  onBatchDecision,
}: ClimaLoteBarProps) {
  const [confirming, setConfirming] = useState(false);
  if (items.length === 0) return null;

  const undecided = items.filter((i) => !i.ceoDecision);
  const resolved = undecided.length === 0;
  // Los batch actions son uniformes → el sub-batch entero queda 'aceptar' o 'pospuesto'.
  const stateLabel = !resolved
    ? null
    : items.every((i) => i.ceoDecision === 'aceptar')
      ? 'Aprobado'
      : items.every((i) => i.ceoDecision === 'pospuesto')
        ? 'Pospuesto'
        : 'Resuelto';
  // La acción es idéntica en todo el sub-batch (agrupado por reactivo×zona → misma
  // celda variante) → un representante alcanza para mostrar qué se va a aplicar.
  const preview = items[0]?.intervention ?? null;
  // readOnly (consulta/auditoría): se listan TODOS los equipos con lo ya decidido.
  // Borrador: solo los pendientes a decidir.
  const teamList = readOnly ? items : undecided;

  return (
    <div className="rounded-xl border border-slate-800/40 bg-slate-900/40 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-emerald-400/70 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-light text-white">
              {reactive ? <span className="text-emerald-300/90">{reactive}</span> : 'Grupo sin reactivo'}
              <span className="text-slate-500"> · {items.length} depto{items.length !== 1 ? 's' : ''}</span>
            </p>
            <p className="text-[11px] font-light text-slate-500">
              El mismo foco en varios equipos. Una acción los cubre a todos.
            </p>
          </div>
        </div>

        {!readOnly && !resolved && (
          // Reposo: sin verbo de decisión — solo abre/cierra el detalle (mismo patrón de
          // 2 pasos que los otros 3 bloques). La decisión vive UNA sola vez, al pie.
          <GhostButton
            size="sm"
            icon={confirming ? ChevronUp : ChevronDown}
            iconPosition="right"
            onClick={() => setConfirming((v) => !v)}
          >
            Revisar plan
          </GhostButton>
        )}
        {resolved && (
          <span
            className={`text-[11px] font-light ${
              stateLabel === 'Aprobado' ? 'text-emerald-300/80' : 'text-slate-400/80'
            }`}
          >
            {stateLabel}
          </span>
        )}
      </div>

      <AnimatePresence>
        {(confirming || readOnly) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-slate-800/40">
              {/* Vista previa de la acción concreta — el jefe decide sabiendo qué se crea,
                  sin abrir caso por caso (eso anularía el lote). Progressive disclosure.
                  En readOnly es la consulta de auditoría de lo ya decidido. */}
              {preview && (
                <div className="mb-3 rounded-lg border border-slate-800/40 bg-slate-900/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
                    La acción
                  </p>
                  <p className="text-[12px] font-light text-slate-400 leading-relaxed">
                    {preview.narrative}
                  </p>
                  {preview.steps.length > 0 && (
                    <ul className="mt-2 space-y-1 pl-4">
                      {preview.steps.map((step, i) => (
                        <li
                          key={i}
                          className="text-[11px] font-light text-slate-500 leading-relaxed list-disc"
                        >
                          {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-[11px] font-light text-slate-400 mb-2">
                {readOnly
                  ? `${stateLabel === 'Pospuesto' ? 'Pospuesto en' : 'Aplicado a'} ${teamList.length} equipo${teamList.length !== 1 ? 's' : ''}:`
                  : `Se aplicará a ${teamList.length} equipo${teamList.length !== 1 ? 's' : ''}:`}
              </p>
              <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto">
                {teamList.map((i) => (
                  <li key={i.triggerRef} className="text-[12px] font-light text-slate-500">
                    · {i.departmentName ?? 'Departamento'}
                  </li>
                ))}
              </ul>
              {/* Botones solo en borrador. "Aprobar" despacha; "No ahora" pospone (no genera
                  acción — se revisa en otro ciclo, distinguible de rechazar). En readOnly: consulta. */}
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <PrimaryButton
                    size="sm"
                    onClick={() => {
                      onBatchDecision(teamList.map((i) => i.triggerRef), 'aceptar');
                      setConfirming(false);
                    }}
                  >
                    Aprobar {teamList.length}
                  </PrimaryButton>
                  <GhostButton
                    size="sm"
                    onClick={() => {
                      onBatchDecision(teamList.map((i) => i.triggerRef), 'pospuesto');
                      setConfirming(false);
                    }}
                  >
                    No ahora
                  </GhostButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
