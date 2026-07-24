# ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md

> **Estado:** Proyecto abierto, en etapas. Etapa 1 ✅ SELLADA (c1e08e6).
> **Fecha creación:** 2026-07-24 · **Decide:** Victor
> **Origen:** dos hilos independientes (Metas/Notificaciones, 2026-07-15; Clima
> Tab 2, 2026-07-24) llegaron por separado a la misma conclusión — valida la
> dirección, no la duplica.
> **Anexo A (investigación sellada):** `.claude/GATE0/GATE0_VINCULO_EMPLOYEE_USER_ANALISIS_IMPACTO.md`

---

## 0. Contexto

`Employee` (nómina) y `User` (login) son tablas disjuntas, sin FK entre sí.
Hoy, 35 sitios del código resuelven "¿cuál es el Employee de este User logueado?"
buscando por email (`prisma.employee.findFirst({accountId, email: userEmail,
status:'ACTIVE'})`) — frágil, porque `User.email` y `Employee.email` pueden no
coincidir, y `Employee.email` es nullable y no único.

El sistema **ya decidió** (GRAN_CAMBIO_RUT, octubre 2025) que el RUT es la
identidad permanente de una persona — vigente hoy en `Employee` y `Participant`.
`User` es la única tabla del sistema que nunca capturó RUT. Este proyecto cierra
ese hueco de origen.

**No es un problema de "quién debería tener login."** Es que hoy, decida lo que
decida el negocio sobre logins, no hay forma limpia de conectar a una persona ya
existente en la nómina con su eventual acceso a la plataforma.

---

## 1. Etapas

### Etapa 1 — Fundación
**Estado: ✅ SELLADO — c1e08e6 (+ dd7bc39, f9033e8 como fundación documental previa)** — plan y diff en
`.claude/tasks/PLAN_ETAPA1_VINCULO_EMPLOYEE_USER.md` (6 archivos, aditivo puro).

Decisiones selladas (ver plan para razonamiento):
- **FK = `User.employeeId String? @unique` → `Employee.id`, `onDelete: SetNull`**
  (no `Employee.userId`): la dirección de consulta dominante es User→Employee y así
  el login carga `employeeId` como columna, sin query extra.
- **`User.nationalId String?` con `@@unique([accountId, nationalId])`** — espejo de
  Employee (RUT único por cuenta, no global).
- **`employeeId` se cachea en el JWT al login** y viaja como header `x-employee-id`;
  `extractUserContext` lo expone (síncrono, sin BD). Trade-off = staleness (ventana =
  TTL token), aceptable porque nace todo NULL y los consumidores manejan null explícito.
- **`admin/users` captura+valida RUT, NO auto-linkea** (el match es Etapa 4, policy única).

Archivos: `schema.prisma` (User+Employee), `AuthorizationService.ts` (extractUserContext),
`middleware.ts` (header), `auth/user/login/route.ts` (claim JWT), `admin/users/route.ts` (RUT).

### Etapa 2 — Reframe de scope ejecutivo-tier
**Estado: PENDIENTE — no depende de la Etapa 1**

Los sitios de los 35 que solo tocan roles ejecutivo-tier (CEO, ACCOUNT_OWNER,
HR_ADMIN, HR_MANAGER, HR_OPERATOR, FOCALIZAHR_ADMIN) dejan de intentar resolver
`Employee` para su scope — usan `GLOBAL_ACCESS_ROLES`, patrón ya existente.
Cubre también el caso "ejecutivo/holding sin Employee en esta cuenta" (persona
paga por otra entidad legal, nunca va a tener fila en este `Employee`).

### Etapa 3 — Recableo de los 35 sitios
**Estado: BLOQUEADA — depende de Etapa 1 Y del cierre del minting legacy (ver §2bis R2).**

Reemplazar `findFirst({email})` por `userContext.employeeId` en cada sitio.
Orden de prioridad: primero los 10 "silenciosos" (grupo B del Gate 0), empezando
por el portal EVALUATOR (3 de sus 4 sitios). Un gate por módulo (Metas, PDI,
Performance, Evaluator, Succession, Auth), smoke test real por gate.

> ⛔ **NO arrancar hasta cerrar el minting legacy de JWT** (`§2bis R2`). Cualquier sitio
> que use `userContext.employeeId` para **decidir autorización** ("¿es mi subordinado?",
> "¿esta meta es mía?") hereda el vector de escalada de token legacy + header forjado
> mientras `/api/auth/login` y `/api/auth/register` sigan acuñando tokens sin `userId`.

### Etapa 4 — Aprovisionamiento en el resto de los puntos de creación
**Estado: PENDIENTE — depende de Etapa 1**

U2 (`auth/user/login/route.ts:82`, lazy-create ejecutivo), E1
(`EmployeeSyncService.ts:969`), E2 (`OnboardingEnrollmentService.ts:427`).
Decidir si vale pedir/chequear RUT en cada uno, sabiendo que U2 legítimamente
no va a matchear en el caso ejecutivo/holding (Etapa 2 ya lo cubre, no es un
fallo ahí).

