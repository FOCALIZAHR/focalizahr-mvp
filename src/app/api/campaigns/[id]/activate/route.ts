// ════════════════════════════════════════════════════════════════════════════
// ACTIVATE CAMPAIGN ROUTE - Gate A v3.0 (Cola unificada de comunicaciones)
// ════════════════════════════════════════════════════════════════════════════
// Spec: .claude/tasks/SPEC_GATE_A_COMUNICACIONES_v3.md seccion 4
//
// CAMBIO CRITICO vs. version anterior:
//   - YA NO envia emails dentro del request HTTP (era el 504 con 25+ participantes)
//   - Encola CommunicationMessage con createMany + skipDuplicates (idempotente)
//   - Dispara primer batch del dispatcher via waitUntil (fire-and-forget)
//   - Respuesta HTTP < 3 segundos garantizada
//
// SEMANTICA CANONICA DE totalInvited:
//   totalInvited = personas cargadas a la campania, sin importar canal ni
//   si tienen contacto valido. MISMA DEFINICION que usa
//   process-results/route.ts:280-283 (calculateParticipationRate) y que
//   process-results consume como denominador.
//
//   Activate NO sobrescribe el valor heredado del upload. Si por bug previo
//   quedo en 0, se deriva de _count.participants al activar. Gate B NO debe
//   romper esta semantica (filtrar por canal infla la tasa de participacion).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { determineChannel } from '@/lib/services/channel-selector';
import {
  buildPhoneResolutionBatch,
  resolvePhone,
  type ParticipantForPhone,
} from '@/lib/services/resolvePhone';
import { WHATSAPP_INVITATION_SLUG } from '@/lib/templates/whatsapp-templates';

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Encolar mensajes de invitacion en CommunicationMessage (Gate B v3.0)
// ════════════════════════════════════════════════════════════════════════════
// Por participante:
//   - Resuelve el telefono via resolvePhone (4 estrategias + excepcion Performance)
//   - Determina canal via channel-selector (regla cero, nunca lanza) con el phone
//     ya resuelto
//   - 'email'    -> encola CommunicationMessage channel EMAIL (envio real Resend)
//   - 'whatsapp' -> encola CommunicationMessage channel WHATSAPP, toPhone poblado
//                   (despacho simulation en el dispatcher, sin envio real)
//   - 'none'     -> NO encola, acumula en el cubo sinContacto
// Encolado masivo: createMany + skipDuplicates para idempotencia via dedupKey.
type EnqueueResult = {
  // Breakdown de 3 canales (spec seccion 5)
  email: number;        // encolados channel EMAIL
  whatsapp: number;     // encolados channel WHATSAPP
  sinContacto: number;  // 'none', ni email ni phone validos
  totalCargados: number; // = personas sin responder procesadas (email+whatsapp+sinContacto)
};

