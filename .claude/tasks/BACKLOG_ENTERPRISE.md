# FocalizaHR — Backlog Enterprise (prioridades, deudas, bugs, seguridad, oportunidades)

> Compilado 2026-06-26 a partir del mapeo completo de los 14 módulos (ver `.claude/FICHA_PRODUCTOS/`).
> Filosofía: **enterprise del día 1**. No salimos con deuda silenciosa; salimos con deuda *conocida y priorizada*.
> Documento VIVO. Marcar ítems como ✅ al cerrar e indicar commit.

## Progreso
**2026-06-26 — Pasada general RBAC (commit `92df084`):**
- ✅ **P1-6 Benchmark** — gate `benchmark:view` aplicado. ⏳ pendiente verificación runtime por rol antes de deploy (ver `RBAC_AUDIT_LOG.md`).
- ✅ **P1-5 Efficiency** — resuelto por decisión (CEO+liderazgo personas, sin AREA_MANAGER; lista sin cambios, solo documentado + nota para habilitar a futuro).
- ✅ **P2-3 Succession** — debug logs removidos. (El gate de `executive-hub/succession` queda pendiente: ver abajo.)
- ⏸️ **DIFERIDO Onboarding/Exit (P2-1/2)** — acoplados a Comunicaciones en vuelo (Gate D sin pushear). Retomar cuando Comunicaciones cierre.
- ⏸️ **DECISIÓN PENDIENTE Succession `executive-hub/succession`** — el filtrado AREA_MANAGER estándar OCULTARÍA sucesores cross-área. Definir: ¿gerente ve candidatos de toda la empresa? NO aplicar 3 capas sin resolver.
- 🔴 **Metas (P0-1, P1-2)** — sesión especial dedicada, NO tocado.

---

## Modelo de priorización

Cada ítem lleva: **Tipo** · **Esfuerzo** · **Prioridad**.

**Tipo:** 🔒 Seguridad · 🐞 Bug (algo roto) · ⚡ Performance · 🏗️ Deuda arquitectónica · 💡 Oportunidad · 🎨 UX

**Esfuerzo:** S (horas) · M (1-2 días) · L (días/semana) · XL (semanas)

**Prioridad:**
- **P0 — Bloquea go-live o agujero de seguridad.** No se sale a producción sin esto.
- **P1 — Importante antes de vender enterprise.** Feature rota, lentitud notoria, o claim comercial que hoy es falso.
- **P2 — Post-lanzamiento cercano.** Deuda real que no bloquea, pero hay que cerrar.
- **P3 — Oportunidad / roadmap.** Sube el techo del producto, no urge.

### Resumen ejecutivo

| Prioridad | Cantidad | Foco |
|---|---|---|
| **P0** | 4 | Seguridad RBAC Metas + go-live Comunicaciones/Benchmark CRON |
| **P1** | 8 | Performance Torre Control, features rotas, claims comerciales, concurrencia onboarding (CONC-ONB-A) |
| **P2** | 12 | Deuda arquitectónica + consistencia + data quality + concurrencia onboarding (CONC-ONB-B) |
| **P3** | 11 | Oportunidades de producto (vista interna benchmark, histórico evaluador, etc.) + centralizar detección service-token (P3-11) |

> Nota (2026-07-01): el paquete CONC-ONB se contabiliza como **CONC-ONB-A en P1** (vector de seguridad de clase P0, en resolución activa esta sesión) y **CONC-ONB-B en P2** (robustez, con gate de producción). Ambos comparten sección — ver "PAQUETE CONC-ONB" abajo.

> Regla de salida sugerida: **cerrar todos los P0 + los P1 que sostienen el pitch que se va a usar** (acceso filtrado, Torre de Control, flujo de cierre de metas).

---

## Plan de sesiones (orden de ejecución)

> Agregado 2026-07-01. **Secuencia de trabajo, no re-descripción** — el detalle de cada ítem vive en su ficha P0/P1/P2/P3 más abajo.
> Una sesión de Code = un frente acotado. Abrir en Gate 0 (read-only, verificar file:line reales) → plan → implementación quirúrgica → `npm run build` + `npx tsc --noEmit` → commit. Marcar la fila ✅ con su commit al cerrar.

