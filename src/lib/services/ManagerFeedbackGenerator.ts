// ════════════════════════════════════════════════════════════════════════════
// MANAGER FEEDBACK GENERATOR
// src/lib/services/ManagerFeedbackGenerator.ts
// ════════════════════════════════════════════════════════════════════════════
// Genera scripts de comunicación para managers post-calibración
// Diferencia entre upgrade, downgrade y sin cambio
// ════════════════════════════════════════════════════════════════════════════

export interface FeedbackContext {
  employeeName: string
  originalScore: number
  finalScore: number
  originalLevel: string
  finalLevel: string
  justification: string
}

export function generateManagerFeedback(context: FeedbackContext): string {
  const { employeeName, originalScore, finalScore, justification } = context

  const delta = finalScore - originalScore
  const wasDowngraded = delta < -0.01
  const wasUpgraded = delta > 0.01

  // ═══ DOWNGRADE (más delicado) ═══
  if (wasDowngraded) {
    return `Hola,

Quiero conversar contigo sobre la evaluación de ${employeeName}.

Durante nuestra sesión de calibración, revisamos exhaustivamente todas las evaluaciones para asegurar equidad en el proceso.

**Cambio Aplicado:**
- Score original: ${originalScore.toFixed(1)}
- Score calibrado: ${finalScore.toFixed(1)}

**Contexto del Ajuste:**
${justification}

Este ajuste busca reflejar de manera más precisa el desempeño relativo de ${employeeName} en comparación con sus pares.

**Próximos Pasos:**
1. Revisa el feedback específico en la plataforma
2. Agenda 1:1 con ${employeeName} para comunicar resultados
3. Enfoca la conversación en oportunidades de desarrollo

¿Podemos agendar 15 minutos para alinear el mensaje antes de tu 1:1?

Saludos,
[Facilitador]`
  }

  // ═══ UPGRADE (celebración) ═══
  if (wasUpgraded) {
    return `Hola,

¡Excelentes noticias sobre ${employeeName}!

Durante la calibración ejecutiva, identificamos que su desempeño merece un reconocimiento mayor al inicialmente asignado.

**Ajuste Aplicado:**
- Score original: ${originalScore.toFixed(1)}
- Score calibrado: ${finalScore.toFixed(1)}

**Razón:**
${justification}

Este ajuste refuerza nuestro compromiso con la equidad y el reconocimiento del alto desempeño.

**Recomendación:**
Comunica este resultado destacando el valor que aporta ${employeeName} al equipo y explora oportunidades de desarrollo acelerado.

Saludos,
[Facilitador]`
  }

  // ═══ SIN CAMBIO ═══
  return `La evaluación de ${employeeName} fue validada durante la calibración y se mantiene sin cambios (${finalScore.toFixed(1)}).

No requiere conversación adicional sobre ajustes.`
}
