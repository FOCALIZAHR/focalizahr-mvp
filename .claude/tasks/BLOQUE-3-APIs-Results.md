# BLOQUE-3: APIs Results

## 📋 METADATA
- **Bloque:** 3 de 8
- **Dependencias:** ✅ BLOQUE-1, ✅ BLOQUE-2 completados
- **Archivos:** CREAR 2 archivos API routes
- **Esfuerzo:** 5 horas
- **Prioridad:** 🟡 ALTA (Expone funcionalidad del service)

## 🎯 OBJETIVO DEL BLOQUE
Crear endpoints REST API para exponer la funcionalidad de `PerformanceResultsService`:
1. **GET /api/admin/performance-cycles/[id]/results** - Lista evaluados con stats
2. **GET /api/admin/performance-cycles/[id]/results/[evaluateeId]** - Detalle consolidado evaluado

**Características:**
- Paginación en listado
- Sorting por nombre o score
- RBAC: Solo roles con `performance:view_results`
- Error handling robusto
- Responses consistentes

---

## 📦 TAREAS INCLUIDAS

### T-PE-002-01: API List Results

**Descripción:** Endpoint para listar todos los evaluados del ciclo con stats básicas

**Archivo:** `src/app/api/admin/performance-cycles/[id]/results/route.ts`

