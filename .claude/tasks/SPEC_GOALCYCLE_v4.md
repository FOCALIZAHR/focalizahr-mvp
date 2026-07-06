# 📐 SPEC — GoalCycle (Contenedor de Período de Metas)

**Versión:** v4 (corregida — refleja el estado REAL post Gate A/A.5/B,
no solo el diseño de Gate 0)
**Proyecto:** Módulo Metas — GoalCycle
**Fecha:** Julio 2026
**Estado:** Gate A ✅ · Gate A.5 ✅ · Gate B ✅ · Gate C ✅ (APIs REST) ·
Gate D/E sin empezar
**Fuente:** METAS_DOCUMENTO_MAESTRO_v3.md §6
**Patrón de estados a calcar:** IMPLEMENTACION_POST_BACKEND_PERFORMANCE_v2.md
(PerformanceCycle: mapa de transiciones + guard 400 — se calca la FORMA,
no los nombres de estado, GoalCycle tiene su propia máquina)

> ⚠️ Esta es la versión VIGENTE. Reemplaza v1, v2 y v3. Si aparece
> cualquier versión anterior en PK sin la Sección 3.1 (candado de
> aplicación) o sin el Gate 0 con hallazgos reales de Code, es vieja.
> ⚠️ Code es la única fuente de verdad del código. Esta spec ya pasó
> por Gate 0 con Code real — los hallazgos de esta sección son evidencia
> confirmada (file:line), no supuestos de diseño.

---

## 1. OBJETIVO DE NEGOCIO

Dar al módulo Metas un contenedor de período con estado (abrir/cerrar) que
responda: "¿está abierto el proceso de metas?", "¿cuándo cierra?", "¿quién
puede editar tras el cierre?". Hoy las metas tienen `periodYear`/`periodQuarter`
sueltos sin gobernanza de período.

```yaml
PRINCIPIO RECTOR (validado):
  GoalCycle CONFIGURA, no POSEE.
  Las metas siguen SOBERANAS. goalCycleId es OPCIONAL (nullable).
  El ciclo define ventanas/estados; la meta existe independiente.
  Performance sigue consultando por FECHA (Time Travel), no por ciclo.
  Es ADITIVO: no rompe nada existente.

PRINCIPIO CREAR ≠ ACTIVAR (confirmado en Gate 0, estándar de industria):
  Crear un ciclo (status PLANNING) NO tiene restricción — se puede hacer
  en cualquier momento, incluso con el ciclo anterior todavía ACTIVE.
  Es lo normal en toda plataforma de OKR/metas: se planifica el próximo
  período con semanas de anticipación mientras el actual sigue corriendo.
  ACTIVAR (transición a ACTIVE) es lo único que pasa por el candado de
  singleton (ver §3.1) — porque ahí es donde importa que solo haya uno
  "vigente" para efectos de herencia y agregación.
```

---

## 2. DECISIONES DE NEGOCIO (cerradas por Victor)

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Quién crea el ciclo | Rol estratega (CEO / ACCOUNT_OWNER / HR_ADMIN) |
| 2 | Dónde | Página dedicada /admin/metas/ciclos |
| 3 | Ciclos activos simultáneos | SOLO UNO por accountId (candado de aplicación, §3.1) |
| 4 | Selección de ciclo al crear meta | Usuario HEREDA el ACTIVE (no selecciona) |
| 5 | Sin ciclo activo | BLOQUEAR creación de meta (Gate E, al final del rollout) |
| 6 | Cierre | MANUAL (acción del estratega, sin cron) |
| 7 | closureWindow | Fecha SUGERIDA (recordatorio + Gate F), editable |
| 8 | Metas no completadas al cierre | Estratega decide al cerrar (modal, Gate D) |
| 9 | Relación con Performance | NO toca (linkedPerformanceCycleId opcional, sin UI) |
| 10 | Soberanía | goalCycleId nullable, metas independientes |
| 11 | Crear vs Activar | Crear sin restricción; Activar pasa por candado de singleton |
| 12 | Activar mientras el anterior cierra | NO permitido — debe esperar a CLOSED, no solo CLOSING |

---

## 3. MODELO PROPUESTO

