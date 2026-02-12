# TASK: FIXES UX - CIERRE DE CICLOS PERFORMANCE

## FECHA: 2025-02-11
## PRIORIDAD: Alta
## TIPO: Bugfix UX

---

## 📍 ARCHIVO A MODIFICAR

```
src/app/dashboard/admin/performance-cycles/[id]/page.tsx
```

---

## 🐛 BUG A: SINCRONIZACIÓN DE BOTONES

### Problema
Después de cambiar estado (ej: ACTIVE → IN_REVIEW), los botones no se actualizan hasta refrescar manualmente la página. `router.refresh()` revalida cache pero no actualiza el estado local `cycle`.

### Solución
Actualizar estado local inmediatamente después de transición exitosa.

### Cambio Requerido

Buscar el handler `handleStatusTransition` y agregar `setCycle` ANTES de `router.refresh()`:

```typescript
// BUSCAR este bloque en handleStatusTransition:
if (data.success) {
  toast({
    title: options.successTitle,
    description: options.successDescription,
    variant: "default"
  });
  router.refresh();
}

// REEMPLAZAR POR:
if (data.success) {
  toast({
    title: options.successTitle,
    description: options.successDescription,
    variant: "default"
  });
  
  // ✅ FIX A: Actualizar estado local inmediatamente
  setCycle(prev => prev ? { ...prev, status: newStatus } : prev);
  
  router.refresh();
}
```

---

## 🐛 BUG B: BOTONES MAL DISEÑADOS

### Problema
Los botones son grandes, están "sueltos" y no siguen el design system FocalizaHR. Deben usar clases `.fhr-btn-sm` y estar agrupados correctamente.

### Referencia
- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md`
- `src/styles/focalizahr-unified.css`

### Cambio Requerido

Buscar los botones de transición de estado y reemplazar por:

```tsx
{/* ═══════════════════════════════════════════════════════════════════
    BOTONES DE TRANSICIÓN DE ESTADO
    Ubicar donde están los botones de cierre/reabrir
═══════════════════════════════════════════════════════════════════ */}
<div className="flex items-center gap-3 flex-wrap">
  
  {/* Pasar a Revisión - visible cuando ACTIVE */}
  {cycle.status === 'ACTIVE' && (
    <button 
      onClick={() => setShowReviewModal(true)}
      disabled={transitionLoading}
      className="fhr-btn fhr-btn-sm"
      style={{ 
        background: 'transparent',
        border: '1px solid #F59E0B',
        color: '#F59E0B'
      }}
    >
      <ClipboardCheck className="w-4 h-4" />
      Pasar a Revisión
    </button>
  )}

  {/* Cerrar Ciclo - visible cuando IN_REVIEW */}
  {cycle.status === 'IN_REVIEW' && (
    <button 
      onClick={() => setShowCompleteModal(true)}
      disabled={transitionLoading}
      className="fhr-btn fhr-btn-sm fhr-btn-success"
    >
      <CheckCircle className="w-4 h-4" />
      Cerrar Ciclo
    </button>
  )}

  {/* Reabrir Ciclo - visible cuando IN_REVIEW */}
  {cycle.status === 'IN_REVIEW' && (
    <button 
      onClick={() => setShowReopenModal(true)}
      disabled={transitionLoading}
      className="fhr-btn fhr-btn-sm fhr-btn-ghost"
    >
      <RotateCcw className="w-4 h-4" />
      Reabrir
    </button>
  )}
  
</div>
```

### Clases CSS Correctas (referencia)

```css
/* De focalizahr-unified.css */
.fhr-btn-sm {
  min-height: 36px;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
}

.fhr-btn-success {
  background: var(--fhr-success);  /* #10B981 */
  color: white;
}

