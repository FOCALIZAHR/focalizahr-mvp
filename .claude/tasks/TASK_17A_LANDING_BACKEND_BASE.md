# TASK 17A: CALIBRATION LANDING PAGE + BACKEND BASE

**Prioridad:** 🔴 CRÍTICA (Resuelve ERROR 404)  
**Tiempo estimado:** 3-4 horas  
**Objetivo:** Crear página principal `/calibration` + APIs base funcionando

---

## 🎯 OBJETIVO

Resolver **ERROR 404** que ocurre cuando usuario completa Wizard:
```
POST /sessions → 201 Created → Redirect /calibration → 404 (página no existe)
```

**Solución:**
1. Crear Landing Page Cinema Mode en `/dashboard/performance/calibration/page.tsx`
2. Actualizar API GET /sessions para incluir metadata útil
3. Preparar backend para sistema multi-criterio (sin romper legacy)

---

## 📊 SCHEMA MIGRATION (NO DESTRUCTIVA)

### Archivo: `prisma/schema.prisma`

**Buscar modelo CalibrationSession y AGREGAR estos campos:**

```prisma
model CalibrationSession {
  // ... campos existentes (NO TOCAR)
  
  // ⚠️ DEPRECATED - Mantener para compatibilidad backward
  departmentIds String[] @default([]) @map("department_ids")
  
  // ✅ NUEVO SISTEMA (v3.1+) - Agregado TASK 17A
  filterMode   String  @default("jobLevel") @map("filter_mode")
  filterConfig Json?   @map("filter_config")
  
  // ... resto de campos existentes (NO TOCAR)
}
```

**⚠️ CRÍTICO:**
- ❌ NO eliminar `departmentIds`
- ❌ NO modificar campos existentes
- ✅ SOLO agregar `filterMode` y `filterConfig`

**Ejecutar migración:**
```bash
npx prisma migrate dev --name add_calibration_filter_fields
npx prisma generate
npm run build  # Validar que compila
```

---

## 🎬 LANDING PAGE CINEMA MODE

### Archivo: `src/app/dashboard/performance/calibration/page.tsx` (NUEVO)

**Crear página completa con:**

1. **Componente Principal:** `CalibrationLandingPage`
   - Fetch sesiones desde GET /api/calibration/sessions
   - Separar activas (DRAFT/IN_PROGRESS) vs cerradas (CLOSED)
   - Verificar permisos para botón "Nueva Sesión"

2. **Carrusel Cinema (Sesiones Activas):**
   - Cards grandes 400px × 380px (desktop)
   - Glassmorphism: `bg-slate-800/50 backdrop-blur-xl border-slate-700/50`
   - Navegación: Flechas laterales si hay >3 sesiones
   - Framer Motion: `whileHover={{ scale: 1.02, y: -4 }}`

3. **SessionCard Component:**
   - Header: Nombre + Status Badge
   - Criterio: Mostrar filterMode con íconos
   - Métricas: Empleados count + Ajustes count
   - Línea Tesla dinámica según status
   - CTA: "Configurar" (DRAFT) / "Abrir Sesión" (IN_PROGRESS) / "Ver Reporte" (CLOSED)

4. **Empty State:**
   - Cinema Frame vacío con ícono Users
   - Mensaje según rol (puede crear vs no puede crear)
   - Botón "Crear Primera Sesión" (solo si tiene permisos)

5. **Lista Cerradas:**
   - Compacta, máximo 5 sesiones
   - Click abre reporte

**Design System (usar estas clases):**
```css
.bg-[#0F172A]                    /* Fondo principal */
.fhr-card                        /* Card glassmorphism base */
.from-cyan-500 to-cyan-600       /* Gradient botones primarios */
.text-slate-400                  /* Texto secundario */
.border-slate-700/50             /* Bordes sutiles */
```

**RBAC - Botón "Nueva Sesión":**
```typescript
const allowedRoles = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER', 
  'HR_MANAGER',
  'CEO'
]
const canCreate = allowedRoles.includes(userRole)

// Botón SOLO visible si canCreate === true
```

---

## 🔧 BACKEND: API GET /sessions (MEJORAR)

### Archivo: `src/app/api/calibration/sessions/route.ts`

**Modificar función GET existente:**

