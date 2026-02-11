# TASK_19: Sistema de Ciclos Históricos - Portal Evaluador

## 📋 METADATA
- **Fecha:** 2025-02-10
- **Prioridad:** Alta
- **Estimación:** 2-3 horas
- **Tipo:** Feature Enhancement
- **Aprobado por:** Victor (CEO) + Gemini (Validación Arquitectónica)

---

## 🎯 OBJETIVO

Implementar un **Dashboard Bimodal** que permita al evaluador (jefe) consultar sus evaluaciones de ciclos cerrados, manteniendo el foco en el ciclo activo cuando existe.

### Problema Actual
- La API `/api/evaluator/assignments` filtra `status: 'ACTIVE'` únicamente
- Cuando un ciclo se cierra, el evaluador ve "Sin ciclo activo"
- Se pierde acceso a todo el historial de evaluaciones completadas

### Solución
- Abrir filtro en backend para incluir `COMPLETED`, `IN_REVIEW`
- Frontend bimodal: Modo Guerra (activo) vs Modo Histórico
- Reutilización 100% de UI existente

---

## 🏗️ ARQUITECTURA APROBADA

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTER BIMODAL (Server)                       │
│                  /dashboard/evaluaciones                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │  ¿Hay ciclo ACTIVE? │──YES─▶│  ActiveCycleHero    │          │
│  │                     │       │  (Modo Guerra)      │          │
│  └─────────────────────┘       │                     │          │
│           │                    │  - EvaluatorDashboard           │
│           NO                   │  - Link "Ver Historial"         │
│           │                    └─────────────────────┘          │
│           ▼                                                      │
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │  ?mode=history      │──OR──▶│  HistoryGrid        │          │
│  │                     │       │  (Modo Consulta)    │          │
│  └─────────────────────┘       │                     │          │
│                                │  - Grid de ciclos   │          │
│                                │  - Click → Detalle  │          │
│                                └─────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 PROTOCOLOS DE SEGURIDAD (CRÍTICO)

### Contexto: ¿Por qué NO usa Filtrado Jerárquico RBAC?

El Portal del Evaluador tiene un modelo de seguridad **diferente** al RBAC departamental:

| Sistema | Filtro Base | Lógica |
|---------|-------------|--------|
| RBAC (AuthorizationService) | `departmentId` + hijos | "Ve solo su gerencia" |
| Portal Evaluador | `evaluatorId` | "Ve solo SUS evaluaciones" |

El evaluador ve únicamente las evaluaciones donde ÉL es el evaluador, independientemente de su rol RBAC.
Esto ya está implementado en la API actual con `evaluatorId: employee.id`.

### 1. API Solo Lectura
```typescript
// ❌ PROHIBIDO: Nunca agregar POST/PUT/PATCH a rutas históricas
// ✅ OBLIGATORIO: Solo GET para consulta de históricos
// Los datos de evaluaciones pasadas son INMUTABLES
```

### 2. Triple Validación de Seguridad (Obligatoria)

```typescript
// PASO 1: Multi-Tenant - Ciclo pertenece a la empresa del usuario
const cycle = await prisma.performanceCycle.findFirst({
  where: {
    id: cycleId,
    accountId: userContext.accountId,  // ← CRÍTICO: Previene ID Harvesting
    status: { in: ['ACTIVE', 'COMPLETED', 'IN_REVIEW'] }
  }
})

if (!cycle) {
  return NextResponse.json(
    { success: false, error: 'Ciclo no encontrado' },
    { status: 404 }
  )
}

// PASO 2: Evaluator-Based - Usuario tiene assignments en ese ciclo
const hasAssignments = await prisma.evaluationAssignment.findFirst({
  where: {
    cycleId,
    evaluatorId: employee.id,
    accountId: userContext.accountId
  }
})

if (!hasAssignments) {
  return NextResponse.json(
    { success: false, error: 'Sin acceso a este ciclo' },
    { status: 403 }
  )
}

// PASO 3: Solo retornar assignments del evaluador actual
const assignments = await prisma.evaluationAssignment.findMany({
  where: {
    cycleId,
    evaluatorId: employee.id,  // ← Solo SUS evaluaciones
    accountId: userContext.accountId
  }
})
```

