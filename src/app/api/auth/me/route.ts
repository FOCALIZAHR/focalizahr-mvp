export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { validateAuthToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    const validation = await validateAuthToken(authHeader)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      )
    }

    // Detectar si tiene subordinados directos
    let hasDirectReports = false
    const email = validation.account?.adminEmail
    const accountId = validation.account?.id

    if (email && accountId) {
      const currentEmployee = await prisma.employee.findFirst({
        where: { accountId, email, status: 'ACTIVE' },
        select: { id: true }
      })

      if (currentEmployee) {
        const directReportsCount = await prisma.employee.count({
          where: { managerId: currentEmployee.id, accountId, status: 'ACTIVE' }
        })
        hasDirectReports = directReportsCount > 0
      }
    }

    return NextResponse.json({
      success: true,
      account: validation.account,
      hasDirectReports,
    })

  } catch (error) {
    console.error('Error en /auth/me:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}