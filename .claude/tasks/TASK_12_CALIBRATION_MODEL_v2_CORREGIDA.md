# TASK 12: MODELO CALIBRATIONSESSION + APIs (v2 CORREGIDA)

> **Versión:** 2.0 (Corregida)  
> **Fecha:** Febrero 2026  
> **Cambios:** Correcciones de seguridad + Arquitectura enterprise validada  
> **Validado contra:** GUIA_MAESTRA_v3.5.1 + ADDENDUM_SEGURIDAD_v3.5.1

## 🎯 OBJETIVO
Crear modelo de datos y APIs para sesiones de calibración grupal con arquitectura enterprise-grade y compliance total con protocolos de seguridad.

---

## 📋 CONTEXTO DE NEGOCIO

### ¿Qué es Calibración?

```yaml
DEFINICIÓN:
  Proceso colaborativo donde líderes de la organización se reúnen para:
  1. Revisar ratings de performance asignados
  2. Discutir y ajustar para eliminar sesgos
  3. Asegurar consistencia entre departamentos
  4. Validar potencial asignado
  5. Tomar decisiones de talento informadas

TIPO DE SISTEMA:
  🏢 ENTERPRISE COLABORATIVO
  - Sesiones con 5-15 participantes simultáneos
  - Cross-departamental (incluye personas de otras áreas)
  - Incluye no-gerentes (expertos, consultores, HRBPs)
  - Roles contextuales POR SESIÓN (no permanentes)

FLUJO TÍPICO:
  1. HR crea sesión de calibración para un ciclo
  2. Invita participantes (gerentes, directores, expertos, stakeholders)
  3. Cada participante tiene un ROL específico en ESA sesión
  4. MÚLTIPLES personas pueden hacer ajustes (FACILITATOR + REVIEWER)
  5. Reunión sincrónica o asincrónica
  6. HR cierra sesión → ajustes se aplican como finalScore

CONFIDENCIALIDAD:
  - Todo dentro de la cuenta del cliente
  - FocalizaHR NO ve datos (salvo consentimiento explícito)
  - Audit trail de TODOS los cambios
  - Justificación OBLIGATORIA para cada ajuste
```

### Ejemplo Real: Calibración Cross-Departamental

```yaml
Sesión: "Calibración Liderazgo Senior Q4 2025"
Objetivo: Calibrar a todos los gerentes de la empresa

Participantes (12 personas de 6 departamentos):
  
  FACILITATOR (conduce la sesión):
    - María García (CHRO) → Puede hacer ajustes + cerrar sesión
  
  REVIEWER (pueden hacer ajustes):
    - Juan Pérez (CTO) → Opina sobre tech leaders
    - Ana López (CFO) → Opina sobre finance leaders
    - Carlos Ríos (CMO) → Opina sobre marketing leaders
    - Laura Gómez (VP People - NO gerente de área) → Experta talent
    - Diego Ruiz (Consultor McKinsey) → Experto externo
  
  OBSERVER (solo observan):
    - CEO → Governance
    - 5 HRBPs → Aprenden el proceso

Flujo:
  1. María invita a los 12 participantes
  2. Juan (CTO) ve rating de "Pedro Silva (Gerente Backend)" = 3.2
  3. Juan hace ajuste a 3.8 con justificación "Lideró migración cloud exitosa"
  4. Ana (CFO) ve el ajuste de Juan y comenta
  5. Laura (VP People) valida desde perspectiva de talent
  6. CEO observa pero no interviene
  7. María cierra sesión → finalScore de Pedro = 3.8
```

---

## 🏗️ ARQUITECTURA CLAVE: ROLES TEMPORALES POR SESIÓN

### ⚠️ CRÍTICO: Roles NO son permanentes

```yaml
MISMO USUARIO, DIFERENTES ROLES EN DIFERENTES SESIONES:

María García (CHRO):
  Sesión "Calibración Comercial Q4":
    → Rol: FACILITATOR (conduce la sesión)
  
  Sesión "Calibración Tecnología Q4":
    → Rol: OBSERVER (invitada como stakeholder)
  
  Sesión "Calibración Finanzas Q4":
    → Rol: FACILITATOR (conduce)

Juan Pérez (CTO):
  Sesión "Calibración Tecnología Q4":
    → Rol: FACILITATOR (conduce porque es su área)
  
  Sesión "Calibración Producto Digital":
    → Rol: REVIEWER (participa porque Producto depende de Tech)
  
  Sesión "Calibración Comercial Q4":
    → NO INVITADO (fuera de su scope)

Ana López (Analista Senior Data Science - NO GERENTE):
  Sesión "Calibración Tecnología Q4":
    → Rol: REVIEWER (experta técnica invitada)
  
  Sesión "Calibración Finanzas Q4":
    → Rol: OBSERVER (invitada para explicar modelos BI)

IMPLICACIÓN ARQUITECTÓNICA:
  - CalibrationParticipant table es OBLIGATORIA
  - JSON participantIds es INSUFICIENTE
  - Roles se validan POR SESIÓN, no globalmente
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

```
prisma/schema.prisma           (agregar modelos)

