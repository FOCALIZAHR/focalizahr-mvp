# MOTORES DE INTELIGENCIA — FOCALIZAHR v1

> **Mismo nivel de importancia que `MANIFIESTO_FOCALIZAHR_v5.md`.**
> Fuente de verdad sobre qué inteligencia tiene la plataforma.
>
> **Versión:** 1.1 · **Fecha:** 2026-05-06
> **Alcance:** 8 módulos · 60+ motores y servicios · 20 narrativas individuales · 6 patrones AAE per-persona · 5 patrones LLM compliance · 4 cuadrantes Goals × Performance · 5 diagnósticos diferenciales P&L Talent · 8 narrativas span × 4 detectores convergencia interna · 5 alertas compliance · 8 intervenciones determinísticas

---

## Estado de verificación (v1.1)

Documento construido en dos fases:

**Fase 1 (v1.0):** investigación inicial mediante 3 agentes Explore + lectura directa de archivos críticos. Generó borrador con afirmaciones específicas (números, fórmulas, listas).

**Fase 2 (v1.1, esta versión):** segunda pasada de verificación quirúrgica abriendo cada archivo crítico y comparando contra el código real. Correcciones aplicadas:

| # | Sección | Lo que decía v1.0 | Estado real | Acción |
|---|---------|-------------------|-------------|--------|
| 1 | Performance 360° pesos | "Self=0%, Manager=60%, Peer=25%, Upward=15%" como cálculo aplicado | Pesos definidos en `FOCALIZAHR_DEFAULT_WEIGHTS` config, pero `getEvaluateeResults()` usa **promedio simple** (gap config↔consumer) | ✅ Corregido — clarifica que es config declarada, no aplicada |
| 2 | SLAs alertas Compliance | liderazgo_toxico=24h, deterioro=72h, silencio/senal_ignorada=MEDIUM 96h | liderazgo_toxico=**48h**, deterioro=**168h**, silencio + senal_ignorada=**informativa SLA null** | ✅ Corregido contra `complianceAlertConfig.ts` |
| 3 | Span óptimo | gerente_director=4-8, jefe=5-15, supervisor=6-20, 4 niveles | **3-6 / 5-10 / 8-14**, **7 niveles** granulares (incluye profesional, asistente, operativo) | ✅ Corregido contra `src/types/span.ts:164-172` |
| 4 | Span arquetipos | "Director / Manager / Supervisor / Coordinator" | **"Player/Coach / Coach / Supervisor / Facilitator / Coordinator"** | ✅ Corregido |
| 5 | Densidad gerencial | PESADA_MIN=0.14, PLANA_MAX=0.10 | PESADA_MIN=**0.15**, PLANA_MAX=**0.08** | ✅ Corregido |
| 6 | Frontend `/dashboard/workforce/` | "no existe" | Existe extensivamente | ✅ Corregido en sección "Estado de implementación" |
| 7 | OccupationResolver LLM | "BLOQUEADO por ANTHROPIC_API_KEY" | Implementado con fallback elegante; funciona si key set | ✅ Corregido |
| 8 | Lentes Efficiency | "L4/L5/L7/L9 en LenteCard legacy" | Solo L7L8 sigue legacy | ✅ Corregido |
| 9 | AutomationClassificationService dominanceThreshold | No mencionado / 0.4 | **0.15** — bajo eso, "Asistencia híbrida" | ✅ Agregado |

### Verificado contra código directo (alta confianza)
- ✅ ConvergenciaEngine v2 — Motor A casos A1-A5, thresholds, niveles
- ✅ ISAService — pesos 60/25/15, 70/30, 100, niveles 80/60/40
- ✅ detectTeatroCumplimiento — thresholds 4.0 / 0.6
- ✅ SafetyScoreService — fórmula, inversión P4/P8, privacy ≥5, risk levels
- ✅ InterventionEngine — 8 intervenciones con plazos y métricas (incluye r=-0.436, 3.6×)
- ✅ ComplianceAlertConfig — 5 tipos con SLAs y severities canónicas
- ✅ TalentNarrativeService — 20 narrativas con headlines y urgencias literales
- ✅ TalentIntelligenceService — Test Ácido AAE discreto, ROLE_FIT_HIGH=75
- ✅ PersonExposureNarrativeService — 6 casos AAE con thresholds canónicos
- ✅ RoleFitAnalyzer — fórmula Capped Average línea 131-132
- ✅ ManagerVarianceService — thresholds 0.5 / 1.0
- ✅ GoalsDiagnosticService — `GOALS_THRESHOLDS` con todos los números
- ✅ GoalsSynthesisEngine — 6 diagnósticos + thresholds + prioridad
- ✅ ExecutiveSynthesisEngine — 5 diagnósticos + thresholds + prioridad fija
- ✅ OnboardingIntelligenceEngine — fórmula EXO Bauer + retention risk
- ✅ AIExposureService — `HIGH_EXPOSURE_THRESHOLD = 0.5` + cascada focalizaScore→betaScore
- ✅ AutomationClassificationService — IPI fórmula + pesos dims + 7 clasificaciones + 6 perfiles
- ✅ WorkforceIntelligenceService — 5 primeros detectores verificados (zombies, flightRisk, redundancy, adoptionRisk, seniorityCompression). Detectores 6 (InertiaCost) verificado. Resto (7-10) reportado por agente, no re-verificado quirúrgicamente.
- ✅ SpanIntelligenceService — rangos McKinsey, densidad, modos, narrativas
- ✅ SuccessionConstants — ROLEFIT_THRESHOLD=75, READY_NOW<10, READY_1_2<25, BENCH_STRENGTH_RULES
- ✅ CalibrationBonusFactors — STARS=1.25 / HIGH=1.15 / CORE=0.90 / NEUTRAL=0.70 / RISK=0.00
- ✅ BenchmarkAggregationService — `onboarding_exo` + `performance_rolefit` (no `exposure_ia`)
- ✅ OccupationResolver v3 — modelo claude-haiku-4-5 + quota 200/mes + fallback elegante

### Reportado por agente, no re-verificado quirúrgicamente (confianza media)
- ⚠️ ComplianceNarrativeEngine — los 6 artefactos del reporte (estructura general OK, detalles internos no leídos línea por línea)
- ⚠️ ComplianceAnalysisOrchestrator — flujo async de 3 fases (lógica general OK, retries y persistence no re-leídos)
- ⚠️ MetaAnalisisLLMService — 6 outputs LLM (estructura confirmada vía complianceTypes, prompt no re-leído)
- ⚠️ PatronesLLMService — buckets de intensidad 0.2/0.4/0.6/0.8/0.95 y reglas de densidad semántica (vinieron del prompt del LLM según el agente)
- ⚠️ WorkforceIntelligenceService detectores 7-10 (LiberatedFTEs, Severance, RetentionPriority, ProductivityGap)
- ⚠️ SuccessionDiagnosisEngine — 10 casos de diagnosis con narrativas
- ⚠️ InsightEngine — 11 reglas RoleFit + 4 EXO×JOB_LEVEL + reglas universales
- ⚠️ TalentActionService TAC — 3 acciones (NOTIFY_HRBP / SCHEDULE_COMMITTEE / FLAG_FOR_REVIEW), email Resend
- ⚠️ evaluatorStatsEngine — 4 estilos (ÓPTIMA / INDULGENTE / SEVERA / CENTRAL)
- ⚠️ RetentionEngine — fuentes SHRM/Gallup/McKinsey/Deloitte/HBR (declaración inline en código verificada en cabecera)
- ⚠️ EfficiencyCalculator + EfficiencyNarrativeEngine — fórmulas internas

### Sin verificar (decisiones de tono, no afirmaciones específicas)
- ⚪ Sección "Combinaciones de motores que generan insights únicos" — son interpretaciones, no claims técnicos.
- ⚪ Sección "Motores sin equivalente en el mercado" — comparación con Culture Amp/Rankmi/Workday/SAP basada en conocimiento general, no en investigación competitiva formal.
- ⚪ "Frases CEO" — son sintetizaciones narrativas, no se extraen literal del código.

**Lección operacional:** el documento de Motores debe re-verificarse contra código cada vez que se actualicen thresholds o se agreguen detectores nuevos. La sección "Verificado contra código directo" es la base confiable; las marcadas ⚠️ requieren validación adicional antes de usarse en propuesta comercial con números específicos.

---

---

## TABLA RESUMEN EJECUTIVO

