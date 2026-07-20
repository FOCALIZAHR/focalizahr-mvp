# 🔒 SPEC_MIDDLEWARE_LEGACY_ROLE_HARDENING_v1
### Proyecto propio, 1 gate de investigación + 1 gate de implementación
### Julio 2026 — origen: sonda de seguridad durante Gate C (Clima×Metas)

---

## 0. CONTEXTO Y ORIGEN

Durante la verificación de Gate C (bifurcación de rol en CreateGoalWizard), una sesión
paralela de Code corrió una sonda de seguridad sobre `middleware.ts` para descartar un
diagnóstico previo (headers no reenviados al handler — **descartado, el sistema nuevo
funciona bien**, confirmado empíricamente con `/api/vitals/summary`, `/api/clima/results`,
`/api/compliance/report`).

La sonda encontró un hallazgo real y distinto, no relacionado con el diagnóstico original.
Ver `INVESTIGACION_AUTH_LEGACY_JULIO_2026.md` sección 4bis para la bitácora completa de
cómo se llegó a esto.

---

## 1. EL PROBLEMA

**Evidencia (sonda de 5 casos, header forjado por el cliente):**

| Caso | Resultado |
|---|---|
| Token moderno (con `userId`) + header forjado | Middleware sobrescribe — sin riesgo |
| Token moderno + `x-account-id` de otra cuenta | Sin cruce entre cuentas — sin riesgo |
| Token legacy (sin `userId`), sin forja | 403 — correcto |
| **Token legacy + `x-user-role` forjado** | **200 con datos del rol forjado — vulnerable** |

**Causa raíz** (`src/middleware.ts:203-213`):

```typescript
const headers = new Headers(request.headers);   // clona TODOS los headers del cliente,
                                                  // incluido cualquier x-user-* forjado

if (payload.userId) {
  headers.set('x-user-id', payload.userId);
  headers.set('x-user-role', payload.userRole || '');
  headers.set('x-department-id', payload.departmentId || '');
  headers.set('x-user-email', payload.userEmail || '');
  headers.set('x-user-name', encodeURIComponent(payload.userName || ''));
}
// ← si NO hay payload.userId, este bloque completo se salta.
//   Lo que el cliente mandó en x-user-id / x-user-role / x-department-id / x-user-email
//   sigue en el objeto `headers` sin tocar, porque se clonó del request original.
```

Un token legacy (emitido por `/api/auth/login`, sin `userId` en el payload) nunca entra al
`if`. Si el cliente manda su propio `x-user-role: FOCALIZAHR_ADMIN` junto con ese token,
`extractUserContext()` lo lee tal cual — y `hasPermission()` lo cree.

**Alcance:** escalada de privilegio **dentro de la propia cuenta** (no cruza tenants —
`x-account-id` se setea siempre, línea 216, fuera del `if`). Requiere poseer credenciales
válidas de `Account` — hoy ningún cliente del frontend las usa (`AuthForm.tsx` solo llama a
`/api/auth/user/login`), pero `/api/auth/login` sigue vivo y públicamente alcanzable
(whitelist de `middleware.ts`, sección de `publicPaths`).

---

## 2. DECISIÓN DE ALCANCE (tomada, no re-discutir)

Proyecto aislado, no dentro de ningún gate en curso. `middleware.ts` está marcado
"NO modificar sin plan — afecta RBAC global"; tres sesiones de Code tienen ojos ahí
simultáneamente hoy. Coordinación centralizada en este chat de arquitectura.

**Descartadas explícitamente:**
- Fix dentro de Gate C (Metas) — mezclaría un cambio de plataforma con un proyecto de
  portada, riesgo de reversión de Gate C por algo fuera de su alcance.
- Dejarlo solo como deuda documentada sin fecha — es una escalada de privilegio confirmada
  con evidencia, no una hipótesis; no es proporcional dejarla abierta indefinidamente.

---

## 3. GATES

---

## 2bis. RESGUARDOS OPERACIONALES (obligatorio leer antes de Gate 0)

