// ════════════════════════════════════════════════════════════════════════════
// SECTION DIMENSIONES — CONSTANTES Y COPY APROBADO
// _shared/constants.ts
// ════════════════════════════════════════════════════════════════════════════
// Single source of truth para narrativas, recomendaciones por nivel y
// thresholds de scoring. Todo el copy vive acá — los componentes lo importan.
//
// Reglas:
//   - Las narrativas son APROBADAS por Victor / Studio IA. NO modificar sin
//     instrucción explícita.
//   - Los thresholds están en escala 0-100 (display) — la conversión desde
//     1-5 (backend) vive en _shared/helpers.ts.
// ════════════════════════════════════════════════════════════════════════════

import type {
  ComplianceDimensionKey,
  ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';

// ────────────────────────────────────────────────────────────────────────────
// THRESHOLDS — escala 0-100
// ────────────────────────────────────────────────────────────────────────────

export const SCORE_THRESHOLDS = {
  /** ≥ 75: sano */
  SANO: 75,
  /** ≥ 50: atención */
  ATENCION: 50,
  /** ≥ 25: riesgo */
  RIESGO: 25,
  /** Acto 4: dept con score < 50 cuenta como crítico (decisión confirmada) */
  CRITICAL_DEPT: 50,
  /** Brecha de género: |male - female| ≥ 0.5 (escala 0-5 backend) → mostrar */
  GENDER_GAP_MIN: 0.5,
} as const;

// ────────────────────────────────────────────────────────────────────────────
// ISA PORTADA (Pantalla 1) — narrativas por nivel
// ────────────────────────────────────────────────────────────────────────────

/** Niveles de ISA en escala 0-100. */
export type IsaLevel = 'sano' | 'atencion' | 'riesgo' | 'critico';

export interface IsaNarrative {
  range: readonly [number, number];
  badge: string;
  /** Clase fhr-badge-* del design system. */
  badgeClass: string;
  /** Color hex para Tesla line + dato hero. */
  teslaColor: string;
  narrative: string;
}

// Decisión de diseño: el CTA de la ISA Portada es SIEMPRE `primary` (cyan).
// La severidad la comunican tres canales redundantes y suficientes:
//   1) color del número ancla (teslaColor),
//   2) badge de nivel (Sano / Atención / Riesgo / Crítico),
//   3) Tesla line del contenedor.
// Un cuarto canal (variante del botón) sería ruido — el CTA solo dice
// "Ver dimensiones →", la decisión visual ya está tomada arriba.

export const ISA_NARRATIVES: Record<IsaLevel, IsaNarrative> = {
  sano: {
    range: [75, 100],
    badge: 'Sano',
    badgeClass: 'fhr-badge-success',
    teslaColor: '#10B981',
    narrative:
      'Las condiciones están dadas. El talento tiene razones para quedarse y el ambiente no genera fricción legal. Esto no se mantiene solo — se cuida.',
  },
  atencion: {
    range: [50, 74],
    badge: 'Atención',
    badgeClass: 'fhr-badge-warning',
    teslaColor: '#F59E0B',
    narrative:
      'Hay señales que todavía no se convirtieron en problema. Ese margen existe hoy. No es permanente.',
  },
  riesgo: {
    range: [25, 49],
    badge: 'Riesgo',
    badgeClass: 'fhr-badge-warning',
    teslaColor: '#F59E0B',
    narrative:
      'El deterioro ya tiene historia. Estas condiciones no aparecieron de la noche a la mañana y no desaparecen solas. Cada ciclo sin acción las consolida.',
  },
  critico: {
    range: [0, 24],
    badge: 'Crítico',
    badgeClass: 'fhr-badge-error',
    teslaColor: '#EF4444',
    narrative:
      'El ambiente de trabajo llegó a un punto donde el silencio ya no es neutral. Lo que no se dice en una encuesta anónima termina diciéndose en otro lugar.',
  },
};

/** Mapea ISA score (0-100) → nivel. */
export function classifyIsa(score: number): IsaLevel {
  if (score >= SCORE_THRESHOLDS.SANO) return 'sano';
  if (score >= SCORE_THRESHOLDS.ATENCION) return 'atencion';
  if (score >= SCORE_THRESHOLDS.RIESGO) return 'riesgo';
  return 'critico';
}

// ────────────────────────────────────────────────────────────────────────────
// EDITORIAL TITLES — frase narrativa del DetailPanel (palabra-1 + palabra-2)
// ────────────────────────────────────────────────────────────────────────────
// Patrón visual: la primera palabra/frase en blanco; la segunda en cyan vía <em>.
// Ejemplo del bundle: "La pertenencia / se está apagando."
//
// El user es responsable de redactar cada entrada. Si una dim no tiene entrada
// aquí, `getEditorialTitle()` cae a `dimensionName` como `primera` (sin segunda).
// ────────────────────────────────────────────────────────────────────────────

export interface EditorialTitle {
  /** Palabra/frase en blanco (sustantivo o sujeto). */
  primera: string;
  /** Palabra/frase en cyan vía <em> (verbo o consecuencia). */
  segunda: string;
}

export const DIMENSION_EDITORIAL_TITLES: Partial<
  Record<ComplianceDimensionKey, EditorialTitle>
> = {
  // P2_seguridad: { primera: '…', segunda: '…' },
  // P3_disenso: { primera: '…', segunda: '…' },
  // P4_microagresiones: { primera: '…', segunda: '…' },
  // P5_equidad: { primera: '…', segunda: '…' },
  // P7_liderazgo: { primera: '…', segunda: '…' },
  // P8_agotamiento: { primera: '…', segunda: '…' },
};

/**
 * Resuelve el título editorial de una dimensión con fallback al `dimensionName`.
 * Si no existe entrada explícita, devuelve `{ primera: dimensionName, segunda: '' }`
 * y el componente decide si renderiza la 2da línea.
 */
export function getEditorialTitle(
  dimKey: ComplianceDimensionKey,
  dimensionName: string
): EditorialTitle {
  const explicit = DIMENSION_EDITORIAL_TITLES[dimKey];
  if (explicit) return explicit;
  return { primera: dimensionName, segunda: '' };
}

// ────────────────────────────────────────────────────────────────────────────
// ACTO 1 (Patrón G) — frase del motor por nivel
// ────────────────────────────────────────────────────────────────────────────
// Niveles del diccionario (4) + 'sano_con_focos' que es un caso especial:
// la org está sana en agregado, pero existen deptos bajo umbral en esa dim.

export type ActoLevelKey = ComplianceDimensionLevel | 'sano_con_focos';

export const ACTO1_FRASES: Record<ActoLevelKey, string> = {
  critico: 'El resentimiento se volvió estructural.',
  riesgo: 'Las señales llevan más de un ciclo acumulándose.',
  atencion: 'Hay algo que todavía no se nombra.',
  sano: 'El equilibrio es el resultado, no el punto de partida.',
  sano_con_focos: 'El promedio protege. Los focos exponen.',
};

// ────────────────────────────────────────────────────────────────────────────
// ACTO 3 (Patrón G) — recomendaciones por NIVEL (no por dimensión × nivel)
// ────────────────────────────────────────────────────────────────────────────
// Decisión de scope: una sola recomendación de gestión aplica a TODAS las
// dimensiones que comparten el mismo nivel. La especificidad por dimensión
// vive en `recomendacion` + `planSugerido` del diccionario.

export interface LevelRecommendation {
  urgency: string;
  timeframe: string;
  /**
   * Flag que indica si aplica protocolo legal — solo true en `critico`.
   * El texto del protocolo lo resuelve el consumer vía
   * `getLegalBadgeText(country)` desde `legalBadgeConfig.ts` (multi-país).
   */
  protocol: boolean;
}

export const RECOMMENDATIONS_BY_LEVEL: Record<ActoLevelKey, LevelRecommendation> = {
  critico: {
    urgency: 'Intervención inmediata',
    timeframe: '0-15 días',
    protocol: true,
  },
  riesgo: {
    urgency: 'Plan correctivo estructurado',
    timeframe: '30-60 días',
    protocol: false,
  },
  atencion: {
    urgency: 'Monitoreo reforzado',
    timeframe: '60-90 días',
    protocol: false,
  },
  sano: {
    urgency: 'Mantenimiento del nivel actual',
    timeframe: 'Próximo ciclo',
    protocol: false,
  },
  sano_con_focos: {
    urgency: 'La organización está bien. El problema está concentrado.',
    timeframe: 'Acción focalizada en deptos críticos',
    protocol: false,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// ACTO 2 — labels de Origen del problema
// ────────────────────────────────────────────────────────────────────────────
// Mapping de OrigenPercibido (LLM output) → label ejecutivo legible.
//
// Política: 'mixto' e 'indeterminado' NO se renderizan. Si el motor reporta
// uno de esos valores, el Acto 2 omite el bloque de origen entero (degradación
// elegante — mejor sin info que con info inútil "el origen es mixto").

export const ORIGEN_LABELS: Record<string, string> = {
  vertical_descendente: 'Desde la jefatura directa',
  horizontal_pares: 'Entre compañeros',
  sistemico_procesos: 'En la estructura',
  // Aliases legacy (compat con copy previo del backend):
  jefatura: 'Desde la jefatura directa',
  pares: 'Entre compañeros',
  estructura: 'En la estructura',
  liderazgo: 'Desde la jefatura directa',
  compañeros: 'Entre compañeros',
  organizacional: 'En la estructura',
  // 'mixto' e 'indeterminado' deliberadamente omitidos — los helpers que
  // consumen este mapa devuelven null cuando llegan a esos valores.
};

/**
 * Marcador que el Acto 2 muestra junto al label de origen cuando la fuente
 * es `metaAnalysis.origen_organizacional` (org-aggregated, single value).
 *
 * Backend hoy NO expone `origen_percibido` por departamento. El Acto 2 cae
 * al origen ORG-level y declara explícitamente la granularidad para no
 * engañar al CEO sobre la especificidad del dato.
 */
export const ORIGEN_ORG_SCOPE_NOTE = 'Patrón a nivel organización';

// ────────────────────────────────────────────────────────────────────────────
// PLAN CONSOLIDADO (Pantalla 4) — copy de estados especiales
// ────────────────────────────────────────────────────────────────────────────

/** Hay focos activos pero el CEO no registró ninguna decisión. */
export const PLAN_CONSOLIDADO_FRANCOTIRADOR = [
  'Tu organización tiene focos activos.',
  'El análisis los identificó.',
  'Las intervenciones están disponibles.',
  'Lo que falta es la decisión.',
].join('\n');

/** Toda la org en sano sin focos críticos — copy aprobado. */
export const PLAN_CONSOLIDADO_TODO_SANO = [
  'Tu organización está en buen estado.',
  'El trabajo ahora es mantenerlo.',
  'El próximo ciclo confirmará si las condiciones se sostienen o empiezan a cambiar.',
].join('\n');

// ────────────────────────────────────────────────────────────────────────────
// COPY del flujo (CTAs, headers de actos, etc.)
// ────────────────────────────────────────────────────────────────────────────

export const FLOW_COPY = {
  isaPortada: {
    contextTag: 'Diagnóstico de Ambiente Sano',
    scoreLabel: 'Safety Score / 100',
    cta: 'Ver dimensiones →',
  },
  hub: {
    title: 'Dimensiones',
    subtitle: 'Las 6 dimensiones que componen tu Safety Score',
    backCta: '← Volver',
    footerCtaSingular: 'decisión registrada — Ver plan →',
    footerCtaPlural: 'decisiones registradas — Ver plan →',
  },
  patronG: {
    headerBackCta: 'Volver',
    pasoLabel: 'Paso',
    deLabel: 'de',
    actos: {
      acto1: {
        cta: 'Ver diagnóstico →',
        /** Flujo abreviado: dim sana sin focos. CTA único que vuelve al Hub. */
        ctaCelebracion: 'Volver al hub →',
      },
      acto2: { cta: 'Ver recomendación →' },
      acto3: {
        ctaConFocos: 'Ver dónde se concentra →',
        ctaSinFocos: 'Registrar decisión →',
      },
      acto4: { cta: 'Registrar decisión →' },
      acto5: {
        cta: 'Guardar y continuar →',
        ctaCelebracion: 'Volver al hub →',
        labelOrg: 'Plan organizacional',
        labelDept: 'Plan departamental',
        textareaPlaceholder: 'Adapta este plan a tu contexto...',
      },
    },
  },
  planConsolidado: {
    title: 'Plan de este ciclo',
    backCta: '← Volver al hub',
    exportCta: 'Exportar plan',
    scopeOrg: 'Organización',
    columnDimension: 'Dimensión',
    columnScope: 'Scope',
    columnAccion: 'Acción comprometida',
  },
} as const;
