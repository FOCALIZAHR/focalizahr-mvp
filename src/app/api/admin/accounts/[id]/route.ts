// /app/api/admin/accounts/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWTToken } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación para actualización
const updateAccountSchema = z.object({
  companyName: z.string().min(1).optional(),
  adminName: z.string().min(1).optional(),
  adminEmail: z.string().email().optional(),
  subscriptionTier: z.enum(['basic', 'pro', 'enterprise']).optional(),
  industry: z.string().optional().nullable(),
  companySize: z.string().optional().nullable(),
  company_logo: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'INACTIVE']).optional(),
});

// GET - Obtener datos de una cuenta específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol admin
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const payload = await verifyJWTToken(token);
    
    if (!payload || payload.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Buscar la cuenta
    const account = await prisma.account.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        companyName: true,
        adminName: true,
        adminEmail: true,
        subscriptionTier: true,
        industry: true,
        companySize: true,
        company_logo: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Agregar contadores útiles
        _count: {
          select: {
            campaigns: true,
            participants: true,
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      );
    }

    // Formatear respuesta para el frontend
    const formattedAccount = {
      id: account.id,
      companyName: account.companyName,
      adminName: account.adminName,
      adminEmail: account.adminEmail,
      subscriptionTier: account.subscriptionTier || 'basic',
      industry: account.industry || '',
      companySize: account.companySize || '',
      logoUrl: account.company_logo || '', // Mapeo a logoUrl para el frontend
      status: account.status || 'ACTIVE',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      stats: {
        totalCampaigns: account._count.campaigns,
        totalParticipants: account._count.participants,
      }
    };

    return NextResponse.json({
      success: true,
      data: formattedAccount
    });

  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la cuenta' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar datos de una cuenta
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol admin
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const payload = await verifyJWTToken(token);
    
    if (!payload || payload.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Parsear y validar datos del body
    const body = await request.json();
    
    // Mapear logoUrl a company_logo si viene del frontend
    if ('logoUrl' in body) {
      body.company_logo = body.logoUrl;
      delete body.logoUrl;
    }

    // Validar datos
    const validationResult = updateAccountSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Verificar que la cuenta existe
    const existingAccount = await prisma.account.findUnique({
      where: { id: params.id }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      );
    }

    // Si se está cambiando el email, verificar que no esté en uso
    if (updateData.adminEmail && updateData.adminEmail !== existingAccount.adminEmail) {
      const emailExists = await prisma.account.findUnique({
        where: { adminEmail: updateData.adminEmail }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está en uso por otra cuenta' },
          { status: 400 }
        );
      }
    }

    // Actualizar la cuenta
    const updatedAccount = await prisma.account.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        companyName: true,
        adminName: true,
        adminEmail: true,
        subscriptionTier: true,
        industry: true,
        companySize: true,
        company_logo: true,
        status: true,
        updatedAt: true,
      }
    });

    // Log de auditoría (opcional)
    console.log(`[ADMIN] Cuenta ${params.id} actualizada por ${payload.adminEmail}`);

    // Formatear respuesta
    const formattedResponse = {
      id: updatedAccount.id,
      companyName: updatedAccount.companyName,
      adminName: updatedAccount.adminName,
      adminEmail: updatedAccount.adminEmail,
      subscriptionTier: updatedAccount.subscriptionTier,
      industry: updatedAccount.industry,
      companySize: updatedAccount.companySize,
      logoUrl: updatedAccount.company_logo, // Mapeo inverso
      status: updatedAccount.status,
      updatedAt: updatedAccount.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: 'Cuenta actualizada exitosamente',
      data: formattedResponse
    });

  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    
    // Manejo específico de errores de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar la cuenta' },
      { status: 500 }
    );
  }
}