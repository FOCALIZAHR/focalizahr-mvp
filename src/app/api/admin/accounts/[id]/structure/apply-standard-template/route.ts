// src/app/api/admin/accounts/[id]/structure/apply-standard-template/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';

const STANDARD_TEMPLATE = [
  { displayName: 'Gerencia de Personas', standardCategory: 'personas' },
  { displayName: 'Gerencia Comercial', standardCategory: 'comercial' },
  { displayName: 'Gerencia de Marketing', standardCategory: 'marketing' },
  { displayName: 'Gerencia de Tecnología', standardCategory: 'tecnologia' },
  { displayName: 'Gerencia de Operaciones', standardCategory: 'operaciones' },
  { displayName: 'Gerencia de Finanzas', standardCategory: 'finanzas' },
  { displayName: 'Gerencia de Servicio al Cliente', standardCategory: 'servicio' },
  { displayName: 'Gerencia Legal y Compliance', standardCategory: 'legal' }
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const validation = await validateAuthToken(authHeader, undefined);

    if (!validation.success || validation.account?.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accountId = params.id;
    const created = [];

    for (const template of STANDARD_TEMPLATE) {
      // Verificar si ya existe (idempotente)
      const existing = await prisma.department.findFirst({
        where: {
          accountId,
          level: 2,
          standardCategory: template.standardCategory
        }
      });

      if (!existing) {
        const gerencia = await prisma.department.create({
          data: {
            accountId,
            displayName: template.displayName,
            standardCategory: template.standardCategory,
            level: 2,
            unitType: 'gerencia',
            isActive: true
          }
        });
        created.push(gerencia);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Estructura estándar aplicada. ${created.length} gerencias creadas.`,
      data: {
        gerenciasCreated: created.length,
        totalGerencias: STANDARD_TEMPLATE.length
      }
    });

  } catch (error) {
    console.error('Error applying standard template:', error);
    return NextResponse.json(
      { error: 'Error al aplicar estructura estándar' },
      { status: 500 }
    );
  }
}