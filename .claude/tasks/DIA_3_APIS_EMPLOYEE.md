# 🌐 TAREA: DÍA 3 - APIs Employee CRUD

## OBJETIVO
Implementar las APIs REST para Employee Master con:
- RBAC centralizado (hasPermission)
- Handlers especiales (terminate, rehire, transfer)
- Filtrado jerárquico para AREA_MANAGER

## PREREQUISITOS
✅ Día 1: Schema completado
✅ Día 2: EmployeeSyncService funcionando

---

## ENTREGABLES DÍA 3

```
□ src/app/api/admin/employees/sync/route.ts
□ src/app/api/admin/employees/route.ts (GET lista)
□ src/app/api/admin/employees/[id]/route.ts (GET, PATCH)
□ src/app/api/admin/employees/pending-review/route.ts
□ Todas las APIs usan hasPermission (NO arrays hardcodeados)
```

---

## REGLA DE ORO RBAC

> ⚠️ **PROHIBIDO** hardcodear arrays de roles. Usar `hasPermission()` centralizado.

```typescript
// ✅ CORRECTO
import { hasPermission, extractUserContext } from '@/lib/services/AuthorizationService';

if (!hasPermission(userContext.role, 'employees:sync')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ❌ PROHIBIDO
if (!['FOCALIZAHR_ADMIN', 'HR_MANAGER'].includes(role)) { ... }
```

---

## PERMISOS A USAR

```yaml
employees:read:   Listar/ver empleados
employees:write:  Crear/editar empleados
employees:sync:   Sincronizar CSV
employees:terminate: Desactivar empleados
```

---

## CÓDIGO A IMPLEMENTAR

### 1. POST /api/admin/employees/sync

