# REF_TASK_03B: Referencia Técnica Componente UI

## 1. Estructura Visual

### ClassificationSummary (Patrón A: One Screen Decision)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                  ✨ Clasificación Inteligente                   │
│                  ─────────── • ───────────                      │
│                                                                 │
│    ┌───────────────────────────────────────────────────────┐   │
│    │                                                       │   │
│    │              ┌─────────────────┐                      │   │
│    │              │      90%       │  ← Gauge circular     │   │
│    │              │   180 de 200   │     cyan gradient     │   │
│    │              └─────────────────┘                      │   │
│    │                                                       │   │
│    │     Cargos clasificados automáticamente               │   │
│    │                                                       │   │
│    │     ═══════════════════════════════════════           │   │
│    │                  Tesla Line                           │   │
│    └───────────────────────────────────────────────────────┘   │
│                                                                 │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│    │  EJECUTIVO  │  │   MANAGER   │  │ COLABORADOR │          │
│    │      8      │  │     52      │  │    120      │          │
│    │   C-Level   │  │   Jefes     │  │  Analistas  │          │
│    │   purple    │  │    cyan     │  │    blue     │          │
│    └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                 │
│    ┌───────────────────────────────────────────────────────┐   │
│    │  ⚠️  20 cargos requieren tu atención                  │   │
│    │      [ Resolver Ahora ]  ← Primary Button              │   │
│    └───────────────────────────────────────────────────────┘   │
│                                                                 │
│    ┌───────────────────────────────────────────────────────┐   │
│    │  [ Continuar ]  ← disabled si pendientes > 0           │   │
│    └───────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### UnmappedPositionsDrawer (Patrón C: Detail + Drawer)

```
┌────────────────────────────────┬────────────────────────────────┐
│  LISTA DE PENDIENTES           │        ASIGNAR NIVEL           │
│                                │                                │
│  🔍 Buscar cargo...            │   Cargo seleccionado:          │
│                                │   "GURU ESPIRITUAL"            │
│  ┌────────────────────────┐    │   3 empleados afectados        │
│  │ □ GURU ESPIRITUAL (3)  │    │                                │
│  │ □ ENFERM_UNIV... (5)   │    │   Sugerencia IA:               │
│  │ ■ CAJERO RECEP... (8)  │←   │   Profesional/Analista         │
│  │ □ SECRETARIA (O) (4)   │    │                                │
│  └────────────────────────┘    │   ─────────────────────        │
│                                │                                │
│  [ Seleccionar Todos ]         │   Seleccionar nivel:           │
│                                │   ┌──────────────────────┐     │
│                                │   │ ○ Gerente/Director   │     │
│                                │   │ ○ Subgerente         │     │
│                                │   │ ○ Jefe               │     │
│                                │   │ ○ Supervisor/Coord.  │     │
│                                │   │ ● Profesional        │ ←   │
│                                │   │ ○ Asistente          │     │
│                                │   │ ○ Operativo          │     │
│                                │   └──────────────────────┘     │
│                                │                                │
│                                │   Track resultante:            │
│                                │   ┌──────────────────────┐     │
│                                │   │    COLABORADOR       │     │
│                                │   │    Evaluación 360°   │     │
│                                │   └──────────────────────┘     │
│                                │                                │
│                                │   ╔════════════════════════╗   │
│                                │   ║ [ Asignar y Siguiente ]║   │
│                                │   ╚════════════════════════╝   │
└────────────────────────────────┴────────────────────────────────┘
```

## 2. Código Base Componentes

### JobClassificationGate.tsx

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ClassificationSummary from './ClassificationSummary'
import UnmappedPositionsDrawer from './UnmappedPositionsDrawer'

interface JobClassificationGateProps {
  mode: 'client' | 'admin'
  accountId?: string
  onComplete: () => void
  onCancel?: () => void
  className?: string
}

interface ClassificationData {
  summary: {
    totalEmployees: number
    classified: number
    unclassified: number
    withAnomalies: number
    classificationRate: number
  }
  byTrack: {
    ejecutivo: number
    manager: number
    colaborador: number
  }
  unclassifiedPositions: Array<{
    position: string
    employeeCount: number
    suggestedLevel: string | null
    suggestedTrack: string
  }>
}

