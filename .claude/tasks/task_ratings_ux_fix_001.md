# 🎯 TASK: Ratings Page UX Fix - Cinema Level Apple/Tesla

## 📋 METADATA
- **Archivo**: `task_ratings_ux_fix_001.md`
- **Fecha**: Febrero 2026
- **Prioridad**: Alta
- **Tiempo estimado**: 60-90 min
- **Archivos objetivo**: 
  - `src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`
  - `src/components/performance/DistributionModal.tsx` (NUEVO)

---

## 🎯 OBJETIVO

Transformar la página de asignación de potencial aplicando la **FILOSOFÍA CINEMA FocalizaHR**:
- Layout 50/50: Progress Ring + Gauge Preview (ambos importantes)
- Gauge clickable → Modal con detalle completo (Progressive Disclosure REAL)
- Eliminar ruido visual (banner 191 pendientes)
- Mobile-First responsive
- Premium Buttons para Ver 9-Box

### 🧠 JUSTIFICACIÓN DEL GAUGE COMO ELEMENTO CRÍTICO
```yaml
El Gauge NO es "contexto que susurra" - Es información CRÍTICA:
  
  SIN GAUGE VISIBLE:
    Usuario asigna → va a 9-Box → "¿Por qué todos están arriba-derecha?"
    
  CON GAUGE VISIBLE + DETALLE:
    Usuario ve ⚡ +23% excepcional → "Debo ser más crítico" → 9-Box balanceado
    
  CONCLUSIÓN:
    El Gauge guía la CALIDAD de las asignaciones ANTES de ir a 9-Box
```

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. Violación del Mandamiento #1: "Jerarquía Absoluta"
```
ACTUAL: 7 números compitiendo por atención
- 9 evaluados
- 4 asignados  
- 5 pendientes
- 44% completado
- 200 total
- 191 pendientes evaluación
- 5% evaluados

PROBLEMA: "El ojo tiene UN camino. No dos. No tres. UNO."
```

### 2. Ambigüedad semántica: "Pendientes" significa DOS cosas
```
En stats:  5 pendientes = evaluados SIN potencial asignado ✅ (relevante)
En banner: 191 pendientes = SIN evaluar aún ❌ (irrelevante aquí)
```

### 3. Banner Amber = Ruido
```
Los 191 sin evaluar NO son problema de ESTA pantalla.
El usuario viene a asignar potencial a los que YA fueron evaluados.
Es como si Waze dijera "hay tráfico en Valparaíso" cuando manejas en Santiago.
```

### 4. Botón Ver 9-Box no usa Premium Buttons
```tsx
// ACTUAL - Clases básicas
<Link className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium...">

// DESEADO - Premium Button
<SecondaryButton icon={Grid3X3} size="md">Ver 9-Box</SecondaryButton>
```

### 5. Stats y Gauge separados visualmente
```
ACTUAL: Stats a la izquierda, Gauge aplastado a la derecha
DESEADO: UN card unificado con Progress Ring protagonista (60%) + Gauge contexto (40%)
```

---

## ✅ SOLUCIÓN PROPUESTA - DISEÑO CINEMA

