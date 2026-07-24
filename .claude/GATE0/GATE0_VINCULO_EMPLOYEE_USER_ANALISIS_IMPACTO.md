# GATE 0 — Análisis de impacto: vínculo formal Employee ↔ User

> **Estado:** análisis de impacto, **read-only**. Cero código escrito.
> **Fecha:** 2026-07-24 · **Decide:** Victor · **Siguiente paso si se aprueba:** Plan Mode
> **Alcance:** dimensionar el tamaño real del trabajo. NO propone cómo construirlo.
>
> Evidencia file:line verificada en sesión de solo lectura (re-grep completo, no
> se asumió el conteo de la sesión del 2026-07-15).
> Ejes explícitamente EXCLUIDOS (no relacionados): ClimaActionLog,
> DepartmentResponsableService, EX Clima.

---

## 0. Encuadre — qué cambió desde la sesión del 15-jul

Dos cosas hay que corregir del hallazgo previo antes de dimensionar:

**A. El grupo (a) — 5 sitios con fallback literal hardcodeado — YA ESTÁ RESUELTO.**
`extractUserContext` hoy expone `userName` (leído de `x-user-name`, decodificado):
`AuthorizationService.ts:142,145,151`. Las dos funciones de cierre de metas ya
consumen esa cadena y borraron el literal:
- `GoalsService.ts:1096` → `actor.employeeName || actor.userName || actor.userEmail || ''`
- `GoalsService.ts:1134` → idem, con comentario explícito en `:1095`:
  *"el usuario ejecutivo sin fila Employee ya no cae a 'Administrador'"*.
- `goals/cycles/[id]/finalize/route.ts:73` → `employee?.fullName || ctx.userName || userEmail || ''`.

Los literales que sobreviven en el grep (`'Administrador'`, `'Gerente de Área'`, `'Sistema'`)
son de OTROS dominios (DepartmentResponsableService, ClimaActionPlanBuilder,
PerformanceTrackValidator, UI de labels) — no son fallback de este lookup.
**→ El grupo (a) sale del inventario. El problema ya no es de nombres; es de datos/acceso.**

**B. No existe comentario "Asumiendo User.email = Employee.email".**
Búsqueda de comentarios (no solo del patrón de código) en `src/` no encontró la frase
ni equivalentes ("asumiendo", "coincide", "mismo email"). El acoplamiento está solo
IMPLÍCITO en comentarios descriptivos del lookup, p.ej.:
- `goals/[id]/check-in/route.ts:82` — *"Obtener employeeId desde el email del usuario logueado"*
- `evaluator/stats/route.ts:84` — *"Encontrar el Employee del usuario logueado"*
- `performance-ratings/[id]/potential/route.ts:82` — *"Buscar Employee del usuario logueado…"*
- `pdi/route.ts:20` — *"Resolver Employee del usuario logueado"*

No hay una premisa escrita a desmontar; hay 35 lookups que la ejercen sin declararla.

---

## 1. Inventario real — 35 lookups "quién soy yo como Employee"

Patrón: `prisma.employee.findFirst({ where: { accountId, email: userEmail, status:'ACTIVE' } })`
(variante `isActive: true` en Performance). Todos acoplan User↔Employee **por email, sin FK**.
Ninguno usa `userName` como sustituto del lookup — `userName` solo cubre el nombre para auditoría,
no el `employeeId` que estos sitios necesitan para filtrar/autorizar.

Clasificación por qué pasa cuando el lookup devuelve **null** (ejecutivo sin fila Employee, o
email de User ≠ email de Employee):

