# 📐 SPEC — Integración Clima × Metas + UX Premium del Wizard

**Versión:** v1
**Proyecto:** Módulo Metas — extensión para conectar con Clima + mejora UX
**Fecha:** Julio 2026
**Estado:** Listo para Gate 0 (investigación read-only antes de cualquier código)
**Fuente:** Esta conversación (chat de arquitectura GoalCycle), tras el incidente de
contaminación de datos resuelto (ver `.claude/tasks/METAS_CIERRE_MIGRACION_PROGRESS.md`
para el contexto de por qué el bug de peso se descubrió).

> ⚠️ Code es la única fuente de verdad del código. Todo lo marcado
> "a confirmar por Code" debe verificarse antes de construir, no asumirse
> de este documento.
> ⚠️ Todo el copy de cara al usuario (nombres de familia, narrativas,
> labels) está marcado PROVISIONAL — lo escribe/confirma Victor o
> Studio IA antes de mostrarse a un cliente real.

---

## 0. ORDEN DE EJECUCIÓN — no negociable

```yaml
Gate A (peso por ciclo) VA PRIMERO, sin excepción.
Gate B (categoría) y Gate C (UX del wizard) dependen de que Gate A
esté resuelto — construir la UI premium del slider ANTES de arreglar
el cálculo de peso mostraría un número incorrecto en una interfaz
hermosa. Esto no es preferencia, es dependencia real.

Orden: Gate A → Gate B → Gate C
```

---

## 1. CONTEXTO — cómo llegamos aquí

Durante el diseño de conectar Clima con Metas (que una meta corporativa de
categoría "Clima" pueda ser encontrada y usada automáticamente por el
módulo de Clima), se investigó el mecanismo de peso de las metas
(`Goal.weight`, presupuesto de 100% por empleado) y se encontraron 3 bugs
reales, más uno relacionado de check-in. Estos ya estaban diagnosticados
con evidencia real antes de este documento:

```yaml
BUG 1 — PATCH no revalida peso:
  src/app/api/goals/[id]/route.ts — acepta weight en el body (línea ~16),
  pero prisma.goal.update (línea ~246) nunca llama a validateTotalWeight.
  Se puede editar una meta a cualquier peso sin control.

BUG 2 — validateTotalWeight no filtra por ciclo:
  GoalsService.ts:645-653 — el where suma TODAS las metas activas del
  empleado (accountId + employeeId + level:'INDIVIDUAL' + status activo),
  SIN filtrar por goalCycleId. Una meta LEAVE_AS_IS de un ciclo cerrado
  sigue "gastando" presupuesto para siempre, aunque el ciclo ya cerró.

BUG 3 — Error 500 genérico al violar peso:
  src/app/api/goals/route.ts:384-389 devuelve { error: 'Error creando
  meta' } genérico, tragándose el mensaje explicativo real del servicio
  ("Peso total excede 100%. Actual: X%...").

RELACIONADO (documentado aparte, no bloquea este gate):
  Check-in sobre meta de ciclo CLOSED también da 500 genérico
  (check-in/route.ts:126-131), sin bloqueo preventivo en UI (cero
  referencias a ciclo cerrado en GoalCheckInModal/useGoalDetail).
  Documentado en .claude/FICHA_PRODUCTOS/project_metas_inventario_producto.md,
  sección "HALLAZGOS ABIERTOS" (hallazgo 4). Pospuesto por Victor.
  NOTA: el archivo REVISION_PENDIENTE_manejo_errores_ciclo_cerrado.md
  que citaba una versión anterior de esta spec NO EXISTE — verificado.

BUG 4 — CONFIRMADO, mismo día, mismo patrón (cliente valida, servidor no):
  CreateGoalWizard.tsx:297 exige targetValue > startValue en el cliente
  (canProceed del paso 3, salvo tipo BINARY). El servidor NO — el zod
  de POST /api/goals:37-38 declara startValue/targetValue sin ningún
  min, sin refine, sin comparación entre ambos. Se puede guardar
  start=0, target=0 vía API directa.

  CONSECUENCIA REAL, no solo teórica: calculateProgress:1406-1407 —
  cuando range===0 (start===target), devuelve 100% de progreso si
  currentValue >= targetValue. Una meta con start=target=0 nace
  "cumplida al 100%" apenas se registra CUALQUIER check-in con valor 0
  — sin que la persona haya hecho ningún trabajo real, y ese 100% falso
  arrastra su peso COMPLETO al hybridScore de la persona. Es la misma
  clase de inflación silenciosa de puntaje que ya se limpió hoy en
  PerformanceRating (ver METAS_CIERRE_MIGRACION_PROGRESS.md) — pero
  este es un hueco VIVO y explotable ahora mismo, no un residuo de un
  script viejo.

  Nota aparte, prioridad menor: BulkAssignWizard.tsx:251-252 hardcodea
  startValue:0 y metricType:'NUMBER' (targetValue cae a 100 por defecto
  si el jefe no lo llena, :246) — por ese camino el jefe nunca elige
  el tipo de métrica. Anotado, no bloquea Gate A, evaluar si vale la
  pena exponer el selector de tipo también en BulkAssignWizard.

BUG 5 — CONFIRMADO, mismo patrón que BUG 2 (historial completo, no
ciclo): validateDuplicate no distingue "tiene una meta VIVA" de
"la tuvo alguna vez". GoalsService.ts:664-681, el where solo excluye
CANCELLED — una meta COMPLETED sigue contando como "ya asignada".

  CONSECUENCIA REAL: si un empleado completa una meta del banco
  (Caminos B/C) y el jefe quiere volver a asignársela (el caso más
  común: cumplió su meta trimestral, se le reasigna), el sistema
  rechaza con "Este empleado ya tiene asignada esta meta" — mensaje
  falso, porque la cumplió, no la tiene pendiente. Mismo defecto en
  GoalRulesEngine.ts:107 (marca alreadyHasGoal sin excluir COMPLETED).

  MITIGADO PARCIALMENTE por el rollover (parentId nuevo por ciclo
  nuevo, confirmado por Code) — el bug de validateDuplicate solo
  muerde en reasignación DENTRO del mismo ciclo tras completar. Pero
  ese es justo el caso más plausible, así que sí hay que arreglarlo.

  FIX — DOS CRITERIOS DISTINTOS, NO el mismo cambio en los dos lugares
  (corregido tras revisión operacional — el fix original mezclaba dos
  propósitos diferentes que no deben tratarse igual):

  a) validateDuplicate (caminos MANUALES B/C/D): SÍ excluir COMPLETED
     además de CANCELLED. "Ya la tiene" pasa a significar "tiene una
     VIVA" — correcto acá porque un jefe reasignando algo ya cumplido
     es una decisión humana consciente, caso por caso.

  b) GoalRulesEngine.ts:107 (Camino A, AUTOMÁTICO): NO aplicar el
     mismo cambio. El propósito de ese chequeo no es "elegibilidad
     para reasignar" — es IDEMPOTENCIA: evitar que la misma ejecución
     automática de la regla (llevan executionCount, :184, se
     re-ejecutan) cree un duplicado. Si se excluyera COMPLETED acá,
     cada re-ejecución de la regla le crearía una meta NUEVA a TODO el
     que ya cumplió la anterior — silenciosamente, porque es masivo y
     automático, nadie lo revisa persona por persona.

     Criterio correcto para (b): verificar si ya existe una meta con
     el mismo parentId (la meta/regla origen) en el CICLO ACTIVO,
     SIN IMPORTAR su estado (incluido COMPLETED) — esto preserva la
     idempotencia de la re-ejecución sin bloquear la reasignación
     manual, que es un camino completamente distinto con un propósito
     distinto. Requiere scopear por goalCycleId en (b), a diferencia
     de (a) que no lo necesita.

  Confirmado por Code, no hay que tocar: la detección por parentId en
  Caminos B/C (validateDuplicate, GoalsService.ts:669-676) YA es
  correcta — compara por (accountId+employeeId+parentId), no por
  título. La spec original asumía mal que había que arreglar esto —
  no hacía falta.

  Camino D (Meta Libre) sin ninguna protección de duplicado
  (createManagerGoal, GoalsService.ts:241-254) — decisión de negocio
  aceptada, NO se agrega ninguna validación: el nombre libre es
  legítimamente repetible entre metas distintas ("Cumplir presupuesto"
  en dos áreas), y agregar fricción ahí contradice el espíritu de
  100% libre de ese camino.

BUG 6 — CRÍTICO, confirmado: el modelo de 4 caminos completo descansa
en una restricción que HOY NO EXISTE en el servidor. POST /api/goals
solo valida hasPermission(role, 'goals:create') (route.ts:203), y ese
permiso (AuthorizationService.ts:503-511) incluye AREA_MANAGER y
EVALUATOR. Los únicos chequeos de nivel son estructurales (INDIVIDUAL
requiere employeeId, AREA requiere departmentId) — NADA impide que
un jefe cree una meta level='COMPANY' por API directa.

  Lo que hoy "impide" esto es SOLO la UI: StepSelectLevel.tsx:78
  filtra la opción COMPANY si el rol es AREA_MANAGER. Mismo patrón
  exacto que BUG 1 y BUG 4 (cliente valida, servidor no) — pero acá
  el costo es mayor: invalida el principio SMART completo (sección
  3.2) que justifica todo el diseño de los 4 caminos. Si no se cierra,
  un jefe puede saltarse el banco entero y crear su propia
  "corporativa", exactamente lo que el modelo existe para evitar.

  FIX: agregar chequeo de ROL (no solo permiso) en POST /api/goals
  (y cualquier otra ruta de creación) — level='COMPANY' o 'AREA'
  requiere ser Estratega (mismo set a confirmar en 3.3 punto 4, NO
  asumir que es igual a goals:cycles:manage). Rechazar con 403 si un
  rol no-Estratega intenta crear en esos niveles. Sugerencia de
  implementación (a confirmar con Code, no asumir): probablemente
  conviene un permiso NUEVO (ej. 'goals:create:strategic') en vez de
  reutilizar uno existente — reutilizar mal un permiso que ya
  significa otra cosa en otro contexto podría generar el mismo tipo
  de acoplamiento confuso que ya vimos con goals:approve/goals:view.
```

