# TASK 1: CIERRE DE CICLOS DE DESEMPEÑO (v2 CORREGIDA)

## FECHA: 2025-02-11
## ESTADO: ESPECIFICACIÓN CORREGIDA

---

## 🔧 CORRECCIONES APLICADAS

| Problema | Fix |
|----------|-----|
| Falta autenticación | ✅ Patrón ENTERPRISE: `credentials: 'include'` (HttpOnly cookie) |
| Handlers duplicados (DRY) | ✅ Refactorizado a `handleStatusTransition` |
| Falta validación pre-cierre | ✅ Agregado stats + warnings |
| Clases genéricas | ✅ Usando `.fhr-btn-*` design system |
| Mensaje reportes | ✅ Corregido para alinearse con cron |

### 🔐 NOTA DE SEGURIDAD

```yaml
PATRÓN ENTERPRISE (usado):
  - HttpOnly cookie automática
  - credentials: 'include'
  - Protegido contra XSS
  - Ref: GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md

PATRÓN LEGACY (evitado):
  - localStorage.getItem('focalizahr_token')
  - Authorization: Bearer ${token}
  - Vulnerable a XSS
```

---

## 📊 MÁQUINA DE ESTADOS

### PROPUESTA (agregar reversibilidad):
```
DRAFT → SCHEDULED → ACTIVE ⇄ IN_REVIEW → COMPLETED
                      ↓         ↓
                  CANCELLED  CANCELLED
```

---

## 🔧 CAMBIO BACKEND (1 línea)

### Archivo: `src/app/api/admin/performance-cycles/[id]/route.ts`

```typescript
// LÍNEA A MODIFICAR:
const validTransitions: Record<string, string[]> = {
  'DRAFT':     ['SCHEDULED', 'CANCELLED'],
  'SCHEDULED': ['ACTIVE', 'CANCELLED'],
  'ACTIVE':    ['IN_REVIEW', 'CANCELLED'],
  'IN_REVIEW': ['COMPLETED', 'ACTIVE'],  // ← AGREGAR 'ACTIVE'
  'COMPLETED': [],
  'CANCELLED': []
};
```

---

## 🎨 CAMBIOS FRONTEND

### Archivo: `src/app/dashboard/admin/performance-cycles/[id]/page.tsx`

### 1. Imports Adicionales

```typescript
import { ClipboardCheck, CheckCircle, RotateCcw } from 'lucide-react';
```

### 2. Nuevos Estados (agregar junto a existentes)

```typescript
// Estados para modales de cierre
const [showReviewModal, setShowReviewModal] = useState(false);
const [showCompleteModal, setShowCompleteModal] = useState(false);
const [showReopenModal, setShowReopenModal] = useState(false);

// Estados de loading
const [transitionLoading, setTransitionLoading] = useState(false);

// Stats para validación pre-cierre (si no existen, agregar fetch)
const [cycleStats, setCycleStats] = useState<{
  totalAssignments: number;
  completedAssignments: number;
  pendingRatings: number;
  pendingPotential: number;
} | null>(null);
```

### 3. Handler Unificado (DRY - reemplaza 3 handlers)

