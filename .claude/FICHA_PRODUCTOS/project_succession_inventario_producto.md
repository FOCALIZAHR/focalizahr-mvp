---
name: project_succession_inventario_producto
description: "Inventario de producto del módulo Sucesión (Succession Intelligence) FocalizaHR — 6 capacidades, modelo datos, APIs, UI, motores readiness/diagnóstico/dominó. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Sucesión mapeado como producto, 2026-06-25. Read-only, file:line abajo. Máquina de planificación de reemplazo de cargos críticos. Consumidor aguas abajo de Performance (lee RoleFit/9-box/flight risk), produce planes de desarrollo dirigidos.

**6 CAPACIDADES:**
1. Posiciones críticas + flight risk incumbente — CriticalPosition (schema:2921-2960). incumbentFlightRisk auto-derivado de PerformanceRating (deriveFlightRisk SuccessionService.ts:112, FUGA_CEREBROS→HIGH). benchStrength STRONG(≥2 ready now)/MODERATE/WEAK/NONE (calculateBenchStrength:451). syncAllIncumbentFlightRisks:123.
2. Nominación sugerida vs discrecional — getSuggestedCandidates:499 (filtros: RoleFit≥75 + 9-box star/high_performer/growth_potential + aspiración≠1, checkEligibility:179). nominateCandidate:736 (SUGGESTED si cumple, DISCRETIONARY si no). Enum NominationSource (schema:2905).
3. Readiness automático + gap analysis — calculateMatch:244 (competencias vs TARGET del cargo objetivo, matchPercent, clasifica READY/GAP_SMALL/GAP_CRITICAL, cuenta críticas/estratégicas/liderazgo). calculateReadiness:358 → READY_NOW(gap<10% sin críticas)/READY_1_2_YEARS(meses=gap%×0.6+6)/READY_3_PLUS(gap≥25% o estratégicas→36m)/NOT_VIABLE. Override auditable readinessOverride+reason≥10char+by+at (override-readiness endpoint).
4. Diagnóstico IA 10 casos — SuccessionDiagnosisEngine.ts (primer caso matchea gana=urgencia). Caso1 FUGA_CEREBROS→CRITICAL/RETENTION_TALK(:99), Caso2 Star+flight risk, Caso5 SUCESOR_NATURAL→BOARD_EXPOSURE(:164), Caso9 READY_NOW(:231), Caso10 default(:249). Output aiDiagnostic+urgency(CRITICAL/HIGH/NORMAL)+suggestedAction(RETENTION_TALK/CRITICAL_PROJECT/BOARD_EXPOSURE/LATERAL_ROTATION)+caseId.
5. Efecto dominó — detectDominoEffect:1360 (Nivel0 promoción→Nivel1 vacante→Nivel2 crítico→quién cubre). SuccessionBackfillPlan (schema:3124) resolution PENDING/COVERED/EXTERNAL_SEARCH/POSITION_ELIMINATED. backfill-suggestions (mismo depto, RoleFit≥75). getChainCoverage:1269.
6. Plan desarrollo sucesor v3.0 — SuccessionDevelopmentPlan (schema:3176) 1:1 candidato, 3 actos: aiDiagnostic(Acto1)/managerBet(Acto2 texto libre)/immediateAction(Acto3). Visibilidad granular (visibleToDirectManager/managerCanEditProgress/includeInEmployeeReport). SuccessionDevelopmentGoal hijos. Sync a PerformanceRating.successionReadiness (SuccessionSyncService.ts:19, READINESS_SYNC_MAP).

**MODELO DATOS:** 5 modelos (~135 campos, 5 enums): CriticalPosition:2921, SuccessionCandidate:2966 (más rico: currentRoleFit/passedThreshold/nineBoxPosition/matchPercent/gapsJson/gapsCriticalCount/readinessLevel/readinessOverride/flightRisk/ability/engagement/aspirationLevel/status/nominationSource), SuccessionBackfillPlan:3124, SuccessionDevelopmentPlan:3176, SuccessionDevelopmentGoal:3231. Enums BenchStrengthLevel/ReadinessLevel/NominationSource/CandidateStatus/SuccessionPlanStatus. Campos en Employee (incumbentOfPositions/successionCandidacies) y PerformanceRating (successionReadiness/targetRoles/successionNotes:2201). Constantes successionConstants.ts ROLEFIT_THRESHOLD=75.

