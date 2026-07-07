# EX CLIMA — Bitácora de ejecución (gate por gate)

> Fuente de verdad del diseño: `.claude/plans/MAESTRO_EX_CLIMA.md` (v3.5)
> Este doc registra SOLO ejecución: qué se hizo, commits, evidencia, gotchas, próximo paso.

---

## Gate 1 — Foundation ✅ SELLADO (2026-07-06)

**Commits:** `28c9369` (schema) · `ec2694e` (seed script) · `7cc04e3` (lógica) · sello (ver git log)

**Qué quedó construido:**
- Schema: `Question.questionTier/isDriverCore/isBenchmarkable` + índice; `Campaign.driverFocusByDepartment` + `climaAggregationStatus`; `Department` gold cache clima (4 campos); modelo `DepartmentClimaInsight` (clave `[accountId, departmentId, period, productType, isFollowUp]`); relaciones inversas en Account/Department/Campaign. `db push` aplicado.
- Banco de preguntas (BD dev, vía `npm run migrate:clima-gate1 -- --apply --allow-active`): 47 existentes → CORE; +5 EI por tipo (EI-2 `nps_scale` 0-10); +1 follow-up y +2 text_open (`texto_libre`, isBenchmarkable=false, opcionales); questionCount 20/43; duración 8/18 min; SurveyConfiguration con regla modify_text (EI-1→follow-up, textMapping por rating) + categoryConfigs engagement_index/texto_libre (COPY PROVISIONAL — Victor edita en BD).
- Runtime: `useSurveyEngine.ts` modify_text acepta rating como clave (retrocompatible con choices).
- Filtro seguimiento: helper puro `src/lib/utils/climaFocusFilter.ts` + wiring en `survey/[token]/route.ts` (selects +departmentId +driverFocusByDepartment).
- Permisos: `clima:view` (7 roles) / `clima:manage` (5 roles) + `PERMS_BY_MODULE.clima` en action-plans.
- Generator employee-based copia `standardJobLevel` + `acotadoGroup`.

**Evidencia de verificación:**
- Smoke 40/40 PASS (S1 banco ×2 tipos, S2 SurveyConfiguration ×2, S3 clave de 5 campos: create + coexistencia completa/seguimiento mismo período + P2002 en duplicado exacto, S4 filtro puro 4 casos, S5 permisos 5 casos). Smoke borrado al sellar (regla de la casa).
- Seed re-run = 100% no-op (idempotencia probada).
- `npx tsc --noEmit` EXIT 0 · `npm run build` EXIT 0.
- E2E vivo contra dev server: GET survey de campaña pulso real → 20 preguntas (7 categorías core reales + 5 engagement_index + 3 texto_libre), NPS 0-10, último orden 20. Con `driverFocusByDepartment` seteado (low:[liderazgo], high:[satisfaccion]) → 13/20 exactas; revertido a null.

**Gotchas descubiertos (para próximos gates):**
- **Taxonomía real ≠ seed.ts**: la BD tiene 7-8 categorías (satisfaccion, liderazgo, autonomia, desarrollo, crecimiento, comunicacion, reconocimiento, compensaciones) — `ambiente`/`bienestar` NO existen; `prisma/seed.ts` está desalineado de la BD y es destructivo (NO usarlo). Consolidación de taxonomía = decisión de negocio pendiente (chat aparte), dimensiona el diccionario de Gate 5.
- **modify_text real**: vive en `SurveyConfiguration.conditionalRules` por campaignType (NO en Question); mapea por clave de `textMapping` (choice o, desde Gate 1, rating como string).
- **Las preguntas se cargan EN VIVO** del CampaignType → tocar el banco afecta campañas activas (el seed script tiene guard `--allow-active`).
- **`npm run script -- --flag` NO pasa flags en PowerShell** → usar `npx tsx prisma/scripts/x.ts --flag` directo.
- **`prisma/scripts/*.ts` se type-checkea en `npm run build`** → un smoke con error de tipos rompe el build global (pasó con el smoke de Metas Gate C). Regla nueva: borrar el smoke al sellar.
- Campañas activas en dev son todas de prueba (TEST 3, 777…, POST_REFACTORIZACION, JUNIO26_V2).

**Pendientes NO bloqueantes que hereda Gate 4:**
- Copy de categoryConfigs (engagement_index/texto_libre) y textMapping del follow-up = PROVISIONAL, Victor revisa/edita en BD.
- Validación visual del follow-up dinámico y la portada con las categorías nuevas (es client-side; el backend está verificado E2E).

---

## Gate 2 — Scoring + Aggregation ✅ SELLADO (2026-07-06)

**Commits:** `708791d` (núcleo servicios) · `d2eee38` (trigger + recompute) · sello (ver git log)
**Plan aprobado:** `~/.claude/plans/steady-sleeping-quiche.md` (dir global de plans, no el del repo)

**Qué quedó construido:**
- `clima/FavorabilityCalculator.ts` (puro): fav top-2 + mean por driver, dual track
  full/core/custom, EI separado, guardia `responseType==='rating_scale'` (NPS 0-10 no
  contamina), `PRIVACY_THRESHOLD` importado de SafetyScoreService, celda acotadoGroup
  bajo threshold se OMITE (depto bajo threshold → fav/mean null, n preservado).
