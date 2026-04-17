// ════════════════════════════════════════════════════════════════════════════
// OCCUPATION RESOLVER v3 — Router + LLM con contexto + batch persistencia
// Paso 1: Router — simples → algorítmica, compuestos/jefatura → LLM
// Paso 2: Match mejorado para ruta algorítmica
// Paso 3: LLM batch con standardCategory + standardJobLevel en prompt
// Paso 4: Persistir todo en una sola transacción
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import { SOC_ALIASES, STRONG_KEYWORDS, SOC_TITLES_ES } from '@/config/OnetOccupationConfig'
import type { OccupationConfidence } from '@prisma/client'
import { normalizePositionText } from '@/lib/utils/normalizePosition'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface PositionInput {
  positionText: string
  standardCategory: string | null
  standardJobLevel: string | null
}

interface ResolveResult {
  positionText: string
  socCode: string | null
  confidence: OccupationConfidence
  occupationTitle: string | null
  method: 'exact' | 'scored' | 'auto_keyword' | 'partial' | 'llm' | 'failed'
  score: number
}

interface BatchStats {
  total: number
  high: number
  medium: number
  low: number
  unclassified: number
  routedToLLM: number
  resolvedByAlgorithm: number
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

// `normalize` local migrado a normalizePositionText de @/lib/utils/normalizePosition
// (single source of truth). Alias para minimizar diff en los call sites.
const normalize = normalizePositionText

const STOPWORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'con', 'para', 'por', 'una', 'uno', 'que', 'y', 'o', 'a'])

function extractWords(text: string): string[] {
  return text.split(/[\s\-_\/]+/).filter(w => w.length > 1 && !STOPWORDS.has(w))
}

function getAutoKeywords(socCode: string): string[] {
  const title = SOC_TITLES_ES[socCode]
  if (!title) return []
  return extractWords(normalize(title))
}

// Keywords que indican cargos de jefatura/compuestos → ruta LLM
const JEFATURA_WORDS = new Set(['jefe', 'director', 'gerente', 'supervisor', 'coordinador', 'coordinadora', 'supervisora', 'directora', 'gerenta', 'subgerente', 'subdirector'])

