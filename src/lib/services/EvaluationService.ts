// src/lib/services/EvaluationService.ts
// Performance Cycle - Evaluation Assignment Generation

import { prisma } from '@/lib/prisma';
import { EvaluationType, EvaluationAssignmentStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

function generateUniqueToken(): string {
  return randomBytes(32).toString('hex');
}

interface GenerateOptions {
  minSubordinates?: number;  // Mínimo subordinados para upward (default: 3)
  dueDate?: Date;
}

interface GenerateResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Genera evaluaciones MANAGER_TO_EMPLOYEE (jefe evalúa a subordinado)
 */
export async function generateManagerEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId },
    include: { campaign: true }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  if (!cycle.campaignId || !cycle.campaign) {
    throw new Error('El ciclo no tiene una Campaign vinculada. Vincule el ciclo a una campaña primero.');
  }

  // Obtener empleados activos con jefe
  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE',
      managerId: { not: null }
    },
    include: {
      department: true,
      manager: {
        include: { department: true }
      }
    }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  for (const employee of employees) {
    if (!employee.manager) continue;

    try {
      // Verificar si ya existe
      const existing = await prisma.evaluationAssignment.findFirst({
        where: {
          cycleId,
          evaluatorId: employee.managerId!,
          evaluateeId: employee.id,
          evaluationType: 'MANAGER_TO_EMPLOYEE'
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Crear Assignment + Participant en transacción
      await prisma.$transaction(async (tx) => {
        const assignment = await tx.evaluationAssignment.create({
          data: {
            accountId,
            cycleId,
            evaluatorId: employee.managerId!,
            evaluateeId: employee.id,
            evaluationType: 'MANAGER_TO_EMPLOYEE',

            // SNAPSHOT CONGELADO
            snapshotDate,
            evaluateeName: employee.fullName,
            evaluateeNationalId: employee.nationalId,
            evaluateeDepartmentId: employee.departmentId,
            evaluateeDepartment: employee.department.displayName,
            evaluateePosition: employee.position,

            // COMPETENCY LIBRARY: Track del evaluado para filtrado de preguntas
            evaluateePerformanceTrack: employee.performanceTrack,

            evaluatorName: employee.manager!.fullName,
            evaluatorNationalId: employee.manager!.nationalId,
            evaluatorDepartmentId: employee.manager!.departmentId,
            evaluatorDepartment: employee.manager!.department.displayName,

            status: 'PENDING',
            dueDate: options?.dueDate || cycle.endDate
          }
        });

        // Crear Participant vinculado al Assignment
        // nationalId = EVALUATEE (para reportes departamentales)
        // email = EVALUADOR (quien recibe el link de encuesta)
        await tx.participant.create({
          data: {
            campaignId: cycle.campaignId!,
            nationalId: employee.nationalId,
            name: employee.fullName,
            email: employee.manager!.email,
            departmentId: employee.departmentId,
            evaluationAssignmentId: assignment.id,
            uniqueToken: generateUniqueToken(),
            hasResponded: false
          }
        });
      });

      created++;
    } catch (err: any) {
      errors.push(`Error con ${employee.fullName}: ${err.message}`);
    }
  }

  // Actualizar Campaign.totalInvited
  if (created > 0) {
    const totalParticipants = await prisma.participant.count({
      where: { campaignId: cycle.campaignId! }
    });
    await prisma.campaign.update({
      where: { id: cycle.campaignId! },
      data: { totalInvited: totalParticipants }
    });
  }

  return { created, skipped, errors };
}

/**
 * Genera evaluaciones EMPLOYEE_TO_MANAGER (subordinado evalúa a jefe)
 * Para Impact Pulse - Solo managers con suficientes subordinados
 */
export async function generateUpwardEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const minSubordinates = options?.minSubordinates || 3;

  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId },
    include: { campaign: true }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  if (!cycle.campaignId || !cycle.campaign) {
    throw new Error('El ciclo no tiene una Campaign vinculada. Vincule el ciclo a una campaña primero.');
  }

  // Obtener managers con subordinados activos
  const managers = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE',
      directReports: {
        some: { status: 'ACTIVE' }
      }
    },
    include: {
      department: true,
      directReports: {
        where: { status: 'ACTIVE' },
        include: { department: true }
      }
    }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  for (const manager of managers) {
    // Filtrar por mínimo de subordinados (anonimato)
    if (manager.directReports.length < minSubordinates) {
      console.log(`[Upward] ${manager.fullName} tiene ${manager.directReports.length} subordinados (min: ${minSubordinates}) - SKIP`);
      skipped++;
      continue;
    }

    // Crear una evaluación por cada subordinado
    for (const subordinate of manager.directReports) {
      try {
        // Verificar si ya existe
        const existing = await prisma.evaluationAssignment.findFirst({
          where: {
            cycleId,
            evaluatorId: subordinate.id,   // Subordinado evalúa
            evaluateeId: manager.id,        // al jefe
            evaluationType: 'EMPLOYEE_TO_MANAGER'
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // evaluator = subordinado (quien responde)
        // evaluatee = manager (quien es evaluado)
        await prisma.$transaction(async (tx) => {
          const assignment = await tx.evaluationAssignment.create({
            data: {
              accountId,
              cycleId,
              evaluatorId: subordinate.id,
              evaluateeId: manager.id,
              evaluationType: 'EMPLOYEE_TO_MANAGER',

              snapshotDate,

              evaluateeName: manager.fullName,
              evaluateeNationalId: manager.nationalId,
              evaluateeDepartmentId: manager.departmentId,
              evaluateeDepartment: manager.department.displayName,
              evaluateePosition: manager.position,

              evaluateePerformanceTrack: manager.performanceTrack,

              evaluatorName: subordinate.fullName,
              evaluatorNationalId: subordinate.nationalId,
              evaluatorDepartmentId: subordinate.departmentId,
              evaluatorDepartment: subordinate.department.displayName,

              status: 'PENDING',
              dueDate: options?.dueDate || cycle.endDate
            }
          });

          // nationalId = EVALUATEE (manager), email = EVALUADOR (subordinado)
          await tx.participant.create({
            data: {
              campaignId: cycle.campaignId!,
              nationalId: manager.nationalId,
              name: manager.fullName,
              email: subordinate.email,
              departmentId: manager.departmentId,
              evaluationAssignmentId: assignment.id,
              uniqueToken: generateUniqueToken(),
              hasResponded: false
            }
          });
        });

        created++;
      } catch (err: any) {
        errors.push(`Error ${subordinate.fullName} → ${manager.fullName}: ${err.message}`);
      }
    }
  }

  // Actualizar Campaign.totalInvited
  if (created > 0) {
    const totalParticipants = await prisma.participant.count({
      where: { campaignId: cycle.campaignId! }
    });
    await prisma.campaign.update({
      where: { id: cycle.campaignId! },
      data: { totalInvited: totalParticipants }
    });
  }

  console.log(`[Upward] Generadas ${created} evaluaciones, ${skipped} omitidas`);
  return { created, skipped, errors };
}

/**
 * Genera auto-evaluaciones (SELF)
 */
export async function generateSelfEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId },
    include: { campaign: true }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  if (!cycle.campaignId || !cycle.campaign) {
    throw new Error('El ciclo no tiene una Campaign vinculada. Vincule el ciclo a una campaña primero.');
  }

  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE'
    },
    include: { department: true }
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  for (const employee of employees) {
    try {
      const existing = await prisma.evaluationAssignment.findFirst({
        where: {
          cycleId,
          evaluatorId: employee.id,
          evaluateeId: employee.id,
          evaluationType: 'SELF'
        }
      });

      if (existing) {
        skipped++;
        continue;
      }

      // En SELF, evaluator y evaluatee son la misma persona
      await prisma.$transaction(async (tx) => {
        const assignment = await tx.evaluationAssignment.create({
          data: {
            accountId,
            cycleId,
            evaluatorId: employee.id,
            evaluateeId: employee.id,
            evaluationType: 'SELF',

            snapshotDate,
            evaluateeName: employee.fullName,
            evaluateeNationalId: employee.nationalId,
            evaluateeDepartmentId: employee.departmentId,
            evaluateeDepartment: employee.department.displayName,
            evaluateePosition: employee.position,

            evaluateePerformanceTrack: employee.performanceTrack,

            evaluatorName: employee.fullName,
            evaluatorNationalId: employee.nationalId,
            evaluatorDepartmentId: employee.departmentId,
            evaluatorDepartment: employee.department.displayName,

            status: 'PENDING',
            dueDate: options?.dueDate || cycle.endDate
          }
        });

        // En SELF: nationalId y email son de la misma persona
        await tx.participant.create({
          data: {
            campaignId: cycle.campaignId!,
            nationalId: employee.nationalId,
            name: employee.fullName,
            email: employee.email,
            departmentId: employee.departmentId,
            evaluationAssignmentId: assignment.id,
            uniqueToken: generateUniqueToken(),
            hasResponded: false
          }
        });
      });

      created++;
    } catch (err: any) {
      errors.push(`Error self ${employee.fullName}: ${err.message}`);
    }
  }

  // Actualizar Campaign.totalInvited
  if (created > 0) {
    const totalParticipants = await prisma.participant.count({
      where: { campaignId: cycle.campaignId! }
    });
    await prisma.campaign.update({
      where: { id: cycle.campaignId! },
      data: { totalInvited: totalParticipants }
    });
  }

  return { created, skipped, errors };
}

