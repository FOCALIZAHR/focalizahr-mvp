---
name: project_benchmark_inventario_producto
description: "Inventario de producto del módulo Benchmark System v2.0 FocalizaHR — comparación mercado anonimizada, cascada especificidad, InsightEngine, capa transversal embebida. Mapa base madre comercial (jun-2026)."
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b27aa2-9808-45bd-830d-e00bd7ceec87
---

Módulo Benchmark System v2.0 mapeado como producto, 2026-06-25. Read-only, file:line abajo. Infraestructura de comparación contra mercado. SIN página propia: capa transversal pre-agregada (1 tabla MarketBenchmark) consumida por Onboarding/Exit/Performance. Skill focalizahr-benchmark = fuente de verdad.

**5 CAPACIDADES:**
1. Agregación mensual anonimizada — BenchmarkAggregationService.ts (931 líneas, CRON día1). runMonthlyAggregation → calculateOnboardingBenchmarks/ByJobLevel/calculateRoleFitBenchmarks. Agrupa por (country×industry×companySizeRange×standardCategory×dimension×segment×metricType×period). Stats avg/median/p25/p50/p75/p90/stdDev/sampleSize/companyCount. PONDERADO POR EMPRESA (no depto). ~300-350 registros/mes.
2. Cascada especificidad 4 niveles — findBestBenchmark. L1(CL×Tecnología×51-200×Personas)→L2(sin tamaño)→L3(sin industria)→L4(ALL global). Devuelve specificityLevel.
3. Privacy threshold — isPublic=companyCount>=3 (nunca expone <3 empresas distintas, anti reverse-engineering).
4. Dimensiones+métricas — GLOBAL + JOB_LEVEL (acotadoGroup alta_gerencia/mandos_medios/profesionales/base_operativa). ACTIVOS: onboarding_exo (GLOBAL+JOB_LEVEL), performance_rolefit (GLOBAL+JOB_LEVEL+combinatoria). STUB: exit_retention_risk, nps_score, pulse_climate, exposure_ia.
5. InsightEngine — ~11 reglas core universales (top_performer P90+, above/below_average, critical cuartil inferior, sample_size_warning <10, specificity_fallback) + específicas por metricType (onboarding 4C, rolefit por nivel cargo alta_gerencia/mandos/base). Genera hasta 5 insights priorizados (1-10), traduce percentil a lenguaje ejecutivo. type positive/neutral/improvement/critical.

**MODELO PRISMA (1):** MarketBenchmark (schema:1051-1106): country/industry/companySizeRange/standardCategory/dimension(GLOBAL|JOB_LEVEL)/segment(ALL|acotadoGroup)/metricType/metricSource/period/avgScore/medianScore/percentile25-75-90/stdDeviation/sampleSize/companyCount/isPublic/isActive/version. Unique (country,industry,companySizeRange,standardCategory,dimension,segment,metricType,period). Índices idx_benchmark_lookup/public/demographic/period. Persistido mensual; comparison+percentileRank+insights DERIVADOS per-request.

**APIs (3):** GET /api/benchmarks (cascada+comparación+insights, params metricType+standardCategory req, dimension/segment/departmentId/country/includeInsights), GET /api/onboarding/benchmark (DEPRECATED), POST /api/cron/benchmark-aggregation (Bearer CRON_SECRET). Hook useBenchmark (+useBenchmarkComparison/useBenchmarkStatus). Tipos benchmark.ts (BenchmarkData/Comparison/InsightItem/MetricType/METRIC_CONFIGS).

**UI: SIN PÁGINA PROPIA, EMBEBIDO.** Exit ACTIVO: BenchmarkCard (alert detail), ExitBenchmarkCard (overview+executive). Onboarding: CompetitiveContextCard/EXOScoreGauge (BenchmarkComparisonCard/InsightsPanel/PercentileChart HUÉRFANOS deprecados). Workforce: TabBenchmarks PLACEHOLDER (exposure_ia).

**DIFERENCIADORES:** (1) compara sin exponer (threshold 3 empresas vendible+legal). (2) cascada inteligente (nunca "sin datos" si hay nivel general). (3) insights no números (motor reglas→recomendación). (4) infraestructura reutilizable (1 agregador alimenta todos).

**DEUDAS VERIFICADAS:** GET /api/benchmarks SIN hasPermission (valida x-account-id no rol, falta benchmark:view). CRON NO cableado en vercel.json (comentado, NO corre en prod). 4 componentes onboarding huérfanos. exit_retention/nps/pulse/exposure_ia STUB (TabBenchmarks placeholder). OnboardingBenchmarkService deprecado. RoleFit lee directo PerformanceRating (no employee-based aún).

Consumido por [[project_onboarding_inventario_producto]] (onboarding_exo), [[project_exit_inventario_producto]] (exit_retention stub), [[project_performance_inventario_producto]] (performance_rolefit), [[project_workforce_inventario_producto]] (exposure_ia placeholder). Ver [[project-benchmark-masa-n1]] (no reactivar sin auditar privacy).

## Por qué importa (vista comercial)

- **Qué resuelve:** permite **comparar sin exponer** — el umbral mínimo de empresas por celda hace que la comparación de mercado sea vendible y legalmente defendible, que es lo que frena a la mayoría de los competidores.
- **A quién le importa:** al **CEO** (¿estamos bien o mal respecto del mercado?) y a **RRHH**, que necesita el dato externo para sostener una decisión interna.
- **Qué ofrece que el mercado no:** la **cascada de especificidad** evita el "sin datos suficientes" — si no hay muestra para tu cargo en tu industria, baja de nivel hasta encontrar una comparación válida en vez de dejar la pantalla vacía.
- **Entrega insights, no números:** un motor de reglas convierte el percentil en una recomendación con contexto, en vez de dejar al usuario interpretando un gráfico de barras.
- **Infraestructura reutilizable:** un solo agregador alimenta a todos los módulos — el benchmark no se re-implementa por producto.
