'use client';

// src/components/compliance/cascada/ElNombreModal.tsx
// Beat 5 · GATE 5 — modal "Ver el detalle" de las ramas secundarias.
//
// Chrome heredado de CascadaModalShell (Tesla line ámbar). Bloques compactos
// por rama: gerencia (unidad organizacional, NO persona) + sus sub-deptos.

import { memo } from 'react';
import CascadaModalShell from './CascadaModalShell';
import { formatDepartmentName } from '@/lib/utils/formatName';
import type { ElNombreModalBlock } from '@/lib/services/compliance/buildElNombre';

interface ElNombreModalProps {
  blocks: ElNombreModalBlock[];
  onClose: () => void;
}

const TESLA_AMBER = '#F59E0B';

export default memo(function ElNombreModal({ blocks, onClose }: ElNombreModalProps) {
  const header = (
    <>
      <p className="text-lg font-light text-slate-100">Otras líneas de mando</p>
      <p className="text-[11px] text-slate-500 mt-1">
        El mismo patrón estructural, en otras ramas del organigrama.
      </p>
    </>
  );

  return (
    <CascadaModalShell teslaColor={TESLA_AMBER} header={header} onClose={onClose}>
      <div className="space-y-6">
        {blocks.map((b, i) => (
          <div key={`rama-${i}`} className="border-t border-slate-800/40 pt-4 first:border-0 first:pt-0">
            <p className="text-base font-light text-slate-100 mb-2">
              {formatDepartmentName(b.gerencia)}
            </p>
            <div className="space-y-1">
              {b.deptNames.map((d, j) => (
                <p key={`dept-${j}`} className="text-sm font-light text-slate-300 leading-relaxed">
                  {d}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CascadaModalShell>
  );
});
