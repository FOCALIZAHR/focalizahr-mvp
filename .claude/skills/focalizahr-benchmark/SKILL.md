---
name: focalizahr-benchmark
description: |
  Sistema de Benchmarks v2.0 de FocalizaHR - comparación contra mercado con insights inteligentes.
  USAR SIEMPRE cuando el usuario mencione: benchmark, comparación mercado, percentil, industria,
  comparativo, InsightEngine, MarketBenchmark, BenchmarkAggregationService, useBenchmark,
  CRON benchmark, cascada especificidad, privacy threshold, o cualquier trabajo con /api/benchmarks.
  También usar cuando se trabaje con scores EXO vs mercado, análisis competitivo de métricas,
  o cualquier componente que muestre datos de benchmark (BenchmarkComparisonCard, BenchmarkInsightsPanel).
  Esta skill tiene precedencia sobre focalizahr-api para todo lo relacionado con benchmarks.
---

# Sistema Benchmark v2.0 - FocalizaHR

Sistema unificado de benchmarks con insights inteligentes para comparar métricas organizacionales contra el mercado.

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA BENCHMARK v2.0                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 1️⃣ CRON MENSUAL (Día 1, 02:10 UTC)                                  │    │
│  │    BenchmarkAggregationService.runMonthlyAggregation()              │    │
│  │    └─ Lee: Department.accumulatedExoScore (LENTE 2 - Gold Cache)    │    │
│  │    └─ Agrupa: país × industria × tamaño × categoría                 │    │
│  │    └─ Calcula: avg, median, percentiles, stdDev                     │    │
│  │    └─ Guarda: MarketBenchmark (isPublic si companyCount >= 3)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ↓                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 2️⃣ API /api/benchmarks (Request time)                               │    │
│  │    └─ Lee: MarketBenchmark (cascada especificidad)                  │    │
│  │    └─ Calcula: Comparación entidad vs benchmark                     │    │
│  │    └─ Genera: Insights con InsightEngine                            │    │
│  │    └─ Retorna: { benchmark, comparison, insights }                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ↓                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 3️⃣ FRONTEND                                                         │    │
│  │    useBenchmark() hook → Consume API                                │    │
│  │    BenchmarkComparisonCard → Visualización principal                │    │
│  │    BenchmarkInsightsPanel → Insights accionables                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Archivos del Sistema

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/services/BenchmarkAggregationService.ts` | Backend | CRON mensual - calcula estadísticas |
| `src/lib/services/InsightEngine.ts` | Backend | Motor de insights inteligentes |
| `src/app/api/benchmarks/route.ts` | API | Endpoint consulta con insights |
| `src/app/api/cron/benchmark-aggregation/route.ts` | API | Trigger CRON |
| `src/types/benchmark.ts` | Types | Tipos unificados cross-producto |
| `src/hooks/useBenchmark.ts` | Frontend | Hook React para consumo |
| `src/components/onboarding/BenchmarkComparisonCard.tsx` | Frontend | Card principal |
| `src/components/onboarding/BenchmarkInsightsPanel.tsx` | Frontend | Panel insights |

### ⚠️ Servicios Deprecados (NO USAR)

| Archivo | Status | Razón |
|---------|--------|-------|
| `OnboardingBenchmarkService.ts` | ⛔ @deprecated | Calcula en tiempo real (ineficiente) |
| `useOnboardingBenchmark.ts` | ⛔ @deprecated | Usar `useBenchmark()` en su lugar |
| `/api/onboarding/benchmark/route.ts` | ⛔ @deprecated | Usar `/api/benchmarks` |

---

## Modelo Prisma: MarketBenchmark

```prisma
model MarketBenchmark {
  id String @id @default(cuid())

  // 🌍 SEGMENTACIÓN ESTRUCTURAL
  country          String  @map("country")           // CL, AR, MX, BR, CO, PE, ALL
  industry         String  @map("industry")          // retail, tech, healthcare, ALL
  companySizeRange String  @map("company_size_range") // 1-50, 51-200, 201-1000, 1001+, ALL
  standardCategory String  @map("standard_category")  // personas, tecnologia, comercial, ALL

  // 👥 SEGMENTACIÓN DEMOGRÁFICA
  dimension        String  @default("GLOBAL") @map("dimension")
  segment          String  @default("ALL")    @map("segment")

  // 📦 CONTEXTO
  metricType       String  @map("metric_type")   // onboarding_exo, exit_retention_risk, nps_score
  metricSource     String  @map("metric_source") // focalizahr_aggregated

  // 📅 TIEMPO
  periodType       String  @default("monthly") @map("period_type")
  periodStart      DateTime @db.Date @map("period_start")
  periodEnd        DateTime @db.Date @map("period_end")
  period           String  @map("period")  // "2025-11"

  // 📊 ESTADÍSTICAS
  avgScore         Float   @map("avg_score")
  medianScore      Float   @map("median_score")
  percentile25     Float   @map("percentile_25")
  percentile75     Float   @map("percentile_75")
  percentile90     Float   @map("percentile_90")
  stdDeviation     Float   @map("std_deviation")
  sampleSize       Int     @map("sample_size")      // Departamentos
  companyCount     Int     @map("company_count")    // Empresas únicas

  // 🔒 PRIVACY CONTROL
  isPublic         Boolean @default(false) @map("is_public")  // true si companyCount >= 3
  isActive         Boolean @default(true)  @map("is_active")
  version          String  @default("v1.0") @map("calculation_version")

  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([country, industry, companySizeRange, standardCategory, dimension, segment, metricType, period])
  @@index([metricType, country, industry], map: "idx_benchmark_lookup")
  @@index([isPublic, metricType], map: "idx_benchmark_public")
  @@map("market_benchmarks")
}
```

---

## API Reference

### GET /api/benchmarks

**Autenticación:** JWT (header `x-account-id` inyectado por middleware)

**Query Parameters:**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `metricType` | string | ✅ | `onboarding_exo`, `exit_retention_risk`, `nps_score`, `pulse_climate` |
| `standardCategory` | string | ✅ | `personas`, `tecnologia`, `comercial`, `operaciones`, `finanzas`, `legal`, `servicio`, `marketing`, `ALL` |
| `departmentId` | string | ❌ | Para calcular comparación (si se omite, solo retorna benchmark) |
| `country` | string | ❌ | Default: country del account |
| `includeInsights` | boolean | ❌ | Default: `true` |

**Response:**

```typescript
{
  success: true,
  data: {
    benchmark: {
      metricType: "onboarding_exo",
      country: "CL",
      industry: "tecnologia",
      companySizeRange: "201-1000",
      category: "personas",
      avgScore: 76,
      medianScore: 76,
      percentiles: { p25: 68, p50: 76, p75: 82, p90: 88 },
      stdDeviation: 8.5,
      sampleSize: 45,        // Departamentos
      companyCount: 12,      // Empresas
      period: "2025-11",
      specificityLevel: 1    // 1=más específico, 4=más general
    },
    comparison: {
      entityName: "Subgerencia Cultura",
      entityScore: 41.3,
      marketAverage: 76,
      difference: -34.7,
      percentageGap: -45.66,
      percentileRank: 15,
      status: "critical",
      message: "🔴 Crítico: Requiere intervención inmediata."
    },
    insights: [
      {
        type: "critical",
        title: "Atención requerida - Cuartil inferior",
        description: "... está en el 15% inferior del mercado.",
        priority: 10,
        action: "Agendar revisión estratégica urgente"
      }
    ]
  }
}
```

### Cascada de Especificidad

La API busca el benchmark más específico disponible:

```
Nivel 1: CL × Retail × 51-200 × personas  (más específico)
Nivel 2: CL × Retail × ALL    × personas
Nivel 3: CL × ALL   × ALL    × personas
Nivel 4: ALL × ALL  × ALL    × personas  (más general)
```

**Privacy Enforcement:** Solo retorna benchmarks con `isPublic = true` (companyCount >= 3)

### POST /api/cron/benchmark-aggregation

**Autenticación:** Header `Authorization: Bearer $CRON_SECRET`

**Trigger:** Vercel Cron día 1 de cada mes, 02:10 UTC

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/benchmark-aggregation",
      "schedule": "10 2 1 * *"
    }
  ]
}
```

