# 🏗️ TASK: Server-Side Filtering — Eliminar parche limit=500

> **TIPO:** Refactorización arquitectónica (NIVEL 2)
> **PRIORIDAD:** Alta — limit=500 no escala, stats client-side es anti-patrón
> **PRINCIPIO:** "BACKEND CALCULA, FRONTEND MUESTRA"
> **PRE-REQUISITO:** TASK_SECURITY_FIX completada (accountId + departmentIds ya aplicados)

---

## 📋 PROBLEMA ACTUAL

```yaml
ANTI-PATRÓN EN PRODUCCIÓN:
  page.tsx línea ~71:
    fetch(`/api/admin/performance-ratings?cycleId=${cycleId}&limit=500`)
    
  page.tsx líneas ~100-140:
    # Frontend CALCULA stats sobre los 500 registros
    # Frontend FILTRA client-side (evaluated/pending/assigned/all)
    # Frontend BUSCA client-side por nombre
    
POR QUÉ ES MALO:
  1. limit=500 no escala — empresa con 2000 empleados = corte arbitrario
  2. Stats calculadas client-side sobre subset = INCORRECTAS si hay más de 500
  3. Filtro evaluados/pendientes client-side = transferencia de datos innecesaria
  4. Búsqueda por nombre client-side = toda la data viaja al browser
  5. Un AREA_MANAGER de 15 personas descarga 500 registros para mostrar 15
```

---

## 🎯 ARQUITECTURA OBJETIVO

```yaml
ANTES (anti-patrón):
  Frontend → fetch(limit=500) → recibe 500 ratings → filtra JS → calcula stats JS → muestra 20

DESPUÉS (enterprise):
  Frontend → fetch(page=1&limit=20&evaluationStatus=evaluated&search=juan)
  Backend  → WHERE (evaluationStatus + search + departmentIds) → COUNT stats sobre TODO → pagina 20
  Frontend → recibe 20 ratings + stats precalculadas → SOLO muestra
```

---

## 🔧 PARTE 1: Ampliar `listRatingsForCycle` en el servicio

**Archivo:** `src/lib/services/PerformanceRatingService.ts`

### 1A. Nuevos filtros en la firma

```typescript
// FIRMA ACTUAL (con fix seguridad ya aplicado):
static async listRatingsForCycle(
  cycleId: string,
  accountId: string,
  options?: {
    page?: number
    limit?: number
    sortBy?: 'name' | 'score' | 'level'
    sortOrder?: 'asc' | 'desc'
    filterLevel?: string
    filterNineBox?: string
    filterCalibrated?: boolean
    departmentIds?: string[]
  }
)

// FIRMA NUEVA — agregar estos filtros:
static async listRatingsForCycle(
  cycleId: string,
  accountId: string,
  options?: {
    page?: number
    limit?: number
    sortBy?: 'name' | 'score' | 'level'
    sortOrder?: 'asc' | 'desc'
    filterLevel?: string
    filterNineBox?: string
    filterCalibrated?: boolean
    departmentIds?: string[]
    // ═══ NUEVOS FILTROS SERVER-SIDE ═══
    evaluationStatus?: 'all' | 'evaluated' | 'not_evaluated'
    potentialStatus?: 'all' | 'assigned' | 'pending'
    search?: string  // búsqueda por nombre empleado
  }
)
```

### 1B. Construir WHERE con nuevos filtros

```typescript
// DESPUÉS de construir el where base con cycleId + accountId + departmentIds:

// Filtro evaluación (reemplaza lógica client-side)
if (options?.evaluationStatus === 'evaluated') {
  where.calculatedScore = { gt: 0 }
} else if (options?.evaluationStatus === 'not_evaluated') {
  where.calculatedScore = 0
}

// Filtro potencial
if (options?.potentialStatus === 'assigned') {
  where.potentialScore = { not: null }
  where.calculatedScore = { gt: 0 }  // solo evaluados con potencial
} else if (options?.potentialStatus === 'pending') {
  where.potentialScore = null
  where.calculatedScore = { gt: 0 }  // evaluados SIN potencial
}

// Búsqueda por nombre
if (options?.search?.trim()) {
  where.employee = {
    ...where.employee,  // preservar filtro departmental si existe
    fullName: { 
      contains: options.search.trim(), 
      mode: 'insensitive' 
    }
  }
}
```

