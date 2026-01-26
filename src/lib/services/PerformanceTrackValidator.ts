// ════════════════════════════════════════════════════════════════════════════
// PERFORMANCE TRACK VALIDATOR - Detección de Anomalías Estructurales
// src/lib/services/PerformanceTrackValidator.ts
// ════════════════════════════════════════════════════════════════════════════
// Valida coherencia entre track derivado y estructura organizacional real
// Detecta inconsistencias y las marca para revisión HUMANA (Human-in-the-Loop)
//
// REGLA DE CUARENTENA:
// - NO cambia tracks automáticamente
// - Marca trackHasAnomaly = true para revisión manual
// - El humano decide la acción correctiva
//
// Tipos de anomalías detectadas:
// - MANAGER/EJECUTIVO sin reportes directos
// - COLABORADOR con reportes directos (CUARENTENA CRÍTICA)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import type { PerformanceTrack } from './PositionAdapter';

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface TrackAnomaly {
  employeeId: string;
  fullName: string;
  position: string;
  standardJobLevel: string | null;
  derivedTrack: PerformanceTrack;
  directReportsCount: number;
  issue: string;
  suggestion: string;
  severity: 'WARNING' | 'CRITICAL';
}

export interface ValidationResult {
  isValid: boolean;
  anomaly: TrackAnomaly | null;
}

export interface BatchValidationResult {
  total: number;
  valid: number;
  withAnomalies: number;
  anomalies: TrackAnomaly[];
  byType: {
    managerWithoutReports: number;
    colaboradorWithReports: number;
    unclassifiedPosition: number;  // 🆕 Cargo no clasificado
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export class PerformanceTrackValidator {

  /**
   * Valida coherencia entre track derivado y estructura real
   * Se ejecuta POST-clasificación para detectar inconsistencias
   *
   * @param employeeId - ID del empleado
   * @param derivedTrack - Track derivado del algoritmo
   * @param accountId - ID de la cuenta
   * @returns TrackAnomaly si hay inconsistencia, null si es válido
   */
  static async validateTrack(
    employeeId: string,
    derivedTrack: PerformanceTrack,
    accountId: string
  ): Promise<TrackAnomaly | null> {

    // Obtener datos del empleado
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        position: true,
        standardJobLevel: true
      }
    });

    if (!employee) return null;

