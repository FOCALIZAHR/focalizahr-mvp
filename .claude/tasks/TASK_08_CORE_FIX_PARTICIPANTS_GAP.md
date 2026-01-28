# TASK_08 CORE: Fix Medular - Crear Participants en Evaluaciones

## 📋 INFORMACIÓN DEL TASK

| Campo | Valor |
|-------|-------|
| **Prioridad** | 🔴 CRÍTICA |
| **Complejidad** | Media-Alta |
| **Tiempo estimado** | 2-3 horas |
| **Riesgo** | BAJO (backwards compatible) |
| **Dependencias** | TASK_04 completado |
| **Bloqueante para** | TASK_05, TASK_06, TASK_07 |

---

## 🎯 OBJETIVO

Corregir el GAP donde `EvaluationService.generateManagerEvaluations()` crea `EvaluationAssignments` pero **NO crea Participants**, causando que:

1. `Assignment.participantId = NULL`
2. `Campaign.totalInvited = 0`
3. `/activate` falla por falta de participantes
4. El motor de encuestas no tiene token para enviar

---

## 🐛 DIAGNÓSTICO DEL PROBLEMA

### Estado Actual (ROTO)

```
generateManagerEvaluations()
         │
         ▼
┌─────────────────────────────┐
│  EvaluationAssignment ✅    │
│  ├── evaluatorId: "emp_01"  │
│  ├── evaluateeId: "emp_02"  │
│  ├── participantId: NULL ❌ │
│  └── status: "PENDING"      │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Participant ❌ NO EXISTE   │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Campaign                   │
│  └── totalInvited: 0 ❌     │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  /activate                  │
│  → totalInvited >= 5?       │
│  → 0 >= 5 = FALSE           │
│  → ❌ ERROR 400             │
└─────────────────────────────┘
```

### Problema Adicional: Constraint de Unicidad

```
CONSTRAINT ACTUAL:
@@unique([campaignId, nationalId])

ESCENARIO 360° - 3 personas evalúan a Juan:
  María evalúa a Juan → nationalId="RUT-Juan" ✅ (primero)
  Pedro evalúa a Juan → nationalId="RUT-Juan" ❌ VIOLA CONSTRAINT
  Ana evalúa a Juan   → nationalId="RUT-Juan" ❌ VIOLA CONSTRAINT

RESULTADO: Solo 1 de 3 evaluaciones se puede crear
```

---

## ✅ SOLUCIÓN EN 3 PASOS

### PASO 1: Modificar Schema Prisma

**Archivo:** `prisma/schema.prisma`

#### 1.1 Agregar campo y relación en Participant

Buscar el modelo `Participant` y agregar:

```prisma
model Participant {
  id          String   @id @default(cuid())
  campaignId  String   @map("campaign_id")
  
  // Identificación
  nationalId  String?  @map("national_id")
  fullName    String   @map("full_name")
  email       String?
  phone       String?
  
  // Organización
  departmentId String? @map("department_id")
  
  // Estado
  uniqueToken  String  @unique @map("unique_token")
  hasResponded Boolean @default(false) @map("has_responded")
  respondedAt  DateTime? @map("responded_at")
  
  // ═══════════════════════════════════════════════════════════════
  // AGREGAR: Vínculo con EvaluationAssignment (para Performance)
  // ═══════════════════════════════════════════════════════════════
  evaluationAssignmentId  String?  @unique @map("evaluation_assignment_id")
  evaluationAssignment    EvaluationAssignment? @relation(fields: [evaluationAssignmentId], references: [id])
  
  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relaciones existentes
  campaign   Campaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  department Department? @relation(fields: [departmentId], references: [id])
  responses  Response[]
  
  // ═══════════════════════════════════════════════════════════════
  // MODIFICAR: Constraint para permitir múltiples evaluaciones
  // ═══════════════════════════════════════════════════════════════
  // ANTES: @@unique([campaignId, nationalId])
  // DESPUÉS:
  @@unique([campaignId, nationalId, evaluationAssignmentId], map: "unique_participant_evaluation")
  
  @@index([campaignId], map: "idx_participants_campaign")
  @@index([departmentId], map: "idx_participants_department")
  @@index([hasResponded], map: "idx_participants_responded")
  @@map("participants")
}
```

