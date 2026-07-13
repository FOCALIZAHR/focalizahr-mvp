// ════════════════════════════════════════════════════════════════════════════
// SMOKE — GoalAlert: avisos personales de metas (asignada / aprobado / rechazado)
// prisma/scripts/smoke-goal-alerts.ts
// ════════════════════════════════════════════════════════════════════════════
// Cubre: emisión en los 3 momentos, COMPANY sin dueño no emite,
//   closureRequestedById poblado, y AISLAMIENTO por destinatario y multi-tenant
//   (GET no lista alertas ajenas; PATCH ajeno → 404). Cuentas SINTÉTICAS,
//   cleanup por accountId. UNTRACKED (borrar al sellar el gate).
//
// Ejecutar: npx tsx prisma/scripts/smoke-goal-alerts.ts
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server'
import { prisma } from '../../src/lib/prisma'
import { GoalsService, GoalClosureActor } from '../../src/lib/services/GoalsService'
import { GET as getAlerts } from '../../src/app/api/goals/alerts/route'
import { PATCH as patchAlert } from '../../src/app/api/goals/alerts/[id]/route'

const SENTINEL_A = 'smoke-goalalerts-a@fixture.local'
const SENTINEL_B = 'smoke-goalalerts-b@fixture.local'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERT FALLÓ: ${msg}`)
  console.log(`  ✓ ${msg}`)
}

// ── Simulación de request con headers del middleware ────────────────────────
function makeReq(url: string, h: { accountId: string; email: string; role: string }): NextRequest {
  return new NextRequest(url, {
    headers: new Headers({
      'x-account-id': h.accountId,
      'x-user-email': h.email,
      'x-user-role': h.role,
      'x-user-id': `user-${h.email}`,
      'x-department-id': '',
    }),
  })
}

async function getUnread(h: { accountId: string; email: string; role: string }): Promise<any[]> {
  const res = await getAlerts(makeReq('http://localhost/api/goals/alerts?unread=true', h))
  const body = await res.json()
  assert(res.status === 200, `GET alerts 200 para ${h.email} (obtuve ${res.status})`)
  return body.data as any[]
}

async function purgeAccountData(id: string) {
  await prisma.goalAlert.deleteMany({ where: { accountId: id } })
  await prisma.goalProgressUpdate.deleteMany({ where: { accountId: id } })
  await prisma.goal.deleteMany({ where: { accountId: id } })
  await prisma.employee.deleteMany({ where: { accountId: id } })
  await prisma.department.deleteMany({ where: { accountId: id } })
  await prisma.account.delete({ where: { id } })
}

async function ensureCleanAccount(sentinel: string, companyName: string): Promise<string> {
  const leftover = await prisma.account.findUnique({ where: { adminEmail: sentinel }, select: { id: true } })
  if (leftover) await purgeAccountData(leftover.id)
  const acc = await prisma.account.create({
    data: { companyName, adminEmail: sentinel, adminName: 'Smoke GoalAlerts', passwordHash: 'smoke-not-a-real-hash' },
    select: { id: true },
  })
  return acc.id
}

async function createDept(accountId: string, displayName: string): Promise<string> {
  const d = await prisma.department.create({ data: { accountId, displayName }, select: { id: true } })
  return d.id
}

async function createEmployee(
  accountId: string, departmentId: string, email: string, fullName: string, nationalId: string
): Promise<string> {
  const e = await prisma.employee.create({
    data: { accountId, departmentId, email, fullName, nationalId, hireDate: new Date('2025-01-01'), status: 'ACTIVE' },
    select: { id: true },
  })
  return e.id
}

async function createOwnedGoal(accountId: string, employeeId: string, title: string): Promise<string> {
  const g = await GoalsService.createManagerGoal({
    accountId,
    title,
    level: 'INDIVIDUAL',
    employeeId,
    createdById: 'smoke-ga',
    startDate: new Date('2026-02-01'),
    dueDate: new Date('2026-11-30'),
    periodYear: 2026,
    targetValue: 100,
    weight: 10,
  })
  return g.id
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  SMOKE GoalAlert — avisos personales de metas')
  console.log('══════════════════════════════════════════════════════════════')

  const accountA = await ensureCleanAccount(SENTINEL_A, 'SMOKE GoalAlerts A')
  const accountB = await ensureCleanAccount(SENTINEL_B, 'SMOKE GoalAlerts B')
  const deptA = await createDept(accountA, 'Depto A')
  const deptB = await createDept(accountB, 'Depto B')

  const empA1 = await createEmployee(accountA, deptA, 'smoke-ga-a1@fixture.local', 'Empleado A1', 'RUT-A1')
  const empA2 = await createEmployee(accountA, deptA, 'smoke-ga-a2@fixture.local', 'Empleado A2', 'RUT-A2')
  const empB1 = await createEmployee(accountB, deptB, 'smoke-ga-b1@fixture.local', 'Empleado B1', 'RUT-B1')
  console.log(`✔ Fixtures: A=${accountA} B=${accountB}  empA1=${empA1} empA2=${empA2} empB1=${empB1}\n`)

  const hA1 = { accountId: accountA, email: 'smoke-ga-a1@fixture.local', role: 'HR_MANAGER' }
  const hA2 = { accountId: accountA, email: 'smoke-ga-a2@fixture.local', role: 'HR_MANAGER' }
  const hB1 = { accountId: accountB, email: 'smoke-ga-b1@fixture.local', role: 'HR_MANAGER' }

  // Actor del solicitante (empA1) y del aprobador (global, distinto)
  const actorA1: GoalClosureActor = {
    accountId: accountA, role: 'HR_MANAGER', departmentId: null,
    userId: 'user-a1', employeeId: empA1, employeeName: 'Empleado A1',
    userName: 'Empleado A1', userEmail: 'smoke-ga-a1@fixture.local',
  }
  const actorApprover: GoalClosureActor = {
    accountId: accountA, role: 'ACCOUNT_OWNER', departmentId: null,
    userId: 'user-owner', employeeId: empA2, employeeName: 'Aprobador',
    userName: 'Aprobador', userEmail: 'smoke-ga-a2@fixture.local',
  }
  // Actor EJECUTIVO sin fila Employee (caso CEO real del bug): employeeName null,
  // el nombre debe resolverse desde userName (no caer a 'Administrador').
  const actorCeo: GoalClosureActor = {
    accountId: accountA, role: 'CEO', departmentId: null,
    userId: 'user-ceo', employeeId: null, employeeName: null,
    userName: 'Valentina CEO', userEmail: 'ceo@fixture.local',
  }

  // ── T1: GOAL_ASSIGNED al crear meta con dueño ───────────────────────────────
  console.log('── T1: GOAL_ASSIGNED ──')
  const goalApprove = await createOwnedGoal(accountA, empA1, 'Meta A1 (approve)')
  const assignedAlerts = await prisma.goalAlert.findMany({ where: { goalId: goalApprove } })
  assert(assignedAlerts.length === 1, `1 alerta emitida (obtuve ${assignedAlerts.length})`)
  assert(assignedAlerts[0].type === 'GOAL_ASSIGNED', 'type = GOAL_ASSIGNED')
  assert(assignedAlerts[0].recipientEmployeeId === empA1, 'destinatario = dueño (empA1)')
  assert(assignedAlerts[0].readAt === null, 'nace no leída (readAt null)')
  assert(assignedAlerts[0].accountId === accountA, 'lleva accountId (multi-tenant)')

  // ── T2: COMPANY (sin dueño) NO emite ────────────────────────────────────────
  console.log('\n── T2: COMPANY sin dueño no emite ──')
  const goalCompany = await GoalsService.createCorporateGoal({
    accountId: accountA, title: 'Meta corporativa A', createdById: 'smoke-ga',
    startDate: new Date('2026-02-01'), dueDate: new Date('2026-11-30'), periodYear: 2026, targetValue: 100,
  })
  const companyAlerts = await prisma.goalAlert.count({ where: { goalId: goalCompany.id } })
  assert(companyAlerts === 0, 'meta COMPANY no genera alerta')

  // ── T3: closureRequestedById + CLOSURE_APPROVED ─────────────────────────────
  console.log('\n── T3: solicitud + aprobación de cierre ──')
  await GoalsService.requestClosure(goalApprove, actorA1, { enforceMinProgress: false })
  const afterReq = await prisma.goal.findUnique({ where: { id: goalApprove }, select: { closureRequestedById: true } })
  assert(afterReq?.closureRequestedById === empA1, 'closureRequestedById = solicitante (empA1)')
  await GoalsService.approveClosure(goalApprove, actorApprover, { notes: 'ok' })
  const approvedAlert = await prisma.goalAlert.findFirst({ where: { goalId: goalApprove, type: 'CLOSURE_APPROVED' } })
  assert(!!approvedAlert, 'CLOSURE_APPROVED emitida')
  assert(approvedAlert!.recipientEmployeeId === empA1, 'CLOSURE_APPROVED al solicitante (empA1)')

  // ── T4: CLOSURE_REJECTED con motivo ─────────────────────────────────────────
  console.log('\n── T4: rechazo de cierre con motivo ──')
  const goalReject = await createOwnedGoal(accountA, empA1, 'Meta A1 (reject)')
  await GoalsService.requestClosure(goalReject, actorA1, { enforceMinProgress: false })
  const reason = 'No cumple criterios de cierre'
  await GoalsService.rejectClosure(goalReject, actorApprover, { reason })
  const rejectedAlert = await prisma.goalAlert.findFirst({ where: { goalId: goalReject, type: 'CLOSURE_REJECTED' } })
  assert(!!rejectedAlert, 'CLOSURE_REJECTED emitida')
  assert(rejectedAlert!.recipientEmployeeId === empA1, 'CLOSURE_REJECTED al solicitante (empA1)')
  assert((rejectedAlert!.context as any)?.reason === reason, 'context.reason = motivo del rechazo')

  // ── T5: GET propio lista los no leídos del destinatario ─────────────────────
  console.log('\n── T5: GET propio (empA1) ──')
  const a1Unread = await getUnread(hA1)
  // empA1 acumula: GOAL_ASSIGNED×2 (approve+reject) + CLOSURE_APPROVED + CLOSURE_REJECTED = 4
  assert(a1Unread.length === 4, `empA1 ve 4 no leídos (obtuve ${a1Unread.length})`)
  assert(a1Unread.every(a => a.recipientEmployeeId === empA1), 'todas son de empA1')
  const targetId = a1Unread[0].id as string

  // ── T6: AISLAMIENTO de lectura (GET) — empA2 no ve alertas de empA1 ──────────
  console.log('\n── T6: aislamiento de lectura (empA2, misma cuenta) ──')
  const a2Unread = await getUnread(hA2)
  assert(a2Unread.length === 0, `empA2 ve 0 (obtuve ${a2Unread.length})`)
  assert(!a2Unread.some(a => a.id === targetId), 'empA2 NO ve la alerta ajena en su GET')

  // ── T7: AISLAMIENTO de escritura (PATCH) — empA2 no marca ajena → 404 ────────
  console.log('\n── T7: aislamiento de escritura (PATCH ajeno) ──')
  const patchAjeno = await patchAlert(makeReq(`http://localhost/api/goals/alerts/${targetId}`, hA2), { params: { id: targetId } })
  assert(patchAjeno.status === 404, `PATCH ajeno → 404 (obtuve ${patchAjeno.status})`)
  const stillUnread = await prisma.goalAlert.findUnique({ where: { id: targetId }, select: { readAt: true } })
  assert(stillUnread?.readAt === null, 'la alerta ajena sigue no leída (no la tocó)')

  // ── T8: PATCH propio marca leída ────────────────────────────────────────────
  console.log('\n── T8: PATCH propio (empA1) ──')
  const patchPropio = await patchAlert(makeReq(`http://localhost/api/goals/alerts/${targetId}`, hA1), { params: { id: targetId } })
  assert(patchPropio.status === 200, `PATCH propio → 200 (obtuve ${patchPropio.status})`)
  const a1UnreadAfter = await getUnread(hA1)
  assert(a1UnreadAfter.length === 3, `empA1 ve 3 no leídos tras marcar (obtuve ${a1UnreadAfter.length})`)

  // ── T9: AISLAMIENTO multi-tenant (GET) — empB1 no ve alertas de la cuenta A ──
  console.log('\n── T9: aislamiento multi-tenant (empB1, cuenta B) ──')
  const b1Unread = await getUnread(hB1)
  assert(b1Unread.length === 0, `empB1 ve 0 (obtuve ${b1Unread.length})`)
  assert(!b1Unread.some(a => a.recipientEmployeeId === empA1), 'ninguna alerta de la cuenta A aparece para empB1')

  // ── T10: actor ejecutivo SIN Employee → nombre real (no 'Administrador') ─────
  console.log('\n── T10: aprobación por CEO sin fila Employee ──')
  const goalCeo = await createOwnedGoal(accountA, empA1, 'Meta A1 (CEO approve)')
  await GoalsService.requestClosure(goalCeo, actorA1, { enforceMinProgress: false })
  await GoalsService.approveClosure(goalCeo, actorCeo, { notes: 'visto bueno' })
  const ceoAlert = await prisma.goalAlert.findFirst({ where: { goalId: goalCeo, type: 'CLOSURE_APPROVED' } })
  assert(!!ceoAlert, 'CLOSURE_APPROVED emitida (CEO)')
  assert((ceoAlert!.context as any)?.actorName === 'Valentina CEO', `actorName = nombre real del CEO, NO 'Administrador' (obtuve ${(ceoAlert!.context as any)?.actorName})`)
  const ceoGoal = await prisma.goal.findUnique({ where: { id: goalCeo }, select: { closedBy: true, closureApprovedBy: true } })
  assert(ceoGoal?.closedBy === 'Valentina CEO', `Goal.closedBy = CEO real (obtuve ${ceoGoal?.closedBy})`)
  assert(ceoGoal?.closureApprovedBy === 'Valentina CEO', 'Goal.closureApprovedBy = CEO real')
  const ceoAudit = await prisma.goalProgressUpdate.findFirst({
    where: { goalId: goalCeo, comment: { contains: 'aprobada' } },
    select: { comment: true },
  })
  assert(!!ceoAudit?.comment?.includes('Valentina CEO'), 'auditoría (GoalProgressUpdate) nombra al CEO real')

  // ── T11: rechazo por CEO sin Employee → nombre real + motivo ────────────────
  console.log('\n── T11: rechazo por CEO sin fila Employee ──')
  const goalCeoReject = await createOwnedGoal(accountA, empA1, 'Meta A1 (CEO reject)')
  await GoalsService.requestClosure(goalCeoReject, actorA1, { enforceMinProgress: false })
  const ceoReason = 'Falta evidencia de impacto'
  await GoalsService.rejectClosure(goalCeoReject, actorCeo, { reason: ceoReason })
  const ceoRejAlert = await prisma.goalAlert.findFirst({ where: { goalId: goalCeoReject, type: 'CLOSURE_REJECTED' } })
  assert(!!ceoRejAlert, 'CLOSURE_REJECTED emitida (CEO)')
  assert((ceoRejAlert!.context as any)?.actorName === 'Valentina CEO', `actorName = CEO real (obtuve ${(ceoRejAlert!.context as any)?.actorName})`)
  assert((ceoRejAlert!.context as any)?.reason === ceoReason, 'context.reason = motivo del rechazo')

  console.log('\n──────────────────────────────────────────────────────────────')
  console.log('  ✅ SMOKE GoalAlert VERDE')
  console.log('──────────────────────────────────────────────────────────────')

  // Cleanup por accountId (orden: hijos → employees → departments → account)
  await purgeAccountData(accountA)
  await purgeAccountData(accountB)
  console.log('  (fixtures limpiados)')
}

main()
  .catch((e) => { console.error('\n❌ SMOKE FALLÓ:', e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
