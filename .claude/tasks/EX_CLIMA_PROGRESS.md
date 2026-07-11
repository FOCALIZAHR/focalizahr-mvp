# EX CLIMA — Bitácora de ejecución (gate por gate)

> Fuente de verdad del diseño: `.claude/plans/MAESTRO_EX_CLIMA.md` (v3.7)
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

## Gate 3 — PulseEngine (5 algoritmos) ✅ SELLADO (2026-07-07)

**Commit:** `3ea5f09` (implementación) · sello (ver git log)
**Plan aprobado:** `~/.claude/plans/polymorphic-growing-peacock.md` (dir global)

**Qué quedó construido:**
- `clima/PulseEngine.ts` (puro, sin I/O): ALG1 Driver Analysis (impact =
  Pearson driver×EI a nivel COMPAÑÍA por participante, gap = fav−75 target
  fijo, priority = |r|×|gap|, cuadrantes focus_area/strength/monitor/maintain),
  ALG2 Hotspot (eiFav<p25, mín 4 deptos, confidence por datos duros), ALG3
  Momentum per-driver (carried excluido AMBOS lados), ALG4 Gap Transfer
  (campeón por driver, ≥2 deptos midiendo), ALG5 Pearson eiFav×turnoverRate
  → business cases CLP, theatreDetected (ISA>70 + eiFav<50, null si no
  evaluable), calcRiskZone. Reutiliza calculatePearsonR (GoalsDiagnostic) y
  filterRatingRows (FavorabilityCalculator).
- **Decisiones Victor 2026-07-07**: riskZone 75/65/60 (estándar dashboard
  diario Culture Amp; cuartiles 80/70/60 reservados a Gate 6C) + momentum
  ≤−10pp degrada UNA zona; CLIMA_TARGET_FAVORABILITY=75 constante SEPARADA;
  business cases a taxonomía real: clima_critico (peor driver <2.5,
  generaliza 'ambiente' inexistente) / retencion_riesgo (EI<3.0) /
  liderazgo_gap (<3.0) MUTUAMENTE EXCLUYENTES sobre el mismo driver (sin
  doble CLP); umbrales editables por dev, NO por cliente.
- Wiring: fases 4b/4c POST-upserts (Gate 2 intacto, fallo parcial sigue
  válido; Pulse degrada sin revertir cierre); cero re-queries (insumos del
  closure per-dept); update de SOLO 5 campos (driverAnalysis/topFocusArea/
  topStrength/riskZone/correlationFlags); gold cache accumulatedClimaRiskZone
  (sin modulación momentum); AuditLog +pulseDurationMs.
- Read-time para Gate 4 (nada persistido): aggregateCompanyPulse,
  buildCompanyBusinessCases, rankMomentumMovers (ranking mayor caída/mejora,
  patrón TopMoversPanel — el panel visual es Gate 4).
- RetentionEngine + useRetentionAnalysis @deprecated (cero cambio funcional,
  results page intacta hasta Cinema Mode).

**Evidencia de verificación:**
- Smoke 69/69 PASS (borrado al sellar): Pearson a mano (r=1/0.8/null),
  cuadrantes ALG1, 8 casos momentum, p25 interpolado a mano, gap transfer,
  ALG5 r=−1 lineal, teatro true/false/null, business cases con CLP exacto
  (salario 1M → turnoverCost 15M ×1.25, ROI/payback a mano) + exclusión
  mutua liderazgo + carried no dispara, riskZone 10 casos, computePulse
  end-to-end (impact 1, gap −25, priority 25, champion +35pp, privacy nulls).
- E2E vivo 34/34 contra BD dev: campaña sintética 6 deptos con perfiles
  EXACTOS (eiFav 0/100/62.5/68.75/75/privacy → roja/verde/naranja/amarilla/
  verde/null), insights previos 2026-Q1 reales → momentum crisis(−40) y
  growing(+45), hotspot p25=62.5 a mano, ALG5 r≤−0.9 con 5 pares,
  3 business cases en D1 con exclusión mutua, gold cache riskZone (rolling
  15→roja, 80→verde), idempotencia run 2. Fixtures cleanup por id exacto
  en transacción (incl. NPSInsight 2026-06 'pulso' que escribe el pipeline).
- **S-PERF: 10 deptos × 10 participantes → pulseDurationMs 2.127ms**
  (presupuesto MAESTRO <5s; fase = 1 query salary + cómputo in-memory +
  N updates paralelos; dev→Supabase ~600ms/query domina).
- `npx tsc --noEmit` EXIT 0 · `npm run build` EXIT 0.

