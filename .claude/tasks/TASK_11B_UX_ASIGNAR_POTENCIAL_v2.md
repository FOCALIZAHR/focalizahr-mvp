# TASK 11B: UX Premium "Asignar Potencial" — Bugs Críticos + Mejoras Cinema

## CONTEXTO

La página "Asignar Potencial" (`src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`) permite a HR_MANAGER asignar scores de potencial (1-5) a empleados evaluados. Actualmente tiene **2 bugs críticos** y necesita **7 mejoras UX** nivel Cinema según la filosofía FocalizaHR.

**Nota:** TASK 10 ya movió las APIs de `/api/admin/performance-ratings/` a `/api/performance-ratings/`. Las URLs actuales en el código son CORRECTAS — no modificarlas.

## ARCHIVOS A MODIFICAR (SOLO estos)

```yaml
MODIFICAR:
  1. src/components/performance/RatingRow.tsx          # Bugs + mejoras
  2. src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx  # Stats + filtros

NO TOCAR:
  - src/components/performance/NineBoxDrawer.tsx       # Es de otra página (nine-box grid)
  - src/components/performance/NineBoxGrid.tsx         # Es de otra página
  - src/lib/services/PerformanceRatingService.ts       # Backend OK
  - src/app/api/performance-ratings/[id]/potential/route.ts  # Backend OK
  - prisma/schema.prisma                               # No hay cambios de schema
```

---

## 🔴 BUGS CRÍTICOS (Prioridad 1 — arreglar PRIMERO)

### BUG 1: Textarea de notas desconectado (RatingRow.tsx líneas 224-233)

**Actual (DECORATIVO — no guarda nada):**
```tsx
<textarea
  className={cn(...)}
  placeholder="Observaciones sobre el potencial del empleado..."
  rows={3}
/>
```

Problemas:
- Sin `value` prop → uncontrolled, no carga notas existentes de DB
- Sin `onChange` handler → no captura lo que escribe el usuario
- Sin `onBlur` handler → no guarda al perder foco
- Sin conexión al API → el campo `potentialNotes` en DB nunca se actualiza desde esta vista
- Las notas escritas aquí se **PIERDEN al colapsar la card** o recargar la página

**Fix requerido:**

1. Agregar estado local para notas:
```tsx
const [localNotes, setLocalNotes] = useState(rating.potentialNotes ?? '')
```

2. Conectar textarea:
```tsx
<textarea
  value={localNotes}
  onChange={(e) => setLocalNotes(e.target.value)}
  onBlur={handleSaveNotes}
  // ... resto de props
/>
```

3. Implementar auto-save de notas (debounce o onBlur):
```tsx
const handleSaveNotes = async () => {
  if (localNotes === (rating.potentialNotes ?? '')) return // sin cambios
  if (!localPotential) return // necesita tener potencial asignado primero
  
  try {
    await fetch(`/api/performance-ratings/${rating.id}/potential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        potentialScore: localPotential, 
        notes: localNotes 
      })
    })
  } catch (error) {
    console.error('Error saving notes:', error)
  }
}
```

4. Mostrar indicador de guardado:
```tsx
const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
```

---

### BUG 2: Notes no se envían con potentialScore (RatingRow.tsx línea 88)

**Actual:**
```typescript
body: JSON.stringify({ potentialScore: score })
```

**Correcto:**
```typescript
body: JSON.stringify({ potentialScore: score, notes: localNotes || undefined })
```

El API `POST /api/performance-ratings/[id]/potential` acepta `{ potentialScore, notes }` y guarda ambos. Pero el frontend solo envía `potentialScore`, perdiendo las notas que el usuario haya escrito.

---

## 🟡 MEJORAS UX (Prioridad 2 — después de bugs)

### MEJORA 1: Filtro "Solo Evaluados" (DEFAULT)

**Archivo:** `page.tsx`

**Problema:** Se muestran ~200 personas incluyendo ~192 con score 0.0 que NO han sido evaluadas. Asignar potencial sin score de desempeño no tiene sentido.

**Solución:** Agregar filtro `'evaluated'` al estado `filterPotential`:

```typescript
// NUEVO estado inicial — default a 'evaluated'
const [filterPotential, setFilterPotential] = useState<'all' | 'evaluated' | 'assigned' | 'pending'>('evaluated')