src/app/api/calibration/
├── sessions/
│   ├── route.ts               (GET list, POST create)
│   └── [sessionId]/
│       ├── route.ts           (GET detail, PUT update, DELETE)
│       ├── participants/
│       │   └── route.ts       (GET, POST add, DELETE remove)
│       ├── adjustments/
│       │   └── route.ts       (GET list, POST create)
│       └── close/
│           └── route.ts       (POST close session)
```

---

## 📋 INSTRUCCIONES

### PASO 1: Agregar modelos Prisma

**Modificar:** `prisma/schema.prisma`

```prisma
// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION SESSION - Sesión de calibración grupal
// ════════════════════════════════════════════════════════════════════════════

model CalibrationSession {
  id                String    @id @default(cuid())
  
  // Relaciones multi-tenant
  accountId         String    @map("account_id")
  account           Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  cycleId           String    @map("cycle_id")
  cycle             PerformanceCycle @relation(fields: [cycleId], references: [id], onDelete: Cascade)
  
  // Info básica
  name              String              // "Calibración Q4 2025 - Comercial"
  description       String?   @db.Text // Notas/objetivo de la sesión
  
  // Estado
  status            CalibrationStatus   @default(DRAFT)
  
  // Fechas
  scheduledAt       DateTime? @map("scheduled_at") // Fecha programada reunión
  startedAt         DateTime? @map("started_at")   // Cuándo inició realmente
  closedAt          DateTime? @map("closed_at")    // Cuándo se cerró
  
  // Configuración - Distribución Forzada (Curva de Bell)
  enableForcedDistribution  Boolean @default(false) @map("enable_forced_distribution")
  distributionTargets       Json?   @map("distribution_targets")
  // Ejemplo: {"exceptional": 10, "exceeds": 20, "meets": 40, "developing": 20, "needs_improvement": 10}
  // Los porcentajes deben sumar 100
  
  // Scope (opcional - si es null o [], incluye todo el ciclo)
  departmentIds     String[]  @default([]) @map("department_ids")
  // Si vacío = cross-departamental (toda la empresa)
  // Si tiene valores = solo esos departamentos + sus hijos
  
  // Facilitador principal
  facilitatorId     String?   @map("facilitator_id") // Email de quien conduce
  
  // Audit
  createdBy         String    @map("created_by")  // Email de quien creó
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Relaciones
  participants      CalibrationParticipant[]
  adjustments       CalibrationAdjustment[]
  
  @@index([accountId])
  @@index([cycleId])
  @@index([status])
  @@index([accountId, cycleId])
  @@map("calibration_sessions")
}

enum CalibrationStatus {
  DRAFT        // Creada pero no iniciada
  IN_PROGRESS  // Sesión activa
  CLOSED       // Cerrada, ratings finales aplicados
  CANCELLED    // Cancelada
}

// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION PARTICIPANT - Participantes de la sesión
// ════════════════════════════════════════════════════════════════════════════
// IMPORTANTE: Roles son TEMPORALES y específicos a ESTA sesión
// Una misma persona puede tener roles diferentes en sesiones diferentes
// ════════════════════════════════════════════════════════════════════════════

model CalibrationParticipant {
  id              String    @id @default(cuid())
  
  sessionId       String    @map("session_id")
  session         CalibrationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Participante
  participantEmail String            // Email del participante
  participantName  String            // Nombre para display
  role             CalibrationRole   @default(REVIEWER)
  
  // Estado
  invitedAt       DateTime  @default(now()) @map("invited_at")
  acceptedAt      DateTime? @map("accepted_at")
  
  // Constraint: Una persona puede estar en múltiples sesiones
  // pero solo una vez por sesión
  @@unique([sessionId, participantEmail])
  @@index([sessionId])
  @@index([participantEmail]) // Para encontrar sesiones de un usuario
  @@map("calibration_participants")
}

enum CalibrationRole {
  FACILITATOR   // HR que conduce la sesión (puede ajustar + cerrar)
  REVIEWER      // Gerente/experto que revisa y opina (PUEDE ajustar)
  OBSERVER      // Solo observa, NO puede ajustar
}

