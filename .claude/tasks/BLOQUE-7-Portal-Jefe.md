# BLOQUE-7: Portal Jefe

## 📋 METADATA
- **Bloque:** 7 de 8
- **Dependencias:** Ninguna (standalone features Portal Jefe)
- **Archivos:** MODIFICAR 2 páginas existentes + CREAR 1 componente
- **Esfuerzo:** 3 días
- **Prioridad:** 🟢 MEDIA-BAJA (UX improvements)

## 🎯 OBJETIVO DEL BLOQUE
Mejorar experiencia evaluadores en portal:
1. **Ver evaluaciones completadas** - Vista read-only enviadas
2. **Guardado automático** - Auto-save cada 30s
3. **Revisión pre-envío** - Modal confirmación
4. **Confirmación post-envío** - Toast + redirect
5. **Navegación mejorada** - Breadcrumbs + filtros

---

## 📦 TAREAS INCLUIDAS

### T-PJ-001-01: Ver Evaluaciones Completadas

**Archivo:** `src/app/dashboard/evaluaciones/[id]/summary/page.tsx` (CREAR)

**Features:**
- Vista read-only evaluación enviada
- Mostrar scores + feedback cualitativo
- No editable (banner info)
- Botón "Volver a Mis Evaluaciones"

**API:**
```typescript
GET /api/evaluations/[id]/summary
```

---

### T-PJ-002-01: Guardado Automático

**Archivo:** `src/app/dashboard/evaluaciones/[id]/page.tsx` (MODIFICAR)

**Agregar hook:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (hasUnsavedChanges) {
      handleAutoSave()
    }
  }, 30000)
  
  return () => clearInterval(interval)
}, [hasUnsavedChanges])
```

---

### T-PJ-003-01: Revisión Pre-Envío

**Archivo:** `src/components/performance/EvaluationReviewModal.tsx` (CREAR)

**Features:**
- Modal antes de enviar
- Preview scores + feedback
- Validación completitud
- Botones: "Volver a Editar" / "Confirmar y Enviar"

---

### T-PJ-004-01: Confirmación Post-Envío

**Archivo:** `src/app/dashboard/evaluaciones/[id]/page.tsx` (MODIFICAR)

**Agregar:**
```typescript
async function handleSubmitEvaluation() {
  // ... submit logic
  
  toast({
    title: '✅ Evaluación Enviada',
    description: `Tu evaluación de ${evaluateeName} ha sido enviada.`,
    duration: 5000
  })
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  router.push('/dashboard/evaluaciones')
}
```

---

### T-PJ-005-01: Navegación Lista/Detail

**Archivo:** `src/app/dashboard/evaluaciones/page.tsx` (MODIFICAR)

**Agregar:**
- Breadcrumbs navegación
- Tabs filtro (pendientes/completadas/todas)
- Cards con badges estado
- Botones diferenciados: "Completar" vs "Ver Evaluación"

---

## ✅ VALIDACIÓN DEL BLOQUE

### Checklist UI:
- [ ] Vista summary renderiza correctamente
- [ ] Auto-save funciona cada 30s
- [ ] Modal review muestra preview completo
- [ ] Toast confirmación se muestra
- [ ] Redirect funciona post-envío
- [ ] Navegación breadcrumbs OK
- [ ] Filtros tabs funcionan

---

## 🚫 NO MODIFICAR
- APIs evaluaciones existentes (solo consumir)
- Otros componentes evaluación

---

## 📝 NOTAS IMPORTANTES

**UI Design Standards:**
Para componentes visuales, seguir instrucciones en:
`.claude/docs/focalizahr-ui-design-standards.md`

**Toast Implementation:**
```typescript
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

toast({
  title: "Título",
  description: "Descripción",
  duration: 5000
})
```

---

## 🎯 SIGUIENTE BLOQUE
**BLOQUE-8: UI Admin** (competencias + config)

**Tiempo estimado:** 3 días  
**Dificultad:** Baja-Media (UX polish)