**Código:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-cycles/[id]/results
// GET - Lista resultados consolidados del ciclo
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const cycleId = params.id
    
    // Validar autenticación
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Validar permisos
    if (!hasPermission(userContext.role, 'performance:view_results')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para ver resultados' },
        { status: 403 }
      )
    }
    
    // Obtener query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'name' // name | score
    const sortOrder = searchParams.get('sortOrder') || 'asc' // asc | desc
    
    // Listar evaluados
    const evaluatees = await PerformanceResultsService.listEvaluateesInCycle(cycleId)
    
    // Ordenar
    const sorted = evaluatees.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.evaluateeName.localeCompare(b.evaluateeName)
          : b.evaluateeName.localeCompare(a.evaluateeName)
      } else {
        return sortOrder === 'asc'
          ? a.overallAvgScore - b.overallAvgScore
          : b.overallAvgScore - a.overallAvgScore
      }
    })
    
    // Paginar
    const skip = (page - 1) * limit
    const paginated = sorted.slice(skip, skip + limit)
    
    // Stats agregadas
    const avgScore = evaluatees.length > 0
      ? evaluatees.reduce((sum, e) => sum + e.overallAvgScore, 0) / evaluatees.length
      : 0
    
    const avgCompleteness = evaluatees.length > 0
      ? evaluatees.reduce((sum, e) => sum + e.evaluationCompleteness, 0) / evaluatees.length
      : 0
    
    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: evaluatees.length,
        pages: Math.ceil(evaluatees.length / limit)
      },
      stats: {
        avgScore: parseFloat(avgScore.toFixed(2)),
        avgCompleteness: parseFloat(avgCompleteness.toFixed(1)),
        totalEvaluatees: evaluatees.length
      }
    })
    
  } catch (error) {
    console.error('Error en GET /api/admin/performance-cycles/[id]/results:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}
```

---

### T-PE-002-02: API Detail Result

**Descripción:** Endpoint para obtener detalle completo consolidado de un evaluado

**Archivo:** `src/app/api/admin/performance-cycles/[id]/results/[evaluateeId]/route.ts`

**Código:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-cycles/[id]/results/[evaluateeId]
// GET - Detalle completo resultados de un evaluado
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceResultsService } from '@/lib/services/PerformanceResultsService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, evaluateeId: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const { id: cycleId, evaluateeId } = params
    
    // Validar autenticación
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Validar permisos
    if (!hasPermission(userContext.role, 'performance:view_results')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para ver resultados' },
        { status: 403 }
      )
    }
    
    // Obtener resultados consolidados
    const results = await PerformanceResultsService.getEvaluateeResults(
      cycleId,
      evaluateeId
    )
    
    return NextResponse.json({
      success: true,
      data: results
    })
    
  } catch (error) {
    console.error('Error en GET /api/admin/performance-cycles/[id]/results/[evaluateeId]:', error)
    
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    )
  }
}
```

---

## ✅ VALIDACIÓN DEL BLOQUE

### Checklist Compilación:

```bash
# 1. Verificar que archivos se crearon en rutas correctas
ls -la src/app/api/admin/performance-cycles/[id]/results/
ls -la src/app/api/admin/performance-cycles/[id]/results/[evaluateeId]/

# 2. Compilar sin errores
npm run build

# 3. Verificar tipos
npx tsc --noEmit
```

### Testing con Thunder Client / Postman:

**1. Test List API:**
```http
GET http://localhost:3000/api/admin/performance-cycles/test-cycle-id/results?page=1&limit=10&sortBy=score&sortOrder=desc
Authorization: Bearer YOUR_JWT_TOKEN

Expected Response:
{
  "success": true,
  "data": [
    {
      "evaluateeId": "...",
      "evaluateeName": "Juan Pérez",
      "overallAvgScore": 4.2,
      "evaluationCompleteness": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  },
  "stats": {
    "avgScore": 3.8,
    "avgCompleteness": 85.5,
    "totalEvaluatees": 50
  }
}
```

**2. Test Detail API:**
```http
GET http://localhost:3000/api/admin/performance-cycles/test-cycle-id/results/test-evaluatee-id
Authorization: Bearer YOUR_JWT_TOKEN

Expected Response:
{
  "success": true,
  "data": {
    "evaluateeId": "...",
    "evaluateeName": "Juan Pérez",
    "selfScore": 4.0,
    "managerScore": 4.5,
    "peerAvgScore": 4.2,
    "upwardAvgScore": 4.3,
    "overallAvgScore": 4.25,
    "competencyScores": [...],
    "gapAnalysis": {...},
    "qualitativeFeedback": [...]
  }
}
```

### Checklist Funcional:

- [ ] Ambos archivos route.ts creados en rutas correctas
- [ ] Imports de `PerformanceResultsService` funcionan
- [ ] Imports de `AuthorizationService` funcionan
- [ ] Validación RBAC implementada
- [ ] Paginación funciona (page, limit)
- [ ] Sorting funciona (sortBy, sortOrder)
- [ ] Error handling completo (401, 403, 404, 500)
- [ ] Responses JSON consistentes
- [ ] `npm run build` pasa sin errores

---

## 🚫 NO MODIFICAR

**Archivos que NO debes tocar en este bloque:**
- `PerformanceResultsService.ts` (ya está completo del BLOQUE-2)
- `AuthorizationService.ts` (solo importar)
- Otros endpoints API existentes
- Componentes UI

**Imports permitidos:**
- ✅ `next/server`
- ✅ `@/lib/services/PerformanceResultsService`
- ✅ `@/lib/services/AuthorizationService`
- ❌ NO importar nada más

---

## 📝 NOTAS IMPORTANTES

### Estructura de Rutas:

```
/api/admin/performance-cycles/[id]/results/
  ├── route.ts (GET list)
  └── [evaluateeId]/
      └── route.ts (GET detail)
```

Esta estructura permite:
- `/results` → Listado paginado
- `/results/evaluatee-123` → Detalle específico

### Paginación Default:

- **page:** 1 (primera página)
- **limit:** 20 (razonable para UX)
- **sortBy:** 'name' (alfabético por defecto)
- **sortOrder:** 'asc' (A-Z)

### RBAC Permission:

```typescript
'performance:view_results'
```

Roles con este permiso:
- FOCALIZAHR_ADMIN
- ACCOUNT_OWNER
- CEO
- HR_MANAGER

Verificar en `AuthorizationService.ts` si necesitas agregar este permiso.

### Error Handling:

**401 Unauthorized:** No hay JWT o expiró
**403 Forbidden:** JWT válido pero sin permisos
**404 Not Found:** Ciclo o evaluado no existe
**500 Internal Error:** Error inesperado (logs en server)

---

## 🎯 SIGUIENTE BLOQUE

Una vez completado este bloque, proceder a:
**BLOQUE-4: IndividualReportService** (genera reportes individuales)

**NO continuar a BLOQUE-4 hasta que:**
- ✅ Ambas APIs compilan sin errores
- ✅ Testing básico con Thunder Client funciona
- ✅ RBAC valida correctamente

---

**Tiempo estimado:** 5 horas  
**Dificultad:** Media (APIs estándar REST)  
**Impacto:** Alto (expone funcionalidad core)