| # | Motor | Archivo | Módulo | Output principal | Frase CEO |
|---|-------|---------|--------|------------------|-----------|
| 1 | **SafetyScoreService** | `services/SafetyScoreService.ts` | Ambiente Sano | Score 1-5 + dimensiones P2-P8 | "Cada dimensión es una lente. Un 3.2 promedio puede esconder un 2.0 en liderazgo." |
| 2 | **PatronesLLMService** | `services/compliance/PatronesLLMService.ts` | Ambiente Sano | 5 patrones culturales (intensidad 0-1) | "Cuando dicen 'todo bien' pero el lenguaje grita 'mejor no hablar', el LLM ve lo que el Likert no." |
| 3 | **MetaAnalisisLLMService** | `services/compliance/MetaAnalisisLLMService.ts` | Ambiente Sano | Patrón cultural dominante org | "Si 5 de 8 deptos comparten el patrón, no es aislado — es característica del sistema." |
| 4 | **ISAService** | `services/compliance/ISAService.ts` | Ambiente Sano | Índice 0-100 (Likert + LLM + convergencia) | "El GPS del diagnóstico — escucha lo que ven (Likert) y lo que dicen (LLM) cruzado." |
| 5 | **detectTeatroCumplimiento** | `services/compliance/detectTeatroCumplimiento.ts` | Ambiente Sano | Boolean | "Cuando puntúan 4.5 pero el 70% dice 'mejor no hablar', es teatro." |
| 6 | **ConvergenciaEngine v2** | `services/compliance/ConvergenciaEngine.ts` | Ambiente Sano | Motor A interno (5 casos) + Motor B externo + memoria histórica | "Si 2 deptos del mismo gerente caen simultáneamente, no es coincidencia — es liderazgo." |
| 7 | **ComplianceAlertService** | `services/compliance/ComplianceAlertService.ts` | Ambiente Sano | 5 tipos alerta con severity + SLA | "Si las señales de hace 3 meses vuelven, es patrón cíclico — no evento aislado." |
| 8 | **InterventionEngine** | `services/compliance/InterventionEngine.ts` | Ambiente Sano | Plan consolidado (8 intervenciones) | "Una intervención bien elegida resuelve el 65% — más adherencia, menos costo." |
| 9 | **ComplianceNarrativeEngine** | `services/compliance/ComplianceNarrativeEngine.ts` | Ambiente Sano | 6 artefactos del reporte | "Lo revelador no son los promedios — son las contradicciones." |
| 10 | **ComplianceAnalysisOrchestrator** | `services/compliance/ComplianceAnalysisOrchestrator.ts` | Ambiente Sano | Orquesta jobs LLM async per-dept + ORG | "Procesa por depto en paralelo, espera todos antes de diagnosticar el conjunto." |
| 11 | **PerformanceResultsService** | `services/PerformanceResultsService.ts` | Performance 360° | Score consolidado 4 evaluadores | "Pesos config Self=0/Manager=60/Peer=25/Upward=15. Cálculo actual: promedio simple (gap config↔consumer)." |
| 12 | **CompetencyScoreService** | `services/CompetencyScoreService.ts` | Performance 360° | Score por competencia + categoría | "Los 4 lentes (CORE, LEADERSHIP, STRATEGIC, TECHNICAL) cuentan historias distintas." |
| 13 | **RoleFitAnalyzer** | `services/RoleFitAnalyzer.ts` | Performance 360° | Score 0-100 + gaps por competencia | "23% de brechas de capacidad vs lo que el negocio exige. Las peores: comunicación ejecutiva." |
| 14 | **TalentIntelligenceService** | `services/TalentIntelligenceService.ts` | Talent | 4+4 cuadrantes (riesgo + movilidad) | "Cada persona se cruza en dos ejes: dónde está hoy y para dónde quiere ir." |
| 15 | **TalentNarrativeService** | `services/TalentNarrativeService.ts` | Talent | **20 narrativas individuales** con urgencia | "El perfil más costoso de perder es el sucesor natural con compromiso crítico." |
| 16 | **TalentRiskOrchestrator** | `services/TalentRiskOrchestrator.ts` | Talent | Cross-domain (Goals × Talent × Engagement) | "Cuántas personas no dominan el cargo Y cumplen metas. Esa contradicción es el hallazgo." |
| 17 | **TalentActionService** | `services/TalentActionService.ts` | Talent | Acciones registradas con feedback intelligence | "TAC — Talent Action Center. Email a gerente, comité, flag. Auditable." |
| 18 | **CalibrationService** | `services/CalibrationService.ts` | Calibración | Selector multi-criterio (jobLevel/family/directReports/customPicks) | "Quién entra al comité de calibración — y quién no." |
| 19 | **ManagerVarianceService** | `services/ManagerVarianceService.ts` | Calibración | Varianza stdDev por gerencia (BAJA/MEDIA/ALTA) | "En Ventas, 3 jefes con varianza ALTA: uno da 3.8 promedio, otro 2.4. Calibrar." |
| 20 | **ManagerFeedbackGenerator** | `services/ManagerFeedbackGenerator.ts` | Performance 360° | Feedback ejecutivo per-evaluador | "Lo que el evaluador ve vs lo que el sistema mide." |
| 21 | **9-Box Matrix** | `config/performanceClassification.ts` | Performance | 9 posiciones (3×3) | "STAR, HIGH_PERFORMER, GROWTH_POTENTIAL... 9 cajas para 9 conversaciones distintas." |
| 22 | **SuccessionService** | `services/SuccessionService.ts` | Sucesión | Candidatos elegibles + readiness | "RoleFit≥75 + 9-box elegible. Readiness: AHORA / 1-2 años / 3+ años / NO." |
| 23 | **SuccessionDiagnosisEngine** | `services/SuccessionDiagnosisEngine.ts` | Sucesión | 10 casos de diagnosis + acción sugerida | "Conversación de retención, proyecto crítico, exposición al directorio, rotación lateral." |
| 24 | **PDISuggestionEngine** | `services/PDISuggestionEngine.ts` | Sucesión | Sugerencias plan desarrollo individual | "Qué necesita aprender, en qué plazo, con qué apoyo." |
| 25 | **OnboardingIntelligenceEngine** | `engines/OnboardingIntelligenceEngine.ts` | Onboarding | EXO Score 0-100 (Bauer) + risk + trayectoria | "EXO = 0.20 Compliance + 0.30 Clarification + 0.25 Culture + 0.25 Connection." |
| 26 | **OnboardingAlertEngine** | `engines/OnboardingAlertEngine.ts` | Onboarding | Alertas por journey crítico | "Si Día 7 no es claro, los Día 90 colapsan." |
| 27 | **OnboardingEffectivenessAnalyzer** | `services/OnboardingEffectivenessAnalyzer.ts` | Onboarding | Análisis efectividad por cohorte | "Qué aporta el ritual vs qué solo dilata el reloj." |
| 28 | **OnboardingBenchmarkService** | `services/OnboardingBenchmarkService.ts` | Onboarding | Benchmark EXO vs mercado | "Tu EXO está en percentil 40 de tu industria — diagnostica antes que el primer día." |
| 29 | **ExitAlertEngine** | `engines/ExitAlertEngine.ts` | Exit | Alertas por exit register (severity + SLA) | "Salida toxica, brecha de talento, leadership signal." |
| 30 | **ExitIntelligenceService** | `services/ExitIntelligenceService.ts` | Exit | EIS Score 0-100 + categorización causa | "Quién sale, por qué se va, y qué dejaba detrás." |
| 31 | **ExitAggregationService** | `services/ExitAggregationService.ts` | Exit | EIS por dept (gold cache 12m) | "Su EIS departamental rolling 12 meses dice más que el promedio del año." |
| 32 | **RetentionEngine** | `engines/RetentionEngine.ts` | Exit/Retención | Business cases con transparencia financiera CFO-ready | "Único en el mercado con cálculo SHRM/Gallup/McKinsey paso a paso." |
| 33 | **AIExposureService** | `services/AIExposureService.ts` | Workforce/IA | focalizaScore + automation/augmentation share por cargo | "Qué cargos puede asumir la IA — discreto Eloundou (0/0.5/1)." |
| 34 | **AutomationClassificationService** | `services/AutomationClassificationService.ts` | Workforce/IA | 7 clasificaciones legacy + 6 perfiles label | "Reemplazo directo, asistencia con feedback, validación humana — IPI Index." |
| 35 | **WorkforceIntelligenceService** | `services/WorkforceIntelligenceService.ts` | Workforce | 10 detectores: zombies, flightRisk, redundancy, adoption risk, seniority compression, inertia cost, liberatedFTEs, severance, retention priority, productivity gap | "Inertia cost mensual + FTEs liberables + severance liability — el P&L del talento." |
| 36 | **PersonExposureNarrativeService** | `services/PersonExposureNarrativeService.ts` | Workforce | **6 casos AAE** (TALENTO_CRITICO_MOVER, NO_REEMPLAZO, BRECHA_CORE_HUMANO, NUCLEO_INTOCABLE, FUGA_INMINENTE, OPERACION_ESTABLE) | "Por persona: 6 patrones cerrados, no 27. Cyan/amber/slate." |
| 37 | **SpanIntelligenceService** | `services/SpanIntelligenceService.ts` | Efficiency | 8 narrativas span × densidad gerencial × pirámide | "MICRO-equipo siempre rojo. Sobre-equipo+optima+metas altas: líder de alta capacidad." |
| 38 | **EfficiencyCalculator** | `services/efficiency/EfficiencyCalculator.ts` | Efficiency | IPI × automationShare × headcount | "FTE liberables — capital atrapado en operación que la IA puede asumir." |
| 39 | **EfficiencyNarrativeEngine** | `services/efficiency/EfficiencyNarrativeEngine.ts` | Efficiency | Narrativa lente × estado | "Cada lente (L1-L9) es un quirófano de decisión, no un dashboard." |
| 40 | **GoalsService** | `services/GoalsService.ts` | Goals/Metas | CRUD metas + cálculo cumplimiento | "Quién creó la meta, quién la aprueba, en qué plazo." |
| 41 | **GoalRulesEngine** | `services/GoalRulesEngine.ts` | Goals/Metas | Validaciones de meta (nivel, owner, scope) | "COMPANY/AREA/INDIVIDUAL: cada nivel tiene reglas distintas." |
| 42 | **GoalsDiagnosticService** | `services/GoalsDiagnosticService.ts` | Goals/Metas | **4 cuadrantes Goals × Performance** + 5 narrativas valor + correlación Pearson | "Bono sin respaldo, talento invisible, fuga productiva, no sabe vs no quiere." |
| 43 | **GoalsSynthesisEngine** | `services/GoalsSynthesisEngine.ts` | Goals/Metas | **6 diagnósticos diferenciales** | "Evaluador, concentración, estrellas en riesgo, framework, alineado, desalineamiento generalizado." |
| 44 | **ExecutiveSynthesisEngine** | `services/ExecutiveSynthesisEngine.ts` | P&L Talent | **5 diagnósticos** (LIDERAZGO, CONCENTRACIÓN, ANTIGÜEDAD_SENIOR, RECAMBIO, GENERIC) | "Este no es problema de cultura. Es problema con responsable identificado." |
| 45 | **ExecutiveNarrativeService** | `services/ExecutiveNarrativeService.ts` | Narrativas | Narrativas org-level por módulo | "Tono McKinsey + Apple. Directo, sin jerga RRHH, gerente a gerente." |
| 46 | **PLTalentService** | `services/PLTalentService.ts` | Workforce | Brecha productiva + semáforo legal + breakeven | "Tienes 2.3 personas en brechas. $1.2M/mes. Breakeven en 4 meses." |
| 47 | **IntelligenceInsightService** | `services/IntelligenceInsightService.ts` | Performance | Insights persistentes con baselineValue + nextEvaluationAt | "Memoria del CEO entre ciclos — qué prometiste seguir, qué pasó." |
| 48 | **InsightEngine** | `services/InsightEngine.ts` | Benchmarks | 11 reglas RoleFit + EXO×JobLevel + reglas universales | "Top performer, above avg, aligned, below avg, critical — todas con context." |
| 49 | **BenchmarkAggregationService** | `services/BenchmarkAggregationService.ts` | Benchmarks | Aggregación 3 combinatorias (GLOBAL + JOB_LEVEL + area×cargo) | "Privacy threshold + cascada especificidad: tu cargo, tu industria, el mercado." |
| 50 | **OccupationResolver v3** | `services/OccupationResolver.ts` | Workforce | Router (simples→algo, compuestos→LLM) + batch transaction | "17 cargos pendientes de resolución LLM (bloqueado: ANTHROPIC_API_KEY)." |
| 51 | **JobDescriptorService** | `services/JobDescriptorService.ts` | Descriptores | CRUD descriptores + by-title enrichment | "Qué exige el cargo (CompetencyTarget) — la otra mitad del RoleFit." |
| 52 | **PositionAdapter** | `services/PositionAdapter.ts` | Workforce | Mapeo position → standardJobLevel | "Normaliza 'Gerente Senior' → 'gerente_director' contra McKinsey ladder." |
| 53 | **DepartmentAdapter** | `services/DepartmentAdapter.ts` | Org | Categorización departamentos (standardCategory) | "Ventas, Operaciones, Tech, Soporte — taxonomía cross-cliente." |
| 54 | **SalaryConfigService** | `services/SalaryConfigService.ts` | Workforce | Salary por accountId + finiquito + replacementCost | "Default Chile + override per-account. Auditable CFO-ready." |
| 55 | **NPSAggregationService** | `services/NPSAggregationService.ts` | Survey | NPS agregado + categorización | "Promotores, pasivos, detractores — pulse del cliente interno." |
| 56 | **PatternDetector** | `services/PatternDetector.ts` | Survey | Patrones cross-question | "Quién contradice qué — anomalías en respuestas." |
| 57 | **AnalyticsService** | `services/AnalyticsService.ts` | Survey | Aggregación campaign-level | "Qué dijo el conjunto — sin nombres, sin trazabilidad." |
| 58 | **AggregationService** | `services/AggregationService.ts` | Survey | Aggregación normalizada | "responseValueMapping + normalizedScore — única fuente de verdad." |
| 59 | **FeedbackIntelligenceService** | `services/FeedbackIntelligenceService.ts` | Talent | Inteligencia post-acción TAC | "Qué pasó después de que el gerente tomó la acción." |
| 60 | **StrategicFocusService** | `services/StrategicFocusService.ts` | Talent | Foco estratégico cross-módulo | "Dónde poner la energía esta semana." |
| 61 | **evaluatorStatsEngine** | `lib/utils/evaluatorStatsEngine.ts` | Calibración | Estadísticas evaluador (ÓPTIMA, INDULGENTE, SEVERA, CENTRAL) | "Cómo evalúa cada jefe — perfil estadístico auditable." |
| 62 | **EmployeeSyncService** | `services/EmployeeSyncService.ts` | Org | Sync empleados (HRIS-ready) | "Punto de entrada del talento — donde nacen los datos." |

---

## I. AMBIENTE SANO / LEY KARIN

### 1. SafetyScoreService

- **Archivo:** `src/lib/services/SafetyScoreService.ts`
- **Input:** Respuestas Likert P2-P8 normalizadas (Response.normalizedScore + Question.responseValueMapping). Excluye P1 (texto abierto, va al LLM) y P6 (branching UX-only sin normalizedScore).
- **Lógica:**
  - P2 (seguridad), P3 (disenso), P5 (equidad), P7 (liderazgo): directo Likert 1-5.
  - P4 (microagresiones), P8 (agotamiento): **INVERTIDAS** (`6 - avg`). 5.0 = óptimo, 1.0 = peor.
  - Fórmula: `safetyScore = Σ(avg_invertido_por_pregunta) / N` (N = dims presentes, renormalización dinámica con console.warn si falta alguna).
  - **Privacy threshold:** n<5 respondentes → skipped (`reason='privacy_threshold_not_met'`).
- **Output:** `SafetyScoreResult` con `orgScore`, `departments[]` (cada uno con `safetyScore`, `riskLevel`, `dimensionScores` ya invertidas), `skipped[]`. Risk levels: `safe` ≥3.0 / `risk` 2.5-3.0 / `critical` <2.5.
- **Desglose género:** `buildGenderBreakdown()` si ≥5 respondentes de cada género.
- **Frase CEO:** "Cada dimensión es una lente del mismo fenómeno. Un 3.2 promedio que viene de '2.0 liderazgo + 4.5 equidad' cuenta una historia muy distinta que '3.0 en todo'."

### 2. PatronesLLMService (LLM #1, per-departamento)

- **Archivo:** `src/lib/services/compliance/PatronesLLMService.ts`
- **Input:** P1 anonimizada por depto (n≥5 para privacy).
- **5 patrones culturales detectados** (estricto, sin invención):
  1. `silencio_organizacional` — evasión, voz pasiva, desconexión.
  2. `hostilidad_normalizada` — condescendencia, gritos naturalizados.
  3. `favoritismo_implicito` — inequidad por cercanía al poder.
  4. `resignacion_aprendida` — futilidad ("así es aquí", "no cambiará").
  5. `miedo_represalias` — mención explícita a consecuencias (despidos, aislamiento).
