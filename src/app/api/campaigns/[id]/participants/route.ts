// src/app/api/campaigns/[id]/participants/route.ts
// ✅ VERSIÓN CON RUT + PHONENUMBER - CAMBIOS QUIRÚRGICOS APLICADOS

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { buildParticipantAccessFilter, extractUserContext } from '@/lib/services/AuthorizationService'
import { conciergeParticipantsSchema } from '@/lib/validations'
import { Gender } from '@prisma/client'
import crypto from 'crypto'

// ✅ NUEVO: Validación RUT chileno con dígito verificador
function validateRut(rut: string): boolean {
  if (!rut) return false;
  
  // Formato: 12345678-9 o 12345678-K
  const rutRegex = /^(\d{7,8})-?([\dkK])$/;
  const match = rutRegex.exec(rut.replace(/\./g, '').trim());
  
  if (!match) return false;
  
  const [, num, dv] = match;
  let suma = 0;
  let multiplo = 2;
  
  // Algoritmo módulo 11
  for (let i = num.length - 1; i >= 0; i--) {
    suma += parseInt(num[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  const dvCalculado = 11 - (suma % 11);
  const dvEsperado = dvCalculado === 11 ? '0' : 
                     dvCalculado === 10 ? 'k' : 
                     dvCalculado.toString();
  
  return dv.toLowerCase() === dvEsperado;
}

// ✅ NUEVO: Normalizar RUT a formato estándar
function normalizeRut(rut: string): string {
  if (!rut) return '';
  
  // Remover puntos y espacios
  const cleaned = rut.replace(/[.\s]/g, '').trim();
  
  // Separar número y dígito verificador
  const match = /^(\d{7,8})([\dkK])$/.exec(cleaned);
  if (!match) return cleaned;
  
  const [, num, dv] = match;
  return `${num}-${dv.toUpperCase()}`;
}

// ✅ FUNCIÓN CORREGIDA (Gender enum + null)
function parseGender(value: string | undefined): Gender | null {
  if (!value) return null;  // ← Cambio 1: null en vez de undefined
  
  const normalized = value.toLowerCase().trim();
  
  // ← Cambio 2: Devolver Gender.MALE en vez de 'MALE'
  if (['m', 'male', 'masculino', 'hombre', 'man'].includes(normalized)) {
    return Gender.MALE;
  }
  
  if (['f', 'female', 'femenino', 'mujer', 'woman'].includes(normalized)) {
    return Gender.FEMALE;
  }
  
  if (['nb', 'non-binary', 'no binario', 'nobinario', 'other', 'otro'].includes(normalized)) {
    return Gender.NON_BINARY;
  }
  
  if (['prefer not to say', 'prefiero no decir', 'no especifica', 'n/a'].includes(normalized)) {
    return Gender.PREFER_NOT_TO_SAY;
  }
  
  return null;  // ← Cambio 3: null en vez de undefined
}
function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  try {
    // Si es un número de Excel (días desde 1900)
    if (typeof value === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return isValidDate(date) ? date : undefined;
    }
    
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // Formato DD/MM/YYYY o DD-MM-YYYY
      const ddmmyyyy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(dateStr);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isValidDate(date) ? date : undefined;
      }
      
      // Formato YYYY-MM-DD (ISO)
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

// POST /api/campaigns/[id]/participants
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('👥 Participants upload request for campaign:', params.id)
    
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const allowedRoles = ['ACCOUNT_OWNER', 'HR_MANAGER', 'FOCALIZAHR_ADMIN', 'CEO']
    if (!allowedRoles.includes(userContext.role || '')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Sin permisos para crear participantes',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const campaignId = params.id

    console.log('📋 Participants data received:', {
      participantCount: body.participants?.length || 0,
      hasProcessingMetadata: !!body.processingMetadata
    })

    // Verificar campaña
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: userContext.accountId
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
        processedBy: userContext.userId || userContext.accountId,
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

    // ✅ CAMBIO 1: Validar RUTs antes de procesar
    const invalidRuts: string[] = [];
    validatedData.participants.forEach((p, index) => {
      if (p.nationalId && !validateRut(p.nationalId)) {
        invalidRuts.push(`Fila ${index + 1}: RUT inválido (${p.nationalId})`);
      }
    });

    if (invalidRuts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'RUTs inválidos encontrados',
          details: invalidRuts,
          code: 'INVALID_RUT'
        },
        { status: 400 }
      )
    }

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

    // ✅ CAMBIO 2: Detectar duplicados por RUT (prioritario) o email (fallback)
    const seenRuts = new Set<string>();
    const seenEmails = new Set<string>();
    const duplicates: string[] = [];
    // ✅ AGREGAR ESTAS LÍNEAS ANTES DEL .map():
    const missingRuts: string[] = [];
    validatedData.participants.forEach((p, index) => {
      if (!p.nationalId || !validateRut(p.nationalId)) {
        missingRuts.push(`Participante ${index + 1}: RUT ${p.nationalId || 'vacío'} inválido`);
      }
    });

    if (missingRuts.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Participantes con RUT inválido o vacío',
        details: missingRuts,
        code: 'INVALID_NATIONAL_ID'
      }, { status: 400 });
    }

    const participantsToCreate = validatedData.participants
      .map((participant, index) => {
        const uniqueToken = crypto.randomBytes(32).toString('hex')
        
        // ✅ CAMBIO 3: Normalizar y validar RUT
        const normalizedRut = participant.nationalId 
          ? normalizeRut(participant.nationalId) 
          : null;
        
        // Detectar duplicados
        if (normalizedRut) {
          if (seenRuts.has(normalizedRut)) {
            duplicates.push(`Fila ${index + 1}: RUT duplicado (${normalizedRut})`);
            return null;
          }
          seenRuts.add(normalizedRut);
        } else {
          // Fallback a email si no hay RUT
          const email = participant.email.toLowerCase().trim();
          if (seenEmails.has(email)) {
            duplicates.push(`Fila ${index + 1}: Email duplicado (${email})`);
            return null;
          }
          seenEmails.add(email);
        }
        
        // ✅ CAMBIO 4: Normalizar phoneNumber
        const normalizedPhone = participant.phoneNumber?.trim() || null;
        
        // Parsear campos demográficos
        const parsedGender = participant.gender ? parseGender(participant.gender) : null;
        const parsedDateOfBirth = participant.dateOfBirth ? parseDate(participant.dateOfBirth) : null;
        const parsedHireDate = participant.hireDate ? parseDate(participant.hireDate) : null;
        
        return {
          campaignId,
          email: participant.email ? participant.email.toLowerCase().trim() : null,  // ✅ CAMBIO
          uniqueToken,
          // ✅ CAMBIO 5: Agregar campos nuevos
          nationalId: normalizedRut,
          phoneNumber: normalizedPhone,
          department: participant.department?.trim() || null,
          position: participant.position?.trim() || null,
          seniorityLevel: participant.seniorityLevel || null,
          location: participant.location?.trim() || null,
          gender: parsedGender,
          dateOfBirth: parsedDateOfBirth,
          hireDate: parsedHireDate,
          hasResponded: false,
          reminderCount: 0
        }
      })
      .filter(p => p !== null); // Remover duplicados

    if (duplicates.length > 0) {
      console.log(`⚠️ Found ${duplicates.length} duplicates, continuing with unique participants`);
    }

    console.log(`💾 Creating ${participantsToCreate.length} participants...`)

    // Crear participantes en lotes
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

    // Actualizar contadores
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalInvited: totalCreated,
        totalResponded: 0,
        updatedAt: new Date()
      }
    })

    console.log('📊 Campaign counters updated')

    // ✅ CAMBIO 6: Estadísticas extendidas con RUT y phone
    const statistics = {
      total: totalCreated,
      duplicatesSkipped: duplicates.length,
      byDepartment: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      bySeniority: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      withDepartment: 0,
      withPosition: 0,
      withSeniority: 0,
      withLocation: 0,
      withGender: 0,
      withDateOfBirth: 0,
      withHireDate: 0,
      // ✅ NUEVAS MÉTRICAS
      withNationalId: 0,
      withPhoneNumber: 0,
      withEmail: totalCreated, // Todos tienen email (requerido por ahora)
      contactChannels: {
        emailOnly: 0,
        phoneOnly: 0,
        both: 0
      }
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
      if (participant.gender) statistics.withGender++
      if (participant.dateOfBirth) statistics.withDateOfBirth++
      if (participant.hireDate) statistics.withHireDate++
      
      // ✅ CONTAR NUEVOS CAMPOS
      if (participant.nationalId) statistics.withNationalId++
      if (participant.phoneNumber) statistics.withPhoneNumber++
      
      // Canales de contacto
      const hasEmail = !!participant.email;
      const hasPhone = !!participant.phoneNumber;
      if (hasEmail && !hasPhone) statistics.contactChannels.emailOnly++;
      if (!hasEmail && hasPhone) statistics.contactChannels.phoneOnly++;
      if (hasEmail && hasPhone) statistics.contactChannels.both++;
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        accountId: userContext.accountId,
        campaignId,
        action: 'participants_uploaded',
        entityType: 'participant',
        entityId: campaignId,
        newValues: {
          count: totalCreated,
          duplicatesSkipped: duplicates.length,
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

    // ✅ CAMBIO 7: Recomendaciones actualizadas
    const recommendations = []
    
    if (statistics.withDepartment / statistics.total > 0.8) {
      recommendations.push('Excelente segmentación por departamento para análisis detallado')
    }
    
    if (statistics.withNationalId / statistics.total > 0.9) {
      recommendations.push('✅ Excelente: 90%+ con RUT permite tracking robusto y previene duplicados')
    } else if (statistics.withNationalId / statistics.total > 0.5) {
      recommendations.push('⚠️ Considerar completar RUTs faltantes para mejor tracking')
    }
    
    if (statistics.withPhoneNumber / statistics.total > 0.7) {
      recommendations.push('📱 Excelente cobertura WhatsApp: Engagement esperado 3-4x mayor que email')
    } else if (statistics.withPhoneNumber / statistics.total > 0) {
      recommendations.push('💡 Sugerencia: Agregar más celulares para aprovechar canal WhatsApp (64% vs 20% engagement)')
    }
    
    if (statistics.contactChannels.both / statistics.total > 0.6) {
      recommendations.push('🎯 Doble canal disponible: Estrategia híbrida email + WhatsApp maximiza participación')
    }

    if (statistics.total >= 50) {
      recommendations.push('📊 Excelente tamaño de muestra para análisis estadísticamente significativo')
    }

    const response = {
      success: true,
      participants: {
        total: totalCreated,
        created: totalCreated,
        duplicatesSkipped: duplicates.length,
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

// GET /api/campaigns/[id]/participants
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('📋 Participants list request for campaign:', params.id)
    
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('include_details') === 'true'

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: userContext.accountId
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
    
    const accessFilter = await buildParticipantAccessFilter(userContext, {
      dataType: 'participation'
    });
    
    console.log('🔐 Security filters applied:', {
      userRole: userContext.role,
      departmentId: userContext.departmentId,
      filterApplied: Object.keys(accessFilter).length > 0
    })

    // ✅ CAMBIO 8: Incluir campos nuevos en select
    const participants = await prisma.participant.findMany({
      where: { 
        campaignId,
        ...accessFilter
      },
      select: {
        id: true,
        email: includeDetails,
        nationalId: true,      // ✅ NUEVO
        phoneNumber: true,     // ✅ NUEVO
        department: true,
        position: true,
        seniorityLevel: true,
        location: true,
        hasResponded: true,
        responseDate: true,
        reminderCount: true,
        lastReminderSent: true,
        createdAt: true,
        gender: true,
        dateOfBirth: true,
        hireDate: true,
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
        { hasResponded: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`📊 Found ${participants.length} participants`)

    // ✅ CAMBIO 9: Estadísticas con campos nuevos
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
      demographicFields: {
        withGender: participants.filter(p => p.gender).length,
        withDateOfBirth: participants.filter(p => p.dateOfBirth).length,
        withHireDate: participants.filter(p => p.hireDate).length,
        // ✅ NUEVOS CONTADORES
        withNationalId: participants.filter(p => p.nationalId).length,
        withPhoneNumber: participants.filter(p => p.phoneNumber).length
      }
    }

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

    const analysis = {
      dataCompleteness: {
        department: Math.round((Object.values(summary.byDepartment).reduce((sum, dept) => sum + dept.total, 0) / summary.total) * 100),
        position: Math.round((Object.values(summary.byPosition).reduce((sum, pos) => sum + pos.total, 0) / summary.total) * 100),
        seniority: Math.round((Object.values(summary.bySeniority).reduce((sum, sen) => sum + sen.total, 0) / summary.total) * 100),
        location: Math.round((Object.values(summary.byLocation).reduce((sum, loc) => sum + loc.total, 0) / summary.total) * 100),
        // ✅ NUEVOS PORCENTAJES
        nationalId: Math.round((summary.demographicFields.withNationalId / summary.total) * 100),
        phoneNumber: Math.round((summary.demographicFields.withPhoneNumber / summary.total) * 100)
      },
      trends: {
        needsReminders: summary.pending,
        highEngagement: summary.responded > summary.total * 0.7,
        readyForAnalysis: summary.responded >= 20 && summary.participationRate >= 60,
        // ✅ NUEVO ANÁLISIS
        whatsappReady: summary.demographicFields.withPhoneNumber > summary.total * 0.5
      }
    }

    const response = {
      success: true,
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
      filtered: userContext.role === 'AREA_MANAGER',
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