**Decisión de arquitectura ya tomada (no rediscutir):** el "rollover" de
una meta viva de un ciclo cerrado a uno nuevo NUNCA es un traspaso
automático del mismo objeto — es siempre una meta NUEVA, creada a
propósito en el ciclo activo. Esto es lo que hace que Gate A (peso por
ciclo) sea la solución correcta: cada meta nueva se valida contra el
presupuesto real de SU ciclo, sin arrastrar historial de ciclos ya
cerrados.

---

## 2. GATE A — Fix de peso por ciclo (bloqueante, va primero)

### 2.1 Alcance

```yaml
1. validateTotalWeight — agregar filtro por goalCycleId del ciclo ACTIVO
   de la cuenta (no de la meta que se está creando/editando — del ciclo
   vigente ahora mismo, vía GoalCycleService.getActiveCycle). Metas de
   ciclos ya CLOSED no cuentan para el presupuesto del ciclo actual.

   1a. DECISIÓN EXPLÍCITA — qué pasa si getActiveCycle() devuelve null
   (CONFIRMADO por Victor, hallazgo real de revisión operacional —
   FALLA CERRADO, no fail-open): Gate E (el bloqueo de "sin ciclo no
   se crea meta") vive SOLO en las rutas (api/goals/route.ts:330-336,
   from-pdi:41-47), NO en el servicio. Los 4 creadores de GoalsService
   siguen siendo invocables directo sin ciclo activo — de hecho
   resolveInheritedCycleId (:1349-1351) devuelve null sin romper, y el
   script de seed que se corrigió ayer llama al servicio directo,
   saltándose toda ruta. Es la prueba viviente de que "nunca debería
   llegar sin ciclo" es una suposición falsa, no una garantía real —
   la misma lección del incidente de PerformanceRating de hoy.

   Por eso: si no hay ciclo activo, validateTotalWeight debe RECHAZAR
   explícitamente (nuevo error de dominio, ej. "No hay ciclo activo,
   no se puede validar presupuesto de metas") — NUNCA dejar pasar sin
   límite. Cualquier validación que solo viva en la ruta y no en el
   servicio es una validación que un script futuro puede saltarse sin
   que nadie lo note — exactamente el patrón que ya costó un día
   entero de limpieza.

1b. LECTURA del presupuesto — GET /api/goals/team (assignmentStatus.
   totalWeight) debe recibir el MISMO filtro por ciclo que el punto 1.
   Este es el número que consumen CreateGoalWizard.tsx:222-224 y
   StepWeightsConfirm.tsx:46-47 — si solo se arregla la escritura
   (validateTotalWeight) y no esta lectura, el slider premium de Gate C
   mostraría un número viejo mientras el servidor exige uno distinto.
   Es exactamente el escenario que la sección 0 dice querer evitar —
   no es opcional, es parte del mismo fix.

2. PATCH /api/goals/[id] — tres condiciones, no una:
   a. Validar el peso SOLO si weight viene en el body (es opcional en
      el zod, route.ts:16) — un PATCH de solo título no debe disparar
      la validación.
   b. Validar SOLO para level:'INDIVIDUAL' con employeeId — una meta
      COMPANY/AREA no consume presupuesto de nadie (peso inerte, ver
      3.2 nota sobre "Sugerido: X%").
   c. GUARD DE CICLO CERRADO (decisión ya tomada, no rediscutir): hoy
      lockAfterClosure solo protege updateProgress (GoalsService.ts:
      282-289), NO el prisma.goal.update del PATCH (:246) — se puede
      editar el peso de una meta de un ciclo CLOSED sin ningún
      bloqueo. CONFIRMADO por Victor: el PATCH debe BLOQUEAR
      directamente cualquier edición de peso sobre una meta cuyo
      GoalCycle esté CLOSED — no comparar contra el ciclo activo
      mientras se edita una meta de un ciclo distinto (eso compararía
      contra el presupuesto equivocado). Mismo criterio "ciclo cerrado
      = congelado" que el resto del proyecto.
   Al recalcular la suma para (a) y (b), excluir el peso viejo de esa
   misma meta (para no contarla dos veces contra sí misma).

3. Mapeo de error — GENÉRICO, no solo para peso (confirmado con
   evidencia real el mismo día: validateDuplicate sufre el mismo
   problema — "Este empleado ya tiene asignada esta meta" también cae
   en 500 genérico). Cualquier error de negocio que lance GoalsService
   (identificable por tipo/clase, no por texto) debe llegar como 400
   con su mensaje real. Solo errores verdaderamente inesperados (de
   infraestructura) deben caer en 500 genérico. Mismo patrón que ya
   usamos con goalCycleErrorResponse en las rutas de ciclos.

3b. PRERREQUISITO del punto 3 (rescatado de una ronda de revisión
   anterior, se había perdido en una reescritura): mapear "por tipo/
   clase, no por texto" REQUIERE que esas clases existan primero. Hoy
   validateTotalWeight, validateGoalLimit y los anti-duplicado lanzan
   `new Error(...)` pelado — las únicas clases de dominio reales que
   existen son las de GoalCycle (GoalCycleActiveError, etc.). Crear
   las clases de error de dominio de Goals (espejo de esas), y un
   mapper equivalente a goalCycleErrorResponse.ts, ANTES de poder
   implementar el punto 3 tal como está descrito.

4. Validación de KPI server-side (BUG 4, confirmado con consecuencia
   real): va en el SERVICIO (GoalsService, en prepareGoalData o
   equivalente — mismo lugar donde ya vive validateTotalWeight), NUNCA
   solo en el zod de POST /api/goals. Hay 4 creadores
   (createCorporateGoal, createManagerGoal, cascadeGoal,
   createFromDevelopmentGoal) MÁS otra ruta (/api/goals/from-pdi) que
   crean metas — poner la regla solo en un zod de una ruta deja las
   demás sin cubrir, mismo error de alcance que ya se corrigió una vez
   para este mismo bug. targetValue debe ser distinto de startValue
   para tipos no-BINARY. Sin esto, una meta con start=target=0 nace
   "cumplida al 100%" con el primer check-in de valor 0, inflando el
   hybridScore de la persona sin trabajo real (mismo patrón de daño
   que la contaminación de PerformanceRating limpiada hoy). Rechazar
   con 400 y mensaje claro, mismo mapeo del punto 3.

5. BUG 6 (chequeo de ROL para crear COMPANY/AREA) — agregar en POST
   /api/goals (y cualquier otra ruta de creación que lo permita hoy):
   si level es 'COMPANY' o 'AREA', el rol debe ser Estratega (set a
   confirmar en 3.3 punto 4). Rechazar con 403 si no. Esto es
   PRERREQUISITO real de todo el modelo de 4 caminos de Gate B/C — sin
   esto, el banco controlado por el Estratega es solo una convención
   de UI, no una garantía real.
```

