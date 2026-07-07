# FocalizaHR — Backlog Enterprise (prioridades, deudas, bugs, seguridad, oportunidades)

> Compilado 2026-06-26 a partir del mapeo completo de los 14 módulos (ver `.claude/FICHA_PRODUCTOS/`).
> Filosofía: **enterprise del día 1**. No salimos con deuda silenciosa; salimos con deuda *conocida y priorizada*.
> Documento VIVO. Marcar ítems como ✅ al cerrar e indicar commit.

## Progreso
**2026-06-26 — Pasada general RBAC (commit `92df084`):**
- ✅ **P1-6 Benchmark** — gate `benchmark:view` aplicado. ⏳ pendiente verificación runtime por rol antes de deploy (ver `RBAC_AUDIT_LOG.md`).
- ✅ **P1-5 Efficiency** — resuelto por decisión (CEO+liderazgo personas, sin AREA_MANAGER; lista sin cambios, solo documentado + nota para habilitar a futuro).
- ✅ **P2-3 Succession** — debug logs removidos. (El gate de `executive-hub/succession` queda pendiente: ver abajo.)
- ⏸️ **DIFERIDO Onboarding/Exit (P2-1/2)** — acoplados a Comunicaciones en vuelo (Gate D sin pushear). Retomar cuando Comunicaciones cierre. *(Nota 2026-07-06: Comunicaciones YA cerró — Gate D y proyecto Envío 4/4 pusheados → P2-1/2 retomables.)*
- ⏸️ **DECISIÓN PENDIENTE Succession `executive-hub/succession`** — el filtrado AREA_MANAGER estándar OCULTARÍA sucesores cross-área. Definir: ¿gerente ve candidatos de toda la empresa? NO aplicar 3 capas sin resolver.
- 🔴 **Metas (P0-1, P1-2)** — sesión especial dedicada. → **actualizado abajo (2026-07-05).**

**2026-07-05 — Frente RBAC Metas (commits en `main`, ya pusheados — verificado contra origin 2026-07-06):**
- ✅ **P1-2 Solicitar Cierre** — cableado end-to-end (`380130f`). CERRADO.
- ⏳ **P0-1 PARCIAL** — `alignment-tree` gateado (`8bd8d6c`); quedan **5** endpoints (employee-score, from-pdi, link-pdi, cascade, team/coverage). Decisión Arq. **"ruta = contexto"** (sin scope departamental; `/estrategia`=cuenta completa, `AREA_MANAGER` usa `/equipo`). ⚠️ `employee-score` (snapshot mensual) requiere la misma decisión de contexto, no copiar ciego.
- 🕳️ **Deuda latente:** `GoalsService.getPendingClosures:822-839` sin scope depto (huérfano hoy; no cablear a superficies scoped sin filtro).
- Investigación completa: `.claude/tasks/GATE_F_METAS_COMUNICACIONES_HALLAZGOS.md` (local, gitignored).

**2026-07-06 — Reconciliación backlog vs. git (auditoría read-only, sin fixes):**
- ✅ **CONC-ONB-A** — cerrado por `7bf30db` (2026-07-01, pusheado): `currentAccountId` estático eliminado, grep hoy = 0 matches. Runtime-confirmado bajo concurrencia (4 escenarios, 9/9 asserts).
- ✅ **P2-12** — cerrado por rediseño Gate 3 Arquitectura Envío (`dd44bf2` + `026c808`, 2026-07-03): send-reports ya no envía directo, encola en la cola unificada. Ver ficha.
- ⏳ **P0-1 sin cambios** — los 5 endpoints pendientes siguen con `extractUserContext` sin `hasPermission` (verificado por grep uno a uno).

