# MAESTRO: FocalizaHR EX — Inteligencia de Clima
# Documento maestro ejecutable para Claude Code

> **Versión:** 3.6 — Gate 2 SELLADO (as-built)
> **Fecha:** Julio 2026
> **Estado:** En ejecución — Gate 1 ✅ · Gate 2 ✅ · Gate 3 siguiente

| Versión | Qué consolidó |
|---|---|
| v2.0 | Plan original 7 gates (sesión arquitectura junio 2026) |
| v3.0 | Correcciones julio: `category` en vez de driverCode, cierre enterprise, NPS nativo, driverScores Json, clave por período |
| v3.1 | Ecosistema clarificado: seguimiento focalizado exclusivo de Experiencia Full; Pulso Express sin seguimiento; mueren Estator/Rotor |
| v3.2.1 | Frescura = visibilidad (no promesa de cadencia); `isFollowUp` EN la clave de unicidad; carry-forward de drivers no medidos |
| v3.3 | Post-visión ejecutiva: theatreDetected, climaAggregationStatus, consent en Bajada, Smart Router, cruces Exit/Onb confirmados en schema |
| v3.4 | Autocontenido: modelo DepartmentClimaInsight completo inline, referencias externas eliminadas (patrones = código real) |
| v3.5 | Gate 1 sellado as-built: taxonomía real de BD (7-8 categorías, NO liderazgo/ambiente/desarrollo/bienestar), mecánica real de modify_text (SurveyConfiguration + textMapping por rating), decisiones Victor (preguntas al final, 1 follow-up por instrumento, categoría texto_libre) |
| v3.6 | Gate 2 sellado as-built: trigger real = PUT /status (no endpoint dedicado), DepartmentMetric confirmada (nombres reales absenceRate/overtimeHoursAvg), eNPS también dentro del insight, período = trimestre del endDate, S-PERF 17.340 responses en 9.070ms |

---

## PRINCIPIOS DE EJECUCIÓN

1. Cada gate se sella antes de avanzar. Victor aprueba, Code ejecuta.
2. `prisma db push` only. Nunca migrate dev.
3. `git add` file-specific. Nunca -A.
4. Narrativas las escribe Victor o Studio IA. Code las copia EXACTO.
5. Los cruces se ejecutan en background al cerrar campaña, con el patrón
   enterprise de Ambiente Sano (registro de agregación PENDING → COMPLETED /
   FAILED re-ejecutable). Frontend lee persistido.
6. Cero regresiones. La página genérica actual sigue funcionando intacta.
7. Este producto es el template. Lo que se construye aquí lo reutilizan todos los productos.

---

## ESTADO DE GATES

| Gate | Nombre | Estado |
|------|--------|--------|
| 1 | Foundation (Taxonomía + Persistencia + Seguimiento Focalizado) | ✅ SELLADO `28c9369`+`ec2694e`+`7cc04e3` (2026-07-06, smoke 40/40 + E2E filtro vivo) |
| 2 | Scoring + Aggregation (enterprise close pattern) | ✅ SELLADO `708791d`+`d2eee38` (2026-07-06, smoke 72/72 + S-PERF 17.340 responses en 9.070ms + E2E PUT /status vivo) |
| 3 | PulseEngine (5 Algoritmos + absorbe RetentionEngine) | 🔲 PENDIENTE |
| 4 | Frontend Cinema Mode | 🔲 PENDIENTE |
| 5 | Planes de Acción (doble CTA + validación impacto) | 🔲 PENDIENTE |
| 6 | Ecosistema + LLM Clima (Studio IA) | 🔲 PENDIENTE |
| 7 | Sistema Vivo + Bajada de Clima + Curva Vital | 🔲 PENDIENTE |

---

## CONTEXTO: EL ECOSISTEMA DE CLIMA (Experiencia Full + Pulso Express)

```yaml
EXPERIENCIA FULL — Medición profunda CON seguimiento:
  1. Se lanza la encuesta completa (35+ preguntas, todas las dimensiones)
  2. ClimaAggregationService calcula DepartmentClimaInsight por depto
  3. Los resultados identifican por departamento:
     - Top 2 dimensiones más bajas (< umbral configurable, default 3.0)
     - Top 1 dimensión más alta (> umbral configurable, default 4.0)
  4. 1-2 veces al año (configurable), se lanza OTRA campaña Experiencia
     Full con driverFocusByDepartment activo
  5. Esa campaña de seguimiento muestra SOLO las preguntas de las
     dimensiones bajas + la alta a cada departamento + EI siempre
  6. Mismas preguntas del mismo banco → comparabilidad perfecta
  7. El sistema valida si las intervenciones funcionaron
     y si las fortalezas se mantuvieron (erosión silenciosa)
  8. Close the loop: mide → diagnostica → interviene → re-mide → valida

PULSO EXPRESS — Termómetro rápido SIN seguimiento:
  1. 12 preguntas core (4 dimensiones × 3 preguntas) + EI
  2. Lo lanza el cliente cuando quiere, para lo que quiera
  3. SIN seguimiento posterior, SIN re-preguntar, SIN driverFocusByDepartment
  4. Es un termómetro puntual, no un sistema de monitoreo
  5. PERO es parte integral del ecosistema de clima:
     - Genera DepartmentClimaInsight (igual que Experiencia Full)
     - Alimenta gold cache (accumulatedClimaFavorability)
     - Sus resultados se comparan con Experiencia Full por dimensión
       (mismas categorías del banco real — ver TAXONOMÍA REAL en Gate 1A)
     - Aparece en la Curva Vital del Talento
     - Si la empresa tiene Experiencia Full en Q1 y Pulso Express en Q3,
       el CEO ve UNA línea de tiempo alimentada por ambos

COMPARACIÓN CROSS-PRODUCTO (posible y valiosa):
  Experiencia Full Q1: liderazgo (8 preguntas) → favorability 58%
  Pulso Express Q3:    liderazgo (3 preguntas) → favorability 65%
  Comparación: liderazgo subió 7pp entre Q1 y Q3
  (Diferente profundidad, misma dimensión, misma escala, misma fórmula)
  Es direccional ("liderazgo mejoró"), no precisión estadística.
  EI (5 preguntas en ambos) → comparabilidad absoluta para tendencia.

EL SEGUIMIENTO FOCALIZADO ES EXCLUSIVO DE EXPERIENCIA FULL:
  - driverFocusByDepartment solo se activa en campañas de seguimiento
  - El admin crea nueva campaña Experiencia Full → el sistema sugiere
    el filtro basado en DepartmentClimaInsight anterior → admin ajusta
  - El filtro muestra TODAS las preguntas de las categorías permitidas
    + TODAS las EI. No selecciona subset dentro de un driver.
  - Máximo real: depende de cuántas preguntas tengan los drivers
    seleccionados. Con 3 drivers activos: ~24 preguntas de drivers
    + 5 EI = ~29 (sigue siendo menos que 35+)
  - No hay isDriverCore ni rotorPriority para el filtro

FRESCURA DEL DATO:
  El dashboard muestra la fecha de la última medición por departamento.
  El sistema NO fuerza una cadencia. El cliente decide su ritmo.

  Si la empresa quiere dato más fresco entre mediciones de
  Experiencia Full, lanza un Pulso Express (que alimenta el
  ecosistema y se compara por dimensión).

  No es una promesa de cadencia. Es visibilidad de antigüedad.
```

