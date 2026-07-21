# 🔓 INVENTARIO — Rutas fail-open por omisión de rol (v1)

**Fecha:** 2026-07-20
**Origen:** Gate 0 de `SPEC_MIDDLEWARE_LEGACY_ROLE_HARDENING_v1.md`, punto 1.
**Estado:** inventario verificado. **1 de 36 cerrada** (§2.2, fuga cross-tenant de
lectura, commit `72bab31`). Las otras 35 sin tocar.
**Naturaleza:** artefacto de handoff. Abre proyecto propio, separado de:
- el hardening de `middleware.ts` (que quedó bloqueado, ver §5)
- la migración de las 28 rutas legacy `verifyJWT` (`INVESTIGACION_AUTH_LEGACY_JULIO_2026.md` §5)

### Cambios sobre este inventario

| Fecha | Ruta | Cambio |
|---|---|---|
| 2026-07-20 | `goals/employee-score` (§2.2) | ✅ **CERRADA** — commit `72bab31`. `getEmployeeGoalsScore` ahora exige `accountId` y filtra por `Goal.accountId`. Smoke cross-tenant 6/6 |

---

## 1. QUÉ ES ESTO

Rutas bajo `src/app/api/` que autentican vía `extractUserContext()` pero tienen
al menos un camino que devuelve datos reales **sin validar nunca el rol**.

**Causa raíz compartida** — `src/lib/services/AuthorizationService.ts:130-141`:
`extractUserContext` lee `x-user-role` **sin default**, así que `role` es
`string | null`. Todo guard con forma `role === 'X'` o
`!GLOBAL_ROLES.includes(role || '')` trata `null` como "no matcheó" y **cae de
largo** en vez de denegar.

Contraste: `buildParticipantAccessFilter` (`AuthorizationService.ts:120-127`)
**sí** falla cerrado — devuelve el centinela `id: 'no-access-impossible-value'`.
Solo falla abierto cuando el llamador lee `accessFilter.departmentId` en vez de
spreadear el objeto completo.

**Verificación empírica** (token legacy, cero headers forjados, `2026-07-20T10:23Z`):
```
/api/exit/metrics        200  <== pasa con rol null
/api/exit/insights       200  <== pasa con rol null
/api/onboarding/alerts   200  <== pasa con rol null
/api/goal-library        200  <== pasa con rol null
/api/vitals/summary      403  (fail-closed, correcto)
```

**Universo barrido:** 264 `route.ts`; 189 usan el patrón moderno; 47 llaman
`extractUserContext` sin ningún `hasPermission` — esos 47 se leyeron uno por uno.

---

## 2. ⚠️ DOS HALLAZGOS QUE NO SON DE ESTA CLASE — LEER PRIMERO

No son "fail-open por omisión de rol". Son **fugas cross-tenant**, y el
`accountId` del token no las contiene. Severidad distinta, probablemente
prioridad distinta.

**Estado:** §2.2 (lectura) **cerrada**. §2.1 (escritura) **confirmada en ejecución
2026-07-21, fix en curso** — ver su nota.

### 2.1 `src/app/api/admin/job-mapping-review/route.ts:152` — POST — ESCRITURA CROSS-TENANT — 🟠 CONFIRMADA EN EJECUCIÓN (fix en curso)

El `accountId` del update **se toma del body del request**, no del token:

```ts
const { position, accountId, standardJobLevel } = body
// ...  campaign: { accountId }
```

Cualquier token válido de cualquier cuenta puede reescribir `standardJobLevel` y
`acotadoGroup` de **todos los participantes** que matcheen un string de posición,
**en la cuenta que elija**. Único gate del handler: `if (!userContext.accountId) → 401`.

**CONFIRMADA EN EJECUCIÓN — `2026-07-21T03:48Z`, cuentas 100% sintéticas** (fixtures
`__XT_` con cleanup por id en `$transaction`, residual verificado 0). Token
`ACCOUNT_OWNER` legítimo de la Cuenta A + `accountId` de la Cuenta B en el body →
`HTTP 200`, `"updated":3`: los 3 participantes de B quedaron reescritos a
`standardJobLevel: 'jefe'`, `jobLevelMethod: 'manual'`. Un token de una cuenta
mutó datos de otra.

