// src/app/api/campaign-types/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/campaign-types - Listar tipos de campaña disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeQuestions = searchParams.get('includeQuestions') === 'true'

    const campaignTypes = await prisma.campaignType.findMany({
      where: {
        isActive: true
      },
      include: {
        questions: includeQuestions ? {
          where: { isActive: true },
          orderBy: { questionOrder: 'asc' },
          select: {
            id: true,
            text: true,
            category: true,
            subcategory: true,
            questionOrder: true,
            responseType: true,
            isRequired: true,
            minValue: true,
            maxValue: true
          }
        } : false,
        _count: {
          select: {
            questions: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Agregar información adicional
    const typesWithMetadata = campaignTypes.map(type => ({
      ...type,
      questionCount: type._count.questions,
      estimatedCompletionTime: `${type.estimatedDuration} minutos`,
      categories: includeQuestions 
        ? Array.from(new Set(type.questions?.map(q => q.category) || []))
        : null
    }))

    return NextResponse.json({
      campaignTypes: typesWithMetadata,
      total: campaignTypes.length
    })

  } catch (error) {
    console.error('Error fetching campaign types:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
