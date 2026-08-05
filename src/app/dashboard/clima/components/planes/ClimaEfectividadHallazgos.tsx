'use client';

// src/app/dashboard/clima/components/planes/ClimaEfectividadHallazgos.tsx
// ════════════════════════════════════════════════════════════════════════════
// CONTENIDO de la Cápsula 3 — la pantalla a la que lleva el CTA de la portada.
//
// PANTALLA APARTE, no un bloque debajo: cuando esto se ve, la portada ya no está
// (máquina de estados en `ClimaEfectividadView`).
//
// ── LAYOUT 30/70 ─────────────────────────────────────────────────────────────
// Reja porcentual `grid-cols-1 md:grid-cols-[30%_70%]`, el idioma de
// `executive-hub/.../EvaluadorHeatmap.tsx:443` (que usa 40/60 para su master-detail).
// Estructura del split tomada de `RoleFitDisplayCard.tsx:292` — identidad a la
// izquierda, contenido a la derecha.
//
// ⚠️ De `RoleFitDisplayCard` se clona la ESTRUCTURA, no su chrome exterior: esa
// card usa `bg-[#0F172A]/90 backdrop-blur-2xl rounded-[24px]`, que son los tokens
// que `.claude/rules/frontend-design.md` marca como deuda del módulo compliance y
// prohíbe replicar. Los paneles de acá usan los del PROPIO módulo
// (`ClimaDimensionesView.tsx:279`): `rounded-xl border-slate-800/30 bg-slate-900/30`.
// Por la misma razón se descartó `compliance/.../DecisionConsole.tsx`, que también
// implementa un 30/70 pero es la deuda reconocida.
//
// ── LAS DOS ETAPAS ───────────────────────────────────────────────────────────
// La cobertura y el veredicto NO son dos bloques pegados: el segundo DEPENDE del
// primero. Sin registro no hay texto que cruzar contra la próxima medición, así
// que la cápsula entera se cae. Se muestran encadenadas por un riel vertical con
// dos marcadores — el mismo recurso (`border-l border-slate-800/40`) que el
// drill-down de las filas usa para expresar pertenencia.
//
// ── ESTADO ACTUAL (H2a) — Estado A del plan maestro §2.1 ─────────────────────
//   · Cobertura de registro por gerencia.       ← construido
//   · Cadencia táctica (cuándo escribieron).    ← diferida a H3
//   · Cero LLM, cero cuadrantes, cero deltas: no hay veredicto todavía.
//
// POR QUÉ LA CADENCIA NO ESTÁ: no es alcance recortado, es que no hay datos. La
// única fuente de timestamps es `ClimaActionLogEntry.createdAt`, y escribir exige
// resolver la identidad del jefe (`User.employeeId`), en NULL para toda la base
// hasta la Etapa 3 del vínculo Employee↔User. Con 0 filas no hay serie.
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { FHREmptyState } from '@/components/ui/FHREmptyState';
import ClimaCoberturaGerencias from './ClimaCoberturaGerencias';
import {
  COBERTURA_TITLE,
  COBERTURA_SUB,
  COBERTURA_ETAPA_1,
  COBERTURA_ETAPA_2,
  PULSO_SIN_FECHA,
  HUB_EFECTIVIDAD_PENDIENTE,
  pulsoDiasLabel,
  pulsoActividad,
} from '@/lib/constants/climaHubContent';
import type { ClimaCoberturaDTO } from '@/types/clima-hub';

/** Color de identidad de la Cápsula 3, el mismo de su tarjeta en el hub. */
const ACCENT = '#10B981';

interface ClimaEfectividadHallazgosProps {
  campaignId: string | null;
}

/**
 * Un eslabón del flujo. El riel vertical baja desde el marcador y se corta en el
 * último (`isLast`), para que la cadena termine en algo y no en el vacío.
 */
