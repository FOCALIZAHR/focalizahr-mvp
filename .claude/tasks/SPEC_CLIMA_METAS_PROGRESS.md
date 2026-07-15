# 📊 PROGRESO — SPEC Clima × Metas (Gate A / B / C)

**Fuente de verdad del plan:** `.claude/tasks/SPEC_CLIMA_METAS_INTEGRACION_v1.md`
**Este doc:** bitácora de avance + resultados de Gate 0 sellados con evidencia.
**Última actualización:** 2026-07-14

> Regla: lo que está acá **NO se re-investiga**. Si una sesión futura duda de un
> dato, verifica el file:line contra el código — no vuelve a explorar desde cero.

---

## 📍 ESTADO ACTUAL — resumen de un vistazo (mantener SIEMPRE al día)

**Objetivo de la tarea:** conectar Clima con Metas (que una meta corporativa de categoría
"Clima" sea encontrable automáticamente) + rediseñar la UX del wizard de creación de metas.

**En curso ahora:** Gate C (UX del wizard), **1 de 7 puntos**. El punto 2 (bifurcación) está
implementado pero SIN COMMITEAR, y tiene un defecto de diseño a resolver (la pantalla de
Alcance se percibe repetida con la bifurcación).

**Qué falta para terminar Gate C:**
1. Resolver el defecto vía **recorrido condicional por ROL** (ver arquitectura interina abajo):
   Estratega → Alcance sin bifurcación; no-Estratega → bifurcación sin Alcance.
2. Los 6 puntos restantes del plan: catálogo de ejemplos de medición, banco de una pantalla,
   slider hero, campo obligatorio "¿Cómo se mide?", selector Familia→Subfamilia, contexto del
   padre en `StepLinkParent`.
3. Smoke con evidencia de EJECUCIÓN (navegación corrida, no solo `tsc`/`build`).

**Flujo de trabajo vigente:** un solo `CreateGoalWizard`, dos recorridos por ROL (no por
elección del usuario). Permiso `goals:create:strategic` verificado en 2 capas: servidor
(garantía real, sellada) + cliente (conveniencia). Detalle en "Arquitectura interina" abajo.

**Prerrequisito RESUELTO (2026-07-15):** `AuthorizationService.ts` se dividió — `hasPermission`
ahora vive en `src/lib/auth/permissions.ts` (PURO, client-safe), re-exportado para no romper
los 198 importadores. Verificado byte-idéntico + tsc/build verdes. Detalle y deuda en
`BACKLOG_ENTERPRISE.md` (incl. hallazgo P1 `globalRoles` sin HR_ADMIN/HR_OPERATOR). El cliente
del wizard ya puede llamar `hasPermission(role, 'goals:create:strategic')` directo.

---

## Estado general

| Gate | Estado |
|---|---|
| **Gate 0 de Gate A** (investigación read-only §2.2) | ✅ **CERRADO** (2026-07-14) |
| **Gate A** (peso por ciclo + BUGs 1/3/4/6) | ✅ **SELLADO** (`937cdf8`, 2026-07-14, smoke 22/22) |
| **Gate 0 de Gate B** (investigación §3.3) | ✅ **CERRADO** (8 hallazgos, 2026-07-14) |
| **Gate B** (categoría familia/subfamilia) | ✅ **SELLADO** (`8bf4cdf`, 2026-07-14, smoke 24/24, **db push aplicado**) |
| **Gate C** (UX wizard) | 🟠 **EN CURSO — 1 de 7 puntos.** Cambios SIN COMMITEAR en el working tree. Ver auditoría abajo |

---

## 🏛️ ARQUITECTURA INTERINA — `CreateGoalWizard` compartido (decisión formal, 2026-07-14)

**Un solo componente, DOS recorridos por ROL — no por elección del usuario.**

`src/components/goals/wizard/CreateGoalWizard.tsx` es hoy el único wizard de creación de
metas. Sirve a dos usuarios con permisos distintos, y el recorrido lo determina el **rol**,
no un clic:

- **Estratega** (`goals:create:strategic` = `[FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN,
  HR_MANAGER]`): ve el paso **Alcance** (Corporativa / De Área / Individual) tal como existe
  hoy. Es su camino para crear metas heredables desde cero. **Sin** bifurcación Meta
  Libre/Definida.
- **No-Estratega** (jefe común): **nunca** ve Alcance. Su meta nace directo a nivel
  `INDIVIDUAL` y entra a la bifurcación Meta Libre / Meta Definida.

