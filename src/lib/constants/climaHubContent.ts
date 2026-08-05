// src/lib/constants/climaHubContent.ts
// ════════════════════════════════════════════════════════════════════════════
// Copy del Hub de Planes de Acción (H1.2). Archivo propio — NO se agrega a
// `climaBitacoraContent.ts`: ese archivo es de la Cápsula 2 y el hub está una
// capa por encima de las tres.
//
// Auditado contra la skill `focalizahr-narrativas`:
//   · Regla 0 (Minto): la barra de progreso va arriba de todo y responde sola.
//     Las tres tarjetas son navegación, no argumento — no llevan conclusión.
//   · Regla 3 (consecuencia, no instrucción): ninguna tarjeta dice qué hacer.
//     Dicen qué hay adentro. El hub no empuja a ningún lado.
//   · Regla 4 (sin jerga): cero "LLM", "motor", "cuadrante", "NLP", "cadencia".
//   · Tuteo neutro, nunca voseo.
//
// ⚠️ "FOCOS", no "planes". El plan maestro §1.3 ejemplifica con "34 de 42 planes",
// pero en el modelo real hay UN ActionPlan por campaña y N filas ClimaActionLog
// (una por departamento × dimensión). Decir "2 de 17 planes" sería un número
// falso. `foco` es la palabra que ya usa la Bitácora para esa misma fila
// (`climaBitacoraContent.ts:110`), así que el hub y la cápsula hablan igual.
// ════════════════════════════════════════════════════════════════════════════

import { ClipboardCheck, NotebookPen, Gauge, type LucideIcon } from 'lucide-react';
import type { ClimaPlanesCapsula } from '@/types/clima-hub';