**Gotchas descubiertos (para próximos gates):**
- theatreDetected rama true NO ejercitable E2E en la cuenta dev (sin
  ComplianceAnalysis scope DEPARTMENT de Ambiente Sano) — lógica verificada
  en smoke; primer cliente con ambos productos la ejercita en vivo.
- Campañas sintéticas de clima escriben NPSInsight mensual 'pulso' del
  período (last-wins global por cuenta) → TODO cleanup de fixtures debe
  incluir `nPSInsight` de ese período o pisa el snapshot real.
- Dev quedó SIN campañas con agregación previa (fixtures Gate 2 se
  limpiaron al sellar) — para probar Gate 4 habrá que re-seedear campaña
  sintética o cerrar una real.
- `npx tsx -e "..."` en PowerShell rompe con `$disconnect` (escape) —
  scripts a archivo siempre.

**Pendientes NO bloqueantes que heredan gates siguientes:**
- Wiring de suggestDriverFocus a creación de campaña de seguimiento → Gate 4/7.
- benchmarkDelta null + gapBasis 'fixed_target' → migran con MarketBenchmark
  pulse_climate en Gate 6C.
- Eliminar RetentionEngine + useRetentionAnalysis cuando Cinema Mode
  reemplace results/page.tsx (Gate 4).

**MEJORA PENDIENTE (backlog, NO toca Gate 3):** Clasificación de zonas eNPS
(InsightEngine.ts, compartido Exit/Onboarding/Pulso/Experiencia) usa 3 zonas
(≥50/0-49/<0), desalineada de convención de mercado 2026 (4 niveles:
Excelente >+50, Muy Bueno +20-50, Bueno +1-20, Crítico <0). NO tocar en
Gate 3 — es infraestructura cross-producto, requiere su propio Gate 0
mapeando consumidores antes de cambiar el corte.

---

## Gate 4 — Frontend Cinema Mode ✅ SELLADO (2026-07-07)

**Commit:** `b653dc5` (implementación) · sello (este doc + MAESTRO v3.8)

**Qué quedó construido:** página standalone `/dashboard/clima` en Cinema Mode
entity-centric (departamentos). Lobby (MissionControl: gauge de compañía + Smart
Router "tu foco" + leyenda de zonas + entradas a capítulos) → Rail fijo abajo de
departamentos (filtros por zona) → DepartmentSpotlightCard (gauge + drivers +
brecha por cargo + señales + business cases) ↔ 3 capítulos de compañía
(Heatmap / Impact 2×2 / Correlación). Backend read-time: `GET /api/clima/campaigns`
+ `GET /api/clima/results` (RBAC clon compliance/report). `PulseEngine`
+calcOrgFavorability +calcOrgMomentum. Ítem de menú "Inteligencia de Clima".

**Decisiones clave (detalle en MAESTRO v3.8 AS-BUILT):**
- Referencia corregida: `evaluator/cinema/*` (NO compliance). Gauge = copia
  literal de `SegmentedRing`, solo cambia dato/color/frase/footer.
- Paleta anti-semáforo clonada de `IndicatorGauge` (`climaZonePalette.ts`):
  cyan/slate/ámbar/ámbar+glow, nunca rojo. Número del gauge siempre blanco.
- Momentum UNIFICADO same-tipo (org y per-depto). Cross-tipo descartado (Victor).
- Cascada Ejecutiva → Gate 4.5 (este Lobby es el destino, no la entrada).
  CurvaVital → Gate 7.

**Evidencia:** `tsc --noEmit` + `next build` limpios (build completo solo falla
en `prisma generate` por EPERM del dev server Windows). RBAC 3 capas verificado
con funciones reales (global 6/6 · AREA_MANAGER scoped a subárbol · EVALUATOR
403). Datos demo Q1+Q2 (momentum org +7 + per-depto variado, 6 zonas roja→verde
incl. naranja, turnover para el scatter). Mobile 320px auditado (overflow
corregido en FavorabilityBar/BusinessCaseCard).

**Gotchas para gates siguientes:**
- Dev NO reproduce el caso cross-tipo Pulso↔Experiencia (por eso se unificó
  same-tipo ahora, no en producción con un cliente real).
- `theatreDetected` sigue sin ejercitarse en vivo (cuenta dev sin ComplianceAnalysis
  DEPARTMENT) — el gauge/panel lo maneja null.
- Seeder de datos demo (`tmp-seed-clima-lobby.ts`) borrado al sellar; para re-ver
  hay que re-seedear (contenido en el historial de la sesión de Gate 4).

