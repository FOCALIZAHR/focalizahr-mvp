'use client';

// src/app/dashboard/clima/components/planes/ClimaPlanesHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// HUB de Planes de Acción (H1.3). Lo que la card `planes` del Rail abre ahora.
// Tres mundos, no tres tabs: cada cápsula es una audiencia distinta y una vista
// completa e independiente.
//
//   1. Planes       → ClimaPlanesView      (RRHH: aprobación y cobertura)
//   2. Bitácora     → ClimaBitacoraView    (el jefe: qué hizo con sus focos)
//   3. Efectividad  → ClimaEfectividadView (inteligencia sobre el cruce)
//
// ⚠️ NI ClimaPlanesView NI ClimaBitacoraView se modifican. Se montan con el
// contrato de props que YA exponían (`campaignId`, `onBack`). Lo único que cambia
// es a dónde vuelve `onBack`: antes al Lobby, ahora al hub. Un nivel arriba.
//
// ════════════════════════════════════════════════════════════════════════════
// MOLDE: `src/components/performance/summary/SummaryHub.tsx` — "Las 3 Puertas"
// (Diagnóstico · Conversación · Desarrollo) de Evaluaciones. Es el molde que Tab 1
// de Clima declara clonar en `ClimaPathCarousel.tsx:5`, y son literalmente tres
// cards en `grid-cols-1 md:grid-cols-3`: el mismo problema que este hub.
//
// Se clona la card entera, token por token (SummaryHub.tsx:87-152):
//   · `motion.button` — `relative p-6 rounded-2xl border text-left`
//     `bg-[#0F172A]/60 backdrop-blur-md` + `border-slate-800 hover:border-slate-700`
//   · `whileHover={{ scale: 1.02, y: -4 }}` · `whileTap={{ scale: 0.98 }}`
//   · Tesla line por card: `absolute top-0 left-4 right-4 h-[2px] rounded-t-2xl`
//   · Ícono: `w-10 h-10 rounded-xl` con fondo `${color}15`, ícono `w-5 h-5`
//   · Badge: `text-[10px] font-bold uppercase tracking-wider`, en el color
//   · Tagline: `text-sm text-slate-300 font-medium mb-3`
//   · Métrica: `text-lg font-bold text-white` + etiqueta `text-xs text-slate-500`
//
// ⚠️ `bg-[#0F172A]/60` es deliberado y NO es el token prohibido de compliance:
// ese es `bg-[#0F172A]/90` con `backdrop-blur-2xl` y `rounded-[20px]`. Acá se usa
// el valor exacto de las DOS referencias que Victor nombró (SummaryHub.tsx:93 y
// ClimaPathCarousel.tsx:97). Copiar el molde y después "corregirlo" a otro token
// daría una tercera variante, que es justo lo que la regla busca evitar.
//
// ÚNICO DESVÍO DEL MOLDE, deliberado: el estado sin métrica va en `text-slate-500`
// y no en el `text-amber-400/80` del original (SummaryHub.tsx:147). "Pendiente de
// medición" no es una advertencia — es que todavía no cerró la siguiente campaña.
// En ámbar leería como problema, y eso es el semáforo que el proyecto prohíbe.
//
// SIN BOTONES "Entrar" y SIN barra de progreso arriba (correcciones de Victor,
// 2026-08-05): esto es un enrutador. La tarjeta entera es el destino, y la métrica
// de cobertura es de la Cápsula 3, no del hub.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClimaPlanesView from './ClimaPlanesView';
import ClimaBitacoraView from '../bitacora/ClimaBitacoraView';
import ClimaEfectividadView from './ClimaEfectividadView';
import {
  HUB_TITLE,
  HUB_CAPSULAS,
  HUB_BACK,
  CAPSULA_EFECTIVIDAD_SIN_MEDICION,
  capsulaPlanesMetric,
  capsulaBitacoraMetric,
  capsulaEfectividadMetric,
} from '@/lib/constants/climaHubContent';
import type { ClimaPlanesCapsula, ClimaPlanesProgressDTO } from '@/types/clima-hub';

interface ClimaPlanesHubProps {
  campaignId: string | null;
  onBack: () => void;
}

/**
 * Dato protagonista de cada tarjeta. Sale del MISMO objeto para las tres, así que
 * los tres números son consistentes entre sí por construcción.
 *
 * `null` = todavía no cargó, o no hay plan aprobado. La tarjeta se muestra igual,
 * sin número: el enrutador tiene que funcionar aunque la métrica no llegue.
 */
