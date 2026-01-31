# TAREA ADITIVA: Template Selector UX - Progressive Disclosure

## 📋 METADATA
- **Tipo:** Enhancement UI (Aditivo)
- **Dependencia:** ✅ BLOQUE-8 T-BC-001-01 completado
- **Archivos:** MODIFICAR 3 archivos existentes
- **Esfuerzo:** 1 día (8h)
- **Prioridad:** MEDIA (mejora UX sobre funcionalidad existente)

---

## 🎯 OBJETIVO

Mejorar la experiencia de usuario del Template Selector de competencias agregando **Progressive Disclosure** sobre la implementación básica creada en BLOQUE-8.

**NO rehacer desde cero** - Agregar features sobre código existente.

---

## 📊 CONTEXTO

### Estado Actual (Post BLOQUE-8):
```yaml
✅ Página funcional: /dashboard/admin/competencias
✅ Template selector básico operativo
✅ 3 templates disponibles
✅ Inicialización crea competencias

❌ UX Simple:
  - Solo muestra nombre + descripción
  - No hay breakdown por categoría
  - No muestra metodología (Lominger, etc.)
  - No muestra "Ideal para" (casos uso)
  - Usuario decide "a ciegas"
```

### Objetivo Final:
```yaml
✅ Progressive Disclosure implementado
✅ Cards expandibles/colapsables
✅ Metadata visible (metodología, casos uso, highlight)
✅ Breakdown por categoría (5 CORE + 4 LEADERSHIP + 3 STRATEGIC)
✅ Preview 4 competencias clave
✅ Single source of truth (backend controla metadata)
✅ Animaciones suaves (Framer Motion)
```

---

## 🔧 TAREAS ESPECÍFICAS

### TAREA 1: Expandir Backend Metadata (2h)

**Archivo:** `src/lib/constants/competencyTemplates.ts`

**Objetivo:** Agregar campos metadata a interface CompetencyTemplate

**Cambios exactos:**

```typescript
// BUSCAR interface CompetencyTemplate y AGREGAR 4 campos:

export interface CompetencyTemplate {
  id: string
  name: string
  description: string
  competencies: CompetencyTemplateItem[]
  
  // ══════════════════════════════════════════════════════════
  // ✅ AGREGAR ESTOS 4 CAMPOS:
  // ══════════════════════════════════════════════════════════
  methodology: string           // Ej: "Lominger + GPTW"
  methodologyIcon: string       // Ej: "Award" (nombre lucide-react icon)
  idealFor: string[]           // Lista casos uso ideales
  highlight: string            // Diferenciador clave del template
}
```

**Actualizar 3 templates existentes:**

```typescript
export const FOCALIZAHR_STANDARD_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-standard-v1',
  name: 'Modelo FocalizaHR Estándar',
  description: '...',
  
  // ✅ AGREGAR:
  methodology: 'Lominger + GPTW',
  methodologyIcon: 'Award',
  idealFor: [
    'Empresas tradicionales LATAM',
    'Cultura colaborativa enfocada',
    'Primera implementación de competencias'
  ],
  highlight: 'Equilibrio ideal entre rigor y simplicidad',
  
  competencies: [...]
}

export const FOCALIZAHR_LEADERSHIP_360_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-leadership-360-v1',
  name: 'Modelo Liderazgo 360°',
  description: '...',
  
  // ✅ AGREGAR:
  methodology: 'Lominger 360°',
  methodologyIcon: 'Users',
  idealFor: [
    'Evaluaciones 360° de líderes',
    'Desarrollo gerencial estructurado',
    'Organizaciones con múltiples niveles'
  ],
  highlight: 'Enfoque específico en habilidades de liderazgo',
  
  competencies: [...]
}

export const FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-high-perf-v1',
  name: 'Modelo High Performance',
  description: '...',
  
  // ✅ AGREGAR:
  methodology: 'Google Oxygen + Netflix',
  methodologyIcon: 'TrendingUp',
  idealFor: [
    'Culturas de alto rendimiento',
    'Startups y tech companies',
    'Organizaciones data-driven'
  ],
  highlight: 'Estándares de excelencia Silicon Valley',
  
  competencies: [...]
}
```

