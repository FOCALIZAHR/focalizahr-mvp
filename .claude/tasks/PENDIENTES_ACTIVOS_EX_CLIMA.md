# Pendientes Activos — EX Clima

> **Lista viva, no historia.** Solo lo que bloquea trabajo FUTURO. Se borra la
> fila al resolverse — no se acumula. El changelog histórico (lo que ya se hizo)
> vive en `EX_CLIMA_PROGRESS.md` y no se toca desde acá.
>
> **Práctica de sello:** al sellar cualquier gate que descubra algo que bloquea
> trabajo futuro, agregar una fila acá (NO una nota en el changelog). Al
> resolverse, borrar la fila; la resolución detallada queda en el documento vivo
> de la columna 4, no en este índice.

| Qué falta | A qué bloquea | Estado | Dónde vive la resolución |
|---|---|---|---|
| `activateProduct` runtime | Botones de META_AREA/META_DURA/PDI_CLIMA en Tab 1 | Diseño cerrado, falta implementar | `SPEC_UI_META_REACTIVO_v1.md` §4/§6 |
| Reescribir "energia" (doble-barril) | 3 celdas de Capa 2 que la usan como reactivo-palanca | Pendiente decisión de banco | `AUDITORIA_BANCO_REACTIVOS_v1.md` §2 |
| Botón "No ahora" (`pospuesto`) en Bloque 3 | Cerrar el flujo de decisión del lote con la 4ª opción | Decisión tomada (Ruta B1), falta implementar | Este doc, sección "Bloque 3 · pospuesto" |

---

## Gate 5D-i — estado al cierre de sesión 2026-07-20 (NO SELLADO)

### ✅ Completado y verificado hoy

- **GROUP A (Paso 0 — ensamblado):** `assembleClimaDecisionInputs.ts` (puro) +
  `GET /api/clima/action-plan/generate` (preview, 0 writes). Probado contra datos
  reales de `GATE4_LOBBY_DEMO` → 17 decisiones.
- **GROUP B (Tab 1):** portada → carrusel de 4 caminos → workspace 35/65 →
  revisión uno-a-uno → encadenado → lote con sub-batches por reactivo.
- **Guardas de `isSystemic`:** `REACTIVE_SYSTEMIC_MIN_MEASURED=3` +
  `REACTIVE_SYSTEMIC_MIN_BELOW=2` (además del ratio 0.5). Sin ellas, una dimensión
  de 1-2 reactivos salía sistémica por aritmética del denominador (15/17 → 2/17).
- **3 bugs del flujo de decisión, cerrados:**
  - **A** — avance instantáneo sin feedback: botones bloqueados + "Guardando…" →
    "Guardado ✓" → recién ahí avanza. Caso congelado (`frozenRef`) + guard de fase
    contra doble clic.
  - **B** — autosave fallaba en silencio: `persist()` devuelve `PersistResult`
    tipado, maneja `!res.ok` y el catch, mensajes en lenguaje humano, franja de
    error con **Reintentar**, y **rollback** del estado local (el progreso ya no
    cuenta decisiones que no se guardaron). El lote también.
  - **C** — "Modificar" sin editor: textarea inline "¿Qué vas a ajustar?",
    "Confirmar ajuste" deshabilitado si está vacío → `ceoNotes` deja de viajar
    `undefined`.
- **Revert aprobado:** Bloque 1 volvió a los 3 botones (Aceptar/Modificar/Rechazar).
  La versión de 1 solo CTA dejaba a los sistémicos sin forma de rechazarse y trababa
  el gate `decididas === total`.
- **Verificación:** `tsc --noEmit` EXIT 0 · `npm run build` EXIT 0 ·
  smokes 7/7 (lote grouping) + 17/17 (assembler) + 36/36 (narrativas sistémicas).

### ✅ Paso 1 de la revisión — variantes Capa 2 sembradas (HECHO)