**Permiso verificado en 2 CAPAS (defensa en profundidad):**
1. **Servidor (la garantía real, ya sellada):** `POST /api/goals` rechaza con **403** si un
   rol no-Estratega intenta crear `COMPANY`/`AREA` (Gate A / BUG 6, `route.ts` gate
   `goals:create:strategic`). Verificado en el **smoke de Gate A, caso 12** (`AREA_MANAGER`
   → 403; `HR_MANAGER` → 201).
2. **Cliente (conveniencia, NO seguridad):** el wizard no le muestra a un no-Estratega un
   camino que el servidor va a rechazar. Evita el callejón sin salida de llenar el formulario
   y chocar con el 403 al final. Si esta capa fallara, el servidor sigue protegiendo.

**Condición de salida (cuándo deja de ser interina):** se extrae a **dos componentes
separados** cuando se construya **"Ambiente Estrategia"** como ruta propia del Estratega
(gate futuro, sin planificar). Hasta entonces, un componente con recorrido condicional por
rol es deuda reconocida y aceptada — documentada acá para que nadie la "corrija" pensando
que es un descuido.

---

## 🔍 AUDITORÍA DE GATE C — 1 de 7 puntos (2026-07-14)

Auditoría del trabajo real contra el prompt de Plan Mode de Gate C (7 puntos).
**Nada de Gate C está commiteado**: los cambios viven sin sellar en el working tree.

### 1. Qué se implementó y qué no

| # | Punto del prompt | Estado | Evidencia |
|---|---|---|---|
| 1 | Catálogo `GOAL_MEASUREMENT_EXAMPLES` + placeholders derivados | ❌ **NO** | `goalCategories.ts` no contiene el símbolo (grep = 0) |
| 2 | **Bifurcación Meta Libre / Meta Definida** | ✅ **SÍ** | `StepChooseFlow.tsx` (nuevo, 7.816 b) · cableado en `CreateGoalWizard.tsx:17` (import) y `:544` (`case 1`) |
| 3 | Banco de una pantalla (mockup "Netflix") | ❌ **NO** | `src/components/goals/bank/` no existe |
| 4 | Slider hero (`size="hero"` en `PercentageSlider`) | ❌ **NO** | `PercentageSlider.tsx` sin la prop (grep = 0) |
| 5 | Campo obligatorio "¿Cómo se mide?" | ❌ **NO** | ningún `Step*.tsx` contiene el string |
| 6 | Selector Familia → Subfamilia (píldoras) | ❌ **NO** | `FamilySubfamilyPicker.tsx` no existe |
| 7 | Contexto del padre en `StepLinkParent` | ❌ **NO** | `StepLinkParent.tsx` no referencia `description` (grep = 0) |

**Sí se hizo, además del punto 2** (era prerrequisito suyo, no un punto del prompt):
navegación **índice-based** en `CreateGoalWizard.tsx` (`steps` :257-261 · `stepIndex` :265-268 ·
`goNext`/`goBack` :375-403) + `WizardProgress.tsx` index-based. Corrige 5 lugares que comparaban
`currentStep` contra números fijos (`< 6`) y habrían roto el recorrido al aparecer el paso de Peso.

### 2. Por qué se detuvo en el punto 2

**Fue una decisión explícita y acordada, no un bloqueo oculto.** Victor pidió textualmente:
*"implementá SOLO StepChooseFlow (punto 2, la bifurcación) primero, y mostrame cómo queda
visualmente… Recién con esa aprobación visual, continuás con el resto del plan"*.

Los puntos 1 y 3-7 **nunca se empezaron**. No hubo nada que bloqueara: se frenó a propósito
esperando el visto bueno visual, que **no llegó** porque apareció el defecto de la sección 4.

**Errores propios cometidos en el camino (para no repetirlos):**
- Se levantó `npm run dev` para verificar la ruta y **no se bajó** → quedó tomado el puerto 3000
  de Victor. El proceso se mató después (PID 672).
- Se reportó "listo para ver" apoyándose en `tsc --noEmit` + `next build`. **Compilar no es
  funcionar**: ninguna de las dos cosas prueba que la navegación se comporte bien. La verificación
  de comportamiento (simulación determinista de `goNext`/`goBack`: `1 → 9 → 2 → 3 → 4 → 5 → 6`,
  sin volver nunca al paso 1) recién se corrió DESPUÉS de que Victor reportara el defecto.