---

## Servicios Backend

### BenchmarkAggregationService

**Ubicación:** `src/lib/services/BenchmarkAggregationService.ts`

**Responsabilidad:** Calcular estadísticas de mercado mensualmente

```typescript
// Método principal - ejecutado por CRON día 1 de cada mes
static async runMonthlyAggregation(): Promise<void>

// Método específico onboarding (Fase 1)
private static async calculateOnboardingBenchmarks(
  periodStart: Date,
  periodEnd: Date,
  period: string
): Promise<void>

// Cálculo estadísticas robustas
private static calculateStatistics(
  scores: number[],
  weights: number[]
): StatisticsResult
```

**Fuente de Datos:**
- `Department.accumulatedExoScore` (LENTE 2 - Gold Cache 12 meses)
- Actualizado mensualmente por `OnboardingAggregationService`

### InsightEngine

**Ubicación:** `src/lib/services/InsightEngine.ts`

**Responsabilidad:** Generar insights contextuales basados en reglas

```typescript
// Generar insights ordenados por prioridad
static generateInsights(context: InsightContext): InsightItem[]

// Calcular status basado en diferencia
static calculateStatus(difference: number, percentileRank: number): Status

// Construir contexto desde datos benchmark
static buildContext(params: BuildContextParams): InsightContext
```

