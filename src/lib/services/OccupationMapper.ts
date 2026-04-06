// ════════════════════════════════════════════════════════════════════════════
// OCCUPATION MAPPER — Clasificador cargo chileno → SOC code O*NET
// src/lib/services/OccupationMapper.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: réplica de DepartmentAdapter (aliases + scoring + ambiguity rule)
//       + persistencia de PositionAdapter (JobMappingHistory → OccupationMapping)
//
// Input:  cargoTexto + standardCategory (DepartmentAdapter) + standardJobLevel (PositionAdapter)
// Output: { socCode, confidence, occupationTitle, mappingMethod, source }
//
// Flujo: cache → exact match → keyword scoring → context disambiguation → LLM fallback
// Determinístico <10ms (sin LLM). LLM solo para UNCLASSIFIED, limitado 50/mes/account.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import {
  SOC_ALIASES,
  STRONG_KEYWORDS,
  CONTEXT_HINTS,
  SOC_TITLES_ES,
} from '@/config/OnetOccupationConfig'
import type { OccupationConfidence, OccupationMappingSource } from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface OccupationClassification {
  socCode: string | null
  confidence: OccupationConfidence
  occupationTitle: string | null
  mappingMethod: 'cache' | 'exact' | 'scored' | 'context' | 'llm' | 'failed'
  source: OccupationMappingSource
}

// ════════════════════════════════════════════════════════════════════════════
// SCORING WEIGHTS — mismo patrón que DepartmentAdapter.keywordWeights
// ════════════════════════════════════════════════════════════════════════════

const WEIGHTS = {
  STRONG_KEYWORD: 10,
  ALIAS_KEYWORD: 2,
  AMBIGUITY_MULTIPLIER: 2, // best debe ser ≥ 2× second
} as const

// ════════════════════════════════════════════════════════════════════════════
// LLM FALLBACK — límite mensual por account
// ════════════════════════════════════════════════════════════════════════════

