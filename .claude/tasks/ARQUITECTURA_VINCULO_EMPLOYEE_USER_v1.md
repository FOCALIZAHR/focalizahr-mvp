# ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md

> **Estado:** Proyecto abierto, en etapas. Etapa 1 aún no iniciada.
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
**Estado: PENDIENTE**

- Agregar `nationalId` a `User` (nullable)
- Agregar `Employee.userId` / `User.employeeId` (nullable, FK, `db push`,
  mismo patrón que `Department.responsableId`)
- Extender `extractUserContext` para exponer `employeeId` — mismo lugar donde
  ya se agregó `userName` (`AuthorizationService.ts:142-151`)
- Pedir RUT en el único punto de alta manual de `User` hoy
  (`admin/users/route.ts:247`), reusando `validateRut()`/`normalizeRut()`
  ya existentes

### Etapa 2 — Reframe de scope ejecutivo-tier
**Estado: PENDIENTE — no depende de la Etapa 1**

Los sitios de los 35 que solo tocan roles ejecutivo-tier (CEO, ACCOUNT_OWNER,
HR_ADMIN, HR_MANAGER, HR_OPERATOR, FOCALIZAHR_ADMIN) dejan de intentar resolver
`Employee` para su scope — usan `GLOBAL_ACCESS_ROLES`, patrón ya existente.
Cubre también el caso "ejecutivo/holding sin Employee en esta cuenta" (persona
paga por otra entidad legal, nunca va a tener fila en este `Employee`).

### Etapa 3 — Recableo de los 35 sitios
**Estado: PENDIENTE — depende de Etapa 1**

Reemplazar `findFirst({email})` por `userContext.employeeId` en cada sitio.
Orden de prioridad: primero los 10 "silenciosos" (grupo B del Gate 0), empezando
por el portal EVALUATOR (3 de sus 4 sitios). Un gate por módulo (Metas, PDI,
Performance, Evaluator, Succession, Auth), smoke test real por gate.

### Etapa 4 — Aprovisionamiento en el resto de los puntos de creación
**Estado: PENDIENTE — depende de Etapa 1**

U2 (`auth/user/login/route.ts:82`, lazy-create ejecutivo), E1
(`EmployeeSyncService.ts:969`), E2 (`OnboardingEnrollmentService.ts:427`).
Decidir si vale pedir/chequear RUT en cada uno, sabiendo que U2 legítimamente
no va a matchear en el caso ejecutivo/holding (Etapa 2 ya lo cubre, no es un
fallo ahí).

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

## 3. Casos que esto NO resuelve, a propósito

- Ejecutivo/holding sin `Employee` en esta cuenta → lo cubre la Etapa 2, no el
  vínculo (no hay fila contra la cual matchear, con o sin RUT).
- Backfill de RUT contra la data de hoy → bloqueado hasta Etapa 5, nunca contra
  data de dev/prueba.

## Changelog
- v1 (2026-07-24): creación. Gate 0 (Anexo A) sellado. Etapas 1-5 definidas,
  ninguna iniciada.
