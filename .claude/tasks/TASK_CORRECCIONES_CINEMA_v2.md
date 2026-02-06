# 🎬 TASK: CORRECCIONES CINEMA - Ratings Page
## Post-ejecución TASK_CONSOLIDADO - 6 Fixes Prioritarios

**Prioridad:** CRÍTICA - Afecta UX, seguridad y funcionalidad
**Filosofía:** FILOSOFIA_DISENO_FOCALIZAHR_v1.md (Apple/Tesla Cinema)
**Principio rector:** "Entender en 3s, Decidir en 10s, Actuar en 1 clic"

---

## 📋 RESUMEN DE ISSUES

| # | Issue | Severidad | Archivo Principal |
|---|-------|-----------|-------------------|
| 1 | Gauge Gauss no aparece | 🔴 ALTA | ratings/page.tsx + DistributionGauge.tsx |
| 2 | Pendientes = 191 (toda empresa) + UX al fondo | 🔴 ALTA | ratings/page.tsx |
| 3 | Notas: ¿auto-save o botón? | 🟡 MEDIA | RatingRow.tsx |
| 4 | Nine-Box sin botón Volver | 🟡 MEDIA | NineBoxGrid.tsx o ratings/page.tsx |
| 5 | Toasts inline → Sistema FocalizaHR | 🟡 MEDIA | RatingRow.tsx |
| 6 | HR_MANAGER puede cambiar evaluaciones de TODA la empresa | 🔴 SEGURIDAD | ratings/page.tsx (frontend) |

---

## 🔴 FIX 1: GAUGE GAUSS NO APARECE

### Problema
El componente DistributionGauge.tsx no fue creado o no fue integrado en ratings/page.tsx.

### Solución
PRIMERO verifica si existe: `ls src/components/performance/DistributionGauge.tsx`

**Si NO existe → Crear con esta spec Cinema:**

```
Archivo: src/components/performance/DistributionGauge.tsx
```

