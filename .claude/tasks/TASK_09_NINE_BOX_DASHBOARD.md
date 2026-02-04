# TASK 09: NINE BOX DASHBOARD - VISTA CINEMA

## 🎯 OBJETIVO
Crear página completa del 9-Box siguiendo **Patrón Cinema FocalizaHR** nivel `/evaluaciones`.

## 🎨 FILOSOFÍA DE DISEÑO (OBLIGATORIA)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   FOCALIZAHR NO ES UN DASHBOARD.                                           │
│   ES UN ASESOR QUE GUÍA DECISIONES.                                        │
│                                                                             │
│   • Cada pantalla tiene UN propósito                                       │
│   • El usuario ACTÚA, no solo observa                                      │
│   • La profundidad es opcional, la claridad es obligatoria                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚫 ANTI-PATRONES (PROHIBIDO)

```typescript
// ❌ NUNCA: Modal sobre modal
<Modal><Modal>...</Modal></Modal>

// ❌ NUNCA: Reload de página al seleccionar
router.push(`/nine-box/${position}`)

// ❌ NUNCA: Stats cards sin jerarquía (todo igual)
<div className="grid grid-cols-8">

// ❌ NUNCA: Usar <table> HTML para el grid
<table><tr><td>...</td></tr></table>

// ❌ NUNCA: Lista plana sin avatares (no es Cinema)
<div>{employee.name}</div>
```

## ✅ PATRONES OBLIGATORIOS

```typescript
// ✅ DRAWER lateral en lugar de modal
<Drawer side="right" onClose={...}>

// ✅ CINEMA BACKDROP al abrir drawer
<div className="fixed inset-0 bg-black/60" onClick={close}>

// ✅ AVATARES circulares (como SpotlightCard)
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500">

// ✅ MINI-CARDS con iconos (como InsightCard)
<div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40">

// ✅ UN protagonista claro (el Grid)
// Stats cards son SECUNDARIOS

// ✅ Progressive Disclosure
// Detalle solo al hacer clic en celda
```

## 📁 ARCHIVOS A CREAR
```
src/app/(admin)/performance/nine-box/page.tsx
src/components/performance/NineBoxDrawer.tsx
```

## ⚠️ DEPENDENCIAS
- TASK_07 completada (APIs `/nine-box` y `/potential`)
- TASK_08 completada (`NineBoxGrid` con Cinema Focus)
- Pattern: `dashboard/evaluaciones/components/SpotlightCard.tsx` (avatares)
- Pattern: `components/evaluator/cinema/InsightCard.tsx` (mini-cards)

## 📋 INSTRUCCIONES

### PASO 1: Crear Drawer lateral estilo Cinema (CON AVATARES)

