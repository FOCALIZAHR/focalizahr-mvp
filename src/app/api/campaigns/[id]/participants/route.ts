// src/app/api/campaigns/[id]/participants/route.ts
// ✅ VERSIÓN EXTENDIDA CON CAMPOS DEMOGRÁFICOS - ZERO BREAKING CHANGES

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { conciergeParticipantsSchema } from '@/lib/validations'
import crypto from 'crypto'

// ✅ FUNCIONES DE PARSING IMPORTADAS (CONSISTENCIA CON ADMIN/PARTICIPANTS)
function parseGender(value: string): string | undefined {
  if (!value) return undefined;
  
  const normalized = value.toLowerCase().trim();
  
  if (['m', 'male', 'masculino', 'hombre', 'man'].includes(normalized)) {
    return 'MALE';
  }
  
  if (['f', 'female', 'femenino', 'mujer', 'woman'].includes(normalized)) {
    return 'FEMALE';
  }
  
  if (['nb', 'non-binary', 'no binario', 'nobinario', 'other', 'otro'].includes(normalized)) {
    return 'NON_BINARY';
  }
  
  if (['prefer not to say', 'prefiero no decir', 'no especifica', 'n/a'].includes(normalized)) {
    return 'PREFER_NOT_TO_SAY';
  }
  
  return undefined;
}

function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  try {
    // Si es un número de Excel (días desde 1900) - FÓRMULA CORREGIDA
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30); // 30 dic 1899
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return isValidDate(date) ? date : undefined;
    }
    
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // ✅ FORMATO DD/MM/YYYY o DD-MM-YYYY (AMBOS)
      const ddmmyyyy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(dateStr);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isValidDate(date) ? date : undefined;
      }
      
      // ✅ FORMATO YYYY-MM-DD (ISO)
      const yyyymmdd = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/.exec(dateStr);
      if (yyyymmdd) {
        const [, year, month, day] = yyyymmdd;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isValidDate(date) ? date : undefined;
      }
    }
    
    const date = new Date(value);
    return isValidDate(date) ? date : undefined;
    
  } catch (error) {
    return undefined;
  }
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && 
         !isNaN(date.getTime()) && 
         date.getFullYear() > 1900 && 
         date.getFullYear() < 2030;
}

// ✅ FUNCIONES DE PARSING SOLAMENTE (NO CÁLCULOS DE NEGOCIO)