| # | file:line | módulo | modo de fallo | efecto para el usuario |
|---|---|---|---|---|
| 1 | goals/[id]/route.ts:126 | Metas | A* | EVALUATOR viendo meta no-COMPANY → 403 (COMPANY sigue visible) |
| 2 | goals/[id]/request-closure/route.ts:39 | Metas | D | `employeeId=null` va al servicio; scope se enforce adentro (GoalClosureError) |
| 3 | goals/[id]/check-in/route.ts:87 | Metas | C | authorship cae a `userId ?? accountId`; guarda igual, mal atribuido |
| 4 | goals/[id]/approve-closure/route.ts:68 | Metas | D | idem request-closure |
| 5 | goals/team/route.ts:43 | Metas | A | 404 — vista de metas del equipo bloqueada |
| 6 | **goals/team/coverage/route.ts:16** | Metas | **B** | widget de cobertura muestra 0% en silencio |
| 7 | **goals/route.ts:124** | Metas | **B** | EVALUATOR pierde metas de subordinados, degradado a solo-COMPANY |
| 8 | goals/route.ts:271 | Metas | A | 403 — EVALUATOR no puede crear meta individual |
| 9 | goals/cycles/[id]/finalize/route.ts:69 | Metas | C | solo audit actorName; cae a `userName ?? userEmail` |
| 10 | goals/alerts/[id]/route.ts:37 | Metas | A | 404 — no puede marcar aviso leído |
| 11 | **goals/alerts/route.ts:34** | Metas | **B** | bandeja de avisos vacía en silencio |
| 12 | pdi/[id]/route.ts:37 | PDI | A | 404 — GET PDI bloqueado |
| 13 | pdi/[id]/route.ts:137 | PDI | A | 404 — PUT PDI bloqueado |
| 14 | pdi/[id]/check-ins/route.ts:44 | PDI | A | 404 — no puede agregar check-in |
| 15 | pdi/[id]/change-status/route.ts:36 | PDI | A | 404 — no puede cambiar estado |
| 16 | **pdi/route.ts:21** | PDI | **B** | lista de PDI vacía en silencio (mgr + empleado) |
| 17 | pdi/goals/[goalId]/route.ts:31 | PDI | A | 404 — operación PDI-goal bloqueada |
| 18 | pdi/generate-suggestion/route.ts:39 | PDI | A | 404 — no genera sugerencia PDI |
| 19 | pdi/by-employee/route.ts:93 | PDI | A | 404 — PDI-por-empleado bloqueado |
| 20 | performance-ratings/[id]/potential/route.ts:83 | Performance | A* | rol no-global: 403 (no asigna potencial) |
| 21 | performance-ratings/[id]/potential/route.ts:327 | Performance | A* | rol no-global: 403 (no limpia potencial) |
| 22 | **performance-cycles/[id]/ratings-for-potential/route.ts:61** | Performance | **B** | grilla de potencial vacía en silencio |
| 23 | performance/role-fit/route.ts:114 | Performance | A | EVALUATOR: 404 — Role Fit bloqueado |
| 24 | admin/performance-ratings/route.ts:55 | Performance | A | EVALUATOR: 404 — lista de ratings bloqueada |
| 25 | **admin/performance-ratings/route.ts:111** | Performance | **B** | todos los `canAssignPotential:false` — botones muertos, sin error |
| 26 | admin/performance-cycles/[id]/route.ts:50 | Performance | A | EVALUATOR: 404 — detalle de ciclo bloqueado |
| 27 | **evaluator/stats/route.ts:86** | Evaluator | **B** | dashboard de evaluador en ceros/ÓPTIMA en silencio |
| 28 | evaluator/potential/route.ts:49 | Evaluator | A | 404 — asignar potencial bloqueado |
| 29 | **evaluator/cycles/route.ts:21** | Evaluator | **B** | evaluador no ve ningún ciclo |
| 30 | **evaluator/assignments/route.ts:66** | Evaluator | **B** | lista de tareas de evaluación vacía en silencio |
| 31 | succession/candidates/[id]/development-plan/route.ts:158 | Succession | C | sponsorId cae a `managerId ?? employeeId` |
| 32 | succession/candidates/[id]/create-pdi/route.ts:108 | Succession | C | managerId cae a `candidate.employee.managerId` |
| 33 | employees/[id]/succession-plan/route.ts:24 | Succession | A | 404 — vista de plan de sucesión bloqueada |
| 34 | employees/[id]/succession-plan/progress/route.ts:35 | Succession | A | 404 — no edita progreso |
| 35 | **auth/me/route.ts:25** | Auth | **B** | `hasDirectReports=false` — UI de líder oculta al ejecutivo sin Employee |

`A*` = bloqueo condicional a una rama/rol específico, no a toda la ruta.

**Reparto por modo de fallo:**

| Modo | Qué es | Cuántos |
|---|---|---|
| **A — Hard 403/404** | feature completamente bloqueada | **17** (3 condicionales) |
| **B — Degradación silenciosa** | muestra vacío/capacidad perdida, sin error visible | **10** |
| **C — Fallback benigno** | usa userName/managerId, no rompe función | **4** |
| **D — Diferido al servicio** | el scope se enforce adentro de GoalsService | **2** |

**Reparto por módulo/producto:**