**Hallazgo:** `autonomia.amarilla` NO tenía `colaboracion` (solo `autonomia`,
`ambiente_fisico`, `herramientas`, `cohesion_equipo`, `flexibilidad`), y
`liderazgo.amarilla` NO tenía `desarrollo`. Por eso **Gestión Corriente quedaba en 0
para siempre** y el bloque era inejercitable.

**Sembradas 2 celdas** en `CLIMA_INTERVENTION_VARIANTS` (copy PROVISIONAL, requiere
revisión de Victor/Studio IA):
- `autonomia.amarilla.colaboracion` — esfuerzo BAJO / efectividad ALTA
- `liderazgo.amarilla.desarrollo` — esfuerzo BAJO / efectividad MEDIA_ALTA

**Resultado verificado en GATE4_LOBBY_DEMO:**
`{gestion_corriente: 3, sistemico: 2, critico: 11, generico: 1}` — **los 4 bloques
poblados**. Gestión Corriente: 3 casos en **2 sub-batches**
(`colaboracion` con 2 deptos, `desarrollo` con 1).

### Paso 3 — aprobación real del plan: VERIFICADO POR SCRIPT (2026-07-21)

Smoke `prisma/scripts/smoke-clima-5di-approval.ts` (auto-limpiante, `--commit`)
ejercita los **handlers reales de las rutas** con `NextRequest` forjado (el
middleware con la deuda RBAC NO se invoca al llamar el handler directo). **22/22
pass.** Probado end-to-end contra prod y luego limpiado por id exacto en
`$transaction` (prod quedó como estaba: `ClimaActionLog=0`, borrador
`cmrt4ghz1…` intacto):

- `POST /api/action-plans` → borrador · `GET` detalle · `PUT estado=aprobado` →
  hook `onClimaPlanApproved` corre: **12 `ClimaActionLog`** (= decisiones
  aceptar/modificar, `actionText=null`) + **4 `CommunicationMessage`**
  (`clima_action_reminder`, `EMAIL`, `scheduledAt = aprobación +30d`).
- **Walk-up confirmado en el hook real:** los 4 recordatorios salieron a
  `victor@focalizahr.cl` (fallback `account_admin`); ningún email de tercero.
- Hook **idempotente** (2º disparo no duplica; `createMany skipDuplicates`).

**Nota:** el artefacto PERMANENTE en BD lo dejará la aprobación real por UI
(Paso 2 abajo); este smoke prueba que el path escribe correctamente y no deja
rastro.

### ✅ CONFIRMACIÓN REAL EN USO DE LA APP (2026-07-22) — no smoke

Victor aprobó por UI el plan de GATE4_LOBBY_DEMO → primera evidencia del path
`onClimaPlanApproved` en producción real. Verificado read-only en BD:
- **Plan `cmruvpmzx000110lephf8fma6`** · `aprobado` por `maria@empresa.cl` (HR_MANAGER)
  · `approvedAt` 2026-07-22 11:52 · 17 decisiones, todas `aceptar`.
- **`ClimaActionLog` = 17** (una por decisión aceptada), todas con `actionText`/`registeredAt`
  null (fila lista, sin ejecutar) e `impactMeasured` null (pendiente de veredicto Tab 3).
- **`CommunicationMessage clima_action_reminder` = 4** (deptos aceptados distintos: Comercial,
  Desarrollo Software, Atención a Clientes, COBRANZA PRE-JUDICIAL). Las 4 con `toEmail =
  victor@focalizahr.cl` (**walk-up fallback account_admin, 0 terceros**), `scheduledAt =
  aprobación +30d` (2026-08-21), `channel EMAIL`, `status PENDING` (espera el cron dispatcher).

El path endpoint→hook→BD queda confirmado en uso real, no solo por smoke. (Dato colateral:
este plan quedó `aprobado`/inmutable → para re-probar el flujo editable hace falta un borrador
nuevo. El Smart Road mostraba "Aprobar plan" activo sobre este plan ya aprobado — bug
readOnly-aware RESUELTO en `5e33dad` (Opción B: el Lote en plan aprobado cae a la vista
read-only de sus sub-batches, no al Smart Road).)