**2026-07-06 — Fix NPS rating=0 en submit (sellado `a98b626` + `10e9dbc`):** ambas rutas de submit trataban `rating: 0` como falsy → se perdía el detractor más extremo de NPS (Onboarding además rechazaba el submit completo con 400). Guard nuevo `rating >= (question.minValue ?? 1)` en estándar + onboarding; smoke 3/3 PASS; **histórico confiable** (0 filas huérfanas nps_scale, 22 NPSInsight sin contaminación — sin recálculo ni disclaimer). As-built en `Sistema_NPS_FocalizaHR_IMPLEMENTACION.md`. El barrido del mismo patrón en código legacy quedó como **P3-13** (nuevo, abajo).
- **P0-2/P0-3 siguen abiertos** — `vercel.json` hoy tiene 5 crons (send-reminders, aggregation=onboarding, send-reports, send-calibration-emails, goals-aggregation) pero **sigue sin** `message-dispatcher` ni `benchmark-aggregation`. P0-2 pesa MÁS que al escribirse: Gate 3 colgó los reportes de desempeño de esa misma cola.
- **P1-4 sin cambios de fondo** (ver diagnóstico `dd54b83` agregado en la ficha); la instancia concreta de calibración quedó mitigada por `0ce7fea`.
- **SEC-TEST / SEC-EMAIL siguen tal cual** — los 4 endpoints huérfanos existen, grep RBAC = 0 en todos. Nota: Gate 1a (`a3cf371`) tocó los de email solo en transporte (`sendEmail()`), el hueco RBAC es el mismo.
- **P2-13 sin cambios** — `goals:config` sigue sin HR_MANAGER/CEO.

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
| **P1** | 8 (2 ✅) | Performance Torre Control, features rotas, claims comerciales; cerrados: P1-2 ✅ `380130f` + CONC-ONB-A ✅ `7bf30db` |
| **P2** | 14 (1 ✅) | Deuda arquitectónica + consistencia + data quality + concurrencia onboarding (CONC-ONB-B) + confiabilidad send-reports (P2-12 ✅ `dd44bf2`) + UX/permiso Metas (P2-13) |
| **P3** | 13 | Oportunidades de producto (vista interna benchmark, histórico evaluador, etc.) + centralizar detección service-token (P3-11) + PDF calibración inexacto (P3-12) + limpieza legacy patrón rating falsy (P3-13) |

> Nota (2026-07-01): el paquete CONC-ONB se contabiliza como **CONC-ONB-A en P1** (vector de seguridad de clase P0, ✅ cerrado `7bf30db`) y **CONC-ONB-B en P2** (robustez, con gate de producción). Ambos comparten sección — ver "PAQUETE CONC-ONB" abajo.

> Regla de salida sugerida: **cerrar todos los P0 + los P1 que sostienen el pitch que se va a usar** (acceso filtrado, Torre de Control, flujo de cierre de metas).

---

## Plan de sesiones (orden de ejecución)

> Agregado 2026-07-01. **Secuencia de trabajo, no re-descripción** — el detalle de cada ítem vive en su ficha P0/P1/P2/P3 más abajo.
> Una sesión de Code = un frente acotado. Abrir en Gate 0 (read-only, verificar file:line reales) → plan → implementación quirúrgica → `npm run build` + `npx tsc --noEmit` → commit. Marcar la fila ✅ con su commit al cerrar.

### Ejecutables (sin decisión previa)

| # | Sesión | Cubre | Tipo | Esfuerzo | Estado |
|---|--------|-------|------|----------|--------|
| 1 | **Auditoría RBAC** (1 sola pasada — mismo patrón `hasPermission`) | P0-1, P1-4, P1-6, P2-1, P2-2, P2-3 | 🔒 | S | ⬜ |
| 2 | **CRONs de producción** (`vercel.json`) | P0-2, P0-3 | 🏗️/💡 | S | ⬜ · nota 2026-07-06: send-reports/send-calibration-emails/goals-aggregation ya agendados por otros frentes (`dd44bf2`/`81502e4`/`2dd0fcf`); faltan SOLO `message-dispatcher` y `benchmark-aggregation` |
| 3 | **Metas: Solicitar Cierre** (1 prop + fetch) | P1-2 | 🐞 | S | ✅ `380130f` |
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

## Hallazgos sin triage — pendientes de decisión de Arquitectura

> Encontrados en barrido de higiene de seguridad. Reportados **SIN fix y SIN prioridad asignada** — Arquitectura decide qué hacer (mismo proceso que debió seguirse con la ruta `_ELIMINAR` desde el principio).

### 🆕 SEC-TEST · Endpoints de test huérfanos sin RBAC — PENDIENTE DECISIÓN ARQUITECTURA
**Estado:** 🆕 pendiente de decisión (NO resuelto, NO en curso). Descubierto 2026-07-01, adyacente al cierre de `_ELIMINAR` (`635d67c`).
- **`src/app/api/test/participants/route.ts`** — `GET` ruteable, **sin RBAC ni accountId**. Consulta `prisma.campaign.findFirst({ where:{status:'draft'}, include:{account:true} })` (`:18`) → **fuga cross-tenant de lectura**: devuelve la primera campaña draft de *cualquier* cuenta + su `account` completo (`:72-76`). Autenticado-only (middleware exige JWT), read-only (el insert mock `:50-60` no se persiste), expone stack traces (`:93`). **Huérfano** (0 referencias; `grep 'api/test'` solo su cabecera). Misma clase que `_ELIMINAR`, alcance más chico.
- **`src/app/api/test/route.ts`** — `GET` ruteable, sin RBAC, pero **no toca datos** (solo `generateUniqueToken`); leak menor de stack trace (`:56`). Huérfano.
- **Páginas UI dev** (menor prioridad, no exponen datos por sí solas): `dashboard/DD_PREV`, `dashboard/pruebas`, `dashboard/succession-demo`, `dashboard/test-exit-metrics` (auth-gated); `src/app/test`, `src/app/test-analytics` (raíz, **sin auth**).
- **Nota:** el patrón de sufijo de desactivación (`_ELIMINAR/_OLD/_DEPRECATED/…`) quedó **limpio** (0 carpetas). Esto es categoría adyacente: endpoints dev/test huérfanos.

