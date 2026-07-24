# Punch-list Gate 5D · Tab 2 (por persona) — Doble CTA PDI / Meta

> **Estado: FRENADO.** Nada de Fase 1.2 en adelante se construye hasta OK explícito
> de Victor. La **Decisión 1.a** (abajo) es de Victor, NO resolver por cuenta propia.
> Fuente de diseño: `RESOLUCION_GATE_5D_TAB2_CLIMA_METAS.md` (contrato completo) +
> `SEMILLA_APROBACION_ESCALONADA_GATE_5D.md` (semilla). El paso 0 (ensamblado
> insight→builder) YA está resuelto y vivo (`assembleClimaDecisionInputs.ts` +
> `generate/route.ts:106`); NO es prerrequisito pendiente.

## Avance construido (2026-07-24)

- **2.1 (ruteo por-centro) — HECHO.** `src/lib/services/clima/climaTab2Routing.ts` (puro):
  `routeDepartmentTab2` (ESTADO_B_PDI / ESTADO_A_CHOICE / NONE) + constantes
  `REACTIVE_DOUBLE_BARREL_EXCLUDE` y `REACTIVE_TAB2_COUNT_LOCAL_EXCLUDE` (energia, con la
  regla "2º reactivo → parar y preguntar"). Filtro estricto ANTES de contar; isSystemic
  reusado del builder. Regresión: `prisma/scripts/smoke-tab2-routing.ts`.
- **1.2 (endpoint) — HECHO.** `src/app/api/clima/action-plan/by-person/route.ts` (GET,
  clima:view, multi-tenant + jerárquico AREA_MANAGER, patrón generate/route.ts). Corre
  ensamblado+builder (isSystemic) + `routeDepartmentTab2` por depto, resuelve responsable
  (`resolveDepartmentResponsable`), **gatea el CTA**: `source='account_admin'` →
  `ctaEnabled:false, ctaGatedReason:'SIN_EMPLOYEE_RESPONSABLE'`; `source='responsable'` →
  habilitado. Agrupa por persona; devuelve `stats` (backend). Verificado en data real:
  hoy 100% cae a account_admin → CTA gateado (esperado, 0% responsables). tsc+build limpios.
  - **Nota CHECK 6 (skill):** sin paginación a propósito — es una agregación acotada
    por-campaña (deptos), no una lista abierta; espeja el sibling `generate/route.ts`.

## Verificación previa (hecha 2026-07-24) — NO repetir

`selectedReactive` llega poblado por reactivo sobre data real (cuenta demo
`cmrx7lkg800009ay7zrbwmwac`, Campaña B). Trace de data+código (no visto en pantalla)
vía `prisma/scripts/verify-generate-selectedreactive.ts` (read-only, untracked):
6 deptos → 4 decisiones, 2 con `selectedReactive` (`inversion`, `reconocimiento`),
2 con `null` (ningún reactivo cruzó el piso → celda por defecto; comportamiento correcto).

**Hallazgo que afecta Fase 2:** `ClimaDecisionItem` expone `selectedReactive` (palanca,
una por dimensión) e `isSystemic`, pero NO el conteo de reactivos-bajo-tier que la regla
global `> 3` necesita (`ClimaActionPlanBuilder.ts:151` lo calcula y lo descarta). El
conector de persona debe leer `reactiveAnalysis` directo (patrón `generate/route.ts:86-93`),
no depender solo de `ClimaDecisionItem`.

---

## Fase 1 — Persona (`responsableId`)

| # | Qué | Reusar / file:line | Tipo |
|---|-----|--------------------|------|
| 1.1 | Capa que agrupa hallazgos **por responsable**, no por depto. Cada centro de costo con hallazgo → resolver responsable | `DepartmentResponsableService` (walk-up `parentId`, fallback `Account.adminEmail`) — **SELLADO, no construir** (`ARQUITECTURA_RESPONSABLE_DEPARTAMENTO.md`, `Department.responsableId`) | Mecánico + 1 decisión |
| 1.2 | Leer `reactiveAnalysis` por persona (patrón `generate/route.ts:86-93`), no solo `ClimaDecisionItem` (ver hallazgo arriba) | `generate/route.ts` como molde | Mecánico |

