# MAESTRO: FocalizaHR EX — Inteligencia de Clima
# Documento maestro ejecutable para Claude Code

> **Versión:** 3.18 — Dynamic Impact Drivers (nivel reactivo) sellado as-built (Gate 0 = ARQUITECTURA_DYNAMIC_IMPACT_DRIVERS.md)
> **Fecha:** Julio 2026
> **Estado:** En ejecución — Gates 1-4 ✅ (Gate 3 ALG5 costeo CORREGIDO) · Gate 4.5a + 4.5b (+ F) ✅ · **Gate 5A + 5B + 5C ✅ SELLADOS** · **Dynamic Impact Drivers ✅ SELLADO** (rompe techo 32 recetas; prerreq narrativas 5D) · 5D siguiente · 4.5b-ii / D / E pendientes

| Versión | Qué consolidó |
|---|---|
| v2.0 | Plan original 7 gates (sesión arquitectura junio 2026) |
| v3.0 | Correcciones julio: `category` en vez de driverCode, cierre enterprise, NPS nativo, driverScores Json, clave por período |
| v3.1 | Ecosistema clarificado: seguimiento focalizado exclusivo de Experiencia Full; Pulso Express sin seguimiento; mueren Estator/Rotor |
| v3.2.1 | Frescura = visibilidad (no promesa de cadencia); `isFollowUp` EN la clave de unicidad; carry-forward de drivers no medidos |
| v3.3 | Post-visión ejecutiva: theatreDetected, climaAggregationStatus, consent en Bajada, Smart Router, cruces Exit/Onb confirmados en schema |
| v3.4 | Autocontenido: modelo DepartmentClimaInsight completo inline, referencias externas eliminadas (patrones = código real) |
| v3.5 | Gate 1 sellado as-built: taxonomía real de BD (7-8 categorías, NO liderazgo/ambiente/desarrollo/bienestar), mecánica real de modify_text (SurveyConfiguration + textMapping por rating), decisiones Victor (preguntas al final, 1 follow-up por instrumento, categoría texto_libre) |
| v3.6 | Gate 2 sellado as-built: trigger real = PUT /status (no endpoint dedicado), DepartmentMetric confirmada (nombres reales absenceRate/overtimeHoursAvg), eNPS también dentro del insight, período = trimestre del endDate, S-PERF 17.340 responses en 9.070ms |
| v3.7 | Gate 3 sellado as-built: riskZone 75/65/60 + modulación momentum (decisión Victor 2026-07-07), gap vs target fijo 75, impact Pearson a nivel compañía, business cases mapeados a taxonomía real (clima_critico generaliza 'ambiente') con exclusión mutua, PulseEngine puro + fases 4b/4c post-upserts |
| v3.8 | Gate 4 sellado as-built (5 correcciones al plan): referencia Cinema Mode = `evaluator/cinema/*` (NO compliance/useComplianceData, deuda); navegación entity-centric (Rail=departamentos) + capítulos de compañía Cover→Content; ruta standalone `/dashboard/clima` + selector (NO `[id]/clima`); CurvaVital = Gate 7; **Cascada Ejecutiva diferida a Gate 4.5 nombrado** (Lobby directo como intermedio). Gauge = copia literal de `SegmentedRing` con paleta anti-semáforo de `IndicatorGauge` (safe cyan / observation slate / risk+critical ámbar, nunca rojo). `calcOrgFavorability` read-time ponderado por `totalInvited` (proxy headcount) + `calcOrgMomentum` **SAME-TIPO** (unificado con momentum per-depto sellado; cross-tipo descartado para que CEO cuadre gauge y Rail). Comparabilidad EI Pulso(12)↔Experiencia(35) = backlog chat dimensiones, no Gate 4 |
| v3.9 | Gate 4.5a sellado as-built (Cascada Ejecutiva, `23835e1`+`0c6ffaa`, 2026-07-08): **Actos DINÁMICOS reemplazan el "Portada→Ancla→4 Actos→Síntesis" fijo** — `ClimaSynthesisEngine` decide cuántos/cuáles Actos (1-2 en clima sano, 4-5 en crisis) y el dominante que cierra la Síntesis. **7 `ClimaDiagnosticType` reordenados en jerarquía de 2 capas** (decisión Victor): el NIVEL ABSOLUTO (orgFav vs 75 / riskZone) manda; el percentil/mediana solo DESCRIBE la distribución dentro de un nivel ya establecido, nunca decide por sí solo si hay problema. HOTSPOT = 3 condiciones (orgFav<75 + outlier naranja/roja + mediana-del-resto≥75, "caso aislado" verdadero por construcción); **OBSERVACION_SIN_FOCO (7º tipo)** cierra el hueco "bajo el objetivo pero difuso" que antes caía mal en SALUDABLE; TEATRO override de confiabilidad; DRIVER/MOMENTUM ejes ortogonales; BIEN_CON_FOCOS/SALUDABLE terminales. **Rail = Evidencia** (drill-down dentro de un hallazgo), NUNCA categoría de navegación primaria: la Cascada es la entrada, el Lobby el destino. **Constantes de dominio + `calcRiskZone` centralizadas en `climaThresholds.ts`** (fuente única SIN prisma; PulseEngine las re-exporta) → el motor es isomórfico client/server, cero duplicación. Cross-signal exit+onboarding cableados en `/api/clima/results` (ampliación deliberada vs semilla §6; sesgo del evaluador diferido). Enriquecimiento "momento de revelación" (nombre+cifra+comparación) con guard n≥5 en movers; DRIVER con **2 flags independientes** (top-impact / mayor caída calculada). Copy verbatim doc 2 (Principio 4). Smoke 69/69, tsc+build limpios. **Pendiente 4.5b: Cards de hallazgo (Patrón G) + ClimaToolbar.** |
| v3.10 | Gate 4.5b sellado as-built (`1a6126d`, 2026-07-09): **CORRECCIÓN de rumbo** — el 4.5b-i inicial (Cards de hallazgo DENTRO del Lobby) mezclaba Patrón G con Cinema Mode (anti-patrón `cinema-mode.md:56` "más de 1 CTA del mismo peso → RECHAZAR"); se DESCARTA. **Rail rediseñado = menú de 4 subproductos** [Cascada][Análisis de Clima][Ranking][Dimensiones], NO departamentos (inviable a 250, rompía el patrón Rail de Metas/TAC/Compliance; v3 §3A). Lobby limpio con **un solo CTA** (Smart Router → peor depto); botones de capítulo Heatmap/Impacto/Correlación retirados (anti-patrón activo). **`ClimaDimensionesView` = Patrón G, clon estructural de `CompensationSplit` SIN los tabs de categoría** (el Motor de Asociación cumple esa función en la narrativa) — header inline (número blanco protagonista + banda `N · Label`, SIN gauge circular), selector de íconos verticales (no-selec. solo ícono gris), aterriza en `focus[0]` (lógica rescatada de la difunta ClimaHallazgoCards). **Rollup jerárquico RECURSIVO N≤4 por driver** (`rollupClimaHierarchy`): agrega insights de hoja hacia arriba por `parentId` (patrón `buildHierarchyTree`), ponderado por participantes POR DIMENSIÓN (mismo promedio que `getHierarchicalScores`, pero N veces por driver sobre favorabilidad normalizada, no `AVG(rating)` agnóstico), N-genérico, `children` recursivos → drill-down navegable gerencia→subgerencia→área a la par de Onboarding/Exit/TAC. Guard n≥5 POR NIVEL sobre la n agregada (privacidad: hijas <5 suman al agregado, no se exponen). Schema cap `departments.level` CHECK 1-4. `aggregateClimaDimension` (org-level read-time) alimenta chips/header. Cross-signal exit/onboarding OR-agregado por nodo. Verificado E2E sobre demo multinivel de 4 niveles: 61.5→55.1→**35** (el drill revela el problema enterrado que el promedio de gerencia escondía). Seeds/smokes de clima retirados al sellar (evidencia en el commit + este as-built; smoke 25/25 + 13/13 al momento del sello). **Pendientes NO bloqueantes: 4.5b-ii (sesgo del evaluador), (D) Análisis de Clima, (E) Ranking, (F) ClimaToolbar (hoy abre modal → redefinir a vista Dimensiones), narrativa base por dimensión (contenido = Victor/Studio IA).** |
| v3.11 | Gate 4.5b-(F) sellado as-built (`0861df1`, 2026-07-10): **ClimaToolbar redefinido = ATAJO a la vista Dimensiones (§3E)**, ya no abre un modal propio. Hover → **card de vista previa (Capa 1)**: ícono + nombre de dimensión, número protagonista en BLANCO, banda de zona como ÚNICO acento de color (anti-semáforo: nunca color en el número ni en el borde), "vs. objetivo 75", Línea Tesla de **un solo color** (variante canónica para elementos chicos). Clic → `openDimensionesAt(driver)` abre Dimensiones aterrizando en esa dimensión (mismo destino que la card del Rail; la entrada por Rail aterriza en `focus[0]`). **`.fhr-glass-card` MATERIALIZADA por primera vez** en `focalizahr-unified.css` — la clase estaba documentada en `premium-components.md` (skill focalizahr-design) pero NUNCA existió en código; `StickyFooter.tsx` la referenciaba sin efecto (bug latente). Se agregó verbatim del skill doc (+ `-webkit-` para paridad), lo que **corrige de paso StickyFooter**. Es cierre de inconsistencia doc↔código, no cambio arbitrario al sistema. `ModuleToolbar` ganó campos aditivos `band?`/`sublabel?` (opcionales, backward-compat; WorkforceToolbar sin cambios). Borrados `ClimaDimensionModal` + `ClimaDimensionDetail` (huérfanos tras desconectar el modal). GOTCHA registrado: el `backdrop-filter` del glass solo se percibe con contenido detrás; a `0.8` de opacidad el efecto es sutil por diseño. tsc + build limpios. **Pendientes NO bloqueantes: 4.5b-ii, (D), (E), narrativa base por dimensión.** |
| v3.18 | **Dynamic Impact Drivers (nivel reactivo)** sellado as-built (2026-07-12) — Gate 0 de origen: `.claude/tasks/ARQUITECTURA_DYNAMIC_IMPACT_DRIVERS.md`. **Rompe el techo de 32 recetas de 5A**: dentro de una dimensión conviven reactivos (`Question.subcategory`, poblada 1:1, sin consumidor previo en clima) genuinamente distintos → el reactivo pasa a métrica de primera clase persistida + impacto dinámico Pearson reactivo×EI + selección del reactivo-palanca. **Arquitectura A-ADDITIVE** (Gate 0): cero cambio de resultado en los 15+ consumidores de `driverScores` (regresión probada). **Prerrequisito de las narrativas finales de 5D.** **2 decisiones Victor (al aprobar el plan):** (1) **dos columnas** `reactiveScores` (crudo `{fav,mean,n}` por reactivo, métrica durable) + `reactiveAnalysis` (`ReactiveImpact[]` diagnóstico, NO recalculable read-time) — espeja el par sellado `driverScores`/`driverAnalysis`; extensión justificada del Gate 0 (que nombró solo `reactiveScores`); (2) **diccionario en capas** con 1-2 variantes de MUESTRA, sin comprometer ~140 celdas (variante por reactivo solo donde cambia materialmente la acción — caso por caso Victor/Studio IA). **Pieza 1:** `calcReactiveScores` (agrupa por subcategory, sin carry-forward) + `subcategory` en `ClimaResponseRow`/select (INERTE) + persist en `ClimaAggregationService`; backfill = re-run `recompute-clima-insights` (sin script nuevo). **Pieza 2 (`PulseEngine` puro):** `REACTIVE_LOCAL_MIN_N=25` NOMBRADA/ajustable (crítico Pearson |r|≈0.396 a n=25 · mínimo grupo Culture Amp · piso 30-40 headcount) + `REACTIVE_WALKUP_MAX_DEPTH=6`; **2a** impacto compañía (`reactiveImpactsForRows` sobre todas las filas, fallback final) · **2b** local gated N≥25 (respondentes únicos del subárbol) · **2c** walk-up por `parentId` al ancestro MÁS CERCANO con N≥25 (empate→más cercano, análogo a `DepartmentResponsableService`; tope=compañía); jerarquía COMPLETA de la cuenta pasada como `hierarchy?` en `PulseCompanyInput` (1 query barata; ausente→degrada a "solo el propio depto", backward compatible). **Pieza 3:** `getIntervention(cat,zone,reactiveContext?)` retorna `{cell, selectedReactive}` (elige mayor `|impact|×|gap|` → variante si existe, si no default; sin contexto→default retrocompatible); `CLIMA_INTERVENTION_VARIANTS` aditivo sobre las 32 base; `+reactives`/`+selectedReactive` en tipos; `ClimaActionPlanBuilder` (único caller) actualizado — sin sitio de ensamblado vivo (insight→builder es 5D). **Evidencia:** smoke E2E único **26/26** (banco real, jerarquía con los 3 casos local/walk-up-empate/compañía + regresión A-additive + Pieza 3), `tsc`+`build` limpios, smoke retirado al sellar. **Diferido:** variantes narrativas por reactivo · ensamblado insight→builder con `reactives` (5D) · calibración de N=25 con nómina densa real. **Pendiente 5D.** |
| v3.17 | **Gate 5C (efectividad de planes de acción)** sellado as-built (2026-07-11). **5C se apoya en el Seguimiento Focalizado YA construido (Gate 1) que el cliente lance — sin instrumento ni disparador nuevo** (corrección DISEÑO §0). 4 piezas: (1) tabla nueva `ClimaActionLog` (`db push`; `@@unique(actionPlanId,triggerRef)` POR PLAN → dos campañas reincidentes coexisten; `quadrant` = 4 valores §4, **vacío+plano→null**; sin FK a responsable). (2) `ClimaActionLogService.onClimaPlanApproved` + hook en `action-plans/[planId]` al aprobar (moduleType clima, degrade-safe): **EAGER** 1 log por decisión `ceoDecision∈{aceptar,modificar}` + **recordatorio único** `clima_action_reminder` por depto (dedicado no-chase, `dedupKey=…:${planId}:${departmentId}`, `toEmail`=`resolveDepartmentResponsable` Gate 1 resuelto FRESCO, `scheduledAt=approvedAt+30d` = `CLIMA_REMINDER_OFFSET_DAYS`, fallback §5; drenado por el dispatcher genérico que `send-reports` dispara diario — sin depender de CAPA 3). (3) **Fase 4d** en `ClimaAggregationService` gated `isFollowUp===true`, cero re-queries (reusa `pulseOutputs` en memoria). (4) `ActionEffectivenessService.evaluateOnFollowUpClose`: `findMany` por triggerRef (accountId explícito), **`impactDelta`=`momentumDelta` sellado de PulseEngine (NO recalcula)**, umbrales `climaThresholds` (±5), **null-safe uniforme** (`momentumDelta===null`→salta todas las filas del triggerRef), **veredicto compartido + `quadrant` por fila** según su `actionText`. Template `clima-action-reminder` (copy §5.1; `fortaleza_frase` compuesta que se omite limpia si no hay insight — evita "Hoy destacas en (%)"). **Decisiones selladas (no reabrir):** eager≠lazy (el cuadrante riesgo_critico exige la fila aunque el jefe nunca abra el form) · dedup por departmentId≠triggerRef (un email por gerencia, §5) · quadrant=null para vacío+plano (§4 no lo cubre; riesgo_critico reservado a "bajó") · offset fijo 30d (no ClimaCycle, no rama campaña-programada del §5). **Evidencia:** smoke 15/15 (a–g), `tsc`+`build` limpios, smoke retirado al sellar (evidencia en el commit + este as-built). **Diferido:** `llmClassification` (pase LLM, Gate 6E) · UI campo/matriz + deep-link `action_url` (Gate 5D) · badge señal Pulso Express (5D) · guard `isFollowUp` E2E de campaña completa (verificado a nivel servicio). **Pendiente 5D.** |
| v3.16 | **Correcciones de documentación** (solo texto — cero código/lógica/schema/db push). (1) Ecosistema: Pulso Express ya NO dice "12 preguntas core (4 dimensiones × 3)" — se quita el número fijo → "cubre la mayoría de las dimensiones del banco (ver taxonomía real Gate 1A, NO 4 fijas)", para no desactualizarse si cambia el banco. (2) **5C reescrita a la decisión sellada (plan Gate 5, Q1):** el veredicto de la matriz de 4 cuadrantes (impactMeasured) lo emite SOLO el cierre de un **Seguimiento Focalizado** (driverFocusByDepartment, mide la dimensión exacta del plan); **Pulso Express = señal direccional secundaria** en Tab 3 (badge "señal preliminar"), nunca fusionada con el veredicto ni decide el cuadrante; se usa SIEMPRE "Seguimiento Focalizado" para el mecanismo del veredicto (el cruce de nombres Pulso↔Seguimiento fue el error de origen); ya NO espera la campaña anual completa. (3) **Gate 7 gana subsección 7E: Curva Vital del Talento = extensión del Sistema NPS Transversal YA EXISTENTE** (verificado en código: `NPSInsight` schema:1265 + `NPSAggregationService`, productType onboarding/exit/pulso/experiencia; clima ya lo alimenta desde Gate 2), NO un timeline nuevo solo de clima — Gate 7 lo cablea sobre el sistema transversal, no crea uno paralelo. |
| v3.15 | **Gate 5B-ii (doble CTA — los 2 consumidores del motor)** sellado as-built (`811c7dd`, 2026-07-10). **DESVIACIÓN DELIBERADA de schema (marco Victor):** se agregó **`DevelopmentGoal.climaEvidence Json?`** en 5B-ii (NO en 5C) — la regla "schema solo en 5C" es preferencia de agrupación, NO dogma; un cambio aditivo + arquitectura honesta + que evita deuda se hace en su sub-gate. Es la vía correcta: evidencia cruzada **por-goal** (consultable); meterla en `DevelopmentPlan.originGapAnalysis` (plan-level) sería forzar dato per-goal en un Json ajeno (un mismo plan `[employeeId,cycleId]` mezcla goals de clima y Performance). `db push` aplicado a dev. **5B-ii construido:** **CTA1 = endpoint NUEVO `POST /api/clima/pdi-suggestion`** — RBAC `clima:manage`, **sin ownership de jefe directo** (se dispara desde el ActionPlan por RRHH, a diferencia de `/api/pdi/generate-suggestion` que exige jefe directo); body `{employeeId, cycleId, driver, teamFavorability, gap360?}`; `buildClimaGapInput` (5B-i) → `generateSuggestions` → persiste `DevelopmentPlan` DRAFT + `DevelopmentGoal[]` con `climaEvidence` por-goal; **idempotente y coexiste con Performance PDI** (refresca SOLO los goals de clima, filtrado en app por `climaEvidence != null`, preserva 360/RoleFit). **CTA2 = SIN código nuevo** — reusa `POST /api/goals` tal cual (Gate E 409 "sin ciclo ACTIVE" intencional); para la demo se siembra un ciclo activo (`GoalCycleService.createCycle+activate`, respeta advisory lock). **CERO regresión:** `git diff` de `/api/pdi/generate-suggestion` = vacío (Performance PDI intacto, byte por byte). **Evidencia E2E 12/12** (`smoke-clima-gate5bii.ts`, retirado al sellar): ejercita los HANDLERS REALES vía NextRequest (headers x-user-*), **lee de vuelta de la BD** las filas creadas y limpia TODO por id (`$transaction`, deja la cuenta como estaba) — CTA1 crea PDI real (DevelopmentGoal [LEAD-TEAM] con `climaEvidence {driver:liderazgo,teamFavorability:45,gap360:-1.2}`), CTA2 crea Meta INDIVIDUAL real (target 75, `originType MANAGER_CREATED`) en el ciclo activo sembrado. `tsc` + `next build` limpios (gotcha: `.next` stale de la sesión paralela — cascade route borrado en su refactor — se limpió con `rm -rf .next`, NO es código de clima). **RBAC del endpoint nuevo `/api/clima/pdi-suggestion` PENDIENTE de verificación manual de roles por Victor** (mismo estado que el fix RBAC de `[planId]` de 5A: CEO/HR ven todo, AREA_MANAGER solo su gerencia, sin permiso→403) — junto con los gaps de RBAC del backlog, antes de cerrar Gate 5 completo. **Pendiente 5C/5D.** |
| v3.14 | **Gate 5B-i (doble CTA — extensión aditiva del motor PDI)** sellado as-built (`49ba0be`, 2026-07-10). **Fasing de 5B: 5B-i (el motor) primero, sellado, ANTES de 5B-ii (los 2 CTAs que lo consumen)** — decisión Victor, mismo patrón que la corrección de Gate 3. **5B-i construido (aditivo puro, sin `db push` — `GapAnalysisInput` es TS puro):** (1) `types/pdi-suggestion.ts` = `ClimaCrossEvidence` + `climaContext?` (input) + `climaEvidence?` (output), **ambos OPCIONALES** (ausencia = comportamiento legacy). (2) `data/clima-competency-mapping.ts` = mapeo **dimensión-clima → competencia 360°** (opción B, decisión Victor). **CONTENIDO PROVISIONAL (mismo régimen que el diccionario 8×4 de 5A): el mapeo específico lo define Victor/Studio IA — NO se infiere; Code scaffoldea la estructura + relleno + fallback GENERIC; guard `CLIMA_COMPETENCY_MAPPING_STATUS='PROVISIONAL'`.** (3) `PDISuggestionEngine.ts` = rama `climaEvidence` **GUARDADA por `climaContext`** (sin climaContext la clave NO se agrega → objeto idéntico al flujo 360) + helper `buildClimaGapInput(driver,fav,gap360?)` (el puente de escala fav 0-100→mean 1-5 **también es PROVISIONAL**). **Hallazgo Gate 0 (documentado):** el motor NO es determinista — `selectCoachingTip` usa `Math.random()` (`:145`); el snapshot lo FIJA para que la comparación antes/después sea válida. **Evidencia (requisito aditivo en 2 mitades):** (a) snapshot antes/después **BYTE-IDÉNTICO** (`sha256 cf5f860b…`, diff vacío) sobre los 3 consumidores × 4 gapTypes × 3 tracks + `generateFromRoleFit` → **Performance 360 / Sucesión intactos**; (b) path clima **smoke 10/10** (`buildClimaGapInput('liderazgo',45,-1.2)`→LEAD-TEAM, sugerencia con `climaEvidence`; gap 360 puro sin climaContext → SIN clave `climaEvidence`, aditividad probada in-situ). Ambos smokes retirados al sellar (evidencia en `49ba0be` + este as-built). `tsc --noEmit` + `next build` limpios. **Nota 5B-ii:** CTA2 (Meta dura) = POST directo a `/api/goals` reusa el 409 sellado de Gate E "sin ciclo ACTIVE" (`goals/route.ts:329-336`) — es comportamiento intencional, no hueco; la demo solo necesita sembrar un ciclo activo (fix de siembra, no de diseño). **Pendiente 5B-ii/5C/5D.** |
| v3.13 | **Gate 5A (Planes de Acción — capa de datos)** sellado as-built (`ffce15f`, 2026-07-10). **Fasing decidido: Gate 5 se parte en 4 sub-gates 5A/5B/5C/5D** (patrón 4.5a/4.5b), sellados por separado — plan aprobado. **5A construido:** (1) `types/clima-planes.ts` = `ClimaDecisionItem` (shape MAESTRO 5A); **severidad = las 4 `RiskZone` YA selladas** (verde/amarilla/naranja/roja ⇄ labels canónicos Sano/Atención/Riesgo/Crítico vía `calcRiskZone`), NO se inventó escala nueva. (2) `ClimaInterventionDictionary.ts` = **8 dimensiones reales (taxonomía Gate 1A: satisfaccion/liderazgo/autonomia/desarrollo/crecimiento/comunicacion/reconocimiento/compensaciones) × 4 zonas = 32 celdas** (narrative+steps+suggestedProduct), patrón zone-keyed de `ClimaNarrativeDictionary`. **CONTENIDO PROVISIONAL (Principio 4): las 32 narrativas están en relleno estructural, cada una prefijada `PROVISIONAL — `; el copy final lo escribe Victor/Studio IA aparte (como la Cascada) — NO listo para mostrar a cliente, nadie debe asumir lo contrario.** (3) `ClimaActionPlanBuilder.ts` = función PURA (client-safe) `DriverImpact[]`+`PulseBusinessCase[]`→`ClimaDecisionItem[]`: 1 ítem por driver en zona de atención (verde/Sano NO genera ítem), zona vía `calcRiskZone` sellado (modula por momentum-crisis), `businessCase` CLP adjunto SOLO si PulseEngine lo disparó (clima_critico/liderazgo_gap), **nunca inventado**; persiste vía el POST genérico existente (`moduleType='clima'`, ya aceptado desde Gate 1). (4) **Fix RBAC:** `clima` agregado a `PERMS_BY_MODULE` de `action-plans/[planId]/route.ts` (habilita GET detalle + PUT autosave del plan de clima; cierra la asimetría con la ruta de lista que ya lo tenía desde Gate 1). **Fix RBAC clima aplicado; verificación de los 3 roles (CEO/HR ven todo, AREA_MANAGER solo su gerencia, sin permiso→403) la valida Victor manualmente en la app antes de cerrar Gate 5 completo.** **Evidencia:** smoke `smoke-clima-gate5a.ts` **24/24** (S1 diccionario 32 celdas sin vacíos + todas PROVISIONAL; S2 business cases REALES de `buildBusinessCases`→`SalaryConfigService`, rama rotación-real `peopleAtRisk=ceil(40·0.18)=8`, retencion_riesgo NO dispara con EI 3.5; S3 mapeo real 6 dimensiones→5 decisiones en 4 severidades: liderazgo/reconocimiento CRÍTICO con CLP $144M, autonomia RIESGO, desarrollo amarilla→naranja por momentum −12pp, comunicacion ATENCIÓN, satisfaccion verde EXCLUIDA; celda correcta del diccionario por dim×zona; responsable/plazo por severidad; orden por severidad) — output real revisado por Victor, smoke retirado al sellar (evidencia en `ffce15f` + este as-built). `tsc --noEmit` + `next build` limpios. **Pendiente 5B/5C/5D.** |
| v3.12 | **Corrección a Gate 3 (ALG5 costeo)** sellada as-built (`82411ce`, 2026-07-10) — prerrequisito de Gate 5, NO es Gate 5. **Cambio 1 — costeo con rotación real (jerarquía a→b→c en `buildCase`):** (a) `DepartmentMetric.turnoverRate` real (%) → `peopleAtRisk = ceil(base·rate)`; (b) sin (a), conteo de salidas VOLUNTARIAS (`exitReason='voluntary'`) en ventana móvil de 12m desde `campaign.endDate` (FIJA → reproducible, mismo principio que `gapBasis:'fixed_target'`), sin umbral (úsese aunque sea 1), 1 `groupBy` en el caller fase 4b; (c) sin datos de Exit → fallback score-derived (Gallup) intacto. `assumptions[]` refleja la rama efectiva. **Cambio 2 — salario por depto vía `acotadoGroup` dominante** (mayor n en `acotadoGroupScores`) → `getSalaryForAccount(accountId, grupo)`, config cacheada por grupo distinto (memo, sin N findUnique por depto); el salario pasó de `PulseCompanyInput` a `PulseDeptInput`. **Gate 0:** ventana ancla en `endDate` fijo; la exclusión mutua real es `liderazgo_gap`↔`clima_critico` sobre el MISMO driver (`buildBusinessCases`), NO `clima_critico`↔`retencion_riesgo` (ortogonales, coexisten — correcto). **Evidencia:** smoke `smoke-gate3-alg5-costeo.ts` 19/19 (commiteado como test de regresión financiera, NO borrado) + **E2E de las 3 ramas sobre MULTINIVEL_DEMO real** (rama a: 8=ceil(40·0.18) tasa real · rama b: 1=conteo voluntario · rama c: 3=ceil(9·0.3) score); `RetentionEngine.ts` y `calcClimaTurnoverCorrelation` cero diff; tsc+build limpios. **NOTA (no acción):** `calculateTurnoverCost` acepta `acotadoGroup` para el *multiplier* de costo, pero NO se usó (el multiplier sigue en valor único 1.25×) — evaluar en un ajuste futuro si el multiplicador de riesgo debería variar también por nivel de cargo, coherente con el salario ya diferenciado por acotadoGroup. |

