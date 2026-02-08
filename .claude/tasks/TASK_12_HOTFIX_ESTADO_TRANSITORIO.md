# 🛑 HOTFIX TASK_12 - IMPLEMENTAR ESTADO TRANSITORIO

## 🚨 PROBLEMA DETECTADO

**Claude Code implementó TASK_12 SIN estado transitorio**, actualizando `PerformanceRating.finalScore` inmediatamente al crear `CalibrationAdjustment`.

**Consecuencia:**
- Usuario crea adjustment → PerformanceRating.finalScore se modifica YA
- Usuario cancela sesión → El daño ya está hecho, no hay reversión automática
- Rompe filosofía "Estado Transitorio" de la Guía Maestra v3.5.2

---

## ✅ ARQUITECTURA CORRECTA (según Guía Maestra v3.5.2)

```
┌──────────────────────────────────────────────────────────────┐
│  FLUJO CORRECTO CON ESTADO TRANSITORIO                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PerformanceRating                                           │
│  ├─ calculatedScore: 3.8 ← INMUTABLE (original del 360°)    │
│  ├─ calculatedLevel: "meets_expectations"                   │
│  ├─ finalScore: null ← Sigue NULL durante sesión            │
│  └─ finalLevel: null                                         │
│                                                              │
│  Durante calibración:                                        │
│  CalibrationAdjustment (BORRADOR)                            │
│  ├─ previousFinalScore: null                                 │
│  ├─ newFinalScore: 4.2 ← PROPUESTO (no aplicado)            │
│  ├─ justification: "Lideró proyecto crítico exitoso"        │
│  └─ status: PENDING ← No afecta PerformanceRating aún       │
│                                                              │
│  Al cerrar sesión (COMMIT ATÓMICO):                          │
│  PerformanceRating                                           │
│  ├─ calculatedScore: 3.8 ← Preservado histórico             │
│  ├─ finalScore: 4.2 ← AHORA SÍ se aplica                    │
│  ├─ calibrated: true                                         │
│  └─ calibrationSessionId: "cal_xyz"                          │
│                                                              │
│  CalibrationAdjustment                                       │
│  └─ status: APPLIED ← Marcado como aplicado (read-only)     │
│                                                              │
│  Si cancela sesión (ROLLBACK):                               │
│  - CalibrationAdjustment se borra/marca CANCELLED            │
│  - PerformanceRating.finalScore sigue NULL (nunca tocado)   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 CAMBIOS NECESARIOS

### CAMBIO 1: POST /api/calibration/sessions/[sessionId]/adjustments

**❌ ANTES (INCORRECTO):**
```typescript
// Línea 1210-1232 de TASK_12_v2_CORREGIDA.md
const [adjustment, updatedRating] = await prisma.$transaction([
  prisma.calibrationAdjustment.create({ ... }),
  prisma.performanceRating.update({  // ← ⚠️ NO DEBE ESTAR AQUÍ
    where: { id: ratingId },
    data: {
      finalScore: newFinalScore,  // ← Actualiza inmediatamente
      calibrated: true
    }
  })
])
```

**✅ DESPUÉS (CORRECTO):**
```typescript
// Solo crear adjustment, NO tocar PerformanceRating
const adjustment = await prisma.calibrationAdjustment.create({
  data: {
    sessionId,
    ratingId,
    previousFinalScore: rating.finalScore,
    previousFinalLevel: rating.finalLevel,
    previousPotentialScore: rating.potentialScore,
    previousPotentialLevel: rating.potentialLevel,
    previousNineBox: rating.nineBoxPosition,
    newFinalScore: newFinalScore ?? null,
    newFinalLevel,
    newPotentialScore: newPotentialScore ?? null,
    newPotentialLevel,
    newNineBox,
    justification: justification.trim(),
    adjustedBy: userContext.email,
    status: 'PENDING'  // ← Estado transitorio
  }
})

// NO actualizar PerformanceRating aquí
// Eso solo pasa en /close endpoint