- **Buckets de intensidad ESTRICTOS:** 0.2 (leve) / 0.4 (moderado-bajo) / 0.6 (moderado-alto) / 0.8 (grave) / 0.95 (crítico).
- **Origen percibido (MECE, 4):** `vertical_descendente` / `horizontal_pares` / `sistemico_procesos` / `indeterminado`.
- **Lente de género OBLIGATORIO:** detecta paternalismo, desestimación, rol de cuidado. Si activa: `evidencia_genero` (≤8 palabras literal con `[CENSURADO]`) + `analisis_genero`.
- **Reglas de densidad semántica:**
  - **Filtro ruido vacío:** texto<30 palabras + solo evasivas → `confianza='insuficiente_data'`, patrones=[].
  - **Lexical override:** texto breve + 1+ frase de alta valencia psicológica → patrón con intensidad≤0.4, confianza='media'.
- **Output:** `PatronAnalysisOutput` con `patrones[]` (max 5) + `senal_dominante` + `confianza_analisis` (alta/media/baja/insuficiente_data) + `alerta_sesgo_genero` + fragmentos (max 3, ≤8 palabras, censurables).
- **Frase CEO:** "Cuando un equipo dice 'todo está bien' pero el lenguaje está lleno de 'mejor no hablar' y 'nadie va a decir nada', el LLM ve lo que el Likert no: la verdad detrás del silencio."

### 3. MetaAnalisisLLMService (LLM #2, una sola vez por campaña)

- **Archivo:** `src/lib/services/compliance/MetaAnalisisLLMService.ts`
- **Input:** Resúmenes de cada depto post-PatronesLLM (`MetaAnalysisDepartmentInput[]`).
- **Detecta:**
  1. `patron_cultural_dominante`: patrón que se repite en 3+ deptos o "ninguno".
  2. `origen_organizacional`: `vertical_descendente` / `horizontal_pares` / `sistemico_procesos` / **`mixto`** / **`indeterminado`** (5 valores org-level vs 4 dept-level).
  3. `focos_rojos_count`: deptos con safetyScore<2.5 OR patrón_intensidad≥0.7.
  4. `teatro_detectado_count`.
  5. `hallazgo_narrativo_portada`: frase ≤200 chars, sin jerga, sin prescripción.
  6. `es_problema_cultural`: true si ≥50% deptos comparten patrón.
- **Output:** `MetaAnalysisOutput`.
- **Frase CEO:** "Si 5 de 8 departamentos reportan 'miedo a represalias' como señal dominante, no es problema aislado — es característica del sistema que hay que rediseñar."

### 4. ISAService — Índice de Salud del Ambiente

- **Archivo:** `src/lib/services/compliance/ISAService.ts`
- **Función:** Calcula índice integrado **0-100** que combina voz estructurada (Likert), voz libre (LLM), convergencia (cross-instrumentos).
- **3 componentes con pesos dinámicos:**
  - **Voz estructurada (60% / 70% / 100%):** Promedio P2-P8 (1-5) → escala 0-100. Si teatro=true: ×0.7.
  - **Voz libre (25% / 30% / 0%):** LLM intensidad promedio invertida × 100. Si confianza='insuficiente_data': omitida. Si patrones=[] + confianza alta: 100.
  - **Convergencia (15% / 0%):** Solo si ≥2 instrumentos activos. 0 señales=100, 1=75, 2=50, 3=25, 4=0.
- **Niveles:**
  - ISA ≥80: `saludable` ("El ambiente funciona. Monitorear.")
  - ISA 60-79: `observacion` ("Hay señales. No ignorar.")
  - ISA 40-59: `riesgo` ("Problemas confirmados. Actuar.")
  - ISA <40: `critico` ("Convergencia de señales. Urgente.")
- **Frase CEO:** "El ISA es el score único que escucha lo que ven los empleados (Likert) Y lo que dicen cuando hablan (LLM) Y cómo se confirma entre fuentes."

### 5. detectTeatroCumplimiento

- **Archivo:** `src/lib/services/compliance/detectTeatroCumplimiento.ts`
- **Lógica:** `teatro = (safetyScore ≥ 4.0) AND (max(patrones.intensidad) ≥ 0.6)`.
- **Output:** boolean. Penaliza ISA en 30% si true.
- **Frase CEO:** "Cuando un departamento puntúa 4.5/5 en seguridad pero el 70% de respuestas dice 'mejor no hablar', es teatro. La métrica está midiendo cumplimiento, no realidad."

### 6. ConvergenciaEngine v2 (3 fases)

- **Archivo:** `src/lib/services/compliance/ConvergenciaEngine.ts`
- **Spec:** `.claude/tasks/SPEC_CONVERGENCIA_ENGINE_v2_FINAL.md`

#### Motor A v2 — Convergencia Interna (5 casos)

| Caso | Condición | Severidad |
|------|-----------|-----------|
| **A1** | ISA<50 + (silencio>0.4 OR miedo>0.4 OR hostilidad>0.5) | Acumula |
| **A2** | teatro=true + (dim<2.5 OR algún patrón>0.3) | **OBLIGA `nivel='critica'`** |
| **A3** | alerta_sesgo_genero=true + P2_seguridad<2.5 | Acumula |
| **A4** | delta ISA entre deptos del mismo manager ≥30 + minISA<50 | Cross-dept patch |
| **A5** | ISA≥75 + teatro=true + silencio>0.5 ("todo bien, nada lo es") | **OBLIGA `nivel='critica'`** |

**Mapeo casosActivos → nivel:**
- A2 o A5 presentes → `critica`
- ≥3 casos → `critica`
- 2 casos → `multiple`
- 1 caso → `simple`
- 0 → `ninguna`

#### Motor B v2 — Convergencia Externa (Fase 2 + Fase 3)

- **EIS signal:** EIS ≥60=0, 40-59=1, <40=2.
- **EXO signal:** EXO ≥70=0, 50-69=1, <50=2.
- **PesoAlertas:** suma `pesoEfectivo = pesoBase × factorDecaimiento` de Exit + Onboarding alertas.
  - **Fase 2 (activas):** factor=1.0 para `pending` / `acknowledged`.
  - **Fase 3 (memoria histórica):** factor decae para `resolved` / `dismissed`:
    - 1.0 = activas
    - 0.6 = <3 meses
    - 0.3 = 3-6 meses
    - 0.1 = >6 meses
- **Rama A (riesgo_convergente):** (ISA<50 OR teatro) + (≥1 casoA OR externalRiskScore≥1.2 OR alertaCritica OR sesgo_genero).
- **Rama B (riesgo_convergente):** ISA 50-74 + ≥2 casosA + externalRiskScore≥3.0.
- **fallaCicloDeVida:** ISA<50 AND (eisSignal≥2 OR exoSignal≥2).

#### Niveles globales

- `sin_riesgo` / `bajo` (1 señal) / `medio` (2 señales) / `convergente` (3+ señales) / `critico` (criticalSafety + ≥2 señales)

#### Globals

- `activeSourcesGlobal`: instrumentos contratados activos.
- `criticalByManager`: grupos de deptos del mismo manager con delta ISA ≥30 (privacy: managerId solo como key, frontend lee solo departmentIds).

- **Frase CEO:** "Cuando dos o más departamentos bajo el mismo gerente tienen caídas simultáneas en el Índice de Seguridad (ISA), y las salidas recientes corroboran esos números, no es coincidencia — es un patrón de liderazgo. Actuar en la ventana de 30 días evita concentración."

### 7. ComplianceAlertService — 5 alertas determinísticas

- **Archivo:** `src/lib/services/compliance/ComplianceAlertService.ts`
- **5 tipos de alerta:**

| Tipo | Severity | SLA | Trigger principal |
|------|----------|-----|-------------------|
| `riesgo_convergente` | **high** | **72h** | Rama A o Rama B Motor B |
| `liderazgo_toxico` (5 ramas A-E) | **critical** | **48h** | A2 + (P3<2.5 OR P7<2.5) / origen_vertical + (silencio>0.6 OR miedo>0.6) + P7<2.5 / peso_concentracion≥1.2 + dim<2.8 / peso_toxic_exit≥2.0 + P7<3.0 / cross-dept criticalByManager |
| `silencio_organizacional` | **informativa** | **null** (sin SLA) | silencio>0.4 + P2<2.5 / teatro / caso A5 |
| `deterioro_sostenido` (Fase 3) | **high** | **168h** | ISA<65 + previousISA≠null + ISA≤previo + (alertas_6m_weight≥0.9 OR motorA_previo) + sin más severa |
| `senal_ignorada` (Fase 3) | **informativa** | **null** (sin SLA) | previousISA≠null + ISA≤previo + peso_cicloAnterior_cerrado>0 |

**Fuente:** `src/config/complianceAlertConfig.ts:37-83` (canónico). Severities: `critical / high / medium / low / informativa`. Solo 2 tipos tienen severity ≥ high con SLA hard.

- **Idempotente** per (tipo + depto + campaña).
- **Frase CEO:** "Si un departamento reportó señales hace 3 meses, las cerró, y hoy vuelven a aparecer, es patrón cíclico — no es evento aislado."

### 8. InterventionEngine — 8 intervenciones consolidables

- **Archivo:** `src/lib/services/compliance/InterventionEngine.ts`
- **Catálogo (8 intervenciones, todas con base científica):**
  1. `FAST_FEEDBACK` — sesiones semanales 10-15 min (3-6m, 3.6× motivación)
  2. `PSYCH_SAFETY_MODELING` — líder modela vulnerabilidad (8-10m)
  3. `BYSTANDER_INTERVENTION` — entrenamiento desescalada (3-6m)
  4. `HIGH_FREQ_PULSES` — encuestas semanales (inmediato, detecta 4-8 sem antes)
  5. `DISSENT_INSTITUTIONALIZATION` — rol "abogado del diablo" rotativo (2-3 trim)
  6. `PROSOCIAL_ACTIVITIES` — voluntariado corporativo (6-12m)
  7. `DECISION_ACCOUNTABILITY` — calibración colegiada (3-6m, r=-0.436)
  8. `WORK_REDESIGN` — círculos diálogo + rutinas post-incidente (3-6m)
- **Lógica:** matriz dimensión × nivel → top-3. Si una intervención aparece ≥2 veces entre triggers → "consolidated" (alto apalancamiento).
- **Frase CEO:** "Una sola intervención bien elegida (ej. feedback semanal) resuelve el 65% de los problemas — mayor adherencia, menos costos, retorno más rápido."

### 9. ComplianceNarrativeEngine — 6 artefactos del reporte

- **Archivo:** `src/lib/services/compliance/ComplianceNarrativeEngine.ts`
- **Artefactos:** Portada (titular + delta vs ciclo previo) · Acta (anclaje + metodología) · Artefacto 1 (6 dimensiones) · Artefacto 2 (top 5 patrones) · Alertas género · Artefacto 3 (convergencia per-dept con "contradicción protagonista") · Cruce Narrativa (5 ramas org-level cuando activeSourcesGlobal≥2) · Patrón de liderazgo (1 línea / múltiples líneas mando) · Artefacto 4 (5 alertas) · Cierre.
- **Vocabulario PROHIBIDO:** "acoso", "hostigamiento", "denuncia", "Ley Karin", "seguridad psicológica", "psicosocial", "Safety Score", "EXO", "LLM", "convergencia", "deberías", "se recomienda".
- **Frase CEO:** "Lo más revelador no son los promedios — son las contradicciones. Cuando el clima se ve sano pero los números dicen lo opuesto, esa distancia es la alerta."

### 10. ComplianceAnalysisOrchestrator — Orquestador async

- **Archivo:** `src/lib/services/compliance/ComplianceAnalysisOrchestrator.ts`
- **3 fases:**
  1. `initializeComplianceJobs()` — crea N rows DEPARTMENT + 1 ORG con status='PENDING'. Idempotente.
  2. `processNextDepartmentJob()` — toma job más antiguo (retryCount<3), ejecuta LLM, calcula teatro/ISA, detecta Motor A casos, persiste payload namespaced (`patrones`, `safetyDetail`, `convergencia`, `isa`, `textCount`, `parentDepartmentName`).
  3. `processOrgMetaIfReady()` — verifica todos DEPARTMENT=COMPLETED, ejecuta LLM meta, aplica patch A4 cross-dept, calcula contextos extendidos, crea alertas, genera narrativas, calcula orgISA ponderado.
