# ════════════════════════════════════════════════════════════════════════════
# TASK B: Conectar Flujos - SpotlightCard + Tab "ÚLTIMO PASO"
# ════════════════════════════════════════════════════════════════════════════
# Archivo: .claude/tasks/TASK_B_connect_flows.md
# Proyecto: FocalizaHR
# Prioridad: Alta
# Estimación: 2-3 horas
# Dependencias: TASK A (Backend) completada
# ════════════════════════════════════════════════════════════════════════════

## 📋 RESUMEN

Conectar el flujo de Evaluación de Desempeño con el flujo de Potencial mediante:
1. Agregar botón "EVALUAR POTENCIAL" en SpotlightCard (para completados)
2. Condicionar botón "VER RESUMEN" (solo activo si tiene potencial)
3. Cambiar etiqueta del tab "COMPLETADAS" → "ÚLTIMO PASO"
4. Agregar potentialScore al hook para saber el estado

**NO modifica la página /ratings** - eso va en TASK C.

---

## 🎯 OBJETIVOS

1. Modificar API `/api/evaluator/assignments` para incluir potentialScore
2. Actualizar hook `useEvaluatorCinemaMode` para exponer potentialScore
3. Modificar `SpotlightCard` para mostrar botones condicionales
4. Modificar `Rail.tsx` para cambiar etiqueta del tab

---

## ✅ CRITERIOS DE ÉXITO

```yaml
API:
  - [ ] /api/evaluator/assignments retorna potentialScore por cada assignment
  - [ ] Query batch a PerformanceRating (eficiente)

Hook:
  - [ ] employees incluye potentialScore
  - [ ] employees incluye cycleId (para navegación)

SpotlightCard:
  - [ ] Muestra "EVALUAR POTENCIAL" si status=completed Y potentialScore=null
  - [ ] Muestra "VER RESUMEN" activo si potentialScore != null
  - [ ] Muestra "VER RESUMEN" deshabilitado si potentialScore = null
  - [ ] Navega correctamente a /dashboard/performance/cycles/[cycleId]/ratings

Rail:
  - [ ] Tab "COMPLETADAS" ahora dice "ÚLTIMO PASO"
  - [ ] Indicador visual de estado (opcional: ✓⏳ vs ✓✓)

Zero Breaking Changes:
  - [ ] Evaluaciones pendientes funcionan igual
  - [ ] Flujo de evaluación no se afecta
```

---

## 📝 CAMBIO 1: API /api/evaluator/assignments/route.ts

### Agregar query a PerformanceRating

```typescript
// UBICACIÓN: src/app/api/evaluator/assignments/route.ts
// BUSCAR: const assignments = await prisma.evaluationAssignment.findMany(...)

// DESPUÉS del findMany de assignments, AGREGAR:

// ════════════════════════════════════════════════════════════════════════════
// NUEVO: Obtener potentialScore de PerformanceRating
// No hay FK directa, usamos cycleId + employeeId (evaluateeId)
// ════════════════════════════════════════════════════════════════════════════

const cycleId = cycle?.id

if (cycleId) {
  // Obtener todos los employeeIds únicos
  const employeeIds = [...new Set(assignments.map(a => a.evaluateeId))]
  
  // Query batch (más eficiente que N queries)
  const performanceRatings = await prisma.performanceRating.findMany({
    where: {
      cycleId,
      employeeId: { in: employeeIds }
    },
    select: {
      employeeId: true,
      potentialScore: true,
      potentialLevel: true,
      nineBoxPosition: true
    }
  })
  
  // Crear mapa para lookup O(1)
  var ratingsMap = new Map(
    performanceRatings.map(r => [r.employeeId, r])
  )
} else {
  var ratingsMap = new Map()
}
```

### Modificar el mapeo de assignments

