# TASK 11B-ADD: Curva Gauss Distribución en Vivo — Asignar Potencial

## CONTEXTO

Este addendum se aplica DESPUÉS de TASK_11B. Reemplaza la MEJORA 4 (barras horizontales) por un gráfico de curva de distribución normal (Gauss) con dos líneas superpuestas: Target (industria) vs Real (en vivo).

**Dependencia:** TASK_11B debe estar completada primero.

## ARCHIVOS A MODIFICAR

```yaml
CREAR:
  1. src/components/performance/DistributionGauge.tsx   # Componente nuevo

MODIFICAR:
  2. src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx  # Integrar componente
```

---

## 📊 DISTRIBUCIÓN ESTÁNDAR INDUSTRIA (CURVA FORZADA)

Basado en los modelos más usados globalmente (GE Vitality Curve, McKinsey, Mercer, Korn Ferry):

```yaml
DISTRIBUCIÓN TARGET ESTÁNDAR:
  Score 5 (Excepcional):     10%   # Top Performers
  Score 4 (Alto):            20%   # High Potential  
  Score 3 (Sólido):          40%   # Core Contributors
  Score 2 (En desarrollo):   20%   # Developing
  Score 1 (Bajo):            10%   # Underperformers

FUENTE: Curva normal (bell curve) aplicada a talent management
  - GE/Welch: 20-70-10 (3 niveles)
  - McKinsey: 10-20-40-20-10 (5 niveles) ← USAMOS ESTA
  - Deloitte/Mercer: Similar con variantes ±5%
```

**Puntos de la curva gaussiana para el gráfico:**

```typescript
// Puntos que forman la curva de distribución normal
// X = score de potencial (1-5), Y = % esperado
const GAUSS_TARGET_POINTS = [
  { score: 1, label: 'Bajo',         targetPct: 10 },
  { score: 2, label: 'Desarrollo',   targetPct: 20 },
  { score: 3, label: 'Sólido',       targetPct: 40 },
  { score: 4, label: 'Alto',         targetPct: 20 },
  { score: 5, label: 'Excepcional',  targetPct: 10 },
]
```

---

## COMPONENTE: DistributionGauge.tsx

**Crear:** `src/components/performance/DistributionGauge.tsx`

