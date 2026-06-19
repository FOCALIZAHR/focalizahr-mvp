// ════════════════════════════════════════════════════════════════════════════
// RESOLVE PHONE - Resolucion multi-estrategia de telefono (Gate B v3.0)
// src/lib/services/resolvePhone.ts
// ════════════════════════════════════════════════════════════════════════════
// Pobla el phoneNumber que el channel-selector (Regla Cero) NO busca: el selector
// decide el canal con el dato ya resuelto. Quien resuelve el dato es este modulo.
//
// Arquitectura: ARQUITECTURA_WHATSAPP_CHANNEL_SELECTOR.md seccion 2.
// Spec: .claude/tasks/SPEC_GATE_B_COMUNICACIONES_v3.md seccion 3.
//
// DOS funciones, separadas por responsabilidad (reuse Gate D/E sin reimplementar):
//   - buildPhoneResolutionBatch  -> ASYNC, duena de TODO el I/O. 3 queries batched
//     (cero N+1). Toma participantes con SOLO escalares (sin includes) y retorna un
//     contexto con 3 maps. Ningun caller recuerda un include.
//   - resolvePhone               -> PURA. Aplica la cadena de estrategias sobre el
//     participante + el contexto prefetcheado. Sin BD, testeable como funcion pura.
//
// PRIORIDAD (cadena normal):
//   Participant.phoneNumber                        [Estrategia 1]
//   ?? Employee.phoneNumber via employeeId         [Estrategia 2: Ambiente Sano]
//   ?? Employee.phoneNumber via nationalId match   [Estrategia 3: Onboarding/Exit]
//   ?? null -> determineChannel retorna 'none'
//
// EXCEPCION Performance (NUNCA entra en la cadena de arriba):
//   Participant.evaluationAssignmentId
//     -> EvaluationAssignment.evaluator (relacion "Evaluator")
//     -> Employee.phoneNumber                      [Estrategia 2b]
//
// INVARIANTE DE SEGURIDAD CRITICO (no negociable):
//   El trigger de la excepcion Performance es la PRESENCIA de evaluationAssignmentId,
//   no un slug. Si esta presente, se resuelve SOLO por 2b y JAMAS cae a Estrategia 3.
//   En Performance, Participant.nationalId = EVALUADO y Participant.email = EVALUADOR;
//   el WhatsApp va al EVALUADOR. Resolver por nationalId mandaria el mensaje a la
//   persona equivocada. Por eso, si 2b da null, el resultado es null (no fallback).
// ════════════════════════════════════════════════════════════════════════════

import type { PrismaClient, Prisma } from '@prisma/client';

// Cliente Prisma o cliente de transaccion: el batch funciona dentro o fuera de una tx.
type PrismaLike = PrismaClient | Prisma.TransactionClient;

/**
 * Datos de contacto del Employee master. Gate B solo consume phoneNumber, pero el
 * select trae los 5 campos de canal (costo cero, mismo fetch) para que Gate C sume
 * resolveContactContext sin tocar buildPhoneResolutionBatch.
 */
export type EmployeeContact = {
  phoneNumber: string | null;
  personalEmail: string | null;
  preferredChannel: string | null;
  channelConsentAt: Date | null;
  channelConsentMethod: string | null;
};

/**
 * Participante con SOLO escalares. Contrato minimo que cualquier encolador satisface
 * con un select plano, sin includes. Esto es lo que hace al modulo reusable.
 */
export type ParticipantForPhone = {
  id: string;
  phoneNumber: string | null;
  nationalId: string;
  employeeId: string | null;
  evaluationAssignmentId: string | null;
};

/**
 * Contexto con los 3 lookups que las estrategias necesitan, ya resueltos.
 * Cada estrategia keyea por un campo distinto, por eso son 3 maps y no uno.
 */
export type PhoneResolutionContext = {
  employeeById: Map<string, EmployeeContact>;          // Estrategia 2 (employeeId)
  employeeByNationalId: Map<string, EmployeeContact>;  // Estrategia 3 (nationalId)
  evaluatorByAssignmentId: Map<string, string | null>; // Estrategia 2b (assignment -> evaluador.phone)
};

// Select compartido: los 5 campos de canal del Employee master (Gate A).
const EMPLOYEE_CONTACT_SELECT = {
  phoneNumber: true,
  personalEmail: true,
  preferredChannel: true,
  channelConsentAt: true,
  channelConsentMethod: true,
} as const;

