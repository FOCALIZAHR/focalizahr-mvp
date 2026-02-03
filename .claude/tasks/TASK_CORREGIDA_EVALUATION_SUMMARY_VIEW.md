# 🎯 TASK: Integrar Intelligence Sidekick Panel en EvaluationSummaryView

## ⚠️ UBICACIÓN CORRECTA - MUY IMPORTANTE

**ARCHIVO:** `src/app/dashboard/evaluaciones/[assignmentId]/page.tsx`
**SUBCOMPONENTE:** `EvaluationSummaryView` (es un subcomponente dentro del mismo archivo, NO separado)
**URL:** `/dashboard/evaluaciones/[assignmentId]?view=summary`

```typescript
// El subcomponente está aproximadamente en línea 180+
function EvaluationSummaryView({
  assignmentId,
  evaluatee
}: {
  assignmentId: string
  evaluatee: { fullName: string; position: string | null; departmentName: string }
}) {
  // ... ESTE es el componente a modificar
}
```

---

## ❌ NO MODIFICAR ESTOS ARCHIVOS

- `SpotlightCard.tsx` (Cinema Mode - diferente funcionalidad)
- `CinemaModeOrchestrator.tsx`
- `types/evaluator-cinema.ts`
- `/summary/page.tsx` (versión legacy)

---

## CONTEXTO

Los componentes de inteligencia YA EXISTEN:
- ✅ `src/lib/management-insights.ts` 
- ✅ `src/components/performance/ManagementAlertsHUD.tsx`
- ✅ `src/components/performance/TeamCalibrationHUD.tsx`
- ✅ `src/components/ui/MinimalistButton.tsx` → **MinimalistToggle**

**OBJETIVO:** Agregar toggle que alterne entre 3 vistas en `EvaluationSummaryView`.

---

## 📐 ESTRUCTURA ACTUAL DE EvaluationSummaryView

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumbs: Dashboard > Evaluaciones > Resumen             │
├─────────────────────────────────────────────────────────────┤
│ Banner: "Esta evaluación ya fue enviada. Vista solo lectura"│
├─────────────────────────────────────────────────────────────┤
│ Header Card:                                                │
│   [Avatar] Evaluación Completada                            │
│            María Antonieta López                            │
│            Cargo · Departamento                             │
│                                      [PerformanceResultCard]│
├─────────────────────────────────────────────────────────────┤
│ Respuestas por Categoría:                                   │
│   ┌─ Liderazgo ─────────────────────────────────────────┐  │
│   │ Pregunta 1: ★★★★☆ 4/5                               │  │
│   │ Pregunta 2: ★★★☆☆ 3/5                               │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 DISEÑO: 3 Vistas con Toggle

### Toggle (DESPUÉS del Header Card)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Respuestas  │ │ Calibración │ │  Alertas    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### VISTA 1: "Respuestas" (Default)
Contenido ACTUAL - las categorías con preguntas y respuestas (NO modificar)

### VISTA 2: "Calibración"
TeamCalibrationHUD mostrando ranking del equipo

### VISTA 3: "Alertas"
ManagementAlertsHUD mostrando competencias que requieren atención

---

## 🔧 IMPLEMENTACIÓN

### Paso 1: Agregar imports al inicio del archivo

```tsx
// Agregar estos imports junto a los existentes
import { MinimalistToggle } from '@/components/ui/MinimalistButton'
import TeamCalibrationHUD from '@/components/performance/TeamCalibrationHUD'
import ManagementAlertsHUD from '@/components/performance/ManagementAlertsHUD'
```

### Paso 2: Agregar estado dentro de EvaluationSummaryView

```tsx
function EvaluationSummaryView({
  assignmentId,
  evaluatee
}: {
  assignmentId: string
  evaluatee: { fullName: string; position: string | null; departmentName: string }
}) {
  const router = useRouter()
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // ═══════════════════════════════════════════════════════════════
  // NUEVO: Estado para toggle de vistas
  // ═══════════════════════════════════════════════════════════════
  const [activeView, setActiveView] = useState<'respuestas' | 'calibracion' | 'alertas'>('respuestas')
  
  const toggleOptions = [
    { value: 'respuestas', label: 'Respuestas' },
    { value: 'calibracion', label: 'Calibración' },
    { value: 'alertas', label: 'Alertas' }
  ]

  // ... resto del useEffect existente para cargar summary ...
```

### Paso 3: Transformar datos para los componentes (usando useMemo)

```tsx
  // ═══════════════════════════════════════════════════════════════
  // NUEVO: Datos para ManagementAlertsHUD (competencias con scores)
  // Los datos YA están disponibles en summary.categorizedResponses
  // ═══════════════════════════════════════════════════════════════
  const competencies = useMemo(() => {
    if (!summary?.categorizedResponses) return []
    
    return Object.entries(summary.categorizedResponses).map(([name, responses]) => {
      // Obtener ratings válidos
      const ratings = (responses as any[])
        .filter(r => r.rating !== null && r.rating !== undefined)
        .map(r => r.rating as number)
      
      // Calcular promedio (ya están en escala 1-5)
      const avgScore = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0
      
      return { name, score: avgScore }
    })
  }, [summary?.categorizedResponses])

  // ═══════════════════════════════════════════════════════════════
  // NUEVO: Datos para TeamCalibrationHUD
  // NOTA: Requiere fetch adicional para obtener otros evaluados del mismo ciclo
  // Por ahora, mostrar mensaje o implementar fetch
  // ═══════════════════════════════════════════════════════════════
  const [teamMembers, setTeamMembers] = useState<{id: string, name: string, score: number}[]>([])
  
  // TODO: Fetch de /api/evaluator/assignments para obtener todos los del equipo
  // Por ahora, TeamCalibrationHUD mostrará mensaje de "datos no disponibles"
```