### Ejecutables (sin decisión previa)

| # | Sesión | Cubre | Tipo | Esfuerzo | Estado |
|---|--------|-------|------|----------|--------|
| 1 | **Auditoría RBAC** (1 sola pasada — mismo patrón `hasPermission`) | P0-1, P1-4, P1-6, P2-1, P2-2, P2-3 | 🔒 | S | ⬜ |
| 2 | **CRONs de producción** (`vercel.json`) | P0-2, P0-3 | 🏗️/💡 | S | ⬜ |
| 3 | **Metas: Solicitar Cierre** (1 prop + fetch) | P1-2 | 🐞 | S | ⬜ |
| 4 | **Efficiency L4 + L6** (narrativa Span + umbral seniority) | P1-3, P2-4 | 🐞 | M | ⬜ |
| 5 | **Torre de Control** (refactor `useCampaignMonitor` + derivados) | P1-1 | ⚡ | L | ⬜ |
| 6 | **WhatsApp go-live** (Meta + `TWILIO_MODE=production`) | P0-4 | 🔒 | M | ⬜ · depende de externos (Meta) |
| 7 | **Concurrencia Onboarding** (lock/transacción + `@@unique`, 3 puntos, 1 fix) | CONC-ONB-B | 🏗️ | M | ⬜ · 🚦 gate: antes de escalar Onboarding a múltiples admins concurrentes en prod |

> Nota P2-3: el gate RBAC + remoción de debug logs de Succession entra en la Sesión 1. Lo **cross-área** (¿gerente ve toda la empresa?) es decisión → ver abajo.

### ⏸️ Bloqueadas por decisión de Victor (resolver en chat ANTES de mandar a Code)

| Sesión | Cubre | Decisión pendiente |
|--------|-------|--------------------|
| Efficiency AREA_MANAGER | P1-5 | ¿Se vende "cada gerente ve su Efficiency filtrado"? Si sí → agregar AREA_MANAGER a `efficiency:view`. Si no → documentar como solo C-level. |
| Calibración gobernanza | P1-7 | ¿El pitch promete "calibración con aprobación firmada"? Si sí → schema `approvedBy` + gate (M). Si no → baja a P2. |
| Succession cross-área | P2-3 (gate) | El filtro AREA_MANAGER estándar ocultaría sucesores de otras áreas. ¿Gerente ve candidatos de toda la empresa o solo su scope? No aplicar 3 capas sin resolver. |

> Orden recomendado: **1 → 2 → 3** primero (todo S, cierra el grueso del riesgo de seguridad y los go-live), luego resolver las decisiones ⏸️, luego 4/5 según lo que sostenga el pitch.

---

## P0 — Bloqueadores de go-live / seguridad crítica

### P0-1 · 🔒 Metas: 6 endpoints sin `hasPermission` (S, fix rápido)
**Módulo:** Metas. `src/app/api/goals/`: `alignment-tree`, `employee-score`, `from-pdi`, `link-pdi`, `cascade`, `team/coverage`.
**Qué:** Estos endpoints extraen `userContext` + `accountId` pero NO llaman `hasPermission`. Cualquier rol autenticado de la cuenta accede. `employee-score` acepta `?employeeId` arbitrario → puede exponer score de empleados fuera de scope.
**Fix:** Añadir gate `hasPermission(role,'goals:view'|'goals:create')` + filtrado jerárquico donde aplique (patrón ya presente en `GET /api/goals/route.ts:70-124`). Esfuerzo S, ~20 líneas.
**Por qué P0:** agujero multi-tenant/jerárquico real. Es el riesgo de seguridad más concreto de la plataforma.

### P0-2 · 🏗️/⚡ Comunicaciones: Capa 3 scheduler no cableado en `vercel.json` (S)
**Módulo:** Comunicaciones 3.0. `GET /api/cron/message-dispatcher`.
**Qué:** El dispatcher tiene 3 capas de disparo; la Capa 3 (scheduler externo cada ~5 min) **no está configurada**. Sin ella, los reintentos quedan inertes tras 15 encadenamientos. En prod, mensajes que fallan el primer batch pueden no reintentarse.
**Fix:** Agregar entry a `vercel.json` (`"10 0 * * *"`→ realmente cada 5 min) o cron-job.org/GitHub Actions con `CRON_SECRET`. Esfuerzo S.
**Por qué P0:** entrega de invitaciones/recordatorios no garantizada en producción.