- Cuando Victor dijo "no veo ningún cambio", la causa real no era caché ni puerto: **la reversión
  que él creía haber hecho no se aplicó a este working tree** (`git diff dfa5ee1` seguía mostrando
  +106/−36). Verificado también que el bundle sí contenía el cambio
  (`.next/static/chunks/app/dashboard/metas/crear/page.js` incluye el string "Meta Definida").

### 3. `CreateGoalWizard` ES el componente compartido — arquitectura, no confusión

Confirmado con file:line. **Un solo wizard sirve a los dos usuarios**:

- `src/app/dashboard/metas/crear/page.tsx:16` → `<CreateGoalWizard employeeId={…} context={…} />`
  es el **único** consumidor. No hay wizard separado para el Estratega.
- `StepSelectLevel.tsx:76-81` decide los niveles ofrecidos **según el rol**: acceso global →
  `COMPANY/AREA/INDIVIDUAL`; `AREA_MANAGER` → sin `COMPANY`; `EVALUATOR` → solo `INDIVIDUAL`.
  Ahí es donde el **Estratega crea Corporativa/Área** y el **jefe crea la meta de su colaborador**.
- La Torre de Control del Estratega no tiene creación propia: `metas/estrategia/page.tsx:456`
  hace `router.push('/dashboard/metas/crear')` — **al mismo wizard**.

**Consecuencia para el rediseño:** la pantalla de Alcance **no es redundante**. Es el único lugar
donde se elige `COMPANY`/`AREA`. Fusionarla o eliminarla sin cuidado le saca al Estratega su
capacidad de crear metas corporativas.

### 4. El defecto reportado: la bifurcación "se siente repetida"

**Diagnóstico:** no es un bug de navegación (la simulación descarta el ciclo). Es un defecto de
**diseño introducido por mí**: al elegir "Meta Libre", el paso siguiente (Alcance, `case 9`) es una
pantalla **con tres tarjetas visualmente idénticas** a las de la bifurcación — mismos tokens
clonados de `StepSelectLevel` (`p-4 rounded-xl border-2 bg-slate-800/50` + Tesla line). Dos
pantallas seguidas que piden "elegí una tarjeta" se leen como la misma pregunta repetida.

**Propuesta de resolución — fusionar en UNA pantalla, con revelación progresiva:**

Paso 1 único, "¿Cómo querés crear esta meta?", con el mismo patrón de despliegue que YA usa la
bifurcación para su Nivel 2 (`AnimatePresence`, `height: 0 → auto`):

```
[ Meta Libre ]  ──elegida──▶ se despliega el selector de ALCANCE (los niveles de
                             StepSelectLevel, filtrados por rol: el Estratega ve
                             Corporativa/Área; el jefe solo Individual) + destinatario
[ Meta Definida ] ─elegida─▶ se despliega el selector de BANCO (Corporativa / De Área)
```

Ventajas: elimina la repetición percibida (una sola pregunta, una sola pantalla), **preserva
intacta la capacidad del Estratega** de crear COMPANY/AREA, y deja Meta Libre en **6 pasos** en vez
de 7. `StepSelectLevel` se reutiliza como sub-componente del desplegable — no se borra ni se
duplica su lógica de roles.

**Alternativa descartada:** mantener las dos pantallas y diferenciarlas visualmente. Resuelve el
síntoma, no la causa: seguirían siendo dos preguntas para una sola decisión.

### 5. Veredicto

**Gate C: 1 de 7 puntos completos. Error: se frenó (correctamente) para verificación visual, pero
se reportó "listo para ver" con evidencia de compilación en vez de comportamiento, y el punto 2
entregado tiene un defecto de diseño — la pantalla de Alcance queda como una repetición visual de
la bifurcación, y la solución es fusionarlas en una sola con revelación progresiva.**

---

## ✅ GATE B — SELLADO (`8bf4cdf`, 2026-07-14)

**6 archivos** (1 nuevo). `db push` **aplicado a producción** (autorizado por Victor):
2 columnas nullables + enum + índice; **96 metas existentes intactas, todas en `NULL`**.
Smoke **24/24** (13 casos). `tsc` + `next build` limpios.

### Decisiones que quedaron grabadas en el código

