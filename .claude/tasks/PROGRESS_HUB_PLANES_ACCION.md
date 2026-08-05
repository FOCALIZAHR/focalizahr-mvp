# PROGRESS — Hub de Planes de Acción + Seguimiento de Efectividad

> **Fuente de verdad del avance.** Se actualiza al CERRAR cada gate, no antes.
> **Plan maestro:** `.claude/tasks/PLAN_MAESTRO_PLANES_ACCION_EFECTIVIDAD_v1.md`
> **Arranque:** 2026-08-05 · HEAD al arrancar: `d8802ca`
> **Metodología:** plan maestro §8.1 — Gate 0 read-only → Plan Mode → aprobación
> explícita de Victor → implementación → smoke con evidencia real → sello.

---

## Estados

`⬜ pendiente` · `🟡 en curso` · `✅ sellado` · `⛔ bloqueado` · `⏸️ diferido`

---

## Mapa de gates

Deriva del orden de construcción del plan maestro §5. El paso 1 de ese orden
(cerrar Bitácora F3/F4) **no genera gate acá**: ya está cerrado — ver H0.

| Gate | Nombre | Estado | Commit |
|------|--------|--------|--------|
| H0 | Gate 0 read-only — verificación contra código real | ✅ | _(sin código)_ |
| H1 | Hub con las 3 cápsulas | ✅ | `7a6c771` + `9c5260e` |
| H2a | Cápsula 3 — Estado A · cobertura por gerencia | ✅ | `8fdc922` + `8478d3a` |
| H2b | Cápsula 3 — Estado A · cadencia táctica | ⛔ | bloqueada por dato |
| H3 | Cápsula 3 — Estado B (post-resultados, motores) | ⬜ | |
| H4 | Cápsula 3 — Motores avanzados + cruces de suite | ⏸️ | |

**Dependencias duras entre gates:**

```
H0 ──> H1 ──> H2 ──> H3 ──> H4
              │       │
              │       └── requiere: ≥1 Seguimiento Focalizado CERRADO
              │                     (Experiencia Full isFollowUp) sobre los
              │                     mismos departamentos del plan aprobado
              └── requiere: nada (cuenta sobre ClimaActionLog, sin identidad)
```

---

## H0 — Gate 0 read-only ✅

Verificación del plan maestro contra el código real. Sin código escrito.

- [x] `climaSubproductos.ts` — 6 cards del Rail (no 4, como dice el comentario)
- [x] `types/clima.ts:212-218` — union `ClimaSubproducto`
- [x] `ClimaCinemaOrchestrator.tsx:181-207` — ramas de render por subproducto
- [x] `ClimaPlanesView.tsx` — tabs internas reales
- [x] `api/clima/action-log/route.ts` — 3 modos del GET + POST, guards
- [x] `schema.prisma:4075-4119` — `ClimaActionLog` + `ClimaActionLogEntry`
- [x] `ActionEffectivenessService.ts` — gatillo y cuadrantes
- [x] Estado real de la Bitácora (F1-F4)
- [x] Permisos de clima en `permissions.ts:625-656`

**6 divergencias reportadas a Victor** (D1-D6). Detalle en la sección
"Divergencias" al final de este documento.

---

## H1 — Hub con las 3 cápsulas ✅ SELLADO 2026-08-05 · `7a6c771` + `9c5260e`

**Archivos finales de H1** (5 nuevos + 4 modificados):

```
NUEVOS
  src/app/api/clima/action-log/summary/route.ts        endpoint del progreso
  src/types/clima-hub.ts                               contratos
  src/lib/constants/climaHubContent.ts                 copy + íconos + colores
  src/app/dashboard/clima/components/planes/
    ClimaPlanesHub.tsx                                 el enrutador (3 puertas)
    ClimaEfectividadView.tsx                           máquina de estados cápsula 3
    ClimaEfectividadPortada.tsx                        portada (pantalla)
    ClimaEfectividadHallazgos.tsx                      contenido ← AQUÍ ESCRIBEN H2/H3

MODIFICADOS
  ClimaCinemaOrchestrator.tsx    la card `planes` monta el hub
  climaSubproductos.ts           la Bitácora sale del Rail
  src/types/clima.ts             `'bitacora'` sale de la union
  ClimaPlanesView.tsx            se retira el tab 3 (excepción autorizada)
```