    // Contar reportes directos
    const directReportsCount = await prisma.employee.count({
      where: {
        accountId,
        managerId: employeeId,
        status: 'ACTIVE'
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // REGLA A: Track MANAGER/EJECUTIVO sin reportes
    // ═══════════════════════════════════════════════════════════════════════
    if ((derivedTrack === 'MANAGER' || derivedTrack === 'EJECUTIVO') && directReportsCount === 0) {
      return {
        employeeId: employee.id,
        fullName: employee.fullName,
        position: employee.position || '',
        standardJobLevel: employee.standardJobLevel,
        derivedTrack,
        directReportsCount,
        issue: `Track ${derivedTrack} pero sin reportes directos`,
        suggestion: 'Verificar si es cargo sin equipo (PM, Account Manager) o si faltan asignar subordinados',
        severity: derivedTrack === 'EJECUTIVO' ? 'CRITICAL' : 'WARNING'
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGLA B: Track COLABORADOR con reportes (CUARENTENA)
    // ═══════════════════════════════════════════════════════════════════════
    // IMPORTANTE: NO cambiar el track automáticamente.
    // Solo marcar para revisión humana (Human-in-the-Loop)
    // ═══════════════════════════════════════════════════════════════════════
    if (derivedTrack === 'COLABORADOR' && directReportsCount > 0) {
      // Log específico de cuarentena para monitoreo
      console.warn(
        `🚨 [CUARENTENA] ANOMALÍA DETECTADA: Rol Colaborador con personal a cargo.\n` +
        `   Empleado: ${employee.fullName} (${employee.id})\n` +
        `   Cargo: ${employee.position}\n` +
        `   Track derivado: ${derivedTrack}\n` +
        `   Reportes directos: ${directReportsCount}\n` +
        `   ⚠️ ACCIÓN: Requiere revisión manual. NO se modificará el track automáticamente.`
      );

      return {
        employeeId: employee.id,
        fullName: employee.fullName,
        position: employee.position || '',
        standardJobLevel: employee.standardJobLevel,
        derivedTrack,
        directReportsCount,
        issue: `CUARENTENA: Track COLABORADOR pero tiene ${directReportsCount} reportes directos`,
        suggestion: 'REQUIERE REVISIÓN MANUAL: Verificar si el cargo debe ser MANAGER o si los reportes están mal asignados',
        severity: 'CRITICAL' // Elevado a CRITICAL por la regla de cuarentena
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGLA C: Cargo no identificado (standardJobLevel == null)
    // ═══════════════════════════════════════════════════════════════════════
    // El PositionAdapter no pudo clasificar el cargo → requiere revisión manual
    // ═══════════════════════════════════════════════════════════════════════
    if (!employee.standardJobLevel) {
      console.warn(
        `🔶 [CUARENTENA] CARGO NO CLASIFICADO:\n` +
        `   Empleado: ${employee.fullName} (${employee.id})\n` +
        `   Cargo: ${employee.position || 'Sin cargo'}\n` +
        `   ⚠️ ACCIÓN: Requiere clasificación manual del cargo.`
      );

      return {
        employeeId: employee.id,
        fullName: employee.fullName,
        position: employee.position || '',
        standardJobLevel: null,
        derivedTrack,
        directReportsCount,
        issue: `CUARENTENA: Cargo "${employee.position || 'vacío'}" no pudo ser clasificado automáticamente`,
        suggestion: 'REQUIERE REVISIÓN MANUAL: Asignar nivel jerárquico al cargo en la pantalla de mapeo',
        severity: 'WARNING'
      };
    }

    return null; // Sin anomalías
  }

  /**
   * Valida todos los empleados de una cuenta y retorna anomalías
   * @param accountId - ID de la cuenta
   */
  static async validateAccountEmployees(accountId: string): Promise<BatchValidationResult> {
    const employees = await prisma.employee.findMany({
      where: {
        accountId,
        status: 'ACTIVE',
        performanceTrack: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        standardJobLevel: true,
        performanceTrack: true
      }
    });

    const anomalies: TrackAnomaly[] = [];
    let managerWithoutReports = 0;
    let colaboradorWithReports = 0;
    let unclassifiedPosition = 0;

    for (const emp of employees) {
      if (!emp.performanceTrack) continue;

      const anomaly = await this.validateTrack(
        emp.id,
        emp.performanceTrack as PerformanceTrack,
        accountId
      );

      if (anomaly) {
        anomalies.push(anomaly);

        // Clasificar tipo de anomalía
        if (anomaly.issue.includes('sin reportes')) {
          managerWithoutReports++;
        } else if (anomaly.issue.includes('tiene') && anomaly.issue.includes('reportes')) {
          colaboradorWithReports++;
        } else if (anomaly.issue.includes('no pudo ser clasificado')) {
          unclassifiedPosition++;
        }
      }
    }

    return {
      total: employees.length,
      valid: employees.length - anomalies.length,
      withAnomalies: anomalies.length,
      anomalies,
      byType: {
        managerWithoutReports,
        colaboradorWithReports,
        unclassifiedPosition
      }
    };
  }

  /**
   * Marca empleado con anomalía en la base de datos
   * @param employeeId - ID del empleado
   * @param hasAnomaly - Si tiene anomalía o no
   */
  static async setTrackAnomaly(employeeId: string, hasAnomaly: boolean): Promise<void> {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { trackHasAnomaly: hasAnomaly }
    });
  }

  /**
   * Marca todos los empleados con anomalías después de validación batch
   * @param accountId - ID de la cuenta
   */
  static async markAnomaliesForAccount(accountId: string): Promise<number> {
    // Primero reset todos
    await prisma.employee.updateMany({
      where: { accountId, status: 'ACTIVE' },
      data: { trackHasAnomaly: false }
    });

    const result = await this.validateAccountEmployees(accountId);

    // Marcar los que tienen anomalías
    if (result.anomalies.length > 0) {
      const anomalyIds = result.anomalies.map(a => a.employeeId);
      await prisma.employee.updateMany({
        where: { id: { in: anomalyIds } },
        data: { trackHasAnomaly: true }
      });
    }

    return result.withAnomalies;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CUARENTENA - Validación durante clasificación inicial
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Valida inline durante la clasificación del PositionAdapter
   * Retorna si debe marcarse como anomalía sin cambiar el track
   *
   * USO: Llamar después de derivar el track para marcar cuarentena
   *
   * @param derivedTrack - Track derivado del algoritmo
   * @param directReportsCount - Número de reportes directos
   * @param employeeInfo - Info para logging (opcional)
   * @returns true si hay anomalía de cuarentena
   */
  static checkQuarantineCondition(
    derivedTrack: PerformanceTrack,
    directReportsCount: number,
    employeeInfo?: { fullName?: string; position?: string }
  ): boolean {
    // ═══ REGLA DE CUARENTENA ═══
    // IF (track == 'COLABORADOR' AND directReports > 0)
    //    Set trackHasAnomaly = true
    //    Log anomalía
    //    IMPORTANTE: NO cambiar el track. El humano decidirá.

    if (derivedTrack === 'COLABORADOR' && directReportsCount > 0) {
      const name = employeeInfo?.fullName || 'Empleado';
      const position = employeeInfo?.position || 'Sin cargo';

      console.warn(
        `🔴 [CUARENTENA] ANOMALÍA: Rol Colaborador con personal a cargo.\n` +
        `   Empleado: ${name}\n` +
        `   Cargo: ${position}\n` +
        `   Reportes directos: ${directReportsCount}\n` +
        `   ⚠️ MARCADO PARA REVISIÓN MANUAL. Track NO modificado.`
      );

      return true; // Marcar anomalía
    }

    return false; // Sin anomalía de cuarentena
  }

  /**
   * Obtiene lista de empleados en cuarentena (con anomalías) para revisión
   * @param accountId - ID de la cuenta
   */
  static async getQuarantinedEmployees(accountId: string): Promise<Array<{
    id: string;
    fullName: string;
    position: string | null;
    performanceTrack: string | null;
    directReportsCount: number;
  }>> {
    const quarantined = await prisma.employee.findMany({
      where: {
        accountId,
        status: 'ACTIVE',
        trackHasAnomaly: true
      },
      select: {
        id: true,
        fullName: true,
        position: true,
        performanceTrack: true
      }
    });

    // Agregar conteo de reportes directos para cada uno
    const result = await Promise.all(
      quarantined.map(async (emp) => {
        const directReportsCount = await prisma.employee.count({
          where: {
            accountId,
            managerId: emp.id,
            status: 'ACTIVE'
          }
        });

        return {
          ...emp,
          directReportsCount
        };
      })
    );

    return result;
  }

  /**
   * Resuelve manualmente una cuarentena
   * @param employeeId - ID del empleado
   * @param newTrack - Nuevo track asignado manualmente (opcional, si se cambia)
   * @param resolvedBy - Usuario que resolvió
   */
  static async resolveQuarantine(
    employeeId: string,
    newTrack?: PerformanceTrack,
    resolvedBy?: string
  ): Promise<void> {
    const updateData: { trackHasAnomaly: boolean; performanceTrack?: PerformanceTrack } = {
      trackHasAnomaly: false
    };

    if (newTrack) {
      updateData.performanceTrack = newTrack;
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: updateData
    });

    console.log(
      `✅ [CUARENTENA RESUELTA] Empleado: ${employeeId}\n` +
      `   Nuevo track: ${newTrack || 'Sin cambio'}\n` +
      `   Resuelto por: ${resolvedBy || 'Sistema'}`
    );
  }
}
