# Gate 0 — Arquitectura: `Department.responsableId` (transversal)

> **Alcance:** decisión de plataforma, NO específica de Clima. Afecta el patrón
> "¿quién es el responsable de este departamento?" que hoy resuelven Performance,
> Metas, Onboarding, Exit, Compliance y (pendiente) Clima 5C, cada uno a su manera.
> **Estado:** Gate 0 read-only, hechos + tamaño real. **Decisión de alcance = Victor.**
> **Fecha:** 2026-07-11. Verificado contra código real (no supuestos).

---

## 1. ¿Existe hoy un campo "responsable del departamento"? — NO

Modelo completo actual de `Department` (`prisma/schema.prisma:722-817`). Campos relevantes:

- `id`, `accountId` (`723-724`), `displayName` (`725`), `isActive` (`728`)
- **Jerarquía:** `parentId String?` (`758`) + relación self `"DepartmentHierarchy"` (`759-760`);
  `level Int @default(3)` (`762`); `unitType` (`761`); `employeeCount` (`763`)
- Relación inversa `users User[]` (`773`) — inverso de `User.departmentId`
- Relación inversa `employees Employee[]` (`798`)

**No existe** `responsableId`, `managerId`, `leaderId`, `headId`, `ownerId`, `jefeId`
ni equivalente en `Department`. Grep en `prisma/schema.prisma` → **cero coincidencias**.
El "responsable del departamento" **no es un hecho de negocio persistido**.

---

## 2. La jerarquía de walk-up SÍ existe y es sólida

`Department.parentId` (`schema:758`, indexado `@@index([parentId])` línea `814`) es la
jerarquía usada para subir de nivel. Confirmado en 3 walk-ups reales de producción:
- `PerformanceRatingService.ts:1731` — `while (current.parentId && current.level > 2 …)`
- `compliance/report/route.ts:246` — mismo patrón
- `rollupClimaGerencias.ts:152` — sube por `parentId` (agrega scores, no personas)

`Department.level`: 1=holding, 2=gerencia, 3=departamento (convención confirmada en
`PerformanceRatingService.ts:1722-1735`).

---

## 3. Tamaño real del cambio

### 3.a — Inventario COMPLETO de cómo se resuelve hoy "responsable/jefe" (file:line)

Hay **TRES nociones distintas** conviviendo — es peor (más fragmentado) que las 2 que se
conocían. **Ninguna es la misma pregunta**, y ese es el punto clave para dimensionar:

#### Patrón 1 — `User.role='AREA_MANAGER'` + `User.departmentId` (eje plataforma)
El "responsable de plataforma" de un depto. Dos sub-usos MUY distintos:

- **(1a) FILTRADO RBAC — "¿qué puede ver ESTE usuario?"** — usa `userContext.departmentId`
  (el propio depto del usuario logueado), **NO resuelve el responsable de un depto ajeno**.
  Es el patrón `userContext.role === 'AREA_MANAGER' && userContext.departmentId` +
  `getChildDepartmentIds()`. **~40 archivos / 50+ call-sites.** Muestra (no exhaustivo):
  `AuthorizationService.ts:93`; `GoalsService.ts:838,878`; `ExitRegistrationService.ts:533`;
  `goals/route.ts:97,274`; `goals/[id]/route.ts:104`; `goals/pending-closure/route.ts:46`;
  `exit/records/route.ts:85`; `exit/causes/route.ts:486`; `exit/alerts/[id]/route.ts:123,302`;
  `exit/alerts/route.ts:96`; `exit/metrics/route.ts:89`; `clima/results/route.ts:142`;
  `compliance/report/route.ts:153,340`; `compliance/metrics/route.ts:45`;
  `compliance/convergencia/route.ts:132`; `compliance/analizar-patrones/route.ts:142`;
  `calibration/sessions/route.ts:72` (+ratings/adjustments); `admin/employees/route.ts:45`;
  `admin/performance-ratings/route.ts:51`; `admin/performance-cycles/[id]/route.ts:44`;
  `performance/role-fit/route.ts:72`; `performance-ratings/[id]/potential/route.ts:70,236,314`;
  `performance-ratings/nine-box/route.ts:47`; `pdi/[id]/route.ts:80,165`;
  `pdi/by-employee/route.ts:113`; `pdi/goals/[goalId]/route.ts:64`;
  `onboarding/metrics/route.ts:240`; `onboarding/journeys/[id]/route.ts:61`;
  `onboarding/alerts/[id]/route.ts:75`; `succession/critical-positions/route.ts:35`;
  `analytics/nps/route.ts:110`; `talent-actions/*` (stats/quadrant/org-map/pl-summary/isd-feed);
  `descriptors/*` (route/org-tree/simulator-list); `workforce/presupuesto/*` (5 rutas);
  `campaigns/[id]/participants/route.ts:727`; `campaigns/[id]/analytics/route.ts:155,430`.
  → **Estos NO adoptarían `responsableId`**: preguntan "qué veo yo", no "quién manda en X".