Este archivo se está editando desde múltiples sesiones de Code en paralelo hoy mismo
(Gate C de Metas, este proyecto, posiblemente otras). Estas reglas no son opcionales:

```yaml
1. ANTES DE CUALQUIER COSA: git status --stat. Si hay cambios de otra sesión sin
   commitear que no son tuyos, PARAR y reportar a Victor — no continuar, no hacer
   git stash, no descartar nada. Contaminación de staging area entre sesiones
   paralelas es un riesgo conocido de este repo.

2. ANTES DE EDITAR middleware.ts: leer el archivo completo tal como está AHORA en
   disco, no asumir que coincide con los números de línea de este spec. Otra sesión
   puede haberlo tocado entre que se escribió este documento y que tú lo ejecutas.
   Si el bloque de código que describe la sección 1 (líneas ~205-213) no coincide
   con lo que ves, PARAR y reportar la diferencia antes de aplicar el diff.

3. GATE 0 y GATE A son pasos separados con aprobación explícita de Victor entre
   medio. Terminar Gate 0, reportar los 5 hallazgos, y ESPERAR confirmación antes
   de escribir una sola línea de Gate A. No asumir luz verde por default.

4. UN SOLO COMMIT, UN SOLO ARCHIVO (middleware.ts). No mezclar con ningún otro
   cambio que encuentres pendiente en el working tree, aunque parezca relacionado.
   git add por archivo, nunca -A.

5. NO HACER git push bajo ninguna circunstancia. Victor es la única persona que
   ejecuta push a main, sin excepción, incluyendo este proyecto.

6. Si en Gate 0 (punto 1) aparece algún endpoint que dependía sin saberlo del
   comportamiento actual: NO decidir solo qué hacer con él. Reportarlo y esperar
   decisión — puede cambiar el diseño del fix de Gate A.

7. No usar prisma migrate dev en ningún punto de este proyecto (no debería hacer
   falta, no hay cambio de schema — si en algún momento parece necesario, es señal
   de que algo se salió del alcance definido en la sección 4, PARAR).
```

---

### GATE 0 — Auditoría read-only (antes de tocar código)

```yaml
OBJETIVO: confirmar que nadie depende del comportamiento actual (headers legacy sin
  limpiar), y levantar todo lo necesario para diseñar el fix con evidencia, no con
  suposición.

PROMPT PARA CODE (modo solo lectura, no modificar nada):

  1. Grep en src/app/api/ de todo endpoint que use extractUserContext() o hasPermission()
     y que, además, tenga algún camino que NO exija userContext.accountId (es decir, que
     tolere un x-user-role vacío/null sin devolver 401/403). Si existe alguno así, listarlo
     con file:line — sería un endpoint que hoy depende, sin saberlo, de que un token legacy
     pueda pasar con rol vacío/degradado.

  2. Confirmar el tiempo de expiración (`exp`) del JWT que emite /api/auth/login (legacy) —
     buscar en lib/auth.ts o donde se firme ese token. Necesito saber cuánto puede durar un
     token legacy ya emitido y todavía válido dando vueltas en algún navegador.

  3. Confirmar si existe hoy algún flujo (activo o en diseño, incluyendo specs en
     .claude/tasks/) que emita JWT SIN userId por diseño (no por ser legacy) — en particular
     cualquier avance del sistema de EVALUATOR-por-ciclo (auth vía link vinculado a
     PerformanceCycle). Si existe algo, aunque sea parcial, reportarlo — el fix de este
     proyecto tiene que contemplar ese caso a propósito, no tratarlo como "legacy" por
     accidente.

  4. Confirmar que headers.delete() existe y se comporta como se espera sobre el objeto
     Headers de Next.js Edge Runtime (no Node) — verificar en la versión de Next.js del
     proyecto (confirmada 14.2.33 en la sesión anterior). Si hay alguna diferencia de
     comportamiento entre delete() de un header que nunca se seteó vs uno que sí, anotarlo.

  5. Correr la sonda original (token legacy + x-user-role forjado) UNA VEZ MÁS antes del
     fix, para tener el "antes" documentado con timestamp de esta sesión — no reusar el
     resultado de la sesión de Gate C.

  Reportar todo con file:line/evidencia. No proponer diff todavía.

CRITERIO DE SALIDA: los 5 puntos respondidos con evidencia. Si el punto 1 encuentra algún
  endpoint que dependía del comportamiento actual, PARAR y traer la lista antes de seguir
  a Gate A — cambia el diseño del fix.
```