### 1C. Calcular stats en backend (sobre TODO el dataset, no la página)

```typescript
// NUEVO: Stats calculadas sobre el dataset COMPLETO (sin paginación)
// Usar el where BASE (cycleId + accountId + departmentIds) SIN los filtros de evaluación/potencial
const baseWhere: any = { cycleId, accountId }
if (options?.departmentIds?.length) {
  baseWhere.employee = { departmentId: { in: options.departmentIds } }
}

// Stats con COUNT queries — eficiente, sin traer data
const [totalRatings, evaluatedCount, potentialAssignedCount] = await Promise.all([
  prisma.performanceRating.count({ where: baseWhere }),
  prisma.performanceRating.count({ 
    where: { ...baseWhere, calculatedScore: { gt: 0 } } 
  }),
  prisma.performanceRating.count({ 
    where: { ...baseWhere, potentialScore: { not: null }, calculatedScore: { gt: 0 } } 
  })
])

const notEvaluatedCount = totalRatings - evaluatedCount
const potentialPendingCount = evaluatedCount - potentialAssignedCount
```

### 1D. Nuevo formato de retorno

```typescript
// RETORNO ACTUAL:
return {
  data: ratingsWithClassification,
  pagination: { page, limit, total, pages }
}

// RETORNO NUEVO — agregar stats:
return {
  data: ratingsWithClassification,
  pagination: { 
    page, 
    limit, 
    total,    // total FILTRADO (para paginación)
    pages: Math.ceil(total / limit) 
  },
  stats: {
    totalRatings,           // TODOS los ratings del ciclo (en scope del usuario)
    evaluatedCount,         // Con score > 0
    notEvaluatedCount,      // Con score = 0
    potentialAssignedCount, // Evaluados + con potencial
    potentialPendingCount,  // Evaluados + sin potencial
    evaluationProgress: totalRatings > 0 
      ? Math.round((evaluatedCount / totalRatings) * 100) 
      : 0,
    potentialProgress: evaluatedCount > 0 
      ? Math.round((potentialAssignedCount / evaluatedCount) * 100) 
      : 0
  }
}
```

---

## 🔧 PARTE 2: Pasar nuevos filtros desde el endpoint

**Archivo:** `src/app/api/admin/performance-ratings/route.ts`

### Cambio en GET handler

```typescript
// AGREGAR lectura de nuevos query params:
const evaluationStatus = searchParams.get('evaluationStatus') as 'all' | 'evaluated' | 'not_evaluated' || undefined
const potentialStatus = searchParams.get('potentialStatus') as 'all' | 'assigned' | 'pending' || undefined
const search = searchParams.get('search') || undefined

// AGREGAR a la llamada del servicio:
const result = await PerformanceRatingService.listRatingsForCycle(
  cycleId,
  userContext.accountId,
  {
    page, limit, sortBy, sortOrder,
    filterLevel, filterNineBox, filterCalibrated,
    departmentIds,
    // ═══ NUEVOS ═══
    evaluationStatus,
    potentialStatus,
    search
  }
)
```

---

## 🔧 PARTE 3: Refactorizar frontend — eliminar lógica client-side

**Archivo:** `src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`

### 3A. Cambiar fetch para usar filtros de API