/**
 * Genera evaluaciones PEER_TO_PEER (entre pares)
 * Para 360° - Solo empleados del mismo departamento
 */
export async function generatePeerEvaluations(
  cycleId: string,
  accountId: string,
  options?: GenerateOptions
): Promise<GenerateResult> {
  const cycle = await prisma.performanceCycle.findFirst({
    where: { id: cycleId, accountId },
    include: { campaign: true }
  });

  if (!cycle) {
    throw new Error('Ciclo no encontrado');
  }

  if (!cycle.campaignId || !cycle.campaign) {
    throw new Error('El ciclo no tiene una Campaign vinculada. Vincule el ciclo a una campaña primero.');
  }

  // Agrupar empleados por departamento
  const employees = await prisma.employee.findMany({
    where: {
      accountId,
      status: 'ACTIVE'
    },
    include: { department: true }
  });

  // Crear mapa por departamento
  const deptMap = new Map<string, typeof employees>();
  for (const emp of employees) {
    const deptEmps = deptMap.get(emp.departmentId) || [];
    deptEmps.push(emp);
    deptMap.set(emp.departmentId, deptEmps);
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const snapshotDate = new Date();

  // Para cada departamento, crear evaluaciones cruzadas
  for (const [deptId, deptEmployees] of deptMap) {
    // Solo departamentos con 2+ empleados
    if (deptEmployees.length < 2) continue;

    for (const evaluator of deptEmployees) {
      for (const evaluatee of deptEmployees) {
        // No se evalúa a sí mismo (eso es SELF)
        if (evaluator.id === evaluatee.id) continue;

        try {
          const existing = await prisma.evaluationAssignment.findFirst({
            where: {
              cycleId,
              evaluatorId: evaluator.id,
              evaluateeId: evaluatee.id,
              evaluationType: 'PEER'
            }
          });

          if (existing) {
            skipped++;
            continue;
          }

          await prisma.$transaction(async (tx) => {
            const assignment = await tx.evaluationAssignment.create({
              data: {
                accountId,
                cycleId,
                evaluatorId: evaluator.id,
                evaluateeId: evaluatee.id,
                evaluationType: 'PEER',

                snapshotDate,
                evaluateeName: evaluatee.fullName,
                evaluateeNationalId: evaluatee.nationalId,
                evaluateeDepartmentId: evaluatee.departmentId,
                evaluateeDepartment: evaluatee.department.displayName,
                evaluateePosition: evaluatee.position,

                evaluateePerformanceTrack: evaluatee.performanceTrack,

                evaluatorName: evaluator.fullName,
                evaluatorNationalId: evaluator.nationalId,
                evaluatorDepartmentId: evaluator.departmentId,
                evaluatorDepartment: evaluator.department.displayName,

                status: 'PENDING',
                dueDate: options?.dueDate || cycle.endDate
              }
            });

            // nationalId = EVALUATEE, email = EVALUADOR
            await tx.participant.create({
              data: {
                campaignId: cycle.campaignId!,
                nationalId: evaluatee.nationalId,
                name: evaluatee.fullName,
                email: evaluator.email,
                departmentId: evaluatee.departmentId,
                evaluationAssignmentId: assignment.id,
                uniqueToken: generateUniqueToken(),
                hasResponded: false
              }
            });
          });

          created++;
        } catch (err: any) {
          errors.push(`Error peer ${evaluator.fullName} → ${evaluatee.fullName}: ${err.message}`);
        }
      }
    }
  }

  // Actualizar Campaign.totalInvited
  if (created > 0) {
    const totalParticipants = await prisma.participant.count({
      where: { campaignId: cycle.campaignId! }
    });
    await prisma.campaign.update({
      where: { id: cycle.campaignId! },
      data: { totalInvited: totalParticipants }
    });
  }

  return { created, skipped, errors };
}
