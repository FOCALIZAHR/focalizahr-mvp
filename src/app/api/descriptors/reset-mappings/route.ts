// POST /api/descriptors/reset-mappings — Borra mappings no-MANUAL y re-clasifica
// Solo HR_ADMIN / HR_MANAGER. Preserva correcciones manuales.

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
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

    // Borrar todos los mappings que NO son MANUAL
    const deleted = await prisma.occupationMapping.deleteMany({
      where: {
        accountId: userContext.accountId,
        source: { not: 'MANUAL' },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        deleted: deleted.count,
        message: `${deleted.count} mappings automáticos eliminados. Los manuales se preservaron. Ejecuta "Clasificar automáticamente" para re-mapear.`,
      },
    })
  } catch (error: any) {
    console.error('[descriptors/reset-mappings] POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
