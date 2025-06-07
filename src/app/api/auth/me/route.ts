import { NextRequest, NextResponse } from 'next/server'
import { validateAuthToken } from '@/lib/auth'

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

    return NextResponse.json({
      success: true,
      account: validation.account
    })

  } catch (error) {
    console.error('Error en /auth/me:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}