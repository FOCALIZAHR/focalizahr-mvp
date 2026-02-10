# TASK_AAE_PHASE1: Integración AAE Potential - Fase 1

## 📋 CONTEXTO

El sistema de evaluación de potencial fue refactorizado. Los componentes nuevos (AAEPotentialRenderer, TrinityCards, FactorEvaluator, NineBoxMiniPreview) ya están creados y funcionan. La página /ratings fue restaurada y los bugs básicos fueron corregidos.

Ahora necesitamos completar la arquitectura UX separando:
- **EVALUAR** = Modal en /evaluaciones (acción del jefe)
- **VER** = Página /ratings (solo lectura, resumen)

---

## ✅ YA COMPLETADO

- [x] Componentes AAE en src/components/potential/
- [x] Página /ratings restaurada con header, gauge, filtros
- [x] Botones 1-5 (PotentialSelector) eliminados de RatingRow
- [x] Estado se actualiza correctamente post-guardado
- [x] Botón volver usa router.back()

---

## 📌 TAREAS FASE 1

### TAREA 1: Modal AAEPotentialRenderer en /evaluaciones

**Archivo:** `src/app/dashboard/evaluaciones/page.tsx` (o componente SpotlightCard)

**Objetivo:** El jefe evalúa potencial sin salir de /evaluaciones

**Implementación:**

1. Agregar estado para empleado seleccionado:
```typescript
const [selectedForPotential, setSelectedForPotential] = useState<{
  ratingId: string
  fullName: string
  calculatedScore: number
  potentialScore?: number | null
  potentialNotes?: string | null
} | null>(null)
```

2. Botón "Evaluar Potencial" en SpotlightCard debe hacer:
```typescript
onClick={() => setSelectedForPotential({
  ratingId: employee.ratingId,
  fullName: employee.fullName,
  calculatedScore: employee.calculatedScore,
  potentialScore: employee.potentialScore,
  potentialNotes: employee.potentialNotes
})}
```

3. Agregar modal con AAEPotentialRenderer:
```tsx
import { AAEPotentialRenderer } from '@/components/potential'

{selectedForPotential && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-2xl">
      <AAEPotentialRenderer
        ratingId={selectedForPotential.ratingId}
        employeeName={selectedForPotential.fullName}
        performanceScore={selectedForPotential.calculatedScore}
        existingFactors={null}
        existingNotes={selectedForPotential.potentialNotes || ''}
        onSave={async (factors, notes) => {
          const response = await fetch(
            `/api/performance-ratings/${selectedForPotential.ratingId}/potential`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                aspiration: factors.aspiration,
                ability: factors.ability,
                engagement: factors.engagement,
                notes
              })
            }
          )
          if (response.ok) {
            // Refrescar datos del empleado en la lista
            // ... actualizar estado local o refetch
            setSelectedForPotential(null)
          }
        }}
        onCancel={() => setSelectedForPotential(null)}
      />
    </div>
  </div>
)}
```

---

### TAREA 2: Página /ratings solo lectura

**Archivo:** `src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`

**Objetivo:** /ratings es solo para VER resumen, no para evaluar

**Implementación:**

1. ELIMINAR:
   - Estado `selectedRating`
   - Función `handleAAESave`
   - Modal/overlay con AAEPotentialRenderer
   - Import de AAEPotentialRenderer

2. MODIFICAR RatingRow:
   - Click en fila NO abre nada (o solo expande para ver detalles/notas)
   - Quitar cualquier lógica de evaluación

3. MANTENER:
   - Header con gauge + distribución
   - Filtros (Evaluados/Todos/Pendientes/Asignados)
   - Lista de empleados con scores
   - Paginación
   - Botón "Ver 9-Box"

---

### TAREA 3: Botón "Ver Resumen" en /evaluaciones

**Archivo:** `src/app/dashboard/evaluaciones/page.tsx`

**Objetivo:** Navegación fácil desde /evaluaciones a /ratings

**Implementación:**