// ════════════════════════════════════════════════════════════════════════════
// CALIBRATION ADJUSTMENT - Ajustes realizados durante calibración
// ════════════════════════════════════════════════════════════════════════════

model CalibrationAdjustment {
  id              String    @id @default(cuid())
  
  sessionId       String    @map("session_id")
  session         CalibrationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  ratingId        String    @map("rating_id") // PerformanceRating que se ajustó
  
  // Snapshot de valores ANTERIORES (antes del ajuste)
  previousFinalScore      Float?  @map("previous_final_score")
  previousFinalLevel      String? @map("previous_final_level")
  previousPotentialScore  Float?  @map("previous_potential_score")
  previousPotentialLevel  String? @map("previous_potential_level")
  previousNineBox         String? @map("previous_nine_box")
  
  // Valores NUEVOS (después del ajuste)
  newFinalScore         Float?  @map("new_final_score")
  newFinalLevel         String? @map("new_final_level")
  newPotentialScore     Float?  @map("new_potential_score")
  newPotentialLevel     String? @map("new_potential_level")
  newNineBox            String? @map("new_nine_box")
  
  // Justificación (OBLIGATORIA - mínimo 10 caracteres)
  justification   String    @db.Text
  
  // Audit
  adjustedBy      String    @map("adjusted_by")  // Email de quien ajustó
  adjustedAt      DateTime  @default(now()) @map("adjusted_at")
  
  @@index([sessionId])
  @@index([ratingId])
  @@index([adjustedBy]) // Para audit trail por usuario
  @@map("calibration_adjustments")
}
```

---

### PASO 2: Crear API de Sesiones (GET + POST)

**Crear:** `src/app/api/calibration/sessions/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions
// GET - Listar sesiones | POST - Crear sesión
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService'

