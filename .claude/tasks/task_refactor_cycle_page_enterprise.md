# TASK: REFACTORIZACIÓN ENTERPRISE - PÁGINA DETALLE CICLO PERFORMANCE

## FECHA: 2025-02-11
## PRIORIDAD: CRÍTICA
## TIPO: Refactorización UX Enterprise

---

## 🎯 OBJETIVO

Refactorizar la página de detalle de ciclo de performance para cumplir estándares enterprise FocalizaHR:
- Mobile-first (SI NO FUNCIONA EN MÓVIL, NO ESTÁ LISTO)
- Botones y modales del design system FocalizaHR
- Card de acciones con lógica secuencial/wizard
- Sincronización correcta de estados sin F5

---

## 📍 ARCHIVO PRINCIPAL

```
src/app/dashboard/admin/performance-cycles/[id]/page.tsx
```

---

## 🐛 PROBLEMAS ACTUALES

| # | Problema | Impacto |
|---|----------|---------|
| 1 | Modales no caben en móvil, CTA no visible | UX roto en mobile |
| 2 | Botones no siguen design system FocalizaHR | Inconsistencia visual |
| 3 | Card acciones no tiene lógica secuencial | Usuario no sabe qué hacer |
| 4 | Estado no se sincroniza sin F5 | Usuario confundido |
| 5 | No hay feedback visual de carga | Usuario no sabe si sistema trabaja |

---

## 📐 REGLAS DISEÑO FOCALIZAHR (OBLIGATORIAS)

### Mobile-First (INQUEBRANTABLE)
```yaml
✅ Base = Mobile (375px mínimo)
✅ Touch targets mínimo 44x44px
✅ Textos legibles sin zoom (16px mínimo)
✅ Sin scroll horizontal NUNCA
✅ Botones full-width en mobile
✅ Modales con max-height y scroll interno
```

### Clases CSS Permitidas
```css
/* BOTONES - SOLO USAR ESTAS */
.fhr-btn              /* Base obligatoria */
.fhr-btn-primary      /* Acción principal (cyan gradient) */
.fhr-btn-secondary    /* Secundario (outline cyan) */
.fhr-btn-success      /* Éxito/Completar (verde) */
.fhr-btn-ghost        /* Cancelar/Terciario */
.fhr-btn-sm           /* Tamaño pequeño (36px) */
.fhr-btn-lg           /* Tamaño grande (52px) */
.fhr-btn-full         /* Full width */

/* MODALES */
.fhr-modal-content    /* Contenedor modal */
.fhr-modal-header     /* Header modal */

/* CARDS */
.fhr-card             /* Card glassmorphism */

/* ESTADOS */
.fhr-badge            /* Badges de estado */
.fhr-badge-success    /* Verde */
.fhr-badge-warning    /* Amarillo */
.fhr-badge-active     /* Cyan */
```

---

## 🔧 SOLUCIÓN COMPLETA

### 1. CARD DE ACCIONES ENTERPRISE (Wizard Secuencial)

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    CARD ACCIONES PRINCIPALES - Lógica Secuencial Enterprise
    Muestra solo la acción disponible según el estado actual
