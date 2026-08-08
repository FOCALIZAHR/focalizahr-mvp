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

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import ClimaEfectividadPortada from './ClimaEfectividadPortada';
import ClimaEfectividadCobertura from './ClimaEfectividadCobertura';
import ClimaEfectividadHallazgos from './ClimaEfectividadHallazgos';
import { HUB_BACK } from '@/lib/constants/climaHubContent';
import type {
  ClimaPlanesProgressDTO,
  ClimaFindingsDTO,
  ClimaNarrativeDTO,
} from '@/types/clima-hub';

interface ClimaEfectividadViewProps {
  /**
   * Lo trae el hub ya resuelto, en vez de volver a pedirlo. El mismo objeto
   * alimenta las tres tarjetas del enrutador y esta portada: dos llamadas al
   * mismo endpoint en una navegación serían dos verdades que pueden diferir si
   * alguien registra entre medio.
   */
  progress: ClimaPlanesProgressDTO | null;
  /**
   * Solo se pasa de largo hasta `Hallazgos`, que pide su propio dato. La portada
   * NO lo recibe: no hace IO, y dárselo la invitaría a hacerlo.
   */
  campaignId: string | null;
  onBack: () => void;
}

export default function ClimaEfectividadView({
  progress,
  campaignId,
  onBack,
}: ClimaEfectividadViewProps) {
  // TRES pantallas, no dos (v3, corrección 1). El CEO navega entre ellas; no
  // scrollea de una a la otra. Cada una responde una pregunta distinta:
  //   portada   → ¿qué pasó con la ejecución? (el gancho)
  //   cobertura → ¿quién registró?
  //   hallazgos → ¿qué dice lo que registraron?
  const [vista, setVista] = useState<'portada' | 'cobertura' | 'hallazgos'>('portada');
  const [findings, setFindings] = useState<ClimaFindingsDTO | null>(null);
  const [narrative, setNarrative] = useState<ClimaNarrativeDTO | null>(null);

  // Los hallazgos se piden ACÁ y no en cada pantalla porque los consumen las DOS:
  // la portada arma su gancho con los conteos (v3 §2, Acto 1) y la pantalla de
  // hallazgos muestra el detalle. Pedirlos dos veces serían dos verdades que
  // pueden diferir si alguien registra entre medio.
  //
  // Se piden al montar la cápsula y no al entrar a hallazgos: la portada los
  // necesita desde el primer render, y es la primera pantalla que se ve.
  useEffect(() => {
    if (!campaignId) {
      setFindings(null);
      setNarrative(null);
      return;
    }
    let cancelled = false;

    // 1. Los conteos, rápido: pintan la portada y el hallazgo con su template.
    (async () => {
      try {
        const res = await fetch(`/api/clima/action-log/findings?campaignId=${campaignId}`);
        const json = await res.json();
        if (!cancelled && json?.success) setFindings(json.data);
      } catch {
        // Silencio: sin hallazgos la portada cae a su texto de cobertura y la
        // pantalla siguiente muestra el Radar. No se levanta un toast.
        if (!cancelled) setFindings(null);
      }
    })();

    // 2. La narrativa, en paralelo y sin bloquear nada. Tarda ~15 s la primera vez
    //    (después la cachea el servidor). Cuando llega, el headline de template se
    //    reemplaza por el de Sonnet. Si nunca llega, el template se queda — y es
    //    correcto, no un estado degradado.
    (async () => {
      try {
        const res = await fetch(`/api/clima/action-log/narrative?campaignId=${campaignId}`);
        const json = await res.json();
        if (!cancelled && json?.success) setNarrative(json.data?.narrative ?? null);
      } catch {
        if (!cancelled) setNarrative(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  return (
    <motion.div
      key={vista}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-4xl"
    >
      {/* Volver = SIEMPRE un nivel arriba, nunca dos (predictibilidad):
          hallazgos → cobertura → portada → hub. */}
      <button
        onClick={
          vista === 'portada'
            ? onBack
            : vista === 'cobertura'
              ? () => setVista('portada')
              : () => setVista('cobertura')
        }
        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {HUB_BACK}
      </button>

      {vista === 'portada' ? (
        <ClimaEfectividadPortada
          progress={progress}
          findings={findings}
          onEnter={() => setVista('cobertura')}
        />
      ) : vista === 'cobertura' ? (
        <ClimaEfectividadCobertura
          campaignId={campaignId}
          onEnter={() => setVista('hallazgos')}
        />
      ) : (
        <ClimaEfectividadHallazgos findings={findings} narrative={narrative} />
      )}
    </motion.div>
  );
}