Agregar botón púrpura pequeño en header, cerca de "Ver Equipo" u "Ocultar":

```tsx
<Link href={`/dashboard/performance/cycles/${cycleId}/ratings`}>
  <button className="px-3 py-1.5 rounded-lg text-sm font-medium
    bg-purple-500/20 text-purple-400 border border-purple-500/30
    hover:bg-purple-500/30 transition-colors flex items-center gap-1.5">
    <BarChart3 className="w-4 h-4" />
    Ver Resumen
  </button>
</Link>
```

**Nota:** Necesitas obtener el cycleId del contexto o de los datos cargados.

---

### TAREA 4: Header placeholder para insights

**Archivo:** `src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx`

**Objetivo:** Preparar espacio visual para Fase 2

**Implementación:**

Agregar debajo del header de Potencial existente:

```tsx
{/* PLACEHOLDER - Perfil de Evaluación (Fase 2) */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.15 }}
  className="relative p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl 
    border border-slate-700/30 overflow-hidden"
>
  {/* Tesla line púrpura */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r 
    from-transparent via-purple-400 to-transparent" />
  
  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
    Perfil de Evaluación
  </p>
  <p className="text-sm text-slate-400">
    Próximamente: Distribución de notas, desviación estándar, fortalezas y áreas de desarrollo del equipo
  </p>
</motion.div>
```

---

### TAREA 5: Botón dinámico según estado

**Archivo:** Componente SpotlightCard en /evaluaciones

**Objetivo:** UX clara de acción vs edición

**Implementación:**

```tsx
<button
  onClick={() => setSelectedForPotential(employee)}
  className="px-4 py-2 rounded-xl font-medium transition-all
    bg-gradient-to-r from-amber-500 to-orange-500 
    hover:from-amber-400 hover:to-orange-400
    text-white shadow-lg shadow-amber-500/25"
>
  {employee.potentialScore 
    ? '✏️ Reevaluar Potencial' 
    : '⭐ Evaluar Potencial'
  }
</button>
```

**Variante con iconos Lucide:**
```tsx
import { Star, Pencil } from 'lucide-react'

{employee.potentialScore ? (
  <>
    <Pencil className="w-4 h-4 mr-1.5" />
    Reevaluar
  </>
) : (
  <>
    <Star className="w-4 h-4 mr-1.5" />
    Evaluar Potencial
  </>
)}
```

---

## 🔍 VERIFICACIÓN

Después de completar las 5 tareas:

```bash
npx tsc --noEmit
```

Debe dar 0 errores.

---

## 🧪 PRUEBAS MANUALES

1. [ ] /evaluaciones: Click "Evaluar Potencial" → Abre modal AAE
2. [ ] Modal: Seleccionar 3 factores → Preview 9-Box se actualiza
3. [ ] Modal: Guardar → Cierra modal, datos se actualizan
4. [ ] /evaluaciones: Empleado ya evaluado muestra "Reevaluar"
5. [ ] /evaluaciones: Click "Ver Resumen" → Navega a /ratings
6. [ ] /ratings: NO tiene modal ni botones de evaluación
7. [ ] /ratings: Header placeholder visible
8. [ ] /ratings: Lista muestra scores correctos
9. [ ] /ratings: "Ver 9-Box" funciona

---

## 📁 ARCHIVOS A MODIFICAR

```
src/app/dashboard/evaluaciones/page.tsx  (o componentes relacionados)
  → Agregar modal AAE
  → Agregar botón "Ver Resumen"
  → Botón dinámico Evaluar/Reevaluar

src/app/dashboard/performance/cycles/[cycleId]/ratings/page.tsx
  → Eliminar modal y lógica de evaluación
  → Agregar header placeholder

src/components/performance/RatingRow.tsx (si necesita ajustes)
  → Click no debe abrir nada en contexto /ratings
```

---

## ⏭️ FASE 2 (Después)

- Header con insights del jefe
- Distribución de notas (histograma)
- Desviación estándar
- Fortalezas y áreas de desarrollo del equipo
