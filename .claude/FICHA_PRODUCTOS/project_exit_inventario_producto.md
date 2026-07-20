---
name: project_exit_inventario_producto
description: "Inventario de producto del módulo Exit Intelligence FocalizaHR — registro+EIS+alertas+correlación onboarding+retención, 3 tablas propias, UI completa. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Exit Intelligence mapeado como producto, 2026-06-25. Read-only, file:line abajo. Sistema de inteligencia de salidas: convierte cada desvinculación en datos accionables. Diferenciador único: correlación salida↔onboarding (qué alertas tempranas se ignoraron). PERSISTE: 3 tablas propias (a diferencia de Workforce/Efficiency derivados).

**6 CAPACIDADES:**
1. Registro (individual+batch) — ExitRegistrationService. Por RUT, 13 razones (EXIT_REASONS src/types/exit.ts), talentClassification (key_talent/meets_expectations/poor_fit). Gate D D2 bloqueo duro maestro (409 si no existe). Auto-detecta onboarding (hadOnboarding+EXO+alertas). Dispara encuesta EIS. /api/exit/register, /register/batch, /employee-lookup.
2. EIS — ExitIntelligenceService.calculateEIS. Score 0-100 ponderado: P1 Satisfacción20%+P4 Liderazgo25%+P5 Desarrollo20%+P6 Seguridad25%(Ley Karin)+P7 Autonomía10%. Normaliza ((rating-1)/4)×100, mín 3 de 5 dimensiones. Clasificación HEALTHY≥80/NEUTRAL≥60/PROBLEMATIC≥40/TOXIC<40. Reutiliza Response.normalizedScore. P2 factores multi-select+P3 matriz severidad → exitFactors[]/exitFactorsDetail.
3. Alertas — ExitAlertService.ts (~650 líneas). 6 tipos: ley_karin(P6<2.5 CRITICAL 24h), toxic_exit_detected(EIS<25 HIGH 48h), liderazgo_concentracion(≥30% menciones+severidad≤2.0 HIGH 72h), nps_critico(eNPS depto<-30 HIGH 168h), department_exit_pattern+onboarding_exit_correlation (DIFERIDOS). Mín 3 exits con encuesta. Gestión pending→acknowledged→resolved/dismissed, SLA on_track/at_risk/breached.
4. Agregación departamental — ExitAggregationService (CRON mensual). DepartmentExitInsight: rotación voluntaria/involuntaria, scores promedio dimensión, eNPS (promotores 9-10/pasivos 7-8/detractores ≤6), topExitFactors P2+P3. DIFERENCIADOR: conservationIndex=(avgEIS/avgOnboardingEXO)×100, alertPredictionRate=(ignoredAlerts/withOnboarding)×100. eisTrend vs período anterior.
5. Análisis causas (5-6 actos) — /exit/causes: Truth (freq vs severidad), PainMap (heatmap depto), Drain (talento perdido por clasificación), Predictability (alertas ignoradas), ROI (costo+benchmark industria 2.8 baseline), HRHypothesis (RRHH cree vs realidad).
6. Retención — RetentionEngine.ts (~460 líneas). 3 casos ROI auditable (SHRM/Gallup/McKinsey): Ambiente Crítico(<2.5, ROI~250%), Retención Riesgo(<3.0, ROI~300%), Gap Liderazgo(<3.0, McKinsey 12.5%×gap, ROI~280%). Alimenta TAC/P&L Talent.

**MODELOS PRISMA (3):** ExitRecord (schema:1305-1387): nationalId/employeeId/exitDate/exitReason/eis/eisClassification/exitFactors[]/exitFactorsDetail/hadOnboarding/onboardingEXOScore/onboardingIgnoredAlerts/tenureMonths/hasLeyKarinAlert/talentClassification. ExitAlert (1390-1461): alertType/severity/triggerScore/exitCount/status/slaHours/dueDate/slaStatus. DepartmentExitInsight (1464-1552): gold cache rolling 12m, totalExits/voluntary/involuntary/avg*/enps/topExitFactors/conservationIndex/alertPredictionRate. Constraint depto+period+periodType.

**APIs (~10):** /api/exit/{register,register/batch,employee-lookup,records,alerts,alerts/[id],metrics,insights,insights/onboarding-correlation,causes} + cron/exit-aggregation. RBAC exit:register (sin CEO), exit:register:batch (sin HR_MANAGER), exit:records:read (+CEO, sin HR_OPERATOR/HR_MANAGER), exit:alerts:manage (+AREA_MANAGER jerárquico, scope company/filtered). Servicios: ExitRegistrationService, ExitIntelligenceService, ExitAlertService, ExitAggregationService, RetentionEngine, ExitAlertEngine.

**UI COMPLETA Y VIVA (~8 páginas, ~50 componentes, 7 hooks):** /exit (4 tabs Resumen/Ranking/Alertas/eNPS), /exit/overview (hook $M), /exit/causes (5 tabs Factores/Deptos/Talento/Predicción/ROI), /exit/executive (por gerencia), /exit/alerts (ExitAlertsCommandCenter: MoneyWall+GroupedFeed) + /exit/alerts/[id] (storytelling 3 actos RevelationCard+ActionPlan+ResolutionPanel), /exit/register (+individual con Employee lookup +register-batch CSV). Componentes: EISScoreGauge, RevelationCard (dicen vs duele), BenchmarkCard, TruthScatterChart, PainHeatmap, TalentDrainDonut, PredictabilityTimeline. Hooks useExitMetrics/useExitAlerts/useExitCauses/useExitRecords/useExitBatchUpload/useRetentionAnalysis (scope company/filtered RBAC bimodal).

**DIFERENCIADORES:** (1) correlación onboarding→exit única (salida predecible, costo evitable de alertas ignoradas). (2) EIS termómetro salud de la salida. (3) Ley Karin integrada (P6<2.5→crítica 24h). (4) de diagnóstico a ROI (costo rotación + benchmark).

**DEUDAS:** 2 tipos alerta diferidos (department_exit_pattern, onboarding_exit_correlation). SLA estático/sugerido no obligatorio. Algunos endpoints métricas/causas validan rol por código sin permiso en PERMISSIONS (gap menor RBAC). CRON aggregation y alerts-generation.

Consumidor de [[project_performance_inventario_producto]] (exit-cross con cuadrantes vía TAC). Alimenta [[project_tac_inventario_producto]] (RetentionEngine) y [[project_pltalent_inventario_producto]]. Correlaciona con Onboarding (módulo #6). Ver [[feedback_ia_es_componente_ambiente_sano]] (LLM segunda lectura mismo estudio).

## Por qué importa (vista comercial)

- **Qué resuelve:** demuestra que la salida **era predecible** — la correlación onboarding → exit conecta la señal temprana ignorada con la renuncia que costó, y pone precio a haberla ignorado.
- **A quién le importa:** al **CEO y al CFO** (costo de rotación con benchmark de mercado) y a **RRHH**, que deja de justificar salidas con anécdotas y pasa a un termómetro de salud de la salida.
- **Qué ofrece que el mercado no:** esa correlación onboarding → exit **no existe en las plataformas comparables**, que miden ambos momentos por separado y nunca los cruzan.
- **Cumplimiento:** Ley Karin integrada en el flujo (señal crítica con SLA de 24h), no como un módulo legal aparte que nadie abre.
