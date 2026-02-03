# 🎯 TASK: Intelligence Sidekick Panel - Página Summary
## Archivo: `src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx`

---

## 📍 CONTEXTO CRÍTICO

### URL de la página:
```
http://localhost:3000/dashboard/evaluaciones/{assignmentId}/summary
```

### Archivo a modificar (ÚNICO):
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```

### ⚠️ NO MODIFICAR:
- `[assignmentId]/page.tsx` (página diferente con `?view=summary`)
- `SpotlightCard.tsx` (Cinema Mode)
- `CinemaModeOrchestrator.tsx`
- `evaluator-cinema.ts`

---

## 📐 ESTRUCTURA ACTUAL DEL ARCHIVO

El archivo es un **componente standalone** que renderiza TODO inline:

```typescript
export default function EvaluationSummaryPage() {
  // Estados
  const [data, setData] = useState<SummaryData | null>(null)
  
  // Fetch a /api/evaluator/assignments/${assignmentId}/summary
  // Retorna: { summary: { averageScore, categorizedResponses, evaluatee, ... } }
  
  // RENDER ACTUAL:
  // 1. Back button
  // 2. Header (título + nombre evaluado)
  // 3. Completed banner (verde)
  // 4. Resultado card (score + clasificación + barra) 
  // 5. Respuestas por categoría (loop Object.entries)
}
```

---

## 🎯 OBJETIVO: Agregar Panel Inteligencia con 2 Vistas

### Vistas requeridas (SOLO 2):
1. **Calibración** - TeamCalibrationHUD (ranking del equipo)
2. **Alertas** - ManagementAlertsHUD (competencias críticas/fortalezas)

### ❌ NO crear vista "Respuestas" separada
Las respuestas por categoría SIEMPRE se muestran debajo del panel de inteligencia.

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### PASO 1: Agregar imports

```typescript
// Agregar al inicio del archivo
import { useState, useEffect, useMemo } from 'react'
import TeamCalibrationHUD from '@/components/performance/TeamCalibrationHUD'
import ManagementAlertsHUD from '@/components/performance/ManagementAlertsHUD'
```

### PASO 2: Agregar estado para vista activa

```typescript
// Dentro de EvaluationSummaryPage, después de los estados existentes
const [activeView, setActiveView] = useState<'calibracion' | 'alertas'>('calibracion')
```

### PASO 3: Agregar fetch para datos del equipo

TeamCalibrationHUD necesita el ranking de TODOS los evaluados del jefe.
Agregar un segundo fetch:

```typescript
// Estado para team members
const [teamMembers, setTeamMembers] = useState<Array<{
  id: string
  name: string
  score: number
}>>([])

// Fetch team data (todos los assignments del evaluador)
useEffect(() => {
  async function fetchTeamData() {
    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) return

      const res = await fetch('/api/evaluator/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) return

      const json = await res.json()
      if (json.success && json.assignments) {
        // Filtrar solo completados con score y transformar
        const members = json.assignments
          .filter((a: any) => a.status === 'COMPLETED' && a.avgScore !== null)
          .map((a: any) => ({
            id: a.evaluatee.id,
            name: a.evaluatee.fullName,
            score: a.avgScore / 20  // Convertir 0-100 a 0-5
          }))
          .sort((a: any, b: any) => b.score - a.score)
        
        setTeamMembers(members)
      }
    } catch (err) {
      console.error('Error fetching team data:', err)
    }
  }

  fetchTeamData()
}, [])
```

### PASO 4: Calcular competencias desde categorizedResponses

```typescript
// Después de tener data.summary
const competencies = useMemo(() => {
  if (!data?.summary?.categorizedResponses) return []
  
  return Object.entries(data.summary.categorizedResponses).map(([name, responses]) => {
    const ratings = responses
      .filter((r: any) => r.rating !== null)
      .map((r: any) => r.rating as number)
    
    const avgScore = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0
    
    return { name, score: avgScore }
  })
}, [data?.summary?.categorizedResponses])
```

### PASO 5: Agregar Toggle Minimalista (SOLO TEXTO)

```tsx
{/* Toggle Minimalista - DESPUÉS del resultado card, ANTES de respuestas */}
<div className="flex justify-center mb-6">
  <div className="inline-flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
    <button
      onClick={() => setActiveView('calibracion')}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
        activeView === 'calibracion'
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      Calibración
    </button>
    <button
      onClick={() => setActiveView('alertas')}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
        activeView === 'alertas'
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      Alertas
    </button>
  </div>
