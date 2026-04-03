// ════════════════════════════════════════════════════════════════════════════
// SCIENTIFIC BACKING DICTIONARY — Respaldo Científico Central
// src/config/narratives/ScientificBackingDictionary.ts
//
// Versión: 1.0
//
// PROPÓSITO:
// Diccionario central de citas científicas para narrativas FocalizaHR.
// Cada entrada tiene claim, stat, source y bridge (cómo FocalizaHR lo detecta).
//
// USO:
// import { SCIENTIFIC_BACKING } from '@/config/narratives/ScientificBackingDictionary'
// <ScientificBackingTooltip citations={SCIENTIFIC_BACKING.leadership_impact} />
//
// CRECIMIENTO:
// Agregar nuevas citas aquí cuando se trabajen narrativas nuevas.
// Un solo lugar para actualizar cuando salgan nuevos estudios.
//
// FUENTES TIER 1 DISPONIBLES EN EL PROYECTO:
// Gallup, McKinsey, DDI, SHRM, Deloitte, HBR, Bauer 4C,
// Korn Ferry, Maslach, CIPD, Centro UC, PwC Chile
// ════════════════════════════════════════════════════════════════════════════

export interface ScientificCitation {
  // La afirmación que respalda
  claim: string
  // El dato específico con número
  stat: string
  // Fuente: organización + estudio + año
  source: string
  // URL pública si existe
  url?: string
}

export interface ScientificBacking {
  // Citas que respaldan esta narrativa (1-3 máximo)
  citations: ScientificCitation[]
  // Cómo FocalizaHR detecta este fenómeno
  bridge: string
  // Variante visual del tooltip
  variant: 'risk' | 'pattern' | 'momentum' | 'projection' | 'action'
}

// ════════════════════════════════════════════════════════════════════════════
// DICCIONARIO CENTRAL
// ════════════════════════════════════════════════════════════════════════════

