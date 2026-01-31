# BLOQUE-2: PerformanceResultsService

## 📋 METADATA
- **Bloque:** 2 de 8
- **Dependencias:** ✅ BLOQUE-1 completado (Schema Changes)
- **Archivos:** CREAR `src/lib/services/PerformanceResultsService.ts`
- **Esfuerzo:** 10 horas
- **Prioridad:** 🔴 CRÍTICA (APIs del BLOQUE-3 dependen de esto)

## 🎯 OBJETIVO DEL BLOQUE
Crear el service principal para consolidación de resultados 360° por evaluado.

**Funcionalidad completa:**
- Consolidar evaluaciones self + manager + peers + upward
- Calcular scores por competencia con promedios
- Realizar gap analysis (fortalezas vs áreas desarrollo)
- Identificar self-awareness gaps (sobreestimación/subestimación)
- Extraer feedback cualitativo
- Listar evaluados con estadísticas básicas

**Pattern:** Inspirado en Lattice, 15Five, Culture Amp

---

## 📦 TAREAS INCLUIDAS

### T-PE-001-01: Crear Estructura Base del Service

**Descripción:** Estructura completa del service con tipos e interfaces

**Archivo:** `src/lib/services/PerformanceResultsService.ts`

**Código:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE RESULTS SERVICE - Consolidación Resultados 360°
// src/lib/services/PerformanceResultsService.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón: Lattice, 15Five, Culture Amp
// Filosofía: Consolidar self + manager + peer + upward en una sola vista
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma'
import type { CompetencySnapshot } from '@/lib/services/CompetencyService'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface EvaluateeResults360 {
  evaluateeId: string
  evaluateeName: string
  evaluateePosition: string | null
  cycleId: string
  cycleName: string
  
  // Scores por tipo evaluador
  selfScore: number | null
  managerScore: number | null
  peerAvgScore: number | null
  upwardAvgScore: number | null
  overallAvgScore: number
  
  // Detalle por competencia
  competencyScores: CompetencyScore[]
  
  // Gap Analysis
  gapAnalysis: GapAnalysisResult
  
  // Feedback cualitativo
  qualitativeFeedback: QualitativeFeedback[]
  
  // Metadata
  totalEvaluations: number
  completedEvaluations: number
  evaluationCompleteness: number // % completado
}

export interface CompetencyScore {
  competencyCode: string
  competencyName: string
  competencyCategory: 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'
  
  selfScore: number | null
  managerScore: number | null
  peerAvgScore: number | null
  upwardAvgScore: number | null
  overallAvgScore: number
  
  // Gap self vs others
  selfVsOthersGap: number | null
}

export interface GapAnalysisResult {
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
  
  selfAwarenessGap: {
    overestimated: string[] // Competencias donde self > others significativamente
    underestimated: string[] // Competencias donde self < others significativamente
  }
}

export interface QualitativeFeedback {
  evaluatorType: 'SELF' | 'MANAGER' | 'PEER' | 'UPWARD'
  comments: string
  timestamp: Date
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

export class PerformanceResultsService {

  /**
   * Obtiene resultados consolidados 360° de un evaluado
   * @param cycleId - ID del ciclo
   * @param evaluateeId - ID del evaluado (employee)
   * @returns Resultados consolidados
   */
  static async getEvaluateeResults(
    cycleId: string,
    evaluateeId: string
  ): Promise<EvaluateeResults360> {
    // TODO: Implementar en T-PE-001-02
    throw new Error('Not implemented - Ver T-PE-001-02')
  }

  /**
   * Calcula scores por competencia consolidando todos los evaluadores
   * @param cycleId - ID del ciclo
   * @param evaluateeId - ID del evaluado
   * @param competencies - Snapshot competencias del ciclo
   * @returns Scores por competencia
   */
  static async calculateCompetencyScores(
    cycleId: string,
    evaluateeId: string,
    competencies: CompetencySnapshot[]
  ): Promise<CompetencyScore[]> {
    // TODO: Implementar cálculo por competencia
    return []
  }

  /**
   * Realiza gap analysis identificando fortalezas y áreas de desarrollo
   * @param competencyScores - Scores calculados por competencia
   * @returns Gap analysis completo
   */
  static performGapAnalysis(
    competencyScores: CompetencyScore[]
  ): GapAnalysisResult {
    // TODO: Implementar análisis de brechas
    return {
      strengths: [],
      developmentAreas: [],
      selfAwarenessGap: {
        overestimated: [],
        underestimated: []
      }
    }
  }

