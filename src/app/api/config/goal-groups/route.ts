// src/app/api/config/goal-groups/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

const createGroupSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  code: z.string().min(2, 'Código debe tener al menos 2 caracteres'),
  weightBusiness: z.number().min(0).max(100).default(0),
  weightLeader: z.number().min(0).max(100).default(0),
  weightNPS: z.number().min(0).max(100).default(0),
  weightSpecific: z.number().min(0).max(100).default(0),
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar grupos de ponderación
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const groups = await prisma.goalGroup.findMany({
      where: { accountId: context.accountId, isActive: true },
      include: {
        _count: { select: { jobConfigs: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: groups, success: true })
  } catch (error) {
    console.error('[API goal-groups GET]:', error)
    return NextResponse.json({ error: 'Error obteniendo grupos', success: false }, { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Crear grupo de ponderación
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }

    const body = await request.json()
    const validation = createGroupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const { name, code, weightBusiness, weightLeader, weightNPS, weightSpecific } = validation.data

    // Validar que sumen 100
    const total = weightBusiness + weightLeader + weightNPS + weightSpecific
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json(
        { error: `Los pesos deben sumar 100%. Actual: ${total}%`, success: false },
        { status: 400 }
      )
    }

    // Verificar código único
    const existing = await prisma.goalGroup.findUnique({
      where: { accountId_code: { accountId: context.accountId, code: code.toUpperCase() } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un grupo con ese código', success: false },
        { status: 400 }
      )
    }

    const group = await prisma.goalGroup.create({
      data: {
        accountId: context.accountId,
        name,
        code: code.toUpperCase(),
        weightBusiness,
        weightLeader,
        weightNPS,
        weightSpecific,
      },
    })

    return NextResponse.json({ data: group, success: true }, { status: 201 })
  } catch (error) {
    console.error('[API goal-groups POST]:', error)
    return NextResponse.json({ error: 'Error creando grupo', success: false }, { status: 500 })
  }
}
