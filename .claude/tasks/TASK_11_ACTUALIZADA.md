# TASK 11: Ajustes Finales Cinema Summary (ACTUALIZADA)

## Problemas Identificados

| Problema | Causa | Solución |
|----------|-------|----------|
| Tarjetas pequeñas | 120px width | **200px** + min-height 140px |
| Solo texto se ve | Filtro excluye ratings | **Renderizar TODAS las respuestas directamente** |
| Sin label clasificación | No incluido | Agregar label + cantidad preguntas |

---

## CORRECCIÓN 1: CompetencyCarouselCard - Tarjetas Grandes

### Archivo
```
src/components/performance/summary/CompetencyCarouselCard.tsx
```

### Reemplazar TODO el componente con:

```typescript
'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, Users, Target, RefreshCw, Lightbulb,
  Eye, GraduationCap, Scale, Megaphone, TrendingUp, Zap, Star,
  type LucideIcon
} from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface CompetencyCarouselCardProps {
  code: string
  name: string
  score: number
  questionCount: number  // NUEVO: cantidad de preguntas
  isSelected: boolean
  onClick: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS POR COMPETENCIA
// ═══════════════════════════════════════════════════════════════════════════

const COMPETENCY_ICONS: Record<string, LucideIcon> = {
  'CORE-COMM': MessageSquare,
  'CORE-TEAM': Users,
  'CORE-RESULT': Target,
  'CORE-ADAPT': RefreshCw,
  'CORE-INNOV': Lightbulb,
  'LEAD-VISION': Eye,
  'LEAD-DEVELOP': GraduationCap,
  'LEAD-DECISION': Scale,
  'LEAD-INFLUENCE': Megaphone,
  'STRAT-BUSINESS': TrendingUp,
  'STRAT-CHANGE': Zap,
}

function getCompetencyIcon(code: string): LucideIcon {
  return COMPETENCY_ICONS[code] || Star
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyCarouselCard({
  code,
  name,
  score,
  questionCount,
  isSelected,
  onClick
}: CompetencyCarouselCardProps) {
  const classification = getPerformanceClassification(score)
  const Icon = getCompetencyIcon(code)

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // ANCHO GRANDE: 200px, altura mínima 140px
        'relative flex-shrink-0 w-[200px] min-h-[140px] p-4 rounded-xl border transition-all duration-200',
        'bg-slate-800/60 backdrop-blur text-left',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
        
        isSelected
          ? 'border-cyan-500/50 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
          : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80'
      )}
      style={{ 
        borderColor: isSelected ? undefined : `${classification.color}30` 
      }}
    >
      {/* Línea Tesla */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
        }}
      />

      {/* Ícono pequeño en esquina */}
      <div 
        className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${classification.color}20` }}
      >
        <Icon 
          className="w-4 h-4" 
          style={{ color: classification.color }}
        />
      </div>

      {/* Nombre de competencia - 2 líneas máximo */}
      <h4 className="text-sm font-medium text-slate-200 mb-3 line-clamp-2 pr-10">
        {name}
      </h4>

      {/* Score GRANDE - PROTAGONISTA */}
      <div className="text-center mt-2">
        <span 
          className="text-3xl font-light tabular-nums"
          style={{ color: classification.color }}
        >
          {score.toFixed(1)}
        </span>
        <span className="text-slate-500 text-sm">/5</span>
      </div>

      {/* Label de clasificación */}
      <p 
        className="text-xs text-center mt-2 font-medium"
        style={{ color: classification.color }}
      >
        {classification.label}
      </p>

      {/* Cantidad de preguntas */}
      <p className="text-[10px] text-slate-500 text-center mt-2">
        {questionCount} pregunta{questionCount !== 1 ? 's' : ''}
      </p>

      {/* Indicador de selección */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400"
        />
      )}
    </motion.button>
  )
})
```

---

## CORRECCIÓN 2: CompetencyDetailPanel - Sin Filtros

### Archivo
```
src/components/performance/summary/CompetencyDetailPanel.tsx
```

### Reemplazar TODO el componente con:

```typescript
'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare } from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface CategorizedResponse {
  questionId: string
  questionText: string
  questionOrder: number
  responseType: string
  rating: number | null
  textResponse: string | null
  choiceResponse: string | null
  normalizedScore: number | null
  competencyCode?: string | null
}

interface CompetencyDetailPanelProps {
  responses: CategorizedResponse[]
  categoryName: string
  avgScore?: number | null
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyDetailPanel({
  responses,
  categoryName,
  avgScore
}: CompetencyDetailPanelProps) {
  
  // DEBUG - remover después de verificar
  console.log('[DetailPanel] Rendering:', {
    categoryName,
    responsesCount: responses?.length,
    firstResponse: responses?.[0],
    avgScore
  })

  // Si no hay respuestas
  if (!responses || responses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fhr-card p-6 text-center"
      >
        <p className="text-slate-500">No hay respuestas para "{categoryName}"</p>
      </motion.div>
    )
  }

  // Clasificación para el header
  const classification = avgScore ? getPerformanceClassification(avgScore) : null