const LLM_MONTHLY_LIMIT = 50

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s\-\/&.]/g, '') // solo alfanumérico + separadores
    .replace(/\s+/g, ' ')
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class OccupationMapper {

  // ──────────────────────────────────────────────────────────────────────
  // MÉTODO PRINCIPAL — classify (async, con cache y persistencia)
  // Réplica del flujo de PositionAdapter.classifyPositionWithHistory
  // ──────────────────────────────────────────────────────────────────────

  static async classify(
    positionText: string,
    accountId: string,
    standardCategory?: string | null,
    standardJobLevel?: string | null
  ): Promise<OccupationClassification> {
    if (!positionText || !accountId) {
      return {
        socCode: null,
        confidence: 'UNCLASSIFIED',
        occupationTitle: null,
        mappingMethod: 'failed',
        source: 'ALGORITHM',
      }
    }

    const normalizedPosition = normalize(positionText)

    // 1. CACHE CHECK — buscar en OccupationMapping (como JobMappingHistory)
    try {
      const cached = await prisma.occupationMapping.findUnique({
        where: {
          accountId_positionText: {
            accountId,
            positionText: normalizedPosition,
          },
        },
      })

      if (cached && cached.socCode) {
        return {
          socCode: cached.socCode,
          confidence: cached.confidence,
          occupationTitle: SOC_TITLES_ES[cached.socCode] ?? null,
          mappingMethod: 'cache',
          source: cached.source,
        }
      }
    } catch {
      // Si falla la query, continuar con clasificación algorítmica
    }

    // 2. CLASIFICACIÓN ALGORÍTMICA (sync, <10ms)
    const algorithmResult = this.getSOCCodeWithDetails(normalizedPosition, standardCategory, standardJobLevel)

    // 3. Si algoritmo mapea → persistir y retornar
    if (algorithmResult.socCode) {
      await this.persistMapping(
        accountId,
        normalizedPosition,
        algorithmResult.socCode,
        algorithmResult.confidence,
        'ALGORITHM',
        standardCategory,
        standardJobLevel
      )
      return algorithmResult
    }

    // 4. LLM FALLBACK — solo si UNCLASSIFIED y hay cuota disponible
    const llmResult = await this.classifyWithLLM(
      positionText, // texto original (no normalizado) para mejor contexto
      accountId,
      standardCategory,
      standardJobLevel
    )

    if (llmResult) {
      await this.persistMapping(
        accountId,
        normalizedPosition,
        llmResult.socCode,
        llmResult.confidence,
        'LLM',
        standardCategory,
        standardJobLevel
      )
      return {
        ...llmResult,
        occupationTitle: SOC_TITLES_ES[llmResult.socCode] ?? null,
        mappingMethod: 'llm',
        source: 'LLM',
      }
    }

    // 5. Sin mapeo — persistir como UNCLASSIFIED
    await this.persistMapping(
      accountId,
      normalizedPosition,
      null,
      'UNCLASSIFIED',
      'ALGORITHM',
      standardCategory,
      standardJobLevel
    )

    return {
      socCode: null,
      confidence: 'UNCLASSIFIED',
      occupationTitle: null,
      mappingMethod: 'failed',
      source: 'ALGORITHM',
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // SYNC — getSOCCode (sin DB, sin async)
  // Réplica de DepartmentAdapter.getGerenciaCategory
  // ──────────────────────────────────────────────────────────────────────

  static getSOCCode(positionText: string): string | null {
    if (!positionText) return null
    return this.getSOCCodeWithDetails(normalize(positionText)).socCode
  }

  // ──────────────────────────────────────────────────────────────────────
  // BATCH — classifyBatch (para sync masivo de employees)
  // ──────────────────────────────────────────────────────────────────────

  static async classifyBatch(
    positions: Array<{
      positionText: string
      standardCategory?: string | null
      standardJobLevel?: string | null
    }>,
    accountId: string
  ): Promise<OccupationClassification[]> {
    const results: OccupationClassification[] = []

    for (const pos of positions) {
      const result = await this.classify(
        pos.positionText,
        accountId,
        pos.standardCategory,
        pos.standardJobLevel
      )
      results.push(result)
    }

    return results
  }

  // ──────────────────────────────────────────────────────────────────────
  // PRIVATE — motor algorítmico (exact + scoring + context)
  // Réplica de DepartmentAdapter.getGerenciaCategory
  // ──────────────────────────────────────────────────────────────────────

  private static getSOCCodeWithDetails(
    normalizedText: string,
    standardCategory?: string | null,
    standardJobLevel?: string | null
  ): OccupationClassification {
    const baseResult: OccupationClassification = {
      socCode: null,
      confidence: 'UNCLASSIFIED',
      occupationTitle: null,
      mappingMethod: 'failed',
      source: 'ALGORITHM',
    }

    if (!normalizedText) return baseResult

    // ── NIVEL 1: EXACT PHRASE MATCH ──
    for (const [socCode, aliases] of Object.entries(SOC_ALIASES)) {
      if (aliases.includes(normalizedText)) {
        return {
          socCode,
          confidence: 'HIGH',
          occupationTitle: SOC_TITLES_ES[socCode] ?? null,
          mappingMethod: 'exact',
          source: 'ALGORITHM',
        }
      }
    }

    // ── NIVEL 2: KEYWORD SCORING ──
    const words = normalizedText.split(/[\s\-_\/]+/).filter(w => w.length > 1)
    const scores: Record<string, number> = {}

    for (const [socCode, aliases] of Object.entries(SOC_ALIASES)) {
      for (const word of words) {
        // Strong keywords = +10 puntos
        if (STRONG_KEYWORDS[socCode]?.includes(word)) {
          scores[socCode] = (scores[socCode] ?? 0) + WEIGHTS.STRONG_KEYWORD
        }
        // Alias keywords = +2 puntos (check if any alias contains this word)
        else if (aliases.some(alias => alias.split(/\s+/).includes(word))) {
          scores[socCode] = (scores[socCode] ?? 0) + WEIGHTS.ALIAS_KEYWORD
        }
      }
    }

    // Ordenar por score descendente
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])

    if (sortedScores.length > 0) {
      const [bestSOC, bestScore] = sortedScores[0]
      const secondMatch = sortedScores[1]

      // Regla de ambigüedad: best debe ser ≥ 2× second
      if (!secondMatch || bestScore >= secondMatch[1] * WEIGHTS.AMBIGUITY_MULTIPLIER) {
        return {
          socCode: bestSOC,
          confidence: bestScore >= 10 ? 'HIGH' : 'MEDIUM',
          occupationTitle: SOC_TITLES_ES[bestSOC] ?? null,
          mappingMethod: 'scored',
          source: 'ALGORITHM',
        }
      }

      // ── NIVEL 3: CONTEXT DISAMBIGUATION ──
      // Si es ambiguo PERO tenemos contexto de gerencia + nivel → desambiguar
      if (standardCategory && standardJobLevel) {
        const acotadoGroup = this.jobLevelToAcotado(standardJobLevel)
        const hint = CONTEXT_HINTS[standardCategory]?.[acotadoGroup]

        if (hint && scores[hint]) {
          return {
            socCode: hint,
            confidence: 'MEDIUM',
            occupationTitle: SOC_TITLES_ES[hint] ?? null,
            mappingMethod: 'context',
            source: 'ALGORITHM',
          }
        }
      }

      // Ambiguo sin contexto → usar el mejor pero con LOW confidence
      if (bestScore >= 4) {
        return {
          socCode: bestSOC,
          confidence: 'LOW',
          occupationTitle: SOC_TITLES_ES[bestSOC] ?? null,
          mappingMethod: 'scored',
          source: 'ALGORITHM',
        }
      }
    }

    // ── NIVEL 4: CONTEXT ONLY ──
    // Sin ningún score pero con contexto → usar hint directo
    if (standardCategory && standardJobLevel) {
      const acotadoGroup = this.jobLevelToAcotado(standardJobLevel)
      const hint = CONTEXT_HINTS[standardCategory]?.[acotadoGroup]

      if (hint) {
        return {
          socCode: hint,
          confidence: 'LOW',
          occupationTitle: SOC_TITLES_ES[hint] ?? null,
          mappingMethod: 'context',
          source: 'ALGORITHM',
        }
      }
    }

    return baseResult
  }

  // ──────────────────────────────────────────────────────────────────────
  // PRIVATE — LLM fallback (Claude API)
  // Solo se ejecuta si algoritmo retorna UNCLASSIFIED
  // Límite: 50 llamadas por accountId por mes
  // ──────────────────────────────────────────────────────────────────────

  private static async classifyWithLLM(
    positionText: string,
    accountId: string,
    standardCategory?: string | null,
    standardJobLevel?: string | null
  ): Promise<{ socCode: string; confidence: OccupationConfidence } | null> {
    // 1. Verificar API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return null

    // 2. Verificar cuota mensual
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const monthlyCount = await prisma.occupationMapping.count({
        where: {
          accountId,
          source: 'LLM',
          mappedAt: { gte: startOfMonth },
        },
      })

      if (monthlyCount >= LLM_MONTHLY_LIMIT) {
        console.log(`[OccupationMapper] LLM limit reached for account ${accountId} (${monthlyCount}/${LLM_MONTHLY_LIMIT})`)
        return null
      }
    } catch {
      return null
    }

    // 3. Obtener SOC codes disponibles para restricción del prompt
    let availableSocCodes: string[] = []
    try {
      const occupations = await prisma.onetOccupation.findMany({
        where: { isActive: true },
        select: { socCode: true, titleEn: true },
      })
      availableSocCodes = occupations.map(o => `${o.socCode} (${o.titleEn})`)
    } catch {
      // Si no hay tabla, usar los del config
      availableSocCodes = Object.entries(SOC_TITLES_ES).map(([code, title]) => `${code} (${title})`)
    }

    // 4. Llamar a Claude
    try {
      // @ts-ignore — dynamic import, SDK may not be installed (graceful degradation)
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey })

      const contextStr = [
        standardCategory ? `Gerencia: ${standardCategory}` : null,
        standardJobLevel ? `Nivel: ${standardJobLevel}` : null,
      ].filter(Boolean).join('. ')

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Clasifica este cargo chileno al código SOC de O*NET más apropiado.