.fhr-btn-ghost {
  background: transparent;
  color: var(--fhr-text-secondary);
  border: 1px solid var(--fhr-border-default);
}
```

---

## 🐛 BUG C: MODALES QUE BAILAN

### Problema
Los modales se mueven/bailan cuando el usuario mueve el mouse. Esto indica un problema de posicionamiento CSS.

### Causa Probable
- Falta `DialogPortal` o `DialogOverlay`
- O se agregó positioning manual que interfiere con shadcn

### Solución

Verificar que cada Dialog tenga la estructura correcta de shadcn/ui:

```tsx
{/* ✅ ESTRUCTURA CORRECTA */}
<Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Pasar a Revisión</DialogTitle>
      <DialogDescription>
        Los evaluadores ya no podrán responder encuestas pendientes.
      </DialogDescription>
    </DialogHeader>
    
    {/* contenido */}
    
    <DialogFooter>
      <button className="fhr-btn fhr-btn-sm fhr-btn-ghost" onClick={() => setShowReviewModal(false)}>
        Cancelar
      </button>
      <button className="fhr-btn fhr-btn-sm fhr-btn-primary" onClick={handleReviewConfirmed} disabled={transitionLoading}>
        {transitionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirmar
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Verificar en DialogContent

**❌ QUITAR si existe:**
```tsx
// NO usar positioning manual
className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"
```

**✅ USAR:**
```tsx
// shadcn Dialog ya tiene positioning correcto built-in
className="sm:max-w-md"
```

### Si el problema persiste

Verificar que `src/components/ui/dialog.tsx` tenga:

```tsx
function DialogContent({ className, children, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />  {/* ← DEBE EXISTIR */}
      <DialogPrimitive.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 ...",  // ← positioning de shadcn
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de aplicar los fixes, verificar:

- [ ] **Fix A:** Cambiar estado ACTIVE → IN_REVIEW actualiza botones sin refrescar
- [ ] **Fix A:** Cambiar estado IN_REVIEW → COMPLETED actualiza botones sin refrescar
- [ ] **Fix A:** Reabrir IN_REVIEW → ACTIVE actualiza botones sin refrescar
- [ ] **Fix B:** Botones tienen tamaño pequeño (36px altura)
- [ ] **Fix B:** Botones están agrupados con gap-3
- [ ] **Fix B:** Colores correctos (warning=amarillo, success=verde, ghost=gris)
- [ ] **Fix C:** Modal no se mueve al mover el mouse
- [ ] **Fix C:** Modal está centrado y fijo
- [ ] **Fix C:** Overlay oscurece el fondo correctamente

---

## 📚 REFERENCIAS

- `GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2.md` - Design system completo
- `src/styles/focalizahr-unified.css` - Clases CSS .fhr-*
- `src/components/ui/dialog.tsx` - Componente Dialog de shadcn
- `FocalizaHR_Premium_Buttons_Guide.md` - Guía de botones premium

---

## 🎯 RESULTADO ESPERADO

```
┌─────────────────────────────────────────────────────────────┐
│  Ciclo: Evaluación Q1 2025                                  │
│  Estado: IN_REVIEW                                          │
│                                                             │
│  ┌──────────────┐  ┌─────────┐                             │
│  │ Cerrar Ciclo │  │ Reabrir │   ← Botones pequeños,       │
│  └──────────────┘  └─────────┘     agrupados, alineados    │
│                                                             │
│  [Click "Cerrar Ciclo"]                                     │
│                                                             │
│  ┌─────────────────────────────────┐                       │
│  │      Modal centrado y FIJO      │  ← No se mueve        │
│  │                                 │                        │
│  │  ¿Cerrar ciclo definitivamente? │                        │
│  │                                 │                        │
│  │  [Cancelar]  [Confirmar]        │                        │
│  └─────────────────────────────────┘                       │
│                                                             │
│  [Confirma]                                                 │
│                                                             │
│  Estado: COMPLETED  ← Se actualiza SIN refrescar página    │
│  (Botones desaparecen porque ciclo está cerrado)           │
└─────────────────────────────────────────────────────────────┘
```
