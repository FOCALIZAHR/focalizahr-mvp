# 🎬 TASK: PORTAL DEL JEFE "CINEMA MODE" v3.0

## Control del Documento
| Campo | Valor |
|-------|-------|
| **Versión** | 3.0 |
| **Fecha** | Febrero 2025 |
| **Ruta** | `/dashboard/evaluaciones` |
| **Prioridad** | ALTA |
| **Complejidad** | ALTA |
| **Tiempo Estimado** | 2-3 días |

---

## 1. CONTEXTO Y FILOSOFÍA

### 1.1 El Problema Actual

El portal actual muestra **13 personas al mismo nivel**, violando la filosofía FocalizaHR:

```
ACTUAL (INCORRECTO):
┌─────┬─────┬─────┬─────┬─────┐
│  A  │  B  │  C  │  D  │  E  │  ← 13 "protagonistas"
├─────┼─────┼─────┼─────┼─────┤
│  F  │  G  │  H  │  I  │  J  │  ← 13 botones "Evaluar"
└─────┴─────┴─────┴─────┴─────┘

Resultado: Parálisis de decisión
```

### 1.2 La Solución: Cinema Mode

**Arquitectura "Single Focus with Contextual Navigation":**

- **UN protagonista** a la vez (Hero)
- **UN CTA** visible (Evaluar ahora)
- **Navegación contextual** (Carrusel Netflix)
- **Progressive Disclosure** (Lobby → Spotlight → Victory)

### 1.3 Principios FocalizaHR Aplicados

| Principio | Implementación |
|-----------|----------------|
| Entender 3s | Anillo "15%" + "11 pendientes" |
| Decidir 10s | "¿Comienzo ahora?" |
| Actuar 1 clic | Botón único "COMENZAR CON: [NOMBRE]" |
| Sin leyendas | Badges con TEXTO autoexplicativo |
| Línea Tesla | En cada card del carrusel |

---

## 2. ARQUITECTURA VISUAL

### 2.1 Layout General

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                          ┃
┃                                                                          ┃
┃                                                                          ┃
┃                         ZONA HERO (70% vh)                               ┃
┃                                                                          ┃
┃                    Cambia según estado:                                  ┃
┃                    - Lobby (Mission Control)                             ┃
┃                    - Spotlight (Foco en persona)                         ┃
┃                    - Victory (100% completado)                           ┃
┃                                                                          ┃
┃                                                                          ┃
┃                                                                          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                          ┃
┃                         ZONA RAIL (30% vh)                               ┃
┃                                                                          ┃
┃                    Carrusel Netflix - Siempre visible                    ┃
┃                                                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 2.2 División de Pantalla

```css
/* Layout principal */
.cinema-mode-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Sin scroll global */
}

.hero-zone {
  flex: 7; /* 70% */
  display: flex;
  align-items: center;
  justify-content: center;
}

.rail-zone {
  flex: 3; /* 30% */
  border-top: 1px solid rgba(51, 65, 85, 0.3);
}
```

---

## 3. ESTADO A: LOBBY ("Mission Control")

### 3.1 Descripción

Estado inicial al entrar. Muestra resumen global antes de comenzar.

**Filosofía:** "Tranquilo, tienes el control. Aquí está tu panorama."

### 3.2 Diseño Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ══════════════════════════════════════════════════════ (línea Tesla)   │
│                                                                          │
│                                                                          │
│                         EVALUACIÓN ANUAL 2026                            │
│                      27 enero - 19 febrero                               │
│                                                                          │
│                                                                          │
│                           ╭──────────────╮                               │
│                          ╱                ╲                              │
│                         │   ██░░░░░░░░░░   │   ← Anillo segmentado      │
│                         │   ██░░░░░░░░░░   │     (1 segmento = 1 persona)│
│                         │       15%        │                             │
│                         │    Completado    │                             │
│                          ╲                ╱                              │
│                           ╰──────────────╯                               │
│                                                                          │
│                   11 pendientes  ·  ~1h 50m estimados                    │
│                                                                          │
│                                                                          │
│                  ╔══════════════════════════════════╗                    │
│                  ║  ▶  COMENZAR CON: ANDRÉS SOTO   ║   ← CTA único      │
│                  ╚══════════════════════════════════╝                    │
│                                                                          │
│                                                                          │
│                      ⚠️ 19 días restantes                                │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Componentes del Lobby

