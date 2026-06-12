'use client';

// src/components/compliance/cascada/TriageDetailModal.tsx
// Beat 2 · GATE 2b — el modal "ver más" del Triage.
//
// Lenguaje cascada (MISMO que el acto): Tesla line por familia, kickers, prosa,
// líneas tipográficas. PROHIBIDO cards/grids/barras/banners — la composición del
// score se NARRA, no se grafica. Chrome clonado del patrón canónico
// `GoalsCorrelation/GoalsFindingModal` (portal a document.body).
//
// Dos modos (buildTriageModal decide por count del grupo):
//   - individual (1 gerencia): estructura §2b completa.
//   - grupo (N gerencias): veredicto del tipo UNA vez + bloques compactos.

import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './shared';
import { formatDepartmentName } from '@/lib/utils/formatName';
import {
  buildTriageModal,
  SCORE_SCALE_INFO,
  type ModalDeptLine,
  type ModalGerenciaBlock,
} from '@/lib/services/compliance/buildTriageModal';
import type { TriageFamily, TriageLecturaKey } from '@/lib/services/compliance/buildTriageGroups';
import type { ComplianceReportResponse } from '@/types/compliance';

interface TriageDetailModalProps {
  data: ComplianceReportResponse;
  lecturaKey: TriageLecturaKey;
  onClose: () => void;
}

// Color por familia — único portador de severidad.
const FAMILY_TEXT: Record<TriageFamily, string> = {
  FUEGO: 'text-red-400',
  HUMO: 'text-amber-400',
  PUNTO_CIEGO: 'text-slate-400',
  CONFIABLE: 'text-cyan-400',
};
const FAMILY_HEX: Record<TriageFamily, string> = {
  FUEGO: '#F87171',
  HUMO: '#FBBF24',
  PUNTO_CIEGO: '#94A3B8',
  CONFIABLE: '#22D3EE',
};

/** Línea tipográfica de un sub-departamento: {Depto} · {score} {familia}. */
function DeptLine({ d }: { d: ModalDeptLine }) {
  return (
    <p className="text-sm leading-relaxed tabular-nums">
      <span className="font-medium text-slate-200">
        {formatDepartmentName(d.departmentName)}
      </span>
      <span className={cn('font-light', d.family ? FAMILY_TEXT[d.family] : 'text-slate-500')}>
        {' · '}
        {d.score}
        {d.familyLabel ? ` ${d.familyLabel}` : ''}
      </span>
    </p>
  );
}

/** Score narrado. En individual: ⓘ con la línea de escala (no los drivers) +
 *  drivers VISIBLES como texto fino debajo (decisión Victor #2). */
function ScoreLine({
  block,
  family,
  withInfo,
}: {
  block: ModalGerenciaBlock;
  family: TriageFamily;
  withInfo: boolean;
}) {
  return (
    <div>
      <p className="text-sm leading-relaxed">
        <span className={cn('text-3xl font-extralight tabular-nums', FAMILY_TEXT[family])}>
          {block.score}
        </span>
        <span className="text-slate-400 font-light">
          {' de riesgo — '}
          {block.scoreNarrada}
        </span>
        {withInfo && (
          <Tooltip content={SCORE_SCALE_INFO}>
            <span className="ml-1.5 text-[10px] text-slate-600 align-super cursor-help">ⓘ</span>
          </Tooltip>
        )}
      </p>
      {/* Drivers — texto fino bajo el score (§2b-3, solo individual). */}
      {withInfo && block.drivers && (
        <p className="text-xs font-light text-slate-500 leading-relaxed mt-1.5">
          {block.drivers}
        </p>
      )}
    </div>
  );
}

export default memo(function TriageDetailModal({
  data,
  lecturaKey,
  onClose,
}: TriageDetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const modal = buildTriageModal(data, lecturaKey);
  if (!modal) return null;

  const teslaColor = FAMILY_HEX[modal.family];
  const isIndividual = modal.mode === 'individual';
  const headBlock = modal.blocks[0];

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg max-h-[82vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Tesla line — color por familia */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${teslaColor}, transparent)`,
            boxShadow: `0 0 20px ${teslaColor}`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="min-w-0">
            {isIndividual ? (
              <p className="text-lg font-light text-slate-100 truncate">
                {formatDepartmentName(headBlock.gerenciaName)}
              </p>
            ) : (
              <p className="text-lg font-light text-slate-100">El detalle del grupo</p>
            )}
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
              {modal.kicker}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="p-6 pt-4 overflow-y-auto max-h-[calc(82vh-92px)]">
          {isIndividual ? (
            // ── MODAL INDIVIDUAL — estructura §2b completa ──
            <div className="space-y-5">
              <ScoreLine block={headBlock} family={modal.family} withInfo />

              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                  Lo que declararon
                </p>
                <p className="text-sm font-light text-slate-300 leading-relaxed">
                  {headBlock.declararon}
                </p>
              </div>

              {headBlock.senales && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                    Lo que las señales dicen
                  </p>
                  <p className="text-sm font-light text-slate-300 leading-relaxed">
                    {headBlock.senales}
                  </p>
                </div>
              )}

              {/* Hairline → veredicto verbatim */}
              <div className="border-t border-slate-800/40 pt-4">
                <p className="text-sm font-light text-slate-300 leading-relaxed">
                  {modal.veredicto}
                </p>
              </div>

              {headBlock.departamentos.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                    Sus departamentos
                  </p>
                  <div className="space-y-1.5">
                    {headBlock.departamentos.map((d) => (
                      <DeptLine key={d.departmentId} d={d} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ── MODAL DE GRUPO — veredicto UNA vez + bloques compactos ──
            <div className="space-y-6">
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {modal.veredicto}
              </p>
              {modal.blocks.map((b) => (
                <div key={b.gerenciaId} className="border-t border-slate-800/40 pt-4">
                  <p className="text-base font-light text-slate-100 mb-1">
                    {formatDepartmentName(b.gerenciaName)}
                  </p>
                  <ScoreLine block={b} family={modal.family} withInfo={false} />
                  {b.departamentos.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {b.departamentos.map((d) => (
                        <DeptLine key={d.departmentId} d={d} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pie cursiva (§2b-8) */}
          <p className="text-[11px] italic font-light text-slate-500 leading-relaxed mt-6 pt-4 border-t border-slate-800/30">
            {modal.pie}
          </p>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(content, document.body);
});