### Estados de borde scriptables — VERIFICADOS en el mismo smoke

- **read-only tras aprobar** → `PUT` sobre aprobado = **403 inmutable** ✓
- **409 borrador duplicado** → `POST` para GATE4_LOBBY_DEMO (ya hay borrador) =
  **409 con `existingPlanId`** ✓
- **error real distinto de 403** → `POST moduleType` inválido = **400** ✓
- **RBAC del endpoint propio** → `POST` con rol `EVALUATOR` = **403** ✓ (confirma
  que la deuda de 403 es SOLO del middleware, no de los handlers).

### Ensamblado = SNAPSHOT (congelado al crear el borrador) — NO recálculo (2026-07-21)

Confirmado en código (`ClimaPlanDeptTab.tsx:111` → `setDecisiones(active.decisiones ?? preview)`:
si hay borrador gana el snapshot; el generate fresco solo es fallback) **y en BD**.
El ruteo a bloque (`classifyDecisionBlock`) lee `intervention.esfuerzo/efectividad`
**horneados en la decisión al build-time** — un snapshot viejo no re-rutea.

**Caso `cmrt4ghz1` (borrador GATE4, creado 07-20 11:09 UTC):** snapshot
`{sistemico:2, critico:11, gestion_corriente:0, generico:4}` — sus 4 casos amarillos
tienen `esf=∅ efe=∅` → todos a `generico`. Se creó **~7,5 h antes** de sembrar las
variantes Capa 2 (`fed4663`, 07-20 18:45 UTC). El **fresco de hoy** da
`{gestion_corriente:3, generico:1}` (los 3 casos ahora `esf=BAJO efe=ALTA|MEDIA_ALTA`).
**El ruteo es correcto; el borrador es rancio.** NO es bug.

✅ **`cmrt4ghz1` DESCARTADO por id (2026-07-21, con OK de Victor)** — tenía 0
ClimaActionLog, delete limpio. GATE4_LOBBY_DEMO quedó sin borrador clima → al reabrir
Tab 1 el preview fresco incluye la ruta de lote (`gestion_corriente:3`). Recorrido UI
del Paso 1 ahora sí ejercita los 4 caminos.

> Deuda de diseño (transitoria, no bloqueante): un borrador snapshot NO refleja cambios
> posteriores del diccionario de intervenciones. Aceptable mientras las variantes son
> PROVISIONALES y se están sembrando. Revisitar si un cliente real deja borradores
> abiertos entre versiones del diccionario.

### Notas UX del recorrido manual (no bloqueantes — reportadas, NO fixeadas)

1. **Sin consulta de un camino ya terminado.** El carrusel/`remaining` solo muestra
   caminos con pendientes (`ClimaPlanDeptTab.tsx:258-264`); un camino 100% decidido
   (ej. "Problemas de fondo") no tiene forma de re-abrirse para revisar lo decidido.
2. **Feedback de guardado genérico.** Al aceptar/modificar un caso el único aviso es
   "Guardado", sin decir QUÉ se guardó. Enlaza con la deuda de toast-con-acción v1.2
   (franja inline de Bug B). Esperar decisión antes de tocar.

### Recorrido UI 2026-07-21 — 3 temas

