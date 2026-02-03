# TASK 06: Crear CinemaSummaryOrchestrator Component

## Objetivo
Crear el orquestador principal que integra todos los componentes del Cinema Summary.

## Archivo a Crear
```
src/app/dashboard/evaluaciones/[assignmentId]/components/CinemaSummaryOrchestrator.tsx
```

## Contexto
- Orquesta Header + Carrusel + Panel de Detalle
- Maneja estado de competencia seleccionada
- Mapea datos del API a componentes
- Fallback a categorías si no hay competencyScores

## Dependencias (creadas en tareas anteriores)
```typescript
import CinemaSummaryHeader from '@/components/performance/summary/CinemaSummaryHeader'
import CompetencyCarouselCard from '@/components/performance/summary/CompetencyCarouselCard'
import CompetencyDetailPanel from '@/components/performance/summary/CompetencyDetailPanel'
import type { CinemaSummaryData, CompetencyScoreSummary } from '@/types/evaluator-cinema'
```

## Estructura de Carpetas
```
src/app/dashboard/evaluaciones/[assignmentId]/
├── page.tsx                    # YA EXISTE
└── components/                 # CREAR CARPETA
    └── CinemaSummaryOrchestrator.tsx  # ESTE ARCHIVO
```

## Código del Componente

```typescript
'use client'

// ═══════════════════════════════════════════════════════════════════════════
// CINEMA SUMMARY ORCHESTRATOR
// Orquestador principal de la vista Cinema Summary
// Integra: Header + Carrusel de Competencias + Panel de Detalle
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CinemaSummaryHeader from '@/components/performance/summary/CinemaSummaryHeader'
import CompetencyCarouselCard from '@/components/performance/summary/CompetencyCarouselCard'
import CompetencyDetailPanel from '@/components/performance/summary/CompetencyDetailPanel'
import type { CinemaSummaryData, CompetencyScoreSummary } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface CinemaSummaryOrchestratorProps {
  summary: CinemaSummaryData
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CinemaSummaryOrchestrator({ summary }: CinemaSummaryOrchestratorProps) {
  // ═══════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════
  // MEMOIZED DATA
  // ═══════════════════════════════════════════════════════════════════════

  // Mapear competencias por nombre para lookup rápido
  const competencyMap = useMemo(() => {
    if (!summary.competencyScores) return new Map<string, CompetencyScoreSummary>()
    
    const map = new Map<string, CompetencyScoreSummary>()
    summary.competencyScores.forEach(c => {
      // Mapear por nombre de competencia (que coincide con category del API)
      map.set(c.competencyName, c)
    })
    return map
  }, [summary.competencyScores])

  // Lista de categorías disponibles (del API existente categorizedResponses)
  const categories = useMemo(() => {
    return Object.keys(summary.categorizedResponses)
  }, [summary.categorizedResponses])

  // Categoría actualmente activa (default: primera)
  const activeCategory = selectedCategory || categories[0] || ''
  
  // Datos de la competencia activa (puede ser null si no hay match)
  const activeCompetency = competencyMap.get(activeCategory) || null
  
  // Respuestas de la categoría activa
  const activeResponses = summary.categorizedResponses[activeCategory] || []

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  const handlePrevCategory = useCallback(() => {
    const currentIdx = categories.indexOf(activeCategory)
    const newIdx = currentIdx > 0 ? currentIdx - 1 : categories.length - 1
    setSelectedCategory(categories[newIdx])
  }, [categories, activeCategory])

  const handleNextCategory = useCallback(() => {
    const currentIdx = categories.indexOf(activeCategory)
    const newIdx = currentIdx < categories.length - 1 ? currentIdx + 1 : 0
    setSelectedCategory(categories[newIdx])
  }, [categories, activeCategory])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER CINEMA
            Avatar + Resultado Global + Gap Insights
        ═══════════════════════════════════════════════════════════════════ */}
        <CinemaSummaryHeader
          evaluatee={summary.evaluatee}
          completedAt={summary.completedAt}
          score={summary.overallScore || summary.averageScore}
          gapAnalysis={summary.gapAnalysis}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            CARRUSEL DE COMPETENCIAS
            Cards horizontales navegables
        ═══════════════════════════════════════════════════════════════════ */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            {/* Header de sección con navegación */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Competencias Evaluadas
              </h3>
              
              {/* Flechas de navegación */}
              {categories.length > 4 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevCategory}
                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    aria-label="Competencia anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextCategory}
                    className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    aria-label="Competencia siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Carrusel horizontal */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => {
                // Buscar datos de competencia para esta categoría
                const competencyData = competencyMap.get(category)
                
                // Score: usar el de competencia si existe, sino calcular de respuestas
                const score = competencyData?.overallAvgScore || 
                  calculateCategoryAverage(summary.categorizedResponses[category])
                
                return (
                  <CompetencyCarouselCard
                    key={category}
                    code={competencyData?.competencyCode || 'DEFAULT'}
                    name={category}
                    score={score}
                    isSelected={category === activeCategory}
                    onClick={() => handleSelectCategory(category)}
                  />
                )
              })}
            </div>

            {/* Indicadores de posición (dots) */}
            {categories.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleSelectCategory(category)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      category === activeCategory 
                        ? 'bg-cyan-400' 
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    aria-label={`Ir a ${category}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PANEL DE DETALLE
            Respuestas de la competencia seleccionada
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CompetencyDetailPanel
            competency={activeCompetency}
            responses={activeResponses}
            categoryName={activeCategory}
          />
        </motion.div>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcula el promedio de ratings de un array de respuestas
 * Fallback cuando no hay datos de competencyScores
 */
function calculateCategoryAverage(responses: any[]): number {
  if (!responses || responses.length === 0) return 0
  
  const ratings = responses
    .map(r => r.rating || r.normalizedScore)
    .filter((r): r is number => r !== null && r !== undefined)
  
  if (ratings.length === 0) return 0
  
  const sum = ratings.reduce((acc, val) => acc + val, 0)
  return sum / ratings.length
}
```

## Validación

```bash
# Verificar que compila
npx tsc --noEmit

# El componente debe:
# 1. Renderizar Header con datos del evaluado
# 2. Mostrar carrusel de competencias/categorías
# 3. Permitir navegación entre competencias
# 4. Actualizar panel de detalle al seleccionar
# 5. Funcionar aunque no haya competencyScores (fallback a categorías)
```

## Criterios de Éxito
- [ ] El componente renderiza sin errores
- [ ] El Header muestra resultado global y badges
- [ ] El carrusel es navegable con click y flechas
- [ ] Los dots indican la posición actual
- [ ] El panel de detalle se actualiza al cambiar selección
- [ ] Funciona correctamente con y sin competencyScores
- [ ] El scroll horizontal funciona sin mostrar scrollbar

## NO Modificar
- Los componentes importados (Header, CarouselCard, DetailPanel)
- Los tipos de evaluator-cinema