---

## GATE 1: TAXONOMÍA + PERSISTENCIA + SEGUIMIENTO FOCALIZADO

> Foundation. Sin esto no hay driver analysis, ni benchmark por driver,
> ni seguimiento focalizado de Experiencia Full.

### 1A. Evolución modelo Question

**`driverCode` NO se crea.** `Question.category` ES la taxonomía de
drivers de todo el plan. Donde el plan v2 decía `driverCode`, se usa
`category`.

**TAXONOMÍA REAL (verificada en BD, jul-2026 — sellado v3.5):** las
categorías vivas NO son las 4 asumidas originalmente. Son:
- experiencia-full (35 core): satisfaccion(9), liderazgo(8), autonomia(5),
  desarrollo(4), crecimiento(4), comunicacion(3), reconocimiento(1),
  compensaciones(1)
- pulso-express (12 core): liderazgo(3), autonomia(2), crecimiento(2),
  satisfaccion(2), comunicacion(1), desarrollo(1), reconocimiento(1)
- + `engagement_index` (5 EI) y `texto_libre` (3 text_open) creadas en Gate 1

Todo el diseño (filtro, favorability, driverScores Json) es agnóstico al
número de categorías. La decisión de CONSOLIDAR la taxonomía (7-8 → menos)
es de negocio, pendiente en chat aparte — NO bloquea Gates 1-3.

```prisma
# AGREGAR a Question (opcionales, aditivos, zero breaking change):

questionTier    String?   @map("question_tier")
# 'ENGAGEMENT_INDEX' | 'CORE' | 'CUSTOM'

isDriverCore    Boolean   @default(false) @map("is_driver_core")
# RESERVADO: sin consumidor actual (el filtro del seguimiento no lo usa).
# Se mantiene para futura selección de anchor si se necesita.
# No eliminar — cuesta cero (Boolean default false).

isBenchmarkable Boolean   @default(true) @map("is_benchmarkable")

@@index([questionTier])
# category ya tiene índice (idx_questions_category)
```

### 1B. Banco de preguntas: mapeo + Engagement Index

```yaml
MAPEO DE LAS 47 EXISTENTES:
  TODAS las preguntas existentes de pulso-express (12) y
  experiencia-full (35) son CORE (benchmarkeables, estándar).
  CORE no significa "pocas" sino "validadas y comparables con benchmark".
  → updateMany: questionTier='CORE' (category se mantiene tal cual)

SE AGREGAN COMO NUEVAS — AS-BUILT Gate 1 (script idempotente
prisma/scripts/seed-clima-gate1.ts, npm run migrate:clima-gate1;
dry-run default, --apply, guard --allow-active por campañas activas):

  Ubicación: AL FINAL del banco (decisión Victor — cero renumeración).
  Orders: pulso 13-20 · experiencia 36-43.

  5 preguntas Engagement Index (questionTier='ENGAGEMENT_INDEX',
  category='engagement_index', al inicio del bloque nuevo):
    EI-1: "Me siento motivado/a por el trabajo que hago aquí" (isDriverCore=true)
    EI-2: "Recomendaría esta empresa como buen lugar para trabajar"
          → responseType='nps_scale', 0-10, labels "Nada probable" /
            "Extremadamente probable". NPSAggregationService la detecta.
    EI-3: "Me siento orgulloso/a de trabajar aquí"
    EI-4: "Me veo trabajando aquí dentro de 2 años"
    EI-5: "Rara vez pienso en buscar trabajo en otra empresa"

  1 follow-up text_open por instrumento (decisión Victor), anclado a EI-1:
    category='texto_libre', questionTier='CORE', isBenchmarkable=false,
    isRequired=false. Texto dinámico vía modify_text (ver 1E).

  2 text_open generales: category='texto_libre', questionTier='CORE',
    isBenchmarkable=false, isRequired=false.

  INVARIANTE: ninguna pregunta queda con questionTier null
  (47→CORE, 5 EI→ENGAGEMENT_INDEX, 3 text→CORE).

  CampaignType actualizado: questionCount 12→20 / 35→43;
  estimatedDuration 5→8 / 15→18 min.

  SurveyConfiguration (merge sin pisar): regla modify_text
  (EI-1 → follow-up, textMapping por rating "1".."5") + categoryConfigs
  para engagement_index y texto_libre (COPY PROVISIONAL, Victor edita en BD).
```

### 1C. Campo de seguimiento focalizado en Campaign

```prisma
# AGREGAR a Campaign (campo de Campaign, NO de CampaignType):

driverFocusByDepartment  Json?  @map("driver_focus_by_department")

# EXCLUSIVO de campañas de seguimiento de Experiencia Full.
# Pulso Express NUNCA lo puebla.
#
# Shape (los valores de low/high son valores REALES de Question.category):
# {
#   "dept_finanzas_id": {
#     "low": ["desarrollo", "comunicacion"],
#     "high": ["satisfaccion"],
#     "thresholds": { "low": 3.0, "high": 4.0 }
#   },
#   "dept_rrhh_id": {
#     "low": ["liderazgo"],
#     "high": ["autonomia"],
#     "thresholds": { "low": 3.0, "high": 4.0 }
#   }
# }
#
# Se auto-genera al crear la campaña de seguimiento leyendo el
# DepartmentClimaInsight anterior (suggestDriverFocus, ver 2B).
# Admin puede ajustar. Si null → campaña normal (todas las preguntas a todos).

# AGREGAR también a Campaign (estado del cierre enterprise, ver 2C):

climaAggregationStatus  String?  @map("clima_aggregation_status")
# Valores: null | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
# Se setea al cerrar campaña. Permite tracking y re-ejecución.
```

### 1D. Filtro de seguimiento en endpoint de encuesta

```typescript
# Agregar en src/app/api/survey/[token]/route.ts:142 (después de cargar questions):
# Solo se activa para campañas con driverFocusByDepartment poblado
# (seguimiento de Experiencia Full). Para el resto, no hace nada.

# AS-BUILT: helper puro src/lib/utils/climaFocusFilter.ts
# filterQuestionsByDriverFocus(questions, focusMap, departmentId)
# aplicado en el route DESPUÉS del filtro por performance track.
# Selects agregados: participant.departmentId + campaign.driverFocusByDepartment.

Categorías SIEMPRE incluidas: 'engagement_index' Y 'texto_libre'.
+ TODAS las preguntas de los drivers del foco (low + high).
Fallbacks seguros (todas las preguntas): focus null (Pulso Express),
depto no mapeado, participante sin departmentId.

# El filtro NO selecciona subset dentro de un driver.
# Verificado E2E en vivo (2026-07-06): campaña con foco
# {low:[liderazgo], high:[satisfaccion]} → 13/20 preguntas exactas.
```

### 1E. Follow-up condicional → modify_text (mecánica REAL, as-built)

```typescript
# MECÁNICA REAL (sellado v3.5 — corrige la asunción "ratingMapping con
# threshold" que no existía):
#
# - La regla vive en SurveyConfiguration.conditionalRules (Json por
#   campaignType), NO en Question. Shape:
#   { triggerQuestionOrder, targetQuestionOrder, type: 'modify_text',
#     textMapping: { "1": "...", "2": "...", "3": "...", "4": "...", "5": "..." } }
#
# - Runtime en useSurveyEngine.ts: extendido en Gate 1 para aceptar el
#   RATING como clave del textMapping (fallback retrocompatible —
#   Ambiente Sano sigue mapeando por choice):
#   key = choiceResponse[0] ?? String(rating)
#
# - La pregunta text_open de follow-up está SIEMPRE presente; solo cambia
#   su texto. Cero cambio en navegación ni en getTotalSteps.
```