```prisma
model GoalCycle {
  id              String   @id @default(cuid())
  accountId       String   @map("account_id")

  name            String                              // "Q1 2026", "Año 2026"
  periodType      GoalPeriodType                      // QUARTERLY | SEMESTER | ANNUAL
  year            Int
  quarter         Int  @default(0)                    // 1-4 si QUARTERLY, 0 si no aplica
  semester        Int  @default(0)                    // 1-2 si SEMESTER, 0 si no aplica
  // ⚠️ default 0 (NO nullable): en Postgres NULL≠NULL rompería el
  // @@unique para ciclos ANNUAL (dos ANNUAL del mismo año serían
  // duplicables silenciosamente si quedaran en NULL)

  assignmentWindow  DateTime @map("assignment_window")
  trackingWindow    DateTime @map("tracking_window")
  closureWindow     DateTime @map("closure_window")   // fecha SUGERIDA, editable

  status          GoalCycleStatus @default(PLANNING)

  requiresClosure   Boolean @default(true) @map("requires_closure")
  lockAfterClosure  Boolean @default(true) @map("lock_after_closure")
  // lockAfterClosure se ata a status===CLOSED, NUNCA a CLOSING
  // (el modal de cierre de Gate D escribe sobre metas mientras el ciclo
  // está en CLOSING — atarlo a CLOSING congelaría el propio flujo de cierre)

  // Conexión OPCIONAL con Performance (no acopla). SIN UI ni flujo en
  // ningún gate — campo preparado para el futuro. Code NO debe preguntar
  // por su seteo, no es parte del alcance de este proyecto.
  linkedPerformanceCycleId String? @map("linked_performance_cycle_id")

  closedAt        DateTime? @map("closed_at")
  closedBy        String?   @map("closed_by")

  closureWindowUpdatedAt DateTime? @map("closure_window_updated_at")
  closureWindowUpdatedBy String?   @map("closure_window_updated_by")

  createdAt       DateTime @default(now()) @map("created_at")
  createdBy       String?  @map("created_by")

  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  goals           Goal[]

  @@unique([accountId, year, periodType, quarter, semester], map: "unique_account_cycle")
  @@index([accountId])
  @@index([status])
  @@map("goal_cycles")
}

enum GoalPeriodType {
  QUARTERLY
  SEMESTER
  ANNUAL
}

enum GoalCycleStatus {
  PLANNING    // definiendo, aún no activo — SIN restricción de creación
  ASSIGNING   // cascadeando metas
  ACTIVE      // seguimiento en curso — 1 solo por cuenta (candado §3.1)
  CLOSING     // aplicando decisiones del modal de cierre (Gate D)
  CLOSED      // cerrado — lockAfterClosure se activa desde aquí
}

// Goal — agregar:
//   goalCycleId String? @map("goal_cycle_id")
//   goalCycle   GoalCycle? @relation(fields: [goalCycleId], references: [id])
// CONFIRMADO Gate 0: Goal NO tiene este campo hoy. Sin colisión.

// Account — agregar relación inversa:
//   goalCycles GoalCycle[]
// CONFIRMADO Gate 0: Account NO tiene esta relación hoy. Sin colisión.
```

### 3.1 Mecanismo "1 ACTIVE por cuenta" — DECISIÓN FINAL (Gate 0, con evidencia real)

```yaml
HISTORIAL DE LA DECISIÓN (para que quede el razonamiento, no solo el
resultado — útil si alguien pregunta "por qué esto y no un índice"):

1. Se evaluó calcar el patrón de Campaign/PerformanceCycle. Code confirmó
   con evidencia que NINGUNO de los dos garantiza "1 activo por cuenta"
   hoy: Campaign permite N configurable por account.maxActiveCampaigns
   (campaigns/route.ts:377-394, solo valida al CREAR, no al activar);
   PerformanceCycle no tiene NINGÚN enforcement (puede haber ilimitados
   ACTIVE simultáneos). No hay patrón real que copiar — es decisión nueva.

2. Se evaluó índice parcial de Postgres (CREATE UNIQUE INDEX ... WHERE
   status='ACTIVE'). Descartado: Prisma 5.22 (versión del proyecto) no
   soporta índices parciales de forma nativa en el schema — recién se
   agregó como preview feature en Prisma 7.4 (feb 2026, dos versiones
   mayores por delante). Implementarlo en Prisma 5 requeriría DDL crudo
   vía $executeRaw, sin precedente en el repo (todo el $executeRaw
   existente es DML/UPDATE, nunca DDL) y quedaría invisible para
   schema.prisma — riesgo de desincronización real, no solo estético.

3. Se evaluó el riesgo real de concurrencia: activar un ciclo es una
   acción manual, de un solo estratega, 1-2 veces al año. El escenario
   real no es "20 requests compitiendo", es doble clic accidental o
   retry de red — un solo usuario, milisegundos de diferencia.

4. DECISIÓN FINAL: candado de aplicación transaccional
   (pg_advisory_xact_lock), NO índice parcial, NO count-en-código simple.

MECANISMO:

await prisma.$transaction(async (tx) => {
  // Candado lógico namespaced por cuenta. No toca ninguna fila real
  // (no hay contención con account.update de settings/admin/salary).
  // Se libera solo al terminar la transacción, sin código de liberación.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${accountId}))`;

  const active = await tx.goalCycle.findFirst({
    where: { accountId, status: { in: ['ACTIVE', 'CLOSING'] } },
    select: { id: true },
  });
  if (active) throw new GoalCycleActiveError(); // → 409 limpio

  await tx.goalCycle.update({ where: { id }, data: { status: 'ACTIVE' } });
});

POR QUÉ ESTE MECANISMO Y NO OTRO:
  - Elimina la carrera del todo (no la hace "menos probable" — la segunda
    activación espera en fila, y cuando le toca ya ve el ciclo activo).
  - Cero deuda de schema: no crea DDL, no desincroniza schema.prisma.
  - Reutiliza precedente real: $queryRaw ya se usa en 8 sitios del repo
    (AuthorizationService.ts:34 es el más citado). La única novedad es
    envolver check+write en $transaction con lock — upgrade menor sobre
    un patrón ya validado, no una técnica nueva para el repo.
  - hashtext(accountId) puede en teoría colisionar entre dos cuentas
    distintas (probabilidad extremadamente baja) — en el peor caso, dos
    cuentas se harían esperar unos milisegundos sin necesidad. El chequeo
    real (filtrado por accountId en el where) sigue siendo correcto en
    todos los casos. No requiere mitigación a la escala actual.

ALCANCE DEL CANDADO — confirmado con Victor:
  El check es status IN ('ACTIVE', 'CLOSING') — NO permite activar un
  ciclo nuevo mientras el anterior sigue en CLOSING. Debe llegar a CLOSED
  primero. Esto es consistente con cómo resolveActiveCycle (Gate B.6,
  GoalsAggregationService.ts:244) ya trata ACTIVE y CLOSING como "vigente"
  para efectos de agregación.