export default function JobClassificationGate({
  mode,
  accountId,
  onComplete,
  onCancel,
  className
}: JobClassificationGateProps) {
  const [data, setData] = useState<ClassificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = mode === 'admin' && accountId 
        ? `?accountId=${accountId}` 
        : ''
      const res = await fetch(`/api/job-classification/review${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
        // Celebración si 100%
        if (json.data.summary.classificationRate === 100) {
          setShowCelebration(true)
        }
      }
    } catch (error) {
      console.error('Error fetching classification data:', error)
    } finally {
      setLoading(false)
    }
  }, [mode, accountId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAssignComplete = () => {
    fetchData() // Refrescar datos
  }

  const canProceed = data?.summary.unclassified === 0

  if (loading) {
    return <ClassificationSkeleton />
  }

  return (
    <div className={className}>
      <ClassificationSummary
        data={data}
        onResolveClick={() => setShowDrawer(true)}
        onContinue={canProceed ? onComplete : undefined}
        onCancel={onCancel}
      />

      <AnimatePresence>
        {showDrawer && (
          <UnmappedPositionsDrawer
            positions={data?.unclassifiedPositions || []}
            accountId={accountId}
            onClose={() => setShowDrawer(false)}
            onAssignComplete={handleAssignComplete}
          />
        )}
      </AnimatePresence>

      {showCelebration && <CelebrationConfetti />}
    </div>
  )
}
```

## 3. Estilos FocalizaHR

### Colores y Gradientes

```typescript
// Colores por track
const TRACK_COLORS = {
  EJECUTIVO: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    gradient: 'from-purple-500 to-purple-600'
  },
  MANAGER: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30', 
    text: 'text-cyan-400',
    gradient: 'from-cyan-500 to-cyan-600'
  },
  COLABORADOR: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    gradient: 'from-blue-500 to-blue-600'
  }
}

// Gauge circular
const GAUGE_GRADIENT = 'from-cyan-400 via-blue-500 to-purple-500'
```

### Clases CSS a Usar

```typescript
// Cards con glassmorphism
const cardClasses = cn(
  'rounded-2xl p-6',
  'bg-slate-800/40 backdrop-blur-sm',
  'border border-white/5',
  'shadow-xl'
)

// Tesla Line
const teslaLineClasses = cn(
  'h-1 rounded-full',
  'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500',
  'opacity-60'
)

// Botón primario
const primaryButtonClasses = cn(
  'px-6 py-3 rounded-xl font-medium',
  'bg-gradient-to-r from-cyan-500 to-cyan-600',
  'hover:from-cyan-400 hover:to-cyan-500',
  'text-white shadow-lg shadow-cyan-500/25',
  'transition-all duration-200',
  'disabled:opacity-50 disabled:cursor-not-allowed'
)
```

## 4. Animaciones (Motion Design)

```typescript
// Timing según FILOSOFIA_DISENO_FOCALIZAHR_v2.md
const MOTION_TIMING = {
  fast: 0.2,      // Hover, button states
  medium: 0.3,    // Modal, drawer
  normal: 0.4,    // Page transitions
  storytelling: 0.8  // Celebración
}

// Drawer slide-in
const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: MOTION_TIMING.medium, ease: 'easeOut' }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: { duration: MOTION_TIMING.fast }
  }
}

// Card hover
const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: MOTION_TIMING.fast }
  }
}
```

## 5. Niveles para Selector

```typescript
const JOB_LEVELS = [
  { value: 'gerente_director', label: 'Gerente / Director', track: 'EJECUTIVO' },
  { value: 'subgerente_subdirector', label: 'Subgerente / Subdirector', track: 'MANAGER' },
  { value: 'jefe', label: 'Jefe / Head', track: 'MANAGER' },
  { value: 'supervisor_coordinador', label: 'Supervisor / Coordinador', track: 'MANAGER' },
  { value: 'profesional_analista', label: 'Profesional / Analista', track: 'COLABORADOR' },
  { value: 'asistente_otros', label: 'Asistente / Otros', track: 'COLABORADOR' },
  { value: 'operativo_auxiliar', label: 'Operativo / Auxiliar', track: 'COLABORADOR' }
]
```

## 6. Celebración Confetti

```typescript
// Usar react-confetti o implementación simple
import Confetti from 'react-confetti'

function CelebrationConfetti() {
  const [show, setShow] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 5000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!show) return null
  
  return (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      recycle={false}
      numberOfPieces={200}
      colors={['#22D3EE', '#A78BFA', '#3B82F6']} // Colores FocalizaHR
    />
  )
}
```

## 7. Dependencias Adicionales (si no están)

```bash
npm install react-confetti
# O alternativa: canvas-confetti
```