**Agregar al final del query:**
```typescript
export async function GET(request: NextRequest) {
  // ... código existente de auth y filtros
  
  const sessions = await prisma.calibrationSession.findMany({
    where: whereClause,
    include: {
      cycle: {
        select: { name: true, startDate: true, endDate: true }
      },
      _count: {
        select: {
          participants: true,
          adjustments: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  // ✅ NUEVO: Enriquecer con metadata útil para UI
  const enrichedSessions = await Promise.all(
    sessions.map(async (session) => {
      // Contar empleados candidatos usando criterio actual
      const candidatesQuery = {
        accountId: session.accountId,
        isActive: true,
        performanceRatings: {
          some: { cycleId: session.cycleId }
        }
      }
      
      // Si tiene departmentIds (legacy), agregar filtro
      if (session.departmentIds && session.departmentIds.length > 0) {
        candidatesQuery.departmentId = { in: session.departmentIds }
      }
      
      const employeeCount = await prisma.employee.count({
        where: candidatesQuery
      })
      
      return {
        ...session,
        metadata: {
          employeeCount,
          adjustmentsCount: session._count.adjustments,
          participantsCount: session._count.participants,
          distributionProgress: session.status === 'IN_PROGRESS' 
            ? calculateDistributionProgress(session) 
            : 0
        }
      }
    })
  )
  
  return NextResponse.json({
    success: true,
    sessions: enrichedSessions
  })
}

// Helper function
function calculateDistributionProgress(session: any): number {
  if (!session.distributionTargets) return 0
  
  const targets = session.distributionTargets as any
  const totalAdjustments = session._count.adjustments
  const expectedAdjustments = Object.values(targets).reduce((sum: number, val: any) => sum + val, 0)
  
  return Math.min(100, Math.round((totalAdjustments / expectedAdjustments) * 100))
}
```

---

## 🔧 BACKEND: CalibrationService (PREPARAR)

### Archivo: `src/lib/services/CalibrationService.ts`

**Agregar función helper al final del archivo:**

```typescript
// ════════════════════════════════════════════════════════════════════════════
// HELPERS - Preparación para Multi-Criterio (TASK 17B)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Construye query base para candidatos
 * Por ahora solo soporta departmentIds (legacy)
 * TASK 17B agregará lógica multi-criterio
 */
export function buildCandidatesQueryBase(
  session: CalibrationSession,
  accountId: string
): any {
  
  const baseWhere = {
    accountId,
    isActive: true,
    performanceRatings: {
      some: { 
        cycleId: session.cycleId,
        calculatedScore: { not: null }
      }
    }
  }

  // Sistema legacy (por ahora único soportado)
  if (session.departmentIds && session.departmentIds.length > 0) {
    return {
      ...baseWhere,
      departmentId: { in: session.departmentIds }
    }
  }

  // Sin filtro
  return baseWhere
}
```

---

## ✅ VALIDACIÓN

**Checklist ANTES de marcar como completo:**

```yaml
□ Schema:
  - npx prisma migrate dev ejecutado sin errores
  - npx prisma generate completado
  - npm run build compila sin errores TypeScript
  - departmentIds NO fue eliminado

□ Landing Page:
  - /dashboard/performance/calibration carga sin 404
  - Muestra carrusel si hay sesiones activas
  - Muestra empty state si no hay sesiones
  - Botón "Nueva Sesión" solo visible para roles permitidos
  - SessionCard muestra status badges correctos
  - Click en card navega a ruta correcta

□ API GET /sessions:
  - Retorna sessions con metadata.employeeCount
  - Retorna metadata.adjustmentsCount
  - Retorna metadata.participantsCount
  - RBAC filtra sesiones según rol del usuario

□ Backward Compatibility:
  - Wizard existente sigue funcionando
  - Crear sesión con departmentIds funciona
  - War Room abre sesiones antiguas sin errores
```

**Testing manual:**

```bash
# 1. Verificar compilación
npm run build

# 2. Iniciar dev server
npm run dev

# 3. Abrir navegador
# → /dashboard/performance/calibration
# → Debe cargar (NO 404)

# 4. Crear sesión desde wizard
# → /dashboard/performance/calibration/new
# → Completar wizard normal
# → Post-redirect debe ir a /calibration (NO 404)

# 5. Verificar sesiones legacy
# → Abrir sesión creada antes de TASK 17A
# → War Room debe funcionar normalmente
```

---

## 🚀 ORDEN DE EJECUCIÓN

```yaml
PASO 1 (15 min):
  - Actualizar schema.prisma
  - Ejecutar migración
  - Validar compilación

PASO 2 (60 min):
  - Crear page.tsx completo
  - Implementar CalibrationLandingPage
  - Implementar SessionCard component

PASO 3 (30 min):
  - Actualizar API GET /sessions
  - Agregar metadata enrichment

PASO 4 (15 min):
  - Agregar helper a CalibrationService
  - Testing manual completo

PASO 5 (20 min):
  - Validar checklist
  - Confirmar backward compatibility
```

**Total:** ~2.5-3 horas

---

## 📝 NOTAS CRÍTICAS

1. **NO tocar funciones existentes** en CalibrationService
2. **NO modificar** API POST /sessions (eso va en TASK 17B)
3. **NO implementar** Wizard Step 2 upgrade (eso va en TASK 17B)
4. **SÍ verificar** que sistema legacy sigue funcionando

**Principio:** Esta TASK resuelve el 404 sin agregar complejidad. TASK 17B agregará el filtrado enterprise.

---

**FIN TASK 17A**