ÍNDICE PARCIAL — degradado a "no se implementa por ahora":
  Sigue siendo la única garantía independiente del camino de escritura
  (protegería contra un endpoint/script futuro que no pase por
  GoalCycleService). Se evalúa agregar SOLO si aparece evidencia real de
  un camino que bypasee el servicio. No se construye preventivamente.

NOTA DE ROADMAP (no urgente, no parte de este proyecto):
  Evaluar migración a Prisma 7+ en algún momento futuro para poder usar
  índices parciales nativos en este y futuros casos similares (Sucesión,
  Compensación, cualquier "singleton activo por cuenta" que aparezca).
```

### 3.2 Patrón reutilizable — "Singleton Activo por Cuenta"

```yaml
Este mecanismo (candado de aplicación vía pg_advisory_xact_lock namespaced
por accountId, dentro de una $transaction, chequeo de estado antes de
escribir) queda documentado como el patrón estándar de FocalizaHR para
cualquier futuro caso de "solo 1 X activo por cuenta" — Sucesión,
Compensación, o cualquier producto nuevo con la misma necesidad.

NO copiar el patrón de Campaign (count-en-código sin lock) para casos
donde la corrección del sistema dependa de que el singleton sea real
(como en GoalCycle, donde resolveActiveCycle y toda la agregación asumen
exactamente uno). Campaign es aceptable para cuotas blandas de UX; no lo
es para invariantes de integridad de datos.
```

### 3.3 ⚠️ periodYear/periodQuarter vs goalCycleId (dos fuentes de verdad) — CONFIRMADO

```yaml
CONFIRMADO EN GATE 0 CON EVIDENCIA REAL (GoalsAggregationService.ts):
  periodYear/periodQuarter = FUENTE DE VERDAD de vigencia TEMPORAL.
    El universo de empleados se filtra por startDate<=periodEnd AND
    dueDate>=periodStart (líneas 52-53). NO por period/quarter, NO por ciclo.
  goalCycleId = CONTEXTO de GOBERNANZA, resuelto DESPUÉS del universo
    (línea 63) y persistido solo como columna de contexto en el upsert
    (líneas 149/165). No entra en ningún WHERE que defina qué se agrega.

  → Confirmado: NO hay dos fuentes de verdad. Son ortogonales. El cron
    sellado (Gate A/B/B.6 de EmployeeGoalsInsight) no se toca ni se rompe.
```

---

## 4. GATES

### 4.0 Secuencia de rollout (evita romper producción)

```yaml
PROBLEMA: si el bloqueo "sin ciclo → no hay metas" (Decisión 5) se activa
antes de que exista UI para crear ciclos + migración retroactiva, cualquier
cuenta con metas (incluida cmfgedx7b..., 50 empleados) queda bloqueada sin
forma de destrabarse.

SOLUCIÓN — el bloqueo es lo ÚLTIMO que se activa:
  Gate A     → schema (goalCycleId nullable, metas viejas siguen con null)
  Gate A.5   → migración retroactiva (crea GoalCycle por (accountId, año)
               con metas huérfanas + asocia esas metas)
  Gate B     → GoalCycleService + herencia + candado de singleton +
               resolveActiveCycle conectado (SIN bloqueo todavía)
  Gate C     → APIs (incluye crear/activar/cerrar ciclo)
  Gate D     → UI de ciclos + modal de cierre + confirmación de activar +
               wizard sin selector de año
  Gate E     → ACTIVAR el bloqueo "sin ciclo → error" (solo cuando YA hay
               UI + migración ejecutada)

Entre Gate A y Gate E, crear meta SIN ciclo NO se bloquea.
```

### GATE 0 — CERRADO ✅

```yaml
Los 8 prompts de investigación read-only fueron ejecutados por Code y
validados contra la spec. Hallazgos clave (todos con file:line real):

1. Patrón de estados: mapa de transiciones + guard 400, inline en
   performance-cycles/[id]/route.ts:177-192 (no hay servicio extraído).
   Se calca la FORMA en GoalCycleService, no los nombres de estado.

2. Sin colisiones: Goal NO tiene goalCycleId (solo EmployeeGoalsInsight
   lo tiene). Account NO tiene relación goalCycles. Gate A agrega ambos
   limpio.

3. Wizard (StepSetDates.tsx): selección manual de year/quarter vía
   selects + fechas libres. Confirma alcance exacto de Gate D.

4. UI de PerformanceCycle: sin componente/servicio extraído, acoplado a
   Performance. Gate D construye desde cero con .fhr-*.

5. Índice parcial: sin precedente de DDL en el repo (solo DML). Ver §3.1
   para la decisión final (candado de aplicación, no índice).

6. resolveActiveCycle: confirmado exacto en GoalsAggregationService.ts,
   cast (prisma as any) en línea 241, estados esperados ACTIVE/CLOSING en
   línea 244, try/catch defensivo en líneas 251-253 (a eliminar en Gate B).

7. Fuente de verdad temporal: confirmada ortogonalidad (ver §3.3).

8. Enforcement lockAfterClosure: GoalsService.updateProgress:188 sin
   guard hoy. Punto de atadura confirmado. Debe atarse a GoalCycle.status
   ===CLOSED, nunca a Goal.status (que no tiene estado CLOSED, solo
   COMPLETED) ni a CLOSING.

9. Patrón "1 activo por cuenta": NO existe en la plataforma (ni Campaign
   ni PerformanceCycle lo garantizan realmente). Decisión nueva, resuelta
   en §3.1 con candado de aplicación transaccional.