```typescript
// BUSCAR: const mappedAssignments = assignments.map(a => {

// MODIFICAR para incluir potentialScore:
const mappedAssignments = assignments.map(a => {
  // ... código existente para calcular avgScore ...
  
  // NUEVO: Lookup de PerformanceRating
  const rating = ratingsMap.get(a.evaluateeId)
  
  return {
    id: a.id,
    status: a.status.toLowerCase(),
    completedAt: a.status === 'COMPLETED' ? a.updatedAt.toISOString() : undefined,
    dueDate: a.dueDate?.toISOString(),
    evaluationType: a.evaluationType,
    avgScore,
    
    // ═══ NUEVOS CAMPOS (desde ratingsMap) ═══
    potentialScore: rating?.potentialScore ?? null,
    potentialLevel: rating?.potentialLevel ?? null,
    potentialAspiration: rating?.potentialAspiration ?? null,
    potentialAbility: rating?.potentialAbility ?? null,
    potentialEngagement: rating?.potentialEngagement ?? null,
    nineBoxPosition: rating?.nineBoxPosition ?? null,
    cycleId: a.cycleId,  // Para navegación a /ratings
    
    evaluatee: {
      id: a.evaluateeId,
      fullName: a.evaluateeName,
      position: a.evaluateePosition,
      departmentName: a.evaluateeDepartment,
      tenure: calculateTenureString(a.evaluatee.hireDate)
    },
    participantToken: a.participant?.uniqueToken || null,
    surveyUrl: a.participant?.uniqueToken
      ? `/encuesta/${a.participant.uniqueToken}`
      : null
  }
})
```

---

## 📝 CAMBIO 2: types/evaluator-cinema.ts

### Agregar campos a EvaluatorAssignment

```typescript
// UBICACIÓN: src/types/evaluator-cinema.ts
// BUSCAR: export interface EvaluatorAssignment

export interface EvaluatorAssignment {
  id: string
  status: string
  completedAt?: string
  dueDate?: string
  evaluationType: string

  evaluatee: {
    id: string
    fullName: string
    position: string | null
    departmentName: string
    tenure: string
  }

  avgScore: number | null
  participantToken: string | null
  surveyUrl: string | null
  
  // ═══ NUEVOS CAMPOS ═══
  potentialScore: number | null
  potentialLevel: string | null
  nineBoxPosition: string | null
  cycleId: string
}
```

### Agregar campos a EmployeeCardData

```typescript
// BUSCAR: export interface EmployeeCardData

export interface EmployeeCardData {
  id: string
  assignmentId: string
  fullName: string
  displayName: string
  displayNameFull: string
  position: string
  departmentName: string
  tenure: string
  status: EmployeeCardStatus
  participantToken: string | null
  evaluationType: string
  dueDate?: string
  completedAt?: string
  avgScore: number | null
  
  // ═══ NUEVOS CAMPOS ═══
  potentialScore: number | null
  potentialLevel: string | null
  nineBoxPosition: string | null
  cycleId: string
}
```

---

## 📝 CAMBIO 3: hooks/useEvaluatorCinemaMode.ts

### Mapear nuevos campos

```typescript
// UBICACIÓN: src/hooks/useEvaluatorCinemaMode.ts
// BUSCAR: const employees = useMemo<EmployeeCardData[]>(() => {

const employees = useMemo<EmployeeCardData[]>(() => {
  return rawAssignments.map(a => ({
    id: a.evaluatee.id,
    assignmentId: a.id,
    fullName: a.evaluatee.fullName,
    displayName: formatDisplayName(a.evaluatee.fullName),
    displayNameFull: formatDisplayNameFull(a.evaluatee.fullName),
    position: a.evaluatee.position || 'Sin cargo',
    departmentName: a.evaluatee.departmentName || 'Sin departamento',
    tenure: a.evaluatee.tenure || 'Sin datos',
    status: mapStatus(a.status),
    participantToken: a.participantToken,
    evaluationType: a.evaluationType || 'Evaluacion',
    dueDate: a.dueDate,
    completedAt: a.completedAt,
    avgScore: a.avgScore ?? null,
    
    // ═══ NUEVOS CAMPOS ═══
    potentialScore: a.potentialScore ?? null,
    potentialLevel: a.potentialLevel ?? null,
    nineBoxPosition: a.nineBoxPosition ?? null,
    cycleId: a.cycleId
  }))
}, [rawAssignments])
```

---

## 📝 CAMBIO 4: SpotlightCard.tsx

### Modificar la sección de CTAs

