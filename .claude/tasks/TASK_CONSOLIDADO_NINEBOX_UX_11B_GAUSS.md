# TASK CONSOLIDADO: Nine-Box UX + Re-aplicar 11B + Gauss Distribution

## CONTEXTO CRÍTICO

Después del refactor de seguridad (RBAC + server-side filtering), los fixes de **TASK 11B** (UX "Asignar Potencial") y **TASK 11B-ADD** (Curva Gauss) se perdieron. Adicionalmente, el **Nine-Box Grid** muestra abreviaciones incomprensibles (EST, APO, DIA, INC, JCL, ADE, BDE, DPR, PCO) en vez de nombres de empleados.

### Estado Actual Post-Refactor:
- ✅ `PerformanceRatingService.ts` — Server-side filtering con evaluationStatus, search, stats via COUNT
- ✅ `route.ts` (performance-ratings) — Pasa query params al service, AREA_MANAGER con departmentIds
- ✅ `ratings/page.tsx` — Refactorizado: sin limit=500, sin filtrado client-side, stats del backend, paginación real 20/página, useDebounce 300ms
- ❌ `RatingRow.tsx` — Perdió bugs fix (textarea + notes) y mejoras UX
- ❌ `ratings/page.tsx` — Perdió mejoras UX (toast, banner, distribution gauge)
- ❌ `NineBoxGrid.tsx` — UX con abreviaciones que nadie entiende

---

## PARTE 1: NINE-BOX GRID → UX CON NOMBRES DE EMPLEADOS

### Problema Actual

El componente `NineBoxCell` en `src/components/performance/NineBoxGrid.tsx` muestra:

```tsx
{/* Label corto - ESTO ES LO QUE NADIE ENTIENDE */}
<span className="text-lg font-bold text-slate-400">
  {config.labelShort}  {/* ← EST, APO, DIA, INC, JCL, ADE, BDE, DPR, PCO */}
</span>

{/* Nombre de la posición */}
<span className="text-[11px] font-medium">{config.label}</span>

{/* Contador */}
<div className="px-2.5 py-1 rounded-full text-xs font-bold">{count}</div>
```

### UX Objetivo (Inspirado en concepto Gemini)

Cada celda debe mostrar:
1. **Header:** Nombre de posición en MAYÚSCULAS (ej: "ESTRELLAS") + badge contador arriba-derecha
2. **Subtítulo:** Descripción corta (ej: "Top Talent", "El motor de la empresa")
3. **Lista de empleados:** Iniciales con avatar + nombre + cargo/departamento
4. **Scroll interno** si hay muchos empleados en una celda

### Archivo a Modificar

```yaml
MODIFICAR:
  - src/components/performance/NineBoxGrid.tsx  # NineBoxCell completo
```

### Cambios en NineBoxCell

**REEMPLAZAR** el contenido actual de `NineBoxCell` por:

