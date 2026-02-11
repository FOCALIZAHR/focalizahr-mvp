// src/lib/services/EmployeeSyncService.ts

import { prisma } from '@/lib/prisma';
import { Employee, EmployeeStatus, EmployeeChangeType, Prisma } from '@prisma/client';
import { DepartmentAdapter } from './DepartmentAdapter';
import { PositionAdapter, type PerformanceTrack } from './PositionAdapter';

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
  // Campos calculados internamente
  resolvedManagerId?: string | null;
  resolvedDepartmentId?: string;
  resolvedHireDate?: Date;
  // 🆕 Clasificación de cargo (PositionAdapter)
  resolvedJobLevel?: string | null;
  resolvedAcotadoGroup?: string | null;
  resolvedPerformanceTrack?: PerformanceTrack;
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
  thresholdExceeded?: boolean;
  missingPercent?: number;
  unmappedDepartments?: string[];
  errorDetails?: Array<{ nationalId: string; error: string }>;
  warningDetails?: Array<{ nationalId: string; warning: string }>;
  // 🆕 Estadísticas de clasificación de cargos
  classification?: {
    mapped: number;
    unmapped: number;
    byLevel: Record<string, number>;
    byTrack: Record<PerformanceTrack, number>;
  };
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
  missingThreshold: 0.80,  // 10% normal-80% para pruebas con menos datos
  autoDeactivateMissing: false,
  preserveManualExclusions: true
};

// ════════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING CONFIG
// ════════════════════════════════════════════════════════════════════════════
const BATCH_SIZE = 20; // Procesar en lotes de 20 para evitar timeouts
const BATCH_TIMEOUT = 30000; // 30 segundos por lote (suficiente para 20 registros)

/**
 * Divide un array en chunks de tamaño especificado
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza RUT chileno: quita puntos, preserva guión, lowercase
 * Formato esperado: 12345678-9
 */
export function normalizeRut(rut: string): string {
  const cleaned = rut
    .replace(/\./g, '')  // Remove dots
    .toLowerCase()
    .trim();

  // Si ya tiene guión, retornar tal cual
  if (cleaned.includes('-')) {
    return cleaned;
  }

  // Si no tiene guión, agregarlo antes del último caracter (dígito verificador)
  if (cleaned.length >= 2) {
    return cleaned.slice(0, -1) + '-' + cleaned.slice(-1);
  }

  return cleaned;
}

/**
 * Valida RUT chileno con módulo 11
 * Formato esperado: 12345678-9 (con guión)
 */