### ✅ DECISIÓN 1.a — RESUELTA (Victor, 2026-07-24): POR-CENTRO

El conteo de reactivos-bajo-tier se hace **por centro de costo** (cada departamento se
evalúa por su cuenta), NO across-centros. Razón: el walk-up a `Account.adminEmail` es
red de seguridad técnica para deptos sin responsable, no liderazgo real; el 0% de
asignación de hoy es diseño deliberado (backfill NULL-only, espera 1ª nómina real).
Contar across convertiría "el admin es fallback de N deptos sin jefe" en "patrón
sistémico" → error de categoría. Con por-centro, el día que existan responsables reales
(`Employee.managerId` + backfill ya construido) la regla ya funciona sin cambios.
Coincide con el texto de `SPEC_UI_META_REACTIVO_v1.md §0:12-14` ("del departamento",
singular).

### 🔴 BLOQUEADOR Fase 3 (+ gating CTA Fase 2) — responsable→Employee (verificado 2026-07-24)

**RESUELTO cómo se maneja en Tab 2 (Victor 2026-07-24): gatear el CTA** cuando no hay
Employee real detrás del responsable resuelto. Solución de corto plazo hasta que exista
la **Etapa 1** del proyecto aparte `ARQUITECTURA_VINCULO_EMPLOYEE_USER_v1.md` (5 etapas,
ninguna arrancada) — el vínculo Employee↔User NO es alcance de Tab 2.

Evidencia que lo motivó (query directo a prod):
- `Account.adminEmail` → Employee **activo**: **0/19** cuentas reales.
- `HR_ADMIN`/`ACCOUNT_OWNER` User → Employee **activo**: **0/19** (11/19 tienen ese User,
  ninguno matchea). **Cambiar el fallback a esos roles NO ayuda.**
- No es "falta de nómina": 4 cuentas tienen 50 empleados activos c/u (Corporación
  Enterprise 50/219, Legado, TOPITO, Test) y **igual 0 match** → estructural: `User`
  (login/RBAC) ≠ `Employee` (nómina). Ningún fallback entre roles de login cierra el gap.
