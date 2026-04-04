// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO DE NARRATIVAS — ACTOS DE COMPENSACIÓN (Patrón G)
// src/config/narratives/CompensationActsDictionary.ts
// ════════════════════════════════════════════════════════════════════════════
// Centraliza TODAS las narrativas del CompensationBoard v2.0.
// Auditado contra 6 Reglas de Oro (skill focalizahr-narrativas).
// "Sistema" NUNCA se refiere a la plataforma — siempre al líder/evaluación.
// Template vars: {countTop}, {countDiscrepancy}, {count}, {countRisk}, {countInvisible}
// ════════════════════════════════════════════════════════════════════════════

export interface ActNarrative {
  title: string
  body: string
  isFocaliza?: boolean
  findingCard?: { title: string; body: string }
  cta: string
}

export interface PerspectiveNarratives {
  acts: ActNarrative[]
  secondVar: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// HUB
// ════════════════════════════════════════════════════════════════════════════

export const HUB_NARRATIVE = {
  body: 'personas reciben compensación donde <b>la evaluación de su líder y sus resultados de negocio no coinciden</b>. Tres fuentes independientes confirman las mismas discrepancias.',
}

// ════════════════════════════════════════════════════════════════════════════
// MÉRITO (evaluación 360° alta → incremento salarial)
// ════════════════════════════════════════════════════════════════════════════

export function getMeritoNarratives(
  countTop: number,
  countDiscrepancy: number,
  countIndulgent: number,
  hasSecondVar: boolean,
): PerspectiveNarratives {
  const acts: ActNarrative[] = [
    {
      title: 'Lo que no cuadra',
      body:
        `Estas <b>${countTop} personas</b> reciben la evaluación más alta de su líder directo. ` +
        `Son las primeras en la lista para incremento por mérito. ` +
        `Pero al cruzar con metas, en <b>${countDiscrepancy}</b> los resultados del negocio no respaldan esa evaluación. ` +
        'Aprobar sin revisar es normalizar la desconexión.',
      cta: 'Descubrir más',
    },
  ]

  if (hasSecondVar) {
    acts.push({
      title: 'El hallazgo Focaliza',
      isFocaliza: true,
      body:
        'La discrepancia tiene una explicación más profunda. ' +
        'Al cruzar la evaluación del líder con los resultados reales, los datos muestran que en varios casos ' +
        '<b>el jefe que evalúa califica consistentemente alto sin distinción</b>.',
      findingCard: {
        title: 'Cómo evalúa el líder directo',
        body:
          `En <b>${countIndulgent}</b> de estos casos, el jefe califica a todo su equipo en el rango más alto. ` +
          'La evaluación no refleja diferencias reales de desempeño — refleja el criterio de quien evalúa.',
      },
      cta: 'Entender la decisión',
    })
  }

  acts.push({
    title: 'La decisión de valor',
    body:
      'El problema no es la política. Es entender si la discrepancia tiene explicación. ' +
      '<b>¿Se comunicaron las metas? ¿Eran alcanzables?</b> ' +
      '¿El líder prioriza la relación sobre la exigencia? ' +
      'Cada incremento aprobado sin esta respuesta envía una señal: la evaluación y el negocio operan desconectados.',
    cta: 'Ver las personas',
  })

  const secondVar = hasSecondVar
    ? `En <b>${countIndulgent}</b> de estos casos, el jefe califica consistentemente alto a todo su equipo — la evaluación puede no reflejar diferencias reales.`
    : null

  return { acts, secondVar }
}

// ════════════════════════════════════════════════════════════════════════════
// BONOS (metas cumplidas → bono variable)
// ════════════════════════════════════════════════════════════════════════════

export function getBonosNarratives(
  countTop: number,
  countDiscrepancy: number,
  hasTalentVar: boolean,
  countRisk: number,
  countInvisible: number,
): PerspectiveNarratives {
  const acts: ActNarrative[] = [
    {
      title: 'Lo que no cuadra',
      body:
        `Estas <b>${countTop} personas</b> cumplen metas y califican para bono. ` +
        `Pero al cruzar con la evaluación de su líder, <b>${countDiscrepancy} muestran una discrepancia</b>: ` +
        'entregan resultados que la evaluación no reconoce. ' +
        'El bono premia lo de hoy — pero ¿la organización ve lo que aportan?',
      cta: 'Descubrir más',
    },
  ]

  if (hasTalentVar) {
    acts.push({
      title: 'El hallazgo Focaliza',
      isFocaliza: true,
      body:
        'La discrepancia tiene una explicación más profunda. ' +
        'Al cruzar evaluación con inteligencia de talento, los datos revelan perfiles que ' +
        '<b>el líder directo no percibe o no valora en su evaluación</b>.',
      findingCard: {
        title: 'Lo que la evaluación no ve',
        body:
          'Talento que trae resultados pero que su líder no reconoce en la evaluación. ' +
          'En unos casos, el compromiso con la organización es crítico — entregan pero están desconectados. ' +
          'En otros, sostienen los números del equipo siendo invisibles para quien los evalúa.',
      },
      cta: 'Entender la decisión',
    })
  }

  acts.push({
    title: 'La decisión de valor',
    body:
      'El bono premia resultados — pero si el líder no reconoce a quien trae los números, ' +
      '<b>el motor del negocio recibe el mensaje equivocado</b>. ' +
      'La desmotivación del talento real es silenciosa. Cuando se nota, ya es tarde.',
    cta: 'Ver las personas',
  })

  const secondVar = (countRisk > 0 || countInvisible > 0)
    ? `<b>${countRisk}</b> con riesgo de desconexión o fuga, <b>${countInvisible}</b> invisibles para quien los evalúa.`
    : null

  return { acts, secondVar }
}

// ════════════════════════════════════════════════════════════════════════════
// SEÑALES (combinatoria bono × mérito)
// ════════════════════════════════════════════════════════════════════════════

export function getSenalesNarratives(
  countContradictory: number,
): PerspectiveNarratives {
  return {
    acts: [
      {
        title: 'Lo que no cuadra',
        body:
          `La combinación de bono y mérito que recibe cada persona <b>envía un mensaje implícito</b>. ` +
          `Estas <b>${countContradictory} personas</b> reciben señales contradictorias. ` +
          'El talento real lee esas señales mejor que cualquier comunicado.',
        cta: 'Descubrir más',
      },
      {
        title: 'La decisión de valor',
        body:
          'El desafío no es qué pagar. Es entender <b>qué le estás diciendo a cada persona</b> con tus decisiones. ' +
          'Alto bono + bajo mérito = "te premio hoy pero no invierto en tu futuro."',
        cta: 'Ver las personas',
      },
    ],
    secondVar: null,
  }
}