- **Retries:** 3 máx → status='FAILED' simétrico en todas las ramas.

---

## II. PERFORMANCE 360° + CALIBRACIÓN + 9-BOX

### 11. PerformanceResultsService — Consolidación 360°

- **Archivo:** `src/lib/services/PerformanceResultsService.ts`
- **Configuración declarada** (`src/config/performanceClassification.ts:129` `FOCALIZAHR_DEFAULT_WEIGHTS`): Self=**0%**, Manager=**60%**, Peer=**25%**, Upward=**15%**. Comentario explícito: *"Self NO aporta al cálculo (reduce sesgo positivo). La autoevaluación se usa para detectar brechas de percepción, no para la nota."* Alternativa `WEIGHTS_WITH_SELF` con self=10/manager=50/peer=25/upward=15.
- **Aplicación real (gap config↔consumer):** `getEvaluateeResults()` (líneas 195-204) y `getCycleSummary()` (línea 491) hacen **promedio simple** (`calculateAverage`) sobre los scores disponibles — NO importan `FOCALIZAHR_DEFAULT_WEIGHTS`. Endpoint admin `/api/admin/performance-config` permite a cliente persistir pesos custom, pero el motor de cálculo principal aún no los aplica.
- **Por competencia:** estructura `selfScore / managerScore / peerAvgScore / upwardAvgScore / overallAvgScore` con `selfVsOthersGap`.
- **Categorías:** CORE / LEADERSHIP / STRATEGIC / TECHNICAL.
- **Priorities gap analysis:** ALTA (avg<2.5) / MEDIA (avg<3.5) / BAJA.

### 12. CompetencyScoreService

- **Archivo:** `src/lib/services/CompetencyScoreService.ts`
- Retorna scores normalizados por competencia con metadata para distribución.

### 13. RoleFitAnalyzer

- **Archivo:** `src/lib/services/RoleFitAnalyzer.ts`
- **Fórmula (línea 131-132):**
  ```
  fitPercent = (actualScore / targetScore) × 100
  if fitPercent > 100 → fitPercent = 100   // Capped Average
  roleFitScore = promedio(all fitPercent)   // 0-100
  ```
- **Output:** `roleFitScore` + `gaps[]` con status `MATCH` / `IMPROVE` / `CRITICAL` / `EXCEEDS` por competencia.
- **Threshold canónico:** `ROLEFIT_THRESHOLD = 75` (`src/config/successionConstants.ts`).

### 14. 9-Box Matrix

- **Archivo:** `src/config/performanceClassification.ts`
- **Thresholds:** `HIGH ≥ 4.0` / `MEDIUM ≥ 3.0` / `low < 3.0`.
- **9 posiciones (3×3 performance × potential):**
  - high/high → **STAR**
  - high/medium → **HIGH_PERFORMER**
  - high/low → **TRUSTED_PROFESSIONAL**
  - medium/high → **GROWTH_POTENTIAL**
  - medium/medium → **CORE_PLAYER**
  - medium/low → **AVERAGE_PERFORMER**
  - low/high → **POTENTIAL_GEM**
  - low/medium → **INCONSISTENT**
  - low/low → **UNDERPERFORMER**

### 15. CalibrationService

- **Archivo:** `src/lib/services/CalibrationService.ts`
- **4 modos de filtrado:** `jobLevel`, `jobFamily`, `directReports`, `customPicks`.
- **Bonus factors aplicados a distribución esperada:** STARS=1.25× / HIGH=1.15× / CORE=0.90× / NEUTRAL=0.70× / RISK=0.00×.
- **Estado Transitorio:** ajustes guardados como PENDING, aplicados atómicamente al cierre. PDF audit + QR (Supabase Storage `calibration-audits`).

### 16. ManagerVarianceService — Detección sesgo evaluador

- **Archivo:** `src/lib/services/ManagerVarianceService.ts`
- **Métrica:** stdDev de promedios por jefe dentro de una gerencia.
- **Niveles:** `BAJA` (<0.5) / `MEDIA` (0.5-1.0) / `ALTA` (≥1.0).
- **Frase CEO:** "En Ventas, 3 jefes de región tienen varianza ALTA: uno evalúa 3.8 promedio, otro 2.4. Necesitamos calibración."

### 17. evaluatorStatsEngine — Estilos evaluativos

- **Archivo:** `src/lib/utils/evaluatorStatsEngine.ts`
- **Estilos evaluador:** `OPTIMA` / `INDULGENTE` / `SEVERA` / `CENTRAL`. (Formateo `OPTIMA → Óptima` con tilde via `formatEvaluatorStyle` en `formatName.ts`.)

### 18. ManagerFeedbackGenerator + IndividualReportService

- Genera reportes 360° individuales + feedback ejecutivo per-evaluador.

---

## III. TALENT INTELLIGENCE — Cuadrantes y narrativas

### 19. TalentIntelligenceService — 8 cuadrantes (4+4)

- **Archivo:** `src/lib/services/TalentIntelligenceService.ts`
- **Test Ácido AAE — DISCRETO:** aspiration/engagement = `1 (LOW)`, `2 (NEUTRAL — NO clasifica)`, `3 (HIGH)`. Nivel 2 deliberadamente excluido para evitar tendencia central.

#### Movilidad (Role Fit × Aspiración)

| Cuadrante | RoleFit | Aspiración | Significado |
|-----------|---------|------------|-------------|
| `SUCESOR_NATURAL` | ≥75 | 3 | Alto dominio + alta aspiración → candidato sucesión formal |
| `EXPERTO_ANCLA` | ≥75 | 1 | Prefiere profundizar expertise, no gestión |
| `AMBICIOSO_PREMATURO` | <75 | 3 | Quiere crecer pero tiene gaps → frustración si no hay roadmap |
| `EN_DESARROLLO` | <75 | 1 | Baja aspiración + gaps → consolidar rol actual |

#### Riesgo (Role Fit × Engagement)

| Cuadrante | RoleFit | Engagement | Significado | SLA |
|-----------|---------|------------|-------------|-----|
| `MOTOR_EQUIPO` | ≥75 | 3 | Alto desempeño + alto compromiso | GREEN |
| `FUGA_CEREBROS` | ≥75 | 1 | Experto desencantado → riesgo pérdida crítica | RED/48h |
| `BURNOUT_RISK` | <75 | 3 | Alto esfuerzo sin resultados → desgaste | ORANGE/168h |
| `BAJO_RENDIMIENTO` | <75 | 1 | No entrega + desconectado | RED/72h |

### 20. TalentNarrativeService — **20 narrativas individuales**

- **Archivo:** `src/lib/services/TalentNarrativeService.ts`
- **Generación:** combinación `riskQuadrant × mobilityQuadrant`. Output: `IndividualTalentNarrative` (headline + context + urgencySignal + recommendedAction + urgencyLevel + conflictAlert opcional).

#### Tabla completa de las 20 narrativas

| # | risk × mobility | Headline | Urgencia | Acción |
|---|-----------------|----------|----------|--------|
| 1 | SUCESOR_NATURAL × FUGA_CEREBROS | "Doble señal — el perfil más costoso de perder" | **CRÍTICA** | Conversación de escucha esta semana, no revelar sucesión todavía. Conflict: no usar info en oferta externa. |
| 2 | EXPERTO_ANCLA × FUGA_CEREBROS | "El conocimiento que más cuesta reemplazar, con compromiso crítico" | **CRÍTICA** | Reconocimiento + paralelamente knowledge transfer. |
| 3 | * × FUGA_CEREBROS (fallback) | "Alto dominio, compromiso en nivel crítico" | **CRÍTICA** | Incluir en revisión de personas. |
| 4 | AMBICIOSO_PREMATURO × FUGA_CEREBROS | "Alta aspiración, compromiso crítico, dominio en desarrollo" | ALTA | Roadmap explícito (qué y plazo). |
| 5 | SUCESOR_NATURAL × MOTOR_EQUIPO | "El perfil correcto para sucesión — actívalo antes de que lo pierda el silencio" | MEDIA | Conversación de visibilidad. |
| 6 | BURNOUT_RISK × SUCESOR_NATURAL | "Potencial de sucesor, pero sobrecargado" | ALTA | Reducir carga / acelerar competencias. |
| 7 | BURNOUT_RISK × EXPERTO_ANCLA | "Experto técnico en zona de desgaste" | MEDIA | Conversación de enfoque. |
| 8 | BURNOUT_RISK × AMBICIOSO_PREMATURO | "Ambición alta, capacidad en desarrollo, riesgo de frustración" | MEDIA | Expectativas con hitos. |
| 9 | BURNOUT_RISK × EN_DESARROLLO | "En desarrollo pero sobrecargado" | MEDIA | Balance carga/desarrollo. |
| 10 | * × BURNOUT_RISK (fallback) | "Compromiso alto, dominio por debajo del umbral" | MEDIA | 1:1 para entender gap. |
| 11 | MOTOR_EQUIPO × EXPERTO_ANCLA | "Experto feliz — el ancla técnica del equipo" | BAJA | Proteger; no promover a gestión. |
| 12 | MOTOR_EQUIPO × AMBICIOSO_PREMATURO | "Energía y ambición, pero aún en desarrollo" | BAJA | Mostrar el camino. |
| 13 | MOTOR_EQUIPO × EN_DESARROLLO | "Comprometido y creciendo — perfil en curva ascendente" | BAJA | Mantener momentum. |
| 14 | * × MOTOR_EQUIPO (fallback) | "Alto dominio, alto compromiso — el ancla del equipo" | BAJA | Asegurar retos. |
| 15 | BAJO_RENDIMIENTO × SUCESOR_NATURAL | "Contradicción: aspira a más pero no domina lo actual" | ALTA | Conversación directa. |
| 16 | BAJO_RENDIMIENTO × EXPERTO_ANCLA | "Prefiere profundizar, pero no está entregando" | ALTA | Definir plazo de mejora. |
| 17 | BAJO_RENDIMIENTO × AMBICIOSO_PREMATURO | "Quiere crecer pero no está entregando lo básico" | ALTA | Reset: hablar de hoy antes de carrera. |
| 18 | BAJO_RENDIMIENTO × EN_DESARROLLO | "Bajo rendimiento sin señales de mejora" | ALTA | Plan con hitos y consecuencias. |
| 19 | * × BAJO_RENDIMIENTO (fallback) | "Bajo dominio, bajo compromiso — situación que requiere definición" | ALTA | Primera conversación esta semana. |
| 20 | Sin clasificación activa | "Sin clasificación de talento activa" | BAJA | Revisar Centro de Acción de Talento — factores en zona neutral. |

**Distribución de urgencia:** 3 críticas · 7 altas · 5 medias · 5 bajas.

### 21. TalentRiskOrchestrator

- **Archivo:** `src/lib/services/TalentRiskOrchestrator.ts`
- Cruza dominios: cuántas personas no dominan el cargo Y cumplen metas (cross-dominio Goals × Talent), línea ejecutiva en Síntesis P&L.

### 22. TalentActionService — TAC (Talent Action Center)

- **Archivo:** `src/lib/services/TalentActionService.ts`
- **3 acciones registradas:** `NOTIFY_HRBP`, `SCHEDULE_COMMITTEE`, `FLAG_FOR_REVIEW`.
- **Email real via Resend.** Duplicados prevenidos. Post-acción: FocalizaIntelligenceModal con contexto.
- **IntelligenceInsight:** baselineValue guardado, `nextEvaluationAt = +180 días` (placeholder; CRON futuro usará PerformanceCycle real).
- **Narrativas centralizadas:**
  - `GerenciaPatternNarratives.ts` (label + coachingTip + actions)
  - `TalentMapNarratives.ts` (por cuadrante × tenure)
  - `tacLabels.ts` (quadrant + pattern labels)

### 23. FeedbackIntelligenceService

- Captura feedback post-acción TAC para curva de aprendizaje organizacional.

### 24. StrategicFocusService

- Foco estratégico cross-módulo — dónde poner energía esta semana.

---

## IV. SUCESIÓN

### 25. SuccessionService

- **Archivo:** `src/lib/services/SuccessionService.ts`
- **Thresholds (de `successionConstants.ts`):**
  - `ROLEFIT_THRESHOLD = 75`
  - `SUCCESSION_ELIGIBLE_NINEBOX = [STAR, HIGH_PERFORMER, GROWTH_POTENTIAL]`
  - **Readiness:**
    - `READY_NOW`: gapPercent < 10 → "Listo ahora"
    - `READY_1_2_YEARS`: gapPercent < 25 → "1-2 años"
    - `READY_3_PLUS`: gapPercent ≥ 25 → "3+ años"
    - `NOT_VIABLE`: no eligible → "No viable"