- **`subfamily` = String, NO enum** (a propósito): hoy solo la lista de *Cultura y
  Personas* está confirmada; un enum costaría **otro `db push` contra producción** por
  cada lista de copy que se confirme. El precio —la base no impone integridad— lo paga
  **`GoalsService.validateCategory`** como única puerta de escritura (evita variantes de
  tipeo). `family` sí es enum: es taxonomía cerrada y de ella dependen queries de otros
  módulos.
- **La herencia de categoría (Camino A) vive en `GoalRulesEngine`, NUNCA en
  `cascadeGoal`.** Los 4 caminos entran por esa misma función: si copiara la categoría
  del padre, **pisaría la que el jefe eligió a mano en el Camino D**. `cascadeGoal` no se
  tocó, y el smoke lo verifica (caso 6).
- **`findActiveStrategicGoal`** implementa la decisión (a): **exige
  `goalCycle.status === 'ACTIVE'`**. Una corporativa de ciclo cerrado es histórico, no
  una meta a la que colgarse.
- **`getClimaBaseline` devuelve el DATO REAL, no un promedio ni un mínimo.** Contrato de
  3 campos (`value`, `isFallback`, `monthsAgo?`) porque *"75 porque no tengo datos"* no
  es lo mismo que *"75 medido"*. **Bug corregido en revisión:** la primera versión hacía
  `?? 0` + `Math.min(0, 75)` → devolvía **0** para un departamento sin mediciones, el
  opuesto exacto de lo pedido.
- **`CLIMA_TARGET_FAVORABILITY` se importa, no se duplica.** `climaThresholds.ts` es un
  módulo de constantes **puro (cero imports)** → hoja del grafo, no puede generar ciclos.
  El acoplamiento ya existía en la dirección contraria (`PulseEngine` → `GoalsDiagnosticService`).
- **`GET /api/goals` acepta `level` como lista** (`COMPANY,AREA`) para el banco. Es capa
  de datos; **la UI del banco es Gate C**.

### Los 2 escenarios que NO hay que confundir (comentados en el código)

| Situación | Qué pasa | Quién lo maneja |
|---|---|---|
| **Sin ciclo ACTIVO** | **No se crea NINGUNA meta**, con padre o sin él | Gate E (409) + `validateTotalWeight` fail-closed |
| **Con ciclo activo, sin corporativa de Clima** | La individual **se crea igual**, con categoría y **sin `parentId`** | Gate B (fallback) |

### Notas para Gate C

- Las **3 familias no-Clima arrancan solo con `['Otros']`** — no se inventaron
  subfamilias que Victor no confirmó. Completarlas es editar
  `src/lib/constants/goalCategories.ts`, nada más (sin schema, sin push).
- `FAMILY_CLIMA` / `SUBFAMILY_CLIMA` son **contrato con el módulo de Clima**, no copy
  libre: renombrarlos rompe la búsqueda y exige migrar datos.
- **GOTCHA de fixtures:** una corporativa con `GoalCascadeRule` ya le crea meta a los
  empleados elegibles → un POST posterior con el mismo `parentId` choca con
  `validateDuplicate` (400) antes de llegar a la categoría. En el smoke costó un caso rojo.
- **Estilo visual (para Gate C):** el wizard actual tiene una piel que se cuida a
  propósito — glassmorphism, Tesla line cyan, tipografía del sistema, botones con
  gradiente. **Gate C reestructura el FLUJO** (bifurcación Meta Libre/Definida, banco de
  una pantalla, slider de peso), **NO rediseña la piel**: reutiliza los mismos componentes
  `.fhr-*` y el patrón de la skill `focalizahr-design`.

**Smoke `smoke-gate-b-category.ts` borrado al sellar** (práctica del proyecto: la
evidencia vive en el commit `8bf4cdf` y en el detalle de arriba).

### Fuera de alcance (confirmado en Gate 0, no se tocó)

`createFromDevelopmentGoal` (el PDI es otro sistema; su `DevelopmentGoal.category` es
otro concepto) · `/dashboard/metas/estrategia` (**hoy no crea nada**: es Torre de Control
y su botón redirige al wizard — "Ambiente Estrategia" nunca se construyó) · el selector
visual Familia→Subfamilia (Gate C §4.6).

### ⚠️ Deuda reportada, NO arreglada

`GET /api/goals:97` — el filtro jerárquico es
`if (context.role === 'AREA_MANAGER' && context.departmentId)`. Un `AREA_MANAGER`
**sin `departmentId`** no recibe ningún `OR` y **ve todas las metas de la cuenta**.
Fail-open latente, mismo patrón que los bugs de Gate A. Espera decisión de Victor.

