// ════════════════════════════════════════════════════════════════════════════
// CONSENT DERIVATION - Fuente unica del consent C1 (Gate E.1 v3.0)
// src/lib/services/consent-derivation.ts
// ════════════════════════════════════════════════════════════════════════════
// La tabla ConsentEvent es la UNICA fuente de verdad del consent de canales
// personales (C1). Este modulo:
//   - DERIVA el estado para despachar leyendo el log (regla §2.2 de la spec).
//   - CONSULTA el log (single + batch, sin N+1).
//   - APPEND de eventos (insert-only; lo usan los escritores migrados).
//
// NO existe un campo cache persistente del consent derivado: un cache es una
// segunda version de la verdad que puede contradecir al log y mandar WhatsApp a
// quien revoco (la violacion exacta de la Ley 21.719 que esto existe para evitar).
// El unico "cache" es el Map en memoria del batch, por la duracion de la request.
//
// channel-selector.ts queda PURO (clasifica metodos con isRealOptIn, sin BD). Este
// modulo es el que toca BD. Es el modulo central que Etapa 2 (self-service del
// titular) y E.2 reusan SIN tocar la regla de derivacion (ya lee cualquier origen).
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import type { PrismaClient, Prisma } from '@prisma/client';
import { ConsentOrigen, ConsentTipo } from '@prisma/client';
import { isRealOptIn } from './channel-selector';

// Cliente Prisma o cliente de transaccion: funciona dentro o fuera de una tx.
type PrismaLike = PrismaClient | Prisma.TransactionClient;

// Contrato minimo que la regla pura necesita de cada evento. Un select plano lo
// satisface; no requiere el evento completo.
export type ConsentEventForRule = {
  tipo: ConsentTipo;
  metodo: string;
};

/**
 * REGLA DE DERIVACION (§2.2) — pura, sobre eventos ya cargados.
 *
 * PASO 1 (veto): existe algun evento REVOCACION (STOP) -> false. Gana sobre TODO,
 *   sin importar fecha, AUNQUE existan autorizaciones POSTERIORES. STOP es terminal
 *   en E.1 (la re-autorizacion es capacidad de Etapa 2). El orden de los eventos NO
 *   altera el resultado: un STOP presente siempre veta.
 * PASO 2 (habilita): existe al menos UN evento AUTORIZACION con metodo de opt-in
 *   REAL (isRealOptIn) de CUALQUIER origen -> true.
 * Si no -> false (fail-closed). Ausencia de evento NO es STOP: si despues llega una
 *   autorizacion, habilita.
 *
 * admin_loaded (proxy de empresa) es AUTORIZACION pero NO opt-in real: no habilita
 * contenido por si solo (solo habilita disparar la solicitud, fuera de esta regla).
 */
export function deriveConsentFromEvents(events: ConsentEventForRule[]): boolean {
  // PASO 1 — veto terminal: cualquier STOP, sin importar fecha.
  if (events.some((e) => e.tipo === ConsentTipo.REVOCACION)) {
    return false;
  }
  // PASO 2 — habilita: al menos una autorizacion con opt-in real.
  if (events.some((e) => e.tipo === ConsentTipo.AUTORIZACION && isRealOptIn(e.metodo))) {
    return true;
  }
  // Fail-closed: sin eventos, o solo proxy/desconocido.
  return false;
}

/**
 * Deriva el consent C1 de UN employee (lee el log).
 *
 * SCOPE MULTI-TENANT OBLIGATORIO: filtra SIEMPRE por accountId ademas de employeeId;
 * nunca deriva consent cruzando cuentas.
 *
 * @returns true si puede recibir CONTENIDO por canal personal (encuestas,
 *          recordatorios, escalacion). false fail-closed.
 */
export async function puedeRecibirContenidoPersonal(
  employeeId: string,
  accountId: string,
  tx: PrismaLike = prisma
): Promise<boolean> {
  const events = await tx.consentEvent.findMany({
    where: { employeeId, accountId },
    select: { tipo: true, metodo: true },
  });
  return deriveConsentFromEvents(events);
}

/**
 * Deriva el consent C1 de MUCHOS employees EN BATCH (una sola query, sin N+1).
 *
 * activate y survey-escalation procesan lotes (ya usan buildPhoneResolutionBatch);
 * la derivacion se suma al mismo patron batch. determineChannel sigue siendo pura:
 * recibe el booleano YA resuelto, no consulta la tabla.
 *
 * @returns Map<employeeId, boolean>. Un employee sin eventos NO aparece como true:
 *          el caller usa `map.get(id) ?? false` (fail-closed por ausencia).
 */
