# TASK_03F: Batch API - POST /api/job-classification/batch-assign

## 🎯 OBJETIVO

Crear el endpoint de persistencia masiva que guarda todas las clasificaciones de una vez en una transacción atómica, reemplazando las múltiples llamadas individuales que causaban el bug de persistencia prematura.

## 📋 CONTEXTO

### Problema Actual
```yaml
API ACTUAL (/api/job-classification/assign):
  - Guarda 1 empleado a la vez
  - Cada "guardar" persiste inmediatamente
  - Si usuario cancela después de 3/7, quedan 3 huérfanos
  - Sin transacción atómica

IMPACTO:
  - Datos inconsistentes
  - Sin rollback posible
  - Múltiples round-trips (lento)
```

### Solución
```yaml
BATCH API:
  - Recibe array de clasificaciones
  - Transacción Prisma (todo o nada)
  - Un solo round-trip
  - Rollback automático si falla
  - Histórico masivo en JobMappingHistory
```

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Wizard)                              │
│                                                                 │
│  useClassificationDraft.handleContinue()                       │
│      │                                                          │
│      ▼                                                          │
│  POST /api/job-classification/batch-assign                     │
│  Body: {                                                        │
│    classifications: [                                           │
│      { employeeId, performanceTrack, standardJobLevel },       │
│      { employeeId, performanceTrack, standardJobLevel },       │
│      ...                                                        │
│    ]                                                            │
│  }                                                              │
│      │                                                          │
└──────┼──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINT                                 │
│                                                                 │
│  1. Validar autenticación (headers middleware)                 │
│  2. Validar RBAC (CLIENT o ADMIN)                              │
│  3. Validar payload (zod schema)                               │
│  4. Validar que employees pertenecen a accountId               │
│      │                                                          │
│      ▼                                                          │
│  prisma.$transaction([                                          │
│    // UPDATE masivo Employee                                    │
│    ...classifications.map(c =>                                  │
│      prisma.employee.update({                                   │
│        where: { id: c.employeeId, accountId },                 │
│        data: {                                                  │
│          standardJobLevel: c.standardJobLevel,                 │
│          acotadoGroup: deriveAcotado(c.standardJobLevel),      │
│          performanceTrack: c.performanceTrack,                 │
│          jobLevelMethod: 'manual',                             │
│          jobLevelMappedAt: now,                                │
│          trackHasAnomaly: false,                               │
│          pendingReview: false                                  │
│        }                                                        │
│      })                                                         │
│    ),                                                           │
│    // CREATE masivo JobMappingHistory                          │
│    prisma.jobMappingHistory.createMany({                       │
│      data: classifications.map(c => ({                         │
│        accountId,                                               │
│        position: employee.position,                            │
│        standardJobLevel: c.standardJobLevel,                   │
│        mappedBy: userEmail,                                    │
│        mappingMethod: 'manual'                                 │
│      }))                                                        │
│    })                                                           │
│  ])                                                             │
│      │                                                          │
│      ▼                                                          │
│  Response: {                                                    │
│    success: true,                                               │
│    updated: 7,                                                  │
│    historyCreated: 7                                           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 ARCHIVOS

### CREAR

```yaml
src/app/api/job-classification/batch-assign/route.ts:
  - Endpoint POST para asignación masiva
  - Transacción Prisma
  - Validación zod
  - RBAC

src/lib/validations/job-classification.ts:
  - Schema zod para batch-assign
  - Tipos derivados
```

### MODIFICAR

```yaml
src/app/api/job-classification/assign/route.ts:
  - Agregar validación de mode (client vs admin)
  - Retornar 403 si mode=client (forzar batch)
```

## 🔧 IMPLEMENTACIÓN DETALLADA

### Paso 1: Crear validación Zod

```typescript
// src/lib/validations/job-classification.ts

import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════════════════════════════════════

export const performanceTrackSchema = z.enum(['COLABORADOR', 'MANAGER', 'EJECUTIVO']);

export const standardJobLevelSchema = z.enum([
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'tecnico_administrativo',
  'operativo_auxiliar'
]);

// ══════════════════════════════════════════════════════════════════════════
// SINGLE CLASSIFICATION
// ══════════════════════════════════════════════════════════════════════════

export const classificationItemSchema = z.object({
  employeeId: z.string().cuid('ID de empleado inválido'),
  performanceTrack: performanceTrackSchema,
  standardJobLevel: standardJobLevelSchema
});

export type ClassificationItem = z.infer<typeof classificationItemSchema>;

// ══════════════════════════════════════════════════════════════════════════
// BATCH REQUEST
// ══════════════════════════════════════════════════════════════════════════

export const batchAssignRequestSchema = z.object({
  classifications: z
    .array(classificationItemSchema)
    .min(1, 'Debe incluir al menos 1 clasificación')
    .max(100, 'Máximo 100 clasificaciones por batch')
});

export type BatchAssignRequest = z.infer<typeof batchAssignRequestSchema>;

// ══════════════════════════════════════════════════════════════════════════
// RESPONSE
// ══════════════════════════════════════════════════════════════════════════

export interface BatchAssignResponse {
  success: boolean;
  updated: number;
  historyCreated: number;
  errors?: Array<{
    employeeId: string;
    error: string;
  }>;
}

// ══════════════════════════════════════════════════════════════════════════
// HELPER: Derive acotadoGroup from standardJobLevel
// ══════════════════════════════════════════════════════════════════════════

export function deriveAcotadoGroup(standardJobLevel: string): string {
  const mapping: Record<string, string> = {
    'gerente_director': 'alta_gerencia',
    'subgerente_subdirector': 'alta_gerencia',
    'jefe': 'mandos_medios',
    'supervisor_coordinador': 'mandos_medios',
    'profesional_analista': 'colaboradores',
    'tecnico_administrativo': 'colaboradores',
    'operativo_auxiliar': 'operativo'
  };
  
  return mapping[standardJobLevel] || 'colaboradores';
}
```

### Paso 2: Crear endpoint batch-assign

```typescript
// src/app/api/job-classification/batch-assign/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService';
import {
  batchAssignRequestSchema,
  deriveAcotadoGroup,
  type BatchAssignResponse,
  type ClassificationItem
} from '@/lib/validations/job-classification';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/job-classification/batch-assign
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🎯 [Batch Assign] Request iniciada');
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: AUTENTICACIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    const userContext = extractUserContext(request);
    const userEmail = request.headers.get('x-user-email') || 'unknown@focalizahr.com';
    
    if (!userContext.accountId) {
      console.log('❌ [Batch Assign] No autorizado - falta accountId');
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: AUTORIZACIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    // Roles permitidos: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CLIENT
    const allowedRoles = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'HR_ADMIN',
      'HR_MANAGER',
      'CLIENT'
    ];
    
    if (!allowedRoles.includes(userContext.role || '')) {
      console.log(`❌ [Batch Assign] Rol no autorizado: ${userContext.role}`);
      return NextResponse.json(
        { success: false, error: 'Sin permisos para clasificar empleados' },
        { status: 403 }
      );
    }
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 3: VALIDAR PAYLOAD
    // ════════════════════════════════════════════════════════════════════════
    
    const body = await request.json();
    const validation = batchAssignRequestSchema.safeParse(body);
    
    if (!validation.success) {
      console.log('❌ [Batch Assign] Validación fallida:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          validationErrors: validation.error.errors
        },
        { status: 400 }
      );
    }
    
    const { classifications } = validation.data;
    
    console.log(`📋 [Batch Assign] Procesando ${classifications.length} clasificaciones`);
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 4: VALIDAR OWNERSHIP (empleados pertenecen a la cuenta)
    // ════════════════════════════════════════════════════════════════════════
    
    const employeeIds = classifications.map(c => c.employeeId);
    
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        accountId: userContext.accountId // SECURITY: Multi-tenant
      },
      select: {
        id: true,
        position: true,
        fullName: true
      }
    });
    
    // Verificar que todos los IDs existen
    const foundIds = new Set(employees.map(e => e.id));
    const missingIds = employeeIds.filter(id => !foundIds.has(id));
    
    if (missingIds.length > 0) {
      console.log(`❌ [Batch Assign] Empleados no encontrados: ${missingIds.join(', ')}`);
      return NextResponse.json(
        {
          success: false,
          error: `${missingIds.length} empleado(s) no encontrado(s) o sin acceso`,
          missingIds
        },
        { status: 400 }
      );
    }
    
    // Crear mapa de employees para acceso rápido
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 5: EJECUTAR TRANSACCIÓN
    // ════════════════════════════════════════════════════════════════════════
    
    const now = new Date();
    
    const result = await prisma.$transaction(async (tx) => {
      // 5a. UPDATE masivo de Employee
      const updatePromises = classifications.map((c: ClassificationItem) => {
        const acotadoGroup = deriveAcotadoGroup(c.standardJobLevel);
        
        return tx.employee.update({
          where: {
            id: c.employeeId,
            accountId: userContext.accountId // Double-check security
          },
          data: {
            standardJobLevel: c.standardJobLevel,
            acotadoGroup: acotadoGroup,
            performanceTrack: c.performanceTrack,
            jobLevelMethod: 'manual',
            jobLevelMappedAt: now,
            trackHasAnomaly: false,
            pendingReview: false
          }
        });
      });
      
      await Promise.all(updatePromises);
      
      // 5b. CREATE masivo en JobMappingHistory (feedback loop)
      const historyData = classifications.map((c: ClassificationItem) => {
        const employee = employeeMap.get(c.employeeId);
        
        return {
          accountId: userContext.accountId,
          position: employee?.position || 'unknown',
          standardJobLevel: c.standardJobLevel,
          mappedBy: userEmail,
          mappingMethod: 'manual' as const,
          createdAt: now
        };
      });
      
      const historyResult = await tx.jobMappingHistory.createMany({
        data: historyData,
        skipDuplicates: true
      });
      
      return {
        updated: classifications.length,
        historyCreated: historyResult.count
      };
    });
    
    // ════════════════════════════════════════════════════════════════════════
    // PASO 6: RESPONSE
    // ════════════════════════════════════════════════════════════════════════
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Batch Assign] Completado en ${duration}ms:`, result);
    
    const response: BatchAssignResponse = {
      success: true,
      updated: result.updated,
      historyCreated: result.historyCreated
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ [Batch Assign] Error:', error);
    
    // Determinar tipo de error
    if (error.code === 'P2025') {
      // Prisma: Record not found
      return NextResponse.json(
        { success: false, error: 'Uno o más empleados no encontrados' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2002') {
      // Prisma: Unique constraint violation
      return NextResponse.json(
        { success: false, error: 'Conflicto de datos' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### Paso 3: Modificar endpoint assign (restringir modo client)

```typescript
// src/app/api/job-classification/assign/route.ts
// AGREGAR al inicio del handler POST existente:

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    // ...autenticación existente...
    
    const body = await request.json();
    
    // ════════════════════════════════════════════════════════════════════════
    // NUEVO: Validar modo de operación
    // ════════════════════════════════════════════════════════════════════════
    
    const mode = body.mode || 'admin';
    
    // Si es modo client, FORZAR uso de batch-assign
    if (mode === 'client') {
      console.log('❌ [Assign] Modo client debe usar /batch-assign');
      return NextResponse.json(
        {
          success: false,
          error: 'En modo cliente, use POST /api/job-classification/batch-assign',
          hint: 'Las clasificaciones de wizard deben guardarse todas juntas'
        },
        { status: 403 }
      );
    }
    
    // Admin puede continuar con asignación individual
    // ...resto del código existente...
  }
}
```

## ✅ CRITERIOS DE ACEPTACIÓN

### Funcionales
- [ ] Acepta array de 1-100 clasificaciones
- [ ] Valida que todos los employeeIds existen
- [ ] Valida que todos pertenecen al accountId del usuario
- [ ] Actualiza Employee.standardJobLevel, acotadoGroup, performanceTrack
- [ ] Marca Employee.pendingReview = false, trackHasAnomaly = false
- [ ] Crea registros en JobMappingHistory para feedback loop
- [ ] Transacción atómica (rollback si falla alguno)
- [ ] Retorna contadores de éxito

### Técnicos
- [ ] TypeScript strict mode sin errores
- [ ] Validación zod completa
- [ ] Prisma $transaction para atomicidad
- [ ] Logs de duración y resultado
- [ ] Error handling específico por código Prisma

### Seguridad
- [ ] RBAC validado (roles permitidos)
- [ ] Multi-tenant: employeeIds verificados contra accountId
- [ ] No permite mode=client en endpoint individual

## 🧪 TESTING

### Unit Tests

```typescript
// src/app/api/job-classification/batch-assign/__tests__/route.test.ts

describe('POST /api/job-classification/batch-assign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should update all employees in single transaction', async () => {
    const mockRequest = createMockRequest({
      body: {
        classifications: [
          { employeeId: 'emp1', performanceTrack: 'MANAGER', standardJobLevel: 'jefe' },
          { employeeId: 'emp2', performanceTrack: 'COLABORADOR', standardJobLevel: 'profesional_analista' }
        ]
      },
      headers: {
        'x-account-id': 'acc123',
        'x-user-role': 'HR_ADMIN',
        'x-user-email': 'admin@test.com'
      }
    });
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBe(2);
  });
  
  it('should reject if employee not found', async () => {
    // ...
  });
  
  it('should reject if employee belongs to different account', async () => {
    // ...
  });
  
  it('should rollback all if one fails', async () => {
    // ...
  });
});
```

### Integration Tests

```typescript
// playwright/tests/batch-assign.spec.ts

test('batch assign from wizard', async ({ page }) => {
  // 1. Login as client
  await loginAsClient(page);
  
  // 2. Start campaign wizard
  await page.goto('/dashboard/campaigns/new');
  
  // 3. Navigate to classification step
  await fillWizardStep1(page);
  await fillWizardStep2(page);
  
  // 4. Classify employees
  await page.click('text=Aprobar 43');
  await page.click('text=Aprobar todas y continuar');
  
  // 5. Verify single API call made
  const requests = await page.route('**/batch-assign');
  expect(requests).toHaveLength(1);
  
  // 6. Verify database updated
  const employees = await prisma.employee.findMany({
    where: { accountId: testAccountId }
  });
  expect(employees.every(e => e.standardJobLevel !== null)).toBe(true);
});
```

### Edge Cases

```yaml
CASO 1: Array vacío
  Esperado: 400 Bad Request "Debe incluir al menos 1 clasificación"

CASO 2: Más de 100 clasificaciones
  Esperado: 400 Bad Request "Máximo 100 clasificaciones por batch"

CASO 3: employeeId de otra cuenta
  Esperado: 400 Bad Request "empleado(s) no encontrado(s) o sin acceso"

CASO 4: Falla a mitad de transacción
  Esperado: 500 Internal Error, NINGÚN employee actualizado (rollback)

CASO 5: Duplicados en array
  Esperado: Última clasificación gana (no error)
```

## 🤖 PROMPT PARA CLAUDE CODE

```
Implementa TASK_03F: Batch API - POST /api/job-classification/batch-assign

CONTEXTO:
Reemplaza múltiples llamadas a /api/job-classification/assign con una sola
llamada batch que persiste todo en una transacción atómica.

ARCHIVOS A CREAR:

1. src/lib/validations/job-classification.ts
   - Zod schemas: performanceTrackSchema, standardJobLevelSchema
   - classificationItemSchema: { employeeId, performanceTrack, standardJobLevel }
   - batchAssignRequestSchema: { classifications: array 1-100 }
   - deriveAcotadoGroup helper function
   - Tipos TypeScript derivados

2. src/app/api/job-classification/batch-assign/route.ts
   - POST handler
   - Autenticación via extractUserContext
   - RBAC: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CLIENT
   - Validar payload con zod
   - Validar ownership (employeeIds pertenecen a accountId)
   - Prisma $transaction:
     * UPDATE masivo Employee (standardJobLevel, acotadoGroup, performanceTrack, etc)
     * CREATE masivo JobMappingHistory
   - Response: { success, updated, historyCreated }
   - Error handling específico por código Prisma

MODIFICAR:

3. src/app/api/job-classification/assign/route.ts
   - Agregar validación de body.mode
   - Si mode === 'client' → return 403 "use batch-assign"
   - Mantener funcionamiento actual para mode === 'admin'

REFERENCIAS:
- src/app/api/exit/register/batch/route.ts (patrón similar)
- src/lib/services/AuthorizationService.ts (extractUserContext)
- Prisma schema: Employee tiene standardJobLevel, acotadoGroup, performanceTrack

CRITERIOS:
- TypeScript strict sin errores
- Transacción Prisma atómica
- Validación multi-tenant (accountId)
- Logs de duración y resultado
```

## 📚 REFERENCIAS

- Patrón batch existente: `src/app/api/exit/register/batch/route.ts`
- AuthorizationService: `src/lib/services/AuthorizationService.ts`
- PositionAdapter (deriveAcotado): `src/lib/services/PositionAdapter.ts`
- Prisma schema: `prisma/schema.prisma` (Employee, JobMappingHistory)
- Endpoint individual: `src/app/api/job-classification/assign/route.ts`