// POST /api/campaigns/[id]/participants - Carga participantes enfoque concierge
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('👥 Participants upload request for campaign:', params.id)
    
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const campaignId = params.id

    console.log('📋 Participants data received:', {
      participantCount: body.participants?.length || 0,
      hasProcessingMetadata: !!body.processingMetadata
    })

    // Verificar campaña existe y pertenece al usuario
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      include: {
        account: {
          select: {
            maxParticipantsPerCampaign: true,
            companyName: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ Campaign found:', campaign.name, 'Status:', campaign.status)

    // Solo permitir en estado draft
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Solo se pueden agregar participantes en campañas en borrador',
          code: 'INVALID_CAMPAIGN_STATUS'
        },
        { status: 409 }
      )
    }

    // Validar datos de participantes
    const participantsData = {
      campaignId,
      participants: body.participants,
      processingMetadata: {
        ...body.processingMetadata,
        processedBy: authResult.user.adminName,
        uploadedAt: new Date()
      },
      validationSettings: body.validationSettings || {
        strictEmailValidation: true,
        allowPartialData: true,
        autoCorrectCommonErrors: true,
        preserveOriginalData: true
      }
    }

    console.log('🔍 Validating participants data...')
    
    const validation = conciergeParticipantsSchema.safeParse(participantsData)
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de participantes inválidos',
          details: validation.error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Verificar límite de participantes
    if (validatedData.participants.length > campaign.account.maxParticipantsPerCampaign) {
      return NextResponse.json(
        {
          success: false,
          error: `Máximo ${campaign.account.maxParticipantsPerCampaign} participantes permitidos`,
          code: 'PARTICIPANT_LIMIT_EXCEEDED'
        },
        { status: 409 }
      )
    }

    console.log('✅ Validation passed, processing participants...')

    // Limpiar participantes existentes
    const existingCount = await prisma.participant.count({
      where: { campaignId }
    })

    if (existingCount > 0) {
      console.log(`🗑️ Removing ${existingCount} existing participants`)
      await prisma.participant.deleteMany({
        where: { campaignId }
      })
    }

    // ✅ PROCESAR PARTICIPANTES CON CAMPOS DEMOGRÁFICOS EXTENDIDOS
    const participantsToCreate = validatedData.participants.map(participant => {
      const uniqueToken = crypto.randomBytes(32).toString('hex')
      
      // ✅ PARSEAR CAMPOS DEMOGRÁFICOS (CONSISTENTE CON ADMIN/PARTICIPANTS)
      const parsedGender = participant.gender ? parseGender(participant.gender) : null;
      const parsedDateOfBirth = participant.dateOfBirth ? parseDate(participant.dateOfBirth) : null;
      const parsedHireDate = participant.hireDate ? parseDate(participant.hireDate) : null;
      
      return {
        campaignId,
        email: participant.email.toLowerCase().trim(),
        uniqueToken,
        department: participant.department?.trim() || null,
        position: participant.position?.trim() || null,
        seniorityLevel: participant.seniorityLevel || null,
        location: participant.location?.trim() || null,
        // ✅ CAMPOS DEMOGRÁFICOS NUEVOS (OPCIONALES)
        gender: parsedGender,
        dateOfBirth: parsedDateOfBirth,
        hireDate: parsedHireDate,
        hasResponded: false,
        reminderCount: 0
      }
    })

    console.log(`💾 Creating ${participantsToCreate.length} participants...`)

    // Crear participantes en lotes para mejor performance
    const batchSize = 100
    let totalCreated = 0

    for (let i = 0; i < participantsToCreate.length; i += batchSize) {
      const batch = participantsToCreate.slice(i, i + batchSize)
      await prisma.participant.createMany({
        data: batch,
        skipDuplicates: true
      })
      totalCreated += batch.length
      console.log(`📝 Batch ${Math.floor(i / batchSize) + 1} created: ${batch.length} participants`)
    }

    // Actualizar contadores en campaña
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalInvited: totalCreated,
        totalResponded: 0, // Reset counter
        updatedAt: new Date()
      }
    })

    console.log('📊 Campaign counters updated')

    // ✅ GENERAR ESTADÍSTICAS EXTENDIDAS CON DEMOGRAFÍA
    const statistics = {
      total: totalCreated,
      byDepartment: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      bySeniority: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      withDepartment: 0,
      withPosition: 0,
      withSeniority: 0,
      withLocation: 0,
      // ✅ ESTADÍSTICAS DEMOGRÁFICAS NUEVAS
      withGender: 0,
      withDateOfBirth: 0,
      withHireDate: 0
    }

    participantsToCreate.forEach(participant => {
      if (participant.department) {
        statistics.byDepartment[participant.department] = (statistics.byDepartment[participant.department] || 0) + 1
        statistics.withDepartment++
      }
      if (participant.position) {
        statistics.byPosition[participant.position] = (statistics.byPosition[participant.position] || 0) + 1
        statistics.withPosition++
      }
      if (participant.seniorityLevel) {
        statistics.bySeniority[participant.seniorityLevel] = (statistics.bySeniority[participant.seniorityLevel] || 0) + 1
        statistics.withSeniority++
      }
      if (participant.location) {
        statistics.byLocation[participant.location] = (statistics.byLocation[participant.location] || 0) + 1
        statistics.withLocation++
      }
      // ✅ CONTAR CAMPOS DEMOGRÁFICOS
      if (participant.gender) statistics.withGender++
      if (participant.dateOfBirth) statistics.withDateOfBirth++
      if (participant.hireDate) statistics.withHireDate++
    })

    // Crear audit log
    await prisma.auditLog.create({
      data: {
        accountId: authResult.user.id,
        campaignId,
        action: 'participants_uploaded',
        entityType: 'participant',
        entityId: campaignId,
        newValues: {
          count: totalCreated,
          statistics,
          processingMetadata: validatedData.processingMetadata
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    console.log('📝 Audit log created')

    // Recomendaciones básicas existentes
    const recommendations = []
    
    if (statistics.withDepartment / statistics.total > 0.8) {
      recommendations.push('Excelente segmentación por departamento para análisis detallado')
    }
    
    if (statistics.withPosition / statistics.total < 0.5) {
      recommendations.push('Considerar agregar más información de cargos para mejor análisis')
    }
    
    if (Object.keys(statistics.byDepartment).length > 5) {
      recommendations.push('Múltiples departamentos permitirán análisis comparativo rico')
    }

    if (statistics.total >= 50) {
      recommendations.push('Excelente tamaño de muestra para análisis estadísticamente significativo')
    } else if (statistics.total >= 20) {
      recommendations.push('Buen tamaño de muestra para análisis confiable')
    }

    const response = {
      success: true,
      participants: {
        total: totalCreated,
        created: totalCreated,
        statistics
      },
      processingMetadata: validatedData.processingMetadata,
      recommendations,
      campaignUpdated: {
        totalInvited: totalCreated,
        canActivate: totalCreated >= 5,
        readyForActivation: totalCreated >= 5
      },
      performance: {
        queryTime: Date.now() - startTime,
        batchesProcessed: Math.ceil(participantsToCreate.length / batchSize)
      },
      message: `${totalCreated} participantes cargados exitosamente`
    }

    console.log('🎉 Participants upload completed successfully')

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Error loading participants:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        performance: {
          queryTime: Date.now() - startTime
        }
      },
      { status: 500 }
    )
  }
}