```tsx
const NineBoxCell = memo(function NineBoxCell({
  position,
  config,
  count,
  percent,
  isSelected,
  isFaded,
  hasEmployees,
  employees,  // ← NUEVO PROP: necesita recibir los empleados
  onClick
}: NineBoxCellProps) {

  // Helper para iniciales
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Subtítulos descriptivos para cada posición
  const POSITION_SUBTITLES: Record<string, string> = {
    star: 'Top Talent',
    growth_potential: 'Alto Potencial / Medio Desemp…',
    potential_gem: 'Alto Potencial / Bajo Desempeño',
    high_performer: 'Medio Potencial / Alto Desemp…',
    core_player: 'El motor de la empresa',
    inconsistent: 'Medio Potencial / Bajo Desemp…',
    trusted_professional: 'Bajo Potencial / Alto Desemp…',
    average_performer: 'Bajo Potencial / Medio Desemp…',
    underperformer: 'Requiere atención inmediata',
  }

  // Máximo empleados visibles sin scroll
  const MAX_VISIBLE = 3

  return (
    <motion.button
      onClick={onClick}
      disabled={!hasEmployees}
      className={cn(
        'relative min-h-[140px] p-3 rounded-xl transition-all duration-300',
        'bg-slate-800/40 backdrop-blur-md',
        'border border-slate-700/40',
        'flex flex-col text-left',
        hasEmployees && 'hover:bg-slate-800/60 hover:border-slate-600/60 cursor-pointer',
        !hasEmployees && 'opacity-40 cursor-not-allowed',
        isFaded && 'opacity-20 scale-95',
        isSelected && 'z-50 scale-105 border-white/30 shadow-2xl shadow-cyan-500/20'
      )}
      animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Línea Tesla superior */}
      {hasEmployees && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`
          }}
        />
      )}

      {/* ── HEADER: Nombre posición + Badge contador ── */}
      <div className="flex items-start justify-between w-full mb-1">
        <div className="flex-1 min-w-0">
          <h4
            className="text-xs font-bold uppercase tracking-wide truncate"
            style={{ color: hasEmployees ? config.color : '#64748b' }}
          >
            {config.label}
          </h4>
          <p className="text-[9px] text-slate-500 truncate mt-0.5">
            {POSITION_SUBTITLES[position] || ''}
          </p>
        </div>
        
        {/* Badge contador */}
        <span className={cn(
          'flex-shrink-0 ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold',
          hasEmployees
            ? 'bg-slate-700/60 text-slate-200'
            : 'bg-slate-800/40 text-slate-600'
        )}>
          {count}
        </span>
      </div>

      {/* ── LISTA DE EMPLEADOS (solo si hay) ── */}
      {hasEmployees && employees && employees.length > 0 && (
        <div className="flex-1 w-full mt-2 space-y-1.5 overflow-y-auto max-h-[120px] scrollbar-thin">
          {employees.slice(0, MAX_VISIBLE).map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
            >
              {/* Avatar con iniciales */}
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border"
                style={{
                  borderColor: `${config.color}40`,
                  color: config.color,
                  backgroundColor: `${config.color}10`
                }}
              >
                {getInitials(emp.employeeName)}
              </div>
              
              {/* Nombre + cargo */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-200 truncate">
                  {emp.employeeName}
                </p>
                <p className="text-[9px] text-slate-500 truncate">
                  {emp.department || emp.employeePosition || ''}
                </p>
              </div>
            </div>
          ))}

          {/* Indicador "+N más" */}
          {employees.length > MAX_VISIBLE && (
            <p className="text-[9px] text-slate-500 text-center pt-0.5">
              +{employees.length - MAX_VISIBLE} más…
            </p>
          )}
        </div>
      )}
    </motion.button>
  )
})
```

### Actualizar NineBoxCellProps y el render del grid

**En la interface `NineBoxCellProps`**, agregar:

```typescript
interface NineBoxCellProps {
  position: NineBoxPosition
  config: NineBoxPositionConfig
  count: number
  percent: number
  isSelected: boolean
  isFaded: boolean
  hasEmployees: boolean
  employees?: Employee9Box[]  // ← NUEVO
  onClick: () => void
}
```

**En el render del grid** (dentro de `GRID_ORDER.flat().map`), pasar `employees`:

```tsx
{GRID_ORDER.flat().map((position) => {
  const cell = dataByPosition.get(position)
  const config = getNineBoxPositionConfig(position)
  const isSelected = selectedPosition === position
  const hasEmployees = (cell?.count || 0) > 0

  return (
    <NineBoxCell
      key={position}
      position={position}
      config={config}
      count={cell?.count || 0}
      percent={totalEmployees > 0 ? Math.round(((cell?.count || 0) / totalEmployees) * 100) : 0}
      isSelected={isSelected}
      isFaded={selectedPosition !== null && !isSelected}
      hasEmployees={hasEmployees}
      employees={cell?.employees || []}  // ← PASAR EMPLEADOS
      onClick={() => handleCellClick(position)}
    />
  )
})}
```

### Verificación Nine-Box

```yaml
□ Cada celda muestra nombre de posición (ESTRELLAS, no EST)
□ Subtítulo descriptivo debajo del nombre
□ Badge contador arriba-derecha
□ Lista de empleados con avatar iniciales + nombre + depto
□ Máximo 3 visibles por celda, "+N más" si hay más
□ Celdas vacías muestran opacity reducida
□ Click en celda abre el Drawer con lista completa
□ TypeScript strict sin errores
```

---

## PARTE 2: RE-APLICAR TASK 11B (Bugs + Mejoras UX) 

### IMPORTANTE — Adaptación al Código Refactorizado

El código actual de `ratings/page.tsx` ya tiene:
- ✅ Server-side filtering (evaluationStatus, potentialStatus, search como query params)
- ✅ Stats del backend (stats.evaluated, stats.assigned, stats.pending, stats.total)
- ✅ Paginación real (page/limit del backend)
- ✅ useDebounce para búsqueda (300ms)
- ✅ Tabs que triggerean re-fetch (no filtrado client-side)

Por lo tanto, las MEJORAS 1 (filtro evaluados), 3 (stats) y parte de la lógica de filtros YA ESTÁN IMPLEMENTADAS por el refactor server-side. Lo que falta re-aplicar:

### Archivos a Modificar

```yaml
MODIFICAR:
  1. src/components/performance/RatingRow.tsx          # Bugs + mejoras UX
  2. src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx  # Toast + banner + gauge
