# PLAN — Etapa 2 (Reframe scope ejecutivo-tier): vínculo Employee↔User

> **Estado:** PROPUESTA de diff para revisión de Victor. **NO implementado.**
> **Fecha:** 2026-07-24 · **Decide:** Victor
> **Padre:** `.claude/tasks/ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md` (Etapa 2)
> **Gate 0:** `.claude/GATE0/GATE0_ETAPA2_REFRAME_EJECUTIVO_TIER.md` (fuente de los 7 sitios)

**Qué es Etapa 2 (redefinida):** NO es "reframe ejecutivo en varios módulos". Son
**exactamente 7 sitios de PDI + Sucesión** donde el `employee.findFirst({email})` corre y
su `null → 404`/vacío dispara **posicionalmente ANTES** del chequeo de acceso global que ya
existe más abajo — bloqueando a un exec-tier (sin fila Employee) por un acceso que el propio
código le concede unas líneas después. El fix es de **orden de validación**, no de gate nuevo.

**Patrón único:** computar el acceso global (`GLOBAL_ACCESS_ROLES`/`hasGlobalAccess`, el que
ya usa cada archivo) ANTES del lookup, y **no** hacer el lookup ni el 404 para roles globales.
El `currentEmployee` sigue resolviéndose solo para los roles no-globales (que lo necesitan
para el chequeo persona-a-persona `isDirectManager`/`isEmployee`/AREA_MANAGER).

---

## Sitios 1-4 — PDI con `GLOBAL_ACCESS_ROLES` ya importado (patrón idéntico)

`pdi/[id]/route.ts` GET (:37) · `pdi/[id]/route.ts` PATCH (:137) ·
`pdi/goals/[goalId]/route.ts` PATCH (:31) · `pdi/by-employee/route.ts` GET (:93)

**Razonamiento:** los 4 ya declaran `const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(...)`
DESPUÉS del lookup (`:75`, `:161`, `:57`, `:108`). Solo hay que **subir** esa línea y condicionar
el lookup+404. El `currentEmployee` alimenta `isDirectManager`/`isEmployee` (persona), moot para
global. Diff canónico (idéntico en los 4, ajustando el texto del error y el nombre de variable):

```diff
+   // Los roles con acceso global (HR/ejecutivo) no dependen de tener fila Employee
+   // (caso ejecutivo/holding). Se evalúan antes del lookup y lo saltan.
+   const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
+
-   const currentEmployee = await prisma.employee.findFirst({
-     where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
-   })
-
-   if (!currentEmployee) {
-     return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
-   }
+   const currentEmployee = hasGlobalAccess
+     ? null
+     : await prisma.employee.findFirst({
+         where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
+       })
+
+   if (!hasGlobalAccess && !currentEmployee) {
+     return NextResponse.json({ success: false, error: 'Empleado no encontrado' }, { status: 404 })
+   }
```

Y más abajo, **borrar la declaración duplicada** de `hasGlobalAccess` (ya está arriba) y
volver null-safe los usos de `currentEmployee`:

```diff
-   const hasGlobalAccess = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
-   const isDirectManager = pdi.managerId === currentEmployee.id
-   const isEmployee = pdi.employeeId === currentEmployee.id
+   const isDirectManager = pdi.managerId === currentEmployee?.id
+   const isEmployee = pdi.employeeId === currentEmployee?.id
```

- `pdi/[id]` GET usa `isDirectManager` + `isEmployee` (:76-77) → ambos `?.id`.
- `pdi/[id]` PATCH usa solo `isDirectManager` (:162) → `?.id`.
- `pdi/goals/[goalId]` usa `isDirectManager` (:58) → `?.id`; el sub-lookup AREA_MANAGER (:67)
  sigue igual (solo corre si role==='AREA_MANAGER', nunca global).
- `pdi/by-employee` usa `isManager` + `isEmployee` (:109-110) → `?.id`; además el `meta.canEdit`
  (:132) queda `isManager && ...` → false para global, correcto (global ve pero no es "el manager").

Efecto: exec-tier global → `hasGlobalAccess=true` → sin lookup, sin 404 → pasa el guard final
`if (!hasGlobalAccess && ...)`. AREA_MANAGER/EVALUATOR → sin cambios (no son globales).

---

## Sitio 5 — `pdi/route.ts` GET list (:21) — NECESITA CUIDADO

