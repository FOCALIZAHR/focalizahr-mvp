// src/app/api/survey/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/survey/[token] - Obtener datos del survey para participante
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    
    console.log('🔍 Loading survey data for token:', token)

    // Buscar participante por token con todos los datos necesarios
    const participant = await prisma.participant.findFirst({
      where: {
        uniqueToken: token
      },
      include: {
        campaign: {
          include: {
            campaignType: {
              include: {
                questions: {
                  where: { isActive: true },
                  orderBy: { questionOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!participant) {
      console.log('❌ Participant not found for token:', token)
      return NextResponse.json(
        { error: 'Token de encuesta no válido o expirado' },
        { status: 404 }
      )
    }

    // Verificar que la campaña esté activa
    if (participant.campaign.status !== 'active') {
      console.log('❌ Campaign not active:', participant.campaign.status)
      return NextResponse.json(
        { error: 'Esta encuesta no está disponible actualmente' },
        { status: 400 }
      )
    }

    // Verificar fechas de la campaña
    const now = new Date()
    const startDate = new Date(participant.campaign.startDate)
    const endDate = new Date(participant.campaign.endDate)

    if (now < startDate) {
      return NextResponse.json(
        { error: 'Esta encuesta aún no está disponible' },
        { status: 400 }
      )
    }

    // Fix temporal: Agregar margen de 24 horas para testing
   const endDateWithMargin = new Date(participant.campaign.endDate)
   endDateWithMargin.setDate(endDateWithMargin.getDate() + 3) // +24 horas

   if (now > endDateWithMargin) {
    return NextResponse.json(
     { error: 'Esta encuesta ha expirado' },
     { status: 400 }
   )
}

    // Formatear preguntas según la interfaz esperada
    const questions = participant.campaign.campaignType.questions.map(q => ({
      id: q.id,
      text: q.text,
      category: q.category,
      questionOrder: q.questionOrder,
      responseType: q.responseType,
      choiceOptions: q.choiceOptions || null,
      conditionalLogic: q.conditionalLogic || null
    }))

    // Preparar datos de respuesta
    const surveyData = {
      participant: {
        id: participant.id,
        email: participant.email,
        invitedAt: participant.createdAt,                                    // ✅ FIX: invitedAt → createdAt
        reminderSentAt: participant.lastReminderSent,                      // ✅ FIX: reminderSentAt → lastReminderSent
        respondedAt: participant.responseDate,                             // ✅ FIX: respondedAt → responseDate
        status: participant.hasResponded ? 'completed' : 'pending',       // ✅ FIX: status → derivar de hasResponded
        campaign: {
          id: participant.campaign.id,
          name: participant.campaign.name,
          description: participant.campaign.description,
          status: participant.campaign.status,
          startDate: participant.campaign.startDate,
          endDate: participant.campaign.endDate,
          campaignType: {
            id: participant.campaign.campaignType.id,
            name: participant.campaign.campaignType.name,
            slug: participant.campaign.campaignType.slug,
            description: participant.campaign.campaignType.description,
            questionCount: participant.campaign.campaignType.questionCount,
            estimatedDuration: participant.campaign.campaignType.estimatedDuration,
            methodology: participant.campaign.campaignType.methodology,
            category: participant.campaign.campaignType.category
          }
        }
      },
      questions
    }

    console.log('✅ Survey data loaded successfully')
    console.log(`   - Campaign: ${participant.campaign.name}`)
    console.log(`   - Type: ${participant.campaign.campaignType.name}`)
    console.log(`   - Questions: ${questions.length}`)
    console.log(`   - Participant status: ${participant.hasResponded ? 'completed' : 'pending'}`)  // ✅ FIX: también aquí

    return NextResponse.json(surveyData)

  } catch (error) {
    console.error('❌ Error loading survey data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}