**Hereda Gate 4.5:** `ClimaSynthesisEngine` (reglas detect→score→priority, patrón
`AmbienteSynthesisEngine`, DiagnosticType de clima) + `ClimaNarrativeDictionary`
(4 Actos + Síntesis) + estados Portada→Ancla→Cascada→Síntesis ANTES del Lobby en
`useClimaCinemaMode`. **Hereda Gate 5:** planes de acción (ActionPlan
moduleType='clima', ya aceptado en la API desde Gate 1). **Hereda Gate 6C:** los
3 modos del heatmap (hoy absolute) requieren MarketBenchmark pulse_climate.

---

## Gate 4.5a — Cascada Ejecutiva ✅ SELLADO (2026-07-08)

**Commits:** `23835e1` (implementación: motor + narrativa + enriquecimiento + cross-signal
+ climaThresholds + UI cascada + hook/orquestador) · `0c6ffaa` (retiro smoke/seeder al
sellar). Sello (docs): este archivo + MAESTRO v3.9. **Push manual de Victor** (pendiente).

**Evidencia:** `tsc --noEmit` + `next build` limpios (`/dashboard/clima` prerenderiza,
bundle 25.8 kB sin prisma). Smoke motor **69/69** (jerarquía 2 capas, enriquecimiento
Nota G, guards n≥5, DRIVER 3 combinaciones de flags con assert de texto exacto). Review
en vivo por Victor sobre 4 perfiles demo (Teatro · Foco Concentrado+exit · Difuso/
OBSERVACION · Patrón Sistémico DRIVER 2-flags+MOMENTUM) — Hotspot, Momentum y Driver A+B
vistos renderizados en pantalla real.

**Qué quedó construido (fundación de la capa narrativa):**
- **`climaThresholds.ts` (FUENTE ÚNICA client-safe, sin prisma):** extracción PURA de
  PulseEngine (Gate 3) de las constantes de dominio + `calcRiskZone` — `RiskZone`,
  `RISK_ZONE_THRESHOLDS`, `MOMENTUM_*_PP`, `CLIMA_TARGET_FAVORABILITY`, `LEADERSHIP_DRIVER`,
  `CLIMA_MIN_RESPONDENTS` (n≥5), `calcRiskZone`. PulseEngine las importa + **re-exporta**
  (cero ruptura de importadores); ClimaSynthesisEngine, la ruta de resultados y
  climaZonePalette importan de ahí. **Cero valores duplicados** (antes el motor y la
  paleta los espejaban a mano — riesgo de divergencia eliminado). Comportamiento IDÉNTICO
  verificado: smoke 42/42 sin cambios, mismas zonas del demo (roja/amarilla), build limpio.
- `ClimaSynthesisEngine` (puro, isomórfico — client-safe, sin prisma): decide Actos
  DINÁMICOS (1-2 sano / 4-5 crisis, reemplaza "4 Actos" fijos — semilla §9), dominante
  + Síntesis. **7 tipos** (jerarquía de 2 capas — ver abajo): TEATRO_GENERALIZADO ·
  HOTSPOT_CONCENTRADO · OBSERVACION_SIN_FOCO · DRIVER_SISTEMICO · MOMENTUM_NEGATIVO ·
  BIEN_CON_FOCOS · SALUDABLE.
- `ClimaNarrativeDictionary`: copy VERBATIM doc 2 (§0 Portada 4 zonas + Ancla 4
  nodos + tooltip · §1-6 Actos · Síntesis · `[SI...]` §7.3/7.4). interpolate().
- `ClimaSynthesisEngine` + UI cascada (`components/cascada/`: shared, ClimaPortada,
  ActoClima, ClimaSintesis, ClimaCascada, ClimaIntroSequence). `AnclaInteligente`
  reutilizado (Tipo 2, `buildClimaAnclaComponents`).
- API: `/api/clima/results` +crossSignals por depto (exit topExitFactors +
  onboarding abandono; 2 findMany batched, período-alineado periodEnd≤endDate).
- Hook/orquestador: `introDismissed` gatea el Lobby; `ClimaIntroSequence`
  (Portada→Ancla→Cascada) precede al Lobby; botón "Saltar al detalle".

**Decisiones de alcance (Victor, esta sesión) — documentar al SELLAR:**
- **Ampliación DELIBERADA vs semilla §6:** exit + onboarding cross-signal cableados
  AHORA (señales confirmadas contra schema, core narrativo del gate). Sesgo del
  evaluador (7.1/7.2) SIGUE DIFERIDO (clause `bias` escrita pero nunca insertada).