### 2.2 Investigación previa (Gate 0 de este sub-gate)

```
INVESTIGACIÓN READ-ONLY — antes de tocar código de Gate A

1. Confirmá la firma exacta de validateTotalWeight (GoalsService.ts,
   file:line) — parámetros actuales, y cómo se llama desde POST
   /api/goals hoy.

2. Confirmá que GoalCycleService.getActiveCycle(accountId) es
   accesible desde GoalsService sin crear una dependencia circular
   (GoalsService ya lo usa en otro lado — confirmar dónde, para
   replicar el mismo patrón de import).

3. YA RESUELTO en 1a — no investigar de nuevo: se confirmó que Gate E
   NO cubre el servicio (solo las rutas), y que los 4 creadores son
   invocables sin ciclo activo. La decisión (fallar cerrado, rechazar
   con error de dominio) ya está tomada — implementarla, no
   re-investigar si "nunca debería llegar sin ciclo".

4. Confirmá que el PATCH de edición (route.ts:[id]) tiene acceso al
   employeeId y accountId necesarios para llamar validateTotalWeight
   con los mismos parámetros que usa POST.

Solo investigar, no tocar código todavía.
```

### 2.3 Smoke

```yaml
- Crear metas hasta 100% en el ciclo activo → OK
- Intentar crear una más → rechazada con mensaje claro (no 500)
- PATCH de una meta existente a un peso que rompa el 100% → rechazada
  con mensaje claro
- PATCH de una meta a un peso menor o igual, sin romper nada → OK
  (confirma que excluir el peso viejo de sí misma funciona)
- Meta de un ciclo YA CLOSED con peso alto → NO cuenta contra el
  presupuesto del ciclo ACTIVO actual (crear una meta nueva llena el
  100% real del ciclo vigente, sin heredar peso fantasma)
- Duplicado de nombre para el mismo empleado → rechazada con mensaje
  claro (no 500) — confirma el mapeo genérico, no solo el de peso
- Crear meta con startValue=0, targetValue=0 (tipo no-BINARY) vía API
  directa → rechazada con 400 y mensaje claro (BUG 4)
- Crear meta BINARY con start/target iguales → sigue permitido (la
  regla no aplica a ese tipo, mismo criterio que el cliente)
- PATCH de peso sobre una meta de un ciclo CLOSED → rechazado, sin
  importar cuánto presupuesto libre tenga el ciclo activo (guard de
  ciclo cerrado, punto 2c)
- GET /api/goals/team (assignmentStatus.totalWeight) devuelve el mismo
  número que validateTotalWeight usaría para rechazar/aceptar — probar
  con un empleado real que tenga metas en ciclos distintos (activo y
  cerrado) y confirmar que ambos coinciden
- POST /api/goals con level='COMPANY' desde un rol no-Estratega (ej.
  AREA_MANAGER) → 403 (BUG 6). Mismo intento desde un rol Estratega →
  200, confirma que no se bloqueó de más
- Reasignar una meta del banco a un empleado que YA LA COMPLETÓ
  (status COMPLETED) vía camino MANUAL (B/C/D) → debe PERMITIRSE
  (confirma el fix (a) de BUG 5)
- Re-ejecutar una GoalCascadeRule (Camino A) sobre empleados que YA
  COMPLETARON la meta de la ejecución anterior → NO debe crear
  duplicado (confirma el fix (b) de BUG 5 — idempotencia por parentId
  + ciclo activo, no por estado)
```