// NUEVO filtro en la función filteredRatings
const matchesEvaluated = filterPotential !== 'evaluated' || (r.calculatedScore ?? 0) > 0

return matchesSearch && matchesPotential && matchesEvaluated
```

**UI:** Agregar botón "Evaluados" como default activo:
```
[Evaluados ✓] [Todos] [Pendientes] [Asignados]
```

**Calcular conteo de no evaluados para el banner:**
```typescript
const notEvaluatedCount = ratings.filter(r => (r.calculatedScore ?? 0) === 0).length
const evaluatedCount = ratings.filter(r => (r.calculatedScore ?? 0) > 0).length
```

---

### MEJORA 2: Toast de confirmación al guardar

**Archivo:** `RatingRow.tsx`

**Problema:** Al hacer click en 1-5, el único feedback es que el botón cambia a ✓. No hay confirmación textual.

**Solución:** Agregar mini-toast inline (no usar librería externa):

```tsx
const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

// En handleAssignPotential, después de res.ok:
setSaveStatus('saved')
setTimeout(() => setSaveStatus('idle'), 2500)

// En el render, junto al PotentialSelector:
{saveStatus === 'saved' && (
  <motion.span 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0 }}
    className="text-xs text-emerald-400 flex items-center gap-1"
  >
    <Check className="w-3 h-3" /> Guardado
  </motion.span>
)}
```

---

### MEJORA 3: Stats corregidos con total real

**Archivo:** `page.tsx`

**Problema (línea 129):**
```typescript
const totalRatings = ratings.length  // ← Solo cuenta la página actual si API pagina
```

**Solución:** Verificar si el API devuelve paginación y usar `pagination.total`. Si devuelve todos los ratings sin paginación, entonces `ratings.length` ya es correcto pero igual corregir las stats para distinguir evaluados vs no evaluados:

```typescript
// Stats mejoradas
const totalRatings = ratings.length
const evaluatedCount = ratings.filter(r => (r.calculatedScore ?? 0) > 0).length
const notEvaluatedCount = totalRatings - evaluatedCount
const assignedCount = ratings.filter(r => r.potentialScore != null).length
const pendingEvaluated = evaluatedCount - assignedCount  // evaluados pero sin potencial
const progressPercent = evaluatedCount > 0 ? Math.round((assignedCount / evaluatedCount) * 100) : 0
```

**UI de stats actualizada:**
```tsx
<StatMini icon={<Users />} label="Evaluados" value={evaluatedCount} color="cyan" />
<StatMini icon={<CheckCircle2 />} label="Asignados" value={assignedCount} color="emerald" />
<StatMini icon={<Sparkles />} label="Pendientes" value={pendingEvaluated} color="amber" />
```

---

### MEJORA 4: Mini Gauge de Distribución

**Archivo:** `page.tsx` (dentro del PROGRESS CARD)

**Concepto:** Al lado de las stats, mostrar distribución en tiempo real de potencial asignado vs distribución ideal:

```typescript
// Distribución target (curva normal empresarial)
const TARGET_DISTRIBUTION = { high: 20, medium: 60, low: 20 }

