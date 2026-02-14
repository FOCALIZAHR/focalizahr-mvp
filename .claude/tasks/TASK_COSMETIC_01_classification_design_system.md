# TASK_COSMETIC_01: Aplicar Design System FocalizaHR a Componentes Clasificación

## 🎯 OBJETIVO

Aplicar los estilos oficiales del Design System FocalizaHR a los componentes de clasificación de cargos, **SIN modificar lógica ni funcionalidad**.

## 📋 CONTEXTO

Los componentes fueron creados con Tailwind directo en vez de usar las clases `.fhr-*` del sistema de diseño. Necesitan alinearse visualmente con el resto de la aplicación.

**Guía de referencia:** `.claude/task/focalizahr-ui-design-standards-v2.md`

---

## 📁 ARCHIVOS A MODIFICAR

```yaml
src/components/job-classification/:
  - ClassificationApprovalPreview.tsx
  - ClassificationReviewWizard.tsx
  - EmployeeClassificationCard.tsx
```

---

## 🔄 CAMBIOS ESPECÍFICOS

### 1. CARDS

**BUSCAR** clases como:
```tsx
// ❌ ACTUAL (Tailwind directo)
className="bg-slate-800/60 border border-slate-700 rounded-xl p-4"
className="bg-slate-800/40 border border-slate-700/30 rounded-xl"
className="p-4 rounded-xl border bg-slate-800/40 border-slate-700/30"
```

**REEMPLAZAR CON:**
```tsx
// ✅ CORRECTO (Design System)
className="fhr-card"           // Card estándar con hover
className="fhr-card-metric"    // Card de métricas
className="fhr-card-static"    // Card sin hover
```

### 2. BADGES

**BUSCAR** badges inline como:
```tsx
// ❌ ACTUAL
<span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">
<span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
<span className="px-3 py-1 rounded-full text-sm bg-emerald-500/20 text-emerald-400">
```

**REEMPLAZAR CON:**
```tsx
// ✅ CORRECTO
<span className="fhr-badge fhr-badge-active">      // Cyan - activo
<span className="fhr-badge fhr-badge-warning">     // Amber - pendiente
<span className="fhr-badge fhr-badge-success">     // Verde - completado
<span className="fhr-badge fhr-badge-error">       // Rojo - error
<span className="fhr-badge fhr-badge-draft">       // Gris - draft
<span className="fhr-badge fhr-badge-premium">     // Purple - premium
```

### 3. BOTONES

**BUSCAR** botones con clases inline:
```tsx
// ❌ ACTUAL
<button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
<button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg">
<button className="text-slate-400 hover:text-white">
```

**REEMPLAZAR CON:**
```tsx
// ✅ CORRECTO - Importar componentes
import { PrimaryButton, SecondaryButton, GhostButton } from '@/components/ui/PremiumButton'

// Uso:
<PrimaryButton onClick={handleConfirm} icon={Check}>
  Confirmar Clasificación
</PrimaryButton>

<SecondaryButton onClick={handleReview} icon={Eye}>
  Revisar Pendientes
</SecondaryButton>

<GhostButton onClick={handleCancel}>
  Cancelar
</GhostButton>
```

### 4. LÍNEA TESLA (Headers de Modal/Card destacado)

**AGREGAR** en headers de modales y cards principales:
```tsx
// ✅ AGREGAR en el header del componente
<div className="relative">
  <div className="fhr-top-line" />  {/* ← AGREGAR */}
  <h2 className="text-lg font-light text-slate-200">
    Clasificación de Cargos
  </h2>
</div>
```

### 5. TÍTULOS CON GRADIENTE

**BUSCAR** títulos importantes:
```tsx
// ❌ ACTUAL
<h2 className="text-2xl font-bold text-white">
  Clasificación Lista
</h2>
```

**REEMPLAZAR CON:**
```tsx
// ✅ CORRECTO (gradiente en PARTE del título)
<h2 className="text-2xl font-light text-white">
  Clasificación <span className="fhr-title-gradient">Lista</span>
</h2>
```

