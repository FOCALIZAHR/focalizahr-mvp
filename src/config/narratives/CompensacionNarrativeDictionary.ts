// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE NARRATIVAS — PERSPECTIVA DE COMPENSACIONES
// src/config/narratives/CompensacionNarrativeDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Por cuadrante RoleFit × Metas: qué tensión crea en compensaciones
// y qué preguntas debe hacerse el CEO antes de decidir.
// Consumidores: GoalsStarsModal (PersonCard inline expandible)
// ════════════════════════════════════════════════════════════════════════════

export interface CompensacionNarrativeEntry {
  observacion: string
  decisionValor: string
}

export const COMPENSACION_NARRATIVE_DICTIONARY: Record<string, CompensacionNarrativeEntry> = {

  HIDDEN_PERFORMER: {
    observacion:
      'El bono variable premia los resultados que impulsan el negocio. ' +
      'Sin embargo, el desempeño se usa para ajustes por mérito — y estos casos no se priorizan, no califican o no se consideran para incremento por mérito, ' +
      'lo que puede desmotivar a quien efectivamente trae los resultados. ' +
      'Ambas acciones pueden ser correctas según las reglas y políticas, y aun así generar el efecto equivocado por no abordar la discrepancia.',
    decisionValor:
      'El problema no es la política de compensaciones, sino entender si la discrepancia tiene explicación. ' +
      'Entenderla y gestionarla es lo que realmente agrega valor: ¿colaborador nuevo en el cargo? ¿Hubo un fallo en el cómo se lograron los números? ' +
      '¿El líder tiene un sesgo al evaluarlo? ¿El perfil del cargo le está exigiendo competencias irrelevantes? ¿La persona no puede o no quiere adaptarse al modelo?',
  },

  PERCEPTION_BIAS: {
    observacion:
      'La evaluación de desempeño alta se usa para priorizar decisiones como movimientos, formación e incremento salarial por mérito. ' +
      'Sin embargo, al no cumplir las metas del negocio hay una discrepancia que impactará negativamente en el bono variable. ' +
      'Aprobar un aumento a quien no trae resultados operativos puede normalizar el bajo rendimiento — o generar una percepción de favoritismo que los talentos reales no olvidan. ' +
      'Ambas acciones pueden ser correctas según las reglas y políticas, y aun así generar el efecto equivocado por no abordar la discrepancia.',
    decisionValor:
      'El problema no es la política de compensaciones, sino entender si la discrepancia tiene explicación. ' +
      'Entenderla y gestionarla es lo que realmente agrega valor: ¿Se informaron las metas? ¿Las metas eran inalcanzables o mal definidas? ' +
      '¿Existen cuellos de botella que frenan a esta persona? ¿El estilo de liderazgo prioriza la relación sobre la exigencia de resultados? ' +
      '¿O es un problema de compromiso del colaborador?',
  },

  DOUBLE_RISK: {
    observacion:
      'Las dos fuentes confirman el mismo diagnóstico: metas incumplidas y evaluación que no respalda el nivel del cargo. ' +
      'Las políticas actúan según la regla, no hay respaldo para bono ni incremento. ' +
      'El riesgo aquí es que la dirección piense que no pagar es el castigo suficiente. ' +
      'Mantener en el cargo a alguien que no está rindiendo envía una señal de inequidad o favoritismo que los talentos reales no olvidan — ya que lo están subsidiando a diario. ' +
      'No es un ahorro presupuestario, es seguir gastando en una posición que no está generando valor.',
    decisionValor:
      'La pregunta no es qué pagar — la regla ya lo resolvió. Es por qué no se ha tomado una decisión. ' +
      'Entender qué sostiene la inacción y quién la explica: ¿Es nuevo en el cargo? ¿Antes entregaba resultados y ahora no — qué pasó? ' +
      '¿La gerencia posterga la desvinculación por evitar el costo del finiquito? Si es así, ese pasivo laboral seguirá creciendo mes a mes junto con el daño cultural. ' +
      '¿Hubo inacción del liderazgo que normalizó este bajo rendimiento? ' +
      'Cada ciclo sin decisión definitiva no es un ahorro en bonos — es una destrucción silenciosa del valor del negocio y del clima que sostiene a los que sí rinden.',
  },

  CONSISTENT: {
    observacion:
      'Las dos fuentes se alinean en la excelencia: metas superadas y evaluación que respalda el dominio total del cargo. ' +
      'Las políticas actúan sin sorpresas — califica para el bono máximo y el mejor incremento por mérito. ' +
      'Sin embargo, el riesgo aquí es la inercia corporativa: creer que el paquete estándar es suficiente para retener al talento. ' +
      'Las políticas salariales tradicionales están diseñadas para retener al promedio, no para blindar al talento de alto impacto. ' +
      'El mercado ya lo sabe — si el reconocimiento se limita a lo que dicta la regla, solo le estamos financiando la transición a la competencia.',
    decisionValor:
      'El problema no es aprobar el pago — eso es apenas el piso higiénico. ' +
      'El desafío es entender si nuestro ecosistema protege lo que realmente lo mantiene conectado: ' +
      '¿lo conocemos? ¿Está en plan de sucesión? ¿Tiene visibilidad como talento de la organización — no solo del área? ' +
      '¿Qué le interesa? ¿Está comprometido? ¿Tiene al líder que lo hace crecer? ¿Nuestra banda salarial realmente compite con el mercado? ' +
      '¿Lo estamos premiando sobrecargándolo con el trabajo de los que no rinden — el castigo por ser competente? ' +
      'El talento top no renuncia solo por ofertas económicas — huye de la burocracia y de cargar con el peso del bajo rendimiento ajeno. ' +
      '¿Sabe que es un activo estratégico? ' +
      'Tratar a la excelencia con las herramientas del promedio es la vía más rápida para apagar el motor del negocio.',
  },
}

export function getCompensacionNarrative(quadrant: string): CompensacionNarrativeEntry | null {
  return COMPENSACION_NARRATIVE_DICTIONARY[quadrant] ?? null
}
