// /app/api/admin/accounts/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación para actualización (camelCase)
const updateAccountSchema = z.object({
  companyName: z.string().min(1).optional(),
  adminName: z.string().min(1).optional(),
  adminEmail: z.string().email().optional(),
  subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
  industry: z.string().optional().nullable(),
  companySize: z.string().optional().nullable(),
  companyLogo: z.string().url().optional().nullable(), // camelCase correcto
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'INACTIVE']).optional(),
});

// 🟢 INICIO DEL BLOQUE DE REEMPLAZO 🟢
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 🟢 INICIO DEL BLOQUE DE REEMPLAZO (en la función GET) 🟢
    // SEGURIDAD: Usar validateAuthToken de lib/auth.ts
    const authHeader = request.headers.get('authorization');
    const validation = await validateAuthToken(authHeader, undefined);

    if (!validation.success || !validation.account) {
      return NextResponse.json(
       { error: validation.error || 'No autorizado' },
       { status: 401 }
  );
}

// Verificar rol admin
if (validation.account.role !== 'FOCALIZAHR_ADMIN') {
  return NextResponse.json(
    { error: 'Acceso denegado - Se requiere rol FOCALIZAHR_ADMIN' },
    { status: 403 }
  );
}
// 🟢 FIN DEL BLOQUE DE REEMPLAZO 🟢

    // --- INICIO DE LA CORRECCIÓN ARQUITECTÓNICA ---

    // Paso 1: Obtener la cuenta y sus relaciones DIRECTAS.
    // Se elimina el conteo de 'participants' y se usa el nombre correcto 'companyLogo'.
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
        companyLogo: true, // Nombre correcto según schema.prisma
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            campaigns: true, // Esto es correcto porque es una relación directa
            departments: true, // Esto también es correcto
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
    }

    // Paso 2: Obtener el conteo de participantes con una consulta separada y eficiente.
    // Esto respeta la arquitectura: Account -> Campaign -> Participant
    const participantCount = await prisma.participant.count({
      where: {
        campaign: {
          accountId: params.id,
        },
      },
    });

    // Paso 3: Combinar los resultados en la respuesta final.
    const formattedAccount = {
      id: account.id,
      companyName: account.companyName,
      adminName: account.adminName,
      adminEmail: account.adminEmail,
      subscriptionTier: account.subscriptionTier || 'basic',
      industry: account.industry || '',
      companySize: account.companySize || '',
      companyLogo: account.companyLogo || '', // Usamos el nombre correcto
      status: account.status || 'ACTIVE',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      stats: {
        totalCampaigns: account._count.campaigns,
        totalDepartments: account._count.departments,
        totalParticipants: participantCount, // Usamos el conteo correcto
      },
    };

    // --- FIN DE LA CORRECCIÓN ARQUITECTÓNICA ---

    return NextResponse.json({
      success: true,
      data: formattedAccount,
    });

  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de la cuenta' },
      { status: 500 }
    );
  }
}
// 🟢 FIN DEL BLOQUE DE REEMPLAZO 🟢

// PATCH - Actualizar datos de una cuenta
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // SEGURIDAD: Usar validateAuthToken de lib/auth.ts
    const authHeader = request.headers.get('authorization');
    const validation = await validateAuthToken(authHeader, undefined);
    
    if (!validation.success || !validation.account) {
      return NextResponse.json(
        { error: validation.error || 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar rol admin
    if (validation.account.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado - Se requiere rol FOCALIZAHR_ADMIN' },
        { status: 403 }
      );
    }

    // Parsear y validar datos del body
    const body = await request.json();
    
    // Validar datos con schema camelCase
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

    // Actualizar la cuenta en la base de datos
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
        companyLogo: true, // camelCase consistente
        status: true,
        updatedAt: true,
      }
    });

    // Log de auditoría
    // Corrección en la función PATCH
    console.log(`[ADMIN] Cuenta ${params.id} actualizada por ${validation.account.adminEmail}`);

    // Respuesta con camelCase consistente
    const formattedResponse = {
      id: updatedAccount.id,
      companyName: updatedAccount.companyName,
      adminName: updatedAccount.adminName,
      adminEmail: updatedAccount.adminEmail,
      subscriptionTier: updatedAccount.subscriptionTier,
      industry: updatedAccount.industry,
      companySize: updatedAccount.companySize,
      companyLogo: updatedAccount.companyLogo, // camelCase directo
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