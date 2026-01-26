# 🎯 TASK 01: WIZARD PASO 3B - CRITERIOS DE INCLUSIÓN

## CONTEXTO
Employee Performance tiene un wizard de 4 pasos para crear campañas.
El Paso 3 cambia según el `flowType` del CampaignType:
- `flowType: 'standard'` → CSV upload (YA EXISTE)
- `flowType: 'employee-based'` → Criterios + generación automática (CREAR)

---

## OBJETIVO
Crear el Paso 3B del wizard que permite:
1. Definir criterios de inclusión (antigüedad, departamentos, exclusiones)
2. Ver preview en tiempo real de empleados elegibles
3. Ajustar manualmente la selección

---

## COMPONENTES A CREAR

### 1. ParticipantCriteriaSelector.tsx
```
Ubicación: src/components/campaigns/wizard/ParticipantCriteriaSelector.tsx
```

```typescript
interface ParticipantCriteriaSelectorProps {
  employees: Employee[];
  onCriteriaChange: (criteria: InclusionCriteria) => void;
  initialCriteria?: InclusionCriteria;
}

interface InclusionCriteria {
  minTenureMonths: number;        // 0, 1, 3, 6, 12
  departments: string[] | 'all';  // IDs o 'all'
  excludeProbation: boolean;      // Excluir periodo prueba
  excludeOnLeave: boolean;        // Excluir licencia activa
  excludeWithoutManager: boolean; // Excluir sin jefe asignado
}
```

**UI:**
- Dropdown "Antigüedad mínima": 0, 1, 3, 6, 12 meses
- Radio "Departamentos": Todos / Seleccionar específicos
- Checkboxes de exclusiones automáticas
- Preview en tiempo real: X elegibles / Y excluidos

---

### 2. ParticipantEligibilityPreview.tsx
```
Ubicación: src/components/campaigns/wizard/ParticipantEligibilityPreview.tsx
```

```typescript
interface ParticipantEligibilityPreviewProps {
  employees: Employee[];
  criteria: InclusionCriteria;
  manualExclusions: string[];  // employee IDs excluidos manualmente
  onManualExclusionChange: (employeeId: string, excluded: boolean) => void;
  onOpenAdjustment: () => void;  // Abrir modal de ajuste
}
```

**UI:**
- 3 cards métricas: Elegibles (cyan), Excluidos (amber), Total (slate)
- Breakdown de exclusiones por razón
- Botón "Ver Lista Completa" → abre modal

---

### 3. ParticipantManualAdjustment.tsx
```
Ubicación: src/components/campaigns/wizard/ParticipantManualAdjustment.tsx
```

```typescript
interface ParticipantManualAdjustmentProps {
  employees: Employee[];
  criteria: InclusionCriteria;
  manualExclusions: string[];
  onManualExclusionChange: (employeeId: string, excluded: boolean) => void;
  onClose: () => void;
}
```

**UI:**
- Modal/Dialog fullscreen
- Filtros: Búsqueda, Departamento, Estado (Todos/Incluidos/Excluidos)
- Tabla con columnas: Checkbox, Nombre, Depto, Antigüedad, Estado
- Estados de fila:
  - ✓ Incluido (checkbox habilitado, bg-white)
  - 🔒 Excluido por criterio (checkbox disabled, bg-slate-50, tooltip)
  - ⚠️ Excluido manual (checkbox habilitado, bg-amber-50)
- Paginación
- Resumen sticky en footer

---

### 4. EmployeeEligibilityRow.tsx
```
Ubicación: src/components/campaigns/wizard/EmployeeEligibilityRow.tsx
```

```typescript
interface EmployeeEligibilityRowProps {
  employee: Employee;
  status: 'included' | 'excludedByCriteria' | 'excludedManually';
  exclusionReason?: string;  // "Antigüedad < 3 meses"
  onToggle: (excluded: boolean) => void;
  disabled?: boolean;
}
```

---

## LÓGICA DE ELEGIBILIDAD

```typescript
function calculateEligibility(
  employee: Employee,
  criteria: InclusionCriteria,
  manualExclusions: string[]
): { eligible: boolean; reason?: string } {
  
  // 1. Verificar exclusión manual primero
  if (manualExclusions.includes(employee.id)) {
    return { eligible: false, reason: 'Excluido manualmente' };
  }
  
  // 2. Verificar antigüedad
  const tenureMonths = calculateTenureMonths(employee.hireDate);
  if (tenureMonths < criteria.minTenureMonths) {
    return { 
      eligible: false, 
      reason: `Antigüedad ${tenureMonths}m < ${criteria.minTenureMonths}m requeridos` 
    };
  }
  
  // 3. Verificar departamento
  if (criteria.departments !== 'all') {
    if (!criteria.departments.includes(employee.departmentId)) {
      return { eligible: false, reason: 'Departamento no seleccionado' };
    }
  }
  
  // 4. Verificar periodo de prueba
  if (criteria.excludeProbation && employee.isOnProbation) {
    return { eligible: false, reason: 'En periodo de prueba' };
  }
  
  // 5. Verificar licencia
  if (criteria.excludeOnLeave && employee.isOnLeave) {
    return { eligible: false, reason: 'Con licencia activa' };
  }
  
  // 6. Verificar jefe asignado
  if (criteria.excludeWithoutManager && !employee.managerId) {
    return { eligible: false, reason: 'Sin jefe asignado' };
  }
  
  return { eligible: true };
}
```

---

## INTEGRACIÓN CON WIZARD EXISTENTE

Modificar `CreateCampaignWizard.tsx` (o equivalente):

```typescript
// En el paso 3, detectar flowType
const campaignType = selectedCampaignType;

if (campaignType?.flowType === 'employee-based') {
  // Mostrar Paso 3B (criterios)
  return <ParticipantCriteriaStep ... />;
} else {
  // Mostrar Paso 3A (CSV upload existente)
  return <ParticipantUploadStep ... />;
}
```

---

## API NECESARIA

```typescript
// GET /api/employees/eligible
// Query: ?criteria={JSON encoded}
// Response: Employee[] con campo calculado eligibilityStatus

// Si no existe, crear endpoint que:
// 1. Obtiene empleados del account
// 2. Aplica criterios
// 3. Retorna con status de elegibilidad
```

---

## ESTILOS (usar clases .fhr-*)

```yaml
Cards métricas: fhr-card-metric
Card contenedor: fhr-card
Botón principal: fhr-btn-primary
Botón secundario: fhr-btn-secondary
Botón ghost: fhr-btn-ghost
Colores:
  - Elegibles: cyan (#22D3EE)
  - Excluidos: amber (#F59E0B)
  - Total: slate
```

---

## CRITERIO DE ÉXITO

- [ ] ParticipantCriteriaSelector renderiza y emite cambios
- [ ] Preview actualiza en tiempo real al cambiar criterios
- [ ] Modal de ajuste permite excluir/incluir manualmente
- [ ] Empleados excluidos por criterio NO son editables
- [ ] Wizard detecta flowType y muestra paso correcto
- [ ] TypeScript sin errores
- [ ] Responsive (375px mínimo)

---

## ARCHIVOS A CREAR

```
src/components/campaigns/wizard/
  ParticipantCriteriaSelector.tsx
  ParticipantEligibilityPreview.tsx
  ParticipantManualAdjustment.tsx
  EmployeeEligibilityRow.tsx
```

## ARCHIVOS A MODIFICAR

```
src/components/campaigns/wizard/CreateCampaignWizard.tsx (o equivalente)
  - Agregar lógica flowType
  - Importar nuevos componentes
```
