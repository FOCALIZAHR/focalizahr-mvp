# TASK_FIX_02: Wizard Campaña - Cargar Dotación Inline

## PROBLEMA IDENTIFICADO

**Archivo:** `src/app/dashboard/campaigns/new/page.tsx`
**Líneas:** 1009-1025

```typescript
// CÓDIGO ACTUAL (ROMPE EL FLUJO):
) : employees.length === 0 ? (
  <Card className="professional-card">
    <CardContent className="p-8 text-center">
      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">Sin Empleados</h3>
      <p className="text-muted-foreground mb-4">
        No hay empleados registrados en tu empresa. Primero debes cargar
        la nómina desde la sección de Colaboradores.
      </p>
      <Button
        variant="outline"
        onClick={() => router.push('/dashboard/employees')}  // ← ABANDONA WIZARD
      >
        Ir a Colaboradores
      </Button>
    </CardContent>
  </Card>
```

**Resultado:** Usuario pierde el wizard de campaña y debe empezar de nuevo.

---

## SOLUCIÓN

Abrir `EmployeeSyncWizard` como modal INLINE sin cambiar de ruta.

### Paso 1: Agregar import

```typescript
// Línea ~43, junto a los otros imports de job-classification
import EmployeeSyncWizard from '@/components/admin/employees/EmployeeSyncWizard';
```

### Paso 2: Agregar estado

```typescript
// Línea ~155, junto a los otros estados de employee-based flow
const [showEmployeeSyncWizard, setShowEmployeeSyncWizard] = useState(false);
```

### Paso 3: Reemplazar el Card de "Sin Empleados" (líneas 1009-1025)

```typescript
) : employees.length === 0 ? (
  <>
    <Card className="professional-card">
      <CardContent className="p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Sin Empleados</h3>
        <p className="text-muted-foreground mb-4">
          No hay empleados registrados en tu empresa. Carga tu nómina
          para continuar con la creación de la campaña.
        </p>
        <Button
          className="btn-gradient"
          onClick={() => setShowEmployeeSyncWizard(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Cargar Colaboradores
        </Button>
      </CardContent>
    </Card>

    {/* Modal EmployeeSyncWizard */}
    {showEmployeeSyncWizard && (
      <EmployeeSyncWizard
        onComplete={async () => {
          // Cerrar wizard
          setShowEmployeeSyncWizard(false);
          // Recargar empleados
          setIsLoadingEmployees(true);
          try {
            const token = localStorage.getItem('focalizahr_token');
            const response = await fetch('/api/admin/employees?limit=1000&status=ACTIVE', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            if (data.success && data.data) {
              const mappedEmployees = data.data.map((emp: any) => ({
                id: emp.id,
                fullName: emp.fullName,
                email: emp.email,
                nationalId: emp.nationalId,
                position: emp.position,
                hireDate: emp.hireDate,
                status: emp.status,
                managerId: emp.managerId,
                department: emp.department ? {
                  id: emp.department.id,
                  displayName: emp.department.displayName
                } : null
              }));
              setEmployees(mappedEmployees);
              // Extraer departamentos únicos
              const deptMap = new Map();
              mappedEmployees.forEach((emp: any) => {
                if (emp.department) {
                  deptMap.set(emp.department.id, emp.department);
                }
              });
              setDepartments(Array.from(deptMap.values()));
            }
          } catch (error) {
            console.error('Error reloading employees:', error);
          } finally {
            setIsLoadingEmployees(false);
          }
        }}
        onCancel={() => setShowEmployeeSyncWizard(false)}
      />
    )}
  </>
```

### Paso 4: Agregar Upload a los imports de lucide-react (línea 12-28)

Verificar que `Upload` ya esté importado. Si no:
```typescript
import {
  // ... otros iconos existentes
  Upload,  // ← Agregar si no existe
} from 'lucide-react';
```

---

## VERIFICACIÓN

1. Ir a `/dashboard/campaigns/new`
2. Seleccionar tipo de estudio con `flowType: 'employee-based'` (ej: Evaluación 360)
3. Avanzar al paso 2
4. Debe mostrar "Sin Empleados" con botón "Cargar Colaboradores"
5. Click en botón → Abre modal EmployeeSyncWizard
6. Cargar CSV → Completar
7. ✅ Modal cierra, empleados aparecen en el wizard
8. ✅ Wizard de campaña NO se pierde

---

## ARCHIVOS A MODIFICAR

```yaml
src/app/dashboard/campaigns/new/page.tsx:
  - Agregar import: EmployeeSyncWizard
  - Agregar estado: showEmployeeSyncWizard
  - Reemplazar Card "Sin Empleados" (líneas 1009-1025)
```

## NO MODIFICAR

- `EmployeeSyncWizard.tsx` (ya funciona correctamente)
- APIs de empleados
- Otros componentes del wizard
