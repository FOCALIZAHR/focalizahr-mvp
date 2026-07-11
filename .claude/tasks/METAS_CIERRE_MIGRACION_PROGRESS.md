# Migración cierre de metas — ruta → servicio (PROGRESS)

> Task: mover la lógica REAL de cierre de metas (request / approve / reject) de los
> route handlers (inline) a `GoalsService`, dejando UN solo lugar con la lógica.
> Prerrequisito limpio para Gate F (Comunicaciones de Metas enganchará ahí).
> Migración se sella y pushea SOLA, antes de Gate F (decisión Victor).

## Estado global
- [x] Investigación línea por línea (11 diferencias catalogadas)
- [x] Veredictos confirmados (gana la RUTA en las 11; C2 crudo; C1 4-categorías)
- [x] Contrato JSON confirmado: **cero cambio** (owner ya está hoy; se preserva lean)
- [x] **Fase A — datos sintéticos + matriz golden + caracterización (VERDE)**
- [x] Fase B — assertions servicio migrado == prod (golden) — **49/49 VERDE**
- [x] Fase C — regresión independencia MARK_REVIEW (smoke Gate D.5 20/20 VERDE)
- [x] Fase D — `npx tsc --noEmit` (limpio) + `npm run build` (compiló, sin errores)
- [x] Fase E — E2E HTTP real sobre meta real (request→approve, 200/200), coordinada
- [ ] Sellado (borrar smoke) + commit separado impl/sello + push manual Victor

## Decisiones confirmadas (Victor)
1. Alcance = los 3 pares (request + approve + reject).
2. Gate ≥80% parametrizable (`enforceMinProgress`, default true). MARK_REVIEW NO lo usa
   (acoplamiento cero, ver §0). Blinda a futuros callers, no salva un caller existente.
3. C2: `closureNotes` al rechazar = motivo CRUDO (sin "Rechazado por X:"). El "quién"
   vive en la auditoría `goalProgressUpdate`.
4. Atomicidad: SÍ — `update` + `goalProgressUpdate` en un `$transaction` (cierra hueco latente).
5. Scope: SÍ al servicio (helpers parametrizados por acción). Ruta queda thin.
6. Los 9 veredictos restantes: gana la RUTA (comportamiento de prod hoy).

## §0 — Hecho crítico (verificado en código)
MARK_REVIEW (Gate D.5) NO llama a requestClosure/approveClosure/rejectClosure. Hace un
`updateMany` bulk independiente en `applyCycleClosureDecisions` (`GoalsService.ts:971-985`).
Los 3 métodos de servicio están **100% muertos** (grep: cero callers en src/). Única
superficie de regresión = las 3 rutas. Migración = reescribir los 3 métodos con la
semántica de la ruta y dejar las rutas como thin controllers.

## Contrato JSON — invariante que NO se toca
- request-closure → `{ data, message, success }`
- approve-closure → `{ data, action, message, success }`
- `data` = Goal completo + `owner {id, fullName}` + `department {id, displayName}` (LEAN).
- Los owner ricos (departmentId, managerId) para scope = carga interna, NUNCA en `data`.

## Las 11 diferencias (todas: gana RUTA)
| ID | Dónde | Ruta (prod, gana) | Servicio muerto |
|----|-------|-------------------|-----------------|
| A1 | approve scope | global/AREA_MANAGER, no COMPANY | ausente |
| A2 | approve audit | goalProgressUpdate | ausente |
| A3 | approve notes | `notes \|\| null` | `notes` (undefined) |
| A4 | approve closedBy | actor.actorName derivado | string caller |
| C1 | reject categorías | 4 (≥90/≥70/>0/else NOT_STARTED) | 3 (≥90/≥70/else BEHIND) |
| C2 | reject notes | reason CRUDO | decorado "Rechazado por X:" |
| C3 | reject audit | goalProgressUpdate | ausente |
| C4 | reject scope | = A1 | ausente |
| C5 | reject reason | obligatorio (400) | opcional 'Sin comentarios' |
| R1 | request gate | ≥80% (400) | ausente |
| R2 | request cancelled | 400 si CANCELLED | ausente (deja pasar) |
| R3 | request scope | 4 ramas (global/AREA_MANAGER/EVALUATOR/dueño) | ausente |
| R4 | request audit | goalProgressUpdate | ausente |

## Firmas nuevas (Fase B)
```ts
type GoalClosureActor = {
  accountId: string; role: string | null; departmentId: string | null;
  userId: string | null; employeeId: string | null; actorName: string;
}
requestClosure(goalId, actor, opts?: { enforceMinProgress?: boolean }) // default true
approveClosure(goalId, actor, opts?: { notes?: string })
rejectClosure(goalId, actor, opts: { reason: string })
// Retornan Goal con include LEAN (owner{id,fullName}, department{id,displayName})
// Mutación + auditoría dentro de $transaction. Scope vía assertCanRequest/ApproveClosure.
```

