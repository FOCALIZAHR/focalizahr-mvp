# 🔄 TAREA: DÍA 2 - Employee Sync Service

## OBJETIVO
Implementar el servicio de sincronización de empleados con:
- Fix N+1 (pre-carga de managers)
- Fix Zombies (reactivación automática)
- Threshold protection (10%)

## PREREQUISITO
✅ Día 1 completado (schema.prisma con Employee, EmployeeHistory, EmployeeImport)

---

## ENTREGABLES DÍA 2

```
□ src/lib/services/EmployeeSyncService.ts
□ Función processEmployeeImport()
□ Función mapIsActiveToStatus()
□ Función detectChanges()
□ Función normalizeRut() y validateRut()
□ Tests manuales con datos de prueba
```

---

## FORMATO CSV ESTÁNDAR (Fase 1)

El cliente usa este formato exacto. Campo `isActive` es **OBLIGATORIO**.

```csv
nationalId,fullName,email,phoneNumber,departmentName,managerRut,position,jobTitle,seniorityLevel,hireDate,isActive
12345678-9,Juan Pérez,juan@empresa.cl,+56912345678,Gerencia General,,CEO,Chief Executive Officer,executive,2020-01-15,true
12345678-K,María García,maria@empresa.cl,+56987654321,Gerencia Comercial,12345678-9,Gerente Comercial,Sales Director,lead,2021-03-01,true
22222222-2,Ana Torres,ana@empresa.cl,,Ventas Nacional,12345678-K,Vendedora,Sales Rep,mid,2023-01-10,false
```

**Valores válidos para isActive:** `true`, `false`, `1`, `0`, `yes`, `no`, `si`, `activo`, `inactivo`

---

## CÓDIGO A IMPLEMENTAR

### 1. Archivo: src/lib/services/EmployeeSyncService.ts

