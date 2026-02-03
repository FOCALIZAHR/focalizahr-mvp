# TASK 02: Crear Tipos TypeScript para Cinema Summary

## Objetivo
Agregar tipos TypeScript para el summary enriquecido con datos de competencias.

## Archivo a Modificar
```
src/types/evaluator-cinema.ts
```

## Contexto
- El archivo ya existe con tipos para el Cinema Mode del portal evaluador
- Necesitamos AGREGAR tipos nuevos al final del archivo
- NO modificar tipos existentes

## Código a Agregar

Agregar al **FINAL** del archivo `src/types/evaluator-cinema.ts`:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// CINEMA SUMMARY TYPES
// Tipos para la vista de resumen en modo Cinema
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score de una competencia individual con breakdown por tipo evaluador
 */
export interface CompetencyScoreSummary {
  competencyCode: string
  competencyName: string
  overallAvgScore: number
  selfScore: number | null
  managerScore: number | null
  peerAvgScore: number | null
  upwardAvgScore: number | null
  selfVsOthersGap: number | null
}

/**
 * Análisis de brechas - fortalezas y áreas de desarrollo
 */
export interface GapAnalysisSummary {
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
}

/**
 * Respuesta categorizada de una pregunta
 */
export interface CategorizedResponse {
  questionId: string
  questionText: string
  questionOrder: number
  responseType: 'rating_scale' | 'nps_scale' | 'text_open' | 'single_choice' | 'multiple_choice'
  rating: number | null
  textResponse: string | null
  choiceResponse: string[] | null
  normalizedScore: number | null
}

/**
 * Datos completos del Cinema Summary
 */
export interface CinemaSummaryData {
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
  
  // Datos básicos (del API existente)
  averageScore: number | null
  totalQuestions: number
  categorizedResponses: Record<string, CategorizedResponse[]>
  
  // Datos enriquecidos (nuevos del PerformanceResultsService)
  competencyScores: CompetencyScoreSummary[] | null
  gapAnalysis: GapAnalysisSummary | null
  overallScore: number | null
}

/**
 * Props para el header del Cinema Summary
 */
export interface CinemaSummaryHeaderProps {
  evaluatee: {
    fullName: string
    position: string | null
    department: string
  }
  completedAt: string
  score: number | null
  gapAnalysis: GapAnalysisSummary | null
}

/**
 * Props para el card del carrusel de competencias
 */
export interface CompetencyCarouselCardProps {
  code: string
  name: string
  score: number
  isSelected: boolean
  onClick: () => void
}

/**
 * Props para el panel de detalle de competencia
 */
export interface CompetencyDetailPanelProps {
  competency: CompetencyScoreSummary | null
  responses: CategorizedResponse[]
  categoryName: string
}
```

## Validación

```bash
# Verificar que TypeScript compila sin errores
npx tsc --noEmit

# Verificar que los imports funcionan
# En cualquier archivo .tsx:
import type { CinemaSummaryData, CompetencyScoreSummary } from '@/types/evaluator-cinema'
```

## Criterios de Éxito
- [ ] El archivo compila sin errores TypeScript
- [ ] Los tipos existentes NO fueron modificados
- [ ] Los nuevos tipos están al final del archivo
- [ ] Los imports funcionan desde otros archivos

## NO Modificar
- Ningún tipo existente en el archivo
- La estructura del archivo