═══════════════════════════════════════════════════════════════════ */}
<div className="fhr-card">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-medium text-white">Acciones</h3>
    <StatusBadge status={cycle.status} />
  </div>
  
  {/* PROGRESO VISUAL DEL WIZARD */}
  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
    <StepIndicator 
      step={1} 
      label="Generar" 
      completed={cycle.status !== 'DRAFT'}
      active={cycle.status === 'DRAFT'}
    />
    <div className="w-8 h-px bg-slate-700 flex-shrink-0" />
    <StepIndicator 
      step={2} 
      label="Activar" 
      completed={['ACTIVE', 'IN_REVIEW', 'COMPLETED'].includes(cycle.status)}
      active={cycle.status === 'SCHEDULED'}
    />
    <div className="w-8 h-px bg-slate-700 flex-shrink-0" />
    <StepIndicator 
      step={3} 
      label="Revisar" 
      completed={['COMPLETED'].includes(cycle.status)}
      active={cycle.status === 'ACTIVE' || cycle.status === 'IN_REVIEW'}
    />
    <div className="w-8 h-px bg-slate-700 flex-shrink-0" />
    <StepIndicator 
      step={4} 
      label="Cerrar" 
      completed={cycle.status === 'COMPLETED'}
      active={cycle.status === 'IN_REVIEW'}
    />
  </div>
  
  {/* ACCIÓN ACTUAL - Solo muestra la relevante */}
  <div className="space-y-3">
    {/* DRAFT: Generar Evaluaciones */}
    {cycle.status === 'DRAFT' && (
      <ActionButton
        icon={<Wand2 className="w-5 h-5" />}
        label="Generar Evaluaciones"
        description="Crear assignments según configuración del ciclo"
        onClick={() => setShowGenerateModal(true)}
        loading={generating}
        variant="primary"
      />
    )}
    
    {/* SCHEDULED: Activar Ciclo */}
    {cycle.status === 'SCHEDULED' && (
      <ActionButton
        icon={<Zap className="w-5 h-5" />}
        label="Activar Ciclo"
        description={`Enviar invitaciones a ${cycle._count?.assignments || 0} evaluadores`}
        onClick={() => setShowActivateModal(true)}
        loading={activating}
        variant="primary"
      />
    )}
    
    {/* ACTIVE: Pasar a Revisión */}
    {cycle.status === 'ACTIVE' && (
      <>
        <ActionButton
          icon={<ClipboardCheck className="w-5 h-5" />}
          label="Pasar a Revisión"
          description="Cerrar recepción de evaluaciones"
          onClick={() => setShowReviewModal(true)}
          loading={transitionLoading}
          variant="warning"
        />
        {/* Botón secundario para calcular ratings */}
        <button
          onClick={handleCalculateRatings}
          disabled={calculatingRatings}
          className="fhr-btn fhr-btn-ghost fhr-btn-full"
        >
          {calculatingRatings ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4" />
          )}
          Calcular Ratings
        </button>
      </>
    )}
    
    {/* IN_REVIEW: Cerrar o Reabrir */}
    {cycle.status === 'IN_REVIEW' && (
      <div className="space-y-3">
        <ActionButton
          icon={<CheckCircle className="w-5 h-5" />}
          label="Cerrar Ciclo"
          description="Finalizar y habilitar envío de reportes"
          onClick={() => setShowCompleteModal(true)}
          loading={transitionLoading}
          variant="success"
        />
        <button
          onClick={() => setShowReopenModal(true)}
          disabled={transitionLoading}
          className="fhr-btn fhr-btn-ghost fhr-btn-full"
        >
          <RotateCcw className="w-4 h-4" />
          Reabrir para más evaluaciones
        </button>
      </div>
    )}
    
    {/* COMPLETED: Sin acciones */}
    {cycle.status === 'COMPLETED' && (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
        <p className="text-slate-400">Ciclo completado exitosamente</p>
        <p className="text-xs text-slate-500 mt-1">
          Los reportes se enviarán automáticamente
        </p>
      </div>
    )}
  </div>
</div>
```

### 2. COMPONENTE ActionButton (Reutilizable)

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    COMPONENTE: ActionButton
    Botón de acción enterprise con loading state y descripción
═══════════════════════════════════════════════════════════════════ */}
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  variant: 'primary' | 'success' | 'warning' | 'danger';
}

function ActionButton({ 
  icon, 
  label, 
  description, 
  onClick, 
  loading, 
  variant 
}: ActionButtonProps) {
  const variantClasses = {
    primary: 'fhr-btn-primary',
    success: 'fhr-btn-success',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    danger: 'fhr-btn-danger'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        fhr-btn fhr-btn-full fhr-btn-lg
        ${variantClasses[variant]}
        flex-col items-start text-left py-4 h-auto
      `}
    >
      <div className="flex items-center gap-3 w-full">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
        ) : (
          <span className="flex-shrink-0">{icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{label}</div>
          <div className="text-xs opacity-80 truncate">{description}</div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-50 flex-shrink-0" />
      </div>
    </button>
  );
}
```

### 3. COMPONENTE StepIndicator (Wizard Visual)

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    COMPONENTE: StepIndicator
    Indicador de paso en el wizard secuencial
═══════════════════════════════════════════════════════════════════ */}
interface StepIndicatorProps {
  step: number;
  label: string;
  completed: boolean;
  active: boolean;
}

function StepIndicator({ step, label, completed, active }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        transition-all duration-300
        ${completed 
          ? 'bg-emerald-500 text-white' 
          : active 
            ? 'bg-cyan-500 text-white ring-2 ring-cyan-500/50' 
            : 'bg-slate-700 text-slate-400'
        }
      `}>
        {completed ? <Check className="w-4 h-4" /> : step}
      </div>
      <span className={`text-xs ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}
```

### 4. MODALES MOBILE-FIRST

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    MODALES - Mobile First con scroll interno
    max-height para que siempre quepa el CTA
═══════════════════════════════════════════════════════════════════ */}

