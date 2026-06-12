'use client';

// src/components/compliance/cascada/ActoAmbiente.tsx
// Beat 1 de la Cascada — "La Apertura". Absorbe el silencio + el "pero" duro
// (contradicción / denuncia formal cuando aplique).
//
// Compone client-side: NO consume narrativa thin del motor. Lee el data del
// payload y clasifica con D4 (sano / silencio-dominante / teatro-dominante /
// mixto). hasDenunciaFormal es ORTOGONAL: sube intensidad +1 y agrega la
// referencia a denuncia formal en el "pero" — no es un mundo aparte.
//
// Vocabulario CEO: la palabra "Teatro de Cumplimiento" NO aparece nunca en
// el render. El sabor 'te_contradice' habla en lenguaje de negocio.

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDepartmentName, stripWrappingQuotes } from '@/lib/utils/formatName';
import { ActSeparator, fadeIn, fadeInDelay } from './shared';
import { getISARiskLevel } from '@/lib/services/compliance/ISAService';
import type { ISARiskLevel } from '@/lib/services/compliance/ISAService';
import { DIMENSION_CEO_LABELS } from '@/config/narratives/ComplianceNarrativeDictionary';
import { DIMENSION_LABELS } from '@/app/dashboard/compliance/lib/labels';
import { getLegalMarcoName } from '@/config/compliance/legalBadgeConfig';
import { legalBadgeForCountry } from '@/lib/services/compliance/CoverageNarrativeDictionary';
import {
  computeOrgDimensions,
  type OrgDimension,
} from '@/lib/services/compliance/orgDimensions';
import { buildGerenciaRollup } from '@/lib/services/compliance/buildGerenciaRollup';
import { deriveBeat1Slots } from '@/lib/services/compliance/deriveBeat1Slots';
import type { Beat1Slots } from '@/lib/services/compliance/deriveBeat1Slots';
import type { ComplianceReportResponse } from '@/types/compliance';
// Cableado 1 (HANDOFF §4): la cascada importa el veredicto/narrativa de ISA por
// nivel (hoy solo lo usaba el dashboard).
import {
  ISA_NARRATIVES,
  classifyIsa,
  type IsaLevel,
} from '@/app/dashboard/compliance/components/sections/SectionDimensiones/_shared/constants';

// ════════════════════════════════════════════════════════════════════════════
// CLASIFICADOR D4 — IMPORT, no re-declaración
// ════════════════════════════════════════════════════════════════════════════
// Gate 1 (2026-06-06) movió la lógica D4 a server-side
// (`@/lib/services/compliance/deriveBeat1Slots`). Razón: el bug "Beat 1
// client-classify + Beat 6 server-synthesize discrepan" se elimina con UNA
// sola autoridad sobre el mundo. Beat 1 y Beat 6 leen `beat1Seed.mundoDominante`.
//
// Re-export de `classifyD4` para no romper consumidores existentes (tests).
// Mismo input/output (más una `trace` adicional que los consumidores ignoran).

import { classifyD4 } from '@/lib/services/compliance/deriveBeat1Slots';
import type { ClassifyD4Output } from '@/lib/services/compliance/deriveBeat1Slots';
import type {
  Mundo,
  Intensidad,
  FactoresTitulares,
  ExtremosTitulares,
} from '@/types/ambiente-cascada';

export { classifyD4 };

// ════════════════════════════════════════════════════════════════════════════
// TITULARES (Gate 5b) — render del bloque de factores + extremos del Beat 1.
// Copy verbatim `.claude/tasks/COPY_TITULARES_BEAT1.md`. Dos sub-bloques
// independientes, cada uno con su rama vacía (null → no se renderiza):
//   A. Factores: UNA voz según banda. Banda alta (fortalezas presentes) celebra;
//      banda baja (debilidades presentes) advierte + fortalezaRelativa si existe.
//      Solo labelCEO — sin el `valor` 1-5 (no rompe el contrato N·Label).
//   B. Extremos: mejor/peor gerencia con ISA 0-100 (entero). Solo si ≥2 gerencias
//      con ISA (mejor && peor); si <2 → null.
// ════════════════════════════════════════════════════════════════════════════

/** Sub-bloque A — una sola voz según qué array pobló el Orchestrator (banda). */
export function buildFactoresLine(f: FactoresTitulares): string | null {
  // Banda alta — fortalezas (celebra lo que sostiene).
  if (f.fortalezas.length >= 2) {
    return `Este ambiente se apoya en ${f.fortalezas[0].labelCEO} y ${f.fortalezas[1].labelCEO}. Es lo más sólido que hoy tiene.`;
  }
  if (f.fortalezas.length === 1) {
    return `Este ambiente se apoya sobre todo en ${f.fortalezas[0].labelCEO}. Es lo más sólido que hoy tiene.`;
  }
  // Banda baja / observación — debilidades (advierte) + relativa si existe.
  if (f.debilidades.length >= 2) {
    const base = `Lo más frágil del ambiente: ${f.debilidades[0].labelCEO} y ${f.debilidades[1].labelCEO}.`;
    return f.fortalezaRelativa
      ? `${base} Lo que menos ha cedido: ${f.fortalezaRelativa.labelCEO}, y es desde ahí, no desde cero.`
      : base;
  }
  if (f.debilidades.length === 1) {
    const base = `Lo más frágil del ambiente: ${f.debilidades[0].labelCEO}.`;
    return f.fortalezaRelativa
      ? `${base} Lo que menos ha cedido: ${f.fortalezaRelativa.labelCEO}.`
      : base;
  }
  // Sin factores (sin safety scores org-level / ISA null) → no se renderiza.
  return null;
}

