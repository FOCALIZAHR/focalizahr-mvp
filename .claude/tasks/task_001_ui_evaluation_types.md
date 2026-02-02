# 🎯 TAREA: UI Selección Tipos de Evaluación en Wizard

## CONTEXTO

El backend de evaluación de desempeño 360° está **100% implementado** con los 4 tipos:
- `generateManagerEvaluations()` ✅
- `generateSelfEvaluations()` ✅
- `generateUpwardEvaluations()` ✅
- `generatePeerEvaluations()` ✅

El endpoint `/api/admin/performance-cycles/[id]/generate` ya usa los flags del ciclo:
```typescript
if (cycle.includesSelf) results.self = await generateSelfEvaluations(...);
if (cycle.includesManager) results.manager = await generateManagerEvaluations(...);
if (cycle.includesUpward) results.upward = await generateUpwardEvaluations(...);
if (cycle.includesPeer) results.peer = await generatePeerEvaluations(...);
```

**PROBLEMA:** El wizard de creación de campañas NO tiene UI para seleccionar qué tipos incluir, y NO envía los flags al crear el ciclo.

---

## OBJETIVO

Agregar checkboxes en el wizard para que el usuario seleccione qué tipos de evaluación incluir al crear un ciclo de evaluación de desempeño.

---

## ARCHIVOS A MODIFICAR

### 1. `src/app/dashboard/campaigns/new/page.tsx`

**Agregar estado para tipos de evaluación:**
```typescript
const [evaluationTypes, setEvaluationTypes] = useState({
  includesManager: true,    // Default: ON (jefe → colaborador)
  includesSelf: false,      // Default: OFF
  includesUpward: false,    // Default: OFF
  includesPeer: false       // Default: OFF
});
```

**Agregar UI de checkboxes** (mostrar solo cuando `flowType === 'employee-based'`):

```tsx
{selectedCampaignType?.flowType === 'employee-based' && (
  <div className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
    <h4 className="text-sm font-medium text-white flex items-center gap-2">
      <Users className="w-4 h-4 text-cyan-400" />
      Tipos de Evaluación a Incluir
    </h4>
    <p className="text-xs text-slate-400">
      Selecciona las perspectivas que deseas incluir en este ciclo de evaluación.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Jefe → Colaborador */}
      <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 cursor-pointer hover:border-cyan-500/30 transition-colors">
        <input
          type="checkbox"
          checked={evaluationTypes.includesManager}
          onChange={(e) => setEvaluationTypes(prev => ({
            ...prev,
            includesManager: e.target.checked
          }))}
          className="mt-1 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
        />
        <div>
          <span className="text-sm font-medium text-white">Jefe → Colaborador</span>
          <p className="text-xs text-slate-400 mt-0.5">
            El supervisor evalúa a sus reportes directos
          </p>
        </div>
      </label>

      {/* Autoevaluación */}
      <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 cursor-pointer hover:border-cyan-500/30 transition-colors">
        <input
          type="checkbox"
          checked={evaluationTypes.includesSelf}
          onChange={(e) => setEvaluationTypes(prev => ({
            ...prev,
            includesSelf: e.target.checked
          }))}
          className="mt-1 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
        />
        <div>
          <span className="text-sm font-medium text-white">Autoevaluación</span>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada persona evalúa su propio desempeño
          </p>
        </div>
      </label>

      {/* Colaborador → Jefe (Upward) */}
      <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 cursor-pointer hover:border-cyan-500/30 transition-colors">
        <input
          type="checkbox"
          checked={evaluationTypes.includesUpward}
          onChange={(e) => setEvaluationTypes(prev => ({
            ...prev,
            includesUpward: e.target.checked
          }))}
          className="mt-1 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
        />
        <div>
          <span className="text-sm font-medium text-white">Colaborador → Jefe</span>
          <p className="text-xs text-slate-400 mt-0.5">
            Feedback ascendente anónimo (mín. 3 subordinados)
          </p>
        </div>
      </label>

      {/* Entre Pares */}
      <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 cursor-pointer hover:border-cyan-500/30 transition-colors">
        <input
          type="checkbox"
          checked={evaluationTypes.includesPeer}
          onChange={(e) => setEvaluationTypes(prev => ({
            ...prev,
            includesPeer: e.target.checked
          }))}
          className="mt-1 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
        />
        <div>
          <span className="text-sm font-medium text-white">Entre Pares</span>
          <p className="text-xs text-slate-400 mt-0.5">
            Colegas del mismo departamento se evalúan mutuamente
          </p>
        </div>
      </label>
    </div>

    {/* Validación: al menos uno seleccionado */}
    {!evaluationTypes.includesManager && !evaluationTypes.includesSelf && 
     !evaluationTypes.includesUpward && !evaluationTypes.includesPeer && (
      <p className="text-xs text-amber-400 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Selecciona al menos un tipo de evaluación
      </p>
    )}
  </div>
)}
```

**Modificar el POST a `/api/admin/performance-cycles`:**

Buscar donde se hace el fetch para crear el PerformanceCycle y agregar los flags:

```typescript
const cycleResponse = await fetch('/api/admin/performance-cycles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignId: createdCampaign.id,
    name: formData.name.trim(),
    description: formData.description?.trim() || null,
    startDate: formData.startDate,
    endDate: formData.endDate,
    // ═══════════════════════════════════════════════════
    // AGREGAR: Flags de tipos de evaluación
    // ═══════════════════════════════════════════════════
    ...evaluationTypes  // includesManager, includesSelf, includesUpward, includesPeer
  })
});
```

---

## VALIDACIONES

1. **Al menos un tipo debe estar seleccionado** antes de permitir continuar
2. **Solo mostrar la sección** cuando `flowType === 'employee-based'`
3. **Default: Solo `includesManager: true`** (evaluación tradicional jefe→colaborador)

---

## VERIFICACIÓN

Después de implementar:

1. Ir a `/dashboard/campaigns/new`
2. Seleccionar "Evaluación de Desempeño" como tipo
3. Verificar que aparecen los 4 checkboxes
4. Crear un ciclo con `includesSelf: true`
5. Verificar en BD que `performance_cycles.includes_self = true`
6. Ejecutar `/generate` y verificar que genera evaluaciones SELF

---

## NOTAS TÉCNICAS

- El API `POST /api/admin/performance-cycles` **YA acepta** estos campos (verificado en código)
- El schema Prisma **YA tiene** los campos: `includesManager`, `includesSelf`, `includesUpward`, `includesPeer`
- NO se requieren cambios en backend, solo frontend

---

## IMPORTS NECESARIOS

```typescript
import { Users, AlertTriangle } from 'lucide-react';
```

Si `Users` ya está importado, solo agregar `AlertTriangle`.