Objetivo: la card `planes` del Rail deja de abrir `ClimaPlanesView` directo y
abre un hub con 3 tarjetas + barra de progreso global.

### H1.1 — Backend: endpoint de progreso ✅
- [x] Ruta NUEVA `src/app/api/clima/action-log/summary/route.ts` (archivo nuevo,
      NO se toca `action-log/route.ts`, que está sellado)
- [x] Skill `focalizahr-api` cargada antes de escribir
- [x] `extractUserContext` → `hasPermission('clima:view')` → `accountId` en toda query
- [x] Devuelve `{ withAction, total, pct }` sobre `ClimaActionLog` del plan aprobado
- [x] Filtrado 3 capas por rol (AREA_MANAGER acotado a su subárbol)

### H1.2 — Copy del hub ✅
- [x] Skill `focalizahr-narrativas` cargada antes de escribir una palabra
- [x] `src/lib/constants/climaHubContent.ts` — archivo propio (NO
      `climaBitacoraContent.ts`, tomado por la otra sesión)
- [x] Badges por misión, no por rol (plan §1.3)
- [x] **Desvío deliberado del plan:** el copy dice "focos", no "planes". El plan
      maestro §1.3 ejemplifica con "34 de 42 planes", pero hay UN `ActionPlan`
      por campaña y N filas `ClimaActionLog`. "2 de 17 planes" sería un número
      falso. `foco` es la palabra que ya usa la Bitácora.

### H1.3 — Componente del hub ✅
- [x] Skill `focalizahr-design` cargada; Gate 0 respondido antes del JSX
- [x] Molde: `ClimaPlanPortada.tsx` (portada universal, calibrada contra el
      presupuesto vertical de 1366x768). NO se abrió `executive-portadas.md`:
      no hay identidad de persona.
- [x] Tesla line · word-split · glassmorphism · PremiumButton · número hero
- [x] Mobile-first 320px: `grid-cols-1 md:grid-cols-3`
- [x] Peso idéntico en los 3 CTA: tres `SecondaryButton`, **cero Primary**. Es
      navegación, no embudo — y respeta "máximo 1 Primary por vista".
- [x] La barra de progreso NO cambia de color según el valor (sería semáforo,
      anti-patrón). Relleno siempre en gradiente de marca.

### H1.4 — Cableado ✅
Los 4 cambios salen de las decisiones D2 y D3 (Victor, 2026-08-05).
- [x] `ClimaCinemaOrchestrator.tsx` — la rama `planes` monta el hub; se retira
      la rama `bitacora` y su import (pasa a montarse desde el hub)
- [x] `climaSubproductos.ts` — se retira la card `bitacora` del Rail (D3)
- [x] `types/clima.ts` — se retira `'bitacora'` de la union `ClimaSubproducto`
- [x] `ClimaPlanesView.tsx` — se retira el tab `seguimiento` (D2, **excepción
      a §8.2 autorizada explícitamente por Victor**). Solo 3 puntos: union
      `PlanesTab`, array `TABS`, rama de render + el import de `FHREmptyState`
      que quedó sin uso. Tab 1 y Tab 2 intactos.

Sin card nueva ni miembro nuevo: el hub vive dentro de la card `planes`.

### H1.5 — Verificación y sello ✅
- [x] Smoke `prisma/scripts/smoke-clima-hub-summary.ts` — **17/17 contra la base
      real**, 100% read-only (no escribió ninguna fila, sin fixture)
- [x] `npx --no-install tsc --noEmit` limpio
- [x] `npx --no-install next build` limpio
- [x] Smoke borrado
- [x] Commit de código separado del de documentación

**Commit(s):** `7a6c771` (código) · este documento (doc)

### Evidencia del smoke — dato real leído de vuelta

Cuenta `cmfgedx7b00012413i92048wl`, plan aprobado `cmruvpmzx000110lephf8fma6`:

