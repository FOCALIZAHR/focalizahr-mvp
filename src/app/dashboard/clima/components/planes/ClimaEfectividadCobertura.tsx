'use client';

// src/app/dashboard/clima/components/planes/ClimaEfectividadCobertura.tsx
// ════════════════════════════════════════════════════════════════════════════
// PANTALLA 2 de la Cápsula 3 — LA COBERTURA (quién registró).
//
// Se separó de los hallazgos (v3, corrección 1): son dos preguntas distintas y el
// CEO NAVEGA de una a la otra, no scrollea. Antes convivían en una sola pantalla
// con un corte visual entre medio, y eso trajo un efecto que no se veía venir:
// quedaban DOS paneles izquierdos con un número grande cada uno —los días acá, los
// registros allá— compitiendo por la misma mirada. El de abajo ganaba. Separadas,
// cada panel manda en su pantalla.
//
// LAYOUT 30/70 — mismo patrón que el resto de la cápsula:
//   30% · Pulso de Actividad: el TIEMPO como dato protagonista.
//   70% · título word-split + las cards de gerencia con su anillo.
//
// ⛔ EL DATO DEL PULSO ES "HACE CUÁNTO SE REGISTRÓ", no "hace cuánto se aprobó"
// (cambio 2026-08-08). La antigüedad del plan es un número muerto: sube uno por
// día pase lo que pase, y a los 90 días dice lo mismo si el equipo registró ayer
// o nunca. El último registro sí responde la pregunta de esta pantalla — si esto
// sigue vivo. Ni las cards ni la portada lo muestran en ningún otro lado.
//
// CIERRE: un CTA que lleva a los hallazgos (Mandamiento 9 — ninguna pantalla deja
// al usuario sin camino).
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gauge, ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import ClimaCoberturaGerencias from './ClimaCoberturaGerencias';
import {
  COBERTURA_TITLE,
  COBERTURA_TITULO,
  COBERTURA_NARRATIVA,
  COBERTURA_SUB,
  COBERTURA_CTA,
  PULSO_SIN_FECHA,
  pulsoDiasLabel,
  pulsoActividad,
} from '@/lib/constants/climaHubContent';
import type { ClimaCoberturaDTO } from '@/types/clima-hub';

/** Identidad de la Cápsula 3 — el mismo verde de su tarjeta en el hub. */
const ACCENT = '#10B981';

export default function ClimaEfectividadCobertura({
  campaignId,
  onEnter,
}: {
  campaignId: string | null;
  /** Avanza a la pantalla de hallazgos. */
  onEnter: () => void;
}) {
  const [cobertura, setCobertura] = useState<ClimaCoberturaDTO | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setCobertura(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/clima/action-log/coverage?campaignId=${campaignId}`);
        const json = await res.json();
        if (!cancelled && json?.success) setCobertura(json.data);
      } catch {
        // Silencio: la pantalla sigue siendo navegable sin el dato de contexto.
        if (!cancelled) setCobertura(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const units = cobertura?.units ?? [];
  const hasUnits = units.length > 0;

  // Días desde el ÚLTIMO REGISTRO, no desde la aprobación (cambio 2026-08-08).
  // La antigüedad del plan no se mueve: a los 17 días dice 17 y mañana 18, escriba
  // alguien o no. Este número sí responde la pregunta de la pantalla — si el
  // equipo sigue registrando o se apagó.
  // Se trunca hacia abajo: escribir hace tres horas es "hoy", no "1 día".
  const diasUltimoRegistro =
    cobertura?.lastEntryAt != null
      ? Math.max(0, Math.floor((Date.now() - new Date(cobertura.lastEntryAt).getTime()) / 86_400_000))
      : null;

  const unidadesConActividad = units.filter((u) => u.withAction > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm"
    >
      {/* Tesla line — firma de marca, no cambia con el contenido. */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-5 md:gap-8">
          {/* ═══ 30% — PULSO DE ACTIVIDAD ═══ */}
          <div className="flex flex-col">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${ACCENT}15` }}
            >
              <Gauge className="w-5 h-5" style={{ color: ACCENT }} />
            </div>

            <h3 className="text-base font-light text-white leading-tight">{COBERTURA_TITLE}</h3>

            {/* El TIEMPO como protagonista. En blanco y de tamaño fijo — el tiempo
                no es un semáforo. */}
            {diasUltimoRegistro !== null ? (
              <>
                <p className="text-[44px] font-extralight text-white leading-[0.9] tabular-nums mt-3">
                  {diasUltimoRegistro === 0 ? '—' : diasUltimoRegistro}
                </p>
                <p className="text-[11px] font-light text-slate-500 mt-1">
                  {pulsoDiasLabel(diasUltimoRegistro)}
                </p>
              </>
            ) : (
              // Sin ninguna entrada: el estado, sin número inventado.
              <p className="text-sm font-light text-slate-500 mt-3">{PULSO_SIN_FECHA}</p>
            )}

            <p className="text-[13px] font-light text-slate-400 leading-relaxed mt-4">
              {pulsoActividad(unidadesConActividad, units.length)}
            </p>

            {/* Qué NO es este dato. Sin esta línea, un 0% se lee como "fracasaron". */}
            <p className="text-[11px] font-light text-slate-600 leading-relaxed mt-2">
              {COBERTURA_SUB}
            </p>
          </div>

          {/* ═══ 70% — LAS GERENCIAS ═══ */}
          <div>
            {/* Título word-split canónico (skill, "Word Split en Títulos"):
                primera parte en blanco extralight, segunda en fhr-title-gradient.
                Mismo patrón que "Seguimiento de Efectividad" en la portada.
                🕐 Acá había un micro-rótulo "3 UNIDADES CON FOCOS" en 9px, que
                titulaba con un conteo — el conteo es dato, no título. */}
            <div className="mb-4">
              <h3 className="text-2xl font-extralight text-white tracking-tight leading-tight">
                {COBERTURA_TITULO.first}{' '}
                <span className="fhr-title-gradient">{COBERTURA_TITULO.second}</span>
              </h3>
              <p className="text-base font-light text-slate-400 leading-relaxed mt-1.5">
                {COBERTURA_NARRATIVA}
              </p>
            </div>

            {hasUnits ? (
              <ClimaCoberturaGerencias units={units} />
            ) : (
              <div className="rounded-xl border border-slate-800/30 bg-slate-900/30 p-4">
                <p className="text-xs text-slate-600 font-light">
                  Todavía no hay focos aprobados en esta medición.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── CIERRE: hacia los hallazgos ─── */}
        <div className="flex justify-center mt-8">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onEnter}>
            {COBERTURA_CTA}
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}