</div>
```

### PASO 6: Renderizar componentes según vista activa

```tsx
{/* Panel de Inteligencia */}
<div className="mb-6">
  {activeView === 'calibracion' ? (
    teamMembers.length > 0 ? (
      <TeamCalibrationHUD
        teamMembers={teamMembers}
        currentEvaluateeId={data.summary.evaluatee?.id || assignmentId}
        maxVisible={5}
      />
    ) : (
      <div className="fhr-card p-6 text-center">
        <p className="text-slate-400 text-sm">
          No hay suficientes evaluaciones completadas para mostrar el ranking.
        </p>
      </div>
    )
  ) : (
    <ManagementAlertsHUD
      competencies={competencies}
      employeeName={displayName}
    />
  )}
</div>

{/* Respuestas por categoría - SIEMPRE VISIBLE debajo del panel */}
{Object.entries(summary.categorizedResponses).map(([category, responses]) => (
  // ... código existente de respuestas
))}
```

---

## 📊 DATOS DISPONIBLES

### Desde `/api/evaluator/assignments/${id}/summary`:
```typescript
{
  summary: {
    assignmentId: string
    averageScore: number | null  // En escala 0-100
    evaluatee: { fullName, position, department }
    categorizedResponses: {
      "Liderazgo": [{ rating: 4, questionText, ... }],
      "Comunicación": [{ rating: 3.5, ... }]
    }
  }
}
```

### Desde `/api/evaluator/assignments` (para team ranking):
```typescript
{
  assignments: [{
    evaluatee: { id, fullName },
    avgScore: number | null,  // En escala 0-100
    status: 'COMPLETED' | 'PENDING' | ...
  }]
}
```

---

## 📦 COMPONENTES A USAR

### TeamCalibrationHUD
```typescript
// Ya creado por Claude Code (Untracked)
// Ubicación: src/components/performance/TeamCalibrationHUD.tsx

interface TeamCalibrationHUDProps {
  teamMembers: Array<{
    id: string
    name: string
    score: number  // Escala 1-5
  }>
  currentEvaluateeId?: string  // Para resaltar al evaluado actual
  maxVisible?: number          // Default: 5
  className?: string
}
```

### ManagementAlertsHUD - CONSOLA DE INTELIGENCIA UNIFICADA

⚠️ **DISEÑO CRÍTICO:** NO es una lista de tarjetas flotantes tipo "post-its".
Es una **Consola de Inteligencia Unificada** - un monolito cohesivo.

```typescript
// Ubicación: src/components/performance/ManagementAlertsHUD.tsx
// Usa: src/lib/management-insights.ts para generar insights

