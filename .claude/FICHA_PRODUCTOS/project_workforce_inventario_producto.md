---
name: project_workforce_inventario_producto
description: "Inventario de producto del módulo Workforce Intelligence FocalizaHR — 6 capacidades, capa derivada (sin tablas propias), exposición IA, 9 detectores, presupuesto dotación. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Workforce Intelligence mapeado como producto, 2026-06-25. Read-only, file:line abajo. Capa de inteligencia organizacional que enriquece empleados cruzando performance+IA+financiero+sucesión. 100% DERIVADO en memoria (NO tablas Prisma propias; lee Employee/PerformanceRating/OnetOccupation/OccupationMapping). Patrón bulk enrichment + pure detection.

**CORRECCIÓN MEMORIA: /dashboard/workforce SÍ EXISTE con UI completa (jun-2026). El "no existe" era pre-enero 2026.**

**6 CAPACIDADES:**
1. EnrichedEmployee 28 campos — buildEnrichedDataset (WorkforceIntelligenceService.ts:454, type :30-68): identidad+jerarquía(isLeader/directReports)+exposición IA(socCode/focalizaScore/automationShare)+performance(roleFit/riskQuadrant/9box/AAE)+financiero(salary/monthlyGap/finiquitoToday)+sucesión(isIncumbentOfCriticalPosition). 4-5 queries paralelas.
2. Exposición IA — AIExposureService.ts: getExposure(socCode):153, getDepartmentExposure:204, getOrganizationExposure:350, getExposureFromDescriptor:534. focalizaScore (Eloundou 0/0.5/1.0, HIGH=0.5) primario, fallback betaScore. effectiveOccupationExposure:109. Por tarea: AutomationClassificationService IPI=betaEloundou×0.6+presiónInteracción×0.4 (:193), semáforo alta≥0.65/media/baja.
3. Diagnóstico org 9 detectores — getOrganizationDiagnostic:1283: detectTalentZombies:586, detectAugmentedFlightRisk:620, detectRedundantPositions:658 (overlap O*NET>70%), detectAdoptionRisk:732, detectSeniorityCompression:769, calculateInertiaCost:823 (Σsalary×exposición=capital hoy), calculateLiberatedFTEs:952 (Σbeta×importance×headcount), calculateSeveranceLiability:1113 (payback), calculateProductivityGap:1230 (Σsalary×(1-roleFit/100)). Output topAlerts+netROI+confidence (≥70% mapeados=HIGH).
4. Retención por persona — calculateRetentionPriority:1146, computeRetentionScore:331: goals×0.4+roleFit×0.3+ability×0.3 +bonus(crítico+12/sucesor+8) -penalExposición. Tiers intocable≥80/valioso60-79/neutro40-59/prescindible<40.
5. Narrativa exposición 6 casos — PersonExposureNarrativeService.ts:113-151: FUGA_INMINENTE(focaliza≥0.5+roleFit≥75+eng=1), TALENTO_CRITICO_MOVER, NO_REEMPLAZO, BRECHA_CORE_HUMANO(focaliza<0.3+roleFit<60), NUCLEO_INTOCABLE, OPERACION_ESTABLE(fallback). Umbrales EXPOSURE_HIGH0.5/LOW0.3, ROLEFIT_HIGH75/LOW60, eng discreto 1/2/3 (2 no clasifica).
6. Presupuesto dotación wizard 5 pasos — /api/workforce/presupuesto/{base,movimientos,scenarios,provisiones,resultado}. Finiquitos ley chilena (TalentFinancialFormulas topes UF), proyección 12 meses, persiste escenarios con detección obsolescencia.

**APIs (~10):** /api/workforce/diagnostic, /exposure, /intelligence (10 modos), /presupuesto/* (base/movimientos/scenarios/[id]/provisiones/resultado), /occupation/correct. RBAC workforce-intelligence:view, exposure:view, workforce:budget:view (HR_OPERATOR EXCLUIDO=nómina sensible), descriptors:manage (occupation/correct). Filtrado jerárquico AREA_MANAGER. workforce:budget:approve NO implementado (aprobación diferida).

**UI (~67 componentes, 2 páginas):** /dashboard/workforce Cinema Mode (WorkforceCinemaOrchestrator, useWorkforceData) con 6 vistas: Diagnóstico cascada 6 actos (gancho/problema/amplificador/costo/riesgo/síntesis), NineBox Live (matriz 3×3 lasso libre + PersonExposureNarrative accent cyan/amber/slate), Descriptor Simulator (~38 componentes, rediseño cargos en vivo vía getExposureFromDescriptor), Estructura (drill-down 50 personas tier+búsqueda). /dashboard/workforce/presupuesto wizard 5 pasos. Exposición IA renderizada en 4 puntos (cascada acto4, tabla estructura, nine-box ring, executive-hub InsightRail #8).

**DIFERENCIADORES:** (1) riesgo IA→pesos (inercia capital + FTEs liberables, no score abstracto). (2) rediseño cargos en vivo. (3) 9 detectores en una pasada. (4) presupuesto dotación con finiquitos reales.

**DEUDAS/SEÑALES LATENTES VIGENTES:** TabBenchmarks + TabSimulador son PLACEHOLDERS (UI shell sin datos). L6 SeniorityCompression usa augmentationShare>0.6 que nunca dispara (máx real ~0.167; migrar a focalizaScore>0.5 como L7). exposure_ia SIN benchmark mercado (absolutos, no percentil). Ratings N=1 → pendientesEvaluacion. Ver [[project-workforce-efficiency-datos-n1]], [[project-benchmark-masa-n1]], [[project-automation-eloundou-latente]].

Hermano de [[project_performance_inventario_producto]] (lee roleFit/9box/AAE), [[project_succession_inventario_producto]] (incumbentes). Productor para Efficiency Hub (capa narrativa). Ver [[project_workforce_roadmap_corregido]] (roadmap vigente, nómina retención CERRADA).