### GATE A — Implementación quirúrgica + smoke

```yaml
ALCANCE: 1 archivo, ~6-8 líneas. src/middleware.ts, bloque de inyección de contexto de
  usuario (líneas ~205-213 en la versión auditada hoy — confirmar número exacto contra
  Gate 0 antes de editar, puede haber cambiado).

DIFF PROPUESTO (a validar contra hallazgos de Gate 0, en particular punto 3 — EVALUATOR):

  if (payload.userId) {
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-role', payload.userRole || '');
    headers.set('x-department-id', payload.departmentId || '');
    headers.set('x-user-email', payload.userEmail || '');
    headers.set('x-user-name', encodeURIComponent(payload.userName || ''));
  } else {
    // Token sin userId (legacy, o cualquier otro tipo futuro sin identidad de User):
    // limpiar explícitamente lo que el cliente haya mandado, no dejarlo pasar.
    headers.delete('x-user-id');
    headers.delete('x-user-role');
    headers.delete('x-department-id');
    headers.delete('x-user-email');
    headers.delete('x-user-name');
  }

NO TOCAR: x-account-id (línea 216, fuera del if — sigue siendo correcto que se setee
  siempre, tanto legacy como nuevo, para multi-tenant). x-effective-role (uso interno del
  propio middleware, getEffectiveRole ya maneja el caso legacy correctamente vía
  payload.role). Restricciones de EVALUATOR y admin routes (líneas ~229-295) — no depende
  de este cambio.

REGLAS ENTERPRISE APLICABLES: cero hardcode de nombres de header fuera de los ya
  existentes en el archivo (reutilizar los mismos strings 'x-user-id' etc. ya usados
  arriba, no introducir variantes).
```

### GATE A — SMOKE (obligatorio, con evidencia real, no solo lectura de código)

```yaml
Repetir la sonda original + casos nuevos. Los primeros 4 son regresión (deben seguir
igual que antes del fix); el 5º es el que debe CAMBIAR de resultado.

  1. Token moderno, sin forja               → 200, sin cambio
  2. Token moderno + header forjado          → 200 con datos REALES (middleware sigue
                                                sobrescribiendo) — sin cambio
  3. Token moderno + x-account-id de otra
     cuenta                                  → 200 con datos de SU PROPIA cuenta —
                                                sin cambio (accountId nunca dependió
                                                del if)
  4. Token legacy, sin forja                 → 403 — sin cambio
  5. Token legacy + x-user-role forjado      → DEBE CAMBIAR de 200 a 403/401
                                                (este es el fix)

  6. [nuevo] Token legacy + x-user-id forjado (sin forjar role) → confirmar que tampoco
     cuela una identidad de usuario ajena.

  7. [nuevo] Cualquier endpoint marcado en Gate 0 punto 1 (si los hubo) → confirmar que
     su comportamiento sigue siendo el correcto para el negocio, no solo "no rompe".

  8. Regresión amplia: correr smoke existente de Gate C (Metas, tokens acuñados por rol)
     completo una vez más DESPUÉS del fix — confirmar 0 cambios en esos 8 escenarios,
     ya que dependen del mismo middleware.

  tsc --noEmit + npm run build limpios.

SELLO: commit único, archivo único. Mensaje de commit debe explicar el POR QUÉ (la
  escalada confirmada), no solo el QUÉ, para que quede trazable en git blame igual que
  se hizo con el fix del doble-clic de login.
```