#### 3.3.1 Anillo de Progreso Segmentado

```tsx
interface ProgressRingProps {
  total: number           // Total personas (ej: 13)
  completed: number       // Completadas (ej: 2)
  size?: number          // Tamaño en px (default: 200)
}

// Cada segmento representa 1 persona
// Completadas: Cyan (#22D3EE)
// Pendientes: Slate-800/20
```

**Especificación visual:**
- SVG circular con `stroke-dasharray` para segmentos
- Gap entre segmentos: 2-3 grados
- Animación de entrada: draw-in progresivo
- Centro: Porcentaje gigante + "Completado"

#### 3.3.2 Stats Line

```tsx
interface StatsLineProps {
  pending: number         // Evaluaciones pendientes
  estimatedMinutes: number // Tiempo total estimado
}

// Formato: "11 pendientes · ~1h 50m estimados"
// Calcular: pending * 10 minutos por evaluación
```

#### 3.3.3 Botón CTA Principal

```tsx
interface LobbyCtaProps {
  priorityEmployee: {
    id: string
    fullName: string
  }
  onStart: (employeeId: string) => void
}

// Usar <PrimaryButton> del design system
// Texto: "▶ COMENZAR CON: {NOMBRE}"
// Glow effect cyan
```

#### 3.3.4 Badge de Urgencia

```tsx
interface UrgencyBadgeProps {
  daysRemaining: number
}

// daysRemaining <= 3: Rojo + animate-pulse
// daysRemaining <= 7: Amber
// daysRemaining > 7: Cyan
```

---

## 4. ESTADO B: SPOTLIGHT ("The Deep Dive")

### 4.1 Descripción

Se activa al:
- Hacer clic en "COMENZAR CON: X" desde Lobby
- Seleccionar una card del Carrusel

**Filosofía:** "Conoce a quien vas a evaluar. Toda la info relevante."

### 4.2 Diseño Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ══════════════════════════════════════════════════════ (línea Tesla)   │
│                                                                          │
│                                                                          │
│         ┌─────────────────────────────────────────────────────┐          │
│         │                                                     │          │
│         │      ┌────────┐                                     │          │
│         │      │        │                                     │          │
│         │      │   AS   │     Andrés Soto                     │          │
│         │      │        │     Coordinador                     │          │
│         │      └────────┘     Departamentos sin Asignar       │          │
│         │                                                     │          │
│         │  ─────────────────────────────────────────────────  │          │
│         │                                                     │          │
│         │  📅  2 años 3 meses en la empresa                   │          │
│         │                                                     │          │
│         │  ✓   Autoevaluación completada hace 2 horas         │          │
│         │                                                     │          │
│         │                                                     │          │
│         │     ╔═══════════════════════════════════════╗       │          │
│         │     ║       ⚡ EVALUAR AHORA                ║       │          │
│         │     ╚═══════════════════════════════════════╝       │          │
│         │                                                     │          │
│         │                     ~10 min                         │          │
│         │                                                     │          │
│         └─────────────────────────────────────────────────────┘          │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Componentes del Spotlight

#### 4.3.1 SpotlightCard

```tsx
interface SpotlightCardProps {
  employee: {
    id: string
    fullName: string
    position: string | null
    departmentName: string
    tenure: string           // "2 años 3 meses"
  }
  insights: SpotlightInsight[]
  onEvaluate: () => void
  estimatedMinutes?: number  // Default: 10
}

interface SpotlightInsight {
  icon: LucideIcon
  text: string
  variant: 'info' | 'success' | 'warning'
}
```

#### 4.3.2 Insights Dinámicos

| Condición | Icono | Texto | Variante |
|-----------|-------|-------|----------|
| `tenure < 6 meses` | `Sparkles` | "Recién llegado, 3 meses" | info |
| `tenure > 5 años` | `Award` | "Veterano, 5+ años" | info |
| `selfCompleted` | `CheckCircle` | "Autoevaluación completada" | success |
| `selfPending` | `Clock` | "Esperando autoevaluación" | warning |
| `isInProgress` | `Edit` | "Borrador guardado" | info |

