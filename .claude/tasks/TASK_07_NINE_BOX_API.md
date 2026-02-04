# TASK 07: API POTENTIAL RATING - 9-BOX

## 🎯 OBJETIVO
Crear endpoint para asignar rating de potencial a un empleado (eje Y del 9-Box).

## 📁 ARCHIVO A CREAR
```
src/app/api/admin/performance-ratings/[id]/potential/route.ts
```

## ⚠️ DEPENDENCIAS
- TASK_01-05 completadas
- Modelo `PerformanceRating` con campos `potentialScore`, `potentialLevel`, `nineBoxPosition`
- Service `PerformanceRatingService.ratePotential()` existe

## 📋 INSTRUCCIONES

### PASO 1: Crear endpoint

**Crear:** `src/app/api/admin/performance-ratings/[id]/potential/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/[id]/potential
// POST - Asignar rating de potencial (para 9-Box)
// DELETE - Eliminar rating de potencial
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const ratingId = params.id

    // Validar autenticación
    if (!userContext.accountId || !userContext.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo ciertos roles pueden asignar potencial
    // Típicamente: HR Manager, CEO, Manager directo
    const canRatePotential = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'CEO',
      'HR_MANAGER',
      'AREA_MANAGER'
    ].includes(userContext.role)

    if (!canRatePotential) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para asignar potencial' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { potentialScore, notes } = body

    // Validaciones
    if (typeof potentialScore !== 'number' || potentialScore < 1 || potentialScore > 5) {
      return NextResponse.json(
        { success: false, error: 'potentialScore debe ser un número entre 1 y 5' },
        { status: 400 }
      )
    }

    // Asignar potencial usando el service
    const updated = await PerformanceRatingService.ratePotential({
      ratingId,
      potentialScore,
      notes: notes || undefined,
      ratedBy: userContext.email
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        potentialScore: updated.potentialScore,
        potentialLevel: updated.potentialLevel,
        nineBoxPosition: updated.nineBoxPosition,
        potentialRatedBy: updated.potentialRatedBy,
        potentialRatedAt: updated.potentialRatedAt
      },
      message: `Potencial asignado: ${updated.potentialLevel} → Posición 9-Box: ${updated.nineBoxPosition}`
    })

  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const ratingId = params.id

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const canRatePotential = [
      'FOCALIZAHR_ADMIN',
      'ACCOUNT_OWNER',
      'CEO',
      'HR_MANAGER'
    ].includes(userContext.role)

    if (!canRatePotential) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // Limpiar campos de potencial
    const { prisma } = await import('@/lib/prisma')
    
    const cleared = await prisma.performanceRating.update({
      where: { id: ratingId },
      data: {
        potentialScore: null,
        potentialLevel: null,
        potentialRatedBy: null,
        potentialRatedAt: null,
        potentialNotes: null,
        nineBoxPosition: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: { id: cleared.id },
      message: 'Rating de potencial eliminado'
    })

  } catch (error) {
    console.error('[API] Error en DELETE /api/admin/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userContext = extractUserContext(request)
    const ratingId = params.id

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    
    const rating = await prisma.performanceRating.findUnique({
      where: { id: ratingId },
      select: {
        id: true,
        calculatedScore: true,
        calculatedLevel: true,
        finalScore: true,
        finalLevel: true,
        potentialScore: true,
        potentialLevel: true,
        potentialRatedBy: true,
        potentialRatedAt: true,
        potentialNotes: true,
        nineBoxPosition: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true
          }
        }
      }
    })

    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rating
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings/[id]/potential:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### PASO 2: Crear endpoint para 9-Box Grid data

**Crear:** `src/app/api/admin/performance-ratings/nine-box/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/nine-box
// GET - Datos para renderizar 9-Box Grid
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import { NINE_BOX_POSITIONS } from '@/config/performanceClassification'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const departmentId = searchParams.get('departmentId')

    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }

    // Obtener datos del 9-Box
    const nineBoxData = await PerformanceRatingService.get9BoxData(cycleId)

    // Filtrar por departamento si se especifica
    let filteredGrid = nineBoxData.grid
    if (departmentId) {
      const filteredEntries = Object.entries(nineBoxData.grid).map(([position, employees]) => {
        const filtered = employees.filter(e => e.employee?.departmentId === departmentId)
        return [position, filtered]
      })
      filteredGrid = Object.fromEntries(filteredEntries)
    }

    // Calcular totales después del filtro
    const totalInGrid = Object.values(filteredGrid).reduce(
      (sum, employees) => sum + employees.length,
      0
    )

    // Agregar metadata de posiciones
    const gridWithMetadata = Object.entries(filteredGrid).map(([position, employees]) => ({
      position,
      ...NINE_BOX_POSITIONS[position as keyof typeof NINE_BOX_POSITIONS],
      employees: employees.map(e => ({
        id: e.id,
        employeeId: e.employeeId,
        employeeName: e.employee?.fullName,
        employeePosition: e.employee?.position,
        department: e.employee?.department?.displayName,
        calculatedScore: e.calculatedScore,
        finalScore: e.finalScore,
        potentialScore: e.potentialScore,
        potentialLevel: e.potentialLevel
      })),
      count: employees.length,
      percent: totalInGrid > 0 ? Math.round((employees.length / totalInGrid) * 100) : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        cycleId,
        totalWithPotential: nineBoxData.total,
        totalInGrid,
        grid: gridWithMetadata,
        summary: nineBoxData.summary
      }
    })

  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings/nine-box:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

## ✅ CHECKLIST DE VALIDACIÓN

```bash
# Verificar estructura
ls -la src/app/api/admin/performance-ratings/[id]/potential/
ls -la src/app/api/admin/performance-ratings/nine-box/

# Verificar compilación
npm run build
```

### Test con Thunder Client o curl:

```bash
# POST - Asignar potencial (score 4.2 = "high")
curl -X POST http://localhost:3000/api/admin/performance-ratings/RATING_ID/potential \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{"potentialScore": 4.2, "notes": "Alto potencial de liderazgo"}'

# Respuesta esperada:
# {
#   "success": true,
#   "data": {
#     "potentialScore": 4.2,
#     "potentialLevel": "high",
#     "nineBoxPosition": "star"  // si performance también es high
#   }
# }

# GET - Datos del 9-Box Grid
curl "http://localhost:3000/api/admin/performance-ratings/nine-box?cycleId=CYCLE_ID" \
  -H "Cookie: token=YOUR_TOKEN"

# GET - Filtrado por departamento
curl "http://localhost:3000/api/admin/performance-ratings/nine-box?cycleId=CYCLE_ID&departmentId=DEPT_ID" \
  -H "Cookie: token=YOUR_TOKEN"

# DELETE - Eliminar potencial
curl -X DELETE http://localhost:3000/api/admin/performance-ratings/RATING_ID/potential \
  -H "Cookie: token=YOUR_TOKEN"
```

- [ ] POST /potential asigna potentialScore y calcula nineBoxPosition
- [ ] GET /potential retorna datos de potencial del rating
- [ ] DELETE /potential limpia campos de potencial
- [ ] GET /nine-box retorna grid completo con empleados por posición
- [ ] Filtro por departmentId funciona

## ➡️ SIGUIENTE TAREA
`TASK_08_NINE_BOX_GRID.md`