- **(1b) RESOLUCIÓN-PARA-NOTIFICAR — "¿a quién le aviso del depto X?"** — el ÚNICO sitio real:
  `talent-actions/mass-action/route.ts:187-207` — `prisma.user.findFirst({ role:'AREA_MANAGER',
  departmentId: gerenciaId, isActive:true })` → fallback `role: { in:['HR_ADMIN','ACCOUNT_OWNER'] }`.
  → **Este SÍ es la pregunta que `responsableId` reemplazaría.**
  - Nota: `role:'AREA_MANAGER'` como literal en `exit/metrics:103`, `exit/alerts:110`,
    `onboarding/metrics:251` son **solo etiquetas de `console.log`**, no resuelven nada.

#### Patrón 2 — `Employee.managerId` (eje persona→persona, self-relation `schema:1791`)
El jefe **de una persona**, no de un departamento. Poblado por import
(`EmployeeSyncService.ts:435,517,885…` vía `resolvedManagerId`). Usos:
- **Resolución-para-actuar (persona):** `EvaluationService.ts:49,72,89` (jefe evalúa
  subordinado, email a `manager.email` línea `122` — sin cuenta de plataforma);
  `clima/pdi-suggestion/route.ts:95`; `pdi/generate-suggestion/route.ts:65,220`;
  `succession/candidates/[id]/create-pdi/route.ts:117,137`.
- **Chequeos de autorización "¿soy YO el jefe directo?":** `pdi/[id]/route.ts:76,162`;
  `pdi/[id]/check-ins/route.ts:63`; `pdi/[id]/change-status/route.ts:53`;
  `goals/[id]/route.ts:130`; `goals/route.ts:121,260`; `goals/team/*`;
  `performance-ratings/[id]/potential/route.ts:94,337`; `succession-plan/route.ts:43`;
  `admin/performance-cycles/[id]/route.ts:55`.
- **Analítica de estructura (span of control, isLeader):** `WorkforceIntelligenceService.ts:466-577`;
  `TalentRiskOrchestrator.ts:145,371`; `SpanIntelligenceService.ts:353,456`;
  `PerformanceTrackValidator.ts:89,343`; `admin/employees/analytics|stats|anomalies`;
  `calibration/managers/route.ts:44`; `auth/me/route.ts:31`.
- **Agrupación "by manager" para narrativa:** `GoalsDiagnosticService.ts` (muchas);
  `ManagerVarianceService.ts:68,114`.
→ **Es otro eje** (persona→persona con tope en cargo, no en rol RBAC). No hay puente
  confirmado Employee↔User (`Employee` sin `userId`, `User` sin `employeeId`).

#### Patrón 3 — `parentId` renombrado a "managerId" (eje depto→depto-padre)
Compliance llama "managerId" al **departamento padre**, no a una persona:
`ComplianceAnalysisOrchestrator.ts:288` (`managerId: deptInfo?.parentId`);
`ConvergenciaEngine.ts:1174` (`managerId: a.department.parentId`);
`ComplianceAlertService.ts:535` (`departmentId: group.managerId // alerta al nivel gerencia`).
→ Tercer significado de "manager": la gerencia (nodo padre), sin persona.

### 3.b — ¿Agregar `Department.responsableId String?` rompe algo? — NO, es puramente aditivo
- Campo nullable, sin default destructivo. El proyecto **no usa migraciones Prisma**; el
  mecanismo es `db push` (dev) + scripts idempotentes en `prisma/scripts/`. Nace `NULL` en
  todos los deptos existentes.