### 1F. Modelo DepartmentClimaInsight (spec completa — autocontenida)

Decisiones clave encodeadas en el modelo:
- **Clave por período, no por campaña.** `isFollowUp` EN la clave (sellado
  v3.2.1): medición completa y seguimiento del mismo período coexisten
  sin pisarse. `productType` separa Experiencia Full de Pulso Express.
- **`driverScores Json`** en vez de columnas nombradas por driver (sellado
  v3.2): permite agregar/cambiar dimensiones sin migración de schema.
- `campaignId` es referencia opcional, NO clave.

```prisma
model DepartmentClimaInsight {
  id           String   @id @default(cuid())
  accountId    String   @map("account_id")
  departmentId String   @map("department_id")
  campaignId   String?  @map("campaign_id")   // referencia, NO clave

  // Período (patrón DepartmentExitInsight)
  period       String                          // "2026-Q1"
  periodStart  DateTime @map("period_start")
  periodEnd    DateTime @map("period_end")
  productType  String   @map("product_type")   // 'pulso-express' | 'experiencia-full'
  isFollowUp   Boolean  @default(false) @map("is_follow_up")
  // Medición completa Experiencia Full → false
  // Seguimiento focalizado Experiencia Full → true
  // Pulso Express → false (no tiene seguimiento)

  // Engagement Index
  engagementFavorability Float? @map("engagement_favorability") // % favorable EI (0-100)
  engagementMean         Float? @map("engagement_mean")         // Mean EI (1.0-5.0)

  // Scores por driver — Json, NO columnas nombradas
  driverScores Json? @map("driver_scores")
  // shape por driver: { fav, mean, n, carried, sourceDate? }
  // { "liderazgo": { "fav": 58, "mean": 3.2, "n": 28, "carried": false }, ... }
  // carried=true → carry-forward desde la última medición completa
  //                (n=0, sourceDate indica el período de origen)

  customDriverScores Json? @map("custom_driver_scores")
  // { "custom_innovacion": { "fav": 65, "mean": 3.8 } }

  // Driver Analysis pre-calculado (lo escribe Gate 3)
  driverAnalysis Json?   @map("driver_analysis") // DriverImpact[] (impact × gap)
  topFocusArea   String? @map("top_focus_area")  // driver con mayor priority
  topStrength    String? @map("top_strength")    // driver con mayor score + impact

  // Participación
  totalInvited      Int   @map("total_invited")
  totalResponded    Int   @map("total_responded")
  participationRate Float @map("participation_rate")

  // eNPS
  npsScore      Float? @map("nps_score")
  promotersPct  Float? @map("promoters_pct")
  detractorsPct Float? @map("detractors_pct")

  // Scores por nivel de cargo (privacy threshold por celda, ver 2B paso 5)
  acotadoGroupScores Json? @map("acotado_group_scores")
  // { "alta_gerencia": { fav, mean, n }, "base_operativa": { ... } }

  // Texto libre (output LLM Clima, lo escribe Gate 6)
  commentSentiment Json?   @map("comment_sentiment") // { positive, neutral, negative }
  commentTopics    Json?   @map("comment_topics")    // [{ topic, count, sentiment }]
  commentSummary   String? @map("comment_summary")

  // Cruce con datos duros (snapshot al momento de la medición)
  turnoverRateAtMeasurement    Float? @map("turnover_rate_at_measurement")
  absenteeismRateAtMeasurement Float? @map("absenteeism_rate_at_measurement")
  overtimeRateAtMeasurement    Float? @map("overtime_rate_at_measurement")
  incidentCountAtMeasurement   Int?   @map("incident_count_at_measurement")

  // Señales cross-producto (snapshot)
  exoScoreAtMeasurement Float? @map("exo_score_at_measurement") // Onboarding health
  eisScoreAtMeasurement Float? @map("eis_score_at_measurement") // Exit intelligence
  isaScoreAtMeasurement Float? @map("isa_score_at_measurement") // ComplianceAnalysis.isaScore

  // Inteligencia calculada
  riskZone         String? @map("risk_zone")         // verde | amarilla | naranja | roja
  momentum         Float?                            // delta fav vs anterior (solo drivers medidos)
  benchmarkDelta   Float?  @map("benchmark_delta")
  correlationFlags Json?   @map("correlation_flags") // theatreDetected, exitMotivesByDept, etc.

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  account    Account    @relation(fields: [accountId], references: [id], onDelete: Cascade)
  department Department @relation(fields: [departmentId], references: [id])
  campaign   Campaign?  @relation(fields: [campaignId], references: [id])

  @@unique([accountId, departmentId, period, productType, isFollowUp])
  @@index([accountId, departmentId])
  @@index([accountId, period])
  @@map("department_clima_insights")
}
```

### 1G. Gold cache en Department

```prisma
accumulatedClimaFavorability   Float?
accumulatedClimaMean           Float?
accumulatedClimaRiskZone       String?
accumulatedClimaLastUpdated    DateTime?
```

Nota ISA: NO se crea gold cache de ISA en Department. El snapshot ISA se
lee directo de `ComplianceAnalysis.isaScore` (scope DEPARTMENT) — ver 2B.

### 1H. Permisos clima

```yaml
# AuthorizationService.PERMISSIONS + PERMS_BY_MODULE en action-plans/route.ts
# Mismo patrón que compliance:view / compliance:manage:

clima:view: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER,
            HR_OPERATOR, CEO, AREA_MANAGER
clima:manage: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER,
              HR_OPERATOR
```

### 1I. acotadoGroup en participantes de clima

```typescript
# Copiar `acotadoGroup` y `standardJobLevel` desde Employee en
# EmployeeBasedParticipantGenerator.ts (select + create, ~6 líneas).
# NO agregar `performanceTrack` (concepto de Performance, no de clima).
# Sin migración (campos ya existen en Participant).
```

### Verificación Gate 1
```yaml
□ prisma db push sin errores
□ Seeds actualizadas: questionTier='CORE' en las 47 preguntas existentes
  (category intacta — NO existe driverCode)
□ 5 preguntas Engagement Index creadas (EI-2 como nps_scale 0-10)
□ 2 preguntas text_open + follow-ups condicionales creadas
□ DepartmentClimaInsight creado en BD (driverScores Json con carried,
  clave accountId+departmentId+period+productType+isFollowUp,
  campaignId referencia)
□ Gold cache clima en Department (sin gold cache ISA)
□ driverFocusByDepartment en Campaign (campo de Campaign, no de CampaignType)
□ climaAggregationStatus en Campaign (null/PENDING/RUNNING/COMPLETED/FAILED)
□ Filtro de seguimiento funciona: depto con foco recibe TODAS las preguntas
  de sus drivers + TODAS las EI; sin foco recibe todas; Pulso Express
  nunca filtra (campo null)
□ follow-up vía modify_text funciona (texto cambia según rating,
  cero cambio en navegación/getTotalSteps)
□ acotadoGroup + standardJobLevel copiados en generator employee-based
□ Permisos clima:* en AuthorizationService
□ ActionPlan API acepta moduleType='clima'
□ CERO regresiones
```

