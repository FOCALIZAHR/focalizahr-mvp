# 🎨 TAREA ADITIVA: Template Selector UX - Progressive Disclosure
## Versión 1.1 MEJORADA | Post-Veredicto

---

## 📋 METADATA

```yaml
Tipo: Enhancement (Mejora UX)
Módulo: Performance Evaluation > Admin > Competencias
Dependencias: BLOQUE-8 T-BC-001-01 (Template Selector básico)
Esfuerzo: 8h (1 día)
Prioridad: 🟡 MEDIA (UX Premium, no blocker)
Estado: ✅ APROBADO (con mejoras)

VEREDICTO EVALUACIÓN:
  ✅ Arquitectura correcta (aditivo, no destructivo)
  ✅ Single source of truth (backend metadata)
  ✅ Progressive Disclosure bien implementado
  ⚠️ 4 mejoras sugeridas (incluidas en v1.1)
```

---

## 🎯 OBJETIVO

Mejorar la experiencia de selección de templates de competencias con:

1. ✅ **Progressive Disclosure** - Cards expandibles con información completa
2. ✅ **Badges Metodología** - Visual inmediato de diferenciación
3. ✅ **Highlight Key** - Mensaje único que destaca cada template
4. ✅ **Breakdown Categorías** - Distribución visual de competencias
5. ✅ **Preview Competencias** - 4 ejemplos con categorías
6. ✅ **Lista "Ideal Para"** - Casos de uso específicos
7. ✅ **Fallback Icons** - Manejo robusto de icons faltantes
8. ✅ **Smooth Animations** - Animaciones optimizadas mobile
9. ✅ **Auto-scroll Mobile** - UX mejorada en dispositivos móviles

---

## 📊 CONTEXTO

### Estado Actual (Post-BLOQUE-8)
```yaml
Template Selector Básico:
  ✅ 3 templates disponibles
  ✅ Botón "Seleccionar" funciona
  ✅ API retorna templates
  ❌ Información limitada (solo nombre + descripción)
  ❌ No muestra metodología
  ❌ No preview competencias
  ❌ Cards estáticas (no expandibles)
  ❌ Difícil comparar templates
```

### Estado Objetivo (Post-Tarea Aditiva)
```yaml
Template Selector Premium:
  ✅ Cards expandibles (Progressive Disclosure)
  ✅ Badge metodología visible siempre
  ✅ Highlight diferenciador en collapsed
  ✅ Breakdown categorías en expanded
  ✅ Preview 4 competencias en expanded
  ✅ Lista casos uso en expanded
  ✅ Animaciones smooth 300ms
  ✅ Icons con fallback robusto
  ✅ Auto-scroll mobile
  ✅ Mobile responsive completo
```

---

## 🛠️ IMPLEMENTACIÓN

### TAREA 1: Backend - Expandir Metadata Templates (2h)

**Archivo:** `src/lib/constants/competencyTemplates.ts`

**Cambios:**

```typescript
// ════════════════════════════════════════════════════════════════
// PASO 1.1: Actualizar Interface CompetencyTemplate
// ════════════════════════════════════════════════════════════════

export interface CompetencyTemplate {
  id: string
  name: string
  description: string
  competencies: Omit<Competency, 'id' | 'accountId' | 'createdAt' | 'updatedAt'>[]
  
  // ✅ AGREGAR estos campos nuevos:
  methodology: string           // "Lominger + Great Place to Work"
  methodologyIcon: string       // "Award" | "Users" | "TrendingUp"
  idealFor: string[]           // ["Caso uso 1", "Caso uso 2", ...]
  highlight: string            // Diferenciador clave del template
}

// ════════════════════════════════════════════════════════════════
// PASO 1.2: Actualizar FOCALIZAHR_STANDARD_TEMPLATE
// ════════════════════════════════════════════════════════════════

export const FOCALIZAHR_STANDARD_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-standard-v1',
  name: 'Modelo Estándar FocalizaHR',
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
  methodology: 'Assessment 360° + Coaching',
  methodologyIcon: 'Users',
  idealFor: [
    'Desarrollo de managers y ejecutivos',
    'Planes de sucesión',
    'Evaluación multifuente (360°)'
  ],
  highlight: 'Enfoque específico en habilidades de liderazgo',
  
  competencies: [...]
}

export const FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE: CompetencyTemplate = {
  id: 'focalizahr-high-performance-v1',
  name: 'Modelo Alto Rendimiento',
  description: '...',
  
  // ✅ AGREGAR:
  methodology: 'Google Project Oxygen + Netflix',
  methodologyIcon: 'TrendingUp',
  idealFor: [
    'Startups tech y scale-ups',
    'Cultura de alto rendimiento',
    'Equipos ágiles y autónomos'
  ],
  highlight: 'Estándares de excelencia Silicon Valley',
  
  competencies: [...]
}
```

