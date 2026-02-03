# 🔧 CAMBIOS en summary/page.tsx

## ARCHIVO
```
src/app/dashboard/evaluaciones/[assignmentId]/summary/page.tsx
```

---

## CAMBIO 1: Ajustar ancho al 85%

Buscar el contenedor de los componentes (PerformanceScoreCard y TeamCalibrationHUD) y cambiar:

```tsx
// ❌ Si tiene max-w-sm (384px) o max-w-md (448px)
<div className="... max-w-sm ...">

// ✅ Cambiar a 85% del ancho disponible
<div className="... w-[85%] ...">
```

O si no tiene max-width, agregar `w-[85%]` al contenedor de los componentes de la columna derecha.

---

## CAMBIO 2: Reemplazar componente en vista Alertas

### 2a. Imports

```tsx
// ❌ QUITAR (si existe)
import ManagementAlertsHUD from '@/components/performance/ManagementAlertsHUD'

// ✅ AGREGAR
import InsightCarousel from '@/components/performance/summary/InsightCarousel'
```

### 2b. En el JSX de vista 'alertas'

```tsx
// ❌ QUITAR
<ManagementAlertsHUD
  competencies={competencies}
  employeeName={displayName}
  className="..."
/>

// ✅ PONER
<InsightCarousel
  competencies={competencies}
  employeeName={displayName}
  className="w-full"
/>
```

---

## RESUMEN

1. Ancho componentes: `w-[85%]`
2. Vista Alertas: `ManagementAlertsHUD` → `InsightCarousel`