interface ManagementAlertsHUDProps {
  competencies: Array<{
    name: string
    score: number  // Escala 1-5
  }>
  employeeName: string
  teamRanking?: { position: number; total: number }
  className?: string
}
```

#### ESTRUCTURA VISUAL REQUERIDA:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🚨 ALERTAS DE GESTIÓN - {employeeName}                    [−]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ║  ┌─────────────────────────────────────────────────────────┐ │
│ ║  │ 🔴 REQUIERE TU ATENCIÓN INMEDIATA                       │ │
│ ║  │                                                         │ │
│ ║  │ 📊 {competencyName}: {score}/5                          │ │
│ ║  │    Clasificación: {classification.label}                │ │
│ ║  │                                                         │ │
│ ║  │ 💡 RECOMENDACIÓN PARA TI:                               │ │
│ ║  │ "{insight.action}"                                      │ │
│ ║  │                                                         │ │
│ ║  │ 🎯 Pregunta sugerida para el 1:1:                       │ │
│ ║  │ "{pregunta contextual generada}"                        │ │
│ ║  └─────────────────────────────────────────────────────────┘ │
│ ║                                                               │
│ ║  ┌─────────────────────────────────────────────────────────┐ │
│ ║  │ 🟢 FORTALEZA PARA APROVECHAR                            │ │
│ ║  │                                                         │ │
│ ║  │ 📊 {competencyName}: {score}/5 ({classification.label}) │ │
│ ║  │                                                         │ │
│ ║  │ 💡 OPORTUNIDAD DE GESTIÓN:                              │ │
│ ║  │ "{insight con oportunidad de aprovechar}"               │ │
│ ║  │                                                         │ │
│ ║  │ 🎯 Acción sugerida:                                     │ │
│ ║  │ • {acción concreta 1}                                   │ │
│ ║  │ • {acción concreta 2}                                   │ │
│ ║  └─────────────────────────────────────────────────────────┘ │
│ ║                                                               │
│ ║  ┌─────────────────────────────────────────────────────────┐ │
│ ║  │ 🟡 MONITOREAR                                           │ │
│ ║  │                                                         │ │
│ ║  │ {competencyName}: {score}/5 - Levemente bajo promedio   │ │
│ ║  │ 💡 "Observa si mejora en próximo ciclo"                 │ │
│ ║  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### PRINCIPIOS DE DISEÑO:

1. **Monolito/Chasis único**: Todo dentro de UN contenedor con borde
2. **Línea de circuito vertical**: A la izquierda (║) conectando todos los hallazgos
3. **Secciones integradas, no tarjetas flotantes**: Las secciones son PARTE del informe
4. **Títulos de sección diferenciados**:
   - 🔴 REQUIERE TU ATENCIÓN INMEDIATA (critical)
   - 🟢 FORTALEZA PARA APROVECHAR (strength)
   - 🟡 MONITOREAR (monitor)
5. **Contenido estructurado por sección**:
   - Competencia + score + clasificación
   - RECOMENDACIÓN PARA TI / OPORTUNIDAD DE GESTIÓN
   - Pregunta sugerida para 1:1 / Acción sugerida

#### USAR management-insights.ts:

```typescript
import { getManagementInsights, getHighlightInsights } from '@/lib/management-insights'

// Generar insights desde competencias
const insights = getManagementInsights(competencies)

// Filtrar por tipo
const critical = insights.filter(i => i.type === 'critical')
const strengths = insights.filter(i => i.type === 'strength')  
const monitor = insights.filter(i => i.type === 'monitor')
```

#### CSS Sugerido para línea de circuito:

```tsx
{/* Contenedor principal - Chasis */}
<div className="fhr-card relative overflow-hidden">
  {/* Header */}
  <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
    <h3 className="text-sm font-medium text-slate-200 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400" />
      ALERTAS DE GESTIÓN - {employeeName}
    </h3>
  </div>
  
  {/* Body con línea de circuito */}
  <div className="p-4 relative">
    {/* Línea vertical de circuito */}
    <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-red-500 via-emerald-500 to-amber-500" />
    
    {/* Contenido con padding-left para la línea */}
    <div className="pl-8 space-y-4">
      {/* Secciones aquí */}
    </div>
  </div>