**Punto 1 (arquitectura, CONSULTA — no implementar):** los 11 casos de "Foco urgente"
son 11 decisiones reales distintas, sin duplicados (3 deptos: Atención a Clientes 5,
COBRANZA 4, Desarrollo Software 2). Hay 3 pares con mismo `category+zona+plan`. Bloque 2
(Crítico) hoy es tarjetas individuales inamovibles → a escala (300 deptos = 300 clics).
**Estimado de aplicar consolidación-de-revisión (patrón `deptGroups` de
`DecisionConsole.DetailPanel.tsx`): BARATO-A-MODERADO, viable, NO choca con el modelo de
datos ni con Tab 3** — la persistencia N-broadcast YA existe (`handleAcceptBatch` en
`ClimaPlanDeptTab`), el gate de aprobación (`decididas===total`) sigue igual. Trabajo real:
helper `groupCriticoBySharedPlan` (~15 LOC) + handler decisión-batch para modificar/rechazar
(~15 LOC, espeja `handleAcceptBatch`) + header "transversal N deptos" en `ClimaDecisionCard`
(~20 LOC) + refactor de `ClimaCaseReview` para iterar grupos en vez de casos (~40-60 LOC).
Salvaguarda: agrupar SOLO con plan literalmente idéntico + mostrar los N deptos explícitos
(mismo criterio que Compliance). **Deuda documentada, NO bloqueante para sellar 5D-i.**

**Punto 2 (copy jerga, RESUELTO 2026-07-21):** eliminada la jerga interna
`efectividad`/`se mide` de la UI de lote (RESOLUCION §2) + reescrita la narrativa de
Bloque 4 (Genérico), con skill `focalizahr-narrativas`. tsc 0 errores.
- `ClimaLoteBar.tsx:54`: "Mismo reactivo en lote — se mide su efectividad por separado" →
  "El mismo foco en varios equipos — una acción los cubre a todos."
- `ClimaLoteView.tsx`: header y empty-state re-redactados sin `se mide`/`zona de lote`.
- `climaPlanPaths.ts` generico: label `Señal sin receta` → `A tu criterio`; tagline/lines/
  mission reescritos en lenguaje de negocio (además corrige voseo `ponés vos` → `tú`).
  ⚠️ El cambio de LABEL es opinado — Victor puede vetarlo dejando el resto.
- Verificado §2: `validationMetric` NUNCA se renderiza (solo comentario en `ClimaDecisionCard:17`).

**Deuda relacionada (slug de reactivo crudo):** el slug interno del reactivo se muestra
crudo en `ClimaDecisionCard:123` (`foco: colaboracion`) y en el título del strip de lote.
NO existe mapa `reactivoLabel()` (solo `dimensionLabel` para la dimensión). Fix limpio
requiere un diccionario reactivo→label (31 ítems, PROVISIONAL/Studio IA). Fuera del alcance
del punto 2 — decisión aparte.

**Punto 3 (preview en confirmación de lote, RESUELTO 2026-07-21 — Opción A):** el panel de
confirmación de `ClimaLoteBar` ahora muestra "La acción" (narrativa + pasos del sub-batch,
representante `items[0].intervention` porque todos comparten la misma celda variante) antes
de "Se aplicará a N equipos". 0 fetch, 0 endpoint, progressive disclosure. tsc 0 errores.
⚠️ **Observación:** el preview arrastra el prefijo `PROVISIONAL — ` en la narrativa (contenido
sembrado; ya visible igual en `ClimaDecisionCard`). Pasos limpios. Se va cuando Studio IA
escriba el copy final; NO se enmascara (sería inconsistente con las cards individuales).

**Punto 4 (copy de portadas, RESUELTO 2026-07-21 — `focalizahr-narrativas`):** reescritos los
3 bloques del carrusel en `climaPlanPaths.ts`. tsc 0 errores; highlights verificados verbatim.
- **4a — Bloque 3:** eliminado "Alto impacto, cero esfuerzo" (falso: esfuerzo es BAJO, no cero).
  Nueva mission comunica "bajo esfuerzo, alto impacto" + "sigue habiendo algo que hacer —una
  conversación, un gesto— pero es liviano y está probado". `por reactivo`→`por foco`, `en lote`→`de una vez`.