Matiz de explotabilidad (sin cambio): el atacante necesita conocer el `accountId`
destino, y el GET del mismo archivo NO se lo da (`:52-53` sí acota por cuenta). No
es cadena autocontenida; hay que conseguir el `accountId` (cuid, no enumerable) por
otra vía. Pero la primitiva de escritura está confirmada.

**Peor que §2.2:** aquella era lectura; esta es escritura — corrompe la
clasificación de nivel de cargo de la víctima, lo que downstream afecta RoleFit,
brechas y toda la analítica que segmenta por `acotadoGroup`.

### 2.2 `src/app/api/goals/employee-score/route.ts:8` — GET — LECTURA CROSS-TENANT — ✅ CERRADA (commit `72bab31`, 2026-07-20)

**Era:** `GoalsService.getEmployeeGoalsScore(employeeId, date)` recibía el
`employeeId` crudo del query param y **no recibía `accountId`**. El scoping no era
ni por rol ni por tenant: devolvía el score de metas de cualquier `employeeId` del
sistema.

**Verificado en ejecución** (`2026-07-20T11:27Z`): token `ACCOUNT_OWNER` de la
cuenta `cmfivd3hh0` pidiendo un `employeeId` de la cuenta `cmfgedx7b0` → HTTP 200
con 3 metas ajenas (título, progreso, peso). Un solo GET, token legítimo, sin
forjar nada — independiente del rol y del tipo de token.

**Fix:** `accountId` pasa a ser primer parámetro obligatorio de
`getEmployeeGoalsScore`, filtrando por `Goal.accountId` (`schema.prisma:2856` —
`Goal` tiene su propio `account_id`, sin join por employee; además `employeeId` es
nullable para metas de empresa/área). El filtro vive en el servicio para que
ninguna superficie futura pueda llamarlo sin acotar; el parámetro obligatorio lo
garantiza en `tsc`. Se enhebró `accountId` por los 4 call sites (route +
`GoalsAggregationService` + `SpanIntelligenceService` + `PerformanceRatingService`,
que necesitó agregarlo a la firma de `calculateHybridScore`).

**Smoke 6/6:** cross-tenant → 200 con data vacía (`goalsCount=0`, sin títulos);
legítimo (misma cuenta, mismo empleado) → 200 con las mismas 3 metas.
`tsc --noEmit` + `next build` limpios.

---

## 3. PATHS CON ESCRITURA (8) — mayor riesgo

| file:line | Método | Qué obtiene un token válido SIN rol | Guard tal como está escrito |
|---|---|---|---|
| `src/app/api/admin/job-mapping-review/route.ts:152` | POST | **Ver §2.1 — cross-tenant.** Reescribe `standardJobLevel`/`acotadoGroup` de todos los participantes de la cuenta indicada en el body | solo `if (!userContext.accountId) → 401` |
| `src/app/api/admin/accounts/settings/route.ts:64` | PUT | Muta política de reportes de toda la cuenta (`reportDeliveryDelayDays`, `reportLinkExpirationDays`, `enableEmployeeReports`) | `const targetAccountId = (userContext.role === 'FOCALIZAHR_ADMIN' && bodyAccountId) ? bodyAccountId : userContext.accountId` — el rol solo elige *target*, nunca deniega |
| `src/app/api/admin/competency-targets/route.ts:83` | PUT | Upsert de los targets de competencia de la cuenta → altera todo cálculo de RoleFit y de brechas a nivel organización | `if (!userContext.accountId) → 401` |
| `src/app/api/admin/competency-targets/route.ts:139` | POST | Ejecuta `RoleFitAnalyzer.ratifyTargets` / `seedCompetencyTargets`; la identidad de auditoría degrada a `'unknown'` | `const userId = userContext.userId \|\| request.headers.get('x-user-email') \|\| 'unknown'` |
| `src/app/api/onboarding/alerts/[id]/route.ts:75` | PATCH | Muta cualquier alerta de journey de onboarding de la cuenta (estado/asignación), saltándose el chequeo jerárquico | `if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {` — sin `else` |
| `src/app/api/goals/from-pdi/route.ts:15` | POST | Crea una Goal contra **cualquier** `employeeId` de la cuenta, con identidad de auditoría degradada | `const createdById = userContext.userId \|\| userContext.accountId` |
| `src/app/api/goals/link-pdi/route.ts:12` | POST | Vincula cualquier `goalId` con cualquier `devGoalId` de la cuenta vía `GoalsService.linkExistingGoal` | `if (!userContext.accountId) → 401` |
| `src/app/api/goal-library/route.ts:72` | POST | Crea plantillas de biblioteca de metas visibles para todo el tenant | `if (!context.accountId) → 401` |

