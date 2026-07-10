'use client';

// src/app/dashboard/clima/components/ClimaSubproductoScaffold.tsx
// ════════════════════════════════════════════════════════════════════════════
// PROVISIONAL — andamio de vista de subproducto. Puente del incremento (A)+(B):
// el Rail ya rutea a las 4 cards, pero las vistas reales de Análisis (D),
// Ranking (E) y Dimensiones (C) se construyen en incrementos siguientes. Cada
// una REEMPLAZA este andamio en su propia card. Cascada NO usa este andamio
// (re-arma la secuencia intro sobre el Lobby).
//
// Sin lenguaje de roadmap: solo el nombre del módulo + volver. Tokens canónicos
// (CompensationPortada). El contenido/narrativa definitiva la escribe Victor/IA.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { SecondaryButton } from '@/components/ui/PremiumButton';
import { climaSubproductoLabel } from '@/lib/constants/climaSubproductos';
import type { ClimaSubproducto } from '@/types/clima';

interface ClimaSubproductoScaffoldProps {
  subproducto: ClimaSubproducto;
  onBack: () => void;
}

export default function ClimaSubproductoScaffold({
  subproducto,
  onBack,
}: ClimaSubproductoScaffoldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-4xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm px-6 py-14 md:px-10 md:py-20">
        {/* Línea Tesla */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />

        <div className="flex flex-col items-center gap-6 text-center">
          <SecondaryButton icon={ArrowLeft} iconPosition="left" onClick={onBack}>
            Volver
          </SecondaryButton>

          <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
            <span className="fhr-title-gradient">{climaSubproductoLabel(subproducto)}</span>
          </h2>
        </div>
      </div>
    </motion.div>
  );
}