/** Título de la portada del hub, en word-split (primera línea blanca, segunda en gradiente). */
export const HUB_TITLE = {
  first: 'Planes de',
  second: 'Acción',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Progreso de registro — dato puro, sin interpretación.
//
// ⛔ NO VIVE EN EL HUB (corrección de Victor, 2026-08-05). Estuvo arriba del
// enrutador y competía con él: en el hub las tres cápsulas pesan igual, y una
// barra arriba le daba protagonismo a una métrica que es de UNA de ellas. Ahora
// es el dato protagonista de la portada de la Cápsula 3, que es de quien era.
//
// No lleva adjetivos: un 12% no se anuncia como "bajo" ni un 81% como "sólido".
// El número habla solo.
// ─────────────────────────────────────────────────────────────────────────────

// Sin etiqueta arriba del número: el ritmo canónico de las portadas de Clima es
// título → dato hero → consecuencia (`ClimaPortada.tsx:50-78`), y la bajada de
// acá ya dice qué se está contando. Un rótulo extra rompía ese ritmo por nada.

/**
 * Bajada del número hero. Ejemplo real de hoy: "2 de 17 focos con al menos una
 * acción registrada".
 *
 * "al menos una" y no "una": un foco puede tener varias entradas de bitácora, y
 * la métrica mide cobertura, no volumen. Decir "con una acción" sugeriría que
 * quien registró tres veces está contado tres veces.
 */
export function efectividadProgressCaption(withAction: number, total: number): string {
  return `${withAction} de ${total} ${total === 1 ? 'foco' : 'focos'} con al menos una acción registrada`;
}

/**
 * Sin focos aprobados todavía. Neutro y sin leer nada en la ausencia: que no
 * haya focos no significa que nadie haya hecho nada, significa que el plan
 * todavía no se aprobó.
 */
export const EFECTIVIDAD_PROGRESS_EMPTY = 'Todavía no hay focos aprobados en esta medición.';

// ─────────────────────────────────────────────────────────────────────────────
// Las tres tarjetas.
//
// Los badges son POR MISIÓN, no por rol (plan maestro §1.3): no dicen "RRHH" ni
// "C-LEVEL" porque no limitan quién entra. Cualquiera con acceso a Clima puede
// abrir las tres; el filtrado real lo hace cada vista adentro.
//
// Peso idéntico entre las tres — es un enrutador, no un embudo. Ninguna es "la
// principal", y por eso NINGUNA lleva botón: la tarjeta entera es el destino.
// ─────────────────────────────────────────────────────────────────────────────

// COLORES = IDENTIDAD DE CÁPSULA, no semáforo de severidad. Es la misma nota que
// lleva `climaPlanPaths.ts:6-8` para los 4 caminos de Tab 1, y por la misma razón:
// el color dice QUÉ MUNDO es, nunca qué tan grave está. Se reusa la tríada exacta
// de `SummaryHub.tsx:35-46` (cyan · violeta · esmeralda), que es el molde que
// Victor señaló y del que Tab 1 ya declara ser clon.
export interface ClimaCapsulaCopy {
  id: ClimaPlanesCapsula;
  /** Nombre de misión. Va como badge de color, no como rol. */
  badge: string;
  title: string;
  /** Una frase. Qué mundo hay adentro, legible en tres segundos. */
  description: string;
  color: string;
  icon: LucideIcon;
}

export const HUB_CAPSULAS: ClimaCapsulaCopy[] = [
  {
    id: 'planes',
    badge: 'Aprobación & Cobertura',
    title: 'Planes',
    description: 'Aprobación de planes y control de cobertura por departamento.',
    color: '#22D3EE',
    icon: ClipboardCheck, // el mismo ícono que la card `planes` del Rail: continuidad
  },
  {
    id: 'bitacora',
    badge: 'Registro & Bitácora',
    title: 'Bitácora',
    description: 'Registro táctico de acciones por cada líder de equipo.',
    color: '#A78BFA',
    icon: NotebookPen, // el que tenía la Bitácora cuando era card del Rail
  },
  {
    id: 'efectividad',
    badge: 'Inteligencia & Efectividad',
    title: 'Seguimiento de Efectividad',
    description: 'Impacto real de las intervenciones y hallazgos basados en evidencia.',
    color: '#10B981',
    icon: Gauge, // medición, no flecha ascendente: TrendingUp prometería mejora
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dato protagonista de cada tarjeta (el `metric` del molde SummaryHub: número en
// blanco + etiqueta chica al lado).
//
// Cada cápsula muestra el dato de SU mundo, no una métrica global repetida tres
// veces. Todos salen del mismo endpoint, así que nunca se contradicen entre sí.
// ─────────────────────────────────────────────────────────────────────────────

/** Planes: cuántas decisiones tiene el plan y que ya está aprobado. */
export function capsulaPlanesMetric(total: number): { value: string; label: string } {
  return {
    value: `${total}`,
    label: `${total === 1 ? 'decisión' : 'decisiones'} · Plan aprobado`,
  };
}

/** Bitácora: cobertura de registro. Mismo criterio que la Cápsula 3, mismo origen. */
export function capsulaBitacoraMetric(
  withAction: number,
  total: number
): { value: string; label: string } {
  return {
    value: `${withAction} de ${total}`,
    label: `${total === 1 ? 'foco' : 'focos'} con registro`,
  };
}

/**
 * Efectividad: cuántos focos tienen veredicto. Sin ninguno, la tarjeta no muestra
 * número — muestra el estado. "Pendiente de medición" es un hecho del negocio (no
 * cerró todavía un Seguimiento Focalizado), no un aviso de pantalla sin construir.
 */
export const CAPSULA_EFECTIVIDAD_SIN_MEDICION = 'Pendiente de medición';

/**
 * CTA de la portada de Efectividad. Nombra el DESTINO, no la operación: es la
 * regla del diccionario de verbos ("Ver Plan", no "Ver"). Las otras dos portadas
 * de Clima llevan el suyo en el mismo lugar (`ClimaPlanPortada.tsx:106`
 * "Comenzar", `ClimaPortada.tsx:82`).
 */
export const EFECTIVIDAD_CTA = 'Ver hallazgos';

export function capsulaEfectividadMetric(
  measured: number,
  total: number
): { value: string; label: string } {
  return {
    value: `${measured} de ${total}`,
    label: `${measured === 1 ? 'foco medido' : 'focos medidos'}`,
  };
}

// Sin `HUB_CTA`. Las tarjetas del hub NO llevan botón "Entrar" (corrección de
// Victor, 2026-08-05): tres botones convertían un enrutador en tres llamados a
// la acción. La afordancia es la tarjeta misma, igual que en el Rail — se eleva
// al pasar el mouse y enciende su acento. Ver `ClimaSubproductoRailCard.tsx`.
export const HUB_BACK = 'Volver';

// ─────────────────────────────────────────────────────────────────────────────
// Cápsula 3 — estado previo a su gate propio (H2).
//
// Sin lenguaje de roadmap (regla del proyecto: cero "en construcción", cero
// "próximamente"). Se dice qué condición del NEGOCIO falta, no qué falta
// construir: la efectividad no se puede mostrar antes de que exista una segunda
// medición, y eso sería verdad aunque la pantalla estuviera terminada.
// ─────────────────────────────────────────────────────────────────────────────

export const HUB_EFECTIVIDAD_PENDIENTE = {
  title: 'Sin resultados de efectividad todavía',
  description:
    'El impacto de las intervenciones se puede leer cuando cierre la siguiente medición de clima sobre estos mismos departamentos.',
} as const;