---

## GATE 2: SCORING + AGGREGATION

> El cerebro que calcula todo al cerrar campaña.

### 2A. FavorabilityCalculator

```typescript
# src/lib/services/clima/FavorabilityCalculator.ts
# Calcula favorability (% top-2) + mean (promedio 1-5) por driver
# Dual track: fullScore (core+custom) / coreScore (solo benchmark)
# Privacy threshold: configurable, default 5 respondentes mínimo
#
# GUARDIA NPS: filtrar explícitamente por
# Question.responseType === 'rating_scale' en la query de Response.
# El top-2 en escala 1-5 se rompe si entra un rating 0-10 (NPS).
# La pregunta NPS se procesa aparte por NPSAggregationService.
```

### 2B. ClimaAggregationService

```typescript
# src/lib/services/clima/ClimaAggregationService.ts
#
# Se ejecuta al cerrar campaña (ver 2C — patrón enterprise, NO process-results)
#
# 1. Leer responses agrupadas por departamento
# 2. Calcular favorability + mean por driver (FavorabilityCalculator)
# 3. Calcular Engagement Index (5 preguntas outcome)
# 4. Calcular eNPS: crear aggregateClimaNPS() clonando el patrón de
#    aggregateExitNPS() — descompone en 3 NIVELES (patrón exit):
#      1. Por gerencia (Department level 2): upsertNPSInsight con gerenciaId
#      2. Por departamento (level 3+): upsertNPSInsight con departmentId
#      3. Global (empresa): upsertNPSInsight con departmentId = null
#    Los 3 niveles dan granularidad departamental a la Curva Vital.
#    Usa Participant.departmentId directo (no JourneyOrchestration).
#    NO llamar a aggregateForProduct() (solo escribe global, TODO pendiente).
#    Patrón real EN CÓDIGO: aggregateExitNPS en
#    src/lib/services/NPSAggregationService.ts:472 y upsertNPSInsight (:152).
#    NPSInsight ya soporta productType 'pulso' | 'experiencia' con
#    departmentId nullable (schema.prisma:1229-1237) — cero cambio de schema.
# 5. Calcular scores por acotadoGroup (alta_gerencia, mandos_medios,
#    profesionales, base_operativa) usando Participant.acotadoGroup.
#    PRIVACY THRESHOLD (aplica a CADA celda): el threshold (default 5)
#    aplica tanto al departamento completo como a cada corte
#    depto × acotadoGroup. Si alta_gerencia de Finanzas tiene 2 personas,
#    NO se muestra su score separado (se incluye solo en el agregado
#    del depto). Misma regla que el corte departamental.
# 6. Snapshot datos duros desde DepartmentMetric más reciente por depto
#    (CONFIRMADO Gate 2: tabla poblada en dev — 12 filas jun-2026; carga
#     manual Excel del cliente; snapshot null-safe si no hay filas).
#    Nombres REALES de campos (as-built): turnoverRate→turnoverRateAtMeasurement,
#    absenceRate→absenteeismRateAtMeasurement (NO "absenteeism"),
#    overtimeHoursAvg→overtimeRateAtMeasurement (son HORAS promedio, no rate),
#    issueCount→incidentCountAtMeasurement.
# 7. Snapshot señales cross-producto: accumulatedExoScore, EIS.
#    ISA: leer directo de ComplianceAnalysis.isaScore (scope DEPARTMENT),
#    patrón loadPreviousDeptIsaScore() existente. Queda null si no hay
#    campaña Ambiente Sano cerrada para ese depto — aceptable.
# 8. Calcular momentum vs DepartmentClimaInsight anterior
#    (SOLO sobre drivers medidos en ambos períodos — nunca comparar
#     un driver medido con uno carried)
# 9. Upsert DepartmentClimaInsight por departamento, seteando isFollowUp:
#    - Medición completa Experiencia Full → false
#    - Seguimiento focalizado (driverFocusByDepartment poblado) → true
#    - Pulso Express → false
# 10. Actualizar gold cache en Department (rolling 12 meses)
#     SOLO con drivers medidos — los carried no cambian el
#     accumulatedClimaFavorability (que es del Engagement Index,
#     siempre medido)
# 11. suggestDriverFocus(): auto-generar driverFocusByDepartment sugerido
#     para la próxima campaña de seguimiento (solo Experiencia Full):
#     top 2 dims bajas (<threshold) + top 1 dim alta (>threshold) por depto.
#     Lee SOLO insights con isFollowUp=false (la línea base siempre
#     viene de mediciones completas)

# BENCHMARK DELTA (lectura en Gate 2 — la escritura vive en Gate 6C):
# Después de calcular driverScores:
#   Si existe MarketBenchmark con metricType='pulse_climate' para
#   la combinación país × industria × tamaño:
#     benchmarkDelta = engagementFavorability - benchmark.avg
#   Si no existe: benchmarkDelta = null (sin benchmark disponible)

# CARRY-FORWARD (solo al crear insight de seguimiento, isFollowUp=true):
# 1. Leer el último insight completo (isFollowUp=false) del mismo depto
# 2. Para cada driver NO incluido en driverFocusByDepartment:
#    - Copiar favorability y mean del insight completo
#    - Marcar en driverScores: { carried: true, sourceDate: "..." , n: 0 }
# 3. Para cada driver SÍ incluido: calcular desde las respuestas nuevas
#
# Shape resultante en driverScores Json:
# {
#   "desarrollo": { "fav": 62, "mean": 3.4, "n": 28, "carried": false },
#   "bienestar":  { "fav": 58, "mean": 3.1, "n": 28, "carried": false },
#   "ambiente":   { "fav": 78, "mean": 4.1, "n": 0,  "carried": true, "sourceDate": "2026-Q1" },
#   "liderazgo":  { "fav": 58, "mean": 3.2, "n": 0,  "carried": true, "sourceDate": "2026-Q1" }
# }
```

### 2C. Trigger de cierre: patrón enterprise Ambiente Sano

**`process-results` es código muerto** (se autodeclara "NO SE USA" en
route.ts:7). El wiring NO va ahí. El cierre de clima sigue el patrón
`ComplianceAnalysisOrchestrator`, NO el patrón simple de Performance
(status + CRON):

```
Admin click "Cerrar Campaña"
  → Status = completed, completedAt = now()
  → Campaign.climaAggregationStatus = 'PENDING'
  → ClimaAggregationService arranca (async, por departamento)
    → climaAggregationStatus = 'RUNNING'
  → Cada depto: calcula → persiste → progreso trackeable
  → Todos ok: climaAggregationStatus = 'COMPLETED', insights disponibles
  → Si falla: climaAggregationStatus = 'FAILED', admin ve cuál depto
    falló, re-ejecutable
  → Audit log con metadata completa (deptos procesados, insights generados)
```

Justificación: "Enterprise del día uno. No hay versión beta de decisiones
sobre personas." El patrón ya está probado en Ambiente Sano.

```typescript
# Aplica solo a clima:
# if (slug === 'pulso-express' || slug === 'experiencia-full') {
#   → crear registro de agregación + lanzar ClimaAggregationService
# }
```

