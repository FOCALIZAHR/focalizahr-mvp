# 📋 TASK: Implementar Checkbox "Desactivar Empleados No Incluidos"

> **Archivo:** `.claude/task/implementacion-checkbox-autodeactivate-employees.md`
> **Fecha:** 2025-02-11
> **Prioridad:** Alta

---

## 🎯 OBJETIVO

Agregar checkbox en `EmployeeSyncWizard.tsx` que permita activar la funcionalidad `autoDeactivateMissing` que **YA EXISTE** en el backend pero nunca fue expuesta en la UI.

---

## 📍 CONTEXTO TÉCNICO VERIFICADO

### Backend YA IMPLEMENTADO ✅

**Archivo:** `src/lib/services/EmployeeSyncService.ts`

```typescript
// Líneas ~50-70 - YA EXISTE
interface EmployeeSyncConfig {
  mode: 'INCREMENTAL' | 'FULL';
  missingThreshold: number;           // default: 0.10 (10%)
  autoDeactivateMissing: boolean;     // default: false ← USAR ESTE
  preserveManualExclusions: boolean;  // default: true
}

export const DEFAULT_SYNC_CONFIG: EmployeeSyncConfig = {
  mode: 'FULL',
  missingThreshold: 0.10,  // ⚠️ TEMPORAL: Cambiar a 0.80 para testing
  autoDeactivateMissing: false,
  preserveManualExclusions: true
};
```

**API:** `src/app/api/admin/employees/sync/route.ts`
```typescript
// YA acepta config en body
const { employees, config } = body;
const result = await processEmployeeImport(
  targetAccountId,
  employees,
  { ...DEFAULT_SYNC_CONFIG, ...config },  // ← Ya hace merge
  userContext.userId
);
```

### Permisos RBAC
```typescript
// Roles que pueden hacer sync de empleados - TODOS VEN EL CHECKBOX
'employees:sync': ['FOCALIZAHR_ADMIN', 'ACCOUNT_OWNER', 'HR_ADMIN', 'HR_MANAGER']
```

### Frontend A MODIFICAR ❌

**Archivo:** `src/components/admin/employees/EmployeeSyncWizard.tsx`

---

## 📝 TAREAS ESPECÍFICAS

### TAREA 1: Modificar EmployeeSyncWizard.tsx

#### 1.1 Agregar Estados

```typescript
// Agregar junto a otros useState
const [autoDeactivateMissing, setAutoDeactivateMissing] = useState(false);
const [showDeactivateConfirmModal, setShowDeactivateConfirmModal] = useState(false);
const [pendingDeactivateCount, setPendingDeactivateCount] = useState(0);
```

#### 1.2 Agregar Imports

```typescript
import { 
  // ... existentes ...
  AlertTriangle, 
  XCircle, 
  Clock, 
  RotateCcw 
} from 'lucide-react';
```

#### 1.3 Agregar UI del Checkbox

Ubicar en el paso de preview, **visible para todos los usuarios** (ya están autorizados por RBAC):