- No colisiona con nada: no hay campo homónimo, no cambia relaciones existentes, no toca
  `parentId`/`level`. Los 3 patrones actuales siguen funcionando intactos (nadie lo lee aún).
- **Decisión de diseño abierta (Victor):** ¿`responsableId` apunta a `User.id` o a `Employee.id`?
  - → `User.id`: coherente con el eje de comunicaciones/RBAC y con `mass-action`; backfill directo.
  - → `Employee.id`: coherente con la jerarquía real de personas (Performance), pero **sin FK a
    User** → un responsable-Employee puede no tener canal/cuenta (mismo problema del Gate 0 previo).

### 3.c — Backfill: SÍ hay dato razonable de dónde inferir (si apunta a User)
Para cuentas en producción, `User` con `role='AREA_MANAGER'` **ya trae `departmentId`**
(`schema:843`, validado obligatorio en `admin/users/route.ts:197` y `[id]/route.ts:142`).
Backfill directo: por cada `User{role:'AREA_MANAGER', isActive:true}` → set
`Department[User.departmentId].responsableId = User.id`. Script idempotente clásico del proyecto.
- Límite honesto: deptos sin AREA_MANAGER asignado quedan `NULL` hasta llenado manual. La
  cobertura del backfill = cuántos deptos tienen hoy un AREA_MANAGER (dato por cuenta, no en repo).
- Si `responsableId → Employee.id`: **no hay backfill limpio** (sin puente User↔Employee;
  habría que casar por email/nombre, frágil). Refuerza que apuntar a `User.id` es lo barato.

### 3.d — Estimado honesto: crear ≠ adoptar

| Fase | Costo | Archivos |
|---|---|---|
| **Crear** el campo + índice + `db push` | Trivial | `schema.prisma` (1) |
| **Backfill** desde AREA_MANAGER | Bajo (1 script idempotente) | `prisma/scripts/*` (1) |
| **Adoptar** en el ÚNICO consumidor de resolución-para-notificar | Bajo | `mass-action/route.ts` (1) |
| **Habilitar** Clima 5C sobre el campo | Es el gate que lo pidió | 5C (nuevo, no migración) |
| **Convergencia total** (opcional, el "sueño Workday") | **Alto y en gran parte inaplicable** | ver abajo |

**El "migrar a todos a una fuente única" es en su mayoría un error de categoría:**
- Los **~40 archivos / 50+ call-sites de RBAC (1a)** responden "qué veo yo", NO "quién manda
  en el depto X" → **no adoptan `responsableId`**. Migrarlos no aporta y es riesgo puro.
- **Performance/PDI/Goals (Patrón 2)** responden "jefe de esta persona" → eje legítimo distinto;
  `responsableId` podría, opcionalmente, volverse la FUENTE que el import usa para derivar
  `Employee.managerId`, pero eso es un proyecto aparte, no una adopción.
- **Compliance (Patrón 3)** ya usa `parentId`; no necesita `responsableId`.

→ **Consumidores que realmente adoptarían hoy: 1 existente (`mass-action`) + 1 nuevo (Clima 5C).**
El resto es opcional y mayormente no-aplica.

---

## 4. Recomendación (mía — NO es decisión tomada)

**Recomiendo agregar `Department.responsableId String?` apuntando a `User.id`, con backfill
desde `User.role='AREA_MANAGER'`, y adoptarlo SOLO en (a) el walk-up de Clima 5C y (b)
`mass-action` como segundo consumidor de validación.** Razones:
1. Es aditivo, barato y reversible; crea la fuente única de verdad que hoy falta.
2. `User.id` es coherente con el eje de comunicaciones (5C no necesita login, pero el
   responsable-User sí garantiza `isActive` + canal) y habilita backfill limpio.
3. Evita el error de categoría: **no** tocar los 50+ sitios RBAC ni Performance — son otra
   pregunta. La convergencia total puede quedar como deuda dirigida, no como prerequisito.
4. Deja el walk-up de 5C (subir por `parentId` buscando `responsableId`, fallback
   HR_ADMIN/ACCOUNT_OWNER) apoyado en un hecho de negocio, no en una heurística por módulo.

**Lo que NO recomiendo:** apuntar a `Employee.id` (sin backfill limpio ni canal garantizado),
ni intentar migrar los consumidores RBAC en este gate.