#### 1.2 Verificar relación inversa en EvaluationAssignment

El modelo `EvaluationAssignment` ya debería tener:

```prisma
model EvaluationAssignment {
  // ... campos existentes ...
  
  participantId String?      @unique @map("participant_id")
  participant   Participant? @relation(fields: [participantId], references: [id])
  
  // ... resto del modelo ...
}
```

Si la relación `Participant? @relation(...)` da error de Prisma por relación ambigua, usar nombre explícito:

```prisma
// En EvaluationAssignment:
participant   Participant? @relation("AssignmentParticipant", fields: [participantId], references: [id])

// En Participant:
evaluationAssignment EvaluationAssignment? @relation("AssignmentParticipant", fields: [evaluationAssignmentId], references: [id])
```

---

### PASO 2: Modificar EvaluationService.ts

**Archivo:** `src/lib/services/EvaluationService.ts`

#### 2.1 Importar generador de tokens

```typescript
import { randomBytes } from 'crypto';

// Función para generar token único
function generateUniqueToken(): string {
  return randomBytes(32).toString('hex');
}
```

#### 2.2 Modificar generateManagerEvaluations()

Buscar la función `generateManagerEvaluations` y modificar el loop de creación:

```typescript
export async function generateManagerEvaluations(
  cycleId: string,
  options?: {
    minTenureDays?: number;
    excludeDepartments?: string[];
    excludeEmployees?: string[];
  }
): Promise<GenerationResult> {
  
  // Obtener el ciclo con su Campaign vinculada
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    include: {
      campaign: true  // ✅ IMPORTANTE: Necesitamos el campaignId
    }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  if (!cycle.campaignId || !cycle.campaign) {
    throw new Error('El ciclo no tiene una Campaign vinculada. Ejecute TASK_04 primero.');
  }

  // Obtener managers activos con sus subordinados
  const managers = await prisma.employee.findMany({
    where: {
      accountId: cycle.accountId,
      status: 'ACTIVE',
      subordinates: {
        some: {
          status: 'ACTIVE'
        }
      }
    },
    include: {
      subordinates: {
        where: {
          status: 'ACTIVE',
          ...(options?.minTenureDays && {
            hireDate: {
              lte: new Date(Date.now() - options.minTenureDays * 24 * 60 * 60 * 1000)
            }
          }),
          ...(options?.excludeDepartments?.length && {
            departmentId: {
              notIn: options.excludeDepartments
            }
          }),
          ...(options?.excludeEmployees?.length && {
            id: {
              notIn: options.excludeEmployees
            }
          })
        },
        include: {
          department: true
        }
      },
      department: true
    }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // ═══════════════════════════════════════════════════════════════
  // PROCESAR CADA MANAGER Y SUS SUBORDINADOS
  // ═══════════════════════════════════════════════════════════════
  
  for (const manager of managers) {
    for (const subordinate of manager.subordinates) {
      try {
        // Verificar si ya existe este assignment
        const existingAssignment = await prisma.evaluationAssignment.findFirst({
          where: {
            cycleId,
            evaluatorId: manager.id,
            evaluateeId: subordinate.id,
            evaluationType: 'MANAGER_TO_EMPLOYEE'
          }
        });

        if (existingAssignment) {
          skipped++;
          continue;
        }

        // ═══════════════════════════════════════════════════════════
        // CREAR EN TRANSACCIÓN: Assignment + Participant
        // ═══════════════════════════════════════════════════════════
        
        await prisma.$transaction(async (tx) => {
          
          // 1. Crear EvaluationAssignment (SIN participantId por ahora)
          const assignment = await tx.evaluationAssignment.create({
            data: {
              accountId: cycle.accountId,
              cycleId: cycle.id,
              
              // Referencias a Employee
              evaluatorId: manager.id,
              evaluateeId: subordinate.id,
              
              // Snapshot congelado
              snapshotDate: new Date(),
              evaluatorName: manager.fullName,
              evaluatorNationalId: manager.nationalId,
              evaluatorDepartment: manager.department?.displayName || null,
              evaluateeName: subordinate.fullName,
              evaluateeNationalId: subordinate.nationalId,
              evaluateeDepartmentId: subordinate.departmentId,
              evaluateeDepartment: subordinate.department?.displayName || '',
              evaluateePosition: subordinate.position,
              
              // Tipo y estado
              evaluationType: 'MANAGER_TO_EMPLOYEE',
              status: 'PENDING',
              
              // Fechas
              dueDate: cycle.endDate
            }
          });

          // ═══════════════════════════════════════════════════════════
          // 2. CREAR PARTICIPANT (EL FIX MEDULAR)
          // ═══════════════════════════════════════════════════════════
          
          const participant = await tx.participant.create({
            data: {
              campaignId: cycle.campaignId!,  // Campaign vinculada al ciclo
              
              // ⚠️ CRÍTICO: nationalId del EVALUATEE (para reportes)
              nationalId: subordinate.nationalId,
              fullName: subordinate.fullName,
              
              // ⚠️ CRÍTICO: email del EVALUADOR (quien recibe el link)
              email: manager.email,
              
              // Departamento del EVALUATEE (para agregación correcta)
              departmentId: subordinate.departmentId,
              
              // Vínculo con Assignment
              evaluationAssignmentId: assignment.id,
              
              // Token para acceso a encuesta
              uniqueToken: generateUniqueToken(),
              
              // Estado inicial
              hasResponded: false
            }
          });

          // ═══════════════════════════════════════════════════════════
          // 3. ACTUALIZAR ASSIGNMENT CON participantId
          // ═══════════════════════════════════════════════════════════
          
          await tx.evaluationAssignment.update({
            where: { id: assignment.id },
            data: { participantId: participant.id }
          });

        }); // Fin transacción

        created++;

      } catch (error: any) {
        errors.push(`Error ${manager.fullName} → ${subordinate.fullName}: ${error.message}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. ACTUALIZAR Campaign.totalInvited
  // ═══════════════════════════════════════════════════════════════
  
  if (created > 0) {
    await prisma.campaign.update({
      where: { id: cycle.campaignId! },
      data: { totalInvited: created }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ACTUALIZAR ESTADO DEL CICLO
  // ═══════════════════════════════════════════════════════════════
  
  if (created > 0 && cycle.status === 'DRAFT') {
    await prisma.performanceCycle.update({
      where: { id: cycleId },
      data: { status: 'SCHEDULED' }
    });
  }

  return {
    success: true,
    created,
    skipped,
    errors
  };
}
```

#### 2.3 Aplicar mismo patrón a otras funciones de generación

Si existen `generateUpwardEvaluations`, `generateSelfEvaluations`, `generatePeerEvaluations`, aplicar el mismo patrón:

```typescript
// Dentro del loop de cada función:

// 1. Crear Assignment
const assignment = await tx.evaluationAssignment.create({...});

// 2. Crear Participant (SIEMPRE)
const participant = await tx.participant.create({
  data: {
    campaignId: cycle.campaignId!,
    nationalId: evaluatee.nationalId,     // ← SIEMPRE del evaluatee
    email: evaluator.email,                // ← SIEMPRE del evaluador
    departmentId: evaluatee.departmentId,
    evaluationAssignmentId: assignment.id,
    uniqueToken: generateUniqueToken(),
    hasResponded: false
  }
});

// 3. Vincular
await tx.evaluationAssignment.update({
  where: { id: assignment.id },
  data: { participantId: participant.id }
});
```

---

### PASO 3: Ejecutar Migración

```bash
# Generar migración
npx prisma migrate dev --name add_evaluation_assignment_to_participant

# Verificar que se aplicó
npx prisma studio
```

---

## 🧪 VERIFICACIÓN

### Test Manual

1. **Crear ciclo de evaluación** via wizard (TASK_04 debe estar completado)
2. **Ir a detalle del ciclo** y hacer click en "Generar Evaluaciones"
3. **Verificar en BD:**

```sql
-- Verificar que Participants se crearon
SELECT 
  p.id,
  p.national_id as evaluatee_rut,
  p.email as evaluator_email,
  p.evaluation_assignment_id,
  ea.evaluator_id,
  ea.evaluatee_id
FROM participants p
JOIN evaluation_assignments ea ON p.evaluation_assignment_id = ea.id
WHERE p.campaign_id = '[CAMPAIGN_ID]';

-- Verificar totalInvited actualizado
SELECT id, name, total_invited, status
FROM campaigns
WHERE id = '[CAMPAIGN_ID]';
```

4. **Activar ciclo** - debe pasar la validación de totalInvited >= 5

### Resultado Esperado

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  EvaluationAssignment                                           │
│  ├── evaluatorId: "emp_maria"                                   │
│  ├── evaluateeId: "emp_juan"                                    │
│  ├── participantId: "part_001" ✅ VINCULADO                     │
│  └── status: "PENDING"                                          │
│                                                                 │
│  Participant                                                    │
│  ├── id: "part_001"                                             │
│  ├── nationalId: "RUT-Juan" (evaluatee) ✅                      │
│  ├── email: "maria@empresa.cl" (evaluator) ✅                   │
│  ├── evaluationAssignmentId: "asgn_001" ✅                      │
│  └── uniqueToken: "abc123..." ✅                                │
│                                                                 │
│  Campaign                                                       │
│  └── totalInvited: 15 ✅ (antes era 0)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ BACKWARDS COMPATIBILITY

### ¿Rompe productos legacy (Pulso, Exit, Onboarding)?

**NO.** Aquí está la prueba:

| Producto | evaluationAssignmentId | Constraint Efectivo | ¿Funciona? |
|----------|------------------------|---------------------|------------|
| Pulso Express | NULL | [campaignId, nationalId, NULL] | ✅ SÍ |
| Experiencia Full | NULL | [campaignId, nationalId, NULL] | ✅ SÍ |
| Exit Intelligence | NULL | [campaignId, nationalId, NULL] | ✅ SÍ |
| Onboarding Journey | NULL | [campaignId, nationalId, NULL] | ✅ SÍ |
| **Performance** | "asgn_xxx" | [campaignId, nationalId, "asgn_xxx"] | ✅ SÍ |

**Razón:** El constraint triple con NULL en la tercera posición sigue siendo único por persona por campaña.

---

## 📝 ARCHIVOS MODIFICADOS

| Archivo | Cambio | Líneas Aprox |
|---------|--------|--------------|
| `prisma/schema.prisma` | + campo, + relación, ~ constraint | ~10 líneas |
| `src/lib/services/EvaluationService.ts` | + crear Participant, + actualizar totalInvited | ~50 líneas |

---

## ✅ CHECKLIST PRE-COMMIT

- [ ] Schema: `evaluationAssignmentId` agregado a Participant
- [ ] Schema: Relación bidireccional configurada
- [ ] Schema: Constraint modificado a triple
- [ ] Service: `generateManagerEvaluations` crea Participant
- [ ] Service: nationalId = evaluatee, email = evaluator
- [ ] Service: Assignment.participantId se actualiza
- [ ] Service: Campaign.totalInvited se actualiza
- [ ] Migración ejecutada sin errores
- [ ] Test: Ciclo se puede generar
- [ ] Test: Ciclo se puede activar (totalInvited >= 5)
- [ ] Test: Productos legacy siguen funcionando

---

## 🚀 PROMPT PARA CLAUDE CODE

```
Implementa TASK_08_CORE según el documento en .claude/tasks/TASK_08_CORE_FIX_PARTICIPANTS_GAP.md

RESUMEN:
1. Modifica prisma/schema.prisma:
   - Agrega evaluationAssignmentId a Participant
   - Modifica constraint a @@unique([campaignId, nationalId, evaluationAssignmentId])

2. Modifica src/lib/services/EvaluationService.ts:
   - En generateManagerEvaluations(), por cada Assignment:
     - Crear Participant con nationalId del EVALUATEE
     - Crear Participant con email del EVALUADOR
     - Vincular via evaluationAssignmentId
   - Al final, actualizar Campaign.totalInvited

3. Ejecuta migración Prisma

REGLAS CRÍTICAS:
- nationalId = RUT del EVALUATEE (no del evaluador)
- email = del EVALUADOR (quien recibe el link)
- Debe ser backwards compatible (evaluationAssignmentId es opcional)

Si tienes dudas, pregunta antes de implementar.
```

---

**FIN DEL DOCUMENTO TASK_08_CORE**

*Documento generado para FocalizaHR Enterprise*
*Enero 2026*
