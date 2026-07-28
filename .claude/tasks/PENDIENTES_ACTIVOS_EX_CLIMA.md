# Pendientes Activos — EX Clima

> **Lista viva, no historia.** Solo lo que bloquea trabajo FUTURO. Se borra la
> fila al resolverse — no se acumula. El changelog histórico (lo que ya se hizo)
> vive en `EX_CLIMA_PROGRESS.md` y no se toca desde acá.
>
> **Práctica de sello:** al sellar cualquier gate que descubra algo que bloquea
> trabajo futuro, agregar una fila acá (NO una nota en el changelog). Al
> resolverse, borrar la fila; la resolución detallada queda en el documento vivo
> de la columna 4, no en este índice.

## Bloqueadores abiertos

| Qué falta | A qué bloquea | Estado | Dónde vive la resolución |
|---|---|---|---|
| `activateProduct` runtime | Botones META_AREA / META_DURA / PDI_CLIMA (5D **Tab 2 · POR PERSONA**) | Diseño cerrado, falta implementar | `SPEC_UI_META_REACTIVO_v1.md` §4/§6 |
| Reescribir "energia" (doble-barril) | 3 celdas de Capa 2 que la usan como reactivo-palanca (hoy VIVO: no está en `REACTIVE_CIRCULARITY_EXCLUDE`) | Pendiente decisión de banco | `AUDITORIA_BANCO_REACTIVOS_v1.md` §2 |
| Botón "No ahora" (`pospuesto`) en Bloque 3 | Cerrar el flujo de decisión del lote con la 4ª opción | Decisión tomada (Ruta B1), falta implementar | Ver "Bloque 3 · pospuesto" abajo |
| Diccionario `reactivoLabel()` (31 ítems) | Slug de reactivo crudo visible en `ClimaDecisionCard:123` + título del strip de lote (solo existe `dimensionLabel` para la dimensión) | PROVISIONAL / Studio IA, decisión aparte | Este doc |
| **Regla Estado A/B** (`> N reactivos bajo tier` **O** `isSystemic` → Estado B) | Semilla de ruteo/severidad — NO existe en código ni docs | **Decisión NO tomada** — hay que decidirla y agregarla a la semilla | Ver "Decisiones de producto abiertas · (1)" abajo |
| **Política de peso** al crear metas de clima (`100/N`) | Wiring clima→`/api/goals` (dispatcher META_AREA/META_DURA, deuda #2 ficha) | **Decisión NO tomada** — validador actual RECHAZA, no reparte | Ver "Decisiones de producto abiertas · (2)" abajo |
| **Endpoint `/api/clima/action-log` + bitácora** (`ClimaActionLogEntry`) | Autorreporte del jefe (`actionText`) — hoy sin write path | **NO existe** — construir de cero (no "extender") | Ver "Decisiones de producto abiertas · (3)" abajo |
| **Pantalla de PDI en el dashboard de clima** (destino de `kind='pdi'`) | CTA "Atacar la causa" (Estado A) + "Ver plan de desarrollo" (Estado B) de Tab 2 — **la mitad del propósito de la pestaña** | **NO existe · PERMANENTE · PRIORIDAD ALTA** (5D Fase 3 **Blocker 2**) — ver callout abajo | `GATE0_FASE3_ACTIVATEPRODUCT.md` |
| **Slider de meta: banda "Buena mejora" ausente cuando `tier − mean < 0.4`** | Una de las 4 bandas de orientación del slider en `ClimaFixMetaScreen` (no bloquea el flujo — sigue gateado) | **DIFERIDO, no apurar.** Requiere repensar el step del slider o la lógica de bandas — **no es un problema de etiqueta, es ausencia real de un paso intermedio**: entre `min` (mean+0.2) y el tier no cae ningún step de 0.2. El fix de "Nivel saludable" (cercanía, 2026-07-27) ya subió de 2/4 a 3/4 bandas; esta es la 4ª. Evaluar rediseño cuando se retome esta pantalla. | `tab2MetaBandLabel` (`climaTab2Content.ts`) + mecánica del slider (`ClimaFixMetaScreen`) |
| **Título auto-generado de la meta de clima** (usa la pregunta truncada como nombre) | El nombre visible de cada meta `CLIMA_TRIGGERED` en el **módulo de Metas** (superficie aparte de clima) | **PROVISIONAL · PRIORIDAD ALTA.** Hoy `tab2MetaTitle` toma las primeras palabras de la pregunta + "…" ("Siento que mi supervisor me apoya en…") → **se lee como una pregunta de encuesta, no como una meta.** Es user-facing en el módulo de Metas, no solo en clima. Formato final: Victor / Studio IA (SPEC_UI §4). | `tab2MetaTitle` (`climaTab2Content.ts`) · `SPEC_UI_META_REACTIVO_v1.md` §4 |
| **Resumen agregado de bandas en el encabezado del wizard de fijar meta** (ej. "1 meta mínima, 2 ambiciosas") | Nada — mejora de legibilidad: el usuario ve el *mix* de las N cards **sin abrirlas** | **IDEA, no urgente · alcance NUEVO** — toca el **encabezado/header del wizard** (`ClimaFixMetaScreen`), no solo la card. Mismo principio que el gráfico de ciclo de Linear: un resumen del conjunto arriba de la lista. Contexto: hoy las cards arrancan colapsadas con target por defecto en la meta mínima, y el CTA "Fijar N metas" se puede confirmar sin abrir ninguna. Evaluar en su propia sesión de diseño. Reusa `tab2MetaBandLabelShort` para contar bandas. | `ClimaFixMetaScreen` (header) |

### ⚠️ Blocker 2 (Pantalla de PDI) — NO es deuda menor diferible

**Esto es PERMANENTE hasta que se construya la pantalla, y NO depende de datos de ningún
cliente:** el gate del CTA de desarrollo (`pdiEnabled=false`) aparece en **TODA cuenta,
siempre**, no en algún caso de borde. No es un empty-state que se llena con nómina real ni un
blocker de datos — es funcionalidad **sin construir**. El camino "plan de desarrollo" es **la
mitad del propósito de Tab 2 (por persona)**: la pestaña ofrece dos caminos (meta / desarrollo)
y hoy solo uno es accionable. Mientras no exista la pantalla, la mitad de la promesa de la
pestaña está muerta para el usuario, tapada por un tooltip. **Priorizar pronto — no dejar
indefinido.** El backend ya existe (`/api/clima/pdi-suggestion` + `PDISuggestionEngine`, sellado
Gate 5B-ii); falta SOLO la UI que lo consuma en clima.

### Bloque 3 · pospuesto — Ruta B1 (falta implementar)

Botón **"No ahora"** (`ceoDecision: 'pospuesto'`) junto a "Aprobar N" en Victorias Rápidas.
**Ruta B1:** valor nuevo en la union `CeoDecision`, SIN log ni recordatorio (igual que `rechazar`
para `ClimaActionLogService`/Tab 3), pero **distinguible de `rechazar` en el snapshot** para reporting
futuro (el *por qué*: no sirve vs. no era el momento). ~20 LOC (union + `DECISION_LABELS` + botón lote +
handler batch que espeja `handleAcceptBatch`). **Ruta B2** (que `pospuesto` sea MEDIBLE en la matriz →
crea log + campo de schema en `ClimaActionLog`) queda **diferida a Tab 3** (implica cambio de schema en
la BD única de producción).

---

## Decisiones de producto abiertas (Victor) — descubiertas en verificación 2026-07-25

> Las tres surgieron al verificar 3 preguntas de Code contra el repo real. La ficha
> `project_exclima_inventario_producto.md` documenta con precisión el *estado actual*
> (las tres **no existen / no están decididas**), pero una ficha de inventario no
> contiene decisiones. Van acá como decisiones formales pendientes.

**(1) Regla "Estado A/B" — NO existe en ningún archivo.**
`grep` confirma que "Estado A/Estado B" solo aparece en docs de **Cinema Mode** (MissionControl vs
SpotlightCard, sin relación). La regla planteada `total_reactivos_bajo_tier > 3` **O** `isSystemic → Estado B`
no está en código ni en la semilla. Lo único real es el boolean **`isSystemic`** (`climaThresholds.ts:141,154,155`
+ `climaPlanRouting.ts:30`), computado NO por conteo `>3` sino por **fracción** `REACTIVE_SYSTEMIC_RATIO=0.5`
con dos guardas duras (`REACTIVE_SYSTEMIC_MIN_MEASURED=3` / `REACTIVE_SYSTEMIC_MIN_BELOW=2`). No hay máquina
de dos estados.
- **Decisión pendiente:** definir si Estado B *es* `isSystemic` (reusar) o un concepto nuevo separado, y
  agregarlo a la semilla. ⚠️ **Alerta de reconciliación:** la formulación por conteo absoluto (`>3`) **choca**
  con lo ya sellado (fracción ≥0.5 con piso 2-bajo/3-medidos). Con umbral de conteo quedarían **dos
  definiciones de "sistémico"** conviviendo.

**(2) Política de peso al crear metas de clima — hoy el sistema RECHAZA, no reparte.**
El wiring clima→metas **no está construido** (`climaProductDispatcher.ts:57-68`, `pending: 'wiring clima→/api/goals
aún no construido'`), así que `weight = 100/N` no existe en código todavía. Cuando se construya pasará por
`POST /api/goals` → `GoalsService.validateTotalWeight` (`GoalsService.ts:750-778`), que **suma TODAS las metas
INDIVIDUAL activas** del empleado en el ciclo activo + el peso nuevo y **lanza `GoalWeightExceededError` si el
total > 100** (no redistribuye, no reparte solo entre las nuevas: **rechaza**). Realidad de datos:
`project_metas_inventario_producto.md:100-102` documenta 39/49 empleados >100% (hasta 230%) — el invariante ya
está roto porque el seed escribe directo sin pasar por el validador.
- **Decisión pendiente (3 caminos mutuamente excluyentes):** (a) recalcular/redistribuir el peso de TODAS las
  activas — pisa pesos que el jefe puso a mano; (b) repartir solo entre las nuevas — **incompatible con el
  validador actual, que rechaza**; (c) hard-cap/rechazo con mensaje. Elegir antes de cablear Tab 2.

**(3) Endpoint `/api/clima/action-log` + bitácora `ClimaActionLogEntry` — NO existe; construir de cero.**
`src/app/api/clima/` solo tiene `campaigns / results / action-plan/generate / pdi-suggestion`. **No hay
endpoint de action-log**, y **ningún código escribe `actionText`** (el autorreporte del jefe): el único write de
`climaActionLog` es la creación eager con `actionText:null` (`ClimaActionLogService.ts:64-71`, Gate 5C) y el
update del veredicto (`ActionEffectivenessService.ts:116`). Los `registeredBy/registeredAt` que aparecen en grep
son todos del módulo **compliance** (otro modelo). El "endpoint ya documentado" lo está en un plan, no en código.
- **Factibilidad de la bitácora — SÍ es aditiva, con una condición.** `ActionEffectivenessService` solo lee
  `ClimaActionLog.actionText` y solo le importa `hasText = actionText.trim().length > 0` (`:62-63,115`): no lee
  historial ni contenido, solo vacío/no-vacío. Agregar tabla `ClimaActionLogEntry` (log de entradas) + sincronizar
  `ClimaActionLog.actionText` con la entrada más reciente es **100% aditivo** (cero cambio a
  `ActionEffectivenessService` ni a lo sellado de 5C) **siempre que** el sync mantenga la invariante **"vacío = no
  ejecutó"** — `actionText` debe seguir `null`/'' cuando no hay entries reales (o al borrar la última). Es requisito
  del cuadrante `riesgo_critico`.
- **Decisión pendiente / respuesta a "extender vs hermano":** moot — el endpoint no existe, se crea de cero. Un
  solo `POST /api/clima/action-log` que inserte la entry en `ClimaActionLogEntry` **y** sincronice el espejo
  `actionText` cubre todo; **no hace falta endpoint hermano**. Cambio de schema (tabla nueva) → toca la BD única de
  producción, mismo régimen que Ruta B2 arriba.

---

## Gate 5D-i — pendientes del sello (2026-07-23, NO bloquean el sello)

**(a) Deuda de UX — el indicador "Plan aprobado" es poco visible.**
Hoy es texto chico en la esquina; no comunica con claridad que el usuario está en **modo revisión de un
plan ya cerrado** (inmutable). Propuesta a evaluar (NO decidida): estado más prominente + botón explícito
**"Revisar decisiones"**. No bloquea; es pulido de comunicación del estado read-only.

**(b) Cuenta demo "EmptyState A/B" — decidir si se limpia o se conserva.**
Creada esta sesión vía flujo real (submit + agregación + generate) para verificar los empty-states en
pantalla. Persistente en la BD de producción:
- `adminEmail = demo-emptystates-5di@fixture.local` · `accountId = cmrx7lkg800009ay7zrbwmwac`
- Campaña A (empty-state, todo sano): `cmrx7ll3200029ay7s89tiuyn` · Campaña B (mixto, lote/genérico vacíos): `cmrx7psja01fe9ay72qxrinkz`
- Regenerable idempotente: `prisma/scripts/seed-clima-empty-states-demo.ts` (untracked; borra+recrea).
- **Contraseña: NO se versiona.** La cuenta es regenerable, así que la contraseña no es preciosa. Debe vivir fuera del repo — recomendado: env var `DEMO_CLIMA_PASSWORD` en `.env` local (gitignored) que el seed lea al setear el hash; o pasarla out-of-band. La expuesta previamente en git plano conviene **rotarla** (setear una nueva sin commitear → la vieja queda inerte).
Pendiente decidir: **limpiar** (borrar la cuenta) o **conservar** para uso futuro. NO tocar `cmruvpmzx…`
(aprobado real) ni `cmrq30aue…` (borrador Corp Enterprise).

---

## Tab 3 (GROUP C · Seguimiento) — diferido a gate propio futuro

**NO CONSTRUIDO.** Tab 3 sigue siendo `FHREmptyState`; no existe `ClimaPlanTrackingTab.tsx` ni endpoint
de tracking. Se decidió sellar **5D-i sin Tab 3** y darle su propio gate.

> **Caso de referencia real para el alcance de Tab 3 (Victor, 2026-07-22):**
> GATE4_LOBBY_DEMO es **Pulso Express, no Experiencia Full**. Por eso sus `ClimaActionLog` (los 17 del
> plan aprobado `cmruvpmzx…`) **nunca recibirán veredicto de Tab 3 a través de ESTA misma campaña**:
> `ActionEffectivenessService.evaluateOnFollowUpClose` corre al cerrar un **Seguimiento Focalizado**
> (Experiencia Full, `isFollowUp`), midiendo el delta de mean de los mismos deptos. Un Pulso Express no
> dispara ese cierre. Para que estos logs se midan haría falta una **Experiencia Full futura sobre los
> mismos departamentos** actuando como Seguimiento. Dato a considerar al definir el gate de Tab 3: qué
> tipos de campaña habilitan la matriz de efectividad.

---

## Enhancement diferido (NO bloqueante) — consolidación de Bloque 2 (Crítico)

Bloque 2 hoy son tarjetas individuales inamovibles → a escala (300 deptos = 300 clics). Patrón `deptGroups`
de `DecisionConsole.DetailPanel.tsx` es **viable y BARATO-A-MODERADO**, NO choca con el modelo de datos ni
con Tab 3 (la persistencia N-broadcast ya existe en `handleAcceptBatch`; el gate `decididas===total` sigue
igual). Trabajo: helper `groupCriticoBySharedPlan` + handler decisión-batch modificar/rechazar + header
"transversal N deptos" en `ClimaDecisionCard` + refactor de `ClimaCaseReview` a grupos (~90-110 LOC).
Salvaguarda: agrupar SOLO con plan literalmente idéntico + mostrar los N deptos explícitos. **Deuda
documentada, NO bloqueante.**

---

## Deudas abiertas relacionadas (NO tocar sin decisión)

| Qué | Dónde | Por qué no se tocó |
|---|---|---|
| RBAC: `x-user-role` no se setea en login legacy Account | `src/middleware.ts:206-213` | El rol se calcula (`getEffectiveRole`) pero va a `x-effective-role`; `extractUserContext` lee `x-user-role` → 403 en todo endpoint con `hasPermission`. **RBAC global, se investiga en otra sesión.** |
| Toast con acción (retry) no implementado | `src/components/ui/toast-system.tsx` | La skill lo especifica como **v1.2 "Toast con acción — retry/undo"** pero el componente no tiene campo `action`. La franja de error de Bug B quedó **inline**; migrar cuando se implemente v1.2. Trabajo de plataforma, alcance propio. |
| `dangerouslySetInnerHTML` en toast | `toast-system.tsx:169` | XSS latente si un mensaje llega a incluir texto de usuario (ahora existe `ceoNotes`, escrito por el usuario). |
| `AnclaInteligente` posible corte de CTA | `src/components/executive/AnclaInteligente.tsx:140,204` | **COMPARTIDA con Goals y P&L.** Solución si se aborda: prop `compact?` aditivo (default false = cero cambio). Se le dio aire desde el wrapper de clima sin tocarla. |
| MAESTRO §3A/§8 dicen "4 cards" del Rail | `MAESTRO_EX_CLIMA.md` | Ahora son 5 (se agregó "Planes de Acción"). Consistencia de doc, no bloqueante. |
| 5 smokes trackeados de gates previos (5A / 5B-ii / 5C / 5D-x) | `prisma/scripts/smoke-clima-*.ts` | Evaluar en su propia sesión cuál es verificación puntual vs. regresión permanente. No urgente. |
