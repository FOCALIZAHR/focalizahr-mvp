// PUT /api/workforce/occupation/correct — Corrección manual de clasificación
// Body: { positionText, socCode }
// Upsert OccupationMapping con source='MANUAL', confidence='HIGH'

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { SOC_TITLES_ES } from '@/config/OnetOccupationConfig'

export async function PUT(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { positionText, socCode } = body

    if (!positionText || !socCode) {
      return NextResponse.json(
        { success: false, error: 'positionText y socCode son requeridos' },
        { status: 400 }
      )
    }

    // Normalizar positionText para evitar duplicados por case/acentos
    const normalizedPosition = positionText
      .toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[_]+/g, ' ')
      .replace(/[^a-z0-9\s\-\/&.]/g, '')
      .replace(/\s+/g, ' ').trim()

    // Validar que el SOC code existe
    const occupation = await prisma.onetOccupation.findUnique({
      where: { socCode },
      select: { socCode: true, titleEs: true, titleEn: true },
    })

    if (!occupation) {
      return NextResponse.json(
        { success: false, error: `SOC code ${socCode} no encontrado` },
        { status: 404 }
      )
    }

    // Upsert mapping
    const userEmail = request.headers.get('x-user-email')
    const mapping = await prisma.occupationMapping.upsert({
      where: {
        accountId_positionText: {
          accountId: userContext.accountId,
          positionText: normalizedPosition,
        },
      },
      update: {
        socCode,
        confidence: 'HIGH',
        source: 'MANUAL',
        correctedBy: userEmail ?? null,
        mappedAt: new Date(),
      },
      create: {
        accountId: userContext.accountId,
        positionText: normalizedPosition,
        socCode,
        confidence: 'HIGH',
        source: 'MANUAL',
        correctedBy: userEmail ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: mapping.id,
        positionText,
        socCode,
        occupationTitle: SOC_TITLES_ES[socCode] ?? occupation.titleEs ?? occupation.titleEn,
        confidence: 'HIGH',
        source: 'MANUAL',
      },
    })
  } catch (error: any) {
    console.error('[workforce/occupation/correct] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