### P0-3 · 💡→🐞 Benchmark: CRON de agregación no cableado en `vercel.json` (S)
**Módulo:** Benchmark. `POST /api/cron/benchmark-aggregation`.
**Qué:** El job mensual está documentado pero comentado; **no corre en prod**. Los benchmarks de mercado no se actualizan → la comparación queda congelada o vacía.
**Fix:** Agregar a `vercel.json` con schedule `10 0 1 * *`. Esfuerzo S.
**Por qué P0:** si se vende "comparación con mercado", hoy no se alimenta sola.

### P0-4 · 🔒 WhatsApp: TWILIO_MODE=simulation + aprobación Meta pendiente (M, depende de externos)
**Módulo:** Comunicaciones 3.0. `whatsapp-service.ts`.
**Qué:** `TWILIO_MODE` default `simulation` (no envía real). Template `survey-escalation` con `contentSid` placeholder (Meta pendiente). Credenciales Twilio prod pendientes.
**Fix:** Aprobar templates en Meta → cargar `contentSid` reales → `TWILIO_MODE=production` + credenciales. Esfuerzo M (gran parte es espera externa de Meta).
**Por qué P0:** WhatsApp es diferenciador anunciado; hoy no envía. **Decisión:** si se sale sin WhatsApp real, comunicarlo como "fase 2" y no prometerlo vivo.

---

## P1 — Importante antes de vender enterprise

### P1-1 · ⚡ Torre de Control lenta — refactor `useCampaignMonitor` + persistir derivados (L)
**Módulo:** Pulso/Experiencia. `src/hooks/useCampaignMonitor.ts` (1.214 líneas).
**Qué:** El hook orquesta 4 sub-hooks y recalcula en cliente momentum, anomalías, topMovers, daysRemaining, cockpitIntelligence en cada render. Es la causa de la lentitud.
**Fix:** (a) mover cálculos pesados a backend / persistir derivados (snapshot por campaña que el CRON o el submit actualiza); (b) partir el hook en piezas memoizadas; (c) servir `analytics` ya agregado. Esfuerzo L.
**Por qué P1:** la Torre de Control es la cara del producto fundacional; lentitud se nota en demo.

### P1-2 · 🐞 Metas: "Solicitar Cierre" roto (S, fix trivial)
**Módulo:** Metas. Botón en `GoalDetailHeader.tsx:168-177` / `GoalCard.tsx:114-124`; página `/dashboard/metas/[id]/page.tsx:106` NO pasa `onRequestClosure`.
**Qué:** El botón aparece a ≥80% pero al click no hace nada (prop undefined). El flujo de cierre (backend completo + UI de "Aprobar" funcional) queda **no consumible end-to-end** porque nadie puede disparar la solicitud.
**Fix:** Pasar el handler `onRequestClosure` desde la página (1 prop + fetch a `/api/goals/[id]/request-closure`). Esfuerzo S.

### P1-3 · 🐞 Efficiency L4: narrativa ↔ datos descableada (M)
**Módulo:** Efficiency. `EfficiencyNarrativeEngine` template L4 + `EfficiencyDataResolver:432`.
**Qué:** El template L4 espera placeholders del modelo Jaccard viejo (`{N_PARES}`, `{OVERLAP}`) pero los datos emiten el modelo Span McKinsey nuevo (`N_MANAGERS`, `DENSIDAD`, `CLP_CAPAS_SUBOPTIMAS`) → placeholders sin reemplazar en UI. La toolbar también referencia `l4.detalle.pairs` que ya no existe.
**Fix:** Reescribir template + variables L4 al esquema Span; corregir referencia toolbar. Esfuerzo M.