</div>
```

---

## ⚠️ NOTAS CRÍTICAS

### Conversión de escala:
- API retorna `avgScore` en escala **0-100**
- Componentes esperan escala **1-5**
- Conversión: `score / 20`

### TeamCalibrationHUD sin datos:
Si `teamMembers.length === 0`, mostrar mensaje:
```
"No hay suficientes evaluaciones completadas para mostrar el ranking."
```

### Toggle minimalista:
- Sin iconos
- Sin pills coloridas
- Solo texto con background subtle al activar
- Colores: cyan para activo, slate para inactivo

---

## ✅ CHECKLIST ANTES DE EJECUTAR

- [ ] Revertir cambios anteriores con `git restore`
- [ ] Verificar que TeamCalibrationHUD.tsx existe en `/src/components/performance/`
- [ ] Verificar que management-insights.ts existe en `/src/lib/`
- [ ] **⚠️ CRÍTICO**: Verificar ManagementAlertsHUD.tsx - si tiene diseño de "tarjetas flotantes", REESCRIBIRLO como Consola de Inteligencia Unificada (ver especificaciones arriba)
- [ ] Solo modificar `[assignmentId]/summary/page.tsx`

---

## ⚠️ VERIFICAR ManagementAlertsHUD EXISTENTE

El componente creado por Claude Code puede tener diseño incorrecto (tarjetas flotantes).

**SI tiene diseño de post-its/tarjetas separadas → REESCRIBIR** siguiendo:
1. Contenedor único "chasis"
2. Línea de circuito vertical conectando secciones
3. Títulos de sección integrados (no etiquetas de tarjeta)
4. Estructura: ATENCIÓN REQUERIDA → FORTALEZAS → MONITOREAR

---

## 🎨 DISEÑO VISUAL ESPERADO

```
┌─────────────────────────────────────────────────────────────┐
│ ← Volver a Mis Evaluaciones                                 │
├─────────────────────────────────────────────────────────────┤
│ Resumen de Evaluación                                       │
│ María López · Supervisor                                    │
├─────────────────────────────────────────────────────────────┤
│ ✓ Evaluación Completada - 1 feb 2026                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ RESULTADO                                               ││
│ │ Supera Expectativas                                     ││
│ │ ████████████████████░░░░░ 4.0/5                        ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│              [ Calibración ]  [ Alertas ]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ SI CALIBRACIÓN:                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🏆 CALIBRACIÓN DE EQUIPO                                ││
│ │                                                         ││
│ │  1. Juan Pérez      ████████████████░░░ 4.2            ││
│ │  2. María López ◀   ███████████████░░░░ 4.0  ← ACTUAL  ││
│ │  3. Carlos Ruiz     ██████████████░░░░░ 3.8            ││
│ │  4. Ana Torres      █████████████░░░░░░ 3.5            ││
│ │  5. Pedro Soto      ████████████░░░░░░░ 3.2            ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ SI ALERTAS (Consola de Inteligencia Unificada):             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🚨 ALERTAS DE GESTIÓN - María López                     ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ║                                                       ││
│ │ ║  🔴 REQUIERE TU ATENCIÓN INMEDIATA                    ││
│ │ ║  ─────────────────────────────────                    ││
│ │ ║  📊 Feedback y Coaching: 2.0/5                        ││
│ │ ║     Clasificación: Requiere Atención                  ││
│ │ ║                                                       ││
│ │ ║  💡 RECOMENDACIÓN PARA TI:                            ││
│ │ ║  "Agenda una conversación para entender..."           ││
│ │ ║                                                       ││
│ │ ║  🎯 Pregunta sugerida para el 1:1:                    ││
│ │ ║  "¿Cómo te sientes dando feedback...?"                ││
│ │ ║                                                       ││
│ │ ║  🟢 FORTALEZA PARA APROVECHAR                         ││
│ │ ║  ─────────────────────────────────                    ││
│ │ ║  📊 Gestión del Cambio: 4.8/5 (Excepcional)           ││
│ │ ║                                                       ││
│ │ ║  💡 OPORTUNIDAD DE GESTIÓN:                           ││
│ │ ║  "María tiene habilidad excepcional..."               ││
│ │ ║                                                       ││
│ │ ║  🎯 Acción sugerida:                                  ││
│ │ ║  • Delegar liderazgo de próxima iniciativa            ││
│ │ ║  • Incluirla en comité de transformación              ││
│ │ ║                                                       ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Liderazgo                                                   │
│   Pregunta 1: ★★★★☆ 4/5                                    │
│   Pregunta 2: ★★★☆☆ 3/5                                    │
├─────────────────────────────────────────────────────────────┤
│ Comunicación                                                │
│   Pregunta 3: ★★★★★ 5/5                                    │
└─────────────────────────────────────────────────────────────┘
```

**NOTA:** La línea vertical (║) representa la "línea de circuito" que conecta visualmente todas las secciones del informe de inteligencia, dando cohesión como un sistema único, no como tarjetas flotantes.

---

## 🚀 EJECUCIÓN

1. Primero revertir cambios incorrectos:
```bash
git restore src/app/dashboard/evaluaciones/components/CinemaModeOrchestrator.tsx
git restore src/components/evaluator/cinema/SpotlightCard.tsx
git restore src/types/evaluator-cinema.ts
git restore src/app/dashboard/evaluaciones/[assignmentId]/page.tsx
```

2. Ejecutar esta TASK en el archivo correcto:
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```