- **MAESTRO al sellar:** "4 Actos" → **Actos dinámicos** (nueva fila de versión).
- **Guard n≥5 en la ACTIVACIÓN** (Nota C): gerencia-level `totalResponded≥5`
  (re-filtro read-time de hotspot/theatre — los flags Gate 3 NO gatean por n);
  dimensión-level `driverScores[d].n≥5` (carried n:0 auto-excluido).

**Verificado contra código sellado (condiciones de Victor):**
- `detectHotspots`/`detectTheatre` (PulseEngine) NO filtran por n → el motor
  re-filtra. `DepartmentExitInsight`/`DepartmentOnboardingInsight` son por
  depto+período (join período-alineado). carried tiene n:0 (ClimaAggregationService:321).

**JERARQUÍA DE DETECCIÓN — SELLADA esta sesión (decisión Victor). Documentar en MAESTRO.**
Principio: **el NIVEL ABSOLUTO manda; el percentil solo describe la distribución
dentro de un nivel absoluto ya establecido — nunca decide por sí solo si hay problema.**
Motivada por: HOTSPOT disparaba con el p25 crudo (relativo puro) → contaba "foco
aislado" aunque toda la empresa estuviera bajo el objetivo. Mapa auditado tipo-por-tipo:
solo HOTSPOT usaba medida relativa pura; el resto ya anclaba en absoluto (75/bandas/ISA)
o en eje ortogonal (confiabilidad/tendencia).
- **Capa 0 · Confiabilidad (override, absoluto):** TEATRO (ISA>70 ∧ eiFav<50, ≥2 gerencias).
- **Ejes ORTOGONALES (co-disparan, absolutos):** MOMENTUM (delta ≤−5pp) · DRIVER
  (driver<75 en ≥2 gerencias). Anclados en umbral absoluto, co-disparan a cualquier nivel.
- **Eje NIVEL+CONCENTRACIÓN (exactamente uno, o ninguno si un ortogonal ya explica el nivel):**
  - `orgFav ≥ 75`: BIEN_CON_FOCOS (hay no-verde) · SALUDABLE (todo verde + sin ortogonal).
  - `orgFav < 75`: **HOTSPOT** (concentrado) · **OBSERVACION_SIN_FOCO** (difuso). Mutuamente excluyentes.
- **Resolución #1 (guard absoluto de HOTSPOT):** HOTSPOT queda estructuralmente
  condicionado a `orgFav < 75` — guard EXPLÍCITO, no accidente. Un outlier severo en
  org sana (`orgFav≥75`) → BIEN_CON_FOCOS, HOTSPOT no puede disparar (test 13).
- **Resolución #2 (HOTSPOT = 3 condiciones):** `orgFav<75` **Y** outlier naranja/roja
  (piso absoluto) **Y** mediana-del-resto ≥ 75 (fondo sano). Así la copy "caso aislado,
  resto en rango razonable" es VERDADERA por construcción. Si la mediana-del-resto < 75
  (problema amplio, el outlier es solo el peor punto) → NO HOTSPOT → cae en
  OBSERVACION_SIN_FOCO (test 12). Sin copy condicional de HOTSPOT (se evitó redundancia
  con OBSERVACION). El p25 sellado (`hotspotDepartmentIds`) YA NO decide — quedó como
  descriptor de distribución subordinado al piso absoluto.
- **OBSERVACION_SIN_FOCO (7º tipo, análogo Ambiente Sano):** cierra el hueco "org bajo
  el objetivo pero difuso" que antes caía mal en SALUDABLE. Copy **PROVISIONAL marcada**
  (adaptada del OBSERVACION_SIN_FOCO de Ambiente) — Victor escribe la final; nombra el
  punto más bajo `{gerencia}` sin sonar a "foco aislado".

**Enriquecimiento "momento de revelación" (Nota G del doc 2) — INTEGRADO.** Nombre +
cifra + comparación al revelar, en HOTSPOT/DRIVER/MOMENTUM/BIEN_CON_FOCOS/SALUDABLE/
OBSERVACION. Portada+Ancla (magnitud pura) NO se tocaron (anti-robo-de-trueno). TEATRO
tampoco (nombrar gerencias en un diagnóstico de simulación es más sensible).
- **Guard n≥5 en movers (Nota G #1):** `rankMomentumMovers` NO guardea n≥5 (Gate 3, no se
  toca). El motor computa el mayor faller/riser y aplica el guard con `CLIMA_MIN_RESPONDENTS`:
  nombra solo con `totalResponded≥5`, si no usa el bloque `[SI n<5]` (magnitud sin nombre).
