# TASK 01: Enriquecer API Summary con Datos de Competencias

## Objetivo
Modificar el endpoint GET `/api/evaluator/assignments/[id]/summary` para incluir datos de competencias cuando la evaluación es de un PerformanceCycle.

## Archivo a Modificar
```
src/app/api/evaluator/assignments/[id]/summary/route.ts
```

## Contexto
- El API actual retorna `categorizedResponses` agrupadas por categoría de pregunta
- Necesitamos ADEMÁS retornar `competencyScores` del PerformanceResultsService que YA EXISTE
- El servicio calcula scores por competencia con gap analysis
- NO modificar la lógica existente, solo AGREGAR datos nuevos

## Cambios Específicos

### 1. Agregar import al inicio del archivo

```typescript
import PerformanceResultsService from '@/lib/services/PerformanceResultsService'
```

### 2. Modificar el include del query de assignment

Buscar el `prisma.evaluationAssignment.findFirst` y modificar el include para traer el cycleId:

```typescript
const assignment = await prisma.evaluationAssignment.findFirst({
  where: {
    id,
    accountId: userContext.accountId
  },
  include: {
    cycle: {
      select: { 
        id: true,  // AGREGAR ESTE CAMPO
        name: true, 
        endDate: true 
      }
    },
    evaluator: {
      select: { email: true }
    },
    participant: {
      select: {
        id: true,
        uniqueToken: true
      }
    }
  }
});
```

### 3. Agregar obtención de datos enriquecidos

Antes del `return NextResponse.json` final, agregar:

```typescript
// ═══════════════════════════════════════════════════════════════════════
// DATOS ENRIQUECIDOS DE COMPETENCIAS (si aplica)
// ═══════════════════════════════════════════════════════════════════════
let competencyData: {
  competencyScores: any[] | null;
  gapAnalysis: any | null;
  overallAvgScore: number | null;
} = {
  competencyScores: null,
  gapAnalysis: null,
  overallAvgScore: null
};

// Solo intentar si tenemos cycleId y evaluateeId (campos del assignment)
if (assignment.cycle?.id && assignment.evaluateeId) {
  try {
    const results360 = await PerformanceResultsService.getIndividualResults360(
      assignment.cycle.id,
      assignment.evaluateeId
    );
    
    competencyData = {
      competencyScores: results360.competencyScores || null,
      gapAnalysis: results360.gapAnalysis || null,
      overallAvgScore: results360.overallAvgScore || null
    };
    
    console.log('[Summary API] Datos de competencias cargados:', {
      competenciesCount: results360.competencyScores?.length || 0,
      hasGapAnalysis: !!results360.gapAnalysis
    });
  } catch (err) {
    // No fallar si no hay datos de competencias - es opcional
    console.warn('[Summary API] No se pudieron obtener datos de competencias:', err);
  }
}
```

### 4. Modificar el objeto de respuesta

Agregar los nuevos campos al return existente:

```typescript
return NextResponse.json({
  success: true,
  summary: {
    assignmentId: assignment.id,
    evaluationType: assignment.evaluationType,
    completedAt: assignment.updatedAt.toISOString(),

    evaluatee: {
      fullName: assignment.evaluateeName,
      position: assignment.evaluateePosition,
      department: assignment.evaluateeDepartment
    },

    cycle: {
      name: assignment.cycle.name,
      endDate: assignment.cycle.endDate.toISOString()
    },

    averageScore: avgScore,
    totalQuestions: responses.length,
    categorizedResponses,
    
    // ═══════════════════════════════════════════════════════════════════
    // NUEVOS CAMPOS - Datos de competencias (null si no aplica)
    // ═══════════════════════════════════════════════════════════════════
    competencyScores: competencyData.competencyScores,
    gapAnalysis: competencyData.gapAnalysis,
    overallScore: competencyData.overallAvgScore
  }
});
```

## Validación

```bash
# Probar con Thunder Client o curl
GET /api/evaluator/assignments/[id]/summary
Authorization: Bearer [token]

# Respuesta esperada debe incluir:
{
  "success": true,
  "summary": {
    // ... campos existentes ...
    "competencyScores": [...] | null,
    "gapAnalysis": {...} | null,
    "overallScore": 4.2 | null
  }
}
```

## Criterios de Éxito
- [ ] El API compila sin errores TypeScript
- [ ] El API retorna competencyScores cuando hay datos
- [ ] El API retorna null en competencyScores si NO hay datos (no falla)
- [ ] Los campos existentes siguen funcionando igual
- [ ] No se rompe ninguna funcionalidad existente

## NO Modificar
- La lógica de `categorizedResponses` existente
- Los permisos/validaciones de acceso
- El flujo de autenticación
- El cálculo de `avgScore` existente