Ninguna duda de arquitectura pendiente de este gate. Listo para Gate A.
```

### GATE A — Schema — ✅ SELLADO

```yaml
COMMIT: 1246cd8 (main) — "feat(goals): modelo GoalCycle + enums + colisiones — Gate A"
  1 archivo, 76 inserciones (solo prisma/schema.prisma)

SMOKE (prisma/scripts/smoke-goal-cycle-gateA.ts, untracked, re-ejecutable):
  S1 — constraint de período: P2002 en unique_goal_cycle_period confirmado.
       Target del error incluye quarter/semester=0 → confirma que el
       default protege el constraint, no que dependía de NULL.
  S2 — asociación: 3 metas reales de cmfgedx7b... vinculadas, include:
       { goalCycle } devolvió el vínculo correcto.
  Cleanup: por id exacto en $transaction — 3 metas revertidas a null +
       ciclo de prueba borrado. Sin residuo en la base real.

PENDIENTE: push a origin/main (Victor, manual, como siempre).

ALCANCE:
  - Modelo GoalCycle + enums (GoalPeriodType, GoalCycleStatus)
  - quarter/semester Int @default(0) — NO nullable
  - Goal.goalCycleId NULLABLE + relación
  - Account.goalCycles + GoalCycle.goals (inversas)
  - NO incluir aquí el candado de singleton (eso es Gate B, es lógica de
    servicio, no de schema)

CLASIFICACIÓN:
  🟢 REUTILIZA: bloque período (calca EmployeeGoalsInsight), enums estado
  🟡 ADAPTA: ventanas de metas
  🔴 NUEVO: GoalCycle, primer contenedor de período de Metas

SMOKE:
  - Stop node → db push → generate → tsc --noEmit
  - Crear GoalCycle ANNUAL → intentar crear OTRO ANNUAL mismo año/cuenta
    → DEBE fallar (verifica que default 0 protege, no NULL)
  - Asociar 2-3 metas existentes (goalCycleId)
  - NO se prueba 1-ACTIVE en este gate (el candado vive en el service,
    Gate B)

SELLO: commit schema
```

### GATE A.5 — Migración retroactiva — ✅ SELLADO

```yaml
COMMIT: 529353e (script) + 4d60789 (doc maestro)

ALCANCE REAL (con decisiones A-D confirmadas durante Gate A.5, distinto
del diseño inicial de esta sección — corregido aquí para que el archivo
refleje lo que de verdad se construyó):

  Script idempotente: prisma/scripts/migrate-goal-cycle-retroactive.ts
  (versionado, a diferencia del smoke que queda untracked).

  Para cada accountId con metas SIN goalCycleId, agrupar por periodYear
  (NO todo el historial en un solo ciclo):

  Para cada (accountId, periodYear) con metas huérfanas:
    referenceYear = inyectable (default: año en curso)
    status:
      year === referenceYear → ACTIVE
      year <  referenceYear  → CLOSED
      year >  referenceYear  → PLANNING   [Decisión A]
    name:
      ACTIVE            → "Ciclo Vigente {year}"
      CLOSED | PLANNING → "Ciclo {year}"  [Decisión C — "Vigente" no
        tiene sentido en un ciclo cerrado o que aún no empieza]
    assignmentWindow = MIN(startDate) de las metas huérfanas de ESE año
    closureWindow    = MAX(dueDate) de las metas huérfanas de ESE año
      (SIN recortar a 31-dic — refleja la ventana real aunque cruce año
      calendario; confirmado explícito, no es bug)
    trackingWindow   = punto medio entre assignment y closure
    periodType=ANNUAL, quarter=0, semester=0
    createdBy='system-retroactive-migration'
    Auditoría [Decisión B]: si status===CLOSED →
      closedBy='system-retroactive-migration', closedAt=closureWindow
      (deja rastro de que fue el sistema, no una persona, quien cerró)
    Asociar SOLO las metas de ese (accountId, periodYear) a ese ciclo

  Guarda de seguridad "1 ACTIVE" (defensiva): antes de crear un ciclo
  ACTIVE, si la cuenta ya tiene otro GoalCycle ACTIVE, aborta ese grupo
  con warning (la migración escribe status directo, sin pasar por el
  advisory lock de activate() — protege cuando se extienda a otras
  cuentas con ciclos ya activados manualmente).

  Dry-run por defecto (imprime tabla sin escribir); --apply persiste;
  --account=<id> acota el alcance [Decisión D — primera corrida real
  SOLO sobre cmfgedx7b..., resto de cuentas diferido a decisión futura].

IDEMPOTENCIA (doble):
  - No duplicar ciclo: findFirst por unique key, reusa si existe.
  - No re-asociar: updateMany solo sobre goalCycleId=null.

SMOKE:
  - Diagnóstico previo: cmfgedx7b... tenía 1 solo periodYear (2026) en
    sus 211 metas huérfanas — smoke real prueba caso single-year.
  - Smoke sintético aparte (2 años inexistentes 2019/2020, fixture
    aislada, no toca las 211 metas reales): probó AMBAS ramas
    (ACTIVE/CLOSED) + idempotencia + ventanas por año correctas.
  - Apply real sobre cmfgedx7b...: 1 ciclo "Ciclo Vigente 2026" ACTIVE
    creado, 211 metas asociadas, 0 huérfanas remanentes, getActiveCycle
    confirma el ciclo correcto.

