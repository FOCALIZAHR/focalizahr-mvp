// src/app/api/goals/employee-score/route.ts
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
    const employeeId = searchParams.get('employeeId')
    const asOfDate = searchParams.get('asOfDate')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId es requerido', success: false },
        { status: 400 }
      )
    }

    const date = asOfDate ? new Date(asOfDate) : new Date()

    const result = await GoalsService.getEmployeeGoalsScore(employeeId, date)

    return NextResponse.json({
      data: result,
      employeeId,
      asOfDate: date.toISOString(),
      success: true,
    })

  } catch (error) {
    console.error('[API Employee Goals Score]:', error)
    return NextResponse.json(
      { error: 'Error calculando score de metas', success: false },
      { status: 500 }
    )
  }
}
