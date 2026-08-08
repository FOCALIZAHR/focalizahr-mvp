'use client';

// src/app/dashboard/clima/components/planes/ClimaEfectividadPortada.tsx
// ════════════════════════════════════════════════════════════════════════════
// PORTADA de la Cápsula 3 (Seguimiento de Efectividad). PANTALLA COMPLETA Y SOLA:
// el número, la bajada y un CTA. Nada más. Al tocar el CTA, esta pantalla SE VA y
// entran los hallazgos — no se queda arriba como encabezado.
//
// Una portada es una portada. Esta pieza NO conoce los hallazgos, ni la matriz,
// ni el LLM — y no se va a enterar cuando existan.
//
// Así funcionan las otras dos de Clima, y por eso acá también:
//   · `ClimaPlanDeptTab.tsx:44`  → `'portada' | 'carrusel' | 'path'`, monta la
//     portada en `:325` con `onEnter` y la reemplaza.
//   · `ClimaBitacoraView.tsx:118` → `'portada' | 'focos' | 'cierre'`.
// La portada es un ESTADO de la máquina, nunca un bloque apilado sobre el
// contenido. Llegó a estar pegada al empty state; Victor lo corrigió (2026-08-05).
//
// ⚠️ LA TERCERA PORTADA DE CLIMA. Las otras dos son `cascada/ClimaPortada.tsx` y
// `planes/ClimaPlanPortada.tsx`, y la primera lleva escrito en su cabecera:
// "Mismo tratamiento que ClimaPlanPortada — mantener ambas alineadas"
// (`ClimaPortada.tsx:15`). Esta se suma a esa regla: los tokens de abajo son
// COPIA EXACTA de las dos, no una variante nueva.
//
//   contenedor  rounded-2xl border-slate-800/40 bg-slate-900/60 backdrop-blur-sm
//   padding     px-6 py-8 md:px-10 md:py-10   ← se APILA con el del stage; por eso
//                                               py-8 y no py-20 (ver la nota de
//                                               geometría en ClimaPortada.tsx:9-16)
//   título      text-3xl font-extralight  +  text-xl fhr-title-gradient mt-1
//   bloque      mb-4
//   hero        text-[56px] font-extralight leading-[0.9] tabular-nums
//   bajada      max-w-3xl mt-4 · text-base font-light text-slate-400
//
// Si acá se agranda algo, hay que verificarlo contra captura real en 1366x768 y
// realinear las tres. No estimando.
//
// ÚNICA DIFERENCIA con las otras dos: SIN BARRA Y SIN GRADIENTE en el dato
// (corrección de Victor). El porcentaje va solo, en BLANCO: nunca cyan y nunca
// coloreado según el valor. Un riel con relleno degradado leía como semáforo, y
// acá ni siquiera hay severidad — es un conteo.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PremiumButton';
import {
  EFECTIVIDAD_PROGRESS_EMPTY,
  EFECTIVIDAD_CTA,
  PORTADA_HALLAZGO_SUBTEXT,
  efectividadProgressCaption,
  portadaHallazgoHeadline,
} from '@/lib/constants/climaHubContent';
import type { ClimaPlanesProgressDTO, ClimaFindingsDTO } from '@/types/clima-hub';

interface ClimaEfectividadPortadaProps {
  /** `null` = todavía no cargó, o no hay plan aprobado. La portada se muestra igual. */
  progress: ClimaPlanesProgressDTO | null;
  /**
   * Conteos de ejecución para el gancho dinámico (v3 §2, Acto 1). `null` mientras
   * carga o si no hay ningún registro analizado — ahí la portada cae a su bajada
   * de cobertura, que es lo que decía antes de v3.
   */
  findings: ClimaFindingsDTO | null;
  /** Reemplaza esta pantalla por la de hallazgos. Mismo contrato que `ClimaPlanPortada`. */
  onEnter: () => void;
}

export default function ClimaEfectividadPortada({
  progress,
  findings,
  onEnter,
}: ClimaEfectividadPortadaProps) {
  const hasData = !!progress && progress.total > 0;

  // El gancho manda cuando hay algo analizado. Sin registros no se inventa una
  // frase sobre ejecución: se dice lo que sí se sabe, que es la cobertura.
  const gancho =
    findings && findings.entriesAnalyzed > 0
      ? portadaHallazgoHeadline(findings.entriesAnalyzed, findings.executionCount)
      : null;

  return (
    <div className="relative rounded-2xl border border-slate-800/40 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Tesla line — firma de marca, nunca cambia según el contenido. */}
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
            Seguimiento de
          </h2>
          <p className="text-xl font-light tracking-tight leading-tight fhr-title-gradient mt-1">
            Efectividad
          </p>
        </div>

        {/* ─── EL GANCHO, COMO HERO (v3 §2, Acto 1) ───
            ⛔ Acá VIVÍA el porcentaje de cobertura en 56px. Se retiró: la cobertura
            ya tiene su propia sección con su anillo y sus cards, y repetirla acá
            competía con lo único que esta pantalla tiene que decir. El protagonista
            es la frase de EJECUCIÓN.
            Es una frase y no un número, así que el tamaño de hero es el de un
            título largo (`text-2xl md:text-[32px]`) y no los 56px reservados a
            cifras sueltas — a ese cuerpo, una oración de dos líneas se vuelve un
            muro. Blanco y de tamaño fijo: no cambia con el tramo en que caiga. */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-[32px] font-extralight text-white leading-snug tracking-tight max-w-2xl"
        >
          {gancho ??
            (hasData
              ? efectividadProgressCaption(progress!.withAction, progress!.total)
              : EFECTIVIDAD_PROGRESS_EMPTY)}
        </motion.h3>

        {/* Subtexto fijo: qué hace el sistema con esos registros. */}
        {gancho && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-light text-slate-500 leading-relaxed mt-4 max-w-xl"
          >
            {PORTADA_HALLAZGO_SUBTEXT}
          </motion.p>
        )}

        {/* ─── ACCIÓN ÚNICA ───
            Mismo lugar y mismo tratamiento que `ClimaPlanPortada.tsx:104-108`. */}
        <div className="mt-6">
          <PrimaryButton icon={ArrowRight} iconPosition="right" onClick={onEnter}>
            {EFECTIVIDAD_CTA}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
