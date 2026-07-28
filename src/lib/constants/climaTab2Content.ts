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
import { CLIMA_GOAL_TARGET_MIN_DELTA } from '@/lib/services/clima/climaThresholds';

/** Redondeo a 1 decimal — presentación de means/targets (nunca decimales largos al usuario). */
const round1 = (n: number): number => Math.round(n * 10) / 10;

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
  body: 'Todos los equipos caen sobre el administrador porque aún no se asignaron responsables. Asigna uno por área y cada líder tendrá su propia tarjeta aquí.',
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
    description: 'Intenta de nuevo en unos segundos.',
  },
  /** Motivo del CTA gateado (responsable = fallback account_admin, sin Employee real). */
  gatedNotice:
    'Nadie figura como responsable de este equipo en la nómina. Asígnalo para habilitar la meta o el plan.',
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
      'Un foco puntual: el equipo puede comprometer una mejora medible, o trabajar la causa de fondo. Eliges según qué tan claro esté el camino.',
  },
};

/** Gate de la meta (Fase 3): la meta necesita un plan APROBADO como origen (§3.5). */
export const TAB2_META_GATE = {
  needsApprovedPlan: 'Para fijar metas, el plan debe aprobarse primero en «Por departamento».',
  // Hint por-botón (tooltip) cuando el CTA meta está gateado por falta de responsable.
  needsResponsable: 'Asigna un responsable primero.',
} as const;

/** Gate del PDI (Fase 3 Blocker 2): el camino de desarrollo aún no es accionable desde acá.
 *  Copy user-facing (sin lenguaje interno de "pantalla"), presente factual, sin plazo. */
export const TAB2_PDI_GATE = {
  noScreen: 'El plan de desarrollo no está disponible desde aquí por ahora.',
} as const;

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

/**
 * Pantalla de fijar meta sobre reactivo(s) — ESTADO A, camino "meta" (SPEC_UI §1/§2).
 * Se entra desde la elección del Workspace (kind='meta'); NO repite Paso 0 ni Estado B.
 * Copy PROVISIONAL (placeholder de la spec, decisión Victor 2026-07-27 — pasa por Studio IA).
 */