---

## PRINCIPIOS DE EJECUCIÓN

1. Cada gate se sella antes de avanzar. Victor aprueba, Code ejecuta.
2. `prisma db push` only. Nunca migrate dev.
3. `git add` file-specific. Nunca -A.
4. Narrativas las escribe Victor o Studio IA. Code las copia EXACTO.
5. Los cruces se ejecutan en background al cerrar campaña, con el patrón
   enterprise de Ambiente Sano (registro de agregación PENDING → COMPLETED /
   FAILED re-ejecutable). Frontend lee persistido.
6. Cero regresiones. La página genérica actual sigue funcionando intacta.
7. Este producto es el template. Lo que se construye aquí lo reutilizan todos los productos.

---

## ESTADO DE GATES

| Gate | Nombre | Estado |
|------|--------|--------|
| 1 | Foundation (Taxonomía + Persistencia + Seguimiento Focalizado) | ✅ SELLADO `28c9369`+`ec2694e`+`7cc04e3` (2026-07-06, smoke 40/40 + E2E filtro vivo) |
| 2 | Scoring + Aggregation (enterprise close pattern) | ✅ SELLADO `708791d`+`d2eee38` (2026-07-06, smoke 72/72 + S-PERF 17.340 responses en 9.070ms + E2E PUT /status vivo) |
| 3 | PulseEngine (5 Algoritmos + absorbe RetentionEngine) | ✅ SELLADO `3ea5f09` (2026-07-07, smoke 69/69 + E2E vivo 34/34 + S-PERF 10 deptos pulseDurationMs 2.127ms) · **ALG5 costeo CORREGIDO** `82411ce` (2026-07-10, rotación real + salario por acotadoGroup — ver changelog v3.12) |
| 4 | Frontend Cinema Mode | ✅ SELLADO `b653dc5` (2026-07-07, tsc+next build limpios · datos demo Q1+Q2 · RBAC 3 capas verificado vía funciones reales · mobile 320px) |
| 4.5 | Cascada Ejecutiva de Clima (Portada→Ancla→**Actos dinámicos**→Síntesis, precede al Lobby) + `ClimaSynthesisEngine` (7 tipos, jerarquía 2 capas) + `ClimaNarrativeDictionary` | 🟡 **4.5a ✅ SELLADO** `23835e1`+`0c6ffaa` (2026-07-08, smoke 69/69, tsc+build limpios, demo live-review 4 perfiles) · **4.5b ✅ SELLADO** `1a6126d` (2026-07-09, tsc+build limpios, E2E demo multinivel 4 niveles) — Rail de subproductos + Dimensiones (Patrón G, clon CompensationSplit sin tabs) + rollup jerárquico recursivo N≤4 por driver · **(F) ✅** `0861df1` (Toolbar = atajo a Dimensiones, hover=preview/clic=navega; `.fhr-glass-card` materializada) · **4.5b-ii / D / E pendientes** |
| 5 | Planes de Acción (doble CTA + validación impacto) | 🟡 **5A ✅** `ffce15f` (capa de datos + diccionario 8×4 PROVISIONAL + `ClimaActionPlanBuilder` + fix RBAC clima; smoke 24/24) · **5B-i ✅** `49ba0be` (PDIEngine extensión aditiva: `climaContext?`/`climaEvidence?` + mapeo PROVISIONAL + `buildClimaGapInput`; snapshot idéntico `cf5f860b` + clima 10/10) · **5B-ii ✅ SELLADO** `811c7dd` (2026-07-10, CTA1 endpoint `/api/clima/pdi-suggestion` + `DevelopmentGoal.climaEvidence` schema; CTA2 reusa POST /goals; E2E 12/12 crea PDI+meta reales en BD; Performance PDI cero diff; tsc+build limpios). **5C / 5D pendientes** |
| 6 | Ecosistema + LLM Clima (Studio IA) | 🔲 PENDIENTE |
| 7 | Sistema Vivo + Bajada de Clima + Curva Vital | 🔲 PENDIENTE |