// Trata null y string vacio/espacios como ausente, para que la cadena caiga a la
// siguiente estrategia. Un string presente pero invalido SI gana (semantica `??`
// del snapshot): el channel-selector lo validara y decidira 'none' si no sirve.
function isPresent(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * FUNCION 1 (async): construye el contexto de resolucion con 3 queries batched.
 *
 * Multi-tenant: las consultas a Employee se scopean por accountId. La correlacion
 * por nationalId (Estrategia 3) ademas filtra isActive=true (ex-empleados no deben
 * resolver telefono de la persona equivocada).
 *
 * @param participants - participantes con escalares (sin includes)
 * @param accountId    - cuenta para scope multi-tenant de los Employee
 * @param tx           - PrismaClient o cliente de transaccion
 */
export async function buildPhoneResolutionBatch(
  participants: ParticipantForPhone[],
  accountId: string,
  tx: PrismaLike
): Promise<PhoneResolutionContext> {
  const employeeById = new Map<string, EmployeeContact>();
  const employeeByNationalId = new Map<string, EmployeeContact>();
  const evaluatorByAssignmentId = new Map<string, string | null>();

  // Estrategia 2: employeeId de cualquier participante que lo traiga.
  const employeeIds = Array.from(
    new Set(participants.filter((p) => p.employeeId).map((p) => p.employeeId as string))
  );

  // Estrategia 2b: assignmentId de participantes Performance.
  const assignmentIds = Array.from(
    new Set(
      participants
        .filter((p) => p.evaluationAssignmentId)
        .map((p) => p.evaluationAssignmentId as string)
    )
  );

  // Estrategia 3: solo nationalIds que realmente la necesitarian (sin phone propio,
  // sin employeeId y sin assignment). Mantiene la query chica.
  const nationalIdCandidates = Array.from(
    new Set(
      participants
        .filter(
          (p) => !isPresent(p.phoneNumber) && !p.employeeId && !p.evaluationAssignmentId
        )
        .map((p) => p.nationalId)
    )
  );

  // Query A: Employee por id (Estrategia 2)
  if (employeeIds.length > 0) {
    const rows = await tx.employee.findMany({
      where: { id: { in: employeeIds }, accountId },
      select: { id: true, ...EMPLOYEE_CONTACT_SELECT },
    });
    for (const r of rows) {
      const { id, ...contact } = r;
      employeeById.set(id, contact);
    }
  }

  // Query B: Employee por nationalId activo (Estrategia 3)
  if (nationalIdCandidates.length > 0) {
    const rows = await tx.employee.findMany({
      where: { nationalId: { in: nationalIdCandidates }, accountId, isActive: true },
      select: { nationalId: true, ...EMPLOYEE_CONTACT_SELECT },
    });
    for (const r of rows) {
      const { nationalId, ...contact } = r;
      // Si el RUT esta duplicado en el master, gana el primero; ambiguedad real
      // es responsabilidad de la calidad de datos, no de la resolucion de canal.
      if (!employeeByNationalId.has(nationalId)) {
        employeeByNationalId.set(nationalId, contact);
      }
    }
  }

  // Query C: EvaluationAssignment -> evaluador.phoneNumber (Estrategia 2b)
  if (assignmentIds.length > 0) {
    const rows = await tx.evaluationAssignment.findMany({
      where: { id: { in: assignmentIds }, accountId },
      select: { id: true, evaluator: { select: { phoneNumber: true } } },
    });
    for (const r of rows) {
      evaluatorByAssignmentId.set(r.id, r.evaluator?.phoneNumber ?? null);
    }
  }

  return { employeeById, employeeByNationalId, evaluatorByAssignmentId };
}

/**
 * FUNCION 2 (pura): resuelve el telefono de un participante con el contexto ya armado.
 *
 * Sin BD. Aplica la excepcion Performance primero (por presencia de
 * evaluationAssignmentId) y, si no aplica, la cadena 1 -> 2 -> 3.
 *
 * @returns telefono resuelto o null (el caller pasa null a determineChannel -> 'none')
 */
export function resolvePhone(
  participant: ParticipantForPhone,
  ctx: PhoneResolutionContext
): string | null {
  // EXCEPCION Performance: trigger por presencia de evaluationAssignmentId.
  // SOLO Estrategia 2b. Nunca cae a Estrategia 3 (mandaria el WhatsApp al evaluado).
  if (participant.evaluationAssignmentId) {
    const evaluatorPhone = ctx.evaluatorByAssignmentId.get(
      participant.evaluationAssignmentId
    );
    return isPresent(evaluatorPhone) ? evaluatorPhone : null;
  }

  // Cadena normal.
  // Estrategia 1: telefono propio del Participant (snapshot point-in-time).
  if (isPresent(participant.phoneNumber)) {
    return participant.phoneNumber;
  }

  // Estrategia 2: Employee via employeeId.
  if (participant.employeeId) {
    const emp = ctx.employeeById.get(participant.employeeId);
    if (emp && isPresent(emp.phoneNumber)) {
      return emp.phoneNumber;
    }
  }

  // Estrategia 3: Employee via correlacion nationalId.
  const byNationalId = ctx.employeeByNationalId.get(participant.nationalId);
  if (byNationalId && isPresent(byNationalId.phoneNumber)) {
    return byNationalId.phoneNumber;
  }

  // Sin contacto telefonico resoluble.
  return null;
}