**Spec del componente:**
- Recharts AreaChart con dos curvas superpuestas
- **Curva Target:** Modelo McKinsey 10-20-40-20-10 (dashed, cyan #22D3EE, fill gradient 10% opacity)
- **Curva Real:** Distribución actual de potentialScores asignados (solid, purple #A78BFA, fill gradient 15% opacity)
- CustomTooltip glassmorphism: Target% vs Real% con diff coloreada (verde si bajo, rojo si excede)
- DistributionSummary abajo: "✓ Alineada con McKinsey" o "⚡ [Categoría] excede target por X%"
- MinToShow = 3 (si menos de 3 asignados, mostrar mensaje "Asigna al menos 3 potenciales para ver distribución")
- Props: `scores: number[]` (array de potentialScores 1-5 de los ratings actuales)
- Responsive: height 180px desktop, 140px mobile
- Tesla line top, glassmorphism card wrapper

**DATOS para las categorías:**
```typescript
const DISTRIBUTION_LABELS = [
  { score: 1, label: 'Needs Improvement', targetPct: 10 },
  { score: 2, label: 'Developing',        targetPct: 20 },
  { score: 3, label: 'Meets Expectations', targetPct: 40 },
  { score: 4, label: 'Exceeds',           targetPct: 20 },
  { score: 5, label: 'Exceptional',       targetPct: 10 },
]
```

**Si YA existe → Verificar que está integrado en ratings/page.tsx.**

### Integración en ratings/page.tsx

**POSICIÓN UX CINEMA (ABOVE THE FOLD):** El gauge NO va al fondo. Va integrado en el HEADER CARD junto al progress. Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver a Ciclo                    [Filtros] [Búsqueda]      │
│                                                                  │
│  Clasificación de Desempeño                                      │
│  Ciclo: "Evaluación 2025-Q1"                                    │
│                                                                  │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐  │
│  │  PROGRESS CARD       │  │  DISTRIBUTION GAUGE             │  │
│  │  87/191 evaluados    │  │  [Curva Target vs Real]         │  │
│  │  ████████░░ 45%      │  │  ✓ Alineada / ⚡ Excede...     │  │
│  │  34 potencial · 12 9B│  │                                 │  │
│  └──────────────────────┘  └─────────────────────────────────┘  │
│                                                                  │
│  ⚠️ BANNER PENDIENTES (si hay) ← ABOVE THE FOLD               │
└─────────────────────────────────────────────────────────────────┘
```

**Código integración:**
```typescript
// En ratings/page.tsx, dentro del HEADER CARD existente
import DistributionGauge from '@/components/performance/DistributionGauge'

// Calcular scores de los ratings que YA tienen potentialScore asignado
// IMPORTANTE: Usar los ratings de la PÁGINA ACTUAL (no fetch extra)
const assignedPotentialScores = useMemo(() => 
  ratings
    .filter(r => r.potentialScore != null)
    .map(r => r.potentialScore as number),
  [ratings]
)

// En el JSX, JUNTO al progress card (flex row):
<div className="flex flex-col lg:flex-row gap-4">
  {/* Progress card existente */}
  <div className="flex-1">
    {/* ... progress existente ... */}
  </div>
  
  {/* Distribution Gauge - NUEVO */}
  <div className="lg:w-[320px]">
    <DistributionGauge scores={assignedPotentialScores} />
  </div>
</div>
```

**NOTA:** El gauge se actualiza automáticamente cuando se asigna un potencial porque `ratings` cambia → `useMemo` recalcula → re-render.

---

## 🔴 FIX 2: BANNER PENDIENTES - UX ABOVE THE FOLD

### Problema
1. Muestra "191 pendientes" = total de TODA la empresa, no los pendientes reales
2. Está posicionado al fondo de la página (nadie lo ve)

### Datos disponibles del backend
El API ya devuelve stats con server-side filtering:
```typescript
// Response de /api/performance-ratings?cycleId=X
{
  data: [...],
  stats: {
    total: number,      // Total de ratings en este ciclo (filtrado por AREA_MANAGER si aplica)
    evaluated: number,  // Con calculatedScore > 0
    assigned: number,   // Con potentialScore asignado  
    pending: number,    // Sin potentialScore
    inNineBox: number   // Con nineBoxPosition
  },
  pagination: { page, limit, total, pages }
}
```

### Cálculo correcto de pendientes
```typescript
// ✅ CORRECTO: Usar stats del backend
const pendingCount = stats.total - stats.evaluated
// O si stats tiene 'pending': stats.pending

// ❌ INCORRECTO: No usar ratings.length (eso es solo la página actual)
// ❌ INCORRECTO: No hardcodear 191
```

### Solución UX Cinema - ABOVE THE FOLD

**El banner va DESPUÉS del header card y ANTES de la tabla.** Siguiendo Mandamiento #2: "Above the fold = Decisión"

```
┌──────────────────────────────────────────────────────────┐
│  HEADER con Progress + Gauge (Fix 1)                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ⚡ 104 colaboradores pendientes de evaluación          │ ← BANNER AQUÍ
│     Completa las evaluaciones para habilitar 9-Box       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  [Filtros] [Búsqueda]                                    │
│  ┌─ Tabla de ratings ─────────────────────────────────┐  │
```

**Diseño Cinema del Banner:**
```tsx
// Solo mostrar si hay pendientes reales
{pendingCount > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-xl border border-amber-500/30 
               bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent 
               p-4 backdrop-blur-sm"
  >
    {/* Tesla line amber */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
    
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg 
                        bg-amber-500/20 border border-amber-400/30">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-200">
            {pendingCount} colaboradores pendientes de evaluación
          </p>
          <p className="text-xs text-amber-300/60">
            Completa las evaluaciones para habilitar la Matriz 9-Box
          </p>
        </div>
      </div>
      
      {/* Mini progress ring */}
      <div className="text-right">
        <span className="text-2xl font-light text-amber-300">
          {Math.round((stats.evaluated / stats.total) * 100)}%
        </span>
        <p className="text-[10px] text-amber-400/50 uppercase tracking-wider">
          completado
        </p>
      </div>
    </div>
  </motion.div>
)}
```

**IMPORTANTE:** Si `stats.total === stats.evaluated` → NO mostrar banner. Mostrar solo si hay trabajo pendiente.

---

## 🟡 FIX 3: NOTAS - AUTO-SAVE SIN BOTÓN

### Problema
No queda claro si las notas tienen auto-guardado o necesitan botón.

### Decisión de diseño: AUTO-SAVE on blur

**Razón UX:** Siguiendo la filosofía FocalizaHR "Actuar en 1 clic" — no queremos que el usuario tenga que hacer clic extra para guardar una nota. El guardado debe ser invisible.

### Implementación en RatingRow.tsx

```typescript
// Estado local para notas
const [localNotes, setLocalNotes] = useState(rating.potentialNotes || '')
const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

// Sync cuando cambia el rating (paginación)
useEffect(() => {
  setLocalNotes(rating.potentialNotes || '')
  setNotesStatus('idle')
}, [rating.id, rating.potentialNotes])

// Auto-save on blur
const handleSaveNotes = useCallback(async () => {
  // Solo guardar si hay cambios Y ya tiene potentialScore asignado
  if (localNotes === (rating.potentialNotes || '')) return
  if (!rating.potentialScore) return // No guardar notas sin potencial asignado
  
  setNotesStatus('saving')
  try {
    const res = await fetch(`/api/performance-ratings/${rating.id}/potential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        potentialScore: rating.potentialScore,
        notes: localNotes || undefined
      })
    })
    if (res.ok) {
      setNotesStatus('saved')
      setTimeout(() => setNotesStatus('idle'), 2000)
    }
  } catch {
    setNotesStatus('idle')
  }
}, [localNotes, rating])

// Textarea JSX
<div className="relative">
  <textarea
    value={localNotes}
    onChange={(e) => setLocalNotes(e.target.value)}
    onBlur={handleSaveNotes}
    placeholder="Observaciones sobre potencial..."
    disabled={!rating.potentialScore}  // Deshabilitado si no hay potencial
    className="w-full rounded-lg bg-slate-800/50 border border-slate-700/50 
               text-sm text-slate-300 p-2 resize-none h-16
               focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
               disabled:opacity-40 disabled:cursor-not-allowed
               placeholder:text-slate-600"
  />
  {/* Indicador inline (NO toast — es estado del campo) */}
  {notesStatus !== 'idle' && (
    <span className="absolute bottom-1 right-2 text-[10px]">
      {notesStatus === 'saving' 
        ? <span className="text-cyan-400/60">Guardando...</span>
        : <span className="text-emerald-400/60">✓ Guardado</span>
      }
    </span>
  )}
</div>
```

**NOTA:** El indicador debajo del textarea ES CORRECTO como inline porque es estado del campo, no notificación global.

---

## 🟡 FIX 4: NINE-BOX SIN BOTÓN VOLVER

### Problema
La vista Nine-Box no tiene navegación de regreso. Según FILOSOFIA_DISENO: "Back = Esquina superior izquierda con flecha" (Mandamiento #7: Consistencia Predecible).

### Solución
Verificar dónde está la vista Nine-Box. Puede ser:
- **Tab dentro de ratings/page.tsx** → Agregar tab switcher visible
- **Página separada** → Agregar botón ← Volver

**Si es TAB:** El tab ya funciona como navegación. Verificar que los tabs sean visibles y accesibles.

**Si es PÁGINA separada o sección scrolleada:** Agregar en la parte superior del Nine-Box:

```tsx
<button
  onClick={() => {
    // Si es mismo page con tabs: cambiar tab activo
    // Si es page separada: router.back() o router.push(`/dashboard/performance/cycles/${cycleId}/ratings`)
  }}
  className="group flex items-center gap-2 text-sm text-slate-400 
             hover:text-cyan-400 transition-colors mb-4"
>
  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
  <span>Volver a Clasificación</span>
</button>
```

**VERIFICAR:** Lee el código actual de ratings/page.tsx para ver si Nine-Box es un tab, una sección, o una página separada, y aplica la solución correspondiente.

---

## 🟡 FIX 5: TOASTS INLINE → SISTEMA FOCALIZAHR

### Problema
El task anterior creó toasts inline manuales (motion.span con "Guardado"). FocalizaHR tiene un sistema de notificaciones enterprise en `src/components/ui/toast-system.tsx`.

### Solución

**1. Buscar y eliminar toasts inline:**
En RatingRow.tsx y ratings/page.tsx, buscar:
- `saveStatus`, `setSaveStatus` states
- `motion.span` con texto "Guardado" o "✓"
- Cualquier div/span inline que muestre confirmación de guardado

**2. Reemplazar por sistema FocalizaHR:**
```typescript
import { useToast } from '@/components/ui/toast-system'

// Dentro del componente:
const { success, error } = useToast()

// Al asignar potencial exitosamente:
success(`Potencial asignado a "${rating.employeeName}"`, '¡Guardado!')

// Al error:
error('Error al guardar potencial. Intenta nuevamente.', 'Error')
```

**3. MANTENER el indicador inline de notas (Fix 3):**
El mini indicador "Guardando..." / "✓ Guardado" debajo del textarea de notas SÍ es correcto como inline — es estado del campo, no notificación global.

**4. Colores corporativos del sistema toast:**
- success = Cyan #22D3EE + border-cyan-400 + shadow-cyan-400/30
- error = Red #EF4444 + border-red-400 + shadow-red-400/30  
- warning = Purple #A78BFA + border-purple-400 + shadow-purple-400/30
- Auto-highlighting: nombres entre comillas → text-cyan-300 font-bold

---

## 🔴 FIX 6: SEGURIDAD - PERMISOS CENTRALIZADOS + JEFE DIRECTO

### Problema Doble
1. **Array hardcodeado** en API potential (viola Fase 2 RBAC):
   ```typescript
   // ❌ ACTUAL - LEGACY HARDCODEADO
   const canRatePotential = [
     'FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'CEO',
     'HR_ADMIN', 'HR_MANAGER', 'AREA_MANAGER'
   ].includes(userContext.role || '')
   ```
2. **Sin verificación de jefe directo** — cualquiera con rol puede asignar potencial a cualquier empleado

### Solución: 2 Capas (Centralizado + Negocio)

```
CAPA 1 → PERMISO FUNCIONAL (AuthorizationService.ts)
  hasPermission(role, 'potential:assign') → ¿Tu ROL puede asignar potencial?

CAPA 2 → LÓGICA DE NEGOCIO (API route)
  Si no eres admin → ¿Eres el JEFE DIRECTO de este empleado?
```

### PASO 1: Agregar permiso en AuthorizationService.ts

**Archivo:** `src/lib/services/AuthorizationService.ts`

Agregar al objeto `PERMISSIONS`:

```typescript
export const PERMISSIONS = {
  // ... permisos existentes ...
  
  // ─────────────────────────────────────────────────────────────────────────
  // NINE-BOX / POTENTIAL ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────────────
  'potential:assign': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'CEO',
    'AREA_MANAGER'
    // Todos estos roles PUEDEN asignar potencial,
    // pero HR_MANAGER/CEO/AREA_MANAGER requieren ser jefe directo (Capa 2)
  ],
  'potential:view': [
    'FOCALIZAHR_ADMIN',
    'ACCOUNT_OWNER',
    'HR_ADMIN',
    'HR_MANAGER',
    'HR_OPERATOR',
    'CEO',
    'AREA_MANAGER'
  ],
  
} as const;
```

### PASO 2: Definir quién es ADMIN SISTEMA vs JEFE DIRECTO

```typescript
// Roles que pueden asignar potencial a CUALQUIER empleado (sin restricción jerárquica)
const POTENTIAL_ADMIN_ROLES = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN'] as const;

// Roles que pueden asignar potencial SOLO a sus reportes directos
// HR_MANAGER, CEO, AREA_MANAGER → requieren Employee.managerId match
```

### PASO 3: Refactorizar API potential (POST)

**Archivo:** `src/app/api/admin/performance-ratings/[id]/potential/route.ts`

```typescript
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'

export async function POST(request: NextRequest, { params }: ...) {
  const { id: ratingId } = await params
  const userContext = extractUserContext(request)
  const userEmail = request.headers.get('x-user-email')
  
  // ═══════════════════════════════════════════════════════════════
  // CAPA 1: PERMISO FUNCIONAL CENTRALIZADO (AuthorizationService)
  // ═══════════════════════════════════════════════════════════════
  if (!hasPermission(userContext.role, 'potential:assign')) {
    return NextResponse.json(
      { success: false, error: 'Sin permisos para asignar potencial' },
      { status: 403 }
    )
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CAPA 2: LÓGICA DE NEGOCIO - JEFE DIRECTO
  // Admins del sistema pueden asignar a cualquiera.
  // Otros roles solo a sus reportes directos.
  // ═══════════════════════════════════════════════════════════════
  const isSystemAdmin = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
    .includes(userContext.role || '')
  
  if (!isSystemAdmin) {
    // Obtener el rating con el managerId del employee
    const ratingWithEmployee = await prisma.performanceRating.findUnique({
      where: { id: ratingId },
      select: {
        accountId: true,
        employee: {
          select: { id: true, managerId: true }
        }
      }
    })
    
    if (!ratingWithEmployee || ratingWithEmployee.accountId !== userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'Rating no encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar Employee del usuario logueado
    const loggedInEmployee = await prisma.employee.findFirst({
      where: {
        accountId: userContext.accountId,
        email: userEmail,
        isActive: true
      },
      select: { id: true }
    })
    
    // Verificar que es jefe directo
    const isDirectManager = loggedInEmployee 
      && ratingWithEmployee.employee.managerId === loggedInEmployee.id
    
    if (!isDirectManager) {
      return NextResponse.json(
        { success: false, error: 'Solo el jefe directo puede asignar potencial a este colaborador' },
        { status: 403 }
      )
    }
  }
  
  // ... resto del código de asignación (sin cambios) ...
}
```

### PASO 4: Refactorizar API potential (DELETE)

**Mismo archivo, método DELETE.** Actualmente TAMBIÉN tiene array hardcodeado:
```typescript
// ❌ ACTUAL
const canRatePotential = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', ...].includes(...)
```

Reemplazar con la misma lógica de 2 capas del POST.

### PASO 5: Frontend - canAssignPotential por rating

**En el API GET de performance-ratings (listado):**
```typescript
// Buscar Employee del usuario logueado UNA VEZ
const loggedInEmployee = await prisma.employee.findFirst({
  where: { accountId: userContext.accountId, email: userEmail, isActive: true },
  select: { id: true }
})

const isSystemAdmin = ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN']
  .includes(userContext.role || '')

// Agregar campo computado a cada rating
const ratingsWithPermissions = ratings.map(r => ({
  ...r,
  canAssignPotential: isSystemAdmin 
    || (loggedInEmployee && r.employee?.managerId === loggedInEmployee.id)
}))
```

**En RatingRow.tsx:**
```typescript
interface RatingRowProps {
  rating: Rating & { canAssignPotential?: boolean }
  onAssignPotential: (id: string, score: number, notes?: string) => void
}

// Selector de potencial condicional:
{rating.canAssignPotential ? (
  <PotentialSelector 
    value={rating.potentialScore}
    onChange={(score) => onAssignPotential(rating.id, score)}
  />
) : (
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-400">
      {rating.potentialLevel || 'Sin asignar'}
    </span>
    <span className="text-[10px] text-slate-600" title="Solo el jefe directo puede asignar potencial">
      🔒
    </span>
  </div>
)}

// Textarea de notas: también condicional
<textarea
  disabled={!rating.canAssignPotential}
  // ... resto props ...
/>
```

### ⚠️ EDGE CASES

```yaml
1. Usuario sin Employee match:
   - Email del Account no matchea ningún Employee
   - → Solo admins pueden asignar, el resto ve read-only
   
2. Employee sin managerId (CEO corporativo):
   - managerId = null → Nadie es su jefe directo
   - → Solo admins pueden asignar potencial al CEO
   
3. HR_MANAGER que quiere asignar a TODOS:
   - NO puede. Solo a sus reportes directos.
   - Para asignar a todos → necesita rol HR_ADMIN o ACCOUNT_OWNER
   
4. AREA_MANAGER:
   - Ya filtrado por scope departamental (ve solo su depto)
   - Adicional: solo modifica potencial de sus reportes directos
```

### 📋 RESUMEN ARQUITECTÓNICO

```
┌──────────────────────────────────────────────────────────────────┐
│                    API POTENTIAL (POST/DELETE)                     │
│                                                                   │
│  CAPA 1: hasPermission(role, 'potential:assign')                 │
│  ├── ❌ No tiene permiso → 403 "Sin permisos"                   │
│  └── ✅ Tiene permiso → Continuar a Capa 2                      │
│                                                                   │
│  CAPA 2: ¿Es admin del sistema?                                  │
│  ├── ✅ FOCALIZAHR_ADMIN/ACCOUNT_OWNER/HR_ADMIN → OK directo    │
│  └── ❌ Otro rol → Verificar jefe directo                        │
│      ├── Buscar Employee por email del usuario                   │
│      ├── Comparar Employee.id vs rating.employee.managerId       │
│      ├── ✅ Match → OK, puede asignar                            │
│      └── ❌ No match → 403 "Solo jefe directo"                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚡ ORDEN DE EJECUCIÓN

```
1. FIX 6 primero (seguridad) - 10 min
   → Backend: scope check en API potential
   → Frontend: prop readOnly en RatingRow
   
2. FIX 2 (banner pendientes) - 10 min  
   → Usar stats del backend
   → Posicionar ABOVE THE FOLD
   
3. FIX 1 (gauge) - 15 min
   → Crear/verificar DistributionGauge.tsx
   → Integrar en header card
   
4. FIX 5 (toasts) - 5 min
   → Reemplazar inline por useToast()
   
5. FIX 3 (notas auto-save) - 5 min
   → Conectar textarea con onBlur
   
6. FIX 4 (botón volver) - 5 min
   → Agregar navegación en Nine-Box
```

**Total estimado: ~50 min**

---

## ✅ VERIFICACIÓN POST-FIX

```bash
# 1. Compilación limpia
npx tsc --noEmit

# 2. Dev server sin errores
npm run dev
```

### Tests manuales:
- [ ] Banner muestra count CORRECTO de pendientes (no 191 si eres AREA_MANAGER)
- [ ] Banner desaparece cuando todos están evaluados
- [ ] Gauge muestra curvas Target vs Real
- [ ] Gauge se actualiza al asignar potencial
- [ ] Notas se auto-guardan al salir del campo (blur)
- [ ] Indicador "Guardando..." → "✓ Guardado" aparece en textarea
- [ ] Toast corporativo aparece al asignar potencial (no inline)
- [ ] Nine-Box tiene navegación de regreso
- [ ] AREA_MANAGER NO puede asignar potencial fuera de su scope
- [ ] HR_MANAGER: verificar comportamiento según decisión de Victor
- [ ] Server-side filtering intacto (no se reintrodujo limit=500)
- [ ] Paginación funcional

---

## 🚫 REGLAS INQUEBRANTABLES

1. **NO reintroducir limit=500** ni filtrado client-side
2. **NO modificar PerformanceRatingService.ts** ni APIs de listado
3. **NO recrear componentes** — modificaciones quirúrgicas
4. **URLs de fetch:** `/api/performance-ratings/` (sin /admin/ si se refactorizó)
5. **Toasts:** SOLO `useToast()` de `src/components/ui/toast-system.tsx`
6. **Design system:** Colores cyan #22D3EE + purple #A78BFA, glassmorphism, tesla lines
7. **Filosofía:** "Si el usuario necesita scroll para entender, fallamos"
