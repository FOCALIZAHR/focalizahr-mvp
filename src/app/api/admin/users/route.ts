// /api/admin/users/route.ts - CRUD usuarios multi-tenant
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders, isAdmin, hashPassword } from '@/lib/auth';
import { ALL_ROLES } from '@/lib/services/AuthorizationService';
import { Prisma } from '@prisma/client';

// Roles que pueden gestionar usuarios
const USER_MANAGEMENT_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
];

function canManageUsers(role?: string): boolean {
  return !!role && USER_MANAGEMENT_ROLES.includes(role);
}

// ============================================
// GET /api/admin/users - Listar usuarios
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado - Token inválido o faltante' },
        { status: 401 }
      );
    }

    if (!canManageUsers(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado - Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Parámetros de query
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const isActiveParam = searchParams.get('isActive');
    const targetAccountId = searchParams.get('accountId') || '';

    // Determinar effectiveAccountId
    let effectiveAccountId: string;
    if (targetAccountId && isAdmin(user)) {
      effectiveAccountId = targetAccountId;
    } else if (user.accountId) {
      effectiveAccountId = user.accountId;
    } else {
      // Legacy: usar el id del Account (para cuentas que loguean como Account)
      effectiveAccountId = user.id;
    }

    // Construir WHERE clause
    const whereConditions: Prisma.UserWhereInput = {
      accountId: effectiveAccountId,
    };

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter) {
      whereConditions.role = roleFilter;
    }

    if (isActiveParam !== null && isActiveParam !== '') {
      whereConditions.isActive = isActiveParam === 'true';
    }

    // Queries en paralelo
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          departmentId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              id: true,
              displayName: true,
              standardCategory: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Unknown error')
            : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/admin/users - Crear usuario
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromHeaders(request);

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado - Token inválido o faltante' },
        { status: 401 }
      );
    }

    if (!canManageUsers(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado - Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, password, role, departmentId, targetAccountId } = body;

    // Validaciones
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Campos requeridos: email, name, password, role' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Validar rol contra ALL_ROLES
    if (!(ALL_ROLES as readonly string[]).includes(role)) {
      return NextResponse.json(
        { error: `Rol inválido: ${role}. Roles válidos: ${ALL_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // AREA_MANAGER requiere departmentId
    if (role === 'AREA_MANAGER' && !departmentId) {
      return NextResponse.json(
        { error: 'El rol AREA_MANAGER requiere un departamento asignado' },
        { status: 400 }
      );
    }

    // Solo FOCALIZAHR_ADMIN puede usar targetAccountId
    let effectiveAccountId: string;
    if (targetAccountId && isAdmin(user)) {
      effectiveAccountId = targetAccountId;
    } else if (user.accountId) {
      effectiveAccountId = user.accountId;
    } else {
      effectiveAccountId = user.id;
    }

    // Validar email único
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      );
    }

    // Validar que el departamento pertenece a la cuenta (si se especifica)
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          accountId: effectiveAccountId,
        },
      });

      if (!department) {
        return NextResponse.json(
          { error: 'El departamento no pertenece a esta cuenta' },
          { status: 400 }
        );
      }
    }

    // Hash password con bcrypt (12 rounds)
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        role,
        departmentId: departmentId || null,
        accountId: effectiveAccountId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        accountId: effectiveAccountId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser.id,
        newValues: {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          departmentId: newUser.departmentId,
        },
        userInfo: {
          performedBy: user.adminEmail || user.id,
          performedByRole: user.role || 'UNKNOWN',
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/admin/users:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : 'Unknown error')
            : undefined,
      },
      { status: 500 }
    );
  }
}
