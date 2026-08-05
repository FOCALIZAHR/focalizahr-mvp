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

import type { ClimaPlanesCapsula } from '@/types/clima-hub';

/** Título de la portada del hub, en word-split (primera línea blanca, segunda en gradiente). */
export const HUB_TITLE = {
  first: 'Planes de',
  second: 'Acción',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Barra de progreso — dato puro, sin interpretación.
// Es lo primero que se ve al entrar (plan maestro §1.3). No lleva adjetivos: un
// 12% no se anuncia como "bajo" ni un 81% como "sólido". El número habla solo.
// ─────────────────────────────────────────────────────────────────────────────

export const HUB_PROGRESS_LABEL = 'Registro de acciones';

/**
 * Bajada de la barra. Ejemplo real de hoy: "2 de 17 focos con al menos una
 * acción registrada".
 *
 * "al menos una" y no "una": un foco puede tener varias entradas de bitácora, y
 * la barra mide cobertura, no volumen. Decir "con una acción" sugeriría que
 * quien registró tres veces está contado tres veces.
 */
export function hubProgressCaption(withAction: number, total: number): string {
  return `${withAction} de ${total} ${total === 1 ? 'foco' : 'focos'} con al menos una acción registrada`;
}

/**
 * Sin focos aprobados todavía. Neutro y sin leer nada en la ausencia: que no
 * haya focos no significa que nadie haya hecho nada, significa que el plan
 * todavía no se aprobó.
 */
export const HUB_PROGRESS_EMPTY = 'Todavía no hay focos aprobados en esta medición.';

// ─────────────────────────────────────────────────────────────────────────────
// Las tres tarjetas.
//
// Los badges son POR MISIÓN, no por rol (plan maestro §1.3): no dicen "RRHH" ni
// "C-LEVEL" porque no limitan quién entra. Cualquiera con acceso a Clima puede
// abrir las tres; el filtrado real lo hace cada vista adentro.
//
// Peso idéntico en los tres CTA — es navegación, no embudo. Ninguna tarjeta es
// "la principal".
// ─────────────────────────────────────────────────────────────────────────────

export interface ClimaCapsulaCopy {
  id: ClimaPlanesCapsula;
  badge: string;
  title: string;
  /** Una frase. Qué mundo hay adentro, legible en tres segundos. */
  description: string;
}

export const HUB_CAPSULAS: ClimaCapsulaCopy[] = [
  {
    id: 'planes',
    badge: 'Aprobación & Cobertura',
    title: 'Planes',
    description: 'Aprobación de planes y control de cobertura por departamento.',
  },
  {
    id: 'bitacora',
    badge: 'Registro & Bitácora',
    title: 'Bitácora',
    description: 'Registro táctico de acciones por cada líder de equipo.',
  },
  {
    id: 'efectividad',
    badge: 'Inteligencia & Efectividad',
    title: 'Seguimiento de Efectividad',
    description: 'Impacto real de las intervenciones y hallazgos basados en evidencia.',
  },
];

export const HUB_CTA = 'Entrar';
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