### 🆕 SEC-EMAIL · Endpoints de email huérfanos sin RBAC — PENDIENTE DECISIÓN ARQUITECTURA
**Estado:** 🆕 pendiente de decisión (NO resuelto, NO en curso). Descubierto 2026-07-02 en el mapeo read-only de integridad de envíos (ver `.claude/tasks/MAPA_INTEGRIDAD_ENVIOS_EMAIL.md` §7). Misma clase que SEC-TEST: reportado **sin fix y sin prioridad** — Arquitectura decide.
- **`src/app/api/admin/notifications/route.ts`** — `POST` ruteable (`:204`) **sin `extractUserContext`/`hasPermission`/`accountId`**. El destinatario `recipientEmail` viene **del body, controlado por el caller** (`:207→:183`); el `campaign.findUnique` (`:225`) es **global sin `accountId` → lectura cross-tenant** de `account.companyName`/`adminEmail` (aunque `adminEmail` se fetchea y se descarta). Además marca `success:true` aun con `error` de Resend (`:188`). **Huérfano** (0 callers vivos; el `campaign_activated` de `activate:423` es un AuditLog no relacionado). Es el de mayor peligro potencial aunque hoy no lo invoque nadie.
- **`src/app/api/admin/campaigns/[id]/email-automation/route.ts`** — `POST` (`:36`) **sin RBAC**. Dispara `EmailAutomationService` (código **muerto/mock**: envía solo a `test@example.com` hardcoded, `email-automation.ts:194-203`; guard dev/no-key `:238-245`). Cadena de trigger (`useEmailAutomation` hook) **sin consumidor** (grep 0 usos). Riesgo residual solo teórico: POST manual en prod-con-key → 1 mail al mock.
- **Nota:** ninguno de los dos es el riel real de invitaciones (ese es la cola unificada en `campaigns/[id]/activate`). Son remanentes legacy sin caller vivo.

### 🆕 SEC-USER-OFFBOARDING · `User` (login) desacoplado de `Employee` (baja) — PENDIENTE DECISIÓN ARQUITECTURA
**Estado:** 🆕 pendiente de decisión (NO resuelto, NO en curso). Descubierto 2026-07-02 (revisión read-only de correlación User↔Employee). Reportado **sin fix y sin prioridad** — Arquitectura decide.
**Riesgo:** acceso retenido tras la baja (*orphaned account*) — un colaborador dado de baja puede conservar login activo.
- **Sin correlación formal:** `model User` (`schema.prisma:799-819`) NO tiene `employeeId` ni relación a `Employee`; ningún modelo ata User↔Employee. Puente solo informal por `accountId`/`email` (`Employee.email` opcional, sin FK).
- **Desactivación existe pero es 100% manual:** `admin/users/[id]` DELETE → soft-delete `isActive:false` (`:268`) + AuditLog `USER_DEACTIVATED`. Login enforce estado (`auth/user/login/route.ts:111` → 401 si `!isActive`). ✅
- **Ningún proceso de baja lo dispara:** `EmployeeSyncService` marca al **Employee** `isActive:false` al salir de nómina (`:1315/:1379`) pero **no toca `users`**; `ExitRegistrationService` **no escribe `users`**. Las 5 ops `prisma.user.*` del repo son login+admin, ninguna en offboarding. ⇒ Employee INACTIVE / Exit registrado → el `User` sigue `isActive:true` salvo baja manual.
- **Ventana ampliada:** el middleware valida el JWT solo con decode+`exp` (`middleware.ts:18-38`), NO re-chequea `User.isActive` en BD → token ya emitido sigue vivo hasta expirar aun tras desactivar.
- **Alcance:** solo roles con login (ACCOUNT_OWNER/HR/CEO/AREA_MANAGER/EVALUATOR); participantes de encuesta usan `uniqueToken` (sin cuenta). No es hueco abierto: dependencia frágil en disciplina manual (agravada por Ley 21.719).
- **Decisión de fondo (arquitectónica, no parche):** correlación formal `User↔Employee` o hook de offboarding que al marcar Employee INACTIVE / registrar Exit desactive el `User` correspondiente.

