'use client';

// src/components/compliance/cascada/ActoAmbiente.tsx
// Acto 1 de la Cascada Ejecutiva — "El Ambiente". Molde: ActoPanorama.tsx (Goals).

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActSeparator, SubtleLink, fadeIn, fadeInDelay } from './shared';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoProps {
  data: ComplianceReportResponse;
  onVerDetalle: () => void;
}

export default memo(function ActoAmbiente({ data, onVerDetalle }: ActoProps) {
  const acto = data.narratives.cascada?.acto1;
  if (!acto) return null;

  const isa = acto.numeroAncla;
  const heroColor =
    isa < 20 ? 'text-violet-400' : isa < 50 ? 'text-amber-400' : 'text-cyan-400';
  const sano = acto.estado === 'sin_riesgo';
  const sepColor = sano ? 'cyan' : 'amber';
  const borderColor = sano ? 'border-cyan-500/30' : 'border-amber-500/30';

  return (
    <>
      <ActSeparator label="El Ambiente" color={sepColor} />
      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className={cn('text-7xl md:text-8xl font-extralight tracking-tight', heroColor)}>
            {isa}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {acto.subtitulo}
          </p>
        </motion.div>
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center">
            {acto.parrafoGancho}
          </p>
          <div className={cn('border-l-2 pl-4 mt-6', borderColor)}>
            <p className="text-sm italic font-light text-slate-300 leading-relaxed">
              {acto.coachingTip}
            </p>
          </div>
          <div className="text-center pt-2">
            <SubtleLink onClick={onVerDetalle}>Ver las gerencias en detalle</SubtleLink>
          </div>
        </motion.div>
      </div>
    </>
  );
});
