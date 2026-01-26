# 📊 TAREA: DÍA 4 - Performance Cycle + Evaluation Assignment

## OBJETIVO
Implementar el sistema de evaluación de desempeño:
- PerformanceCycle (ciclo de evaluación)
- EvaluationAssignment (snapshot congelado "X evalúa a Y")
- generateUpwardEvaluations() para Impact Pulse

## PREREQUISITOS
✅ Día 1-3 completados
✅ Employee Master funcionando

---

## ENTREGABLES DÍA 4

```
□ src/lib/services/EvaluationService.ts
□ src/app/api/admin/performance-cycles/route.ts (GET, POST)
□ src/app/api/admin/performance-cycles/[id]/route.ts (GET, PATCH)
□ src/app/api/admin/performance-cycles/[id]/generate/route.ts (POST)
```

---

## CONCEPTOS CLAVE

### El Patrón SNAPSHOT

```
MUNDO 1: EMPLOYEE (Vivo - Cambia Constantemente)
  Employee.managerId → Estado ACTUAL del jefe

MUNDO 2: EVALUATION_ASSIGNMENT (Snapshot - Congelado)
  evaluatorName, evaluateeName → STRINGS congelados
  snapshotDate → Momento de creación

EJEMPLO:
  Enero: Juan tiene jefe María → Ciclo Q1 creado → Snapshot: jefe=María
  Marzo: Juan cambia a jefe Carlos (Employee actualizado)
  Abril: María evalúa a Juan (porque snapshot Q1 dice María)
```

### Impact Pulse (Upward Evaluation)

```
MANAGER_TO_EMPLOYEE:  Jefe → evalúa → Subordinado (normal)
EMPLOYEE_TO_MANAGER:  Subordinado → evalúa → Jefe (Impact Pulse)

En Impact Pulse:
  evaluator = subordinado (quien responde la encuesta)
  evaluatee = manager (quien es evaluado)
```

---

## CÓDIGO A IMPLEMENTAR

### 1. EvaluationService.ts

```typescript
// src/lib/services/EvaluationService.ts

import { prisma } from '@/lib/prisma';
import { EvaluationType, EvaluationAssignmentStatus } from '@prisma/client';

interface GenerateOptions {
  minSubordinates?: number;  // Mínimo subordinados para upward (default: 3)
  dueDate?: Date;
}

interface GenerateResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Genera evaluaciones MANAGER_TO_EMPLOYEE (jefe evalúa a subordinado)
 */
export async function generateManagerEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  // Obtener empleados activos con jefe
  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE',
      managerId: { not: null }
    },
    include: {
      department: true,
      manager: {
        include: { department: true }
      }
    }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  for (const employee of employees) {
    if (!employee.manager) continue;

    try {
      // Verificar si ya existe
      const existing = await prisma.evaluationAssignment.findFirst({
        where: {
          cycleId,
          evaluatorId: employee.managerId!,
          evaluateeId: employee.id,
          evaluationType: 'MANAGER_TO_EMPLOYEE'
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Crear assignment con SNAPSHOT
      await prisma.evaluationAssignment.create({
        data: {
          accountId,
          cycleId,
          evaluatorId: employee.managerId!,
          evaluateeId: employee.id,
          evaluationType: 'MANAGER_TO_EMPLOYEE',
          
          // SNAPSHOT CONGELADO
          snapshotDate,
          evaluateeName: employee.fullName,
          evaluateeNationalId: employee.nationalId,
          evaluateeDepartmentId: employee.departmentId,
          evaluateeDepartment: employee.department.displayName,
          evaluateePosition: employee.position,
          
          evaluatorName: employee.manager.fullName,
          evaluatorNationalId: employee.manager.nationalId,
          evaluatorDepartmentId: employee.manager.departmentId,
          evaluatorDepartment: employee.manager.department.displayName,
          
          status: 'PENDING',
          dueDate: options?.dueDate || cycle.endDate
        }
      });

      created++;
    } catch (err: any) {
      errors.push(`Error con ${employee.fullName}: ${err.message}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Genera evaluaciones EMPLOYEE_TO_MANAGER (subordinado evalúa a jefe)
 * Para Impact Pulse - Solo managers con suficientes subordinados
 */