#### 4.3.3 Avatar Grande

```tsx
// Si existe foto: mostrar foto
// Si no: iniciales sobre fondo slate-700
// Tamaño: w-20 h-20 (80px)
// Borde sutil: border-2 border-slate-600
```

---

## 5. ESTADO C: VICTORY ("Celebration")

### 5.1 Descripción

Se activa automáticamente cuando `stats.pending === 0`.

**Filosofía:** "Celebra el logro. Refuerzo positivo."

### 5.2 Diseño Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ══════════════════════════════════════════════════════ (línea Tesla)   │
│                                                                          │
│                                                                          │
│                                                                          │
│                               🎉                                         │
│                                                                          │
│                                                                          │
│                      ¡Misión Cumplida!                                   │
│                                                                          │
│                                                                          │
│              Tu feedback ayudará a desarrollar                           │
│              el potencial de 13 colaboradores                            │
│                                                                          │
│                                                                          │
│                                                                          │
│                   ╔═══════════════════════════╗                          │
│                   ║   Ver mis evaluaciones    ║                          │
│                   ╚═══════════════════════════╝                          │
│                                                                          │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Componentes Victory

```tsx
interface VictoryHeroProps {
  totalCompleted: number
  onViewAll: () => void
}

// Animaciones:
// - Confetti sutil (particles)
// - Emoji scale bounce
// - Texto fade-in escalonado
```

---

## 6. CARRUSEL NETFLIX (RAIL)

### 6.1 Descripción

Navegación horizontal siempre visible. **Cards grandes con información completa.**

**Filosofía:** "Escanea tu equipo de un vistazo sin seleccionar uno por uno."

### 6.2 Diseño Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│   │ ════════════  │  │ ════════════  │  │ ════════════  │               │
│   │               │  │               │  │               │               │
│   │      ┌──┐     │  │      ┌──┐     │  │      ┌──┐     │               │
│   │      │AS│     │  │      │MG│     │  │      │JP│     │      ...      │
│   │      └──┘     │  │      └──┘     │  │      └──┘     │               │
│   │               │  │               │  │               │               │
│   ├───────────────┤  ├───────────────┤  ├───────────────┤               │
│   │ Andrés Soto   │  │ María González│  │ Juan Pérez    │               │
│   │ Coordinador   │  │ Analista Sr   │  │ Supervisor    │               │
│   │               │  │               │  │               │               │
│   │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │               │
│   │ │⚡Listo    │ │  │ │⚡Listo    │ │  │ │🕐 Espera  │ │               │
│   │ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │               │
│   │               │  │               │  │               │               │
│   └───────────────┘  └───────────────┘  └───────────────┘               │
│                                                                          │
│                              ← swipe / scroll →                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Anatomía de la Card

```
┌─────────────────────────────────────┐
│  ════════════════════════════════   │  ← Línea Tesla (color según estado)
│                                     │
│              ┌────────┐             │
│              │        │             │
│              │   AS   │             │  ← Avatar (foto o iniciales)
│              │        │             │     w-16 h-16 (64px)
│              └────────┘             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         Andrés Soto                 │  ← Nombre (font-medium)
│         Coordinador                 │  ← Cargo (text-slate-400)
│                                     │
│      ┌─────────────────────┐        │
│      │  ⚡ Listo para ti   │        │  ← Badge semántico
│      └─────────────────────┘        │     (Lucide icon + texto)
│                                     │
└─────────────────────────────────────┘

ANCHO: 160px (móvil) - 180px (desktop)
ALTO: Auto (contenido)
```

### 6.4 Estados de las Cards

| Estado | Línea Tesla | Badge | Icono Lucide | Acción |
|--------|-------------|-------|--------------|--------|
| Listo para evaluar | Cyan | "Listo para ti" | `Zap` | Click → Spotlight |
| Esperando auto | Slate-500 | "Espera auto" | `Clock` | Click → Spotlight (disabled action) |
| En progreso | Amber | "En progreso" | `Edit` | Click → Spotlight |
| Completada | Emerald | "Completada 4.2" | `CheckCircle` | Click → Modal resumen |

### 6.5 Card Seleccionada (Active State)

