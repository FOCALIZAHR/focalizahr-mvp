// POST /api/descriptors/classify-all — Clasificación masiva con OccupationResolver v2
// Pipeline: Filtrar → Match mejorado → LLM batch → Persistir

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { OccupationResolver } from '@/lib/services/OccupationResolver'
import { prisma } from '@/lib/prisma'
import { normalizePositionText } from '@/lib/utils/normalizePosition'

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const accountId = userContext.accountId

    // 1. Obtener posiciones únicas con contexto
    const employees = await prisma.employee.findMany({
      where: { accountId, isActive: true, status: 'ACTIVE', position: { not: null } },
      select: {
        position: true,
        standardJobLevel: true,
        department: { select: { standardCategory: true } },
      },
    })

    // Deduplicar por position normalizado
    const positionMap = new Map<string, {
      positionText: string
      standardCategory: string | null
      standardJobLevel: string | null
    }>()

    for (const emp of employees) {
      if (!emp.position) continue
      // Normalización canónica — match contra occupation_mappings.position_text
      const key = normalizePositionText(emp.position)
      if (!positionMap.has(key)) {
        positionMap.set(key, {
          positionText: emp.position,
          standardCategory: emp.department?.standardCategory ?? null,
          standardJobLevel: emp.standardJobLevel ?? null,
        })
      }
    }

    // 2. Verificar cuáles ya tienen mapping (excluyendo los que vamos a re-clasificar).
    // CRÍTICO: la normalización debe coincidir con la canónica para NO sobrescribir
    // correcciones manuales de cargos con `_` o paréntesis en el texto original.
    const existingMappings = await prisma.occupationMapping.findMany({
      where: { accountId, source: 'MANUAL' }, // Solo preservar MANUAL
      select: { positionText: true },
    })
    const manualMapped = new Set(
      existingMappings.map(m => normalizePositionText(m.positionText))
    )

    // 3. Filtrar: clasificar todo lo que NO sea MANUAL
    const toClassify = Array.from(positionMap.values()).filter(
      p => !manualMapped.has(normalizePositionText(p.positionText))
    )

    if (toClassify.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: positionMap.size,
          stats: { total: 0, high: 0, medium: 0, low: 0, unclassified: 0 },
          message: 'Todos los cargos ya están clasificados manualmente.',
        },
      })
    }

    // 4. OccupationResolver v2 — pipeline de 4 pasos
    console.log(`[classify-all] Resolving ${toClassify.length} positions with OccupationResolver v2`)

    const { results, stats } = await OccupationResolver.resolveBatch(toClassify, accountId)

    console.log(`[classify-all] Results: HIGH=${stats.high} MEDIUM=${stats.medium} LOW=${stats.low} UNCLASSIFIED=${stats.unclassified}`)

    return NextResponse.json({
      success: true,
      data: {
        total: positionMap.size,
        stats,
        classified: stats.high + stats.medium,
        newlyClassified: stats.high + stats.medium + stats.low,
        unclassified: stats.unclassified,
        message: `${stats.high + stats.medium} cargos clasificados (${stats.high} HIGH, ${stats.medium} MEDIUM). ${stats.unclassified} requieren revisión manual.`,
      },
    })
  } catch (error: any) {
    console.error('[descriptors/classify-all] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