export async function deriveConsentBatch(
  employeeIds: string[],
  accountId: string,
  tx: PrismaLike = prisma
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  const uniqueIds = Array.from(new Set(employeeIds));
  if (uniqueIds.length === 0) return result;

  const events = await tx.consentEvent.findMany({
    where: { employeeId: { in: uniqueIds }, accountId },
    select: { employeeId: true, tipo: true, metodo: true },
  });

  // Agrupar eventos por employee en memoria.
  const byEmployee = new Map<string, ConsentEventForRule[]>();
  for (const e of events) {
    const list = byEmployee.get(e.employeeId);
    if (list) list.push({ tipo: e.tipo, metodo: e.metodo });
    else byEmployee.set(e.employeeId, [{ tipo: e.tipo, metodo: e.metodo }]);
  }

  // Derivar el booleano para CADA id pedido (los sin eventos -> false fail-closed).
  for (const id of uniqueIds) {
    result.set(id, deriveConsentFromEvents(byEmployee.get(id) ?? []));
  }
  return result;
}

/**
 * ¿El titular REVOCÓ (STOP)? true si existe algun evento REVOCACION para el employee.
 *
 * Distinto de puedeRecibirContenidoPersonal: aquel da false tambien por AUSENCIA de
 * opt-in (fail-closed). Este detecta SOLO el veto ACTIVO. Lo usa el guard de mensajes
 * de sesion (ej. request-email): el STOP es veto TOTAL, ni el request-email se envia
 * (spec §7), pero un employee sin opt-in real (que aun no revoco) SÍ puede recibir la
 * solicitud / request-email. Por eso no se reusa la derivacion de contenido aqui.
 */
export async function isConsentRevoked(
  employeeId: string,
  accountId: string,
  tx: PrismaLike = prisma
): Promise<boolean> {
  const count = await tx.consentEvent.count({
    where: { employeeId, accountId, tipo: ConsentTipo.REVOCACION },
  });
  return count > 0;
}

/**
 * Subconjunto de employeeIds que REVOCARON (tienen evento REVOCACION), EN BATCH.
 * Lo usa el enqueue de la solicitud (channel-onboarding): el STOP es veto total, no se
 * re-solicita consent a quien ya revoco (spec §7). Una sola query para todo el lote.
 */
export async function getRevokedEmployeeIds(
  employeeIds: string[],
  accountId: string,
  tx: PrismaLike = prisma
): Promise<Set<string>> {
  const revoked = new Set<string>();
  const uniqueIds = Array.from(new Set(employeeIds));
  if (uniqueIds.length === 0) return revoked;

  const rows = await tx.consentEvent.findMany({
    where: { employeeId: { in: uniqueIds }, accountId, tipo: ConsentTipo.REVOCACION },
    select: { employeeId: true },
  });
  for (const r of rows) revoked.add(r.employeeId);
  return revoked;
}

/**
 * Datos de un evento de consent a registrar. canalAlcance default 'general' (C1).
 */
export type ConsentEventInput = {
  employeeId: string;
  accountId: string;
  origen: ConsentOrigen;
  tipo: ConsentTipo;
  metodo: string;
  canalAlcance?: string;
};

/**
 * APPEND de un evento de consent (insert-only; nunca update ni delete).
 *
 * Lo usan los escritores migrados (opt-in real por WhatsApp, admin_loaded de empresa,
 * STOP). Nada pisa eventos previos: la autorizacion anterior y el STOP coexisten.
 *
 * Redaccion legal: para origen EMPRESA, el evento significa "la EMPRESA DECLARA que
 * el colaborador la autorizo", NUNCA "el colaborador autorizo" (mantiene a FocalizaHR
 * como Encargado).
 */
export async function appendConsentEvent(
  input: ConsentEventInput,
  tx: PrismaLike = prisma
): Promise<void> {
  await tx.consentEvent.create({
    data: {
      employeeId: input.employeeId,
      accountId: input.accountId,
      origen: input.origen,
      tipo: input.tipo,
      metodo: input.metodo,
      canalAlcance: input.canalAlcance ?? 'general',
    },
  });
}
