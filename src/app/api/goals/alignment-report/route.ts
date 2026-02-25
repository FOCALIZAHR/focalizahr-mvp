// src/app/api/goals/alignment-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoalsService } from '@/lib/services/GoalsService'
import {
  extractUserContext,
  hasPermission,
  GLOBAL_ACCESS_ROLES
} from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ═══ CHECK 2: hasPermission ═══
    if (!hasPermission(context.role, 'goals:view')) {
      return NextResponse.json(
        { error: 'Sin permisos para ver reporte de alineación', success: false },
        { status: 403 }
      )
    }

    // Solo roles estratégicos ven el reporte completo
    if (!GLOBAL_ACCESS_ROLES.includes(context.role as any)) {
      return NextResponse.json(
        { error: 'Sin permisos para ver análisis estratégico', success: false },
        { status: 403 }
      )
    }

    const report = await GoalsService.getAlignmentReport(context.accountId)

    return NextResponse.json({
      data: report,
      success: true,
    })

  } catch (error) {
    console.error('[API Alignment Report]:', error)
    return NextResponse.json(
      { error: 'Error generando reporte de alineación', success: false },
      { status: 500 }
    )
  }
}
