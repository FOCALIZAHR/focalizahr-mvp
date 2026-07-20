---
name: project_performance_inventario_producto
description: "Inventario de producto del módulo Performance (Evaluación Desempeño) FocalizaHR — 8 capacidades, modelo datos, APIs, UI, motores 360/9-box/talento/calibración. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Performance mapeado como producto, 2026-06-25. Read-only, file:line abajo. Motor de evaluación 360° + inteligencia de talento. El módulo más grande: ~30 modelos, ~450 campos, 19 enums, ~47 endpoints, ~70 componentes.

**8 CAPACIDADES:**
1. Ciclos configurables — PerformanceCycle (schema:1812-1894), 7 tipos (MONTHLY/QUARTERLY/SEMI_ANNUAL/ANNUAL/IMPACT_PULSE/PROBATION/CUSTOM), config 360 granular (includesSelf/Manager/Peer/Upward), snapshot competencias congelado, estados DRAFT→SCHEDULED→ACTIVE→IN_REVIEW→COMPLETED (auto-genera ratings en IN_REVIEW).
2. 360° con pesos por evaluador — getEvaluateeResults (PerformanceResultsService.ts:99). Nota oficial PONDERA: FOCALIZAHR_DEFAULT_WEIGHTS Self0/Manager60/Peer25/Upward15 (performanceClassification.ts:129), renormaliza si falta evaluador. Resolución cycle.override>account>default (getResolvedWeights PerformanceRatingService.ts:104). calculateWeightedScore (performanceClassification.ts:831). getEvaluateeResults overallAvgScore es PROMEDIO SIMPLE (reporting :202); la nota oficial pondera (PerformanceRatingService:263).
3. Hybrid score competencias+metas — calculateHybridScore (PerformanceRatingService.ts:164): (comp×pesoComp%)+(metasNorm×pesoMetas%), default 70/30. Metas normalizadas 1-5, leídas al cierre vía getEmployeeGoalsScore(employeeId,cycleEndDate)=Time Travel. Sin metas→100% competencias.
4. Role Fit 0-100% — RoleFitAnalyzer.calculateRoleFit (:72), Capped Average (sobre-calif no compensa). 5 niveles OPTIMAL≥90/SOLID≥75/DEVELOPING≥60/GAP≥40/RISK. getOrgRoleFitMatrix (:273) por capa×gerencia.
5. 9-Box Performance×Potencial — potencial directo 1-5 o factores AAE. Thresholds HIGH4.0/MEDIUM3.0. 9 posiciones (STAR/GROWTH_POTENTIAL/POTENTIAL_GEM/HIGH_PERFORMER/CORE_PLAYER/TRUSTED_PROFESSIONAL/INCONSISTENT/AVERAGE/UNDERPERFORMER). calculate9BoxPosition. Capa 2: solo jefe directo asigna potencial. recalculate9BoxPosition:793.
6. Inteligencia talento — TalentIntelligenceService (:108), umbral RoleFit75%, test ácido nivel2=NEUTRAL. Movilidad (RoleFit×Aspiración): SUCESOR_NATURAL/EXPERTO_ANCLA/AMBICIOSO_PREMATURO/EN_DESARROLLO. Riesgo (RoleFit×Engagement): MOTOR_EQUIPO/FUGA_CEREBROS(RED SLA48h)/BURNOUT_RISK(ORANGE SLA168h)/BAJO_RENDIMIENTO(RED SLA72h). Sincroniza CriticalPosition.incumbentFlightRisk (puente Sucesión).
7. Calibración gobernanza+auditoría — wizard 5 pasos selección multicriterio (jobLevel/jobFamily/directReports/customPicks, CalibrationService.buildCandidatesQuery:27). Cinema drag-drop + alertas consistencia. Ajustes PENDING→aplicación atómica al cerrar (close/route.ts:78-138). PDF+QR en Supabase (CalibrationAuditPDF.ts:38, uploadToSupabaseStorage.ts:38). Bonus factors STARS1.25/HIGH1.15/CORE0.90/NEUTRAL0.70/RISK0. Sesgo: evaluatorStatsEngine.ts:138 (ÓPTIMA/INDULGENTE avg≥4.2/SEVERA avg≤2.5/CENTRAL stdDev<0.5&count≥5), ManagerVarianceService.ts:56 (varianza entre jefes BAJA<0.5/MEDIA/ALTA≥1.0).
8. Competencias+PDI+track — biblioteca CRUD+templates+targets por nivel. PDI (DevelopmentPlan/Goal) con check-ins, sugerencias IA, vínculo a metas negocio. PerformanceTrackValidator.ts:69 cuarentena human-in-the-loop (COLABORADOR con reportes→anomalía, NO auto-cambio).

