'use client';

// src/app/dashboard/clima/components/planes/ClimaLoteView.tsx
// ════════════════════════════════════════════════════════════════════════════
// Vista de lote de Gestión Corriente (Gate 5D-i) — N sub-batches POR REACTIVO,
// no un batch combinado (decisión Victor: trazabilidad para la matriz de
// efectividad). Un ClimaLoteBar por reactivo.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { groupLoteByReactive } from '@/lib/services/clima/climaPlanRouting';
import type { ClimaDecisionItem } from '@/types/clima-planes';
import ClimaLoteBar from './ClimaLoteBar';

interface ClimaLoteViewProps {
  items: ClimaDecisionItem[];
  readOnly?: boolean;
  /** Error de la última aprobación en lote — nunca se falla en silencio. */
  errorMsg?: string | null;
  onBatchDecision: (triggerRefs: string[], decision: 'aceptar' | 'pospuesto') => void;
}

export default function ClimaLoteView({
  items,
  readOnly = false,
  errorMsg = null,
  onBatchDecision,
}: ClimaLoteViewProps) {
  const subBatches = groupLoteByReactive(items);

  if (subBatches.length === 0) {
    return (
      <p className="text-sm font-light text-slate-500 py-10 text-center">
        No hay victorias rápidas en esta campaña. Ningún foco leve tiene todavía una acción
        lista para aplicar de una vez.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-light text-slate-500">
        {subBatches.length} foco{subBatches.length !== 1 ? 's' : ''} listo{subBatches.length !== 1 ? 's' : ''} para
        resolver. Cada uno se aprueba de una vez para todos sus equipos.
      </p>

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-300" />
          <p className="text-[12px] font-light text-red-300">
            {errorMsg} El lote no quedó aprobado.
          </p>
        </motion.div>
      )}
      {subBatches.map((b) => (
        <ClimaLoteBar
          key={b.key}
          items={b.items}
          reactive={b.reactive}
          readOnly={readOnly}
          onBatchDecision={onBatchDecision}
        />
      ))}
    </div>
  );
}