```typescript
// src/app/api/admin/employees/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  extractUserContext, 
  hasPermission 
} from '@/lib/services/AuthorizationService';
import { 
  processEmployeeImport, 
  DEFAULT_SYNC_CONFIG 
} from '@/lib/services/EmployeeSyncService';

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // RBAC centralizado
    if (!hasPermission(userContext.role, 'employees:sync')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para sincronizar empleados' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employees, config } = body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array de employees requerido' },
        { status: 400 }
      );
    }

    const result = await processEmployeeImport(
      userContext.accountId,
      employees,
      { ...DEFAULT_SYNC_CONFIG, ...config },
      userContext.userId || undefined
    );

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[API] Error en sync employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 2. GET /api/admin/employees (Lista con Filtros)

```typescript
// src/app/api/admin/employees/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    // Parámetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');
    const pendingReview = searchParams.get('pendingReview') === 'true';
    const skip = (page - 1) * limit;

    // Construir filtro base
    const where: any = {
      accountId: userContext.accountId
    };

    // Filtro jerárquico para AREA_MANAGER
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const allowedDepts = [userContext.departmentId, ...childIds];
      where.departmentId = { in: allowedDepts };
    }

    // Filtros opcionales
    if (status) {
      where.status = status;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (pendingReview) {
      where.pendingReview = true;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Query con paginación
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: {
            select: { id: true, displayName: true, standardCategory: true }
          },
          manager: {
            select: { id: true, fullName: true, position: true }
          },
          _count: {
            select: { directReports: true }
          }
        },
        orderBy: { fullName: 'asc' },
        take: limit,
        skip
      }),
      prisma.employee.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      meta: {
        filtered: userContext.role === 'AREA_MANAGER'
      }
    });

  } catch (error: any) {
    console.error('[API] Error listando employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 3. GET/PATCH /api/admin/employees/[id]

```typescript
// src/app/api/admin/employees/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService';

// GET - Detalle de empleado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        accountId: userContext.accountId
      },
      include: {
        department: true,
        manager: {
          select: { id: true, fullName: true, position: true, email: true }
        },
        directReports: {
          select: { id: true, fullName: true, position: true, email: true, status: true }
        },
        history: {
          orderBy: { effectiveDate: 'desc' },
          take: 20
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Validación jerárquica para AREA_MANAGER
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId);
      const allowedDepts = [userContext.departmentId, ...childIds];
      
      if (!allowedDepts.includes(employee.departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Fuera de su ámbito' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: employee
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar con acciones especiales
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    // Obtener empleado
    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        accountId: userContext.accountId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // ════════════════════════════════════════════════════════════════
    // ACCIONES ESPECIALES
    // ════════════════════════════════════════════════════════════════
    
    // TERMINATE
    if (action === 'terminate') {
      if (!hasPermission(userContext.role, 'employees:terminate')) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos para desactivar' },
          { status: 403 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.employeeHistory.create({
          data: {
            employeeId: employee.id,
            accountId: userContext.accountId,
            changeType: 'TERMINATE',
            fieldName: 'status',
            oldValue: employee.status,
            newValue: 'INACTIVE',
            changeSource: 'MANUAL',
            changedBy: userContext.userId,
            changeReason: updateData.reason || 'Desvinculación manual'
          }
        });

        return tx.employee.update({
          where: { id: employee.id },
          data: {
            status: 'INACTIVE',
            isActive: false,
            terminatedAt: new Date(),
            terminationReason: updateData.reason || 'manual'
          }
        });
      });

      return NextResponse.json({ success: true, data: result });
    }

    // REHIRE
    if (action === 'rehire') {
      if (!hasPermission(userContext.role, 'employees:write')) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos' },
          { status: 403 }
        );
      }

      if (employee.status !== 'INACTIVE') {
        return NextResponse.json(
          { success: false, error: 'Solo se puede recontratar empleados inactivos' },
          { status: 400 }
        );
      }

      const newTenure = employee.tenureCount + 1;

      const result = await prisma.$transaction(async (tx) => {
        await tx.employeeHistory.create({
          data: {
            employeeId: employee.id,
            accountId: userContext.accountId,
            changeType: 'REHIRE',
            fieldName: 'status',
            oldValue: 'INACTIVE',
            newValue: 'ACTIVE',
            changeSource: 'MANUAL',
            changedBy: userContext.userId,
            changeReason: `Recontratación manual (tenure #${newTenure})`
          }
        });

        return tx.employee.update({
          where: { id: employee.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            rehireDate: new Date(),
            tenureCount: newTenure,
            terminatedAt: null,
            terminationReason: null,
            pendingReview: false,
            pendingReviewReason: null
          }
        });
      });

      return NextResponse.json({ success: true, data: result });
    }

    // TRANSFER (cambio de departamento)
    if (action === 'transfer') {
      if (!hasPermission(userContext.role, 'employees:write')) {
        return NextResponse.json(
          { success: false, error: 'Sin permisos' },
          { status: 403 }
        );
      }

      if (!updateData.departmentId) {
        return NextResponse.json(
          { success: false, error: 'departmentId requerido para transfer' },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.employeeHistory.create({
          data: {
            employeeId: employee.id,
            accountId: userContext.accountId,
            changeType: 'TRANSFER',
            fieldName: 'departmentId',
            oldValue: employee.departmentId,
            newValue: updateData.departmentId,
            changeSource: 'MANUAL',
            changedBy: userContext.userId
          }
        });

        return tx.employee.update({
          where: { id: employee.id },
          data: {
            departmentId: updateData.departmentId,
            ...(updateData.managerId !== undefined && { managerId: updateData.managerId })
          }
        });
      });

      return NextResponse.json({ success: true, data: result });
    }

    // ════════════════════════════════════════════════════════════════
    // UPDATE NORMAL
    // ════════════════════════════════════════════════════════════════
    if (!hasPermission(userContext.role, 'employees:write')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const allowedFields = [
      'fullName', 'preferredName', 'email', 'phoneNumber',
      'position', 'jobTitle', 'seniorityLevel', 'costCenter'
    ];
    
    const sanitizedData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field];
      }
    }

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: sanitizedData
    });

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    console.error('[API] Error actualizando employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 4. GET /api/admin/employees/pending-review

```typescript
// src/app/api/admin/employees/pending-review/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    if (!hasPermission(userContext.role, 'employees:read')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const employees = await prisma.employee.findMany({
      where: {
        accountId: userContext.accountId,
        pendingReview: true
      },
      include: {
        department: {
          select: { displayName: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo pending review:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## VERIFICAR EN AuthorizationService

Antes de ejecutar, verificar que `AuthorizationService` tenga:

```typescript
// Debe existir en src/lib/services/AuthorizationService.ts

export const PERMISSIONS = {
  // ... permisos existentes ...
  
  // Employee Master (agregar si no existen)
  'employees:read': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'AREA_MANAGER'],
  'employees:write': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'employees:sync': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'employees:terminate': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
} as const;

export function hasPermission(role: string | null, action: string): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[action as keyof typeof PERMISSIONS];
  return allowed?.includes(role) ?? false;
}
```

Si `hasPermission` no existe, **PREGUNTA antes de continuar**.

---

## VALIDACIÓN FINAL

```bash
# Verificar que compila
npx tsc --noEmit

# Test manual con Thunder Client o curl:
# GET /api/admin/employees
# POST /api/admin/employees/sync
```
