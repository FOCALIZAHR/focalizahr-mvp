---
name: project_metas_inventario_producto
description: "Inventario de producto del módulo Metas (Goals) FocalizaHR — capacidades, modelo de datos (incl. GoalCycle + GoalAlert), APIs, UI, motores, flujo de cierre, presupuesto de peso. Mapa para base madre comercial. Revisado jul-2026."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Metas (Goals) mapeado como producto. Mapeo original 2026-06-25; **revisado y re-verificado contra código vivo 2026-07-13** (GoalCycle, flujo de cierre, permisos/APIs regularizados, presupuesto de peso). Read-only, file:line abajo. Es motor de cascada estratégica + medición + diagnóstico Goals×Performance. Se enchufa a Performance vía getEmployeeGoalsScore.

**CAMBIO DE SOBERANÍA (jul-2026):** la ficha vieja decía "soberano, periodYear propio, independiente de ciclos". **YA NO.** Existe `GoalCycle` (contenedor temporal propio de Metas, NO es PerformanceCycle) y **sin ciclo ACTIVE no se puede crear una meta** (409, Gate E). `periodYear` ya no lo elige el usuario: se deriva del `year` del ciclo heredado.

---

**MODELO DE DATOS (9 modelos, 11 enums) — prisma/schema.prisma:**
- `Goal:2854-2969` (~40 campos): jerarquía (**`parentId`** self-relation `GoalCascade` :2861-2863, level, originType), propiedad (employeeId/departmentId/createdById), definición (title/description/type), vigencia (startDate/dueDate/periodYear/periodQuarter), **`goalCycleId String?` :2892** (contexto OPCIONAL, onDelete SetNull — nullable a propósito: nunca bloquea editar una meta vieja), medición (metricType/startValue/targetValue/currentValue/unit), resultados (progress/status/**isAligned :2909**/**isOrphan :2910**), integración perf (weight :2915), PDI (linkedDevGoalId @unique), isLeaderGoal :2943, cierre de meta (closureRequestedAt/By/**ById** :2948-2954, closedAt/By, closureApprovedBy, closureNotes). 9 índices.
- `GoalProgressUpdate:2975` — Time Travel, snapshot inmutable (previous/newValue+Progress, comment, evidence).
- `GoalAlert:3019` — bandeja slim read-receipt de avisos de metas (ver [[project_goal_alerts]]).
- `GoalLibrary:3046-3071` — templates anti hoja-en-blanco. **`category String` libre :3052** (comentario: "Ventas"/"Operaciones"/"Liderazgo"/"Finanzas"), indexado :3069. **⚠️ FEATURE DORMIDA: la tabla tiene 0 filas en producción** y solo se toca en `api/goal-library/route.ts` — sin FK a Goal, su `category` NO se copia a ninguna meta.
- `GoalJobConfig:3077` — elegibilidad por standardJobLevel. `GoalGroup:3098` — pesos weightBusiness/Leader/NPS/Specific (**ponderación de bono por cargo del jefe — NO es categoría de contenido**). `GoalCascadeRule:3128` — reglas de cascada automática.
- **`GoalCycle:3163-3209`** — name, periodType, year, `quarter/semester Int @default(0)` (NO nullable: en Postgres NULL no colisiona en UNIQUE, 0 sí), 3 ventanas (assignment/tracking/closure), status, requiresClosure/lockAfterClosure, linkedPerformanceCycleId (soft ref sin FK), auditoría de cierre y de edición de ventanas. `@@unique([accountId, year, periodType, quarter, semester])` = 1 ciclo por PERÍODO (**NO** es el candado de "1 ACTIVE").
- Enums: GoalLevel (COMPANY/AREA/INDIVIDUAL) :3215 · GoalOriginType (STRATEGIC_CASCADE/MANAGER_CREATED) :3221 · GoalType (KPI/OBJECTIVE/KEY_RESULT/PROJECT) :3226 · GoalMetricType :3233 · **GoalStatus** (NOT_STARTED/ON_TRACK/AT_RISK/BEHIND/PENDING_CLOSURE/COMPLETED/CANCELLED) :3240 — **ojo: NO existe estado "ACTIVE" en la meta** · GoalPeriodType :3250 · **GoalCycleStatus** (PLANNING/ASSIGNING/ACTIVE/CLOSING/CLOSED) :3256.
- Integración: PerformanceRating (goalsScore/goalsRawPercent/goalsCount/hybridScore), PerformanceCycle (includeGoals 70/30), Account.maxIndividualGoals (default 10).

---

**GOALCYCLE — el contenedor temporal (proyecto Gates A–E COMPLETO, jul-2026):**
- **Invariante "1 ciclo ACTIVE por cuenta"**, garantizado por **advisory lock transaccional** (`pg_advisory_xact_lock`) dentro de `$transaction` en `GoalCycleService.activate()` — no por índice único ni por count-en-código (TOCTOU).
- **"Crear ≠ activar":** crear deja el ciclo en PLANNING (reversible, sin candado). Activar es irreversible → ahí va la fricción (modal de confirmación + candado).
- State machine: **PLANNING → ASSIGNING → ACTIVE → CLOSING → CLOSED** (`GoalCycleService.ts`).
- **Herencia automática:** los 4 creadores de Goal resuelven el ciclo ACTIVE vía `resolveInheritedCycleId` (`GoalsService.ts:1349`) — el payload del cliente NUNCA manda `goalCycleId`.
- **Ventanas:** las 3 son editables mientras el ciclo no esté CLOSED (`updateCycleWindows`, validador server compartido `validateWindowOrder`). Las fechas de la meta deben CABER en el rango del ciclo (`startDate ≥ assignmentWindow`, `dueDate ≤ closureWindow`), fuente única `src/lib/utils/goalCycleDates.ts`.
- **Sin ciclo ACTIVE → crear meta = 409** ("No hay ciclo activo. Pide a tu administrador abrir uno.") en `POST /api/goals:331-336` y en `/from-pdi`.
- Remanente único: **D.7 (alerta de closureWindow próxima)** — UX no bloqueante, diferido por Victor.
- Detalle completo de gates/commits: [[project_goalcycle_gates]].

---

**FLUJO DE CIERRE — son DOS flujos distintos, no confundir:**

1. **Cierre de UNA meta** (juicio humano, permiso `goals:approve`): el dueño pide cierre (`requestClosure`, `GoalsService.ts:972`) → la meta pasa a **PENDING_CLOSURE** → cae en la bandeja `pending-closure` → el aprobador **aprueba** (`approveClosure:1036` → COMPLETED) o **rechaza con motivo ≥10 chars** (`rejectClosure:1099`). UI: `/dashboard/metas/aprobaciones`. ✅ **Ya es consumible end-to-end** (el botón "Solicitar Cierre" quedó cableado: `metas/[id]/page.tsx:117` pasa `onRequestClosure` — la deuda vieja de la ficha está CERRADA, backlog P?/`380130f`).

2. **Cierre del CICLO completo** (administración, permiso `goals:cycles:manage`): `close` (ACTIVE→**CLOSING**) → modal wizard de 3 actos (Briefing → Decisiones → Veredicto) → `finalize` (CLOSING→**CLOSED**). En el acto de Decisiones, cada meta incompleta cae en **3 baldes**: `CLOSE_WITH_SCORE` (escritura directa a COMPLETED, cierre forzado) · `MARK_REVIEW` (→ PENDING_CLOSURE, cae en la bandeja del flujo 1) · `LEAVE_AS_IS` (no-op). Backend bulk tx-aware TODO-O-NADA (`GoalsService.applyCycleClosureDecisions:1211`) — se hace en ~5 statements y no per-meta porque el piloto real tenía 182 metas incompletas y un loop revienta el timeout de `$transaction` (5s).
- **`lockAfterClosure`** bloquea el check-in solo cuando el ciclo está **CLOSED** (nunca en CLOSING, nunca por `Goal.status`).
- Prueba real ejecutada por Victor sobre "Ciclo Vigente 2026" (182 metas): primera transición ACTIVE→CLOSING→CLOSED verificada por SQL.

---

**ASOCIACIÓN A META CORPORATIVA (investigación 2026-07-13) — el mecanismo YA EXISTE:**
- El campo es **`parentId`** (NO `parentGoalId`), `schema.prisma:2861`. Colgar de una corporativa no es un flag: es *pasar por* `GoalsService.cascadeGoal:202` (hereda `isAligned` del padre :230, `isOrphan=false`). Sin padre → `createManagerGoal:241` marca `isAligned=false` + **`isOrphan=true`** :250-251.
- **El camino manual ya está vivo:** el wizard tiene el paso 5 `StepLinkParent.tsx` (lista de metas padre agrupadas, encabezado literal "Corporativas" :245, opcional :284) y **`POST /api/goals` ya acepta `parentId` en el zod** (`route.ts:45`); el router de creación despacha según ese campo (:350-368). El motor automático (`GoalRulesEngine.ts:151`) entra **por la misma puerta** — no hay mecanismo privilegiado del sistema.
- **Realidad de la base (jul-2026):** 217 metas — solo **52 con padre**, **155 huérfanas** (todas MANAGER_CREATED), 10 COMPANY / 4 AREA / 203 INDIVIDUAL, 4 reglas de cascada. **El camino existe pero el 71% de las metas nace suelta.**

**CATEGORÍA DE CONTENIDO — NO EXISTE HOY (propuesta abierta, sin diseño aún):**
- `Goal` **no tiene ningún campo de categoría/etiqueta temática**. Lo único parecido son `type` (forma de medición), `level` (altura org) y `originType` (procedencia) — ninguno dice *de qué trata* la meta. El "de qué trata" solo vive en `title`/`description` (texto libre, ininspeccionable).
- El homónimo `GoalLibrary.category` (:3052) es **otro concepto** (categoría de *plantillas*), es String libre, **no se propaga a Goal**, y **la tabla está vacía** → "Clima"/"Personas" no existen ahí bajo ninguna forma. No hay nada que reutilizar ni con qué colisionar.
- **Propósito de la propuesta:** que otros módulos (Clima) puedan preguntar *"¿existe una meta corporativa con `category='EXPERIENCIA_COLABORADOR'`?"* por búsqueda directa, sin mecanismo de asociación manual.
- **Viabilidad:** agregar un enum opcional sería **aditivo**, mismo patrón ya usado con `goalCycleId` (nullable, "nunca bloquea crear/editar una meta" — comentario schema :2890-2891). Las metas existentes quedan en NULL, ninguna query rompe. ⚠️ **Trampa a resolver antes de diseñar:** "meta corporativa **ACTIVE**" es ambiguo — `GoalStatus` **no tiene** valor ACTIVE (los estados vivos son NOT_STARTED/ON_TRACK/AT_RISK/BEHIND); `ACTIVE` pertenece a `GoalCycleStatus`. Hay que definir si significa "meta de un ciclo ACTIVE" o "meta en estado no-terminal".
- **CTA2 "Meta dura" de Clima: NO existe en código.** Ningún componente de `dashboard/clima/**` hace POST a `/api/goals`. Lo único vivo es el string `suggestedProduct: 'Meta dura + …'` en `ClimaInterventionDictionary.ts` (:58,64,70,76,82,88,94,100,127) — etiqueta de texto, sin acción cableada. El doble CTA "PDI suave + Meta dura" está planificado en `MAESTRO_EX_CLIMA.md:1101` (Gates 6-7, PENDIENTES). Cuando se implemente, el payload se escribe de cero: `parentId` ya lo acepta la API; `category` no existe en ninguna capa.

---

**PRESUPUESTO DE PESO (100% por colaborador) — el servidor SÍ valida, el wizard NO bloquea:**
- **Servidor (validación real):** `GoalsService.validateTotalWeight:640-662` suma el `weight` de las metas del empleado (accountId + employeeId + level INDIVIDUAL + status activo :645-653) y **lanza si `total + nuevo > 100`** (:657). La invocan `cascadeGoal:218`, `createManagerGoal:245` y `createFromDevelopmentGoal:731`, siempre dentro de `if (input.employeeId)`. → **Una petición directa al endpoint, sin pasar por el wizard, ES rechazada.** (COMPANY/AREA no validan peso a propósito: no consumen presupuesto de nadie.)
- **Cliente (solo informativo):** `CreateGoalWizard.tsx:222-224` calcula `availableWeight = 100 - totalWeight` (el total viene del backend vía `/api/goals/team`); `StepLinkParent.tsx` muestra "Peso disponible: N%" (:296-300) y el aviso rojo `WeightAlert` (:47-72). **Pero NO bloquea:** `canProceed` para el paso 5 devuelve `return true // Opcional` (`CreateGoalWizard.tsx:311-312`) → el usuario puede avanzar con el cartel rojo en pantalla y enviar. El bloqueo real lo pone el servidor.

---

**🔴 HALLAZGOS ABIERTOS — DOCUMENTADOS, NO ARREGLADOS (esperan orden de Victor):**
Mismo tratamiento que el error de check-in de ciclo cerrado: quedan anotados, se retoman cuando Victor lo decida. Evidencia = lectura de código (no se forzó el bug en vivo, decisión explícita de Victor).

1. **`PATCH /api/goals/[id]` no revalida el peso.** El zod acepta `weight` (`api/goals/[id]/route.ts:16`) y el update hace `const updateData: any = { ...data }` → `prisma.goal.update` (:241-248) **sin llamar a `validateTotalWeight`**. Crear está protegido; **editar el peso después, no**: se crean 3 metas de 30% y luego se editan a 90% cada una, y nada lo impide.
2. **`validateTotalWeight` no tiene noción de ciclo ni de año.** Su `where` (`GoalsService.ts:646-651`) filtra por empleado y status, pero **no por `goalCycleId` ni `periodYear`** → metas de un ciclo anterior que quedaron abiertas (ON_TRACK, nunca cerradas) siguen consumiendo el 100% del ciclo nuevo. **BAJADO DE URGENCIA (2026-07-13):** con la decisión de rollover confirmada (ver abajo), el diseño correcto es **"meta nueva por ciclo"**, NO "sumar el historial completo" — así que esto es menos grave de lo que parecía. *(CORRECCIÓN: una versión anterior de esta ficha justificaba la urgencia con "155 metas huérfanas en base". Eso era un error de concepto: las 155 son `isOrphan` = sin meta PADRE, que no tiene nada que ver con el ciclo. Metas con `goalCycleId = null` hoy: **0**, medido directo.)*
3. **El error de peso se degrada a 500 opaco.** `validateTotalWeight` lanza un mensaje explicativo ("Peso total excede 100%. Actual: X%…"), pero el `catch` de `POST /api/goals` (`route.ts:384-389`) responde `{ error: 'Error creando meta' }` con **status 500**. El usuario ve un fallo genérico de servidor en vez de un 400 diciéndole que se pasó de peso.
4. **(Ya conocido, misma familia) Check-in sobre ciclo CLOSED → 500 genérico.** El guard `lockAfterClosure` (en `updateProgress`) lanza correctamente, pero el `catch` de `api/goals/[id]/check-in/route.ts:126-131` lo aplana a `{ error: 'Error actualizando progreso' }` **500**. La causa real (ciclo cerrado) nunca llega al cliente. Los 3 huecos de arriba y este comparten raíz: **errores de dominio tratados como fallos de infraestructura**.

**Prioridad real tras el diagnóstico:** los huecos VIVOS a cerrar son el **PATCH sin revalidar (1)** y los **500 opacos (3 y 4)**. El (2) baja de urgencia por la decisión de rollover.

---

**✅ DECISIÓN DE ARQUITECTURA — ROLLOVER DE METAS (Victor, 2026-07-13, CONFIRMADA):**
**Una meta `LEAVE_AS_IS` queda congelada para siempre en su ciclo original. Sin excepciones.** Es registro histórico correcto: la meta pertenece al ciclo en que se definió y ahí muere. Si el trabajo sigue vivo al cerrar el ciclo, la continuación es una **meta NUEVA, creada desde cero en el ciclo activo** — **nunca un traspaso automático del mismo objeto** (no se re-asigna `goalCycleId`, no se "mueve" la meta). Consecuencia de diseño: el presupuesto de peso es **por ciclo**, no un acumulado histórico. Pendiente futuro (NO urgente): UI de "continuar meta" que cree la meta nueva pre-poblada desde la vieja.

---

**🧹 SANEAMIENTO EJECUTADO (2026-07-13, autorizado por Victor) — 2 escrituras a producción:**

**(a) Borradas 125 metas del seed.** Firma doble `createdById='seed-script'` + `[DEMO SEED]` (0 falsos positivos/negativos), borrado por id exacto en `$transaction`. Base: **217 → 92 metas**. Cayeron en cascada 212 `GoalProgressUpdate`. Empleados con peso >100%: **39 → 3**. Los 3 residuales (145%/130%/124%) son metas de API de **feb-2026**, contemporáneas al nacimiento de `validateTotalWeight` (`f595883`, 2026-02-25) — **NO hay casos recientes: el hueco del PATCH no está sangrando hoy** (salvedad: un PATCH de peso no deja rastro auditable, y la migración A.5 pisó todos los `updatedAt` el 2026-07-06).

**(b) `DESEMPEÑO_TP26` → `includeGoals = false` + `generateRating` re-corrido para las 50 personas.**
- **RAZÓN DE NEGOCIO (Victor):** *"DESEMPEÑO_TP26 se marcó `includeGoals=false` porque las metas de ese ciclo nacieron sin ventana real de seguimiento antes del cierre — no aporta señal real, y ponderar sobre eso perjudicaba injustamente a quienes sí tenían metas asignadas."* Concreto: el ciclo cierra el **2026-02-28** y las metas reales se crearon el **24-26 de febrero** → ningún check-in alcanzó a registrarse. El Time Travel al `endDate` las encontraba con **0% de progreso**, hundiendo el 30% del score híbrido a `goalsScore = 1.0` (el piso). Paradoja que se evitó: quien NO tenía metas se clasificaba solo por competencias y **salía mejor** que quien sí las tenía.
- **Contaminación previa:** el seed (`updateMany` :289-300) sobrescribió `goalsScore/goalsRawPercent/goalsCount/hybridScore` en **50 ratings REALES** (creados 15-16 feb por el proceso real, ciclo **ACTIVE** con 99 asignaciones / 48 evaluaciones completadas). NO creó filas: las pisó.
- **Resultado verificado:** `calculatedScore` cambió en **0/50** (determinismo confirmado: `getEvaluateeResults` + `calculateWeightedScore` re-corridos = idénticos). `nineBoxPosition` cambió en **0/47** — porque `recalculate9BoxPosition:803` usa `finalScore ?? calculatedScore`, **NO el híbrido** (el 9-box nunca estuvo contaminado). `roleFitScore` cambió en **0/50**. `hybridScore`/`goalsScore`/`goalsCount` → null/0 en las 50. **`calculatedLevel` cambió en 25** (ahora clasifica por competencias, no por el híbrido contaminado que los arrastraba hacia abajo). 0 calibrados, 0 `finalScore` → no se pisó ningún ajuste manual.
- **INDETERMINADO (cerrado por Victor, sin más investigación):** no se puede saber si el ciclo nació con `includeGoals=true` o si lo activó el seed (:71-78). **NO existe auditoría de `performance_cycle`**: 0 entradas en `AuditLog` con ese `entityId`, y el `entityType` `performance_cycle` no existe en las 1.741 filas de la tabla (ningún endpoint de ciclos escribe auditoría). Irrelevante en la práctica: 70/30/true coincide con el fallback por defecto de `generateRating`.

---

**🔬 DIAGNÓSTICO: por qué el 100% está roto en la base (investigado 2026-07-13, evidencia real):**
- **Estado medido:** de 49 empleados con metas INDIVIDUAL activas, **39 superan el 100%** (hasta 230%). El invariante del presupuesto **hoy no se cumple en los datos**.
- **CAUSA RAÍZ = `prisma/scripts/seed-goals-demo.ts`, NO un fallo del sistema.** El script escribe con `prisma.goal.create` **directo** (:157), sin pasar por `GoalsService` → **se saltea `validateTotalWeight`**. Asume pizarra en blanco (":146 *Each employee gets 2-3 goals with combined weight = 100*", pesos `[60,40]` o `[50,30,20]` :148) y le sumó otro 100% encima a empleados **que ya tenían metas reales**. Firma: `createdById: 'seed-script'` + `[DEMO SEED]` en description. Corrió **una sola vez** (0 títulos duplicados por empleado). Contamina producción (base Supabase única).
- **Caso real:** empleado `cmktf3127…` = 45 + 55 (API, feb-2026, suman exactamente 100 → **la validación SÍ funcionó**) + 50 + 30 + 20 (seed, abr-2026) = **200%**.
- **El PATCH NO fue el culpable histórico:** las 71 metas de API "modificadas tras crearse" tienen todas el mismo `updatedAt` (`2026-07-06T04:42`), que es la firma del `updateMany` de la migración A.5 asociando `goalCycleId` — no ediciones de peso. *(Matiz: la migración pisó `updatedAt`, así que un PATCH anterior a jul-2026 quedaría enmascarado.)*
- **⚠️ RESIDUAL SIN EXPLICAR:** tras simular el borrado del seed, **3 empleados siguen >100%** (145%, 130%, 124%) con **solo 2 metas cada uno, ambas creadas vía API**. Dos metas de API no deberían poder sumar 145% — la validación de creación lo habría rechazado. **Es la única evidencia positiva de que algo esquivó la validación por la vía de la app** (candidatos: el PATCH del hallazgo 1, o metas anteriores a que existiera la validación). PENDIENTE de investigar.
- **Limpieza: ✅ EJECUTADA (2026-07-13)** — ver "SANEAMIENTO EJECUTADO" arriba (borrado de las 125 + `includeGoals=false` en TP26 + regeneración de los 50 ratings).
- **⚠️ REGLA QUE DEJA ESTE EPISODIO:** ningún script/seed debe escribir `Goal` con `prisma.goal.create` directo — **siempre vía `GoalsService`**, que es donde vive `validateTotalWeight`. El seed asumió pizarra en blanco sobre datos reales de producción (base Supabase única). Si `seed-goals-demo.ts` se vuelve a correr, reproduce el mismo daño.

---

**SERVICIOS/MOTORES:**
- `GoalsService.ts` (~1400 líneas): createCorporateGoal:185, cascadeGoal:202, createManagerGoal:241, updateProgress:265, getEmployeeGoalsScore:345 (**TIME TRAVEL**), detectOrphans:431, getAlignmentReport:449, getAlignmentTree:505, checkGoalLimit:607, createFromDevelopmentGoal:710, linkExistingGoal:783, requestClosure:972, approveClosure:1036, rejectClosure:1099, getPendingClosures:1169, applyCycleClosureDecisions:1211 (cierre de ciclo, bulk), resolveInheritedCycleId:1349. Validaciones privadas: límite de metas :630, **peso ≤100% :640**, anti-duplicado :664/:683.
- `GoalCycleService.ts` — state machine + advisory lock + finalizeCycleWithDecisions. Errores de dominio: GoalCycleActiveError (409), GoalCycleClosedError (409), GoalCycleValidationError (400); mapper `src/lib/api/goalCycleErrorResponse.ts`.
- `GoalsDiagnosticService.ts` (1162 líneas): GOALS_THRESHOLDS:38. classifyQuadrant:306 (RoleFit75×Metas80 → CONSISTENT/PERCEPTION_BIAS/HIDDEN_PERFORMER/DOUBLE_RISK/NO_GOALS). calculatePearsonR:535. detectSubFindings:558 (5 narrativas persona). detectOrganizationalFindings:781 (3 gerencia). getCorrelationDetailV2:940. evaluatorStatusToBadge:334. Hallazgo 2C evaluadorProtege:615.
- `GoalsSynthesisEngine.ts:55` — severidad EVALUADOR>CONCENTRACION>ESTRELLAS>FRAMEWORK>ALINEADO>GENERALIZADO. Veredicto AUDITABLE/CON_RESERVAS/NO_AUDITABLE.
- `GoalRulesEngine.ts`: previewRuleImpact:65, applyCascadeRule:131 → delega en `GoalsService.cascadeGoal:151`.
- Narrativas: `GoalsNarrativeDictionary.ts` (12), `CompensacionNarrativeDictionary.ts`.

---

**APIs — 22 endpoints reales bajo /api/goals (verificado 2026-07-13):**
- Núcleo: `/` (GET/POST — POST acepta `parentId` y filtra `goalCycleId`), `/[id]` (GET/PATCH/DELETE), `/[id]/check-in`, `/[id]/request-closure`, `/[id]/approve-closure`.
- Lectura/análisis: `/alignment-tree`, `/alignment-report`, `/orphans`, `/employee-score`, `/pending-closure`, `/team`, `/team/coverage`.
- PDI: `/from-pdi`, `/link-pdi`. Avisos: `/alerts` (GET), `/alerts/[id]` (PATCH).
- **Ciclos (Gate C, 5 rutas):** `/cycles` (GET paginado + POST crear=PLANNING), `/cycles/[id]` (GET/PATCH ventanas), `/cycles/[id]/activate` (candado), `/cycles/[id]/close` (→CLOSING), `/cycles/[id]/finalize` (→CLOSED, acepta `decisions[]` opcional), `/cycles/active` (liviano, lo consume el wizard).
- Config: `/config/goal-rules` (+preview/execute), `/config/goal-eligibility`, `/config/goal-groups`, `/config/goals-impact`. Executive: `/executive-hub/goals-correlation`.
- ⚠️ La ficha vieja listaba `/[id]/cascade` — **esa ruta no existe** (la cascada entra por `POST /` con `parentId`).

**PERMISOS (regularizados):** `goals:view` · `goals:create` · `goals:approve` (juicio de cierre por meta) · `goals:config` · **`goals:cycles:manage` (NUEVO)** = [FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, **HR_MANAGER**] — espeja `performance:manage`; **CEO removido a propósito** (participa en el juicio de cierre por meta vía `goals:approve`, no en la administración operativa del ciclo). Aplica también al GET (toda la superficie de gestión de ciclos).
**Filtrado jerárquico VIVO en el núcleo:** `GET /api/goals` (AREA_MANAGER ve COMPANY + AREA/INDIVIDUAL de su scope vía getChildDepartmentIds; EVALUATOR ve COMPANY + INDIVIDUAL por managerId). GOTCHA multi-tenant en `/cycles/[id]`: los métodos del servicio NO filtran por accountId → cada ruta verifica ownership (findFirst id+accountId → **404**, ni 200 ni 403) ANTES de llamar al servicio.

---

**UI:** páginas `dashboard/metas/` (redirector por rol · estrategia=Torre de Control CEO · equipo=Cinema Mode · arbol · aprobaciones · crear · [id] · **ciclos** · configuracion+grupos+reglas). Wizards: **CreateGoalWizard (6 pasos** — el año YA NO se elige, se hereda del ciclo; paso 5 = vincular padre + peso**)**, BulkAssignWizard (4 pasos). Ciclos: `CreateCycleModal` · `ActivateCycleModal` · `EditCycleWindowsModal` · `CloseCycleModal` (wizard 3 actos) + `cycleClosure.ts`/`useCycleClosure.ts`. Cascada ejecutiva Insight#7 (portada→NavPill 3 tabs→actos+heatmaps+modales). Hooks: useGoals, useTeamGoals, useGoalsHubData, useGoalDetail, useAlignmentTree, useGoalAlerts.
- GOTCHA UI: ninguna página `/dashboard/metas/*` monta `DashboardNavigation` (el nav es por-página). Constante de roles UI única: `src/lib/constants/goalCycleRoles.ts` (ver [[feedback-ui-role-arrays-shared-constant]]).

---

**DIFERENCIADORES comerciales:** (1) no es un tracker de OKR, es un **detector de incoherencias organizacionales** (evaluación ≠ resultado). (2) **Time Travel real** (cumplimiento al cierre, no el de hoy). (3) cascada automática por reglas de cargo. (4) integridad auditable por gerencia. (5) **ciclo de metas con cierre gobernado** (candado de 1-ACTIVE, 3 baldes de decisión, lock post-cierre).

**DEUDAS VIGENTES (no vender hasta cerrar):**
- **4 endpoints sin `hasPermission`** (solo extractUserContext+accountId): `employee-score`, `from-pdi`, `link-pdi`, `team/coverage`. DEUDA SEGURIDAD, backlog P0-1. *(La ficha vieja decía 6: `alignment-tree` ya fue cerrado, y `/[id]/cascade` no existe.)*
- Endpoints de escritura con permiso OK pero **sin validación de ownership del recurso por ID**: PATCH `/[id]`, approve-closure, request-closure, check-in.
- Botón "Configurar Sistema" (`/dashboard/metas/estrategia`) visible a CEO/HR_MANAGER pero `goals:config` NO los incluye → 401 (backlog P2-13).
- **Los 4 hallazgos de peso/error 500 de arriba** (abiertos por decisión, no por olvido).
- ✅ CERRADAS desde la ficha vieja: "Solicitar Cierre" sin wiring (ya cableado) · `alignment-tree` sin hasPermission.

Relacionado: [[project_goalcycle_gates]] (gates A–E, commits) · [[project_goal_alerts]] · [[project_metas_cierre_migracion_servicio]] · [[project_gate0_metas_estado_vivo]] · [[project_gate0_base_madre_desempeno_metas]] · [[project_gate0_dossier_calibracion_performance]].

## Por qué importa (vista comercial)

- **Qué resuelve:** no es un tracker de OKR — es un **detector de incoherencias organizacionales**: dónde la evaluación de desempeño no coincide con el resultado real entregado, que es la contradicción más cara y menos visible de una empresa.
- **A quién le importa:** al **CEO** (bonos sin respaldo, talento invisible) y a **RRHH**, que obtiene integridad auditable por gerencia en vez de un promedio que no distingue nada.
- **Qué ofrece que el mercado no:** **Time Travel real** — el cumplimiento se calcula al cierre del período, no con los datos de hoy, así que un ciclo cerrado no cambia retroactivamente cuando alguien actualiza una meta vieja.
- **Alineación sin trabajo manual:** la cascada de metas se genera **por reglas de cargo**, no copiando y pegando objetivos hacia abajo del organigrama.
- **Gobierno del ciclo:** cierre gobernado con candado de un solo ciclo activo por cuenta, decisiones de cierre en baldes explícitos y bloqueo posterior — nadie reabre un período cerrado sin dejar rastro.