```typescript
// UBICACIÓN: src/components/evaluator/cinema/SpotlightCard.tsx
// BUSCAR: La sección de botones CTA (probablemente al final del componente)

import { useRouter } from 'next/navigation'
import { Star, Eye, ChevronRight } from 'lucide-react'

// Dentro del componente:
const router = useRouter()

// Helper para determinar estado
const isCompleted = employee.status === 'completed'
const hasPotential = employee.potentialScore != null
const needsPotential = isCompleted && !hasPotential

// Handler para navegar a ratings
const handleEvaluatePotential = () => {
  router.push(`/dashboard/performance/cycles/${employee.cycleId}/ratings?highlight=${employee.id}`)
}

// En la sección de CTAs, REEMPLAZAR los botones actuales:

{/* ════════════════════════════════════════════════════════════════════
    CTAs DINÁMICOS SEGÚN ESTADO
    ════════════════════════════════════════════════════════════════════ */}
<div className="flex flex-col gap-3 mt-auto">
  
  {/* CASO 1: Pendiente → Mostrar "Comenzar Evaluación" */}
  {!isCompleted && employee.participantToken && (
    <button
      onClick={() => onEvaluate(employee.participantToken!)}
      className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white
                 hover:shadow-lg hover:shadow-cyan-500/25 transition-all
                 flex items-center justify-center gap-2"
    >
      <span>Comenzar Evaluación</span>
      <ChevronRight className="w-4 h-4" />
    </button>
  )}
  
  {/* CASO 2: Completado SIN potencial → Mostrar "EVALUAR POTENCIAL" activo */}
  {needsPotential && (
    <>
      <button
        onClick={handleEvaluatePotential}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                   bg-gradient-to-r from-purple-500 to-purple-600 text-white
                   hover:shadow-lg hover:shadow-purple-500/25 transition-all
                   flex items-center justify-center gap-2"
      >
        <Star className="w-4 h-4" />
        <span>Evaluar Potencial</span>
        <ChevronRight className="w-4 h-4" />
      </button>
      
      {/* Resumen deshabilitado */}
      <button
        disabled
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                   bg-slate-800/50 text-slate-500 cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        <Eye className="w-4 h-4" />
        <span>Ver Resumen</span>
      </button>
      <p className="text-xs text-slate-500 text-center">
        Completa el potencial para ver el resumen
      </p>
    </>
  )}
  
  {/* CASO 3: Completado CON potencial → Mostrar resumen + info 9-Box */}
  {isCompleted && hasPotential && (
    <>
      {/* Info de potencial y 9-Box */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 mb-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Potencial:</span>
          <span className="text-purple-400 font-semibold">
            {employee.potentialScore?.toFixed(1)} ({employee.potentialLevel})
          </span>
        </div>
        {employee.nineBoxPosition && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-400">9-Box:</span>
            <span className="text-cyan-400 font-semibold">
              {employee.nineBoxPosition.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>
      
      {/* Botón Ver Resumen ACTIVO */}
      <button
        onClick={() => onViewSummary(employee.assignmentId)}
        className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                   bg-gradient-to-r from-cyan-500 to-cyan-600 text-white
                   hover:shadow-lg hover:shadow-cyan-500/25 transition-all
                   flex items-center justify-center gap-2"
      >
        <Eye className="w-4 h-4" />
        <span>Ver Resumen Completo</span>
        <ChevronRight className="w-4 h-4" />
      </button>
      
      {/* Botón editar potencial (secundario) */}
      <button
        onClick={handleEvaluatePotential}
        className="w-full py-2 px-4 rounded-xl font-medium text-xs
                   bg-slate-800/50 text-slate-400 border border-slate-700
                   hover:bg-slate-700/50 hover:text-white transition-all
                   flex items-center justify-center gap-2"
      >
        <Star className="w-3 h-3" />
        <span>Editar Potencial</span>
      </button>
    </>
  )}
  
  {/* Botón Volver (siempre visible) */}
  <button
    onClick={onBack}
    className="w-full py-2 px-4 rounded-xl font-medium text-xs
               text-slate-400 hover:text-white transition-all"
  >
    ← Volver al equipo
  </button>
</div>
```

---

## 📝 CAMBIO 5: Rail.tsx - Cambiar etiqueta del tab

```typescript
// UBICACIÓN: src/components/evaluator/cinema/Rail.tsx
// BUSCAR: Los tabs del carrusel (probablemente un array o enum)

// ANTES:
const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' }  // ← CAMBIAR
]

// DESPUÉS:
const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Último Paso' }  // ← NUEVO NOMBRE
]
```

