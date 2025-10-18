// API TEMPLATE USAGE TRACKING - FocalizaHR
// src/app/api/templates/usage/route.ts
// Backend integration para Kit Comunicación Maestro v3.0

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// Interface para el request de tracking
interface TemplateUsageRequest {
  templateId: string;
  finalText: string;
  campaignId: string;
  companyName?: string;
  industry?: string;
  usedAt: string;
}

// Interface para audit log
interface AuditLogEntry {
  accountId: string;
  campaignId: string;
  action: string;
  entityType: string;
  entityId: string;
  newValues: any;
  userInfo: any;
}

export async function POST(request: NextRequest) {
  try {
    // ✅ VERIFICAR AUTENTICACIÓN
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user?.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const accountId = authResult.user.accountId || authResult.user.id;

    // ✅ PARSEAR BODY REQUEST
    const body: TemplateUsageRequest = await request.json();
    const { 
      templateId, 
      finalText, 
      campaignId, 
      companyName, 
      industry, 
      usedAt 
    } = body;

    // ✅ VALIDACIONES BÁSICAS
    if (!templateId || !finalText || !campaignId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos requeridos: templateId, finalText, campaignId' 
        },
        { status: 400 }
      );
    }

    // ✅ VERIFICAR QUE LA CAMPAÑA PERTENECE AL ACCOUNT
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        accountId: accountId
      },
      include: {
        account: true,
        campaignType: true  // ✅ AGREGAR ESTA LÍNEA
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada o sin acceso' },
        { status: 404 }
      );
    }

    // ✅ BUSCAR O CREAR TEMPLATE EN BD
    let template = await prisma.communicationTemplate.findFirst({
      where: {
        id: templateId
      }
    });

    if (!template) {
      // Si no existe, crear un template custom
      template = await prisma.communicationTemplate.create({
        data: {
          id: templateId,
          templateType: 'custom',
          category: 'general',
          conditionRule: 'custom_created',
          templateText: finalText,
          variablesRequired: [],
          priority: 5,
          isActive: true,
          usageCount: 0
        }
      });
    }

    // ✅ INCREMENTAR USAGE COUNT
    await prisma.communicationTemplate.update({
      where: {
        id: template.id
      },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    // ✅ REGISTRAR EN AUDIT LOG
    const userInfo = {
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    };

    const auditEntry: Omit<AuditLogEntry, 'id'> = {
      accountId,
      campaignId,
      action: 'template_used',
      entityType: 'communication_template',
      entityId: templateId,
      newValues: {
        templateId,
        finalText,
        companyName: companyName || campaign.account?.companyName,
        industry: industry || 'General',
        originalText: template.templateText,
        wasModified: finalText !== template.templateText,
        usageCount: template.usageCount + 1
      },
      userInfo
    };

    await prisma.auditLog.create({
      data: auditEntry
    });

    // ✅ ANALYTICS ADICIONALES (OPCIONAL)
    // Podrías agregar métricas específicas aquí
    const analytics = {
      totalUsage: template.usageCount + 1,
      isCustomized: finalText !== template.templateText,
      textLength: finalText.length,
      company: campaign.account?.companyName,
      campaignType: campaign.campaignType?.name
    };

    // ✅ RESPUESTA EXITOSA
    return NextResponse.json({
      success: true,
      data: {
        templateId,
        usageTracked: true,
        usageCount: template.usageCount + 1,
        analytics
      },
      meta: {
        timestamp: new Date().toISOString(),
        campaignId,
        accountId
      }
    });

  } catch (error) {
    console.error('❌ Error tracking template usage:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

// ✅ GET - OBTENER ESTADÍSTICAS DE USO (OPCIONAL)
export async function GET(request: NextRequest) {
  try {
    // ✅ VERIFICAR AUTENTICACIÓN
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user?.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const accountId = authResult.user.accountId || authResult.user.id;
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    // ✅ OBTENER ESTADÍSTICAS DE TEMPLATES
    const templateStats = await prisma.communicationTemplate.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        templateType: true,
        category: true,
        templateText: true,
        usageCount: true,
        priority: true
      },
      orderBy: {
        usageCount: 'desc'
      }
    });

    // ✅ AUDIT LOG FILTRADO POR ACCOUNT
    const recentUsage = await prisma.auditLog.findMany({
      where: {
        accountId,
        action: 'template_used',
        ...(campaignId && { campaignId })
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        campaignId: true,
        entityId: true,
        newValues: true,
        createdAt: true
      }
    });

    // ✅ ESTADÍSTICAS AGREGADAS
    const totalUsage = templateStats.reduce((sum, template) => sum + template.usageCount, 0);
    const mostUsedTemplate = templateStats[0];
    const templatesByType = templateStats.reduce((acc, template) => {
      acc[template.templateType] = (acc[template.templateType] || 0) + template.usageCount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        templateStats,
        recentUsage,
        analytics: {
          totalUsage,
          mostUsedTemplate,
          templatesByType,
          totalTemplates: templateStats.length,
          accountUsage: recentUsage.length
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        accountId,
        campaignId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching template stats:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}