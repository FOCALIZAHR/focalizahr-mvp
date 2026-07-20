---
name: project_ambientesano_inventario_producto
description: "Inventario de producto del módulo Ambiente Sano (Compliance/Ley Karin) FocalizaHR — Safety Score+ISA+convergencia 3 motores+7 alertas+11 intervenciones, Cinema Mode 10 secciones. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Ambiente Sano (Compliance/Ley Karin) mapeado como producto, 2026-06-25. Read-only, file:line abajo. El más grande. Sistema cumplimiento Ley Karin como inteligencia organizacional: mide seguridad psicológica (encuesta+LLM), índice ISA, cruza 4 instrumentos, alertas SLA, intervenciones basadas en evidencia, plan auditable. Persiste 4 modelos + LLM async.

**7 CAPACIDADES:**
1. Safety Score 6 dims — SafetyScoreService. P2 seguridad/P3 disenso/P4 microagresiones(invertida)/P5 equidad/P7 liderazgo/P8 agotamiento(invertida). Escala 1-5, CRITICAL<2.5/RISK 2.5-3.0/SAFE≥3.0. Privacy threshold n<5 omite. (P1 texto LLM, P6 UX branching no numéricos).
2. ISA 0-100 — ISAService.calculateISAWithComponents:64-104. 3 componentes pesos dinámicos: Voz Estructurada(Safety 60%/70%/100%)+Voz Libre(LLM P1 25%/30%)+Convergencia(señales cruzadas 15%). Penalización teatroCumplimiento ×0.7 (scores altos pero LLM contradice).
3. Análisis LLM patrones — ComplianceAnalysisOrchestrator (Anthropic, async PENDING→RUNNING→COMPLETED, 45s sync + CRON). 5 patrones P1: silencio_organizacional/hostilidad_normalizada/favoritismo_implicito/resignacion_aprendida/miedo. + override teatro/sesgo_género.
4. Convergencia 3 motores — ConvergenciaEngine. Motor A interno 5 casos: A1 doble confirmación(ISA<50+patrón>0.4), A2 teatro(ISA≥75+patrón≥0.3), A3 sesgo género, A4 variable liderazgo(mismo gerente deptos críticos), A5 desincronía score↔texto. Motor B externo (Exit+Onboarding pesos+decaimiento ACTIVE1.0/RECENT0.6/HISTORIC0.3, EXO RISK≥70/CRIT<50, EIS RISK≥60/CRIT<40). Motor C síntesis→alertas.
5. 7 alertas SLA — complianceAlertConfig.ts:40-111. riesgo_convergente(72h HIGH), liderazgo_toxico(48h CRITICAL), silencio_organizacional(informativa), deterioro_sostenido(168h, vía Pulso degradación elegante), senal_ignorada(informativa, EXO<60+salida 12m), silencio_con_voz_externa(72h post-v1.0), participacion_anomala(medium post-v1.0, outlier <media-1SD).
6. Intervenciones 11 evidencia — InterventionEngine.ts:33-171. FAST_FEEDBACK/PSYCH_SAFETY_MODELING/BYSTANDER_INTERVENTION/DISSENT_INSTITUTIONALIZATION/HIGH_FREQ_PULSES/PROSOCIAL_ACTIVITIES/DECISION_ACCOUNTABILITY/WORK_REDESIGN/LEADERSHIP_ACCOUNTABILITY/OPPORTUNITY_GOVERNANCE/BEHAVIORAL_TRIANGULATION. IDs por CONDICIÓN del motor (no mecanismo). Matriz dimensión×nivel (:188) tripletas (0 recomendada+1+2). Mapeos PATRON/ALERT/CONVERGENCIA_INTERVENTIONS. Override teatro→BEHAVIORAL_TRIANGULATION, sesgo género→PSYCH_SAFETY+BYSTANDER. Consolida si 1 cubre 2+ triggers.
7. Plan acción auditable — CompliancePlanAction (schema:3733, una elección/trigger UNIQUE campaignId+triggerRef, chosenOption 0/1/2, interventionId, snapshot evidencia+plazo) se agrega a ActionPlan (3570, carrito genérico multi-módulo compliance/exit/onboarding, borrador→aprobado inmutable→enmiendas allowAmendment).

**MODELOS PRISMA (4):** ComplianceAnalysis (3612, DEPARTMENT/ORG, status PENDING/RUNNING/COMPLETED/FAILED, safetyScore/isaScore/previousIsaScore/teatroCumplimiento/alertaSesgoGenero/resultPayload JSON), ComplianceAlert (3673, 7 alertType, severity, slaHours/dueDate/slaStatus), CompliancePlanAction (3733), ActionPlan (3570 genérico). Safety/ISA derivados (persistidos al calcular desde Response.normalizedScore).

