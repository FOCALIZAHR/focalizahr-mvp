// src/app/api/config/goal-rules/[id]/execute/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoalRulesEngine } from '@/lib/services/GoalRulesEngine'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const executedBy = context.userId || context.accountId

    const result = await GoalRulesEngine.applyCascadeRule(id, context.accountId, executedBy)

    return NextResponse.json({ data: result, success: true })
  } catch (error) {
    console.error('[API goal-rules execute]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error ejecutando regla', success: false },
      { status: 500 }
    )
  }
}
