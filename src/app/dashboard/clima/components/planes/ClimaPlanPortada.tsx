'use client';

// src/app/dashboard/clima/components/planes/ClimaPlanPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// Portada de "Planes de Acción" (Gate 5D-i) — PORTADA UNIVERSAL.
//
// MOLDE: `executive-hub/.../cascada/CompensationPortada.tsx` (patrón maestro del
// Gate 2 de focalizahr-design). Ritmo: título → dato hero → consecuencia → 1 CTA,
// centrado, SIN split, SIN identidad, SIN ícono.
//
// ⚠️ NO usar `references/executive-portadas.md` como molde acá: ese archivo
// describe el SPOTLIGHT de Cinema Mode (split 35/65 con identidad de persona), que
// es otra cosa. La skill lo dice literal en Gate 1 —"Portada universal: sin
// identidad de persona, sin split"— y usa "Plan de Acción" como su ejemplo textual.
// Ese archivo SÍ es el molde del workspace de categoría (ClimaPathWorkspace), no
// de esta portada. Este error ya se cometió una vez; no repetirlo.
//
// GEOMETRÍA — calibrada contra captura real en 1366x768 (2026-07-20), no a ojo:
//   · La card la limita el shell a `max-w-3xl` (768px) SOLO en portada; el
//     `max-w-5xl` es del Workspace, que lo necesita por su split 35/65. A 1024px
//     esta columna centrada quedaba flotando (texto 512 en card 1024 = 50% de uso).
//   · `max-w-2xl` (672px) de texto dentro de esa card = 87% de uso. Ensanchar además
//     BAJA la altura: los párrafos envuelven en menos líneas.
//   · `py-8 md:py-10` + gaps `mb-4`/`mt-4`/`mt-6`, hero `text-[56px]` y UN solo
//     bloque de texto bajo el hero: el Mandamiento 2 ("Above the Fold = Decisión")
//     manda sobre el aire — el CTA debe verse SIN scroll en 1366x768.
//
// PRESUPUESTO VERTICAL (medido en captura real, no estimado): antes de esta card se
// consumen ~345px de cromo — pestañas+URL (~115), marcadores (~55), header
// FocalizaHR (~90), breadcrumb ClimaHeader (~85), stage p-4/md:p-8 (~32) — más el
// Rail abajo (~50). Por eso el padding NO es el lever principal: si hay que ganar
// altura, recortar COPY (cada línea ≈ 23px) antes que aire. Y si se agranda algo
// acá, re-verificar contra captura real.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';

interface ClimaPlanPortadaProps {
  /** Cantidad de FRENTES (bloques del carrusel con ≥1 caso), NO de casos individuales. */
  frentes: number;
  onEnter: () => void;
}

export default function ClimaPlanPortada({ frentes, onEnter }: ClimaPlanPortadaProps) {
  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-6 py-8 md:px-10 md:py-10 flex flex-col items-center text-center">
        {/* ─── TÍTULO (word-split) ─── */}
        <div className="mb-4">
          <h2 className="text-3xl font-extralight text-white tracking-tight leading-tight">
            Planes de
          </h2>
          <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
            Acción
          </p>
        </div>

        {/* ─── DATO HERO ─── */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[56px] font-extralight text-white leading-[0.9] tabular-nums"
        >
          {frentes}
        </motion.p>

        {/* ─── CONSECUENCIA ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mt-4"
        >
          <p className="text-lg font-light text-slate-400 leading-relaxed mb-3">
            Frentes estratégicos esperando tu intervención.
          </p>
          {/* Bloque único (fusionado 2026-07-20 para recuperar el above-the-fold: eran 2
              párrafos = ~4 líneas, ahora ~2). El cierre es la versión FIEL a lo construido:
              el Seguimiento Focalizado vuelve a medir y ActionEffectivenessService emite el
              veredicto (Gate 5C). NO se promete que un foco sin decisión "vuelve más
              difícil": el carry-forward reactivo es non-goal sellado
              (FavorabilityCalculator.ts:135). */}
          <p className="text-sm font-light text-slate-500 leading-relaxed">
            La plataforma ya cruzó el diagnóstico con intervenciones basadas en evidencia. Tu
            objetivo no es diseñar tácticas, es revisar el sustento y aprobar su ejecución. La
            próxima medición verifica si funcionó.
          </p>
        </motion.div>

        {/* ─── ACCIÓN ÚNICA ─── */}
        <div className="mt-6">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onEnter}>
            Comenzar
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
