# 🏗️ TAREA: DÍA 1 - Schema Completo Employee + Performance

## OBJETIVO
Implementar TODOS los modelos Prisma necesarios en una sola migración.

## CONTEXTO
FocalizaHR es una plataforma HR enterprise. Estamos agregando:
1. **Employee Master** - Nómina permanente de empleados
2. **Performance Evaluation** - Ciclos de evaluación de desempeño

> ⚠️ **IMPORTANTE:** Aunque creamos todos los modelos hoy, los SERVICES y APIs se implementarán en días posteriores. Hoy es SOLO schema.

---

## ENTREGABLES DÍA 1

```
□ 8 nuevos enums en schema.prisma
□ 5 nuevos modelos en schema.prisma
□ Modificaciones a modelos existentes (Account, Department, Participant)
□ Migración generada y aplicada
□ npx prisma validate sin errores
```

---

## PASO 1: ENUMS

Agregar estos 8 enums a schema.prisma:

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE MASTER - Enums
// ════════════════════════════════════════════════════════════════════════════

enum EmployeeStatus {
  ACTIVE          // Activo en nómina
  INACTIVE        // Desvinculado/terminado
  ON_LEAVE        // Licencia/permiso extendido
  PENDING_REVIEW  // Requiere revisión manual
  EXCLUDED        // Excluido manualmente de estudios
}

enum EmployeeChangeType {
  HIRE            // Contratación inicial
  UPDATE          // Actualización de datos
  TRANSFER        // Cambio de departamento
  PROMOTION       // Ascenso/cambio de cargo
  MANAGER_CHANGE  // Cambio de jefe
  TERMINATE       // Desvinculación
  REHIRE          // Recontratación
}