---

## 4. PATHS DE SOLO LECTURA (28)

### 4.1 Grupo A — `!GLOBAL_ROLES.includes(role || '') && departmentId`, sin else-deny (7)

Con `role = null`: `!includes` da `true`, pero `departmentId` también es `null` →
la condición completa es `false` → `departmentIds` queda `undefined` → **toda
query downstream corre sin filtro sobre la cuenta entera.**

| file:line | Método | Exposición |
|---|---|---|
| `src/app/api/executive-hub/summary/route.ts:46` | GET | El briefing ejecutivo completo en una llamada: 9-box, concentración de estrellas, varianza de jefaturas, cobertura de sucesión, brecha productiva, semáforo legal, exposición IA, diagnóstico workforce — todo account-wide. Además el response ecoa `userRole: userContext.role \|\| 'VIEWER'` (`:151`) |
| `src/app/api/executive-hub/talent/route.ts:34` | GET | 9-box, distribución de ratings, concentración de estrellas por gerencia, ADN organizacional |
| `src/app/api/executive-hub/succession/route.ts:35` | GET | Cobertura de sucesión + mapa de vulnerabilidad de posiciones clave sin backup |
| `src/app/api/executive-hub/calibration/route.ts:43` | GET | Stats de calibración, varianza por jefatura, distribución de ratings del ciclo |
| `src/app/api/executive-hub/capabilities/route.ts:47` | GET | Matriz de brechas de competencia de todos los departamentos |
| `src/app/api/executive-hub/goals-correlation/route.ts:39` | GET | Dataset de correlación metas-vs-performance de toda la cuenta |
| `src/app/api/executive-hub/alerts/route.ts:36` | GET | Alertas de talento + lista de fuga lamentada, todos los departamentos |

Guard idéntico en los 7:
`if (!GLOBAL_ROLES.includes(userContext.role || '') && userContext.departmentId) {`

### 4.2 Grupo B — `role === 'AREA_MANAGER'` sin else-deny (7)

| file:line | Método | Exposición |
|---|---|---|
| `src/app/api/exit/records/route.ts:83` | GET | Registros individuales de salida de toda la cuenta. El comentario al cierre lo dice: `// Si no tiene departmentId, el filtro solo por accountId aplica` |
| `src/app/api/exit/causes/route.ts:486` | GET | Desglose de causas de salida por sección — por qué se fue la gente |
| `src/app/api/exit/metrics/route.ts:89` | GET | Métricas de salida/rotación de todas las gerencias |
| `src/app/api/exit/alerts/route.ts:96` | GET | Todas las alertas de salida de todos los departamentos |
| `src/app/api/exit/insights/onboarding-correlation/route.ts:129` | GET | Correlación calidad de onboarding ↔ attrition, todos los departamentos |
| `src/app/api/analytics/nps/route.ts:110` | GET | Todas las filas de `nPSInsight` de la cuenta, sin cláusula `OR` departamental |
| `src/app/api/onboarding/metrics/route.ts:240-267` | GET | Métricas de onboarding account-wide. El `else` de `:265` loguea `'⚠️ Rol sin definición explícita'` y **continúa** con `allowedDepartmentIds = null`, que el servicio interpreta como "todos los departamentos". El 403 de `:286` es **inalcanzable**: exige que `allowedDepartmentIds` sea no-null |

### 4.3 Grupo C — centinela de `buildParticipantAccessFilter` descartado (2)

El filtro devuelve bien el centinela de no-acceso, pero la ruta copia solo
`.departmentId` (ausente en CASO 3) y lo tira.