**APIs (~13):** /api/compliance/{campaigns,generate-participants,close-campaign(orquesta D6),metrics,analizar-patrones(LLM async),convergencia,report(orquestador maestro cascada 10 capas+Beat1/6),plan-actions} + /api/action-plans (genérico GET/POST/PUT/[planId]) + cron/compliance-process-pending (Bearer CRON_SECRET, drena PENDING 3 campañas×45s). RBAC compliance:view (ADMIN/OWNER/HR_ADMIN/HR_MANAGER/HR_OPERATOR/CEO/AREA_MANAGER jerárquico), compliance:manage (sin CEO/AREA_MANAGER). Servicios: SafetyScoreService, ISAService, ComplianceAnalysisOrchestrator, ConvergenciaEngine, ComplianceAlertService, InterventionEngine, CoverageAnalysisService, DepartmentRiskScoreService, AmbienteRiskOrchestrator+AmbienteSynthesisEngine (Beat1/6), ComplianceParticipantGenerator (employee-based).

**UI (~51 componentes, 2 hooks):** /dashboard/compliance Cinema Mode (ComplianceOrchestrator lobby↔spotlight, ComplianceMissionControl gauge, ComplianceRail, ComplianceStage switch). 10 SECCIONES: Síntesis/Cascada(6 beats Ambiente/Triage/Anatomía/Voz/Nombre/Síntesis)/Ancla(SectionAncla gauge ISA por depto + 4 nodos)/Heatmap/Dimensiones(state machine ISAPortada→DecisionConsole 30/70)/Patrones IA/Convergencia(Motor A/B bandas)/Simulador(RecommendationCard intervenciones)/Alertas(amber legal)/Cierre(plan consolidado+FrancotiradorEmpty+cross-sell). Cascada src/components/compliance/cascada (CascadaCompliance stacker+AnclaISA+6 actos+modals). IndicatorGauge (anti-semáforo cyan/slate/amber), SectionShell (chrome). Hook useComplianceData (855 líneas: carrito decisiones, autosave 1500ms 3 capas state→sessionStorage→BD). useComplianceCampaigns.

**DIFERENCIADORES:** (1) compliance que predice no solo cumple (ISA+convergencia antes de denuncia). (2) voz libre+estructurada (LLM desenmascara teatro cumplimiento). (3) intervenciones respaldo científico citado. (4) convergencia multi-instrumento (señal débil Onboarding+patrón Exit+score bajo Ambiente=alerta crítica).

**CORRECCIONES VERIFICADAS:** Deuda tokens RESUELTA — agente NO encontró bg-[#0F172A]/90/rounded-[20px]/backdrop-blur-2xl en compliance; SectionShell usa canónicos (bg-slate-900/60/rounded-2xl/backdrop-blur-sm). PERO frontend-design.md AÚN lista esos tokens como deuda compliance (regla desactualizada vs código; verificar antes de confiar). Post-Gate 6 jun-2026 cascada cerrada production-ready.

**NOTAS:** LLM async límite 45s sync + CRON (campañas grandes dependen CRON). deterioro_sostenido depende Pulso. SLA estático (deuda reconocida).

Cruza [[project_exit_inventario_producto]] + [[project_onboarding_inventario_producto]] (Motor B convergencia externa). Ver memoria histórica Ambiente Sano: [[project_cascada_as_arquitectura]] (Gates 1-8), [[project_compliance_plan_global_decision]] (ActionPlan vs CompliancePlanAction), [[project_motor1_motor6_orden_casos_inconsistencia]], [[project_intervention_catalog_deuda]], [[project_ambiente_sano_diagnostico_jun2026]].

## Por qué importa (vista comercial)

- **Qué resuelve:** es **compliance que predice, no que solo cumple** — el ISA y la convergencia levantan la señal antes de que exista la denuncia, que es el único momento en que la intervención todavía es barata.
- **A quién le importa:** al **CEO y al directorio** (exposición legal y reputacional anticipada) y a **RRHH**, que deja de administrar un trámite y pasa a administrar un riesgo.
- **Qué ofrece que el mercado no:** el cruce de **voz libre y voz estructurada** — el análisis del texto abierto desenmascara el teatro de cumplimiento: ese departamento que puntúa 4.5 en la encuesta mientras el lenguaje dice lo contrario.
- **Convergencia multi-instrumento:** una señal débil en Onboarding + un patrón en Exit + un score bajo en Ambiente se combinan en **una alerta crítica** que ninguna de las tres fuentes habría generado por separado.
- **Accionabilidad:** las intervenciones sugeridas llevan **respaldo científico citado**, no recomendaciones genéricas de manual.
