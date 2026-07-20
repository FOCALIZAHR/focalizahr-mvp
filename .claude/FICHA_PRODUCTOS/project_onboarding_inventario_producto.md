---
name: project_onboarding_inventario_producto
description: "Inventario de producto del módulo Onboarding Intelligence FocalizaHR — journey 4 hitos (D1/D7/D30/D90), EXO score Bauer 4C, alertas proactivas, puente con Exit. 4 tablas, UI completa. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Onboarding Intelligence mapeado como producto, 2026-06-25. Read-only, file:line abajo. Gemelo predictivo de Exit: mide salud del nuevo colaborador 90 días y dispara alertas ANTES de que se vaya. PERSISTE: 4 tablas propias.

**6 CAPACIDADES:**
1. Journey 4 hitos (Bauer 4C) — JourneyOrchestration (schema:885-943). Día1 Compliance/Día7 Clarification/Día30 Culture/Día90 Connection. 4 Participants (stage1-4ParticipantId unique), scores 4C persistidos, currentStage 0-4, status active/completed/abandoned, retentionRisk.
2. EXO Score — OnboardingIntelligenceEngine.calculateEXOScore:11-82. Ponderado Bauer: Compliance20%+Clarification30%(mayor)+Culture25%+Connection25%, normalizado 0-100, mín 2 dimensiones (re-pondera). Retención LOW≥80/MEDIUM70-79/HIGH60-69/CRITICAL<60.
3. Alertas proactivas 6+1 — OnboardingAlertService.ts:27-131. ABANDONO_DIA_1(Q2D1≤1.0 critical 24h), BIENVENIDA_FALLIDA(Q1D1≤2.0 critical 48h), CONFUSION_ROL(D7≤2.0 high 72h), DESAJUSTE_ROL(D7Q4≤2.0 critical 48h), RIESGO_FUGA(D30≤2.0 critical 24h), DETRACTOR_CULTURAL(D90 NPS≤6 high 72h), STAGE_INCOMPLETE genérico. SLA dinámico dueDate=createdAt+slaHours, status on_time/at_risk/breached. Gestión pending→acknowledged→resolved/dismissed.
4. Enrollment (single+batch) — OnboardingEnrollmentService. Por RUT, crea Employee pre-nómina (PENDING_ONBOARDING, isActive=false) + 4 Participants + 4 emails programados (hire+0/+7/+30/+90 9AM). Gate D: preferredChannel+channelConsentMethod='admin_loaded', dateOfBirth+gender. Rollback transaccional. Batch máx 100.
5. Métricas 3 lentes — DepartmentOnboardingInsight (schema:998-1048, CRON): pulso mensual+acumulado 12m gold cache+en vivo. Scores 4C avg, eNPS, topIssues, recommendations, demografía. OnboardingEffectivenessInsight (schema:1162-1232): ROI managed vs ignored (managedRetentionRate ej 75% vs ignoredRetentionRate 20%, roiEstimate CLP).
6. Benchmark — onboarding_exo vs mercado LATAM país/industria/tamaño (percentil depto). Requiere ≥30 días actividad. BenchmarkAggregationService.

**PUENTE EXIT:** ExitRegistrationService.findOnboardingCorrelation busca journey por RUT, captura snapshot onboardingEXOScore/ignoredAlerts/managedAlerts en ExitRecord. KPIs conservationIndex + alertPredictionRate (ver [[project_exit_inventario_producto]]).

**MODELOS PRISMA (4):** JourneyOrchestration (885-943, 32 campos, 4 stages+scores4C+exoScore+retentionRisk), JourneyAlert (946-995, SLA dinámico slaHours/dueDate/slaStatus, 6 alertType), DepartmentOnboardingInsight (998-1048, gold cache), OnboardingEffectivenessInsight (1162-1232, ROI). EXO+retentionRisk derivados (persistidos al calcular).

**APIs (~8):** /api/onboarding/{enroll,enroll/batch,journeys,journeys/[id],metrics,alerts,alerts/[id],benchmark} + survey/[token](+submit PÚBLICOS sin auth). RBAC onboarding:enroll (ADMIN/OWNER/HR_ADMIN/HR_OPERATOR), enroll:batch (sin HR_OPERATOR), read (+CEO/AREA_MANAGER jerárquico), journeys:read (+AREA_MANAGER). Scope company/filtered. Servicios OnboardingEnrollmentService/IntelligenceEngine/AlertService/AggregationService/BenchmarkService. journeys/[id]+alerts/[id] RBAC hardcoded (no matriz PERMISSIONS).

**UI COMPLETA (7 páginas, ~47 componentes, 6 hooks, ~5000 líneas):** /dashboard/onboarding (gauge EXO+3 cards+tabs), /enroll (RUT módulo-11, ventana ±7 días, Gate D canal), /enroll-batch (CSV dropzone+preview), /pipeline (Kanban 5 columnas por stage), /alerts (AlertsCommandCenter: AlertsMoneyWall costo riesgo+AlertsGroupedFeed por gerencia), /executive (bimodal por gerencia), /inicio (hub). Componentes: EXOScoreGauge, PipelineKanban/JourneyCard/DetailModal, ComplianceEfficiencyMatrix, NPSOnboardingCard bimodal, BenchmarkInsightsPanel. Hooks useOnboardingMetrics/Journeys/Alerts/BatchUpload/Benchmark/Correlation. Narrativas onboarding-narratives.ts (4C).

**DIFERENCIADORES:** (1) predictivo no descriptivo (riesgo fuga día 1, no día renuncia). (2) EXO framework científico Bauer 4C. (3) demuestra ROI de actuar (tabla managed-vs-ignored para CFO). (4) cierra lazo con Exit (alerta ignorada hoy = autopsia mañana).

**DEUDAS:** NO tiene Cinema Mode/5 actos (insights panels, no storytelling editorial; a diferencia de Exit/TAC/Compliance). Narrativas 4C existen pero NO se renderizan. Selector gerencia dashboard principal=TODO sin opciones. journeys/[id]+alerts/[id] RBAC hardcoded.

Gemelo de [[project_exit_inventario_producto]] (correlación bidireccional por RUT). Alimenta predicción retención. Hermano del ciclo de vida del empleado. Ver [[project_benchmark_masa_n1]] (onboarding_exo benchmark).

## Por qué importa (vista comercial)

- **Qué resuelve:** es **predictivo, no descriptivo** — estima el riesgo de fuga desde el día 1, no el día de la renuncia, que es cuando el resto de los sistemas se entera.
- **A quién le importa:** al **gerente de línea** (puede intervenir mientras aún sirve) y al **CFO**, que recibe la tabla managed-vs-ignored: cuánto cuesta actuar versus cuánto costó no actuar.
- **Qué ofrece que el mercado no:** el score EXO se apoya en un **framework científico** (Bauer 4C), no en un índice propietario sin respaldo que el cliente deba aceptar por fe.
- **Cierra el lazo:** la alerta ignorada hoy es la autopsia de Exit mañana — los dos módulos comparten la evidencia, así que el costo de ignorar queda demostrado, no argumentado.