function Etapa({
  label,
  isLast,
  children,
}: {
  label: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-6">
      {/* Marcador */}
      <span
        className="absolute left-0 top-[5px] w-[9px] h-[9px] rounded-full border"
        style={{ borderColor: `${ACCENT}60`, background: `${ACCENT}20` }}
      />
      {/* Riel hacia la etapa siguiente */}
      {!isLast && (
        <span className="absolute left-[4px] top-[18px] bottom-[-16px] w-px bg-slate-800/60" />
      )}

      <p className="text-[9px] uppercase tracking-[1.5px] text-slate-600 font-medium mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function ClimaEfectividadHallazgos({
  campaignId,
}: ClimaEfectividadHallazgosProps) {
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
        // Silencio: sin cobertura la pantalla sigue diciendo qué falta para el
        // veredicto, que es su otra mitad. No se levanta un toast por esto.
        if (!cancelled) setCobertura(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const units = cobertura?.units ?? [];
  const hasUnits = units.length > 0;

  // Días transcurridos desde la aprobación. Se trunca hacia abajo: el día 0 es el
  // de la aprobación, y decir "1 día" a las tres horas sería redondear a favor.
  const diasDesdeAprobacion =
    cobertura?.approvedAt != null
      ? Math.max(0, Math.floor((Date.now() - new Date(cobertura.approvedAt).getTime()) / 86_400_000))
      : null;

  // Gerencias (unidades de primer nivel) con al menos un foco registrado.
  const unidadesConActividad = units.filter((u) => u.withAction > 0).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm">
      {/* Tesla line del contenedor — firma de marca, no cambia con el contenido. */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, #22D3EE 35%, #A78BFA 65%, transparent 95%)',
          opacity: 0.7,
        }}
      />

      <div className="px-4 py-5 md:px-6 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-5 md:gap-6">
          {/* ═══ 30% — IDENTIDAD DEL PRODUCTO ═══ */}
          <div className="flex flex-col">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${ACCENT}15` }}
            >
              <Gauge className="w-5 h-5" style={{ color: ACCENT }} />
            </div>

            <h3 className="text-base font-light text-white leading-tight">{COBERTURA_TITLE}</h3>

            {/* ─── PULSO DE ACTIVIDAD ───
                El hero de esta columna es el TIEMPO, no el porcentaje. El % global
                ya lo dio la portada un clic antes y las cards dan el de cada
                gerencia; los días son lo único que no está en ninguna de las dos y
                que no se puede inferir mirándolas. Y son los que le dan peso al
                conteo: "0 de 17" no dice lo mismo a los dos días que a los noventa.
                En blanco y de tamaño fijo — el tiempo tampoco es un semáforo. */}
            {diasDesdeAprobacion !== null ? (
              <>
                <p className="text-[44px] font-extralight text-white leading-[0.9] tabular-nums mt-3">
                  {diasDesdeAprobacion}
                </p>
                <p className="text-[11px] font-light text-slate-500 mt-1">
                  {pulsoDiasLabel(diasDesdeAprobacion)}
                </p>
              </>
            ) : (
              <p className="text-[11px] font-light text-slate-600 mt-3">{PULSO_SIN_FECHA}</p>
            )}

            {/* Estado de actividad — qué pasó en ese tiempo. */}
            <p className="text-[13px] font-light text-slate-400 leading-relaxed mt-4">
              {pulsoActividad(unidadesConActividad, units.length)}
            </p>

            {/* Qué NO es este dato. Sin esta línea, un 0% se lee como "fracasaron". */}
            <p className="text-[11px] font-light text-slate-600 leading-relaxed mt-2">
              {COBERTURA_SUB}
            </p>
          </div>

          {/* ═══ 70% — LAS DOS ETAPAS DEL FLUJO ═══ */}
          <div className="space-y-4">
            <Etapa label={COBERTURA_ETAPA_1}>
              {hasUnits ? (
                <ClimaCoberturaGerencias units={units} />
              ) : (
                <div className="rounded-xl border border-slate-800/30 bg-slate-900/30 p-4">
                  <p className="text-xs text-slate-600 font-light">
                    Todavía no hay focos aprobados en esta medición.
                  </p>
                </div>
              )}
            </Etapa>

            <Etapa label={COBERTURA_ETAPA_2} isLast>
              <FHREmptyState
                type="pending"
                title={HUB_EFECTIVIDAD_PENDIENTE.title}
                description={HUB_EFECTIVIDAD_PENDIENTE.description}
              />
            </Etapa>
          </div>
        </div>
      </div>
    </div>
  );
}
