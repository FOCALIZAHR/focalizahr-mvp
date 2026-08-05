'use client';

// src/app/dashboard/clima/components/planes/ClimaEfectividadView.tsx
// ════════════════════════════════════════════════════════════════════════════
// CÁPSULA 3 — Seguimiento de Efectividad. Este archivo SOLO enruta; no dibuja.
//
// MÁQUINA DE DOS ESTADOS, el patrón de portada de todo Clima:
//
//   'portada'   → ClimaEfectividadPortada    pantalla completa y sola
//        │         (CTA "Ver hallazgos")
//        ▼
//   'hallazgos' → ClimaEfectividadHallazgos  la portada YA NO ESTÁ
//
// La portada se REEMPLAZA, no se apila. Es como funcionan las otras dos:
// `ClimaPlanDeptTab.tsx:44` (`'portada' | 'carrusel' | 'path'`) y
// `ClimaBitacoraView.tsx:118` (`'portada' | 'focos' | 'cierre'`). Llegó a estar
// pegada arriba del contenido como encabezado; Victor lo corrigió (2026-08-05).
//
// ⚠️ `vista` NO se resetea nunca fuera del `useState` inicial. Es la lección que
// ya está escrita en `ClimaBitacoraView.tsx:154-158`: allá un `setVista('portada')`
// dentro del load devolvía al usuario a la portada de golpe cada vez que algo
// re-ejecutaba la carga. Acá el dato llega por prop desde el hub, así que el
// riesgo es el mismo si alguna vez se sincroniza contra `progress`. No hacerlo.
//
// SALIDA — siempre un nivel arriba, nunca dos (predictibilidad, regla de Google
// en la skill): desde la portada se vuelve al hub; desde hallazgos, a la portada.
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ClimaEfectividadPortada from './ClimaEfectividadPortada';
import ClimaEfectividadHallazgos from './ClimaEfectividadHallazgos';
import { HUB_BACK } from '@/lib/constants/climaHubContent';
import type { ClimaPlanesProgressDTO } from '@/types/clima-hub';

interface ClimaEfectividadViewProps {
  /**
   * Lo trae el hub ya resuelto, en vez de volver a pedirlo. El mismo objeto
   * alimenta las tres tarjetas del enrutador y esta portada: dos llamadas al
   * mismo endpoint en una navegación serían dos verdades que pueden diferir si
   * alguien registra entre medio.
   */
  progress: ClimaPlanesProgressDTO | null;
  onBack: () => void;
}

export default function ClimaEfectividadView({ progress, onBack }: ClimaEfectividadViewProps) {
  const [vista, setVista] = useState<'portada' | 'hallazgos'>('portada');

  return (
    <motion.div
      key={vista}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-4xl"
    >
      <button
        onClick={vista === 'portada' ? onBack : () => setVista('portada')}
        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {HUB_BACK}
      </button>

      {vista === 'portada' ? (
        <ClimaEfectividadPortada progress={progress} onEnter={() => setVista('hallazgos')} />
      ) : (
        <ClimaEfectividadHallazgos />
      )}
    </motion.div>
  );
}