enum EmployeeImportMode {
  INCREMENTAL     // Solo upsert, no detecta ausentes
  FULL            // Detecta ausentes, reconciliación completa
  PREVIEW         // Solo validación, sin cambios
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

// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE EVALUATION - Enums
// ════════════════════════════════════════════════════════════════════════════

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

enum EvaluationType {
  SELF                 // Auto-evaluación
  MANAGER_TO_EMPLOYEE  // Jefe evalúa a subordinado
  EMPLOYEE_TO_MANAGER  // Subordinado evalúa a jefe (Impact Pulse)
  PEER                 // Evaluación entre pares
}

enum EvaluationAssignmentStatus {
  PENDING     // Pendiente de responder
  IN_PROGRESS // Iniciada
  COMPLETED   // Completada
  EXPIRED     // Venció sin respuesta
  CANCELLED   // Cancelada
}
```

---

## PASO 2: MODELO EMPLOYEE

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE - Nómina Permanente
// ════════════════════════════════════════════════════════════════════════════

model Employee {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // Identificadores
  nationalId     String  @map("national_id")       // RUT único por account
  employeeNumber String? @map("employee_number")   // Código interno (EMP-001)
  
  // Datos personales
  fullName      String  @map("full_name")
  preferredName String? @map("preferred_name")
  email         String?
  phoneNumber   String? @map("phone_number")
  
  // Datos organizacionales
  departmentId   String  @map("department_id")
  position       String?
  jobTitle       String? @map("job_title")
  seniorityLevel String? @map("seniority_level")  // junior|mid|senior|lead|executive
  employmentType String? @map("employment_type")  // full-time|part-time|contractor
  managerLevel   Int?    @map("manager_level")    // 1=CEO, 2=Dir, 3=Ger, 4=Jefe, 5=IC
  costCenter     String? @map("cost_center")
  
  // Jerarquía (self-reference)
  managerId String? @map("manager_id")
  
  // Estado y ciclo de vida
  status            EmployeeStatus @default(ACTIVE)
  isActive          Boolean        @default(true) @map("is_active")
  hireDate          DateTime       @map("hire_date")
  terminatedAt      DateTime?      @map("terminated_at")
  terminationReason String?        @map("termination_reason")
  rehireDate        DateTime?      @map("rehire_date")
  tenureCount       Int            @default(1) @map("tenure_count")
  
  // Control de sincronización
  importSource        String?   @map("import_source")
  lastImportId        String?   @map("last_import_id")
  lastSeenInImport    DateTime? @map("last_seen_in_import")
  pendingReview       Boolean   @default(false) @map("pending_review")
  pendingReviewReason String?   @map("pending_review_reason")
  
  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  account       Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  department    Department       @relation(fields: [departmentId], references: [id])
  manager       Employee?        @relation("ManagerSubordinates", fields: [managerId], references: [id])
  directReports Employee[]       @relation("ManagerSubordinates")
  history       EmployeeHistory[]
  participants  Participant[]
  
  // Evaluaciones (se usarán en Día 4)
  evaluationsAsEvaluatee EvaluationAssignment[] @relation("Evaluatee")
  evaluationsAsEvaluator EvaluationAssignment[] @relation("Evaluator")

  // Índices
  @@unique([accountId, nationalId], map: "idx_employees_account_national")
  @@index([accountId, status], map: "idx_employees_account_status")
  @@index([accountId, departmentId], map: "idx_employees_account_dept")
  @@index([managerId], map: "idx_employees_manager")
  @@index([accountId, pendingReview], map: "idx_employees_pending_review")
  @@map("employees")
}
```

---

## PASO 3: MODELO EMPLOYEEHISTORY

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE HISTORY - Auditoría por Campo
// ════════════════════════════════════════════════════════════════════════════

model EmployeeHistory {
  id         String   @id @default(cuid())
  employeeId String   @map("employee_id")
  accountId  String   @map("account_id")
  
  // Tipo de cambio
  changeType EmployeeChangeType @map("change_type")
  
  // Campo específico que cambió
  fieldName String? @map("field_name")
  oldValue  String? @map("old_value")
  newValue  String? @map("new_value")
  
  // Snapshot al momento del cambio
  departmentId String? @map("department_id")
  managerId    String? @map("manager_id")
  position     String?
  
  // Origen del cambio
  changeSource  String?  @map("change_source")  // MANUAL|BULK_IMPORT|API
  importId      String?  @map("import_id")
  changedBy     String?  @map("changed_by")
  changeReason  String?  @map("change_reason")
  
  // Timestamp
  effectiveDate DateTime @default(now()) @map("effective_date")
  createdAt     DateTime @default(now()) @map("created_at")

  // Relaciones
  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Índices
  @@index([employeeId, effectiveDate], map: "idx_employee_history_emp_date")
  @@index([accountId, changeType], map: "idx_employee_history_account_type")
  @@index([importId], map: "idx_employee_history_import")
  @@map("employee_history")
}
```

---

## PASO 4: MODELO EMPLOYEEIMPORT

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE IMPORT - Log de Cargas
// ════════════════════════════════════════════════════════════════════════════

model EmployeeImport {
  id        String @id @default(cuid())
  accountId String @map("account_id")

  // Configuración
  importMode EmployeeImportMode @map("import_mode")
  fileName   String?            @map("file_name")
  
  // Estadísticas
  totalInFile   Int @map("total_in_file")
  created       Int @default(0)
  updated       Int @default(0)
  rehired       Int @default(0)
  unchanged     Int @default(0)
  deactivated   Int @default(0)
  pendingReview Int @default(0) @map("pending_review")
  errors        Int @default(0)
  
  // Control de threshold
  missingCount      Int     @default(0) @map("missing_count")
  missingPercent    Float   @default(0) @map("missing_percent")
  thresholdExceeded Boolean @default(false) @map("threshold_exceeded")
  thresholdUsed     Float   @default(0.10) @map("threshold_used")
  
  // Estado
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
```

---

## PASO 5: MODELO PERFORMANCECYCLE

```prisma
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE CYCLE - Ciclo de Evaluación
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
  
  // Configuración
  includesSelf    Boolean @default(false) @map("includes_self")
  includesManager Boolean @default(true) @map("includes_manager")
  includesPeer    Boolean @default(false) @map("includes_peer")
  includesUpward  Boolean @default(false) @map("includes_upward")
  
  anonymousResults Boolean @default(true) @map("anonymous_results")
  minSubordinates  Int     @default(3) @map("min_subordinates")
  
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
```

---

## PASO 6: MODELO EVALUATIONASSIGNMENT

```prisma
// ════════════════════════════════════════════════════════════════════════════
// EVALUATION ASSIGNMENT - Snapshot "X evalúa a Y"
// Datos CONGELADOS - NO cambian aunque Employee cambie
// ════════════════════════════════════════════════════════════════════════════

model EvaluationAssignment {
  id        String @id @default(cuid())
  accountId String @map("account_id")
  cycleId   String @map("cycle_id")

  // Referencias a Employee (para queries)
  evaluateeId String   @map("evaluatee_id")
  evaluatee   Employee @relation("Evaluatee", fields: [evaluateeId], references: [id])
  
  evaluatorId String   @map("evaluator_id")
  evaluator   Employee @relation("Evaluator", fields: [evaluatorId], references: [id])

  // SNAPSHOT CONGELADO
  snapshotDate DateTime @map("snapshot_date")
  
  // Datos del EVALUADO al momento del snapshot
  evaluateeName         String  @map("evaluatee_name")
  evaluateeNationalId   String  @map("evaluatee_national_id")
  evaluateeDepartmentId String  @map("evaluatee_department_id")
  evaluateeDepartment   String  @map("evaluatee_department")
  evaluateePosition     String? @map("evaluatee_position")
  
  // Datos del EVALUADOR al momento del snapshot
  evaluatorName         String  @map("evaluator_name")
  evaluatorNationalId   String  @map("evaluator_national_id")
  evaluatorDepartmentId String  @map("evaluator_department_id")
  evaluatorDepartment   String  @map("evaluator_department")

  // Tipo de evaluación
  evaluationType EvaluationType @map("evaluation_type")

  // Vínculo con Participant (cuando se crea la encuesta)
  participantId String?      @unique @map("participant_id")
  participant   Participant? @relation(fields: [participantId], references: [id])

  // Estado y fechas
  status  EvaluationAssignmentStatus @default(PENDING)
  dueDate DateTime?                  @map("due_date")

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  account Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  cycle   PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)

  // Índices
  @@unique([cycleId, evaluatorId, evaluateeId, evaluationType], map: "idx_eval_assignment_unique")
  @@index([accountId], map: "idx_eval_assignment_account")
  @@index([evaluateeId], map: "idx_eval_assignment_evaluatee")
  @@index([evaluatorId], map: "idx_eval_assignment_evaluator")
  @@index([status], map: "idx_eval_assignment_status")
  @@map("evaluation_assignments")
}
```

---

## PASO 7: MODIFICAR MODELOS EXISTENTES

### 7.1 Agregar a Account

Buscar el modelo `Account` y agregar estas relaciones:

```prisma
// AGREGAR dentro del modelo Account existente:

  employees             Employee[]
  employeeHistory       EmployeeHistory[]
  employeeImports       EmployeeImport[]
  performanceCycles     PerformanceCycle[]
  evaluationAssignments EvaluationAssignment[]
```

### 7.2 Agregar a Department

Buscar el modelo `Department` y agregar:

```prisma
// AGREGAR dentro del modelo Department existente:

  employees Employee[]
```

### 7.3 Agregar a Participant

Buscar el modelo `Participant` y agregar:

```prisma
// AGREGAR dentro del modelo Participant existente:

  // Vínculo con Employee Master
  employeeId           String?               @map("employee_id")
  employee             Employee?             @relation(fields: [employeeId], references: [id])
  
  // Vínculo con Evaluation
  evaluationAssignment EvaluationAssignment?
```

### 7.4 Agregar a Campaign

Buscar el modelo `Campaign` y agregar:

```prisma
// AGREGAR dentro del modelo Campaign existente:

  performanceCycle PerformanceCycle?
```

---

## PASO 8: EJECUTAR MIGRACIÓN

```bash
# 1. Validar schema
npx prisma validate

# 2. Si hay errores, corregirlos primero

# 3. Generar migración
npx prisma migrate dev --name add_employee_master_and_performance

# 4. Verificar que se crearon las tablas
npx prisma studio
```

---

## REGLAS IMPORTANTES

1. **NO crear servicios ni APIs hoy** - Solo schema
2. **Si algún modelo existente no tiene la estructura esperada:** PREGUNTA antes de modificar
3. **Si hay conflictos de nombres:** Reporta antes de continuar
4. **El orden de los modelos importa:** Prisma necesita que las referencias existan

---

## VALIDACIÓN FINAL

```bash
# Debe mostrar "The schema is valid!"
npx prisma validate

# Debe completar sin errores
npx prisma migrate dev --name add_employee_master_and_performance
```

Al terminar, reporta:
1. ¿Migración exitosa? ✅/❌
2. ¿Errores encontrados? (listar)
3. Captura de `npx prisma validate`
