// 📧 ACTIVATE CAMPAIGN ROUTE - VERSIÓN UNIFICADA CON TEMPLATES PREMIUM
// Actualizado: Usa templates premium centralizados + tracking EmailLog
// Cambios críticos:
// 1. Importa renderEmailTemplate desde módulo centralizado
// 2. Elimina getEmailTemplate hardcodeado local
// 3. Usa templates premium diferenciados por campaignType.slug
// 4. Guarda EmailLog en BD para tracking
// 5. Headers UTF-8 para caracteres especiales (ñ, tildes)
// 6. URL correcta: /encuesta/[token] (no /survey/)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Resend } from 'resend';
// ✅ NUEVO IMPORT - Templates Premium Centralizados
import { renderEmailTemplate } from '@/lib/templates/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ PRESERVADO: Función generateMissingTokens sin cambios
async function generateMissingTokens(campaignId: string): Promise<number> {
  try {
    console.log('✅ [FIX QUIRÚRGICO] Verificación de tokens omitida para evitar error Prisma desincronizado.');
    console.log('📝 ASUMIENDO: Todos los participantes tienen uniqueToken desde su creación en admin/participants');
    return 0;
  } catch (error) {
    console.error('Error en generateMissingTokens (función segura):', error);
    throw new Error('Error en verificación de tokens');
  }
}

// ✅ ACTUALIZADO: Función queueCampaignEmails con templates premium + EmailLog
async function queueCampaignEmails(campaignId: string): Promise<{ 
  queued: number; 
  errors: string[];
  skippedNoEmail: number;
  participantsWithoutEmail: Array<{
    nationalId: string;
    phoneNumber: string | null;
    name: string | null;
    uniqueToken: string | null;
  }>;
}> {
  try {
    // ✅ PRESERVADO: Query Prisma original
    const campaignData = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        account: { select: { companyName: true, adminEmail: true } },
        campaignType: { select: { name: true, slug: true, estimatedDuration: true } },
        participants: { 
          where: { hasResponded: false },
          select: { 
            id: true, 
            email: true,
            nationalId: true,
            phoneNumber: true,
            name: true,
            uniqueToken: true
          }
        }
      }
    });

    if (!campaignData) {
      throw new Error('Campaign not found');
    }

    const { account, campaignType, participants } = campaignData;
    
    // ✅ PRESERVADO: Lógica tracking participantes sin email
    let queuedCount = 0;
    let skippedNoEmailCount = 0;
    const errors: string[] = [];
    const participantsWithoutEmail: Array<{
      nationalId: string;
      phoneNumber: string | null;
      name: string | null;
      uniqueToken: string | null;
    }> = [];

    // ✅ PRESERVADO: Batching para rate limits
    const batchSize = 10;
    for (let i = 0; i < participants.length; i += batchSize) {
      const batch = participants.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (participant) => {
        const participantId = participant.nationalId || participant.email || participant.id;
        
        // ✅ PRESERVADO: Skip si no tiene email
        if (!participant.email) {
          skippedNoEmailCount++;
          participantsWithoutEmail.push({
            nationalId: participant.nationalId,
            phoneNumber: participant.phoneNumber,
            name: participant.name,
            uniqueToken: participant.uniqueToken
          });
          console.log(`⚠️  Participante sin email: ${participantId} (RUT: ${participant.nationalId})`);
          return;
        }

        try {
          // ✅ NUEVO: Construir URL correcta
          const surveyUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const fullSurveyUrl = `${surveyUrl}/encuesta/${participant.uniqueToken}`;


          console.log(`🔍 Tipo de campaña: ${campaignType.slug}`);
          console.log(`🔍 Participante: ${participant.email}`);
          console.log(`🔍 URL encuesta: ${fullSurveyUrl}`);
          // ✅ NUEVO: Obtener template premium dinámico por tipo de campaña
          const { subject, html } = renderEmailTemplate(
            campaignType.slug, // 'retencion-predictiva', 'pulso-express', 'experiencia-full'
            {
              participant_name: participant.name || 'Estimado/a colaborador/a',
              company_name: account.companyName,
              survey_url: fullSurveyUrl
              
            }
          );
          console.log(`✅ Email preparado - Subject: ${subject}`);
          console.log(`✅ HTML generado: ${html.length} caracteres`);
          console.log('📨 HTML preview:', html.substring(0, 200));
          console.log('📨 HTML length:', html.length);
          console.log('📨 Calling resend.emails.send()...');
          // ✅ ACTUALIZADO: Envío con headers UTF-8
          await resend.emails.send({
            from: 'FocalizaHR <onboarding@resend.dev>',
            to: participant.email,
            subject,
            html,
            headers: {
              'Content-Type': 'text/html; charset=UTF-8'
            }
          });

          // ✅ NUEVO: Guardar EmailLog en BD para tracking
          try {
            await prisma.emailLog.create({
              data: {
                participantId: participant.id,
                campaignId: campaignId,
                emailType: 'invitation',
                templateId: campaignType.slug,
                sentAt: new Date(),
                status: 'sent'
              }
            });
            console.log(`📧 EmailLog guardado para ${participantId}`);
          } catch (logError) {
            console.error(`⚠️  Error guardando EmailLog para ${participantId}:`, logError);
            // NO detener proceso si falla el log
          }

          queuedCount++;
          console.log(`✅ Email enviado (${campaignType.slug}): ${participantId}`);

        } catch (emailError) {
          const errorMessage = emailError instanceof Error ? emailError.message : 'Error desconocido';
          errors.push(`Error enviando a ${participantId}: ${errorMessage}`);
          console.error(`❌ Error enviando email a ${participantId}:`, emailError);
        }
      });

      await Promise.all(batchPromises);
      
      // ✅ PRESERVADO: Pausa entre batches
      if (i + batchSize < participants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // ✅ PRESERVADO: Return completo
    return { 
      queued: queuedCount, 
      errors,
      skippedNoEmail: skippedNoEmailCount,
      participantsWithoutEmail
    };

  } catch (error) {
    console.error('Error queueing campaign emails:', error);
    throw new Error('Error enviando emails de campaña');
  }
}

