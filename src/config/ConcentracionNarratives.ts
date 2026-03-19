// ════════════════════════════════════════════════════════════════════════════
// CONCENTRACIÓN NARRATIVES — Panel de Concentración de Talento
// src/config/ConcentracionNarratives.ts
//
// Versión: 1.0 — Panel de Expertos OD + UX
//
// CONTEXTO:
// Panel de alto nivel que muestra la distribución del equipo en 3 zonas
// con dos perspectivas simultáneas: CEO (P&L) y Gerente de Personas (DO).
//
// ZONAS:
// ALTO RETORNO    → Estrellas + High Performers + Potential Gems
// RETORNO MEDIO   → Core Players + Trusted Professionals
// GASTO EN RIESGO → Inconsistentes + Underperformers
//
// LÓGICA DE NARRATIVAS:
// Cada zona tiene narrativa condicional según magnitud del porcentaje.
// La narrativa global combina la urgencia de las tres zonas.
//
// PRINCIPIOS:
// — Version A (CEO): idioma de negocio, retorno, inversión, riesgo
// — Version B (DO): acción organizacional, responsabilidad del líder
// — Sin "requiere atención" ni "hay que" — activo, nunca pasivo
// — Beneficio implícito en cada frase
// — Máximo 15 palabras por narrativa de zona
// ════════════════════════════════════════════════════════════════════════════

export interface ZonaNarrative {
  // VERSION A — CEO / Financiero (P&L)
  ceo: string
  // VERSION B — Gerente de Personas / DO
  do: string
}

export interface ConcentracionNarratives {
  altoRetorno: ZonaNarrative
  retornoMedio: ZonaNarrative
  gastoEnRiesgo: ZonaNarrative
  // Narrativa global debajo de las 3 zonas
  global: string
}

// ════════════════════════════════════════════════════════════════════════════
// ZONA 1 — ALTO RETORNO
// Condición sobre el % del equipo en esta zona
// ════════════════════════════════════════════════════════════════════════════

function getAltoRetornoNarrative(pct: number): ZonaNarrative {

  // ≥ 40% → tono celebratorio + advertencia de concentración
  if (pct >= 40) {
    return {
      ceo:
        'Capital humano de alto retorno — concentración que exige plan de sucesión.',
      do:
        'Talento que supera el estándar — dales hacia dónde crecer antes de que lo busquen afuera.',
    }
  }

  // 20-39% → tono neutro positivo
  if (pct >= 20) {
    return {
      ceo:
        'El retorno sobre la exigencia del cargo está activo — protégelo.',
      do:
        'Conocen su trabajo y pueden más — la visibilidad de carrera es la siguiente palanca.',
    }
  }

  // < 20% → tono de alerta — pipeline débil
  return {
    ceo:
      'Pipeline de alto retorno débil — riesgo de capacidad ante cualquier salida.',
    do:
      'Pocos superan el estándar hoy — desarrollar el siguiente nivel es urgente.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ZONA 2 — RETORNO MEDIO
// Condición sobre el % del equipo en esta zona
// ════════════════════════════════════════════════════════════════════════════

function getRetornoMedioNarrative(pct: number): ZonaNarrative {

  // > 50% → es la masa crítica, no ignorar
  if (pct > 50) {
    return {
      ceo:
        'La mayoría del gasto en personas cumple — el potencial sin activar es significativo.',
      do:
        'Aquí vive la organización real — el estancamiento se instala en silencio si el líder no actúa.',
    }
  }

  // 30-50% → zona de oportunidad normal
  if (pct >= 30) {
    return {
      ceo:
        'Retorno estable y ampliable — la palanca está en el desarrollo, no en el reemplazo.',
      do:
        'Sólidos y con más dentro — el siguiente nivel lo desbloquea el líder, no el tiempo.',
    }
  }

  // < 30% → organización polarizada
  return {
    ceo:
      'Organización polarizada — poco colchón entre el alto retorno y el riesgo.',
    do:
      'El potencial sin conversación se convierte en conformidad — esa conversación es tuya.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ZONA 3 — GASTO EN RIESGO
// Condición sobre el % del equipo en esta zona
// ════════════════════════════════════════════════════════════════════════════

function getGastoEnRiesgoNarrative(pct: number): ZonaNarrative {

  // > 40% → urgencia máxima — narrativa financiera fuerte
  if (pct > 40) {
    return {
      ceo:
        `${pct}% del gasto en personas no entrega el retorno esperado — cada ciclo tiene costo.`,
      do:
        'Esta zona pide una decisión, no otro ciclo de espera. El equipo lo siente aunque nadie lo diga.',
    }
  }

  // 25-40% → urgencia media — narrativa de acción
  if (pct >= 25) {
    return {
      ceo:
        'Inversión sin retorno equivalente — la ventana de acción es ahora.',
      do:
        'Algo no está funcionando y los líderes tienen el contexto para saberlo — una conversación honesta cambia más que otro proceso.',
    }
  }

  // < 25% → gestión normal — narrativa de monitoreo
  return {
    ceo:
      'Riesgo financiero acotado — monitoreo activo para evitar que crezca.',
    do:
      'Zona manejable hoy — el riesgo es normalizarla sin intervención.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA GLOBAL
// Combinación de urgencias según distribución total
// ════════════════════════════════════════════════════════════════════════════

function getGlobalNarrative(
  altoPct: number,
  medioPct: number,
  bajoPct: number
): string {

  // Crisis organizacional
  if (bajoPct > 40 && altoPct < 20) {
    return (
      `${bajoPct}% del gasto en personas no entrega el retorno esperado ` +
      `y el pipeline de alto rendimiento es insuficiente para sostener la operación. ` +
      `Los líderes son el único punto de palanca — y la ventana es ahora.`
    )
  }

  // Urgencia financiera fuerte
  if (bajoPct > 30) {
    return (
      `${bajoPct}% del gasto en personas no está entregando el retorno esperado. ` +
      `Los líderes son el único punto de palanca para revertir esta cifra.`
    )
  }

  // Celebrar + advertir concentración
  if (altoPct >= 40) {
    return (
      `${altoPct}% del equipo rinde sobre la exigencia del cargo — ` +
      `una concentración que exige plan de sucesión y visibilidad de carrera activa. ` +
      `El talento de alto retorno no espera indefinidamente.`
    )
  }

  // Todo equilibrado → narrativa de desarrollo
  return (
    `El ${altoPct}% de alto retorno financia el riesgo del ${bajoPct}% que no llega al estándar. ` +
    `Esa ecuación la resuelven las conversaciones que aún no ocurrieron.`
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Retorna todas las narrativas del panel de concentración.
 *
 * @param altoPct  — % del equipo en zona Alto Retorno
 * @param medioPct — % del equipo en zona Retorno Medio
 * @param bajoPct  — % del equipo en zona Gasto en Riesgo
 *
 * Uso:
 *   const narratives = getConcentracionNarratives(39, 26, 35)
 *   // narratives.altoRetorno.ceo  → Version A CEO
 *   // narratives.altoRetorno.do   → Version B DO
 *   // narratives.global           → Narrativa global
 */
export function getConcentracionNarratives(
  altoPct: number,
  medioPct: number,
  bajoPct: number
): ConcentracionNarratives {
  return {
    altoRetorno: getAltoRetornoNarrative(altoPct),
    retornoMedio: getRetornoMedioNarrative(medioPct),
    gastoEnRiesgo: getGastoEnRiesgoNarrative(bajoPct),
    global: getGlobalNarrative(altoPct, medioPct, bajoPct),
  }
}