- **NominationSource:** `SUGGESTED` (algorítmica) / `DISCRETIONARY` (manual del jefe).

### 26. SuccessionDiagnosisEngine — 10 casos

- **Archivo:** `src/lib/services/SuccessionDiagnosisEngine.ts`
- **Input:** 10 variables (readiness, matchPercent, nineBoxPosition, riskQuadrant, mobilityQuadrant, engagement, flight risk, gaps, etc.).
- **Output:**
  - `aiDiagnostic`: narrativa
  - `urgency`: `CRITICAL` / `HIGH` / `NORMAL`
  - `suggestedAction`: `RETENTION_TALK` / `CRITICAL_PROJECT` / `BOARD_EXPOSURE` / `LATERAL_ROTATION`
  - `estimatedReadinessMonths`
  - `caseId` (1-10)

### 27. SuccessionSyncService

- Sync con `PerformanceRating` (backward compat con maqueta legacy).

### 28. PDISuggestionEngine

- Sugerencias plan desarrollo individual (qué aprender, en qué plazo, con qué apoyo).

---

## V. EXIT INTELLIGENCE

### 29. ExitIntelligenceService

- **Archivo:** `src/lib/services/ExitIntelligenceService.ts`
- **EIS Score 0-100:** umbral `NEUTRAL=60` (debajo = riesgo), `PROBLEMATIC=40` (debajo = crítico). Alineado con `EIS_THRESHOLDS` en `src/types/exit.ts`.

### 30. ExitAlertEngine + ExitAlertService

- **Archivo:** `src/engines/ExitAlertEngine.ts` + `src/lib/services/ExitAlertService.ts`
- Alertas por exit register (severity + SLA). Tipos canónicos: leadership signal, salida tóxica, brecha de talento.

### 31. ExitAggregationService

- **Archivo:** `src/lib/services/ExitAggregationService.ts`
- EIS departamental gold cache rolling 12 meses (`Department.accumulatedEISScore`). Fallback: avgEIS de `DepartmentExitInsight` más reciente.

### 32. RetentionEngine — Transparencia financiera CFO-ready

- **Archivo:** `src/engines/RetentionEngine.ts`
- **Diferenciación competitiva (declarada en código):**
  > "✅ Único mercado con transparencia financiera auditable
  > ✅ Casos negocio vs templates genéricos
  > ✅ Fuentes tier-1 documentadas paso a paso
  > ✅ CEO/CFO pueden validar cualquier cifra"
- **Fuentes metodológicas:** SHRM Human Capital Benchmarking 2024, Gallup State of Global Workplace 2024, McKinsey Leadership Performance Impact 2024, Deloitte Human Capital Trends 2024, HBR Engagement ROI Studies.
- **Triggers:** `ambiente_critico` (ambiente<2.5), `retention_riesgo` (overall<3.0).

### 33. ExitRegistrationService

- Registro estructurado de salidas con causa.

---

## VI. ONBOARDING JOURNEY

### 34. OnboardingIntelligenceEngine — EXO Score Bauer

- **Archivo:** `src/lib/engines/OnboardingIntelligenceEngine.ts`
- **Fórmula EXO (Bauer Framework, escala 1-5 → 0-100):**
  ```
  EXO = [(C × 0.20) + (CL × 0.30) + (CU × 0.25) + (CO × 0.25)] / totalWeight × 100
  ```
- **4 stages del viaje:**
  - **Compliance (0.20)** — Día 1 — Acceso herramientas, equipamiento.
  - **Clarification (0.30) ★ MAYOR PESO** — Día 7 — Expectativas, KPIs.
  - **Culture (0.25)** — Día 30 — Conexión valores org.
  - **Connection (0.25)** — Día 90 — Integración social.
- **Mínimo 2 scores** para calcular (renormaliza pesos disponibles).
- **Retention Risk:** `low ≥80` / `medium ≥70` / `high ≥60` / `critical <60`.
- **Trayectoria:** `improving` (avgTrend>0.3) / `stable` / `declining` (<-0.3).
- **Frase CEO:** "EXO mide la integración real. Día 7 pesa más que Día 90 — si no hay claridad ahí, todo lo demás es síntoma."

### 35. OnboardingAlertService + OnboardingAlertEngine

- Alertas por journey crítico, EXO baja, dimensión específica débil.

### 36. OnboardingEffectivenessAnalyzer

- Análisis efectividad por cohorte: qué aporta el ritual vs qué solo dilata.

### 37. OnboardingBenchmarkService

- Benchmark EXO vs mercado (cascada GLOBAL + JOB_LEVEL).

### 38. OnboardingEnrollmentService + OnboardingAggregationService

- Enrollment individual + batch + agregación por dept.

---

## VII. WORKFORCE PLANNING / EXPOSICIÓN IA

### 39. AIExposureService — focalizaScore canónico

- **Archivo:** `src/lib/services/AIExposureService.ts`
- **Fuentes (cascada):**
  - **focalizaScore (Eloundou 0/0.5/1 discreto)** — DRIVER canónico.
  - `betaScore` — fallback único.
  - `observedExposure` (Anthropic legacy) — info only, no driver.
- **Fórmula:** `effectiveOccupationExposure = focalizaScore ?? betaScore ?? 0`
- **Threshold:** `HIGH_EXPOSURE_THRESHOLD = 0.5` (alineado con Workforce).
- **Confidence:** `high` (focalizaScore) / `medium` (betaScore solo) / `low` (nada).

### 40. AutomationClassificationService — IPI Index

- **Archivo:** `src/lib/services/AutomationClassificationService.ts`
- **Fórmula IPI (Índice Presión IA):** `IPI = (betaEloundou × 0.6) + (presionInteraccion × 0.4)` donde `presionInteraccion = Σ(dim × peso)` (clamped a [0,1]).
- **5 dimensiones Anthropic + pesos IPI** (`IPI_DIM_WEIGHTS`): `directive=1.0` / `feedbackLoop=0.8` / `taskIteration=0.5` / `learning=0.4` / `validation=0.3`.
- **`dominanceThreshold = 0.15`** — bajo este valor: clasifica como "Asistencia híbrida".
- **7 clasificaciones legacy** (`AutomationClassification`): Reemplazo directo / Reemplazo verificado / Asistencia con feedback / Iteración supervisada / Validación humana / Aprendizaje continuo / Asistencia híbrida.
- **Lógica de clasificación legacy:** dim dominante por max value:
  - `directive` + `validation ≥ 0.5` → "Reemplazo verificado"; sino "Reemplazo directo"
  - `feedbackLoop` → "Asistencia con feedback"
  - `taskIteration` → "Iteración supervisada"
  - `validation` → "Validación humana"
  - `learning` → "Aprendizaje continuo"
- **6 perfiles label** (cruce betaEloundou × grupo automation/augmentation): `DELEGACION_ACTIVA` (β=1, automation) / `AMPLIFICACION_ACTIVA` (β=1, augmentation) / `DELEGACION_PARCIAL` (β=0.5, automation) / `ASISTENCIA_PRODUCTIVA` (β=0.5, augmentation) / `RESISTENTE` (β=0, automation) / `CONSULTA_PUNTUAL` (β=0, augmentation).
- **Frases narrativas largas** (`getAnthropicPhrase`): bucket por betaEloundou (`beta_1` / `beta_05` / `beta_0`) × dim dominante. β=0 NO tiene `feedback_loop` (por diseño). Cobertura ~18% O*NET tasks tienen dims Anthropic.

### 41. WorkforceIntelligenceService — 10 detectores

- **Archivo:** `src/lib/services/WorkforceIntelligenceService.ts`
- **Arquitectura:** Bulk Enrichment (4 queries) + Pure Detection (0 queries adicionales). `EnrichedEmployee[]` central.

| # | Detector | Threshold |
|---|----------|-----------|
| 1 | `detectTalentZombies` | focalizaScore>0.5 + roleFit>85 + ability≤2 + engagement≤2. **Inertia cost = salary×12.** |
| 2 | `detectAugmentedFlightRisk` | augmentationShare>0.6 + engagement=3 + (riskQuadrant=MOTOR_EQUIPO OR mobility=AMBICIOSO_PREMATURO). |
| 3 | `detectRedundancy` | Overlap tareas ≥70%. `estimatedSavings = min(headcount) × min(avgSalary) × 12`. |
| 4 | `detectAdoptionRisk` | avgExposure>0.5 + avgEngagement<2 (per dept). |
| 5 | `detectSeniorityCompression` | jobZone∈[3,4] + augmentationShare>0.6 + brecha salary≥30%. |
| 6 | `inertiaCost` | `monthlyCost = salary × effExposure`. Aggrega por depto + cargo. |
| 7 | `liberatedFTEs` | `liberatedFTE = autoCapacity × headcount`. `monthlySavings = liberatedFTE × avgSalary`. |
| 8 | `severanceLiability` | focalizaScore>0.5 + roleFit<75. `paybackMonths = totalSeverance / monthlyFTESavings`. |
| 9 | `retentionPriority` | Score = goals×0.4 + roleFit×0.3 + adapt×0.3 × multipliers × (1+exposure). Tiers: `intocable` (≥120) / `valioso` (≥80) / `neutro` (≥40) / `prescindible`. |
| 10 | `productivityGap` | roleFit<70. `gapRatio = 1 - (roleFit/100)`. cost = salary × gapRatio. |

- **Output:** `OrganizationDiagnostic` con 10 resultados + `topAlerts` (5 máx) + `netROI`.
- **Frase CEO:** "Tienes XX personas con talento crítico en roles que la IA puede asumir. Si se van, pierdes XX en recambio. Si se quedan, pagas XX/mes por inertia estructural."

### 42. PersonExposureNarrativeService — **6 casos AAE per-persona**

- **Archivo:** `src/lib/services/PersonExposureNarrativeService.ts`
- **Filosofía:** "El CEO no toma 27 decisiones distintas. Solo actúa sobre los EXTREMOS."
- **Thresholds canónicos:**
  - `EXPOSURE_HIGH = 0.5` (focalizaScore discreto Eloundou)
  - `EXPOSURE_LOW = 0.3`
  - `ROLEFIT_HIGH = 75` (autonomía operativa, "70% Rule")
  - `ROLEFIT_LOW = 60`
  - `ENGAGEMENT_HIGH = 3` (DISCRETO) / `ENGAGEMENT_LOW = 1` / nivel 2 NO clasifica

| # | Caso | Trigger exacto | Headline | Accent |
|---|------|---------------|----------|--------|
| 1 | `TALENTO_CRITICO_MOVER` | isHighExp + isHighFit + isNotLowEng | "Talento crítico en rol automatizable. Mover estratégicamente antes de perderlo." | **cyan** |
| 2 | `NO_REEMPLAZO` | isHighExp + isLowFit + isLowEng | "Bajo rendimiento estructural. Su salida financia la automatización del rol. No reponer." | **amber** |
| 3 | `BRECHA_CORE_HUMANO` | isLowExp + isLowFit | "Bajo desempeño en el core humano. La IA no cubre. Reemplazo urgente." | **amber** |
| 4 | `NUCLEO_INTOCABLE` | isLowExp + isHighFit + isHighEng | "Núcleo del valor humano protegido. Talento insustituible." | **cyan** |
| 5 | `FUGA_INMINENTE` | isHighExp + isHighFit + isLowEng | "Domina cargo automatizable pero su compromiso ya cayó. Probablemente mirando afuera." | **amber** |
| 6 | `OPERACION_ESTABLE` | default fallback | "Operación estable. Sin urgencia de intervención." | **slate** |

**Orden de evaluación crítico:** Caso 5 (FUGA_INMINENTE) **ANTES** de Caso 1 para evitar que un perfil con engagement bajo caiga en "mover estratégicamente".

**Reglas estrictas:** SIN "score", SIN "RoleFit", SIN "tier" en output ejecutivo. Output: `headline` + `context` (2-3 líneas, lenguaje gerentes) + `exposureLens` + `urgencyLevel` (frase de consecuencia, NUNCA "Alto/Medio/Bajo") + `accent`.

### 43. SpanIntelligenceService — Arquitectura de Liderazgo (L4)

- **Archivo:** `src/lib/services/SpanIntelligenceService.ts` + `src/types/span.ts:164-187` (constants).
- **Span óptimo McKinsey — 7 niveles granulares (`SPAN_OPTIMO`):**
  - `gerente_director`: **3-6** (arquetipo "Player/Coach")
  - `subgerente_subdirector`: **4-8** (arquetipo "Coach")
  - `jefe`: **5-10** (arquetipo "Supervisor")
  - `supervisor_coordinador`: **8-14** (arquetipo "Facilitator")
  - `profesional_analista`: **8-12** (arquetipo "Supervisor")
  - `asistente_otros`: **10-18** (arquetipo "Coordinator")
  - `operativo_auxiliar`: **12-20** (arquetipo "Coordinator")
  - `SPAN_FALLBACK` si null: 5-10 ("Supervisor")
