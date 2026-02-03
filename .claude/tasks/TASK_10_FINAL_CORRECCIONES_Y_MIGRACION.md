# TASK 10: Correcciones Cinema Summary + Migración a Ruta Final

## Objetivo
Corregir todos los errores de la página Cinema Summary y moverla a la ruta `/summary/page.tsx` donde el botón "VER RESUMEN" ya navega.

## Errores a Corregir

| # | Problema | Causa | Solución |
|---|----------|-------|----------|
| 1 | Avatar "MR" | `getInitials()` recibe nombre sin formatear | `getInitials(formatDisplayNameFull(name))` |
| 2 | Nombre invertido | No usa `formatDisplayNameFull()` | `formatDisplayNameFull(name)` |
| 3 | Score 0.2 | PerformanceResultCard espera 0-100, recibe 1-5 | `score * 20` o usar `getPerformanceClassification()` directo |
| 4 | Carrusel códigos | API no hace lookup Competency.code → name | Agregar query de competencias al API |
| 5 | Panel vacío | Verificar que responses se pasan | Debug + fix si necesario |

---

## FASE 1: Correcciones en Código Existente

### CORRECCIÓN 1: API - Lookup Competencias

**Archivo:** `src/app/api/evaluator/assignments/[id]/summary/route.ts`

**Agregar al select de question:**
```typescript
include: {
  question: {
    select: {
      id: true,
      text: true,
      category: true,
      questionOrder: true,
      responseType: true,
      choiceOptions: true,
      competencyCode: true  // ← AGREGAR
    }
  }
}
```

**Agregar DESPUÉS de obtener responses y ANTES de agrupar:**
```typescript
// ═══════════════════════════════════════════════════════════════════════
// LOOKUP COMPETENCIAS: code → name
// ═══════════════════════════════════════════════════════════════════════
const competencyCodes = [...new Set(
  responses
    .map(r => r.question.competencyCode)
    .filter((c): c is string => c != null && c.trim() !== '')
)];

let competencyNameMap: Record<string, string> = {};
if (competencyCodes.length > 0) {
  const competencies = await prisma.competency.findMany({
    where: { 
      accountId: userContext.accountId,
      code: { in: competencyCodes } 
    },
    select: { code: true, name: true }
  });
  competencyNameMap = Object.fromEntries(
    competencies.map(c => [c.code, c.name])
  );
}
```

**Modificar agrupación:**
```typescript
const categorizedResponses: Record<string, any[]> = {};
responses.forEach(r => {
  const code = r.question.competencyCode || r.question.category || 'General';
  const groupName = competencyNameMap[code] || code;  // ← Usar nombre si existe
  
  if (!categorizedResponses[groupName]) {
    categorizedResponses[groupName] = [];
  }

  categorizedResponses[groupName].push({
    questionId: r.questionId,
    questionText: r.question.text,
    questionOrder: r.question.questionOrder,
    responseType: r.question.responseType,
    rating: r.rating,
    textResponse: r.textResponse,
    choiceResponse: r.choiceResponse,
    normalizedScore: r.normalizedScore,
    competencyCode: r.question.competencyCode || null  // ← Para ícono del carrusel
  });
});
```

---

### CORRECCIÓN 2: Header - Nombre y Avatar

**Archivo:** `src/components/performance/summary/CinemaSummaryHeader.tsx`

**Agregar import:**
```typescript
import { formatDisplayNameFull, getInitials } from '@/lib/utils/formatName'
```

**Dentro del componente, ANTES del return:**
```typescript
// Formatear nombre PRIMERO, luego extraer iniciales
const displayName = formatDisplayNameFull(evaluatee.fullName)
const initials = getInitials(displayName)
```

**En el JSX - Avatar:**
```tsx
<div className="w-28 h-28 md:w-36 md:h-36 rounded-full ...">
  {initials}  {/* Ahora será "PI" */}
</div>
```

**En el JSX - Nombre:**
```tsx
<h2 className="text-xl md:text-2xl font-bold text-white ...">
  {displayName}  {/* Ahora será "Paulina Isabel Montero Reyes" */}
</h2>
```

---

### CORRECCIÓN 3: Header - Score

**Archivo:** `src/components/performance/summary/CinemaSummaryHeader.tsx`

**El problema:** `PerformanceResultCard` espera 0-100, pero `score` viene en 1-5.

**Opción A - Multiplicar antes de pasar:**
```typescript
{score !== null && (
  <PerformanceResultCard
    score={score * 20}  // 4.0 * 20 = 80
    variant="expanded"
  />
)}
```