**Diferencia:** no usa `GLOBAL_ACCESS_ROLES` sino `isHR = hasPermission(role,'employees:read')`
(:39), y el `currentEmployee.id` alimenta **tres** ramas de construcción del `where` (:46, :49).
El null actual degrada a **lista vacía** (:26), pre-emptando la rama HR-por-employeeId (:41).

**Razonamiento:** HR consultando `?employeeId=X` no necesita fila Employee propia. Subir `isHR`,
relajar el corto-circuito, y volver null-safe las ramas:

```diff
+   const isHR = hasPermission(userContext.role, 'employees:read')
+
    const currentEmployee = await prisma.employee.findFirst({
      where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' }
    })
-   if (!currentEmployee) {
+   // No-HR sin fila Employee: no tiene PDIs propios ni de equipo. HR sí puede consultar
+   // sin fila Employee (por employeeId explícito).
+   if (!currentEmployee && !isHR) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }
    ...
-   const isHR = hasPermission(userContext.role, 'employees:read')
-
    if (isHR && employeeId) {
      where.employeeId = employeeId
    } else if (role === 'employee') {
-     where.employeeId = currentEmployee.id
+     where.employeeId = currentEmployee?.id ?? '__no_employee__'
-   } else {
+   } else if (currentEmployee) {
      where.managerId = currentEmployee.id
      if (employeeId) where.employeeId = employeeId
+   } else {
+     // HR sin fila Employee y sin employeeId: sin ancla de manager → solo por employeeId.
+     where.employeeId = employeeId ?? '__no_employee__'
    }
```

> ⚠️ **Sub-decisión para Victor (sitio 5):** ¿qué debe ver un usuario **HR sin fila Employee**
> que NO pasa `employeeId`? La propuesta conservadora de arriba devuelve **vacío**
> (`'__no_employee__'` no matchea ningún cuid), en vez de volcar todos los PDIs de la cuenta.
> Si preferís que HR sin employeeId vea toda la cuenta, la última rama sería `if (employeeId)
> where.employeeId = employeeId` (sin centinela). Recomiendo la conservadora: evita un dump
> account-wide accidental; HR que quiere un PDI específico ya pasa `employeeId`.

---

## Sitios 6-7 — succession-plan: reorden + fix del array `isHR`

`employees/[id]/succession-plan/route.ts` GET (:24) ·
`employees/[id]/succession-plan/progress/route.ts` PUT (:35)

**Dos cambios (como pediste):** (a) reorden global-antes-del-lookup; (b) reemplazar el array
`isHR` hardcodeado — que **omite HR_MANAGER** — por `GLOBAL_ACCESS_ROLES`. `AREA_MANAGER` sigue
denegado (no está en `GLOBAL_ACCESS_ROLES`; solo pasa si es el manager directo por persona).

```diff
-import { extractUserContext } from '@/lib/services/AuthorizationService'
+import { extractUserContext, GLOBAL_ACCESS_ROLES } from '@/lib/services/AuthorizationService'
```

```diff
-   // Verify requesting user is the direct manager
-   const currentUser = await prisma.employee.findFirst({
-     where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
-     select: { id: true },
-   })
-   if (!currentUser) {
-     return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
-   }
+   // Roles con acceso global (HR/ejecutivo) no dependen de tener fila Employee.
+   // Se evalúan antes del lookup y lo saltan (fix array hardcodeado que omitía HR_MANAGER).
+   const isHR = GLOBAL_ACCESS_ROLES.includes(userContext.role as any)
+   const currentUser = isHR
+     ? null
+     : await prisma.employee.findFirst({
+         where: { accountId: userContext.accountId, email: userEmail, status: 'ACTIVE' },
+         select: { id: true },
+       })
+   if (!isHR && !currentUser) {
+     return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
+   }
```

Y en el guard (borrando el array hardcodeado, ahora `isHR` viene de arriba):

```diff
-   const isManager = employee.managerId === currentUser.id
-   const isHR = !!userContext.role && ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_OPERATOR', 'CEO'].includes(userContext.role)
+   const isManager = !!currentUser && employee.managerId === currentUser.id
    if (!isManager && !isHR) { return 403 }
```

(En `progress` es `employee?.managerId === currentUser.id` → queda
`!!currentUser && employee?.managerId === currentUser.id`.)

**AREA_MANAGER:** `GLOBAL_ACCESS_ROLES` no lo incluye → `isHR=false` → hace el lookup → solo
pasa si es el manager directo (persona), igual que hoy. **Sigue denegado como rol.** ✅
**HR_MANAGER:** antes omitido por el array → **ahora incluido** vía `GLOBAL_ACCESS_ROLES`. ✅

