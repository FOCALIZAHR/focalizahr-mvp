# 🎬 TASK_14: CALIBRATION CINEMA - IMPLEMENTACIÓN DEFINITIVA

## 📊 ESTADO ACTUAL

```yaml
✅ COMPLETADO:
  - TASK_12: Schema + APIs + Estado Transitorio
  - Maqueta CinemaNineBox.tsx con diseño premium
  - DistributionGauge + DistributionModal existentes en proyecto

❌ NO EXISTE:
  - Vista real de calibración (/sessions/[id])
  - Conexión con backend
  - Integración estado transitorio

OBJETIVO:
  Implementar pantalla de calibración reutilizando componentes existentes
  (DistributionGauge, DistributionModal) dentro del layout Cinema
```

---

## 🎨 DISEÑO BASE: CinemaNineBox.tsx

**SOURCE OF TRUTH para estilos:**
- Dark Mode: `bg-[#0B1120]`, `bg-[#111827]`
- Glassmorphism: `backdrop-blur-sm`, `border-slate-800`
- Línea Tesla: Purple (#d946ef) / Cyan (#22d3ee)
- Animaciones: Framer Motion
- **Drag & Drop: @dnd-kit/core** (soporte móvil + touch)

**Componentes a reutilizar del proyecto:**
1. ✅ **DistributionGauge** (variant="compact") - Reemplaza CinemaGaussianWidget
2. ✅ **DistributionModal** - Ya existe, solo conectar datos
3. 🆕 **CinemaCard** - Portar de maqueta
4. 🆕 **JustificationDrawer** - Portar de maqueta

**Decisiones arquitectónicas:**
- ❌ **NO usar CinemaGaussianWidget** (SVG hardcodeado de maqueta)
- ✅ **Usar DistributionGauge existente** (componente real del proyecto)
- ✅ **@dnd-kit en vez de HTML5 drag:** Mobile/tablet support + mejor UX
- ✅ **Bonus Factor parametrizable:** DEFAULT_BONUS_FACTORS → futuro en DB

---

## 🏗️ ARQUITECTURA DE IMPLEMENTACIÓN

### 1. Estructura de Archivos

```
src/
├── app/
│   └── dashboard/
│       └── performance/
│           └── calibration/
│               └── sessions/
│                   └── [sessionId]/
│                       └── page.tsx          # ← CalibrationCinemaPage
│
├── components/
│   └── calibration/
│       ├── cinema/
│       │   ├── CinemaHeader.tsx            # Header con DistributionGauge + Bonus
│       │   ├── CinemaGrid.tsx              # Grid 9-box (@dnd-kit)
│       │   ├── CinemaCard.tsx              # ← PORTAR de maqueta (draggable)
│       │   └── JustificationDrawer.tsx     # ← PORTAR de maqueta
│       │
│       └── hooks/
│           └── useCalibrationRoom.ts       # Hook + 9-Box→Score mapping
│
├── config/
│   └── calibrationBonusFactors.ts          # ← NUEVO: Factores de bono
│
└── types/
    └── calibration-cinema.ts               # Tipos TypeScript
```

**🔄 COMPONENTES EXISTENTES A REUTILIZAR (NO crear):**
```typescript
import DistributionGauge from '@/components/performance/DistributionGauge'
import DistributionModal from '@/components/performance/DistributionModal'
```

### 2. Dependencias Nuevas

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Razón:** Soporte drag & drop en móviles/tablets. HTML5 drag API NO funciona en touch devices.

---

## 💰 SISTEMA DE BONUS FACTORS

### Config: `src/config/calibrationBonusFactors.ts`

```typescript
// ═══════════════════════════════════════════════════════════
// CALIBRATION BONUS FACTORS
// Factores multiplicadores de bono por posición 9-Box
// ═══════════════════════════════════════════════════════════

export const DEFAULT_BONUS_FACTORS: Record<string, number> = {
  // Top Performers
  STARS: 1.25,    // 125% del bono base
  HIGH: 1.15,     // 115%
  
  // Core Team
  CORE: 0.90,     // 90%
  
  // Development Zone
  NEUTRAL: 0.70,  // 70%
  
  // Risk Zone
  RISK: 0.00      // 0% (sin bono)
}

/**
 * Obtiene factor de bono por status de cuadrante
 */
export function getBonusFactor(status: string): number {
  return DEFAULT_BONUS_FACTORS[status] ?? 0.70
}

/**
 * Calcula factor de bono promedio para un equipo
 */
export function calculateAverageBonusFactor(
  employees: Array<{ status: string }>
): number {
  if (employees.length === 0) return 0
  
  const total = employees.reduce((sum, emp) => {
    return sum + getBonusFactor(emp.status)
  }, 0)
  
  return total / employees.length
}

/**
 * Formatea factor de bono para display
 */
export function formatBonusFactor(factor: number): string {
  return `${Math.round(factor * 100)}%`
}
```

**Nota:** En el futuro, esto puede parametrizarse por cliente en `CalibrationSession.bonusConfig`.

---

## 🔌 INTEGRACIÓN BACKEND - ESTADO TRANSITORIO

### Hook Principal: `useCalibrationRoom.ts`

```typescript
'use client'

import useSWR from 'swr'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { calculateAverageBonusFactor, formatBonusFactor } from '@/config/calibrationBonusFactors'

interface UseCalibrationRoomProps {
  sessionId: string
}

export function useCalibrationRoom({ sessionId }: UseCalibrationRoomProps) {
  // ══════════════════════════════════════════════════════════════
  // 1. DATA FETCHING (con polling cada 5s)
  // ══════════════════════════════════════════════════════════════
  
  const { data: session, mutate: mutateSession } = useSWR(
    `/api/calibration/sessions/${sessionId}`,
    fetcher,
    { refreshInterval: 5000 } // Polling para updates colaborativos
  )
  
  const { data: ratingsData, mutate: mutateRatings } = useSWR(
    session ? `/api/calibration/sessions/${sessionId}/ratings` : null,
    fetcher
  )
  
  const { data: adjustmentsData, mutate: mutateAdjustments } = useSWR(
    session ? `/api/calibration/sessions/${sessionId}/adjustments` : null,
    fetcher,
    { refreshInterval: 5000 }
  )
  
  // ══════════════════════════════════════════════════════════════
  // 2. ESTADO TRANSITORIO - MERGE + 9-BOX→SCORE MAPPING
  // ══════════════════════════════════════════════════════════════
  
  const employeeList = useMemo(() => {
    if (!ratingsData?.data || !adjustmentsData?.data) return []
    
    const ratings = ratingsData.data
    const adjustments = adjustmentsData.data.filter(
      (a: any) => a.status === 'PENDING'
    )
    
    // MERGE: adjustment ?? rating
    return ratings.map((rating: any) => {
      const adjustment = adjustments.find(
        (a: any) => a.ratingId === rating.id
      )
      
      // ═══ MAPEO 9-BOX → SCORE NUMÉRICO (para DistributionGauge) ═══
      // potentialScore puede ser score directo O venir de adjustment
      const effectivePotentialScore = adjustment?.newPotentialScore ?? rating.potentialScore
      const effectivePerformanceScore = adjustment?.newFinalScore ?? rating.calculatedScore
      
      return {
        id: rating.employeeId,
        name: rating.employee.fullName,
        role: rating.employee.position,
        avatar: getInitials(rating.employee.fullName),
        
        // ESTADO ORIGINAL (inmutable)
        calculatedScore: rating.calculatedScore,
        calculatedLevel: rating.calculatedLevel,
        calculatedNineBox: rating.nineBoxPosition,
        
        // ESTADO EFECTIVO (con adjustment si existe)
        effectiveScore: effectivePerformanceScore,  // Para display general
        effectivePotentialScore: effectivePotentialScore, // Para DistributionGauge
        effectiveLevel: adjustment?.newFinalLevel ?? rating.calculatedLevel,
        effectiveNineBox: adjustment?.newNineBox ?? rating.nineBoxPosition,
        
        // METADATA
        quadrant: mapNineBoxToQuadrant(
          adjustment?.newNineBox ?? rating.nineBoxPosition
        ),
        status: getQuadrantStatus(
          adjustment?.newNineBox ?? rating.nineBoxPosition
        ),
        hasChanged: !!adjustment,
        adjustmentId: adjustment?.id,
        justification: adjustment?.justification,
        
        // DATOS ORIGINALES
        ratingId: rating.id,
        performance: rating.calculatedScore,
        potential: rating.potentialScore ?? 0,
        history: [] // TODO: obtener de adjustments históricos
      }
    })
  }, [ratingsData, adjustmentsData])
  
  // ══════════════════════════════════════════════════════════════
  // 3. DISTRIBUTION STATS + BONUS FACTOR + ASSIGNED SCORES
  // ══════════════════════════════════════════════════════════════
  
  const stats = useMemo(() => {
    const distribution: Record<string, number> = {}
    
    // ═══ ASSIGNED SCORES (para DistributionGauge) ═══
    const assignedScores = employeeList
      .filter(emp => emp.effectivePotentialScore !== null)
      .map(emp => emp.effectivePotentialScore as number)
    const total = employeeList.length
    
    employeeList.forEach(emp => {
      const key = emp.effectiveNineBox || 'unknown'
      distribution[key] = (distribution[key] || 0) + 1
    })
    
    // Calcular % de cada cuadrante
    const percentages: Record<string, number> = {}
    for (const [key, count] of Object.entries(distribution)) {
      percentages[key] = total > 0 ? (count / total) * 100 : 0
    }
    
    // Targets de distribución (si session tiene distributionTargets)
    const targets = session?.distributionTargets || {
      q9: 10,  // ESTRELLAS: 10%
      q6: 20,  // Alto Desempeño: 20%
      q5: 40,  // Core: 40%
      q8: 15,  // Crecimiento: 15%
      q3: 10,  // Experto: 10%
      q2: 5    // Efectivo: 5%
    }
    
    // ═══ BONUS FACTOR CALCULATION ═══
    const avgBonusFactor = calculateAverageBonusFactor(employeeList)
    const bonusFactorDisplay = formatBonusFactor(avgBonusFactor)
    
    return {
      distribution: percentages,
      targets,
      total,
      realPercentage: percentages.q9 || 0,  // % en ESTRELLAS (para widget)
      targetPercentage: targets.q9 || 10,
      
      // ← NUEVO: Bonus Factor
      avgBonusFactor,
      bonusFactorDisplay,
      
      // ← NUEVO: Assigned Scores (para DistributionGauge)
      assignedScores
    }
  }, [employeeList, session])
  
  // ══════════════════════════════════════════════════════════════
  // 4. RBAC - PERMISSIONS
  // ══════════════════════════════════════════════════════════════
  
  const userRole = session?.participants?.find(
    (p: any) => p.email === session.currentUserEmail
  )?.role || 'OBSERVER'
  
  const canEdit = userRole === 'FACILITATOR' || userRole === 'REVIEWER'
  const isReadOnly = session?.status === 'CLOSED' || !canEdit
  
  // ══════════════════════════════════════════════════════════════
  // 5. ACTIONS
  // ══════════════════════════════════════════════════════════════
  
  const [optimisticState, setOptimisticState] = useState<any>(null)
  
  async function moveEmployee(
    employeeId: string,
    newQuadrant: string,
    justification: string
  ) {
    if (isReadOnly) {
      toast.error('Sesión en solo lectura')
      return
    }
    
    const employee = employeeList.find(e => e.id === employeeId)
    if (!employee) return
    
    const newNineBox = mapQuadrantToNineBox(newQuadrant)
    
    // Optimistic Update
    setOptimisticState({
      employeeId,
      newQuadrant,
      newNineBox
    })
    
    try {
      const response = await fetch(
        `/api/calibration/sessions/${sessionId}/adjustments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ratingId: employee.ratingId,
            newNineBox,
            justification
          })
        }
      )
      
      if (!response.ok) throw new Error('Error al guardar ajuste')
      
      // Revalidar datos
      await mutateAdjustments()
      
      toast.success('Ajuste guardado')
    } catch (error) {
      console.error('Error moveEmployee:', error)
      toast.error('Error al guardar. Revirtiendo...')
      
      // Rollback optimistic update
      setOptimisticState(null)
    }
  }
  
  async function closeSession() {
    try {
      const response = await fetch(
        `/api/calibration/sessions/${sessionId}/close`,
        { method: 'POST' }
      )
      
      if (!response.ok) throw new Error('Error al cerrar sesión')
      
      const json = await response.json()
      
      toast.success(json.message)
      mutateSession()
      mutateAdjustments()
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }
  
  return {
    // Data
    session,
    employeeList,
    stats,
    
    // State
    isLoading: !session || !ratingsData || !adjustmentsData,
    isReadOnly,
    canEdit,
    userRole,
    
    // Actions
    moveEmployee,
    closeSession,
    mutate: () => {
      mutateSession()
      mutateRatings()
      mutateAdjustments()
    }
  }
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function mapNineBoxToQuadrant(nineBox: string): string {
  // "high_potential_low_performance" → "q7"
  const mapping: Record<string, string> = {
    high_potential_low_performance: 'q7',
    high_potential_medium_performance: 'q8',
    high_potential_high_performance: 'q9',
    medium_potential_low_performance: 'q4',
    medium_potential_medium_performance: 'q5',
    medium_potential_high_performance: 'q6',
    low_potential_low_performance: 'q1',
    low_potential_medium_performance: 'q2',
    low_potential_high_performance: 'q3'
  }
  return mapping[nineBox] || 'q5'
}

function mapQuadrantToNineBox(quadrant: string): string {
  const mapping: Record<string, string> = {
    q7: 'high_potential_low_performance',
    q8: 'high_potential_medium_performance',
    q9: 'high_potential_high_performance',
    q4: 'medium_potential_low_performance',
    q5: 'medium_potential_medium_performance',
    q6: 'medium_potential_high_performance',
    q1: 'low_potential_low_performance',
    q2: 'low_potential_medium_performance',
    q3: 'low_potential_high_performance'
  }
  return mapping[quadrant] || 'medium_potential_medium_performance'
}

function getQuadrantStatus(nineBox: string): string {
  if (nineBox.includes('high_performance')) return 'STARS'
  if (nineBox.includes('high_potential')) return 'HIGH'
  if (nineBox.includes('medium_potential_medium')) return 'CORE'
  if (nineBox.includes('low_performance')) return 'RISK'
  return 'NEUTRAL'
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Fetch error')
  return res.json()
}
```

---

## 🎨 COMPONENTE PRINCIPAL: CalibrationCinemaPage

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useCalibrationRoom } from '@/components/calibration/hooks/useCalibrationRoom'
import CinemaHeader from '@/components/calibration/cinema/CinemaHeader'
import CinemaGrid from '@/components/calibration/cinema/CinemaGrid'
import CinemaCard from '@/components/calibration/cinema/CinemaCard'
import JustificationDrawer from '@/components/calibration/cinema/JustificationDrawer'

// ═══ COMPONENTES EXISTENTES (NO crear de nuevo) ═══
import DistributionGauge from '@/components/performance/DistributionGauge'
import DistributionModal from '@/components/performance/DistributionModal'

import { Search, Filter, History, Lock, BarChart3 } from 'lucide-react'

export default function CalibrationCinemaPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const {
    session,
    employeeList,
    stats,
    isLoading,
    isReadOnly,
    canEdit,
    userRole,
    moveEmployee,
    closeSession
  } = useCalibrationRoom({ sessionId })
  
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [pendingMove, setPendingMove] = useState<any>(null)
  const [showDistModal, setShowDistModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  
  // ═══════════════════════════════════════════════════════════
  // @DND-KIT SENSORS (con soporte touch)
  // ═══════════════════════════════════════════════════════════
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimiento para activar (evita clicks accidentales)
      },
    })
  )
  
  if (isLoading) {
    return <div className="h-screen bg-[#0B1120] flex items-center justify-center">
      <div className="text-slate-400">Cargando sesión...</div>
    </div>
  }
  
  // ═══════════════════════════════════════════════════════════
  // FILTRADO
  // ═══════════════════════════════════════════════════════════
  
  const filteredEmployees = employeeList.filter(emp => {
    if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterStatus && emp.status !== filterStatus) {
      return false
    }
    return true
  })
  
  // ═══════════════════════════════════════════════════════════
  // HANDLERS (@dnd-kit)
  // ═══════════════════════════════════════════════════════════
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    if (!over || isReadOnly) return
    
    const employeeId = active.id as string
    const newQuadrant = over.id as string
    
    const employee = employeeList.find(e => e.id === employeeId)
    if (!employee) return
    
    // Si cambió de cuadrante
    if (employee.quadrant !== newQuadrant) {
      // Guardar movimiento pendiente
      setPendingMove({
        employee,
        newQuadrant
      })
      
      // Abrir drawer para justificación
      setSelectedEmp(employee)
    }
  }
  
  async function handleConfirmMove(justification: string) {
    if (!pendingMove) return
    
    await moveEmployee(
      pendingMove.employee.id,
      pendingMove.newQuadrant,
      justification
    )
    
    setPendingMove(null)
    setSelectedEmp(null)
  }
  
  function handleCancelMove() {
    setPendingMove(null)
    setSelectedEmp(null)
  }
  
  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen w-screen bg-[#0B1120] flex flex-col overflow-hidden">
        
        {/* HEADER con Bonus Factor */}
        <CinemaHeader
          session={session}
          stats={stats}
          bonusFactor={stats.bonusFactorDisplay}
          onClose={() => window.history.back()}
          onFinish={closeSession}
          isReadOnly={isReadOnly}
          userRole={userRole}
        />
        
        {/* TOOLBAR */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-800 bg-[#0f1523] flex-shrink-0">
          
          {/* Left: Distribution Gauge (componente existente) */}
          <div onClick={() => setShowDistModal(true)} className="cursor-pointer">
            <DistributionGauge
              variant="compact"
              assignedScores={stats.assignedScores}
              showLabels={false}
            />
          </div>
          
          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full h-10 pl-10 pr-4 bg-[#111827] border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDistModal(true)}
              className="h-10 px-4 bg-[#111827] border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500 transition-all flex items-center gap-2"
            >
              <BarChart3 size={14} />
              Distribución
            </button>
            
            {isReadOnly && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
                <Lock size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                  {session.status === 'CLOSED' ? 'Sesión Cerrada' : 'Solo Lectura'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* GRID 9-BOX */}
        <main className="flex-1 overflow-auto p-8">
          <CinemaGrid
            employees={filteredEmployees}
            isReadOnly={isReadOnly}
          />
        </main>
        
        {/* DRAWERS & MODALS */}
        <JustificationDrawer
          employee={selectedEmp}
          onClose={handleCancelMove}
          onConfirm={handleConfirmMove}
          isOpen={!!selectedEmp}
        />
        
        <DistributionModal
          isOpen={showDistModal}
          onClose={() => setShowDistModal(false)}
          assignedScores={stats.assignedScores}
        />
        
      </div>
    </DndContext>
  )
}
```

**Nota clave:** @dnd-kit maneja touch events automáticamente. No se requiere código especial para móviles.

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

```yaml
DEPENDENCIAS:
  ☐ npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

COMPONENTES A PORTAR (de maqueta):
  ☐ CinemaCard.tsx (+ indicadores de cambio + @dnd-kit)
  ☐ JustificationDrawer.tsx

COMPONENTES NUEVOS:
  ☐ CinemaHeader.tsx (+ DistributionGauge + Bonus Factor)
  ☐ CinemaGrid.tsx (matriz 9-box + @dnd-kit DndContext)
  ☐ useCalibrationRoom.ts (hook + 9-Box→Score mapping)

COMPONENTES EXISTENTES A REUTILIZAR:
  ☐ Importar DistributionGauge de @/components/performance
  ☐ Importar DistributionModal de @/components/performance
  ☐ Configurar DistributionGauge con variant="compact"
  ☐ Pasar assignedScores a ambos componentes

CONFIG NUEVOS:
  ☐ calibrationBonusFactors.ts (DEFAULT_BONUS_FACTORS)

INTEGRACIÓN BACKEND:
  ☐ Fetch session con SWR (polling 5s)
  ☐ Fetch ratings con SWR
  ☐ Fetch adjustments con SWR (polling 5s)
  ☐ Merge estado transitorio (effectiveScore)
  ☐ Mapear 9-Box → Score numérico (potentialScore)
  ☐ Calcular assignedScores para DistributionGauge
  ☐ POST /adjustments al mover tarjeta
  ☐ POST /close al finalizar sesión

@DND-KIT INTEGRATION:
  ☐ DndContext wrapping grid
  ☐ useSensor(PointerSensor) con activationConstraint
  ☐ useDraggable en CinemaCard
  ☐ useDroppable en cada cuadrante
  ☐ handleDragEnd para capturar movimientos

BONUS FACTOR:
  ☐ calculateAverageBonusFactor en useCalibrationRoom
  ☐ Display en CinemaHeader
  ☐ Actualización en tiempo real al mover tarjetas

RBAC:
  ☐ Validar rol usuario (FACILITATOR/REVIEWER/OBSERVER)
  ☐ Deshabilitar drag-drop si OBSERVER o CLOSED
  ☐ Mostrar badge "Solo Lectura"

INDICADORES VISUALES:
  ☐ Punto cyan si hasChanged
  ☐ Score tachado (~~3.8~~) + nuevo (**4.2**)
  ☐ Distribución real vs target en widget
  ☐ Bonus Factor promedio en header

VALIDACIONES:
  ☐ Justificación obligatoria si baja de nivel
  ☐ Rollback si API falla (optimistic UI)
  ☐ Toast error/success
  ☐ Loading states

ESTILOS:
  ☐ Mantener paleta exacta de maqueta
  ☐ Glassmorphism bg-[#0B1120]/60
  ☐ Bordes border-slate-800
  ☐ Animaciones framer-motion
  ☐ @dnd-kit physics suaves (spring)
```

---

## ✅ CRITERIOS DE ÉXITO

```yaml
FUNCIONALIDAD:
  ✅ Se ven todos los empleados del ciclo en grid 9-box
  ✅ Drag & drop funciona en desktop + móvil + tablet (@dnd-kit)
  ✅ Drawer captura justificación antes de confirmar
  ✅ Cambios persisten al recargar página
  ✅ Widget gaussian refleja distribución real vs target
  ✅ Bonus Factor promedio se calcula y muestra en header
  ✅ Bonus Factor actualiza en tiempo real al mover tarjetas
  ✅ Sesión cerrada = modo solo lectura
  ✅ OBSERVER no puede editar
  ✅ Polling cada 5s para updates colaborativos

DISEÑO:
  ✅ Idéntico a maqueta CinemaNineBox.tsx
  ✅ Responsive (grid ajusta en pantallas pequeñas)
  ✅ Animaciones fluidas (@dnd-kit spring physics)
  ✅ Loading states elegantes
  ✅ Touch-friendly (botones grandes, gestos nativos)

ARQUITECTURA:
  ✅ Usa estado transitorio (no toca PerformanceRating hasta close)
  ✅ Optimistic UI con rollback
  ✅ SWR para cache + revalidación
  ✅ TypeScript strict
  ✅ Componentes modulares reutilizables
  ✅ Bonus Factor parametrizable (constante → futuro DB)
```
  ✅ OBSERVER no puede editar

DISEÑO:
  ✅ Idéntico a maqueta CinemaNineBox.tsx
  ✅ Responsive (grid ajusta en pantallas pequeñas)
  ✅ Animaciones fluidas
  ✅ Loading states elegantes

ARQUITECTURA:
  ✅ Usa estado transitorio (no toca PerformanceRating hasta close)
  ✅ Optimistic UI con rollback
  ✅ SWR para cache + revalidación
  ✅ TypeScript strict
  ✅ Componentes modulares reutilizables
```

---

## 🚀 PROMPT PARA CLAUDE CODE

```markdown
Implementa TASK_14: Calibration Cinema

CONTEXTO:
Maqueta visual (CinemaNineBox.tsx) + componentes existentes (DistributionGauge, DistributionModal).
Reutilizar componentes existentes dentro del layout Cinema.

ARCHIVOS BASE:
- Maqueta: .claude/tasks/CinemaNineBox.tsx
- Documentación: .claude/tasks/TASK_14_CALIBRATION_CINEMA_DEFINITIVA.md

DEPENDENCIAS NUEVAS:
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

ARQUITECTURA:
1. Hook useCalibrationRoom.ts - Fetch + Estado Transitorio + 9-Box→Score mapping
2. CalibrationCinemaPage - Página principal + DndContext
3. Componentes Cinema - Portar de maqueta (CinemaCard, JustificationDrawer)
4. calibrationBonusFactors.ts - Constantes de factores de bono

🔄 COMPONENTES EXISTENTES A REUTILIZAR (NO crear):
- DistributionGauge de @/components/performance/DistributionGauge
  → Usar variant="compact"
  → Pasar assignedScores (array de potentialScores)
- DistributionModal de @/components/performance/DistributionModal
  → Pasar assignedScores

❌ NO CREAR:
- CinemaGaussianWidget (usar DistributionGauge)
- DistributionModal (ya existe en proyecto)

ESTADO TRANSITORIO (CRÍTICO):
- employeeList.effectiveScore = adjustment ?? calculatedScore
- effectivePotentialScore = adjustment ?? potentialScore
- NO tocar PerformanceRating hasta POST /close
- Optimistic UI con rollback si falla

9-BOX → SCORE MAPPING:
- Mapear 9-Box a potentialScore numérico (1-5)
- assignedScores = employeeList.map(e => e.effectivePotentialScore)
- Pasar assignedScores a DistributionGauge y DistributionModal

DISEÑO:
- Mantener EXACTAMENTE estilos de maqueta
- bg-[#0B1120], glassmorphism, línea Tesla
- Drag & drop con @dnd-kit (soporte móvil/tablet)
- Physics suaves con spring animations

BONUS FACTOR:
- DEFAULT_BONUS_FACTORS: STARS=1.25, HIGH=1.15, CORE=0.9, RISK=0
- Calcular promedio en useCalibrationRoom
- Display en CinemaHeader
- Actualiza en tiempo real al mover tarjetas
- Display en CinemaHeader
- Actualiza en tiempo real al mover tarjetas

@DND-KIT:
- DndContext wrapping grid
- PointerSensor con activationConstraint: { distance: 8 }
- useDraggable en CinemaCard
- useDroppable en cada cuadrante
- handleDragEnd captura movimientos

RBAC:
- FACILITATOR/REVIEWER: pueden editar
- OBSERVER: solo lectura
- Si status=CLOSED: deshabilitar todo

POLLING:
- session: SWR con refreshInterval: 5000
- adjustments: SWR con refreshInterval: 5000

Lee .claude/tasks/TASK_14_CALIBRATION_CINEMA_DEFINITIVA.md completo antes de empezar.

¿Entendiste el patrón de estado transitorio + @dnd-kit + bonus factor?
```
