# PLAN — Etapa 1 (Fundación): vínculo Employee↔User

> **Estado:** PROPUESTA de diff para revisión de Victor. **NO implementado.**
> **Fecha:** 2026-07-24 · **Decide:** Victor
> **Padre:** `.claude/tasks/ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md` (Etapa 1)
> **Precedente directo:** `Department.responsableId` (`ARQUITECTURA_RESPONSABLE_DEPARTAMENTO.md`,
> sellado y en producción). **Anexo A:** `.claude/GATE0/GATE0_VINCULO_EMPLOYEE_USER_ANALISIS_IMPACTO.md`

Etapa 1 = **fundación aditiva**: crear el campo, exponer `employeeId` en el contexto,
capturar RUT en el alta manual de User. **No** recablea los 35 sitios (Etapa 3), **no**
toca U2/E1/E2 (Etapa 4), **no** backfillea (Etapa 5).

---

## Decisiones (con razonamiento) — puntos 1-5 del encargo

### 1. Schema: ¿`Employee.userId` o `User.employeeId`? → **`User.employeeId`**

**Recomendación: FK en `User.employeeId String? @unique`, referencia a `Employee.id`,
`onDelete: SetNull`. Relación 1:1 opcional en ambos lados; `@unique` en un solo lado basta.**

Razonamiento:
- **La dirección de consulta dominante es User→Employee** ("dado este usuario logueado,
  ¿cuál es su Employee?" — los 35 sitios). Poner la FK en `User` hace que ese dato sea
  una **columna del row que el login ya carga** (`findUnique` en `login/route.ts:34`
  devuelve todos los escalares) → cachearlo en el JWT no cuesta un query extra. Si la FK
  viviera en `Employee.userId`, resolver "el Employee de este user" en login requeriría un
  `employee.findFirst({userId})` adicional. Interactúa con la decisión 3: `User.employeeId`
  la hace gratis.
- **1:1 con nullable en ambos lados** honra los dos huecos legítimos y permanentes:
  - Employee **sin** User → la mayoría hoy (nómina que nunca se loguea).
  - User **sin** Employee → ejecutivo/holding (paga por otra entidad legal; nunca va a
    tener fila en este `Employee`). El diseño **no** asume que todo User tiene Employee.
- **`@unique` en `User.employeeId` alcanza para el 1:1 completo:** la columna es
  single-valued (un User → a lo sumo un Employee) y `@unique` garantiza que un mismo
  Employee no sea reclamado por dos Users. No hace falta `@unique` del lado Employee; su
  relación inversa es un `User?` nullable normal.
- **`onDelete: SetNull`** — idéntico a `responsableId` (`schema:804`). Si un Employee se
  borra en duro (raro; normalmente van `isActive:false`), el User conserva su login y
  `employeeId` cae a NULL. Nunca cascada que mate una cuenta de acceso.

Contraste con el precedente: `Department.responsableId → Employee.id` puso la FK en el
lado "que tiene-un" puntero a la identidad. Acá es lo mismo: **User tiene-un Employee**
(la persona detrás del login), y además la dirección de consulta lo confirma.

### 2. `User.nationalId`: nullable, ¿único por accountId o global? → **`@@unique([accountId, nationalId])`**

**Recomendación: `nationalId String? @map("national_id")` con `@@unique([accountId, nationalId])`
— espejo exacto de Employee.**

Razonamiento:
- `Employee` ya define `@@unique([accountId, nationalId])` (`schema:1908`, *"RUT único por
  account"* `:1753`). El RUT es único **dentro de una cuenta**, no global — la misma persona
  puede existir en varias cuentas (consultor, `FOCALIZAHR_ADMIN` multi-cuenta) como filas
  distintas. `User` también es account-scoped (`User.accountId`). Único global prohibiría
  que un mismo RUT tenga login en dos cuentas — demasiado estricto e inconsistente con
  Employee.
- Espejar la constraint de Employee es lo que **habilita el join fuerte** que persigue todo
  el proyecto: `User(accountId, nationalId) == Employee(accountId, nationalId)`. Misma llave,
  mismo scope.
- **NULLs conviven:** Postgres trata cada NULL como distinto en una unique compuesta, así que
  N Users sin RUT en la misma cuenta no colisionan. Aditivo puro sobre la tabla actual (nace
  todo NULL, cero conflictos posibles porque la columna es nueva).

### 3. `extractUserContext`: ¿lookup por request o cache en JWT? → **cache en JWT al login**

**Recomendación: cachear `employeeId` en el JWT al login y exponerlo por header
`x-employee-id`, exactamente como se hace hoy con `userName`. `extractUserContext` sigue
**síncrono y solo-headers** — nunca toca BD.**

Trade-off explícito (por qué esta y no la otra):
- **`extractUserContext` es síncrona y header-only** (`AuthorizationService.ts:137-153`),
  invocada por **~200 call-sites**. Meterle un `await prisma.employee.findFirst(...)`:
  (a) la vuelve async → rompe los ~200 importadores, y (b) agrega **un query indexado a CADA
  request autenticado**, para un valor que es **NULL en la mayoría** de los Users (casi
  ninguno tiene Employee). Es el peor lugar para pagar ese costo.
- El precedente `userName` **no es un lookup**: viaja en el JWT → el middleware lo reinyecta
  como header (`middleware.ts:212`) → `extractUserContext` lo lee sin BD. Espejar `userName`
  **es** la opción JWT. Coste por request: cero.
- **Costo de la opción JWT = staleness.** Si el vínculo se crea/cambia **después** del último
  login, el token no lo refleja hasta re-emitirse (próximo login). Por qué es aceptable en
  Etapa 1 y más allá:
  - Etapa 1 nace sin vínculos (todo NULL) → todo token lleva `employeeId=null` legítimamente
    hasta que Etapa 4/5 pueblen algo. No hay nada que quedar stale.
  - En el **auto-aprovisionamiento en login (Etapa 4)** el vínculo se setea en el **mismo
    request** que emite el token → cero staleness en ese camino.
  - En backfill (Etapa 5) el pickup es el siguiente login del usuario.
  - Los consumidores (Etapa 3) **ya deben manejar `employeeId=null` explícito** (regla
    transversal B.9). Un null-por-staleness recorre el mismo camino seguro que ya soportan.
  - La ventana de staleness = TTL del token. No fuerza logout de nadie: tokens viejos sin el
    claim → header ausente → `employeeId=null` → camino seguro.

### 4. `admin/users/route.ts:247`: ¿auto-match ahí o estricto Etapa 4? → **solo capturar RUT en Etapa 1; el auto-match va a Etapa 4**

**Recomendación: en Etapa 1, `admin/users` captura + valida + normaliza + almacena
`User.nationalId`. NO intenta el auto-link contra `Employee.nationalId` todavía.**

Razonamiento (reconozco que el costo marginal del match es bajo, pero deferirlo es lo correcto):
- El match tiene **casos borde con decisiones propias**: Employee inactivo, RUT inexistente,
  RUT hallado pero ya `linked` a otro User, colisión con `isActive`. Eso amerita su **propio
  gate con smoke tests**, no una línea colada en el alta.
- **Una sola política de aprovisionamiento, escrita una vez.** U1 (`admin/users`), U2
  (login lazy), E1 (`EmployeeSyncService`), E2 (`OnboardingEnrollmentService`) deben aplicar
  **las mismas reglas de match**. Hacer U1 ahora y U2/E1/E2 en Etapa 4 = dos caminos de
  provisioning escritos en momentos distintos → divergencia (exactamente la clase de bug de
  lógica clonada que el proyecto ya viene sufriendo). Mejor: policy única en Etapa 4 sobre
  los 4 puntos.
- **Valor marginal del match-ahora ≈ 0 pre-lanzamiento:** no hay nómina real cargada contra
  la cual matchear. El valor aparece cuando existe Employee real — que es justo cuando corren
  Etapa 4/5.
- Capturar el RUT **sí** aporta desde ya: puebla `User.nationalId` para que Etapa 4/5 (o un
  simple re-login) puedan matchear después, y `validate/normalize` ahora evita basura.

Alternativa (si Victor la prefiere): el match en U1 es un añadido de ~5 líneas, bajo riesgo
si se guarda estricto (setear `employeeId` **solo si** existe exactamente **un** Employee
`isActive` con ese `(accountId, nationalId)` **y** su lado no está ya tomado). Pero rompe la
"policy única" y adelanta casos borde. **Mi recomendación es deferir.**

### 5. ¿`db push` alcanza, o algo especial por tocar `User` (auth)? → **`db push` alcanza, con el protocolo prod estándar**

- El proyecto **no usa migraciones**; el mecanismo es `db push` (dev) + scripts idempotentes.
  ⚠️ Recordatorio: `DATABASE_URL` = **producción** (única BD, pre-lanzamiento). Todo `db push`
  toca prod directo.
- El cambio es **puramente aditivo**: 2 columnas nullable (`national_id`, `employee_id`), 1 FK,
  1 unique compuesta, 1 unique simple. **Sin migración de datos.** En Postgres: agregar columna
  nullable es instantáneo; la FK valida filas existentes pero **todas son NULL** → trivial;
  las unique construyen índice sobre columnas nuevas 100% NULL → sin conflicto posible. Sobre
  tabla `users` pre-lanzamiento (pocas filas) es negligible.
- **No requiere SQL manual ni tratamiento DDL especial.** Lo "especial" por ser `User` (auth)
  no es el DDL sino el entorno:
  1. **Confirmar con Victor antes de correr** (regla prod-writes).
  2. `npx --no-install prisma validate` antes.
  3. En Windows: `Stop-Process -Name node` antes de `db push`/`generate` (EPERM si hay node vivo).
  4. `prisma db push` + `prisma generate` (el build regenera el client).
  5. **Smoke post-push:** login sigue emitiendo token + un endpoint autenticado responde.
     Agregar columnas **no** rompe los `select`/`include` existentes del login (`findUnique`
     con `include` devuelve los escalares nuevos; nadie los exige aún).
- Único matiz vs `responsableId`: este cambio agrega **UNIQUE constraints**. Como `national_id`
  y `employee_id` son columnas nuevas 100% NULL, ninguna constraint puede fallar al aplicarse.
  (Si en el futuro hubiera RUTs duplicados por cuenta, la constraint los bloquearía — deseable.)

---

## Diff propuesto

### A. `prisma/schema.prisma` — modelo `User` (843-863)

```diff
 model User {
   id           String    @id @default(cuid())
   accountId    String    @map("account_id")
   email        String    @unique
   name         String
   passwordHash String    @map("password_hash")
   role         String    @default("VIEWER")
   departmentId String?   @map("department_id")
+  // 🆕 Vínculo Employee↔User (Etapa 1 — Fundación). Aditivo, nace NULL.
+  // nationalId: RUT del titular del login. Único por cuenta, igual que Employee
+  // (schema:1908). Habilita el match fuerte User(accountId,rut)==Employee(accountId,rut).
+  nationalId   String?   @map("national_id")
+  // User.employeeId: SIEMPRE verificar accountId igual antes de escribir
+  // — el FK no lo garantiza (User y Employee de cuentas distintas podrían
+  // enlazarse sin este chequeo explícito en capa de aplicación)   [§2bis R1]
+  employeeId   String?   @unique @map("employee_id")
   isActive     Boolean   @default(true) @map("is_active")
   lastLoginAt  DateTime? @map("last_login_at")
   createdAt    DateTime  @default(now()) @map("created_at")
   updatedAt    DateTime  @updatedAt @map("updated_at")

   // Relaciones
   account    Account     @relation(fields: [accountId], references: [id], onDelete: Cascade)
   department Department? @relation(fields: [departmentId], references: [id])
+  employee   Employee?   @relation("EmployeeUser", fields: [employeeId], references: [id], onDelete: SetNull)

   @@index([accountId])
   @@index([email])
+  @@unique([accountId, nationalId], map: "idx_users_account_national")
   @@map("users")
 }
```

> Nota: `@unique` en `employeeId` ya crea índice → no se agrega `@@index([employeeId])` aparte.

### B. `prisma/schema.prisma` — modelo `Employee` (relación inversa, ~1867)

```diff
   history       EmployeeHistory[]
   participants  Participant[]
   exitRecords   ExitRecord[]
+
+  // 🆕 Vínculo Employee↔User (Etapa 1) — inversa 1:1 opcional. La FK vive en User.
+  user          User?             @relation("EmployeeUser")
```

### C. `src/lib/services/AuthorizationService.ts` — `extractUserContext` (137-153)

```diff
 export function extractUserContext(request: Request): {
   accountId: string;
   role: string | null;
   departmentId: string | null;
   userId: string | null;
   userName: string | null;
+  employeeId: string | null;
 } {
   const rawUserName = request.headers.get('x-user-name');
   return {
     accountId: request.headers.get('x-account-id') || '',
     role: request.headers.get('x-user-role'),
     departmentId: request.headers.get('x-department-id'),
     userId: request.headers.get('x-user-id'),
-    userName: rawUserName ? decodeURIComponent(rawUserName) : null
+    userName: rawUserName ? decodeURIComponent(rawUserName) : null,
+    // Vínculo Employee↔User: viaja en el JWT, reinyectado por el middleware.
+    // '' (sin claim / sin vínculo) se normaliza a null → contrato "null explícito".
+    employeeId: request.headers.get('x-employee-id') || null
   };
 }
```

### D. `src/middleware.ts` — inyección de header (bloque `if (payload.userId)`, ~206-213)

```diff
   if (payload.userId) {
     headers.set('x-user-id', payload.userId);
     headers.set('x-user-role', payload.userRole || '');
     headers.set('x-department-id', payload.departmentId || '');
     headers.set('x-user-email', payload.userEmail || '');
     // ✅ FIX: encodeURIComponent para caracteres no-ASCII (ñ, tildes, etc.)
     headers.set('x-user-name', encodeURIComponent(payload.userName || ''));
+    // Vínculo Employee↔User (Etapa 1). '' si el token no lo trae (login previo al
+    // cambio, o User sin Employee). extractUserContext lo normaliza a null.
+    headers.set('x-employee-id', payload.employeeId || '');
   }
```

### E. `src/app/api/auth/user/login/route.ts` — claim en el JWT (jwtPayload, ~132-150)

```diff
     const jwtPayload = {
       // Campos para User
       userId: user.id,
       userEmail: user.email,
       userName: user.name,
       userRole: user.role,
       departmentId: user.departmentId,
+      // Vínculo Employee↔User (Etapa 1). Columna ya presente en el row cargado por
+      // findUnique (línea 34) — cero query extra. null para ejecutivo/holding y para
+      // todo User hasta que Etapa 4/5 pueble el vínculo.
+      employeeId: user.employeeId ?? null,
```

> El fetch del User (`findUnique` con `include`, línea 34) ya devuelve los escalares nuevos;
> **no** hay que tocar el `select`. La rama de auto-migración Account→User (`:82`) crea el User
> sin `employeeId` → `null`, correcto (ejecutivo sin nómina).

### F. `src/app/api/admin/users/route.ts` — capturar RUT (NO auto-match)

```diff
 // imports (tope del archivo)
+import { validateRut, normalizeRut } from '@/lib/services/EmployeeSyncService';
```

```diff
     const body = await request.json();
-    const { email, name, password, role, departmentId, targetAccountId } = body;
+    const { email, name, password, role, departmentId, targetAccountId, nationalId } = body;
```

```diff
     // (junto a las validaciones existentes de email/role, ~línea 179-202)
+    // 🆕 RUT opcional del titular del login. Si viene, se valida y normaliza (mismo
+    //    validateRut/normalizeRut que EmployeeSyncService). NO se auto-linkea a Employee
+    //    todavía — el aprovisionamiento (match por RUT) es Etapa 4, policy única.
+    let normalizedNationalId: string | null = null;
+    if (nationalId != null && String(nationalId).trim() !== '') {
+      if (!validateRut(String(nationalId))) {
+        return NextResponse.json(
+          { error: 'RUT inválido' },
+          { status: 400 }
+        );
+      }
+      normalizedNationalId = normalizeRut(String(nationalId));
+    }
```

```diff
     const newUser = await prisma.user.create({
       data: {
         email: email.toLowerCase().trim(),
         name: name.trim(),
         passwordHash,
         role,
         departmentId: departmentId || null,
         accountId: effectiveAccountId,
         isActive: true,
+        nationalId: normalizedNationalId,
       },
```

> **No** se agrega `employeeId` en el create (queda NULL). El match es Etapa 4.
> Un choque de RUT duplicado por cuenta lo atrapa la unique `@@unique([accountId, nationalId])`
> → Prisma tira P2002; si Victor quiere mensaje amable, se envuelve el create en try/catch en
> ese gate (opcional, no bloqueante para Etapa 1).

---

## Orden de ejecución + verificación (cuando se apruebe)

1. Editar `schema.prisma` (A + B).
2. `Stop-Process -Name node` (Windows/EPERM) → `npx --no-install prisma validate` →
   **confirmar con Victor** → `npx --no-install prisma db push` → `prisma generate`.
3. Editar C, D, E, F.
4. `npx --no-install tsc --noEmit` + `npm run build` (deben pasar limpios).
5. Smoke real: login emite token con claim `employeeId` (null esperado); un endpoint
   autenticado responde; `admin/users` acepta alta con y sin `nationalId`, rechaza RUT basura.
6. Commit (docs/impl separados si aplica), sin push (Victor pushea).

## Lo que Etapa 1 explícitamente NO hace
- No recablea ninguno de los 35 sitios `findFirst({email})` (Etapa 3).
- No toca U2/E1/E2 — login lazy, EmployeeSyncService, OnboardingEnrollmentService (Etapa 4).
- No auto-linkea por RUT en ningún punto (Etapa 4).
- No backfillea vínculos contra data existente (Etapa 5, contra nómina real).
- No fuerza re-login de sesiones activas (tokens viejos → `employeeId=null`, camino seguro).

## Archivos tocados (6) — resumen
| # | Archivo | Cambio | Riesgo |
|---|---|---|---|
| A | `prisma/schema.prisma` (User) | 2 cols + FK + unique | Aditivo, nace NULL |
| B | `prisma/schema.prisma` (Employee) | relación inversa | Aditivo |
| C | `AuthorizationService.ts` | +`employeeId` en contexto | Aditivo (callers lo ignoran) |
| D | `middleware.ts` | +header `x-employee-id` | Aditivo |
| E | `auth/user/login/route.ts` | +claim JWT | Aditivo, sin query extra |
| F | `admin/users/route.ts` | capturar+validar RUT | Aditivo, sin auto-match |