- **4b — Bloques 1 y 2:** simetría de cross-referencia (ambos se nombran mutuamente) + cada
  card deja sentir su eje sin depender del color: Bloque 1 = **amplitud** ("un patrón de gestión
  … se deriva, no se parcha … el problema es ancho"); Bloque 2 = **profundidad** ("incidente
  puntual … se resuelve de a uno … no es un problema ancho, es hondo"). Par de contraste ancho/hondo.

### Barrido em-dash "—" en copy user-facing (2026-07-21)

Regla del proyecto (no negociable): sin em dash en texto visible. Mi copy nuevo la violó.
Barrido completo del módulo planes + clasificación:
- **A) Módulo planes, prosa (11 strings): CORREGIDO** — `climaPlanPaths.ts` (8 valores:
  taglines/lines/missions de sistémico/crítico/genérico/gestión) + 5 strings JSX
  (`ClimaLoteBar:57`, `ClimaLoteView:35,45`, `ClimaDecisionCard:144`, `ClimaPlanDeptTab:296`).
  Reemplazo por frases cortas / dos puntos (Regla 5). tsc + build limpios, highlights verbatim OK.
- **B) Diccionario (`ClimaInterventionDictionary.ts`): em-dash RENDERIZADO CORREGIDO 2026-07-22.**
  El "PROVISIONAL" se mantiene (recordatorio útil), el "—" se fue. Un solo cambio en la constante
  `P` (`ClimaInterventionDictionary.ts:46`, `'PROVISIONAL — '`→`'PROVISIONAL: '`) arregló TODAS las
  narrativas (32 base + 93 variantes + sistémica). + em-dash interno de la narrativa sistémica
  (línea 1066, `puntual — es un patrón`→dos frases) + guard del smoke
  (`smoke-clima-systemic-narrativas.ts:50`) + 2 comentarios que documentaban el prefijo. Smoke 36/36,
  tsc+build limpios. El resto de "PROVISIONAL —" en el repo son COMENTARIOS (no renderizados) y el
  campo `evidencia` NO renderiza en clima (solo compliance) → no se tocaron.
- **C) Otras vistas clima (fuera de planes):** `CrossSignalPanel:25`, `ClimaToolbar:56`,
  `AcotadoGapCard:65`. **NO tocado** — fuera del módulo. Decisión de scope pendiente.
- **D) NO se tocan:** "—" como indicador de "sin dato" (`EngagementGauge`, `FavorabilityBar`,
  `HeatmapGrid`, `ImpactGapMatrix`, `ClimaToolbar:46`) — uso legítimo, no prosa.

### Auditoría de casos ya decididos — IMPLEMENTADO 2026-07-21 (~47 LOC, 3 archivos)

`ActionPlan.decisiones` persiste el detalle COMPLETO (`intervention.{narrative,steps,
businessCase,level,levelLabel,suggestedProduct}` + `ceoDecision`/`ceoNotes`) — verificado en BD.
Impl: `reviewMode` en `ClimaCaseReview` (renderiza todos los casos como lista editable, no
dispara `onAllDone`) + `onReview`/botón "Revisar lo decidido" en `ClimaPathChaining` + sub-estado
`reviewAll` en `ClimaPathWorkspace` (además: entrar a un bloque 100% decidido cae directo al
cierre, sin reabrir el flujo lineal). Reusa `ClimaDecisionCard readOnly`. 0 endpoints. tsc+build OK.

### Auditoría UX del flujo de aprobación 2026-07-21 — sección 2 (confirmado, NO implementado)

- **2a — Toast Bloque 2:** el wizard **NO usa `focalizahr-notificaciones`** (grep vacío en
  `planes/`). Feedback INLINE en `ClimaDecisionCard` (phase `Guardando…`/`Guardado ✓` líneas
  207-221; error inline + Reintentar 289-305) + `frozenRef` en `ClimaCaseReview`. **Assessment:
  divergencia JUSTIFICADA** — el toast transient no puede gatear el avance ni anclar el feedback
  al caso durante el freeze (mecanismo distinto para necesidad distinta), no re-invención perezosa.
  Deuda relacionada ya anotada: la franja de ERROR migra a toast-con-acción v1.2 cuando exista.
