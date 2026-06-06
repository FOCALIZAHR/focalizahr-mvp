// src/lib/services/compliance/ComplianceNarrativeEngine.ts
// Motor DETERMINISTA (no LLM) de narrativas ejecutivas para el reporte de
// Ambiente Sano. Produce textos por artefacto del reporte siguiendo las
// 6 Reglas de Oro + Teatro de Cumplimiento como Regla #1.
//
// Reglas de Oro:
//   1. La contradicción es el protagonista — dos fuentes dicen cosas distintas.
//   2. El "O" McKinsey para causas — hipótesis posibles, nunca juicios.
//   3. Consecuencia, no instrucción — qué pasa si no se actúa.
//   4. Sin jerga técnica visible — hablar como gerentes entre sí.
//   5. Una idea por oración, ritmo ascendente.
//   6. El cierre ancla la urgencia.
//
// Vocabulario PROHIBIDO en artefactos (solo en alertas internas):
//   - "acoso", "hostigamiento", "denuncia", "Ley Karin" (CL · o normativa equivalente por país)
//   - "seguridad psicológica", "psicosocial"
//   - "Safety Score", "EXO", "LLM", "convergencia"
//   - "se recomienda", "deberías", "es necesario"

import type { ComplianceAlertType, ComplianceSource } from '@/config/complianceAlertConfig';
import type { DepartmentSafetyScore } from '@/lib/services/SafetyScoreService';
import type {
  MetaAnalysisOutput,
  PatronAnalysisOutput,
  PatronNombre,
  OrigenOrganizacional,
} from './complianceTypes';
import type {
  DepartmentConvergencia,
  ConvergenciaGlobals,
  CriticalByManagerGroup,
  CasoMotorA,
  NivelFinal,
} from './ConvergenciaEngine';
import { CASO_LABELS } from './casoLabels';
import {
  resolveDimensionNarrative,
  type ComplianceDimensionKey,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import { SOURCE_LABEL_NARRATIVE, SOURCE_VOICE_NARRATIVE } from '@/config/compliance/sourceLabels';

// ═══════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ═══════════════════════════════════════════════════════════════════

export interface ReportNarratives {
  portada: PortadaNarrative;
  ancla: AnclaNarrative;
  artefacto1_dimensiones: DimensionNarrative[];
  artefacto2_patrones: PatronNarrative[];
  /** Departamentos con alerta_sesgo_genero=true en el análisis LLM. */
  alertasGenero: GenderAlertDetail[];
  artefacto3_convergencia: ConvergenciaNarrative[];
  /**
   * Narrativa org-level del cruce entre instrumentos activos. Solo poblada
   * cuando `activeSourcesGlobal.length >= 2`. Persiste como campo top-level
   * de ReportNarratives (no dentro de artefacto3_convergencia, que es array
   * per-dept). `undefined` cuando no aplica.
   */
  cruceNarrativa?: string;
  /**
   * Narrativa org-level del patrón de liderazgo cuando varios departamentos
   * críticos comparten línea de mando. Solo poblada cuando
   * `criticalByManager.length > 0`. NO renderiza managerId — solo agrupa por
   * departmentNames. Privacy hardened en el copy.
   * El route handler suprime este campo para AREA_MANAGER (coherencia con
   * el filtrado de criticalByManager).
   */
  criticalByManagerNarrativa?: string;
  artefacto4_alertas: AlertaNarrative[];
  cierre: CierreNarrative;
  /**
   * Narrativas de la Cascada Ejecutiva (5 actos). `undefined` cuando orgISA
   * es null (campañas legacy/sin ISA). route.ts la suprime para AREA_MANAGER.
   */
  cascada?: {
    acto1: Acto1AmbienteNarrative;
    acto2: Acto2PatronNarrative;
    acto3: Acto3SenalesNarrative;
    acto4: Acto4AlertasNarrative;
    sintesis: SintesisFrancotirador;
  };
}

export interface PortadaNarrative {
  titular: string;
  subtitular: string;
  /** Score de la campaña anterior (misma slug + account), si existe. */
  previousScore?: number | null;
  /** Texto ejecutivo tipo "+0.3 vs Semestre 2 2025" o "Primera medición". */
  deltaLabel?: string | null;
}

export interface AnclaNarrative {
  titular: string;
  descripcion: string;
}

export interface DimensionNarrative {
  dimensionKey: string;
  dimensionNombre: string;
  nivel: 'sano' | 'atencion' | 'riesgo' | 'critico';
  narrativa: string;
}

export interface PatronNarrative {
  nombre: PatronNombre;
  nombreLegible: string;
  intensidad: number;
  descripcion: string;
  /** Fragmentos agregados (ya anonimizados, max 8 palabras cada uno). */
  fragmentos: string[];
  /** Departamentos donde el patrón apareció. */
  departments: string[];
}

export interface GenderAlertDetail {
  departmentName: string;
  parentDepartmentName: string | null;  // gerencia padre. null si payload pre-deploy o si el dept es root.
  evidenciaGenero: string;   // cita literal ≤8 palabras. '' si proviene de payload legacy.
  analisisGenero: string;    // justificación clínica/legal. Siempre poblado.
  contextoGenero: string;    // legacy — espejo de analisisGenero para consumers viejos.
}

export interface ConvergenciaNarrative {
  departmentId: string;
  departmentName: string;
  nivel: string;
  narrativa: string;
  contradiccionProtagonista?: string;
}

export interface AlertaNarrative {
  alertType: ComplianceAlertType;
  titulo: string;
  contexto: string;
  consecuencia: string;
  intervencion: string;
}

export interface CierreNarrative {
  mensaje: string;
}

// ═══════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════

const DIMENSION_LABELS: Record<string, string> = {
  P2_seguridad: 'Seguridad para reportar',
  P3_disenso: 'Espacio para el desacuerdo',
  P4_microagresiones: 'Respeto en las interacciones diarias',
  P5_equidad: 'Equidad en la asignación de recursos',
  P7_liderazgo: 'Calidad del liderazgo directo',
  P8_agotamiento: 'Sostenibilidad del equipo',
};

export const PATRON_LABELS: Record<PatronNombre, string> = {
  silencio_organizacional: 'Silencio organizacional',
  hostilidad_normalizada: 'Hostilidad normalizada',
  favoritismo_implicito: 'Favoritismo implícito',
  resignacion_aprendida: 'Resignación aprendida',
  miedo_represalias: 'Expectativa de represalias',
};

/**
 * Diccionario de intervenciones validadas (Artefacto 4).
 * Fuente: TASK § D8 + evidencia citada en el documento maestro.
 */
const INTERVENCIONES: Record<ComplianceAlertType, string> = {
  riesgo_convergente:
    'Las evidencias disponibles apuntan a revisión transversal del departamento: leadership coaching estructurado (3–6 meses) combinado con pulse surveys mensuales (SMD = 0.85 en literatura).',
  liderazgo_toxico:
    'Los casos donde varios equipos bajo un mismo gerente comparten el cuadro suelen responder a programas de coaching ejecutivo con feedback 360° sostenidos en el tiempo, no a intervenciones puntuales.',
  silencio_organizacional:
    'Intervenciones de liderazgo inclusivo (3–6 meses) muestran impacto consistente cuando el silencio es el síntoma dominante. El retorno depende de que la jefatura directa participe.',
  deterioro_sostenido:
    'Cuando el deterioro es estructural, los pulse surveys mensuales con acción visible en 30 días tienen evidencia sólida (SMD = 0.85). Las encuestas sin acción posterior amplifican el problema.',
  senal_ignorada:
    'Capacitación del Comité Paritario y de jefaturas directas en lectura de señales tempranas. La alerta Onboarding–Exit correlacionada es predictora: actuar en el mes 1 evita la salida en el mes 4.',
  silencio_con_voz_externa:
    'Una conversación directa con la jefatura del área, no una encuesta de seguimiento. El objetivo es entender por qué el departamento no participó — la baja respuesta es el primer dato, no un problema de campo.',
  participacion_anomala:
    'Una conversación directa con la jefatura del área para entender la baja respuesta. El número es el punto de partida, no el diagnóstico.',
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function countBy<T, K extends string>(arr: T[], key: (x: T) => K): Record<K, number> {
  const acc: Record<string, number> = {};
  for (const x of arr) {
    const k = key(x);
    acc[k] = (acc[k] ?? 0) + 1;
  }
  return acc as Record<K, number>;
}

// ═══════════════════════════════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════════════════════════════

function buildDeltaLabel(
  current: number | null,
  previous: number | null,
  previousLabel: string | null
): string | null {
  if (current === null || previous === null || !previousLabel) return null;
  const diff = current - previous;
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return `Sin cambio vs ${previousLabel}`;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toFixed(1)} vs ${previousLabel}`;
}

function buildPortada(
  meta: MetaAnalysisOutput | null,
  departmentsCount: number,
  riesgoDeptos: number,
  teatroCount: number,
  currentOrgScore: number | null,
  previousOrgScore: number | null,
  previousCampaignLabel: string | null
): PortadaNarrative {
  const deltaLabel = buildDeltaLabel(currentOrgScore, previousOrgScore, previousCampaignLabel);
  const previousScore = previousOrgScore ?? null;

  if (meta?.hallazgo_narrativo_portada) {
    return {
      titular: meta.hallazgo_narrativo_portada,
      subtitular:
        riesgoDeptos > 0
          ? `${riesgoDeptos} de ${departmentsCount} gerencias muestran señales que ameritan revisión.`
          : 'Las señales agregadas sostienen un diagnóstico general saludable.',
      previousScore,
      deltaLabel,
    };
  }

  if (teatroCount >= 2) {
    return {
      titular:
        'Los números dicen una cosa; las respuestas, otra. La diferencia es la señal.',
      subtitular: `${teatroCount} gerencias puntúan alto en las métricas duras pero su lenguaje sugiere contención.`,
      previousScore,
      deltaLabel,
    };
  }

  if (riesgoDeptos === 0) {
    return {
      titular: 'La organización opera con márgenes saludables en el ambiente de trabajo.',
      subtitular:
        'Ninguna gerencia entra en zona de revisión crítica. El foco está en sostener lo que funciona.',
      previousScore,
      deltaLabel,
    };
  }

  return {
    titular: `${riesgoDeptos} gerencias concentran el riesgo del semestre.`,
    subtitular:
      'El análisis revela concentración, no dispersión. Eso ordena la prioridad.',
    previousScore,
    deltaLabel,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ACTO ANCLA
// ═══════════════════════════════════════════════════════════════════

function buildAncla(
  orgSafetyScore: number | null,
  departmentsCount: number,
  teatroCount: number
): AnclaNarrative {
  if (orgSafetyScore === null) {
    return {
      titular: 'El diagnóstico depende de lo que se escuche, no de lo que se asuma.',
      descripcion:
        'Sin suficientes gerencias sobre el umbral de participación no hay lectura confiable. El próximo ciclo debe priorizar cobertura antes que acción.',
    };
  }

  if (teatroCount > 0) {
    return {
      titular: 'Lo más revelador no son los promedios: son las contradicciones.',
      descripcion: `De ${departmentsCount} gerencias analizadas, ${teatroCount} responden alto en métricas numéricas pero su lenguaje proyectivo sugiere contención. Esa distancia es la señal más informativa del ciclo.`,
    };
  }

  // Caso positivo — sin teatro y con score agregado saludable. La rama
  // default ("dónde se concentra la señal") asume que hay señal que
  // concentrar; cuando la organización está sana, el trabajo es de
  // blindaje, no de corrección.
  if (orgSafetyScore >= 4.0) {
    return {
      titular: 'El ambiente sostiene condiciones saludables en todas las gerencias.',
      descripcion: `Lectura agregada de ${departmentsCount} gerencias. Ninguna entra en zona de revisión. El trabajo del ciclo es sostener lo que funciona, no corregir.`,
    };
  }

  return {
    titular: 'El mapa del semestre muestra dónde se concentra la señal.',
    descripcion: `Lectura agregada de ${departmentsCount} gerencias. La distribución importa más que el promedio.`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 1 — DIMENSIONES
// ═══════════════════════════════════════════════════════════════════

function buildDimensiones(scores: DepartmentSafetyScore[]): DimensionNarrative[] {
  if (scores.length === 0) return [];

  const dimensionKeys: ComplianceDimensionKey[] = [
    'P2_seguridad',
    'P3_disenso',
    'P4_microagresiones',
    'P5_equidad',
    'P7_liderazgo',
    'P8_agotamiento',
  ];

  return dimensionKeys.map((key) => {
    // Promedio ponderado por respondentCount — un depto con 30 voces pesa
    // más que uno con 6 al describir el clima org de la dimensión.
    let weighted = 0;
    let totalWeight = 0;
    for (const s of scores) {
      const v = s.dimensionScores[key];
      if (v === null || v === undefined) continue;
      const w = s.respondentCount ?? 0;
      if (w <= 0) continue;
      weighted += v * w;
      totalWeight += w;
    }

    if (totalWeight === 0) {
      return {
        dimensionKey: key,
        dimensionNombre: DIMENSION_LABELS[key],
        nivel: 'atencion',
        narrativa:
          'No hubo suficientes respuestas sobre el umbral de anonimato para una lectura representativa.',
      };
    }

    const orgScore = weighted / totalWeight;
    const { level, narrativa } = resolveDimensionNarrative(key, orgScore);

    return {
      dimensionKey: key,
      dimensionNombre: DIMENSION_LABELS[key],
      nivel: level,
      narrativa,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 2 — PATRONES (del LLM, ya curados)
// ═══════════════════════════════════════════════════════════════════

function buildPatrones(
  departmentAnalyses: Array<{
    departmentName: string;
    payload: PatronAnalysisOutput | null;
  }>
): PatronNarrative[] {
  const byPattern = new Map<
    PatronNombre,
    { total: number; sumInt: number; deptos: string[]; fragmentos: string[] }
  >();

  for (const d of departmentAnalyses) {
    const patrones = d.payload?.patrones ?? [];
    for (const p of patrones) {
      const bucket = byPattern.get(p.nombre) ?? {
        total: 0,
        sumInt: 0,
        deptos: [],
        fragmentos: [],
      };
      bucket.total++;
      bucket.sumInt += p.intensidad;
      bucket.deptos.push(d.departmentName);
      // Agregamos fragmentos (el LLM garantiza max 8 palabras + [CENSURADO]).
      bucket.fragmentos.push(...(p.fragmentos ?? []));
      byPattern.set(p.nombre, bucket);
    }
  }

  const arr: PatronNarrative[] = [];
  for (const [nombre, bucket] of byPattern.entries()) {
    const avgInt = bucket.sumInt / bucket.total;
    const deptosStr =
      bucket.deptos.length === 1
        ? bucket.deptos[0]
        : `${bucket.deptos.slice(0, -1).join(', ')} y ${bucket.deptos.at(-1)}`;
    const descripcion =
      bucket.deptos.length === 1
        ? `El marcador aparece en ${deptosStr} con intensidad ${avgInt.toFixed(2)}. La evidencia es localizada.`
        : `El marcador se repite en ${bucket.deptos.length} gerencias (${deptosStr}) con intensidad promedio ${avgInt.toFixed(2)}. La consistencia sugiere un rasgo cultural, no un incidente puntual.`;

    // Dedup + top 3 fragmentos por patrón (el LLM ya los acota, aquí solo
    // evitamos repetidos).
    const uniqueFragments = Array.from(new Set(bucket.fragmentos)).slice(0, 3);

    arr.push({
      nombre,
      nombreLegible: PATRON_LABELS[nombre],
      intensidad: avgInt,
      descripcion,
      fragmentos: uniqueFragments,
      departments: bucket.deptos,
    });
  }

  return arr.sort((a, b) => b.intensidad - a.intensidad).slice(0, 5);
}

function buildAlertasGenero(
  departmentAnalyses: Array<{
    departmentName: string;
    parentDepartmentName: string | null;
    payload: PatronAnalysisOutput | null;
  }>
): GenderAlertDetail[] {
  const result: GenderAlertDetail[] = [];
  for (const d of departmentAnalyses) {
    if (!d.payload?.alerta_sesgo_genero) continue;

    const evidenciaNueva = d.payload.evidencia_genero?.trim() ?? '';
    const analisisNuevo = d.payload.analisis_genero?.trim() ?? '';
    const contextoLegacy = d.payload.contexto_genero?.trim() ?? '';

    // Path nuevo: al menos uno de los campos separados está poblado.
    if (evidenciaNueva || analisisNuevo) {
      const analisis = analisisNuevo || contextoLegacy;
      if (!evidenciaNueva && !analisis) continue;
      result.push({
        departmentName: d.departmentName,
        parentDepartmentName: d.parentDepartmentName,
        evidenciaGenero: evidenciaNueva,
        analisisGenero: analisis,
        contextoGenero: analisis,
      });
      continue;
    }

    // Fallback legacy: solo contexto_genero presente en payload pre-deploy.
    if (!contextoLegacy) continue;
    result.push({
      departmentName: d.departmentName,
      parentDepartmentName: d.parentDepartmentName,
      evidenciaGenero: '',
      analisisGenero: contextoLegacy,
      contextoGenero: contextoLegacy,
    });
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 3 — CONVERGENCIA (con "contradicción protagonista")
// ═══════════════════════════════════════════════════════════════════

// ─── Detección de modo ────────────────────────────────────────────────────
// Motor v2 está disponible cuando el JSON persistido incluye `nivelFinal`
// (síntesis cross-motor) Y `convergenciaInterna.casosActivos` (array Motor A).
// Campañas legacy pre-Fase-1/2/3 no traen esos campos — caen al fallback v1.
function isMotorV2(d: DepartmentConvergencia): boolean {
  return (
    typeof d.nivelFinal === 'string' &&
    Array.isArray(d.convergenciaInterna?.casosActivos)
  );
}

// ─── Contradicción protagonista (Regla #1, sin cambios) ────────────────────
// Lee `signals.*` (legacy raíz, sigue poblándose). Aplica solo a empresas
// con multi-fuente. Cero cambios funcionales — preserva el comportamiento.
function buildContradiccion(
  d: DepartmentConvergencia
): string | undefined {
  const safety = d.signals.ambiente_sano;
  const exit = d.signals.exit;
  const exo = d.signals.onboarding;
  const pulso = d.signals.pulso;

  if (safety && !safety.isRisk && exit?.isRisk) {
    return 'Ambiente Sano registra condiciones sanas en el período actual, pero quienes se fueron en ese mismo período cuentan una historia distinta.';
  }
  if (safety?.isRisk && exo && !exo.isRisk) {
    return 'Los ingresos nuevos no perciben el problema que el equipo actual sí reporta. O el deterioro es reciente, o el ingreso aún no lo ha tocado.';
  }
  if (pulso?.isRisk && safety && !safety.isRisk) {
    return 'Los ciclos recientes de medición muestran una caída sostenida, aunque el diagnóstico actual la matiza.';
  }
  return undefined;
}

// ─── Body v2 — narrativa por nivelFinal ──────────────────────────────────
// 5 ramas (la 6ª, 'ninguna', queda filtrada antes de entrar acá).
// Cada texto es literal — auditado contra las 6 Reglas de Oro.
//
// Modelo narrativo: voces (los que están / los que se fueron / los que
// entraron) en lugar de productos (AS / Exit / Onboarding). Más humano,
// menos jerga comercial. El placeholder [DEPT] se sustituye runtime con
// el nombre del depto — funciona en cualquier posición de la oración.
//
// Estilo: NO abrir con "Ambiente Sano [verbo]…" para no duplicar el
// patrón de Motor 6 (CombinatoriaDictionary), que se renderiza debajo
// en la misma banda colapsada.
function buildBodyV2(d: DepartmentConvergencia): string {
  const dept = d.departmentName;
  switch (d.nivelFinal) {
    case 'critica_sistema':
      return `En ${dept}, los que están, los que se fueron y los que entraron dicen lo mismo. Y el patrón aparece en otros departamentos del mismo líder. Postergar la conversación ya tiene un costo.`;
    case 'amplificada':
      return `Tres voces independientes leen lo mismo en ${dept} — los que están, los que se fueron y los que acaban de entrar. Ninguna sabe lo que dijo la otra. Cuando llegan al mismo punto, el patrón deja de ser debatible.`;
    case 'confirmada':
      return `Lo que dicen los que están en ${dept} y lo que dijeron los que se fueron coincide. Dos voces que no comparten datos llegaron al mismo lugar. Eso no es repetición — es confirmación.`;
    case 'externa_solo':
      return `${dept} no registró señal en la encuesta. Los que se fueron o los que entraron la documentaron desde afuera. La voz interna no habló — las otras, sí.`;
    case 'interna_solo':
      return `${dept} se confirma a sí mismo. Los números de la encuesta y lo que las personas escribieron señalan lo mismo — sin coordinarse, sin conocerse como fuente. Una sola voz, pero con dos canales diciendo lo mismo, ya alcanza para nombrarlo.`;
    default:
      // 'ninguna' fue filtrado antes de entrar acá; defensa runtime.
      return `${dept} sin convergencia detectable este ciclo.`;
  }
}

// ─── Body v1 — fallback legacy (campañas pre-Motor v2) ─────────────────────
function buildBodyV1(d: DepartmentConvergencia): string {
  if (d.level === 'critico') {
    return `${d.departmentName} concentra el riesgo del semestre: la lectura base está bajo el umbral y otras fuentes lo confirman.`;
  }
  if (d.level === 'convergente') {
    return `${d.departmentName} muestra señales concurrentes en ${d.riskSignalsCount} instrumentos. La convergencia, no la magnitud individual, es lo que ordena la prioridad.`;
  }
  if (d.level === 'medio') {
    return `${d.departmentName} aparece en dos instrumentos distintos. No es crítico, pero el patrón se insinúa.`;
  }
  return `${d.departmentName} registra una señal aislada. Ameritaría monitoreo, no acción inmediata.`;
}

// ─── Sufijo casos forenses — appended cuando hay casosActivos ──────────────
// Solo aplica en modo v2. Reusa CASO_LABELS de casoLabels.ts (single source).
//
// 1 caso → "Caso registrado: X."
// 2+ casos → "Caso principal" es el más grave por severidad clínica
//            (Decisión #3 Plan de Cierre AS v1.0). Ranking: A3>A2>A1>A4>A5.
//            Alinea con Motor 6 (CombinatoriaDictionary Regla 7) que ya
//            usa el mismo criterio. Evita inconsistencia "principal A1 +
//            narrativa de A3" en deptos multi-caso.
//
// Por qué A3 primero: sesgo de género tiene mayor exposición legal
// (Ley Karin / equivalente). Es lo más grave para llegar al CEO primero.
// A2 acumulación interna y A1 doble confirmación siguen. A4/A5 son
// patrones de menor exposición (gemelo opuesto, score miente).
const CASO_SEVERITY_RANK: Record<CasoMotorA, number> = {
  A3: 5,
  A2: 4,
  A1: 3,
  A4: 2,
  A5: 1,
};

function casoMasGrave(casos: CasoMotorA[]): CasoMotorA {
  return [...casos].sort(
    (a, b) => (CASO_SEVERITY_RANK[b] ?? 0) - (CASO_SEVERITY_RANK[a] ?? 0)
  )[0];
}

function describeCasos(casos: CasoMotorA[]): string {
  if (casos.length === 0) return '';
  if (casos.length === 1) {
    return `Caso registrado: ${CASO_LABELS[casos[0]]}.`;
  }
  const principal = CASO_LABELS[casoMasGrave(casos)];
  const restantes = casos.length - 1;
  return `Caso principal: ${principal}. (+${restantes} más)`;
}

function buildConvergencia(
  deptos: DepartmentConvergencia[]
): ConvergenciaNarrative[] {
  return deptos
    .filter((d) =>
      isMotorV2(d) ? d.nivelFinal !== 'ninguna' : d.level !== 'sin_riesgo'
    )
    .map((d) => {
      const v2 = isMotorV2(d);
      const body = v2 ? buildBodyV2(d) : buildBodyV1(d);
      const contradiccion = buildContradiccion(d);

      const parts: string[] = [body];

      // Sufijo casos forenses solo en v2 cuando hay casosActivos.
      // externa_solo no tiene casos (Motor A 'ninguna') — sufijo vacío.
      if (v2 && d.convergenciaInterna.casosActivos.length > 0) {
        parts.push(describeCasos(d.convergenciaInterna.casosActivos));
      }

      if (contradiccion) parts.push(contradiccion);

      return {
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        nivel: v2 ? d.nivelFinal : d.level,
        narrativa: parts.join(' '),
        contradiccionProtagonista: contradiccion,
      };
    });
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 3.B — CRUCE NARRATIVA (org-level)
// ═══════════════════════════════════════════════════════════════════

/**
 * Formatea una lista de nombres de departamentos para prosa.
 *   1 nombre  → "TI"
 *   2 nombres → "TI y Equipos Médicos"
 *   3+ nombres → "TI, Equipos Médicos y N más"
 */
function formatDeptList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
}

/**
 * Identifica el par de fuentes más recurrente entre los deptos coincidentes.
 * Retorna las 2 fuentes con más apariciones cross-dept en risk simultáneo.
 */
function identificarParDominante(
  coincidentes: Array<{ dept: DepartmentConvergencia; sourcesEnRisk: ComplianceSource[] }>
): [ComplianceSource, ComplianceSource] | null {
  const counts = new Map<ComplianceSource, number>();
  for (const c of coincidentes) {
    for (const s of c.sourcesEnRisk) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (ordered.length < 2) return null;
  return [ordered[0][0], ordered[1][0]];
}

/**
 * Narrativa org-level del cruce entre instrumentos. Describe qué coincide y
 * qué diverge entre las fuentes activas.
 *
 * Guards:
 *   - activeSourcesGlobal.length < 2 → undefined (no hay convergencia posible).
 *   - deptos.length === 0 → undefined.
 *
 * 5 ramas según patrón dominante (ver plan
 * `.claude/plans/compliance-engine-narrativas-cruce.md` sec 2.1).
 */
function buildConvergenciaCruce(
  deptos: DepartmentConvergencia[],
  activeSourcesGlobal: ComplianceSource[]
): string | undefined {
  if (activeSourcesGlobal.length < 2) return undefined;
  if (deptos.length === 0) return undefined;

  // Particionar deptos en buckets según cantidad de fuentes en risk.
  const coincidentes: Array<{
    dept: DepartmentConvergencia;
    sourcesEnRisk: ComplianceSource[];
  }> = [];
  const aislados: Array<{
    dept: DepartmentConvergencia;
    sourceUnica: ComplianceSource;
  }> = [];

  for (const d of deptos) {
    const sourcesEnRisk = (Object.keys(d.signals) as ComplianceSource[]).filter(
      (s) => d.signals[s]?.isRisk === true
    );
    if (sourcesEnRisk.length >= 2) {
      coincidentes.push({ dept: d, sourcesEnRisk });
    } else if (sourcesEnRisk.length === 1) {
      aislados.push({ dept: d, sourceUnica: sourcesEnRisk[0] });
    }
  }

  // Sin material narrativo.
  if (coincidentes.length === 0 && aislados.length === 0) return undefined;

  // CASO 4 — Convergencia puntual (1 dept coincidente, 0 aislados).
  if (coincidentes.length === 1 && aislados.length === 0) {
    const c = coincidentes[0];
    const par = identificarParDominante(coincidentes);
    if (!par) return undefined;
    const [f1, f2] = par;
    return (
      `En ${c.dept.departmentName}, dos canales coinciden — ${SOURCE_VOICE_NARRATIVE[f1]} y ${SOURCE_VOICE_NARRATIVE[f2]} leen lo mismo. ` +
      `El resto de la organización opera sin coincidencias entre canales. La excepción tiene nombre.`
    );
  }

  // CASO 5 — Señal única (0 coincidentes, 1 aislado).
  if (coincidentes.length === 0 && aislados.length === 1) {
    const a = aislados[0];
    return (
      `En ${a.dept.departmentName}, solo un canal reporta riesgo: ${SOURCE_VOICE_NARRATIVE[a.sourceUnica]}. ` +
      `Los demás no lo confirman todavía. ` +
      `El hecho está documentado por una vía; la confirmación cruzada queda pendiente.`
    );
  }

  // CASO 3 — Señales fragmentadas (0 coincidentes, ≥2 aislados en distintas fuentes).
  if (coincidentes.length === 0 && aislados.length >= 2) {
    // Buscar 2 aislados con fuentes distintas para el ejemplo.
    const primero = aislados[0];
    const segundo = aislados.find((a) => a.sourceUnica !== primero.sourceUnica);
    if (!segundo) {
      // Todos los aislados marcan la misma fuente — degradar a "fragmentada en un solo canal".
      return (
        `En ${aislados.length} departamentos, solo ${SOURCE_VOICE_NARRATIVE[primero.sourceUnica]} están reportando. Los demás canales no lo registran. ` +
        `O cada canal está captando una dimensión distinta del mismo problema. ` +
        `O todavía no hay un problema estructural. ` +
        `La diferencia importa: un patrón consolidado no se mueve solo.`
      );
    }
    const v1 = SOURCE_VOICE_NARRATIVE[primero.sourceUnica];
    const v2 = SOURCE_VOICE_NARRATIVE[segundo.sourceUnica];
    const v1Cap = v1.charAt(0).toUpperCase() + v1.slice(1);
    const v2Cap = v2.charAt(0).toUpperCase() + v2.slice(1);
    return (
      `Hay ${activeSourcesGlobal.length} canales activos en la organización y ninguno confirma al otro. ` +
      `${v1Cap} señalan ${primero.dept.departmentName}. ${v2Cap} señalan ${segundo.dept.departmentName} — distintos. ` +
      `O cada canal está captando una dimensión distinta del mismo problema. ` +
      `O todavía no hay un problema estructural. ` +
      `La diferencia importa: un patrón consolidado no se mueve solo.`
    );
  }

  // CASO 1 — Coincidencia + divergencia (≥2 coincidentes Y ≥1 aislado).
  if (coincidentes.length >= 2 && aislados.length >= 1) {
    const par = identificarParDominante(coincidentes);
    if (!par) return undefined;
    const [f1, f2] = par;
    const coincidentNames = coincidentes.map((c) => c.dept.departmentName);
    const divergente = aislados[0];
    return (
      `En ${formatDeptList(coincidentNames)}, dos canales independientes leen lo mismo: ${SOURCE_VOICE_NARRATIVE[f1]} y ${SOURCE_VOICE_NARRATIVE[f2]}. ` +
      `Pero en ${divergente.dept.departmentName}, solo ${SOURCE_VOICE_NARRATIVE[divergente.sourceUnica]} reportan riesgo y los demás no lo confirman. ` +
      `La lectura todavía no es uniforme — o el deterioro empezó por un canal y aún no contagió, o cada canal está captando una cara distinta del mismo equipo.`
    );
  }

  // CASO 2 — Convergencia limpia (≥2 coincidentes, 0 aislados).
  if (coincidentes.length >= 2 && aislados.length === 0) {
    const par = identificarParDominante(coincidentes);
    if (!par) return undefined;
    const [f1, f2] = par;
    const N = coincidentes.length;
    const palabra = N === 1 ? 'departamento' : 'departamentos';
    return (
      `En ${N} ${palabra}, ${SOURCE_VOICE_NARRATIVE[f1]} y ${SOURCE_VOICE_NARRATIVE[f2]} leen lo mismo — sin compartir datos, sin coordinarse. ` +
      `Cuando dos lentes independientes coinciden, el hallazgo deja de ser percepción: pasa a ser hecho.`
    );
  }

  return undefined;
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 3.C — PATRÓN DE LIDERAZGO (criticalByManager)
// ═══════════════════════════════════════════════════════════════════

/**
 * Narrativa org-level cuando varios departamentos críticos comparten línea
 * de mando. Privacy hardened: NO renderiza managerId — solo nombres de
 * departamentos. El copy explícitamente recuerda que el sistema agrupa, no
 * acusa ("la inferencia es trabajo del lector").
 *
 * Guards:
 *   - criticalByManager.length === 0 → undefined.
 *   - Si todos los grupos tienen <2 deptos resueltos → undefined (defensive).
 *
 * 2 ramas (ver plan sec 2.2).
 */
function buildCriticalByManagerNarrative(
  criticalByManager: ConvergenciaGlobals['criticalByManager'],
  deptNamesById: Map<string, string>
): string | undefined {
  if (criticalByManager.length === 0) return undefined;

  // Resolver names + filtrar grupos vacíos / con <2 deptos resueltos.
  const grupos = criticalByManager
    .map((g) => ({
      managerId: g.managerId,
      deptNames: g.departmentIds
        .map((id) => deptNamesById.get(id))
        .filter((n): n is string => typeof n === 'string'),
    }))
    .filter((g) => g.deptNames.length >= 2);

  if (grupos.length === 0) return undefined;

  // CASO 1 — Una sola línea de mando.
  if (grupos.length === 1) {
    const g = grupos[0];
    return (
      `${g.deptNames.length} áreas críticas dependen de la misma línea de mando: ${formatDeptList(g.deptNames)}. ` +
      `El problema no es geográfico — es jerárquico. ` +
      `O hay un sesgo en cómo se gestionan los equipos bajo ese liderazgo. ` +
      `O hay una decisión estructural que nadie ha cuestionado. ` +
      `O algo está sofocando las preocupaciones antes de que se reporten. ` +
      `Cada ciclo sin abordar esa lectura es uno más sin corrección.`
    );
  }

  // CASO 2 — Múltiples líneas de mando.
  const totalDeptos = grupos.reduce((sum, g) => sum + g.deptNames.length, 0);
  return (
    `${grupos.length} líneas de mando distintas concentran riesgo crítico, cubriendo ${totalDeptos} áreas. ` +
    `No es un caso aislado — es un patrón estructural en la capa intermedia de gestión. ` +
    `O la organización no exige el mismo estándar de liderazgo entre equipos. ` +
    `O hay un perfil compartido entre estos líderes que deja pasar las preocupaciones tempranas. ` +
    `Cuando el patrón se repite bajo distintos responsables, la causa deja de ser individual.`
  );
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 4 — ALERTAS + INTERVENCIONES
// ═══════════════════════════════════════════════════════════════════

interface AlertaInput {
  alertType: ComplianceAlertType;
  title: string;
  departmentName: string | null;
  severity: string;
  status: string;
  signalsCount: number | null;
  teatroCumplimiento?: boolean;
}

function buildAlertas(alertas: AlertaInput[]): AlertaNarrative[] {
  return alertas.map((a) => {
    // Sexta alerta — narrativa propia del doc maestro §6.2. No sigue la
    // lógica genérica de contexto/consecuencia por severity: el hallazgo
    // es la ausencia de voz cruzada con voz externa documentada.
    if (a.alertType === 'silencio_con_voz_externa') {
      const dep = a.departmentName ?? 'Este departamento';
      return {
        alertType: a.alertType,
        titulo: a.title,
        contexto:
          `${dep} no completó esta medición. En el mismo período, ` +
          `otras fuentes documentaron señales activas.`,
        consecuencia:
          'O las personas no sintieron que valía la pena responder. O el ' +
          'departamento atravesaba algo que hizo imposible la participación. ' +
          'O había suficiente miedo a hablar como para no usar ni el canal ' +
          'anónimo. Cualquiera de las tres lecturas merece una conversación.',
        intervencion: INTERVENCIONES[a.alertType],
      };
    }

    // Séptima alerta — outlier de participación. Narrativa propia: el
    // hallazgo es el contraste depto vs empresa, sin cruce de fuentes.
    if (a.alertType === 'participacion_anomala') {
      const dep = a.departmentName ?? 'Este departamento';
      return {
        alertType: a.alertType,
        titulo: a.title,
        contexto:
          `La empresa respondió esta medición. ${dep} se quedó muy por ` +
          `debajo del resto del mapa.`,
        consecuencia:
          'O la convocatoria no llegó como debía. O el equipo dejó de ' +
          'creer que responder cambia algo. O hay algo en esa área que ' +
          'vuelve incómodo participar, incluso de forma anónima. Las tres ' +
          'lecturas piden la misma respuesta — una conversación, no un ' +
          'recordatorio.',
        intervencion: INTERVENCIONES[a.alertType],
      };
    }

    // Regla #1 (Teatro) — si está activo, desplaza la narrativa.
    const contextoBase = a.teatroCumplimiento
      ? 'Los números dicen que está bien. El lenguaje espontáneo dice que no. La distancia es la alerta.'
      : a.signalsCount && a.signalsCount >= 3
        ? 'Tres o más canales coinciden sobre la misma gerencia. Cuando varias vías llegan al mismo hallazgo al mismo tiempo, deja de ser ruido.'
        : a.severity === 'critical'
          ? 'El indicador cruzó el umbral que en otros ciclos precedió salidas concentradas o procesos formales abiertos.'
          : 'El indicador aparece sin soporte cruzado todavía. Amerita monitoreo, no intervención.';

    const consecuencia =
      a.severity === 'critical'
        ? 'Si no se actúa en la ventana de las próximas 48 horas, el costo esperado se mueve de revisión interna a consecuencias legales o salidas concentradas.'
        : a.severity === 'high'
          ? 'La probabilidad de que el cuadro se consolide en el próximo ciclo aumenta con cada semana sin intervención.'
          : 'La señal es informativa hoy. Si vuelve a aparecer en el próximo ciclo, pasará a tener peso propio.';

    return {
      alertType: a.alertType,
      titulo: a.title,
      contexto: contextoBase,
      consecuencia,
      intervencion: INTERVENCIONES[a.alertType],
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// CIERRE
// ═══════════════════════════════════════════════════════════════════

function buildCierre(riesgoDeptos: number, teatroCount: number): CierreNarrative {
  if (teatroCount > 0 && riesgoDeptos > 0) {
    return {
      mensaje:
        'Este ciclo muestra dos frentes distintos: las gerencias donde los números ya advierten, y las que aún no lo hacen pero el lenguaje sí. Ambos se atienden ahora o se cobran después.',
    };
  }
  if (riesgoDeptos === 0 && teatroCount === 0) {
    return {
      mensaje:
        'El mandato para el próximo ciclo es sostener. La estabilidad no es ausencia de acción; es la acción disciplinada de seguir escuchando.',
    };
  }
  if (teatroCount > 0) {
    return {
      mensaje:
        'El dato más revelador del ciclo no es lo que se respondió, sino lo que no se respondió con palabras iguales. Esa distancia guía la prioridad del semestre.',
    };
  }
  return {
    mensaje:
      'El costo de postergar siempre supera el costo de actuar. El ciclo siguiente depende de lo que se haga con este.',
  };
}

// ═══════════════════════════════════════════════════════════════════
// CASCADA EJECUTIVA — narrativas de actos (TASK Cascada Ejecutiva)
// ═══════════════════════════════════════════════════════════════════

/** Narrativa del Acto 1 "El Ambiente" — qué significa el ISA para el negocio. */
export interface Acto1AmbienteNarrative {
  /** Número ancla — SIEMPRE el orgISA (Regla del Río). */
  numeroAncla: number;
  subtitulo: string;
  estado: 'teatro' | 'riesgo_concentrado' | 'sin_riesgo';
  parrafoGancho: string;
  coachingTip: string;
}

/**
 * Acto 1 de la Cascada — traduce el orgISA a lectura de negocio.
 * 3 estados por prioridad: teatro > riesgo concentrado > sin riesgo.
 */
export function buildActo1Ambiente(
  orgISA: number,
  riesgoDeptos: number,
  totalDeptos: number,
  teatroCount: number,
): Acto1AmbienteNarrative {
  // Estado A — Teatro de cumplimiento detectado.
  if (teatroCount > 0) {
    return {
      numeroAncla: orgISA,
      subtitulo: `${teatroCount} ${teatroCount === 1 ? 'gerencia' : 'gerencias'} con señal contradictoria`,
      estado: 'teatro',
      parrafoGancho:
        `${teatroCount} ${teatroCount === 1 ? 'gerencia opera' : 'gerencias operan'} con números saludables este ciclo. ` +
        `Lo que su gente escribió cuando nadie estaba mirando dice otra cosa. ` +
        `O las personas responden lo que se espera de ellas. ` +
        `O el ambiente real vive en las respuestas abiertas, no en las métricas.`,
      coachingTip:
        'La contradicción no es un error del sistema. Es la señal más informativa del ciclo.',
    };
  }

  // Estado B — Riesgo concentrado en algunas gerencias.
  if (riesgoDeptos > 0) {
    return {
      numeroAncla: orgISA,
      subtitulo: `${riesgoDeptos} de ${totalDeptos} gerencias en zona de revisión`,
      estado: 'riesgo_concentrado',
      parrafoGancho:
        `${riesgoDeptos} de ${totalDeptos} gerencias concentran el riesgo del ciclo. ` +
        `El número del ciclo cierra en ${orgISA} — pero un promedio oculta dónde vive el problema. ` +
        `O el deterioro está localizado y la cifra global lo disfraza. ` +
        `O hay gerencias que sostienen lo que otras no pueden.`,
      coachingTip:
        'Un problema concentrado tiene dirección. Eso es una ventaja — si se usa.',
    };
  }

  // Estado C — Sin gerencias en riesgo.
  return {
    numeroAncla: orgISA,
    subtitulo: 'todas las gerencias sobre el umbral',
    estado: 'sin_riesgo',
    parrafoGancho:
      'Todas las gerencias operan sobre el umbral este ciclo. ' +
      'Eso no es el punto de llegada. ' +
      'Es la condición mínima para que el negocio funcione sin desgaste invisible.',
    coachingTip:
      'La estabilidad no se mantiene sola. El próximo ciclo confirmará si fue una tendencia o un resultado aislado.',
  };
}

/** Narrativa del Acto 2 "La Voz" — qué dice la gente con sus palabras. */
export interface Acto2PatronNarrative {
  numeroAncla: number;
  subtitulo: string;
  estado:
    | 'teatro' | 'patron_vertical' | 'patron_sistemico'
    | 'patron_cultural' | 'patron_general' | 'sin_patrones'
    | 'datos_insuficientes';
  /** Fragmentos reales censurados (max 2) del patrón dominante. */
  fragmentos: string[];
  parrafoGancho: string;
  coachingTip: string;
}

/**
 * Acto 2 de la Cascada — cruza el patrón dominante de la voz libre con el
 * meta-análisis de origen. 7 estados por prioridad:
 * teatro > datos insuficientes > vertical > sistémico > cultural >
 * patrón general > sin patrones.
 */
export function buildActo2Patron(
  patrones: PatronNarrative[],
  metaAnalysis: MetaAnalysisOutput | null,
  teatroCount: number,
  totalDeptos: number,
  totalTextResponses: number | null,
): Acto2PatronNarrative {
  // Estado A — Teatro: las métricas y las palabras se contradicen.
  if (teatroCount > 0) {
    return {
      numeroAncla: teatroCount,
      subtitulo: `${teatroCount} ${teatroCount === 1 ? 'gerencia' : 'gerencias'} con contradicción detectada`,
      estado: 'teatro',
      fragmentos: [],
      parrafoGancho:
        `${teatroCount} ${teatroCount === 1 ? 'gerencia opera' : 'gerencias operan'} con números saludables. ` +
        `Las respuestas abiertas de su gente dicen otra cosa. ` +
        `Cuando las métricas y las palabras se contradicen, las palabras tienen razón.`,
      coachingTip:
        'El silencio no es ausencia de problema. A veces es su forma más avanzada.',
    };
  }

  // Estado F — Sin masa suficiente de voz libre para el análisis.
  if (metaAnalysis === null || totalTextResponses === null || totalTextResponses === 0) {
    return {
      numeroAncla: 0,
      subtitulo: 'respuestas abiertas insuficientes',
      estado: 'datos_insuficientes',
      fragmentos: [],
      parrafoGancho:
        'Las respuestas abiertas no tienen masa suficiente para el análisis este ciclo. ' +
        'La voz no habló.',
      coachingTip: '',
    };
  }

  const dominante = patrones.length > 0 ? patrones[0] : null;
  const enGerencias = (n: number) => `${n} ${n === 1 ? 'gerencia' : 'gerencias'}`;

  // Estado B — Patrón dominante con origen vertical (liderazgo).
  if (dominante && metaAnalysis.origen_organizacional === 'vertical_descendente') {
    return {
      numeroAncla: patrones.length,
      subtitulo: `${dominante.nombreLegible} — origen en el liderazgo`,
      estado: 'patron_vertical',
      fragmentos: dominante.fragmentos.slice(0, 2),
      parrafoGancho:
        `${dominante.nombreLegible} aparece en ${enGerencias(dominante.departments.length)}. ` +
        `La señal viene de quien tiene autoridad, no de entre pares. ` +
        `O el liderazgo lo genera sin saberlo. ` +
        `O lo tolera sin verlo. ` +
        `El efecto es el mismo en ambos casos.`,
      coachingTip:
        'Un patrón que viene de arriba no se resuelve desde abajo.',
    };
  }

  // Estado C — Patrón dominante de origen sistémico (procesos).
  if (dominante && metaAnalysis.origen_organizacional === 'sistemico_procesos') {
    return {
      numeroAncla: patrones.length,
      subtitulo: `${dominante.nombreLegible} — origen en los procesos`,
      estado: 'patron_sistemico',
      fragmentos: dominante.fragmentos.slice(0, 2),
      parrafoGancho:
        `${dominante.nombreLegible} aparece en ${enGerencias(dominante.departments.length)}. ` +
        `El origen no son las personas — son los procesos que las rodean. ` +
        `Cambiar personas sin cambiar el diseño reproduce el mismo resultado.`,
      coachingTip:
        'Si el problema es sistémico, la conversación no es con las personas — es sobre cómo está organizado el trabajo.',
    };
  }

  // Estado D — Es un problema cultural (rasgo instalado).
  if (dominante && metaAnalysis.es_problema_cultural) {
    const n = dominante.departments.length;
    const masDeLaMitad = n > totalDeptos / 2;
    return {
      numeroAncla: patrones.length,
      subtitulo: `${dominante.nombreLegible} — rasgo cultural instalado`,
      estado: 'patron_cultural',
      fragmentos: dominante.fragmentos.slice(0, 2),
      parrafoGancho:
        `${dominante.nombreLegible} no está en una gerencia. ` +
        `Está en ${n} de ${totalDeptos} gerencias${masDeLaMitad ? ' — más de la mitad' : ''}. ` +
        `O es una característica instalada, no un incidente. ` +
        `O lleva suficientes ciclos como para haberse normalizado.`,
      coachingTip:
        'Un rasgo cultural no se corrige con una intervención. Se corrige con una decisión sostenida en el tiempo.',
    };
  }

  // Estado G — Hay patrón dominante, pero el origen no apunta a una sola fuente.
  if (dominante) {
    return {
      numeroAncla: patrones.length,
      subtitulo: `${dominante.nombreLegible} — origen no concluyente`,
      estado: 'patron_general',
      fragmentos: dominante.fragmentos.slice(0, 2),
      parrafoGancho:
        `${dominante.nombreLegible} aparece en ${enGerencias(dominante.departments.length)}. ` +
        `La señal no apunta a una sola fuente — ni al liderazgo, ni a los procesos. ` +
        `O el patrón se mueve entre equipos. ` +
        `O todavía no tiene la masa suficiente para mostrar su origen.`,
      coachingTip:
        'Un patrón sin un origen único no se resuelve con una sola conversación.',
    };
  }

  // Estado E — Sin patrones de alerta; la voz libre confirma las métricas.
  return {
    numeroAncla: 0,
    subtitulo: 'sin señales en las respuestas abiertas',
    estado: 'sin_patrones',
    fragmentos: [],
    parrafoGancho:
      'Las respuestas abiertas de este ciclo no muestran señales de alerta. ' +
      'Lo que su gente escribió es consistente con lo que marcó. ' +
      'Es la señal más difícil de obtener — y la más valiosa.',
    coachingTip:
      'Cuando la voz libre confirma las métricas, la organización no tiene nada que ocultar.',
  };
}

/** Narrativa del Acto 3 "Las Señales" — el costo confirmado por fuentes independientes. */
export interface Acto3SenalesNarrative {
  /** Número ancla — gerencias del tier del estado dominante. */
  numeroAncla: number;
  subtitulo: string;
  estado: 'convergencia' | 'senal_aislada' | 'sin_senales';
  parrafoGancho: string;
  coachingTip: string;
}

/**
 * Acto 3 de la Cascada — qué señales confirman fuentes independientes.
 * 3 estados por severidad del nivelFinal presente entre las gerencias.
 */
export function buildActo3Senales(
  departments: DepartmentConvergencia[],
): Acto3SenalesNarrative {
  const enGerencias = (n: number) => `${n} ${n === 1 ? 'gerencia' : 'gerencias'}`;
  const CONFIRMADAS: NivelFinal[] = ['confirmada', 'amplificada', 'critica_sistema'];
  const UNA_FUENTE: NivelFinal[] = ['interna_solo', 'externa_solo'];

  const confirmadas = departments.filter((d) => CONFIRMADAS.includes(d.nivelFinal)).length;
  const unaFuente = departments.filter((d) => UNA_FUENTE.includes(d.nivelFinal)).length;

  // Estado A — Convergencia: fuentes independientes confirman la misma señal.
  if (confirmadas > 0) {
    return {
      numeroAncla: confirmadas,
      subtitulo: `${enGerencias(confirmadas)} con señales que varias fuentes confirman`,
      estado: 'convergencia',
      parrafoGancho:
        `${enGerencias(confirmadas)} ${confirmadas === 1 ? 'muestra' : 'muestran'} señales que más de una fuente confirma. ` +
        `Lo que dice la encuesta interna, lo que reportan quienes se fueron y quienes recién entraron — todo apunta al mismo lugar. ` +
        `Cuando fuentes independientes coinciden, deja de ser una percepción. Es un hecho con costo.`,
      coachingTip:
        'Una señal que una sola fuente detecta puede ser ruido. Una que varias confirman, ya no.',
    };
  }

  // Estado B — Señal de una sola fuente, aún sin confirmación cruzada.
  if (unaFuente > 0) {
    return {
      numeroAncla: unaFuente,
      subtitulo: `${enGerencias(unaFuente)} con señal de una sola fuente`,
      estado: 'senal_aislada',
      parrafoGancho:
        `${enGerencias(unaFuente)} ${unaFuente === 1 ? 'tiene' : 'tienen'} una señal activa este ciclo. ` +
        `Una fuente la marca con claridad — pero todavía no hay una segunda que la confirme. ` +
        `O es un problema que recién empieza a dejar rastro. ` +
        `O es una señal aislada que el próximo ciclo dirá si crece.`,
      coachingTip:
        'Una señal sin confirmar no se ignora. Se vigila.',
    };
  }

  // Estado C — Sin señales cruzadas.
  return {
    numeroAncla: 0,
    subtitulo: 'sin señales cruzadas este ciclo',
    estado: 'sin_senales',
    parrafoGancho:
      'Ninguna gerencia muestra señales cruzadas este ciclo. ' +
      'Lo que detecta la encuesta interna no aparece en las otras fuentes — ni en quienes se fueron, ni en quienes entraron. ' +
      'Es la lectura más tranquila que puede entregar un ciclo.',
    coachingTip:
      'La ausencia de señales cruzadas no es suerte. Es el resultado de lo que se hizo bien.',
  };
}

/** Narrativa del Acto 4 "Las Alertas" — el riesgo futuro si no se actúa. */
export interface Acto4AlertasNarrative {
  /** Número ancla — alertas activas (no resueltas ni descartadas). */
  numeroAncla: number;
  subtitulo: string;
  estado: 'critica' | 'activa' | 'sin_alertas';
  parrafoGancho: string;
  coachingTip: string;
}

/**
 * Acto 4 de la Cascada — qué alertas siguen abiertas y qué pasa si no se actúa.
 * "Activa" = status distinto de 'resolved' y 'dismissed' (canónico del módulo).
 */
export function buildActo4Alertas(alertas: AlertaInput[]): Acto4AlertasNarrative {
  const activas = alertas.filter(
    (a) => a.status !== 'resolved' && a.status !== 'dismissed',
  );
  const criticas = activas.filter((a) => a.severity === 'critical');
  const enAlertas = (n: number) => `${n} ${n === 1 ? 'alerta activa' : 'alertas activas'}`;

  // Estado A — Hay alertas críticas sin resolver.
  if (criticas.length > 0) {
    return {
      numeroAncla: activas.length,
      subtitulo: `${criticas.length} ${criticas.length === 1 ? 'alerta crítica' : 'alertas críticas'} sin resolver`,
      estado: 'critica',
      parrafoGancho:
        `Este ciclo cierra con ${activas.length} ${activas.length === 1 ? 'alerta abierta' : 'alertas abiertas'} — ` +
        `${criticas.length} en nivel crítico. ` +
        `Una alerta crítica no es un pendiente administrativo — es una señal que ya cruzó el umbral. ` +
        `O se resuelve antes del próximo ciclo. ` +
        `O deja de ser una alerta y pasa a ser un hecho.`,
      coachingTip:
        'Lo que hoy es una alerta, sin decisión, mañana es un caso.',
    };
  }

  // Estado B — Alertas activas, ninguna en nivel crítico.
  if (activas.length > 0) {
    return {
      numeroAncla: activas.length,
      subtitulo: enAlertas(activas.length),
      estado: 'activa',
      parrafoGancho:
        `${enAlertas(activas.length)} este ciclo, ninguna en nivel crítico. ` +
        `Es la ventana en la que una señal todavía se gestiona sin costo. ` +
        `O se atienden mientras son manejables. ` +
        `O escalan hasta que dejan de serlo.`,
      coachingTip:
        'El momento más barato para actuar sobre una alerta es ahora. Siempre.',
    };
  }

  // Estado C — Sin alertas activas.
  return {
    numeroAncla: 0,
    subtitulo: 'sin alertas activas este ciclo',
    estado: 'sin_alertas',
    parrafoGancho:
      'Ninguna alerta quedó abierta este ciclo. ' +
      'No es que el sistema no haya buscado — buscó y no encontró nada que escalara. ' +
      'Es el resultado de un ambiente que se gestionó a tiempo.',
    coachingTip:
      'Cerrar el ciclo sin alertas no baja la guardia. La confirma.',
  };
}

/** Síntesis "El Francotirador" — una gerencia · una raíz · una decisión. */
export interface SintesisFrancotirador {
  estado: 'cultural' | 'localizado' | 'sistemico' | 'positivo';
  /** "Este no es un problema de X. Es un problema de Y." */
  classification: string;
  /** Por qué esa clasificación importa. */
  implication: string;
  /** Cierre — "El próximo ciclo confirmará...". */
  accountability: string;
  /** Label del CTA al plan. */
  ctaLabel: string;
}

/** Traducción del origen organizacional a lenguaje ejecutivo. */
const ORIGEN_LABELS: Record<OrigenOrganizacional, string> = {
  vertical_descendente: 'viene de quien tiene autoridad',
  horizontal_pares: 'está entre equipos, no en el liderazgo',
  sistemico_procesos: 'es de diseño, no de personas',
  mixto: 'no tiene una sola fuente',
  indeterminado: 'aún no tiene dirección clara',
};

/**
 * Síntesis de la Cascada — colapsa criticalByManager + origen + riesgo en
 * "una gerencia · una raíz · una decisión". 4 estados por prioridad:
 * positivo > cultural > localizado > sistémico.
 * `criticalByManager` debe venir ordenado por minIsa ASC (B4) — [0] = peor grupo.
 */
/**
 * @deprecated Gate 3 (2026-06-06). Reemplazado por `AmbienteSynthesisEngine`.
 * Esta función sobrevive sólo para no romper consumidores legacy de la key
 * `ReportNarratives.cascada.sintesis` mientras Beat 6 UI migra a leer
 * `payload.synthesis` (Gate 4). Eliminar en Gate 8 junto con la key
 * `cascada.sintesis` completa.
 *
 * El categorizador if/else de 4 estados (positivo/cultural/localizado/sistemico)
 * NO implementa el patrón Talento detect→score→priority→diferencial — por eso
 * el hilo Beat 1 ↔ Beat 6 quedaba roto. Ver plan §3.1.2 + §3.5.
 */
export function buildCierreFrancotirador(
  criticalByManager: CriticalByManagerGroup[],
  metaAnalysis: MetaAnalysisOutput | null,
  departments: DepartmentConvergencia[],
  riesgoDeptos: number,
): SintesisFrancotirador {
  const origen = ORIGEN_LABELS[metaAnalysis?.origen_organizacional ?? 'indeterminado'];
  const deptNamesById = new Map(
    departments.map((d) => [d.departmentId, d.departmentName]),
  );
  const resolveNames = (ids: string[]): string[] =>
    ids.map((id) => deptNamesById.get(id)).filter((n): n is string => typeof n === 'string');

  // Estado D — Positivo: sin gerencias en riesgo ni concentración bajo un mando.
  if (riesgoDeptos === 0 && criticalByManager.length === 0) {
    return {
      estado: 'positivo',
      classification: 'Este ciclo no registra gerencias en zona crítica.',
      implication:
        'El mandato no es celebrar. ' +
        'Es sostener las condiciones que produjeron este resultado.',
      accountability: 'El próximo ciclo confirmará si fue una tendencia.',
      ctaLabel: 'Ir al plan',
    };
  }

  // Estado A — Cultural: el patrón cruza la organización.
  if (metaAnalysis?.es_problema_cultural === true) {
    const peorGrupo = criticalByManager[0] ?? null;
    const nombres = peorGrupo ? resolveNames(peorGrupo.departmentIds) : [];
    const classification =
      nombres.length > 0
        ? `Este no es un problema de ${formatDeptList(nombres)}. ` +
          'Es el patrón que ahí se manifiesta primero.'
        : 'Este no es un problema de una gerencia puntual. ' +
          'Es un patrón que ya cruza la organización.';
    return {
      estado: 'cultural',
      classification,
      implication:
        `El origen ${origen}. ` +
        'Intervenir solo en un lugar es tratar el síntoma.',
      accountability:
        'El próximo ciclo confirmará si estas decisiones fueron al fondo o a la superficie.',
      ctaLabel: 'Ir al plan',
    };
  }

  // Estado B — Localizado: el riesgo se concentra bajo una línea de mando.
  if (criticalByManager.length > 0) {
    const nombres = resolveNames(criticalByManager[0].departmentIds);
    const concentra =
      nombres.length > 0
        ? `${formatDeptList(nombres)} concentran el riesgo bajo una misma línea de mando.`
        : 'Un grupo de gerencias concentra el riesgo bajo una misma línea de mando.';
    return {
      estado: 'localizado',
      classification:
        'Este no es un problema cultural. Es un problema con dirección identificada.',
      implication:
        `${concentra} El origen ${origen}. ` +
        'El problema tiene nombre. La decisión también.',
      accountability:
        'El próximo ciclo confirmará si estas decisiones fueron efectivas.',
      ctaLabel: 'Ir al plan',
    };
  }

  // Estado C — Sistémico: hay riesgo, pero sin línea de mando común.
  return {
    estado: 'sistemico',
    classification:
      'Este no es un problema de liderazgo. Es un problema de diseño.',
    implication:
      `${riesgoDeptos} ${riesgoDeptos === 1 ? 'gerencia' : 'gerencias'} en zona de revisión este ciclo sin línea de mando común. ` +
      'O el problema es sistémico. ' +
      'O todavía no tiene masa suficiente para identificar el patrón.',
    accountability: 'El próximo ciclo dirá cuál de las dos.',
    ctaLabel: 'Ir al plan',
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSICIÓN
// ═══════════════════════════════════════════════════════════════════

export interface BuildNarrativesInput {
  orgSafetyScore: number | null;
  /** ISA org-level (promedio ponderado). null si ningún depto tiene ISA. */
  orgISA: number | null;
  /** Suma de respuestas P1 (voz libre) org-level. null en payloads legacy. */
  totalTextResponses: number | null;
  scores: DepartmentSafetyScore[];
  departmentAnalyses: Array<{
    departmentName: string;
    parentDepartmentName: string | null;
    payload: PatronAnalysisOutput | null;
    teatroCumplimiento: boolean;
  }>;
  meta: MetaAnalysisOutput | null;
  convergencias: DepartmentConvergencia[];
  /** Unión cross-dept de fuentes activas — para cruceNarrativa. */
  activeSourcesGlobal: ComplianceSource[];
  /** Grupos de deptos críticos bajo el mismo managerId — para criticalByManagerNarrativa. */
  criticalByManager: ConvergenciaGlobals['criticalByManager'];
  alertas: AlertaInput[];
  /** Score de la campaña anterior cerrada (misma slug + account), o null. */
  previousOrgScore?: number | null;
  /** Etiqueta ejecutiva corta de la campaña anterior — ej. "Semestre 2 2025". */
  previousCampaignLabel?: string | null;
}

export function buildReportNarratives(input: BuildNarrativesInput): ReportNarratives {
  const departmentsCount = input.scores.length;
  const riesgoDeptos = input.scores.filter(
    (s) => s.riskLevel === 'risk' || s.riskLevel === 'critical'
  ).length;
  const teatroCount = input.departmentAnalyses.filter((d) => d.teatroCumplimiento).length;

  // Lookup id→name desde convergencias para criticalByManagerNarrativa.
  const deptNamesById = new Map(
    input.convergencias.map((c) => [c.departmentId, c.departmentName])
  );
  const patrones = buildPatrones(input.departmentAnalyses);

  return {
    portada: buildPortada(
      input.meta,
      departmentsCount,
      riesgoDeptos,
      teatroCount,
      input.orgSafetyScore,
      input.previousOrgScore ?? null,
      input.previousCampaignLabel ?? null
    ),
    ancla: buildAncla(input.orgSafetyScore, departmentsCount, teatroCount),
    artefacto1_dimensiones: buildDimensiones(input.scores),
    artefacto2_patrones: patrones,
    alertasGenero: buildAlertasGenero(input.departmentAnalyses),
    artefacto3_convergencia: buildConvergencia(input.convergencias),
    cruceNarrativa: buildConvergenciaCruce(
      input.convergencias,
      input.activeSourcesGlobal
    ),
    criticalByManagerNarrativa: buildCriticalByManagerNarrative(
      input.criticalByManager,
      deptNamesById
    ),
    artefacto4_alertas: buildAlertas(input.alertas),
    cierre: buildCierre(riesgoDeptos, teatroCount),
    cascada:
      input.orgISA !== null
        ? {
            acto1: buildActo1Ambiente(input.orgISA, riesgoDeptos, departmentsCount, teatroCount),
            acto2: buildActo2Patron(patrones, input.meta, teatroCount, departmentsCount, input.totalTextResponses),
            acto3: buildActo3Senales(input.convergencias),
            acto4: buildActo4Alertas(input.alertas),
            sintesis: buildCierreFrancotirador(input.criticalByManager, input.meta, input.convergencias, riesgoDeptos),
          }
        : undefined,
  };
}