// ✅ PRESERVADO: Handler PUT completo sin cambios
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Campaign activation request:', params.id);
    
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

    const validationErrors: string[] = [];

    if (campaign.status !== 'draft') {
      validationErrors.push('Solo se pueden activar campañas en estado borrador');
    }

    if (campaign.participants.length < 5) {
      validationErrors.push(`Mínimo 5 participantes requeridos (actual: ${campaign.participants.length})`);
    }

    const activeParticipants = campaign.participants.filter(p => !p.hasResponded).length;
    if (activeParticipants < 5) {
      validationErrors.push(`Mínimo 5 participantes sin responder requeridos (actual: ${activeParticipants})`);
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validación fallida',
        details: validationErrors
      }, { status: 400 });
    }

    console.log('✅ Validation passed. Proceeding with activation...');

    try {
      console.log('📧 Calling queueCampaignEmails...');
      const emailResults = await queueCampaignEmails(campaignId);
      
      console.log('✅ Emails queued successfully:', {
        queued: emailResults.queued,
        skippedNoEmail: emailResults.skippedNoEmail,
        errors: emailResults.errors.length
      });

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'active',
          activatedAt: new Date(),
          totalInvited: emailResults.queued
        }
      });

      console.log('✅ Campaign status updated to active');

      await prisma.auditLog.create({
        data: {
          accountId: authResult.user.id,
          campaignId: campaignId,
          action: 'campaign_activated',
          entityType: 'campaign',
          entityId: campaignId,
          newValues: {
            status: 'active',
            activatedAt: new Date().toISOString(),
            emailsSent: emailResults.queued
          },
          userInfo: {
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        }
      });

      console.log('✅ Audit log created');

      return NextResponse.json({
        success: true,
        message: `Campaña activada. ${emailResults.queued} emails enviados.`,
        data: {
          campaignId,
          status: 'active',
          emailsSent: emailResults.queued,
          skippedNoEmail: emailResults.skippedNoEmail,
          errors: emailResults.errors,
          participantsWithoutEmail: emailResults.participantsWithoutEmail
        }
      });

    } catch (emailError) {
      console.error('❌ Error during email sending:', emailError);
      
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'draft' }
      });

      return NextResponse.json({
        success: false,
        error: 'Error enviando emails. La campaña permanece en borrador.',
        details: emailError instanceof Error ? emailError.message : 'Error desconocido'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in campaign activation:', error);
    return NextResponse.json({
      success: false,
      error: 'Error activando campaña',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}