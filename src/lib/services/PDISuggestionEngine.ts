import {
  CompetencyTemplate,
  GeneratedSuggestion,
  GapAnalysisInput,
  PerformanceTrack,
  SuggestionGoal
} from '@/lib/types/pdi-suggestion'
import {
  PDI_COMPETENCY_LIBRARY,
  GENERIC_COMPETENCY_TEMPLATE
} from '@/lib/data/pdi-competency-library'
import { DevelopmentGapType, DevelopmentPriority } from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// PDI SUGGESTION ENGINE
// Genera sugerencias inteligentes basadas en Gap Analysis
// Adaptadas por performanceTrack manteniendo tono simple para todos
// ════════════════════════════════════════════════════════════════════════════

export class PDISuggestionEngine {

  /**
   * Genera sugerencias de desarrollo para un empleado
   */
  static generateSuggestions(
    gaps: GapAnalysisInput[],
    performanceTrack: PerformanceTrack
  ): GeneratedSuggestion[] {
    const suggestions: GeneratedSuggestion[] = []

    for (const gap of gaps) {
      const template = this.findCompetencyTemplate(gap.competencyCode, gap.competencyName)
      const strategies = template.strategies[performanceTrack]
      const suggestionGoals = this.selectStrategy(gap.gapType, strategies)
      const coachingTip = this.selectCoachingTip(gap.gapType, template.coachingTips)

      for (const goal of suggestionGoals) {
        suggestions.push({
          competencyCode: gap.competencyCode,
          competencyName: gap.competencyName,
          gapType: gap.gapType,
          originalGap: gap.gapValue,
          suggestion: goal,
          coachingTip,
          priority: this.calculatePriority(gap)
        })
      }
    }

    return this.sortByPriority(suggestions)
  }

  /**
   * Smart matching: busca template por código o keywords
   */
  private static findCompetencyTemplate(code: string, name: string): CompetencyTemplate {
    // 1. Buscar por código exacto
    const normalizedCode = code.toUpperCase().replace(/[-_\s]/g, '-')

    for (const [key, template] of Object.entries(PDI_COMPETENCY_LIBRARY)) {
      if (key === code || key === normalizedCode || template.code === code || template.code === normalizedCode) {
        return template
      }
    }

    // 2. Buscar por keywords
    const searchTerms = [
      code.toLowerCase(),
      name.toLowerCase(),
      ...name.toLowerCase().split(' ')
    ]

    for (const template of Object.values(PDI_COMPETENCY_LIBRARY)) {
      for (const keyword of template.keywords) {
        if (searchTerms.some(term => term.includes(keyword) || keyword.includes(term))) {
          return template
        }
      }
    }

    // 3. Fallback a template genérico
    console.warn(`[PDISuggestionEngine] No template found for: ${code} / ${name}. Using generic.`)
    return GENERIC_COMPETENCY_TEMPLATE
  }

  /**
   * Selecciona la estrategia correcta según tipo de gap
   */
  private static selectStrategy(
    gapType: DevelopmentGapType,
    strategies: { blindSpot: SuggestionGoal[]; development: SuggestionGoal[]; strength: SuggestionGoal[] }
  ): SuggestionGoal[] {
    switch (gapType) {
      case 'BLIND_SPOT':
        return strategies.blindSpot.length > 0
          ? strategies.blindSpot
          : strategies.development

      case 'HIDDEN_STRENGTH':
        return strategies.strength.length > 0
          ? strategies.strength
          : strategies.development

      case 'DEVELOPMENT_AREA':
      case 'PEER_DISCONNECT':
      default:
        return strategies.development
    }
  }

  /**
   * Selecciona coaching tip según tipo de gap
   */
  private static selectCoachingTip(
    gapType: DevelopmentGapType,
    tips: { blindSpot: string[]; development: string[]; strength: string[] }
  ): string {
    let tipArray: string[]

    switch (gapType) {
      case 'BLIND_SPOT':
        tipArray = tips.blindSpot
        break
      case 'HIDDEN_STRENGTH':
        tipArray = tips.strength
        break
      default:
        tipArray = tips.development
    }

    if (tipArray.length === 0) {
      tipArray = tips.development
    }

    return tipArray[Math.floor(Math.random() * tipArray.length)] || ''
  }

  /**
   * Calcula prioridad basada en severidad del gap
   */
  private static calculatePriority(gap: GapAnalysisInput): DevelopmentPriority {
    const absGap = Math.abs(gap.gapValue)

    // Blind spots críticos tienen prioridad alta
    if (gap.gapType === 'BLIND_SPOT' && absGap >= 1.0) {
      return 'ALTA'
    }

    // Gaps grandes = prioridad alta
    if (absGap >= 1.5) return 'ALTA'
    if (absGap >= 1.0) return 'MEDIA'
    return 'BAJA'
  }

  /**
   * Ordena sugerencias por prioridad
   */
  private static sortByPriority(suggestions: GeneratedSuggestion[]): GeneratedSuggestion[] {
    const priorityOrder: Record<DevelopmentPriority, number> = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 }
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  /**
   * Genera resumen ejecutivo del PDI sugerido
   */
  static generateExecutiveSummary(suggestions: GeneratedSuggestion[]): string {
    const highPriority = suggestions.filter(s => s.priority === 'ALTA')
    const blindSpots = suggestions.filter(s => s.gapType === 'BLIND_SPOT')

    const parts: string[] = []

    if (blindSpots.length > 0) {
      parts.push(`Se detectaron ${blindSpots.length} punto(s) ciego(s) que requieren atención prioritaria.`)
    }

    if (highPriority.length > 0) {
      const competencies = [...new Set(highPriority.map(s => s.competencyName))].slice(0, 3)
      parts.push(`Áreas de enfoque principal: ${competencies.join(', ')}.`)
    }

    parts.push(`Total de objetivos sugeridos: ${suggestions.length}.`)

    return parts.join(' ')
  }
}
