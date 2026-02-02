# 🎬 TASK: PORTAL DEL JEFE "CINEMA MODE" v4.0

## Control del Documento
| Campo | Valor |
|-------|-------|
| **Versión** | 4.0 |
| **Fecha** | Febrero 2025 |
| **Ruta** | `/dashboard/evaluaciones` |
| **Prioridad** | ALTA |
| **Iteración** | Corrección post-v3 |

---

## 1. FLUJO DE 3 ESTADOS

### Diagrama de Navegación

```
   ┌─────────────┐
   │   LOBBY     │  Estado inicial
   │  (Anillo)   │
   └──────┬──────┘
          │ Click "Ver mi equipo"
          ▼
   ┌─────────────┐
   │  CARRUSEL   │  Protagonista temporal
   │ (Full blur) │  Cards Netflix grandes
   └──────┬──────┘
          │ Click en card
          ▼
   ┌─────────────┐
   │  SPOTLIGHT  │  Card persona bella
   │ (Evaluar)   │  UN protagonista
   └─────────────┘
```

---

## 2. ESTADO 1: LOBBY

### Descripción
Pantalla inicial. Resumen ejecutivo. UN CTA claro.

### Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ══════════════════════════════════════════════════════ (línea Tesla)   │
│                                                                          │
│                         EVALUACIÓN ANUAL 2026                            │
│                       27 enero - 19 febrero                              │
│                                                                          │
│                                                                          │
│                            ╭──────────╮                                  │
│                           ╱  ▁▂▃▄▅▆▇  ╲   ← Anillo SEGMENTADO           │
│                          │             │     (gaps entre barras)         │
│                          │     23%     │     stroke-linecap="round"      │
│                          │  COMPLETADO │     Tipografía LIGHT            │
│                           ╲           ╱                                  │
│                            ╰──────────╯                                  │
│                                                                          │
│                                                                          │
│                   10 pendientes  ·  ~1h 40m estimados                    │
│                                                                          │
│                                                                          │
│                  ╔══════════════════════════════════╗                    │
│                  ║       👥  Ver mi equipo          ║   ← CTA único      │
│                  ╚══════════════════════════════════╝                    │
│                                                                          │
│                                                                          │
│                        ⚠️ 19 días restantes                              │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Componentes

#### 2.1 Anillo Segmentado (CRÍTICO)

```tsx
interface SegmentedRingProps {
  total: number        // 13 personas
  completed: number    // 3 completadas
  size?: number        // default: 200px
}

// ESPECIFICACIÓN VISUAL:
// - Cada segmento = 1 persona
// - Gap entre segmentos: 4-6 grados
// - stroke-linecap="round" (bordes redondeados)
// - Completadas: Cyan (#22D3EE)
// - Pendientes: Slate-700/30
// - Centro: Porcentaje en font-light (NO bold)
```

**SVG Reference:**
```svg
<circle
  stroke-dasharray="X Y"  <!-- X=largo segmento, Y=gap -->
  stroke-linecap="round"
  stroke-width="8"
/>
```

#### 2.2 Stats Line

```tsx
// Formato: "10 pendientes · ~1h 40m estimados"
// Cálculo: pendientes * 10 minutos
// Tipografía: text-slate-400, text-sm
```

#### 2.3 CTA Principal

```tsx
// Texto: "👥 Ver mi equipo" (usa icono Lucide Users, no emoji)
// Acción: setViewState('carousel')
// Estilo: PrimaryButton con glow
```

#### 2.4 Badge Urgencia

```tsx
// daysRemaining <= 3: Rojo + pulse
// daysRemaining <= 7: Amber  
// daysRemaining > 7: Slate (sutil)
```

---

## 3. ESTADO 2: CARRUSEL PROTAGONISTA

### Descripción
El carrusel toma TODA la pantalla con fondo difuminado. Cards Netflix grandes. El usuario navega y selecciona.

### Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░ BACKDROP BLUR (bg-slate-950/80) ░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                     ✕    │
│                                                                          │
│  TU EQUIPO                                                               │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                       │
│  │  Todos 13   │  │ Pendientes  │  │ Completadas │   ← TABS FILTRO      │
│  │             │  │     10      │  │      3      │                       │
│  └─────────────┘  └─────────────┘  └─────────────┘                       │
│                                                                          │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────   │
│  │ ════════════  │  │ ════════════  │  │ ════════════  │  │ ═════════   │
│  │               │  │               │  │               │  │             │
│  │    ┌────┐     │  │    ┌────┐     │  │    ┌────┐     │  │   ┌────┐    │
│  │    │    │     │  │    │    │     │  │    │    │     │  │   │ ✓  │    │
│  │    │ AS │     │  │    │ IG │     │  │    │ MN │     │  │   │    │    │
│  │    │    │     │  │    │    │     │  │    │    │     │  │   └────┘    │
│  │    └────┘     │  │    └────┘     │  │    └────┘     │  │             │
│  │               │  │               │  │               │  │ Pedro       │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤  │ López       │
│  │               │  │               │  │               │  │             │
│  │ Andrés Soto   │  │ Ivalu         │  │ María Núñez   │  │ ✓ 4.2      │
│  │ Coordinador   │  │ Gutiérrez     │  │ Tecn. Médico  │  │ Completada  │
│  │               │  │ Enfermera     │  │ Supervisor    │  │             │
│  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │  └─────────   │
│  │ │ ⚡ Listo  │ │  │ │ ⚡ Listo  │ │  │ │ ⚡ Listo  │ │                │
│  │ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │                │
│  │               │  │               │  │               │                │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
│                                                                          │
│                              ← swipe / scroll →                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Componentes

#### 3.1 Overlay Container

```tsx
// Full screen overlay
// bg-slate-950/80 backdrop-blur-xl
// Botón cerrar (✕) esquina superior derecha
// Click fuera del carrusel = volver a Lobby
```

#### 3.2 Tabs de Filtro

```tsx
interface CarouselTabsProps {
  activeTab: 'all' | 'pending' | 'completed'
  counts: { all: number; pending: number; completed: number }
  onTabChange: (tab) => void
}

// Diseño: Pills con contador
// Activo: bg-cyan-500/20 border-cyan-500
// Inactivo: bg-slate-800/50 border-slate-700
```

#### 3.3 Netflix Card (CRÍTICO)

```tsx
interface EmployeeCardProps {
  employee: {
    id: string
    fullName: string      // RAW del backend
    displayName: string   // Formateado: "María Núñez"
    position: string
    departmentName: string
  }
  status: 'ready' | 'waiting' | 'in_progress' | 'completed'
  score?: number          // Solo si completed
  onClick: () => void
}
```

**Anatomía de la Card:**

```
┌─────────────────────────────────────┐
│  ════════════════════════════════   │  ← Línea Tesla (color según estado)
│                                     │     Cyan=ready, Amber=progress, Green=done
│              ┌────────┐             │
│              │        │             │
│              │   MN   │             │  ← Avatar 64px
│              │        │             │     Fondo slate-700
│              └────────┘             │     Iniciales centered
│                                     │
├─────────────────────────────────────┤  ← Separador sutil
│                                     │
│         María Núñez                 │  ← Nombre FORMATEADO (no raw)
│         Tecnólogo Médico            │  ← Cargo (truncar si largo)
│                                     │
│      ┌─────────────────────┐        │
│      │  ⚡ Listo para ti   │        │  ← Badge con icono Lucide + texto
│      └─────────────────────┘        │
│                                     │
└─────────────────────────────────────┘

COMPLETADA:
│      ┌─────────────────────┐        │
│      │  ✓ Completada · 4.2 │        │  ← Badge verde con score
│      └─────────────────────┘        │
```

#### 3.4 Tamaños Responsive

| Breakpoint | Cards Visibles | Card Width |
|------------|----------------|------------|
| Mobile < 640px | 1.5 | 240px |
| Tablet 640-1024px | 2.5 | 220px |
| Desktop > 1024px | 4 | 200px |

---

## 4. ESTADO 3: SPOTLIGHT

### Descripción
Card de persona expandida. UN protagonista. UN CTA. Filosofía FocalizaHR pura.

### Visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ══════════════════════════════════════════════════════ (línea Tesla)   │
│                                                                          │
│                                                                          │
│  ← Volver a mi equipo                                                   │
│                                                                          │
│                                                                          │
│         ┌─────────────────────────────────────────────────────┐          │
│         │                                                     │          │
│         │  ════════════════════════════════════════════════   │          │
│         │                                                     │          │
│         │         ┌──────────┐                                │          │
│         │         │          │                                │          │
│         │         │    MN    │     María Antonieta Núñez      │          │
│         │         │          │     Tecnólogo Médico Supervisor│          │
│         │         └──────────┘     Ventas Nacional            │          │
│         │                                                     │          │
│         │  ───────────────────────────────────────────────    │          │
│         │                                                     │          │
│         │  🕐  8 años 1 mes en la empresa                     │          │
│         │                                                     │          │
│         │  ✓   Autoevaluación completada                      │          │
│         │                                                     │          │
│         │                                                     │          │
│         │         ╔════════════════════════════════╗          │          │
│         │         ║       ⚡ Evaluar Ahora         ║          │          │
│         │         ╚════════════════════════════════╝          │          │
│         │                                                     │          │
│         │                      ~10 min                        │          │
│         │                                                     │          │
│         └─────────────────────────────────────────────────────┘          │
│                                                                          │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Componentes

