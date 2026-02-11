// src/app/api/evaluator/cycles/route.ts
// Lista de ciclos donde el usuario es evaluador (para select de historial)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const userEmail = request.headers.get('x-user-email')
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Email no disponible' }, { status: 400 })
    }

    const employee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
      select: { id: true }
    })

    if (!employee) {
      return NextResponse.json({ success: true, cycles: [] })
    }

    // Ciclos donde este employee tiene assignments (ACTIVE, COMPLETED, IN_REVIEW)
    const cycles = await prisma.performanceCycle.findMany({
      where: {
        accountId: userContext.accountId,
        status: { in: ['ACTIVE', 'COMPLETED', 'IN_REVIEW'] },
        assignments: { some: { evaluatorId: employee.id } }
      },
      select: {
        id: true,
        name: true,
        status: true,
        endDate: true
      },
      orderBy: { endDate: 'desc' },
      take: 20
    })

    return NextResponse.json({ success: true, cycles })
  } catch (error: any) {
    console.error('[API] Error evaluator cycles:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
