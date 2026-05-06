// Copy de la "Tarjeta de Liderazgo" en <ConvergenciaConfirmada />.
//
// Privacidad crítica:
//   - El sistema agrupa departamentos. NO nombra al manager (managerId
//     nunca se renderiza al usuario, solo se usa como React key).
//   - El AREA_MANAGER que ES el manager problemático nunca recibe la
//     agrupación: backend filtra criticalByManager: [] vía RBAC en route.ts.
//   - El CEO infiere el patrón sin que el sistema acuse a nadie por nombre.
//
// La narrativa dinámica con conteo de deptos vive en el motor
// (criticalByManagerNarrativa, generada por buildCriticalByManagerNarrative).
// Este archivo solo expone los textos estáticos del componente:
// titulares editoriales, veredicto, privacy note.

export const CRITICAL_BY_MANAGER_COPY = {
  /** Titular editorial — primera palabra/frase en blanco. */
  titularHero: 'El riesgo no es geográfico.',
  /** Titular editorial — segunda frase en cyan vía word-split. */
  titularHeroSegunda: 'Es jerárquico.',
  /** Veredicto en cursiva con border-left. Aparece debajo del titular hero. */
  veredicto:
    'Cuando varios departamentos del mismo nivel concentran señales convergentes, no es un patrón departamental — es un patrón de liderazgo.',
  /** Descripción extendida del patrón. Auditada contra las 6 Reglas de Oro
   *  del skill focalizahr-narrativas. */
  descripcion:
    'El sistema detectó que la convergencia de señales críticas no respeta los límites de un departamento — sigue la huella de una forma de gestionar. O el liderazgo instala el patrón. O el contexto lo permite. O la organización no lo detecta a tiempo. La inferencia es trabajo del lector.',
  /** Footer pequeño — refuerzo del compromiso de privacidad. */
  privacyNote:
    'El sistema agrupa departamentos. No nombra responsables.',
} as const;