**Backfill para pruebas:** ClimaAggregationService es re-ejecutable por
diseño (upsert idempotente). Para generar DepartmentClimaInsight de
campañas de prueba ya cerradas, ejecutar manualmente
`ClimaAggregationService.processClimaResults(campaignId)`.
No se necesita script de backfill separado.

### Verificación Gate 2
```yaml
□ Cerrar campaña genera DepartmentClimaInsight por cada depto
□ climaAggregationStatus transiciona PENDING → RUNNING → COMPLETED
□ Fallo parcial → climaAggregationStatus FAILED con depto identificado,
  re-ejecutable (re-run idempotente: upsert por clave de período)
□ Audit log con metadata (deptos procesados, insights generados)
□ Favorability + Mean correctos (verificar con datos de prueba)
□ FavorabilityCalculator excluye nps_scale (guardia responseType)
□ Engagement Index calculado separado de drivers
□ eNPS en 3 niveles: gerencia + departamento + global (aggregateClimaNPS)
□ Privacy threshold aplicado a cada celda depto × acotadoGroup
□ benchmarkDelta calculado (o null si no hay MarketBenchmark)
□ Scores por acotadoGroup calculados (brecha jefes vs base visible)
□ Snapshot datos duros y cross-producto capturados (ISA directo de
  ComplianceAnalysis, null aceptable)
□ Gold cache actualizado (solo con drivers medidos)
□ Momentum vs anterior calculado (solo drivers medidos en ambos períodos)
□ isFollowUp correcto: completa=false, seguimiento=true, Pulso=false
□ Carry-forward funciona: drivers no medidos en seguimiento copian
  fav/mean del último insight completo con carried=true + sourceDate
□ driverFocusByDepartment sugerido se genera automáticamente
  (solo aplicable a seguimiento de Experiencia Full; suggestDriverFocus
  lee solo insights con isFollowUp=false)
□ Performance: <10s para 1000 respuestas
□ CERO regresiones
```

### Gate 2 — AS-BUILT (sellado 2026-07-06, `708791d` + `d2eee38`)

```yaml
Archivos:
  src/lib/services/clima/FavorabilityCalculator.ts   # puro, sin I/O
  src/lib/services/clima/ClimaAggregationService.ts  # processClimaResults + suggestDriverFocus
  src/lib/services/NPSAggregationService.ts          # + aggregateClimaNPS (3 niveles)
  src/app/api/campaigns/[id]/status/route.ts         # trigger en toStatus=completed
  prisma/scripts/recompute-clima-insights.ts         # npm run recompute:clima-insights

Decisiones as-built (donde la realidad ajustó la spec):
  - TRIGGER REAL = PUT /api/campaigns/[id]/status (el cierre que usa el
    frontend vía useCampaignState/CampaignsList). NO hay endpoint dedicado
    de cierre clima. Síncrono en request (solo matemática, sin LLM);
    fallo de agregación NUNCA revierte el cierre (queda FAILED re-ejecutable).
  - PERÍODO insight = trimestre del endDate de la campaña ("YYYY-Qn",
    determinista → clave idempotente). NPSInsight = mes del endDate
    ("YYYY-MM", monthly-hardcoded de upsertNPSInsight; 2 campañas mismo
    productType mismo mes → last-wins, snapshot mensual aceptado).
  - eNPS TAMBIÉN dentro de DepartmentClimaInsight (npsScore/promotersPct/
    detractorsPct por depto, campos del schema Gate 1) CON privacy threshold;
    los NPSInsight 3 niveles NO llevan threshold (paridad con exit).
  - isFollowUp es POR CAMPAÑA (driverFocusByDepartment poblado, solo
    experiencia-full); drivers carried = categorías del baseline sin filas
    en esta campaña (data-driven, no solo el mapa de foco).
  - productType del insight = slug ('pulso-express'/'experiencia-full');
    productType NPS = 'pulso'/'experiencia'. Primer writer de esos enums
    (EfficiencyDataResolver deja de recibir null).
  - riskZone / driverAnalysis / topFocus* / comment* NO se escriben ni se
    pisan en el update del upsert (Gate 3 y Gate 6 escriben ahí).
  - S-PERF: fases paralelizadas (Promise.all en upserts por depto, niveles
    NPS y gold cache) + query madre con select mínimo (questionId plano,
    banco de preguntas aparte). Línea base: 17.340 responses / 1.020
    participantes / 12 deptos → 9.070ms (conexión directa dev→Supabase;
    en Vercel co-localizado la latencia por query baja ~10×).
  - suggestDriverFocus exportado y probado; wiring a creación = Gate 4/7.

Evidencia: smoke 72/72 PASS (borrado al sellar) + E2E vivo PUT /status
(insight 7 drivers reales + EI + NPS 3 niveles + gold cache + AuditLog,
re-run idempotente vía npm run recompute:clima-insights).
```

---

## GATE 3: PULSE ENGINE (5 Algoritmos)

> Transforma datos en diagnóstico + business case.
> **Absorbe RetentionEngine** (decisión sellada julio 2026).

### 3A-3E. Los 5 algoritmos

```yaml
ALG 1 — Driver Analysis (Impact × Gap):
  Pearson driver × EI → priority = impact × |gap|
  Classification: focus_area | strength | monitor | maintain

ALG 2 — Hotspot Detection:
  Deptos con engagementFav < p25 + headcount + correlación turnover

ALG 3 — Momentum Analysis:
  Delta favorability actual vs anterior
  Crisis (<-10pp) | Declining (<-5pp) | Stable | Growing (>+5pp)
  SOLO sobre drivers medidos en ambos períodos — un driver carried
  nunca entra al cálculo de momentum

ALG 4 — Dimension Gap Transfer:
  Depto campeón → depto rezagado por driver

ALG 5 — Correlación Clima × Rotación (el oro):
  Pearson engagement × turnover → business case CLP (SalaryConfigService)

FLAG ADICIONAL — theatreDetected (teatro de cumplimiento):
  Regla: ISA score > 70 (sano) + engagement favorability < 50 (bajo)
         para el mismo departamento = sospecha de teatro
  Fuente ISA: ComplianceAnalysis.isaScore (ya se snapshotea en 2B paso 7)
  Fuente clima: engagementFavorability del mismo DepartmentClimaInsight
  Persiste en correlationFlags
```

### 3F. Absorción de RetentionEngine

```
ANTES:
  SalaryConfigService → RetentionEngine (3 señales clima → CLP)
  SalaryConfigService → 7+ otros productos

DESPUÉS (Gate 3):
  SalaryConfigService → PulseEngine (5 algoritmos + todo lo de RetentionEngine)
  SalaryConfigService → 7+ otros productos
  RetentionEngine → DEPRECATED (cuando Cinema Mode reemplace results page)
```

SalaryConfigService es el motor financiero reusable de la plataforma
(8+ consumidores). RetentionEngine es un consumidor especializado, no un
motor financiero propio. La página actual de resultados con
`useRetentionAnalysis` sigue funcionando sin regresión hasta que
Cinema Mode (Gate 4) la reemplace.

### 3G. Persistir output

```typescript
# Output se guarda en DepartmentClimaInsight.driverAnalysis (Json)
# y en campos: topFocusArea, topStrength, riskZone, correlationFlags
# Se ejecuta como parte de ClimaAggregationService, NO en frontend
```