**APIs (~47):** /api/admin/performance-cycles/** (crear/generar/stats/results/tracking/hierarchy), /api/admin/performance-ratings/** (+[id]/calibrate, nine-box), /api/performance-ratings/[id]/potential, /api/evaluator/** (assignments/questions/stats/cycles/potential), /api/calibration/** (sessions/adjustments/close/publish/preview/managers/employees/job-titles), /api/admin/competencies/** (+templates/initialize/targets), /api/pdi/** (+check-ins/goals/generate-suggestion), /api/admin/performance-config, /api/performance/role-fit, /api/executive-hub/calibration. RBAC performance:view/manage, calibration:view/manage, competencies:manage, potential:assign, evaluations:view/submit.

**UI (~18 páginas, ~70 componentes):** admin/performance-cycles (lista, [id], results, results/[evaluateeId] radar+gaps, tracking, drill-down), evaluaciones (Cinema Mode portal evaluador + [assignmentId] survey + summary), performance/nine-box (grid 3×3 interactivo), performance/calibration (lista + new wizard + sessions/[id] cinema drag-drop), admin/competencias (CRUD+library). Componentes: 35 performance + 19 calibration (wizard 5 pasos + cinema + closing ceremony evidence/cost/verdict) + 15 executive-hub (CalibrationHealth bell curve+gerencia, TalentMini9Box, CapacidadesIntelligence RoleFit). Summary Cinema 3 puertas (Diagnóstico/Conversación/Desarrollo). Hooks useEvaluatorCinemaMode:37, useCalibrationRoom, useCalibrationRules.

**DIFERENCIADORES comerciales:** (1) no es 360 más, es máquina de decisiones de talento en cadena (eval→9box→roleFit→movilidad/riesgo→sucesión→compensación). (2) self 0% combate inflación autoeval. (3) calibración auditable PDF+QR + detección sesgo evaluador. (4) alertas fuga con SLA (FUGA_CEREBROS 48h). (5) human-in-the-loop en anomalías estructura.

**DEUDAS verificadas (no vender sin matiz):** calibración SIN approvedBy ni gate aprobación obligatorio (ajustes se aplican al cerrar sin firma); PDF seguro Supabase pero NO encriptado app; estilo evaluador intra-ciclo sin histórico cross-ciclo. Detalle: [[project_gate0_dossier_calibracion_performance]], [[project_gate0_base_madre_desempeno_metas]].

Hermano de [[project_metas_inventario_producto]] (Metas se enchufa aquí vía hybrid score). Estilo evaluador transversal a Efficiency L4+Goals.

## Por qué importa (vista comercial)

- **Qué resuelve:** no es "un 360 más" — es una **máquina de decisiones de talento en cadena**: la evaluación alimenta el 9-box, que alimenta el RoleFit, que alimenta movilidad y riesgo, que alimentan sucesión y compensación. Una sola captura de datos, seis decisiones.
- **A quién le importa:** al **CEO** (la cadena completa), a **RRHH** (calibración defendible) y al **gerente de línea**, que recibe alertas de fuga con SLA en vez de enterarse cuando llega la carta de renuncia.
- **Qué ofrece que el mercado no:** **self al 0%** — la autoevaluación se usa para detectar brechas de percepción, nunca para la nota, lo que ataca de raíz la inflación de la autoevaluación.
- **Defendibilidad:** la calibración es **auditable con PDF + QR** y el sistema detecta el sesgo del evaluador; cuando alguien impugna una nota, hay rastro.
- **Human-in-the-loop:** las anomalías de estructura (un "manager" sin reportes, un colaborador con equipo) se ponen en cuarentena para decisión humana, no se corrigen en silencio.
