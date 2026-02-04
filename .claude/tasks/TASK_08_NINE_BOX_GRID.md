# TASK 08: NINE BOX GRID - COMPONENTE VISUAL

## 🎯 OBJETIVO
Crear componente de matriz 9-Box con estética **Cinema FocalizaHR** y **Glassmorphism Grid**.

## 🚫 ANTI-PATRONES (PROHIBIDO)

```typescript
// ❌ NUNCA usar tabla HTML
<table><tr><td>...</td></tr></table>

// ❌ NUNCA usar grid rígido con bordes sólidos
<div className="border-2 border-white">

// ❌ NUNCA recargar página al hacer clic
router.push(`/nine-box/${position}`)

// ❌ NUNCA mostrar todo junto sin jerarquía
```

## ✅ PATRONES OBLIGATORIOS

```typescript
// ✅ Glassmorphism Grid
<div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50">

// ✅ Cinema Focus (clic oscurece el resto)
{selectedCell && <div className="fixed inset-0 bg-black/60 z-40" />}

// ✅ Drawer lateral (no modal sobre modal)
<aside className="fixed right-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl">

// ✅ Progressive Disclosure
<details><summary>Ver empleados</summary>...</details>
```

## 📁 ARCHIVO A CREAR
```
src/components/performance/NineBoxGrid.tsx
```

## ⚠️ DEPENDENCIAS
- TASK_02 completada (`NINE_BOX_POSITIONS` config)
- TASK_06 completada (`NineBoxBadge` existe)
- TASK_07 completada (API `/nine-box` existe)

## 📋 INSTRUCCIONES

### PASO 1: Crear componente NineBoxGrid con Cinema Focus