---

## CONTEXTO: EL ECOSISTEMA DE CLIMA (Experiencia Full + Pulso Express)

```yaml
EXPERIENCIA FULL — Medición profunda CON seguimiento:
  1. Se lanza la encuesta completa (35+ preguntas, todas las dimensiones)
  2. ClimaAggregationService calcula DepartmentClimaInsight por depto
  3. Los resultados identifican por departamento:
     - Top 2 dimensiones más bajas (< umbral configurable, default 3.0)
     - Top 1 dimensión más alta (> umbral configurable, default 4.0)
  4. 1-2 veces al año (configurable), se lanza OTRA campaña Experiencia
     Full con driverFocusByDepartment activo
  5. Esa campaña de seguimiento muestra SOLO las preguntas de las
     dimensiones bajas + la alta a cada departamento + EI siempre
  6. Mismas preguntas del mismo banco → comparabilidad perfecta
  7. El sistema valida si las intervenciones funcionaron
     y si las fortalezas se mantuvieron (erosión silenciosa)
  8. Close the loop: mide → diagnostica → interviene → re-mide → valida

PULSO EXPRESS — Termómetro rápido SIN seguimiento:
  1. Cubre la mayoría de las dimensiones del banco (ver taxonomía real,
     Gate 1A — NO son 4 dimensiones fijas) + EI
  2. Lo lanza el cliente cuando quiere, para lo que quiera
  3. SIN seguimiento posterior, SIN re-preguntar, SIN driverFocusByDepartment
  4. Es un termómetro puntual, no un sistema de monitoreo
  5. PERO es parte integral del ecosistema de clima:
     - Genera DepartmentClimaInsight (igual que Experiencia Full)
     - Alimenta gold cache (accumulatedClimaFavorability)
     - Sus resultados se comparan con Experiencia Full por dimensión
       (mismas categorías del banco real — ver TAXONOMÍA REAL en Gate 1A)
     - Aparece en la Curva Vital del Talento
     - Si la empresa tiene Experiencia Full en Q1 y Pulso Express en Q3,
       el CEO ve UNA línea de tiempo alimentada por ambos

COMPARACIÓN CROSS-PRODUCTO (posible y valiosa):
  Experiencia Full Q1: liderazgo (8 preguntas) → favorability 58%
  Pulso Express Q3:    liderazgo (3 preguntas) → favorability 65%
  Comparación: liderazgo subió 7pp entre Q1 y Q3
  (Diferente profundidad, misma dimensión, misma escala, misma fórmula)
  Es direccional ("liderazgo mejoró"), no precisión estadística.
  EI (5 preguntas en ambos) → comparabilidad absoluta para tendencia.

EL SEGUIMIENTO FOCALIZADO ES EXCLUSIVO DE EXPERIENCIA FULL:
  - driverFocusByDepartment solo se activa en campañas de seguimiento
  - El admin crea nueva campaña Experiencia Full → el sistema sugiere
    el filtro basado en DepartmentClimaInsight anterior → admin ajusta
  - El filtro muestra TODAS las preguntas de las categorías permitidas
    + TODAS las EI. No selecciona subset dentro de un driver.
  - Máximo real: depende de cuántas preguntas tengan los drivers
    seleccionados. Con 3 drivers activos: ~24 preguntas de drivers
    + 5 EI = ~29 (sigue siendo menos que 35+)
  - No hay isDriverCore ni rotorPriority para el filtro

FRESCURA DEL DATO:
  El dashboard muestra la fecha de la última medición por departamento.
  El sistema NO fuerza una cadencia. El cliente decide su ritmo.

  Si la empresa quiere dato más fresco entre mediciones de
  Experiencia Full, lanza un Pulso Express (que alimenta el
  ecosistema y se compara por dimensión).

  No es una promesa de cadencia. Es visibilidad de antigüedad.
```

---

## GATE 1: TAXONOMÍA + PERSISTENCIA + SEGUIMIENTO FOCALIZADO

> Foundation. Sin esto no hay driver analysis, ni benchmark por driver,
> ni seguimiento focalizado de Experiencia Full.

### 1A. Evolución modelo Question

**`driverCode` NO se crea.** `Question.category` ES la taxonomía de
drivers de todo el plan. Donde el plan v2 decía `driverCode`, se usa
`category`.

**TAXONOMÍA REAL (verificada en BD, jul-2026 — sellado v3.5):** las
categorías vivas NO son las 4 asumidas originalmente. Son:
- experiencia-full (35 core): satisfaccion(9), liderazgo(8), autonomia(5),
  desarrollo(4), crecimiento(4), comunicacion(3), reconocimiento(1),
  compensaciones(1)
- pulso-express (12 core): liderazgo(3), autonomia(2), crecimiento(2),
  satisfaccion(2), comunicacion(1), desarrollo(1), reconocimiento(1)
- + `engagement_index` (5 EI) y `texto_libre` (3 text_open) creadas en Gate 1

Todo el diseño (filtro, favorability, driverScores Json) es agnóstico al
número de categorías. La decisión de CONSOLIDAR la taxonomía (7-8 → menos)
es de negocio, pendiente en chat aparte — NO bloquea Gates 1-3.

```prisma
# AGREGAR a Question (opcionales, aditivos, zero breaking change):

questionTier    String?   @map("question_tier")
# 'ENGAGEMENT_INDEX' | 'CORE' | 'CUSTOM'

isDriverCore    Boolean   @default(false) @map("is_driver_core")
# RESERVADO: sin consumidor actual (el filtro del seguimiento no lo usa).
# Se mantiene para futura selección de anchor si se necesita.
# No eliminar — cuesta cero (Boolean default false).

isBenchmarkable Boolean   @default(true) @map("is_benchmarkable")

@@index([questionTier])
# category ya tiene índice (idx_questions_category)
```

### 1B. Banco de preguntas: mapeo + Engagement Index

