// src/app/api/goals/orphans/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoalsService } from '@/lib/services/GoalsService'
import { extractUserContext } from '@/lib/services/AuthorizationService'

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const orphans = await GoalsService.detectOrphans(context.accountId)

    return NextResponse.json({
      data: orphans,
      count: orphans.length,
      success: true,
    })

  } catch (error) {
    console.error('[API Goals Orphans]:', error)
    return NextResponse.json(
      { error: 'Error detectando metas huérfanas', success: false },
      { status: 500 }
    )
  }
}