---

## 3. GATE B — Categoría Familia / Subfamilia

### 3.1 Decisión de negocio (confirmada por Victor)

```yaml
Familia = 4 categorías FIJAS, iguales para toda cuenta, sin
configuración por cliente (inspirado en Balanced Scorecard, pero con
etiquetas sin jerga — PROVISIONAL, confirmar wording final visual):

  - "Negocio e Ingresos"
  - "Clientes y Usuarios"
  - "Operación y Eficiencia"
  - "Cultura y Personas"

Subfamilia = 3-4 por familia + "Otros" siempre presente. Ejemplo
PROVISIONAL bajo "Cultura y Personas": Clima, Rotación, Desarrollo,
Otros. (El resto de familias siguen el mismo patrón — a confirmar
lista final con Victor antes de construir, no inventar en Code.)

NO reutilizar GoalLibrary (tabla vacía, abandonada, confirmado por
Code) — la categoría vive directo en Goal.

NO confundir con GoalGroup (weightBusiness/weightLeader/weightNPS/
weightSpecific) — eso es ponderación de bono por cargo del jefe,
concepto completamente distinto, no se toca.
```

### 3.2 Los 4 caminos — modelo FINAL (varias rondas de refinamiento con Victor)

```yaml
PRINCIPIO RECTOR, documentado para que nadie lo "corrija" pensando que
es una limitación arbitraria (confirmado por Victor, jul 2026):

Una meta de Área/Corporativa debe ser SMART y medir lo MISMO para
todos los que la reciben — si cada jefe pudiera reinterpretar el KPI,
el sistema se llenaría de indicadores triviales e inconsistentes
("meta de pagar la luz", "meta de llegar temprano") y ningún reporte
agregado tendría sentido, porque cada jefe mediría algo distinto. Por
eso el KPI se congela en el origen — no es una restricción técnica,
es gobernanza de calidad de datos.

═══════════════════════════════════════════════════════════
QUIÉN CREA — restricción de rol, no solo de flujo
═══════════════════════════════════════════════════════════

Las metas de nivel COMPANY y AREA las crea EXCLUSIVAMENTE el Estratega
— DECISIÓN PENDIENTE DE VICTOR sobre el set exacto de roles (ver BUG 6
en sección 1, ya investigado: NO existe ningún chequeo hoy, falta
decidir el set, no investigar más). Corrección de una contradicción
anterior en este mismo documento: el set NO puede ser simplemente
"mismo que goals:cycles:manage" — ese permiso hoy es [FOCALIZAHR_ADMIN,
ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER], SIN CEO (se excluyó a propósito
en una decisión anterior de este proyecto, documentada en
AuthorizationService). Si el set de "quién crea metas Estratégicas"
debe ser el mismo u otro distinto es la decisión real pendiente —
no asumir ninguno de los dos, preguntarle a Victor explícito antes
de Gate B.

Un jefe común NUNCA crea una meta de Área o Corporativa — solo puede
recibirla o asignarla ya creada. Esto vive en un módulo separado,
"Ambiente Estrategia" (/dashboard/metas/estrategia, ya mencionado en
METAS_DOCUMENTO_MAESTRO_v3.md §4.1) — A CONFIRMAR si ya existe UI real
ahí o es solo intención de diseño nunca construida (ver investigación
3.3, punto 5 — el punto 4 de esa lista fue eliminado por obsoleto, ver
nota en esa sección).

═══════════════════════════════════════════════════════════
LOS 4 CAMINOS
═══════════════════════════════════════════════════════════

CAMINO A — Corporativa automática (GoalCascadeRule/GoalRulesEngine):
  100% automática, cero intervención humana. La regla dice "todos los
  jefes de venta: NPS al 15%" y se crea sola, para cada uno, con ese
  peso fijo. El único efecto visible es que el presupuesto del
  destinatario ya nace descontado.

CAMINO B — Asignación manual de meta YA DEFINIDA (Corporativa O Área)
a alguien que NO la tiene:
  El jefe entra al "banco" (pantalla única, mockup "Netflix" de 4.2),
  elige una meta Corporativa o de Área ya creada por el Estratega, y
  se la asigna a alguien de su equipo. El KPI se muestra de solo
  lectura (título, qué mide, objetivo) — INTOCABLE. Lo ÚNICO editable
  es el PESO, con un valor sugerido que puede bajarse hasta 0.

  MECANISMO REAL del peso 0 (confirmar file:line, no asumir):
  getEmployeeGoalsScore filtra weight: { gt: 0 } (GoalsService.ts:357)
  — una meta con peso 0 es invisible para el motor de score: existe,
  se ve en la lista de metas de la persona, pero no pondera nada. Es
  exactamente el comportamiento de "excluir sin mecanismo aparte" que
  Victor quiere — no es un bug, no "arreglar" esto pensando que una
  meta con peso 0 debería ocultarse o eliminarse.

  Ejemplo real de Victor: "fuerza de venta 20% para vendedores de
  tienda" — un ayudante de contabilidad que trabaja en esa tienda
  puede recibir la misma meta con 0% o 10%, sin que nadie invente un
  KPI distinto para él.

  REQUIERE AMPLIAR EL BANCO: hoy BulkAssignWizard/StepSelectGoal solo
  busca level:'AREA' (useGoals({ level: 'AREA' }), confirmado por
  Code) — debe ampliarse para incluir también level:'COMPANY'. Y debe
  funcionar igual de natural para UN solo destinatario que para varios
  (hoy se siente pensado solo para asignación masiva).

CAMINO C — Meta de Área en lote (BulkAssignWizard, mismo mecanismo que
B pero para todo un departamento a la vez):
  Mismo bloqueo de KPI que B. El "banco" de Área SOLO muestra las
  metas de Área del PROPIO centro de costo/departamento del jefe (A
  CONFIRMAR si este filtro ya existe — ver investigación 3.3).

CAMINO D — Meta Libre (CreateGoalWizard.tsx, wizard individual desde
cero — StepLinkParent es solo su paso de asociación opcional, no el
camino completo):
  100% editable por el jefe — título, KPI, peso, todo. Se pide asociar
  (opcional) a una Corporativa/Área existente como REFERENCIA (sin
  heredar nada de contenido, solo isAligned interno), o elegir
  Familia+Subfamilia si no se asocia a nada. Sin protección de
  duplicado por diseño (ver BUG 5) — el nombre libre es legítimamente
  repetible entre metas distintas.

  Terminología: en mensajes anteriores de este documento, "Camino B"
  se usó para referirse a esto (Meta Libre) y "Camino C" para el
  antiguo BulkAssignWizard sin distinguir Corporativa/Área. Léase BUG
  5 y la sección 4 con esta tabla de equivalencia en mente — el
  contenido técnico sigue siendo válido, solo cambió el nombre.

═══════════════════════════════════════════════════════════
CATEGORÍA (Familia/Subfamilia) — quién la hereda y cuándo
═══════════════════════════════════════════════════════════

Camino A: hereda de la corporativa origen, sin preguntar.
Caminos B/C: hereda de la meta Corporativa/Área elegida del banco
  (se definió UNA VEZ, cuando el Estratega la creó).
Camino D: el jefe la elige él mismo, en su propio wizard.

Confirmado por Code: los 4 caminos convergen en la misma función
cascadeGoal/createManagerGoal, pero el input lo arma un componente
distinto en cada caso — la herencia de categoría vive en cada
componente de ORIGEN (GoalRulesEngine para A, el banco para B/C, el
selector propio para D), NUNCA dentro de cascadeGoal mismo.
```

