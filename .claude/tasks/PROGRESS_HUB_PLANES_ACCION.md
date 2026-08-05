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
| H1 | Hub con las 3 cápsulas | ✅ | `7a6c771` |
| H2 | Cápsula 3 — Estado A (pre-resultados, sin LLM) | ⬜ | |
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

## H1 — Hub con las 3 cápsulas ✅ SELLADO 2026-08-05 · `7a6c771`

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

### Concurrencia con la otra sesión

Durante H1, la sesión de la Bitácora commiteó `5b30a36` y `7fe7530`. Ambos
tocaron **solo** `ClimaBitacoraView.tsx` y `climaBitacoraContent.ts` — cero
solapamiento con los 8 archivos de H1. El hub monta su componente por contrato
de props, así que el rediseño de esa pantalla y este hub no se pisan.

---

## H2 — Cápsula 3, Estado A ⬜

Pre-resultados. Funciona ANTES del Seguimiento Focalizado. Sin LLM, sin deltas.

### H2.1 — Backend ⬜
- [ ] Endpoint nuevo de actividad (cobertura por gerencia + cadencia)
- [ ] Cadencia = timestamps de `ClimaActionLogEntry.createdAt`, sin LLM
- [ ] Skill `focalizahr-api`

### H2.2 — UI Estado A ⬜
- [ ] Skills `focalizahr-design` + `focalizahr-narrativas`
- [ ] Estado vacío neutro, sin interpretar la ausencia (plan §2.5)

### H2.3 — Verificación y sello ⬜
- [ ] Smoke con evidencia real · tsc · build · smoke borrado · commits

**Commit(s):** _(pendiente)_

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
| 2026-08-05 | D2 y D3 resueltas por Victor. **H1 sellado** (`7a6c771`): hub con 3 cápsulas, barra de progreso, Bitácora fuera del Rail, tab 3 retirado. Smoke 17/17, tsc y build limpios. Sin pushear. |
