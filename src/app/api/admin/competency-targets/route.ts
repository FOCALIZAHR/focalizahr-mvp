// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/competency-targets
// GET  - Obtener matriz de targets por cuenta
// PUT  - Actualizar target individual
// POST - Ratificar targets o seed defaults
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { RoleFitAnalyzer } from '@/lib/services/RoleFitAnalyzer'

const STANDARD_JOB_LEVELS = [
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar'
]

const JOB_LEVEL_LABELS: Record<string, string> = {
  'gerente_director': 'Gerente / Director',
  'subgerente_subdirector': 'Subgerente / Subdirector',
  'jefe': 'Jefe',
  'supervisor_coordinador': 'Supervisor / Coordinador',
  'profesional_analista': 'Profesional / Analista',
  'asistente_otros': 'Asistente / Otros',
  'operativo_auxiliar': 'Operativo / Auxiliar'
}

// GET - Obtener matriz de targets
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todos los targets del account
    const targets = await prisma.competencyTarget.findMany({
      where: { accountId: userContext.accountId },
      orderBy: [
        { competencyCode: 'asc' },
        { standardJobLevel: 'asc' }
      ]
    })

    // Verificar si están ratificados
    const isRatified = await RoleFitAnalyzer.hasRatifiedTargets(userContext.accountId)

    // Obtener competencias activas para nombres
    const competencies = await prisma.competency.findMany({
      where: { accountId: userContext.accountId, isActive: true },
      select: { code: true, name: true, category: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    })

    return NextResponse.json({
      success: true,
      data: {
        targets,
        competencies,
        standardJobLevels: STANDARD_JOB_LEVELS.map(level => ({
          level,
          label: JOB_LEVEL_LABELS[level] || level
        })),
        isRatified,
        ratificationRequired: !isRatified
      }
    })

  } catch (error) {
    console.error('[CompetencyTargets GET]:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar target individual
export async function PUT(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { competencyCode, standardJobLevel, targetScore } = body

    if (!competencyCode || !standardJobLevel) {
      return NextResponse.json({ error: 'competencyCode y standardJobLevel requeridos' }, { status: 400 })
    }

    if (!STANDARD_JOB_LEVELS.includes(standardJobLevel)) {
      return NextResponse.json({ error: 'standardJobLevel inválido' }, { status: 400 })
    }

    const parsedScore = targetScore === '' || targetScore === null || targetScore === undefined
      ? null
      : parseFloat(targetScore)

    if (parsedScore !== null && (parsedScore < 1 || parsedScore > 5)) {
      return NextResponse.json({ error: 'targetScore debe estar entre 1 y 5' }, { status: 400 })
    }

    const updated = await prisma.competencyTarget.upsert({
      where: {
        accountId_competencyCode_standardJobLevel: {
          accountId: userContext.accountId,
          competencyCode,
          standardJobLevel
        }
      },
      update: {
        targetScore: parsedScore,
        isDefault: false
      },
      create: {
        accountId: userContext.accountId,
        competencyCode,
        standardJobLevel,
        targetScore: parsedScore,
        isDefault: false
      }
    })

    return NextResponse.json({ success: true, data: updated })

  } catch (error) {
    console.error('[CompetencyTargets PUT]:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Ratificar targets o seed defaults
export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    if (body.action === 'ratify') {
      const userId = userContext.userId || request.headers.get('x-user-email') || 'unknown'
      await RoleFitAnalyzer.ratifyTargets(userContext.accountId, userId)
      return NextResponse.json({ success: true, message: 'Targets ratificados' })
    }

    if (body.action === 'seed_defaults') {
      const { seedCompetencyTargets } = await import('@/lib/data/competency-target-defaults')
      await seedCompetencyTargets(userContext.accountId)
      return NextResponse.json({ success: true, message: 'Defaults creados' })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (error) {
    console.error('[CompetencyTargets POST]:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