  /**
   * Lista todos los evaluados de un ciclo con stats básicos
   * @param cycleId - ID del ciclo
   * @returns Lista evaluados con metadata
   */
  static async listEvaluateesInCycle(cycleId: string): Promise<Array<{
    evaluateeId: string
    evaluateeName: string
    evaluateePosition: string | null
    overallAvgScore: number
    evaluationCompleteness: number
    totalEvaluations: number
    completedEvaluations: number
  }>> {
    // TODO: Implementar listado con stats
    return []
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Calcula el promedio de scores de un array de evaluaciones
   */
  private static calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  /**
   * Identifica las top 3 competencias (fortalezas)
   */
  private static identifyStrengths(
    competencyScores: CompetencyScore[],
    threshold: number = 4.0
  ): GapAnalysisResult['strengths'] {
    return competencyScores
      .filter(c => c.overallAvgScore >= threshold)
      .sort((a, b) => b.overallAvgScore - a.overallAvgScore)
      .slice(0, 3)
      .map(c => ({
        competencyCode: c.competencyCode,
        competencyName: c.competencyName,
        avgScore: c.overallAvgScore,
        highlight: `Fortaleza destacada con ${c.overallAvgScore.toFixed(1)}/5.0`
      }))
  }

  /**
   * Identifica las bottom 3 competencias (áreas desarrollo)
   */
  private static identifyDevelopmentAreas(
    competencyScores: CompetencyScore[]
  ): GapAnalysisResult['developmentAreas'] {
    return competencyScores
      .sort((a, b) => a.overallAvgScore - b.overallAvgScore)
      .slice(0, 3)
      .map(c => ({
        competencyCode: c.competencyCode,
        competencyName: c.competencyName,
        avgScore: c.overallAvgScore,
        priority: c.overallAvgScore < 2.5 ? 'ALTA' : c.overallAvgScore < 3.5 ? 'MEDIA' : 'BAJA'
      }))
  }
}

export default PerformanceResultsService
```

---

### T-PE-001-02: Implementar getEvaluateeResults()

**Descripción:** Lógica completa para consolidar evaluaciones de un evaluado

**Modificar:** `src/lib/services/PerformanceResultsService.ts`

**Reemplazar método `getEvaluateeResults()` con:**

```typescript
static async getEvaluateeResults(
  cycleId: string,
  evaluateeId: string
): Promise<EvaluateeResults360> {
  
  // 1. Obtener ciclo con snapshot competencias
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    include: {
      account: {
        select: {
          companyName: true
        }
      }
    }
  })
  
  if (!cycle) {
    throw new Error(`Ciclo ${cycleId} no encontrado`)
  }
  
  const competencies = cycle.competencySnapshot as CompetencySnapshot[]
  
  // 2. Obtener info del evaluado
  const evaluatee = await prisma.participant.findUnique({
    where: { id: evaluateeId },
    select: {
      id: true,
      fullName: true,
      position: true
    }
  })
  
  if (!evaluatee) {
    throw new Error(`Evaluado ${evaluateeId} no encontrado`)
  }
  
  // 3. Obtener TODAS las evaluaciones donde esta persona es evaluada
  const assignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId,
      evaluateeId
    },
    include: {
      evaluator: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  })
  
  // 4. Agrupar por tipo de evaluador
  const byType = {
    SELF: assignments.filter(a => a.evaluatorType === 'SELF'),
    MANAGER: assignments.filter(a => a.evaluatorType === 'MANAGER'),
    PEER: assignments.filter(a => a.evaluatorType === 'PEER'),
    UPWARD: assignments.filter(a => a.evaluatorType === 'UPWARD')
  }
  
  // 5. Calcular scores globales por tipo
  const selfScore = byType.SELF[0]?.overallScore || null
  const managerScore = byType.MANAGER[0]?.overallScore || null
  
  const peerScores = byType.PEER
    .filter(a => a.isCompleted && a.overallScore !== null)
    .map(a => a.overallScore!)
  const peerAvgScore = peerScores.length > 0 
    ? this.calculateAverage(peerScores) 
    : null
  
  const upwardScores = byType.UPWARD
    .filter(a => a.isCompleted && a.overallScore !== null)
    .map(a => a.overallScore!)
  const upwardAvgScore = upwardScores.length > 0 
    ? this.calculateAverage(upwardScores) 
    : null
  
  // 6. Calcular overall average (promedio de promedios)
  const allAvgScores = [
    selfScore,
    managerScore,
    peerAvgScore,
    upwardAvgScore
  ].filter((s): s is number => s !== null)
  
  const overallAvgScore = allAvgScores.length > 0
    ? this.calculateAverage(allAvgScores)
    : 0
  
  // 7. Calcular scores por competencia
  const competencyScores = await this.calculateCompetencyScores(
    cycleId,
    evaluateeId,
    competencies
  )
  
  // 8. Realizar gap analysis
  const gapAnalysis = this.performGapAnalysis(competencyScores)
  
  // 9. Extraer feedback cualitativo
  const qualitativeFeedback: QualitativeFeedback[] = assignments
    .filter(a => a.isCompleted && a.qualitativeFeedback)
    .map(a => ({
      evaluatorType: a.evaluatorType as 'SELF' | 'MANAGER' | 'PEER' | 'UPWARD',
      comments: a.qualitativeFeedback as string,
      timestamp: a.completedAt!
    }))
  
  // 10. Calcular completeness
  const totalEvaluations = assignments.length
  const completedEvaluations = assignments.filter(a => a.isCompleted).length
  const evaluationCompleteness = totalEvaluations > 0
    ? (completedEvaluations / totalEvaluations) * 100
    : 0
  
  // 11. Retornar resultado consolidado
  return {
    evaluateeId,
    evaluateeName: evaluatee.fullName,
    evaluateePosition: evaluatee.position,
    cycleId,
    cycleName: cycle.name,
    
    selfScore,
    managerScore,
    peerAvgScore,
    upwardAvgScore,
    overallAvgScore,
    
    competencyScores,
    gapAnalysis,
    qualitativeFeedback,
    
    totalEvaluations,
    completedEvaluations,
    evaluationCompleteness
  }
}
```

---

## ✅ VALIDACIÓN DEL BLOQUE

### Checklist Compilación:

```bash
# 1. Verificar imports funcionan
npm run build