### 3.3 Investigación previa (Gate 0 de este sub-gate)

```
INVESTIGACIÓN READ-ONLY — antes de tocar schema de Gate B

1. Confirmá que agregar family/subfamily a Goal (dos campos enum,
   nullable) es tan aditivo como el resto de los campos que ya
   agregamos en este proyecto (goalCycleId, etc.) — sin migración de
   datos existentes necesaria.

2. Confirmá file:line exacto de GoalCascadeRule/cascadeGoal (dónde
   se resuelve qué categoría hereda la meta hija) y de
   StepLinkParent.tsx (dónde el jefe elige, para agregar el selector
   de categoría en el lugar correcto del flujo).

3. Confirmá si createFromDevelopmentGoal (el 4to creador, del PDI)
   necesita categoría también, o queda fuera de alcance de este gate
   (probablemente fuera de alcance — el PDI es un sistema distinto,
   confirmar que no se confunde).

4. YA RESPONDIDO por BUG 6 (sección 1) — no re-investigar: NO existe
   ningún chequeo de rol para crear COMPANY/AREA hoy. Lo pendiente es
   que Victor decida el set de roles Estratega (ver sección "QUIÉN
   CREA" arriba en 3.2) — esto es una decisión de negocio, no algo
   que Code deba seguir buscando en el código.

5. ¿/dashboard/metas/estrategia (mencionado en
   METAS_DOCUMENTO_MAESTRO_v3.md §4.1) ya tiene HOY alguna UI real
   para crear una meta de Área o Corporativa, o el documento describe
   una intención de diseño que nunca se construyó? file:line si existe
   la página y qué hace exactamente hoy.

6. ¿El "banco" de Área (StepSelectGoal, useGoals({level:'AREA'})) ya
   filtra por el departamento/centro de costo del jefe que está
   asignando, o trae TODAS las áreas de la cuenta sin filtro? Esto
   determina si el filtro "solo su propio departamento" (Camino C) ya
   existe o hay que construirlo.

Solo investigar, no diseñar código todavía.
```

### 3.4 Conexión con Clima (el objetivo original de todo esto)

```yaml
Clima puede preguntar: "¿existe una meta level='COMPANY' con
family='Cultura y Personas' AND subfamily='Clima' cuyo status no sea
terminal (COMPLETED/CANCELLED)?" — sin necesitar ningún mecanismo de
asociación especial, solo una búsqueda directa por categoría.

⚠️ DECISIÓN PENDIENTE DE CONFIRMACIÓN FINAL DE VICTOR (quedó abierta
en una ronda muy anterior de esta conversación y nunca se cerró
explícitamente): la consulta de arriba NO filtra por goalCycleId —
resuelve "meta corporativa activa" como (b) "la meta misma no está en
un estado terminal", no como (a) "el ciclo de esa meta está ACTIVE".
Esto importa: si eligen (b) como está escrito, Clima encontraría la
meta de Clima aunque no haya NINGÚN GoalCycle activo en la cuenta (por
ejemplo, en la ventana entre cerrar un ciclo y activar el siguiente).
Si Victor prefiere (a) en cambio, la consulta debe agregar
goalCycle.status: 'ACTIVE' como filtro adicional. Confirmar
explícitamente antes de construir Gate B — no asumir que (b) es lo
correcto solo porque es lo que quedó escrito primero.

El "piso" sugerido para metas de subfamilia Clima (alerta suave, NO
bloqueo duro): mínimo entre el resultado actual de favorabilidad del
departamento y CLIMA_TARGET_FAVORABILITY (=75, vive hoy en
src/lib/services/clima/climaThresholds.ts:45).

PREGUNTA DE ARQUITECTURA AÚN SIN RESOLVER (pendiente de Gate 0, no
asumir): ¿es correcto que Metas importe esa constante directo de
Clima, o rompe la independencia de módulos que este proyecto ha
cuidado siempre? Investigar antes de decidir — si hay tensión,
proponer alternativa (constante compartida en lugar neutral, o copia
propia en Metas con comentario explícito de por qué duplica el valor).
Dejar comentario en código: "hoy fijo en 75 para toda cuenta, podría
volverse configurable por empresa en el futuro — no urgente, no
construir ahora, solo dejar la puerta anotada".
```

---

## 4. GATE C — UX Premium del Wizard (depende de Gate A + Gate B)