- **`SPAN_MICRO_THRESHOLD = 2`**.
- **Span Zone:** `MICRO` (≤2) / `SUB` (<min) / `EN_RANGO` (entre min y max) / `SOBRE` (>max).
- **Modos automáticos:**
  - **Modo Estructural** (sin ciclo activo): narrativas solo por `spanZone`.
  - **Modo Completo** (con `PerformanceCycle`): activa las 8 combinaciones del spec §7 con `perfilEvaluativo` (vía `evaluatorStatsEngine`) + `metasEquipoPct` (vía `GoalsService`) + `roleFitPromedio`.
- **Detección de manager:** `performanceTrack ∈ {EJECUTIVO, MANAGER}` + `spanActivo > 0`. NO usa `managerLevel` (100% null en demo).
- **8 narrativas contextuales** (perfilEvaluativo × metasEquipo): MICRO-EQUIPO (ROJA siempre), CAPA SIN VALOR, MICROMANAGEMENT, CAPA CIEGA, CAPACIDAD SUBUTILIZADA, SOBRECARGA CON VISTA GORDA, LÍDER ALTA CAPACIDAD (VERDE), RESULTADO A COSTA PRESIÓN.
- **Densidad gerencial (`src/types/span.ts:185-187`):** `DENSIDAD_TOP_HEAVY = 0.2` / `DENSIDAD_PESADA_MIN = 0.15` / `DENSIDAD_PLANA_MAX = 0.08`.
- **Zona narrativa global:** `SpanNarrativaZona = 'VERDE' | 'AMARILLA' | 'ROJA'`. `SpanUrgencia = 'NINGUNA' | 'BAJA' | 'MEDIA' | 'ALTA'`.
- **Output:** `OrgSpanIntelligence` con `profiles[]`, `byGerencia[]`, `byArquetipo[]`, `piramide[]`.

### 44. EfficiencyCalculator + EfficiencyNarrativeEngine + EfficiencyDataResolver

- **Archivo:** `src/lib/services/efficiency/EfficiencyCalculator.ts`
- **IPI × automationShare × headcount = FTEs liberables.**
- 9 lentes (L1-L9) — Patrón LenteLayout 4 actos: silencio → expediente → quirófano → checkpoint.

### 45. PLTalentService — P&L del Talento

- **Archivo:** `src/lib/services/PLTalentService.ts`
- **Brecha Productiva:** roleFit<75 → `monthlyGap = (1 - roleFit%) × (estimatedSalary / 160 horas)`. Aggrega por gerencia + cargo. `breakevenMonths = finiquito / monthlyGap`.
- **Semáforo Legal:** riskQuadrant=BAJO_RENDIMIENTO → finiquito hoy/+3m. Semáforo: YELLOW / ORANGE / RED.
- **Acto Ancla "Masa y Gravedad":** 4 nodos — FTE Fantasma / Donde se concentra / Sobre el estándar / Umbral 75%(i).

### 46. OccupationResolver v3 + OccupationMapper + JobDescriptorService + PositionAdapter + DepartmentAdapter

- **OccupationResolver v3:** router (simples → algorítmico, compuestos → LLM) + batch transaction. LLM via fetch directo a `https://api.anthropic.com/v1/messages` con modelo `claude-haiku-4-5-20251001`, batches de 20, quota `LLM_MONTHLY_LIMIT = 200`/mes. Fallback elegante: si `ANTHROPIC_API_KEY` no está set → log + skip LLM (sigue ruta algorítmica).
- **JobDescriptorService:** by-title enriquece `CompetencyTarget`. Smart Router clonado de Cinema Mode evaluaciones.
- **PositionAdapter:** mapea position → `standardJobLevel` McKinsey.
- **DepartmentAdapter:** categoriza `standardCategory`.

### 47. SalaryConfigService

- Default Chile (`CHILE_SALARY_DEFAULTS`) + override per-account. Auditable CFO-ready.

---

## VIII. GOALS / METAS

### 48. GoalsService + GoalRulesEngine

- **3 niveles de meta:** `COMPANY` / `AREA` / `INDIVIDUAL`.
- **Lógica de aprobación por nivel:**
  - COMPANY → CEO o ACCOUNT_OWNER aprueban.
  - AREA → HR_MANAGER o jefe de área aprueba.
  - INDIVIDUAL → AREA_MANAGER (jefe directo) aprueba.

### 49. GoalsDiagnosticService — **4 cuadrantes Goals × Performance**

- **Archivo:** `src/lib/services/GoalsDiagnosticService.ts`
- **Thresholds (`GOALS_THRESHOLDS`):**
  - `DISCONNECTION_SCORE_GAP = 1.5` (normalizado)
  - `HIGH_GOALS = 80%` / `LOW_GOALS = 40%`
  - `HIGH_SCORE = 4.0` / `LOW_SCORE = 3.0`
  - `HIGH_ROLEFIT = 75` / `LOW_ROLEFIT = 60`
  - `MIN_COVERAGE_FOR_DOT = 50%`
  - `DISCONNECTION_WARNING = 15%` / `DISCONNECTION_CRITICAL = 25%`
  - `MIN_FOR_SCATTER = 10`

| Cuadrante | Score360 | Goals | Significado |
|-----------|----------|-------|-------------|
| `CONSISTENT` (cyan) | ≥3.0 | ≥50% | Todo alineado |
| `PERCEPTION_BIAS` (amber) | ≥3.0 | <50% | Bonos sin respaldo |
| `HIDDEN_PERFORMER` (slate) | <3.0 | ≥50% | Talento invisible |
| `DOUBLE_RISK` (violet) | <3.0 | <50% | Doble riesgo |
| `NO_GOALS` | — | — | Sin metas asignadas |

- **5 narrativas de valor:**
  1. **Fuga Productiva** — rinde en metas + FUGA_CEREBROS
  2. **Bonos Sin Respaldo** — 360° alto + metas bajo
  3. **Talento Invisible** — metas alto + 360° bajo
  4. **Ejecutores Desconectados** — metas alto + engagement bajo
  5. **No Sabe vs No Quiere** — metas bajo, split por roleFit

### 50. GoalsSynthesisEngine — 6 diagnósticos diferenciales

- **Archivo:** `src/lib/services/GoalsSynthesisEngine.ts`
- **Fix de raíz confidenceLevel:** V1 (`disconnectionRate>40`) + V2 (Pearson<0.3). Zero parches downstream.
- **6 tipos (en prioridad):**

| Tipo | Trigger | Significado |
|------|---------|-------------|
| `EVALUADOR` | ≥2 gerencias con red confidenceLevel | Evaluador no diferencia |
| `CONCENTRACION` | 1 gerencia concentra >50% desconexión | Problema identificado |
| `ESTRELLAS_EN_RIESGO` | <80% estrellas respaldan clasificación | Sucesión basada en aire |
| `FRAMEWORK` | Pearson(RoleFit×Goals) < 0.3 | Lo que se mide ≠ lo que importa |
| `ALINEADO` | ≤15% desalineamiento + sin gerencias red | Sistema funciona |
| `DESALINEAMIENTO_GENERALIZADO` | default | Patrón sistémico sin origen |

- **Acto Ancla "Composición Ponderada":** gauge 17% + 4 nodos (Evaluación vs metas, Estrellas, Gerencias, Poder predictivo(i)).

---

## IX. EFFICIENCY HUB

### 51. EfficiencyCalculator (services/efficiency/EfficiencyCalculator.ts)

- IPI per-position × automationShare × headcount = FTEs liberables.

### 52. EfficiencyDataResolver

- Resolución datos cross-fuente (PerformanceRating + AIExposureService + WorkforceIntelligenceService).

### 53. EfficiencyNarrativeEngine

- Narrativa per-lente. Patrón LenteLayout (4 actos: silencio → expediente → quirófano → checkpoint).

### 54. EfficiencyPlanPDF

- PDF ejecutivo con plan de eficiencia (jsPDF + jspdf-autotable + qrcode).

---

## X. NARRATIVAS EJECUTIVAS + SÍNTESIS

### 55. ExecutiveSynthesisEngine — **5 diagnósticos diferenciales P&L Talent**

- **Archivo:** `src/lib/services/ExecutiveSynthesisEngine.ts`
- **Patrón McKinsey (4 partes):**
  ```
  Línea 1: Clasificación ("Este no es un problema de X, es de Y")
  Línea 2-3: Implicación estratégica
  Línea 4: El camino (dirección, no pasos)
  Cierre: Accountability silencioso
  ```
- **THRESHOLDS:**
  - `LIDERAZGO_LEADERS_PCT = 30` + `LIDERAZGO_AFFECTED_PCT = 40`
  - `CONCENTRACION_PCT = 50`
  - `ANTIGUEDAD_SENIOR_PCT = 40`
  - `RECAMBIO_GAP_POINTS = 10` + `RECAMBIO_MIN_WORKFORCE_PCT = 15`

| # | Tipo | Trigger | Frase central |
|---|------|---------|---------------|
| 1 | `LIDERAZGO` | ≥30% líderes bajo estándar AND ≥40% afectados | "Los multiplicadores fallan" |
| 2 | `CONCENTRACION` | 1 gerencia concentra ≥50% del déficit | "Una gerencia concentra el problema" |
| 3 | `ANTIGUEDAD_SENIOR` | ≥40% del déficit en personal >36 meses | "Decisiones postergadas" |
| 4 | `RECAMBIO` | Nuevos vs Existentes ≥10 pts roleFit AND ≥15% workforce | "Selección/Onboarding falla" |
| 5 | `GENERIC` | Default | "Sin factor dominante" |

- **Prioridad fija para empates:** Liderazgo > Concentración > Antigüedad > Recambio.

### 56. ExecutiveNarrativeService

- **Archivo:** `src/lib/services/ExecutiveNarrativeService.ts`
- Narrativas org-level cross-módulo (Cascada del Talento, Metas × Performance, Exit, Onboarding).

### 57. IntelligenceInsightService

- **Archivo:** `src/lib/services/IntelligenceInsightService.ts`
- Insights persistentes con `baselineValue` y `nextEvaluationAt = +180d`. Memoria del CEO entre ciclos.

### 58. IndividualReportService

- Reporte 360° individual completo (PDF + dashboard).

---

## XI. BENCHMARKS

### 59. InsightEngine — Reglas de insight

- **Archivo:** `src/lib/services/InsightEngine.ts`
- **Reglas implementadas (mencionadas en MEMORY.md):**
  - 11 reglas RoleFit
  - 4 reglas RoleFit × JOB_LEVEL
  - 4 reglas EXO × JOB_LEVEL
- **Reglas universales:** `top_performer` (percentile≥90, positive) / `above_average` (positive) / `aligned` (neutral) / `below_average` (improvement) / `critical` (percentile≤25, critical) / `sample_size_warning` (n<10, neutral) / `specificity_fallback` (neutral) / `context` (siempre).
- **Reglas específicas:** `onboarding_excellent_integration` (EXO≥75 + percentile≥75) / `exit_high_retention_risk` (risk>75 + percentile≤35) / `nps_engagement_disconnect`.

### 60. BenchmarkAggregationService

- **Archivo:** `src/lib/services/BenchmarkAggregationService.ts`
- **3 combinatorias:** GLOBAL + JOB_LEVEL + (area × cargo).
- **Privacy threshold + cascada de especificidad:** "tu cargo, tu industria, el mercado".
- **Métricas implementadas:** `onboarding_exo` (GLOBAL + JOB_LEVEL), `performance_rolefit` (GLOBAL + JOB_LEVEL + COMBINATORIA).
- **NO implementado:** `exposure_ia`.

---

## XII. SUPPORT SERVICES (transversales)

### 61. NPSAggregationService

- NPS agregado + categorización Promotores/Pasivos/Detractores.

### 62. PatternDetector

- Patrones cross-question en survey (anomalías).

### 63. AnalyticsService + AggregationService

- Aggregación campaign-level + normalización (`Response.normalizedScore` + `Question.responseValueMapping` + `calculateNormalizedScore`).

### 64. EmployeeSyncService

- Sync HRIS → `Employee` master.

---

## ⚡ MOTORES SIN EQUIVALENTE EN EL MERCADO

> Comparados contra Culture Amp, Rankmi, Workday, SAP SuccessFactors.

