# 🎯 TASK: Integrar Intelligence Sidekick Panel (2 Vistas)

## ⚠️ CORRECCIÓN PREVIA REQUERIDA

**Antes de implementar, corregir error en TeamCalibrationHUD.tsx línea 328:**

```typescript
// ANTES (ERROR - export duplicado):
export type { TeamCalibrationHUDProps, TeamMember }

// DESPUÉS (CORRECTO):
export type { TeamCalibrationHUDProps }
```

---

## CONTEXTO
Los componentes YA EXISTEN en el proyecto:
- ✅ `src/lib/management-insights.ts` 
- ✅ `src/components/performance/ManagementAlertsHUD.tsx`
- ✅ `src/components/performance/TeamCalibrationHUD.tsx`
- ✅ `src/components/ui/MinimalistButton.tsx` → **MinimalistToggle**
- ✅ `src/components/performance/PerformanceResultCard.tsx` (ya usado en SpotlightCard)

**OBJETIVO:** Agregar toggle minimalista que alterne entre 2 vistas en la columna derecha del SpotlightCard.

---

## 📁 ARCHIVO A MODIFICAR

```
src/components/evaluator/cinema/SpotlightCard.tsx
```

Este componente tiene layout de 2 columnas:
- **Columna Izquierda (35%):** Avatar + Info del colaborador
- **Columna Derecha (65%):** Grid de datos + PerformanceResultCard + CTAs

---

## 🎨 DISEÑO: 2 Vistas con Toggle

### Toggle (estilo "Futuro | Ahora")
```
┌─────────────┐ ┌─────────────┐
│ Calibración │ │  Alertas    │
└─────────────┘ └─────────────┘
```

### VISTA 1: "Calibración" (Default)
Muestra el contenido actual (grid + PerformanceResultCard) + TeamCalibrationHUD debajo:

```
┌────────────────────────────────────────┐
│ [Calibración]  [Alertas]    ← Toggle   │
├────────────────────────────────────────┤
│                                        │
│  Grid de datos existente (insights)    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ dato │ │ dato │ │ dato │ │ dato │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                        │
│  PerformanceResultCard existente       │
│  ┌────────────────────────────────┐   │
│  │ En Desarrollo          3.2     │   │
│  │ ████████████░░░░░░░░░░         │   │
│  └────────────────────────────────┘   │
│                                        │
│  TeamCalibrationHUD (NUEVO)            │
│  ┌────────────────────────────────┐   │
│  │ 📊 CALIBRACIÓN EQUIPO [TOP 40%]│   │
│  │ 01  P. Sánchez   4.8  ████████ │   │
│  │ 02  MARIA A.     3.2  █████░░░ │ ← │
│  │ 03  C. López     3.0  ████░░░░ │   │
│  │ Posición #2 de 4 | -0.25       │   │
│  └────────────────────────────────┘   │
│                                        │
│  CTAs existentes                       │
└────────────────────────────────────────┘
```

### VISTA 2: "Alertas"
Muestra ManagementAlertsHUD:

```
┌────────────────────────────────────────┐
│ [Calibración]  [Alertas]    ← Toggle   │
├────────────────────────────────────────┤
│                                        │
│  ManagementAlertsHUD (NUEVO)           │
│  ┌────────────────────────────────┐   │
│  │ 🧠 INTELIGENCIA DE GESTIÓN     │   │
│  │ Maria Antonieta                │   │
│  ├────────────────────────────────┤   │
│  │                                │   │
│  │ 🟡 MONITOREAR                  │   │
│  │ ┌──────────────────────────┐  │   │
│  │ │ Feedback y Coaching: 2.8 │  │   │
│  │ │ "Score moderado..."      │  │   │
│  │ │ 💬 "¿Qué obstáculos...?" │  │   │
│  │ └──────────────────────────┘  │   │
│  │                                │   │
│  │ 🟡 MONITOREAR                  │   │
│  │ ┌──────────────────────────┐  │   │
│  │ │ Orient. Cliente: 3.0     │  │   │
│  │ └──────────────────────────┘  │   │
│  │                                │   │
│  └────────────────────────────────┘   │
│                                        │
│  CTAs existentes                       │
└────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN

### Paso 0: Modificar CinemaModeOrchestrator.tsx

Pasar `allEmployees` como prop adicional a SpotlightCard:

```tsx
// En CinemaModeOrchestrator.tsx
{!isVictory && isSpotlight && (
  <SpotlightCard
    key={`spotlight-${selectedId}`}
    employee={selectedEmployee}
    allEmployees={employees}  // ← AGREGAR ESTA PROP
    onBack={handleBack}
    onEvaluate={handleEvaluate}
    onViewSummary={handleViewSummary}
  />
)}
```

### Paso 1: Modificar SpotlightCard.tsx - Agregar imports y tipos

```tsx
import { useState, useEffect, useMemo } from 'react'
import { MinimalistToggle } from '@/components/ui/MinimalistButton'
import TeamCalibrationHUD from '@/components/performance/TeamCalibrationHUD'
import ManagementAlertsHUD from '@/components/performance/ManagementAlertsHUD'

