# TASK 01: MODELOS PRISMA - PERFORMANCE CLASSIFICATION

## 🎯 OBJETIVO
Agregar 3 modelos a Prisma para el sistema de clasificación de performance.

## 📁 ARCHIVO A MODIFICAR
`prisma/schema.prisma`

## 📋 INSTRUCCIONES

### PASO 1: Agregar modelos al final de schema.prisma

Agrega estos 3 modelos **AL FINAL** del archivo `prisma/schema.prisma`:

```prisma
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RATING CONFIG - Configuración por Cliente
// ════════════════════════════════════════════════════════════════════════════

model PerformanceRatingConfig {
  id          String   @id @default(cuid())
  accountId   String   @unique @map("account_id")
  
  // Escala: "three_level" | "five_level" | "custom"
  scaleType   String   @default("five_level") @map("scale_type")
  
  // JSON Array de niveles configurados
  levels      Json     @default("[]")
  
  // Configuración 9-Box
  enableNineBox           Boolean @default(false) @map("enable_nine_box")
  potentialScaleType      String? @map("potential_scale_type")
  potentialLevels         Json?   @map("potential_levels")
  
  // Configuración Calibración
  enableCalibration       Boolean @default(false) @map("enable_calibration")
  forcedDistribution      Boolean @default(false) @map("forced_distribution")
  distributionTargets     Json?   @map("distribution_targets")
  requireAdjustmentReason Boolean @default(true) @map("require_adjustment_reason")
  
  // Configuración PDPs
  autoGeneratePDP         Boolean @default(true) @map("auto_generate_pdp")
  pdpTemplateId           String? @map("pdp_template_id")
  
  // ═══════════════════════════════════════════════════════════════════════
  // PONDERACIÓN DE EVALUADORES (Nivel 1: Config Cliente)
  // ═══════════════════════════════════════════════════════════════════════
  // JSON: {self: 15, manager: 40, peer: 30, upward: 15} - debe sumar 100
  // Si null, usa default FocalizaHR (25/25/25/25)
  evaluatorWeights        Json?   @map("evaluator_weights")
  
  // Metadata
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  @@map("performance_rating_configs")
}

// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RATING - Rating Individual por Empleado por Ciclo
// ════════════════════════════════════════════════════════════════════════════

model PerformanceRating {
  id          String   @id @default(cuid())
  accountId   String   @map("account_id")
  cycleId     String   @map("cycle_id")
  employeeId  String   @map("employee_id")
  
  // Scores calculados (automático)
  calculatedScore       Float    @map("calculated_score")
  calculatedLevel       String   @map("calculated_level")
  calculatedAt          DateTime @default(now()) @map("calculated_at")
  
  // Breakdown por tipo evaluador
  selfScore             Float?   @map("self_score")
  managerScore          Float?   @map("manager_score")
  peerAvgScore          Float?   @map("peer_avg_score")
  upwardAvgScore        Float?   @map("upward_avg_score")
  
  // Completeness
  evaluationCompleteness Float?  @map("evaluation_completeness")
  totalEvaluations      Int?     @map("total_evaluations")
  completedEvaluations  Int?     @map("completed_evaluations")
  
  // Rating final (después de calibración)
  finalScore            Float?   @map("final_score")
  finalLevel            String?  @map("final_level")
  
  // Calibración metadata
  calibrated            Boolean  @default(false)
  calibratedAt          DateTime? @map("calibrated_at")
  calibratedBy          String?  @map("calibrated_by")
  calibrationSessionId  String?  @map("calibration_session_id")
  adjustmentReason      String?  @map("adjustment_reason") @db.Text
  adjustmentType        String?  @map("adjustment_type")
  
  // 9-Box: Potential Rating
  potentialScore        Float?   @map("potential_score")
  potentialLevel        String?  @map("potential_level")
  potentialRatedBy      String?  @map("potential_rated_by")
  potentialRatedAt      DateTime? @map("potential_rated_at")
  potentialNotes        String?  @map("potential_notes") @db.Text
  nineBoxPosition       String?  @map("nine_box_position")
  
  // Succession Readiness
  successionReadiness   String?  @map("succession_readiness")
  targetRoles           Json?    @map("target_roles")
  successionNotes       String?  @map("succession_notes") @db.Text
  
  // PDP Link
  pdpId                 String?  @map("pdp_id")
  pdpGeneratedAt        DateTime? @map("pdp_generated_at")
  
  // Metadata
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  account     Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  cycle       PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  employee    Employee         @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  
  @@unique([cycleId, employeeId], map: "unique_rating_per_cycle_employee")
  @@index([accountId, cycleId], map: "idx_ratings_account_cycle")
  @@index([finalLevel], map: "idx_ratings_final_level")
  @@index([nineBoxPosition], map: "idx_ratings_nine_box")
  @@index([calibrated], map: "idx_ratings_calibrated")
  @@map("performance_ratings")
}

// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION SESSION - Sesiones de Calibración Grupal
// ════════════════════════════════════════════════════════════════════════════

model CalibrationSession {
  id          String   @id @default(cuid())
  accountId   String   @map("account_id")
  cycleId     String   @map("cycle_id")
  
  name        String
  description String?  @db.Text
  status      String   @default("draft")
  
  facilitatorId   String?  @map("facilitator_id")
  participantIds  Json     @default("[]") @map("participant_ids")
  
  departmentIds   Json?    @map("department_ids")
  levelFilter     Json?    @map("level_filter")
  
  targetDistribution  Json?  @map("target_distribution")
  actualDistribution  Json?  @map("actual_distribution")
  
  totalEmployees      Int?   @map("total_employees")
  calibratedCount     Int?   @map("calibrated_count")
  
  scheduledAt   DateTime? @map("scheduled_at")
  startedAt     DateTime? @map("started_at")
  completedAt   DateTime? @map("completed_at")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  account     Account          @relation(fields: [accountId], references: [id], onDelete: Cascade)
  cycle       PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  
  @@index([accountId, cycleId], map: "idx_calibration_account_cycle")
  @@index([status], map: "idx_calibration_status")
  @@map("calibration_sessions")
}
```