### (Opcional) Agregar indicador de estado en las cards

```typescript
// Si quieres mostrar ✓⏳ vs ✓✓ en cada card del carrusel:

// En el componente de cada card del Rail:
{employee.status === 'completed' && (
  <span className={cn(
    'absolute top-2 right-2 text-xs font-mono',
    employee.potentialScore ? 'text-emerald-400' : 'text-amber-400'
  )}>
    {employee.potentialScore ? '✓✓' : '✓⏳'}
  </span>
)}
```

---

## 🧪 TESTING

### Test 1: API retorna potentialScore

```bash
GET /api/evaluator/assignments
Authorization: Bearer <token>

# Esperar que cada assignment tenga:
{
  "id": "...",
  "status": "completed",
  "avgScore": 4.2,
  "potentialScore": null,        // ← NUEVO (null si no asignado)
  "potentialLevel": null,
  "nineBoxPosition": null,
  "cycleId": "cycle_xxx"         // ← NUEVO
}
```

### Test 2: SpotlightCard - Estado pendiente

```yaml
Escenario: Click en empleado con status "ready" o "in_progress"
Esperar:
  - Botón "Comenzar Evaluación" visible y activo
  - Sin botones de potencial o resumen
```

### Test 3: SpotlightCard - Completado SIN potencial

```yaml
Escenario: Click en empleado con status "completed" Y potentialScore = null
Esperar:
  - Botón "EVALUAR POTENCIAL" visible, activo, color morado
  - Botón "Ver Resumen" visible pero DESHABILITADO (gris)
  - Mensaje "Completa el potencial para ver el resumen"
```

### Test 4: SpotlightCard - Completado CON potencial

```yaml
Escenario: Click en empleado con status "completed" Y potentialScore = 4.3
Esperar:
  - Info de potencial y 9-Box visible
  - Botón "Ver Resumen Completo" activo (cyan)
  - Botón "Editar Potencial" secundario visible
```

### Test 5: Navegación a /ratings

```yaml
Escenario: Click en "EVALUAR POTENCIAL"
Esperar:
  - Navega a /dashboard/performance/cycles/{cycleId}/ratings?highlight={employeeId}
  - (La página actual funciona, en TASK C la mejoramos)
```

### Test 6: Tab "ÚLTIMO PASO"

```yaml
Escenario: Ver tabs del Rail
Esperar:
  - Tab dice "Último Paso" (no "Completadas")
  - Filtra correctamente los completados
```

---

## 📋 PASOS DE IMPLEMENTACIÓN

```yaml
1. Modificar API assignments (30 min):
   - Agregar query a PerformanceRating
   - Agregar campos al mapeo

2. Actualizar tipos (10 min):
   - EvaluatorAssignment
   - EmployeeCardData

3. Actualizar hook (10 min):
   - Mapear nuevos campos

4. Modificar SpotlightCard (45 min):
   - Agregar lógica de estados
   - Crear CTAs dinámicos
   - Handler de navegación

5. Modificar Rail (15 min):
   - Cambiar etiqueta tab
   - (Opcional) Indicadores ✓✓/✓⏳

6. Testing (30 min):
   - Todos los escenarios
```

---

## ⚠️ NOTAS IMPORTANTES

### La página /ratings sigue igual (por ahora)

```yaml
En TASK B:
  - Solo NAVEGAMOS a /ratings
  - La página actual funciona (botones 1-5)
  - En TASK C la mejoramos con Cinema Mode

Por qué:
  - Podemos desplegar TASK B independiente
  - El flujo ya queda conectado
  - La UX mejora incremental
```

### Query batch eficiente

```yaml
✅ UN solo query para todos los PerformanceRating
✅ Map para lookup O(1)
❌ NO hacemos N queries (uno por empleado)
```

---

## 🏁 ENTREGABLES

```yaml
Archivos Modificados:
  - src/app/api/evaluator/assignments/route.ts
  - src/types/evaluator-cinema.ts
  - src/hooks/useEvaluatorCinemaMode.ts
  - src/components/evaluator/cinema/SpotlightCard.tsx
  - src/components/evaluator/cinema/Rail.tsx
```

---

**FIN DE TASK B**
**Siguiente: TASK C (Cinema Mode para /ratings)**
