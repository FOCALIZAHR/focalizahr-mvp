---
name: project_descriptores_inventario_producto
description: "Inventario de producto del módulo Descriptores (Occupation/Job Descriptors/RoleFit) FocalizaHR — mapeo O*NET, OccupationResolver v3, descriptores editables, exposición IA por tarea. Cimiento de Workforce. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Descriptores (Occupation/Job Descriptors) mapeado como producto, 2026-06-25. Read-only, file:line abajo. Capa que da identidad ocupacional a cada cargo: mapea posiciones cliente→O*NET, genera descriptores editables, conecta cada tarea con exposición IA. Cimiento de Workforce/Efficiency/benchmarks RoleFit. Combina O*NET global + resolver heurístico+LLM.

**5 CAPACIDADES:**
1. Mapeo posición→O*NET (OccupationResolver v3, OccupationResolver.ts ~450 líneas) — 4 pasos: router+match heurístico (alias exacto+scoring 3-tier strong+10/auto+6/fuzzy+1-3, jefatura keywords→LLM), batch LLM Claude Haiku (cargos complejos ≥3 palabras/" y "/jefatura, cuota 200/mes, batches 20, contexto depto+nivel), persist transacción confidence HIGH/MEDIUM/LOW/UNCLASSIFIED + source ALGORITHM/LLM/MANUAL. resolveBatch→{results,stats}.
2. Descriptores editables JobDescriptor (schema:3434-3486) — JobDescriptorService.generateProposal (NO persiste, desde O*NET purpose+responsibilities+competencies+requirements), saveDescriptor (DRAFT), confirmDescriptor (CONFIRMED snapshot inmutable). Estados DRAFT/CONFIRMED/ARCHIVED. responsibilities JSON [{taskId,description,isFromOnet,isActive,importance,betaScore,isAutomated}].
3. Exposición IA por tarea (puente Workforce) — AutomationClassificationService.ts (319). IPI=betaEloundou×0.6+presiónInteracción×0.4 (directive1.0/feedbackLoop0.8/taskIteration0.5/learning0.4/validation0.3). Semáforo baja/media/alta. 7 perfiles DELEGACION_ACTIVA/AMPLIFICACION/DELEGACION_PARCIAL/ASISTENCIA_PRODUCTIVA/RESISTENTE/CONSULTA_PUNTUAL/SIN_PATRON. getAnthropicPhrase narrativa. focalizaScore (Eloundou) driver canónico effectiveOccupationExposure=focalizaScore??betaScore??0, HIGH 0.5.
4. Simulador cargos Patrón G — DescriptorSimulator motor 6 pasos (Revelación→Dolor→Transición→Selección→Dashboard→Workspace). getExposureFromDescriptor (activa/desactiva tareas, exposición+costo en vivo). En Workforce.
5. Corrección feedback loop — occupation/correct + select-occupation → OccupationMapping (multi-tenant, preserva MANUAL, reset-mappings re-clasifica resto).

**MODELOS PRISMA:** GLOBALES (sin multi-tenant): OnetOccupation (3289-3328, socCode PK, focalizaScore=exposureEloundou discreto 0/0.5/1.0, betaScore, observedExposure, automationShare, jobZone), OnetTask (3331-3367, ~20K, betaEloundou + 5 dims Anthropic anthropicDirective/feedbackLoop/taskIteration/validation/learning ~18% cobertura), OnetSkill. MULTI-TENANT: OccupationMapping (3388-3421, accountId+positionText UNIQUE, socCode, confidence HIGH/MEDIUM/LOW/UNCLASSIFIED, source ALGORITHM/LLM/MANUAL), JobDescriptor (3434-3486). focalizaScore/dims persistidos; IPI/semáforo/perfil/narrativa DERIVADOS runtime. Config OnetOccupationConfig.ts (SOC_ALIASES ~150-200, STRONG_KEYWORDS, SOC_TITLES_ES). normalizePositionText SSOT.

**APIs (~16):** /api/descriptors/{route(list),[id],proposal,save,confirm,classify-all(bulk resolver),select-occupation,mapping-status,by-title,org-tree,search-tasks,simulator-list,[id]/exposure,[id]/simulator(SimulatorPayload),proposed/simulator,reset-mappings} + /api/workforce/occupation/correct. RBAC descriptors:view (ADMIN/OWNER/HR_ADMIN/HR_MANAGER/CEO/AREA_MANAGER jerárquico) / descriptors:manage (sin CEO). Filtrado jerárquico 4 endpoints. Servicios JobDescriptorService/OccupationResolver/OccupationMapper. Conecta AIExposureService/SalaryConfigService/AutomationClassificationService/CompetencyService.

**UI (~24 componentes, ~3800 líneas, 4 páginas+1 fullscreen):** /dashboard/descriptores (DescriptoresPortada Rail+MissionControl), /[jobTitle] (DescriptorWizard 4 actos editable / RoleCard read-only según CONFIRMED), /configuracion (OccupationMappingCinema 3 paths Confirmar/Revisar/Buscar clonado CompensationHub, zero semáforo), /explorar (OrgExplorer ReactFlow fullscreen), DescriptorSimulator en /dashboard/workforce. Componentes: DescriptorTaskList (switch ON/OFF zero betaScore Phase4), RoleCard, RoleCardBento, ActoPortada/Purpose/Responsibilities/Complement/Confirm. SIN hooks centralizados (fetch directo).

**DIFERENCIADORES:** (1) estándar O*NET aterrizado Chile/LATAM (cargos locales→taxonomía global con exposición IA). (2) resolver híbrido económico (heurística primero, LLM solo donde hace falta, cuota controlada). (3) descriptor que es dato no documento (cada responsabilidad lleva betaScore). (4) cimiento de toda la suite talento (clasifica una vez, sirve Workforce/Efficiency/benchmarks).

**DEUDAS VERIFICADAS:** RoleCardBento SIN resolver visualmente (carga datos, diseño vs prototipo Victor pendiente). ~17 cargos UNCLASSIFIED (ANTHROPIC_API_KEY operativa para resolver). Cobertura Anthropic premium ~18% tareas (resto Eloundou discreto). Sin hooks centralizados (useDescriptor no existe). Secondary SOC campo presente lógica no activada. Descripción LLM refinada (purpose) no impl. O*NET refresh anual manual (2024 data).

Cimiento de [[project_workforce_inventario_producto]] (exposición IA), [[project_efficiency_inventario_producto]], [[project_benchmark_inventario_producto]] (performance_rolefit). Usa LLM Claude Haiku. Ver [[project_session_descriptores_abril2026]], [[feedback_wizard_neutral]] (zero betaScore colors Phase4).