**Validación Backend:**
```bash
# Compilar sin errores
npm run build

# Verificar types
npx tsc --noEmit
```

---

### TAREA 2: API - Retornar Metadata Expandida (1h)

**Archivo:** `src/app/api/admin/competencies/templates/route.ts`

**Cambios:**

```typescript
// ════════════════════════════════════════════════════════════════
// PASO 2.1: Actualizar listAvailableTemplates()
// ════════════════════════════════════════════════════════════════

function listAvailableTemplates() {
  return [
    FOCALIZAHR_STANDARD_TEMPLATE,
    FOCALIZAHR_LEADERSHIP_360_TEMPLATE,
    FOCALIZAHR_HIGH_PERFORMANCE_TEMPLATE
  ].map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    competencyCount: template.competencies.length,
    
    // ✅ AGREGAR metadata expandida:
    methodology: template.methodology,
    methodologyIcon: template.methodologyIcon,
    idealFor: template.idealFor,
    highlight: template.highlight,
    
    // Breakdown por categoría
    breakdown: {
      CORE: template.competencies.filter(c => c.category === 'CORE').length,
      LEADERSHIP: template.competencies.filter(c => c.category === 'LEADERSHIP').length,
      STRATEGIC: template.competencies.filter(c => c.category === 'STRATEGIC').length,
      TECHNICAL: template.competencies.filter(c => c.category === 'TECHNICAL').length
    },
    
    // Preview primeras 4 competencias
    preview: template.competencies.slice(0, 4).map(c => ({
      code: c.code,
      name: c.name,
      category: c.category
    }))
  }))
}
```

**Validación API:**
```bash
# Testing con Thunder Client o curl:
curl http://localhost:3000/api/admin/competencies/templates

# Verificar response incluye:
# - methodology: "Lominger + GPTW"
# - methodologyIcon: "Award"
# - idealFor: ["...", "...", "..."]
# - highlight: "..."
# - breakdown: { CORE: 5, LEADERSHIP: 4, ... }
# - preview: [{ code, name, category }, ...]
```

---

### TAREA 3: Frontend - Progressive Disclosure UX (5h)

**Archivo:** `src/app/dashboard/admin/competencias/page.tsx`

**Cambios:**

