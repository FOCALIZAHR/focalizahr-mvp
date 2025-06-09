// 3. ENDPOINT PREVIEW: src/app/api/campaigns/[id]/preview/route.ts
// GET /api/campaigns/[id]/preview - Preview campaña para revisión
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

    // Obtener campaña completa con relaciones
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      include: {
        campaignType: true,
        participants: {
          select: {
            id: true,
            email: true,
            department: true,
            position: true,
            seniorityLevel: true,
            location: true,
            hasResponded: true
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

    // Calcular métricas para preview
    const participationRate = campaign.totalInvited > 0 
      ? (campaign.totalResponded / campaign.totalInvited) * 100 
      : 0

    const now = new Date()
    const daysRemaining = campaign.status === 'active' 
      ? Math.ceil((campaign.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Validaciones para activación
    const canActivate = campaign.status === 'draft' && 
                       campaign.totalInvited >= 5 && 
                       campaign.startDate <= now

    const validationIssues = []
    if (campaign.totalInvited < 5) {
      validationIssues.push('Mínimo 5 participantes requeridos')
    }
    if (campaign.startDate > now) {
      validationIssues.push('Fecha de inicio en el futuro')
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        participationRate,
        daysRemaining,
        canActivate,
        validationIssues
      },
      readyForActivation: canActivate && validationIssues.length === 0
    })

  } catch (error) {
    console.error('Error fetching campaign preview:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}