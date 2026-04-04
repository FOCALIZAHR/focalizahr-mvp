// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE NARRATIVAS — EVALUADORES
// src/config/narratives/EvaluadorNarrativeDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// 4 estilos de evaluación + 3 gap narratives + acto 2 impacto compensaciones.
// Auditado contra 6 Reglas de Oro (skill focalizahr-narrativas).
// Consumidores: EvaluadorHeatmap + EvaluadorPatronG
// ════════════════════════════════════════════════════════════════════════════

export type EvaluatorStyle = 'SEVERA' | 'CENTRAL' | 'OPTIMA' | 'INDULGENTE'

export interface EvaluadorNarrative {
  observation: string
  coachingTip: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVAS POR ESTILO
// ════════════════════════════════════════════════════════════════════════════

export const EVALUADOR_NARRATIVE_DICTIONARY: Record<EvaluatorStyle, EvaluadorNarrative> = {
  SEVERA: {
    observation:
      'Evalúa con estándar alto. Su equipo puede estar subvalorado — las evaluaciones no reflejan la ejecución real.',
    coachingTip:
      '¿El estándar es intencional o falta visibilidad sobre lo que el equipo entrega?',
  },
  INDULGENTE: {
    observation:
      'Califica consistentemente alto sin diferenciación. Las evaluaciones no distinguen quién realmente destaca — y quienes sí rinden lo notan.',
    coachingTip:
      'El líder puede estar priorizando la relación sobre la exigencia.',
  },
  CENTRAL: {
    observation:
      'Evaluaciones concentradas en el medio. No hay estrellas ni alertas — pero tampoco hay información útil para decidir.',
    coachingTip:
      'La zona gris impide identificar a quién desarrollar y a quién proteger.',
  },
  OPTIMA: {
    observation:
      'Diferencia bien el desempeño. Sus evaluaciones se correlacionan con los resultados que su equipo entrega.',
    coachingTip: null,
  },
}

export function getEvaluadorNarrative(style: string | null): EvaluadorNarrative | null {
  if (!style) return null
  return EVALUADOR_NARRATIVE_DICTIONARY[style as EvaluatorStyle] ?? null
}

// ════════════════════════════════════════════════════════════════════════════
// GAP NARRATIVES (dinámicas, reciben nombre del evaluador)
// ════════════════════════════════════════════════════════════════════════════

export function getGapNarrative(firstName: string, coherenceGap: number): string {
  if (coherenceGap >= 40) {
    return `Las evaluaciones de ${firstName} no predicen resultados. La distancia entre lo que evalúa y lo que su equipo entrega es de ${coherenceGap}%.`
  }
  if (coherenceGap >= 20) {
    return `Desconexión moderada entre cómo evalúa ${firstName} y lo que su equipo entrega. Las decisiones de compensación basadas en esta evaluación tienen ruido.`
  }
  return 'Evaluación alineada con resultados. Base confiable para decisiones de compensación.'
}

// ════════════════════════════════════════════════════════════════════════════
// ACTO 2 — IMPACTO EN COMPENSACIONES (narrativa dinámica)
// ════════════════════════════════════════════════════════════════════════════

export function getCompensationImpactNarrative(
  name: string,
  evaluatedCount: number,
  totalInCheckpoint: number,
  perceptionBiasCount: number,
): string {
  let text = `De ${evaluatedCount} personas evaluadas por ${name}, ${totalInCheckpoint} están en el checkpoint de compensación.`

  if (perceptionBiasCount > 0) {
    text += ` En ${perceptionBiasCount}, la evaluación no coincide con los resultados — y este líder es parte de la explicación.`
    text += ' La discrepancia tiene nombre y responsable.'
  }

  return text
}
