# 🔧 TASK: Sistema Híbrido de Ratings y Potencial

## 📋 METADATA
- **Fecha:** 9 Febrero 2026
- **Prioridad:** CRÍTICA
- **Afecta:** `/ratings` page durante ciclo ACTIVE
- **No afecta:** Calibración, 9-Box, Reportes (estos usan ciclo cerrado)

---

## 🔴 PROBLEMA

La página `/ratings` no muestra a todos los evaluados porque consulta **exclusivamente** la tabla `performance_ratings`.

### Evidencia:
```sql
-- Query actual de /ratings
SELECT * FROM performance_ratings WHERE cycle_id = 'xxx'

-- Resultado en DB:
| evaluatee_name | rating_id | calculated_score | potential_score |
|----------------|-----------|------------------|-----------------|
| Andres Soto    | NULL      | NULL             | NULL            | ← INVISIBLE
| PAERTY         | existe    | 3.06             | 5               | ← Visible
| Pedro Lopez    | existe    | 0                | 3               | ← Visible
```

**Andres Soto** completó su evaluación pero NO aparece en `/ratings` porque no tiene registro en `performance_ratings`.

---

## 🎯 SOLUCIÓN: Modelo Híbrido

### Conceptos Clave:
- **Mundo 1 (Vivo):** `EvaluationAssignment` - Fuente de verdad durante ciclo ACTIVE
- **Mundo 2 (Snapshot):** `performance_ratings` - Destino de verdad al cerrar ciclo