```typescript
// ELIMINAR:
const ratingsRes = await fetch(`/api/admin/performance-ratings?cycleId=${cycleId}&limit=500`)

// REEMPLAZAR CON función que construye URL con filtros:
const buildRatingsUrl = useCallback(() => {
  const params = new URLSearchParams({
    cycleId,
    page: String(currentPage),
    limit: '20',  // ← paginación real, NO parche
    sortBy,
    sortOrder,
  })
  
  if (evaluationFilter !== 'all') {
    params.set('evaluationStatus', evaluationFilter)
  }
  if (potentialFilter !== 'all') {
    params.set('potentialStatus', potentialFilter)
  }
  if (searchTerm.trim()) {
    params.set('search', searchTerm.trim())
  }
  
  return `/api/admin/performance-ratings?${params.toString()}`
}, [cycleId, currentPage, sortBy, sortOrder, evaluationFilter, potentialFilter, searchTerm])
```

### 3B. ELIMINAR toda la lógica de filtrado client-side

```typescript
// ═══ ELIMINAR COMPLETAMENTE ═══

// 1. Filtro matchesEvaluated (líneas ~124-130) → ELIMINAR
// 2. Filtro matchesSearch (línea ~132) → ELIMINAR  
// 3. Cálculo filteredRatings (línea ~135) → ELIMINAR
// 4. Cálculo stats client-side (totalEvaluated, etc.) → ELIMINAR

// ═══ REEMPLAZAR CON ═══

// Stats VIENEN del API response:
const { data: ratings, pagination, stats } = apiResponse

// Frontend solo muestra lo que el backend ya filtró y calculó
// NO hay filteredRatings — ratings YA está filtrado
// NO hay stats calculadas — stats VIENEN del backend
```

### 3C. Filtros como triggers de re-fetch (no como filtros JS)

```typescript
// Los filtros DISPARAN un nuevo fetch, NO filtran en memoria:

const [evaluationFilter, setEvaluationFilter] = useState<string>('all')
const [potentialFilter, setPotentialFilter] = useState<string>('all')
const [searchTerm, setSearchTerm] = useState('')
const [currentPage, setCurrentPage] = useState(1)

// Cuando cambia un filtro → reset página + re-fetch
useEffect(() => {
  setCurrentPage(1)  // volver a página 1
  fetchRatings()     // nuevo fetch con filtros actualizados
}, [evaluationFilter, potentialFilter, searchTerm])
```

### 3D. Stats del backend en los tab counters

```typescript
// ANTES (stats calculadas client-side):
const totalEvaluated = allRatings.filter(r => r.calculatedScore > 0).length

// DESPUÉS (stats del API):
// stats viene directamente del response de la API
<TabButton 
  label="Todos" 
  count={stats.totalRatings} 
  active={evaluationFilter === 'all'}
/>
<TabButton 
  label="Evaluados" 
  count={stats.evaluatedCount} 
  active={evaluationFilter === 'evaluated'}
/>
<TabButton 
  label="Pendientes" 
  count={stats.potentialPendingCount} 
  active={potentialFilter === 'pending'}
/>
<TabButton 
  label="Con Potencial" 
  count={stats.potentialAssignedCount} 
  active={potentialFilter === 'assigned'}
/>
```

### 3E. Paginación real

```typescript
// ANTES: no había paginación visual (limit=500 traía "todo")

// DESPUÉS: paginación real con controles
<PaginationControls
  page={pagination.page}
  pages={pagination.pages}
  total={pagination.total}
  onPageChange={(p) => setCurrentPage(p)}
/>
```

---

## 📊 PARTE 4: Debounce en búsqueda

```typescript
// Búsqueda con debounce para no hacer fetch en cada tecla:
const [searchInput, setSearchInput] = useState('')
const debouncedSearch = useDebounce(searchInput, 300)

useEffect(() => {
  setSearchTerm(debouncedSearch)
}, [debouncedSearch])

// Hook useDebounce (si no existe, crear):
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}
```

---

## ✅ PARTE 5: Verificación

### Checklist técnico (de focalizahr-ui-design-standards.md):