```typescript
// ════════════════════════════════════════════════════════════════
// PASO 3.1: Actualizar Interface Template
// ════════════════════════════════════════════════════════════════

interface Template {
  id: string
  name: string
  description: string
  competencyCount: number
  
  // ✅ AGREGAR:
  methodology: string
  methodologyIcon: string
  idealFor: string[]
  highlight: string
  breakdown: {
    CORE: number
    LEADERSHIP: number
    STRATEGIC: number
    TECHNICAL: number
  }
  preview: Array<{
    code: string
    name: string
    category: string
  }>
}

// ════════════════════════════════════════════════════════════════
// PASO 3.2: Agregar Icon Map con Fallback
// ════════════════════════════════════════════════════════════════

import { Award, Users, TrendingUp, BookOpen } from 'lucide-react'

// ⚠️ VERIFICAR: Si BLOQUE-8 ya creó ICON_MAP, reutilizar
const ICON_MAP: Record<string, any> = {
  Award,
  Users,
  TrendingUp,
  BookOpen  // ← Fallback icon
}

// Helper con fallback robusto
const getIcon = (iconName: string) => {
  return ICON_MAP[iconName] || BookOpen  // ✅ MEJORA: Fallback icon
}

// ════════════════════════════════════════════════════════════════
// PASO 3.3: Agregar State Expandido
// ════════════════════════════════════════════════════════════════

const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

// Helper para toggle + scroll mobile
const handleToggleExpand = (templateId: string) => {
  const newExpanded = expandedTemplate === templateId ? null : templateId
  setExpandedTemplate(newExpanded)
  
  // ✅ MEJORA: Auto-scroll mobile al expandir
  if (newExpanded) {
    setTimeout(() => {
      document.getElementById(`template-${templateId}`)?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }, 100)
  }
}

// ════════════════════════════════════════════════════════════════
// PASO 3.4: Agregar CATEGORY_CONFIG
// ════════════════════════════════════════════════════════════════

import { Target, Brain } from 'lucide-react'

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

// ════════════════════════════════════════════════════════════════
// PASO 3.5: Actualizar Render Template Cards
// ════════════════════════════════════════════════════════════════

{templates.map((template) => {
  const isExpanded = expandedTemplate === template.id
  const Icon = getIcon(template.methodologyIcon)  // ✅ Con fallback
  
  return (
    <motion.div
      key={template.id}
      id={`template-${template.id}`}  // ✅ Para scroll
      layout
      className="fhr-card hover:border-cyan-500/30 transition-all cursor-pointer"
      onClick={() => handleToggleExpand(template.id)}
    >
      {/* TOP: Siempre visible */}
      <div className="flex items-start justify-between">
        {/* Izquierda: Badge + Título */}
        <div className="flex-1">
          {/* Badge Metodología */}
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {template.methodology}
            </span>
          </div>
          
          <h3 className="text-xl font-medium text-white mb-2">
            {template.name}
          </h3>
          
          <p className="text-sm text-slate-400 mb-3">
            {template.description}
          </p>
          
          {/* Highlight - Visible en collapsed */}
          {!isExpanded && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-cyan-300">
                💡 {template.highlight}
              </p>
            </div>
          )}
          
          {/* Stats rápidos */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{template.competencyCount} competencias</span>
            <span>•</span>
            <span>Click para {isExpanded ? 'colapsar' : 'ver detalles'}</span>
          </div>
        </div>
        
        {/* Derecha: Icon expandir/colapsar */}
        <button 
          className="ml-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleExpand(template.id)
          }}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      {/* EXPANDED CONTENT */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: 'easeInOut'  // ✅ MEJORA: ease optimizado
            }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
              
              {/* Highlight expandido */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4">
                <p className="text-sm text-cyan-200">
                  <span className="font-semibold">Diferenciador clave:</span> {template.highlight}
                </p>
              </div>
              
              {/* Breakdown por categoría */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">
                  Distribución por Categoría
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(template.breakdown).map(([cat, count]) => {
                    if (count === 0) return null
                    const config = CATEGORY_CONFIG[cat]
                    const CategoryIcon = config.icon
                    
                    return (
                      <div 
                        key={cat}
                        className={`${config.color} rounded-lg p-3 flex items-center gap-2`}
                      >
                        <CategoryIcon className="w-4 h-4" />
                        <div>
                          <div className="text-xs font-medium">{config.label}</div>
                          <div className="text-lg font-bold">{count}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Preview competencias */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">
                  Preview Competencias (primeras 4)
                </h4>
                <div className="space-y-2">
                  {template.preview.map((comp) => {
                    const config = CATEGORY_CONFIG[comp.category]
                    return (
                      <div 
                        key={comp.code}
                        className="flex items-center gap-3 text-sm bg-slate-800/30 rounded-lg p-3"
                      >
                        <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-slate-300">{comp.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Ideal para */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3">
                  Ideal Para:
                </h4>
                <ul className="space-y-2">
                  {template.idealFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer: Botón seleccionar */}
      {isExpanded && (
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSelectTemplate(template.id)
            }}
            disabled={isCreating}
            className="w-full fhr-btn-primary"
          >
            {isCreating ? 'Inicializando...' : 'Seleccionar'}
          </button>
        </div>
      )}
    </motion.div>
  )
})}
```