### LAYOUT NUEVO (Desktop) - 50/50
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ←  Asignar Potencial                              [Ver 9-Box] btn   ┃
┃      CICLO Q1 2025                                  (SecondaryButton)┃
┃                                                                       ┃
┃  ┌────────────────────────────────────────────────────────────────┐  ┃
┃  │          PROGRESS CARD UNIFICADO (fhr-card)                    │  ┃
┃  │  ┌─────────────── 50% ──────────────┬────── 50% ─────────┐    │  ┃
┃  │  │      ╭──────────────╮            │                     │    │  ┃
┃  │  │      │              │            │  DISTRIBUCIÓN       │    │  ┃
┃  │  │      │     44%      │ ← RING     │  POTENCIAL          │    │  ┃
┃  │  │      │              │            │                     │    │  ┃
┃  │  │      ╰──────────────╯            │  [Gauge Preview]    │    │  ┃
┃  │  │                                  │                     │    │  ┃
┃  │  │  4 asignados · 5 pendientes      │  ⚡ Excepcional +23%│    │  ┃
┃  │  │  de 9 evaluados                  │                     │    │  ┃
┃  │  │                                  │  👆 Click detalle   │    │  ┃
┃  │  └──────────────────────────────────┴─────────────────────┘    │  ┃
┃  └────────────────────────────────────────────────────────────────┘  ┃
┃                                                                       ┃
┃  🔍 Buscar empleado...              Pendientes 5 · Asignados 4 · ∀ 9 ┃
┃                                                                       ┃
┃  ┌────────────────────────────────────────────────────────────────┐  ┃
┃  │  [Lista de empleados evaluados - RatingRow components]         │  ┃
┃  └────────────────────────────────────────────────────────────────┘  ┃
┃                                                                       ┃
┃  ℹ️ 191 colaboradores aún sin evaluación de desempeño (footnote)     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### MODAL DE DISTRIBUCIÓN (Al click en Gauge)
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                              ✕      │
│           DISTRIBUCIÓN DE POTENCIAL                                 │
│           ─────────────────────────                                 │
│                                                                     │
│    ┌─────────────────────────────────────────────────────────┐     │
│    │                                                         │     │
│    │              [GAUGE GRANDE - 400px width]               │     │
│    │                                                         │     │
│    │         --- Target (curva ideal punteada)               │     │
│    │         ─── Real (curva sólida cyan/purple)             │     │
│    │                                                         │     │
│    └─────────────────────────────────────────────────────────┘     │
│                                                                     │
│    ┌──────────┬──────────┬──────────┬──────────┬──────────┐        │
│    │ Bajo     │ Moderado │ Adecuado │ Alto     │ Excep.   │        │
│    │ 0 (0%)   │ 1 (25%)  │ 2 (50%)  │ 1 (25%)  │ 0 (0%)   │        │
│    │ Target:1 │ Target:1 │ Target:1 │ Target:1 │ Target:0 │        │
│    │ ✓        │ ✓        │ +1 ⚠️    │ ✓        │ ✓        │        │
│    └──────────┴──────────┴──────────┴──────────┴──────────┘        │
│                                                                     │
│    💡 INSIGHT                                                       │
│    ───────────                                                      │
│    "Tienes 1 persona más en 'Adecuado' que el target.              │
│     Considera si alguno debería ser 'Alto' antes de ir a 9-Box"    │
│                                                                     │
│                        [Entendido]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### LAYOUT NUEVO (Mobile - Stack Vertical)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ← Asignar Potencial            ┃
┃    CICLO Q1 2025                ┃
┃                                 ┃
┃  [Ver 9-Box] btn fullWidth      ┃
┃                                 ┃
┃  ┌───────────────────────────┐  ┃
┃  │      ╭──────────╮         │  ┃
┃  │      │   44%    │ RING    │  ┃
┃  │      ╰──────────╯         │  ┃
┃  │  4 asignados · 5 pendientes│  ┃
┃  │  de 9 evaluados           │  ┃
┃  ├───────────────────────────┤  ┃
┃  │  DISTRIBUCIÓN POTENCIAL   │  ┃
┃  │  [Gauge Preview - full]   │  ┃
┃  │  ⚡ Excepcional +23%      │  ┃
┃  │  👆 Toca para detalle     │  ┃
┃  └───────────────────────────┘  ┃
┃                                 ┃
┃  🔍 Buscar...                   ┃
┃  [Tabs: Pendientes|Asignados|∀]┃
┃                                 ┃
┃  [Lista empleados]              ┃
┃                                 ┃
┃  ℹ️ 191 sin evaluación (foot)   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

MODAL EN MOBILE: Fullscreen con scroll
```

---

## 📁 CAMBIOS ESPECÍFICOS

### CAMBIO 1: Título con gradiente cyan/purple (no amber)
```tsx
// ANTES
<h1 className="text-2xl font-light text-white">
  Asignar <span className="font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Potencial</span>
</h1>

// DESPUÉS
<h1 className="text-2xl font-light text-white">
  Asignar <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Potencial</span>
</h1>
```

### CAMBIO 2: Botón Ver 9-Box → SecondaryButton Premium
```tsx
// ANTES
<Link
  href={`/dashboard/performance/nine-box?cycleId=${cycleId}`}
  className={cn(
    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
    assignedCount > 0
      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white...'
      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed...'
  )}
>
  <Grid3X3 className="w-4 h-4" />
  Ver 9-Box
</Link>

// DESPUÉS - Importar SecondaryButton
import { SecondaryButton } from '@/components/ui/PremiumButton'

// En el JSX
<Link href={`/dashboard/performance/nine-box?cycleId=${cycleId}`}>
  <SecondaryButton 
    icon={Grid3X3}
    size="md"
    disabled={assignedCount === 0}
  >
    Ver 9-Box
  </SecondaryButton>
