---
name: project_gate0_base_madre_desempeno_metas
description: "Gate 0 read-only (jun-2026) para base madre comercial Desempeño+Metas — cobertura multicanal, informe calibración, pesos evaluador, brecha productividad. CORREGIDO con feedback Victor."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Gate 0 read-only ejecutado 2026-06-25 para BASE MADRE COMERCIAL Desempeño+Metas. Verificado contra código vivo + 3 correcciones de Victor. file:line abajo.

**P1 — Cobertura multicanal:**
- Correo CORPORATIVO: ✅ VIVO (Resend real). `campaigns/[id]/activate/route.ts:166` encola channel EMAIL; recordatorios `cron/send-reminders/route.ts:112`. Campo `Employee.email`/`Participant.email`.
- Correo PERSONAL: campo `Employee.personalEmail` existe (`schema.prisma:1643`), selector lo contempla (`channel-selector.ts:78`), pero `activate` NO lo pasa; solo se llena vía inbound Twilio (`webhooks/twilio/route.ts:189`). No usado en flujo inicial.
- WhatsApp: parte de COMUNICACIONES 3.0 EN TERMINACIÓN (Gate E), NO roadmap difuso. Estado hoy: `TWILIO_MODE` default `'simulation'` (`whatsapp-service.ts:48-49`), emite logs sim_, no envía real. Gates A-D arquitectura sellada. Gate E.1 bloque 2 (consent fail-closed) diferido. Encuadre comercial correcto: "arquitectura multicanal correo+WhatsApp en fase final, envío real WhatsApp se activa al cerrar Gate E (config Twilio/Meta)".
- Frontline phone-only: EXCLUIDOS del generator. `EmployeeBasedParticipantGenerator.ts:103-107` (`if (!employee.email) { skipped++; continue }`).
- NO afirmar "100% cobertura VIVO hoy"; sí afirmar correo corp vivo + multicanal en terminación.

**P2 — Informe de calibración al cerrar:**
- SÍ genera PDF con QR de verificación: `CalibrationAuditPDF.ts:38` (`generateCalibrationAuditPDF`), QR `:80-93`.
- SÍ se guarda en Supabase Storage bucket `calibration-audits`: `uploadToSupabaseStorage.ts:38`, retorna publicUrl `:52`.
- Cifrado: solo en-reposo de Supabase (infra), NO a nivel app. Decir "informe de auditoría con QR almacenado de forma segura en Supabase", NO "documento encriptado".
- 4 campos auditoría: quién ajustó ✅ (`CalibrationAdjustment.adjustedBy` `schema.prisma:2366`), qué cambió ✅ (`schema.prisma:2345-2356`), justificación ✅ (`:2359`), quién aprobó ❌ NO existe campo `approvedBy`.
- Gate aprobación NO obligatorio: `close/route.ts:46` toma todos PENDING y `:78-138` los aplica sin validar aprobador. AuditLog del cierre `:141-153`.

**P3 — Pesos evaluador (contradicción RESUELTA):** ambos docs tenían razón sobre funciones distintas.
- `getEvaluateeResults` = PROMEDIO SIMPLE: `PerformanceResultsService.ts:194-204` ("promedio de promedios", calculateAverage sin pesos). Es función de REPORTING 360 (perspectivas aisladas).
- Nota OFICIAL `PerformanceRating` = PONDERADO: `PerformanceRatingService.ts:262-271` (comentario literal "NO promedio simple"), `calculateWeightedScore` + `getResolvedWeights` (override ciclo>config cuenta>`FOCALIZAHR_DEFAULT_WEIGHTS` Self0/Manager60/Peer25/Upward15 en `performanceClassification.ts:129`). Alimenta 9-box, P&L, compensación.
- Afirmar: nota final ponderada configurable; reportes 360 muestran perspectivas por separado.

**P4 — Brecha productividad por cargo: VIVO, afirmable.**
- Fórmula `TalentFinancialFormulas.ts:39-42`: `salary × ((75 - roleFitScore)/100)`, cero si roleFit>=75 (ROLEFIT_THRESHOLD=75 fijo, no configurable).
- Cableado: `PLTalentService.getBrechaProductiva:235`, API `executive-hub/pl-talent/route.ts:56`, UI `BrechaProductivaTab.tsx:159` ($X/mes), anualizado L5BrechaProductividad ×12. También `TalentRiskOrchestrator.ts:355-358`.

**SALARIO (corrección clave Victor): NO es estimado genérico — es el salario REAL de la empresa por tipo de cargo.**
- Sale de `Account.salaryByJobLevel[acotadoGroup]`, valores que la empresa CARGA vía `POST /api/settings/salary-config` (`settings/salary-config/route.ts:76-144`, permiso salary-config:edit).
- `acotadoGroup` = agrupador por tipo de cargo (alta_gerencia/mandos_medios/profesionales/base_operativa), desde `Employee.position`.
- Cascada `SalaryConfigService.ts:65-151`: empresa_nivel (HIGH) > empresa_promedio (`Account.averageMonthlySalary`) > default_chile (fallback solo si empresa no cargó nada).
- Consumo: `WorkforceIntelligenceService.ts:516-539` cache por acotadoGroup.
- Matiz honesto: valor ingresado POR NIVEL de cargo, no auto-promediado desde nómina individual (no existe `Employee.salary`). Modelo: `Account.salaryByJobLevel`/`averageMonthlySalary`/`headcountDistribution` (`schema.prisma:260-267`).
- Afirmar: "brecha sobre salarios reales de la empresa por tipo de cargo, cargados por el cliente".

Relacionado: [[project_gate0_dossier_calibracion_performance]] (Gate 0 previo calibración+performance), [[project_gate_e1_spec]], [[project_gate_c_comunicaciones]].