```css
/* Card normal */
.carousel-card {
  transform: scale(1);
  border: 1px solid rgba(51, 65, 85, 0.3);
  transition: all 0.2s ease-out;
}

/* Card seleccionada */
.carousel-card.selected {
  transform: scale(1.05);
  border-color: #22D3EE;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}
```

### 6.6 Responsive

| Breakpoint | Cards Visibles | Card Width |
|------------|----------------|------------|
| Mobile (< 640px) | 2.5 | 140px |
| Tablet (640-1024px) | 4 | 160px |
| Desktop (> 1024px) | 5-6 | 180px |

### 6.7 Scroll Behavior

```css
.carousel-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.carousel-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.carousel-card {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

---

## 7. LÓGICA DE PRIORIZACIÓN

### 7.1 Algoritmo para `priorityEmployeeId`

```typescript
function calculatePriorityEmployee(
  assignments: Assignment[],
  cycle: Cycle
): Assignment {
  // 1. Primero: En progreso (continuidad)
  const inProgress = assignments.find(a => a.status === 'in_progress')
  if (inProgress) return inProgress

  // 2. Segundo: Urgencia (< 3 días)
  if (cycle.daysRemaining <= 3) {
    // Ordenar por antigüedad descendente (veteranos primero)
    const pending = assignments
      .filter(a => a.status === 'pending')
      .sort((a, b) => compareTenure(b.tenure, a.tenure))
    if (pending.length > 0) return pending[0]
  }

  // 3. Tercero: Autoevaluación completada (ready for manager)
  const readyForManager = assignments.find(a => 
    a.status === 'pending' && a.selfEvaluationStatus === 'completed'
  )
  if (readyForManager) return readyForManager

  // 4. Default: Primer pendiente alfabéticamente
  const firstPending = assignments
    .filter(a => a.status === 'pending')
    .sort((a, b) => a.evaluatee.fullName.localeCompare(b.evaluatee.fullName))
  
  return firstPending[0]
}
```

### 7.2 Dónde Calcular

**Opción A (Recomendada):** Frontend - en el hook `useEvaluatorDashboard`
**Opción B (Futuro):** Backend - nuevo campo en `/api/evaluator/assignments`

---

## 8. ESTRUCTURA DE COMPONENTES

### 8.1 Árbol de Archivos

```
src/
├── app/
│   └── dashboard/
│       └── evaluaciones/
│           ├── page.tsx                    # Wrapper con auth
│           └── components/
│               └── ManagerCinemaMode.tsx   # Orquestador principal
│
├── components/
│   └── evaluator/
│       ├── cinema/
│       │   ├── LobbyHero.tsx              # Estado A: Mission Control
│       │   ├── SpotlightHero.tsx          # Estado B: Deep Dive
│       │   ├── VictoryHero.tsx            # Estado C: Celebration
│       │   ├── ProgressRing.tsx           # Anillo segmentado SVG
│       │   ├── StatsLine.tsx              # "11 pendientes · ~1h 50m"
│       │   ├── UrgencyBadge.tsx           # Badge días restantes
│       │   └── SpotlightInsights.tsx      # Lista de insights
│       │
│       ├── carousel/
│       │   ├── NetflixCarousel.tsx        # Container del carrusel
│       │   ├── EmployeeCard.tsx           # Card individual
│       │   └── EmployeeCardBadge.tsx      # Badge semántico
│       │
│       └── shared/
│           └── EmployeeAvatar.tsx         # Avatar foto/iniciales
│
└── hooks/
    └── useEvaluatorCinemaMode.ts          # Estado y lógica centralizada
```

### 8.2 Componente Orquestador

```tsx
// src/app/dashboard/evaluaciones/components/ManagerCinemaMode.tsx

'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import LobbyHero from '@/components/evaluator/cinema/LobbyHero'
import SpotlightHero from '@/components/evaluator/cinema/SpotlightHero'
import VictoryHero from '@/components/evaluator/cinema/VictoryHero'
import NetflixCarousel from '@/components/evaluator/carousel/NetflixCarousel'

import { useEvaluatorCinemaMode } from '@/hooks/useEvaluatorCinemaMode'

type ViewState = 'lobby' | 'spotlight' | 'victory'