---

## ✅ GATE A — SELLADO (`937cdf8`, 2026-07-14)

**7 archivos.** `tsc --noEmit` + `next build` limpios. Smoke **22/22** (14 casos contra
los handlers reales, cuenta sintética, cleanup por id en `$transaction`).

### Qué quedó implementado

| # | Cambio | Dónde |
|---|---|---|
| 1 | `validateTotalWeight` scopeado al **ciclo ACTIVO** + **falla cerrado** sin ciclo (`GoalNoActiveCycleError`) | `GoalsService.ts` |
| 1b | `GET /api/goals/team` → `assignmentStatus.totalWeight` con el **mismo** scope (lectura = escritura) | `api/goals/team/route.ts` |
| 2 | **BUG 1**: PATCH valida peso (solo si viene `weight`, solo INDIVIDUAL con dueño, excluyéndose a sí misma) + **guard de ciclo CLOSED** + `accountId` en el `where` del update | `api/goals/[id]/route.ts` |
| 3b+3 | **BUG 3**: 5 clases de error de dominio + `goalsErrorResponse.ts`. Mapeo **por tipo, nunca por texto** | `GoalsService.ts`, `lib/api/goalsErrorResponse.ts`, 3 rutas |
| 4 | **BUG 4**: `targetValue !== startValue` (no-BINARY) en el **servicio** — `prepareGoalData` cubre 3 creadores, `createFromDevelopmentGoal` la llama aparte | `GoalsService.ts` |
| 5 | **BUG 6**: permiso `goals:create:strategic`; crear COMPANY/AREA exige rol Estratega (403 si no) | `AuthorizationService.ts`, `api/goals/route.ts` |

**Contrato de status codes** (`goalsErrorResponse.ts`): **400** peso/límite/duplicado/KPI ·
**409** sin-ciclo y ciclo-cerrado (mismo código que el 409 de Gate E, decisión Victor) ·
**500** solo lo verdaderamente inesperado.

### Notas de implementación (para quien siga)

- **`from-pdi` no puede disparar `GOAL_KPI_RANGE` por la ruta:** su check de campos
  requeridos rechaza `targetValue: 0` antes (`!targetValue` es falsy, `route.ts:26-31`).
  La regla igual está en el servicio y se probó llamándolo directo (caso 11). Es
  defensa en profundidad, no un hueco.
- **BUG 5 NO se tocó** (Gate 0 confirmó que `validateDuplicate` por `parentId` ya era
  correcto). El mapper sí lo expone mejor: ahora devuelve **400 `GOAL_DUPLICATE`** en
  vez de un 500 opaco. El fix de fondo (excluir `COMPLETED` en el camino manual, e
  idempotencia por ciclo en `GoalRulesEngine`) sigue pendiente, con criterios distintos
  por camino — ver SPEC §1 BUG 5.
- **Borde aceptado (decisión Victor, NO es bug):** un PATCH de peso sobre una meta de un
  ciclo **PLANNING/CLOSING** se valida contra el presupuesto del ciclo **ACTIVO**, donde
  esa meta no cuenta. Es raro y no rompe nada. Bloquearlo exigiría definir qué significa
  "editar una meta de un ciclo PLANNING", que es una pregunta de diseño abierta.
- **Deuda conocida:** `FOCALIZAHR_ADMIN` quedó dentro de `goals:create:strategic`, o sea
  que el equipo interno puede crear metas dentro de la cuenta de un cliente. A resolver
  después; no bloqueaba el gate.
- **GOTCHAs de fixtures** (cuestan tiempo si se rehace el smoke): `Employee` exige
  `nationalId` **y** `hireDate` **y** `department` (relación requerida); mezclar
  `accountId` escalar con relaciones hace que Prisma resuelva el input *Checked* y exija
  `connect` explícito. `Account` **no tiene** `companyEmail`.
- Smoke borrado al sellar (práctica del proyecto: la evidencia vive en el commit).

---

## ✅ GATE 0 DE GATE A — CERRADO. Los 4 puntos de §2.2, respondidos

### 1. Firma de `validateTotalWeight` y cómo se llama hoy

```ts
// src/lib/services/GoalsService.ts:640-662  (private static)
validateTotalWeight(accountId: string, employeeId: string, newWeight: number): Promise<void>
```

