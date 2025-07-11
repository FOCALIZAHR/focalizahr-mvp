// FOCALIZAHR - Email Automation API Route
// Archivo: src/app/api/admin/campaigns/[id]/email-automation/route.ts
// SEPARADO: Primera función POST del archivo original

import { NextRequest } from 'next/server';
import { emailAutomationService } from '@/lib/services/email-automation';

// GET - Obtener configuración automation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    // Validar configuración
    const isValid = await emailAutomationService.validateAutomationConfig(campaignId);
    
    return Response.json({
      success: true,
      campaignId,
      automationEnabled: isValid,
      message: 'Automation configuration retrieved'
    });

  } catch (error) {
    console.error('Error getting automation config:', error);
    return Response.json(
      { error: 'Failed to get automation configuration' },
      { status: 500 }
    );
  }
}

// POST - Activar email automation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    // Validar configuración
    const isValid = await emailAutomationService.validateAutomationConfig(campaignId);
    if (!isValid) {
      return Response.json(
        { error: 'Campaign configuration is invalid for email automation' },
        { status: 400 }
      );
    }

    // Enviar invitaciones
    const metrics = await emailAutomationService.sendCampaignInvitations(campaignId);
    
    // Programar recordatorios
    await emailAutomationService.scheduleReminders(campaignId);

    return Response.json({
      success: true,
      message: `Email automation activated for campaign ${campaignId}`,
      metrics
    });

  } catch (error) {
    console.error('Error activating email automation:', error);
    return Response.json(
      { error: 'Failed to activate email automation' },
      { status: 500 }
    );
  }
}