> ✅ **SECCIÓN 4 SELLADA** — `2ee07d2` (código) + `f89f68f` (cierre), 2026-07-15.
> Smoke 20/20 + 8/8, tsc + build limpios. Implementada con **recorrido condicional por
> ROL** (Estratega ve Alcance, jefe común la bifurcación) — resuelve de raíz el defecto de
> "bifurcación repetida", desviación de 4.1 documentada. 2 deudas aprobadas: 4.4
> (`description` obligatoria solo cliente — el servidor no distingue Camino D de asignación
> del banco) y 4.7 (`BulkAssignWizard` sigue con target por persona — migración a
> `GoalBankScreen` diferida como gate futuro, Opción C). Detalle en
> `SPEC_CLIMA_METAS_PROGRESS.md` §"GATE C — SELLADO".
>
> ✅ **ACTUALIZACIÓN post-Gate C — las 2 deudas quedaron RESUELTAS (2026-07-15):**
> (1) La obligatoriedad server-side de "¿Cómo se mide?" (4.4) → **Punto 2** (`b5f5a90`+`312adcc`):
> campo persistido `Goal.kpiSource` (OWN/INHERITED); el enforcement vive en `prepareGoalData` gateado
> por OWN, así no rompe el banco. (2) `BulkAssignWizard` con target por persona en la rama heredada
> (4.7) → **Gate 3·B** migración ACOTADA: la rama 'Cascadear' pasa a `GoalBankScreen` (congela el KPI),
> 'Crear nueva' intacta. Además **Gate 3·A** sumó Familia obligatoria a 'crear nueva'. Detalle y
> as-built en `SPEC_CLIMA_METAS_PROGRESS.md`.

### 4.0 Principio guía — no es un rediseño visual, es separar 2 flujos forzados a compartir pasos

```yaml
Confirmado por Victor: NO se toca el estilo visual, los componentes
base (.fhr-*, Tesla line, glassmorphism) ni el flujo de Meta Libre
en su esencia. Lo que cambia es la RUTA que recorre cada camino —
hoy los 4 caminos están forzados a pasar por los mismos 6 pasos
(Nivel→Definición→Medición→Tiempo→Cascada→Confirmar), cuando en
realidad Meta Definida (Caminos B/C) no necesita Definición ni
Medición — esos datos ya existen desde que el Estratega la creó.

Meta Libre (Camino D): casi no cambia. Solo 2 ajustes puntuales,
ambos ya definidos en 4.1 y 4.2 originales (peso a su propio paso +
campo de medición obligatorio, ver 4.4).

Meta Definida (Caminos B/C): cambio real de estructura — nuevo Paso 1
+ pantalla única de banco con KPI bloqueado.
```

### 4.1 Paso 1 NUEVO — Bifurcación Meta Libre / Meta Definida

```yaml
Reemplaza el actual "Paso 1 · Alcance" (Corporativa/De Área/Individual,
confirmado con captura real de Victor) por una bifurcación de 2
niveles:

NIVEL 1 — dos botones grandes:
  "Meta Libre"     → salta directo al wizard completo de 6 pasos que
                      ya existe (Camino D), con las mejoras de 4.4.
  "Meta Definida"  → pasa a Nivel 2

NIVEL 2 (solo si eligió "Meta Definida") — dos botones:
  "Corporativa"    → banco filtrado a level:'COMPANY'
  "De Área"        → banco filtrado a level:'AREA' Y al departamento/
                      centro de costo del jefe (a confirmar si ya
                      existe ese filtro, ver 3.3 punto 6)

Ambas opciones de Nivel 2 llevan a LA MISMA pantalla siguiente (4.2,
mockup "Netflix") — buscar en el banco, ver KPI bloqueado, asignar
peso. No hay Definición/Medición/Tiempo para este camino — se saltan
por completo.

PENDIENTE DE CONFIRMAR (3.3, puntos 4-5): la creación de metas
Corporativa/Área NO vive en este wizard del jefe — es del Estratega,
en un lugar separado ("Ambiente Estrategia"). Este Gate C NO construye
esa pantalla de creación — solo el flujo de ASIGNACIÓN de algo que el
Estratega ya creó. Si /dashboard/metas/estrategia no tiene hoy UI real
para crear, eso es alcance de OTRO gate futuro, no de este.
```

### 4.2 Pantalla única de banco — el mockup "Netflix" (KPI bloqueado + peso editable)

```yaml
DISEÑO DE REFERENCIA (Gemini, revisado y aprobado por Victor):

┌────────────────────────────────────────────────────────────────┐
│  DISTRIBUCIÓN DE META [DE ÁREA / CORPORATIVA]                  │
│                                                                  │
│  🎯 Meta: [título de la meta elegida del banco]                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Mide: [el campo "¿Cómo se mide?", ver 4.4]              │  │
│  │  Objetivo: [targetValue] [unit]                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  🔒 Esta meta está consolidada. Los indicadores no son editables│
│                                                                  │
│  Distribución por persona:                                      │
│  • [Nombre]   [ Peso: __ % ]  [Sugerido: X%]                    │
└────────────────────────────────────────────────────────────────┘

Aplica IGUAL para Corporativa y para Área — mismo componente, misma
regla (KPI bloqueado, solo peso editable, valor sugerido visible al
lado del campo editable para detectar desviaciones de un vistazo).

ORIGEN DEL "SUGERIDO: X%" — decisión pendiente de Victor, NO inventar
en Code: dos candidatos posibles, no uno solo:

  (a) Reutilizar el campo weight de la propia meta de Área/Corporativa
      elegida del banco — hoy confirmado INERTE (no cuenta para el
      100% de nadie, validateTotalWeight filtra level:'INDIVIDUAL',
      ver 3.2). Sería darle un propósito real a un campo que hoy no
      hace nada.

  (b) GoalCascadeRule.assignedWeight — el mismo campo que ya usa el
      Camino A (automático) para fijar el peso por nivel de cargo. Si
      la meta del banco tiene una regla de cascada asociada, usar ese
      valor daría consistencia entre el peso "automático" y el
      "sugerido" del camino manual — la misma cifra en los dos casos,
      en vez de dos números que podrían divergir sin que nadie lo note.

Si Victor confirma (a) o (b), el Estratega definiría ese valor al
crear la meta (en Ambiente Estrategia) como el "peso recomendado" que
luego aparece pre-cargado en cada asignación individual. Si ninguno
de los dos convence, hay que definir otro origen antes de construir
— no dejarlo sin dueño.

Funciona tanto para 1 solo destinatario (Camino B) como para varios
(Camino C, antes BulkAssignWizard) — debe sentirse natural en ambos
casos, no solo pensado para selección múltiple.

⚠️ ADVERTENCIA DE DATOS A TENER PRESENTE (no bloquea Gate C, pero
puede confundir en la demo): hoy el ciclo ACTIVE de la cuenta de
prueba es "Q4 2026", pero casi todas las metas individuales vivas
cuelgan del ciclo YA CERRADO "Ciclo Vigente 2026". Cuando Gate A entre
en vigor (peso scopeado por ciclo), el presupuesto disponible de esos
~47 empleados saltará a ~100% de golpe, aunque sigan viendo sus metas
ON_TRACK en las listas. Es el comportamiento CORRECTO según la
decisión de rollover (sección 1) — pero visualmente, la primera vez
que alguien vea el slider de Gate C con "100% disponible" en una
cuenta que claramente tiene metas activas, puede parecer un bug. Vale
la pena que quien haga la demo lo sepa de antemano.
```