---

## 4. FUERA DE ALCANCE (explícito, no confundir con este proyecto)

- El "reenvío general de headers" del middleware — ya se investigó y se descartó como
  problema; no aplica aquí.
- Migración de las 28 rutas legacy al patrón `extractUserContext`+`hasPermission` —
  proyecto propio, ver `INVESTIGACION_AUTH_LEGACY_JULIO_2026.md` sección 5.
- Cierre completo de `/api/auth/login` — proyecto propio. Nota: una vez cerrado ese
  endpoint, este vector desaparece por completo (no puede existir un token sin `userId`
  si no hay forma de emitirlo) — este hardening es la mitigación mientras tanto, no un
  sustituto de cerrar el endpoint.

---

## 5. DEPENDENCIAS

```yaml
CON proyecto EVALUATOR-por-ciclo (futuro, no iniciado):
  Si ese sistema emite tokens sin userId por diseño, este hardening los dejaría sin
  contexto de usuario también — confirmar en Gate 0 punto 3 si ya hay diseño avanzado,
  y si lo hay, este gate debe esperar a que se resuelva cómo esos tokens declaran su
  identidad (¿otro campo? ¿userId propio con role fijo EVALUATOR?).

CON proyecto de migración de 28 rutas legacy:
  Independiente — ese proyecto no depende de este fix ni viceversa. Pueden avanzar en
  paralelo.

CON cierre de /api/auth/login:
  Este hardening es la mitigación de corto plazo; el cierre del endpoint es el cierre
  definitivo del vector. No bloquean entre sí.
```

---

*Spec v1 — lista para Gate 0. Actualizar esta misma sección de gates al sellar cada uno,
con commit hash + evidencia de smoke, siguiendo la convención de SPEC_GOALCYCLE_v4.md.*

---
---

# 6. CIERRE EN PAUSA — 2026-07-20

> **ESTADO: ⏸️ PAUSADO.** No abandonado. Gate 0 ejecutado y cerrado con evidencia;
> Gate A **NO sellado** — se demostró que el diff especificado en §3 es un no-op.
> `src/middleware.ts` quedó **pristine**, sin commit de código. Cero cambios en `src/`.

---

## 6.1 Gate 0 — resultados

Los 5 puntos de §3 quedaron respondidos. Resumen; el detalle de sondas está en §6.2.

| # | Pregunta | Resultado |
|---|---|---|
| 1 | ¿Alguien depende del comportamiento actual? | **Sí — 36 paths fail-open en 30 archivos.** Inventario completo en `.claude/tasks/INVENTARIO_RUTAS_FAIL_OPEN_ROL_v1.md`. Disparó el criterio de PARAR de §3 |
| 2 | `exp` del token legacy | **7d** (`src/lib/auth.ts:78`), sin refresh, cookie `maxAge` idéntico. El token también viaja en el body JSON → puede vivir fuera del HttpOnly |
| 3 | ¿JWT sin `userId` por diseño? | **No hay bloqueador.** EVALUATOR-por-ciclo no existe: ni código, ni spec, ni idea. EVALUATOR es un `User` normal con `userId`. El único token sin `userId` por diseño es el service token, y sale antes por el early-return de `middleware.ts:192-198` |
| 4 | `headers.delete()` en Edge Runtime | **Ver §6.2 — la respuesta inicial fue un FALSO NEGATIVO** |
| 5 | Sonda "antes" con timestamp propio | `2026-07-20T10:19Z` — legacy sin forja → 403; legacy + `x-user-role: FOCALIZAHR_ADMIN` → **200**. Vector reproducido |

**Hallazgo lateral (punto 2):** los tokens legacy **no son solo históricos** —
`/api/auth/register:118` y `lib/auth.ts:352` **siguen acuñándolos**. La ventana no
es "7 días desde el último emitido"; es permanente mientras esos paths vivan.
Alimenta el proyecto referenciado en §6.5.

---

