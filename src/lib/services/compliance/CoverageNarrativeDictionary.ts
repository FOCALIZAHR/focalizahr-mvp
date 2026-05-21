// src/lib/services/compliance/CoverageNarrativeDictionary.ts
// ────────────────────────────────────────────────────────────────────────────
// Diccionario centralizado del Acto 0 "La Cobertura" — Cascada Ejecutiva.
// Copy verbatim aprobado por Victor, sin em dashes (—) — reemplazados por
// punto o coma. Auditado vs las 6 Reglas de Oro (skill focalizahr-narrativas).
//
// Arquitectura de tokens:
//   El dictionary devuelve `NarrativeToken[]` por cada bloque (P1/P2/coaching/
//   sub-hallazgo) en vez de un string plano. Esto permite que el componente
//   renderice spans con estilos distintos (bold dept names, % en color del
//   ancla, badges legales/fuente con tooltip) sin que la lógica de copy se
//   ensucie en el JSX. Los textos de tooltip y badge legal viven acá, no en
//   el componente.
// ────────────────────────────────────────────────────────────────────────────

import type { SilencioVozExternaItem } from './CoverageAnalysisService';

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES DEL SHELL
// ════════════════════════════════════════════════════════════════════════════

export const ACT_LABEL = 'La Cobertura';
export const HERO_LABEL_SILENCIO = 'ÁREAS EN SILENCIO';
export const HERO_LABEL_VOZ = 'ÁREAS CON VOZ CONFIABLE';
export const SUBTLE_LINK = 'Ver la cobertura por área';
export const SILENCIO_YA_HABLA_EYEBROW = 'El silencio que ya habla';

// ════════════════════════════════════════════════════════════════════════════
// TOKENS NARRATIVOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Token narrativo — unidad atómica que el componente renderiza con estilo
 * según `type`. Permite mezclar texto plano, %s acentuados, dept names en
 * bold, tooltips inline y badges legales sin meter JSX en el dictionary.
 */
export type NarrativeToken =
  | { type: 'text'; value: string }
  | { type: 'pct'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'tooltip'; value: string; tooltipKey: 'onboarding' | 'exit' }
  | { type: 'legal' };

// ════════════════════════════════════════════════════════════════════════════
// TOOLTIPS DE FUENTE — onboarding / exit
// ════════════════════════════════════════════════════════════════════════════

export const SOURCE_TOOLTIPS: Record<'onboarding' | 'exit', string> = {
  onboarding:
    'Onboarding escucha a quienes recién entraron. Cuando los primeros meses no van bien, suele ser la primera señal de un problema de ambiente, antes de que aparezca en cualquier otro lado.',
  exit:
    'Exit escucha a quienes se van. Enciende una alerta cuando una salida deja ver algo que va más allá de esa persona: un patrón que toca a quienes se quedan.',
};

// ════════════════════════════════════════════════════════════════════════════
// BADGE LEGAL — keyed por país
// ════════════════════════════════════════════════════════════════════════════

export interface LegalBadge {
  label: string;
  tooltip: string;
}

export const LEGAL_BADGE_CONFIG: Record<string, LegalBadge> = {
  CL: {
    label: 'riesgo Ley Karin',
    tooltip:
      'Ley Karin (Chile): no es una denuncia, es un indicio temprano de ambiente no seguro. Verlo ahora, junto a las demás señales, es la oportunidad de actuar antes de que escale.',
  },
  default: {
    label: 'riesgo de cumplimiento',
    tooltip:
      'Cuando un área muestra señales críticas de ambiente no seguro, la revisión interna corresponde por marco legal local.',
  },
};

/** Devuelve la config del badge legal para un país. ISO-2 uppercase (CL, AR, MX…). */
export function legalBadgeForCountry(
  country: string | null | undefined,
): LegalBadge {
  const key = (country ?? '').toUpperCase();
  return LEGAL_BADGE_CONFIG[key] ?? LEGAL_BADGE_CONFIG.default;
}