export default function ManagerCinemaMode() {
  const {
    assignments,
    stats,
    cycle,
    priorityEmployee,
    selectedEmployee,
    setSelectedEmployee,
    isLoading,
    error
  } = useEvaluatorCinemaMode()

  // Determinar estado de vista
  const viewState: ViewState = 
    stats.pending === 0 ? 'victory' :
    selectedEmployee ? 'spotlight' :
    'lobby'

  // Handlers
  const handleStartWithPriority = useCallback(() => {
    if (priorityEmployee) {
      setSelectedEmployee(priorityEmployee.id)
    }
  }, [priorityEmployee, setSelectedEmployee])

  const handleSelectFromCarousel = useCallback((employeeId: string) => {
    setSelectedEmployee(employeeId)
  }, [setSelectedEmployee])

  const handleBackToLobby = useCallback(() => {
    setSelectedEmployee(null)
  }, [setSelectedEmployee])

  const handleEvaluate = useCallback((token: string) => {
    window.location.href = `/encuesta/${token}`
  }, [])

  if (isLoading) return <CinemaModeSkeleton />
  if (error) return <CinemaModeError error={error} />

  return (
    <div className="cinema-mode-container h-screen flex flex-col overflow-hidden bg-slate-950">
      {/* HERO ZONE (70%) */}
      <div className="flex-[7] flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {viewState === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LobbyHero
                cycle={cycle}
                stats={stats}
                priorityEmployee={priorityEmployee}
                onStart={handleStartWithPriority}
              />
            </motion.div>
          )}

          {viewState === 'spotlight' && selectedEmployee && (
            <motion.div
              key={`spotlight-${selectedEmployee.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <SpotlightHero
                employee={selectedEmployee}
                onEvaluate={handleEvaluate}
                onBack={handleBackToLobby}
              />
            </motion.div>
          )}

          {viewState === 'victory' && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <VictoryHero
                totalCompleted={stats.total}
                onViewAll={() => {/* Expandir carrusel o navegar */}}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RAIL ZONE (30%) */}
      <div className="flex-[3] border-t border-slate-800/50 bg-slate-900/50">
        <NetflixCarousel
          assignments={assignments}
          selectedId={selectedEmployee?.id}
          onSelect={handleSelectFromCarousel}
        />
      </div>
    </div>
  )
}
```

---

## 9. TIPOS TYPESCRIPT

### 9.1 Tipos Principales

```typescript
// src/types/evaluator-cinema.ts

import type { LucideIcon } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════
// DATOS DEL BACKEND (ya existen)
// ═══════════════════════════════════════════════════════════════════════

export interface EvaluatorAssignment {
  id: string
  status: 'pending' | 'in_progress' | 'completed'
  completedAt?: string
  evaluationType: string
  
  evaluatee: {
    id: string
    fullName: string
    position: string | null
    departmentName: string
    tenure: string  // "2 años 3 meses"
  }
  
  participantToken: string | null
  surveyUrl: string | null
}

export interface EvaluatorCycle {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  daysRemaining: number
}

export interface EvaluatorStats {
  total: number
  completed: number
  pending: number
}

// ═══════════════════════════════════════════════════════════════════════
// TIPOS CINEMA MODE (nuevos)
// ═══════════════════════════════════════════════════════════════════════

export type CinemaViewState = 'lobby' | 'spotlight' | 'victory'

export type EmployeeCardStatus = 
  | 'ready'       // Listo para evaluar (self completed o no aplica)
  | 'waiting'     // Esperando autoevaluación
  | 'in_progress' // En progreso (borrador guardado)
  | 'completed'   // Evaluación completada

export interface EmployeeCardData {
  id: string
  fullName: string
  position: string | null
  departmentName: string
  tenure: string
  status: EmployeeCardStatus
  avgScore?: number         // Solo si status === 'completed'
  participantToken: string | null
}

export interface SpotlightInsight {
  id: string
  icon: LucideIcon
  text: string
  variant: 'info' | 'success' | 'warning'
}

// ═══════════════════════════════════════════════════════════════════════
// PROPS DE COMPONENTES
// ═══════════════════════════════════════════════════════════════════════

export interface LobbyHeroProps {
  cycle: EvaluatorCycle
  stats: EvaluatorStats
  priorityEmployee: EmployeeCardData | null
  onStart: () => void
}

export interface SpotlightHeroProps {
  employee: EmployeeCardData
  insights: SpotlightInsight[]
  onEvaluate: (token: string) => void
  onBack: () => void
  estimatedMinutes?: number
}

export interface VictoryHeroProps {
  totalCompleted: number
  onViewAll: () => void
}

export interface NetflixCarouselProps {
  assignments: EmployeeCardData[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export interface EmployeeCardProps {
  data: EmployeeCardData
  isSelected: boolean
  onClick: () => void
}

export interface ProgressRingProps {
  total: number
  completed: number
  size?: number
  strokeWidth?: number
}
```

---

## 10. DATOS: REALES vs SIMULAR

### 10.1 Datos YA Disponibles del Backend

| Dato | Endpoint | Campo |
|------|----------|-------|
| Lista de asignaciones | `GET /api/evaluator/assignments` | `assignments[]` |
| Nombre completo | ↑ | `evaluatee.fullName` |
| Cargo | ↑ | `evaluatee.position` |
| Departamento | ↑ | `evaluatee.departmentName` |
| Antigüedad | ↑ | `evaluatee.tenure` |
| Estado | ↑ | `status` |
| Token encuesta | ↑ | `participantToken` |
| Stats totales | ↑ | `stats.total/completed/pending` |
| Ciclo activo | ↑ | `cycle.*` |
| Días restantes | ↑ | `cycle.daysRemaining` |
| Score (completadas) | `GET /api/evaluator/assignments/[id]/summary` | `averageScore` |

### 10.2 Datos a CALCULAR en Frontend

| Dato | Cómo calcular |
|------|---------------|
| `priorityEmployeeId` | Algoritmo de priorización (sección 7) |
| `estimatedMinutes` | `stats.pending * 10` |
| `cardStatus` | Mapear desde `assignment.status` |

### 10.3 Datos a SIMULAR Temporalmente

| Dato | Simulación | Futuro Backend |
|------|------------|----------------|
| `selfEvaluationStatus` | Asumir 'completed' si ready | Agregar a Assignment |
| `lastEvaluationDate` | No mostrar | Histórico de ciclos |
| `gapAnalysis` | No mostrar | Performance Results |

**NOTA:** Los insights que requieren datos no disponibles simplemente no se muestran.

---

## 11. ANIMACIONES

### 11.1 Transiciones de Estado

```typescript
// Configuración Framer Motion

const heroVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const spotlightVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

const victoryVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

// Transición global
const transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] // ease-out
}
```

### 11.2 Anillo de Progreso

```typescript
// Draw-in animation para el anillo
const ringVariants = {
  initial: { pathLength: 0 },
  animate: { 
    pathLength: 1,
    transition: { duration: 1.5, ease: 'easeInOut' }
  }
}
```

### 11.3 Cards del Carrusel

```css
/* Hover effect */
.carousel-card {
  transition: transform 0.2s ease-out, border-color 0.2s ease-out;
}

.carousel-card:hover {
  transform: translateY(-4px);
}

/* Selected state */
.carousel-card.selected {
  transform: scale(1.05);
  border-color: var(--fhr-cyan);
}
```

---

## 12. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Estructura Base
- [ ] Crear estructura de carpetas
- [ ] Implementar tipos TypeScript
- [ ] Crear hook `useEvaluatorCinemaMode`
- [ ] Implementar `ManagerCinemaMode.tsx` orquestador

### Fase 2: Componentes Hero
- [ ] `LobbyHero.tsx` con anillo y CTA
- [ ] `ProgressRing.tsx` (SVG segmentado)
- [ ] `SpotlightHero.tsx` con datos del empleado
- [ ] `VictoryHero.tsx` con celebración

### Fase 3: Carrusel Netflix
- [ ] `NetflixCarousel.tsx` container
- [ ] `EmployeeCard.tsx` card individual
- [ ] `EmployeeCardBadge.tsx` badges semánticos
- [ ] Scroll snap y responsive

### Fase 4: Integración
- [ ] Conectar con API existente
- [ ] Implementar lógica de priorización
- [ ] Conectar con flujo de evaluación (`/encuesta/[token]`)
- [ ] Conectar con modal de revisión (completadas)

### Fase 5: Polish
- [ ] Animaciones Framer Motion
- [ ] Estados de loading (skeletons)
- [ ] Estados de error
- [ ] Responsive testing (mobile/tablet/desktop)

---

## 13. VALIDACIÓN FILOSOFÍA FHR

### Checklist Pre-Lanzamiento

```yaml
JERARQUÍA:
  □ ¿Hay UN protagonista claro? (Anillo o Persona)
  □ ¿El ojo sabe dónde ir primero?
  □ ¿Los elementos secundarios "susurran"?

ACCIÓN:
  □ ¿El CTA principal es visible sin scroll?
  □ ¿Hay solo UN CTA principal?
  □ ¿El usuario sabe qué hacer en 10 segundos?

PROGRESSIVE DISCLOSURE:
  □ ¿El carrusel es navegación, no contenido principal?
  □ ¿Se puede entender el Lobby sin expandir nada?
  □ ¿Los insights son opcionales?

COLORES SIN LEYENDA:
  □ ¿Los badges tienen TEXTO además de color?
  □ ¿El usuario entiende el estado sin memorizar colores?
  □ ¿Se usan iconos Lucide (no emojis)?

CONSISTENCIA:
  □ ¿Usa clases .fhr-* del design system?
  □ ¿Línea Tesla presente donde corresponde?
  □ ¿Botones usan PrimaryButton/GhostButton?
```

---

## 14. PROMPT PARA CLAUDE CODE

```
Implementa el Portal del Jefe "Cinema Mode" según TASK_PORTAL_JEFE_CINEMA_MODE_v3.md.

## FASE 1: ESTRUCTURA
1. Crear carpetas según sección 8.1
2. Crear tipos en src/types/evaluator-cinema.ts
3. Crear hook useEvaluatorCinemaMode que consuma /api/evaluator/assignments

## FASE 2: ORQUESTADOR
4. Implementar ManagerCinemaMode.tsx con los 3 estados (lobby/spotlight/victory)
5. Usar AnimatePresence de framer-motion para transiciones

## FASE 3: LOBBY
6. Implementar LobbyHero con:
   - ProgressRing SVG segmentado
   - Stats line
   - Botón "COMENZAR CON: [NOMBRE]"
   - UrgencyBadge

## FASE 4: SPOTLIGHT
7. Implementar SpotlightHero con:
   - Avatar grande
   - Nombre/Cargo/Departamento
   - Insights dinámicos (solo los que tienen datos)
   - Botón "EVALUAR AHORA"

## FASE 5: CARRUSEL
8. Implementar NetflixCarousel con:
   - Cards de 160-180px
   - Scroll horizontal snap
   - Responsive (2.5 mobile, 5-6 desktop)
9. Implementar EmployeeCard con:
   - Línea Tesla según estado
   - Avatar
   - Nombre/Cargo
   - Badge semántico con icono Lucide + texto

## FASE 6: CONEXIÓN
10. Conectar click "Evaluar" → /encuesta/[token]
11. Conectar click card completada → Modal de revisión existente

## IMPORTANTE:
- Usar iconos Lucide (Zap, Clock, CheckCircle, Edit), NO emojis
- Badges con TEXTO autoexplicativo ("Listo para ti", no solo color)
- Línea Tesla: <div className="fhr-top-line" />
- Botones: importar de @/components/ui/PremiumButton

Ejecutar fase por fase validando compilación.
```

---

## 15. REFERENCIAS

| Documento | Ubicación |
|-----------|-----------|
| Filosofía de Diseño | `/mnt/project/FILOSOFIA_DISENO_FOCALIZAHR_v1.md` |
| Guía de Estilos | `/mnt/project/GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` |
| Premium Buttons | `/mnt/project/FocalizaHR_Premium_Buttons_Guide.md` |
| API Evaluator | `/src/app/api/evaluator/assignments/route.ts` |
| API Summary | `/src/app/api/evaluator/assignments/[id]/summary/route.ts` |
| CSS Unificado | `/src/styles/focalizahr-unified.css` |

---

**FocalizaHR - Donde la inteligencia organizacional se convierte en acción.**