**Crear:** `src/components/performance/NineBoxGrid.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// NINE BOX GRID - Matriz 3x3 Cinema FocalizaHR
// src/components/performance/NineBoxGrid.tsx
// ════════════════════════════════════════════════════════════════════════════
// FILOSOFÍA: Cinema Focus + Glassmorphism + Progressive Disclosure
// ANTI-PATRÓN: NO usar <table>, NO modales sobre modales, NO recargas
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  NINE_BOX_POSITIONS,
  NineBoxPosition,
  getNineBoxPositionConfig
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface Employee9Box {
  id: string
  employeeId: string
  employeeName: string
  employeePosition?: string
  department?: string
  calculatedScore: number
  finalScore?: number | null
  potentialScore?: number | null
  potentialLevel?: string | null
}

interface GridCell {
  position: NineBoxPosition
  employees: Employee9Box[]
  count: number
  percent: number
}

interface NineBoxGridProps {
  data: GridCell[]
  onCellSelect?: (position: NineBoxPosition, employees: Employee9Box[]) => void
  onEmployeeClick?: (employee: Employee9Box) => void
  className?: string
}

// ════════════════════════════════════════════════════════════════════════════
// ORDEN VISUAL DE LA MATRIZ (NO usar tabla, usar CSS Grid)
// ════════════════════════════════════════════════════════════════════════════
// 
//                    PERFORMANCE →
//           |   Low    |  Medium  |   High   |
//     High  | 💎 Gem   | 🚀 Growth | ⭐ Star  |  ↑
//  P Medium | 📊 Incon | 🎯 Core  | 📈 HiPerf|  POTENTIAL
//     Low   | ⚠️ Under | ➡️ Avg   | 🏆 Trust |  ↓
//
const GRID_ORDER: NineBoxPosition[][] = [
  [NineBoxPosition.POTENTIAL_GEM, NineBoxPosition.GROWTH_POTENTIAL, NineBoxPosition.STAR],
  [NineBoxPosition.INCONSISTENT, NineBoxPosition.CORE_PLAYER, NineBoxPosition.HIGH_PERFORMER],
  [NineBoxPosition.UNDERPERFORMER, NineBoxPosition.AVERAGE_PERFORMER, NineBoxPosition.TRUSTED_PROFESSIONAL]
]

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function NineBoxGrid({
  data,
  onCellSelect,
  onEmployeeClick,
  className
}: NineBoxGridProps) {
  // Estado para Cinema Focus
  const [selectedPosition, setSelectedPosition] = useState<NineBoxPosition | null>(null)
  
  // Lookup de data por posición
  const dataByPosition = useMemo(() => {
    const lookup = new Map<NineBoxPosition, GridCell>()
    for (const cell of data) {
      lookup.set(cell.position, cell)
    }
    return lookup
  }, [data])

  // Total para calcular %
  const totalEmployees = useMemo(() => 
    data.reduce((sum, cell) => sum + cell.count, 0),
    [data]
  )

  // Handler de clic en celda
  const handleCellClick = (position: NineBoxPosition) => {
    const cell = dataByPosition.get(position)
    setSelectedPosition(position)
    onCellSelect?.(position, cell?.employees || [])
  }

  // Cerrar Cinema Focus
  const handleCloseFocus = () => {
    setSelectedPosition(null)
  }

  return (
    <div className={cn('relative', className)}>
      
      {/* ════════════════════════════════════════════════════════════════════
          CINEMA BACKDROP - Se activa al seleccionar una celda
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleCloseFocus}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════
          LABELS DE EJES (fuera del grid)
          ════════════════════════════════════════════════════════════════════ */}
      
      {/* Label eje Y (Potential) - Vertical izquierdo */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
        <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
          Potencial →
        </span>
      </div>

      {/* Label eje X (Performance) - Horizontal inferior */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
        <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
          Desempeño →
        </span>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          GLASSMORPHISM GRID - NO tabla HTML, solo CSS Grid
          ════════════════════════════════════════════════════════════════════ */}
      <div 
        className={cn(
          'grid grid-cols-3 gap-2 p-4',
          'bg-slate-900/30 backdrop-blur-xl rounded-2xl',
          'border border-slate-700/30'
        )}
      >
        {GRID_ORDER.flat().map((position, index) => {
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
              onClick={() => handleCellClick(position)}
            />
          )
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER CON LEYENDA
          ════════════════════════════════════════════════════════════════════ */}
      <div className="mt-4 flex items-center justify-center gap-6 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
          Estrellas: {dataByPosition.get(NineBoxPosition.STAR)?.count || 0}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
          Core: {dataByPosition.get(NineBoxPosition.CORE_PLAYER)?.count || 0}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/50" />
          Atención: {dataByPosition.get(NineBoxPosition.UNDERPERFORMER)?.count || 0}
        </span>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CELDA INDIVIDUAL - Glassmorphism + Cinema Focus
// ════════════════════════════════════════════════════════════════════════════

interface NineBoxCellProps {
  position: NineBoxPosition
  config: ReturnType<typeof getNineBoxPositionConfig>
  count: number
  percent: number
  isSelected: boolean
  isFaded: boolean
  hasEmployees: boolean
  onClick: () => void
}

const NineBoxCell = memo(function NineBoxCell({
  position,
  config,
  count,
  percent,
  isSelected,
  isFaded,
  hasEmployees,
  onClick
}: NineBoxCellProps) {
  
  return (
    <motion.button
      onClick={onClick}
      disabled={!hasEmployees}
      className={cn(
        // Base: Glassmorphism
        'relative min-h-[120px] p-3 rounded-xl transition-all duration-300',
        'bg-slate-800/40 backdrop-blur-md',
        'border border-slate-700/40',
        
        // Hover (solo si tiene empleados)
        hasEmployees && 'hover:bg-slate-800/60 hover:border-slate-600/60 hover:scale-[1.02] cursor-pointer',
        
        // Sin empleados: más opaco
        !hasEmployees && 'opacity-40 cursor-not-allowed',
        
        // Cinema Focus: faded cuando otra celda está seleccionada
        isFaded && 'opacity-20 scale-95',
        
        // Seleccionada: destacada con glow
        isSelected && 'z-50 scale-105 border-white/30 shadow-2xl shadow-cyan-500/20'
      )}
      style={{
        // Línea Tesla superior dinámica
        borderTopColor: hasEmployees ? `${config.color}40` : undefined
      }}
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

      {/* Contenido */}
      <div className="flex flex-col items-center justify-center h-full gap-2">
        {/* Emoji + Label corto */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{config.labelShort}</span>
        </div>

        {/* Nombre de la posición */}
        <span 
          className="text-[11px] font-medium text-center leading-tight"
          style={{ color: hasEmployees ? config.color : '#64748b' }}
        >
          {config.label}
        </span>

        {/* Contador */}
        <div className={cn(
          'px-2.5 py-1 rounded-full text-xs font-bold',
          hasEmployees 
            ? 'bg-slate-700/60 text-slate-200' 
            : 'bg-slate-800/40 text-slate-600'
        )}>
          {count}
        </div>

        {/* Porcentaje (solo si hay empleados) */}
        {hasEmployees && percent > 0 && (
          <span className="text-[9px] text-slate-500">
            {percent}%
          </span>
        )}
      </div>
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export { NineBoxGrid }
export type { Employee9Box, GridCell, NineBoxGridProps }
```

### PASO 2: Actualizar exports

**Actualizar:** `src/components/performance/index.ts`

```typescript
// Performance Components Exports
export { default as PerformanceBadge } from './PerformanceBadge'
export { default as PerformanceScoreDisplay } from './PerformanceScoreDisplay'
export { default as NineBoxBadge } from './NineBoxBadge'
export { default as NineBoxGrid } from './NineBoxGrid'
export type { Employee9Box, GridCell, NineBoxGridProps } from './NineBoxGrid'
```

## ✅ CHECKLIST DE VALIDACIÓN

```bash
# Verificar que compila
npx tsc src/components/performance/NineBoxGrid.tsx --noEmit
```

### Checklist Filosofía FocalizaHR:

- [ ] ❌ NO usa `<table>` HTML
- [ ] ✅ Usa CSS Grid con `grid-cols-3`
- [ ] ✅ Glassmorphism: `bg-slate-900/30 backdrop-blur-xl`
- [ ] ✅ Cinema Focus: backdrop oscurece al seleccionar
- [ ] ✅ Línea Tesla dinámica por celda
- [ ] ✅ Animaciones Framer Motion suaves (<300ms)
- [ ] ✅ Progressive Disclosure: contador visible, % secundario
- [ ] ✅ Jerarquía clara: emoji → label → número

## ➡️ SIGUIENTE TAREA
`TASK_09_NINE_BOX_DASHBOARD.md`