// Flat set de todos los alias texts para quick exact-match check
const ALL_ALIASES_FLAT = new Set<string>()
for (const aliases of Object.values(SOC_ALIASES)) {
  for (const a of aliases) ALL_ALIASES_FLAT.add(a)
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class OccupationResolver {

  // ──────────────────────────────────────────────────────────────────────
  // RESOLVE BATCH — Pipeline con router
  // ──────────────────────────────────────────────────────────────────────

  static async resolveBatch(
    positions: PositionInput[],
    accountId: string
  ): Promise<{ results: ResolveResult[]; stats: BatchStats }> {

    const results: ResolveResult[] = new Array(positions.length)
    const unresolvedForLLM: Array<{ index: number; input: PositionInput }> = []
    let resolvedByAlgorithm = 0

    // ═══ PASO 1+2: Router + Match algorítmico ═══
    const allSOCs = Object.keys(SOC_ALIASES)

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      const normalized = normalize(pos.positionText)
      const words = extractWords(normalized)

      // ── ROUTER: ¿ruta algorítmica o LLM? ──
      const hasExactAlias = ALL_ALIASES_FLAT.has(normalized)
      const isCompound = words.length >= 3 || normalized.includes(' y ')
      const isJefatura = words.some(w => JEFATURA_WORDS.has(w))

      if (hasExactAlias) {
        // Exact match → ruta algorítmica directa (siempre HIGH)
        const result = this.matchImproved(normalized, words, allSOCs)
        results[i] = { ...result, positionText: pos.positionText }
        resolvedByAlgorithm++
        continue
      }

      // Intentar match algorítmico primero
      const algoResult = this.matchImproved(normalized, words, allSOCs)

      if (algoResult.confidence === 'HIGH' || algoResult.confidence === 'MEDIUM') {
        // Algorítmica resolvió con confianza suficiente
        results[i] = { ...algoResult, positionText: pos.positionText }
        resolvedByAlgorithm++
        continue
      }

      if (isCompound || isJefatura) {
        // Cargo complejo sin match fuerte → LLM
        results[i] = { positionText: pos.positionText, socCode: null, confidence: 'UNCLASSIFIED', occupationTitle: null, method: 'failed', score: 0 }
        unresolvedForLLM.push({ index: i, input: pos })
        continue
      }

      // Cargo simple sin match → guardar lo que tenga (LOW o UNCLASSIFIED)
      if (algoResult.socCode) {
        results[i] = { ...algoResult, positionText: pos.positionText }
        resolvedByAlgorithm++
      } else {
        results[i] = { positionText: pos.positionText, socCode: null, confidence: 'UNCLASSIFIED', occupationTitle: null, method: 'failed', score: 0 }
        unresolvedForLLM.push({ index: i, input: pos })
      }
    }

    console.log(`[OccupationResolver] Router: ${resolvedByAlgorithm} algorítmico, ${unresolvedForLLM.length} → LLM`)

    // ═══ PASO 3: LLM batch con contexto ═══
    if (unresolvedForLLM.length > 0) {
      const llmResults = await this.resolveWithLLM(unresolvedForLLM, accountId)
      for (const lr of llmResults) {
        results[lr.index] = {
          positionText: results[lr.index].positionText,
          socCode: lr.socCode,
          confidence: lr.confidence,
          occupationTitle: SOC_TITLES_ES[lr.socCode] ?? null,
          method: 'llm',
          score: 0,
        }
      }
    }

    // ═══ PASO 4: Persistir en transacción batch ═══
    await this.persistBatch(results, accountId)

    // Stats
    const stats: BatchStats = {
      total: results.length,
      high: results.filter(r => r.confidence === 'HIGH').length,
      medium: results.filter(r => r.confidence === 'MEDIUM').length,
      low: results.filter(r => r.confidence === 'LOW').length,
      unclassified: results.filter(r => r.confidence === 'UNCLASSIFIED').length,
      routedToLLM: unresolvedForLLM.length,
      resolvedByAlgorithm,
    }

    return { results, stats }
  }

  // ──────────────────────────────────────────────────────────────────────
  // MATCH MEJORADO (3 tiers de scoring)
  // ──────────────────────────────────────────────────────────────────────

  private static matchImproved(
    normalizedText: string,
    words: string[],
    candidateSOCs: string[]
  ): ResolveResult {

    const baseResult: ResolveResult = {
      positionText: '', socCode: null, confidence: 'UNCLASSIFIED',
      occupationTitle: null, method: 'failed', score: 0,
    }

    if (!normalizedText || words.length === 0) return baseResult

    // Exact phrase match
    for (const socCode of candidateSOCs) {
      const aliases = SOC_ALIASES[socCode]
      if (!aliases) continue
      if (aliases.includes(normalizedText)) {
        return { positionText: '', socCode, confidence: 'HIGH', occupationTitle: SOC_TITLES_ES[socCode] ?? null, method: 'exact', score: 100 }
      }
    }

    // Keyword scoring
    const scores: Record<string, { score: number; method: string }> = {}

    for (const socCode of candidateSOCs) {
      const aliases = SOC_ALIASES[socCode] ?? []
      const strongKws = STRONG_KEYWORDS[socCode] ?? []
      const autoKws = getAutoKeywords(socCode)
      let score = 0
      let method = 'scored'

      for (const word of words) {
        if (strongKws.includes(word)) {
          score += 10
        } else if (autoKws.includes(word)) {
          score += 6
          method = 'auto_keyword'
        } else if (aliases.some(alias => alias.split(/\s+/).includes(word))) {
          score += 3
        } else if (aliases.some(alias => {
          const aliasWords = alias.split(/\s+/)
          return aliasWords.some(aw => (aw.length >= 3 && word.length >= 3) && (aw.includes(word) || word.includes(aw)))
        })) {
          score += 1
          if (method === 'scored') method = 'partial'
        }
      }

      if (score > 0) scores[socCode] = { score, method }
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score)
    if (sorted.length === 0) return baseResult

    const [bestSOC, bestData] = sorted[0]
    const secondMatch = sorted[1]

    if (!secondMatch || bestData.score >= secondMatch[1].score * 2) {
      return {
        positionText: '', socCode: bestSOC,
        confidence: bestData.score >= 10 ? 'HIGH' : bestData.score >= 4 ? 'MEDIUM' : 'LOW',
        occupationTitle: SOC_TITLES_ES[bestSOC] ?? null,
        method: bestData.method as any, score: bestData.score,
      }
    }

    if (bestData.score >= 4) {
      return {
        positionText: '', socCode: bestSOC, confidence: 'LOW',
        occupationTitle: SOC_TITLES_ES[bestSOC] ?? null,
        method: bestData.method as any, score: bestData.score,
      }
    }

    return baseResult
  }

  // ──────────────────────────────────────────────────────────────────────
  // LLM BATCH — Claude Haiku con contexto (category + jobLevel)
  // ──────────────────────────────────────────────────────────────────────

  private static async resolveWithLLM(
    unresolved: Array<{ index: number; input: PositionInput }>,
    accountId: string
  ): Promise<Array<{ index: number; socCode: string; confidence: OccupationConfidence }>> {

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.log('[OccupationResolver] No ANTHROPIC_API_KEY — skipping LLM')
      return []
    }

    // Quota check
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const llmCount = await prisma.occupationMapping.count({
      where: { accountId, source: 'LLM', mappedAt: { gte: monthStart } },
    })

    const LLM_MONTHLY_LIMIT = 200
    if (llmCount >= LLM_MONTHLY_LIMIT) {
      console.log(`[OccupationResolver] LLM quota exhausted (${llmCount}/${LLM_MONTHLY_LIMIT})`)
      return []
    }

    const remaining = LLM_MONTHLY_LIMIT - llmCount
    const toProcess = unresolved.slice(0, remaining)
    const results: Array<{ index: number; socCode: string; confidence: OccupationConfidence }> = []

    // Validate SOC codes exist in DB
    const validSOCs = new Set(Object.keys(SOC_ALIASES))

    // Process in batches of 20
    for (let batchStart = 0; batchStart < toProcess.length; batchStart += 20) {
      const batch = toProcess.slice(batchStart, batchStart + 20)

      // Build cargo list WITH context
      const cargoList = batch.map((b, idx) => {
        const parts = [`${idx + 1}. "${b.input.positionText}"`]
        if (b.input.standardCategory) parts.push(`departamento: ${b.input.standardCategory}`)
        if (b.input.standardJobLevel) parts.push(`nivel: ${b.input.standardJobLevel}`)
        return parts.join(' | ')
      }).join('\n')

      // Build SOC reference list (top 50 most common)
      const socList = Object.entries(SOC_TITLES_ES)
        .slice(0, 80)
        .map(([code, title]) => `${code}: ${title}`)
        .join('\n')

      const prompt = `Eres un experto en clasificación de cargos chilenos al estándar O*NET SOC.
Mapea estos cargos al SOC code más cercano. Cada cargo incluye su departamento y nivel jerárquico para que desambigües correctamente.

CARGOS A MAPEAR:
${cargoList}

SOC CODES DISPONIBLES:
${socList}

REGLAS:
- Usa el departamento y nivel para desambiguar (ej: "analista" en finanzas ≠ "analista" en TI)
- Si el cargo es de jefatura/supervisión, mapea al SOC de "First-Line Supervisors" o "Managers" del área
- Si no hay match razonable, usa confidence "UNCLASSIFIED"

Responde SOLO un JSON array, sin explicación:
[{"cargo": 1, "socCode": "XX-XXXX.00", "confidence": "HIGH"|"MEDIUM", "reason": "breve"}]`

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!res.ok) {
          console.warn(`[OccupationResolver] LLM API ${res.status}`)
          continue
        }

        const json = await res.json()
        const content = json.content?.[0]?.text ?? ''

        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (!jsonMatch) continue

        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          cargo: number; socCode: string | null; confidence: string; reason?: string
        }>

        for (const p of parsed) {
          if (!p.socCode || p.confidence === 'UNCLASSIFIED') continue
          const batchItem = batch[p.cargo - 1]
          if (!batchItem) continue

          // Validate SOC exists
          if (!validSOCs.has(p.socCode)) {
            console.warn(`[OccupationResolver] LLM returned invalid SOC: ${p.socCode} for "${batchItem.input.positionText}"`)
            continue
          }

          results.push({
            index: batchItem.index,
            socCode: p.socCode,
            confidence: (p.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM') as OccupationConfidence,
          })

          if (p.reason) {
            console.log(`[OccupationResolver] LLM: "${batchItem.input.positionText}" → ${p.socCode} (${p.reason})`)
          }
        }

        console.log(`[OccupationResolver] LLM batch ${Math.floor(batchStart / 20) + 1}: ${parsed.length} responses, ${results.length} valid`)

      } catch (e) {
        console.warn('[OccupationResolver] LLM error:', e instanceof Error ? e.message : 'unknown')
      }
    }

    return results
  }

  // ──────────────────────────────────────────────────────────────────────
  // PERSIST BATCH — Una transacción en vez de N upserts secuenciales
  // ──────────────────────────────────────────────────────────────────────

  private static async persistBatch(
    results: ResolveResult[],
    accountId: string
  ): Promise<void> {
    const operations = results.map(r => {
      const normalizedPos = normalize(r.positionText)
      return prisma.occupationMapping.upsert({
        where: { accountId_positionText: { accountId, positionText: normalizedPos } },
        update: {
          socCode: r.socCode,
          confidence: r.confidence,
          source: r.method === 'llm' ? 'LLM' : 'ALGORITHM',
          mappedAt: new Date(),
        },
        create: {
          accountId,
          positionText: normalizedPos,
          socCode: r.socCode,
          confidence: r.confidence,
          source: r.method === 'llm' ? 'LLM' : 'ALGORITHM',
        },
      })
    })

    await prisma.$transaction(operations)
    console.log(`[OccupationResolver] Persisted ${operations.length} mappings in 1 transaction`)
  }
}
