---
name: project_metas_inventario_producto
description: "Inventario de producto del módulo Metas (Goals) FocalizaHR — 7 capacidades, modelo de datos, APIs, UI, motores de diagnóstico. Mapa para base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Metas (Goals) mapeado como producto, 2026-06-25. Read-only, file:line abajo. Es motor de cascada estratégica + medición + diagnóstico Goals×Performance. Soberano (periodYear/periodQuarter propio, independiente de ciclos eval), se enchufa a Performance vía getEmployeeGoalsScore.

**MODELO DE DATOS (7 modelos, ~89 campos, 9 enums) — prisma/schema.prisma:**
- `Goal:2591-2698` (33 campos): identidad, jerarquía (parentId/children self-relation, level, originType), propiedad (employeeId/departmentId), definición (title/type/description), vigencia (startDate/dueDate/periodYear/periodQuarter), medición (metricType/startValue/targetValue/currentValue/unit/progress), resultados (status/isAligned/isOrphan), integración perf (weight), PDI (linkedDevGoalId @unique), cierre (closureRequestedBy/At, closedBy/At, closureApprovedBy, closureNotes), isLeaderGoal. 8 índices.
- `GoalProgressUpdate:2704-2731` — Time Travel, snapshot inmutable (previous/newValue+Progress, comment, evidence, createdAt index VITAL).
- `GoalLibrary:2737-2762` — templates (anti hoja-en-blanco), usageCount.
- `GoalJobConfig:2768-2783` — elegibilidad por standardJobLevel (hasGoals, goalGroupId).
- `GoalGroup:2789-2813` — pesos weightBusiness/Leader/NPS/Specific (suman 100).
- `GoalCascadeRule:2819-2845` — reglas cascada (sourceGoalId, targetGroupId, assignedWeight, isLeaderOnly, executionCount).
- Enums: GoalLevel (COMPANY/AREA/INDIVIDUAL), GoalOriginType (STRATEGIC_CASCADE/MANAGER_CREATED), GoalType (KPI/OBJECTIVE/KEY_RESULT/PROJECT), GoalMetricType (PERCENTAGE/CURRENCY/NUMBER/BINARY), GoalStatus (NOT_STARTED/ON_TRACK/AT_RISK/BEHIND/PENDING_CLOSURE/COMPLETED/CANCELLED).
- Integración: PerformanceRating (goalsScore/goalsRawPercent/goalsCount/hybridScore), PerformanceCycle (competenciesWeight/goalsWeight/includeGoals default 70/30), Account.maxIndividualGoals (default 10).

**SERVICIOS/MOTORES:**
- `GoalsService.ts`: createCorporateGoal:115, cascadeGoal:131, createManagerGoal:167, updateProgress:188, getEmployeeGoalsScore:254 (TIME TRAVEL), detectOrphans:340, getAlignmentReport:358, getAlignmentTree:414, checkGoalLimit:516, createFromDevelopmentGoal:619, linkExistingGoal:689, requestClosure:738, approveClosure:764, rejectClosure:792, getPendingClosures:822, calculateProgress:886 (BINARY 0/100, else clamp 0-150), determineStatus:911. Validaciones: límite metas:539, peso≤100%:549, anti-dup:573/592.
- `GoalsDiagnosticService.ts` (1162 líneas): GOALS_THRESHOLDS:38 (HIGH_GOALS 80, LOW_GOALS 40, HIGH_ROLEFIT 75, etc). classifyQuadrant:306 (RoleFit75×Metas80 → CONSISTENT/PERCEPTION_BIAS/HIDDEN_PERFORMER/DOUBLE_RISK/NO_GOALS). calculatePearsonR:535. detectSubFindings:558 (5 narrativas persona). detectOrganizationalFindings:781 (3 gerencia). getCorrelationDetailV2:940 (orquestador CEO-first). evaluatorStatusToBadge:334 (estilo evaluador, intra-ciclo). Hallazgo 2C evaluadorProtege:615 (metas<40% + manager INDULGENTE).
- `GoalsSynthesisEngine.ts:55` — diagnóstico diferencial severidad: EVALUADOR>CONCENTRACION>ESTRELLAS>FRAMEWORK>ALINEADO>GENERALIZADO. Veredicto integridad AUDITABLE/CON_RESERVAS/NO_AUDITABLE.
- `GoalRulesEngine.ts`: previewRuleImpact:65, applyCascadeRule:131 (crea metas lote).
- Narrativas: `GoalsNarrativeDictionary.ts` (12 narrativas), `CompensacionNarrativeDictionary.ts`.

**APIs (23 endpoints, RBAC goals:view/create/approve/config):** /api/goals (GET/POST), /[id] (GET/PATCH/DELETE), /[id]/cascade, /[id]/check-in, /[id]/request-closure, /[id]/approve-closure, /alignment-tree, /alignment-report, /orphans, /employee-score, /pending-closure, /team, /team/coverage, /from-pdi, /link-pdi. Config: /config/goal-rules (+[id]/preview+execute), /config/goal-eligibility, /config/goal-groups, /config/goals-impact. Executive: /executive-hub/goals-correlation.

**UI (11 páginas, ~60 componentes):** páginas dashboard/metas/ (redirector por rol, estrategia=Torre Control CEO, equipo=Cinema Mode, arbol, aprobaciones, crear, [id], configuracion+grupos+reglas+wizard). Wizards: CreateGoalWizard (6 pasos), BulkAssignWizard (4 pasos). Cinema Mode (GoalsCinemaOrchestrator + Rail + Spotlight). Cascada ejecutiva Insight#7 (GoalsCorrelation/cascada: portada→NavPill 3 tabs Diagnóstico/Localización/Compensación→actos+heatmaps+modales). Hooks: useGoals, useTeamGoals, useGoalsHubData, useGoalDetail, useAlignmentTree.

**DIFERENCIADORES comerciales:** (1) no es tracker OKR, es detector de incoherencias org (eval≠resultado). (2) Time Travel real (cumplimiento al cierre, no hoy). (3) cascada automática por reglas de cargo. (4) integridad auditable por gerencia.

**DEUDAS VIGENTES (no vender hasta cerrar):** "Solicitar Cierre" botón sin wiring de prop UI; 6 endpoints aux sin hasPermission (alignment-tree, employee-score, from-pdi, link-pdi, cascade, team/coverage); 4 endpoints escritura sin validación ownership post-búsqueda. Ver [[project_gate0_metas_estado_vivo]].

Relacionado: [[project_gate0_base_madre_desempeno_metas]] (pesos, brecha, salario), [[project_gate0_dossier_calibracion_performance]] (estilo evaluador transversal).