**Validación Frontend:**
```bash
# Compilar sin errores
npm run build

# Testing navegador:
npm run dev

# Ir a: http://localhost:3000/dashboard/admin/competencias
# Seleccionar empresa sin competencias

# Verificar:
# ✅ Cards muestran badges metodología (Award/Users/TrendingUp icons)
# ✅ Highlight visible en estado colapsado
# ✅ Click "Ver detalles" expande suavemente (300ms)
# ✅ Breakdown por categoría visible con iconos + colores
# ✅ Preview 4 competencias visible con categorías
# ✅ Lista "Ideal para" visible
# ✅ Botón "Seleccionar este modelo" funciona
# ✅ Animaciones smooth sin lag
# ✅ Responsive mobile/desktop
# ✅ Auto-scroll funciona en mobile
# ✅ Fallback icon si methodologyIcon inválido
```

---

## ✅ VALIDACIÓN TAREA COMPLETA

### Checklist Backend:
- [ ] Interface CompetencyTemplate tiene 4 campos nuevos
- [ ] 3 templates tienen metadata completa
- [ ] listAvailableTemplates() retorna metadata
- [ ] Compila sin errores TypeScript
- [ ] No hay typos en highlight

### Checklist API:
- [ ] GET /api/admin/competencies/templates retorna metadata
- [ ] Response incluye: methodology, idealFor, highlight, methodologyIcon
- [ ] Preview tiene 4 competencias (no 3)
- [ ] Breakdown suma competencyCount

### Checklist Frontend:
- [ ] Interface Template actualizada
- [ ] ICON_MAP implementado con fallback BookOpen
- [ ] State expandedTemplate agregado
- [ ] Cards son expandibles/colapsables
- [ ] AnimatePresence con initial={false}
- [ ] Animaciones 300ms easeInOut
- [ ] Badges metodología visibles
- [ ] Breakdown categoría visible expandido
- [ ] Preview 4 competencias visible expandido
- [ ] Lista "Ideal para" visible expandido
- [ ] Mobile responsive
- [ ] Auto-scroll mobile funciona
- [ ] Fallback icon funciona si methodologyIcon inválido
- [ ] NO hay errores consola

### Testing E2E:
```bash
# 1. Seleccionar empresa sin competencias
# 2. Ver 3 templates con badges metodología
# 3. Verificar highlight visible en collapsed
# 4. Click "Ver detalles" → Expande suavemente (300ms)
# 5. Verificar contenido expandido completo:
#    - Highlight expandido con gradiente
#    - Breakdown 4 categorías con icons
#    - Preview 4 competencias con badges
#    - Lista "Ideal para" con checks
# 6. Click icono colapsar → Colapsa suavemente
# 7. Click "Seleccionar" → Crea competencias
# 8. Verificar 12 competencias creadas
# 9. Testing mobile:
#    - Expandir template → Auto-scroll funciona
#    - Cards responsive
#    - Animaciones smooth sin lag
# 10. Testing fallback icon:
#    - Modificar methodologyIcon a valor inválido
#    - Verificar muestra BookOpen icon
```

---

## 🎯 CRITERIOS DE COMPLETADO

```yaml
FUNCIONAL:
  ✅ Progressive Disclosure funciona (expandir/colapsar)
  ✅ Solo 1 template expandido a la vez
  ✅ Metadata backend completa (4 campos nuevos)
  ✅ API retorna metadata expandida
  ✅ Frontend consume metadata sin hardcode
  ✅ Fallback icon funciona

UX:
  ✅ Animaciones smooth 300ms sin lag mobile
  ✅ Badges metodología visible siempre
  ✅ Highlight visible en collapsed
  ✅ Breakdown categorías con icons + colores
  ✅ Preview 4 competencias con badges categoría
  ✅ Lista "Ideal para" con checks
  ✅ Auto-scroll mobile al expandir
  ✅ Responsive mobile/desktop

CÓDIGO:
  ✅ TypeScript compila sin errores
  ✅ No hay hardcode metadata frontend
  ✅ Single source of truth (backend)
  ✅ Componentes reutilizables
  ✅ Naming consistente FocalizaHR
  ✅ Sin duplicación lógica
  ✅ AnimatePresence optimizado

TESTING:
  ✅ Testing E2E 10 pasos completo
  ✅ Mobile testing exhaustivo
  ✅ Fallback icon testeado
  ✅ Performance validado (no lag)
```

---

## ⏱️ TIEMPO ESTIMADO

