// src/lib/constants/climaTab2Content.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima — Tab 2 (Por persona): TODO el contenido editable en un solo lugar.
// Copy, textos de estado, verbos de CTA, umbrales de display y los armadores de
// narrativa (síntesis + headline). El componente NO lleva ningún string ni número
// literal — solo consume de acá. Cambiar una palabra = tocar este archivo, no el .tsx.
//
// PROVISIONAL: el copy final pasa por focalizahr-narrativas + Victor/Studio IA.
// Dimensión-only (SPEC_UI §1): el naming humano sale de dimensionLabel(), NUNCA del
// slug del reactivo (el texto de la pregunta no está resuelto en el pipeline de clima).
// ════════════════════════════════════════════════════════════════════════════

import { dimensionLabel } from '@/lib/constants/climaDimensions';
import type { Tab2Route } from '@/lib/services/clima/climaTab2Routing';

/** Umbrales de PRESENTACIÓN (no de negocio — ese es TAB2_BELOW_TIER_PDI_THRESHOLD). */
export const TAB2_DISPLAY = {
  /** Cuántas cards arrancan expandidas (revelación progresiva: la más crítica). */
  defaultExpandedCount: 1,
} as const;

/** Verbos de CTA — nombran el RESULTADO, no la operación (diccionario de verbos). */
export const TAB2_CTA = {
  meta: 'Fijar meta',
  // Botón de la elección Estado A: verbo-resultado alineado al título de su card
  // ("Atacar la causa"). El nombre de producto "plan de desarrollo" se conserva en
  // pdiMandatory (Estado B) y en la copy, pero el botón nombra el resultado.
  pdi: 'Atacar la causa',
  pdiMandatory: 'Ver plan de desarrollo',
  assign: 'Asignar responsable',
  enterFromPortada: 'Revisar por persona',
  backToCarousel: 'Volver a la lista',
} as const;

/** Portada de entrada (Estado 1 del patrón). Título word-split: [white] + [gradient]. */
export const TAB2_PORTADA = {
  kicker: 'Planes de acción · por persona',
  titleWhite: 'Un líder,',
  titleGradient: 'una decisión',
  heroSuffix: 'con equipos en riesgo',
} as const;

/** Card del carrusel (FIX 2 — peso visual, acento neutro). */
export const TAB2_CARD = {
  kicker: 'Responsable',
  tagSystemic: 'patrón extendido',
  tagGated: 'sin responsable',
  tagGatedLong: 'sin responsable asignado',
  /** Affordance de interactividad de la card (abre el Workspace del responsable). */
  openCta: 'Ver detalle',
} as const;

/** Wizard de decisiones uno-por-vez (FIX 1). Nav manual: CTA inertes hasta Fase 3. */
export const TAB2_WIZARD = {
  prev: 'Anterior',
  next: 'Siguiente',
} as const;

/**
 * Companion del carrusel — SOLO cuando la única card es el fallback admin (gated, sin
 * responsables asignados). Convierte el espacio vacío de N=1 en contexto + acción.
 */
export const TAB2_CAROUSEL_COMPANION = {
  kicker: '¿Una sola tarjeta?',
  body: 'Todos los equipos caen sobre el administrador porque aún no asignaste responsables. Asigná uno por área y cada líder tendrá su propia tarjeta acá.',
  // El CTA reutiliza TAB2_CTA.assign.
} as const;

/** Textos de estado de la vista. */
export const TAB2_STATE_COPY = {
  loading: 'Resolviendo responsables…',
  empty: {
    title: 'Ningún equipo necesita acción individual',
    description:
      'En esta medición no hay focos bajo umbral que pidan una meta o un plan por persona. El clima general se sigue en el Lobby.',
  },
  error: {
    title: 'No se pudo cargar el plan por persona',
    description: 'Intentá de nuevo en unos segundos.',
  },
  /** Motivo del CTA gateado (responsable = fallback account_admin, sin Employee real). */
  gatedNotice:
    'Nadie figura como responsable de este equipo en la nómina. Asignalo para habilitar la meta o el plan.',
} as const;

/** Metadata por ruta (tag corto + explicación de por qué esta ruta). */
export const TAB2_ROUTE_COPY: Record<Exclude<Tab2Route, 'NONE'>, { tag: string; explanation: string }> = {
  ESTADO_B_PDI: {
    tag: 'Patrón extendido',
    explanation:
      'Cuando varias señales de un mismo equipo bajan juntas, el problema dejó de ser una pregunta suelta: es la forma de liderar. No se cierra con una meta puntual. Se trabaja con un plan de desarrollo.',
  },
  ESTADO_A_CHOICE: {
    tag: 'Decisión: meta o desarrollo',
    explanation:
      'Un foco puntual: el equipo puede comprometer una mejora medible, o trabajar la causa de fondo. Vos elegís según qué tan claro esté el camino.',
  },
};

/** Elección Meta / PDI (Estado A) — dos caminos con contexto, no dos botones sueltos. */
export const TAB2_CHOICE = {
  prompt: '¿Cómo lo abordás?',
  meta: {
    title: 'Comprometer un resultado',
    body: 'El equipo fija un número y lo mide en la próxima encuesta. Va cuando ya sabés qué hacer y solo falta ponerle meta y plazo.',
  },
  pdi: {
    title: 'Atacar la causa',
    body: 'Un plan de desarrollo trabaja la habilidad de fondo, con acompañamiento. Mejor cuando el problema es real pero todavía no está claro el cómo.',
  },
} as const;

