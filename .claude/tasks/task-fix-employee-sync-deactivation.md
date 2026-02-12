# TASK: Fix Employee Sync Deactivation - Loading State + Batches

## PROBLEMA
La desactivación masiva de empleados falla por dos razones:
1. El botón no tiene estado de carga, permitiendo múltiples clicks
2. El backend intenta desactivar todos de golpe, saturando el connection pool de Supabase

## ERROR ACTUAL
```
Timed out fetching a new connection from the connection pool
connection limit: 9
```

## ARCHIVOS A MODIFICAR

### 1. Frontend: `src/components/admin/employees/EmployeeSyncWizard.tsx`

**Agregar estado de loading:**
```typescript
const [isDeactivating, setIsDeactivating] = useState(false);
```

**Modificar el botón de confirmación:**
```typescript
<button
  onClick={handleConfirmDeactivate}
  disabled={isDeactivating}
  className="..."
>
  {isDeactivating ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      Procesando...
    </>
  ) : (
    'Sí, Desactivar y Continuar'
  )}
</button>
```

**En la función de confirmación:**
```typescript
const handleConfirmDeactivate = async () => {
  setIsDeactivating(true);
  try {
    // llamada al API
  } finally {
    setIsDeactivating(false);
  }
};
```

### 2. Backend: `src/lib/services/EmployeeSyncService.ts`

**Buscar donde se procesan los empleados ausentes (autoDeactivateMissing = true)**

**Cambiar de loop simple a batches de 20:**

```typescript
// ANTES (causa timeout):
for (const emp of missing) {
  await tx.employee.update({
    where: { id: emp.id },
    data: { status: 'INACTIVE', isActive: false, terminatedAt: new Date() }
  });
}

// DESPUÉS (con batches):
const DEACTIVATE_BATCH_SIZE = 20;
const missingChunks = chunkArray(missing, DEACTIVATE_BATCH_SIZE);

for (const chunk of missingChunks) {
  await Promise.all(
    chunk.map(emp =>
      tx.employee.update({
        where: { id: emp.id },
        data: {
          status: 'INACTIVE',
          isActive: false,
          terminatedAt: new Date(),
          terminationReason: 'not_in_import'
        }
      })
    )
  );
  
  // Pequeña pausa entre batches para no saturar
  if (missingChunks.indexOf(chunk) < missingChunks.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

**Verificar que chunkArray existe (debería estar al inicio del archivo):**
```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

## PRUEBA DE VALIDACIÓN

1. Subir CSV con 50 empleados (hay 217 activos en BD)
2. Marcar checkbox "Desactivar empleados no incluidos"
3. Click en "Aceptar"
4. Modal muestra "167 empleados serán desactivados"
5. Click en "Sí, Desactivar y Continuar"
6. **Botón debe mostrar "Procesando..." y estar deshabilitado**
7. **No debe haber error de connection pool**
8. Verificar en BD: 50 ACTIVE, 167 INACTIVE

## RESULTADO ESPERADO

```sql
SELECT status, COUNT(*) 
FROM employees 
WHERE account_id = 'cmfgedx7b00012413i92048wl'
GROUP BY status;

-- Debe mostrar:
-- ACTIVE: 50
-- INACTIVE: 168 (167 + 1 que ya estaba)
```