async function enqueueCampaignMessages(campaignId: string): Promise<EnqueueResult> {
  const campaignData = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      account: { select: { id: true, companyName: true, country: true } },
      campaignType: { select: { slug: true } },
      participants: {
        where: { hasResponded: false },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          nationalId: true,
          name: true,
          uniqueToken: true,
          // Gate B: escalares para resolvePhone (sin includes; el batch hace el I/O)
          employeeId: true,
          evaluationAssignmentId: true,
        },
      },
    },
  });

  if (!campaignData) {
    throw new Error('Campaign not found');
  }

  const { account, campaignType, participants } = campaignData;
  const surveyBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Contexto de resolucion de telefono: 3 queries batched, cero N+1.
  const participantsForPhone: ParticipantForPhone[] = participants.map((p) => ({
    id: p.id,
    phoneNumber: p.phoneNumber,
    nationalId: p.nationalId,
    employeeId: p.employeeId,
    evaluationAssignmentId: p.evaluationAssignmentId,
  }));
  const phoneCtx = await buildPhoneResolutionBatch(
    participantsForPhone,
    account.id,
    prisma
  );

  type MessageData = {
    accountId: string;
    channel: 'EMAIL' | 'WHATSAPP';
    templateSlug: string;
    variables: Record<string, string>;
    toEmail?: string;
    toPhone?: string;
    participantId: string;
    campaignId: string;
    messageType: string;
    dedupKey: string;
    scheduledAt: Date;
  };

  const messagesToCreate: MessageData[] = [];
  let emailCount = 0;
  let whatsappCount = 0;
  let sinContactoCount = 0;
  const now = new Date();

  for (const p of participants) {
    // Estrategia 1-3 + excepcion Performance (2b). Pobla el dato que el selector
    // no busca. Performance se rutea SOLO por evaluationAssignmentId, nunca por
    // nationalId (el WhatsApp iria al evaluado, no al evaluador).
    const resolvedPhone = resolvePhone(
      {
        id: p.id,
        phoneNumber: p.phoneNumber,
        nationalId: p.nationalId,
        employeeId: p.employeeId,
        evaluationAssignmentId: p.evaluationAssignmentId,
      },
      phoneCtx
    );

    const channel = determineChannel({
      email: p.email,
      phoneNumber: resolvedPhone,
      // Consent (preferredChannel/channelConsentAt) se difiere a Gate C: hoy los
      // participantes aun no lo traen poblado. La puerta queda lista en el selector.
    });

    if (channel === 'email') {
      if (!p.email) {
        // Defensa: determineChannel dijo email sin email valido (no deberia pasar).
        sinContactoCount++;
        continue;
      }
      messagesToCreate.push({
        accountId: account.id,
        channel: 'EMAIL',
        templateSlug: campaignType.slug,
        variables: {
          participant_name: p.name || 'Estimado/a colaborador/a',
          company_name: account.companyName,
          survey_url: `${surveyBaseUrl}/encuesta/${p.uniqueToken}`,
          // Snapshot del pais al momento de encolar para determinismo i18n.
          country: account.country,
        },
        toEmail: p.email,
        participantId: p.id,
        campaignId,
        messageType: 'invitation',
        dedupKey: `invitation:${p.id}`,
        scheduledAt: now,
      });
      emailCount++;
      continue;
    }

    if (channel === 'whatsapp' && resolvedPhone) {
      messagesToCreate.push({
        accountId: account.id,
        channel: 'WHATSAPP',
        templateSlug: WHATSAPP_INVITATION_SLUG,
        variables: {
          participant_name: p.name || 'Estimado/a colaborador/a',
          company_name: account.companyName,
          survey_url: `${surveyBaseUrl}/encuesta/${p.uniqueToken}`,
        },
        toPhone: resolvedPhone,
        participantId: p.id,
        campaignId,
        messageType: 'invitation',
        // Mismo dedupKey que email: un participante resuelve a un solo canal,
        // asi que la idempotencia por participante se mantiene intacta.
        dedupKey: `invitation:${p.id}`,
        scheduledAt: now,
      });
      whatsappCount++;
      continue;
    }

    // 'none' (o whatsapp sin phone resoluble, que no deberia ocurrir)
    sinContactoCount++;
  }

  if (messagesToCreate.length > 0) {
    await prisma.communicationMessage.createMany({
      data: messagesToCreate,
      skipDuplicates: true,
    });
  }

  return {
    email: emailCount,
    whatsapp: whatsappCount,
    sinContacto: sinContactoCount,
    totalCargados: emailCount + whatsappCount + sinContactoCount,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Dispara primer batch del dispatcher (Capa 1 del disparo triple)
// ════════════════════════════════════════════════════════════════════════════
function fireDispatcherFirstBatch(): void {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const cronSecret = process.env.CRON_SECRET;

  if (!baseUrl || !cronSecret) {
    console.warn('[Activate] Sin base URL o CRON_SECRET; capa 1 dispatcher omitida (capa 3 cubrira)');
    return;
  }

  // waitUntil sobrevive a la respuesta HTTP: el admin no espera el envio
  waitUntil(
    fetch(`${baseUrl}/api/cron/message-dispatcher?chain=0`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    }).catch((err) => {
      console.error('[Activate] Capa 1 dispatcher fetch failed:', err instanceof Error ? err.message : err);
    })
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PUT /api/campaigns/[id]/activate
// ════════════════════════════════════════════════════════════════════════════
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        accountId: authResult.user.id,
      },
      include: {
        account: {
          select: {
            companyName: true,
            adminEmail: true,
            subscriptionTier: true,
          },
        },
        campaignType: {
          select: {
            name: true,
            slug: true,
          },
        },
        participants: {
          select: {
            id: true,
            hasResponded: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // ──────────────────────────────────────────────────────────────────────
    // VALIDACIONES (sin cambios desde version anterior)
    // ──────────────────────────────────────────────────────────────────────
    const validationErrors: string[] = [];

    if (campaign.status !== 'draft') {
      validationErrors.push('Solo se pueden activar campañas en estado borrador');
    }

    if (campaign.participants.length < 5) {
      validationErrors.push(`Mínimo 5 participantes requeridos (actual: ${campaign.participants.length})`);
    }

    const activeParticipants = campaign.participants.filter((p) => !p.hasResponded).length;
    if (activeParticipants < 5) {
      validationErrors.push(`Mínimo 5 participantes sin responder requeridos (actual: ${activeParticipants})`);
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validación fallida',
        details: validationErrors,
      }, { status: 400 });
    }

    // ──────────────────────────────────────────────────────────────────────
    // ENCOLADO (Gate A v3.0): instantaneo, sin envio en el request
    // ──────────────────────────────────────────────────────────────────────
    const enqueueResult = await enqueueCampaignMessages(campaignId);

    // ──────────────────────────────────────────────────────────────────────
    // ACTIVAR CAMPANIA
    //
    // CONTRATO DE totalInvited (semantica canonica - ver header del archivo):
    // NO sobrescribir con los encolados (eso filtra por canal e infla la
    // tasa de participacion downstream).
    //
    // Si el upload previo dejo totalInvited > 0, lo respetamos. Si quedo en
    // 0 por bug heredado, lo derivamos del count real de participantes.
    // ──────────────────────────────────────────────────────────────────────
    const totalInvitedFallback = campaign.totalInvited > 0
      ? campaign.totalInvited
      : campaign._count.participants;

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'active',
        activatedAt: new Date(),
        totalInvited: totalInvitedFallback,
      },
    });

    // ──────────────────────────────────────────────────────────────────────
    // AUDITORIA
    // ──────────────────────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        accountId: authResult.user.id,
        campaignId,
        action: 'campaign_activated',
        entityType: 'campaign',
        entityId: campaignId,
        newValues: {
          status: 'active',
          activatedAt: new Date().toISOString(),
          // Semantica honesta: cuantos mensajes quedaron en cola, no cuantos
          // se enviaron (el envio es async via dispatcher). Breakdown por canal.
          messagesQueued: enqueueResult.email + enqueueResult.whatsapp,
          breakdown: {
            email: enqueueResult.email,
            whatsapp: enqueueResult.whatsapp,
            sinContacto: enqueueResult.sinContacto,
          },
        },
        userInfo: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      },
    });

    // ──────────────────────────────────────────────────────────────────────
    // CAPA 1 DEL DISPARO TRIPLE: primer batch del dispatcher en background
    // ──────────────────────────────────────────────────────────────────────
    fireDispatcherFirstBatch();

    const totalQueued = enqueueResult.email + enqueueResult.whatsapp;

    return NextResponse.json({
      success: true,
      message: `Campaña activada. ${totalQueued} mensajes en cola.`,
      data: {
        campaignId,
        status: 'active',
        breakdown: {
          email: enqueueResult.email,
          whatsapp: enqueueResult.whatsapp,
          sinContacto: enqueueResult.sinContacto,
        },
        totalCargados: enqueueResult.totalCargados,
      },
    });
  } catch (error) {
    console.error('[Activate] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error activando campaña',
      details: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}