### Verificación Gate 3
```yaml
□ Driver Analysis calcula impact × gap correctamente
□ Focus areas priorizadas por impact×|gap|
□ Hotspots con headcount y correlación rotación
□ Momentum vs anterior (solo drivers medidos en ambos períodos,
  carried excluidos)
□ Correlación Pearson genera business case en CLP
□ theatreDetected en correlationFlags (ISA>70 + engagementFav<50)
□ Los 3 business cases de RetentionEngine (ambiente/retención/liderazgo)
  cubiertos por PulseEngine — sin doble fuente de cifras CLP
□ Todo persiste en DepartmentClimaInsight
□ Performance: <5s para 10 departamentos
```

---

## GATE 4: FRONTEND CINEMA MODE (Capas 1-3)

```yaml
CINEMA MODE + SMART ROUTER:
  La página de resultados de clima usa Cinema Mode (patrón Compliance).
  Smart Router decide qué vista mostrar según el rol del usuario:
  - CEO / ACCOUNT_OWNER: Lobby con narrativa → puede navegar a todas las secciones
  - HR_ADMIN / HR_MANAGER: Todas las secciones con todos los departamentos
  - AREA_MANAGER: Su departamento + hijos (filtrado por buildParticipantAccessFilter)
  - HR_OPERATOR: Vista lectura con departamentos asignados

  Skill: focalizahr-design (Cinema Mode obligatorio) — el mapping
  rol→vista de arriba es lo normativo
  (lectura opcional: .claude/tasks/FILOSOFIA_UX_SMART_ROUTER_v1_0.md)
```

### 4A. Hook orquestador

```typescript
# src/hooks/useClimaResults.ts
# Clonar estructura useComplianceData (60% reutilizable)
# pageState, campaign selector, navigation, Rail
#
# CLIMA_SECTIONS:
#   null         → Lobby/Summary
#   'heatmap'    → Heatmap drivers × deptos
#   'impact'     → Driver Analysis Impact × Gap
#   'correlacion'→ Scatter + Business Case
#   'comments'   → LLM Clima (si Gate 6 listo, sino placeholder)
#   'planes'     → Planes de acción (Gate 5)
```

### 4B. API resultados clima

```typescript
# GET /api/campaigns/[id]/clima-results
# Lee DepartmentClimaInsight[] + gold cache
# RBAC: AREA_MANAGER ve solo su gerencia
```

### 4C. Página + componentes

```yaml
Nueva ruta: /dashboard/campaigns/[id]/clima/page.tsx

COMPONENTES REUTILIZABLES (cross-producto):
  EngagementGauge        → Score gauge con zonas color
  FavorabilityBar        → Barra tricolor (favorable|neutral|unfavorable)
  HeatmapGrid           → Tabla color-coded (drivers × segmentos)
                           Drivers carried en gris claro con indicador
                           de fecha: "Ambiente 78% (dato de Q1, no
                           re-medido)". Drivers medidos en color normal.
  ImpactGapMatrix        → Cuadrante 2×2
  CorrelationScatter     → Scatter X=score Y=rotación
  BusinessCaseCard       → Costo + ahorro + ROI
  CrossSignalPanel       → Señales convergentes
  MomentumBadge          → Badge tendencia ↗↘→
  CurvaVitalTalento      → Timeline eNPS Onboarding→Cultura→Exit
                           Lee NPSInsight de 4 productTypes
                           (onboarding, pulso, experiencia, exit).
                           (a confirmar por Code: ¿NPSInsight de
                           onboarding y exit existe con granularidad
                           departamental o solo global?)
                           Muestra dónde la organización rompe la lealtad.
                           Va en Lobby del Cinema Mode Y en Torre de Control.
  AcotadoGapCard         → Brecha por nivel de cargo
                           "Jefes perciben 72%. Base operativa 38%."

REUTILIZAR existentes:
  PulseIndicatorGrid     → Cards métricas (quitar benchmark hardcodeado)
  ComparativeAnalysis    → Tabs análisis
  NPSGaugeCard           → eNPS
```

### Verificación Gate 4
```yaml
□ Cinema Mode navega entre secciones sin scroll
□ Lobby: EI gauge + focus areas + strengths + narrativa + CurvaVitalTalento
□ Heatmap: drivers × deptos con 3 modos (delta/absolute/benchmark)
  + drivers carried en gris claro con fecha de origen
□ Impact: cuadrante 2×2 correcto
□ Correlación: scatter + business case CLP
□ CurvaVitalTalento renderiza timeline eNPS (si hay datos cross-producto)
□ AcotadoGapCard muestra brecha jefes vs base
□ RBAC funciona
□ Performance: <1s (lee de DepartmentClimaInsight)
□ Mobile responsive (320px+)
□ Componentes son genéricos (no acoplados a clima)
```

---

## GATE 5: PLANES DE ACCIÓN (Capa 4)

### 5A. ClimaDecisionItem + Diccionario intervenciones

```yaml
Shape en ActionPlan.decisiones (Json):
  triggerRef, category, departmentId, favorability, gap, impact
  intervention: { level, narrative, steps[], businessCase }
  responsible: string       # "HRBP" | "Gerente de Área" | "CEO"
  deadline: string          # "2 semanas" | "30 días" | "90 días"
  validationMetric: string  # "Score liderazgo > 55% en seguimiento"
  ceoDecision: aceptar | modificar | rechazar
  ceoNotes (editable)
  (responsible/deadline: mismo patrón ExitAlertEngine.actionPlan.steps)

Diccionario: drivers × 4 niveles (nº de drivers según taxonomía REAL —
  ver Gate 1A; si la consolidación de negocio reduce categorías, el
  diccionario se dimensiona ahí, antes de Gate 5)
  Cada una: narrative + steps + suggestedProduct
  NARRATIVAS: Victor o Studio IA las escribe. Code copia EXACTO.
```

### 5B. Doble CTA: PDI (suave) + Meta (dura)

```yaml
CTA 1 — Sugerir DevelopmentGoal:
  Extiende PDISuggestionEngine con input de clima
  Evidencia cruzada: clima equipo + brecha 360°
  Manager acepta/rechaza
  Para: focus areas leves

CTA 2 — Asignar Goal medible:
  Meta de negocio: "Subir Liderazgo de 38% a 55% en Q3 2026"
  Con peso en evaluación anual
  Lo asigna CEO/HRBP desde ActionPlan (patrón calibración:
  sin ser jefe directo). La siguiente campaña de seguimiento
  valida si se logró.
  Para: departamentos en crisis
```

### 5C. Validación de impacto

```yaml
Cuando una campaña de seguimiento (Experiencia Full) cierra, el
ClimaAggregationService compara scores del driver intervenido vs el
plan de acción de la medición completa anterior:
  - Si Liderazgo subió de 38% a 55%: impactMeasured=true, impactDelta=+17pp
  - Si no mejoró: flag para re-evaluar intervención
  - ActionPlan se actualiza con el resultado de la validación
  - Close the loop completo y medible

Comparabilidad: el seguimiento usa las MISMAS preguntas del MISMO
CampaignType. Si liderazgo tenía 8 preguntas en la medición completa,
el seguimiento muestra esas mismas 8 → comparación 8 vs 8, perfecta.
El EI (5 preguntas, siempre presente) es la métrica longitudinal
absoluta para tendencia general.
```

### 5D. Sección Planes en Cinema Mode