## Fase A — plan del fixture sintético
Script: `prisma/scripts/smoke-goal-closure-migration.ts` (UNTRACKED, se borra al sellar).
Cuenta sintética aislada, cleanup por accountId en `$transaction`.
Objetivo Fase A: (1) construir fixtures que replican las capturas reales (aprobar,
rechazar con motivo, PENDING_CLOSURE), (2) imprimir la MATRIZ GOLDEN (contrato para
Fase B), (3) CARACTERIZAR el servicio muerto actual para PROBAR empíricamente las
diferencias runtime-observables (R1, R2, R4, C1, C2, C3, A2) antes de tocar código.
Las diferencias de scope (A1/C4/R3) son ausencias estructurales (el servicio no tiene
actor) → se documentan en la matriz, se verifican en Fase B con el servicio migrado.

Criterio VERDE Fase A: fixtures construyen OK + cada divergencia runtime observada
coincide con la predicha. (El servicio muerto DEBE divergir del golden — eso es lo
que la migración va a corregir.)

## Log
- (Fase A) Confirmado contrato JSON + escrito PROGRESS + fixture en construcción.
- (Fase A ✅) `smoke-goal-closure-migration.ts` VERDE: fixtures construyen (cuenta+3
  deptos+5 empleados+ciclo ACTIVE), matriz golden impresa, y 6 divergencias runtime
  del servicio muerto CONFIRMADAS empíricamente: R1 (sin gate), R2 (sin check CANCELLED),
  R4/C3/A2 (sin auditoría), C1 (BEHIND vs NOT_STARTED), C2 (notes decorado). Scope
  (A1/C4/R3), C5, A4 = estructurales → se verifican en Fase B con servicio migrado.
- (Fase B ✅) MIGRADO GoalsService (3 métodos + 2 helpers scope + GoalClosureError +
  GoalClosureActor + includes lean/rico) y las 2 rutas → thin controllers. Atomicidad
  vía $transaction. Smoke reescrito a Fase B: 49/49 aserciones VERDE. Cubre las 11
  diferencias en la dirección correcta (servicio == golden), el bypass
  enforceMinProgress:false (patrón cierre forzado), y el CONTRATO JSON (owner LEAN
  {id,fullName} exacto, sin departmentId/managerId). Archivos tocados:
  src/lib/services/GoalsService.ts, src/app/api/goals/[id]/request-closure/route.ts,
  src/app/api/goals/[id]/approve-closure/route.ts. Falta Fase C (MARK_REVIEW) + D (tsc/build).
- (Fase C ✅) smoke Gate D.5 (`smoke-goal-cycle-gateD5.ts`) 20/20 VERDE tras la migración:
  MARK_REVIEW → PENDING_CLOSURE, CLOSE_WITH_SCORE → COMPLETED, lock post-CLOSED, rollback
  todo-o-nada, re-finalize bloqueado. Acoplamiento cero confirmado: la migración no tocó
  applyCycleClosureDecisions/GoalCycleService.
- (Fase D ✅) `npx tsc --noEmit` sin salida (limpio). `npm run build` compiló completo
  (prisma generate + next build), sin errores.
- ESTADO: A–D cerradas. Pendiente: Fase E (meta real, congelada hasta coordinación
  explícita de Victor meta por meta) + sellado (borrar smoke + commit separado impl/sello,
  push manual Victor). NADA pusheado aún.
- (Fase E ✅ 2026-07-10) E2E HTTP REAL sobre meta #4 (goalId cmnfnjb09…, "Ciclo Vigente
  2026", owner VEGA TAMBURINI DANIELA) como vyanezb@gmail.com (HR_MANAGER global). Método:
  next start (build Fase D) en puerto 3100 + token minteado con firma del app (contrato
  /api/auth/user/login, sin password, JWT_SECRET no expuesto) + fetch real → middleware +
  ruta thin + servicio migrado. request-closure HTTP 200 (ON_TRACK→PENDING_CLOSURE,
  closureRequestedBy="Victor Yanez", +1 auditoría). approve HTTP 200 (→COMPLETED,
  closedBy=closureApprovedBy="Victor Yanez", closedAt==completedAt, +1 auditoría).
  Contrato JSON confirmado en respuesta real (owner lean {id,fullName}). Meta quedó
  COMPLETED (decisión Victor: NO revertir). Server abajo, temporales borrados.
- ESTADO FINAL: A–E COMPLETAS Y VERDES. Código `8f40ef4` + docs `d88447c`. SIN PUSHEAR
  (push manual Victor). Migración lista; siguiente trabajo = Gate F (comms Metas) engancha
  sobre esta superficie limpia.