| file:line | Método | Exposición |
|---|---|---|
| `src/app/api/onboarding/alerts/route.ts:72,85` | GET | Todas las alertas de journey + conteos + estadísticas de la cuenta |
| `src/app/api/onboarding/journeys/route.ts:139` | GET | Listado paginado de todos los journeys de onboarding (hasta 100/página); el metadata reporta `hierarchyFiltered: false` |

### 4.4 Grupo D — solo `accountId`, el rol nunca se consulta (9 · 1 cerrada → 8 abiertas)

| file:line | Método | Exposición |
|---|---|---|
| ~~`src/app/api/goals/employee-score/route.ts:8`~~ | GET | ✅ **CERRADA** (§2.2, commit `72bab31`). Era la fuga cross-tenant de lectura |
| `src/app/api/admin/performance-cycles/[id]/delivery-tracking/route.ts:18` | GET | Todo `feedbackDeliveryConfirmation` del ciclo, joineado con **nombre completo y email** del empleado — quién recibió su reporte de feedback y cuándo. La query de `:47` es `where: { cycleId }` sola |
| `src/app/api/admin/performance-cycles/[id]/hierarchy-stats/route.ts:19` | GET | Todo `evaluationAssignment` del ciclo: nombre del evaluado, departamento, nombre del evaluador, tipo y estado de completitud. Query `where: { cycleId }` sola |
| `src/app/api/campaigns/[id]/gerencias/route.ts:12` | GET | Árbol organizacional gerencia→departamento con métricas agregadas de participación/score. `userContext.accountId` ni siquiera se null-checkea antes del lookup |
| `src/app/api/exit/insights/route.ts:46` | GET | Insights de salida generados, ventana 6 meses (critical/warning/info), sin dimensión departamental |
| `src/app/api/admin/accounts/settings/route.ts:14` | GET | Configuración de entrega de reportes de la cuenta |
| `src/app/api/admin/competency-targets/route.ts:36` | GET | Todos los targets de competencia + estado de ratificación |
| `src/app/api/admin/job-mapping-review/route.ts:33` | GET | Cola de revisión de job-mapping; `isFocalizahrAdmin` (`:43`) solo **amplía** scope, nunca deniega |
| `src/app/api/goal-library/route.ts:22` | GET | Plantillas y categorías activas de la biblioteca de metas |

### 4.5 Grupo E — métodos HTTP sin gate en archivos por lo demás gateados (2)

| file:line | Método | Exposición |
|---|---|---|
| `src/app/api/calibration/sessions/[sessionId]/adjustments/route.ts:25` | GET | Todo ajuste de calibración de la sesión: id de empleado, nombre completo, cargo, `departmentId` y ratings antes/después. El POST de `:79` **sí** está gateado |
| `src/app/api/calibration/sessions/[sessionId]/participants/route.ts:16` | GET | Roster de la sesión (facilitador y participantes). POST `:72` y DELETE `:166` llaman `hasPermission(role,'calibration:manage')`; el GET no |

### 4.6 Grupo F — lectura directa de headers sin null-guard (1)

| file:line | Método | Exposición |
|---|---|---|
| `src/app/api/department-metrics/route.ts:45` | GET | Métricas departamentales account-wide con filtros arbitrarios `departmentId`/`period`/`dataQuality`. El `role` se lee al objeto de contexto en `:45` y **no se referencia nunca más en todo el archivo** |

---

## 5. RELACIÓN CON EL HARDENING DE MIDDLEWARE (contexto, no alcance)

El hardening pretendía limpiar los `x-user-*` forjados para tokens sin `userId`.
Ese proyecto quedó **bloqueado**: se verificó empíricamente que
`headers.delete()` y `headers.set('')` son **invisibles** para el handler, porque
`middleware.ts` usa `NextResponse.next({ headers })` y no
`NextResponse.next({ request: { headers } })` — la fusión es aditiva por valor
no vacío (`set` pisa, quitar no viaja).

**Consecuencia para este inventario:** aun cuando ese hardening se resuelva, las
36 rutas de acá **siguen abiertas**. El hardening solo degrada el rol forjado a
rol `null`; estas rutas no validan el rol en absoluto, así que `null` les da
lo mismo. **Son independientes: este proyecto no espera a aquel.**

