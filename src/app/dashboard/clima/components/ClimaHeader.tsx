'use client';

// src/app/dashboard/clima/components/ClimaHeader.tsx
// Header del Cinema Mode de Clima. Clon de evaluator/cinema/CinemaHeader:
// solo branding. El selector de campaña vive en el Rail (no acá — para no
// empujar/cortar el título del Lobby).

import type { ClimaProductType } from '@/types/clima';

interface ClimaHeaderProps {
  productType: ClimaProductType | null;
}

const PRODUCT_LABEL: Record<ClimaProductType, string> = {
  'pulso-express': 'Pulso Express',
  'experiencia-full': 'Experiencia Full',
};

export default function ClimaHeader({ productType }: ClimaHeaderProps) {
  return (
    <div className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          FocalizaHR
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Clima
        </span>
        {productType && (
          <span className="hidden sm:inline text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
            {PRODUCT_LABEL[productType]}
          </span>
        )}
      </div>
    </div>
  );
}