// ════════════════════════════════════════════════════════════════════════════
// MAPEOS INTERNOS — phrases por alertType + alertTypes que activan badge legal
// ════════════════════════════════════════════════════════════════════════════

/** Frase narrativa por alertType de Exit (fallback cuando triggerFactor es null).
 *  Sin prefijo "En [dept]" — se compone en buildLineaTokens. Sin em dashes. */
const EXIT_PHRASE_BY_ALERTTYPE: Record<string, string> = {
  ley_karin: 'hay una alerta por ambiente no seguro',
  liderazgo_concentracion: 'alguien se fue, y la salida apuntó al liderazgo',
  nps_critico: 'el eNPS de salida cayó a zona crítica',
  toxic_exit_detected: 'una salida marcó condiciones tóxicas',
  department_exit_pattern: 'el patrón de salidas se intensificó',
  onboarding_exit_correlation:
    'salidas precedidas de señales tempranas no se atendieron',
};

/** AlertTypes que activan el badge legal inline.
 *  Hoy solo `ley_karin`; otros futuros se agregan acá. */
const ALERT_TYPE_LEGAL: Set<string> = new Set(['ley_karin']);

// ════════════════════════════════════════════════════════════════════════════
// PAYLOAD COMÚN
// ════════════════════════════════════════════════════════════════════════════