### P1-4 · 🔒 POST /api/campaigns sin gate RBAC (S)
**Módulo:** Pulso/Experiencia + Auth. Deuda de migración `verifyJWT()=CLIENT`.
**Qué:** Crear campañas no tiene gate `hasPermission` (porque `verifyJWT().user.role` devuelve CLIENT para sub-usuarios). Hoy mitigado por flujo, pero es un hueco.
**Fix:** Migrar a `extractUserContext` + `hasPermission('campaigns:manage')` (el permiso ya existe en AuthorizationService). Esfuerzo S.

### P1-5 · 🔒 Efficiency: AREA_MANAGER con código de filtro pero sin permiso cableado (S)
**Módulo:** Efficiency. `efficiency:view` NO incluye AREA_MANAGER, pero `diagnostic/route.ts:91-110` tiene la lógica de filtro jerárquico.
**Qué:** Decisión diferida. Si se vende "cada gerente ve su Efficiency filtrado" (capa de estrategia), hoy AREA_MANAGER recibe 403.
**Fix:** Decidir: o se incluye AREA_MANAGER en `efficiency:view` (y se confía en el filtro ya escrito), o se documenta que Efficiency es solo C-level. Esfuerzo S (decisión + 1 línea).
**Liga con producto:** prerequisito del pitch "accountability en cascada".

### P1-6 · 🔒 Benchmark: `GET /api/benchmarks` sin `hasPermission` (S)
**Módulo:** Benchmark. `src/app/api/benchmarks/route.ts`.
**Qué:** Valida `x-account-id` pero no rol. Datos son de mercado anonimizados (riesgo bajo), pero falta el gate por consistencia enterprise.
**Fix:** Agregar `benchmark:view` a PERMISSIONS + gate. Esfuerzo S.

### P1-7 · 🏗️ Calibración sin `approvedBy` / sin gate de aprobación (M)
**Módulo:** Performance/Calibración. `close/route.ts:78-138`; modelo `CalibrationAdjustment` sin campo de aprobador.
**Qué:** Los ajustes PENDING se aplican al cerrar sin firma del que preside. No hay trazabilidad de aprobación. Si el pitch dice "calibración con gobernanza", hoy es falso.
**Fix:** Agregar `approvedBy`/`approvalStatus` al schema + gate antes de aplicar. Esfuerzo M (schema + flujo + UI). **Si NO se vende gobernanza de aprobación → baja a P2.**

---

## PAQUETE CONC-ONB · Concurrencia en OnboardingEnrollmentService (1 paquete, no tickets sueltos)

> Agregado 2026-07-01 tras investigación read-only de race conditions en `OnboardingEnrollmentService.ts` (v3.2.2).
> Se registra AGRUPADO a propósito: los puntos de la parte B comparten causa raíz (check-then-act sin
> lock/transacción) y **se arreglan con una sola solución**. Separarlos arriesga que alguien tape uno y deje
> los otros dos abiertos.
> Verificado en investigación: el batch NO corre en paralelo (`enroll/batch/route.ts:175` es `for...await`,
> `enrollParticipant` en `:208`; cero `Promise.all` en el repo) → el mecanismo "N intentos simultáneos por
> batch" queda **REFUTADO**. El riesgo real es **concurrencia entre requests distintos**, no intra-batch.

### CONC-ONB-A · 🔒 `currentAccountId` estático — cross-tenant (P0/P1) — SE ATACA PRIMERO Y APARTE

**Módulo:** Onboarding + Auth. `OnboardingEnrollmentService.ts`.
**Causa raíz PROPIA (distinta de la parte B):** estado estático de clase, no lock. `private static currentAccountId`
(`:88`) se setea en `:114`, se lee en `getAuthToken()` `:712` varios `await` después, se limpia en `finally` `:320`.
Dos `enrollParticipant` para **cuentas distintas** en el mismo proceso Node se pisan el accountId → una genera
**service token de la cuenta equivocada** (`generateServiceToken` `:720`) → **fuga cross-tenant**; o lee `null` y
lanza `"No accountId available"` (`:715`). Reproducible en `next dev` (proceso único) con 2 requests concurrentes.
`vercel.json` sin bloque `functions`/runtime; en prod con concurrencia por instancia (Fluid Compute) también aplica.
**Fix (propio, NO el de la parte B):** eliminar el estado estático — pasar `accountId` como parámetro a
`getAuthToken(accountId)` / por closure, sin campo compartido. Esfuerzo S.
**Prioridad:** P0/P1 — es el único con vector de seguridad multi-tenant. **No espera a la parte B.**
**Estado:** en evaluación en esta misma sesión (2026-07-01).

