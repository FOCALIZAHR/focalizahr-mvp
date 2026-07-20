---
name: project_pltalent_inventario_producto
description: "Inventario de producto del módulo P&L Talent / Cascada de la Verdad FocalizaHR — estado de resultados del talento (brecha productiva+semáforo legal+síntesis 5 diagnósticos), 5 actos+síntesis. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo P&L Talent / Cascada de la Verdad mapeado como producto, 2026-06-25. Read-only, file:line abajo. Estado de resultados del talento: traduce desempeño a pesos. Vive en Executive Hub. Capa DERIVADA (sin tabla propia, calcula on-demand sobre PerformanceRating+Employee+salarios reales). DISTINTO de TAC: P&L Talent=análisis estratégico financiero, TAC=ejecución operacional. Permisos distintos (pl-talent:view vs talent-actions:pl-view).

**3 CAPACIDADES + perfiles:**
1. Brecha productiva — PLTalentService.getBrechaProductiva:160. gap mensual=salary×((75-roleFit)/100) si roleFit<75 (TalentFinancialFormulas.calculateMonthlyGap:39, ROLEFIT_THRESHOLD=75). Agrega byGerencia+byCargoFamily, FTE-loss, breakeven. Salario REAL empresa por cargo (SalaryConfig, salarySource configured/default_chile auditado).
2. Semáforo legal — getSemaforoLegal:332. BAJO_RENDIMIENTO → finiquito hoy (calculateFiniquito:52 Art.163 1mes/año cap 11, calculateFiniquitoConTope:72 tope 90 UF Art.172, UF=38800). Semáforo por TIEMPO en bajo rendimiento (≤3m yellow/≤6m orange/>6 red :388). monthlyGrowth + breakevenGlobal + monthsUntilNextYear (costo sorpresa anualidad).
3. Síntesis ejecutiva 5 diagnósticos — ExecutiveSynthesisEngine.ts (534): detectDiagnostics:175 precedencia. LIDERAZGO(30% líderes bajo+40% afectados :182), CONCENTRACION(≥50% déficit 1 gerencia :206), ANTIGUEDAD_SENIOR(≥40% déficit >36m :229), RECAMBIO(nuevos≥10pts peor+≥15% dotación :252), GENERIC(default). Selección dominante score+desempate prioridad fija LIDERAZGO>CONCENTRACION>ANTIGUEDAD>RECAMBIO :281.
4. Perfiles riesgo 4 motores — TalentRiskOrchestrator.ts (410): Motor1 tenure×roleFit (TENURE_ROLEFIT_DICTIONARY), Motor2 impacto gerencia (BUSINESS_IMPACT_DICTIONARY), Motor3 liderazgo amplificador (LEADERSHIP_RISK_DICTIONARY, solo isLeader+gap>0), Motor4 buildSuccessionMetrics:295 (incumbentes críticos con/sin sucesor READY_NOW). tenureTrend A1<12m/A2 12-36m/A3>36m.

**FÓRMULAS (TalentFinancialFormulas.ts 172 líneas, 7 puras):** calculateTenureMonths:26, calculateMonthlyGap:39, calculateFiniquito:52, calculateFiniquitoConTope:72 (90 UF), calculateBreakevenMonths:138 (finiquito/monthlyGap, null si gap=0), calculateMonthsUntilNextYear:90, didRecentlyAddYear:116.

**CASCADA UI (5 actos+síntesis, ~4000 líneas, ~15 componentes):** PLTalent/index.tsx (285) orquesta 6 vistas. Portada (PanelPortada gancho+riesgo). Acto Ancla "Masa y Gravedad" (AnclaInteligente.tsx 382, gauge 272px nodos FTE fantasma/concentración/sobre estándar/umbral 75; variante distinta a Goals "Composición Ponderada"). Briefing 4 actos (PLTalentExecutiveBriefing 817: Diagnóstico→Freno líderes→Impacto negocio→Costo gap anual→Riesgo futuro críticos). Síntesis (frase asesina classification+evidencia+camino+accountability). 2 tabs (BrechaProductivaTab Localización/SemaforoLegalTab Zona Legal). Drill-down GerenciaDetailView 3 palancas (acelerar desarrollo/exigir accountability/planificar recambio). 4 modales-portal SIN fetch (PLTalentLeadersModal/RadarModal/TenureModal/CriticalRolesModal matriz 2×2 rendimiento×sucesión A/B/C/D). NavPill 3 tabs (Análisis/Localización/Zona Legal). Hook useExecutiveHubData. Diccionarios narrativa en config/narratives.

**APIs (3):** /api/executive-hub/pl-talent (GET brecha+semáforo paralelo, POST crea IntelligenceInsight legal review dedup), /pl-talent/risk-profiles (GET perfiles+síntesis, filtros onlyCritical/onlyLeaders), /api/talent-actions/pl-summary (P&L agregado org: iccRisk+potencialPerdido+fugaCerebros, multiplicadores SHRM 2024 alta_gerencia2.0/mandos1.5/profesionales1.25/base0.75). RBAC pl-talent:view (ADMIN/OWNER/HR_ADMIN/HR_MANAGER/CEO; sin AREA_MANAGER ni HR_OPERATOR).

**DIFERENCIADORES:** (1) único módulo que pone desempeño en P&L (gap+pasivo legal en CLP, no scores). (2) diagnóstico diferencial no descriptivo (causa raíz líder/gerencia/antigüedad/selección). (3) fundamento legal chileno real (Art.163/172, topes UF, anualidades). (4) cero datos crudos al CEO (narrativa+respaldo científico).

**NOTAS:** capa 100% derivada (depende ciclo con roleFit + SalaryConfigService, pre-fetch O(1) crítico). salarySource auditado (configured vs default_chile, advierte en UI). AnclaInteligente reutilizado de [[project_metas_inventario_producto]] (Goals usa "Composición Ponderada").

Consumidor de [[project_performance_inventario_producto]] (roleFit/cuadrantes) + [[project_succession_inventario_producto]] (sucesores). Hermano operacional de [[project_tac_inventario_producto]] (TAC consume pl-summary). Habilitará P&L financiero completo cuando entre proyecto salario.

## Por qué importa (vista comercial)

- **Qué resuelve:** es el **único módulo que pone el desempeño en el estado de resultados** — brecha productiva y pasivo legal expresados en CLP, no en scores de 1 a 5 que no entran en ninguna conversación financiera.
- **A quién le importa:** al **CEO y al CFO**, que por primera vez pueden discutir talento en el mismo lenguaje que el resto del negocio.
- **Qué ofrece que el mercado no:** **diagnóstico diferencial, no descriptivo** — identifica la causa raíz (el líder, una gerencia concreta, la antigüedad, la selección) en vez de reportar que "hay un problema de cultura".
- **Defendibilidad legal:** fundamento chileno real (Art. 163/172, topes en UF, anualidades), así que la cifra del pasivo resiste la revisión de un abogado laboral.
- **Presentación:** cero datos crudos al CEO — llega la narrativa con su respaldo científico, no la planilla.