---

## Resumen del diff

| Sitio | Archivo | Cambio | Query ahorrada a global |
|---|---|---|---|
| 1 | `pdi/[id]/route.ts` GET | reorden + `?.id` | sí |
| 2 | `pdi/[id]/route.ts` PATCH | reorden + `?.id` | sí |
| 3 | `pdi/goals/[goalId]/route.ts` | reorden + `?.id` | sí |
| 4 | `pdi/by-employee/route.ts` | reorden + `?.id` | sí |
| 5 | `pdi/route.ts` GET | reorden `isHR` + null-safe 3 ramas (sub-decisión) | no (HR igual necesita rama) |
| 6 | `employees/[id]/succession-plan/route.ts` | reorden + array→`GLOBAL_ACCESS_ROLES` + import | sí |
| 7 | `.../succession-plan/progress/route.ts` | ídem | sí |

**Fuera de estos 7 no se toca nada.** Ningún cambio de schema, ningún gate nuevo, ningún
cambio en middleware. El vector de minting legacy (Etapa 3) no se agrava: el gate sigue siendo
el ROL (`GLOBAL_ACCESS_ROLES`), no `employeeId`.

---

## Verificación (cuando se apruebe)

1. `tsc --noEmit` + `next build` limpios.
2. Smoke real por rol contra los 7 endpoints, con el user de test exec-tier sin fila Employee
   (CEO `victor@focalizahr.cl`): antes → 404/vacío; después → 200/datos. Regresión: AREA_MANAGER
   directo sigue pasando; AREA_MANAGER no-manager sigue 403; EVALUATOR sin cambios.
3. Succession-plan: HR_MANAGER (antes denegado por el array) → ahora 200; AREA_MANAGER no-manager
   → sigue 403.

---

## Anotaciones a aplicar en `ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md` (tras confirmación)

**A. Reescribir la descripción de Etapa 2** (hoy dice "reframe ejecutivo-tier en varios
módulos") por: *"7 sitios de PDI/Sucesión donde el ORDEN de validación (`employee.findFirst`
antes del chequeo de acceso global) bloquea a un exec-tier por un acceso que el código ya le
concede. Fix = anteponer el chequeo global + saltar el lookup para roles globales. En los 2
succession-plan, además, reemplazar el array `isHR` hardcodeado (omitía HR_MANAGER) por
`GLOBAL_ACCESS_ROLES`."*

**B. Sección "Fuera de alcance de Etapa 2" (nueva), 4 entradas:**
1. **`goals/team:43` + `goals/team/coverage:16`** — decisión de producto SIN resolver: qué
   significa "team" para un rol exec-tier sin reportes directos. `/team` hace 404 duro,
   `coverage` degrada a `{total:0}`. **Pendiente de decisión de producto, NO de Etapa 2.**
2. **`isSystemAdmin` incompleto en `admin/performance-ratings:111` (y `ratings-for-potential:61`)**
   — cubre 3 de 6 GLOBAL; HR_MANAGER/HR_OPERATOR/CEO degradan a `canAssignPotential=false`/vacío.
   Es **política de rol deliberada, NO bug.** Backlog de gobernanza, separado.
3. **Calibración — CONFIRMADO fuera de alcance, NO pendiente.** La autorización de calibración
   corre por `CalibrationParticipant` (`schema.prisma:2582`) — match por `participantEmail`
   (`:2589`, `@@unique([sessionId, participantEmail])`) y rol de sesión
   `FACILITATOR/REVIEWER/OBSERVER` (`:2516-2518`). Es un **tercer mecanismo de autorización**:
   nunca pasa por `Employee.findFirst({email})` ni por `GLOBAL_ACCESS_ROLES`, así que el bug de
   Etapa 2 nunca lo tocó. No reabrir la pregunta.
4. **Nota futura (no accionable hoy):** el feature "calibrador no-jefe inyecta un PDI desde la
   sala de calibración" está documentado como base lista pero **NO construido**
   (`.claude/FICHA_PRODUCTOS/project_gate0_base_madre_desempeno_metas.md`, sección D.1 s/ Victor).
   Cuando se construya, debe autorizar vía `CalibrationParticipant` de esa sesión, **NO** vía
   `managerId`/`GLOBAL_ACCESS_ROLES`. Referencia para esa sesión futura.
