# REF_TASK_03A: Referencia Técnica API Job Classification

## 1. Estructura de Respuestas

### GET /api/job-classification/review

```typescript
// Request
GET /api/job-classification/review?accountId=xxx (accountId opcional, solo ADMIN)
Headers: x-account-id, x-user-role

// Response
{
  success: true,
  data: {
    unclassified: [
      {
        position: "GURU ESPIRITUAL",
        employeeCount: 3,
        employeeIds: ["id1", "id2", "id3"],
        suggestedLevel: "profesional_analista",  // PositionAdapter.getJobLevel()
        suggestedAcotado: "profesionales",
        suggestedTrack: "COLABORADOR"
      }
    ],
    withAnomalies: [
      {
        employeeId: "id4",
        fullName: "Juan Pérez",
        position: "Analista",
        currentTrack: "COLABORADOR",
        directReportsCount: 5,
        anomalyType: "colaborador_with_reports"
      }
    ]
  },
  summary: {
    totalEmployees: 200,
    classified: 180,
    unclassified: 15,
    withAnomalies: 5,
    classificationRate: 90
  }
}
```

### POST /api/job-classification/assign

```typescript
// Request Body
{
  position: "GURU ESPIRITUAL",        // Cargo a clasificar
  accountId: "xxx",                   // Requerido
  standardJobLevel: "profesional_analista"  // Nivel asignado
}

// Response
{
  success: true,
  updated: 3,  // Empleados actualizados
  mapping: {
    position: "GURU ESPIRITUAL",
    standardJobLevel: "profesional_analista",
    acotadoGroup: "profesionales",
    performanceTrack: "COLABORADOR"
  }
}
```

### GET /api/job-classification/validate

```typescript
// Response
{
  success: true,
  canProceed: false,  // true si puede generar ciclo
  pendingCount: 15,
  anomalyCount: 5,
  message: "Hay 15 cargos sin clasificar y 5 con anomalías"
}
```

## 2. Lógica de Negocio

### RBAC por Rol

```typescript
// En cada endpoint:
const accountId = request.headers.get('x-account-id');
const userRole = request.headers.get('x-user-role') || '';

// ADMIN puede ver cualquier cuenta
const isFocalizahrAdmin = userRole === 'FOCALIZAHR_ADMIN';
const targetAccountId = isFocalizahrAdmin 
  ? (body.accountId || accountId)  // Admin puede especificar otra
  : accountId;                      // Cliente solo su cuenta
```

### Query Empleados Sin Clasificar

```typescript
// Agrupar por position para consolidar
const unclassified = await prisma.employee.groupBy({
  by: ['position'],
  where: {
    accountId: targetAccountId,
    status: 'ACTIVE',
    standardJobLevel: null,
    position: { not: null }
  },
  _count: { id: true }
});

// Enriquecer con sugerencias de PositionAdapter
import { PositionAdapter } from '@/lib/services/PositionAdapter';

const enriched = unclassified.map(item => {
  const classification = PositionAdapter.classifyPosition(item.position);
  return {
    position: item.position,
    employeeCount: item._count.id,
    suggestedLevel: classification.standardJobLevel,
    suggestedAcotado: classification.acotadoGroup,
    suggestedTrack: classification.performanceTrack
  };
});
```

### Actualizar Empleados

```typescript
// Al asignar nivel, actualizar TODOS los empleados con ese cargo
const acotadoGroup = PositionAdapter.getAcotadoGroup(standardJobLevel);
const performanceTrack = PositionAdapter.mapToTrack(standardJobLevel);

const updated = await prisma.employee.updateMany({
  where: {
    accountId: targetAccountId,
    position: { equals: position, mode: 'insensitive' },
    status: 'ACTIVE'
  },
  data: {
    standardJobLevel,
    acotadoGroup,
    performanceTrack,
    jobLevelMethod: 'manual',
    jobLevelMappedAt: new Date(),
    trackMappedAt: new Date(),
    trackHasAnomaly: false  // Reset anomalía si se asigna manual
  }
});

// Guardar en histórico para feedback loop
await PositionAdapter.saveToHistory(
  targetAccountId,
  position,
  standardJobLevel,
  userEmail
);
```

## 3. Niveles Jerárquicos Válidos

```typescript
const VALID_JOB_LEVELS = [
  'gerente_director',
  'subgerente_subdirector', 
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar'
] as const;

// Validar en POST
if (!VALID_JOB_LEVELS.includes(standardJobLevel)) {
  return NextResponse.json(
    { success: false, error: `Nivel inválido: ${standardJobLevel}` },
    { status: 400 }
  );
}
```

## 4. Imports Necesarios

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PositionAdapter } from '@/lib/services/PositionAdapter';
import { extractUserContext } from '@/lib/services/AuthorizationService';
```

## 5. Patrón Exit Intelligence a Seguir

Ver archivos existentes como referencia:
- `/api/exit/register/route.ts` - Patrón RBAC
- `/api/admin/job-mapping-review/route.ts` - API actual (trabaja sobre Participant, cambiar a Employee)
