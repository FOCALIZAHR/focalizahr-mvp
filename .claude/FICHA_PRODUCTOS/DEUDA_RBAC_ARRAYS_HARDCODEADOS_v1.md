# DEUDA_RBAC_ARRAYS_HARDCODEADOS_v1.md

## Estado: Fase 1 (mapeo) completa. Fase 2 (decisión) pendiente de Victor.

> **Verificación contra código — 2026-07-21.** Los 14 hallazgos se regrepearon
> contra el código actual: **todas las líneas citadas siguen exactas, sin drift**
> (los 14 hallazgos abarcan 19 file:line reales — A5 son 2 archivos, "A-OK ×5" son
> 5). El hallazgo estructural también se confirma: los 7 endpoints del hub sin gate
> tienen `hasPermission` ×0; los gateados, ×2/×3.
>
> **Discrepancia menor a reconciliar (doc-interna, NO corregida):** §1 dice "Solo 2
> de 9 endpoints del hub llaman a hasPermission()". El conteo real es **3 de 10**:
> hay 10 route files bajo `executive-hub/` y gatean `pl-talent` (×3),
> `pl-talent/risk-profiles` (:29) y `exposure-ia` (×2). La tabla §2.2 ya lista
> risk-profiles como gateado, así que es consistente con "3 de 10"; solo la prosa de
> §1 quedó en "2 de 9". El hallazgo de fondo (7 sin gate) no cambia.
>
> **Referencia cruzada:** los 7 endpoints de la §2.3+§2.4 (talent, alerts,
> succession, calibration, goals-correlation, summary, capabilities) son **los mismos
> 7** del **Grupo A de `INVENTARIO_RUTAS_FAIL_OPEN_ROL_v1.md`**. Coinciden en archivo,
> con distinta línea: este doc cita la **declaración** del array `GLOBAL_ROLES`
> (`talent:14`), el inventario cita el **uso** en el guard (`talent:34`). Los dos docs
> miran el mismo bug desde ejes distintos: acá "array hardcodeado divergente de
> PERMISSIONS", allá "ruta que no valida rol (fail-open)". Ver §5 para el patrón
> hermano que ninguno de los dos barridos cubrió.

---

## 0. Origen y objetivo

