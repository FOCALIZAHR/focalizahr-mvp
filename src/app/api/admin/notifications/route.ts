// src/app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Templates de email para diferentes tipos de notificación
const emailTemplates = {
  participants_loaded: {
    subject: 'Participantes cargados - Campaña lista para activar',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Campaña Lista - FocalizaHR</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .stats { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .stat-item { display: inline-block; margin: 0 20px 10px 0; }
            .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
            .stat-label { font-size: 14px; color: #666; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Tu campaña está lista!</h1>
              <p>Los participantes han sido cargados exitosamente</p>
            </div>
            
            <div class="content">
              <h2>Hola, ${data.companyName}</h2>
              
              <p>Excelentes noticias! Hemos procesado y cargado los participantes para tu campaña:</p>
              
              <div class="stats">
                <h3><strong>${data.campaignName}</strong></h3>
                <p><em>Tipo:</em> ${data.campaignType}</p>
                
                <div style="margin: 20px 0;">
                  <div class="stat-item">
                    <div class="stat-number">${data.participantsCount}</div>
                    <div class="stat-label">Participantes cargados</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${data.periodDays}</div>
                    <div class="stat-label">Días de duración</div>
                  </div>
                </div>
                
                <p><strong>Período:</strong> ${data.startDate} al ${data.endDate}</p>
              </div>
              
              <h3>¿Qué sigue?</h3>
              <ol>
                <li><strong>Revisa la configuración</strong> - Ingresa al dashboard para verificar que todo esté correcto</li>
                <li><strong>Activa la campaña</strong> - Cuando estés listo, haz click en "Activar Campaña"</li>
                <li><strong>Emails automáticos</strong> - Se enviarán invitaciones inmediatamente a todos los participantes</li>
                <li><strong>Monitoreo en tiempo real</strong> - Sigue el progreso desde tu dashboard</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" class="button">
                  Ir al Dashboard →
                </a>
              </div>
              
              <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p><strong>💡 Consejo FocalizaHR:</strong></p>
                <p>Para obtener la mejor participación, te recomendamos activar la campaña durante horario laboral (9:00 - 17:00) y preferiblemente al inicio de la semana.</p>
              </div>
              
              <p>Si tienes alguna consulta o necesitas ajustes, no dudes en responder este email. Nuestro equipo estará disponible para apoyarte.</p>
              
              <p>¡Estamos emocionados de ver los insights que obtendrás!</p>
              
              <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>Equipo FocalizaHR</strong><br>
                <em>Inteligencia organizacional para PyMEs</em>
              </p>
            </div>
            
            <div class="footer">
              <p>FocalizaHR | Ecosistema de Análisis Organizacional</p>
              <p>Este email fue enviado porque solicitas una campaña en nuestra plataforma.</p>
            </div>
          </div>
        </body>
      </html>
    `
  },

  campaign_activated: {
    subject: 'Campaña activada - Emails enviados a participantes',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Campaña Activada - FocalizaHR</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .stats { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Campaña Activada!</h1>
              <p>Los emails han sido enviados exitosamente</p>
            </div>
            
            <div class="content">
              <h2>Hola, ${data.companyName}</h2>
              
              <p>Tu campaña <strong>"${data.campaignName}"</strong> ha sido activada exitosamente.</p>
              
              <div class="stats">
                <p><strong>📧 Emails enviados:</strong> ${data.participantsCount} participantes</p>
                <p><strong>⏰ Activada:</strong> ${data.activatedAt}</p>
                <p><strong>📅 Cierre:</strong> ${data.endDate}</p>
              </div>
              
              <h3>¿Qué pasa ahora?</h3>
              <ul>
                <li>Los participantes recibirán un email con link único para completar la encuesta</li>
                <li>Puedes monitorear el progreso en tiempo real desde tu dashboard</li>
                <li>Se enviarán recordatorios automáticos a quienes no hayan respondido</li>
                <li>Los resultados se procesarán automáticamente al finalizar</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" class="button">
                  Monitorear Progreso →
                </a>
              </div>
              
              <p>Estaremos monitoreando la participación y te notificaremos si detectamos alguna oportunidad de mejora.</p>
              
              <p>¡Excelente decisión iniciando este proceso de mejora organizacional!</p>
              
              <p style="margin-top: 30px;">
                Saludos,<br>
                <strong>Equipo FocalizaHR</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>FocalizaHR | Dashboard: ${data.dashboardUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
};

// Función para enviar notificación por email
async function sendNotificationEmail(
  type: keyof typeof emailTemplates,
  recipientEmail: string,
  data: any
) {
  try {
    const template = emailTemplates[type];
    
    const emailResponse = await resend.emails.send({
      from: 'FocalizaHR <noreply@focalizahr.com>',
      to: recipientEmail,
      subject: template.subject,
      html: template.getHtml(data),
    });

    return {
      success: true,
      emailId: emailResponse.data?.id,
      error: emailResponse.error
    };

  } catch (error) {
    console.error('Error sending notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido enviando email'
    };
  }
}

// Handler POST principal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, campaignId, recipientEmail, participantsCount } = body;

    if (!type || !campaignId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: type, campaignId, recipientEmail' },
        { status: 400 }
      );
    }

    // Verificar que el tipo de notificación es válido
    if (!emailTemplates[type as keyof typeof emailTemplates]) {
      return NextResponse.json(
        { error: 'Tipo de notificación no válido' },
        { status: 400 }
      );
    }

    // Obtener datos de la campaña
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        account: { 
          select: { 
            companyName: true, 
            adminEmail: true 
          } 
        },
        campaignType: { 
          select: { 
            name: true, 
            slug: true 
          } 
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos para el template
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    const templateData = {
      companyName: campaign.account.companyName,
      campaignName: campaign.name,
      campaignType: campaign.campaignType.name,
      participantsCount,
      startDate: new Date(campaign.startDate).toLocaleDateString('es-CL'),
      endDate: new Date(campaign.endDate).toLocaleDateString('es-CL'),
      periodDays: Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      activatedAt: new Date().toLocaleString('es-CL'),
      dashboardUrl
    };

    // Enviar email
    const emailResult = await sendNotificationEmail(
      type as keyof typeof emailTemplates,
      recipientEmail,
      templateData
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Error enviando email de notificación', details: emailResult.error },
        { status: 500 }
      );
    }

    // Guardar log de notificación (opcional)
    try {
      await prisma.auditLog.create({
        data: {
          campaignId,
          action: `notification_${type}`,
          userInfo: JSON.stringify({
            recipientEmail,
            emailId: emailResult.emailId,
            sentAt: new Date().toISOString()
          }),
        }
      });
    } catch (logError) {
      console.warn('Error saving notification log:', logError);
      // No fallar si no se puede guardar el log
    }

    return NextResponse.json({
      success: true,
      message: `Notificación enviada exitosamente`,
      emailId: emailResult.emailId,
      type,
      recipient: recipientEmail
    });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}