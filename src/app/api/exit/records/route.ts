/**
 * API GET /api/exit/records
 * 
 * PROPÓSITO:
 * Listar registros de salida (ExitRecord) con filtros y paginación
 * 
 * AUTENTICACIÓN:
 * Headers inyectados por middleware (x-account-id, x-user-role, x-department-id)
 * 
 * PATRÓN:
 * Usa extractUserContext + getChildDepartmentIds según GUIA_MAESTRA_RBAC
 * 
 * QUERY PARAMS:
 * - page, limit, departmentId, status, exitReason, eisClassification
 * - hasLeyKarinAlert, hadOnboarding, dateFrom, dateTo, search
 * 
 * @version 1.1
 * @date December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: EXTRAER CONTEXTO DE SEGURIDAD (patrón oficial)
    // ════════════════════════════════════════════════════════════════════════
    
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado - contexto faltante' },
        { status: 401 }
      );
    }
    
    console.log('[Exit Records] Contexto:', {
      accountId: userContext.accountId,
      role: userContext.role,
      departmentId: userContext.departmentId
    });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: PARSEAR QUERY PARAMS
    // ════════════════════════════════════════════════════════════════════════
    
    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    
    const departmentIdFilter = searchParams.get('departmentId');
    const status = searchParams.get('status'); // pending | completed | all
    const exitReason = searchParams.get('exitReason');
    const eisClassification = searchParams.get('eisClassification');
    const hasLeyKarinAlert = searchParams.get('hasLeyKarinAlert');
    const hadOnboarding = searchParams.get('hadOnboarding');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: CONSTRUIR FILTRO BASE CON RBAC
    // ════════════════════════════════════════════════════════════════════════
    
    // ExitRecord tiene accountId directo (no campaign.accountId)
    const where: any = { accountId: userContext.accountId };
    
    // RBAC: Aplicar filtro departamental para roles limitados
    const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'CEO'];
    
    if (!globalRoles.includes(userContext.role || '')) {
      // AREA_MANAGER u otros roles: filtrar por jerarquía
      if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
        const childIds = await getChildDepartmentIds(userContext.departmentId);
        const accessibleDepts = [userContext.departmentId, ...childIds];
        where.departmentId = { in: accessibleDepts };
        
        console.log('[Exit Records] RBAC filter applied:', {
          role: userContext.role,
          accessibleDepts: accessibleDepts.length
        });
      } else if (userContext.departmentId) {
        // Otros roles con departamento: solo su departamento
        where.departmentId = userContext.departmentId;
      }
      // Si no tiene departmentId, el filtro solo por accountId aplica
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: APLICAR FILTROS ADICIONALES
    // ════════════════════════════════════════════════════════════════════════
    
    // Filtro por departamento específico (validar acceso)
    if (departmentIdFilter) {
      if (where.departmentId?.in) {
        // Usuario con acceso limitado: verificar que puede acceder
        if (where.departmentId.in.includes(departmentIdFilter)) {
          where.departmentId = departmentIdFilter;
        }
        // Si no puede, mantener el filtro RBAC (ignora el filtro solicitado)
      } else if (!where.departmentId) {
        // Usuario con acceso total: aplicar filtro
        where.departmentId = departmentIdFilter;
      }
    }
    
    // Filtro por status
    if (status === 'pending') {
      where.eis = null;
    } else if (status === 'completed') {
      where.eis = { not: null };
    }
    
    // Filtro por razón de salida
    if (exitReason) {
      where.exitReason = exitReason;
    }
    
    // Filtro por clasificación EIS
    if (eisClassification) {
      where.eisClassification = eisClassification;
    }
    
    // Filtro por alerta Ley Karin
    if (hasLeyKarinAlert === 'true') {
      where.hasLeyKarinAlert = true;
    } else if (hasLeyKarinAlert === 'false') {
      where.hasLeyKarinAlert = false;
    }
    
    // Filtro por correlación onboarding
    if (hadOnboarding === 'true') {
      where.hadOnboarding = true;
    } else if (hadOnboarding === 'false') {
      where.hadOnboarding = false;
    }
    
    // Filtro por rango de fechas
    if (dateFrom || dateTo) {
      where.exitDate = {};
      if (dateFrom) {
        where.exitDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.exitDate.lte = new Date(dateTo);
      }
    }
    
    // Búsqueda por RUT o nombre
    if (search) {
      where.OR = [
        { nationalId: { contains: search, mode: 'insensitive' } },
        { 
          participant: { 
            name: { contains: search, mode: 'insensitive' } 
          } 
        }
      ];
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: EJECUTAR QUERY
    // ════════════════════════════════════════════════════════════════════════
    
    const [data, total] = await Promise.all([
      prisma.exitRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { exitDate: 'desc' },
        include: {
          department: {
            select: { 
              id: true, 
              displayName: true,
              standardCategory: true
            }
          },
          participant: {
            select: { 
              id: true, 
              name: true, 
              email: true,
              hasResponded: true,
              responseDate: true
            }
          },
          alerts: {
            where: { status: 'pending' },
            select: {
              id: true,
              alertType: true,
              severity: true
            }
          }
        }
      }),
      prisma.exitRecord.count({ where })
    ]);
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 6: RESPONSE
    // ════════════════════════════════════════════════════════════════════════
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      meta: {
        filtered: !globalRoles.includes(userContext.role || ''),
        role: userContext.role
      }
    });
    
  } catch (error: any) {
    console.error('[Exit Records] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER OPTIONS (CORS)
// ═══════════════════════════════════════════════════════════════════════════

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}