```yaml
MAPEO DE LAS 47 EXISTENTES:
  TODAS las preguntas existentes de pulso-express (12) y
  experiencia-full (35) son CORE (benchmarkeables, estándar).
  CORE no significa "pocas" sino "validadas y comparables con benchmark".
  → updateMany: questionTier='CORE' (category se mantiene tal cual)

SE AGREGAN COMO NUEVAS — AS-BUILT Gate 1 (script idempotente
prisma/scripts/seed-clima-gate1.ts, npm run migrate:clima-gate1;
dry-run default, --apply, guard --allow-active por campañas activas):

  Ubicación: AL FINAL del banco (decisión Victor — cero renumeración).
  Orders: pulso 13-20 · experiencia 36-43.

  5 preguntas Engagement Index (questionTier='ENGAGEMENT_INDEX',
  category='engagement_index', al inicio del bloque nuevo):
    EI-1: "Me siento motivado/a por el trabajo que hago aquí" (isDriverCore=true)
    EI-2: "Recomendaría esta empresa como buen lugar para trabajar"
          → responseType='nps_scale', 0-10, labels "Nada probable" /
            "Extremadamente probable". NPSAggregationService la detecta.
    EI-3: "Me siento orgulloso/a de trabajar aquí"
    EI-4: "Me veo trabajando aquí dentro de 2 años"
    EI-5: "Rara vez pienso en buscar trabajo en otra empresa"

  1 follow-up text_open por instrumento (decisión Victor), anclado a EI-1:
    category='texto_libre', questionTier='CORE', isBenchmarkable=false,
    isRequired=false. Texto dinámico vía modify_text (ver 1E).

  2 text_open generales: category='texto_libre', questionTier='CORE',
    isBenchmarkable=false, isRequired=false.

  INVARIANTE: ninguna pregunta queda con questionTier null
  (47→CORE, 5 EI→ENGAGEMENT_INDEX, 3 text→CORE).

  CampaignType actualizado: questionCount 12→20 / 35→43;
  estimatedDuration 5→8 / 15→18 min.

  SurveyConfiguration (merge sin pisar): regla modify_text
  (EI-1 → follow-up, textMapping por rating "1".."5") + categoryConfigs
  para engagement_index y texto_libre (COPY PROVISIONAL, Victor edita en BD).
```

### 1C. Campo de seguimiento focalizado en Campaign

```prisma
# AGREGAR a Campaign (campo de Campaign, NO de CampaignType):

driverFocusByDepartment  Json?  @map("driver_focus_by_department")

# EXCLUSIVO de campañas de seguimiento de Experiencia Full.
# Pulso Express NUNCA lo puebla.
#
# Shape (los valores de low/high son valores REALES de Question.category):
# {
#   "dept_finanzas_id": {
#     "low": ["desarrollo", "comunicacion"],
#     "high": ["satisfaccion"],
#     "thresholds": { "low": 3.0, "high": 4.0 }
#   },
#   "dept_rrhh_id": {
#     "low": ["liderazgo"],
#     "high": ["autonomia"],
#     "thresholds": { "low": 3.0, "high": 4.0 }
#   }
# }
#
# Se auto-genera al crear la campaña de seguimiento leyendo el
# DepartmentClimaInsight anterior (suggestDriverFocus, ver 2B).
# Admin puede ajustar. Si null → campaña normal (todas las preguntas a todos).

# AGREGAR también a Campaign (estado del cierre enterprise, ver 2C):

climaAggregationStatus  String?  @map("clima_aggregation_status")
# Valores: null | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
# Se setea al cerrar campaña. Permite tracking y re-ejecución.
```

### 1D. Filtro de seguimiento en endpoint de encuesta

```typescript
# Agregar en src/app/api/survey/[token]/route.ts:142 (después de cargar questions):
# Solo se activa para campañas con driverFocusByDepartment poblado
# (seguimiento de Experiencia Full). Para el resto, no hace nada.

# AS-BUILT: helper puro src/lib/utils/climaFocusFilter.ts
# filterQuestionsByDriverFocus(questions, focusMap, departmentId)
# aplicado en el route DESPUÉS del filtro por performance track.
# Selects agregados: participant.departmentId + campaign.driverFocusByDepartment.

Categorías SIEMPRE incluidas: 'engagement_index' Y 'texto_libre'.
+ TODAS las preguntas de los drivers del foco (low + high).
Fallbacks seguros (todas las preguntas): focus null (Pulso Express),
depto no mapeado, participante sin departmentId.

# El filtro NO selecciona subset dentro de un driver.
# Verificado E2E en vivo (2026-07-06): campaña con foco
# {low:[liderazgo], high:[satisfaccion]} → 13/20 preguntas exactas.
```

### 1E. Follow-up condicional → modify_text (mecánica REAL, as-built)

```typescript
# MECÁNICA REAL (sellado v3.5 — corrige la asunción "ratingMapping con
# threshold" que no existía):
#
# - La regla vive en SurveyConfiguration.conditionalRules (Json por
#   campaignType), NO en Question. Shape:
#   { triggerQuestionOrder, targetQuestionOrder, type: 'modify_text',
#     textMapping: { "1": "...", "2": "...", "3": "...", "4": "...", "5": "..." } }
#
# - Runtime en useSurveyEngine.ts: extendido en Gate 1 para aceptar el
#   RATING como clave del textMapping (fallback retrocompatible —
#   Ambiente Sano sigue mapeando por choice):
#   key = choiceResponse[0] ?? String(rating)
#
# - La pregunta text_open de follow-up está SIEMPRE presente; solo cambia
#   su texto. Cero cambio en navegación ni en getTotalSteps.
```

### 1F. Modelo DepartmentClimaInsight (spec completa — autocontenida)

Decisiones clave encodeadas en el modelo:
- **Clave por período, no por campaña.** `isFollowUp` EN la clave (sellado
  v3.2.1): medición completa y seguimiento del mismo período coexisten
  sin pisarse. `productType` separa Experiencia Full de Pulso Express.
- **`driverScores Json`** en vez de columnas nombradas por driver (sellado
  v3.2): permite agregar/cambiar dimensiones sin migración de schema.
- `campaignId` es referencia opcional, NO clave.

```prisma
model DepartmentClimaInsight {
  id           String   @id @default(cuid())
  accountId    String   @map("account_id")
  departmentId String   @map("department_id")
  campaignId   String?  @map("campaign_id")   // referencia, NO clave

  // Período (patrón DepartmentExitInsight)
  period       String                          // "2026-Q1"
  periodStart  DateTime @map("period_start")
  periodEnd    DateTime @map("period_end")
  productType  String   @map("product_type")   // 'pulso-express' | 'experiencia-full'
  isFollowUp   Boolean  @default(false) @map("is_follow_up")
  // Medición completa Experiencia Full → false
  // Seguimiento focalizado Experiencia Full → true
  // Pulso Express → false (no tiene seguimiento)

  // Engagement Index
  engagementFavorability Float? @map("engagement_favorability") // % favorable EI (0-100)
  engagementMean         Float? @map("engagement_mean")         // Mean EI (1.0-5.0)

  // Scores por driver — Json, NO columnas nombradas
  driverScores Json? @map("driver_scores")
  // shape por driver: { fav, mean, n, carried, sourceDate? }
  // { "liderazgo": { "fav": 58, "mean": 3.2, "n": 28, "carried": false }, ... }
  // carried=true → carry-forward desde la última medición completa
  //                (n=0, sourceDate indica el período de origen)

  customDriverScores Json? @map("custom_driver_scores")
  // { "custom_innovacion": { "fav": 65, "mean": 3.8 } }

  // Driver Analysis pre-calculado (lo escribe Gate 3)
  driverAnalysis Json?   @map("driver_analysis") // DriverImpact[] (impact × gap)
  topFocusArea   String? @map("top_focus_area")  // driver con mayor priority
  topStrength    String? @map("top_strength")    // driver con mayor score + impact

  // Participación
  totalInvited      Int   @map("total_invited")
  totalResponded    Int   @map("total_responded")
  participationRate Float @map("participation_rate")

  // eNPS
  npsScore      Float? @map("nps_score")
  promotersPct  Float? @map("promoters_pct")
  detractorsPct Float? @map("detractors_pct")

  // Scores por nivel de cargo (privacy threshold por celda, ver 2B paso 5)
  acotadoGroupScores Json? @map("acotado_group_scores")
  // { "alta_gerencia": { fav, mean, n }, "base_operativa": { ... } }

  // Texto libre (output LLM Clima, lo escribe Gate 6)
  commentSentiment Json?   @map("comment_sentiment") // { positive, neutral, negative }
  commentTopics    Json?   @map("comment_topics")    // [{ topic, count, sentiment }]
  commentSummary   String? @map("comment_summary")

  // Cruce con datos duros (snapshot al momento de la medición)
  turnoverRateAtMeasurement    Float? @map("turnover_rate_at_measurement")
  absenteeismRateAtMeasurement Float? @map("absenteeism_rate_at_measurement")
  overtimeRateAtMeasurement    Float? @map("overtime_rate_at_measurement")
  incidentCountAtMeasurement   Int?   @map("incident_count_at_measurement")

  // Señales cross-producto (snapshot)
  exoScoreAtMeasurement Float? @map("exo_score_at_measurement") // Onboarding health
  eisScoreAtMeasurement Float? @map("eis_score_at_measurement") // Exit intelligence
  isaScoreAtMeasurement Float? @map("isa_score_at_measurement") // ComplianceAnalysis.isaScore

  // Inteligencia calculada
  riskZone         String? @map("risk_zone")         // verde | amarilla | naranja | roja
  momentum         Float?                            // delta fav vs anterior (solo drivers medidos)
  benchmarkDelta   Float?  @map("benchmark_delta")
  correlationFlags Json?   @map("correlation_flags") // theatreDetected, exitMotivesByDept, etc.

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  account    Account    @relation(fields: [accountId], references: [id], onDelete: Cascade)
  department Department @relation(fields: [departmentId], references: [id])
  campaign   Campaign?  @relation(fields: [campaignId], references: [id])

  @@unique([accountId, departmentId, period, productType, isFollowUp])
  @@index([accountId, departmentId])
  @@index([accountId, period])
  @@map("department_clima_insights")
}
```

### 1G. Gold cache en Department

```prisma
accumulatedClimaFavorability   Float?
accumulatedClimaMean           Float?
accumulatedClimaRiskZone       String?
accumulatedClimaLastUpdated    DateTime?
```

Nota ISA: NO se crea gold cache de ISA en Department. El snapshot ISA se
lee directo de `ComplianceAnalysis.isaScore` (scope DEPARTMENT) — ver 2B.

### 1H. Permisos clima

```yaml
# AuthorizationService.PERMISSIONS + PERMS_BY_MODULE en action-plans/route.ts
# Mismo patrón que compliance:view / compliance:manage:

clima:view: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER,
            HR_OPERATOR, CEO, AREA_MANAGER
clima:manage: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER,
              HR_OPERATOR
```

### 1I. acotadoGroup en participantes de clima

```typescript
# Copiar `acotadoGroup` y `standardJobLevel` desde Employee en
# EmployeeBasedParticipantGenerator.ts (select + create, ~6 líneas).
# NO agregar `performanceTrack` (concepto de Performance, no de clima).
# Sin migración (campos ya existen en Participant).
```

### Verificación Gate 1
```yaml
□ prisma db push sin errores
□ Seeds actualizadas: questionTier='CORE' en las 47 preguntas existentes
  (category intacta — NO existe driverCode)
□ 5 preguntas Engagement Index creadas (EI-2 como nps_scale 0-10)
□ 2 preguntas text_open + follow-ups condicionales creadas
□ DepartmentClimaInsight creado en BD (driverScores Json con carried,
  clave accountId+departmentId+period+productType+isFollowUp,
  campaignId referencia)
□ Gold cache clima en Department (sin gold cache ISA)
□ driverFocusByDepartment en Campaign (campo de Campaign, no de CampaignType)
□ climaAggregationStatus en Campaign (null/PENDING/RUNNING/COMPLETED/FAILED)
□ Filtro de seguimiento funciona: depto con foco recibe TODAS las preguntas
  de sus drivers + TODAS las EI; sin foco recibe todas; Pulso Express
  nunca filtra (campo null)
□ follow-up vía modify_text funciona (texto cambia según rating,
  cero cambio en navegación/getTotalSteps)
□ acotadoGroup + standardJobLevel copiados en generator employee-based
□ Permisos clima:* en AuthorizationService
□ ActionPlan API acepta moduleType='clima'
□ CERO regresiones
```

---

## GATE 2: SCORING + AGGREGATION

> El cerebro que calcula todo al cerrar campaña.

### 2A. FavorabilityCalculator

```typescript
# src/lib/services/clima/FavorabilityCalculator.ts
# Calcula favorability (% top-2) + mean (promedio 1-5) por driver
# Dual track: fullScore (core+custom) / coreScore (solo benchmark)
# Privacy threshold: configurable, default 5 respondentes mínimo
#
# GUARDIA NPS: filtrar explícitamente por
# Question.responseType === 'rating_scale' en la query de Response.
# El top-2 en escala 1-5 se rompe si entra un rating 0-10 (NPS).
# La pregunta NPS se procesa aparte por NPSAggregationService.
```

### 2B. ClimaAggregationService