---

## 6. NO SON FAIL-OPEN — verificado, no re-investigar

### 6.1 Sin rol pero scoped por identidad (7) — excluidas del total

Nunca chequean `role`, pero resuelven el `Employee` del llamador desde
`x-user-email` y acotan a él. Un token sin rol solo obtiene sus propios datos.

| file:line | Método | Mecanismo de scoping |
|---|---|---|
| `src/app/api/evaluator/cycles/route.ts:12` | GET | `where: { accountId, email: userEmail, status: 'ACTIVE' }` → `assignments: { some: { evaluatorId: employee.id } }` |
| `src/app/api/evaluator/assignments/route.ts:48` | GET | `evaluatorId: employee.id` (`:118`) |
| `src/app/api/evaluator/stats/route.ts:66` | GET | `evaluatorId: employee.id` (`:112`) |
| `src/app/api/evaluator/potential/route.ts:21` | POST | `evaluatorId: loggedInEmployee.id` (`:69`) |
| `src/app/api/evaluator/assignments/[id]/route.ts:46,151` | GET, PATCH | `if (assignment.evaluator.email !== userEmail) → 403` (`:94`, `:189`) |
| `src/app/api/evaluator/assignments/[id]/summary/route.ts:20` | GET | 403 por ownership en `:70` |
| `src/app/api/goals/team/coverage/route.ts:8` | GET | `managerId: employee.id` — solo reportes directos |

### 6.2 Candidatos del barrido inicial que se cayeron al verificar (6)

| Candidato | Veredicto | Razón |
|---|---|---|
| `talent-actions/mass-action:85` | **gateado** | `:50` — `hasPermission(role,'talent-actions:view')` corre antes de leer headers |
| `talent-actions/checkout:76` | **gateado** | `:54` (POST) y `:210` (GET) llaman `hasPermission(role,'talent-actions:view')` |
| `campaigns/[id]/analytics:437-450` | **falla cerrado** | `:93` spreadea `...accessFilter` completo → el centinela **sí** aplica; devuelve la rama de métricas vacías en `:118` antes de llegar a `getGerenciaIntelligence` |
| `campaigns/[id]/participants:559` | **falla cerrado** | `:601` spreadea `...accessFilter` en el `findMany` → centinela aplicado, lista vacía |
| `calibration/sessions/[sessionId]/close:32` | **gateado** | `:47` — `if (!participant \|\| participant.role !== 'FACILITATOR') → 403`. Gate por rol de sesión, no RBAC, pero deniega |
| `evaluator/*` (6 rutas) | **reclasificado** | Ownership-scoped → §6.1 |

### 6.3 Verificadas con chequeo de rol presente

`admin/employees/anomalies:40,141` · `admin/performance-ratings/[id]/calibrate:27,92` ·
`employees/[id]/succession-plan:44` y `/progress:50` ·
`evaluator/assignments/[id]/questions:69` · `exit/alerts/[id]:88,256` ·
`pdi/generate-suggestion:68` · `pdi/[id]/change-status:57` · `pdi/[id]/check-ins:67` ·
`admin/performance-config` (GET `:28` usa `hasPermission`, PUT `:70` allowlist).

---

## 7. CONTEO

| Categoría | Cantidad |
|---|---|
| Paths fail-open con ESCRITURA | **8** (0 cerradas) |
| Paths fail-open de LECTURA | **28** (1 cerrada → 27 abiertas) |
| **Total paths fail-open confirmados** | **36** |
| ✅ Cerradas a la fecha | **1** (§2.2, commit `72bab31`) |
| 🔴 Abiertas | **35** |
| De ellos, fugas **cross-tenant** (§2) | **2** — §2.2 cerrada, **§2.1 abierta (mayor severidad pendiente)** |
| Sin rol pero scoped por identidad (excluidos) | 7 |
| Candidatos refutados al verificar | 6 |
| Universo barrido (`extractUserContext` sin `hasPermission`) | 47 |

---

*v1 — inventario cerrado. Ninguna ruta modificada. El diseño del fix se define
en el chat de arquitectura, en proyecto propio.*
