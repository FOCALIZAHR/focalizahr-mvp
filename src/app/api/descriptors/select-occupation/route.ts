// POST /api/descriptors/select-occupation — HR elige candidato manualmente
// Carga tareas del SOC elegido + persiste mapping con source: MANUAL

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { JobDescriptorService } from '@/lib/services/JobDescriptorService'
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

    const body = await request.json()
    const { jobTitle, socCode } = body

    if (!jobTitle || !socCode) {
      return NextResponse.json({ success: false, error: 'jobTitle y socCode requeridos' }, { status: 400 })
    }

    // 1. Load tasks for the selected SOC code
    const result = await JobDescriptorService.loadTasksForSocCode(socCode)

    // 2. Persist mapping as MANUAL selection — normalización canónica compartida
    const normalizedPosition = normalizePositionText(jobTitle)

    await prisma.occupationMapping.upsert({
      where: {
        accountId_positionText: {
          accountId: userContext.accountId,
          positionText: normalizedPosition,
        },
      },
      update: {
        socCode,
        confidence: 'MEDIUM',
        source: 'MANUAL',
        mappedAt: new Date(),
      },
      create: {
        accountId: userContext.accountId,
        positionText: normalizedPosition,
        socCode,
        confidence: 'MEDIUM',
        source: 'MANUAL',
      },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('[descriptors/select-occupation] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
