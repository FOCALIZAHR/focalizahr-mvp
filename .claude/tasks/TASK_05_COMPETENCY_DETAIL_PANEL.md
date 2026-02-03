# TASK 05: Crear CompetencyDetailPanel Component

## Objetivo
Crear el panel de detalle que muestra las respuestas de una competencia seleccionada.

## Archivo a Crear
```
src/components/performance/summary/CompetencyDetailPanel.tsx
```

## Contexto
- Se muestra debajo del carrusel cuando se selecciona una competencia
- Muestra preguntas con ratings (estrellas + barra)
- Muestra feedback de texto con estilo diferenciado (purple)
- Animaciones de entrada/salida

## Código del Componente

```typescript
'use client'

// ═══════════════════════════════════════════════════════════════════════════
// COMPETENCY DETAIL PANEL
// Panel expandido que muestra respuestas de una competencia seleccionada
// Diseño FocalizaHR: Glassmorphism + Estrellas + Feedback cualitativo
// ═══════════════════════════════════════════════════════════════════════════

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare } from 'lucide-react'
import { getPerformanceClassification } from '@/config/performanceClassification'
import type { CompetencyDetailPanelProps, CategorizedResponse } from '@/types/evaluator-cinema'

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renderiza una respuesta de tipo rating con estrellas y barra
 */
function RatingResponseCard({ 
  response, 
  index 
}: { 
  response: CategorizedResponse
  index: number 
}) {
  const rating = response.rating || 0
  const percentage = (rating / 5) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30"
    >
      {/* Texto de la pregunta */}
      <p className="text-sm text-slate-300 mb-3">
        {index + 1}. {response.questionText}
      </p>
      
      <div className="flex items-center gap-4">
        {/* Estrellas */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 transition-colors ${
                i < rating
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600'
              }`}
            />
          ))}
        </div>
        
        {/* Score numérico */}
        <span className="text-sm font-medium text-slate-400 tabular-nums">
          {rating}/5
        </span>
        
        {/* Barra visual de progreso */}
        <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
          />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Renderiza una respuesta de texto/feedback cualitativo
 */
function TextResponseCard({ 
  response, 
  index 
}: { 
  response: CategorizedResponse
  index: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl"
    >
      {/* Pregunta */}
      <p className="text-xs text-purple-400 mb-2">
        {response.questionText}
      </p>
      
      {/* Respuesta de texto */}
      <p className="text-sm text-slate-300 italic leading-relaxed">
        "{response.textResponse}"
      </p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default memo(function CompetencyDetailPanel({
  competency,
  responses,
  categoryName
}: CompetencyDetailPanelProps) {
  // Si no hay datos, no renderizar nada
  if (!competency && responses.length === 0) {
    return null
  }

  // Obtener clasificación para colores
  const classification = competency 
    ? getPerformanceClassification(competency.overallAvgScore)
    : null

  // Separar respuestas por tipo
  const ratingResponses = responses.filter(r => 
    r.rating !== null && 
    (r.responseType === 'rating_scale' || r.responseType === 'nps_scale')
  )
  
  const textResponses = responses.filter(r => 
    r.textResponse && 
    r.textResponse.trim().length > 0
  )

  return (
    <motion.div
      key={categoryName} // Key para re-animar cuando cambia
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-slate-800/40 backdrop-blur border border-slate-700/50 rounded-2xl p-6"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER DEL PANEL
          Nombre de competencia + score + badge clasificación
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white">
            {categoryName}
          </h3>
          
          {competency && (
            <p className="text-sm text-slate-400 mt-1">
              {responses.length} pregunta{responses.length !== 1 ? 's' : ''} · Score promedio:{' '}
              <span 
                className="font-medium"
                style={{ color: classification?.color }}
              >
                {competency.overallAvgScore.toFixed(1)}/5
              </span>
            </p>
          )}
          
          {!competency && (
            <p className="text-sm text-slate-400 mt-1">
              {responses.length} pregunta{responses.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Badge de clasificación */}
        {classification && (
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${classification.color}20`,
              color: classification.color
            }}
          >
            {classification.label}
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RESPUESTAS DE RATING
          Preguntas con estrellas y barras de progreso
      ═══════════════════════════════════════════════════════════════════ */}
      {ratingResponses.length > 0 && (
        <div className="space-y-3">
          {ratingResponses.map((r, idx) => (
            <RatingResponseCard
              key={r.questionId}
              response={r}
              index={idx}
            />
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FEEDBACK CUALITATIVO
          Respuestas de texto con estilo purple diferenciado
      ═══════════════════════════════════════════════════════════════════ */}
      {textResponses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          {/* Header de sección */}
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-medium text-slate-300">
              Feedback Cualitativo
            </h4>
          </div>
          
          {/* Cards de texto */}
          <div className="space-y-3">
            {textResponses.map((r, idx) => (
              <TextResponseCard
                key={r.questionId}
                response={r}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          EMPTY STATE
          Si no hay respuestas
      ═══════════════════════════════════════════════════════════════════ */}
      {ratingResponses.length === 0 && textResponses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            No hay respuestas registradas para esta categoría
          </p>
        </div>
      )}
    </motion.div>
  )
})
```

## Validación

```bash
# Verificar que compila
npx tsc --noEmit

# El componente debe:
# 1. Mostrar header con nombre y score
# 2. Mostrar respuestas rating con estrellas y barras
# 3. Mostrar feedback de texto con estilo purple
# 4. Animar al cambiar de competencia
# 5. Mostrar empty state si no hay datos
```

## Criterios de Éxito
- [ ] El componente renderiza sin errores
- [ ] Las estrellas se llenan según el rating
- [ ] Las barras de progreso se animan
- [ ] El feedback de texto tiene estilo purple diferenciado
- [ ] El badge de clasificación muestra el color correcto
- [ ] El componente re-anima cuando cambia categoryName
- [ ] El empty state se muestra si no hay respuestas

## NO Modificar
- getPerformanceClassification existente
- Los tipos de evaluator-cinema