```

### 🔴 BUG 1: Textarea de notas desconectado (RatingRow.tsx)

**El textarea actual es decorativo — no guarda nada.**

Agregar al componente RatingRow:

```tsx
// 1. Estado local para notas
const [localNotes, setLocalNotes] = useState(rating.potentialNotes ?? '')
const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

// 2. Sync cuando rating cambia (ej: re-fetch)
useEffect(() => {
  setLocalNotes(rating.potentialNotes ?? '')
}, [rating.potentialNotes])

// 3. Handler de guardado de notas
const handleSaveNotes = async () => {
  if (localNotes === (rating.potentialNotes ?? '')) return // sin cambios
  if (!localPotential) return // necesita potencial asignado primero
  
  setNotesStatus('saving')
  try {
    const res = await fetch(`/api/performance-ratings/${rating.id}/potential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        potentialScore: localPotential, 
        notes: localNotes 
      })
    })
    if (res.ok) {
      setNotesStatus('saved')
      setTimeout(() => setNotesStatus('idle'), 2500)
    }
  } catch (error) {
    console.error('Error saving notes:', error)
    setNotesStatus('idle')
  }
}

// 4. Conectar textarea
<textarea
  value={localNotes}
  onChange={(e) => setLocalNotes(e.target.value)}
  onBlur={handleSaveNotes}
  className={cn(/* clases existentes */)}
  placeholder="Observaciones sobre el potencial del empleado..."
  rows={3}
/>

// 5. Indicador debajo del textarea
<div className="flex items-center justify-between mt-1">
  <span className="text-[10px] text-slate-600">Confidencial · Solo visible para HR</span>
  {notesStatus === 'saving' && (
    <span className="text-[10px] text-cyan-400 flex items-center gap-1">
      <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
    </span>
  )}
  {notesStatus === 'saved' && (
    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
      <Check className="w-3 h-3" /> Guardado
    </span>
  )}
</div>
```

### 🔴 BUG 2: Notes no se envían con potentialScore (RatingRow.tsx)

**En `handleAssignPotential`:**

```typescript
// ACTUAL (solo envía score):
body: JSON.stringify({ potentialScore: score })

// CORRECTO (envía score + notas):
body: JSON.stringify({ potentialScore: score, notes: localNotes || undefined })
```

### 🟡 MEJORA 2: Toast de confirmación al guardar (RatingRow.tsx)

```tsx
const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

// En handleAssignPotential, después de res.ok:
setSaveStatus('saved')
setTimeout(() => setSaveStatus('idle'), 2500)

// En el render, junto al PotentialSelector:
{saveStatus === 'saved' && (
  <motion.span 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0 }}
    className="text-xs text-emerald-400 flex items-center gap-1"
  >
    <Check className="w-3 h-3" /> Guardado
  </motion.span>
)}
```

### 🟡 MEJORA 5: Banner contextual para pendientes (ratings/page.tsx)

**Usando stats del backend (ya disponible):**

```tsx
{/* Banner informativo — debajo de la lista */}
{stats && stats.total > stats.evaluated && (
  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
      <div>
        <p className="text-sm text-amber-300">
          {stats.total - stats.evaluated} colaboradores aún no tienen evaluación completada
        </p>
        <p className="text-xs text-slate-500">
          Deben completar su evaluación 360° antes de asignar potencial
        </p>
      </div>
    </div>
  </div>
)}
```

### 🟡 MEJORA 6: Score con badge de nivel visible (RatingRow.tsx)

```tsx
// REEMPLAZAR la línea "Performance" por el label de clasificación:
<div className="text-[10px]" style={{ color: `${perfClassification.color}80` }}>
  {effectiveScore > 0 ? perfClassification.label : 'Sin evaluar'}
</div>
```

> NOTA: Verificar qué propiedad usa `getPerformanceClassification()` para el label.
> En `src/config/performanceClassification.ts` el tipo `PerformanceLevelConfig` tiene `.label`.

### Verificación Task 11B

```yaml
□ Textarea carga datos existentes de DB (value={localNotes})
□ Textarea tiene onChange que actualiza estado local
□ Textarea guarda al hacer onBlur (si hay cambios)
□ Click en botón 1-5 envía notes junto con potentialScore
□ Toast "✓ Guardado" aparece ~2.5s después de asignar potencial
□ Indicador "Guardando..." / "✓ Guardado" debajo del textarea
□ Score muestra label de clasificación (meets_expectations, etc.)
□ Banner "X pendientes" aparece usando stats del backend
□ URLs de fetch usan /api/performance-ratings/ (sin admin)
□ No hay errores TypeScript
```

---

## PARTE 3: RE-APLICAR TASK 11B-ADD (Curva Gauss Distribution)

### Archivo a Crear

```yaml
CREAR:
  - src/components/performance/DistributionGauge.tsx
```

### Archivo a Modificar

```yaml
MODIFICAR:
  - src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx  # Integrar gauge
```

### Componente DistributionGauge.tsx

Crear archivo completo: `src/components/performance/DistributionGauge.tsx`

```tsx
'use client'

import { memo, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts'

// Distribución Estándar Industria (McKinsey 10-20-40-20-10)
const INDUSTRY_DISTRIBUTION = [
  { score: 1, label: 'Bajo',       targetPct: 10 },
  { score: 2, label: 'Desarrollo', targetPct: 20 },
  { score: 3, label: 'Sólido',     targetPct: 40 },
  { score: 4, label: 'Alto',       targetPct: 20 },
  { score: 5, label: 'Excepcional', targetPct: 10 },
]

interface DistributionGaugeProps {
  assignedScores: number[]
  minToShow?: number
}

export default memo(function DistributionGauge({
  assignedScores,
  minToShow = 3
}: DistributionGaugeProps) {
  
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
            <span className="w-4 h-[2px]" style={{ borderTop: '2px dashed #22D3EE' }} />
            <span className="text-slate-500">Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-purple-400 rounded" />
            <span className="text-slate-500">Real</span>
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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

            {/* Curva Real — línea sólida púrpura */}
            <Area
              type="monotone"
              dataKey="real"
              stroke="#A78BFA"
              strokeWidth={2}
              fill="url(#gradientReal)"
              fillOpacity={1}
              animationDuration={1200}
              animationBegin={300}
              dot={{ fill: '#A78BFA', r: 2.5, strokeWidth: 0 }}
              activeDot={{ fill: '#A78BFA', r: 4, stroke: '#A78BFA', strokeWidth: 2, strokeOpacity: 0.3 }}
            />

            <Tooltip content={<CustomTooltip />} cursor={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen 1 línea */}
      <DistributionSummary chartData={chartData} total={assignedScores.length} />
    </div>
  )
})

// ── Custom Tooltip ──
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
        <span className="text-cyan-400">Target: {data.target}%</span>
        <span className="text-purple-400">Real: {data.real}%</span>
        <span style={{ color: diffColor }}>({diff > 0 ? '+' : ''}{diff}%)</span>
      </div>
      <p className="text-[9px] text-slate-500 mt-0.5">
        {data.count} persona{data.count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ── Distribution Summary ──
function DistributionSummary({ 
  chartData, total 
}: { 
  chartData: { score: number; label: string; target: number; real: number; count: number }[]
  total: number
}) {
  let maxDev = { label: '', diff: 0, direction: '' }
  for (const d of chartData) {
    const diff = Math.abs(d.real - d.target)
    if (diff > Math.abs(maxDev.diff)) {
      maxDev = { label: d.label, diff: d.real - d.target, direction: d.real > d.target ? 'excedido' : 'bajo' }
    }
  }

  const isHealthy = chartData.every(d => Math.abs(d.real - d.target) <= 8)

  if (isHealthy) {
    return <p className="text-[10px] text-emerald-400/80">✓ Distribución alineada con el estándar industria</p>
  }

  return (
    <p className="text-[10px] text-amber-400/80">
      ⚡ {maxDev.label} {maxDev.direction} por {Math.abs(maxDev.diff)}% vs target
    </p>
  )
}
```

### Integración en page.tsx

```tsx
// Import
import DistributionGauge from '@/components/performance/DistributionGauge'

// Calcular scores (ADAPTADO a server-side: usar los ratings de la página actual)
// NOTA: Para distribución precisa, los scores deberían venir del backend
// Pero como workaround, usar los ratings visibles en la lista actual
const assignedPotentialScores = ratings
  .filter(r => r.potentialScore != null)
  .map(r => r.potentialScore as number)

// Agregar en el PROGRESS CARD, como columna derecha:
<div className="lg:w-[280px] lg:border-l lg:border-slate-700/30 lg:pl-4">
  <DistributionGauge assignedScores={assignedPotentialScores} />
</div>
```

### Verificación Task 11B-ADD

```yaml
□ Componente DistributionGauge.tsx creado
□ Importado en page.tsx
□ Gráfico muestra 2 curvas (target dashed cyan, real solid purple)
□ Tooltip muestra Target%, Real%, diferencia
□ Resumen "✓ Alineada" o "⚡ Excedido/Bajo por X%"
□ Se actualiza al asignar potencial (re-fetch actualiza ratings)
□ No aparece con < 3 asignaciones
□ npx tsc --noEmit sin errores
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
FASE 1 — Nine-Box Grid (20 min)
  1. Modificar NineBoxCellProps → agregar employees
  2. Reescribir NineBoxCell → nombres con avatares
  3. Pasar employees en el render del grid
  4. Verificar compilación

FASE 2 — Task 11B Bugs (15 min)
  5. BUG 1: Conectar textarea (value + onChange + onBlur)
  6. BUG 2: Enviar notes con potentialScore
  7. MEJORA 7: Indicador guardado notas

FASE 3 — Task 11B Mejoras UX (15 min)
  8. MEJORA 2: Toast "Guardado" al asignar potencial
  9. MEJORA 6: Score con label clasificación
  10. MEJORA 5: Banner pendientes (usando stats backend)

FASE 4 — Gauss Distribution (15 min)
  11. Crear DistributionGauge.tsx
  12. Integrar en page.tsx
  13. Verificar actualización en vivo
```

**Tiempo estimado total: ~65 minutos**

---

## ARCHIVOS TOTALES

```yaml
CREAR:
  - src/components/performance/DistributionGauge.tsx

MODIFICAR:
  - src/components/performance/NineBoxGrid.tsx         # UX con nombres
  - src/components/performance/RatingRow.tsx            # Bugs + mejoras
  - src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx  # Banner + gauge

NO TOCAR:
  - src/lib/services/PerformanceRatingService.ts        # Backend OK
  - src/app/api/performance-ratings/*                   # APIs OK
  - src/components/performance/NineBoxDrawer.tsx         # Drawer OK
  - prisma/schema.prisma                                # No cambios
```

---

## REGLAS INQUEBRANTABLES

```yaml
NO HACER:
  ❌ No instalar librerías nuevas
  ❌ No modificar APIs backend (ya tienen server-side filtering)
  ❌ No modificar schema Prisma
  ❌ No recrear componentes desde cero
  ❌ No reintroducir limit=500 ni filtrado client-side
  ❌ No hardcodear clasificaciones
  ❌ No cambiar URLs de fetch (son correctas post-TASK10)

SÍ HACER:
  ✅ Usar clases CSS existentes (.fhr-* y Tailwind)
  ✅ Usar framer-motion (ya importado)
  ✅ Usar lucide-react (ya importado)
  ✅ Usar Recharts (ya instalado) para Gauss
  ✅ Respetar patrón memo()
  ✅ Mantener TypeScript strict
  ✅ Respetar design system FocalizaHR (cyan #22D3EE, purple #A78BFA)
  ✅ Mantener arquitectura server-side filtering del refactor
```

---

## VERIFICACIÓN FINAL CONSOLIDADA

```yaml
NINE-BOX:
  □ Celdas muestran nombres de empleados con avatares
  □ Subtítulos descriptivos en cada celda
  □ Badge contador arriba-derecha
  □ "+N más" para celdas con muchos empleados
  □ Click abre Drawer con lista completa

TASK 11B:
  □ Textarea conectado (value + onChange + onBlur)
  □ Notes se envían junto con potentialScore
  □ Toast "Guardado" al asignar potencial
  □ Indicador guardado debajo de textarea
  □ Score muestra label clasificación
  □ Banner pendientes con stats del backend

GAUSS:
  □ DistributionGauge.tsx creado con Recharts
  □ Integrado en PROGRESS CARD
  □ 2 curvas superpuestas (target + real)
  □ Actualización en vivo

GENERAL:
  □ npx tsc --noEmit sin errores
  □ npm run dev compila correctamente
  □ Sin regresiones en funcionalidad existente
  □ Server-side filtering intacto
```

---

*Task consolidado v1.0 — Febrero 2026*
*Prompt: "Implementa TASK CONSOLIDADO según el documento. Fase 1: Nine-Box Grid UX. Fase 2: Bugs 11B. Fase 3: Mejoras 11B. Fase 4: Gauss."*
