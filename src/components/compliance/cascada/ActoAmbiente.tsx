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
import { classifyDimensionLevel } from '@/config/narratives/ComplianceNarrativeDictionary';
import { getLegalMarcoName } from '@/config/compliance/legalBadgeConfig';
import { buildGerenciaRollup } from '@/lib/services/compliance/buildGerenciaRollup';
import { deriveBeat1Slots } from '@/lib/services/compliance/deriveBeat1Slots';
import type { Beat1Slots } from '@/lib/services/compliance/deriveBeat1Slots';
import type { ComplianceReportResponse } from '@/types/compliance';

// ════════════════════════════════════════════════════════════════════════════
// CLASIFICADOR D4 — 5 mundos exhaustivos + intensidad ortogonal
// ════════════════════════════════════════════════════════════════════════════
// Spec: .claude/tasks/ESPEC_APERTURA_AMBIENTE_SANO.md §2
//
// Selector cascada — cada rama es condición POSITIVA, cero else-significativo.
// Primera condición verdadera gana. La última (NÚMERO BAJO) es positiva
// también: cubre exactamente "ISA < 80 ∧ gap < 50 ∧ teatro = 0" (lo que queda
// después de 1-4). Ramas 1-4 son mutuamente excluyentes por construcción,
// 5 captura el complemento positivo.
//
// Género SALE del trigger: es ortogonal (cláusula anexa al mundo que salga,
// no compite). Ley Karin lo mismo.

type Mundo =
  | 'silencio'         // gap ≥ 50
  | 'contradiccion'    // teatro ≥ 1 ∧ gap < 50
  | 'todo-bien'        // ISA ≥ 80 ∧ riesgoDeptos = 0 ∧ gap < 30
  | 'bien-con-focos'   // ISA ≥ 80 ∧ (riesgoDeptos ≥ 1 ∨ gap ∈ [30,50))
  | 'numero-bajo';     // resto positivo (ISA < 80)

type Intensidad = 'leve' | 'medio' | 'alto' | 'critico';

interface D4Output {
  mundo: Mundo;
  intensidad: Intensidad;
  hasDenunciaFormal: boolean;
}

const INTENSIDAD_ORDER: Intensidad[] = ['leve', 'medio', 'alto', 'critico'];

function intensidadFromISA(orgISA: number): Intensidad {
  if (orgISA >= 80) return 'leve';
  if (orgISA >= 60) return 'medio';
  if (orgISA >= 40) return 'alto';
  return 'critico';
}

function bumpIntensidad(base: Intensidad): Intensidad {
  const i = INTENSIDAD_ORDER.indexOf(base);
  if (i < 0) return base;
  const next = Math.min(i + 1, INTENSIDAD_ORDER.length - 1);
  return INTENSIDAD_ORDER[next];
}