El `where` actual (`:645-653`): `accountId` + `employeeId` + `level: 'INDIVIDUAL'` +
`status: { in: ['NOT_STARTED','ON_TRACK','AT_RISK','BEHIND'] }`. Lanza si
`currentTotalWeight + newWeight > 100` (`:657`). **Sin `goalCycleId` — ese es el BUG 2.**

Invocada desde 3 lugares, **siempre dentro de `if (input.employeeId)`**:
- `cascadeGoal:218`
- `createManagerGoal:245`
- `createFromDevelopmentGoal:731`

`createCorporateGoal:185-195` **NO la llama** (correcto: una meta COMPANY no consume
presupuesto de nadie).

### 2. `GoalCycleService.getActiveCycle` desde `GoalsService` — sin dependencia circular

**Ya está importado y ya se usa.** No hay nada que resolver:

```ts
// GoalsService.ts:17
import { GoalCycleClosedError, GoalCycleValidationError, GoalCycleService } from './GoalCycleService'

// GoalsService.ts:1349-1351  ← el patrón a replicar
private static async resolveInheritedCycleId(accountId: string): Promise<string | null> {
  return (await GoalCycleService.getActiveCycle(accountId))?.id ?? null
}
```

### 3. ¿Puede llegar a `validateTotalWeight` sin ciclo activo? → **SÍ.** Decisión: fallar cerrado

Gate E vive **solo en las rutas**, no en el servicio:
- `api/goals/route.ts:330-336` → 409 si no hay ciclo activo
- `api/goals/from-pdi/route.ts:41-47` → mismo 409

Los **4 creadores de `GoalsService` siguen siendo invocables directo sin ciclo**
(`resolveInheritedCycleId` devuelve `null` sin romper). Prueba viviente: el seed
`seed-goals-demo.ts` llama al servicio directo, saltándose toda ruta.

→ **Decisión tomada (spec §2.1.1a): `validateTotalWeight` debe RECHAZAR con error de
dominio si no hay ciclo activo. Nunca fail-open.**

### 4. ¿El PATCH tiene `employeeId` / `accountId` para validar? → **SÍ, ya los tiene**

`src/app/api/goals/[id]/route.ts`:
- `context.accountId` disponible desde `extractUserContext` (`:200`)
- **`existing`** (`:215-220`) es el registro `Goal` COMPLETO, traído con
  `findFirst({ where: { id, accountId } })` → ya trae `employeeId`, `level`,
  `weight` (el viejo, para excluirlo de la suma) y **`goalCycleId`** (necesario
  para el guard de ciclo cerrado del punto 2c).

**No hace falta ninguna query extra.** Todo lo que Gate A necesita ya está cargado
antes del `prisma.goal.update` (`:246`).

**Nit de endurecimiento detectado (no es un bug hoy):** el `update` de `:246-248` usa
`where: { id }` **sin `accountId`**. Es seguro porque `existing` ya validó ownership
(`:215-220`), pero al tocar esa función conviene agregar `accountId` al `where` por
consistencia con la regla multi-tenant del proyecto.

---

## 🟡 GATE 0 DE GATE B — 2 de 6 puntos ya respondidos (no re-investigar)

| # | Pregunta (§3.3) | Estado |
|---|---|---|
| 1 | ¿`family`/`subfamily` en `Goal` es aditivo? | 🔲 pendiente (pero el precedente `goalCycleId` nullable, `schema.prisma:2892`, ya lo sugiere) |
| 2 | file:line de herencia de categoría (A vs D) | ✅ **RESPONDIDO** (ver abajo) |
| 3 | ¿`createFromDevelopmentGoal` necesita categoría? | 🔲 pendiente |
| 4 | Permiso de creación COMPANY/AREA | ✅ **RESPONDIDO: no existe ninguno (BUG 6).** Falta DECIDIR el set, no investigar |
| 5 | ¿`/dashboard/metas/estrategia` tiene UI de creación? | 🔲 pendiente |
| 6 | ¿El banco de Área filtra por departamento del jefe? | 🔲 pendiente |

**Punto 2 — dónde vive la herencia de categoría (confirmado):**
- Los 4 caminos convergen en **`GoalsService.cascadeGoal:202`** (llamada desde
  `GoalRulesEngine.ts:151` para el automático, y desde `api/goals/route.ts:357`
  para los manuales). **NO hay mecanismo privilegiado.**
