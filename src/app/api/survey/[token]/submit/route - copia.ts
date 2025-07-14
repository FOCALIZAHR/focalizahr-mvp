// src/app/api/survey/[token]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SurveyResponse {
  questionId: string
  rating?: number
  textResponse?: string
  choiceResponse?: string[]
  matrixResponses?: { [key: string]: number }
}

// POST /api/survey/[token]/submit - Enviar respuestas del survey
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { responses }: { responses: SurveyResponse[] } = body

    console.log('📝 Processing survey submission for token:', token)
    console.log('📊 Responses received:', responses.length)

    // Validar que hay respuestas
    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron respuestas' },
        { status: 400 }
      )
    }

    // Buscar participante
    const participant = await prisma.participant.findFirst({
      where: {
        uniqueToken: token
      },
      include: {
        campaign: {
          include: {
            campaignType: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Token de encuesta no válido' },
        { status: 404 }
      )
    }

    // Verificar que no haya respondido ya
    if (participant.hasResponded === true) {
      return NextResponse.json(
        { error: 'Ya has completado esta encuesta' },
        { status: 400 }
      )
    }

    // Verificar que la campaña esté activa
    if (participant.campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'Esta encuesta no está disponible actualmente' },
        { status: 400 }
      )
    }

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Crear respuestas en la base de datos
      const createdResponses = []

      for (const response of responses) {
        // Validar que la pregunta existe
        const question = participant.campaign.campaignType.questions.find(
          q => q.id === response.questionId
        )

        if (!question) {
          throw new Error(`Pregunta no encontrada: ${response.questionId}`)
        }

        // Crear respuesta según el tipo
        let responseData: any = {
          participantId: participant.id,
          questionId: response.questionId,
          // No agregamos createdAt - Prisma lo maneja automáticamente
        }

        // Agregar datos específicos según tipo de respuesta
        if (response.rating !== undefined) {
          responseData.rating = response.rating
        }

        if (response.textResponse) {
          responseData.textResponse = response.textResponse
        }

        if (response.choiceResponse && response.choiceResponse.length > 0) {
          responseData.choiceResponse = JSON.stringify(response.choiceResponse)
        }

        if (response.matrixResponses && Object.keys(response.matrixResponses).length > 0) {
          // Para matrix responses, guardamos como JSON string
          responseData.textResponse = JSON.stringify(response.matrixResponses)
        }

        const createdResponse = await tx.response.create({
          data: responseData
        })

        createdResponses.push(createdResponse)
      }

      // Actualizar estado del participante
      const updatedParticipant = await tx.participant.update({
        where: { id: participant.id },
        data: {
          hasResponded: true,
          responseDate: new Date()
        }
      })

      // Actualizar contadores de la campaña
      await tx.campaign.update({
        where: { id: participant.campaign.id },
        data: {
          totalResponded: {
            increment: 1
          }
        }
      })

      return {
        participant: updatedParticipant,
        responses: createdResponses
      }
    })

    // Log de éxito
    console.log('✅ Survey submitted successfully')
    console.log(`   - Participant: ${participant.email}`)
    console.log(`   - Campaign: ${participant.campaign.name}`)
    console.log(`   - Responses saved: ${result.responses.length}`)

    // TODO: Aquí se puede agregar la lógica de generación de insights
    // if (participant.campaign.campaignType.slug === 'retencion-predictiva') {
    //   await generateRetentionInsights(participant.campaign.id, result.responses)
    // }

    return NextResponse.json({
      success: true,
      message: '¡Encuesta completada exitosamente!',
      participantId: participant.id,
      responsesCount: result.responses.length
    })

  } catch (error) {
    console.error('❌ Error submitting survey:', error)
    
    // Rollback automático por la transacción
    return NextResponse.json(
      { 
        error: 'Error al procesar las respuestas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}