export const TAB2_META_SCREEN = {
  titleWhite: 'Fijar una',
  titleGradient: 'meta de equipo',
  intro:
    'Elige cuánto quieres que mejore tu equipo en cada foco. Arrastra para ajustar; lo que no toques queda en la meta mínima.',
  // Etiquetas de orientación del slider (§2) — el em dash de la spec se reemplaza por coma.
  bands: {
    min: 'Meta mínima, un cambio que ya se nota',
    good: 'Buena mejora',
    healthy: 'Nivel saludable para esta pregunta',
    ambitious: 'Meta ambiciosa',
  },
  // Forma compacta de las 4 bandas para el resumen colapsado de la card (evita wrap en mobile).
  bandsShort: {
    min: 'Meta mínima',
    good: 'Buena mejora',
    healthy: 'Nivel saludable',
    ambitious: 'Meta ambiciosa',
  },
  cancel: 'Volver',
  success: {
    title: 'Metas fijadas',
    cta: 'Volver a la lista',
  },
  loading: 'Cargando…',
  error: {
    title: 'No se pudo cargar',
    description: 'Intenta de nuevo en unos segundos.',
    retry: 'Reintentar',
  },
  // Fallo al crear las metas (el mensaje del server tiene prioridad; este es el fallback).
  submitError: 'No se pudieron fijar las metas.',
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
    return `El clima encendió focos en ${teamsTotal} ${plural(teamsTotal, 'equipo', 'equipos')}. Antes de actuar, hay que identificar quién responde por cada área. Sin un responsable asignado, no hay a quién darle la meta ni el plan.`;
  }

  const base = `${total} de tus líderes ${plural(total, 'carga', 'cargan')} hoy un foco de clima en su equipo.`;
  const shape =
    withSystemic > 0 && choiceOnly > 0
      ? ` ${plural(withSystemic, 'Uno arrastra', `${withSystemic} arrastran`)} un patrón de fondo; ${plural(choiceOnly, 'otro', `otros ${choiceOnly}`)}, una decisión que puedes cerrar.`
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
    mission = `${teams} de sus equipos encendieron un foco. ${plural(withSystemic, 'Uno arrastra', `${withSystemic} arrastran`)} un patrón de fondo que pide desarrollo; ${plural(choiceOnly, 'otro pide', `otros ${choiceOnly} piden`)} una decisión que puedes cerrar.`;
  } else if (withSystemic > 0) {
    mission =
      'Sus equipos muestran un patrón extendido: varias señales bajaron juntas. Se trabaja con un plan de desarrollo, no con metas puntuales.';
  } else {
    mission = `${teams} ${plural(teams, 'equipo', 'equipos')} con un foco puntual. En cada uno eliges: comprometer una mejora medible, o trabajar la causa de fondo.`;
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

// ── Pantalla de fijar meta (SPEC_UI §1/§2) ─────────────────────────────────────

/** Título de la meta a partir del texto de la pregunta (primeras palabras + "…" si recorta). */
export function tab2MetaTitle(questionText: string): string {
  const words = questionText.trim().split(/\s+/);
  const head = words.slice(0, 7).join(' ');
  return words.length > 7 ? `${head}…` : head;
}

/** Línea compacta de referencia técnica "Hoy X → meta Y" (1 decimal, flecha, sin em dash). */
export function tab2MetaTodayTarget(current: number, target: number): string {
  return `Hoy ${round1(current).toFixed(1)} → meta ${round1(target).toFixed(1)}`;
}

type MetaBandKey = 'min' | 'good' | 'healthy' | 'ambitious';

/**
 * Condición ÚNICA de banda del slider (§2). La reusan la etiqueta COMPLETA (vista expandida) y
 * la CORTA (resumen colapsado): solo cambia el texto de salida, nunca la lógica. Anti-semáforo:
 * la banda la canta el texto, nunca el color. tier = mean objetivo del reactivo.
 *
 * "Nivel saludable" NO exige igualdad exacta con el tier: el slider avanza de a 0.2 desde el
 * mean y casi nunca cae justo en el tier (cuando tier-mean no es múltiplo de 0.2, la igualdad
 * exacta hacía DESAPARECER la etiqueta). Se ancla al primer PASO del slider que alcanza el tier
 * (snap hacia arriba). NOTA: "Buena mejora" queda vacía cuando tier-mean < 0.4 (no hay step
 * entre min y el tier) — es ausencia real de un paso, no de etiqueta → deuda aparte.
 */
function metaBandKey(target: number, current: number, tier: number): MetaBandKey {
  const min = round1(current + CLIMA_GOAL_TARGET_MIN_DELTA);
  const t = round1(target);
  const tierR = round1(tier);
  const stepsToTier = Math.max(0, Math.ceil((tierR - min) / CLIMA_GOAL_TARGET_MIN_DELTA - 1e-9));
  const healthy = round1(min + stepsToTier * CLIMA_GOAL_TARGET_MIN_DELTA);
  if (t <= min) return 'min';
  if (t < healthy) return 'good';
  if (t === healthy) return 'healthy';
  return 'ambitious';
}

/** Etiqueta de banda COMPLETA (vista expandida del slider). */
export function tab2MetaBandLabel(target: number, current: number, tier: number): string {
  return TAB2_META_SCREEN.bands[metaBandKey(target, current, tier)];
}

/** Etiqueta de banda CORTA (resumen colapsado de la card). Misma condición, texto compacto. */
export function tab2MetaBandLabelShort(target: number, current: number, tier: number): string {
  return TAB2_META_SCREEN.bandsShort[metaBandKey(target, current, tier)];
}

/** CTA único de confirmación ("Fijar N metas") — nombra el resultado, N interpolado. */
export function tab2MetaConfirmCta(n: number): string {
  return `Fijar ${n} ${plural(n, 'meta', 'metas')}`;
}

/** Cuerpo de la pantalla de éxito (Mandamiento 9: cierra y apunta a la siguiente). */
export function tab2MetaSuccessBody(n: number): string {
  return n === 1
    ? 'La meta queda asignada al responsable del equipo. Vas a ver el avance en la próxima medición.'
    : `Las ${n} metas quedan asignadas al responsable del equipo. Vas a ver el avance en la próxima medición.`;
}

/** Helper de pluralización mínimo (singular / plural). */
function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