**Opción B - Usar clasificación directamente (más robusto):**
```typescript
import { getPerformanceClassification } from '@/config/performanceClassification'

// En el componente:
const scoreOn5 = score !== null ? (score <= 5 ? score : score / 20) : null
const classification = scoreOn5 ? getPerformanceClassification(scoreOn5) : null

// En JSX - Reemplazar PerformanceResultCard con:
{scoreOn5 !== null && classification && (
  <div className="fhr-card relative overflow-hidden p-4">
    {/* Línea Tesla */}
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{
        background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
      }}
    />
    
    <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">
      Resultado
    </p>
    
    <p className="text-base font-medium mb-3" style={{ color: classification.color }}>
      {classification.label}
    </p>
    
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(scoreOn5 / 5) * 100}%`,
            background: `linear-gradient(90deg, ${classification.color}80, ${classification.color})`
          }}
        />
      </div>
      <span className="text-base text-slate-300 font-medium tabular-nums">
        {scoreOn5.toFixed(1)}
      </span>
    </div>
    
    <div className="flex justify-between mt-2 text-xs text-slate-600">
      <span>0</span>
      <span>5</span>
    </div>
  </div>
)}
```

---

### CORRECCIÓN 4: Orchestrator - Código de Competencia para Ícono

**Archivo:** `src/app/dashboard/evaluaciones/[assignmentId]/components/CinemaSummaryOrchestrator.tsx`

**Agregar helper:**
```typescript
// Extraer código de competencia del primer response del grupo (para ícono)
function getCompetencyCode(responses: any[]): string {
  if (!responses || responses.length === 0) return 'DEFAULT'
  const withCode = responses.find(r => r.competencyCode)
  return withCode?.competencyCode || 'DEFAULT'
}
```

**Modificar el render del carrusel:**
```typescript
{categories.map((category) => {
  const categoryResponses = summary.categorizedResponses[category] || []
  const competencyCode = getCompetencyCode(categoryResponses)
  const competencyData = competencyMap.get(category)
  const score = competencyData?.overallAvgScore || 
    calculateCategoryAverage(categoryResponses)
  
  return (
    <CompetencyCarouselCard
      key={category}
      code={competencyCode}  // ← Para el ícono
      name={category}        // ← Ahora es el nombre, no el código
      score={score}
      isSelected={category === activeCategory}
      onClick={() => handleSelectCategory(category)}
    />
  )
})}
```

---

### CORRECCIÓN 5: DetailPanel - Verificar Render

**Archivo:** `src/components/performance/summary/CompetencyDetailPanel.tsx`

**Agregar debug temporal:**
```typescript
export default memo(function CompetencyDetailPanel({
  competency,
  responses,
  categoryName
}: CompetencyDetailPanelProps) {
  // DEBUG - remover después de verificar
  console.log('[DetailPanel]', { categoryName, responsesCount: responses?.length })
  
  // Verificar que responses existe y tiene elementos
  if (!responses || responses.length === 0) {
    return (
      <div className="bg-slate-800/40 rounded-2xl p-6 text-center">
        <p className="text-slate-500">No hay respuestas para {categoryName}</p>
      </div>
    )
  }
  
  // ... resto del código existente
})
```

---

## FASE 2: Probar Correcciones

1. Compilar: `npx tsc --noEmit`
2. Iniciar dev: `npm run dev`
3. Navegar a: `localhost:3000/dashboard/evaluaciones/[id]?view=summary`
4. Verificar:
   - [ ] Avatar = "PI"
   - [ ] Nombre = "Paulina Isabel Montero Reyes"
   - [ ] Score = "4.0" + "Supera Expectativas"
   - [ ] Carrusel = "Comunicación Efectiva", "Liderazgo", etc.
   - [ ] Panel = Preguntas con ratings

---

## FASE 3: Migrar a Ruta Final `/summary/page.tsx`

Una vez que todo funciona en `?view=summary`, mover a la ruta donde el botón "VER RESUMEN" navega.

**Archivo a REEMPLAZAR:** `src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx`

**Opción A - Importar el Orchestrator existente:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CinemaSummaryOrchestrator from '../components/CinemaSummaryOrchestrator'
import type { CinemaSummaryData } from '@/types/evaluator-cinema'

export default function EvaluationSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.assignmentId as string

  const [summary, setSummary] = useState<CinemaSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSummary() {
      try {
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

        if (!res.ok) throw new Error(`Error ${res.status}`)

        const json = await res.json()
        if (json.success) {
          setSummary(json.summary)
        } else {
          throw new Error(json.error || 'Error cargando resumen')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }
    fetchSummary()
  }, [assignmentId, router])

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando resumen...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-red-400 mb-2 font-medium">Error al cargar</p>
          <p className="text-slate-400 text-sm mb-6">{error || 'No se pudo cargar el resumen'}</p>
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

  // Success - Renderizar Cinema Summary
  return <CinemaSummaryOrchestrator summary={summary} />
}
```

---

## Orden de Ejecución

```
FASE 1: Correcciones (en orden)
  1. API summary/route.ts     → Lookup competencias
  2. CinemaSummaryHeader.tsx  → Nombre + avatar
  3. CinemaSummaryHeader.tsx  → Score
  4. CinemaSummaryOrchestrator.tsx → Código para ícono
  5. CompetencyDetailPanel.tsx → Debug responses

FASE 2: Probar
  → Navegar a ?view=summary
  → Verificar todos los elementos

FASE 3: Migrar
  → Reemplazar /summary/page.tsx con el código que usa CinemaSummaryOrchestrator
  → Probar navegando desde botón "VER RESUMEN"
```

---

## Criterios de Éxito Final

| Elemento | Antes | Después |
|----------|-------|---------|
| Ruta | `?view=summary` | `/summary` |
| Avatar | MR | PI |
| Nombre | MONTERO REYES, PAULINA | Paulina Isabel Montero Reyes |
| Score | 0.2 Requiere Atención | 4.0 Supera Expectativas |
| Carrusel | CORE-COMM | Comunicación Efectiva |
| Panel | Vacío | Preguntas con ratings |
| Navegación | Rota | Botón "VER RESUMEN" funciona |