```typescript
# src/lib/services/clima/ClimaAggregationService.ts
#
# Se ejecuta al cerrar campaña (ver 2C — patrón enterprise, NO process-results)
#
# 1. Leer responses agrupadas por departamento
# 2. Calcular favorability + mean por driver (FavorabilityCalculator)
# 3. Calcular Engagement Index (5 preguntas outcome)
# 4. Calcular eNPS: crear aggregateClimaNPS() clonando el patrón de
#    aggregateExitNPS() — descompone en 3 NIVELES (patrón exit):
#      1. Por gerencia (Department level 2): upsertNPSInsight con gerenciaId
#      2. Por departamento (level 3+): upsertNPSInsight con departmentId
#      3. Global (empresa): upsertNPSInsight con departmentId = null
#    Los 3 niveles dan granularidad departamental a la Curva Vital.
#    Usa Participant.departmentId directo (no JourneyOrchestration).
#    NO llamar a aggregateForProduct() (solo escribe global, TODO pendiente).
#    Patrón real EN CÓDIGO: aggregateExitNPS en
#    src/lib/services/NPSAggregationService.ts:472 y upsertNPSInsight (:152).
#    NPSInsight ya soporta productType 'pulso' | 'experiencia' con
#    departmentId nullable (schema.prisma:1229-1237) — cero cambio de schema.
# 5. Calcular scores por acotadoGroup (alta_gerencia, mandos_medios,
#    profesionales, base_operativa) usando Participant.acotadoGroup.
#    PRIVACY THRESHOLD (aplica a CADA celda): el threshold (default 5)
#    aplica tanto al departamento completo como a cada corte
#    depto × acotadoGroup. Si alta_gerencia de Finanzas tiene 2 personas,
#    NO se muestra su score separado (se incluye solo en el agregado
#    del depto). Misma regla que el corte departamental.
# 6. Snapshot datos duros desde DepartmentMetric más reciente por depto
#    (CONFIRMADO Gate 2: tabla poblada en dev — 12 filas jun-2026; carga
#     manual Excel del cliente; snapshot null-safe si no hay filas).
#    Nombres REALES de campos (as-built): turnoverRate→turnoverRateAtMeasurement,
#    absenceRate→absenteeismRateAtMeasurement (NO "absenteeism"),
#    overtimeHoursAvg→overtimeRateAtMeasurement (son HORAS promedio, no rate),
#    issueCount→incidentCountAtMeasurement.
# 7. Snapshot señales cross-producto: accumulatedExoScore, EIS.
#    ISA: leer directo de ComplianceAnalysis.isaScore (scope DEPARTMENT),
#    patrón loadPreviousDeptIsaScore() existente. Queda null si no hay
#    campaña Ambiente Sano cerrada para ese depto — aceptable.
# 8. Calcular momentum vs DepartmentClimaInsight anterior
#    (SOLO sobre drivers medidos en ambos períodos — nunca comparar
#     un driver medido con uno carried)
# 9. Upsert DepartmentClimaInsight por departamento, seteando isFollowUp:
#    - Medición completa Experiencia Full → false
#    - Seguimiento focalizado (driverFocusByDepartment poblado) → true
#    - Pulso Express → false
# 10. Actualizar gold cache en Department (rolling 12 meses)
#     SOLO con drivers medidos — los carried no cambian el
#     accumulatedClimaFavorability (que es del Engagement Index,
#     siempre medido)
# 11. suggestDriverFocus(): auto-generar driverFocusByDepartment sugerido
#     para la próxima campaña de seguimiento (solo Experiencia Full):
#     top 2 dims bajas (<threshold) + top 1 dim alta (>threshold) por depto.
#     Lee SOLO insights con isFollowUp=false (la línea base siempre
#     viene de mediciones completas)

# BENCHMARK DELTA (lectura en Gate 2 — la escritura vive en Gate 6C):
# Después de calcular driverScores:
#   Si existe MarketBenchmark con metricType='pulse_climate' para
#   la combinación país × industria × tamaño:
#     benchmarkDelta = engagementFavorability - benchmark.avg
#   Si no existe: benchmarkDelta = null (sin benchmark disponible)

# CARRY-FORWARD (solo al crear insight de seguimiento, isFollowUp=true):
# 1. Leer el último insight completo (isFollowUp=false) del mismo depto
# 2. Para cada driver NO incluido en driverFocusByDepartment:
#    - Copiar favorability y mean del insight completo
#    - Marcar en driverScores: { carried: true, sourceDate: "..." , n: 0 }
# 3. Para cada driver SÍ incluido: calcular desde las respuestas nuevas
#
# Shape resultante en driverScores Json:
# {
#   "desarrollo": { "fav": 62, "mean": 3.4, "n": 28, "carried": false },
#   "bienestar":  { "fav": 58, "mean": 3.1, "n": 28, "carried": false },
#   "ambiente":   { "fav": 78, "mean": 4.1, "n": 0,  "carried": true, "sourceDate": "2026-Q1" },
#   "liderazgo":  { "fav": 58, "mean": 3.2, "n": 0,  "carried": true, "sourceDate": "2026-Q1" }
# }
```

### 2C. Trigger de cierre: patrón enterprise Ambiente Sano

**`process-results` es código muerto** (se autodeclara "NO SE USA" en
route.ts:7). El wiring NO va ahí. El cierre de clima sigue el patrón
`ComplianceAnalysisOrchestrator`, NO el patrón simple de Performance
(status + CRON):

```
Admin click "Cerrar Campaña"
  → Status = completed, completedAt = now()
  → Campaign.climaAggregationStatus = 'PENDING'
  → ClimaAggregationService arranca (async, por departamento)
    → climaAggregationStatus = 'RUNNING'
  → Cada depto: calcula → persiste → progreso trackeable
  → Todos ok: climaAggregationStatus = 'COMPLETED', insights disponibles
  → Si falla: climaAggregationStatus = 'FAILED', admin ve cuál depto
    falló, re-ejecutable
  → Audit log con metadata completa (deptos procesados, insights generados)
```

Justificación: "Enterprise del día uno. No hay versión beta de decisiones
sobre personas." El patrón ya está probado en Ambiente Sano.

```typescript
# Aplica solo a clima:
# if (slug === 'pulso-express' || slug === 'experiencia-full') {
#   → crear registro de agregación + lanzar ClimaAggregationService
# }
```

**Backfill para pruebas:** ClimaAggregationService es re-ejecutable por
diseño (upsert idempotente). Para generar DepartmentClimaInsight de
campañas de prueba ya cerradas, ejecutar manualmente
`ClimaAggregationService.processClimaResults(campaignId)`.
No se necesita script de backfill separado.

### Verificación Gate 2
```yaml
□ Cerrar campaña genera DepartmentClimaInsight por cada depto
□ climaAggregationStatus transiciona PENDING → RUNNING → COMPLETED
□ Fallo parcial → climaAggregationStatus FAILED con depto identificado,
  re-ejecutable (re-run idempotente: upsert por clave de período)
□ Audit log con metadata (deptos procesados, insights generados)
□ Favorability + Mean correctos (verificar con datos de prueba)
□ FavorabilityCalculator excluye nps_scale (guardia responseType)
□ Engagement Index calculado separado de drivers
□ eNPS en 3 niveles: gerencia + departamento + global (aggregateClimaNPS)
□ Privacy threshold aplicado a cada celda depto × acotadoGroup
□ benchmarkDelta calculado (o null si no hay MarketBenchmark)
□ Scores por acotadoGroup calculados (brecha jefes vs base visible)
□ Snapshot datos duros y cross-producto capturados (ISA directo de
  ComplianceAnalysis, null aceptable)
□ Gold cache actualizado (solo con drivers medidos)
□ Momentum vs anterior calculado (solo drivers medidos en ambos períodos)
□ isFollowUp correcto: completa=false, seguimiento=true, Pulso=false
□ Carry-forward funciona: drivers no medidos en seguimiento copian
  fav/mean del último insight completo con carried=true + sourceDate
□ driverFocusByDepartment sugerido se genera automáticamente
  (solo aplicable a seguimiento de Experiencia Full; suggestDriverFocus
  lee solo insights con isFollowUp=false)
□ Performance: <10s para 1000 respuestas
□ CERO regresiones
```

### Gate 2 — AS-BUILT (sellado 2026-07-06, `708791d` + `d2eee38`)

```yaml
Archivos:
  src/lib/services/clima/FavorabilityCalculator.ts   # puro, sin I/O
  src/lib/services/clima/ClimaAggregationService.ts  # processClimaResults + suggestDriverFocus
  src/lib/services/NPSAggregationService.ts          # + aggregateClimaNPS (3 niveles)
  src/app/api/campaigns/[id]/status/route.ts         # trigger en toStatus=completed
  prisma/scripts/recompute-clima-insights.ts         # npm run recompute:clima-insights

Decisiones as-built (donde la realidad ajustó la spec):
  - FUENTE DE DATOS = Response.rating CRUDO en TODOS los cálculos:
    1-5 para drivers/EI (FavorabilityCalculator, top-2 = rating>=4),
    0-10 para NPS (aggregateClimaNPS + eNPS del insight → calculateNPS,
    promotor>=9 / pasivo 7-8 / detractor<=6). Response.normalizedScore
    (la versión 0-5 de responseNormalizer) NO se usa en ningún punto de
    Gate 2 — cero menciones en los tres archivos (verificado por grep).
    ⚠️ Hallazgo upstream PENDIENTE DECISIÓN (no es código Gate 2):
    survey/[token]/submit/route.ts:133 guarda rating solo si `rating > 0`
    → un 0 de NPS (detractor extremo) se descarta al persistir y sesga el
    eNPS al alza; afecta igual a Exit NPS (misma ruta). Fix toca ruta
    compartida por todos los productos → decisión Victor.
  - TRIGGER REAL = PUT /api/campaigns/[id]/status (el cierre que usa el
    frontend vía useCampaignState/CampaignsList). NO hay endpoint dedicado
    de cierre clima. Síncrono en request (solo matemática, sin LLM);
    fallo de agregación NUNCA revierte el cierre (queda FAILED re-ejecutable).
  - PERÍODO insight = trimestre del endDate de la campaña ("YYYY-Qn",
    determinista → clave idempotente). NPSInsight = mes del endDate
    ("YYYY-MM", monthly-hardcoded de upsertNPSInsight; 2 campañas mismo
    productType mismo mes → last-wins, snapshot mensual aceptado).
  - eNPS TAMBIÉN dentro de DepartmentClimaInsight (npsScore/promotersPct/
    detractorsPct por depto, campos del schema Gate 1) CON privacy threshold;
    los NPSInsight 3 niveles NO llevan threshold (paridad con exit).
  - isFollowUp es POR CAMPAÑA (driverFocusByDepartment poblado, solo
    experiencia-full); drivers carried = categorías del baseline sin filas
    en esta campaña (data-driven, no solo el mapa de foco).
  - productType del insight = slug ('pulso-express'/'experiencia-full');
    productType NPS = 'pulso'/'experiencia'. Primer writer de esos enums
    (EfficiencyDataResolver deja de recibir null).
  - riskZone / driverAnalysis / topFocus* / comment* NO se escriben ni se
    pisan en el update del upsert (Gate 3 y Gate 6 escriben ahí).
  - S-PERF: fases paralelizadas (Promise.all en upserts por depto, niveles
    NPS y gold cache) + query madre con select mínimo (questionId plano,
    banco de preguntas aparte). Línea base: 17.340 responses / 1.020
    participantes / 12 deptos → 9.070ms (conexión directa dev→Supabase;
    en Vercel co-localizado la latencia por query baja ~10×).
  - suggestDriverFocus exportado y probado; wiring a creación = Gate 4/7.

Evidencia: smoke 72/72 PASS (borrado al sellar) + E2E vivo PUT /status
(insight 7 drivers reales + EI + NPS 3 niveles + gold cache + AuditLog,
re-run idempotente vía npm run recompute:clima-insights).

FALLO PARCIAL — verificado empíricamente (2026-07-06, smoke 18/18, borrado):
  Vector: fallo REAL de BD determinista — trigger Postgres RAISE EXCEPTION
  en department_clima_insights SOLO para el depto víctima (un participant
  con departmentId inexistente NO es inducible: la FK lo rechaza al insertar;
  category corrupta no crashea, solo crea otra entrada de driver).
  Confirmado con 3 deptos (1 víctima):
  1. Depto víctima en deptosFallidos del AuditLog (clima_aggregation_failed)
     con el error real de Postgres (P0001) capturado.
  2. Los otros 2 deptos SÍ generaron su insight (el try/catch por depto
     aísla el fallo; deptosProcesados=3, insightsGenerados=2).
  3. climaAggregationStatus=FAILED y campaign.status siguió 'completed'
     (el cierre NUNCA se revierte).
  4. Recuperación: removida la causa, re-run → COMPLETED, 3/3 insights,
     status recuperado (re-ejecutable e idempotente).
  Con esto el checklist Gate 2 queda ejercitado ítem por ítem, sin
  verificaciones "por diseño".
```

---

## GATE 3: PULSE ENGINE (5 Algoritmos)

> Transforma datos en diagnóstico + business case.
> **Absorbe RetentionEngine** (decisión sellada julio 2026).