### Arquitectura:
```
┌─────────────────────────────────────────────────────────────┐
│  IF cycle.status === 'ACTIVE':                              │
│    → Ancla: EvaluationAssignment (distinct evaluateeId)     │
│    → Enriquecimiento: LEFT JOIN con performance_ratings     │
│    → Score: Tiempo real si no hay rating persistido         │
│                                                             │
│  IF cycle.status === 'IN_REVIEW' | 'COMPLETED':             │
│    → Usar lógica actual (solo performance_ratings)          │
│    → Todos los ratings ya están consolidados                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 CAMBIOS REQUERIDOS

### Archivo: `src/lib/services/PerformanceRatingService.ts`

#### Modificar: `listRatingsForCycle()`

```typescript
static async listRatingsForCycle(
  cycleId: string,
  accountId: string,
  options?: ListRatingsOptions
): Promise<ListRatingsResult> {
  
  // 1. Obtener estado del ciclo
  const cycle = await prisma.performanceCycle.findUnique({
    where: { id: cycleId },
    select: { status: true }
  })
  
  // 2. Elegir estrategia según estado
  if (cycle?.status === 'IN_REVIEW' || cycle?.status === 'COMPLETED') {
    // Ciclo cerrado: usar lógica actual (eficiente, todo en Mundo 2)
    return this.listRatingsFromPerformanceRatings(cycleId, accountId, options)
  }
  
  // 3. Ciclo ACTIVE: usar modelo híbrido
  return this.listRatingsHybrid(cycleId, accountId, options)
}
```

#### Nuevo método: `listRatingsHybrid()`

```typescript
private static async listRatingsHybrid(
  cycleId: string,
  accountId: string,
  options?: ListRatingsOptions
): Promise<ListRatingsResult> {
  
  const {
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    departmentIds,        // RBAC para AREA_MANAGER
    evaluationStatus,     // Filtro tab
    potentialStatus,      // Filtro tab
    search                // Búsqueda por nombre
  } = options || {}
  
  // ══════════════════════════════════════════════════════════════
  // PASO 1: Construir WHERE para Mundo 1 (EvaluationAssignment)
  // ══════════════════════════════════════════════════════════════
  
  const baseWhere: Prisma.EvaluationAssignmentWhereInput = {
    cycleId,
    status: 'COMPLETED'
  }
  
  // RBAC: Filtro jerárquico para AREA_MANAGER
  if (departmentIds && departmentIds.length > 0) {
    baseWhere.evaluatee = {
      departmentId: { in: departmentIds }
    }
  }
  
  // Search: Filtrar por nombre
  if (search) {
    baseWhere.evaluateeName = {
      contains: search,
      mode: 'insensitive'
    }
  }
  
  // ══════════════════════════════════════════════════════════════
  // PASO 2: Obtener evaluados únicos (Mundo 1) con paginación
  // ══════════════════════════════════════════════════════════════
  
  // Primero obtenemos IDs únicos para contar correctamente
  const allEvaluateeIds = await prisma.evaluationAssignment.findMany({
    where: baseWhere,
    distinct: ['evaluateeId'],
    select: { 
      evaluateeId: true,
      evaluateeName: true,
      evaluateePosition: true,
      evaluatee: {
        select: {
          department: {
            select: { displayName: true }
          }
        }
      }
    },
    orderBy: sortBy === 'name' 
      ? { evaluateeName: sortOrder }
      : undefined
  })
  
  const total = allEvaluateeIds.length
  const skip = (page - 1) * limit
  
  // Paginar en memoria (necesario por distinct)
  const paginatedEvaluatees = allEvaluateeIds.slice(skip, skip + limit)
  const evaluateeIds = paginatedEvaluatees.map(e => e.evaluateeId)
  
  // ══════════════════════════════════════════════════════════════
  // PASO 3: Obtener ratings existentes (Mundo 2) solo para la página
  // ══════════════════════════════════════════════════════════════
  
  const existingRatings = await prisma.performanceRating.findMany({
    where: {
      cycleId,
      employeeId: { in: evaluateeIds }
    },
    select: {
      id: true,
      employeeId: true,
      calculatedScore: true,
      potentialScore: true,
      potentialLevel: true,
      nineBoxPosition: true
    }
  })
  
  const ratingsMap = new Map(
    existingRatings.map(r => [r.employeeId, r])
  )
  
  // ══════════════════════════════════════════════════════════════
  // PASO 4: Combinar Mundo 1 + Mundo 2
  // ══════════════════════════════════════════════════════════════
  
  const combinedData = await Promise.all(
    paginatedEvaluatees.map(async (ev) => {
      const rating = ratingsMap.get(ev.evaluateeId)
      
      // Calcular score en tiempo real si no hay rating persistido
      let calculatedScore = rating?.calculatedScore ?? 0
      if (!rating || rating.calculatedScore === 0) {
        try {
          const results = await PerformanceResultsService.getEvaluateeResults(
            cycleId,
            ev.evaluateeId
          )
          // Usar el promedio de los scores disponibles
          const scores = [
            results.selfScore,
            results.managerScore,
            results.peerAvgScore,
            results.upwardAvgScore
          ].filter((s): s is number => s !== null)
          
          if (scores.length > 0) {
            calculatedScore = scores.reduce((a, b) => a + b, 0) / scores.length
          }
        } catch (e) {
          // Si falla el cálculo, dejamos en 0
          calculatedScore = 0
        }
      }
      
      return {
        id: rating?.id || null,
        employeeId: ev.evaluateeId,
        employeeName: ev.evaluateeName,
        employeePosition: ev.evaluateePosition,
        departmentName: ev.evaluatee?.department?.displayName || null,
        calculatedScore: Math.round(calculatedScore * 100) / 100,
        potentialScore: rating?.potentialScore || null,
        potentialLevel: rating?.potentialLevel || null,
        nineBoxPosition: rating?.nineBoxPosition || null,
        status: rating ? 'CONSOLIDATED' : 'PENDING_POTENTIAL'
      }
    })
  )
  
  // ══════════════════════════════════════════════════════════════
  // PASO 5: Aplicar filtros post-combinación (si es necesario)
  // ══════════════════════════════════════════════════════════════
  
  let filteredData = combinedData
  
  if (evaluationStatus === 'evaluated') {
    filteredData = filteredData.filter(d => d.calculatedScore > 0)
  } else if (evaluationStatus === 'not_evaluated') {
    filteredData = filteredData.filter(d => d.calculatedScore === 0)
  }
  
  if (potentialStatus === 'assigned') {
    filteredData = filteredData.filter(d => d.potentialScore !== null)
  } else if (potentialStatus === 'pending') {
    filteredData = filteredData.filter(d => d.potentialScore === null)
  }
  
  // Ordenar por score si se requiere
  if (sortBy === 'score') {
    filteredData.sort((a, b) => 
      sortOrder === 'asc' 
        ? a.calculatedScore - b.calculatedScore
        : b.calculatedScore - a.calculatedScore
    )
  }
  
  // ══════════════════════════════════════════════════════════════
  // PASO 6: Calcular Stats (queries paralelos)
  // ══════════════════════════════════════════════════════════════
  
  const [totalWithRating, totalWithPotential] = await Promise.all([
    prisma.performanceRating.count({
      where: { cycleId, calculatedScore: { gt: 0 } }
    }),
    prisma.performanceRating.count({
      where: { cycleId, potentialScore: { not: null } }
    })
  ])
  
  const stats = {
    totalRatings: total,
    evaluatedCount: totalWithRating,
    notEvaluatedCount: total - totalWithRating,
    potentialAssignedCount: totalWithPotential,
    potentialPendingCount: total - totalWithPotential,
    evaluationProgress: total > 0 ? Math.round((totalWithRating / total) * 100) : 0,
    potentialProgress: total > 0 ? Math.round((totalWithPotential / total) * 100) : 0
  }
  
  // ══════════════════════════════════════════════════════════════
  // PASO 7: Retornar resultado compatible con UI
  // ══════════════════════════════════════════════════════════════
  
  return {
    data: filteredData,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    stats
  }
}
```

---

### Archivo: `src/app/api/admin/performance-ratings/route.ts`

Sin cambios necesarios - el service maneja la lógica internamente.

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Andres Soto aparece en `/ratings` con status `PENDING_POTENTIAL`
- [ ] PAERTY aparece con status `CONSOLIDATED` y sus datos de potencial
- [ ] Pedro Lopez aparece con status `CONSOLIDATED` y sus datos de potencial
- [ ] Filtro "Pendientes" muestra solo `PENDING_POTENTIAL`
- [ ] Filtro "Asignados" muestra solo con `potentialScore`
- [ ] Stats reflejan la realidad híbrida
- [ ] AREA_MANAGER solo ve su departamento
- [ ] Paginación funciona correctamente
- [ ] Search por nombre funciona
- [ ] Al cerrar ciclo (IN_REVIEW), usa lógica optimizada

---

## ⚠️ NO AFECTA

| Proceso | ¿Afectado? | Razón |
|---------|------------|-------|
| Calibración | NO | Ocurre en IN_REVIEW, ratings ya consolidados |
| 9-Box Grid | NO | Solo muestra los que tienen potencial (ya tienen rating) |
| Reportes Individuales | NO | Ocurre en COMPLETED, ratings ya consolidados |
| Cron send-reports | NO | Ocurre en COMPLETED |

---

## 📚 REFERENCIAS

- `src/lib/services/PerformanceRatingService.ts`
- `src/lib/services/PerformanceResultsService.ts`
- `GUIA_MAESTRA_TECNICA_FOCALIZAHR_ENTERPRISE_v3_5_2.md`
- `GUIA_FRONTEND_CLASIFICACION_PERFORMANCE.md`