```typescript
/**
 * Handler unificado para transiciones de estado
 * DRY: Un solo handler paramétrico en lugar de 3 duplicados
 * SECURITY: Patrón ENTERPRISE con HttpOnly cookie
 */
const handleStatusTransition = async (
  newStatus: 'IN_REVIEW' | 'COMPLETED' | 'ACTIVE',
  options: {
    setModal: (v: boolean) => void;
    successTitle: string;
    successDescription: string;
  }
) => {
  options.setModal(false);
  setTransitionLoading(true);
  
  try {
    // ✅ ENTERPRISE: HttpOnly cookie (NO localStorage)
    // Ref: GUIA_MAESTRA_RBAC_SEGURIDAD_FILTRADO_JERARQUICO_v1_1.md
    const response = await fetch(`/api/admin/performance-cycles/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',  // ← Cookie HttpOnly automática
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la transición');
    }
    
    if (data.success) {
      toast({
        title: options.successTitle,
        description: options.successDescription,
        variant: "default"
      });
      router.refresh();
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error: any) {
    toast({
      title: "❌ Error",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setTransitionLoading(false);
  }
};

// Wrappers específicos para cada acción (para los modales)
const handleReviewConfirmed = () => handleStatusTransition('IN_REVIEW', {
  setModal: setShowReviewModal,
  successTitle: "📋 Ciclo en revisión",
  successDescription: "Los evaluadores ya no pueden responder. Revisa los resultados."
});

const handleCompleteConfirmed = () => handleStatusTransition('COMPLETED', {
  setModal: setShowCompleteModal,
  successTitle: "✅ Ciclo completado",
  successDescription: "El cron enviará los reportes en el próximo ciclo programado."
});

const handleReopenConfirmed = () => handleStatusTransition('ACTIVE', {
  setModal: setShowReopenModal,
  successTitle: "🔄 Ciclo reabierto",
  successDescription: "Los evaluadores pueden volver a responder."
});
```

### 4. Fetch de Stats para Validación (agregar en useEffect)

```typescript
// Fetch stats del ciclo para validación pre-cierre
const fetchCycleStats = async () => {
  try {
    // ✅ ENTERPRISE: HttpOnly cookie (NO localStorage)
    const response = await fetch(
      `/api/admin/performance-cycles/${id}/stats`,
      {
        credentials: 'include',  // ← Cookie HttpOnly automática
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    if (data.success) {
      setCycleStats(data.stats);
    }
  } catch (error) {
    console.error('Error fetching cycle stats:', error);
  }
};

// En useEffect existente, agregar:
useEffect(() => {
  fetchCycleStats();
}, [id]);
```

### 5. Botones con Design System FocalizaHR

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    BOTONES DE TRANSICIÓN DE ESTADO
    Ubicar donde están los botones existentes (Generar, Activar)
═══════════════════════════════════════════════════════════════════ */}

{/* Botón: Pasar a Revisión - visible cuando ACTIVE */}
{cycle.status === 'ACTIVE' && (
  <button 
    onClick={() => setShowReviewModal(true)}
    disabled={transitionLoading}
    className="fhr-btn fhr-btn-secondary"
    style={{ borderColor: '#F59E0B', color: '#F59E0B' }}
  >
    <ClipboardCheck className="w-4 h-4 mr-2" />
    Pasar a Revisión
  </button>
)}

{/* Botón: Cerrar Ciclo - visible cuando IN_REVIEW */}
{cycle.status === 'IN_REVIEW' && (
  <button 
    onClick={() => setShowCompleteModal(true)}
    disabled={transitionLoading}
    className="fhr-btn fhr-btn-success"
  >
    <CheckCircle className="w-4 h-4 mr-2" />
    Cerrar Ciclo
  </button>
)}

{/* Botón: Reabrir Ciclo - visible cuando IN_REVIEW */}
{cycle.status === 'IN_REVIEW' && (
  <button 
    onClick={() => setShowReopenModal(true)}
    disabled={transitionLoading}
    className="fhr-btn fhr-btn-secondary"
  >
    <RotateCcw className="w-4 h-4 mr-2" />
    Reabrir Ciclo
  </button>
)}
```

### 6. Modales con Validaciones

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    MODAL: PASAR A REVISIÓN (ACTIVE → IN_REVIEW)
═══════════════════════════════════════════════════════════════════ */}
<Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
  <DialogContent className="fhr-card">
    <DialogHeader>
      <DialogTitle className="text-slate-100">Pasar a Revisión</DialogTitle>
      <DialogDescription className="text-slate-400">
        Los evaluadores ya no podrán responder encuestas pendientes.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4 space-y-3">
      {/* Warning: Evaluaciones pendientes */}
      {cycleStats && cycleStats.completedAssignments < cycleStats.totalAssignments && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-200">
            ⚠️ Hay {cycleStats.totalAssignments - cycleStats.completedAssignments} evaluaciones sin completar
          </p>
        </div>
      )}
      
      <p className="text-sm text-slate-400">
        Podrás reabrir el ciclo si necesitas dar más tiempo.
      </p>
    </div>
    
    <DialogFooter>
      <button 
        className="fhr-btn fhr-btn-ghost"
        onClick={() => setShowReviewModal(false)}
      >
        Cancelar
      </button>
      <button 
        onClick={handleReviewConfirmed} 
        disabled={transitionLoading}
        className="fhr-btn fhr-btn-primary"
        style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
      >
        {transitionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sí, Pasar a Revisión
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* ═══════════════════════════════════════════════════════════════════
    MODAL: CERRAR CICLO (IN_REVIEW → COMPLETED)
    ✅ Con validación de ratings y potencial
═══════════════════════════════════════════════════════════════════ */}
<Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
  <DialogContent className="fhr-card">
    <DialogHeader>
      <DialogTitle className="text-slate-100">Cerrar Ciclo</DialogTitle>
      <DialogDescription className="text-slate-400">
        Esta acción es permanente. Los resultados se marcarán como finales.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4 space-y-3">
      {/* Warning: Acción irreversible */}
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-200">
          🚨 No podrás reabrir el ciclo después de completarlo.
        </p>
      </div>
      
      {/* ✅ FIX: Validación de ratings pendientes */}
      {cycleStats && cycleStats.pendingRatings > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-200">
            ⚠️ Hay {cycleStats.pendingRatings} ratings sin calcular
          </p>
        </div>
      )}
      
      {/* ✅ FIX: Validación de potencial pendiente */}
      {cycleStats && cycleStats.pendingPotential > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-200">
            ⚠️ Hay {cycleStats.pendingPotential} empleados sin potencial asignado
          </p>
        </div>
      )}
      
      {/* ✅ FIX: Mensaje correcto sobre reportes */}
      <p className="text-sm text-slate-400">
        El cron de reportes (<code>send-reports</code>) enviará los resultados 
        individuales a los empleados en el próximo ciclo programado (9:00 UTC diario).
      </p>
    </div>
    
    <DialogFooter>
      <button 
        className="fhr-btn fhr-btn-ghost"
        onClick={() => setShowCompleteModal(false)}
      >
        Cancelar
      </button>
      <button 
        onClick={handleCompleteConfirmed} 
        disabled={transitionLoading}
        className="fhr-btn fhr-btn-success"
      >
        {transitionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sí, Cerrar Ciclo
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* ═══════════════════════════════════════════════════════════════════
    MODAL: REABRIR CICLO (IN_REVIEW → ACTIVE)
═══════════════════════════════════════════════════════════════════ */}
<Dialog open={showReopenModal} onOpenChange={setShowReopenModal}>
  <DialogContent className="fhr-card">
    <DialogHeader>
      <DialogTitle className="text-slate-100">Reabrir Ciclo</DialogTitle>
      <DialogDescription className="text-slate-400">
        Los evaluadores podrán volver a responder sus encuestas pendientes.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4 space-y-3">
      <p className="text-sm text-slate-400">
        Considera extender la fecha de cierre si vas a dar más tiempo.
      </p>
      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-sm text-cyan-200">
          💡 Tip: Después de reabrir, puedes editar la fecha de cierre del ciclo.
        </p>
      </div>
    </div>
    
    <DialogFooter>
      <button 
        className="fhr-btn fhr-btn-ghost"
        onClick={() => setShowReopenModal(false)}
      >
        Cancelar
      </button>
      <button 
        onClick={handleReopenConfirmed} 
        disabled={transitionLoading}
        className="fhr-btn fhr-btn-primary"
      >
        {transitionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sí, Reabrir Ciclo
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🔌 API STATS (OPCIONAL - Si no existe)

Si no existe el endpoint `/api/admin/performance-cycles/[id]/stats`, crear:

### Archivo: `src/app/api/admin/performance-cycles/[id]/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractUserContext } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userContext = extractUserContext(request);

    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el ciclo pertenece a la cuenta
    const cycle = await prisma.performanceCycle.findFirst({
      where: {
        id,
        accountId: userContext.accountId
      },
      include: {
        _count: {
          select: { assignments: true }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: 'Ciclo no encontrado' },
        { status: 404 }
      );
    }

    // Contar assignments completados
    const completedAssignments = await prisma.evaluationAssignment.count({
      where: {
        cycleId: id,
        accountId: userContext.accountId,
        status: 'SUBMITTED'
      }
    });

    // Contar ratings calculados
    const totalRatings = await prisma.performanceRating.count({
      where: {
        cycleId: id,
        accountId: userContext.accountId
      }
    });

    const ratingsWithScore = await prisma.performanceRating.count({
      where: {
        cycleId: id,
        accountId: userContext.accountId,
        calculatedScore: { gt: 0 }
      }
    });

    // Contar potencial asignado
    const ratingsWithPotential = await prisma.performanceRating.count({
      where: {
        cycleId: id,
        accountId: userContext.accountId,
        potentialScore: { not: null }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalAssignments: cycle._count.assignments,
        completedAssignments,
        pendingRatings: totalRatings - ratingsWithScore,
        pendingPotential: ratingsWithScore - ratingsWithPotential
      }
    });

  } catch (error: any) {
    console.error('[API] Error fetching cycle stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## ✅ CHECKLIST IMPLEMENTACIÓN CORREGIDA

### Backend
- [ ] Agregar `'ACTIVE'` a transiciones desde `IN_REVIEW` (1 línea)
- [ ] Crear endpoint `/stats` si no existe

### Frontend
- [ ] Agregar imports de iconos
- [ ] Agregar estados para modales
- [ ] Implementar `handleStatusTransition` unificado (DRY)
- [ ] Agregar fetch de stats
- [ ] Agregar botones con clases `.fhr-btn-*`
- [ ] Agregar modales con validaciones

### Testing
- [ ] Probar ACTIVE → IN_REVIEW con evaluaciones pendientes
- [ ] Probar IN_REVIEW → COMPLETED con warnings
- [ ] Probar IN_REVIEW → ACTIVE (reabrir)
- [ ] Verificar que cookie HttpOnly se envía (`credentials: 'include'`)

---

## 📊 SCORE ACTUALIZADO

| Categoría | Antes | Después |
|-----------|-------|---------|
| Arquitectura | 9/10 | 9/10 |
| Completitud | 7/10 | **9/10** |
| DRY | 6/10 | **9/10** |
| Seguridad | Legacy | **✅ Enterprise** |
| Diseño | Pendiente | **✅ FHR** |

---

## 🔗 ARCHIVOS A MODIFICAR/CREAR

1. `src/app/api/admin/performance-cycles/[id]/route.ts` - 1 línea
2. `src/app/api/admin/performance-cycles/[id]/stats/route.ts` - NUEVO (~60 líneas)
3. `src/app/dashboard/admin/performance-cycles/[id]/page.tsx` - ~180 líneas