## 6.2 ⚠️ CORRECCIÓN AL GATE 0 — falso negativo en el punto 4

El primer veredicto del punto 4 fue **"el middleware sí sobrescribe headers del
request, `headers.delete()` servirá"**. **Ese veredicto era falso** y se corrige acá
para que nadie lo reuse.

**Cómo se produjo:** el test comparaba la respuesta de la cuenta propia contra la
misma request con `x-account-id` forjado a una cuenta ajena, y concluía "idénticos
→ el forjado fue ignorado". Pero la cuenta propia tenía **0 departamentos**, así
que el fingerprint no discriminaba: ambas respuestas daban vacío por razones
distintas. Un empate espurio leído como confirmación.

**Al rehacerlo** con una cuenta ajena de **16 departamentos** y ground truth
medido (token acuñado para esa cuenta → `nDepts=16`), el resultado real:

| Operación del middleware sobre `headers` | ¿Gana sobre el header que mandó el cliente? |
|---|---|
| `headers.set(k, v)` con **valor no vacío** | **SÍ** — pisa el del cliente. Por eso `x-account-id` (línea 216) nunca se pudo forjar |
| `headers.delete(k)` | **NO** — es invisible para el handler; sobrevive el del cliente |
| `headers.set(k, '')` con **valor vacío** | **NO** — un valor vacío tampoco viaja; se comporta igual que `delete` |

**Causa raíz.** `middleware.ts` retorna `NextResponse.next({ headers })`, **no**
`NextResponse.next({ request: { headers } })`. Sin la forma `request:`, Next nunca
emite `x-middleware-override-headers`
(`next/dist/server/web/spec-extension/response.js` → `handleMiddlewareField`, exige
`init.request.headers`), y sin ese header el consumidor
(`next/dist/server/lib/router-utils/resolve-routes.js:353-378`) no ejecuta la rama
que **poda** los headers del request. Resultado: la fusión es **aditiva por valor
no vacío**. El middleware solo puede *pisar* headers, nunca *quitarlos*.

**Consecuencia directa: el diff propuesto en §3 (Gate A) es un no-op.**
Se aplicó literal y se verificó que el `delete()` **sí se ejecutaba** (el eco de
esos headers en la respuesta HTTP pasó de `FOCALIZAHR_ADMIN` a ausente) y aun así:

```
CASO 5 · legacy + x-user-role forjado → 200   ← el vector seguía abierto
```

La variante `headers.set('x-user-role', '')` se probó también: **mismo 200**.
No hay forma de cerrar el vector desde dentro de ese bloque `if/else`.

---

## 6.3 Fix que SÍ funciona — verificado, no sellado

Requiere **dos cambios**, no uno:

1. `NextResponse.next({ headers })` → `NextResponse.next({ request: { headers } })`
   en **ambos** call sites.
   - línea **197** — rama de service tokens
   - línea **300** en el archivo pristine (**312** con el bloque `else` de Gate A ya insertado)
2. El bloque `else { headers.delete(...) }` de §3, tal como está especificado.

**Evidencia — sonda completa contra `/api/vitals/summary`, dev server real:**

| Caso | Antes del fix | Con el fix | Veredicto |
|---|---|---|---|
| 1 · moderno sin forja | 200 | **200** | sin cambio ✅ |
| 2 · moderno + `x-user-role` forjado | 200 datos reales | **200 datos reales** | sin cambio ✅ |
| 3 · moderno + `x-account-id` de otra cuenta | 200 cuenta propia | **200 cuenta propia** | sin cambio ✅ |
| 4 · legacy sin forja | 403 | **403** | sin cambio ✅ |
| 5 · legacy + `x-user-role` forjado | **200** | **403** | **CERRADO** 🎯 |
| 6 · legacy + `x-user-id` forjado | 403 | **403** | sin cambio ✅ |

Regresión medida del cambio: esos headers **dejan de ecoarse en la respuesta HTTP**.
Se grepeó `src/components/`, `src/hooks/` y `src/app/dashboard/` — **nada** del
cliente los lee desde la respuesta. No se observó regresión, pero no se corrió
`next build` ni la batería completa de smokes: el fix excede el alcance aprobado.

