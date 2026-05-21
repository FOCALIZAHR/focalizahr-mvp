'use client';

// src/components/compliance/cascada/ActoCoberturaModal.tsx
// ────────────────────────────────────────────────────────────────────────────
// Modal de apoyo del Acto 0 "La Cobertura". Lista per-depto con dotación,
// participación, estado de análisis, EXO/EIS gold y alertas externas.
// Chrome clonado de PLTalentRadarModal.tsx (createPortal, glassmorphism dark,
// X close, fhr-top-line, header word-split). Sin charts — tabla compacta.
// ────────────────────────────────────────────────────────────────────────────

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CoverageAnalysisResult,
  CoverageAnalyzedStatus,
  CoverageDeptItem,
} from '@/types/compliance';

interface ActoCoberturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverage: CoverageAnalysisResult;
}

const STATUS_LABEL: Record<CoverageAnalyzedStatus, string> = {
  completed: 'Analizada',
  skipped_privacy: 'Dotación bajo umbral',
  no_response: 'Sin respuesta',
  not_invited: 'No invitada',
};

const STATUS_COLOR: Record<CoverageAnalyzedStatus, string> = {
  completed: 'text-cyan-400',
  skipped_privacy: 'text-slate-500',
  no_response: 'text-amber-400',
  not_invited: 'text-slate-500',
};

/** Orden de render: primero las analizadas, después las con voz externa,
 *  luego las sin respuesta, finalmente las no invitadas. */
const STATUS_RANK: Record<CoverageAnalyzedStatus, number> = {
  completed: 0,
  no_response: 1,
  skipped_privacy: 2,
  not_invited: 3,
};

export default memo(function ActoCoberturaModal({
  isOpen,
  onClose,
  coverage,
}: ActoCoberturaModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  // Ordenar: voz externa primero dentro de cada grupo (señales antes que silencio puro).
  const vozExternaSet = new Set(
    coverage.silencioConVozExterna.map((i) => i.departmentId),
  );
  const deptos = [...coverage.deptosCobertura].sort((a, b) => {
    const sa = STATUS_RANK[a.analyzed];
    const sb = STATUS_RANK[b.analyzed];
    if (sa !== sb) return sa - sb;
    // Dentro de no_response: las con voz externa primero.
    if (a.analyzed === 'no_response' && b.analyzed === 'no_response') {
      const va = vozExternaSet.has(a.departmentId) ? 0 : 1;
      const vb = vozExternaSet.has(b.departmentId) ? 0 : 1;
      if (va !== vb) return va - vb;
    }
    return a.departmentName.localeCompare(b.departmentName);
  });

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="fhr-top-line" />

          {/* Header word-split */}
          <div className="text-center pt-8 pb-4 px-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors z-10"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
              Cobertura
            </h1>
            <h1 className="text-2xl md:text-3xl font-extralight tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              por área
            </h1>

            <div className="flex items-center justify-center gap-3 my-5">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <div className="h-px w-12 bg-white/20" />
            </div>

            <p className="text-sm font-light text-slate-400">
              {coverage.deptosConVoz} de {coverage.totalDeptos}{' '}
              {coverage.totalDeptos === 1 ? 'área' : 'áreas'} con respuesta
              suficiente · {coverage.pctCobertura}% de cobertura
            </p>
          </div>

          {/* Tabla */}
          <div className="px-6 pb-6">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-medium pb-2 border-b border-slate-800/60">
              <div className="col-span-4">Departamento</div>
              <div className="col-span-2 text-right">Dotación</div>
              <div className="col-span-2 text-right">Respuesta</div>
              <div className="col-span-2 text-right">EXO · EIS</div>
              <div className="col-span-2 text-right">Estado</div>
            </div>

            {/* Filas */}
            <div className="divide-y divide-slate-800/40">
              {deptos.map((d) => (
                <DeptoRow
                  key={d.departmentId}
                  d={d}
                  conVozExterna={vozExternaSet.has(d.departmentId)}
                />
              ))}
            </div>

            {/* Footer leyenda */}
            <p className="text-[10px] text-slate-600 leading-relaxed mt-4 italic">
              EXO/EIS = lecturas gold de Onboarding y Exit (12 meses). “—”
              indica sin dato gold para esa área. La alerta indica señal
              externa activa cuando el área no respondió internamente.
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
});

// ════════════════════════════════════════════════════════════════════════════
// FILA — compacta, alineada al header
// ════════════════════════════════════════════════════════════════════════════

function DeptoRow({
  d,
  conVozExterna,
}: {
  d: CoverageDeptItem;
  conVozExterna: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 text-xs">
      <div className="col-span-4 flex items-center gap-1.5 min-w-0">
        <span className="font-light text-slate-200 truncate">
          {d.departmentName}
        </span>
        {conVozExterna && (
          <span className="text-[9px] uppercase tracking-wider text-amber-400 shrink-0">
            · alerta
          </span>
        )}
      </div>
      <div className="col-span-2 text-right font-mono text-slate-400">
        {d.empleadosActivos}
      </div>
      <div className="col-span-2 text-right font-mono text-slate-400">
        {d.invited > 0
          ? `${d.responded}/${d.invited}${d.participationRate !== null ? ` · ${d.participationRate}%` : ''}`
          : '—'}
      </div>
      <div className="col-span-2 text-right font-mono text-slate-500">
        {d.exoScore !== null ? d.exoScore : '—'}
        <span className="text-slate-700"> · </span>
        {d.eisScore !== null ? d.eisScore : '—'}
      </div>
      <div
        className={cn(
          'col-span-2 text-right text-[10px] uppercase tracking-wider',
          STATUS_COLOR[d.analyzed],
        )}
      >
        {STATUS_LABEL[d.analyzed]}
      </div>
    </div>
  );
}
