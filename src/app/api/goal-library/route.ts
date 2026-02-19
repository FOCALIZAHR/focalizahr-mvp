// src/app/api/goal-library/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

const createTemplateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string(),
  metricType: z.enum(['PERCENTAGE', 'CURRENCY', 'NUMBER', 'BINARY']).default('PERCENTAGE'),
  suggestedTarget: z.number().optional(),
  unit: z.string().optional(),
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar templates
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: any = {
      accountId: context.accountId,
      isActive: true,
    }

    if (category) where.category = category

    const templates = await prisma.goalLibrary.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { title: 'asc' },
      ],
    })

    const categories = await prisma.goalLibrary.findMany({
      where: { accountId: context.accountId, isActive: true },
      select: { category: true },
      distinct: ['category'],
    })

    return NextResponse.json({
      data: templates,
      categories: categories.map(c => c.category),
      success: true,
    })

  } catch (error) {
    console.error('[API Goal Library GET]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo templates', success: false },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Crear template
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const template = await prisma.goalLibrary.create({
      data: {
        accountId: context.accountId,
        ...validation.data,
      },
    })

    return NextResponse.json({
      data: template,
      success: true,
    }, { status: 201 })

  } catch (error) {
    console.error('[API Goal Library POST]:', error)
    return NextResponse.json(
      { error: 'Error creando template', success: false },
      { status: 500 }
    )
  }
}
