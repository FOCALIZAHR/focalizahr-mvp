// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE RIESGO DE LIDERAZGO
// src/config/narratives/LeadershipRiskDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Bloque TRANSVERSAL: se inyecta en cualquier gerencia cuando hay personas
// con bajo Role Fit que tienen equipo a cargo.
// Activación: roleFit < 75% AND tienePersonalACargo = true
// Fuente: DICCIONARIO_IMPACTOS_GERENCIA_v3.1.md
// ════════════════════════════════════════════════════════════════════════════

export interface LeadershipRisk {
  condition: string
  narrative: string
}

export interface LeadershipImpact {
  activationRule: string
  ceoMessage: string
  risks: LeadershipRisk[]
  taxNarrative: string
  taxItems: string[]
}

export const LEADERSHIP_RISK_DICTIONARY: LeadershipImpact = {
  activationRule: 'roleFit < 75% AND tienePersonalACargo = true',

  ceoMessage: 'Ese líder no te cuesta solo su sueldo. Te cuesta la renuncia de los 3 mejores que ya no lo soportan.',

  risks: [
    {
      condition: 'Si no da dirección clara',
      narrative: 'El equipo podría estar trabajando en cosas que no mueven la aguja. Sin claridad de prioridades, la energía se dispersa en lo urgente, no en lo importante.',
    },
    {
      condition: 'Si no desarrolla a su gente',
      narrative: 'Los colaboradores con potencial podrían estancarse — o irse a buscar crecimiento afuera. Cuando se necesite un sucesor, no habrá nadie listo.',
    },
    {
      condition: 'Si no delega',
      narrative: 'Todo pasaría por esa persona. Cada decisión, cada aprobación, cada revisión. El equipo quedaría esperando en vez de ejecutando. El líder se convierte en cuello de botella.',
    },
    {
      condition: 'Si no da retroalimentación',
      narrative: 'La gente no sabría si lo está haciendo bien o mal. Los errores se repetirían porque nadie los señala. Los aciertos no se refuerzan.',
    },
    {
      condition: 'Si no toma decisiones',
      narrative: 'Los temas quedarían en el aire. El equipo perdería tiempo esperando definiciones que no llegan. La parálisis se normaliza.',
    },
    {
      condition: 'Si no enfrenta el bajo desempeño',
      narrative: 'Los colaboradores de alto rendimiento verían que acá la mediocridad se tolera. Eso acelera su salida — los mejores no quieren cargar con el peso de los que no rinden.',
    },
  ],

  taxNarrative: 'Cuando un líder opera bajo el estándar, la empresa no solo paga su sueldo. También podría estar pagando:',

  taxItems: [
    'La rotación de su equipo (los buenos se van primero)',
    'La productividad perdida (el equipo rinde menos de lo que podría)',
    'Las oportunidades no capturadas (sin dirección clara, se pierden)',
    'El tiempo de los que compensan (otros líderes tapan los huecos)',
  ],
}