> 🔒 **NO NEGOCIABLE (ver §2bis R1):** todo auto-match/escritura de `User.employeeId`
> debe verificar que el `Employee` candidato tenga el **mismo `accountId`** que el `User`
> **antes** de enlazar. El FK no lo garantiza (referencia `Employee.id` global). Match sin
> ese chequeo = puente cross-tenant.

### Etapa 5 — Backfill selectivo
**Estado: DIFERIDO, sin fecha**

No se corre contra data de prueba. Se corre el primer día que entre un cliente
real, contra su nómina real — mismo criterio que `Department.responsableId`.

---

## 2. Regla transversal — vigente desde que se sella la Etapa 1

> Ningún código nuevo agrega un `prisma.employee.findFirst({ email: userEmail })`.
> Todo endpoint nuevo que necesite "¿quién es el Employee de este usuario
> logueado?" usa `userContext.employeeId`. Si el vínculo aún no existe para ese
> caso (Etapa 1 no completada, o el usuario cae en el caso ejecutivo/holding sin
> Employee), el endpoint nuevo maneja el `null` explícito — nunca agrega otro
> lookup por email "mientras tanto".

Reforzada en: `GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md`
(ADDENDUM B.9) y skill `focalizahr-api`.

---

## 2bis. Restricciones NO NEGOCIABLES

### R1 — `accountId` igual antes de escribir `User.employeeId` (Etapa 3 y 4)

El FK `User.employeeId → Employee.id` referencia el `id` **global** de Employee; **no**
garantiza que el Employee sea de la misma cuenta que el User. Todo código que **escriba**
el vínculo (auto-match en Etapa 4, o cualquier reparación manual) **debe verificar en capa
de aplicación** que `employee.accountId === user.accountId` **antes** de enlazar. Sin ese
chequeo explícito, un User y un Employee de cuentas distintas podrían quedar enlazados →
puente cross-tenant (rompe el aislamiento multi-tenant, regla enterprise #2). Reflejado como
comentario en `schema.prisma` (`User.employeeId`), mismo estilo que `Department.responsableId`.

### R2 — Etapa 3 BLOQUEADA hasta cerrar el minting legacy de JWT

**Fuente:** investigación "Auth Legacy vs Nuevo" (chat *Migración y Unificación de
Autenticación*, jul 2026) + `SPEC_MIDDLEWARE_LEGACY_ROLE_HARDENING_v1.md` §4bis, caso 5.

`login/route.ts` **no** es el único lugar que acuña JWT. También acuñan, **sin `userId`**:
`/api/auth/login` (legacy), `/api/auth/register:118`, `lib/auth.ts:352`. El mecanismo de
Etapa 1 (setear `x-employee-id` en `middleware.ts` dentro de `if (payload.userId)`, igual que
`x-user-role`/`x-user-id`) **hereda el mismo vector ya confirmado**: token legacy + header
forjado → pasa sin que el middleware lo pise (SPEC §4bis caso 5).

- **No es explotable HOY:** nada confía todavía en `employeeId` para autorizar. Etapa 1
  (agregar el header) **no crea riesgo nuevo mientras nada lo consuma para decisiones de
  acceso** → Etapa 1 **puede** implementarse ya.
- **Etapa 3 SÍ queda BLOQUEADA:** el momento en que un endpoint use `userContext.employeeId`
  para **decidir autorización** (ej. "¿es mi subordinado?", "¿esta meta es mía?"), el vector
  pasa a ser explotable. Etapa 3 (y cualquier código con esa forma) **no arranca** hasta que
  se cierre el minting legacy de `/api/auth/login` y `/api/auth/register` — pendiente #2 de la
  investigación auth, ya marcado "máxima prioridad" como proyecto independiente.
- **Por qué se documenta acá y ahora (lección 6ter de la propia investigación auth):** las
  conexiones entre proyectos que no quedan escritas se pierden entre sesiones. Esta dependencia
  cruzada queda anclada para que ninguna sesión futura arranque Etapa 3 sin verla.

---

## 3. Casos que esto NO resuelve, a propósito

- Ejecutivo/holding sin `Employee` en esta cuenta → lo cubre la Etapa 2, no el
  vínculo (no hay fila contra la cual matchear, con o sin RUT).
- Backfill de RUT contra la data de hoy → bloqueado hasta Etapa 5, nunca contra
  data de dev/prueba.

## Changelog
- v1 (2026-07-24): creación. Gate 0 (Anexo A) sellado. Etapas 1-5 definidas,
  ninguna iniciada.
- v1.1 (2026-07-24): Etapa 1 especificada e implementada (plan
  `PLAN_ETAPA1_VINCULO_EMPLOYEE_USER.md`). Agregada §2bis con 2 restricciones NO
  NEGOCIABLES: R1 (chequeo `accountId` antes de escribir el vínculo) y R2 (Etapa 3
  bloqueada hasta cerrar el minting legacy de JWT — SPEC_MIDDLEWARE_LEGACY_ROLE_
  HARDENING_v1 §4bis caso 5). Etapa 3 marcada BLOQUEADA; Etapa 4 con nota R1.