**Crear:** `src/components/performance/NineBoxDrawer.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// NINE BOX DRAWER - Panel Lateral Cinema FocalizaHR
// src/components/performance/NineBoxDrawer.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRÓN: Detail + Drawer (FILOSOFIA_DISENO_FOCALIZAHR_v1.md)
// INSPIRADO EN: dashboard/evaluaciones SpotlightCard + InsightCard
// NO: Modales sobre modales
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  X, User, Building2, TrendingUp, Sparkles, 
  ChevronRight, Search, Award, Target, Zap 
} from 'lucide-react'
import {
  NineBoxPosition,
  getNineBoxPositionConfig,
  getPerformanceClassification
} from '@/config/performanceClassification'
import type { Employee9Box } from './NineBoxGrid'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface NineBoxDrawerProps {
  isOpen: boolean
  position: NineBoxPosition | null
  employees: Employee9Box[]
  onClose: () => void
  onEmployeeSelect?: (employee: Employee9Box) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function NineBoxDrawer({
  isOpen,
  position,
  employees,
  onClose,
  onEmployeeSelect
}: NineBoxDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    if (!isOpen) setSearchTerm('')
  }, [isOpen])

  if (!position) return null

  const config = getNineBoxPositionConfig(position)
  
  const filteredEmployees = employees.filter(emp =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* CINEMA BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* DRAWER LATERAL - Glassmorphism */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-[480px]',
              'bg-slate-900/95 backdrop-blur-xl',
              'border-l border-slate-700/50',
              'shadow-2xl shadow-black/50',
              'z-50 flex flex-col'
            )}
          >
            {/* HEADER con Línea Tesla */}
            <div className="relative p-6 border-b border-slate-700/50">
              <div 
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`
                }}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar grande estilo SpotlightCard */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2"
                      style={{ 
                        background: `linear-gradient(135deg, ${config.color}20, ${config.color}10)`,
                        borderColor: `${config.color}40`,
                        color: config.color
                      }}
                    >
                      {config.labelShort}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: config.color }}>
                      {config.label}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {employees.length} {employees.length === 1 ? 'empleado' : 'empleados'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* MINI-CARDS INSIGHT (estilo InsightCard) */}
            <div className="p-4 border-b border-slate-800/50">
              <div className="grid grid-cols-2 gap-3">
                <MiniInsightCard
                  icon={<Award className="w-4 h-4" />}
                  label="Performance Promedio"
                  value={`${(employees.reduce((sum, e) => sum + (e.finalScore ?? e.calculatedScore), 0) / employees.length || 0).toFixed(1)}`}
                  color={config.color}
                />
                <MiniInsightCard
                  icon={<Target className="w-4 h-4" />}
                  label="Potencial Promedio"
                  value={`${(employees.reduce((sum, e) => sum + (e.potentialScore || 0), 0) / employees.length || 0).toFixed(1)}`}
                  color={config.color}
                />
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="p-4 border-b border-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                    'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
                    'text-slate-200 placeholder-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
                  )}
                />
              </div>
            </div>

            {/* LISTA DE EMPLEADOS CON AVATARES */}
            <div className="flex-1 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <EmptyState searchTerm={searchTerm} />
              ) : (
                <div className="p-4 space-y-3">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCardCinema
                      key={employee.id}
                      employee={employee}
                      positionColor={config.color}
                      onClick={() => onEmployeeSelect?.(employee)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MINI INSIGHT CARD (estilo InsightCard de evaluaciones)
// ════════════════════════════════════════════════════════════════════════════

interface MiniInsightCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

const MiniInsightCard = memo(function MiniInsightCard({
  icon,
  label,
  value,
  color
}: MiniInsightCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-slate-700/40">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-base font-semibold text-slate-200">{value}</p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE CARD CINEMA (CON AVATAR estilo SpotlightCard)
// ════════════════════════════════════════════════════════════════════════════

interface EmployeeCardCinemaProps {
  employee: Employee9Box
  positionColor: string
  onClick: () => void
}

const EmployeeCardCinema = memo(function EmployeeCardCinema({
  employee,
  positionColor,
  onClick
}: EmployeeCardCinemaProps) {
  const effectiveScore = employee.finalScore ?? employee.calculatedScore

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full p-4 rounded-xl text-left transition-all',
        'bg-slate-800/40 backdrop-blur-sm border border-slate-700/40',
        'hover:bg-slate-800/60 hover:border-slate-600/60',
        'group'
      )}
    >
      <div className="flex items-center gap-3">
        {/* AVATAR CIRCULAR (estilo SpotlightCard) */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-700">
            {getInitials(employee.employeeName)}
          </div>
          
          {/* Ring de potencial */}
          {employee.potentialScore && employee.potentialScore >= 4 && (
            <div className="absolute inset-[-3px] rounded-full border border-cyan-500/30 animate-pulse" />
          )}
        </div>

        {/* INFO */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-200 truncate group-hover:text-white transition-colors">
            {employee.employeeName}
          </h4>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {employee.employeePosition || 'Sin cargo'}
          </p>
          {employee.department && (
            <p className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {employee.department}
            </p>
          )}
        </div>

        {/* SCORES */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Perf:</span>
            <span className="text-sm font-semibold" style={{ color: positionColor }}>
              {effectiveScore.toFixed(1)}
            </span>
          </div>
          {employee.potentialScore && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Pot:</span>
              <span className="text-sm font-semibold text-cyan-400">
                {employee.potentialScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE PREMIUM
// ════════════════════════════════════════════════════════════════════════════

const EmptyState = memo(function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      {/* Ilustración */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 border border-slate-700/50">
        <User className="w-12 h-12 text-slate-600" />
      </div>

      {/* Mensaje */}
      <h3 className="text-base font-medium text-slate-300 mb-2">
        {searchTerm ? 'No se encontraron empleados' : 'Sin empleados'}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {searchTerm 
          ? 'Intenta con otro término de búsqueda'
          : 'No hay empleados en esta posición del 9-Box'}
      </p>

      {searchTerm && (
        <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-400">
            Buscando: <span className="text-cyan-400 font-medium">{searchTerm}</span>
          </p>
        </div>
      )}
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export { NineBoxDrawer }
```

### PASO 2: Crear página Dashboard Cinema

**Crear:** `src/app/(admin)/performance/nine-box/page.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// NINE BOX PAGE - Dashboard Cinema FocalizaHR
// src/app/(admin)/performance/nine-box/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Users, Star, Target, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

import NineBoxGrid, { type Employee9Box, type GridCell } from '@/components/performance/NineBoxGrid'
import NineBoxDrawer from '@/components/performance/NineBoxDrawer'
import { NineBoxPosition } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Cycle { id: string; name: string; status: string }

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function NineBoxPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [gridData, setGridData] = useState<GridCell[]>([])
  const [totalInGrid, setTotalInGrid] = useState(0)
  
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<NineBoxPosition | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee9Box[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch cycles
  useEffect(() => {
    fetch('/api/admin/performance-cycles')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCycles(json.data || [])
          const completed = json.data?.find((c: Cycle) => c.status === 'COMPLETED')
          if (completed) setSelectedCycleId(completed.id)
        }
      })
  }, [])

  // Fetch 9-box data
  const fetchData = useCallback(async () => {
    if (!selectedCycleId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/performance-ratings/nine-box?cycleId=${selectedCycleId}`)
      const json = await res.json()
      if (json.success) {
        setGridData(json.data.grid)
        setTotalInGrid(json.data.totalInGrid)
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedCycleId])

  useEffect(() => { fetchData() }, [fetchData])

  // Handlers
  const handleCellSelect = (position: NineBoxPosition, employees: Employee9Box[]) => {
    setSelectedPosition(position)
    setSelectedEmployees(employees)
    setDrawerOpen(true)
  }

  // Stats
  const stars = gridData.find(g => g.position === NineBoxPosition.STAR)?.count || 0
  const core = gridData.find(g => g.position === NineBoxPosition.CORE_PLAYER)?.count || 0
  const attention = gridData.find(g => g.position === NineBoxPosition.UNDERPERFORMER)?.count || 0

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-white">
              Matriz <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">9-Box</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Mapeo de talento: Desempeño vs Potencial</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={selectedCycleId || ''} 
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="" disabled>Seleccionar ciclo</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <button 
              onClick={fetchData} 
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </motion.div>

        {/* STATS - SECUNDARIAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <StatCard icon={<Users />} label="En Matriz" value={totalInGrid} />
          <StatCard icon={<Star />} label="Estrellas" value={stars} color="emerald" />
          <StatCard icon={<Target />} label="Core" value={core} color="cyan" />
          <StatCard icon={<AlertTriangle />} label="Atención" value={attention} color="red" />
        </motion.div>

        {/* PROTAGONISTA: GRID 9-BOX */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="relative p-6 md:p-8 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30"
        >
          {/* Línea Tesla */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          {!selectedCycleId ? (
            <EmptyStateContainer 
              icon={<Users />}
              message="Selecciona un ciclo de evaluación"
            />
          ) : isLoading ? (
            <EmptyStateContainer 
              icon={<RefreshCw className="animate-spin" />}
              message="Cargando matriz..."
            />
          ) : totalInGrid === 0 ? (
            <EmptyStateContainer 
              icon={<Users />}
              title="Sin datos de potencial"
              message="Asigna ratings de potencial a los empleados para visualizar la matriz 9-Box"
            />
          ) : (
            <NineBoxGrid 
              data={gridData} 
              onCellSelect={handleCellSelect} 
            />
          )}
        </motion.div>

        {/* DRAWER LATERAL - Cinema Focus */}
        <NineBoxDrawer
          isOpen={drawerOpen}
          position={selectedPosition}
          employees={selectedEmployees}
          onClose={() => setDrawerOpen(false)}
          onEmployeeSelect={(emp) => {
            console.log('Navegar a empleado:', emp)
            // TODO: router.push(`/performance/employees/${emp.employeeId}`)
          }}
        />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD (secundaria)
// ════════════════════════════════════════════════════════════════════════════

function StatCard({ 
  icon, 
  label, 
  value, 
  color = 'slate' 
}: { 
  icon: React.ReactNode
  label: string
  value: number
  color?: string 
}) {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400'
  }
  
  return (
    <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-3">
        <span className={cn('w-5 h-5', colorMap[color])}>{icon}</span>
        <div>
          <div className={cn('text-xl font-semibold', colorMap[color])}>
            {value}
          </div>
          <div className="text-[11px] text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE CONTAINER
// ════════════════════════════════════════════════════════════════════════════

function EmptyStateContainer({ 
  icon, 
  title, 
  message 
}: { 
  icon: React.ReactNode
  title?: string
  message: string 
}) {
  return (
    <div className="py-16 text-center text-slate-500">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
        <span className="w-8 h-8">{icon}</span>
      </div>
      {title && (
        <p className="font-medium text-slate-300 mb-2">{title}</p>
      )}
      <p className="text-sm">{message}</p>
    </div>
  )
}
```

### PASO 3: Actualizar exports

**Actualizar:** `src/components/performance/index.ts`

```typescript
export { default as PerformanceBadge } from './PerformanceBadge'
export { default as PerformanceScoreDisplay } from './PerformanceScoreDisplay'
export { default as NineBoxBadge } from './NineBoxBadge'
export { default as NineBoxGrid } from './NineBoxGrid'
export { default as NineBoxDrawer } from './NineBoxDrawer'
export type { Employee9Box, GridCell, NineBoxGridProps } from './NineBoxGrid'
```

## ✅ CHECKLIST FILOSOFÍA FOCALIZAHR

### Jerarquía Visual:
- [ ] El Grid es el PROTAGONISTA (50%+ del viewport)
- [ ] Stats cards son SECUNDARIOS (solo números)
- [ ] Labels de ejes SUSURRAN (text-slate-500, 10px)

### Patrón Cinema (nivel `/evaluaciones`):
- [ ] Click en celda → Backdrop oscurece (bg-black/60)
- [ ] Drawer se desliza desde la derecha (NO modal)
- [ ] Avatares circulares (como SpotlightCard) ✅ NUEVO
- [ ] Mini-cards con iconos (como InsightCard) ✅ NUEVO
- [ ] Empty states premium con ilustración ✅ NUEVO
- [ ] Click en backdrop → Cierra drawer

### Glassmorphism:
- [ ] bg-slate-800/30 + backdrop-blur-xl
- [ ] border-slate-700/30

### Línea Tesla:
- [ ] Presente en contenedor principal
- [ ] Presente en header del Drawer

### Animaciones:
- [ ] Framer Motion < 300ms
- [ ] Spring damping para Drawer

## 🎯 MEJORAS vs VERSIÓN ORIGINAL

```diff
+ Avatares circulares con initials (estilo SpotlightCard)
+ Ring de potencial para high-performers (border pulsante)
+ Mini-cards insight con iconos (estilo InsightCard)
+ Empty state premium con ilustración y contexto
+ Drawer más ancho (480px vs 420px) para mejor legibilidad
+ Scores visibles en cada card (Performance + Potential)
+ Hover states mejorados con scale animation
+ Color coding consistente con posición 9-Box
```

## ➡️ SIGUIENTE PASO
Testing manual + ajustes visuales finales