# 2. Verificar tipos TypeScript
npx tsc --noEmit

# 3. Verificar exports
# En otro archivo de prueba:
# import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'
```

### Checklist Funcional:

- [ ] Archivo `PerformanceResultsService.ts` creado en ruta correcta
- [ ] Tipos exportados: `EvaluateeResults360`, `CompetencyScore`, etc.
- [ ] Service class exportado correctamente
- [ ] Método `getEvaluateeResults()` implementado completo
- [ ] Helpers privados implementados
- [ ] No hay errores TypeScript
- [ ] Imports de Prisma funcionan
- [ ] `npm run build` pasa sin errores

### Testing Manual (Opcional - requiere BD):

```typescript
// Test básico (ejecutar en Thunder Client o similar)
const result = await PerformanceResultsService.getEvaluateeResults(
  'test-cycle-id',
  'test-evaluatee-id'
)

console.log(result.overallAvgScore) // Debe retornar número
console.log(result.competencyScores.length) // Debe retornar array
```

---

## 🚫 NO MODIFICAR

**Archivos que NO debes tocar en este bloque:**
- `src/lib/services/CompetencyService.ts` (solo importar, no modificar)
- Esquema Prisma (eso fue BLOQUE-1)
- APIs existentes (eso es BLOQUE-3)
- Componentes UI (eso es BLOQUE-6-8)

**Imports permitidos:**
- ✅ `@/lib/prisma`
- ✅ `@/lib/services/CompetencyService` (tipos)
- ❌ NO importar nada más

---

## 📝 NOTAS IMPORTANTES

### División de Tareas:

**T-PE-001-01:** Estructura + tipos + placeholders
**T-PE-001-02:** Implementación método principal

**¿Por qué separar?**
- Permite compilar con tipos definidos primero
- Facilita testing incremental
- Reduce complejidad por paso

### Lógica de Consolidación:

**Scores por tipo evaluador:**
- SELF: Solo uno por evaluado (score directo)
- MANAGER: Solo uno por evaluado (score directo)
- PEER: Múltiples → calcular promedio
- UPWARD: Múltiples → calcular promedio

**Overall average:** Promedio de los 4 tipos (si existen)

### Gap Analysis (TODO en helpers):

Implementar lógica para:
1. **Strengths:** Top 3 competencias con score >= 4.0
2. **Development Areas:** Bottom 3 competencias ordenadas por score
3. **Self-Awareness Gap:** 
   - Overestimated: self > others por 0.5+ puntos
   - Underestimated: self < others por 0.5+ puntos

---

## 🎯 SIGUIENTE BLOQUE

Una vez completado este bloque, proceder a:
**BLOQUE-3: APIs Results** (expone este service vía endpoints)

**NO continuar a BLOQUE-3 hasta que:**
- ✅ Service compila sin errores
- ✅ Tipos exportados correctamente
- ✅ `getEvaluateeResults()` implementado completo

---

**Tiempo estimado:** 10 horas  
**Dificultad:** Alta (lógica compleja de consolidación)  
**Impacto:** Crítico (corazón del módulo 360°)