- `cascadeGoal:227-232` construye con `prepareGoalData(input)` y solo sobrescribe
  `parentId`, `originType`, `isAligned` (del padre), `isOrphan`, `goalCycleId`.
  **Nunca copia `metricType`/`targetValue`/`title`/`description` del padre.**
- El camino automático **sí copia todo del padre**, pero lo hace **al armar el input**
  en `GoalRulesEngine.ts:155-168` (incluido `weight: rule.assignedWeight`, `:167`).
- → **La herencia de categoría va en `GoalRulesEngine` (input), NUNCA dentro de
  `cascadeGoal`**, o pisaría la categoría que el jefe eligió en el Camino D.

---

## 📌 Contexto de datos vigente (cuenta `cmfgedx7b…`, tras el saneamiento del 2026-07-13)

- **92 metas** (eran 217; se borraron 125 del seed contaminado — `52aa2d6`).
- Ciclos: **Q4 2026 = ACTIVE** · *Ciclo Vigente 2026* = **CLOSED** (tiene casi todas
  las metas individuales vivas) · S2 2026 y Año 2025 = PLANNING · Año 2027 = CLOSED.
- **Metas con `goalCycleId = null`: 0.** (No confundir con `isOrphan = true` (155 en su
  momento) = sin meta PADRE. Son conceptos distintos.)
- **3 empleados siguen >100% de peso** (145%, 130%, 124%) — metas de API de feb-2026,
  contemporáneas al nacimiento de `validateTotalWeight` (`f595883`, 2026-02-25).
  No son del seed. Gate A los deja fuera del presupuesto del ciclo activo automáticamente.
- `DESEMPEÑO_TP26` quedó con **`includeGoals = false`** (decisión de negocio, ver ficha).

⚠️ **Al activar Gate A:** el presupuesto disponible de ~47 empleados saltará a ~100%
porque sus metas vivas cuelgan del ciclo CLOSED. **Es correcto** (decisión de rollover),
pero parece un bug la primera vez que se ve. Ya advertido en la spec §4.2.

---

## Decisiones de negocio pendientes de Victor (bloquean Gate B, no Gate A)

1. **Set de roles "Estratega"** para crear COMPANY/AREA (BUG 6). `goals:cycles:manage`
   hoy es `[FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER]` — **sin CEO**
   (excluido a propósito en una decisión previa). ¿Mismo set u otro?
2. **Origen del "Sugerido: X%"** (spec §4.2): `Goal.weight` de la meta padre (hoy inerte)
   vs. `GoalCascadeRule.assignedWeight`.
3. **"Meta corporativa activa"** para la consulta de Clima (§3.4): ¿(a) el ciclo está
   ACTIVE, o (b) la meta no está en estado terminal?
4. Nombres finales de familias/subfamilias + mínimo de caracteres del campo
   "¿Cómo se mide?" (10 vs 15).

---

## Commits relacionados (sin pushear — push manual de Victor)

| Hash | Qué |
|---|---|
| `52aa2d6` | Scripts de auditoría: `cleanup-seed-goals-demo.ts` + `fix-tp26-include-goals.ts` |
| `59021a2` | Ficha de Metas (GoalCycle, cierre, peso, rollover, saneamiento) |
| `fd679fd` | `seed-goals-demo.ts` reescrito vía `GoalsService` (**aprobado, NO ejecutar**) |
| `f4246fa` | SPEC + este PROGRESS (Gate 0 sellado) |
| **`937cdf8`** | **Gate A — código** (7 archivos) |

---

## ⚠️ Efecto en producción al desplegar Gate A

El presupuesto disponible de ~47 empleados de la cuenta piloto **salta a ~100%**, porque
sus metas vivas cuelgan del ciclo **CLOSED** *Ciclo Vigente 2026* y el ciclo ACTIVE es
*Q4 2026* (que casi no tiene metas). **Es el comportamiento correcto** según la decisión
de rollover — pero visualmente parece un bug. Avisar antes de cualquier demo.

Los **3 empleados con >100%** (145/130/124, metas de feb-2026) dejan de estar en
infracción automáticamente: sus metas son del ciclo cerrado y ya no cuentan.

---

## Próximo paso

**Gate B (categoría familia/subfamilia)** — ya desbloqueado. Antes de tocar schema:
cerrar los 4 puntos abiertos de §3.3 (aditividad de `family`/`subfamily`, PDI fuera de
alcance, `/dashboard/metas/estrategia`, filtro departamental del banco) y **las 4
decisiones de negocio de Victor** listadas arriba.
