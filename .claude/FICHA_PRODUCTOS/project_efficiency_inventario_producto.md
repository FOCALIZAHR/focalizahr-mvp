---
name: project_efficiency_inventario_producto
description: "Inventario de producto del módulo Efficiency Intelligence Hub FocalizaHR — 9 lentes (L1-L9) en 3 familias, capa narrativa sobre Workforce, carrito de decisiones CEO. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Efficiency Intelligence Hub mapeado como producto, 2026-06-25. Read-only, file:line abajo. Capa NARRATIVA de decisión sobre Workforce: 9 lentes (L1-L9) en 3 familias, cada una responde pregunta financiera. Termina en carrito de decisiones CEO exportable. Datos DERIVADOS (recalcula cada GET) pero PERSISTE planes en tabla EfficiencyPlan.

**9 LENTES (3 familias):**
CAPITAL EN RIESGO (cyan): L1 Costo de no decidir (FTEs/CLP atrapados, Σsalary×exposición), L4 Arquitectura Liderazgo (span vs McKinsey, SpanIntelligenceService, 8 narrativas).
RUTA EJECUCIÓN (purple): L2 Talento estancado/zombies (roleFit>85+ability/eng≤2+exposición), L5 Brecha productividad (prescindibles retentionScore<40), L6 Compresión seniority (junior+IA=senior, brecha≥30% — CONGELADA sin UI), L7 Talento en riesgo (mejor gente en cargos transformados, tono protector), L8 Prioridad retención (4 tiers — FUSIONADA en L7).
COSTO ESPERAR (amber): L3 Riesgo adopción (exposición×bajo clima, jerarquía pulso→experiencia→engagement), L9 Costo de esperar (pasivo finiquitos crecientes, Talent Arbitrage Map 4 zonas, alertas proximidad aniversario).

**MOTORES/LÓGICA:**
- EfficiencyDataResolver.ts (818 líneas): resolverTodosLentes, resolver individual L1:239/L2:262/L3:320/L4:432/L5:460/L6:539/L7:565/L8:583/L9:611. Lee diagnostic+enriched+exposure de Workforce.
- SpanIntelligenceService.ts (L4): getOrgSpanIntelligence:322, classifySpanZone:83 (MICRO≤2/SUB/EN_RANGO/SOBRE), getSpanNarrative:119 (8 combinaciones span×perfilEval×metas → ROJA/AMARILLA/VERDE). Span óptimo por nivel (span.ts:164): gerente_director 3-6/subgerente 4-8/jefe 5-10/supervisor 8-14/profesional 8-12/asistente 10-18/operativo 12-20. Densidad top-heavy≥20%/plana<8%. Modo Estructural (sin ciclo) vs Completo (+perfilEvaluativo+metasEquipoPct).
- EfficiencyNarrativeEngine.ts (224): templates verbatim + compilarActo (reemplaza placeholders).
- EfficiencyCalculator.ts (131): suma carrito, payback, proyecciones.
- Umbrales: effExposure>0.5 (Eloundou p75), retención goals×0.4+roleFit×0.3+ability×0.3+bonus(crítico+12/sucesor+8)-penalExposición, tiers intocable≥80/valioso/neutro/prescindible<40.

**APIs (4 endpoints):** /api/efficiency/diagnostic (GET, 9 lentes+familias+meta), /plans (GET/POST), /plans/[planId] (GET/PUT autosave debounce 1.5s/DELETE soft-archivar), /plans/[planId]/export (GET PDF business case SIN nombres por sensibilidad). RBAC efficiency:view (ADMIN/OWNER/HR_ADMIN/HR_MANAGER/CEO; AREA_MANAGER tiene código filtro pero permiso NO lo incluye=diferido).

**PERSISTENCIA:** tabla EfficiencyPlan (id/accountId/nombre/estado borrador-aprobado-archivado/tesisElegida/lentesActivos[]/decisiones JSON DecisionItem[]/narrativasEdit JSON/narrativaEjecEdit/resumenSnap JSON). Datos base NO persisten (recalcula cada GET). IDs lente inmutables (contrato BD lentesActivos).

**UI (~26 componentes ~5500 líneas, 2 páginas):** /dashboard/efficiency (EfficiencyHub orquestador, hook useEfficiencyWorkspace), /dashboard/efficiency/plan/[planId]. Flujo 4 vistas: Lobby (ShockGlobalPortada número 96px) → Ancla (ActoAncla 3 familias gauge) → Briefing (FamilyAccordion expediente) → Lente operativa. MOLDE MAESTRO LenteLayout (697 líneas) 4 actos: Silencio(hero 72px)→Expediente(hallazgo+narrativa puente)→Quirófano(simulador+narrativa dinámica)→Checkpoint(delay 1500ms). Cinema Mode dentro Quirófano (rail+spotlight persona) en L2/L4/L5/L9. CarritoBar fijo + PanelAcumuladores + EfficiencyToolbar. PlanDocument ejecutivo (proyección 5 horizontes). Estado migración HOY: L1/L2/L3/L4/L5/L9 migrados a LenteLayout; L7+L8 aún LenteCard legacy; L6 congelada sin UI.

**DIFERENCIADORES:** (1) diagnóstico→decisiones operables (carrito ahorro/mes+inversión+payback). (2) molde narrativo 4 actos (shock→quirófano, simula captura en vivo). (3) business case exportable directorio (sin nombres, por familia). (4) 9 ángulos financieros de la misma dotación.

**DEUDAS:** L6 congelada (motor sin UI), L8 sin componente propio (fusionada L7, LenteCard legacy sin migrar molde). L3 clima fallback engagement_aae (no clima medido). L4 narrativa↔datos parcial descableada (template espera placeholders Jaccard viejo no Span). AREA_MANAGER permiso diferido. Tokens UI rounded-[20px]/bg-[#0F172A]/90 (deuda diseño). L6 SeniorityCompression augmentationShare>0.6 no dispara (heredado de Workforce).

Capa narrativa sobre [[project_workforce_inventario_producto]] (productor). Hermano de [[project_metas_inventario_producto]], [[project_performance_inventario_producto]], [[project_succession_inventario_producto]]. Ver [[project_efficiency_lentes_layout]] (molde 4 actos detalle).
