# 🎯 TAREA: DÍA 5 - Evaluator Portal + Validación Final

## OBJETIVO
Implementar el portal de evaluaciones para usuarios evaluadores y validar todo el sistema.

## PREREQUISITOS
✅ Días 1-4 completados
✅ Performance Cycles generando assignments

---

## ENTREGABLES DÍA 5

```
□ src/app/api/evaluator/assignments/route.ts
□ Rol EVALUATOR documentado en AuthorizationService
□ Validación E2E del flujo completo
□ Checklist de validación completado
```

---

## CONTEXTO: ROL EVALUATOR

```yaml
DEFINICIÓN:
  - Usuario que debe completar evaluaciones asignadas
  - NO es rol administrativo
  - Acceso limitado: solo sus evaluaciones pendientes

ACCESO:
  - /api/evaluator/assignments (sus asignaciones)
  - Portal /desempeno (futuro frontend)
  
NO PUEDE:
  - Ver empleados de otros departamentos
  - Crear/editar ciclos
  - Acceder a /admin
```

---

## CÓDIGO A IMPLEMENTAR

### 1. API Evaluator Portal

```typescript
// src/app/api/evaluator/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

/**
 * GET /api/evaluator/assignments
 * Dashboard "Mis Evaluaciones Pendientes"
 * 
 * Retorna las evaluaciones asignadas al usuario actual agrupadas por ciclo
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el Employee asociado al usuario actual
    // Buscar por email del usuario en el sistema User
    const userEmail = request.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email de usuario no disponible' },
        { status: 400 }
      );
    }

    // Buscar employee por email
    const employee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        status: 'ACTIVE'
      }
    });

    if (!employee) {
      // No es un error - el usuario puede no tener evaluaciones
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No se encontró empleado asociado a este usuario'
      });
    }

    // Obtener assignments donde este employee es EVALUADOR
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        accountId: userContext.accountId,
        evaluatorId: employee.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        cycle: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            cycleType: true
          }
        },
        participant: {
          select: {
            id: true,
            uniqueToken: true,
            status: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Agrupar por ciclo
    const byCycle = assignments.reduce((acc, assignment) => {
      const cycleId = assignment.cycleId;
      if (!acc[cycleId]) {
        acc[cycleId] = {
          cycle: assignment.cycle,
          assignments: []
        };
      }
      acc[cycleId].assignments.push({
        id: assignment.id,
        evaluationType: assignment.evaluationType,
        evaluateeName: assignment.evaluateeName,
        evaluateePosition: assignment.evaluateePosition,
        evaluateeDepartment: assignment.evaluateeDepartment,
        status: assignment.status,
        dueDate: assignment.dueDate,
        surveyUrl: assignment.participant?.uniqueToken 
          ? `/encuesta/${assignment.participant.uniqueToken}`
          : null
      });
      return acc;
    }, {} as Record<string, any>);

    // Convertir a array
    const groupedData = Object.values(byCycle);

    // Stats
    const stats = {
      total: assignments.length,
      pending: assignments.filter(a => a.status === 'PENDING').length,
      inProgress: assignments.filter(a => a.status === 'IN_PROGRESS').length,
      overdue: assignments.filter(a => 
        a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'COMPLETED'
      ).length
    };

    return NextResponse.json({
      success: true,
      data: groupedData,
      stats,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        position: employee.position
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo evaluator assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 2. API Detalle de Assignment (opcional)

```typescript
// src/app/api/evaluator/assignments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/services/AuthorizationService';

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

    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email no disponible' },
        { status: 400 }
      );
    }

    const assignment = await prisma.evaluationAssignment.findFirst({
      where: {
        id: params.id,
        accountId: userContext.accountId
      },
      include: {
        cycle: true,
        evaluator: {
          select: { id: true, email: true, fullName: true }
        },
        participant: {
          select: { id: true, uniqueToken: true, status: true }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Evaluación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el evaluador
    if (assignment.evaluator.email !== userEmail) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a esta evaluación' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        evaluationType: assignment.evaluationType,
        
        // Datos del evaluado (snapshot)
        evaluatee: {
          name: assignment.evaluateeName,
          nationalId: assignment.evaluateeNationalId,
          department: assignment.evaluateeDepartment,
          position: assignment.evaluateePosition
        },
        
        // Datos del ciclo
        cycle: {
          name: assignment.cycle.name,
          endDate: assignment.cycle.endDate
        },
        
        // Estado y acceso
        status: assignment.status,
        dueDate: assignment.dueDate,
        surveyUrl: assignment.participant?.uniqueToken
          ? `/encuesta/${assignment.participant.uniqueToken}`
          : null
      }
    });

  } catch (error: any) {
    console.error('[API] Error obteniendo assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## AGREGAR PERMISOS EVALUATOR

En `AuthorizationService.ts`, agregar si no existe:

```typescript
// Agregar a PERMISSIONS
'evaluations:view': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO', 'AREA_MANAGER', 'EVALUATOR'],
'evaluations:submit': ['EVALUATOR'],
```

---

## VALIDACIÓN E2E COMPLETA

### Checklist de Funcionalidad

```bash
# 1. EMPLOYEE MASTER
□ POST /api/admin/employees/sync con CSV de prueba
  - Debe crear employees nuevos
  - Debe actualizar existentes
  - Debe detectar zombies (INACTIVE → ACTIVE)
  - Debe respetar threshold 10%

□ GET /api/admin/employees
  - Lista paginada
  - Filtros funcionan (status, department, search)
  - AREA_MANAGER ve solo su scope

□ PATCH /api/admin/employees/{id}
  - action: terminate funciona
  - action: rehire funciona
  - action: transfer funciona
  - update normal funciona

□ GET /api/admin/employees/pending-review
  - Lista empleados marcados para revisión

# 2. PERFORMANCE CYCLES
□ POST /api/admin/performance-cycles
  - Crea ciclo en DRAFT

□ POST /api/admin/performance-cycles/{id}/generate
  - Genera MANAGER_TO_EMPLOYEE si includesManager=true
  - Genera EMPLOYEE_TO_MANAGER si includesUpward=true
  - Genera SELF si includesSelf=true
  - Respeta minSubordinates

□ GET /api/admin/performance-cycles/{id}
  - Muestra assignments creados
  - Stats por estado

□ PATCH /api/admin/performance-cycles/{id}
  - Transición DRAFT → SCHEDULED funciona
  - Transición SCHEDULED → ACTIVE funciona

# 3. EVALUATOR PORTAL
□ GET /api/evaluator/assignments
  - Retorna evaluaciones del usuario actual
  - Agrupa por ciclo
  - Incluye stats

# 4. SNAPSHOT CONGELADO
□ Cambiar datos de Employee después de generar
□ Verificar que EvaluationAssignment NO cambió
  - evaluateeName sigue igual
  - evaluatorName sigue igual
```

### Script de Test Manual

```bash
# Crear datos de prueba

# 1. Sync empleados
curl -X POST http://localhost:3000/api/admin/employees/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "employees": [
      {
        "nationalId": "12345678-9",
        "fullName": "CEO Empresa",
        "email": "ceo@empresa.cl",
        "departmentName": "Gerencia General",
        "hireDate": "2020-01-01",
        "isActive": true
      },
      {
        "nationalId": "11111111-1",
        "fullName": "Gerente Comercial",
        "email": "gerente@empresa.cl",
        "departmentName": "Comercial",
        "managerRut": "12345678-9",
        "position": "Gerente",
        "hireDate": "2021-01-01",
        "isActive": true
      },
      {
        "nationalId": "22222222-2",
        "fullName": "Vendedor 1",
        "email": "vendedor1@empresa.cl",
        "departmentName": "Comercial",
        "managerRut": "11111111-1",
        "position": "Vendedor",
        "hireDate": "2022-01-01",
        "isActive": true
      }
    ]
  }'

# 2. Crear ciclo Impact Pulse
curl -X POST http://localhost:3000/api/admin/performance-cycles \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{
    "name": "Impact Pulse Q1 2026",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "cycleType": "IMPACT_PULSE",
    "includesUpward": true,
    "includesManager": false,
    "minSubordinates": 2
  }'

# 3. Generar evaluaciones
curl -X POST http://localhost:3000/api/admin/performance-cycles/{CYCLE_ID}/generate \
  -H "Cookie: auth_token=YOUR_TOKEN"

# 4. Verificar
curl http://localhost:3000/api/admin/performance-cycles/{CYCLE_ID} \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

---

## CHECKLIST FINAL DE VALIDACIÓN

```yaml
□ Funcionalidad:
  □ Upload CSV crea employees y jerarquías
  □ Fix N+1 funciona (managers pre-cargados en 1 query)
  □ Threshold 10% bloquea imports masivos
  □ PENDING_REVIEW marca ausentes correctamente
  □ Fix Zombies: INACTIVE → ACTIVE en rehire automático
  □ Ciclos jerárquicos son detectados y rechazados
  □ Terminate → Rehire funciona con tenureCount
  □ Transfer crea EmployeeHistory correctamente
  □ generateUpwardEvaluations crea snapshot correcto
  □ Snapshot NO cambia aunque Employee cambie

□ Impact Pulse específico:
  □ evaluationType = 'EMPLOYEE_TO_MANAGER'
  □ evaluator = subordinado (quien responde)
  □ evaluatee = manager (quien es evaluado)
  □ minSubordinates filtra correctamente
  □ Datos congelados en snapshot

□ Performance:
  □ Upload 1000 employees < 15 segundos
  □ CTE recursivo < 100ms
  □ GET /employees con 1000 registros < 500ms

□ Seguridad:
  □ Todas las APIs usan hasPermission()
  □ NO hay arrays de roles hardcodeados
  □ AREA_MANAGER ve solo su scope
  □ Multi-tenant: accountId en todas las queries

□ Compatibilidad:
  □ Onboarding Journey sigue funcionando
  □ Exit Intelligence sigue funcionando
  □ Pulso Express sigue funcionando
  □ No hay errores de TypeScript
```

---

## REPORTAR RESULTADO

Al finalizar, reportar:

```markdown
## RESULTADO DÍA 5

### APIs Creadas
- [ ] /api/evaluator/assignments ✅/❌

### Validación E2E
- [ ] Employee sync: ✅/❌
- [ ] Performance cycles: ✅/❌
- [ ] Evaluator portal: ✅/❌
- [ ] Snapshot pattern: ✅/❌

### Issues Encontrados
- (listar si hay)

### Performance Medida
- Sync 100 employees: ___ms
- GET employees: ___ms
```
