# 🏗️ ESPECIFICACIÓN TÉCNICA: EMPLOYEE MASTER + PERFORMANCE EVALUATION
## FocalizaHR Enterprise - Versión Consolidada Definitiva
### Versión 3.0.1 | Enero 2026 | Estado: ✅ LISTO PARA IMPLEMENTAR

---

## 📝 CHANGELOG

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 3.0.1 | 22-Ene-2026 | + Fix "Zombies" (reactivación en sync), + RBAC centralizado, + Formato CSV estándar con isActive, + Estrategia de Fases documentada |
| 3.0 | 21-Ene-2026 | Consolidación v1.1 + v2.1, snapshot pattern |

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Conceptual](#2-arquitectura-conceptual)
3. [Estándar de Seguridad RBAC](#3-estándar-de-seguridad-rbac)
4. [Schema Prisma Completo](#4-schema-prisma-completo)
5. [Algoritmo de Sincronización](#5-algoritmo-de-sincronización)
6. [APIs y Endpoints](#6-apis-y-endpoints)
7. [Services y Lógica de Negocio](#7-services-y-lógica-de-negocio)
8. [Validación CTE Anti-Ciclos](#8-validación-cte-anti-ciclos)
9. [Rol EVALUATOR y Portal](#9-rol-evaluator-y-portal)
10. [Integración con AuditLog](#10-integración-con-auditlog)
11. [Plan de Implementación](#11-plan-de-implementación)
12. [Checklist de Validación](#12-checklist-de-validación)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Fuentes de Validación

```yaml
INVESTIGACIONES REALIZADAS:
  1. Arquitectura Evaluación Desempeño:
     - Lattice, Culture Amp, SAP SuccessFactors
     - Patrón: Cycle → Assignment → Participant → Response
  
  2. Employee Master Sync:
     - SAP, Workday, BambooHR, Cornerstone
     - Patrón: Upsert + Soft Delete + Threshold Protection

CONSOLIDADO DE:
  - Especificación v1.1 (código detallado, handlers, Fix N+1)
  - Especificación v2.1 (sync patterns, snapshot, PerformanceCycle)
```

### 1.2 Decisiones Arquitectónicas Clave

| Decisión | Estándar Industria | FocalizaHR v3.0 |
|----------|-------------------|-----------------|
| ¿Eliminar empleados? | NUNCA (soft delete) | NUNCA (soft delete) |
| ¿Qué hacer con ausentes? | Auto-deactivate o Review | PENDING_REVIEW |
| ¿Threshold protección? | 10% (Cornerstone) | 10% configurable |
| ¿Historial cambios? | Por campo granular | EmployeeHistory |
| ¿Snapshot evaluación? | Form Instance | EvaluationAssignment |
| ¿Evaluador responde? | User autenticado | Rol EVALUATOR |
| ¿Ciclo separado? | Performance Cycle | PerformanceCycle |

### 1.3 Alcance

```yaml
FASE 1 - IMPLEMENTAR AHORA:
  ✅ Employee (master data permanente)
  ✅ EmployeeHistory (historial por campo)
  ✅ EmployeeImport (log de cargas + threshold)
  ✅ PerformanceCycle (ciclo de evaluación)
  ✅ EvaluationAssignment (snapshot congelado)
  ✅ Participant.employeeId (FK opcional)
  ✅ APIs CRUD + Upload CSV con Fix N+1
  ✅ Validación anti-ciclos (CTE)
  ✅ Integración AuditLog
  ✅ generateUpwardEvaluations() - Impact Pulse

FASE 1.5 - CRÍTICO PARA UX:
  ⚠️ Evaluator Portal - Dashboard "Mis Evaluaciones Pendientes"
      Sin esto, usuarios reciben N emails separados
      Implementación: findMany por employeeId, agrupa Participants

FASE 2 - FUTURO:
  📋 ManagerRelationship (matrix organizations)
  📋 CompetencyLibrary (librería competencias)
  📋 360° completo con nominación de peers
  📋 Calibration sessions
```

### 1.4 Compatibilidad

```yaml
REUTILIZA 100%:
  - Campaign, CampaignType, Question, Response
  - SurveyConfiguration, uniqueToken flow
  - AuthorizationService (CTE recursivo)
  - AuditLog existente
  - Department existente

NO MODIFICA:
  - Flujo Campaign → Participant → Response
  - Productos existentes (Onboarding, Exit, Pulso)
```

---

## 2. ARQUITECTURA CONCEPTUAL

### 2.1 Diagrama General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FOCALIZAHR v3.0 - EMPLOYEE + PERFORMANCE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ═══════════════════════════════════════════════════════════════════════   │
│   MUNDO 1: EMPLOYEE MASTER (Maestro Vivo - Cambia Mensualmente)             │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐         │
│   │   Employee   │────▶│ EmployeeHistory  │     │ EmployeeImport │         │
│   │   (actual)   │     │ (cambios/campo)  │     │ (log cargas)   │         │
│   │              │     │                  │     │ + threshold    │         │
│   │ • managerId  │     │ • fieldName      │     │ + stats        │         │
│   │ • deptId     │     │ • oldValue       │     └────────────────┘         │
│   │ • status     │     │ • newValue       │                                 │
│   └──────┬───────┘     └──────────────────┘                                 │
│          │                                                                   │
│          │ self-reference (jerarquía)                                        │
│          ▼                                                                   │
│   ┌──────────────┐                                                          │
│   │  Department  │                                                          │
│   │  (existing)  │                                                          │
│   └──────────────┘                                                          │
│                                                                              │
│   ═══════════════════════════════════════════════════════════════════════   │
│   MUNDO 2: PERFORMANCE EVALUATION (Snapshots - Congelados por Ciclo)        │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   ┌──────────────────┐                                                      │
│   │ PerformanceCycle │ ← Ciclo (Q1, Q2, Anual...)                          │
│   │ + Campaign (FK)  │                                                      │
│   └────────┬─────────┘                                                      │
│            │ 1:N                                                             │
│            ▼                                                                 │
│   ┌────────────────────────────────────────────────────────┐               │
│   │            EvaluationAssignment (SNAPSHOT)              │               │
│   │                                                         │               │
│   │  evaluatorId ───────────────────┐                      │               │
│   │  evaluateeId ───────────────────┼─ FK a Employee       │               │
│   │                                 │  (para queries)      │               │
│   │  ════════════════════════════════════════════════════  │               │
│   │  DATOS CONGELADOS (inmutables):                        │               │
│   │  • snapshotDate                                        │               │
│   │  • evaluateeName                                       │               │
│   │  • evaluateeDepartment                                 │               │
│   │  • evaluatorName                                       │               │
│   │  ════════════════════════════════════════════════════  │               │
│   │                                                         │               │
│   │  participantId ─────────────────────────┐              │               │
│   └─────────────────────────────────────────┼──────────────┘               │
│                                             │                               │
│                                             ▼                               │
│   ┌──────────────────┐              ┌─────────────┐                        │
│   │     Campaign     │◀─────────────│ Participant │                        │
│   │   (Questions)    │              │ (evaluado)  │                        │
│   └──────────────────┘              └──────┬──────┘                        │
│                                            │                                │
│                                            ▼                                │
│                                     ┌─────────────┐                        │
│                                     │  Response   │                        │
│                                     │+evaluatorId │                        │
│                                     └─────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 ¿Por Qué Dos Mundos?

```yaml
EMPLOYEE (Mundo 1):
  - Cambia CONSTANTEMENTE (altas, bajas, movimientos)
  - Refleja estado ACTUAL de la empresa
  - Se sincroniza con archivo mensual del cliente
  - managerId apunta a estado ACTUAL
  
EVALUATION_ASSIGNMENT (Mundo 2):
  - Se crea UNA VEZ al inicio del ciclo
  - NUNCA cambia aunque Employee cambie
  - Snapshot: "Quién era jefe de quién cuando se creó"
  - evaluatorId/evaluateeId son FK para queries
  - evaluatorName/evaluateeName son STRINGS congelados
  
EJEMPLO:
  Enero: Juan tiene jefe María → Ciclo Q1 creado → Snapshot: jefe=María
  Marzo: Juan cambia a jefe Carlos (Employee actualizado)
  Abril: María evalúa a Juan (porque snapshot de Q1 dice María)
  
  El ciclo Q2 tendrá snapshot con jefe=Carlos
```

### 2.3 Patrón Consistente FocalizaHR

```yaml
TODOS LOS PRODUCTOS SIGUEN EL MISMO PATRÓN:

  PRODUCTO          TABLA ORQUESTACIÓN         FRECUENCIA
  ─────────────     ──────────────────         ──────────
  Onboarding    →   JourneyOrchestration       1 vez (ingreso)
  Exit          →   ExitRecord                 1 vez (salida)
  Desempeño     →   EvaluationAssignment       N veces (ciclos)

  CARACTERÍSTICAS COMUNES:
  - Congelan datos del momento (snapshot)
  - Guardan resultados/scores
  - Vinculan a Participant para respuestas
  - Tienen employeeId para evolución histórica
```

---

## 3. ESTÁNDAR DE SEGURIDAD RBAC

> ⚠️ **REGLA DE ORO:** Está estrictamente **PROHIBIDO** hardcodear arrays de roles (ej: `['ADMIN', 'CEO']`) en los controladores o servicios de este módulo.

La seguridad se gestiona centralizadamente a través de la extensión RBAC de `AuthorizationService`.

### 3.1 Mecanismo de Implementación

Todo endpoint o Server Action debe validar permisos funcionales **ANTES** de ejecutar lógica de negocio:

```typescript
import { hasPermission, extractUserContext } from '@/lib/services/AuthorizationService';

// En Controlador / Route Handler
export async function POST(req: NextRequest) {
  const userContext = extractUserContext(req);
  
  // ✅ FORMA CORRECTA: Validación semántica centralizada
  if (!hasPermission(userContext.role, 'employees:sync')) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos para esta acción' },
      { status: 403 }
    );
  }
  
  // Continuar con lógica de negocio...
}

// ❌ FORMA INCORRECTA (Legacy - Prohibido en código nuevo)
// if (!['FOCALIZAHR_ADMIN', 'HR_MANAGER'].includes(role)) ...
```

### 3.2 Permisos por Recurso - Employee Master

```yaml
EMPLOYEE MASTER:
  employees:read:
    - FOCALIZAHR_ADMIN    # Acceso total
    - ACCOUNT_OWNER       # Su empresa
    - HR_ADMIN            # Gestión RRHH
    - HR_MANAGER          # Alias HR_ADMIN
    - HR_OPERATOR         # Operaciones
    - AREA_MANAGER        # Solo su scope jerárquico
    
  employees:write:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
    
  employees:sync:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
    
  employees:terminate:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
```

### 3.3 Permisos por Recurso - Performance Evaluation

```yaml
PERFORMANCE CYCLES:
  performance:manage:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
    
  performance:view:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
    - HR_OPERATOR
    - CEO
    - AREA_MANAGER        # Solo su scope jerárquico

EVALUATIONS:
  evaluations:manage:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
    
  evaluations:view:
    - FOCALIZAHR_ADMIN
    - ACCOUNT_OWNER
    - HR_ADMIN
    - HR_MANAGER
    - HR_OPERATOR
    - CEO
    - AREA_MANAGER
    - EVALUATOR           # Solo sus asignaciones
    
  evaluations:submit:
    - EVALUATOR           # Solo sus propias evaluaciones
```

### 3.4 Implementación en AuthorizationService

```typescript
// Archivo: src/lib/services/AuthorizationService.ts

// Agregar a PERMISSIONS existente:
export const PERMISSIONS = {
  // ... permisos existentes ...
  
  // Employee Master
  'employees:read': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'AREA_MANAGER'],
  'employees:write': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'employees:sync': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'employees:terminate': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  
  // Performance
  'performance:manage': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'performance:view': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO', 'AREA_MANAGER'],
  
  // Evaluations
  'evaluations:manage': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER'],
  'evaluations:view': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'HR_OPERATOR', 'CEO', 'AREA_MANAGER', 'EVALUATOR'],
  'evaluations:submit': ['EVALUATOR'],
} as const;
```

### 3.5 Filtrado Jerárquico para AREA_MANAGER

```typescript
// AREA_MANAGER tiene employees:read pero FILTRADO por su scope
export async function GET(request: NextRequest) {
  const userContext = extractUserContext(request);
  
  // 1. Validar permiso funcional
  if (!hasPermission(userContext.role, 'employees:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 2. Construir filtro (aplica jerarquía si AREA_MANAGER)
  const accessFilter = await buildParticipantAccessFilter(
    userContext,
    { dataType: 'results' }  // Filtra por departamento para AREA_MANAGER
  );
  
  // 3. Query con filtros
  const employees = await prisma.employee.findMany({
    where: {
      accountId: userContext.accountId,
      ...(userContext.role === 'AREA_MANAGER' && userContext.departmentId
        ? { departmentId: { in: await getAllowedDepartments(userContext) } }
        : {}
      )
    }
  });
  
  return NextResponse.json({ success: true, data: employees });
}
```

### 3.6 Rol EVALUATOR

```yaml
DEFINICIÓN:
  - Rol especial para usuarios que deben completar evaluaciones
  - NO es un rol administrativo
  - Acceso limitado a: portal de evaluaciones, sus asignaciones
  
ASIGNACIÓN:
  - Automática: Employee con EvaluationAssignment.evaluatorId
  - Temporal: Solo durante ciclos activos
  
PERMISOS:
  - evaluations:view (solo sus asignaciones)
  - evaluations:submit (solo sus evaluaciones)
  
NO PUEDE:
  - Ver empleados de otros departamentos
  - Crear/editar ciclos
  - Acceder a admin
```

---

## 4. SCHEMA PRISMA COMPLETO

### 4.1 Modelo Employee

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE MASTER - Nómina Permanente (Se actualiza, nunca se borra)
// Patrón: Upsert + Soft Delete (validado por SAP, Workday, Culture Amp)
// ════════════════════════════════════════════════════════════════════════════

model Employee {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // ═══════════════════════════════════════════════════
  // IDENTIFICADORES (para matching en imports)
  // ═══════════════════════════════════════════════════
  nationalId     String  @map("national_id")       // RUT único por account
  employeeNumber String? @map("employee_number")   // Código interno (EMP-001)
  
  // ═══════════════════════════════════════════════════
  // DATOS PERSONALES
  // ═══════════════════════════════════════════════════
  fullName      String  @map("full_name")
  preferredName String? @map("preferred_name")
  email         String?
  phoneNumber   String? @map("phone_number")
  
  // ═══════════════════════════════════════════════════
  // DATOS ORGANIZACIONALES (ESTADO ACTUAL)
  // ═══════════════════════════════════════════════════
  departmentId   String  @map("department_id")
  position       String?
  jobTitle       String? @map("job_title")
  seniorityLevel String? @map("seniority_level")  // junior|mid|senior|lead|executive
  employmentType String? @map("employment_type")  // full-time|part-time|contractor
  managerLevel   Int?    @map("manager_level")    // 1=CEO, 2=Dir, 3=Ger, 4=Jefe, 5=IC
  costCenter     String? @map("cost_center")
  location       String?
  
  // ═══════════════════════════════════════════════════
  // JERARQUÍA (ESTADO ACTUAL)
  // ═══════════════════════════════════════════════════
  managerId String? @map("manager_id")  // FK self-reference (NULL = CEO)
  
  // ═══════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════
  hireDate          DateTime  @map("hire_date") @db.Date
  terminatedAt      DateTime? @map("terminated_at")
  terminationReason String?   @map("termination_reason")
  rehireDate        DateTime? @map("rehire_date")
  tenureCount       Int       @default(1) @map("tenure_count")
  lastTransferDate  DateTime? @map("last_transfer_date")
  
  // ═══════════════════════════════════════════════════
  // CONTROL DE ESTADO
  // ═══════════════════════════════════════════════════
  status   EmployeeStatus @default(ACTIVE)
  isActive Boolean        @default(true) @map("is_active")
  
  // ═══════════════════════════════════════════════════
  // CONTROL DE SINCRONIZACIÓN
  // ═══════════════════════════════════════════════════
  importSource        ImportSource @default(MANUAL) @map("import_source")
  lastImportId        String?      @map("last_import_id")
  lastSeenInImport    DateTime?    @map("last_seen_in_import")
  pendingReview       Boolean      @default(false) @map("pending_review")
  pendingReviewReason String?      @map("pending_review_reason")
  
  // ═══════════════════════════════════════════════════
  // DEMOGRAFÍA (Opcional - Analytics)
  // ═══════════════════════════════════════════════════
  gender           String?
  dateOfBirth      DateTime? @map("date_of_birth")
  compensationBand String?   @map("compensation_band")
  
  // ═══════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // ═══════════════════════════════════════════════════
  // RELACIONES
  // ═══════════════════════════════════════════════════
  account    Account    @relation(fields: [accountId], references: [id], onDelete: Cascade)
  department Department @relation(fields: [departmentId], references: [id])
  
  // Auto-referencia para jerarquía
  manager      Employee?  @relation("EmployeeHierarchy", fields: [managerId], references: [id])
  subordinates Employee[] @relation("EmployeeHierarchy")
  
  // Historial de cambios
  history EmployeeHistory[]
  
  // Evaluaciones
  assignmentsAsEvaluator EvaluationAssignment[] @relation("Evaluator")
  assignmentsAsEvaluatee EvaluationAssignment[] @relation("Evaluatee")
  assignmentsAsDelegated EvaluationAssignment[] @relation("DelegatedEvaluator")
  
  // Participaciones en encuestas
  participations Participant[]

  // ═══════════════════════════════════════════════════
  // ÍNDICES Y CONSTRAINTS
  // ═══════════════════════════════════════════════════
  @@unique([accountId, nationalId], map: "unique_employee_rut")
  @@index([accountId], map: "idx_employees_account")
  @@index([departmentId], map: "idx_employees_department")
  @@index([managerId], map: "idx_employees_manager")
  @@index([status], map: "idx_employees_status")
  @@index([isActive], map: "idx_employees_active")
  @@index([hireDate], map: "idx_employees_hire_date")
  @@index([lastSeenInImport], map: "idx_employees_last_seen")
  @@index([pendingReview], map: "idx_employees_pending_review")
  // ✅ ÍNDICE COMPUESTO para queries frecuentes
  @@index([accountId, status, departmentId], map: "idx_employees_account_status_dept")
  @@map("employees")
}

enum EmployeeStatus {
  ACTIVE          // Empleado activo
  INACTIVE        // Terminado/dado de baja
  ON_LEAVE        // Licencia/ausencia temporal
  PENDING_REVIEW  // Ausente en último import, pendiente confirmar
  EXCLUDED        // Excluido de sincronización manualmente
}

enum ImportSource {
  MANUAL      // Creado manualmente en UI
  BULK_IMPORT // Import masivo CSV/Excel
  API         // Creado vía API
}
```

### 4.2 Modelo EmployeeHistory

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE HISTORY - Historial de Cambios Granular (por campo)
// Patrón: Audit trail granular, no por registro completo
// ════════════════════════════════════════════════════════════════════════════

model EmployeeHistory {
  id         String @id @default(cuid())
  employeeId String @map("employee_id")
  accountId  String @map("account_id")  // ✅ FIX D: Multi-tenant defense in depth

  // ═══════════════════════════════════════════════════
  // DETALLE DEL CAMBIO
  // ═══════════════════════════════════════════════════
  changeType    EmployeeChangeType @map("change_type")
  fieldName     String             @map("field_name")   // "managerId", "departmentId", "status"
  oldValue      String?            @map("old_value")
  newValue      String?            @map("new_value")
  effectiveDate DateTime           @default(now()) @map("effective_date")
  
  // ═══════════════════════════════════════════════════
  // CONTEXTO DE POSICIÓN (para cambios de posición)
  // ═══════════════════════════════════════════════════
  departmentId String? @map("department_id")
  managerId    String? @map("manager_id")
  position     String?
  jobTitle     String? @map("job_title")
  
  // ═══════════════════════════════════════════════════
  // ORIGEN DEL CAMBIO
  // ═══════════════════════════════════════════════════
  changeSource  ImportSource @map("change_source")
  changedBy     String?      @map("changed_by")   // userId
  importId      String?      @map("import_id")
  changeReason  String?      @map("change_reason")
  
  createdAt DateTime @default(now()) @map("created_at")

  // Relaciones
  employee   Employee    @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  account    Account     @relation(fields: [accountId], references: [id], onDelete: Cascade)
  department Department? @relation(fields: [departmentId], references: [id])

  // Índices
  @@index([employeeId, effectiveDate], map: "idx_employee_history_emp_date")
  @@index([employeeId, fieldName], map: "idx_employee_history_emp_field")
  @@index([accountId], map: "idx_employee_history_account")
  @@index([importId], map: "idx_employee_history_import")
  @@index([changeType], map: "idx_employee_history_type")
  @@map("employee_history")
}

enum EmployeeChangeType {
  HIRE          // Contratación inicial
  UPDATE        // Cambio de datos
  TRANSFER      // Cambio de departamento
  PROMOTION     // Promoción
  DEMOTION      // Descenso
  MANAGER_CHANGE // Cambio de jefe
  STATUS_CHANGE // Cambio de estado
  TERMINATE     // Baja
  REHIRE        // Recontratación
}
```

### 4.3 Modelo EmployeeImport

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE IMPORT - Registro de Cada Carga
// Patrón: Trazabilidad + Threshold Protection (Cornerstone)
// ════════════════════════════════════════════════════════════════════════════

model EmployeeImport {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // ═══════════════════════════════════════════════════
  // CONFIGURACIÓN DEL IMPORT
  // ═══════════════════════════════════════════════════
  importMode EmployeeImportMode @map("import_mode")
  fileName   String?            @map("file_name")
  
  // ═══════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════
  totalInFile   Int @map("total_in_file")
  created       Int @default(0)
  updated       Int @default(0)
  rehired       Int @default(0)  // ✅ FIX ZOMBIES (v3.0.1)
  unchanged     Int @default(0)
  deactivated   Int @default(0)
  pendingReview Int @default(0) @map("pending_review")
  errors        Int @default(0)
  
  // ═══════════════════════════════════════════════════
  // CONTROL DE THRESHOLD
  // ═══════════════════════════════════════════════════
  missingCount      Int     @default(0) @map("missing_count")
  missingPercent    Float   @default(0) @map("missing_percent")
  thresholdExceeded Boolean @default(false) @map("threshold_exceeded")
  thresholdUsed     Float   @default(0.10) @map("threshold_used")
  
  // ═══════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════
  status      EmployeeImportStatus @default(PENDING)
  startedAt   DateTime             @default(now()) @map("started_at")
  completedAt DateTime?            @map("completed_at")
  
  // Errores detallados
  errorLog Json? @map("error_log")
  
  // Usuario que ejecutó
  executedBy String? @map("executed_by")
  
  createdAt DateTime @default(now()) @map("created_at")

  // Relaciones
  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  // Índices
  @@index([accountId, startedAt], map: "idx_employee_imports_account_date")
  @@index([status], map: "idx_employee_imports_status")
  @@map("employee_imports")
}

enum EmployeeImportMode {
  INCREMENTAL // Solo upsert, no detecta ausentes
  FULL        // Detecta ausentes, reconciliación completa
  PREVIEW     // Solo validación, sin cambios
}

enum EmployeeImportStatus {
  PENDING               // Esperando inicio
  VALIDATING            // Validando archivo
  PROCESSING            // Procesando cambios
  AWAITING_CONFIRMATION // Threshold excedido
  COMPLETED             // Completado
  FAILED                // Falló
  CANCELLED             // Cancelado
}
```

### 4.4 Modelo PerformanceCycle

```prisma
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE CYCLE - Ciclo de Evaluación
// Patrón: Review Cycle (Lattice), Performance Cycle (Culture Amp)
// ════════════════════════════════════════════════════════════════════════════

model PerformanceCycle {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // Vínculo con Campaign (para Questions)
  campaignId String?   @unique @map("campaign_id")
  campaign   Campaign? @relation(fields: [campaignId], references: [id])

  // Identificación
  name        String
  description String?
  
  // Período
  startDate DateTime @map("start_date")
  endDate   DateTime @map("end_date")
  
  // Tipo de ciclo
  cycleType PerformanceCycleType @default(QUARTERLY) @map("cycle_type")
  
  // Configuración: qué tipos de evaluación incluye
  includesSelf    Boolean @default(false) @map("includes_self")
  includesManager Boolean @default(true) @map("includes_manager")
  includesPeer    Boolean @default(false) @map("includes_peer")
  includesUpward  Boolean @default(false) @map("includes_upward")
  
  // Configuración adicional
  anonymousResults Boolean @default(true) @map("anonymous_results")
  minSubordinates  Int     @default(3) @map("min_subordinates")  // Mínimo para upward
  
  // Estado
  status PerformanceCycleStatus @default(DRAFT)
  
  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  createdBy String?  @map("created_by")

  // Relaciones
  account     Account              @relation(fields: [accountId], references: [id], onDelete: Cascade)
  assignments EvaluationAssignment[]

  // Índices
  @@index([accountId], map: "idx_performance_cycles_account")
  @@index([status], map: "idx_performance_cycles_status")
  @@index([startDate], map: "idx_performance_cycles_start")
  @@map("performance_cycles")
}

enum PerformanceCycleType {
  MONTHLY       // Mensual
  QUARTERLY     // Trimestral
  SEMI_ANNUAL   // Semestral
  ANNUAL        // Anual
  IMPACT_PULSE  // Impact Pulse (upward de líderes)
  PROBATION     // Período de prueba
  CUSTOM        // Personalizado
}

enum PerformanceCycleStatus {
  DRAFT       // Configurando
  SCHEDULED   // Programado
  ACTIVE      // En progreso
  IN_REVIEW   // Revisando resultados
  COMPLETED   // Cerrado
  CANCELLED   // Cancelado
}
```

### 4.5 Modelo EvaluationAssignment (SNAPSHOT)

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EVALUATION ASSIGNMENT - Snapshot Congelado "X evalúa a Y"
// Patrón: Form Instance (SAP), Feedback Request (Culture Amp)
// CLAVE: Datos CONGELADOS - NO cambian aunque Employee cambie
// ════════════════════════════════════════════════════════════════════════════

model EvaluationAssignment {
  id        String @id @default(cuid())
  accountId String @map("account_id")
  cycleId   String @map("cycle_id")

  // ═══════════════════════════════════════════════════
  // REFERENCIAS A EMPLOYEE (para queries de evolución)
  // ═══════════════════════════════════════════════════
  evaluateeId String   @map("evaluatee_id")
  evaluatee   Employee @relation("Evaluatee", fields: [evaluateeId], references: [id])
  
  evaluatorId String   @map("evaluator_id")
  evaluator   Employee @relation("Evaluator", fields: [evaluatorId], references: [id])

  // ═══════════════════════════════════════════════════
  // SNAPSHOT CONGELADO (NUNCA cambia)
  // ═══════════════════════════════════════════════════
  snapshotDate DateTime @map("snapshot_date")
  
  // Datos del EVALUADO al momento del snapshot
  evaluateeName         String  @map("evaluatee_name")
  evaluateeNationalId   String  @map("evaluatee_national_id")
  evaluateeDepartmentId String  @map("evaluatee_department_id")
  evaluateeDepartment   String  @map("evaluatee_department")  // Denormalizado
  evaluateePosition     String? @map("evaluatee_position")
  
  // Datos del EVALUADOR al momento del snapshot
  evaluatorName         String  @map("evaluator_name")
  evaluatorNationalId   String  @map("evaluator_national_id")
  evaluatorDepartment   String? @map("evaluator_department")

  // Tipo de evaluación
  evaluationType EvaluationType @map("evaluation_type")

  // ═══════════════════════════════════════════════════
  // VÍNCULO CON PARTICIPANT
  // ═══════════════════════════════════════════════════
  participantId String?      @unique @map("participant_id")
  participant   Participant? @relation(fields: [participantId], references: [id])

  // ═══════════════════════════════════════════════════
  // ESTADO Y WORKFLOW
  // ═══════════════════════════════════════════════════
  status EvaluationAssignmentStatus @default(PENDING)
  
  assignedAt    DateTime  @default(now()) @map("assigned_at")
  startedAt     DateTime? @map("started_at")
  submittedAt   DateTime? @map("submitted_at")
  dueDate       DateTime? @map("due_date")
  reminderCount Int       @default(0) @map("reminder_count")

  // ═══════════════════════════════════════════════════
  // DELEGACIÓN/SUSTITUTO
  // ═══════════════════════════════════════════════════
  delegatedToId    String?   @map("delegated_to_id")
  delegatedTo      Employee? @relation("DelegatedEvaluator", fields: [delegatedToId], references: [id])
  delegatedToName  String?   @map("delegated_to_name")
  delegatedAt      DateTime? @map("delegated_at")
  delegationReason String?   @map("delegation_reason")

  // Metadata
  notes     String?
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  cycle   PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  account Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)

  // ═══════════════════════════════════════════════════
  // CONSTRAINT: Un evaluador evalúa a un evaluatee UNA vez por ciclo y tipo
  // ═══════════════════════════════════════════════════
  @@unique([cycleId, evaluatorId, evaluateeId, evaluationType], map: "unique_evaluation_assignment")
  
  // Índices
  @@index([cycleId], map: "idx_eval_assignments_cycle")
  @@index([accountId], map: "idx_eval_assignments_account")
  @@index([evaluatorId], map: "idx_eval_assignments_evaluator")
  @@index([evaluateeId], map: "idx_eval_assignments_evaluatee")
  @@index([status], map: "idx_eval_assignments_status")
  @@index([evaluationType], map: "idx_eval_assignments_type")
  // ✅ ÍNDICE COMPUESTO para "¿Quién evalúa a X?"
  @@index([evaluateeId, status], map: "idx_eval_assignments_evaluatee_status")
  @@map("evaluation_assignments")
}

enum EvaluationType {
  SELF                  // Auto-evaluación
  MANAGER_TO_EMPLOYEE   // Jefe evalúa subordinado (downward)
  EMPLOYEE_TO_MANAGER   // Subordinado evalúa jefe (upward) - IMPACT PULSE
  PEER                  // Entre pares
  SKIP_LEVEL            // Saltando nivel
}

enum EvaluationAssignmentStatus {
  PENDING       // Asignado, no iniciado
  IN_PROGRESS   // Evaluador comenzó
  SUBMITTED     // Evaluador terminó
  DELEGATED     // Delegado a sustituto
  WITHDRAWN     // Retirado (evaluador renunció)
  EXPIRED       // Venció sin completar
}
```

### 4.6 Modificaciones a Modelos Existentes

```prisma
// ════════════════════════════════════════════════════════════════════════════
// AGREGAR EN Account (existente)
// ════════════════════════════════════════════════════════════════════════════

model Account {
  // ... campos existentes (NO modificar) ...
  
  // ✅ AGREGAR:
  employees             Employee[]
  employeeHistory       EmployeeHistory[]
  employeeImports       EmployeeImport[]
  performanceCycles     PerformanceCycle[]
  evaluationAssignments EvaluationAssignment[]
}

// ════════════════════════════════════════════════════════════════════════════
// AGREGAR EN Campaign (existente)
// ════════════════════════════════════════════════════════════════════════════

model Campaign {
  // ... campos existentes (NO modificar) ...
  
  // ✅ AGREGAR:
  performanceCycle PerformanceCycle?
}

// ════════════════════════════════════════════════════════════════════════════
// AGREGAR EN Department (existente)
// ════════════════════════════════════════════════════════════════════════════

model Department {
  // ... campos existentes (NO modificar) ...
  
  // ✅ AGREGAR:
  employees       Employee[]
  employeeHistory EmployeeHistory[]
}

// ════════════════════════════════════════════════════════════════════════════
// MODIFICAR Participant (existente)
// ════════════════════════════════════════════════════════════════════════════

model Participant {
  // ... campos existentes ...
  
  // ✅ AGREGAR:
  employeeId String? @map("employee_id")
  employee   Employee? @relation(fields: [employeeId], references: [id])
  
  evaluationAssignment EvaluationAssignment?
  
  @@index([employeeId], map: "idx_participants_employee")
}

// ════════════════════════════════════════════════════════════════════════════
// MODIFICAR Response (existente)
// ════════════════════════════════════════════════════════════════════════════

model Response {
  // ... campos existentes ...
  
  // ✅ AGREGAR: Para saber QUIÉN respondió (el evaluador)
  evaluatorEmployeeId String? @map("evaluator_employee_id")
  
  @@index([evaluatorEmployeeId], map: "idx_responses_evaluator")
}
```

---

## 5. ALGORITMO DE SINCRONIZACIÓN

### 5.1 Estrategia de Fases - Importación de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│              EMPLOYEE SYNC - ROADMAP DE INTEGRACIÓN                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FASE 1 (IMPLEMENTAR AHORA) - Carga Manual CSV/Excel               │
│  ════════════════════════════════════════════════════              │
│  • Formato estándar FocalizaHR IMPUESTO                            │
│  • Campo `isActive` explícito en CSV (true/false)                  │
│  • Cliente llena manualmente el estado                              │
│  • CERO mapeos flexibles, CERO resolvers                           │
│  • Simple: isActive=false → status='INACTIVE'                      │
│                                                                     │
│  FASE 2 (FUTURO) - Integraciones API HRIS                          │
│  ════════════════════════════════════════════════════              │
│  • Conexión directa: SAP, Workday, Buk, BambooHR                   │
│  • Cada sistema representa estado diferente:                        │
│    - SAP: "0" = activo, "3" = despedido                            │
│    - Workday: "Active", "Terminated", "Leave"                      │
│    - Buk: "vigente", "finiquitado"                                 │
│  • Requiere: AccountDataMapping + TerminationStatusResolver        │
│  • NO implementar hasta que haya clientes con integración API      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **CAMBIO DE ESTRATEGIA:** Hemos descartado la lógica de "mapeo flexible complejo" para esta fase. Imponemos un formato estándar en el CSV. No generar tablas de configuración ni resolvers complejos.

### 5.2 Formato CSV Estándar (Fase 1)

El cliente **DEBE** usar este formato exacto. No hay mapeos flexibles.

```csv
nationalId,fullName,email,phoneNumber,departmentName,managerRut,position,jobTitle,seniorityLevel,hireDate,isActive
12345678-9,Juan Pérez,juan@empresa.cl,+56912345678,Gerencia General,,CEO,Chief Executive Officer,executive,2020-01-15,true
12345678-K,María García,maria@empresa.cl,+56987654321,Gerencia Comercial,12345678-9,Gerente Comercial,Sales Director,lead,2021-03-01,true
11111111-1,Pedro López,pedro@empresa.cl,,Ventas Nacional,12345678-K,Vendedor Senior,Senior Sales Rep,senior,2022-06-15,true
22222222-2,Ana Torres,ana@empresa.cl,,Ventas Nacional,12345678-K,Vendedora,Sales Rep,mid,2023-01-10,false
```

#### Campos Obligatorios

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `nationalId` | String | RUT chileno (con dígito verificador) | `12345678-9` |
| `fullName` | String | Nombre completo | `Juan Pérez González` |
| `departmentName` | String | Nombre del departamento | `Ventas Nacional` |
| `hireDate` | Date | Fecha de ingreso (YYYY-MM-DD) | `2020-01-15` |
| `isActive` | Boolean | **Estado explícito** (`true`/`false`) | `true` |

#### Campos Opcionales

| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `email` | String | Email corporativo | `null` |
| `phoneNumber` | String | Teléfono (formato E.164) | `null` |
| `managerRut` | String | RUT del jefe directo | `null` (CEO) |
| `position` | String | Cargo corto | `null` |
| `jobTitle` | String | Título formal | `null` |
| `seniorityLevel` | String | Nivel: `junior\|mid\|senior\|lead\|executive` | `null` |

#### Reglas de Procesamiento

```typescript
// El campo isActive se mapea directamente a status
function mapIsActiveToStatus(isActive: boolean | string): EmployeeStatus {
  // Normalizar string a boolean
  const active = typeof isActive === 'string' 
    ? ['true', '1', 'yes', 'si', 'activo'].includes(isActive.toLowerCase())
    : isActive;
  
  return active ? 'ACTIVE' : 'INACTIVE';
}

// En el procesamiento del CSV:
const status = mapIsActiveToStatus(row.isActive);
const employee = {
  ...otherFields,
  status,
  isActive: status === 'ACTIVE'
};
```

#### Validaciones

```yaml
VALIDACIONES OBLIGATORIAS:
  nationalId:
    - Formato RUT válido (con módulo 11)
    - Único por cuenta
  
  fullName:
    - No vacío
    - Mínimo 2 caracteres
  
  departmentName:
    - Se busca/crea departamento automáticamente
    - Si no existe, se crea con categoría "sin_asignar"
  
  hireDate:
    - Fecha válida
    - No puede ser futura (más de 30 días)
  
  isActive:
    - Obligatorio
    - Valores válidos: true, false, 1, 0, yes, no, si, activo, inactivo
  
  managerRut:
    - Si se proporciona, debe existir en el archivo o en BD
    - Se valida que no cree ciclos jerárquicos
```

### 5.3 Configuración del Sync

```typescript
// src/lib/services/EmployeeSyncService.ts

interface EmployeeSyncConfig {
  mode: 'INCREMENTAL' | 'FULL';
  missingThreshold: number;           // default: 0.10 (10%)
  autoDeactivateMissing: boolean;     // default: false
  preserveManualExclusions: boolean;  // default: true
}

const DEFAULT_SYNC_CONFIG: EmployeeSyncConfig = {
  mode: 'FULL',
  missingThreshold: 0.10,
  autoDeactivateMissing: false,
  preserveManualExclusions: true
};
```

### 5.4 Algoritmo Completo con Fix N+1 + Fix "Zombies"

```typescript
/**
 * Procesa import de empleados con protección threshold
 * FIX N+1: Pre-carga managers en memoria con Map
 * FIX ZOMBIES (v3.0.1): Reactiva empleados INACTIVE que reaparecen en archivo
 */
export async function processEmployeeImport(
  accountId: string,
  fileData: EmployeeRow[],
  config: EmployeeSyncConfig = DEFAULT_SYNC_CONFIG,
  userId?: string
): Promise<ImportResult> {

  // 1. Crear registro de import
  const importRecord = await prisma.employeeImport.create({
    data: {
      accountId,
      importMode: config.mode,
      totalInFile: fileData.length,
      status: 'VALIDATING',
      executedBy: userId
    }
  });

  try {
    // ════════════════════════════════════════════════════════════════════════
    // FIX ZOMBIES (v3.0.1): Obtener TODOS los empleados, no solo activos
    // Esto permite detectar recontrataciones de empleados INACTIVE
    // ════════════════════════════════════════════════════════════════════════
    const allEmployees = await prisma.employee.findMany({
      where: { accountId }  // TODOS, incluyendo INACTIVE
    });
    
    // Separar activos para cálculo de threshold
    const activeEmployees = allEmployees.filter(e => 
      ['ACTIVE', 'ON_LEAVE'].includes(e.status)
    );

    // ════════════════════════════════════════════════════════════════════════
    // FIX N+1: PRE-CARGAR MANAGERS EN MEMORIA
    // En lugar de 1 query por empleado, hacemos 1 query total
    // ════════════════════════════════════════════════════════════════════════
    const allManagerRuts = fileData
      .map(e => e.managerRut)
      .filter((rut): rut is string => !!rut)
      .map(rut => normalizeRut(rut));
    
    const existingManagers = allManagerRuts.length > 0 
      ? await prisma.employee.findMany({
          where: { 
            accountId, 
            nationalId: { in: [...new Set(allManagerRuts)] }
          },
          select: { id: true, nationalId: true }
        })
      : [];
    
    // Crear mapa RUT → ID para lookup O(1)
    const managerMap = new Map<string, string>(
      existingManagers.map(m => [m.nationalId, m.id])
    );
    
    console.log(`[Import] Pre-cargados ${managerMap.size} managers de ${allManagerRuts.length} referencias`);
    // ════════════════════════════════════════════════════════════════════════

    // 3. Crear mapas por RUT - TODOS los empleados, no solo activos
    const fileMap = new Map(fileData.map(e => [normalizeRut(e.nationalId), e]));
    const allEmployeesMap = new Map(allEmployees.map(e => [e.nationalId, e]));

    // 4. Clasificar
    const toCreate: EmployeeRow[] = [];
    const toUpdate: { current: Employee; newData: EmployeeRow; changes: FieldChange[] }[] = [];
    const toRehire: { current: Employee; newData: EmployeeRow }[] = [];  // ✅ FIX ZOMBIES
    const missing: Employee[] = [];
    const errors: ImportError[] = [];
    const cycleWarnings: CycleWarning[] = [];

    // Detectar nuevos, cambios Y RECONTRATACIONES
    for (const [rut, fileEmp] of fileMap) {
      // Validar RUT
      if (!validateRut(rut)) {
        errors.push({ nationalId: rut, error: 'RUT inválido' });
        continue;
      }

      // Buscar manager en Map (O(1), ZERO queries adicionales)
      let managerId: string | null = null;
      if (fileEmp.managerRut) {
        const managerRut = normalizeRut(fileEmp.managerRut);
        managerId = managerMap.get(managerRut) || null;
        
        if (!managerId) {
          cycleWarnings.push({
            nationalId: rut,
            managerRut: fileEmp.managerRut,
            warning: 'Manager no encontrado, se asignará NULL'
          });
        }
      }

      const existing = allEmployeesMap.get(rut);  // Busca en TODOS
      
      if (existing) {
        // ════════════════════════════════════════════════════════════════════════
        // FIX ZOMBIES (v3.0.1): Si está INACTIVE, es una recontratación
        // ════════════════════════════════════════════════════════════════════════
        if (existing.status === 'INACTIVE') {
          console.log(`[Import] 🧟 ZOMBIE detectado: ${existing.fullName} será reactivado`);
          toRehire.push({ 
            current: existing, 
            newData: { ...fileEmp, resolvedManagerId: managerId } 
          });
          continue;  // No procesar como update normal
        }
        
        // Employee activo - verificar cambios
        const changes = detectChanges(existing, fileEmp, managerId);
        if (changes.length > 0) {
          // Validar ciclo si cambia manager
          if (managerId && managerId !== existing.managerId) {
            const cycleCheck = await validateNoCycle(existing.id, managerId);
            if (!cycleCheck.valid) {
              errors.push({ nationalId: rut, error: cycleCheck.error || 'Ciclo detectado' });
              continue;
            }
          }
          toUpdate.push({ current: existing, newData: fileEmp, changes });
        }
      } else {
        // RUT completamente nuevo
        toCreate.push({ ...fileEmp, resolvedManagerId: managerId });
      }
    }

    // Detectar ausentes (solo en FULL) - solo entre ACTIVOS
    if (config.mode === 'FULL') {
      for (const emp of activeEmployees) {
        if (!fileMap.has(emp.nationalId)) {
          if (config.preserveManualExclusions && emp.status === 'EXCLUDED') {
            continue;
          }
          missing.push(emp);
        }
      }
    }

    // 5. Validar threshold (solo sobre activos)
    const missingPercent = activeEmployees.length > 0 
      ? missing.length / activeEmployees.length 
      : 0;
    
    if (missingPercent > config.missingThreshold) {
      await prisma.employeeImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'AWAITING_CONFIRMATION',
          missingCount: missing.length,
          missingPercent,
          thresholdExceeded: true,
          errors: errors.length,
          errorLog: errors.length > 0 ? errors : undefined
        }
      });

      return {
        status: 'AWAITING_CONFIRMATION',
        importId: importRecord.id,
        message: `${(missingPercent * 100).toFixed(1)}% ausentes (${missing.length}). Límite: ${config.missingThreshold * 100}%`,
        preview: {
          toCreate: toCreate.length,
          toUpdate: toUpdate.length,
          missing: missing.map(e => ({ id: e.id, name: e.fullName, rut: e.nationalId })),
          errors
        }
      };
    }

    // 6. Ejecutar cambios en transacción
    await prisma.$transaction(async (tx) => {
      // Crear nuevos
      for (const emp of toCreate) {
        const newEmployee = await tx.employee.create({
          data: {
            accountId,
            nationalId: normalizeRut(emp.nationalId),
            fullName: emp.fullName,
            email: emp.email,
            phoneNumber: emp.phoneNumber,
            departmentId: emp.departmentId,
            managerId: emp.resolvedManagerId,
            position: emp.position,
            jobTitle: emp.jobTitle,
            hireDate: new Date(emp.hireDate),
            seniorityLevel: emp.seniorityLevel,
            importSource: 'BULK_IMPORT',
            lastImportId: importRecord.id,
            lastSeenInImport: new Date()
          }
        });

        // Registrar en history
        await tx.employeeHistory.create({
          data: {
            employeeId: newEmployee.id,
            accountId,
            changeType: 'HIRE',
            fieldName: 'status',
            newValue: 'ACTIVE',
            departmentId: emp.departmentId,
            managerId: emp.resolvedManagerId,
            position: emp.position,
            changeSource: 'BULK_IMPORT',
            importId: importRecord.id,
            changedBy: userId
          }
        });
      }

      // Actualizar existentes
      for (const { current, newData, changes } of toUpdate) {
        // Registrar cada cambio en history
        for (const change of changes) {
          await tx.employeeHistory.create({
            data: {
              employeeId: current.id,
              accountId,
              changeType: mapFieldToChangeType(change.field),
              fieldName: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              changeSource: 'BULK_IMPORT',
              importId: importRecord.id,
              changedBy: userId
            }
          });
        }

        // Update employee
        await tx.employee.update({
          where: { id: current.id },
          data: {
            ...mapEmployeeFields(newData),
            lastImportId: importRecord.id,
            lastSeenInImport: new Date()
          }
        });
      }

      // ════════════════════════════════════════════════════════════════════════
      // FIX ZOMBIES (v3.0.1): Reactivar empleados que vuelven
      // ════════════════════════════════════════════════════════════════════════
      for (const { current, newData } of toRehire) {
        const newTenure = current.tenureCount + 1;
        
        // Reactivar employee
        await tx.employee.update({
          where: { id: current.id },
          data: {
            ...mapEmployeeFields(newData),
            status: 'ACTIVE',
            isActive: true,
            rehireDate: new Date(),
            tenureCount: newTenure,
            terminatedAt: null,
            terminationReason: null,
            pendingReview: false,
            pendingReviewReason: null,
            lastImportId: importRecord.id,
            lastSeenInImport: new Date()
          }
        });

        // Registrar recontratación en history
        await tx.employeeHistory.create({
          data: {
            employeeId: current.id,
            accountId,
            changeType: 'REHIRE',
            fieldName: 'status',
            oldValue: 'INACTIVE',
            newValue: 'ACTIVE',
            departmentId: newData.departmentId,
            managerId: newData.resolvedManagerId,
            position: newData.position,
            changeSource: 'BULK_IMPORT',
            importId: importRecord.id,
            changeReason: `Recontratación automática (tenure #${newTenure})`,
            changedBy: userId
          }
        });

        console.log(`[Import] ✅ Zombie reactivado: ${current.fullName} (tenure #${newTenure})`);
      }

      // Marcar ausentes para revisión (NO auto-desactivar por defecto)
      for (const emp of missing) {
        if (config.autoDeactivateMissing) {
          await tx.employeeHistory.create({
            data: {
              employeeId: emp.id,
              accountId,
              changeType: 'TERMINATE',
              fieldName: 'status',
              oldValue: emp.status,
              newValue: 'INACTIVE',
              changeSource: 'BULK_IMPORT',
              importId: importRecord.id,
              changeReason: 'No incluido en archivo de import'
            }
          });

          await tx.employee.update({
            where: { id: emp.id },
            data: {
              status: 'INACTIVE',
              isActive: false,
              terminatedAt: new Date(),
              terminationReason: 'not_in_import'
            }
          });
        } else {
          await tx.employee.update({
            where: { id: emp.id },
            data: {
              pendingReview: true,
              pendingReviewReason: `No incluido en import del ${new Date().toLocaleDateString()}`
            }
          });
        }
      }

      // Actualizar registro de import
      await tx.employeeImport.update({
        where: { id: importRecord.id },
        data: {
          created: toCreate.length,
          updated: toUpdate.length,
          rehired: toRehire.length,  // ✅ FIX ZOMBIES (v3.0.1)
          unchanged: activeEmployees.length - toUpdate.length - missing.length - toRehire.length,
          pendingReview: config.autoDeactivateMissing ? 0 : missing.length,
          deactivated: config.autoDeactivateMissing ? missing.length : 0,
          missingCount: missing.length,
          missingPercent,
          errors: errors.length,
          errorLog: errors.length > 0 ? errors : undefined,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    });

    return {
      status: 'COMPLETED',
      importId: importRecord.id,
      created: toCreate.length,
      updated: toUpdate.length,
      rehired: toRehire.length,  // ✅ FIX ZOMBIES (v3.0.1)
      pendingReview: config.autoDeactivateMissing ? 0 : missing.length,
      errors: errors.length,
      cycleWarnings: cycleWarnings.length
    };

  } catch (error: any) {
    await prisma.employeeImport.update({
      where: { id: importRecord.id },
      data: {
        status: 'FAILED',
        errorLog: { message: error.message }
      }
    });
    throw error;
  }
}
```

---

## 6. APIS Y ENDPOINTS

### 6.1 Employee Sync APIs

```typescript
// src/app/api/admin/employees/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  extractUserContext, 
  hasPermission 
} from '@/lib/services/AuthorizationService';
import { processEmployeeImport, DEFAULT_SYNC_CONFIG } from '@/lib/services/EmployeeSyncService';

/**
 * POST /api/admin/employees/sync
 * Sincronizar archivo de empleados
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 400 }
      );
    }
    
    // ✅ FORMA CORRECTA: Usar hasPermission centralizado
    if (!hasPermission(userContext.role, 'employees:sync')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para sincronizar employees' },
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

### 6.2 Employee CRUD con Handlers Especiales

```typescript
// src/app/api/admin/employees/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateNoCycle } from '@/lib/services/EmployeeService';

/**
 * GET /api/admin/employees/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = request.headers.get('x-account-id');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { id: params.id, accountId },
      include: {
        department: { select: { id: true, displayName: true } },
        manager: { select: { id: true, fullName: true, nationalId: true } },
        subordinates: {
          where: { isActive: true },
          select: { id: true, fullName: true, position: true }
        },
        history: {
          orderBy: { effectiveDate: 'desc' },
          take: 20
        },
        _count: { select: { subordinates: true } }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee
    });

  } catch (error: any) {
    console.error('[API] Error en GET employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/employees/[id]
 * Actualizar employee con handlers especiales
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = request.headers.get('x-account-id');
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 400 }
      );
    }

    const current = await prisma.employee.findFirst({
      where: { id: params.id, accountId }
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Employee no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    // ════════════════════════════════════════════════════════════════════════
    // HANDLERS ESPECIALES
    // ════════════════════════════════════════════════════════════════════════
    
    if (action === 'terminate') {
      return handleTermination(current, body, userId, accountId);
    }
    
    if (action === 'rehire') {
      return handleRehire(current, body, userId, accountId);
    }
    
    if (action === 'transfer') {
      return handleTransfer(current, body, userId, accountId);
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE NORMAL
    // ════════════════════════════════════════════════════════════════════════
    
    // Validar ciclo si cambia manager
    if (updateData.managerId && updateData.managerId !== current.managerId) {
      const cycleCheck = await validateNoCycle(current.id, updateData.managerId);
      if (!cycleCheck.valid) {
        return NextResponse.json(
          { success: false, error: cycleCheck.error },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.employee.update({
      where: { id: params.id },
      data: updateData
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        action: 'EMPLOYEE_UPDATE',
        accountId,
        entityType: 'employee',
        entityId: params.id,
        oldValues: current,
        newValues: updated,
        userInfo: { userId, role: userRole }
      }
    });

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('[API] Error en PATCH employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER: TERMINATION
// ════════════════════════════════════════════════════════════════════════════

async function handleTermination(
  employee: any,
  body: { terminationReason?: string },
  userId: string | null,
  accountId: string
) {
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update employee
    const emp = await tx.employee.update({
      where: { id: employee.id },
      data: {
        status: 'INACTIVE',
        isActive: false,
        terminatedAt: new Date(),
        terminationReason: body.terminationReason || 'voluntary'
      }
    });

    // 2. Crear registro en history
    await tx.employeeHistory.create({
      data: {
        employeeId: employee.id,
        accountId,
        changeType: 'TERMINATE',
        fieldName: 'status',
        oldValue: 'ACTIVE',
        newValue: 'INACTIVE',
        departmentId: employee.departmentId,
        managerId: employee.managerId,
        position: employee.position,
        changeSource: 'MANUAL',
        changeReason: body.terminationReason,
        changedBy: userId
      }
    });

    return emp;
  });

  // Auditoría
  await prisma.auditLog.create({
    data: {
      action: 'EMPLOYEE_TERMINATE',
      accountId,
      entityType: 'employee',
      entityId: employee.id,
      oldValues: { status: 'ACTIVE' },
      newValues: { status: 'INACTIVE', reason: body.terminationReason },
      userInfo: { userId }
    }
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Employee dado de baja correctamente'
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER: REHIRE
// ════════════════════════════════════════════════════════════════════════════

async function handleRehire(
  employee: any,
  body: { departmentId?: string; managerId?: string; position?: string },
  userId: string | null,
  accountId: string
) {
  if (employee.status !== 'INACTIVE') {
    return NextResponse.json(
      { success: false, error: 'Solo se puede recontratar employees terminados' },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const emp = await tx.employee.update({
      where: { id: employee.id },
      data: {
        status: 'ACTIVE',
        isActive: true,
        rehireDate: new Date(),
        tenureCount: { increment: 1 },
        departmentId: body.departmentId || employee.departmentId,
        managerId: body.managerId || employee.managerId,
        position: body.position || employee.position,
        terminatedAt: null,
        terminationReason: null,
        pendingReview: false,
        pendingReviewReason: null
      }
    });

    // Crear registro en history
    await tx.employeeHistory.create({
      data: {
        employeeId: employee.id,
        accountId,
        changeType: 'REHIRE',
        fieldName: 'status',
        oldValue: 'INACTIVE',
        newValue: 'ACTIVE',
        departmentId: body.departmentId || employee.departmentId,
        managerId: body.managerId || employee.managerId,
        position: body.position || employee.position,
        changeSource: 'MANUAL',
        changeReason: 'Recontratación',
        changedBy: userId
      }
    });

    return emp;
  });

  await prisma.auditLog.create({
    data: {
      action: 'EMPLOYEE_REHIRE',
      accountId,
      entityType: 'employee',
      entityId: employee.id,
      oldValues: { status: 'INACTIVE', tenureCount: employee.tenureCount },
      newValues: { status: 'ACTIVE', tenureCount: employee.tenureCount + 1 },
      userInfo: { userId }
    }
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: `Employee recontratado (tenure #${updated.tenureCount})`
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HANDLER: TRANSFER
// ════════════════════════════════════════════════════════════════════════════

async function handleTransfer(
  employee: any,
  body: { departmentId: string; managerId?: string; position?: string; reason?: string },
  userId: string | null,
  accountId: string
) {
  // Validar ciclo si cambia manager
  if (body.managerId && body.managerId !== employee.managerId) {
    const cycleCheck = await validateNoCycle(employee.id, body.managerId);
    if (!cycleCheck.valid) {
      return NextResponse.json(
        { success: false, error: cycleCheck.error },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Crear registro de transfer en history
    await tx.employeeHistory.create({
      data: {
        employeeId: employee.id,
        accountId,
        changeType: 'TRANSFER',
        fieldName: 'departmentId',
        oldValue: employee.departmentId,
        newValue: body.departmentId,
        departmentId: body.departmentId,
        managerId: body.managerId || employee.managerId,
        position: body.position || employee.position,
        changeSource: 'MANUAL',
        changeReason: body.reason,
        changedBy: userId
      }
    });

    // Si también cambia manager, registrar ese cambio
    if (body.managerId && body.managerId !== employee.managerId) {
      await tx.employeeHistory.create({
        data: {
          employeeId: employee.id,
          accountId,
          changeType: 'MANAGER_CHANGE',
          fieldName: 'managerId',
          oldValue: employee.managerId,
          newValue: body.managerId,
          departmentId: body.departmentId,
          managerId: body.managerId,
          changeSource: 'MANUAL',
          changeReason: body.reason,
          changedBy: userId
        }
      });
    }

    // Update employee
    return tx.employee.update({
      where: { id: employee.id },
      data: {
        departmentId: body.departmentId,
        managerId: body.managerId,
        position: body.position,
        lastTransferDate: new Date()
      }
    });
  });

  await prisma.auditLog.create({
    data: {
      action: 'EMPLOYEE_TRANSFER',
      accountId,
      entityType: 'employee',
      entityId: employee.id,
      oldValues: {
        departmentId: employee.departmentId,
        managerId: employee.managerId
      },
      newValues: {
        departmentId: body.departmentId,
        managerId: body.managerId
      },
      userInfo: { userId }
    }
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Employee transferido correctamente'
  });
}
```

### 6.3 GET /api/admin/employees (Lista con Filtros)

```typescript
// src/app/api/admin/employees/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/employees
 * Lista employees con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId requerido' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status') || 'ACTIVE';
    const managerId = searchParams.get('managerId');
    const pendingReview = searchParams.get('pendingReview');

    // Construir filtros
    const where: any = {
      accountId
    };

    if (status !== 'all') {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (managerId) {
      where.managerId = managerId;
    }

    if (pendingReview === 'true') {
      where.pendingReview = true;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Query con paginación
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: {
            select: { id: true, displayName: true }
          },
          manager: {
            select: { id: true, fullName: true }
          },
          _count: {
            select: { subordinates: true }
          }
        },
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit
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
      }
    });

  } catch (error: any) {
    console.error('[API] Error en GET employees:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 7. SERVICES Y LÓGICA DE NEGOCIO

### 7.1 EmployeeService

```typescript
// src/lib/services/EmployeeService.ts

import { prisma } from '@/lib/prisma';

export class EmployeeService {

  /**
   * Valida que asignar newManagerId no cree ciclo jerárquico
   * Usa CTE recursivo igual que AuthorizationService
   */
  static async validateNoCycle(
    employeeId: string,
    newManagerId: string | null
  ): Promise<{ valid: boolean; error?: string }> {
    
    // Sin manager = CEO, siempre válido
    if (!newManagerId) {
      return { valid: true };
    }
    
    // Auto-referencia = inválido
    if (employeeId === newManagerId) {
      return { 
        valid: false, 
        error: 'Un empleado no puede ser su propio jefe' 
      };
    }
    
    // CTE: Subir desde newManagerId buscando si llegamos a employeeId
    const result = await prisma.$queryRaw<{ creates_cycle: boolean }[]>`
      WITH RECURSIVE manager_chain AS (
        SELECT id, manager_id, 1 as depth
        FROM employees
        WHERE id = ${newManagerId}
        
        UNION ALL
        
        SELECT e.id, e.manager_id, mc.depth + 1
        FROM employees e
        JOIN manager_chain mc ON e.id = mc.manager_id
        WHERE mc.depth < 10
      )
      SELECT EXISTS(
        SELECT 1 FROM manager_chain WHERE id = ${employeeId}
      ) as creates_cycle
    `;
    
    if (result[0]?.creates_cycle) {
      return { 
        valid: false, 
        error: 'Ciclo detectado: este empleado ya es jefe (directo o indirecto) del manager propuesto' 
      };
    }
    
    return { valid: true };
  }

  /**
   * Obtiene subordinados directos e indirectos
   */
  static async getSubordinates(
    employeeId: string,
    includeIndirect: boolean = true
  ): Promise<string[]> {
    
    if (!includeIndirect) {
      const directReports = await prisma.employee.findMany({
        where: { managerId: employeeId, isActive: true },
        select: { id: true }
      });
      return directReports.map(e => e.id);
    }

    const result = await prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE subordinate_tree AS (
        SELECT id, 0 as depth
        FROM employees
        WHERE manager_id = ${employeeId} AND is_active = true
        
        UNION ALL
        
        SELECT e.id, st.depth + 1
        FROM employees e
        JOIN subordinate_tree st ON e.manager_id = st.id
        WHERE e.is_active = true AND st.depth < 10
      )
      SELECT id FROM subordinate_tree
    `;
    
    return result.map(r => r.id);
  }

  /**
   * Obtiene cadena de managers hacia arriba
   */
  static async getManagerChain(employeeId: string): Promise<any[]> {
    const result = await prisma.$queryRaw<any[]>`
      WITH RECURSIVE manager_chain AS (
        SELECT id, full_name, position, manager_id, 0 as level
        FROM employees
        WHERE id = ${employeeId}
        
        UNION ALL
        
        SELECT e.id, e.full_name, e.position, e.manager_id, mc.level + 1
        FROM employees e
        JOIN manager_chain mc ON e.id = mc.manager_id
        WHERE mc.level < 10
      )
      SELECT * FROM manager_chain WHERE level > 0 ORDER BY level ASC
    `;
    
    return result;
  }
}

export const validateNoCycle = EmployeeService.validateNoCycle;
```

### 7.2 EvaluationService

```typescript
// src/lib/services/EvaluationService.ts

import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export class EvaluationService {

  /**
   * Genera evaluaciones upward (subordinados evalúan al jefe) - IMPACT PULSE
   * evaluator = subordinado (quien responde)
   * evaluatee = manager (quien es evaluado)
   */
  static async generateUpwardEvaluations(
    cycleId: string,
    accountId: string,
    options?: {
      departmentIds?: string[];
      minSubordinates?: number;
    }
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const minSubs = options?.minSubordinates || 3;

    // 1. Obtener ciclo con campaign
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, accountId },
      include: { campaign: true }
    });

    if (!cycle || !cycle.campaignId) {
      results.errors.push('Ciclo no encontrado o sin campaign asociada');
      return results;
    }

    // 2. Obtener managers con suficientes subordinados
    const whereClause: any = {
      accountId,
      isActive: true,
      subordinates: {
        some: { isActive: true }
      }
    };

    if (options?.departmentIds?.length) {
      whereClause.departmentId = { in: options.departmentIds };
    }

    const managers = await prisma.employee.findMany({
      where: whereClause,
      include: {
        subordinates: {
          where: { isActive: true },
          include: { department: true }
        },
        department: true
      }
    });

    // 3. Filtrar por mínimo de subordinados
    const eligibleManagers = managers.filter(m => m.subordinates.length >= minSubs);
    const skippedManagers = managers.length - eligibleManagers.length;
    results.skipped = skippedManagers;

    // 4. Generar assignments
    const snapshotDate = new Date();

    await prisma.$transaction(async (tx) => {
      for (const manager of eligibleManagers) {
        for (const subordinate of manager.subordinates) {
          try {
            // Crear Participant (el evaluador = subordinado)
            const participant = await tx.participant.create({
              data: {
                campaignId: cycle.campaignId!,
                nationalId: subordinate.nationalId,
                name: subordinate.fullName,
                email: subordinate.email,
                phoneNumber: subordinate.phoneNumber,
                department: subordinate.department?.displayName,
                departmentId: subordinate.departmentId,
                employeeId: subordinate.id,
                uniqueToken: uuidv4(),
                hasResponded: false
              }
            });

            // Crear EvaluationAssignment con SNAPSHOT
            await tx.evaluationAssignment.create({
              data: {
                accountId,
                cycleId,
                
                // Referencias
                evaluatorId: subordinate.id,
                evaluateeId: manager.id,
                
                // SNAPSHOT CONGELADO
                snapshotDate,
                evaluatorName: subordinate.fullName,
                evaluatorNationalId: subordinate.nationalId,
                evaluatorDepartment: subordinate.department?.displayName,
                evaluateeName: manager.fullName,
                evaluateeNationalId: manager.nationalId,
                evaluateeDepartmentId: manager.departmentId,
                evaluateeDepartment: manager.department?.displayName || '',
                evaluateePosition: manager.position,
                
                // Config
                evaluationType: 'EMPLOYEE_TO_MANAGER',
                participantId: participant.id,
                status: 'PENDING',
                dueDate: cycle.endDate
              }
            });

            results.created++;
          } catch (err: any) {
            results.errors.push(`Error con ${subordinate.fullName}: ${err.message}`);
          }
        }
      }

      // Actualizar contador de campaign
      await tx.campaign.update({
        where: { id: cycle.campaignId! },
        data: { totalInvited: results.created }
      });
    });

    return results;
  }

  /**
   * Obtiene evolución de desempeño de un empleado
   */
  static async getPerformanceEvolution(employeeId: string): Promise<any[]> {
    return prisma.$queryRaw`
      SELECT 
        ea.snapshot_date,
        ea.evaluatee_department,
        ea.evaluator_name,
        pc.name as cycle_name,
        pc.cycle_type,
        AVG(CAST(r.value AS FLOAT)) as avg_score,
        COUNT(r.id) as response_count
      FROM evaluation_assignments ea
      JOIN performance_cycles pc ON pc.id = ea.cycle_id
      LEFT JOIN participants p ON p.id = ea.participant_id
      LEFT JOIN responses r ON r.participant_id = p.id
      WHERE ea.evaluatee_id = ${employeeId}
      GROUP BY ea.cycle_id, ea.snapshot_date, ea.evaluatee_department, ea.evaluator_name, pc.name, pc.cycle_type
      ORDER BY ea.snapshot_date DESC
    `;
  }

  /**
   * Obtiene evaluaciones pendientes para un evaluador
   */
  static async getPendingAssignmentsForEvaluator(
    evaluatorId: string,
    cycleId?: string
  ): Promise<any[]> {
    const where: any = {
      evaluatorId,
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    };

    if (cycleId) {
      where.cycleId = cycleId;
    }

    return prisma.evaluationAssignment.findMany({
      where,
      include: {
        cycle: { select: { name: true, endDate: true } },
        participant: { select: { uniqueToken: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
  }
}
```

---

## 8. VALIDACIÓN CTE ANTI-CICLOS

### 8.1 Explicación del CTE

```typescript
/**
 * CTE (Common Table Expression) Recursivo para Detectar Ciclos
 * 
 * PROBLEMA: 
 *   Si Juan es jefe de María, y María es jefe de Pedro,
 *   NO podemos hacer que Pedro sea jefe de Juan (ciclo)
 * 
 * SOLUCIÓN:
 *   Desde el nuevo manager propuesto, subimos por la cadena
 *   Si llegamos al empleado que queremos modificar = CICLO
 * 
 * VISUALIZACIÓN:
 *   
 *   Queremos: Pedro.managerId = Juan
 *   
 *   Cadena actual:
 *     CEO
 *      └── Juan (queremos que Pedro sea jefe de Juan)
 *           └── María
 *                └── Pedro (este es el manager propuesto)
 *   
 *   CTE sube desde Pedro:
 *     Pedro → María → Juan → ¡ENCONTRADO! = CICLO
 */

const CTE_QUERY = `
  WITH RECURSIVE manager_chain AS (
    -- Caso base: empezamos en el nuevo manager propuesto
    SELECT id, manager_id, 1 as depth
    FROM employees
    WHERE id = $newManagerId
    
    UNION ALL
    
    -- Recursión: subimos por la cadena de managers
    SELECT e.id, e.manager_id, mc.depth + 1
    FROM employees e
    JOIN manager_chain mc ON e.id = mc.manager_id
    WHERE mc.depth < 10  -- Límite de seguridad
  )
  -- Si encontramos al empleado original en la cadena = CICLO
  SELECT EXISTS(
    SELECT 1 FROM manager_chain WHERE id = $employeeId
  ) as creates_cycle
`;
```

---

## 9. ROL EVALUATOR Y PORTAL

### 9.1 Definición del Rol

```yaml
ROL: EVALUATOR (o LEADER)

DESCRIPCIÓN:
  Usuario que tiene subordinados y debe evaluarlos
  O que ha sido asignado como evaluador en un ciclo

PERMISOS:
  ✅ Accede a: /desempeno (módulo evaluaciones)
  ✅ Ve: "Mis Evaluaciones Pendientes"
  ✅ Ve: "Resultados de Mi Equipo" (si es manager)
  ✅ Ve: "Mi Evaluación como Líder" (Impact Pulse)
  
  ❌ NO accede a: Configuración de ciclos
  ❌ NO accede a: Otros departamentos
  ❌ NO accede a: Admin, uploads

ASIGNACIÓN:
  - Automática cuando Employee tiene subordinados
  - O cuando tiene EvaluationAssignments pendientes
```

### 9.2 Evaluator Portal (Fase 1.5)

```typescript
// src/app/api/evaluator/assignments/route.ts

/**
 * GET /api/evaluator/assignments
 * Portal del evaluador - Mis evaluaciones pendientes
 * 
 * CRÍTICO PARA UX:
 * Sin esto, usuarios reciben N emails separados sin vista unificada
 */
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id');
    const userId = request.headers.get('x-user-id');
    
    if (!accountId || !userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Buscar employee del usuario
    const employee = await prisma.employee.findFirst({
      where: {
        accountId,
        // Asumiendo que User.email = Employee.email
        // O que hay un campo User.employeeId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'No tienes perfil de empleado' },
        { status: 404 }
      );
    }

    // Obtener assignments pendientes
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        evaluatorId: employee.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        cycle: {
          select: { name: true, endDate: true, status: true }
        },
        participant: {
          select: { uniqueToken: true }
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
        evaluateeName: assignment.evaluateeName,
        evaluateePosition: assignment.evaluateePosition,
        evaluationType: assignment.evaluationType,
        status: assignment.status,
        dueDate: assignment.dueDate,
        surveyUrl: `/encuesta/${assignment.participant?.uniqueToken}`
      });
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: {
        totalPending: assignments.length,
        byCycle: Object.values(byCycle)
      }
    });

  } catch (error: any) {
    console.error('[API] Error en GET evaluator assignments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### 9.3 UI del Evaluator Portal

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Mis Evaluaciones Pendientes                                 │
│                                                                 │
│  Tienes 8 evaluaciones pendientes en total                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  IMPACT PULSE Q1 2026                                   │   │
│  │  Fecha límite: 31 Enero 2026                           │   │
│  │                                                         │   │
│  │  ○ Juan Pérez - Desarrollador Senior      [Evaluar]    │   │
│  │  ○ Ana García - Analista                  [Evaluar]    │   │
│  │  ○ Pedro López - QA Lead                  [Evaluar]    │   │
│  │  ● Carlos Ruiz - Diseñador                ✓ Completada │   │
│  │                                                         │   │
│  │  Progreso: 1 de 4 (25%)                                │   │
│  │  ████░░░░░░░░░░░░░░░░                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  EVALUACIÓN DESEMPEÑO Q1 2026                          │   │
│  │  Fecha límite: 15 Febrero 2026                         │   │
│  │                                                         │   │
│  │  ○ María Torres - Product Manager         [Evaluar]    │   │
│  │  ○ Luis Soto - DevOps                     [Evaluar]    │   │
│  │  ...                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. INTEGRACIÓN CON AUDITLOG

```typescript
// Ejemplo de auditoría completa

await prisma.auditLog.create({
  data: {
    action: 'EVALUATION_ASSIGNMENT_CREATE',
    accountId,
    entityType: 'evaluation_assignment',
    entityId: assignment.id,
    oldValues: null,
    newValues: {
      cycleId: assignment.cycleId,
      evaluatorId: assignment.evaluatorId,
      evaluateeId: assignment.evaluateeId,
      evaluationType: assignment.evaluationType,
      snapshotDate: assignment.snapshotDate
    },
    userInfo: { userId, role: userRole },
    metadata: {
      cycleName: cycle.name,
      evaluatorName: assignment.evaluatorName,
      evaluateeName: assignment.evaluateeName
    }
  }
});
```

---

## 11. PLAN DE IMPLEMENTACIÓN

### 11.1 Día 1: Schema Base

```yaml
TAREAS:
  □ Agregar modelos a schema.prisma:
    - Employee
    - EmployeeHistory
    - EmployeeImport
  □ Agregar enums
  □ Modificar Account, Department
  □ Generar migración
  □ Verificar TypeScript compila

ENTREGABLES:
  ✅ Schema Employee Master completo
  ✅ Migración ejecutada
```

### 11.2 Día 2: Employee Sync Service

```yaml
TAREAS:
  □ Crear EmployeeSyncService.ts:
    - processEmployeeImport() con Fix N+1
    - Threshold protection
    - PENDING_REVIEW handling
  □ Crear EmployeeService.ts:
    - validateNoCycle() con CTE
    - getSubordinates()
    - getManagerChain()
  □ Tests unitarios

ENTREGABLES:
  ✅ Services de Employee funcionando
  ✅ Validación de ciclos con CTE
```

### 11.3 Día 3: APIs Employee

```yaml
TAREAS:
  □ POST /api/admin/employees/sync
  □ GET /api/admin/employees
  □ GET /api/admin/employees/[id]
  □ PATCH /api/admin/employees/[id]
    - handleTermination()
    - handleRehire()
    - handleTransfer()
  □ GET /api/admin/employees/pending-review

ENTREGABLES:
  ✅ CRUD completo de Employee
  ✅ Handlers especiales funcionando
```

### 11.4 Día 4: Performance Cycle + Assignment

```yaml
TAREAS:
  □ Agregar modelos:
    - PerformanceCycle
    - EvaluationAssignment
  □ Modificar Participant, Response
  □ Crear PerformanceCycleService
  □ Crear EvaluationService:
    - generateUpwardEvaluations()
    - getPerformanceEvolution()

ENTREGABLES:
  ✅ Schema de evaluaciones con snapshot
  ✅ Impact Pulse generando correctamente
```

### 11.5 Día 5: APIs Performance + Evaluator Portal

```yaml
TAREAS:
  □ POST /api/admin/performance-cycles
  □ POST /api/admin/performance-cycles/[id]/generate
  □ GET /api/evaluator/assignments
  □ Rol EVALUATOR en middleware
  □ Tests E2E

ENTREGABLES:
  ✅ Flujo completo Impact Pulse
  ✅ Evaluator Portal básico
  ✅ Sistema listo para producción
```

---

## 12. CHECKLIST DE VALIDACIÓN

### 12.1 Pre-Implementación

```yaml
□ Schema Prisma:
  □ Employee tiene todos los campos documentados
  □ Employee tiene índice compuesto [accountId, status, departmentId]
  □ EvaluationAssignment tiene campos de snapshot
  □ EvaluationAssignment tiene unique constraint correcto
  □ EmployeeHistory tiene changeType enum
  □ EmployeeImport tiene threshold fields
  □ Participant.employeeId es opcional
  □ Response.evaluatorEmployeeId agregado
  □ Relaciones bidireccionales correctas

□ Relaciones en modelos existentes:
  □ Account.employees agregado
  □ Account.employeeHistory agregado
  □ Account.employeeImports agregado
  □ Account.performanceCycles agregado
  □ Account.evaluationAssignments agregado
  □ Campaign.performanceCycle agregado
  □ Department.employees agregado
  □ Department.employeeHistory agregado
```

### 12.2 Post-Implementación

```yaml
□ Funcionalidad:
  □ Upload CSV crea employees y jerarquías
  □ Fix N+1 funciona (managers pre-cargados)
  □ Threshold 10% bloquea imports masivos
  □ PENDING_REVIEW marca ausentes correctamente
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

□ Compatibilidad:
  □ Onboarding Journey sigue funcionando
  □ Exit Intelligence sigue funcionando
  □ Pulso Express sigue funcionando
  □ No hay errores de TypeScript
```

---

## 📎 ANEXOS

### A. Formato CSV para Upload (Fase 1 - Estándar)

> ⚠️ **IMPORTANTE:** El campo `isActive` es **OBLIGATORIO**. El cliente debe indicar explícitamente el estado de cada empleado.

```csv
nationalId,fullName,email,phoneNumber,departmentName,managerRut,position,jobTitle,seniorityLevel,hireDate,isActive
12345678-9,Juan Pérez,juan@empresa.cl,+56912345678,Gerencia General,,CEO,Chief Executive Officer,executive,2020-01-15,true
12345678-K,María García,maria@empresa.cl,+56987654321,Gerencia Comercial,12345678-9,Gerente Comercial,Sales Director,lead,2021-03-01,true
11111111-1,Pedro López,pedro@empresa.cl,,Ventas Nacional,12345678-K,Vendedor Senior,Senior Sales Rep,senior,2022-06-15,true
22222222-2,Ana Torres,ana@empresa.cl,,Ventas Nacional,12345678-K,Vendedora,Sales Rep,mid,2023-01-10,false
33333333-3,Carlos Ruiz,carlos@empresa.cl,,Tecnología,12345678-9,Desarrollador,Software Engineer,senior,2021-06-01,true
```

**Valores válidos para `isActive`:** `true`, `false`, `1`, `0`, `yes`, `no`, `si`, `activo`, `inactivo`

### B. Response de Sync

```json
{
  "success": true,
  "status": "COMPLETED",
  "importId": "imp_123",
  "created": 15,
  "updated": 100,
  "rehired": 3,
  "pendingReview": 5,
  "errors": 2,
  "cycleWarnings": 3
}
```

**Nota:** `rehired` indica empleados INACTIVE que reaparecieron en el archivo y fueron reactivados automáticamente (Fix Zombies v3.0.1).

### C. Response de Generate Upward

```json
{
  "success": true,
  "created": 45,
  "skipped": 3,
  "errors": []
}
```

### D. Estructura de EvaluationAssignment

```json
{
  "id": "ea_001",
  "cycleId": "cycle_q1_2026",
  "evaluatorId": "emp_maria",
  "evaluateeId": "emp_juan",
  "evaluationType": "EMPLOYEE_TO_MANAGER",
  "snapshotDate": "2026-01-15T00:00:00Z",
  "evaluatorName": "María García",
  "evaluatorNationalId": "12345678-K",
  "evaluateeName": "Juan Pérez",
  "evaluateeNationalId": "12345678-9",
  "evaluateeDepartment": "Tecnología",
  "status": "PENDING",
  "dueDate": "2026-01-31T23:59:59Z"
}
```

---

**FIN DE ESPECIFICACIÓN TÉCNICA v3.0**

*Consolidado de:*
- *Especificación v1.1 (código detallado, handlers, Fix N+1)*
- *Especificación v2.1 (sync patterns, snapshot, PerformanceCycle)*
- *Investigación Arquitectura Evaluación Desempeño*
- *Investigación Employee Master Sync Patterns*

*Documento definitivo listo para implementación*
*Enero 2026*