**Decisiones que quedan explícitamente para Victor:**
- Alcance temporal (ahora vs. después) del campo.
- `responsableId` → `User.id` (recomendado) vs. `Employee.id`.
- Si el backfill AREA_MANAGER→responsable se corre automático o el llenado es 100% manual.

---

## 5. Dependencia con Clima 5C
El walk-up de recordatorio de Clima 5C (subir por `Department.parentId`, tope en el
responsable del depto, fallback HR_ADMIN/ACCOUNT_OWNER) **depende del resultado de este Gate 0**:
- Si se aprueba `responsableId` → 5C lo lee directo (fuente única).
- Si se difiere → 5C resuelve por `User.role='AREA_MANAGER'+departmentId` (patrón `mass-action`),
  asumiendo la deuda hasta que exista el campo.
Ver bitácora: `.claude/tasks/EX_CLIMA_PROGRESS.md` (Gate 5C).

---

## Addendum — sesión de arquitectura (resuelto, no reabrir)

> **Fecha:** 2026-07-11. Cierra las decisiones abiertas de §3.b, §4 y §5. Esta sección
> tiene precedencia sobre la recomendación de §4 donde difieran (§4 recomendaba `User.id`;
> la decisión final es `Employee.id`, por las razones que siguen).

### Decisión final

- **`Department.responsableId → Employee.id`** (NO `User.id`). El responsable de un
  departamento es un **hecho de RRHH**, independiente de si esa persona tiene login o
  cuenta en la plataforma.

- **`Employee.managerId` NO es una fuente débil** ni compite con `responsableId`. Está
  poblado de forma confiable vía **import masivo real de nómina**: `EmployeeSyncService.ts`
  valida "jefes fantasma" pre-carga y resuelve `managerId` en una **segunda pasada por
  `nationalId` (RUT)**, después de crear/actualizar todos los empleados. Ya en uso por
  Performance y Ambiente Sano (`flow_type='employee-based'`). Esto invalida la premisa de
  §3.b/§3.c de que apuntar a `Employee` "no tiene backfill limpio": el eje persona ya está
  poblado con dato real, no heurístico.

- **No hay reconciliación necesaria entre los dos campos** — responden preguntas distintas:
  - `Employee.managerId` = jefe de **UNA PERSONA**.
  - `Department.responsableId` = responsable de **UN DEPARTAMENTO**.

- **El walk-up de `clima_action_reminder` solo consulta `responsableId`** (+ walk-up por
  `Department.parentId` + fallback `Account.adminEmail`), porque **siempre parte de un
  departamento** (`driverFocusByDepartment`, `ActionPlan.targetType='department'`), nunca de
  una persona. **NO toca `Employee.managerId` en ningún punto de su resolución.**

- **Hallazgo aparte — documentar y NO tocar:** `ComplianceAnalysisOrchestrator.ts:288` usa
  el nombre `"managerId"` para referirse al **`parentId` del nodo departamento** (la gerencia
  superior), no a una persona. Es colisión de nombre, no jerarquía de personas real. Se deja
  tal cual, solo anotado aquí para que nadie lo confunda a futuro. (Consistente con el
  "Patrón 3" ya inventariado en §3.a.)

### Backlog Fase 2 (no urgente, no bloquea Gate 1 ni 5C)

1. ✅ **Mantenedor UI** en `/dashboard/admin/accounts/[id]/structure` para asignar/editar
   `Department.responsableId`. **HECHO** (2026-07-31, commits `97bef30` Pieza A +
   `d16f982` Pieza B). Ver §As-built abajo.
2. **A futuro:** columna opcional en la carga de estructura/nómina para que el cliente
   declare el responsable directo, **reusando el patrón de validación ya construido en
   `EmployeeSyncService.ts`** (validación de "jefes fantasma" + resolución por `nationalId`).

### Ejecución del backfill (Gate 1 — decisión NULL-only, 2026-07-11)