- **2b — diferenciación visual de Bloque 4: RESUELTO 2026-07-21 (Opción B, aditiva).** El badge
  de zona NO se toca (regla anti-semáforo intacta). `ClimaDecisionCard` deriva el bloque con
  `classifyDecisionBlock(item)` (sin threading de props) y, si es `generico`, agrega un tag ghost
  neutro "sugerencia general · sin receta probada" + atenúa el footer del producto sugerido.
  tsc+build limpios, sin em dash (middle dot). Condición real de generico: zona amarilla +
  NO(esfuerzo BAJO & efectividad ALTA/MEDIA_ALTA); NO es `selectedReactive=null`.
- **2c — ruteo lote fuera de "Caminos que faltan": RESUELTO 2026-07-21.** Era bug de guía (no de
  seguridad). `remaining` en `ClimaPlanDeptTab` pasó de `INDIVIDUAL_PATHS` (excluía lote) a
  `CLIMA_PLAN_PATH_ORDER` (los 4, orden canónico, única fuente de verdad). Ahora "Caminos que
  faltan" lista "Seguir con victorias rápidas · N pendientes"; `onGoToPath` ya ruteaba a cualquier
  bloque. tsc+build limpios.
- **2d — Bloque 3 portada+contenido en 1 pantalla: INTENCIONAL.** `ClimaPathWorkspace:108,171`
  `isLote` salta el sub-flujo intro→review→done (que es para revisión lineal caso-a-caso). El
  lote es un flujo más liviano (batch), 1 pantalla es apropiado. Sin acción.

### Botón del lote — 1 CTA por estado (RESUELTO 2026-07-22)

Bloque 3 (Victorias Rápidas) ya no tiene el doble salto "Aceptar N de X" → "Confirmar". Reposo:
`GhostButton "Revisar plan"` (sin verbo de decisión, chevron expand/collapse) que abre el detalle
inline (narrativa + pasos + equipos, ya existente). Al pie: UN `PrimaryButton "Aprobar N"` que
aprueba y despacha. Se eliminó "Cancelar" (cerrar = colapsar el toggle). Solo `ClimaLoteBar.tsx`,
~15 LOC, mismo `onAcceptBatch`, sin componente/modal nuevo. tsc+build limpios. Bloque NO renombrado.

### Gate 5D-x — procedencia + clon defensivo (IMPLEMENTADO 2026-07-22)

Las 2 piezas "ahora" de `GATE0_CAPA0_CONTENIDO_EDITABLE_CLIMA_PROPUESTA.md §5D-x` (aditivas,
"caras después" por la inmutabilidad de los planes aprobados):
- **`templateRef` (Camino B, §2):** `ClimaTemplateRef { id, version }` + `templateEdited?` en
  `ClimaDecisionItem` (`clima-planes.ts`). El builder lo estampa (`ClimaActionPlanBuilder.ts`):
  `id = ${dimension}:${zone}:${reactivo ?? '∅'}` (sistémica → `:sistemica:∅`), `version = CATALOG_VERSION (1)`.
  Cero migración, cero cambio de API (el PUT asigna `decisiones` sin validar shape). Habilita Fase 2.
- **Clon defensivo (§3):** `structuredClone(cell)` en el builder antes de armar el `intervention` —
  cubre las 3 ramas (base/variante/sistémica) de una vez y sobrevive a la migración + al caché de
  Gate 6. Output byte-idéntico (puramente defensivo).
- Smoke: `smoke-clima-5dx-procedencia.ts` 11/11 (templateRef estampado + aliasing roto + diccionario
  intacto). Fix colateral: `smoke-clima-lote-grouping-gate5di.ts` (factory de items sin `templateRef`
  requerido). tsc+build limpios.
- **Gate 6 (Capa 0 completa: tabla + semilla + admin CRUD + LLM) queda DESPUÉS de 5D**, per §5.