export function classifyD4(input: {
  orgISA: number;
  riesgoDeptos: number;
  coverageGapPct: number;
  teatroCount: number;
  hasDenunciaFormal: boolean;
}): D4Output {
  const { orgISA, riesgoDeptos, coverageGapPct, teatroCount, hasDenunciaFormal } = input;

  let mundo: Mundo;

  // 1. SILENCIO — gap dominante. Gana al teatro (no se afirma contradicción
  //    confiable sobre la minoría que respondió). Fork resuelto a favor de
  //    SILENCIO por orden de evaluación.
  if (coverageGapPct >= 50) {
    mundo = 'silencio';
  }
  // 2. CONTRADICCIÓN — números vs respuestas abiertas. Implícito gap < 50.
  else if (teatroCount >= 1) {
    mundo = 'contradiccion';
  }
  // 3. TODO BIEN — ISA saludable + sin focos de riesgo + cobertura plena.
  else if (
    getISARiskLevel(orgISA) === 'saludable' &&
    riesgoDeptos === 0 &&
    coverageGapPct < 30
  ) {
    mundo = 'todo-bien';
  }
  // 4. BIEN CON FOCOS — ISA saludable pero hay foco de riesgo o cobertura
  //    parcial. Los dos sabores los resuelve el deriver/copyFor según
  //    gerencia_foco_1 (sabor riesgo) vs ausencia (sabor cobertura).
  else if (
    getISARiskLevel(orgISA) === 'saludable' &&
    (riesgoDeptos >= 1 || (coverageGapPct >= 30 && coverageGapPct < 50))
  ) {
    mundo = 'bien-con-focos';
  }
  // 5. NÚMERO BAJO — complemento positivo: ISA < 80 ∧ gap < 50 ∧ teatro = 0.
  //    El `else` cierra la partición — cero else-como-significado: la única
  //    combinación que queda es esta.
  else {
    mundo = 'numero-bajo';
  }

  const intensidadBase = intensidadFromISA(orgISA);
  const intensidad = hasDenunciaFormal ? bumpIntensidad(intensidadBase) : intensidadBase;

  return { mundo, intensidad, hasDenunciaFormal };
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

export function copyFor(
  d4: D4Output,
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
  const generoName = slots.gerencia_genero_1
    ? formatDepartmentName(slots.gerencia_genero_1.groupName)
    : null;
  const leyKarinName = slots.gerencia_ley_karin_1
    ? formatDepartmentName(slots.gerencia_ley_karin_1.groupName)
    : null;

  // ─── ORTOGONAL: GÉNERO — voz "los que están", puntual (sin conteo) ──────
  // Sanitización: evidenciaGenero puede venir del motor LLM YA entre comillas
  // ('"no deberían..."'); el template las re-envuelve y produce comillas
  // dobles ('""no deberían...""'). stripWrappingQuotes recorta sólo el par
  // envolvente — el cuerpo del literal queda intacto.
  const generoCitaRaw = slots.gerencia_genero_1?.evidenciaGenero ?? null;
  const generoCita = generoCitaRaw ? stripWrappingQuotes(generoCitaRaw) : null;
  const generoLine =
    generoName && generoCita && generoCita.length > 0
      ? `En ${generoName}, el análisis con IA encontró una expresión con sesgo de género: "${generoCita}". Una sola cita — pero el tipo de frase que, cuando se repite, cambia el cuadro completo.`
      : null;

  // ─── ORTOGONAL: LEY KARIN — voz "los que se fueron", histórica cross-Exit ─
  // El nombre del marco se resuelve country-aware vía getLegalMarcoName:
  //   CL → "Ley Karin" · PE/CO/MX/default → "la normativa laboral vigente"
  // El slot identifier sigue siendo `gerencia_ley_karin_1` porque la SEÑAL es
  // alertType `ley_karin*` (técnico, no displayed). El display lee según país.
  let leyKarinLine: string | null = null;
  if (leyKarinName && slots.gerencia_ley_karin_1) {
    const n = slots.gerencia_ley_karin_1.signalsCount;
    const sustantivo = n === 1 ? 'indicio' : 'indicios';
    const marco = getLegalMarcoName(country);
    leyKarinLine =
      `En ${leyKarinName}, los que se fueron dejaron ${n} ${sustantivo} bajo ${marco} en sus encuestas de salida en los últimos 12 meses. ` +
      `Lo que escribieron al irse vale como pista — la pregunta es si lo que pasa hoy en esa gerencia todavía habla en esa dirección.`;
  }

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
          `Pero esa lectura son ${nResp} de ${nInv} personas, en ${conVoz} de ${gerenciasTotal} gerencias — ` +
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
        `El ISA ${orgISA} no es un promedio que esconde — es un piso que se sostiene.` +
        sanasPart +
        ` Cobertura del ${coveragePct}%.`;

      pero = topName
        ? `Esa coincidencia es lo más difícil de fabricar — los equipos sanos lo son cuando nadie los mira. ${topName} es el caso de referencia. Un ambiente que se cuida solo cuando lo miden no escribe así.`
        : 'Esa coincidencia es lo más difícil de fabricar — los equipos sanos lo son cuando nadie los mira. Un ambiente que se cuida solo cuando lo miden no escribe así.';

      cierre = topName
        ? `Un buen ambiente no se sostiene solo. Este es el momento de proteger lo que funciona — empezando por entender qué hace ${topName} distinto del resto.`
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
        'Un buen número general tranquiliza — y por eso es peligroso. ' +
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
        'No hay problema de cobertura ni contradicción que lo explique — la organización respondió, y respondió esto.';
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

function borderColor(sano: boolean, intensidad: Intensidad): string {
  if (sano) return 'border-cyan-500/30';
  if (intensidad === 'critico') return 'border-purple-500/30';
  return 'border-amber-500/30';
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

  const d4 = classifyD4({
    orgISA,
    riesgoDeptos,
    coverageGapPct,
    teatroCount,
    hasDenunciaFormal,
  });

  // ─── Selector CELDA PUENTE — banda=riesgo + P2 crítico en TODOS los con_isa ─
  // `departments` ya viene filtrado por route.ts:289 a deptos con resultPayload
  // COMPLETED (= con_isa). El `.every()` y la frase "ambas áreas" del copy
  // asumen exactamente 2 deptos con_isa (cmob0e56). Si un ciclo futuro entra
  // silencio+riesgo+P2-crítico con 3+ con_isa, la palabra "ambas" queda mal.
  // NO generalizar ahora — refinar el copy cuando aparezca el caso real.
  const p2CritEnConIsa =
    departments.length > 0 &&
    departments.every((d) => {
      const p2 = d.dimensionScores?.P2_seguridad;
      return (
        p2 !== null && p2 !== undefined && classifyDimensionLevel(p2) === 'critico'
      );
    });

  // ─── Beat 1 slots desde el rollup compartido (single source) ──────────
  const rollups = useMemo(() => buildGerenciaRollup(data), [data]);
  const slots = useMemo(
    () => deriveBeat1Slots(rollups, { orgISA, coverageGapPct }),
    [rollups, orgISA, coverageGapPct],
  );

  // Cifras presentational (regla del COPY doc: ISA sin decimales, % enteros).
  const isaInt = Math.round(orgISA);
  // {coverage} en la copy = TASA DE PERSONAS de la campaña (responded/invited),
  // NO `coverage.pctCobertura` (dept-level). La narrativa dice "del equipo
  // respondió" — son personas, no áreas. Si `personResponseRate` es null
  // (universo vacío de invitados — defensivo), fallback a 0.
  const cobInt = slots.personResponseRate ?? 0;

  const copy = copyFor(d4, slots, isaInt, cobInt, country, p2CritEnConIsa);
  // Coloreo: 'todo-bien' y 'bien-con-focos' = tono sano (cyan). Otros usan
  // la intensidad clásica (alta/critico → purple, medio/alto → amber).
  const sano = d4.mundo === 'todo-bien' || d4.mundo === 'bien-con-focos';
  const heroColor = heroColorClass(d4.intensidad, sano);
  const sepTier = sepColor(sano, d4.intensidad);
  const borderTier = borderColor(sano, d4.intensidad);

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
            {copy.subtitulo}
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="max-w-2xl mx-auto space-y-4">
          {/* Traducción — `\n\n` produce párrafos planos (prosa corrida sin
              callout). Sin separadores: 1 <p> (backward-compat con todos los
              mundos existentes). Hoy solo CELDA PUENTE del case 'silencio'
              usa multi-párrafo. */}
          {copy.traduccion.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="text-base md:text-lg font-light text-slate-300 leading-relaxed text-center"
            >
              {para}
            </p>
          ))}

          {/* El "pero" — null = omitir (degradación graceful) */}
          {copy.pero !== null && (
            <div className={cn('border-l-2 pl-4 mt-6', borderTier)}>
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {copy.pero}
              </p>
            </div>
          )}

          {/* Cierre (itálica) — `''` = omitir el callout (CELDA PUENTE /
              RESPALDO concentran todo en traduccion). Otros mundos siempre
              tienen cierre con contenido. */}
          {copy.cierre.length > 0 && (
            <div className={cn('border-l-2 pl-4 mt-6', borderTier)}>
              <p className="text-sm italic font-light text-slate-300 leading-relaxed">
                {copy.cierre}
              </p>
            </div>
          )}

          {/* ORTOGONAL: género — línea adicional después del cierre. Anexada
              cuando hay alerta resoluble con cita literal. NO reemplaza al
              cierre. Border slate neutro (no hereda el tier del mundo). */}
          {copy.generoLine !== null && (
            <div className="border-l-2 pl-4 mt-6 border-slate-700/40">
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {copy.generoLine}
              </p>
            </div>
          )}

          {/* ORTOGONAL: Ley Karin — anexada cuando hay ≥1 indicio cross-Exit
              12m. Voz "los que se fueron", histórica. Sin LegalBadgePill —
              el chip "RIESGO LEY KARIN" en ámbar contradice el tono histórico
              ("dejaron en sus encuestas de salida", pasado). El texto ya nombra
              "bajo Ley Karin", y género tampoco lleva badge → parejos. */}
          {copy.leyKarinLine !== null && (
            <div className="border-l-2 pl-4 mt-6 border-slate-700/40">
              <p className="text-sm font-light text-slate-300 leading-relaxed">
                {copy.leyKarinLine}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
});