### 3A-3E. Los 5 algoritmos

```yaml
ALG 1 — Driver Analysis (Impact × Gap):
  Pearson driver × EI → priority = impact × |gap|
  Classification: focus_area | strength | monitor | maintain

ALG 2 — Hotspot Detection:
  Deptos con engagementFav < p25 + headcount + correlación turnover

ALG 3 — Momentum Analysis:
  Delta favorability actual vs anterior
  Crisis (<-10pp) | Declining (<-5pp) | Stable | Growing (>+5pp)
  SOLO sobre drivers medidos en ambos períodos — un driver carried
  nunca entra al cálculo de momentum

ALG 4 — Dimension Gap Transfer:
  Depto campeón → depto rezagado por driver

ALG 5 — Correlación Clima × Rotación (el oro):
  Pearson engagement × turnover → business case CLP (SalaryConfigService)

FLAG ADICIONAL — theatreDetected (teatro de cumplimiento):
  Regla: ISA score > 70 (sano) + engagement favorability < 50 (bajo)
         para el mismo departamento = sospecha de teatro
  Fuente ISA: ComplianceAnalysis.isaScore (ya se snapshotea en 2B paso 7)
  Fuente clima: engagementFavorability del mismo DepartmentClimaInsight
  Persiste en correlationFlags
```

### 3F. Absorción de RetentionEngine

```
ANTES:
  SalaryConfigService → RetentionEngine (3 señales clima → CLP)
  SalaryConfigService → 7+ otros productos

DESPUÉS (Gate 3):
  SalaryConfigService → PulseEngine (5 algoritmos + todo lo de RetentionEngine)
  SalaryConfigService → 7+ otros productos
  RetentionEngine → DEPRECATED (cuando Cinema Mode reemplace results page)
```

SalaryConfigService es el motor financiero reusable de la plataforma
(8+ consumidores). RetentionEngine es un consumidor especializado, no un
motor financiero propio. La página actual de resultados con
`useRetentionAnalysis` sigue funcionando sin regresión hasta que
Cinema Mode (Gate 4) la reemplace.

### 3G. Persistir output

```typescript
# Output se guarda en DepartmentClimaInsight.driverAnalysis (Json)
# y en campos: topFocusArea, topStrength, riskZone, correlationFlags
# Se ejecuta como parte de ClimaAggregationService, NO en frontend
```

### Verificación Gate 3 — ✅ COMPLETA (2026-07-07)
```yaml
✅ Driver Analysis calcula impact × gap correctamente
   (smoke: cuadrantes + priority=|r|×|gap| con cifras a mano; E2E vivo en BD)
✅ Focus areas priorizadas por impact×|gap|
   (smoke: topFocusArea por mayor priority, carried EXCLUIDO de top*)
✅ Hotspots con headcount y correlación rotación
   (E2E: p25=62.5 calculado a mano sobre 5 deptos, headcountAvg+turnover
   con confidence degradada si faltan)
✅ Momentum vs anterior (solo drivers medidos en ambos períodos,
   carried excluidos) — smoke 8 casos + E2E crisis(-40)/growing(+45)
   contra insight 2026-Q1 real en BD
✅ Correlación Pearson genera business case en CLP
   (smoke: r=-1 lineal perfecto; E2E: 5 deptos r≤-0.9; CLP a mano:
   salario 1M → turnoverCost 15M ×1.25)
✅ theatreDetected en correlationFlags (ISA>70 + engagementFav<50)
   (smoke true/false/null; E2E ejercita la rama null — cuenta dev sin
   ComplianceAnalysis DEPARTMENT; rama true verificada solo en smoke)
✅ Los 3 business cases de RetentionEngine cubiertos por PulseEngine —
   sin doble fuente de cifras CLP (SalaryConfigService único writer
   persistido; RetentionEngine @deprecated, sigue client-side hasta Gate 4)
✅ Todo persiste en DepartmentClimaInsight
   (E2E lee de BD: driverAnalysis 7 drivers, topFocus*, riskZone,
   correlationFlags v1) + Department.accumulatedClimaRiskZone
✅ Performance: <5s para 10 departamentos
   (S-PERF: 10 deptos × 10 participantes → pulseDurationMs 2.127ms,
   dev→Supabase; en Vercel co-localizado colapsa ~10×)
```

### AS-BUILT Gate 3 (sellado 2026-07-07, commit `3ea5f09`)

```
ARCHIVOS:
  src/lib/services/clima/PulseEngine.ts        # NUEVO — motor puro sin I/O
  src/lib/services/clima/ClimaAggregationService.ts  # wiring fases 4b/4c
  src/engines/RetentionEngine.ts               # solo @deprecated header
  src/hooks/useRetentionAnalysis.ts            # solo @deprecated header

Decisiones as-built (Victor 2026-07-07 vía plan aprobado):
  - riskZone sobre engagementFavorability: verde ≥75 · amarilla 65-74 ·
    naranja 60-64 · roja <60. Anclas 75/60 = estándar de DASHBOARD DIARIO
    de la industria (Culture Amp: verde ≥75%, amarillo 60-74%, rojo <60%).
    DISTINTO del modelo de cuartiles (80/70/60) que se reserva para el
    benchmarking de mercado (Gate 6C, cuando pulse_climate tenga datos) —
    coexisten sin contradicción: alerta operativa vs posicionamiento.
    Momentum ≤ -10pp degrada UNA zona (solo degrada, nunca mejora).
    Gold cache accumulatedClimaRiskZone SIN modulación (promedio rolling
    12m, el momentum puntual no aplica).
  - Gap (ALG 1) = fav − CLIMA_TARGET_FAVORABILITY (75). Constante SEPARADA
    de la de riskZone aunque hoy compartan valor (riesgo ≠ priorización,
    pueden divergir). gapBasis:'fixed_target' persistido → Gate 6C migra a
    'market_benchmark'. Promedio interno DESCARTADO: en compañía
    uniformemente en crisis neutraliza el gap (falla descalificante).
  - Impact (ALG 1) = Pearson driver×EI a nivel COMPAÑÍA con pares por
    participante (r por depto con n=8-20 es inestable y quedaría null).
    Reutiliza GoalsDiagnosticService.calculatePearsonR (null si <5 pares).
    Clasificación: |r|≥0.30 ∧ gap≤-10 → focus_area; |r|≥0.30 ∧ gap≥0 →
    strength; gap≤-10 (impact bajo/null) → monitor; resto maintain.
    topFocusArea/topStrength EXCLUYEN drivers carried (dato stale no
    lidera el diagnóstico fresco; sí aparecen en driverAnalysis).
  - theatreDetected: cortes 70/50 SELLADOS en este maestro desde v3.3.
    El 50 es MÁS estricto que roja (60) a propósito: "teatro" acusa de
    simular cumplimiento → umbral conservador; un depto puede estar en
    roja sin sospecha de teatro. ISA o EI null → null (nunca false).
  - Business cases (absorción RetentionEngine) mapeados a taxonomía REAL:
    clima_critico = PEOR driver medido con mean < 2.5 (generaliza
    'ambiente_crítico' — la categoría 'ambiente' NO existe en BD);
    retencion_riesgo = EI mean < 3.0; liderazgo_gap = driver liderazgo
    mean < 3.0. MUTUAMENTE EXCLUYENTES sobre el mismo driver: si liderazgo
    disparó liderazgo_gap y es el peor <2.5, clima_critico toma el
    SIGUIENTE peor (si no hay, no se emite) — nunca doble costo CLP.
    Escala TURNOVER_RISK_BY_MEAN y costos/efectividades de programa
    heredados de RetentionEngine (Gallup/HBR/McKinsey). peopleAtRisk =
    ceil((headcountAvg ?? totalResponded) × risk). Umbrales = constantes
    editables por dev, NO configurables por cliente (comparabilidad).
  - Wiring: fases 4b/4c POST-upserts en processClimaResults — Gate 2 NO
    se reestructuró (fallo parcial verificado sigue válido). Cero
    re-queries: pulseInputByDept se llena en el closure per-dept con lo
    ya computado (driverScores post-carry, ei, momentum, rowsByDept,
    métricas/ISA/prev precargados). I/O nuevo total: 1 getSalaryForAccount
    + 2 campos en selects existentes (prevInsights.driverScores,
    metrics.headcountAvg) + N updates paralelos de SOLO los 5 campos Gate 3.
    Fallo de Pulse DEGRADA (insight base queda, diagnóstico null, FAILED
    re-ejecutable vía recompute) — nunca revierte el cierre.
  - correlationFlags shape v1: theatre/hotspot/climaTurnover/businessCases/
    computedAt; escalares cross-dept (pearsonR, p25) DUPLICADOS per-dept
    (self-contained ~KB). Company-level NO se persiste: PulseEngine exporta
    aggregateCompanyPulse / buildCompanyBusinessCases / rankMomentumMovers
    (read-time) para que la API de Gate 4 derive la vista compañía al leer.
    rankMomentumMovers = ranking "mayor caída/mejora" (patrón TopMoversPanel,
    nota Victor) sobre el momentum ya persistido; el panel visual es Gate 4.
  - RetentionEngine y useRetentionAnalysis quedan @deprecated SIN cambio
    funcional (results page actual intacta, principio #6); se eliminan
    cuando Cinema Mode (Gate 4) la reemplace.

Evidencia: smoke 69/69 PASS (cifras a mano, borrado al sellar) + E2E vivo
34/34 sobre campaña sintética (6 deptos con perfiles exactos: roja/verde/
naranja/amarilla/verde-borde/privacy, insights previos 2026-Q1 para
momentum, fixtures cleanup por id) + S-PERF 10 deptos → pulseDurationMs
2.127ms (<5s presupuesto; AuditLog trae pulseDurationMs desde este gate).
```

---

## GATE 4: FRONTEND CINEMA MODE (Capas 1-3)

```yaml
CINEMA MODE + SMART ROUTER:
  La página de resultados de clima usa Cinema Mode (patrón Compliance).
  Smart Router decide qué vista mostrar según el rol del usuario:
  - CEO / ACCOUNT_OWNER: Lobby con narrativa → puede navegar a todas las secciones
  - HR_ADMIN / HR_MANAGER: Todas las secciones con todos los departamentos
  - AREA_MANAGER: Su departamento + hijos (filtrado por buildParticipantAccessFilter)
  - HR_OPERATOR: Vista lectura con departamentos asignados

  Skill: focalizahr-design (Cinema Mode obligatorio) — el mapping
  rol→vista de arriba es lo normativo
  (lectura opcional: .claude/tasks/FILOSOFIA_UX_SMART_ROUTER_v1_0.md)
```

### 4A. Hook orquestador

```typescript
# src/hooks/useClimaResults.ts
# Clonar estructura useComplianceData (60% reutilizable)
# pageState, campaign selector, navigation, Rail
#
# CLIMA_SECTIONS:
#   null         → Lobby/Summary
#   'heatmap'    → Heatmap drivers × deptos
#   'impact'     → Driver Analysis Impact × Gap
#   'correlacion'→ Scatter + Business Case
#   'comments'   → LLM Clima (si Gate 6 listo, sino placeholder)
#   'planes'     → Planes de acción (Gate 5)
```

### 4B. API resultados clima

```typescript
# GET /api/campaigns/[id]/clima-results
# Lee DepartmentClimaInsight[] + gold cache
# RBAC: AREA_MANAGER ve solo su gerencia
```

### 4C. Página + componentes

```yaml
Nueva ruta: /dashboard/campaigns/[id]/clima/page.tsx

COMPONENTES REUTILIZABLES (cross-producto):
  EngagementGauge        → Score gauge con zonas color
  FavorabilityBar        → Barra tricolor (favorable|neutral|unfavorable)
  HeatmapGrid           → Tabla color-coded (drivers × segmentos)
                           Drivers carried en gris claro con indicador
                           de fecha: "Ambiente 78% (dato de Q1, no
                           re-medido)". Drivers medidos en color normal.
  ImpactGapMatrix        → Cuadrante 2×2
  CorrelationScatter     → Scatter X=score Y=rotación
  BusinessCaseCard       → Costo + ahorro + ROI
  CrossSignalPanel       → Señales convergentes
  MomentumBadge          → Badge tendencia ↗↘→
  CurvaVitalTalento      → Timeline eNPS Onboarding→Cultura→Exit
                           Lee NPSInsight de 4 productTypes
                           (onboarding, pulso, experiencia, exit).
                           (a confirmar por Code: ¿NPSInsight de
                           onboarding y exit existe con granularidad
                           departamental o solo global?)
                           Muestra dónde la organización rompe la lealtad.
                           Va en Lobby del Cinema Mode Y en Torre de Control.
  AcotadoGapCard         → Brecha por nivel de cargo
                           "Jefes perciben 72%. Base operativa 38%."

REUTILIZAR existentes:
  PulseIndicatorGrid     → Cards métricas (quitar benchmark hardcodeado)
  ComparativeAnalysis    → Tabs análisis
  NPSGaugeCard           → eNPS
```

