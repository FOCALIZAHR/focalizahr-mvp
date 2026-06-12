// ═══════════════════════════════════════════════════════════════════
// buildAnatomia — Beat 3 (La Anatomía) · GATE 3b (el acto)
// src/lib/services/compliance/buildAnatomia.ts
// ═══════════════════════════════════════════════════════════════════
// Pure function — desglosa el número: qué forma tiene el piso de las 6
// dimensiones, cuál condición manda (dimFoco) y por qué el informe apunta ahí.
// Sin LLM. Copy VERBATIM del HANDOFF_GATE_3_ANATOMIA.md (§4.1 formas + §4.6
// cierre + §5 causa raíz) — fuente única ese handoff.
//
// El motor sigue en 1–5; la cascada habla "de 100" (toDisplay100). Nivel
// canónico = classifyDimensionLevel (vía orgDimensions). Regla puente: nunca
// getISARiskLevel acá.
// ═══════════════════════════════════════════════════════════════════

import {
  dimFoco,
  toDisplay100,
  DIM_FOCO_PRECEDENCE,
  type OrgDimension,
} from './orgDimensions';
import {
  DIMENSION_CEO_LABELS,
  getDimensionNarrative,
  type ComplianceDimensionKey,
  type ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import { DIMENSION_LABELS } from '@/app/dashboard/compliance/lib/labels';

// ════════════════════════════════════════════════════════════════════════════
// COPY — verbatim del handoff §4.1 / §4.6 / §5 + nota llana §4.1
// ════════════════════════════════════════════════════════════════════════════

/** Versión llana de cada dimensión (destacada cyan semibold cuando es el foco).
 *  Nota §4.1 — sin la aposición "la condición menos golpeada" (veto Victor). */
const DIM_LLANA: Record<ComplianceDimensionKey, string> = {
  P2_seguridad: 'la seguridad para hablar',
  P3_disenso: 'el espacio para no estar de acuerdo',
  P4_microagresiones: 'el trato del día a día',
  P5_equidad: 'la equidad de reglas',
  P7_liderazgo: 'la calidad del liderazgo',
  P8_agotamiento: 'el desgaste de convivir',
};

/** ⓘ del foco (§4.1). */
export const FOCO_INFO =
  'El foco se elige entre las dimensiones del nivel más grave: la que condiciona a las demás.';

/** Colección "Causa Raíz" (§5, APROBADA verbatim — se muestra solo la del foco). */
const CAUSA_RAIZ: Record<ComplianceDimensionKey, string> = {
  P2_seguridad:
    'Esta es la hemorragia principal de la unidad: si el equipo siente que hablar es peligroso, las respuestas del resto de las dimensiones pueden estar maquilladas. El talento está gastando energía en protegerse, no en resolver problemas.',
  P7_liderazgo:
    'El deterioro tiene un cuello de botella estructural: la relación con la jefatura directa. Se prioriza esta condición porque, mientras no cambie, cualquier intervención en el equipo se queda en la superficie.',
  P3_disenso:
    'Esta condición se vuelve urgente porque la dirección está operando a ciegas: cuando discrepar se paga caro, el talento deja de advertir las fallas tempranas, y las malas noticias llegan cuando ya son caras.',
  P5_equidad:
    'La prioridad es la fractura del contrato de confianza: el equipo percibe un sistema amañado donde el mérito no define las oportunidades. Cuando la equidad cae a este punto, lo que sigue es un equipo que cumple lo mínimo y deja de proponer.',
  P4_microagresiones:
    'El trato hostil aparece normalizado en el día a día. Esto dejó de ser un problema de clima: es el tipo de condición que, sostenida, antecede a los hechos que terminan en revisión formal. Y el desgaste que produce acelera la fuga del talento que más cuesta reponer.',
  P8_agotamiento:
    'El foco no es el volumen de trabajo: es el costo de interactuar en este equipo. El desgaste relacional en este nivel es el que antecede al ausentismo y a las licencias, y no se recupera con descanso, porque la causa no es la carga.',
};

/** Kicker por nivel (§4.3). "EN SANO" inferido (el handoff lista los 3 graves;
 *  sano solo aparece en TODO SANO). */
const LEVEL_KICKER: Record<ComplianceDimensionLevel, string> = {
  critico: 'EN CRÍTICO',
  riesgo: 'EN RIESGO',
  atencion: 'EN ATENCIÓN',
  sano: 'EN SANO',
};

const LEVEL_SEVERITY: Record<ComplianceDimensionLevel, number> = {
  critico: 0,
  riesgo: 1,
  atencion: 2,
  sano: 3,
};

const SCALE_LINE = 'Escala 0–100 · un ambiente sano parte en 75';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ════════════════════════════════════════════════════════════════════════════

export type AnatomiaForma =
  | 'DESPAREJO'
  | 'DESPAREJO_SINGULAR'
  | 'TODO_BAJO'
  | 'TODO_SANO';

/** Párrafo del foco con el tramo a destacar (cyan semibold) aislado. */
export interface FocoParrafo {
  pre: string;
  /** Versión llana de la dimensión foco — destacada cyan semibold + ⓘ. */
  foco: string;
  post: string;
}

export interface AnatomiaDimLine {
  key: ComplianceDimensionKey;
  labelCEO: string;
  display: number; // 0-100
}

export interface AnatomiaGrupo {
  level: ComplianceDimensionLevel;
  kicker: string; // "EN CRÍTICO" etc.
  items: AnatomiaDimLine[]; // ordenadas por precedencia dentro del nivel
}

export interface AnatomiaActo {
  hero: {
    dimsEnSano: number;
    total: number;
    /** ámbar salvo que TODAS estén en sano → cyan. */
    color: 'amber' | 'cyan';
  };
  forma: AnatomiaForma;
  /** Narrativa de forma (§4.1) — titular bold + párrafos planos + foco + cierre. */
  titular: string;
  parrafos: string[];
  /** null en TODO SANO (sin foco). */
  focoParrafo: FocoParrafo | null;
  /** Dimensión foco (null en TODO SANO). */
  focoKey: ComplianceDimensionKey | null;
  /** Causa raíz del foco (§5) — null en TODO SANO. */
  causaRaiz: string | null;
  /** Listado por gravedad (§4.3). */
  grupos: AnatomiaGrupo[];
  scaleLine: string;
  modalLink: string;
  /** Cierre cursiva del set de formas (§4.6). */
  cierre: string;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function precIndex(key: ComplianceDimensionKey): number {
  return DIM_FOCO_PRECEDENCE.indexOf(key);
}

/** Agrupa por nivel (orden severidad), items por precedencia dentro del nivel. */
function buildGrupos(dims: OrgDimension[]): AnatomiaGrupo[] {
  const byLevel = new Map<ComplianceDimensionLevel, AnatomiaDimLine[]>();
  for (const d of dims) {
    const line: AnatomiaDimLine = {
      key: d.key,
      labelCEO: DIMENSION_CEO_LABELS[d.key],
      display: toDisplay100(d.valor),
    };
    const list = byLevel.get(d.level) ?? [];
    list.push(line);
    byLevel.set(d.level, list);
  }
  const grupos: AnatomiaGrupo[] = [];
  for (const level of ['critico', 'riesgo', 'atencion', 'sano'] as ComplianceDimensionLevel[]) {
    const items = byLevel.get(level);
    if (!items || items.length === 0) continue;
    items.sort((a, b) => precIndex(a.key) - precIndex(b.key));
    grupos.push({ level, kicker: LEVEL_KICKER[level], items });
  }
  return grupos;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

export function buildAnatomia(
  dims: OrgDimension[],
  orgISA: number,
): AnatomiaActo | null {
  if (dims.length === 0) return null;

  const sanas = dims.filter((d) => d.level === 'sano');
  const noSanas = dims.filter((d) => d.level !== 'sano');
  const total = dims.length;

  // ── Forma (selector §4.1) ───────────────────────────────────────────────
  let forma: AnatomiaForma;
  if (noSanas.length === 0) forma = 'TODO_SANO';
  else if (sanas.length === 0) forma = 'TODO_BAJO';
  else if (noSanas.length === 1) forma = 'DESPAREJO_SINGULAR';
  else forma = 'DESPAREJO';

  const foco = dimFoco(dims); // null solo si TODO SANO
  const focoKey = foco?.key ?? null;
  const focoLlana = foco ? DIM_LLANA[foco.key] : '';

  // Nombres llanos auxiliares.
  const masAlta = [...dims].sort((a, b) => b.valor - a.valor)[0];
  const bajasAsc = [...noSanas].sort((a, b) => a.valor - b.valor);
  const llana = (d: OrgDimension | undefined) => (d ? DIM_LLANA[d.key] : '');

  let titular: string;
  let parrafos: string[];
  let focoParrafo: FocoParrafo | null;
  let cierre: string;

  switch (forma) {
    case 'DESPAREJO': {
      titular = 'El número no se mueve parejo.';
      parrafos = [
        `Lo que mejor se sostiene es ${llana(masAlta)}. No es un punto fuerte, pero es el piso desde donde se construye.`,
        `Lo que más lo arrastra son ${llana(bajasAsc[0])} y ${llana(bajasAsc[1])}, las dos que más caen por debajo de la línea. El ${orgISA} es bajo, sobre todo, por ellas.`,
      ];
      focoParrafo = { pre: 'Y por debajo de todo, una condición define el resto: ', foco: focoLlana, post: '.' };
      cierre = 'Perseguir el promedio no mueve nada. Mover la condición que manda, sí.';
      break;
    }
    case 'DESPAREJO_SINGULAR': {
      titular = 'El número no se mueve parejo.';
      parrafos = [
        `Lo que mejor se sostiene es ${llana(masAlta)}. No es un punto fuerte, pero es el piso desde donde se construye.`,
      ];
      focoParrafo = {
        pre: 'Lo que lo arrastra es ',
        foco: focoLlana,
        post: `, la única por debajo de la línea. El ${orgISA} es bajo, sobre todo, por ella.`,
      };
      cierre = 'Perseguir el promedio no mueve nada. Mover la condición que manda, sí.';
      break;
    }
    case 'TODO_BAJO': {
      titular = 'No hay una grieta: el piso está parejo y bajo.';
      parrafos = [
        'Ninguna condición sostiene al resto: todas caen por debajo de la línea. El problema no está localizado, es transversal.',
      ];
      focoParrafo = { pre: 'Aun así, una pesa más que las demás: ', foco: focoLlana, post: '.' };
      cierre = 'Cuando todo cede a la vez, perseguir el promedio es lo más fácil y lo más inútil.';
      break;
    }
    case 'TODO_SANO':
    default: {
      titular = 'El ambiente es sólido en todo el tablero.';
      parrafos = [
        'Todas las condiciones llegan a terreno sano. No hay una que arrastre al resto.',
        'Es raro, y es valioso. Pero lo sólido se sostiene en lo que no se ve: en que nadie deje de cuidarlo.',
      ];
      focoParrafo = null;
      cierre = 'Lo que hoy está sano no manda factura. La manda el día que se descuida.';
      break;
    }
  }

  const dimsEnSano = sanas.length;

  return {
    hero: {
      dimsEnSano,
      total,
      color: dimsEnSano === total ? 'cyan' : 'amber',
    },
    forma,
    titular,
    parrafos,
    focoParrafo,
    focoKey,
    causaRaiz: focoKey ? CAUSA_RAIZ[focoKey] : null,
    grupos: buildGrupos(dims),
    scaleLine: SCALE_LINE,
    modalLink: `Ver el detalle de las ${total} dimensiones →`,
    cierre,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL "Ver el detalle" — GATE 3c (§6)
// ════════════════════════════════════════════════════════════════════════════
// Mismo lenguaje cascada. Agrupado por nivel; por dimensión:
//   {CEO label} · {display} de 100 — {DIMENSION_LABELS en minúscula}
//   + resolveDimensionNarrative(dim, score) VERBATIM (headline + body del motor).
// La escala se declara UNA vez (header).

const MODAL_SCALE_LINE =
  'Escala de 0 a 100 · sano desde 75 · ordenadas por gravedad y precedencia';

export interface AnatomiaModalDim {
  key: ComplianceDimensionKey;
  labelCEO: string;
  display: number; // 0-100
  /** DIMENSION_LABELS con inicial en minúscula (aposición → subtítulo fino). */
  labelLower: string;
  /** Headline del motor VERBATIM (cursiva diferenciada en el render). */
  headline: string;
  /** Body del motor VERBATIM. */
  body: string;
}

export interface AnatomiaModalGrupo {
  level: ComplianceDimensionLevel;
  kicker: string;
  dims: AnatomiaModalDim[];
}

export interface AnatomiaModal {
  /** Header §6 — verbatim ("Las seis dimensiones"; el instrumento es 6-dim). */
  header: string;
  scaleLine: string;
  grupos: AnatomiaModalGrupo[];
}

/** Minúscula inicial — DIMENSION_LABELS es standalone ("Lo que…"); en aposición
 *  va en minúscula. Mismo patrón que la Apertura (lowerFirst). */
function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export function buildAnatomiaModal(dims: OrgDimension[]): AnatomiaModal | null {
  if (dims.length === 0) return null;
  const byLevel = new Map<ComplianceDimensionLevel, AnatomiaModalDim[]>();
  for (const d of dims) {
    const list = byLevel.get(d.level) ?? [];
    const narr = getDimensionNarrative(d.key, d.level);
    list.push({
      key: d.key,
      labelCEO: DIMENSION_CEO_LABELS[d.key],
      display: toDisplay100(d.valor),
      labelLower: lowerFirst(DIMENSION_LABELS[d.key] ?? ''),
      headline: narr.headline,
      body: narr.body,
    });
    byLevel.set(d.level, list);
  }
  const grupos: AnatomiaModalGrupo[] = [];
  for (const level of ['critico', 'riesgo', 'atencion', 'sano'] as ComplianceDimensionLevel[]) {
    const items = byLevel.get(level);
    if (!items || items.length === 0) continue;
    items.sort((a, b) => precIndex(a.key) - precIndex(b.key));
    grupos.push({ level, kicker: LEVEL_KICKER[level], dims: items });
  }
  return { header: 'Las seis dimensiones', scaleLine: MODAL_SCALE_LINE, grupos };
}

// Re-export para el render (highlight del foco) y oráculos.
export { DIM_LLANA, LEVEL_SEVERITY };
