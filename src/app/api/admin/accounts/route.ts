// /app/api/admin/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken, getUserFromHeaders, isAdmin } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET /api/admin/accounts - Optimizado para respuesta <500ms
export async function GET(request: NextRequest) {
  const startTime = Date.now(); // Para medir performance
  
  try {
    // 1. VERIFICACIÓN DE SEGURIDAD (rápida)
    const user = getUserFromHeaders(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado - Token inválido o faltante' },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Acceso denegado - Se requiere rol FOCALIZAHR_ADMIN' },
        { status: 403 }
      );
    }

    // 2. OBTENER PARÁMETROS
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 3. CONSTRUIR WHERE CLAUSE (optimizada)
    const whereConditions: Prisma.AccountWhereInput = {
      role: 'CLIENT', // Solo clientes, no admins
    };

    // Búsqueda simple y eficiente
    if (search) {
      whereConditions.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { adminName: { contains: search, mode: 'insensitive' } },
        { adminEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por plan
    if (plan !== 'all') {
      whereConditions.subscriptionTier = plan;
    }

    // 4. EJECUTAR QUERIES EN PARALELO (optimización clave)
    const skip = (page - 1) * limit;
    
    // Usar Promise.all para ejecutar en paralelo
    const [accounts, totalAccounts] = await Promise.all([
      // Query principal - solo campos necesarios
      prisma.account.findMany({
        where: whereConditions,
        select: {
          id: true,
          companyName: true,
          companyLogo: true,
          adminName: true,
          adminEmail: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
          industry: true,
          companySize: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      // Count total para paginación
      prisma.account.count({ where: whereConditions }),
    ]);

    // 5. CALCULAR PAGINACIÓN
    const totalPages = Math.ceil(totalAccounts / limit);

    // 6. AGREGAR STATUS SIMPLE (sin lógica compleja)
    const accountsWithStatus = accounts.map(account => ({
      ...account,
      status: 'active', // Por ahora, todas activas - TODO: implementar lógica real
    }));

    // 7. MÉTRICAS SIMPLIFICADAS (sin cálculos complejos)
    // TODO: Mover a cache o calcular async para no bloquear respuesta
    const metrics = {
      total: totalAccounts,
      byPlan: {}, // TODO: Implementar con cache
      newThisMonth: 0, // TODO: Calcular en background job
      growthPercentage: 0, // TODO: Calcular en background job
      activeAccounts: totalAccounts, // Simplificado
      trialAccounts: 0, // TODO: Implementar cuando tengamos campo status
      suspendedAccounts: 0, // TODO: Implementar cuando tengamos campo status
    };

    // Logging de performance (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      const responseTime = Date.now() - startTime;
      console.log(`[API Performance] /admin/accounts - ${responseTime}ms`);
      if (responseTime > 500) {
        console.warn(`[API Warning] Response time exceeded 500ms: ${responseTime}ms`);
      }
    }

    // 8. RESPUESTA OPTIMIZADA
    return NextResponse.json({
      success: true,
      data: {
        accounts: accountsWithStatus,
        pagination: {
          currentPage: page,
          totalPages,
          totalAccounts,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        metrics,
      },
      _performance: process.env.NODE_ENV === 'development' 
        ? { responseTime: `${Date.now() - startTime}ms` }
        : undefined,
    });

  } catch (error) {
    console.error('Error en GET /api/admin/accounts:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/accounts - Crear nueva cuenta
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // TODO: Implementar creación de cuenta
    return NextResponse.json(
      { message: 'Endpoint en construcción' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error en POST /api/admin/accounts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/accounts/[id] - Para futuro uso
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);
    
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // TODO: Implementar actualización de cuenta
    return NextResponse.json(
      { message: 'Endpoint en construcción' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error en PATCH /api/admin/accounts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/* 
==================================
DEUDA TÉCNICA - OPTIMIZACIONES PENDIENTES
==================================

1. MÉTRICAS AGREGADAS:
   - Implementar sistema de cache (Redis) para métricas
   - Calcular en background job cada hora
   - No bloquear respuesta principal con cálculos

2. STATUS DE CUENTAS:
   - Agregar campo 'status' al schema de Prisma
   - Implementar lógica de negocio real
   - Considerar estados: active, trial, suspended, inactive

3. ÍNDICES DE BASE DE DATOS:
   - Crear índice compuesto para (role, createdAt)
   - Índice para búsqueda de texto (companyName, adminName, adminEmail)
   - Índice para subscriptionTier si se filtra frecuentemente

4. CACHING ESTRATÉGICO:
   - Cache de counts totales (5 minutos TTL)
   - Cache de métricas por plan (1 hora TTL)
   - Invalidación inteligente al crear/actualizar cuentas

5. PAGINACIÓN CURSOR:
   - Migrar de offset/limit a cursor-based pagination
   - Mejor performance para datasets grandes
   - Evita problemas de consistencia con datos cambiantes

6. RATE LIMITING:
   - Implementar rate limiting por usuario
   - Proteger contra abuso de API
   - Considerar diferentes límites para diferentes endpoints

QUERY OPTIMIZADA EJEMPLO PARA MÉTRICAS (cuando se implemente cache):

const metricsQuery = `
  SELECT 
    COUNT(*) FILTER (WHERE role = 'CLIENT') as total,
    COUNT(*) FILTER (WHERE role = 'CLIENT' AND subscription_tier = 'basic') as basic_count,
    COUNT(*) FILTER (WHERE role = 'CLIENT' AND subscription_tier = 'pro') as pro_count,
    COUNT(*) FILTER (WHERE role = 'CLIENT' AND subscription_tier = 'enterprise') as enterprise_count,
    COUNT(*) FILTER (WHERE role = 'CLIENT' AND created_at >= date_trunc('month', CURRENT_DATE)) as new_this_month
  FROM accounts
`;
*/