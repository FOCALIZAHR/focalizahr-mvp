# BLOQUE-6: Dashboard 360°

## 📋 METADATA
- **Bloque:** 6 de 8
- **Dependencias:** ✅ BLOQUE-2, ✅ BLOQUE-3 completados
- **Archivos:** CREAR 3 componentes/páginas nuevas
- **Esfuerzo:** 2 días
- **Prioridad:** 🟡 MEDIA (UI visualización resultados)

## 🎯 OBJETIVO DEL BLOQUE
Crear dashboard UI consolidado 360° para visualizar resultados evaluaciones:
1. **Página lista evaluados** - Grid/tabla con scores y completeness
2. **Página detalle evaluado** - Resultados consolidados 360° con gráficos
3. **Reportes PDF empresariales** - Export consolidado para C-Suite

**UX Pattern:** Lattice Performance Dashboard, 15Five Reviews

---

## 📦 TAREAS INCLUIDAS

### T-PE-003-01: Dashboard Lista Evaluados

**Descripción:** Página principal con lista evaluados y stats básicas

**Archivo:** `src/app/dashboard/admin/performance-cycles/[id]/results/page.tsx`

**Features:**
- Grid/tabla evaluados con score + completeness
- Sorting por nombre/score
- Paginación client-side
- Click evaluado → detalle
- Stats globales (avg score, avg completeness)
- Filtros por departamento (opcional)

**Dependencias API:**
- GET `/api/admin/performance-cycles/[id]/results`

**UI Reference:**
- Usar design patterns de `/dashboard/onboarding/executive/page.tsx`
- Clases CSS: `.fhr-card`, `.fhr-title-gradient`, `.fhr-btn-primary`

---

### T-PE-003-02: Dashboard Detalle Evaluado

**Descripción:** Vista completa resultados 360° de un evaluado

**Archivo:** `src/app/dashboard/admin/performance-cycles/[id]/results/[evaluateeId]/page.tsx`

**Features:**
- Header con info evaluado + score general
- Sección scores por tipo evaluador (self, manager, peers, upward)
- Gráfico radar competencias (Recharts)
- Lista competencyScores con barras visuales
- Gap analysis (fortalezas + áreas desarrollo)
- Feedback cualitativo (anónimo, colapsable)
- Botón "Volver a Lista"

**Dependencias API:**
- GET `/api/admin/performance-cycles/[id]/results/[evaluateeId]`

**UI Reference:**
- Pattern similar a detalle onboarding
- Usar `recharts` para radar chart
- Clases CSS corporativas FocalizaHR

---

### T-PE-004-01: CompanyReportService

**Descripción:** Service para generar reportes PDF empresariales

**Archivo:** `src/lib/services/CompanyReportService.ts`

**Features:**
- Generar PDF ejecutivo consolidado
- Stats agregados por departamento
- Top performers identificados
- Areas mejora generales
- Recomendaciones accionables

**Tech:**
- Usar `jspdf` para generación PDF
- Incluir gráficos simples
- Diseño ejecutivo profesional

---

## ✅ VALIDACIÓN DEL BLOQUE

### Checklist UI:
- [ ] Página lista renderiza sin errores
- [ ] Página detalle renderiza sin errores
- [ ] Navegación lista ↔ detalle funciona
- [ ] Responsive design OK (320px+)
- [ ] Design system FocalizaHR respetado
- [ ] Gráficos Recharts cargan correctamente

### Testing Manual:
- Navegar a `/dashboard/admin/performance-cycles/test-id/results`
- Verificar lista evaluados se muestra
- Click en evaluado → debe navegar a detalle
- Verificar gráfico radar se renderiza
- Verificar scores visuales (barras)

---

## 🚫 NO MODIFICAR
- APIs del BLOQUE-3 (solo consumirlas)
- Services existentes (solo importar)
- Otras páginas dashboard

---

## 📝 NOTAS IMPORTANTES

**UI Design Standards:**
Para componentes visuales, seguir instrucciones en:
`.claude/docs/focalizahr-ui-design-standards.md`

**Clases CSS obligatorias:**
- `.fhr-card` - Cards con glassmorphism
- `.fhr-title-gradient` - Títulos con gradiente cyan/purple
- `.fhr-btn-primary` - Botones principales
- `.fhr-badge-success` / `.fhr-badge-warning` - Estados

**Recharts Configuration:**
```typescript
import { RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

// Usar colores FocalizaHR
<Radar dataKey="score" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.6} />
```

---

## 🎯 SIGUIENTE BLOQUE
**BLOQUE-7: Portal Jefe** (UI evaluadores)

**Tiempo estimado:** 2 días  
**Dificultad:** Media (UI con gráficos)
