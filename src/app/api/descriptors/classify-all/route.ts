// POST /api/descriptors/classify-all — Clasificación masiva de cargos
// Obtiene todos los Employee.position únicos, ejecuta OccupationMapper.classifyBatch,
// persiste OccupationMapping para cada uno.

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { OccupationMapper } from '@/lib/services/OccupationMapper'
import { prisma } from '@/lib/prisma'

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
      where: {
        accountId,
        isActive: true,
        status: 'ACTIVE',
        position: { not: null },
      },
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
      const key = emp.position.toLowerCase().trim()
      if (!positionMap.has(key)) {
        positionMap.set(key, {
          positionText: emp.position,
          standardCategory: emp.department?.standardCategory ?? null,
          standardJobLevel: emp.standardJobLevel ?? null,
        })
      }
    }

    // 2. Verificar cuáles ya tienen mapping
    const existingMappings = await prisma.occupationMapping.findMany({
      where: { accountId },
      select: { positionText: true },
    })
    const alreadyMapped = new Set(existingMappings.map(m => m.positionText.toLowerCase().trim()))

    // 3. Filtrar solo los que NO tienen mapping
    const toClassify = Array.from(positionMap.values()).filter(
      p => !alreadyMapped.has(p.positionText.toLowerCase().trim())
    )

    if (toClassify.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: positionMap.size,
          classified: positionMap.size - toClassify.length,
          newlyClassified: 0,
          unclassified: 0,
          message: 'Todos los cargos ya están clasificados.',
        },
      })
    }

    // 4. Clasificar en batch
    const results = await OccupationMapper.classifyBatch(
      toClassify.map(p => ({
        positionText: p.positionText,
        standardCategory: p.standardCategory,
        standardJobLevel: p.standardJobLevel,
      })),
      accountId
    )

    // 5. Persistir mappings
    let newlyClassified = 0
    let unclassified = 0

    for (let i = 0; i < results.length; i++) {
      const classification = results[i]
      const position = toClassify[i]

      await prisma.occupationMapping.upsert({
        where: {
          accountId_positionText: {
            accountId,
            positionText: position.positionText,
          },
        },
        update: {
          socCode: classification.socCode,
          confidence: classification.confidence as any,
          source: classification.source as any,
          contextCategory: position.standardCategory,
          contextJobLevel: position.standardJobLevel,
          mappedAt: new Date(),
        },
        create: {
          accountId,
          positionText: position.positionText,
          socCode: classification.socCode,
          confidence: classification.confidence as any,
          source: classification.source as any,
          contextCategory: position.standardCategory,
          contextJobLevel: position.standardJobLevel,
        },
      })

      if (classification.confidence !== 'UNCLASSIFIED') {
        newlyClassified++
      } else {
        unclassified++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: positionMap.size,
        classified: positionMap.size - unclassified,
        newlyClassified,
        unclassified,
        message: `${newlyClassified} cargos clasificados. ${unclassified} requieren revisión manual.`,
      },
    })
  } catch (error: any) {
    console.error('[descriptors/classify-all] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