- `clima/ClimaAggregationService.processClimaResults`: PENDING→RUNNING→COMPLETED/FAILED,
  try/catch por depto, upsert idempotente clave 5 campos, carry-forward (carried:true +
  sourceDate + n:0, data-driven sobre el baseline isFollowUp=false), momentum EI,
  snapshots DepartmentMetric+EXO/EIS/ISA, benchmarkDelta (null hoy — sin MarketBenchmark
  pulse_climate), gold cache rolling 12m, AuditLog SIEMPRE con metadata.
  `suggestDriverFocus` exportado (top-2 low <3.0 + top-1 high >4.0, solo isFollowUp=false).
- `NPSAggregationService.aggregateClimaNPS`: clon exit con fuente Response, 3 niveles,
  primer writer de productType 'pulso'/'experiencia'.
- Trigger en `PUT /api/campaigns/[id]/status` (bloque toStatus=completed, solo slugs
  clima); fallo NUNCA revierte el cierre. Re-run: `npm run recompute:clima-insights`.

**Evidencia de verificación:**
- Smoke 72/72 PASS (borrado al sellar): S1 scores exactos a mano + guardia NPS,
  S2 privacy (depto n=3 → nulls; celda n=1 → omitida), S3 snapshots con nombres reales,
  S4 NPSInsight 3 niveles, S5 gold cache + suggestDriverFocus, S6 re-run idempotente +
  AuditLog, S7 carry-forward + momentum -50, S8 S-PERF.
- **Fallo parcial verificado empíricamente** (smoke 18/18, post-sello 2026-07-06,
  borrado): fallo real de BD inducido con trigger Postgres RAISE EXCEPTION solo para
  el depto víctima → FAILED con depto+error en AuditLog, los otros 2 deptos con insight,
  campaign.status intacto 'completed', y re-run tras remover la causa → COMPLETED 3/3.
  (Vector "departmentId inexistente" NO inducible: FK en BD lo rechaza al insertar.)
  Checklist Gate 2 completo ítem por ítem, sin verificaciones "por diseño".
- **S-PERF línea base: 17.340 responses / 1.020 participantes / 12 deptos → 9.070ms**
  (presupuesto <10s; requirió paralelizar upserts por depto + niveles NPS + gold cache
  y query madre con select mínimo — primera pasada secuencial daba 14.242ms).
- `npx tsc --noEmit` EXIT 0 · `npm run build` EXIT 0.
- E2E vivo: dev server + PUT /status con JWT (como el frontend) sobre campaña pulso
  sintética → COMPLETED, insight 7 drivers reales + EI + eNPS, NPSInsight 3 niveles
  'pulso', gold cache, AuditLog; segundo PUT (forceTransition) y recompute = idempotentes.

**Gotchas descubiertos (para próximos gates):**
- **Fuente de datos = Response.rating CRUDO** (1-5 drivers/EI, 0-10 NPS);
  normalizedScore NO se usa en Gate 2 (confirmado por grep, 0 menciones).
  ⚠️ **Hallazgo upstream reportado, PENDIENTE decisión Victor**: el submit
  (`survey/[token]/submit/route.ts:133`) descarta `rating` si no es `> 0` →
  un 0 de NPS (detractor extremo) nunca se persiste → sesga eNPS al alza
  (clima Y exit, misma ruta compartida). NO se tocó — fix afecta todos los
  productos.
- **DepartmentMetric YA está poblada en dev** (12 filas, jun-2026) — el "(a confirmar
  por Code)" del MAESTRO quedó resuelto: campos reales `absenceRate` (no absenteeism)
  y `overtimeHoursAvg` (HORAS promedio, no rate — el insight lo guarda tal cual en
  overtimeRateAtMeasurement, semántica documentada en el service).
- **Latencia de red domina, no cómputo**: dev machine→Supabase pooler ≈ 600ms/query
  (recompute de 1 depto = ~17s por eso); conexión DIRECT_URL ≈ la mitad; las fases
  paralelas son lo que mete el volumen enterprise bajo presupuesto. En Vercel
  co-localizado esto colapsa a <1s.
- durationMs del AuditLog en dev server incluye compile-on-demand de Next (no comparar
  contra el smoke).
- El objeto `campaign` que devuelve el PUT es el snapshot PREVIO al hook
  (climaAggregationStatus se lee null ahí; los sideEffects sí informan el resultado real).

**Pendientes NO bloqueantes que heredan gates siguientes:**
- riskZone + accumulatedClimaRiskZone + driverAnalysis/topFocusArea/topStrength → Gate 3.
- Wiring de suggestDriverFocus a la creación de campaña de seguimiento → Gate 4/7.
- Escritura de MarketBenchmark pulse_climate → Gate 6C (benchmarkDelta null hasta entonces).

---

## Gate 3 — PulseEngine (5 algoritmos) 🔜 SIGUIENTE

Al retomar: leer MAESTRO §Gate 3 completo + este doc. Plan Mode primero.
Insumos listos: DepartmentClimaInsight poblado al cerrar campaña (Gate 2),
riskZone/driverAnalysis son NULL esperando al motor; absorbe RetentionEngine
(decisión sellada julio 2026).