| Módulo | Sitios | de esos, silenciosos (B) |
|---|---|---|
| Metas (Goals) | 11 | 3 (#6, #7, #11) |
| PDI | 8 | 1 (#16) |
| Performance | 7 | 2 (#22, #25) |
| Evaluator (portal EVALUATOR) | 4 | 3 (#27, #29, #30) |
| Succession | 4 | 0 |
| Auth (`/me`) | 1 | 1 (#35) |

**Los 10 silenciosos (grupo c) — los más peligrosos, no dan error, "parecen funcionar":**
`#6` cobertura de metas 0% · `#7` EVALUATOR pierde metas de subordinados ·
`#11` bandeja de avisos vacía · `#16` lista PDI vacía · `#22` grilla de potencial vacía ·
`#25` botones de asignar potencial muertos · `#27` stats de evaluador en cero ·
`#29` evaluador sin ciclos · `#30` tareas de evaluación vacías · `#35` UI de líder oculta.
El portal EVALUATOR es el más expuesto: 3 de sus 4 sitios degradan en silencio.

---

## 2. Qué rompe el campo aditivo nullable

Campo propuesto: `Employee.userId String?` **o** `User.employeeId String?` — FK opcional,
sin migración, `db push`, nace NULL. Mismo patrón que `Department.responsableId`.

**a) Flujos que crean User o Employee (dónde tendría que poblarse el vínculo):**

| # | punto de creación | file:line | flujo | señal para matchear |
|---|---|---|---|---|
| U1 | `admin/users/route.ts:247` | `prisma.user.create` | admin provisiona sub-usuario (login) | **email** (`.toLowerCase().trim()`). Sin nationalId. |
| U2 | `auth/user/login/route.ts:82` | `prisma.user.create` | auto-migración lazy Account→User en 1er login | **email** (=`account.adminEmail`). Sin nationalId. |
| E1 | `EmployeeSyncService.ts:969` | `tx.employee.createMany` | **import CSV masivo** (vía principal, `skipDuplicates`) | **nationalId** (siempre) + **email** (nullable) |
| E2 | `OnboardingEnrollmentService.ts:427` | `tx.employee.create` | pre-enrolamiento onboarding (pre-nómina) | **nationalId** (siempre) + email (a veces) |

Notas verificadas:
- El **registro de cuenta** (`auth/register/route.ts`, `lib/auth.ts:342`) crea **Account, no User**.
  El User del owner nace lazy en el primer login (U2). No hay User-create en el signup.
- **No existe endpoint de "alta individual de empleado"** con `prisma.employee.create` en `src/`.
  Toda creación productiva pasa por E1 o E2. (`admin/employees/route.ts` solo lee/filtra.)
- `prisma.user.upsert` / `createMany`: **no existe** en `src/`.
- Los `employee.create` en `prisma/scripts/*` son fixtures de smoke/regresión, no seeds productivos.

**b) ¿Algo rompe si el campo existe pero queda NULL en la mayoría?**
**No.** Ningún código lee ni escribe hoy un join User↔Employee (verificado: `User` no tiene
`employeeId` ni relación a Employee; `Employee` no tiene `userId`; todos los `employeeId` del
schema son FKs de OTROS modelos apuntando HACIA Employee). Un campo nullable nacido NULL no
tiene lector que asuma no-null. Es greenfield puro, igual que `Department.responsableId`.

**c) Vigencia de la premisa de enero 2026** ("User = acceso al sistema, Employee = nómina,
un ejecutivo puede loguearse sin ser empleado"): **SIGUE VIGENTE y el schema la confirma.**
- Tablas disjuntas: `User` (schema:843-863) y `Employee` (schema:1748+) sin FK entre sí.
- `User.email` es `@unique`; `Employee.email` es `String?` **nullable y NO único**.
- `User` **no tiene `nationalId`**; `Employee.nationalId` es requerido/único por cuenta.
- El caso "ejecutivo logueado sin Employee" **existe hoy en producción**: U2 crea un User
  (FOCALIZAHR_ADMIN/ACCOUNT_OWNER) sin ninguna fila Employee. Esos 35 lookups fallan
  exactamente para ese User.

---

## 3. Qué mejora — no es solo Metas

El vínculo formal convierte los 35 lookups frágiles (email, sin FK) en un join estable, y
apaga los 10 modos silenciosos. Beneficio por producto (ver tabla §1):

- **Metas** (11) — cierre, cobertura, avisos, vista de equipo.
- **PDI** (8) — CRUD completo + lista.
- **Performance** (7) — asignación de potencial, role-fit, ratings.
- **Evaluator** (4) — el portal más frágil; hoy 3/4 degradan sin avisar.
- **Succession** (4) — vistas y progreso de plan.
- **Auth `/me`** (1) — `hasDirectReports` alimenta la UI de líder de TODOS los módulos.

`auth/me/route.ts:25` (#35) es el de mayor apalancamiento: define si el usuario ve o no la
capa "soy jefe" transversal. Falla en silencio.

---

## 4. Dificultad real — separada en tres

**a) Agregar el campo — TRIVIAL.**
Un `String?` nullable + `@@index`, `db push`, nace NULL. Patrón idéntico a
`Department.responsableId` (ya en producción). Cero migración de datos para existir.

**b) Backfill de lo que SÍ se puede matchear hoy con confianza — LIMITADO Y FRÁGIL.**
- El backfill fuerte sería por **RUT/nationalId**. **Bloqueado: `User` no tiene `nationalId`**
  (schema:843-863, sin columna equivalente). No hay campo RUT en User para cruzar.
- El **único campo compartido hoy es `email`**, y es débil por diseño: `Employee.email` es
  nullable y **no único**; `User.email` es único. Un match por email es 1-a-quizás y silencioso
  cuando el email difiere o falta. **Matchear por email es exactamente la fragilidad que este
  Gate 0 busca eliminar** — usarlo para backfill reimporta el problema.
- Tamaño real del backfill confiable **hoy**: solo los pares donde `User.email` == algún
  `Employee.email` no-null dentro de la misma cuenta. Cobertura desconocida sin correr un
  dry-run de conteo (no ejecutado — la BD es producción). Los ejecutivos U2 (email = adminEmail)
  típicamente **no** tienen fila Employee, así que no matchean por definición.
- **Conclusión de tamaño:** el backfill NO es un problema de código sino de *señal disponible*.
  Con el schema actual, el único match confiable requeriría que `User` tuviera `nationalId`
  (no lo tiene) — o aceptar el match por email con su cobertura parcial y su fragilidad.

**c) Aprovisionamiento automático del vínculo — 4 puntos de enganche, señal desigual.**

| punto | señal disponible | fuerza del match |
|---|---|---|
| U1 `admin/users/route.ts:247` (alta sub-usuario) | email | débil (Employee.email nullable/no único) |
| U2 `auth/user/login/route.ts:82` (lazy owner) | email (=adminEmail) | casi nunca hay Employee que matchear |
| E1 `EmployeeSyncService.ts:969` (import CSV, alto volumen) | nationalId + email | nationalId no cruza a User (User sin RUT) → queda email |
| E2 `OnboardingEnrollmentService.ts:427` (pre-nómina) | nationalId + email | idem E1 |

`EmployeeSyncService` matchea empleados entre sí por **nationalId** (`findMany where accountId`
→ mapa por nationalId, `EmployeeSyncService.ts:555,677,780`; createMany en `:969`). El RUT es
el ancla de identidad del lado Employee — pero **no existe del lado User**, así que ninguno de
los 4 puntos puede colgar un match fuerte por RUT sin antes darle a `User` un campo de identidad
compartida. La señal que hoy tienen los 4 es email, con la debilidad ya descrita.

---

## 5. Tamaño total — resumen ejecutivo

| Pieza | Tamaño | Bloqueante |
|---|---|---|
| Campo `Employee.userId?` / `User.employeeId?` nullable | **Trivial** (patrón existente) | ninguno |
| Rotura por NULL mayoritario | **Cero** (nadie lee el join hoy) | ninguno |
| Reescribir 35 lookups email→FK | **Mediano** (35 sitios, 6 módulos, patrón repetido) | requiere el campo poblado |
| Backfill confiable por RUT | **Bloqueado** | `User` no tiene nationalId |
| Backfill por email | **Parcial + frágil** | reintroduce el acoplamiento que se quiere quitar |
| Auto-aprovisionamiento en 4 puntos | **Mediano** | señal compartida hoy = solo email (débil) |

**El costo no está en agregar el campo (trivial) ni en romper algo (no rompe). Está en que
`User` y `Employee` no comparten hoy ninguna llave fuerte:** RUT vive solo en Employee, email
es débil en Employee. Cualquier vínculo confiable —backfill o auto-provisión— depende de que
exista una señal de identidad compartida que hoy no existe. Ese es el tamaño real.

---

## Apéndice — hechos de schema verificados

- `User` (schema:843-863): `id, accountId, email @unique, name, passwordHash, role,
  departmentId?, isActive, lastLoginAt, createdAt, updatedAt`. **Sin nationalId, sin employeeId,
  sin relación a Employee.**
- `Employee` (schema:1748+): `nationalId` (RUT, requerido, único por cuenta), `email String?`
  (nullable, **no** único), `fullName, departmentId, status, isActive`, … **Sin userId.**
- `extractUserContext` (AuthorizationService.ts:142-151) expone `userName` (de `x-user-name`).
- Ningún join User↔Employee leído/escrito en todo `src/`.
