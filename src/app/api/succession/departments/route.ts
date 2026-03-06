// ════════════════════════════════════════════════════════════════════════════
// API: /api/succession/departments
// GET - Departments for succession wizard (hierarchy-aware)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    if (!hasPermission(userContext.role, 'succession:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }

    const departments = await prisma.department.findMany({
      where: { accountId: userContext.accountId, isActive: true },
      select: {
        id: true,
        displayName: true,
        parentId: true,
        level: true,
      },
      orderBy: [{ level: 'asc' }, { displayName: 'asc' }],
    })

    return NextResponse.json({ success: true, data: departments })
  } catch (error: any) {
    console.error('[Succession Departments] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
