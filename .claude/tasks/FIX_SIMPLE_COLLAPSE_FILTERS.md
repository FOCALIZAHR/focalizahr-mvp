# FIX SIMPLE: Colapsar Filtros hasta Fecha Ingresada

**Prioridad:** 🟢 BAJA  
**Tiempo:** 2 minutos  
**Riesgo:** MÍNIMO (solo 3 líneas)

---

## 🎯 OBJETIVO

En el Wizard de Calibración Paso 2, ocultar la sección de filtros/scope hasta que el usuario ingrese la fecha programada.

**Razón:** Asegurar que nadie configure filtros sin primero definir la fecha (campo obligatorio).

---

## 📋 CAMBIO ÚNICO

**Archivo:** `src/components/calibration/steps/StepConfigureScope.tsx` (o el componente del Paso 2)

**Buscar:** La sección de filtros/scope (probablemente después de los campos de fecha)

**Envolver en condicional:**

```tsx
// ANTES:
<div className="mt-6">
  {/* Sección de filtros */}
  <h3>Filtrar empleados (opcional)</h3>
  {/* ... resto del código de filtros ... */}
</div>

// DESPUÉS:
{formData.scheduledAt && (
  <div className="mt-6">
    {/* Sección de filtros */}
    <h3>Filtrar empleados (opcional)</h3>
    {/* ... resto del código de filtros ... */}
  </div>
)}
```

---

## ✅ VALIDACIÓN

1. Abrir wizard calibración
2. Ir a Paso 2
3. Verificar:
   - ✅ Filtros NO visibles al inicio
   - ✅ Llenar fecha → Filtros aparecen
   - ✅ Borrar fecha → Filtros desaparecen

---

## ⚠️ IMPORTANTE

**NO TOCAR:**
- ❌ Wizard steps
- ❌ Otros componentes
- ❌ Lógica de validación
- ❌ Sistema de fechas

**SOLO:** Agregar condicional `{formData.scheduledAt && ( ... )}` alrededor de la sección de filtros.

---

**FIN - FIX SIMPLE**
