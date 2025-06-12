// src/app/api/campaigns/[id]/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { generateUniqueToken } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Función para generar tokens únicos para participantes que no los tienen
async function generateMissingTokens(campaignId: string): Promise<number> {
  try {
    // Buscar participantes sin token
    const participantsWithoutToken = await prisma.participant.findMany({
      where: {
        campaignId,
        OR: [
          { uniqueToken: null },
          { uniqueToken: '' }
        ]
      },
      select: { id: true }
    });

    if (participantsWithoutToken.length === 0) {
      return 0;
    }

    // Generar tokens únicos
    const updatePromises = participantsWithoutToken.map(participant => 
      prisma.participant.update({
        where: { id: participant.id },
        data: { uniqueToken: generateUniqueToken() }
      })
    );

    await Promise.all(updatePromises);
    return participantsWithoutToken.length;

  } catch (error) {
    console.error('Error generating missing tokens:', error);
    throw new Error('Error generando tokens únicos');
  }
}

// Función para enviar emails de invitación (simplificada para MVP)
async function queueCampaignEmails(campaignId: string): Promise<{ queued: number; errors: string[] }> {
  try {
    // Obtener datos de la campaña y participantes
    const campaignData = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        account: { select: { companyName: true, adminEmail: true } },
        campaignType: { select: { name: true, slug: true, estimatedDuration: true } },
        participants: { 
          where: { hasResponded: false },
          select: { id: true, email: true, uniqueToken: true, name: true }
        }
      }
    });

    if (!campaignData) {
      throw new Error('Campaña no encontrada');
    }

    const { participants, account, campaignType } = campaignData;
    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/survey`;
    
    let queuedCount = 0;
    const errors: string[] = [];

    // Template de email básico
    const getEmailTemplate = (participant: any, token: string) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Tu opinión importa - ${account.companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tu Opinión Importa</h1>
              <p>Ayúdanos a mejorar ${account.companyName}</p>
            </div>
            
            <div class="content">
              <h2>Hola${participant.name ? ` ${participant.name}` : ''},</h2>
              
              <p>Hemos iniciado una medición de clima organizacional en ${account.companyName} y tu participación es fundamental para entender cómo podemos mejorar como equipo.</p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Detalles de la Encuesta:</h3>
                <p><strong>Tipo:</strong> ${campaignType.name}</p>
                <p><strong>Duración estimada:</strong> ${campaignType.estimatedDuration || 10} minutos</p>
                <p><strong>Período:</strong> ${new Date(campaignData.startDate).toLocaleDateString()} - ${new Date(campaignData.endDate).toLocaleDateString()}</p>
                <p><strong>Confidencialidad:</strong> Tus respuestas son completamente anónimas</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${surveyUrl}/${token}" class="button">
                  Completar Encuesta →
                </a>
              </div>
              
              <p><strong>¿Por qué es importante tu participación?</strong></p>
              <ul>
                <li>Ayudas a identificar fortalezas organizacionales</li>
                <li>Contribuyes a detectar oportunidades de mejora</li>
                <li>Participas en la construcción de un mejor ambiente laboral</li>
              </ul>
              
              <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0;"><strong>💡 Tip:</strong> La encuesta está optimizada para móvil. Puedes completarla desde cualquier dispositivo en el momento que prefieras.</p>
              </div>
              
              <p>Si tienes alguna pregunta sobre este proceso, no dudes en contactar a tu área de Recursos Humanos.</p>
              
              <p>¡Gracias por ser parte del crecimiento de ${account.companyName}!</p>
            </div>
            
            <div class="footer">
              <p>Esta encuesta es anónima y confidencial</p>
              <p>Powered by FocalizaHR - Inteligencia Organizacional</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar emails en batches para evitar límites de rate
    const batchSize = 10;
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (participant) => {
        if (!participant.uniqueToken) {
          errors.push(`Participante ${participant.email}: Sin token único`);
          return;
        }

        try {
          await resend.emails.send({
            from: 'FocalizaHR <noreply@focalizahr.com>',
            to: participant.email,
            subject: `Tu opinión importa - ${account.companyName}`,
            html: getEmailTemplate(participant, participant.uniqueToken),
          });
          
          queuedCount++;
        } catch (emailError) {
          errors.push(`Error enviando a ${participant.email}: ${emailError instanceof Error ? emailError.message : 'Error desconocido'}`);
        }
      });

      await Promise.all(batchPromises);
      
      // Pausa pequeña entre batches para respetar rate limits
      if (i + batchSize < participants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { queued: queuedCount, errors };

  } catch (error) {
    console.error('Error queueing campaign emails:', error);
    throw new Error('Error enviando emails de campaña');
  }
}

// Handler PUT para activación de campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Campaign activation request:', params.id);
    
    // Verificar autenticación
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'activate') {
      return NextResponse.json(
        { success: false, error: 'Acción no válida. Usa "activate"' },
        { status: 400 }
      );
    }

    const campaignId = params.id;

    // Buscar la campaña con todas las validaciones
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: authResult.user.id
      },
      include: {
        account: { 
          select: { 
            companyName: true, 
            adminEmail: true,
            subscriptionTier: true
          } 
        },
        campaignType: { 
          select: { 
            name: true, 
            slug: true 
          } 
        },
        participants: { 
          select: { 
            id: true, 
            hasResponded: true 
          } 
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Campaign found:', campaign.name, 'Status:', campaign.status);

    // Validaciones previas a la activación
    const validationErrors: string[] = [];

    // 1. Estado debe ser 'draft'
    if (campaign.status !== 'draft') {
      validationErrors.push('Solo se pueden activar campañas en estado borrador');
    }

    // 2. Mínimo 5 participantes
    if (campaign.participants.length < 5) {
      validationErrors.push(`Mínimo 5 participantes requeridos (actual: ${campaign.participants.length})`);
    }

    // 3. Fechas válidas
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    if (startDate > endDate) {
      validationErrors.push('Fecha de inicio debe ser anterior a fecha de fin');
    }

    if (endDate < now) {
      validationErrors.push('Fecha de fin debe ser futura');
    }

    // 4. Verificar límites de cuenta
    const activeCampaignsCount = await prisma.campaign.count({
      where: {
        accountId: authResult.user.id,
        campaignTypeId: campaign.campaignTypeId,
        status: 'active'
      }
    });

    // Límite por defecto: 1 activa por tipo de campaña
    const maxActiveCampaigns = 1;
    if (activeCampaignsCount >= maxActiveCampaigns) {
      validationErrors.push(`Límite de campañas activas del tipo "${campaign.campaignType.name}" alcanzado (máximo: ${maxActiveCampaigns})`);
    }

    // Si hay errores de validación, retornar
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validación fallida',
          validationErrors 
        },
        { status: 409 }
      );
    }

    console.log('🔄 Starting activation process...');

    // Proceso de activación en transacción
    const activationResult = await prisma.$transaction(async (tx) => {
      // 1. Generar tokens únicos para participantes que no los tienen
      const tokensGenerated = await generateMissingTokens(campaignId);
      console.log(`🎫 Generated ${tokensGenerated} missing tokens`);

      // 2. Actualizar estado de la campaña
      const updatedCampaign = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'active',
          activatedAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          account: { 
            select: { 
              companyName: true, 
              adminEmail: true 
            } 
          },
          campaignType: { 
            select: { 
              name: true 
            } 
          }
        }
      });

      // 3. Crear audit log
      await tx.auditLog.create({
        data: {
          campaignId,
          action: 'campaign_activated',
          userInfo: JSON.stringify({
            userId: authResult.user.id,
            userEmail: authResult.user.email,
            participantsCount: campaign.participants.length,
            activatedAt: new Date().toISOString()
          }),
          timestamp: new Date()
        }
      });

      return { updatedCampaign, tokensGenerated };
    });

    console.log('📧 Queueing campaign emails...');

    // 3. Enviar emails de invitación
    const emailResult = await queueCampaignEmails(campaignId);
    
    console.log(`✅ Emails queued: ${emailResult.queued}, Errors: ${emailResult.errors.length}`);

    // 4. Enviar notificación al cliente
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'campaign_activated',
          campaignId,
          recipientEmail: campaign.account.adminEmail,
          participantsCount: campaign.participants.length
        })
      });
    } catch (notificationError) {
      console.warn('Warning: Could not send activation notification:', notificationError);
      // No fallar si la notificación falla
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: `Campaña "${campaign.name}" activada exitosamente`,
      campaign: {
        id: activationResult.updatedCampaign.id,
        name: activationResult.updatedCampaign.name,
        status: activationResult.updatedCampaign.status,
        activatedAt: activationResult.updatedCampaign.activatedAt,
        company: activationResult.updatedCampaign.account.companyName
      },
      participantsCount: campaign.participants.length,
      emailsQueued: emailResult.queued,
      emailErrors: emailResult.errors.length,
      tokensGenerated: activationResult.tokensGenerated,
      nextSteps: [
        'Los participantes recibirán emails de invitación',
        'Monitorea el progreso desde el dashboard',
        'Resultados disponibles al finalizar la campaña'
      ]
    });

  } catch (error) {
    console.error('Error activating campaign:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor activando campaña',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}