---

## P0 — Bloqueadores de go-live / seguridad crítica

### P0-1 · 🔒 Metas: endpoints sin `hasPermission` — ⏳ PARCIAL (1/6, quedan 5)
**Módulo:** Metas. `src/app/api/goals/`. ✅ **`alignment-tree` gateado** (commit `8bd8d6c`, pusheado): `hasPermission('goals:view')` + `GLOBAL_ACCESS_ROLES`, patrón calcado de `alignment-report`/`orphans`. **PENDIENTES (5):** `employee-score`, `from-pdi`, `link-pdi`, `cascade`, `team/coverage`.
**Qué:** Estos endpoints extraen `userContext` + `accountId` pero NO llaman `hasPermission`. Cualquier rol autenticado de la cuenta accede. `employee-score` acepta `?employeeId` arbitrario → puede exponer score de empleados fuera de scope.
**Decisión de Arquitectura (aplicada en `alignment-tree`, replicar en los 5):** "la ruta determina el contexto" → **sin scope departamental** en el gate. `/estrategia` = vista del estratega (ve toda la cuenta); `AREA_MANAGER` usa `/equipo`, scoped por `managerId`. Por eso el fix es `hasPermission` + `GLOBAL_ACCESS_ROLES`, NO filtrado jerárquico en estos endpoints.
**⚠️ Ojo `employee-score`:** se usará para el snapshot mensual de metas → requiere la MISMA decisión de contexto que `alignment-tree`; no copiar ciegamente el patrón.
**Fix (los 5 pendientes):** gate `hasPermission(role,'goals:view'|'goals:create')` con el principio "ruta = contexto". Esfuerzo S.
**Por qué P0:** agujero multi-tenant real. **NO tachar hasta cerrar los 5.**
**Deuda latente relacionada (Metas):** `GoalsService.getPendingClosures` (`GoalsService.ts:822-839`) NO tiene scope departamental. Huérfano hoy (el endpoint `pending-closure` usa su propia query scoped, `:45-63`). Trampa: si alguien lo cablea al endpoint de aprobaciones, un `AREA_MANAGER` vería solicitudes de toda la cuenta (fuga cross-depto invisible al build). NO usar en superficies scoped sin agregarle el filtro.

### P0-2 · 🏗️/⚡ Comunicaciones: Capa 3 scheduler no cableado en `vercel.json` (S)
**Módulo:** Comunicaciones 3.0. `GET /api/cron/message-dispatcher`.
**Qué:** El dispatcher tiene 3 capas de disparo; la Capa 3 (scheduler externo cada ~5 min) **no está configurada**. Sin ella, los reintentos quedan inertes tras 15 encadenamientos. En prod, mensajes que fallan el primer batch pueden no reintentarse.
**Fix:** Agregar entry a `vercel.json` (`"10 0 * * *"`→ realmente cada 5 min) o cron-job.org/GitHub Actions con `CRON_SECRET`. Esfuerzo S.
**Por qué P0:** entrega de invitaciones/recordatorios no garantizada en producción.
**Verificado 2026-07-06:** sigue ausente de `vercel.json` (hoy 5 crons, ninguno es el dispatcher). **Agravado:** desde Gate 3 (`dd44bf2`) los reportes individuales de desempeño también dependen de esta cola → sin Capa 3, su re-drive tampoco está garantizado.

### P0-3 · 💡→🐞 Benchmark: CRON de agregación no cableado en `vercel.json` (S)
**Módulo:** Benchmark. `POST /api/cron/benchmark-aggregation`.
**Qué:** El job mensual está documentado pero comentado; **no corre en prod**. Los benchmarks de mercado no se actualizan → la comparación queda congelada o vacía.
**Fix:** Agregar a `vercel.json` con schedule `10 0 1 * *`. Esfuerzo S.
**Por qué P0:** si se vende "comparación con mercado", hoy no se alimenta sola.
**Verificado 2026-07-06:** sigue sin agendar. Ojo: el entry `/api/cron/aggregation` de `vercel.json` es la agregación de **onboarding**, NO benchmark — no confundir al cablear.

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