### 4.3 Pantalla de referencia — el mockup "Google" (Meta Libre asociándose, SIN bloqueo)

```yaml
DISEÑO DE REFERENCIA (Gemini, para cuando Camino D se asocia a una
Corporativa/Área como referencia — NO hereda nada, solo contexto):

┌────────────────────────────────────────────────────────────────┐
│  ALINEACIÓN DE TU META LIBRE                                    │
│                                                                  │
│  Tu meta: [título propio del jefe]                              │
│  Mide: [su propio campo "¿Cómo se mide?"]                       │
│                                                                  │
│  ── CONECTADO CON PROPÓSITO CORPORATIVO ──────────────────────  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎯 Te estás alineando a: [título de la corporativa]     │  │
│  │  Mide: [su "¿Cómo se mide?"]                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  💡 Tu meta sigue siendo 100% tuya. Vincularla muestra cómo el  │
│     esfuerzo de tu equipo sostiene este objetivo de la empresa. │
└────────────────────────────────────────────────────────────────┘

Reemplaza el picker de texto libre actual de StepLinkParent — filtrado
por Familia ya elegida (ver 4.5), mostrando ahora el contexto real del
padre (ya confirmado que el fetch YA trae metricType/targetValue/
description, solo falta que el componente los renderice).
```

### 4.4 Campo obligatorio "¿Cómo se mide?" — reemplaza "Descripción (opcional)"

```yaml
DISEÑO DE REFERENCIA (Gemini, estilo "Crafting Canvas", para el
momento de CREAR cualquier meta — Camino D, y también el Estratega
al crear Corporativa/Área en Ambiente Estrategia):

Antes: "Descripción (opcional)" — placeholder "Contexto adicional,
  criterios de éxito, etc." — nadie lo llena porque se siente opcional
  y de bajo peso visual.

Ahora: "¿Cómo se mide el éxito de esta meta?" *
  placeholder: "Ej: % de vacantes críticas cerradas en menos de 15 días"
  💡 texto de ayuda: "Escribe de forma simple qué número o indicador
     define el éxito."
  OBLIGATORIO, mínimo 15 caracteres (a confirmar con Victor si 10 o 15
  — el proyecto ya usa 10 en otros campos de justificación, evaluar
  consistencia).
  Validación asistida si es ambiguo (ej. "con esfuerzo"): "Escribe un
  indicador claro (ej: % de avance, CLP, N° de eventos) para que tu
  equipo sepa exactamente cómo se evaluará su trabajo."

REUTILIZACIÓN: este MISMO campo (no uno nuevo) es el que se muestra
como "Mide: [...]" en los mockups 4.2 y 4.3 — un solo campo, escrito
una vez, reutilizado en los 3 momentos (creación, asignación,
asociación). Mismo campo de base de datos (Goal.description,
renombrado en la UI, no en el schema — investigar en 3.3 si algún
consumidor actual de description se rompería al volverse obligatorio
y con contenido estructurado distinto al libre de hoy).

ALCANCE DE LA OBLIGATORIEDAD — CRÍTICO, no aplicar de forma universal
(hallazgo real de la revisión operacional): esta validación server-side
(obligatorio + mínimo de caracteres) debe aplicar SOLO donde alguien
está escribiendo un KPI nuevo de verdad — Camino D (Meta Libre) y la
futura creación del Estratega (Corporativa/Área en Ambiente Estrategia).

NO debe aplicar a los caminos de ASIGNACIÓN (B/C, vía cascadeGoal
desde BulkAssignWizard) — la meta individual instanciada para cada
persona NO necesita su propia description, porque el mockup 4.2 la
muestra leyéndola del PADRE (join), no copiándola al hijo. Si se
aplicara la validación de forma universal, rompería BulkAssignWizard
HOY MISMO: confirmado que manda description: ... || undefined
(StepWeightsConfirm.tsx o el submit equivalente, :242) — un zod
obligatorio en el servicio rechazaría esa creación.

INVESTIGAR antes de implementar (no asumir): ¿cascadeGoal necesita
copiar description del padre al hijo para que el mockup 4.2 la lea
directo del registro individual, o el componente de UI hace un JOIN
al padre en tiempo de render (vía parentId) sin necesitar que el hijo
tenga su propia copia? Esto determina si hace falta tocar cascadeGoal
o solo el frontend de 4.2.

PRODUCTORES verificados (no solo consumidores) — confirmar antes de
hacer el campo obligatorio en el servidor, para no romper caminos que
hoy no lo mandan:
  - BulkAssignWizard.tsx:242 → description: data.newGoalDescription
    || undefined — para goalSource='cascade', viaja undefined. Un zod
    obligatorio en el servicio rechazaría esta creación HOY MISMO si
    se aplicara sin acotar el alcance (ver más abajo).
  - createFromDevelopmentGoal (PDI) — a confirmar si arma description
    o también puede viajar vacío.
  - GoalRulesEngine.ts:156 — SÍ arma description ("Cascadeada desde:
    X") — este camino (Camino A, automático) ya está cubierto, sin
    riesgo.

Dato aparte, no bloqueante: cleanup-seed-goals-demo.ts depende de que
description contenga "[DEMO SEED]" para identificar y borrar datos de
prueba — este cambio no lo rompe (el script sigue usando su propia
firma), solo dejarlo anotado para quien lo toque después.

CONEXIÓN CON BUG 4: este campo obligatorio (donde aplica, ver alcance
arriba) es una segunda capa de protección (UX) contra el mismo
problema que BUG 4 resuelve a nivel de servidor (start=target=0
inflando el score) — si el jefe tiene que explicar QUÉ mide el número
antes de escribirlo, es más difícil dejar los valores vacíos sin
darse cuenta.
```