// Distribución real (solo de los que tienen potencial asignado)
const withPotential = ratings.filter(r => r.potentialScore != null)
const totalWithPotential = withPotential.length || 1 // evitar /0
const realDistribution = {
  high: Math.round((withPotential.filter(r => (r.potentialScore ?? 0) >= 4).length / totalWithPotential) * 100),
  medium: Math.round((withPotential.filter(r => (r.potentialScore ?? 0) === 3).length / totalWithPotential) * 100),
  low: Math.round((withPotential.filter(r => (r.potentialScore ?? 0) <= 2).length / totalWithPotential) * 100)
}
```

**UI:** Barras horizontales miniatura mostrando Target% vs Real%. No usar librería de charts — solo divs con width dinámico.

```
DISTRIBUCIÓN                              
⭐ Alto    Target 20%  Real 25%  ████▊    
🎯 Medio   Target 60%  Real 50%  ████     
⚡ Bajo    Target 20%  Real 25%  ████▊    
```

Solo mostrar este panel cuando `assignedCount >= 3` (mínimo 3 asignados para que tenga sentido).

---

### MEJORA 5: Banner contextual para pendientes de evaluación

**Archivo:** `page.tsx`

**Concepto:** Cuando filtro "Evaluados" está activo y hay empleados sin evaluación, mostrar banner informativo debajo de la lista:

```tsx
{filterPotential === 'evaluated' && notEvaluatedCount > 0 && (
  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
    <div className="flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
      <div>
        <p className="text-sm text-amber-300">
          {notEvaluatedCount} colaboradores aún no tienen evaluación completada
        </p>
        <p className="text-xs text-slate-500">
          Deben completar su evaluación 360° antes de asignar potencial
        </p>
      </div>
    </div>
    <Link 
      href="/dashboard/evaluaciones"
      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 whitespace-nowrap"
    >
      Ir al Portal <ArrowRight className="w-3 h-3" />
    </Link>
  </div>
)}
```

Agregar imports necesarios: `AlertTriangle`, `ArrowRight` de lucide-react.

---

### MEJORA 6: Score con badge de nivel visible

**Archivo:** `RatingRow.tsx`

**Problema:** El score "0.0" aparece sin contexto. Los evaluados muestran "3.61" pero sin indicar qué significa.

**Solución:** Mostrar el `perfClassification.label` junto al score:

```tsx
// En el render del score, REEMPLAZAR la línea que dice "Performance":
<div className="text-[10px]" style={{ color: `${perfClassification.color}80` }}>
  {effectiveScore > 0 ? perfClassification.label : 'Sin evaluar'}
</div>
```

Labels disponibles en `getPerformanceClassification()`: `exceptional`, `exceeds_expectations`, `meets_expectations`, `developing`, `needs_improvement`.

> NOTA: Verificar qué propiedad devuelve `getPerformanceClassification()` para el label. Puede ser `.label`, `.level`, o `.name`. Buscar en `src/config/performanceClassification.ts`.

---

### MEJORA 7: Notas con indicador de guardado + carga desde DB

**Archivo:** `RatingRow.tsx` + `page.tsx`

**Requisitos:**
1. Cargar `potentialNotes` existentes desde la API (necesita que el fetch de ratings incluya este campo)
2. Mostrar estado de guardado en textarea: "Sin cambios" / "Guardando..." / "✓ Guardado"
3. Auto-save con onBlur (cuando usuario sale del textarea)
4. Si el usuario escribe notas Y hace click en 1-5, enviar ambos juntos

**Cambios en RatingData interface (RatingRow.tsx):**
```typescript
export interface RatingData {
  id: string
  employeeId: string
  employeeName: string
  employeePosition?: string | null
  departmentName?: string | null
  calculatedScore: number
  finalScore?: number | null
  potentialScore?: number | null
  potentialLevel?: string | null
  nineBoxPosition?: string | null
  potentialNotes?: string | null  // ← AGREGAR
}
```

**Cambios en page.tsx fetchData:**
```typescript
// En la transformación de datos, agregar:
potentialNotes: r.potentialNotes || null
```

**Verificar:** Si el API GET `/api/admin/performance-ratings` (o `/api/performance-ratings` post-TASK10) ya devuelve `potentialNotes` en el response. Si NO lo devuelve, hay que agregar `potentialNotes: true` al select del Prisma query en la API.

**Indicador visual debajo del textarea:**
```tsx
<div className="flex items-center justify-between mt-1">
  <span className="text-[10px] text-slate-600">Confidencial · Solo visible para HR</span>
  {notesStatus === 'saving' && (
    <span className="text-[10px] text-cyan-400 flex items-center gap-1">
      <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
    </span>
  )}
  {notesStatus === 'saved' && (
    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
      <Check className="w-3 h-3" /> Guardado
    </span>
  )}