**Tipos de Reglas:**

| Scope | Reglas | Ejemplo |
|-------|--------|---------|
| Universal | 8 reglas | Top performer, below average, critical |
| Onboarding | 4 reglas | Early warning, 4C hint |
| Exit | 3 reglas | High risk, analyze causes |
| NPS | 3 reglas | Promoter zone, detractor zone |
| Pulse | 2 reglas | Healthy climate, declining |

---

## Tipos TypeScript

```typescript
// src/types/benchmark.ts

export interface InsightItem {
  type: 'positive' | 'neutral' | 'improvement' | 'critical';
  title: string;
  description: string;
  priority: number;      // 1-10 (mayor = más importante)
  action?: string | null;
}

export interface InsightContext {
  metricType: string;
  entityName: string;
  entityType: 'department' | 'company' | 'team';
  entityScore: number;
  benchmarkAvg: number;
  benchmarkMedian: number;
  difference: number;
  percentageGap: number;
  percentileRank: number;  // 15, 35, 65, 85, 95
  status: 'excellent' | 'above' | 'at' | 'below' | 'critical';
  sampleSize: number;
  companyCount: number;
  category: string;
  country: string;
  industry: string;
  specificityLevel: 1 | 2 | 3 | 4;
}

export interface BenchmarkData {
  metricType: string;
  country: string;
  industry: string;
  companySizeRange: string;
  category: string;
  avgScore: number;
  medianScore: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  stdDeviation: number;
  sampleSize: number;
  companyCount: number;
  period: string;
  specificityLevel: 1 | 2 | 3 | 4;
}

export interface BenchmarkComparison {
  entityName: string;
  entityScore: number;
  marketAverage: number;
  difference: number;
  percentageGap: number;
  percentileRank: number;
  status: 'excellent' | 'above' | 'at' | 'below' | 'critical';
  message: string;
}

export interface BenchmarkResponseWithInsights {
  benchmark: BenchmarkData | null;
  comparison: BenchmarkComparison | null;
  insights: InsightItem[];
}

export interface UseBenchmarkReturn {
  data: BenchmarkResponseWithInsights | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

---

## Hook Frontend: useBenchmark

**Ubicación:** `src/hooks/useBenchmark.ts`

```typescript
import { useBenchmark } from '@/hooks/useBenchmark';

// Uso básico
const { data, loading, error, refetch } = useBenchmark(
  'onboarding_exo',      // metricType
  'personas',            // standardCategory
  'dept_123',            // departmentId (opcional)
  'CL'                   // country (opcional)
);

