export const dynamic = 'force-dynamic';
// 🤖 MOTOR DE AUTOMATIZACIÓN EMAIL - CRON JOB
// 🔧 VERSIÓN: v5.0 PRODUCTION READY + ONBOARDING JOURNEY INTELLIGENCE
// 📅 Fecha: 10 Noviembre 2025
// 🎯 Cambios v5.0 (FASE 5 ONBOARDING):
//    - AGREGADA función processAutomationQueue() para procesar EmailAutomation
//    - MODIFICADO handler GET para ejecutar ambas lógicas en paralelo
//    - Sistema legacy (processReminders) preservado 100% intacto
//    - Rate limiting: 600ms delay entre emails (1.66/seg < 2/seg límite Resend)
// 🎯 Cambios v4.2.2 (previos):
//    - Captura real de { data, error } de Resend (sin falsos positivos)
//    - Validación robusta de fallos antes de guardar EmailLog
//    - Auditoría de errores en BD usando campo bounceReason existente
//    - Compatible con schema actual (sin migration requerida)
//    - Logs detallados con resendId para debugging
//    - Protección try-catch para guardado de logs (no bloquea proceso principal)
// Funcionalidad: Envío automático de recordatorios + Onboarding Journey Intelligence
// Trigger: Vercel Cron o servicio externo

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { renderEmailTemplate } from '@/lib/templates/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

// ⏱️ Helper para respetar rate limit de Resend (2 requests/segundo)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 🔐 Verificación de seguridad CRON_SECRET
function verifyCronAuth(request: NextRequest): boolean {
  // ✅ NUEVO: Detectar ejecución de Vercel Cron
  const vercelCron = request.headers.get('x-vercel-cron-bypass');
  if (vercelCron) {
    console.log('✅ Ejecución automática de Vercel Cron detectada');
    return true;
  }
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('⚠️ CRON_SECRET no configurado en variables de entorno');
    return false;
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Authorization header faltante o mal formado');
    return false;
  }
  
  const token = authHeader.substring(7); // Remover 'Bearer '
  return token === cronSecret;
}

// ============================================================================
// SISTEMA LEGACY: REMINDERS (PRESERVADO 100% INTACTO)
// ============================================================================

