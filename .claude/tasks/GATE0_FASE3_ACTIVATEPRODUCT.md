# Gate 0 — Fase 3: `activateProduct(target, ctx)` (runtime del CTA real de Tab 2)

> **Estado:** Gate 0 CERRADO en decisiones de arquitectura. Quedan 2 desvíos de DATOS
> como decisión pendiente (§Desvíos). Investigación read-only con file:line, 2026-07-25.
> **Fuentes:** `climaProductDispatcher.ts`, `RESOLUCION_GATE_5D_TAB2_CLIMA_METAS.md` §3,
> `SPEC_UI_META_REACTIVO_v1.md`, `pdi-suggestion.ts`, `GoalsService.ts`, `goalsErrorResponse.ts`.
> **Contexto:** Tab 2 UI sellada; schema Fase 3 aplicado a prod (enum CLIMA_TRIGGERED +
> `Goal.sourceReferenceId` + `@@unique unique_goal_clima_source`, commit `ab1fcaa`).

---

## 1. `CLIMA_PRODUCT_DISPATCH` — el mapa completo (hoy)

`climaProductDispatcher.ts:46-69` — `Record<InterventionTarget, DispatchDescriptor>`.
`InterventionTarget` = 4 valores (`clima-planes.ts:54`). `resolveDispatch(target)` (`:72-73`)
existe pero **sin consumidor**.

| target | `kind` | `endpoint` | `requires` | `pending` |
|---|---|---|---|---|
| `SIN_CTA` | `none` | `null` | `[]` | — |
| `PDI_CLIMA` | `pdi` | `/api/clima/pdi-suggestion` | `employeeId, cycleId, driver, teamFavorability` | — (VIVO, Gate 5B-ii) |
| `META_AREA` | `meta` | `/api/goals` | `departmentId, title, target` | `'5D Tab 2 (POR PERSONA) — wiring clima→/api/goals aún no construido'` |
| `META_DURA` | `meta` | `/api/goals` | `employeeId, cycleId, title, target` | idem META_AREA |

---

## 2. Dispatcher META_* vs RESOLUCION §3 — direccionalmente OK, 2 desvíos de datos

El `requires` es un **subconjunto** del contrato (solo el contexto que aporta la UI); el
runtime deriva el resto (`metricType:NUMBER`, `weight:100/N`, `originType:CLIMA_TRIGGERED`,
`kpiSource:OWN`, `family/subfamily`, `sourceReferenceId`). META_AREA vs META_DURA difieren
solo en de dónde viene `employeeId` (directo vs walk-up desde `departmentId`) — consistente
con SPEC_UI §6 (ambas terminan como la misma meta `INDIVIDUAL`). El contrato coincide.

### ⚠️ DESVÍOS DE DATOS — DECISIÓN PENDIENTE (no de arquitectura, de datos)

**Desvío 1 — `description = Question.text` es hoy insatisfacible.** RESOLUCION §3.2 exige
`description = texto completo de la pregunta real`. Pero `Question.text` **no está en el
pipeline de clima** (`ClimaAggregationService:160-167` no selecciona `text`). Requiere
plomería nueva (join a `Question` por `subcategory`).

**Desvío 2 — la meta es PER-REACTIVO, pero Tab 2 quedó dimensión-only.** SPEC_UI §1 crea
1-3 metas, **una por reactivo** (`weight:100/N`, `startValue = mean del reactivo`, título del
reactivo). El endpoint `by-person` que construimos es **dimensión-only** (le sacamos slug y
mean del reactivo, commit `b18b510`). La pantalla del slider (Fase 3) necesita el dato
reactivo de vuelta.

**Raíz común:** el detalle reactivo (slug + mean + `Question.text`) que Tab 2 ocultó, Fase 3
lo necesita. **Decisión pendiente de Victor:** cómo vuelve ese dato — endpoint reactivo
nuevo vs extensión opcional de `by-person` (modo "drill" al abrir la pantalla de meta).

---

## 3. `PDI_CLIMA` — reusa Gate 5B tal cual