```typescript
// src/lib/services/EmployeeSyncService.ts

import { prisma } from '@/lib/prisma';
import { Employee, EmployeeStatus, EmployeeChangeType } from '@prisma/client';

// ════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface EmployeeRow {
  nationalId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  departmentName: string;
  managerRut?: string;
  position?: string;
  jobTitle?: string;
  seniorityLevel?: string;
  hireDate: string;
  isActive: boolean | string;
  // Campo calculado internamente
  resolvedManagerId?: string | null;
  resolvedDepartmentId?: string;
}

export interface EmployeeSyncConfig {
  mode: 'INCREMENTAL' | 'FULL';
  missingThreshold: number;
  autoDeactivateMissing: boolean;
  preserveManualExclusions: boolean;
}

export interface ImportResult {
  status: 'COMPLETED' | 'AWAITING_CONFIRMATION' | 'FAILED';
  importId: string;
  created: number;
  updated: number;
  rehired: number;
  pendingReview: number;
  errors: number;
  cycleWarnings: number;
}

interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

interface ImportError {
  nationalId: string;
  error: string;
}

interface CycleWarning {
  nationalId: string;
  managerRut: string;
  warning: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN POR DEFECTO
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_SYNC_CONFIG: EmployeeSyncConfig = {
  mode: 'FULL',
  missingThreshold: 0.10,  // 10%
  autoDeactivateMissing: false,
  preserveManualExclusions: true
};

// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza RUT chileno: quita puntos, guión, lowercase
 */
export function normalizeRut(rut: string): string {
  return rut
    .replace(/\./g, '')
    .replace(/-/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Valida RUT chileno con módulo 11
 */
export function validateRut(rut: string): boolean {
  const normalized = normalizeRut(rut);
  if (normalized.length < 8 || normalized.length > 9) return false;
  
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const dvMap: { [key: number]: string } = { 11: '0', 10: 'k' };
  const expected = dvMap[expectedDv] || expectedDv.toString();
  
  return dv === expected;
}

/**
 * Mapea isActive a EmployeeStatus
 */
export function mapIsActiveToStatus(isActive: boolean | string): EmployeeStatus {
  const active = typeof isActive === 'string'
    ? ['true', '1', 'yes', 'si', 'activo'].includes(isActive.toLowerCase().trim())
    : isActive;
  
  return active ? 'ACTIVE' : 'INACTIVE';
}

/**
 * Detecta cambios entre empleado actual y datos nuevos
 */
function detectChanges(
  current: Employee,
  newData: EmployeeRow,
  resolvedManagerId: string | null
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  const fieldsToCompare: Array<{ field: keyof Employee; newField: keyof EmployeeRow }> = [
    { field: 'fullName', newField: 'fullName' },
    { field: 'email', newField: 'email' },
    { field: 'phoneNumber', newField: 'phoneNumber' },
    { field: 'position', newField: 'position' },
    { field: 'jobTitle', newField: 'jobTitle' },
    { field: 'seniorityLevel', newField: 'seniorityLevel' },
  ];
  
  for (const { field, newField } of fieldsToCompare) {
    const oldVal = current[field] as string | null;
    const newVal = newData[newField] as string | undefined;
    if (oldVal !== (newVal || null)) {
      changes.push({ field, oldValue: oldVal, newValue: newVal || null });
    }
  }
  
  // Manager
  if (current.managerId !== resolvedManagerId) {
    changes.push({
      field: 'managerId',
      oldValue: current.managerId,
      newValue: resolvedManagerId
    });
  }
  
  // Status (basado en isActive)
  const newStatus = mapIsActiveToStatus(newData.isActive);
  if (current.status !== newStatus) {
    changes.push({
      field: 'status',
      oldValue: current.status,
      newValue: newStatus
    });
  }
  
  return changes;
}

/**
 * Mapea tipo de cambio desde nombre de campo
 */
function mapFieldToChangeType(field: string): EmployeeChangeType {
  switch (field) {
    case 'managerId': return 'MANAGER_CHANGE';
    case 'departmentId': return 'TRANSFER';
    case 'position':
    case 'jobTitle':
    case 'seniorityLevel': return 'PROMOTION';
    case 'status': return 'UPDATE';
    default: return 'UPDATE';
  }
}

/**
 * Mapea campos de EmployeeRow a datos para Prisma
 */
function mapEmployeeFields(row: EmployeeRow) {
  return {
    fullName: row.fullName,
    email: row.email || null,
    phoneNumber: row.phoneNumber || null,
    position: row.position || null,
    jobTitle: row.jobTitle || null,
    seniorityLevel: row.seniorityLevel || null,
    managerId: row.resolvedManagerId || null,
    departmentId: row.resolvedDepartmentId!,
    status: mapIsActiveToStatus(row.isActive),
    isActive: mapIsActiveToStatus(row.isActive) === 'ACTIVE'
  };
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE SYNC
// ════════════════════════════════════════════════════════════════════════════

/**
 * Procesa import de empleados con protección threshold
 * FIX N+1: Pre-carga managers en memoria con Map
 * FIX ZOMBIES: Reactiva empleados INACTIVE que reaparecen
 */
export async function processEmployeeImport(
  accountId: string,
  fileData: EmployeeRow[],
  config: EmployeeSyncConfig = DEFAULT_SYNC_CONFIG,
  userId?: string
): Promise<ImportResult> {

  // 1. Crear registro de import
  const importRecord = await prisma.employeeImport.create({
    data: {
      accountId,
      importMode: config.mode,
      totalInFile: fileData.length,
      status: 'VALIDATING',
      executedBy: userId
    }
  });

  try {
    // ════════════════════════════════════════════════════════════════════════
    // FIX ZOMBIES: Obtener TODOS los empleados, no solo activos
    // ════════════════════════════════════════════════════════════════════════
    const allEmployees = await prisma.employee.findMany({
      where: { accountId }
    });
    
    const activeEmployees = allEmployees.filter(e => 
      ['ACTIVE', 'ON_LEAVE'].includes(e.status)
    );

    // ════════════════════════════════════════════════════════════════════════
    // FIX N+1: PRE-CARGAR MANAGERS EN MEMORIA
    // ════════════════════════════════════════════════════════════════════════
    const allManagerRuts = fileData
      .map(e => e.managerRut)
      .filter((rut): rut is string => !!rut)
      .map(rut => normalizeRut(rut));
    
    const existingManagers = allManagerRuts.length > 0 
      ? await prisma.employee.findMany({
          where: { 
            accountId, 
            nationalId: { in: [...new Set(allManagerRuts)] }
          },
          select: { id: true, nationalId: true }
        })
      : [];
    
    const managerMap = new Map<string, string>(
      existingManagers.map(m => [m.nationalId, m.id])
    );
    
    console.log(`[Import] Pre-cargados ${managerMap.size} managers`);

    // ════════════════════════════════════════════════════════════════════════
    // RESOLVER DEPARTAMENTOS
    // ════════════════════════════════════════════════════════════════════════
    const departmentNames = [...new Set(fileData.map(e => e.departmentName))];
    const existingDepts = await prisma.department.findMany({
      where: { accountId, displayName: { in: departmentNames } },
      select: { id: true, displayName: true }
    });
    
    const deptMap = new Map(existingDepts.map(d => [d.displayName, d.id]));
    
    // Crear departamentos faltantes
    for (const deptName of departmentNames) {
      if (!deptMap.has(deptName)) {
        const newDept = await prisma.department.create({
          data: {
            accountId,
            displayName: deptName,
            standardCategory: 'sin_asignar',
            unitType: 'departamento',
            level: 3,
            isActive: true
          }
        });
        deptMap.set(deptName, newDept.id);
        console.log(`[Import] Creado departamento: ${deptName}`);
      }
    }

    // Crear mapas por RUT
    const fileMap = new Map(fileData.map(e => [normalizeRut(e.nationalId), e]));
    const allEmployeesMap = new Map(allEmployees.map(e => [e.nationalId, e]));

    // ════════════════════════════════════════════════════════════════════════
    // CLASIFICAR: CREATE, UPDATE, REHIRE, MISSING
    // ════════════════════════════════════════════════════════════════════════
    const toCreate: EmployeeRow[] = [];
    const toUpdate: { current: Employee; newData: EmployeeRow; changes: FieldChange[] }[] = [];
    const toRehire: { current: Employee; newData: EmployeeRow }[] = [];
    const missing: Employee[] = [];
    const errors: ImportError[] = [];
    const cycleWarnings: CycleWarning[] = [];

    for (const [rut, fileEmp] of fileMap) {
      // Validar RUT
      if (!validateRut(rut)) {
        errors.push({ nationalId: rut, error: 'RUT inválido' });
        continue;
      }

      // Resolver manager
      let managerId: string | null = null;
      if (fileEmp.managerRut) {
        const managerRut = normalizeRut(fileEmp.managerRut);
        managerId = managerMap.get(managerRut) || null;
        
        if (!managerId) {
          cycleWarnings.push({
            nationalId: rut,
            managerRut: fileEmp.managerRut,
            warning: 'Manager no encontrado, se asignará NULL'
          });
        }
      }

      // Resolver departamento
      const deptId = deptMap.get(fileEmp.departmentName);
      if (!deptId) {
        errors.push({ nationalId: rut, error: `Departamento no encontrado: ${fileEmp.departmentName}` });
        continue;
      }

      // Agregar campos resueltos
      fileEmp.resolvedManagerId = managerId;
      fileEmp.resolvedDepartmentId = deptId;

      const existing = allEmployeesMap.get(rut);
      
      if (existing) {
        // FIX ZOMBIES: Si está INACTIVE, es recontratación
        if (existing.status === 'INACTIVE') {
          console.log(`[Import] 🧟 ZOMBIE detectado: ${existing.fullName}`);
          toRehire.push({ current: existing, newData: fileEmp });
          continue;
        }
        
        // Employee activo - verificar cambios
        const changes = detectChanges(existing, fileEmp, managerId);
        if (changes.length > 0) {
          toUpdate.push({ current: existing, newData: fileEmp, changes });
        }
      } else {
        toCreate.push(fileEmp);
      }
    }

    // Detectar ausentes (solo en FULL)
    if (config.mode === 'FULL') {
      for (const emp of activeEmployees) {
        if (!fileMap.has(emp.nationalId)) {
          if (config.preserveManualExclusions && emp.status === 'EXCLUDED') {
            continue;
          }
          missing.push(emp);
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // VALIDAR THRESHOLD
    // ════════════════════════════════════════════════════════════════════════
    const missingPercent = activeEmployees.length > 0 
      ? missing.length / activeEmployees.length 
      : 0;
    
    if (missingPercent > config.missingThreshold) {
      await prisma.employeeImport.update({
        where: { id: importRecord.id },
        data: {
          status: 'AWAITING_CONFIRMATION',
          missingCount: missing.length,
          missingPercent,
          thresholdExceeded: true,
          errors: errors.length
        }
      });

      return {
        status: 'AWAITING_CONFIRMATION',
        importId: importRecord.id,
        created: toCreate.length,
        updated: toUpdate.length,
        rehired: toRehire.length,
        pendingReview: missing.length,
        errors: errors.length,
        cycleWarnings: cycleWarnings.length
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // EJECUTAR CAMBIOS EN TRANSACCIÓN
    // ════════════════════════════════════════════════════════════════════════
    await prisma.$transaction(async (tx) => {
      // CREAR NUEVOS
      for (const emp of toCreate) {
        const newEmployee = await tx.employee.create({
          data: {
            accountId,
            nationalId: normalizeRut(emp.nationalId),
            ...mapEmployeeFields(emp),
            hireDate: new Date(emp.hireDate),
            importSource: 'BULK_IMPORT',
            lastImportId: importRecord.id,
            lastSeenInImport: new Date()
          }
        });

        await tx.employeeHistory.create({
          data: {
            employeeId: newEmployee.id,
            accountId,
            changeType: 'HIRE',
            fieldName: 'status',
            newValue: 'ACTIVE',
            departmentId: emp.resolvedDepartmentId,
            managerId: emp.resolvedManagerId,
            position: emp.position,
            changeSource: 'BULK_IMPORT',
            importId: importRecord.id,
            changedBy: userId
          }
        });
      }

      // ACTUALIZAR EXISTENTES
      for (const { current, newData, changes } of toUpdate) {
        for (const change of changes) {
          await tx.employeeHistory.create({
            data: {
              employeeId: current.id,
              accountId,
              changeType: mapFieldToChangeType(change.field),
              fieldName: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              changeSource: 'BULK_IMPORT',
              importId: importRecord.id,
              changedBy: userId
            }
          });
        }

        await tx.employee.update({
          where: { id: current.id },
          data: {
            ...mapEmployeeFields(newData),
            lastImportId: importRecord.id,
            lastSeenInImport: new Date()
          }
        });
      }

      // REACTIVAR ZOMBIES
      for (const { current, newData } of toRehire) {
        const newTenure = current.tenureCount + 1;
        
        await tx.employee.update({
          where: { id: current.id },
          data: {
            ...mapEmployeeFields(newData),
            status: 'ACTIVE',
            isActive: true,
            rehireDate: new Date(),
            tenureCount: newTenure,
            terminatedAt: null,
            terminationReason: null,
            pendingReview: false,
            pendingReviewReason: null,
            lastImportId: importRecord.id,
            lastSeenInImport: new Date()
          }
        });

        await tx.employeeHistory.create({
          data: {
            employeeId: current.id,
            accountId,
            changeType: 'REHIRE',
            fieldName: 'status',
            oldValue: 'INACTIVE',
            newValue: 'ACTIVE',
            departmentId: newData.resolvedDepartmentId,
            managerId: newData.resolvedManagerId,
            position: newData.position,
            changeSource: 'BULK_IMPORT',
            importId: importRecord.id,
            changeReason: `Recontratación automática (tenure #${newTenure})`,
            changedBy: userId
          }
        });

        console.log(`[Import] ✅ Zombie reactivado: ${current.fullName} (tenure #${newTenure})`);
      }

      // MARCAR AUSENTES PARA REVISIÓN
      for (const emp of missing) {
        if (config.autoDeactivateMissing) {
          await tx.employee.update({
            where: { id: emp.id },
            data: {
              status: 'INACTIVE',
              isActive: false,
              terminatedAt: new Date(),
              terminationReason: 'not_in_import'
            }
          });
        } else {
          await tx.employee.update({
            where: { id: emp.id },
            data: {
              pendingReview: true,
              pendingReviewReason: `No incluido en import del ${new Date().toISOString().split('T')[0]}`
            }
          });
        }
      }

      // ACTUALIZAR REGISTRO DE IMPORT
      await tx.employeeImport.update({
        where: { id: importRecord.id },
        data: {
          created: toCreate.length,
          updated: toUpdate.length,
          rehired: toRehire.length,
          unchanged: activeEmployees.length - toUpdate.length - missing.length - toRehire.length,
          pendingReview: config.autoDeactivateMissing ? 0 : missing.length,
          deactivated: config.autoDeactivateMissing ? missing.length : 0,
          missingCount: missing.length,
          missingPercent,
          errors: errors.length,
          errorLog: errors.length > 0 ? errors : undefined,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    });

    return {
      status: 'COMPLETED',
      importId: importRecord.id,
      created: toCreate.length,
      updated: toUpdate.length,
      rehired: toRehire.length,
      pendingReview: config.autoDeactivateMissing ? 0 : missing.length,
      errors: errors.length,
      cycleWarnings: cycleWarnings.length
    };

  } catch (error: any) {
    await prisma.employeeImport.update({
      where: { id: importRecord.id },
      data: {
        status: 'FAILED',
        errorLog: { message: error.message }
      }
    });
    throw error;
  }
}
```

---

## REGLAS

1. **NO crear APIs hoy** - Solo el servicio
2. **Validar que prisma client esté generado** - `npx prisma generate`
3. **Si hay errores de tipos:** Reporta antes de continuar
4. **El archivo debe compilar sin errores TypeScript**

---

## VALIDACIÓN FINAL

```bash
# Verificar que compila
npx tsc --noEmit

# Debe no tener errores
```