---

## 6.4 Por qué queda en pausa

No es que no funcione — funciona. Es que **dejó de ser el cambio barato que
justificaba hacerlo ahora**:

1. **Blast radius desproporcionado.** Pasar a `{ request: { headers } }` cambia la
   semántica de propagación de headers **para todo request que atraviese el
   middleware** — las **264** rutas bajo `src/app/api/` más todo `/dashboard`.
   El matcher no excluye prácticamente nada. Deja de ser "1 archivo, 6-8 líneas"
   (§3) y pasa a ser un cambio de plataforma.
2. **Toca la rama de service tokens** (línea 197), que hoy funciona y no tiene
   nada que ver con el vector. Cambiarla es riesgo puro sin beneficio en este
   proyecto.
3. **El beneficio real es menor al que el spec asumía.** Aun con el vector
   cerrado, las **36 rutas fail-open** del inventario siguen abiertas: el
   hardening solo degrada el rol forjado a `null`, y esas rutas no consultan el
   rol en absoluto. Cerrar esto **no cierra la escalada** — la reduce.
4. **Hay un camino más corto al mismo resultado.** Cerrar `/api/auth/login` y
   corregir el minting de `/api/auth/register` elimina el vector **de raíz**:
   sin forma de emitir un token sin `userId`, no hay nada que endurecer.
   Ya estaba anticipado en §4 de este spec.

**Sin urgencia mientras el vector se cierre por §6.5.** Si ese camino se
descarta o se atrasa, este gate vuelve a ser la mitigación disponible.

---

## 6.5 Referencia cruzada — qué está activo ahora

| Proyecto | Estado | Relación |
|---|---|---|
| **Cerrar `/api/auth/login` + corregir minting de `/api/auth/register`** | **ACTIVO** — camino elegido, se coordina en el chat de arquitectura | Cierra el vector de raíz. Vuelve innecesario este gate |
| Rutas fail-open por omisión de rol | Proyecto propio, inventario cerrado en `.claude/tasks/INVENTARIO_RUTAS_FAIL_OPEN_ROL_v1.md` | **Independiente.** No espera a este gate ni al de auth: esas rutas no miran el rol, así que da igual si llega forjado o `null` |
| Migración de las 28 rutas legacy `verifyJWT` | Pendiente — `INVESTIGACION_AUTH_LEGACY_JULIO_2026.md` §5 | **Disparador de reanudación de este gate** (§6.6) |

⚠️ Dos hallazgos del inventario **no** son fail-open por omisión de rol sino
**fugas cross-tenant** (`admin/job-mapping-review:152` POST toma el `accountId`
del body; `goals/employee-score:8` no scopea por tenant). Severidad y prioridad
distintas — ver §2 de ese documento.

---

## 6.6 Condición de reanudación

> **Retomar este gate cuando se aborde el proyecto de migración de las 28 rutas
> legacy `verifyJWT`.**

Ese proyecto ya va a tener el middleware abierto y un plan de regresión sobre el
patrón de auth completo — es el único momento en que el blast radius de §6.4
se amortiza contra trabajo que igual hay que hacer.

**Al retomar, arrancar desde §6.3, no desde §3.** El diff de §3 está probado como
no-op; §6.3 tiene el fix verificado y los 6 casos de smoke listos para re-correr.

**Qué NO hay que re-investigar** (ya cerrado con evidencia):
`exp` legacy = 7d · no existe EVALUATOR-por-ciclo · service token sale por el
early-return de `:192-198` · `hasPermission(null, …)` deniega correctamente
(`src/lib/auth/permissions.ts:666-670`) · la tabla set/delete/set-vacío de §6.2.

---

*§6 agregada 2026-07-20. Gate 0 cerrado con evidencia. Gate A pausado, no
abandonado, con el fix verificado documentado en §6.3.*
