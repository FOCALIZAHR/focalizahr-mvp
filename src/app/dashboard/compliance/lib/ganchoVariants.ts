// src/app/dashboard/compliance/lib/ganchoVariants.ts
// Selector + copy del Gancho (Síntesis del ciclo). El gancho NO clasifica: lee
// el diagnosticType ya resuelto por AmbienteSynthesisEngine y, dentro de los
// tipos sanos, parte por coverageGap (matriz de 2 ejes: foco x participación).
//
// Copy verbatim aprobada por Victor:
//   - 4 variantes (Crítico / Riesgo+silencio / Sano pleno / Sano de pocos):
//     HANDOFF_CABLEADO_GANCHO.md §3.
//   - 3 sabores de Atención (Teatro / Observación / Bien-con-focos):
//     DECISION_ATENCION_3_SABORES.md.
// Ninguna copy usa {dimFoco} (sus fuentes no lo proveen de forma confiable).
// Único placeholder: {n} = orgISA, interpolado en render.

import type { DiagnosticType } from '@/types/ambiente-cascada';

export type GanchoVariantKey =
  | 'critico'
  | 'riesgo_silencio'
  | 'atencion_teatro'
  | 'atencion_observacion'
  | 'atencion_bien_focos'
  | 'sano_pleno'
  | 'sano_de_pocos'
  | 'generic';

/** Umbral de cobertura que separa "pleno" de "de pocos" dentro de los tipos
 *  sanos. Fuente única = classifyD4 (todo-bien exige gap<30). NO re-derivar:
 *  leer report.data.beat1Seed.classifyD4Trace.coverageGapPct. */
export const GANCHO_GAP_DE_POCOS = 30;

/** Paleta anti-semáforo sellada (ESTADO_CASCADA). purple reservado a IA, no se
 *  usa acá. El tono lo canta una sola cosa: el StatusBadge + la Tesla Line. */
const TONE = {
  critico: '#EA580C',
  riesgo: '#F59E0B',
  atencion: '#94A3B8',
  sano: '#22D3EE',
} as const;

export interface GanchoVariant {
  /** Etiqueta corta del StatusBadge (nivel). */
  badgeLabel: string;
  /** Color de tono (StatusBadge + Tesla Line). Anti-semáforo. */
  tone: string;
  /** Narrativa principal. `{n}` = orgISA, interpolado en render. '' en generic. */
  titular: string;
  /** Insight en cursiva (segunda línea). '' cuando no aplica. */
  insight: string;
}