- **Inconsistencia de doc reportada (NO tocada):** `ARQUITECTURA_RESPONSABLE_DEPARTAMENTO`
  §5 proponía fallback HR_ADMIN/ACCOUNT_OWNER; el Addendum implementó `adminEmail` sin
  justificar. Es doc debt — reconciliar por separado; NO desbloquea Tab 2 en ninguna
  dirección. **No tocar `DepartmentResponsableService`** (tiene otros consumidores donde
  adminEmail sí sirve para accountability/notificación; el requisito "Meta necesita
  Employee real" es de Tab 2, no del service).

NO bloquea 1.2/2.1 (conteo por-centro es independiente de quién sea la persona).

### Filtros ANTES de contar (instrucción Victor 2026-07-24) — aplican en 1.2/2.1

- **energia:** excluir PUNTUALMENTE solo del conteo de Tab 2. **NO** agregar a
  `REACTIVE_CIRCULARITY_EXCLUDE` (esa constante se queda intacta) — el rediseño del banco
  podría partirla en 2 preguntas; no sellar exclusión sobre algo que puede cambiar de
  identidad. **REGLA FUTURA: si aparece un 2º reactivo que necesite este trato, PARAR y
  preguntar; con uno solo no amerita frenar.**
- **doble-barril:** excluir `comunicacion_interna, cohesion_equipo, carga_trabajo, seguridad`
  antes de contar (`SPEC_UI §5`). Si el filtro baja el total de >3 a ≤3, el ruteo se
  recalcula DESPUÉS del filtro.
- **circular:** `REACTIVE_CIRCULARITY_EXCLUDE` ya lo aplica el conteo (`SPEC_UI §0:12-14`).
- **Nuance count vs isSystemic:** el CONTEO usa filtro estricto (circular+doble-barril+energia,
  recomputado desde `reactiveAnalysis`); `isSystemic` se REUSA del builder tal cual
  ("ya construido, no tocar" `SPEC_UI §0:26`), que filtra solo circular.

---

## Fase 2 — Ruteo PDI / Meta  (FRENADO hasta cerrar 1.a)

| # | Qué | Reusar / file:line | Tipo |
|---|-----|--------------------|------|
| 2.1 | Regla mandatoria: `total_reactivos_bajo_tier > 3 OR isSystemic → PDI automático`; sino (1-3) → el jefe elige | Cita textual `RESOLUCION_GATE_5D_TAB2:44-58`; `isSystemic` ya en el item | Mecánico (deriva del conteo de 1.2) |
| 2.2 | Estado A: card doble (Meta / PDI) con aviso de límite **inline** | `checkGoalLimit` (cantidad, existe) + `checkGoalWeight` (peso, commiteado `2aabbe2`) — ambos inline en la tarjeta | UI (skill `focalizahr-design`) |
| 2.3 | Rama PDI: entra con foco **dimensión** (degradación honesta) | Gate 5B-i/ii **sellado**; foco-reactivo = incremento aparte, **no bloquea** (`RESOLUCION:104-128`) | Reuso |

---

## Fase 3 — Contrato `CLIMA_TRIGGERED` (rama Meta)  (FRENADO)

| # | Qué | Reusar / file:line | Tipo |
|---|-----|--------------------|------|
| 3.1 | `originType: 'CLIMA_TRIGGERED'` — 3er valor del enum `GoalOriginType` | Verificar `switch(originType)` exhaustivos → TS los marca (`RESOLUCION:288-294`) | Schema + barrido |
| 3.2 | Contrato de creación: `level:INDIVIDUAL`, `employeeId=responsable`, `metricType:NUMBER`, `startValue=mean`, `targetValue=mean+delta`, `weight:100/N` | `validateTotalWeight`/`checkGoalWeight` ya cubren peso (`RESOLUCION:191-215`); solo `kpiSource:OWN` (`:152-158`) | Mecánico |
| 3.3 | Constante `CLIMA_GOAL_TARGET_MIN_DELTA=0.2` (propia, no reusar `REACTIVE_MOMENTUM_MIN_DELTA`) | `RESOLUCION:279-284` | Const nueva |
| 3.4 | `sourceReferenceId` → ActionPlan **aprobado** (nunca borrador); walk-up `parentPlanId` | `RESOLUCION:296-320` | Mecánico + regla dura |
| 3.5 | Idempotencia: unique `(accountId, employeeId, sourceReferenceId)` + catch P2002 → `GoalDuplicateError` vía `goalsErrorResponse.ts` | `RESOLUCION:329-353` | Schema + servicio |
| 3.6 | Presentación % de avance (no mean crudo): `"68% · Vas bien"` + referencia técnica chica | `calculateProgress` (existe, `GoalMetricType.NUMBER`) — no construir | Reuso + UI |
| VERIF 3.a | Grep fresco del string exacto `'Cultura y Personas'`/`'Clima'` contra la BD antes de usarlo | `RESOLUCION:362-365` | Verificación |

---

## Orden de dependencia

1.2 alimenta 2.1 (el conteo); Fase 2 cierra antes de Fase 3 (la rama Meta solo se construye
para el caso no-sistémico + elección). **Fase 3.5 (unique constraint) toca schema en la BD
única de producción → requiere OK explícito de Victor antes de `db push`.**

**Bloqueadores activos:** (1) Decisión 1.a de Victor. (2) OK de Victor para arrancar 1.2+.