El backfill best-effort (`prisma/scripts/backfill-department-responsable.ts`, opción 1:
seed solo cuando hay UN líder claro en el propio depto; empate o cero → NULL) **NO se
corre con `--commit` en Gate 1**. Razón: el dry-run contra la BD de desarrollo dio cobertura
**inmaterial (2/106 deptos, 1.9%)** y **no representativa** — son fixtures de dev (nombres de
líder repetidos entre departamentos, departamentos "TI" duplicados, `managerLevel` NULL en el
100% de los candidatos, empates 87.5% "2+ jefes"). Sobre fixtures el número no predice nada.

**Regla sellada:** el `--commit` real del backfill se corre **contra la PRIMERA cuenta con
datos reales importados por `EmployeeSyncService`** (nómina verdadera: `standardJobLevel` y
jerarquía poblados de forma confiable), **nunca contra fixtures de dev**. El script es
idempotente (solo escribe donde `responsableId` está NULL), así que puede correrse por-cuenta
a medida que cada cliente carga su nómina, sin pisar asignaciones manuales de Fase 2.

**Vínculo — decisión pendiente "Participant loading strategy":** el momento de este `--commit`
está atado a cuándo cada cuenta pasa a nómina real employee-based vía `EmployeeSyncService`
(la misma decisión que gobierna la carga de participantes/empleados reales). Cuando esa
estrategia defina la primera cuenta productiva, ese es el disparador del backfill real.
Hasta entonces: todos los deptos nacen `responsableId = NULL` → el resolver cae a
`Account.adminEmail`. Ver [[project_employee_based_migration_pulso_experiencia]] /
`GUIA_MIGRACION_PRODUCTOS_A_EMPLOYEE_BASED.md`.

---

## As-built Fase 2 punto 1 — Mantenedor UI (2026-07-31)

**Commit A `97bef30`** — mantenedor:
- `schema.prisma:758-763` — comentario R1 explícito sobre `responsableId`.
- `admin/accounts/[id]/structure/route.ts` GET — expone la relación `responsable`
  (padre + `children`).
- **NUEVO** `admin/accounts/[id]/employees/route.ts` GET — búsqueda de nómina scopeada
  a `params.id`, `isActive:true` (mismo criterio que exige el resolver).
- `structure/[structureId]/route.ts` PUT — acepta `responsableId`; **chequeo R1 en
  runtime** (`employee.findFirst({ id, accountId, isActive })` → 400 si no calza);
  `null` desasigna; `update` con `where {id, accountId}`; `AuditLog`
  `DEPARTMENT_RESPONSABLE_UPDATED`.
- `useStructureManager.ts` + `components/admin/DepartmentResponsableSelect.tsx` +
  botón de editar en filas de departamento (no existía).

**Commit B `d16f982`** — `backfill-department-responsable.ts` acepta `--account=<id>`,
propagado a las 3 consultas y a los contadores; `--commit` sin `--account` falla.
**`--commit` sigue sin correrse** — la regla sellada de arriba no cambia.

### ⚠️ Trampa de auth descubierta (vale para cualquier pantalla concierge)

`GET /api/admin/employees` **NO sirve** desde `/dashboard/admin/accounts/[id]/**`, por dos
razones independientes:
1. Filtra por `userContext.accountId` = header `x-account-id` = `payload.accountId ||
   payload.id` (`middleware.ts:219`) → la cuenta **del admin logueado**, nunca `params.id`.
2. Con token legacy de Account (`/api/auth/login`, sin `userId`), el middleware **no
   inyecta `x-user-role`** (`middleware.ts:206-216`) → `hasPermission(null, …)` = `false` → 403.

→ Las pantallas concierge necesitan **sub-rutas propias bajo `accounts/[id]/`**.

---

## As-built Fase 2 punto 1-bis — Filtro jerárquico del selector (2026-07-31)

**Regla de producto (Victor):** el responsable debe salir de la **rama vertical** del
departamento — `{D} ∪ ancestros(D) hasta la raíz ∪ TODOS los descendientes de D`.
Hermanos excluidos. Clima notifica planes de acción a esta persona; alguien de otra
rama recibiría un aviso que no le corresponde.

**Por qué NO solo ascendente** (la formulación inicial): una gerencia nivel 2 casi nunca
tiene empleados en sí misma — su jefe figura en un departamento hijo. Medido: con la
cadena solo ascendente, **63 de 85 deptos** de cuentas con nómina quedaban sin candidatos,
incluidas 6 gerencias reales (`Gerencia de Operaciones` con 17 personas debajo,
`GERENCIA GENERAL` con 44). Con la rama completa, esas 6 se recuperan.