### CONC-ONB-B · 🏗️ Check-then-act sin lock/transacción — 3 puntos, 1 SOLO FIX (P1/P2)

**Módulo:** Onboarding. `OnboardingEnrollmentService.ts`.
**Causa raíz COMPARTIDA:** `findFirst → create` sin `$transaction` ni advisory lock, sin `@@unique` que respalde.
Bajo dos requests concurrentes para la MISMA cuenta/persona, ambos leen "no existe" y ambos crean.
Los **3 puntos** (arreglar juntos, no por separado):
1. **Campañas permanentes** — `getOrCreatePermanentCampaigns` `:502` (`findFirst`) → `:514` (`create`). `Campaign`
   sin `@@unique(accountId, campaignTypeId, status)` (`schema.prisma:361-365`, solo índices normales).
2. **Dedup de journey** — `:116` (`findFirst`) → `:273` (`create` JourneyOrchestration). Doble enroll del mismo RUT
   podría crear 2 journeys.
3. **Dedup de Employee pre-nómina** — `upsertPreNominaEmployee` `:348` (`findFirst`) → `:386` (`create`).
   Verificar si `Employee` tiene `@@unique(accountId, nationalId)`; si no, concurrencia → Employees duplicados.
**Estado en BD (dev, 2026-07-01):** **0 duplicados reales dentro de una misma cuenta** (query read-only:
las "2 por slug" de onboarding eran 1-por-cuenta en 2 cuentas distintas). Los `COUNT>1` de pulso/retención son
campañas normales (varias activas del mismo tipo = por diseño). La vulnerabilidad existe pero **no se ha materializado**.
**Fix (uno solo para los 3):** advisory lock de Postgres (`pg_advisory_xact_lock` por `accountId`) o `$transaction`
con reintento sobre violación de unicidad, aplicado a los 3 puntos + agregar los `@@unique` que respalden. Esfuerzo M.
**🚦 Gate explícito (no "algún día"):** **resolver ANTES de escalar Onboarding a múltiples admins concurrentes en
producción.** Mientras el enroll lo opere 1 admin a la vez por cuenta, el riesgo es latente.

---

## P2 — Post-lanzamiento cercano

### P2-1 · 🔒 Onboarding: `journeys/[id]` y `alerts/[id]` con RBAC hardcoded (S)
No usan la matriz `PERMISSIONS`; validan rol inline. Consistencia, no agujero. Migrar a `hasPermission`.

### P2-2 · 🔒 Exit: endpoints de métricas/causas validan rol por código sin permiso en PERMISSIONS (S)
Mismo patrón que P2-1. Centralizar en AuthorizationService.

### P2-3 · 🔒 Succession: `executive-hub/succession` sin `hasPermission` explícito + debug logs (S)
Usa `extractUserContext` sin gate. Además quedan `console.log` temporales en `critical-positions/[id]/route.ts:~88-105` → **REMOVER**.

### P2-4 · 🐞 Efficiency L6 Seniority: umbral que nunca dispara (S)
`detectSeniorityCompression` usa `augmentationShare > 0.6` pero el máximo real Anthropic es ~0.167 → la lente está muerta. Migrar a `focalizaScore > 0.5` (como se hizo en L7).

### P2-5 · 🏗️ Clasificación de talento inconsistente entre productos (L) — *punto de Victor*
Hay 6 taxonomías: 9-box, risk/mobility quadrants, tiers de retención (intocable/valioso/neutro/prescindible), arquetipos de span (McKinsey), perfil evaluador (ÓPTIMA/INDULGENTE/SEVERA/CENTRAL), readiness. No todos los productos hablan el mismo idioma.
**Fix:** definir el vocabulario canónico de talento + propagarlo a todas las superficies (P&L, TAC, Efficiency, Workforce). Esfuerzo L. Sube coherencia percibida por el CEO.

