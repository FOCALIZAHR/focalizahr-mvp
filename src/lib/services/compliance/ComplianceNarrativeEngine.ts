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
//   - "acoso", "hostigamiento", "denuncia", "Ley Karin"
//   - "seguridad psicológica", "psicosocial"
//   - "Safety Score", "EXO", "LLM", "convergencia"
//   - "se recomienda", "deberías", "es necesario"

import type { ComplianceAlertType } from '@/config/complianceAlertConfig';
import type { DepartmentSafetyScore } from '@/lib/services/SafetyScoreService';
import type {
  MetaAnalysisOutput,
  PatronAnalysisOutput,
  PatronNombre,
} from './complianceTypes';
import type { DepartmentConvergencia } from './ConvergenciaEngine';
import {
  resolveDimensionNarrative,
  type ComplianceDimensionKey,
} from '@/config/narratives/ComplianceNarrativeDictionary';

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
  artefacto4_alertas: AlertaNarrative[];
  cierre: CierreNarrative;
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
  nivel: 'sano' | 'atencion' | 'riesgo';
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
  P2_seguridad: 'Clima de confianza para reportar',
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
    const { uiLevel, narrativa } = resolveDimensionNarrative(key, orgScore);

    return {
      dimensionKey: key,
      dimensionNombre: DIMENSION_LABELS[key],
      nivel: uiLevel,
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

function buildConvergencia(
  deptos: DepartmentConvergencia[]
): ConvergenciaNarrative[] {
  return deptos
    .filter((d) => d.level !== 'sin_riesgo')
    .map((d) => {
      const parts: string[] = [];

      const safety = d.signals.ambiente_sano;
      const exit = d.signals.exit;
      const exo = d.signals.onboarding;
      const pulso = d.signals.pulso;

      // Contradicción protagonista (Regla #1)
      let contradiccion: string | undefined;
      if (safety && !safety.isRisk && exit?.isRisk) {
        contradiccion =
          'El clima actual se ve sano, pero las salidas recientes cuentan una historia distinta.';
      } else if (safety?.isRisk && exo && !exo.isRisk) {
        contradiccion =
          'Los ingresos nuevos no perciben el problema que el equipo actual sí reporta. O el deterioro es reciente, o el ingreso aún no lo ha tocado.';
      } else if (pulso?.isRisk && safety && !safety.isRisk) {
        contradiccion =
          'El clima medido en pulsos recientes cae de forma sostenida, aunque el diagnóstico actual lo matiza.';
      }

      // Cuerpo según nivel
      if (d.level === 'critico') {
        parts.push(
          `${d.departmentName} concentra el riesgo del semestre: la lectura base está bajo el umbral y otras fuentes lo confirman.`
        );
      } else if (d.level === 'convergente') {
        parts.push(
          `${d.departmentName} muestra señales concurrentes en ${d.riskSignalsCount} instrumentos. La convergencia, no la magnitud individual, es lo que ordena la prioridad.`
        );
      } else if (d.level === 'medio') {
        parts.push(
          `${d.departmentName} aparece en dos instrumentos distintos. No es crítico, pero el patrón se insinúa.`
        );
      } else {
        parts.push(
          `${d.departmentName} registra una señal aislada. Ameritaría monitoreo, no acción inmediata.`
        );
      }

      if (contradiccion) parts.push(contradiccion);

      return {
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        nivel: d.level,
        narrativa: parts.join(' '),
        contradiccionProtagonista: contradiccion,
      };
    });
}

// ═══════════════════════════════════════════════════════════════════
// ARTEFACTO 4 — ALERTAS + INTERVENCIONES
// ═══════════════════════════════════════════════════════════════════

interface AlertaInput {
  alertType: ComplianceAlertType;
  title: string;
  departmentName: string | null;
  severity: string;
  signalsCount: number | null;
  teatroCumplimiento?: boolean;
}

function buildAlertas(alertas: AlertaInput[]): AlertaNarrative[] {
  return alertas.map((a) => {
    // Regla #1 (Teatro) — si está activo, desplaza la narrativa.
    const contextoBase = a.teatroCumplimiento
      ? 'Los números dicen que está bien. Las respuestas proyectivas dicen que no. La distancia es la alerta.'
      : a.signalsCount && a.signalsCount >= 3
        ? 'Tres o más instrumentos coinciden en la misma gerencia. La concurrencia eleva la señal por encima del ruido.'
        : a.severity === 'critical'
          ? 'El indicador base cruzó el umbral que en otros ciclos precedió salidas concentradas o denuncias formales.'
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
// COMPOSICIÓN
// ═══════════════════════════════════════════════════════════════════

export interface BuildNarrativesInput {
  orgSafetyScore: number | null;
  scores: DepartmentSafetyScore[];
  departmentAnalyses: Array<{
    departmentName: string;
    parentDepartmentName: string | null;
    payload: PatronAnalysisOutput | null;
    teatroCumplimiento: boolean;
  }>;
  meta: MetaAnalysisOutput | null;
  convergencias: DepartmentConvergencia[];
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
    artefacto2_patrones: buildPatrones(input.departmentAnalyses),
    alertasGenero: buildAlertasGenero(input.departmentAnalyses),
    artefacto3_convergencia: buildConvergencia(input.convergencias),
    artefacto4_alertas: buildAlertas(input.alertas),
    cierre: buildCierre(riesgoDeptos, teatroCount),
  };
}
