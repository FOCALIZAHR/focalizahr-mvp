# TASK 05: APIs REST - PERFORMANCE RATINGS

## 🎯 OBJETIVO
Crear los endpoints REST para gestión de configuración y ratings.

## 📁 ARCHIVOS A CREAR
```
src/app/api/admin/
├── performance-config/
│   └── route.ts
├── performance-ratings/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── calibrate/
│           └── route.ts
```

## ⚠️ DEPENDENCIAS
- TASK_03 completada (PerformanceRatingService existe)

## 📋 INSTRUCCIONES

### PASO 1: Crear API de configuración

**Crear:** `src/app/api/admin/performance-config/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-config
// GET - Obtener configuración | PUT - Actualizar configuración
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'
import {
  FOCALIZAHR_DEFAULT_CONFIG,
  FOCALIZAHR_DEFAULT_WEIGHTS,
  validateLevelsConfig,
  validateEvaluatorWeights,
  type PerformanceRatingConfigData,
  type EvaluatorWeights
} from '@/config/performanceClassification'

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Permiso: cualquier rol que pueda ver performance
    if (!hasPermission(userContext.role, 'performance:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }
    
    const config = await PerformanceRatingService.getConfig(userContext.accountId)
    const weights = await PerformanceRatingService.getResolvedWeights(userContext.accountId)
    
    return NextResponse.json({
      success: true,
      data: {
        ...config,
        evaluatorWeights: weights
      },
      isDefaultConfig: JSON.stringify(config) === JSON.stringify(FOCALIZAHR_DEFAULT_CONFIG),
      isDefaultWeights: JSON.stringify(weights) === JSON.stringify(FOCALIZAHR_DEFAULT_WEIGHTS)
    })
    
  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-config:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Solo ACCOUNT_OWNER o superior pueden modificar config
    const allowedRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO']
    if (!allowedRoles.includes(userContext.role)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para modificar configuración' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { levels, scaleType, evaluatorWeights } = body
    
    const errors: string[] = []
    
    // Validar escalas si se envían
    if (levels) {
      const levelsValidation = validateLevelsConfig(levels)
      if (!levelsValidation.valid) {
        errors.push(...levelsValidation.errors)
      }
    }
    
    // Validar pesos si se envían
    if (evaluatorWeights) {
      const weightsValidation = validateEvaluatorWeights(evaluatorWeights)
      if (!weightsValidation.valid) {
        errors.push(...weightsValidation.errors)
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Configuración inválida', details: errors },
        { status: 400 }
      )
    }
    
    // Guardar config (upsert)
    const saved = await prisma.performanceRatingConfig.upsert({
      where: { accountId: userContext.accountId },
      create: {
        accountId: userContext.accountId,
        scaleType: scaleType || 'five_level',
        levels: levels || [],
        evaluatorWeights: evaluatorWeights || null
      },
      update: {
        ...(scaleType && { scaleType }),
        ...(levels && { levels }),
        ...(evaluatorWeights !== undefined && { evaluatorWeights }),
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Configuración guardada exitosamente'
    })
    
  } catch (error) {
    console.error('[API] Error en PUT /api/admin/performance-config:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### PASO 2: Crear API de ratings (lista y generación)

**Crear:** `src/app/api/admin/performance-ratings/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings
// GET - Listar ratings | POST - Generar ratings
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

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
    
    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }
    
    const result = await PerformanceRatingService.listRatingsForCycle(cycleId, {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as 'name' | 'score' | 'level') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      filterLevel: searchParams.get('filterLevel') || undefined,
      filterNineBox: searchParams.get('filterNineBox') || undefined,
      filterCalibrated: searchParams.get('filterCalibrated') === 'true' ? true :
                        searchParams.get('filterCalibrated') === 'false' ? false : undefined
    })
    
    return NextResponse.json({
      success: true,
      ...result
    })
    
  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(userContext.role, 'performance:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { cycleId, action, employeeId } = body
    
    if (!cycleId) {
      return NextResponse.json(
        { success: false, error: 'cycleId es requerido' },
        { status: 400 }
      )
    }
    
    // Acción: generar todos los ratings del ciclo
    if (action === 'generate_all') {
      const result = await PerformanceRatingService.generateRatingsForCycle(
        cycleId,
        userContext.accountId
      )
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Generados ${result.success} ratings, ${result.failed} fallidos`
      })
    }
    
    // Acción: generar rating individual
    if (action === 'generate_single' && employeeId) {
      const result = await PerformanceRatingService.generateRating(
        cycleId,
        employeeId,
        userContext.accountId
      )
      
      return NextResponse.json({
        success: true,
        data: result
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Acción no válida. Use "generate_all" o "generate_single"' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
```

### PASO 3: Crear API de rating individual

**Crear:** `src/app/api/admin/performance-ratings/[id]/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/[id]
// GET - Obtener rating específico
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { PerformanceRatingService } from '@/lib/services/PerformanceRatingService'

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
    
    const rating = await PerformanceRatingService.getRatingById(ratingId)
    
    if (!rating) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar que pertenece a la cuenta del usuario
    if (rating.accountId !== userContext.accountId && userContext.role !== 'FOCALIZAHR_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Sin acceso a este rating' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: rating
    })
    
  } catch (error) {
    console.error('[API] Error en GET /api/admin/performance-ratings/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### PASO 4: Crear API de calibración

**Crear:** `src/app/api/admin/performance-ratings/[id]/calibrate/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/admin/performance-ratings/[id]/calibrate
// POST - Calibrar rating | DELETE - Revertir calibración
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
    
    if (!userContext.accountId || !userContext.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // Solo ciertos roles pueden calibrar
    const canCalibrate = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO', 'HR_MANAGER'].includes(userContext.role)
    if (!canCalibrate) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para calibrar ratings' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { finalScore, adjustmentReason, sessionId } = body
    
    // Validaciones
    if (typeof finalScore !== 'number' || finalScore < 0 || finalScore > 5) {
      return NextResponse.json(
        { success: false, error: 'finalScore debe ser un número entre 0 y 5' },
        { status: 400 }
      )
    }
    
    if (!adjustmentReason || typeof adjustmentReason !== 'string' || adjustmentReason.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'adjustmentReason es requerido (mínimo 10 caracteres)' },
        { status: 400 }
      )
    }
    
    const updated = await PerformanceRatingService.calibrateRating({
      ratingId,
      finalScore,
      adjustmentReason: adjustmentReason.trim(),
      calibratedBy: userContext.email,
      sessionId
    })
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Rating calibrado exitosamente'
    })
    
  } catch (error) {
    console.error('[API] Error en POST /api/admin/performance-ratings/[id]/calibrate:', error)
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
    
    if (!userContext.accountId || !userContext.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const canCalibrate = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO', 'HR_MANAGER'].includes(userContext.role)
    if (!canCalibrate) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }
    
    const reverted = await PerformanceRatingService.revertCalibration(
      ratingId,
      userContext.email
    )
    
    return NextResponse.json({
      success: true,
      data: reverted,
      message: 'Calibración revertida exitosamente'
    })
    
  } catch (error) {
    console.error('[API] Error en DELETE /api/admin/performance-ratings/[id]/calibrate:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

## ✅ CHECKLIST DE VALIDACIÓN

```bash
# Verificar estructura de carpetas
ls -la src/app/api/admin/performance-config/
ls -la src/app/api/admin/performance-ratings/
ls -la src/app/api/admin/performance-ratings/\[id\]/
ls -la src/app/api/admin/performance-ratings/\[id\]/calibrate/

# Verificar compilación
npm run build
```

### Test con Thunder Client o curl:

```bash
# GET config (incluye escalas Y pesos)
curl http://localhost:3000/api/admin/performance-config \
  -H "Cookie: token=YOUR_TOKEN"

# Respuesta esperada:
# {
#   "success": true,
#   "data": {
#     "scaleType": "five_level",
#     "levels": [...],
#     "evaluatorWeights": { "self": 25, "manager": 25, "peer": 25, "upward": 25 }
#   },
#   "isDefaultConfig": true,
#   "isDefaultWeights": true
# }

# PUT config con pesos personalizados (Empresa típica: Manager pesa más)
curl -X PUT http://localhost:3000/api/admin/performance-config \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "evaluatorWeights": {
      "self": 15,
      "manager": 40,
      "peer": 30,
      "upward": 15
    }
  }'

# GET ratings
curl "http://localhost:3000/api/admin/performance-ratings?cycleId=CYCLE_ID" \
  -H "Cookie: token=YOUR_TOKEN"

# POST generate all (usará pesos configurados)
curl -X POST http://localhost:3000/api/admin/performance-ratings \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{"cycleId":"CYCLE_ID","action":"generate_all"}'

# POST calibrate
curl -X POST http://localhost:3000/api/admin/performance-ratings/RATING_ID/calibrate \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{"finalScore":4.2,"adjustmentReason":"Ajustado por sesión de calibración Q1"}'
```

- [ ] GET /api/admin/performance-config retorna config
- [ ] PUT /api/admin/performance-config guarda config
- [ ] GET /api/admin/performance-ratings retorna lista
- [ ] POST /api/admin/performance-ratings genera ratings
- [ ] GET /api/admin/performance-ratings/[id] retorna rating
- [ ] POST /api/admin/performance-ratings/[id]/calibrate calibra
- [ ] DELETE /api/admin/performance-ratings/[id]/calibrate revierte

## ➡️ SIGUIENTE TAREA
`TASK_06_UI_COMPONENTS.md` (opcional)
