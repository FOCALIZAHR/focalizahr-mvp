---
name: project_gate0_metas_estado_vivo
description: Gate 0 read-only (jun-2026) estado vivo módulo Metas — qué está vivo/roto/backend-sin-UI. Doc maestro Metas feb-2026 desactualizado. file:line.
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Gate 0 read-only 2026-06-25, módulo Metas. Verifica qué cambió desde doc maestro feb-2026. file:line de código vivo.

**P1 — Seguridad APIs goals: doc feb OBSOLETO, filtrado jerárquico AHORA VIVO en núcleo, gaps en auxiliares.**
- `GET /api/goals/route.ts:56-124`: extractUserContext+hasPermission('goals:view'):70+accountId:87+filtrado jerárquico real :90-124 (AREA_MANAGER ve COMPANY+AREA/INDIVIDUAL de scope vía getChildDepartmentIds :96; EVALUATOR ve COMPANY+INDIVIDUAL por managerId :104).
- Seguros completos: GET/POST /goals, GET /[id], orphans, alignment-report, pending-closure, team.
- ⚠️ Permiso OK sin filtrado jerárquico en escritura: PATCH /[id], approve-closure, request-closure, check-in (no validan ownership del recurso por ID).
- ❌ SIN hasPermission (solo extractUserContext+accountId): alignment-tree, employee-score, from-pdi, link-pdi, cascade, team/coverage. DEUDA SEGURIDAD.
- Para doc: afirmable "filtrado jerárquico vivo", NO "módulo blindado".

**P2 — Flujo cierre: backend completo, UI a medias.**
- Backend ✅: request-closure, approve-closure (approve/reject), pending-closure. Campos schema closure*.
- "Solicitar Cierre" ❌ ROTO: botón existe (GoalDetailHeader.tsx:168-177, GoalCard.tsx:114-124, aparece ≥80%) pero `/dashboard/metas/[id]/page.tsx:106` NO pasa prop onRequestClosure → click no hace nada. RequestClosureButton.tsx existe pero nunca se importa. Fix trivial: pasar 1 prop.
- "Aprobar Cierres" ✅ completo: `/dashboard/metas/aprobaciones/page.tsx` fetch pending-closure, Aprobar :314, Rechazar+modal motivo ≥10 chars :354.
- Consecuencia: NO consumible end-to-end (nadie puede disparar request → cola aprobación inalcanzable).

**P3 — Cascada/alineación: TODO vivo end-to-end (doc se quedó corto).**
- Goal self-relation parentId/children (schema:2591-2698), isAligned/isOrphan herencia transitiva GoalsService.cascadeGoal:131. detectOrphans:340. getAlignmentTree:414.
- GoalCascadeRuleManager (reglas por cargo): vivo E2E — modelo GoalCascadeRule (schema:2819-2845), UI components/goals/admin/, motor GoalRulesEngine.applyCascadeRule:131 crea metas reales, página /configuracion/reglas.
- BulkAssignWizard: vivo E2E — wizard 4 pasos, POST paralelo /api/goals:256, integrado Cinema Mode equipo.

**P4 — 4 cuadrantes Goals×Performance: COMPLETOS y vivos (no bono suelto).**
- classifyQuadrant `GoalsDiagnosticService.ts:306-315`: matriz 2×2 RoleFit75×Metas80 → CONSISTENT/PERCEPTION_BIAS/HIDDEN_PERFORMER/DOUBLE_RISK (+NO_GOALS).
- Join real: PerformanceRating persiste ambos ejes (goalsRawPercent vía Time Travel + roleFitScore). buildCorrelationPoints los lee juntos.
- UI: cascada Compensación (CompensationSplit/Portada), colores ADN cyan/amber/slate/violet. score360 NO es eje, es color del punto (validador percepción). Sellado commit c48b2cd.

**P5 — Estilo evaluador en Goals: vivo y cableado, INTRA-CICLO.**
- evaluatorStatusToBadge:334 (ÓPTIMA/INDULGENTE/SEVERA/CENTRAL). Cruce con metas: Hallazgo 2C :615-643 (metas<40%+INDULGENTE), matriz confianza green/amber/red :503-512. UI GoalsFindingModal/CompensationSplit/EvaluadorHeatmap. Sin histórico cross-ciclo (consistente con [[project_gate0_dossier_calibracion_performance]]).

Inventario completo de producto: [[project_metas_inventario_producto]]. Base madre: [[project_gate0_base_madre_desempeno_metas]].