### P1-2 · ✅ CERRADO — 🐞 Metas: "Solicitar Cierre" roto (S, fix trivial)
**Módulo:** Metas. Botón en `GoalDetailHeader.tsx:168-177` / `GoalCard.tsx:114-124`; página `/dashboard/metas/[id]/page.tsx:106` NO pasa `onRequestClosure`.
**Qué:** El botón aparece a ≥80% pero al click no hace nada (prop undefined). El flujo de cierre (backend completo + UI de "Aprobar" funcional) queda **no consumible end-to-end** porque nadie puede disparar la solicitud.
**Fix:** Pasar el handler `onRequestClosure` desde la página (1 prop + fetch a `/api/goals/[id]/request-closure`). Esfuerzo S.
**✅ CERRADO** (2026-07-05, commit `380130f`, pusheado): `onRequestClosure` pasado desde `metas/[id]/page.tsx` + nuevo `requestClosure` en `useGoalDetail` (calcado de `checkIn`) + feedback vía toast-system con manejo de 403.

### P1-3 · 🐞 Efficiency L4: narrativa ↔ datos descableada (M)
**Módulo:** Efficiency. `EfficiencyNarrativeEngine` template L4 + `EfficiencyDataResolver:432`.
**Qué:** El template L4 espera placeholders del modelo Jaccard viejo (`{N_PARES}`, `{OVERLAP}`) pero los datos emiten el modelo Span McKinsey nuevo (`N_MANAGERS`, `DENSIDAD`, `CLP_CAPAS_SUBOPTIMAS`) → placeholders sin reemplazar en UI. La toolbar también referencia `l4.detalle.pairs` que ya no existe.
**Fix:** Reescribir template + variables L4 al esquema Span; corregir referencia toolbar. Esfuerzo M.

### P1-4 · 🔒 POST /api/campaigns sin gate RBAC (S)
**Módulo:** Pulso/Experiencia + Auth. Deuda de migración `verifyJWT()=CLIENT`.
**Qué:** Crear campañas no tiene gate `hasPermission` (porque `verifyJWT().user.role` devuelve CLIENT para sub-usuarios). Hoy mitigado por flujo, pero es un hueco.
**Fix:** Migrar a `extractUserContext` + `hasPermission('campaigns:manage')` (el permiso ya existe en AuthorizationService). Esfuerzo S.

**🆕 Instancia concreta (2026-07-02) — bloquea smoke Gate 1a (proyecto Arquitectura de Envío):** `PUT /api/calibration/sessions/[sessionId]` (`route.ts:106`) da **403 en `calibration:manage`** a un User `HR_MANAGER` (tabla users; cuenta `cmfgedx7b00012413i92048wl`, sesión `cmlcddqo90001vttbit317o21`).
- **Matiz clave:** este endpoint **YA** usa el patrón correcto (`extractUserContext` `:97` + `hasPermission` `:106`). El fix estándar de P1-4 ("migrar a extractUserContext") es **necesario pero NO suficiente** aquí — el root está aguas arriba, en el **token**.
- **Mecanismo (verificado file:line):** hay dos logins. `/api/auth/user/login` mintea `userId` + `userRole:user.role` (correcto). `/api/auth/login` (legacy Account) mintea solo `role: account.role`, **sin `userId`/`userRole`** (`auth/login/route.ts:92-99`); y `verifyJWT` re-resuelve `account.role` desde BD (`lib/auth.ts:161-169`). El middleware **solo inyecta `x-user-role` si el token tiene `userId`** (`middleware.ts:206`) → con token Account, `x-user-role` queda ausente → `extractUserContext.role = null` → `hasPermission(null,…) = false` → **403**.
- **Desbloqueo táctico (S, quizá sin código):** que ese sub-usuario obtenga token del sistema User (`/api/auth/user/login`) en vez del Account login — si el login lo emite bien, el 403 desaparece.
- **Fix de fondo (M-L, SISTÉMICO, TOCA middleware global → no sin plan):** migrar sub-usuarios fuera del auth basado en Account, o que el middleware resuelva el rol real del User desde BD cuando el token no lo trae. Ver [[project_auth_verifyjwt_returns_client]].
- **🔁 Actualización 2026-07-06 — instancia calibración MITIGADA:** `0ce7fea` (2026-07-02) re-gateó iniciar/cerrar sesión por participante **FACILITATOR** de la sesión (Puerta 2, `[sessionId]/route.ts:146`); la edición administrativa sigue en `calibration:manage` (`:106`). El bloqueo del smoke Gate 1a quedó superado (regresión email 9/9 PASS 2026-07-04). **El problema sistémico del doble login sigue intacto** (`middleware.ts` inyecta `x-user-role` solo si el token trae `userId`; `auth/login/route.ts:92-99` mintea sin `userId`/`userRole` — reverificado 2026-07-06).
- **🔬 Diagnóstico reversión `dd54b83` (2026-07-06):** el gate de `f3ee919` bloqueó a TODOS (no solo sub-usuarios): `verifyJWT` re-resuelve el rol desde BD (`lib/auth.ts:161-186` → `role: account.role`) y `Account.role` tiene `@default("CLIENT")` (`schema.prisma:131`) — los roles reales viven en `users`, no en `Account` → `hasPermission(CLIENT,…)` = false universal → reversión a los 27 min. **Conclusión: re-aplicar el gate sobre `verifyJWT` es estructuralmente imposible**; el "(S)" del título solo aplica DESPUÉS del fix sistémico de rol. Mitigantes actuales: multi-tenant intacto (`accountId` sale del token, `:358/:379/:415/:434/:462`) y `generate-participants` aguas abajo sí gatea `campaigns:manage` — un rol no autorizado crea el cascarón pero no lo puebla por esa vía.

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

