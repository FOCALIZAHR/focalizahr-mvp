# FocalizaHR — Ficha de Productos (dossier comercial)

> Carpeta `.claude/FICHA_PRODUCTOS/` — documentación oficial del ecosistema FocalizaHR como producto (jun-2026): capacidades + APIs + UI + diferenciadores + deudas verificadas con file:line. Versionada con el repo.
> Es DOCUMENTACIÓN del proyecto, NO memoria de sesión. La memoria de desarrollos vigentes vive aparte en `~/.claude/projects/.../memory/MEMORY.md` — registros separados, ninguno pisa al otro.
> Cada archivo `project_*_inventario_producto.md` = una ficha de módulo. Los `project_gate0_*.md` = verificaciones de estado vivo que sustentan el dossier.

## Cadena de valor (cómo encajan los módulos)
Pulso/Experiencia (motor de encuestas, FUNDACIONAL) → módulos de inteligencia (Performance / Metas / Onboarding / Exit / Ambiente Sano) → capas derivadas que consumen lo anterior (Workforce / Efficiency / Sucesión / TAC / P&L Talent) + infraestructura transversal (Comunicaciones / Benchmark / Descriptores). **Encima de todo:** la Capa de Estrategia (cockpit ejecutivo) que los funde para el C-level.

## Meta-producto
- [⭐ Capa de Estrategia (Cockpit Ejecutivo)](producto_capa_estrategia_cockpit.md) — funde Workforce+Efficiency+Metas+Executive Hub en un tablero único para CEO, filtrado por jerarquía para cada gerente (accountability en cascada). 70% packaging+glue, 30% síntesis nueva. Dependencia dura: cerrar auditoría RBAC del backlog antes de vender "acceso filtrado".