```
verdad de terreno : 17 focos aceptados · 2 con actionText  → 2 de 17 (12%)
rol global        : endpoint 17 / 2 / 12%     ✅ coincide
AREA_MANAGER      : endpoint 5 / 0           ✅ acotado a su subárbol (1 depto)
AM sin depto      : 0 / 0, pct null          ✅ fail-closed, no la cuenta entera
sin accountId     : 401 · EVALUATOR: 403 · sin campaignId: 400
campaña sin plan  : 200 con 0/0, no 404
otra cuenta       : total 0                  ✅ aislamiento multi-tenant
```

### Incidente de build (resuelto, para no repetirlo)

El primer `next build` murió en "Collecting page data" con
`Cannot find module './61682.js'` desde `.next/server/pages/_document.js`. **No
era el código:** el dev server de la otra sesión (PID 5080, puerto 3000) era
dueño de `.next` y reescribía los chunks mientras el build los leía. La pista
está en que `_document.js` es artefacto del **Pages Router** y todo lo tocado
acá es App Router. Se resolvió con el puerto liberado + `.next` borrado.

### Correcciones de diseño de Victor — 2026-08-05, post-revisión en pantalla

H1 se vio funcionando y volvió con tres rondas de corrección. Quedan acá porque
son **reglas de patrón**, no ajustes de esta pantalla: aplican a lo que venga.

**Ronda 1 — el hub es un enrutador, no tres CTAs.**
- Fuera los tres botones "Entrar →". Tres botones convierten un enrutador en tres
  llamados a la acción compitiendo. La tarjeta entera es el destino.
- La barra de progreso se fue del hub. Arriba competía con el enrutamiento y le
  daba protagonismo a una métrica que es de UNA cápsula, no de las tres.
- Fuera el gradiente del relleno: leía como semáforo.

**Ronda 2 — clonar el molde real del sistema, no inventar uno.**
Referencias que dio Victor: las 4 cards de priorización de Tab 1 y las cards de
Diagnóstico/Conversación/Desarrollo de Evaluaciones. **Son la misma pieza:**
`ClimaPathCarousel.tsx:5` declara ser clon de
`src/components/performance/summary/SummaryHub.tsx` ("Las 3 Puertas"), que son
literalmente tres cards en `grid-cols-1 md:grid-cols-3` — el mismo problema que
este hub. Se clonó token por token (`SummaryHub.tsx:87-152`): `motion.button`
`p-6 rounded-2xl bg-[#0F172A]/60 backdrop-blur-md`, `whileHover={{scale:1.02,
y:-4}}`, Tesla line `left-4 right-4` por card, ícono `w-10 h-10 rounded-xl` con
fondo `${color}15`, badge en el color, métrica `text-lg font-bold text-white`.

**Ronda 3 — una portada es una portada.**
`ClimaEfectividadView` tenía la portada y el contenido en un archivo. Se partió en
tres: `ClimaEfectividadPortada` · `ClimaEfectividadHallazgos` (lo que crece con
H2/H3) · `ClimaEfectividadView` (solo enruta). **H2 y H3 escriben en `Hallazgos`;
la portada no se toca.**

**Ronda 4 — la portada es una PANTALLA, no un encabezado.**
En la ronda 3 quedaron apiladas: portada arriba, contenido debajo, misma pantalla.
Mal. El patrón de portada de Clima es una **máquina de estados** donde la portada
se REEMPLAZA:

| Componente | Máquina |
|---|---|
| `ClimaPlanDeptTab.tsx:44` | `'portada' \| 'carrusel' \| 'path'` — monta la portada en `:325` con `onEnter` |
| `ClimaBitacoraView.tsx:118` | `'portada' \| 'focos' \| 'cierre'` |
| `ClimaEfectividadView` (nuevo) | `'portada' \| 'hallazgos'` |

Con eso la portada RECUPERA su `PrimaryButton` (CTA "Ver hallazgos"), que en la
ronda 3 se había quitado por creerla un encabezado. Ahora las tres portadas de
Clima son idénticas también en eso — ya no queda ningún desvío del molde.