/** Sub-bloque B — extremos con ISA 0-100 entero. null si <2 gerencias con ISA. */
export function buildExtremosLine(e: ExtremosTitulares): string | null {
  if (e.mejor && e.peor) {
    return `El ambiente no es parejo: ${e.mejor.gerenciaName} es el área más sólida (ISA ${Math.round(e.mejor.isa)}) y ${e.peor.gerenciaName} la más frágil (ISA ${Math.round(e.peor.isa)}).`;
  }
  return null;
}

/** Compone los dos sub-bloques. Cada uno independiente (uno puede ser null). */
export function buildTitularesBeat1(input: {
  factores: FactoresTitulares;
  extremos: ExtremosTitulares;
}): { factores: string | null; extremos: string | null } {
  return {
    factores: buildFactoresLine(input.factores),
    extremos: buildExtremosLine(input.extremos),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// COPY POR MUNDO — VERBATIM de .claude/tasks/ESPEC_APERTURA_AMBIENTE_SANO.md
// Estructura: Subtítulo · Traducción · El pero · Cierre (itálica) +
//             Ortogonales (Género · Ley Karin) ANEXAS después del cierre.
//   - `pero` y ortogonales son `string | null` — null → omitir (degradación).
//   - Ortogonales NO reemplazan el cierre; son líneas adicionales.
//   - Nombres de gerencia pasan por formatDepartmentName() (preserva acrónimos,
//     respeta preposiciones).
//   - {ISA} y {coverage} se renderizan enteros.
//   - {banda} se traduce vía bandaLabel() ('observacion' → "observación", etc).
// ════════════════════════════════════════════════════════════════════════════

interface BeatCopy {
  subtitulo: string;
  traduccion: string;
  /** null → omitir el bloque del "pero". */
  pero: string | null;
  /** Siempre presente. Render en itálica. */
  cierre: string;
  /** ORTOGONAL género — línea adicional después del cierre. null si no hay alerta. */
  generoLine: string | null;
  /** ORTOGONAL Ley Karin — línea adicional después del cierre. null si N === 0. */
  leyKarinLine: string | null;
}

/** Traduce ISARiskLevel canónico al label de banda visible en NÚMERO BAJO. */
const BANDA_LABEL: Record<ISARiskLevel, string> = {
  saludable: 'saludable',
  observacion: 'observación',
  riesgo: 'riesgo',
  critico: 'crítico',
};

// `copyFor` solo necesita el subset {mundo, intensidad, hasDenunciaFormal} del
// classifier — el `trace` es para audit, no para narrar. Subset explícito para
// que callers (incluidos tests) puedan construir el d4 sin la traza.
type D4ForCopy = Pick<ClassifyD4Output, 'mundo' | 'intensidad' | 'hasDenunciaFormal'>;

export function copyFor(
  d4: D4ForCopy,
  slots: Beat1Slots,
  orgISA: number,
  coveragePct: number,
  country: string | null | undefined,
  p2CritEnConIsa: boolean,
): BeatCopy {
  // Nombres formateados (null cuando el slot no aplica).
  const mudaName = slots.gerencia_muda_1
    ? formatDepartmentName(slots.gerencia_muda_1.groupName)
    : null;
  const teatroName = slots.gerencia_teatro_1
    ? formatDepartmentName(slots.gerencia_teatro_1.groupName)
    : null;
  const topName = slots.gerencia_top_1
    ? formatDepartmentName(slots.gerencia_top_1.groupName)
    : null;
  const focoName = slots.gerencia_foco_1
    ? formatDepartmentName(slots.gerencia_foco_1.groupName)
    : null;
  // Ortogonales (género · Ley Karin) — SE CONSERVAN (HANDOFF §1). Extraídas a
  // `buildOrtogonales` para que la Apertura nueva las reuse sin recalcular el
  // switch de mundos de `copyFor`.
  const { generoLine, leyKarinLine } = buildOrtogonales(slots, country);

  let subtitulo: string;
  let traduccion: string;
  let pero: string | null;
  let cierre: string;

  switch (d4.mundo) {
    case 'silencio': {
      // Bindings comunes a las dos ramas — arábigos directos del slot
      // (consistente con Paso 2 commiteado en 2e7f727):
      //   {ISA}    = orgISA
      //   {nResp}  = slots.totalResponded
      //   {nInv}   = slots.totalInvited
      //   {conVoz} = slots.gerencias_universo_total − slots.gerencias_mudas_count
      //   {mudas}  = slots.gerencias_mudas_count
      //   {total}  = slots.gerencias_universo_total
      const nResp = slots.totalResponded;
      const nInv = slots.totalInvited;
      const mudasCount = slots.gerencias_mudas_count;
      const gerenciasTotal = slots.gerencias_universo_total;
      const conVoz = gerenciasTotal - mudasCount;

      if (slots.banda === 'riesgo' && p2CritEnConIsa) {
        // ── CELDA PUENTE — banda=riesgo + P2 crítico en TODOS los con_isa ──
        // Copy verbatim aprobado 2026-06-05. 4 párrafos como prosa corrida
        // (sin callouts border-l-2): se concentran en `traduccion` separados
        // por `\n\n`. El render hace split-and-map para producir 4 <p>
        // planos con space-y-4. `pero` y `cierre` quedan vacíos para omitir
        // los callouts visuales.
        subtitulo = '[EL QUE ELIJA VICTOR]';
        traduccion =
          `Este estudio no puede declarar sano el ambiente de la empresa. ` +
          `Y lo que sí alcanzó a medir no tranquiliza: en las ${conVoz} gerencias que respondieron, ` +
          `casi ninguna dimensión del ambiente llegó a un nivel sano.\n\n` +
          `La que aparece crítica en ambas áreas es, precisamente, la que mide si la gente cree ` +
          `que puede hablar sin consecuencias. Quienes respondieron ya sienten que hablar cuesta.\n\n` +
          `Y ese ${orgISA} son apenas ${nResp} personas de las ${nInv}, en ${conVoz} de las ${gerenciasTotal} gerencias. ` +
          `De las otras ${mudasCount} no entró una sola respuesta. ` +
          `Leído junto a lo anterior, el silencio cambia de sentido: si los que hablaron dicen que ` +
          `hablar no es seguro, el de los demás deja de parecer desinterés.\n\n` +
          `Por eso el informe no puede cerrar el tema como resuelto: lo medido apunta a riesgo, ` +
          `y lo callado pesa en la misma dirección. Ese ambiente no mejora persiguiendo el número, ` +
          `sino atendiendo lo que lo causa: por qué hablar, donde se pudo escuchar, se siente inseguro, ` +
          `y por qué la mayoría no respondió.`;
        pero = null;
        cierre = '';
      } else {
        // ── RESPALDO — placeholder estructural (refinable cuando aparezca caso real) ──
        // Cubre el resto del mundo silencio: otra banda, o banda=riesgo sin
        // P2 crítico en todos los con_isa.
        subtitulo = 'EL SILENCIO ES EL DATO';
        const bandaLabel = BANDA_LABEL[slots.banda];
        traduccion =
          `Donde se pudo medir, el ambiente da ${bandaLabel}. ` +
          `Pero esa lectura son ${nResp} de ${nInv} personas, en ${conVoz} de ${gerenciasTotal} gerencias: ` +
          `del resto no entró respuesta. Vale para quienes hablaron; ` +
          `el silencio de los demás impide leerlo como el cuadro de toda la empresa.`;
        pero = null;
        cierre = '';
      }
      break;
    }

    case 'contradiccion': {
      subtitulo = 'LOS NÚMEROS DICEN UNA COSA, LAS RESPUESTAS ABIERTAS OTRA';
      traduccion =
        'En las preguntas cerradas el equipo respondió bien. ' +
        'En las respuestas abiertas, escribió lo contrario.';

      pero = teatroName
        ? `Responder bien una encuesta es fácil. Escribir lo que de verdad pasa, no. ${teatroName} es el caso más nítido: marca alto, pero lo que escribieron no acompaña. Cuando las dos no coinciden, creele a lo que escribieron.`
        : null;

      cierre =
        'Un buen número apoyado en respuestas abiertas que dicen lo contrario no es un buen número. ' +
        'Es un riesgo que todavía no se hizo visible.';
      break;
    }

    case 'todo-bien': {
      subtitulo = 'LOS NÚMEROS Y LAS RESPUESTAS ABIERTAS COINCIDEN';

      const total = slots.gerencias_medidas_total;
      const sanas = slots.gerencias_sanas_count;
      const sanasPart =
        total > 0
          ? ` ${sanas} de ${total} ${total === 1 ? 'gerencia respondió' : 'gerencias respondieron'} con consistencia entre cerradas y abiertas.`
          : '';
      traduccion =
        `El ISA ${orgISA} no es un promedio que esconde: es un piso que se sostiene.` +
        sanasPart +
        ` Cobertura del ${coveragePct}%.`;

      pero = topName
        ? `Esa coincidencia es lo más difícil de fabricar: los equipos sanos lo son cuando nadie los mira. ${topName} es el caso de referencia. Un ambiente que se cuida solo cuando lo miden no escribe así.`
        : 'Esa coincidencia es lo más difícil de fabricar: los equipos sanos lo son cuando nadie los mira. Un ambiente que se cuida solo cuando lo miden no escribe así.';

      cierre = topName
        ? `Un buen ambiente no se sostiene solo. Este es el momento de proteger lo que funciona, empezando por entender qué hace ${topName} distinto del resto.`
        : 'Un buen ambiente no se sostiene solo. Este es el momento de proteger lo que funciona.';
      break;
    }

    case 'bien-con-focos': {
      subtitulo = 'BIEN EN PROMEDIO, PERO NO PAREJO';

      // Dos sabores: si hay gerencia_foco_1 → sabor riesgo. Si no → sabor
      // cobertura (la rama 4 disparó por gap ∈ [30,50) sin foco).
      if (focoName) {
        // Sabor RIESGO
        traduccion = `Como organización, el ISA ${orgISA} es favorable. Pero el promedio esconde a ${focoName}, que quedó en zona de riesgo.`;
        cierre = `Un ambiente sano con un foco sin atender no sigue sano mucho tiempo. El lugar para mirar no es el promedio, es ${focoName}.`;
      } else {
        // Sabor COBERTURA — degradación graceful del cierre (sin foco que
        // nombrar, omite el tail "es {gerencia_foco_1}").
        traduccion = `Como organización, el ISA ${orgISA} es favorable. Pero la lectura no llega a toda la organización: ${slots.coverage_gap_pct}% de las áreas no respondió.`;
        cierre = 'Un ambiente sano con un foco sin atender no sigue sano mucho tiempo. El lugar para mirar no es el promedio.';
      }

      // El "pero" es el mismo en ambos sabores (verbatim spec).
      pero =
        'Un buen número general tranquiliza, y por eso es peligroso. ' +
        'Hace que el foco pase desapercibido justo donde más importa. ' +
        'La organización está sana; la gerencia, no.';
      break;
    }

    case 'numero-bajo':
    default: {
      subtitulo = 'EL NÚMERO ESTÁ BAJO, Y NO SE ESCONDE';
      const bandaLabel = BANDA_LABEL[slots.banda];
      traduccion =
        `El ISA ${orgISA} cae en zona de ${bandaLabel}. ` +
        'No hay problema de cobertura ni contradicción que lo explique: la organización respondió, y respondió esto.';
      pero =
        'Cuando el número es bajo y nada lo disimula, la causa no está en la medición. ' +
        'Está en el ambiente mismo. Es más incómodo de leer, y es más honesto.';
      cierre =
        'Un número así no mejora porque el ciclo cierre. Mejora cuando alguien mira qué lo sostiene abajo.';
      break;
    }
  }

  return { subtitulo, traduccion, pero, cierre, generoLine, leyKarinLine };
}

// ════════════════════════════════════════════════════════════════════════════
// ORTOGONALES — género · Ley Karin (CONSERVADAS, HANDOFF §1)
// ════════════════════════════════════════════════════════════════════════════
// Extraídas de copyFor sin cambiar su copy. Voz "los que están" (género) y
// "los que se fueron" (Karin histórica cross-Exit). NO reemplazan el cuerpo;
// son líneas adicionales bajo el titular.

export function buildOrtogonales(
  slots: Beat1Slots,
  country: string | null | undefined,
): { generoLine: string | null; leyKarinLine: string | null } {
  const generoName = slots.gerencia_genero_1
    ? formatDepartmentName(slots.gerencia_genero_1.groupName)
    : null;
  const leyKarinName = slots.gerencia_ley_karin_1
    ? formatDepartmentName(slots.gerencia_ley_karin_1.groupName)
    : null;

  // GÉNERO — sanitización de comillas envolventes del literal LLM.
  const generoCitaRaw = slots.gerencia_genero_1?.evidenciaGenero ?? null;
  const generoCita = generoCitaRaw ? stripWrappingQuotes(generoCitaRaw) : null;
  const generoLine =
    generoName && generoCita && generoCita.length > 0
      ? `En ${generoName}, el análisis con IA encontró una expresión con sesgo de género: "${generoCita}". Una sola cita, pero el tipo de frase que, cuando se repite, cambia el cuadro completo.`
      : null;

  // LEY KARIN — marco country-aware (CL → "Ley Karin"; default → normativa local).
  let leyKarinLine: string | null = null;
  if (leyKarinName && slots.gerencia_ley_karin_1) {
    const n = slots.gerencia_ley_karin_1.signalsCount;
    const sustantivo = n === 1 ? 'indicio' : 'indicios';
    const marco = getLegalMarcoName(country);
    leyKarinLine =
      `En ${leyKarinName}, los que se fueron dejaron ${n} ${sustantivo} bajo ${marco} en sus encuestas de salida en los últimos 12 meses. ` +
      `Lo que escribieron al irse vale como pista. La pregunta es si lo que pasa hoy en esa gerencia todavía habla en esa dirección.`;
  }

  return { generoLine, leyKarinLine };
}

// ════════════════════════════════════════════════════════════════════════════
// APERTURA-TITULAR v4 — el cuerpo nuevo del Beat 1 (HANDOFF §2-3)
// ════════════════════════════════════════════════════════════════════════════
// Titular de 3 movimientos: veredicto + pero + foco. Copy verbatim aprobado por
// Victor (2026-06-11). REEMPLAZA el cuerpo narrativo (switch de mundos de
// copyFor); copyFor sigue vivo (tests + classifyD4 motor), solo deja de
// seleccionar el copy del acto.
//
// Copy 100% APROBADO (paquete §A/B/C, Victor 2026-06-11) — ya no hay
// provisionales: veredicto + hero por los 4 niveles, sin-coincidencia mov3 (§B),
// composiciones del pero incl. coexistencia separada/jamás sumada (§C).
// Defaults de selector vigentes (GO Victor): silencio = personResponseRate < 50;
// {n} en palabra (numEs); sano-phrase "casi ninguna" si dimsSano ≤ 1.

/** Fragmento de veredicto por nivel ISA (entra en "El ambiente de la empresa
 *  {veredicto}: …"). APROBADO Victor 2026-06-11 (paquete de copy §A). */
const VEREDICTO_BY_LEVEL: Record<IsaLevel, string> = {
  sano: 'llega a sano',
  atencion: 'se sostiene, pero con señales',
  riesgo: 'no llega a sano',
  critico: 'está en nivel crítico',
};

/** Label del hero por nivel — string propio aprobado (NO derivable del
 *  veredicto). §A; crítico = corrección de Victor (reemplaza "EL AMBIENTE YA
 *  EXPULSA"). */
const HERO_LABEL_BY_LEVEL: Record<IsaLevel, string> = {
  sano: 'UN AMBIENTE QUE HOY PROTEGE',
  atencion: 'SANO, PERO CON SEÑALES',
  riesgo: 'EL AMBIENTE NO LLEGA A SANO',
  critico: 'EL AMBIENTE NO ES SANO, COMIENZA A SER TÓXICO',
};

const NUM_ES = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis'] as const;
/** Número → palabra (1-6, el universo de dimensiones). Fallback a dígito. */
function numEs(n: number): string {
  return NUM_ES[n] ?? String(n);
}

/** Minúscula inicial — `DIMENSION_LABELS` es label standalone ("Lo que…");
 *  en aposición mid-sentence ("— lo que…") va en minúscula (verbatim §2). */
function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export interface AperturaInput {
  orgISA: number; // entero
  isaLevel: IsaLevel; // classifyIsa(orgISA)
  isaNarrative: string; // ISA_NARRATIVES[isaLevel].narrative
  pct: number; // personResponseRate entero
  silencio: boolean; // pct < 50
  indicioCount: number; // Σ rollups[].leyKarin.signalsCount
  denunciaCount: number; // Σ denuncias_12m no-null
  legalBadgeLabel: string; // legalBadgeForCountry(country).label
  dims: OrgDimension[]; // computeOrgDimensions(departments)
}

export interface AperturaTitular {
  heroLabel: string;
  /** veredicto = bold; narrative = ISA_NARRATIVES verbatim. */
  mov1: { veredicto: string; narrative: string };
  /** El pero — null si no aplica (defensivo). */
  mov2: string | null;
  /** El foco — dimCEO en cyan/semibold; coda solo con silencio + P2. */
  mov3: { pre: string; dimCEO: string; dimDesc: string; coda: string | null } | null;
  cierre: string;
  meta: {
    silencio: boolean;
    senal: 'indicio' | 'denuncia' | null;
    /** indicio + denuncia ambos presentes → se nombran por separado (§C), jamás sumados. */
    coexistencia: boolean;
    /** mov3 nombra una dim crítica ≠ P2 → termina en la aposición, sin coda (§B). */
    mov3SinCoincidencia: boolean;
  };
}

/** Parte de señal del "pero" en variante 1 (silencio + señal). Copy §C APROBADO.
 *  Coexistencia: denuncia + indicio nombrados POR SEPARADO, jamás sumados. */
function senalParteV1(
  indicioCount: number,
  denunciaCount: number,
  legalBadge: string,
): string {
  const tieneDen = denunciaCount > 0;
  const tieneInd = indicioCount > 0;

  // Coexistencia — las dos cosas, separadas, JAMÁS sumadas (§C).
  if (tieneDen && tieneInd) {
    const den = `${denunciaCount} ${denunciaCount === 1 ? 'denuncia formal' : 'denuncias formales'}`;
    const ind = `${indicioCount} ${indicioCount === 1 ? 'indicio' : 'indicios'} de ${legalBadge}`;
    return `Y el último año dejó las dos cosas: ${den} y ${ind}. Cada hecho por separado ya eleva la prioridad de revisión.`;
  }

  // Denuncia formal sola (§C).
  if (tieneDen) {
    if (denunciaCount >= 2) {
      return `Y las denuncias formales no son una: ya se acumulan ${denunciaCount} en los últimos 12 meses. La acumulación eleva la prioridad de revisión.`;
    }
    return 'Y en una de las áreas hubo al menos una denuncia formal en los últimos 12 meses: el solo hecho eleva la prioridad de revisión.';
  }

  // Indicio Karin solo.
  if (indicioCount >= 2) {
    // §C count≥2.
    return `Y los indicios no son uno: ya se acumulan ${indicioCount} de ${legalBadge} en el último año. La acumulación eleva la prioridad de revisión.`;
  }
  // §2 verbatim (count=1).
  return `Y en una de las áreas, el último año dejó un indicio de ${legalBadge}: el solo hecho eleva la prioridad de revisión.`;
}

/** Parte de señal del "pero" en variante 3 (sin silencio + señal). Best-effort. */
function senalParteV3(
  senal: 'indicio' | 'denuncia',
  indicioCount: number,
  denunciaCount: number,
  legalBadge: string,
): string {
  if (senal === 'denuncia') {
    const n = denunciaCount;
    const s = n === 1 ? 'denuncia formal' : 'denuncias formales';
    return `Lo que el número no muestra: ${n} ${s} en el último año. El hecho solo ya eleva la prioridad de revisión.`;
  }
  const n = indicioCount;
  const s = n === 1 ? 'indicio' : 'indicios';
  return `Lo que el número no muestra: ${n} ${s} de ${legalBadge} en el último año. El hecho solo ya eleva la prioridad de revisión.`;
}

/** Construye el titular de 3 movimientos. Pure. */
export function buildAperturaTitular(input: AperturaInput): AperturaTitular {
  const {
    orgISA,
    isaLevel,
    isaNarrative,
    pct,
    silencio,
    indicioCount,
    denunciaCount,
    legalBadgeLabel,
    dims,
  } = input;

  // ── Movimiento 1 — Veredicto ──
  const heroLabel = HERO_LABEL_BY_LEVEL[isaLevel];
  const mov1 = {
    veredicto: `El ambiente de la empresa ${VEREDICTO_BY_LEVEL[isaLevel]}: el índice cerró en ${orgISA} de 100.`,
    narrative: isaNarrative,
  };

  // ── Señal legal — precedencia denuncia > indicio; jamás se suman ──
  const senal: 'indicio' | 'denuncia' | null =
    denunciaCount > 0 ? 'denuncia' : indicioCount > 0 ? 'indicio' : null;
  const coexistencia = denunciaCount > 0 && indicioCount > 0;

  // ── Movimiento 2 — El pero (4 variantes por silencio × señal) ──
  let mov2: string | null;
  if (silencio && senal) {
    // Variante 1 (caso real).
    const sil = `Pero esa salud de ${orgISA} describe al ${pct}% que respondió. Sobre el resto de la empresa, el estudio todavía no tiene voz.`;
    mov2 = `${sil} ${senalParteV1(indicioCount, denunciaCount, legalBadgeLabel)}`;
  } else if (silencio && !senal) {
    // Variante 2.
    mov2 = `Ese ${orgISA} describe al ${pct}% que respondió. Sobre el resto de la empresa, el estudio todavía no tiene voz.`;
  } else if (!silencio && senal) {
    // Variante 3.
    mov2 = `El ${orgISA} llega con la voz de la mayoría: respondió el ${pct}% de la empresa. ${senalParteV3(senal, indicioCount, denunciaCount, legalBadgeLabel)}`;
  } else {
    // Variante 4 (limpio).
    mov2 = `Y ese ${orgISA} llega con la voz de la mayoría: respondió el ${pct}% de la empresa, y el último año no registra señales alrededor. Esta vez la foto es de toda la organización.`;
  }

  // ── Movimiento 3 — El foco ──
  let mov3: AperturaTitular['mov3'] = null;
  let mov3SinCoincidencia = false;
  if (dims.length > 0) {
    const n = dims.length;
    const sano = dims.filter((d) => d.level === 'sano').length;
    const sanoPhrase =
      sano <= 1
        ? 'casi ninguna alcanzó el nivel que protege a la gente' // §2 aprobado
        : `solo ${numEs(sano)} de ${numEs(n)} alcanzaron el nivel que protege a la gente`; // PENDIENTE generalización
    const pre = `De las ${numEs(n)} dimensiones que mide el estudio, ${sanoPhrase}.`;

    const p2 = dims.find((d) => d.key === 'P2_seguridad');
    const p2Crit = p2 ? p2.level === 'critico' || p2.level === 'riesgo' : false;

    if (p2Crit) {
      // Dimensión nombrada = P2 (Seguridad psicológica). Coda solo con silencio.
      mov3 = {
        pre,
        dimCEO: DIMENSION_CEO_LABELS.P2_seguridad,
        dimDesc: lowerFirst(DIMENSION_LABELS.P2_seguridad),
        coda: silencio
          ? 'Si los que respondieron ya dicen que hablar no es seguro, que tantos hayan callado deja de parecer desinterés: empieza a parecer lo mismo.'
          : null,
      };
    } else {
      // Sin-coincidencia: la dim crítica no es P2 → termina en la aposición,
      // sin coda de silencio. Copy §B APROBADO (misma estructura que el render).
      const crit = [...dims].sort((a, b) => a.valor - b.valor)[0];
      mov3SinCoincidencia = true;
      mov3 = {
        pre,
        dimCEO: DIMENSION_CEO_LABELS[crit.key],
        dimDesc: lowerFirst(DIMENSION_LABELS[crit.key] ?? ''),
        coda: null,
      };
    }
  }

  return {
    heroLabel,
    mov1,
    mov2,
    mov3,
    cierre:
      'Un ambiente no mejora persiguiendo el número. Mejora cuando se atiende lo que lo causa.',
    meta: {
      silencio,
      senal,
      coexistencia,
      mov3SinCoincidencia,
    },
  };
}

/** Reconstruye el texto completo del movimiento 3 con el conector que el render
 *  intercala alrededor de la dimensión (oráculo de verbatim para los tests).
 *  El render JSX usa exactamente este conector. */
export function mov3ToText(m: NonNullable<AperturaTitular['mov3']>): string {
  return (
    `${m.pre} Y una de las que está en nivel crítico es justo ${m.dimCEO}: ${m.dimDesc}.` +
    (m.coda !== null ? ` ${m.coda}` : '')
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COLOR HERO POR INTENSIDAD
// ════════════════════════════════════════════════════════════════════════════

function heroColorClass(intensidad: Intensidad, sano: boolean): string {
  if (sano) return 'text-cyan-400';
  switch (intensidad) {
    case 'critico':
      return 'text-violet-400';
    case 'alto':
    case 'medio':
      return 'text-amber-400';
    case 'leve':
    default:
      return 'text-cyan-400';
  }
}

function sepColor(sano: boolean, intensidad: Intensidad): 'cyan' | 'amber' | 'purple' {
  if (sano) return 'cyan';
  if (intensidad === 'critico') return 'purple';
  return 'amber';
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface ActoProps {
  data: ComplianceReportResponse;
}

export default memo(function ActoAmbiente({ data }: ActoProps) {
  const orgISA = data.data.orgISA;
  // Beat 1 NO renderiza sin ISA (no hay número que mostrar). El guard upstream
  // ya gatea la cascada entera por narratives.cascada — defensa en profundidad.
  if (orgISA === null) return null;

  const country = data.company.country;
  const riskScores = data.data.riskScores ?? [];
  const coverage = data.data.coverage;
  const departments = data.data.departments;

  // Conteos del clasificador (género YA NO entra acá — es ortogonal por spec).
  const riesgoDeptos = departments.filter(
    (d) => d.riskLevel === 'risk' || d.riskLevel === 'critical',
  ).length;
  const teatroCount = departments.filter((d) => d.teatroCumplimiento === true).length;
  // ──────────────────────────────────────────────────────────────────────
  // coverageGapPct = % de deptos del universo SIN AS analizado (org-level).
  // NO confundir con SILENCIO_PARTICIPATION_THRESHOLD (per-dept response rate).
  // Son DOS ejes distintos del silencio:
  //   • coverageGapPct → org-level cobertura. Sus cortes 30/50 (en classifyD4)
  //     son umbrales NARRATIVOS de mundo de Apertura, NO bandas canónicas.
  //     Sin referencia metodológica documentada — definidos para tono.
  //     Revisión PENDIENTE si se introduce banda canónica de cobertura.
  //   • SILENCIO_PARTICIPATION_THRESHOLD → per-dept response rate.
  //     Define la sexta alerta y gerencia_muda_1 en deriveBeat1Slots.
  //     Fuente única exportada desde ComplianceAlertService.
  // ──────────────────────────────────────────────────────────────────────
  const coverageGapPct = 100 - (coverage?.pctCobertura ?? 100);
  // null ≠ 0: si denuncias=null en TODOS los deptos, hasDenunciaFormal=false.
  // Solo afecta `intensidad` (bump ortogonal), no la clasificación de mundo.
  const hasDenunciaFormal = riskScores.some(
    (rs) => (rs.inputs.denuncias_12m ?? 0) >= 1,
  );

  // ─── Gate 5 (§3.6): preferir payload.beat1Seed server-side. Fallback al
  //     cálculo client-side preserva back-compat con campañas legacy donde
  //     el orchestrator no se ejecutó (pre-Gate 3) o consumers que aún
  //     pasan ComplianceReportResponse sin la key beat1Seed. ──────────────
  const seedFromPayload = data.data.beat1Seed;

  const d4 = seedFromPayload
    ? {
        mundo: seedFromPayload.mundoDominante,
        intensidad: seedFromPayload.intensidad,
        hasDenunciaFormal: seedFromPayload.hasDenunciaFormal,
      }
    : classifyD4({
        orgISA,
        riesgoDeptos,
        coverageGapPct,
        teatroCount,
        hasDenunciaFormal,
      });

  // ─── Beat 1 slots: del payload si está, o recálculo client (back-compat) ─
  const rollups = useMemo(() => buildGerenciaRollup(data), [data]);
  const slots = useMemo(
    () =>
      seedFromPayload
        ? seedFromPayload.beat1Slots
        : deriveBeat1Slots(rollups, { orgISA, coverageGapPct }),
    [seedFromPayload, rollups, orgISA, coverageGapPct],
  );

  // Cifras presentational (ISA sin decimales, % enteros).
  const isaInt = Math.round(orgISA);
  // {pct} = TASA DE PERSONAS (responded/invited), person-level. NO pctCobertura.
  const pct = slots.personResponseRate ?? 0;

  // ─── Apertura-Titular v4 (HANDOFF §2-4) — reemplaza el cuerpo de copyFor ─
  // Cableado 2: count org de indicios Karin = Σ rollups[].leyKarin.signalsCount.
  const indicioCount = rollups.reduce((s, r) => s + r.leyKarin.signalsCount, 0);
  // Cableado 3: count org de denuncias formales = Σ denuncias_12m, respetando
  // null ≠ 0 (métrica no cargada NO cuenta como 0).
  const denunciaCount = riskScores.reduce((s, rs) => {
    const d = rs.inputs.denuncias_12m;
    return d !== null && d !== undefined ? s + d : s;
  }, 0);
  const isaLevel = classifyIsa(isaInt);
  const titular = buildAperturaTitular({
    orgISA: isaInt,
    isaLevel,
    isaNarrative: ISA_NARRATIVES[isaLevel].narrative,
    pct,
    silencio: pct < 50, // default 1 (GO Victor): "la voz de la mayoría"
    indicioCount,
    denunciaCount,
    legalBadgeLabel: legalBadgeForCountry(country).label,
    dims: computeOrgDimensions(departments),
  });

  // Ortogonales conservadas (género · Ley Karin) — HANDOFF §1.
  const { generoLine, leyKarinLine } = buildOrtogonales(slots, country);

  // Color del hero — CONSERVADO (color por nivel vía intensidad/sano).
  const sano = d4.mundo === 'todo-bien' || d4.mundo === 'bien-con-focos';
  const heroColor = heroColorClass(d4.intensidad, sano);
  const sepTier = sepColor(sano, d4.intensidad);

  return (
    <>
      <ActSeparator label="La Apertura" color={sepTier} />
      <div>
        {/* Hero — orgISA entero */}
        <motion.div {...fadeInDelay} className="text-center mb-10">
          <p
            className={cn(
              'text-7xl md:text-8xl font-extralight tracking-tight tabular-nums',
              heroColor,
            )}
          >
            {isaInt}
          </p>
          <p className="text-xs text-slate-500 mt-3 uppercase tracking-wider">
            {titular.heroLabel}
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          {/* Movimiento 1 — Veredicto (frase bold + narrativa de nivel verbatim). */}
          <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center">
            <span className="font-medium text-white">{titular.mov1.veredicto}</span>{' '}
            {titular.mov1.narrative}
          </p>

          {/* Movimiento 2 — El pero (acota ALCANCE, nunca validez). */}
          {titular.mov2 !== null && (
            <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center">
              {titular.mov2}
            </p>
          )}

          {/* Movimiento 3 — El foco (dimensión foco en cyan/semibold). */}
          {titular.mov3 !== null && (
            <p className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center">
              {titular.mov3.pre}
              {' Y una de las que está en nivel crítico es justo '}
              <span className="font-semibold text-cyan-400">
                {titular.mov3.dimCEO}
              </span>
              {': '}
              {titular.mov3.dimDesc}.
              {titular.mov3.coda !== null && <>{' '}{titular.mov3.coda}</>}
            </p>
          )}

          {/* Cierre (itálica). */}
          <p className="text-sm italic font-light text-slate-400 leading-relaxed text-center mt-2">
            {titular.cierre}
          </p>

          {/* ORTOGONAL: género — CONSERVADA (HANDOFF §1). Línea adicional, no
              reemplaza el titular. Border slate neutro. */}
          {generoLine !== null && (
            <div className="border-l-2 pl-4 mt-6 border-slate-700/40">
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {generoLine}
              </p>
            </div>
          )}

          {/* ORTOGONAL: Ley Karin — CONSERVADA (HANDOFF §1). Voz "los que se
              fueron", histórica. Narrativa existente verbatim (per-gerencia). */}
          {leyKarinLine !== null && (
            <div className="border-l-2 pl-4 mt-6 border-slate-700/40">
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {leyKarinLine}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
});
