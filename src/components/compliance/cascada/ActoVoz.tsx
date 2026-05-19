'use client';

// src/components/compliance/cascada/ActoVoz.tsx
// Acto 2 de la Cascada Ejecutiva — "La Voz". Molde ActoPanorama + fragmentos textuales.

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActSeparator, SubtleLink, fadeIn, fadeInDelay } from './shared';
import type { ComplianceReportResponse } from '@/types/compliance';

interface ActoProps {
  data: ComplianceReportResponse;
  onVerDetalle: () => void;
}

export default memo(function ActoVoz({ data, onVerDetalle }: ActoProps) {
  const acto = data.narratives.cascada?.acto2;
  if (!acto) return null;

  const heroColor =
    acto.estado === 'datos_insuficientes' ? 'text-slate-500' :
    acto.estado === 'sin_patrones' ? 'text-cyan-400' : 'text-amber-400';
  const sano = acto.estado === 'sin_patrones' || acto.estado === 'datos_insuficientes';
  const sepColor = sano ? 'cyan' : 'amber';
  const borderColor = sano ? 'border-cyan-500/30' : 'border-amber-500/30';

  return (
    <>
      <ActSeparator label="La Voz" color={sepColor} />
      <div>
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p className={cn('text-7xl md:text-8xl font-extralight tracking-tight', heroColor)}>
            {acto.numeroAncla}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {acto.subtitulo}
          </p>
        </motion.div>
        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          {acto.fragmentos.length > 0 && (
            <div className="border-l-2 border-amber-500/30 pl-4">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                lo que escribieron — textual
              </span>
              {acto.fragmentos.map((f, i) => (
                <p key={i} className="text-sm italic font-light text-slate-400 mt-1">
                  “{f}”
                </p>
              ))}
            </div>
          )}
          <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center">
            {acto.parrafoGancho}
          </p>
          {acto.coachingTip && (
            <div className={cn('border-l-2 pl-4 mt-6', borderColor)}>
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                {acto.coachingTip}
              </p>
            </div>
          )}
          <div className="text-center pt-2">
            <SubtleLink onClick={onVerDetalle}>Ver los patrones</SubtleLink>
          </div>
        </motion.div>
      </div>
    </>
  );
});