// GET /api/campaigns/[id]/participants - Obtener participantes con estadísticas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('📋 Participants list request for campaign:', params.id)
    
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('include_details') === 'true'

    // Verificar acceso a la campaña
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalInvited: true,
        totalResponded: true
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ Campaign found:', campaign.name)

    // ✅ OBTENER PARTICIPANTES CON CAMPOS DEMOGRÁFICOS EXTENDIDOS
    const participants = await prisma.participant.findMany({
      where: { campaignId },
      select: {
        id: true,
        email: includeDetails,
        department: true,
        position: true,
        seniorityLevel: true,
        location: true,
        hasResponded: true,
        responseDate: true,
        reminderCount: true,
        lastReminderSent: true,
        createdAt: true,
        // ✅ CAMPOS DEMOGRÁFICOS NUEVOS
        gender: true,
        dateOfBirth: true,
        hireDate: true,
        // No incluir uniqueToken por seguridad
        ...(includeDetails && {
          responses: {
            select: {
              id: true,
              rating: true,
              createdAt: true
            }
          }
        })
      },
      orderBy: [
        { hasResponded: 'asc' }, // No respondidos primero
        { createdAt: 'desc' }
      ]
    })

    console.log(`📊 Found ${participants.length} participants`)

    // ✅ CALCULAR ESTADÍSTICAS BÁSICAS (SIN LÓGICA DE NEGOCIO)
    const summary = {
      total: participants.length,
      responded: participants.filter(p => p.hasResponded).length,
      pending: participants.filter(p => !p.hasResponded).length,
      participationRate: participants.length > 0 
        ? Math.round((participants.filter(p => p.hasResponded).length / participants.length) * 100)
        : 0,
      byDepartment: {} as Record<string, { total: number; responded: number }>,
      byPosition: {} as Record<string, { total: number; responded: number }>,
      bySeniority: {} as Record<string, { total: number; responded: number }>,
      byLocation: {} as Record<string, { total: number; responded: number }>,
      reminders: {
        noReminders: participants.filter(p => p.reminderCount === 0).length,
        oneReminder: participants.filter(p => p.reminderCount === 1).length,
        multipleReminders: participants.filter(p => p.reminderCount > 1).length
      },
      // ✅ CONTEOS DEMOGRÁFICOS BÁSICOS (NO CÁLCULOS COMPLEJOS)
      demographicFields: {
        withGender: participants.filter(p => p.gender).length,
        withDateOfBirth: participants.filter(p => p.dateOfBirth).length,
        withHireDate: participants.filter(p => p.hireDate).length
      }
    }

    // Agrupar por categorías con estadísticas de respuesta
    participants.forEach(participant => {
      const processSegment = (key: string, segmentMap: Record<string, { total: number; responded: number }>) => {
        if (!segmentMap[key]) {
          segmentMap[key] = { total: 0, responded: 0 }
        }
        segmentMap[key].total++
        if (participant.hasResponded) {
          segmentMap[key].responded++
        }
      }

      if (participant.department) {
        processSegment(participant.department, summary.byDepartment)
      }
      if (participant.position) {
        processSegment(participant.position, summary.byPosition)
      }
      if (participant.seniorityLevel) {
        processSegment(participant.seniorityLevel, summary.bySeniority)
      }
      if (participant.location) {
        processSegment(participant.location, summary.byLocation)
      }
    })

    // Análisis simplificado (solo indicadores básicos)
    const analysis = {
      dataCompleteness: {
        department: Math.round((Object.values(summary.byDepartment).reduce((sum, dept) => sum + dept.total, 0) / summary.total) * 100),
        position: Math.round((Object.values(summary.byPosition).reduce((sum, pos) => sum + pos.total, 0) / summary.total) * 100),
        seniority: Math.round((Object.values(summary.bySeniority).reduce((sum, sen) => sum + sen.total, 0) / summary.total) * 100),
        location: Math.round((Object.values(summary.byLocation).reduce((sum, loc) => sum + loc.total, 0) / summary.total) * 100)
      },
      trends: {
        needsReminders: summary.pending,
        highEngagement: summary.responded > summary.total * 0.7,
        readyForAnalysis: summary.responded >= 20 && summary.participationRate >= 60
      }
    }

    const response = {
      success: true,
      // ✅ DATOS CRUDOS SIN ENRIQUECIMIENTO
      participants: includeDetails ? participants : [],
      summary,
      analysis,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalInvited: campaign.totalInvited,
        totalResponded: campaign.totalResponded
      },
      performance: {
        queryTime: Date.now() - startTime,
        participantCount: participants.length
      }
    }

    console.log('🎉 Participants data retrieved successfully')

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching participants:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        performance: {
          queryTime: Date.now() - startTime
        }
      },
      { status: 500 }
    )
  }
}