### 1. **ConvergenciaEngine v2 (Motor A interno + Motor B externo + memoria histórica)**
- Único en el mercado: cruza 4 instrumentos (Likert + LLM + Exit + Onboarding) con pesos dinámicos por antigüedad de alertas.
- **Workday/Rankmi:** miden encuestas aisladas, sin convergencia cross-instrumento.
- **Culture Amp:** correlación pero sin patch cross-dept criticalByManager (delta ISA ≥30 entre deptos del mismo gerente).
- **SAP SuccessFactors:** integra módulos pero sin lógica determinística A1-A5 + casos vinculantes (A2/A5 fuerzan crítico).

### 2. **TalentNarrativeService (20 narrativas individuales con conflictAlert)**
- Único: combinación cuadrante × cuadrante con narrativa per-caso + `conflictAlert` (ej: "no abrir conversación revelando que es tu sucesor — perfil con compromiso crítico puede usarlo para negociar oferta externa").
- **Culture Amp:** insights basados en ML pero sin librería curada de narrativas con heurística humana.
- **Rankmi:** tiene Cinema Mode pero sin narrativa per-cuadrante con riesgos contextuales.

### 3. **PersonExposureNarrativeService (6 casos AAE consolidados, no 27)**
- Único: cruza exposición IA × dominio cargo × compromiso en una matriz cerrada (Test Ácido AAE discreto 1/2/3 con nivel 2 deliberadamente excluido).
- **Workday:** tiene "career path" pero sin lente IA × Engagement × RoleFit.
- **Mercado IA HR (Eightfold, etc.):** mide skills gap pero sin narrativa de contradicción ejecutiva.

### 4. **detectTeatroCumplimiento + ISA Service con penalización 30%**
- Único: detecta CONTRADICCIÓN entre Likert alto (≥4.0) y patrones LLM (≥0.6) y la usa como input al ISA con penalización ×0.7.
- **Culture Amp / Workday:** miden Likert promediado sin lente "respondieron bien por miedo, no por realidad".

### 5. **InterventionEngine — 8 intervenciones determinísticas con consolidación**
- Único: matriz dimensión × nivel → top-3 + lógica de "alto apalancamiento" (intervención que aparece ≥2 veces resuelve N triggers de un golpe).
- **Mercado:** prescriben acciones generales por encuesta, sin consolidación cross-trigger.

### 6. **WorkforceIntelligenceService (10 detectores en bulk)**
- Único: enriched dataset + 10 detectores en arquitectura "Bulk Enrichment + Pure Detection" sobre 5000 FTE en <500ms.
- **Detector "Talent Zombies"**: focalizaScore>0.5 + roleFit>85 + ability≤2 + engagement≤2. **No existe en otros sistemas** — combina exposición IA + autonomía declarada + voluntad de usar tecnología.
- **Detector "Severance Liability"** con paybackMonths: SAP/Workday calculan severance pero sin breakeven cross-detector.

### 7. **RetentionEngine — Transparencia financiera CFO-ready**
- **Declarado en código:** "Único mercado con transparencia financiera auditable. CEO/CFO pueden validar cualquier cifra paso a paso."
- Fuentes tier-1 documentadas inline (SHRM, Gallup, McKinsey, Deloitte, HBR).

### 8. **ExecutiveSynthesisEngine — 5 diagnósticos diferenciales con prioridad fija**
- Único: motor de síntesis ejecutiva tipo McKinsey ("Este no es problema de X, es de Y") con prioridad de empate.
- **Mercado:** dashboards descriptivos sin interpretación clínica de causa raíz organizacional.

### 9. **GoalsDiagnosticService — Cruce Goals × Performance × Engagement**
- Único: 4 cuadrantes con narrativas como "Bonos sin Respaldo" (360° alto + metas bajo).
- **Workday/SAP:** miden goal progress aisladamente. **Culture Amp:** correlaciones pero sin matriz de "fuga productiva" o "ejecutores desconectados".

### 10. **SpanIntelligenceService — 8 narrativas span × densidad × pirámide**
- Único: cruza span de control con perfil evaluador + metas equipo. "MICRO-equipo" siempre rojo. "LÍDER ALTA CAPACIDAD" verde.
- **McKinsey published spans:** referencia académica, no producto.

### 11. **AnclaInteligente — 2 modelos (Composición Ponderada + Masa y Gravedad)**
- Componente reutilizable directo en Goals (Composición) y P&L (Masa). Único en producto SaaS B2B.

### 12. **5 patrones LLM de Ambiente Sano + lente de género obligatorio**
- Único: taxonomía clínica cerrada (silencio_organizacional, hostilidad_normalizada, favoritismo_implicito, resignacion_aprendida, miedo_represalias) con buckets estrictos de intensidad y fragmentos censurables.
- **Lente de género obligatorio en cada análisis** — no opt-in.

---

## 🔀 COMBINACIONES DE MOTORES QUE GENERAN INSIGHTS ÚNICOS

### Combinación 1: ConvergenciaEngine A4 + criticalByManager
**Motor A4 + GlobalConvergencia.criticalByManager**
- A4 detecta delta ISA ≥30 entre deptos del mismo manager.
- criticalByManager agrupa esos deptos.
- → **Patrón de liderazgo cross-departamental** detectable solo cruzando 2 deptos del mismo jefe. Gartner/Workday no lo hacen.

### Combinación 2: detectTeatroCumplimiento + ISA + ConvergenciaEngine A2
**SafetyScore≥4.0 + max(patrones)≥0.6 + ISA penalizado + caso A2 fuerza 'critica'**
- Insight: "Te están dando 4.5/5 por miedo. Tu Likert te miente. La convergencia con LLM te lo revela."
- **Único en mercado** que persiste el flag teatro cross-ciclo (Fase 3 memoria histórica).

### Combinación 3: PersonExposureNarrativeService + TalentNarrativeService
**Cruce Test Ácido AAE per-persona × cuadrante 9-Box × narrativa de movilidad**
- Por persona: 6 casos AAE × 4 cuadrantes movilidad = 24 conversaciones distintas.
- Más TalentNarrativeService cuando aplica (riesgo+movilidad) = otra capa narrativa.
- → Cinema Mode con historia coherente persona a persona.

### Combinación 4: Goals × Performance × Engagement (cuadrante GoalsDiagnostic + riskQuadrant)
- Persona en `HIDDEN_PERFORMER` (talento invisible) + `MOTOR_EQUIPO` (alto compromiso) → "Está rindiendo pero el sistema no lo ve. Risk de fuga si descubre que no lo notamos."
- **Culture Amp:** ve 360° o ve Goals, no los cruza con la riqueza necesaria.

### Combinación 5: WorkforceIntelligenceService.severanceLiability + RetentionEngine + financialTransparency
- Severance liability + payback months + RetentionEngine genera business case CFO-ready con fuentes SHRM/McKinsey.
- → "Pagar por inertia o pagar por salir — pero la decisión está sobre la mesa con cifras auditables."

### Combinación 6: SpanIntelligenceService + ManagerVarianceService + evaluatorStatsEngine
**Span de control + estilo evaluativo + varianza dentro de gerencia**
- Detecta líder con SUB span + evaluador SEVERA + gerencia con varianza ALTA → "Microgestiona, evalúa duro, y otros jefes no calibran con él. La capa media está rota aquí."

### Combinación 7: ExecutiveSynthesisEngine + PLTalentService.AnclaInteligente
- 5 diagnósticos diferenciales (LIDERAZGO/CONCENTRACION/etc.) + Acto Ancla "Masa y Gravedad" (4 nodos: FTE Fantasma, Donde se concentra, Sobre el estándar, Umbral 75%(i)).
- → Cascada Ejecutiva con persuasión McKinsey + numerología auditable.

### Combinación 8: ConvergenciaEngine externalAlerts (Fase 3) + ExitAlertEngine + OnboardingAlertService
- Fase 3 lee alertas Exit + Onboarding con factor decaimiento (1.0 / 0.6 / 0.3 / 0.1 según antigüedad).
- → `senal_ignorada` (Fase 3): "previousISA≠null + ISA≤previo + peso_cicloAnterior_cerrado>0" — única alerta en el mercado que detecta señales que ya cerraste y vuelven.

### Combinación 9: PatronesLLM origen_percibido + ComplianceAlertService liderazgo_toxico ramas C/D/E
- Origen `vertical_descendente` + (silencio>0.6 OR miedo>0.6) + P7<2.5 → alerta `liderazgo_toxico` rama C, severity CRITICAL, SLA 24h.
- **Único:** combina señal LLM (origen narrativo) con señal Likert (P7) con peso de exits previos (rama D/E).

### Combinación 10: AIExposureService + WorkforceIntelligenceService.detectAdoptionRisk + AutomationClassificationService perfil RESISTENTE
- avgExposure>0.5 (cargos automatizables) + avgEngagement<2 (no quieren) + perfil RESISTENTE.
- → Diagnóstico de "Departamento bloqueando transformación digital, no por capacidad sino por voluntad". Decisión: cambiar mensaje, cambiar gente o cambiar tecnología.

### Combinación 11: Goals × Performance × IntelligenceInsightService
- Insight persistente con `baselineValue` + `nextEvaluationAt = +180d`.
- → "Hace 6 meses dijiste que ibas a actuar sobre Hidden Performer X. ¿Qué pasó?". Memoria del CEO entre ciclos.

---

## 📋 CLASIFICACIONES DE TALENTO — Resumen exhaustivo

### Movilidad (4 cuadrantes)
SUCESOR_NATURAL · EXPERTO_ANCLA · AMBICIOSO_PREMATURO · EN_DESARROLLO

### Riesgo (4 cuadrantes)
MOTOR_EQUIPO · FUGA_CEREBROS · BURNOUT_RISK · BAJO_RENDIMIENTO

### 9-Box (9 posiciones)
STAR · HIGH_PERFORMER · TRUSTED_PROFESSIONAL · GROWTH_POTENTIAL · CORE_PLAYER · AVERAGE_PERFORMER · POTENTIAL_GEM · INCONSISTENT · UNDERPERFORMER

### Workforce — Per-persona AAE (6 casos)
TALENTO_CRITICO_MOVER · NO_REEMPLAZO · BRECHA_CORE_HUMANO · NUCLEO_INTOCABLE · FUGA_INMINENTE · OPERACION_ESTABLE

### Workforce — Detectores de cohorte (10)
TalentZombies · AugmentedFlightRisk · Redundancy · AdoptionRisk · SeniorityCompression · InertiaCost · LiberatedFTEs · SeveranceLiability · RetentionPriority · ProductivityGap

### Goals × Performance (4 cuadrantes + 1 sin metas)
CONSISTENT · PERCEPTION_BIAS · HIDDEN_PERFORMER · DOUBLE_RISK · NO_GOALS

### Sucesión — Readiness (4 niveles)
READY_NOW · READY_1_2_YEARS · READY_3_PLUS · NOT_VIABLE

### Sucesión — Acción sugerida (4 tipos, 10 casos diagnosis)
RETENTION_TALK · CRITICAL_PROJECT · BOARD_EXPOSURE · LATERAL_ROTATION

### Onboarding — Retention Risk (4 niveles)
low (≥80) · medium (≥70) · high (≥60) · critical (<60)

### Onboarding — Trayectoria (3 niveles)
improving · stable · declining

### Span Intelligence — Span Zone (4 niveles)
MICRO · SUB · EN_RANGO · SOBRE

### Span Intelligence — Densidad gerencial (3 niveles)
TOP_HEAVY · PESADA_MIN · PLANA_MAX

### Calibración — Bonus factors (5 tiers)
STARS=1.25× · HIGH=1.15× · CORE=0.90× · NEUTRAL=0.70× · RISK=0.00×

### Calibración — Estilos evaluador (4)
ÓPTIMA · INDULGENTE · SEVERA · CENTRAL

### Calibración — Varianza por gerencia (3 niveles)
BAJA (<0.5) · MEDIA (0.5-1.0) · ALTA (≥1.0)

### Workforce IA — Perfiles label (6)
DELEGACION_ACTIVA · AMPLIFICACION_ACTIVA · DELEGACION_PARCIAL · ASISTENCIA_PRODUCTIVA · RESISTENTE · CONSULTA_PUNTUAL

### Workforce IA — Clasificaciones legacy (7)
Reemplazo directo · Reemplazo verificado · Asistencia con feedback · Iteración supervisada · Validación humana · Aprendizaje continuo · Asistencia híbrida

### Compliance — Patrones LLM (5)
silencio_organizacional · hostilidad_normalizada · favoritismo_implicito · resignacion_aprendida · miedo_represalias

### Compliance — Origen percibido per-dept (4)
vertical_descendente · horizontal_pares · sistemico_procesos · indeterminado

### Compliance — Origen organizacional (5, agrega "mixto")
vertical_descendente · horizontal_pares · sistemico_procesos · **mixto** · **indeterminado**