### 3. Ataques Prevenidos

| Ataque | Prevención |
|--------|------------|
| ID Harvesting | `accountId` en WHERE del ciclo |
| Cross-Tenant | Multi-tenant en TODAS las queries |
| Escalación de Privilegios | `evaluatorId: employee.id` fijo |
| Modificación de Históricos | Solo métodos GET permitidos |
| Enumeration | 404 genérico si ciclo no existe O no tiene acceso |

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

### BACKEND (1 archivo a modificar)

#### 1. `src/app/api/evaluator/assignments/route.ts`
**Acción:** MODIFICAR
**Cambio:** Agregar soporte para `cycleId` query param

```typescript
// AGREGAR después de obtener userContext (línea ~30)

const { searchParams } = new URL(request.url)
const cycleIdParam = searchParams.get('cycleId')

const now = new Date()
let targetCycle

if (cycleIdParam) {
  // ═══════════════════════════════════════════════════════════════
  // MODO HISTÓRICO: Ciclo específico (puede ser COMPLETED)
  // ═══════════════════════════════════════════════════════════════
  targetCycle = await prisma.performanceCycle.findFirst({
    where: {
      id: cycleIdParam,
      accountId: userContext.accountId,  // ← SEGURIDAD: Validar ownership
      status: { in: ['ACTIVE', 'COMPLETED', 'IN_REVIEW'] }
    },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      cycleType: true,
      status: true  // ← Agregar status para UI
    }
  })

  if (!targetCycle) {
    return NextResponse.json(
      { success: false, error: 'Ciclo no encontrado o sin acceso' },
      { status: 404 }
    )
  }
} else {
  // ═══════════════════════════════════════════════════════════════
  // MODO ACTUAL: Buscar ciclo activo (comportamiento original)
  // ═══════════════════════════════════════════════════════════════
  targetCycle = await prisma.performanceCycle.findFirst({
    where: {
      accountId: userContext.accountId,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now }
    },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      cycleType: true,
      status: true
    }
  })
}

// REEMPLAZAR la variable activeCycle por targetCycle en el resto del código
// Cambiar: if (activeCycle) { whereClause.cycleId = activeCycle.id }
// Por:     if (targetCycle) { whereClause.cycleId = targetCycle.id }
```

**Cambio en Response:** Agregar `isHistoryMode` al response

```typescript
return NextResponse.json({
  success: true,
  cycle: targetCycle ? {
    id: targetCycle.id,
    name: targetCycle.name,
    description: targetCycle.description,
    startDate: targetCycle.startDate.toISOString(),
    endDate: targetCycle.endDate.toISOString(),
    status: targetCycle.status,  // ← NUEVO
    isHistoryMode: targetCycle.status !== 'ACTIVE',  // ← NUEVO
    daysRemaining: targetCycle.status === 'ACTIVE' 
      ? Math.max(0, Math.ceil((targetCycle.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
  } : null,
  assignments: mappedAssignments,
  stats: { total: mappedAssignments.length, completed, pending },
  employee: { id: employee.id, fullName: employee.fullName, position: employee.position }
});
```

---

### FRONTEND (5 archivos nuevos + 1 a modificar)

#### 1. `src/app/dashboard/evaluaciones/page.tsx`
**Acción:** REEMPLAZAR COMPLETAMENTE
**Rol:** Server Component - Router Bimodal