### Verificación Gate 4
```yaml
□ Cinema Mode navega entre secciones sin scroll
□ Lobby: EI gauge + focus areas + strengths + narrativa + CurvaVitalTalento
□ Heatmap: drivers × deptos con 3 modos (delta/absolute/benchmark)
  + drivers carried en gris claro con fecha de origen
□ Impact: cuadrante 2×2 correcto
□ Correlación: scatter + business case CLP
□ CurvaVitalTalento renderiza timeline eNPS (si hay datos cross-producto)
□ AcotadoGapCard muestra brecha jefes vs base
□ RBAC funciona
□ Performance: <1s (lee de DepartmentClimaInsight)
□ Mobile responsive (320px+)
□ Componentes son genéricos (no acoplados a clima)
```

### AS-BUILT Gate 4 (sellado 2026-07-07)

```
ARCHIVOS NUEVOS:
  src/lib/services/clima/PulseEngine.ts   # +calcOrgFavorability +calcOrgMomentum (read-time, puras)
  src/types/clima.ts                      # tipos frontend (importa tipos de PulseEngine)
  src/app/api/clima/campaigns/route.ts    # listado (clon compliance/campaigns, slug clima)
  src/app/api/clima/results/route.ts      # resultados (clon RBAC compliance/report + derivación read-time)
  src/hooks/useClimaCampaigns.ts · useClimaCinemaMode.ts
  src/app/dashboard/clima/page.tsx (+ ?campaignId deep-link)
  src/app/dashboard/clima/components/     # ClimaCinemaOrchestrator, ClimaHeader (+selector),
    ClimaMissionControl, ClimaRail, DepartmentRailCard, DepartmentSpotlightCard, ClimaChapterView
  src/components/clima/                    # EngagementGauge, FavorabilityBar, MomentumBadge,
    BusinessCaseCard, AcotadoGapCard, CrossSignalPanel, HeatmapGrid, ImpactGapMatrix,
    CorrelationScatter, climaZonePalette.ts
  src/components/ui/FHREmptyState.tsx      # canónico (empty-states.md) — NO existía, creado
  src/lib/constants/climaRoles.ts          # espejo clima:view (menú), feedback constante compartida
MODIFICADO: src/components/dashboard/DashboardNavigation.tsx (ítem "Inteligencia de Clima")
INTACTO (principio #6): campaigns/[id]/results/page.tsx + useRetentionAnalysis (retiro diferido).

DECISIONES AS-BUILT (donde la realidad/Victor ajustó el plan):
  - REFERENCIA CORREGIDA: el patrón canónico Cinema Mode es evaluator/cinema
    (evaluaciones), NO compliance/useComplianceData (deuda que no implementa
    bien Smart Router). Entity-centric: Rail itera DEPARTAMENTOS (no secciones).
    Smart Router nextDepartment = peor zona (roja→verde, desempate menor EI).
  - GAUGE = copia LITERAL de src/components/evaluator/cinema/SegmentedRing.tsx
    (forma/estructura/comportamiento sin tocar); solo cambia el dato
    (completed/total → favorability+riskZone), el color (getProgressColor →
    zoneColor anti-semáforo), la frase (getInsightText → etiqueta de zona) y el
    footer (completed/total → momentum / gap vs objetivo).
  - PALETA anti-semáforo CLONADA de compliance/IndicatorGauge (Decisión #1 AS
    v1.0) en src/components/clima/climaZonePalette.ts: verde→safe cyan #22D3EE ·
    amarilla→observation slate #94A3B8 · naranja→risk ámbar #F59E0B ·
    roja→critical ámbar+glow. NUNCA rojo. Número del gauge SIEMPRE blanco.
    Propagada a Rail/cards/pills/legend/FavorabilityBar/MomentumBadge/BusinessCase.
  - orgFavorability = read-time, ponderada por totalInvited (PROXY de headcount
    al momento de medición — aproximación aceptada, NO deuda; comentario en la
    función). null explícito si Σ(totalInvited)=0. orgRiskZone con umbrales
    sellados, sin modulación momentum.
  - MOMENTUM UNIFICADO SAME-TIPO (org y per-depto): calcOrgMomentum compara vs la
    campaña anterior del MISMO slug (climaAggregationStatus=COMPLETED, endDate<actual,
    scope RBAC en ambas). Cross-tipo DESCARTADO (decisión Victor): el gauge y el
    Rail medirían contra bases distintas y el CEO no podría cuadrarlos. Sin anterior
    same-tipo → footer cae a gap vs objetivo (75). Comparabilidad EI Pulso(12)↔
    Experiencia(35) = backlog del chat de dimensiones, NO Gate 4.
  - RUTA standalone /dashboard/clima + selector de campaña en el header
    (default última COMPLETED); deep-link histórico vía ?campaignId (sin ruta nueva).
  - RBAC (clon compliance/report): clima:view; AREA_MANAGER → getChildDepartmentIds
    → visibleDeptIds; la vista de compañía (orgFav/momentum) se deriva SOLO sobre
    el scope visible. scope ('organization'|'area') autoritativo en la respuesta →
    el Lobby rotula "tu organización" vs "tu área". Endpoint batched (una findMany),
    sin N+1 (la etiqueta "N+1" del comentario de compliance:8,136 es imprecisa).
  - CAPÍTULOS de compañía Cover→Content (Heatmap drivers×deptos con carried en gris ·
    Impact 2×2 · Correlación scatter EI×rotación + CLP), deep-link celda/punto →
    SpotlightCard del depto. La PORTADA narrativa por capítulo la escribe Victor/
    Studio IA (pendiente pase de narrativas, principio #4).
  - DIFERIDOS EXPLÍCITOS: Cascada Ejecutiva → Gate 4.5 (este Lobby es el DESTINO de
    ese recorrido, no la entrada — se ve como entrada solo porque 4.5 no existe aún).
    CurvaVitalTalento → Gate 7 (placeholder en Lobby). Retiro RetentionEngine →
    cuando Cinema Mode reemplace results/page.tsx.

EVIDENCIA: npx tsc --noEmit + npx next build limpios (el build completo falla solo
en `prisma generate` por EPERM del dev server en Windows — no el código). RBAC
verificado ejercitando las funciones reales (hasPermission + getChildDepartmentIds
+ calcOrgFavorability): global 6/6 deptos orgFav 65; AREA_MANAGER scoped a su
subárbol (1/6, orgFav de su scope); EVALUATOR/VIEWER 403. Datos demo Q1+Q2
(momentum org +7 same-tipo + per-depto variado; 6 deptos en zonas roja→verde
incl. naranja en 60; DepartmentMetric turnover para el scatter). Smokes/seeder
temporales borrados al sellar (evidencia en el commit).

PENDIENTES NO BLOQUEANTES: portada narrativa de capítulos (pase narrativas);
benchmark 'delta/absolute/benchmark' del heatmap está en modo absolute (los 3
modos completos requieren MarketBenchmark pulse_climate = Gate 6C).
```

---

## GATE 5: PLANES DE ACCIÓN (Capa 4)

### 5A. ClimaDecisionItem + Diccionario intervenciones

```yaml
Shape en ActionPlan.decisiones (Json):
  triggerRef, category, departmentId, favorability, gap, impact
  intervention: { level, narrative, steps[], businessCase }
  responsible: string       # "HRBP" | "Gerente de Área" | "CEO"
  deadline: string          # "2 semanas" | "30 días" | "90 días"
  validationMetric: string  # "Score liderazgo > 55% en seguimiento"
  ceoDecision: aceptar | modificar | rechazar
  ceoNotes (editable)
  (responsible/deadline: mismo patrón ExitAlertEngine.actionPlan.steps)

Diccionario: drivers × 4 niveles (nº de drivers según taxonomía REAL —
  ver Gate 1A; si la consolidación de negocio reduce categorías, el
  diccionario se dimensiona ahí, antes de Gate 5)
  Cada una: narrative + steps + suggestedProduct
  NARRATIVAS: Victor o Studio IA las escribe. Code copia EXACTO.
```

### 5B. Doble CTA: PDI (suave) + Meta (dura)

```yaml
CTA 1 — Sugerir DevelopmentGoal:
  Extiende PDISuggestionEngine con input de clima
  Evidencia cruzada: clima equipo + brecha 360°
  Manager acepta/rechaza
  Para: focus areas leves

CTA 2 — Asignar Goal medible:
  Meta de negocio: "Subir Liderazgo de 38% a 55% en Q3 2026"
  Con peso en evaluación anual
  Lo asigna CEO/HRBP desde ActionPlan (patrón calibración:
  sin ser jefe directo). La siguiente campaña de seguimiento
  valida si se logró.
  Para: departamentos en crisis
```

### 5C. Validación de impacto (mecanismo SELLADO — plan Gate 5, Q1)

```yaml
El VEREDICTO de la matriz de 4 cuadrantes (impactMeasured) lo emite SOLO
el cierre de un SEGUIMIENTO FOCALIZADO (Experiencia Full con
driverFocusByDepartment) — mide la dimensión EXACTA que el plan atacó:
  - Si Liderazgo subió de 38% a 55%: impactMeasured=true, impactDelta=+17pp
  - Si no mejoró: flag para re-evaluar intervención
  - ActionPlan se actualiza con el resultado de la validación
  - Close the loop completo y medible

Comparabilidad: el Seguimiento Focalizado usa las MISMAS preguntas del
MISMO CampaignType. Si liderazgo tenía 8 preguntas en la medición completa,
el seguimiento muestra esas mismas 8 → comparación 8 vs 8, perfecta.
El EI (5 preguntas, siempre presente) es la métrica longitudinal
absoluta para tendencia general.

Pulso Express que cubra ese driver = SEÑAL DIRECCIONAL SECUNDARIA — se
muestra en Tab 3 (Tracking) como badge "señal preliminar", NUNCA se
fusiona con el veredicto y NUNCA decide el cuadrante. El mecanismo del
veredicto es SIEMPRE el Seguimiento Focalizado, nunca el Pulso Express
(ese cruce de nombres fue el error de origen — regla del "O").

NOTA (desviación sellada vs plan original): 5C ya NO espera la campaña de
seguimiento anual completa; se apoya en el próximo Seguimiento Focalizado
ya existente (Gate 1) que el cliente lance cuando corresponda — mismo
principio de validación, sin instrumento ni disparador nuevo.
```

### 5D. Sección Planes en Cinema Mode

```yaml
Tab 1: POR DEPARTAMENTO
  Cards con intervención + steps + business case + CEO decision
  CTAs cross-producto

Tab 2: POR PERSONA
  Managers con equipos en riesgo
  Doble CTA: PDI suave + Meta dura
  Evidencia cruzada

Tab 3: TRACKING
  Creadas | en progreso | completadas | vencidas
  Próxima validación: fecha de la próxima campaña de seguimiento
```

### Verificación Gate 5
```yaml
□ ActionPlan moduleType='clima' persiste correctamente
□ Autosave 3 capas funciona
□ CEO puede aceptar/modificar/rechazar
□ CTA PDI crea DevelopmentGoal con evidencia cruzada
□ CTA Meta crea Goal medible (asignable sin ser jefe directo)
□ Business case por depto con SalaryConfigService
□ Validación impacto funciona cuando la campaña de seguimiento cierra
  + ActionPlan actualizado con el resultado
□ Plan se puede aprobar (inmutable después)
```

---

## GATE 6: ECOSISTEMA

### 6A. Fix ConvergenciaEngine
```
Migrar de campaignResults.departmentScores (no se persiste, bug)
a Department.accumulatedClimaFavorability (gold cache persistido)
```

### 6B. ExitAlertEngine contexto clima
```
En alertas Exit, mostrar último DepartmentClimaInsight del depto
```

### 6C. Benchmark pulse_climate
```
BenchmarkAggregationService: calculateClimaBenchmarks()
metricType='pulse_climate', cascada GLOBAL → JOB_LEVEL → COMBINATORIA

NOTA: este gate crea la ESCRITURA del benchmark (alimenta MarketBenchmark).
La LECTURA (benchmarkDelta) se hace en Gate 2B al cerrar campaña —
si MarketBenchmark aún no existe, benchmarkDelta queda null.
```

### 6D. InsightEngine reglas clima
```
healthy_climate: score > benchmark + 0.5 → positive
declining_climate: score < benchmark - 0.3 → improvement
```

### 6E. LLM Clima (Claude API) — Spec de Studio IA

```yaml
Motor de diagnóstico sistémico-operativo. NO es análisis de sentimiento.

3 lentes:
  1. Fricción Sistémica vs Liderazgo: diferencia si el problema es del
     líder o del sistema. Protege a buenos líderes.
  2. Say-Do Gap: detecta cinismo corporativo ("hablan de balance pero
     exigen correos a las 10 PM").
  3. Locus de Control: mide si el equipo habla con agencia ("necesitamos
     herramientas") o resignación ("acá nunca cambia nada").

Doble output:
  - Macro (CEO): tono consultoría estratégica, conecta con operaciones
  - Táctico (Jefe de Área): tono coach, comportamientos del lunes

JSON Schema y System Prompt diseñados por Studio IA.
Payload = DepartmentClimaInsight (ya diseñado).
Se ejecuta en background, persiste en DepartmentClimaInsight.
Privacy: n≥10 para mostrar por depto.
```