**Commit `5b5e67c`:**
- `DepartmentResponsableService.getResponsableChainDepartmentIds()` — ascendente reusa
  `MAX_DEPTH` y la validación de `accountId` por salto del walk-up sellado (que **no se
  refactorizó**: Clima 5C depende de él). Descendente reusa `getChildDepartmentIds` de
  `AuthorizationService`, intersectado contra deptos de la cuenta. Fail-closed: un
  `departmentId` ajeno devuelve `[]`.
- `GET accounts/[id]/employees` — `forDepartmentId` **obligatorio** (400 si falta, 404 si
  es de otra cuenta). Orden por `standardJobLevel` rankeado en JS (Prisma no soporta orden
  custom sobre string) reusando el type `StandardJobLevel`. `meta {total, shown, scanned,
  chainDepartments}` — sin cap silencioso.
- `PUT structure/[structureId]` — validación bloqueante **solo cuando el valor cambia**
  (ver violador heredado abajo). Desasignar (`null`) nunca se valida.
- Selector: precarga la cadena, avisa truncado, y distingue "sin match" de "esta unidad
  no tiene personas en su línea jerárquica".

**Commit `40f848a`** — `invalidateDepartmentCache()` tenía **cero call-sites**. El LRU de
`getChildDepartmentIds` (TTL 15 min) quedaba obsoleto al reparentar, afectando al
**filtrado RBAC de AREA_MANAGER**, no solo a esta feature. Agregado en PUT/POST de
structure y en `apply-general-manager`. `apply-standard-template` no lo necesita.

### 🔴 Violador heredado en la base — reportado, NO tocado

```
DON TOPITO [lvl 2] → FIGUEROA ROLDAN JUAN CARLOS (depto EQUIPOS MEDICOS)
  ancestros: ninguno · descendientes: Prevención de Riesgo
  → EQUIPOS MEDICOS está en otra rama. Viola la regla.
```
Es la única fila con `responsableId` en toda la base. Por eso el PUT valida **solo si el
valor cambia**: el selector reenvía el `responsableId` actual en cada update, y validar
siempre dejaría ese departamento ineditable. Verificado por smoke: editar su nombre
devuelve 200. Qué hacer con violadores heredados (limpiar / reasignar / dejar) es
decisión pendiente de Victor.

### Deuda abierta (reportada, NO tocada en este gate)

- 🟠 Los 4 handlers de `accounts/[id]/structure/**` gatean por **`Account.role`**
  (`validateAuthToken` → `auth.ts:288-298`), no por `hasPermission()`. Gate-blind.
  Es la trampa de [[project_auth_verifyjwt_returns_client]]. Migrarlos = gate propio.
- 🟠 `middleware.ts:276-279` deja entrar `ACCOUNT_OWNER`/`HR_MANAGER` a
  `/dashboard/admin/**`, pero las APIs exigen `FOCALIZAHR_ADMIN` → ven la pantalla y
  reciben 403 en cada fetch. Divergencia página-vs-API preexistente.
- 🔴 `ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md:198` afirmaba que `Department.responsableId`
  ya tenía un comentario estilo-R1 en `schema.prisma`. **No lo tenía** (verificado
  línea por línea). El commit A lo creó; conviene corregir esa línea del doc.
- 🟠 `structure/page.tsx` es 100% legacy (`professional-card`, `btn-gradient`, `sonner`
  directo en vez de `@/components/ui/toast-system`). El selector nuevo iguala ese estilo
  a propósito. Migración completa a `.fhr-*` = tarea aparte.
- 🟠 `resolveDepartmentResponsable` **no re-valida la cadena al leer**. Si un employee se
  transfiere a otra rama después de ser asignado, la fila queda inválida en silencio (así
  nació el caso DON TOPITO). Un script de diagnóstico read-only que liste violadores sería
  un gate aparte.
- 🟠 `getChildDepartmentIds` (`AuthorizationService.ts:34-48`) no filtra por `accountId`
  en su CTE. Seguro hoy porque `parentId` no cruza cuentas, pero es garantía implícita;
  `getResponsableChainDepartmentIds` la vuelve explícita intersectando el resultado.