```typescript
// src/app/dashboard/evaluaciones/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import ActiveCycleHero from './components/ActiveCycleHero'
import HistoryGrid from './components/HistoryGrid'

interface Props {
  searchParams: { mode?: string }
}

export default async function EvaluadorPage({ searchParams }: Props) {
  // ═══════════════════════════════════════════════════════════════
  // 1. AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════════
  const cookieStore = cookies()
  const token = cookieStore.get('focalizahr_token')?.value
  
  if (!token) {
    redirect('/login?redirect=/dashboard/evaluaciones')
  }
  
  let decoded
  try {
    decoded = await verifyToken(token)
  } catch {
    redirect('/login?redirect=/dashboard/evaluaciones')
  }
  
  const accountId = decoded.accountId
  const userEmail = decoded.email
  
  // ═══════════════════════════════════════════════════════════════
  // 2. OBTENER EMPLOYEE DEL USUARIO
  // ═══════════════════════════════════════════════════════════════
  const employee = await prisma.employee.findFirst({
    where: {
      accountId,
      email: userEmail,
      status: 'ACTIVE'
    },
    select: { id: true }
  })
  
  if (!employee) {
    // Usuario no es empleado evaluador
    redirect('/dashboard')
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 3. BUSCAR CICLOS
  // ═══════════════════════════════════════════════════════════════
  const now = new Date()
  
  // Ciclo activo
  const activeCycle = await prisma.performanceCycle.findFirst({
    where: {
      accountId,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now }
    },
    select: {
      id: true,
      name: true,
      endDate: true
    }
  })
  
  // Ciclos históricos donde el usuario fue evaluador
  const pastCycles = await prisma.performanceCycle.findMany({
    where: {
      accountId,
      status: { in: ['COMPLETED', 'IN_REVIEW'] },
      assignments: {
        some: {
          evaluatorId: employee.id
        }
      }
    },
    select: {
      id: true,
      name: true,
      endDate: true,
      status: true,
      _count: {
        select: { assignments: true }
      }
    },
    orderBy: { endDate: 'desc' },
    take: 20
  })
  
  // ═══════════════════════════════════════════════════════════════
  // 4. DECIDIR MODO
  // ═══════════════════════════════════════════════════════════════
  const forceHistory = searchParams.mode === 'history'
  const showActiveMode = activeCycle && !forceHistory
  
  // ═══════════════════════════════════════════════════════════════
  // 5. RENDER BIMODAL
  // ═══════════════════════════════════════════════════════════════
  if (showActiveMode) {
    return (
      <ActiveCycleHero 
        cycleId={activeCycle.id}
        cycleName={activeCycle.name}
        endDate={activeCycle.endDate.toISOString()}
        hasPastCycles={pastCycles.length > 0}
      />
    )
  }
  
  return (
    <HistoryGrid 
      cycles={pastCycles.map(c => ({
        id: c.id,
        name: c.name,
        endDate: c.endDate.toISOString(),
        status: c.status,
        assignmentsCount: c._count.assignments
      }))}
      hasActiveCycle={!!activeCycle}
    />
  )
}
```

#### 2. `src/app/dashboard/evaluaciones/components/ActiveCycleHero.tsx`
**Acción:** CREAR
**Rol:** Wrapper para modo activo con link a historial

```typescript
// src/app/dashboard/evaluaciones/components/ActiveCycleHero.tsx
'use client'

import Link from 'next/link'
import { History } from 'lucide-react'
import EvaluatorDashboard from '@/components/evaluator/EvaluatorDashboard'

interface Props {
  cycleId: string
  cycleName: string
  endDate: string
  hasPastCycles: boolean
}

export default function ActiveCycleHero({ 
  cycleId, 
  cycleName, 
  endDate,
  hasPastCycles 
}: Props) {
  return (
    <div className="min-h-screen bg-[#0F172A] relative">
      {/* ═══════════════════════════════════════════════════════════
          Link discreto a historial (esquina superior derecha)
          Solo visible si hay ciclos pasados
          ═══════════════════════════════════════════════════════════ */}
      {hasPastCycles && (
        <div className="absolute top-4 right-4 z-50">
          <Link 
            href="/dashboard/evaluaciones?mode=history"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                       bg-slate-800/60 border border-slate-700/50
                       text-slate-400 hover:text-slate-200 
                       text-xs font-medium transition-all
                       hover:bg-slate-700/60 backdrop-blur-sm"
          >
            <History className="w-3.5 h-3.5" />
            Ver Historial
          </Link>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════
          Dashboard actual SIN CAMBIOS - Modo Focus
          ═══════════════════════════════════════════════════════════ */}
      <EvaluatorDashboard />
    </div>
  )
}
```

