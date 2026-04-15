// ════════════════════════════════════════════════════════════════════════════
// PersonExposureNarrativeService — Triaje narrativo per-persona
// src/lib/services/PersonExposureNarrativeService.ts
// ════════════════════════════════════════════════════════════════════════════
import { TALENT_INTELLIGENCE_THRESHOLDS } from '@/config/performanceClassification'
//
// Razón de existir:
// El módulo Workforce Planning prometía narrativa per-persona del cruce
// exposición IA × dominio del cargo × compromiso. Hasta hoy, los detectores
// (zombies, flightRisk, productivityGap) calculaban a nivel cohorte sin
// exponer narrativa individual. Este servicio cierra ese gap.
//
// FILOSOFÍA — matriz consolidada de 6 casos (no 27):
// El CEO no toma 27 decisiones distintas. Solo actúa sobre los EXTREMOS:
//   - Talento crítico que mover (cyan)
//   - Sangre estructural (amber)
//   - Núcleo intocable a proteger (cyan)
//   - Fuga inminente (amber)
// Todo lo demás es "operación estable, sin urgencia" (slate).
//
// REGLAS ESTRICTAS (skill focalizahr-narrativas):
//   - headline: contradicción o riesgo. Sin descripción genérica.
//   - context: 2-3 líneas, lenguaje gerentes hablando entre sí.
//             SIN jerga RRHH (no "RoleFit", no "score", no "tier").
//   - exposureLens: qué implica la exposición específicamente para ESTA persona.
//   - urgencyLevel: frase de consecuencia al negocio. NUNCA "Alto/Medio/Bajo".
//
// Consumidores previstos:
//   - NineBox PersonView (HOY)
//   - Triage Tank (siguiente instrumento)
//   - Cualquier vista per-persona del Workforce Deck
// ════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// 1. PATRONES — taxonomía interna (6 casos cerrados)
// ═════════════════════════════════════════════════════════════════════════════

export type PersonExposurePattern =
  | 'TALENTO_CRITICO_MOVER'   // Caso 1: Alta exp + Alto fit + Eng no bajo
  | 'NO_REEMPLAZO'            // Caso 2: Alta exp + Bajo fit + Bajo eng
  | 'BRECHA_CORE_HUMANO'      // Caso 3: Baja exp + Bajo fit
  | 'NUCLEO_INTOCABLE'        // Caso 4: Baja exp + Alto fit AND Alto eng
  | 'FUGA_INMINENTE'          // Caso 5: Alta exp + Alto fit + Bajo eng
  | 'OPERACION_ESTABLE'       // Caso 6: Fallback — todos los demás

// ═════════════════════════════════════════════════════════════════════════════
// 2. CONTRATO DE SALIDA
// ═════════════════════════════════════════════════════════════════════════════