El `requires` (`driver`, `teamFavorability`) matchea exacto `ClimaCrossEvidence`
(`pdi-suggestion.ts:69-73`: `{driver, teamFavorability, gap360?}`) — **dimensión-level,
sellado (Gate 5B-i/ii)**. Endpoint `/api/clima/pdi-suggestion` VIVO. → **Se reusa tal cual**,
no necesita dato reactivo. El foco-reactivo del PDI (agregar `reactive?`/`reactiveMean?` a
`ClimaCrossEvidence` + engine + route) es incremento **NO bloqueante** (SPEC_UI §2.3, degrada
a dimensión). Faltante menor: `by-person` no expone `teamFavorability` hoy (derivable de
`driverAnalysis.fav`).

---

## 4. Call-site de `activateProduct` — NO existe, hay que crearlo

`activateProduct` **solo aparece en comentarios** (`climaProductDispatcher.ts:10`), cero
call-sites reales. Los componentes Tab 2 tienen el hook `onAction?` y los CTA llaman
`onAction?.(departmentId, route, kind)` (`ClimaPersonaWorkspace`), pero `ClimaPlanesView`
**no pasa `onAction`** → CTA inertes. Falta: (a) la función `activateProduct`, (b) el handler
`onAction` en el orquestador que reúne contexto y la llama, (c) **la pantalla del slider entre
el CTA y `activateProduct`** (per-reactivo, SPEC_UI §1, NO existe — grep de copy distintivo
vacío).

---

## 5. Dimensionamiento

### NUEVO por construir
- **`GoalsService.createClimaTriggeredGoal(input)`** — 4º creador separado (patrón de sus 3
  hermanos `createCorporateGoal:276` / `createManagerGoal:333` / `createFromDevelopmentGoal:950`).
  Setea `originType:'CLIMA_TRIGGERED'` · `level:'INDIVIDUAL'` · `kpiSource:'OWN'` ·
  `metricType:'NUMBER'` · `family:'Cultura y Personas'`/`subfamily:'Clima'` · `sourceReferenceId`
  · `weight:100/N` · `startValue`(mean reactivo)/`targetValue`(slider). Reusa
  `validateTotalWeight`/`checkGoalWeight`, baja a `prepareGoalData`. **Contiene el catch P2002**
  de `unique_goal_clima_source` → `GoalDuplicateError` (decisión Victor 2026-07-25).
- **Pantalla del slider per-reactivo** (SPEC_UI §1/§2) — el grueso del trabajo UI.
- **Data-path reactivo para Fase 3** (endpoint nuevo o extensión de `by-person`) — resuelve
  Desvíos 1 y 2. *Su forma depende de la decisión pendiente.*
- **Resolución `Question.text`** (join por `subcategory`) — plomería nueva.
- **`activateProduct(target, ctx)`** runtime (fetch por `kind`, consume `CLIMA_PRODUCT_DISPATCH`).
- **Wiring `onAction`** en `ClimaPlanesView`/orquestador → slider → `activateProduct`.
- **Capa persona:** resolver `employeeId` del responsable + gating (parcial:
  `resolveDepartmentResponsable` existe).

### REUSAR tal cual
- `CLIMA_PRODUCT_DISPATCH` + `resolveDispatch` (falta consumidor).
- PDI: `/api/clima/pdi-suggestion` + `PDISuggestionEngine` + `ClimaCrossEvidence` (Gate 5B).
- `checkGoalWeight`/`validateTotalWeight` (peso, `2aabbe2`).
- `calculateProgress` + `GoalMetricType.NUMBER` (% de avance).
- `GoalDuplicateError` + `goalsErrorResponse` (mapeo 400 ya existe, `:43`).
- `resolveDepartmentResponsable` (walk-up).

### AJUSTAR (chicas)
- **P2002 catch:** `goalsErrorResponse` NO atrapa P2002 crudo (cae al 500, `:52-54`) → el catch
  vive DENTRO de `createClimaTriggeredGoal` (relanza `GoalDuplicateError`). ~5-8 líneas. (Los
  throws existentes en `:917,941` son de pre-checks de cascada, NO del P2002 nuevo.)
- **`useGoals.ts:33`:** agregar `CLIMA_TRIGGERED` a la union local (1 línea, no da error TS —
  no hay `switch(originType)`, verificado por grep).
- **`CLIMA_GOAL_TARGET_MIN_DELTA`:** no existe (grep vacío) → crear constante 0.2 propia
  (RESOLUCION §3.4).

### BLOQUEANTES EXTERNOS (no son código de esta pieza)
- **`responsableId` 0% asignado** — espera la 1ª nómina real.
- **Gating sin Employee real** — el fallback admin no tiene Employee → CTA gateado (ya resuelto
  el comportamiento: deshabilitar hasta que exista responsable real, decisión Victor 2026-07-24).