### Bloque 3 · pospuesto — decisión tomada (2026-07-22), falta implementar

Se agrega un botón **"No ahora"** (`ceoDecision: 'pospuesto'`) junto a "Aprobar N" en Victorias
Rápidas. **Ruta B1:** valor nuevo en la union `CeoDecision`, SIN log ni recordatorio (igual que
`rechazar` para `ClimaActionLogService`/Tab 3), pero **distinguible de `rechazar` en el snapshot del
plan** para reporting futuro (el *por qué*: no sirve vs. no era el momento). Evidencia que sostiene
la ruta: rechazar no genera `ClimaActionLog` (`ClimaActionLogService.ts:38-39`) → invisible a
`ActionEffectivenessService` (`:91-94`); la matriz de Tab 3 mide solo sobre logs.
**Ruta B2 (que `pospuesto` sea MEDIBLE en la matriz — crea log + campo de schema en `ClimaActionLog`)
queda EXPLÍCITAMENTE diferida a GROUP C (Tab 3)** — no se resuelve ahora (implica cambio de schema en
la BD única de producción). Costo B1 ≈ ~20 LOC (union + `DECISION_LABELS` + botón lote + handler batch).

### ❌ Lo que FALTA para poder sellar 5D-i (requiere navegador — lo corre Victor)

1. **Recorrer los 4 caminos en UI** (Aceptar/Modificar/Rechazar en cada tipo + el
   lote con sus sub-batches). Solo se ejercitó Sistémico en UI. *(A nivel dato los
   3 caminos + lote ya pasaron por el smoke; falta el recorrido visual.)*
2. **Aprobar un plan de verdad por UI** para dejar el artefacto permanente y ver el
   feedback del flujo guiado en pantalla. *(El path server ya está probado — Paso 3
   arriba.)*
3. **Estados de borde de UI:** empty states · 409 de carrera REAL con 2 pestañas
   abiertas (el 409 del server ya está probado). *(read-only y error ya cubiertos.)*
4. **Mobile 320px** — nunca verificado.
5. **GROUP C (Tab 3 · Seguimiento): NO CONSTRUIDO.** Sigue siendo `FHREmptyState`;
   no existe `ClimaPlanTrackingTab.tsx` ni endpoint de tracking. Decidir si se sella
   "5D-i sin Tab 3" o se construye antes.

### Deudas abiertas relacionadas (NO tocar sin decisión)

| Qué | Dónde | Por qué no se tocó |
|---|---|---|
| RBAC: `x-user-role` no se setea en login legacy Account | `src/middleware.ts:206-213` | El rol se calcula (`getEffectiveRole`) pero va a `x-effective-role`; `extractUserContext` lee `x-user-role` → 403 en todo endpoint con `hasPermission`. **RBAC global, se investiga en otra sesión.** |
| Toast con acción (retry) no implementado | `src/components/ui/toast-system.tsx` | La skill lo especifica como **v1.2 "Toast con acción — retry/undo"** pero el componente no tiene campo `action`. La franja de error de Bug B quedó **inline**; migrar cuando se implemente v1.2. Trabajo de plataforma, alcance propio. |
| `dangerouslySetInnerHTML` en toast | `toast-system.tsx:169` | XSS latente si un mensaje llega a incluir texto de usuario (ahora existe `ceoNotes`, escrito por el usuario). |
| `AnclaInteligente` posible corte de CTA | `src/components/executive/AnclaInteligente.tsx:140,204` | **COMPARTIDA con Goals y P&L.** Solución si se aborda: prop `compact?` aditivo (default false = cero cambio). Se le dio aire desde el wrapper de clima sin tocarla. |
| MAESTRO §3A/§8 dicen "4 cards" del Rail | `MAESTRO_EX_CLIMA.md` | Ahora son 5 (se agregó "Planes de Acción"). Actualizar al sellar. |