⚠️ **Trampa heredada, documentada para H2/H3:** `vista` no se resetea nunca fuera
del `useState` inicial. `ClimaBitacoraView.tsx:154-158` dejó escrito que un
`setVista('portada')` dentro del load devolvía al usuario a la portada de golpe
cada vez que algo re-ejecutaba la carga. Cuando H2 agregue su propio fetch, no
sincronizar `vista` contra los datos.

**Salida:** siempre un nivel arriba, nunca dos. Portada → hub · Hallazgos →
portada. Es la regla de predictibilidad de la skill ("un botón atrás siempre hace
lo mismo").

**⚠️ Al partirla se detectó que la portada se había desalineado de las otras dos
portadas de Clima.** `ClimaPortada.tsx:15` lleva escrito "mismo tratamiento que
ClimaPlanPortada — mantener ambas alineadas", y esta era la tercera. Se realineó
en 4 tokens: `mb-4` (no `mb-6`), `text-3xl` (no `text-2xl md:text-3xl`),
`text-xl` (no `text-lg md:text-xl`), `max-w-3xl` (no `max-w-2xl`), más el `%`
dentro del mismo bloque de 56px. **Las tres portadas de Clima quedan idénticas.**

**Desvíos deliberados de los moldes, con su razón:**

| Desvío | Molde | Por qué |
|---|---|---|
| Estado sin métrica en `text-slate-500` | `SummaryHub.tsx:147` usa `text-amber-400/80` | "Pendiente de medición" no es advertencia: es que no cerró la campaña. En ámbar sería semáforo. |
| `grid`, no carrusel horizontal | — | Son tres y entran. Un carrusel de tres que no se desplaza obligaría a arrastrar en 320px para descubrir la tercera. |
| Portada de Efectividad sin barra ni gradiente en el dato | — | El riel con relleno degradado leía como semáforo. Porcentaje solo, en blanco. |

_(El desvío "portada sin CTA" que figuraba acá quedó ANULADO en la ronda 4: la
portada es una pantalla y recuperó su `PrimaryButton`.)_

`bg-[#0F172A]/60` **no** es el token prohibido de compliance (`/90` +
`backdrop-blur-2xl` + `rounded-[20px]`): es el valor exacto de las dos
referencias que Victor nombró. Corregirlo a otro token daría una tercera variante.

**Cambio de contrato del endpoint:** se agregó `measured` (focos con
`impactMeasured` no null) para que la tarjeta de Efectividad diga "Pendiente de
medición" por dato y no hardcodeado. Verificado contra la base:
terreno `{total:17, withAction:8, measured:0}` = endpoint. Smoke borrado.

### Concurrencia con la otra sesión

Durante H1, la sesión de la Bitácora commiteó `5b30a36` y `7fe7530`. Ambos
tocaron **solo** `ClimaBitacoraView.tsx` y `climaBitacoraContent.ts` — cero
solapamiento con los 8 archivos de H1. El hub monta su componente por contrato
de props, así que el rediseño de esa pantalla y este hub no se pisan.

---

## H2a — Cápsula 3, Estado A · cobertura ✅ SELLADO 2026-08-05

**Commits:** `8fdc922` (endpoint + contrato) · `8478d3a` (copy + UI) · doc aparte.

**Nuevos:** `api/clima/action-log/coverage/route.ts` ·
`components/clima/ClimaProgressRing.tsx` ·
`.../planes/ClimaCoberturaGerencias.tsx`
**Modificados:** `types/clima-hub.ts` · `climaHubContent.ts` ·
`ClimaEfectividadHallazgos.tsx` · `ClimaEfectividadView.tsx` (prop de paso) ·
`ClimaPlanesHub.tsx` (prop de paso)

### Lo construido
Layout 30/70. Izquierda: **pulso de actividad** — días desde `approvedAt`, no el
porcentaje (ver más abajo). Derecha: una **card con anillo por gerencia**, con
drill-down a departamentos, encadenada por un riel a "lo que falta para el
veredicto". La cadencia NO entró: ver H2b.

### 🐛 Bug de scope que encontró el smoke — la razón de exigir numeradores reales
`buildCoverageTree` subía al `parentId` sin comprobar que el padre estuviera
dentro del scope del viewer. Un `AREA_MANAGER` recibía su árbol colgando de un
nodo raíz con el `departmentId` de la gerencia superior — **una unidad que no le
corresponde ver**. Los conteos eran correctos; lo que se filtraba era el
identificador del ancestro.

**Con cobertura 0 esa rama no se ejecuta.** El plan original de este gate era
probar con numerador 0 ("prueba la estructura"); Victor lo rechazó y exigió datos
que cubrieran. El bug apareció en la primera corrida con datos reales. Sin esa
corrección, habría llegado a producción.

→ Regla para H3: **un smoke de agregación con numerador 0 no prueba la
agregación.** Si hace falta fixture, se hace fixture.

### Decisiones de diseño, con su razón
| Qué | Por qué |
|---|---|
| El hero de la izquierda es el TIEMPO, no el % | El % global ya lo dio la portada un clic antes y cada card da el suyo. Los días son lo único que no está en ninguna superficie y que no se puede inferir. Y le dan peso al conteo: "0 de 17" no dice lo mismo a los 2 días que a los 90. |
| Anillo con color FIJO | `SegmentedRing.tsx:18-23` tiene `getProgressColor(pct)` (esmeralda ≥100, cyan ≥60, violeta ≥30) = semáforo. Se clonó su mecánica SVG, no esa función. Tampoco su `getInsightText()` ("Ritmo Constante"), que es opinión sobre un conteo. |
| Sin degradado en el relleno | El gradiente cyan→violeta es la firma de marca (Tesla line). Como relleno de dato se vuelve semántica. |
| `approvedAt` viaja en el DTO | Es un hecho del servidor —cuándo aprobó una persona—, no algo que el navegador deba inferir. |
| Copy sin "pendiente"/"faltante" | Plan §6 literal: "si el jefe no escribe, eso es un dato, no un error". |

### Moldes usados (y los descartados, con su razón)
| Pieza | Molde | Descartado |
|---|---|---|
| 30/70 | reja de `EvaluadorHeatmap.tsx:443` + estructura de `RoleFitDisplayCard.tsx:292` | `compliance/.../DecisionConsole.tsx` (deuda reconocida) y el chrome de `RoleFitDisplayCard` (`bg-[#0F172A]/90 backdrop-blur-2xl rounded-[24px]` = tokens prohibidos) |
| anillo | `evaluator/cinema/SegmentedRing.tsx` | `TeamCoverageGauge` (barra con degradado + ámbar semántico) · `IndicatorGauge` (compliance) |
| filas / drill-down | `UnitRow` de `ClimaDimensionesView.tsx:322` | — |
| panel interior | `ClimaDimensionesView.tsx:279-285` | — |

### Evidencia del smoke — 30/30 contra la base real
Fixture reversible: `responsable_id` de Gerencia Comercial + 2 entradas creadas
vía el **POST real** (no insert directo) en dos departamentos distintos.

```
Gerencia de Tecnología   0/5    0%     ← contraste: no se contamina
Gerencia de Finanzas     0/4    0%
Gerencia Comercial       2/8   25%     ← numerador creado por el smoke
  Atención a Clientes    1/6   17%
  Comercial              1/2   50%

approvedAt = 2026-07-22T11:52:12.779Z  ← dato leído de vuelta, no inferido
AREA_MANAGER: total=2 · raíz="Comercial" (no la gerencia de arriba)
```

⚠️ **El cleanup restaura TRES cosas, no una.** El POST no solo crea la entrada:
pisa el espejo del padre (`actionText`/`registeredAt`/`registeredBy`,
`action-log/route.ts:713-720`). Borrar las entradas dejaría 2 focos marcados como
registrados para siempre — justo el dato que la cápsula mide. Los valores previos
se capturan antes de escribir y se restauran por id en `$transaction`.

---

## H2b — Cápsula 3, Estado A · cadencia ⛔

**Bloqueada por DATO, no por código.** Decisión de Victor: construir la
distribución desde t0 (aprobación) hasta hoy, y recalibrarla contra t1 cuando
exista el Seguimiento Focalizado cerrado, para detectar el "48h antes de la
medición" del plan §2.3.

**No se construyó porque hay 0 filas.** La única fuente de timestamps es
`ClimaActionLogEntry.createdAt`, y escribir una entrada exige resolver
`User.employeeId`, en NULL para toda la base hasta la Etapa 3 del vínculo
Employee↔User. No es poco dato: es ninguno, y no hay camino a tenerlo.

Se retoma en H3, junto con t1.

---

## H3 — Cápsula 3, Estado B ⬜

⛔ **Bloqueado por dato, no por código** — ver divergencia D5.

- [ ] Acto Ancla (delta global + multiplicador + cuadrantes)
- [ ] Motor: Densidad de Entidades
- [ ] Motor: Verbos de Ejecución vs. Intención
- [ ] Motor: Cadencia Temporal (sin LLM)
- [ ] Persistencia de resultados calculados (patrón `ComplianceAnalysis`)
- [ ] Cascada de hallazgos + drill-down con evidencia
- [ ] Regla ética: nombre completo + cargo, nunca juicio sobre la persona
- [ ] Verificación y sello

**Commit(s):** _(pendiente)_

---

## H4 — Motores avanzados ⏸️

Diferido hasta tener volumen (plan §2.3: 200-300 entradas globales).

- [ ] Clustering Semántico con Resultado
- [ ] COM-B Contextualizado
- [ ] Cruces Clima × Performance / Metas / Exit / Onboarding

---

## Archivos PROHIBIDOS en todo el trabajo

Bloqueo operativo (otra sesión activa, instrucción de Victor 2026-08-05):

- `src/app/dashboard/clima/components/bitacora/ClimaBitacoraView.tsx`
- `src/lib/constants/climaBitacoraContent.ts`

Bloqueo del plan maestro §6 y §8.2 (100% aditivo):

- Todo Tab 1: `ClimaPlanDeptTab.tsx` y su árbol
- Todo Tab 2: `ClimaPlanPersonaTab.tsx` y su árbol
- `src/app/api/clima/action-log/route.ts` (sellado Fase A / F1 / F2 / V1)
- `ActionEffectivenessService.ts` · `PulseEngine.ts` ·
  `DepartmentResponsableService.ts` · `ClimaActionLogService.ts`

---

## Divergencias entre el plan maestro y el código real (H0)

| # | Divergencia | Evidencia | Estado |
|---|---|---|---|
| D1 | La Bitácora NO está "en construcción": está cerrada y pusheada | `PLAN_BITACORA_ACCIONES_CLIMA.md:474` · `ClimaBitacoraView.tsx` existe · `climaSubproductos.ts:44` · `ClimaCinemaOrchestrator.tsx:189` | Reportada |
| D2 | `ClimaPlanesView` tiene TRES tabs, no dos. Tab 3 "Seguimiento" ya es la Cápsula 3 en placeholder | `ClimaPlanesView.tsx:25-31` y `:122-128` | ✅ **Resuelta** — ver abajo |
| D3 | La Bitácora ya tiene card propia en el Rail — quedaría accesible por dos puertas | `climaSubproductos.ts:44` | ✅ **Resuelta** — ver abajo |
| D4 | `User.employeeId` en NULL bloquea la Cápsula 2, no la barra de progreso ni el Estado A | `action-log/route.ts:282-286` | Reportada |
| D5 | Estado B no es verificable con datos reales hoy: la campaña de la cuenta demo es Pulso Express | `PENDIENTES_ACTIVOS_EX_CLIMA.md:148-155` | Decisión de Victor |
| D6 | La barra de progreso SÍ coincide con el schema (`actionText`) — sin divergencia | `schema.prisma:4081` | Confirmada OK |

---

### Decisiones de Victor sobre D2 y D3 — 2026-08-05

**D2 → retirar el tab `seguimiento` de `ClimaPlanesView` en H1.** Es una
**excepción explícitamente autorizada** a la regla §8.2 del plan maestro ("no se
modifica ningún archivo existente de Planes"). Alcance exacto y cerrado: sacar
`'seguimiento'` del union `PlanesTab` (`:25`), del array `TABS` (`:30`) y su
rama `FHREmptyState` (`:122-128`). **Nada más de ese archivo se toca** — Tab 1
y Tab 2 quedan intactos. Motivo: una sola puerta a la Cápsula 3 desde el día uno.

**D3 → la Bitácora sale del Rail; el hub es su única entrada.** Se retira la
card de `climaSubproductos.ts` y `'bitacora'` del union `ClimaSubproducto`.
Costo aceptado: el jefe pasa a necesitar 2 clics para llegar a su única
superficie de escritura. `ClimaBitacoraView.tsx` **no se toca** — el hub lo
monta con el mismo contrato de props que ya expone (`campaignId`, `onBack`,
`ClimaBitacoraView.tsx:84-86`).

---

## Bitácora de sesiones

| Fecha | Qué pasó |
|-------|----------|
| 2026-08-05 | Gate 0 (H0) ejecutado. 6 divergencias reportadas. Documento creado. |
| 2026-08-05 | D2 y D3 resueltas por Victor. Hub con 3 cápsulas, Bitácora fuera del Rail, tab 3 retirado (`7a6c771`). Smoke 17/17, tsc y build limpios. |
| 2026-08-05 | Victor revisó en pantalla → 4 rondas de corrección de diseño (`9c5260e`). **H1 SELLADO.** Ninguna fue de lógica: las cuatro eran usar el molde que ya existía en vez de uno propio. tsc y build limpios. Sin pushear. |
| 2026-08-05 | **H2a SELLADO** (`8fdc922`+`8478d3a`). Gate 0 encontró que la cadencia no tiene datos → gate partido en H2a/H2b. El smoke con numeradores reales (exigidos por Victor) destapó un bug de scope que con numerador 0 era invisible. 30/30, tsc y build limpios. Sin pushear. |

---

## Estado de la cuenta de prueba al cerrar H2a

Todo lo que este gate escribió en producción quedó revertido y verificado por
relectura:

- `fixture-review-bitacora.ts` → **REVERTIDO** (ambas filas en NULL).
- Entradas del smoke → **BORRADAS**, y el espejo de sus 2 padres restaurado.
- `departments.responsable_id` de Gerencia Comercial → **NULL**.

Estado real hoy: **0 entradas de bitácora, 0 focos con registro, 17 focos
aprobados en 3 gerencias raíz**. La pantalla de cobertura muestra 0% en las tres,
que es el dato correcto — no un error.

---

## Lección de las 4 rondas — leer antes de arrancar H2

Ninguna de las cuatro correcciones fue un bug ni una decisión de producto. **Las
cuatro fueron la misma:** construir una variante propia teniendo el molde del
sistema a mano.

| Ronda | Lo que hice | Lo que ya existía |
|---|---|---|
| 1 | Tres botones "Entrar" + barra de progreso | El hub es un enrutador; la métrica es de una cápsula |
| 2 | Cards inventadas con hover propio | `SummaryHub.tsx` — las 3 puertas, tres cards en grid |
| 3 | Portada y contenido en un archivo | Portada = componente propio |
| 4 | Portada apilada como encabezado | `'portada' \| ...` — máquina de estados en Tab 1 y Bitácora |

El Gate 0 de `focalizahr-design` pide nombrar el patrón ANTES de escribir. Lo
respondí, pero nombré el molde por su categoría ("portada universal") en vez de
abrir los archivos del propio módulo y leer cómo está resuelto ahí. **Para H2: la
pregunta no es "qué patrón corresponde" sino "quién en Clima ya resolvió esto".**

Los tres moldes verificados de este gate, para no volver a buscarlos:

- **Enrutador de N puertas** → `src/components/performance/summary/SummaryHub.tsx`
  (Tab 1 de Clima ya lo clona: `ClimaPathCarousel.tsx:5`)
- **Portada** → `cascada/ClimaPortada.tsx` = `planes/ClimaPlanPortada.tsx`
  (llevan escrito "mantener ambas alineadas"; ahora son tres)
- **Máquina portada→contenido** → `ClimaPlanDeptTab.tsx:44` · `ClimaBitacoraView.tsx:118`