---

**Síntesis:** dispatcher + PDI + peso + errores + progreso = REUSAR. El trabajo nuevo grande =
pantalla slider per-reactivo + data-path reactivo (resuelve los 2 desvíos) + `activateProduct` +
`createClimaTriggeredGoal`. Las 3 pendientes conocidas son chicas. Los 2 desvíos de datos se
resolvieron por **endpoint reactivo nuevo** (decisión Victor 2026-07-25); la creación entra por
**endpoint clima nuevo** (no el router `/api/goals`). Plan aprobado: `eager-singing-pascal.md`.

---

## Progreso de build (2026-07-27) — sin commitear todavía

| Grupo | Estado | Archivos |
|---|---|---|
| **A — endpoint reactivo + helper** | ✅ HECHO + verificado (smoke 6/6: questionText real + tier; 2 desvíos resueltos; tsc exit 0) | **NUEVO** `src/app/api/clima/action-plan/reactives/route.ts` · **MOD** `src/lib/services/clima/climaTab2Routing.ts` (extraído `belowTierReactives` exportado, fuente única; `routeDepartmentTab2` lo consume) · **NUEVO** `prisma/scripts/smoke-reactives-endpoint.ts` (regresión) |
| **E — constante + union** | ✅ HECHO | **MOD** `src/lib/services/clima/climaThresholds.ts` (`CLIMA_GOAL_TARGET_MIN_DELTA=0.2`) · **MOD** `src/hooks/useGoals.ts:33` (`+CLIMA_TRIGGERED` en la union local) |
| **F — subfamilia Clima** | ✅ verificada | reuso `FAMILY_CLIMA`/`SUBFAMILY_CLIMA` de `goalCategories.ts:66-67` (no hardcodear) |
| **Paso 0 — `prisma generate`** | ✅ corrido por Victor (había EPERM por el dev lockeando el client) | — |
| **Schema — 1 col → 2 cols** | ✅ HECHO + db push a prod + verificado (índice `UNIQUE` de 4 cols en `pg_indexes`) | **MOD** `prisma/schema.prisma` (`sourceReferenceId`→`sourceActionPlanId`+`sourceTriggerRef`; `@@unique` 3→4 cols) |
| **B — `createClimaTriggeredGoal` + create-meta** | ✅ HECHO + smoke 22/22 (handler real, cuenta test, cleanup transaccional) | **MOD** `GoalsService.ts` (`CreateGoalInput` +2 cols · `createClimaTriggeredGoal`) · **NUEVO** `src/app/api/clima/action-plan/create-meta/route.ts` · **NUEVO** `prisma/scripts/smoke-create-meta-clima.ts` (borrar al sellar) |
| **C — pantalla slider** | 🔧 componentes construidos (tsc exit 0; build en verificación) | **NUEVO** `ClimaFixMetaScreen.tsx` + `ClimaMetaSliderCard.tsx` (en `dashboard/clima/components/planes/`) · **MOD** `climaTab2Content.ts` (bloque `TAB2_META_SCREEN` + 5 armadores) |
| **D — wiring** | 🔧 construido (tsc exit 0; build en verificación) — **meta funcional, pdi diferido** | **MOD** `ClimaPlanPersonaTab.tsx` (lee plan aprobado → monta `ClimaFixMetaScreen`, vista `fixmeta`, refetch en éxito) · **MOD** `ClimaPersonaWorkspace.tsx` (gates `metaEnabled`/`pdiEnabled`/`metaGateReason`) · **MOD** `ClimaPlanesView.tsx` (`fixmeta` en `bare`) · **MOD** `climaProductDispatcher.ts` (META_* → create-meta, quitado `pending`; PDI_CLIMA marcado `pending` Blocker 2) · **MOD** `climaTab2Content.ts` (`TAB2_META_GATE`) |

### D — cómo quedó el wiring (2026-07-27)