**APIs (~20):** /api/succession/critical-positions (GET/POST), /[id] (GET/PUT/DELETE), /[id]/candidates (GET/POST nominar), /[id]/suggestions (GET auto). /api/succession/candidates/[id] (PATCH estado), /[id]/override-readiness, /[id]/create-pdi (DEPRECATED), /[id]/development-plan (GET/POST/PUT corre diagnosis engine), /[id]/domino, /[id]/backfill, /[id]/backfill-suggestions. /api/succession/employees(/search), /departments, /dashboard. Fuera: /api/executive-hub/succession (sin hasPermission explícito=gap menor), /api/employees/[id]/succession-plan(/progress). RBAC succession:view (ADMIN/OWNER/HR_ADMIN/HR_MANAGER/CEO/AREA_MANAGER filtrado jerárquico) + succession:manage (ADMIN/OWNER/HR_ADMIN/CEO).

**UI (~3 páginas, ~33 componentes):** /dashboard/succession (Cinema Mode: SuccessionOrchestrator LOBBY↔SPOTLIGHT), /dashboard/succession-demo, card SuccessionPanel en executive-hub (matriz vulnerabilidad 6 zonas). Componentes clave: SuccessionMissionControl (gauge cobertura), SuccessionPositionBriefing, SuccessionSpotlightCard (tabs Candidatos/Sugeridos), SuccessionCandidateModal (Profile/Evidence/Plan), SuccessionWizard ("30seg 0 campos" auto-detecta), DominoResolutionModal (3 sub-wizards: BackfillWizard/BenchHealthyWizard/BenchEmptyWizard), SuccessionPlanDrawer (3 actos), DominoEffect (cascada 3 niveles). Sin hooks dedicados (orquestador con useState). Servicios SuccessionService/SuccessionDiagnosisEngine/SuccessionSyncService.

**DIFERENCIADORES:** (1) radar de continuidad con urgencia, no organigrama. (2) sugerencias automáticas con rigor (RoleFit+9box+aspiración). (3) efecto dominó simula cascada completa. (4) diagnóstico narrativo con acción (conversación esta semana). (5) accountability (discrecional marcado, overrides auditados).

**DEUDAS:** create-pdi DEPRECATED (legacy, usar development-plan); debug console.log en critical-positions/[id]/route.ts ~88-105 (REMOVER, ya en memoria); executive-hub/succession sin hasPermission explícito.

Hermano de [[project_metas_inventario_producto]] y [[project_performance_inventario_producto]] (lee RoleFit/9-box/talent quadrants de Performance). Estado del módulo en memoria histórica: Succession Intelligence ya completado (CriticalPosition+SuccessionCandidate, successionConstants ROLEFIT_THRESHOLD=75).

## Por qué importa (vista comercial)

- **Qué resuelve:** convierte el plan de sucesión en un **radar de continuidad con urgencia** — quién no tiene reemplazo y en qué plazo — en vez de un organigrama con cajas de colores que se actualiza una vez al año.
- **A quién le importa:** al **CEO y al directorio** (riesgo de continuidad del negocio) y al **gerente de línea**, que recibe el diagnóstico narrativo con la acción concreta: la conversación que corresponde tener esta semana.
- **Qué ofrece que el mercado no:** las sugerencias de sucesor tienen **rigor verificable** (RoleFit + posición 9-box + aspiración declarada), no la intuición de quien llena la planilla.
- **El efecto dominó:** simula la cascada completa — mover a una persona destapa el hueco siguiente, y el sistema lo muestra antes de que ocurra.
- **Accountability:** lo discrecional queda **marcado como discrecional** y los overrides quedan auditados; nadie puede después decir que "el sistema lo recomendó".