export interface PersonExposureNarrative {
  /** Patrón interno — útil para telemetría/agregación. NO mostrar al CEO. */
  pattern: PersonExposurePattern
  /** Contradicción o riesgo principal (1-2 líneas, < 100 chars) */
  headline: string
  /** Lectura ejecutiva 2-3 líneas. Lenguaje gerentes. */
  context: string
  /** Qué implica la exposición IA específicamente para esta persona */
  exposureLens: string
  /** Consecuencia al negocio en forma de frase narrativa.
   *  NUNCA "Alto/Medio/Bajo". Ej: "Riesgo de fuga por subutilización tecnológica" */
  urgencyLevel: string
  /** Color semántico del bloque visual */
  accent: 'amber' | 'cyan' | 'slate'
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. UMBRALES — alineados con criterios canónicos del proyecto
// ═════════════════════════════════════════════════════════════════════════════
//
// Talento (roleFit + engagement): se reusa TALENT_INTELLIGENCE_THRESHOLDS de
// performanceClassification.ts — fuente única de verdad del Test Ácido AAE:
//   - engagement / aspiration son DISCRETOS 1/2/3
//   - HIGH = nivel 3, LOW = nivel 1, NEUTRAL = nivel 2 (no clasifica —
//     evita tendencia central, principio del Test Ácido)
//   - roleFit HIGH = ≥ 75 (autonomía operativa, "70% Rule" alineada SOLID)
//
// Exposición (focalizaScore): umbrales locales de este servicio — no existen
// constantes canónicas en el proyecto. Validado contra distribución real demo.
//   - HIGH ≥ 0.5: alineado con discreto Eloundou (0/0.5/1)
//   - LOW  < 0.3: cargo en zona blindada
// ═════════════════════════════════════════════════════════════════════════════

const EXPOSURE_HIGH = 0.5      // Alta exposición (cargo automatizable)
const EXPOSURE_LOW = 0.3       // Baja exposición (cargo blindado)

// Re-export semántico de los thresholds canónicos
const ROLEFIT_HIGH = TALENT_INTELLIGENCE_THRESHOLDS.ROLE_FIT_HIGH  // 75
const ROLEFIT_LOW = 60                                               // < 60 = bajo dominio
const ENGAGEMENT_HIGH = TALENT_INTELLIGENCE_THRESHOLDS.ENGAGEMENT_HIGH // === 3
const ENGAGEMENT_LOW = TALENT_INTELLIGENCE_THRESHOLDS.ENGAGEMENT_LOW   // === 1

// ═════════════════════════════════════════════════════════════════════════════
// 4. INPUT
// ═════════════════════════════════════════════════════════════════════════════

interface PersonInput {
  focalizaScore: number | null
  roleFit: number              // 0-100
  engagement: number | null    // 1-5 (null = sin medición)
  /** Nombre formateado opcional — para personalizar narrativa */
  employeeName?: string
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. CLASIFICADOR — devuelve patrón puro (sin texto)
// ═════════════════════════════════════════════════════════════════════════════
// Tratamiento de nulls:
//   - focalizaScore null → no califica como Alta ni Baja → cae al fallback
//   - engagement null → no califica como ≥2.5 ni <2.5 → solo entra a casos
//     que NO requieren engagement (caso 3) o cae al fallback
// ═════════════════════════════════════════════════════════════════════════════

function classifyPattern(input: PersonInput): PersonExposurePattern {
  const { focalizaScore, roleFit, engagement } = input

  const isHighExp = focalizaScore !== null && focalizaScore >= EXPOSURE_HIGH
  const isLowExp = focalizaScore !== null && focalizaScore < EXPOSURE_LOW

  const isHighFit = roleFit >= ROLEFIT_HIGH
  const isLowFit = roleFit < ROLEFIT_LOW

  // Test Ácido AAE — engagement DISCRETO 1/2/3, nivel 2 NO clasifica.
  // Coherente con TalentIntelligenceService.classifyAAEFactor.
  const isHighEng = engagement === ENGAGEMENT_HIGH                    // === 3
  const isLowEng = engagement === ENGAGEMENT_LOW                      // === 1
  // "No bajo" para casos donde aceptamos NEUTRAL (2) o HIGH (3),
  // pero NO bajo (1). Excluye también null (sin medición).
  const isNotLowEng = engagement !== null && engagement !== ENGAGEMENT_LOW

  // ─── Orden de evaluación: casos críticos primero ───────────────────

  // Caso 5 — FUGA_INMINENTE: domina cargo automatizable + ya perdió compromiso
  // (evaluado ANTES de caso 1 para que no caiga en "mover estratégicamente")
  if (isHighExp && isHighFit && isLowEng) return 'FUGA_INMINENTE'

  // Caso 1 — TALENTO_CRITICO_MOVER: domina cargo automatizable, aún comprometido
  if (isHighExp && isHighFit && isNotLowEng) return 'TALENTO_CRITICO_MOVER'

  // Caso 2 — NO_REEMPLAZO: bajo dominio en cargo automatizable, sin compromiso
  if (isHighExp && isLowFit && isLowEng) return 'NO_REEMPLAZO'

  // Caso 3 — BRECHA_CORE_HUMANO: bajo dominio en cargo que la IA no cubre
  // (NO requiere engagement — el problema es que la IA no es solución)
  if (isLowExp && isLowFit) return 'BRECHA_CORE_HUMANO'

  // Caso 4 — NUCLEO_INTOCABLE: cargo blindado + dominio + compromiso (AND)
  if (isLowExp && isHighFit && isHighEng) return 'NUCLEO_INTOCABLE'

  // Caso 6 — OPERACION_ESTABLE: fallback para todo lo demás
  return 'OPERACION_ESTABLE'
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. GENERADOR DE NARRATIVA — patrón → contenido ejecutivo
// ═════════════════════════════════════════════════════════════════════════════

function buildNarrative(
  pattern: PersonExposurePattern,
  input: PersonInput,
): PersonExposureNarrative {
  const name = input.employeeName ?? 'Esta persona'

  switch (pattern) {

    case 'TALENTO_CRITICO_MOVER':
      return {
        pattern,
        headline:
          'Talento crítico en rol automatizable. Mover estratégicamente antes de perderlo.',
        context:
          `${name} domina su cargo y mantiene su compromiso. Pero ese cargo está en zona ` +
          'donde la IA puede ejecutar lo mismo que la organización paga hoy. La inversión ' +
          'en su expertise es real; el rol que la contiene tiene fecha de vencimiento.',
        exposureLens:
          'La exposición alta convierte a esta persona en candidato natural a ser reasignada ' +
          'a un rol donde su criterio sea palanca, no costo atrapado.',
        urgencyLevel:
          'Reasignación estratégica antes de que el rol pierda relevancia',
        accent: 'cyan',
      }

    case 'NO_REEMPLAZO':
      return {
        pattern,
        headline:
          'Bajo rendimiento estructural. Su salida financia la automatización del rol. No reponer.',
        context:
          `${name} no domina su cargo y su compromiso está bajo. El cargo, además, está en ` +
          'zona donde la IA puede asumir la operación. Cuando esta persona rote, la pregunta ' +
          'no es a quién contratar — es si reemplazar el rol o consolidar su carga en tecnología.',
        exposureLens:
          'La exposición alta hace que la rotación natural sea oportunidad de rediseño, no de reemplazo.',
        urgencyLevel:
          'Oportunidad estructural de no reponer headcount a la próxima salida',
        accent: 'amber',
      }

    case 'BRECHA_CORE_HUMANO':
      return {
        pattern,
        headline:
          'Bajo desempeño en el core humano del negocio. La IA no cubre. Reemplazo urgente.',
        context:
          `${name} no domina un cargo cuya naturaleza la IA no puede absorber. Es una brecha ` +
          'directa: la organización paga por una función crítica que no se está entregando, ' +
          'y la tecnología no es solución. El reemplazo es por otra persona con el dominio que falta.',
        exposureLens:
          'La exposición baja confirma que esto no es un tema de transformación digital — es de gestión humana.',
        urgencyLevel:
          'Reemplazo humano urgente — sin opción de cobertura tecnológica',
        accent: 'amber',
      }

    case 'NUCLEO_INTOCABLE':
      return {
        pattern,
        headline:
          'Núcleo del valor humano protegido. Talento insustituible.',
        context:
          `${name} domina un cargo que la IA no puede asumir y mantiene su compromiso alto. ` +
          'Es el tipo de talento que define la diferencia competitiva de la organización: ' +
          'el que más cuesta reemplazar y el que la tecnología no va a sustituir.',
        exposureLens:
          'La exposición baja convierte cada año de su antigüedad en activo acumulativo que no se devalúa.',
        urgencyLevel:
          'Activo estratégico de máxima prioridad de retención',
        accent: 'cyan',
      }

    case 'FUGA_INMINENTE':
      return {
        pattern,
        headline:
          'Domina cargo automatizable pero su compromiso ya cayó. Probablemente mirando afuera.',
        context:
          `${name} sabe hacer su trabajo, lo hace bien, y su compromiso ya está bajo. ` +
          'Cuando esa combinación ocurre en un cargo de alta exposición a IA, el escenario ' +
          'típico es que ya está evaluando opciones. La conversación que retiene se da antes ' +
          'de la oferta, no después.',
        exposureLens:
          'La exposición alta agrava la urgencia: si sale, el reemplazo ya no será humano — y el aprendizaje del nuevo modelo lleva su tiempo.',
        urgencyLevel:
          'Riesgo de fuga inminente con doble pérdida — talento y curva de transición',
        accent: 'amber',
      }

    case 'OPERACION_ESTABLE':
    default:
      return {
        pattern: 'OPERACION_ESTABLE',
        headline:
          'Operación estable. Sin urgencia de intervención.',
        context:
          `Los indicadores de ${name} no convergen en un patrón crítico. ` +
          'Ni el dominio ni el compromiso ni la exposición a IA muestran tensión que ' +
          'requiera acción inmediata. Zona de monitoreo, no de intervención.',
        exposureLens:
          'La exposición no es factor decisorio en este caso particular.',
        urgencyLevel:
          'Sin acción inmediata requerida',
        accent: 'slate',
      }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. API PÚBLICA
// ═════════════════════════════════════════════════════════════════════════════

export const PersonExposureNarrativeService = {
  /**
   * Devuelve la narrativa interpretativa del cruce exposición IA × dominio × compromiso
   * para una persona individual. Nunca retorna null — siempre hay narrativa.
   */
  build(input: PersonInput): PersonExposureNarrative {
    const pattern = classifyPattern(input)
    return buildNarrative(pattern, input)
  },

  /** Solo el patrón clasificado — útil para telemetría/agregaciones. */
  classify(input: PersonInput): PersonExposurePattern {
    return classifyPattern(input)
  },
}