**Actualizar helper `listAvailableTemplates()`:**

```typescript
// BUSCAR función listAvailableTemplates() y MODIFICAR return type:

export function listAvailableTemplates(): Array<{
  id: string
  name: string
  description: string
  competencyCount: number
  categories: string[]
  // ✅ AGREGAR estos campos:
  methodology: string
  methodologyIcon: string
  idealFor: string[]
  highlight: string
}> {
  return Object.entries(COMPETENCY_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    competencyCount: template.competencies.length,
    categories: [...new Set(template.competencies.map(c => c.category))],
    // ✅ AGREGAR:
    methodology: template.methodology,
    methodologyIcon: template.methodologyIcon,
    idealFor: template.idealFor,
    highlight: template.highlight
  }))
}
```

**Validación:**
```bash
# Compilar sin errores TypeScript
npm run build

# Verificar que 3 templates tienen metadata
# Verificar que listAvailableTemplates() incluye nuevos campos
```

---

### TAREA 2: Actualizar API Templates (1h)

**Archivo:** `src/app/api/admin/competencies/templates/route.ts`

**Objetivo:** API retorna metadata en response

**Cambios:**

```typescript
// BUSCAR donde se enriquecen templates y MODIFICAR:

// ANTES (probablemente línea ~50-65):
const templatesWithDetails = templates.map(template => ({
  ...template,
  byCategory: countByCategory(template.id),
  preview: COMPETENCY_TEMPLATES[template.id]?.competencies.slice(0, 3).map(c => ({
    code: c.code,
    name: c.name,
    category: c.category
  }))
}))

// DESPUÉS:
const templatesWithDetails = templates.map(template => ({
  ...template,
  byCategory: countByCategory(template.id),
  preview: COMPETENCY_TEMPLATES[template.id]?.competencies.slice(0, 4).map(c => ({  // ✅ 3 → 4
    code: c.code,
    name: c.name,
    category: c.category
  }))
}))
```

**Validación:**
```bash
# Testing API con Thunder Client o curl:
curl http://localhost:3000/api/admin/competencies/templates

# Verificar response incluye:
# - methodology
# - methodologyIcon
# - idealFor
# - highlight
# - preview con 4 competencias (no 3)
```

---

### TAREA 3: Actualizar Frontend Progressive Disclosure (5h)

**Archivo:** `src/app/dashboard/admin/competencias/page.tsx`

**Objetivo:** Agregar Progressive Disclosure sobre implementación básica existente

**Paso 3.1: Actualizar interface Template (5 min)**

```typescript
// BUSCAR interface Template y AGREGAR campos:

interface Template {
  id: string
  name: string
  description: string
  competencyCount: number
  categories: string[]
  byCategory: Record<string, number>
  preview: Array<{ code: string; name: string; category: string }>
  // ✅ AGREGAR:
  methodology: string
  methodologyIcon: string
  idealFor: string[]
  highlight: string
}
```

**Paso 3.2: Eliminar hardcode TEMPLATE_METADATA (10 min)**

```typescript
// ❌ BUSCAR Y ELIMINAR completamente este bloque si existe:

const TEMPLATE_METADATA: Record<string, {
  methodology: string
  methodologyIcon: typeof Award
  idealFor: string[]
  highlight: string
}> = {
  'focalizahr-standard-v1': { ... },
  'focalizahr-leadership-360-v1': { ... },
  'focalizahr-high-perf-v1': { ... }
}
```

**Paso 3.3: Agregar ICON_MAP (10 min)**

```typescript
// AGREGAR después de imports de lucide-react:

// ════════════════════════════════════════════════════════════
// ICON MAPPING - Mapeo de strings a componentes
// ════════════════════════════════════════════════════════════
const ICON_MAP: Record<string, any> = {
  Award,
  Users,
  TrendingUp,
  Brain
}
```

**Paso 3.4: Agregar state expandible (10 min)**

```typescript
// BUSCAR donde están los otros useState y AGREGAR:

const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
```

**Paso 3.5: Actualizar render de cards (4h)**