// ── Armadores de narrativa ────────────────────────────────────────────────────

/** "A" · "A y B" · "A, B y C" — sin coma de Oxford, castellano. */
function joinLabels(labels: string[]): string {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

/** Dimensiones crudas → etiquetas humanas unidas (dimensión-only). */
function humanDimensions(dimensionSlugs: string[]): string {
  return joinLabels(dimensionSlugs.map(dimensionLabel));
}

/**
 * Headline de una card de departamento (colapsada). Dimensión-only.
 * Estado B → "{depto} — {Dim} cedió en varios frentes a la vez"
 * Estado A → "{depto} — un foco puntual en {Dim}" (o "focos en {Dim1} y {Dim2}")
 */
export function tab2DeptHeadline(
  departmentName: string,
  route: Exclude<Tab2Route, 'NONE'>,
  dimensionSlugs: string[]
): string {
  const dims = humanDimensions(dimensionSlugs);
  if (route === 'ESTADO_B_PDI') {
    return dimensionSlugs.length <= 1
      ? `${departmentName}, ${dims || 'el liderazgo'} cedió en varios frentes a la vez`
      : `${departmentName}, varias dimensiones cedieron a la vez (${dims})`;
  }
  // ESTADO_A_CHOICE
  return dimensionSlugs.length <= 1
    ? `${departmentName}, un foco puntual en ${dims || 'clima'}`
    : `${departmentName}, focos en ${dims}`;
}

/** Síntesis narrativa de la pestaña (una lectura, arriba). Narrativa antes de dato. */
export function tab2Synthesis(counts: {
  total: number; // responsables con hallazgos
  teamsTotal: number; // departamentos con hallazgos (equipos)
  gated: number;
  withSystemic: number;
  choiceOnly: number;
}): string {
  const { total, teamsTotal, gated, withSystemic, choiceOnly } = counts;

  // Todo gateado (realidad de hoy: 0% responsables asignados). La unidad es el EQUIPO
  // (departamento), no el responsable-fallback — el admin no es un líder real.
  if (total > 0 && gated === total) {
    return `El clima encendió focos en ${teamsTotal} ${plural(teamsTotal, 'equipo', 'equipos')}. Antes de actuar, decinos quién responde por cada área. Sin un responsable asignado, no hay a quién darle la meta ni el plan.`;
  }

  const base = `${total} de tus líderes ${plural(total, 'carga', 'cargan')} hoy un foco de clima en su equipo.`;
  const shape =
    withSystemic > 0 && choiceOnly > 0
      ? ` ${plural(withSystemic, 'Uno arrastra', `${withSystemic} arrastran`)} un patrón de fondo; ${plural(choiceOnly, 'otro', `otros ${choiceOnly}`)}, una decisión que podés cerrar.`
      : withSystemic > 0
        ? ` ${plural(withSystemic, 'Es', 'Son')} un patrón de fondo que se trabaja con desarrollo.`
        : '';
  const gatedTail = gated > 0 ? ` ${gated} sin responsable asignado todavía.` : '';
  return base + shape + gatedTail;
}

/**
 * Landing Card del responsable (sub-estado `intro` del Workspace) — CONTEXTO antes de
 * la decisión (Patrón 3 Smart Router: cero clics ciegos). Título + misión narrada.
 */
export function tab2ResponsableIntro(
  name: string,
  counts: { teams: number; withSystemic: number; choiceOnly: number }
): { title: string; mission: string } {
  const { teams, withSystemic, choiceOnly } = counts;
  const title = `El equipo de ${name}`;
  let mission: string;
  if (withSystemic > 0 && choiceOnly > 0) {
    mission = `${teams} de sus equipos encendieron un foco. ${plural(withSystemic, 'Uno arrastra', `${withSystemic} arrastran`)} un patrón de fondo que pide desarrollo; ${plural(choiceOnly, 'otro pide', `otros ${choiceOnly} piden`)} una decisión que podés cerrar.`;
  } else if (withSystemic > 0) {
    mission =
      'Sus equipos muestran un patrón extendido: varias señales bajaron juntas. Se trabaja con un plan de desarrollo, no con metas puntuales.';
  } else {
    mission = `${teams} ${plural(teams, 'equipo', 'equipos')} con un foco puntual. En cada uno elegís: comprometer una mejora medible, o trabajar la causa de fondo.`;
  }
  return { title, mission };
}

/** CTA del Landing Card intro → abre las decisiones por departamento. */
export function tab2ReviewCta(teams: number): string {
  return `Revisar ${teams} ${plural(teams, 'equipo', 'equipos')}`;
}

/** Breadcrumb de contexto (FIX 3) — diferencia la Landing Card de la Portada. */
export function tab2Breadcrumb(name: string): string {
  return `Por persona › ${name}`;
}

/** Progreso del wizard (FIX 1) — "Equipo X de Y". */
export function tab2WizardProgress(index1: number, total: number): string {
  return `Equipo ${index1} de ${total}`;
}

/** Sufijo del número prominente de la card ("equipos en riesgo" / "equipo en riesgo"). */
export function tab2TeamsSuffix(teams: number): string {
  return `${plural(teams, 'equipo', 'equipos')} en riesgo`;
}

/** Helper de pluralización mínimo (singular / plural). */
function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