// Actualizar SpotlightCardProps en types/evaluator-cinema.ts
// O inline aquí:
interface SpotlightCardProps {
  employee: SelectedEmployee
  allEmployees: EmployeeCardData[]  // ← NUEVA PROP
  onBack: () => void
  onEvaluate: (token: string) => void
  onViewSummary: (assignmentId: string) => void
}
```

### Paso 2: Agregar estado y lógica dentro de SpotlightCard

```tsx
export default function SpotlightCard({
  employee,
  allEmployees,  // ← NUEVA PROP
  onBack,
  onEvaluate,
  onViewSummary
}: SpotlightCardProps) {
  
  // ═══════════════════════════════════════════════════════════════
  // NUEVO: Estado para toggle (solo si completada)
  // ═══════════════════════════════════════════════════════════════
  const [activeView, setActiveView] = useState<'calibracion' | 'alertas'>('calibracion')
  
  const toggleOptions = [
    { value: 'calibracion', label: 'Calibración' },
    { value: 'alertas', label: 'Alertas' }
  ]

  // ═══════════════════════════════════════════════════════════════
  // NUEVO: Datos para TeamCalibrationHUD (transformar employees)
  // ═══════════════════════════════════════════════════════════════
  const teamMembers = useMemo(() => {
    return allEmployees
      .filter(e => e.status === 'completed' && e.avgScore !== null)
      .map(e => ({
        id: e.id,
        name: e.displayNameFull,
        score: e.avgScore! / 20  // ← Convertir 0-100 a escala 1-5
      }))
  }, [allEmployees])

  // ═══════════════════════════════════════════════════════════════
  // NUEVO: Datos para ManagementAlertsHUD (fetch de API existente)
  // ═══════════════════════════════════════════════════════════════
  const [competencies, setCompetencies] = useState<{name: string, score: number}[]>([])
  const [loadingCompetencies, setLoadingCompetencies] = useState(false)

  useEffect(() => {
    if (employee.status !== 'completed') return
    
    async function fetchCompetencies() {
      setLoadingCompetencies(true)
      try {
        const token = localStorage.getItem('focalizahr_token')
        const res = await fetch(`/api/evaluator/assignments/${employee.assignmentId}/summary`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const json = await res.json()
        
        if (json.success && json.summary.categorizedResponses) {
          const transformed = Object.entries(json.summary.categorizedResponses)
            .map(([categoryName, responses]) => {
              const scores = (responses as any[])
                .map(r => r.normalizedScore)
                .filter((s): s is number => s !== null)
              const avgScore = scores.length > 0 
                ? scores.reduce((a, b) => a + b, 0) / scores.length 
                : 0
              return { 
                name: categoryName, 
                score: avgScore / 20  // ← Convertir 0-100 a escala 1-5
              }
            })
          setCompetencies(transformed)
        }
      } catch (err) {
        console.error('Error fetching competencies:', err)
      } finally {
        setLoadingCompetencies(false)
      }
    }
    
    fetchCompetencies()
  }, [employee.assignmentId, employee.status])

  // ... resto del componente
```

### Paso 3: Modificar la columna derecha de SpotlightCard

Dentro de la **columna derecha (65%)**, agregar toggle y contenido condicional:

```tsx
{/* COLUMNA DERECHA: Inteligencia (65%) */}
<div className="w-full md:w-[65%] p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-[#0F172A] to-[#162032]">

  {/* NUEVO: Toggle de vistas - SOLO si está completada */}
  {employee.status === 'completed' && (
    <div className="flex justify-end mb-4">
      <MinimalistToggle
        options={toggleOptions}
        activeValue={activeView}
        onChange={(value) => setActiveView(value as 'calibracion' | 'alertas')}
        size="sm"
      />
    </div>
  )}

  {/* Contenido condicional según vista */}
  {activeView === 'calibracion' ? (
    <>
      {/* Grid de datos existente - NO MODIFICAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {employee.insights.map((insight, idx) => (
          insight.type === 'resultado' ? (
            <PerformanceResultCard
              key={idx}
              score={employee.avgScore ?? 0}
              variant="compact"
            />
          ) : (
            <InsightCard
              key={insight.type}
              insight={insight}
              rawDate={
                insight.type === 'completedAt' ? employee.completedAt :
                insight.type === 'dueDate' ? employee.dueDate :
                undefined
              }
            />
          )
        ))}
      </div>

      {/* NUEVO: TeamCalibrationHUD - Solo si hay más de 1 miembro con datos */}
      {teamMembers.length > 1 && (
        <TeamCalibrationHUD
          teamMembers={teamMembers}
          currentEvaluateeId={employee.id}
          maxVisible={5}
          className="mb-6"
        />
      )}
    </>
  ) : (
    /* NUEVO: ManagementAlertsHUD */
    loadingCompetencies ? (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    ) : competencies.length > 0 ? (
      <ManagementAlertsHUD
        competencies={competencies}
        employeeName={employee.displayNameFull}
        className="mb-6"
      />
    ) : (
      <div className="text-center py-8 text-slate-500">
        No hay competencias evaluadas disponibles
      </div>
    )
  )}

  {/* CTAs existentes - NO MODIFICAR */}
  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-800">
    {/* ... botones existentes ... */}
  </div>
</div>
```

**NOTA IMPORTANTE sobre escala:**
- `employee.avgScore` viene en escala 0-100 (normalizedScore del API)
- `PerformanceResultCard` YA convierte internamente: `scoreOn5 = score / 20`
- `TeamCalibrationHUD` espera scores en escala 1-5
- `ManagementAlertsHUD` espera scores en escala 1-5
- Por eso las transformaciones dividen entre 20

---

## 📊 DATOS REALES (Sistema en Producción)

### ✅ TeamCalibrationHUD - DATOS YA DISPONIBLES EN HOOK

El hook `useEvaluatorCinemaMode` YA retorna `employees` con todos los colaboradores del jefe.

**Transformación en SpotlightCard.tsx:**

```tsx
// employees viene como prop desde el orquestador
const teamMembers = useMemo(() => {
  return allEmployees
    .filter(e => e.status === 'completed' && e.avgScore !== null)
    .map(e => ({
      id: e.id,
      name: e.displayNameFull,
      score: e.avgScore! / 20  // Convertir 0-100 a escala 1-5
    }))
}, [allEmployees])
```

---

### ✅ ManagementAlertsHUD - API EXISTENTE

La API `/api/evaluator/assignments/[id]/summary` YA retorna `categorizedResponses` con scores por competencia.

**Response de la API:**
```typescript
{
  summary: {
    averageScore: 64,  // Score general 0-100
    categorizedResponses: {
      "Comunicación Efectiva": [
        { normalizedScore: 70, questionText: "..." },
        { normalizedScore: 65, questionText: "..." }
      ],
      "Trabajo en Equipo": [
        { normalizedScore: 80, questionText: "..." }
      ]
    }
  }
}
```

**Transformación en SpotlightCard.tsx:**

```tsx
const [competencies, setCompetencies] = useState<{name: string, score: number}[]>([])

useEffect(() => {
  if (employee.status !== 'completed') return
  
  async function fetchCompetencies() {
    const token = localStorage.getItem('focalizahr_token')
    const res = await fetch(`/api/evaluator/assignments/${employee.assignmentId}/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const json = await res.json()
    
    if (json.success && json.summary.categorizedResponses) {
      // Transformar categorizedResponses a formato requerido
      const transformed = Object.entries(json.summary.categorizedResponses)
        .map(([categoryName, responses]) => {
          const scores = (responses as any[])
            .map(r => r.normalizedScore)
            .filter((s): s is number => s !== null)
          const avgScore = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0
          return { 
            name: categoryName, 
            score: avgScore / 20  // Convertir 0-100 a escala 1-5
          }
        })
      setCompetencies(transformed)
    }
  }
  
  fetchCompetencies()
}, [employee.assignmentId, employee.status])
```

---

### ✅ Clasificación Centralizada (Ya existe)

```typescript
import { getPerformanceClassification } from '@/config/performanceClassification'

// ManagementAlertsHUD internamente usa:
const classification = getPerformanceClassification(competency.score)
// Retorna: { label, color, bgClass, textClass, borderClass, ... }
```

**Referencia:** `GUIA_FRONTEND_CLASIFICACION_PERFORMANCE.md`

---

## ✅ CHECKLIST IMPLEMENTACIÓN

### Paso 0: Corrección previa
- [ ] `TeamCalibrationHUD.tsx` línea 328: cambiar `export type { TeamCalibrationHUDProps, TeamMember }` a `export type { TeamCalibrationHUDProps }`

### Paso 1: Tipos
- [ ] `types/evaluator-cinema.ts`: agregar `allEmployees: EmployeeCardData[]` a `SpotlightCardProps`

### Paso 2: Orquestador
- [ ] `CinemaModeOrchestrator.tsx`: pasar `allEmployees={employees}` como prop a SpotlightCard

### Paso 3: SpotlightCard
- [ ] Agregar imports: `useState, useEffect, useMemo`
- [ ] Agregar imports: `MinimalistToggle, TeamCalibrationHUD, ManagementAlertsHUD`
- [ ] Agregar prop `allEmployees` a la destructuración
- [ ] Agregar estado `activeView` con default `'calibracion'`
- [ ] Agregar `toggleOptions` array
- [ ] Agregar `useMemo` para transformar `teamMembers` (con `/20` para escala 1-5)
- [ ] Agregar estado `competencies` y `loadingCompetencies`
- [ ] Agregar `useEffect` para fetch de `/api/evaluator/assignments/[id]/summary`
- [ ] Agregar `MinimalistToggle` (solo si `employee.status === 'completed'`)
- [ ] Envolver grid existente en condicional `calibracion`
- [ ] Agregar `TeamCalibrationHUD` debajo del grid (si `teamMembers.length > 1`)
- [ ] Agregar `ManagementAlertsHUD` para vista `alertas` con loading state
- [ ] Mantener CTAs existentes fuera del condicional

### Verificaciones
- [ ] Escala de scores: 0-100 → dividir entre 20 → escala 1-5
- [ ] Toggle solo visible si evaluación completada
- [ ] Loading spinner mientras carga competencias
- [ ] Mensaje si no hay competencias evaluadas

---

## ❌ NO MODIFICAR

- `management-insights.ts` (ya está correcto)
- `ManagementAlertsHUD.tsx` (ya usa `getPerformanceClassification` internamente)
- `TeamCalibrationHUD.tsx` (solo corregir línea 328 del export)
- `MinimalistButton.tsx` (ya existe el MinimalistToggle)
- `PerformanceResultCard.tsx` (solo envolverlo en condicional)
- `InsightCard.tsx` (solo envolverlo en condicional)
- La columna izquierda del SpotlightCard (avatar + info)
- Los CTAs existentes (botones evaluar/ver resumen)
- `/api/evaluator/assignments/[id]/summary` (API ya retorna `categorizedResponses`)
- `getPerformanceClassification` (clasificación centralizada ya existe)

---

## 📚 REFERENCIAS

| Tema | Archivo |
|------|---------|
| Clasificación de scores | `src/config/performanceClassification.ts` |
| Guía frontend clasificación | `GUIA_FRONTEND_CLASIFICACION_PERFORMANCE.md` |
| API summary existente | `src/app/api/evaluator/assignments/[id]/summary/route.ts` |
| Hook Cinema Mode | `src/hooks/useEvaluatorCinemaMode.ts` |
| Tipos Cinema Mode | `src/types/evaluator-cinema.ts` |

---

## 🎯 FLUJO UX

```
JEFE ABRE SPOTLIGHTCARD DE MARIA:

1. Vista "Calibración" (default):
   → Ve insights existentes + score
   → Ve ranking en el equipo (TeamCalibrationHUD)
   → Entiende contexto comparativo

2. Click en "Alertas":
   → Ve competencias que requieren atención
   → Obtiene preguntas para su próximo 1:1
   → Tiene agenda de conversación lista

3. Vuelve a "Calibración" o usa CTAs para evaluar
```