```tsx
{/* OPCIÓN AVANZADA - Visible para todos (RBAC ya filtró acceso) */}
{step === 'preview' && (
  <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
    <div className="flex items-start gap-3">
      <div className="flex items-center h-6">
        <input
          type="checkbox"
          id="autoDeactivateMissing"
          checked={autoDeactivateMissing}
          onChange={(e) => setAutoDeactivateMissing(e.target.checked)}
          className="w-4 h-4 text-cyan-500 border-slate-600 rounded 
                     focus:ring-cyan-500 focus:ring-offset-slate-900 
                     bg-slate-800 cursor-pointer"
        />
      </div>
      <div className="flex-1">
        <label 
          htmlFor="autoDeactivateMissing" 
          className="font-medium text-slate-200 cursor-pointer"
        >
          Desactivar empleados no incluidos en el archivo
        </label>
        <p className="text-sm text-slate-400 mt-1">
          Los empleados activos que no aparezcan en este archivo serán 
          marcados como INACTIVE automáticamente.
        </p>
        
        {autoDeactivateMissing && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-amber-400">
                Esta opción desactivará empleados que no estén en el CSV. 
                Se solicitará confirmación antes de proceder.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

#### 1.4 Agregar Modal de Confirmación

Agregar antes del cierre del return principal:

```tsx
{/* MODAL CONFIRMACIÓN DESACTIVACIÓN MASIVA */}
{showDeactivateConfirmModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl 
                    max-w-md w-full mx-4 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-400">
            Confirmar Desactivación Masiva
          </h3>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-6">
        <p className="text-slate-300 mb-4">
          Se desactivarán <span className="font-bold text-red-400">
            {pendingDeactivateCount} empleados
          </span> que no están incluidos en el archivo cargado.
        </p>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-slate-400 mb-2">
            Esta acción:
          </h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Cambiará su estado a INACTIVE
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Quedará registrada en el historial
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-500" />
              Puede revertirse en futuros imports
            </li>
          </ul>
        </div>
        
        <p className="text-sm text-slate-400">
          ¿Desea continuar con la sincronización?
        </p>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 bg-slate-800/50 flex justify-end gap-3">
        <button
          onClick={() => {
            setShowDeactivateConfirmModal(false);
            setAutoDeactivateMissing(false);
          }}
          className="px-4 py-2 text-slate-300 hover:text-white 
                     hover:bg-slate-700 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            setShowDeactivateConfirmModal(false);
            executeSync(true);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white 
                     rounded-lg transition-colors font-medium"
        >
          Sí, Desactivar y Continuar
        </button>
      </div>
    </div>
  </div>
)}
```

#### 1.5 Modificar Función de Sync

Buscar la función que hace el fetch a `/api/admin/employees/sync` y modificarla:

```typescript
// Función para ejecutar el sync
const executeSync = async (confirmedDeactivate = false) => {
  setStep('uploading');
  setProgress(0);
  
  try {
    const token = localStorage.getItem('focalizahr_token');
    
    // ═══════════════════════════════════════════════════════════════
    // NUEVO: Preparar config con autoDeactivateMissing
    // ═══════════════════════════════════════════════════════════════
    const syncConfig = {
      autoDeactivateMissing: confirmedDeactivate ? autoDeactivateMissing : false
    };
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 15, 90));
    }, 300);
    
    const response = await fetch('/api/admin/employees/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employees: parsedEmployees,
        accountId: accountId,
        config: syncConfig    // ← NUEVO: Pasar configuración
      })
    });
    
    clearInterval(progressInterval);
    setProgress(100);
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error en sincronización');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NUEVO: Manejar respuesta AWAITING_CONFIRMATION
    // ═══════════════════════════════════════════════════════════════
    if (result.status === 'AWAITING_CONFIRMATION' && result.thresholdExceeded) {
      setPendingDeactivateCount(result.pendingReview);
      setShowDeactivateConfirmModal(true);
      setStep('preview');
      return;
    }
    
    setUploadResult(result);
    setStep('complete');
    
  } catch (error) {
    console.error('[EmployeeSyncWizard] Error:', error);
    setError(error instanceof Error ? error.message : 'Error desconocido');
    setStep('error');
  }
};
```

#### 1.6 Modificar Handler del Botón Confirmar

Buscar el handler del botón "Confirmar Carga" y reemplazar/modificar:

```typescript
const handleConfirmUpload = async () => {
  // Si autoDeactivateMissing está activo, verificar cantidad
  if (autoDeactivateMissing && existingEmployeesCount > parsedEmployees.length) {
    const potentialDeactivations = existingEmployeesCount - parsedEmployees.length;
    
    // Mostrar modal de confirmación
    setPendingDeactivateCount(potentialDeactivations);
    setShowDeactivateConfirmModal(true);
    return;
  }
  
  // Proceder directamente
  executeSync(autoDeactivateMissing);
};
```

---

### TAREA 2: Cambio Temporal para Testing

**Archivo:** `src/lib/services/EmployeeSyncService.ts`

```typescript
export const DEFAULT_SYNC_CONFIG: EmployeeSyncConfig = {
  mode: 'FULL',
  // ⚠️ TESTING: Threshold temporal 80% (producción debe ser 0.10)
  // TODO: Restaurar a 0.10 después de pruebas
  missingThreshold: 0.80,  // ORIGINAL: 0.10
  autoDeactivateMissing: false,
  preserveManualExclusions: true
};
```

---

## 🧪 TESTS A EJECUTAR

### Test 1: Visibilidad del Checkbox
```
1. Login como FOCALIZAHR_ADMIN → ✅ VE el checkbox
2. Login como ACCOUNT_OWNER → ✅ VE el checkbox
3. Login como HR_ADMIN → ✅ VE el checkbox
4. Login como HR_MANAGER → ✅ VE el checkbox
```

### Test 2: Checkbox OFF (Default)
```
1. Cargar CSV con 50 empleados
2. BD tiene 218 empleados
3. Dejar checkbox OFF
4. Confirmar
5. Resultado esperado: 50 procesados, 168 SIN CAMBIO
```

### Test 3: Checkbox ON con Confirmación
```
1. Cargar CSV con 50 empleados
2. BD tiene 218 empleados
3. Activar checkbox
4. Confirmar → Debe aparecer modal
5. Confirmar en modal
6. Resultado esperado: 50 procesados, 168 → INACTIVE
```

### Test 4: Cancelar en Modal
```
1. Activar checkbox
2. Confirmar → Aparece modal
3. Click "Cancelar"
4. Resultado: Vuelve a preview, checkbox se desactiva
```

---

## ✅ CHECKLIST DE COMPLETITUD

```
[ ] Estados agregados (autoDeactivateMissing, showModal, pendingCount)
[ ] Imports de iconos (AlertTriangle, XCircle, Clock, RotateCcw)
[ ] UI checkbox visible en paso preview
[ ] Warning visual cuando checkbox activo
[ ] Modal de confirmación
[ ] Función executeSync modificada con config
[ ] Handler handleConfirmUpload modificado
[ ] Threshold cambiado a 0.80 para testing (con comentario)
[ ] Test 1: Visibilidad checkbox ✓
[ ] Test 2: Checkbox OFF ✓
[ ] Test 3: Checkbox ON + Confirm ✓
[ ] Test 4: Cancelar modal ✓
[ ] RESTAURAR threshold a 0.10 después de pruebas
```

---

## ⚠️ NOTAS IMPORTANTES

1. **NO modificar el backend** - Ya está 100% implementado
2. **Solo UI en EmployeeSyncWizard.tsx**
3. **Threshold temporal** - Recuerda restaurar `0.10` en producción
4. **Visible para todos** - El RBAC ya controla quién accede a la página
