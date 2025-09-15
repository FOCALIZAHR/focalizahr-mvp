// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateJWT, validateAuthToken } from '@/lib/auth'
import { z } from 'zod'

// Schema de validación ampliado con todos los campos
const registerSchema = z.object({
  // Campos obligatorios
  companyName: z.string().min(2, 'Nombre de empresa muy corto'),
  adminEmail: z.string().email('Email inválido'),
  adminName: z.string().min(2, 'Nombre muy corto'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  
  // Campos opcionales nuevos
  subscriptionTier: z.enum(['free', 'basic', 'professional', 'enterprise']).optional().default('basic'),
  industry: z.string().optional(),
  companySize: z.enum(['micro', 'pequeña', 'mediana', 'grande']).optional(),
  companyLogo: z.string().url('URL de logo inválida').optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar que quien hace la petición es un ADMIN
    const authHeader = request.headers.get('authorization')
    const validation = await validateAuthToken(authHeader, request)
    
    if (!validation.success || validation.account?.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden crear cuentas.' },
        { status: 403 }
      )
    }

    // Parsear y validar el body
    const body = await request.json()
    console.log('📝 Registro attempt for:', body.adminEmail)

    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verificar si el email ya existe
    const existingAccount = await prisma.account.findUnique({
      where: { adminEmail: data.adminEmail }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Email ya está registrado' },
        { status: 409 }
      )
    }

    // Hashear la contraseña
    const passwordHash = await hashPassword(data.password)

    // Crear la cuenta con TODOS los campos
    const newAccount = await prisma.account.create({
      data: {
        // Campos básicos
        companyName: data.companyName,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        passwordHash,
        
        // IMPORTANTE: Asignar rol CLIENT explícitamente
        role: 'CLIENT',
        
        // Campos adicionales
        subscriptionTier: data.subscriptionTier || 'basic',
        industry: data.industry || undefined,
        companySize: data.companySize || undefined,
        companyLogo: data.companyLogo || undefined,
        
        // Los campos de configuración usarán los defaults del schema
        // maxActiveCampaigns, maxParticipantsPerCampaign, maxCampaignDurationDays
      }
    })

    console.log('✅ Account created successfully:', newAccount.adminEmail)

    // Generar JWT para la nueva cuenta (opcional, pero útil)
    const token = generateJWT({
      id: newAccount.id,
      adminEmail: newAccount.adminEmail,
      adminName: newAccount.adminName,
      companyName: newAccount.companyName,
      subscriptionTier: newAccount.subscriptionTier,
      role: newAccount.role
    })

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      account: {
        id: newAccount.id,
        adminEmail: newAccount.adminEmail,
        adminName: newAccount.adminName,
        companyName: newAccount.companyName,
        subscriptionTier: newAccount.subscriptionTier,
        role: newAccount.role,
        industry: newAccount.industry,
        companySize: newAccount.companySize
      },
      token // Opcional: incluir token si quieres auto-login
    })

  } catch (error) {
    console.error('❌ Register error:', error)
    
    // Manejo específico de errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 409 }
        )
      }
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