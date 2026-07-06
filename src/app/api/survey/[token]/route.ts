// src/app/api/survey/[token]/route.ts
// REFACTORIZADO: Eliminar "Consulta Voraz" - Solo datos esenciales

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CompetencyFilterService } from '@/lib/services/CompetencyFilterService'
import { filterQuestionsByDriverFocus } from '@/lib/utils/climaFocusFilter'

// GET /api/survey/[token] - OPTIMIZADO: Solo datos esenciales, NO todas las preguntas
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const startTime = Date.now()
  
  try {
    const { token } = params
    
    console.log('🔍 Loading survey data for token:', token)

    // CONSULTA PRECISA: Solo datos esenciales, SIN las 35 preguntas
    const participant = await prisma.participant.findFirst({
      where: { uniqueToken: token },
      select: {
        id: true,
        email: true,
        hasResponded: true,
        createdAt: true,
        lastReminderSent: true,
        responseDate: true,
        evaluationAssignmentId: true,
        departmentId: true, // EX Clima Gate 1: filtro de seguimiento focalizado
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            driverFocusByDepartment: true, // EX Clima Gate 1: seguimiento Experiencia Full
            account: {  // ✅ CAMBIO 1: AGREGADO - Relación con account para obtener companyName
              select: {
                id: true,
                companyName: true,
                companyLogo: true,  // ← AGREGAR ESTA LÍNEA
                adminEmail: true
              }
            },
            campaignType: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                questionCount: true,
                estimatedDuration: true,
                methodology: true,
                category: true,
                // ✅ AGREGAR DESPUÉS DE "category: true":
                isPermanent: true,
                flowType: true  // ← AGREGAR ESTA LÍNEA
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

    // Validaciones rápidas (sin consultas adicionales)
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

    // 🔧 TESTING_MODE: Bypass reglas fechas
    if (process.env.TESTING_MODE === 'true') {
      console.log('🧪 TESTING_MODE: Bypassing date validation');
    } else {
      if (now < startDate) {
        return NextResponse.json(
          { error: 'Esta encuesta aún no está disponible' },
          { status: 400 }
        )
      }
    }

    // Margen temporal para testing (manteniendo el fix existente)
    const endDateWithMargin = new Date(participant.campaign.endDate)
    endDateWithMargin.setDate(endDateWithMargin.getDate() + 3)

    if (now > endDateWithMargin) {
      return NextResponse.json(
        { error: 'Esta encuesta ha expirado' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════
    // EVALUATION CONTEXT (solo para employee-based/performance)
    // ═══════════════════════════════════════════════════════════════
    let evaluationContext = null

    if (participant.evaluationAssignmentId) {
      const assignment = await prisma.evaluationAssignment.findUnique({
        where: { id: participant.evaluationAssignmentId },
        select: {
          evaluateeName: true,
          evaluateePosition: true,
          evaluateeDepartment: true,
          evaluationType: true,
          evaluateePerformanceTrack: true
        }
      })

      if (assignment) {
        evaluationContext = {
          evaluateeName: assignment.evaluateeName,
          evaluateePosition: assignment.evaluateePosition,
          evaluateeDepartment: assignment.evaluateeDepartment,
          evaluationType: assignment.evaluationType,
          evaluateeTrack: assignment.evaluateePerformanceTrack
        }
      }
    }

    // OPTIMIZACIÓN CRÍTICA: Cargar solo las preguntas cuando se necesiten
    // En lugar de cargar todas las 35 preguntas, las cargaremos por demanda
    const questions = await prisma.question.findMany({
      where: { 
        campaignTypeId: participant.campaign.campaignType.id,
        isActive: true 
      },
      select: {
        id: true,
        text: true,
        category: true,
        questionOrder: true,
        responseType: true,
        choiceOptions: true,
        conditionalLogic: true,
        scaleLabels: true,
        minLabel: true,
        maxLabel: true,
        minValue: true,
        maxValue: true,
        competencyCode: true,
        audienceRule: true
      },
      orderBy: { questionOrder: 'asc' }
    })

    // Resolve competency names for questions that have competencyCode
    const competencyCodes = questions
      .map(q => q.competencyCode)
      .filter((c): c is string => c != null)

    let competencyMap: Record<string, string> = {}
    if (competencyCodes.length > 0) {
      const competencies = await prisma.competency.findMany({
        where: { code: { in: competencyCodes } },
        select: { code: true, name: true }
      })
      competencyMap = Object.fromEntries(competencies.map(c => [c.code, c.name]))
    }

    // ═══════════════════════════════════════════════════════════════
    // FILTRADO POR PERFORMANCE TRACK (employee-based flow)
    // Solo aplica cuando hay evaluationContext con track definido
    // COLABORADOR: 10 preguntas | MANAGER: 16 | EJECUTIVO: 20
    // ═══════════════════════════════════════════════════════════════
    let filteredQuestions = questions

    if (evaluationContext?.evaluateeTrack) {
      filteredQuestions = questions.filter(q =>
        CompetencyFilterService.questionAppliesToTrack(q as any, evaluationContext.evaluateeTrack!)
      )

      console.log(`[Survey] Filtrado por track ${evaluationContext.evaluateeTrack}: ${filteredQuestions.length}/${questions.length} preguntas`)
    }

    // ═══════════════════════════════════════════════════════════════
    // EX CLIMA GATE 1: SEGUIMIENTO FOCALIZADO (Experiencia Full)
    // Solo actúa si la campaña tiene driverFocusByDepartment poblado
    // y el participante tiene departmentId. Fallback seguro: todas.
    // ═══════════════════════════════════════════════════════════════
    if (participant.campaign.driverFocusByDepartment) {
      const beforeCount = filteredQuestions.length
      filteredQuestions = filterQuestionsByDriverFocus(
        filteredQuestions,
        participant.campaign.driverFocusByDepartment,
        participant.departmentId
      )
      if (filteredQuestions.length !== beforeCount) {
        console.log(`[Survey] Seguimiento focalizado depto ${participant.departmentId}: ${filteredQuestions.length}/${beforeCount} preguntas`)
      }
    }

    const processingTime = Date.now() - startTime

    // Preparar datos de respuesta optimizados
    const surveyData = {
      participant: {
        id: participant.id,
        email: participant.email,
        invitedAt: participant.createdAt,
        reminderSentAt: participant.lastReminderSent,
        respondedAt: participant.responseDate,
        status: participant.hasResponded ? 'completed' : 'pending',
        campaign: {
          id: participant.campaign.id,
          name: participant.campaign.name,
          description: participant.campaign.description,
          status: participant.campaign.status,
          startDate: participant.campaign.startDate,
          endDate: participant.campaign.endDate,
          account: participant.campaign.account,  // ✅ CAMBIO 2: AGREGADO - Include account data in response
          campaignType: participant.campaign.campaignType
        }
      },
      evaluationContext,
      questions: filteredQuestions.map(q => ({
        id: q.id,
        text: q.text,
        category: q.category,
        questionOrder: q.questionOrder,
        responseType: q.responseType,
        choiceOptions: q.choiceOptions || null,
        conditionalLogic: q.conditionalLogic || null,
        scaleLabels: q.scaleLabels || null,
        minLabel: q.minLabel || null,
        maxLabel: q.maxLabel || null,
        minValue: q.minValue ?? null,
        maxValue: q.maxValue ?? null,
        competencyCode: q.competencyCode || null,
        competencyName: q.competencyCode ? (competencyMap[q.competencyCode] || null) : null
      }))
    }

    console.log('✅ Survey data loaded successfully (OPTIMIZED)')
    console.log(`   - Campaign: ${participant.campaign.name}`)
    console.log(`   - Type: ${participant.campaign.campaignType.name}`)
    console.log(`   - Questions: ${filteredQuestions.length}${evaluationContext?.evaluateeTrack ? ` (filtered from ${questions.length})` : ''}`)
    console.log(`   - Processing time: ${processingTime}ms`)
    console.log(`   - Status: ${participant.hasResponded ? 'completed' : 'pending'}`)

    return NextResponse.json(surveyData, {
      headers: {
        'X-Response-Time': String(processingTime),
        'X-Optimization-Level': 'precise-query'
      }
    })

  } catch (error) {
    console.error('❌ Error loading survey data:', error)
    
    const processingTime = Date.now() - startTime
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        performance: {
          processingTime,
          failed: true
        }
      },
      { status: 500 }
    )
  }
}

// OPTIMIZACIONES APLICADAS:
// ✅ Consulta "precisa" vs "voraz" - Solo campos necesarios
// ✅ Separate query para questions - Control explícito
// ✅ Select específico vs include masivo
// ✅ Performance timing logging
// ✅ Headers informativos de optimización
// ✅ Error handling mejorado

// PERFORMANCE ESPERADA:
// ANTES: 13398ms (14 segundos) - Consulta voraz 35 preguntas
// DESPUÉS: <500ms - Solo datos esenciales + questions controladas