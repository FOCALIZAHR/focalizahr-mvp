---
name: project_gate0_dossier_calibracion_performance
description: "Gate 0 read-only (jun-2026) verificación estado vivo calibración+performance para dossier comercial — 4 prioridades + 2 correcciones, con file:line"
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Gate 0 read-only ejecutado 2026-06-25 para dossier comercial. Verificación contra código vivo en `main` (no docs). Encargo: confirmar qué afirmaciones de docs siguen vigentes HOY.

**P1 — nineBox recalcula tras calibración: SÍ (deuda cerrada).** Victor tenía razón.
- Recálculo al CREAR el adjustment: `src/app/api/calibration/sessions/[sessionId]/adjustments/route.ts:228-236` (línea 235 `calculate9BoxPosition`), usa el `newFinalScore`. Solo si `effectivePotential` existe (línea 232).
- Aplicación al cerrar: `close/route.ts:106-108` persiste el `newNineBox` ya congelado (no recomputa).
- Matiz: sin `potentialScore` el nineBox era null desde el origen (9-box es bi-axial), así que NO hay desync real. Existe `PerformanceRatingService.ts:793 recalculate9BoxPosition()` disponible pero el cierre NO lo invoca (grieta menor: newNineBox se congela al crear el adjustment).

**P2 — Plan de acción ingresado por calibrador no-jefe: NO existe wiring (latente).**
- Pregunta corregida por Victor: NO era "agregar meta/DevelopmentGoal", era agregar un OBJETIVO/ACCIÓN al PLAN DE ACCIÓN durante el acto de calibrar.
- `ActionPlan` (`prisma/schema.prisma:3570`) tiene autoría real (createdBy/updatedBy/approvedBy) pero `moduleType` = compliance|exit|onboarding. SIN vínculo a calibración.
- `CompliancePlanAction` (`schema.prisma:3733`) atado a campaignId de compliance, sin `calibrationSessionId`.
- Calibración NO crea acciones: `adjustments/route.ts:240-254` solo crea `CalibrationAdjustment` (autoría `adjustedBy: userEmail`) + `justification` texto libre. `close/route.ts:79-138` solo aplica scores + PDF.
- Endpoints de creación (`POST /api/action-plans:118`, `POST /api/compliance/plan-actions:97`) exigen `compliance:manage`, no se invocan desde calibración.
- Latente: el ladrillo de autoría existe (ActionPlan.createdBy toma usuario autenticado); falta moduleType:'calibration'/calibrationSessionId + wiring desde cierre.

**P3 — El cruce que sostiene la tesis: TODO confirmado.**
- `calculateHybridScore` funde competencias+metas: `PerformanceRatingService.ts:164-237`.
- Time Travel SÍ: llama `GoalsService.getEmployeeGoalsScore(employeeId, cycleEndDate)` en `PerformanceRatingService.ts:198`; GoalsService reconstruye histórico a la fecha (`GoalsService.ts:254-331`, filtra progressUpdates `createdAt <= asOfDate`).
- Pesos por evaluador SÍ (no promedio simple): `getEvaluateeResults` (`PerformanceResultsService.ts:99-261`) + `calculateWeightedScore` (`performanceClassification.ts:831-870`, score×peso). Defaults `FOCALIZAHR_DEFAULT_WEIGHTS` (`performanceClassification.ts:129`: manager 60/peer 25/upward 15/self 0). Resolución jerárquica `getResolvedWeights(accountId,cycleId)` ciclo>cuenta>default (`PerformanceRatingService.ts:260`).

**P4 — Estilo del evaluador (ÓPTIMA/INDULGENTE/SEVERA/CENTRAL): Victor tenía razón, se usa en OTRO producto.**
- Corrige conclusión inicial errónea ("solo intra-ciclo en performance").
- Motor: `getEvaluationClassification(avg,stdDev,count)` en `src/lib/utils/evaluatorStatsEngine.ts:138`.
- REUTILIZADO en Efficiency Hub Lente L4 (Arquitectura de Liderazgo): `SpanIntelligenceService.ts:542-548` calcula `perfilEvaluativo` por gerente; alimenta matriz narrativa 8 combinaciones (`:119-270`, ej INDULGENTE+metas bajas="Capa sin valor", SEVERA+metas altas="Micromanagement"). Render `src/components/efficiency/lentes/L4ArquitecturaLiderazgo.tsx`. También badge en Goals (`GoalsDiagnosticService.ts:335`) y `EfficiencyDataResolver.ts:502`.
- PERO: sigue siendo intra-ciclo (lee ciclo más reciente `SpanIntelligenceService.ts:432-440` orderBy endDate desc), calculado en memoria, NO persiste en BD (no hay modelo Evaluator*/Bias/Style en schema), NO compara ciclo-N vs N-1.
- Latente: falta capa de persistencia temporal (snapshot por ciclo) para mostrar deriva del evaluador. El motor ya está probado y reutilizado en 3 lugares.

Lectura comercial: P1 y P3 = vendibles (cerrados/sólidos). P2 y P4 = capacidades latentes de alto valor (ladrillos listos, falta wiring/persistencia), útiles como roadmap, NO como "ya funciona". Ver [[project_cascada_as_arquitectura]] para Compliance ActionPlan.
