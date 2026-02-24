// src/app/api/config/goal-rules/[id]/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoalRulesEngine } from '@/lib/services/GoalRulesEngine'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const preview = await GoalRulesEngine.previewRuleImpact(id, context.accountId)

    return NextResponse.json({ data: preview, success: true })
  } catch (error) {
    console.error('[API goal-rules preview]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error obteniendo preview', success: false },
      { status: 500 }
    )
  }
}