## Los 11 inventarios de producto
- [Pulso/Experiencia](project_pulso_experiencia_inventario_producto.md) — FUNDACIONAL: motor campañas/preguntas/Response.normalizedScore + Torre de Control 3 niveles IA predictiva (useCampaignMonitor 1214l, ~27 paneles monitor). Diferenciador: un motor, muchos productos.
- [Performance](project_performance_inventario_producto.md) — el más grande del talento: 360 pesos Self0/Mgr60/Peer25/Up15, hybrid score+Time Travel, RoleFit capped, 9-box, TalentIntelligence (movilidad/riesgo SLA), calibración PDF+QR+sesgo. Deudas: sin approvedBy, PDF no encriptado app, estilo evaluador intra-ciclo.
- [Metas](project_metas_inventario_producto.md) — detector de incoherencias eval≠resultado, Time Travel, cascada por reglas, 4 cuadrantes. Deudas: "Solicitar Cierre" UI rota (1 prop), 6 endpoints aux sin hasPermission.
- [Sucesión](project_succession_inventario_producto.md) — readiness 4 niveles, DiagnosisEngine 10 casos, efecto dominó, bench strength. Consumidor de Performance. Deudas: create-pdi DEPRECATED, debug logs critical-positions/[id].
- [Workforce](project_workforce_inventario_producto.md) — capa DERIVADA (sin tablas), EnrichedEmployee 28 campos, exposición IA focalizaScore, 9 detectores, retención por persona, presupuesto dotación 5 pasos. UI Cinema Mode COMPLETA. Deudas: TabBenchmarks/Simulador placeholders, exposure_ia sin benchmark.
- [Efficiency Hub](project_efficiency_inventario_producto.md) — 9 lentes L1-L9 (capa narrativa sobre Workforce), carrito decisiones CEO, tabla EfficiencyPlan, molde 4 actos, business case exportable. Deudas: L6 congelada, L8 fusionada, L3 clima fallback, AREA_MANAGER diferido.
- [TAC (Talent Action Center)](project_tac_inventario_producto.md) — 2 pilares (gerencias 6 patrones / personas treemap+masivas), dispara comités+emails desde pantalla, IntelligenceInsight audita, Exit×Riesgo. Deuda: cross-cycle no implementado.
- [P&L Talent / Cascada de la Verdad](project_pltalent_inventario_producto.md) — estado de resultados del talento: brecha productiva + semáforo legal (Art.163/172) + síntesis 5 diagnósticos. 5 actos+Ancla "Masa y Gravedad". Único que pone desempeño en CLP. Distinto de TAC (análisis vs ejecución).
- [Exit Intelligence](project_exit_inventario_producto.md) — registro+EIS+6 alertas (ley_karin 24h)+correlación onboarding+retención. 3 tablas propias, UI completa ~50 componentes. Diferenciador: correlación onboarding única + Ley Karin. Deudas: 2 alertas diferidas, SLA estático.
- [Onboarding Intelligence](project_onboarding_inventario_producto.md) — gemelo predictivo de Exit: journey 4 hitos D1/D7/D30/D90 (Bauer 4C), EXO score, 6 alertas proactivas SLA dinámico, ROI managed-vs-ignored. UI completa (Pipeline Kanban). Deuda: sin Cinema Mode/5 actos.
- [Ambiente Sano (Compliance/Ley Karin)](project_ambientesano_inventario_producto.md) — el más grande: Safety Score 6 dims + ISA 0-100 (voz estructurada+libre LLM+convergencia) + convergencia 3 motores + 7 alertas SLA + 11 intervenciones evidencia. Cinema 10 secciones. Diferenciador: compliance predictivo, desenmascara teatro cumplimiento. Nota: deuda tokens RESUELTA en código (frontend-design.md desactualizado).
- [Benchmark System v2.0](project_benchmark_inventario_producto.md) — infra comparación mercado, SIN página propia (embebido). MarketBenchmark, cascada especificidad 4 niveles, privacy ≥3 empresas, InsightEngine ~11 reglas. Diferenciador: compara sin exponer. Deudas: sin hasPermission, CRON no en vercel.json, exposure_ia/exit/nps/pulse stub.
- [Comunicaciones 3.0](project_comunicaciones_inventario_producto.md) — backbone multicanal email/WhatsApp headless: cola CommunicationMessage + dispatcher resiliente, channel-selector, resolvePhone 4 estrategias, consent híbrido. Gates A/B/C SELLADOS. Bloqueadores go-live: TWILIO_MODE=simulation, Meta pendiente, Capa3 no en vercel.json.
- [Descriptores (Occupation/RoleFit)](project_descriptores_inventario_producto.md) — identidad ocupacional, cimiento de Workforce. OccupationResolver v3 (heurística+LLM Haiku), JobDescriptor editable, exposición IA por tarea (IPI). O*NET. Deudas: RoleCardBento sin resolver visual, ~17 UNCLASSIFIED, sin hooks.

## Gate 0 — Verificaciones de estado vivo (sustento del dossier, file:line vs código real)
- [Gate 0 calibración+performance](project_gate0_dossier_calibracion_performance.md) — nineBox SÍ recalcula; híbrido+TimeTravel+pesos OK; plan-acción calibrador no-jefe latente; estilo evaluador en Efficiency L4 intra-ciclo.
- [Gate 0 base madre Desempeño+Metas](project_gate0_base_madre_desempeno_metas.md) — correo corp VIVO, WhatsApp=Gate E simulation. Informe calibración PDF+QR en Supabase (no encriptado app, sin approvedBy). Nota oficial PONDERA. SALARIO=real empresa por cargo (Account.salaryByJobLevel, no estimado).
- [Gate 0 Metas estado vivo](project_gate0_metas_estado_vivo.md) — filtrado jerárquico VIVO (doc feb obsoleto), 6 endpoints aux sin hasPermission, "Solicitar Cierre" UI rota, 4 cuadrantes completos.

## Cómo usar este índice
- Para el documento comercial: cada inventario tiene capacidades vendibles + diferenciadores + deudas honestas (qué NO prometer).
- Antes de afirmar algo en el dossier, cruzar con las verificaciones Gate 0 (estado vivo verificado contra código).
