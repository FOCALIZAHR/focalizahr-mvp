// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY FILTER SERVICE - Filtrado de Preguntas por Track
// src/lib/services/CompetencyFilterService.ts
// ════════════════════════════════════════════════════════════════════════════
// DIRECTRIZ 3: El performanceTrack del EVALUADO determina qué preguntas se muestran
// - COLABORADOR → Solo CORE
// - MANAGER → CORE + LEADERSHIP
// - EJECUTIVO → CORE + LEADERSHIP + STRATEGIC
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { CompetencyService, type CompetencySnapshot } from './CompetencyService'
import type { Question } from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// JERARQUÍA DE TRACKS
// ════════════════════════════════════════════════════════════════════════════

const TRACK_HIERARCHY: Record<string, number> = {
  'COLABORADOR': 1,
  'MANAGER': 2,
  'EJECUTIVO': 3
}

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface FilteredQuestion extends Question {
  competencyName: string
  competencyCategory: string | null
}

export interface QuestionCountsByTrack {
  colaborador: number
  manager: number
  ejecutivo: number
}

export interface AudienceRule {
  minTrack?: string
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class CompetencyFilterService {

  /**
   * Filtra preguntas según competencias activas y track del evaluado
   *
   * @param campaignTypeId - ID del CampaignType (performance-evaluation)
   * @param cycleCompetencySnapshot - Snapshot de competencias del ciclo
   * @param evaluateePerformanceTrack - Track del empleado evaluado
   * @returns Preguntas filtradas con nombre de competencia
   */
  static async getFilteredQuestions(
    campaignTypeId: string,
    cycleCompetencySnapshot: CompetencySnapshot[],
    evaluateePerformanceTrack: string
  ): Promise<FilteredQuestion[]> {

    // 1. Obtener códigos de competencias del snapshot
    const activeCodes = cycleCompetencySnapshot.map(c => c.code)

    // 2. Obtener nivel del evaluado
    const evaluateeLevel = TRACK_HIERARCHY[evaluateePerformanceTrack] || 1

    // 3. Obtener todas las preguntas del CampaignType que tengan competencyCode
    const allQuestions = await prisma.question.findMany({
      where: {
        campaignTypeId,
        isActive: true,
        competencyCode: { in: activeCodes }
      },
      orderBy: { questionOrder: 'asc' }
    })

    // 4. Filtrar por audienceRule
    const filteredQuestions = allQuestions.filter(question => {
      // Sin regla = todos (Core)
      if (!question.audienceRule) return true

      const rule = question.audienceRule as AudienceRule

      // Regla minTrack: evaluado debe tener nivel >= al mínimo
      if (rule.minTrack) {
        const minLevel = TRACK_HIERARCHY[rule.minTrack] || 1
        return evaluateeLevel >= minLevel
      }

      return true
    })

    // 5. Enriquecer con nombre de competencia del snapshot
    return filteredQuestions.map(q => {
      const competency = CompetencyService.getFromSnapshot(
        cycleCompetencySnapshot,
        q.competencyCode!
      )

      return {
        ...q,
        competencyName: competency?.name || q.competencyCode || 'Sin competencia',
        competencyCategory: competency?.category || null
      }
    })
  }

  /**
   * Obtiene preguntas de feedback abierto (sin competencyCode)
   * Estas preguntas se muestran a todos los tracks
   */
  static async getFeedbackQuestions(
    campaignTypeId: string
  ): Promise<Question[]> {
    return prisma.question.findMany({
      where: {
        campaignTypeId,
        isActive: true,
        competencyCode: null,
        responseType: 'text_open'
      },
      orderBy: { questionOrder: 'asc' }
    })
  }

  /**
   * Obtiene todas las preguntas para un evaluado (competencias + feedback)
   */
  static async getAllQuestionsForEvaluatee(
    campaignTypeId: string,
    cycleCompetencySnapshot: CompetencySnapshot[],
    evaluateePerformanceTrack: string
  ): Promise<Array<FilteredQuestion | Question>> {
    const [competencyQuestions, feedbackQuestions] = await Promise.all([
      this.getFilteredQuestions(campaignTypeId, cycleCompetencySnapshot, evaluateePerformanceTrack),
      this.getFeedbackQuestions(campaignTypeId)
    ])

    // Combinar y ordenar por questionOrder
    return [...competencyQuestions, ...feedbackQuestions].sort(
      (a, b) => a.questionOrder - b.questionOrder
    )
  }

  /**
   * Cuenta preguntas por track (para mostrar en UI)
   * Útil para mostrar: "Colaboradores: 8 preguntas, Managers: 14 preguntas"
   */
  static countQuestionsByTrack(
    questions: Question[]
  ): QuestionCountsByTrack {

    let core = 0
    let leadership = 0
    let strategic = 0

    questions.forEach(q => {
      if (!q.audienceRule) {
        core++
      } else {
        const rule = q.audienceRule as AudienceRule
        if (rule.minTrack === 'MANAGER') leadership++
        if (rule.minTrack === 'EJECUTIVO') strategic++
      }
    })

    return {
      colaborador: core,
      manager: core + leadership,
      ejecutivo: core + leadership + strategic
    }
  }

  /**
   * Verifica si una pregunta aplica para un track específico
   */
  static questionAppliesToTrack(
    question: Question,
    evaluateeTrack: string
  ): boolean {
    if (!question.audienceRule) return true

    const rule = question.audienceRule as AudienceRule
    if (!rule.minTrack) return true

    const evaluateeLevel = TRACK_HIERARCHY[evaluateeTrack] || 1
    const minLevel = TRACK_HIERARCHY[rule.minTrack] || 1

    return evaluateeLevel >= minLevel
  }

  /**
   * Agrupa preguntas por competencia
   * Útil para reportes por competencia
   */
  static groupByCompetency(
    questions: FilteredQuestion[]
  ): Map<string, FilteredQuestion[]> {
    const grouped = new Map<string, FilteredQuestion[]>()

    questions.forEach(q => {
      const code = q.competencyCode || 'sin_competencia'
      if (!grouped.has(code)) {
        grouped.set(code, [])
      }
      grouped.get(code)!.push(q)
    })

    return grouped
  }

  /**
   * Obtiene el track mínimo requerido para una competencia
   * Basado en su audienceRule
   */
  static getMinTrackForCompetency(
    competency: CompetencySnapshot
  ): string {
    if (!competency.audienceRule) return 'COLABORADOR'
    return competency.audienceRule.minTrack || 'COLABORADOR'
  }

  /**
   * Valida si el snapshot contiene competencias válidas para el track
   */
  static hasCompetenciesForTrack(
    snapshot: CompetencySnapshot[],
    track: string
  ): boolean {
    const trackLevel = TRACK_HIERARCHY[track] || 1

    return snapshot.some(c => {
      if (!c.audienceRule) return true
      const minLevel = TRACK_HIERARCHY[c.audienceRule.minTrack || 'COLABORADOR'] || 1
      return trackLevel >= minLevel
    })
  }

  /**
   * Filtra snapshot para mostrar solo competencias aplicables a un track
   * Útil para preview en UI antes de generar evaluaciones
   */
  static filterSnapshotByTrack(
    snapshot: CompetencySnapshot[],
    track: string
  ): CompetencySnapshot[] {
    const trackLevel = TRACK_HIERARCHY[track] || 1

    return snapshot.filter(c => {
      if (!c.audienceRule) return true
      const minLevel = TRACK_HIERARCHY[c.audienceRule.minTrack || 'COLABORADOR'] || 1
      return trackLevel >= minLevel
    })
  }
}

export default CompetencyFilterService