```yaml
Tab 1: POR DEPARTAMENTO
  Cards con intervención + steps + business case + CEO decision
  CTAs cross-producto

Tab 2: POR PERSONA
  Managers con equipos en riesgo
  Doble CTA: PDI suave + Meta dura
  Evidencia cruzada

Tab 3: TRACKING
  Creadas | en progreso | completadas | vencidas
  Próxima validación: fecha de la próxima campaña de seguimiento
```

### Verificación Gate 5
```yaml
□ ActionPlan moduleType='clima' persiste correctamente
□ Autosave 3 capas funciona
□ CEO puede aceptar/modificar/rechazar
□ CTA PDI crea DevelopmentGoal con evidencia cruzada
□ CTA Meta crea Goal medible (asignable sin ser jefe directo)
□ Business case por depto con SalaryConfigService
□ Validación impacto funciona cuando la campaña de seguimiento cierra
  + ActionPlan actualizado con el resultado
□ Plan se puede aprobar (inmutable después)
```

---

## GATE 6: ECOSISTEMA

### 6A. Fix ConvergenciaEngine
```
Migrar de campaignResults.departmentScores (no se persiste, bug)
a Department.accumulatedClimaFavorability (gold cache persistido)
```

### 6B. ExitAlertEngine contexto clima
```
En alertas Exit, mostrar último DepartmentClimaInsight del depto
```

### 6C. Benchmark pulse_climate
```
BenchmarkAggregationService: calculateClimaBenchmarks()
metricType='pulse_climate', cascada GLOBAL → JOB_LEVEL → COMBINATORIA

NOTA: este gate crea la ESCRITURA del benchmark (alimenta MarketBenchmark).
La LECTURA (benchmarkDelta) se hace en Gate 2B al cerrar campaña —
si MarketBenchmark aún no existe, benchmarkDelta queda null.
```

### 6D. InsightEngine reglas clima
```
healthy_climate: score > benchmark + 0.5 → positive
declining_climate: score < benchmark - 0.3 → improvement
```

### 6E. LLM Clima (Claude API) — Spec de Studio IA

```yaml
Motor de diagnóstico sistémico-operativo. NO es análisis de sentimiento.

3 lentes:
  1. Fricción Sistémica vs Liderazgo: diferencia si el problema es del
     líder o del sistema. Protege a buenos líderes.
  2. Say-Do Gap: detecta cinismo corporativo ("hablan de balance pero
     exigen correos a las 10 PM").
  3. Locus de Control: mide si el equipo habla con agencia ("necesitamos
     herramientas") o resignación ("acá nunca cambia nada").

Doble output:
  - Macro (CEO): tono consultoría estratégica, conecta con operaciones
  - Táctico (Jefe de Área): tono coach, comportamientos del lunes

JSON Schema y System Prompt diseñados por Studio IA.
Payload = DepartmentClimaInsight (ya diseñado).
Se ejecuta en background, persiste en DepartmentClimaInsight.
Privacy: n≥10 para mostrar por depto.
```

### 6F. Torre de Control widget clima
```
Widget que muestra accumulatedClimaFavorability por depto
con riskZone color-coded. Lee gold cache (~20ms).
```

### 6G. Señales cross-producto — Fase 2A
```yaml
PulseEngine calcula SI los datos existen; flags booleanos persisten
en DepartmentClimaInsight.correlationFlags (Json):
  - RoleFit del manager (Performance 360°)
  - Sesgo de calibración (Mano Blanda/Dura, CalibrationEngine)
  - GoalCompletionRate (cumplimiento alto + bienestar bajo = burnout)
  - turnoverCost (SalaryConfigService)
  - Antigüedad (Employee.hireDate)
  - exitMotivesByDept: motivos de salida frecuentes por depto.
    CONFIRMADO por investigación (jul-2026): el dato YA está persistido
    en DepartmentExitInsight.topExitFactors (schema:1515, lo escribe
    ExitAggregationService en CRON mensual desde ExitRecord.exitFactors).
    Solo CABLEAR la lectura — no recrear el cruce.
    (a confirmar por Code: que el CRON mensual esté poblando en
    cuentas reales y la alineación de períodos)
  - onboardingAbandonRate: tasa abandono temprano por depto.
    CONFIRMADO por investigación (jul-2026): derivable directo de
    DepartmentOnboardingInsight.abandonedJourneys / totalJourneys
    (schema:1008-1012); avgEXOScore en el mismo modelo (schema:1021).
    Solo CABLEAR la división — no recrear agregación.
```

### Verificación Gate 6
```yaml
□ ConvergenciaEngine lee gold cache (no JSON blob)
□ ExitAlertEngine muestra contexto clima
□ Benchmark pulse_climate se calcula
□ InsightEngine genera insights clima
□ LLM Clima genera doble output (macro CEO / táctico jefe) con 3 lentes
□ Señales Fase 2A en correlationFlags (solo si datos existen)
□ Torre de Control muestra widget clima
□ CERO regresiones en módulos existentes
```

---

## GATE 7: SISTEMA VIVO + COMUNICACIÓN (post-lanzamiento)

> Este gate convierte el producto en algo que ningún competidor tiene.

```yaml
PRERREQUISITO Gate 7:
  message-dispatcher debe estar en vercel.json (P0 pendiente de
  Comunicaciones v3). Sin esto, la Bajada de Clima no puede enviarse.
```

### 7A. Seguimiento diferenciado automático (Experiencia Full)
```
Extender audienceRule con criterio departmentId + category
para que cada depto reciba sus preguntas de seguimiento
automáticamente sin necesidad de ajuste manual de
driverFocusByDepartment. Solo aplica a campañas de seguimiento
de Experiencia Full. Evolución natural del filtro del Gate 1D.
```

### 7B. Bajada de Clima (Comunicación de Resultados)
```yaml
Editor:
  - Gerente de Personas abre "Comunicar Resultados"
  - Ve resultados generales pre-cargados
  - Selecciona 5-10 temas relevantes
  - Por cada tema: resultado real + plan comprometido
  - Puede editar narrativas (narrativasEdit pattern)

Generador:
  - PDF o HTML visual con:
    "Esto dijeron ustedes" → resultados reales
    "Esto nos preocupa" → focus areas con datos
    "Esto vamos a hacer" → planes con responsable y fecha
    "Esto celebramos" → fortalezas reconocidas
    "Así lo vamos a medir" → próxima medición en X meses

Envío:
  - Se envía por el canal donde el colaborador tiene consentimiento activo.
  - Correos corporativos: no requieren consent adicional
  - WhatsApp: requiere opt-in (ConsentEvent, Comunicaciones v3)
  - El envío pasa por determineChannel() del channel-selector
  - Nunca se envía a un canal sin consent
  - El alcance real depende del consentimiento, no de "todos"
  - Template nuevo en catálogo
  - Objetivo: alcanzar al 70-80% que no tiene correo (cajeros, aseo,
    operarios) — condicionado a su opt-in WhatsApp

Validación en la siguiente medición de clima:
  - "¿Conoces los resultados de la última medición?" → Sí/No
  - "¿Sientes que la empresa actuó?" → Likert
  - Mide si la bajada funcionó. Close the loop completo.
```

### 7C. Encuesta conversacional (evolución futura)
```
Solo para text_open en WhatsApp.
Claude API hace follow-up en momento de captura.
Complementario al sistema condicional, no reemplazo.
```