</Link>
```

### CAMBIO 3: ELIMINAR Banner Amber de 191 pendientes
```tsx
// ELIMINAR COMPLETAMENTE este bloque:
{notEvaluatedCount > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.12 }}
    className="relative overflow-hidden rounded-xl border border-amber-500/30..."
  >
    {/* ... todo el banner amber ... */}
  </motion.div>
)}

// OPCIONAL: Si se desea mencionar, agregar footnote sutil al final de la página:
{notEvaluatedCount > 0 && (
  <p className="text-xs text-slate-500 text-center mt-4">
    ℹ️ {notEvaluatedCount} colaboradores aún sin evaluación de desempeño
  </p>
)}
```

### CAMBIO 4: Progress Card Unificado con Progress Ring
```tsx
// NUEVO COMPONENTE: ProgressRing (o usar SVG directo)
// Crear en el mismo archivo o importar

interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
}

function ProgressRing({ percent, size = 120, strokeWidth = 8 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgb(51, 65, 85)"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {percent}%
        </span>
        <span className="text-xs text-slate-500">completado</span>
      </div>
    </div>
  )
}
```

### CAMBIO 5: Progress Card Layout 50/50 + Gauge Clickable
```tsx
// Estado para modal
const [showDistributionModal, setShowDistributionModal] = useState(false)

{/* PROGRESS CARD UNIFICADO - 50/50 */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
  className="relative p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 overflow-hidden"
>
  {/* Tesla line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
    {/* IZQUIERDA: Progress Ring (50%) */}
    <div className="flex-1 flex flex-col items-center lg:items-start">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing percent={progressPercent} size={140} strokeWidth={10} />
        
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-400">
            <span className="text-white font-semibold">{assignedCount}</span> asignados
            {' · '}
            <span className="text-amber-400 font-semibold">{pendingCount}</span> pendientes
          </p>
          <p className="text-xs text-slate-500 mt-1">
            de {evaluatedCount} evaluados
          </p>
        </div>
      </div>
    </div>

    {/* Divider */}
    <div className="hidden lg:block w-px h-32 bg-slate-700/50" />

    {/* DERECHA: Distribution Gauge Clickable (50%) */}
    <div 
      className="flex-1 cursor-pointer group"
      onClick={() => setShowDistributionModal(true)}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          Distribución Potencial
        </p>
        <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
          👆 Ver detalle
        </span>
      </div>
      
      {/* Gauge Preview con hover effect */}
      <div className="p-3 rounded-xl bg-slate-900/50 group-hover:bg-slate-800/50 
                      border border-transparent group-hover:border-cyan-500/30 transition-all">
        <DistributionGauge assignedScores={assignedPotentialScores} compact />
      </div>
      
      {/* Hint mobile */}
      <p className="text-xs text-slate-500 mt-2 text-center lg:hidden">
        Toca para ver detalle
      </p>
    </div>
  </div>
</motion.div>

{/* MODAL DE DISTRIBUCIÓN */}
<DistributionModal
  isOpen={showDistributionModal}
  onClose={() => setShowDistributionModal(false)}
  assignedScores={assignedPotentialScores}
  totalEvaluated={evaluatedCount}
/>
```

### CAMBIO 6: NUEVO COMPONENTE - DistributionModal.tsx
```tsx
// src/components/performance/DistributionModal.tsx
'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, TrendingUp, TrendingDown, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import DistributionGauge from './DistributionGauge'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface DistributionModalProps {
  isOpen: boolean
  onClose: () => void
  assignedScores: number[]
  totalEvaluated: number
}