export const SCIENTIFIC_BACKING: Record<string, ScientificBacking> = {

  // ──────────────────────────────────────────────────────────────────────────
  // LIDERAZGO — Modal de liderazgo en P&L Talent
  // ──────────────────────────────────────────────────────────────────────────
  leadership_impact: {
    citations: [
      {
        claim:
          'El manager directo es la causa principal de renuncia ' +
          'en más de la mitad de los casos',
        stat:
          '57% de los empleados que renuncian citan ' +
          'a su manager como razón principal',
        source: 'DDI Global Leadership Forecast · 2023',
        url: 'https://www.ddiworld.com/global-leadership-forecast',
      },
      {
        claim:
          'El engagement del equipo depende directamente ' +
          'de la calidad del manager directo',
        stat:
          '70% de la varianza en el engagement del equipo ' +
          'se explica por el manager directo',
        source: 'Gallup State of the American Manager · 2023',
        url: 'https://www.gallup.com/workplace/state-of-the-manager',
      },
    ],
    bridge:
      'FocalizaHR detecta cuando un líder opera bajo el estándar ' +
      'de su cargo — ese es el indicador más temprano disponible ' +
      'antes de que el equipo lo sienta.',
    variant: 'risk',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FUGA_CEREBROS — Mapa de talento y TalentNarrativeService
  // ──────────────────────────────────────────────────────────────────────────
  fuga_cerebros: {
    citations: [
      {
        claim:
          'El engagement bajo en perfiles de alto dominio ' +
          'predice salida voluntaria',
        stat:
          'Engagement bajo correlaciona con salida voluntaria ' +
          'en horizonte de 6-12 meses (r=0.45-0.60)',
        source: 'Gallup Q12 Meta-analysis · 2023',
      },
      {
        claim:
          'Los high performers son los primeros en salir ' +
          'cuando el engagement cae',
        stat:
          'Empleados con bajo engagement tienen 4x más probabilidad ' +
          'de buscar trabajo activamente',
        source: 'McKinsey The Boss Factor · 2023',
      },
    ],
    bridge:
      'FocalizaHR detecta esta combinación cruzando RoleFit ' +
      '(dominio del cargo) con Engagement (compromiso). ' +
      'Cuando RoleFit es alto y Engagement es bajo, ' +
      'el sistema activa la alerta.',
    variant: 'risk',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BURNOUT_RISK — Mapa de talento
  // ──────────────────────────────────────────────────────────────────────────
  burnout_risk: {
    citations: [
      {
        claim:
          'El esfuerzo sostenido sin resultado predice ' +
          'agotamiento profesional',
        stat:
          'Alta demanda + bajo control = predictor principal ' +
          'de burnout (modelo JD-R validado en 200+ estudios)',
        source: 'Bakker & Demerouti · Job Demands-Resources Model · 2007-2023',
      },
    ],
    bridge:
      'FocalizaHR detecta esta combinación cuando Engagement ' +
      'es alto (esfuerzo) pero RoleFit está bajo el umbral ' +
      '(resultado no llega). La antigüedad del colaborador ' +
      'determina si es curva de aprendizaje normal o ' +
      'sobrecarga estructural.',
    variant: 'pattern',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // BRECHA PRODUCTIVA — P&L Talent
  // ──────────────────────────────────────────────────────────────────────────
  brecha_productiva: {
    citations: [
      {
        claim:
          'Los empleados desenganchados generan una pérdida ' +
          'de productividad cuantificable',
        stat:
          'Empleados bajo el estándar cuestan 34% de su salario ' +
          'anual en productividad no entregada',
        source: 'Gallup State of the Global Workplace · 2024',
        url: 'https://www.gallup.com/workplace/state-of-global-workplace',
      },
    ],
    bridge:
      'FocalizaHR calcula esta brecha usando el RoleFit real ' +
      'de cada persona contra el estándar de su cargo, ' +
      'multiplicado por el sueldo promedio real de esa ' +
      'familia de cargo en tu empresa.',
    variant: 'projection',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CARGOS CRÍTICOS SIN SUCESOR — Módulo Sucesión
  // ──────────────────────────────────────────────────────────────────────────
  succession_gap: {
    citations: [
      {
        claim:
          'La mayoría de las organizaciones no está preparada ' +
          'para cubrir posiciones críticas',
        stat:
          '86% de los líderes cree que su organización ' +
          'no desarrolla líderes efectivamente',
        source: 'DDI Global Leadership Forecast · 2023',
        url: 'https://www.ddiworld.com/global-leadership-forecast',
      },
    ],
    bridge:
      'FocalizaHR identifica cargos críticos y cruza con ' +
      'la readiness de los candidatos a sucesor. ' +
      'La Matriz Predictiva de Continuidad muestra ' +
      'qué posiciones quedan expuestas si se activa ' +
      'el plan de sucesión hoy.',
    variant: 'risk',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NUEVOS INGRESOS — Motor 1 P&L Talent
  // ──────────────────────────────────────────────────────────────────────────
  onboarding_risk: {
    citations: [
      {
        claim:
          'Un mal proceso de incorporación predice ' +
          'salida temprana con alta precisión',
        stat:
          'Un mal primer día predice 75% de probabilidad ' +
          'de salida en los primeros 6 meses',
        source: 'Bauer 4C Onboarding Model · Meta-análisis 1,000+ empresas',
      },
      {
        claim:
          'La falta de claridad de rol en la primera semana ' +
          'reduce la productividad significativamente',
        stat:
          'Confusión de rol en semana 1 reduce productividad ' +
          '45% durante los primeros 90 días',
        source: 'Bauer 4C · Gallup State of Global Workplace · 2024',
      },
    ],
    bridge:
      'FocalizaHR detecta cuando nuevos ingresos (menos de ' +
      '12 meses) ya muestran RoleFit bajo el estándar — ' +
      'señal de que el problema comienza en la incorporación, ' +
      'no en el desempeño.',
    variant: 'pattern',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ADN ORGANIZACIONAL — Competencias
  // ──────────────────────────────────────────────────────────────────────────
  competency_gap: {
    citations: [
      {
        claim:
          'Las competencias core son el predictor más sólido ' +
          'de performance organizacional sostenida',
        stat:
          'Las competencias CORE explican 45% de la varianza ' +
          'en performance organizacional',
        source: 'Korn Ferry Leadership Architect · 2023',
      },
    ],
    bridge:
      'FocalizaHR mide cada competencia de cada persona ' +
      'contra el estándar que su cargo específico exige. ' +
      'El gap organizacional es el promedio ponderado ' +
      'de todos los gaps individuales.',
    variant: 'momentum',
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RIESGO FINANCIERO METAS — Insight #7 Metas × Performance
  // ──────────────────────────────────────────────────────────────────────────
  goals_financial_risk: {
    citations: [
      {
        claim:
          'El costo de reemplazar un empleado calificado ' +
          'supera significativamente su salario mensual',
        stat:
          'El costo de reemplazo oscila entre 50-200% del salario anual ' +
          'según el nivel del cargo y la especialización',
        source: 'SHRM Human Capital Benchmarking Report · 2024',
        url: 'https://www.shrm.org/topics-tools/research',
      },
      {
        claim:
          'Las discrepancias entre evaluación y resultados ' +
          'afectan la equidad percibida y la retención',
        stat:
          '20-30% de contribuyentes valiosos son invisibles ' +
          'en sistemas de evaluación tradicionales',
        source: 'Confirm / McKinsey Organizational Health Index · 2024',
      },
    ],
    bridge:
      'El monto que FocalizaHR muestra es exclusivamente el costo de reemplazo ' +
      'de personas clasificadas en riesgo de fuga que además cumplen metas sobre 80%. ' +
      'Se calcula usando el salario real por familia de cargo de tu empresa ' +
      '(configurado en SalaryConfig) multiplicado por un factor de reemplazo ' +
      'según el nivel del cargo. No incluye estimaciones de bonos ni probabilidades — ' +
      'solo el costo directo de perder a quienes entregan resultados.',
    variant: 'pattern',
  },

}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene el respaldo científico para una narrativa específica.
 * Retorna null si no existe — el componente maneja el caso gracefully.
 *
 * @param key — clave del diccionario
 *
 * Uso:
 *   const backing = getScientificBacking('leadership_impact')
 *   if (backing) {
 *     <ScientificBackingTooltip backing={backing} />
 *   }
 */
export function getScientificBacking(key: string): ScientificBacking | null {
  return SCIENTIFIC_BACKING[key] ?? null
}