### 7D. Señales cross-producto — Fase 2B
```yaml
  - Distribución de estrellas por depto (Performance)
  - GoalAlignment % (metas alineadas a corporativas)
  - PLTalentService (clasificación talento × costo)
  - Pasivo laboral por antigüedad
  (a confirmar por Code: EvaluatorBiasDetector como servicio consumible)
```

### Verificación Gate 7
```yaml
□ Seguimiento diferenciado (Experiencia Full) funciona automáticamente
  por departamento
□ Editor de Bajada permite seleccionar temas y editar narrativas
□ PDF/HTML se genera correctamente con datos reales
□ Envío WhatsApp + Email funciona
□ Pregunta de validación en la siguiente medición funciona
□ Señales Fase 2B en correlationFlags
```

---

## SEÑALES CROSS-PRODUCTO FASE 2 (mapa completo)

### Cruces mapeados desde motores existentes
```yaml
Performance 360°:
  - CalibrationEngine sesgo (Mano Blanda/Dura)
  - RoleFit del manager
  - Distribución de estrellas por depto
  - EvaluatorBiasDetector por depto

Metas:
  - GoalAlignment % (metas alineadas a corporativas)
  - GoalCompletionRate (cumplimiento alto + bienestar bajo = burnout)
  - MissedDeadlines %

Compensation:
  - Equity ratio por depto
  - BonusTalentFactor diferenciación

AI Exposure:
  - focalizaScore promedio por depto
  - augmentationShare (automatable vs augmentable)
```

### Cálculos financieros existentes reutilizables
```yaml
  - SalaryConfigService.calculateTurnoverCost() (8+ consumidores)
  - SalaryConfigService.getEffectiveSalary() (fallback 3 niveles)
  - RetentionEngine costSpectrum (proyección rotación — se absorbe en Gate 3)
  - PLTalentService (clasificación talento × costo)
  - Pasivo laboral por antigüedad (Employee.hireDate)
```

### Persistencia
`DepartmentClimaInsight.correlationFlags Json` guarda flags booleanos
por cada cruce detectado. PulseEngine los calcula SI los datos existen.

### Señales "a confirmar por Code" (verificar existencia real antes de cablear)
```yaml
  - turnoverRate por departamento en DepartmentMetric (¿poblado en cuentas reales?)
  - absenteeismRate por departamento (¿existe?)
  - NPSInsight departamental para onboarding y exit (¿o solo global?)
  - EvaluatorBiasDetector (¿existe como servicio consumible?)
  - BonusTalentFactor (¿existe en CompensationBoard?)
  - Equity ratio por depto (¿calculable desde datos actuales?)

CONFIRMADOS por investigación (jul-2026) — NO requieren verificación:
  - DepartmentExitInsight.topExitFactors: SÍ persiste motivos de salida
    por depto (schema:1515, ExitAggregationService CRON mensual)
  - DepartmentOnboardingInsight.abandonedJourneys/totalJourneys +
    avgEXOScore: SÍ persisten (schema:1008-1022)
```

### Prioridad
```
Fase 2A (Gate 6): RoleFit, sesgo, GoalCompletionRate, turnoverCost,
                  antigüedad, exitMotivesByDept, onboardingAbandonRate
Fase 2B (Gate 7): distribución estrellas, GoalAlignment, PLTalent, pasivo laboral
Fase 2C (post-launch): Equity ratio, BonusTalent, focalizaScore
```

---

## INVESTIGACIÓN DE MERCADO (resumen ejecutivo)

### White space confirmado (Google Deep Research, 70+ fuentes)
- Nadie hace cruce causal automático cross-módulo
- Nadie conecta plan de equipo con PDI del manager
- Nadie personaliza el instrumento de re-medición por departamento
- Predicción individual está rota → diagnosticar por equipo con business case
- La medición es commodity. Las capas 2-4 son el diferenciador.

### Competidores clave
- PeopleE3: más cercano a nuestra visión (agente Atri, IDC tracking, nómina)
- CultureMonkey: WhatsApp + manager action + benchmark (no cruza productos)
- Culture Amp / Qualtrics / Peakon: Capa 1 excelente, Capas 2-4 parciales
- Buk / Rankmi: dominan transaccional LATAM, sin analítica causal

### Dolor #1 del mercado
"Los empleados se vuelven cínicos no porque les preguntas, sino porque
después no pasa nada." — Engagement global cayó a 20% en 2025.
$10T en productividad perdida (Gallup). La Bajada de Clima (Gate 7)
ataca exactamente esto.

---

## ORDEN DE EJECUCIÓN

```
Gate 1 (Foundation)      → 1 sesión Code (~3h)
Gate 2 (Scoring + close enterprise) → 1 sesión Code (~3h)
  ↓ PAUSA: Victor valida datos de prueba
Gate 3 (PulseEngine + absorbe RetentionEngine) → 1-2 sesiones Code (~4h)
  ↓ PAUSA: Victor valida algoritmos
Gate 4 (Frontend)        → 2-3 sesiones Code (~6h)
  ↓ PAUSA: Victor valida UX
Gate 5 (Planes)          → 1-2 sesiones Code (~4h)
  ↓ PAUSA: Narrativas de Victor/Studio IA
Gate 6 (Ecosistema + LLM Clima) → 1-2 sesiones Code (~3h)
  ↓ PRODUCTO BASE LIVE
Gate 7 (Sistema Vivo)    → 2-3 sesiones Code (~6h)
  ↓ PRODUCTO COMPLETO

TOTAL: ~9-14 sesiones Code, ~25-30h desarrollo
```

---

## REFERENCIAS — SOLO SKILLS Y CÓDIGO (ningún documento es requerido)

```yaml
SKILLS (cargar ANTES de implementar el gate que aplique):
  focalizahr-api          → todo endpoint (RBAC + multi-tenant)
  focalizahr-design       → todo componente (Cinema Mode, Gate 4-5)
  focalizahr-narrativas   → textos ejecutivos (Gates 4-7)
  focalizahr-notificaciones → toasts/feedback UI
  focalizahr-benchmark    → Gate 6C

PATRONES EN CÓDIGO (la fuente es el código real, no docs):
  useComplianceData.ts                    → hook Cinema Mode (clonar, Gate 4A)
  DepartmentExitInsight (schema.prisma)   → patrón insight por período
  ComplianceAnalysisOrchestrator          → cierre enterprise (Gate 2C)
  NPSAggregationService.aggregateExitNPS:472 + upsertNPSInsight:152 → Gate 2B
  ExitAlertEngine                         → responsible/deadline en planes
  BenchmarkAggregationService             → Gate 6C
  PDISuggestionEngine                     → Gate 5B
  PositionAdapter                         → acotadoGroup

LECTURAS OPCIONALES (existen en el repo; NO requeridas para ejecutar):
  .claude/tasks/DIAGNOSTICO_FLUJO_CLIMA_RESULTADO.md   → mapa file:line del flujo actual
  .claude/tasks/VISION_EJECUTIVA_EX_CLIMA_v2.md        → visión de producto
  .claude/tasks/FILOSOFIA_UX_SMART_ROUTER_v1_0.md      → filosofía UX (Gate 4)
  .claude/tasks/Sistema_NPS_FocalizaHR_IMPLEMENTACION.md → guía frontend NPS (Gate 4)
```
