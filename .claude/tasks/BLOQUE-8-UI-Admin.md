# BLOQUE-8: UI Admin

## 📋 METADATA
- **Bloque:** 8 de 8 (FINAL)
- **Dependencias:** ✅ BLOQUE-1, ✅ BLOQUE-5 completados
- **Archivos:** CREAR 7 páginas/componentes UI
- **Esfuerzo:** 7 días
- **Tipo:** Frontend UI

---

## 🎯 OBJETIVO DEL BLOQUE

Completar interfaces admin del módulo Performance:
1. **UI Competencias** - Selector templates + editor library
2. **Landing Reportes** - Acceso anónimo reportes individuales
3. **Admin Tracking** - Dashboard métricas entrega reportes
4. **Admin Config** - Configuración reportes por empresa
5. **Dashboard Drill-Down** - Vista jerárquica performance

**⚠️ IMPORTANTE:** Todos los componentes visuales deben seguir:
`.claude/docs/focalizahr-ui-design-standards.md`

---

## 📦 TAREAS INCLUIDAS

### T-BC-001-01: UI Selector Templates Competencias

**Archivo:** `src/app/dashboard/admin/competencias/page.tsx` (CREAR)

**Features:**
- Primera vez: Wizard selector templates (FOCALIZAHR_STANDARD, LEADERSHIP_360, HIGH_PERFORMANCE)
- Ya inicializado: Lista competencias con CRUD
- Preview template antes de inicializar
- Validación: No reinicialización permitida

**API:**
```typescript
GET /api/admin/competencies/templates
POST /api/admin/competencies/initialize
```

**UI Pattern:** 3-column grid con cards templates, modal preview

---

### T-BC-002-01: Library Manager Mejorado

**Archivo:** `src/app/dashboard/admin/competencias/library/page.tsx` (CREAR)

**Features:**
- Lista competencias por categoría (tabs)
- Agregar/editar/eliminar custom
- Drag & drop reordenar (opcional)
- Search box filtro

**API:**
```typescript
GET /api/admin/competencies
POST /api/admin/competencies (crear custom)
PUT /api/admin/competencies/[id]
DELETE /api/admin/competencies/[id]
```

---

### T-PC-002-01: Landing /report/[token]

**Archivo:** `src/app/report/[token]/page.tsx` (CREAR)

**Features:**
- Acceso anónimo (no requiere login)
- Validar token + expiración
- Renderizar HTML reporte
- Botón "Confirmar Recepción"
- Mensaje si expirado

**API:**
```typescript
GET /api/reports/[token]
POST /api/reports/[token]/confirm
```

---

### T-PC-003-01: Sistema Confirmación

**Archivo:** `src/app/report/[token]/confirm/page.tsx` (CREAR)

**Features:**
- Confirmar recepción reporte
- Actualizar `FeedbackDeliveryConfirmation`
- Mensaje éxito + instrucciones contacto RRHH

**API:**
```typescript
POST /api/reports/[token]/confirm
```

---

### T-PC-005-01: Admin Config Reportes

**Archivo:** `src/app/dashboard/admin/settings/reports/page.tsx` (CREAR)

**Features:**
- Form configuración:
  - `reportDeliveryDelayDays` (slider 1-30)
  - `reportLinkExpirationDays` (slider 7-90)
  - `enableEmployeeReports` (toggle)
- Preview impacto configuración
- Guardar cambios

**API:**
```typescript
GET /api/admin/accounts/settings
PUT /api/admin/accounts/settings
```

---

### T-PC-006-01: Dashboard Tracking Métricas

**Archivo:** `src/app/dashboard/admin/performance-cycles/[id]/tracking/page.tsx` (CREAR)

**Features:**
- Métricas entrega reportes:
  - % confirmados on-time
  - % no confirmados
  - Timeline confirmaciones
- Lista evaluados con estado confirmación
- Filtros (confirmados/pendientes/expirados)

**API:**
```typescript
GET /api/admin/performance-cycles/[id]/delivery-tracking
```

---

### T-GC-001-01: Dashboard Drill-Down

**Archivo:** `src/app/dashboard/admin/performance-cycles/[id]/drill-down/page.tsx` (CREAR)

**Features:**
- Vista jerárquica: Empresa → Gerencia → Departamento → Individuo
- Filters: Por área, por score range
- Cards agregados con drill-down click
- Breadcrumbs navegación