#### 4.1 Botón Volver

```tsx
// "← Volver a mi equipo"
// Acción: setViewState('carousel')
// Estilo: GhostButton con ArrowLeft icon
```

#### 4.2 Spotlight Card

```tsx
interface SpotlightCardProps {
  employee: {
    id: string
    displayName: string
    position: string
    departmentName: string
    tenure: string        // "8 años 1 mes"
  }
  insights: Insight[]
  onEvaluate: () => void
  estimatedMinutes: number
}

interface Insight {
  icon: LucideIcon
  text: string
  variant: 'info' | 'success' | 'warning'
}
```

#### 4.3 Insights Dinámicos

| Condición | Icono | Texto |
|-----------|-------|-------|
| Siempre | `Clock` | "X años Y meses en la empresa" |
| selfCompleted | `CheckCircle` | "Autoevaluación completada" |
| selfPending | `Clock` | "Esperando autoevaluación" |
| isInProgress | `Edit` | "Tienes un borrador guardado" |

---

## 5. UTILIDADES CRÍTICAS

### 5.1 formatDisplayName (OBLIGATORIO)

```typescript
// src/lib/utils/formatName.ts

/**
 * Transforma nombres del backend a formato legible
 * 
 * Ejemplos:
 * "NUÑEZ AHUMADA,MARIA ANTONIETA" → "María Núñez"
 * "GUTIERREZ VELIZ,IVALU XIMENA" → "Ivalu Gutiérrez"
 * "Andres Soto" → "Andrés Soto"
 */
export function formatDisplayName(
  fullName: string, 
  format: 'short' | 'full' = 'short'
): string {
  if (!fullName) return ''
  
  // Detectar formato "APELLIDO,NOMBRE"
  if (fullName.includes(',')) {
    const [apellidos, nombres] = fullName.split(',').map(s => s.trim())
    const primerNombre = toTitleCase(nombres.split(' ')[0])
    const primerApellido = toTitleCase(apellidos.split(' ')[0])
    
    if (format === 'short') {
      return `${primerNombre} ${primerApellido}`
    }
    return `${toTitleCase(nombres)} ${toTitleCase(apellidos)}`
  }
  
  // Formato normal "Nombre Apellido"
  return toTitleCase(fullName)
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Para botones: trunca con inicial
 * "María Antonieta Núñez" → "María N."
 */
export function formatNameForButton(fullName: string): string {
  const display = formatDisplayName(fullName, 'short')
  const parts = display.split(' ')
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}.`
  }
  return display
}
```

### 5.2 Tiempo Estimado

```typescript
export function calculateEstimatedTime(pending: number): string {
  const minutes = pending * 10
  if (minutes < 60) return `~${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`
}
```

---

## 6. ESTRUCTURA DE ARCHIVOS

```
src/
├── app/
│   └── dashboard/
│       └── evaluaciones/
│           └── page.tsx                    # Solo auth check + render
│
├── components/
│   └── evaluator/
│       ├── cinema/
│       │   ├── CinemaModeOrchestrator.tsx # Maneja los 3 estados
│       │   ├── LobbyView.tsx              # Estado 1
│       │   ├── CarouselView.tsx           # Estado 2
│       │   ├── SpotlightView.tsx          # Estado 3
│       │   ├── SegmentedRing.tsx          # Anillo SVG
│       │   ├── EmployeeCard.tsx           # Card Netflix
│       │   ├── SpotlightCard.tsx          # Card expandida
│       │   └── CarouselTabs.tsx           # Filtros
│       │
│       └── shared/
│           └── EmployeeAvatar.tsx         # Avatar reutilizable
│
├── lib/
│   └── utils/
│       └── formatName.ts                  # Utilidades de nombres
│
└── hooks/
    └── useEvaluatorCinemaMode.ts          # Estado + datos
```

---

## 7. TIPOS TYPESCRIPT

```typescript
// src/types/evaluator-cinema.ts

export type CinemaViewState = 'lobby' | 'carousel' | 'spotlight'

export type EmployeeCardStatus = 
  | 'ready'       // Listo para evaluar
  | 'waiting'     // Esperando autoevaluación
  | 'in_progress' // Borrador guardado
  | 'completed'   // Ya evaluado

export type CarouselTab = 'all' | 'pending' | 'completed'

export interface EmployeeCardData {
  id: string
  fullName: string           // Raw del backend
  displayName: string        // Formateado
  displayNameShort: string   // Para botones
  position: string | null
  departmentName: string
  tenure: string
  status: EmployeeCardStatus
  score?: number
  participantToken: string | null
}

