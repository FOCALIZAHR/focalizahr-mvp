'use client';

// src/components/compliance/cascada/ActoNombre.tsx
// Beat 5 de la Cascada — "El Nombre".
//
// Lee `data.narratives.criticalByManagerNarrativa` (generada por
// `buildCriticalByManagerNarrative` en ComplianceNarrativeEngine, copy VERBATIM
// Victor). El endpoint la pone en `undefined` para AREA_MANAGER (RBAC); este
// componente se oculta también con narrativa vacía.
//
// Mantiene los 4 elementos canónicos de los Actos: ActSeparator + ancla
// numérica + narrativa central + (sin coaching tip — el "nombre" es declarativo).

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoNombreProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoNombre({ data }: ActoNombreProps) {
  const narrativa = data.narratives.criticalByManagerNarrativa;
  const criticalByManager = data.data.convergencia?.criticalByManager ?? [];

  // Guard: AREA_MANAGER (endpoint envía undefined) + cero grupos críticos.
  if (!narrativa || criticalByManager.length === 0) return null;

  // Conteo del ancla: # de líneas de mando críticas (NO # de deptos).
  const numLineasMando = criticalByManager.length;

  return (
    <>
      <ActSeparator label="El Nombre" color="purple" />
      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className="text-7xl md:text-8xl font-extralight tracking-tight text-violet-400">
            {numLineasMando}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {numLineasMando === 1
              ? 'línea de mando concentra el riesgo'
              : 'líneas de mando concentran el riesgo'}
          </p>
        </motion.div>
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center">
            {narrativa}
          </p>
        </motion.div>
      </div>
    </>
  );
});
