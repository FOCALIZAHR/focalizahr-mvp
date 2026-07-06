# 🎯 MÓDULO METAS — DOCUMENTO MAESTRO v3.0

**Fecha:** Julio 2026
**Estado:** POST-EmployeeGoalsInsight (Gates A/B/B.6 sellados) · GoalCycle Gates A (1246cd8) · A.5 (529353e) · B (efc693a+56527f4) · C (874e4aa) sellados
**Propósito:** Fuente de verdad del módulo Metas para continuar desarrollo
**Reemplaza:** METAS_DOCUMENTO_MAESTRO_v2.md (24 Feb 2026)

> ⚠️ Este documento sigue al repo con retraso. El estado real del código es
> la única fuente de verdad (regla #3). Marcar "a confirmar por Code" ante
> cualquier duda de naming, endpoint o componente.

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual del Código](#2-estado-actual-del-código)
3. [Infraestructura Existente a USAR](#3-infraestructura-existente-a-usar)
4. [Decisiones de Diseño Aprobadas](#4-decisiones-de-diseño-aprobadas)
5. [ANEXO — EmployeeGoalsInsight (Seguimiento Mensual)](#5-anexo--employeegoalsinsight)
6. [GoalCycle — Contenedor de Período (Gates A · A.5 · B sellados; C/D pendientes)](#6-goalcycle--contenedor-de-período-gates-a--a5--b-sellados-cd-pendientes)
7. [Panel Personal UI (pendiente)](#7-panel-personal-ui-pendiente)
8. [Lo Que Falta Implementar](#8-lo-que-falta-implementar)
9. [Anti-Patrones — NO HACER](#9-anti-patrones--no-hacer)
10. [Deudas P0/P1 Pendientes](#10-deudas-p0p1-pendientes)
11. [Referencia Técnica](#11-referencia-técnica)

---

## 1. RESUMEN EJECUTIVO

### ¿Qué es el Módulo Metas?

Sistema enterprise de gestión de metas/OKRs, **SOBERANO** (no depende de
PerformanceCycle), con:
- Cascadeo estratégico (Corporativas → Área → Individuales)
- Time Travel (historial inmutable de progreso)
- Árbol de alineación visual (isAligned / isOrphan)
- Motor de reglas por cargo (crea metas reales, no las dibuja)
- Cálculo determinista ponderado (getEmployeeGoalsScore)
- **Seguimiento mensual por persona (EmployeeGoalsInsight)** ← NUEVO v3.0

### Principio Rector

```
Metas es SOBERANO. No depende de PerformanceCycle.
Performance CONSUME metas vía Time Travel (getEmployeeGoalsScore), no al revés.
Todo contenedor o token de Metas es independiente.
```

### Estado Actual (Julio 2026)

```yaml
FUNCIONA (sellado):
  ✅ Hub /dashboard/metas — Lista con tabs
  ✅ Wizard crear meta — 6 pasos (CreateGoalWizard)
  ✅ Detalle meta con check-in + timeline
  ✅ Árbol de alineación (AlignmentTree, detectOrphans)
  ✅ Gestión de equipo (BulkAssignWizard 4 pasos)
  ✅ Configuración (3 páginas: elegibilidad, grupos, reglas)
  ✅ GoalsService completo (incluye requestClosure/approveClosure/rejectClosure)
  ✅ Motor de cascada por cargo (GoalCascadeRuleManager)
  ✅ Schema: campos de cierre + PENDING_CLOSURE
  ✅ EmployeeGoalsInsight — snapshot mensual por persona (Gates A/B/B.6) ← NUEVO

INCOMPLETO (deuda P0 — seguridad):
  ⚠️ 6 APIs de metas SIN hasPermission ni filtrado jerárquico (INSEGURO)
     (ver Sección 10 — deuda P0 antes de cliente real)

EN CURSO (parcial):
  🟡 GoalCycle (contenedor de período) — Gates A `1246cd8` · A.5 `529353e` ·
     B `efc693a`/`56527f4` · C (APIs REST) `874e4aa` SELLADOS. cmfgedx7b… tiene
     su "Ciclo Vigente 2026" ACTIVE con 211 metas (0 huérfanas). Pendiente Gate D
     (UI + type-to-confirm) y Gate E (bloqueo sin ciclo). Ver Sección 6.

NO IMPLEMENTADO:
  ❌ Flujo de cierre y aprobaciones (UI)
  ❌ Router inteligente por rol (Smart Router)
  ❌ Wizard de configuración unificado
  ❌ Panel personal de tendencia (ver Sección 7)
```

---

## 2. ESTADO ACTUAL DEL CÓDIGO

### 2.1 Páginas

```
src/app/dashboard/metas/
├── page.tsx                    # Hub con tabs y lista
├── [id]/page.tsx              # Detalle con timeline
├── crear/page.tsx             # Wizard 6 pasos
├── arbol/page.tsx             # Árbol de alineación
├── equipo/page.tsx            # Gestión de subordinados
└── configuracion/
    ├── page.tsx               # Elegibilidad por cargo
    ├── grupos/page.tsx        # Ponderaciones
    └── reglas/page.tsx        # Cascada automática
```

### 2.2 APIs — Estado de Seguridad

| API | Ubicación | hasPermission | Filtrado jerárquico | Estado |
|-----|-----------|---------------|---------------------|--------|
| GET/POST goals | `/api/goals/route.ts` | ❌ NO | ❌ NO | ⚠️ INSEGURO |
| GET/PATCH/DELETE goal | `/api/goals/[id]/route.ts` | ❌ NO | ❌ NO | ⚠️ INSEGURO |
| GET orphans | `/api/goals/orphans/route.ts` | ❌ NO | ❌ NO | ⚠️ INSEGURO |
| GET alignment-report | `/api/goals/alignment-report/route.ts` | ❌ NO | ❌ NO | ⚠️ INSEGURO |
| GET team | `/api/goals/team/route.ts` | ❌ NO | ❌ NO | ⚠️ INSEGURO |
| PATCH check-in | `/api/goals/[id]/check-in/route.ts` | ❌ NO | ❌ NO | ⚠️ INSEGURO |
| goal-rules | `/api/config/goal-rules/route.ts` | ✅ SÍ | ❌ NO | ✅ OK |
| goal-groups | `/api/config/goal-groups/route.ts` | ✅ SÍ | ❌ NO | ✅ OK |
| goal-eligibility | `/api/config/goal-eligibility/route.ts` | ✅ SÍ | ❌ NO | ✅ OK |
| **GET goals-aggregation (cron)** | `/api/cron/goals-aggregation/route.ts` | ✅ CRON_SECRET | n/a (multi-tenant) | ✅ OK ← NUEVO |

### 2.3 Servicios Backend

```typescript
// src/lib/services/GoalsService.ts — COMPLETO
static async createCorporateGoal()
static async createManagerGoal()
static async cascadeGoal()
static async updateProgress()          // Crea GoalProgressUpdate
static async getAlignmentTree()
static async detectOrphans()
static async getAlignmentReport()
static async getEmployeeGoalsScore()   // Time Travel — ponderado por weight (:302-330)
static async checkGoalLimit()
static async requestClosure()          // ✅ YA EXISTE
static async approveClosure()          // ✅ YA EXISTE
static async rejectClosure()           // ✅ YA EXISTE
static async getPendingClosures()      // ✅ YA EXISTE

// src/lib/services/GoalsAggregationService.ts — NUEVO (Gate A + B.6)
static async runMonthlyAggregation()   // LENTE 1 + LENTE 2, chunks paralelos de 10
private static async calculateEmployeeInsight()  // LENTE 1
private static async updateGoldCache()           // LENTE 2
private static async processEmployee()           // unidad paralela (LENTE1→LENTE2)
private static async resolveActiveCycle()        // goalCycleId (null hasta GoalCycle)
```

### 2.4 getEmployeeGoalsScore — consolidación confirmada

```yaml
Confirmado por Code (GoalsService.ts:302-330):
  Por meta:   weightedScore = (progress * weight) / 100
  Agregación: score = round((Σ weightedScore / Σ weight) * 100), clamp 0-100
  Filtro:     solo metas con weight > 0
  Retorno:    { score, goalsCount, completedCount, totalWeight, details[] }
  Caso vacío: score = 0 (nunca null)

IMPLICACIÓN: es PONDERADO por weight, normalizado por totalWeight
(no asume que sume 100). Time Travel determinista.
```

### 2.5 Schema Prisma — Goal + relacionados

```prisma
model Goal {
  // ... campos existentes ...

  // CIERRE
  closureRequestedAt  DateTime?
  closureRequestedBy  String?
  closedAt            DateTime?
  closedBy            String?
  closureApprovedBy   String?
  closureNotes        String?
}

enum GoalStatus {
  NOT_STARTED
  ON_TRACK
  AT_RISK
  BEHIND
  PENDING_CLOSURE
  COMPLETED
  CANCELLED
}

enum GoalLevel { COMPANY · AREA · INDIVIDUAL }
enum GoalOriginType { STRATEGIC_CASCADE · MANAGER_CREATED }
enum GoalType { KPI · OBJECTIVE · KEY_RESULT · PROJECT }
enum GoalMetricType { PERCENTAGE · CURRENCY · NUMBER · BINARY }
```

---

## 3. INFRAESTRUCTURA EXISTENTE A USAR

### 3.1 AuthorizationService (OBLIGATORIO en APIs)

```typescript
import {
  extractUserContext,      // accountId, role, departmentId
  hasPermission,           // valida permisos por rol
  getChildDepartmentIds,   // filtrado jerárquico (CTE recursivo)
  GLOBAL_ACCESS_ROLES      // roles que ven toda la empresa
} from '@/lib/services/AuthorizationService'
```

### 3.2 Permisos de Metas

```typescript
// EXISTE:
'goals:config': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']

// ❌ NO EXISTEN — deben agregarse (deuda P0):
'goals:view':    [ADMIN, OWNER, HR_ADMIN, HR_MANAGER, CEO, AREA_MANAGER, EVALUATOR]
'goals:create':  [ADMIN, OWNER, HR_ADMIN, HR_MANAGER, CEO, AREA_MANAGER, EVALUATOR]
'goals:approve': [ADMIN, OWNER, CEO, AREA_MANAGER]
```

### 3.3 GLOBAL_ACCESS_ROLES

```typescript
const GLOBAL_ACCESS_ROLES = [
  'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER', 'CEO'
]
```

---

## 4. DECISIONES DE DISEÑO APROBADAS

### 4.1 Dos "Mundos" por Rol

```yaml
ESTRATEGA (CEO, ACCOUNT_OWNER, HR_ADMIN):
  Ve: salud de alineación, configurar ciclo, aprobar cierres, metas corporativas

TÁCTICO (AREA_MANAGER, líderes con equipo):
  Ve: Mission Control (gauge + CTA), su equipo, sus metas, metas del equipo filtradas
```

### 4.2 Usuario Híbrido — Switcher de 2 tabs

```yaml
Tab "Mi Equipo" (default) → Centro de Mando
Tab "Estrategia" → Torre de Control
showSwitcher = CEO || ACCOUNT_OWNER || (hasDirectReports && ownsCompanyGoals)
```

### 4.3 Flujo de Cierre

```yaml
ON_TRACK → PENDING_CLOSURE → COMPLETED
                  ↓ (si rechazo)
              vuelve a ON_TRACK
```

---

## 5. ANEXO — EmployeeGoalsInsight

### 5.0 Qué es

**Primer insight a nivel PERSONA de la plataforma.** Todos los insights
previos son por departamento (DepartmentExitInsight, etc.). Este persiste,
mes a mes, el cumplimiento consolidado de metas de cada persona.

```yaml
OBJETIVO:
  (a) Panel personal: avance + tendencia mensual
  (b) Serie histórica FIEL (no reconstruida en vivo — el peso de una meta
      puede cambiar y distorsionaría la reconstrucción)

PATRÓN: calca DepartmentExitInsight + ExitAggregationService
  LENTE 1: EmployeeGoalsInsight (histórico mensual)
  LENTE 2: Employee.accumulatedGoals* (Gold Cache rolling 12 meses)

PRINCIPIO: NO recalcula. Consume getEmployeeGoalsScore vía Time Travel.
```

### 5.1 Modelo EmployeeGoalsInsight

```prisma
model EmployeeGoalsInsight {
  id            String   @id @default(cuid())
  accountId     String   @map("account_id")
  employeeId    String   @map("employee_id")

  // PERÍODO (patrón FocalizaHR)
  period        String                              // "2026-01", "2026-Q1"
  periodType    String   @default("monthly") @map("period_type")
  periodStart   DateTime @map("period_start") @db.Date
  periodEnd     DateTime @map("period_end") @db.Date

  // REFERENCIA OPCIONAL AL CICLO (nullable — preparado para GoalCycle)
  goalCycleId   String?  @map("goal_cycle_id")

  // MÉTRICAS (de getEmployeeGoalsScore)
  weightedScore    Float?  @map("weighted_score")    // 0-100
  goalsCount       Int     @default(0) @map("goals_count")
  completedCount   Int     @default(0) @map("completed_count")
  totalWeight      Float   @default(0) @map("total_weight")

  // TREND (vs período anterior — null si primer mes)
  scoreTrend       Float?  @map("score_trend")

  // DETALLE JSON (snapshot inmutable)
  goalsDetail      Json?   @map("goals_detail")

  calculatedAt     DateTime @default(now()) @map("calculated_at")

  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  employee  Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([accountId, employeeId, period, periodType], map: "unique_employee_goals_period")
  @@index([accountId]) @@index([employeeId]) @@index([period]) @@index([goalCycleId])
  @@map("employee_goals_insights")
}

// Employee (Gold Cache LENTE 2 — primer accumulated* a nivel persona):
//   accumulatedGoalsScore       Float?
//   accumulatedGoalsPeriods     Int?
//   accumulatedGoalsLastUpdated DateTime?   (naming Department-consistent)
//   goalsInsights EmployeeGoalsInsight[]    (relación inversa)
// Account: goalsInsights EmployeeGoalsInsight[]  (inversa F1, requisito Prisma)
```

### 5.2 GoalsAggregationService

```yaml
runMonthlyAggregation(accountId, period):
  Universo: empleados status:'ACTIVE' + isActive:true con ≥1 meta weight>0
            vigente en período (startDate <= periodEnd, dueDate >= periodStart)
  Chunks paralelos de 10 (Promise.allSettled) — CHUNK_SIZE=10
  Por empleado (processEmployee): LENTE1 (calculateEmployeeInsight) → LENTE2 (updateGoldCache)
  Upsert idempotente sobre @@unique
  goalCycleId: resolveActiveCycle (null hasta que GoalCycle exista)

LENTE 1: upsert con weightedScore, goalsCount, completedCount, totalWeight,
         scoreTrend (vs mes anterior), goalsDetail (JSON)
LENTE 2: rolling average de últimos 12 meses → Employee.accumulatedGoals*
```

### 5.3 Cron

```yaml
Ruta: /api/cron/goals-aggregation/route.ts
Método: GET (Vercel Cron despacha por GET — POST daría 405)
Auth: Bearer CRON_SECRET (bypass x-vercel-cron-bypass + 500 guard + 401)
Config: maxDuration=300, dynamic='force-dynamic' (sin fetchCache — no hace fetch)
Período: mes anterior automático + override ?period=YYYY-MM (testing)
Loop: cuentas status:'ACTIVE', select {id, companyName}

vercel.json (schedule 0 4 1 * *):
  { "path": "/api/cron/goals-aggregation", "schedule": "0 4 1 * *" }
  Slot 04:00 UTC libre. Hobby: 100 crons, once-per-day → mensual cabe.
```

### 5.4 Sellos de Gates

```yaml
GATE A — e4a0b0a:
  Schema (EmployeeGoalsInsight + Employee 3 cols + inversa + Account inversa F1)
  + GoalsAggregationService (LENTE 1 + 2)
  Smoke: 50 emp, trend NULL→numérico, Gold Cache rolling, idempotencia

GATE B — 2dd0fcf:
  Handler cron GET + vercel.json
  HALLAZGO B1: Vercel despacha GET (no POST). POST = 405 = cron muerto.
  Smoke HTTP 3/3: 200 válido, 401 inválido, período automático

GATE B.5 — (investigación, sin commit):
  Confirmado: patrón PerformanceRatingService:433-456, pool pgbouncer ~15,
  sin race (cada empleado toca solo su fila)

GATE B.6 — paralelización:
  BATCH_SIZE=50 → CHUNK_SIZE=10 + Promise.allSettled + processEmployee
  Smoke: PARIDAD total 50/50 (secuencial=paralelo), 211s→28.84s (7.3×),
         idempotencia preservada bajo concurrencia
  Mejora colateral: eliminado el único catch(error:any) del loop
```

### 5.5 Decisiones honradas (F1–F4)

```yaml
F1: inversa en Account (requisito Prisma, mi spec lo omitió)
F2: filas score=0 de metas sin check-in — se dejan (auditoría fiel).
    La UI resuelve filtrando goalsCount>0 + nota de períodos cerrados.
F3: isActive:true junto a status:'ACTIVE' (convención Employee del proyecto)
F4: cast (prisma as any).goalCycle — único any, justificado (GoalCycle no existe)
```

### 5.6 Deuda de este anexo

```yaml
Ninguna funcional. Todo sellado y con paridad probada.
El cron soporta 200+ empleados (<300s) tras B.6.

Nota F2 para la UI: filas con goalsCount=0 existen en BD (metas vencidas a
mitad de mes sin score a fin de mes). El panel DEBE filtrar goalsCount>0
en la tendencia y mostrar nota de "período con metas cerradas".
```

---

## 6. GoalCycle — Contenedor de Período (Gates A · A.5 · B sellados; C/D pendientes)

### 6.0 GATE A — SELLADO

```yaml
GATE A — 1246cd8 (schema, sin pushear):
  model GoalCycle + enums GoalPeriodType (QUARTERLY/SEMESTER/ANNUAL) y
  GoalCycleStatus (PLANNING/ASSIGNING/ACTIVE/CLOSING/CLOSED).
  Goal.goalCycleId String? + relación onDelete:SetNull + @@index([goalCycleId]).
  Account.goalCycles GoalCycle[] (inversa).

  DELTAS vs diseño 6.3 (lo APLICADO manda):
    - quarter/semester: Int @default(0), NO nullable. En Postgres NULL no
      colisiona en un UNIQUE pero 0 sí → el default 0 es lo que protege
      unique_goal_cycle_period (confirmado en smoke S1).
    - SIN autoCloseOnDate (se descartó — cierre manual por defecto).
    - Agregados sobre el diseño: updatedAt @updatedAt, createdBy,
      closureWindowUpdatedAt/By (auditoría de ventana), @@index([accountId]),
      @@index([status]).
    - linkedPerformanceCycleId String?: soft ref SIN FK/UI/flujo (solo el campo).

  El schema NO lleva el candado de "1 ACTIVE por cuenta". El @@unique es de
  PERÍODO (1 ciclo por accountId+year+periodType+quarter+semester). La garantía
  1-ACTIVE es el advisory lock en GoalCycleService.activate() → Gate B.

  Verificado: prisma validate + db push (crea goal_cycles + goals.goal_cycle_id)
  + generate (GoalCycle/GoalCycleStatus/GoalPeriodType en el Client) + tsc
  --noEmit, todos limpios.

  Smoke (prisma/scripts/smoke-goal-cycle-gateA.ts — UNTRACKED, re-ejecutable):
    S1: crear ANNUAL 2026 (quarter/semester=0 por default) → crear OTRO ANNUAL
        2026 misma cuenta → P2002 en unique_goal_cycle_period. El target del
        error incluye quarter/semester → confirma que el default 0 protege,
        NO que quedó NULL.
    S2: 3 metas reales de cmfgedx7b… asociadas vía goalCycleId; relectura con
        include:{ goalCycle } correcta en las 3.
    CLEANUP: goalCycleId→null (por id exacto) + delete del ciclo (por id), todo
             en un $transaction. Sin residuo.

GATE A.5 — 529353e (migración retroactiva, sin pushear):
  Script prisma/scripts/migrate-goal-cycle-retroactive.ts (versionado). Agrupa
  metas huérfanas (goalCycleId=null) por (accountId, periodYear) → 1 GoalCycle
  ANNUAL por año presente (cada año un ciclo separado).
    status: en curso→ACTIVE, anterior→CLOSED (closedBy/closedAt), futuro→PLANNING.
    name:   ACTIVE "Ciclo Vigente {year}" · CLOSED/PLANNING "Ciclo {year}".
    ventanas: assignment=MIN(startDate), closure=MAX(dueDate) del año,
              tracking=midpoint. closure NO se recorta al año calendario.
    Idempotente (findFirst unique key + updateMany solo goalCycleId=null).
    Guarda "1 ACTIVE": no crea un 2º ciclo ACTIVE (bypass del lock de Gate B).
    Dry-run por default; --apply para escribir; --account/--years para acotar.

  APPLY real acotado SOLO a cmfgedx7b… (resto de cuentas DIFERIDO, se decide
  después de revisar): 1 ciclo "Ciclo Vigente 2026" ACTIVE (id cmr8qhxk…), 211
  metas asociadas. Verificado: goals con goal_cycle_id NULL = 0; getActiveCycle
  devuelve ese ciclo (1 solo ACTIVE en la cuenta).
  Smoke multi-año sintético (2019/2020, referenceYear inyectado, UNTRACKED)
  VERDE: 2 ciclos separados, status/name/ventanas/tracking por año, auditoría
  CLOSED, idempotencia (2ª corrida 0/0), cleanup por id en $transaction.

GATE B — efc693a (GoalCycleService, sin pushear):
  GoalCycleService (src/lib/services/). State machine PLANNING→ASSIGNING→ACTIVE
  →CLOSING→CLOSED. Métodos: createCycle (PLANNING, valida quarter/semester por
  periodType, SIN singleton), activate (EL CANDADO), closeCycle (→CLOSING),
  finalizeCycle (→CLOSED con closedAt/closedBy), getActiveCycle, updateClosureWindow.
  Guardas de estado-fuente en activate/close/finalize. Errores de dominio:
  GoalCycleActiveError (409 GOAL_CYCLE_ALREADY_ACTIVE) / GoalCycleClosedError /
  GoalCycleValidationError (Gate C los mapea a HTTP).

  finalizeCycle (CLOSING→CLOSED) agregado en este gate: sin él CLOSED es inalcanzable
  y el smoke/lock no funcionan (decisión A del plan).

  El candado: activate() en $transaction con advisory lock
  pg_advisory_xact_lock(hashtext(accountId)) + check status IN ('ACTIVE','CLOSING').
  DECISIÓN TÉCNICA: el lock usa $executeRaw, NO $queryRaw — pg_advisory_xact_lock
  retorna void y $queryRaw no deserializa esa columna. El mecanismo del candado es
  EXACTAMENTE el mismo (advisory lock por cuenta); solo cambia el verbo Prisma.

  Conexión: GoalsAggregationService usa GoalCycleService.getActiveCycle(accountId).
  Eliminado el ÚLTIMO any F4 (cast (prisma as any).goalCycle + try/catch borrados).
  getActiveCycle NO filtra por ventana (limitación conocida solo en backfill manual
  ?period= de mes viejo; el cron mensual normal no la toca).
  Enforcement: GoalsService.updateProgress bloquea con GoalCycleClosedError si el
  GoalCycle de la meta tiene lockAfterClosure && status===CLOSED (NUNCA CLOSING,
  nunca Goal.status).

  Verificado: tsc --noEmit + npm run build OK. Smoke
  prisma/scripts/smoke-goal-cycle-gateB.ts (UNTRACKED, cuenta sintética, cleanup
  por id) VERDE — tabla completa:
    createCycle A/B en PLANNING ............................. ✓ (B se crea con A existente)
    PLANNING no dispara candado (getActiveCycle null) ...... ✓
    activate(A) → ACTIVE ................................... ✓ (getActiveCycle=A)
    activate(B) con A ACTIVE → 409 GOAL_CYCLE_ALREADY_ACTIVE  ✓
    closeCycle(A) → CLOSING; B sigue 409 (CLOSING cuenta) .. ✓
    finalizeCycle(A) → CLOSED (closedAt/closedBy poblados) . ✓
    activate(B) tras A CLOSED → ACTIVE .................... ✓ (getActiveCycle=B)
    lockAfterClosure: updateProgress en CLOSED bloqueado / en ACTIVE permitido  ✓

CIERRE DE VACÍOS (auditoría posterior) — efc693a + 56527f4:
  1. Herencia automática (Decisión #4) — CERRADO en 56527f4: helper
     resolveInheritedCycleId cableado en los 4 creadores de Goal
     (createCorporateGoal, cascadeGoal, createManagerGoal,
     createFromDevelopmentGoal). El 4º incluido: sin goalCycleId bypasearía el
     guard de lockAfterClosure. Smoke smoke-goal-cycle-inheritance.ts (cadena PDI
     completa, 2 cuentas) VERDE: 4 métodos heredan el ACTIVE / null sin ciclo.
  2. updateClosureWindow — corrección de auditoría: NO era un vacío, ya existía
     en efc693a. La auditoría lo reportó mal. Sin código nuevo.
  Con ambos resueltos, Gate B queda COMPLETO. Spec versionada: SPEC_GOALCYCLE_v4.md.

GATE C — 874e4aa (APIs REST, SELLADO): 5 endpoints /api/goals/cycles (GET lista
  paginada, POST crear, GET/PATCH [id], POST activate/close/finalize) + permiso
  goals:cycles:manage (estrategas) + mapper de errores de dominio a HTTP (409
  GOAL_CYCLE_ALREADY_ACTIVE/GOAL_CYCLE_CLOSED/GOAL_CYCLE_PERIOD_EXISTS, 400
  validación). close/finalize SEPARADOS (CLOSING es donde opera el modal Gate D).
  Guard multi-tenant por ruta (ownership → 404). Smoke gateC VERDE.

GATE D — EN CURSO (7 sub-pasos D.1–D.7, ver SPEC §Gate D):
  D.5 BACKEND — a90c051 (SELLADO): decisiones del modal de cierre (Decisión #8).
    GoalsService.applyCycleClosureDecisions (bulk tx-aware: validación todo-o-nada
    del set accionable + 3 baldes CLOSE_WITH_SCORE/MARK_REVIEW/LEAVE_AS_IS con
    updateMany/createMany, accountId+goalCycleId en todo where, assert de carrera,
    auditoría con accountId) + GoalCycleService.finalizeCycleWithDecisions
    ($transaction única: decisiones + CLOSING→CLOSED). GET /api/goals filtro
    goalCycleId. POST /finalize acepta decisions[] opcional (backward-compatible).
    Dimensionado con dato real (182 metas incompletas en la piloto → bulk, no loop).
    CLOSE_WITH_SCORE = escritura directa a COMPLETED (approveClosure exige
    PENDING_CLOSURE; closureApprovedBy=null + nota de cierre forzado). MARK_REVIEW
    = PENDING_CLOSURE (mismo end-state que requestClosure, sin campo nuevo). Guard
    lockAfterClosure NO se agrega a approve/rejectClosure (decisión Victor D.5a).
    Smoke gateD5 (untracked) VERDE. tsc+build limpios.
  D.1 — c388f56 (SELLADO): GET /api/goals/cycles/active liviano {id,name,status},
    RBAC goals:view (no estratega), para el wizard del colaborador. Lo consume D.6.
  D.5 UI + D.2/D.3/D.4/D.6/D.7 — PENDIENTES.
GATE E — PENDIENTE (último): bloqueo "sin ciclo → error".
```

### 6.1 Problema que resuelve

```yaml
HOY: Metas tienen periodYear/periodQuarter sueltos. No hay contenedor que
     responda: "¿está abierto el proceso de metas 2027?" · "¿cuándo cierra?"
     · "¿quién puede editar tras el cierre?"

Aprobación de cierre existe (requestClosure/approveClosure) pero es POR META,
no responde a un PERÍODO con estado abrir/cerrar.
```

### 6.2 Principio de arquitectura (validado)

```yaml
GoalCycle CONFIGURA, no POSEE.
  Las metas siguen SOBERANAS. goalCycleId es OPCIONAL (nullable).
  El ciclo define ventanas/estados; la meta existe independiente.
  Performance sigue consultando por FECHA (Time Travel), no por ciclo.

Esto es ADITIVO: no rompe nada. EmployeeGoalsInsight ya tiene goalCycleId
nullable preparado (resolveActiveCycle retorna null hasta que exista).
```

### 6.3 Diseño propuesto (ORIGINAL — ver 6.0 para lo APLICADO; hay deltas)

> ⚠️ Bloque histórico previo al sello. El schema real está en 6.0 GATE A. Deltas
> conocidos: quarter/semester son `@default(0)` NO nullable, `autoCloseOnDate` se
> descartó, se agregaron auditoría de ventana + updatedAt/createdBy.


```prisma
model GoalCycle {
  id              String   @id @default(cuid())
  accountId       String   @map("account_id")

  name            String                    // "Q1 2026", "Año 2026"
  periodType      GoalPeriodType            // QUARTERLY | SEMESTER | ANNUAL
  year            Int
  quarter         Int?
  semester        Int?

  // Ventanas configurables por empresa (recomendaciones, no bloqueos duros)
  assignmentWindow  DateTime
  trackingWindow    DateTime
  closureWindow     DateTime

  status          GoalCycleStatus @default(PLANNING)

  // Reglas
  requiresClosure   Boolean @default(true)
  autoCloseOnDate   Boolean @default(false)
  lockAfterClosure  Boolean @default(true)

  // Conexión OPCIONAL con Performance (no acopla)
  linkedPerformanceCycleId String?

  closedAt        DateTime?
  closedBy        String?
  createdAt       DateTime @default(now())

  account         Account  @relation(fields: [accountId], references: [id])

  @@unique([accountId, year, periodType, quarter, semester])
  @@map("goal_cycles")
}

enum GoalPeriodType { QUARTERLY · SEMESTER · ANNUAL }
enum GoalCycleStatus { PLANNING · ASSIGNING · ACTIVE · CLOSING · CLOSED }

// Goal: agregar goalCycleId String? (opcional, no FK dura por ahora)
```

### 6.4 Fases del ciclo

```yaml
PLANNING → ASSIGNING → ACTIVE → CLOSING → CLOSED

Fechas CONFIGURABLES por empresa (cada Account define las suyas).
Ventanas son RECOMENDACIONES (alerta si se pasan), no bloqueos automáticos
salvo autoCloseOnDate=true. Cierre manual por defecto (patrón validado).
```

### 6.5 Cuando se implemente

```yaml
- resolveActiveCycle en GoalsAggregationService ya está listo:
  quita el try/catch cuando GoalCycle exista en el client, y el
  cast (prisma as any) desaparece (elimina el único any de F4).
- EmployeeGoalsInsight.goalCycleId empezará a poblarse solo.
- Los insights mensuales se etiquetan con su ciclo, sin ceguera entre ciclos
  (siguen siendo mes calendario + contexto de ciclo).
```

---

## 7. Panel Personal UI (PENDIENTE)

### 7.1 Fuente de datos

```yaml
LENTE 1 (EmployeeGoalsInsight): serie mensual → gráfico de tendencia
LENTE 2 (Employee.accumulatedGoals*): score rodante → gauge de contexto
```

### 7.2 Diseño (MANIFIESTO_v5)

```yaml
Patrón: narrativa protagonista, números como consecuencia (P8)
  - Gauge de cumplimiento actual (Gold Cache) como CONTEXTO (30%)
  - Tendencia mensual (LENTE 1) como PROTAGONISTA (70%)
  - Un color protagonista por sección
  - Sin semáforo rojo/verde como indicador primario
  - Tesla line solo en cards con señal

Componentes (a confirmar naming con Code):
  - PersonalGoalsGauge (gauge del acumulado)
  - PersonalGoalsTrend (línea temporal mensual)
  - PersonalGoalsPanel (contenedor Patrón G / Cinema Mode)
```

### 7.3 REGLA CRÍTICA — filtro F2

```yaml
El panel DEBE filtrar goalsCount > 0 en el gráfico de tendencia.

RAZÓN (F2): filas con goalsCount=0 existen en BD (metas vencidas a mitad
de mes, sin score a fin de mes → weightedScore=0). Sin filtrar, el gráfico
mostraría caídas a 0 engañosas.

Además: mostrar nota de "período con metas cerradas" para esos meses,
no un 0% que parezca mal desempeño.
```

### 7.4 Narrativa (focalizahr-narrativas)

```yaml
Ejemplo tono (McKinsey + Apple, sin jerga RRHH):
  ❌ "Tu weightedScore mensual muestra tendencia positiva"
  ✅ "Tu cumplimiento subió de 44% a 78% en tres meses. El impulso está de tu lado."

Consecuencia, no instrucción (P5).
Narrativa lidera, número es consecuencia (P8).
```

---

## 8. LO QUE FALTA IMPLEMENTAR

### 8.1 P0 — Seguridad APIs (antes de cliente real)

```yaml
6 endpoints goals sin hasPermission ni filtrado jerárquico.
Patrón a seguir: GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_2.md
Copiar de: src/app/api/admin/employees/route.ts
Agregar permisos goals:view/create/approve a AuthorizationService PRIMERO.
```

### 8.2 P1 — Cierre de Metas (UI)

```yaml
Backend listo (GoalsService.requestClosure/approveClosure/getPendingClosures).
Falta: APIs request-closure/approve-closure/pending-closure + UI botón/página.
```

### 8.3 P1 — GoalCycle (Sección 6)

### 8.4 P1 — Panel Personal (Sección 7)

### 8.5 P2 — Router inteligente + Wizard config unificado

---

## 9. ANTI-PATRONES — NO HACER

```yaml
❌ NO crear código sin verificar el real primero (regla #3)
❌ NO reemplazar páginas completas (modificar incrementalmente)
❌ NO asumir que hasPermission existe (verificar en AuthorizationService)
❌ NO ignorar filtrado jerárquico (todos ven todo = leak multi-tenant)
❌ NO crear múltiples tasks grandes simultáneas (gates pequeños verificables)
❌ NO acoplar Metas a PerformanceCycle (Metas es SOBERANO)
❌ NO reconstruir score histórico en vivo (usar EmployeeGoalsInsight persistido)
❌ NO registrar crons como POST (Vercel despacha GET → 405)
❌ NO aumentar maxDuration como solución de escala (antipatrón — paralelizar)
```

---

## 10. DEUDAS P0/P1 PENDIENTES

```yaml
🔴 P0 — RBAC en 6 endpoints goals (INSEGURO):
   /api/goals, /api/goals/[id], orphans, alignment-report, team, check-in
   Sin hasPermission ni filtrado jerárquico → leak multi-tenant potencial.
   OBLIGATORIO antes del primer cliente real.
   Regla Enterprise #2: RBAC en cada endpoint vía AuthorizationService.

🟡 P1 — Flujo de cierre UI (backend listo)
🟡 P1 — GoalCycle: Gates A `1246cd8` · A.5 `529353e` · B `efc693a`+`56527f4`
        (candado singleton, finalizeCycle, lockAfterClosure, herencia, elimina
        any F4) · C `874e4aa` (5 APIs REST, RBAC goals:cycles:manage, mapper de
        errores) SELLADOS (sin pushear). cmfgedx7b… migrada (1 ciclo ACTIVE, 211
        metas, 0 huérfanas); resto de cuentas DIFERIDO. Pendiente Gate D (UI) +
        Gate E (bloqueo sin ciclo). Ver Sección 6.
🟡 P1 — Panel personal (Sección 7)

🟢 P2 — Router inteligente, wizard config unificado
```

---

## 11. REFERENCIA TÉCNICA

### 11.1 Archivos clave

```yaml
SERVICIOS:
  src/lib/services/GoalsService.ts              # Lógica de metas + Time Travel
  src/lib/services/GoalsAggregationService.ts   # Snapshot mensual (Gate A/B.6)
  src/lib/services/AuthorizationService.ts      # RBAC + filtrado

APIS:
  src/app/api/goals/route.ts                    # CRUD (⚠️ inseguro)
  src/app/api/goals/[id]/route.ts               # detalle/update/delete (⚠️)
  src/app/api/goals/team/route.ts               # equipo (⚠️)
  src/app/api/config/goal-*/                     # config (✅ seguro)
  src/app/api/cron/goals-aggregation/route.ts   # cron mensual (✅ GET)

SCHEMA:
  Goal, GoalProgressUpdate, GoalLibrary
  EmployeeGoalsInsight (nuevo)
  Employee.accumulatedGoals* (nuevo)

CRON:
  vercel.json → goals-aggregation "0 4 1 * *"
```

### 11.2 Commits del anexo EmployeeGoalsInsight

```yaml
Gate A:   e4a0b0a  (schema + GoalsAggregationService)
Gate B:   2dd0fcf  (handler cron GET + vercel.json)
Gate B.6: [hash]   (paralelización chunks de 10)
```

### 11.3 Documentación relacionada (PK)

```yaml
GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_2.md  # patrón APIs
MANIFIESTO_FOCALIZAHR_v5.md                              # diseño (panel UI)
DISENO_EMPLOYEE_GOALS_INSIGHT_v1.md                      # spec sellado del anexo
```

### 11.4 Cuentas de prueba

```yaml
cmfgedx7b00012413i92048wl  # 50 empleados con metas (usada en smokes A/B/B.6)
victor@focalizahr.cl · vyanezb@gmail.com · claudia.palominos@gmail.com
```

---

**FIN DEL DOCUMENTO MAESTRO v3.0**

**Estado:** EmployeeGoalsInsight sellado (A/B/B.6). GoalCycle Gates A (`1246cd8`) · A.5 (`529353e`) · B (`efc693a`+`56527f4`) · C (APIs REST, `874e4aa`) sellados (sin pushear); cmfgedx7b… migrada, resto DIFERIDO. Pendiente Gate D (UI type-to-confirm) y Gate E (bloqueo sin ciclo). Panel UI diseñado, pendiente. Deuda P0 (RBAC 6 endpoints) vigente antes de cliente real.
