// src/app/api/admin/accounts/settings/route.ts
// API para configuración de reportes por empresa

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

/**
 * GET /api/admin/accounts/settings
 * Obtiene configuración de reportes de la cuenta
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // FOCALIZAHR_ADMIN puede consultar otra cuenta
    const searchParams = request.nextUrl.searchParams;
    const queryAccountId = searchParams.get('accountId');
    const targetAccountId = (userContext.role === 'FOCALIZAHR_ADMIN' && queryAccountId)
      ? queryAccountId
      : userContext.accountId;

    const account = await prisma.account.findUnique({
      where: { id: targetAccountId },
      select: {
        id: true,
        companyName: true,
        reportDeliveryDelayDays: true,
        reportLinkExpirationDays: true,
        enableEmployeeReports: true
      }
    });

    if (!account) {
      return NextResponse.json({ success: false, error: 'Cuenta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        accountId: account.id,
        companyName: account.companyName,
        reportDeliveryDelayDays: account.reportDeliveryDelayDays,
        reportLinkExpirationDays: account.reportLinkExpirationDays,
        enableEmployeeReports: account.enableEmployeeReports
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/accounts/settings
 * Actualiza configuración de reportes
 */
export async function PUT(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId: bodyAccountId, reportDeliveryDelayDays, reportLinkExpirationDays, enableEmployeeReports } = body;

    const targetAccountId = (userContext.role === 'FOCALIZAHR_ADMIN' && bodyAccountId)
      ? bodyAccountId
      : userContext.accountId;

    // Validaciones
    const updateData: any = {};

    if (reportDeliveryDelayDays !== undefined) {
      const days = Number(reportDeliveryDelayDays);
      if (days < 1 || days > 30) {
        return NextResponse.json({ success: false, error: 'Delay debe ser entre 1 y 30 dias' }, { status: 400 });
      }
      updateData.reportDeliveryDelayDays = days;
    }

    if (reportLinkExpirationDays !== undefined) {
      const days = Number(reportLinkExpirationDays);
      if (days < 7 || days > 90) {
        return NextResponse.json({ success: false, error: 'Expiracion debe ser entre 7 y 90 dias' }, { status: 400 });
      }
      updateData.reportLinkExpirationDays = days;
    }

    if (enableEmployeeReports !== undefined) {
      updateData.enableEmployeeReports = Boolean(enableEmployeeReports);
    }

    const updated = await prisma.account.update({
      where: { id: targetAccountId },
      data: updateData,
      select: {
        id: true,
        reportDeliveryDelayDays: true,
        reportLinkExpirationDays: true,
        enableEmployeeReports: true
      }
    });

    return NextResponse.json({
      success: true,
      settings: updated
    });

  } catch (error: any) {
    console.error('[API] Error actualizando settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