```typescript
// BUSCAR el .map de templates (probablemente dentro del grid) y MODIFICAR:

{templates.map(template => {
  const isExpanded = expandedTemplate === template.id
  const isLoading = actionLoading === template.id
  const MethodologyIcon = ICON_MAP[template.methodologyIcon] || Award  // ✅ Mapear icono
  
  return (
    <motion.div
      key={template.id}
      layout
      className="fhr-card overflow-hidden hover:border-cyan-500/50 transition-all"
    >
      {/* ══════════════════════════════════════════════════════════════
          HEADER - Siempre visible
      ══════════════════════════════════════════════════════════════ */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-200 mb-1">
                  {template.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="fhr-badge fhr-badge-active text-xs">
                    {template.competencyCount} competencias
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs text-purple-400">
                    <MethodologyIcon className="w-3.5 h-3.5" />
                    {template.methodology}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-3">
              {template.description}
            </p>

            {/* Highlight badge - solo si NO expandido */}
            {!isExpanded && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                {template.highlight}
              </div>
            )}
          </div>

          {/* Right side - Toggle button */}
          <button
            onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CONTENIDO EXPANDIDO - Progressive Disclosure
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6"
          >
            <div className="space-y-6 pt-6 border-t border-slate-700/50">
              
              {/* 1. Breakdown por categoría */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Distribución por nivel
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const count = template.byCategory[key] || 0
                    if (count === 0) return null
                    
                    const Icon = config.icon
                    return (
                      <div key={key} className={`p-3 rounded-lg ${config.color}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{config.label}</span>
                        </div>
                        <p className="text-2xl font-semibold">{count}</p>
                        <p className="text-xs opacity-80 mt-1">{config.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2. Preview competencias (4 ejemplos) */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Ejemplos de competencias incluidas
                </h4>
                <div className="space-y-2">
                  {template.preview.slice(0, 4).map(comp => {
                    const catConfig = CATEGORY_CONFIG[comp.category]
                    const Icon = catConfig.icon
                    return (
                      <div key={comp.code} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                        <div className={`w-8 h-8 rounded ${catConfig.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">{comp.name}</p>
                          <p className="text-xs text-slate-500">{catConfig.label}</p>
                        </div>
                      </div>
                    )
                  })}
                  {template.competencyCount > 4 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      + {template.competencyCount - 4} competencias más
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Ideal para */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  Ideal para
                </h4>
                <ul className="space-y-2">
                  {template.idealFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                      <ChevronRight className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. CTA principal grande */}
              <div className="pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => handleInitializeTemplate(template.id)}
                  disabled={isLoading || hasCompetencies}
                  className="fhr-btn-primary w-full justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inicializando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Seleccionar este modelo
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          QUICK ACTIONS - Estado colapsado
      ══════════════════════════════════════════════════════════════ */}
      {!isExpanded && (
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => setExpandedTemplate(template.id)}
            className="fhr-btn-secondary flex-1"
          >
            Ver detalles
          </button>
          <button
            onClick={() => handleInitializeTemplate(template.id)}
            disabled={isLoading || hasCompetencies}
            className="fhr-btn-primary flex-1"
          >
            {isLoading ? 'Inicializando...' : 'Seleccionar'}
          </button>
        </div>
      )}
    </motion.div>
  )
})}
```

**Paso 3.6: Agregar CATEGORY_CONFIG si no existe (15 min)**

```typescript
// AGREGAR si no existe (probablemente cerca de los otros const):

const CATEGORY_CONFIG: Record<string, {
  label: string
  color: string
  icon: any
  description: string
}> = {
  CORE: {
    label: 'CORE',
    color: 'bg-blue-500/10 text-blue-400',
    icon: Users,
    description: 'Todos los colaboradores'
  },
  LEADERSHIP: {
    label: 'LEADERSHIP',
    color: 'bg-purple-500/10 text-purple-400',
    icon: TrendingUp,
    description: 'Managers+'
  },
  STRATEGIC: {
    label: 'STRATEGIC',
    color: 'bg-cyan-500/10 text-cyan-400',
    icon: Target,
    description: 'Ejecutivos'
  },
  TECHNICAL: {
    label: 'TECHNICAL',
    color: 'bg-emerald-500/10 text-emerald-400',
    icon: Brain,
    description: 'Por área'
  }
}
```

**Validación:**
```bash
# Compilar sin errores
npm run build

# Testing navegador:
npm run dev

# Ir a: http://localhost:3000/dashboard/admin/competencias
# Seleccionar empresa sin competencias

# Verificar:
# ✓ Cards muestran badges metodología (Award/Users/TrendingUp icons)
# ✓ Highlight visible en estado colapsado
# ✓ Click "Ver detalles" expande suavemente
# ✓ Breakdown por categoría visible con iconos + colores
# ✓ Preview 4 competencias visible con categorías
# ✓ Lista "Ideal para" visible
# ✓ Botón "Seleccionar este modelo" funciona
# ✓ Animaciones smooth (300ms)
# ✓ Responsive mobile/desktop
```

---

## ✅ VALIDACIÓN TAREA COMPLETA

### Checklist Backend:
- [ ] Interface CompetencyTemplate tiene 4 campos nuevos
- [ ] 3 templates tienen metadata completa
- [ ] listAvailableTemplates() retorna metadata
- [ ] Compila sin errores TypeScript

### Checklist API:
- [ ] GET /api/admin/competencies/templates retorna metadata
- [ ] Response incluye: methodology, idealFor, highlight, methodologyIcon
- [ ] Preview tiene 4 competencias (no 3)

### Checklist Frontend:
- [ ] Interface Template actualizada
- [ ] TEMPLATE_METADATA hardcodeado eliminado
- [ ] ICON_MAP implementado
- [ ] State expandedTemplate agregado
- [ ] Cards son expandibles/colapsables
- [ ] Animaciones AnimatePresence funcionan
- [ ] Badges metodología visibles
- [ ] Breakdown categoría visible expandido
- [ ] Preview 4 competencias visible expandido
- [ ] Lista "Ideal para" visible expandido
- [ ] Mobile responsive
- [ ] NO hay errores consola

### Testing E2E:
```bash
# 1. Seleccionar empresa sin competencias
# 2. Ver 3 templates con badges metodología
# 3. Click "Ver detalles" → Expande suavemente
# 4. Verificar contenido expandido completo
# 5. Click icono colapsar → Colapsa suavemente
# 6. Click "Seleccionar" → Crea competencias
# 7. Verificar inicialización exitosa
```

---

## 🎯 CRITERIO DE COMPLETADO

✅ Esta tarea está completada cuando:
- Backend tiene metadata en 3 templates
- API retorna metadata
- Frontend consume metadata dinámicamente (no hardcode)
- Progressive Disclosure funciona (expand/collapse)
- Animaciones smooth implementadas
- Testing E2E exitoso
- NO hay errores TypeScript/compilación
- Mobile responsive verificado

**Tiempo esperado:** 8 horas (1 día)

---

## 📚 ARCHIVOS DE REFERENCIA

Los siguientes archivos contienen el código completo implementado:

```
/mnt/user-data/outputs/
├── competencyTemplates_expanded.ts    (Backend completo)
├── templates_route_updated.ts         (API completa)
├── page_improved.tsx                  (Frontend completo)
├── IMPLEMENTACION_OPCION_B.md         (Guía detallada)
└── PROMPT_ADITIVO_UX_TEMPLATE_SELECTOR.md  (Prompt para Code)
```

Estos archivos pueden usarse como referencia o copiarse directamente según prefieras.

---

## 🎉 RESULTADO FINAL

Al completar esta tarea aditiva, el Template Selector tendrá:

✅ **Experiencia Premium:**
- Usuario entiende diferencias entre templates
- Decisión informada con contexto completo
- Progressive Disclosure implementado
- Animaciones smooth profesionales

✅ **Arquitectura Enterprise:**
- Backend controla metadata (single source of truth)
- Frontend consume dinámicamente (no hardcode)
- Escalable: Nuevos templates se auto-integran

✅ **Filosofía FocalizaHR:**
- Glassmorphism effects
- Gradientes corporativos cyan/purple
- Design system consistente
- Mobile-first responsive

**Módulo Performance Evaluation UX completado al 100%** 🚀
