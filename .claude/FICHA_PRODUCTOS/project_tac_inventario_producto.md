---
name: project_tac_inventario_producto
description: "Inventario de producto del módulo TAC (Talent Action Center) FocalizaHR — 2 pilares (gerencias/personas), 6 patrones, acciones masivas+email, capa derivada. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo TAC (Talent Action Center / talent-actions) mapeado como producto, 2026-06-25. Read-only, file:line abajo. Centro de acción ejecutiva sobre talento: convierte cuadrantes de Performance en decisiones que disparan emails reales a gerentes. Capa DERIVADA (sin tabla propia); solo persiste rastro de acciones en IntelligenceInsight (sourceModule='TAC'). 2 pilares: gerencias (arriba) + personas (abajo).

**PILAR 1 GERENCIAS — 6 patrones (TalentActionService.ts):**
getOrgMap:120 (5 queries paralelas, 0 N+1). detectPattern:623-658 precedencia: FRAGIL(roleFit≥75%+fuga>30%+sucesores<2), QUEMADA(burnout>35%+antigüedad>12m), ESTANCADA(en_desarrollo>50%+antigüedad>18m), RIESGO_OCULTO(ICC>25%), EN_TRANSICION(ambicioso_prematuro>35%), SALUDABLE(default). Mínimo 50% clasificado (MIN_CLASSIFIED_PERCENT=0.5) sino dataInsufficient. ICC=(RED|ORANGE+EXPERTO_ANCLA)/total×100 (:535). P&L card=fugaCerebrosCostCLP+iccRiskCLP (iccRiskCLP=count×salary×1.25×1.5 :592). 3 acciones (agendar_comite/notificar/marcar) + email Resend gerente, narrativas GerenciaPatternNarratives.ts.

**PILAR 2 PERSONAS — treemap + masivas:**
TalentTreemap bloques proporcionales por cuadrante riesgo (FUGA_CEREBROS rojo>BURNOUT_RISK amber>BAJO_RENDIMIENTO slate>MOTOR_EQUIPO cyan). Segmenta tenure onboarding<12m/real12-36m/crónico>36m, narrativa tenure-aware (TalentMapNarratives, 12 variantes). MassActionBar 4 acciones (RETENTION_ROUND/WORKLOAD_REVIEW/DIRECT_EVALUATION/TEAM_RECOGNITION) → crea N IntelligenceInsight targetType=EMPLOYEE + email agrupado AREA_MANAGER (mass-action/route.ts:126). Máx 100 personas. getQuadrantPersons:380.

**CROSS-INTELLIGENCE:** /exit-cross cruza ExitRecord.exitFactors (12m) × riskQuadrant (join nationalId→PerformanceRating). Matriz agregada SIN nombres, mín 5 records, sin AREA_MANAGER. P&L: /pl-summary (ICC risk+potencial perdido+fuga cerebros CLP).

**APIs (~11):** /api/talent-actions/{org-map,stats,quadrant/[q],mass-action,checkout(GET/POST),exit-cross,pl-summary,isd-feed} + executive-hub/{pl-talent(GET/POST),pl-talent/risk-profiles,talent}. RBAC: talent-actions:view (incluye AREA_MANAGER filtrado jerárquico), talent-actions:pl-view + :exit-cross (sin AREA_MANAGER, volumen), pl-talent:view. checkout POST crea IntelligenceInsight ACKNOWLEDGED (CEO ya actúa), nextEvaluationAt 180 días, dedup OPEN/ACKNOWLEDGED.

**SERVICIOS:** TalentActionService (getOrgMap/detectPattern/getQuadrantPersons), TalentNarrativeService (narrativas individuales doble-señal risk×mobility, 5 casos), TalentRiskOrchestrator (perfiles+narrativas tenure/leadership), PLTalentService, IntelligenceInsightService (createFromTAC/createBulkFromTAC, dedup). Lee PerformanceRating(ciclo activo)+SuccessionCandidate+CriticalPosition+Department+ExitRecord. Persiste IntelligenceInsight.

**UI (~27 componentes, 1 página):** /dashboard/talent-actions Cinema Mode clonado del evaluador. TACCinemaOrchestrator (Lobby ICC gauge→Cover narrativa 2 pasos→Spotlight acción Acto3) + TACRail (2 pills gerencias/personas) + TACMissionControl + TACSpotlightCard + TACDetailModal + TACTreemapModal. Pilar1: GerenciaPatternCard/GerenciaDetail. Pilar2: TalentTreemap/QuadrantBlock/PersonTalentCard/MassActionBar/TenureSegmentBadge. Hooks useTACCinemaMode, useTalentActions. Tipos tac-cinema.ts (GerenciaCardData/TACCinemaStats). Narrativas centralizadas tacLabels.ts/GerenciaPatternNarratives.ts/TalentMapNarratives.ts.

**DIFERENCIADORES:** (1) diagnóstico→acción en un click (dispara comités+emails desde la pantalla). (2) dos altitudes en un flujo (gerencia patrón+P&L → persona cuadrante+masiva). (3) acciones auditables (IntelligenceInsight, dedup, medición 180d). (4) Exit×Riesgo (aprende de quién se fue).

**DEUDAS:** cross-cycle comparison mencionado en roadmap pero NO implementado (mira ciclo activo, no N vs N-1). TAC read-only sobre ratings (notas viven en Performance), solo escribe IntelligenceInsight.

Consumidor de [[project_performance_inventario_producto]] (cuadrantes) + [[project_succession_inventario_producto]] (sucesores). Relacionado con P&L Talent/Cascada de la Verdad (módulo aparte). Ver [[project_cross_cycle_comparison]], [[project_tac_top_talent]] (pendientes).