```tsx
// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION GAUGE - Curva Gauss: Target vs Real en Vivo
// src/components/performance/DistributionGauge.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: "Entender en 3 segundos. Decidir en 10 segundos."
// INSPIRACIÓN: Tesla energy dashboard + Apple Health trends
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUCIÓN ESTÁNDAR INDUSTRIA (McKinsey 10-20-40-20-10)
// ════════════════════════════════════════════════════════════════════════════

const INDUSTRY_DISTRIBUTION = [
  { score: 1, label: 'Bajo',       targetPct: 10 },
  { score: 2, label: 'Desarrollo', targetPct: 20 },
  { score: 3, label: 'Sólido',     targetPct: 40 },
  { score: 4, label: 'Alto',       targetPct: 20 },
  { score: 5, label: 'Excepcional', targetPct: 10 },
]

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface DistributionGaugeProps {
  /** Array de potentialScores asignados (ej: [3, 4, 5, 3, 2, 4, ...]) */
  assignedScores: number[]
  /** Mínimo de asignaciones para mostrar el gráfico */
  minToShow?: number
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function DistributionGauge({
  assignedScores,
  minToShow = 3
}: DistributionGaugeProps) {
  
  // Calcular distribución real
  const chartData = useMemo(() => {
    const total = assignedScores.length || 1

    return INDUSTRY_DISTRIBUTION.map(item => {
      const count = assignedScores.filter(s => s === item.score).length
      const realPct = Math.round((count / total) * 100)

      return {
        score: item.score,
        label: item.label,
        target: item.targetPct,
        real: realPct,
        count,
      }
    })
  }, [assignedScores])

  // No mostrar si hay pocas asignaciones
  if (assignedScores.length < minToShow) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span>Distribución disponible con ≥{minToShow} asignaciones</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Distribución
        </span>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-cyan-500/60" style={{ borderTop: '2px dashed #22D3EE' }} />
            <span className="text-slate-500">Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-purple-400 rounded" />
            <span className="text-slate-500">Real</span>
          </span>
        </div>
      </div>

      {/* Gráfico Curva Gauss */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 9 }}
              dy={2}
            />

            <YAxis hide domain={[0, 50]} />

            {/* Curva Target — línea discontinua cyan */}
            <Area
              type="monotone"
              dataKey="target"
              stroke="#22D3EE"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="url(#gradientTarget)"
              fillOpacity={1}
              animationDuration={800}
              dot={false}
            />

            {/* Curva Real — línea sólida púrpura brillante */}
            <Area
              type="monotone"
              dataKey="real"
              stroke="#A78BFA"
              strokeWidth={2}
              fill="url(#gradientReal)"
              fillOpacity={1}
              animationDuration={1200}
              animationBegin={300}
              dot={{
                fill: '#A78BFA',
                r: 2.5,
                strokeWidth: 0
              }}
              activeDot={{
                fill: '#A78BFA',
                r: 4,
                stroke: '#A78BFA',
                strokeWidth: 2,
                strokeOpacity: 0.3
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen rápido (1 línea) */}
      <DistributionSummary chartData={chartData} total={assignedScores.length} />
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ════════════════════════════════════════════════════════════════════════════

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  const diff = data.real - data.target
  const diffColor = Math.abs(diff) <= 5 ? '#10B981' : diff > 0 ? '#F59E0B' : '#EF4444'

  return (
    <div className="px-3 py-2 rounded-lg bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl shadow-xl">
      <p className="text-[11px] font-medium text-slate-300 mb-1">
        Potencial {data.score}: {data.label}
      </p>
      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-cyan-400">
          Target: {data.target}%
        </span>
        <span className="text-purple-400">
          Real: {data.real}%
        </span>
        <span style={{ color: diffColor }}>
          ({diff > 0 ? '+' : ''}{diff}%)
        </span>
      </div>
      <p className="text-[9px] text-slate-500 mt-0.5">
        {data.count} persona{data.count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION SUMMARY - Una línea de insight
// ════════════════════════════════════════════════════════════════════════════

function DistributionSummary({ 
  chartData, 
  total 
}: { 
  chartData: { score: number; label: string; target: number; real: number; count: number }[]
  total: number
}) {
  // Encontrar la mayor desviación
  let maxDev = { label: '', diff: 0, direction: '' }
  for (const d of chartData) {
    const diff = Math.abs(d.real - d.target)
    if (diff > Math.abs(maxDev.diff)) {
      maxDev = {
        label: d.label,
        diff: d.real - d.target,
        direction: d.real > d.target ? 'excedido' : 'bajo'
      }
    }
  }

  // Si todas las desviaciones son ≤5%, la distribución es saludable
  const isHealthy = chartData.every(d => Math.abs(d.real - d.target) <= 8)

  if (isHealthy) {
    return (
      <p className="text-[10px] text-emerald-400/80">
        ✓ Distribución alineada con el estándar industria
      </p>
    )
  }

  return (
    <p className="text-[10px] text-amber-400/80">
      ⚡ {maxDev.label} {maxDev.direction} por {Math.abs(maxDev.diff)}% vs target
    </p>
  )
}
```

---

## INTEGRACIÓN EN page.tsx

**Ubicación:** Dentro del PROGRESS CARD existente, como sección adicional a la derecha.

### Importar componente:

```typescript
import DistributionGauge from '@/components/performance/DistributionGauge'
```

### Calcular scores asignados:

```typescript
// Después de las stats existentes, agregar:
const assignedPotentialScores = ratings
  .filter(r => r.potentialScore != null)
  .map(r => r.potentialScore as number)
```

### Agregar al PROGRESS CARD:

Dentro del `<motion.div>` del PROGRESS CARD (el que tiene la línea Tesla de progreso), convertir el layout a 2 columnas cuando hay suficientes asignaciones:

```tsx
{/* PROGRESS CARD */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="relative p-5 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 overflow-hidden"
>
  {/* Línea Tesla */}
  <div
    className="absolute top-0 left-0 h-[2px] transition-all duration-500"
    style={{
      width: `${progressPercent}%`,
      background: 'linear-gradient(90deg, #22D3EE, #A78BFA)'
    }}
  />

  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
    {/* Izquierda: Stats existentes */}
    <div className="flex items-center justify-between lg:justify-start gap-6 flex-1">
      <div className="flex items-center gap-6">
        <StatMini icon={<Users />} label="Evaluados" value={evaluatedCount} color="cyan" />
        <StatMini icon={<CheckCircle2 />} label="Asignados" value={assignedCount} color="emerald" />
        <StatMini icon={<Sparkles />} label="Pendientes" value={pendingEvaluated} color="amber" />
      </div>

      <div className="text-right lg:ml-6">
        <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {progressPercent}%
        </div>
        <div className="text-xs text-slate-500">completado</div>
      </div>
    </div>

    {/* Derecha: Curva Gauss en vivo */}
    <div className="lg:w-[280px] lg:border-l lg:border-slate-700/30 lg:pl-4">
      <DistributionGauge assignedScores={assignedPotentialScores} />
    </div>
  </div>
</motion.div>
```

---

## COMPORTAMIENTO ESPERADO

```yaml
Con < 3 asignaciones:
  → Muestra texto: "Distribución disponible con ≥3 asignaciones"

Con ≥ 3 asignaciones:
  → Gráfico aparece con animación (800ms target, 1200ms real)
  → Curva Target: línea discontinua cyan (#22D3EE)
  → Curva Real: línea sólida púrpura (#A78BFA) con fill gradiente
  → Labels: Bajo | Desarrollo | Sólido | Alto | Excepcional
  → Hover tooltip: muestra Target%, Real%, diferencia, y conteo
  → Resumen: "✓ Distribución alineada" o "⚡ Alto excedido por 15% vs target"

Actualización en vivo:
  → Cada vez que se asigna un potencial (click 1-5), los ratings 
    actualizan → assignedPotentialScores recalcula → gráfico re-renderiza
  → El recálculo es automático porque ratings es estado reactivo
```

---

## RESULTADO VISUAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ═══════════════════════════════════════════════  75%                    │
│                                                                         │
│  🎯 8 Evaluados  ✅ 5 Asignados  ⭐ 3 Pendientes  │  DISTRIBUCIÓN     │
│                                          75%       │  ─ Target  ─ Real │
│                                       completado   │      ╭─╮          │
│                                                     │    ╱·  ·╲        │
│                                                     │   ╱·    ·╲       │
│                                                     │  ╱·      ·╲      │
│                                                     │  Bajo Sól. Alto  │
│                                                     │  ✓ Alineada      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## REGLAS

```yaml
✅ Usar Recharts (ya instalado en el proyecto)
✅ Usar colores corporativos: cyan #22D3EE, purple #A78BFA
✅ Respetar patrón memo()
✅ Responsive: ocultar gauge en mobile si no cabe (lg:block)
✅ Animaciones suaves < 1.5s total
✅ TypeScript strict

❌ No instalar librerías adicionales
❌ No tocar lógica del backend
❌ No modificar RatingRow.tsx (ya se modificó en 11B)
```

---

## VERIFICACIÓN

```yaml
□ Componente DistributionGauge.tsx creado
□ Importado en page.tsx
□ Gráfico muestra 2 curvas superpuestas (target dashed, real solid)
□ Tooltip muestra Target%, Real%, diferencia
□ Resumen muestra "Alineada" o "Excedido/Bajo por X%"
□ Se actualiza en vivo al asignar potencial
□ No aparece con < 3 asignaciones
□ Responsive: stack vertical en mobile
□ npx tsc --noEmit sin errores
```

---

*Addendum para TASK_11B. Aplicar después de que termine la task principal.*
*Prompt: "Implementa TASK_11B-ADD según .claude/tasks/. Crea DistributionGauge.tsx con Recharts y lo integras en la page de ratings."*