export const GANCHO_VARIANTS: Record<GanchoVariantKey, GanchoVariant> = {
  critico: {
    badgeLabel: 'Crítico',
    tone: TONE.critico,
    titular:
      'El ambiente no es sano: empieza a ser tóxico. Cerró en {n}, y el deterioro ya tiene historia.',
    insight:
      'Lo que no se atiende, se consolida. Manda la señal equivocada a toda la organización. Y cuando explota, ya nadie puede decir que fue una sorpresa.',
  },
  riesgo_silencio: {
    badgeLabel: 'Riesgo',
    tone: TONE.riesgo,
    titular:
      'El silencio no es calma. En las áreas evaluadas, las personas guardan información por temor. Eso ya tiene un costo, y se ve. El ambiente cerró en {n}.',
    insight:
      'Un buen número tranquiliza. Pero sin conocer el punto ciego, esa tranquilidad se vuelve creer que no hay problema. Ahí es donde se vuelve peligroso.',
  },
  atencion_teatro: {
    badgeLabel: 'Atención',
    tone: TONE.atencion,
    titular:
      'El número tranquiliza: {n} de 100. Pero las palabras no acompañan al número. Donde el dato dice "bien", el texto libre dice otra cosa.',
    insight:
      'Cuando los números y las palabras no coinciden, suelen ganar las palabras. El número es lo que se mide; el texto es lo que no se pudo contener.',
  },
  atencion_observacion: {
    badgeLabel: 'Atención',
    tone: TONE.atencion,
    titular:
      'El ambiente está sano, pero no tranquilo: {n} de 100, con señales parejas de desgaste. Nada concentra el problema todavía, y por eso es fácil no verlo.',
    insight:
      'No hay un incendio que apunte dónde mirar. Hay una erosión pareja, del tipo que avisa antes de tener un foco. Esperar a que se concentre es esperar a que sea tarde.',
  },
  atencion_bien_focos: {
    badgeLabel: 'Atención',
    tone: TONE.atencion,
    titular:
      'El ambiente general protege: {n} de 100. Pero el promedio tiene un punto oscuro: un área quedó en riesgo, y el buen número la tapa.',
    insight:
      'Un promedio sano puede esconder un foco. Lo que para la organización es un buen número, para esa área es el lugar donde algo no funciona.',
  },
  sano_pleno: {
    badgeLabel: 'Sano',
    tone: TONE.sano,
    titular:
      'El ambiente protege: cerró en {n} de 100, con la voz de casi todos. Es un resultado raro, y es valioso.',
    insight:
      'No aparecen señales que digan lo contrario. Eso no se mantiene solo: se mantiene porque alguien lo cuida. El día que se deja de cuidar, es el primero en cambiar.',
  },
  sano_de_pocos: {
    badgeLabel: 'Atención',
    tone: TONE.atencion,
    titular:
      'El número es bueno: {n}. Pero habla de pocos. Lo que falta no es nota, es voz.',
    insight:
      'Un buen número de pocos no es un buen número. Tiene altas probabilidades de ser bueno solo para algunos, y de esconder a los que no hablaron.',
  },
  // GENERIC = Mundo A (orgISA null: ningún depto alcanzó n>=5). Copy de
  // cobertura-por-área — dice la verdad del umbral, no "no hay respuestas".
  generic: {
    badgeLabel: 'Cobertura',
    tone: TONE.atencion,
    titular:
      'Ningún área reunió suficientes respuestas para leer el ambiente sin exponer a nadie.',
    insight: 'El diagnóstico necesita más voces por equipo, no en total.',
  },
};

/** Caption del estado ISA parcial (Opción A): el orgISA es safety-only porque
 *  ningún equipo reunió las 5 respuestas mínimas. Lenguaje de negocio (versión B). */
export const ISA_PARCIAL_CAPTION =
  'El número es global. El detalle por área queda fuera de alcance: ningún equipo reunió las 5 respuestas que se necesitan para leerlo sin exponer a nadie. El problema antes que el ambiente es la participación.';

/**
 * Selecciona la variante del gancho. El motor ya clasificó el mundo
 * (`diagnosticType`); el corte pleno/de-pocos se aplica SOLO dentro de los
 * tipos sanos, por coverageGap (matriz de 2 ejes). Pure.
 *
 * `orgISA === null` → generic: la copy verbatim incrusta `{n} de 100` y sin
 * número no se puede renderizar fiel (caso campaña sin ISA).
 */
export function selectGanchoVariant(
  diagnosticType: DiagnosticType,
  coverageGapPct: number,
  orgISA: number | null,
): GanchoVariantKey {
  if (orgISA === null) return 'generic';

  switch (diagnosticType) {
    case 'FUEGO_LEGAL':
    case 'CONCENTRACION_MANDO':
    case 'SISTEMICO_SIN_MANDO':
      return 'critico';
    case 'SILENCIO_SIN_VOZ':
      return 'riesgo_silencio';
    case 'CONTRADICCION_TEATRO':
      return 'atencion_teatro';
    case 'OBSERVACION_SIN_FOCO':
      return 'atencion_observacion';
    case 'TODO_BIEN':
      return coverageGapPct >= GANCHO_GAP_DE_POCOS ? 'sano_de_pocos' : 'sano_pleno';
    case 'BIEN_CON_FOCOS':
      return coverageGapPct >= GANCHO_GAP_DE_POCOS ? 'sano_de_pocos' : 'atencion_bien_focos';
    case 'GENERIC':
    default:
      return 'generic';
  }
}

/** Reemplaza `{n}` por orgISA. No-op sobre string vacío. Pure. */
export function interpolateGancho(text: string, orgISA: number | null): string {
  if (!text) return text;
  return text.replace(/\{n\}/g, orgISA !== null ? String(orgISA) : '');
}
