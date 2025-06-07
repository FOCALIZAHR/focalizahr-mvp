// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateJWT } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Password requerido')
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt started')
    
    // Parse and validate request body
    const body = await request.json()
    console.log('📥 Request body parsed:', { email: body.email, hasPassword: !!body.password })
    
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data
    console.log('✅ Validation passed for email:', email)

    // Find user account
    console.log('🔍 Searching for account...')
    const account = await prisma.account.findUnique({
      where: { adminEmail: email },
      select: {
        id: true,
        adminEmail: true,
        adminName: true,
        companyName: true,
        passwordHash: true,
        subscriptionTier: true
      }
    })

    if (!account) {
      console.log('❌ Account not found for email:', email)
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    console.log('✅ Account found:', { 
      id: account.id, 
      email: account.adminEmail,
      name: account.adminName,
      hasPasswordHash: !!account.passwordHash
    })

    // Verify password
    console.log('🔐 Verifying password...')
    try {
      const isValidPassword = await verifyPassword(password, account.passwordHash)
      console.log('🔐 Password verification result:', isValidPassword)
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for email:', email)
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }
    } catch (passwordError) {
      console.error('❌ Password verification error:', passwordError)
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 500 }
      )
    }

    console.log('✅ Password verified successfully')

    // Generate JWT token
    console.log('🎫 Generating JWT token...')
    try {
      const jwtPayload = {
        id: account.id,
        adminEmail: account.adminEmail,
        adminName: account.adminName,
        companyName: account.companyName,
        subscriptionTier: account.subscriptionTier
      }
      
      const token = generateJWT(jwtPayload)
      console.log('✅ JWT token generated successfully')

      // Log successful login (without sensitive data)
      console.log('🎉 Login successful for:', {
        accountId: account.id,
        email: account.adminEmail,
        company: account.companyName
      })

      return NextResponse.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: account.id,
          email: account.adminEmail,
          name: account.adminName,
          company: account.companyName,
          subscriptionTier: account.subscriptionTier
        }
      })

    } catch (jwtError) {
      console.error('❌ JWT generation error:', jwtError)
      return NextResponse.json(
        { error: 'Error generando token de autenticación' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Login error:', error)
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        debug: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// Test endpoint for debugging
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }
  
  try {
    // Test database connection
    const accountCount = await prisma.account.count()
    
    // Test demo account exists
    const demoAccount = await prisma.account.findUnique({
      where: { adminEmail: 'test@focalizahr.cl' },
      select: {
        id: true,
        adminEmail: true,
        adminName: true,
        companyName: true,
        passwordHash: true
      }
    })
    
    return NextResponse.json({
      status: 'debug',
      database: 'connected',
      totalAccounts: accountCount,
      demoAccountExists: !!demoAccount,
      demoAccountDetails: demoAccount ? {
        id: demoAccount.id,
        email: demoAccount.adminEmail,
        name: demoAccount.adminName,
        company: demoAccount.companyName,
        hasPasswordHash: !!demoAccount.passwordHash,
        passwordHashLength: demoAccount.passwordHash?.length
      } : null
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
     error: error instanceof Error ? error.message : 'Error desconocido'  // ← FIX MÍNIMO
    }, { status: 500 })
  }
}