### P2-6 · 🏗️ Department snapshots — falta `PerformanceRating.departmentIdAtCycle` (M)
Reportes COMPLETED agrupan por `departmentId` vivo, no por el del ciclo. Si alguien cambió de depto entre ciclos, el histórico se distorsiona. Agregar campo snapshot. (Ver `.claude/tasks/SEGURIDAD_TRANSFER_DEPARTAMENTOS_PERFORMANCE.md`.)

### P2-7 · 🏗️ Compliance: ActionPlan vs CompliancePlanAction (2 tablas) (M)
Decisión arquitectónica diferida (ver `project_compliance_plan_global_decision`). Resolver antes de escalar planes de acción.

### P2-8 · 🏗️ Compliance: Motor 1 vs Motor 6 orden de casos (S)
Inconsistencia lexicográfico vs severidad A3>A1 (C-3 esperando decisión). Resolver criterio único.

### P2-9 · ⚡ Compliance LLM async — dependencia de CRON (M)
Análisis LLM tiene 45s sync + CRON. Campañas grandes dependen del CRON drenando pendientes. Validar SLA de procesamiento o aumentar paralelismo.

### P2-10 · 🏗️ SLA estático en alertas (Exit/Onboarding/Compliance) (M)
Los `slaHours` son sugeridos, sin timezone/quiet-hours. Si se vende "gestión por SLA", formalizarlo (timezone-aware, escalamiento).

### P2-11 · 💡 Descriptores: ~17 cargos UNCLASSIFIED (S, data quality)
`ANTHROPIC_API_KEY` operativa. Correr `OccupationResolver v3` LLM batch para cerrar la clasificación → habilita exposición IA completa.

---

## P3 — Oportunidades / roadmap

### P3-1 · 💡 Benchmark: vista interna FocalizaHR con todas las comparaciones (M) — *punto de Victor*
Panel admin (FOCALIZAHR_ADMIN) que muestre TODOS los benchmarks de mercado, percentiles, sampleSize/companyCount, cobertura por segmento. Hoy el dato existe en `MarketBenchmark` pero no hay vista agregada para FocalizaHR. Valor: inteligencia de mercado propia + control de calidad de los benchmarks.

### P3-2 · 💡 Benchmark: activar metricTypes stub (M)
`exposure_ia`, `exit_retention_risk`, `nps_score`, `pulse_climate` están como stub. Activar el agregador para cada uno amplía la comparación de mercado a todos los productos.

### P3-3 · 💡 Estilo del evaluador histórico cross-ciclo (L) — alto valor latente
Hoy ÓPTIMA/INDULGENTE/SEVERA/CENTRAL se calcula intra-ciclo (en Performance, Efficiency L4, Goals). Persistir un snapshot por ciclo permite mostrar **deriva del evaluador** (un jefe que se vuelve más indulgente con el tiempo). El motor ya existe y está reutilizado en 3 lugares; falta la capa de persistencia temporal.

### P3-4 · 💡 Plan de acción del calibrador no-jefe (M) — latente
Permitir que un calibrador REVIEWER ingrese una acción/objetivo al plan del calibrado. `ActionPlan.createdBy` ya toma al usuario autenticado; falta `moduleType:'calibration'`/vínculo + wiring desde el cierre.

### P3-5 · 💡 TAC: cross-cycle comparison (M)
Comparar el mapa organizacional ciclo N vs N-1 (movimiento de personas entre cuadrantes, cambio de patrón de gerencia). Mencionado en roadmap, no implementado.

### P3-6 · 💡 Workforce: TabBenchmarks + TabSimulador (placeholders) (M)
2 de las 6 vistas son UI shell sin datos. TabBenchmarks depende de `exposure_ia` benchmark (P3-2). Completar.

### P3-7 · 🎨 Onboarding sin Cinema Mode / narrativas 4C no renderizadas (M)
A diferencia de Exit/TAC/Compliance, Onboarding usa insights panels, no storytelling editorial. Las narrativas 4C (`onboarding-narratives.ts`) existen pero no se renderizan. Oportunidad de subir el nivel narrativo.