#### 3. `src/app/dashboard/evaluaciones/components/HistoryGrid.tsx`
**Acción:** CREAR
**Rol:** Grid de ciclos cerrados

```typescript
// src/app/dashboard/evaluaciones/components/HistoryGrid.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, FolderOpen } from 'lucide-react'
import CycleCard from './CycleCard'

interface Cycle {
  id: string
  name: string
  endDate: string
  status: string
  assignmentsCount: number
}

interface Props {
  cycles: Cycle[]
  hasActiveCycle: boolean
}

export default function HistoryGrid({ cycles, hasActiveCycle }: Props) {
  return (
    <div className="min-h-screen bg-[#0F172A] p-6">
      {/* ═══════════════════════════════════════════════════════════
          Header con navegación
          ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-white mb-1">
              Historial de Evaluaciones
            </h1>
            <p className="text-slate-400 text-sm">
              Consulta tus evaluaciones de ciclos anteriores
            </p>
          </div>
          
          {hasActiveCycle && (
            <Link 
              href="/dashboard/evaluaciones"
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-cyan-500/10 border border-cyan-500/30
                         text-cyan-400 hover:bg-cyan-500/20
                         text-sm font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Ciclo Activo
            </Link>
          )}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════
          Grid de ciclos cerrados
          ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto">
        {cycles.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No hay ciclos históricos disponibles</p>
            <p className="text-slate-500 text-sm mt-1">
              Tus evaluaciones completadas aparecerán aquí
            </p>
          </div>
        ) : (
          <motion.div 
            className="grid gap-4 md:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {cycles.map((cycle, idx) => (
              <CycleCard key={cycle.id} cycle={cycle} index={idx} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
```

#### 4. `src/app/dashboard/evaluaciones/components/CycleCard.tsx`
**Acción:** CREAR
**Rol:** Card individual de ciclo histórico

```typescript
// src/app/dashboard/evaluaciones/components/CycleCard.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Calendar, ChevronRight, Users } from 'lucide-react'

interface Props {
  cycle: {
    id: string
    name: string
    endDate: string
    status: string
    assignmentsCount: number
  }
  index: number
}

export default function CycleCard({ cycle, index }: Props) {
  const endDate = new Date(cycle.endDate)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link 
        href={`/dashboard/evaluaciones/historial/${cycle.id}`}
        className="block p-5 rounded-xl bg-slate-800/40 border border-slate-700/50
                   hover:bg-slate-800/60 hover:border-emerald-500/30
                   transition-all group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Badge de estado */}
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-wide">
                {cycle.status === 'COMPLETED' ? 'Completado' : 'En Revisión'}
              </span>
            </div>
            
            {/* Nombre del ciclo */}
            <h3 className="text-lg font-medium text-white mb-2 
                           group-hover:text-emerald-300 transition-colors">
              {cycle.name}
            </h3>
            
            {/* Metadata */}
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Cerrado {endDate.toLocaleDateString('es-CL', { 
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{cycle.assignmentsCount} evaluaciones</span>
              </div>
            </div>
          </div>
          
          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-slate-500 mt-1
                                    group-hover:text-emerald-400 
                                    group-hover:translate-x-1 
                                    transition-all" />
        </div>
      </Link>
    </motion.div>
  )
}
```

#### 5. `src/app/dashboard/evaluaciones/components/HistoryModeBanner.tsx`
**Acción:** CREAR
**Rol:** Banner sticky para indicar modo consulta