### CONC-ONB-A · ✅ CERRADO — 🔒 `currentAccountId` estático — cross-tenant (P0/P1)

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
**Estado:** ✅ **CERRADO** (commit `7bf30db`, 2026-07-01, pusheado): estado estático eliminado, `accountId` pasa por parámetro. Verificado 2026-07-06: grep `currentAccountId` = 0 matches en el servicio. Runtime-confirmado bajo concurrencia (test 4 escenarios, 9/9 asserts, cero cruces cross-tenant).

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
   ~~Verificar si `Employee` tiene `@@unique(accountId, nationalId)`~~ **Verificado 2026-07-06: SÍ existe** (`schema.prisma:1770`, `idx_employees_account_national`, desde `070f944` ene-2026). Y `JourneyOrchestration` TAMBIÉN tiene `@@unique([accountId, nationalId])` (`schema.prisma:937`, desde `ff3245d` nov-2025) → **los puntos 2 y 3 están respaldados a nivel BD**: concurrencia produce error P2002 visible, no duplicados silenciosos (falta manejar la violación con gracia, pero no hay corrupción). **El único punto SIN respaldo de unicidad es el 1 (Campaign — solo índices normales, sin `@@unique`).**
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

### P2-12 · ✅ CERRADO — 🐞 send-reports: flag de entrega escrito ANTES del envío → reporte de desempeño perdido permanente (S/M)
**Módulo:** Performance. `src/app/api/cron/send-reports/route.ts` + `IndividualReportService.ts`. Descubierto en `MAPA_INTEGRIDAD_ENVIOS_EMAIL.md` §7.
**Qué:** El flag `FeedbackDeliveryConfirmation` (dedup de entrega, con `sentAt`) se persiste en `IndividualReportService.generateReport:69` **antes** del `resend.emails.send` (`route.ts:124`). Si Resend falla, no hay retry ni log (`:124`) y la próxima corrida ve `existing → continue` (`:83`) → **el empleado queda sin su reporte individual, de forma permanente y silenciosa**. El diseño confunde "reporte generado" con "email entregado". Agravantes del mismo cron: doble loop sin cota (`:59`×`:81`, potencialmente cientos), throttle 550ms sin backoff ni respeto a 429 (`:139`), y sin `@@unique(cycleId,employeeId)` (solo `@@index`, `schema.prisma:2113`) → doble envío bajo cron concurrente.
**Fix:** escribir la confirmación de entrega **después** de un send exitoso (mover el `create` post-envío o marcar `deliveredAt` separado de `generatedAt`); idealmente enrutar este batch por el transporte de la cola unificada (retry + rate-limit), NO por su cadencia (ver §6 del mapa: es el único candidato real). Esfuerzo S (reordenar) / M (si se enruta a la cola).
**✅ CERRADO** (2026-07-03, commits `dd44bf2` + `026c808`, Gate 3 Arquitectura Envío — se tomó la variante M): send-reports **ya no llama Resend directo** — encola `CommunicationMessage` en la cola unificada (retry/rate-limit del dispatcher). `FeedbackDeliveryConfirmation` quedó redefinido como guard de "generar una sola vez" (reutiliza `reportToken`, NO bloquea reenvío; semántica documentada en el header del route `:19-26`). Carrera de corridas solapadas manejada vía `dedupKey` `@unique` + catch P2002 (`route.ts:254-259`). El cron **sí está** en `vercel.json` (`0 9 * * *`, agregado en `dd44bf2`) → el "latente" de abajo quedó resuelto. **Residuos menores conocidos (no bloquean):** `sentAt` de la confirmación significa "generado" (no "entregado"); `send-reports:135` trata delay 0 como 7 (`|| 7`). **Dependencia nueva:** la entrega real ahora cuelga del dispatcher → P0-2 (Capa 3 sin agendar) pasa a cubrir también este flujo.
~~**Latente hoy:** el cron `send-reports` **no está en `vercel.json`**~~ → resuelto en `dd44bf2`.
**Nota relacionada:** el anti-patrón hermano en Calibración fue cerrado por `81502e4` (Gate 4, 2026-07-03): audit-log de invitaciones por participante con dedup vía unión de `sentEmails` (append-only) + cron `send-calibration-emails` agendado diario.

