import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations'
import { registerAccount } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { companyName, adminEmail, adminName, password } = validation.data

    // Registrar cuenta
    const result = await registerAccount({
      companyName,
      adminEmail,
      adminName,
      password
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      token: result.token,
      account: result.account
    })

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}