```typescript
// src/app/dashboard/evaluaciones/components/HistoryModeBanner.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, Archive } from 'lucide-react'

interface Props {
  cycleName: string
  endDate: string
  hasActiveCycle: boolean
}

export default function HistoryModeBanner({ cycleName, endDate, hasActiveCycle }: Props) {
  const formattedDate = new Date(endDate).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
            <Archive className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-200 text-sm font-medium">
              Modo Consulta: {cycleName}
            </p>
            <p className="text-amber-300/60 text-xs">
              Cerrado el {formattedDate}
            </p>
          </div>
        </div>
        
        {hasActiveCycle ? (
          <Link 
            href="/dashboard/evaluaciones"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-amber-300 hover:text-amber-100 
                       text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ir a Ciclo Activo
          </Link>
        ) : (
          <Link 
            href="/dashboard/evaluaciones?mode=history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-amber-300 hover:text-amber-100 
                       text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver Todos
          </Link>
        )}
      </div>
    </div>
  )
}
```

#### 6. `src/app/dashboard/evaluaciones/historial/[cycleId]/page.tsx`
**Acción:** CREAR
**Rol:** Página de detalle de ciclo histórico

```typescript
// src/app/dashboard/evaluaciones/historial/[cycleId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import EvaluatorDashboard from '@/components/evaluator/EvaluatorDashboard'
import HistoryModeBanner from '../../components/HistoryModeBanner'

export default function HistoryCyclePage() {
  const params = useParams()
  const cycleId = params.cycleId as string
  
  const [cycleInfo, setCycleInfo] = useState<{
    name: string
    endDate: string
  } | null>(null)
  
  const [hasActiveCycle, setHasActiveCycle] = useState(false)

  // Obtener info del ciclo para el banner
  useEffect(() => {
    async function fetchCycleInfo() {
      try {
        const token = localStorage.getItem('focalizahr_token')
        if (!token) return

        const res = await fetch(`/api/evaluator/assignments?cycleId=${cycleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const json = await res.json()
          if (json.success && json.cycle) {
            setCycleInfo({
              name: json.cycle.name,
              endDate: json.cycle.endDate
            })
          }
        }

        // Verificar si hay ciclo activo
        const activeRes = await fetch('/api/evaluator/assignments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (activeRes.ok) {
          const activeJson = await activeRes.json()
          setHasActiveCycle(activeJson.cycle?.status === 'ACTIVE')
        }
      } catch (err) {
        console.error('Error fetching cycle info:', err)
      }
    }

    fetchCycleInfo()
  }, [cycleId])

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Banner sticky de modo consulta */}
      {cycleInfo && (
        <HistoryModeBanner 
          cycleName={cycleInfo.name}
          endDate={cycleInfo.endDate}
          hasActiveCycle={hasActiveCycle}
        />
      )}
      
      {/* Dashboard reutilizado con cycleId específico */}
      <EvaluatorDashboard 
        cycleId={cycleId} 
        isHistoryMode={true}
      />
    </div>
  )
}
```

#### 7. `src/components/evaluator/EvaluatorDashboard.tsx`
**Acción:** MODIFICAR
**Cambio:** Agregar props opcionales `cycleId` e `isHistoryMode`

```typescript
// AGREGAR a las props del componente (línea ~15)
interface EvaluatorDashboardProps {
  cycleId?: string        // Si se pasa, usa este ciclo en lugar de buscar activo
  isHistoryMode?: boolean // Si true, oculta acciones de edición
}

export default function EvaluatorDashboard({ 
  cycleId: propCycleId,
  isHistoryMode = false 
}: EvaluatorDashboardProps) {

// MODIFICAR el fetch de assignments (línea ~45)
// Cambiar:
const res = await fetch('/api/evaluator/assignments', { ... })

// Por:
const url = propCycleId 
  ? `/api/evaluator/assignments?cycleId=${propCycleId}`
  : '/api/evaluator/assignments'

const res = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

// AGREGAR después del estado de error (línea ~80)
// Si es modo histórico y no hay ciclo, mostrar mensaje apropiado
if (!cycle && isHistoryMode) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="fhr-card p-8 text-center max-w-md">
        <Archive className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-200 mb-2">
          Ciclo No Disponible
        </h2>
        <p className="text-slate-400">
          Este ciclo ya no está disponible para consulta.
        </p>
      </div>
    </div>
  )
}