RESULTADO EN cmfgedx7b00012413i92048wl:
  1 GoalCycle: "Ciclo Vigente 2026", ACTIVE, 211 metas asociadas,
  assignmentWindow=2026-01-16, closureWindow=2027-12-10 (cruza año,
  MAX dueDate real), trackingWindow≈2026-12-28.

RESTO DE CUENTAS: diferido — no se ha corrido --apply sin --account
  todavía. Pendiente decisión de extender cuando Gate B/C/D estén listos.
```

### GATE B — GoalCycleService + candado de singleton + herencia — ✅ SELLADO

```yaml
COMMIT: efc693a (GoalCycleService) + a125250 (doc maestro) + 56527f4 (herencia,
  cierre del vacío #1) + commit de este cierre (spec + maestro)
ESTADO: COMPLETO. Los 2 vacíos de la auditoría posterior fueron cerrados/
  reconciliados — ver "CIERRE DE VACÍOS" al final de esta sección.

ALCANCE REAL IMPLEMENTADO:
  - GoalCycleService.ts (src/lib/services/, junto a GoalsService.ts):
    * Errores de dominio: GoalCycleActiveError (409), GoalCycleClosedError,
      GoalCycleValidationError
    * normalizePeriodFields() — privado, valida quarter/semester por
      periodType
    * createCycle() — PLANNING, SIN restricción de singleton. Valida
      closureWindow > assignmentWindow.
    * activate() — el candado:
        $transaction + tx.$executeRaw`SELECT pg_advisory_xact_lock(...)`
        (NO $queryRaw como decía el diseño original — pg_advisory_xact_lock
        retorna void, Prisma no puede deserializarlo con $queryRaw. Mismo
        mecanismo de candado, ajuste de sintaxis, no de diseño)
        check: status IN ('ACTIVE','CLOSING') excluyendo el propio id
        → 409 si existe
        Guard de estado-fuente: solo activa desde PLANNING/ASSIGNING
    * closeCycle() — status → CLOSING (NO directo a CLOSED).
        Guard: solo cierra desde ACTIVE.
    * finalizeCycle(cycleId, closedBy?) — CLOSING → CLOSED, setea
      closedAt/closedBy. [MÉTODO AGREGADO durante Gate B — Code detectó
      que sin él, CLOSED es inalcanzable y el guard de lockAfterClosure
      queda muerto. El diseño original de esta spec NO lo tenía separado;
      esta es la corrección real.]
        Guard: solo finaliza desde CLOSING.
    * getActiveCycle(accountId) — ciclo ACTIVE o null.
  - Conectado resolveActiveCycle en GoalsAggregationService.ts:241 →
    GoalCycleService.getActiveCycle(accountId). ELIMINADO el any F4 y
    el try/catch defensivo. [Nota: se perdió el filtro de ventana de
    fechas que tenía el método viejo — aceptado, solo afecta backfills
    manuales con ?period= de un mes histórico, no el cron normal.]
  - Enforcement lockAfterClosure en GoalsService.updateProgress:188:
    guard atado a GoalCycle.status==='CLOSED' (nunca CLOSING, nunca
    Goal.status). Confirmado con smoke en ambos sentidos.

SMOKE (prisma/scripts/smoke-goal-cycle-gateB.ts, cuenta sintética
aislada — cmfgedx7b... ya tenía un ACTIVE de A.5, hubiera bloqueado
el candado):
  ✅ 2 ciclos en PLANNING simultáneos → sin restricción
  ✅ PLANNING nunca dispara el candado (getActiveCycle null)
  ✅ activate(A) → ACTIVE
  ✅ activate(B) con A ACTIVE → 409 GOAL_CYCLE_ALREADY_ACTIVE
  ✅ closeCycle(A) → CLOSING, B sigue bloqueado (CLOSING cuenta)
  ✅ finalizeCycle(A) → CLOSED, closedAt/closedBy poblados
  ✅ activate(B) tras A CLOSED → OK
  ✅ lockAfterClosure: updateProgress en meta de ciclo CLOSED →
     rechazado; en ciclo ACTIVE → permitido
  ✅ tsc --noEmit limpio, npm run build limpio

✅ CIERRE DE VACÍOS (auditoría posterior — ambos resueltos):

  1. HERENCIA AUTOMÁTICA (Decisión de Negocio #4) — CERRADO en 56527f4.
     Helper compartido resolveInheritedCycleId(accountId) =
     GoalCycleService.getActiveCycle(accountId)?.id ?? null, cableado en los
     CUATRO puntos de creación de Goal en GoalsService.ts: createCorporateGoal,
     cascadeGoal, createManagerGoal y createFromDevelopmentGoal.
     El 4º (createFromDevelopmentGoal) se incluyó pese a estar fuera del scope
     literal de esta spec: sin goalCycleId, una meta derivada de PDI bypasearía
     por completo el guard de lockAfterClosure (que solo actúa si goalCycleId !=
     null) — inconsistente con el resto de metas.
     Smoke smoke-goal-cycle-inheritance.ts (UNTRACKED, cadena PDI completa
     Department→Employee→PerformanceCycle→DevelopmentPlan→DevelopmentGoal, 2
     cuentas sintéticas) VERDE: los 4 métodos heredan el ciclo ACTIVE (cuenta X)
     y caen a null sin ciclo activo (cuenta Y).

  2. updateClosureWindow() — CORRECCIÓN DE LA AUDITORÍA (no era un vacío).
     NO estaba ausente: ya existía y estaba commiteado en efc693a
     (GoalCycleService.ts, Gate B), con la firma
     (cycleId, newClosureWindow, updatedBy) → actualiza closureWindow +
     closureWindowUpdatedAt/By. La auditoría anterior lo reportó erróneamente
     como faltante. No requirió código nuevo; se documenta esta corrección de
     forma explícita para no arrastrar el error en versiones futuras de la spec.
```

### GATE C — APIs — ✅ SELLADO

```yaml
COMMIT: 874e4aa (código) + commit de este sello (spec + maestro)

ALCANCE REAL IMPLEMENTADO:
  5 endpoints REST bajo /api/goals/cycles (thin HTTP sobre GoalCycleService):
    GET  /cycles            → lista PAGINADA (page/limit, pagination{}) scoped accountId
    POST /cycles            → crear (PLANNING, sin singleton, accountId del contexto)
    GET  /cycles/[id]       → detalle (scoped accountId)
    PATCH /cycles/[id]      → updateClosureWindow (con auditoría)
    POST /cycles/[id]/activate  → GoalCycleService.activate (candado advisory lock)
    POST /cycles/[id]/close     → closeCycle (→ CLOSING)
    POST /cycles/[id]/finalize  → finalizeCycle (→ CLOSED)  [SEPARADO de close]

  DECISIÓN close vs finalize: SEPARADOS. El estado CLOSING es donde opera el modal
  de cierre (Decisión #8, Gate D); combinarlos colapsaría CLOSING. La spec Gate C
  original solo listó close — finalize se agrega acá (transición real, thin en C;
  la lógica de decisiones sobre metas incompletas vive en Gate D).

  RBAC: permiso NUEVO 'goals:cycles:manage' = [FOCALIZAHR_ADMIN, ACCOUNT_OWNER,
  HR_ADMIN, CEO] (estrategas, Decisión #1; HR_MANAGER excluido). Aplica a las 7
  operaciones (incluye GET — superficie admin). Ver nota en Gate D: el wizard de
  colaborador necesitará un GET liviano sin este permiso.

  MULTI-TENANT: accountId SIEMPRE del contexto (extractUserContext), nunca del
  body/params. Los métodos del servicio NO filtran por accountId, así que cada
  ruta [id] verifica ownership (findFirst id+accountId → 404) ANTES del servicio.
  Un id de otra cuenta → 404 (ni 200 ni 403).

  MAPEO errores de dominio → HTTP (src/lib/api/goalCycleErrorResponse.ts):
    GoalCycleActiveError → 409 GOAL_CYCLE_ALREADY_ACTIVE ·
    GoalCycleClosedError → 409 GOAL_CYCLE_CLOSED ·
    GoalCycleValidationError → 400 GOAL_CYCLE_VALIDATION ·
    P2002 → 409 GOAL_CYCLE_PERIOD_EXISTS

SMOKE (prisma/scripts/smoke-goal-cycle-gateC.ts, UNTRACKED, handlers invocados
directo con NextRequest mockeado, 2 cuentas sintéticas, cleanup por id) VERDE:
  401 sin x-account-id · 403 no-estratega (HR_OPERATOR) · 201 crear/PLANNING ·
  409 duplicado período · paginación { total, pages } · candado 409 (con ACTIVE
  y con CLOSING) · close→finalize→activate · PATCH con closureWindowUpdatedBy ·
  multi-tenant: GET/activate ciclo de otra cuenta → 404.
  tsc --noEmit + npm run build OK.

──────────────────────────────────────────────────────────────────────────────
ALCANCE (diseño original, referencia):
  - /api/goals/cycles/route.ts (GET lista, POST crear — sin restricción)
  - /api/goals/cycles/[id]/route.ts (GET, PATCH estado/ventanas)
  - /api/goals/cycles/[id]/activate/route.ts (POST — pasa por el candado)
  - /api/goals/cycles/[id]/close/route.ts (POST cierre manual)
  - RBAC: solo estrategas (permiso 'goals:cycles:manage' — agregar a
    AuthorizationService si Gate 0 confirma que no existe)

REGLAS ENTERPRISE:
  1. Multi-tenant: accountId en toda query
  2. RBAC: hasPermission antes de operar, sin arrays hardcodeados

SMOKE:
  - POST crear (estratega) → 200 · (no-estratega) → 403
  - POST activar con otro ya ACTIVE → 409 limpio
  - POST cerrar → transición completa CLOSING → CLOSED
  - GET scoped: cuenta A no ve ciclos de cuenta B

SELLO: commit APIs
```

### GATE D — UI + modal de cierre + confirmación de activar

```yaml
SUB-PASOS (acordados, verificables uno a uno como Gate B):
  D.1 GET liviano "ciclo activo" (sin RBAC estratega)   ← SELLADO ✅ (c388f56)
  D.2 Página /admin/metas/ciclos (lista, read-only)
  D.3 Crear ciclo (fricción mínima)
  D.4 Activar (confirmación intencional + anti-doble-submit)
  D.5 Modal de cierre (Decisión #8)  ← BACKEND SELLADO ✅ · UI pendiente
  D.6 Wizard crear-meta: quitar selector de año, mostrar ciclo heredado
  D.7 Alerta closureWindow próxima
```

### GATE D.1 — GET ciclo activo (liviano) — ✅ SELLADO

```yaml
COMMIT: c388f56

GET /api/goals/cycles/active — devuelve el ciclo ACTIVE de la cuenta (o null)
con payload liviano {id, name, status}. RBAC goals:view (NO goals:cycles:manage
— para que el wizard de crear-meta de un colaborador AREA_MANAGER/EVALUATOR
muestre el ciclo heredado sin la superficie admin). Multi-tenant por contexto.
Reusa GoalCycleService.getActiveCycle. Ruta estática hermana de [id]/ (Next da
precedencia a 'active' sobre el dinámico → sin colisión).

SMOKE (untracked, borrado al sello): 401 sin contexto · 403 HR_OPERATOR (sin
goals:view) · 200 data null sin ACTIVE · 200 con ACTIVE payload liviano. VERDE.
tsc + build limpios. Lo consumirá D.6 (wizard).
```

### GATE D.5 (BACKEND) — decisiones de cierre de ciclo — ✅ SELLADO

```yaml
COMMIT: a90c051 (código) + commit de este sello (spec + maestro)

CONTEXTO (verificado con Code, file:line):
  - "Solicitar Cierre" de producción va por la RUTA request-closure/route.ts
    (lógica inline), NO por GoalsService.requestClosure (método paralelo).
  - PENDING_CLOSURE es valor del enum GoalStatus (schema:3062) + columnas
    closureRequestedAt/By en Goal. NO tabla/campo nuevo.
  - pending-closure/route.ts filtra por status='PENDING_CLOSURE' + scope del
    APROBADOR; closureRequestedBy NO entra en el WHERE → una meta marcada por
    el estratega aparece igual en la bandeja del manager (verificado).
  - approveClosure exige status='PENDING_CLOSURE' (:790) → NO sirve para cerrar
    una meta no-pendiente. Por eso CLOSE_WITH_SCORE es escritura directa.
  - approveClosure NO tiene efectos ocultos: 1 solo update, NO recalcula
    accumulatedGoals (eso vive solo en GoalsAggregationService/cron).
  - GET /api/goals NO filtraba por goalCycleId (params en route.ts:78-146).

DECISIÓN #8 → 3 baldes (semántica confirmada por Victor, Gate D.5a):
  CLOSE_WITH_SCORE → COMPLETED, escritura directa (NO approveClosure).
    closureApprovedBy=null + closureNotes explícito de "cierre forzado por
    cierre de ciclo" (no parece "el estratega se aprobó a sí mismo").
  MARK_REVIEW     → PENDING_CLOSURE (mismo end-state que requestClosure, sin
    campo nuevo; cae en la bandeja de aprobación existente).
  LEAVE_AS_IS     → no-op (la meta es soberana; el lock se ata a GoalCycle).

DECISIÓN DE ESCALA (dimensionada con dato real): la cuenta piloto tiene 182
  metas incompletas hoy. Un loop per-meta (requestClosure ×182) revienta el
  timeout de $transaction de Prisma (5s) y roza el maxDuration de Vercel Hobby.
  → Se resuelve en BULK: buckets homogéneos con updateMany/createMany, ~5
    statements totales sea con 182 o 2.000 metas. Una sola $transaction segura.
  DESVIACIÓN vs Gate D.5a: MARK_REVIEW ya NO llama a requestClosure() per-meta;
  usa updateMany masivo (mismo end-state). El guard per-meta de requestClosure
  se reemplaza por la validación server-side del set accionable.

IMPLEMENTADO:
  - GoalsService.applyCycleClosureDecisions(tx, {...}) — tx-aware:
    1. Set accionable REAL server-side (findMany accountId+goalCycleId,
       status notIn COMPLETED/CANCELLED/PENDING_CLOSURE).
    2. Validación TODO-O-NADA: cada goalId de decisions[] debe estar en el set;
       un id fuera (cuenta/ciclo/estado) o duplicado → GoalCycleValidationError,
       se rechaza TODA la operación (no filtrado silencioso).
    3. updateMany por balde con accountId+goalCycleId SIEMPRE en el where
       (defensa en profundidad) + assert count===bucket.length (corta carreras:
       si una meta cambió de estado entremedio, aborta la transacción).
    4. Auditoría createMany (CLOSE_WITH_SCORE ∪ MARK_REVIEW; LEAVE_AS_IS no) con
       accountId poblado por fila (regla enterprise #1). previous*===new* (el
       cierre congela el valor). timestamp único para todos los writes.
  - GoalCycleService.finalizeCycleWithDecisions(cycleId, accountId, decisions,
    actor) — pre-check CLOSING fuera de tx + $transaction única (decisiones +
    transición CLOSING→CLOSED) + re-verificación de CLOSING dentro de la tx.
    Devuelve { cycle, summary }. Si algo falla → rollback, ciclo sigue CLOSING
    (reanudable). finalizeCycle puro (Gate C) queda intacto.
  - GET /api/goals: filtro opcional goalCycleId (reusa RBAC/filtrado jerárquico).
  - POST /finalize: parseo opcional decisions[] (zod). Sin body/vacío →
    finalizeCycle puro (backward-compatible). Con decisiones → busca el fullName
    del estratega (x-user-email) para la nota de auditoría y llama al servicio.

SMOKE (prisma/scripts/smoke-goal-cycle-gateD5.ts — untracked, borrado al sello
  full de D.5): T1 rechazo meta no-accionable + rollback (ciclo sigue CLOSING,
  0 auditoría) · T2 duplicado · T3 cross-account · T4 happy 3 baldes (COMPLETED
  closureApprovedBy null + nota forzado / PENDING_CLOSURE / sin cambio; 2 filas
  de auditoría con accountId; summary 1/1/1) · T5 lock post-CLOSED
  (updateProgress → GOAL_CYCLE_CLOSED) · T6 no re-finalize. VERDE.
  tsc --noEmit + npm run build limpios.

GUARD lockAfterClosure — decisión de negocio (Victor, Gate D.5a):
  approveClosure/rejectClosure NO llevan el guard de GoalCycle.status===CLOSED
  (a propósito, para que MARK_REVIEW funcione tras el cierre del ciclo). Si una
  meta marcada se rechaza tras CLOSED, su status visible cambia por %, pero
  updateProgress sigue bloqueado (guard Gate B intacto). No se agrega excepción.

NOTAS PARA LA UI (Acto 3, pendientes en D.5-UI):
  - Distinguir en el mensaje el rechazo por "metas cambiaron de estado con el
    modal abierto" (código GOAL_CYCLE_VALIDATION) de un error genérico.
  - Botón "Cerrar ciclo en firme" con deshabilitar-al-primer-clic (consistencia
    con Activar), sobre todo en el caso extremo sin metas que decidir.

BACKLOG SEPARADO (NO de GoalCycle, registrado aparte): 2 hallazgos del sistema
  de rechazo de metas existente — (a) falta notificación activa al rechazar,
  (b) inconsistencia de buckets de % al revertir estado entre
  GoalsService.rejectClosure y approve-closure/route.ts.
```

──────────────────────────────────────────────────────────────────────────────
ALCANCE (diseño original Gate D — referencia):

```yaml
ALCANCE:
  - Página /admin/metas/ciclos (lista, crear, activar, cerrar)
  - CREAR: fricción mínima (sin confirmación pesada — es reversible,
    status PLANNING)
  - ACTIVAR: fricción proporcional a la consecuencia (Decisión 11/12):
    * Paso de revisión: "Vas a activar el ciclo Q1-2026. Será el único
      activo hasta su cierre. Las metas nuevas quedarán ancladas a este
      período."
    * Botón deshabilitado al primer clic (evita doble-submit mecánico)
    * Confirmación explícita antes de disparar la request
  - MODAL DE CIERRE (Decisión 8): al iniciar el cierre (→ CLOSING),
    muestra metas NO completadas. Estratega decide (por meta o en bloque):
      cerrar con score actual / dejar en su estado / marcar para revisión
    Solo cuando todas las decisiones están aplicadas, dispara CLOSING→CLOSED
  - Modificar wizard crear-meta: quitar selector de año, mostrar
    "Ciclo: [nombre]" como contexto heredado
  - ⚠️ PENDIENTE (anotado en Gate C): hace falta un endpoint de LECTURA
    liviano del ciclo ACTIVE, SIN RBAC de estratega (solo sesión válida),
    para que el wizard crear-meta muestre el nombre del ciclo heredado a
    CUALQUIER empleado. Gate C dejó /api/goals/cycles gateado con
    goals:cycles:manage (superficie admin /admin/metas/ciclos) — ese permiso
    NO alcanza para el wizard de un colaborador (AREA_MANAGER/EVALUATOR/etc.).
    NO se construyó en Gate C a propósito; queda escrito acá para no perderlo.
  - Alerta de closureWindow próxima

DISEÑO (MANIFIESTO_v5): .fhr-* · narrativa protagonista · sin semáforo primario

SMOKE:
  - Crear ciclo desde UI (con otro ya ACTIVE) → permitido, queda PLANNING
  - Activar → revisión → confirmación → ACTIVE
  - Crear meta → hereda ciclo (sin pedir año)
  - Cerrar ciclo → modal → decisiones → CLOSING → CLOSED

SELLO: commit UI
```

### GATE E — Activar BLOQUEO sin ciclo (ÚLTIMO)

```yaml
ALCANCE:
  - Activar "crear meta sin ciclo ACTIVE → error claro"
  - Solo DESPUÉS de Gate D sellado + migración A.5 ejecutada

SMOKE:
  - Cuenta CON ciclo activo → crea meta OK
  - Cuenta SIN ciclo activo → BLOQUEA con mensaje claro
  - Cuentas migradas (A.5) → NO se bloquean

SELLO: commit guard de bloqueo

⚠️ PRECONDICIÓN: Gate D sellado + migración A.5 ejecutada.
   NO sellar si alguna cuenta con metas quedó sin ciclo.
```

---

## 5. DEPENDENCIAS

```yaml
CON Gate F (comunicaciones de Metas):
  Necesita assignmentWindow/trackingWindow/closureWindow como disparadores.
  GoalCycle debe existir (Gate A+B) antes de Gate F.

CON EmployeeGoalsInsight (sellado):
  Gate B conecta el ciclo real, elimina el any F4.

CON Panel Personal (SPEC_PANEL_PERSONAL_METAS_v2):
  Independiente, no bloquea.
```

## 6. FECHAS PARA Gate F (comunicaciones)

```yaml
┌──────────────────────────┬──────────────┬──────────────────────────┐
│ Evento                   │ A quién      │ Disparador               │
├──────────────────────────┼──────────────┼──────────────────────────┤
│ Ciclo abierto            │ Todos        │ status → ACTIVE          │
│ Meta asignada            │ Colaborador  │ cascadeo/creación        │
│ Recordatorio seguimiento │ Colaborador  │ trackingWindow           │
│ Recordatorio cierre      │ Estratega    │ closureWindow            │
│ Solicitud cierre meta    │ Jefe         │ requestClosure           │
│ Cierre aprobado/rechazado│ Colaborador  │ approve/rejectClosure    │
│ Ciclo cerrado            │ Todos        │ status → CLOSED (manual) │
└──────────────────────────┴──────────────┴──────────────────────────┘
```

---

*Spec v4 — Gate 0 cerrado con evidencia real de Code, sin decisiones
pendientes. Lista para Gate A. Próxima actualización: al sellar cada gate,
agregar commit hash + evidencia de smoke a esta misma sección de gates.*