Cargo: "${positionText}"
${contextStr ? `Contexto: ${contextStr}` : ''}

SOC codes disponibles (elige UNO):
${availableSocCodes.slice(0, 100).join('\n')}

Responde SOLO con JSON: {"socCode": "XX-XXXX.XX", "confidence": "HIGH"|"MEDIUM"|"LOW"}`,
        }],
      })

      // 5. Parsear respuesta
      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      const jsonMatch = text.match(/\{[^}]+\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])
      const socCode = parsed.socCode as string
      const confidence = (['HIGH', 'MEDIUM', 'LOW'].includes(parsed.confidence) ? parsed.confidence : 'LOW') as OccupationConfidence

      // 6. Validar que el SOC code existe
      if (!SOC_TITLES_ES[socCode] && !availableSocCodes.some(s => s.startsWith(socCode))) {
        console.log(`[OccupationMapper] LLM returned invalid SOC: ${socCode}`)
        return null
      }

      console.log(`[OccupationMapper] LLM classified "${positionText}" → ${socCode} (${confidence})`)
      return { socCode, confidence }
    } catch (error) {
      console.log(`[OccupationMapper] LLM fallback error:`, error instanceof Error ? error.message : 'unknown')
      return null
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // PRIVATE — persistir en OccupationMapping (como JobMappingHistory)
  // ──────────────────────────────────────────────────────────────────────

  private static async persistMapping(
    accountId: string,
    positionText: string,
    socCode: string | null,
    confidence: OccupationConfidence,
    source: OccupationMappingSource,
    contextCategory?: string | null,
    contextJobLevel?: string | null
  ): Promise<void> {
    try {
      await prisma.occupationMapping.upsert({
        where: {
          accountId_positionText: { accountId, positionText },
        },
        update: {
          socCode,
          confidence,
          source,
          contextCategory: contextCategory ?? undefined,
          contextJobLevel: contextJobLevel ?? undefined,
          mappedAt: new Date(),
        },
        create: {
          accountId,
          positionText,
          socCode,
          confidence,
          source,
          contextCategory,
          contextJobLevel,
        },
      })
    } catch (error) {
      // No bloquear por error de persistencia
      console.warn(`[OccupationMapper] Failed to persist mapping:`, error instanceof Error ? error.message : 'unknown')
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // PRIVATE — mapear standardJobLevel → acotadoGroup
  // ──────────────────────────────────────────────────────────────────────

  private static jobLevelToAcotado(standardJobLevel: string): string {
    const map: Record<string, string> = {
      gerente_director: 'alta_gerencia',
      subgerente_subdirector: 'alta_gerencia',
      jefe: 'mandos_medios',
      supervisor_coordinador: 'mandos_medios',
      profesional_analista: 'profesionales',
      asistente_otros: 'base_operativa',
      operativo_auxiliar: 'base_operativa',
    }
    return map[standardJobLevel] ?? 'profesionales'
  }
}
