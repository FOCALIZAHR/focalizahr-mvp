// src/app/api/goals/alignment-tree/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoalsService } from '@/lib/services/GoalsService'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodYear = parseInt(searchParams.get('periodYear') || new Date().getFullYear().toString())

    const tree = await GoalsService.getAlignmentTree(context.accountId, periodYear)

    return NextResponse.json({
      data: tree,
      periodYear,
      success: true,
    })

  } catch (error) {
    console.error('[API Alignment Tree]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo árbol de alineación', success: false },
      { status: 500 }
    )
  }
}
