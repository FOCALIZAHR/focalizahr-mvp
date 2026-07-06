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

## Gate 2 — Scoring + Aggregation 🔜 SIGUIENTE

Al retomar: leer MAESTRO §Gate 2 completo + este doc. Plan Mode primero.
Insumos listos: DepartmentClimaInsight en BD, climaAggregationStatus en Campaign,
patrón `aggregateExitNPS` en `NPSAggregationService.ts:472` / `upsertNPSInsight:152`.
Recordar: "(a confirmar por Code)" del MAESTRO — DepartmentMetric poblado con
turnover/absenteeism reales — se verifica DENTRO de Gate 2 antes del paso 6.