// Target distribution (curva normal ideal)
const TARGET_DISTRIBUTION = [
  { level: 'Bajo', target: 10, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { level: 'Moderado', target: 20, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { level: 'Adecuado', target: 40, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { level: 'Alto', target: 20, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { level: 'Excepcional', target: 10, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
]

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function calculateDistribution(scores: number[]) {
  const distribution = [0, 0, 0, 0, 0] // Bajo, Moderado, Adecuado, Alto, Excepcional
  
  scores.forEach(score => {
    if (score <= 1) distribution[0]++
    else if (score <= 2) distribution[1]++
    else if (score <= 3) distribution[2]++
    else if (score <= 4) distribution[3]++
    else distribution[4]++
  })
  
  return distribution
}

function generateInsight(realDistribution: number[], total: number): { text: string; type: 'success' | 'warning' | 'info' } {
  if (total === 0) {
    return { text: 'Aún no hay asignaciones de potencial.', type: 'info' }
  }

  const realPercents = realDistribution.map(count => Math.round((count / total) * 100))
  
  // Detectar desviaciones significativas (>15%)
  const deviations: string[] = []
  
  TARGET_DISTRIBUTION.forEach((target, i) => {
    const diff = realPercents[i] - target.target
    if (diff > 15) {
      deviations.push(`+${diff}% en ${target.level}`)
    } else if (diff < -15) {
      deviations.push(`${diff}% en ${target.level}`)
    }
  })

  if (deviations.length === 0) {
    return { 
      text: 'La distribución está balanceada según la curva ideal. Buen trabajo.', 
      type: 'success' 
    }
  }

  // Detectar sesgo hacia arriba o abajo
  const highEnd = realPercents[3] + realPercents[4] // Alto + Excepcional
  const lowEnd = realPercents[0] + realPercents[1] // Bajo + Moderado
  
  if (highEnd > 50) {
    return {
      text: `Tendencia hacia valoraciones altas (${highEnd}% en Alto/Excepcional). Considera ser más crítico para que la Matriz 9-Box sea útil.`,
      type: 'warning'
    }
  }
  
  if (lowEnd > 50) {
    return {
      text: `Tendencia hacia valoraciones bajas (${lowEnd}% en Bajo/Moderado). ¿Estás siendo demasiado estricto?`,
      type: 'warning'
    }
  }

  return {
    text: `Desviaciones detectadas: ${deviations.join(', ')}. Revisa antes de ir a 9-Box.`,
    type: 'warning'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default memo(function DistributionModal({
  isOpen,
  onClose,
  assignedScores,
  totalEvaluated
}: DistributionModalProps) {
  const realDistribution = calculateDistribution(assignedScores)
  const totalAssigned = assignedScores.length
  const insight = generateInsight(realDistribution, totalAssigned)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl",
              // Desktop: centered modal
              "hidden lg:block lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
              "lg:w-[600px] lg:max-h-[80vh] lg:rounded-2xl",
              // Mobile: fullscreen
              "max-lg:inset-0 max-lg:w-full max-lg:h-full max-lg:rounded-none"
            )}
          >
            {/* Tesla line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-t-2xl" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Distribución de <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Potencial</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {totalAssigned} de {totalEvaluated} asignados
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-180px)] lg:max-h-none">
              {/* Gauge Grande */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <DistributionGauge assignedScores={assignedScores} large />
                <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-0.5 border-t-2 border-dashed border-slate-500" />
                    Target ideal
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400" />
                    Real
                  </span>
                </div>
              </div>

              {/* Tabla de distribución */}
              <div className="grid grid-cols-5 gap-2">
                {TARGET_DISTRIBUTION.map((item, i) => {
                  const realCount = realDistribution[i]
                  const realPercent = totalAssigned > 0 ? Math.round((realCount / totalAssigned) * 100) : 0
                  const diff = realPercent - item.target
                  const isOver = diff > 10
                  const isUnder = diff < -10
                  const isOk = !isOver && !isUnder

                  return (
                    <div
                      key={item.level}
                      className={cn(
                        "p-3 rounded-lg text-center border",
                        item.bgColor,
                        isOver && "border-amber-500/50",
                        isUnder && "border-blue-500/50",
                        isOk && "border-transparent"
                      )}
                    >
                      <p className={cn("text-xs font-medium", item.color)}>
                        {item.level}
                      </p>
                      <p className="text-lg font-bold text-white mt-1">
                        {realCount}
                      </p>
                      <p className="text-xs text-slate-400">
                        {realPercent}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Target: {item.target}%
                      </p>
                      <div className="mt-2">
                        {isOk && <Check className="w-4 h-4 text-emerald-400 mx-auto" />}
                        {isOver && (
                          <div className="flex items-center justify-center gap-1 text-amber-400">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">+{diff}%</span>
                          </div>
                        )}
                        {isUnder && (
                          <div className="flex items-center justify-center gap-1 text-blue-400">
                            <TrendingDown className="w-3 h-3" />
                            <span className="text-xs">{diff}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Insight */}
              <div className={cn(
                "p-4 rounded-xl border",
                insight.type === 'success' && "bg-emerald-500/10 border-emerald-500/30",
                insight.type === 'warning' && "bg-amber-500/10 border-amber-500/30",
                insight.type === 'info' && "bg-slate-500/10 border-slate-500/30"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    insight.type === 'success' && "bg-emerald-500/20",
                    insight.type === 'warning' && "bg-amber-500/20",
                    insight.type === 'info' && "bg-slate-500/20"
                  )}>
                    {insight.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
                    {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {insight.type === 'info' && <Lightbulb className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      insight.type === 'success' && "text-emerald-300",
                      insight.type === 'warning' && "text-amber-300",
                      insight.type === 'info' && "text-slate-300"
                    )}>
                      💡 Insight
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      {insight.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-700/50">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 
                           text-white font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
              >
                Entendido
              </button>
            </div>
          </motion.div>

          {/* Mobile version */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-slate-900 lg:hidden overflow-y-auto"
          >
            {/* Same content but fullscreen for mobile */}
            {/* ... (repetir el contenido con ajustes mobile) */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
```

### CAMBIO 7: Actualizar DistributionGauge para soportar props `compact` y `large`
```tsx
// En src/components/performance/DistributionGauge.tsx
// Agregar props para diferentes tamaños:

interface DistributionGaugeProps {
  assignedScores: number[]
  compact?: boolean  // Para preview en el card
  large?: boolean    // Para el modal
}

// Ajustar tamaños según prop:
// compact: height ~80px, sin labels detallados
// large: height ~200px, con labels y leyenda completa
// default: height ~120px (actual)
```

### CAMBIO 6: Filtros - Eliminar "Todos 200"
```tsx
// ANTES: Tab 'all' mostraba totalRatings (200)
// DESPUÉS: Tab 'all' muestra evaluatedCount (9)

// En los tabs, cambiar las labels:
const filterTabs = [
  { key: 'pending', label: `Pendientes ${pendingCount}` },
  { key: 'assigned', label: `Asignados ${assignedCount}` },
  { key: 'evaluated', label: `Todos ${evaluatedCount}` }, // ← Cambiar de 'all' a 'evaluated' como default
]

// Eliminar tab 'all' que mostraba 200
```

---

## 🧪 VALIDACIÓN

### Checklist Pre-Entrega
- [ ] Título usa gradiente cyan/purple (no amber)
- [ ] Botón Ver 9-Box es SecondaryButton de Premium Buttons
- [ ] Banner amber de 191 pendientes ELIMINADO (solo footnote sutil)
- [ ] Progress Ring y Gauge tienen espacio 50/50
- [ ] Gauge es clickable con hover effect visible
- [ ] DistributionModal.tsx creado y funcional
- [ ] Modal muestra:
  - [ ] Gauge grande (400px aprox)
  - [ ] Tabla distribución con target vs real
  - [ ] Insight automático según desviaciones
- [ ] Layout es responsive (stack vertical en mobile)
- [ ] Modal es fullscreen en mobile
- [ ] No hay scroll horizontal en mobile
- [ ] Touch targets mínimo 44x44px
- [ ] TypeScript compila sin errores

### Test Visual
```bash
# Verificar en:
- Chrome DevTools: 375px (iPhone SE) - Modal fullscreen
- Chrome DevTools: 768px (iPad) - Modal centrado
- Chrome DevTools: 1280px (Desktop) - Modal centrado 600px
```

### Test Funcional
```bash
# Verificar:
1. Click en Gauge → Modal abre
2. Click en backdrop → Modal cierra
3. Click en "Entendido" → Modal cierra
4. Escape key → Modal cierra
5. Insight cambia según distribución de scores
```

---

## 📚 REFERENCIAS

1. **Filosofía de Diseño**: `FILOSOFIA_DISENO_FOCALIZAHR_v1.md`
2. **Guía de Estilos**: `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md`
3. **Premium Buttons**: `FocalizaHR_Premium_Buttons_Guide.md`
4. **Componente existente**: `src/components/ui/PremiumButton.tsx`

---

## 🚀 PROMPT PARA EJECUTAR

```
Lee y ejecuta .claude/task/task_ratings_ux_fix_001.md

OBJETIVOS:
1. Aplicar diseño Cinema nivel Apple/Tesla a ratings page
2. Layout 50/50: Progress Ring + Gauge Preview (ambos importantes)
3. Gauge clickable → DistributionModal con detalle completo
4. Eliminar banner amber irrelevante (solo footnote)
5. Convertir botón 9-Box a SecondaryButton Premium
6. Mobile-First responsive (Modal fullscreen en mobile)

ARCHIVOS A CREAR/MODIFICAR:
- MODIFICAR: src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
- CREAR: src/components/performance/DistributionModal.tsx
- MODIFICAR: src/components/performance/DistributionGauge.tsx (agregar props compact/large)

REFERENCIAS OBLIGATORIAS:
- .claude/task/focalizahr-ui-design-standards.md
- FILOSOFIA_DISENO_FOCALIZAHR_v1.md
- GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md  
- FocalizaHR_Premium_Buttons_Guide.md
```