return NextResponse.json({
  success: true,
  data: {
    adjustment,
    // NO devolver updatedRating porque no se actualiza aún
    preview: {  // Devolver preview de cómo quedaría
      currentScore: rating.finalScore ?? rating.calculatedScore,
      proposedScore: newFinalScore,
      currentLevel: rating.finalLevel ?? rating.calculatedLevel,
      proposedLevel: newFinalLevel
    }
  },
  message: 'Ajuste propuesto creado (pendiente de aplicar al cerrar sesión)'
}, { status: 201 })
```

---

### CAMBIO 2: POST /api/calibration/sessions/[sessionId]/close

**Agregar lógica de COMMIT ATÓMICO:**

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = params.sessionId
  
  try {
    const userContext = extractUserContext(request)
    
    // CHECK 2: Permiso para cerrar sesión
    if (!hasPermission(userContext.role, 'calibration:manage')) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para cerrar sesiones' },
        { status: 403 }
      )
    }
    
    // 1. Obtener sesión y ajustes pendientes
    const session = await prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: {
        adjustments: {
          where: { status: 'PENDING' }  // ← Solo los no aplicados
        }
      }
    })
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }
    
    // CHECK 3: Validar ownership
    if (session.accountId !== userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a esta sesión' },
        { status: 403 }
      )
    }
    
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'Sesión ya cerrada' },
        { status: 400 }
      )
    }
    
    // 2. Validar distribución forzada (si está habilitada)
    if (session.enableForcedDistribution && session.distributionTargets) {
      const validation = await validateDistribution(sessionId)
      
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'Distribución fuera de rango permitido',
          details: validation.errors
        }, { status: 400 })
      }
    }
    
    // 3. COMMIT ATÓMICO: Aplicar todos los ajustes
    const result = await prisma.$transaction(async (tx) => {
      const applied = []
      
      for (const adjustment of session.adjustments) {
        // Aplicar cambios al PerformanceRating
        await tx.performanceRating.update({
          where: { id: adjustment.ratingId },
          data: {
            finalScore: adjustment.newFinalScore,
            finalLevel: adjustment.newFinalLevel,
            potentialScore: adjustment.newPotentialScore,
            potentialLevel: adjustment.newPotentialLevel,
            nineBoxPosition: adjustment.newNineBox,
            calibrated: true,
            calibratedAt: new Date(),
            calibratedBy: adjustment.adjustedBy,
            calibrationSessionId: sessionId,
            adjustmentReason: adjustment.justification,
            adjustmentType: adjustment.newFinalScore 
              ? calculateAdjustmentType(
                  adjustment.previousFinalScore ?? 0,
                  adjustment.newFinalScore
                )
              : null
          }
        })
        
        // Marcar ajuste como aplicado
        await tx.calibrationAdjustment.update({
          where: { id: adjustment.id },
          data: {
            status: 'APPLIED',
            appliedAt: new Date()
          }
        })
        
        applied.push(adjustment)
      }
      
      // Cerrar sesión
      await tx.calibrationSession.update({
        where: { id: sessionId },
        data: {
          status: 'CLOSED',
          closedAt: new Date()
        }
      })
      
      return { applied }
    })
    
    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CLOSED',
        accountId: session.accountId,
        entityType: 'calibration_session',
        entityId: sessionId,
        userInfo: {
          performedBy: userContext.email,
          performedByRole: userContext.role
        },
        metadata: {
          adjustmentsApplied: result.applied.length,
          facilitatorEmail: session.facilitatorEmail
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Sesión cerrada. ${result.applied.length} ajustes aplicados exitosamente.`,
      data: {
        sessionId,
        adjustmentsApplied: result.applied.length,
        closedAt: new Date()
      }
    })
    
  } catch (error) {
    console.error('[API] Error POST close session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Helper function para validar distribución
async function validateDistribution(sessionId: string) {
  // Implementar validación según distribución forzada
  // Retornar { valid: boolean, errors?: string[] }
  return { valid: true }
}
```

---

### CAMBIO 3: DELETE /api/calibration/sessions/[sessionId] (Cancelar)

**Agregar lógica de ROLLBACK:**

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = params.sessionId
  
  try {
    const userContext = extractUserContext(request)
    
    // Obtener sesión
    const session = await prisma.calibrationSession.findUnique({
      where: { id: sessionId },
      include: {
        adjustments: true
      }
    })
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }
    
    // Validaciones de seguridad...
    
    // Solo permitir eliminar sesiones DRAFT o CANCELLED
    if (session.status === 'CLOSED') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una sesión cerrada' },
        { status: 400 }
      )
    }
    
    // ROLLBACK AUTOMÁTICO: Eliminar todos los ajustes pendientes
    await prisma.$transaction([
      // Borrar ajustes (o marcarlos como CANCELLED)
      prisma.calibrationAdjustment.deleteMany({
        where: {
          sessionId,
          status: 'PENDING'  // Solo los no aplicados
        }
      }),
      // Borrar sesión
      prisma.calibrationSession.delete({
        where: { id: sessionId }
      })
    ])
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CALIBRATION_SESSION_CANCELLED',
        accountId: session.accountId,
        entityType: 'calibration_session',
        entityId: sessionId,
        userInfo: {
          performedBy: userContext.email
        },
        metadata: {
          adjustmentsDiscarded: session.adjustments.length,
          reason: 'Session cancelled by user'
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Sesión cancelada. ${session.adjustments.length} ajustes descartados sin aplicar.`
    })
    
  } catch (error) {
    console.error('[API] Error DELETE session:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

---

## 📋 CHECKLIST DE CORRECCIÓN

```yaml
API POST .../adjustments:
  ☐ Eliminar prisma.performanceRating.update de la transacción
  ☐ Solo crear CalibrationAdjustment con status: 'PENDING'
  ☐ NO modificar PerformanceRating en absoluto
  ☐ Retornar preview de cómo quedaría (no actual)

API POST .../close:
  ☐ Implementar commit atómico en $transaction
  ☐ Iterar adjustments con status: 'PENDING'
  ☐ Aplicar newFinalScore → PerformanceRating.finalScore
  ☐ Marcar adjustments como status: 'APPLIED'
  ☐ Cerrar sesión (status: 'CLOSED')
  ☐ Audit log del cierre

API DELETE ...:
  ☐ Validar que NO esté CLOSED
  ☐ Eliminar adjustments PENDING (rollback automático)
  ☐ PerformanceRating queda intacto (nunca se tocó)
  ☐ Audit log de cancelación

Schema CalibrationAdjustment:
  ☐ Agregar campo status (PENDING | APPLIED | CANCELLED)
  ☐ Agregar campo appliedAt DateTime?
  ☐ Índice en status para queries eficientes
```

---

## 🎯 RESULTADO ESPERADO

```yaml
CASO 1: Usuario calibra y cierra
  1. Crea adjustment → Solo CalibrationAdjustment.status = PENDING
  2. PerformanceRating.finalScore sigue NULL
  3. Usuario cierra sesión → AHORA SÍ se aplica finalScore
  4. adjustment.status = APPLIED
  ✅ Datos persistidos correctamente

CASO 2: Usuario calibra y cancela
  1. Crea adjustment → Solo CalibrationAdjustment.status = PENDING
  2. PerformanceRating.finalScore sigue NULL
  3. Usuario cancela sesión → Se borran adjustments
  4. PerformanceRating queda intacto (nunca se tocó)
  ✅ Rollback automático sin daño

CASO 3: Usuario calibra, cierra navegador, vuelve
  1. Crea adjustments → status = PENDING
  2. Cierra navegador sin cerrar sesión
  3. Vuelve después → Sesión sigue DRAFT
  4. Adjustments PENDING siguen ahí
  5. Puede continuar editando o cerrar sesión
  ✅ Estado transitorio se preserva
```

---

## 🚀 IMPLEMENTACIÓN

**Orden recomendado:**

1. **Migración Prisma** (agregar campo `status` a `CalibrationAdjustment`)
2. **Modificar POST adjustments** (quitar update de PerformanceRating)
3. **Implementar POST close** (commit atómico)
4. **Implementar DELETE** (rollback)
5. **Testing completo** de los 3 casos

**Tiempo estimado:** 2-3 horas

---

## ✅ GEMINI TENÍA RAZÓN

Su análisis fue **100% correcto**:
- Detectó que se sobrescribe PerformanceRating inmediatamente
- Identificó que rompe reversibilidad
- Propuso la solución correcta: Estado Transitorio
- Siguió la arquitectura de la Guía Maestra v3.5.2

**Este hotfix implementa exactamente lo que Gemini pidió.** ✅