- **meta (funcional):** `ClimaPlanPersonaTab` fetchea el plan aprobado de la campaña
  (`GET /api/action-plans?moduleType=clima&campaignId&estado=aprobado`) junto al by-person.
  `onAction(dept, _, 'meta')` → si hay plan aprobado, monta `ClimaFixMetaScreen`
  (`sourceActionPlanId = plan.id`, vista `fixmeta`, bare); en éxito refetchea by-person. Si NO hay
  plan aprobado, el CTA meta queda gated con razón visible (`TAB2_META_GATE.needsApprovedPlan`,
  "aprobá el plan en Por departamento primero") — nunca crea en silencio (§3.6). Doble gate:
  responsable real (`ctaEnabled`) **y** plan aprobado (`metaEnabled`).
- **pdi (diferido, Blocker 2):** `pdiEnabled=false` → CTA gated. No hay pantalla de PDI en el
  dashboard de clima; documentado en `PENDIENTES_ACTIVOS_EX_CLIMA`. `pdi-suggestion` sigue API-only.
- **NO se construyó `activateProduct`:** el wiring meta es directo en el tab; un `activateProduct`
  sin consumidor sería código muerto. El dispatcher quedó como documentación del target (endpoint
  create-meta, sin `pending` para meta).

### Corrección de alcance de C (al leer el Workspace real, 2026-07-27)

Leyendo `ClimaPersonaWorkspace.tsx` (el que en D montará la pantalla) apareció que **el Paso 0
(elección meta/PDI) y el Estado B ya están implementados ahí** (`DeptRow` → `ChoicePath` con
`TAB2_CHOICE`, y `pdiMandatory` para `ESTADO_B_PDI`). El Workspace dispara
`onAction(departmentId, route, 'meta'|'pdi')`. Por lo tanto `ClimaFixMetaScreen` se entra **solo
con `kind='meta'`** y es **puramente el flujo de slider-cards** — NO repite Paso 0 ni Estado B
(construirlos de nuevo duplicaría lo existente). Mi Gate 1 los incluía; la lectura del código lo
corrigió. Decisión de jerarquía: acordeón **single-open** (una card expandida a la vez, arranca la
más crítica) → nunca hay más de un número grande a la vez; el `text-[72px]` de Portada NO se
repite por card (expandida usa `text-5xl/6xl`, un escalón por debajo). Tokens: `CompensationPortada`
(verificado en archivo, `:36`), NO Cinema Mode.

Nada commiteado aún; se agrupa en commits al cerrar bloques coherentes.

### Cambio de schema durante B (decisión Victor, 2026-07-27)

El campo `sourceReferenceId` (nacido en `ab1fcaa`, mismo día, **0 filas lo usaban**) se
reemplazó por **dos columnas separadas** `sourceActionPlanId` + `sourceTriggerRef` (patrón
`CompliancePlanAction`), y el `@@unique` pasó de 3 a 4 columnas
(`accountId, employeeId, sourceActionPlanId, sourceTriggerRef`).

**Por qué:** las N metas de una decisión van al MISMO responsable → con un solo
`sourceReferenceId` compartido, la 2ª meta chocaba P2002 contra la 1ª. El contrato (§3.5)
dice que la trazabilidad es `{actionPlanId, triggerRef}` — el `triggerRef` (= el reactivo)
distingue cada meta. Dos columnas > string compuesto: habilita queries directas para la
notificación futura de enmienda (§3.5) y no depende de un separador que falle en silencio.
Idempotencia real = una meta por **(persona, plan, reactivo)**. Verificado: `source_reference_id`
eliminada, 2 columnas nuevas presentes, índice `UNIQUE` de 4 columnas en prod.

El endpoint recibe `sourceActionPlanId` (base) + por meta `reactive` (= `sourceTriggerRef`),
sin componer strings.

### Reparto de peso — corrección de correctitud durante B (decisión Victor, 2026-07-27)

`weight: 100/N` **literal rompía N=3**: `100/3 × 3 = 100.00000000000001` en Float, y
`validateTotalWeight` (`GoalsService.ts:898`) compara con `>` estricto sin tolerancia → la 3ª
meta rebotaba con `GoalWeightExceededError`. Solución (Opción A, método enterprise del resto
mayor, como facturación): **reparto entero general** `piso(100/N)` a cada meta + 1 punto del
resto a las primeras `remainder` metas. N=3 → `[34,33,33]`, N=2 → `[50,50]`, N=1 → `[100]`;
suma EXACTA 100 (enteros < 2^53 exactos en Float). Función general en el endpoint, **sin casos
hardcodeados por N** (cero-hardcode). NO toca el validador sellado. Verificado en el smoke
(suma de pesos = 100 exacto).