### Paso 4: Modificar el JSX del componente

Ubicar el return del componente y agregar el toggle DESPUÉS del Header Card, ANTES de las categorías:

```tsx
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumbs - NO MODIFICAR */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        {/* ... breadcrumbs existentes ... */}
      </nav>

      {/* Banner No-Editable - NO MODIFICAR */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        {/* ... banner existente ... */}
      </div>

      {/* Header Card - NO MODIFICAR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fhr-card p-6 bg-green-500/5 border-green-500/30"
      >
        {/* ... header card existente ... */}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════
          NUEVO: Toggle de vistas
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex justify-center">
        <MinimalistToggle
          options={toggleOptions}
          activeValue={activeView}
          onChange={(value) => setActiveView(value as 'respuestas' | 'calibracion' | 'alertas')}
          size="md"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          NUEVO: Contenido condicional según vista
          ═══════════════════════════════════════════════════════════════ */}
      {activeView === 'respuestas' && (
        <>
          {/* Respuestas por Categoría - CÓDIGO EXISTENTE, mover aquí */}
          {categories.map(([category, responses], catIdx) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className="fhr-card p-6"
            >
              {/* ... contenido existente de categorías ... */}
            </motion.div>
          ))}
        </>
      )}

      {activeView === 'calibracion' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fhr-card p-6"
        >
          {teamMembers.length > 1 ? (
            <TeamCalibrationHUD
              teamMembers={teamMembers}
              currentEvaluateeId={assignmentId}
              maxVisible={5}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">
                Calibración de equipo no disponible para esta evaluación.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Se requieren múltiples evaluaciones completadas del mismo evaluador.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {activeView === 'alertas' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {competencies.length > 0 ? (
            <ManagementAlertsHUD
              competencies={competencies}
              employeeName={evaluatee.fullName}
            />
          ) : (
            <div className="fhr-card p-6 text-center">
              <p className="text-slate-500">
                No hay datos de competencias disponibles.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
```

---

## 📊 DATOS DISPONIBLES

### ✅ Para ManagementAlertsHUD - DATOS YA DISPONIBLES

El componente YA tiene acceso a `summary.categorizedResponses`:

```typescript
{
  "Liderazgo": [
    { rating: 4, questionText: "...", normalizedScore: 80 },
    { rating: 3, questionText: "...", normalizedScore: 60 }
  ],
  "Comunicación": [
    { rating: 5, questionText: "...", normalizedScore: 100 }
  ]
}
```

Solo necesita transformarse a formato `{ name, score }[]`

### ⚠️ Para TeamCalibrationHUD - DATOS REQUIEREN FETCH ADICIONAL

Para mostrar el ranking del equipo, se necesita:
1. Obtener todas las evaluaciones del mismo evaluador
2. Filtrar las completadas
3. Transformar a formato `{ id, name, score }[]`

**Opción simple (recomendada para MVP):** 
- Mostrar mensaje "No disponible en esta vista"
- O simplemente NO mostrar la opción "Calibración" en el toggle

**Opción completa (requiere más trabajo):**
- Agregar fetch a `/api/evaluator/assignments` 
- Transformar datos

---

## ✅ CHECKLIST IMPLEMENTACIÓN

### Paso 1: Imports
- [ ] Agregar import de `MinimalistToggle`
- [ ] Agregar import de `TeamCalibrationHUD`
- [ ] Agregar import de `ManagementAlertsHUD`
- [ ] Agregar import de `useMemo` (si no está)

### Paso 2: Estado
- [ ] Agregar estado `activeView` con default `'respuestas'`
- [ ] Agregar `toggleOptions` array

### Paso 3: Datos
- [ ] Agregar `useMemo` para transformar `competencies`
- [ ] (Opcional) Agregar fetch para `teamMembers`

### Paso 4: JSX
- [ ] Agregar `MinimalistToggle` después del Header Card
- [ ] Envolver categorías existentes en condicional `respuestas`
- [ ] Agregar `TeamCalibrationHUD` para vista `calibracion`
- [ ] Agregar `ManagementAlertsHUD` para vista `alertas`

### Verificaciones
- [ ] Toggle funciona correctamente
- [ ] Vista "Respuestas" muestra contenido existente
- [ ] Vista "Alertas" muestra competencias con clasificación
- [ ] Vista "Calibración" muestra mensaje o datos (según implementación)

---

## 📌 NOTAS IMPORTANTES

1. **Escala de scores:**
   - Los `rating` en las respuestas YA están en escala 1-5
   - NO necesitan conversión (a diferencia del Cinema Mode que usaba 0-100)

2. **Ubicación del código:**
   - `EvaluationSummaryView` es un SUBCOMPONENTE dentro de `page.tsx`
   - Está aproximadamente entre las líneas 180-350 del archivo

3. **NO crear archivos nuevos:**
   - Todo se modifica dentro del archivo existente
   - Los componentes `ManagementAlertsHUD` y `TeamCalibrationHUD` ya existen

---

## 🎯 FLUJO UX ESPERADO

```
JEFE ABRE RESUMEN DE EVALUACIÓN COMPLETADA:

1. Vista "Respuestas" (default):
   → Ve todas las respuestas por categoría
   → Vista existente, sin cambios

2. Click en "Alertas":
   → Ve ManagementAlertsHUD
   → Competencias que requieren atención
   → Preguntas sugeridas para 1:1

3. Click en "Calibración":
   → Ve TeamCalibrationHUD (si hay datos)
   → O mensaje de "no disponible"
```