export interface CoveragePayload {
  /** Total áreas del universo visible. */
  total: number;
  /** Áreas con análisis COMPLETED. */
  conVoz: number;
  /** Áreas sin voz interna confiable (total − conVoz). */
  silencio: number;
  /** % cobertura (0-100, redondeado). */
  pctVoz: number;
  /** % silencio (0-100, redondeado, complemento del pctVoz). */
  pctSilencio: number;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE PLURALIZACIÓN — uso interno
// ════════════════════════════════════════════════════════════════════════════

/** Entero 1-9 → palabra femenina en español. ≥10 devuelve la cifra. */
function numWord(n: number): string {
  const map: Record<number, string> = {
    1: 'una',
    2: 'dos',
    3: 'tres',
    4: 'cuatro',
    5: 'cinco',
    6: 'seis',
    7: 'siete',
    8: 'ocho',
    9: 'nueve',
  };
  return map[n] ?? String(n);
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA PRINCIPAL — P1 + P2 como tokens
// ════════════════════════════════════════════════════════════════════════════

/**
 * Devuelve los 2 párrafos de la narrativa principal según escenario.
 * Cubre "silencio dominante" (silencio ≥ conVoz) con copy aprobado.
 * "Voz dominante" tiene tokens placeholder pendientes de pulir.
 */
export function buildNarrativaPrincipal(p: CoveragePayload): {
  p1: NarrativeToken[];
  p2: NarrativeToken[];
} {
  // Silence-dominant — copy aprobado, sin em dashes.
  if (p.silencio >= p.conVoz && p.silencio > 0) {
    return {
      p1: [
        { type: 'text', value: 'Solo el ' },
        { type: 'pct', value: `${p.pctVoz}%` },
        { type: 'text', value: ' de las áreas respondió este ciclo. El ' },
        { type: 'pct', value: `${p.pctSilencio}%` },
        { type: 'text', value: ' está en silencio.' },
      ],
      p2: [
        {
          type: 'text',
          value:
            'Y un área que no habla no es un área en calma: es un área que no puedes ver. ' +
            'Y lo que no puedes ver, no lo puedes prevenir. ' +
            'El deterioro de un ambiente no avisa antes de estallar; ' +
            'crece callado hasta que sale por donde más caro cuesta. ' +
            'Hoy ese punto ciego cubre al ',
        },
        { type: 'pct', value: `${p.pctSilencio}%` },
        { type: 'text', value: ' del negocio.' },
      ],
    };
  }

  // Voz dominante — placeholder.
  if (p.silencio === 0) {
    return {
      p1: [
        {
          type: 'text',
          value: `Las ${p.total} áreas del negocio hablaron este ciclo.`,
        },
      ],
      p2: [
        {
          type: 'text',
          value:
            'La lectura que sigue tiene base completa: ninguna área quedó sin escuchar.',
        },
      ],
    };
  }
  return {
    p1: [
      { type: 'text', value: 'El ' },
      { type: 'pct', value: `${p.pctVoz}%` },
      { type: 'text', value: ' de las áreas del negocio respondió este ciclo.' },
    ],
    p2: [
      {
        type: 'text',
        value:
          `La lectura que sigue se sostiene en ${p.conVoz === 1 ? 'esa área' : `esas ${p.conVoz} áreas`}. El `,
      },
      { type: 'pct', value: `${p.pctSilencio}%` },
      {
        type: 'text',
        value: ' restante queda por leerse a través de otras fuentes.',
      },
    ],
  };
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-HALLAZGO "EL SILENCIO QUE YA HABLA"
// ════════════════════════════════════════════════════════════════════════════

export interface SilencioYaHablaLine {
  /** Para el badge de fuente al inicio de la línea. */
  tipoSenal: 'exit' | 'onboarding' | 'otra';
  /** Tokens de la línea (sin el badge — el componente lo prefija). */
  tokens: NarrativeToken[];
}

export interface SilencioYaHablaContent {
  /** Frase del cruce participantes vs no-participantes. Solo en rama A. */
  fraseCruce: NarrativeToken[] | null;
  /** Apertura del bloque de señales externas. */
  aperturaSenales: NarrativeToken[] | null;
  /** Una línea por área muda con señal externa. */
  lineas: SilencioYaHablaLine[];
  /** Cierre del bloque de señales externas. */
  cierreSenales: NarrativeToken[] | null;
}

function buildLineaTokens(item: SilencioVozExternaItem): NarrativeToken[] {
  // Exit con triggerFactor poblado — caso preferido.
  if (item.tipoSenal === 'exit' && item.exitFactor) {
    return [
      { type: 'text', value: 'En ' },
      { type: 'bold', value: item.departmentName },
      {
        type: 'text',
        value: ` alguien se fue, y la salida apuntó al ${item.exitFactor}.`,
      },
    ];
  }

  // Exit sin factor — fallback por alertType + badge legal cuando aplica.
  if (item.tipoSenal === 'exit') {
    const phrase = item.exitAlertType
      ? EXIT_PHRASE_BY_ALERTTYPE[item.exitAlertType]
      : null;
    const hasLegal = item.exitAlertType
      ? ALERT_TYPE_LEGAL.has(item.exitAlertType)
      : false;

    const parts: NarrativeToken[] = [
      { type: 'text', value: 'En ' },
      { type: 'bold', value: item.departmentName },
    ];
    if (phrase) {
      parts.push({ type: 'text', value: ` ${phrase}` });
      if (hasLegal) {
        parts.push({ type: 'text', value: ' ' });
        parts.push({ type: 'legal' });
      }
      parts.push({ type: 'text', value: '.' });
    } else {
      parts.push({ type: 'text', value: ' la salida ya está documentada.' });
    }
    return parts;
  }

  // Onboarding bajo — señal de quienes recién entraron.
  if (item.tipoSenal === 'onboarding') {
    return [
      { type: 'text', value: 'En ' },
      { type: 'bold', value: item.departmentName },
      {
        type: 'text',
        value: ', la experiencia de quienes recién entraron es baja.',
      },
    ];
  }

  // Otra fuente — fallback genérico.
  return [
    { type: 'text', value: 'En ' },
    { type: 'bold', value: item.departmentName },
    {
      type: 'text',
      value: ', otras fuentes ya documentaron señales activas.',
    },
  ];
}

/**
 * Construye las piezas del sub-hallazgo "El silencio que ya habla".
 * `incluirCruce=true` en rama A (silence_worse con overlap suficiente).
 */
export function buildSilencioYaHabla(params: {
  items: SilencioVozExternaItem[];
  incluirCruce: boolean;
}): SilencioYaHablaContent {
  const { items, incluirCruce } = params;
  const n = items.length;

  const fraseCruce: NarrativeToken[] | null = incluirCruce
    ? [
        {
          type: 'text',
          value:
            'Y el silencio ya muestra su peso: las áreas que callaron tienen un score de ',
        },
        { type: 'tooltip', value: 'onboarding', tooltipKey: 'onboarding' },
        { type: 'text', value: ' y ' },
        { type: 'tooltip', value: 'salida', tooltipKey: 'exit' },
        {
          type: 'text',
          value:
            ' peor que las que respondieron. Y eso, por sí solo, ya es una señal.',
        },
      ]
    : null;

  if (n === 0) {
    return {
      fraseCruce,
      aperturaSenales: null,
      lineas: [],
      cierreSenales: null,
    };
  }

  const aperturaSenales: NarrativeToken[] =
    n === 1
      ? [
          {
            type: 'text',
            value: 'En una de las áreas mudas, otras fuentes ya dejaron rastro.',
          },
        ]
      : [
          {
            type: 'text',
            value: `En ${numWord(n)} de las áreas mudas, otras fuentes ya dejaron rastro.`,
          },
        ];

  const lineas: SilencioYaHablaLine[] = items.map((item) => ({
    tipoSenal: item.tipoSenal,
    tokens: buildLineaTokens(item),
  }));

  const cierreSenales: NarrativeToken[] =
    n === 1
      ? [
          {
            type: 'text',
            value:
              'Por dentro, no respondió. Por fuera, ya está hablando. Y lo que dice no es bueno.',
          },
        ]
      : [
          {
            type: 'text',
            value: `Por dentro, ninguna respondió. Por fuera, las ${numWord(n)} ya están hablando. Y lo que dicen no es bueno.`,
          },
        ];

  return { fraseCruce, aperturaSenales, lineas, cierreSenales };
}

// ════════════════════════════════════════════════════════════════════════════
// COACHING TIP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Cierre del acto. Cuando silencio domina, lleva el copy aprobado por Victor
 * sin em dashes; cuando voz domina, queda placeholder.
 * Las menciones "onboarding" y "salida" son tooltips inline.
 */
export function buildCoachingTip(
  p: CoveragePayload,
  vozExternaCount: number,
): NarrativeToken[] {
  if (p.silencio >= p.conVoz && p.silencio > 0) {
    const tokens: NarrativeToken[] = [
      { type: 'text', value: 'Lo que sigue es el análisis de ese ' },
      { type: 'pct', value: `${p.pctVoz}%` },
      {
        type: 'text',
        value:
          ' que respondió. El ambiente, la voz, las señales. Es real y sólido, pero es solo el ',
      },
      { type: 'pct', value: `${p.pctVoz}%` },
      { type: 'text', value: '. El ' },
      { type: 'pct', value: `${p.pctSilencio}%` },
      {
        type: 'text',
        value:
          ' restante, este ciclo, solo puede leerse por las señales de ',
      },
      { type: 'tooltip', value: 'onboarding', tooltipKey: 'onboarding' },
      { type: 'text', value: ' y ' },
      { type: 'tooltip', value: 'salida', tooltipKey: 'exit' },
      {
        type: 'text',
        value:
          ' de cada área. No por su propia voz. Cerrar ese punto ciego, subir la participación, es responsabilidad del liderazgo de cada área. Donde no se gestiona, el próximo ciclo vuelve a oscuras.',
      },
    ];
    if (vozExternaCount > 0) {
      tokens.push({
        type: 'text',
        value: ` Hoy, en al menos ${numWord(vozExternaCount)} de esas áreas, los signos vitales del negocio ya marcan preocupación.`,
      });
    }
    return tokens;
  }
  // Voz dominante — placeholder.
  return [
    {
      type: 'text',
      value:
        'La cobertura sólida deja base para tomar decisiones sobre el resto del análisis.',
    },
  ];
}
