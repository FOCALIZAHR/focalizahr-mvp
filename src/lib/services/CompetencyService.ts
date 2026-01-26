// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY SERVICE - Gestión de Biblioteca de Competencias
// src/lib/services/CompetencyService.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: SAP SuccessFactors, Lattice
// Filosofía: Lazy initialization - se crea al activar módulo Performance
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  COMPETENCY_TEMPLATES,
  listAvailableTemplates,
  type CompetencyTemplateItem
} from '@/lib/constants/competencyTemplates'
import type { CompetencyCategory, Competency } from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface CompetencySnapshot {
  code: string
  name: string
  category: CompetencyCategory
  behaviors: string[]
  audienceRule: { minTrack: string } | null
  dimensionCode: string | null
  subdimensionCode: string | null
}

export interface InitializeResult {
  created: number
  template: string
}

export interface CompetencyCreateInput {
  code: string
  name: string
  description?: string
  category: CompetencyCategory
  behaviors?: string[]
  audienceRule?: { minTrack: string } | null
  dimensionCode?: string
  subdimensionCode?: string
}

export interface CompetencyUpdateInput {
  name?: string
  description?: string
  behaviors?: string[]
  isActive?: boolean
  sortOrder?: number
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class CompetencyService {

  // ══════════════════════════════════════════════════════════════════════════
  // LAZY INITIALIZATION
  // Se llama cuando el cliente ACTIVA el módulo de Performance Evaluation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Inicializa biblioteca de competencias desde un template
   * @param accountId - ID de la cuenta
   * @param templateId - ID del template a usar
   * @returns Resultado con cantidad creada y nombre del template
   */
  static async initializeFromTemplate(
    accountId: string,
    templateId: string
  ): Promise<InitializeResult> {

    const template = COMPETENCY_TEMPLATES[templateId]
    if (!template) {
      throw new Error(`Template ${templateId} no encontrado`)
    }

    // Verificar que no existan competencias para este account
    const existing = await prisma.competency.count({ where: { accountId } })
    if (existing > 0) {
      throw new Error('Este account ya tiene competencias inicializadas')
    }

    const competenciesToCreate = template.competencies.map((comp: CompetencyTemplateItem, index: number) => ({
      accountId,
      code: comp.code,
      name: comp.name,
      description: comp.description,
      category: comp.category as CompetencyCategory,
      behaviors: comp.behaviors,
      audienceRule: comp.audienceRule === null ? Prisma.JsonNull : comp.audienceRule,
      dimensionCode: comp.dimensionCode || null,
      subdimensionCode: comp.subdimensionCode || null,
      sourceTemplate: templateId,
      isCustom: false,
      sortOrder: index,
      isActive: true
    }))

    const result = await prisma.competency.createMany({
      data: competenciesToCreate
    })

    return {
      created: result.count,
      template: template.name
    }
  }

  /**
   * Verifica si un account ya tiene competencias inicializadas
   */
  static async hasCompetencies(accountId: string): Promise<boolean> {
    const count = await prisma.competency.count({ where: { accountId } })
    return count > 0
  }

  /**
   * Lista templates disponibles para inicialización
   */
  static getAvailableTemplates(): Array<{
    id: string
    name: string
    description: string
    competencyCount: number
    categories: string[]
  }> {
    return listAvailableTemplates()
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CRUD COMPETENCIAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene competencias de un Account
   * @param accountId - ID de la cuenta
   * @param options - Filtros opcionales
   */
  static async getByAccount(
    accountId: string,
    options?: {
      category?: CompetencyCategory
      activeOnly?: boolean
      includeCustom?: boolean
    }
  ): Promise<Competency[]> {

    const where: {
      accountId: string
      category?: CompetencyCategory
      isActive?: boolean
    } = { accountId }

    if (options?.category) {
      where.category = options.category
    }

    if (options?.activeOnly !== false) {
      where.isActive = true
    }

    return prisma.competency.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' }
      ]
    })
  }

  /**
   * Obtiene una competencia por ID
   */
  static async getById(
    accountId: string,
    competencyId: string
  ): Promise<Competency | null> {
    return prisma.competency.findFirst({
      where: {
        id: competencyId,
        accountId
      }
    })
  }

  /**
   * Obtiene una competencia por código
   */
  static async getByCode(
    accountId: string,
    code: string
  ): Promise<Competency | null> {
    return prisma.competency.findFirst({
      where: {
        accountId,
        code
      }
    })
  }

  /**
   * Obtiene códigos de competencias activas
   */
  static async getActiveCompetencyCodes(accountId: string): Promise<string[]> {
    const competencies = await prisma.competency.findMany({
      where: { accountId, isActive: true },
      select: { code: true }
    })
    return competencies.map(c => c.code)
  }

  /**
   * Crea competencia personalizada
   */
  static async createCustom(
    accountId: string,
    data: CompetencyCreateInput
  ): Promise<Competency> {

    // Validar que el código no exista
    const existing = await prisma.competency.findFirst({
      where: { accountId, code: data.code }
    })

    if (existing) {
      throw new Error(`Ya existe una competencia con código ${data.code}`)
    }

    // Obtener el máximo sortOrder
    const maxSort = await prisma.competency.aggregate({
      where: { accountId },
      _max: { sortOrder: true }
    })

    return prisma.competency.create({
      data: {
        accountId,
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        behaviors: data.behaviors || [],
        audienceRule: data.audienceRule === null || data.audienceRule === undefined
          ? Prisma.JsonNull
          : data.audienceRule,
        dimensionCode: data.dimensionCode || null,
        subdimensionCode: data.subdimensionCode || null,
        isCustom: true,
        sourceTemplate: null,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        isActive: true
      }
    })
  }

  /**
   * Actualiza competencia
   */
  static async update(
    accountId: string,
    competencyId: string,
    data: CompetencyUpdateInput
  ): Promise<Competency> {

    return prisma.competency.update({
      where: {
        id: competencyId,
        accountId // Seguridad: solo puede editar sus propias competencias
      },
      data
    })
  }

  /**
   * Activa/desactiva una competencia
   */
  static async toggleActive(
    accountId: string,
    competencyId: string,
    isActive: boolean
  ): Promise<Competency> {
    return this.update(accountId, competencyId, { isActive })
  }

  /**
   * Elimina una competencia (soft delete via isActive = false)
   * Solo permite eliminar competencias custom
   */
  static async deleteCustom(
    accountId: string,
    competencyId: string
  ): Promise<void> {
    const competency = await this.getById(accountId, competencyId)

    if (!competency) {
      throw new Error('Competencia no encontrada')
    }

    if (!competency.isCustom) {
      throw new Error('Solo se pueden eliminar competencias personalizadas. Desactiva las del template.')
    }

    await prisma.competency.delete({
      where: {
        id: competencyId,
        accountId
      }
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SNAPSHOT PARA CICLO
  // El snapshot se congela al crear el PerformanceCycle
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Genera snapshot de competencias activas para congelar en un ciclo
   * Este snapshot NO cambia aunque el cliente edite su biblioteca después
   */
  static async generateSnapshot(accountId: string): Promise<CompetencySnapshot[]> {
    const competencies = await prisma.competency.findMany({
      where: { accountId, isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    })

    return competencies.map(c => ({
      code: c.code,
      name: c.name,
      category: c.category,
      behaviors: (c.behaviors as string[]) || [],
      audienceRule: c.audienceRule as { minTrack: string } | null,
      dimensionCode: c.dimensionCode,
      subdimensionCode: c.subdimensionCode
    }))
  }

  /**
   * Obtiene competencia del snapshot por código
   * Útil para reportes - usa el nombre congelado, no el actual
   */
  static getFromSnapshot(
    snapshot: CompetencySnapshot[],
    competencyCode: string
  ): CompetencySnapshot | null {
    return snapshot.find(c => c.code === competencyCode) || null
  }

  /**
   * Valida que un snapshot sea válido
   */
  static isValidSnapshot(snapshot: unknown): snapshot is CompetencySnapshot[] {
    if (!Array.isArray(snapshot)) return false
    return snapshot.every(item =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.code === 'string' &&
      typeof item.name === 'string' &&
      typeof item.category === 'string'
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene estadísticas de competencias por account
   */
  static async getStats(accountId: string): Promise<{
    total: number
    active: number
    custom: number
    byCategory: Record<string, number>
    sourceTemplate: string | null
  }> {
    const competencies = await prisma.competency.findMany({
      where: { accountId }
    })

    const byCategory = competencies.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Obtener source template del primer registro (todos deberían tener el mismo)
    const sourceTemplate = competencies.find(c => c.sourceTemplate)?.sourceTemplate || null

    return {
      total: competencies.length,
      active: competencies.filter(c => c.isActive).length,
      custom: competencies.filter(c => c.isCustom).length,
      byCategory,
      sourceTemplate
    }
  }
}

export default CompetencyService
