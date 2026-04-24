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

// ═══════════════════════════════════════════════════════════════════
// TIPOS DE SALIDA
// ═══════════════════════════════════════════════════════════════════

export interface ReportNarratives {
  portada: PortadaNarrative;
  ancla: AnclaNarrative;
  artefacto1_dimensiones: DimensionNarrative[];
  artefacto2_patrones: PatronNarrative[];
  artefacto3_convergencia: ConvergenciaNarrative[];
  artefacto4_alertas: AlertaNarrative[];
  cierre: CierreNarrative;
}

export interface PortadaNarrative {
  titular: string;
  subtitular: string;
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

const PATRON_LABELS: Record<PatronNombre, string> = {
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

function classifyDimension(score: number | null): 'sano' | 'atencion' | 'riesgo' {
  if (score === null) return 'atencion';
  if (score < 3.0) return 'riesgo';
  if (score < 3.5) return 'atencion';
  return 'sano';
}

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

function buildPortada(
  meta: MetaAnalysisOutput | null,
  departmentsCount: number,
  riesgoDeptos: number,
  teatroCount: number
): PortadaNarrative {
  if (meta?.hallazgo_narrativo_portada) {
    return {
      titular: meta.hallazgo_narrativo_portada,
      subtitular:
        riesgoDeptos > 0
          ? `${riesgoDeptos} de ${departmentsCount} gerencias muestran señales que ameritan revisión.`
          : 'Las señales agregadas sostienen un diagnóstico general saludable.',
    };
  }

  if (teatroCount >= 2) {
    return {
      titular:
        'Los números dicen una cosa; las respuestas, otra. La diferencia es la señal.',
      subtitular: `${teatroCount} gerencias puntúan alto en las métricas duras pero su lenguaje sugiere contención.`,
    };
  }

  if (riesgoDeptos === 0) {
    return {
      titular: 'La organización opera con márgenes saludables en el ambiente de trabajo.',
      subtitular:
        'Ninguna gerencia entra en zona de revisión crítica. El foco está en sostener lo que funciona.',
    };
  }

  return {
    titular: `${riesgoDeptos} gerencias concentran el riesgo del semestre.`,
    subtitular:
      'El análisis revela concentración, no dispersión. Eso ordena la prioridad.',
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

  const dimensionKeys = [
    'P2_seguridad',
    'P3_disenso',
    'P4_microagresiones',
    'P5_equidad',
    'P7_liderazgo',
    'P8_agotamiento',
  ] as const;

  return dimensionKeys.map((key) => {
    const values = scores
      .map((s) => s.dimensionScores[key])
      .filter((v): v is number => v !== null);

    if (values.length === 0) {
      return {
        dimensionKey: key,
        dimensionNombre: DIMENSION_LABELS[key],
        nivel: 'atencion',
        narrativa:
          'No hubo suficientes respuestas sobre el umbral de anonimato para una lectura representativa.',
      };
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const nivel = classifyDimension(avg);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min;

    const deptMin = scores.find((s) => s.dimensionScores[key] === min);
    const deptMax = scores.find((s) => s.dimensionScores[key] === max);

    let narrativa: string;
    if (nivel === 'sano' && spread < 0.8) {
      narrativa =
        'La lectura es consistente entre gerencias. No hay brechas que requieran foco específico.';
    } else if (nivel === 'sano') {
      narrativa = `El promedio es sólido, pero la distancia entre ${deptMax?.departmentName ?? 'la mejor'} y ${deptMin?.departmentName ?? 'la más baja'} es ${spread.toFixed(1)} puntos. O la diferencia es de madurez de equipo, o hay una práctica concreta que una gerencia encontró y el resto no.`;
    } else if (nivel === 'atencion') {
      narrativa = `El promedio está en zona gris. La concentración del riesgo está en ${deptMin?.departmentName ?? 'una gerencia específica'}, que aporta el valor más bajo del grupo.`;
    } else {
      narrativa = `La dimensión cae por debajo del umbral de observación. La brecha con las gerencias más altas (${spread.toFixed(1)} puntos) descarta que sea un problema global: es localizado.`;
    }

    return {
      dimensionKey: key,
      dimensionNombre: DIMENSION_LABELS[key],
      nivel,
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
    { total: number; sumInt: number; deptos: string[] }
  >();

  for (const d of departmentAnalyses) {
    const patrones = d.payload?.patrones ?? [];
    for (const p of patrones) {
      const bucket = byPattern.get(p.nombre) ?? { total: 0, sumInt: 0, deptos: [] };
      bucket.total++;
      bucket.sumInt += p.intensidad;
      bucket.deptos.push(d.departmentName);
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

    arr.push({
      nombre,
      nombreLegible: PATRON_LABELS[nombre],
      intensidad: avgInt,
      descripcion,
    });
  }

  return arr.sort((a, b) => b.intensidad - a.intensidad).slice(0, 5);
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
    payload: PatronAnalysisOutput | null;
    teatroCumplimiento: boolean;
  }>;
  meta: MetaAnalysisOutput | null;
  convergencias: DepartmentConvergencia[];
  alertas: AlertaInput[];
}

export function buildReportNarratives(input: BuildNarrativesInput): ReportNarratives {
  const departmentsCount = input.scores.length;
  const riesgoDeptos = input.scores.filter(
    (s) => s.riskLevel === 'risk' || s.riskLevel === 'critical'
  ).length;
  const teatroCount = input.departmentAnalyses.filter((d) => d.teatroCumplimiento).length;

  return {
    portada: buildPortada(input.meta, departmentsCount, riesgoDeptos, teatroCount),
    ancla: buildAncla(input.orgSafetyScore, departmentsCount, teatroCount),
    artefacto1_dimensiones: buildDimensiones(input.scores),
    artefacto2_patrones: buildPatrones(input.departmentAnalyses),
    artefacto3_convergencia: buildConvergencia(input.convergencias),
    artefacto4_alertas: buildAlertas(input.alertas),
    cierre: buildCierre(riesgoDeptos, teatroCount),
  };
}