**API:**
```typescript
GET /api/admin/performance-cycles/[id]/hierarchy-stats
```

---

## ✅ VALIDACIÓN BLOQUE COMPLETO

### Checklist General:

- [ ] Todas las 7 páginas compilan sin errores TypeScript
- [ ] Design system FocalizaHR aplicado consistentemente
- [ ] Responsive design funciona (320px - 1920px+)
- [ ] Navegación entre páginas fluida
- [ ] Loading states implementados
- [ ] Error handling presente en todos los forms
- [ ] Toasts/notificaciones funcionan

### Testing Manual:

```bash
# Navegar a cada página y verificar:
http://localhost:3000/dashboard/admin/competencias
http://localhost:3000/dashboard/admin/competencias/library
http://localhost:3000/report/test-token
http://localhost:3000/dashboard/admin/settings/reports
http://localhost:3000/dashboard/admin/performance-cycles/test-id/tracking
http://localhost:3000/dashboard/admin/performance-cycles/test-id/drill-down
```

### Checklist Visual:

- [ ] Clases `.fhr-card` aplicadas a cards
- [ ] Títulos usan `.fhr-title-gradient`
- [ ] Botones primarios usan `.fhr-btn-primary`
- [ ] Badges usan `.fhr-badge-*` apropiados
- [ ] Gradientes corporativos cyan/purple presentes
- [ ] Spacing consistente (Tailwind utilities)

---

## 🚫 NO MODIFICAR

- APIs del BLOQUE-3 (solo consumir)
- Services del BLOQUE-2, BLOQUE-4 (solo importar)
- Sistema emails BLOQUE-5 (solo referenciar)
- Design system base (solo aplicar clases existentes)

---

## 📝 NOTAS IMPORTANTES

### UI Design Standards:

**OBLIGATORIO:** Para todos los componentes visuales de este bloque, seguir las instrucciones en:
`.claude/docs/focalizahr-ui-design-standards.md`

### Clases CSS FocalizaHR:

```css
/* Cards */
.fhr-card { /* Glassmorphism effect */ }
.fhr-card-metric { /* Cards métricas dashboard */ }

/* Typography */
.fhr-title-gradient { /* Títulos principales */ }

/* Buttons */
.fhr-btn-primary { /* Cyan gradient */ }
.fhr-btn-secondary { /* Outline style */ }

/* Badges */
.fhr-badge-success { /* Verde */ }
.fhr-badge-active { /* Cyan */ }
.fhr-badge-warning { /* Amarillo */ }
.fhr-badge-error { /* Rojo */ }

/* Backgrounds */
.fhr-bg-main { /* Fondo dashboard */ }
```

### Responsive Breakpoints:

```typescript
// Tailwind breakpoints
sm: 640px  // Mobile landscape
md: 768px  // Tablet
lg: 1024px // Desktop
xl: 1280px // Large desktop
2xl: 1536px // Extra large
```

### Pattern Components:

```typescript
// Loading State
import { LoadingSpinner } from '@/components/ui/loading'

// Empty State
import { EmptyState } from '@/components/ui/empty-state'

// Toast Notifications
import { useToast } from '@/hooks/use-toast'
const { toast } = useToast()
```

---

## 🎯 CRITERIO DE COMPLETADO

✅ Este bloque está completado cuando:
- 7 páginas/componentes creados y funcionales
- Design system aplicado consistentemente
- Navegación entre páginas fluida
- Testing manual exitoso en todas las rutas
- Responsive design verificado
- NO hay errores TypeScript/compilación

**Tiempo esperado:** 5-7 días (UI complejo + integración)

---

## 🎉 COMPLETADO MÓDULO PERFORMANCE 360°

Al finalizar este bloque, el módulo Performance Evaluation 360° estará **100% completo** y listo para producción.

**Features completadas:**
- ✅ Schema changes (BLOQUE-1)
- ✅ Services consolidación (BLOQUE-2)
- ✅ APIs REST (BLOQUE-3)
- ✅ Reportes individuales (BLOQUE-4)
- ✅ Email automation (BLOQUE-5)
- ✅ Dashboard 360° (BLOQUE-6)
- ✅ Portal Jefe (BLOQUE-7)
- ✅ UI Admin completa (BLOQUE-8)

**Próximos pasos post-implementación:**
1. Testing QA comprehensivo
2. Load testing con data real
3. Deploy a staging
4. User acceptance testing
5. Deploy a producción