### Compliance — Confianza análisis (4)
alta · media · baja · insuficiente_data

### Compliance — Casos Motor A v2 (5)
A1 · A2 · A3 · A4 · A5

### Compliance — Nivel convergencia interna (4)
ninguna · simple · multiple · critica

### Compliance — Convergencia level global (5)
sin_riesgo · bajo · medio · convergente · critico

### Compliance — Tipos de alerta (5)
riesgo_convergente · silencio_organizacional · liderazgo_toxico (5 ramas A-E) · deterioro_sostenido (Fase 3) · senal_ignorada (Fase 3)

### Compliance — ISA niveles (4)
saludable (≥80) · observacion (60-79) · riesgo (40-59) · critico (<40)

### Compliance — Catálogo de intervenciones (8)
FAST_FEEDBACK · PSYCH_SAFETY_MODELING · BYSTANDER_INTERVENTION · HIGH_FREQ_PULSES · DISSENT_INSTITUTIONALIZATION · PROSOCIAL_ACTIVITIES · DECISION_ACCOUNTABILITY · WORK_REDESIGN

### Goals — Diagnósticos (6)
EVALUADOR · CONCENTRACION · ESTRELLAS_EN_RIESGO · FRAMEWORK · ALINEADO · DESALINEAMIENTO_GENERALIZADO

### P&L Talent — Diagnósticos diferenciales (5)
LIDERAZGO · CONCENTRACION · ANTIGUEDAD_SENIOR · RECAMBIO · GENERIC

### TAC — Acciones (3)
NOTIFY_HRBP · SCHEDULE_COMMITTEE · FLAG_FOR_REVIEW

### Span — 8 narrativas
MICRO-EQUIPO · CAPA SIN VALOR · MICROMANAGEMENT · CAPA CIEGA · CAPACIDAD SUBUTILIZADA · SOBRECARGA CON VISTA GORDA · LÍDER ALTA CAPACIDAD · RESULTADO A COSTA PRESIÓN

### Goals — 5 narrativas de valor
Fuga Productiva · Bonos Sin Respaldo · Talento Invisible · Ejecutores Desconectados · No Sabe vs No Quiere

---

## 🟡 IMPLEMENTACIÓN — Estado y deuda

### Implementado completo
- Compliance / Ambiente Sano (10 motores) — ConvergenciaEngine v2 las 3 fases completas
- Performance 360° + Calibración + 9-Box + TAC
- Talent Intelligence (20 narrativas + 6 casos AAE)
- Sucesión (incluye DiagnosisEngine + PDISuggestionEngine)
- Onboarding Intelligence (EXO Score + benchmarks)
- Exit Intelligence (EIS + RetentionEngine con transparencia financiera)
- Workforce Intelligence (10 detectores + PersonExposureNarrative)
- **Frontend `/dashboard/workforce/` completo** — MissionControl, Rail, Cinema Orchestrator, Cascada (5 actos: Gancho → Problema → Amplificador → Costo → Riesgo → Síntesis), instrumentos (descriptor-simulator con 4 capas + 4 pasos, nine-box matrix), 3 tabs (Estructura, Benchmarks, Simulador), página presupuesto, hooks (useWorkforceData), modals (Inertia, Retention, TopSegmentos, ZombiesBySegment, CrossIntelligence). Endpoint `/api/executive-hub/exposure-ia` operativo redirigiendo a la cascada workforce.
- Goals (4 cuadrantes + 6 diagnósticos + correlación Pearson)
- **OccupationResolver v3** — implementado completo. LLM via Anthropic `claude-haiku-4-5-20251001` con fallback elegante: si `ANTHROPIC_API_KEY` no está configurada, salta el step (no rompe). Quota mensual `LLM_MONTHLY_LIMIT = 200`. Procesa en batches de 20. Si la key está set, funciona; si no, ruta algorítmica sigue operando.
- **Efficiency Hub — 5 lentes migradas a LenteLayout (4 actos):** L1 CostoInercia, L2 TalentoZombie, L4 ArquitecturaLiderazgo, L5 BrechaProductividad, L9 PasivoLaboral, L9 TalentArbitrageMap. Solo **L7L8 MapaTalento** sigue en `LenteCard` legacy.
- Executive Synthesis (5 diagnósticos)
- Benchmarks RoleFit + EXO (3 combinatorias: GLOBAL + JOB_LEVEL + área×cargo)

### Parcialmente implementado / pendiente confirmado en código
- **Benchmark `exposure_ia`:** NO implementado. Confirmado en código:
  - `BenchmarkAggregationService.ts` solo registra `metricType: 'onboarding_exo'` (líneas 343, 354, 536, 547) y `metricType: 'performance_rolefit'` (líneas 761, 772).
  - `TabBenchmarks.tsx:5` comenta literal: *"Placeholder hasta que metrica exposure_ia exista en benchmark system"*.
  - `WorkforceRailCard.tsx:152` tooltip: *"Comparacion contra industria — pendiente metrica exposure_ia"*.
  - El endpoint `/api/executive-hub/exposure-ia` y el frontend Workforce ya consumen `AIExposureService` y `WorkforceIntelligenceService` directo — no necesitan benchmark para funcionar; el benchmark es un agregado adicional pendiente.
- **L7L8 MapaTalento:** único lente en `LenteCard` legacy. Resto migrado a `LenteLayout`.
- **Cross-Cycle Comparison:** Fase Crecimiento, no deuda técnica.
- **TAC nextEvaluationAt:** placeholder fijo +180d. CRON futuro debe usar `PerformanceCycle` real.
- **Caso positivo (Fase 2 narrativas):** Cascadas asumen crisis. Falta tono "blindaje" cuando datos positivos.

### Documentado pero no implementado
- **Triage Tank (Workforce instrumento adicional):** confirmado que no existe en `src/` (Glob `triage*` y `Triage*` vacíos). Reutilizaría `PersonExposureNarrativeService`.
- **Proyecto "salario":** habilitaría P&L financiero de TAC. (Listado en MEMORY como próximo).

### Deuda técnica reconocida (no bloqueante)
- **Department Snapshots en PerformanceRating:** transferencias entre departamentos no preservan snapshot histórico para reportes de ciclos COMPLETED. Solo afecta agrupación retroactiva (no scores). Plan de remediación documentado en `.claude/tasks/SEGURIDAD_TRANSFER_DEPARTAMENTOS_PERFORMANCE.md`.
- **Tokens divergentes módulo compliance:** `bg-[#0F172A]/90`, `backdrop-blur-2xl`, `rounded-[20px]`, componente `SectionShell`. Reconocida como deuda técnica visual; no afecta motores.
- **InsightSpotlightCard:** sidebar 260px que NO es SmartRoute (Executive Hub).
- **Debug logs temporales:** `/api/succession/critical-positions/[id]/route.ts`.

### ⚠️ Auditoría de exactitud de esta sección (2026-05-06)
Versión inicial v1.0 reportó 4 gaps inexactos basados en MEMORY.md sin verificar contra código real. Corregidos tras verificación quirúrgica:
- ❌ "Frontend `/dashboard/workforce/` no existe" → ✅ existe extensivamente con cascada, instrumentos, MissionControl, tabs.
- ❌ "OccupationResolver v3 BLOQUEADO por ANTHROPIC_API_KEY" → ✅ implementado con fallback elegante; funciona si la key está set, no rompe si no.
- ❌ "L4/L5/L7/L9 en LenteCard legacy" → ✅ solo L7L8 sigue en LenteCard; resto migrado.
- ❌ "Endpoint exposure_ia no existe" → ✅ existe en `/api/executive-hub/exposure-ia/route.ts`. Lo que falta es el benchmark agregado, no el feature.

Lección: el contenido de MEMORY.md describe estado al momento de su escritura, no estado actual. Verificar siempre contra código antes de afirmar.

---

## 📐 PRINCIPIOS QUE GOBIERNAN TODOS LOS MOTORES

> Anclaje al `MANIFIESTO_FOCALIZAHR_v5.md`:

1. **La verdad nace de la fusión, no de fuentes aisladas.** ConvergenciaEngine es la materialización de este principio — cruza Likert + LLM + Exit + Onboarding + Pulso + ISA con pesos dinámicos.

2. **Si no es inteligente, no se construye.** Cada motor genera contradicción o señal accionable. PatternDetector, AnalyticsService, AggregationService son medios; los motores de inteligencia son fines.

3. **La verdad exige confidencialidad.** PrivacyThreshold n<5 en SafetyScore. `criticalByManager` solo expone `departmentIds`, nunca `managerId`. PatronesLLM `[CENSURADO]` + max 8 palabras.

4. **Diagnóstico quirúrgico, nunca soluciones universales.** ExecutiveSynthesisEngine prioridad fija (Liderazgo>Concentración>Antigüedad>Recambio) — un solo diagnóstico, no una lista.

5. **Consecuencia, no instrucción.** TalentNarrativeService.urgencySignal: "Probablemente esté evaluando opciones fuera". Nunca "deberías hacer X".

6. **Narrativa antes de dato.** Cada motor (TalentNarrative, GoalsSynthesis, ExecutiveSynthesis, ComplianceNarrative) tiene capa de narrativa McKinsey-Apple antes de número.

7. **Análisis del cargo, gestión de la persona.** Workforce + AIExposure → cargo. Talent + Person → persona. Distinción quirúrgica.

8. **Cero hardcode.** Todos los thresholds en config files (`performanceClassification.ts`, `successionConstants.ts`, `convergenciaWeights.ts`, `GOALS_THRESHOLDS`).

---

## 🧬 ÁRBOL DE DEPENDENCIAS

```
INPUT (Survey + Employee Master + Performance Cycle + Exit Records + Onboarding Journey)
  │
  ├─ AggregationService + responseNormalizer → Response.normalizedScore
  │
  ├─ Compliance Branch:
  │   SafetyScoreService → PatronesLLMService (per-dept) → detectTeatroCumplimiento
  │     → ISAService → ConvergenciaEngine v2 (Motor A + Motor B + memoria) →
  │     ComplianceAlertService → MetaAnalisisLLMService (org-level) →
  │     ComplianceNarrativeEngine → ComplianceAnalysisOrchestrator (orquesta async)
  │
  ├─ Performance Branch:
  │   PerformanceResultsService (4 evaluadores 0/60/25/15) →
  │     CompetencyScoreService → RoleFitAnalyzer →
  │     TalentIntelligenceService (8 cuadrantes) → TalentNarrativeService (20 narrativas)
  │     → CalibrationService → ManagerVarianceService → IndividualReportService
  │
  ├─ Workforce Branch:
  │   AIExposureService (focalizaScore canónico) → AutomationClassificationService →
  │     WorkforceIntelligenceService (10 detectores en bulk) →
  │     PersonExposureNarrativeService (6 casos AAE) → PLTalentService →
  │     SpanIntelligenceService → EfficiencyCalculator → EfficiencyNarrativeEngine
  │
  ├─ Onboarding Branch:
  │   OnboardingEnrollmentService → OnboardingIntelligenceEngine (EXO Bauer 0.20/0.30/0.25/0.25) →
  │     OnboardingEffectivenessAnalyzer → OnboardingAlertService → OnboardingBenchmarkService
  │
  ├─ Exit Branch:
  │   ExitRegistrationService → ExitAggregationService (gold cache 12m) →
  │     ExitIntelligenceService (EIS) → ExitAlertEngine → RetentionEngine (CFO-ready)
  │
  ├─ Goals Branch:
  │   GoalsService + GoalRulesEngine → GoalsDiagnosticService (4 cuadrantes + Pearson) →
  │     GoalsSynthesisEngine (6 diagnósticos)
  │
  ├─ Sucesión Branch:
  │   SuccessionService (RoleFit≥75 + 9-box elegible) → SuccessionDiagnosisEngine (10 casos) →
  │     PDISuggestionEngine → SuccessionSyncService
  │
  └─ Síntesis Cross-módulo:
      TalentRiskOrchestrator (cross Goals × Talent) → ExecutiveSynthesisEngine (5 diag) →
        ExecutiveNarrativeService → IntelligenceInsightService (memoria entre ciclos) →
        BenchmarkAggregationService → InsightEngine (reglas mercado)
```

---

**Documento generado:** 2026-05-06
**Versión:** v1.0
**Próxima revisión:** Cuando se implemente Triage Tank, se agregue `exposure_ia` al benchmark system, o se migre L7L8 a LenteLayout.

> *"Cada motor existe porque genera valor donde antes no había. Si no genera valor, no se construye. Si no cambia una decisión, no se muestra. Si no es inteligente, no se hace."* — Manifiesto FocalizaHR v5.0
