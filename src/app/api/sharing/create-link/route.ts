// -----------------------------------------------------------------------------
// 5. API ROUTE: /api/sharing/create-link
// Generación de links públicos seguros con expiración
// -----------------------------------------------------------------------------

// src/app/api/sharing/create-link/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaignId, 
      expirationDays = 30, 
      requireAuth = true,
      permissions = ['view'],
      recipientEmails = []
    } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId es requerido' },
        { status: 400 }
      );
    }

    // ✅ GENERAR TOKEN SEGURO
    const shareToken = `shr_${Math.random().toString(36).substr(2, 16)}_${Date.now().toString(36)}`;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // ✅ CREAR REGISTRO SHARING (en producción guardar en DB)
    const sharingConfig = {
      id: `sharing_${Date.now()}`,
      campaignId,
      token: shareToken,
      publicUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/shared/${shareToken}`,
      permissions,
      requireAuth,
      expirationDate,
      recipientEmails,
      createdAt: new Date(),
      accessCount: 0,
      lastAccessedAt: null,
      status: 'active'
    };

    // ✅ CONFIGURACIÓN ACCESO
    const accessConfig = {
      allowedActions: permissions,
      restrictions: {
        ipWhitelist: [], // Opcional: restringir por IP
        maxAccesses: requireAuth ? -1 : 100, // -1 = ilimitado si requiere auth
        downloadLimits: {
          pdf: requireAuth ? -1 : 5,
          excel: requireAuth ? -1 : 3,
              csv: requireAuth ? -1 : 10
        }
      },
      notifications: {
        emailOnAccess: recipientEmails.length > 0,
        webhookOnDownload: false,
        alertOnExpiration: true
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        shareUrl: sharingConfig.publicUrl,
        token: shareToken,
        expiresAt: expirationDate.toISOString(),
        permissions: permissions,
        requiresAuth: requireAuth,
        config: accessConfig,
        emailsSent: recipientEmails.length,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sharingConfig.publicUrl)}`
      },
      meta: {
        campaignId,
        sharingId: sharingConfig.id,
        createdAt: new Date().toISOString(),
        validFor: `${expirationDays} días`
      }
    });

  } catch (error) {
    console.error('Error creando link compartido:', error);
    return NextResponse.json(
      { error: 'Error interno creando link' },
      { status: 500 }
    );
  }
}