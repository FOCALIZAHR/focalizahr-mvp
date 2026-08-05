'use client';

// src/app/dashboard/clima/components/planes/ClimaPlanesHub.tsx
// ════════════════════════════════════════════════════════════════════════════
// HUB de Planes de Acción (H1.3). Lo que la card `planes` del Rail abre ahora.
// Tres mundos, no tres tabs: cada cápsula es una audiencia distinta y una vista
// completa e independiente.
//
//   1. Planes       → ClimaPlanesView   (RRHH: aprobación y cobertura)
//   2. Bitácora     → ClimaBitacoraView (el jefe: qué hizo con sus focos)
//   3. Efectividad  → H2/H3 (inteligencia sobre el cruce de ambas)
//
// ⚠️ NI ClimaPlanesView NI ClimaBitacoraView se modifican. Se montan con el
// contrato de props que YA exponían (`campaignId`, `onBack`) — el mismo en las
// dos, por casualidad afortunada. Lo único que cambia es a dónde vuelve `onBack`:
// antes al Lobby, ahora al hub. Un nivel arriba, que es lo que el usuario espera.
//
// PATRÓN (Gate 1 de focalizahr-design): Portada universal + selector de caminos
// (Rail-menú variante B, renderizado en el stage). NO es Smart Router: un Smart
// Router sugiere UNA acción siguiente, y acá las tres son deliberadamente
// equivalentes (plan maestro §1.3: "es navegación, no embudo").
//
// MOLDE VISUAL: `ClimaPlanPortada.tsx`, cuyo presupuesto vertical está calibrado
// contra captura real en 1366x768 (~345px de cromo + 50px de Rail). Por eso el
// hero es `text-[56px]` y no `text-[72px]`, y el padding es `py-8 md:py-10`: las
// tres tarjetas y sus CTA tienen que verse SIN scroll.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SecondaryButton } from '@/components/ui/PremiumButton';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import ClimaPlanesView from './ClimaPlanesView';
import ClimaBitacoraView from '../bitacora/ClimaBitacoraView';
import {
  HUB_TITLE,
  HUB_PROGRESS_LABEL,
  HUB_PROGRESS_EMPTY,
  HUB_CAPSULAS,
  HUB_CTA,
  HUB_BACK,
  HUB_EFECTIVIDAD_PENDIENTE,
  hubProgressCaption,
} from '@/lib/constants/climaHubContent';
import type { ClimaPlanesCapsula, ClimaPlanesProgressDTO } from '@/types/clima-hub';

interface ClimaPlanesHubProps {
  campaignId: string | null;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Barra de progreso.
//
// El relleno lleva SIEMPRE el gradiente de marca (cyan→violeta), nunca un color
// según el valor. Un 12% en rojo y un 81% en verde convertirían la barra en un
// semáforo, que es anti-patrón explícito del proyecto: la severidad la canta el
// número, no el cromo. Y acá ni siquiera hay severidad — es un conteo.
// ─────────────────────────────────────────────────────────────────────────────
function HubProgress({ progress }: { progress: ClimaPlanesProgressDTO | null }) {
  const hasData = !!progress && progress.total > 0;

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
          {HUB_PROGRESS_LABEL}
        </span>
        {hasData && (
          <span className="text-[28px] md:text-[32px] font-extralight text-white tabular-nums leading-none">
            {progress!.pct}
            <span className="text-base text-slate-500 ml-0.5">%</span>
          </span>
        )}
      </div>

      {/* Riel. `h-1.5` y no más: es contexto, no el protagonista de la pantalla. */}
      <div className="h-1.5 w-full rounded-full bg-slate-800/60 overflow-hidden">
        {hasData && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress!.pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #22D3EE 0%, #A78BFA 100%)' }}
          />
        )}
      </div>

