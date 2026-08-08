# PROGRESS — Autorreporte del jefe (cierre circuito 5C)

> Bitácora viva. Spec fuente VIGENTE: `SPEC_ATACAR_CAUSA_TAB2_v2.md`
> (reemplaza a `SPEC_CLIMA_AUTORREPORTE_JEFE_v1.md`; el campo va en Tab 2, no Tab 1).
> No pushear — Victor pushea.

## Gate v2 — "Atacar la causa" (Tab 2) — EN CURSO
- **V1** `GET /api/clima/action-log` → ✅ **SELLADO** (2026-08-01). Se agregó el GET
  al route existente (POST de Fase A intacto) + tipos nuevos `src/types/clima-atacar-causa.ts`.
  - Modo lista `?planId&departmentId`: plan aprobado acotado al depto (solo aceptar/modificar,
    rechazar/pospuesto y otros deptos fuera) + logs unidos por `triggerRef`; `canWrite` resuelto
    en server (responsable === viewer, false si `employeeId` null). Modo entradas `?logId&limit&offset`.
  - **Guard de lectura INVERTIDO** (decisión de Victor): global (`GLOBAL_ACCESS_ROLES` =
    FOCALIZAHR_ADMIN/ACCOUNT_OWNER/HR_ADMIN/HR_MANAGER/HR_OPERATOR/CEO, `permissions.ts:820-827`)
    sin restricción; TODO el resto acotado a {propio ∪ hijos}, fail-closed sin departmentId propio.
    Cierra la fuga tipo `GET /api/goals`. NO depende de `/api/action-plans` (su fail-open queda como está).
  - Smoke real 20/20 (filtrado, unión, canWrite, guard incl. G4 cross-depto, paginación, 404,
    borrador→vacío) + re-lectura post-cleanup por id en cero **incluido el ActionPlan**. Smoke borrado al sellar.
- **V2** vista `ClimaAtacarCausaScreen.tsx` (abre desde `ClimaPlanPersonaTab`, quitar gate `:194`) → PENDIENTE (skills design/narrativas/notificaciones antes; visto en pantalla por Victor).
- **V3** `action_url` del correo (`ClimaActionLogService.ts:141-157`) → PENDIENTE.

## Estado por fase (histórico)
- **Fase A** — P1 (modelo) + P2 (endpoint) + P3 (permiso) → ✅ **SELLADA** (commits
  `d7e7749` código + `16d039b` doc + `284297f` fix voseo). No toca ninguna pantalla.
- **Fase B** — filtrado + GET + campo en la card de **Tab 1** → ❌ **REVERTIDA 2026-08-01.**
- **Fase C / D** — pendientes.

---

## ⛔ Fase B REVERTIDA (2026-08-01) — LEER ANTES DE RETOMAR

**Decisión de producto (Victor):** el campo de autorreporte **NO va en Tab 1**.
**Va en Tab 2.** Cualquier sesión futura que retome esto **arranca desde Tab 2**,
no desde la card de decisión de Tab 1 (`ClimaDecisionCard`). No volver a proponer
Tab 1 — ya se construyó, se probó y se descartó.

**Qué se revirtió** (volvió a estado pre-Fase-B, `git checkout HEAD`):
`ClimaDecisionCard.tsx`, `ClimaPathWorkspace.tsx`, `ClimaPlanDeptTab.tsx`,
`ClimaCaseReview.tsx`, `action-plans/route.ts`, `action-plans/[planId]/route.ts`,
`clima/action-log/route.ts` (le quedó SOLO el POST de Fase A), `clima-planes.ts`.
Borrados: `ClimaAutorreporteBlock.tsx`, `climaDeptScope.ts`, y los 2 scripts smoke/fixture.

**DB restaurada:** el fixture demo se limpió — entradas de prueba en cero,
`User(admin@corporacionenterprise.cl).employeeId` de vuelta a `null`.

**Lo que SÍ queda vigente de Fase A** (no se tocó): la tabla `ClimaActionLogEntry`,
el permiso `clima:action-log:write`, y `POST /api/clima/action-log` con su guard de
propiedad. El circuito de ESCRITURA existe; falta la superficie de UI (ahora en Tab 2).

**El backlog dice la verdad** (commit `fffd4a3` revirtió la nota falsa `b7a2017`):
los tres fail-open del mismo patrón siguen ABIERTOS — goals, clima, compliance
(`SEC-ACTIONPLAN-DECISIONES`). El filtrado jerárquico de `/api/action-plans` NO se
aplicó (era parte de Fase B). Si Tab 2 lee decisiones por departamento, ese filtro
vuelve a hacer falta.

### Hechos útiles descubiertos (para el intento en Tab 2)
- Los endpoints genéricos `GET /api/action-plans` y `/[planId]` **no filtran** el JSON
  `decisiones` por departamento (`route.ts:80-93`, `[planId]/route.ts:56-74`). Patrón
  fail-closed a clonar si hace falta: `clima/action-plan/generate/route.ts:72-93`.
- `employeeId` viaja `User.employeeId` → JWT (`login/route.ts:142`) → header
  (`middleware.ts:215`) → `extractUserContext`. **0 de 12 usuarios del test account
  tienen `employeeId` poblado** (backfill del vínculo diferido a nómina real): con login
  normal, `canWrite`/guard de propiedad siempre da false. Sin ese backfill no hay demo
  de escritura real sin tocar `User.employeeId` a mano (write reversible, con cuidado).
- Card de decisión de Tab 1 = `ClimaDecisionCard.tsx` (por si sirve de referencia visual;
  NO es donde va el campo).

---

## Fase A — checklist ✅ (SELLADA, sin cambios)

- [x] P1 — `model ClimaActionLogEntry` + back-reference en `ClimaActionLog`. `db push` aplicado.
- [x] P3 — `'clima:action-log:write'` en `permissions.ts`.
- [x] P2 — `POST /api/clima/action-log` (guard de propiedad + espejo del padre en `$transaction`).
- [x] Smoke 22/22 (borrado al sellar) · `tsc` 0 · `next build` ✓ · commits código+doc.

### Corrección de spec aplicada (vigente)
- **§P2-6:** el espejo del padre refleja la entrada más reciente COMPLETA →
  `registeredBy = userContext.employeeId` junto con `actionText` + `registeredAt`.

---

## Confirmaciones Gate 0 (vigentes)
- **`extractUserContext` devuelve `employeeId`** → SÍ (Etapa 1 vínculo, `c1e08e6`).

## Deuda anotada (NO arreglar en este gate)
- **Skill `focalizahr-api` §Vínculo desactualizada:** dice "Etapa 1 no iniciada", pero
  el código muestra Etapa 1 SELLADA (`c1e08e6`). Corregir en su propio momento.
- **Voseo en `ClimaPlanDeptTab.humanError`** (flujo de decisiones 5D, no autorreporte):
  ya está registrado en el backlog (deuda de idioma 2026-07-27). No es de este gate.