### 6F. Torre de Control widget clima
```
Widget que muestra accumulatedClimaFavorability por depto
con riskZone color-coded. Lee gold cache (~20ms).
```

### 6G. Señales cross-producto — Fase 2A
```yaml
PulseEngine calcula SI los datos existen; flags booleanos persisten
en DepartmentClimaInsight.correlationFlags (Json):
  - RoleFit del manager (Performance 360°)
  - Sesgo de calibración (Mano Blanda/Dura, CalibrationEngine)
  - GoalCompletionRate (cumplimiento alto + bienestar bajo = burnout)
  - turnoverCost (SalaryConfigService)
  - Antigüedad (Employee.hireDate)
  - exitMotivesByDept: motivos de salida frecuentes por depto.
    CONFIRMADO por investigación (jul-2026): el dato YA está persistido
    en DepartmentExitInsight.topExitFactors (schema:1515, lo escribe
    ExitAggregationService en CRON mensual desde ExitRecord.exitFactors).
    Solo CABLEAR la lectura — no recrear el cruce.
    (a confirmar por Code: que el CRON mensual esté poblando en
    cuentas reales y la alineación de períodos)
  - onboardingAbandonRate: tasa abandono temprano por depto.
    CONFIRMADO por investigación (jul-2026): derivable directo de
    DepartmentOnboardingInsight.abandonedJourneys / totalJourneys
    (schema:1008-1012); avgEXOScore en el mismo modelo (schema:1021).
    Solo CABLEAR la división — no recrear agregación.
```

### Verificación Gate 6
```yaml
□ ConvergenciaEngine lee gold cache (no JSON blob)
□ ExitAlertEngine muestra contexto clima
□ Benchmark pulse_climate se calcula
□ InsightEngine genera insights clima
□ LLM Clima genera doble output (macro CEO / táctico jefe) con 3 lentes
□ Señales Fase 2A en correlationFlags (solo si datos existen)
□ Torre de Control muestra widget clima
□ CERO regresiones en módulos existentes
```

---

## GATE 7: SISTEMA VIVO + COMUNICACIÓN (post-lanzamiento)

> Este gate convierte el producto en algo que ningún competidor tiene.

```yaml
PRERREQUISITO Gate 7:
  message-dispatcher debe estar en vercel.json (P0 pendiente de
  Comunicaciones v3). Sin esto, la Bajada de Clima no puede enviarse.
```

### 7A. Seguimiento diferenciado automático (Experiencia Full)
```
Extender audienceRule con criterio departmentId + category
para que cada depto reciba sus preguntas de seguimiento
automáticamente sin necesidad de ajuste manual de
driverFocusByDepartment. Solo aplica a campañas de seguimiento
de Experiencia Full. Evolución natural del filtro del Gate 1D.
```

### 7B. Bajada de Clima (Comunicación de Resultados)
```yaml
Editor:
  - Gerente de Personas abre "Comunicar Resultados"
  - Ve resultados generales pre-cargados
  - Selecciona 5-10 temas relevantes
  - Por cada tema: resultado real + plan comprometido
  - Puede editar narrativas (narrativasEdit pattern)

Generador:
  - PDF o HTML visual con:
    "Esto dijeron ustedes" → resultados reales
    "Esto nos preocupa" → focus areas con datos
    "Esto vamos a hacer" → planes con responsable y fecha
    "Esto celebramos" → fortalezas reconocidas
    "Así lo vamos a medir" → próxima medición en X meses

Envío:
  - Se envía por el canal donde el colaborador tiene consentimiento activo.
  - Correos corporativos: no requieren consent adicional
  - WhatsApp: requiere opt-in (ConsentEvent, Comunicaciones v3)
  - El envío pasa por determineChannel() del channel-selector
  - Nunca se envía a un canal sin consent
  - El alcance real depende del consentimiento, no de "todos"
  - Template nuevo en catálogo
  - Objetivo: alcanzar al 70-80% que no tiene correo (cajeros, aseo,
    operarios) — condicionado a su opt-in WhatsApp

Validación en la siguiente medición de clima:
  - "¿Conoces los resultados de la última medición?" → Sí/No
  - "¿Sientes que la empresa actuó?" → Likert
  - Mide si la bajada funcionó. Close the loop completo.
```

### 7C. Encuesta conversacional (evolución futura)
```
Solo para text_open en WhatsApp.
Claude API hace follow-up en momento de captura.
Complementario al sistema condicional, no reemplazo.
```

### 7D. Señales cross-producto — Fase 2B
```yaml
  - Distribución de estrellas por depto (Performance)
  - GoalAlignment % (metas alineadas a corporativas)
  - PLTalentService (clasificación talento × costo)
  - Pasivo laboral por antigüedad
  (a confirmar por Code: EvaluatorBiasDetector como servicio consumible)
```

### 7E. Curva Vital del Talento — extensión del Sistema NPS Transversal

```yaml
NO es un timeline nuevo solo de clima. Es la visualización que EXTIENDE el
Sistema NPS Transversal YA EXISTENTE (verificado en código: modelo
NPSInsight en prisma/schema.prisma:1265 "Sistema NPS Transversal FocalizaHR";
NPSAggregationService), que centraliza el eNPS de TODO el journey del
colaborador vía productType: onboarding | exit | pulso | experiencia.

El clima (Pulso Express + Experiencia Full) YA alimenta NPSInsight desde
Gate 2 (productType pulso/experiencia, aggregateClimaNPS); Onboarding y Exit
lo alimentan por su cuenta. La Curva Vital renderiza esa línea de tiempo
cross-producto Onboarding→Cultura→Exit (componente CurvaVitalTalento, hoy
placeholder diferido en el Lobby — ver Gate 4). El clima es UNA fuente más
del journey NPS, no el timeline entero: Gate 7 lo cablea sobre el sistema
transversal existente, no crea uno paralelo.
```

### Verificación Gate 7
```yaml
□ Seguimiento diferenciado (Experiencia Full) funciona automáticamente
  por departamento
□ Editor de Bajada permite seleccionar temas y editar narrativas
□ PDF/HTML se genera correctamente con datos reales
□ Envío WhatsApp + Email funciona
□ Pregunta de validación en la siguiente medición funciona
□ Señales Fase 2B en correlationFlags
```

---

## SEÑALES CROSS-PRODUCTO FASE 2 (mapa completo)

### Cruces mapeados desde motores existentes
```yaml
Performance 360°:
  - CalibrationEngine sesgo (Mano Blanda/Dura)
  - RoleFit del manager
  - Distribución de estrellas por depto
  - EvaluatorBiasDetector por depto

Metas:
  - GoalAlignment % (metas alineadas a corporativas)
  - GoalCompletionRate (cumplimiento alto + bienestar bajo = burnout)
  - MissedDeadlines %

Compensation:
  - Equity ratio por depto
  - BonusTalentFactor diferenciación

AI Exposure:
  - focalizaScore promedio por depto
  - augmentationShare (automatable vs augmentable)
```

### Cálculos financieros existentes reutilizables
```yaml
  - SalaryConfigService.calculateTurnoverCost() (8+ consumidores)
  - SalaryConfigService.getEffectiveSalary() (fallback 3 niveles)
  - RetentionEngine costSpectrum (proyección rotación — se absorbe en Gate 3)
  - PLTalentService (clasificación talento × costo)
  - Pasivo laboral por antigüedad (Employee.hireDate)
```

### Persistencia
`DepartmentClimaInsight.correlationFlags Json` guarda flags booleanos
por cada cruce detectado. PulseEngine los calcula SI los datos existen.

### Señales "a confirmar por Code" (verificar existencia real antes de cablear)
```yaml
  - turnoverRate por departamento en DepartmentMetric (¿poblado en cuentas reales?)
  - absenteeismRate por departamento (¿existe?)
  - NPSInsight departamental para onboarding y exit (¿o solo global?)
  - EvaluatorBiasDetector (¿existe como servicio consumible?)
  - BonusTalentFactor (¿existe en CompensationBoard?)
  - Equity ratio por depto (¿calculable desde datos actuales?)

CONFIRMADOS por investigación (jul-2026) — NO requieren verificación:
  - DepartmentExitInsight.topExitFactors: SÍ persiste motivos de salida
    por depto (schema:1515, ExitAggregationService CRON mensual)
  - DepartmentOnboardingInsight.abandonedJourneys/totalJourneys +
    avgEXOScore: SÍ persisten (schema:1008-1022)
```

### Prioridad
```
Fase 2A (Gate 6): RoleFit, sesgo, GoalCompletionRate, turnoverCost,
                  antigüedad, exitMotivesByDept, onboardingAbandonRate
Fase 2B (Gate 7): distribución estrellas, GoalAlignment, PLTalent, pasivo laboral
Fase 2C (post-launch): Equity ratio, BonusTalent, focalizaScore
```

---

## INVESTIGACIÓN DE MERCADO (resumen ejecutivo)

### White space confirmado (Google Deep Research, 70+ fuentes)
- Nadie hace cruce causal automático cross-módulo
- Nadie conecta plan de equipo con PDI del manager
- Nadie personaliza el instrumento de re-medición por departamento
- Predicción individual está rota → diagnosticar por equipo con business case
- La medición es commodity. Las capas 2-4 son el diferenciador.

### Competidores clave
- PeopleE3: más cercano a nuestra visión (agente Atri, IDC tracking, nómina)
- CultureMonkey: WhatsApp + manager action + benchmark (no cruza productos)
- Culture Amp / Qualtrics / Peakon: Capa 1 excelente, Capas 2-4 parciales
- Buk / Rankmi: dominan transaccional LATAM, sin analítica causal

### Dolor #1 del mercado
"Los empleados se vuelven cínicos no porque les preguntas, sino porque
después no pasa nada." — Engagement global cayó a 20% en 2025.
$10T en productividad perdida (Gallup). La Bajada de Clima (Gate 7)
ataca exactamente esto.

---

## ORDEN DE EJECUCIÓN

```
Gate 1 (Foundation)      → 1 sesión Code (~3h)
Gate 2 (Scoring + close enterprise) → 1 sesión Code (~3h)
  ↓ PAUSA: Victor valida datos de prueba
Gate 3 (PulseEngine + absorbe RetentionEngine) → 1-2 sesiones Code (~4h)
  ↓ PAUSA: Victor valida algoritmos
Gate 4 (Frontend)        → 2-3 sesiones Code (~6h)
  ↓ PAUSA: Victor valida UX
Gate 5 (Planes)          → 1-2 sesiones Code (~4h)
  ↓ PAUSA: Narrativas de Victor/Studio IA
Gate 6 (Ecosistema + LLM Clima) → 1-2 sesiones Code (~3h)
  ↓ PRODUCTO BASE LIVE
Gate 7 (Sistema Vivo)    → 2-3 sesiones Code (~6h)
  ↓ PRODUCTO COMPLETO

TOTAL: ~9-14 sesiones Code, ~25-30h desarrollo
```

---

## REFERENCIAS — SOLO SKILLS Y CÓDIGO (ningún documento es requerido)

```yaml
SKILLS (cargar ANTES de implementar el gate que aplique):
  focalizahr-api          → todo endpoint (RBAC + multi-tenant)
  focalizahr-design       → todo componente (Cinema Mode, Gate 4-5)
  focalizahr-narrativas   → textos ejecutivos (Gates 4-7)
  focalizahr-notificaciones → toasts/feedback UI
  focalizahr-benchmark    → Gate 6C

PATRONES EN CÓDIGO (la fuente es el código real, no docs):
  useComplianceData.ts                    → hook Cinema Mode (clonar, Gate 4A)
  DepartmentExitInsight (schema.prisma)   → patrón insight por período
  ComplianceAnalysisOrchestrator          → cierre enterprise (Gate 2C)
  NPSAggregationService.aggregateExitNPS:472 + upsertNPSInsight:152 → Gate 2B
  ExitAlertEngine                         → responsible/deadline en planes
  BenchmarkAggregationService             → Gate 6C
  PDISuggestionEngine                     → Gate 5B
  PositionAdapter                         → acotadoGroup

LECTURAS OPCIONALES (existen en el repo; NO requeridas para ejecutar):
  .claude/tasks/DIAGNOSTICO_FLUJO_CLIMA_RESULTADO.md   → mapa file:line del flujo actual
  .claude/tasks/VISION_EJECUTIVA_EX_CLIMA_v2.md        → visión de producto
  .claude/tasks/FILOSOFIA_UX_SMART_ROUTER_v1_0.md      → filosofía UX (Gate 4)
  .claude/tasks/Sistema_NPS_FocalizaHR_IMPLEMENTACION.md → guía frontend NPS (Gate 4)
```