### 6. COLORES DE TRACK (Mantener pero estandarizar)

Los colores de los 3 tracks están correctos, solo asegurar consistencia:
```tsx
// Colores de track (YA CORRECTOS - no cambiar)
EJECUTIVO: text-red-400, bg-red-500/10, border-red-500
MANAGER: text-amber-400, bg-amber-500/10, border-amber-500  
COLABORADOR: text-emerald-400, bg-emerald-500/10, border-emerald-500
```

### 7. INPUTS

**BUSCAR:**
```tsx
// ❌ ACTUAL
<input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white">
```

**REEMPLAZAR CON:**
```tsx
// ✅ CORRECTO
<input className="fhr-input">
```

---

## ⚠️ NO MODIFICAR

```yaml
PRESERVAR INTACTO:
  - useState, useEffect, useMemo, useCallback
  - Lógica de clasificación (onClassify, updateClassification)
  - Callbacks (onComplete, onCancel, onApprove)
  - Keyboard shortcuts (1, 2, 3, ←, →, Enter, Esc)
  - Animaciones framer-motion (AnimatePresence, motion.div)
  - Props interfaces
  - Importaciones de tipos
  - Lógica de navegación (currentIndex, handleNext, handlePrev)
  - Cálculos de progreso
  - Detección de conflictos/anomalías
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

Después de los cambios, verificar:

```yaml
✅ Cards usan .fhr-card o .fhr-card-metric
✅ Badges usan .fhr-badge + variante
✅ Botones principales son PrimaryButton/SecondaryButton/GhostButton
✅ Header tiene .fhr-top-line
✅ Al menos un título usa .fhr-title-gradient (parcial)
✅ Inputs usan .fhr-input
✅ Compilación TypeScript sin errores
✅ Funcionalidad IDÉNTICA (probar flujo completo)
```

---

## 🧪 PRUEBA POST-CAMBIO

1. Ir a `/dashboard/campaigns/new`
2. Seleccionar tipo employee-based
3. Avanzar a paso de clasificación
4. Verificar que:
   - Cards se ven con glassmorphism FocalizaHR
   - Badges tienen colores consistentes
   - Botones tienen hover/active states correctos
   - Línea Tesla visible en header
   - Gradiente en título principal
5. Completar flujo → confetti debe seguir funcionando

---

## 🤖 PROMPT PARA CLAUDE CODE

```
Ejecuta TASK_COSMETIC_01 en .claude/task/

OBJETIVO: Aplicar Design System FocalizaHR a componentes de clasificación.

ARCHIVOS:
- src/components/job-classification/ClassificationApprovalPreview.tsx
- src/components/job-classification/ClassificationReviewWizard.tsx  
- src/components/job-classification/EmployeeClassificationCard.tsx

CAMBIOS COSMÉTICOS (NO tocar lógica):
1. Cards: bg-slate-800... → .fhr-card / .fhr-card-metric
2. Badges: inline styles → .fhr-badge .fhr-badge-*
3. Botones: inline → PrimaryButton/SecondaryButton/GhostButton
4. Agregar .fhr-top-line en headers
5. Agregar .fhr-title-gradient en título principal
6. Inputs: inline → .fhr-input

REFERENCIA: .claude/task/focalizahr-ui-design-standards-v2.md

CRÍTICO: NO modificar lógica, callbacks, keyboard shortcuts, ni animaciones.
Solo cambios visuales de clases CSS.
```

---

## 📚 REFERENCIAS

- Design System: `.claude/task/focalizahr-ui-design-standards-v2.md`
- Premium Buttons: `src/components/ui/PremiumButton.tsx`
- CSS Base: `src/styles/focalizahr-unified.css`
- Filosofía: `/mnt/project/FILOSOFIA_DISENO_FOCALIZAHR_v2.md`