{/* Modal: Pasar a Revisión */}
<Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
  <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle className="text-lg text-white">Pasar a Revisión</DialogTitle>
    </DialogHeader>
    
    {/* Contenido con scroll si es necesario */}
    <div className="flex-1 overflow-y-auto py-4 space-y-3">
      <p className="text-sm text-slate-400">
        Los evaluadores ya no podrán responder encuestas pendientes.
      </p>
      
      {/* Warning evaluaciones pendientes */}
      {cycleStats && cycleStats.completedAssignments < cycleStats.totalAssignments && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-200">
            ⚠️ {cycleStats.totalAssignments - cycleStats.completedAssignments} evaluaciones pendientes
          </p>
        </div>
      )}
      
      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-sm text-cyan-200">
          💡 Podrás reabrir el ciclo si necesitas dar más tiempo.
        </p>
      </div>
    </div>
    
    {/* Footer SIEMPRE visible - sticky en mobile */}
    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-700">
      <button 
        className="fhr-btn fhr-btn-ghost fhr-btn-full sm:fhr-btn-auto"
        onClick={() => setShowReviewModal(false)}
      >
        Cancelar
      </button>
      <button 
        onClick={handleReviewConfirmed} 
        disabled={transitionLoading}
        className="fhr-btn fhr-btn-full sm:fhr-btn-auto bg-amber-600 hover:bg-amber-700 text-white"
      >
        {transitionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirmar
      </button>
    </div>
  </DialogContent>
</Dialog>

{/* Modal: Cerrar Ciclo */}
<Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
  <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle className="text-lg text-white">Cerrar Ciclo</DialogTitle>
    </DialogHeader>
    
    <div className="flex-1 overflow-y-auto py-4 space-y-3">
      {/* Warning irreversible */}
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-200">
          🚨 Esta acción es permanente. No podrás reabrir el ciclo.
        </p>
      </div>
      
      {/* Stats pendientes */}
      {cycleStats?.pendingRatings > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-200">
            ⚠️ {cycleStats.pendingRatings} ratings sin calcular
          </p>
        </div>
      )}
      
      <p className="text-sm text-slate-400">
        Los reportes se enviarán automáticamente a los empleados.
      </p>
    </div>
    
    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-700">
      <button 
        className="fhr-btn fhr-btn-ghost fhr-btn-full sm:fhr-btn-auto"
        onClick={() => setShowCompleteModal(false)}
      >
        Cancelar
      </button>
      <button 
        onClick={handleCompleteConfirmed} 
        disabled={transitionLoading}
        className="fhr-btn fhr-btn-success fhr-btn-full sm:fhr-btn-auto"
      >
        {transitionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Cerrar Ciclo
      </button>
    </div>
  </DialogContent>
</Dialog>

{/* Modal: Reabrir */}
<Dialog open={showReopenModal} onOpenChange={setShowReopenModal}>
  <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle className="text-lg text-white">Reabrir Ciclo</DialogTitle>
    </DialogHeader>
    
    <div className="flex-1 overflow-y-auto py-4 space-y-3">
      <p className="text-sm text-slate-400">
        Los evaluadores podrán volver a responder sus encuestas.
      </p>
      <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-sm text-cyan-200">
          💡 Considera extender la fecha de cierre después de reabrir.
        </p>
      </div>
    </div>
    
    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-700">
      <button 
        className="fhr-btn fhr-btn-ghost fhr-btn-full sm:fhr-btn-auto"
        onClick={() => setShowReopenModal(false)}
      >
        Cancelar
      </button>
      <button 
        onClick={handleReopenConfirmed} 
        disabled={transitionLoading}
        className="fhr-btn fhr-btn-primary fhr-btn-full sm:fhr-btn-auto"
      >
        {transitionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Reabrir
      </button>
    </div>
  </DialogContent>
</Dialog>
```

### 5. HANDLER CON SINCRONIZACIÓN CORRECTA

```typescript
/**
 * Handler unificado con actualización de estado local CORRECTA
 * Patrón: Optimistic update + server refresh
 */
const handleStatusTransition = async (
  newStatus: 'IN_REVIEW' | 'COMPLETED' | 'ACTIVE',
  options: {
    setModal: (v: boolean) => void;
    successTitle: string;
    successDescription: string;
  }
) => {
  // 1. Cerrar modal inmediatamente
  options.setModal(false);
  setTransitionLoading(true);
  
  try {
    // 2. ENTERPRISE: HttpOnly cookie
    const response = await fetch(`/api/admin/performance-cycles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la transición');
    }
    
    if (data.success) {
      // 3. ✅ CRÍTICO: Actualizar estado local INMEDIATAMENTE
      setCycle(prev => prev ? { 
        ...prev, 
        status: newStatus 
      } : prev);
      
      // 4. Toast de éxito
      toast({
        title: options.successTitle,
        description: options.successDescription,
        variant: "default"
      });
      
      // 5. Refresh para sincronizar otros datos (stats, etc.)
      router.refresh();
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
```

### 6. IMPORTS NECESARIOS

```typescript
import { 
  Wand2, 
  Zap, 
  ClipboardCheck, 
  CheckCircle, 
  RotateCcw, 
  Calculator,
  ChevronRight,
  Check,
  Loader2 
} from 'lucide-react';
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Estructura
- [ ] Crear componente `ActionButton` reutilizable
- [ ] Crear componente `StepIndicator` para wizard
- [ ] Refactorizar card de acciones con lógica secuencial

### Modales Mobile-First
- [ ] Agregar `max-h-[90vh]` y `flex flex-col` a DialogContent
- [ ] Agregar `flex-1 overflow-y-auto` al contenido
- [ ] Footer con `flex-col-reverse sm:flex-row`
- [ ] Botones con `fhr-btn-full sm:fhr-btn-auto`

### Sincronización
- [ ] `setCycle()` ANTES de `router.refresh()`
- [ ] Loading state en botones durante transición
- [ ] Toast de feedback al usuario

### Design System
- [ ] Solo usar clases `.fhr-btn-*`
- [ ] Touch targets mínimo 44px
- [ ] Textos legibles sin zoom

---

## 🧪 TESTING OBLIGATORIO

### Mobile (375px)
- [ ] Card de acciones visible completa
- [ ] Modales no cortan CTA
- [ ] Scroll interno funciona
- [ ] Touch targets accesibles

### Tablet (768px)
- [ ] Layout se adapta correctamente
- [ ] Botones lado a lado en footer

### Desktop (1024px+)
- [ ] Card de acciones no excesivamente grande
- [ ] Modales centrados correctamente

### Flujo Completo
- [ ] DRAFT → click Generar → Loading → SCHEDULED (sin F5)
- [ ] SCHEDULED → click Activar → Loading → ACTIVE (sin F5)
- [ ] ACTIVE → click Revisar → Loading → IN_REVIEW (sin F5)
- [ ] IN_REVIEW → click Cerrar → Loading → COMPLETED (sin F5)
- [ ] IN_REVIEW → click Reabrir → Loading → ACTIVE (sin F5)

---

## 📚 REFERENCIAS

- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Design system completo
- `src/styles/focalizahr-unified.css` - Clases CSS .fhr-*
- `FocalizaHR_Premium_Buttons_Guide.md` - Guía botones premium
- `src/components/ui/dialog.tsx` - Componente Dialog shadcn

---

## 🎯 RESULTADO ESPERADO

```
┌─────────────────────────────────────────┐
│  Ciclo: Evaluación Q1 2025              │
│  Estado: ● ACTIVE                       │
├─────────────────────────────────────────┤
│  ACCIONES                               │
│                                         │
│  ① ─── ② ─── ③ ─── ④                   │
│  ✓     ✓     ●                          │
│  Gen   Act   Rev   Cer                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📋 Pasar a Revisión            →│   │
│  │    Cerrar recepción de eval.    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🧮 Calcular Ratings             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

[Click "Pasar a Revisión" → Modal mobile-friendly]

┌─────────────────────────────────────────┐
│  Pasar a Revisión                    ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Los evaluadores ya no podrán          │
│  responder encuestas pendientes.        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⚠️ 5 evaluaciones pendientes    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💡 Podrás reabrir si necesitas  │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │         ✓ Confirmar             │   │  ← CTA SIEMPRE VISIBLE
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │           Cancelar              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```