### P3-8 · 🎨 Descriptores: RoleCardBento sin resolver visual (M)
El panel carga datos pero el diseño final vs prototipo de Victor está pendiente.

### P3-9 · 🎨 Caso positivo "blindaje" (M)
Las cascadas (P&L, Ambiente Sano) asumen crisis. Falta el tono "blindaje" para organizaciones sanas (qué proteger, no qué arreglar).

### P3-10 · 🏗️ Calibración: PDF de auditoría no encriptado a nivel app (S)
Hoy seguro por encryption-at-rest de Supabase, accesible por URL. Si se vende "documento encriptado", encriptar a nivel app. **Si no se vende ese claim → no hacer.**

### P3-11 · 🏗️ Centralizar detección de `payload.type === 'service'` (M) — deuda de centralización
Hoy la detección/reconocimiento del service token está **hardcodeada localmente**: `campaigns/[id]/participants/upload/route.ts:622-643` (skip del gate de rol humano) y `middleware.ts:192-198` (inyección de `x-account-id`). Hoy hay **un solo** endpoint con este patrón (para `OnboardingEnrollmentService`). Si el patrón de service token se replica a otro flujo/endpoint en el futuro, alguien tendría que **copiar ese mismo `if` a mano** ahí también, en vez de reutilizar algo centralizado.
**Fix:** exponer un helper central (en `AuthorizationService` o el middleware) que resuelva/valide el service token, reutilizable por cualquier endpoint. Es el mismo tipo de deuda que el TODO existente de `AuthorizationService.ts` ya señala para roles humanos, solo que nunca se anotó para el caso de **servicio**.
**No urge:** solo muerde si se replica el patrón. P2/P3 (baja urgencia).

---

## Apéndice — índice por módulo

| Módulo | Ítems |
|---|---|
| **Pulso/Experiencia + Torre Control** | P1-1 (perf hook), P1-4 (RBAC campaigns) |
| **Performance/Calibración** | P1-7 (approvedBy), P2-6 (dept snapshot), P3-3 (estilo evaluador histórico), P3-4 (plan calibrador), P3-10 (PDF cifrado) |
| **Metas** | P0-1 (6 endpoints RBAC), P1-2 (Solicitar Cierre roto) |
| **Sucesión** | P2-3 (RBAC + debug logs) |
| **Workforce** | P3-6 (tabs placeholder), (Descriptores P2-11 lo habilita) |
| **Efficiency** | P1-3 (L4 narrativa), P1-5 (RBAC AREA_MANAGER), P2-4 (L6 umbral) |
| **TAC** | P3-5 (cross-cycle) |
| **P&L Talent** | (cubierto por Performance + clasificación P2-5) |
| **Exit** | P2-2 (RBAC), P2-10 (SLA) |
| **Onboarding** | P2-1 (RBAC), P2-10 (SLA), P3-7 (narrativa), CONC-ONB-A (cross-tenant token), CONC-ONB-B (check-then-act ×3) |
| **Ambiente Sano** | P2-7 (ActionPlan), P2-8 (Motor 1/6), P2-9 (LLM CRON), P2-10 (SLA) |
| **Benchmark** | P0-3 (CRON prod), P1-6 (RBAC), P3-1 (vista interna), P3-2 (metricTypes) |
| **Comunicaciones** | P0-2 (Capa 3), P0-4 (WhatsApp go-live) |
| **Descriptores** | P2-11 (UNCLASSIFIED), P3-8 (RoleCardBento) |
| **Transversal** | P2-5 (clasificación talento), P3-9 (caso positivo) |

---

## Notas de método
- file:line citados provienen del mapeo de las 14 fichas (`.claude/FICHA_PRODUCTOS/`). Confirmar línea exacta al abrir cada fix (el código se mueve).
- Antes de cerrar un ítem de seguridad, verificar el patrón canónico en `GET /api/goals/route.ts` (RBAC 3 capas de referencia) y `AuthorizationService.PERMISSIONS`.
- Los P0 de seguridad (P0-1) y los gates faltantes (P1-4/5/6, P2-1/2/3) comparten el mismo fix de 1 patrón → conviene hacerlos en una sola pasada de "auditoría RBAC".