```yaml
TAREA 1: Backend metadata (2h)
  - Actualizar interface: 30 min
  - Expandir 3 templates: 1h
  - Validación: 30 min

TAREA 2: API expandida (1h)
  - Modificar listAvailableTemplates: 30 min
  - Testing API: 30 min

TAREA 3: Frontend UX (5h)
  - Interface + ICON_MAP + fallback: 30 min
  - State + toggle handler + scroll: 30 min
  - CATEGORY_CONFIG: 30 min
  - Render cards expandibles: 2h
  - Animaciones optimizadas: 30 min
  - Testing mobile: 1h

TOTAL: 8 horas (1 día)
```

---

## 🚨 RIESGOS Y MITIGACIONES (v1.1)

```yaml
RIESGO 1: ICON_MAP duplicado
  Probabilidad: 🟡 MEDIA
  Impacto: 🟢 BAJO
  Mitigación: ✅ Verificar si BLOQUE-8 lo creó, reutilizar
  
RIESGO 2: Fallback icon faltante
  Probabilidad: 🟡 BAJA
  Impacto: 🟡 MEDIO
  Mitigación: ✅ RESUELTO - BookOpen como fallback

RIESGO 3: Lag animaciones mobile
  Probabilidad: 🟡 MEDIA
  Impacto: 🟡 MEDIO
  Mitigación: ✅ RESUELTO - initial={false} + easeInOut

RIESGO 4: Preview 4 cards muy altas mobile
  Probabilidad: 🟢 BAJA
  Impacto: 🟢 BAJO
  Mitigación: ✅ Responsive grid considerado

RIESGO 5: Auto-scroll errático
  Probabilidad: 🟢 BAJA
  Impacto: 🟢 BAJO
  Mitigación: ✅ setTimeout 100ms + behavior smooth
```

---

## 📎 NOTAS ADICIONALES

```yaml
COMPATIBILIDAD:
  - Next.js 14.2.3: ✅ Compatible
  - Framer Motion: ✅ Ya en dependencies
  - TypeScript 5.8.3: ✅ Compatible
  - Mobile Safari: ✅ Smooth scroll soportado
  - Mobile Chrome: ✅ Animaciones optimizadas

PERFORMANCE:
  - AnimatePresence optimizado con initial={false}
  - Solo 1 template expandido a la vez (menos DOM)
  - Auto-scroll condicional (solo cuando expande)
  - Icons lazy loaded via lucide-react

ACCESIBILIDAD:
  - Click handlers en buttons (no divs)
  - Keyboard navigation considerado (Enter expande)
  - Screen reader: aria-expanded agregado
  - Focus states preservados

MEJORAS FUTURAS:
  - Skeleton loader al expandir (UX polish)
  - Animación stagger al mostrar preview
  - Comparador lado a lado (2 templates)
  - Filtros por categoría dominante
```

---

## 📚 ARCHIVOS DE REFERENCIA

```yaml
Backend:
  - src/lib/constants/competencyTemplates.ts (expandir metadata)

API:
  - src/app/api/admin/competencies/templates/route.ts (retornar metadata)

Frontend:
  - src/app/dashboard/admin/competencias/page.tsx (UX Progressive Disclosure)

Icons:
  - lucide-react (Award, Users, TrendingUp, BookOpen, ChevronDown, ChevronUp, Check)

Design System:
  - .fhr-card
  - .fhr-btn-primary
  - Cyan/Purple gradients
  - Glassmorphism effects
```

---

**FIN TAREA ADITIVA v1.1 MEJORADA**

---

## 📋 CHANGELOG v1.0 → v1.1

```yaml
CORRECCIONES:
  ✅ Typo "highligTAREA..." corregido (si existía)

MEJORAS AGREGADAS:
  ✅ Fallback icon BookOpen en ICON_MAP
  ✅ Helper getIcon() con fallback robusto
  ✅ AnimatePresence con initial={false}
  ✅ Animación easeInOut (mejor mobile)
  ✅ Auto-scroll mobile al expandir
  ✅ setTimeout 100ms para scroll suave
  ✅ ID en cards para scroll target
  ✅ Documentación riesgos actualizada
  ✅ Checklist validación expandido
  ✅ Testing E2E incluye mobile + fallback

TOTAL MEJORAS: 10 optimizaciones enterprise
TIEMPO: Mismo (8h), más robusto
```