function metricFor(
  id: ClimaPlanesCapsula,
  p: ClimaPlanesProgressDTO | null
): { value: string; label: string } | { fallback: string } | null {
  if (!p || p.total === 0) return null;
  if (id === 'planes') return capsulaPlanesMetric(p.total);
  if (id === 'bitacora') return capsulaBitacoraMetric(p.withAction, p.total);
  return p.measured > 0
    ? capsulaEfectividadMetric(p.measured, p.total)
    : { fallback: CAPSULA_EFECTIVIDAD_SIN_MEDICION };
}

export default function ClimaPlanesHub({ campaignId, onBack }: ClimaPlanesHubProps) {
  const [capsula, setCapsula] = useState<ClimaPlanesCapsula | null>(null);
  const [progress, setProgress] = useState<ClimaPlanesProgressDTO | null>(null);

  const backToHub = useCallback(() => setCapsula(null), []);

  // Una sola llamada para las tres tarjetas Y para la portada de Efectividad, que
  // la recibe por prop. Dos fetch del mismo endpoint en la misma navegación serían
  // dos verdades que pueden diferir si alguien registra entre medio.
  useEffect(() => {
    if (!campaignId) {
      setProgress(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/clima/action-log/summary?campaignId=${campaignId}`);
        const json = await res.json();
        if (!cancelled && json?.success) setProgress(json.data);
      } catch {
        // Silencio a propósito: la métrica es contexto, no el contenido. Sin ella
        // el hub sigue enrutando. No se levanta un toast por un dato accesorio.
        if (!cancelled) setProgress(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // ── Las tres cápsulas: vistas completas, cada una con su propio chrome ──
  if (capsula === 'planes') {
    return <ClimaPlanesView campaignId={campaignId} onBack={backToHub} />;
  }
  if (capsula === 'bitacora') {
    return <ClimaBitacoraView campaignId={campaignId} onBack={backToHub} />;
  }
  if (capsula === 'efectividad') {
    return <ClimaEfectividadView progress={progress} onBack={backToHub} />;
  }

  // ── El enrutador ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
        {/* Línea Tesla del shell — firma de marca, nunca cambia según contenido. */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
            opacity: 0.7,
          }}
        />

        <div className="px-4 py-6 md:px-10 md:py-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {HUB_BACK}
          </button>

          {/* ─── TÍTULO (word-split) ─── */}
          <div className="flex flex-col items-center text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
              {HUB_TITLE.first}
            </h2>
            <p className="text-lg md:text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
              {HUB_TITLE.second}
            </p>
          </div>

          {/* ─── LAS 3 PUERTAS ───
              320px: apiladas y legibles. Desde md: tres columnas de peso idéntico.
              `items-stretch` para que las tres midan igual aunque su tagline tenga
              distinto largo. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {HUB_CAPSULAS.map((c, idx) => {
              const Icon = c.icon;
              const metric = metricFor(c.id, progress);

              return (
                <motion.button
                  key={c.id}
                  onClick={() => setCapsula(c.id)}
                  className={cn(
                    'relative p-6 rounded-2xl border transition-all text-left',
                    'bg-[#0F172A]/60 backdrop-blur-md',
                    'border-slate-800 hover:border-slate-700 cursor-pointer',
                    'focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50'
                  )}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.1 }}
                >
                  {/* Línea Tesla de la card — en el color de identidad de la cápsula */}
                  <div
                    className="absolute top-0 left-4 right-4 h-[2px] rounded-t-2xl"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`,
                    }}
                  />

                  {/* Ícono en círculo con fondo del propio color al 15% */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${c.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>

                  {/* Badge de misión */}
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider mb-1"
                    style={{ color: c.color }}
                  >
                    {c.badge}
                  </p>

                  {/* Tagline */}
                  <p className="text-sm text-slate-300 font-medium mb-3">{c.description}</p>

                  {/* Dato protagonista, o el estado cuando todavía no hay número */}
                  {metric && 'value' in metric ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-white tabular-nums">
                        {metric.value}
                      </span>
                      <span className="text-xs text-slate-500">{metric.label}</span>
                    </div>
                  ) : metric ? (
                    <p className="text-xs text-slate-500 leading-relaxed">{metric.fallback}</p>
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
