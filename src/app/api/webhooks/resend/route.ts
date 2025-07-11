// FOCALIZAHR - Email Webhook API Route
// Archivo: src/app/api/webhooks/resend/route.ts
// SEPARADO: Segunda función POST del archivo original

import { NextRequest } from 'next/server';
import { emailAutomationService } from '@/lib/services/email-automation';

// POST - Procesar webhook Resend
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    
    // Verificar signature si está configurada
    const signature = request.headers.get('resend-signature');
    if (process.env.RESEND_WEBHOOK_SECRET && signature) {
      // TODO: Implementar verificación según documentación Resend
      console.log('🔐 Webhook signature verification needed');
    }

    // Procesar webhook
    await emailAutomationService.processWebhook(webhookData);

    return Response.json({ 
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return Response.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}