Durante el split de `AuthorizationService.ts` → `permissions.ts` (jul 2026) se encontró
un array local en `buildParticipantAccessFilter()` sin `HR_ADMIN`/`HR_OPERATOR`. Esto
coincide con un patrón ya documentado en la guía RBAC v1.2 ("omisión histórica —
confirmado arreglado" para `GLOBAL_ACCESS_ROLES`/`HIERARCHICAL_FILTER_ROLES`). Se
decidió tratarlo como posible patrón recurrente, no como incidente aislado, y hacer
un barrido completo del proyecto antes de corregir nada.

**Objetivo:** eliminar todo array de roles hardcodeado que decide *scope o gate de
acceso* real, reemplazándolo por `hasPermission()` contra una clave de `PERMISSIONS`
(`src/lib/auth/permissions.ts`), dejando cero divergencia entre lo que el código hace
y lo que la fuente única de permisos dice que debería hacer. Alineado con Regla
Enterprise Absoluta #2: "RBAC en cada endpoint vía AuthorizationService — nunca
arrays de roles hardcodeados."

**No-objetivos (fuera de este proyecto):**
- Arrays de permiso por recurso que ya coinciden con `PERMISSIONS` por diseño (grupo
  B del barrido: flags de UI, `middleware.ts:274`, banderas cosméticas de login).
- Decisiones de negocio nuevas no relacionadas (ej. TODO pendiente de si
  `HR_ADMIN`/`HR_OPERATOR` deben ver `performance:view`/`potential:view` de nivel
  gerencial — eso es un ítem de producto aparte).
- `climaRoles.ts` / `goalCycleRoles.ts` — ya documentados como deuda de migración
  separada (no urgente).

---

## 1. Hallazgo estructural (reencuadra todo el barrido)

Durante el mapeo de la Fase 1, Code descubrió algo más importante que la mayoría de
las divergencias de rol individuales:

> En el clúster `executive-hub/*`, el array `GLOBAL_ROLES` **no es un gate de
> autorización** en la mayoría de los endpoints — es un **selector de scope** (decide
> si se salta el filtro departamental). Solo 2 de 9 endpoints del hub llaman a
> `hasPermission()`. Los otros 7 **no tienen ningún gate de rol**: su única barrera es
> el check de `accountId` (autenticación), no autorización por rol. Cualquier rol
> autenticado de la cuenta entra sin filtrar.

**Consecuencia para la lectura de todo lo demás:** un permiso `*:view` en
`PERMISSIONS` responde "¿quién puede ACCEDER?"; `GLOBAL_ROLES` en estos endpoints
responde "¿quién ve SIN FILTRO departamental?" — son ejes distintos. Por eso
`AREA_MANAGER`/`EVALUATOR` están ausentes del array a propósito (son justamente los
que se filtran, no una omisión). El eje realmente comparable es solo
`HR_OPERATOR`/`HR_MANAGER` frente al permiso de recurso correspondiente.

Esto bajó la cantidad de "candidatos a bug" del barrido inicial (12+) a un número
menor y más preciso (ver tabla), pero **subió la severidad real**: falta de gate de
autorización en 7 endpoints ejecutivos es más grave que una omisión de rol en un
array de scope.

---

## 2. Tabla completa — los 14 sitios auditados

### 2.1 Bugs confirmados (divergen del permiso correspondiente)

| # | Archivo:línea | Array actual | Permiso de referencia | Diverge en | Es gate real o solo scope |
|---|---|---|---|---|---|
| A1 | `AuthorizationService.ts:80` (`globalRoles`) | ADMIN, OWNER, HR_MANAGER, CEO | `GLOBAL_ACCESS_ROLES` (scope, no permiso de recurso) | Falta HR_ADMIN + HR_OPERATOR | Scope (filtro maestro participantes/campañas) |
| A2 | `onboarding/metrics/route.ts:105` (`globalRoles`) | ADMIN, OWNER, HR_ADMIN, HR_OPERATOR, CEO | `onboarding:read` | Falta HR_MANAGER | Scope |
| A5 | `employees/[id]/succession-plan/route.ts:44` + `progress/route.ts:50` (`isHR`) | ADMIN, OWNER, HR_ADMIN, HR_OPERATOR, CEO | `succession:view` | Incluye HR_OPERATOR de más, excluye HR_MANAGER | **Gate real (retorna 403)** ⚠️ |
| A4-talent | `executive-hub/talent/route.ts:14` (`GLOBAL_ROLES`) | ADMIN, OWNER, HR_MANAGER, HR_ADMIN, CEO | `talent-actions:view` | Falta HR_OPERATOR | Scope, sin gate |
| A4-alerts | `executive-hub/alerts/route.ts:13` (`GLOBAL_ROLES`) | ADMIN, OWNER, HR_MANAGER, HR_ADMIN, CEO | `talent-actions:view` | Falta HR_OPERATOR | Scope, sin gate |

### 2.2 Correctos pero hardcodeados (coinciden, deuda de duplicación)

| # | Archivo:línea | Coincide con | Nota |
|---|---|---|---|
| A4-pl-talent | `executive-hub/pl-talent/route.ts:14` | `pl-talent:view` | Ya gatea con `hasPermission` (:28,:80); array es redundante |
| A4-risk-profiles | `executive-hub/pl-talent/risk-profiles/route.ts:19` | `pl-talent:view` | Ya gatea con `hasPermission` (:29); array es redundante |
| A6 | `exit/records/route.ts:81` | `exit:records:read` (justificado en `permissions.ts:152-158`) | Intencional, comentario explícito |
| A-OK ×5 | `onboarding/metrics:238`, `workforce/intelligence:9`, `workforce/exposure:21`, `workforce/diagnostic:10`, `executive-hub/exposure-ia:16` | `GLOBAL_ACCESS_ROLES` (6 roles) | Alineados en valor, literal en vez de constante |

### 2.3 Correctos en scope pero SIN gate de autorización (hallazgo estructural)

| # | Archivo:línea | Array | Coincide en eje HR_OPERATOR con | Falta |
|---|---|---|---|---|
| A4-succession | `executive-hub/succession/route.ts:15` | ADMIN, OWNER, HR_MANAGER, HR_ADMIN, CEO | `succession:view` (sin HR_OPERATOR, ✓) | `hasPermission('succession:view')` |
| A4-calibration | `executive-hub/calibration/route.ts:14` | idem | `calibration:view` (sin HR_OPERATOR, ✓) | `hasPermission('calibration:view')` |
| A4-goals-correlation | `executive-hub/goals-correlation/route.ts:15` | idem | `goals:view` (sin HR_OPERATOR, ✓) | `hasPermission('goals:view')` |

### 2.4 Sin permiso equivalente existente (requiere decisión de producto)

| # | Archivo:línea | Qué expone | Candidatas |
|---|---|---|---|
| A4-summary | `executive-hub/summary/route.ts:24` | Composite: agrega performance + succession + pl-talent + goals + exposure + workforce | Crear `executive-hub:view` nueva, o gatear por el permiso más restrictivo de los que agrega |
| A4-capabilities | `executive-hub/capabilities/route.ts:17` | RoleFit + competency gaps | Crear clave nueva, o usar `performance:view` / `workforce-intelligence:view` (ninguna calza exacto) |

---

## 3. Decisiones pendientes de Victor (Fase 2)

Antes de escribir un solo fix, necesito tu decisión explícita en estos puntos —
no son mecánicos, son de producto:

1. **`executive-hub/summary` y `capabilities`**: ¿qué clave de permiso les
   corresponde? ¿Creamos `executive-hub:view` como paraguas, o cada endpoint gatea
   por el permiso más restrictivo de lo que expone?
2. **Los 7 endpoints del hub sin ningún gate de rol**: ¿es un vacío de seguridad a
   cerrar ya (agregar `hasPermission` a los 5 que sí tienen permiso equivalente:
   succession, calibration, goals-correlation, + decidir summary/capabilities), o
   hay una razón de diseño para que el hub ejecutivo no gatee por rol más allá de
   `accountId` (ej. "todo rol autenticado de la cuenta puede ver el hub, el filtrado
   fino pasa después")? Esto lo trato como ítem propio porque cambia el argumento:
   no es "corregir una omisión de HR_OPERATOR", es "decidir si este hub necesita
   autorización por rol".
3. **A5 (`succession-plan` de empleado)**: es gate real con 403 — confirmame que
   el fix es alinear a `succession:view` exacto (agregar HR_MANAGER, quitar
   HR_OPERATOR) antes de tocarlo, dado que es el único de los 5 bugs que cambia
   quién puede/no puede entrar hoy mismo (los demás son scope, no gate).

---

## 4. Fases de ejecución (una vez resueltas las decisiones de arriba)

**Fase 3A — Fixes de comportamiento** (uno por uno, Plan Mode → fix → smoke test
con evidencia real → commit individual, no agrupado):
- A1 (`buildParticipantAccessFilter:80`) — ya con Plan Mode definido en sesión previa
- A2 (`onboarding/metrics:105`)
- A5 (`succession-plan` — el único gate real, prioridad alta)
- A4-talent, A4-alerts

**Fase 3B — Refactor mecánico** (puede agruparse por módulo, solo requiere
`tsc`/`build` limpio, sin smoke test de datos porque el resultado debe ser idéntico):
- A4-pl-talent, A4-risk-profiles (quitar literal redundante)
- A6 y los 5 de A-OK (reemplazar literal por `GLOBAL_ACCESS_ROLES` importado)
- A4-succession, A4-calibration, A4-goals-correlation (agregar `hasPermission`, una
  vez confirmado que no es un cambio de negocio)

**Fase 4 — Documentación** (los tres documentos ya redactados en sesión previa:
`GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_2.md`, skill `focalizahr-api`,
`Documentación_Sistema_AuthorizationService.md`), actualizados con la lista completa
y cerrada — no antes.

---

## 5. Hallazgos posteriores a la Fase 1

Cosas que aparecieron DESPUÉS de cerrar el barrido de Fase 1 y que el barrido
original **no cubrió**. No se corrigen desde acá; se anotan para que Fase 2 decida
si entran al mismo proyecto o abren uno propio.

### 5.1 Patrón NO cubierto: comparación inline a un solo rol (`role === 'FOCALIZAHR_ADMIN'`)

El barrido de Fase 1 persiguió **arrays** de roles (`[...].includes(role)`). Hay un
patrón hermano que se le escapó: la **comparación inline a un único rol**, sin array
y sin `hasPermission()`, usada para decidir si un `FOCALIZAHR_ADMIN` opera
cross-cuenta (toma el `accountId` del body en vez del token).

No es un bug de divergencia como los 14 — el comportamiento es correcto — pero es la
**misma clase de deuda**: una decisión de autorización real codificada con un
literal de rol en vez de contra `PERMISSIONS`. Nota relevante: `permissions.ts:176`
ya tiene la clave `'admin:accounts': ['FOCALIZAHR_ADMIN']` ("solo superadmin puede
gestionar cuentas"), que expresa exactamente lo que estos tres sitios resuelven a
mano.

| Sitio | Línea | Nota |
|---|---|---|
| `admin/accounts/settings/route.ts` | :72 | Canónico. `const targetAccountId = (userContext.role === 'FOCALIZAHR_ADMIN' && bodyAccountId) ? bodyAccountId : userContext.accountId` |
| `job-classification/assign/route.ts` | :66-68 | Canónico. Mismo patrón, `isFocalizahrAdmin ? (body.accountId \|\| headerAccountId) : headerAccountId` |
| `admin/job-mapping-review/route.ts` | :167 (post-fix) | Se **alineó a este patrón** el 2026-07-21 (commit `8f018b0`) para cerrar una escritura cross-tenant — antes tomaba el `accountId` del body sin gatear por rol. Ver `INVENTARIO_RUTAS_FAIL_OPEN_ROL_v1.md` §2.1 |

Confirmado 2026-07-21: **ninguno de los tres está entre los 14 sitios de la §2** (los
14 son todos array-based). Era la pregunta original que originó esta sección.

### 5.2 Fugas cross-tenant (otra clase, otro documento)

Durante la misma investigación aparecieron dos fugas **cross-tenant** (el `accountId`
del token no las contenía) — clase distinta a la de este doc (divergencia de rol
intra-tenant). Ya cerradas, trazadas en `INVENTARIO_RUTAS_FAIL_OPEN_ROL_v1.md` §2:
`goals/employee-score` (lectura, commit `72bab31`) y `admin/job-mapping-review`
(escritura, commit `8f018b0`, ver §5.1 arriba).

---

## Changelog

- v1 (jul 2026): creación. Fase 1 (mapeo) completa vía Code, 14 sitios auditados,
  hallazgo estructural de gates faltantes en executive-hub documentado. Fase 2
  pendiente de decisión de Victor.
- v1.1 (2026-07-21): verificación contra código (14 sitios sin drift, sello arriba),
  referencia cruzada con `INVENTARIO_RUTAS_FAIL_OPEN_ROL_v1.md` Grupo A, y §5
  (hallazgos posteriores: patrón inline de un solo rol + fugas cross-tenant). Sin
  cambios de código. Movido de `.claude/tasks/` a `.claude/FICHA_PRODUCTOS/` para
  versionar.
