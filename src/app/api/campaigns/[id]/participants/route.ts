// 2. ENDPOINT PARTICIPANTES CONCIERGE: src/app/api/campaigns/[id]/participants/route.ts
import { conciergeParticipantsSchema } from '@/lib/validations'

// POST /api/campaigns/[id]/participants - Carga participantes enfoque concierge
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const campaignId = params.id

    // Verificar campaña existe y pertenece al usuario
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Solo permitir en estado draft
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Solo se pueden agregar participantes en campañas en borrador' 
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
      validationSettings: body.validationSettings
    }

    const validation = conciergeParticipantsSchema.safeParse(participantsData)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos de participantes inválidos',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Limpiar participantes existentes
    await prisma.participant.deleteMany({
      where: { campaignId }
    })

    // Crear participantes con tokens únicos
    const participantsToCreate = validation.data.participants.map(participant => ({
      campaignId,
      email: participant.email,
      uniqueToken: crypto.randomBytes(32).toString('hex'),
      department: participant.department,
      position: participant.position,
      seniorityLevel: participant.seniorityLevel,
      location: participant.location
    }))

    const createdParticipants = await prisma.participant.createMany({
      data: participantsToCreate
    })

    // Actualizar contadores en campaña
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalInvited: participantsToCreate.length,
        updatedAt: new Date()
      }
    })

    // Crear audit log
    await prisma.auditLog.create({
      data: {
        accountId: authResult.user.id,
        campaignId,
        action: 'participants_loaded',
        entityType: 'participant',
        entityId: campaignId,
        newValues: {
          count: participantsToCreate.length,
          processingMetadata: validation.data.processingMetadata
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    })

    return NextResponse.json({
      success: true,
      participants: {
        total: participantsToCreate.length,
        created: createdParticipants.count
      },
      processingMetadata: validation.data.processingMetadata,
      message: `${createdParticipants.count} participantes cargados exitosamente`
    })

  } catch (error) {
    console.error('Error loading participants:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET /api/campaigns/[id]/participants - Obtener participantes con estadísticas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Verificar acceso a la campaña
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Obtener participantes
    const participants = await prisma.participant.findMany({
      where: { campaignId },
      select: {
        id: true,
        email: true,
        department: true,
        position: true,
        seniorityLevel: true,
        location: true,
        hasResponded: true,
        responseDate: true,
        createdAt: true
      }
    })

    // Calcular estadísticas
    const summary = {
      total: participants.length,
      responded: participants.filter(p => p.hasResponded).length,
      pending: participants.filter(p => !p.hasResponded).length,
      byDepartment: {},
      byPosition: {},
      bySeniority: {},
      byLocation: {}
    }

    // Agrupar por categorías
    participants.forEach(participant => {
      if (participant.department) {
        summary.byDepartment[participant.department] = (summary.byDepartment[participant.department] || 0) + 1
      }
      if (participant.position) {
        summary.byPosition[participant.position] = (summary.byPosition[participant.position] || 0) + 1
      }
      if (participant.seniorityLevel) {
        summary.bySeniority[participant.seniorityLevel] = (summary.bySeniority[participant.seniorityLevel] || 0) + 1
      }
      if (participant.location) {
        summary.byLocation[participant.location] = (summary.byLocation[participant.location] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      participants,
      summary,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status
      }
    })

  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
