// src/app/api/campaigns/[id]/preview/route.ts
// 📁 INSTRUCCIÓN: CREAR NUEVO ARCHIVO EN: src/app/api/campaigns/[id]/preview/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

// GET /api/campaigns/[id]/preview - Preview campaña para revisión
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log('👀 Campaign preview request:', params.id)
    
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Obtener campaña completa con relaciones
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      include: {
        campaignType: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            estimatedDuration: true,
            questionCount: true,
            methodology: true,
            category: true
          }
        },
        account: {
          select: {
            companyName: true,
            maxActiveCampaigns: true,
            maxParticipantsPerCampaign: true,
            subscriptionTier: true
          }
        },
        participants: {
          select: {
            id: true,
            email: true,
            department: true,
            position: true,
            seniorityLevel: true,
            location: true,
            hasResponded: true,
            responseDate: true,
            reminderCount: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            participants: true
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

    // Calcular métricas para preview
    const participationRate = campaign.totalInvited > 0 
      ? Math.round((campaign.totalResponded / campaign.totalInvited) * 100) 
      : 0

    const now = new Date()
    const daysRemaining = campaign.status === 'active' 
      ? Math.ceil((campaign.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))

    const isOverdue = campaign.status === 'active' && campaign.endDate < now

    // Calcular estadísticas de participantes
    const participantStats = {
      total: campaign.participants.length,
      responded: campaign.participants.filter(p => p.hasResponded).length,
      pending: campaign.participants.filter(p => !p.hasResponded).length,
      byDepartment: {} as Record<string, number>,
      byPosition: {} as Record<string, number>,
      bySeniority: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      completenessScore: 0
    }

    // Agrupar participantes por categorías
    campaign.participants.forEach(participant => {
      if (participant.department) {
        participantStats.byDepartment[participant.department] = 
          (participantStats.byDepartment[participant.department] || 0) + 1
      }
      if (participant.position) {
        participantStats.byPosition[participant.position] = 
          (participantStats.byPosition[participant.position] || 0) + 1
      }
      if (participant.seniorityLevel) {
        participantStats.bySeniority[participant.seniorityLevel] = 
          (participantStats.bySeniority[participant.seniorityLevel] || 0) + 1
      }
      if (participant.location) {
        participantStats.byLocation[participant.location] = 
          (participantStats.byLocation[participant.location] || 0) + 1
      }
    })

    // Calcular score de completitud de datos
    const totalFields = campaign.participants.length * 4 // 4 campos opcionales
    const filledFields = campaign.participants.reduce((count, p) => {
      return count + 
        (p.department ? 1 : 0) + 
        (p.position ? 1 : 0) + 
        (p.seniorityLevel ? 1 : 0) + 
        (p.location ? 1 : 0)
    }, 0)
    
    participantStats.completenessScore = totalFields > 0 
      ? Math.round((filledFields / totalFields) * 100) 
      : 0

    // Validaciones para activación
    const validationChecks = {
      hasMinimumParticipants: campaign.participants.length >= 5,
      validDateRange: campaign.startDate <= campaign.endDate,
      startDateValid: campaign.startDate >= now || campaign.status === 'active',
      withinAccountLimits: campaign.participants.length <= campaign.account.maxParticipantsPerCampaign,
      noDuplicateEmails: new Set(campaign.participants.map(p => p.email)).size === campaign.participants.length,
      hasValidEmails: campaign.participants.every(p => p.email && p.email.includes('@'))
    }

    const canActivate = campaign.status === 'draft' && 
                       Object.values(validationChecks).every(check => check)

    const validationIssues = []
    if (!validationChecks.hasMinimumParticipants) {
      validationIssues.push('Mínimo 5 participantes requeridos')
    }
    if (!validationChecks.validDateRange) {
      validationIssues.push('Rango de fechas inválido')
    }
    if (!validationChecks.startDateValid) {
      validationIssues.push('Fecha de inicio en el pasado')
    }
    if (!validationChecks.withinAccountLimits) {
      validationIssues.push(`Máximo ${campaign.account.maxParticipantsPerCampaign} participantes permitidos`)
    }
    if (!validationChecks.noDuplicateEmails) {
      validationIssues.push('Se encontraron emails duplicados')
    }
    if (!validationChecks.hasValidEmails) {
      validationIssues.push('Algunos emails tienen formato inválido')
    }

    // Verificar límite de campañas activas si se va a activar
    let activeCampaignLimitIssue = null
    if (campaign.status === 'draft') {
      const activeCampaignsCount = await prisma.campaign.count({
        where: {
          accountId: authResult.user.id,
          campaignTypeId: campaign.campaignTypeId,
          status: 'active'
        }
      })

      if (activeCampaignsCount >= campaign.account.maxActiveCampaigns) {
        activeCampaignLimitIssue = `Límite de campañas activas alcanzado (${campaign.account.maxActiveCampaigns})`
        validationIssues.push(activeCampaignLimitIssue)
      }
    }

    // Calcular nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let riskFactors = []

    if (campaign.status === 'active') {
      if (participationRate < 30 || isOverdue) {
        riskLevel = 'high'
        if (participationRate < 30) riskFactors.push('Baja participación')
        if (isOverdue) riskFactors.push('Campaña vencida')
      } else if (participationRate < 50 || (daysRemaining !== null && daysRemaining <= 2)) {
        riskLevel = 'medium'
        if (participationRate < 50) riskFactors.push('Participación moderada')
        if (daysRemaining !== null && daysRemaining <= 2) riskFactors.push('Próxima a vencer')
      }
    }

    // Generar recomendaciones
    const recommendations = []
    
    if (participantStats.completenessScore < 50) {
      recommendations.push('Considerar agregar más información demográfica para mejor segmentación')
    }
    
    if (campaign.participants.length < 20) {
      recommendations.push('Muestra pequeña: considerar agregar más participantes para análisis más robusto')
    }
    
    if (Object.keys(participantStats.byDepartment).length < 2) {
      recommendations.push('Agregar participantes de múltiples departamentos para análisis comparativo')
    }
    
    if (campaign.status === 'draft' && canActivate) {
      recommendations.push('La campaña está lista para activación')
    }

    if (campaign.status === 'active' && participationRate > 70) {
      recommendations.push('Excelente participación: considerar analizar resultados preliminares')
    }

    // Preparar vista previa de emails (simulada)
    const emailPreview = {
      subject: `Tu opinión importa: ${campaign.name}`,
      previewText: `Participa en nuestra medición de clima organizacional para ${campaign.account.companyName}`,
      estimatedDeliveryTime: campaign.participants.length <= 100 ? '< 5 minutos' : '< 15 minutos',
      templateType: campaign.campaignType.slug === 'pulso-express' ? 'express' : 'full'
    }

    // Proyecciones basadas en el tipo de campaña
    const projections = {
      estimatedCompletionTime: campaign.campaignType.estimatedDuration || 10,
      expectedParticipationRate: campaign.campaignType.slug === 'pulso-express' ? '70-85%' : '60-75%',
      resultsReadyIn: campaign.status === 'active' 
        ? `${daysRemaining} días (al cierre)` 
        : 'Inmediatamente al completar',
      minimumResponsesForAnalysis: Math.max(5, Math.ceil(campaign.participants.length * 0.3))
    }

    const response = {
      success: true,
      campaign: {
        ...campaign,
        participationRate,
        daysRemaining,
        isOverdue,
        riskLevel,
        riskFactors,
        canActivate,
        canViewResults: campaign.status === 'completed' && campaign.totalResponded > 0,
        canEdit: ['draft', 'active'].includes(campaign.status),
        canDelete: campaign.status === 'draft'
      },
      participantStats,
      validationChecks,
      validationIssues,
      recommendations,
      emailPreview,
      projections,
      readyForActivation: canActivate && validationIssues.length === 0,
      performance: {
        queryTime: Date.now() - startTime,
        dataCompleteness: participantStats.completenessScore
      }
    }

    console.log('🎉 Campaign preview generated successfully')

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching campaign preview:', error)
    
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