export function validateRut(rut: string): boolean {
  const normalized = normalizeRut(rut);

  // Debe tener formato XXXXXXXX-X (con guión)
  if (!normalized.includes('-')) {
    console.warn(`[validateRut] RUT sin guión: ${normalized}`);
    return false;
  }

  const [body, dv] = normalized.split('-');

  // Body debe tener 7-8 dígitos, dv debe ser 1 caracter
  if (!body || body.length < 7 || body.length > 8 || !dv || dv.length !== 1) {
    console.warn(`[validateRut] Formato inválido: body=${body}, dv=${dv}`);
    return false;
  }

  // Verificar que body sean solo dígitos
  if (!/^\d+$/.test(body)) {
    console.warn(`[validateRut] Body no numérico: ${body}`);
    return false;
  }

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
 * Valida que una fecha esté en un rango lógico (1950-2100)
 * Previene errores como año 44593 por seriales Excel mal parseados
 */
function isValidDateRange(date: Date): boolean {
  const year = date.getFullYear();
  return year >= 1950 && year <= 2100;
}

/**
 * Convierte número serial de Excel a fecha JavaScript
 * Excel usa epoch 1900-01-01 como día 1 (con bug del 29/feb/1900)
 * Rango válido de seriales: ~20000 (1954) a ~60000 (2064)
 */
function excelSerialToDate(serial: number): Date | null {
  // Validar que sea un serial de Excel razonable
  // 20000 ≈ 1954, 60000 ≈ 2064
  if (serial < 1 || serial > 100000) {
    return null;
  }

  // Excel epoch: 1900-01-01 = día 1 (no día 0)
  // Pero Excel tiene un bug: considera 1900 como año bisiesto (no lo es)
  // Por eso fechas después del 28/feb/1900 tienen un día extra

  // Método robusto: construir fecha directamente desde epoch de Excel
  // Excel día 1 = 1900-01-01, día 2 = 1900-01-02, etc.

  // Ajuste por el bug de Excel (29/feb/1900 no existe pero Excel lo cuenta)
  const adjustedSerial = serial > 60 ? serial - 1 : serial;

  // Calcular fecha desde el serial
  // Excel día 1 = 1900-01-01, así que día 0 = 1899-12-31
  // Usamos UTC para evitar problemas de timezone
  const baseDate = new Date(Date.UTC(1899, 11, 31)); // 1899-12-31 en UTC (día 0)
  const resultDate = new Date(baseDate.getTime() + adjustedSerial * 86400 * 1000);

  return isNaN(resultDate.getTime()) ? null : resultDate;
}

/**
 * Parsea fecha en múltiples formatos con manejo robusto de seriales Excel
 * Soporta:
 * - Números seriales de Excel (ej: 44593 → 2022-01-21)
 * - DD-MM-YYYY, DD/MM/YYYY
 * - YYYY-MM-DD, YYYY/MM/DD
 * - ISO 8601
 *
 * Incluye validación de rango (1950-2100) para prevenir crashes de BD
 */
export function parseDate(value: string | number | undefined | null): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 0. PRE-PROCESAMIENTO: Limpiar puntos de miles europeos
  // ════════════════════════════════════════════════════════════════════════
  // Algunos sistemas exportan "44.453" en lugar de "44453"
  // Detectar y limpiar: si es string con solo dígitos y puntos, quitar puntos
  let cleanedValue = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Si el string solo tiene dígitos y puntos (ej: "44.453"), quitar puntos
    if (/^[\d.]+$/.test(trimmed) && !trimmed.includes('-') && !trimmed.includes('/')) {
      cleanedValue = trimmed.replace(/\./g, '');
      if (cleanedValue !== trimmed) {
        console.log(`[parseDate] Limpiando puntos de miles: "${trimmed}" → "${cleanedValue}"`);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. MANEJO DE NÚMEROS SERIALES DE EXCEL
  // ════════════════════════════════════════════════════════════════════════
  // Excel exporta fechas como números (ej: 44593 = 21-Ene-2022)
  // Detectar si es número o string numérico puro
  const numericValue = typeof cleanedValue === 'number' ? cleanedValue : Number(cleanedValue);

  if (!isNaN(numericValue) && typeof cleanedValue !== 'string' || (typeof cleanedValue === 'string' && /^\d+$/.test(String(cleanedValue).trim()))) {
    const serial = Math.round(numericValue);

    // Rango típico de seriales Excel para fechas laborales: 20000-60000
    if (serial >= 20000 && serial <= 60000) {
      const date = excelSerialToDate(serial);

      if (date && isValidDateRange(date)) {
        console.log(`[parseDate] Excel Serial: ${serial} → ${date.toISOString().split('T')[0]}`);
        return date;
      } else {
        console.warn(`[parseDate] ⚠️ Serial Excel fuera de rango: ${serial} → fallback a hoy`);
        return new Date();
      }
    }

    // Si el número es muy grande (ej: 44593 interpretado como año), es un error
    if (serial > 2100) {
      console.warn(`[parseDate] ⚠️ Número interpretado como año inválido: ${serial} → fallback a hoy`);
      return new Date();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. MANEJO DE STRINGS DE FECHA
  // ════════════════════════════════════════════════════════════════════════
  const trimmed = String(value).trim();

  // Formato DD-MM-YYYY o DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
  const matchDDMM = trimmed.match(ddmmyyyy);
  if (matchDDMM) {
    const [, day, month, year] = matchDDMM;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (!isNaN(date.getTime()) && isValidDateRange(date)) {
      console.log(`[parseDate] DD-MM-YYYY: "${trimmed}" → ${date.toISOString().split('T')[0]}`);
      return date;
    }

    // Fecha fuera de rango
    console.warn(`[parseDate] ⚠️ Fecha fuera de rango: "${trimmed}" (año ${year}) → fallback a hoy`);
    return new Date();
  }

  // Formato YYYY-MM-DD o YYYY/MM/DD
  const yyyymmdd = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/;
  const matchYYYY = trimmed.match(yyyymmdd);
  if (matchYYYY) {
    const [, year, month, day] = matchYYYY;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (!isNaN(date.getTime()) && isValidDateRange(date)) {
      console.log(`[parseDate] YYYY-MM-DD: "${trimmed}" → ${date.toISOString().split('T')[0]}`);
      return date;
    }

    // Fecha fuera de rango
    console.warn(`[parseDate] ⚠️ Fecha fuera de rango: "${trimmed}" (año ${year}) → fallback a hoy`);
    return new Date();
  }

  // Intentar ISO parsing directo
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    if (isValidDateRange(isoDate)) {
      console.log(`[parseDate] ISO: "${trimmed}" → ${isoDate.toISOString().split('T')[0]}`);
      return isoDate;
    }

    // Fecha ISO fuera de rango
    console.warn(`[parseDate] ⚠️ Fecha ISO fuera de rango: "${trimmed}" (año ${isoDate.getFullYear()}) → fallback a hoy`);
    return new Date();
  }

  // ════════════════════════════════════════════════════════════════════════
  // 3. FALLBACK - No se pudo parsear
  // ════════════════════════════════════════════════════════════════════════
  console.warn(`[parseDate] ⚠️ Fecha no válida: "${trimmed}" → NULL`);
  return null;
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
    // RESOLVER DEPARTAMENTOS (Patrón Paraguas - IDÉNTICO a ParticipantUploader)
    // ════════════════════════════════════════════════════════════════════════
    const departmentNames = [...new Set(
      fileData
        .map(e => e.departmentName)
        .filter((name): name is string => !!name && name.trim() !== '')
    )];

    console.log(`[Import] 📋 Términos de departamento únicos: ${departmentNames.length}`);

    // Buscar o crear departamento paraguas "Departamentos sin Asignar"
    let paraguas = await prisma.department.findFirst({
      where: {
        accountId,
        standardCategory: 'sin_asignar'
      }
    });

    if (!paraguas) {
      console.log('[Import] 🏗️ Creando departamento paraguas "Departamentos sin Asignar"');
      paraguas = await prisma.department.create({
        data: {
          accountId,
          displayName: 'Departamentos sin Asignar',
          standardCategory: 'sin_asignar',
          unitType: 'departamento',
          level: 3,
          isActive: true
        }
      });
    }

    // Mapear cada término usando DepartmentAdapter (PATRÓN IDÉNTICO a ParticipantUploader)
    const deptMap = new Map<string, string>();
    const unmappedDepts: string[] = [];

    for (const deptName of departmentNames) {
      // 1. Intentar match exacto por displayName
      const exactMatch = await prisma.department.findFirst({
        where: {
          accountId,
          displayName: { equals: deptName, mode: 'insensitive' },
          isActive: true
        }
      });

      if (exactMatch) {
        deptMap.set(deptName, exactMatch.id);
        console.log(`[Import] ✅ Match exacto: "${deptName}" → ${exactMatch.displayName}`);
        continue;
      }

      // 2. Intentar categorizar con DepartmentAdapter
      const category = DepartmentAdapter.getGerenciaCategory(deptName);

      if (category) {
        // Buscar department con esta categoría (IDÉNTICO a ParticipantUploader)
        const dept = await prisma.department.findFirst({
          where: {
            accountId,
            standardCategory: category
          }
        });

        if (dept) {
          deptMap.set(deptName, dept.id);
          console.log(`[Import] ✅ "${deptName}" → ${category} (${dept.displayName})`);
          continue;
        } else {
          // No hay department con esa categoría → paraguas
          deptMap.set(deptName, paraguas.id);
          unmappedDepts.push(deptName);
          console.log(`[Import] ⚠️ "${deptName}" → categoría '${category}' no encontrada → paraguas`);
          continue;
        }
      }

      // 3. No se pudo categorizar → paraguas
      deptMap.set(deptName, paraguas.id);
      unmappedDepts.push(deptName);
      console.log(`[Import] ⚠️ "${deptName}" → sin categoría → paraguas`);
    }

    if (unmappedDepts.length > 0) {
      console.warn(`[Import] 📋 ${unmappedDepts.length} departamentos sin mapear:`, unmappedDepts);
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
      console.log(`[Import] 📋 Procesando: ${rut} (${fileEmp.fullName})`);

      // Validar RUT
      if (!validateRut(rut)) {
        const errorMsg = `RUT inválido: "${rut}" (original: "${fileEmp.nationalId}")`;
        console.error(`[Import] ❌ ${errorMsg}`);
        errors.push({ nationalId: rut, error: errorMsg });
        continue;
      }

      // Validar campos obligatorios
      if (!fileEmp.fullName || fileEmp.fullName.trim() === '') {
        const errorMsg = 'fullName vacío o no definido';
        console.error(`[Import] ❌ ${rut}: ${errorMsg}`);
        errors.push({ nationalId: rut, error: errorMsg });
        continue;
      }

      // Parsear y validar hireDate
      const parsedHireDate = parseDate(fileEmp.hireDate);
      if (!parsedHireDate) {
        const errorMsg = `hireDate inválido: "${fileEmp.hireDate}" (usar DD-MM-YYYY o YYYY-MM-DD)`;
        console.error(`[Import] ❌ ${rut}: ${errorMsg}`);
        errors.push({ nationalId: rut, error: errorMsg });
        continue;
      }

      // Resolver manager
      let managerId: string | null = null;
      if (fileEmp.managerRut) {
        const managerRut = normalizeRut(fileEmp.managerRut);
        managerId = managerMap.get(managerRut) || null;

        if (!managerId) {
          console.warn(`[Import] ⚠️ ${rut}: Manager "${fileEmp.managerRut}" no encontrado → NULL`);
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
        const errorMsg = `Departamento no mapeado: "${fileEmp.departmentName}" (no existe en deptMap)`;
        console.error(`[Import] ❌ ${rut}: ${errorMsg}`);
        console.error(`[Import] 🔍 deptMap keys:`, [...deptMap.keys()]);
        errors.push({ nationalId: rut, error: errorMsg });
        continue;
      }

      console.log(`[Import] ✅ ${rut}: dept=${deptId}, manager=${managerId || 'NULL'}, hireDate=${parsedHireDate.toISOString().split('T')[0]}`)

      // Agregar campos resueltos
      fileEmp.resolvedManagerId = managerId;
      fileEmp.resolvedDepartmentId = deptId;
      fileEmp.resolvedHireDate = parsedHireDate;

      // 🆕 Clasificar cargo usando PositionAdapter
      const classification = PositionAdapter.classifyPosition(fileEmp.position || '');
      fileEmp.resolvedJobLevel = classification.standardJobLevel;
      fileEmp.resolvedAcotadoGroup = classification.acotadoGroup;
      fileEmp.resolvedPerformanceTrack = classification.performanceTrack;

      console.log(`[Import] 👔 ${rut}: level=${classification.standardJobLevel || 'NULL'}, track=${classification.performanceTrack}`);

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
        cycleWarnings: cycleWarnings.length,
        thresholdExceeded: true,
        missingPercent,
        unmappedDepartments: unmappedDepts.length > 0 ? unmappedDepts : undefined,
        errorDetails: errors.length > 0 ? errors : undefined,
        warningDetails: cycleWarnings.length > 0 ? cycleWarnings.map(w => ({ nationalId: w.nationalId, warning: w.warning })) : undefined
      };
    }

    // ════════════════════════════════════════════════════════════════════════
    // PREPARAR DATOS FUERA DE TRANSACCIÓN (Patrón ParticipantUploader)
    // ════════════════════════════════════════════════════════════════════════
    const now = new Date();

    // 1. Preparar empleados a crear SIN IDs (Prisma los genera)
    const employeesToInsert = toCreate.map(emp => ({
      accountId,
      nationalId: normalizeRut(emp.nationalId),
      fullName: emp.fullName,
      email: emp.email || null,
      phoneNumber: emp.phoneNumber || null,
      position: emp.position || null,
      jobTitle: emp.jobTitle || null,
      seniorityLevel: emp.seniorityLevel || null,
      managerId: emp.resolvedManagerId || null,
      departmentId: emp.resolvedDepartmentId!,
      status: mapIsActiveToStatus(emp.isActive),
      isActive: mapIsActiveToStatus(emp.isActive) === 'ACTIVE',
      hireDate: emp.resolvedHireDate!,
      importSource: 'BULK_IMPORT' as const,
      lastImportId: importRecord.id,
      lastSeenInImport: now,
      // 🆕 Clasificación de cargo
      standardJobLevel: emp.resolvedJobLevel || null,
      acotadoGroup: emp.resolvedAcotadoGroup || null,
      performanceTrack: emp.resolvedPerformanceTrack || 'COLABORADOR',
      jobLevelMappedAt: emp.resolvedJobLevel ? now : null,
      jobLevelMethod: emp.resolvedJobLevel ? 'auto' : null,
      trackMappedAt: now
    }));

    // Guardar RUTs de nuevos empleados para buscar sus IDs después
    const newEmployeeRuts = toCreate.map(emp => normalizeRut(emp.nationalId));

    // 2. Preparar historial para updates (ya tienen IDs)
    const historyForUpdates: Prisma.EmployeeHistoryCreateManyInput[] = [];
    for (const { current, changes } of toUpdate) {
      for (const change of changes) {
        historyForUpdates.push({
          employeeId: current.id,
          accountId,
          changeType: mapFieldToChangeType(change.field),
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changeSource: 'BULK_IMPORT',
          importId: importRecord.id,
          changedBy: userId || null,
          effectiveDate: now
        });
      }
    }

    // 3. Preparar historial para rehires (ya tienen IDs)
    const historyForRehires: Prisma.EmployeeHistoryCreateManyInput[] = toRehire.map(({ current, newData }) => ({
      employeeId: current.id,
      accountId,
      changeType: 'REHIRE' as EmployeeChangeType,
      fieldName: 'status',
      oldValue: 'INACTIVE',
      newValue: 'ACTIVE',
      departmentId: newData.resolvedDepartmentId,
      managerId: newData.resolvedManagerId,
      position: newData.position || null,
      changeSource: 'BULK_IMPORT',
      importId: importRecord.id,
      changeReason: `Recontratación automática (tenure #${current.tenureCount + 1})`,
      changedBy: userId || null,
      effectiveDate: now
    }));

    console.log(`[Import] 📊 Preparados para insertar:`);
    console.log(`[Import]    - Empleados nuevos: ${employeesToInsert.length}`);
    console.log(`[Import]    - Historial updates: ${historyForUpdates.length}`);
    console.log(`[Import]    - Historial rehires: ${historyForRehires.length}`);

    // ════════════════════════════════════════════════════════════════════════
    // EJECUTAR EN LOTES (Batch Processing Pattern)
    // Cada lote en su propia transacción corta para evitar timeouts
    // ════════════════════════════════════════════════════════════════════════

    console.log(`[Import] 🔄 Procesando en lotes de ${BATCH_SIZE}...`);

    // ════════════════════════════════════════════════════════════════════════
    // FASE 1: CREATE - Nuevos empleados en lotes
    // ════════════════════════════════════════════════════════════════════════
    if (employeesToInsert.length > 0) {
      const createBatches = chunkArray(employeesToInsert, BATCH_SIZE);
      console.log(`[Import] 📦 Creando ${employeesToInsert.length} empleados en ${createBatches.length} lotes`);

      for (let i = 0; i < createBatches.length; i++) {
        const batch = createBatches[i];
        await prisma.$transaction(async (tx) => {
          await tx.employee.createMany({
            data: batch,
            skipDuplicates: true
          });
        }, { timeout: BATCH_TIMEOUT });
        console.log(`[Import] ✅ Lote CREATE ${i + 1}/${createBatches.length}: ${batch.length} empleados`);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 2: Obtener IDs de empleados creados y crear historial
    // ════════════════════════════════════════════════════════════════════════
    if (newEmployeeRuts.length > 0) {
      const createdEmployees = await prisma.employee.findMany({
        where: {
          accountId,
          nationalId: { in: newEmployeeRuts }
        },
        select: { id: true, nationalId: true }
      });

      const rutToIdMap = new Map(createdEmployees.map(e => [e.nationalId, e.id]));

      // Preparar historial para empleados nuevos
      const historyForNewEmployees: Prisma.EmployeeHistoryCreateManyInput[] = [];
      for (const emp of toCreate) {
        const empId = rutToIdMap.get(normalizeRut(emp.nationalId));
        if (empId) {
          historyForNewEmployees.push({
            employeeId: empId,
            accountId,
            changeType: 'HIRE' as EmployeeChangeType,
            fieldName: 'status',
            newValue: 'ACTIVE',
            departmentId: emp.resolvedDepartmentId,
            managerId: emp.resolvedManagerId,
            position: emp.position || null,
            changeSource: 'BULK_IMPORT',
            importId: importRecord.id,
            changedBy: userId || null,
            effectiveDate: now
          });
        }
      }

      // Crear historial en lotes
      if (historyForNewEmployees.length > 0) {
        const historyBatches = chunkArray(historyForNewEmployees, BATCH_SIZE);
        for (let i = 0; i < historyBatches.length; i++) {
          await prisma.$transaction(async (tx) => {
            await tx.employeeHistory.createMany({
              data: historyBatches[i],
              skipDuplicates: true
            });
          }, { timeout: BATCH_TIMEOUT });
        }
        console.log(`[Import] ✅ Historial nuevos: ${historyForNewEmployees.length} registros`);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 3: Historial para updates y rehires en lotes
    // ════════════════════════════════════════════════════════════════════════
    const existingHistory = [...historyForUpdates, ...historyForRehires];
    if (existingHistory.length > 0) {
      const historyBatches = chunkArray(existingHistory, BATCH_SIZE);
      for (let i = 0; i < historyBatches.length; i++) {
        await prisma.$transaction(async (tx) => {
          await tx.employeeHistory.createMany({
            data: historyBatches[i],
            skipDuplicates: true
          });
        }, { timeout: BATCH_TIMEOUT });
      }
      console.log(`[Import] ✅ Historial updates/rehires: ${existingHistory.length} registros`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 4: UPDATE - Empleados existentes en lotes (con SMART DIFF)
    // ════════════════════════════════════════════════════════════════════════
    // Smart Diff: Solo actualiza clasificación si:
    // 1. El valor calculado es diferente al valor en BD
    // 2. El campo NO fue clasificado manualmente (jobLevelMethod !== 'manual')
    // ════════════════════════════════════════════════════════════════════════
    if (toUpdate.length > 0) {
      const updateBatches = chunkArray(toUpdate, BATCH_SIZE);
      console.log(`[Import] 📦 Actualizando ${toUpdate.length} empleados en ${updateBatches.length} lotes (Smart Diff)`);

      let classificationUpdates = 0;
      let classificationSkipped = 0;

      for (let i = 0; i < updateBatches.length; i++) {
        const batch = updateBatches[i];
        await prisma.$transaction(async (tx) => {
          for (const { current, newData } of batch) {
            // ═══ SMART DIFF: Calcular si necesita actualizar clasificación ═══
            const isManualClassification = current.jobLevelMethod === 'manual';
            const classificationChanged =
              current.standardJobLevel !== (newData.resolvedJobLevel || null) ||
              current.performanceTrack !== (newData.resolvedPerformanceTrack || 'COLABORADOR');

            // Determinar si actualizar campos de clasificación
            const shouldUpdateClassification = classificationChanged && !isManualClassification;

            if (shouldUpdateClassification) {
              classificationUpdates++;
              console.log(`[Import] 🔄 Smart Diff: ${current.nationalId} - Clasificación cambia: ${current.standardJobLevel} → ${newData.resolvedJobLevel}`);
            } else if (isManualClassification && classificationChanged) {
              classificationSkipped++;
              console.log(`[Import] ⏭️ Smart Diff: ${current.nationalId} - Clasificación manual preservada (${current.standardJobLevel})`);
            }

            // Construir objeto de actualización
            const updateData: Record<string, unknown> = {
              fullName: newData.fullName,
              email: newData.email || null,
              phoneNumber: newData.phoneNumber || null,
              position: newData.position || null,
              jobTitle: newData.jobTitle || null,
              seniorityLevel: newData.seniorityLevel || null,
              managerId: newData.resolvedManagerId || null,
              departmentId: newData.resolvedDepartmentId!,
              status: mapIsActiveToStatus(newData.isActive),
              isActive: mapIsActiveToStatus(newData.isActive) === 'ACTIVE',
              lastImportId: importRecord.id,
              lastSeenInImport: now
            };

            // Solo actualizar clasificación si Smart Diff lo indica
            if (shouldUpdateClassification) {
              updateData.standardJobLevel = newData.resolvedJobLevel || null;
              updateData.acotadoGroup = newData.resolvedAcotadoGroup || null;
              updateData.performanceTrack = newData.resolvedPerformanceTrack || 'COLABORADOR';
              updateData.jobLevelMappedAt = newData.resolvedJobLevel ? now : null;
              updateData.jobLevelMethod = newData.resolvedJobLevel ? 'auto' : null;
              updateData.trackMappedAt = now;
            }

            await tx.employee.update({
              where: { id: current.id },
              data: updateData
            });
          }
        }, { timeout: BATCH_TIMEOUT });
        console.log(`[Import] ✅ Lote UPDATE ${i + 1}/${updateBatches.length}: ${batch.length} empleados`);
      }

      console.log(`[Import] 📊 Smart Diff resumen: ${classificationUpdates} actualizados, ${classificationSkipped} preservados (manual)`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 5: REHIRE - Zombies reactivados en lotes
    // ════════════════════════════════════════════════════════════════════════
    if (toRehire.length > 0) {
      const rehireBatches = chunkArray(toRehire, BATCH_SIZE);
      console.log(`[Import] 📦 Reactivando ${toRehire.length} zombies en ${rehireBatches.length} lotes`);

      for (let i = 0; i < rehireBatches.length; i++) {
        const batch = rehireBatches[i];
        await prisma.$transaction(async (tx) => {
          for (const { current, newData } of batch) {
            const newTenure = current.tenureCount + 1;
            await tx.employee.update({
              where: { id: current.id },
              data: {
                fullName: newData.fullName,
                email: newData.email || null,
                phoneNumber: newData.phoneNumber || null,
                position: newData.position || null,
                jobTitle: newData.jobTitle || null,
                seniorityLevel: newData.seniorityLevel || null,
                managerId: newData.resolvedManagerId || null,
                departmentId: newData.resolvedDepartmentId!,
                status: 'ACTIVE',
                isActive: true,
                rehireDate: now,
                tenureCount: newTenure,
                terminatedAt: null,
                terminationReason: null,
                pendingReview: false,
                pendingReviewReason: null,
                lastImportId: importRecord.id,
                lastSeenInImport: now,
                standardJobLevel: newData.resolvedJobLevel || null,
                acotadoGroup: newData.resolvedAcotadoGroup || null,
                performanceTrack: newData.resolvedPerformanceTrack || 'COLABORADOR',
                jobLevelMappedAt: newData.resolvedJobLevel ? now : null,
                jobLevelMethod: newData.resolvedJobLevel ? 'auto' : null,
                trackMappedAt: now
              }
            });
          }
        }, { timeout: BATCH_TIMEOUT });
        console.log(`[Import] ✅ Lote REHIRE ${i + 1}/${rehireBatches.length}: ${batch.length} zombies`);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 6: MISSING - Marcar ausentes (generalmente pocos, una sola transacción)
    // ════════════════════════════════════════════════════════════════════════
    if (missing.length > 0) {
      const missingIds = missing.map(e => e.id);
      await prisma.$transaction(async (tx) => {
        if (config.autoDeactivateMissing) {
          await tx.employee.updateMany({
            where: { id: { in: missingIds } },
            data: {
              status: 'INACTIVE',
              isActive: false,
              terminatedAt: now,
              terminationReason: 'not_in_import'
            }
          });
        } else {
          await tx.employee.updateMany({
            where: { id: { in: missingIds } },
            data: {
              pendingReview: true,
              pendingReviewReason: `No incluido en import del ${now.toISOString().split('T')[0]}`
            }
          });
        }
      }, { timeout: BATCH_TIMEOUT });
      console.log(`[Import] ✅ Marcados ${missing.length} ausentes para revisión`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 7: SEGUNDA PASADA - Asignar Managers en lotes
    // ════════════════════════════════════════════════════════════════════════
    const allEmployeesAfterCreate = await prisma.employee.findMany({
      where: { accountId },
      select: { id: true, nationalId: true }
    });
    const employeeMapComplete = new Map(
      allEmployeesAfterCreate.map(e => [e.nationalId, e.id])
    );

    console.log(`[Import] 🔄 Segunda pasada: ${allEmployeesAfterCreate.length} empleados en mapa`);

    // Preparar asignaciones de manager
    const managerAssignments: Array<{ employeeId: string; managerId: string }> = [];
    for (const row of fileData) {
      if (!row.managerRut) continue;

      const employeeRut = normalizeRut(row.nationalId);
      const managerRut = normalizeRut(row.managerRut);

      const employeeId = employeeMapComplete.get(employeeRut);
      const managerId = employeeMapComplete.get(managerRut);

      if (employeeId && managerId && employeeId !== managerId) {
        managerAssignments.push({ employeeId, managerId });
      } else if (employeeId && !managerId) {
        console.warn(`[Import] ⚠️ Manager no encontrado: ${row.managerRut} para empleado ${row.nationalId}`);
      }
    }

    // Asignar managers en lotes
    if (managerAssignments.length > 0) {
      const managerBatches = chunkArray(managerAssignments, BATCH_SIZE);
      for (let i = 0; i < managerBatches.length; i++) {
        const batch = managerBatches[i];
        await prisma.$transaction(async (tx) => {
          for (const { employeeId, managerId } of batch) {
            await tx.employee.update({
              where: { id: employeeId },
              data: { managerId }
            });
          }
        }, { timeout: BATCH_TIMEOUT });
      }
      console.log(`[Import] ✅ Segunda pasada: ${managerAssignments.length} managers asignados`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FASE 7.5: DETECTAR Y MARCAR ANOMALÍAS (trackHasAnomaly)
    // ════════════════════════════════════════════════════════════════════════
    // Después de asignar managers, detectar inconsistencias:
    // 1. Cargo no clasificado (standardJobLevel == NULL)
    // 2. COLABORADOR con reportes directos (hidden manager)
    // ════════════════════════════════════════════════════════════════════════
    console.log(`[Import] 🔍 Fase 7.5: Detectando anomalías...`);

    // 1. Marcar empleados con standardJobLevel NULL
    const unmappedResult = await prisma.employee.updateMany({
      where: {
        accountId,
        status: 'ACTIVE',
        standardJobLevel: null
      },
      data: {
        trackHasAnomaly: true
      }
    });

    if (unmappedResult.count > 0) {
      console.warn(`[Import] 🚨 ${unmappedResult.count} empleados con cargo NO CLASIFICADO → trackHasAnomaly=true`);
    }

    // 2. Buscar COLABORADORES con reportes directos (hidden managers)
    const colaboradores = await prisma.employee.findMany({
      where: {
        accountId,
        status: 'ACTIVE',
        performanceTrack: 'COLABORADOR'
      },
      select: { id: true, fullName: true }
    });

    const hiddenManagerIds: string[] = [];
    for (const colab of colaboradores) {
      const directReports = await prisma.employee.count({
        where: {
          accountId,
          managerId: colab.id,
          status: 'ACTIVE'
        }
      });

      if (directReports > 0) {
        hiddenManagerIds.push(colab.id);
        console.warn(`[Import] 🚨 Hidden Manager detectado: ${colab.fullName} (COLABORADOR con ${directReports} reportes)`);
      }
    }

    if (hiddenManagerIds.length > 0) {
      await prisma.employee.updateMany({
        where: { id: { in: hiddenManagerIds } },
        data: { trackHasAnomaly: true }
      });
      console.warn(`[Import] 🚨 ${hiddenManagerIds.length} COLABORADORES con reportes → trackHasAnomaly=true`);
    }

    const totalAnomalies = unmappedResult.count + hiddenManagerIds.length;
    console.log(`[Import] 📊 Total anomalías detectadas: ${totalAnomalies}`);

    // ════════════════════════════════════════════════════════════════════════
    // FASE 8: Actualizar registro de import
    // ════════════════════════════════════════════════════════════════════════
    await prisma.employeeImport.update({
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
        errorLog: errors.length > 0 ? (errors as unknown as object) : undefined,
        status: 'COMPLETED',
        completedAt: now
      }
    });

    // 🆕 Calcular estadísticas de clasificación
    const allProcessed = [...toCreate, ...toUpdate.map(u => u.newData), ...toRehire.map(r => r.newData)];
    const classificationStats = {
      mapped: 0,
      unmapped: 0,
      byLevel: {} as Record<string, number>,
      byTrack: { COLABORADOR: 0, MANAGER: 0, EJECUTIVO: 0 } as Record<PerformanceTrack, number>
    };

    for (const emp of allProcessed) {
      if (emp.resolvedJobLevel) {
        classificationStats.mapped++;
        classificationStats.byLevel[emp.resolvedJobLevel] = (classificationStats.byLevel[emp.resolvedJobLevel] || 0) + 1;
      } else {
        classificationStats.unmapped++;
      }
      if (emp.resolvedPerformanceTrack) {
        classificationStats.byTrack[emp.resolvedPerformanceTrack]++;
      }
    }

    // Log resumen final
    console.log(`[Import] ═══════════════════════════════════════════════`);
    console.log(`[Import] 📊 RESUMEN FINAL:`);
    console.log(`[Import]    - Creados: ${toCreate.length}`);
    console.log(`[Import]    - Actualizados: ${toUpdate.length}`);
    console.log(`[Import]    - Recontratados: ${toRehire.length}`);
    console.log(`[Import]    - Errores: ${errors.length}`);
    console.log(`[Import] 👔 CLASIFICACIÓN DE CARGOS:`);
    console.log(`[Import]    - Mapeados: ${classificationStats.mapped}`);
    console.log(`[Import]    - Sin mapear: ${classificationStats.unmapped}`);
    console.log(`[Import]    - Por track: EJECUTIVO=${classificationStats.byTrack.EJECUTIVO}, MANAGER=${classificationStats.byTrack.MANAGER}, COLABORADOR=${classificationStats.byTrack.COLABORADOR}`);
    if (errors.length > 0) {
      console.log(`[Import] ❌ ERRORES DETALLADOS:`);
      errors.forEach(e => console.log(`[Import]    - ${e.nationalId}: ${e.error}`));
    }
    console.log(`[Import] ═══════════════════════════════════════════════`);

    return {
      status: 'COMPLETED',
      importId: importRecord.id,
      created: toCreate.length,
      updated: toUpdate.length,
      rehired: toRehire.length,
      pendingReview: config.autoDeactivateMissing ? 0 : missing.length,
      errors: errors.length,
      cycleWarnings: cycleWarnings.length,
      unmappedDepartments: unmappedDepts.length > 0 ? unmappedDepts : undefined,
      errorDetails: errors.length > 0 ? errors : undefined,
      warningDetails: cycleWarnings.length > 0 ? cycleWarnings.map(w => ({ nationalId: w.nationalId, warning: w.warning })) : undefined,
      classification: classificationStats
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