      <p className="text-sm font-light text-slate-400 leading-relaxed mt-2">
        {hasData
          ? hubProgressCaption(progress!.withAction, progress!.total)
          : HUB_PROGRESS_EMPTY}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta de cápsula. Las tres son idénticas en peso visual: mismo borde, mismo
// fondo, mismo botón. Ninguna es "la principal" — por eso el CTA es Secondary en
// las tres y no hay ni un Primary en la pantalla. El hub no empuja a ningún lado.
// ─────────────────────────────────────────────────────────────────────────────
function CapsulaCard({
  badge,
  title,
  description,
  onEnter,
  delay,
}: {
  badge: string;
  title: string;
  description: string;
  onEnter: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col rounded-xl border border-slate-800/40 bg-slate-900/40 p-4 md:p-5 text-left"
    >
      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-500 mb-2">
        {badge}
      </span>
      <h3 className="text-base font-light text-white leading-tight mb-1.5">{title}</h3>
      <p className="text-[13px] font-light text-slate-400 leading-relaxed mb-4 flex-1">
        {description}
      </p>
      <div>
        <SecondaryButton icon={ArrowRight} iconPosition="right" onClick={onEnter}>
          {HUB_CTA}
        </SecondaryButton>
      </div>
    </motion.div>
  );
}

export default function ClimaPlanesHub({ campaignId, onBack }: ClimaPlanesHubProps) {
  const [capsula, setCapsula] = useState<ClimaPlanesCapsula | null>(null);
  const [progress, setProgress] = useState<ClimaPlanesProgressDTO | null>(null);

  const backToHub = useCallback(() => setCapsula(null), []);

  // El progreso se pide una vez por campaña. No se refresca al volver de una
  // cápsula: si el jefe acaba de registrar algo en la Bitácora, el número queda
  // desactualizado hasta recargar. Es deliberado — refrescar acá obligaría a la
  // Bitácora a avisarle al hub, y la Bitácora no se toca (plan maestro §8.2).
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
        // Silencio a propósito: el progreso es contexto, no el contenido. Si no
        // carga, el hub sigue siendo navegable y muestra el estado sin datos. No
        // se levanta un toast por un dato accesorio.
        if (!cancelled) setProgress(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // ── Cápsulas 1 y 2: vistas completas ya construidas, montadas sin modificar ──
  if (capsula === 'planes') {
    return <ClimaPlanesView campaignId={campaignId} onBack={backToHub} />;
  }
  if (capsula === 'bitacora') {
    return <ClimaBitacoraView campaignId={campaignId} onBack={backToHub} />;
  }

  // ── Cápsula 3: su gate propio (H2/H3). Sin lenguaje de roadmap: se nombra la
  //    condición del negocio que falta, no la pantalla que falta construir. ──
  if (capsula === 'efectividad') {
    return (
      <div className="w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <TeslaLine />
          <div className="mb-6">
            <button
              onClick={backToHub}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {HUB_BACK}
            </button>
          </div>
          <FHREmptyState
            type="pending"
            title={HUB_EFECTIVIDAD_PENDIENTE.title}
            description={HUB_EFECTIVIDAD_PENDIENTE.description}
          />
        </div>
      </div>
    );
  }

  // ── El hub ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
        <TeslaLine />

        <div className="px-4 py-6 md:px-10 md:py-10">
          {/* Salida del hub — discreta, mismo tratamiento que el breadcrumb de
              ClimaPlanesView para que "volver" se vea igual en todo el módulo. */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors text-[11px] font-light mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {HUB_BACK}
          </button>

          <div className="flex flex-col items-center text-center">
            {/* ─── TÍTULO (word-split) ─── */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-extralight text-white tracking-tight leading-tight">
                {HUB_TITLE.first}
              </h2>
              <p className="text-lg md:text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
                {HUB_TITLE.second}
              </p>
            </div>

            {/* ─── PROGRESO — lo primero que se lee (plan maestro §1.3) ─── */}
            <HubProgress progress={progress} />
          </div>

          {/* ─── LAS TRES CÁPSULAS ───
              320px: apiladas. Desde md: tres columnas de peso idéntico. */}
          <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4', 'mt-8')}>
            {HUB_CAPSULAS.map((c, i) => (
              <CapsulaCard
                key={c.id}
                badge={c.badge}
                title={c.title}
                description={c.description}
                onEnter={() => setCapsula(c.id)}
                delay={0.1 + i * 0.06}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Firma de marca. Nunca cambia de color según el contenido (plan maestro §6). */
function TeslaLine() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[2px]"
      style={{
        background:
          'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
        opacity: 0.7,
      }}
    />
  );
}
