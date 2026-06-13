'use client';

// src/components/compliance/cascada/ActoNombre.tsx
// Beat 5 de la Cascada — "El Nombre" · GATE 5.
//
// El beat de la concentración estructural: el deterioro converge en una RAMA
// del organigrama. Toda la lógica + copy viven en `buildElNombre` (pure); el
// componente solo pinta. El informe NO nombra personas — nombra ramas.
//
// Condicional: solo se emite con ≥1 grupo criticalByManager. Hero ÁMBAR
// (#F59E0B); el violeta del legacy MUERE (purple = SOLO IA, regla §7).

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import { buildElNombre } from '@/lib/services/compliance/buildElNombre';
import ElNombreModal from './ElNombreModal';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoNombreProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoNombre({ data }: ActoNombreProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const acto = useMemo(() => buildElNombre(data), [data]);
  if (!acto) return null;

  return (
    <>
      <ActSeparator label="El Nombre" color="amber" />
      <div>
        {/* Hero — # áreas de la rama protagonista (ámbar). */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-amber-500 tabular-nums">
            {acto.n}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            áreas críticas · una misma línea de mando
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto">
          {/* Narrativa CASO 1 — destacado peso 400 blanco + resto. */}
          <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center mb-6">
            <span className="font-normal text-white">{acto.narrativa.destacado}</span>
            {acto.narrativa.resto && <>. {acto.narrativa.resto}</>}
          </p>

          {/* Postura editorial. */}
          <p className="text-sm font-light text-slate-400 leading-relaxed text-center mb-6 max-w-xl mx-auto">
            {acto.postura}
          </p>

          {/* Factorización + link al modal — solo con ramas secundarias. */}
          {acto.factorizacion && (
            <p className="text-sm font-light text-slate-400 leading-relaxed text-center mb-6">
              {acto.factorizacion.texto}
              {' · '}
              <button
                onClick={() => setModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {acto.factorizacion.link}
              </button>
            </p>
          )}

          {/* Cierre cursiva. */}
          <p className="text-sm italic font-light text-slate-400 leading-relaxed text-center mt-2">
            {acto.cierre}
          </p>
        </motion.div>
      </div>

      {/* Modal de ramas secundarias. */}
      {modalOpen && acto.factorizacion && (
        <ElNombreModal blocks={acto.factorizacion.modal} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
});