  return (
    <motion.div
      key={categoryName}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fhr-card p-6 relative overflow-hidden"
    >
      {/* Línea Tesla */}
      {classification && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${classification.color}, transparent)`
          }}
        />
      )}

      {/* Header */}
      <h3 className="text-base font-medium text-slate-200 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        {categoryName}
        {avgScore && (
          <span 
            className="ml-auto text-sm font-normal"
            style={{ color: classification?.color }}
          >
            Promedio: {avgScore.toFixed(1)}/5
          </span>
        )}
      </h3>

      {/* ═══════════════════════════════════════════════════════════════════
          LISTA DE RESPUESTAS - SIN FILTROS, RENDERIZA TODO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {responses.map((r, idx) => (
          <div
            key={r.questionId || idx}
            className="border-b border-slate-700/50 last:border-0 pb-4 last:pb-0"
          >
            {/* Texto de la pregunta */}
            <p className="text-sm text-slate-300 mb-2">
              {r.questionText}
            </p>

            {/* Rating con estrellas - SI EXISTE */}
            {r.rating !== null && r.rating !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < r.rating! 
                          ? 'text-cyan-400 fill-cyan-400' 
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-cyan-400 ml-1">
                  {r.rating}/5
                </span>
              </div>
            )}

            {/* NormalizedScore como fallback si no hay rating */}
            {r.rating === null && r.normalizedScore !== null && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const scoreOn5 = r.normalizedScore! / 20
                    return (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < scoreOn5 
                            ? 'text-cyan-400 fill-cyan-400' 
                            : 'text-slate-600'
                        }`}
                      />
                    )
                  })}
                </div>
                <span className="text-sm font-medium text-cyan-400 ml-1">
                  {(r.normalizedScore! / 20).toFixed(1)}/5
                </span>
              </div>
            )}

            {/* Respuesta de texto */}
            {r.textResponse && r.textResponse.trim().length > 0 && (
              <div className="flex items-start gap-2 bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mt-2">
                <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300 italic">
                  "{r.textResponse}"
                </p>
              </div>
            )}

            {/* DEBUG: Mostrar tipo y valores raw - REMOVER DESPUÉS */}
            <p className="text-[9px] text-slate-600 mt-1 font-mono">
              tipo: {r.responseType || 'null'} | rating: {r.rating ?? 'null'} | normalized: {r.normalizedScore ?? 'null'}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
})
```

---

## CORRECCIÓN 3: Orchestrator - Pasar questionCount y avgScore

### Archivo
```
src/app/dashboard/evaluaciones/[assignmentId]/components/CinemaSummaryOrchestrator.tsx
```

### Modificar el render del carrusel:

**Buscar donde se mapean las categories y agregar:**

```typescript
{categories.map((category) => {
  const categoryResponses = summary.categorizedResponses[category] || []
  const competencyCode = getCompetencyCode(categoryResponses)
  
  // Calcular promedio de esta categoría
  const ratings = categoryResponses
    .map(r => r.rating ?? (r.normalizedScore ? r.normalizedScore / 20 : null))
    .filter((r): r is number => r !== null)
  const avgScore = ratings.length > 0 
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
    : 0
  
  return (
    <CompetencyCarouselCard
      key={category}
      code={competencyCode}
      name={category}
      score={avgScore}
      questionCount={categoryResponses.length}  // NUEVO
      isSelected={category === activeCategory}
      onClick={() => handleSelectCategory(category)}
    />
  )
})}
```

### Modificar el render del panel de detalle:

```typescript
{/* Panel de Detalle */}
<CompetencyDetailPanel
  responses={activeResponses}
  categoryName={activeCategory}
  avgScore={calculateCategoryAverage(activeResponses)}  // Pasar promedio
/>
```

### Actualizar helper calculateCategoryAverage:

```typescript
function calculateCategoryAverage(responses: any[]): number | null {
  if (!responses || responses.length === 0) return null
  
  const ratings = responses
    .map(r => r.rating ?? (r.normalizedScore ? r.normalizedScore / 20 : null))
    .filter((r): r is number => r !== null)
  
  if (ratings.length === 0) return null
  
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}
```

---

## CORRECCIÓN 4: Actualizar Tipos

### Archivo
```
src/types/evaluator-cinema.ts
```

### Actualizar CompetencyCarouselCardProps:

```typescript
export interface CompetencyCarouselCardProps {
  code: string
  name: string
  score: number
  questionCount: number  // AGREGAR
  isSelected: boolean
  onClick: () => void
}

export interface CompetencyDetailPanelProps {
  responses: CategorizedResponse[]
  categoryName: string
  avgScore?: number | null  // AGREGAR
}
```

---

## Validación

Después de aplicar los cambios:

1. **Tarjetas del carrusel:**
   - [ ] Ancho 200px, altura mínima 140px
   - [ ] Score grande (text-3xl)
   - [ ] Label de clasificación visible
   - [ ] Cantidad de preguntas visible

2. **Panel de preguntas:**
   - [ ] Console.log muestra datos
   - [ ] TODAS las preguntas se muestran
   - [ ] Ratings con estrellas cyan
   - [ ] Texto abierto con estilo purple
   - [ ] Debug line muestra valores raw

3. **Si aún no se ven ratings:**
   - Revisar el debug line: `tipo: X | rating: Y | normalized: Z`
   - Si rating es `null` y normalizedScore tiene valor → el fallback lo mostrará
   - Si ambos son `null` → el API no está retornando el rating

---

## Orden de Ejecución

1. Actualizar tipos en `evaluator-cinema.ts`
2. Reemplazar `CompetencyCarouselCard.tsx`
3. Reemplazar `CompetencyDetailPanel.tsx`
4. Modificar `CinemaSummaryOrchestrator.tsx`
5. `npx tsc --noEmit`
6. Probar en browser
7. Revisar console.log y debug lines
8. Una vez funcionando, remover las líneas de debug