// 🎯 Función principal: Procesar recordatorios de campaña
async function processReminders(): Promise<{
  totalProcessed: number;
  reminder1Sent: number;
  reminder2Sent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let reminder1Sent = 0;
  let reminder2Sent = 0;

  try {
    // 1️⃣ Buscar campañas activas
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'active',
        sendReminders: true  // ✅ CAMBIO 1: Respetar configuración de campaña
      },
      include: {
        account: { select: { companyName: true } },
        campaignType: { select: { name: true, slug: true } },
        participants: {
          where: { hasResponded: false },
          select: {
            id: true,
            email: true,
            name: true,
            uniqueToken: true,
            nationalId: true,
            reminderCount: true  // ✅ CAMBIO 2: Incluir contador en select
          }
        }
      }
    });

    console.log(`📊 Procesando ${activeCampaigns.length} campañas activas`);

    // 2️⃣ Procesar cada campaña
    for (const campaign of activeCampaigns) {
      if (campaign.participants.length === 0) {
        console.log(`⏭️  Campaña ${campaign.id} sin participantes pendientes`);
        continue;
      }

      // 3️⃣ Para cada participante sin responder
      for (const participant of campaign.participants) {
        const participantId = participant.nationalId || participant.email || participant.id;
        
        // ✅ VALIDACIÓN TEMPRANA: Saltar si no tiene email
        if (!participant.email || participant.email.trim() === '') {
          console.log(`⚠️  Participante ${participantId} sin email, saltando`);
          continue;
        }

        // ✅ CAMBIO 3: Validar límite de recordatorios (máximo 2)
        if (participant.reminderCount >= 2) {
          console.log(`⏭️  Participante ${participantId} alcanzó límite de recordatorios (${participant.reminderCount}/2)`);
          continue;
        }

        try {
          // 4️⃣ Buscar último email de invitación enviado
          const invitationLog = await prisma.emailLog.findFirst({
            where: {
              participantId: participant.id,
              campaignId: campaign.id,
              emailType: 'invitation'
            },
            orderBy: { sentAt: 'desc' }
          });

          if (!invitationLog) {
            console.log(`⚠️  No hay invitación enviada para ${participantId}`);
            continue;
          }

          const daysSinceInvitation = Math.floor(
            (Date.now() - new Date(invitationLog.sentAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          // 5️⃣ LÓGICA DE REGLAS - Recordatorio 1 (después de 3 días)
          if (daysSinceInvitation >= 3 && daysSinceInvitation < 7) {
            // Verificar si ya se envió reminder1
            const reminder1Exists = await prisma.emailLog.findFirst({
              where: {
                participantId: participant.id,
                campaignId: campaign.id,
                emailType: 'reminder1'
              }
            });

            if (!reminder1Exists) {
              // 📧 Enviar Recordatorio 1
              await sendReminder(
                {
                  id: participant.id,
                  email: participant.email,
                  name: participant.name,
                  uniqueToken: participant.uniqueToken
                },
                campaign,
                'reminder1',
                '¡Todavía estás a tiempo! - Recordatorio'
              );
              reminder1Sent++;
              console.log(`✅ Reminder1 enviado a ${participantId}`);
              
              // ⏱️ Delay para respetar rate limit (600ms = 1.66 emails/seg < 2/seg)
              await delay(600);
            }
          }

          // 6️⃣ LÓGICA DE REGLAS - Recordatorio 2 (después de 7 días)
          if (daysSinceInvitation >= 7) {
            // Verificar si ya se envió reminder2
            const reminder2Exists = await prisma.emailLog.findFirst({
              where: {
                participantId: participant.id,
                campaignId: campaign.id,
                emailType: 'reminder2'
              }
            });

            if (!reminder2Exists) {
              // 📧 Enviar Recordatorio 2 (último aviso)
              await sendReminder(
                {
                  id: participant.id,
                  email: participant.email,
                  name: participant.name,
                  uniqueToken: participant.uniqueToken
                },
                campaign,
                'reminder2',
                'Última oportunidad - Cierre próximo'
              );
              reminder2Sent++;
              console.log(`✅ Reminder2 enviado a ${participantId}`);
              
              // ⏱️ Delay para respetar rate limit (600ms = 1.66 emails/seg < 2/seg)
              await delay(600);
            }
          }

        } catch (participantError) {
          const errorMsg = `Error procesando participante ${participantId}: ${
            participantError instanceof Error ? participantError.message : 'Error desconocido'
          }`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    }

    return {
      totalProcessed: activeCampaigns.length,
      reminder1Sent,
      reminder2Sent,
      errors
    };

  } catch (error) {
    console.error('❌ Error en processReminders:', error);
    throw error;
  }
}

// 📧 Función helper: Enviar recordatorio
async function sendReminder(
  participant: {
    id: string;
    email: string;
    name: string | null;
    uniqueToken: string | null;
  },
  campaign: {
    id: string;
    account: { companyName: string };
    campaignType: { slug: string };
  },
  reminderType: 'reminder1' | 'reminder2',
  customSubject: string
): Promise<void> {
  const surveyUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const fullSurveyUrl = `${surveyUrl}/encuesta/${participant.uniqueToken}`;

  // Usar template base pero con subject customizado para recordatorios
  const { html } = renderEmailTemplate(
    campaign.campaignType.slug,
    {
      participant_name: participant.name || 'Estimado/a colaborador/a',
      company_name: campaign.account.companyName,
      survey_url: fullSurveyUrl
    }
  );

  // 🔧 CAMBIO CRÍTICO 1: Capturar respuesta de Resend
  const { data, error } = await resend.emails.send({
    from: 'FocalizaHR <noreply@focalizahr.cl>',
    to: participant.email,
    subject: `${customSubject} - ${campaign.account.companyName}`,
    html,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    }
  });

  // 🔧 CAMBIO CRÍTICO 2: Validar error antes de continuar
  if (error) {
    console.error('❌ Resend API error:', {
      participantEmail: participant.email,
      participantId: participant.id,
      reminderType,
      campaignId: campaign.id,
      errorName: error.name,
      errorMessage: error.message,
      fullError: JSON.stringify(error)
    });
    
    // ✅ MEJORA v4.2: Guardar fallo en BD usando bounceReason
    // ✅ MEJORA v4.2.1: Proteger con try-catch para no bloquear proceso principal
    try {
      await prisma.emailLog.create({
        data: {
          participantId: participant.id,
          campaignId: campaign.id,
          emailType: reminderType,
          templateId: campaign.campaignType.slug,
          sentAt: new Date(),
          status: 'failed',
          bounceReason: JSON.stringify(error)
        }
      });
    } catch (logError) {
      console.error('⚠️ No se pudo guardar log de fallo en BD:', logError);
      // Continuar y lanzar error original de Resend
    }
    
    // ✅ Fallo registrado en BD (o intentado), ahora lanzar error para detener proceso
    throw new Error(`Resend API failed: ${error.message}`);
  }

  // 🔧 CAMBIO CRÍTICO 3: Verificar que data existe
  if (!data) {
    console.error('❌ Resend no devolvió data (caso edge):', {
      participantEmail: participant.email,
      participantId: participant.id,
      reminderType,
      campaignId: campaign.id
    });
    throw new Error('Resend API did not return data');
  }

  // 🔧 CAMBIO CRÍTICO 4: Log de éxito con información útil
  console.log('✅ Email enviado exitosamente:', {
    resendId: data.id,
    participantEmail: participant.email,
    participantId: participant.id,
    reminderType,
    campaignId: campaign.id,
    timestamp: new Date().toISOString()
  });

  // 🔧 CAMBIO CRÍTICO 5: SOLO guardar EmailLog si Resend confirmó el envío
  await prisma.emailLog.create({
    data: {
      participantId: participant.id,
      campaignId: campaign.id,
      emailType: reminderType,
      templateId: campaign.campaignType.slug,
      sentAt: new Date(),
      status: 'sent'
    }
  });

  // ✅ CAMBIO 4: Incrementar contador de recordatorios
  await prisma.participant.update({
    where: { id: participant.id },
    data: { 
      reminderCount: { increment: 1 },
      lastReminderSent: new Date()
    }
  });
}

// ============================================================================
// 🚀 NUEVO SISTEMA: ONBOARDING JOURNEY INTELLIGENCE (FASE 5)
// ============================================================================

/**
 * 🚀 NUEVO (FASE 5): Procesar cola de EmailAutomation
 * 
 * Busca registros pendientes en EmailAutomation (onboarding, futuras campañas automatizadas)
 * y los envía usando la infraestructura existente de emails.
 * 
 * Ejecuta en paralelo con processReminders() sin interferir.
 */
async function processAutomationQueue(): Promise<{
  totalProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let emailsSent = 0;
  const now = new Date();

  try {
    console.log('📧 [AutomationQueue] Iniciando procesamiento...');

    // 1️⃣ QUERY: Buscar emails programados que ya deben enviarse
    const pendingEmails = await prisma.emailAutomation.findMany({
      where: {
        enabled: true,                // Solo activos
        triggerAt: { lte: now }       // Ya pasó la hora de envío
      },
      include: {
        participant: {
          select: { 
            id: true, 
            email: true, 
            name: true, 
            uniqueToken: true 
          }
        },
        campaign: {
          include: {
            account: { 
              select: { companyName: true } 
            }
          }
        }
      },
      take: 50  // 🔒 RATE LIMITING: Máximo 50 por ejecución (50 * 0.6s = 30s)
    });

    if (pendingEmails.length === 0) {
      console.log('✅ [AutomationQueue] Sin emails pendientes.');
      return { totalProcessed: 0, emailsSent: 0, errors };
    }

    console.log(`📊 [AutomationQueue] Procesando ${pendingEmails.length} emails...`);

    // 2️⃣ LOOP: Procesar cada email secuencialmente
    for (const emailJob of pendingEmails) {
      const { participant, campaign, templateId } = emailJob;

      // ⚠️ VALIDACIÓN: Datos completos
      if (!participant || !campaign || !participant.email || !participant.uniqueToken) {
        const errorMsg = `Datos incompletos Job ID: ${emailJob.id}`;
        console.error(`⚠️ [AutomationQueue] ${errorMsg}`);
        errors.push(errorMsg);
        
        // Deshabilitar para no reintentar
        await prisma.emailAutomation.update({
          where: { id: emailJob.id },
          data: { 
            enabled: false, 
            processedAt: now 
          }
        });
        continue;
      }

      try {
        // 3️⃣ RENDERIZAR: Usar sistema centralizado
        const surveyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/encuesta/${participant.uniqueToken}`;
        
        const { subject, html } = renderEmailTemplate(
          templateId,  // 'onboarding-day-1', 'onboarding-day-7', etc.
          {
            participant_name: participant.name || 'Estimado/a colaborador/a',
            company_name: campaign.account.companyName,
            survey_url: surveyUrl
          }
        );

        // 4️⃣ ENVIAR: Resend API
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'FocalizaHR <noreply@focalizahr.cl>',
          to: participant.email,
          subject,
          html,
          headers: { 'Content-Type': 'text/html; charset=UTF-8' }
        });

        // ⚠️ PROTOCOLO 1: Capturar {data, error}
        if (error) throw new Error(JSON.stringify(error));
        if (!data) throw new Error('Resend no devolvió data');

        // 5️⃣ LOGGING: EmailLog (auditoría)
        await prisma.emailLog.create({
          data: {
            participantId: participant.id,
            campaignId: campaign.id,
            emailType: templateId,
            templateId: templateId,
            sentAt: now,
            status: 'sent'
          }
        });

        // 6️⃣ MARCAR PROCESADO: EmailAutomation
        await prisma.emailAutomation.update({
          where: { id: emailJob.id },
          data: { 
            enabled: false,      // Ya no debe procesarse
            processedAt: now 
          }
        });

        emailsSent++;
        console.log(`✅ [AutomationQueue] Email ${templateId} → ${participant.email}`);

        // 7️⃣ RATE LIMITING: OBLIGATORIO
        await new Promise(r => setTimeout(r, 600));  // 600ms delay

      } catch (sendError) {
        // ❌ ERROR HANDLING
        const errorMsg = `Error Job ${emailJob.id}: ${sendError instanceof Error ? sendError.message : 'Desconocido'}`;
        console.error(`❌ [AutomationQueue] ${errorMsg}`);
        errors.push(errorMsg);
        
        // Loggear fallo
        await prisma.emailLog.create({
          data: {
            participantId: participant.id,
            campaignId: campaign.id,
            emailType: templateId,
            templateId: templateId,
            sentAt: now,
            status: 'failed',
            bounceReason: errorMsg
          }
        });

        // Deshabilitar (evitar loop infinito)
        await prisma.emailAutomation.update({
          where: { id: emailJob.id },
          data: { 
            enabled: false, 
            processedAt: now 
          }
        });
      }
    }

    const summary = {
      totalProcessed: pendingEmails.length,
      emailsSent,
      errors
    };

    console.log('✅ [AutomationQueue] Completado:', summary);
    return summary;

  } catch (error) {
    console.error('❌ [AutomationQueue] Error fatal:', error);
    throw error;
  }
}

// ============================================================================
// 🎯 HTTP GET HANDLER - ENDPOINT PRINCIPAL (MODIFICADO FASE 5)
// ============================================================================

/**
 * 🎯 HTTP GET Handler - Endpoint principal del Cron
 * 
 * ✅ MODIFICADO (FASE 5): Ejecuta AMBAS lógicas en paralelo:
 * 1. processReminders() - Sistema legacy (reminder1, reminder2)
 * 2. processAutomationQueue() - Sistema nuevo (onboarding, futuras automatizaciones)
 * 
 * Vercel ejecuta este endpoint según schedule en vercel.json
 */
// ============================================================================
// 🎯 HTTP GET HANDLER CORREGIDO - COPIAR ESTA FUNCIÓN COMPLETA
// ============================================================================
// 
// REEMPLAZAR la función export async function GET() COMPLETA
// en src/app/api/cron/send-reminders/route.ts
//
// Este código RESUELVE el error de TypeScript con Promise.allSettled

export async function GET(request: NextRequest) {
  try {
    console.log('🤖 [Cron] Iniciado:', new Date().toISOString());

    // 🔐 AUTENTICACIÓN: CRON_SECRET obligatorio
    if (!verifyCronAuth(request)) {
      console.error('❌ [Cron] Autenticación fallida');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [Cron] Autenticación exitosa');

    // 🚀 EJECUTAR AMBAS LÓGICAS EN PARALELO
    const [legacyResult, automationResult] = await Promise.allSettled([
      processReminders(),       // 📨 Legacy: reminder1, reminder2
      processAutomationQueue()  // 🆕 Nuevo: onboarding, etc.
    ]);

    // 📊 CONSOLIDAR RESULTADOS CON TYPE GUARDS EXPLÍCITOS
    // ✅ FIX: Definir estructura completa para ambos casos (fulfilled/rejected)
    const legacyReminders = legacyResult.status === 'fulfilled' 
      ? legacyResult.value 
      : {
          totalProcessed: 0,
          reminder1Sent: 0,
          reminder2Sent: 0,
          errors: [legacyResult.reason?.message || 'Error desconocido']
        };
    
    const automationQueue = automationResult.status === 'fulfilled'
      ? automationResult.value
      : {
          totalProcessed: 0,
          emailsSent: 0,
          errors: [automationResult.reason?.message || 'Error desconocido']
        };

    // Estructura consolidada
    const results = {
      timestamp: new Date().toISOString(),
      legacyReminders,
      automationQueue
    };

    // ✅ LOG FINAL - Ahora TypeScript conoce la estructura exacta
    console.log('✅ [Cron] Completado:', {
      legacy: {
        reminder1: legacyReminders.reminder1Sent,
        reminder2: legacyReminders.reminder2Sent,
        errors: legacyReminders.errors.length
      },
      automation: {
        processed: automationQueue.totalProcessed,
        sent: automationQueue.emailsSent,
        errors: automationQueue.errors.length
      }
    });

    // 📤 RESPONSE
    return NextResponse.json({
      success: true,
      message: 'Procesamiento de emails completado',
      data: results
    });

  } catch (error) {
    // ❌ ERROR FATAL (no capturado por Promise.allSettled)
    console.error('❌ [Cron] Error fatal:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error crítico procesando cron',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}