### 4.5 Paso de Distribución de Peso Dinámica (Camino D, y reutilizado en 4.2)

```yaml
Separar el peso de la meta a su PROPIO paso del stepper (hoy comparte
paso con StepLinkParent — confirmado por Victor con capturas: el input
de peso queda escondido, chico, al fondo de la pantalla tras el
buscador de meta padre).

Diseño:
  - Slider interactivo de gran formato (no input numérico tradicional
    para tipear).
  - Dos números gigantes, dinámicos, en tiempo real mientras se
    desliza:
    1. % que se está asignando a esta meta.
    2. % que queda disponible del presupuesto del empleado, restando
       en vivo.
  - Tope elástico: el slider NO permite arrastrarse más allá del
    peso disponible real del empleado en el ciclo activo (el número
    correcto, ya arreglado en Gate A).

IMPORTANTE — el slider es UX, no es el candado real:
  El freno visual del slider vive SOLO en el cliente. La garantía
  real sigue siendo el servidor (Gate A: validateTotalWeight en
  POST y PATCH). El slider previene el error humano y la fricción de
  tipear — no reemplaza la validación real. Documentar esto
  explícito en el código del componente, para que nadie asuma que el
  slider "ya protege" y relaje el servidor.

Investigar antes de construir: ¿existe ya en el proyecto algún
componente de slider/dial grande reutilizable (Performance, 9-box,
CompensationBoard, u otro módulo)? Reutilizar si existe, no
construir desde cero sin verificar primero (Regla #3).
```

### 4.6 Selector Familia → Subfamilia (Camino D, al elegir categoría propia)

```yaml
En la etapa de Definición del Camino D (Meta Libre): reemplazar el
buscador de texto libre de meta padre por selección de dos niveles,
SOLO para cuando el jefe decide asociarse por categoría (no aplica a
Caminos B/C, que ya vienen con categoría heredada del banco):

  1. Botones tipo píldora para las 4 Familias (Nivel 1).
  2. Al elegir una, se despliegan (animación CSS suave) las
     Subfamilias de esa familia (Nivel 2), con "Otros" siempre al
     final del grupo.
  3. Narrativa corta PROVISIONAL al seleccionar cada familia.

Diseño: skill focalizahr-design, estilos .fhr-*, mobile-first.

NOTA APARTE, NO PARTE DE ESTE GATE (guardada en memoria #26): isAligned
se comporta distinto si el padre es COMPANY (siempre true) vs. AREA
(hereda el valor del padre, que puede ser false) — puede generar
confusión en reportes de alineación a futuro. No se resuelve acá.
```

### 4.7 Smoke (tras Gate A y B completos)

```yaml
- Paso 1 bifurca correctamente: Meta Libre → wizard completo de 6
  pasos; Meta Definida → Nivel 2 (Corporativa/Área) → banco.
- Banco de Corporativa incluye level:'COMPANY' (ampliación confirmada
  en 3.2, Camino B) — hoy solo incluye AREA.
- Banco de Área filtra por el departamento del jefe (si ya existía) o
  se implementa el filtro (si no existía, según 3.3 punto 6).
- KPI se muestra de solo lectura en el banco (Camino B/C) — sin ningún
  input editable salvo peso.
- BulkAssignWizard YA NO permite editar targetValue por persona
  (StepWeightsConfirm.tsx) — solo weight.
- Slider muestra el peso disponible REAL (post Gate A).
- Campo "¿Cómo se mide?" es obligatorio, mínimo de caracteres
  respetado, mensaje asistido ante texto ambiguo.
- Elegir familia → subfamilias correctas se despliegan con animación
  (Camino D).
- Meta creada por Camino D queda con la categoría elegida por el jefe.
- Meta asignada por Camino A/B/C hereda la categoría de su origen sin
  mostrar ningún selector.
```

---

## 5. RESUMEN DE DEPENDENCIAS Y ORDEN

```yaml
Gate A (peso por ciclo)        → bloqueante, va primero, sin excepción
Gate B (categoría + 4 caminos) → puede empezar su investigación en
                                   paralelo a Gate A, pero el schema no
                                   se toca hasta que Gate A esté sellado
Gate C (UX del wizard)         → depende de A y B completos, no antes

Preguntas abiertas sin resolver (Gate 0 de Gate B, sección 3.3):
  - Import de CLIMA_TARGET_FAVORABILITY (3.4) — tensión de módulos
  - Estado real de /dashboard/metas/estrategia (punto 5)
  - Filtro de departamento en el banco de Área (punto 6)
  - (a) vs (b) para "meta corporativa activa" en la consulta de Clima
    (3.4) — quedó abierta desde una ronda muy anterior, nunca se
    confirmó explícitamente

YA INVESTIGADO, solo falta DECIDIR (no averiguar más):
  - Permiso de creación COMPANY/AREA: confirmado que NO EXISTE ningún
    chequeo de rol hoy (BUG 6). Lo pendiente es que Victor decida el
    set exacto de roles Estratega y si conviene un permiso nuevo
    ('goals:create:strategic' sugerido) — no hace falta más
    investigación de código para esto.
  - Origen del "Sugerido: X%" (4.2): 2 candidatos ya identificados
    (Goal.weight inerte de la meta padre, o GoalCascadeRule.
    assignedWeight) — falta que Victor elija uno, no investigar más.

Copy pendiente de confirmación visual (Victor/Studio IA):
  - Nombres finales de las 4 familias
  - Subfamilias completas de cada familia (solo "Cultura y Personas"
    tiene ejemplo dado, el resto son PROVISIONAL)
  - Narrativa corta por familia al seleccionarla
  - Mínimo de caracteres del campo "¿Cómo se mide?" (10 vs 15, 4.4)

FUERA DE ALCANCE de este documento (anotado para gate futuro, no
construir acá): la pantalla donde el Estratega CREA una meta
Corporativa/Área nueva desde cero (mockup "Crafting Canvas" de 4.4 se
aplica ahí también, pero la ubicación/permiso de esa pantalla —
Ambiente Estrategia — es investigación pendiente, punto 5 de 3.3).
```

---

*Spec v1 lista para Gate 0 (investigación read-only) de Gate A. No
avanzar a Gate B ni Gate C hasta que Gate A esté sellado con evidencia
real (smoke), siguiendo la misma disciplina de todo el proyecto GoalCycle.*