### P2-13 · 🐞/🎨 Metas: botón "Configurar Sistema" — permiso `goals:config` + UX (M) — media
**Detectado:** sesión de arquitectura de comunicaciones (falsa alarma de regresión que reveló un bug de UX pre-existente).
**Problema (dos capas):**
1. **Permiso:** `goals:config` en AuthorizationService = `['FOCALIZAHR_ADMIN','ACCOUNT_OWNER','HR_ADMIN']` (comentario "ya existía - NO modificar"). NO incluye HR_MANAGER ni CEO, pese a que ambos ya tienen `goals:view`/`goals:create`. Inconsistencia.
2. **UX:** el botón "Configurar Sistema" en `/dashboard/metas/estrategia` se muestra a CEO y HR_MANAGER, pero al usarlo el backend responde 401. Ofrece una acción que falla.
**Decisión de negocio (Victor):**
- HR_MANAGER debe poder configurar metas → agregar a `goals:config` (vía AuthorizationService, regla 2, no hardcode). Confirmar si CEO también entra (diseño ESTRATEGA en PK lo contempla).
- Roles que NO configuran (AREA_MANAGER, EVALUATOR): botón desactivado + tooltip "La configuración de metas (ponderación, grupos, elegibilidad de cargos) la realiza RRHH".
**A confirmar por Code antes de tocar (git + backlog + código real):**
- Definición real y actual de `goals:config`; si el fix de permisos de metas en este backlog sacó a alguien a propósito; git blame de la línea.
- Qué endpoints gatean con `goals:config` (goal-groups, goal-rules, goal-eligibility, goals-impact).
- **CLAVE — dependencia:** ¿asignar metas requiere configuración previa (GoalGroup, GoalJobConfig, elegibilidad), o funciona con defaults? Si es prerrequisito duro, un rol que asigna pero no configura queda bloqueado; el tooltip debe ORIENTAR, no solo informar (riesgo Victor: "de lo contrario tampoco podrá asignar metas").
**Alcance (al retomar):** agregar rol(es) a `goals:config` + desactivar botón con tooltip por rol (estilos `.fhr-*`, sin CSS inline). Verificar tsc/build contra baseline. NO es de Gate F de comunicaciones.
**Prioridad: media** — no bloquea nada crítico; pulido de experiencia + consistencia de permisos.

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

### P3-12 · 🐞 Calibración: PDF de auditoría inexacto/incompleto vs la BD (S/M) — exactitud de auditoría
La captura en BD es **completa**: cada `CalibrationAdjustment` guarda `adjustedBy` (quién ajustó, `adjustments/route.ts:251`), `justification` (`:250`), `newNineBox` (`:249`), `newFinalLevel`/`newPotentialLevel` (`:246-248`) + snapshot `previous*` (`:244`), más un `AuditLog` inmutable en paralelo (`:257-280`). Al cerrar, el rating queda con `calibratedBy = adjustment.adjustedBy` (`close/route.ts:103`). **El problema es solo el PDF**, que refleja mal/menos:
- **Facilitador equivocado:** `close/route.ts:195` `facilitator: closedSession.facilitatorId || userEmail` → nombra al `facilitator_id` (que puede no ser el FACILITATOR real ni quien cerró). Confirmado en runtime: PDF decía `maria@empresa.cl` (facilitator_id) cuando cerró `vyanezb@gmail.com` (FACILITATOR participante). Ligado a la inconsistencia `facilitator_id` ≠ participante FACILITATOR.
- **Omite datos que la BD sí tiene:** el map pasado al PDF (`close/route.ts:197-205`) NO incluye `adjustedBy` (quién hizo cada ajuste), `newNineBox` (movimiento 9-box) ni potential score/level.
**Fix:** (a) que el PDF lea el facilitador del participante con `role='FACILITATOR'` (o sincronizar `facilitator_id` con ese participante al invitar/iniciar), y (b) pasar `adjustedBy`/`nineBox`/`potential` al PDF. **No urge** (la BD es la fuente de verdad auditable; el PDF es derivado). Relacionado con P3-10 (mismo PDF).