export async function generateUpwardEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const minSubordinates = options?.minSubordinates || 3;

  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  // Obtener managers con subordinados activos
  const managers = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE',
      directReports: {
        some: { status: 'ACTIVE' }
      }
    },
    include: {
      department: true,
      directReports: {
        where: { status: 'ACTIVE' },
        include: { department: true }
      }
    }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  for (const manager of managers) {
    // Filtrar por mínimo de subordinados (anonimato)
    if (manager.directReports.length < minSubordinates) {
      console.log(`[Upward] ${manager.fullName} tiene ${manager.directReports.length} subordinados (min: ${minSubordinates}) - SKIP`);
      skipped++;
      continue;
    }

    // Crear una evaluación por cada subordinado
    for (const subordinate of manager.directReports) {
      try {
        // Verificar si ya existe
        const existing = await prisma.evaluationAssignment.findFirst({
          where: {
            cycleId,
            evaluatorId: subordinate.id,   // Subordinado evalúa
            evaluateeId: manager.id,        // al jefe
            evaluationType: 'EMPLOYEE_TO_MANAGER'
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // ═══════════════════════════════════════════════════
        // IMPORTANTE: En upward evaluation:
        // evaluator = subordinado (quien responde)
        // evaluatee = manager (quien es evaluado)
        // ═══════════════════════════════════════════════════
        await prisma.evaluationAssignment.create({
          data: {
            accountId,
            cycleId,
            evaluatorId: subordinate.id,  // Subordinado evalúa
            evaluateeId: manager.id,       // al jefe
            evaluationType: 'EMPLOYEE_TO_MANAGER',
            
            // SNAPSHOT CONGELADO
            snapshotDate,
            
            // El EVALUADO es el manager
            evaluateeName: manager.fullName,
            evaluateeNationalId: manager.nationalId,
            evaluateeDepartmentId: manager.departmentId,
            evaluateeDepartment: manager.department.displayName,
            evaluateePosition: manager.position,
            
            // El EVALUADOR es el subordinado
            evaluatorName: subordinate.fullName,
            evaluatorNationalId: subordinate.nationalId,
            evaluatorDepartmentId: subordinate.departmentId,
            evaluatorDepartment: subordinate.department.displayName,
            
            status: 'PENDING',
            dueDate: options?.dueDate || cycle.endDate
          }
        });

        created++;
      } catch (err: any) {
        errors.push(`Error ${subordinate.fullName} → ${manager.fullName}: ${err.message}`);
      }
    }
  }

  console.log(`[Upward] Generadas ${created} evaluaciones, ${skipped} omitidas`);
  return { created, skipped, errors };
}

/**
 * Genera auto-evaluaciones (SELF)
 */
export async function generateSelfEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE'
    },
    include: { department: true }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  for (const employee of employees) {
    try {
      const existing = await prisma.evaluationAssignment.findFirst({
        where: {
          cycleId,
          evaluatorId: employee.id,
          evaluateeId: employee.id,
          evaluationType: 'SELF'
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.evaluationAssignment.create({
        data: {
          accountId,
          cycleId,
          evaluatorId: employee.id,
          evaluateeId: employee.id,
          evaluationType: 'SELF',
          
          snapshotDate,
          evaluateeName: employee.fullName,
          evaluateeNationalId: employee.nationalId,
          evaluateeDepartmentId: employee.departmentId,
          evaluateeDepartment: employee.department.displayName,
          evaluateePosition: employee.position,
          
          evaluatorName: employee.fullName,
          evaluatorNationalId: employee.nationalId,
          evaluatorDepartmentId: employee.departmentId,
          evaluatorDepartment: employee.department.displayName,
          
          status: 'PENDING',
          dueDate: options?.dueDate || cycle.endDate
        }
      });

      created++;
    } catch (err: any) {
      errors.push(`Error self ${employee.fullName}: ${err.message}`);
    }
  }

  return { created, skipped, errors };
}
```

### 2. APIs Performance Cycles

```typescript
// src/app/api/admin/performance-cycles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

// GET - Listar ciclos
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    
    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const cycles = await prisma.performanceCycle.findMany({
      where: { accountId: userContext.accountId },
      include: {
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: cycles });

  } catch (error: any) {
    console.error('[API] Error listando cycles:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Crear ciclo
export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    
    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      cycleType,
      includesSelf,
      includesManager,
      includesPeer,
      includesUpward,
      anonymousResults,
      minSubordinates
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'name, startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    const cycle = await prisma.performanceCycle.create({
      data: {
        accountId: userContext.accountId,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        cycleType: cycleType || 'QUARTERLY',
        includesSelf: includesSelf ?? false,
        includesManager: includesManager ?? true,
        includesPeer: includesPeer ?? false,
        includesUpward: includesUpward ?? false,
        anonymousResults: anonymousResults ?? true,
        minSubordinates: minSubordinates ?? 3,
        status: 'DRAFT',
        createdBy: userContext.userId
      }
    });

    return NextResponse.json({ success: true, data: cycle }, { status: 201 });

  } catch (error: any) {
    console.error('[API] Error creando cycle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

```typescript
// src/app/api/admin/performance-cycles/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';

// GET - Detalle de ciclo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    
    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id: params.id,
        accountId: userContext.accountId
      },
      include: {
        assignments: {
          include: {
            evaluator: { select: { id: true, fullName: true } },
            evaluatee: { select: { id: true, fullName: true } }
          }
        },
        _count: {
          select: { assignments: true }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 });
    }

    // Stats por estado
    const stats = {
      total: cycle.assignments.length,
      pending: cycle.assignments.filter(a => a.status === 'PENDING').length,
      inProgress: cycle.assignments.filter(a => a.status === 'IN_PROGRESS').length,
      completed: cycle.assignments.filter(a => a.status === 'COMPLETED').length,
      expired: cycle.assignments.filter(a => a.status === 'EXPIRED').length
    };

    return NextResponse.json({
      success: true,
      data: cycle,
      stats
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo cycle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Actualizar ciclo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    
    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: params.id, accountId: userContext.accountId }
    });

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { status, ...updateData } = body;

    // Validar transiciones de estado
    if (status) {
      const validTransitions: Record<string, string[]> = {
        'DRAFT': ['SCHEDULED', 'CANCELLED'],
        'SCHEDULED': ['ACTIVE', 'CANCELLED'],
        'ACTIVE': ['IN_REVIEW', 'CANCELLED'],
        'IN_REVIEW': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': []
      };

      if (!validTransitions[cycle.status]?.includes(status)) {
        return NextResponse.json(
          { success: false, error: `No se puede cambiar de ${cycle.status} a ${status}` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.performanceCycle.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(status && { status })
      }
    });

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    console.error('[API] Error actualizando cycle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### 3. API Generate Evaluations

```typescript
// src/app/api/admin/performance-cycles/[id]/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import {
  generateManagerEvaluations,
  generateUpwardEvaluations,
  generateSelfEvaluations
} from '@/lib/services/EvaluationService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    
    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: params.id, accountId: userContext.accountId }
    });

    if (!cycle) {
      return NextResponse.json({ success: false, error: 'Ciclo no encontrado' }, { status: 404 });
    }

    if (!['DRAFT', 'SCHEDULED'].includes(cycle.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo se puede generar en DRAFT o SCHEDULED' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};
    const options = { minSubordinates: cycle.minSubordinates, dueDate: cycle.endDate };

    // Generar según configuración del ciclo
    if (cycle.includesSelf) {
      results.self = await generateSelfEvaluations(params.id, userContext.accountId, options);
    }

    if (cycle.includesManager) {
      results.manager = await generateManagerEvaluations(params.id, userContext.accountId, options);
    }

    if (cycle.includesUpward) {
      results.upward = await generateUpwardEvaluations(params.id, userContext.accountId, options);
    }

    // Calcular totales
    const totalCreated = Object.values(results).reduce((sum: number, r: any) => sum + (r.created || 0), 0);
    const totalSkipped = Object.values(results).reduce((sum: number, r: any) => sum + (r.skipped || 0), 0);
    const allErrors = Object.values(results).flatMap((r: any) => r.errors || []);

    return NextResponse.json({
      success: true,
      totalCreated,
      totalSkipped,
      errors: allErrors,
      details: results
    });

  } catch (error: any) {
    console.error('[API] Error generando evaluations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## AGREGAR PERMISOS A AuthorizationService

Si no existen, agregar:

```typescript
// En PERMISSIONS de AuthorizationService.ts

'performance:manage': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
'performance:view': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO', 'AREA_MANAGER'],
```

---

## VALIDACIÓN FINAL

```bash
# Verificar compilación
npx tsc --noEmit

# Test manual:
# 1. POST /api/admin/performance-cycles (crear ciclo)
# 2. POST /api/admin/performance-cycles/{id}/generate (generar)
# 3. GET /api/admin/performance-cycles/{id} (ver assignments)
```