export interface CinemaStats {
  total: number
  completed: number
  pending: number
  estimatedTime: string
}

export interface CinemaCycle {
  name: string
  startDate: string
  endDate: string
  daysRemaining: number
}
```

---

## 8. ANIMACIONES

### 8.1 Transiciones entre Estados

```typescript
// Framer Motion variants

const lobbyVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

const carouselVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { opacity: 0 }
}

const spotlightVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 }  // Stagger effect
  })
}
```

### 8.2 Anillo Draw-in

```typescript
const ringVariants = {
  initial: { pathLength: 0 },
  animate: { 
    pathLength: 1,
    transition: { duration: 1.2, ease: 'easeInOut' }
  }
}
```

---

## 9. DATOS API

### Endpoint Existente
`GET /api/evaluator/assignments`

### Datos Disponibles
| Campo | Disponible | Uso |
|-------|------------|-----|
| `evaluatee.fullName` | ✅ | Formatear con `formatDisplayName` |
| `evaluatee.position` | ✅ | Mostrar en card |
| `evaluatee.departmentName` | ✅ | Mostrar en card |
| `evaluatee.tenure` | ✅ | Insight en Spotlight |
| `status` | ✅ | Determinar badge |
| `stats.total/completed/pending` | ✅ | Anillo + tabs |
| `cycle.daysRemaining` | ✅ | Badge urgencia |
| `participantToken` | ✅ | URL evaluación |

### Datos a Calcular
| Campo | Cálculo |
|-------|---------|
| `displayName` | `formatDisplayName(fullName)` |
| `displayNameShort` | `formatNameForButton(fullName)` |
| `estimatedTime` | `pending * 10 min` |
| `cardStatus` | Mapear desde `assignment.status` |

---

## 10. CHECKLIST IMPLEMENTACIÓN

### Fase 1: Utilidades + Tipos
- [ ] Crear `formatDisplayName` y `formatNameForButton`
- [ ] Crear tipos en `evaluator-cinema.ts`
- [ ] Crear hook `useEvaluatorCinemaMode`

### Fase 2: Estado 1 (Lobby)
- [ ] `LobbyView.tsx`
- [ ] `SegmentedRing.tsx` (SVG con gaps + round caps)
- [ ] Verificar tipografía light en porcentaje

### Fase 3: Estado 2 (Carrusel)
- [ ] `CarouselView.tsx` con overlay blur
- [ ] `CarouselTabs.tsx` con contadores
- [ ] `EmployeeCard.tsx` con nombre formateado
- [ ] Scroll horizontal con snap

### Fase 4: Estado 3 (Spotlight)
- [ ] `SpotlightView.tsx`
- [ ] `SpotlightCard.tsx` con insights
- [ ] Conexión con `/encuesta/[token]`

### Fase 5: Orquestador
- [ ] `CinemaModeOrchestrator.tsx`
- [ ] Transiciones AnimatePresence
- [ ] Manejo de estados

### Fase 6: Polish
- [ ] Responsive testing
- [ ] Estados de carga
- [ ] Estados de error
- [ ] Validar filosofía FHR

---

## 11. VALIDACIÓN FILOSOFÍA

```yaml
ANTES DE ENTREGAR, VERIFICAR:

LOBBY:
  □ ¿El anillo es SEGMENTADO con gaps?
  □ ¿El porcentaje es font-light (no bold)?
  □ ¿Hay UN solo CTA visible?

CARRUSEL:
  □ ¿El fondo tiene blur?
  □ ¿Los nombres están FORMATEADOS (no mayúsculas)?
  □ ¿Las cards tienen línea Tesla?
  □ ¿Los badges tienen icono Lucide + texto?

SPOTLIGHT:
  □ ¿Hay UN protagonista claro?
  □ ¿El CTA es obvio y único?
  □ ¿Los insights usan iconos Lucide?

GENERAL:
  □ ¿NUNCA se muestra "APELLIDO,NOMBRE" raw?
  □ ¿Las transiciones son suaves?
  □ ¿Se puede cerrar/volver en cada estado?
```

---

## 12. REFERENCIAS

| Documento | Ubicación |
|-----------|-----------|
| Filosofía Diseño | `.claude/docs/focalizahr-ui-design-standards.md` |
| Premium Buttons | `/mnt/project/FocalizaHR_Premium_Buttons_Guide.md` |
| API Evaluator | `/src/app/api/evaluator/assignments/route.ts` |

---

**FocalizaHR - Cinema Mode v4.0**
*Donde cada evaluación es una experiencia, no una tarea.*