### P3-13 · 🏗️ Encuestas: limpieza legacy del patrón "rating=0 como falsy" (S)
**Origen:** Gate 0 del fix NPS rating=0 (2026-07-06, sellado `a98b626`). El fix cubrió las 2 rutas de submit vigentes; quedó fuera de ese pase (decisión explícita de Victor) el barrido del mismo antipatrón en código legacy/cosmético:
- `src/components/forms/SurveyForm.tsx:100` (`rating > 0`) y `src/components/forms/ConditionalSurveyComponent.tsx:131` (`rating >= 1`) — **código muerto**: ambos se importan en `src/app/encuesta/[token]/page.tsx:12-13` pero la página solo renderiza `UnifiedSurveyComponent` (:317). Fix: eliminar los 2 componentes + sus imports (verificar con grep que no haya otro consumidor).
- `src/lib/survey/getScaleLabels.ts:39` — `(question.maxValue || 5) - (question.minValue || 1) + 1`: con NPS minValue=0, `0 || 1` da scaleSize 10 en vez de 11. Solo afecta interpolación de labels intermedios (NPS no la usa) — cosmético. Fix: `?? ` en vez de `||`.
**Regla de fondo (ya registrada en el as-built del maestro NPS):** todo guard de rating debe usar `question.minValue`, nunca literales (`> 0`, `>= 1`). La capa de normalización/agregación es correcta para 0 — NO agregar guards ahí.
**No urge:** nada de esto ejecuta en el flujo vigente; es prevención de resurrección del bug si alguien revive el legacy.

---

## Apéndice — índice por módulo

| Módulo | Ítems |
|---|---|
| **Pulso/Experiencia + Torre Control** | P1-1 (perf hook), P1-4 (RBAC campaigns) |
| **Performance/Calibración** | P1-7 (approvedBy), P2-6 (dept snapshot), P2-12 ✅ (send-reports → cola unificada, `dd44bf2`), P3-3 (estilo evaluador histórico), P3-4 (plan calibrador), P3-10 (PDF cifrado) |
| **Metas** | P0-1 ⏳ (5 endpoints RBAC pendientes de 6), P1-2 ✅ (`380130f`) |
| **Sucesión** | P2-3 (RBAC + debug logs) |
| **Workforce** | P3-6 (tabs placeholder), (Descriptores P2-11 lo habilita) |
| **Efficiency** | P1-3 (L4 narrativa), P1-5 (RBAC AREA_MANAGER), P2-4 (L6 umbral) |
| **TAC** | P3-5 (cross-cycle) |
| **P&L Talent** | (cubierto por Performance + clasificación P2-5) |
| **Exit** | P2-2 (RBAC), P2-10 (SLA) |
| **Onboarding** | P2-1 (RBAC), P2-10 (SLA), P3-7 (narrativa), CONC-ONB-A ✅ (`7bf30db`), CONC-ONB-B (check-then-act; hueco real = Campaign) |
| **Ambiente Sano** | P2-7 (ActionPlan), P2-8 (Motor 1/6), P2-9 (LLM CRON), P2-10 (SLA) |
| **Benchmark** | P0-3 (CRON prod), P1-6 (RBAC), P3-1 (vista interna), P3-2 (metricTypes) |
| **Comunicaciones** | P0-2 (Capa 3), P0-4 (WhatsApp go-live) |
| **Descriptores** | P2-11 (UNCLASSIFIED), P3-8 (RoleCardBento) |
| **Transversal** | P2-5 (clasificación talento), P3-9 (caso positivo), P3-13 (legacy rating falsy en encuestas), SEC-EMAIL (2 endpoints email huérfanos sin RBAC — sin triage) |

---

## Notas de método
- file:line citados provienen del mapeo de las 14 fichas (`.claude/FICHA_PRODUCTOS/`). Confirmar línea exacta al abrir cada fix (el código se mueve).
- Antes de cerrar un ítem de seguridad, verificar el patrón canónico en `GET /api/goals/route.ts` (RBAC 3 capas de referencia) y `AuthorizationService.PERMISSIONS`.
- Los P0 de seguridad (P0-1) y los gates faltantes (P1-4/5/6, P2-1/2/3) comparten el mismo fix de 1 patrón → conviene hacerlos en una sola pasada de "auditoría RBAC".
