// src/config/complianceAlertConfig.ts
// Single source of truth de los tipos de alerta de Compliance (Ambiente Sano).
// Los 5 tipos definidos en el TASK_COMPLIANCE_AMBIENTE_SANO_IMPLEMENTATION § D8:
//
//  - riesgo_convergente:     Safety + Liderazgo bajos                (72h)
//  - liderazgo_toxico:       Safety < 2.5 en 2+ deptos mismo gerente  (48h)
//  - silencio_organizacional: LLM detecta patrón                     (informativa)
//  - deterioro_sostenido:    Clima cae 3 períodos consecutivos       (168h)
//  - senal_ignorada:         EXO bajo + salida posterior             (informativa)
//
// Degradación elegante O4: los dos últimos requieren histórico (Pulso/Exit/Onboarding).
// Si el account no tiene ese producto, el ConvergenciaEngine saltea silenciosamente.

export type ComplianceAlertType =
  | 'riesgo_convergente'
  | 'liderazgo_toxico'
  | 'silencio_organizacional'
  | 'deterioro_sostenido'
  | 'senal_ignorada'
  | 'silencio_con_voz_externa'
  | 'participacion_anomala';

export type ComplianceSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informativa';

export type ComplianceSource = 'ambiente_sano' | 'exit' | 'onboarding' | 'pulso';

export interface ComplianceAlertConfig {
  type: ComplianceAlertType;
  severity: ComplianceSeverity;
  /** null = alerta informativa sin SLA */
  slaHours: number | null;
  /** Instrumentos necesarios para que la alerta sea computable. */
  requiredSources: ComplianceSource[];
  /** Template del título (se rellena en el AlertService con displayName del depto). */
  titleTemplate: string;
  descriptionTemplate: string;
}

export const COMPLIANCE_ALERT_TYPES: Record<ComplianceAlertType, ComplianceAlertConfig> = {
  riesgo_convergente: {
    type: 'riesgo_convergente',
    severity: 'high',
    slaHours: 72,
    requiredSources: ['ambiente_sano'],
    titleTemplate: 'Riesgo convergente en {department}',
    descriptionTemplate:
      'Se detectaron señales concurrentes bajo umbral en {signalsCount} instrumentos. La convergencia amplifica el riesgo y sugiere revisión del departamento.',
  },
  liderazgo_toxico: {
    type: 'liderazgo_toxico',
    severity: 'critical',
    slaHours: 48,
    requiredSources: ['ambiente_sano'],
    titleTemplate: 'Patrón de liderazgo crítico en {scope}',
    descriptionTemplate:
      '{departmentsCount} departamentos bajo la misma línea jerárquica presentan Safety Score crítico (< 2.5). El patrón sugiere revisión del estilo de liderazgo.',
  },
  silencio_organizacional: {
    type: 'silencio_organizacional',
    severity: 'informativa',
    slaHours: null,
    requiredSources: ['ambiente_sano'],
    titleTemplate: 'Silencio organizacional detectado en {department}',
    descriptionTemplate:
      'El análisis de respuestas proyectivas sugiere evasión y desconexión emocional en el departamento. Señal temprana, sin obligación de acción inmediata.',
  },
  deterioro_sostenido: {
    type: 'deterioro_sostenido',
    severity: 'high',
    slaHours: 168,
    requiredSources: ['pulso'],
    titleTemplate: 'Deterioro sostenido de clima en {department}',
    descriptionTemplate:
      'El score de clima cae de forma consistente durante {periodsCount} períodos consecutivos. La tendencia sugiere un problema estructural, no coyuntural.',
  },
  senal_ignorada: {
    type: 'senal_ignorada',
    severity: 'informativa',
    slaHours: null,
    requiredSources: ['onboarding', 'exit'],
    titleTemplate: 'Señal de onboarding correlacionada con salida en {department}',
    descriptionTemplate:
      'Se detectaron salidas posteriores a journeys con EXO bajo (< 60). La correlación indica que señales tempranas no se tradujeron en intervención.',
  },
  // Sexta alerta (doc maestro CONVERGENCIA_AMBIENTE_SANO_v3 §6.2).
  // Departamento sin cobertura de Ambiente Sano (dotación insuficiente,
  // sin respuestas, o participación < 50%) PERO con señales externas
  // activas. La simétrica de senal_ignorada: "ni medimos, pero el síntoma
  // está documentado en otra fuente". NO requiere ambiente_sano.
  silencio_con_voz_externa: {
    type: 'silencio_con_voz_externa',
    severity: 'high',
    slaHours: 72,
    requiredSources: ['exit', 'onboarding'],
    titleTemplate: 'Señales sin medición en {department}',
    descriptionTemplate:
      '{department} no completó esta medición. En el mismo período, otras fuentes documentaron señales activas. La ausencia de voz, cruzada con voz externa documentada, no es un problema de campo — es el hallazgo.',
  },
  // Séptima alerta (post-v1.0). Outlier de participación: un departamento
  // que respondió muy por debajo del resto de la empresa. Sin cruce externo
  // — es un contraste estadístico depto vs empresa. Severidad media,
  // informativa (sin SLA).
  participacion_anomala: {
    type: 'participacion_anomala',
    severity: 'medium',
    slaHours: null,
    requiredSources: ['ambiente_sano'],
    titleTemplate: 'Participación rezagada en {department}',
    descriptionTemplate:
      'La empresa respondió esta medición. {department} se quedó muy por debajo del resto. Cuando una sola área participa tanto menos, la baja respuesta deja de ser un dato de campo.',
  },
};

/** Devuelve la config o null si el tipo no existe. Útil para validar input externo. */
export function getComplianceAlertConfig(
  type: string
): ComplianceAlertConfig | null {
  return (COMPLIANCE_ALERT_TYPES as Record<string, ComplianceAlertConfig>)[type] ?? null;
}