- **`interpolate()` (Nota G #2):** ya soporta las variables nuevas (regex `\w+`). Cero cambio
  de contrato; el motor computa los valores y los agrega al context.
- **DRIVER_SISTEMICO — 2 flags INDEPENDIENTES (decisión Victor):** la detección NO cambia
  ("sistémico" = extendido en ≥2 gerencias, ya auditado). El enriquecimiento se compone:
  - Flag A (top-impact): la dimensión detectada es la de mayor `driverAnalysis.impact` (|r|)
    entre drivers medidos → incluye "el driver que más pesa en tu resultado general".
  - Flag B (mayor caída, CALCULADO): la dimensión detectada es la de `momentumDelta` org
    más negativo → incluye "el que más cayó… con una variación de {deltaDimension} puntos".
  - Ninguna: el Acto se sostiene con la amplitud (garantizada por la detección). Solo una:
    esa sola (sin el "Y"). Ambas: la frase completa con "Y" + cierre. Fragmentos verbatim
    del doc 2 §3; la combinación es estructural (mismo patrón que los `[SI...]` de MOMENTUM).

**Puntos de ajuste para el live review (Victor):**
- Portada: título "Experiencia/Colaborador" + hero orgFav% + gancho (repite el %
  en el texto). Tokens y tamaño de ancla de los Actos (text-6xl para frases).
- CTAs de Acto/Síntesis → Lobby (deep-link a evidencia específica = 4.5b Cards).
- DRIVER_SISTEMICO "sin relación jerárquica" no verificado (la respuesta no trae
  parentId) — refinamiento diferido.
- Umbrales de disparo (TEATRO_MIN=2, DRIVER_MIN=2, MOMENTUM=−5pp, HOTSPOT `detectable≥3`)
  editables en `THRESHOLDS` — tuning en vivo.

**Copy [SI...] cross-signal — RECONCILIADO (decisión Victor):** `CROSS_SIGNAL_CLAUSES`
(§7 del doc 2) es la ÚNICA fuente, NO la versión embebida de los Actos §1-6. Captura la
distinción LENIENCY/SEVERITY (7.1, diferida). Cada cláusula = convergencia (a la narrativa)
+ "O" enriquecido que REEMPLAZA al "O" base del Acto cuando el cruce dispara.

**Smoke (retirado del árbol al sellar — evidencia en `23835e1`):**
`smoke-clima-cascada-gate45a.ts` **69/69** — jerarquía tests 11-13, enriquecimiento Nota G
tests 2/6/6b/7/8/11, DRIVER 3 combinaciones de flags (14 ambos · **14a solo-A** · **14b solo-B**,
las 2 últimas con assert de TEXTO EXACTO), guard `noBraces` (ningún placeholder sin resolver).
Seeder `seed-clima-cascada-demo.ts` (4 perfiles: A Teatro · B Foco+exit · C Difuso/OBSERVACION
· D Patrón Sistémico DRIVER 2-flags+MOMENTUM). Gotcha: ninguna campaña real de la cuenta
dispara DRIVER (todas detect=0 salvo el demo) — el motor NO miente cuando no enriquece, no
había driver sistémico; D lo fuerza. Para re-sembrar: recuperar el seeder de `23835e1`.

**PENDIENTES NO BLOQUEANTES / seguimiento (hereda 4.5b o futuro):**
- **Variantes de un-solo-flag de DRIVER_SISTEMICO (flag A solo, flag B solo) — validadas
  por texto, NO por render en pantalla.** Quedaron cubiertas por (a) auditoría de texto
  completa (gramática + Reglas de Oro, aprobadas sin objeciones por el chat de contenido) y
  (b) smoke con assert de texto exacto (tests 14a/14b). NO se vieron renderizadas en pantalla
  real — a diferencia de Hotspot, Momentum y Driver A+B, que sí. Riesgo residual bajo (mismo
  mecanismo de interpolación ya probado en los otros 4 casos), pero explícito: si en producción
  aparece un problema de renderizado de DRIVER con un solo flag activo, revisar primero acá.
  Truncamientos: A-solo = `prefix+impact+"."`; B-solo = `prefix+fall+"."` (el cierre A+B
  "Cuando el factor más influyente…" nunca aparece con un solo flag). Frontera de oración
  compuesta por Code sobre fragmentos verbatim §3.
- DRIVER_SISTEMICO "sin relación jerárquica" no verificado (la respuesta no trae parentId).
- Umbrales de disparo editables en `THRESHOLDS` (TEATRO_MIN=2, DRIVER_MIN=2, MOMENTUM=−5pp,
  HOTSPOT `detectable≥3`) — tuning si un cliente real lo amerita.
- Portada/tokens visuales y CTAs de Acto→Lobby (deep-link a evidencia = 4.5b Cards).

**Sigue (4.5b):** `ClimaDimensionDetail` (3 capas) + Lobby Cards de hallazgo (Patrón G,
auto-selección) + Card sana + `ClimaToolbar` (8 dims, modal clon AvatarInfoModal).
Reutilizan el componente rico que nace validado en 4.5a. Detalle del plan 4.5b: resolución
de esquema al arrancar (ver plan aprobado de la sesión).

---

## Gate 5A — Planes de Acción (capa de datos) ✅ SELLADO (2026-07-10)

**Commit:** `ffce15f` (implementación código, 5 archivos) · sello (docs): este archivo +
MAESTRO v3.13. **Push manual de Victor** (pendiente). Plan aprobado: `~/.claude/plans/
shiny-coalescing-eagle.md` (Gate 5 completo, 4 sub-gates).

**Decisiones de Gate 0 (verificadas contra código, no asumidas):**
- Campo autorreporte del jefe → **entidad nueva `ClimaActionLog`** (5C): `ClimaFinding` no
  existe (efímero), `ActionPlan` aprobado es inmutable → choca con autorreporte posterior.
- Trigger del cruce de efectividad (5C) → **Seguimiento Focalizado = veredicto oficial**;
  Pulso Express = señal direccional secundaria marcada aparte (nunca fusionada).
- PDIEngine (5B) NO soporta clima → extensión **aditiva** (`climaContext?`, sin `db push`);
  `GapAnalysisInput` es TS puro; smoke de línea base ANTES de tocar (3 consumidores intactos).
- CTA2 Meta dura (5B) = **SIMPLE**: POST directo a `/api/goals` existente, sin fricción tipo
  Calibración, sin cascada. Cascada auto ("¿es de clima?") → `SEMILLA_META_CORPORATIVA_
  CLIMA_CASCADA.md`, fuera de Gate 5 (toca Metas/GoalCycle A–E).
- `calculateTurnoverCost` acepta `acotadoGroup` pero en Clima sigue 1.25× único; sin
  acoplamiento con Gate 5, no se activa.

**Qué quedó construido (5A):**
- `src/types/clima-planes.ts`: `ClimaDecisionItem` (shape MAESTRO 5A). **Severidad = las 4
  `RiskZone` YA selladas** (verde/amarilla/naranja/roja ⇄ Sano/Atención/Riesgo/Crítico vía
  `calcRiskZone`) — cero escala nueva. `ClimaDeptDecisionInput` deriva 1:1 de
  `DepartmentClimaInsight` (driverAnalysis + correlationFlags.businessCases).
- `src/lib/services/clima/ClimaInterventionDictionary.ts`: **32 celdas (8 dims Gate 1A × 4
  zonas)**, patrón zone-keyed de `ClimaNarrativeDictionary`. **CONTENIDO PROVISIONAL: las 32
  narrativas prefijadas `PROVISIONAL — ` (relleno estructural); el copy final lo escribe
  Victor/Studio IA aparte — NO listo para cliente.** `getIntervention(cat,zone)` + guard
  `isClimaDriverCategory`.
- `src/lib/services/clima/ClimaActionPlanBuilder.ts`: pura, `buildDeptClimaDecisions` /
  `buildClimaPlanDecisions`. 1 ítem por driver en zona de atención (verde excluido);
  `businessCase` CLP adjunto solo si PulseEngine lo disparó (clima_critico/liderazgo_gap),
  nunca inventado; responsable/plazo/validationMetric derivados por severidad; orden por
  severidad. Persiste vía POST genérico `moduleType='clima'`.
- **Fix RBAC:** `clima` en `PERMS_BY_MODULE` de `action-plans/[planId]/route.ts` (habilita
  GET detalle + PUT autosave del plan de clima). **Fix RBAC clima aplicado; verificación de
  los 3 roles (CEO/HR ven todo, AREA_MANAGER solo su gerencia, sin permiso→403) la valida
  Victor manualmente en la app antes de cerrar Gate 5 completo.**

**Evidencia:** smoke `smoke-clima-gate5a.ts` **24/24** — S1 diccionario 32 celdas sin vacíos +
todas PROVISIONAL; S2 business cases REALES de `buildBusinessCases`→`SalaryConfigService`
(rama rotación-real `peopleAtRisk=ceil(40·0.18)=8`, retencion_riesgo NO dispara con EI 3.5);
S3 mapeo real 6 dims→5 decisiones en 4 severidades (liderazgo/reconocimiento CRÍTICO con CLP
$144M; autonomia RIESGO; desarrollo amarilla→naranja por momentum −12pp; comunicacion
ATENCIÓN; **satisfaccion verde EXCLUIDA**), celda correcta por dim×zona, responsable/plazo por
severidad, orden por severidad, `triggerRef` estable. **Output real revisado por Victor** antes
de commitear. Smoke retirado al sellar (evidencia en `ffce15f`). `tsc --noEmit` + `next build`
EXIT 0.

**Gotchas / notas para 5B–5D:**
- El diccionario NO tiene copy final (32 PROVISIONAL) — bloquea "mostrar a cliente" hasta que
  Victor/Studio IA lo escriba. Marcado en código (`DICTIONARY_CONTENT_STATUS='PROVISIONAL'`).
- `ActionPlan` no tiene FK `departmentId` (usa `targetType`/`targetId`); el vínculo a depto de
  cada decisión vive dentro de `decisiones[].departmentId` (Json).
- Los business cases de PulseEngine son 3 tipos con severidad binaria (`critica|alta`); las 4
  severidades del plan salen de `calcRiskZone` sobre la favorabilidad del driver, NO del
  business case. El business case solo aporta el CLP cuando existe.

**Sigue (5B):** doble CTA — PDI aditivo (baseline primero) + Meta dura simple (POST a /goals).

---

## Gate 5B-i — PDIEngine extensión aditiva (el motor) ✅ SELLADO (2026-07-10)

**Commit:** `49ba0be` (implementación, 5 archivos) · sello (docs): este archivo + MAESTRO
v3.14. **Push manual de Victor** (pendiente). **Fasing:** 5B-i (el motor) primero, sellado,
ANTES de 5B-ii (los 2 CTAs que lo consumen) — decisión Victor, mismo patrón que Gate 3.

**Qué quedó construido (aditivo puro, sin `db push`):**
- `src/lib/types/pdi-suggestion.ts`: `ClimaCrossEvidence` + `climaContext?` (input) +
  `climaEvidence?` (output), **ambos OPCIONALES**. `GapAnalysisInput` es TS puro → no toca
  schema (confirmado Gate 0).
- `src/lib/data/clima-competency-mapping.ts`: mapeo **dimensión-clima → competencia 360°**
  (opción B). **CONTENIDO PROVISIONAL: el mapeo específico lo define Victor/Studio IA, NO se
  infiere** (mismo régimen que el diccionario 8×4 de 5A). Scaffold + fallback GENERIC + guard
  `CLIMA_COMPETENCY_MAPPING_STATUS='PROVISIONAL'`.
- `src/lib/services/PDISuggestionEngine.ts`: rama `climaEvidence` **GUARDADA por `climaContext`**
  (sin climaContext la clave NO se agrega → objeto idéntico al flujo 360) + helper
  `buildClimaGapInput(driver,fav,gap360?)` (puente de escala fav 0-100→mean 1-5 **también
  PROVISIONAL**).

**Hallazgo Gate 0 (documentado):** el motor NO es determinista — `selectCoachingTip` usa
`Math.random()` (`PDISuggestionEngine.ts:145`). El snapshot lo FIJA (mismo valor en ambas
corridas) para que la comparación antes/después sea válida — de otro modo fallaría por el RNG,
no por el código.

**Evidencia (requisito aditivo en 2 mitades):**
- **Snapshot antes/después BYTE-IDÉNTICO** (`sha256 cf5f860b8ff93eaa…`, diff vacío) sobre los 3
  consumidores × 4 gapTypes × 3 tracks (`generateSuggestions`) + `generateFromRoleFit` (RoleFit
  precomputado, sin BD) + `generateExecutiveSummary` → **Performance 360 / Sucesión intactos**.
- **Path clima smoke 10/10:** `buildClimaGapInput('liderazgo',45,-1.2)`→LEAD-TEAM, sugerencia
  con `climaEvidence`; mapeo PROVISIONAL + fallback GENERIC; **gap 360 puro sin climaContext →
  SIN clave `climaEvidence`** (aditividad probada in-situ).
- Ambos smokes (`snapshot-pdi-baseline.ts` + `smoke-pdi-clima.ts`) retirados al sellar (evidencia
  en `49ba0be`). `tsc --noEmit` + `next build` EXIT 0. Output real revisado por Victor.

**Nota para 5B-ii (CTA2 Meta dura):** POST directo a `/api/goals` reusa el **409 sellado de
Gate E** "sin ciclo ACTIVE → crear meta" (`goals/route.ts:329-336`, `2cd20a1`) — es
comportamiento INTENCIONAL, no hueco de diseño. Un cliente real con Metas tendrá ciclo activo;
la demo solo necesita sembrar un ciclo activo (fix de siembra). No requiere lógica nueva.

**Sigue (5B-ii):** los 2 CTAs que consumen el motor — PDI suave (endpoint que llama
`buildClimaGapInput` + persiste `climaEvidence`) + Meta dura simple (POST /goals). Luego 5C/5D.

---

## Gate 5B-ii — los 2 CTAs (consumidores del motor) ✅ SELLADO (2026-07-10)

**Commit:** `811c7dd` (implementación, 3 archivos) · sello (docs): este archivo + MAESTRO
v3.15. **Push manual de Victor** (pendiente).

**Gate 0 (verificado contra código):** el endpoint PDI existente `/api/pdi/generate-suggestion`
descarta `climaEvidence` y tiene ownership de jefe directo; `DevelopmentGoal` no tiene Json
libre; `POST /api/goals` exige ciclo ACTIVE (Gate E 409) y roles globales crean INDIVIDUAL a
cualquier empleado sin ser jefe. Decisiones Victor: **CTA1 = endpoint nuevo** (no extender);
**persistencia = campo de schema** (aplicando su marco: arquitectura correcta > agrupar en 5C).

**DESVIACIÓN DE SCHEMA documentada (marco Victor):** se agregó `DevelopmentGoal.climaEvidence
Json?` en 5B-ii (no en 5C). Justificación: aditivo + honesto (evidencia cruzada **por-goal**,
consultable) + evita deuda; `originGapAnalysis` es plan-level y un mismo plan mezcla goals de
clima y Performance → meterlo ahí sería forzar dato per-goal en Json ajeno. `db push` aplicado.

**Qué quedó construido:**
- **CTA1 — `POST /api/clima/pdi-suggestion` (nuevo):** RBAC `clima:manage`, **sin ownership de
  jefe directo** (se dispara desde el ActionPlan por RRHH); body `{employeeId, cycleId, driver,
  teamFavorability, gap360?}`; `buildClimaGapInput`→`generateSuggestions`→persiste
  `DevelopmentPlan` DRAFT + `DevelopmentGoal[]` con `climaEvidence` por-goal. **Idempotente y
  coexiste con Performance PDI** (borra solo goals de clima, `climaEvidence != null` filtrado en
  app; preserva 360/RoleFit). `cycleId` = FK a `PerformanceCycle` (el PDI es cycle-scoped).
- **CTA2 — SIN código nuevo:** reusa `POST /api/goals` tal cual (Gate E 409 intencional). Para
  la demo se siembra un ciclo activo (`GoalCycleService.createCycle+activate`, respeta advisory
  lock; ventanas assignment 2026-01-01 / closure 2026-12-31).

**CERO regresión:** `git diff` de `/api/pdi/generate-suggestion/route.ts` = **vacío** (Performance
PDI intacto, byte por byte — confirmado antes de sellar).

**Evidencia E2E `smoke-clima-gate5bii.ts` 12/12** (retirada al sellar): ejercita los HANDLERS
REALES vía `NextRequest` (headers x-user-*), **lee de vuelta de la BD** lo persistido y limpia
TODO por id (`$transaction`, deja la cuenta como estaba). Cuenta demo: Test Company (sin ciclo
activo → sembrado). CTA1 → PDI real, `DevelopmentGoal [LEAD-TEAM]` con `climaEvidence
{driver:liderazgo, teamFavorability:45, gap360:-1.2}`. CTA2 → Meta INDIVIDUAL real (target 75,
`originType MANAGER_CREATED`, `goalCycleId` = ciclo sembrado). `tsc` + `next build` EXIT 0.
- **Gotcha (no es código de clima):** el build falló primero por `.next` stale — la sesión
  paralela borró `goals/[id]/cascade/route.ts` en su refactor pero `.next/types/` conservaba el
  checker viejo; se limpió con `rm -rf .next` + rebuild.

**PENDIENTE de verificación manual de Victor (no cerrado por compilar):** RBAC del endpoint
nuevo `/api/clima/pdi-suggestion` (CEO/HR ven todo, AREA_MANAGER solo su gerencia, sin
permiso→403) — junto con el fix RBAC de `[planId]` (5A) y los gaps de RBAC del backlog, antes
de cerrar Gate 5 completo.

**Sigue (5C):** efectividad — `ClimaActionLog` (entidad nueva) + `ActionEffectivenessService`
(cruce Seguimiento Focalizado) + recordatorio `clima_action_reminder`. Luego 5D (Cinema Mode).
