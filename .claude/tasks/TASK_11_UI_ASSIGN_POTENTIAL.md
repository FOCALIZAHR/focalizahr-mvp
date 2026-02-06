# TASK 11: UI ASIGNAR POTENCIAL - RATINGS LIST

## 🎯 OBJETIVO
Crear interfaz para que HR/Manager asigne `potentialScore` a los ratings de un ciclo, habilitando el 9-Box.

## 🎨 FILOSOFÍA CINEMA FOCALIZAHR

```
┌─────────────────────────────────────────────────────────────────┐
│  SIN POTENCIAL ASIGNADO = 9-BOX VACÍO                          │
│                                                                 │
│  Esta pantalla es el PUENTE entre:                             │
│  - Evaluaciones completadas (performance)                       │
│  - Matriz 9-Box (performance + potential)                       │
│                                                                 │
│  PROTAGONISTA: Lista de empleados con sus scores               │
│  ACCIÓN: Asignar potencial con un click                        │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 ARCHIVOS A CREAR

```
src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
src/components/performance/PotentialAssigner.tsx
src/components/performance/RatingRow.tsx
```

## ⚠️ DEPENDENCIAS

- TASK_07 completada (API `/api/performance-ratings/[id]/potential`)
- `PerformanceBadge` existe
- `getPerformanceClassification` existe

## 📋 INSTRUCCIONES

### PASO 1: Crear componente RatingRow

**Crear:** `src/components/performance/RatingRow.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// RATING ROW - Fila de empleado con score y asignador de potencial
// src/components/performance/RatingRow.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRÓN: SpotlightCard (avatar) + Mini-cards (scores)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  User, TrendingUp, Sparkles, ChevronRight, 
  Check, Loader2, Building2 
} from 'lucide-react'
import { 
  getPerformanceClassification,
  POTENTIAL_LEVELS 
} from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getPotentialColor(score: number | null): string {
  if (!score) return '#64748b' // slate
  if (score >= 4.0) return '#10B981' // emerald (high)
  if (score >= 3.0) return '#F59E0B' // amber (medium)
  return '#EF4444' // red (low)
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface RatingData {
  id: string
  employeeId: string
  employeeName: string
  employeePosition?: string | null
  departmentName?: string | null
  calculatedScore: number
  finalScore?: number | null
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
}

interface RatingRowProps {
  rating: RatingData
  onPotentialAssigned?: (ratingId: string, newPotential: number) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function RatingRow({
  rating,
  onPotentialAssigned,
  isExpanded = false,
  onToggleExpand
}: RatingRowProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [localPotential, setLocalPotential] = useState<number | null>(rating.potentialScore ?? null)
  
  const effectiveScore = rating.finalScore ?? rating.calculatedScore
  const perfClassification = getPerformanceClassification(effectiveScore)
  const potentialColor = getPotentialColor(localPotential)
  
  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  
  const handleAssignPotential = async (score: number) => {
    setIsAssigning(true)
    try {
      const res = await fetch(`/api/performance-ratings/${rating.id}/potential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ potentialScore: score })
      })
      
      if (res.ok) {
        setLocalPotential(score)
        onPotentialAssigned?.(rating.id, score)
      }
    } catch (error) {
      console.error('Error assigning potential:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      layout
      className={cn(
        'group relative p-4 rounded-xl transition-all duration-200',
        'bg-slate-800/30 hover:bg-slate-800/50',
        'border border-slate-700/30 hover:border-slate-600/50',
        isExpanded && 'bg-slate-800/60 border-slate-600/50'
      )}
    >
      {/* Línea Tesla sutil en hover */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${perfClassification.color}40, transparent)`
        }}
      />

      <div className="flex items-center gap-4">
        {/* AVATAR - Estilo SpotlightCard */}
        <div className="relative flex-shrink-0">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2"
            style={{ 
              background: `linear-gradient(135deg, ${perfClassification.color}20, ${perfClassification.color}10)`,
              borderColor: `${perfClassification.color}40`,
              color: perfClassification.color
            }}
          >
            {getInitials(rating.employeeName)}
          </div>
          
          {/* Indicador de potencial asignado */}
          {localPotential && (
            <div 
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-900"
              style={{ backgroundColor: potentialColor, color: 'white' }}
            >
              {localPotential.toFixed(0)}
            </div>
          )}
        </div>

        {/* INFO EMPLEADO */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200 truncate">
              {rating.employeeName}
            </span>
            {rating.nineBoxPosition && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400">
                {rating.nineBoxPosition}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {rating.employeePosition && (
              <span className="truncate">{rating.employeePosition}</span>
            )}
            {rating.departmentName && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {rating.departmentName}
              </span>
            )}
          </div>
        </div>

        {/* SCORE PERFORMANCE */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <div className="text-right">
            <div 
              className="text-lg font-semibold tabular-nums"
              style={{ color: perfClassification.color }}
            >
              {effectiveScore.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-500">Performance</div>
          </div>
        </div>

        {/* ASIGNADOR POTENCIAL */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <PotentialSelector
            currentValue={localPotential}
            isLoading={isAssigning}
            onSelect={handleAssignPotential}
          />
        </div>

        {/* CHEVRON para expandir */}
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronRight className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-90'
          )} />
        </button>
      </div>

      {/* EXPANDED: Notas y detalles */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-slate-700/30"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Notas de Potencial (confidencial)
              </label>
              <textarea
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm resize-none',
                  'bg-slate-900/50 border border-slate-700/50',
                  'text-slate-300 placeholder-slate-600',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
                )}
                placeholder="Observaciones sobre el potencial del empleado..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Guía de Potencial</div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">4-5: Alto potencial de crecimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-400">3-4: Potencial moderado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-400">1-3: Potencial limitado</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// POTENTIAL SELECTOR - Botones 1-5
// ════════════════════════════════════════════════════════════════════════════

interface PotentialSelectorProps {
  currentValue: number | null
  isLoading: boolean
  onSelect: (value: number) => void
}

const PotentialSelector = memo(function PotentialSelector({
  currentValue,
  isLoading,
  onSelect
}: PotentialSelectorProps) {
  const options = [1, 2, 3, 4, 5]
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {options.map((value) => {
        const isSelected = currentValue === value
        const color = value >= 4 ? '#10B981' : value >= 3 ? '#F59E0B' : '#EF4444'
        
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-all',
              'border hover:scale-105',
              isSelected 
                ? 'border-transparent text-white shadow-lg' 
                : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 bg-slate-800/50'
            )}
            style={isSelected ? { 
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}40`
            } : {}}
          >
            {isSelected && <Check className="w-4 h-4 mx-auto" />}
            {!isSelected && value}
          </button>
        )
      })}
    </div>
  )
})

export { RatingRow }
export type { RatingData, RatingRowProps }
```

### PASO 2: Crear página de Ratings del Ciclo

**Crear:** `src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// RATINGS PAGE - Lista de ratings con asignación de potencial
// src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRÓN CINEMA: Lista como protagonista, drawer para detalle
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  ArrowLeft, RefreshCw, Grid3X3, Search, 
  Filter, Users, Sparkles, TrendingUp, CheckCircle2 
} from 'lucide-react'
import Link from 'next/link'
import RatingRow, { type RatingData } from '@/components/performance/RatingRow'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface CycleInfo {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function CycleRatingsPage() {
  const params = useParams()
  const router = useRouter()
  const cycleId = params.cycleId as string

  // State
  const [cycle, setCycle] = useState<CycleInfo | null>(null)
  const [ratings, setRatings] = useState<RatingData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPotential, setFilterPotential] = useState<'all' | 'assigned' | 'pending'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════════════════════════════════

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch cycle info
      const cycleRes = await fetch(`/api/performance-cycles/${cycleId}`)
      const cycleJson = await cycleRes.json()
      if (cycleJson.success) {
        setCycle(cycleJson.data)
      }

      // Fetch ratings
      const ratingsRes = await fetch(`/api/performance-ratings?cycleId=${cycleId}`)
      const ratingsJson = await ratingsRes.json()
      if (ratingsJson.success) {
        setRatings(ratingsJson.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cycleId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERS
  // ══════════════════════════════════════════════════════════════════════════

  const filteredRatings = ratings.filter(r => {
    // Search filter
    const matchesSearch = 
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Potential filter
    const matchesPotential = 
      filterPotential === 'all' ||
      (filterPotential === 'assigned' && r.potentialScore != null) ||
      (filterPotential === 'pending' && r.potentialScore == null)
    
    return matchesSearch && matchesPotential
  })

  // Stats
  const totalRatings = ratings.length
  const assignedCount = ratings.filter(r => r.potentialScore != null).length
  const pendingCount = totalRatings - assignedCount
  const progressPercent = totalRatings > 0 ? Math.round((assignedCount / totalRatings) * 100) : 0

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handlePotentialAssigned = (ratingId: string, newPotential: number) => {
    setRatings(prev => prev.map(r => 
      r.id === ratingId 
        ? { ...r, potentialScore: newPotential }
        : r
    ))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {/* Back + Title */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/performance/cycles"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-light text-white">
                Asignar <span className="font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Potencial</span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {cycle?.name || 'Cargando...'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchData}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
            </div>

            {/* 9-Box Button */}
            <Link
              href={`/dashboard/performance/nine-box?cycleId=${cycleId}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                assignedCount > 0
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
              Ver 9-Box
            </Link>
          </div>
        </motion.div>

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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <StatMini icon={<Users />} label="Total" value={totalRatings} />
              <StatMini icon={<CheckCircle2 />} label="Asignados" value={assignedCount} color="emerald" />
              <StatMini icon={<Sparkles />} label="Pendientes" value={pendingCount} color="amber" />
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {progressPercent}%
              </div>
              <div className="text-xs text-slate-500">completado</div>
            </div>
          </div>
        </motion.div>

        {/* FILTERS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                'bg-slate-800/50 border border-slate-700/50',
                'text-slate-200 placeholder-slate-500',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
              )}
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <FilterButton 
              active={filterPotential === 'all'} 
              onClick={() => setFilterPotential('all')}
            >
              Todos
            </FilterButton>
            <FilterButton 
              active={filterPotential === 'pending'} 
              onClick={() => setFilterPotential('pending')}
              color="amber"
            >
              Pendientes
            </FilterButton>
            <FilterButton 
              active={filterPotential === 'assigned'} 
              onClick={() => setFilterPotential('assigned')}
              color="emerald"
            >
              Asignados
            </FilterButton>
          </div>
        </motion.div>

        {/* RATINGS LIST */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {isLoading ? (
            <LoadingState />
          ) : filteredRatings.length === 0 ? (
            <EmptyState 
              hasFilters={searchTerm !== '' || filterPotential !== 'all'}
              onClearFilters={() => {
                setSearchTerm('')
                setFilterPotential('all')
              }}
            />
          ) : (
            filteredRatings.map((rating, index) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <RatingRow
                  rating={rating}
                  isExpanded={expandedId === rating.id}
                  onToggleExpand={() => setExpandedId(
                    expandedId === rating.id ? null : rating.id
                  )}
                  onPotentialAssigned={handlePotentialAssigned}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function StatMini({ 
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
  const colors: Record<string, string> = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400'
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className={cn('w-4 h-4', colors[color])}>{icon}</span>
      <div>
        <div className={cn('text-lg font-semibold', colors[color])}>{value}</div>
        <div className="text-[10px] text-slate-500">{label}</div>
      </div>
    </div>
  )
}

function FilterButton({ 
  children, 
  active, 
  onClick, 
  color = 'cyan' 
}: { 
  children: React.ReactNode
  active: boolean
  onClick: () => void
  color?: string 
}) {
  const activeColors: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
        active 
          ? activeColors[color]
          : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:text-slate-300'
      )}
    >
      {children}
    </button>
  )
}

function LoadingState() {
  return (
    <div className="py-12 text-center">
      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-600 mb-3" />
      <p className="text-sm text-slate-500">Cargando ratings...</p>
    </div>
  )
}

function EmptyState({ 
  hasFilters, 
  onClearFilters 
}: { 
  hasFilters: boolean
  onClearFilters: () => void 
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
        <Users className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-slate-400 mb-2">
        {hasFilters ? 'No se encontraron resultados' : 'No hay ratings en este ciclo'}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
```

### PASO 3: Actualizar exports

**Actualizar:** `src/components/performance/index.ts`

```typescript
// ... exports existentes
export { default as RatingRow } from './RatingRow'
export type { RatingData, RatingRowProps } from './RatingRow'
```

## ✅ CHECKLIST

- [ ] `RatingRow` muestra avatar + scores + selector de potencial
- [ ] Click en botón 1-5 llama API `/api/performance-ratings/[id]/potential`
- [ ] Estado local se actualiza inmediatamente (optimistic)
- [ ] Barra de progreso muestra % completado
- [ ] Filtros funcionan (todos/pendientes/asignados)
- [ ] Búsqueda por nombre funciona
- [ ] Botón "Ver 9-Box" habilitado solo si hay asignados
- [ ] Expandir fila muestra textarea para notas

## 🎯 RESULTADO VISUAL

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Asignar Potencial                                    [↻] [Ver 9-Box] │
│     Evaluación Anual 2025                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ═══════════════════════════════════════════════════════  75%          │
│  👥 24 Total    ✅ 18 Asignados    ⭐ 6 Pendientes       completado     │
├─────────────────────────────────────────────────────────────────────────┤
│  [🔍 Buscar empleado...]    [Todos] [Pendientes] [Asignados]           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ (JD) Juan Díaz              │ 4.2 Performance │ [1][2][3][✓][5] │ > │
│  │     Gerente Ventas · Ventas │                 │     Potencial    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ (MP) María Pérez            │ 3.8 Performance │ [1][2][3][4][5] │ > │
│  │     Analista · Finanzas     │                 │     Pendiente    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## ➡️ SIGUIENTE TAREA
`TASK_12_CALIBRATION_MODEL.md`
