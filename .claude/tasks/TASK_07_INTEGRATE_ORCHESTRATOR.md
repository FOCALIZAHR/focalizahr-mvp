# TASK 07: Integrar CinemaSummaryOrchestrator en Página Existente

## Objetivo
Modificar la página existente para usar el nuevo CinemaSummaryOrchestrator en lugar del EvaluationSummaryView actual.

## Archivo a Modificar
```
src/app/dashboard/evaluaciones/[assignmentId]/page.tsx
```

## Contexto
- La página ya tiene EvaluationSummaryView como subcomponente
- Necesitamos REEMPLAZAR ese componente con CinemaSummaryOrchestrator
- Mantener TODA la lógica de carga de datos existente
- NO modificar el flujo de WelcomeScreenManager (vista pending)

## Cambios Específicos

### 1. Agregar import del nuevo orquestador

Al inicio del archivo, agregar:

```typescript
import CinemaSummaryOrchestrator from './components/CinemaSummaryOrchestrator'
```

### 2. Actualizar el tipo SummaryData

Buscar la interface `SummaryData` y AGREGAR los nuevos campos:

```typescript
interface SummaryData {
  assignmentId: string
  evaluationType: string
  completedAt: string
  evaluatee: {
    fullName: string
    position: string | null
    department: string
  }
  cycle: {
    name: string
    endDate: string
  }
  averageScore: number | null
  totalQuestions: number
  categorizedResponses: Record<string, any[]>
  
  // ═══════════════════════════════════════════════════════════════════════
  // NUEVOS CAMPOS - Datos de competencias (TASK 01)
  // ═══════════════════════════════════════════════════════════════════════
  competencyScores: Array<{
    competencyCode: string
    competencyName: string
    overallAvgScore: number
    selfScore: number | null
    managerScore: number | null
    peerAvgScore: number | null
    selfVsOthersGap: number | null
  }> | null
  
  gapAnalysis: {
    strengths: Array<{
      competencyCode: string
      competencyName: string
      avgScore: number
      highlight: string
    }>
    developmentAreas: Array<{
      competencyCode: string
      competencyName: string
      avgScore: number
      priority: 'ALTA' | 'MEDIA' | 'BAJA'
    }>
  } | null
  
  overallScore: number | null
}
```

### 3. REEMPLAZAR la función EvaluationSummaryView completa

Buscar la función `EvaluationSummaryView` y REEMPLAZARLA completamente con:

```typescript
// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENT: Evaluation Summary - Cinema Mode View
// ════════════════════════════════════════════════════════════════════════════

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

  // Cargar datos del summary
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('focalizahr_token')
        if (!token) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        const res = await fetch(`/api/evaluator/assignments/${assignmentId}/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.status === 401) {
          router.push('/login?redirect=/dashboard/evaluaciones')
          return
        }

        if (!res.ok) {
          throw new Error(`Error ${res.status}: No se pudo cargar el resumen`)
        }

        const json = await res.json()
        
        if (json.success && json.summary) {
          setSummary(json.summary)
        } else {
          throw new Error(json.error || 'Error desconocido al cargar el resumen')
        }
      } catch (err) {
        console.error('[EvaluationSummaryView] Error:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar el resumen')
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [assignmentId, router])

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING STATE - Skeleton estilo Cinema
  // ═══════════════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          
          {/* Texto */}
          <p className="text-slate-400 text-sm">Cargando resumen de evaluación...</p>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-md">
          {/* Ícono de error */}
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          
          {/* Mensaje */}
          <p className="text-red-400 mb-2 font-medium">Error al cargar</p>
          <p className="text-slate-400 text-sm mb-6">
            {error || 'No se pudo cargar el resumen de la evaluación'}
          </p>
          
          {/* Botón volver */}
          <button
            onClick={() => router.push('/dashboard/evaluaciones')}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Volver al Portal
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUCCESS - Renderizar Cinema Summary Orchestrator
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <CinemaSummaryOrchestrator
      summary={{
        assignmentId: summary.assignmentId,
        evaluationType: summary.evaluationType,
        completedAt: summary.completedAt,
        evaluatee: {
          fullName: summary.evaluatee.fullName,
          position: summary.evaluatee.position,
          department: summary.evaluatee.department
        },
        cycle: summary.cycle,
        averageScore: summary.averageScore,
        totalQuestions: summary.totalQuestions,
        categorizedResponses: summary.categorizedResponses,
        // Nuevos campos
        competencyScores: summary.competencyScores,
        gapAnalysis: summary.gapAnalysis,
        overallScore: summary.overallScore
      }}
    />
  )
}
```

### 4. ELIMINAR código antiguo

Eliminar TODO el código JSX antiguo de EvaluationSummaryView que tenía:
- Las cards `fhr-card` básicas
- El mapeo de `categories` con `Object.entries`
- Los íconos `Star` individuales
- El `PerformanceResultCard` embebido en el header verde

Este código ya NO es necesario porque el nuevo `CinemaSummaryOrchestrator` lo reemplaza.

## Validación

```bash
# Verificar que compila
npx tsc --noEmit

# Probar en navegador:
# 1. Ir a /dashboard/evaluaciones
# 2. Click en una evaluación COMPLETADA
# 3. Debe mostrar el nuevo Cinema Summary
# 4. Header con avatar y resultado
# 5. Carrusel de competencias
# 6. Panel de detalle
```

## Criterios de Éxito
- [ ] La página compila sin errores
- [ ] La vista de evaluación completada muestra el nuevo Cinema Mode
- [ ] La navegación "Volver al Portal" funciona
- [ ] Los datos se cargan correctamente del API
- [ ] El loading state se muestra durante la carga
- [ ] El error state se muestra si hay error
- [ ] La vista WelcomeScreenManager (pending) sigue funcionando igual

## NO Modificar
- La lógica del componente principal `EvaluationDetailPage`
- El uso de `WelcomeScreenManager` para evaluaciones pendientes
- Los imports existentes que aún se usan
- Ningún otro archivo