// AGREGAR import al inicio
import { Archive } from 'lucide-react'
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Backend
- [ ] API `/api/evaluator/assignments` acepta `?cycleId=xxx`
- [ ] Valida que `cycleId` pertenece al `accountId` del token
- [ ] Filtra por `status: { in: ['ACTIVE', 'COMPLETED', 'IN_REVIEW'] }`
- [ ] Retorna `isHistoryMode: true` cuando ciclo no es ACTIVE
- [ ] NO permite POST/PUT/PATCH en históricos

### Frontend - Router
- [ ] `/dashboard/evaluaciones` detecta ciclo activo vs histórico
- [ ] `?mode=history` fuerza modo histórico
- [ ] Redirige a login si no hay token

### Frontend - Modo Guerra
- [ ] Muestra `EvaluatorDashboard` normal
- [ ] Link "Ver Historial" solo si hay ciclos pasados
- [ ] Link es discreto (esquina superior derecha)

### Frontend - Modo Histórico
- [ ] Grid muestra ciclos cerrados ordenados por fecha
- [ ] Cards muestran estado, fecha, cantidad de evaluaciones
- [ ] Click en card navega a `/historial/[cycleId]`
- [ ] Botón "Volver a Ciclo Activo" visible si aplica

### Frontend - Detalle Histórico
- [ ] Banner sticky "Modo Consulta" siempre visible
- [ ] Dashboard muestra datos del ciclo seleccionado
- [ ] NO muestra botón "Evaluar" (ya están completados)
- [ ] Summary page funciona correctamente

### Seguridad
- [ ] No se puede acceder a ciclos de otras cuentas
- [ ] No se puede acceder a ciclos donde no se es evaluador
- [ ] Respuestas son inmutables (solo lectura)

---

## 🚀 PROMPT DE EJECUCIÓN

```
TASK_19: Implementar Sistema de Ciclos Históricos - Portal Evaluador

CONTEXTO:
- El portal del evaluador (/dashboard/evaluaciones) solo muestra ciclos ACTIVE
- Cuando un ciclo se cierra, el evaluador pierde acceso a su historial
- Los datos existen en la tabla Response, solo falta abrir el filtro

OBJETIVO:
Implementar un Dashboard Bimodal que permita:
1. Modo Guerra: Si hay ciclo activo, mostrar UI actual + link discreto a historial
2. Modo Histórico: Grid de ciclos cerrados con navegación a detalle

ARCHIVOS A MODIFICAR:
1. src/app/api/evaluator/assignments/route.ts - Agregar soporte cycleId param

ARCHIVOS A CREAR:
1. src/app/dashboard/evaluaciones/page.tsx - Router bimodal (Server Component)
2. src/app/dashboard/evaluaciones/components/ActiveCycleHero.tsx
3. src/app/dashboard/evaluaciones/components/HistoryGrid.tsx
4. src/app/dashboard/evaluaciones/components/CycleCard.tsx
5. src/app/dashboard/evaluaciones/components/HistoryModeBanner.tsx
6. src/app/dashboard/evaluaciones/historial/[cycleId]/page.tsx

ARCHIVOS A MODIFICAR (MENOR):
1. src/components/evaluator/EvaluatorDashboard.tsx - Agregar props cycleId, isHistoryMode

PROTOCOLOS DE SEGURIDAD (CRÍTICO):
- Validar ownership: cycleId debe pertenecer a accountId del token
- Validar acceso: Usuario debe ser evaluador en ese ciclo
- Solo lectura: No permitir modificaciones en históricos

ORDEN DE IMPLEMENTACIÓN:
1. Backend: Modificar API assignments
2. Frontend: Crear componentes wrapper (ActiveCycleHero, HistoryGrid, etc.)
3. Frontend: Crear página historial/[cycleId]
4. Frontend: Modificar EvaluatorDashboard para aceptar props
5. Frontend: Reemplazar page.tsx con router bimodal
6. Testing: Verificar flujos completos

NOTAS:
- Usar estilos FocalizaHR existentes (.fhr-*, colores cyan/purple)
- Banner histórico usa amber para diferenciación visual
- Reutilizar 100% de UI existente, solo cambiar fuente de datos
```

---