</div>
```

---

## ORDEN DE IMPLEMENTACIÓN

```
1. BUG 1: Conectar textarea a estado (value + onChange + onBlur)     → 10 min
2. BUG 2: Enviar notes junto con potentialScore en handleAssign      → 2 min
3. MEJORA 7: Auto-save notas con onBlur + indicador                  → 15 min
4. MEJORA 2: Toast "Guardado" al asignar potencial                   → 5 min
5. MEJORA 6: Score con label de clasificación                        → 3 min
6. MEJORA 1: Filtro "Solo Evaluados" como default                    → 10 min
7. MEJORA 3: Stats corregidos (evaluados vs total)                   → 5 min
8. MEJORA 5: Banner pendientes → link a Evaluaciones                 → 5 min
9. MEJORA 4: Mini distribución gauge (Target vs Real)                → 15 min
```

**Tiempo estimado total: ~70 minutos**

---

## REGLAS INQUEBRANTABLES

```yaml
NO HACER:
  ❌ No instalar librerías nuevas (no react-hot-toast, no toast lib)
  ❌ No modificar APIs backend (ya funcionan perfecto)
  ❌ No modificar schema Prisma
  ❌ No modificar NineBoxDrawer.tsx (es de la vista nine-box grid)
  ❌ No recrear componentes desde cero — solo modificar quirúrgicamente
  ❌ No cambiar la estructura visual existente (ya es Cinema)
  ❌ No hardcodear clasificaciones (usar getPerformanceClassification)
  ❌ No cambiar las URLs de fetch — ya son correctas post-TASK10

SÍ HACER:
  ✅ Usar clases CSS existentes (.fhr-* y Tailwind)
  ✅ Usar framer-motion para animaciones (ya importado)
  ✅ Usar lucide-react para íconos (ya importado)
  ✅ Respetar patrón memo() en componentes
  ✅ Mantener TypeScript strict
  ✅ Usar cn() para classNames condicionales
  ✅ Respetar design system FocalizaHR (cyan #22D3EE, purple #A78BFA)
  ✅ Respetar URLs post-TASK10: /api/performance-ratings/ (sin admin)
```

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

```yaml
Checklist:
  □ Textarea de notas carga datos existentes de DB (value={localNotes})
  □ Textarea tiene onChange que actualiza estado local
  □ Textarea guarda al hacer onBlur (si hay cambios)
  □ Click en botón 1-5 envía notes junto con potentialScore
  □ Toast "✓ Guardado" aparece ~2.5s después de asignar potencial
  □ Indicador "Guardando..." / "✓ Guardado" debajo del textarea
  □ Filtro "Evaluados" es default y oculta personas con score 0.0
  □ Stats muestran: Evaluados / Asignados / Pendientes (no Total bruto)
  □ Score muestra label de clasificación (meets_expectations, etc.)
  □ Banner "X pendientes → Ir a Portal" aparece con filtro evaluados
  □ Mini gauge distribución muestra Target vs Real (si ≥3 asignados)
  □ URLs de fetch usan /api/performance-ratings/ (sin admin)
  □ No hay errores TypeScript (npx tsc --noEmit)
  □ La página compila y funciona en dev (npm run dev)
```

---

## FILOSOFÍA DE DISEÑO

> **FocalizaHR no muestra datos. FocalizaHR guía decisiones.**
>
> Un ejecutivo debe: Entender en 3 segundos. Decidir en 10 segundos. Actuar en 1 clic.
>
> Si el usuario necesita scroll para entender, fallamos.
> Si el usuario ve datos pero no sabe qué hacer, fallamos.

---

*Task spec v2 generada para Claude Code. Ejecutar con prompt corto.*