// ════════════════════════════════════════════════════════════════════════════
// GET - Listar sesiones de calibración
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ═══ CHECK 1: extractUserContext ═══
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // ═══ CHECK 2: hasPermission (NO arrays hardcodeados) ═══
    if (!hasPermission(userContext.role, 'calibration:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para ver calibraciones' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const status = searchParams.get('status')

    // ═══ CHECK 3: accountId en WHERE ═══
    const where: any = { accountId: userContext.accountId }
    if (cycleId) where.cycleId = cycleId
    if (status) where.status = status

    // ═══ CHECK 4: Filtrado jerárquico AREA_MANAGER ═══
    const globalRoles = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_MANAGER', 'CEO']
    
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]
      
      // AREA_MANAGER solo ve sesiones que:
      // a) No tienen filtro departamental (cross-departamental global), O
      // b) Incluyen al menos uno de sus departamentos
      where.OR = [
        { departmentIds: { isEmpty: true } },
        { departmentIds: { hasSome: allowedDepts } }
      ]
    }

    const sessions = await prisma.calibrationSession.findMany({
      where,
      include: {
        cycle: {
          select: { id: true, name: true, status: true }
        },
        participants: {
          select: { 
            id: true, 
            participantEmail: true, 
            participantName: true, 
            role: true,
            acceptedAt: true
          }
        },
        _count: {
          select: { adjustments: true, participants: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: sessions
    })

  } catch (error) {
    console.error('[API] Error GET /api/calibration/sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST - Crear sesión de calibración
// ════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // ═══ CHECK 1: extractUserContext ═══
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId || !userContext.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // ═══ CHECK 2: hasPermission (NO arrays hardcodeados) ═══
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear calibraciones' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      cycleId, 
      departmentIds,
      enableForcedDistribution,
      distributionTargets,
      scheduledAt
    } = body

    // Validaciones
    if (!name || !cycleId) {
      return NextResponse.json(
        { success: false, error: 'name y cycleId son requeridos' },
        { status: 400 }
      )
    }

    // ═══ CHECK 3: Verificar que el ciclo pertenece al accountId ═══
    const cycle = await prisma.performanceCycle.findFirst({
      where: { id: cycleId, accountId: userContext.accountId }
    })

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado o no pertenece a tu cuenta' },
        { status: 404 }
      )
    }

    // Validar distribución forzada si está habilitada
    if (enableForcedDistribution && distributionTargets) {
      const total = Object.values(distributionTargets as Record<string, number>)
        .reduce((sum, val) => sum + val, 0)
      
      if (Math.abs(total - 100) > 0.1) {
        return NextResponse.json(
          { success: false, error: 'Los porcentajes de distribución deben sumar 100' },
          { status: 400 }
        )
      }
    }

    // Crear sesión
    const session = await prisma.calibrationSession.create({
      data: {
        accountId: userContext.accountId,
        cycleId,
        name,
        description,
        departmentIds: departmentIds || [],
        enableForcedDistribution: enableForcedDistribution || false,
        distributionTargets: distributionTargets || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        facilitatorId: userContext.email,
        createdBy: userContext.email,
        status: 'DRAFT'
      },
      include: {
        cycle: {
          select: { id: true, name: true }
        }
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CREATED',
        accountId: userContext.accountId,
        entityType: 'calibration_session',
        entityId: session.id,
        userId: userContext.email,
        metadata: {
          sessionName: name,
          cycleId,
          departmentIds: departmentIds || []
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Sesión creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error POST /api/calibration/sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

---

### PASO 3: Crear API de Detalle de Sesión

**Crear:** `src/app/api/calibration/sessions/[sessionId]/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]
// GET - Detalle sesión | PUT - Actualizar | DELETE - Eliminar
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(userContext.role, 'calibration:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { 
        id: sessionId, 
        accountId: userContext.accountId  // ← Defense-in-depth
      },
      include: {
        cycle: true,
        participants: {
          orderBy: { invitedAt: 'asc' }
        },
        adjustments: {
          include: {
            rating: {
              include: {
                employee: {
                  select: { 
                    id: true, 
                    fullName: true, 
                    position: true,
                    departmentId: true
                  }
                }
              }
            }
          },
          orderBy: { adjustedAt: 'desc' }
        },
        _count: {
          select: { adjustments: true, participants: true }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: session
    })

  } catch (error) {
    console.error('[API] Error GET session detail:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // No permitir editar sesiones cerradas
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se pueden editar sesiones cerradas' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, scheduledAt, status } = body

    const updated = await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: {
        name: name || session.name,
        description: description !== undefined ? description : session.description,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : session.scheduledAt,
        status: status || session.status
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('[API] Error PUT session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Solo permitir eliminar sesiones en DRAFT o CANCELLED
    if (!['DRAFT', 'CANCELLED'].includes(session.status)) {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden eliminar sesiones en borrador o canceladas' },
        { status: 400 }
      )
    }

    await prisma.calibrationSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Sesión eliminada'
    })

  } catch (error) {
    console.error('[API] Error DELETE session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

---

### PASO 4: Crear API de Participantes

**Crear:** `src/app/api/calibration/sessions/[sessionId]/participants/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/participants
// GET - Listar | POST - Agregar | DELETE - Eliminar participante
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const participants = await prisma.calibrationParticipant.findMany({
      where: { sessionId },
      orderBy: { invitedAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: participants
    })

  } catch (error) {
    console.error('[API] Error GET participants:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se pueden agregar participantes a sesiones cerradas' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { participantEmail, participantName, role } = body

    if (!participantEmail || !participantName || !role) {
      return NextResponse.json(
        { success: false, error: 'participantEmail, participantName y role son requeridos' },
        { status: 400 }
      )
    }

    if (!['FACILITATOR', 'REVIEWER', 'OBSERVER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'role debe ser FACILITATOR, REVIEWER o OBSERVER' },
        { status: 400 }
      )
    }

    // Crear participante
    const participant = await prisma.calibrationParticipant.create({
      data: {
        sessionId,
        participantEmail,
        participantName,
        role
      }
    })

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Participante agregado exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    // Manejar unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Este participante ya está en la sesión' },
        { status: 409 }
      )
    }

    console.error('[API] Error POST participant:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'participantId es requerido' },
        { status: 400 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se pueden eliminar participantes de sesiones cerradas' },
        { status: 400 }
      )
    }

    await prisma.calibrationParticipant.delete({
      where: { id: participantId }
    })

    return NextResponse.json({
      success: true,
      message: 'Participante eliminado'
    })

  } catch (error) {
    console.error('[API] Error DELETE participant:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

---

### PASO 5: Crear API de Ajustes

**Crear:** `src/app/api/calibration/sessions/[sessionId]/adjustments/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/adjustments
// GET - Listar ajustes | POST - Crear ajuste
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  extractUserContext, 
  hasPermission,
  getChildDepartmentIds 
} from '@/lib/services/AuthorizationService'
import { 
  getPerformanceClassification,
  scoreToNineBoxLevel,
  calculate9BoxPosition
} from '@/config/performanceClassification'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const session = await prisma.calibrationSession.findFirst({
      where: { id: sessionId, accountId: userContext.accountId }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    const adjustments = await prisma.calibrationAdjustment.findMany({
      where: { sessionId },
      include: {
        rating: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                position: true,
                departmentId: true
              }
            }
          }
        }
      },
      orderBy: { adjustedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: adjustments
    })

  } catch (error) {
    console.error('[API] Error GET adjustments:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    // ═══ CHECK 1: extractUserContext ═══
    if (!userContext.accountId || !userContext.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // ═══ CHECK 3: Validar que la sesión pertenece al accountId ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { 
        id: sessionId, 
        accountId: userContext.accountId  // ← Defense-in-depth
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Validar que la sesión está activa
    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: 'Solo se puede calibrar en sesiones activas' },
        { status: 400 }
      )
    }

    // ═══ VALIDACIÓN DE ROL CONTEXTUAL A LA SESIÓN ═══
    // Verificar que el usuario es participante Y tiene rol permitido
    const participant = await prisma.calibrationParticipant.findUnique({
      where: {
        sessionId_participantEmail: {
          sessionId,
          participantEmail: userContext.email
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'No eres participante de esta sesión' },
        { status: 403 }
      )
    }

    // Solo FACILITATOR y REVIEWER pueden hacer ajustes
    if (!['FACILITATOR', 'REVIEWER'].includes(participant.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tu rol (${participant.role}) no permite hacer ajustes. Solo FACILITATOR y REVIEWER pueden ajustar.` 
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ratingId, newFinalScore, newPotentialScore, justification } = body

    // Validaciones
    if (!ratingId || !justification) {
      return NextResponse.json(
        { success: false, error: 'ratingId y justification son requeridos' },
        { status: 400 }
      )
    }

    if (justification.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'La justificación debe tener al menos 10 caracteres' },
        { status: 400 }
      )
    }

    // ═══ CHECK 3 + 6: Obtener rating CON validación multi-tenant + jerárquica ═══
    const rating = await prisma.performanceRating.findFirst({
      where: { 
        id: ratingId,
        accountId: userContext.accountId  // ← CHECK 3: accountId obligatorio
      },
      include: {
        employee: {
          select: { 
            id: true,
            fullName: true,
            departmentId: true 
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

    // ═══ CHECK 4: Si AREA_MANAGER, validar scope departamental ═══
    if (userContext.role === 'AREA_MANAGER' && userContext.departmentId) {
      const childIds = await getChildDepartmentIds(userContext.departmentId)
      const allowedDepts = [userContext.departmentId, ...childIds]
      
      if (!allowedDepts.includes(rating.employee.departmentId)) {
        return NextResponse.json(
          { success: false, error: 'Este empleado está fuera de tu ámbito jerárquico' },
          { status: 403 }
        )
      }
    }

    // Preparar snapshot de valores anteriores
    const previousValues = {
      previousFinalScore: rating.finalScore,
      previousFinalLevel: rating.finalLevel,
      previousPotentialScore: rating.potentialScore,
      previousPotentialLevel: rating.potentialLevel,
      previousNineBox: rating.nineBoxPosition
    }

    // Calcular nuevos valores con performanceClassification.ts
    const updateData: any = {
      isCalibrated: true,
      calibratedBy: userContext.email,
      calibratedAt: new Date(),
      calibrationSessionId: sessionId
    }

    let newFinalLevel = null
    let newPotentialLevel = null
    let newNineBox = null

    // Ajustar final score
    if (newFinalScore !== undefined && newFinalScore !== null) {
      const classification = getPerformanceClassification(newFinalScore)
      updateData.finalScore = newFinalScore
      updateData.finalLevel = classification.level
      newFinalLevel = classification.level
    }

    // Ajustar potential score
    if (newPotentialScore !== undefined && newPotentialScore !== null) {
      newPotentialLevel = scoreToNineBoxLevel(newPotentialScore)
      updateData.potentialScore = newPotentialScore
      updateData.potentialLevel = newPotentialLevel
    }

    // Recalcular 9-Box si tenemos ambos scores
    const effectiveFinalScore = newFinalScore ?? rating.finalScore ?? rating.calculatedScore
    const effectivePotential = newPotentialScore ?? rating.potentialScore
    
    if (effectivePotential) {
      const performanceLevel = scoreToNineBoxLevel(effectiveFinalScore)
      const potentialLevel = scoreToNineBoxLevel(effectivePotential)
      newNineBox = calculate9BoxPosition(performanceLevel, potentialLevel)
      updateData.nineBoxPosition = newNineBox
    }

    // ═══ Transacción: crear ajuste + actualizar rating ═══
    const [adjustment, updatedRating] = await prisma.$transaction([
      // Crear registro de ajuste (audit trail)
      prisma.calibrationAdjustment.create({
        data: {
          sessionId,
          ratingId,
          ...previousValues,
          newFinalScore: newFinalScore ?? null,
          newFinalLevel,
          newPotentialScore: newPotentialScore ?? null,
          newPotentialLevel,
          newNineBox,
          justification: justification.trim(),
          adjustedBy: userContext.email
        }
      }),
      // Actualizar rating
      prisma.performanceRating.update({
        where: { id: ratingId },
        data: updateData
      })
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_ADJUSTMENT_CREATED',
        accountId: userContext.accountId,
        entityType: 'calibration_adjustment',
        entityId: adjustment.id,
        userId: userContext.email,
        oldValues: previousValues,
        newValues: {
          newFinalScore,
          newFinalLevel,
          newPotentialScore,
          newPotentialLevel,
          newNineBox
        },
        metadata: {
          sessionId,
          ratingId,
          employeeName: rating.employee.fullName,
          justification: justification.trim(),
          delta: newFinalScore ? newFinalScore - (rating.finalScore || rating.calculatedScore) : null
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        adjustment,
        updatedRating: {
          id: updatedRating.id,
          finalScore: updatedRating.finalScore,
          finalLevel: updatedRating.finalLevel,
          potentialScore: updatedRating.potentialScore,
          potentialLevel: updatedRating.potentialLevel,
          nineBoxPosition: updatedRating.nineBoxPosition,
          isCalibrated: updatedRating.isCalibrated
        }
      },
      message: 'Ajuste aplicado exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('[API] Error POST adjustment:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

---

### PASO 6: Crear API de Cierre de Sesión

**Crear:** `src/app/api/calibration/sessions/[sessionId]/close/route.ts`

```typescript
// ════════════════════════════════════════════════════════════════════════════
// API: /api/calibration/sessions/[sessionId]/close
// POST - Cerrar sesión de calibración (bloquea ratings)
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const userContext = extractUserContext(request)
    
    // ═══ CHECK 1: extractUserContext ═══
    if (!userContext.accountId || !userContext.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    // ═══ CHECK 2: hasPermission (NO arrays hardcodeados) ═══
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para cerrar sesiones' },
        { status: 403 }
      )
    }

    // ═══ CHECK 3: accountId en WHERE ═══
    const session = await prisma.calibrationSession.findFirst({
      where: { 
        id: sessionId, 
        accountId: userContext.accountId  // ← Defense-in-depth
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden cerrar sesiones activas' },
        { status: 400 }
      )
    }

    // Validar distribución forzada si está habilitada
    if (session.enableForcedDistribution && session.distributionTargets) {
      const validation = await validateForcedDistribution(session)
      
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'La distribución actual no cumple con los objetivos configurados',
          details: validation.errors
        }, { status: 400 })
      }
    }

    // Cerrar sesión
    const closed = await prisma.calibrationSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      },
      include: {
        _count: { 
          select: { adjustments: true, participants: true } 
        }
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CLOSED',
        accountId: userContext.accountId,
        entityType: 'calibration_session',
        entityId: sessionId,
        userId: userContext.email,
        metadata: {
          sessionName: session.name,
          adjustmentsCount: closed._count.adjustments,
          participantsCount: closed._count.participants
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: closed,
      message: `Sesión cerrada. ${closed._count.adjustments} ajustes aplicados.`
    })

  } catch (error) {
    console.error('[API] Error POST close:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Helper: Validar distribución forzada
async function validateForcedDistribution(session: any) {
  const targets = session.distributionTargets as Record<string, number>
  const tolerance = 5 // +/- 5% de margen

  // Obtener todos los ratings del ciclo
  const ratings = await prisma.performanceRating.findMany({
    where: { cycleId: session.cycleId },
    select: { finalLevel: true, calculatedLevel: true }
  })

  // Calcular distribución actual
  const distribution: Record<string, number> = {}
  const total = ratings.length

  for (const rating of ratings) {
    const level = rating.finalLevel || rating.calculatedLevel
    distribution[level] = (distribution[level] || 0) + 1
  }

  // Convertir a porcentajes
  for (const key in distribution) {
    distribution[key] = Math.round((distribution[key] / total) * 100)
  }

  // Validar cada nivel
  const errors: string[] = []
  for (const [level, target] of Object.entries(targets)) {
    const current = distribution[level] || 0
    const delta = Math.abs(current - target)

    if (delta > tolerance) {
      errors.push(
        `Nivel "${level}": ${current}% (esperado ${target}% ±${tolerance}%)`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    distribution
  }
}
```

---

### PASO 7: Ejecutar migración

```bash
npx prisma migrate dev --name add_calibration_session_v2
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Modelo de Datos
- [ ] CalibrationSession creado en schema.prisma
- [ ] CalibrationParticipant creado (tabla separada, NO JSON)
- [ ] CalibrationAdjustment creado
- [ ] Enum CalibrationStatus creado (DRAFT, IN_PROGRESS, CLOSED, CANCELLED)
- [ ] Enum CalibrationRole creado (FACILITATOR, REVIEWER, OBSERVER)
- [ ] Migración ejecutada sin errores

### APIs Creadas
- [ ] GET /api/calibration/sessions (listar con filtrado jerárquico)
- [ ] POST /api/calibration/sessions (crear)
- [ ] GET /api/calibration/sessions/[id] (detalle)
- [ ] PUT /api/calibration/sessions/[id] (actualizar)
- [ ] DELETE /api/calibration/sessions/[id] (eliminar)
- [ ] GET /api/calibration/sessions/[id]/participants (listar)
- [ ] POST /api/calibration/sessions/[id]/participants (agregar)
- [ ] DELETE /api/calibration/sessions/[id]/participants (eliminar)
- [ ] GET /api/calibration/sessions/[id]/adjustments (listar)
- [ ] POST /api/calibration/sessions/[id]/adjustments (crear con validación)
- [ ] POST /api/calibration/sessions/[id]/close (cerrar)

### Seguridad (6 Checks Obligatorios)
- [ ] CHECK 1: extractUserContext en TODOS los endpoints
- [ ] CHECK 2: hasPermission (NO arrays hardcodeados)
- [ ] CHECK 3: accountId en WHERE de TODAS las queries
- [ ] CHECK 4: Filtrado jerárquico AREA_MANAGER implementado
- [ ] CHECK 5: Stats calculadas en backend (N/A en esta task)
- [ ] CHECK 6: Validación de ownership + scope en adjustments

### Validaciones de Negocio
- [ ] Roles son contextuales a cada sesión (tabla CalibrationParticipant)
- [ ] Solo FACILITATOR y REVIEWER pueden hacer ajustes
- [ ] OBSERVER solo puede ver
- [ ] Justificación OBLIGATORIA (mínimo 10 caracteres)
- [ ] No permitir editar sesiones CLOSED
- [ ] Validar distribución forzada en cierre (si está habilitada)
- [ ] Snapshot de valores anteriores en CalibrationAdjustment

### Audit Trail
- [ ] CALIBRATION_SESSION_CREATED
- [ ] CALIBRATION_SESSION_CLOSED
- [ ] CALIBRATION_ADJUSTMENT_CREATED
- [ ] Metadata completa en cada evento

---

## 📊 MODELO DE DATOS VISUAL

```
┌─────────────────────────────────────────────────────────────────────┐
│ CalibrationSession                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id, accountId, cycleId                                              │
│ name: "Calibración Q4 2025 - Liderazgo Senior"                      │
│ status: DRAFT → IN_PROGRESS → CLOSED                                │
│ departmentIds: [] (cross-departamental) o ["dept1", "dept2"]        │
│ enableForcedDistribution: true/false                                │
│ distributionTargets: {"exceptional": 10, "exceeds": 20, ...}        │
│ facilitatorId: "maria@empresa.com"                                  │
│ scheduledAt, startedAt, closedAt                                    │
│ createdBy: "maria@empresa.com"                                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                                         ▼
┌──────────────────────────┐        ┌────────────────────────────┐
│ CalibrationParticipant   │        │ CalibrationAdjustment      │
├──────────────────────────┤        ├────────────────────────────┤
│ sessionId                │        │ sessionId                  │
│ participantEmail         │        │ ratingId                   │
│ participantName          │        │ previous* (snapshot)       │
│ role: FACILITATOR        │        │ new* (cambios)             │
│       REVIEWER ⭐        │        │ justification ⚠️ OBLIG    │
│       OBSERVER           │        │ adjustedBy, adjustedAt     │
│ invitedAt, acceptedAt    │        │                            │
└──────────────────────────┘        └────────────────────────────┘

ROLES TEMPORALES:
  Una misma persona puede ser FACILITATOR en Sesión A
  y OBSERVER en Sesión B (roles POR SESIÓN, no globales)
```

---

## 🔐 EJEMPLOS DE VALIDACIÓN DE SEGURIDAD

### Ejemplo 1: Validación de Rol Contextual

```typescript
// Usuario: maria@empresa.com
// Sesión A: Calibración Comercial → Rol: FACILITATOR (puede ajustar)
// Sesión B: Calibración Tech → Rol: OBSERVER (solo ve)

// Intento de ajuste en Sesión A
POST /api/calibration/sessions/sessionA/adjustments
Body: { ratingId: "rating_123", newFinalScore: 4.2, justification: "..." }

1. extractUserContext → maria@empresa.com (✅)
2. Buscar participant en sessionA → FACILITATOR (✅)
3. FACILITATOR puede ajustar → PERMITIDO (✅)
4. Crear ajuste (✅)

// Intento de ajuste en Sesión B
POST /api/calibration/sessions/sessionB/adjustments
Body: { ratingId: "rating_456", newFinalScore: 3.8, justification: "..." }

1. extractUserContext → maria@empresa.com (✅)
2. Buscar participant en sessionB → OBSERVER (✅)
3. OBSERVER NO puede ajustar → DENEGADO (❌)
4. Return 403: "Tu rol (OBSERVER) no permite hacer ajustes"
```

### Ejemplo 2: Filtrado Jerárquico AREA_MANAGER

```typescript
// Usuario: juan@empresa.com
// Rol global: AREA_MANAGER (departamento: Tecnología)
// Departamentos en scope: [Tecnología, Backend, Frontend, DevOps]

// Sesiones visibles
GET /api/calibration/sessions

1. extractUserContext → AREA_MANAGER, dept: Tecnología (✅)
2. getChildDepartmentIds → [Backend, Frontend, DevOps]
3. Filtro WHERE:
   - departmentIds = [] (cross-departamental) OR
   - departmentIds intersecta [Tecnología, Backend, Frontend, DevOps]

Resultado:
  ✅ Sesión "Calibración Tech Q4" (departmentIds: [])
  ✅ Sesión "Calibración Backend" (departmentIds: [Backend])
  ❌ Sesión "Calibración Comercial" (departmentIds: [Ventas, Retail])
  ❌ Sesión "Calibración Finanzas" (departmentIds: [Finanzas])
```

### Ejemplo 3: Validación de Ownership en Ajuste

```typescript
// Usuario: juan@empresa.com (AREA_MANAGER - Tecnología)
// Intenta ajustar rating de empleado de Finanzas

POST /api/calibration/sessions/sessionX/adjustments
Body: { ratingId: "rating_finanzas_employee", newFinalScore: 4.0, ... }

1. extractUserContext → AREA_MANAGER, dept: Tecnología (✅)
2. Participant en sessionX → REVIEWER (✅)
3. Obtener rating con accountId → Found (✅)
4. rating.employee.departmentId → "Finanzas"
5. getChildDepartmentIds(Tecnología) → [Backend, Frontend, DevOps]
6. "Finanzas" NOT IN [Tecnología, Backend, Frontend, DevOps] (❌)
7. Return 403: "Este empleado está fuera de tu ámbito jerárquico"
```

---

## 📚 REFERENCIAS CRUZADAS

```yaml
DOCUMENTACIÓN RELACIONADA:
  - GUIA_MAESTRA_TECNICA_FOCALIZAHR_ENTERPRISE_v3_5_1.md
    Sección 6: Sistema de Calibración (especificación)
    Sección 7.1-7.7: Protocolos de seguridad (ADDENDUM)
  
  - ADDENDUM_SEGURIDAD_v3_5_1.md
    Sección 7.1: 6 Checks Obligatorios
    Sección 7.2: Anti-patrones reales
    Sección 7.3-7.4: Templates correctos
  
  - ESPECIFICACION_PERFORMANCE_CLASSIFICATION_SYSTEM_v1_0.md
    Funciones: getPerformanceClassification, scoreToNineBoxLevel, calculate9BoxPosition

CÓDIGO FUENTE CRÍTICO:
  - src/lib/services/AuthorizationService.ts
    extractUserContext(), hasPermission(), getChildDepartmentIds()
  
  - src/config/performanceClassification.ts
    Clasificación de performance + 9-Box
  
  - prisma/schema.prisma
    PerformanceRating, CalibrationSession, CalibrationParticipant
```

---

## ➡️ SIGUIENTE TAREA

`TASK_13_CALIBRATION_WIZARD.md` - Wizard de configuración de sesión (UI)

---

**FIN DE TASK 12 v2 CORREGIDA**

*Esta versión incorpora todas las correcciones de seguridad del ADDENDUM v3.5.1 y valida arquitectura enterprise con roles temporales por sesión.*
