// GET /api/descriptors/by-title?jobTitle=xxx — Obtener descriptor con targets reales

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    if (!hasPermission(userContext.role, 'descriptors:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const jobTitle = request.nextUrl.searchParams.get('jobTitle')
    if (!jobTitle) {
      return NextResponse.json({ success: false, error: 'jobTitle requerido' }, { status: 400 })
    }

    const descriptor = await prisma.jobDescriptor.findFirst({
      where: { accountId: userContext.accountId, jobTitle },
    })

    if (!descriptor) {
      return NextResponse.json({ success: false, error: 'Descriptor no encontrado' }, { status: 404 })
    }

    // Enrich competencies with real targets from CompetencyTarget
    const competencies = (descriptor.competencies as any[]) ?? []
    if (competencies.length > 0) {
      // Get standardJobLevel: from descriptor or from dominant employee
      let jobLevel = descriptor.standardJobLevel
      if (!jobLevel) {
        const levelResult = await prisma.employee.groupBy({
          by: ['standardJobLevel'],
          where: {
            accountId: userContext.accountId,
            position: jobTitle,
            isActive: true,
            standardJobLevel: { not: null },
          },
          _count: { standardJobLevel: true },
          orderBy: { _count: { standardJobLevel: 'desc' } },
          take: 1,
        })
        jobLevel = levelResult[0]?.standardJobLevel ?? null
      }

      if (jobLevel) {
        const targets = await prisma.competencyTarget.findMany({
          where: { accountId: userContext.accountId, standardJobLevel: jobLevel },
          select: { competencyCode: true, targetScore: true },
        })
        const targetMap = new Map<string, number>()
        for (const t of targets) {
          if (t.targetScore != null) targetMap.set(t.competencyCode, t.targetScore)
        }

        // Enrich each competency with its real target
        for (const c of competencies) {
          const target = targetMap.get(c.code)
          if (target != null) c.expectedLevel = target
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...descriptor, competencies },
    })
  } catch (error: any) {
    console.error('[descriptors/by-title] GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