### PASO 2: Agregar relaciones a modelos existentes

Busca el modelo `Account` y agrega estas líneas en la sección de relaciones:

```prisma
// En model Account, agregar estas relaciones:
performanceRatingConfig  PerformanceRatingConfig?
performanceRatings       PerformanceRating[]
calibrationSessions      CalibrationSession[]
```

Busca el modelo `PerformanceCycle` y agrega:

```prisma
// En model PerformanceCycle, agregar:
performanceRatings       PerformanceRating[]
calibrationSessions      CalibrationSession[]

// ═══════════════════════════════════════════════════════════════════════
// PONDERACIÓN OVERRIDE (Nivel 2: Override por Ciclo)
// ═══════════════════════════════════════════════════════════════════════
// JSON: {self: 10, manager: 50, peer: 25, upward: 15} - casos especiales
// Si null, usa config de cuenta o default FocalizaHR
evaluatorWeightsOverride Json?   @map("evaluator_weights_override")
```

Busca el modelo `Employee` y agrega:

```prisma
// En model Employee, agregar:
performanceRatings       PerformanceRating[]
```

### PASO 3: Ejecutar migración

```bash
npx prisma migrate dev --name add_performance_classification_system
```

Si hay errores, usa:

```bash
npx prisma db push
```

### PASO 4: Regenerar cliente

```bash
npx prisma generate
```

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Los 3 modelos agregados sin errores de sintaxis
- [ ] Relaciones agregadas a Account, PerformanceCycle, Employee
- [ ] Migración ejecutada exitosamente
- [ ] `npx prisma generate` sin errores
- [ ] Verificar en Prisma Studio: `npx prisma studio`

## 🚨 ERRORES COMUNES

**Error: "Unknown relation"**
→ Verifica que las relaciones estén en ambos lados

**Error: "Unique constraint"**
→ El constraint `@@unique([cycleId, employeeId])` requiere que no haya duplicados

## ➡️ SIGUIENTE TAREA
`TASK_02_CONFIG_CENTRAL.md`