```yaml
SEGURIDAD:
  □ ¿Usa extractUserContext en APIs? → SÍ (ya estaba)
  □ ¿Valida permisos con hasPermission? → SÍ (ya estaba)
  □ ¿Aplica filtrado jerárquico si es AREA_MANAGER? → SÍ (task anterior)
  □ ¿Query incluye accountId en where? → SÍ (task anterior)
  □ ¿Tiene error handling con try-catch? → SÍ
  □ ¿Paginación implementada (skip/take)? → SÍ (ya no limit=500)

PERFORMANCE:
  □ Stats calculadas con COUNT queries (no findMany) → SÍ
  □ Búsqueda con debounce 300ms → SÍ
  □ Solo 20 registros viajan al frontend por página → SÍ
```

### Tests manuales:

```yaml
TEST 1 — Paginación:
  - Abrir ratings con 200 empleados
  - Debe mostrar "Página 1 de 10" (20 por página)
  - Navegar a página 5 → muestra empleados 81-100
  
TEST 2 — Filtro evaluados:
  - Click "Evaluados" → API recibe evaluationStatus=evaluated
  - Solo muestra ratings con score > 0
  - Tab counters muestran números correctos del backend
  
TEST 3 — Búsqueda:
  - Escribir "Juan" → tras 300ms debounce → API recibe search=Juan
  - Solo muestra empleados que contienen "Juan"
  - Paginación se resetea a página 1
  
TEST 4 — AREA_MANAGER:
  - Login como AREA_MANAGER
  - Stats reflejan SOLO su equipo (no toda la empresa)
  - Tabs muestran counts de SU scope
  
TEST 5 — Empresa grande (2000+):
  - NO hay limit=500 ni hardcodes
  - Stats siempre correctas independiente del tamaño
  - Paginación funciona fluidamente
```

### Verificación técnica:

```bash
# Compilación limpia
npx tsc --noEmit

# Verificar que limit=500 ya NO existe
grep -rn "limit=500" src/
# Debe retornar: 0 resultados

# Verificar que no hay filtrado client-side residual
grep -rn "matchesEvaluated\|matchesSearch\|filteredRatings" src/app/dashboard/performance/
# Debe retornar: 0 resultados
```

---

## 📎 RESUMEN DE CAMBIOS

```yaml
ARCHIVOS A MODIFICAR:

1. src/lib/services/PerformanceRatingService.ts
   - listRatingsForCycle: agregar evaluationStatus, potentialStatus, search
   - WHERE: construir filtros server-side
   - NUEVO: calcular stats con COUNT queries
   - RETORNO: agregar objeto stats

2. src/app/api/admin/performance-ratings/route.ts
   - GET: leer evaluationStatus, potentialStatus, search de queryParams
   - GET: pasar nuevos filtros al servicio

3. src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
   - ELIMINAR: limit=500
   - ELIMINAR: toda lógica filtrado client-side (matchesEvaluated, matchesSearch, filteredRatings)
   - ELIMINAR: cálculo stats client-side
   - AGREGAR: filtros como query params al API
   - AGREGAR: re-fetch cuando cambian filtros
   - AGREGAR: debounce en búsqueda
   - AGREGAR: paginación real con controles
   - AGREGAR: stats del backend en tab counters

ARCHIVOS QUE NO CAMBIAN:
  - AuthorizationService.ts (ya tiene getChildDepartmentIds)
  - RatingRow.tsx (solo recibe data, no filtra)
  - nine-box endpoint (diferente vista, su propia lógica)
```

---

## ⚠️ REGLAS INQUEBRANTABLES

1. **NO usar limit=500 ni ningún hardcode de límite alto** — paginación real
2. **Frontend NO calcula stats** — stats vienen del backend
3. **Frontend NO filtra** — filtros van como queryParams al API
4. **Stats se calculan con COUNT queries** — no con findMany + .length
5. **Stats se calculan sobre el scope COMPLETO del usuario** — no sobre la página actual
6. **Búsqueda siempre con debounce** — no fetch por cada tecla
7. **Cambios quirúrgicos** — no reescribir componentes completos
8. **Verificar con `npx tsc --noEmit`** después de cada parte