## 🤖 PROMPT OPTIMIZADO PARA CLAUDE CODE

Copiar y pegar este prompt en Claude Code para ejecutar la tarea:

```markdown
# EJECUTAR TASK_19: Sistema Ciclos Históricos - Portal Evaluador

## INSTRUCCIÓN PRINCIPAL
Implementar sistema bimodal para que evaluadores puedan consultar ciclos históricos de evaluación de desempeño.

## LEER PRIMERO (OBLIGATORIO)
1. `.claude/tasks/TASK_19_CICLOS_HISTORICOS_EVALUADOR.md` - Especificación completa
2. `src/app/api/evaluator/assignments/route.ts` - API actual a modificar
3. `src/components/evaluator/EvaluatorDashboard.tsx` - Componente a extender

## SECUENCIA DE IMPLEMENTACIÓN

### FASE 1: Backend (Crítica)
Modificar `/api/evaluator/assignments/route.ts`:
- Agregar query param `cycleId` opcional
- Si cycleId presente: buscar ciclo específico (ACTIVE, COMPLETED, IN_REVIEW)
- Si cycleId ausente: comportamiento actual (buscar ciclo ACTIVE)
- SEGURIDAD: Validar accountId + evaluatorId en TODAS las queries
- Agregar `isHistoryMode: boolean` y `status: string` al response

### FASE 2: Componentes Frontend
Crear en `src/app/dashboard/evaluaciones/components/`:
1. `ActiveCycleHero.tsx` - Wrapper con link a historial
2. `HistoryGrid.tsx` - Grid de ciclos cerrados
3. `CycleCard.tsx` - Card individual clickeable
4. `HistoryModeBanner.tsx` - Banner sticky amber

### FASE 3: Páginas
1. Crear `src/app/dashboard/evaluaciones/historial/[cycleId]/page.tsx`
2. Modificar `src/components/evaluator/EvaluatorDashboard.tsx` (agregar props)
3. Reemplazar `src/app/dashboard/evaluaciones/page.tsx` con router bimodal

## REGLAS DE SEGURIDAD (NO NEGOCIABLES)
```typescript
// SIEMPRE incluir en queries de ciclos históricos:
where: {
  id: cycleIdParam,
  accountId: userContext.accountId,  // Multi-tenant
  status: { in: ['ACTIVE', 'COMPLETED', 'IN_REVIEW'] }
}

// SIEMPRE validar acceso del evaluador:
const hasAccess = await prisma.evaluationAssignment.findFirst({
  where: {
    cycleId,
    evaluatorId: employee.id,
    accountId: userContext.accountId
  }
})
if (!hasAccess) return 403
```

## ESTILOS
- Usar clases FocalizaHR existentes: `.fhr-card`, `.fhr-btn-*`, etc.
- Colores: cyan (#22D3EE) para activo, emerald para completado, amber para modo consulta
- Animaciones: framer-motion para transiciones

## VALIDACIÓN FINAL
- [ ] Ciclo activo muestra UI actual + link historial (si hay históricos)
- [ ] Sin ciclo activo muestra grid de históricos
- [ ] Click en card histórico navega a detalle
- [ ] Banner sticky visible en modo consulta
- [ ] No se puede acceder a ciclos de otra empresa
- [ ] No se puede acceder a ciclos donde no se es evaluador

## NO HACER
- No modificar lógica de cálculo de scores
- No crear nuevas tablas
- No modificar Response ni EvaluationAssignment
- No agregar POST/PUT/PATCH a rutas históricas
```

---

## 📚 DOCUMENTOS DE REFERENCIA

- `GUIA_MAESTRA_TECNICA_FOCALIZAHR_ENTERPRISE_v3_5_2.md` - Arquitectura general
- `GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md` - Sistema de seguridad
- `IMPLEMENTACION_POST_BACKEND_PERFORMANCE_v1.md` - Portal evaluador original
- `src/components/evaluator/EvaluatorDashboard.tsx` - Componente a reutilizar
- `src/app/api/evaluator/assignments/route.ts` - API a modificar