// Con opciones
const { data } = useBenchmark(
  'onboarding_exo',
  'personas',
  departmentId,
  undefined,
  { enabled: !!departmentId }  // Solo fetch si hay dept
);
```

### Integración en Cards Existentes

```typescript
import { useBenchmark } from '@/hooks/useBenchmark';

export function EXOScoreCard({ globalEXO, account, dominantCategory }) {
  const { data: benchmark } = useBenchmark(
    'onboarding_exo',
    dominantCategory,
    undefined,
    account.country
  );
  
  return (
    <div className="fhr-card">
      {/* Score principal */}
      <div className="text-5xl font-bold text-cyan-400">{globalEXO}</div>
      
      {/* Línea benchmark */}
      {benchmark?.comparison && (
        <div className="mt-3 pt-3 border-t border-border/50 text-sm">
          <span className={benchmark.comparison.status === 'above' 
            ? 'text-green-500' : 'text-red-500'}>
            {benchmark.comparison.percentageGap > 0 ? '+' : ''}
            {benchmark.comparison.percentageGap.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            {' '}vs promedio {dominantCategory} {account.country}
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## Algoritmo de Agregación v2.0

### Problema Corregido

**v1.0 (Incorrecto):** Promediaba departamentos individuales directamente
- Empresa A: 5 depts con scores 80, 75, 70, 65, 60 → contribuía 5 datos
- Empresa B: 1 dept con score 90 → contribuía 1 dato
- **Sesgo:** Empresas con más departamentos tenían más peso

**v2.0 (Correcto):** Pondera por empresa primero, luego promedia
- Empresa A: EXO global = 70 (promedio ponderado de sus 5 depts)
- Empresa B: EXO global = 90
- **Benchmark:** (70 + 90) / 2 = 80 (cada empresa pesa igual)

### Algoritmo Detallado

```typescript
// PASO 1: Agrupar departamentos por empresa
const empresas = new Map<accountId, Department[]>();

// PASO 2: Calcular EXO global de cada empresa
for (const [accountId, depts] of empresas) {
  // Promedio ponderado por volumen de journeys
  const totalWeighted = depts.reduce(
    (sum, d) => sum + (d.accumulatedExoScore * d.accumulatedExoJourneys), 0
  );
  const totalJourneys = depts.reduce(
    (sum, d) => sum + d.accumulatedExoJourneys, 0
  );
  const empresaEXO = totalWeighted / totalJourneys;
}

// PASO 3: Benchmark de mercado (cada empresa pesa igual)
const marketAvg = empresasGlobales.reduce((sum, e) => sum + e.globalExoScore, 0) 
                / empresasGlobales.length;
```

### Tipos de Benchmarks Generados

| standardCategory | Propósito | Ejemplo Query |
|------------------|-----------|---------------|
| `personas` | Áreas de RRHH vs mercado | `/api/benchmarks?...&standardCategory=personas` |
| `tecnologia` | Áreas IT vs mercado | `/api/benchmarks?...&standardCategory=tecnologia` |
| `ALL` | Empresa completa vs mercado | `/api/benchmarks?...&standardCategory=ALL` |

**Caso CEO (Empresa completa):**
```
GET /api/benchmarks?metricType=onboarding_exo&standardCategory=ALL&country=CL
→ Compara MI empresa completa vs TODAS las empresas de Chile
```

**Caso Gerente (Área específica):**
```
GET /api/benchmarks?metricType=onboarding_exo&standardCategory=personas&departmentId=xxx
→ Compara MI área de Personas vs TODAS las áreas de Personas del mercado
```

---

## InsightEngine: Reglas

### Estructura de Regla

```typescript
interface InsightRule {
  id: string;
  metricTypes: string[];  // ['*'] = todos, ['onboarding_exo'] = específico
  condition: (ctx: InsightContext) => boolean;
  generate: (ctx: InsightContext) => InsightItem;
  priority: number;       // Mayor = evalúa primero
}
```

### Reglas Implementadas

**Universales (aplican a todos):**
- `universal_top_performer` - Top 10% del mercado
- `universal_above_average` - Sobre promedio
- `universal_aligned` - En línea con mercado
- `universal_below_average` - Bajo promedio
- `universal_critical` - Cuartil inferior (< P25)
- `universal_sample_size_warning` - Muestra < 10
- `universal_specificity_fallback` - Usando benchmark general
- `universal_context` - Contexto de comparación

**Onboarding EXO:**
- `onboarding_excellent_integration` - Score >= 75 y P75+
- `onboarding_culture_strength` - Fortaleza cultural
- `onboarding_early_warning` - Riesgo fuga primeros 6 meses
- `onboarding_4c_hint` - Revisar dimensiones 4C

**Exit Retention Risk:**
- `exit_low_risk` - Riesgo controlado
- `exit_high_risk` - Riesgo elevado
- `exit_analyze_causes` - Analizar causas raíz

**NPS Score:**
- `nps_promoter_zone` - NPS >= 50
- `nps_passive_zone` - NPS 0-49
- `nps_detractor_zone` - NPS < 0

### Agregar Nueva Regla

```typescript
// En InsightEngine.ts, agregar al array INSIGHT_RULES:
{
  id: 'mi_nueva_regla',
  metricTypes: ['onboarding_exo'],  // o ['*'] para universal
  condition: (ctx) => ctx.percentileRank >= 90 && ctx.entityScore >= 80,
  generate: (ctx) => ({
    type: 'positive',
    title: 'Líder del mercado',
    description: `${ctx.entityName} es referente en ${ctx.category}.`,
    priority: 10,
    action: 'Compartir best practices con otras áreas'
  }),
  priority: 100  // Mayor = evalúa primero
}
```

---

## Extensibilidad: Agregar Nuevo Producto

### Paso 1: Agregar método en BenchmarkAggregationService

```typescript
// En runMonthlyAggregation()
await this.calculateOnboardingBenchmarks(periodStart, periodEnd, period);
await this.calculateExitRetentionBenchmarks(periodStart, periodEnd, period);  // NUEVO

// Nuevo método
private static async calculateExitRetentionBenchmarks(
  periodStart: Date,
  periodEnd: Date,
  period: string
): Promise<void> {
  // Mismo patrón que calculateOnboardingBenchmarks
  // pero usando campo accumulatedRetentionRisk
}
```

### Paso 2: Agregar reglas en InsightEngine

```typescript
{
  id: 'exit_high_risk',
  metricTypes: ['exit_retention_risk'],
  condition: (ctx) => ctx.entityScore > ctx.benchmarkAvg * 1.2,
  generate: (ctx) => ({
    type: 'critical',
    title: 'Riesgo de retención elevado',
    description: '...',
    priority: 10,
    action: 'Activar plan de retención'
  }),
  priority: 93
}
```

### Paso 3: Usar en frontend

```typescript
const { data } = useBenchmark('exit_retention_risk', 'personas', deptId);
```

### Roadmap Productos

| MetricType | Producto | Status |
|------------|----------|--------|
| `onboarding_exo` | EXO Score Onboarding | ✅ Producción |
| `exit_retention_risk` | Exit Intelligence | 📜 Próximo |
| `nps_score` | eNPS | 📜 Próximo |
| `pulse_climate` | Pulso Express | 📜 Futuro |
| `experience_satisfaction` | Experiencia Full | 🔮 Futuro |

---

## Troubleshooting

### Benchmark no disponible

```yaml
Síntoma: API retorna { benchmark: null }

Causa 1: No hay datos en MarketBenchmark
  → Verificar que CRON ejecutó correctamente
  → Ejecutar manualmente: POST /api/cron/benchmark-aggregation

Causa 2: Privacy threshold (< 3 empresas)
  → Normal si categoría tiene pocas empresas
  → Benchmark se mostrará cuando haya >= 3

Causa 3: Cascada no encontró nada
  → Verificar standardCategory es válido
  → Verificar country tiene datos
```

### Insights vacíos

```yaml
Síntoma: insights: []

Causa 1: No hay departmentId
  → Sin comparación no hay insights
  → Pasar departmentId al endpoint

Causa 2: includeInsights=false
  → Verificar query param

Causa 3: Error en InsightEngine
  → Revisar logs del servidor
```

### Performance lento

```yaml
Síntoma: API > 500ms

Solución 1: Verificar índices en MarketBenchmark
  CREATE INDEX idx_benchmark_lookup ON market_benchmarks(
    metric_type, country, industry, company_size_range, 
    standard_category, dimension, is_public
  );

Solución 2: Verificar N+1 queries en CRON
  → Usar eager loading en queries Prisma

Solución 3: Considerar Redis cache (futuro)
```

### Testing Manual

```bash
# Test CRON (desarrollo)
curl -X POST http://localhost:3000/api/cron/benchmark-aggregation \
  -H "Authorization: Bearer $CRON_SECRET"

# Test API sin comparación
curl "http://localhost:3000/api/benchmarks?metricType=onboarding_exo&standardCategory=personas" \
  -H "Cookie: focalizahr_token=JWT_TOKEN"

# Test API con comparación
curl "http://localhost:3000/api/benchmarks?metricType=onboarding_exo&standardCategory=personas&departmentId=DEPT_ID" \
  -H "Cookie: focalizahr_token=JWT_TOKEN"

# Ver benchmarks en Prisma Studio
npx prisma studio
```

---

## Patrones de Código

### ✅ Patrón Correcto: API Benchmark

```typescript
// src/app/api/benchmarks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { extractUserContext } from '@/lib/auth/extractUserContext';
import { prisma } from '@/lib/prisma';
import InsightEngine from '@/lib/services/InsightEngine';

export async function GET(request: NextRequest) {
  try {
    // 1. Extraer contexto (RBAC automático)
    const userContext = await extractUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // 2. Parámetros requeridos
    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metricType');
    const standardCategory = searchParams.get('standardCategory');
    
    if (!metricType || !standardCategory) {
      return NextResponse.json(
        { error: 'metricType y standardCategory son requeridos' },
        { status: 400 }
      );
    }
    
    // 3. Obtener account para defaults
    const account = await prisma.account.findUnique({
      where: { id: userContext.accountId },
      select: { country: true, industry: true, employeeCount: true }
    });
    
    const country = searchParams.get('country') || account?.country || 'CL';
    const departmentId = searchParams.get('departmentId');
    const includeInsights = searchParams.get('includeInsights') !== 'false';
    
    // 4. Cascada de especificidad
    const benchmark = await findBenchmarkWithCascade({
      metricType,
      standardCategory,
      country,
      industry: account?.industry,
      companySizeRange: getSizeRange(account?.employeeCount)
    });
    
    // 5. Comparación si hay departmentId
    let comparison = null;
    let insights: InsightItem[] = [];
    
    if (departmentId && benchmark) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId, accountId: userContext.accountId },
        select: { displayName: true, accumulatedExoScore: true }
      });
      
      if (department?.accumulatedExoScore) {
        const context = InsightEngine.buildContext({
          metricType,
          entityName: department.displayName,
          entityType: 'department',
          entityScore: department.accumulatedExoScore,
          benchmark
        });
        
        comparison = {
          entityName: department.displayName,
          entityScore: department.accumulatedExoScore,
          marketAverage: benchmark.avgScore,
          difference: context.difference,
          percentageGap: context.percentageGap,
          percentileRank: context.percentileRank,
          status: context.status,
          message: getStatusMessage(context.status)
        };
        
        if (includeInsights) {
          insights = InsightEngine.generateInsights(context);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: { benchmark, comparison, insights }
    });
    
  } catch (error) {
    console.error('[API Benchmarks] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', success: false },
      { status: 500 }
    );
  }
}
```

### ❌ Anti-Patrones

```typescript
// ❌ NUNCA: Calcular benchmark en tiempo real
const benchmark = await calculateBenchmarkRealTime(category); // LENTO

// ✅ CORRECTO: Leer de MarketBenchmark pre-calculado
const benchmark = await prisma.marketBenchmark.findFirst({
  where: { metricType, standardCategory, isPublic: true }
});

// ❌ NUNCA: Hardcodear valores de benchmark
const industryAvg = 52.5; // ← HARDCODED

// ✅ CORRECTO: Leer de BD
const { data } = useBenchmark('onboarding_exo', 'personas');
const industryAvg = data?.benchmark?.avgScore;

// ❌ NUNCA: Ignorar privacy threshold
if (companyCount < 3) {
  return benchmark; // ← FUGA DE DATOS
}

// ✅ CORRECTO: Respetar isPublic
const benchmark = await prisma.marketBenchmark.findFirst({
  where: { ...criteria, isPublic: true }
});

// ❌ NUNCA: Usar servicios deprecados
import { OnboardingBenchmarkService } from '@/lib/services/OnboardingBenchmarkService';

// ✅ CORRECTO: Usar hook oficial
import { useBenchmark } from '@/hooks/useBenchmark';
```

---

## Componentes UI

### BenchmarkComparisonCard

```typescript
// src/components/onboarding/BenchmarkComparisonCard.tsx
interface BenchmarkComparisonCardProps {
  departmentId: string;
  departmentName: string;
  entityScore: number;
  standardCategory: string;
  country?: string;
}

export function BenchmarkComparisonCard({
  departmentId,
  departmentName,
  entityScore,
  standardCategory,
  country = 'CL'
}: BenchmarkComparisonCardProps) {
  const { data, loading, error } = useBenchmark(
    'onboarding_exo',
    standardCategory,
    departmentId,
    country
  );
  
  if (loading) return <Skeleton className="h-32 w-full" />;
  if (error || !data?.benchmark) return null;
  
  const { benchmark, comparison } = data;
  
  return (
    <div className="fhr-card p-6">
      <div className="flex items-center justify-between">
        {/* Score propio */}
        <div>
          <div className="text-4xl font-bold text-cyan-400">
            {entityScore.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Tu score</div>
        </div>
        
        {/* Comparación */}
        <div className="text-right">
          <div className="text-4xl font-bold text-gray-400">
            {benchmark.avgScore.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Mercado</div>
        </div>
      </div>
      
      {comparison && (
        <div className={cn(
          "mt-4 pt-4 border-t border-border/50 text-center",
          comparison.status === 'above' || comparison.status === 'excellent'
            ? 'text-green-500'
            : comparison.status === 'critical'
            ? 'text-red-500'
            : 'text-amber-500'
        )}>
          <span className="text-lg font-semibold">
            {comparison.percentageGap > 0 ? '+' : ''}
            {comparison.percentageGap.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            vs promedio {standardCategory}
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## Referencias Cruzadas

| Tema | Documento |
|------|-----------|
| Triple Lente (LENTE 1, 2, 3) | `BACKEND_ONBOARDING_JOURNEY_INTELLIGENCE_v6_0_COMPLETO.md` |
| standardCategory / DepartmentAdapter | `DOCUMENTO_MAESTRO_Flujo_Completo_Estructura_Mapeo_Departamentos.md` |
| Design System | `FILOSOFIA_DISENO_FOCALIZAHR_v2.md` |
| RBAC / Filtrado Jerárquico | `GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_2.md` |

---

## Checklist Pre-Implementación

```markdown
□ ¿Estoy usando useBenchmark() y NO useOnboardingBenchmark() (deprecado)?
□ ¿Estoy leyendo de MarketBenchmark y NO calculando en tiempo real?
□ ¿Respeto isPublic = true para no exponer datos privados?
□ ¿Uso la cascada de especificidad para fallback?
□ ¿Paso departmentId para obtener comparación e insights?
□ ¿Los insights se muestran ordenados por prioridad?
□ ¿Manejo el caso benchmark: null correctamente?
□ ¿El metricType es uno de los soportados?
□ ¿El standardCategory es válido (no inventado)?
```

---

**Versión:** 2.0  
**Última Actualización:** Abril 2026  
**Mantenedor:** FocalizaHR Engineering Team  
**Status:** ✅ PRODUCCIÓN
